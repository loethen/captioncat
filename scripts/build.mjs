import { build, context } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = path.join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(path.join(root, 'extension'), out, { recursive: true });
const entries = { content: 'src/content/index.js', background: 'src/background/index.js', popup: 'src/ui/popup.js', options: 'src/ui/options.js' };
const config = {
  absWorkingDir: root, entryPoints: entries, outdir: out, bundle: true,
  format: 'iife', target: 'chrome120', logLevel: 'info', legalComments: 'none',
  plugins: [{
    name: 'inline-caption-skin',
    setup(builder) {
      // Keep caption appearance out of the always-loaded content stylesheet.
      builder.onLoad({ filter: /[\\/]features[\\/]skins[\\/]skins\.css$/ }, async ({ path: stylesheet }) => ({
        contents: await readFile(stylesheet, 'utf8'), loader: 'text', watchFiles: [stylesheet],
      }));
    },
  }],
};
// The worker has no exports; the bundled IIFE also runs in an MV3 module worker.
if (process.argv.includes('--watch')) {
  const ctx = await context(config);
  await ctx.watch();
  console.log('Watching src/. After changing the manifest, HTML or assets, run the build again and reload the extension.');
} else {
  await build(config);
  const manifest = JSON.parse(await readFile(path.join(out, 'manifest.json'), 'utf8'));
  await writeFile(path.join(out, 'build-info.json'), JSON.stringify({ version: manifest.version }, null, 2));
  console.log(`Extension built: ${out}`);
}
