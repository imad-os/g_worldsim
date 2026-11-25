import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

/**
 * "I did git pull and start, and it still says unknown command" (imad 2026-11-25): `npm start` runs the COMPILED server
 * (packages/server/dist, not in git), so a pull alone changed nothing. Before anything else is loaded, main.ts calls this:
 * package files newer than node_modules = npm install; sources newer than the last build = tsc. Then the new code is loaded.
 * WORLDSIM_NO_AUTOBUILD=1 skips it.
 */
const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');
export const STAMP = join(ROOT, 'packages', 'server', 'dist', '.built');

function newest(dir: string): number {
  let t = 0;
  if (!existsSync(dir)) return 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) t = Math.max(t, newest(p));
    else if (e.name.endsWith('.ts') || e.name === 'package.json' || e.name.startsWith('tsconfig')) t = Math.max(t, statSync(p).mtimeMs);
  }
  return t;
}
const mtime = (f: string) => (existsSync(f) ? statSync(f).mtimeMs : 0);

/** npm's own script next to this node (portable Node on the PC: .node\node_modules\npm; Linux: lib/node_modules/npm). */
function npmCli(): string | null {
  const d = dirname(process.execPath);
  for (const p of [join(d, 'node_modules', 'npm', 'bin', 'npm-cli.js'), join(d, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js')]) if (existsSync(p)) return p;
  return null;
}

export function ensureFresh(say: (s: string) => void = (s) => console.log(s)): void {
  if (process.env.WORLDSIM_NO_AUTOBUILD === '1') return;
  try {
    const lock = Math.max(mtime(join(ROOT, 'package-lock.json')), mtime(join(ROOT, 'package.json')));
    if (lock > mtime(join(ROOT, 'node_modules', '.package-lock.json')) + 1000) {
      const npm = npmCli();
      if (npm) {
        say('package files changed: npm install');
        const r = spawnSync(process.execPath, [npm, 'install', '--no-audit', '--no-fund'], { cwd: ROOT, stdio: 'inherit', windowsHide: true });
        if (r.status !== 0) say('npm install failed: starting with the packages already there');
      } else say('package files changed but npm was not found next to node: run npm install');
    }
    const src = Math.max(newest(join(ROOT, 'packages', 'server', 'src')), newest(join(ROOT, 'packages', 'protocol', 'src')), mtime(join(ROOT, 'tsconfig.base.json')));
    if (src <= mtime(STAMP)) return;
    const tsc = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
    if (!existsSync(tsc)) { say('the code changed but TypeScript is missing: run npm install, then npm run build'); return; }
    say('the code changed since the last build: compiling the server');
    const r = spawnSync(process.execPath, [tsc, '-b', 'packages/protocol', 'packages/server'], { cwd: ROOT, stdio: 'inherit', windowsHide: true });
    if (r.status === 0) writeFileSync(STAMP, new Date().toISOString());
    else say('BUILD FAILED: starting the last good build (see the errors above)');
  } catch (err) { say(`build check failed: ${String(err)}`); }
}
