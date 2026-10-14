import { SETTINGS_KEY, WORDS_KEY, normalizeSettings, patchSettings } from '../shared/settings.js';
import { videoContext, wordAtOffset } from '../shared/text.js';
import { nextSkin } from '../features/skins/registry.js';
import { AppError } from '../shared/errors.js';

// Serializes read-modify-write operations across tabs and extension pages.
export function createStore(storage, now = Date.now) {
  let queue = Promise.resolve();
  function mutate(work) {
    const operation = queue.then(work);
    queue = operation.catch(() => {});
    return operation;
  }
  async function getSettings() {
    return normalizeSettings((await storage.get(SETTINGS_KEY))[SETTINGS_KEY]);
  }
  async function getWords() { return (await storage.get(WORDS_KEY))[WORDS_KEY] || {}; }
  return {
    getSettings, getWords,
    cycleSkin: () => mutate(async () => {
      const settings = await getSettings(); settings.skinId = nextSkin(settings.skinId);
      await storage.set({ [SETTINGS_KEY]: settings }); return settings;
    }),
    updateSettings: patch => mutate(async () => {
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new AppError('invalidSettings');
      const settings = patchSettings(await getSettings(), patch);
      await storage.set({ [SETTINGS_KEY]: settings }); return settings;
    }),
    addWord: payload => mutate(async () => {
      const context = videoContext(payload.url || '', payload.title || '');
      const word = typeof payload.word === 'string' ? payload.word.toLowerCase().replaceAll('’', "'") : '';
      if (!context || word.length > 80 || wordAtOffset(word, 0) !== word) throw new AppError('invalidWord');
      const all = await getWords();
      const record = all[context.id] || { ...context, words: [] };
      const existing = record.words.some(item => item.word === word);
      if (!existing) {
        const count = Object.values(all).reduce((total, video) => total + video.words.length, 0);
        if (count >= 10000) throw new AppError('vocabularyFull');
        record.words.push({ word, caption: String(payload.caption || '').slice(0, 2000), addedAt: now() });
      }
      record.title = context.title || record.title; record.updatedAt = now();
      all[context.id] = record;
      await storage.set({ [WORDS_KEY]: all }); return { record, added: !existing };
    }),
    removeWord: (videoId, word) => mutate(async () => {
      const all = await getWords();
      if (all[videoId]) {
        all[videoId].words = all[videoId].words.filter(item => item.word !== word);
        if (!all[videoId].words.length) delete all[videoId];
      }
      await storage.set({ [WORDS_KEY]: all }); return all;
    }),
    clearVideo: videoId => mutate(async () => {
      const all = await getWords(); delete all[videoId];
      await storage.set({ [WORDS_KEY]: all }); return all;
    }),
  };
}
