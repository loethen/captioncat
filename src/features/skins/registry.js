export const skins = Object.freeze([
  { id: 'off', name: 'YouTube default' },
  { id: 'wa-light', name: 'Paper' },
]);

export function nextSkin(id) {
  return skins[(skins.findIndex(skin => skin.id === id) + 1) % skins.length].id;
}
