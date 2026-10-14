import { t } from './i18n.js';

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return; } catch { /* Fullscreen player may lack focus. */ }
  const field = document.createElement('textarea');
  field.value = text;
  field.style.cssText = 'position:fixed;left:-9999px;top:0';
  (document.fullscreenElement || document.body).append(field);
  const previous = document.activeElement;
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  previous?.focus?.({ preventScroll: true });
  if (!copied) throw new Error(t('error.copyFailed'));
}
