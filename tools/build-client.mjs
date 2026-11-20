// Bundles the browser code with esbuild, targeting Chromium 108 (Samsung TVs 2024+).
// app/ = the My PC viewer (committed: GitHub Pages serves it); panel/ = control panel (committed); packages/client/www = debug view (built locally).
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
const common = { bundle: true, format: 'esm', target: 'chrome108', minify: true, logLevel: 'warning' };
const version = JSON.parse(readFileSync('app/mypc-app.json', 'utf8')).version;
await build({ ...common, entryPoints: ['packages/client/src/app.ts'], outfile: 'app/game.js', define: { __VERSION__: JSON.stringify(version) } });
// Same ?v= everywhere (My PC loads index.html?mypc_v=<version>; the ?v= skips caches for the rest).
const html = readFileSync('app/index.html', 'utf8').replace(/game\.js\?v=[^"]+/, `game.js?v=${version}`);
writeFileSync('app/index.html', html);
await build({ ...common, sourcemap: true, entryPoints: ['packages/client/src/debug.ts'], outfile: 'packages/client/www/debug.js' });
// panel/ = the control panel (committed: GitHub Pages serves it at /g_worldsim/panel/, the server at /panel/).
await build({ ...common, entryPoints: ['packages/panel/src/main.ts'], outfile: 'panel/panel.js', define: { __VERSION__: JSON.stringify(version) } });
const ph = readFileSync('panel/index.html', 'utf8').replace(/panel\.(js|css)\?v=[^"]+/g, (m, ext) => `panel.${ext}?v=${version}`);
writeFileSync('panel/index.html', ph);
console.log(`app ${version} + debug view + panel built`);
