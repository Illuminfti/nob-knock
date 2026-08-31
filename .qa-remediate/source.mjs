import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const changed = new Set();

function read(path) {
  return readFileSync(path, "utf8");
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  changed.add(path);
}

function replaceOnce(path, before, after, label = before.slice(0, 80)) {
  const source = read(path);
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`${path}: missing transform target: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`${path}: transform target is not unique: ${label}`);
  }
  write(path, source.slice(0, first) + after + source.slice(first + before.length));
}

function replaceRegex(path, pattern, replacement, label) {
  const source = read(path);
  const matches = [...source.matchAll(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`))];
  if (matches.length !== 1) {
    throw new Error(`${path}: expected one ${label}, found ${matches.length}`);
  }
  write(path, source.replace(pattern, replacement));
}

// Feed orchestration: avoid router work on every swipe, eliminate duplicate auth
// subscriptions, make like mutations race-safe, and stabilize slide props.
replaceOnce(
  "src/components/feed/Feed.tsx",
  `  const [liked, setLiked] = useState<Set<string>>(new Set());\n  const [stamp, setStamp] = useState<string | null>(null);`,
  `  const [liked, setLiked] = useState<Set<string>>(new Set());\n  const likedRef = useRef(liked);\n  const likeQueues = useRef(new Map<string, Promise<void>>());\n  const likeVersions = useRef(new Map<string, number>());\n  likedRef.current = liked;\n  const [stamp, setStamp] = useState<string | null>(null);`,
  "liked state",
);

replaceOnce(
  "src/components/feed/Feed.tsx",
  `  useEffect(() => {\n    void listMyLikes()\n      .then((ids) => setLiked(new Set(ids)))\n      .catch(() => undefined);\n  }, [user?.id]);`,
  `  useEffect(() => {\n    if (isPending) return;\n    let cancelled = false;\n    if (!user) {\n      setLiked(new Set());\n      return;\n    }\n    void listMyLikes()\n      .then((ids) => {\n        if (!cancelled) setLiked(new Set(ids));\n      })\n      .catch(() => undefined);\n    return () => {\n      cancelled = true;\n    };\n  }, [isPending, user?.id]);`,
  "likes loading effect",
);

replaceOnce(
  "src/components/feed/Feed.tsx",
  `    return true;\n  }, []);\n\n  useEffect(() => {\n    const root = scrollerRef.current;`,
  `    return true;\n  }, []);\n\n  useEffect(() => {\n    if (clips.length === 0) {\n      if (activeIdRef.current) setActiveId("");\n      return;\n    }\n    if (clips.some((clip) => clip.id === activeIdRef.current)) return;\n    scrollToId(clips[0]!.id);\n  }, [clips, scrollToId]);\n\n  useEffect(() => {\n    const root = scrollerRef.current;`,
  "active clip reconciliation",
);

replaceOnce(
  "src/components/feed/Feed.tsx",
  `  useEffect(() => {\n    if (!activeId) return;\n    void navigate({ to: "/", search: { c: activeId }, replace: true });\n  }, [activeId, navigate]);`,
  `  useEffect(() => {\n    if (!activeId || typeof window === "undefined") return;\n    const url = new URL(window.location.href);\n    if (url.pathname === "/" && url.searchParams.get("c") === activeId) return;\n    url.pathname = "/";\n    url.searchParams.set("c", activeId);\n    window.history.replaceState(\n      window.history.state,\n      "",\n      \`\${url.pathname}\${url.search}\${url.hash}\`,\n    );\n  }, [activeId]);`,
  "active clip URL sync",
);

replaceOnce(
  "src/components/feed/Feed.tsx",
  `    scrollerRef.current?.scrollTo({ top: 0, behavior: "instant" });\n    setActiveId(clips[0]?.id ?? "");\n  }, [tab, scrollToId]);`,
  `    scrollerRef.current?.scrollTo({ top: 0, behavior: "instant" });\n    setActiveId(clipsRef.current[0]?.id ?? "");\n  }, [tab, scrollToId]);`,
  "tab reset",
);

replaceOnce(
  "src/components/feed/Feed.tsx",
  `      if (now - lastWheel.current < 480) return;`,
  `      if (now - lastWheel.current < 360) return;`,
  "wheel debounce",
);

