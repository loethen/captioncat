import { skins } from '../features/skins/registry.js';
import { characters, getCharacter, NO_CHARACTER } from '../features/mascot/characters/index.js';
import { actions, supportsAction } from '../features/mascot/actions/index.js';
import { reactions, supportsReaction } from '../features/mascot/reactions/index.js';
import { SETTINGS_KEY, enabledIds, languages, normalizeSettings, patchSettings } from '../shared/settings.js';
import { request, watchStorage } from '../shared/messages.js';
import { element } from '../shared/dom.js';
import { createMascotPreview } from './mascot-preview.js';

export function status(text, error = false) {
  const node = document.querySelector('#status');
  node.textContent = text; node.classList.toggle('error', error);
}

// Expressions offered in the preview; other states are steps inside actions.
const moodNames = { normal: '平常', happy: '开心', love: '喜欢', food: '馋嘴', nervous: '紧张', sleepy: '睡觉', ask: '疑问', wow: '惊讶' };

export async function bindSettingsForm() {
  let settings, pending = 0, queue = Promise.resolve();
  const find = id => document.getElementById(id);
  const stage = createMascotPreview(find('preview'));
  for (const [id, options] of [['skin', skins], ['character', [{ id: NO_CHARACTER, name: '无' }, ...characters]], ['language', languages]]) {
    const select = find(id);
    if (select) select.replaceChildren(...options.map(item => new Option(item.name, item.id)));
  }
  function preview() {
    const character = getCharacter(settings.characterId);
    const select = find('preview-state');
    if (select && character) {
      const chosen = select.value;
      const group = (label, options) => { const node = element('optgroup'); node.label = label; node.append(...options); return node; };
      select.replaceChildren(
        group('表情', Object.keys(moodNames).filter(id => character.states[id]).map(id => new Option(moodNames[id], `state:${id}`))),
        group('动作', actions.filter(action => supportsAction(character, action)).map(action => new Option(action.name, `action:${action.id}`))),
      );
      if ([...select.options].some(option => option.value === chosen)) select.value = chosen;
    }
    stage.update(character);
    stage.select(select?.value || 'state:normal');
    for (const id of ['mascot-details', 'preview-mascot-control']) {
      const node = find(id); if (node) node.hidden = !character;
    }
    find('preview').dataset.skin = settings.skinId;
    if (find('character-description')) find('character-description').textContent = character?.description || '字幕上不显示角色。';
  }
  function pluginList(id, registry, enabled, compatible, callback) {
    const root = find(id);
    if (!root) return;
    root.replaceChildren(...registry.map(plugin => {
      const label = element('label');
      const checkbox = element('input'); checkbox.type = 'checkbox'; checkbox.checked = enabled.includes(plugin.id); checkbox.disabled = !compatible(plugin);
      if (checkbox.disabled) label.title = '当前角色不支持此动作或表情';
      checkbox.addEventListener('change', () => callback(plugin.id, checkbox.checked));
      label.append(checkbox, element('span', '', plugin.name)); return label;
    }));
  }
  function render() {
    const values = {
      skin: settings.skinId, character: settings.characterId,
      'actions-enabled': settings.actionsEnabled, translation: settings.translation.enabled,
      pause: settings.translation.pauseOnHover, vocabulary: settings.vocabulary.enabled,
      language: settings.translation.targetLanguage, delay: settings.translation.delay,
    };
    for (const [id, value] of Object.entries(values)) {
      const node = find(id); if (!node) continue;
      if (node.type === 'checkbox') node.checked = value; else node.value = value;
    }
    preview();
    const character = getCharacter(settings.characterId);
    if (!character) return;
    const toggle = (key, id, enabled) => save({ [key]: enabled ? settings[key].filter(value => value !== id) : [...settings[key], id] });
    pluginList('action-list', actions, enabledIds(actions, settings.disabledActions), action => supportsAction(character, action), (id, enabled) => toggle('disabledActions', id, enabled));
    pluginList('reaction-list', reactions, enabledIds(reactions, settings.disabledReactions), reaction => supportsReaction(character, reaction), (id, enabled) => toggle('disabledReactions', id, enabled));
  }
  function save(patch) {
    settings = patchSettings(settings, patch); pending++; render(); status('保存中…');
    queue = queue.then(async () => {
      try {
        const result = await request('settings:patch', { patch });
        pending--; if (!pending) { settings = result; render(); status('已自动保存'); }
      } catch (error) {
        pending--; status(error.message, true);
        if (!pending) { try { settings = await request('settings:get'); render(); } catch {} }
      }
    });
  }
  const handlers = {
    skin: node => ({ skinId: node.value }), character: node => ({ characterId: node.value }),
    'actions-enabled': node => ({ actionsEnabled: node.checked }),
    translation: node => ({ translation: { enabled: node.checked } }), pause: node => ({ translation: { pauseOnHover: node.checked } }),
    vocabulary: node => ({ vocabulary: { enabled: node.checked } }), language: node => ({ translation: { targetLanguage: node.value } }),
    delay: node => ({ translation: { delay: node.valueAsNumber } }),
  };
  const controls = Object.keys(handlers).map(find).filter(Boolean);
  controls.forEach(node => { node.disabled = true; });
  try {
    settings = await request('settings:get'); render(); status('');
    controls.forEach(node => { node.disabled = false; });
    for (const [id, handler] of Object.entries(handlers)) find(id)?.addEventListener('change', event => {
      if (!event.target.validity.valid || event.target.type === 'number' && !Number.isFinite(event.target.valueAsNumber)) { status('延迟请输入 0–2000 的数字', true); return; }
      save(handler(event.target));
    });
    find('preview-state')?.addEventListener('change', preview);
    watchStorage(SETTINGS_KEY, value => { if (!pending) { settings = normalizeSettings(value); render(); } });
  } catch (error) { status(error.message, true); }
}
