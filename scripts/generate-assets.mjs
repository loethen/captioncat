import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { catSVG, bladeSVG, dotSVG, cucumberSVG, cupSVG, boxSVG } from '../src/features/mascot/characters/tuxedo/artwork.js';
import { stateIds as catStates, glyphStates } from '../src/features/mascot/characters/tuxedo/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));
await mkdir(`${root}/extension/assets/characters/tuxedo`, { recursive: true });
for (const state of catStates) await writeFile(`${root}/extension/assets/characters/tuxedo/${state}.svg`, catSVG(state));
// Mirrored on screen when facing left, so their glyphs are drawn back to front here to read the right way round.
for (const state of glyphStates) await writeFile(`${root}/extension/assets/characters/tuxedo/${state}-left.svg`, catSVG(state, true));
await writeFile(`${root}/extension/assets/characters/tuxedo/blade.svg`, bladeSVG());
await writeFile(`${root}/extension/assets/characters/tuxedo/dot.svg`, dotSVG());
await writeFile(`${root}/extension/assets/characters/tuxedo/cucumber.svg`, cucumberSVG());
await writeFile(`${root}/extension/assets/characters/tuxedo/cup.svg`, cupSVG());
await writeFile(`${root}/extension/assets/characters/tuxedo/box.svg`, boxSVG());

console.log('Generated the tuxedo cat character and prop SVGs.');
