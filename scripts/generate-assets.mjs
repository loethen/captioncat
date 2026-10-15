import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { catSVG, bladeSVG, dotSVG, cucumberSVG, cupSVG, boxSVG } from '../src/features/mascot/characters/erhei/artwork.js';
import { stateIds as catStates, glyphStates } from '../src/features/mascot/characters/erhei/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));
await mkdir(`${root}/extension/assets/characters/erhei`, { recursive: true });
for (const state of catStates) await writeFile(`${root}/extension/assets/characters/erhei/${state}.svg`, catSVG(state));
// Mirrored on screen when facing left, so their glyphs are drawn back to front here to read the right way round.
for (const state of glyphStates) await writeFile(`${root}/extension/assets/characters/erhei/${state}-left.svg`, catSVG(state, true));
await writeFile(`${root}/extension/assets/characters/erhei/blade.svg`, bladeSVG());
await writeFile(`${root}/extension/assets/characters/erhei/dot.svg`, dotSVG());
await writeFile(`${root}/extension/assets/characters/erhei/cucumber.svg`, cucumberSVG());
await writeFile(`${root}/extension/assets/characters/erhei/cup.svg`, cupSVG());
await writeFile(`${root}/extension/assets/characters/erhei/box.svg`, boxSVG());

console.log('Generated the Erhei character and prop SVGs.');
