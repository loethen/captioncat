// ==UserScript==
// @name         YouTube 字幕悬停翻译
// @namespace    https://tampermonkey.net/
// @version      2.0
// @description  悬停在 YouTube 字幕上，整句翻译成中文，移开消失。支持全屏、持久缓存
// @match        https://www.youtube.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      translate.googleapis.com
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ---------- 配置 ----------
    const CFG = {
        target: 'zh-CN',      // 目标语言
        delay: 120,           // 悬停多少毫秒后才翻译
        pauseOnHover: true,  // 悬停时自动暂停视频，移开后恢复
        maxCache: 500,        // 持久缓存条数
    };

    // ---------- 样式 ----------
    GM_addStyle(`
        .ytp-caption-window-container, .caption-window, .ytp-caption-segment {
            pointer-events: auto !important;
        }
        #ytt {
            position: absolute; z-index: 99998; display: none;
            width: max-content; max-width: min(560px, 85%);
            padding: 6px 12px; border-radius: 8px;
            background: rgba(20,20,20,.88); backdrop-filter: blur(8px);
            color: #fff; font: 15px/1.5 -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
            text-align: center; pointer-events: none;
            transition: opacity .15s;
        }
        #ytt.loading { opacity: .6; }
    `);

    // ---------- 持久缓存 ----------
    const CACHE_KEY = 'ytsub_cache_v2';
    const cache = new Map(Object.entries(GM_getValue(CACHE_KEY, {})));
    let saveTimer;
    function cacheSet(k, v) {
        cache.delete(k);
        cache.set(k, v);
        while (cache.size > CFG.maxCache) cache.delete(cache.keys().next().value);
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => GM_setValue(CACHE_KEY, Object.fromEntries(cache)), 2000);
    }

    // ---------- 提示框（挂到播放器内，全屏也可见） ----------
    const tip = document.createElement('div');
    tip.id = 'ytt';

    let player = null;
    function mount() {
        const p = document.getElementById('movie_player');
        if (!p) return;
        if (tip.parentNode !== p) p.appendChild(tip);
        if (p !== player) {
            player = p;
            observer.observe(p, { childList: true, subtree: true, characterData: true });
        }
    }

    // ---------- 翻译 ----------
    let reqId = 0;
    function translate(text, cb) {
        if (cache.has(text)) return cb(cache.get(text));

        const id = ++reqId;
        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${CFG.target}&dt=t&q=${encodeURIComponent(text)}`,
            timeout: 8000,
            onload(res) {
                if (id !== reqId) return;               // 过期请求，丢弃
                try {
                    const data = JSON.parse(res.responseText);
                    const out = data[0].map(i => i[0]).join('');
                    cacheSet(text, out);
                    cb(out);
                } catch { cb(null, '翻译失败'); }
            },
            onerror()   { if (id === reqId) cb(null, '网络错误'); },
            ontimeout() { if (id === reqId) cb(null, '请求超时'); },
        });
    }

    // ---------- 工具 ----------
    const isChinese = t => (t.match(/[\u4e00-\u9fff]/g) || []).length / t.length > 0.3;

    function captionText(win) {
        return [...win.querySelectorAll('.ytp-caption-segment')]
            .map(s => s.textContent).join(' ').replace(/\s+/g, ' ').trim();
    }

    // 把提示框放在字幕上方，放不下就放下方，并限制在播放器范围内
    function place(win) {
        if (!player || !win.isConnected) return;
        const pr = player.getBoundingClientRect();
        const wr = win.getBoundingClientRect();
        const w = tip.offsetWidth, h = tip.offsetHeight;

        let left = wr.left - pr.left + wr.width / 2 - w / 2;
        left = Math.max(8, Math.min(left, pr.width - w - 8));

        let top = wr.top - pr.top - h - 8;
        if (top < 8) top = wr.bottom - pr.top + 8;

        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
    }

    // ---------- 悬停逻辑 ----------
    let hoverWin = null;
    let hoverText = '';
    let timer = null;
    let pausedByUs = false;

    function show(win) {
        const text = captionText(win);
        if (!text || isChinese(text)) return hide();
        hoverText = text;

        tip.style.display = 'block';
        const cached = cache.get(text);
        if (cached) {
            tip.classList.remove('loading');
            tip.textContent = cached;
        } else {
            tip.classList.add('loading');
            tip.textContent = '翻译中…';
        }
        place(win);

        if (!cached) {
            translate(text, (out, err) => {
                if (hoverText !== text) return;          // 字幕已变，忽略
                tip.classList.remove('loading');
                tip.textContent = out || err;
                place(win);
            });
        }
    }

    function hide() {
        clearTimeout(timer);
        hoverWin = null;
        hoverText = '';
        reqId++;                                         // 作废进行中的请求
        tip.style.display = 'none';
        if (pausedByUs) {
            pausedByUs = false;
            document.querySelector('video')?.play();
        }
    }


    document.addEventListener('mouseover', e => {
    const win = e.target.closest?.('.caption-window');
    if (!win) return;

    hoverWin = win;
    clearTimeout(timer);

    // 立即暂停
    if (CFG.pauseOnHover) {
        const v = document.querySelector('video');
        if (v && !v.paused) { v.pause(); pausedByUs = true; }
    }

    // 翻译仍然稍作延迟
    timer = setTimeout(() => show(win), CFG.delay);
}, true);

    document.addEventListener('mouseout', e => {
        if (!hoverWin) return;
        // 在字幕内部元素之间移动不算离开
        if (e.relatedTarget?.closest?.('.caption-window')) return;
        if (e.target.closest?.('.caption-window')) hide();
    }, true);

    // ---------- 字幕刷新时同步（自动字幕会滚动） ----------
    const observer = new MutationObserver(() => {
        if (!hoverWin) return;
        if (!hoverWin.isConnected) return hide();
        const text = captionText(hoverWin);
        if (text !== hoverText) {
            clearTimeout(timer);
            timer = setTimeout(() => hoverWin && show(hoverWin), CFG.delay);
        }
    });

    mount();
    setInterval(mount, 1000);
    window.addEventListener('yt-navigate-finish', () => { hide(); mount(); });
})();