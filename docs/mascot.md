# Characters, actions and expressions

Read this before adding or changing a character, an action, an expression or its artwork.

## Scope

- There is one character, Erhei (id `erhei`), a pixel black cat. Do not add a character unless the user asks.
- Characters and skins are independent: a character works with either skin, and "None" shows no character.
- Plugging happens in the source registries: add or remove a local module, then rebuild. Nothing is downloaded or executed from the network at runtime.
- Names are written in English in the module. Translations are optional entries in the locale files; see [i18n.md](i18n.md).

## Adding or replacing a character

1. Put the artwork in `extension/assets/characters/<id>/`.
2. Export the character object from `src/features/mascot/characters/<id>/index.js`.
3. Import it in `src/features/mascot/characters/index.js` and add it to the `characters` array.
4. Optionally add `character.<id>` and `character.<id>.description` to the non-English locale files.
5. Run `node --check` on the changed files, then `npm run build` and reload the extension. The character appears in the character selector.

```js
export const cat = {
  id: 'cat',
  name: 'Kitten',
  description: 'A kitten that likes to stroll.',
  sizeEm: 2.8, // size relative to the YouTube caption font size
  states: {
    normal: { src: 'assets/characters/cat/normal.svg', mirror: true },
    walk:   { src: 'assets/characters/cat/walk.webp', mirror: true },
    happy:  { src: 'assets/characters/cat/happy.svg', mirror: true },
  },
  props: {},
};
```

`normal` is required; other poses are optional. The default renderer uses `<img>` and accepts SVG, PNG, WebP and GIF. Use a transparent background and one canvas size for all poses. Each pose can have its own artwork without touching the state machine. Artwork that contains a question mark, an exclamation mark or text can set `mirror: false` so it does not read backwards when the character walks left.

Props use the character's own artwork and a position relative to the character:

```js
props: {
  pot: {
    src: 'assets/characters/cat/pot.svg',
    box: { left: '86%', bottom: '0', width: '64%', height: '64%' },
  },
}
```

Props sit inside the character's facing container, so they mirror with it. `sizeEm`, poses and props all belong to the character package; actions and the state machine never mention shapes or asset paths.

To remove a character, take it out of the registry and delete its artwork and module. A saved id that no longer exists falls back to the first registered character, so the registry must keep at least one.

### Erhei's artwork

Erhei is drawn in code. `src/features/mascot/characters/erhei/artwork.js` paints each pose frame by frame, and `node scripts/generate-assets.mjs` bakes the poses and props into frame-switching SVGs under `extension/assets/characters/erhei/`. Edit `artwork.js` and regenerate; do not edit the SVGs by hand.

The settings page also uses these SVGs directly: the sleeping cat in an empty vocabulary, and the cat living on the settings page footer, which runs the real controller with random actions (`createMascotPreview(stage, { random: true })`). They are part of the CaptionCat brand and stay visible when the caption character is set to None.

## Adding or removing an everyday action

One module per action, for example `src/features/mascot/actions/greet.js`:

```js
export const greet = {
  id: 'greet',
  name: 'Greet',
  requiredStates: ['happy'],
  requiredProps: [],
  minSpanEm: 0,
  buildSteps({ random, position, info }) {
    return [
      { type: 'pose', pose: 'happy', ms: 1200 },
      { type: 'wait', ms: 400 },
    ];
  },
};
```

Import it in `actions/index.js` and add it to the `actions` array. To remove one, take it out of the array; saved settings that mention it are filtered automatically. A new action shows up on the settings page and starts enabled, because settings store only what the user turned off (`disabledActions`). The previews in the popup and on the settings page run the same controller and renderer on a sample caption, so choosing an action there plays it without touching the page's captions. The preview starts on the stroll.

An action with `incidental: true` is never picked at random on its own. Another action refers to it from its own steps: a stroll now and then ends in "Near slip", or else often in "Rest at the edge", where the character lies down at one end of the caption for several seconds. It can still be switched on and off and previewed.

Picking is weighted by the action's optional `weight` (default 1). Quiet everyday actions weigh more (the stroll 4, licking a paw and stretching 2), so the big set pieces stay occasional. The same action is not picked twice in a row unless it is the only one available.

How often an action starts follows the user's activity level (`activity` in settings: `calm`, `normal` or `lively`). The pauses for each level are in `paces` in `controller.js`; the content script passes the current level through `env.pace()`, so a change applies from the next pause without rebuilding the character. The popup and the settings page offer the levels by name, not as numbers.

