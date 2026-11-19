import { Encoder, Decoder } from '@msgpack/msgpack';
import type { ClientMsg, ServerMsg } from './messages.js';

// One encoder / decoder each: they reuse their internal buffers (no allocation besides the output view).
const enc = new Encoder({ ignoreUndefined: true });
const dec = new Decoder();

/** Encode a message. The returned bytes are a copy (safe to keep / send asynchronously). */
export function encode(m: ClientMsg | ServerMsg): Uint8Array {
  return enc.encode(m);
}

export function decode(b: Uint8Array | ArrayBuffer): unknown {
  return dec.decode(b instanceof ArrayBuffer ? new Uint8Array(b) : b);
}

/** Pack Int32 records into bytes (little endian, the native order of every target). */
export function packI32(src: Int32Array, len: number): Uint8Array {
  return new Uint8Array(src.buffer, src.byteOffset, len * 4).slice();
}

export function unpackI32(b: Uint8Array): Int32Array {
  // Copy when unaligned (msgpack bin data may start anywhere in the message buffer).
  if (b.byteOffset % 4 === 0) return new Int32Array(b.buffer, b.byteOffset, b.byteLength >> 2);
  return new Int32Array(copyBytes(b).buffer);
}

/** A real copy with its own ArrayBuffer (Node's Buffer#slice is a view into a shared pool, not a copy). */
export function copyBytes(b: Uint8Array): Uint8Array {
  const c = new Uint8Array(b.byteLength);
  c.set(b);
  return c;
}
