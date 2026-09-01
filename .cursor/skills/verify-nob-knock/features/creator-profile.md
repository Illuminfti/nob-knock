# Creator profile

The rail avatar opens Mike Hawk's profile sheet: banner, handle, clip grid, and a jump back onto For You.

## Sub-features

- `creator-open` opens the dialog named **Mike Hawk profile**.
- `creator-identity` shows **Mike Hawk**, `@mikehawk`, and "20 clips on file".
- `creator-grid` lists catalog tiles (`Play <scene>`).
- `creator-jump` choosing a tile closes the sheet and activates that clip.

## How to get to it (user POV)

- Tap the circular avatar on the clip rail (name **Mike Hawk profile**).
- From the sheet, tap **Back to For You** (chevron) or a grid tile.

## Driving it with knock-verify

Preconditions:

- For You is showing an active clip; no other overlay is open.

- **Open profile.** Run `node .cursor/skills/verify-nob-knock/knock-verify.mjs drive creator-profile`. Click `getByRole("button", { name: "Mike Hawk profile" })`. Dialog `Mike Hawk profile` is visible; text includes `@mikehawk` and "20 clips on file".
- **Jump.** Click `getByRole("button", { name: "Play Lifehacker" })`. Dialog is gone. `[data-active="true"][data-clip="unsubscribe"]` and `/?c=unsubscribe`.
- **Proof.** `creator-profile-before.png` is the open sheet; `creator-profile-after.png` is the feed on Lifehacker / `unsubscribe`. JSON records `dialog` then `activeId`.

## Gotchas

- The small **+** on the avatar is **Vet**, which only flashes "Well vetted." — that is not the profile sheet.
- Dock **You** is the visitor, not Mike Hawk. Signed out it goes to `/login`.
- Grid **Receipts** tab on the sheet is likes, not the Following dock. With no likes it says "No receipts. Like a clip on For You."
- `aria-label` on tiles is `Play ${clip.scene}` (e.g. `Play Cold email`), not the clip id.
