# Caption skins

Read this before touching the paper skin or the switch back to YouTube's own captions.

## Scope

- There are two skins: `off` (YouTube default) and `wa-light` (Paper). Work goes into polishing Paper. Do not add a skin unless the user asks.
- Skins and characters are independent. Any character can be used with either skin.

## Paper skin rules

- Each caption line draws its own paper box. Lines are not merged into one backing panel.
- No gap between lines.
- Compact vertical padding, a small corner radius and a light inner stroke.
- No outer shadow that spreads over the seam between lines.
- Each box keeps the width of its own text.
- Font and font size stay YouTube's.

## YouTube default rules

The default skin must look exactly as it does without the extension.

- Apply none of the extension's typography: no line height, font size, font family, padding or margin.
- When switching back, remove the paper style node and the entrance animation markers.

## How it is built

- `src/features/skins/registry.js` lists the skins. `src/features/skins/skins.css` holds the Paper styles; edit it directly, asset generation never overwrites it.
- The build inlines `skins.css` as a string (see the plugin in `scripts/build.mjs`), so it stays out of the always-loaded `content.css`.
- `src/features/skins/index.js` mounts a `<style data-ytc-caption-skin>` node and sets `data-ytc-skin` on `<html>` only while Paper is selected, and removes both otherwise.
- After a switch it dispatches a `resize` event so the player recalculates caption placement, then refreshes the caption source.
- New captions get a `ytc-enter` class for the entrance effect, removed after 800 ms and cleared on switching away.
- `Alt + Shift + S` cycles skins through the background (`skin:next`) so the read and the write happen in one queued step.
