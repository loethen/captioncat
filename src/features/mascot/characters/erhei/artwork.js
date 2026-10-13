// Preserved original 二黑 pixel artwork; behavior lives in ../actions and controller.
// scripts/generate-assets.mjs bakes every pose into an SVG whose frames switch every 120ms.
const K = '#1c1a20', FAR = '#3a3846', FW = '#cfcdc4', WT = '#fbfaf6', PK = '#ff8fa8', AM = '#f2a81d';
const GR = '#6fae4a', GL = '#a6d37c', BL = '#8ec5f0', VR = '#d8452e', OL = '#9d9bbb', MR = '#7a2f3d', WH = '#e6e8f5';

// ───────────── 二黑：像素小黑猫（警长配色，胖） ─────────────
// 像素画 48×30，每个姿势按帧号画一张，动画靠切换帧。
const SW = 48, SH = 30, FRAMES = 24, FRAME_MS = 120;   // 24 是 4、8、12、2 的公倍数，所有动画循环都能接上
// 输出画布是 48×48 的正方形（角色框按正方形计算），猫贴着底边，脚下留一行给描边。
const VIEW_BOX = `0 ${SH - 1 - SW} ${SW} ${SW}`;
const GLY = {
  '?': ['.###.', '#...#', '..##.', '.....', '..#..'],
  '!': ['..#..', '..#..', '..#..', '.....', '..#..'],
  'h': ['.#.#.', '#####', '#####', '.###.', '..#..'],
  'n': ['..###', '..#.#', '..#..', '.##..', '.##..'],
  'z': ['.###.', '...#.', '..#..', '.#...', '.###.'],
};
const EYE = { stand: 'n', walk: 'n', ask: 'n', wow: 'big', happy: 'up', love: 'down', food: 'big', lick: 'down', miss: 'dot', catch: 'up', watch: 'big' };
// 状态名 → 素材名；其余姿势名（walk、lick…）直接就是素材名
const SPRITE = { normal: 'stand', nervous: 'miss', sleepy: 'loaf' };

