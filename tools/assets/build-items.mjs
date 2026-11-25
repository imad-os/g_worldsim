// Bakes the item models and icons from the CC0 sources (run tools/assets/fetch.sh once first):
//   node tools/assets/build-items.mjs
// Writes docs/models/items.json (3D models used in the game: weapons in hands, helmets...), docs/icons/items.png +
// docs/icons/items.json (one icon atlas for the bag, crafting and gear screens). Uses the pre-installed Chromium.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const root = resolve(new URL('../..', import.meta.url).pathname);
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.json': 'application/json' };
const page = `<!doctype html><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<script type="module">import '/tools/assets/bake.js'; window.ready = true;</script>`;
const srv = createServer((q, r) => {
  const p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
  if (p === '/') { r.writeHead(200, { 'content-type': 'text/html' }); r.end(page); return; }
  const f = join(root, p);
  if (!f.startsWith(root) || !existsSync(f) || statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' }); r.end(readFileSync(f));
}).listen(0);
const port = srv.address().port;
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage();
pg.on('console', (m) => { if (!/THREE\.|FBXLoader/.test(m.text())) console.log('page:', m.text()); });
pg.on('pageerror', (e) => console.log('page error:', e.message));
await pg.goto(`http://127.0.0.1:${port}/`);
await pg.waitForFunction(() => window.ready === true);
const out = await pg.evaluate(() => window.bakeAll());
await b.close(); srv.close();
mkdirSync(join(root, 'docs/models'), { recursive: true }); mkdirSync(join(root, 'docs/icons'), { recursive: true });
writeFileSync(join(root, 'docs/models/items.json'), JSON.stringify(out.models));
writeFileSync(join(root, 'docs/icons/items.png'), Buffer.from(out.icons.png.split(',')[1], 'base64'));
writeFileSync(join(root, 'docs/icons/items.json'), JSON.stringify({ size: out.icons.size, cols: out.icons.cols, ids: out.ids }));
console.log(out.info.join('\n'));
console.log(`models ${(JSON.stringify(out.models).length / 1024).toFixed(0)} KB, ${out.ids.length} icons`);
