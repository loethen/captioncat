import en from '../locales/en.js';
import zhCN from '../locales/zh-CN.js';

export const AUTO = 'auto';
// The first locale is the source: missing keys in other locales fall back to it.
export const locales = [
  { id: 'en', name: 'English', messages: en },
  { id: 'zh-CN', name: '简体中文', messages: zhCN },
];
export const uiLanguages = [AUTO, ...locales.map(locale => locale.id)];

export function browserLanguage() {
  return globalThis.chrome?.i18n?.getUILanguage?.() || globalThis.navigator?.language || 'en';
}

const primary = tag => tag.toLowerCase().split('-')[0];
export function resolveLocale(setting, browser = browserLanguage()) {
  if (locales.some(locale => locale.id === setting)) return setting;
  return (locales.find(locale => locale.id.toLowerCase() === browser.toLowerCase()) || locales.find(locale => primary(locale.id) === primary(browser)) || locales[0]).id;
}

let current = locales[0];
// Returns whether the active locale changed, so callers know to re-render.
export function setLocale(setting) {
  const id = resolveLocale(setting), changed = id !== current.id;
  current = locales.find(locale => locale.id === id);
  return changed;
}
export function currentLocale() { return current.id; }

export function t(key, params = {}) {
  return (current.messages[key] ?? en[key] ?? key).replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
}

// Keys end in a CLDR plural category: `<key>.one`, `<key>.other`.
export function plural(key, count) {
  const exact = `${key}.${new Intl.PluralRules(current.id).select(count)}`;
  return t(exact in current.messages || exact in en ? exact : `${key}.other`, { count });
}

// Registry items carry their English text; a locale may override it under `<kind>.<id>[.<field>]`.
export function label(kind, item, field = 'name') {
  return current.messages[field === 'name' ? `${kind}.${item.id}` : `${kind}.${item.id}.${field}`] ?? item[field];
}
