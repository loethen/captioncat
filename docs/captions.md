# Caption tracking, translation and word collection

Read this before changing how captions are tracked, hover translation, word collection or any overlay inside the player.

## The shared caption source

`src/content/caption-source.js` is the only code that watches the player. Features do not add their own observers.

- One `MutationObserver` on `#movie_player` watches nodes and text. Mutations inside the extension's own overlays are ignored.
- A check every second, plus YouTube's `yt-navigate-finish` event, handles single-page navigation and a replaced player.
- Features call `source.subscribe(listener)` for caption updates and `source.onMount(listener)` for the player element. Listeners are also notified when the text is unchanged, because YouTube may have replaced the caption window.
- `source.geometry(sizeEm)` gives the caption's position in player coordinates, corrected for the player's CSS scale.

The extension reads the caption DOM that YouTube is already showing. It does not download caption tracks or turn captions on.

## Feature shape

`src/content/index.js` creates each feature once and passes it every settings change:

```js
createXFeature(source, notify)   // returns { update(settings), dispose() }
```

`update` must cope with being called repeatedly, and `dispose` must remove every node, listener and timer. `notify(text)` shows a short toast inside the player.

## Overlays

- Append overlays to the player element, so they are visible in fullscreen.
- Mark every overlay root with `data-ytc-overlay`. This is what keeps the caption source from reacting to the extension's own changes.
- Build content with `textContent` and DOM APIs only. YouTube enforces Trusted Types, so `innerHTML` fails.
- Interactive overlays stop their own pointer and key events from reaching the player (`stopPlayerEvents`).

`data-ytc-interactive` is set on `<html>` while hover translation or word collection is enabled. With both off it is removed, which restores YouTube's own pointer behaviour on captions.

## Hover translation

`src/features/translation/index.js`

- Hover counts only over the visible caption text. The caption window is larger than its text, so the pointer is hit-tested against the text segments' rectangles.
- Pause ownership: the feature resumes playback only for a video that it paused itself, and only while the page URL is unchanged. A video the user paused stays paused. Pressing play, a play key, or clicking the player hands ownership back to the user.
- Late responses are dropped: each request has an id, and a response is shown only if it is still the latest and the pointer is still over the caption.
- When the caption changes under a resting pointer, the translation is scheduled again for the new text.
- The request goes to the background worker; the content script never calls the translation endpoint. See [architecture.md](architecture.md).

## Word collection

`src/features/vocabulary/index.js`

- Captions must stay draggable. The feature listens for `click` in the capture phase and leaves pointer down and up to the player. A click that moved more than 4 px from where the pointer went down is treated as a drag and ignored.
- Double-clicks on captions are stopped so they do not toggle fullscreen.
- A click counts only when it lands inside the rectangles of the word itself. Caret APIs return the nearest text even for clicks in padding, so the nearest-word result alone is not enough.
- Words are English only: letters with inner apostrophes or hyphens, at least two characters, stored in lower case (`wordAtOffset` in `src/shared/text.js`).
- Words are grouped by video. `videoContext` accepts `www.youtube.com` watch, Shorts and live URLs and normalizes them to a watch link.

## Not covered

The content script is injected only into `https://www.youtube.com/*` and targets the standard player. Shorts and embedded players have a different caption structure and are unverified.
