import { account, cmd, setAccountName } from './api.js';
import * as fb from './fb.js';
import { help } from './help.js';
import { card, on, setHtml, val, type Screen } from './screen.js';
import { ago, esc, gameTime, icon, meter, toast } from './util.js';

const err = (e: unknown) => toast(String((e as Error).message ?? e), 'err');

interface Me {
  /** Signed in with the admin token: no account, no character of one's own. */
  token?: boolean;
  name: string; role: string; email: string; tv: boolean; clock: { gameSec: number };
  character: { id: number; map: string; x: number; y: number; hp: number; hunger: number; thirst: number; tired: number; asleep: boolean; online: boolean; inv: Record<string, number> } | null;
}

/** "Me": join the world as a person, see my character, pair my own TV. Every signed-in account has it; players only this. */
export const meScreen: Screen = {
  title: 'My character', icon: 'user', help: 'me', every: 5,
  render() {
    return `<div class="grid2">
      <div id="meMain">${card('Loading', '<div class="skel"></div>')}</div>
      ${card('Your account', `<div id="meAcct"></div>`, { help: help('account') })}
      ${card('Play on your TV', `<ol class="steps">
          <li>On the TV, open <b>My PC</b> &gt; <b>App Store</b> and install <b>World</b>.</li>
          <li>Open it: it plays at once as the My PC user on that TV.</li>
          <li>If the TV shows a <b>6-digit code</b> instead (TVs need approval), type it here: the TV then plays as your character.</li></ol>
          <div class="row2"><input id="meCode" inputmode="numeric" maxlength="6" placeholder="123456" aria-label="Code on the TV"><button class="btn primary" id="meCodeGo">${icon('check')} Link this TV</button></div>
          <div id="meTv" class="dim small"></div>`, { help: help('myTv') })}
    </div>`;
  },
  async mount() {
    on('#meCodeGo', 'click', async () => {
      const code = val('meCode').replace(/\D/g, '');
      if (code.length !== 6) { toast('Type the 6 digits shown on the TV', 'err'); return; }
      try { const r = await cmd<{ name: string }>({ cmd: 'approveMine', code }); toast(`The TV now plays as ${r.name}`, 'ok'); (document.getElementById('meCode') as HTMLInputElement).value = ''; void this.refresh!(); } catch (e) { err(e); }
    });
    await this.refresh!();
  },
  async refresh() {
    const me = await cmd<Me>({ cmd: 'me' });
    if (me.token) {
      setHtml('meAcct', `<p>You are signed in with the <b>admin token</b>, which is the PC's own key, not an account. It has every admin tool but no character of its own.</p>
        <p class="dim small">To play and link a TV under your name, sign out and sign in with Google or email.</p>`);
      setHtml('meMain', ''); setHtml('meTv', 'Sign in with an account to link a TV.');
      return;
    }
    const role = me.role === 'owner' ? 'Owner' : me.role === 'admin' ? 'Admin' : 'Player';
    setHtml('meAcct', `<div class="kv"><span>Email</span><b>${esc(me.email || '-')}</b><span>Role</span><b><span class="tag ${me.role === 'player' ? '' : 'ok'}">${role}</span></b>
      <span>Character</span><b>${esc(me.name || 'not in the world yet')}</b></div>
      <p class="dim small">${me.role === 'player' ? 'Players live in the world like everyone else: same needs, same abilities, no admin tools.' : 'You can use the admin tools here and in the game.'}</p>`);
    setHtml('meTv', me.tv ? `A TV plays as ${esc(me.name)}. <button class="btn sm ghost" id="meTvRm">Unlink it</button>` : me.name ? 'No TV linked yet.' : 'Join the world first.');
    document.getElementById('meTvRm')?.addEventListener('click', async () => { if (!confirm('Unlink your TV? It will have to show a new code.')) return; try { await cmd({ cmd: 'revokeMine' }); toast('TV unlinked', 'ok'); void this.refresh!(); } catch (e) { err(e); } });
    if (!me.name) {
      if (document.getElementById('meJoin')) return; // keep what they are typing
      setHtml('meMain', card('Join the world', `<p>Pick your character's name. You arrive in Old Town and live there like the others: you get hungry, thirsty and tired, you can talk, work, build and fight. While you are away your character sleeps.</p>
        <div class="row2"><input id="meName" maxlength="20" placeholder="Your name" aria-label="Your name"><button class="btn primary" id="meJoin">${icon('plus')} Join</button></div>`, { help: help('join') }));
      document.getElementById('meJoin')!.onclick = async () => {
        const name = val('meName');
        try {
          const r = await cmd<{ name: string }>({ cmd: 'joinWorld', name });
          setAccountName(r.name);
          try { const u = await fb.current(); if (u) await fb.create('players', u.uid, { name: r.name, email: u.email, at: Date.now() }); } catch { /* the server has it anyway */ }
          toast(`Welcome, ${r.name}!`, 'ok'); void this.refresh!();
        } catch (e) { err(e); }
      };
      return;
    }
    const c = me.character;
    const inv = c ? Object.entries(c.inv ?? {}).filter(([, v]) => v > 0).map(([k, v]) => `${v} ${k}`).join(', ') : '';
    setHtml('meMain', card(esc(me.name), !c ? '<div class="empty">Your character is not in the world right now.</div>' : `
      <p>${c.online ? '<span class="tag ok">Playing now</span>' : c.asleep ? '<span class="tag">Asleep (away)</span>' : '<span class="tag">Here</span>'}
        ${icon('map')} ${esc(c.map)} at (${c.x}, ${c.y}) · ${gameTime(me.clock.gameSec)}</p>
      <div class="needs">${([['Food', c.hunger, true], ['Water', c.thirst, true], ['Rest', c.tired, true], ['Health', c.hp, false]] as [string, number, boolean][])
        .map(([l, v, lack]) => `<span>${l}</span>${meter(v, lack, l)}<b>${Math.round(lack ? 100 - v : v)}${lack ? '%' : ''}</b>`).join('')}</div>
      <p class="dim small">Bag: ${esc(inv || 'empty')}</p>`, { help: help('me') }));
  },
};

