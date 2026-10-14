import test from 'node:test';
import assert from 'node:assert/strict';
import { createTranslationService, parseTranslation } from '../src/background/translation-service.js';
import { CACHE_KEY } from '../src/shared/settings.js';
import { memoryStorage } from './helpers.js';

const response = text => ({ ok: true, json: async () => [[[text]]] });
test('same in-flight translation is shared and persists across worker restarts', async () => {
  const storage = memoryStorage(); let calls = 0;
  const fetcher = async url => { calls++; assert.equal(new URL(url).hostname, 'translate.googleapis.com'); return response('你好'); };
  const service = createTranslationService({ storage, fetcher });
  const result = await Promise.all([service.translate('hello', 'zh-CN'), service.translate('hello', 'zh-CN')]);
  assert.deepEqual(result, ['你好', '你好']); assert.equal(calls, 1);
  const restarted = createTranslationService({ storage, fetcher });
  assert.equal(await restarted.translate('hello', 'zh-CN'), '你好'); assert.equal(calls, 1);
  await restarted.translate('hello', 'ja'); assert.equal(calls, 2);
});
test('cache is bounded and clears persistent data', async () => {
  const storage = memoryStorage(), service = createTranslationService({ storage, maxCache: 2, fetcher: async url => response(new URL(url).searchParams.get('q')) });
  await Promise.all(['one', 'two', 'three'].map(text => service.translate(text, 'en')));
  assert.equal(storage.snapshot()[CACHE_KEY].length, 2);
  await service.clear(); assert.equal(storage.snapshot()[CACHE_KEY], undefined);
});
test('clear waits for in-flight results, so late requests cannot restore the cache', async () => {
  const storage = memoryStorage(); let resolve;
  const service = createTranslationService({ storage, fetcher: () => new Promise(done => { resolve = done; }) });
  const task = service.translate('hello', 'zh-CN');
  await new Promise(done => setImmediate(done));
  const clearing = service.clear(); resolve(response('你好')); await task; await clearing;
  assert.equal(storage.snapshot()[CACHE_KEY], undefined);
});
test('invalid input, malformed responses and HTTP failures return useful errors', async () => {
  assert.throws(() => parseTranslation({}));
  assert.equal(parseTranslation([[['你'], ['好']]]), '你好');
  const service = createTranslationService({ storage: memoryStorage(), fetcher: async () => ({ ok: false, status: 429 }) });
  await assert.rejects(service.translate('', 'zh-CN'), { code: 'invalidText' });
  await assert.rejects(service.translate('hello', 'unknown'), { code: 'unsupportedLanguage' });
  await assert.rejects(service.translate('hello', 'zh-CN'), { code: 'rateLimited' });
});
test('timeout aborts the request and can be retried', async () => {
  const service = createTranslationService({ storage: memoryStorage(), timeout: 5, fetcher: (_, { signal }) => new Promise((resolve, reject) => { signal.addEventListener('abort', () => reject(Object.assign(new Error(), { name: 'AbortError' }))); }) });
  await assert.rejects(service.translate('hello', 'zh-CN'), { code: 'timeout' });
  await assert.rejects(service.translate('hello', 'zh-CN'), { code: 'timeout' });
});
