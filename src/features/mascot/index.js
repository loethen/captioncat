import { createMascot } from './controller.js';
import { getCharacter } from './characters/index.js';
import { availableActions } from './actions/index.js';
import { moodOf } from './reactions/index.js';
import { createAssetRenderer } from './renderer.js';
import { skinSupportsMascot } from '../skins/registry.js';

export function createMascotFeature(source) {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let settings, character, renderer, controller, frame = 0, lastNod = 0, unsubscribe;
  const calm = () => media.matches;
  const enabled = () => settings?.mascotEnabled && skinSupportsMascot(settings.skinId);
  function tick(now) {
    // Match the original userscript: update on every visible animation frame.
    // A time threshold can skip uneven numbers of frames and make walking stutter.
    if (!document.hidden) controller?.tick(now);
    frame = requestAnimationFrame(tick);
  }
  function react(snapshot) {
    if (!controller || !settings) return;
    controller.setMood(moodOf(snapshot.text, settings.enabledReactions, character));
    if (snapshot.changed && performance.now() - lastNod > 2400) { controller.nod(); lastNod = performance.now(); }
  }
  function rebuild() {
    controller?.reset(); renderer?.dispose();
    character = getCharacter(settings.characterId);
    renderer = (character.createRenderer || createAssetRenderer)({ character, assetURL: path => chrome.runtime.getURL(path), reduced: calm });
    if (source.player) renderer.mount(source.player);
    controller = createMascot({ ...renderer,
      active: () => enabled() && !!source.player && !document.hidden,
      calm, info: () => source.geometry(character.sizeEm),
      actions: info => settings.actionsEnabled ? availableActions(character, settings.enabledActions, info) : [],
    });
    react(source.snapshot());
  }
  const unmount = source.onMount(player => { controller?.reset(); if (player) renderer?.mount(player); });
  unsubscribe = source.subscribe(react);
  const motionChange = () => { if (settings) rebuild(); };
  media.addEventListener('change', motionChange);
  // Stop per-frame work when the selected skin has no character or it is disabled.
  return {
    update(value) {
      const previous = settings;
      settings = value;
      const changed = !previous || ['mascotEnabled', 'characterId', 'actionsEnabled', 'enabledActions', 'enabledReactions'].some(key => JSON.stringify(previous[key]) !== JSON.stringify(value[key]));
      if (changed) rebuild();
      if (enabled() && !frame) frame = requestAnimationFrame(tick);
      else if (!enabled()) {
        if (frame) { cancelAnimationFrame(frame); frame = 0; }
        controller?.reset();
      }
    },
    dispose() { cancelAnimationFrame(frame); unsubscribe(); unmount(); media.removeEventListener('change', motionChange); controller?.reset(); renderer?.dispose(); },
  };
}
