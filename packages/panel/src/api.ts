import { Msg, type ServerMsg, type AdminCmd, type ServerStats } from '@worldsim/protocol';
import { Conn } from '../../client/src/conn.js';
import { load, save } from './util.js';

/**
 * The link to the world server. The panel runs from GitHub Pages (or from the server itself at /panel/) and talks to the
 * server over one WebSocket with the admin token: commands and their answers, live stats, notices.
 */
let conn: Conn | null = null;
let nextId = 1;
const waiting = new Map<number, (ok: boolean, data: unknown, err?: string) => void>();
export let stats: ServerStats | null = null;
/** Signed in with Firebase: the account from the server's welcome (role owner / admin / player, character name). */
export let account: { uid: string; role: 'owner' | 'admin' | 'player'; name: string; email: string } | null = null;
export const setAccountName = (n: string) => { if (account) account.name = n; };
export const listeners = {
  state: (_s: 'connecting' | 'open' | 'closed', _why?: string) => {},
  welcome: () => {},
  denied: (_why: string) => {},
  stats: (_s: ServerStats) => {},
  notice: (_kind: string, _data: unknown) => {},
};

/** Where the panel runs: on the server itself (same address) or elsewhere (GitHub Pages: the saved address). */
export const onServer = !/github\.io$/.test(location.hostname) && location.pathname.startsWith('/panel') && !new URLSearchParams(location.search).has('server');
export function serverAddress(): string {
  const q = new URLSearchParams(location.search).get('server');
  if (q) { save('server', q); return q; }
  if (onServer) return location.origin;
  return load('server', '');
}
export function setServer(url: string): string {
  let u = url.trim().replace(/\/+$/, '').replace(/\/(panel|app)$/, '');
  if (u && !/^https?:\/\//.test(u)) u = 'https://' + u;
  save('server', u);
  return u;
}
export const token = () => load('token', '');
export const isStaff = () => !account || account.role !== 'player';

export function connect(server: string, tok: string | (() => Promise<string>)): void {
  conn?.close();
  const ws = server.replace(/^http/, 'ws') + '/ws';
  conn = new Conn(ws, tok, 'panel');
  conn.onState = (s, why) => listeners.state(s, why);
  conn.onMsg = (m: ServerMsg) => {
    switch (m.t) {
      case Msg.Welcome:
        account = m.account ?? null;
        if (m.role === 'viewer') { conn?.close(); listeners.denied('That is a TV (viewer) token, not the admin token.'); return; }
        if (typeof tok === 'string') save('token', tok);
        listeners.welcome();
        break;
      case Msg.Error:
        if (m.code === 'auth' && typeof tok !== 'string') listeners.denied('The world server did not accept your sign-in. It may still run an older version without sign-in, or the Firebase project is not set up yet (Firestore rules published?). Your admin token still works.');
        else if (m.code === 'auth' || m.code === 'locked') { save('token', ''); listeners.denied(m.code === 'locked' ? 'Too many wrong tokens: wait 10 minutes.' : 'Wrong admin token.'); }
        else if (m.code === 'version') listeners.denied('The server runs another version: update it, then reload this page.');
        break;
      case Msg.Notice: listeners.notice(m.kind, m.data); break;
      case Msg.AdminResult: { const w = waiting.get(m.id); if (w) { waiting.delete(m.id); w(m.ok, m.data, m.err); } break; }
      case Msg.Stats: stats = m.s; listeners.stats(m.s); break;
    }
  };
  conn.open();
}
export function disconnect(): void { conn?.close(); conn = null; }

export function cmd<T = unknown>(c: AdminCmd, timeoutMs = 30000): Promise<T> {
  return new Promise((ok, fail) => {
    const id = nextId++;
    const t = setTimeout(() => { waiting.delete(id); fail(new Error('No answer from the server')); }, timeoutMs);
    waiting.set(id, (good, data, err) => { clearTimeout(t); if (good) ok(data as T); else fail(new Error(err || 'failed')); });
    conn?.send({ t: Msg.Admin, id, c });
  });
}