replaceOnce(
  "src/components/feed/Feed.tsx",
  `    const onDragStart = (event: DragEvent) => {\n      event.preventDefault();\n    };`,
  `    const onCancel = () => {\n      drag.live = false;\n      swiped = false;\n    };\n\n    const onDragStart = (event: DragEvent) => {\n      event.preventDefault();\n    };`,
  "pointer cancellation",
);
replaceOnce(
  "src/components/feed/Feed.tsx",
  `    node.addEventListener("pointercancel", onUp);`,
  `    node.addEventListener("pointercancel", onCancel);`,
  "pointercancel listener",
);
replaceOnce(
  "src/components/feed/Feed.tsx",
  `      node.removeEventListener("pointercancel", onUp);`,
  `      node.removeEventListener("pointercancel", onCancel);`,
  "pointercancel cleanup",
);

replaceOnce(
  "src/components/feed/Feed.tsx",
  `  const requireUser = useCallback(() => {\n    if (isPending) return false;\n    if (!user) {\n      void navigate({ to: "/login", search: { c: activeId } });\n      return false;\n    }\n    return true;\n  }, [isPending, user, navigate, activeId]);`,
  `  const requireUser = useCallback(\n    (clipId?: string) => {\n      if (isPending) return false;\n      if (!user) {\n        void navigate({\n          to: "/login",\n          search: { c: clipId ?? activeIdRef.current },\n        });\n        return false;\n      }\n      return true;\n    },\n    [isPending, user, navigate],\n  );`,
  "auth requirement",
);

replaceRegex(
  "src/components/feed/Feed.tsx",
  /  async function toggleLike\(id: string\) \{[\s\S]*?\n  \}\n\n  function flashStamp/,
  `  const toggleLike = useCallback(\n    (id: string) => {\n      if (!requireUser(id)) return;\n      const before = likedRef.current;\n      const wasLiked = before.has(id);\n      const next = new Set(before);\n      if (wasLiked) next.delete(id);\n      else next.add(id);\n      likedRef.current = next;\n      setLiked(next);\n\n      const version = (likeVersions.current.get(id) ?? 0) + 1;\n      likeVersions.current.set(id, version);\n      const previous = likeQueues.current.get(id) ?? Promise.resolve();\n      const task = previous\n        .then(async () => {\n          if (wasLiked) await unlikeClip({ data: id });\n          else await likeClip({ data: id });\n        })\n        .catch(() => {\n          if (likeVersions.current.get(id) !== version) return;\n          const current = new Set(likedRef.current);\n          if (wasLiked) current.add(id);\n          else current.delete(id);\n          likedRef.current = current;\n          setLiked(current);\n          void navigate({ to: "/login", search: { c: id } });\n        });\n      likeQueues.current.set(id, task);\n      void task.finally(() => {\n        if (likeQueues.current.get(id) === task) likeQueues.current.delete(id);\n      });\n    },\n    [navigate, requireUser],\n  );\n\n  function flashStamp`,
  "optimistic like mutation",
);

replaceOnce(
  "src/components/feed/Feed.tsx",
  `  function flashStamp(text: string) {\n    window.clearTimeout(stampTimer.current);\n    setStamp(text);\n    stampTimer.current = window.setTimeout(() => setStamp(null), 1400);\n  }\n\n  function flashToast(text: string) {\n    window.clearTimeout(toastTimer.current);\n    setToast(text);\n    toastTimer.current = window.setTimeout(() => setToast(null), 1600);\n  }`,
  `  const flashStamp = useCallback((text: string) => {\n    window.clearTimeout(stampTimer.current);\n    setStamp(text);\n    stampTimer.current = window.setTimeout(() => setStamp(null), 1400);\n  }, []);\n\n  const flashToast = useCallback((text: string) => {\n    window.clearTimeout(toastTimer.current);\n    setToast(text);\n    toastTimer.current = window.setTimeout(() => setToast(null), 1600);\n  }, []);`,
  "stable feedback callbacks",
);

replaceRegex(
  "src/components/feed/Feed.tsx",
  /  async function onShare\(clip: Clip\) \{[\s\S]*?\n  \}\n\n  function goHome/,
  `  const onShare = useCallback(\n    async (clip: Clip) => {\n      const url = \`\${window.location.origin}/?c=\${clip.id}\`;\n      try {\n        if (navigator.share) {\n          await navigator.share({ title: "Knock", text: clip.caption, url });\n          return;\n        }\n      } catch (error) {\n        if (error instanceof DOMException && error.name === "AbortError") return;\n      }\n      try {\n        await navigator.clipboard.writeText(url);\n        flashToast("Link copied. You may enter.");\n      } catch {\n        flashToast("Held at the door.");\n      }\n    },\n    [flashToast],\n  );\n\n  const toggleMute = useCallback(() => setMuted((value) => !value), []);\n  const openCreator = useCallback(() => setOverlay("creator"), []);\n  const handleComment = useCallback(\n    () => flashStamp("SPECIFIC ASKS ONLY"),\n    [flashStamp],\n  );\n  const handleVet = useCallback(() => flashStamp("Well vetted."), [flashStamp]);\n\n  function goHome`,
  "share handler",
);

