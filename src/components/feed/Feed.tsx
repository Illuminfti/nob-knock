import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { House, MessageCircle, Plus, Search, Stamp, X } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CLIPS, type Clip } from "@/lib/feed/catalog";
import { likeClip, listMyLikes, unlikeClip } from "@/lib/feed/likes";
import { isAhead, indexFromScroll, wantsPlayer } from "@/lib/feed/media";
import { NobMark } from "@/components/knock/NobMark";
import { AuthSlot } from "./AuthSlot";
import { ClipSlide } from "./ClipSlide";
import { CreatorSheet } from "./CreatorSheet";

type Tab = "foryou" | "following";
type Overlay = "search" | "creator" | "you" | null;

export function Feed({ startId }: { startId?: string }) {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lastWheel = useRef(0);
  const stampTimer = useRef<number>(0);
  const toastTimer = useRef<number>(0);
  const overlayRef = useRef<Overlay>(null);
  const [tab, setTab] = useState<Tab>("foryou");
  const [muted, setMuted] = useState(true);
  const [activeId, setActiveId] = useState(
    startId && CLIPS.some((c) => c.id === startId) ? startId : (CLIPS[0]?.id ?? ""),
  );
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const likedRef = useRef(liked);
  const likeQueues = useRef(new Map<string, Promise<void>>());
  const likeVersions = useRef(new Map<string, number>());
  likedRef.current = liked;
  const [stamp, setStamp] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  overlayRef.current = overlay;

  useEffect(() => {
    if (isPending) return;
    let cancelled = false;
    if (!userId) {
      setLiked(new Set());
      return;
    }
    void listMyLikes()
      .then((ids) => {
        if (!cancelled) setLiked(new Set(ids));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isPending, userId]);

  useEffect(() => {
    return () => {
      window.clearTimeout(stampTimer.current);
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  const following = useMemo(
    () => CLIPS.filter((clip) => liked.has(clip.id)),
    [liked],
  );
  const clips: Clip[] = tab === "following" ? following : CLIPS;
  const activeIndex = Math.max(0, clips.findIndex((clip) => clip.id === activeId));
  const activeIdRef = useRef(activeId);
  const clipsRef = useRef(clips);
  activeIdRef.current = activeId;
  clipsRef.current = clips;

  const didHonorStart = useRef(false);
  const ignorePick = useRef(false);

  const scrollToId = useCallback((id: string) => {
    const root = scrollerRef.current;
    const list = clipsRef.current;
    if (!root || !list.length) return false;
    const idx = list.findIndex((clip) => clip.id === id);
    if (idx < 0) return false;
    const height = root.clientHeight;
    ignorePick.current = true;
    if (height) root.scrollTo({ top: idx * height, behavior: "instant" });
    setActiveId(id);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ignorePick.current = false;
      });
    });
    return true;
  }, []);

  useEffect(() => {
    if (clips.length === 0) {
      if (activeIdRef.current) setActiveId("");
      return;
    }
    if (clips.some((clip) => clip.id === activeIdRef.current)) return;
    scrollToId(clips[0]!.id);
  }, [clips, scrollToId]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    let raf = 0;
    const pick = () => {
      raf = 0;
      if (overlayRef.current || ignorePick.current) return;
      const list = clipsRef.current;
      const idx = indexFromScroll(root.scrollTop, root.clientHeight, list.length);
      const id = list[idx]?.id;
      if (id && id !== activeIdRef.current) setActiveId(id);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    root.addEventListener("scrollend", pick);
    const onTouchEnd = () => {
      pick();
      window.setTimeout(pick, 80);
      window.setTimeout(pick, 220);
    };
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      root.removeEventListener("scroll", onScroll);
      root.removeEventListener("scrollend", pick);
      root.removeEventListener("touchend", onTouchEnd);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!startId) return;
    if (!didHonorStart.current) {
      scrollToId(startId);
      requestAnimationFrame(() => scrollToId(startId));
      didHonorStart.current = true;
      return;
    }
    if (startId === activeIdRef.current) return;
    scrollToId(startId);
    // Inbound URL only. Our own replace updates already match activeId.
  }, [startId, scrollToId]);

  useEffect(() => {
    if (!activeId || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.pathname === "/" && url.searchParams.get("c") === activeId) return;
    url.pathname = "/";
    url.searchParams.set("c", activeId);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [activeId]);

  const lastForYouId = useRef(activeId);
  const didMountTab = useRef(false);

  useEffect(() => {
    if (tab === "foryou" && activeId) lastForYouId.current = activeId;
  }, [tab, activeId]);

  useEffect(() => {
    if (!didMountTab.current) {
      didMountTab.current = true;
      return;
    }
    const root = scrollerRef.current;
    if (!root) return;
    if (tab === "foryou" && lastForYouId.current) {
      scrollToId(lastForYouId.current);
      return;
    }
    scrollerRef.current?.scrollTo({ top: 0, behavior: "instant" });
    setActiveId(clipsRef.current[0]?.id ?? "");
  }, [tab, scrollToId]);

  const skip = useCallback(
    (dir: 1 | -1) => {
      const list = clipsRef.current;
      if (!list.length) return;
      const idx = Math.max(0, list.findIndex((clip) => clip.id === activeIdRef.current));
      let next = idx + dir;
      if (next < 0) next = list.length - 1;
      if (next >= list.length) next = 0;
      const target = list[next];
      if (target) scrollToId(target.id);
    },
    [scrollToId],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (overlayRef.current) {
        if (event.key === "Escape") setOverlay(null);
        return;
      }
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === "ArrowDown" || event.key === "j") {
        event.preventDefault();
        skip(1);
      }
      if (event.key === "ArrowUp" || event.key === "k") {
        event.preventDefault();
        skip(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip]);

  useEffect(() => {
    function onWheel(event: WheelEvent) {
      if (overlayRef.current) return;
      if (Math.abs(event.deltaY) < 18) return;
      event.preventDefault();
      const now = Date.now();
      if (now - lastWheel.current < 360) return;
      lastWheel.current = now;
      skip(event.deltaY > 0 ? 1 : -1);
    }
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [skip]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const drag = { y: 0, x: 0, t: 0, live: false, scroll: 0 };
    let swiped = false;

    const onDown = (event: PointerEvent) => {
      if (overlayRef.current) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const hit = event.target as HTMLElement | null;
      if (hit?.closest("button, a, input, textarea")) return;
      const box = event.currentTarget as HTMLDivElement;
      drag.y = event.clientY;
      drag.x = event.clientX;
      drag.t = Date.now();
      drag.scroll = box.scrollTop;
      drag.live = true;
      swiped = false;
      try {
        box.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onUp = (event: PointerEvent) => {
      if (!drag.live) return;
      drag.live = false;
      const box = event.currentTarget as HTMLDivElement;
      const dy = drag.y - event.clientY;
      const dx = drag.x - event.clientX;
      const dt = Date.now() - drag.t;
      if (Math.abs(box.scrollTop - drag.scroll) > 24) return;
      if (Math.abs(dy) < Math.abs(dx) * 1.15) return;
      const flick = Math.abs(dy) > 32 && dt < 360;
      const pull = Math.abs(dy) > 64;
      if (!flick && !pull) return;
      swiped = true;
      skip(dy > 0 ? 1 : -1);
    };

    const onClick = (event: MouseEvent) => {
      if (!swiped) return;
      event.preventDefault();
      event.stopPropagation();
      swiped = false;
    };

    const onCancel = () => {
      drag.live = false;
      swiped = false;
    };

    const onDragStart = (event: DragEvent) => {
      event.preventDefault();
    };

    node.addEventListener("pointerdown", onDown);
    node.addEventListener("pointerup", onUp);
    node.addEventListener("pointercancel", onCancel);
    node.addEventListener("click", onClick, true);
    node.addEventListener("dragstart", onDragStart);
    return () => {
      node.removeEventListener("pointerdown", onDown);
      node.removeEventListener("pointerup", onUp);
      node.removeEventListener("pointercancel", onCancel);
      node.removeEventListener("click", onClick, true);
      node.removeEventListener("dragstart", onDragStart);
    };
  }, [skip]);

  const requireUser = useCallback(
    (clipId?: string) => {
      if (isPending) return false;
      if (!user) {
        void navigate({
          to: "/login",
          search: { c: clipId ?? activeIdRef.current },
        });
        return false;
      }
      return true;
    },
    [isPending, user, navigate],
  );

  const toggleLike = useCallback(
    (id: string) => {
      if (!requireUser(id)) return;
      const before = likedRef.current;
      const wasLiked = before.has(id);
      const next = new Set(before);
      if (wasLiked) next.delete(id);
      else next.add(id);
      likedRef.current = next;
      setLiked(next);

      const version = (likeVersions.current.get(id) ?? 0) + 1;
      likeVersions.current.set(id, version);
      const previous = likeQueues.current.get(id) ?? Promise.resolve();
      const task = previous
        .then(async () => {
          if (wasLiked) await unlikeClip({ data: id });
          else await likeClip({ data: id });
        })
        .catch(() => {
          if (likeVersions.current.get(id) !== version) return;
          const current = new Set(likedRef.current);
          if (wasLiked) current.add(id);
          else current.delete(id);
          likedRef.current = current;
          setLiked(current);
          void navigate({ to: "/login", search: { c: id } });
        });
      likeQueues.current.set(id, task);
      void task.finally(() => {
        if (likeQueues.current.get(id) === task) likeQueues.current.delete(id);
      });
    },
    [navigate, requireUser],
  );

  const flashStamp = useCallback((text: string) => {
    window.clearTimeout(stampTimer.current);
    setStamp(text);
    stampTimer.current = window.setTimeout(() => setStamp(null), 1400);
  }, []);

  const flashToast = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = window.setTimeout(() => setToast(null), 1600);
  }, []);

  const onShare = useCallback(
    async (clip: Clip) => {
      const url = `${window.location.origin}/?c=${clip.id}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: "Knock", text: clip.caption, url });
          return;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
      try {
        await navigator.clipboard.writeText(url);
        flashToast("Link copied. You may enter.");
      } catch {
        flashToast("Held at the door.");
      }
    },
    [flashToast],
  );

  const toggleMute = useCallback(() => setMuted((value) => !value), []);
  const openCreator = useCallback(() => setOverlay("creator"), []);
  const handleComment = useCallback(
    () => flashStamp("SPECIFIC ASKS ONLY"),
    [flashStamp],
  );
  const handleVet = useCallback(() => flashStamp("Well vetted."), [flashStamp]);

  function goHome() {
    setOverlay(null);
    setTab("foryou");
  }

  function jumpTo(id: string) {
    setOverlay(null);
    setTab("foryou");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToId(id);
      });
    });
  }

  const laterClip = clips[activeIndex + 1];

  return (
    <div className="relative grid h-dvh place-items-center overflow-hidden bg-bg text-fg">
      {laterClip ? <link rel="preload" as="image" href={laterClip.poster} /> : null}

      <aside className="pointer-events-none absolute top-1/2 left-8 hidden max-w-[11rem] -translate-y-1/2 xl:block">
        <p className="font-display text-5xl leading-none tracking-tight text-balance">Knock</p>
        <p className="mt-4 t-caption text-muted">Mike Hawk. For You.</p>
        <p className="mt-6 t-meta text-muted">
          {clips.length ? `${activeIndex + 1} of ${clips.length}.` : "No receipts."}
        </p>
      </aside>
      <aside className="pointer-events-none absolute top-1/2 right-8 hidden max-w-[10rem] -translate-y-1/2 text-right xl:block">
        <p className="t-meta text-muted">Arrows skip.</p>
        <p className="mt-2 t-meta text-muted">Space holds. M mutes.</p>
      </aside>

      <div className="phone-shell feed-stage">
        <header className="feed-header pointer-events-none absolute inset-x-0 top-0 z-30">
          <div className="relative flex h-12 items-center justify-between px-3">
            <button
              type="button"
              onClick={goHome}
              className="pointer-events-auto z-10 tap -ml-1 grid place-items-center overflow-visible"
              aria-label="Knock home"
            >
              <NobMark compact />
            </button>
            <div className="pointer-events-auto absolute inset-x-14 flex items-center justify-center gap-4">
              <TabBtn
                active={tab === "following"}
                onClick={() => {
                  setOverlay(null);
                  setTab("following");
                }}
                name="following"
              >
                Following
              </TabBtn>
              <TabBtn
                active={tab === "foryou"}
                onClick={() => {
                  setOverlay(null);
                  setTab("foryou");
                }}
                name="foryou"
              >
                For You
              </TabBtn>
            </div>
            <button
              type="button"
              onClick={() => setOverlay((value) => (value === "search" ? null : "search"))}
              className="pointer-events-auto z-10 tap grid place-items-center text-fg"
              aria-label="Search"
            >
              <Search className="size-6" />
            </button>
          </div>
        </header>

        <div ref={scrollerRef} className="feed-scroll h-full overflow-y-scroll snap-y snap-mandatory">
          {clips.length === 0 ? (
            <EmptyFollowing
              signedIn={Boolean(user)}
              onBrowse={() => setTab("foryou")}
            />
          ) : (
            clips.map((clip, index) => (
              <ClipSlide
                key={clip.id}
                clip={clip}
                liked={liked.has(clip.id)}
                muted={muted}
                isActive={activeId === clip.id}
                blocked={overlay !== null}
                hot={wantsPlayer(index, activeIndex, clips.length)}
                ahead={isAhead(index, activeIndex, clips.length)}
                onToggleMute={toggleMute}
                onLike={toggleLike}
                onComment={handleComment}
                onShare={onShare}
                onOpenCreator={openCreator}
                onVet={handleVet}
              />
            ))
          )}
        </div>

        <nav className="feed-dock z-30" aria-label="Knock">
          <DockItem
            active={tab === "foryou" && !overlay}
            label="Home"
            onClick={goHome}
          >
            <House className={`size-6 ${tab === "foryou" && !overlay ? "fill-fg" : ""}`} />
          </DockItem>
          <DockItem
            active={tab === "following" && !overlay}
            label="Receipts"
            onClick={() => {
              setOverlay(null);
              setTab("following");
            }}
          >
            <Stamp className="size-6" />
          </DockItem>
          <button
            type="button"
            onClick={() => flashStamp("Held at the door.")}
            className="tap hard-shadow sticker grid size-11 place-items-center bg-nob text-ink transition-transform duration-150 ease-[var(--ease-out)] active:scale-[0.96]"
            aria-label="New clip"
          >
            <Plus className="size-6 stroke-[2.5]" />
          </button>
          <DockItem
            active={false}
            label="Ask"
            onClick={() => flashStamp("SPECIFIC ASKS ONLY")}
          >
            <MessageCircle className="size-6" />
          </DockItem>
          <AuthSlot
            clipId={activeId}
            user={user}
            isPending={isPending}
            onOpen={() => setOverlay("you")}
          />
        </nav>

        {overlay === "search" ? (
          <SearchSheet
            clips={CLIPS}
            onJump={jumpTo}
            onClose={() => setOverlay(null)}
          />
        ) : null}
        {overlay === "creator" ? (
          <CreatorSheet liked={liked} onJump={jumpTo} onClose={() => setOverlay(null)} />
        ) : null}
        {overlay === "you" && user ? (
          <YouSheet
            name={user.displayName ?? "You"}
            imageUrl={user.profileImageUrl}
            receipts={liked.size}
            onSignOut={() => void signOut().catch(() => undefined)}
            onClose={() => setOverlay(null)}
          />
        ) : null}

        {stamp ? (
          <div
            className="pointer-events-none absolute inset-0 z-50 grid place-items-center"
            role="status"
            aria-live="polite"
          >
            <div
              className="hard-shadow sticker border-[3px] border-heart bg-paper px-5 py-3 text-center font-display text-3xl tracking-tight text-heart"
              style={{ animation: "stamp-in 280ms var(--ease-out) both" }}
            >
              {stamp}
            </div>
          </div>
        ) : null}

        {toast ? (
          <div
            className="absolute inset-x-0 bottom-[calc(var(--dock-total)+0.75rem)] z-50 flex justify-center px-4"
            role="status"
            aria-live="polite"
          >
            <div
              className="rounded-full bg-cream px-4 py-2 t-meta font-medium text-ink"
              style={{ animation: "toast-in 180ms var(--ease-out) both" }}
            >
              {toast}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  name,
  children,
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-tab={name}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative tap-y px-1.5 text-sm font-semibold ${active ? "text-fg" : "text-muted"}`}
    >
      {children}
      <span
        className={`absolute inset-x-1 -bottom-1 h-[3px] rounded-full bg-fg transition-opacity duration-[var(--motion-quick)] ease-[var(--ease-out)] ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
    </button>
  );
}

function DockItem({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap dock-item ${active ? "text-fg" : "text-muted"}`}
    >
      {children}
      <span className="t-dock">{label}</span>
    </button>
  );
}

function EmptyFollowing({
  signedIn,
  onBrowse,
}: {
  signedIn: boolean;
  onBrowse: () => void;
}) {
  return (
    <section className="grid h-full place-items-center px-8 text-center">
      <div>
        <p className="font-display text-4xl leading-none text-fg">No receipts.</p>
        <p className="mt-4 max-w-[28ch] t-caption leading-relaxed text-pretty text-muted">
          {signedIn
            ? "Like a clip on For You. We will keep it on file."
            : "Sign in with X, then like a clip. Specific asks only."}
        </p>
        <button
          type="button"
          onClick={onBrowse}
          className="hard-shadow sticker mt-8 h-11 px-5 bg-nob t-chip text-ink transition-transform duration-150 ease-[var(--ease-out)] active:scale-[0.96]"
        >
          Back to For You
        </button>
      </div>
    </section>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="sheet-panel z-40 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="feed-header flex h-12 shrink-0 items-center justify-between px-4">
        <p className="font-display text-2xl leading-none text-fg">{title}</p>
        <button
          type="button"
          onClick={onClose}
          className="tap grid place-items-center text-fg"
          aria-label="Close"
        >
          <X className="size-6" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
    </div>
  );
}

function SearchSheet({
  clips,
  onJump,
  onClose,
}: {
  clips: Clip[];
  onJump: (id: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const hits = query
    ? clips.filter((clip) =>
        `${clip.scene} ${clip.caption} ${clip.handle} ${clip.id}`.toLowerCase().includes(query),
      )
    : clips;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (hits[0]) onJump(hits[0].id);
  }

  return (
    <Sheet title="Purpose of visit?" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <input
          autoFocus
          value={q}
          onChange={(event) => setQ(event.target.value)}
          aria-label="Search clips"
          placeholder="Name. Purpose of visit."
          className="mt-2 h-11 w-full rounded-full bg-fg/12 px-4 t-caption text-fg outline-none ring-1 ring-fg/20 placeholder:text-muted"
        />
      </form>
      <ul className="mt-4 space-y-1">
        {hits.length === 0 ? (
          <li className="px-2 py-6 text-center t-caption text-muted">No receipts match.</li>
        ) : (
          hits.map((clip) => (
            <li key={clip.id}>
              <button
                type="button"
                onClick={() => onJump(clip.id)}
                className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors duration-150 ease-[var(--ease-out)] hover:bg-fg/10"
              >
                <img
                  src={clip.poster}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-14 w-10 shrink-0 rounded-md object-cover object-top"
                />
                <span>
                  <span className="block t-handle text-fg">{clip.scene}</span>
                  <span className="mt-0.5 block t-meta text-muted">{clip.caption}</span>
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </Sheet>
  );
}

function YouSheet({
  name,
  imageUrl,
  receipts,
  onSignOut,
  onClose,
}: {
  name: string;
  imageUrl?: string | null;
  receipts: number;
  onSignOut: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet title="You" onClose={onClose}>
      <div className="flex flex-col items-center pt-6 text-center">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-24 w-24 rounded-full object-cover ring-2 ring-fg/40" />
        ) : (
          <span className="grid h-24 w-24 place-items-center rounded-full bg-nob font-display text-4xl text-ink">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <p className="mt-4 font-display text-3xl leading-none text-fg">{name}</p>
        <p className="mt-3 t-caption text-muted">
          {receipts} {receipts === 1 ? "receipt" : "receipts"} on file.
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="hard-shadow sticker mt-8 h-11 px-5 bg-nob t-chip text-ink transition-transform duration-150 ease-[var(--ease-out)] active:scale-[0.96]"
        >
          Sign out
        </button>
      </div>
    </Sheet>
  );
}
