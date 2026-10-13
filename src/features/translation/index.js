import { element, captionWindow, captionText, clamp } from '../../shared/dom.js';
import { isMostlyChinese } from '../../shared/text.js';
import { request } from '../../shared/messages.js';

export function createTranslationFeature(source) {
  const tip = element('div', 'ytc-translation');
  tip.dataset.ytcOverlay = ''; tip.setAttribute('role', 'status');
  let settings, hovered = null, displayedText = '', timer, requestId = 0, pausedVideo = null, pausedUrl = '';
  const mount = source.onMount(player => { hide(false); if (player) player.append(tip); else tip.remove(); });

  function place() {
    const player = source.player;
    if (!player || !hovered?.isConnected) return;
    const pr = player.getBoundingClientRect(), wr = hovered.getBoundingClientRect();
    const scaleX = pr.width / player.offsetWidth || 1, scaleY = pr.height / player.offsetHeight || 1;
    const width = tip.offsetWidth, height = tip.offsetHeight;
    const left = clamp((wr.left - pr.left + wr.width / 2) / scaleX - width / 2, 8, player.offsetWidth - width - 8);
    let top = (wr.top - pr.top) / scaleY - height - 8;
    if (top < 8) top = (wr.bottom - pr.top) / scaleY + 8;
    tip.style.left = `${left}px`; tip.style.top = `${clamp(top, 8, player.offsetHeight - height - 8)}px`;
  }
  function resume() {
    const video = pausedVideo; pausedVideo = null;
    if (video?.isConnected && video.paused && !video.ended && pausedUrl === location.href) video.play().catch(() => {});
    pausedUrl = '';
  }
  function hide(shouldResume = true) {
    clearTimeout(timer); requestId++; hovered = null; displayedText = ''; tip.style.display = 'none';
    if (shouldResume) resume(); else pausedVideo = null;
  }
  async function show() {
    if (!hovered?.isConnected || !settings?.enabled) return hide();
    const text = captionText(hovered);
    if (!text || /^zh/.test(settings.targetLanguage) && isMostlyChinese(text)) { tip.style.display = 'none'; displayedText = text; return; }
    displayedText = text;
    const id = ++requestId;
    tip.textContent = '翻译中…'; tip.classList.add('ytc-loading'); tip.style.display = 'block'; place();
    try {
      const translated = await request('translation:translate', { text });
      if (id !== requestId || !hovered) return;
      tip.textContent = translated;
    } catch (error) { if (id !== requestId || !hovered) return; tip.textContent = error.message; }
    tip.classList.remove('ytc-loading'); place();
  }
  function schedule() {
    clearTimeout(timer); requestId++; tip.style.display = 'none';
    timer = setTimeout(show, settings.delay);
  }
  function mouseover(event) {
    if (!settings?.enabled) return;
    const win = captionWindow(event.target);
    if (!win || !source.player?.contains(win) || hovered === win) return;
    if (hovered) hide();
    hovered = win;
    if (settings.pauseOnHover) {
      const video = source.player.querySelector('video');
      if (video && !video.paused && !video.ended) { pausedVideo = video; pausedUrl = location.href; video.pause(); }
    }
    schedule();
  }
  function mouseout(event) {
    if (!hovered || hovered.contains(event.relatedTarget instanceof Node ? event.relatedTarget : null)) return;
    if (captionWindow(event.target) === hovered) hide();
  }
  // Explicit player interaction transfers playback ownership back to the user.
  function playbackIntent(event) {
    if (pausedVideo && (event.type === 'keydown' && ['Space', 'KeyK', 'MediaPlayPause'].includes(event.code) || event.type === 'pointerdown' && source.player?.contains(event.target) && !captionWindow(event.target))) pausedVideo = null;
  }
  const unsubscribe = source.subscribe(() => {
    if (!hovered) return;
    if (!hovered.isConnected || !source.player?.contains(hovered)) return hide();
    const text = captionText(hovered);
    if (text !== displayedText) { displayedText = text; schedule(); }
  });
  const resize = () => place();
  document.addEventListener('mouseover', mouseover, true); document.addEventListener('mouseout', mouseout, true);
  window.addEventListener('pointerdown', playbackIntent, true); window.addEventListener('keydown', playbackIntent, true);
  window.addEventListener('resize', resize); document.addEventListener('fullscreenchange', resize);
  return {
    update(value) { if (JSON.stringify(settings) !== JSON.stringify(value.translation)) hide(); settings = value.translation; },
    dispose() {
      hide(); mount(); unsubscribe(); tip.remove();
      document.removeEventListener('mouseover', mouseover, true); document.removeEventListener('mouseout', mouseout, true);
      window.removeEventListener('pointerdown', playbackIntent, true); window.removeEventListener('keydown', playbackIntent, true);
      window.removeEventListener('resize', resize); document.removeEventListener('fullscreenchange', resize);
    },
  };
}
