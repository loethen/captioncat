import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { mascotSVG, potSVG, bagSVG } from '../src/features/mascot/characters/onigiri/artwork.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const moods = ['normal', 'ask', 'wow', 'happy', 'love', 'nervous', 'sleepy', 'walk', 'cook', 'carry'];
await mkdir(`${root}/extension/assets/characters/onigiri`, { recursive: true });
for (const mood of moods) await writeFile(`${root}/extension/assets/characters/onigiri/${mood}.svg`, mascotSVG(mood));
await writeFile(`${root}/extension/assets/characters/onigiri/pot.svg`, potSVG());
await writeFile(`${root}/extension/assets/characters/onigiri/bag.svg`, bagSVG());

console.log('饭团角色与道具 SVG 已生成。');