replaceOnce(
  "src/components/feed/Feed.tsx",
  `                isActive={activeId === clip.id}\n                hot={wantsPlayer(index, activeIndex, clips.length)}\n                ahead={isAhead(index, activeIndex, clips.length)}\n                onToggleMute={() => setMuted((value) => !value)}\n                onLike={() => void toggleLike(clip.id)}\n                onComment={() => flashStamp("SPECIFIC ASKS ONLY")}\n                onShare={() => void onShare(clip)}\n                onOpenCreator={() => setOverlay("creator")}\n                onVet={() => flashStamp("Well vetted.")}`,
  `                isActive={activeId === clip.id}\n                blocked={overlay !== null}\n                hot={wantsPlayer(index, activeIndex, clips.length)}\n                ahead={isAhead(index, activeIndex, clips.length)}\n                onToggleMute={toggleMute}\n                onLike={toggleLike}\n                onComment={handleComment}\n                onShare={onShare}\n                onOpenCreator={openCreator}\n                onVet={handleVet}`,
  "stable slide props",
);

replaceOnce(
  "src/components/feed/Feed.tsx",
  `          <AuthSlot clipId={activeId} onOpen={() => setOverlay("you")} />`,
  `          <AuthSlot\n            clipId={activeId}\n            user={user}\n            isPending={isPending}\n            onOpen={() => setOverlay("you")}\n          />`,
  "auth slot props",
);

replaceOnce(
  "src/components/feed/Feed.tsx",
  `    <div className="sheet-panel z-40 flex flex-col">`,
  `    <div\n      className="sheet-panel z-40 flex flex-col"\n      role="dialog"\n      aria-modal="true"\n      aria-label={title}\n    >`,
  "sheet dialog semantics",
);
replaceOnce(
  "src/components/feed/Feed.tsx",
  `          placeholder="Name. Purpose of visit."`,
  `          aria-label="Search clips"\n          placeholder="Name. Purpose of visit."`,
  "search label",
);
replaceOnce(
  "src/components/feed/Feed.tsx",
  `          <div className="pointer-events-none absolute inset-0 z-50 grid place-items-center">`,
  `          <div\n            className="pointer-events-none absolute inset-0 z-50 grid place-items-center"\n            role="status"\n            aria-live="polite"\n          >`,
  "stamp live region",
);
replaceOnce(
  "src/components/feed/Feed.tsx",
  `          <div className="absolute inset-x-0 bottom-[calc(var(--dock-total)+0.75rem)] z-50 flex justify-center px-4">`,
  `          <div\n            className="absolute inset-x-0 bottom-[calc(var(--dock-total)+0.75rem)] z-50 flex justify-center px-4"\n            role="status"\n            aria-live="polite"\n          >`,
  "toast live region",
);

// Use circular distance so both directions are warm at the first/last boundary.
replaceOnce(
  "src/lib/feed/media.ts",
  `export function wantsPlayer(index: number, activeIndex: number, length: number) {\n  if (length <= 0) return false;\n  if (Math.abs(index - activeIndex) <= PLAYER_RADIUS) return true;\n  return activeIndex === length - 1 && index === 0;\n}`,
  `export function wantsPlayer(index: number, activeIndex: number, length: number) {\n  if (length <= 0) return false;\n  const directDistance = Math.abs(index - activeIndex);\n  const circularDistance = Math.min(directDistance, length - directDistance);\n  return circularDistance <= PLAYER_RADIUS;\n}`,
  "circular player window",
);