/** Owner / admins: who has an account, their role, their character. Only the owner changes roles (Firestore rules). */
export const usersScreen: Screen = {
  title: 'Users & roles', icon: 'shield', help: 'users', every: 20,
  render() {
    return `<div class="grid2">
      ${card('Accounts', `<div id="uList"><div class="skel"></div></div>`, { help: help('users'), tools: `<button class="btn sm ghost" id="uR">${icon('refresh')}</button>` })}
      ${card('Roles', `<div class="kv"><span><span class="tag ok">Owner</span></span><b>Everything, and gives roles</b>
        <span><span class="tag ok">Admin</span></span><b>Every page of this panel, admin tools in the game</b>
        <span><span class="tag">Player</span></span><b>Joins the world as a person, links their own TV, nothing else</b></div>
        <p class="dim small">A new account is a player. A role change counts from that person's next sign-in.</p>`, { help: help('roles') })}
    </div>`;
  },
  async mount() { on('#uR', 'click', () => void this.refresh!()); await this.refresh!(); },
  async refresh() {
    const owner = account?.role === 'owner';
    let roles: fb.Doc[] = [];
    let fsErr = '';
    try { roles = await fb.list('roles'); } catch (e) { fsErr = String((e as Error).message ?? e); }
    const srv = await cmd<{ signIn: boolean; list: { uid: string; name: string; email: string; role: string; lastSeen: number; online: boolean; tv: boolean }[]; free: string[] }>({ cmd: 'accounts' });
    const byUid = new Map(srv.list.map((a) => [a.uid, a]));
    const uids = [...new Set([...roles.map((r) => r.id), ...srv.list.map((a) => a.uid)])];
    const rows = uids.map((uid) => {
      const r = roles.find((x) => x.id === uid), a = byUid.get(uid);
      const role = String(r?.role ?? a?.role ?? 'player'), email = String(r?.email || a?.email || '');
      const sel = owner && uid !== account?.uid
        ? `<select data-uid="${esc(uid)}" aria-label="Role">${['player', 'admin', 'owner'].map((x) => `<option value="${x}"${x === role ? ' selected' : ''}>${x[0]!.toUpperCase() + x.slice(1)}</option>`).join('')}</select>`
        : `<span class="tag ${role === 'player' ? '' : 'ok'}">${esc(role)}</span>`;
      const canLink = (owner || account?.role === 'admin') && a;
      const who = canLink
        ? `<select data-link="${esc(uid)}" aria-label="Player"><option value="">${a!.name ? esc(a!.name) : '- no player -'}</option>${srv.free.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('')}${a!.name ? '<option value="-">Detach</option>' : ''}</select>`
        : `<b>${esc(a?.name || '-')}</b>`;
      return `<tr><td>${who}${uid === account?.uid ? ' <small class="dim">(you)</small>' : ''}</td><td>${esc(email)}</td><td>${sel}</td>
        <td>${a?.online ? '<span class="tag ok">playing</span>' : a?.lastSeen ? ago(a.lastSeen) : '-'}</td><td>${a?.tv ? icon('tv') : ''}</td></tr>`;
    });
    setHtml('uList', (fsErr ? `<p class="bad small">${esc(fsErr)}</p>` : '') + (rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Player</th><th>Email</th><th>Role</th><th>Last seen</th><th>TV</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`
      : '<div class="empty">Nobody has signed in yet.</div>'));
    on('#uList select[data-link]', 'change', async (el) => {
      const s = el as HTMLSelectElement;
      if (!s.value) return;
      try { await cmd({ cmd: 'linkPlayer', uid: s.dataset.link!, name: s.value === '-' ? '' : s.value }); toast(s.value === '-' ? 'Player detached' : `Linked to ${s.value}`, 'ok'); } catch (e) { err(e); }
      void this.refresh!();
    });
    on('#uList select[data-uid]', 'change', async (el) => {
      const s = el as HTMLSelectElement;
      if (s.value === 'owner' && !confirm('Make them an owner too? They could then change everyone\'s role, yours included.')) { void this.refresh!(); return; }
      try { await fb.update(`roles/${s.dataset.uid}`, { role: s.value }); toast('Role changed (from their next sign-in)', 'ok'); } catch (e) { err(e); void this.refresh!(); }
    });
  },
};
