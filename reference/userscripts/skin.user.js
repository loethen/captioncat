// ==UserScript==
// @name         YouTube 字幕皮肤（原型）
// @namespace    local.yt-caption-skins
// @version      1.1.0
// @description  给 YouTube 字幕换皮肤：饭团·纸 / 饭团·墨 / 日系视觉小说。Alt+Shift+S 切换。
// @match        https://www.youtube.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  // 字体、字号完全沿用 YouTube 字幕设置，本脚本不去碰。尺寸都用 em，所以会随字号一起缩放。

  // ───────────── 配色：纸、墨，只在角色身上用一点朱红 ─────────────
  const INK = '#2e2b29', RICE = '#fdfbf6', NORI = '#2c3a36', VERMILION = '#d8452e', DROP = '#8ec5f0';

  // ───────────── 角色会根据字幕内容做反应 ─────────────
  // 想加新的触发词，直接往这里写正则就行。按顺序匹配，先匹配到的生效。
  // 注意：YouTube 自动字幕几乎没有标点，所以主要靠关键词和 [Music] 这类标记触发。
  const MOOD_RULES = [
    ['happy',   /\[(music|applause|laughter|laughs|cheering)\]|[♪♫]|\b(haha+|lol|thank you|thanks)\b/],
    ['love',    /\b(love|loved|adorable|cute|beautiful|favorite)\b/],
    ['nervous', /\b(eat|eating|ate|hungry|delicious|yummy|snack|lunch|dinner|breakfast|food|rice)\b/], // 饭团怕被吃
    ['sleepy',  /\b(sleep|sleepy|tired|bed|yawn|boring|exhausted)\b/],
    ['ask',     /\?\s*$|^(what|why|how|who|where|really)\b/],
    ['wow',     /!\s*$|\b(wow|whoa|omg|oh my god|no way|amazing|incredible)\b/],
  ];
  function moodOf(text) {
    const t = text.toLowerCase();
    for (const [mood, re] of MOOD_RULES) if (re.test(t)) return mood;
    return 'normal';
  }

  // ───────────── 原创小角色：饭团（暂名）─────────────
  // 每种表情/姿势是一份独立素材，动画写在 SVG 内部。以后想换成视频/Lottie，只需要替换这里。
  function mascotSVG(mood) {
    const sw = 2.4;
    const eyesNormal = `<g class='e'><ellipse cx='38' cy='53' rx='3.5' ry='4.5' fill='${INK}'/><ellipse cx='62' cy='53' rx='3.5' ry='4.5' fill='${INK}'/><circle cx='39.2' cy='51.3' r='1.3' fill='#fff'/><circle cx='63.2' cy='51.3' r='1.3' fill='#fff'/></g>`;
    const heart = (x, y, s, c, cls) => `<path ${cls ? `class='${cls}' ` : ''}transform='translate(${x} ${y}) scale(${s})' d='M0 4 C-10 -2 -7 -10 0 -5 C7 -10 10 -2 0 4 Z' fill='${c}'/>`;
    const note = (x, y, c) => `<g class='x'><ellipse cx='${x}' cy='${y}' rx='4.5' ry='3.6' fill='${c}'/><path d='M${x + 4} ${y} V${y - 16} Q${x + 13} ${y - 14} ${x + 11} ${y - 6}' stroke='${c}' stroke-width='3' fill='none' stroke-linecap='round'/></g>`;
    const label = (x, y, ch, fill, size) => `<text class='x' x='${x}' y='${y}' font-family='Arial,Helvetica,sans-serif' font-weight='900' font-size='${size || 26}' fill='${fill}' stroke='${INK}' stroke-width='1.2'>${ch}</text>`;

    const eyes = {
      normal: eyesNormal,
      ask: eyesNormal, walk: eyesNormal, cook: eyesNormal, carry: eyesNormal,
      wow: `<ellipse cx='38' cy='52' rx='4.5' ry='5.6' fill='${INK}'/><ellipse cx='62' cy='52' rx='4.5' ry='5.6' fill='${INK}'/><circle cx='39.7' cy='49.9' r='1.8' fill='#fff'/><circle cx='63.7' cy='49.9' r='1.8' fill='#fff'/>`,
      happy: `<path d='M33 55 Q38 47.5 43 55' stroke='${INK}' stroke-width='3' fill='none' stroke-linecap='round'/><path d='M57 55 Q62 47.5 67 55' stroke='${INK}' stroke-width='3' fill='none' stroke-linecap='round'/>`,
      love: heart(38, 53, .62, VERMILION, 'h') + heart(62, 53, .62, VERMILION, 'h'),
      nervous: `<ellipse cx='35.5' cy='54' rx='3' ry='3.8' fill='${INK}'/><ellipse cx='59.5' cy='54' rx='3' ry='3.8' fill='${INK}'/><circle cx='34.6' cy='52.6' r='1.1' fill='#fff'/><circle cx='58.6' cy='52.6' r='1.1' fill='#fff'/>`,
      sleepy: `<path d='M33 53 Q38 58 43 53' stroke='${INK}' stroke-width='3' fill='none' stroke-linecap='round'/><path d='M57 53 Q62 58 67 53' stroke='${INK}' stroke-width='3' fill='none' stroke-linecap='round'/>`,
    }[mood];
    const mouth = {
      normal: `<path d='M45.5 61 Q50 65.5 54.5 61' stroke='${INK}' stroke-width='${sw}' fill='none' stroke-linecap='round'/>`,
      walk: `<path d='M45.5 61 Q50 65.5 54.5 61' stroke='${INK}' stroke-width='${sw}' fill='none' stroke-linecap='round'/>`,
      cook: `<path d='M45.5 61 Q50 65.5 54.5 61' stroke='${INK}' stroke-width='${sw}' fill='none' stroke-linecap='round'/>`,
      carry: `<path d='M44.5 63 Q50 60 55.5 63' stroke='${INK}' stroke-width='${sw}' fill='none' stroke-linecap='round'/>`,
      ask: `<path d='M44.5 63 Q47.2 59.8 50 63 T55.5 63' stroke='${INK}' stroke-width='2.2' fill='none' stroke-linecap='round'/>`,
      wow: `<ellipse cx='50' cy='64' rx='3.5' ry='4.5' fill='#7a2f3d'/>`,
      happy: `<path d='M43 59 Q50 72 57 59 Z' fill='#7a2f3d' stroke='${INK}' stroke-width='2' stroke-linejoin='round'/><ellipse cx='50' cy='65.5' rx='3.4' ry='2' fill='#ff9db0'/>`,
      love: `<path d='M45 61 Q50 67 55 61' stroke='${INK}' stroke-width='${sw}' fill='none' stroke-linecap='round'/>`,
      nervous: `<path d='M43.5 64 Q46 60.5 48.5 64 T53.5 64 T58.5 64' stroke='${INK}' stroke-width='2.2' fill='none' stroke-linecap='round'/>`,
      sleepy: `<ellipse cx='50' cy='63' rx='2.2' ry='2.8' fill='#8a5560'/>`,
    }[mood];
    const extra = {
      normal: '', walk: '', cook: '',
      carry: `<path class='x' d='M83 20 Q88 29 83 33 Q78 29 83 20 Z' fill='${DROP}' stroke='${INK}' stroke-width='1.4' stroke-linejoin='round'/>`,
      ask: label(76, 26, '?', VERMILION),
      wow: label(78, 26, '!', VERMILION) + `<path d='M13 20 L21 27 M7 38 L16 40 M93 38 L85 40' stroke='${VERMILION}' stroke-width='3' stroke-linecap='round'/>`,
      happy: note(74, 26, VERMILION) + note(5, 34, INK),
      love: `<g class='x'>${heart(80, 22, .9, VERMILION)}</g><g class='x2'>${heart(10, 30, .6, VERMILION)}</g>`,
      nervous: `<path class='x' d='M83 20 Q88 29 83 33 Q78 29 83 20 Z' fill='${DROP}' stroke='${INK}' stroke-width='1.4' stroke-linejoin='round'/>`,
      sleepy: `<text class='x' x='72' y='24' font-family='Arial,Helvetica,sans-serif' font-weight='800' font-size='15' fill='${INK}' opacity='.75'>z</text><text class='x2' x='84' y='13' font-family='Arial,Helvetica,sans-serif' font-weight='800' font-size='10' fill='${INK}' opacity='.6'>z</text>`,
    }[mood];
    const bodyAnim = { normal: 'sq 2.6s ease-in-out infinite', ask: 'tilt 2.4s ease-in-out infinite', wow: 'jump .55s ease-in-out infinite', happy: 'sway 1.1s ease-in-out infinite', love: 'sway 2.2s ease-in-out infinite', nervous: 'shake .2s linear infinite', sleepy: 'droop 3.2s ease-in-out infinite', walk: 'waddle .46s ease-in-out infinite', carry: 'waddle .46s ease-in-out infinite', cook: 'sq 1.1s ease-in-out infinite' }[mood];
    const armAnim = { normal: 'wv 6.5s infinite', ask: 'none', wow: 'wv3 .55s ease-in-out infinite', happy: 'wv3 1.1s ease-in-out infinite', love: 'none', nervous: 'wv3 .25s ease-in-out infinite', sleepy: 'none', walk: 'swing .46s ease-in-out infinite', carry: 'none', cook: 'stir .45s ease-in-out infinite' }[mood];
    const armStatic = mood === 'carry' ? 'transform:rotate(-35deg);' : '';
    const walking = mood === 'walk' || mood === 'carry';
    const f1 = walking ? 'step .46s ease-in-out infinite' : 'none';
    const f2 = walking ? 'step .46s ease-in-out .23s infinite' : 'none';
    return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 4 100 100'>
  <style>
  .b{transform-box:fill-box;transform-origin:50% 100%;animation:${bodyAnim}}
  .e{transform-box:fill-box;transform-origin:50% 50%;animation:bl 4.4s infinite}
  .h{transform-box:fill-box;transform-origin:50% 50%;animation:beat .9s ease-in-out infinite}
  .w{transform-origin:84px 64px;animation:${armAnim};${armStatic}}
  .f1{animation:${f1}}
  .f2{animation:${f2}}
  .x{animation:fl 1.4s ease-in-out infinite}
  .x2{animation:fl 1.9s ease-in-out .5s infinite}
  @keyframes sq{0%,100%{transform:scale(1,1)}50%{transform:scale(1.025,.975)}}
  @keyframes tilt{0%,100%{transform:rotate(0)}50%{transform:rotate(-7deg)}}
  @keyframes jump{0%,100%{transform:translateY(0) scale(1.03,.97)}50%{transform:translateY(-7px) scale(.98,1.03)}}
  @keyframes sway{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-1px)}75%{transform:translateX(1px)}}
  @keyframes droop{0%,100%{transform:rotate(0) translateY(0)}50%{transform:rotate(-5deg) translateY(1px)}}
  @keyframes beat{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
  @keyframes bl{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.12)}}
  @keyframes wv{0%,78%,100%{transform:rotate(0)}82%{transform:rotate(-55deg)}86%{transform:rotate(-32deg)}90%{transform:rotate(-55deg)}94%{transform:rotate(-32deg)}97%{transform:rotate(0)}}
  @keyframes wv3{0%,100%{transform:rotate(-20deg)}50%{transform:rotate(-55deg)}}
  @keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  @keyframes waddle{0%,100%{transform:rotate(-4deg) translateY(0)}50%{transform:rotate(4deg) translateY(-2px)}}
  @keyframes step{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
  @keyframes swing{0%,100%{transform:rotate(8deg)}50%{transform:rotate(-14deg)}}
  @keyframes stir{0%,100%{transform:rotate(-42deg)}50%{transform:rotate(-14deg)}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}
  </style>
  <g class='b'>
  <ellipse class='f1' cx='36' cy='97' rx='9' ry='5' fill='${RICE}' stroke='${INK}' stroke-width='${sw}'/>
  <ellipse class='f2' cx='64' cy='97' rx='9' ry='5' fill='${RICE}' stroke='${INK}' stroke-width='${sw}'/>
  <ellipse cx='8' cy='68' rx='6' ry='9' transform='rotate(18 8 68)' fill='${RICE}' stroke='${INK}' stroke-width='${sw}'/>
  <g class='w'><ellipse cx='93' cy='68' rx='6' ry='9' transform='rotate(-18 93 68)' fill='${RICE}' stroke='${INK}' stroke-width='${sw}'/></g>
  <path d='M50 8 C62 8 74 24 88 52 C96 70 92 92 72 94 L28 94 C8 92 4 70 12 52 C26 24 38 8 50 8 Z' fill='${RICE}' stroke='${INK}' stroke-width='${sw}' stroke-linejoin='round'/>
  <rect x='24' y='72' width='52' height='20' rx='4' fill='${NORI}'/>
  <ellipse cx='29' cy='61' rx='5.5' ry='3.4' fill='#ffb3c1' opacity='.8'/>
  <ellipse cx='71' cy='61' rx='5.5' ry='3.4' fill='#ffb3c1' opacity='.8'/>
  ${eyes}
  ${mouth}
  </g>
  ${extra}
  </svg>`;
  }

  function potSVG() {
    return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <style>
  .s{animation:rise 1.6s ease-out infinite}.s2{animation-delay:.5s}.s3{animation-delay:1s}
  @keyframes rise{0%{transform:translateY(8px) scale(.6);opacity:0}30%{opacity:.95}100%{transform:translateY(-16px) scale(1.15);opacity:0}}
  .lid{animation:rattle .5s ease-in-out infinite}
  @keyframes rattle{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.6px)}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}
  </style>
  <g fill='#f4f7f8' stroke='#b9c3c8' stroke-width='1.6'>
  <ellipse class='s' cx='36' cy='38' rx='7' ry='6'/><ellipse class='s s2' cx='52' cy='30' rx='8' ry='7'/><ellipse class='s s3' cx='67' cy='38' rx='6.5' ry='5.5'/>
  </g>
  <rect x='4' y='60' width='12' height='7' rx='3.5' fill='#6f747a' stroke='${INK}' stroke-width='2.2'/>
  <rect x='84' y='60' width='12' height='7' rx='3.5' fill='#6f747a' stroke='${INK}' stroke-width='2.2'/>
  <path d='M14 56 H86 V80 Q86 92 74 92 H26 Q14 92 14 80 Z' fill='#7b8187' stroke='${INK}' stroke-width='2.4' stroke-linejoin='round'/>
  <path d='M22 66 V82' stroke='#fff' stroke-opacity='.35' stroke-width='3' stroke-linecap='round'/>
  <g class='lid'><path d='M18 56 Q50 36 82 56 Z' fill='#9aa0a6' stroke='${INK}' stroke-width='2.4' stroke-linejoin='round'/><circle cx='50' cy='43' r='3.4' fill='${VERMILION}' stroke='${INK}' stroke-width='1.8'/></g>
  </svg>`;
  }
  function bagSVG() {
    return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <style>
  .sw{transform-origin:50px 22px;animation:swing2 .9s ease-in-out infinite}
  @keyframes swing2{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
  .st{animation:wig 1.2s ease-in-out infinite}
  @keyframes wig{0%,100%{transform:translateY(0);opacity:.9}50%{transform:translateY(-3px);opacity:.5}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}
  </style>
  <g class='st' fill='none' stroke='#8d9a94' stroke-width='2.2' stroke-linecap='round'><path d='M36 12 q4 -4 0 -8'/><path d='M50 10 q4 -4 0 -8'/><path d='M64 12 q4 -4 0 -8'/></g>
  <g class='sw'>
  <path d='M30 44 Q20 66 33 84 Q50 97 67 84 Q80 66 70 44 Q62 34 50 34 Q38 34 30 44 Z' fill='#5f7a6e' stroke='${INK}' stroke-width='2.6' stroke-linejoin='round'/>
  <path d='M43 33 Q50 14 57 33 Z' fill='#5f7a6e' stroke='${INK}' stroke-width='2.6' stroke-linejoin='round'/>
  <path d='M36 56 Q34 68 40 77' stroke='#fff' stroke-opacity='.3' stroke-width='3.4' fill='none' stroke-linecap='round'/>
  </g>
  </svg>`;
  }

  const dataUri = svg => 'data:image/svg+xml,' + encodeURIComponent(svg);
  const MASCOT_SIZE = 2.8; // 角色大小（倍字高）。想更克制就调小，想更突出就调大
  const MOODS = ['normal', 'ask', 'wow', 'happy', 'love', 'nervous', 'sleepy'];  // 由字幕内容触发
  const POSES = ['walk', 'cook', 'carry'];                                        // 做自己的事时的姿势
  const MASCOT = {};
  MOODS.concat(POSES).forEach(m => { MASCOT[m] = dataUri(mascotSVG(m)); });

  // 道具：位置用相对角色的百分比描述（角色朝右时的样子，朝左会自动镜像）
  const PROP = { pot: dataUri(potSVG()), bag: dataUri(bagSVG()) };
  const PROP_BOX = {
    pot: 'left:86%;bottom:0;width:64%;height:64%',
    bag: 'left:74%;bottom:0;width:50%;height:54%',
  };

  // ───────────── 「和」：安静的一块底板 ─────────────
  // 细线、直角、大量留白；好玩的部分全部交给角色（角色是独立元素，见下方「角色控制器」）。
  function waSkin(id, v) {
    const sel = `html[data-ytskin="${id}"]`;
    return `
        ${sel} .ytp-caption-segment {
          background: ${v.bg} !important;
          color: ${v.fg} !important;
          padding: .38em 1em !important;
          margin: .14em 0 !important;
          border-radius: .14em;
          box-shadow: 0 0 0 1px ${v.line}, 0 .45em 1.3em rgba(0,0,0,.28) !important;
          line-height: 1.25 !important;
          font-weight: 500;
        }
        ${sel} .captions-text.ytskin-enter {
          animation: ytskin-wa-in .28s cubic-bezier(.2,.8,.2,1) both;
        }
    `;
  }

  const SKINS = [
    { id: 'off', name: '原版', css: '' },
    { id: 'wa-light', name: '饭团 · 纸', css: waSkin('wa-light', { bg: 'rgba(246,244,238,.97)', fg: '#2b2927', line: 'rgba(43,41,39,.16)' }) },
    { id: 'wa-dark',  name: '饭团 · 墨', css: waSkin('wa-dark',  { bg: 'rgba(34,32,30,.92)',   fg: '#f2efe9', line: 'rgba(255,255,255,.14)' }) },

    {
      id: 'galgame',
      name: '日系视觉小说',
      css: `
        html[data-ytskin="galgame"] .ytp-caption-segment {
          background: linear-gradient(180deg, rgba(255,255,255,.94), rgba(241,244,255,.9)) !important;
          color: #4b3a63 !important;
          padding: .3em 1em !important;
          margin: .3em 0 !important;
          border-radius: .9em;
          box-shadow:
            0 0 0 .1em rgba(255,255,255,.95),
            0 0 0 .2em rgba(255,145,190,.85),
            0 0 0 0 rgba(255,145,190,0),
            0 .5em 1.2em rgba(70,40,110,.35) !important;
          line-height: 1.3 !important;
          font-weight: 600;
        }
        /* 最后一行末尾的"继续"小三角 */
        html[data-ytskin="galgame"] .caption-visual-line:last-child .ytp-caption-segment::after {
          content: "▼";
          display: inline-block;
          margin-left: .7em;
          font-size: .55em;
          color: #ff7aa8;
          vertical-align: .15em;
          animation: ytskin-bob 1.2s ease-in-out infinite;
        }

        @keyframes ytskin-bob {
          0%, 100% { transform: translateY(0); opacity: .55; }
          50%      { transform: translateY(.2em); opacity: 1; }
        }
        @keyframes ytskin-vn-in {
          from { opacity: 0; transform: translateY(.4em) scale(.97); }
          to   { opacity: 1; transform: none; }
        }
        /* 出现时粉色描边闪一下光，然后收掉 */
        @keyframes ytskin-vn-glow {
          from {
            box-shadow:
              0 0 0 .1em rgba(255,255,255,.95),
              0 0 0 .2em rgba(255,145,190,.95),
              0 0 1.2em .25em rgba(255,145,190,.75),
              0 .5em 1.2em rgba(70,40,110,.35);
          }
          to {
            box-shadow:
              0 0 0 .1em rgba(255,255,255,.95),
              0 0 0 .2em rgba(255,145,190,.85),
              0 0 0 0 rgba(255,145,190,0),
              0 .5em 1.2em rgba(70,40,110,.35);
          }
        }
        html[data-ytskin="galgame"] .captions-text.ytskin-enter {
          animation: ytskin-vn-in .26s cubic-bezier(.25,1.3,.5,1) both;
        }
        html[data-ytskin="galgame"] .captions-text.ytskin-enter .ytp-caption-segment {
          animation: ytskin-vn-glow .7s ease-out both;
        }
      `,
    },
  ];

  // ───────────── 公共样式 ─────────────
  const BASE = `

    /* 去掉 YouTube 的窗口底色，并允许阴影画到窗口外面，不被裁掉 */
    html[data-ytskin] .caption-window {
      overflow: visible !important;
      background: none !important;
    }
    html[data-ytskin] .ytp-caption-segment {
      display: inline-block !important;
      box-sizing: border-box;
      text-shadow: none !important;
    }

    @keyframes ytskin-wa-in {
      from { opacity: 0; transform: translateY(.35em); }
      to   { opacity: 1; transform: none; }
    }
    /* 角色：独立于字幕的元素，位置由脚本控制。flip 负责左右朝向，in 负责表情和动作，prop 是道具 */
    #ytskin-mascot {
      position: absolute; left: 0; top: 0; z-index: 58;
      pointer-events: none; display: none; will-change: transform;
    }
    #ytskin-mascot .flip { position: relative; width: 100%; height: 100%; }
    #ytskin-mascot .in {
      width: 100%; height: 100%;
      transform-origin: 50% 100%;
      background: center bottom / contain no-repeat;
    }
    #ytskin-mascot .prop {
      position: absolute; display: none;
      background: center bottom / contain no-repeat;
    }

    #ytskin-toast {
      position: absolute; top: 12%; left: 50%; transform: translateX(-50%);
      z-index: 2147483647; pointer-events: none;
      padding: 6px 14px; border-radius: 999px;
      background: rgba(0,0,0,.65); color: #fff;
      font: 500 14px/1.2 -apple-system, "Segoe UI", Arial, sans-serif;
      opacity: 0; transition: opacity .25s;
    }

    @media (prefers-reduced-motion: reduce) {
      html[data-ytskin] .captions-text,
      html[data-ytskin] .ytp-caption-segment,
      html[data-ytskin] .ytp-caption-segment::after { animation: none !important; }
    }
  `;

  const style = document.createElement('style');
  style.id = 'ytskin-style';
  style.textContent = BASE + SKINS.map(s => s.css).join('\n');
  document.documentElement.appendChild(style);

  // ───────────── 切换逻辑 ─────────────
  let current = GM_getValue('skin', 'wa-light');
  if (!SKINS.some(s => s.id === current)) current = 'wa-light';

  function apply(id, announce) {
    current = id;
    GM_setValue('skin', id);
    if (id === 'off') document.documentElement.removeAttribute('data-ytskin');
    else document.documentElement.setAttribute('data-ytskin', id);
    if (announce) toast('字幕皮肤：' + SKINS.find(s => s.id === id).name);
  }

  function toast(text) {
    const host = document.querySelector('#movie_player') || document.body;
    let t = document.getElementById('ytskin-toast');
    if (!t) { t = document.createElement('div'); t.id = 'ytskin-toast'; }
    host.appendChild(t);
    t.textContent = text;
    t.style.opacity = '1';
    clearTimeout(t._h);
    t._h = setTimeout(() => { t.style.opacity = '0'; }, 1400);
  }

  function next() {
    const i = SKINS.findIndex(s => s.id === current);
    apply(SKINS[(i + 1) % SKINS.length].id, true);
  }

  // ───────────── 角色控制器：独立于字幕存在，有自己的生活 ─────────────
  // YouTube 的字幕是"先向上滚一行、再消失"，不是原地消失，所以：
  //   · 饭团不跟着某一行走，而是站在「字幕上沿的稳定位置」上。滚动动画期间位置一直在变，
  //     它忽略这段；只有位置稳定下来之后真的变了（比如两行变一行）才跳上去/落下来。
  //     于是滚动时行从它脚下滚走、新行接上来，它原地不动，不会每滚一次就起落一次。
  //   · 做自己的事（散步/煮饭/倒垃圾）的间隔很短，且不依赖字幕"安静"。
  //   · 字幕短暂消失（句子之间的停顿）时，事情先暂停；久一点才冒汗，再久才真的掉下去。
  const WORRY_MS = 900;          // 字幕消失多久后，饭团发现脚下没东西了（冒汗，中止手头的事）
  const FALL_MS = 2500;          // 消失多久后才真的掉下去。想让它更少掉，就调大
  const SLEEP_MS = 1500;         // 掉下来之后多久开始打瞌睡
  const HIDE_MS = 8000;          // 多久没有字幕就淡出
  const FIRST_ACT_MS = 1200;     // 字幕出现后多久开始"做自己的事"
  const ACT_GAP = [1200, 3500];  // 两件事之间的间隔（毫秒，随机）
  const WALK_SPEED = 3;          // 走路速度（倍字高/秒）
  const SETTLE_MS = 150;         // 字幕上沿的位置稳定多久，才算"真的移动了"

  // <<CONTROLLER（状态机本身不碰 DOM，所有对外操作都经过 env，方便单独测试）
  function createMascot(env, rand) {
    rand = rand || Math.random;
    let state = 'hidden';            // hidden | perched | resting
    let cur = null, dest = null, ground = null;
    let u = 1;                       // 在字幕上沿的位置：0 = 最左，1 = 最右
    let busy = false, gen = 0;
    let missingSince = null, restSince = 0, sleeping = false, worried = false;
    let act = null, nextActAt = 0, lastKind = '', lastNow = null, contentMood = 'normal';
    let cand = null, candSince = 0, stab = null;   // 字幕上沿的位置：候选值 / 稳定值

    const between = (lo, hi) => lo + rand() * (hi - lo);

    // ── 做自己的事 ──
    function endActivity(now) {
      if (act) { act = null; env.pose(null); env.prop(null); env.override(null); }
      nextActAt = now + between(ACT_GAP[0], ACT_GAP[1]);
    }

    function buildSteps(kind, farEdge) {
      if (kind === 'walk') {
        const steps = [], legs = 2 + Math.floor(rand() * 2);
        for (let i = 0; i < legs; i++) {
          steps.push({ t: 'walk', to: rand() });
          steps.push({ t: 'wait', ms: 300 + rand() * 400 });
        }
        return steps;
      }
      if (kind === 'cook') return [
        { t: 'walk', to: 0.35 + rand() * 0.3 },
        { t: 'pose', pose: 'cook', prop: 'pot', ms: 2600 },
        { t: 'pose', pose: null, mood: 'happy', ms: 900 },     // 煮好了，开心
      ];
      return [                                                 // 倒垃圾
        { t: 'pose', pose: 'carry', prop: 'bag', ms: 300 },
        { t: 'walk', to: farEdge },                            // 提着袋子走到边上
        { t: 'throw' },                                        // 扔出去
        { t: 'pose', pose: null, mood: 'happy', prop: null, ms: 900 },
        { t: 'walk', to: 0.6 + rand() * 0.4 },                 // 走回来
      ];
    }

    function startActivity(info) {
      const roomy = info.span >= info.fs * 4;                  // 字幕太短就只煮饭，不散步
      let kinds = (roomy ? ['walk', 'cook', 'trash'] : ['cook']).filter(k => k !== lastKind);
      if (!kinds.length) kinds = ['cook'];
      const kind = kinds[Math.floor(rand() * kinds.length)];
      lastKind = kind;
      act = { kind, i: 0, t0: null, carrying: false, steps: buildSteps(kind, u < 0.5 ? 1 : 0) };
    }

    function stepActivity(info, now, dt) {
      const st = act.steps[act.i];
      if (!st) { endActivity(now); return; }
      const next = () => { act.i++; act.t0 = null; };
      if (st.t === 'walk') {
        const dxPx = (Math.max(0, Math.min(1, st.to)) - u) * info.span;
        if (info.span < info.fs * 2 || Math.abs(dxPx) < 2) { env.pose(act.carrying ? 'carry' : null); next(); return; }
        const dir = dxPx > 0 ? 1 : -1;
        env.face(dir);
        env.pose(act.carrying ? 'carry' : 'walk');
        u += dir * Math.min(Math.abs(dxPx), WALK_SPEED * info.fs * dt) / info.span;
      } else if (st.t === 'wait') {
        if (act.t0 === null) { act.t0 = now; env.pose(act.carrying ? 'carry' : null); }
        if (now - act.t0 >= st.ms) next();
      } else if (st.t === 'pose') {
        if (act.t0 === null) {
          act.t0 = now;
          env.pose(st.pose);
          env.override(st.mood || null);
          if ('prop' in st) env.prop(st.prop);
          if (st.pose === 'carry') act.carrying = true;
        }
        if (now - act.t0 >= st.ms) next();
      } else if (st.t === 'throw') {
        if (act.t0 === null) { act.t0 = now; act.carrying = false; env.pose(null); env.throwProp(); }
        if (now - act.t0 >= 800) { env.prop(null); next(); }
      }
    }

    // ── 移动（落、跳）。react = 要不要做出夸张的表情（只有掉到地上/跳回去才要）──
    function go(target, kind, react) {
      const my = ++gen;
      busy = true; dest = target;
      env.override(react ? (kind === 'fall' ? 'wow' : 'happy') : null);
      env.move(cur, target, kind, () => {
        if (my !== gen) return;      // 被后来的动作取代了
        busy = false; cur = dest; env.place(cur); env.override(null);
        if (kind === 'fall') env.land();
      });
    }

    function reset() { gen++; busy = false; act = null; worried = false; sleeping = false; cand = stab = null; }

    function tick(now) {
      const dt = lastNow === null ? 0 : Math.min(0.1, (now - lastNow) / 1000);
      lastNow = now;

      if (!env.active()) {
        if (state !== 'hidden') {
          reset(); env.pose(null); env.prop(null); env.override(null); env.hide(); state = 'hidden';
        }
        return;
      }

      const info = env.info();
      if (info) {
        missingSince = null;
        if (worried) { worried = false; env.override(null); }
        if (sleeping) { sleeping = false; env.sleep(false); }
        env.size(info.size);

        // 字幕上沿的位置要"稳定"一小会儿才算数：滚动动画期间它一直在变，饭团不跟着起起落落
        const tol = Math.max(2, info.fs * 0.08);
        if (!cand || Math.abs(info.perchY - cand.perchY) > tol || Math.abs(info.groundY - cand.groundY) > tol) {
          cand = { perchY: info.perchY, groundY: info.groundY }; candSince = now;
        }
        if (!stab || now - candSince >= SETTLE_MS) stab = cand;
        const at = () => ({ x: info.x0 + info.span * u, y: stab.perchY });

        if (state === 'hidden') {
          gen++; busy = false; act = null; env.override(null);
          u = 1; nextActAt = now + FIRST_ACT_MS; stab = cand;
          cur = dest = at(); env.place(cur); env.show(); env.pop(); state = 'perched';
        } else if (state === 'resting') {
          state = 'perched'; nextActAt = now + FIRST_ACT_MS; stab = cand;
          go(at(), 'hop', true);
        } else if (busy) {
          dest = at();               // 动画还没结束，目的地跟着最新位置走
        } else {
          if (act) stepActivity(info, now, dt);
          else if (contentMood === 'normal' && !env.calm() && now >= nextActAt) startActivity(info);
          const target = at();
          const k = dt > 0 ? 1 - Math.exp(-dt * 18) : 1;          // 横向平滑跟随（新字幕宽度不同、散步）
          const next = { x: cur.x + (target.x - cur.x) * k, y: target.y };
          const dy = target.y - cur.y;
          if (Math.abs(dy) > info.fs * 0.6) go(next, dy > 0 ? 'fall' : 'hop', false);  // 真的换了一层：落下去/跳上去
          else { cur = next; env.place(cur); }
        }
        ground = { x: cur.x, y: stab.groundY };

      } else if (state === 'perched') {
        // 没有字幕了。先暂停手头的事（句子之间的停顿很常见）；久一点才冒汗，再久才掉下去
        if (missingSince === null) missingSince = now;
        const gone = now - missingSince;
        if (gone >= WORRY_MS && !worried) { worried = true; endActivity(now); env.override('nervous'); }
        if (gone >= FALL_MS && ground) {
          worried = false; state = 'resting'; restSince = now;
          go(ground, 'fall', true);
        }
      } else if (state === 'resting') {
        if (!sleeping && now - restSince > SLEEP_MS) { sleeping = true; env.sleep(true); }
        if (now - restSince > HIDE_MS) { gen++; busy = false; cand = stab = null; env.fade(); state = 'hidden'; }
      }
    }

    return {
      tick,
      nod() { if (state === 'perched' && !busy && !act) env.nod(); },
      setMood(m) {
        contentMood = m;
        env.setMood(m);
        if (m !== 'normal' && act) endActivity(lastNow || 0);   // 内容里有值得反应的东西：先放下手头的事
      },
    };
  }
  // CONTROLLER>>

  function createMascotEnv() {
    const outer = document.createElement('div');
    outer.id = 'ytskin-mascot';
    const flip = document.createElement('div');
    flip.className = 'flip';
    const inner = document.createElement('div');
    inner.className = 'in';
    const propEl = document.createElement('div');
    propEl.className = 'prop';
    flip.appendChild(inner);
    flip.appendChild(propEl);
    outer.appendChild(flip);

    let mood = 'normal', overrideMood = null, poseName = null, asleep = false, faceDir = 1;
    let size = 0, moveAnim = null, fadeAnim = null, propAnim = null;
    const TEXTY = { ask: 1, wow: 1, sleepy: 1 };   // 带文字符号的素材，镜像会变形，所以不翻转

    const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const canAnimate = () => !reduced() && typeof outer.animate === 'function';
    const tr = p => `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
    const paint = () => {
      const key = asleep ? 'sleepy' : (overrideMood || poseName || mood);
      inner.style.backgroundImage = `url("${MASCOT[key]}")`;
      flip.style.transform = (faceDir < 0 && !TEXTY[key]) ? 'scaleX(-1)' : '';
    };
    const player = () => {
      const p = document.querySelector('#movie_player');
      if (p && outer.parentElement !== p) p.appendChild(outer);
      return p;
    };
    const play = (el, frames, opt) => { if (canAnimate()) el.animate(frames, opt); };

    return {
      active: () => /^wa-/.test(document.documentElement.getAttribute('data-ytskin') || ''),
      calm: () => reduced(),

      // 读取当前字幕的位置：最上面一行的上沿（坐的地方）和最下面一行的下沿（掉下去的地方）
      info() {
        const p = player();
        if (!p) return null;
        const box = p.querySelector('.ytp-caption-window-container');
        if (!box || !box.textContent.trim()) return null;
        let firstEl = null, first = null, last = null;
        box.querySelectorAll('.ytp-caption-segment').forEach(sg => {
          const r = sg.getBoundingClientRect();
          if (!r.width || !r.height) return;
          if (!first || r.top < first.top) { first = r; firstEl = sg; }
          if (!last || r.bottom > last.bottom) last = r;
        });
        if (!first) return null;
        const P = p.getBoundingClientRect();
        const fs = parseFloat(getComputedStyle(firstEl).fontSize) || 20;
        const sz = fs * MASCOT_SIZE;
        const inset = fs * 0.9;
        return {
          fs, size: sz,
          x0: first.left - P.left + inset,                         // 上沿最左能站的位置
          span: Math.max(0, first.width - 2 * inset - sz),         // 能走的距离
          perchY: first.top - P.top - sz + fs * 0.06,
          groundY: last.bottom - P.top - sz + fs * 0.06,
        };
      },

      size(px) { if (px !== size) { size = px; outer.style.width = outer.style.height = px + 'px'; } },
      place(pos) { outer.style.transform = tr(pos); },
      show() {
        if (fadeAnim) { fadeAnim.cancel(); fadeAnim = null; }
        player(); outer.style.opacity = ''; outer.style.display = 'block'; paint();
      },
      hide() {
        if (moveAnim) moveAnim.cancel();
        if (fadeAnim) { fadeAnim.cancel(); fadeAnim = null; }
        outer.style.display = 'none';
      },
      fade() {
        if (!canAnimate()) { outer.style.display = 'none'; return; }
        const a = outer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
        fadeAnim = a;
        a.onfinish = () => { if (fadeAnim === a) outer.style.display = 'none'; };
      },

      move(from, to, kind, done) {
        if (moveAnim) { moveAnim.cancel(); moveAnim = null; }
        if (!canAnimate()) { done(); return; }
        let frames, opt;
        const dist = Math.abs(to.y - from.y);
        if (kind === 'fall') {         // 越掉越快；落一行很快，掉到地上才久一点
          frames = [{ transform: tr(from) }, { transform: tr(to) }];
          opt = { duration: Math.max(170, Math.min(380, 140 + dist * 1.1)), easing: 'cubic-bezier(.5,0,.9,.55)' };
        } else if (kind === 'hop') {   // 抛物线跳上去
          const lift = Math.max(size * 0.35, Math.min(size * 0.9, dist * 0.6));
          const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - lift };
          frames = [
            { transform: tr(from), easing: 'cubic-bezier(.2,.7,.4,1)' },
            { transform: tr(mid), offset: 0.5, easing: 'cubic-bezier(.6,0,.8,.4)' },
            { transform: tr(to) },
          ];
          opt = { duration: Math.max(300, Math.min(520, 280 + dist * 0.8)) };
        } else {                       // 轻轻滑过去
          frames = [{ transform: tr(from) }, { transform: tr(to) }];
          opt = { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' };
        }
        opt.fill = 'forwards';
        const a = outer.animate(frames, opt);
        moveAnim = a;
        a.onfinish = () => { done(); a.cancel(); if (moveAnim === a) moveAnim = null; };
      },

      pop() {
        play(inner, [
          { transform: 'translateY(70%) scale(.55)', opacity: 0 },
          { transform: 'translateY(-8%) scale(1.06)', opacity: 1, offset: 0.6 },
          { transform: 'none', opacity: 1 },
        ], { duration: 500, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      },
      nod() {
        play(inner, [
          { transform: 'none' },
          { transform: 'translateY(6%) scale(1.06, .9)', offset: 0.3 },
          { transform: 'translateY(-14%) scale(.96, 1.06)', offset: 0.6 },
          { transform: 'none' },
        ], { duration: 450, easing: 'ease-out' });
      },
      land() {
        play(inner, [
          { transform: 'scale(1.14, .82)' },
          { transform: 'scale(.97, 1.05)', offset: 0.55 },
          { transform: 'none' },
        ], { duration: 300, easing: 'ease-out' });
      },

      setMood(m) { if (m !== mood) { mood = m; paint(); } },
      override(m) { if (m !== overrideMood) { overrideMood = m; paint(); } },
      sleep(f) { if (f !== asleep) { asleep = f; paint(); } },
      pose(name) { if (name !== poseName) { poseName = name; paint(); } },
      face(dir) { if (dir !== faceDir) { faceDir = dir; paint(); } },

      // 道具：锅、垃圾袋
      prop(name) {
        if (propAnim) { propAnim.cancel(); propAnim = null; }
        if (!name) { propEl.style.display = 'none'; return; }
        propEl.style.cssText = `display:block;${PROP_BOX[name]};background-image:url("${PROP[name]}")`;
      },
      throwProp() {                    // 把袋子抛出去：沿朝向飞出、翻滚、落下、淡出
        if (!canAnimate()) return;
        propAnim = propEl.animate([
          { transform: 'translate(0,0) rotate(0)', opacity: 1 },
          { transform: 'translate(120%,-130%) rotate(220deg)', opacity: 1, offset: 0.4 },
          { transform: 'translate(250%,200%) rotate(540deg)', opacity: 0 },
        ], { duration: 800, easing: 'ease-in-out', fill: 'forwards' });
      },
    };
  }

  const mascot = createMascot(createMascotEnv());
  (function loop(t) { mascot.tick(t); requestAnimationFrame(loop); })(performance.now());

  // ───────────── 入场动效：字幕从"没有"变成"有"的那一刻，底板播放一次 ─────────────
  // 播放完立刻把标记拿掉，这样滚动的自动字幕后续换词时不会重复触发动画。
  let captionVisible = false;
  let lastText = '';
  let lastReact = 0;

  function replay(el, cls, ms) {
    el.classList.remove(cls);
    void el.offsetWidth; // 强制重排，让动画能重新开始
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  }

  function checkCaption() {
    const box = document.querySelector('.ytp-caption-window-container');
    const text = box ? box.textContent.trim() : '';
    const has = text.length > 0;
    const el = has ? box.querySelector('.captions-text') : null;
    const now = Date.now();
    if (el && !captionVisible) {
      replay(el, 'ytskin-enter', 800);          // 字幕刚出现：底板轻轻升起
      lastReact = now;
    } else if (el && text !== lastText && now - lastReact > 2400) {
      mascot.nod();                             // 字幕换了内容：角色点头（最多每 2.4 秒一次）
      lastReact = now;
    }
    mascot.setMood(has ? moodOf(text) : 'normal'); // 角色根据内容换表情
    captionVisible = has;
    lastText = text;
  }

  // YouTube 是单页应用，字幕节点会被反复创建，所以持续跟踪
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; checkCaption(); });
  }).observe(document.documentElement, { childList: true, subtree: true });

  apply(current, false);

  window.addEventListener('keydown', e => {
    if (!(e.altKey && e.shiftKey && e.code === 'KeyS')) return;
    const el = e.target;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    e.preventDefault();
    next();
  }, true);

  SKINS.forEach(s => GM_registerMenuCommand('字幕皮肤：' + s.name, () => apply(s.id, true)));
})();