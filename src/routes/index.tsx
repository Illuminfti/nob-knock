import { createFileRoute } from "@tanstack/react-router";
import { Feed } from "@/components/feed/Feed";
import { CLIPS, clipById, clipIndex } from "@/lib/feed/catalog";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    c: typeof search.c === "string" ? search.c : undefined,
  }),
  head: ({ match }) => {
    const start = typeof match.search.c === "string" ? clipById(match.search.c) : undefined;
    const clip = start ?? CLIPS[0];
    if (!clip) return {};
    const next = CLIPS[(clipIndex(clip.id) + 1) % CLIPS.length];
    return {
      links: [
        { rel: "preload", href: clip.poster, as: "image" },
        { rel: "preload", href: clip.src, as: "video", type: "video/mp4" },
        ...(next && next.id !== clip.id
          ? [{ rel: "preload" as const, href: next.poster, as: "image" }]
          : []),
      ],
    };
  },
  component: Home,
});

function Home() {
  const { c } = Route.useSearch();
  return <Feed startId={c} />;
}
