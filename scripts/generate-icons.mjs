// Writes the CaptionCat icons in extension/icons/: the tuxedo cat's head from the character artwork,
// on a transparent background. 48 and 128 px are exact integer upscales of the 24×24 grid;
// 16 and 32 px are area-averaged, since the grid does not divide evenly into them.
import { writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { portraitGrid } from '../src/features/mascot/characters/tuxedo/artwork.js';

const grid = portraitGrid();
const outputs = [
  { size: 16, margin: 0 },
  { size: 32, margin: 0 },
  { size: 48, margin: 0 },
  // Chrome Web Store guidance: 96×96 artwork inside a transparent 128×128 canvas.
  { size: 128, margin: 16 },
];
const SAMPLES = 8; // per axis, per pixel

const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
function pixels(size, margin) {
  const scale = grid.length / (size - 2 * margin), data = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0, covered = 0;
    for (let sy = 0; sy < SAMPLES; sy++) for (let sx = 0; sx < SAMPLES; sx++) {
      const gx = Math.floor((x - margin + (sx + .5) / SAMPLES) * scale), gy = Math.floor((y - margin + (sy + .5) / SAMPLES) * scale);
      const colour = grid[gy]?.[gx];
      if (!colour) continue;
      const [cr, cg, cb] = rgb(colour); r += cr; g += cg; b += cb; covered++;
    }
    if (!covered) continue;
    const offset = (y * size + x) * 4;
    data[offset] = Math.round(r / covered); data[offset + 1] = Math.round(g / covered); data[offset + 2] = Math.round(b / covered);
    data[offset + 3] = Math.round(covered / SAMPLES ** 2 * 255);
  }
  return data;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}
function png(size, rgba) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4); // filter byte 0: none
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

const dir = fileURLToPath(new URL('../extension/icons/', import.meta.url));
for (const { size, margin } of outputs) await writeFile(`${dir}${size}.png`, png(size, pixels(size, margin)));
console.log('Generated the CaptionCat icons.');
