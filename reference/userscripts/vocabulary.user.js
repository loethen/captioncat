// ==UserScript==
// @name         YouTube 字幕单词点击收集器
// @namespace    https://tampermonkey.net/
// @version      2.0
// @description  点击 YouTube 字幕单词收录，极简胶囊 + 智能展开/隐藏，一键复制复习 Prompt
// @match        *://www.youtube.com/*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const wordSet = new Set();
    let pinned = false;
    let hoverTimer = null;
    let flashTimer = null;

    // ---------- 样式 ----------
    GM_addStyle(`
        /* 字幕可点击 */
        .ytp-caption-window-container, .ytp-caption-window-bottom,
        .caption-window, .ytp-caption-segment {
            pointer-events: auto !important;
            user-select: text !important;
        }
        .ytp-caption-segment { cursor: pointer !important; }

        /* 胶囊 + 面板 */
        #ytv {
            position: absolute; top: 12px; right: 12px; z-index: 99999;
            padding-bottom: 8px;               /* 保证悬停区域连续 */
            font: 12px/1.4 -apple-system, "Segoe UI", sans-serif;
            color: #fff; text-align: right;
            transition: opacity .25s;
        }
        /* 跟随播放器控制栏：控制栏隐藏时淡出 */
        #movie_player.ytp-autohide #ytv:not(.flash):not(.open) { opacity: 0; pointer-events: none; }

        #ytv .pill {
            display: inline-block; cursor: pointer;
            padding: 4px 10px; border-radius: 999px;
            background: rgba(20,20,20,.55); backdrop-filter: blur(8px);
            opacity: .6; transition: opacity .2s, background .2s;
            white-space: nowrap;
        }
        #ytv:hover .pill, #ytv.open .pill, #ytv.flash .pill { opacity: 1; }
        #ytv.flash .pill { background: rgba(34,197,94,.85); }

        #ytv .card {
            display: none; margin-top: 6px; width: 220px; text-align: left;
            padding: 10px; border-radius: 10px;
            background: rgba(20,20,20,.88); backdrop-filter: blur(12px);
        }
        #ytv.open .card { display: block; }

        #ytv .list { display: flex; flex-wrap: wrap; gap: 4px; max-height: 120px; overflow-y: auto; }
        #ytv .chip {
            padding: 1px 7px; border-radius: 4px; cursor: pointer;
            background: rgba(255,255,255,.12);
        }
        #ytv .chip:hover { background: rgba(239,68,68,.6); text-decoration: line-through; }
        #ytv .empty { opacity: .5; }

        #ytv .bar { display: flex; justify-content: space-between; margin-top: 8px; }
        #ytv .bar span { cursor: pointer; opacity: .75; }
        #ytv .bar span:hover { opacity: 1; }
        #ytv .bar .copy { color: #60a5fa; font-weight: 600; }
    `);

    // ---------- DOM（不用 innerHTML，避免 Trusted Types） ----------
    const mk = (tag, cls, text) => {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    };

    const root = mk('div'); root.id = 'ytv';
    const pill = mk('div', 'pill', 'Aa');
    const card = mk('div', 'card');
    const list = mk('div', 'list');
    const bar = mk('div', 'bar');
    const clearBtn = mk('span', '', '清空');
    const copyBtn = mk('span', 'copy', '复制');
    bar.append(clearBtn, copyBtn);
    card.append(list, bar);
    root.append(pill, card);

    // 阻止面板上的操作冒泡到播放器（否则会触发暂停）
    ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'contextmenu'].forEach(t =>
        root.addEventListener(t, e => e.stopPropagation())
    );

    // ---------- 挂载到播放器内（全屏也可见） ----------
    function mount() {
        const player = document.getElementById('movie_player');
        if (player && root.parentNode !== player) player.appendChild(root);
    }
    mount();
    setInterval(mount, 1000);
    window.addEventListener('yt-navigate-finish', mount);

    // ---------- 渲染 ----------
    function setPill(text) { pill.textContent = text; }
    function idlePill() { setPill(wordSet.size ? `Aa ${wordSet.size}` : 'Aa'); }

    function render() {
        idlePill();
        list.replaceChildren();
        if (!wordSet.size) {
            list.appendChild(mk('span', 'empty', '点击字幕单词即可收录'));
            return;
        }
        wordSet.forEach(w => {
            const chip = mk('span', 'chip', w);
            chip.title = '点击删除';
            chip.onclick = () => { wordSet.delete(w); render(); };
            list.appendChild(chip);
        });
    }
    render();

    // ---------- 智能展开 / 收起 ----------
    function open()  { clearTimeout(hoverTimer); root.classList.add('open'); }
    function close() {
        if (pinned) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => root.classList.remove('open'), 600);
    }
    root.addEventListener('mouseenter', open);
    root.addEventListener('mouseleave', close);
    pill.addEventListener('click', () => {
        pinned = !pinned;
        pinned ? open() : root.classList.remove('open');
    });

    // 新增单词时：胶囊短暂闪现 "+ word"
    function flash(word) {
        clearTimeout(flashTimer);
        root.classList.add('flash');
        setPill('+ ' + word);
        flashTimer = setTimeout(() => {
            root.classList.remove('flash');
            idlePill();
        }, 1500);
    }

    // ---------- 取词 ----------
    function getWordAtPoint(x, y) {
        let node, offset;
        if (document.caretPositionFromPoint) {
            const p = document.caretPositionFromPoint(x, y);
            if (!p) return null;
            node = p.offsetNode; offset = p.offset;
        } else if (document.caretRangeFromPoint) {
            const r = document.caretRangeFromPoint(x, y);
            if (!r) return null;
            node = r.startContainer; offset = r.startOffset;
        } else return null;

        if (!node || node.nodeType !== Node.TEXT_NODE) return null;
        const text = node.textContent || '';
        let s = offset, e = offset;
        while (s > 0 && /[a-zA-Z'-]/.test(text[s - 1])) s--;
        while (e < text.length && /[a-zA-Z'-]/.test(text[e])) e++;
        const w = text.slice(s, e).replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').toLowerCase();
        return (w.length >= 2 && /^[a-zA-Z'-]+$/.test(w)) ? w : null;
    }

    const isCaption = t => t && t.closest && t.closest('.ytp-caption-segment, .caption-window');

    // 拦截字幕上的按下/抬起，避免触发暂停
    ['pointerdown', 'mousedown', 'mouseup', 'pointerup', 'dblclick'].forEach(type =>
        window.addEventListener(type, e => {
            if (root.contains(e.target)) return;
            if (isCaption(e.target)) e.stopImmediatePropagation();
        }, true)
    );

    window.addEventListener('click', e => {
        if (root.contains(e.target)) return;
        if (!isCaption(e.target)) return;

        e.stopImmediatePropagation();
        e.preventDefault();

        const word = getWordAtPoint(e.clientX, e.clientY);
        if (!word) return;

        const isNew = !wordSet.has(word);
        wordSet.add(word);
        render();
        flash(isNew ? word : word + ' ✓');
    }, true);

    // ---------- 复制 ----------
    copyBtn.addEventListener('click', () => {
        if (!wordSet.size) return;
        const url = location.href.split('&')[0];
        const words = Array.from(wordSet).map((w, i) => `${i + 1}. ${w}`).join('\n');
        const prompt = `把所有单词加入我的复习计划，并生成单词的含义和例句。\n\n${words}\n\n${url}`;

        if (typeof GM_setClipboard !== 'undefined') GM_setClipboard(prompt);
        else navigator.clipboard.writeText(prompt);

        copyBtn.textContent = '已复制 ✓';
        setTimeout(() => { copyBtn.textContent = '复制'; }, 1200);
    });

    // ---------- 清空 ----------
    clearBtn.addEventListener('click', () => { wordSet.clear(); render(); });
})();