import { CACHE_KEY, languages } from '../shared/settings.js';
import { AppError } from '../shared/errors.js';

export function parseTranslation(data) {
  if (!Array.isArray(data?.[0])) throw new AppError('badResponse');
  const translated = data[0].map(item => typeof item?.[0] === 'string' ? item[0] : '').join('').trim();
  if (!translated) throw new AppError('emptyResult');
  return translated;
}

export function createTranslationService({ storage, fetcher = fetch, maxCache = 500, timeout = 8000 }) {
  let cache, loaded, writes = Promise.resolve();
  const pending = new Map();
  async function load() {
    if (!loaded) loaded = storage.get(CACHE_KEY).then(data => {
      const entries = Array.isArray(data[CACHE_KEY]) ? data[CACHE_KEY] : [];
      cache = new Map(entries.filter(entry => Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'string').slice(-maxCache));
    });
    await loaded;
  }
  async function fetchTranslation(text, target) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const url = new URL('https://translate.googleapis.com/translate_a/single');
      url.search = new URLSearchParams({ client: 'gtx', sl: 'auto', tl: target, dt: 't', q: text }).toString();
      const response = await fetcher(url.href, { signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw response.status === 429 ? new AppError('rateLimited') : new AppError('unavailable', { status: response.status });
      return parseTranslation(await response.json());
    } catch (error) {
      if (error.name === 'AbortError') throw new AppError('timeout');
      if (error instanceof TypeError) throw new AppError('network');
      throw error;
    } finally { clearTimeout(timer); }
  }

  return {
    async translate(text, target) {
      if (typeof text !== 'string' || !text.trim() || text.length > 2000) throw new AppError('invalidText');
      if (!languages.some(language => language.id === target)) throw new AppError('unsupportedLanguage');
      text = text.trim();
      await load();
      const key = `${target}\n${text}`;
      if (cache.has(key)) return cache.get(key);
      if (pending.has(key)) return pending.get(key);
      const task = fetchTranslation(text, target).then(async translated => {
        cache.delete(key); cache.set(key, translated);
        while (cache.size > maxCache) cache.delete(cache.keys().next().value);
        const snapshot = [...cache];
        const write = writes.then(() => storage.set({ [CACHE_KEY]: snapshot }));
        writes = write.catch(() => {});
        await write;
        return translated;
      }).finally(() => pending.delete(key));
      pending.set(key, task);
      return task;
    },
    async clear() {
      // Let earlier requests finish before clearing, so they cannot repopulate it.
      await load(); await Promise.allSettled([...pending.values()]); await writes;
      cache.clear(); await storage.remove(CACHE_KEY);
    },
  };
}
