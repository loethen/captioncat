# Development

Read this before changing code, building, verifying or committing.

## Commands

```sh
npm ci
npm run dev                         # watch src/; reload the extension and refresh the page after changes
npm run build                       # build dist/
node scripts/package.mjs            # zip dist/ into release/
node scripts/generate-assets.mjs    # regenerate the Erhei SVGs from the pixel-art code
```

Run `npm run build` again after changing anything under `extension/` (manifest, HTML, assets, `_locales`). Regenerating assets is only needed after editing `artwork.js`.

## Verification scope

- By default, check only that the code you changed parses: `node --check <file>` for JavaScript, a JSON parse for JSON.
- The user tests UI, layout and interaction. Do not start a browser, take screenshots or run interaction tests.
- Do not run unit, integration or end-to-end tests, and do not add tests to verify a change. When a change makes an existing test wrong, update the test without running it.
- Go beyond a syntax check only when the user asks for it.
- When a task needs a build or a package, call the build or package command directly. `npm run check` and `npm run package` also run the tests, so do not use them for this.

## Language

The extension targets a global audience.

- Documentation, code comments, script output and developer-facing error messages are written in English.
- Commit messages are written in English, in the existing `type: summary` form (`feat:`, `fix:`, `docs:`, `refactor:`).
- Text a user can see is never written inline. It goes through the dictionaries described in [i18n.md](i18n.md).

## Code conventions

- Create page content with `textContent` and DOM APIs. Do not use `innerHTML`; YouTube enforces Trusted Types.
- Ship all code and assets inside the extension. No remote JavaScript, no `eval`.
- Settings and vocabulary are written only by the background store, through its serial queue. Pages send a message and never write `chrome.storage` themselves. See [architecture.md](architecture.md).
- Errors that reach the user are thrown as `AppError(code)`, not as text. See [i18n.md](i18n.md).
- Settings store what the user turned off (`disabledActions`, `disabledReactions`), so newly registered items start enabled.
- Registries (skins, characters, actions, reactions) are plain local modules. Adding an item means adding a module and listing it in the registry; nothing is discovered at runtime.
- Match the surrounding style: compact modules, comments only where the reason is not obvious from the code.
