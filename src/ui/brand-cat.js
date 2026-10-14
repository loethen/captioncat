// The brand cat beside the page title reacts to what happens on the page, using Erhei's
// packaged poses as plain images. It is separate from the caption character setting.
const pose = name => `assets/characters/erhei/${name}.svg`;
let timer = 0, hovering = false;

function show(name) {
  const node = document.querySelector('#brand-cat');
  if (node && !node.src.endsWith(pose(name))) node.src = pose(name);
}

export function catMood(name, ms = 1600) {
  clearTimeout(timer); show(name);
  timer = setTimeout(() => show(hovering ? 'love' : 'normal'), ms);
}

export function bindBrandCat() {
  const node = document.querySelector('#brand-cat');
  if (!node) return;
  node.addEventListener('mouseenter', () => { hovering = true; clearTimeout(timer); show('love'); });
  node.addEventListener('mouseleave', () => { hovering = false; show('normal'); });
  node.addEventListener('click', () => catMood('happy'));
}
