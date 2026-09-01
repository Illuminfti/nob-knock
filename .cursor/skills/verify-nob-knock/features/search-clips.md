# Search clips

Search opens a sheet titled "Purpose of visit?" so the user can filter the twenty clips by scene, caption, handle, or id and jump to one.

## Sub-features

- `search-open` opens the sheet from the header Search button.
- `search-match` filters the list as the user types.
- `search-empty` shows "No receipts match." when nothing hits.
- `search-jump` closes the sheet and makes the chosen clip active.

## How to get to it (user POV)

- Tap the Search control (magnifying glass, accessible name **Search**) on the For You header.
- Type a query (placeholder "Name. Purpose of visit.") and tap a row, or submit to jump to the first hit.

## Driving it with knock-verify

Preconditions:

- Knock is healthy at the doctor URL on For You.
- Overlay is closed (no search/creator/you sheet).

- **Open search.** Run `node .cursor/skills/verify-nob-knock/knock-verify.mjs drive search-clips`. The recipe clicks `getByRole("button", { name: "Search" })`. A dialog named `Purpose of visit?` appears with `getByLabel("Search clips")`.
- **Match.** Fill `cold email`. A row for scene **Cold email** remains.
- **Empty.** Replace the query with `volcano`. The list shows "No receipts match."
- **Jump.** Clear, fill `unsubscribe`, click the **Lifehacker** row. The dialog closes. `[data-active="true"]` has `data-clip="unsubscribe"` and the path is `/?c=unsubscribe`.
- **Proof.** `artifacts/verify-nob-knock/search-clips-before.png` is the open sheet with a query; `search-clips-after.png` is the feed on `unsubscribe`. `search-clips.json` records both states.

## Gotchas

- Search is a header button, not a `/search` route. Deep-linking only works after a jump (`?c=`).
- Overlay blocks skip keys. Press `Escape` or the dialog **Close** if a previous run left the sheet open.
- Query is case-insensitive against scene, caption, handle, and id. Assert the scene label or `data-clip`, not pixel position in the list.
- Submit with one hit jumps to that clip; with zero hits it does nothing.
