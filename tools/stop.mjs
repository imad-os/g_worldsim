// Stops the server on this PC cleanly (it saves a snapshot first). Reads ADMIN_TOKEN and the port from .env / config.
import { readFileSync, existsSync } from 'node:fs';
const env = existsSync('.env') ? Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/).filter((l) => /^\w+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])) : {};
const cfg = existsSync('worldsim.config.json') ? JSON.parse(readFileSync('worldsim.config.json', 'utf8')) : {};
const port = cfg.port ?? 8787;
const r = await fetch(`http://127.0.0.1:${port}/api/stop`, { method: 'POST', headers: { authorization: `Bearer ${process.env.ADMIN_TOKEN ?? env.ADMIN_TOKEN}` } }).catch((e) => ({ ok: false, status: String(e.message) }));
console.log(r.ok ? 'stopping (snapshot saved)' : `could not stop: ${r.status}`);
