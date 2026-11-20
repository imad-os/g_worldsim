/**
 * Firebase sign-in for the panel (imad 2026-11-20): Google or email / password. The project's public web config is
 * docs/panel/firebase.json (empty = sign-in not set up: only the admin token). The SDK is loaded from gstatic only when
 * the config exists. Roles live in Firestore roles/<uid> (owner / admin / player); this file only reads and writes them
 * through Firestore's REST API with the person's own token, so the published rules decide everything.
 */
interface FbConfig { apiKey: string; authDomain: string; projectId: string; appId?: string }
export interface FbUserInfo { uid: string; email: string; name: string; photo: string; verified: boolean }

/** Firebase JS SDK from gstatic: the newest release (npm firebase 13.4.0, 2026-11-16, imad: "latest, not outdated"). */
const V = '13.4.0';
let cfg: FbConfig | null | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let A: any = null, auth: any = null;

export async function config(): Promise<FbConfig | null> {
  if (cfg !== undefined) return cfg;
  try {
    const r = await fetch('firebase.json', { cache: 'no-cache' });
    const j = r.ok ? ((await r.json()) as Partial<FbConfig>) : {};
    cfg = j.apiKey && j.projectId ? { apiKey: j.apiKey, authDomain: j.authDomain || `${j.projectId}.firebaseapp.com`, projectId: j.projectId, appId: j.appId } : null;
  } catch { cfg = null; }
  return cfg;
}

async function sdk(): Promise<void> {
  if (auth) return;
  const c = await config();
  if (!c) throw new Error('Sign-in is not set up yet');
  const base = `https://www.gstatic.com/firebasejs/${V}/`;
  const app = await import(/* @vite-ignore */ base + 'firebase-app.js');
  A = await import(/* @vite-ignore */ base + 'firebase-auth.js');
  auth = A.getAuth(app.initializeApp(c));
  await auth.authStateReady?.();
}

const info = (u: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; emailVerified: boolean }): FbUserInfo =>
  ({ uid: u.uid, email: u.email ?? '', name: u.displayName ?? '', photo: u.photoURL ?? '', verified: u.emailVerified });

/** The person signed in on this browser (kept by Firebase), or null. */
export async function current(): Promise<FbUserInfo | null> {
  if (!(await config())) return null;
  await sdk();
  return auth.currentUser ? info(auth.currentUser) : null;
}
export async function google(): Promise<FbUserInfo> {
  await sdk();
  const p = new A.GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  return info((await A.signInWithPopup(auth, p)).user);
}
export async function emailIn(email: string, pass: string): Promise<FbUserInfo> { await sdk(); return info((await A.signInWithEmailAndPassword(auth, email, pass)).user); }
export async function emailUp(email: string, pass: string): Promise<FbUserInfo> {
  await sdk();
  const u = (await A.createUserWithEmailAndPassword(auth, email, pass)).user;
  try { await A.sendEmailVerification(u); } catch { /* the account works without it */ }
  return info(u);
}
export async function reset(email: string): Promise<void> { await sdk(); await A.sendPasswordResetEmail(auth, email); }
export async function out(): Promise<void> { if (auth) await A.signOut(auth); }
/** A fresh ID token (Firebase renews it when it is close to its hour). */
export async function idToken(): Promise<string> {
  await sdk();
  if (!auth.currentUser) throw new Error('not signed in');
  return auth.currentUser.getIdToken();
}