An action is available only when all of these hold: the user has it enabled, the character has its `requiredStates` and `requiredProps`, and the walkable caption width reaches `minSpanEm`. When a replacement character lacks a pose or prop, the actions that need it switch off by themselves.

Generic steps:

| `type` | Fields | Behaviour |
| --- | --- | --- |
| `walk` | `to` (0–1), optional `pose` / `speed` / `prop` | Moves along the top edge of the caption. Uses the `walk` pose by default; `speed` is a multiplier. |
| `pose` | `ms`, optional `pose` / `mood` / `prop` / `fx` / `body` / `turn` | Holds a pose, expression and prop. `turn: true` turns the character around on the spot. `fx` plays a prop effect: `enter`, `appear`, `wave`, `jitter`, `nudge1`, `nudge2`, `tip`, `vanish`, `yank`. `body` plays a whole-body effect: `lunge`, `jump`, `recoil`, `poke`, `dive` and `bail`, `overstep`, `gasp`, `drop`, `cling`, `climb`. Of these, `dive`, `overstep`, `gasp`, `drop` and `cling` leave the character away from its spot until the pose is cleared or the matching return effect plays. |
| `wait` | `ms`, optional `pose` | Stays put; returns to the normal pose by default. |

`pose: null` and `prop: null` clear the pose or the prop explicitly. A step without a `prop` field keeps the current prop. Any caption expression other than normal interrupts the action and clears the prop. A short caption gap pauses the action; a longer one cancels it.

`buildSteps()` receives an injectable random function, the current position along the top edge, the facing (`facing`, 1 is right), the caption geometry and the list of currently available actions (`available`), and returns an array of steps. Combining existing steps into a new action needs no change to `controller.js`. A brand new step type needs a handler in the executor.

## Caption expressions

The character reacts to what captions say: happy, love, food, sleepy, ask and wow. This is a hidden extra. It has no setting and does not appear in the settings or the preview, so do not add one unless the user asks.

- `reactions/keywords.js` holds the keywords, one list per expression and language (currently English, Chinese, Japanese, Korean, Spanish, French, German, Portuguese and Russian). To support another language, add its lists there; nothing else changes.
- Captions are lower-cased before matching. Languages written with spaces match whole words only, so `eat` does not fire on "theater". Chinese, Japanese and Korean (listed in `UNSPACED`) match anywhere in the caption, so their entries must be specific enough not to appear inside unrelated words; prefer two or more characters.
- `reactions/index.js` turns the lists into one pattern per expression and adds `signs` for what words cannot express, such as a trailing question or exclamation mark, laughter like "hahaha", or musical notes.
- Expressions are tried in array order and the first match wins. `id` is the pose shown, so an expression whose pose the character lacks is skipped and the result falls back to `normal`.
- A new expression needs an entry in `reactions`, keyword lists, and the pose in the character's `states`.

## Custom renderer

A character may provide `createRenderer({ character, assetURL, reduced })` to replace the default `createAssetRenderer`. The controller talks to a renderer only through this interface:

```text
mount(player), size(px), place({x, y}), show(), hide(), fade()
move(from, to, kind, done), pop(), nod(), land()
setMood(name), override(nameOrNull), pose(nameOrNull), sleep(boolean)
face(direction), prop(nameOrNull), propFx(name), bodyFx(name), dispose()
```

`move()` calls `done()` when it finishes. `dispose()` must cancel animations and remove nodes when the character is replaced or destroyed. Skip motion when `reduced()` is true. Methods must work when called on their own, without relying on `this`, because the controller calls them through an environment adapter.

A renderer for local video or Lottie can handle playback, state changes and teardown behind this interface; the controller and the actions do not need to know the technique. Its resources must ship with the extension and fit the `web_accessible_resources` scope. The default character validation currently accepts image formats only.

## Runtime behaviour to preserve

- While a character is shown, the caption position is read on every animation frame, with no frame-rate cap; a time threshold makes walking stutter. The loop is skipped while the page is hidden and cancelled when the character is "None".
- The character waits for the top edge of the caption to be stable before changing level when captions scroll.
- Changing lines keeps the character's x, clamped to the new line, so it drops or hops straight instead of sliding to the same fraction of a line with a different width.
- A brief caption gap keeps the character perched. A longer gap makes it fall, rest, sleep and finally fade; it returns when captions come back.
- Coordinates account for the player's CSS scale, and the overlay lives inside the player so it shows in fullscreen.
- `controller.js` is a state machine with no DOM access; keep it that way.