function sprite(pose, f) {
  const grid = Array.from({ length: SH }, () => Array(SW).fill(null));
  const R = (a, b, w, h, col) => {
    for (let j = Math.max(0, b); j < Math.min(SH, b + h); j++) for (let i = Math.max(0, a); i < Math.min(SW, a + w); i++) grid[j][i] = col;
  };
  const G = (g, gx, gy, col) => GLY[g].forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') R(gx + i, gy + j, 1, 1, col); }));
  const eyeAt = (k, ex, ey, w) => {           // w=5 近处的眼睛，w=4 远处的眼睛
    if (k === 'up' || k === 'down') {
      const u = k === 'up';
      for (let i = 0; i < w; i++) { const m = Math.min(i, w - 1 - i); R(ex + i, ey + (u ? 3 - m : 1 + m), 1, 1, AM); }
      return;
    }
    R(ex, ey + 1, w, 3, AM); R(ex + 1, ey, w - 2, 5, AM);
    if (k === 'dot') { R(ex + (w >> 1), ey + 2, 1, 1, K); return; }
    const pw = k === 'big' ? w - 2 : 2;
    R(ex + ((w - pw) >> 1), ey + 1, pw, 3, K); R(ex + 1, ey + 1, 1, 1, WT);
  };
  const head = (hx, hy, ek, open) => {
    R(hx + 1, hy - 1, 13, 1, K); R(hx, hy, 15, 13, K); R(hx + 1, hy + 13, 13, 1, K);
    R(hx + 1, hy - 2, 4, 2, K); R(hx + 1, hy - 4, 3, 2, K); R(hx + 1, hy - 6, 2, 2, K);       // 左耳
    R(hx + 10, hy - 2, 4, 2, K); R(hx + 11, hy - 4, 3, 2, K); R(hx + 12, hy - 6, 2, 2, K);    // 右耳
    R(hx + 2, hy - 2, 1, 2, PK); R(hx + 11, hy - 2, 1, 2, PK);
    R(hx + 8, hy + 8, 7, 4, WT); R(hx + 9, hy + 12, 5, 1, WT);                                // 白嘴
    R(hx + 12, hy + 8, 2, 1, PK);                                                             // 粉鼻
    if (open) { R(hx + 10, hy + 10, 3, 2, MR); R(hx + 11, hy + 11, 2, 1, PK); }
    eyeAt(ek, hx + 3, hy + 3, 5); eyeAt(ek, hx + 10, hy + 3, 4);
    R(hx + 15, hy + 7, 3, 1, WH); R(hx + 15, hy + 9, 3, 1, WH); R(hx + 16, hy + 6, 2, 1, WH); // 胡须
  };
  const body = (bx, by, bw, bh) => { R(bx + 1, by - 1, bw - 2, 1, K); R(bx, by, bw, bh, K); R(bx + 1, by + bh, bw - 2, 1, K); R(bx + 2, by + bh + 1, bw - 4, 1, K); };
  const leg = (lx, ly, len, col, ft) => { R(lx, ly, 3, len, col); R(lx, ly + len, 3, 2, ft); };
  const tail = pts => pts.forEach(p => R(p[0], p[1], 2, 2, K));
  const ts = [0, 1, 1, 0][f % 4], sw = [-1, 0, 1, 0][f % 4];

  if (pose === 'loaf') {                       // 面包猫（睡觉）
    tail([[3, 21], [2, 19], [2, 17]]); body(5, 17, 26, 8); R(5, 24, 26, 1, K);
    head(26, 13, 'down', false); R(30, 26, 6, 2, WT);
    G('z', 44, 6 - ((f % 8) >> 2), BL);
  } else if (pose === 'crouch') {              // 蓄力，屁股扭扭
    const j = f % 2 ? -1 : 1;
    leg(11 + j, 23, 2, FAR, FW); leg(27, 23, 2, FAR, FW);
    tail([[4 + j, 11], [3 + j, 9], [3 + j, 7], [4 + j, 5]]); body(5, 12, 23, 10); R(23, 17, 5, 5, WT);
    leg(7 + j, 23, 2, K, WT); leg(22, 23, 2, K, WT); head(26, 10, 'big', false);
  } else if (pose === 'pounce') {              // 扑
    tail([[3, 12], [2, 10], [3, 8]]); R(0, 17, 8, 2, K); R(0, 17, 2, 2, WT); body(6, 10, 22, 8); R(24, 13, 4, 4, WT);
    R(38, 17, 5, 2, K); R(42, 17, 3, 2, WT); head(29, 5, 'big', true);
  } else {                                     // 站着的各种样子
    const wk = pose === 'walk', by = (wk && f % 2) ? 1 : 0, dy = pose === 'wow' ? -1 : 0, nd = wk ? sw : 0;
    leg(11 - nd, 23, 2, FAR, FW); leg(26 + nd, 23, 2, FAR, FW);
    tail(pose === 'wow' ? [[4, 17], [3, 14], [3, 11], [4, 8], [5, 6]] : [[4, 18], [3, 16], [2, 14], [2, 12], [3 + ts, 10]]);
    body(5, 13 + by + dy, 23, 10);
    R(23, 18 + by + dy, 5, 5, WT); R(14, 22 + by + dy, 9, 2, WT);                              // 白胸、白肚皮
    if (pose === 'wow') [8, 11, 14, 17, 20].forEach(sx => R(sx, 9, 1, 3, K));                  // 炸毛
    leg(7 + nd, 23, 2, K, WT);
    const hy = 6 + by + dy + (pose === 'food' ? 1 : 0);
    if (pose !== 'lick') leg(22 - nd, 23, 2, K, WT);
    let ek = EYE[pose] || 'n'; if (ek === 'n' && f % 12 === 11) ek = 'down';                   // 眨眼
    head(26, hy, ek, pose === 'wow' || pose === 'happy' || pose === 'food');
    if (pose === 'lick') { R(29, hy + 11, 3, 5, K); R(29, hy + 9, 3, 2, WT); }
    if (pose === 'ask') G('?', 43, 0, VR);
    if (pose === 'wow') G('!', 43, 0, VR);
    if (pose === 'love') G('h', 43, 0, VR);
    if (pose === 'happy') G('n', 43, 0, VR);
    if (pose === 'miss') { R(40, 3, 1, 2, BL); R(40, 5, 1, 1, BL); }
    if (pose === 'food') { R(38, hy + 14, 1, 2, BL); R(38, hy + 17 - (f % 4 >> 1), 1, 1, BL); }
    if (pose === 'catch') { const w = f % 2; R(37, hy + 10, 10, 1, GR); R(37, hy + 10, 4, 1, GL); R(45, hy + 9 + w, 2, 1, GR); }
  }
  // 外面描一圈浅色边，黑猫放在任何视频背景上都看得清
  const a = (i, j) => i >= 0 && j >= 0 && i < SW && j < SH && grid[j][i];
  const o = [];
  for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) if (!a(i, j) && (a(i - 1, j) || a(i + 1, j) || a(i, j - 1) || a(i, j + 1))) o.push([i, j]);
  o.forEach(p => { grid[p[1]][p[0]] = OL; });
  return grid;
}

