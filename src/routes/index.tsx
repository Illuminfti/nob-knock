import { createFileRoute } from "@tanstack/react-router";
import { Feed } from "@/components/feed/Feed";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    c: typeof search.c === "string" ? search.c : undefined,
  }),
  component: Home,
});

function Home() {
  const { c } = Route.useSearch();
  return <Feed startId={c} />;
}
