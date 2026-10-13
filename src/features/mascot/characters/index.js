import { onigiri } from './onigiri/index.js';
import { erhei } from './erhei/index.js';

// Add/remove a character here. No controller changes are needed.
export const characters = [onigiri, erhei];
// Characters are independent of skins; this id means the captions have no character.
export const NO_CHARACTER = 'none';
export function getCharacter(id) { return id === NO_CHARACTER ? null : characters.find(character => character.id === id) || characters[0]; }

export function validateCharacter(character) {
  if (!/^[a-z][\w-]*$/.test(character.id) || !character.name || !character.states?.normal?.src) throw new Error('角色必须提供 id、name 和 normal 素材');
  if (!(character.sizeEm > 0 && character.sizeEm <= 6)) throw new Error('角色 sizeEm 必须在 0–6 之间');
  for (const asset of [...Object.values(character.states), ...Object.values(character.props || {})]) {
    if (!/^assets\/characters\/[\w/-]+\.(svg|png|webp|gif)$/.test(asset.src)) throw new Error(`角色素材须为扩展内文件：${asset.src}`);
  }
  return character;
}
