import { AUTO, currentLocale, setLocale, t } from '../shared/i18n.js';

const HINT_KEY = 'ytc:locale';

// `data-i18n="key"` fills text; `data-i18n-attr="name:key;name:key"` fills attributes.
export function localize(root = document) {
  document.documentElement.lang = currentLocale();
  for (const node of root.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of root.querySelectorAll('[data-i18n-attr]')) {
    for (const pair of node.dataset.i18nAttr.split(';')) { const [name, key] = pair.split(':'); node.setAttribute(name, t(key)); }
  }
}

// Settings load asynchronously; the remembered choice only avoids a flash of the wrong language.
export function initLocale() {
  let hint = AUTO;
  try { hint = localStorage.getItem(HINT_KEY) || AUTO; } catch {}
  setLocale(hint); localize();
}

export function applyLocale(setting) {
  try { localStorage.setItem(HINT_KEY, setting); } catch {}
  const changed = setLocale(setting);
  if (changed) localize();
  return changed;
}
