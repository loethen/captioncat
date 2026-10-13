export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function stopPlayerEvents(root) {
  for (const type of ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'contextmenu', 'keydown']) {
    root.addEventListener(type, event => event.stopPropagation());
  }
}

export function captionWindow(target) {
  return target instanceof Element ? target.closest('.caption-window') : null;
}

export function captionText(root) {
  return [...root.querySelectorAll('.ytp-caption-segment')].map(node => node.textContent).join(' ').replace(/\s+/g, ' ').trim();
}

export function clamp(value, min, max) { return Math.max(min, Math.min(value, Math.max(min, max))); }
