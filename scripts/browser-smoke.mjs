// Optional integration check. Install playwright locally, or set PLAYWRIGHT_MODULE
// to an existing package path. BROWSER_EXECUTABLE may point to Chromium / Chrome for Testing.
import { createRequire } from 'node:module';
import { readFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('..', import.meta.url));
const profile = await mkdtemp(`${tmpdir()}/ytc-extension-test-`);
const context = await chromium.launchPersistentContext(profile, {
  headless: true, channel: 'chromium', executablePath: process.env.BROWSER_EXECUTABLE,
  ignoreDefaultArgs: ['--disable-extensions'],
  args: ['--headless=new', `--disable-extensions-except=${root}/dist`, `--load-extension=${root}/dist`],
  viewport: { width: 1100, height: 800 },
});
const errors = [], results = [];
const captureErrors = page => page.on('pageerror', error => errors.push(error.message));
context.on('page', captureErrors);
function pass(name) { results.push(name); console.log(`✓ ${name}`); }
try {
  const fixture = await readFile(`${root}/tests/fixtures/youtube.html`, 'utf8');
  await context.route('https://www.youtube.com/**', route => route.fulfill({ body: fixture, contentType: 'text/html', headers: { 'Content-Security-Policy': "require-trusted-types-for 'script'" } }));
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const id = new URL(worker.url()).host;
  await worker.evaluate(() => {
    globalThis.translationRequests = 0;
    globalThis.fetch = async url => {
      globalThis.translationRequests++;
      const text = new URL(url).searchParams.get('q');
      // Delay one sentence to check stale-response invalidation.
      if (text === 'old sentence') await new Promise(resolve => setTimeout(resolve, 450));
      return new Response(JSON.stringify([[[text === 'old sentence' ? '旧结果' : `译文：${text}`]]]), { headers: { 'Content-Type': 'application/json' } });
    };
  });
  const page = await context.newPage(); captureErrors(page);
  await page.goto('https://www.youtube.com/watch?v=fixture_a');
  await page.waitForFunction(() => document.documentElement.dataset.ytcSkin === 'wa-light');
  await page.waitForFunction(() => document.querySelector('.ytc-mascot-art')?.naturalWidth > 0);
  assert.equal(await page.locator('.ytc-mascot').count(), 1); pass('MV3 injection and packaged mascot assets with Trusted Types enabled');
  await page.locator('.ytp-caption-segment').hover();
  await page.waitForFunction(() => document.querySelector('video').paused);
  await page.waitForFunction(() => document.querySelector('.ytc-translation')?.textContent.startsWith('译文：'));
  assert.equal(await page.locator('.ytc-translation').isVisible(), true); pass('hover translates and pauses a playing video');
  await page.mouse.move(5, 5);
  await page.waitForFunction(() => !document.querySelector('video').paused);
  assert.equal(await page.locator('.ytc-translation').isVisible(), false); pass('leaving captions hides translation and restores playback');
  await page.evaluate(() => document.querySelector('video').pause());
  await page.locator('.ytp-caption-segment').hover(); await page.waitForFunction(() => document.querySelector('.ytc-translation')?.style.display === 'block');
  await page.mouse.move(5, 5); assert.equal(await page.locator('video').evaluate(video => video.paused), true); pass('a video paused by the user stays paused');
  const point = await page.locator('.ytp-caption-segment').evaluate(node => {
    const index = node.firstChild.textContent.indexOf('curiosity'), range = document.createRange();
    range.setStart(node.firstChild, index); range.setEnd(node.firstChild, index + 9);
    const rect = range.getBoundingClientRect(); return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  await page.mouse.click(point.x, point.y);
  await page.waitForFunction(() => document.querySelector('.ytc-word-chip')?.textContent === 'curiosity');
  assert.equal(await page.evaluate(() => window.playerClickCount || 0), 0); pass('clicking the exact word persists it without triggering the player');
  await page.mouse.click(point.x, point.y);
  assert.equal(await page.locator('.ytc-word-chip').count(), 1); pass('repeated word clicks deduplicate');
  await page.locator('.ytc-word-chip').focus(); await page.keyboard.press('Escape');
  assert.equal(await page.locator('.ytc-word-card').isVisible(), false); pass('Escape closes the vocabulary panel and returns focus to its button');
  await page.mouse.move(5, 5);
  await page.keyboard.press('Alt+Shift+S'); await page.waitForFunction(() => !document.documentElement.hasAttribute('data-ytc-skin')); pass('skin shortcut switches and persists');
  const options = await context.newPage(); captureErrors(options); await options.goto(`chrome-extension://${id}/options.html`);
  await options.locator('#skin').selectOption('wa-light');
  await page.waitForFunction(() => document.documentElement.dataset.ytcSkin === 'wa-light');
  await options.locator('#mascot').uncheck(); await page.waitForFunction(() => getComputedStyle(document.querySelector('.ytc-mascot')).display === 'none');
  await options.locator('#mascot').check(); await page.waitForFunction(() => getComputedStyle(document.querySelector('.ytc-mascot')).display === 'block'); pass('mascot can be disabled within a skin that supports it');
  await options.locator('#skin').selectOption('off');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.ytc-mascot')).display === 'none');
  await options.locator('#skin').selectOption('wa-light');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.ytc-mascot')).display === 'block'); pass('mascot follows only the skins that support it');
  await options.locator('[data-tab="words-panel"]').click();
  await options.waitForFunction(() => document.querySelector('.word-row strong')?.textContent === 'curiosity');
  await options.locator('#word-search').fill('missing-word'); assert.equal(await options.locator('.word-row').count(), 0);
  await options.locator('#word-search').fill('curiosity'); assert.equal(await options.locator('.word-row').count(), 1); pass('word notebook reflects persistent entries and search');
  const downloadEvent = options.waitForEvent('download'); await options.locator('#export-words').click();
  const download = await downloadEvent; assert.equal(download.suggestedFilename(), 'captioncat-vocabulary.json'); pass('word notebook exports JSON');
  await page.reload(); await page.waitForFunction(() => document.querySelector('.ytc-word-chip')?.textContent === 'curiosity'); pass('settings and vocabulary survive page reload');
  await page.mouse.move(5, 5);
  await page.evaluate(() => {
    history.pushState({}, '', '/watch?v=fixture_b');
    document.dispatchEvent(new Event('yt-navigate-finish'));
  });
  await page.waitForFunction(() => !document.querySelector('.ytc-word-chip')); assert.equal(await page.locator('.ytc-mascot').count(), 1); pass('SPA navigation isolates video words and avoids duplicate overlays');
  await page.bringToFront(); await page.locator('#fullscreen').click(); await page.waitForFunction(() => !!document.fullscreenElement);
  await page.locator('.ytp-caption-segment').hover(); await page.waitForFunction(() => document.querySelector('.ytc-translation')?.style.display === 'block');
  assert.equal(await page.locator('.ytc-translation').evaluate(node => document.fullscreenElement.contains(node)), true); pass('translation overlay stays inside the fullscreen player');
  await page.evaluate(() => document.exitFullscreen());
  await page.mouse.move(5, 5);
  await page.evaluate(() => document.querySelector('.ytp-caption-segment').textContent = 'old sentence');
  await page.locator('.ytp-caption-segment').hover();
  await page.waitForFunction(() => document.querySelector('.ytc-translation').textContent === 'Translating…');
  await page.evaluate(() => document.querySelector('.ytp-caption-segment').textContent = 'new sentence');
  await page.waitForFunction(() => document.querySelector('.ytc-translation').textContent === '译文：new sentence');
  await page.waitForTimeout(550); assert.equal(await page.locator('.ytc-translation').textContent(), '译文：new sentence'); pass('late translation responses cannot overwrite refreshed captions');
  await options.locator('[data-tab="translation-panel"]').click(); await options.locator('#translation').uncheck();
  await options.locator('[data-tab="words-panel"]').click(); await options.locator('#vocabulary').uncheck();
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-ytc-interactive'));
  assert.equal(await page.locator('.ytc-vocabulary').isVisible(), false); pass('disabling both learning features restores caption pointer behavior');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForFunction(() => !!document.querySelector('.ytc-mascot-art')?.naturalWidth); pass('reduced motion recreates the renderer safely');
  const popup = await context.newPage(); captureErrors(popup); await popup.goto(`chrome-extension://${id}/popup.html`);
  await popup.locator('#mascot').uncheck(); await page.waitForFunction(() => getComputedStyle(document.querySelector('.ytc-mascot')).display === 'none');
  await popup.locator('#mascot').check(); await page.waitForFunction(() => getComputedStyle(document.querySelector('.ytc-mascot')).display === 'block'); pass('popup settings propagate to existing YouTube pages');
  await popup.locator('#translation').check(); await popup.locator('#vocabulary').check();
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-ytc-interactive'));
  await popup.waitForFunction(() => document.querySelector('#status').textContent === 'Saved');
  await popup.setViewportSize({ width: 370, height: 600 });
  const popupHeight = await popup.evaluate(() => document.body.getBoundingClientRect().height);
  assert.ok(popupHeight <= 600, `popup height: ${popupHeight}`); pass('popup fits the browser height limit including save feedback');
  const screenshots = `${root}/docs/screenshots`; await mkdir(screenshots, { recursive: true });
  await options.locator('[data-tab="appearance"]').click(); await options.screenshot({ path: `${screenshots}/options.png`, fullPage: true });
  await popup.setViewportSize({ width: 370, height: 630 }); await popup.screenshot({ path: `${screenshots}/popup.png` });
  await page.screenshot({ path: `${screenshots}/player-fixture.png` });
  assert.deepEqual(errors, []); pass('all extension pages run without JavaScript errors');
  console.log(`Browser check passed: ${results.length} items (simulated YouTube DOM and translation responses).`);
} catch (error) {
  console.error('Page errors:', errors);
  throw error;
} finally { await context.close(); await rm(profile, { recursive: true, force: true }); }