/** Firebase's error codes in plain words. */
export function why(e: unknown): string {
  const c = String((e as { code?: string })?.code ?? (e as Error)?.message ?? e);
  const m: Record<string, string> = {
    'auth/invalid-credential': 'Wrong email or password.', 'auth/wrong-password': 'Wrong email or password.', 'auth/user-not-found': 'No account with that email: create one.',
    'auth/email-already-in-use': 'That email already has an account: sign in.', 'auth/weak-password': 'Use at least 6 characters for the password.',
    'auth/invalid-email': 'That is not an email address.', 'auth/popup-closed-by-user': 'The Google window was closed.', 'auth/popup-blocked': 'The browser blocked the Google window: allow pop-ups for this page.',
    'auth/unauthorized-domain': 'This address is not allowed in the Firebase project yet (Authentication > Settings > Authorized domains).',
    'auth/operation-not-allowed': 'This sign-in method is off in the Firebase project (Authentication > Sign-in method).', 'auth/too-many-requests': 'Too many tries: wait a little.',
    'auth/network-request-failed': 'No connection to Google.',
  };
  return m[c] ?? c.replace(/^Firebase: /, '');
}

// ------------------------------------------------------------ Firestore (REST, with the person's own token)
type Val = { stringValue?: string; booleanValue?: boolean; integerValue?: string; timestampValue?: string };
export type Doc = { id: string; [k: string]: string | boolean | number };
const docUrl = (path: string) => `https://firestore.googleapis.com/v1/projects/${cfg!.projectId}/databases/(default)/documents/${path}`;
const toFields = (o: Record<string, string | boolean | number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? { integerValue: String(Math.round(v)) } : { stringValue: v }]));
const fromDoc = (d: { name: string; fields?: Record<string, Val> }): Doc => {
  const o: Doc = { id: d.name.split('/').pop()! };
  for (const [k, v] of Object.entries(d.fields ?? {})) o[k] = v.stringValue ?? v.booleanValue ?? (v.integerValue !== undefined ? Number(v.integerValue) : v.timestampValue ?? '');
  return o;
};
async function fs(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(docUrl(path), { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await idToken()}`, ...(init.headers ?? {}) } });
}
export async function getDoc(path: string): Promise<Doc | null> {
  const r = await fs(path);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Firestore ${r.status}`);
  return fromDoc(await r.json());
}
export async function list(col: string): Promise<Doc[]> {
  const out: Doc[] = []; let page = '';
  do {
    const r = await fs(`${col}?pageSize=300${page ? '&pageToken=' + encodeURIComponent(page) : ''}`);
    if (!r.ok) throw new Error(r.status === 403 ? 'Not allowed (owner or admin only)' : `Firestore ${r.status}`);
    const j = (await r.json()) as { documents?: { name: string; fields?: Record<string, Val> }[]; nextPageToken?: string };
    out.push(...(j.documents ?? []).map(fromDoc)); page = j.nextPageToken ?? '';
  } while (page && out.length < 3000);
  return out;
}
/** Create (fails if it exists) or, with `fields`, update only those fields. */
export async function create(col: string, id: string, o: Record<string, string | boolean | number>): Promise<boolean> {
  const r = await fs(`${col}?documentId=${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify({ fields: toFields(o) }) });
  return r.ok;
}
export async function update(path: string, o: Record<string, string | boolean | number>): Promise<void> {
  const mask = Object.keys(o).map((k) => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&');
  const r = await fs(`${path}?${mask}`, { method: 'PATCH', body: JSON.stringify({ fields: toFields(o) }) });
  if (!r.ok) throw new Error(r.status === 403 ? 'Not allowed (only the owner changes roles)' : `Firestore ${r.status}`);
}

/**
 * After a sign-in: make sure roles/<uid> exists. The rules let the owner's verified email create 'owner' (that email is
 * only in the published rules), everyone else 'player'. Returns the role.
 */
export async function ensureRole(u: FbUserInfo): Promise<string> {
  const d = await getDoc(`roles/${u.uid}`);
  if (d) return String(d.role || 'player');
  const base = { email: u.email, name: u.name || u.email.split('@')[0] || 'player', at: Date.now() };
  if (await create('roles', u.uid, { ...base, role: 'owner' })) return 'owner';
  if (await create('roles', u.uid, { ...base, role: 'player' })) return 'player';
  throw new Error('Could not save your account (Firestore rules not published yet?)');
}
