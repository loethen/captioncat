import { t } from './i18n.js';

export async function request(type, payload = {}) {
  const result = await chrome.runtime.sendMessage({ type, ...payload });
  if (!result?.ok) {
    const { code = 'disconnected', params } = result?.error || {};
    throw new Error(t(`error.${code}`, params));
  }
  return result.data;
}

export function watchStorage(key, callback) {
  const listener = (changes, area) => {
    if (area === 'local' && changes[key]) callback(changes[key].newValue);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
