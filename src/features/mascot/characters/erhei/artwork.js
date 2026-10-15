// Preserved original Erhei pixel artwork; behavior lives in ../actions and controller.
// scripts/generate-assets.mjs bakes every pose into an SVG whose frames switch every 120ms.
const K = '#1c1a20', FAR = '#3a3846', FW = '#cfcdc4', WT = '#fbfaf6', PK = '#ff8fa8', AM = '#f2a81d';
const BX = '#c9a26b', BXD = '#9c7645', CUP = '#f4f6fb', CUPD = '#b9bfd3';
const GR = '#6fae4a', GL = '#a6d37c', BL = '#8ec5f0', VR = '#d8452e', OL = '#9d9bbb', MR = '#7a2f3d', WH = '#e6e8f5';

// ───────────── Erhei: a pixel black cat (tuxedo markings, chubby) ─────────────
// 48×30 pixel art; each pose is drawn once per frame number and animates by switching frames.
const SW = 48, SH = 30, FRAMES = 24, FRAME_MS = 120;   // 24 is a common multiple of 4, 8, 12 and 2, so every loop joins up
// The output canvas is a 48×48 square (the character box is square); the cat sits on the bottom edge with one row left for the outline.
const VIEW_BOX = `0 ${SH - 1 - SW} ${SW} ${SW}`;
const TOP = 8;                                 // rows above 0 inside the canvas, for poses taller than standing (sitting)
const GLY = {
  '?': ['.###.', '#...#', '..##.', '.....', '..#..'],
  '!': ['..#..', '..#..', '..#..', '.....', '..#..'],
  'h': ['.#.#.', '#####', '#####', '.###.', '..#..'],
  'n': ['..###', '..#.#', '..#..', '.##..', '.##..'],
  'z': ['.###.', '...#.', '..#..', '.#...', '.###.'],
};
const EYE = { stand: 'n', walk: 'n', ask: 'n', wow: 'big', happy: 'up', love: 'down', food: 'big', lick: 'down', miss: 'dot', catch: 'up', watch: 'big', sniff: 'dot', achoo: 'up', yawn: 'up', peer: 'big' };
const HEAD_DY = { food: 1, sniff: -1, achoo: 2, yawn: -1, peer: 3 };   // head down / head up
// State name → artwork name; other pose names (walk, lick…) are the artwork names themselves
const SPRITE = { normal: 'stand', nervous: 'miss', sleepy: 'loaf' };

