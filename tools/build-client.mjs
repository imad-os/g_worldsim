// Bundles the browser code with esbuild, targeting Chromium 108 (Samsung TVs 2024+).
// docs/ = the My PC viewer and docs/panel/ = the control panel (committed: GitHub Pages main /docs serves them); packages/client/www = debug view (built locally).
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
const common = { bundle: true, format: 'esm', target: 'chrome108', minify: true, logLevel: 'warning' };
const version = JSON.parse(readFileSync('docs/mypc-app.json', 'utf8')).version;
await build({ ...common, entryPoints: ['packages/client/src/app.ts'], outfile: 'docs/game.js', define: { __VERSION__: JSON.stringify(version) } });
// The chunk builder runs in a worker (a classic script: every Chromium the TVs have runs it).
await build({ ...common, format: 'iife', entryPoints: ['packages/client/src/chunkworker.ts'], outfile: 'docs/chunks.js' });
// Same ?v= everywhere (My PC loads index.html?mypc_v=<version>; the ?v= skips caches for the rest).
const html = readFileSync('docs/index.html', 'utf8').replace(/game\.js\?v=[^"]+/, `game.js?v=${version}`);
writeFileSync('docs/index.html', html);
await build({ ...common, sourcemap: true, entryPoints: ['packages/client/src/debug.ts'], outfile: 'packages/client/www/debug.js' });
// docs/panel/ = the control panel (Pages /g_worldsim/panel/, the server /panel/).
await build({ ...common, entryPoints: ['packages/panel/src/main.ts'], outfile: 'docs/panel/panel.js', define: { __VERSION__: JSON.stringify(version) } });
const ph = readFileSync('docs/panel/index.html', 'utf8').replace(/panel\.(js|css)\?v=[^"]+/g, (m, ext) => `panel.${ext}?v=${version}`);
writeFileSync('docs/panel/index.html', ph);
console.log(`app ${version} + debug view + panel built`);
// The server is built too (tsc ran before this script): main.ts compiles again only when sources change after this.
import { mkdirSync } from 'node:fs';
mkdirSync('packages/server/dist', { recursive: true });
writeFileSync('packages/server/dist/.built', new Date().toISOString());
