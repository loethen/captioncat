import { mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
await mkdir(`${root}/release`, { recursive: true });
await rm(`${root}/release/captioncat-0.1.0.zip`, { force: true });
execFileSync('zip', ['-qr', `${root}/release/captioncat-0.1.0.zip`, '.'], { cwd: `${root}/dist` });
console.log(`${root}/release/captioncat-0.1.0.zip`);
