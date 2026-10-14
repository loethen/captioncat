import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryStorage } from './helpers.js';
import { createStore } from '../src/background/store.js';
import { videoContext, wordAtOffset, reviewPrompt } from '../src/shared/text.js';

test('word boundaries accept contractions, reject single letters and padding offsets', () => {
  assert.equal(wordAtOffset("That's a well-known idea.", 3), "that's");
  assert.equal(wordAtOffset("That’s nice", 4), "that's");
  assert.equal(wordAtOffset('well-known', 7), 'well-known');
  assert.equal(wordAtOffset('I know', 0), null);
  assert.equal(wordAtOffset('two   words', 5), null);
  assert.equal(wordAtOffset('1234', 1), null);
});
test('video URL normalization supports watch, shorts and live', () => {
  assert.equal(videoContext('https://www.youtube.com/watch?v=example_1&t=5&list=extra').url, 'https://www.youtube.com/watch?v=example_1');
  assert.equal(videoContext('https://www.youtube.com/shorts/example_1').id, 'example_1');
  assert.equal(videoContext('https://www.youtube.com/live/example_1').id, 'example_1');
  assert.equal(videoContext('https://evil.test/watch?v=example_1'), null);
  assert.equal(videoContext('https://www.youtube.com/'), null);
});
test('concurrent word writes preserve all words, deduplicate and isolate videos', async () => {
  const storage = memoryStorage(), store = createStore(storage, () => 123);
  const payload = { url: 'https://www.youtube.com/watch?v=video_a', title: 'Video A - YouTube', caption: 'curiosity brings discovery' };
  await Promise.all(['curiosity', 'discovery', 'curiosity'].map(word => store.addWord({ ...payload, word })));
  await store.addWord({ ...payload, url: 'https://www.youtube.com/watch?v=video_b', word: 'second' });
  let words = await store.getWords();
  assert.equal(words.video_a.words.length, 2); assert.equal(words.video_a.title, 'Video A');
  assert.equal(words.video_a.words[0].caption, payload.caption); assert.equal(words.video_a.words[0].addedAt, 123);
  const restarted = createStore(storage); assert.equal((await restarted.getWords()).video_a.words.length, 2);
  await store.clearVideo('video_a'); words = await store.getWords();
  assert.equal(words.video_a, undefined); assert.equal(words.video_b.words.length, 1);
  await store.removeWord('video_b', 'second'); assert.deepEqual(await store.getWords(), {});
});
test('invalid word writes fail without poisoning the mutation queue', async () => {
  const store = createStore(memoryStorage());
  await assert.rejects(store.addWord({ url: 'https://www.youtube.com/watch?v=a', word: '<script>' }));
  const result = await store.addWord({ url: 'https://www.youtube.com/watch?v=a', word: 'valid' });
  assert.equal(result.added, true);
});
test('concurrent settings patches and shortcut cycles are atomic', async () => {
  const store = createStore(memoryStorage());
  await Promise.all([store.updateSettings({ translation: { enabled: false } }), store.updateSettings({ translation: { pauseOnHover: false } }), store.cycleSkin(), store.cycleSkin()]);
  const settings = await store.getSettings();
  assert.equal(settings.translation.enabled, false); assert.equal(settings.translation.pauseOnHover, false); assert.equal(settings.skinId, 'wa-light');
});
test('review prompt retains the numbered vocabulary and canonical video link', () => {
  assert.equal(reviewPrompt([{ word: 'hello' }, { word: 'world' }], 'https://www.youtube.com/watch?v=a'), 'Add all of these words to my review plan, and give the meaning and an example sentence for each.\n\n1. hello\n2. world\n\nhttps://www.youtube.com/watch?v=a');
});
