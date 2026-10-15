import { createMascot } from '../features/mascot/controller.js';
import { createAssetRenderer } from '../features/mascot/renderer.js';
import { actions, availableActions } from '../features/mascot/actions/index.js';

// Runs the real controller and renderer on the sample caption inside the settings preview,
// so expressions and actions look the same as on the player without touching any page.
// With `random`, the character picks its own actions as it does on a video.
export function createMascotPreview(stage, { lines: lineSelector = '.preview-line > span', random = false } = {}) {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let character = null, renderer, controller, frame = 0, selected = 'state:normal', action = null, idleSince = null;
  function info() {
    const lines = [...stage.querySelectorAll(lineSelector)];
    if (!lines.length) return null;
    const box = stage.getBoundingClientRect(), first = lines[0].getBoundingClientRect(), last = lines.at(-1).getBoundingClientRect();
    if (!first.width || !first.height) return null;
    const fs = parseFloat(getComputedStyle(lines[0]).fontSize) || 14;
    const size = fs * character.sizeEm, inset = fs * 0.9;
    return {
      fs, size, x0: first.left - box.left + inset, span: Math.max(0, first.width - 2 * inset - size),
      perchY: first.top - box.top - size + fs * 0.06, groundY: last.bottom - box.top - size + fs * 0.06,
    };
  }
  function tick(now) {
    controller.tick(now);
    if (action) {
      // Loop the chosen action with a short pause so random endings get their turn.
      if (controller.snapshot().activity) idleSince = null;
      else { idleSince ??= now; if (now - idleSince > 700) controller.play(action); }
    }
    frame = requestAnimationFrame(tick);
  }
  function apply() {
    if (!controller) return;
    const [kind, id] = selected.split(':');
    action = kind === 'action' ? actions.find(item => item.id === id) || null : null;
    controller.setMood(kind === 'state' ? id : 'normal');
    idleSince = null;
    if (action) controller.play(action);
  }
  function stop() {
    cancelAnimationFrame(frame); frame = 0;
    controller?.reset(); renderer?.dispose(); controller = renderer = null;
  }
  return {
    update(value) {
      if (value === character) return;
      stop(); character = value;
      if (!character) return;
      renderer = (character.createRenderer || createAssetRenderer)({ character, assetURL: path => chrome.runtime.getURL(path), reduced: () => media.matches });
      renderer.mount(stage);
      controller = createMascot({ ...renderer, active: () => true, calm: () => random && media.matches, info, postures: () => character.postures,
        actions: random ? geometry => availableActions(character, actions.map(item => item.id), geometry) : () => [] });
      apply();
      frame = requestAnimationFrame(tick);
    },
    select(value) { if (value !== selected) { selected = value; apply(); } },
    dispose: stop,
  };
}
