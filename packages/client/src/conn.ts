import { Msg, PROTOCOL_VERSION, encode, decode, type ServerMsg, type ClientMsg } from '@worldsim/protocol';

/**
 * WebSocket link with automatic reconnect + resume (exponential backoff up to 10 s).
 * Shared by the viewer and the control panel.
 */
export class Conn {
  ws: WebSocket | null = null;
  session = '';
  private retry = 0;
  private closed = false;
  onMsg: (m: ServerMsg) => void = () => {};
  onState: (s: 'connecting' | 'open' | 'closed', why?: string) => void = () => {};

  /** `token` may be a function (the panel's Firebase sign-in: a fresh ID token at every connect, they last an hour). */
  constructor(private readonly url: string, private readonly token: string | (() => Promise<string>), private readonly name = 'viewer') {}

  open(): void {
    this.closed = false;
    this.onState('connecting');
    const ws = new WebSocket(this.url);
    ws.binaryType = 'arraybuffer';
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      const hello = (token: string) => this.send({ t: Msg.Hello, v: PROTOCOL_VERSION, token, name: this.name, resume: this.session || undefined });
      if (typeof this.token === 'string') hello(this.token);
      else this.token().then(hello, () => ws.close());
    };
    ws.onmessage = (ev) => {
      const m = decode(ev.data as ArrayBuffer) as ServerMsg;
      if (m.t === Msg.Welcome) { this.session = m.session; this.onState('open'); }
      if (m.t === Msg.Error && (m.code === 'auth' || m.code === 'version' || m.code === 'locked')) this.closed = true;
      this.onMsg(m);
    };
    ws.onclose = (ev) => {
      this.onState('closed', ev.reason);
      if (this.closed) return;
      const wait = Math.min(10000, 500 * 2 ** this.retry++);
      setTimeout(() => this.open(), wait);
    };
  }

  send(m: ClientMsg): void {
    if (this.ws && this.ws.readyState === 1) this.ws.send(encode(m));
  }

  close(): void { this.closed = true; this.ws?.close(); }
}
