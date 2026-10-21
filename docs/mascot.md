# Characters, actions and expressions

Read this before adding or changing a character, an action, an expression or its artwork.

## Scope

- There is one character, the Tuxedo Cat (id `tuxedo`), a pixel black-and-white cat. Do not add a character unless the user asks.
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

`normal` is required; other poses are optional. The default renderer uses `<img>` and accepts SVG, PNG, WebP and GIF. Use a transparent background and one canvas size for all poses. Each pose can have its own artwork without touching the state machine. Artwork that contains a question mark or text would read backwards when the character faces left. Give such a pose a `leftSrc` drawn with the text back to front: it is used instead of `src` when facing left and is mirrored like everything else, so the character turns and the text reads the right way. The tuxedo cat does this for `ask`, `happy` and `sleepy`. `mirror: false` still turns flipping off for a pose altogether.

Props use the character's own artwork and a position relative to the character:

```js
props: {
  pot: {
    src: 'assets/characters/cat/pot.svg',
    box: { left: '86%', bottom: '0', width: '64%', height: '64%' },
  },
}
```

A character can also declare its `postures`, so actions change posture smoothly instead of jumping from standing to lying:

```js
postures: {
  sit: { base: 'sit', poses: ['sit', 'lick'] },    // poses done sitting, and the plain pose for sitting down
  lie: { base: 'rest', poses: ['rest', 'sleepy'] },
  bridges: ['stretch'],                            // gets up from any posture straight to standing
},
```

Every other pose counts as standing. When a step asks for a pose in another posture, the controller first shows the base pose of each posture on the way, in the order standing, sitting, lying: standing to lying sits down first, lying to walking sits up first, and a sitting pose such as licking a paw starts by sitting down. A bridge pose skips this. Actions never mention postures; they only name poses. Without `postures`, poses switch directly.

Props sit inside the character's facing container, so they mirror with it. `sizeEm`, poses and props all belong to the character package; actions and the state machine never mention shapes or asset paths.

To remove a character, take it out of the registry and delete its artwork and module. A saved id that no longer exists falls back to the first registered character, so the registry must keep at least one.

### The tuxedo cat's artwork