// `left` draws the glyphs back to front, for artwork the renderer mirrors when the cat faces left.
function sprite(pose, f, left = false) {
  const grid = Array.from({ length: TOP + SH }, () => Array(SW).fill(null));   // grid[TOP + y] is row y
  const R = (a, b, w, h, col) => {
    for (let j = Math.max(-TOP, b); j < Math.min(SH, b + h); j++) for (let i = Math.max(0, a); i < Math.min(SW, a + w); i++) grid[TOP + j][i] = col;
  };
  const G = (g, gx, gy, col) => GLY[g].forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') R(gx + (left ? r.length - 1 - i : i), gy + j, 1, 1, col); }));
  const eyeAt = (k, ex, ey, w) => {           // w=5 near eye, w=4 far eye
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
    R(hx + 1, hy - 2, 4, 2, K); R(hx + 1, hy - 4, 3, 2, K); R(hx + 1, hy - 6, 2, 2, K);       // left ear
    R(hx + 10, hy - 2, 4, 2, K); R(hx + 11, hy - 4, 3, 2, K); R(hx + 12, hy - 6, 2, 2, K);    // right ear
    R(hx + 2, hy - 2, 1, 2, PK); R(hx + 11, hy - 2, 1, 2, PK);
    R(hx + 8, hy + 8, 7, 4, WT); R(hx + 9, hy + 12, 5, 1, WT);                                // white muzzle
    R(hx + 12, hy + 8, 2, 1, PK);                                                             // pink nose
    if (open) { R(hx + 10, hy + 10, 3, 2, MR); R(hx + 11, hy + 11, 2, 1, PK); }
    eyeAt(ek, hx + 3, hy + 3, 5); eyeAt(ek, hx + 10, hy + 3, 4);
    R(hx + 15, hy + 7, 3, 1, WH); R(hx + 15, hy + 9, 3, 1, WH); R(hx + 16, hy + 6, 2, 1, WH); // whiskers
  };
  const body = (bx, by, bw, bh) => { R(bx + 1, by - 1, bw - 2, 1, K); R(bx, by, bw, bh, K); R(bx + 1, by + bh, bw - 2, 1, K); R(bx + 2, by + bh + 1, bw - 4, 1, K); };
  const leg = (lx, ly, len, col, ft) => { R(lx, ly, 3, len, col); R(lx, ly + len, 3, 2, ft); };
  const tail = pts => pts.forEach(p => R(p[0], p[1], 2, 2, K));
  const ts = [0, 1, 1, 0][f % 4], sw = [-1, 0, 1, 0][f % 4];

  if (pose === 'portrait') {                   // the head alone, for the extension icon
    head(3, 8, 'n', false);
  } else if (pose === 'loaf' || pose === 'rest') {   // loaf: asleep; rest: dozing, the tail tip flicking and an eye opening now and then
    const rest = pose === 'rest';
    tail(rest ? [[3, 21], [2, 19], [2 + ts, 17]] : [[3, 21], [2, 19], [2, 17]]); body(5, 17, 26, 8); R(5, 24, 26, 1, K);
    head(26, 13, rest && f % 24 >= 21 ? 'n' : 'down', false); R(30, 26, 6, 2, WT);
    if (!rest) G('z', 44, 6 - ((f % 8) >> 2), BL);
  } else if (pose === 'crouch') {              // winding up, wiggling
    const j = f % 2 ? -1 : 1;
    leg(11 + j, 23, 2, FAR, FW); leg(27, 23, 2, FAR, FW);
    tail([[4 + j, 11], [3 + j, 9], [3 + j, 7], [4 + j, 5]]); body(5, 12, 23, 10); R(23, 17, 5, 5, WT);
    leg(7 + j, 23, 2, K, WT); leg(22, 23, 2, K, WT); head(26, 10, 'big', false);
  } else if (pose === 'pounce') {              // pounce
    tail([[3, 12], [2, 10], [3, 8]]); R(0, 17, 8, 2, K); R(0, 17, 2, 2, WT); body(6, 10, 22, 8); R(24, 13, 4, 4, WT);
    R(38, 17, 5, 2, K); R(42, 17, 3, 2, WT); head(29, 5, 'big', true);
  } else if (pose === 'stretch') {             // stretch: front paws out, rump up
    leg(11, 22, 3, FAR, FW);
    tail([[3, 4], [2, 2], [2 + ts, 0]]);
    body(5, 5, 13, 16); R(17, 8, 4, 6, K); R(21, 11, 4, 3, K); body(15, 14, 15, 9);            // rump, sloping back, chest on the ground
    leg(7, 22, 3, K, WT);
    head(28, 12, 'down', false);
    R(30, 25, 14, 2, K); R(42, 25, 3, 2, WT);                                                  // outstretched front paws
  } else if (pose === 'inbox') {               // squeezed into a small box, spilling over both sides
    tail([[8, 14], [7, 12], [7 + ts, 10]]);
    body(10, 13, 31, 5);
    head(18, 6, f % 12 === 11 ? 'n' : 'down', false);
    R(13, 18, 25, 9, BX); R(13, 18, 25, 1, BXD); R(13, 26, 25, 1, BXD); R(25, 19, 1, 7, BXD);
    R(15, 17, 3, 2, WT); R(34, 17, 3, 2, WT);                                                  // paws resting on the rim
  } else if (pose === 'hang') {                // front paws on the caption's right edge, body hanging off, legs kicking
    const kick = f % 2;
    tail([[22, 21], [21, 23], [21 - kick, 25]]);
    R(24, 19, 11, 8, K); R(25, 27, 9, 1, K); R(31, 20, 4, 6, WT);
    R(25 + kick * 2, 27, 3, 2, K); R(25 + kick * 2, 29, 3, 1, WT); R(31 - kick * 2, 27, 3, 2, FAR); R(31 - kick * 2, 29, 3, 1, FW);
    head(22, 6, 'dot', true);
    [[35, 15], [36, 12], [37, 9], [38, 6]].forEach(p => R(p[0], p[1], 3, 4, K));               // foreleg reaching up diagonally from the shoulder
    R(39, 4, 4, 3, K); R(42, 4, 4, 2, WT);                                                     // paw gripping the edge
    R(19, 2, 1, 2, BL); R(19, 4 + kick, 1, 1, BL);
  } else if (pose === 'sit' || pose === 'lick') {   // sitting up on its haunches; lick: one front paw raised to the mouth
    const lk = pose === 'lick' ? (f >> 1) % 2 : 0;                                             // head dips with the tongue out, then lifts, alternating
    leg(24, 21, 4, FAR, FW);                                                                   // far front leg, straight down
    tail([[8, 24], [6, 23], [5, 21], [5, 19], [6 + ts, 17]]);
    body(9, 17, 15, 8); R(14, 13, 7, 4, K); R(17, 11, 4, 2, K); R(20, 8, 7, 14, K);          // haunch, back sloping up to the chest
    R(23, 14, 4, 7, WT); R(18, 25, 5, 2, WT);                                                  // white bib, hind paw on the ground
    const hy = lk;
    if (pose === 'sit') {
      head(20, hy, f % 12 === 11 ? 'down' : 'n', false);
      leg(27, 18, 7, K, WT);                                                                   // near front leg, straight down in front of the chest
    } else {
      head(20, hy, 'down', false);
      R(27, 15, 4, 5, K); R(30, 14, 3, 4, K);                                                 // near foreleg rising close to the chest
      R(33, 11, 6, 6, K); R(34, 12, 4, 3, WT); R(35, 11, 2, 1, WT); R(35, 15, 2, 1, WT);     // rounded white paw tucked under the chin
      R(32, hy + 10, 2, 1, MR); R(32, hy + 11, 2, 1 + lk, PK);                                 // tongue out, lengthening onto the paw
    }
  } else {                                     // the standing poses
    const wk = pose === 'walk', by = (wk && f % 2) ? 1 : 0, dy = pose === 'wow' ? -1 : 0, nd = wk ? sw : 0;
    leg(11 - nd, 23, 2, FAR, FW); leg(26 + nd, 23, 2, FAR, FW);
    tail(pose === 'wow' ? [[4, 17], [3, 14], [3, 11], [4, 8], [5, 6]] : [[4, 18], [3, 16], [2, 14], [2, 12], [3 + ts, 10]]);
    body(5, 13 + by + dy, 23, 10);
    R(23, 18 + by + dy, 5, 5, WT); R(14, 22 + by + dy, 9, 2, WT);                              // white chest and belly
    if (pose === 'wow') [8, 11, 14, 17, 20].forEach(sx => R(sx, 9, 1, 3, K));                  // fur on end
    leg(7 + nd, 23, 2, K, WT);
    const hy = 6 + by + dy + (HEAD_DY[pose] || 0);
    if (pose !== 'paw') leg(22 - nd, 23, 2, K, WT);
    let ek = EYE[pose] || 'n'; if (ek === 'n' && f % 12 === 11) ek = 'down';                   // blink
    head(pose === 'peer' ? 28 : 26, hy, ek, ['wow', 'happy', 'food', 'sniff', 'achoo'].includes(pose));
    if (pose === 'yawn') { R(35, hy + 9, 5, 4, MR); R(36, hy + 11, 3, 2, PK); }                 // big yawn
    if (pose === 'achoo') [[44, 9], [46, 11], [45, 7]].forEach((p, i) => R(p[0] + (f + i) % 2, hy + p[1], 1, 1, BL));   // spray
    if (pose === 'paw') { R(28, 21, 13, 2, K); R(41, 21, 3, 2, WT); }                           // paw reaching forward
    if (pose === 'ask') G('?', 43, 0, VR);
    if (pose === 'wow') G('!', 43, 0, VR);
    if (pose === 'love') G('h', 43, 0, VR);
    if (pose === 'happy') G('n', 43, 0, VR);
    if (pose === 'miss') { R(40, 3, 1, 2, BL); R(40, 5, 1, 1, BL); }
    if (pose === 'food') { R(38, hy + 14, 1, 2, BL); R(38, hy + 17 - (f % 4 >> 1), 1, 1, BL); }
    if (pose === 'catch') { const w = f % 2; R(37, hy + 10, 10, 1, GR); R(37, hy + 10, 4, 1, GL); R(45, hy + 9 + w, 2, 1, GR); }
  }
  // A light outline keeps the black cat readable on any video background
  const a = (i, j) => i >= 0 && j >= 0 && i < SW && j < TOP + SH && grid[j][i];
  const o = [];
  for (let j = 0; j < TOP + SH; j++) for (let i = 0; i < SW; i++) if (!a(i, j) && (a(i - 1, j) || a(i + 1, j) || a(i, j - 1) || a(i, j + 1))) o.push([i, j]);
  o.forEach(p => { grid[p[1]][p[0]] = OL; });
  return grid;
}

