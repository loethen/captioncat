import './styles.css';
import { bindSettingsForm } from './settings-form.js';
import { request } from '../shared/messages.js';
import { videoContext } from '../shared/text.js';
import { plural, t } from '../shared/i18n.js';

bindSettingsForm({ onLocale: pageStatus });
document.querySelector('#open-options').addEventListener('click', () => chrome.runtime.openOptionsPage());
async function pageStatus() {
  const node = document.querySelector('#page-status');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const video = tab?.url && videoContext(tab.url, tab.title);
    if (!video) { node.textContent = t('popup.noVideo'); return; }
    const words = await request('words:get');
    node.textContent = plural('popup.collected', words[video.id]?.words.length || 0);
  } catch { node.textContent = t('popup.fallback'); }
}
pageStatus();
