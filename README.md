# CaptionCat

**Make captions more fun.** (Chinese name: 字幕猫, "让字幕更有意思")

A Manifest V3 browser extension that dresses up YouTube captions with a paper skin and a small pixel cat that lives on them. Hover translation and one-click word saving come along as extras. It targets Chrome and Edge (Chromium 120+); the name leaves room for other video sites later.

The interface is available in English and Simplified Chinese.

## Install

`dist/` and `release/` are build outputs and are not in the repository, so build first.

```sh
npm ci
npm run build
```

1. Open `chrome://extensions` in Chrome, or `edge://extensions` in Edge.
2. Turn on Developer mode, choose "Load unpacked" and select the **`dist` folder**.
3. Refresh YouTube and turn on captions for a video.
4. Click the CaptionCat toolbar icon to change the skin and the character. Hover translation, word saving and everything else are on the settings page ("Settings & vocabulary").

The extension is not published to a store yet.

## Features

- **Caption skins.** YouTube's own look, or Paper: each caption line gets its own paper box. Font and size stay as set in YouTube. `Alt + Shift + S` switches between the two.
- **A caption character.** Erhei, a pixel black cat, strolls along the captions, licks its paws, chases a red dot, pushes a cup off the edge and now and then reacts to what the captions say. It works with either skin and can be turned off; each everyday action has its own switch.
- **Hover translation.** Hover over a caption to translate the whole sentence into your own language, optionally pausing the video while you read. Sixteen widely spoken target languages; the default is your browser's language. It is set up on the settings page.
- **Word collection.** Click a word in English captions to save it with its sentence, grouped by video. Search the vocabulary, copy a review prompt, or export JSON.
- **Interface language.** Follows the browser by default and can be switched between English and Chinese in the popup or on the settings page.

The extension reads the captions YouTube is already showing; it does not download caption tracks or turn captions on. Word collection works on English captions. It targets the standard player; Shorts and embedded players are unverified.

## Data and privacy

Settings, vocabulary and the translation cache are stored in `chrome.storage.local` on your device, with no account sync. Removing the extension deletes them, so export your vocabulary first if you want to keep it.

Only the caption you hover over is sent for translation, to Google Translate. The vocabulary is never uploaded. The endpoint in use is not a supported API and may stop working; see [docs/architecture.md](docs/architecture.md).

## Development

```sh
npm run dev                         # watch src/; reload the extension and refresh YouTube after changes
npm run build                       # build dist/
node scripts/package.mjs            # zip dist/ into release/
```

```text
extension/        static files: manifest, popup and settings HTML, icons, character assets, _locales
src/
  background/     message routing, storage, translation requests and cache
  content/        page entry and the shared caption source
  features/       skins, mascot, translation, vocabulary
  locales/        interface text, one file per language
  shared/         settings, messages, i18n, text and DOM helpers
  ui/             popup and settings page
scripts/          build, package, asset generation, optional browser check
tests/            unit tests and a page fixture
reference/        the original userscripts, kept for comparison
docs/             guides for each part of the project
```

Documentation:

- [docs/development.md](docs/development.md): commands, verification scope, code and language conventions
- [docs/i18n.md](docs/i18n.md): adding and translating interface text
- [docs/skins.md](docs/skins.md): the paper skin and its rules
- [docs/mascot.md](docs/mascot.md): characters, actions, expressions and artwork
- [docs/captions.md](docs/captions.md): caption tracking, hover translation, word collection
- [docs/architecture.md](docs/architecture.md): data flow, storage, permissions

[AGENTS.md](AGENTS.md) tells coding agents which of these to read for a given task.
