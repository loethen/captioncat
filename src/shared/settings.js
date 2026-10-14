import { skins } from '../features/skins/registry.js';
import { characters, NO_CHARACTER } from '../features/mascot/characters/index.js';
import { actions } from '../features/mascot/actions/index.js';
import { reactions } from '../features/mascot/reactions/index.js';
import { AUTO, browserLanguage, uiLanguages } from './i18n.js';

export const SETTINGS_KEY = 'settings:v1';
export const WORDS_KEY = 'words:v1';
export const CACHE_KEY = 'translations:v1';
// Translation targets, named in their own language. Ids are Google Translate codes.
export const languages = [
  { id: 'en', name: 'English' }, { id: 'zh-CN', name: '简体中文' }, { id: 'zh-TW', name: '繁體中文' },
  { id: 'ja', name: '日本語' }, { id: 'ko', name: '한국어' }, { id: 'es', name: 'Español' },
  { id: 'fr', name: 'Français' }, { id: 'de', name: 'Deutsch' }, { id: 'pt', name: 'Português' },
  { id: 'it', name: 'Italiano' }, { id: 'ru', name: 'Русский' }, { id: 'ar', name: 'العربية' },
  { id: 'hi', name: 'हिन्दी' }, { id: 'id', name: 'Bahasa Indonesia' }, { id: 'vi', name: 'Tiếng Việt' },
  { id: 'th', name: 'ไทย' }, { id: 'tr', name: 'Türkçe' }, { id: 'pl', name: 'Polski' },
  { id: 'nl', name: 'Nederlands' }, { id: 'uk', name: 'Українська' },
];

// New installs translate into the browser's language.
function defaultTargetLanguage() {
  const browser = browserLanguage().toLowerCase();
  if (/^zh-(tw|hk|mo|hant)/.test(browser)) return 'zh-TW';
  const match = languages.find(language => language.id.toLowerCase() === browser) || languages.find(language => language.id.toLowerCase().split('-')[0] === browser.split('-')[0]);
  return match?.id || 'en';
}

export function defaultSettings() {
  return {
    uiLanguage: AUTO, skinId: 'wa-light', characterId: characters[0].id, actionsEnabled: true,
    // Stored as opt-outs so newly registered actions and reactions start enabled.
    disabledActions: [], disabledReactions: [],
    translation: { enabled: true, targetLanguage: defaultTargetLanguage(), delay: 120, pauseOnHover: true },
    vocabulary: { enabled: true },
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
    actionsEnabled: bool(input?.actionsEnabled, true),
    disabledActions: ids(input?.disabledActions, actions), disabledReactions: ids(input?.disabledReactions, reactions),
    translation: {
      enabled: bool(translation.enabled, true), pauseOnHover: bool(translation.pauseOnHover, true),
      targetLanguage: languages.some(language => language.id === translation.targetLanguage) ? translation.targetLanguage : defaults.translation.targetLanguage,
      delay: Number.isFinite(translation.delay) ? Math.max(0, Math.min(2000, Math.round(translation.delay))) : defaults.translation.delay,
    },
    vocabulary: { enabled: bool(input?.vocabulary?.enabled, true) },
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
