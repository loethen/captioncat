import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { characters, validateCharacter } from '../src/features/mascot/characters/index.js';
import { actions, availableActions } from '../src/features/mascot/actions/index.js';
import { moodOf } from '../src/features/mascot/reactions/index.js';
import { normalizeSettings, patchSettings, defaultSettings } from '../src/shared/settings.js';

test('registered characters have packaged, valid artwork and unique IDs', async () => {
  assert.equal(new Set(characters.map(character => character.id)).size, characters.length);
  for (const character of characters) {
    validateCharacter(character);
    for (const asset of [...Object.values(character.states), ...Object.values(character.props)]) await access(new URL(`../extension/${asset.src}`, import.meta.url));
  }
});
test('character capabilities and short captions filter activities', () => {
  const enabled = actions.map(action => action.id);
  assert.deepEqual(availableActions(characters[0], enabled, { fs: 20, span: 200 }).map(action => action.id), ['walk', 'tease', 'lick', 'laser', 'cucumber', 'sneeze', 'stretch', 'cup', 'box', 'slip', 'nap']);
  assert.deepEqual(availableActions({ states: { walk: {}, watch: {} }, props: {} }, enabled, { fs: 20, span: 200 }).map(action => action.id), ['walk']);
  assert.deepEqual(availableActions(characters[0], enabled, { fs: 20, span: 0 }).map(action => action.id), ['lick', 'sneeze', 'stretch', 'cup', 'slip', 'nap']);
  assert.deepEqual(availableActions(characters[0], [], { fs: 20, span: 200 }), []);
});
test('reaction priority, disabling and missing artwork fall back safely', () => {
  assert.equal(moodOf('thank you, I love it!'), 'happy');
  assert.equal(moodOf('I want fish'), 'food');
  assert.equal(moodOf('What happened'), 'ask');
  assert.equal(moodOf('What happened', []), 'normal');
  assert.equal(moodOf('What happened', ['ask'], { states: { normal: {} } }), 'normal');
});
test('invalid storage is normalized; partial changes preserve nested settings', () => {
  const normalized = normalizeSettings({ skinId: 'gone', characterId: 'gone', disabledActions: ['lick', 'gone', 'lick'], translation: { delay: -12, targetLanguage: 'gone' } });
  assert.equal(normalized.skinId, 'wa-light'); assert.equal(normalized.characterId, 'erhei');
  assert.deepEqual(normalized.disabledActions, ['lick']); assert.equal(normalized.translation.delay, 0);
  const patched = patchSettings(defaultSettings(), { translation: { enabled: false } });
  assert.equal(patched.translation.pauseOnHover, true); assert.equal(patched.translation.enabled, false);
  assert.deepEqual(normalizeSettings(null), defaultSettings());
});
test('manifest scopes injection and network permissions and contains no remote executable scripts', async () => {
  const manifest = JSON.parse(await readFile(new URL('../extension/manifest.json', import.meta.url)));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://www.youtube.com/*']);
  assert.deepEqual(manifest.permissions, ['storage', 'clipboardWrite']);
  assert.ok(manifest.background.service_worker);
  assert.equal(new Set(actions.map(action => action.id)).size, actions.length);
});
