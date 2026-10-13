export const skins = Object.freeze([
  { id: 'off', name: 'YouTube 原版' },
  { id: 'wa-light', name: '纸' },
]);

export function nextSkin(id) {
  return skins[(skins.findIndex(skin => skin.id === id) + 1) % skins.length].id;
}
