import { request } from '../../shared/messages.js';
import { label, t } from '../../shared/i18n.js';
import { skins } from './registry.js';
import skinCSS from './skins.css';

export function createSkinFeature(source, notify) {
  let settings, visible = false;
  let stylesheet = null, appliedSkin = 'off', layoutFrame = 0;
  const timers = new Map();
  function clearEntrance() {
    for (const [node, timer] of timers) { clearTimeout(timer); node.classList.remove('ytc-enter'); }
    timers.clear();
    source.player?.querySelectorAll('.ytc-enter').forEach(node => node.classList.remove('ytc-enter'));
  }
  function apply() {
    const paper = settings.skinId === 'wa-light';
    if (paper) {
      if (!stylesheet) {
        stylesheet = document.createElement('style');
        stylesheet.dataset.ytcCaptionSkin = '';
        stylesheet.textContent = skinCSS;
      }
      document.documentElement.dataset.ytcSkin = settings.skinId;
      if (!stylesheet.isConnected) (document.head || document.documentElement).append(stylesheet);
    } else {
      document.documentElement.removeAttribute('data-ytc-skin');
      stylesheet?.remove(); stylesheet = null;
      clearEntrance();
    }
    if (appliedSkin !== settings.skinId) {
      appliedSkin = settings.skinId;
      cancelAnimationFrame(layoutFrame);
      layoutFrame = requestAnimationFrame(() => {
        layoutFrame = 0;
        // Let the player recalculate caption placement after changing box metrics.
        window.dispatchEvent(new Event('resize'));
        source.refresh();
      });
    }
  }
  const unsubscribe = source.subscribe(snapshot => {
    const hasText = !!snapshot.text;
    if (hasText && !visible && settings?.skinId === 'wa-light') {
      for (const node of source.player?.querySelectorAll('.captions-text') || []) {
        node.classList.add('ytc-enter');
        clearTimeout(timers.get(node));
        timers.set(node, setTimeout(() => { node.classList.remove('ytc-enter'); timers.delete(node); }, 800));
      }
    }
    visible = hasText;
  });
  async function keydown(event) {
    if (!settings || !event.altKey || !event.shiftKey || event.code !== 'KeyS') return;
    const node = event.target;
    if (node?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(node?.tagName)) return;
    event.preventDefault();
    try {
      const next = await request('skin:next');
      settings = next; apply();
      notify(t('skins.switched', { name: label('skin', skins.find(skin => skin.id === next.skinId)) }));
    } catch (error) { notify(error.message); }
  }
  window.addEventListener('keydown', keydown, true);
  return {
    update(value) { settings = value; apply(); },
    dispose() {
      unsubscribe(); window.removeEventListener('keydown', keydown, true);
      cancelAnimationFrame(layoutFrame); clearEntrance(); stylesheet?.remove();
      document.documentElement.removeAttribute('data-ytc-skin');
    },
  };
}
