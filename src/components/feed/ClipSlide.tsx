import { useEffect, useRef, useState, type ReactNode } from "react";
import { Heart, MessageCircle, Plus, Share2, VolumeX } from "lucide-react";
import { ASSET_V, type Clip } from "@/lib/feed/catalog";

type Props = {
  clip: Clip;
  liked: boolean;
  muted: boolean;
  isActive: boolean;
  hot: boolean;
  ahead: boolean;
  onActive: (id: string) => void;
  onToggleMute: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
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

export function ClipSlide({
  clip,
  liked,
  muted,
  isActive,
  hot,
  ahead,
  onActive,
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
  const wasActive = useRef(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [burst, setBurst] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const scroller = node.parentElement;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
          onActive(clip.id);
        }
      },
      { root: scroller, threshold: [0.55, 0.75] },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [clip.id, onActive]);

  useEffect(() => {
    if (!hot) {
      setReady(false);
      setFailed(false);
      setProgress(0);
    }
  }, [hot, clip.id]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || failed || !hot) return;
    el.muted = muted;
    if (isActive && !paused) {
      if (!wasActive.current) {
        try {
          el.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
      wasActive.current = true;
      const tryPlay = () => {
        void el.play().catch(() => undefined);
      };
      if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) tryPlay();
      else el.addEventListener("canplay", tryPlay, { once: true });
      return () => el.removeEventListener("canplay", tryPlay);
    }
    if (!isActive) wasActive.current = false;
    el.pause();
  }, [isActive, muted, paused, failed, hot]);

  useEffect(() => {
    if (!isActive) setPaused(false);
  }, [isActive, clip.id]);

  useEffect(() => {
    if (!isActive) return;
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
  }, [isActive, muted, onToggleMute]);

  useEffect(() => {
    return () => releaseVideo(videoRef.current);
  }, []);

  function onTime() {
    if (!isActive) return;
    const el = videoRef.current;
    if (!el || !el.duration) return;
    setProgress(el.currentTime / el.duration);
  }

  function handleTap() {
    const now = Date.now();
    if (now - lastTap.current < 280 && lastTap.current !== 0) {
      lastTap.current = 0;
      setBurst(true);
      window.setTimeout(() => setBurst(false), 520);
      onLike();
      return;
    }
    const tapId = now;
    lastTap.current = tapId;
    window.setTimeout(() => {
      if (lastTap.current !== tapId) return;
      if (muted) onToggleMute();
      else setPaused((value) => !value);
    }, 270);
  }

  const likeCount = clip.seedLikes + (liked ? 1 : 0);
  const spinning = isActive && !paused && !muted && !failed;

  return (
    <section
      ref={rootRef}
      data-clip={clip.id}
      className="clip-slide relative h-full w-full snap-start snap-always overflow-hidden bg-bg"
    >
      <img
        src={clip.poster}
        alt=""
        decoding="async"
        fetchPriority={isActive || hot ? "high" : "low"}
        loading={hot ? "eager" : "lazy"}
        className={`absolute inset-0 h-full w-full object-cover ${failed ? "poster-drift" : ""}`}
      />
      {hot ? (
        <video
          ref={videoRef}
          className={`clip-video absolute inset-0 h-full w-full object-cover ${ready ? "is-ready" : ""}`}
          src={clip.src}
          playsInline
          loop
          muted={muted}
          autoPlay={isActive}
          preload={isActive || ahead ? "auto" : "metadata"}
          disablePictureInPicture
          onTimeUpdate={onTime}
          onClick={handleTap}
          onPlaying={() => setReady(true)}
          onLoadedData={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      ) : null}

      <div className="video-veil pointer-events-none absolute inset-0" />

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
          onClick={onLike}
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
        <RailButton label="Share" onClick={onShare} ariaLabel="Share">
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
        <div
          className="h-full bg-nob"
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>
    </section>
  );
}

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
