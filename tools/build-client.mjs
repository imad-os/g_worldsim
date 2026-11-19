// Bundles the browser code with esbuild, targeting Chromium 108 (Samsung TVs 2024+).
// app/ = the My PC viewer (committed: GitHub Pages serves it); packages/*/www = debug view and panel (built locally).
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
const common = { bundle: true, format: 'esm', target: 'chrome108', minify: true, logLevel: 'warning' };
const version = JSON.parse(readFileSync('app/mypc-app.json', 'utf8')).version;
await build({ ...common, entryPoints: ['packages/client/src/app.ts'], outfile: 'app/game.js', define: { __VERSION__: JSON.stringify(version) } });
// Same ?v= everywhere (My PC loads index.html?mypc_v=<version>; the ?v= skips caches for the rest).
const html = readFileSync('app/index.html', 'utf8').replace(/game\.js\?v=[^"]+/, `game.js?v=${version}`);
writeFileSync('app/index.html', html);
await build({ ...common, sourcemap: true, entryPoints: ['packages/client/src/debug.ts'], outfile: 'packages/client/www/debug.js' });
await build({ ...common, sourcemap: true, entryPoints: ['packages/panel/src/panel.ts'], outfile: 'packages/panel/www/panel.js' });
console.log(`app ${version} + debug view + panel built`);
