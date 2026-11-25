// Gear on people and their moves, without a server: node tools/people-proof/run.mjs <outdir>
// Bundles scene.ts next to docs/ (so models/items.json and icons load), renders 8 people in Chromium, saves 3 moments.
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2] ?? 'out/people-proof';
mkdirSync(out, { recursive: true });
await build({ entryPoints: ['tools/people-proof/scene.ts'], bundle: true, format: 'esm', target: 'chrome108', outfile: 'docs/_proof.js', logLevel: 'error' });
const html = '<!doctype html><body style="margin:0;background:#000"><canvas style="width:100vw;height:100vh;display:block"></canvas><script type="module" src="_proof.js"></script>';
const T = { '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const srv = createServer((q, r) => {
  const p = new URL(q.url, 'http://x').pathname;
  if (p === '/') { r.end(html); return; }
  const f = join('docs', p);
  if (!existsSync(f) || statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'content-type': T[extname(f)] ?? 'application/octet-stream' }); r.end(readFileSync(f));
}).listen(0);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
pg.on('pageerror', (e) => console.log('page error', e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/`);
await pg.waitForFunction(() => window.ready).then(() => pg.evaluate(() => window.ready));
for (const [k, f] of [[1, 0.12], [2, 0.3], [3, 0.5]]) {
  await pg.evaluate(([f]) => window.draw(1, f), [f]);
  await pg.screenshot({ path: `${out}/people-${k}.png` });
}
await b.close(); srv.close(); rmSync('docs/_proof.js');
console.log('saved', out);
