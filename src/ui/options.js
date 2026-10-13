import './styles.css';
import { bindSettingsForm, status } from './settings-form.js';
import { request, watchStorage } from '../shared/messages.js';
import { WORDS_KEY } from '../shared/settings.js';
import { element } from '../shared/dom.js';
import { reviewPrompt } from '../shared/text.js';
import { copyText } from '../shared/clipboard.js';

bindSettingsForm();
let all = {}, revision = 0;
for (const button of document.querySelectorAll('[data-tab]')) button.addEventListener('click', () => {
  for (const tab of document.querySelectorAll('[data-tab]')) { const active = button === tab; tab.classList.toggle('active', active); tab.setAttribute('aria-pressed', String(active)); }
  for (const panel of document.querySelectorAll('.tab-panel')) panel.hidden = panel.id !== button.dataset.tab;
  status('');
});
function renderWords() {
  const search = document.querySelector('#word-search').value.trim().toLowerCase();
  const container = document.querySelector('#video-list'); container.replaceChildren();
  const videos = Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt);
  const count = videos.reduce((sum, video) => sum + video.words.length, 0);
  document.querySelector('#word-count').textContent = count;
  document.querySelector('#export-words').disabled = !count;
  for (const video of videos) {
    const matchingTitle = video.title.toLowerCase().includes(search);
    const words = video.words.filter(item => matchingTitle || item.word.includes(search));
    if (!words.length) continue;
    const entry = element('article', 'video-entry');
    const heading = element('div', 'video-heading');
    const link = element('a', '', video.title || video.id); link.href = video.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    heading.append(link);
    entry.append(heading, element('p', 'video-meta', `${video.words.length} 个单词`));
    for (const item of words) {
      const row = element('div', 'word-row');
      const remove = element('button', '', '×'); remove.setAttribute('aria-label', `删除 ${item.word}`);
      remove.addEventListener('click', async () => {
        try { await request('words:remove', { videoId: video.id, word: item.word }); } catch (error) { status(error.message, true); }
      });
      row.append(element('strong', '', item.word), element('p', '', item.caption), remove); entry.append(row);
    }
    const controls = element('div', 'video-actions');
    const copy = element('button', '', '复制复习 Prompt');
    copy.addEventListener('click', async () => {
      try { await copyText(reviewPrompt(video.words, video.url)); status('复习 Prompt 已复制'); } catch (error) { status(error.message, true); }
    });
    const clear = element('button', '', '清空此视频');
    clear.addEventListener('click', async () => {
      try { await request('words:clear-video', { videoId: video.id }); } catch (error) { status(error.message, true); }
    });
    controls.append(copy, clear); entry.append(controls); container.append(entry);
  }
  if (!container.children.length) container.append(element('p', 'empty', search ? '没有找到匹配的单词或视频。' : '还没有单词。打开 YouTube 视频，点击英文字幕中的单词开始收集。'));
}
document.querySelector('#word-search').addEventListener('input', renderWords);
document.querySelector('#export-words').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), videos: Object.values(all) }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = element('a');
  link.href = url; link.download = 'youtube-vocabulary.json'; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); status('单词本已导出');
});
document.querySelector('#clear-cache').addEventListener('click', async event => {
  const button = event.currentTarget; button.disabled = true;
  try { await request('translation:clear'); status('翻译缓存已清除'); } catch (error) { status(error.message, true); }
  finally { button.disabled = false; }
});
watchStorage(WORDS_KEY, value => { revision++; all = value || {}; renderWords(); });
const initialRevision = revision;
request('words:get').then(value => { if (revision === initialRevision) { all = value; renderWords(); } }).catch(error => status(error.message, true));
