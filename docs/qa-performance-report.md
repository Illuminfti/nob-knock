# QA and performance control plane

This branch turns the feed's performance claims into enforced invariants.

## Runtime changes

- Active-clip URL updates use the History API instead of asking TanStack Router to rerender the route and head on every swipe.
- Clip slides are memoized and receive stable callbacks, so a swipe updates the hot window rather than all twenty slides.
- Video progress writes directly to a compositor transform instead of scheduling React renders and layout work throughout playback.
- Opening a sheet pauses the active player without discarding its position. Background tabs pause media and resume safely.
- One auth session subscription feeds both the main feed and dock. Likes do not fetch while auth is unresolved.
- Like mutations are serialized per clip so rapid taps cannot complete out of order.
- Slide paint/layout is contained, pinch zoom remains available, and feedback/sheets have explicit accessibility semantics.

## Automated gates

The Quality workflow now runs:

1. clean dependency installation from the lockfile
2. auth invariant check
3. TypeScript
4. ESLint with zero warnings
5. unit tests, including media-window edge cases
6. production build and immutable-media budget checks
7. desktop and mobile browser smoke tests
8. feed interaction QA across three consecutive clip changes

The feed QA gate asserts that the URL follows the active clip, no more than three video elements exist, no more than one plays, clips advance in both desktop and touch contexts, horizontal overflow is absent, and browser errors remain at zero. It also records layout-shift and long-task observations as build artifacts.

## Asset budgets

- exactly 20 MP4 clips
- every MP4 has its `moov` atom before `mdat` for fast-start streaming
- no clip above 11 MiB
- all clips together below 110 MiB
- no still above 256 KiB
- all stills together below 4 MiB

The budget script also reports the largest gzip-compressed JavaScript and CSS outputs so future PRs have comparable bundle evidence.