// One path per colour; adjacent same-colour pixels in a row merge into one run
function paths(grid) {
  const byColor = new Map();
  grid.forEach((row, j) => {
    for (let i = 0; i < row.length;) {
      const col = row[i]; let w = 1;
      while (i + w < row.length && row[i + w] === col) w++;
      if (col) byColor.set(col, (byColor.get(col) || '') + `M${i} ${j - TOP}h${w}v1h-${w}z`);
      i += w;
    }
  });
  return [...byColor].map(([col, d]) => `<path fill='${col}' d='${d}'/>`).join('');
}

// Erhei's head on its own, as a 24×24 grid of colours (null is transparent), outline included.
export function portraitGrid() {
  return sprite('portrait', 0).slice(TOP, TOP + 24).map(row => row.slice(0, 24));
}

export function catSVG(state, left = false) {
  const key = SPRITE[state] || state;
  const images = [], shown = [];               // deduplicated images, and which one each frame shows
  for (let f = 0; f < FRAMES; f++) {
    const art = paths(sprite(key, f, left));
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

// Cup: a small china cup with a handle
export function cupSVG() {
  const d = `<path fill='${CUP}' d='M0 0h5v7h-5z'/><path fill='${CUPD}' d='M0 0h5v1h-5zM0 6h5v1h-5zM5 2h1v3h-1z'/><path fill='${BL}' d='M0 3h5v1h-5z'/>`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 7' shape-rendering='crispEdges'>${d}</svg>\n`;
}

// Empty box: the same one drawn in the inbox pose
export function boxSVG() {
  const d = `<path fill='${BX}' d='M0 0h25v9h-25z'/><path fill='${BXD}' d='M0 0h25v1h-25zM0 8h25v1h-25zM12 1h1v7h-1z'/>`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 25 9' shape-rendering='crispEdges'>${d}</svg>\n`;
}

// Cucumber: lying on its side, stem on the left, a dried flower at the tip, a pale stripe on top and bumps underneath.
// It gets the same light outline as the cat so it reads on any video.
export function cucumberSVG() {
  const C = { S: '#8a6a2e', D: '#2f6b2a', M: '#4f8a3a', L: GL, B: '#cfe8a8', Y: '#e8cf5a' };
  const art = [
    '...MMMMMMMMMMM..',
    'SDMLLLMLLLLMLLM.',
    'SDMMMMMMMMMMMMMY',
    '.DDMBDDDBDDDBDD.',
    '...DDDDDDDDDDD..',
  ].map(r => `.${r}.`);
  art.unshift('.'.repeat(art[0].length)); art.push(art[0]);
  const at = (i, j) => art[j]?.[i] && art[j][i] !== '.';
  const byColor = new Map();
  art.forEach((r, j) => [...r].forEach((ch, i) => {
    const col = ch !== '.' ? C[ch] : (at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1)) ? OL : null;
    if (col) byColor.set(col, (byColor.get(col) || '') + `M${i} ${j}h1v1h-1z`);
  }));
  const d = [...byColor].map(([col, path]) => `<path fill='${col}' d='${path}'/>`).join('');
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${art[0].length} ${art.length}' shape-rendering='crispEdges'>${d}</svg>\n`;
}

// Laser dot: a bright core with a halo
export function dotSVG() {
  const d = `<path fill='${VR}' opacity='.35' d='M2 0h2v6h-2zM0 2h6v2h-6z'/><path fill='${VR}' d='M2 1h2v4h-2zM1 2h4v2h-4z'/><path fill='#ffd9d2' d='M2 2h2v2h-2z'/>`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 6' shape-rendering='crispEdges'>${d}</svg>\n`;
}

// Cat grass: one long thin green blade (tip on the left, curving down to the right)
export function bladeSVG() {
  const light = [], dark = [];
  for (let i = 0; i < 46; i++) (i % 5 < 2 ? light : dark).push(`M${i} ${Math.floor(i * i / 260)}h1v2h-1z`);
  const d = `<path fill='${GL}' d='${light.join('')}'/><path fill='${GR}' d='${dark.join('')}'/>`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 46 10' shape-rendering='crispEdges'>${d}</svg>\n`;
}
