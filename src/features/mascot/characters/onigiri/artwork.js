// Preserved original onigiri artwork; behavior lives in ../actions and controller.
  const INK = '#2e2b29', RICE = '#fdfbf6', NORI = '#2c3a36', VERMILION = '#d8452e', DROP = '#8ec5f0';

  // ───────────── 原创小角色：饭团（暂名）─────────────
  // 每种表情/姿势是一份独立素材，动画写在 SVG 内部。以后想换成视频/Lottie，只需要替换这里。
export function mascotSVG(mood) {
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

export function potSVG() {
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
export function bagSVG() {
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

