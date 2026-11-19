import { Msg, type ServerMsg, type AdminCmd } from '@worldsim/protocol';
import { Conn } from '../../client/src/conn.js';

/** Control panel, first version (milestone 5 extends it): login, time speed, pause, snapshot, live stats. */
const $ = (id: string) => document.getElementById(id)!;
let conn: Conn | null = null;
let nextId = 1;

function log(s: string): void { const el = $('log'); el.textContent = s + '\n' + el.textContent!.slice(0, 4000); }

function cmd(c: AdminCmd): void { conn?.send({ t: Msg.Admin, id: nextId++, c }); }

function connect(token: string): void {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  conn = new Conn(`${proto}//${location.host}/ws`, token, 'panel');
  conn.onState = (s, why) => { $('state').textContent = s + (why ? ` (${why})` : ''); };
  conn.onMsg = (m: ServerMsg) => {
    if (m.t === Msg.Welcome) { $('login').hidden = true; $('main').hidden = false; if (m.role !== 'admin') log('This token is a viewer token, not the admin token.'); }
    if (m.t === Msg.Stats) {
      const s = m.s;
      $('stats').textContent = [
        `tick ${s.tick}   ${s.paused ? 'PAUSED' : `speed x${s.speed} (effective x${s.effSpeed.toFixed(1)})`}   ${s.tps.toFixed(0)} ticks/s`,
        `tick time avg ${s.tickMsAvg.toFixed(3)} ms, p95 ${s.tickMsP95.toFixed(3)} ms, max ${s.tickMsMax.toFixed(2)} ms`,
        `RAM ${s.rssMb.toFixed(0)} MB (heap ${s.heapMb.toFixed(0)} MB)   CPU ${s.cpuPct.toFixed(0)} %`,
        `agents ${s.agents}   entities ${s.entities}   clients ${s.clients}   uptime ${s.uptimeSec} s`,
        `last snapshot ${s.lastSnapshotAt ? new Date(s.lastSnapshotAt).toLocaleTimeString() : '-'}`,
      ].join('\n');
    }
    if (m.t === Msg.AdminResult) log(`${m.ok ? 'ok' : 'error'} ${m.ok ? JSON.stringify(m.data) : m.err}`);
    if (m.t === Msg.Error) log('error ' + m.code);
  };
  conn.open();
}

$('go').onclick = () => { const t = ($('token') as HTMLInputElement).value.trim(); try { sessionStorage.setItem('tok', t); } catch { /* private mode */ } connect(t); };
$('pause').onclick = () => cmd({ cmd: 'pause', paused: true });
$('resume').onclick = () => cmd({ cmd: 'pause', paused: false });
$('snap').onclick = () => cmd({ cmd: 'snapshot' });
for (const b of document.querySelectorAll<HTMLButtonElement>('[data-speed]')) b.onclick = () => cmd({ cmd: 'speed', speed: Number(b.dataset.speed) });
try { const t = sessionStorage.getItem('tok'); if (t) connect(t); } catch { /* none */ }
