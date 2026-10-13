import { skins } from '../features/skins/registry.js';
import { characters } from '../features/mascot/characters/index.js';
import { actions } from '../features/mascot/actions/index.js';
import { reactions } from '../features/mascot/reactions/index.js';

export const SETTINGS_KEY = 'settings:v1';
export const WORDS_KEY = 'words:v1';
export const CACHE_KEY = 'translations:v1';
export const languages = [
  { id: 'zh-CN', name: '简体中文' }, { id: 'zh-TW', name: '繁體中文' },
  { id: 'en', name: 'English' }, { id: 'ja', name: '日本語' }, { id: 'ko', name: '한국어' },
];

export function defaultSettings() {
  return {
    skinId: 'wa-light', characterId: characters[0].id, mascotEnabled: true, actionsEnabled: true,
    enabledActions: actions.map(action => action.id), enabledReactions: reactions.map(reaction => reaction.id),
    translation: { enabled: true, targetLanguage: 'zh-CN', delay: 120, pauseOnHover: true },
    vocabulary: { enabled: true },
  };
}

export function normalizeSettings(input = {}) {
  const defaults = defaultSettings();
  const bool = (value, fallback) => typeof value === 'boolean' ? value : fallback;
  const ids = (value, registry) => Array.isArray(value) ? [...new Set(value.filter(id => registry.some(item => item.id === id)))] : registry.map(item => item.id);
  const translation = input?.translation || {};
  return {
    skinId: skins.some(skin => skin.id === input?.skinId) ? input.skinId : defaults.skinId,
    characterId: characters.some(character => character.id === input?.characterId) ? input.characterId : defaults.characterId,
    mascotEnabled: bool(input?.mascotEnabled, true), actionsEnabled: bool(input?.actionsEnabled, true),
    enabledActions: ids(input?.enabledActions, actions), enabledReactions: ids(input?.enabledReactions, reactions),
    translation: {
      enabled: bool(translation.enabled, true), pauseOnHover: bool(translation.pauseOnHover, true),
      targetLanguage: languages.some(language => language.id === translation.targetLanguage) ? translation.targetLanguage : defaults.translation.targetLanguage,
      delay: Number.isFinite(translation.delay) ? Math.max(0, Math.min(2000, Math.round(translation.delay))) : defaults.translation.delay,
    },
    vocabulary: { enabled: bool(input?.vocabulary?.enabled, true) },
  };
}

export function patchSettings(current, patch) {
  return normalizeSettings({ ...current, ...patch,
    translation: { ...current.translation, ...patch.translation },
    vocabulary: { ...current.vocabulary, ...patch.vocabulary },
  });
}
