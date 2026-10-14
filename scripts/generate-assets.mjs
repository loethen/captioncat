import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { catSVG, bladeSVG, dotSVG, cucumberSVG, cupSVG, boxSVG } from '../src/features/mascot/characters/erhei/artwork.js';
import { stateIds as catStates } from '../src/features/mascot/characters/erhei/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));
await mkdir(`${root}/extension/assets/characters/erhei`, { recursive: true });
for (const state of catStates) await writeFile(`${root}/extension/assets/characters/erhei/${state}.svg`, catSVG(state));
await writeFile(`${root}/extension/assets/characters/erhei/blade.svg`, bladeSVG());
await writeFile(`${root}/extension/assets/characters/erhei/dot.svg`, dotSVG());
await writeFile(`${root}/extension/assets/characters/erhei/cucumber.svg`, cucumberSVG());
await writeFile(`${root}/extension/assets/characters/erhei/cup.svg`, cupSVG());
await writeFile(`${root}/extension/assets/characters/erhei/box.svg`, boxSVG());

console.log('二黑的角色与道具 SVG 已生成。');
