import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AI_DEFAULTS, type AiConfig } from './ai/llm.js';

export interface Config {
  scenario: string;
  scenariosDir: string;
  dataDir: string;
  worldId: string;
  /** Listen address. 127.0.0.1 = only this PC and the tunnel; 0.0.0.0 = the whole LAN. */
  host: string;
  port: number;
  tickRate: number;
  clockScale: number;
  speed: number;
  maxSpeed: number;
  capacity: number;
  lowSpec: boolean;
  snapshotEverySec: number;
  snapshotsKept: number;
  netHz: number;
  maxViewRadius: number;
  maxClients: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  cloud: { enabled: boolean; projectId: string; everySec: number; maxWritesPerDay: number };
  tunnel: {
    provider: 'ngrok' | 'tailscale' | 'cloudflare' | 'cloudflare-quick' | 'none';
    ngrokDomain?: string;
    cloudflareHostname?: string;
    bin?: { ngrok?: string; cloudflared?: string; tailscale?: string };
  };
  /** Firebase sign-in for the panel: project id (empty = from docs/panel/firebase.json). */
  auth: { projectId: string };
  /** Language model for the planner (switchable in the panel; the panel's choice wins once made). */
  ai: AiConfig;
}

export interface Secrets {
  adminToken: string;
  /** name -> token */
  viewers: Map<string, string>;
  firebase?: { client_email: string; private_key: string; project_id?: string };
  cloudflareToken?: string;
  geminiKey?: string;
  ollamaKey?: string;
}

export const DEFAULTS: Config = {
  scenario: 'post-apocalypse',
  scenariosDir: 'scenarios',
  dataDir: 'data',
  worldId: 'main',
  host: '127.0.0.1',
  port: 8787,
  tickRate: 20,
  clockScale: 10, // 1 real minute = 10 game minutes
  speed: 1,
  maxSpeed: 100,
  capacity: 4096,
  lowSpec: false,
  snapshotEverySec: 30,
  snapshotsKept: 5,
  netHz: 10,
  maxViewRadius: 96,
  maxClients: 16,
  logLevel: 'info',
  cloud: { enabled: false, projectId: '', everySec: 300, maxWritesPerDay: 15000 },
  tunnel: { provider: 'none' },
  auth: { projectId: '' },
  ai: { ...AI_DEFAULTS },
};

/** Low-spec mode: fewer ticks and network frames, smaller pools, rarer snapshots. */
const LOW_SPEC: Partial<Config> = { tickRate: 15, netHz: 8, capacity: 1024, snapshotEverySec: 60 };

/** Tiny .env reader (KEY=value lines, # comments, optional quotes). Values never leave the server. */
export function readEnv(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(path)) return out;
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[line.slice(0, eq).trim()] = v.replace(/\\n/g, '\n');
  }
  return out;
}

function parseArgs(argv: string[]): Record<string, string | true> {
  const a: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]!;
    if (!k.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) { a[k.slice(2)] = next; i++; } else a[k.slice(2)] = true;
  }
  return a;
}

export function loadConfig(argv: string[], cwd = process.cwd()): { cfg: Config; secrets: Secrets } {
  const args = parseArgs(argv);
  const file = resolve(cwd, String(args.config ?? 'worldsim.config.json'));
  let cfg: Config = structuredClone(DEFAULTS);
  if (existsSync(file)) {
    const j = JSON.parse(readFileSync(file, 'utf8')) as Partial<Config>;
    cfg = { ...cfg, ...j, cloud: { ...cfg.cloud, ...j.cloud }, tunnel: { ...cfg.tunnel, ...j.tunnel }, auth: { ...cfg.auth, ...j.auth }, ai: { ...cfg.ai, ...j.ai } };
  }
  if (args['low-spec'] || cfg.lowSpec) cfg = { ...cfg, ...LOW_SPEC, lowSpec: true };
  const num = (k: string) => (args[k] !== undefined ? Number(args[k]) : undefined);
  cfg.speed = num('speed') ?? cfg.speed;
  cfg.port = num('port') ?? cfg.port;
  cfg.tickRate = num('tick-rate') ?? cfg.tickRate;
  if (typeof args.host === 'string') cfg.host = args.host;
  if (typeof args.data === 'string') cfg.dataDir = args.data;
  if (typeof args.scenario === 'string') cfg.scenario = args.scenario;
  if (!(cfg.tickRate >= 5 && cfg.tickRate <= 60)) throw new Error('tickRate must be 5..60');
  if (!(cfg.speed > 0 && cfg.speed <= cfg.maxSpeed)) throw new Error(`speed must be in (0, ${cfg.maxSpeed}]`);

  const env = { ...readEnv(resolve(cwd, '.env')), ...process.env } as Record<string, string>;
  const viewers = new Map<string, string>();
  for (const part of (env.VIEWER_TOKENS ?? '').split(',')) {
    const [name, tok] = part.split(':').map((s) => s.trim());
    if (name && tok) {
      if (tok.length < 16) throw new Error(`viewer token for ${name} must be at least 16 characters`);
      viewers.set(name, tok);
    }
  }
  const adminToken = env.ADMIN_TOKEN ?? '';
  if (adminToken && adminToken.length < 24) throw new Error('ADMIN_TOKEN must be at least 24 characters');
  let firebase: Secrets['firebase'];
  const sa = env.FIREBASE_SERVICE_ACCOUNT;
  if (sa) {
    const p = resolve(cwd, sa);
    firebase = JSON.parse(existsSync(p) ? readFileSync(p, 'utf8') : sa);
    if (!cfg.cloud.projectId && firebase?.project_id) cfg.cloud.projectId = firebase.project_id;
  }
  if (cfg.cloud.enabled && (!firebase || !cfg.cloud.projectId)) throw new Error('cloud.enabled needs FIREBASE_SERVICE_ACCOUNT in .env');
  if (typeof args.tunnel === 'string') cfg.tunnel.provider = args.tunnel as Config['tunnel']['provider'];
  return { cfg, secrets: { adminToken, viewers, firebase, cloudflareToken: env.CLOUDFLARE_TUNNEL_TOKEN, geminiKey: env.GEMINI_API_KEY || undefined, ollamaKey: env.OLLAMA_API_KEY || undefined } };
}
