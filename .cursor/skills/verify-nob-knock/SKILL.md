---
name: verify-nob-knock
description: Drive Knock (nob-knock) in a real browser — For You feed, search, likes/login, Following, creator profile. Reach for this when you need to prove UI behavior, not when unit tests or `npm run verify` are enough.
---

# Verify Knock

Knock is a vertical clip feed (TanStack Start + Vite) at `http://127.0.0.1:8080/`. A user watches twenty Mike Hawk clips, skips with arrows or swipe, searches, likes (sign-in gated), and opens the creator sheet. This skill is the scripted way to launch that UI, drive it as a user would, and keep proof.

Read `features/README.md` before driving. Run the lever; do not click around by hand.

## Launch

Default surface: **dev server on :8080** (`npm run dev` → `scripts/with-app-env.mjs vite dev --host 0.0.0.0 --port 8080`). `vite.config.ts` sets `strictPort: true`. Ready when `GET /` returns any HTTP response (CI and `startup.sh` use curl; a 200 HTML document is the usual success). First paint can take ~5–15s while PGLite applies `migrations/*.sql`.

```bash
node .cursor/skills/verify-nob-knock/knock-verify.mjs launch
# same:
npm run verify:ui -- launch
```

- If :8080 already answers, the lever **attaches** and records `attached: true`. It does not steal or restart a foreign owner.
- If :8080 is free, it starts `npm run dev`, writes pids to `.grok/knock-verify-run.json`, and waits (default 90s, `KNOCK_VERIFY_READY_MS`).
- Logs for a lever-started server: `.grok/knock-verify-dev.log`.
- `--dry-run` prints the attach-or-start plan and starts nothing.

A second live instance cannot share :8080. The built-output preview (`npm run preview` / `scripts/preview.mjs`) is a different process on **:8081**. Drive that only when you built first; pass `--url http://127.0.0.1:8081/`. Do not run `preview:stop` unless this run started that preview.

Teardown is **Cleanup**, not a second launch.

## Doctor

Read-only. Run first whenever the instance looks off.

```bash
node .cursor/skills/verify-nob-knock/knock-verify.mjs doctor
```

Worth driving only when every check is `ok`:

- `GET /` is HTTP < 400
- document title is `Knock`
- `[data-active="true"]` exists (active clip; first clip id is `cold-email`)
- Search control (`button` name `Search`) is present
- Chromium via the repo's Playwright is launchable
- Sign-in flag: `GET /__app-env` (dev only). Missing `.grok/app-env.json` means `VITE_AUTH_ENABLED` is unset → **sign-in on** (`src/lib/auth/client.ts`: enabled unless the value is `"false"`). Preview on :8081 has no `/__app-env` — that check is `indeterminate`, not a failure.

Refuse to drive if doctor fails. Fix launch or the port owner first.

## Drive

Harness: **this repo's Playwright** (`playwright` in `devDependencies`), plus the existing feed script. Do not add another browser stack.

```bash
node .cursor/skills/verify-nob-knock/knock-verify.mjs drive for-you-feed
node .cursor/skills/verify-nob-knock/knock-verify.mjs drive --feature search-clips
```

Stable handles (from `src/components/feed/`):

| Handle                                               | Meaning                                  |
| ---------------------------------------------------- | ---------------------------------------- |
| `[data-active="true"]`                               | Current clip slide                       |
| `[data-clip="<id>"]`                                 | Clip id (`cold-email`, `unsubscribe`, …) |
| `.feed-scroll`                                       | Snap scroller (mobile QA scrolls this)   |
| `button[data-tab="foryou"]` / `following`            | Header tabs                              |
| `getByRole("button", { name: "Search" })`            | Opens search                             |
| `getByRole("dialog", { name: "Purpose of visit?" })` | Search sheet                             |
| `getByLabel("Search clips")`                         | Search field                             |
| `getByRole("button", { name: "Like" })`              | Heart on the active rail                 |
| `getByRole("button", { name: "Mike Hawk profile" })` | Creator sheet                            |
| `getByRole("dialog", { name: "Mike Hawk profile" })` | Creator overlay                          |
| `/login`                                             | Sign-in page (`Receipts ready.`)         |

Desktop skip: `ArrowDown` / `j`. Phone skip: scroll `.feed-scroll` by one viewport (`feed-qa.mjs` mobile). Wait until `/?c=` matches `[data-active]` before skipping — the scroll listener attaches in a mount effect. Vite keeps an HMR websocket; never wait for `networkidle`.

`drive for-you-feed` shells to `scripts/feed-qa.mjs` (the CI harness) and captures before/after screenshots in the same run. Other features use Playwright recipes in `knock-verify-drive.mjs`. Recipes live in `features/`. Driving one convenient entry point is incomplete if the map lists others you were asked to prove.

## Evidence

Proof directory (survives cleanup): **`artifacts/verify-nob-knock/`**

```bash
node .cursor/skills/verify-nob-knock/knock-verify.mjs evidence screenshot
node .cursor/skills/verify-nob-knock/knock-verify.mjs evidence verdict
```

`verdict` wraps `scripts/browser-smoke.mjs` (desktop + mobile PNG + JSON). `screenshot` is a single full-page capture of the current URL.

Standards:

- Exercise the real path (feed, sheet, `/login`). Do not set likes through `likeClip` or hit test-only routes.
- Keep **before and after** for a mutation or skip — not only the last frame.
- Side effects: `?c=` tracks `data-clip`; Following empty copy; `/login` after Like when signed out.
- Mocks only at production boundaries that already isolate X OAuth. Do not fake the feed.
- `--dry-run` on evidence prints target paths and writes nothing.

Name files with the feature id: `for-you-feed-before.png`, `for-you-feed-after.png`, `for-you-feed.json`.

## Cleanup

```bash
node .cursor/skills/verify-nob-knock/knock-verify.mjs cleanup
node .cursor/skills/verify-nob-knock/knock-verify.mjs cleanup --dry-run
```

Signals **only pids this run started** (from `.grok/knock-verify-run.json`). Never `pkill vite`. An attach (`startedPids: []`) is a no-op on processes. Deletes the run file and the lever's log, **not** `artifacts/verify-nob-knock/`. After cleanup, the proof files must still be on disk.

`--dry-run` is required to preview a destructive cleanup.

## Helpers

Lever (JSON on stdout, rich `--help`):

```bash
node .cursor/skills/verify-nob-knock/knock-verify.mjs --help
node .cursor/skills/verify-nob-knock/knock-verify.mjs help drive
```

Existing harnesses the lever wraps — call them directly only when debugging the wrap:

```bash
node scripts/feed-qa.mjs http://127.0.0.1:8080/ artifacts/verify-nob-knock/for-you-feed.json
node scripts/browser-smoke.mjs http://127.0.0.1:8080/ artifacts/verify-nob-knock/verdict.png
```

Install once per machine: `npm ci` and `npx playwright install chromium`. Chromium args already used in-repo: `--no-sandbox --disable-dev-shm-usage`.

## Isolation

Two Knock UIs can exist at once: **dev :8080** and **preview :8081**. Two dev servers cannot. If :8080 is up and you did not start it, attach or stop — do not open a second drive against a session you do not own if a human is using the live preview. Prefer the lever's attach + leave-it-running cleanup in that case.

## Maintain

When routes, copy, or selectors change, update the map with `/maintain-verification-skill`.
