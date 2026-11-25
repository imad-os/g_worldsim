// node tools/admin-cmd.mjs <ws url> '<json cmd>' ['<json cmd>' ...]  (ADMIN_TOKEN set): runs admin commands, prints the answers.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../packages/server/package.json', import.meta.url));
const WebSocket = require('ws'); const { encode, decode } = require('@msgpack/msgpack');
const [url, ...cmds] = process.argv.slice(2);
const ws = new WebSocket(url); ws.binaryType = 'nodebuffer';
let id = 0; const wait = new Map();
const send = (c) => new Promise((res) => { const k = ++id; wait.set(k, res); ws.send(encode({ t: 'adm', id: k, c })); });
ws.on('message', (b) => { const m = decode(b); if (m.t === 'admr' && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } if (m.t === 'wel') go(); });
let started = false;
async function go() { if (started) return; started = true; for (const c of cmds) { const r = await send(JSON.parse(c)); console.log(c.slice(0, 80), '->', JSON.stringify(r.ok ? r.data : r.err).slice(0, Number(process.env.MAX ?? 600))); } ws.close(); }
ws.on('open', () => ws.send(encode({ t: 'hi', v: 1, token: process.env.ADMIN_TOKEN })));
