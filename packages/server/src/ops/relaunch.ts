import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The repository root (this file is packages/server/dist/ops/relaunch.js once built). */
export const ROOT = resolve(fileURLToPath(import.meta.url), '../../../../..');

export interface RelaunchJob {
  pid: number; node: string; args: string[]; cwd: string; dataDir: string; host: string; port: number;
  before?: string; why: string; at: number; waitSec?: number;
}

/**
 * The command that starts this server again: the same Node, flags and arguments, the main script written relative to the
 * working directory with forward slashes (as tools/watchdog.ps1 starts it, so the watchdog recognises the process).
 */
export function sameCommand(): { node: string; args: string[]; cwd: string } {
  const cwd = process.cwd();
  let main = process.argv[1] ?? 'packages/server/dist/main.js';
  const rel = relative(cwd, main);
  if (rel && !rel.startsWith('..') && !isAbsolute(rel)) main = rel.split(sep).join('/');
  return { node: process.execPath, args: [...process.execArgv, main, ...process.argv.slice(2)], cwd };
}

/** PowerShell single-quoted string. */
const psq = (s: string) => `'${s.replace(/'/g, "''")}'`;
const winq = (s: string) => `"${s.replace(/"/g, '\\"')}"`;

/**
 * Write data/relaunch.json and start tools/relaunch.mjs on its own. Windows: through WMI (Win32_Process.Create), so the
 * helper is not in this process's tree or job and nothing that ends this server ends it too; elsewhere / if that fails: a
 * detached child. Returns how it was started ('' = it could not be).
 */
export function relaunch(o: { dataDir: string; host: string; port: number; why: string; before?: string; log?: (m: string, d?: Record<string, unknown>) => void }): string {
  const helper = join(ROOT, 'tools', 'relaunch.mjs');
  if (!existsSync(helper)) { o.log?.('relaunch helper missing', { helper }); return ''; }
  mkdirSync(o.dataDir, { recursive: true });
  const job: RelaunchJob = { pid: process.pid, ...sameCommand(), dataDir: o.dataDir, host: o.host, port: o.port, before: o.before || undefined, why: o.why, at: Date.now() };
  const file = join(o.dataDir, 'relaunch.json');
  writeFileSync(file, JSON.stringify(job, null, 1));
  if (process.platform === 'win32') {
    const cmdLine = [process.execPath, helper, file].map(winq).join(' ');
    const ps = `$ErrorActionPreference = 'Stop'
$si = New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{ ShowWindow = [uint16]0 }
$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = ${psq(cmdLine)}; CurrentDirectory = ${psq(job.cwd)}; ProcessStartupInformation = $si }
if ($r.ReturnValue -ne 0) { Write-Output "Win32_Process.Create returned $($r.ReturnValue)"; exit 3 }
Write-Output $r.ProcessId`;
    try {
      const out = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', Buffer.from(ps, 'utf16le').toString('base64')],
        { encoding: 'utf8', timeout: 30_000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
      o.log?.('relaunch helper started through WMI', { pid: out });
      return 'wmi';
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string; message?: string };
      o.log?.('relaunch through WMI failed, starting it as a detached child', { err: `${e.stdout ?? ''}${e.stderr ?? ''}`.trim() || e.message });
    }
  }
  const child = spawn(process.execPath, [helper, file], { cwd: job.cwd, detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  o.log?.('relaunch helper started', { pid: child.pid });
  return 'detached';
}