// Slide rendering: memoize stable slides and move progress updates outside React.
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `import { useEffect, useRef, useState, type ReactNode } from "react";`,
  `import { memo, useEffect, useRef, useState, type ReactNode } from "react";`,
  "React memo import",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `  isActive: boolean;\n  hot: boolean;`,
  `  isActive: boolean;\n  blocked: boolean;\n  hot: boolean;`,
  "blocked prop type",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `  onLike: () => void;\n  onComment: () => void;\n  onShare: () => void;`,
  `  onLike: (id: string) => void;\n  onComment: () => void;\n  onShare: (clip: Clip) => void;`,
  "stable callback prop types",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `export function ClipSlide({`,
  `function ClipSlideComponent({`,
  "component declaration",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `  isActive,\n  hot,`,
  `  isActive,\n  blocked,\n  hot,`,
  "blocked prop destructure",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `  const lastTap = useRef(0);\n  const wasActive = useRef(false);`,
  `  const lastTap = useRef(0);\n  const singleTapTimer = useRef<number>(0);\n  const burstTimer = useRef<number>(0);\n  const progressRef = useRef<HTMLDivElement>(null);\n  const wasActive = useRef(false);`,
  "interaction refs",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `  const [paused, setPaused] = useState(false);\n  const [progress, setProgress] = useState(0);\n  const [burst, setBurst] = useState(false);`,
  `  const [paused, setPaused] = useState(false);\n  const [burst, setBurst] = useState(false);`,
  "progress state removal",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `      setFailed(false);\n      setProgress(0);`,
  `      setFailed(false);\n      if (progressRef.current) progressRef.current.style.transform = "scaleX(0)";`,
  "progress reset",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `    if (!(isActive && !paused)) {`,
  `    if (!(isActive && !blocked && !paused)) {`,
  "playback blocking",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `  }, [isActive, paused, failed, hot, clip.id]);`,
  `  }, [isActive, blocked, paused, failed, hot, clip.id]);`,
  "playback dependencies",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `  useEffect(() => {\n    if (!isActive) setPaused(false);\n  }, [isActive, clip.id]);`,
  `  useEffect(() => {\n    if (!isActive) setPaused(false);\n  }, [isActive, clip.id]);\n\n  useEffect(() => {\n    if (!isActive || blocked || !hot) return;\n    const onVisibilityChange = () => {\n      const el = videoRef.current;\n      if (!el) return;\n      if (document.hidden) {\n        el.pause();\n        return;\n      }\n      if (paused || failed) return;\n      el.muted = true;\n      void el\n        .play()\n        .then(() => {\n          if (!mutedRef.current) el.muted = false;\n        })\n        .catch(() => undefined);\n    };\n    document.addEventListener("visibilitychange", onVisibilityChange);\n    return () => document.removeEventListener("visibilitychange", onVisibilityChange);\n  }, [isActive, blocked, hot, paused, failed]);`,
  "visibility playback",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `    if (!isActive) return;\n    function onKey(event: KeyboardEvent) {`,
  `    if (!isActive || blocked) return;\n    function onKey(event: KeyboardEvent) {`,
  "blocked keyboard",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `  }, [isActive, muted, onToggleMute]);`,
  `  }, [isActive, blocked, muted, onToggleMute]);`,
  "keyboard dependencies",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `  useEffect(() => {\n    return () => releaseVideo(videoRef.current);\n  }, []);`,
  `  useEffect(() => {\n    return () => {\n      window.clearTimeout(singleTapTimer.current);\n      window.clearTimeout(burstTimer.current);\n      releaseVideo(videoRef.current);\n    };\n  }, []);`,
  "slide cleanup",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `  function onTime() {\n    if (!isActive) return;\n    const el = videoRef.current;\n    if (!el || !el.duration) return;\n    setProgress(el.currentTime / el.duration);\n  }`,
  `  function onTime() {\n    if (!isActive) return;\n    const el = videoRef.current;\n    if (!el || !el.duration || !progressRef.current) return;\n    const progress = Math.max(0, Math.min(1, el.currentTime / el.duration));\n    progressRef.current.style.transform = \`scaleX(${progress})\`;\n  }`,
  "direct progress updates",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `      setBurst(true);\n      window.setTimeout(() => setBurst(false), 520);\n      onLike();`,
  `      window.clearTimeout(singleTapTimer.current);\n      window.clearTimeout(burstTimer.current);\n      setBurst(true);\n      burstTimer.current = window.setTimeout(() => setBurst(false), 520);\n      onLike(clip.id);`,
  "double tap",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `    window.setTimeout(() => {\n      if (lastTap.current !== tapId) return;\n      if (muted) onToggleMute();\n      else setPaused((value) => !value);\n    }, 270);`,
  `    window.clearTimeout(singleTapTimer.current);\n    singleTapTimer.current = window.setTimeout(() => {\n      if (lastTap.current !== tapId) return;\n      if (muted) onToggleMute();\n      else setPaused((value) => !value);\n    }, 270);`,
  "single tap timer",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `  const spinning = isActive && !paused && !muted && !failed;`,
  `  const spinning = isActive && !blocked && !paused && !muted && !failed;`,
  "disc animation blocking",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `      data-clip={clip.id}\n      className=`,
  `      data-clip={clip.id}\n      data-active={isActive ? "true" : undefined}\n      aria-label={clip.scene}\n      className=`,
  "active slide marker",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `          onClick={onLike}\n          ariaLabel="Like"`,
  `          onClick={() => onLike(clip.id)}\n          ariaLabel="Like"`,
  "like rail callback",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `        <RailButton label="Share" onClick={onShare} ariaLabel="Share">`,
  `        <RailButton label="Share" onClick={() => onShare(clip)} ariaLabel="Share">`,
  "share rail callback",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `        <div\n          className="h-full bg-nob"\n          style={{ width: \`${Math.min(100, progress * 100)}%\` }}\n        />`,
  `        <div ref={progressRef} className="clip-progress h-full bg-nob" />`,
  "progress bar",
);
replaceOnce(
  "src/components/feed/ClipSlide.tsx",
  `}\n\nfunction RailButton({`,
  `}\n\nexport const ClipSlide = memo(ClipSlideComponent);\n\nfunction RailButton({`,
  "memoized export",
);

