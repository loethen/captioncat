import './styles.css';
import { CaptionSource } from './caption-source.js';
import { createSkinFeature } from '../features/skins/index.js';
import { createMascotFeature } from '../features/mascot/index.js';
import { createTranslationFeature } from '../features/translation/index.js';
import { createVocabularyFeature } from '../features/vocabulary/index.js';
import { request, watchStorage } from '../shared/messages.js';
import { SETTINGS_KEY, normalizeSettings } from '../shared/settings.js';
import { element } from '../shared/dom.js';
import { setLocale } from '../shared/i18n.js';

const instance = '__ytCaptionCompanion';
async function start() {
  if (globalThis[instance]) return;
  setLocale();
  const source = new CaptionSource();
  const toast = element('div', 'ytc-toast'); toast.dataset.ytcOverlay = ''; toast.setAttribute('role', 'status');
  let toastTimer;
  function notify(text) {
    if (!source.player) return;
    source.player.append(toast); toast.textContent = text; toast.classList.add('ytc-toast-visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('ytc-toast-visible'), 1800);
  }
  const features = [createSkinFeature(source, notify), createMascotFeature(source), createTranslationFeature(source), createVocabularyFeature(source, notify)];
  function update(value) {
    const settings = normalizeSettings(value);
    setLocale(settings.uiLanguage);
    document.documentElement.toggleAttribute('data-ytc-interactive', settings.translation.enabled || settings.vocabulary.enabled);
    features.forEach(feature => feature.update(settings));
  }
  let revision = 0;
  const unwatch = watchStorage(SETTINGS_KEY, value => { revision++; update(value); });
  function dispose() {
    features.forEach(feature => feature.dispose()); source.dispose(); unwatch(); clearTimeout(toastTimer); toast.remove();
    document.documentElement.removeAttribute('data-ytc-interactive'); delete globalThis[instance];
  }
  globalThis[instance] = { dispose };
  const initialRevision = revision;
  try { const settings = await request('settings:get'); if (revision === initialRevision) update(settings); } catch (error) { notify(error.message); dispose(); }
}
start();
