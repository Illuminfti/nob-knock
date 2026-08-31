import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { Heart, MessageCircle, Plus, Share2, VolumeX } from "lucide-react";
import { ASSET_V, type Clip } from "@/lib/feed/catalog";

type Props = {
  clip: Clip;
  liked: boolean;
  muted: boolean;
  isActive: boolean;
  blocked: boolean;
  hot: boolean;
  ahead: boolean;
  onToggleMute: () => void;
  onLike: (id: string) => void;
  onComment: () => void;
  onShare: (clip: Clip) => void;
  onOpenCreator: () => void;
  onVet: () => void;
};

function formatCount(n: number) {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return k >= 10 ? `${Math.round(k)}K` : `${k.toFixed(1).replace(/\.0$/, "")}K`;
}

function releaseVideo(el: HTMLVideoElement | null) {
  if (!el) return;
  el.pause();
  el.removeAttribute("src");
  el.removeAttribute("autoplay");
  el.load();
}

function ClipSlideComponent({
  clip,
  liked,
  muted,
  isActive,
  blocked,
  hot,
  ahead,
  onToggleMute,
  onLike,
  onComment,
  onShare,
  onOpenCreator,
  onVet,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const lastTap = useRef(0);
  const singleTapTimer = useRef<number>(0);
  const burstTimer = useRef<number>(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const wasActive = useRef(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const [paused, setPaused] = useState(false);
  const [burst, setBurst] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hot) {
      setReady(false);
      setFailed(false);
      if (progressRef.current) progressRef.current.style.transform = "scaleX(0)";
    }
  }, [hot, clip.id]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !hot) return;
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");
    el.playsInline = true;
    el.defaultMuted = true;
  }, [hot, clip.src]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || failed || !hot) return;

    if (!(isActive && !blocked && !paused)) {
      if (!isActive) wasActive.current = false;
      el.pause();
      el.muted = true;
      return;
    }

    if (!wasActive.current) {
      try {
        el.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
    wasActive.current = true;

    let cancelled = false;
    const kick = async () => {
      if (cancelled) return;
      // Always start muted so iOS/Chrome will autoplay after a swipe.
      el.muted = true;
      el.defaultMuted = true;
      try {
        await el.play();
      } catch {
        if (cancelled) return;
        try {
          await el.play();
        } catch {
          return;
        }
      }
      if (cancelled) return;
      if (!mutedRef.current) el.muted = false;
    };

    if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      void kick();
    } else {
      const onReady = () => {
        void kick();
      };
      el.addEventListener("canplay", onReady, { once: true });
      el.addEventListener("loadeddata", onReady, { once: true });
      void kick();
      return () => {
        cancelled = true;
        el.removeEventListener("canplay", onReady);
        el.removeEventListener("loadeddata", onReady);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [isActive, blocked, paused, failed, hot, clip.id]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isActive || el.paused) return;
    el.muted = muted;
  }, [muted, isActive]);

  useEffect(() => {
    if (!isActive) setPaused(false);
  }, [isActive, clip.id]);

  useEffect(() => {
    if (!isActive || blocked || !hot) return;
    const onVisibilityChange = () => {
      const el = videoRef.current;
      if (!el) return;
      if (document.hidden) {
        el.pause();
        return;
      }
      if (paused || failed) return;
      el.muted = true;
      void el
        .play()
        .then(() => {
          if (!mutedRef.current) el.muted = false;
        })
        .catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [isActive, blocked, hot, paused, failed]);

  useEffect(() => {
    if (!isActive || blocked) return;
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        if (muted) onToggleMute();
        else setPaused((value) => !value);
      }
      if (event.key === "m" || event.key === "M") onToggleMute();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isActive, blocked, muted, onToggleMute]);

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      window.clearTimeout(singleTapTimer.current);
      window.clearTimeout(burstTimer.current);
      releaseVideo(video);
    };
  }, [hot]);

  function onTime() {
    if (!isActive) return;
    const el = videoRef.current;
    if (!el || !el.duration || !progressRef.current) return;
    const progress = Math.max(0, Math.min(1, el.currentTime / el.duration));
    progressRef.current.style.transform = `scaleX(${progress})`;
  }

  function handleTap() {
    const now = Date.now();
    if (now - lastTap.current < 280 && lastTap.current !== 0) {
      lastTap.current = 0;
      window.clearTimeout(singleTapTimer.current);
      window.clearTimeout(burstTimer.current);
      setBurst(true);
      burstTimer.current = window.setTimeout(() => setBurst(false), 520);
      onLike(clip.id);
      return;
    }
    const tapId = now;
    lastTap.current = tapId;
    window.clearTimeout(singleTapTimer.current);
    singleTapTimer.current = window.setTimeout(() => {
      if (lastTap.current !== tapId) return;
      if (muted) onToggleMute();
      else setPaused((value) => !value);
    }, 270);
  }

  const likeCount = clip.seedLikes + (liked ? 1 : 0);
  const spinning = isActive && !blocked && !paused && !muted && !failed;

  return (
    <section
      ref={rootRef}
      data-clip={clip.id}
      data-active={isActive ? "true" : undefined}
      aria-label={clip.scene}
      className="clip-slide relative h-full w-full snap-start snap-always overflow-hidden bg-bg"
    >
      <img
        src={clip.poster}
        alt=""
        decoding="async"
        fetchPriority={isActive || hot ? "high" : "low"}
        loading={hot ? "eager" : "lazy"}
        draggable={false}
        className={`clip-poster absolute inset-0 h-full w-full object-cover ${failed ? "poster-drift" : ""}`}
      />
      {hot ? (
        <video
          ref={videoRef}
          className={`clip-video absolute inset-0 h-full w-full object-cover ${ready ? "is-ready" : ""}`}
          src={clip.src}
          playsInline
          loop
          preload={isActive || ahead ? "auto" : "none"}
          disablePictureInPicture
          controls={false}
          onTimeUpdate={onTime}
          onPlaying={() => setReady(true)}
          onLoadedData={() => setReady(true)}
          onCanPlay={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      ) : null}

      <div className="video-veil pointer-events-none absolute inset-0" />
      <div className="absolute inset-0 z-[1]" onClick={handleTap} />

      {burst ? (
        <Heart
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 size-24 -translate-x-1/2 -translate-y-1/2 fill-heart text-heart"
          style={{ animation: "like-burst 520ms var(--ease-out) both" }}
        />
      ) : null}

      {muted && isActive && !paused && !failed ? (
        <button
          type="button"
          onClick={onToggleMute}
          className="absolute left-1/2 top-[42%] z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink/70 px-4 py-2 t-chip text-fg backdrop-blur-sm transition-transform duration-150 ease-[var(--ease-out)] active:scale-[0.96]"
        >
          <VolumeX className="size-4" />
          Tap for sound
        </button>
      ) : null}

      {paused && isActive ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="rounded-full bg-ink/55 px-4 py-2 t-chip text-fg">Held</div>
        </div>
      ) : null}

      {failed && isActive ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 px-8 text-center">
          <p className="font-display text-3xl leading-none text-fg">Held at the door.</p>
          <p className="mt-3 t-caption text-muted">Clip waiting on receipts.</p>
        </div>
      ) : null}

      <div className="rail-stack z-10 flex flex-col items-center gap-4">
        <div className="relative mb-1">
          <button
            type="button"
            onClick={onOpenCreator}
            className="tap grid place-items-center"
            aria-label={`${clip.displayName} profile`}
          >
            <img
              src={`/stills/mike-avatar.png?v=${ASSET_V}`}
              alt=""
              className="h-12 w-12 rounded-full object-cover object-top ring-2 ring-fg"
            />
          </button>
          <button
            type="button"
            onClick={onVet}
            className="absolute -bottom-1.5 left-1/2 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-nob text-ink"
            aria-label="Vet"
          >
            <Plus className="size-3.5 stroke-[3]" />
          </button>
        </div>
        <RailButton
          label={formatCount(likeCount)}
          active={liked}
          onClick={() => onLike(clip.id)}
          ariaLabel="Like"
        >
          <Heart
            className={`size-7 transition-transform duration-150 ease-[var(--ease-out)] ${
              liked ? "fill-heart text-heart scale-110" : "fill-fg text-fg"
            }`}
          />
        </RailButton>
        <RailButton label="Ask" onClick={onComment} ariaLabel="Ask">
          <MessageCircle className="size-7 fill-fg text-fg" />
        </RailButton>
        <RailButton label="Share" onClick={() => onShare(clip)} ariaLabel="Share">
          <Share2 className="size-6 text-fg" />
        </RailButton>
        <button
          type="button"
          onClick={onToggleMute}
          className="tap relative mt-1 grid place-items-center"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <span className={`disc ${spinning ? "disc-spin" : "disc-paused"}`}>
            <img src="/pin.png" alt="" className="h-full w-full object-cover" />
          </span>
          <span
            className={`pointer-events-none absolute inset-0 grid place-items-center rounded-full bg-ink/55 transition-opacity duration-[var(--motion-fast)] ease-[var(--ease-out)] ${
              muted ? "opacity-100" : "opacity-0"
            }`}
          >
            <VolumeX className="size-3.5 text-fg" />
          </span>
        </button>
      </div>

      <div className="caption-block z-10 pr-20">
        <p className="t-handle text-fg">@{clip.handle}</p>
        <p className="mt-1 max-w-[34ch] t-caption text-pretty text-fg">{clip.caption}</p>
        <p className="sound-line mt-2 text-cream">
          <span className="sound-marquee">{clip.sound} · {clip.sound}</span>
        </p>
      </div>

      <div className="progress-track z-20">
        <div ref={progressRef} className="clip-progress h-full bg-nob" />
      </div>
    </section>
  );
}

export const ClipSlide = memo(ClipSlideComponent);

function RailButton({
  label,
  active,
  onClick,
  ariaLabel,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className="tap flex flex-col items-center justify-center gap-1 text-fg transition-transform duration-150 ease-[var(--ease-out)] active:scale-[0.96]"
    >
      {children}
      <span className={`t-rail ${active ? "text-heart" : "text-fg"}`}>{label}</span>
    </button>
  );
}
