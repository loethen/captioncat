import { tuxedo } from './tuxedo/index.js';

// Add/remove a character here. No controller changes are needed.
export const characters = [tuxedo];
// Characters are independent of skins; this id means the captions have no character.
export const NO_CHARACTER = 'none';
export function getCharacter(id) { return id === NO_CHARACTER ? null : characters.find(character => character.id === id) || characters[0]; }

export function validateCharacter(character) {
  if (!/^[a-z][\w-]*$/.test(character.id) || !character.name || !character.states?.normal?.src) throw new Error('A character needs an id, a name and a normal asset');
  if (!(character.sizeEm > 0 && character.sizeEm <= 6)) throw new Error('Character sizeEm must be between 0 and 6');
  for (const asset of [...Object.values(character.states), ...Object.values(character.props || {})]) {
    for (const src of [asset.src, ...(asset.leftSrc ? [asset.leftSrc] : [])]) {
      if (!/^assets\/characters\/[\w/-]+\.(svg|png|webp|gif)$/.test(src)) throw new Error(`Character assets must be packaged files: ${src}`);
    }
  }
  return character;
}
