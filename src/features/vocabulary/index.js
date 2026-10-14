import { element, stopPlayerEvents, captionWindow, captionText } from '../../shared/dom.js';
import { wordAtOffset, videoContext, reviewPrompt } from '../../shared/text.js';
import { request, watchStorage } from '../../shared/messages.js';
import { WORDS_KEY } from '../../shared/settings.js';
import { copyText } from '../../shared/clipboard.js';

export function getWordAtPoint(x, y, window) {
  const caret = document.caretPositionFromPoint?.(x, y);
  const range = !caret && document.caretRangeFromPoint?.(x, y);
  const node = caret?.offsetNode || range?.startContainer;
  const offset = caret?.offset ?? range?.startOffset;
  if (!node || node.nodeType !== Node.TEXT_NODE || !window.contains(node)) return null;
  const word = wordAtOffset(node.textContent || '', offset);
  if (!word) return null;
  // Caret APIs return the nearest text even for clicks in caption padding.
  // Require a hit inside the actual word's rectangles.
  const match = [...node.textContent.matchAll(/[a-zA-Z]+(?:['’\-][a-zA-Z]+)*/g)].find(item => offset >= item.index && offset <= item.index + item[0].length);
  if (!match) return null;
  const hit = document.createRange();
  hit.setStart(node, match.index); hit.setEnd(node, match.index + match[0].length);
  return [...hit.getClientRects()].some(rect => x >= rect.left - 1 && x <= rect.right + 1 && y >= rect.top && y <= rect.bottom) ? word : null;
}

export function createVocabularyFeature(source, notify) {
  const root = element('div', 'ytc-vocabulary'); root.dataset.ytcOverlay = '';
  const pill = element('button', 'ytc-pill', 'Aa'); pill.type = 'button'; pill.setAttribute('aria-label', '当前视频的单词'); pill.setAttribute('aria-expanded', 'false');
  const card = element('div', 'ytc-word-card');
  const title = element('div', 'ytc-word-heading', '当前视频');
  const list = element('div', 'ytc-word-list');
  const bar = element('div', 'ytc-word-bar');
  const clear = element('button', '', '清空'), copy = element('button', '', '复制复习 Prompt');
  bar.append(clear, copy); card.append(title, list, bar); root.append(pill, card); stopPlayerEvents(root);
  let settings, all = {}, context = videoContext(location.href, document.title), pinned = false, closeTimer, flashTimer, revision = 0, escapeClosing = false;
  const current = () => context && all[context.id];
  function setOpen(value) { root.classList.toggle('ytc-open', value); pill.setAttribute('aria-expanded', String(value)); }
  function render() {
    const words = current()?.words || [];
    if (!root.classList.contains('ytc-flash')) pill.textContent = words.length ? `Aa ${words.length}` : 'Aa';
    list.replaceChildren(); clear.disabled = copy.disabled = !words.length;
    if (!words.length) list.append(element('span', 'ytc-empty', '点击英文字幕中的单词即可收录'));
    for (const item of words) {
      const chip = element('button', 'ytc-word-chip', item.word);
      chip.title = `点击删除 ${item.word}`; chip.setAttribute('aria-label', `删除单词 ${item.word}`);
      chip.addEventListener('click', async () => {
        try { await request('words:remove', { videoId: context.id, word: item.word }); } catch (error) { notify(error.message); }
      });
      list.append(chip);
    }
  }
  const unwatch = watchStorage(WORDS_KEY, value => { revision++; all = value || {}; render(); });
  const initialRevision = revision;
  request('words:get').then(value => { if (initialRevision === revision) { all = value; render(); } }).catch(error => notify(error.message));
  const unmount = source.onMount(player => {
    context = videoContext(location.href, document.title); pinned = false; setOpen(false);
    clearTimeout(flashTimer); root.classList.remove('ytc-flash');
    if (player) player.append(root); else root.remove();
    root.style.display = settings?.vocabulary.enabled && context ? '' : 'none'; render();
  });
  root.addEventListener('mouseenter', () => { clearTimeout(closeTimer); setOpen(true); });
  root.addEventListener('mouseleave', () => { if (!pinned) closeTimer = setTimeout(() => setOpen(false), 600); });
  root.addEventListener('focusin', () => { if (!escapeClosing) setOpen(true); });
  root.addEventListener('focusout', event => { if (!pinned && !root.contains(event.relatedTarget)) setOpen(false); });
  pill.addEventListener('click', () => { pinned = !pinned; setOpen(pinned); });
  root.addEventListener('keydown', event => { if (event.key === 'Escape') { pinned = false; escapeClosing = true; pill.focus(); setOpen(false); escapeClosing = false; } });

  // Leave pointer/mouse down and up to the player so captions stay draggable.
  let downX = 0, downY = 0;
  function pointerdown(event) { downX = event.clientX; downY = event.clientY; }
  function dblclick(event) {
    if (!settings?.vocabulary.enabled || !context || root.contains(event.target)) return;
    const win = captionWindow(event.target);
    if (win && source.player?.contains(win)) event.stopImmediatePropagation();
  }
  async function click(event) {
    if (!settings?.vocabulary.enabled || !context || root.contains(event.target)) return;
    const win = captionWindow(event.target);
    if (!win || !source.player?.contains(win)) return;
    event.stopImmediatePropagation(); event.preventDefault();
    if (Math.hypot(event.clientX - downX, event.clientY - downY) > 4) return;
    const word = getWordAtPoint(event.clientX, event.clientY, win);
    if (!word) return;
    const video = videoContext(location.href, document.title);
    try {
      const result = await request('words:add', { word, ...video, caption: captionText(win) });
      if (context?.id !== video.id) return;
      all[video.id] = result.record; render();
      clearTimeout(flashTimer); root.classList.add('ytc-flash'); pill.textContent = result.added ? `+ ${word}` : `${word} ✓`;
      flashTimer = setTimeout(() => { root.classList.remove('ytc-flash'); render(); }, 1500);
    } catch (error) { notify(error.message); }
  }
  window.addEventListener('pointerdown', pointerdown, true); window.addEventListener('dblclick', dblclick, true);
  window.addEventListener('click', click, true);
  copy.addEventListener('click', async () => {
    if (!current()?.words.length) return;
    try { await copyText(reviewPrompt(current().words, context.url)); notify('复习 Prompt 已复制'); } catch (error) { notify(error.message); }
  });
  clear.addEventListener('click', async () => {
    if (!context) return;
    try { await request('words:clear-video', { videoId: context.id }); } catch (error) { notify(error.message); }
  });
  return {
    update(value) { settings = value; root.style.display = value.vocabulary.enabled && context ? '' : 'none'; },
    dispose() { clearTimeout(closeTimer); clearTimeout(flashTimer); unwatch(); unmount(); root.remove(); window.removeEventListener('pointerdown', pointerdown, true); window.removeEventListener('dblclick', dblclick, true); window.removeEventListener('click', click, true); },
  };
}
