import { createStore } from './store.js';
import { createTranslationService } from './translation-service.js';

const store = createStore(chrome.storage.local);
const translator = createTranslationService({ storage: chrome.storage.local, fetcher: (...args) => fetch(...args) });

function trustedSender(sender) {
  if (sender.id !== chrome.runtime.id) return false;
  try {
    const url = new URL(sender.url || sender.tab?.url || '');
    return url.protocol === 'chrome-extension:' && url.host === chrome.runtime.id || url.origin === 'https://www.youtube.com';
  } catch { return false; }
}

async function handle(message) {
  switch (message.type) {
    case 'settings:get': return store.getSettings();
    case 'settings:patch': return store.updateSettings(message.patch);
    case 'skin:next': {
      // Perform the read and update together through the settings mutation queue.
      return store.cycleSkin();
    }
    case 'translation:translate': {
      const settings = await store.getSettings();
      if (!settings.translation.enabled) throw new Error('悬停翻译已关闭');
      return translator.translate(message.text, settings.translation.targetLanguage);
    }
    case 'translation:clear': await translator.clear(); return null;
    case 'words:get': return store.getWords();
    case 'words:add': {
      const settings = await store.getSettings();
      if (!settings.vocabulary.enabled) throw new Error('单词收集已关闭');
      return store.addWord(message);
    }
    case 'words:remove': return store.removeWord(message.videoId, message.word);
    case 'words:clear-video': return store.clearVideo(message.videoId);
    default: throw new Error('未知请求');
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!trustedSender(sender)) return false;
  Promise.resolve().then(() => handle(message)).then(
    data => sendResponse({ ok: true, data }),
    error => sendResponse({ ok: false, error: error.message || '操作失败' }),
  );
  return true;
});
