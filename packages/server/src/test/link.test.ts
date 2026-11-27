import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LinkPublisher } from '../persist/link.js';
import { Logger } from '../log.js';

type Call = { url: string; method?: string; headers?: Record<string, string>; body?: string };
const res = (status: number, j: unknown) => ({ ok: status < 300, status, json: async () => j, text: async () => JSON.stringify(j) });

/** imad 2026-11-27: the tunnel's new link goes to Firestore server/current by itself, with an account the server makes once. */
test('the public link is published to Firestore by the own account of the server', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'link-'));
  const calls: Call[] = [];
  let refuse = 0;
  const fetchFn = async (url: string, init?: Omit<Call, 'url'>) => {
    calls.push({ url, ...init });
    if (url.includes('accounts:signUp')) return res(200, { idToken: 'id1', localId: 'u1' });
    if (url.includes('accounts:signInWithPassword')) return res(200, { idToken: 'id2', localId: 'u1' });
    if (url.includes('/documents/server/current')) return refuse-- > 0 ? res(403, { error: { message: 'denied' } }) : res(200, {});
    return res(404, {});
  };
  const p = new LinkPublisher('proj', 'KEY', join(dir, 'firebase-link.json'), new Logger('error', undefined, true), fetchFn);
  p.publish('https://a-b-c.trycloudflare.com', 'cloudflare-quick');
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(p.status.ok, true);
  const w = calls.find((c) => c.method === 'PATCH')!;
  assert.match(w.url, /projects\/proj\/databases\/\(default\)\/documents\/server\/current$/);
  assert.equal(w.headers?.authorization, 'Bearer id1');
  const f = (JSON.parse(w.body!) as { fields: Record<string, { stringValue?: string; integerValue?: string }> }).fields;
  assert.deepEqual([f.url?.stringValue, f.provider?.stringValue, f.uid?.stringValue], ['https://a-b-c.trycloudflare.com', 'cloudflare-quick', 'u1']);
  assert.ok(Number(f.at?.integerValue) > 0);
  // The account is kept on the PC and used again (sign in, no new account), its password is a secret.
  assert.ok(existsSync(join(dir, 'firebase-link.json')));
  const acct = JSON.parse(readFileSync(join(dir, 'firebase-link.json'), 'utf8')) as { password: string };
  assert.deepEqual(p.secrets(), [acct.password]);
  refuse = 1;
  p.publish('https://d-e-f.trycloudflare.com', 'cloudflare-quick');
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(p.status.ok, false, 'refused = tried again later');
  assert.match(p.status.err ?? '', /rules/);
  assert.equal(calls.filter((c) => c.url.includes('signUp')).length, 1);
  assert.ok(calls.some((c) => c.url.includes('signInWithPassword')));
  p.stop();
  // Off (tests, auth.projectId 'none') or not an https link: nothing is sent.
  const n = calls.length;
  new LinkPublisher('', 'KEY', join(dir, 'x.json'), new Logger('error', undefined, true), fetchFn).publish('https://x.example', 'ngrok');
  p.publish('http://127.0.0.1:1', 'none');
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(calls.length, n);
});
