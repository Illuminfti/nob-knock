# Knock verification map

This directory is the maintained source for verifying Knock's user-facing behavior. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Knock answers at `http://127.0.0.1:8080/` (dev) unless the recipe says to use the built preview at `http://127.0.0.1:8081/`.
- `npm ci` and `npx playwright install chromium` have been run in this checkout.
- `node .cursor/skills/verify-nob-knock/knock-verify.mjs doctor` is `ok`.
- Clips in `public/clips/` and posters in `public/stills/` are present (twenty catalog rows in `src/lib/feed/catalog.ts`).
- Do not drive a :8080 you do not own if a human is using the live preview. Attach or stop.

## Driving conventions

- Start every recipe from `/` on For You unless the feature file says otherwise.
- Prefer ARIA names, `data-clip`, `data-active`, and `data-tab` over CSS position.
- Treat lever commands as literal. Keep feature ids unchanged.
- Desktop skip uses `ArrowDown`. Phone skip uses a full-height `.feed-scroll` jump (`scripts/feed-qa.mjs` mobile).
- Never wait for `networkidle` (Vite HMR websocket).
- Cleanup must not delete `artifacts/verify-nob-knock/`.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes a screenshot with Knock identity visible (title `Knock`, active clip, or login copy).
- Feed skip proof includes `data-clip` changing and `?c=` matching the new id.
- Record the feature id with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with knock-verify` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [For You feed](./for-you-feed.md) covers the twenty-clip vertical feed, skip, URL tracking, and the three-player cap.
- [Search clips](./search-clips.md) covers the search sheet, query, empty state, and jump-to-clip.
- [Like and login gate](./like-and-login-gate.md) covers Like / double-tap when signed out and the `/login` page.
- [Following receipts](./following-receipts.md) covers the Following tab and empty "No receipts." state.
- [Creator profile](./creator-profile.md) covers the Mike Hawk sheet and jump back to a clip.
