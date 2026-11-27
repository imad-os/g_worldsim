/**
 * The world server's current public link, published by the server in Firestore server/current (imad 2026-11-27: a
 * cloudflare-quick link changes at every restart and nobody should have to type it). Read with the project's public web
 * config (`firebase.json`, the panel's file) through Firestore's REST API: no SDK, one small GET, only when the address in
 * hand is missing or stops answering (never polled). '' = nothing published / not reachable.
 */
let last = { at: 0, url: '' };

export async function publishedServer(configUrl: string, minGapMs = 20_000): Promise<string> {
  if (Date.now() - last.at < minGapMs) return last.url;
  last = { at: Date.now(), url: last.url };
  try {
    const c = (await (await fetch(configUrl, { cache: 'no-cache' })).json()) as { projectId?: string; apiKey?: string };
    if (!c.projectId) return '';
    const doc = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(c.projectId)}/databases/(default)/documents/server/current${c.apiKey ? '?key=' + encodeURIComponent(c.apiKey) : ''}`;
    const r = await fetch(doc, { cache: 'no-store' });
    if (!r.ok) return '';
    const j = (await r.json()) as { fields?: { url?: { stringValue?: string } } };
    const url = String(j.fields?.url?.stringValue ?? '');
    if (/^https:\/\/[A-Za-z0-9.-]+(:\d+)?$/.test(url)) last.url = url;
    return last.url;
  } catch { return last.url; }
}

/** Same server? (trailing slashes, http / https and case do not count.) */
export const sameServer = (a: string, b: string) => a.trim().replace(/\/+$/, '').replace(/^https?:\/\//i, '').toLowerCase() === b.trim().replace(/\/+$/, '').replace(/^https?:\/\//i, '').toLowerCase();
