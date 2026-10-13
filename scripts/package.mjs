import { mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
await mkdir(`${root}/release`, { recursive: true });
await rm(`${root}/release/subtitle-companion-0.1.0.zip`, { force: true });
execFileSync('zip', ['-qr', `${root}/release/subtitle-companion-0.1.0.zip`, '.'], { cwd: `${root}/dist` });
console.log(`${root}/release/subtitle-companion-0.1.0.zip`);
