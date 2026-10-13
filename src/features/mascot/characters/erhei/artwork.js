// Preserved original 二黑 pixel artwork; behavior lives in ../actions and controller.
// scripts/generate-assets.mjs bakes every pose into an SVG whose frames switch every 120ms.
const K = '#1c1a20', FAR = '#3a3846', FW = '#cfcdc4', WT = '#fbfaf6', PK = '#ff8fa8', AM = '#f2a81d';
const BX = '#c9a26b', BXD = '#9c7645', CUP = '#f4f6fb', CUPD = '#b9bfd3';
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
const EYE = { stand: 'n', walk: 'n', ask: 'n', wow: 'big', happy: 'up', love: 'down', food: 'big', lick: 'down', miss: 'dot', catch: 'up', watch: 'big', sniff: 'dot', achoo: 'up', yawn: 'up', peer: 'big' };
const HEAD_DY = { food: 1, lick: -1, sniff: -1, achoo: 2, yawn: -1, peer: 3 };   // 低头、仰头
// 状态名 → 素材名；其余姿势名（walk、lick…）直接就是素材名
const SPRITE = { normal: 'stand', nervous: 'miss', sleepy: 'loaf' };

function sprite(pose, f) {
  const blank = () => Array.from({ length: SH }, () => Array(SW).fill(null));
  const grid = blank();
  let cur = grid;
  const R = (a, b, w, h, col) => {
    for (let j = Math.max(0, b); j < Math.min(SH, b + h); j++) for (let i = Math.max(0, a); i < Math.min(SW, a + w); i++) cur[j][i] = col;
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
  } else if (pose === 'stretch') {             // 伸懒腰：前爪前伸，屁股撅高
    leg(11, 22, 3, FAR, FW);
    tail([[3, 4], [2, 2], [2 + ts, 0]]);
    body(5, 5, 13, 16); R(17, 8, 4, 6, K); R(21, 11, 4, 3, K); body(15, 14, 15, 9);            // 屁股、斜下来的背、贴地的胸
    leg(7, 22, 3, K, WT);
    head(28, 12, 'down', false);
    R(30, 25, 14, 2, K); R(42, 25, 3, 2, WT);                                                  // 伸出去的前爪
  } else if (pose === 'inbox') {               // 挤在小纸箱里，肉从两边溢出来
    tail([[8, 14], [7, 12], [7 + ts, 10]]);
    body(10, 13, 31, 5);
    head(18, 6, f % 12 === 11 ? 'n' : 'down', false);
    R(13, 18, 25, 9, BX); R(13, 18, 25, 1, BXD); R(13, 26, 25, 1, BXD); R(25, 19, 1, 7, BXD);
    R(15, 17, 3, 2, WT); R(34, 17, 3, 2, WT);                                                  // 搭在箱沿上的爪子
  } else if (pose === 'hang') {                // 前爪扒着右边的字幕边缘，身子悬在外面蹬腿
    const kick = f % 2;
    tail([[22, 21], [21, 23], [21 - kick, 25]]);
    R(24, 19, 11, 8, K); R(25, 27, 9, 1, K); R(31, 20, 4, 6, WT);
    R(25 + kick * 2, 27, 3, 2, K); R(25 + kick * 2, 29, 3, 1, WT); R(31 - kick * 2, 27, 3, 2, FAR); R(31 - kick * 2, 29, 3, 1, FW);
    head(22, 6, 'dot', true);
    [[35, 15], [36, 12], [37, 9], [38, 6]].forEach(p => R(p[0], p[1], 3, 4, K));               // 从肩膀斜着伸上去的前腿
    R(39, 4, 4, 3, K); R(42, 4, 4, 2, WT);                                                     // 扒住边缘的爪子
    R(19, 2, 1, 2, BL); R(19, 4 + kick, 1, 1, BL);
  } else if (pose === 'peek') {                // 趴在上沿，头倒着探下去（画布下半截在字幕上沿以下）
    tail([[4, 3], [3, 1], [2 + ts, 0]]);
    body(5, 5, 24, 7); R(22, 12, 4, 2, WT);
    cur = blank(); head(27, 6, f % 12 === 11 ? 'down' : 'n', false);
    const upright = cur; cur = grid;
    upright.forEach((row, j) => row.forEach((col, i) => { if (col) R(i, 29 - j, 1, 1, col); }));
  } else {                                     // 站着的各种样子
    const wk = pose === 'walk', by = (wk && f % 2) ? 1 : 0, dy = pose === 'wow' ? -1 : 0, nd = wk ? sw : 0;
    const lk = pose === 'lick' ? (f >> 1) % 2 : 0;                                             // 舔爪：低头伸舌头、抬头，交替
    leg(11 - nd, 23, 2, FAR, FW); leg(26 + nd, 23, 2, FAR, FW);
    tail(pose === 'wow' ? [[4, 17], [3, 14], [3, 11], [4, 8], [5, 6]] : [[4, 18], [3, 16], [2, 14], [2, 12], [3 + ts, 10]]);
    body(5, 13 + by + dy, 23, 10);
    R(23, 18 + by + dy, 5, 5, WT); R(14, 22 + by + dy, 9, 2, WT);                              // 白胸、白肚皮
    if (pose === 'wow') [8, 11, 14, 17, 20].forEach(sx => R(sx, 9, 1, 3, K));                  // 炸毛
    leg(7 + nd, 23, 2, K, WT);
    const hy = 6 + by + dy + (HEAD_DY[pose] || 0) + lk;
    if (pose !== 'lick' && pose !== 'paw') leg(22 - nd, 23, 2, K, WT);
    let ek = EYE[pose] || 'n'; if (ek === 'n' && f % 12 === 11) ek = 'down';                   // 眨眼
    head(pose === 'lick' ? 24 : pose === 'peer' ? 28 : 26, hy, ek, ['wow', 'happy', 'food', 'sniff', 'achoo'].includes(pose));
    if (pose === 'yawn') { R(35, hy + 9, 5, 4, MR); R(36, hy + 11, 3, 2, PK); }                 // 大哈欠
    if (pose === 'achoo') [[44, 9], [46, 11], [45, 7]].forEach((p, i) => R(p[0] + (f + i) % 2, hy + p[1], 1, 1, BL));   // 喷出来的口水
    if (pose === 'lick') {                                                                     // 前爪贴着下巴斜着抬到嘴边
      R(28, 22, 5, 2, K); R(32, 21, 5, 2, K); R(36, 20, 4, 2, K); R(39, 15 - lk, 4, 6 + lk, K); R(40, 15 - lk, 3, 3, WT);   // 头低下去时爪子往上迎
      if (lk) R(38, hy + 9, 2, 1, PK);                                                         // 舌头够到爪子
    }
    if (pose === 'paw') { R(28, 21, 13, 2, K); R(41, 21, 3, 2, WT); }                           // 往前伸的爪子
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

// 杯子：带把手的小瓷杯
export function cupSVG() {
  const d = `<path fill='${CUP}' d='M0 0h5v7h-5z'/><path fill='${CUPD}' d='M0 0h5v1h-5zM0 6h5v1h-5zM5 2h1v3h-1z'/><path fill='${BL}' d='M0 3h5v1h-5z'/>`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 7' shape-rendering='crispEdges'>${d}</svg>\n`;
}

// 空纸箱：和 inbox 姿势里画的是同一个
export function boxSVG() {
  const d = `<path fill='${BX}' d='M0 0h25v9h-25z'/><path fill='${BXD}' d='M0 0h25v1h-25zM0 8h25v1h-25zM12 1h1v7h-1z'/>`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 25 9' shape-rendering='crispEdges'>${d}</svg>\n`;
}

// 黄瓜：横躺着的一根
export function cucumberSVG() {
  const d = `<path fill='#4f8a3a' d='M2 0h10v5h-10zM1 1h12v3h-12zM0 2h14v1h-14z'/><path fill='${GL}' d='M3 1h1v1h-1zM6 1h2v1h-2zM10 1h1v1h-1z'/><path fill='#3b6b2c' d='M4 3h1v1h-1zM8 3h1v1h-1zM11 2h1v1h-1z'/>`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 5' shape-rendering='crispEdges'>${d}</svg>\n`;
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