// 每种颜色一条 path，同一行相邻的同色像素合并成一段
function paths(grid) {
  const byColor = new Map();
  grid.forEach((row, j) => {
    for (let i = 0; i < row.length;) {
      const col = row[i]; let w = 1;
      while (i + w < row.length && row[i + w] === col) w++;
      if (col) byColor.set(col, (byColor.get(col) || '') + `M${i} ${j}h${w}v1h-${w}z`);
      i += w;
    }
  });
  return [...byColor].map(([col, d]) => `<path fill='${col}' d='${d}'/>`).join('');
}

export function catSVG(state) {
  const key = SPRITE[state] || state;
  const images = [], shown = [];               // 去重后的画面，以及每一帧显示哪一张
  for (let f = 0; f < FRAMES; f++) {
    const art = paths(sprite(key, f));
    let index = images.indexOf(art);
    if (index < 0) index = images.push(art) - 1;
    shown.push(index);
  }
  const open = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${VIEW_BOX}' shape-rendering='crispEdges'>`;
  if (images.length === 1) return `${open}${images[0]}</svg>\n`;
  const keyframes = images.map((_, index) => {
    const stops = shown.map((value, f) => (f === 0 || (value === index) !== (shown[f - 1] === index))
      ? `${+(f / FRAMES * 100).toFixed(3)}%{visibility:${value === index ? 'visible' : 'hidden'}}` : '').join('');
    return `@keyframes f${index}{${stops}}.f${index}{animation-name:f${index}}`;
  }).join('');
  const style = `g{visibility:hidden;animation:${FRAMES * FRAME_MS}ms step-end infinite}.f${shown[0]}{visibility:visible}${keyframes}@media (prefers-reduced-motion:reduce){g{animation:none}}`;
  return `${open}<style>${style}</style>${images.map((art, index) => `<g class='f${index}'>${art}</g>`).join('')}</svg>\n`;
}

// 激光红点：亮芯加一圈光晕
export function dotSVG() {
  const d = `<path fill='${VR}' opacity='.35' d='M2 0h2v6h-2zM0 2h6v2h-6z'/><path fill='${VR}' d='M2 1h2v4h-2zM1 2h4v2h-4z'/><path fill='#ffd9d2' d='M2 2h2v2h-2z'/>`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 6' shape-rendering='crispEdges'>${d}</svg>\n`;
}

// 逗猫草：一根细长的绿叶片（尖端在左，往右下弯）
export function bladeSVG() {
  const light = [], dark = [];
  for (let i = 0; i < 46; i++) (i % 5 < 2 ? light : dark).push(`M${i} ${Math.floor(i * i / 260)}h1v2h-1z`);
  const d = `<path fill='${GL}' d='${light.join('')}'/><path fill='${GR}' d='${dark.join('')}'/>`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 46 10' shape-rendering='crispEdges'>${d}</svg>\n`;
}