// AuthSlot consumes the already-resolved session from Feed rather than opening a
// second Better Auth subscription.
replaceOnce(
  "src/components/feed/AuthSlot.tsx",
  `import { useCurrentUserState } from "@/lib/auth/use-current-user";`,
  `import type { AppUser } from "@/lib/auth/use-current-user";`,
  "AuthSlot user import",
);
replaceOnce(
  "src/components/feed/AuthSlot.tsx",
  `  onOpen,\n}: {\n  clipId?: string;\n  onOpen?: () => void;\n}) {\n  const { user, isPending } = useCurrentUserState();`,
  `  user,\n  isPending,\n  onOpen,\n}: {\n  clipId?: string;\n  user: AppUser | null;\n  isPending: boolean;\n  onOpen?: () => void;\n}) {`,
  "AuthSlot props",
);

// Contain slide painting, preserve pinch zoom, and animate progress on the
// compositor instead of forcing layout on every media timeupdate.
replaceOnce(
  "src/styles.css",
  `  touch-action: pan-y;`,
  `  touch-action: pan-y pinch-zoom;`,
  "pinch zoom",
);
replaceOnce(
  "src/styles.css",
  `.clip-slide {\n  height: 100%;`,
  `.clip-slide {\n  contain: layout paint style;\n  height: 100%;`,
  "slide containment",
);
replaceOnce(
  "src/styles.css",
  `.clip-video {\n  opacity: 0;`,
  `.clip-video {\n  opacity: 0;\n  will-change: opacity;`,
  "video compositor hint",
);
replaceOnce(
  "src/styles.css",
  `.disc {\n  display: block;`,
  `.clip-progress {\n  transform: scaleX(0);\n  transform-origin: left center;\n  will-change: transform;\n}\n\n.disc {\n  display: block;`,
  "composited progress",
);

// Pause the profile sheet's background semantics and expose it as a modal.
replaceOnce(
  "src/components/feed/CreatorSheet.tsx",
  `    <div className="sheet-panel z-40 flex flex-col bg-bg">`,
  `    <div\n      className="sheet-panel z-40 flex flex-col bg-bg"\n      role="dialog"\n      aria-modal="true"\n      aria-label="Mike Hawk profile"\n    >`,
  "creator dialog semantics",
);

// Reject arbitrary IDs at the server boundary and filter legacy junk rows.
replaceOnce(
  "src/lib/feed/catalog.ts",
  `export function clipById(id: string) {`,
  `const CLIP_IDS = new Set(CLIPS.map((clip) => clip.id));\n\nexport function isClipId(value: unknown): value is string {\n  return typeof value === "string" && CLIP_IDS.has(value);\n}\n\nexport function clipById(id: string) {`,
  "clip ID guard",
);
replaceOnce(
  "src/lib/feed/likes.ts",
  `import { authMiddleware } from "@/lib/auth/middleware";`,
  `import { authMiddleware } from "@/lib/auth/middleware";\nimport { isClipId } from "@/lib/feed/catalog";`,
  "likes clip guard import",
);
replaceOnce(
  "src/lib/feed/likes.ts",
  `    return rows.map((row) => row.clip_id);`,
  `    return rows.map((row) => row.clip_id).filter(isClipId);`,
  "filter stored clip IDs",
);
{
  const path = "src/lib/feed/likes.ts";
  const target = `.validator((clipId: string) => clipId)`;
  const source = read(path);
  const count = source.split(target).length - 1;
  if (count !== 2) throw new Error(`${path}: expected two clip validators, found ${count}`);
  write(
    path,
    source.replaceAll(
      target,
      `.validator((clipId: unknown) => {\n    if (!isClipId(clipId)) throw new Error("Unknown clip");\n    return clipId;\n  })`,
    ),
  );
}

