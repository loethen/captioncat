import { skins } from '../features/skins/registry.js';
import { characters, getCharacter, NO_CHARACTER } from '../features/mascot/characters/index.js';
import { actions, supportsAction } from '../features/mascot/actions/index.js';
import { reactions, supportsReaction } from '../features/mascot/reactions/index.js';
import { SETTINGS_KEY, enabledIds, languages, normalizeSettings, patchSettings } from '../shared/settings.js';
import { request, watchStorage } from '../shared/messages.js';
import { element } from '../shared/dom.js';
import { label, locales, t } from '../shared/i18n.js';
import { applyLocale, initLocale } from './localize.js';
import { createMascotPreview } from './mascot-preview.js';

export function status(text, error = false) {
  const node = document.querySelector('#status');
  node.textContent = text; node.classList.toggle('error', error);
}

// Expressions offered in the preview; other states are steps inside actions.
const previewMoods = ['normal', 'happy', 'love', 'food', 'nervous', 'sleepy', 'ask', 'wow'];

// `onLocale` runs after the interface language changes, for text the caller renders itself.
export async function bindSettingsForm({ onLocale } = {}) {
  initLocale();
  let settings, loaded = false, pending = 0, queue = Promise.resolve();
  const find = id => document.getElementById(id);
  const stage = createMascotPreview(find('preview'));
  function fillSelects() {
    const lists = {
      'ui-language': locales,
      skin: skins.map(skin => ({ id: skin.id, name: label('skin', skin) })),
      character: [{ id: NO_CHARACTER, name: t('characters.none') }, ...characters.map(character => ({ id: character.id, name: label('character', character) }))],
      language: languages,
    };
    for (const [id, options] of Object.entries(lists)) find(id)?.replaceChildren(...options.map(item => new Option(item.name, item.id)));
  }
  fillSelects(); status(t('status.loading'));
  function preview() {
    const character = getCharacter(settings.characterId);
    const select = find('preview-state');
    if (select && character) {
      const chosen = select.value;
      const group = (label, options) => { const node = element('optgroup'); node.label = label; node.append(...options); return node; };
      select.replaceChildren(
        group(t('preview.moods'), previewMoods.filter(id => character.states[id]).map(id => new Option(t(`mood.${id}`), `state:${id}`))),
        group(t('preview.actions'), actions.filter(action => supportsAction(character, action)).map(action => new Option(label('action', action), `action:${action.id}`))),
      );
      if ([...select.options].some(option => option.value === chosen)) select.value = chosen;
    }
    stage.update(character);
    stage.select(select?.value || 'state:normal');
    for (const id of ['mascot-details', 'preview-mascot-control']) {
      const node = find(id); if (node) node.hidden = !character;
    }
    find('preview').dataset.skin = settings.skinId;
    if (find('character-description')) find('character-description').textContent = character ? label('character', character, 'description') : t('characters.noneDescription');
  }
  function pluginList(id, kind, registry, enabled, compatible, callback) {
    const root = find(id);
    if (!root) return;
    root.replaceChildren(...registry.map(plugin => {
      const row = element('label');
      const checkbox = element('input'); checkbox.type = 'checkbox'; checkbox.checked = enabled.includes(plugin.id); checkbox.disabled = !compatible(plugin);
      if (checkbox.disabled) row.title = t('plugins.unsupported');
      checkbox.addEventListener('change', () => callback(plugin.id, checkbox.checked));
      row.append(checkbox, element('span', '', label(kind, plugin))); return row;
    }));
  }
  function render() {
    if (applyLocale(settings.uiLanguage)) { fillSelects(); onLocale?.(); }
    const values = {
      'ui-language': settings.uiLanguage, skin: settings.skinId, character: settings.characterId,
      'actions-enabled': settings.actionsEnabled, translation: settings.translation.enabled,
      pause: settings.translation.pauseOnHover, vocabulary: settings.vocabulary.enabled,
      language: settings.translation.targetLanguage, delay: settings.translation.delay,
    };
    for (const [id, value] of Object.entries(values)) {
      const node = find(id); if (!node) continue;
      if (node.type === 'checkbox') node.checked = value; else node.value = value;
    }
    // Settings that only matter while their parent switch is on.
    if (find('pause')) find('pause').disabled = !loaded || !settings.translation.enabled;
    if (find('action-list')) find('action-list').inert = !settings.actionsEnabled;
    preview();
    const character = getCharacter(settings.characterId);
    if (!character) return;
    const toggle = (key, id, enabled) => save({ [key]: enabled ? settings[key].filter(value => value !== id) : [...settings[key], id] });
    pluginList('action-list', 'action', actions, enabledIds(actions, settings.disabledActions), action => supportsAction(character, action), (id, enabled) => toggle('disabledActions', id, enabled));
    pluginList('reaction-list', 'reaction', reactions, enabledIds(reactions, settings.disabledReactions), reaction => supportsReaction(character, reaction), (id, enabled) => toggle('disabledReactions', id, enabled));
  }
  function save(patch) {
    settings = patchSettings(settings, patch); pending++; render(); status(t('status.saving'));
    queue = queue.then(async () => {
      try {
        const result = await request('settings:patch', { patch });
        pending--; if (!pending) { settings = result; render(); status(t('status.saved')); }
      } catch (error) {
        pending--; status(error.message, true);
        if (!pending) { try { settings = await request('settings:get'); render(); } catch {} }
      }
    });
  }
  const handlers = {
    'ui-language': node => ({ uiLanguage: node.value }),
    skin: node => ({ skinId: node.value }), character: node => ({ characterId: node.value }),
    'actions-enabled': node => ({ actionsEnabled: node.checked }),
    translation: node => ({ translation: { enabled: node.checked } }), pause: node => ({ translation: { pauseOnHover: node.checked } }),
    vocabulary: node => ({ vocabulary: { enabled: node.checked } }), language: node => ({ translation: { targetLanguage: node.value } }),
    delay: node => ({ translation: { delay: node.valueAsNumber } }),
  };
  const controls = Object.keys(handlers).map(find).filter(Boolean);
  controls.forEach(node => { node.disabled = true; });
  try {
    settings = await request('settings:get');
    controls.forEach(node => { node.disabled = false; });
    loaded = true; render(); status('');
    for (const [id, handler] of Object.entries(handlers)) find(id)?.addEventListener('change', event => {
      if (!event.target.validity.valid || event.target.type === 'number' && !Number.isFinite(event.target.valueAsNumber)) { status(t('translation.delayInvalid'), true); return; }
      save(handler(event.target));
    });
    find('preview-state')?.addEventListener('change', preview);
    watchStorage(SETTINGS_KEY, value => { if (!pending) { settings = normalizeSettings(value); render(); } });
  } catch (error) { status(error.message, true); }
}
