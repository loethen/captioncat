export const skins = Object.freeze([
  { id: 'off', name: 'YouTube 原版' },
  { id: 'wa-light', name: '饭团 · 纸', supportsMascot: true },
]);

// Characters belong to skins that explicitly opt in; new skins default to no character.
export function skinSupportsMascot(id) {
  return skins.find(skin => skin.id === id)?.supportsMascot === true;
}

export function nextSkin(id) {
  return skins[(skins.findIndex(skin => skin.id === id) + 1) % skins.length].id;
}
