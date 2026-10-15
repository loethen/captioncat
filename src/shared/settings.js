import { skins } from '../features/skins/registry.js';
import { characters, NO_CHARACTER } from '../features/mascot/characters/index.js';
import { actions } from '../features/mascot/actions/index.js';
import { browserLanguage, resolveLocale, uiLanguages } from './i18n.js';

export const SETTINGS_KEY = 'settings:v1';
export const WORDS_KEY = 'words:v1';
export const CACHE_KEY = 'translations:v1';
// Translation targets: widely spoken languages, by Google Translate code. Names come from
// Intl.DisplayNames, so there is no list of names to maintain or translate.
export const languages = [
  'en', 'zh-CN', 'zh-TW', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'ja', 'ko', 'ar', 'hi', 'id', 'vi', 'tr',
].map(id => ({ id }));
// How often the character starts an action of its own; the timings are in the mascot controller.
export const activityLevels = ['calm', 'normal', 'lively'];

// The name of a language as written in `inLocale`; by default in the language itself.
export function languageName(id, inLocale = id) {
  let name = id;
  try { name = new Intl.DisplayNames([inLocale], { type: 'language' }).of(id) || id; } catch {}
  return name.charAt(0).toLocaleUpperCase(inLocale) + name.slice(1);
}

// New installs translate into the browser's language.
function defaultTargetLanguage() {
  const browser = browserLanguage().toLowerCase();
  if (/^zh-(tw|hk|mo|hant)/.test(browser)) return 'zh-TW';
  const match = languages.find(language => language.id.toLowerCase() === browser) || languages.find(language => language.id.toLowerCase().split('-')[0] === browser.split('-')[0]);
  return match?.id || 'en';
}

export function defaultSettings() {
  return {
    // New installs start in the browser's language; the choice is stored once settings are saved.
    uiLanguage: resolveLocale(), skinId: 'wa-light', characterId: characters[0].id, activity: 'normal',
    // Stored as opt-outs so newly registered actions start enabled.
    disabledActions: [],
    translation: { enabled: false, targetLanguage: defaultTargetLanguage(), delay: 120, pauseOnHover: true },
    vocabulary: { enabled: false },
  };
}

export function normalizeSettings(input = {}) {
  const defaults = defaultSettings();
  const bool = (value, fallback) => typeof value === 'boolean' ? value : fallback;
  const ids = (value, registry) => Array.isArray(value) ? [...new Set(value.filter(id => registry.some(item => item.id === id)))] : [];
  const translation = input?.translation || {};
  return {
    uiLanguage: uiLanguages.includes(input?.uiLanguage) ? input.uiLanguage : defaults.uiLanguage,
    skinId: skins.some(skin => skin.id === input?.skinId) ? input.skinId : defaults.skinId,
    // Settings saved before characters could be empty used a separate mascotEnabled switch.
    characterId: input?.characterId === NO_CHARACTER || input?.mascotEnabled === false ? NO_CHARACTER
      : characters.some(character => character.id === input?.characterId) ? input.characterId : defaults.characterId,
    activity: activityLevels.includes(input?.activity) ? input.activity : defaults.activity,
    disabledActions: ids(input?.disabledActions, actions),
    translation: {
      enabled: bool(translation.enabled, false), pauseOnHover: bool(translation.pauseOnHover, true),
      targetLanguage: languages.some(language => language.id === translation.targetLanguage) ? translation.targetLanguage : defaults.translation.targetLanguage,
      delay: Number.isFinite(translation.delay) ? Math.max(0, Math.min(2000, Math.round(translation.delay))) : defaults.translation.delay,
    },
    vocabulary: { enabled: bool(input?.vocabulary?.enabled, false) },
  };
}

export function enabledIds(registry, disabled) {
  return registry.filter(item => !disabled.includes(item.id)).map(item => item.id);
}

export function patchSettings(current, patch) {
  return normalizeSettings({ ...current, ...patch,
    translation: { ...current.translation, ...patch.translation },
    vocabulary: { ...current.vocabulary, ...patch.vocabulary },
  });
}
