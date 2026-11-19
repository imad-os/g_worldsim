// Bundles the browser code (viewer + panel) with esbuild, targeting Chromium 108 (Samsung TVs 2024+).
import { build } from 'esbuild';
const common = { bundle: true, format: 'esm', target: 'chrome108', minify: true, sourcemap: true, logLevel: 'warning' };
await build({ ...common, entryPoints: ['packages/client/src/debug.ts'], outfile: 'packages/client/www/debug.js' });
await build({ ...common, entryPoints: ['packages/panel/src/panel.ts'], outfile: 'packages/panel/www/panel.js' });
console.log('client + panel built');
