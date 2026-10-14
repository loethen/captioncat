import { erhei } from './erhei/index.js';

// Add/remove a character here. No controller changes are needed.
export const characters = [erhei];
// Characters are independent of skins; this id means the captions have no character.
export const NO_CHARACTER = 'none';
export function getCharacter(id) { return id === NO_CHARACTER ? null : characters.find(character => character.id === id) || characters[0]; }

export function validateCharacter(character) {
  if (!/^[a-z][\w-]*$/.test(character.id) || !character.name || !character.states?.normal?.src) throw new Error('A character needs an id, a name and a normal asset');
  if (!(character.sizeEm > 0 && character.sizeEm <= 6)) throw new Error('Character sizeEm must be between 0 and 6');
  for (const asset of [...Object.values(character.states), ...Object.values(character.props || {})]) {
    if (!/^assets\/characters\/[\w/-]+\.(svg|png|webp|gif)$/.test(asset.src)) throw new Error(`Character assets must be packaged files: ${asset.src}`);
  }
  return character;
}
