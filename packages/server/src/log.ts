import { appendFileSync, mkdirSync, renameSync, statSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export type Level = 'debug' | 'info' | 'warn' | 'error';
const ORDER: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };

/** Structured logs: one JSON object per line, to stdout and a file rotated at 10 MB (3 kept). */
export class Logger {
  private size = 0;
  readonly recent: string[] = [];
  /** Every warning / error, whatever the level filter (app.ts keeps them in the error log). */
  onProblem: (level: 'warn' | 'error', msg: string, data?: Record<string, unknown>) => void = () => {};

  constructor(private readonly level: Level = 'info', private readonly file?: string, private readonly quiet = false) {
    if (file) {
      mkdirSync(dirname(file), { recursive: true });
      this.size = existsSync(file) ? statSync(file).size : 0;
    }
  }

  private write(level: Level, msg: string, data?: Record<string, unknown>): void {
    if (level === 'warn' || level === 'error') { try { this.onProblem(level, msg, data); } catch { /* never stop the simulation */ } }
    if (ORDER[level] < ORDER[this.level]) return;
    const line = JSON.stringify({ t: new Date().toISOString(), level, msg, ...data });
    this.recent.push(line);
    if (this.recent.length > 200) this.recent.shift();
    if (!this.quiet) (level === 'error' || level === 'warn' ? process.stderr : process.stdout).write(line + '\n');
    if (!this.file) return;
    try {
      if (this.size > 10e6) {
        for (let k = 2; k >= 1; k--) if (existsSync(`${this.file}.${k}`)) renameSync(`${this.file}.${k}`, `${this.file}.${k + 1}`);
        renameSync(this.file, `${this.file}.1`);
        this.size = 0;
      }
      appendFileSync(this.file, line + '\n');
      this.size += line.length + 1;
    } catch { /* logging must never stop the simulation */ }
  }

  debug(msg: string, data?: Record<string, unknown>) { this.write('debug', msg, data); }
  info(msg: string, data?: Record<string, unknown>) { this.write('info', msg, data); }
  warn(msg: string, data?: Record<string, unknown>) { this.write('warn', msg, data); }
  error(msg: string, data?: Record<string, unknown>) { this.write('error', msg, data); }
}
