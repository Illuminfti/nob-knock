import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center text-fg">
      <div>
        <p className="font-display text-5xl leading-none">Denied.</p>
        <p className="mx-auto mt-4 max-w-md t-caption text-pretty break-words text-muted">
          {error.message || "An unexpected error occurred. Try reloading the page."}
        </p>
        <Link
          to="/"
          search={{ c: undefined }}
          className="hard-shadow sticker mt-8 inline-flex h-11 items-center px-5 bg-nob t-chip text-ink"
        >
          Back to For You
        </Link>
      </div>
    </main>
  );
}
