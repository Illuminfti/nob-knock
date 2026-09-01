# Like and login gate

Like (heart or double-tap) keeps a receipt on file only for a signed-in user. Signed out, Knock sends the user to `/login` to continue with X.

## Sub-features

- `like-signed-out` sending Like while signed out navigates to `/login?c=<clip-id>`.
- `login-copy` shows "Receipts ready." and either **Continue with X** or "Sign-in is held at the door."
- `login-back` "Back to For You" returns to `/` with the same `c` search param.
- `like-signed-in` (auth off / session present) toggles `aria-pressed` on **Like** — only prove this when doctor says sign-in is off or a real session exists.

## How to get to it (user POV)

- Tap **Like** on the clip rail, or double-tap the clip.
- Tap **You** in the dock (signed out) — same `/login` page.
- Open `/login` directly.

## Driving it with knock-verify

Preconditions:

- Doctor has run. Note `authEnabled` from `/__app-env`.
- Default checkout has no `.grok/app-env.json` → sign-in **on**, no session in a fresh browser → Like must gate.
- Do not complete X OAuth in verification unless the user asked; the gate is the product path.

- **Like while signed out.** Run `node .cursor/skills/verify-nob-knock/knock-verify.mjs drive like-and-login-gate`. Click `getByRole("button", { name: "Like" })` on the active clip. The page becomes `/login` with `c` equal to that clip id (usually `cold-email`).
- **Read the door.** Body contains "Receipts ready." If the X button is present, its name is **Continue with X**. If auth UI is held, copy is "Sign-in is held at the door."
- **Back.** Click **Back to For You**. Path is `/` and `c` is preserved.
- **Proof.** `like-and-login-gate-before.png` is the feed with the Like rail; `like-and-login-gate-after.png` is `/login` with "Receipts ready." `like-and-login-gate.json` records `fromClip`, `loginPath`, and button-or-held.

## Gotchas

- When `VITE_AUTH_ENABLED=false`, the app uses a dev user and Like does **not** go to `/login`. Doctor must report that mode; do not treat a staying-on-feed Like as a gate failure.
- Double-tap vs single-tap: a single tap unmutes ("Tap for sound") or pauses ("Held"). Use the **Like** button for a deterministic gate.
- Completing OAuth is a production boundary (X). Do not call the Better Auth API as a substitute for the Like click.
- `/login` is a real route (`src/routes/login.tsx`), not a sheet.
