# Architecture and data flow

Read this before changing storage, messaging, permissions or the manifest.

```text
YouTube page
  content/index.js
    CaptionSource ──► skins / character / translation / word collection
    each feature creates its own overlay inside the player
       │ runtime.sendMessage
       ▼
  background/index.js (MV3 service worker)
    Store ──► chrome.storage.local
    TranslationService ──► fixed Google Translate endpoint
       ▲
       │ runtime.sendMessage / storage.onChanged
  popup / options
```

The page side is described in [captions.md](captions.md), [skins.md](skins.md) and [mascot.md](mascot.md).

## Background worker

- Messages are accepted only from the extension's own pages and from `https://www.youtube.com`.
- Cross-origin translation requests are made by the worker. The content script sends only the caption text; the endpoint is fixed, and a message cannot name a URL. This follows [Chrome's guidance on cross-origin requests](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests).
- Every write to settings and vocabulary goes through one serial queue in `store.js`, so several tabs doing read, modify, write cannot overwrite each other.
- The translation service shares identical in-flight requests, caches by target language and source sentence, and persists up to 500 entries immediately. Clearing the cache waits for earlier requests to finish, so an old response cannot refill it.
- The listener returns `true` to keep the response channel open for async work. Nothing persistent is kept in worker memory.
- Failures are sent back as `{ code, params }` and translated by the receiving page. See [i18n.md](i18n.md).
- All registered code and assets ship with the extension. No remote JavaScript, no `eval`.

## Messages

| Type | Effect |
| --- | --- |
| `settings:get`, `settings:patch` | Read settings; merge a partial change |
| `skin:next` | Switch to the next skin in one queued step |
| `translation:translate`, `translation:clear` | Translate a caption; clear the cache |
| `words:get`, `words:add`, `words:remove`, `words:clear-video` | Read and change the vocabulary |

## Storage

| Key | Content |
| --- | --- |
| `settings:v1` | Interface language, skin, character, disabled actions, activity level, translation and collection settings |
| `words:v1` | Words grouped by video id, with the source sentence, time added and canonical video link |
| `translations:v1` | Up to 500 `[target language + source sentence, translation]` pairs |

Everything is in `chrome.storage.local`; there is no account sync. Settings are normalized on read: an id that is no longer registered is filtered out or replaced by the default. On a new install the interface language and the translation target both default to the browser's language. The vocabulary holds at most 10,000 words; past that the user is asked to export or delete. Settings and vocabulary reach open pages, the popup and the settings page through [storage.onChanged](https://developer.chrome.com/docs/extensions/reference/api/storage).

## Permissions

- `storage`: settings, vocabulary and the translation cache.
- `clipboardWrite`: writing the review prompt when the user clicks copy.
- `https://www.youtube.com/*`: injecting the caption features, and recognizing the current video in the popup.
- `https://translate.googleapis.com/*`: translation requests from the worker.

Character images are [web accessible resources](https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources) exposed to YouTube only. The extension does not ask for all sites, history, downloads or broad tabs access.

## Translation endpoint

Translation uses `translate.googleapis.com/translate_a/single?client=gtx`, kept from the original userscript. It is not a supported API and may be affected by the network, rate limits or changes on Google's side; failures are shown in the tooltip. To move to a supported service, replace the request adapter in `src/background/translation-service.js` and adjust the host permission and the `connect-src` in the manifest.
