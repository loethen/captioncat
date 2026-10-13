export async function request(type, payload = {}) {
  const result = await chrome.runtime.sendMessage({ type, ...payload });
  if (!result?.ok) throw new Error(result?.error || '扩展连接已断开，请刷新 YouTube 页面');
  return result.data;
}

export function watchStorage(key, callback) {
  const listener = (changes, area) => {
    if (area === 'local' && changes[key]) callback(changes[key].newValue);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
