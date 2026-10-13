import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { mascotSVG, potSVG, bagSVG } from '../src/features/mascot/characters/onigiri/artwork.js';
import { catSVG, bladeSVG, dotSVG } from '../src/features/mascot/characters/erhei/artwork.js';
import { stateIds as catStates } from '../src/features/mascot/characters/erhei/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const moods = ['normal', 'ask', 'wow', 'happy', 'love', 'nervous', 'sleepy', 'walk', 'cook', 'carry'];
await mkdir(`${root}/extension/assets/characters/onigiri`, { recursive: true });
for (const mood of moods) await writeFile(`${root}/extension/assets/characters/onigiri/${mood}.svg`, mascotSVG(mood));
await writeFile(`${root}/extension/assets/characters/onigiri/pot.svg`, potSVG());
await writeFile(`${root}/extension/assets/characters/onigiri/bag.svg`, bagSVG());
await mkdir(`${root}/extension/assets/characters/erhei`, { recursive: true });
for (const state of catStates) await writeFile(`${root}/extension/assets/characters/erhei/${state}.svg`, catSVG(state));
await writeFile(`${root}/extension/assets/characters/erhei/blade.svg`, bladeSVG());
await writeFile(`${root}/extension/assets/characters/erhei/dot.svg`, dotSVG());

console.log('饭团、二黑的角色与道具 SVG 已生成。');
