import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { NobMark } from "@/components/knock/NobMark";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    c: typeof search.c === "string" ? search.c : undefined,
  }),
  component: Login,
});

function Login() {
  const { c } = Route.useSearch();
  const x = GROK_PROVIDERS.find((provider) => provider.providerId === "grok-x");
  const callbackURL = c ? `/?c=${encodeURIComponent(c)}` : "/";

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-bg px-6 text-fg">
      <img
        src="/stills/mike-full.jpg?v=real10"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top opacity-30"
      />
      <div className="pointer-events-none absolute inset-0 bg-bg/70" />
      <div className="absolute left-5 top-[max(1.25rem,env(safe-area-inset-top))] z-10">
        <Link
          to="/"
          search={{ c }}
          className="t-meta font-medium text-muted transition-opacity duration-150 hover:text-fg"
        >
          Back to For You
        </Link>
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <NobMark className="mb-8" />
        <p className="t-hero text-fg">Receipts ready.</p>
        <p className="mt-4 max-w-[28ch] t-caption leading-relaxed text-pretty text-muted">
          Sign in with X to like a clip. Specific asks only.
        </p>
        {authEnabled && x ? (
          <button
            type="button"
            onClick={() => signIn(x.providerId, { callbackURL })}
            className="hard-shadow sticker mt-8 flex h-12 w-full items-center justify-center gap-2 bg-nob text-sm font-semibold text-ink transition-transform duration-150 ease-[var(--ease-out)] active:translate-x-0.5 active:translate-y-0.5 active:scale-[0.96]"
          >
            <XMark />
            Continue with X
          </button>
        ) : (
          <p className="mt-8 t-caption text-muted">Sign-in is held at the door.</p>
        )}
        <p className="mt-6 t-meta tracking-wide text-muted">Mike Hawk. Nob. Standards held.</p>
      </div>
    </main>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-ink" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.391 6.231H2.756l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