// Package scripts are edited structurally so the lockfile repair can be handled
// by npm rather than by brittle text surgery.
{
  const path = "package.json";
  const pkg = JSON.parse(read(path));
  pkg.scripts.test =
    "node --test 'scripts/**/*.test.mjs' && node --experimental-strip-types --test src/lib/app-data/app-data.test.ts src/lib/auth/gate-identity.test.ts src/lib/feed/media.test.ts";
  pkg.scripts["qa:feed"] = "node scripts/feed-qa.mjs";
  pkg.scripts["perf:budget"] = "node scripts/performance-budget.mjs";
  pkg.scripts.verify =
    "npm run check:auth && npm run typecheck && npm run lint -- --max-warnings=0 && npm test && npm run build && npm run perf:budget";
  write(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

write(
  "src/lib/feed/media.test.ts",
  `import assert from "node:assert/strict";\nimport test from "node:test";\nimport { indexFromScroll, isAhead, wantsPlayer } from "./media.ts";\n\ntest("keeps only the active clip and immediate neighbours warm", () => {\n  assert.equal(wantsPlayer(4, 5, 20), true);\n  assert.equal(wantsPlayer(5, 5, 20), true);\n  assert.equal(wantsPlayer(6, 5, 20), true);\n  assert.equal(wantsPlayer(7, 5, 20), false);\n});\n\ntest("warms both sides of the first/last boundary", () => {\n  assert.equal(wantsPlayer(0, 19, 20), true);\n  assert.equal(wantsPlayer(19, 0, 20), true);\n  assert.equal(isAhead(0, 19, 20), true);\n});\n\ntest("marks exactly the next clip as ahead", () => {\n  assert.equal(isAhead(6, 5, 20), true);\n  assert.equal(isAhead(4, 5, 20), false);\n  assert.equal(isAhead(5, 5, 20), false);\n});\n\ntest("maps scroll positions to a clamped snap index", () => {\n  assert.equal(indexFromScroll(-50, 800, 20), 0);\n  assert.equal(indexFromScroll(410, 800, 20), 1);\n  assert.equal(indexFromScroll(99_999, 800, 20), 19);\n  assert.equal(indexFromScroll(100, 0, 20), 0);\n});\n`,
);

write(
  "scripts/feed-qa.mjs",
  `#!/usr/bin/env node\nimport { mkdirSync, writeFileSync } from "node:fs";\nimport { dirname } from "node:path";\nimport { chromium } from "playwright";\n\nconst url = process.argv[2] || "http://127.0.0.1:8081/";\nconst output = process.argv[3] || "/workspace/screenshots/feed-qa.json";\nconst cases = [\n  { name: "desktop", viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false },\n  { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },\n];\n\nmkdirSync(dirname(output), { recursive: true });\nconst browser = await chromium.launch({\n  headless: true,\n  args: ["--no-sandbox", "--disable-dev-shm-usage"],\n});\nconst report = { url, cases: {}, failures: [] };\n\ntry {\n  for (const spec of cases) {\n    const context = await browser.newContext({\n      viewport: spec.viewport,\n      isMobile: spec.isMobile,\n      hasTouch: spec.hasTouch,\n      reducedMotion: "no-preference",\n    });\n    const page = await context.newPage();\n    const consoleErrors = [];\n    const pageErrors = [];\n    page.on("console", (message) => {\n      if (message.type() === "error") consoleErrors.push(message.text());\n    });\n    page.on("pageerror", (error) => pageErrors.push(String(error?.message || error)));\n\n    await page.addInitScript(() => {\n      window.__knockMetrics = { cls: 0, longTasks: [] };\n      try {\n        new PerformanceObserver((list) => {\n          for (const entry of list.getEntries()) {\n            if (!entry.hadRecentInput) window.__knockMetrics.cls += entry.value;\n          }\n        }).observe({ type: "layout-shift", buffered: true });\n      } catch {}\n      try {\n        new PerformanceObserver((list) => {\n          for (const entry of list.getEntries()) {\n            window.__knockMetrics.longTasks.push(Math.round(entry.duration));\n          }\n        }).observe({ type: "longtask", buffered: true });\n      } catch {}\n    });\n\n    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });\n    await page.waitForSelector('[data-active="true"]', { timeout: 15_000 });\n    await page.waitForTimeout(900);\n\n    const sample = async () =>\n      page.evaluate(() => {\n        const active = document.querySelector('[data-active="true"]');\n        const videos = [...document.querySelectorAll("video")];\n        const root = document.documentElement;\n        const resources = performance\n          .getEntriesByType("resource")\n          .filter((entry) => entry.name.includes("/clips/"));\n        return {\n          activeId: active?.getAttribute("data-clip") || null,\n          videoCount: videos.length,\n          playingVideos: videos.filter((video) => !video.paused && !video.ended).length,\n          horizontalOverflow: root.scrollWidth > root.clientWidth + 1,\n          domNodes: document.querySelectorAll("*").length,\n          clipRequests: resources.length,\n          url: location.href,\n        };\n      });\n\n    const initial = await sample();\n    const observed = [initial];\n    for (let step = 0; step < 3; step += 1) {\n      const previousId = observed.at(-1).activeId;\n      if (spec.isMobile) {\n        await page.locator(".feed-scroll").evaluate((element) => {\n          element.scrollTo({ top: element.scrollTop + element.clientHeight, behavior: "instant" });\n        });\n      } else {\n        await page.keyboard.press("ArrowDown");\n      }\n      await page.waitForFunction(\n        (id) => document.querySelector('[data-active="true"]')?.getAttribute("data-clip") !== id,\n        previousId,\n        { timeout: 8_000 },\n      );\n      await page.waitForTimeout(350);\n      observed.push(await sample());\n    }\n\n    const final = observed.at(-1);\n    const currentParam = new URL(final.url).searchParams.get("c");\n    const assertions = {\n      status200: response?.status() === 200,\n      activeChanged: new Set(observed.map((entry) => entry.activeId)).size === observed.length,\n      maxThreePlayers: Math.max(...observed.map((entry) => entry.videoCount)) <= 3,\n      atMostOnePlaying: Math.max(...observed.map((entry) => entry.playingVideos)) <= 1,\n      noHorizontalOverflow: observed.every((entry) => !entry.horizontalOverflow),\n      urlTracksActive: currentParam === final.activeId,\n      noConsoleErrors: consoleErrors.length === 0,\n      noPageErrors: pageErrors.length === 0,\n    };\n    const metrics = await page.evaluate(() => window.__knockMetrics || null);\n    report.cases[spec.name] = { assertions, observed, metrics, consoleErrors, pageErrors };\n    for (const [name, passed] of Object.entries(assertions)) {\n      if (!passed) report.failures.push(\`${spec.name}: ${name}\`);\n    }\n    await context.close();\n  }\n} finally {\n  await browser.close();\n}\n\nwriteFileSync(output, JSON.stringify(report, null, 2));\nconsole.log(JSON.stringify(report, null, 2));\nif (report.failures.length) process.exitCode = 1;\n`,
);

write(
  "scripts/performance-budget.mjs",
  `#!/usr/bin/env node\nimport { gzipSync } from "node:zlib";\nimport { existsSync, readFileSync, readdirSync, statSync } from "node:fs";\nimport { extname, join, relative } from "node:path";\n\nconst MiB = 1024 * 1024;\nconst limits = {\n  maxClip: 11 * MiB,\n  totalClips: 110 * MiB,\n  maxPoster: 256 * 1024,\n  totalPosters: 4 * MiB,\n};\n\nfunction filesUnder(root) {\n  if (!existsSync(root)) return [];\n  const output = [];\n  const visit = (directory) => {\n    for (const entry of readdirSync(directory, { withFileTypes: true })) {\n      const path = join(directory, entry.name);\n      if (entry.isDirectory()) visit(path);\n      else output.push(path);\n    }\n  };\n  visit(root);\n  return output;\n}\n\nfunction total(files) {\n  return files.reduce((sum, file) => sum + statSync(file).size, 0);\n}\n\nconst clips = filesUnder("public/clips").filter((file) => extname(file) === ".mp4");\nconst posters = filesUnder("public/stills").filter((file) => /\\.(?:jpe?g|png|webp)$/i.test(file));\nconst failures = [];\n\nif (clips.length !== 20) failures.push(\`expected 20 clips, found ${clips.length}\`);\nfor (const clip of clips) {\n  const bytes = readFileSync(clip);\n  const moov = bytes.indexOf(Buffer.from("moov"));\n  const mdat = bytes.indexOf(Buffer.from("mdat"));\n  if (moov < 0 || mdat < 0 || moov > mdat) {\n    failures.push(\`${clip}: moov atom is not ahead of media data (not fast-start)\`);\n  }\n  if (bytes.length > limits.maxClip) {\n    failures.push(\`${clip}: ${(bytes.length / MiB).toFixed(2)} MiB exceeds 11 MiB\`);\n  }\n}\nif (total(clips) > limits.totalClips) {\n  failures.push(\`clips total ${(total(clips) / MiB).toFixed(2)} MiB exceeds 110 MiB\`);\n}\nfor (const poster of posters) {\n  const bytes = statSync(poster).size;\n  if (bytes > limits.maxPoster) {\n    failures.push(\`${poster}: ${(bytes / 1024).toFixed(1)} KiB exceeds 256 KiB\`);\n  }\n}\nif (total(posters) > limits.totalPosters) {\n  failures.push(\`posters total ${(total(posters) / MiB).toFixed(2)} MiB exceeds 4 MiB\`);\n}\n\nconst buildRoot = [".output/public", "dist", ".vercel/output/static"].find(existsSync);\nconst buildAssets = buildRoot\n  ? filesUnder(buildRoot).filter((file) => /\\.(?:js|css)$/i.test(file))\n  : [];\nconst buildReport = buildAssets\n  .map((file) => {\n    const bytes = readFileSync(file);\n    return {\n      file: relative(buildRoot, file),\n      rawBytes: bytes.length,\n      gzipBytes: gzipSync(bytes).length,\n    };\n  })\n  .sort((a, b) => b.gzipBytes - a.gzipBytes);\n\nconst report = {\n  clips: { count: clips.length, bytes: total(clips) },\n  posters: { count: posters.length, bytes: total(posters) },\n  buildRoot: buildRoot || null,\n  largestBuildAssets: buildReport.slice(0, 15),\n  failures,\n};\nconsole.log(JSON.stringify(report, null, 2));\nif (failures.length) process.exitCode = 1;\n`,
);

write(
  "docs/qa-performance-report.md",
  `# QA and performance control plane\n\nThis branch turns the feed's performance claims into enforced invariants.\n\n## Runtime changes\n\n- Active-clip URL updates use the History API instead of asking TanStack Router to rerender the route and head on every swipe.\n- Clip slides are memoized and receive stable callbacks, so a swipe updates the hot window rather than all twenty slides.\n- Video progress writes directly to a compositor transform instead of scheduling React renders and layout work throughout playback.\n- Opening a sheet pauses the active player without discarding its position. Background tabs pause media and resume safely.\n- One auth session subscription feeds both the main feed and dock. Likes do not fetch while auth is unresolved.\n- Like mutations are serialized per clip so rapid taps cannot complete out of order.\n- Slide paint/layout is contained, pinch zoom remains available, and feedback/sheets have explicit accessibility semantics.\n\n## Automated gates\n\nThe Quality workflow now runs:\n\n1. clean dependency installation from the lockfile\n2. auth invariant check\n3. TypeScript\n4. ESLint with zero warnings\n5. unit tests, including media-window edge cases\n6. production build and immutable-media budget checks\n7. desktop and mobile browser smoke tests\n8. feed interaction QA across three consecutive clip changes\n\nThe feed QA gate asserts that the URL follows the active clip, no more than three video elements exist, no more than one plays, clips advance in both desktop and touch contexts, horizontal overflow is absent, and browser errors remain at zero. It also records layout-shift and long-task observations as build artifacts.\n\n## Asset budgets\n\n- exactly 20 MP4 clips\n- every MP4 has its \`moov\` atom before \`mdat\` for fast-start streaming\n- no clip above 11 MiB\n- all clips together below 110 MiB\n- no still above 256 KiB\n- all stills together below 4 MiB\n\nThe budget script also reports the largest gzip-compressed JavaScript and CSS outputs so future PRs have comparable bundle evidence.\n`,
);

console.log(`Applied QA remediation to ${changed.size} files:`);
for (const path of [...changed].sort()) console.log(`- ${path}`);
