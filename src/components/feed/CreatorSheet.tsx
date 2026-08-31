import { useMemo, useState } from "react";
import { ChevronLeft, Grid3x3, Heart, Stamp } from "lucide-react";
import { ASSET_V, CLIPS, type Clip } from "@/lib/feed/catalog";

function formatCount(n: number) {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return k >= 10 ? `${Math.round(k)}K` : `${k.toFixed(1).replace(/\.0$/, "")}K`;
}

export function CreatorSheet({
  liked,
  onJump,
  onClose,
}: {
  liked: Set<string>;
  onJump: (id: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"clips" | "receipts">("clips");
  const totalLikes = useMemo(
    () => CLIPS.reduce((sum, clip) => sum + clip.seedLikes, 0),
    [],
  );
  const shown: Clip[] = tab === "clips" ? CLIPS : CLIPS.filter((clip) => liked.has(clip.id));

  return (
    <div
      className="sheet-panel z-40 flex flex-col bg-bg"
      role="dialog"
      aria-modal="true"
      aria-label="Mike Hawk profile"
    >
      <div className="feed-header relative z-10 flex h-12 shrink-0 items-center justify-between px-2">
        <button
          type="button"
          onClick={onClose}
          className="tap grid place-items-center text-fg"
          aria-label="Back to For You"
        >
          <ChevronLeft className="size-6" />
        </button>
        <p className="t-handle text-fg">@mikehawk</p>
        <span className="grid size-11 place-items-center" aria-hidden>
          <Stamp className="size-5 text-muted" />
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative">
          <img
            src={`/stills/mike-full.jpg?v=${ASSET_V}`}
            alt=""
            className="profile-banner"
          />
          <div className="profile-banner-veil pointer-events-none absolute inset-0" />
          <img
            src={`/stills/mike-avatar.png?v=${ASSET_V}`}
            alt=""
            className="absolute bottom-0 left-4 size-[4.5rem] translate-y-1/2 rounded-full object-cover object-top ring-2 ring-nob"
          />
        </div>

        <div className="px-4 pt-12 pb-3">
          <p className="font-display text-3xl leading-none text-fg">Mike Hawk</p>
          <p className="mt-1 t-handle text-muted">@mikehawk · the door</p>
          <p className="mt-3 max-w-[34ch] t-caption leading-relaxed text-pretty text-muted">
            A tiny, judgmental doorman, on camera. Standards held. Specific asks only.
          </p>

          <div className="mt-4 flex items-end gap-6">
            <Stat value="1" label="following" />
            <Stat value="12" label="remain" />
            <Stat value={formatCount(totalLikes)} label="likes" />
          </div>

          <p className="mt-3 t-meta text-cream">{CLIPS.length} clips on file</p>
        </div>

        <div className="flex border-b border-fg/10">
          <ProfileTab
            active={tab === "clips"}
            onClick={() => setTab("clips")}
            label="Clips"
          >
            <Grid3x3 className="size-5" />
          </ProfileTab>
          <ProfileTab
            active={tab === "receipts"}
            onClick={() => setTab("receipts")}
            label="Receipts"
          >
            <Heart className={`size-5 ${tab === "receipts" ? "fill-fg" : ""}`} />
          </ProfileTab>
        </div>

        {shown.length === 0 ? (
          <p className="px-6 py-12 text-center t-caption text-muted">
            No receipts. Like a clip on For You. We will keep it on file.
          </p>
        ) : (
          <div className="profile-grid">
            {shown.map((clip, index) => (
              <button
                key={clip.id}
                type="button"
                onClick={() => onJump(clip.id)}
                className="profile-tile tap"
                aria-label={`Play ${clip.scene}`}
              >
                <img
                  src={clip.poster}
                  alt=""
                  loading={index < 6 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover object-top"
                />
                <span className="profile-tile-meta t-rail">
                  <Heart className="size-3 fill-fg text-fg" />
                  {formatCount(clip.seedLikes + (liked.has(clip.id) ? 1 : 0))}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="t-handle tabular-nums text-fg">{value}</p>
      <p className="t-meta text-muted">{label}</p>
    </div>
  );
}

function ProfileTab({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className={`relative flex h-11 flex-1 items-center justify-center ${
        active ? "text-fg" : "text-muted"
      }`}
    >
      {children}
      <span
        className={`absolute inset-x-8 bottom-0 h-[2px] bg-fg transition-opacity duration-[var(--motion-quick)] ease-[var(--ease-out)] ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
    </button>
  );
}
