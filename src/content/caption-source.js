import { captionText } from '../shared/dom.js';

// One player observer shared by all features. Own overlay mutations are ignored.
export class CaptionSource {
  constructor() {
    this.player = null; this.text = ''; this.segments = []; this.listeners = new Set(); this.mountListeners = new Set(); this.queued = false;
    this.observer = new MutationObserver(records => {
      if (records.every(record => record.target.parentElement?.closest('[data-ytc-overlay]') || record.target instanceof Element && record.target.closest('[data-ytc-overlay]'))) return;
      this.schedule();
    });
    this.navigate = () => this.reconcile(true);
    document.addEventListener('yt-navigate-finish', this.navigate);
    this.timer = setInterval(() => this.reconcile(), 1000);
    this.reconcile();
  }
  subscribe(listener) { this.listeners.add(listener); listener(this.snapshot()); return () => this.listeners.delete(listener); }
  onMount(listener) { this.mountListeners.add(listener); if (this.player) listener(this.player); return () => this.mountListeners.delete(listener); }
  snapshot() { return { player: this.player, text: this.text, segments: this.segments }; }
  reconcile(force = false) {
    const player = document.querySelector('#movie_player');
    if (this.href !== location.href) { force = true; this.href = location.href; }
    if (player !== this.player || force) {
      this.observer.disconnect(); this.player = player;
      if (player) this.observer.observe(player, { childList: true, subtree: true, characterData: true });
      this.mountListeners.forEach(listener => listener(player)); this.refresh();
    }
  }
  schedule() {
    if (this.queued) return;
    this.queued = true;
    requestAnimationFrame(() => { this.queued = false; this.refresh(); });
  }
  refresh() {
    const box = this.player?.querySelector('.ytp-caption-window-container');
    this.segments = box ? [...box.querySelectorAll('.ytp-caption-segment')].filter(segment => segment.textContent.trim()) : [];
    const text = box ? captionText(box) : '';
    const changed = text !== this.text; this.text = text;
    // Notify even for identical text, since YouTube may have replaced the window.
    this.listeners.forEach(listener => listener({ ...this.snapshot(), changed }));
  }
  geometry(sizeEm) {
    const player = this.player;
    if (!player?.isConnected || !this.text || !player.offsetWidth || !player.offsetHeight) return null;
    const playerRect = player.getBoundingClientRect();
    if (!playerRect.width || !playerRect.height) return null;
    const scaleX = playerRect.width / player.offsetWidth, scaleY = playerRect.height / player.offsetHeight;
    let first, last, firstElement;
    for (const segment of this.segments) {
      const rect = segment.getBoundingClientRect();
      if (!rect.width || !rect.height || getComputedStyle(segment).visibility === 'hidden') continue;
      if (!first || rect.top < first.top) { first = rect; firstElement = segment; }
      if (!last || rect.bottom > last.bottom) last = rect;
    }
    if (!first) return null;
    const fs = parseFloat(getComputedStyle(firstElement).fontSize) || 20;
    const size = Math.min(fs * sizeEm, player.offsetWidth * 0.25);
    const inset = fs * 0.9;
    const x0 = Math.max(0, Math.min(player.offsetWidth - size, (first.left - playerRect.left) / scaleX + inset));
    return {
      fs, size, x0, span: Math.max(0, Math.min(first.width / scaleX - 2 * inset - size, player.offsetWidth - size - x0)),
      perchY: Math.max(0, (first.top - playerRect.top) / scaleY - size + fs * 0.06),
      groundY: Math.max(0, Math.min(player.offsetHeight - size, (last.bottom - playerRect.top) / scaleY - size + fs * 0.06)),
    };
  }
  dispose() { clearInterval(this.timer); this.observer.disconnect(); document.removeEventListener('yt-navigate-finish', this.navigate); this.listeners.clear(); this.mountListeners.clear(); }
}
