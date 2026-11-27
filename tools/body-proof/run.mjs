// Gear on people and their moves, without a server: node tools/people-proof/run.mjs <outdir>
// Bundles scene.ts next to docs/ (so models/items.json and icons load), renders 8 people in Chromium, saves 3 moments.
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2] ?? 'out/body-proof';
mkdirSync(out, { recursive: true });
await build({ entryPoints: ['tools/body-proof/scene.ts'], bundle: true, format: 'esm', target: 'chrome108', outfile: 'docs/_proof.js', logLevel: 'error' });
const html = '<!doctype html><body style="margin:0;background:#000"><canvas style="width:100vw;height:100vh;display:block"></canvas><script type="module" src="_proof.js"></script>';
const T = { '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary' };
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
const shots = JSON.parse(readFileSync(new URL('./shots.json', import.meta.url), 'utf8'));
for (const sh of shots) {
  for (let f = 0; f < (sh.frames ?? 1); f++) await pg.evaluate(([p, c]) => window.draw(p, c, 0.016), [typeof sh.people === 'string' ? JSON.parse(sh.people) : sh.people, sh.cam]);
  await pg.screenshot({ path: `${out}/${sh.name}.png` });
}
console.log(JSON.stringify(await pg.evaluate(() => window.bench())));
await b.close(); srv.close(); rmSync('docs/_proof.js');
console.log('saved', out);
