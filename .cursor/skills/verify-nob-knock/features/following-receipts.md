# Following receipts

Following (header **Following** or dock **Receipts**) lists clips the user has liked. With none on file it shows an empty state instead of the feed.

## Sub-features

- `following-open` switches the header to Following (`data-tab="following"`).
- `following-empty` shows "No receipts." when the like set is empty.
- `following-empty-copy` tells a signed-out user to sign in, or a signed-in user to like on For You.
- `following-back` **Back to For You** restores the twenty-clip feed.

## How to get to it (user POV)

- Tap **Following** in the header.
- Tap **Receipts** (stamp) in the dock.

## Driving it with knock-verify

Preconditions:

- Fresh browser context (no likes). Signed-out is the default when sign-in is on.
- Start on For You so the empty state is a real tab change, not the first paint.

- **Open Following.** Run `node .cursor/skills/verify-nob-knock/knock-verify.mjs drive following-receipts`. Click `getByRole("button", { name: "Following" })` (header `data-tab="following"`).
- **Empty state.** Visible text includes "No receipts." Signed out: "Sign in with X, then like a clip. Specific asks only." Signed in with no likes: "Like a clip on For You. We will keep it on file."
- **Return.** Click **Back to For You**. `[data-active="true"]` exists again; `data-tab="foryou"` is current.
- **Proof.** `following-receipts-before.png` is For You with an active clip; `following-receipts-after.png` is the empty Following state. JSON records `empty: true` and the copy variant.

## Gotchas

- Dock label is **Receipts**, header label is **Following** — same tab.
- Do not prove a populated Following list without a real like (signed-in session). Seeding likes in the database is not a user path.
- "No receipts match." is search, not this tab.
- Header **Following** is `getByRole("button", { name: "Following" })`, not the dock button.
