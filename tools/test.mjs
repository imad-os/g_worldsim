// Runs every compiled test file. A script, because Windows cmd does not expand a quoted glob in package.json.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const dir = 'packages/server/dist/test';
const files = readdirSync(dir).filter((f) => f.endsWith('.test.js')).map((f) => `${dir}/${f}`);
const r = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', '--test', ...files], { stdio: 'inherit' });
process.exit(r.status ?? 1);
