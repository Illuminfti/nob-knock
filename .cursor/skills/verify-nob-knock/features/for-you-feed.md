# For You feed

For You is the home surface: twenty vertical clips, one active at a time, skip by arrow or swipe, and the address bar tracks the active clip.

## Sub-features

- `feed-load` shows the first catalog clip (`cold-email`, scene "Cold email") as `[data-active="true"]`.
- `feed-skip` moves the active clip on `ArrowDown` / `j` (desktop) or a full-height scroll of `.feed-scroll` (phone).
- `feed-url` writes `/?c=<clip-id>` to match the active `data-clip`.
- `feed-players` keeps at most three `<video>` nodes and at most one playing.

## How to get to it (user POV)

- Open `/` (dock **Home**, header **Knock home**, or "For You").
- Open `/?c=unsubscribe` (or any catalog id) to start on that clip.
- Press `ArrowDown` / `j` or swipe up to skip; `ArrowUp` / `k` or swipe down to go back.

## Driving it with knock-verify

Preconditions:

- Knock is healthy at `http://127.0.0.1:8080/` (or `--url` to :8081 after a build).
- `knock-verify doctor` reports title `Knock` and an active clip.
- Header tab `For You` is current (`data-tab="foryou"`).

- **Land on feed.** Open For You. Run `node .cursor/skills/verify-nob-knock/knock-verify.mjs drive for-you-feed`. The harness waits for `[data-active="true"]`. First clip without `?c=` is `cold-email`.
- **Skip three clips.** The same command runs `scripts/feed-qa.mjs`: desktop presses `ArrowDown` three times; mobile scrolls `.feed-scroll` by one viewport each step. Each step waits until `data-clip` on `[data-active="true"]` changes.
- **URL tracks.** After the last skip, `/?c=` equals the active id.
- **Player cap.** Across samples, `video` count ≤ 3 and playing videos ≤ 1. Failures land in `for-you-feed.json`.
- **Proof.** The drive writes `artifacts/verify-nob-knock/for-you-feed-before.png` (first active clip), `for-you-feed-after.png` (after the QA run), and `for-you-feed.json`. Before must show Cold email / `cold-email`; after plus the JSON must show a different `activeId` and `urlTracksActive: true`.

## Gotchas

- `networkidle` never settles on `npm run dev`. Use `domcontentloaded` + `[data-active="true"]`.
- A `?c=` that is not a catalog id is ignored; the feed still starts on `cold-email`.
- Following with zero likes replaces the feed with "No receipts." — switch back to For You before proving skip.
- `scripts/feed-qa.mjs` opens its own browser. The before screenshot is taken first, then QA, then after — do not treat QA's last clip as still on screen in a new page; the JSON is the skip proof.
- Clips that fail to load show "Held at the door." / "Clip waiting on receipts." That is a missing `public/clips/<id>.mp4`, not a skip bug.
