# Verification record

This is a historical record of how the first implementation was verified on 2026-10-13. It does not describe the current state. Later changes follow [development.md](development.md): a syntax check by default, with UI and interaction tested by the user. Some checks below refer to behaviour that has since changed, such as the character being tied to the paper skin.

## Automated tests at the time

`npm run check`: 21 Node unit tests passed and the build succeeded.

- Character registration, packaged artwork, capability matching, action choice on short captions.
- Caption expression priority, disabled expressions, fallback when artwork is missing.
- Settings normalization, partial changes, concurrent changes from several pages, skin shortcut.
- English word boundaries, contractions and hyphens, video link normalization.
- Concurrent word saves, deduplication, persistence, isolation between videos, deletion, source sentences and the review prompt.
- Translation request sharing, cache isolation between languages, persistence, cache limit, cache clearing.
- Malformed translation responses, HTTP errors, timeout and retry.
- The character during brief caption gaps, falling, sleeping, fading, and stable-geometry detection while captions scroll.
- Composing new actions, expressions interrupting actions, reduced motion, stale animation callbacks.

`scripts/browser-smoke.mjs` loaded the **actual built MV3 extension** in a temporary Chromium profile. The YouTube DOM and the translation responses were fixtures and mocks, so outside videos and network results could not affect the check.

It covered extension injection, image loading, Trusted Types, hover translation and playback resume, protection of a manual pause, exact word clicks, deduplication, closing with the keyboard, the skin shortcut, character switching and capability filtering, vocabulary search and JSON export, restore after reload, single-page navigation, fullscreen, stale translation responses, turning features off, reduced motion, popup settings sync, popup height and the absence of JavaScript errors.

The script has not been kept in step with later changes and refers to controls that no longer exist.

## Optional browser check

The browser check is separate from the normal build. It needs Playwright and a Chromium or Chrome for Testing that can load a local extension:

```sh
npm install --no-save playwright
npx playwright install chromium
node scripts/browser-smoke.mjs
```

With an existing Playwright package and browser, point to them with the `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` environment variables. The check uses a temporary profile and does not touch the user's everyday browser profile.

The screenshots produced by the first run ([settings page](screenshots/options.png), [popup](screenshots/popup.png), [simulated player](screenshots/player-fixture.png)) were inspected visually. They are kept as history and were not retaken after later interface changes.

## Real environments not covered

There was no end-to-end run on a real YouTube video, and the reachability of the Google Translate endpoint was not part of the simulated check. Edge, Shorts, embedded players and caption layouts in other languages were not verified on a real device.

A manual pass on a familiar video: turn on English captions, switch between Paper and the YouTube default and confirm the default matches the extension being off, watch one-line and two-line auto captions scroll, hover over and away from captions, click a word, enter and leave fullscreen, then move to another video.