The tuxedo cat is drawn in code. `src/features/mascot/characters/tuxedo/artwork.js` paints each pose frame by frame, and `node scripts/generate-assets.mjs` bakes the poses and props into frame-switching SVGs under `extension/assets/characters/tuxedo/`. Edit `artwork.js` and regenerate; do not edit the SVGs by hand.

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
  kind: 'chore', // patrol, chore, play or rest; see "The routine"
  buildSteps({ random, position, info }) {
    return [
      { type: 'pose', pose: 'happy', ms: 1200 },
      { type: 'wait', ms: 400 },
    ];
  },
};
```

Import it in `actions/index.js` and add it to the `actions` array. To remove one, take it out of the array; saved settings that mention it are filtered automatically. A new action shows up on the settings page and starts enabled, because settings store only what the user turned off (`disabledActions`). The previews in the popup and on the settings page run the same controller and renderer on a sample caption, so choosing an action there plays it without touching the page's captions. The preview starts on the stroll.

An action is available only when all of these hold: the user has it enabled, the character has its `requiredStates` and `requiredProps`, and the walkable caption width reaches `minSpanEm`. When a replacement character lacks a pose or prop, the actions that need it switch off by themselves.

Generic steps:

| `type` | Fields | Behaviour |
| --- | --- | --- |
| `walk` | `to` (0–1), optional `pose` / `speed` / `prop` | Moves along the top edge of the caption. Uses the `walk` pose by default; `speed` is a multiplier, on top of the activity level's walking speed. |
| `pose` | `ms`, optional `pose` / `mood` / `prop` / `fx` / `body` / `turn` / `face` | Holds a pose, expression and prop. `turn: true` turns the character around on the spot; `face` (1 right, -1 left) turns it to a given side. `fx` plays a prop effect: `enter`, `appear`, `wave`, `jitter`, `nudge1`, `nudge2`, `tip`, `vanish`, `yank`. `body` plays a whole-body effect: `lunge`, `jump`, `recoil`, `poke`, `dive` and `bail`, `overstep`, `gasp`, `drop`, `cling`, `climb`. Of these, `dive`, `overstep`, `gasp`, `drop` and `cling` leave the character away from its spot until the pose is cleared or the matching return effect plays. |
| `wait` | `ms`, optional `pose` | Stays put; returns to the normal pose by default. |

`pose: null` and `prop: null` clear the pose or the prop explicitly. A step without a `prop` field keeps the current prop. Any caption expression other than normal interrupts the action and clears the prop; see "The routine" for what is picked up again afterwards. A short caption gap pauses the action; a longer one interrupts it the same way.

`buildSteps()` receives an injectable random function, the current position along the top edge, the facing (`facing`, 1 is right), the caption geometry, the list of currently available actions (`available`) and the activity level's `pace`, and returns an array of steps. Combining existing steps into a new action needs no change to `controller.js`. A brand new step type needs a handler in the executor.

## The routine

The character does not pick actions at random with idle gaps in between; it follows a routine, and every action belongs to one `kind`:

| `kind` | Actions | Role |
| --- | --- | --- |
| `patrol` | Stroll | Walks all the way to one end of the caption, often back to the other end, now and then stopping part way to look at something. |
| `chore` | Lick a paw, Stretch, Sneeze | Small things done on the spot. An action without a `kind` counts as a chore. |
| `play` | Cat grass, Red dot, Cucumber, Cup, Box | The big set pieces. |
| `rest` | Rest at the edge | Walks to an end, usually the nearer one, sits and lies down facing back along the caption, dozes and often falls asleep, then gets up with a stretch and a yawn. |

The character is awake for a stretch of time. While awake, it picks a patrol, a chore or play in the proportions of the activity level, with only a short, natural pause between actions, so it is never left standing about. Within a kind, actions share the kind's share by their own optional `weight` (default 1). The same action is not picked twice in a row unless it is the only one, and a play action that has run stays out for a cooldown set by the activity level, so the set pieces do not repeat within minutes. Once the awake stretch is used up, the next action is the rest; finishing the rest starts a new awake stretch. If the user turned the rest off, it simply stays awake.

Play actions find their own room: each walks to where its props fit before starting (the middle for cat grass, the cucumber and the box, an end for the cup, end to end for the red dot), and those that need space set `minSpanEm`, so a short caption simply leaves them out.

A caption expression or a long enough caption gap interrupts the current action. A patrol or a rest is kept for up to 20 seconds: when the expression is over, the character carries on walking to the same end, or sits and lies back down for the rest of its rest, instead of starting something new. Play, chores and any step with a prop or a body effect under way simply end.

The activity level (`activity` in settings: `calm`, `normal` or `lively`) sets the routine's shape, not a delay: how long the character stays awake, how long it rests, how likely it is to fall asleep, the mix of patrol, chores and play, the pause between actions and the walking speed. Calm spends about two thirds of its time resting and rarely plays; lively is mostly on the move. The values are in `paces` in `controller.js`; the content script passes the current level through `env.pace()`, and `buildSteps()` receives it as `pace`, so a change applies without rebuilding the character. The popup and the settings page offer the levels by name, not as numbers.

An action with `incidental: true` is never picked by the routine. Another action refers to it from its own steps: a patrol now and then does not stop at the end and goes into "Near slip". It can still be switched on and off and previewed.

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
- The character waits for the top edge of the caption to be stable before changing level when captions scroll, but its action carries on meanwhile at the old height.
- Whenever the line under it moves or changes width, the character keeps its x, clamped to the new line, so it drops or hops straight instead of sliding to the same fraction of a line with a different width.
- A change of line never pauses a walk: it keeps walking while the new line settles and while it hops or drops, landing where it took off and catching up, and through a blank of under a second between two captions it carries on along the last line.
- A brief caption gap keeps the character perched. A longer gap makes it fall, rest, sleep and finally fade, about four and a half seconds after the captions went away (`timing` in `controller.js`); it returns when captions come back.
- A caption expression is the whole reaction: the nod on a new caption only plays when the caption shows no expression, so the character does not hop as it changes face.
- Coordinates account for the player's CSS scale, and the overlay lives inside the player so it shows in fullscreen.
- `controller.js` is a state machine with no DOM access; keep it that way.
