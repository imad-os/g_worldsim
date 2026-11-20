var qt={None:0,Agent:1,Projectile:2,Item:3,Prop:4,Threat:5,Player:6},Tr={Alive:1,Moving:2,Sleeping:4,Transit:8,Dead:16,Child:32},Ye={Hello:"hi",View:"view",Ping:"ping",Who:"who",Admin:"adm",Pair:"pair",Join:"join",Input:"in",Do:"do",Info:"info",Welcome:"wel",Error:"err",Chunk:"chk",ChunkDrop:"chx",Frame:"frm",Stats:"sts",Pong:"pong",AdminResult:"admr",PairCode:"pairc",Paired:"paired",Notice:"note",You:"you"};function gh(i){let e=i.length,t=0,n=0;for(;n<e;){let s=i.charCodeAt(n++);if((s&4294967168)===0){t++;continue}else if((s&4294965248)===0)t+=2;else{if(s>=55296&&s<=56319&&n<e){let r=i.charCodeAt(n);(r&64512)===56320&&(++n,s=((s&1023)<<10)+(r&1023)+65536)}(s&4294901760)===0?t+=3:t+=4}}return t}function Gd(i,e,t){let n=i.length,s=t,r=0;for(;r<n;){let o=i.charCodeAt(r++);if((o&4294967168)===0){e[s++]=o;continue}else if((o&4294965248)===0)e[s++]=o>>6&31|192;else{if(o>=55296&&o<=56319&&r<n){let a=i.charCodeAt(r);(a&64512)===56320&&(++r,o=((o&1023)<<10)+(a&1023)+65536)}(o&4294901760)===0?(e[s++]=o>>12&15|224,e[s++]=o>>6&63|128):(e[s++]=o>>18&7|240,e[s++]=o>>12&63|128,e[s++]=o>>6&63|128)}e[s++]=o&63|128}}var Wd=new TextEncoder,Xd=50;function qd(i,e,t){Wd.encodeInto(i,e.subarray(t))}function xh(i,e,t){i.length>Xd?qd(i,e,t):Gd(i,e,t)}var Yd=4096;function fa(i,e,t){let n=e,s=n+t,r=[],o="";for(;n<s;){let a=i[n++];if((a&128)===0)r.push(a);else if((a&224)===192){let l=i[n++]&63;r.push((a&31)<<6|l)}else if((a&240)===224){let l=i[n++]&63,h=i[n++]&63;r.push((a&31)<<12|l<<6|h)}else if((a&248)===240){let l=i[n++]&63,h=i[n++]&63,c=i[n++]&63,u=(a&7)<<18|l<<12|h<<6|c;u>65535&&(u-=65536,r.push(u>>>10&1023|55296),u=56320|u&1023),r.push(u)}else r.push(a);r.length>=Yd&&(o+=String.fromCharCode(...r),r.length=0)}return r.length>0&&(o+=String.fromCharCode(...r)),o}var $d=new TextDecoder,Zd=200;function Jd(i,e,t){let n=i.subarray(e,e+t);return $d.decode(n)}function _h(i,e,t){return t>Zd?Jd(i,e,t):fa(i,e,t)}var Mi=class{type;data;constructor(e,t){this.type=e,this.data=t}};var zt=class i extends Error{constructor(e){super(e);let t=Object.create(i.prototype);Object.setPrototypeOf(this,t),Object.defineProperty(this,"name",{configurable:!0,enumerable:!1,value:i.name})}};function yh(i,e,t){let n=t/4294967296,s=t;i.setUint32(e,n),i.setUint32(e+4,s)}function Ar(i,e,t){let n=Math.floor(t/4294967296),s=t;i.setUint32(e,n),i.setUint32(e+4,s)}function Cr(i,e){let t=i.getInt32(e),n=i.getUint32(e+4);return t*4294967296+n}function vh(i,e){let t=i.getUint32(e),n=i.getUint32(e+4);return t*4294967296+n}var Kd=-1,Qd=4294967296-1,jd=17179869184-1;function ef({sec:i,nsec:e}){if(i>=0&&e>=0&&i<=jd)if(e===0&&i<=Qd){let t=new Uint8Array(4);return new DataView(t.buffer).setUint32(0,i),t}else{let t=i/4294967296,n=i&4294967295,s=new Uint8Array(8),r=new DataView(s.buffer);return r.setUint32(0,e<<2|t&3),r.setUint32(4,n),s}else{let t=new Uint8Array(12),n=new DataView(t.buffer);return n.setUint32(0,e),Ar(n,4,i),t}}function tf(i){let e=i.getTime(),t=Math.floor(e/1e3),n=(e-t*1e3)*1e6,s=Math.floor(n/1e9);return{sec:t+s,nsec:n-s*1e9}}function nf(i){if(i instanceof Date){let e=tf(i);return ef(e)}else return null}function sf(i){let e=new DataView(i.buffer,i.byteOffset,i.byteLength);switch(i.byteLength){case 4:return{sec:e.getUint32(0),nsec:0};case 8:{let t=e.getUint32(0),n=e.getUint32(4),s=(t&3)*4294967296+n,r=t>>>2;return{sec:s,nsec:r}}case 12:{let t=Cr(e,4),n=e.getUint32(0);return{sec:t,nsec:n}}default:throw new zt(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${i.length}`)}}function rf(i){let e=sf(i);return new Date(e.sec*1e3+e.nsec/1e6)}var Mh={type:Kd,encode:nf,decode:rf};var qi=class i{static defaultCodec=new i;__brand;builtInEncoders=[];builtInDecoders=[];encoders=[];decoders=[];constructor(){this.register(Mh)}register({type:e,encode:t,decode:n}){if(e>=0)this.encoders[e]=t,this.decoders[e]=n;else{let s=-1-e;this.builtInEncoders[s]=t,this.builtInDecoders[s]=n}}tryToEncode(e,t){for(let n=0;n<this.builtInEncoders.length;n++){let s=this.builtInEncoders[n];if(s!=null){let r=s(e,t);if(r!=null){let o=-1-n;return new Mi(o,r)}}}for(let n=0;n<this.encoders.length;n++){let s=this.encoders[n];if(s!=null){let r=s(e,t);if(r!=null){let o=n;return new Mi(o,r)}}}return e instanceof Mi?e:null}decode(e,t,n){let s=t<0?this.builtInDecoders[-1-t]:this.decoders[t];return s?s(e,t,n):new Mi(t,e)}};function of(i){return i instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&i instanceof SharedArrayBuffer}function Ns(i){return i instanceof Uint8Array?i:ArrayBuffer.isView(i)?new Uint8Array(i.buffer,i.byteOffset,i.byteLength):of(i)?new Uint8Array(i):Uint8Array.from(i)}var af=100,lf=2048,Fs=class i{extensionCodec;context;useBigInt64;maxDepth;initialBufferSize;sortKeys;forceFloat32;ignoreUndefined;forceIntegerToFloat;pos;view;bytes;entered=!1;constructor(e){this.extensionCodec=e?.extensionCodec??qi.defaultCodec,this.context=e?.context,this.useBigInt64=e?.useBigInt64??!1,this.maxDepth=e?.maxDepth??af,this.initialBufferSize=e?.initialBufferSize??lf,this.sortKeys=e?.sortKeys??!1,this.forceFloat32=e?.forceFloat32??!1,this.ignoreUndefined=e?.ignoreUndefined??!1,this.forceIntegerToFloat=e?.forceIntegerToFloat??!1,this.pos=0,this.view=new DataView(new ArrayBuffer(this.initialBufferSize)),this.bytes=new Uint8Array(this.view.buffer)}clone(){return new i({extensionCodec:this.extensionCodec,context:this.context,useBigInt64:this.useBigInt64,maxDepth:this.maxDepth,initialBufferSize:this.initialBufferSize,sortKeys:this.sortKeys,forceFloat32:this.forceFloat32,ignoreUndefined:this.ignoreUndefined,forceIntegerToFloat:this.forceIntegerToFloat})}reinitializeState(){this.pos=0}encodeSharedRef(e){if(this.entered)return this.clone().encodeSharedRef(e);try{return this.entered=!0,this.reinitializeState(),this.doEncode(e,1),this.bytes.subarray(0,this.pos)}finally{this.entered=!1}}encode(e){if(this.entered)return this.clone().encode(e);try{return this.entered=!0,this.reinitializeState(),this.doEncode(e,1),this.bytes.slice(0,this.pos)}finally{this.entered=!1}}doEncode(e,t){if(t>this.maxDepth)throw new Error(`Too deep objects in depth ${t}`);e==null?this.encodeNil():typeof e=="boolean"?this.encodeBoolean(e):typeof e=="number"?this.forceIntegerToFloat?this.encodeNumberAsFloat(e):this.encodeNumber(e):typeof e=="string"?this.encodeString(e):this.useBigInt64&&typeof e=="bigint"?this.encodeBigInt64(e):this.encodeObject(e,t)}ensureBufferSizeToWrite(e){let t=this.pos+e;this.view.byteLength<t&&this.resizeBuffer(t*2)}resizeBuffer(e){let t=new ArrayBuffer(e),n=new Uint8Array(t),s=new DataView(t);n.set(this.bytes),this.view=s,this.bytes=n}encodeNil(){this.writeU8(192)}encodeBoolean(e){e===!1?this.writeU8(194):this.writeU8(195)}encodeNumber(e){!this.forceIntegerToFloat&&Number.isSafeInteger(e)?e>=0?e<128?this.writeU8(e):e<256?(this.writeU8(204),this.writeU8(e)):e<65536?(this.writeU8(205),this.writeU16(e)):e<4294967296?(this.writeU8(206),this.writeU32(e)):this.useBigInt64?this.encodeNumberAsFloat(e):(this.writeU8(207),this.writeU64(e)):e>=-32?this.writeU8(224|e+32):e>=-128?(this.writeU8(208),this.writeI8(e)):e>=-32768?(this.writeU8(209),this.writeI16(e)):e>=-2147483648?(this.writeU8(210),this.writeI32(e)):this.useBigInt64?this.encodeNumberAsFloat(e):(this.writeU8(211),this.writeI64(e)):this.encodeNumberAsFloat(e)}encodeNumberAsFloat(e){this.forceFloat32?(this.writeU8(202),this.writeF32(e)):(this.writeU8(203),this.writeF64(e))}encodeBigInt64(e){e>=BigInt(0)?(this.writeU8(207),this.writeBigUint64(e)):(this.writeU8(211),this.writeBigInt64(e))}writeStringHeader(e){if(e<32)this.writeU8(160+e);else if(e<256)this.writeU8(217),this.writeU8(e);else if(e<65536)this.writeU8(218),this.writeU16(e);else if(e<4294967296)this.writeU8(219),this.writeU32(e);else throw new Error(`Too long string: ${e} bytes in UTF-8`)}encodeString(e){let n=gh(e);this.ensureBufferSizeToWrite(5+n),this.writeStringHeader(n),xh(e,this.bytes,this.pos),this.pos+=n}encodeObject(e,t){let n=this.extensionCodec.tryToEncode(e,this.context);if(n!=null)this.encodeExtension(n);else if(Array.isArray(e))this.encodeArray(e,t);else if(ArrayBuffer.isView(e))this.encodeBinary(e);else if(typeof e=="object")this.encodeMap(e,t);else throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(e)}`)}encodeBinary(e){let t=e.byteLength;if(t<256)this.writeU8(196),this.writeU8(t);else if(t<65536)this.writeU8(197),this.writeU16(t);else if(t<4294967296)this.writeU8(198),this.writeU32(t);else throw new Error(`Too large binary: ${t}`);let n=Ns(e);this.writeU8a(n)}encodeArray(e,t){let n=e.length;if(n<16)this.writeU8(144+n);else if(n<65536)this.writeU8(220),this.writeU16(n);else if(n<4294967296)this.writeU8(221),this.writeU32(n);else throw new Error(`Too large array: ${n}`);for(let s of e)this.doEncode(s,t+1)}countWithoutUndefined(e,t){let n=0;for(let s of t)e[s]!==void 0&&n++;return n}encodeMap(e,t){let n=Object.keys(e);this.sortKeys&&n.sort();let s=this.ignoreUndefined?this.countWithoutUndefined(e,n):n.length;if(s<16)this.writeU8(128+s);else if(s<65536)this.writeU8(222),this.writeU16(s);else if(s<4294967296)this.writeU8(223),this.writeU32(s);else throw new Error(`Too large map object: ${s}`);for(let r of n){let o=e[r];this.ignoreUndefined&&o===void 0||(this.encodeString(r),this.doEncode(o,t+1))}}encodeExtension(e){if(typeof e.data=="function"){let n=e.data(this.pos+6),s=n.length;if(s>=4294967296)throw new Error(`Too large extension object: ${s}`);this.writeU8(201),this.writeU32(s),this.writeI8(e.type),this.writeU8a(n);return}let t=e.data.length;if(t===1)this.writeU8(212);else if(t===2)this.writeU8(213);else if(t===4)this.writeU8(214);else if(t===8)this.writeU8(215);else if(t===16)this.writeU8(216);else if(t<256)this.writeU8(199),this.writeU8(t);else if(t<65536)this.writeU8(200),this.writeU16(t);else if(t<4294967296)this.writeU8(201),this.writeU32(t);else throw new Error(`Too large extension object: ${t}`);this.writeI8(e.type),this.writeU8a(e.data)}writeU8(e){this.ensureBufferSizeToWrite(1),this.view.setUint8(this.pos,e),this.pos++}writeU8a(e){let t=e.length;this.ensureBufferSizeToWrite(t),this.bytes.set(e,this.pos),this.pos+=t}writeI8(e){this.ensureBufferSizeToWrite(1),this.view.setInt8(this.pos,e),this.pos++}writeU16(e){this.ensureBufferSizeToWrite(2),this.view.setUint16(this.pos,e),this.pos+=2}writeI16(e){this.ensureBufferSizeToWrite(2),this.view.setInt16(this.pos,e),this.pos+=2}writeU32(e){this.ensureBufferSizeToWrite(4),this.view.setUint32(this.pos,e),this.pos+=4}writeI32(e){this.ensureBufferSizeToWrite(4),this.view.setInt32(this.pos,e),this.pos+=4}writeF32(e){this.ensureBufferSizeToWrite(4),this.view.setFloat32(this.pos,e),this.pos+=4}writeF64(e){this.ensureBufferSizeToWrite(8),this.view.setFloat64(this.pos,e),this.pos+=8}writeU64(e){this.ensureBufferSizeToWrite(8),yh(this.view,this.pos,e),this.pos+=8}writeI64(e){this.ensureBufferSizeToWrite(8),Ar(this.view,this.pos,e),this.pos+=8}writeBigUint64(e){this.ensureBufferSizeToWrite(8),this.view.setBigUint64(this.pos,e),this.pos+=8}writeBigInt64(e){this.ensureBufferSizeToWrite(8),this.view.setBigInt64(this.pos,e),this.pos+=8}};function Rr(i){return`${i<0?"-":""}0x${Math.abs(i).toString(16).padStart(2,"0")}`}var cf=16,hf=16,Ir=class{hit=0;miss=0;caches;maxKeyLength;maxLengthPerKey;constructor(e=cf,t=hf){this.maxKeyLength=e,this.maxLengthPerKey=t,this.caches=[];for(let n=0;n<this.maxKeyLength;n++)this.caches.push([])}canBeCached(e){return e>0&&e<=this.maxKeyLength}find(e,t,n){let s=this.caches[n-1];e:for(let r of s){let o=r.bytes;for(let a=0;a<n;a++)if(o[a]!==e[t+a])continue e;return r.str}return null}store(e,t){let n=this.caches[e.length-1],s={bytes:e,str:t};n.length>=this.maxLengthPerKey?n[Math.random()*n.length|0]=s:n.push(s)}decode(e,t,n){let s=this.find(e,t,n);if(s!=null)return this.hit++,s;this.miss++;let r=fa(e,t,n),o=Uint8Array.prototype.slice.call(e,t,t+n);return this.store(o,r),r}};var pa="array",ks="map_key",Sh="map_value",uf=i=>{if(typeof i=="string"||typeof i=="number")return i;throw new zt("The type of key must be string or number but "+typeof i)},ma=class{stack=[];stackHeadPosition=-1;get length(){return this.stackHeadPosition+1}top(){return this.stack[this.stackHeadPosition]}pushArrayState(e){let t=this.getUninitializedStateFromPool();t.type=pa,t.position=0,t.size=e,t.array=new Array(e)}pushMapState(e){let t=this.getUninitializedStateFromPool();t.type=ks,t.readCount=0,t.size=e,t.map={}}getUninitializedStateFromPool(){if(this.stackHeadPosition++,this.stackHeadPosition===this.stack.length){let e={type:void 0,size:0,array:void 0,position:0,readCount:0,map:void 0,key:null};this.stack.push(e)}return this.stack[this.stackHeadPosition]}release(e){if(this.stack[this.stackHeadPosition]!==e)throw new Error("Invalid stack state. Released state is not on top of the stack.");if(e.type===pa){let n=e;n.size=0,n.array=void 0,n.position=0,n.type=void 0}if(e.type===ks||e.type===Sh){let n=e;n.size=0,n.map=void 0,n.readCount=0,n.type=void 0}this.stackHeadPosition--}reset(){this.stack.length=0,this.stackHeadPosition=-1}},Bs=-1,ga=new DataView(new ArrayBuffer(0)),df=new Uint8Array(ga.buffer);try{ga.getInt8(0)}catch(i){if(!(i instanceof RangeError))throw new Error("This module is not supported in the current JavaScript engine because DataView does not throw RangeError on out-of-bounds access")}var bh=new RangeError("Insufficient data"),ff=new Ir,zs=class i{extensionCodec;context;useBigInt64;rawStrings;maxStrLength;maxBinLength;maxArrayLength;maxMapLength;maxExtLength;keyDecoder;mapKeyConverter;totalPos=0;pos=0;view=ga;bytes=df;headByte=Bs;stack=new ma;entered=!1;constructor(e){this.extensionCodec=e?.extensionCodec??qi.defaultCodec,this.context=e?.context,this.useBigInt64=e?.useBigInt64??!1,this.rawStrings=e?.rawStrings??!1,this.maxStrLength=e?.maxStrLength??4294967295,this.maxBinLength=e?.maxBinLength??4294967295,this.maxArrayLength=e?.maxArrayLength??4294967295,this.maxMapLength=e?.maxMapLength??4294967295,this.maxExtLength=e?.maxExtLength??4294967295,this.keyDecoder=e?.keyDecoder!==void 0?e.keyDecoder:ff,this.mapKeyConverter=e?.mapKeyConverter??uf}clone(){return new i({extensionCodec:this.extensionCodec,context:this.context,useBigInt64:this.useBigInt64,rawStrings:this.rawStrings,maxStrLength:this.maxStrLength,maxBinLength:this.maxBinLength,maxArrayLength:this.maxArrayLength,maxMapLength:this.maxMapLength,maxExtLength:this.maxExtLength,keyDecoder:this.keyDecoder})}reinitializeState(){this.totalPos=0,this.headByte=Bs,this.stack.reset()}setBuffer(e){let t=Ns(e);this.bytes=t,this.view=new DataView(t.buffer,t.byteOffset,t.byteLength),this.pos=0}appendBuffer(e){if(this.headByte===Bs&&!this.hasRemaining(1))this.setBuffer(e);else{let t=this.bytes.subarray(this.pos),n=Ns(e),s=new Uint8Array(t.length+n.length);s.set(t),s.set(n,t.length),this.setBuffer(s)}}hasRemaining(e){return this.view.byteLength-this.pos>=e}createExtraByteError(e){let{view:t,pos:n}=this;return new RangeError(`Extra ${t.byteLength-n} of ${t.byteLength} byte(s) found at buffer[${e}]`)}decode(e){if(this.entered)return this.clone().decode(e);try{this.entered=!0,this.reinitializeState(),this.setBuffer(e);let t=this.doDecodeSync();if(this.hasRemaining(1))throw this.createExtraByteError(this.pos);return t}finally{this.entered=!1}}*decodeMulti(e){if(this.entered){yield*this.clone().decodeMulti(e);return}try{for(this.entered=!0,this.reinitializeState(),this.setBuffer(e);this.hasRemaining(1);)yield this.doDecodeSync()}finally{this.entered=!1}}async decodeAsync(e){if(this.entered)return this.clone().decodeAsync(e);try{this.entered=!0;let t=!1,n;for await(let a of e){if(t)throw this.entered=!1,this.createExtraByteError(this.totalPos);this.appendBuffer(a);try{n=this.doDecodeSync(),t=!0}catch(l){if(!(l instanceof RangeError))throw l}this.totalPos+=this.pos}if(t){if(this.hasRemaining(1))throw this.createExtraByteError(this.totalPos);return n}let{headByte:s,pos:r,totalPos:o}=this;throw new RangeError(`Insufficient data in parsing ${Rr(s)} at ${o} (${r} in the current buffer)`)}finally{this.entered=!1}}decodeArrayStream(e){return this.decodeMultiAsync(e,!0)}decodeStream(e){return this.decodeMultiAsync(e,!1)}async*decodeMultiAsync(e,t){if(this.entered){yield*this.clone().decodeMultiAsync(e,t);return}try{this.entered=!0;let n=t,s=-1;for await(let r of e){if(t&&s===0)throw this.createExtraByteError(this.totalPos);this.appendBuffer(r),n&&(s=this.readArraySize(),n=!1,this.complete());try{for(;yield this.doDecodeSync(),--s!==0;);}catch(o){if(!(o instanceof RangeError))throw o}this.totalPos+=this.pos}}finally{this.entered=!1}}doDecodeSync(){e:for(;;){let e=this.readHeadByte(),t;if(e>=224)t=e-256;else if(e<192)if(e<128)t=e;else if(e<144){let s=e-128;if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e<160){let s=e-144;if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else{let s=e-160;t=this.decodeString(s,0)}else if(e===192)t=null;else if(e===194)t=!1;else if(e===195)t=!0;else if(e===202)t=this.readF32();else if(e===203)t=this.readF64();else if(e===204)t=this.readU8();else if(e===205)t=this.readU16();else if(e===206)t=this.readU32();else if(e===207)this.useBigInt64?t=this.readU64AsBigInt():t=this.readU64();else if(e===208)t=this.readI8();else if(e===209)t=this.readI16();else if(e===210)t=this.readI32();else if(e===211)this.useBigInt64?t=this.readI64AsBigInt():t=this.readI64();else if(e===217){let s=this.lookU8();t=this.decodeString(s,1)}else if(e===218){let s=this.lookU16();t=this.decodeString(s,2)}else if(e===219){let s=this.lookU32();t=this.decodeString(s,4)}else if(e===220){let s=this.readU16();if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else if(e===221){let s=this.readU32();if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else if(e===222){let s=this.readU16();if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e===223){let s=this.readU32();if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e===196){let s=this.lookU8();t=this.decodeBinary(s,1)}else if(e===197){let s=this.lookU16();t=this.decodeBinary(s,2)}else if(e===198){let s=this.lookU32();t=this.decodeBinary(s,4)}else if(e===212)t=this.decodeExtension(1,0);else if(e===213)t=this.decodeExtension(2,0);else if(e===214)t=this.decodeExtension(4,0);else if(e===215)t=this.decodeExtension(8,0);else if(e===216)t=this.decodeExtension(16,0);else if(e===199){let s=this.lookU8();t=this.decodeExtension(s,1)}else if(e===200){let s=this.lookU16();t=this.decodeExtension(s,2)}else if(e===201){let s=this.lookU32();t=this.decodeExtension(s,4)}else throw new zt(`Unrecognized type byte: ${Rr(e)}`);this.complete();let n=this.stack;for(;n.length>0;){let s=n.top();if(s.type===pa)if(s.array[s.position]=t,s.position++,s.position===s.size)t=s.array,n.release(s);else continue e;else if(s.type===ks){if(t==="__proto__")throw new zt("The key __proto__ is not allowed");s.key=this.mapKeyConverter(t),s.type=Sh;continue e}else if(s.map[s.key]=t,s.readCount++,s.readCount===s.size)t=s.map,n.release(s);else{s.key=null,s.type=ks;continue e}}return t}}readHeadByte(){return this.headByte===Bs&&(this.headByte=this.readU8()),this.headByte}complete(){this.headByte=Bs}readArraySize(){let e=this.readHeadByte();switch(e){case 220:return this.readU16();case 221:return this.readU32();default:{if(e<160)return e-144;throw new zt(`Unrecognized array type byte: ${Rr(e)}`)}}}pushMapState(e){if(e>this.maxMapLength)throw new zt(`Max length exceeded: map length (${e}) > maxMapLengthLength (${this.maxMapLength})`);this.stack.pushMapState(e)}pushArrayState(e){if(e>this.maxArrayLength)throw new zt(`Max length exceeded: array length (${e}) > maxArrayLength (${this.maxArrayLength})`);this.stack.pushArrayState(e)}decodeString(e,t){return!this.rawStrings||this.stateIsMapKey()?this.decodeUtf8String(e,t):this.decodeBinary(e,t)}decodeUtf8String(e,t){if(e>this.maxStrLength)throw new zt(`Max length exceeded: UTF-8 byte length (${e}) > maxStrLength (${this.maxStrLength})`);if(this.bytes.byteLength<this.pos+t+e)throw bh;let n=this.pos+t,s;return this.stateIsMapKey()&&this.keyDecoder?.canBeCached(e)?s=this.keyDecoder.decode(this.bytes,n,e):s=_h(this.bytes,n,e),this.pos+=t+e,s}stateIsMapKey(){return this.stack.length>0?this.stack.top().type===ks:!1}decodeBinary(e,t){if(e>this.maxBinLength)throw new zt(`Max length exceeded: bin length (${e}) > maxBinLength (${this.maxBinLength})`);if(!this.hasRemaining(e+t))throw bh;let n=this.pos+t,s=this.bytes.subarray(n,n+e);return this.pos+=t+e,s}decodeExtension(e,t){if(e>this.maxExtLength)throw new zt(`Max length exceeded: ext length (${e}) > maxExtLength (${this.maxExtLength})`);let n=this.view.getInt8(this.pos+t),s=this.decodeBinary(e,t+1);return this.extensionCodec.decode(s,n,this.context)}lookU8(){return this.view.getUint8(this.pos)}lookU16(){return this.view.getUint16(this.pos)}lookU32(){return this.view.getUint32(this.pos)}readU8(){let e=this.view.getUint8(this.pos);return this.pos++,e}readI8(){let e=this.view.getInt8(this.pos);return this.pos++,e}readU16(){let e=this.view.getUint16(this.pos);return this.pos+=2,e}readI16(){let e=this.view.getInt16(this.pos);return this.pos+=2,e}readU32(){let e=this.view.getUint32(this.pos);return this.pos+=4,e}readI32(){let e=this.view.getInt32(this.pos);return this.pos+=4,e}readU64(){let e=vh(this.view,this.pos);return this.pos+=8,e}readI64(){let e=Cr(this.view,this.pos);return this.pos+=8,e}readU64AsBigInt(){let e=this.view.getBigUint64(this.pos);return this.pos+=8,e}readI64AsBigInt(){let e=this.view.getBigInt64(this.pos);return this.pos+=8,e}readF32(){let e=this.view.getFloat32(this.pos);return this.pos+=4,e}readF64(){let e=this.view.getFloat64(this.pos);return this.pos+=8,e}};var pf=new Fs({ignoreUndefined:!0}),mf=new zs;function Pr(i){return pf.encode(i)}function wh(i){return mf.decode(i instanceof ArrayBuffer?new Uint8Array(i):i)}function Eh(i){return i.byteOffset%4===0?new Int32Array(i.buffer,i.byteOffset,i.byteLength>>2):new Int32Array(gf(i).buffer)}function gf(i){let e=new Uint8Array(i.byteLength);return e.set(i),e}function Lr(i,e){return e<<16|i}var xf=0,Th=1,_f=2;var Iu=1,dc=2,Wn=3,ui=0,Gt=1,mn=2,ci=0,cs=1,ao=2,Ah=3,Ch=4,yf=5,Ri=100,vf=101,Mf=102,bf=103,Sf=104,wf=200,Ef=201,Tf=202,Af=203,Za=204,Ja=205,Cf=206,Rf=207,If=208,Pf=209,Lf=210,Uf=211,Df=212,Nf=213,Ff=214,Ka=0,Qa=1,ja=2,fs=3,el=4,tl=5,nl=6,il=7,Do=0,Of=1,Bf=2,hi=0,kf=1,zf=2,Vf=3,Hf=4,Gf=5,Wf=6,fc=7;var Pu=300,ps=301,ms=302,sl=303,rl=304,No=306,ol=1e3,Li=1001,al=1002,Zt=1003,Xf=1004;var Ur=1005;var Ln=1006,xa=1007;var Ui=1008;var $n=1009,Lu=1010,Uu=1011,Qs=1012,pc=1013,Di=1014,Un=1015,ir=1016,mc=1017,gc=1018,gs=1020,Du=35902,Nu=1021,Fu=1022,gn=1023,Ou=1024,Bu=1025,hs=1026,xs=1027,xc=1028,_c=1029,ku=1030,yc=1031;var vc=1033,no=33776,io=33777,so=33778,ro=33779,ll=35840,cl=35841,hl=35842,ul=35843,dl=36196,fl=37492,pl=37496,ml=37808,gl=37809,xl=37810,_l=37811,yl=37812,vl=37813,Ml=37814,bl=37815,Sl=37816,wl=37817,El=37818,Tl=37819,Al=37820,Cl=37821,oo=36492,Rl=36494,Il=36495,zu=36283,Pl=36284,Ll=36285,Ul=36286;var lo=2300,Dl=2301,_a=2302,Rh=2400,Ih=2401,Ph=2402;var qf=3200,Yf=3201;var Mc=0,$f=1,li="",on="srgb",bs="srgb-linear",Fo="linear",je="srgb";var Yi=7680;var Lh=519,Zf=512,Jf=513,Kf=514,Vu=515,Qf=516,jf=517,ep=518,tp=519,Uh=35044,sr=35048;var Dh="300 es",qn=2e3,co=2001,di=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let s=this._listeners[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let n=this._listeners[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},At=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var ya=Math.PI/180,Nl=180/Math.PI;function rr(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(At[i&255]+At[i>>8&255]+At[i>>16&255]+At[i>>24&255]+"-"+At[e&255]+At[e>>8&255]+"-"+At[e>>16&15|64]+At[e>>24&255]+"-"+At[t&63|128]+At[t>>8&255]+"-"+At[t>>16&255]+At[t>>24&255]+At[n&255]+At[n>>8&255]+At[n>>16&255]+At[n>>24&255]).toLowerCase()}function Ht(i,e,t){return Math.max(e,Math.min(t,i))}function np(i,e){return(i%e+e)%e}function va(i,e,t){return(1-t)*i+t*e}function Vs(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Vt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var Oe=class i{constructor(e=0,t=0){i.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ht(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*s+e.x,this.y=r*s+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Re=class i{constructor(e,t,n,s,r,o,a,l,h){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,l,h)}set(e,t,n,s,r,o,a,l,h){let c=this.elements;return c[0]=e,c[1]=s,c[2]=a,c[3]=t,c[4]=r,c[5]=l,c[6]=n,c[7]=o,c[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[3],l=n[6],h=n[1],c=n[4],u=n[7],f=n[2],m=n[5],g=n[8],v=s[0],p=s[3],d=s[6],w=s[1],S=s[4],_=s[7],I=s[2],T=s[5],A=s[8];return r[0]=o*v+a*w+l*I,r[3]=o*p+a*S+l*T,r[6]=o*d+a*_+l*A,r[1]=h*v+c*w+u*I,r[4]=h*p+c*S+u*T,r[7]=h*d+c*_+u*A,r[2]=f*v+m*w+g*I,r[5]=f*p+m*S+g*T,r[8]=f*d+m*_+g*A,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],h=e[7],c=e[8];return t*o*c-t*a*h-n*r*c+n*a*l+s*r*h-s*o*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],h=e[7],c=e[8],u=c*o-a*h,f=a*l-c*r,m=h*r-o*l,g=t*u+n*f+s*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let v=1/g;return e[0]=u*v,e[1]=(s*h-c*n)*v,e[2]=(a*n-s*o)*v,e[3]=f*v,e[4]=(c*t-s*l)*v,e[5]=(s*r-a*t)*v,e[6]=m*v,e[7]=(n*l-h*t)*v,e[8]=(o*t-n*r)*v,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,o,a){let l=Math.cos(r),h=Math.sin(r);return this.set(n*l,n*h,-n*(l*o+h*a)+o+e,-s*h,s*l,-s*(-h*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Ma.makeScale(e,t)),this}rotate(e){return this.premultiply(Ma.makeRotation(-e)),this}translate(e,t){return this.premultiply(Ma.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Ma=new Re;function Hu(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function ho(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function ip(){let i=ho("canvas");return i.style.display="block",i}var Nh={};function Zs(i){i in Nh||(Nh[i]=!0,console.warn(i))}function sp(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}function rp(i){let e=i.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function op(i){let e=i.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var Ge={enabled:!0,workingColorSpace:bs,spaces:{},convert:function(i,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===je&&(i.r=Yn(i.r),i.g=Yn(i.g),i.b=Yn(i.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(i.applyMatrix3(this.spaces[e].toXYZ),i.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===je&&(i.r=us(i.r),i.g=us(i.g),i.b=us(i.b))),i},fromWorkingColorSpace:function(i,e){return this.convert(i,this.workingColorSpace,e)},toWorkingColorSpace:function(i,e){return this.convert(i,e,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===li?Fo:this.spaces[i].transfer},getLuminanceCoefficients:function(i,e=this.workingColorSpace){return i.fromArray(this.spaces[e].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,e,t){return i.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function Yn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function us(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Fh=[.64,.33,.3,.6,.15,.06],Oh=[.2126,.7152,.0722],Bh=[.3127,.329],kh=new Re().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),zh=new Re().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Ge.define({[bs]:{primaries:Fh,whitePoint:Bh,transfer:Fo,toXYZ:kh,fromXYZ:zh,luminanceCoefficients:Oh,workingColorSpaceConfig:{unpackColorSpace:on},outputColorSpaceConfig:{drawingBufferColorSpace:on}},[on]:{primaries:Fh,whitePoint:Bh,transfer:je,toXYZ:kh,fromXYZ:zh,luminanceCoefficients:Oh,outputColorSpaceConfig:{drawingBufferColorSpace:on}}});var $i,Fl=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{$i===void 0&&($i=ho("canvas")),$i.width=e.width,$i.height=e.height;let n=$i.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=$i}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=ho("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Yn(r[o]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Yn(t[n]/255)*255):t[n]=Yn(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},ap=0,uo=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:ap++}),this.uuid=rr(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(ba(s[o].image)):r.push(ba(s[o]))}else r=ba(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function ba(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Fl.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var lp=0,Kt=class i extends di{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=Li,s=Li,r=Ln,o=Ui,a=gn,l=$n,h=i.DEFAULT_ANISOTROPY,c=li){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:lp++}),this.uuid=rr(),this.name="",this.source=new uo(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=h,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Oe(0,0),this.repeat=new Oe(1,1),this.center=new Oe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Re,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=c,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Pu)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case ol:e.x=e.x-Math.floor(e.x);break;case Li:e.x=e.x<0?0:1;break;case al:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case ol:e.y=e.y-Math.floor(e.y);break;case Li:e.y=e.y<0?0:1;break;case al:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Kt.DEFAULT_IMAGE=null;Kt.DEFAULT_MAPPING=Pu;Kt.DEFAULT_ANISOTROPY=1;var et=class i{constructor(e=0,t=0,n=0,s=1){i.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,h=l[0],c=l[4],u=l[8],f=l[1],m=l[5],g=l[9],v=l[2],p=l[6],d=l[10];if(Math.abs(c-f)<.01&&Math.abs(u-v)<.01&&Math.abs(g-p)<.01){if(Math.abs(c+f)<.1&&Math.abs(u+v)<.1&&Math.abs(g+p)<.1&&Math.abs(h+m+d-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let S=(h+1)/2,_=(m+1)/2,I=(d+1)/2,T=(c+f)/4,A=(u+v)/4,C=(g+p)/4;return S>_&&S>I?S<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(S),s=T/n,r=A/n):_>I?_<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(_),n=T/s,r=C/s):I<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(I),n=A/r,s=C/r),this.set(n,s,r,t),this}let w=Math.sqrt((p-g)*(p-g)+(u-v)*(u-v)+(f-c)*(f-c));return Math.abs(w)<.001&&(w=1),this.x=(p-g)/w,this.y=(u-v)/w,this.z=(f-c)/w,this.w=Math.acos((h+m+d-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Ol=class extends di{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new et(0,0,e,t),this.scissorTest=!1,this.viewport=new et(0,0,e,t);let s={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ln,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new Kt(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,s=e.textures.length;n<s;n++)this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new uo(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Zn=class extends Ol{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},fo=class extends Kt{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Zt,this.minFilter=Zt,this.wrapR=Li,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Bl=class extends Kt{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Zt,this.minFilter=Zt,this.wrapR=Li,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Wt=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,o,a){let l=n[s+0],h=n[s+1],c=n[s+2],u=n[s+3],f=r[o+0],m=r[o+1],g=r[o+2],v=r[o+3];if(a===0){e[t+0]=l,e[t+1]=h,e[t+2]=c,e[t+3]=u;return}if(a===1){e[t+0]=f,e[t+1]=m,e[t+2]=g,e[t+3]=v;return}if(u!==v||l!==f||h!==m||c!==g){let p=1-a,d=l*f+h*m+c*g+u*v,w=d>=0?1:-1,S=1-d*d;if(S>Number.EPSILON){let I=Math.sqrt(S),T=Math.atan2(I,d*w);p=Math.sin(p*T)/I,a=Math.sin(a*T)/I}let _=a*w;if(l=l*p+f*_,h=h*p+m*_,c=c*p+g*_,u=u*p+v*_,p===1-a){let I=1/Math.sqrt(l*l+h*h+c*c+u*u);l*=I,h*=I,c*=I,u*=I}}e[t]=l,e[t+1]=h,e[t+2]=c,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,s,r,o){let a=n[s],l=n[s+1],h=n[s+2],c=n[s+3],u=r[o],f=r[o+1],m=r[o+2],g=r[o+3];return e[t]=a*g+c*u+l*m-h*f,e[t+1]=l*g+c*f+h*u-a*m,e[t+2]=h*g+c*m+a*f-l*u,e[t+3]=c*g-a*u-l*f-h*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,h=a(n/2),c=a(s/2),u=a(r/2),f=l(n/2),m=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=f*c*u+h*m*g,this._y=h*m*u-f*c*g,this._z=h*c*g+f*m*u,this._w=h*c*u-f*m*g;break;case"YXZ":this._x=f*c*u+h*m*g,this._y=h*m*u-f*c*g,this._z=h*c*g-f*m*u,this._w=h*c*u+f*m*g;break;case"ZXY":this._x=f*c*u-h*m*g,this._y=h*m*u+f*c*g,this._z=h*c*g+f*m*u,this._w=h*c*u-f*m*g;break;case"ZYX":this._x=f*c*u-h*m*g,this._y=h*m*u+f*c*g,this._z=h*c*g-f*m*u,this._w=h*c*u+f*m*g;break;case"YZX":this._x=f*c*u+h*m*g,this._y=h*m*u+f*c*g,this._z=h*c*g-f*m*u,this._w=h*c*u-f*m*g;break;case"XZY":this._x=f*c*u-h*m*g,this._y=h*m*u-f*c*g,this._z=h*c*g+f*m*u,this._w=h*c*u+f*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],o=t[1],a=t[5],l=t[9],h=t[2],c=t[6],u=t[10],f=n+a+u;if(f>0){let m=.5/Math.sqrt(f+1);this._w=.25/m,this._x=(c-l)*m,this._y=(r-h)*m,this._z=(o-s)*m}else if(n>a&&n>u){let m=2*Math.sqrt(1+n-a-u);this._w=(c-l)/m,this._x=.25*m,this._y=(s+o)/m,this._z=(r+h)/m}else if(a>u){let m=2*Math.sqrt(1+a-n-u);this._w=(r-h)/m,this._x=(s+o)/m,this._y=.25*m,this._z=(l+c)/m}else{let m=2*Math.sqrt(1+u-n-a);this._w=(o-s)/m,this._x=(r+h)/m,this._y=(l+c)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ht(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,o=e._w,a=t._x,l=t._y,h=t._z,c=t._w;return this._x=n*c+o*a+s*h-r*l,this._y=s*c+o*l+r*a-n*h,this._z=r*c+o*h+n*l-s*a,this._w=o*c-n*a-s*l-r*h,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,s=this._y,r=this._z,o=this._w,a=o*e._w+n*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let m=1-t;return this._w=m*o+t*this._w,this._x=m*n+t*this._x,this._y=m*s+t*this._y,this._z=m*r+t*this._z,this.normalize(),this}let h=Math.sqrt(l),c=Math.atan2(h,a),u=Math.sin((1-t)*c)/h,f=Math.sin(t*c)/h;return this._w=o*u+this._w*f,this._x=n*u+this._x*f,this._y=s*u+this._y*f,this._z=r*u+this._z*f,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},P=class i{constructor(e=0,t=0,n=0){i.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Vh.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Vh.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,o=e.y,a=e.z,l=e.w,h=2*(o*s-a*n),c=2*(a*t-r*s),u=2*(r*n-o*t);return this.x=t+l*h+o*u-a*c,this.y=n+l*c+a*h-r*u,this.z=s+l*u+r*c-o*h,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Sa.copy(this).projectOnVector(e),this.sub(Sa)}reflect(e){return this.sub(Sa.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ht(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Sa=new P,Vh=new Wt,Jn=class{constructor(e=new P(1/0,1/0,1/0),t=new P(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(dn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(dn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=dn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,dn):dn.fromBufferAttribute(r,o),dn.applyMatrix4(e.matrixWorld),this.expandByPoint(dn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Dr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Dr.copy(n.boundingBox)),Dr.applyMatrix4(e.matrixWorld),this.union(Dr)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,dn),dn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Hs),Nr.subVectors(this.max,Hs),Zi.subVectors(e.a,Hs),Ji.subVectors(e.b,Hs),Ki.subVectors(e.c,Hs),ni.subVectors(Ji,Zi),ii.subVectors(Ki,Ji),bi.subVectors(Zi,Ki);let t=[0,-ni.z,ni.y,0,-ii.z,ii.y,0,-bi.z,bi.y,ni.z,0,-ni.x,ii.z,0,-ii.x,bi.z,0,-bi.x,-ni.y,ni.x,0,-ii.y,ii.x,0,-bi.y,bi.x,0];return!wa(t,Zi,Ji,Ki,Nr)||(t=[1,0,0,0,1,0,0,0,1],!wa(t,Zi,Ji,Ki,Nr))?!1:(Fr.crossVectors(ni,ii),t=[Fr.x,Fr.y,Fr.z],wa(t,Zi,Ji,Ki,Nr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,dn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(dn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(kn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),kn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),kn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),kn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),kn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),kn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),kn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),kn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(kn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},kn=[new P,new P,new P,new P,new P,new P,new P,new P],dn=new P,Dr=new Jn,Zi=new P,Ji=new P,Ki=new P,ni=new P,ii=new P,bi=new P,Hs=new P,Nr=new P,Fr=new P,Si=new P;function wa(i,e,t,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){Si.fromArray(i,r);let a=s.x*Math.abs(Si.x)+s.y*Math.abs(Si.y)+s.z*Math.abs(Si.z),l=e.dot(Si),h=t.dot(Si),c=n.dot(Si);if(Math.max(-Math.max(l,h,c),Math.min(l,h,c))>a)return!1}return!0}var cp=new Jn,Gs=new P,Ea=new P,Ni=class{constructor(e=new P,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):cp.setFromPoints(e).getCenter(n);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Gs.subVectors(e,this.center);let t=Gs.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(Gs,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ea.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Gs.copy(e.center).add(Ea)),this.expandByPoint(Gs.copy(e.center).sub(Ea))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},zn=new P,Ta=new P,Or=new P,si=new P,Aa=new P,Br=new P,Ca=new P,kl=class{constructor(e=new P,t=new P(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,zn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=zn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(zn.copy(this.origin).addScaledVector(this.direction,t),zn.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Ta.copy(e).add(t).multiplyScalar(.5),Or.copy(t).sub(e).normalize(),si.copy(this.origin).sub(Ta);let r=e.distanceTo(t)*.5,o=-this.direction.dot(Or),a=si.dot(this.direction),l=-si.dot(Or),h=si.lengthSq(),c=Math.abs(1-o*o),u,f,m,g;if(c>0)if(u=o*l-a,f=o*a-l,g=r*c,u>=0)if(f>=-g)if(f<=g){let v=1/c;u*=v,f*=v,m=u*(u+o*f+2*a)+f*(o*u+f+2*l)+h}else f=r,u=Math.max(0,-(o*f+a)),m=-u*u+f*(f+2*l)+h;else f=-r,u=Math.max(0,-(o*f+a)),m=-u*u+f*(f+2*l)+h;else f<=-g?(u=Math.max(0,-(-o*r+a)),f=u>0?-r:Math.min(Math.max(-r,-l),r),m=-u*u+f*(f+2*l)+h):f<=g?(u=0,f=Math.min(Math.max(-r,-l),r),m=f*(f+2*l)+h):(u=Math.max(0,-(o*r+a)),f=u>0?r:Math.min(Math.max(-r,-l),r),m=-u*u+f*(f+2*l)+h);else f=o>0?-r:r,u=Math.max(0,-(o*f+a)),m=-u*u+f*(f+2*l)+h;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(Ta).addScaledVector(Or,f),m}intersectSphere(e,t){zn.subVectors(e.center,this.origin);let n=zn.dot(this.direction),s=zn.dot(zn)-n*n,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,o,a,l,h=1/this.direction.x,c=1/this.direction.y,u=1/this.direction.z,f=this.origin;return h>=0?(n=(e.min.x-f.x)*h,s=(e.max.x-f.x)*h):(n=(e.max.x-f.x)*h,s=(e.min.x-f.x)*h),c>=0?(r=(e.min.y-f.y)*c,o=(e.max.y-f.y)*c):(r=(e.max.y-f.y)*c,o=(e.min.y-f.y)*c),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(e.min.z-f.z)*u,l=(e.max.z-f.z)*u):(a=(e.max.z-f.z)*u,l=(e.min.z-f.z)*u),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,zn)!==null}intersectTriangle(e,t,n,s,r){Aa.subVectors(t,e),Br.subVectors(n,e),Ca.crossVectors(Aa,Br);let o=this.direction.dot(Ca),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;si.subVectors(this.origin,e);let l=a*this.direction.dot(Br.crossVectors(si,Br));if(l<0)return null;let h=a*this.direction.dot(Aa.cross(si));if(h<0||l+h>o)return null;let c=-a*si.dot(Ca);return c<0?null:this.at(c/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},We=class i{constructor(e,t,n,s,r,o,a,l,h,c,u,f,m,g,v,p){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,l,h,c,u,f,m,g,v,p)}set(e,t,n,s,r,o,a,l,h,c,u,f,m,g,v,p){let d=this.elements;return d[0]=e,d[4]=t,d[8]=n,d[12]=s,d[1]=r,d[5]=o,d[9]=a,d[13]=l,d[2]=h,d[6]=c,d[10]=u,d[14]=f,d[3]=m,d[7]=g,d[11]=v,d[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,s=1/Qi.setFromMatrixColumn(e,0).length(),r=1/Qi.setFromMatrixColumn(e,1).length(),o=1/Qi.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),h=Math.sin(s),c=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let f=o*c,m=o*u,g=a*c,v=a*u;t[0]=l*c,t[4]=-l*u,t[8]=h,t[1]=m+g*h,t[5]=f-v*h,t[9]=-a*l,t[2]=v-f*h,t[6]=g+m*h,t[10]=o*l}else if(e.order==="YXZ"){let f=l*c,m=l*u,g=h*c,v=h*u;t[0]=f+v*a,t[4]=g*a-m,t[8]=o*h,t[1]=o*u,t[5]=o*c,t[9]=-a,t[2]=m*a-g,t[6]=v+f*a,t[10]=o*l}else if(e.order==="ZXY"){let f=l*c,m=l*u,g=h*c,v=h*u;t[0]=f-v*a,t[4]=-o*u,t[8]=g+m*a,t[1]=m+g*a,t[5]=o*c,t[9]=v-f*a,t[2]=-o*h,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){let f=o*c,m=o*u,g=a*c,v=a*u;t[0]=l*c,t[4]=g*h-m,t[8]=f*h+v,t[1]=l*u,t[5]=v*h+f,t[9]=m*h-g,t[2]=-h,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){let f=o*l,m=o*h,g=a*l,v=a*h;t[0]=l*c,t[4]=v-f*u,t[8]=g*u+m,t[1]=u,t[5]=o*c,t[9]=-a*c,t[2]=-h*c,t[6]=m*u+g,t[10]=f-v*u}else if(e.order==="XZY"){let f=o*l,m=o*h,g=a*l,v=a*h;t[0]=l*c,t[4]=-u,t[8]=h*c,t[1]=f*u+v,t[5]=o*c,t[9]=m*u-g,t[2]=g*u-m,t[6]=a*c,t[10]=v*u+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(hp,e,up)}lookAt(e,t,n){let s=this.elements;return Yt.subVectors(e,t),Yt.lengthSq()===0&&(Yt.z=1),Yt.normalize(),ri.crossVectors(n,Yt),ri.lengthSq()===0&&(Math.abs(n.z)===1?Yt.x+=1e-4:Yt.z+=1e-4,Yt.normalize(),ri.crossVectors(n,Yt)),ri.normalize(),kr.crossVectors(Yt,ri),s[0]=ri.x,s[4]=kr.x,s[8]=Yt.x,s[1]=ri.y,s[5]=kr.y,s[9]=Yt.y,s[2]=ri.z,s[6]=kr.z,s[10]=Yt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[4],l=n[8],h=n[12],c=n[1],u=n[5],f=n[9],m=n[13],g=n[2],v=n[6],p=n[10],d=n[14],w=n[3],S=n[7],_=n[11],I=n[15],T=s[0],A=s[4],C=s[8],b=s[12],x=s[1],R=s[5],L=s[9],O=s[13],B=s[2],G=s[6],z=s[10],K=s[14],W=s[3],j=s[7],ie=s[11],pe=s[15];return r[0]=o*T+a*x+l*B+h*W,r[4]=o*A+a*R+l*G+h*j,r[8]=o*C+a*L+l*z+h*ie,r[12]=o*b+a*O+l*K+h*pe,r[1]=c*T+u*x+f*B+m*W,r[5]=c*A+u*R+f*G+m*j,r[9]=c*C+u*L+f*z+m*ie,r[13]=c*b+u*O+f*K+m*pe,r[2]=g*T+v*x+p*B+d*W,r[6]=g*A+v*R+p*G+d*j,r[10]=g*C+v*L+p*z+d*ie,r[14]=g*b+v*O+p*K+d*pe,r[3]=w*T+S*x+_*B+I*W,r[7]=w*A+S*R+_*G+I*j,r[11]=w*C+S*L+_*z+I*ie,r[15]=w*b+S*O+_*K+I*pe,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],o=e[1],a=e[5],l=e[9],h=e[13],c=e[2],u=e[6],f=e[10],m=e[14],g=e[3],v=e[7],p=e[11],d=e[15];return g*(+r*l*u-s*h*u-r*a*f+n*h*f+s*a*m-n*l*m)+v*(+t*l*m-t*h*f+r*o*f-s*o*m+s*h*c-r*l*c)+p*(+t*h*u-t*a*m-r*o*u+n*o*m+r*a*c-n*h*c)+d*(-s*a*c-t*l*u+t*a*f+s*o*u-n*o*f+n*l*c)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],h=e[7],c=e[8],u=e[9],f=e[10],m=e[11],g=e[12],v=e[13],p=e[14],d=e[15],w=u*p*h-v*f*h+v*l*m-a*p*m-u*l*d+a*f*d,S=g*f*h-c*p*h-g*l*m+o*p*m+c*l*d-o*f*d,_=c*v*h-g*u*h+g*a*m-o*v*m-c*a*d+o*u*d,I=g*u*l-c*v*l-g*a*f+o*v*f+c*a*p-o*u*p,T=t*w+n*S+s*_+r*I;if(T===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/T;return e[0]=w*A,e[1]=(v*f*r-u*p*r-v*s*m+n*p*m+u*s*d-n*f*d)*A,e[2]=(a*p*r-v*l*r+v*s*h-n*p*h-a*s*d+n*l*d)*A,e[3]=(u*l*r-a*f*r-u*s*h+n*f*h+a*s*m-n*l*m)*A,e[4]=S*A,e[5]=(c*p*r-g*f*r+g*s*m-t*p*m-c*s*d+t*f*d)*A,e[6]=(g*l*r-o*p*r-g*s*h+t*p*h+o*s*d-t*l*d)*A,e[7]=(o*f*r-c*l*r+c*s*h-t*f*h-o*s*m+t*l*m)*A,e[8]=_*A,e[9]=(g*u*r-c*v*r-g*n*m+t*v*m+c*n*d-t*u*d)*A,e[10]=(o*v*r-g*a*r+g*n*h-t*v*h-o*n*d+t*a*d)*A,e[11]=(c*a*r-o*u*r-c*n*h+t*u*h+o*n*m-t*a*m)*A,e[12]=I*A,e[13]=(c*v*s-g*u*s+g*n*f-t*v*f-c*n*p+t*u*p)*A,e[14]=(g*a*s-o*v*s-g*n*l+t*v*l+o*n*p-t*a*p)*A,e[15]=(o*u*s-c*a*s+c*n*l-t*u*l-o*n*f+t*a*f)*A,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,o=e.x,a=e.y,l=e.z,h=r*o,c=r*a;return this.set(h*o+n,h*a-s*l,h*l+s*a,0,h*a+s*l,c*a+n,c*l-s*o,0,h*l-s*a,c*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,o){return this.set(1,n,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,h=r+r,c=o+o,u=a+a,f=r*h,m=r*c,g=r*u,v=o*c,p=o*u,d=a*u,w=l*h,S=l*c,_=l*u,I=n.x,T=n.y,A=n.z;return s[0]=(1-(v+d))*I,s[1]=(m+_)*I,s[2]=(g-S)*I,s[3]=0,s[4]=(m-_)*T,s[5]=(1-(f+d))*T,s[6]=(p+w)*T,s[7]=0,s[8]=(g+S)*A,s[9]=(p-w)*A,s[10]=(1-(f+v))*A,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements,r=Qi.set(s[0],s[1],s[2]).length(),o=Qi.set(s[4],s[5],s[6]).length(),a=Qi.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],fn.copy(this);let h=1/r,c=1/o,u=1/a;return fn.elements[0]*=h,fn.elements[1]*=h,fn.elements[2]*=h,fn.elements[4]*=c,fn.elements[5]*=c,fn.elements[6]*=c,fn.elements[8]*=u,fn.elements[9]*=u,fn.elements[10]*=u,t.setFromRotationMatrix(fn),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,s,r,o,a=qn){let l=this.elements,h=2*r/(t-e),c=2*r/(n-s),u=(t+e)/(t-e),f=(n+s)/(n-s),m,g;if(a===qn)m=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===co)m=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=c,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,r,o,a=qn){let l=this.elements,h=1/(t-e),c=1/(n-s),u=1/(o-r),f=(t+e)*h,m=(n+s)*c,g,v;if(a===qn)g=(o+r)*u,v=-2*u;else if(a===co)g=r*u,v=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*h,l[4]=0,l[8]=0,l[12]=-f,l[1]=0,l[5]=2*c,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=v,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Qi=new P,fn=new We,hp=new P(0,0,0),up=new P(1,1,1),ri=new P,kr=new P,Yt=new P,Hh=new We,Gh=new Wt,Mt=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],l=s[1],h=s[5],c=s[9],u=s[2],f=s[6],m=s[10];switch(t){case"XYZ":this._y=Math.asin(Ht(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-c,m),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,h),this._z=0);break;case"YXZ":this._x=Math.asin(-Ht(c,-1,1)),Math.abs(c)<.9999999?(this._y=Math.atan2(a,m),this._z=Math.atan2(l,h)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ht(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,m),this._z=Math.atan2(-o,h)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Ht(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,h));break;case"YZX":this._z=Math.asin(Ht(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-c,h),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,m));break;case"XZY":this._z=Math.asin(-Ht(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,h),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-c,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Hh.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Hh,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Gh.setFromEuler(this),this.setFromQuaternion(Gh,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Mt.DEFAULT_ORDER="XYZ";var po=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},dp=0,Wh=new P,ji=new Wt,Vn=new We,zr=new P,Ws=new P,fp=new P,pp=new Wt,Xh=new P(1,0,0),qh=new P(0,1,0),Yh=new P(0,0,1),$h={type:"added"},mp={type:"removed"},es={type:"childadded",child:null},Ra={type:"childremoved",child:null},Dt=class i extends di{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:dp++}),this.uuid=rr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new P,t=new Mt,n=new Wt,s=new P(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new We},normalMatrix:{value:new Re}}),this.matrix=new We,this.matrixWorld=new We,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new po,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ji.setFromAxisAngle(e,t),this.quaternion.multiply(ji),this}rotateOnWorldAxis(e,t){return ji.setFromAxisAngle(e,t),this.quaternion.premultiply(ji),this}rotateX(e){return this.rotateOnAxis(Xh,e)}rotateY(e){return this.rotateOnAxis(qh,e)}rotateZ(e){return this.rotateOnAxis(Yh,e)}translateOnAxis(e,t){return Wh.copy(e).applyQuaternion(this.quaternion),this.position.add(Wh.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Xh,e)}translateY(e){return this.translateOnAxis(qh,e)}translateZ(e){return this.translateOnAxis(Yh,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Vn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?zr.copy(e):zr.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Ws.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Vn.lookAt(Ws,zr,this.up):Vn.lookAt(zr,Ws,this.up),this.quaternion.setFromRotationMatrix(Vn),s&&(Vn.extractRotation(s.matrixWorld),ji.setFromRotationMatrix(Vn),this.quaternion.premultiply(ji.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent($h),es.child=e,this.dispatchEvent(es),es.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(mp),Ra.child=e,this.dispatchEvent(Ra),Ra.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Vn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Vn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Vn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent($h),es.child=e,this.dispatchEvent(es),es.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ws,e,fp),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ws,pp,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let h=0,c=l.length;h<c;h++){let u=l[h];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,h=this.material.length;l<h;l++)a.push(r(e.materials,this.material[l]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(e.animations,l))}}if(t){let a=o(e.geometries),l=o(e.materials),h=o(e.textures),c=o(e.images),u=o(e.shapes),f=o(e.skeletons),m=o(e.animations),g=o(e.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),h.length>0&&(n.textures=h),c.length>0&&(n.images=c),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){let l=[];for(let h in a){let c=a[h];delete c.metadata,l.push(c)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}};Dt.DEFAULT_UP=new P(0,1,0);Dt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Dt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var pn=new P,Hn=new P,Ia=new P,Gn=new P,ts=new P,ns=new P,Zh=new P,Pa=new P,La=new P,Ua=new P,Da=new et,Na=new et,Fa=new et,Ii=class i{constructor(e=new P,t=new P,n=new P){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),pn.subVectors(e,t),s.cross(pn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){pn.subVectors(s,t),Hn.subVectors(n,t),Ia.subVectors(e,t);let o=pn.dot(pn),a=pn.dot(Hn),l=pn.dot(Ia),h=Hn.dot(Hn),c=Hn.dot(Ia),u=o*h-a*a;if(u===0)return r.set(0,0,0),null;let f=1/u,m=(h*l-a*c)*f,g=(o*c-a*l)*f;return r.set(1-m-g,g,m)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,Gn)===null?!1:Gn.x>=0&&Gn.y>=0&&Gn.x+Gn.y<=1}static getInterpolation(e,t,n,s,r,o,a,l){return this.getBarycoord(e,t,n,s,Gn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Gn.x),l.addScaledVector(o,Gn.y),l.addScaledVector(a,Gn.z),l)}static getInterpolatedAttribute(e,t,n,s,r,o){return Da.setScalar(0),Na.setScalar(0),Fa.setScalar(0),Da.fromBufferAttribute(e,t),Na.fromBufferAttribute(e,n),Fa.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(Da,r.x),o.addScaledVector(Na,r.y),o.addScaledVector(Fa,r.z),o}static isFrontFacing(e,t,n,s){return pn.subVectors(n,t),Hn.subVectors(e,t),pn.cross(Hn).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return pn.subVectors(this.c,this.b),Hn.subVectors(this.a,this.b),pn.cross(Hn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,o,a;ts.subVectors(s,n),ns.subVectors(r,n),Pa.subVectors(e,n);let l=ts.dot(Pa),h=ns.dot(Pa);if(l<=0&&h<=0)return t.copy(n);La.subVectors(e,s);let c=ts.dot(La),u=ns.dot(La);if(c>=0&&u<=c)return t.copy(s);let f=l*u-c*h;if(f<=0&&l>=0&&c<=0)return o=l/(l-c),t.copy(n).addScaledVector(ts,o);Ua.subVectors(e,r);let m=ts.dot(Ua),g=ns.dot(Ua);if(g>=0&&m<=g)return t.copy(r);let v=m*h-l*g;if(v<=0&&h>=0&&g<=0)return a=h/(h-g),t.copy(n).addScaledVector(ns,a);let p=c*g-m*u;if(p<=0&&u-c>=0&&m-g>=0)return Zh.subVectors(r,s),a=(u-c)/(u-c+(m-g)),t.copy(s).addScaledVector(Zh,a);let d=1/(p+v+f);return o=v*d,a=f*d,t.copy(n).addScaledVector(ts,o).addScaledVector(ns,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Gu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},oi={h:0,s:0,l:0},Vr={h:0,s:0,l:0};function Oa(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var Me=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=on){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ge.toWorkingColorSpace(this,t),this}setRGB(e,t,n,s=Ge.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ge.toWorkingColorSpace(this,s),this}setHSL(e,t,n,s=Ge.workingColorSpace){if(e=np(e,1),t=Ht(t,0,1),n=Ht(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=Oa(o,r,e+1/3),this.g=Oa(o,r,e),this.b=Oa(o,r,e-1/3)}return Ge.toWorkingColorSpace(this,s),this}setStyle(e,t=on){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=on){let n=Gu[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Yn(e.r),this.g=Yn(e.g),this.b=Yn(e.b),this}copyLinearToSRGB(e){return this.r=us(e.r),this.g=us(e.g),this.b=us(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=on){return Ge.fromWorkingColorSpace(Ct.copy(this),e),Math.round(Ht(Ct.r*255,0,255))*65536+Math.round(Ht(Ct.g*255,0,255))*256+Math.round(Ht(Ct.b*255,0,255))}getHexString(e=on){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ge.workingColorSpace){Ge.fromWorkingColorSpace(Ct.copy(this),t);let n=Ct.r,s=Ct.g,r=Ct.b,o=Math.max(n,s,r),a=Math.min(n,s,r),l,h,c=(a+o)/2;if(a===o)l=0,h=0;else{let u=o-a;switch(h=c<=.5?u/(o+a):u/(2-o-a),o){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return e.h=l,e.s=h,e.l=c,e}getRGB(e,t=Ge.workingColorSpace){return Ge.fromWorkingColorSpace(Ct.copy(this),t),e.r=Ct.r,e.g=Ct.g,e.b=Ct.b,e}getStyle(e=on){Ge.fromWorkingColorSpace(Ct.copy(this),e);let t=Ct.r,n=Ct.g,s=Ct.b;return e!==on?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(oi),this.setHSL(oi.h+e,oi.s+t,oi.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(oi),e.getHSL(Vr);let n=va(oi.h,Vr.h,t),s=va(oi.s,Vr.s,t),r=va(oi.l,Vr.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ct=new Me;Me.NAMES=Gu;var gp=0,fi=class extends di{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:gp++}),this.uuid=rr(),this.name="",this.blending=cs,this.side=ui,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Za,this.blendDst=Ja,this.blendEquation=Ri,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Me(0,0,0),this.blendAlpha=0,this.depthFunc=fs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Lh,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Yi,this.stencilZFail=Yi,this.stencilZPass=Yi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==cs&&(n.blending=this.blending),this.side!==ui&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Za&&(n.blendSrc=this.blendSrc),this.blendDst!==Ja&&(n.blendDst=this.blendDst),this.blendEquation!==Ri&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==fs&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Lh&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Yi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Yi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Yi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},an=class extends fi{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new Me(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Mt,this.combine=Do,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var pt=new P,Hr=new Oe,Jt=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Uh,this.updateRanges=[],this.gpuType=Un,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Hr.fromBufferAttribute(this,t),Hr.applyMatrix3(e),this.setXY(t,Hr.x,Hr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.applyMatrix3(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.applyMatrix4(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.applyNormalMatrix(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.transformDirection(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Vs(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Vt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Vs(t,this.array)),t}setX(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Vs(t,this.array)),t}setY(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Vs(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Vs(t,this.array)),t}setW(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),n=Vt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),n=Vt(n,this.array),s=Vt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),n=Vt(n,this.array),s=Vt(s,this.array),r=Vt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Uh&&(e.usage=this.usage),e}};var _s=class extends Jt{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var mo=class extends Jt{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var Ke=class extends Jt{constructor(e,t,n){super(new Float32Array(e),t,n)}},xp=0,rn=new We,Ba=new Dt,is=new P,$t=new Jn,Xs=new Jn,yt=new P,Nt=class i extends di{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:xp++}),this.uuid=rr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Hu(e)?mo:_s)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Re().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return rn.makeRotationFromQuaternion(e),this.applyMatrix4(rn),this}rotateX(e){return rn.makeRotationX(e),this.applyMatrix4(rn),this}rotateY(e){return rn.makeRotationY(e),this.applyMatrix4(rn),this}rotateZ(e){return rn.makeRotationZ(e),this.applyMatrix4(rn),this}translate(e,t,n){return rn.makeTranslation(e,t,n),this.applyMatrix4(rn),this}scale(e,t,n){return rn.makeScale(e,t,n),this.applyMatrix4(rn),this}lookAt(e){return Ba.lookAt(e),Ba.updateMatrix(),this.applyMatrix4(Ba.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(is).negate(),this.translate(is.x,is.y,is.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Ke(n,3))}else{for(let n=0,s=t.count;n<s;n++){let r=e[n];t.setXYZ(n,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Jn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new P(-1/0,-1/0,-1/0),new P(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];$t.setFromBufferAttribute(r),this.morphTargetsRelative?(yt.addVectors(this.boundingBox.min,$t.min),this.boundingBox.expandByPoint(yt),yt.addVectors(this.boundingBox.max,$t.max),this.boundingBox.expandByPoint(yt)):(this.boundingBox.expandByPoint($t.min),this.boundingBox.expandByPoint($t.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ni);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new P,1/0);return}if(e){let n=this.boundingSphere.center;if($t.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];Xs.setFromBufferAttribute(a),this.morphTargetsRelative?(yt.addVectors($t.min,Xs.min),$t.expandByPoint(yt),yt.addVectors($t.max,Xs.max),$t.expandByPoint(yt)):($t.expandByPoint(Xs.min),$t.expandByPoint(Xs.max))}$t.getCenter(n);let s=0;for(let r=0,o=e.count;r<o;r++)yt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(yt));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],l=this.morphTargetsRelative;for(let h=0,c=a.count;h<c;h++)yt.fromBufferAttribute(a,h),l&&(is.fromBufferAttribute(e,h),yt.add(is)),s=Math.max(s,n.distanceToSquared(yt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Jt(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let C=0;C<n.count;C++)a[C]=new P,l[C]=new P;let h=new P,c=new P,u=new P,f=new Oe,m=new Oe,g=new Oe,v=new P,p=new P;function d(C,b,x){h.fromBufferAttribute(n,C),c.fromBufferAttribute(n,b),u.fromBufferAttribute(n,x),f.fromBufferAttribute(r,C),m.fromBufferAttribute(r,b),g.fromBufferAttribute(r,x),c.sub(h),u.sub(h),m.sub(f),g.sub(f);let R=1/(m.x*g.y-g.x*m.y);isFinite(R)&&(v.copy(c).multiplyScalar(g.y).addScaledVector(u,-m.y).multiplyScalar(R),p.copy(u).multiplyScalar(m.x).addScaledVector(c,-g.x).multiplyScalar(R),a[C].add(v),a[b].add(v),a[x].add(v),l[C].add(p),l[b].add(p),l[x].add(p))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let C=0,b=w.length;C<b;++C){let x=w[C],R=x.start,L=x.count;for(let O=R,B=R+L;O<B;O+=3)d(e.getX(O+0),e.getX(O+1),e.getX(O+2))}let S=new P,_=new P,I=new P,T=new P;function A(C){I.fromBufferAttribute(s,C),T.copy(I);let b=a[C];S.copy(b),S.sub(I.multiplyScalar(I.dot(b))).normalize(),_.crossVectors(T,b);let R=_.dot(l[C])<0?-1:1;o.setXYZW(C,S.x,S.y,S.z,R)}for(let C=0,b=w.length;C<b;++C){let x=w[C],R=x.start,L=x.count;for(let O=R,B=R+L;O<B;O+=3)A(e.getX(O+0)),A(e.getX(O+1)),A(e.getX(O+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Jt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let f=0,m=n.count;f<m;f++)n.setXYZ(f,0,0,0);let s=new P,r=new P,o=new P,a=new P,l=new P,h=new P,c=new P,u=new P;if(e)for(let f=0,m=e.count;f<m;f+=3){let g=e.getX(f+0),v=e.getX(f+1),p=e.getX(f+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,v),o.fromBufferAttribute(t,p),c.subVectors(o,r),u.subVectors(s,r),c.cross(u),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,v),h.fromBufferAttribute(n,p),a.add(c),l.add(c),h.add(c),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(v,l.x,l.y,l.z),n.setXYZ(p,h.x,h.y,h.z)}else for(let f=0,m=t.count;f<m;f+=3)s.fromBufferAttribute(t,f+0),r.fromBufferAttribute(t,f+1),o.fromBufferAttribute(t,f+2),c.subVectors(o,r),u.subVectors(s,r),c.cross(u),n.setXYZ(f+0,c.x,c.y,c.z),n.setXYZ(f+1,c.x,c.y,c.z),n.setXYZ(f+2,c.x,c.y,c.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)yt.fromBufferAttribute(e,t),yt.normalize(),e.setXYZ(t,yt.x,yt.y,yt.z)}toNonIndexed(){function e(a,l){let h=a.array,c=a.itemSize,u=a.normalized,f=new h.constructor(l.length*c),m=0,g=0;for(let v=0,p=l.length;v<p;v++){a.isInterleavedBufferAttribute?m=l[v]*a.data.stride+a.offset:m=l[v]*c;for(let d=0;d<c;d++)f[g++]=h[m++]}return new Jt(f,c,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let a in s){let l=s[a],h=e(l,n);t.setAttribute(a,h)}let r=this.morphAttributes;for(let a in r){let l=[],h=r[a];for(let c=0,u=h.length;c<u;c++){let f=h[c],m=e(f,n);l.push(m)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let h=o[a];t.addGroup(h.start,h.count,h.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let h in l)l[h]!==void 0&&(e[h]=l[h]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let h=n[l];e.data.attributes[l]=h.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let h=this.morphAttributes[l],c=[];for(let u=0,f=h.length;u<f;u++){let m=h[u];c.push(m.toJSON(e.data))}c.length>0&&(s[l]=c,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone(t));let s=e.attributes;for(let h in s){let c=s[h];this.setAttribute(h,c.clone(t))}let r=e.morphAttributes;for(let h in r){let c=[],u=r[h];for(let f=0,m=u.length;f<m;f++)c.push(u[f].clone(t));this.morphAttributes[h]=c}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let h=0,c=o.length;h<c;h++){let u=o[h];this.addGroup(u.start,u.count,u.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Jh=new We,wi=new kl,Gr=new Ni,Kh=new P,Wr=new P,Xr=new P,qr=new P,ka=new P,Yr=new P,Qh=new P,$r=new P,ft=class extends Dt{constructor(e=new Nt,t=new an){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){Yr.set(0,0,0);for(let l=0,h=r.length;l<h;l++){let c=a[l],u=r[l];c!==0&&(ka.fromBufferAttribute(u,e),o?Yr.addScaledVector(ka,c):Yr.addScaledVector(ka.sub(t),c))}t.add(Yr)}return t}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Gr.copy(n.boundingSphere),Gr.applyMatrix4(r),wi.copy(e.ray).recast(e.near),!(Gr.containsPoint(wi.origin)===!1&&(wi.intersectSphere(Gr,Kh)===null||wi.origin.distanceToSquared(Kh)>(e.far-e.near)**2))&&(Jh.copy(r).invert(),wi.copy(e.ray).applyMatrix4(Jh),!(n.boundingBox!==null&&wi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,wi)))}_computeIntersections(e,t,n){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,h=r.attributes.uv,c=r.attributes.uv1,u=r.attributes.normal,f=r.groups,m=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,v=f.length;g<v;g++){let p=f[g],d=o[p.materialIndex],w=Math.max(p.start,m.start),S=Math.min(a.count,Math.min(p.start+p.count,m.start+m.count));for(let _=w,I=S;_<I;_+=3){let T=a.getX(_),A=a.getX(_+1),C=a.getX(_+2);s=Zr(this,d,e,n,h,c,u,T,A,C),s&&(s.faceIndex=Math.floor(_/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let g=Math.max(0,m.start),v=Math.min(a.count,m.start+m.count);for(let p=g,d=v;p<d;p+=3){let w=a.getX(p),S=a.getX(p+1),_=a.getX(p+2);s=Zr(this,o,e,n,h,c,u,w,S,_),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,v=f.length;g<v;g++){let p=f[g],d=o[p.materialIndex],w=Math.max(p.start,m.start),S=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let _=w,I=S;_<I;_+=3){let T=_,A=_+1,C=_+2;s=Zr(this,d,e,n,h,c,u,T,A,C),s&&(s.faceIndex=Math.floor(_/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let g=Math.max(0,m.start),v=Math.min(l.count,m.start+m.count);for(let p=g,d=v;p<d;p+=3){let w=p,S=p+1,_=p+2;s=Zr(this,o,e,n,h,c,u,w,S,_),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}}};function _p(i,e,t,n,s,r,o,a){let l;if(e.side===Gt?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,e.side===ui,a),l===null)return null;$r.copy(a),$r.applyMatrix4(i.matrixWorld);let h=t.ray.origin.distanceTo($r);return h<t.near||h>t.far?null:{distance:h,point:$r.clone(),object:i}}function Zr(i,e,t,n,s,r,o,a,l,h){i.getVertexPosition(a,Wr),i.getVertexPosition(l,Xr),i.getVertexPosition(h,qr);let c=_p(i,e,t,n,Wr,Xr,qr,Qh);if(c){let u=new P;Ii.getBarycoord(Qh,Wr,Xr,qr,u),s&&(c.uv=Ii.getInterpolatedAttribute(s,a,l,h,u,new Oe)),r&&(c.uv1=Ii.getInterpolatedAttribute(r,a,l,h,u,new Oe)),o&&(c.normal=Ii.getInterpolatedAttribute(o,a,l,h,u,new P),c.normal.dot(n.direction)>0&&c.normal.multiplyScalar(-1));let f={a,b:l,c:h,normal:new P,materialIndex:0};Ii.getNormal(Wr,Xr,qr,f.normal),c.face=f,c.barycoord=u}return c}var js=class i extends Nt{constructor(e=1,t=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],h=[],c=[],u=[],f=0,m=0;g("z","y","x",-1,-1,n,t,e,o,r,0),g("z","y","x",1,-1,n,t,-e,o,r,1),g("x","z","y",1,1,e,n,t,s,o,2),g("x","z","y",1,-1,e,n,-t,s,o,3),g("x","y","z",1,-1,e,t,n,s,r,4),g("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Ke(h,3)),this.setAttribute("normal",new Ke(c,3)),this.setAttribute("uv",new Ke(u,2));function g(v,p,d,w,S,_,I,T,A,C,b){let x=_/A,R=I/C,L=_/2,O=I/2,B=T/2,G=A+1,z=C+1,K=0,W=0,j=new P;for(let ie=0;ie<z;ie++){let pe=ie*R-O;for(let Ue=0;Ue<G;Ue++){let $e=Ue*x-L;j[v]=$e*w,j[p]=pe*S,j[d]=B,h.push(j.x,j.y,j.z),j[v]=0,j[p]=0,j[d]=T>0?1:-1,c.push(j.x,j.y,j.z),u.push(Ue/A),u.push(1-ie/C),K+=1}}for(let ie=0;ie<C;ie++)for(let pe=0;pe<A;pe++){let Ue=f+pe+G*ie,$e=f+pe+G*(ie+1),Y=f+(pe+1)+G*(ie+1),ne=f+(pe+1)+G*ie;l.push(Ue,$e,ne),l.push($e,Y,ne),W+=6}a.addGroup(m,W,b),m+=W,f+=K}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function ys(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function Ut(i){let e={};for(let t=0;t<i.length;t++){let n=ys(i[t]);for(let s in n)e[s]=n[s]}return e}function yp(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Wu(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ge.workingColorSpace}var vp={clone:ys,merge:Ut},Mp=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,bp=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Dn=class extends fi{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Mp,this.fragmentShader=bp,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ys(e.uniforms),this.uniformsGroups=yp(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},go=class extends Dt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new We,this.projectionMatrix=new We,this.projectionMatrixInverse=new We,this.coordinateSystem=qn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},ai=new P,jh=new Oe,eu=new Oe,Rt=class extends go{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Nl*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(ya*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Nl*2*Math.atan(Math.tan(ya*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ai.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ai.x,ai.y).multiplyScalar(-e/ai.z),ai.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ai.x,ai.y).multiplyScalar(-e/ai.z)}getViewSize(e,t){return this.getViewBounds(e,jh,eu),t.subVectors(eu,jh)}setViewOffset(e,t,n,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(ya*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,h=o.fullHeight;r+=o.offsetX*s/l,t-=o.offsetY*n/h,s*=o.width/l,n*=o.height/h}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},ss=-90,rs=1,zl=class extends Dt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Rt(ss,rs,e,t);s.layers=this.layers,this.add(s);let r=new Rt(ss,rs,e,t);r.layers=this.layers,this.add(r);let o=new Rt(ss,rs,e,t);o.layers=this.layers,this.add(o);let a=new Rt(ss,rs,e,t);a.layers=this.layers,this.add(a);let l=new Rt(ss,rs,e,t);l.layers=this.layers,this.add(l);let h=new Rt(ss,rs,e,t);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,o,a,l]=t;for(let h of t)this.remove(h);if(e===qn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===co)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let h of t)this.add(h),h.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,h,c]=this.children,u=e.getRenderTarget(),f=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,o),e.setRenderTarget(n,2,s),e.render(t,a),e.setRenderTarget(n,3,s),e.render(t,l),e.setRenderTarget(n,4,s),e.render(t,h),n.texture.generateMipmaps=v,e.setRenderTarget(n,5,s),e.render(t,c),e.setRenderTarget(u,f,m),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},xo=class extends Kt{constructor(e,t,n,s,r,o,a,l,h,c){e=e!==void 0?e:[],t=t!==void 0?t:ps,super(e,t,n,s,r,o,a,l,h,c),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Vl=class extends Zn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new xo(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Ln}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new js(5,5,5),r=new Dn({name:"CubemapFromEquirect",uniforms:ys(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Gt,blending:ci});r.uniforms.tEquirect.value=t;let o=new ft(s,r),a=t.minFilter;return t.minFilter===Ui&&(t.minFilter=Ln),new zl(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,n,s){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,s);e.setRenderTarget(r)}},za=new P,Sp=new P,wp=new Re,Xn=class{constructor(e=new P(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=za.subVectors(n,t).cross(Sp.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(za),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||wp.getNormalMatrix(e),s=this.coplanarPoint(za).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Ei=new Ni,Jr=new P,er=class{constructor(e=new Xn,t=new Xn,n=new Xn,s=new Xn,r=new Xn,o=new Xn){this.planes=[e,t,n,s,r,o]}set(e,t,n,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=qn){let n=this.planes,s=e.elements,r=s[0],o=s[1],a=s[2],l=s[3],h=s[4],c=s[5],u=s[6],f=s[7],m=s[8],g=s[9],v=s[10],p=s[11],d=s[12],w=s[13],S=s[14],_=s[15];if(n[0].setComponents(l-r,f-h,p-m,_-d).normalize(),n[1].setComponents(l+r,f+h,p+m,_+d).normalize(),n[2].setComponents(l+o,f+c,p+g,_+w).normalize(),n[3].setComponents(l-o,f-c,p-g,_-w).normalize(),n[4].setComponents(l-a,f-u,p-v,_-S).normalize(),t===qn)n[5].setComponents(l+a,f+u,p+v,_+S).normalize();else if(t===co)n[5].setComponents(a,u,v,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ei.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ei.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ei)}intersectsSprite(e){return Ei.center.set(0,0,0),Ei.radius=.7071067811865476,Ei.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ei)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(Jr.x=s.normal.x>0?e.max.x:e.min.x,Jr.y=s.normal.y>0?e.max.y:e.min.y,Jr.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Jr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function Xu(){let i=null,e=!1,t=null,n=null;function s(r,o){t(r,o),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Ep(i){let e=new WeakMap;function t(a,l){let h=a.array,c=a.usage,u=h.byteLength,f=i.createBuffer();i.bindBuffer(l,f),i.bufferData(l,h,c),a.onUploadCallback();let m;if(h instanceof Float32Array)m=i.FLOAT;else if(h instanceof Uint16Array)a.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(h instanceof Int16Array)m=i.SHORT;else if(h instanceof Uint32Array)m=i.UNSIGNED_INT;else if(h instanceof Int32Array)m=i.INT;else if(h instanceof Int8Array)m=i.BYTE;else if(h instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:f,type:m,bytesPerElement:h.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,l,h){let c=l.array,u=l.updateRanges;if(i.bindBuffer(h,a),u.length===0)i.bufferSubData(h,0,c);else{u.sort((m,g)=>m.start-g.start);let f=0;for(let m=1;m<u.length;m++){let g=u[f],v=u[m];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++f,u[f]=v)}u.length=f+1;for(let m=0,g=u.length;m<g;m++){let v=u[m];i.bufferSubData(h,v.start*c.BYTES_PER_ELEMENT,c,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(i.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let c=e.get(a);(!c||c.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let h=e.get(a);if(h===void 0)e.set(a,t(a,l));else if(h.version<a.version){if(h.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(h.buffer,a,l),h.version=a.version}}return{get:s,remove:r,update:o}}var Fi=class i extends Nt{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(n),l=Math.floor(s),h=a+1,c=l+1,u=e/a,f=t/l,m=[],g=[],v=[],p=[];for(let d=0;d<c;d++){let w=d*f-o;for(let S=0;S<h;S++){let _=S*u-r;g.push(_,-w,0),v.push(0,0,1),p.push(S/a),p.push(1-d/l)}}for(let d=0;d<l;d++)for(let w=0;w<a;w++){let S=w+h*d,_=w+h*(d+1),I=w+1+h*(d+1),T=w+1+h*d;m.push(S,_,T),m.push(_,I,T)}this.setIndex(m),this.setAttribute("position",new Ke(g,3)),this.setAttribute("normal",new Ke(v,3)),this.setAttribute("uv",new Ke(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}},Tp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ap=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Cp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Rp=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ip=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Pp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Lp=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Up=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Dp=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Np=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Fp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Op=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Bp=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,kp=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,zp=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Vp=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Hp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Gp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Wp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Xp=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,qp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Yp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,$p=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Zp=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Jp=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Kp=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Qp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,jp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,em=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,tm=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,nm="gl_FragColor = linearToOutputTexel( gl_FragColor );",im=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,sm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,rm=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,om=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,am=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,lm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,cm=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,hm=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,um=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,dm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,fm=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,pm=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,mm=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,gm=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,xm=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,_m=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,ym=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,vm=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Mm=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,bm=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Sm=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,wm=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Em=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Tm=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Am=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Cm=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Rm=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Im=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Pm=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Lm=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Um=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Dm=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Nm=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Fm=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Om=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Bm=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,km=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,zm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Vm=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Hm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Gm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Wm=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Xm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,qm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ym=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,$m=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Zm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Jm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Km=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Qm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,jm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,eg=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,tg=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,ng=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,ig=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,sg=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,rg=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,og=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,ag=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,lg=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,cg=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,hg=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,ug=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,dg=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,fg=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,pg=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,mg=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,gg=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,xg=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,_g=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,yg=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,vg=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Mg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,bg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Sg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,wg=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Eg=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Tg=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ag=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Cg=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Rg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ig=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Pg=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Lg=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Ug=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Dg=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Ng=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Fg=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Og=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Bg=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,kg=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,zg=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vg=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Hg=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Gg=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Wg=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Xg=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,qg=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Yg=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,$g=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zg=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Jg=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Kg=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Qg=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,jg=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,e0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,t0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,n0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,i0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,s0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ne={alphahash_fragment:Tp,alphahash_pars_fragment:Ap,alphamap_fragment:Cp,alphamap_pars_fragment:Rp,alphatest_fragment:Ip,alphatest_pars_fragment:Pp,aomap_fragment:Lp,aomap_pars_fragment:Up,batching_pars_vertex:Dp,batching_vertex:Np,begin_vertex:Fp,beginnormal_vertex:Op,bsdfs:Bp,iridescence_fragment:kp,bumpmap_pars_fragment:zp,clipping_planes_fragment:Vp,clipping_planes_pars_fragment:Hp,clipping_planes_pars_vertex:Gp,clipping_planes_vertex:Wp,color_fragment:Xp,color_pars_fragment:qp,color_pars_vertex:Yp,color_vertex:$p,common:Zp,cube_uv_reflection_fragment:Jp,defaultnormal_vertex:Kp,displacementmap_pars_vertex:Qp,displacementmap_vertex:jp,emissivemap_fragment:em,emissivemap_pars_fragment:tm,colorspace_fragment:nm,colorspace_pars_fragment:im,envmap_fragment:sm,envmap_common_pars_fragment:rm,envmap_pars_fragment:om,envmap_pars_vertex:am,envmap_physical_pars_fragment:_m,envmap_vertex:lm,fog_vertex:cm,fog_pars_vertex:hm,fog_fragment:um,fog_pars_fragment:dm,gradientmap_pars_fragment:fm,lightmap_pars_fragment:pm,lights_lambert_fragment:mm,lights_lambert_pars_fragment:gm,lights_pars_begin:xm,lights_toon_fragment:ym,lights_toon_pars_fragment:vm,lights_phong_fragment:Mm,lights_phong_pars_fragment:bm,lights_physical_fragment:Sm,lights_physical_pars_fragment:wm,lights_fragment_begin:Em,lights_fragment_maps:Tm,lights_fragment_end:Am,logdepthbuf_fragment:Cm,logdepthbuf_pars_fragment:Rm,logdepthbuf_pars_vertex:Im,logdepthbuf_vertex:Pm,map_fragment:Lm,map_pars_fragment:Um,map_particle_fragment:Dm,map_particle_pars_fragment:Nm,metalnessmap_fragment:Fm,metalnessmap_pars_fragment:Om,morphinstance_vertex:Bm,morphcolor_vertex:km,morphnormal_vertex:zm,morphtarget_pars_vertex:Vm,morphtarget_vertex:Hm,normal_fragment_begin:Gm,normal_fragment_maps:Wm,normal_pars_fragment:Xm,normal_pars_vertex:qm,normal_vertex:Ym,normalmap_pars_fragment:$m,clearcoat_normal_fragment_begin:Zm,clearcoat_normal_fragment_maps:Jm,clearcoat_pars_fragment:Km,iridescence_pars_fragment:Qm,opaque_fragment:jm,packing:eg,premultiplied_alpha_fragment:tg,project_vertex:ng,dithering_fragment:ig,dithering_pars_fragment:sg,roughnessmap_fragment:rg,roughnessmap_pars_fragment:og,shadowmap_pars_fragment:ag,shadowmap_pars_vertex:lg,shadowmap_vertex:cg,shadowmask_pars_fragment:hg,skinbase_vertex:ug,skinning_pars_vertex:dg,skinning_vertex:fg,skinnormal_vertex:pg,specularmap_fragment:mg,specularmap_pars_fragment:gg,tonemapping_fragment:xg,tonemapping_pars_fragment:_g,transmission_fragment:yg,transmission_pars_fragment:vg,uv_pars_fragment:Mg,uv_pars_vertex:bg,uv_vertex:Sg,worldpos_vertex:wg,background_vert:Eg,background_frag:Tg,backgroundCube_vert:Ag,backgroundCube_frag:Cg,cube_vert:Rg,cube_frag:Ig,depth_vert:Pg,depth_frag:Lg,distanceRGBA_vert:Ug,distanceRGBA_frag:Dg,equirect_vert:Ng,equirect_frag:Fg,linedashed_vert:Og,linedashed_frag:Bg,meshbasic_vert:kg,meshbasic_frag:zg,meshlambert_vert:Vg,meshlambert_frag:Hg,meshmatcap_vert:Gg,meshmatcap_frag:Wg,meshnormal_vert:Xg,meshnormal_frag:qg,meshphong_vert:Yg,meshphong_frag:$g,meshphysical_vert:Zg,meshphysical_frag:Jg,meshtoon_vert:Kg,meshtoon_frag:Qg,points_vert:jg,points_frag:e0,shadow_vert:t0,shadow_frag:n0,sprite_vert:i0,sprite_frag:s0},se={common:{diffuse:{value:new Me(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Re},alphaMap:{value:null},alphaMapTransform:{value:new Re},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Re}},envmap:{envMap:{value:null},envMapRotation:{value:new Re},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Re}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Re}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Re},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Re},normalScale:{value:new Oe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Re},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Re}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Re}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Re}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Me(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Me(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Re},alphaTest:{value:0},uvTransform:{value:new Re}},sprite:{diffuse:{value:new Me(16777215)},opacity:{value:1},center:{value:new Oe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Re},alphaMap:{value:null},alphaMapTransform:{value:new Re},alphaTest:{value:0}}},Pn={basic:{uniforms:Ut([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.fog]),vertexShader:Ne.meshbasic_vert,fragmentShader:Ne.meshbasic_frag},lambert:{uniforms:Ut([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.fog,se.lights,{emissive:{value:new Me(0)}}]),vertexShader:Ne.meshlambert_vert,fragmentShader:Ne.meshlambert_frag},phong:{uniforms:Ut([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.fog,se.lights,{emissive:{value:new Me(0)},specular:{value:new Me(1118481)},shininess:{value:30}}]),vertexShader:Ne.meshphong_vert,fragmentShader:Ne.meshphong_frag},standard:{uniforms:Ut([se.common,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.roughnessmap,se.metalnessmap,se.fog,se.lights,{emissive:{value:new Me(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ne.meshphysical_vert,fragmentShader:Ne.meshphysical_frag},toon:{uniforms:Ut([se.common,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.gradientmap,se.fog,se.lights,{emissive:{value:new Me(0)}}]),vertexShader:Ne.meshtoon_vert,fragmentShader:Ne.meshtoon_frag},matcap:{uniforms:Ut([se.common,se.bumpmap,se.normalmap,se.displacementmap,se.fog,{matcap:{value:null}}]),vertexShader:Ne.meshmatcap_vert,fragmentShader:Ne.meshmatcap_frag},points:{uniforms:Ut([se.points,se.fog]),vertexShader:Ne.points_vert,fragmentShader:Ne.points_frag},dashed:{uniforms:Ut([se.common,se.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ne.linedashed_vert,fragmentShader:Ne.linedashed_frag},depth:{uniforms:Ut([se.common,se.displacementmap]),vertexShader:Ne.depth_vert,fragmentShader:Ne.depth_frag},normal:{uniforms:Ut([se.common,se.bumpmap,se.normalmap,se.displacementmap,{opacity:{value:1}}]),vertexShader:Ne.meshnormal_vert,fragmentShader:Ne.meshnormal_frag},sprite:{uniforms:Ut([se.sprite,se.fog]),vertexShader:Ne.sprite_vert,fragmentShader:Ne.sprite_frag},background:{uniforms:{uvTransform:{value:new Re},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ne.background_vert,fragmentShader:Ne.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Re}},vertexShader:Ne.backgroundCube_vert,fragmentShader:Ne.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ne.cube_vert,fragmentShader:Ne.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ne.equirect_vert,fragmentShader:Ne.equirect_frag},distanceRGBA:{uniforms:Ut([se.common,se.displacementmap,{referencePosition:{value:new P},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ne.distanceRGBA_vert,fragmentShader:Ne.distanceRGBA_frag},shadow:{uniforms:Ut([se.lights,se.fog,{color:{value:new Me(0)},opacity:{value:1}}]),vertexShader:Ne.shadow_vert,fragmentShader:Ne.shadow_frag}};Pn.physical={uniforms:Ut([Pn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Re},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Re},clearcoatNormalScale:{value:new Oe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Re},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Re},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Re},sheen:{value:0},sheenColor:{value:new Me(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Re},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Re},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Re},transmissionSamplerSize:{value:new Oe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Re},attenuationDistance:{value:0},attenuationColor:{value:new Me(0)},specularColor:{value:new Me(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Re},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Re},anisotropyVector:{value:new Oe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Re}}]),vertexShader:Ne.meshphysical_vert,fragmentShader:Ne.meshphysical_frag};var Kr={r:0,b:0,g:0},Ti=new Mt,r0=new We;function o0(i,e,t,n,s,r,o){let a=new Me(0),l=r===!0?0:1,h,c,u=null,f=0,m=null;function g(w){let S=w.isScene===!0?w.background:null;return S&&S.isTexture&&(S=(w.backgroundBlurriness>0?t:e).get(S)),S}function v(w){let S=!1,_=g(w);_===null?d(a,l):_&&_.isColor&&(d(_,1),S=!0);let I=i.xr.getEnvironmentBlendMode();I==="additive"?n.buffers.color.setClear(0,0,0,1,o):I==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||S)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function p(w,S){let _=g(S);_&&(_.isCubeTexture||_.mapping===No)?(c===void 0&&(c=new ft(new js(1,1,1),new Dn({name:"BackgroundCubeMaterial",uniforms:ys(Pn.backgroundCube.uniforms),vertexShader:Pn.backgroundCube.vertexShader,fragmentShader:Pn.backgroundCube.fragmentShader,side:Gt,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(I,T,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(c)),Ti.copy(S.backgroundRotation),Ti.x*=-1,Ti.y*=-1,Ti.z*=-1,_.isCubeTexture&&_.isRenderTargetTexture===!1&&(Ti.y*=-1,Ti.z*=-1),c.material.uniforms.envMap.value=_,c.material.uniforms.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(r0.makeRotationFromEuler(Ti)),c.material.toneMapped=Ge.getTransfer(_.colorSpace)!==je,(u!==_||f!==_.version||m!==i.toneMapping)&&(c.material.needsUpdate=!0,u=_,f=_.version,m=i.toneMapping),c.layers.enableAll(),w.unshift(c,c.geometry,c.material,0,0,null)):_&&_.isTexture&&(h===void 0&&(h=new ft(new Fi(2,2),new Dn({name:"BackgroundMaterial",uniforms:ys(Pn.background.uniforms),vertexShader:Pn.background.vertexShader,fragmentShader:Pn.background.fragmentShader,side:ui,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),Object.defineProperty(h.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(h)),h.material.uniforms.t2D.value=_,h.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,h.material.toneMapped=Ge.getTransfer(_.colorSpace)!==je,_.matrixAutoUpdate===!0&&_.updateMatrix(),h.material.uniforms.uvTransform.value.copy(_.matrix),(u!==_||f!==_.version||m!==i.toneMapping)&&(h.material.needsUpdate=!0,u=_,f=_.version,m=i.toneMapping),h.layers.enableAll(),w.unshift(h,h.geometry,h.material,0,0,null))}function d(w,S){w.getRGB(Kr,Wu(i)),n.buffers.color.setClear(Kr.r,Kr.g,Kr.b,S,o)}return{getClearColor:function(){return a},setClearColor:function(w,S=1){a.set(w),l=S,d(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(w){l=w,d(a,l)},render:v,addToRenderList:p}}function a0(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=f(null),r=s,o=!1;function a(x,R,L,O,B){let G=!1,z=u(O,L,R);r!==z&&(r=z,h(r.object)),G=m(x,O,L,B),G&&g(x,O,L,B),B!==null&&e.update(B,i.ELEMENT_ARRAY_BUFFER),(G||o)&&(o=!1,_(x,R,L,O),B!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(B).buffer))}function l(){return i.createVertexArray()}function h(x){return i.bindVertexArray(x)}function c(x){return i.deleteVertexArray(x)}function u(x,R,L){let O=L.wireframe===!0,B=n[x.id];B===void 0&&(B={},n[x.id]=B);let G=B[R.id];G===void 0&&(G={},B[R.id]=G);let z=G[O];return z===void 0&&(z=f(l()),G[O]=z),z}function f(x){let R=[],L=[],O=[];for(let B=0;B<t;B++)R[B]=0,L[B]=0,O[B]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:R,enabledAttributes:L,attributeDivisors:O,object:x,attributes:{},index:null}}function m(x,R,L,O){let B=r.attributes,G=R.attributes,z=0,K=L.getAttributes();for(let W in K)if(K[W].location>=0){let ie=B[W],pe=G[W];if(pe===void 0&&(W==="instanceMatrix"&&x.instanceMatrix&&(pe=x.instanceMatrix),W==="instanceColor"&&x.instanceColor&&(pe=x.instanceColor)),ie===void 0||ie.attribute!==pe||pe&&ie.data!==pe.data)return!0;z++}return r.attributesNum!==z||r.index!==O}function g(x,R,L,O){let B={},G=R.attributes,z=0,K=L.getAttributes();for(let W in K)if(K[W].location>=0){let ie=G[W];ie===void 0&&(W==="instanceMatrix"&&x.instanceMatrix&&(ie=x.instanceMatrix),W==="instanceColor"&&x.instanceColor&&(ie=x.instanceColor));let pe={};pe.attribute=ie,ie&&ie.data&&(pe.data=ie.data),B[W]=pe,z++}r.attributes=B,r.attributesNum=z,r.index=O}function v(){let x=r.newAttributes;for(let R=0,L=x.length;R<L;R++)x[R]=0}function p(x){d(x,0)}function d(x,R){let L=r.newAttributes,O=r.enabledAttributes,B=r.attributeDivisors;L[x]=1,O[x]===0&&(i.enableVertexAttribArray(x),O[x]=1),B[x]!==R&&(i.vertexAttribDivisor(x,R),B[x]=R)}function w(){let x=r.newAttributes,R=r.enabledAttributes;for(let L=0,O=R.length;L<O;L++)R[L]!==x[L]&&(i.disableVertexAttribArray(L),R[L]=0)}function S(x,R,L,O,B,G,z){z===!0?i.vertexAttribIPointer(x,R,L,B,G):i.vertexAttribPointer(x,R,L,O,B,G)}function _(x,R,L,O){v();let B=O.attributes,G=L.getAttributes(),z=R.defaultAttributeValues;for(let K in G){let W=G[K];if(W.location>=0){let j=B[K];if(j===void 0&&(K==="instanceMatrix"&&x.instanceMatrix&&(j=x.instanceMatrix),K==="instanceColor"&&x.instanceColor&&(j=x.instanceColor)),j!==void 0){let ie=j.normalized,pe=j.itemSize,Ue=e.get(j);if(Ue===void 0)continue;let $e=Ue.buffer,Y=Ue.type,ne=Ue.bytesPerElement,_e=Y===i.INT||Y===i.UNSIGNED_INT||j.gpuType===pc;if(j.isInterleavedBufferAttribute){let oe=j.data,Te=oe.stride,Ie=j.offset;if(oe.isInstancedInterleavedBuffer){for(let Fe=0;Fe<W.locationSize;Fe++)d(W.location+Fe,oe.meshPerAttribute);x.isInstancedMesh!==!0&&O._maxInstanceCount===void 0&&(O._maxInstanceCount=oe.meshPerAttribute*oe.count)}else for(let Fe=0;Fe<W.locationSize;Fe++)p(W.location+Fe);i.bindBuffer(i.ARRAY_BUFFER,$e);for(let Fe=0;Fe<W.locationSize;Fe++)S(W.location+Fe,pe/W.locationSize,Y,ie,Te*ne,(Ie+pe/W.locationSize*Fe)*ne,_e)}else{if(j.isInstancedBufferAttribute){for(let oe=0;oe<W.locationSize;oe++)d(W.location+oe,j.meshPerAttribute);x.isInstancedMesh!==!0&&O._maxInstanceCount===void 0&&(O._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let oe=0;oe<W.locationSize;oe++)p(W.location+oe);i.bindBuffer(i.ARRAY_BUFFER,$e);for(let oe=0;oe<W.locationSize;oe++)S(W.location+oe,pe/W.locationSize,Y,ie,pe*ne,pe/W.locationSize*oe*ne,_e)}}else if(z!==void 0){let ie=z[K];if(ie!==void 0)switch(ie.length){case 2:i.vertexAttrib2fv(W.location,ie);break;case 3:i.vertexAttrib3fv(W.location,ie);break;case 4:i.vertexAttrib4fv(W.location,ie);break;default:i.vertexAttrib1fv(W.location,ie)}}}}w()}function I(){C();for(let x in n){let R=n[x];for(let L in R){let O=R[L];for(let B in O)c(O[B].object),delete O[B];delete R[L]}delete n[x]}}function T(x){if(n[x.id]===void 0)return;let R=n[x.id];for(let L in R){let O=R[L];for(let B in O)c(O[B].object),delete O[B];delete R[L]}delete n[x.id]}function A(x){for(let R in n){let L=n[R];if(L[x.id]===void 0)continue;let O=L[x.id];for(let B in O)c(O[B].object),delete O[B];delete L[x.id]}}function C(){b(),o=!0,r!==s&&(r=s,h(r.object))}function b(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:C,resetDefaultState:b,dispose:I,releaseStatesOfGeometry:T,releaseStatesOfProgram:A,initAttributes:v,enableAttribute:p,disableUnusedAttributes:w}}function l0(i,e,t){let n;function s(h){n=h}function r(h,c){i.drawArrays(n,h,c),t.update(c,n,1)}function o(h,c,u){u!==0&&(i.drawArraysInstanced(n,h,c,u),t.update(c,n,u))}function a(h,c,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,h,0,c,0,u);let m=0;for(let g=0;g<u;g++)m+=c[g];t.update(m,n,1)}function l(h,c,u,f){if(u===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<h.length;g++)o(h[g],c[g],f[g]);else{m.multiDrawArraysInstancedWEBGL(n,h,0,c,0,f,0,u);let g=0;for(let v=0;v<u;v++)g+=c[v]*f[v];t.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function c0(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let A=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(A){return!(A!==gn&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(A){let C=A===ir&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(A!==$n&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==Un&&!C)}function l(A){if(A==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=t.precision!==void 0?t.precision:"highp",c=l(h);c!==h&&(console.warn("THREE.WebGLRenderer:",h,"not supported, using",c,"instead."),h=c);let u=t.logarithmicDepthBuffer===!0,f=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),d=i.getParameter(i.MAX_VERTEX_ATTRIBS),w=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),S=i.getParameter(i.MAX_VARYING_VECTORS),_=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),I=g>0,T=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:h,logarithmicDepthBuffer:u,reverseDepthBuffer:f,maxTextures:m,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:p,maxAttributes:d,maxVertexUniforms:w,maxVaryings:S,maxFragmentUniforms:_,vertexTextures:I,maxSamples:T}}function h0(i){let e=this,t=null,n=0,s=!1,r=!1,o=new Xn,a=new Re,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){let m=u.length!==0||f||n!==0||s;return s=f,n=u.length,m},this.beginShadows=function(){r=!0,c(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,f){t=c(u,f,0)},this.setState=function(u,f,m){let g=u.clippingPlanes,v=u.clipIntersection,p=u.clipShadows,d=i.get(u);if(!s||g===null||g.length===0||r&&!p)r?c(null):h();else{let w=r?0:n,S=w*4,_=d.clippingState||null;l.value=_,_=c(g,f,S,m);for(let I=0;I!==S;++I)_[I]=t[I];d.clippingState=_,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=w}};function h(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function c(u,f,m,g){let v=u!==null?u.length:0,p=null;if(v!==0){if(p=l.value,g!==!0||p===null){let d=m+v*4,w=f.matrixWorldInverse;a.getNormalMatrix(w),(p===null||p.length<d)&&(p=new Float32Array(d));for(let S=0,_=m;S!==v;++S,_+=4)o.copy(u[S]).applyMatrix4(w,a),o.normal.toArray(p,_),p[_+3]=o.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=v,e.numIntersection=0,p}}function u0(i){let e=new WeakMap;function t(o,a){return a===sl?o.mapping=ps:a===rl&&(o.mapping=ms),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===sl||a===rl)if(e.has(o)){let l=e.get(o).texture;return t(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let h=new Vl(l.height);return h.fromEquirectangularTexture(i,o),e.set(o,h),o.addEventListener("dispose",s),t(h.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var _o=class extends go{constructor(e=-1,t=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,o=n+e,a=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let h=(this.right-this.left)/this.view.fullWidth/this.zoom,c=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=h*this.view.offsetX,o=r+h*this.view.width,a-=c*this.view.offsetY,l=a-c*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},ls=4,tu=[.125,.215,.35,.446,.526,.582],Pi=20,Va=new _o,nu=new Me,Ha=null,Ga=0,Wa=0,Xa=!1,Ci=(1+Math.sqrt(5))/2,os=1/Ci,iu=[new P(-Ci,os,0),new P(Ci,os,0),new P(-os,0,Ci),new P(os,0,Ci),new P(0,Ci,-os),new P(0,Ci,os),new P(-1,1,-1),new P(1,1,-1),new P(-1,1,1),new P(1,1,1)],yo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100){Ha=this._renderer.getRenderTarget(),Ga=this._renderer.getActiveCubeFace(),Wa=this._renderer.getActiveMipmapLevel(),Xa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,s,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ou(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ru(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Ha,Ga,Wa),this._renderer.xr.enabled=Xa,e.scissorTest=!1,Qr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===ps||e.mapping===ms?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Ha=this._renderer.getRenderTarget(),Ga=this._renderer.getActiveCubeFace(),Wa=this._renderer.getActiveMipmapLevel(),Xa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Ln,minFilter:Ln,generateMipmaps:!1,type:ir,format:gn,colorSpace:bs,depthBuffer:!1},s=su(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=su(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=d0(r)),this._blurMaterial=f0(r,e,t)}return s}_compileMaterial(e){let t=new ft(this._lodPlanes[0],e);this._renderer.compile(t,Va)}_sceneToCubeUV(e,t,n,s){let a=new Rt(90,1,t,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],c=this._renderer,u=c.autoClear,f=c.toneMapping;c.getClearColor(nu),c.toneMapping=hi,c.autoClear=!1;let m=new an({name:"PMREM.Background",side:Gt,depthWrite:!1,depthTest:!1}),g=new ft(new js,m),v=!1,p=e.background;p?p.isColor&&(m.color.copy(p),e.background=null,v=!0):(m.color.copy(nu),v=!0);for(let d=0;d<6;d++){let w=d%3;w===0?(a.up.set(0,l[d],0),a.lookAt(h[d],0,0)):w===1?(a.up.set(0,0,l[d]),a.lookAt(0,h[d],0)):(a.up.set(0,l[d],0),a.lookAt(0,0,h[d]));let S=this._cubeSize;Qr(s,w*S,d>2?S:0,S,S),c.setRenderTarget(s),v&&c.render(g,a),c.render(e,a)}g.geometry.dispose(),g.material.dispose(),c.toneMapping=f,c.autoClear=u,e.background=p}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===ps||e.mapping===ms;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=ou()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ru());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new ft(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let l=this._cubeSize;Qr(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(o,Va)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=iu[(s-r-1)%iu.length];this._blur(e,r-1,r,o,a)}t.autoClear=n}_blur(e,t,n,s,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,s,"latitudinal",r),this._halfBlur(o,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,o,a){let l=this._renderer,h=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let c=3,u=new ft(this._lodPlanes[s],h),f=h.uniforms,m=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*Pi-1),v=r/g,p=isFinite(r)?1+Math.floor(c*v):Pi;p>Pi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Pi}`);let d=[],w=0;for(let A=0;A<Pi;++A){let C=A/v,b=Math.exp(-C*C/2);d.push(b),A===0?w+=b:A<p&&(w+=2*b)}for(let A=0;A<d.length;A++)d[A]=d[A]/w;f.envMap.value=e.texture,f.samples.value=p,f.weights.value=d,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);let{_lodMax:S}=this;f.dTheta.value=g,f.mipInt.value=S-n;let _=this._sizeLods[s],I=3*_*(s>S-ls?s-S+ls:0),T=4*(this._cubeSize-_);Qr(t,I,T,3*_,2*_),l.setRenderTarget(t),l.render(u,Va)}};function d0(i){let e=[],t=[],n=[],s=i,r=i-ls+1+tu.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);t.push(a);let l=1/a;o>i-ls?l=tu[o-i+ls-1]:o===0&&(l=0),n.push(l);let h=1/(a-2),c=-h,u=1+h,f=[c,c,u,c,u,u,c,c,u,u,c,u],m=6,g=6,v=3,p=2,d=1,w=new Float32Array(v*g*m),S=new Float32Array(p*g*m),_=new Float32Array(d*g*m);for(let T=0;T<m;T++){let A=T%3*2/3-1,C=T>2?0:-1,b=[A,C,0,A+2/3,C,0,A+2/3,C+1,0,A,C,0,A+2/3,C+1,0,A,C+1,0];w.set(b,v*g*T),S.set(f,p*g*T);let x=[T,T,T,T,T,T];_.set(x,d*g*T)}let I=new Nt;I.setAttribute("position",new Jt(w,v)),I.setAttribute("uv",new Jt(S,p)),I.setAttribute("faceIndex",new Jt(_,d)),e.push(I),s>ls&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function su(i,e,t){let n=new Zn(i,e,t);return n.texture.mapping=No,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Qr(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function f0(i,e,t){let n=new Float32Array(Pi),s=new P(0,1,0);return new Dn({name:"SphericalGaussianBlur",defines:{n:Pi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:bc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:ci,depthTest:!1,depthWrite:!1})}function ru(){return new Dn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:bc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:ci,depthTest:!1,depthWrite:!1})}function ou(){return new Dn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:bc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ci,depthTest:!1,depthWrite:!1})}function bc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function p0(i){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){let l=a.mapping,h=l===sl||l===rl,c=l===ps||l===ms;if(h||c){let u=e.get(a),f=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==f)return t===null&&(t=new yo(i)),u=h?t.fromEquirectangular(a,u):t.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),u.texture;if(u!==void 0)return u.texture;{let m=a.image;return h&&m&&m.height>0||c&&m&&s(m)?(t===null&&(t=new yo(i)),u=h?t.fromEquirectangular(a):t.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let l=0,h=6;for(let c=0;c<h;c++)a[c]!==void 0&&l++;return l===h}function r(a){let l=a.target;l.removeEventListener("dispose",r);let h=e.get(l);h!==void 0&&(e.delete(l),h.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function m0(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&Zs("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function g0(i,e,t,n){let s={},r=new WeakMap;function o(u){let f=u.target;f.index!==null&&e.remove(f.index);for(let g in f.attributes)e.remove(f.attributes[g]);for(let g in f.morphAttributes){let v=f.morphAttributes[g];for(let p=0,d=v.length;p<d;p++)e.remove(v[p])}f.removeEventListener("dispose",o),delete s[f.id];let m=r.get(f);m&&(e.remove(m),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function a(u,f){return s[f.id]===!0||(f.addEventListener("dispose",o),s[f.id]=!0,t.memory.geometries++),f}function l(u){let f=u.attributes;for(let g in f)e.update(f[g],i.ARRAY_BUFFER);let m=u.morphAttributes;for(let g in m){let v=m[g];for(let p=0,d=v.length;p<d;p++)e.update(v[p],i.ARRAY_BUFFER)}}function h(u){let f=[],m=u.index,g=u.attributes.position,v=0;if(m!==null){let w=m.array;v=m.version;for(let S=0,_=w.length;S<_;S+=3){let I=w[S+0],T=w[S+1],A=w[S+2];f.push(I,T,T,A,A,I)}}else if(g!==void 0){let w=g.array;v=g.version;for(let S=0,_=w.length/3-1;S<_;S+=3){let I=S+0,T=S+1,A=S+2;f.push(I,T,T,A,A,I)}}else return;let p=new(Hu(f)?mo:_s)(f,1);p.version=v;let d=r.get(u);d&&e.remove(d),r.set(u,p)}function c(u){let f=r.get(u);if(f){let m=u.index;m!==null&&f.version<m.version&&h(u)}else h(u);return r.get(u)}return{get:a,update:l,getWireframeAttribute:c}}function x0(i,e,t){let n;function s(f){n=f}let r,o;function a(f){r=f.type,o=f.bytesPerElement}function l(f,m){i.drawElements(n,m,r,f*o),t.update(m,n,1)}function h(f,m,g){g!==0&&(i.drawElementsInstanced(n,m,r,f*o,g),t.update(m,n,g))}function c(f,m,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,m,0,r,f,0,g);let p=0;for(let d=0;d<g;d++)p+=m[d];t.update(p,n,1)}function u(f,m,g,v){if(g===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let d=0;d<f.length;d++)h(f[d]/o,m[d],v[d]);else{p.multiDrawElementsInstancedWEBGL(n,m,0,r,f,0,v,0,g);let d=0;for(let w=0;w<g;w++)d+=m[w]*v[w];t.update(d,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=h,this.renderMultiDraw=c,this.renderMultiDrawInstances=u}function _0(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case i.TRIANGLES:t.triangles+=a*(r/3);break;case i.LINES:t.lines+=a*(r/2);break;case i.LINE_STRIP:t.lines+=a*(r-1);break;case i.LINE_LOOP:t.lines+=a*r;break;case i.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function y0(i,e,t){let n=new WeakMap,s=new et;function r(o,a,l){let h=o.morphTargetInfluences,c=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=c!==void 0?c.length:0,f=n.get(a);if(f===void 0||f.count!==u){let b=function(){A.dispose(),n.delete(a),a.removeEventListener("dispose",b)};f!==void 0&&f.texture.dispose();let m=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,v=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],d=a.morphAttributes.normal||[],w=a.morphAttributes.color||[],S=0;m===!0&&(S=1),g===!0&&(S=2),v===!0&&(S=3);let _=a.attributes.position.count*S,I=1;_>e.maxTextureSize&&(I=Math.ceil(_/e.maxTextureSize),_=e.maxTextureSize);let T=new Float32Array(_*I*4*u),A=new fo(T,_,I,u);A.type=Un,A.needsUpdate=!0;let C=S*4;for(let x=0;x<u;x++){let R=p[x],L=d[x],O=w[x],B=_*I*4*x;for(let G=0;G<R.count;G++){let z=G*C;m===!0&&(s.fromBufferAttribute(R,G),T[B+z+0]=s.x,T[B+z+1]=s.y,T[B+z+2]=s.z,T[B+z+3]=0),g===!0&&(s.fromBufferAttribute(L,G),T[B+z+4]=s.x,T[B+z+5]=s.y,T[B+z+6]=s.z,T[B+z+7]=0),v===!0&&(s.fromBufferAttribute(O,G),T[B+z+8]=s.x,T[B+z+9]=s.y,T[B+z+10]=s.z,T[B+z+11]=O.itemSize===4?s.w:1)}}f={count:u,texture:A,size:new Oe(_,I)},n.set(a,f),a.addEventListener("dispose",b)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,t);else{let m=0;for(let v=0;v<h.length;v++)m+=h[v];let g=a.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",h)}l.getUniforms().setValue(i,"morphTargetsTexture",f.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:r}}function v0(i,e,t,n){let s=new WeakMap;function r(l){let h=n.render.frame,c=l.geometry,u=e.get(l,c);if(s.get(u)!==h&&(e.update(u),s.set(u,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==h&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,h))),l.isSkinnedMesh){let f=l.skeleton;s.get(f)!==h&&(f.update(),s.set(f,h))}return u}function o(){s=new WeakMap}function a(l){let h=l.target;h.removeEventListener("dispose",a),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:r,dispose:o}}var vo=class extends Kt{constructor(e,t,n,s,r,o,a,l,h,c=hs){if(c!==hs&&c!==xs)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&c===hs&&(n=Di),n===void 0&&c===xs&&(n=gs),super(null,s,r,o,a,l,c,n,h),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=a!==void 0?a:Zt,this.minFilter=l!==void 0?l:Zt,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},qu=new Kt,au=new vo(1,1),Yu=new fo,$u=new Bl,Zu=new xo,lu=[],cu=[],hu=new Float32Array(16),uu=new Float32Array(9),du=new Float32Array(4);function Ss(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=lu[s];if(r===void 0&&(r=new Float32Array(s),lu[s]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,i[o].toArray(r,a)}return r}function gt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function xt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function Oo(i,e){let t=cu[e];t===void 0&&(t=new Int32Array(e),cu[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function M0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function b0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(gt(t,e))return;i.uniform2fv(this.addr,e),xt(t,e)}}function S0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(gt(t,e))return;i.uniform3fv(this.addr,e),xt(t,e)}}function w0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(gt(t,e))return;i.uniform4fv(this.addr,e),xt(t,e)}}function E0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(gt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),xt(t,e)}else{if(gt(t,n))return;du.set(n),i.uniformMatrix2fv(this.addr,!1,du),xt(t,n)}}function T0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(gt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),xt(t,e)}else{if(gt(t,n))return;uu.set(n),i.uniformMatrix3fv(this.addr,!1,uu),xt(t,n)}}function A0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(gt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),xt(t,e)}else{if(gt(t,n))return;hu.set(n),i.uniformMatrix4fv(this.addr,!1,hu),xt(t,n)}}function C0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function R0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(gt(t,e))return;i.uniform2iv(this.addr,e),xt(t,e)}}function I0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(gt(t,e))return;i.uniform3iv(this.addr,e),xt(t,e)}}function P0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(gt(t,e))return;i.uniform4iv(this.addr,e),xt(t,e)}}function L0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function U0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(gt(t,e))return;i.uniform2uiv(this.addr,e),xt(t,e)}}function D0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(gt(t,e))return;i.uniform3uiv(this.addr,e),xt(t,e)}}function N0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(gt(t,e))return;i.uniform4uiv(this.addr,e),xt(t,e)}}function F0(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(au.compareFunction=Vu,r=au):r=qu,t.setTexture2D(e||r,s)}function O0(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||$u,s)}function B0(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||Zu,s)}function k0(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Yu,s)}function z0(i){switch(i){case 5126:return M0;case 35664:return b0;case 35665:return S0;case 35666:return w0;case 35674:return E0;case 35675:return T0;case 35676:return A0;case 5124:case 35670:return C0;case 35667:case 35671:return R0;case 35668:case 35672:return I0;case 35669:case 35673:return P0;case 5125:return L0;case 36294:return U0;case 36295:return D0;case 36296:return N0;case 35678:case 36198:case 36298:case 36306:case 35682:return F0;case 35679:case 36299:case 36307:return O0;case 35680:case 36300:case 36308:case 36293:return B0;case 36289:case 36303:case 36311:case 36292:return k0}}function V0(i,e){i.uniform1fv(this.addr,e)}function H0(i,e){let t=Ss(e,this.size,2);i.uniform2fv(this.addr,t)}function G0(i,e){let t=Ss(e,this.size,3);i.uniform3fv(this.addr,t)}function W0(i,e){let t=Ss(e,this.size,4);i.uniform4fv(this.addr,t)}function X0(i,e){let t=Ss(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function q0(i,e){let t=Ss(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Y0(i,e){let t=Ss(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function $0(i,e){i.uniform1iv(this.addr,e)}function Z0(i,e){i.uniform2iv(this.addr,e)}function J0(i,e){i.uniform3iv(this.addr,e)}function K0(i,e){i.uniform4iv(this.addr,e)}function Q0(i,e){i.uniform1uiv(this.addr,e)}function j0(i,e){i.uniform2uiv(this.addr,e)}function ex(i,e){i.uniform3uiv(this.addr,e)}function tx(i,e){i.uniform4uiv(this.addr,e)}function nx(i,e,t){let n=this.cache,s=e.length,r=Oo(t,s);gt(n,r)||(i.uniform1iv(this.addr,r),xt(n,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||qu,r[o])}function ix(i,e,t){let n=this.cache,s=e.length,r=Oo(t,s);gt(n,r)||(i.uniform1iv(this.addr,r),xt(n,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||$u,r[o])}function sx(i,e,t){let n=this.cache,s=e.length,r=Oo(t,s);gt(n,r)||(i.uniform1iv(this.addr,r),xt(n,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||Zu,r[o])}function rx(i,e,t){let n=this.cache,s=e.length,r=Oo(t,s);gt(n,r)||(i.uniform1iv(this.addr,r),xt(n,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||Yu,r[o])}function ox(i){switch(i){case 5126:return V0;case 35664:return H0;case 35665:return G0;case 35666:return W0;case 35674:return X0;case 35675:return q0;case 35676:return Y0;case 5124:case 35670:return $0;case 35667:case 35671:return Z0;case 35668:case 35672:return J0;case 35669:case 35673:return K0;case 5125:return Q0;case 36294:return j0;case 36295:return ex;case 36296:return tx;case 35678:case 36198:case 36298:case 36306:case 35682:return nx;case 35679:case 36299:case 36307:return ix;case 35680:case 36300:case 36308:case 36293:return sx;case 36289:case 36303:case 36311:case 36292:return rx}}var Hl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=z0(t.type)}},Gl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=ox(t.type)}},Wl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],n)}}},qa=/(\w+)(\])?(\[|\.)?/g;function fu(i,e){i.seq.push(e),i.map[e.id]=e}function ax(i,e,t){let n=i.name,s=n.length;for(qa.lastIndex=0;;){let r=qa.exec(n),o=qa.lastIndex,a=r[1],l=r[2]==="]",h=r[3];if(l&&(a=a|0),h===void 0||h==="["&&o+2===s){fu(t,h===void 0?new Hl(a,i,e):new Gl(a,i,e));break}else{let u=t.map[a];u===void 0&&(u=new Wl(a),fu(t,u)),t=u}}}var ds=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);ax(r,o,this)}}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&n.push(o)}return n}};function pu(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var lx=37297,cx=0;function hx(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}var mu=new Re;function ux(i){Ge._getMatrix(mu,Ge.workingColorSpace,i);let e=`mat3( ${mu.elements.map(t=>t.toFixed(4))} )`;switch(Ge.getTransfer(i)){case Fo:return[e,"LinearTransferOETF"];case je:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function gu(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),s=i.getShaderInfoLog(e).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+hx(i.getShaderSource(e),o)}else return s}function dx(i,e){let t=ux(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function fx(i,e){let t;switch(e){case kf:t="Linear";break;case zf:t="Reinhard";break;case Vf:t="Cineon";break;case Hf:t="ACESFilmic";break;case Wf:t="AgX";break;case fc:t="Neutral";break;case Gf:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var jr=new P;function px(){Ge.getLuminanceCoefficients(jr);let i=jr.x.toFixed(4),e=jr.y.toFixed(4),t=jr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function mx(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Js).join(`
`)}function gx(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function xx(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:i.getAttribLocation(e,o),locationSize:a}}return t}function Js(i){return i!==""}function xu(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function _u(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var _x=/^[ \t]*#include +<([\w\d./]+)>/gm;function Xl(i){return i.replace(_x,vx)}var yx=new Map;function vx(i,e){let t=Ne[e];if(t===void 0){let n=yx.get(e);if(n!==void 0)t=Ne[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return Xl(t)}var Mx=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function yu(i){return i.replace(Mx,bx)}function bx(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function vu(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Sx(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Iu?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===dc?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Wn&&(e="SHADOWMAP_TYPE_VSM"),e}function wx(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case ps:case ms:e="ENVMAP_TYPE_CUBE";break;case No:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Ex(i){let e="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===ms&&(e="ENVMAP_MODE_REFRACTION"),e}function Tx(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Do:e="ENVMAP_BLENDING_MULTIPLY";break;case Of:e="ENVMAP_BLENDING_MIX";break;case Bf:e="ENVMAP_BLENDING_ADD";break}return e}function Ax(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Cx(i,e,t,n){let s=i.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,l=Sx(t),h=wx(t),c=Ex(t),u=Tx(t),f=Ax(t),m=mx(t),g=gx(r),v=s.createProgram(),p,d,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Js).join(`
`),p.length>0&&(p+=`
`),d=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Js).join(`
`),d.length>0&&(d+=`
`)):(p=[vu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Js).join(`
`),d=[vu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==hi?"#define TONE_MAPPING":"",t.toneMapping!==hi?Ne.tonemapping_pars_fragment:"",t.toneMapping!==hi?fx("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ne.colorspace_pars_fragment,dx("linearToOutputTexel",t.outputColorSpace),px(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Js).join(`
`)),o=Xl(o),o=xu(o,t),o=_u(o,t),a=Xl(a),a=xu(a,t),a=_u(a,t),o=yu(o),a=yu(a),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,d=["#define varying in",t.glslVersion===Dh?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Dh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+d);let S=w+p+o,_=w+d+a,I=pu(s,s.VERTEX_SHADER,S),T=pu(s,s.FRAGMENT_SHADER,_);s.attachShader(v,I),s.attachShader(v,T),t.index0AttributeName!==void 0?s.bindAttribLocation(v,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function A(R){if(i.debug.checkShaderErrors){let L=s.getProgramInfoLog(v).trim(),O=s.getShaderInfoLog(I).trim(),B=s.getShaderInfoLog(T).trim(),G=!0,z=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if(G=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,v,I,T);else{let K=gu(s,I,"vertex"),W=gu(s,T,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+L+`
`+K+`
`+W)}else L!==""?console.warn("THREE.WebGLProgram: Program Info Log:",L):(O===""||B==="")&&(z=!1);z&&(R.diagnostics={runnable:G,programLog:L,vertexShader:{log:O,prefix:p},fragmentShader:{log:B,prefix:d}})}s.deleteShader(I),s.deleteShader(T),C=new ds(s,v),b=xx(s,v)}let C;this.getUniforms=function(){return C===void 0&&A(this),C};let b;this.getAttributes=function(){return b===void 0&&A(this),b};let x=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=s.getProgramParameter(v,lx)),x},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=cx++,this.cacheKey=e,this.usedTimes=1,this.program=v,this.vertexShader=I,this.fragmentShader=T,this}var Rx=0,ql=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Yl(e),t.set(e,n)),n}},Yl=class{constructor(e){this.id=Rx++,this.code=e,this.usedTimes=0}};function Ix(i,e,t,n,s,r,o){let a=new po,l=new ql,h=new Set,c=[],u=s.logarithmicDepthBuffer,f=s.vertexTextures,m=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(b){return h.add(b),b===0?"uv":`uv${b}`}function p(b,x,R,L,O){let B=L.fog,G=O.geometry,z=b.isMeshStandardMaterial?L.environment:null,K=(b.isMeshStandardMaterial?t:e).get(b.envMap||z),W=K&&K.mapping===No?K.image.height:null,j=g[b.type];b.precision!==null&&(m=s.getMaxPrecision(b.precision),m!==b.precision&&console.warn("THREE.WebGLProgram.getParameters:",b.precision,"not supported, using",m,"instead."));let ie=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,pe=ie!==void 0?ie.length:0,Ue=0;G.morphAttributes.position!==void 0&&(Ue=1),G.morphAttributes.normal!==void 0&&(Ue=2),G.morphAttributes.color!==void 0&&(Ue=3);let $e,Y,ne,_e;if(j){let Qe=Pn[j];$e=Qe.vertexShader,Y=Qe.fragmentShader}else $e=b.vertexShader,Y=b.fragmentShader,l.update(b),ne=l.getVertexShaderID(b),_e=l.getFragmentShaderID(b);let oe=i.getRenderTarget(),Te=i.state.buffers.depth.getReversed(),Ie=O.isInstancedMesh===!0,Fe=O.isBatchedMesh===!0,ct=!!b.map,Ve=!!b.matcap,dt=!!K,F=!!b.aoMap,nn=!!b.lightMap,Be=!!b.bumpMap,ke=!!b.normalMap,Se=!!b.displacementMap,st=!!b.emissiveMap,be=!!b.metalnessMap,E=!!b.roughnessMap,y=b.anisotropy>0,k=b.clearcoat>0,Z=b.dispersion>0,Q=b.iridescence>0,q=b.sheen>0,ye=b.transmission>0,ae=y&&!!b.anisotropyMap,ue=k&&!!b.clearcoatMap,He=k&&!!b.clearcoatNormalMap,ee=k&&!!b.clearcoatRoughnessMap,de=Q&&!!b.iridescenceMap,we=Q&&!!b.iridescenceThicknessMap,Ae=q&&!!b.sheenColorMap,fe=q&&!!b.sheenRoughnessMap,ze=!!b.specularMap,De=!!b.specularColorMap,tt=!!b.specularIntensityMap,U=ye&&!!b.transmissionMap,re=ye&&!!b.thicknessMap,X=!!b.gradientMap,J=!!b.alphaMap,he=b.alphaTest>0,le=!!b.alphaHash,Pe=!!b.extensions,ht=hi;b.toneMapped&&(oe===null||oe.isXRRenderTarget===!0)&&(ht=i.toneMapping);let Tt={shaderID:j,shaderType:b.type,shaderName:b.name,vertexShader:$e,fragmentShader:Y,defines:b.defines,customVertexShaderID:ne,customFragmentShaderID:_e,isRawShaderMaterial:b.isRawShaderMaterial===!0,glslVersion:b.glslVersion,precision:m,batching:Fe,batchingColor:Fe&&O._colorsTexture!==null,instancing:Ie,instancingColor:Ie&&O.instanceColor!==null,instancingMorph:Ie&&O.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:oe===null?i.outputColorSpace:oe.isXRRenderTarget===!0?oe.texture.colorSpace:bs,alphaToCoverage:!!b.alphaToCoverage,map:ct,matcap:Ve,envMap:dt,envMapMode:dt&&K.mapping,envMapCubeUVHeight:W,aoMap:F,lightMap:nn,bumpMap:Be,normalMap:ke,displacementMap:f&&Se,emissiveMap:st,normalMapObjectSpace:ke&&b.normalMapType===$f,normalMapTangentSpace:ke&&b.normalMapType===Mc,metalnessMap:be,roughnessMap:E,anisotropy:y,anisotropyMap:ae,clearcoat:k,clearcoatMap:ue,clearcoatNormalMap:He,clearcoatRoughnessMap:ee,dispersion:Z,iridescence:Q,iridescenceMap:de,iridescenceThicknessMap:we,sheen:q,sheenColorMap:Ae,sheenRoughnessMap:fe,specularMap:ze,specularColorMap:De,specularIntensityMap:tt,transmission:ye,transmissionMap:U,thicknessMap:re,gradientMap:X,opaque:b.transparent===!1&&b.blending===cs&&b.alphaToCoverage===!1,alphaMap:J,alphaTest:he,alphaHash:le,combine:b.combine,mapUv:ct&&v(b.map.channel),aoMapUv:F&&v(b.aoMap.channel),lightMapUv:nn&&v(b.lightMap.channel),bumpMapUv:Be&&v(b.bumpMap.channel),normalMapUv:ke&&v(b.normalMap.channel),displacementMapUv:Se&&v(b.displacementMap.channel),emissiveMapUv:st&&v(b.emissiveMap.channel),metalnessMapUv:be&&v(b.metalnessMap.channel),roughnessMapUv:E&&v(b.roughnessMap.channel),anisotropyMapUv:ae&&v(b.anisotropyMap.channel),clearcoatMapUv:ue&&v(b.clearcoatMap.channel),clearcoatNormalMapUv:He&&v(b.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ee&&v(b.clearcoatRoughnessMap.channel),iridescenceMapUv:de&&v(b.iridescenceMap.channel),iridescenceThicknessMapUv:we&&v(b.iridescenceThicknessMap.channel),sheenColorMapUv:Ae&&v(b.sheenColorMap.channel),sheenRoughnessMapUv:fe&&v(b.sheenRoughnessMap.channel),specularMapUv:ze&&v(b.specularMap.channel),specularColorMapUv:De&&v(b.specularColorMap.channel),specularIntensityMapUv:tt&&v(b.specularIntensityMap.channel),transmissionMapUv:U&&v(b.transmissionMap.channel),thicknessMapUv:re&&v(b.thicknessMap.channel),alphaMapUv:J&&v(b.alphaMap.channel),vertexTangents:!!G.attributes.tangent&&(ke||y),vertexColors:b.vertexColors,vertexAlphas:b.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!G.attributes.uv&&(ct||J),fog:!!B,useFog:b.fog===!0,fogExp2:!!B&&B.isFogExp2,flatShading:b.flatShading===!0,sizeAttenuation:b.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:Te,skinning:O.isSkinnedMesh===!0,morphTargets:G.morphAttributes.position!==void 0,morphNormals:G.morphAttributes.normal!==void 0,morphColors:G.morphAttributes.color!==void 0,morphTargetsCount:pe,morphTextureStride:Ue,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:b.dithering,shadowMapEnabled:i.shadowMap.enabled&&R.length>0,shadowMapType:i.shadowMap.type,toneMapping:ht,decodeVideoTexture:ct&&b.map.isVideoTexture===!0&&Ge.getTransfer(b.map.colorSpace)===je,decodeVideoTextureEmissive:st&&b.emissiveMap.isVideoTexture===!0&&Ge.getTransfer(b.emissiveMap.colorSpace)===je,premultipliedAlpha:b.premultipliedAlpha,doubleSided:b.side===mn,flipSided:b.side===Gt,useDepthPacking:b.depthPacking>=0,depthPacking:b.depthPacking||0,index0AttributeName:b.index0AttributeName,extensionClipCullDistance:Pe&&b.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Pe&&b.extensions.multiDraw===!0||Fe)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:b.customProgramCacheKey()};return Tt.vertexUv1s=h.has(1),Tt.vertexUv2s=h.has(2),Tt.vertexUv3s=h.has(3),h.clear(),Tt}function d(b){let x=[];if(b.shaderID?x.push(b.shaderID):(x.push(b.customVertexShaderID),x.push(b.customFragmentShaderID)),b.defines!==void 0)for(let R in b.defines)x.push(R),x.push(b.defines[R]);return b.isRawShaderMaterial===!1&&(w(x,b),S(x,b),x.push(i.outputColorSpace)),x.push(b.customProgramCacheKey),x.join()}function w(b,x){b.push(x.precision),b.push(x.outputColorSpace),b.push(x.envMapMode),b.push(x.envMapCubeUVHeight),b.push(x.mapUv),b.push(x.alphaMapUv),b.push(x.lightMapUv),b.push(x.aoMapUv),b.push(x.bumpMapUv),b.push(x.normalMapUv),b.push(x.displacementMapUv),b.push(x.emissiveMapUv),b.push(x.metalnessMapUv),b.push(x.roughnessMapUv),b.push(x.anisotropyMapUv),b.push(x.clearcoatMapUv),b.push(x.clearcoatNormalMapUv),b.push(x.clearcoatRoughnessMapUv),b.push(x.iridescenceMapUv),b.push(x.iridescenceThicknessMapUv),b.push(x.sheenColorMapUv),b.push(x.sheenRoughnessMapUv),b.push(x.specularMapUv),b.push(x.specularColorMapUv),b.push(x.specularIntensityMapUv),b.push(x.transmissionMapUv),b.push(x.thicknessMapUv),b.push(x.combine),b.push(x.fogExp2),b.push(x.sizeAttenuation),b.push(x.morphTargetsCount),b.push(x.morphAttributeCount),b.push(x.numDirLights),b.push(x.numPointLights),b.push(x.numSpotLights),b.push(x.numSpotLightMaps),b.push(x.numHemiLights),b.push(x.numRectAreaLights),b.push(x.numDirLightShadows),b.push(x.numPointLightShadows),b.push(x.numSpotLightShadows),b.push(x.numSpotLightShadowsWithMaps),b.push(x.numLightProbes),b.push(x.shadowMapType),b.push(x.toneMapping),b.push(x.numClippingPlanes),b.push(x.numClipIntersection),b.push(x.depthPacking)}function S(b,x){a.disableAll(),x.supportsVertexTextures&&a.enable(0),x.instancing&&a.enable(1),x.instancingColor&&a.enable(2),x.instancingMorph&&a.enable(3),x.matcap&&a.enable(4),x.envMap&&a.enable(5),x.normalMapObjectSpace&&a.enable(6),x.normalMapTangentSpace&&a.enable(7),x.clearcoat&&a.enable(8),x.iridescence&&a.enable(9),x.alphaTest&&a.enable(10),x.vertexColors&&a.enable(11),x.vertexAlphas&&a.enable(12),x.vertexUv1s&&a.enable(13),x.vertexUv2s&&a.enable(14),x.vertexUv3s&&a.enable(15),x.vertexTangents&&a.enable(16),x.anisotropy&&a.enable(17),x.alphaHash&&a.enable(18),x.batching&&a.enable(19),x.dispersion&&a.enable(20),x.batchingColor&&a.enable(21),b.push(a.mask),a.disableAll(),x.fog&&a.enable(0),x.useFog&&a.enable(1),x.flatShading&&a.enable(2),x.logarithmicDepthBuffer&&a.enable(3),x.reverseDepthBuffer&&a.enable(4),x.skinning&&a.enable(5),x.morphTargets&&a.enable(6),x.morphNormals&&a.enable(7),x.morphColors&&a.enable(8),x.premultipliedAlpha&&a.enable(9),x.shadowMapEnabled&&a.enable(10),x.doubleSided&&a.enable(11),x.flipSided&&a.enable(12),x.useDepthPacking&&a.enable(13),x.dithering&&a.enable(14),x.transmission&&a.enable(15),x.sheen&&a.enable(16),x.opaque&&a.enable(17),x.pointsUvs&&a.enable(18),x.decodeVideoTexture&&a.enable(19),x.decodeVideoTextureEmissive&&a.enable(20),x.alphaToCoverage&&a.enable(21),b.push(a.mask)}function _(b){let x=g[b.type],R;if(x){let L=Pn[x];R=vp.clone(L.uniforms)}else R=b.uniforms;return R}function I(b,x){let R;for(let L=0,O=c.length;L<O;L++){let B=c[L];if(B.cacheKey===x){R=B,++R.usedTimes;break}}return R===void 0&&(R=new Cx(i,x,b,r),c.push(R)),R}function T(b){if(--b.usedTimes===0){let x=c.indexOf(b);c[x]=c[c.length-1],c.pop(),b.destroy()}}function A(b){l.remove(b)}function C(){l.dispose()}return{getParameters:p,getProgramCacheKey:d,getUniforms:_,acquireProgram:I,releaseProgram:T,releaseShaderCache:A,programs:c,dispose:C}}function Px(){let i=new WeakMap;function e(o){return i.has(o)}function t(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function Lx(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function Mu(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function bu(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function o(u,f,m,g,v,p){let d=i[e];return d===void 0?(d={id:u.id,object:u,geometry:f,material:m,groupOrder:g,renderOrder:u.renderOrder,z:v,group:p},i[e]=d):(d.id=u.id,d.object=u,d.geometry=f,d.material=m,d.groupOrder=g,d.renderOrder=u.renderOrder,d.z=v,d.group=p),e++,d}function a(u,f,m,g,v,p){let d=o(u,f,m,g,v,p);m.transmission>0?n.push(d):m.transparent===!0?s.push(d):t.push(d)}function l(u,f,m,g,v,p){let d=o(u,f,m,g,v,p);m.transmission>0?n.unshift(d):m.transparent===!0?s.unshift(d):t.unshift(d)}function h(u,f){t.length>1&&t.sort(u||Lx),n.length>1&&n.sort(f||Mu),s.length>1&&s.sort(f||Mu)}function c(){for(let u=e,f=i.length;u<f;u++){let m=i[u];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:c,sort:h}}function Ux(){let i=new WeakMap;function e(n,s){let r=i.get(n),o;return r===void 0?(o=new bu,i.set(n,[o])):s>=r.length?(o=new bu,r.push(o)):o=r[s],o}function t(){i=new WeakMap}return{get:e,dispose:t}}function Dx(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new P,color:new Me};break;case"SpotLight":t={position:new P,direction:new P,color:new Me,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new P,color:new Me,distance:0,decay:0};break;case"HemisphereLight":t={direction:new P,skyColor:new Me,groundColor:new Me};break;case"RectAreaLight":t={color:new Me,position:new P,halfWidth:new P,halfHeight:new P};break}return i[e.id]=t,t}}}function Nx(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var Fx=0;function Ox(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function Bx(i){let e=new Dx,t=Nx(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)n.probe.push(new P);let s=new P,r=new We,o=new We;function a(h){let c=0,u=0,f=0;for(let b=0;b<9;b++)n.probe[b].set(0,0,0);let m=0,g=0,v=0,p=0,d=0,w=0,S=0,_=0,I=0,T=0,A=0;h.sort(Ox);for(let b=0,x=h.length;b<x;b++){let R=h[b],L=R.color,O=R.intensity,B=R.distance,G=R.shadow&&R.shadow.map?R.shadow.map.texture:null;if(R.isAmbientLight)c+=L.r*O,u+=L.g*O,f+=L.b*O;else if(R.isLightProbe){for(let z=0;z<9;z++)n.probe[z].addScaledVector(R.sh.coefficients[z],O);A++}else if(R.isDirectionalLight){let z=e.get(R);if(z.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){let K=R.shadow,W=t.get(R);W.shadowIntensity=K.intensity,W.shadowBias=K.bias,W.shadowNormalBias=K.normalBias,W.shadowRadius=K.radius,W.shadowMapSize=K.mapSize,n.directionalShadow[m]=W,n.directionalShadowMap[m]=G,n.directionalShadowMatrix[m]=R.shadow.matrix,w++}n.directional[m]=z,m++}else if(R.isSpotLight){let z=e.get(R);z.position.setFromMatrixPosition(R.matrixWorld),z.color.copy(L).multiplyScalar(O),z.distance=B,z.coneCos=Math.cos(R.angle),z.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),z.decay=R.decay,n.spot[v]=z;let K=R.shadow;if(R.map&&(n.spotLightMap[I]=R.map,I++,K.updateMatrices(R),R.castShadow&&T++),n.spotLightMatrix[v]=K.matrix,R.castShadow){let W=t.get(R);W.shadowIntensity=K.intensity,W.shadowBias=K.bias,W.shadowNormalBias=K.normalBias,W.shadowRadius=K.radius,W.shadowMapSize=K.mapSize,n.spotShadow[v]=W,n.spotShadowMap[v]=G,_++}v++}else if(R.isRectAreaLight){let z=e.get(R);z.color.copy(L).multiplyScalar(O),z.halfWidth.set(R.width*.5,0,0),z.halfHeight.set(0,R.height*.5,0),n.rectArea[p]=z,p++}else if(R.isPointLight){let z=e.get(R);if(z.color.copy(R.color).multiplyScalar(R.intensity),z.distance=R.distance,z.decay=R.decay,R.castShadow){let K=R.shadow,W=t.get(R);W.shadowIntensity=K.intensity,W.shadowBias=K.bias,W.shadowNormalBias=K.normalBias,W.shadowRadius=K.radius,W.shadowMapSize=K.mapSize,W.shadowCameraNear=K.camera.near,W.shadowCameraFar=K.camera.far,n.pointShadow[g]=W,n.pointShadowMap[g]=G,n.pointShadowMatrix[g]=R.shadow.matrix,S++}n.point[g]=z,g++}else if(R.isHemisphereLight){let z=e.get(R);z.skyColor.copy(R.color).multiplyScalar(O),z.groundColor.copy(R.groundColor).multiplyScalar(O),n.hemi[d]=z,d++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=se.LTC_FLOAT_1,n.rectAreaLTC2=se.LTC_FLOAT_2):(n.rectAreaLTC1=se.LTC_HALF_1,n.rectAreaLTC2=se.LTC_HALF_2)),n.ambient[0]=c,n.ambient[1]=u,n.ambient[2]=f;let C=n.hash;(C.directionalLength!==m||C.pointLength!==g||C.spotLength!==v||C.rectAreaLength!==p||C.hemiLength!==d||C.numDirectionalShadows!==w||C.numPointShadows!==S||C.numSpotShadows!==_||C.numSpotMaps!==I||C.numLightProbes!==A)&&(n.directional.length=m,n.spot.length=v,n.rectArea.length=p,n.point.length=g,n.hemi.length=d,n.directionalShadow.length=w,n.directionalShadowMap.length=w,n.pointShadow.length=S,n.pointShadowMap.length=S,n.spotShadow.length=_,n.spotShadowMap.length=_,n.directionalShadowMatrix.length=w,n.pointShadowMatrix.length=S,n.spotLightMatrix.length=_+I-T,n.spotLightMap.length=I,n.numSpotLightShadowsWithMaps=T,n.numLightProbes=A,C.directionalLength=m,C.pointLength=g,C.spotLength=v,C.rectAreaLength=p,C.hemiLength=d,C.numDirectionalShadows=w,C.numPointShadows=S,C.numSpotShadows=_,C.numSpotMaps=I,C.numLightProbes=A,n.version=Fx++)}function l(h,c){let u=0,f=0,m=0,g=0,v=0,p=c.matrixWorldInverse;for(let d=0,w=h.length;d<w;d++){let S=h[d];if(S.isDirectionalLight){let _=n.directional[u];_.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),_.direction.sub(s),_.direction.transformDirection(p),u++}else if(S.isSpotLight){let _=n.spot[m];_.position.setFromMatrixPosition(S.matrixWorld),_.position.applyMatrix4(p),_.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),_.direction.sub(s),_.direction.transformDirection(p),m++}else if(S.isRectAreaLight){let _=n.rectArea[g];_.position.setFromMatrixPosition(S.matrixWorld),_.position.applyMatrix4(p),o.identity(),r.copy(S.matrixWorld),r.premultiply(p),o.extractRotation(r),_.halfWidth.set(S.width*.5,0,0),_.halfHeight.set(0,S.height*.5,0),_.halfWidth.applyMatrix4(o),_.halfHeight.applyMatrix4(o),g++}else if(S.isPointLight){let _=n.point[f];_.position.setFromMatrixPosition(S.matrixWorld),_.position.applyMatrix4(p),f++}else if(S.isHemisphereLight){let _=n.hemi[v];_.direction.setFromMatrixPosition(S.matrixWorld),_.direction.transformDirection(p),v++}}}return{setup:a,setupView:l,state:n}}function Su(i){let e=new Bx(i),t=[],n=[];function s(c){h.camera=c,t.length=0,n.length=0}function r(c){t.push(c)}function o(c){n.push(c)}function a(){e.setup(t)}function l(c){e.setupView(t,c)}let h={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:h,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function kx(i){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new Su(i),e.set(s,[a])):r>=o.length?(a=new Su(i),o.push(a)):a=o[r],a}function n(){e=new WeakMap}return{get:t,dispose:n}}var $l=class extends fi{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=qf,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Zl=class extends fi{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},zx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Vx=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Hx(i,e,t){let n=new er,s=new Oe,r=new Oe,o=new et,a=new $l({depthPacking:Yf}),l=new Zl,h={},c=t.maxTextureSize,u={[ui]:Gt,[Gt]:ui,[mn]:mn},f=new Dn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Oe},radius:{value:4}},vertexShader:zx,fragmentShader:Vx}),m=f.clone();m.defines.HORIZONTAL_PASS=1;let g=new Nt;g.setAttribute("position",new Jt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let v=new ft(g,f),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Iu;let d=this.type;this.render=function(T,A,C){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||T.length===0)return;let b=i.getRenderTarget(),x=i.getActiveCubeFace(),R=i.getActiveMipmapLevel(),L=i.state;L.setBlending(ci),L.buffers.color.setClear(1,1,1,1),L.buffers.depth.setTest(!0),L.setScissorTest(!1);let O=d!==Wn&&this.type===Wn,B=d===Wn&&this.type!==Wn;for(let G=0,z=T.length;G<z;G++){let K=T[G],W=K.shadow;if(W===void 0){console.warn("THREE.WebGLShadowMap:",K,"has no shadow.");continue}if(W.autoUpdate===!1&&W.needsUpdate===!1)continue;s.copy(W.mapSize);let j=W.getFrameExtents();if(s.multiply(j),r.copy(W.mapSize),(s.x>c||s.y>c)&&(s.x>c&&(r.x=Math.floor(c/j.x),s.x=r.x*j.x,W.mapSize.x=r.x),s.y>c&&(r.y=Math.floor(c/j.y),s.y=r.y*j.y,W.mapSize.y=r.y)),W.map===null||O===!0||B===!0){let pe=this.type!==Wn?{minFilter:Zt,magFilter:Zt}:{};W.map!==null&&W.map.dispose(),W.map=new Zn(s.x,s.y,pe),W.map.texture.name=K.name+".shadowMap",W.camera.updateProjectionMatrix()}i.setRenderTarget(W.map),i.clear();let ie=W.getViewportCount();for(let pe=0;pe<ie;pe++){let Ue=W.getViewport(pe);o.set(r.x*Ue.x,r.y*Ue.y,r.x*Ue.z,r.y*Ue.w),L.viewport(o),W.updateMatrices(K,pe),n=W.getFrustum(),_(A,C,W.camera,K,this.type)}W.isPointLightShadow!==!0&&this.type===Wn&&w(W,C),W.needsUpdate=!1}d=this.type,p.needsUpdate=!1,i.setRenderTarget(b,x,R)};function w(T,A){let C=e.update(v);f.defines.VSM_SAMPLES!==T.blurSamples&&(f.defines.VSM_SAMPLES=T.blurSamples,m.defines.VSM_SAMPLES=T.blurSamples,f.needsUpdate=!0,m.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new Zn(s.x,s.y)),f.uniforms.shadow_pass.value=T.map.texture,f.uniforms.resolution.value=T.mapSize,f.uniforms.radius.value=T.radius,i.setRenderTarget(T.mapPass),i.clear(),i.renderBufferDirect(A,null,C,f,v,null),m.uniforms.shadow_pass.value=T.mapPass.texture,m.uniforms.resolution.value=T.mapSize,m.uniforms.radius.value=T.radius,i.setRenderTarget(T.map),i.clear(),i.renderBufferDirect(A,null,C,m,v,null)}function S(T,A,C,b){let x=null,R=C.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(R!==void 0)x=R;else if(x=C.isPointLight===!0?l:a,i.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){let L=x.uuid,O=A.uuid,B=h[L];B===void 0&&(B={},h[L]=B);let G=B[O];G===void 0&&(G=x.clone(),B[O]=G,A.addEventListener("dispose",I)),x=G}if(x.visible=A.visible,x.wireframe=A.wireframe,b===Wn?x.side=A.shadowSide!==null?A.shadowSide:A.side:x.side=A.shadowSide!==null?A.shadowSide:u[A.side],x.alphaMap=A.alphaMap,x.alphaTest=A.alphaTest,x.map=A.map,x.clipShadows=A.clipShadows,x.clippingPlanes=A.clippingPlanes,x.clipIntersection=A.clipIntersection,x.displacementMap=A.displacementMap,x.displacementScale=A.displacementScale,x.displacementBias=A.displacementBias,x.wireframeLinewidth=A.wireframeLinewidth,x.linewidth=A.linewidth,C.isPointLight===!0&&x.isMeshDistanceMaterial===!0){let L=i.properties.get(x);L.light=C}return x}function _(T,A,C,b,x){if(T.visible===!1)return;if(T.layers.test(A.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&x===Wn)&&(!T.frustumCulled||n.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,T.matrixWorld);let O=e.update(T),B=T.material;if(Array.isArray(B)){let G=O.groups;for(let z=0,K=G.length;z<K;z++){let W=G[z],j=B[W.materialIndex];if(j&&j.visible){let ie=S(T,j,b,x);T.onBeforeShadow(i,T,A,C,O,ie,W),i.renderBufferDirect(C,null,O,ie,T,W),T.onAfterShadow(i,T,A,C,O,ie,W)}}}else if(B.visible){let G=S(T,B,b,x);T.onBeforeShadow(i,T,A,C,O,G,null),i.renderBufferDirect(C,null,O,G,T,null),T.onAfterShadow(i,T,A,C,O,G,null)}}let L=T.children;for(let O=0,B=L.length;O<B;O++)_(L[O],A,C,b,x)}function I(T){T.target.removeEventListener("dispose",I);for(let C in h){let b=h[C],x=T.target.uuid;x in b&&(b[x].dispose(),delete b[x])}}}var Gx={[Ka]:Qa,[ja]:nl,[el]:il,[fs]:tl,[Qa]:Ka,[nl]:ja,[il]:el,[tl]:fs};function Wx(i,e){function t(){let U=!1,re=new et,X=null,J=new et(0,0,0,0);return{setMask:function(he){X!==he&&!U&&(i.colorMask(he,he,he,he),X=he)},setLocked:function(he){U=he},setClear:function(he,le,Pe,ht,Tt){Tt===!0&&(he*=ht,le*=ht,Pe*=ht),re.set(he,le,Pe,ht),J.equals(re)===!1&&(i.clearColor(he,le,Pe,ht),J.copy(re))},reset:function(){U=!1,X=null,J.set(-1,0,0,0)}}}function n(){let U=!1,re=!1,X=null,J=null,he=null;return{setReversed:function(le){if(re!==le){let Pe=e.get("EXT_clip_control");re?Pe.clipControlEXT(Pe.LOWER_LEFT_EXT,Pe.ZERO_TO_ONE_EXT):Pe.clipControlEXT(Pe.LOWER_LEFT_EXT,Pe.NEGATIVE_ONE_TO_ONE_EXT);let ht=he;he=null,this.setClear(ht)}re=le},getReversed:function(){return re},setTest:function(le){le?oe(i.DEPTH_TEST):Te(i.DEPTH_TEST)},setMask:function(le){X!==le&&!U&&(i.depthMask(le),X=le)},setFunc:function(le){if(re&&(le=Gx[le]),J!==le){switch(le){case Ka:i.depthFunc(i.NEVER);break;case Qa:i.depthFunc(i.ALWAYS);break;case ja:i.depthFunc(i.LESS);break;case fs:i.depthFunc(i.LEQUAL);break;case el:i.depthFunc(i.EQUAL);break;case tl:i.depthFunc(i.GEQUAL);break;case nl:i.depthFunc(i.GREATER);break;case il:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}J=le}},setLocked:function(le){U=le},setClear:function(le){he!==le&&(re&&(le=1-le),i.clearDepth(le),he=le)},reset:function(){U=!1,X=null,J=null,he=null,re=!1}}}function s(){let U=!1,re=null,X=null,J=null,he=null,le=null,Pe=null,ht=null,Tt=null;return{setTest:function(Qe){U||(Qe?oe(i.STENCIL_TEST):Te(i.STENCIL_TEST))},setMask:function(Qe){re!==Qe&&!U&&(i.stencilMask(Qe),re=Qe)},setFunc:function(Qe,hn,On){(X!==Qe||J!==hn||he!==On)&&(i.stencilFunc(Qe,hn,On),X=Qe,J=hn,he=On)},setOp:function(Qe,hn,On){(le!==Qe||Pe!==hn||ht!==On)&&(i.stencilOp(Qe,hn,On),le=Qe,Pe=hn,ht=On)},setLocked:function(Qe){U=Qe},setClear:function(Qe){Tt!==Qe&&(i.clearStencil(Qe),Tt=Qe)},reset:function(){U=!1,re=null,X=null,J=null,he=null,le=null,Pe=null,ht=null,Tt=null}}}let r=new t,o=new n,a=new s,l=new WeakMap,h=new WeakMap,c={},u={},f=new WeakMap,m=[],g=null,v=!1,p=null,d=null,w=null,S=null,_=null,I=null,T=null,A=new Me(0,0,0),C=0,b=!1,x=null,R=null,L=null,O=null,B=null,G=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),z=!1,K=0,W=i.getParameter(i.VERSION);W.indexOf("WebGL")!==-1?(K=parseFloat(/^WebGL (\d)/.exec(W)[1]),z=K>=1):W.indexOf("OpenGL ES")!==-1&&(K=parseFloat(/^OpenGL ES (\d)/.exec(W)[1]),z=K>=2);let j=null,ie={},pe=i.getParameter(i.SCISSOR_BOX),Ue=i.getParameter(i.VIEWPORT),$e=new et().fromArray(pe),Y=new et().fromArray(Ue);function ne(U,re,X,J){let he=new Uint8Array(4),le=i.createTexture();i.bindTexture(U,le),i.texParameteri(U,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(U,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Pe=0;Pe<X;Pe++)U===i.TEXTURE_3D||U===i.TEXTURE_2D_ARRAY?i.texImage3D(re,0,i.RGBA,1,1,J,0,i.RGBA,i.UNSIGNED_BYTE,he):i.texImage2D(re+Pe,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,he);return le}let _e={};_e[i.TEXTURE_2D]=ne(i.TEXTURE_2D,i.TEXTURE_2D,1),_e[i.TEXTURE_CUBE_MAP]=ne(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),_e[i.TEXTURE_2D_ARRAY]=ne(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),_e[i.TEXTURE_3D]=ne(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),oe(i.DEPTH_TEST),o.setFunc(fs),Be(!1),ke(Th),oe(i.CULL_FACE),F(ci);function oe(U){c[U]!==!0&&(i.enable(U),c[U]=!0)}function Te(U){c[U]!==!1&&(i.disable(U),c[U]=!1)}function Ie(U,re){return u[U]!==re?(i.bindFramebuffer(U,re),u[U]=re,U===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=re),U===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=re),!0):!1}function Fe(U,re){let X=m,J=!1;if(U){X=f.get(re),X===void 0&&(X=[],f.set(re,X));let he=U.textures;if(X.length!==he.length||X[0]!==i.COLOR_ATTACHMENT0){for(let le=0,Pe=he.length;le<Pe;le++)X[le]=i.COLOR_ATTACHMENT0+le;X.length=he.length,J=!0}}else X[0]!==i.BACK&&(X[0]=i.BACK,J=!0);J&&i.drawBuffers(X)}function ct(U){return g!==U?(i.useProgram(U),g=U,!0):!1}let Ve={[Ri]:i.FUNC_ADD,[vf]:i.FUNC_SUBTRACT,[Mf]:i.FUNC_REVERSE_SUBTRACT};Ve[bf]=i.MIN,Ve[Sf]=i.MAX;let dt={[wf]:i.ZERO,[Ef]:i.ONE,[Tf]:i.SRC_COLOR,[Za]:i.SRC_ALPHA,[Lf]:i.SRC_ALPHA_SATURATE,[If]:i.DST_COLOR,[Cf]:i.DST_ALPHA,[Af]:i.ONE_MINUS_SRC_COLOR,[Ja]:i.ONE_MINUS_SRC_ALPHA,[Pf]:i.ONE_MINUS_DST_COLOR,[Rf]:i.ONE_MINUS_DST_ALPHA,[Uf]:i.CONSTANT_COLOR,[Df]:i.ONE_MINUS_CONSTANT_COLOR,[Nf]:i.CONSTANT_ALPHA,[Ff]:i.ONE_MINUS_CONSTANT_ALPHA};function F(U,re,X,J,he,le,Pe,ht,Tt,Qe){if(U===ci){v===!0&&(Te(i.BLEND),v=!1);return}if(v===!1&&(oe(i.BLEND),v=!0),U!==yf){if(U!==p||Qe!==b){if((d!==Ri||_!==Ri)&&(i.blendEquation(i.FUNC_ADD),d=Ri,_=Ri),Qe)switch(U){case cs:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case ao:i.blendFunc(i.ONE,i.ONE);break;case Ah:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Ch:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}else switch(U){case cs:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case ao:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Ah:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Ch:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}w=null,S=null,I=null,T=null,A.set(0,0,0),C=0,p=U,b=Qe}return}he=he||re,le=le||X,Pe=Pe||J,(re!==d||he!==_)&&(i.blendEquationSeparate(Ve[re],Ve[he]),d=re,_=he),(X!==w||J!==S||le!==I||Pe!==T)&&(i.blendFuncSeparate(dt[X],dt[J],dt[le],dt[Pe]),w=X,S=J,I=le,T=Pe),(ht.equals(A)===!1||Tt!==C)&&(i.blendColor(ht.r,ht.g,ht.b,Tt),A.copy(ht),C=Tt),p=U,b=!1}function nn(U,re){U.side===mn?Te(i.CULL_FACE):oe(i.CULL_FACE);let X=U.side===Gt;re&&(X=!X),Be(X),U.blending===cs&&U.transparent===!1?F(ci):F(U.blending,U.blendEquation,U.blendSrc,U.blendDst,U.blendEquationAlpha,U.blendSrcAlpha,U.blendDstAlpha,U.blendColor,U.blendAlpha,U.premultipliedAlpha),o.setFunc(U.depthFunc),o.setTest(U.depthTest),o.setMask(U.depthWrite),r.setMask(U.colorWrite);let J=U.stencilWrite;a.setTest(J),J&&(a.setMask(U.stencilWriteMask),a.setFunc(U.stencilFunc,U.stencilRef,U.stencilFuncMask),a.setOp(U.stencilFail,U.stencilZFail,U.stencilZPass)),st(U.polygonOffset,U.polygonOffsetFactor,U.polygonOffsetUnits),U.alphaToCoverage===!0?oe(i.SAMPLE_ALPHA_TO_COVERAGE):Te(i.SAMPLE_ALPHA_TO_COVERAGE)}function Be(U){x!==U&&(U?i.frontFace(i.CW):i.frontFace(i.CCW),x=U)}function ke(U){U!==xf?(oe(i.CULL_FACE),U!==R&&(U===Th?i.cullFace(i.BACK):U===_f?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Te(i.CULL_FACE),R=U}function Se(U){U!==L&&(z&&i.lineWidth(U),L=U)}function st(U,re,X){U?(oe(i.POLYGON_OFFSET_FILL),(O!==re||B!==X)&&(i.polygonOffset(re,X),O=re,B=X)):Te(i.POLYGON_OFFSET_FILL)}function be(U){U?oe(i.SCISSOR_TEST):Te(i.SCISSOR_TEST)}function E(U){U===void 0&&(U=i.TEXTURE0+G-1),j!==U&&(i.activeTexture(U),j=U)}function y(U,re,X){X===void 0&&(j===null?X=i.TEXTURE0+G-1:X=j);let J=ie[X];J===void 0&&(J={type:void 0,texture:void 0},ie[X]=J),(J.type!==U||J.texture!==re)&&(j!==X&&(i.activeTexture(X),j=X),i.bindTexture(U,re||_e[U]),J.type=U,J.texture=re)}function k(){let U=ie[j];U!==void 0&&U.type!==void 0&&(i.bindTexture(U.type,null),U.type=void 0,U.texture=void 0)}function Z(){try{i.compressedTexImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Q(){try{i.compressedTexImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function q(){try{i.texSubImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ye(){try{i.texSubImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ae(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ue(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function He(){try{i.texStorage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ee(){try{i.texStorage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function de(){try{i.texImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function we(){try{i.texImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Ae(U){$e.equals(U)===!1&&(i.scissor(U.x,U.y,U.z,U.w),$e.copy(U))}function fe(U){Y.equals(U)===!1&&(i.viewport(U.x,U.y,U.z,U.w),Y.copy(U))}function ze(U,re){let X=h.get(re);X===void 0&&(X=new WeakMap,h.set(re,X));let J=X.get(U);J===void 0&&(J=i.getUniformBlockIndex(re,U.name),X.set(U,J))}function De(U,re){let J=h.get(re).get(U);l.get(re)!==J&&(i.uniformBlockBinding(re,J,U.__bindingPointIndex),l.set(re,J))}function tt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),c={},j=null,ie={},u={},f=new WeakMap,m=[],g=null,v=!1,p=null,d=null,w=null,S=null,_=null,I=null,T=null,A=new Me(0,0,0),C=0,b=!1,x=null,R=null,L=null,O=null,B=null,$e.set(0,0,i.canvas.width,i.canvas.height),Y.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:oe,disable:Te,bindFramebuffer:Ie,drawBuffers:Fe,useProgram:ct,setBlending:F,setMaterial:nn,setFlipSided:Be,setCullFace:ke,setLineWidth:Se,setPolygonOffset:st,setScissorTest:be,activeTexture:E,bindTexture:y,unbindTexture:k,compressedTexImage2D:Z,compressedTexImage3D:Q,texImage2D:de,texImage3D:we,updateUBOMapping:ze,uniformBlockBinding:De,texStorage2D:He,texStorage3D:ee,texSubImage2D:q,texSubImage3D:ye,compressedTexSubImage2D:ae,compressedTexSubImage3D:ue,scissor:Ae,viewport:fe,reset:tt}}function wu(i,e,t,n){let s=Xx(n);switch(t){case Nu:return i*e;case Ou:return i*e;case Bu:return i*e*2;case xc:return i*e/s.components*s.byteLength;case _c:return i*e/s.components*s.byteLength;case ku:return i*e*2/s.components*s.byteLength;case yc:return i*e*2/s.components*s.byteLength;case Fu:return i*e*3/s.components*s.byteLength;case gn:return i*e*4/s.components*s.byteLength;case vc:return i*e*4/s.components*s.byteLength;case no:case io:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case so:case ro:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case cl:case ul:return Math.max(i,16)*Math.max(e,8)/4;case ll:case hl:return Math.max(i,8)*Math.max(e,8)/2;case dl:case fl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case pl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case ml:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case gl:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case xl:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case _l:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case yl:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case vl:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Ml:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case bl:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Sl:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case wl:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case El:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case Tl:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case Al:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case Cl:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case oo:case Rl:case Il:return Math.ceil(i/4)*Math.ceil(e/4)*16;case zu:case Pl:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Ll:case Ul:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Xx(i){switch(i){case $n:case Lu:return{byteLength:1,components:1};case Qs:case Uu:case ir:return{byteLength:2,components:1};case mc:case gc:return{byteLength:2,components:4};case Di:case pc:case Un:return{byteLength:4,components:1};case Du:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function qx(i,e,t,n,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new Oe,c=new WeakMap,u,f=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(E,y){return m?new OffscreenCanvas(E,y):ho("canvas")}function v(E,y,k){let Z=1,Q=be(E);if((Q.width>k||Q.height>k)&&(Z=k/Math.max(Q.width,Q.height)),Z<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){let q=Math.floor(Z*Q.width),ye=Math.floor(Z*Q.height);u===void 0&&(u=g(q,ye));let ae=y?g(q,ye):u;return ae.width=q,ae.height=ye,ae.getContext("2d").drawImage(E,0,0,q,ye),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Q.width+"x"+Q.height+") to ("+q+"x"+ye+")."),ae}else return"data"in E&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Q.width+"x"+Q.height+")."),E;return E}function p(E){return E.generateMipmaps}function d(E){i.generateMipmap(E)}function w(E){return E.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:E.isWebGL3DRenderTarget?i.TEXTURE_3D:E.isWebGLArrayRenderTarget||E.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function S(E,y,k,Z,Q=!1){if(E!==null){if(i[E]!==void 0)return i[E];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let q=y;if(y===i.RED&&(k===i.FLOAT&&(q=i.R32F),k===i.HALF_FLOAT&&(q=i.R16F),k===i.UNSIGNED_BYTE&&(q=i.R8)),y===i.RED_INTEGER&&(k===i.UNSIGNED_BYTE&&(q=i.R8UI),k===i.UNSIGNED_SHORT&&(q=i.R16UI),k===i.UNSIGNED_INT&&(q=i.R32UI),k===i.BYTE&&(q=i.R8I),k===i.SHORT&&(q=i.R16I),k===i.INT&&(q=i.R32I)),y===i.RG&&(k===i.FLOAT&&(q=i.RG32F),k===i.HALF_FLOAT&&(q=i.RG16F),k===i.UNSIGNED_BYTE&&(q=i.RG8)),y===i.RG_INTEGER&&(k===i.UNSIGNED_BYTE&&(q=i.RG8UI),k===i.UNSIGNED_SHORT&&(q=i.RG16UI),k===i.UNSIGNED_INT&&(q=i.RG32UI),k===i.BYTE&&(q=i.RG8I),k===i.SHORT&&(q=i.RG16I),k===i.INT&&(q=i.RG32I)),y===i.RGB_INTEGER&&(k===i.UNSIGNED_BYTE&&(q=i.RGB8UI),k===i.UNSIGNED_SHORT&&(q=i.RGB16UI),k===i.UNSIGNED_INT&&(q=i.RGB32UI),k===i.BYTE&&(q=i.RGB8I),k===i.SHORT&&(q=i.RGB16I),k===i.INT&&(q=i.RGB32I)),y===i.RGBA_INTEGER&&(k===i.UNSIGNED_BYTE&&(q=i.RGBA8UI),k===i.UNSIGNED_SHORT&&(q=i.RGBA16UI),k===i.UNSIGNED_INT&&(q=i.RGBA32UI),k===i.BYTE&&(q=i.RGBA8I),k===i.SHORT&&(q=i.RGBA16I),k===i.INT&&(q=i.RGBA32I)),y===i.RGB&&k===i.UNSIGNED_INT_5_9_9_9_REV&&(q=i.RGB9_E5),y===i.RGBA){let ye=Q?Fo:Ge.getTransfer(Z);k===i.FLOAT&&(q=i.RGBA32F),k===i.HALF_FLOAT&&(q=i.RGBA16F),k===i.UNSIGNED_BYTE&&(q=ye===je?i.SRGB8_ALPHA8:i.RGBA8),k===i.UNSIGNED_SHORT_4_4_4_4&&(q=i.RGBA4),k===i.UNSIGNED_SHORT_5_5_5_1&&(q=i.RGB5_A1)}return(q===i.R16F||q===i.R32F||q===i.RG16F||q===i.RG32F||q===i.RGBA16F||q===i.RGBA32F)&&e.get("EXT_color_buffer_float"),q}function _(E,y){let k;return E?y===null||y===Di||y===gs?k=i.DEPTH24_STENCIL8:y===Un?k=i.DEPTH32F_STENCIL8:y===Qs&&(k=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===Di||y===gs?k=i.DEPTH_COMPONENT24:y===Un?k=i.DEPTH_COMPONENT32F:y===Qs&&(k=i.DEPTH_COMPONENT16),k}function I(E,y){return p(E)===!0||E.isFramebufferTexture&&E.minFilter!==Zt&&E.minFilter!==Ln?Math.log2(Math.max(y.width,y.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?y.mipmaps.length:1}function T(E){let y=E.target;y.removeEventListener("dispose",T),C(y),y.isVideoTexture&&c.delete(y)}function A(E){let y=E.target;y.removeEventListener("dispose",A),x(y)}function C(E){let y=n.get(E);if(y.__webglInit===void 0)return;let k=E.source,Z=f.get(k);if(Z){let Q=Z[y.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&b(E),Object.keys(Z).length===0&&f.delete(k)}n.remove(E)}function b(E){let y=n.get(E);i.deleteTexture(y.__webglTexture);let k=E.source,Z=f.get(k);delete Z[y.__cacheKey],o.memory.textures--}function x(E){let y=n.get(E);if(E.depthTexture&&(E.depthTexture.dispose(),n.remove(E.depthTexture)),E.isWebGLCubeRenderTarget)for(let Z=0;Z<6;Z++){if(Array.isArray(y.__webglFramebuffer[Z]))for(let Q=0;Q<y.__webglFramebuffer[Z].length;Q++)i.deleteFramebuffer(y.__webglFramebuffer[Z][Q]);else i.deleteFramebuffer(y.__webglFramebuffer[Z]);y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer[Z])}else{if(Array.isArray(y.__webglFramebuffer))for(let Z=0;Z<y.__webglFramebuffer.length;Z++)i.deleteFramebuffer(y.__webglFramebuffer[Z]);else i.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&i.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let Z=0;Z<y.__webglColorRenderbuffer.length;Z++)y.__webglColorRenderbuffer[Z]&&i.deleteRenderbuffer(y.__webglColorRenderbuffer[Z]);y.__webglDepthRenderbuffer&&i.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let k=E.textures;for(let Z=0,Q=k.length;Z<Q;Z++){let q=n.get(k[Z]);q.__webglTexture&&(i.deleteTexture(q.__webglTexture),o.memory.textures--),n.remove(k[Z])}n.remove(E)}let R=0;function L(){R=0}function O(){let E=R;return E>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+s.maxTextures),R+=1,E}function B(E){let y=[];return y.push(E.wrapS),y.push(E.wrapT),y.push(E.wrapR||0),y.push(E.magFilter),y.push(E.minFilter),y.push(E.anisotropy),y.push(E.internalFormat),y.push(E.format),y.push(E.type),y.push(E.generateMipmaps),y.push(E.premultiplyAlpha),y.push(E.flipY),y.push(E.unpackAlignment),y.push(E.colorSpace),y.join()}function G(E,y){let k=n.get(E);if(E.isVideoTexture&&Se(E),E.isRenderTargetTexture===!1&&E.version>0&&k.__version!==E.version){let Z=E.image;if(Z===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Z.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Y(k,E,y);return}}t.bindTexture(i.TEXTURE_2D,k.__webglTexture,i.TEXTURE0+y)}function z(E,y){let k=n.get(E);if(E.version>0&&k.__version!==E.version){Y(k,E,y);return}t.bindTexture(i.TEXTURE_2D_ARRAY,k.__webglTexture,i.TEXTURE0+y)}function K(E,y){let k=n.get(E);if(E.version>0&&k.__version!==E.version){Y(k,E,y);return}t.bindTexture(i.TEXTURE_3D,k.__webglTexture,i.TEXTURE0+y)}function W(E,y){let k=n.get(E);if(E.version>0&&k.__version!==E.version){ne(k,E,y);return}t.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture,i.TEXTURE0+y)}let j={[ol]:i.REPEAT,[Li]:i.CLAMP_TO_EDGE,[al]:i.MIRRORED_REPEAT},ie={[Zt]:i.NEAREST,[Xf]:i.NEAREST_MIPMAP_NEAREST,[Ur]:i.NEAREST_MIPMAP_LINEAR,[Ln]:i.LINEAR,[xa]:i.LINEAR_MIPMAP_NEAREST,[Ui]:i.LINEAR_MIPMAP_LINEAR},pe={[Zf]:i.NEVER,[tp]:i.ALWAYS,[Jf]:i.LESS,[Vu]:i.LEQUAL,[Kf]:i.EQUAL,[ep]:i.GEQUAL,[Qf]:i.GREATER,[jf]:i.NOTEQUAL};function Ue(E,y){if(y.type===Un&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===Ln||y.magFilter===xa||y.magFilter===Ur||y.magFilter===Ui||y.minFilter===Ln||y.minFilter===xa||y.minFilter===Ur||y.minFilter===Ui)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(E,i.TEXTURE_WRAP_S,j[y.wrapS]),i.texParameteri(E,i.TEXTURE_WRAP_T,j[y.wrapT]),(E===i.TEXTURE_3D||E===i.TEXTURE_2D_ARRAY)&&i.texParameteri(E,i.TEXTURE_WRAP_R,j[y.wrapR]),i.texParameteri(E,i.TEXTURE_MAG_FILTER,ie[y.magFilter]),i.texParameteri(E,i.TEXTURE_MIN_FILTER,ie[y.minFilter]),y.compareFunction&&(i.texParameteri(E,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(E,i.TEXTURE_COMPARE_FUNC,pe[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===Zt||y.minFilter!==Ur&&y.minFilter!==Ui||y.type===Un&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||n.get(y).__currentAnisotropy){let k=e.get("EXT_texture_filter_anisotropic");i.texParameterf(E,k.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,s.getMaxAnisotropy())),n.get(y).__currentAnisotropy=y.anisotropy}}}function $e(E,y){let k=!1;E.__webglInit===void 0&&(E.__webglInit=!0,y.addEventListener("dispose",T));let Z=y.source,Q=f.get(Z);Q===void 0&&(Q={},f.set(Z,Q));let q=B(y);if(q!==E.__cacheKey){Q[q]===void 0&&(Q[q]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,k=!0),Q[q].usedTimes++;let ye=Q[E.__cacheKey];ye!==void 0&&(Q[E.__cacheKey].usedTimes--,ye.usedTimes===0&&b(y)),E.__cacheKey=q,E.__webglTexture=Q[q].texture}return k}function Y(E,y,k){let Z=i.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(Z=i.TEXTURE_2D_ARRAY),y.isData3DTexture&&(Z=i.TEXTURE_3D);let Q=$e(E,y),q=y.source;t.bindTexture(Z,E.__webglTexture,i.TEXTURE0+k);let ye=n.get(q);if(q.version!==ye.__version||Q===!0){t.activeTexture(i.TEXTURE0+k);let ae=Ge.getPrimaries(Ge.workingColorSpace),ue=y.colorSpace===li?null:Ge.getPrimaries(y.colorSpace),He=y.colorSpace===li||ae===ue?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,He);let ee=v(y.image,!1,s.maxTextureSize);ee=st(y,ee);let de=r.convert(y.format,y.colorSpace),we=r.convert(y.type),Ae=S(y.internalFormat,de,we,y.colorSpace,y.isVideoTexture);Ue(Z,y);let fe,ze=y.mipmaps,De=y.isVideoTexture!==!0,tt=ye.__version===void 0||Q===!0,U=q.dataReady,re=I(y,ee);if(y.isDepthTexture)Ae=_(y.format===xs,y.type),tt&&(De?t.texStorage2D(i.TEXTURE_2D,1,Ae,ee.width,ee.height):t.texImage2D(i.TEXTURE_2D,0,Ae,ee.width,ee.height,0,de,we,null));else if(y.isDataTexture)if(ze.length>0){De&&tt&&t.texStorage2D(i.TEXTURE_2D,re,Ae,ze[0].width,ze[0].height);for(let X=0,J=ze.length;X<J;X++)fe=ze[X],De?U&&t.texSubImage2D(i.TEXTURE_2D,X,0,0,fe.width,fe.height,de,we,fe.data):t.texImage2D(i.TEXTURE_2D,X,Ae,fe.width,fe.height,0,de,we,fe.data);y.generateMipmaps=!1}else De?(tt&&t.texStorage2D(i.TEXTURE_2D,re,Ae,ee.width,ee.height),U&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,ee.width,ee.height,de,we,ee.data)):t.texImage2D(i.TEXTURE_2D,0,Ae,ee.width,ee.height,0,de,we,ee.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){De&&tt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,re,Ae,ze[0].width,ze[0].height,ee.depth);for(let X=0,J=ze.length;X<J;X++)if(fe=ze[X],y.format!==gn)if(de!==null)if(De){if(U)if(y.layerUpdates.size>0){let he=wu(fe.width,fe.height,y.format,y.type);for(let le of y.layerUpdates){let Pe=fe.data.subarray(le*he/fe.data.BYTES_PER_ELEMENT,(le+1)*he/fe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,X,0,0,le,fe.width,fe.height,1,de,Pe)}y.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,X,0,0,0,fe.width,fe.height,ee.depth,de,fe.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,X,Ae,fe.width,fe.height,ee.depth,0,fe.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else De?U&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,X,0,0,0,fe.width,fe.height,ee.depth,de,we,fe.data):t.texImage3D(i.TEXTURE_2D_ARRAY,X,Ae,fe.width,fe.height,ee.depth,0,de,we,fe.data)}else{De&&tt&&t.texStorage2D(i.TEXTURE_2D,re,Ae,ze[0].width,ze[0].height);for(let X=0,J=ze.length;X<J;X++)fe=ze[X],y.format!==gn?de!==null?De?U&&t.compressedTexSubImage2D(i.TEXTURE_2D,X,0,0,fe.width,fe.height,de,fe.data):t.compressedTexImage2D(i.TEXTURE_2D,X,Ae,fe.width,fe.height,0,fe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):De?U&&t.texSubImage2D(i.TEXTURE_2D,X,0,0,fe.width,fe.height,de,we,fe.data):t.texImage2D(i.TEXTURE_2D,X,Ae,fe.width,fe.height,0,de,we,fe.data)}else if(y.isDataArrayTexture)if(De){if(tt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,re,Ae,ee.width,ee.height,ee.depth),U)if(y.layerUpdates.size>0){let X=wu(ee.width,ee.height,y.format,y.type);for(let J of y.layerUpdates){let he=ee.data.subarray(J*X/ee.data.BYTES_PER_ELEMENT,(J+1)*X/ee.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,J,ee.width,ee.height,1,de,we,he)}y.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ee.width,ee.height,ee.depth,de,we,ee.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Ae,ee.width,ee.height,ee.depth,0,de,we,ee.data);else if(y.isData3DTexture)De?(tt&&t.texStorage3D(i.TEXTURE_3D,re,Ae,ee.width,ee.height,ee.depth),U&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ee.width,ee.height,ee.depth,de,we,ee.data)):t.texImage3D(i.TEXTURE_3D,0,Ae,ee.width,ee.height,ee.depth,0,de,we,ee.data);else if(y.isFramebufferTexture){if(tt)if(De)t.texStorage2D(i.TEXTURE_2D,re,Ae,ee.width,ee.height);else{let X=ee.width,J=ee.height;for(let he=0;he<re;he++)t.texImage2D(i.TEXTURE_2D,he,Ae,X,J,0,de,we,null),X>>=1,J>>=1}}else if(ze.length>0){if(De&&tt){let X=be(ze[0]);t.texStorage2D(i.TEXTURE_2D,re,Ae,X.width,X.height)}for(let X=0,J=ze.length;X<J;X++)fe=ze[X],De?U&&t.texSubImage2D(i.TEXTURE_2D,X,0,0,de,we,fe):t.texImage2D(i.TEXTURE_2D,X,Ae,de,we,fe);y.generateMipmaps=!1}else if(De){if(tt){let X=be(ee);t.texStorage2D(i.TEXTURE_2D,re,Ae,X.width,X.height)}U&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,de,we,ee)}else t.texImage2D(i.TEXTURE_2D,0,Ae,de,we,ee);p(y)&&d(Z),ye.__version=q.version,y.onUpdate&&y.onUpdate(y)}E.__version=y.version}function ne(E,y,k){if(y.image.length!==6)return;let Z=$e(E,y),Q=y.source;t.bindTexture(i.TEXTURE_CUBE_MAP,E.__webglTexture,i.TEXTURE0+k);let q=n.get(Q);if(Q.version!==q.__version||Z===!0){t.activeTexture(i.TEXTURE0+k);let ye=Ge.getPrimaries(Ge.workingColorSpace),ae=y.colorSpace===li?null:Ge.getPrimaries(y.colorSpace),ue=y.colorSpace===li||ye===ae?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ue);let He=y.isCompressedTexture||y.image[0].isCompressedTexture,ee=y.image[0]&&y.image[0].isDataTexture,de=[];for(let J=0;J<6;J++)!He&&!ee?de[J]=v(y.image[J],!0,s.maxCubemapSize):de[J]=ee?y.image[J].image:y.image[J],de[J]=st(y,de[J]);let we=de[0],Ae=r.convert(y.format,y.colorSpace),fe=r.convert(y.type),ze=S(y.internalFormat,Ae,fe,y.colorSpace),De=y.isVideoTexture!==!0,tt=q.__version===void 0||Z===!0,U=Q.dataReady,re=I(y,we);Ue(i.TEXTURE_CUBE_MAP,y);let X;if(He){De&&tt&&t.texStorage2D(i.TEXTURE_CUBE_MAP,re,ze,we.width,we.height);for(let J=0;J<6;J++){X=de[J].mipmaps;for(let he=0;he<X.length;he++){let le=X[he];y.format!==gn?Ae!==null?De?U&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,he,0,0,le.width,le.height,Ae,le.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,he,ze,le.width,le.height,0,le.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):De?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,he,0,0,le.width,le.height,Ae,fe,le.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,he,ze,le.width,le.height,0,Ae,fe,le.data)}}}else{if(X=y.mipmaps,De&&tt){X.length>0&&re++;let J=be(de[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,re,ze,J.width,J.height)}for(let J=0;J<6;J++)if(ee){De?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,de[J].width,de[J].height,Ae,fe,de[J].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,ze,de[J].width,de[J].height,0,Ae,fe,de[J].data);for(let he=0;he<X.length;he++){let Pe=X[he].image[J].image;De?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,he+1,0,0,Pe.width,Pe.height,Ae,fe,Pe.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,he+1,ze,Pe.width,Pe.height,0,Ae,fe,Pe.data)}}else{De?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,Ae,fe,de[J]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,ze,Ae,fe,de[J]);for(let he=0;he<X.length;he++){let le=X[he];De?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,he+1,0,0,Ae,fe,le.image[J]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,he+1,ze,Ae,fe,le.image[J])}}}p(y)&&d(i.TEXTURE_CUBE_MAP),q.__version=Q.version,y.onUpdate&&y.onUpdate(y)}E.__version=y.version}function _e(E,y,k,Z,Q,q){let ye=r.convert(k.format,k.colorSpace),ae=r.convert(k.type),ue=S(k.internalFormat,ye,ae,k.colorSpace),He=n.get(y),ee=n.get(k);if(ee.__renderTarget=y,!He.__hasExternalTextures){let de=Math.max(1,y.width>>q),we=Math.max(1,y.height>>q);Q===i.TEXTURE_3D||Q===i.TEXTURE_2D_ARRAY?t.texImage3D(Q,q,ue,de,we,y.depth,0,ye,ae,null):t.texImage2D(Q,q,ue,de,we,0,ye,ae,null)}t.bindFramebuffer(i.FRAMEBUFFER,E),ke(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Z,Q,ee.__webglTexture,0,Be(y)):(Q===i.TEXTURE_2D||Q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,Z,Q,ee.__webglTexture,q),t.bindFramebuffer(i.FRAMEBUFFER,null)}function oe(E,y,k){if(i.bindRenderbuffer(i.RENDERBUFFER,E),y.depthBuffer){let Z=y.depthTexture,Q=Z&&Z.isDepthTexture?Z.type:null,q=_(y.stencilBuffer,Q),ye=y.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ae=Be(y);ke(y)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ae,q,y.width,y.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,ae,q,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,q,y.width,y.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ye,i.RENDERBUFFER,E)}else{let Z=y.textures;for(let Q=0;Q<Z.length;Q++){let q=Z[Q],ye=r.convert(q.format,q.colorSpace),ae=r.convert(q.type),ue=S(q.internalFormat,ye,ae,q.colorSpace),He=Be(y);k&&ke(y)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,He,ue,y.width,y.height):ke(y)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,He,ue,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,ue,y.width,y.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Te(E,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,E),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let Z=n.get(y.depthTexture);Z.__renderTarget=y,(!Z.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),G(y.depthTexture,0);let Q=Z.__webglTexture,q=Be(y);if(y.depthTexture.format===hs)ke(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Q,0,q):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Q,0);else if(y.depthTexture.format===xs)ke(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Q,0,q):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Q,0);else throw new Error("Unknown depthTexture format")}function Ie(E){let y=n.get(E),k=E.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==E.depthTexture){let Z=E.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),Z){let Q=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,Z.removeEventListener("dispose",Q)};Z.addEventListener("dispose",Q),y.__depthDisposeCallback=Q}y.__boundDepthTexture=Z}if(E.depthTexture&&!y.__autoAllocateDepthBuffer){if(k)throw new Error("target.depthTexture not supported in Cube render targets");Te(y.__webglFramebuffer,E)}else if(k){y.__webglDepthbuffer=[];for(let Z=0;Z<6;Z++)if(t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer[Z]),y.__webglDepthbuffer[Z]===void 0)y.__webglDepthbuffer[Z]=i.createRenderbuffer(),oe(y.__webglDepthbuffer[Z],E,!1);else{let Q=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,q=y.__webglDepthbuffer[Z];i.bindRenderbuffer(i.RENDERBUFFER,q),i.framebufferRenderbuffer(i.FRAMEBUFFER,Q,i.RENDERBUFFER,q)}}else if(t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=i.createRenderbuffer(),oe(y.__webglDepthbuffer,E,!1);else{let Z=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Q=y.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Q),i.framebufferRenderbuffer(i.FRAMEBUFFER,Z,i.RENDERBUFFER,Q)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Fe(E,y,k){let Z=n.get(E);y!==void 0&&_e(Z.__webglFramebuffer,E,E.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),k!==void 0&&Ie(E)}function ct(E){let y=E.texture,k=n.get(E),Z=n.get(y);E.addEventListener("dispose",A);let Q=E.textures,q=E.isWebGLCubeRenderTarget===!0,ye=Q.length>1;if(ye||(Z.__webglTexture===void 0&&(Z.__webglTexture=i.createTexture()),Z.__version=y.version,o.memory.textures++),q){k.__webglFramebuffer=[];for(let ae=0;ae<6;ae++)if(y.mipmaps&&y.mipmaps.length>0){k.__webglFramebuffer[ae]=[];for(let ue=0;ue<y.mipmaps.length;ue++)k.__webglFramebuffer[ae][ue]=i.createFramebuffer()}else k.__webglFramebuffer[ae]=i.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){k.__webglFramebuffer=[];for(let ae=0;ae<y.mipmaps.length;ae++)k.__webglFramebuffer[ae]=i.createFramebuffer()}else k.__webglFramebuffer=i.createFramebuffer();if(ye)for(let ae=0,ue=Q.length;ae<ue;ae++){let He=n.get(Q[ae]);He.__webglTexture===void 0&&(He.__webglTexture=i.createTexture(),o.memory.textures++)}if(E.samples>0&&ke(E)===!1){k.__webglMultisampledFramebuffer=i.createFramebuffer(),k.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let ae=0;ae<Q.length;ae++){let ue=Q[ae];k.__webglColorRenderbuffer[ae]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,k.__webglColorRenderbuffer[ae]);let He=r.convert(ue.format,ue.colorSpace),ee=r.convert(ue.type),de=S(ue.internalFormat,He,ee,ue.colorSpace,E.isXRRenderTarget===!0),we=Be(E);i.renderbufferStorageMultisample(i.RENDERBUFFER,we,de,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ae,i.RENDERBUFFER,k.__webglColorRenderbuffer[ae])}i.bindRenderbuffer(i.RENDERBUFFER,null),E.depthBuffer&&(k.__webglDepthRenderbuffer=i.createRenderbuffer(),oe(k.__webglDepthRenderbuffer,E,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(q){t.bindTexture(i.TEXTURE_CUBE_MAP,Z.__webglTexture),Ue(i.TEXTURE_CUBE_MAP,y);for(let ae=0;ae<6;ae++)if(y.mipmaps&&y.mipmaps.length>0)for(let ue=0;ue<y.mipmaps.length;ue++)_e(k.__webglFramebuffer[ae][ue],E,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ae,ue);else _e(k.__webglFramebuffer[ae],E,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0);p(y)&&d(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ye){for(let ae=0,ue=Q.length;ae<ue;ae++){let He=Q[ae],ee=n.get(He);t.bindTexture(i.TEXTURE_2D,ee.__webglTexture),Ue(i.TEXTURE_2D,He),_e(k.__webglFramebuffer,E,He,i.COLOR_ATTACHMENT0+ae,i.TEXTURE_2D,0),p(He)&&d(i.TEXTURE_2D)}t.unbindTexture()}else{let ae=i.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(ae=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ae,Z.__webglTexture),Ue(ae,y),y.mipmaps&&y.mipmaps.length>0)for(let ue=0;ue<y.mipmaps.length;ue++)_e(k.__webglFramebuffer[ue],E,y,i.COLOR_ATTACHMENT0,ae,ue);else _e(k.__webglFramebuffer,E,y,i.COLOR_ATTACHMENT0,ae,0);p(y)&&d(ae),t.unbindTexture()}E.depthBuffer&&Ie(E)}function Ve(E){let y=E.textures;for(let k=0,Z=y.length;k<Z;k++){let Q=y[k];if(p(Q)){let q=w(E),ye=n.get(Q).__webglTexture;t.bindTexture(q,ye),d(q),t.unbindTexture()}}}let dt=[],F=[];function nn(E){if(E.samples>0){if(ke(E)===!1){let y=E.textures,k=E.width,Z=E.height,Q=i.COLOR_BUFFER_BIT,q=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ye=n.get(E),ae=y.length>1;if(ae)for(let ue=0;ue<y.length;ue++)t.bindFramebuffer(i.FRAMEBUFFER,ye.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ue,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,ye.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ue,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,ye.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ye.__webglFramebuffer);for(let ue=0;ue<y.length;ue++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(Q|=i.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(Q|=i.STENCIL_BUFFER_BIT)),ae){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ye.__webglColorRenderbuffer[ue]);let He=n.get(y[ue]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,He,0)}i.blitFramebuffer(0,0,k,Z,0,0,k,Z,Q,i.NEAREST),l===!0&&(dt.length=0,F.length=0,dt.push(i.COLOR_ATTACHMENT0+ue),E.depthBuffer&&E.resolveDepthBuffer===!1&&(dt.push(q),F.push(q),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,F)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,dt))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ae)for(let ue=0;ue<y.length;ue++){t.bindFramebuffer(i.FRAMEBUFFER,ye.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ue,i.RENDERBUFFER,ye.__webglColorRenderbuffer[ue]);let He=n.get(y[ue]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,ye.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ue,i.TEXTURE_2D,He,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ye.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.resolveDepthBuffer===!1&&l){let y=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[y])}}}function Be(E){return Math.min(s.maxSamples,E.samples)}function ke(E){let y=n.get(E);return E.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function Se(E){let y=o.render.frame;c.get(E)!==y&&(c.set(E,y),E.update())}function st(E,y){let k=E.colorSpace,Z=E.format,Q=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||k!==bs&&k!==li&&(Ge.getTransfer(k)===je?(Z!==gn||Q!==$n)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",k)),y}function be(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(h.width=E.naturalWidth||E.width,h.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(h.width=E.displayWidth,h.height=E.displayHeight):(h.width=E.width,h.height=E.height),h}this.allocateTextureUnit=O,this.resetTextureUnits=L,this.setTexture2D=G,this.setTexture2DArray=z,this.setTexture3D=K,this.setTextureCube=W,this.rebindTextures=Fe,this.setupRenderTarget=ct,this.updateRenderTargetMipmap=Ve,this.updateMultisampleRenderTarget=nn,this.setupDepthRenderbuffer=Ie,this.setupFrameBufferTexture=_e,this.useMultisampledRTT=ke}function Yx(i,e){function t(n,s=li){let r,o=Ge.getTransfer(s);if(n===$n)return i.UNSIGNED_BYTE;if(n===mc)return i.UNSIGNED_SHORT_4_4_4_4;if(n===gc)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Du)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Lu)return i.BYTE;if(n===Uu)return i.SHORT;if(n===Qs)return i.UNSIGNED_SHORT;if(n===pc)return i.INT;if(n===Di)return i.UNSIGNED_INT;if(n===Un)return i.FLOAT;if(n===ir)return i.HALF_FLOAT;if(n===Nu)return i.ALPHA;if(n===Fu)return i.RGB;if(n===gn)return i.RGBA;if(n===Ou)return i.LUMINANCE;if(n===Bu)return i.LUMINANCE_ALPHA;if(n===hs)return i.DEPTH_COMPONENT;if(n===xs)return i.DEPTH_STENCIL;if(n===xc)return i.RED;if(n===_c)return i.RED_INTEGER;if(n===ku)return i.RG;if(n===yc)return i.RG_INTEGER;if(n===vc)return i.RGBA_INTEGER;if(n===no||n===io||n===so||n===ro)if(o===je)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===no)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===io)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===so)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===ro)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===no)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===io)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===so)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===ro)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===ll||n===cl||n===hl||n===ul)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===ll)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===cl)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===hl)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===ul)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===dl||n===fl||n===pl)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===dl||n===fl)return o===je?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===pl)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===ml||n===gl||n===xl||n===_l||n===yl||n===vl||n===Ml||n===bl||n===Sl||n===wl||n===El||n===Tl||n===Al||n===Cl)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===ml)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===gl)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===xl)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===_l)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===yl)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===vl)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Ml)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===bl)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Sl)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===wl)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===El)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Tl)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Al)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Cl)return o===je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===oo||n===Rl||n===Il)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===oo)return o===je?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Rl)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Il)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===zu||n===Pl||n===Ll||n===Ul)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===oo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Pl)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ll)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Ul)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===gs?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var Jl=class extends Rt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},xn=class extends Dt{constructor(){super(),this.isGroup=!0,this.type="Group"}},$x={type:"move"},Ks=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new xn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new xn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new P,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new P),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new xn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new P,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new P),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,h=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(h&&e.hand){o=!0;for(let v of e.hand.values()){let p=t.getJointPose(v,n),d=this._getHandJoint(h,v);p!==null&&(d.matrix.fromArray(p.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=p.radius),d.visible=p!==null}let c=h.joints["index-finger-tip"],u=h.joints["thumb-tip"],f=c.position.distanceTo(u.position),m=.02,g=.005;h.inputState.pinching&&f>m+g?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!h.inputState.pinching&&f<=m-g&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent($x)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),h!==null&&(h.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new xn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Zx=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Jx=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Kl=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){let s=new Kt,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!=n.depthNear||t.depthFar!=n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Dn({vertexShader:Zx,fragmentShader:Jx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ft(new Fi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Ql=class extends di{constructor(e,t){super();let n=this,s=null,r=1,o=null,a="local-floor",l=1,h=null,c=null,u=null,f=null,m=null,g=null,v=new Kl,p=t.getContextAttributes(),d=null,w=null,S=[],_=[],I=new Oe,T=null,A=new Rt;A.viewport=new et;let C=new Rt;C.viewport=new et;let b=[A,C],x=new Jl,R=null,L=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let ne=S[Y];return ne===void 0&&(ne=new Ks,S[Y]=ne),ne.getTargetRaySpace()},this.getControllerGrip=function(Y){let ne=S[Y];return ne===void 0&&(ne=new Ks,S[Y]=ne),ne.getGripSpace()},this.getHand=function(Y){let ne=S[Y];return ne===void 0&&(ne=new Ks,S[Y]=ne),ne.getHandSpace()};function O(Y){let ne=_.indexOf(Y.inputSource);if(ne===-1)return;let _e=S[ne];_e!==void 0&&(_e.update(Y.inputSource,Y.frame,h||o),_e.dispatchEvent({type:Y.type,data:Y.inputSource}))}function B(){s.removeEventListener("select",O),s.removeEventListener("selectstart",O),s.removeEventListener("selectend",O),s.removeEventListener("squeeze",O),s.removeEventListener("squeezestart",O),s.removeEventListener("squeezeend",O),s.removeEventListener("end",B),s.removeEventListener("inputsourceschange",G);for(let Y=0;Y<S.length;Y++){let ne=_[Y];ne!==null&&(_[Y]=null,S[Y].disconnect(ne))}R=null,L=null,v.reset(),e.setRenderTarget(d),m=null,f=null,u=null,s=null,w=null,$e.stop(),n.isPresenting=!1,e.setPixelRatio(T),e.setSize(I.width,I.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){r=Y,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){a=Y,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||o},this.setReferenceSpace=function(Y){h=Y},this.getBaseLayer=function(){return f!==null?f:m},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(Y){if(s=Y,s!==null){if(d=e.getRenderTarget(),s.addEventListener("select",O),s.addEventListener("selectstart",O),s.addEventListener("selectend",O),s.addEventListener("squeeze",O),s.addEventListener("squeezestart",O),s.addEventListener("squeezeend",O),s.addEventListener("end",B),s.addEventListener("inputsourceschange",G),p.xrCompatible!==!0&&await t.makeXRCompatible(),T=e.getPixelRatio(),e.getSize(I),s.renderState.layers===void 0){let ne={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,t,ne),s.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),w=new Zn(m.framebufferWidth,m.framebufferHeight,{format:gn,type:$n,colorSpace:e.outputColorSpace,stencilBuffer:p.stencil})}else{let ne=null,_e=null,oe=null;p.depth&&(oe=p.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ne=p.stencil?xs:hs,_e=p.stencil?gs:Di);let Te={colorFormat:t.RGBA8,depthFormat:oe,scaleFactor:r};u=new XRWebGLBinding(s,t),f=u.createProjectionLayer(Te),s.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),w=new Zn(f.textureWidth,f.textureHeight,{format:gn,type:$n,depthTexture:new vo(f.textureWidth,f.textureHeight,_e,void 0,void 0,void 0,void 0,void 0,void 0,ne),stencilBuffer:p.stencil,colorSpace:e.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1})}w.isXRRenderTarget=!0,this.setFoveation(l),h=null,o=await s.requestReferenceSpace(a),$e.setContext(s),$e.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function G(Y){for(let ne=0;ne<Y.removed.length;ne++){let _e=Y.removed[ne],oe=_.indexOf(_e);oe>=0&&(_[oe]=null,S[oe].disconnect(_e))}for(let ne=0;ne<Y.added.length;ne++){let _e=Y.added[ne],oe=_.indexOf(_e);if(oe===-1){for(let Ie=0;Ie<S.length;Ie++)if(Ie>=_.length){_.push(_e),oe=Ie;break}else if(_[Ie]===null){_[Ie]=_e,oe=Ie;break}if(oe===-1)break}let Te=S[oe];Te&&Te.connect(_e)}}let z=new P,K=new P;function W(Y,ne,_e){z.setFromMatrixPosition(ne.matrixWorld),K.setFromMatrixPosition(_e.matrixWorld);let oe=z.distanceTo(K),Te=ne.projectionMatrix.elements,Ie=_e.projectionMatrix.elements,Fe=Te[14]/(Te[10]-1),ct=Te[14]/(Te[10]+1),Ve=(Te[9]+1)/Te[5],dt=(Te[9]-1)/Te[5],F=(Te[8]-1)/Te[0],nn=(Ie[8]+1)/Ie[0],Be=Fe*F,ke=Fe*nn,Se=oe/(-F+nn),st=Se*-F;if(ne.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(st),Y.translateZ(Se),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert(),Te[10]===-1)Y.projectionMatrix.copy(ne.projectionMatrix),Y.projectionMatrixInverse.copy(ne.projectionMatrixInverse);else{let be=Fe+Se,E=ct+Se,y=Be-st,k=ke+(oe-st),Z=Ve*ct/E*be,Q=dt*ct/E*be;Y.projectionMatrix.makePerspective(y,k,Z,Q,be,E),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}}function j(Y,ne){ne===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(ne.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(s===null)return;let ne=Y.near,_e=Y.far;v.texture!==null&&(v.depthNear>0&&(ne=v.depthNear),v.depthFar>0&&(_e=v.depthFar)),x.near=C.near=A.near=ne,x.far=C.far=A.far=_e,(R!==x.near||L!==x.far)&&(s.updateRenderState({depthNear:x.near,depthFar:x.far}),R=x.near,L=x.far),A.layers.mask=Y.layers.mask|2,C.layers.mask=Y.layers.mask|4,x.layers.mask=A.layers.mask|C.layers.mask;let oe=Y.parent,Te=x.cameras;j(x,oe);for(let Ie=0;Ie<Te.length;Ie++)j(Te[Ie],oe);Te.length===2?W(x,A,C):x.projectionMatrix.copy(A.projectionMatrix),ie(Y,x,oe)};function ie(Y,ne,_e){_e===null?Y.matrix.copy(ne.matrixWorld):(Y.matrix.copy(_e.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(ne.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(!0),Y.projectionMatrix.copy(ne.projectionMatrix),Y.projectionMatrixInverse.copy(ne.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=Nl*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}this.getCamera=function(){return x},this.getFoveation=function(){if(!(f===null&&m===null))return l},this.setFoveation=function(Y){l=Y,f!==null&&(f.fixedFoveation=Y),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=Y)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(x)};let pe=null;function Ue(Y,ne){if(c=ne.getViewerPose(h||o),g=ne,c!==null){let _e=c.views;m!==null&&(e.setRenderTargetFramebuffer(w,m.framebuffer),e.setRenderTarget(w));let oe=!1;_e.length!==x.cameras.length&&(x.cameras.length=0,oe=!0);for(let Ie=0;Ie<_e.length;Ie++){let Fe=_e[Ie],ct=null;if(m!==null)ct=m.getViewport(Fe);else{let dt=u.getViewSubImage(f,Fe);ct=dt.viewport,Ie===0&&(e.setRenderTargetTextures(w,dt.colorTexture,f.ignoreDepthValues?void 0:dt.depthStencilTexture),e.setRenderTarget(w))}let Ve=b[Ie];Ve===void 0&&(Ve=new Rt,Ve.layers.enable(Ie),Ve.viewport=new et,b[Ie]=Ve),Ve.matrix.fromArray(Fe.transform.matrix),Ve.matrix.decompose(Ve.position,Ve.quaternion,Ve.scale),Ve.projectionMatrix.fromArray(Fe.projectionMatrix),Ve.projectionMatrixInverse.copy(Ve.projectionMatrix).invert(),Ve.viewport.set(ct.x,ct.y,ct.width,ct.height),Ie===0&&(x.matrix.copy(Ve.matrix),x.matrix.decompose(x.position,x.quaternion,x.scale)),oe===!0&&x.cameras.push(Ve)}let Te=s.enabledFeatures;if(Te&&Te.includes("depth-sensing")){let Ie=u.getDepthInformation(_e[0]);Ie&&Ie.isValid&&Ie.texture&&v.init(e,Ie,s.renderState)}}for(let _e=0;_e<S.length;_e++){let oe=_[_e],Te=S[_e];oe!==null&&Te!==void 0&&Te.update(oe,ne,h||o)}pe&&pe(Y,ne),ne.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ne}),g=null}let $e=new Xu;$e.setAnimationLoop(Ue),this.setAnimationLoop=function(Y){pe=Y},this.dispose=function(){}}},Ai=new Mt,Kx=new We;function Qx(i,e){function t(p,d){p.matrixAutoUpdate===!0&&p.updateMatrix(),d.value.copy(p.matrix)}function n(p,d){d.color.getRGB(p.fogColor.value,Wu(i)),d.isFog?(p.fogNear.value=d.near,p.fogFar.value=d.far):d.isFogExp2&&(p.fogDensity.value=d.density)}function s(p,d,w,S,_){d.isMeshBasicMaterial||d.isMeshLambertMaterial?r(p,d):d.isMeshToonMaterial?(r(p,d),u(p,d)):d.isMeshPhongMaterial?(r(p,d),c(p,d)):d.isMeshStandardMaterial?(r(p,d),f(p,d),d.isMeshPhysicalMaterial&&m(p,d,_)):d.isMeshMatcapMaterial?(r(p,d),g(p,d)):d.isMeshDepthMaterial?r(p,d):d.isMeshDistanceMaterial?(r(p,d),v(p,d)):d.isMeshNormalMaterial?r(p,d):d.isLineBasicMaterial?(o(p,d),d.isLineDashedMaterial&&a(p,d)):d.isPointsMaterial?l(p,d,w,S):d.isSpriteMaterial?h(p,d):d.isShadowMaterial?(p.color.value.copy(d.color),p.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function r(p,d){p.opacity.value=d.opacity,d.color&&p.diffuse.value.copy(d.color),d.emissive&&p.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(p.map.value=d.map,t(d.map,p.mapTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,t(d.alphaMap,p.alphaMapTransform)),d.bumpMap&&(p.bumpMap.value=d.bumpMap,t(d.bumpMap,p.bumpMapTransform),p.bumpScale.value=d.bumpScale,d.side===Gt&&(p.bumpScale.value*=-1)),d.normalMap&&(p.normalMap.value=d.normalMap,t(d.normalMap,p.normalMapTransform),p.normalScale.value.copy(d.normalScale),d.side===Gt&&p.normalScale.value.negate()),d.displacementMap&&(p.displacementMap.value=d.displacementMap,t(d.displacementMap,p.displacementMapTransform),p.displacementScale.value=d.displacementScale,p.displacementBias.value=d.displacementBias),d.emissiveMap&&(p.emissiveMap.value=d.emissiveMap,t(d.emissiveMap,p.emissiveMapTransform)),d.specularMap&&(p.specularMap.value=d.specularMap,t(d.specularMap,p.specularMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest);let w=e.get(d),S=w.envMap,_=w.envMapRotation;S&&(p.envMap.value=S,Ai.copy(_),Ai.x*=-1,Ai.y*=-1,Ai.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(Ai.y*=-1,Ai.z*=-1),p.envMapRotation.value.setFromMatrix4(Kx.makeRotationFromEuler(Ai)),p.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=d.reflectivity,p.ior.value=d.ior,p.refractionRatio.value=d.refractionRatio),d.lightMap&&(p.lightMap.value=d.lightMap,p.lightMapIntensity.value=d.lightMapIntensity,t(d.lightMap,p.lightMapTransform)),d.aoMap&&(p.aoMap.value=d.aoMap,p.aoMapIntensity.value=d.aoMapIntensity,t(d.aoMap,p.aoMapTransform))}function o(p,d){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,d.map&&(p.map.value=d.map,t(d.map,p.mapTransform))}function a(p,d){p.dashSize.value=d.dashSize,p.totalSize.value=d.dashSize+d.gapSize,p.scale.value=d.scale}function l(p,d,w,S){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,p.size.value=d.size*w,p.scale.value=S*.5,d.map&&(p.map.value=d.map,t(d.map,p.uvTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,t(d.alphaMap,p.alphaMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest)}function h(p,d){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,p.rotation.value=d.rotation,d.map&&(p.map.value=d.map,t(d.map,p.mapTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,t(d.alphaMap,p.alphaMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest)}function c(p,d){p.specular.value.copy(d.specular),p.shininess.value=Math.max(d.shininess,1e-4)}function u(p,d){d.gradientMap&&(p.gradientMap.value=d.gradientMap)}function f(p,d){p.metalness.value=d.metalness,d.metalnessMap&&(p.metalnessMap.value=d.metalnessMap,t(d.metalnessMap,p.metalnessMapTransform)),p.roughness.value=d.roughness,d.roughnessMap&&(p.roughnessMap.value=d.roughnessMap,t(d.roughnessMap,p.roughnessMapTransform)),d.envMap&&(p.envMapIntensity.value=d.envMapIntensity)}function m(p,d,w){p.ior.value=d.ior,d.sheen>0&&(p.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),p.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(p.sheenColorMap.value=d.sheenColorMap,t(d.sheenColorMap,p.sheenColorMapTransform)),d.sheenRoughnessMap&&(p.sheenRoughnessMap.value=d.sheenRoughnessMap,t(d.sheenRoughnessMap,p.sheenRoughnessMapTransform))),d.clearcoat>0&&(p.clearcoat.value=d.clearcoat,p.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(p.clearcoatMap.value=d.clearcoatMap,t(d.clearcoatMap,p.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,t(d.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(p.clearcoatNormalMap.value=d.clearcoatNormalMap,t(d.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===Gt&&p.clearcoatNormalScale.value.negate())),d.dispersion>0&&(p.dispersion.value=d.dispersion),d.iridescence>0&&(p.iridescence.value=d.iridescence,p.iridescenceIOR.value=d.iridescenceIOR,p.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(p.iridescenceMap.value=d.iridescenceMap,t(d.iridescenceMap,p.iridescenceMapTransform)),d.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=d.iridescenceThicknessMap,t(d.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),d.transmission>0&&(p.transmission.value=d.transmission,p.transmissionSamplerMap.value=w.texture,p.transmissionSamplerSize.value.set(w.width,w.height),d.transmissionMap&&(p.transmissionMap.value=d.transmissionMap,t(d.transmissionMap,p.transmissionMapTransform)),p.thickness.value=d.thickness,d.thicknessMap&&(p.thicknessMap.value=d.thicknessMap,t(d.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=d.attenuationDistance,p.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(p.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(p.anisotropyMap.value=d.anisotropyMap,t(d.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=d.specularIntensity,p.specularColor.value.copy(d.specularColor),d.specularColorMap&&(p.specularColorMap.value=d.specularColorMap,t(d.specularColorMap,p.specularColorMapTransform)),d.specularIntensityMap&&(p.specularIntensityMap.value=d.specularIntensityMap,t(d.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,d){d.matcap&&(p.matcap.value=d.matcap)}function v(p,d){let w=e.get(d).light;p.referencePosition.value.setFromMatrixPosition(w.matrixWorld),p.nearDistance.value=w.shadow.camera.near,p.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function jx(i,e,t,n){let s={},r={},o=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(w,S){let _=S.program;n.uniformBlockBinding(w,_)}function h(w,S){let _=s[w.id];_===void 0&&(g(w),_=c(w),s[w.id]=_,w.addEventListener("dispose",p));let I=S.program;n.updateUBOMapping(w,I);let T=e.render.frame;r[w.id]!==T&&(f(w),r[w.id]=T)}function c(w){let S=u();w.__bindingPointIndex=S;let _=i.createBuffer(),I=w.__size,T=w.usage;return i.bindBuffer(i.UNIFORM_BUFFER,_),i.bufferData(i.UNIFORM_BUFFER,I,T),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,S,_),_}function u(){for(let w=0;w<a;w++)if(o.indexOf(w)===-1)return o.push(w),w;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(w){let S=s[w.id],_=w.uniforms,I=w.__cache;i.bindBuffer(i.UNIFORM_BUFFER,S);for(let T=0,A=_.length;T<A;T++){let C=Array.isArray(_[T])?_[T]:[_[T]];for(let b=0,x=C.length;b<x;b++){let R=C[b];if(m(R,T,b,I)===!0){let L=R.__offset,O=Array.isArray(R.value)?R.value:[R.value],B=0;for(let G=0;G<O.length;G++){let z=O[G],K=v(z);typeof z=="number"||typeof z=="boolean"?(R.__data[0]=z,i.bufferSubData(i.UNIFORM_BUFFER,L+B,R.__data)):z.isMatrix3?(R.__data[0]=z.elements[0],R.__data[1]=z.elements[1],R.__data[2]=z.elements[2],R.__data[3]=0,R.__data[4]=z.elements[3],R.__data[5]=z.elements[4],R.__data[6]=z.elements[5],R.__data[7]=0,R.__data[8]=z.elements[6],R.__data[9]=z.elements[7],R.__data[10]=z.elements[8],R.__data[11]=0):(z.toArray(R.__data,B),B+=K.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,L,R.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(w,S,_,I){let T=w.value,A=S+"_"+_;if(I[A]===void 0)return typeof T=="number"||typeof T=="boolean"?I[A]=T:I[A]=T.clone(),!0;{let C=I[A];if(typeof T=="number"||typeof T=="boolean"){if(C!==T)return I[A]=T,!0}else if(C.equals(T)===!1)return C.copy(T),!0}return!1}function g(w){let S=w.uniforms,_=0,I=16;for(let A=0,C=S.length;A<C;A++){let b=Array.isArray(S[A])?S[A]:[S[A]];for(let x=0,R=b.length;x<R;x++){let L=b[x],O=Array.isArray(L.value)?L.value:[L.value];for(let B=0,G=O.length;B<G;B++){let z=O[B],K=v(z),W=_%I,j=W%K.boundary,ie=W+j;_+=j,ie!==0&&I-ie<K.storage&&(_+=I-ie),L.__data=new Float32Array(K.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=_,_+=K.storage}}}let T=_%I;return T>0&&(_+=I-T),w.__size=_,w.__cache={},this}function v(w){let S={boundary:0,storage:0};return typeof w=="number"||typeof w=="boolean"?(S.boundary=4,S.storage=4):w.isVector2?(S.boundary=8,S.storage=8):w.isVector3||w.isColor?(S.boundary=16,S.storage=12):w.isVector4?(S.boundary=16,S.storage=16):w.isMatrix3?(S.boundary=48,S.storage=48):w.isMatrix4?(S.boundary=64,S.storage=64):w.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",w),S}function p(w){let S=w.target;S.removeEventListener("dispose",p);let _=o.indexOf(S.__bindingPointIndex);o.splice(_,1),i.deleteBuffer(s[S.id]),delete s[S.id],delete r[S.id]}function d(){for(let w in s)i.deleteBuffer(s[w]);o=[],s={},r={}}return{bind:l,update:h,dispose:d}}var Mo=class{constructor(e={}){let{canvas:t=ip(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:h=!1,powerPreference:c="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:f=!1}=e;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=o;let g=new Uint32Array(4),v=new Int32Array(4),p=null,d=null,w=[],S=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=on,this.toneMapping=hi,this.toneMappingExposure=1;let _=this,I=!1,T=0,A=0,C=null,b=-1,x=null,R=new et,L=new et,O=null,B=new Me(0),G=0,z=t.width,K=t.height,W=1,j=null,ie=null,pe=new et(0,0,z,K),Ue=new et(0,0,z,K),$e=!1,Y=new er,ne=!1,_e=!1,oe=new We,Te=new We,Ie=new P,Fe=new et,ct={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ve=!1;function dt(){return C===null?W:1}let F=n;function nn(M,D){return t.getContext(M,D)}try{let M={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:h,powerPreference:c,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine","three.js r170"),t.addEventListener("webglcontextlost",J,!1),t.addEventListener("webglcontextrestored",he,!1),t.addEventListener("webglcontextcreationerror",le,!1),F===null){let D="webgl2";if(F=nn(D,M),F===null)throw nn(D)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let Be,ke,Se,st,be,E,y,k,Z,Q,q,ye,ae,ue,He,ee,de,we,Ae,fe,ze,De,tt,U;function re(){Be=new m0(F),Be.init(),De=new Yx(F,Be),ke=new c0(F,Be,e,De),Se=new Wx(F,Be),ke.reverseDepthBuffer&&f&&Se.buffers.depth.setReversed(!0),st=new _0(F),be=new Px,E=new qx(F,Be,Se,be,ke,De,st),y=new u0(_),k=new p0(_),Z=new Ep(F),tt=new a0(F,Z),Q=new g0(F,Z,st,tt),q=new v0(F,Q,Z,st),Ae=new y0(F,ke,E),ee=new h0(be),ye=new Ix(_,y,k,Be,ke,tt,ee),ae=new Qx(_,be),ue=new Ux,He=new kx(Be),we=new o0(_,y,k,Se,q,m,l),de=new Hx(_,q,ke),U=new jx(F,st,ke,Se),fe=new l0(F,Be,st),ze=new x0(F,Be,st),st.programs=ye.programs,_.capabilities=ke,_.extensions=Be,_.properties=be,_.renderLists=ue,_.shadowMap=de,_.state=Se,_.info=st}re();let X=new Ql(_,F);this.xr=X,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){let M=Be.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){let M=Be.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return W},this.setPixelRatio=function(M){M!==void 0&&(W=M,this.setSize(z,K,!1))},this.getSize=function(M){return M.set(z,K)},this.setSize=function(M,D,V=!0){if(X.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}z=M,K=D,t.width=Math.floor(M*W),t.height=Math.floor(D*W),V===!0&&(t.style.width=M+"px",t.style.height=D+"px"),this.setViewport(0,0,M,D)},this.getDrawingBufferSize=function(M){return M.set(z*W,K*W).floor()},this.setDrawingBufferSize=function(M,D,V){z=M,K=D,W=V,t.width=Math.floor(M*V),t.height=Math.floor(D*V),this.setViewport(0,0,M,D)},this.getCurrentViewport=function(M){return M.copy(R)},this.getViewport=function(M){return M.copy(pe)},this.setViewport=function(M,D,V,H){M.isVector4?pe.set(M.x,M.y,M.z,M.w):pe.set(M,D,V,H),Se.viewport(R.copy(pe).multiplyScalar(W).round())},this.getScissor=function(M){return M.copy(Ue)},this.setScissor=function(M,D,V,H){M.isVector4?Ue.set(M.x,M.y,M.z,M.w):Ue.set(M,D,V,H),Se.scissor(L.copy(Ue).multiplyScalar(W).round())},this.getScissorTest=function(){return $e},this.setScissorTest=function(M){Se.setScissorTest($e=M)},this.setOpaqueSort=function(M){j=M},this.setTransparentSort=function(M){ie=M},this.getClearColor=function(M){return M.copy(we.getClearColor())},this.setClearColor=function(){we.setClearColor.apply(we,arguments)},this.getClearAlpha=function(){return we.getClearAlpha()},this.setClearAlpha=function(){we.setClearAlpha.apply(we,arguments)},this.clear=function(M=!0,D=!0,V=!0){let H=0;if(M){let N=!1;if(C!==null){let te=C.texture.format;N=te===vc||te===yc||te===_c}if(N){let te=C.texture.type,ce=te===$n||te===Di||te===Qs||te===gs||te===mc||te===gc,me=we.getClearColor(),ge=we.getClearAlpha(),Ce=me.r,Le=me.g,xe=me.b;ce?(g[0]=Ce,g[1]=Le,g[2]=xe,g[3]=ge,F.clearBufferuiv(F.COLOR,0,g)):(v[0]=Ce,v[1]=Le,v[2]=xe,v[3]=ge,F.clearBufferiv(F.COLOR,0,v))}else H|=F.COLOR_BUFFER_BIT}D&&(H|=F.DEPTH_BUFFER_BIT),V&&(H|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F.clear(H)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",J,!1),t.removeEventListener("webglcontextrestored",he,!1),t.removeEventListener("webglcontextcreationerror",le,!1),ue.dispose(),He.dispose(),be.dispose(),y.dispose(),k.dispose(),q.dispose(),tt.dispose(),U.dispose(),ye.dispose(),X.dispose(),X.removeEventListener("sessionstart",lh),X.removeEventListener("sessionend",ch),vi.stop()};function J(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),I=!0}function he(){console.log("THREE.WebGLRenderer: Context Restored."),I=!1;let M=st.autoReset,D=de.enabled,V=de.autoUpdate,H=de.needsUpdate,N=de.type;re(),st.autoReset=M,de.enabled=D,de.autoUpdate=V,de.needsUpdate=H,de.type=N}function le(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function Pe(M){let D=M.target;D.removeEventListener("dispose",Pe),ht(D)}function ht(M){Tt(M),be.remove(M)}function Tt(M){let D=be.get(M).programs;D!==void 0&&(D.forEach(function(V){ye.releaseProgram(V)}),M.isShaderMaterial&&ye.releaseShaderCache(M))}this.renderBufferDirect=function(M,D,V,H,N,te){D===null&&(D=ct);let ce=N.isMesh&&N.matrixWorld.determinant()<0,me=zd(M,D,V,H,N);Se.setMaterial(H,ce);let ge=V.index,Ce=1;if(H.wireframe===!0){if(ge=Q.getWireframeAttribute(V),ge===void 0)return;Ce=2}let Le=V.drawRange,xe=V.attributes.position,Xe=Le.start*Ce,nt=(Le.start+Le.count)*Ce;te!==null&&(Xe=Math.max(Xe,te.start*Ce),nt=Math.min(nt,(te.start+te.count)*Ce)),ge!==null?(Xe=Math.max(Xe,0),nt=Math.min(nt,ge.count)):xe!=null&&(Xe=Math.max(Xe,0),nt=Math.min(nt,xe.count));let rt=nt-Xe;if(rt<0||rt===1/0)return;tt.setup(N,H,me,V,ge);let kt,Ze=fe;if(ge!==null&&(kt=Z.get(ge),Ze=ze,Ze.setIndex(kt)),N.isMesh)H.wireframe===!0?(Se.setLineWidth(H.wireframeLinewidth*dt()),Ze.setMode(F.LINES)):Ze.setMode(F.TRIANGLES);else if(N.isLine){let ve=H.linewidth;ve===void 0&&(ve=1),Se.setLineWidth(ve*dt()),N.isLineSegments?Ze.setMode(F.LINES):N.isLineLoop?Ze.setMode(F.LINE_LOOP):Ze.setMode(F.LINE_STRIP)}else N.isPoints?Ze.setMode(F.POINTS):N.isSprite&&Ze.setMode(F.TRIANGLES);if(N.isBatchedMesh)if(N._multiDrawInstances!==null)Ze.renderMultiDrawInstances(N._multiDrawStarts,N._multiDrawCounts,N._multiDrawCount,N._multiDrawInstances);else if(Be.get("WEBGL_multi_draw"))Ze.renderMultiDraw(N._multiDrawStarts,N._multiDrawCounts,N._multiDrawCount);else{let ve=N._multiDrawStarts,Bn=N._multiDrawCounts,Je=N._multiDrawCount,un=ge?Z.get(ge).bytesPerElement:1,Xi=be.get(H).currentProgram.getUniforms();for(let Xt=0;Xt<Je;Xt++)Xi.setValue(F,"_gl_DrawID",Xt),Ze.render(ve[Xt]/un,Bn[Xt])}else if(N.isInstancedMesh)Ze.renderInstances(Xe,rt,N.count);else if(V.isInstancedBufferGeometry){let ve=V._maxInstanceCount!==void 0?V._maxInstanceCount:1/0,Bn=Math.min(V.instanceCount,ve);Ze.renderInstances(Xe,rt,Bn)}else Ze.render(Xe,rt)};function Qe(M,D,V){M.transparent===!0&&M.side===mn&&M.forceSinglePass===!1?(M.side=Gt,M.needsUpdate=!0,Er(M,D,V),M.side=ui,M.needsUpdate=!0,Er(M,D,V),M.side=mn):Er(M,D,V)}this.compile=function(M,D,V=null){V===null&&(V=M),d=He.get(V),d.init(D),S.push(d),V.traverseVisible(function(N){N.isLight&&N.layers.test(D.layers)&&(d.pushLight(N),N.castShadow&&d.pushShadow(N))}),M!==V&&M.traverseVisible(function(N){N.isLight&&N.layers.test(D.layers)&&(d.pushLight(N),N.castShadow&&d.pushShadow(N))}),d.setupLights();let H=new Set;return M.traverse(function(N){if(!(N.isMesh||N.isPoints||N.isLine||N.isSprite))return;let te=N.material;if(te)if(Array.isArray(te))for(let ce=0;ce<te.length;ce++){let me=te[ce];Qe(me,V,N),H.add(me)}else Qe(te,V,N),H.add(te)}),S.pop(),d=null,H},this.compileAsync=function(M,D,V=null){let H=this.compile(M,D,V);return new Promise(N=>{function te(){if(H.forEach(function(ce){be.get(ce).currentProgram.isReady()&&H.delete(ce)}),H.size===0){N(M);return}setTimeout(te,10)}Be.get("KHR_parallel_shader_compile")!==null?te():setTimeout(te,10)})};let hn=null;function On(M){hn&&hn(M)}function lh(){vi.stop()}function ch(){vi.start()}let vi=new Xu;vi.setAnimationLoop(On),typeof self<"u"&&vi.setContext(self),this.setAnimationLoop=function(M){hn=M,X.setAnimationLoop(M),M===null?vi.stop():vi.start()},X.addEventListener("sessionstart",lh),X.addEventListener("sessionend",ch),this.render=function(M,D){if(D!==void 0&&D.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),D.parent===null&&D.matrixWorldAutoUpdate===!0&&D.updateMatrixWorld(),X.enabled===!0&&X.isPresenting===!0&&(X.cameraAutoUpdate===!0&&X.updateCamera(D),D=X.getCamera()),M.isScene===!0&&M.onBeforeRender(_,M,D,C),d=He.get(M,S.length),d.init(D),S.push(d),Te.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),Y.setFromProjectionMatrix(Te),_e=this.localClippingEnabled,ne=ee.init(this.clippingPlanes,_e),p=ue.get(M,w.length),p.init(),w.push(p),X.enabled===!0&&X.isPresenting===!0){let te=_.xr.getDepthSensingMesh();te!==null&&da(te,D,-1/0,_.sortObjects)}da(M,D,0,_.sortObjects),p.finish(),_.sortObjects===!0&&p.sort(j,ie),Ve=X.enabled===!1||X.isPresenting===!1||X.hasDepthSensing()===!1,Ve&&we.addToRenderList(p,M),this.info.render.frame++,ne===!0&&ee.beginShadows();let V=d.state.shadowsArray;de.render(V,M,D),ne===!0&&ee.endShadows(),this.info.autoReset===!0&&this.info.reset();let H=p.opaque,N=p.transmissive;if(d.setupLights(),D.isArrayCamera){let te=D.cameras;if(N.length>0)for(let ce=0,me=te.length;ce<me;ce++){let ge=te[ce];uh(H,N,M,ge)}Ve&&we.render(M);for(let ce=0,me=te.length;ce<me;ce++){let ge=te[ce];hh(p,M,ge,ge.viewport)}}else N.length>0&&uh(H,N,M,D),Ve&&we.render(M),hh(p,M,D);C!==null&&(E.updateMultisampleRenderTarget(C),E.updateRenderTargetMipmap(C)),M.isScene===!0&&M.onAfterRender(_,M,D),tt.resetDefaultState(),b=-1,x=null,S.pop(),S.length>0?(d=S[S.length-1],ne===!0&&ee.setGlobalState(_.clippingPlanes,d.state.camera)):d=null,w.pop(),w.length>0?p=w[w.length-1]:p=null};function da(M,D,V,H){if(M.visible===!1)return;if(M.layers.test(D.layers)){if(M.isGroup)V=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(D);else if(M.isLight)d.pushLight(M),M.castShadow&&d.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||Y.intersectsSprite(M)){H&&Fe.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Te);let ce=q.update(M),me=M.material;me.visible&&p.push(M,ce,me,V,Fe.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||Y.intersectsObject(M))){let ce=q.update(M),me=M.material;if(H&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Fe.copy(M.boundingSphere.center)):(ce.boundingSphere===null&&ce.computeBoundingSphere(),Fe.copy(ce.boundingSphere.center)),Fe.applyMatrix4(M.matrixWorld).applyMatrix4(Te)),Array.isArray(me)){let ge=ce.groups;for(let Ce=0,Le=ge.length;Ce<Le;Ce++){let xe=ge[Ce],Xe=me[xe.materialIndex];Xe&&Xe.visible&&p.push(M,ce,Xe,V,Fe.z,xe)}}else me.visible&&p.push(M,ce,me,V,Fe.z,null)}}let te=M.children;for(let ce=0,me=te.length;ce<me;ce++)da(te[ce],D,V,H)}function hh(M,D,V,H){let N=M.opaque,te=M.transmissive,ce=M.transparent;d.setupLightsView(V),ne===!0&&ee.setGlobalState(_.clippingPlanes,V),H&&Se.viewport(R.copy(H)),N.length>0&&wr(N,D,V),te.length>0&&wr(te,D,V),ce.length>0&&wr(ce,D,V),Se.buffers.depth.setTest(!0),Se.buffers.depth.setMask(!0),Se.buffers.color.setMask(!0),Se.setPolygonOffset(!1)}function uh(M,D,V,H){if((V.isScene===!0?V.overrideMaterial:null)!==null)return;d.state.transmissionRenderTarget[H.id]===void 0&&(d.state.transmissionRenderTarget[H.id]=new Zn(1,1,{generateMipmaps:!0,type:Be.has("EXT_color_buffer_half_float")||Be.has("EXT_color_buffer_float")?ir:$n,minFilter:Ui,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ge.workingColorSpace}));let te=d.state.transmissionRenderTarget[H.id],ce=H.viewport||R;te.setSize(ce.z,ce.w);let me=_.getRenderTarget();_.setRenderTarget(te),_.getClearColor(B),G=_.getClearAlpha(),G<1&&_.setClearColor(16777215,.5),_.clear(),Ve&&we.render(V);let ge=_.toneMapping;_.toneMapping=hi;let Ce=H.viewport;if(H.viewport!==void 0&&(H.viewport=void 0),d.setupLightsView(H),ne===!0&&ee.setGlobalState(_.clippingPlanes,H),wr(M,V,H),E.updateMultisampleRenderTarget(te),E.updateRenderTargetMipmap(te),Be.has("WEBGL_multisampled_render_to_texture")===!1){let Le=!1;for(let xe=0,Xe=D.length;xe<Xe;xe++){let nt=D[xe],rt=nt.object,kt=nt.geometry,Ze=nt.material,ve=nt.group;if(Ze.side===mn&&rt.layers.test(H.layers)){let Bn=Ze.side;Ze.side=Gt,Ze.needsUpdate=!0,dh(rt,V,H,kt,Ze,ve),Ze.side=Bn,Ze.needsUpdate=!0,Le=!0}}Le===!0&&(E.updateMultisampleRenderTarget(te),E.updateRenderTargetMipmap(te))}_.setRenderTarget(me),_.setClearColor(B,G),Ce!==void 0&&(H.viewport=Ce),_.toneMapping=ge}function wr(M,D,V){let H=D.isScene===!0?D.overrideMaterial:null;for(let N=0,te=M.length;N<te;N++){let ce=M[N],me=ce.object,ge=ce.geometry,Ce=H===null?ce.material:H,Le=ce.group;me.layers.test(V.layers)&&dh(me,D,V,ge,Ce,Le)}}function dh(M,D,V,H,N,te){M.onBeforeRender(_,D,V,H,N,te),M.modelViewMatrix.multiplyMatrices(V.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),N.onBeforeRender(_,D,V,H,M,te),N.transparent===!0&&N.side===mn&&N.forceSinglePass===!1?(N.side=Gt,N.needsUpdate=!0,_.renderBufferDirect(V,D,H,N,M,te),N.side=ui,N.needsUpdate=!0,_.renderBufferDirect(V,D,H,N,M,te),N.side=mn):_.renderBufferDirect(V,D,H,N,M,te),M.onAfterRender(_,D,V,H,N,te)}function Er(M,D,V){D.isScene!==!0&&(D=ct);let H=be.get(M),N=d.state.lights,te=d.state.shadowsArray,ce=N.state.version,me=ye.getParameters(M,N.state,te,D,V),ge=ye.getProgramCacheKey(me),Ce=H.programs;H.environment=M.isMeshStandardMaterial?D.environment:null,H.fog=D.fog,H.envMap=(M.isMeshStandardMaterial?k:y).get(M.envMap||H.environment),H.envMapRotation=H.environment!==null&&M.envMap===null?D.environmentRotation:M.envMapRotation,Ce===void 0&&(M.addEventListener("dispose",Pe),Ce=new Map,H.programs=Ce);let Le=Ce.get(ge);if(Le!==void 0){if(H.currentProgram===Le&&H.lightsStateVersion===ce)return ph(M,me),Le}else me.uniforms=ye.getUniforms(M),M.onBeforeCompile(me,_),Le=ye.acquireProgram(me,ge),Ce.set(ge,Le),H.uniforms=me.uniforms;let xe=H.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(xe.clippingPlanes=ee.uniform),ph(M,me),H.needsLights=Hd(M),H.lightsStateVersion=ce,H.needsLights&&(xe.ambientLightColor.value=N.state.ambient,xe.lightProbe.value=N.state.probe,xe.directionalLights.value=N.state.directional,xe.directionalLightShadows.value=N.state.directionalShadow,xe.spotLights.value=N.state.spot,xe.spotLightShadows.value=N.state.spotShadow,xe.rectAreaLights.value=N.state.rectArea,xe.ltc_1.value=N.state.rectAreaLTC1,xe.ltc_2.value=N.state.rectAreaLTC2,xe.pointLights.value=N.state.point,xe.pointLightShadows.value=N.state.pointShadow,xe.hemisphereLights.value=N.state.hemi,xe.directionalShadowMap.value=N.state.directionalShadowMap,xe.directionalShadowMatrix.value=N.state.directionalShadowMatrix,xe.spotShadowMap.value=N.state.spotShadowMap,xe.spotLightMatrix.value=N.state.spotLightMatrix,xe.spotLightMap.value=N.state.spotLightMap,xe.pointShadowMap.value=N.state.pointShadowMap,xe.pointShadowMatrix.value=N.state.pointShadowMatrix),H.currentProgram=Le,H.uniformsList=null,Le}function fh(M){if(M.uniformsList===null){let D=M.currentProgram.getUniforms();M.uniformsList=ds.seqWithValue(D.seq,M.uniforms)}return M.uniformsList}function ph(M,D){let V=be.get(M);V.outputColorSpace=D.outputColorSpace,V.batching=D.batching,V.batchingColor=D.batchingColor,V.instancing=D.instancing,V.instancingColor=D.instancingColor,V.instancingMorph=D.instancingMorph,V.skinning=D.skinning,V.morphTargets=D.morphTargets,V.morphNormals=D.morphNormals,V.morphColors=D.morphColors,V.morphTargetsCount=D.morphTargetsCount,V.numClippingPlanes=D.numClippingPlanes,V.numIntersection=D.numClipIntersection,V.vertexAlphas=D.vertexAlphas,V.vertexTangents=D.vertexTangents,V.toneMapping=D.toneMapping}function zd(M,D,V,H,N){D.isScene!==!0&&(D=ct),E.resetTextureUnits();let te=D.fog,ce=H.isMeshStandardMaterial?D.environment:null,me=C===null?_.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:bs,ge=(H.isMeshStandardMaterial?k:y).get(H.envMap||ce),Ce=H.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,Le=!!V.attributes.tangent&&(!!H.normalMap||H.anisotropy>0),xe=!!V.morphAttributes.position,Xe=!!V.morphAttributes.normal,nt=!!V.morphAttributes.color,rt=hi;H.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(rt=_.toneMapping);let kt=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,Ze=kt!==void 0?kt.length:0,ve=be.get(H),Bn=d.state.lights;if(ne===!0&&(_e===!0||M!==x)){let sn=M===x&&H.id===b;ee.setState(H,M,sn)}let Je=!1;H.version===ve.__version?(ve.needsLights&&ve.lightsStateVersion!==Bn.state.version||ve.outputColorSpace!==me||N.isBatchedMesh&&ve.batching===!1||!N.isBatchedMesh&&ve.batching===!0||N.isBatchedMesh&&ve.batchingColor===!0&&N.colorTexture===null||N.isBatchedMesh&&ve.batchingColor===!1&&N.colorTexture!==null||N.isInstancedMesh&&ve.instancing===!1||!N.isInstancedMesh&&ve.instancing===!0||N.isSkinnedMesh&&ve.skinning===!1||!N.isSkinnedMesh&&ve.skinning===!0||N.isInstancedMesh&&ve.instancingColor===!0&&N.instanceColor===null||N.isInstancedMesh&&ve.instancingColor===!1&&N.instanceColor!==null||N.isInstancedMesh&&ve.instancingMorph===!0&&N.morphTexture===null||N.isInstancedMesh&&ve.instancingMorph===!1&&N.morphTexture!==null||ve.envMap!==ge||H.fog===!0&&ve.fog!==te||ve.numClippingPlanes!==void 0&&(ve.numClippingPlanes!==ee.numPlanes||ve.numIntersection!==ee.numIntersection)||ve.vertexAlphas!==Ce||ve.vertexTangents!==Le||ve.morphTargets!==xe||ve.morphNormals!==Xe||ve.morphColors!==nt||ve.toneMapping!==rt||ve.morphTargetsCount!==Ze)&&(Je=!0):(Je=!0,ve.__version=H.version);let un=ve.currentProgram;Je===!0&&(un=Er(H,D,N));let Xi=!1,Xt=!1,Us=!1,ot=un.getUniforms(),In=ve.uniforms;if(Se.useProgram(un.program)&&(Xi=!0,Xt=!0,Us=!0),H.id!==b&&(b=H.id,Xt=!0),Xi||x!==M){Se.buffers.depth.getReversed()?(oe.copy(M.projectionMatrix),rp(oe),op(oe),ot.setValue(F,"projectionMatrix",oe)):ot.setValue(F,"projectionMatrix",M.projectionMatrix),ot.setValue(F,"viewMatrix",M.matrixWorldInverse);let ei=ot.map.cameraPosition;ei!==void 0&&ei.setValue(F,Ie.setFromMatrixPosition(M.matrixWorld)),ke.logarithmicDepthBuffer&&ot.setValue(F,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshLambertMaterial||H.isMeshBasicMaterial||H.isMeshStandardMaterial||H.isShaderMaterial)&&ot.setValue(F,"isOrthographic",M.isOrthographicCamera===!0),x!==M&&(x=M,Xt=!0,Us=!0)}if(N.isSkinnedMesh){ot.setOptional(F,N,"bindMatrix"),ot.setOptional(F,N,"bindMatrixInverse");let sn=N.skeleton;sn&&(sn.boneTexture===null&&sn.computeBoneTexture(),ot.setValue(F,"boneTexture",sn.boneTexture,E))}N.isBatchedMesh&&(ot.setOptional(F,N,"batchingTexture"),ot.setValue(F,"batchingTexture",N._matricesTexture,E),ot.setOptional(F,N,"batchingIdTexture"),ot.setValue(F,"batchingIdTexture",N._indirectTexture,E),ot.setOptional(F,N,"batchingColorTexture"),N._colorsTexture!==null&&ot.setValue(F,"batchingColorTexture",N._colorsTexture,E));let Ds=V.morphAttributes;if((Ds.position!==void 0||Ds.normal!==void 0||Ds.color!==void 0)&&Ae.update(N,V,un),(Xt||ve.receiveShadow!==N.receiveShadow)&&(ve.receiveShadow=N.receiveShadow,ot.setValue(F,"receiveShadow",N.receiveShadow)),H.isMeshGouraudMaterial&&H.envMap!==null&&(In.envMap.value=ge,In.flipEnvMap.value=ge.isCubeTexture&&ge.isRenderTargetTexture===!1?-1:1),H.isMeshStandardMaterial&&H.envMap===null&&D.environment!==null&&(In.envMapIntensity.value=D.environmentIntensity),Xt&&(ot.setValue(F,"toneMappingExposure",_.toneMappingExposure),ve.needsLights&&Vd(In,Us),te&&H.fog===!0&&ae.refreshFogUniforms(In,te),ae.refreshMaterialUniforms(In,H,W,K,d.state.transmissionRenderTarget[M.id]),ds.upload(F,fh(ve),In,E)),H.isShaderMaterial&&H.uniformsNeedUpdate===!0&&(ds.upload(F,fh(ve),In,E),H.uniformsNeedUpdate=!1),H.isSpriteMaterial&&ot.setValue(F,"center",N.center),ot.setValue(F,"modelViewMatrix",N.modelViewMatrix),ot.setValue(F,"normalMatrix",N.normalMatrix),ot.setValue(F,"modelMatrix",N.matrixWorld),H.isShaderMaterial||H.isRawShaderMaterial){let sn=H.uniformsGroups;for(let ei=0,ti=sn.length;ei<ti;ei++){let mh=sn[ei];U.update(mh,un),U.bind(mh,un)}}return un}function Vd(M,D){M.ambientLightColor.needsUpdate=D,M.lightProbe.needsUpdate=D,M.directionalLights.needsUpdate=D,M.directionalLightShadows.needsUpdate=D,M.pointLights.needsUpdate=D,M.pointLightShadows.needsUpdate=D,M.spotLights.needsUpdate=D,M.spotLightShadows.needsUpdate=D,M.rectAreaLights.needsUpdate=D,M.hemisphereLights.needsUpdate=D}function Hd(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return T},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(M,D,V){be.get(M.texture).__webglTexture=D,be.get(M.depthTexture).__webglTexture=V;let H=be.get(M);H.__hasExternalTextures=!0,H.__autoAllocateDepthBuffer=V===void 0,H.__autoAllocateDepthBuffer||Be.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),H.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(M,D){let V=be.get(M);V.__webglFramebuffer=D,V.__useDefaultFramebuffer=D===void 0},this.setRenderTarget=function(M,D=0,V=0){C=M,T=D,A=V;let H=!0,N=null,te=!1,ce=!1;if(M){let ge=be.get(M);if(ge.__useDefaultFramebuffer!==void 0)Se.bindFramebuffer(F.FRAMEBUFFER,null),H=!1;else if(ge.__webglFramebuffer===void 0)E.setupRenderTarget(M);else if(ge.__hasExternalTextures)E.rebindTextures(M,be.get(M.texture).__webglTexture,be.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let xe=M.depthTexture;if(ge.__boundDepthTexture!==xe){if(xe!==null&&be.has(xe)&&(M.width!==xe.image.width||M.height!==xe.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");E.setupDepthRenderbuffer(M)}}let Ce=M.texture;(Ce.isData3DTexture||Ce.isDataArrayTexture||Ce.isCompressedArrayTexture)&&(ce=!0);let Le=be.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Le[D])?N=Le[D][V]:N=Le[D],te=!0):M.samples>0&&E.useMultisampledRTT(M)===!1?N=be.get(M).__webglMultisampledFramebuffer:Array.isArray(Le)?N=Le[V]:N=Le,R.copy(M.viewport),L.copy(M.scissor),O=M.scissorTest}else R.copy(pe).multiplyScalar(W).floor(),L.copy(Ue).multiplyScalar(W).floor(),O=$e;if(Se.bindFramebuffer(F.FRAMEBUFFER,N)&&H&&Se.drawBuffers(M,N),Se.viewport(R),Se.scissor(L),Se.setScissorTest(O),te){let ge=be.get(M.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+D,ge.__webglTexture,V)}else if(ce){let ge=be.get(M.texture),Ce=D||0;F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,ge.__webglTexture,V||0,Ce)}b=-1},this.readRenderTargetPixels=function(M,D,V,H,N,te,ce){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let me=be.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ce!==void 0&&(me=me[ce]),me){Se.bindFramebuffer(F.FRAMEBUFFER,me);try{let ge=M.texture,Ce=ge.format,Le=ge.type;if(!ke.textureFormatReadable(Ce)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!ke.textureTypeReadable(Le)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}D>=0&&D<=M.width-H&&V>=0&&V<=M.height-N&&F.readPixels(D,V,H,N,De.convert(Ce),De.convert(Le),te)}finally{let ge=C!==null?be.get(C).__webglFramebuffer:null;Se.bindFramebuffer(F.FRAMEBUFFER,ge)}}},this.readRenderTargetPixelsAsync=async function(M,D,V,H,N,te,ce){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let me=be.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ce!==void 0&&(me=me[ce]),me){let ge=M.texture,Ce=ge.format,Le=ge.type;if(!ke.textureFormatReadable(Ce))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!ke.textureTypeReadable(Le))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(D>=0&&D<=M.width-H&&V>=0&&V<=M.height-N){Se.bindFramebuffer(F.FRAMEBUFFER,me);let xe=F.createBuffer();F.bindBuffer(F.PIXEL_PACK_BUFFER,xe),F.bufferData(F.PIXEL_PACK_BUFFER,te.byteLength,F.STREAM_READ),F.readPixels(D,V,H,N,De.convert(Ce),De.convert(Le),0);let Xe=C!==null?be.get(C).__webglFramebuffer:null;Se.bindFramebuffer(F.FRAMEBUFFER,Xe);let nt=F.fenceSync(F.SYNC_GPU_COMMANDS_COMPLETE,0);return F.flush(),await sp(F,nt,4),F.bindBuffer(F.PIXEL_PACK_BUFFER,xe),F.getBufferSubData(F.PIXEL_PACK_BUFFER,0,te),F.deleteBuffer(xe),F.deleteSync(nt),te}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(M,D=null,V=0){M.isTexture!==!0&&(Zs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),D=arguments[0]||null,M=arguments[1]);let H=Math.pow(2,-V),N=Math.floor(M.image.width*H),te=Math.floor(M.image.height*H),ce=D!==null?D.x:0,me=D!==null?D.y:0;E.setTexture2D(M,0),F.copyTexSubImage2D(F.TEXTURE_2D,V,0,0,ce,me,N,te),Se.unbindTexture()},this.copyTextureToTexture=function(M,D,V=null,H=null,N=0){M.isTexture!==!0&&(Zs("WebGLRenderer: copyTextureToTexture function signature has changed."),H=arguments[0]||null,M=arguments[1],D=arguments[2],N=arguments[3]||0,V=null);let te,ce,me,ge,Ce,Le,xe,Xe,nt,rt=M.isCompressedTexture?M.mipmaps[N]:M.image;V!==null?(te=V.max.x-V.min.x,ce=V.max.y-V.min.y,me=V.isBox3?V.max.z-V.min.z:1,ge=V.min.x,Ce=V.min.y,Le=V.isBox3?V.min.z:0):(te=rt.width,ce=rt.height,me=rt.depth||1,ge=0,Ce=0,Le=0),H!==null?(xe=H.x,Xe=H.y,nt=H.z):(xe=0,Xe=0,nt=0);let kt=De.convert(D.format),Ze=De.convert(D.type),ve;D.isData3DTexture?(E.setTexture3D(D,0),ve=F.TEXTURE_3D):D.isDataArrayTexture||D.isCompressedArrayTexture?(E.setTexture2DArray(D,0),ve=F.TEXTURE_2D_ARRAY):(E.setTexture2D(D,0),ve=F.TEXTURE_2D),F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,D.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,D.unpackAlignment);let Bn=F.getParameter(F.UNPACK_ROW_LENGTH),Je=F.getParameter(F.UNPACK_IMAGE_HEIGHT),un=F.getParameter(F.UNPACK_SKIP_PIXELS),Xi=F.getParameter(F.UNPACK_SKIP_ROWS),Xt=F.getParameter(F.UNPACK_SKIP_IMAGES);F.pixelStorei(F.UNPACK_ROW_LENGTH,rt.width),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,rt.height),F.pixelStorei(F.UNPACK_SKIP_PIXELS,ge),F.pixelStorei(F.UNPACK_SKIP_ROWS,Ce),F.pixelStorei(F.UNPACK_SKIP_IMAGES,Le);let Us=M.isDataArrayTexture||M.isData3DTexture,ot=D.isDataArrayTexture||D.isData3DTexture;if(M.isRenderTargetTexture||M.isDepthTexture){let In=be.get(M),Ds=be.get(D),sn=be.get(In.__renderTarget),ei=be.get(Ds.__renderTarget);Se.bindFramebuffer(F.READ_FRAMEBUFFER,sn.__webglFramebuffer),Se.bindFramebuffer(F.DRAW_FRAMEBUFFER,ei.__webglFramebuffer);for(let ti=0;ti<me;ti++)Us&&F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,be.get(M).__webglTexture,N,Le+ti),M.isDepthTexture?(ot&&F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,be.get(D).__webglTexture,N,nt+ti),F.blitFramebuffer(ge,Ce,te,ce,xe,Xe,te,ce,F.DEPTH_BUFFER_BIT,F.NEAREST)):ot?F.copyTexSubImage3D(ve,N,xe,Xe,nt+ti,ge,Ce,te,ce):F.copyTexSubImage2D(ve,N,xe,Xe,nt+ti,ge,Ce,te,ce);Se.bindFramebuffer(F.READ_FRAMEBUFFER,null),Se.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else ot?M.isDataTexture||M.isData3DTexture?F.texSubImage3D(ve,N,xe,Xe,nt,te,ce,me,kt,Ze,rt.data):D.isCompressedArrayTexture?F.compressedTexSubImage3D(ve,N,xe,Xe,nt,te,ce,me,kt,rt.data):F.texSubImage3D(ve,N,xe,Xe,nt,te,ce,me,kt,Ze,rt):M.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,N,xe,Xe,te,ce,kt,Ze,rt.data):M.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,N,xe,Xe,rt.width,rt.height,kt,rt.data):F.texSubImage2D(F.TEXTURE_2D,N,xe,Xe,te,ce,kt,Ze,rt);F.pixelStorei(F.UNPACK_ROW_LENGTH,Bn),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,Je),F.pixelStorei(F.UNPACK_SKIP_PIXELS,un),F.pixelStorei(F.UNPACK_SKIP_ROWS,Xi),F.pixelStorei(F.UNPACK_SKIP_IMAGES,Xt),N===0&&D.generateMipmaps&&F.generateMipmap(ve),Se.unbindTexture()},this.copyTextureToTexture3D=function(M,D,V=null,H=null,N=0){return M.isTexture!==!0&&(Zs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),V=arguments[0]||null,H=arguments[1]||null,M=arguments[2],D=arguments[3],N=arguments[4]||0),Zs('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(M,D,V,H,N)},this.initRenderTarget=function(M){be.get(M).__webglFramebuffer===void 0&&E.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?E.setTextureCube(M,0):M.isData3DTexture?E.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?E.setTexture2DArray(M,0):E.setTexture2D(M,0),Se.unbindTexture()},this.resetState=function(){T=0,A=0,C=null,Se.reset(),tt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return qn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorspace=Ge._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ge._getUnpackColorSpace()}};var bo=class i{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new Me(e),this.near=t,this.far=n}clone(){return new i(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},So=class extends Dt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Mt,this.environmentIntensity=1,this.environmentRotation=new Mt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var jl=class extends Kt{constructor(e=null,t=1,n=1,s,r,o,a,l,h=Zt,c=Zt,u,f){super(null,o,a,l,h,c,s,r,u,f),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var wo=class extends Jt{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},as=new We,Eu=new We,eo=[],Tu=new Jn,e_=new We,qs=new ft,Ys=new Ni,Oi=class extends ft{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new wo(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,e_)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Jn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,as),Tu.copy(e.boundingBox).applyMatrix4(as),this.boundingBox.union(Tu)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Ni),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,as),Ys.copy(e.boundingSphere).applyMatrix4(as),this.boundingSphere.union(Ys)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=e*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(e,t){let n=this.matrixWorld,s=this.count;if(qs.geometry=this.geometry,qs.material=this.material,qs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ys.copy(this.boundingSphere),Ys.applyMatrix4(n),e.ray.intersectsSphere(Ys)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,as),Eu.multiplyMatrices(n,as),qs.matrixWorld=Eu,qs.raycast(e,eo);for(let o=0,a=eo.length;o<a;o++){let l=eo[o];l.instanceId=r,l.object=this,t.push(l)}eo.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new wo(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new jl(new Float32Array(s*this.count),s,this.count,xc,Un));let r=this.morphTexture.source.data.data,o=0;for(let h=0;h<n.length;h++)o+=n[h];let a=this.geometry.morphTargetsRelative?1:1-o,l=s*e;r[l]=a,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}};var vs=class i extends Nt{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);let r=[],o=[],a=[],l=[],h=new P,c=new Oe;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let u=0,f=3;u<=t;u++,f+=3){let m=n+u/t*s;h.x=e*Math.cos(m),h.y=e*Math.sin(m),o.push(h.x,h.y,h.z),a.push(0,0,1),c.x=(o[f]/e+1)/2,c.y=(o[f+1]/e+1)/2,l.push(c.x,c.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new Ke(o,3)),this.setAttribute("normal",new Ke(a,3)),this.setAttribute("uv",new Ke(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.segments,e.thetaStart,e.thetaLength)}},Qt=class i extends Nt{constructor(e=1,t=1,n=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let h=this;s=Math.floor(s),r=Math.floor(r);let c=[],u=[],f=[],m=[],g=0,v=[],p=n/2,d=0;w(),o===!1&&(e>0&&S(!0),t>0&&S(!1)),this.setIndex(c),this.setAttribute("position",new Ke(u,3)),this.setAttribute("normal",new Ke(f,3)),this.setAttribute("uv",new Ke(m,2));function w(){let _=new P,I=new P,T=0,A=(t-e)/n;for(let C=0;C<=r;C++){let b=[],x=C/r,R=x*(t-e)+e;for(let L=0;L<=s;L++){let O=L/s,B=O*l+a,G=Math.sin(B),z=Math.cos(B);I.x=R*G,I.y=-x*n+p,I.z=R*z,u.push(I.x,I.y,I.z),_.set(G,A,z).normalize(),f.push(_.x,_.y,_.z),m.push(O,1-x),b.push(g++)}v.push(b)}for(let C=0;C<s;C++)for(let b=0;b<r;b++){let x=v[b][C],R=v[b+1][C],L=v[b+1][C+1],O=v[b][C+1];(e>0||b!==0)&&(c.push(x,R,O),T+=3),(t>0||b!==r-1)&&(c.push(R,L,O),T+=3)}h.addGroup(d,T,0),d+=T}function S(_){let I=g,T=new Oe,A=new P,C=0,b=_===!0?e:t,x=_===!0?1:-1;for(let L=1;L<=s;L++)u.push(0,p*x,0),f.push(0,x,0),m.push(.5,.5),g++;let R=g;for(let L=0;L<=s;L++){let B=L/s*l+a,G=Math.cos(B),z=Math.sin(B);A.x=b*z,A.y=p*x,A.z=b*G,u.push(A.x,A.y,A.z),f.push(0,x,0),T.x=G*.5+.5,T.y=z*.5*x+.5,m.push(T.x,T.y),g++}for(let L=0;L<s;L++){let O=I+L,B=R+L;_===!0?c.push(B,B+1,O):c.push(B+1,B,O),C+=3}h.addGroup(d,C,_===!0?1:2),d+=C}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},tr=class i extends Qt{constructor(e=1,t=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new i(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Eo=class i extends Nt{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};let r=[],o=[];a(s),h(n),c(),this.setAttribute("position",new Ke(r,3)),this.setAttribute("normal",new Ke(r.slice(),3)),this.setAttribute("uv",new Ke(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(w){let S=new P,_=new P,I=new P;for(let T=0;T<t.length;T+=3)m(t[T+0],S),m(t[T+1],_),m(t[T+2],I),l(S,_,I,w)}function l(w,S,_,I){let T=I+1,A=[];for(let C=0;C<=T;C++){A[C]=[];let b=w.clone().lerp(_,C/T),x=S.clone().lerp(_,C/T),R=T-C;for(let L=0;L<=R;L++)L===0&&C===T?A[C][L]=b:A[C][L]=b.clone().lerp(x,L/R)}for(let C=0;C<T;C++)for(let b=0;b<2*(T-C)-1;b++){let x=Math.floor(b/2);b%2===0?(f(A[C][x+1]),f(A[C+1][x]),f(A[C][x])):(f(A[C][x+1]),f(A[C+1][x+1]),f(A[C+1][x]))}}function h(w){let S=new P;for(let _=0;_<r.length;_+=3)S.x=r[_+0],S.y=r[_+1],S.z=r[_+2],S.normalize().multiplyScalar(w),r[_+0]=S.x,r[_+1]=S.y,r[_+2]=S.z}function c(){let w=new P;for(let S=0;S<r.length;S+=3){w.x=r[S+0],w.y=r[S+1],w.z=r[S+2];let _=p(w)/2/Math.PI+.5,I=d(w)/Math.PI+.5;o.push(_,1-I)}g(),u()}function u(){for(let w=0;w<o.length;w+=6){let S=o[w+0],_=o[w+2],I=o[w+4],T=Math.max(S,_,I),A=Math.min(S,_,I);T>.9&&A<.1&&(S<.2&&(o[w+0]+=1),_<.2&&(o[w+2]+=1),I<.2&&(o[w+4]+=1))}}function f(w){r.push(w.x,w.y,w.z)}function m(w,S){let _=w*3;S.x=e[_+0],S.y=e[_+1],S.z=e[_+2]}function g(){let w=new P,S=new P,_=new P,I=new P,T=new Oe,A=new Oe,C=new Oe;for(let b=0,x=0;b<r.length;b+=9,x+=6){w.set(r[b+0],r[b+1],r[b+2]),S.set(r[b+3],r[b+4],r[b+5]),_.set(r[b+6],r[b+7],r[b+8]),T.set(o[x+0],o[x+1]),A.set(o[x+2],o[x+3]),C.set(o[x+4],o[x+5]),I.copy(w).add(S).add(_).divideScalar(3);let R=p(I);v(T,x+0,w,R),v(A,x+2,S,R),v(C,x+4,_,R)}}function v(w,S,_,I){I<0&&w.x===1&&(o[S]=w.x-1),_.x===0&&_.z===0&&(o[S]=I/2/Math.PI+.5)}function p(w){return Math.atan2(w.z,-w.x)}function d(w){return Math.atan2(-w.y,Math.sqrt(w.x*w.x+w.z*w.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.vertices,e.indices,e.radius,e.details)}};var Kn=class i extends Eo{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}},To=class i extends Eo{constructor(e=1,t=0){let n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}};var Bi=class i extends Nt{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(o+a,Math.PI),h=0,c=[],u=new P,f=new P,m=[],g=[],v=[],p=[];for(let d=0;d<=n;d++){let w=[],S=d/n,_=0;d===0&&o===0?_=.5/t:d===n&&l===Math.PI&&(_=-.5/t);for(let I=0;I<=t;I++){let T=I/t;u.x=-e*Math.cos(s+T*r)*Math.sin(o+S*a),u.y=e*Math.cos(o+S*a),u.z=e*Math.sin(s+T*r)*Math.sin(o+S*a),g.push(u.x,u.y,u.z),f.copy(u).normalize(),v.push(f.x,f.y,f.z),p.push(T+_,1-S),w.push(h++)}c.push(w)}for(let d=0;d<n;d++)for(let w=0;w<t;w++){let S=c[d][w+1],_=c[d][w],I=c[d+1][w],T=c[d+1][w+1];(d!==0||o>0)&&m.push(S,_,T),(d!==n-1||l<Math.PI)&&m.push(_,I,T)}this.setIndex(m),this.setAttribute("position",new Ke(g,3)),this.setAttribute("normal",new Ke(v,3)),this.setAttribute("uv",new Ke(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Ao=class i extends Nt{constructor(e=1,t=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);let o=[],a=[],l=[],h=[],c=new P,u=new P,f=new P;for(let m=0;m<=n;m++)for(let g=0;g<=s;g++){let v=g/s*r,p=m/n*Math.PI*2;u.x=(e+t*Math.cos(p))*Math.cos(v),u.y=(e+t*Math.cos(p))*Math.sin(v),u.z=t*Math.sin(p),a.push(u.x,u.y,u.z),c.x=e*Math.cos(v),c.y=e*Math.sin(v),f.subVectors(u,c).normalize(),l.push(f.x,f.y,f.z),h.push(g/s),h.push(m/n)}for(let m=1;m<=n;m++)for(let g=1;g<=s;g++){let v=(s+1)*m+g-1,p=(s+1)*(m-1)+g-1,d=(s+1)*(m-1)+g,w=(s+1)*m+g;o.push(v,p,w),o.push(p,d,w)}this.setIndex(o),this.setAttribute("position",new Ke(a,3)),this.setAttribute("normal",new Ke(l,3)),this.setAttribute("uv",new Ke(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var Co=class extends fi{static get type(){return"MeshPhongMaterial"}constructor(e){super(),this.isMeshPhongMaterial=!0,this.color=new Me(16777215),this.specular=new Me(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Me(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Mc,this.normalScale=new Oe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Mt,this.combine=Do,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.specular.copy(e.specular),this.shininess=e.shininess,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Nn=class extends fi{static get type(){return"MeshLambertMaterial"}constructor(e){super(),this.isMeshLambertMaterial=!0,this.color=new Me(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Me(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Mc,this.normalScale=new Oe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Mt,this.combine=Do,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};function to(i,e,t){return!i||!t&&i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function t_(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var Ms=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];e:{t:{let o;n:{i:if(!(e<s)){for(let a=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=t[++n],e<s)break t}o=t.length;break n}if(!(e>=r)){let a=t[1];e<a&&(n=2,r=a);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break t}o=n,n=0;break n}break e}for(;n<o;){let a=n+o>>>1;e<t[a]?o=a:n=a+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=n[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},ec=class extends Ms{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Rh,endingEnd:Rh}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case Ih:r=e,a=2*t-n;break;case Ph:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Ih:o=e,l=2*n-t;break;case Ph:o=1,l=n+s[1]-s[0];break;default:o=e-1,l=t}let h=(n-t)*.5,c=this.valueSize;this._weightPrev=h/(t-a),this._weightNext=h/(l-n),this._offsetPrev=r*c,this._offsetNext=o*c}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,h=l-a,c=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,m=this._weightNext,g=(n-t)/(s-t),v=g*g,p=v*g,d=-f*p+2*f*v-f*g,w=(1+f)*p+(-1.5-2*f)*v+(-.5+f)*g+1,S=(-1-m)*p+(1.5+m)*v+.5*g,_=m*p-m*v;for(let I=0;I!==a;++I)r[I]=d*o[c+I]+w*o[h+I]+S*o[l+I]+_*o[u+I];return r}},tc=class extends Ms{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,h=l-a,c=(n-t)/(s-t),u=1-c;for(let f=0;f!==a;++f)r[f]=o[h+f]*u+o[l+f]*c;return r}},nc=class extends Ms{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},_n=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=to(t,this.TimeBufferType),this.values=to(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:to(e.times,Array),values:to(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new nc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new tc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new ec(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case lo:t=this.InterpolantFactoryMethodDiscrete;break;case Dl:t=this.InterpolantFactoryMethodLinear;break;case _a:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return lo;case this.InterpolantFactoryMethodLinear:return Dl;case this.InterpolantFactoryMethodSmooth:return _a}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<e;)++r;for(;o!==-1&&n[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let l=n[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(s!==void 0&&t_(s))for(let a=0,l=s.length;a!==l;++a){let h=s[a];if(isNaN(h)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,h),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===_a,r=e.length-1,o=1;for(let a=1;a<r;++a){let l=!1,h=e[a],c=e[a+1];if(h!==c&&(a!==1||h!==e[0]))if(s)l=!0;else{let u=a*n,f=u-n,m=u+n;for(let g=0;g!==n;++g){let v=t[u+g];if(v!==t[f+g]||v!==t[m+g]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let u=a*n,f=o*n;for(let m=0;m!==n;++m)t[f+m]=t[u+m]}++o}}if(r>0){e[o]=e[r];for(let a=r*n,l=o*n,h=0;h!==n;++h)t[l+h]=t[a+h];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};_n.prototype.TimeBufferType=Float32Array;_n.prototype.ValueBufferType=Float32Array;_n.prototype.DefaultInterpolation=Dl;var ki=class extends _n{constructor(e,t,n){super(e,t,n)}};ki.prototype.ValueTypeName="bool";ki.prototype.ValueBufferType=Array;ki.prototype.DefaultInterpolation=lo;ki.prototype.InterpolantFactoryMethodLinear=void 0;ki.prototype.InterpolantFactoryMethodSmooth=void 0;var ic=class extends _n{};ic.prototype.ValueTypeName="color";var sc=class extends _n{};sc.prototype.ValueTypeName="number";var rc=class extends Ms{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(n-t)/(s-t),h=e*a;for(let c=h+a;h!==c;h+=4)Wt.slerpFlat(r,0,o,h-a,o,h,l);return r}},Ro=class extends _n{InterpolantFactoryMethodLinear(e){return new rc(this.times,this.values,this.getValueSize(),e)}};Ro.prototype.ValueTypeName="quaternion";Ro.prototype.InterpolantFactoryMethodSmooth=void 0;var zi=class extends _n{constructor(e,t,n){super(e,t,n)}};zi.prototype.ValueTypeName="string";zi.prototype.ValueBufferType=Array;zi.prototype.DefaultInterpolation=lo;zi.prototype.InterpolantFactoryMethodLinear=void 0;zi.prototype.InterpolantFactoryMethodSmooth=void 0;var oc=class extends _n{};oc.prototype.ValueTypeName="vector";var ac=class{constructor(e,t,n){let s=this,r=!1,o=0,a=0,l,h=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(c){a++,r===!1&&s.onStart!==void 0&&s.onStart(c,o,a),r=!0},this.itemEnd=function(c){o++,s.onProgress!==void 0&&s.onProgress(c,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(c){s.onError!==void 0&&s.onError(c)},this.resolveURL=function(c){return l?l(c):c},this.setURLModifier=function(c){return l=c,this},this.addHandler=function(c,u){return h.push(c,u),this},this.removeHandler=function(c){let u=h.indexOf(c);return u!==-1&&h.splice(u,2),this},this.getHandler=function(c){for(let u=0,f=h.length;u<f;u+=2){let m=h[u],g=h[u+1];if(m.global&&(m.lastIndex=0),m.test(c))return g}return null}}},n_=new ac,lc=class{constructor(e){this.manager=e!==void 0?e:n_,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};lc.DEFAULT_MATERIAL_NAME="__DEFAULT";var nr=class extends Dt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Me(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},Io=class extends nr{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Dt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Me(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},Ya=new We,Au=new P,Cu=new P,Po=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Oe(512,512),this.map=null,this.mapPass=null,this.matrix=new We,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new er,this._frameExtents=new Oe(1,1),this._viewportCount=1,this._viewports=[new et(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;Au.setFromMatrixPosition(e.matrixWorld),t.position.copy(Au),Cu.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Cu),t.updateMatrixWorld(),Ya.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ya),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Ya)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var Ru=new We,$s=new P,$a=new P,cc=class extends Po{constructor(){super(new Rt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Oe(4,2),this._viewportCount=6,this._viewports=[new et(2,1,1,1),new et(0,1,1,1),new et(3,1,1,1),new et(1,1,1,1),new et(3,0,1,1),new et(1,0,1,1)],this._cubeDirections=[new P(1,0,0),new P(-1,0,0),new P(0,0,1),new P(0,0,-1),new P(0,1,0),new P(0,-1,0)],this._cubeUps=[new P(0,1,0),new P(0,1,0),new P(0,1,0),new P(0,1,0),new P(0,0,1),new P(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,s=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),$s.setFromMatrixPosition(e.matrixWorld),n.position.copy($s),$a.copy(n.position),$a.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt($a),n.updateMatrixWorld(),s.makeTranslation(-$s.x,-$s.y,-$s.z),Ru.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ru)}},Lo=class extends nr{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new cc}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},hc=class extends Po{constructor(){super(new _o(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Uo=class extends nr{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Dt.DEFAULT_UP),this.updateMatrix(),this.target=new Dt,this.shadow=new hc}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var Sc="\\[\\]\\.:\\/",i_=new RegExp("["+Sc+"]","g"),wc="[^"+Sc+"]",s_="[^"+Sc.replace("\\.","")+"]",r_=/((?:WC+[\/:])*)/.source.replace("WC",wc),o_=/(WCOD+)?/.source.replace("WCOD",s_),a_=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",wc),l_=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",wc),c_=new RegExp("^"+r_+o_+a_+l_+"$"),h_=["material","materials","bones","map"],uc=class{constructor(e,t,n){let s=n||at.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},at=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(i_,"")}static parseTrackName(e){let t=c_.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);h_.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let l=n(a.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let h=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let c=0;c<e.length;c++)if(e[c].name===h){h=c;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(h!==void 0){if(e[h]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[h]}}let o=e[s];if(o===void 0){let h=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+h+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};at.Composite=uc;at.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};at.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};at.prototype.GetterByBindingType=[at.prototype._getValue_direct,at.prototype._getValue_array,at.prototype._getValue_arrayElement,at.prototype._getValue_toArray];at.prototype.SetterByBindingTypeAndVersioning=[[at.prototype._setValue_direct,at.prototype._setValue_direct_setNeedsUpdate,at.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[at.prototype._setValue_array,at.prototype._setValue_array_setNeedsUpdate,at.prototype._setValue_array_setMatrixWorldNeedsUpdate],[at.prototype._setValue_arrayElement,at.prototype._setValue_arrayElement_setNeedsUpdate,at.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[at.prototype._setValue_fromArray,at.prototype._setValue_fromArray_setNeedsUpdate,at.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var tv=new Float32Array(1);typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"170"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="170");var Ec={en:{mResume:"Resume",mActions:"Actions",mSettings:"Settings",mControls:"Buttons",mPerson:"This person",mNextPerson:"Next person",mNextMap:"Next map",mPlay:"Play (my character)",mWatch:"Watch the world",mBack:"Back",mTitle:"World",aUse:"Use / talk",aRun:"Run",aEat:"Eat",aDrink:"Drink",aPickup:"Pick up food",aSleep:"Sleep / wake up",aTalk:"Talk",aZoomIn:"Zoom in",aZoomOut:"Zoom out",aThoughts:"Show / hide thoughts",aMenu:"Game menu",aPerson:"Person card",sThoughts:"Thoughts over heads",on:"On",off:"Off",sServer:"Server address",sUnpair:"Unpair this TV",cHelp:"Choose an action, press A / OK, then press the button you want for it.",cPad:"Controller",cRemote:"Remote",cPress:"Press the button for \u201C{0}\u201D\u2026 (Back cancels)",cSet:"{0} is now on {1}",cReset:"Back to the default buttons",cNone:"\u2014",cWatchNote:"In watch mode: Use = next person, Eat = next map, Sleep = person card.",dDrank:"You drank.",dPicked:"You picked up {0}.",dAte:"You ate.",dSleep:"You lie down to sleep. Move to wake up.",dWake:"You wake up.",dNoWater:"No water here: stand next to the water.",dNothing:"Nothing to do here.",dNoFood:"You carry no food.",dFull:"Your hands are full (5).",nFood:"food",nWater:"water",nRest:"rest",nFun:"company",nHp:"health",carry:"carrying {0}",iWood:"wood",iStone:"stone",iScrap:"scrap",iAxe:"an axe",iSpear:"a spear",has:"has {0}",wGatherWood:"gather wood",wGatherStone:"gather stone",wGatherScrap:"gather scrap",wAxe:"make an axe",wSpear:"make a spear",wFire:"build a campfire",wHut:"build a hut",wTend:"feed the fire",wStore:"collect food and store it",wLoot:"search the ruins",wFarm:"plant a field",wRepair:"repair the huts",mGoTo:"Go to someone",mGoToHelp:"Pick a person: your character appears next to them.",dTp:"You are next to {0}.",zHit:"You hit the zombie!",zKilled:"The zombie is down.",actFight:"Fighting a zombie",pAge:"{0} years",pMan:"Man",pWoman:"Woman",pChild:"child",pExpecting:"expecting a baby",pPartner:"Partner",pParents:"Parents",pChildren:"Children",pGen:"Generation {0}",pNone:"none",pDead:"Died",pMood:"Mood",pWants:"Wants to",pMemory:"Remembers",pSaid:"Said",pRecent:"Lately",pTraits:"Traits",pFirst:"first survivors",tStrength:"strength",tSpeed:"speed",tIntelligence:"intelligence",tCourage:"courage",tEmpathy:"empathy",tMetabolism:"appetite",tLifespan:"lifespan",bTo:"going to {0}",bWith:"with {0}",bWants:"wants: {0}",gDrink:"drink",gEat:"eat",gForage:"find food",gSleep:"sleep",gTalk:"talk",gWander:"walk around",gRest:"rest",gTravel:"travel",hintMenu:"+ / Back: menu",gameMenuItem:"Game menu",hMove:"Move",sayLabel:"Say something (empty = just say hello)",wFollow:"follow a person",wMap:"next map",wCard:"person card",mNearby:"Nearest person",sThoughtsOnly:"Only players the owner allows see thoughts.",mMe:"Me",dTalk:"You talk to them.",dNobody:"Nobody close enough.",sZoom:"Zoom",cPressed:"Pressed: {0}"},fr:{mResume:"Reprendre",mActions:"Actions",mSettings:"R\xE9glages",mControls:"Boutons",mPerson:"Cette personne",mNextPerson:"Personne suivante",mNextMap:"Carte suivante",mPlay:"Jouer (mon personnage)",mWatch:"Regarder le monde",mBack:"Retour",mTitle:"Monde",aUse:"Utiliser / parler",aRun:"Courir",aEat:"Manger",aDrink:"Boire",aPickup:"Ramasser de la nourriture",aSleep:"Dormir / se r\xE9veiller",aTalk:"Parler",aZoomIn:"Zoom avant",aZoomOut:"Zoom arri\xE8re",aThoughts:"Afficher / masquer les pens\xE9es",aMenu:"Menu du jeu",aPerson:"Fiche de la personne",sThoughts:"Pens\xE9es au-dessus des t\xEAtes",on:"Oui",off:"Non",sServer:"Adresse du serveur",sUnpair:"Dissocier cette TV",cHelp:"Choisissez une action, appuyez sur A / OK, puis sur le bouton voulu.",cPad:"Manette",cRemote:"T\xE9l\xE9commande",cPress:"Appuyez sur le bouton pour \xAB {0} \xBB\u2026 (Retour annule)",cSet:"{0} est maintenant sur {1}",cReset:"Revenir aux boutons par d\xE9faut",cNone:"\u2014",cWatchNote:"En mode regarder : Utiliser = personne suivante, Manger = carte suivante, Dormir = fiche.",dDrank:"Vous avez bu.",dPicked:"Vous avez ramass\xE9 {0}.",dAte:"Vous avez mang\xE9.",dSleep:"Vous vous allongez pour dormir. Bougez pour vous r\xE9veiller.",dWake:"Vous vous r\xE9veillez.",dNoWater:"Pas d\u2019eau ici : placez-vous au bord de l\u2019eau.",dNothing:"Rien \xE0 faire ici.",dNoFood:"Vous n\u2019avez pas de nourriture.",dFull:"Vos mains sont pleines (5).",nFood:"faim",nWater:"eau",nRest:"repos",nFun:"compagnie",nHp:"sant\xE9",carry:"porte {0}",iWood:"bois",iStone:"pierre",iScrap:"ferraille",iAxe:"une hache",iSpear:"une lance",has:"a {0}",wGatherWood:"ramasser du bois",wGatherStone:"ramasser des pierres",wGatherScrap:"chercher de la ferraille",wAxe:"fabriquer une hache",wSpear:"fabriquer une lance",wFire:"faire un feu de camp",wHut:"construire une cabane",wTend:"entretenir le feu",wStore:"ramasser de la nourriture et la stocker",wLoot:"fouiller les ruines",wFarm:"planter un champ",wRepair:"r\xE9parer les cabanes",mGoTo:"Aller vers quelqu\u2019un",mGoToHelp:"Choisissez une personne : votre personnage appara\xEEt \xE0 c\xF4t\xE9.",dTp:"Vous \xEAtes \xE0 c\xF4t\xE9 de {0}.",zHit:"Vous frappez le zombie !",zKilled:"Le zombie est \xE0 terre.",actFight:"Combat un zombie",pAge:"{0} ans",pMan:"Homme",pWoman:"Femme",pChild:"enfant",pExpecting:"attend un b\xE9b\xE9",pPartner:"Partenaire",pParents:"Parents",pChildren:"Enfants",pGen:"G\xE9n\xE9ration {0}",pNone:"aucun",pDead:"Mort",pMood:"Humeur",pWants:"Veut",pMemory:"Se souvient",pSaid:"A dit",pRecent:"Derni\xE8rement",pTraits:"Traits",pFirst:"premiers survivants",tStrength:"force",tSpeed:"vitesse",tIntelligence:"intelligence",tCourage:"courage",tEmpathy:"empathie",tMetabolism:"app\xE9tit",tLifespan:"esp\xE9rance de vie",bTo:"va vers {0}",bWith:"avec {0}",bWants:"veut : {0}",gDrink:"boire",gEat:"manger",gForage:"trouver \xE0 manger",gSleep:"dormir",gTalk:"parler",gWander:"se promener",gRest:"se reposer",gTravel:"voyager",hintMenu:"+ / Retour : menu",gameMenuItem:"Menu du jeu",hMove:"Bouger",sayLabel:"Dire quelque chose (vide = juste saluer)",wFollow:"suivre une personne",wMap:"carte suivante",wCard:"fiche",mNearby:"Personne la plus proche",sThoughtsOnly:"Seuls les joueurs autoris\xE9s par le propri\xE9taire voient les pens\xE9es.",mMe:"Moi",dTalk:"Vous lui parlez.",dNobody:"Personne assez pr\xE8s.",sZoom:"Zoom",cPressed:"Appuy\xE9 : {0}"},es:{mResume:"Continuar",mActions:"Acciones",mSettings:"Ajustes",mControls:"Botones",mPerson:"Esta persona",mNextPerson:"Siguiente persona",mNextMap:"Siguiente mapa",mPlay:"Jugar (mi personaje)",mWatch:"Mirar el mundo",mBack:"Atr\xE1s",mTitle:"Mundo",aUse:"Usar / hablar",aRun:"Correr",aEat:"Comer",aDrink:"Beber",aPickup:"Recoger comida",aSleep:"Dormir / despertar",aTalk:"Hablar",aZoomIn:"Acercar",aZoomOut:"Alejar",aThoughts:"Mostrar / ocultar pensamientos",aMenu:"Men\xFA del juego",aPerson:"Ficha de la persona",sThoughts:"Pensamientos sobre las cabezas",on:"S\xED",off:"No",sServer:"Direcci\xF3n del servidor",sUnpair:"Desvincular esta TV",cHelp:"Elige una acci\xF3n, pulsa A / OK y luego el bot\xF3n que quieras.",cPad:"Mando",cRemote:"Mando a distancia",cPress:"Pulsa el bot\xF3n para \xAB{0}\xBB\u2026 (Atr\xE1s cancela)",cSet:"{0} est\xE1 ahora en {1}",cReset:"Volver a los botones por defecto",cNone:"\u2014",cWatchNote:"En modo mirar: Usar = siguiente persona, Comer = siguiente mapa, Dormir = ficha.",dDrank:"Has bebido.",dPicked:"Has recogido {0}.",dAte:"Has comido.",dSleep:"Te tumbas a dormir. Mu\xE9vete para despertar.",dWake:"Te despiertas.",dNoWater:"No hay agua aqu\xED: ponte junto al agua.",dNothing:"Nada que hacer aqu\xED.",dNoFood:"No llevas comida.",dFull:"Tienes las manos llenas (5).",nFood:"hambre",nWater:"agua",nRest:"descanso",nFun:"compa\xF1\xEDa",nHp:"salud",carry:"lleva {0}",iWood:"madera",iStone:"piedra",iScrap:"chatarra",iAxe:"un hacha",iSpear:"una lanza",has:"tiene {0}",wGatherWood:"recoger madera",wGatherStone:"recoger piedras",wGatherScrap:"buscar chatarra",wAxe:"hacer un hacha",wSpear:"hacer una lanza",wFire:"hacer una hoguera",wHut:"construir una caba\xF1a",wTend:"avivar el fuego",wStore:"recoger comida y guardarla",wLoot:"registrar las ruinas",wFarm:"plantar un huerto",wRepair:"reparar las caba\xF1as",mGoTo:"Ir hacia alguien",mGoToHelp:"Elige a una persona: tu personaje aparece a su lado.",dTp:"Est\xE1s junto a {0}.",zHit:"\xA1Golpeas al zombi!",zKilled:"El zombi ha ca\xEDdo.",actFight:"Luchando contra un zombi",pAge:"{0} a\xF1os",pMan:"Hombre",pWoman:"Mujer",pChild:"ni\xF1o",pExpecting:"espera un beb\xE9",pPartner:"Pareja",pParents:"Padres",pChildren:"Hijos",pGen:"Generaci\xF3n {0}",pNone:"ninguno",pDead:"Muri\xF3",pMood:"\xC1nimo",pWants:"Quiere",pMemory:"Recuerda",pSaid:"Dijo",pRecent:"\xDAltimamente",pTraits:"Rasgos",pFirst:"primeros supervivientes",tStrength:"fuerza",tSpeed:"velocidad",tIntelligence:"inteligencia",tCourage:"valor",tEmpathy:"empat\xEDa",tMetabolism:"apetito",tLifespan:"esperanza de vida",bTo:"va a {0}",bWith:"con {0}",bWants:"quiere: {0}",gDrink:"beber",gEat:"comer",gForage:"buscar comida",gSleep:"dormir",gTalk:"hablar",gWander:"pasear",gRest:"descansar",gTravel:"viajar",hintMenu:"+ / Atr\xE1s: men\xFA",gameMenuItem:"Men\xFA del juego",hMove:"Mover",sayLabel:"Decir algo (vac\xEDo = solo saludar)",wFollow:"seguir a alguien",wMap:"mapa siguiente",wCard:"ficha",mNearby:"Persona m\xE1s cercana",sThoughtsOnly:"Solo los jugadores que el due\xF1o permite ven los pensamientos.",mMe:"Yo",dTalk:"Le hablas.",dNobody:"No hay nadie lo bastante cerca.",sZoom:"Zoom",cPressed:"Pulsado: {0}"},ar:{mResume:"\u0645\u062A\u0627\u0628\u0639\u0629",mActions:"\u0627\u0644\u0623\u0641\u0639\u0627\u0644",mSettings:"\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",mControls:"\u0627\u0644\u0623\u0632\u0631\u0627\u0631",mPerson:"\u0647\u0630\u0627 \u0627\u0644\u0634\u062E\u0635",mNextPerson:"\u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062A\u0627\u0644\u064A",mNextMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",mPlay:"\u0627\u0644\u0639\u0628 (\u0634\u062E\u0635\u064A\u062A\u064A)",mWatch:"\u0634\u0627\u0647\u062F \u0627\u0644\u0639\u0627\u0644\u0645",mBack:"\u0631\u062C\u0648\u0639",mTitle:"\u0627\u0644\u0639\u0627\u0644\u0645",aUse:"\u0627\u0633\u062A\u062E\u062F\u0627\u0645 / \u062A\u062D\u062F\u062B",aRun:"\u062C\u0631\u064A",aEat:"\u0623\u0643\u0644",aDrink:"\u0634\u0631\u0628",aPickup:"\u0627\u0644\u062A\u0642\u0627\u0637 \u0637\u0639\u0627\u0645",aSleep:"\u0646\u0648\u0645 / \u0627\u0633\u062A\u064A\u0642\u0627\u0638",aTalk:"\u062A\u062D\u062F\u062B",aZoomIn:"\u062A\u0643\u0628\u064A\u0631",aZoomOut:"\u062A\u0635\u063A\u064A\u0631",aThoughts:"\u0625\u0638\u0647\u0627\u0631 / \u0625\u062E\u0641\u0627\u0621 \u0627\u0644\u0623\u0641\u0643\u0627\u0631",aMenu:"\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0644\u0639\u0628\u0629",aPerson:"\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0634\u062E\u0635",sThoughts:"\u0627\u0644\u0623\u0641\u0643\u0627\u0631 \u0641\u0648\u0642 \u0627\u0644\u0631\u0624\u0648\u0633",on:"\u0646\u0639\u0645",off:"\u0644\u0627",sServer:"\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",sUnpair:"\u0625\u0644\u063A\u0627\u0621 \u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",cHelp:"\u0627\u062E\u062A\u0631 \u0641\u0639\u0644\u0627\u064B\u060C \u0627\u0636\u063A\u0637 A / OK\u060C \u062B\u0645 \u0627\u0636\u063A\u0637 \u0627\u0644\u0632\u0631 \u0627\u0644\u0630\u064A \u062A\u0631\u064A\u062F\u0647 \u0644\u0647.",cPad:"\u0630\u0631\u0627\u0639 \u0627\u0644\u062A\u062D\u0643\u0645",cRemote:"\u062C\u0647\u0627\u0632 \u0627\u0644\u062A\u062D\u0643\u0645",cPress:"\u0627\u0636\u063A\u0637 \u0627\u0644\u0632\u0631 \u0644\u0640 \xAB{0}\xBB\u2026 (\u0631\u062C\u0648\u0639 \u0644\u0644\u0625\u0644\u063A\u0627\u0621)",cSet:"{0} \u0627\u0644\u0622\u0646 \u0639\u0644\u0649 {1}",cReset:"\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u0623\u0632\u0631\u0627\u0631 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629",cNone:"\u2014",cWatchNote:"\u0641\u064A \u0648\u0636\u0639 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629: \u0627\u0633\u062A\u062E\u062F\u0627\u0645 = \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062A\u0627\u0644\u064A\u060C \u0623\u0643\u0644 = \u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629\u060C \u0646\u0648\u0645 = \u0627\u0644\u0628\u0637\u0627\u0642\u0629.",dDrank:"\u0634\u0631\u0628\u062A.",dPicked:"\u0627\u0644\u062A\u0642\u0637\u062A {0}.",dAte:"\u0623\u0643\u0644\u062A.",dSleep:"\u0627\u0633\u062A\u0644\u0642\u064A\u062A \u0644\u0644\u0646\u0648\u0645. \u062A\u062D\u0631\u0643 \u0644\u062A\u0633\u062A\u064A\u0642\u0638.",dWake:"\u0627\u0633\u062A\u064A\u0642\u0638\u062A.",dNoWater:"\u0644\u0627 \u0645\u0627\u0621 \u0647\u0646\u0627: \u0642\u0641 \u0628\u062C\u0627\u0646\u0628 \u0627\u0644\u0645\u0627\u0621.",dNothing:"\u0644\u0627 \u0634\u064A\u0621 \u0644\u0641\u0639\u0644\u0647 \u0647\u0646\u0627.",dNoFood:"\u0644\u0627 \u062A\u062D\u0645\u0644 \u0637\u0639\u0627\u0645\u0627\u064B.",dFull:"\u064A\u062F\u0627\u0643 \u0645\u0645\u062A\u0644\u0626\u062A\u0627\u0646 (5).",nFood:"\u062C\u0648\u0639",nWater:"\u0645\u0627\u0621",nRest:"\u0631\u0627\u062D\u0629",nFun:"\u0631\u0641\u0642\u0629",nHp:"\u0635\u062D\u0629",carry:"\u064A\u062D\u0645\u0644 {0}",iWood:"\u062E\u0634\u0628",iStone:"\u062D\u062C\u0627\u0631\u0629",iScrap:"\u062E\u0631\u062F\u0629",iAxe:"\u0641\u0623\u0633",iSpear:"\u0631\u0645\u062D",has:"\u0644\u062F\u064A\u0647 {0}",wGatherWood:"\u062C\u0645\u0639 \u0627\u0644\u062D\u0637\u0628",wGatherStone:"\u062C\u0645\u0639 \u0627\u0644\u062D\u062C\u0627\u0631\u0629",wGatherScrap:"\u062C\u0645\u0639 \u0627\u0644\u062E\u0631\u062F\u0629",wAxe:"\u0635\u0646\u0639 \u0641\u0623\u0633",wSpear:"\u0635\u0646\u0639 \u0631\u0645\u062D",wFire:"\u0625\u0634\u0639\u0627\u0644 \u0646\u0627\u0631 \u0627\u0644\u0645\u062E\u064A\u0645",wHut:"\u0628\u0646\u0627\u0621 \u0643\u0648\u062E",wTend:"\u062A\u063A\u0630\u064A\u0629 \u0627\u0644\u0646\u0627\u0631",wStore:"\u062C\u0645\u0639 \u0627\u0644\u0637\u0639\u0627\u0645 \u0648\u062A\u062E\u0632\u064A\u0646\u0647",wLoot:"\u062A\u0641\u062A\u064A\u0634 \u0627\u0644\u0623\u0646\u0642\u0627\u0636",wFarm:"\u0632\u0631\u0627\u0639\u0629 \u062D\u0642\u0644",wRepair:"\u0625\u0635\u0644\u0627\u062D \u0627\u0644\u0623\u0643\u0648\u0627\u062E",mGoTo:"\u0627\u0630\u0647\u0628 \u0625\u0644\u0649 \u0634\u062E\u0635",mGoToHelp:"\u0627\u062E\u062A\u0631 \u0634\u062E\u0635\u0627: \u062A\u0638\u0647\u0631 \u0634\u062E\u0635\u064A\u062A\u0643 \u0628\u062C\u0627\u0646\u0628\u0647.",dTp:"\u0623\u0646\u062A \u0628\u062C\u0627\u0646\u0628 {0}.",zHit:"\u0636\u0631\u0628\u062A \u0627\u0644\u0632\u0648\u0645\u0628\u064A!",zKilled:"\u0633\u0642\u0637 \u0627\u0644\u0632\u0648\u0645\u0628\u064A.",actFight:"\u064A\u0642\u0627\u062A\u0644 \u0632\u0648\u0645\u0628\u064A",pAge:"{0} \u0633\u0646\u0629",pMan:"\u0631\u062C\u0644",pWoman:"\u0627\u0645\u0631\u0623\u0629",pChild:"\u0637\u0641\u0644",pExpecting:"\u062A\u0646\u062A\u0638\u0631 \u0645\u0648\u0644\u0648\u062F\u0627\u064B",pPartner:"\u0627\u0644\u0634\u0631\u064A\u0643",pParents:"\u0627\u0644\u0648\u0627\u0644\u062F\u0627\u0646",pChildren:"\u0627\u0644\u0623\u0628\u0646\u0627\u0621",pGen:"\u0627\u0644\u062C\u064A\u0644 {0}",pNone:"\u0644\u0627 \u0623\u062D\u062F",pDead:"\u062A\u0648\u0641\u064A",pMood:"\u0627\u0644\u0645\u0632\u0627\u062C",pWants:"\u064A\u0631\u064A\u062F",pMemory:"\u064A\u062A\u0630\u0643\u0631",pSaid:"\u0642\u0627\u0644",pRecent:"\u0645\u0624\u062E\u0631\u0627\u064B",pTraits:"\u0627\u0644\u0635\u0641\u0627\u062A",pFirst:"\u0623\u0648\u0627\u0626\u0644 \u0627\u0644\u0646\u0627\u062C\u064A\u0646",tStrength:"\u0642\u0648\u0629",tSpeed:"\u0633\u0631\u0639\u0629",tIntelligence:"\u0630\u0643\u0627\u0621",tCourage:"\u0634\u062C\u0627\u0639\u0629",tEmpathy:"\u062A\u0639\u0627\u0637\u0641",tMetabolism:"\u0634\u0647\u064A\u0629",tLifespan:"\u0627\u0644\u0639\u0645\u0631 \u0627\u0644\u0645\u062A\u0648\u0642\u0639",bTo:"\u0630\u0627\u0647\u0628 \u0625\u0644\u0649 {0}",bWith:"\u0645\u0639 {0}",bWants:"\u064A\u0631\u064A\u062F: {0}",gDrink:"\u0627\u0644\u0634\u0631\u0628",gEat:"\u0627\u0644\u0623\u0643\u0644",gForage:"\u0625\u064A\u062C\u0627\u062F \u0637\u0639\u0627\u0645",gSleep:"\u0627\u0644\u0646\u0648\u0645",gTalk:"\u0627\u0644\u062D\u062F\u064A\u062B",gWander:"\u0627\u0644\u062A\u062C\u0648\u0644",gRest:"\u0627\u0644\u0631\u0627\u062D\u0629",gTravel:"\u0627\u0644\u0633\u0641\u0631",hintMenu:"+ / \u0631\u062C\u0648\u0639: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",gameMenuItem:"\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0644\u0639\u0628\u0629",hMove:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643",sayLabel:"\u0642\u0644 \u0634\u064A\u0626\u064B\u0627 (\u0641\u0627\u0631\u063A = \u0645\u062C\u0631\u062F \u062A\u062D\u064A\u0629)",wFollow:"\u062A\u062A\u0628\u0639 \u0634\u062E\u0635",wMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",wCard:"\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0634\u062E\u0635",mNearby:"\u0623\u0642\u0631\u0628 \u0634\u062E\u0635",sThoughtsOnly:"\u0644\u0627 \u064A\u0631\u0649 \u0627\u0644\u0623\u0641\u0643\u0627\u0631 \u0625\u0644\u0627 \u0627\u0644\u0644\u0627\u0639\u0628\u0648\u0646 \u0627\u0644\u0630\u064A\u0646 \u064A\u0633\u0645\u062D \u0644\u0647\u0645 \u0627\u0644\u0645\u0627\u0644\u0643.",mMe:"\u0623\u0646\u0627",dTalk:"\u062A\u062A\u062D\u062F\u062B \u0625\u0644\u064A\u0647.",dNobody:"\u0644\u0627 \u0623\u062D\u062F \u0642\u0631\u064A\u0628 \u0628\u0645\u0627 \u064A\u0643\u0641\u064A.",sZoom:"\u062A\u0643\u0628\u064A\u0631",cPressed:"\u062A\u0645 \u0627\u0644\u0636\u063A\u0637: {0}"}};var Tc={en:{connecting:"Connecting to the world\u2026",offline:"The world server is not answering. Trying again\u2026",noServer:"No server address yet.",enterServer:"Press A to type the server address",serverLabel:"World server address",pairTitle:"Pair this TV",pairHow:"On your phone, open the control panel and approve this code:",pairWait:"Waiting for approval\u2026",pairExpired:"The code expired. Press A for a new one.",pairDenied:"The pairing was refused. Press A to try again.",hints:"Move: arrows \xB7 A: follow a person \xB7 X: next map \xB7 L / R: zoom \xB7 +: menu",hintsRemote:"Move: arrows \xB7 OK: follow a person \xB7 CH + / \u2212: zoom \xB7 Back twice: menu",following:"Following",free:"Free camera",day:"Day",agents:"people",menuMap:"Next map",menuZoomIn:"Zoom in",menuZoomOut:"Zoom out",menuServer:"Change server address",menuUnpair:"Unpair this TV",hintsPlay:"Move: stick \xB7 B: run \xB7 A: talk \xB7 L / R: zoom \xB7 +: menu",hintsPlayRemote:"Move: arrows \xB7 OK: talk \xB7 CH + / \u2212: zoom \xB7 Back: menu",menuPlay:"Play",menuWatch:"Watch the world",travelling:"Travelling to {0}\u2026",nobody:"Nobody close by.",metPlayer:"Another player is here.",worldFull:"The world is full right now.",noGl:"This screen can\u2019t draw 3D.",actIdle:"Standing",actWander:"Walking around",actDrink:"Getting water",actEat:"Eating",actForage:"Looking for food",actSleep:"Sleeping",actTalk:"Talking",actTravel:"Travelling",actRest:"Resting",actFlee:"Running away",actGo:"Going to someone",actGather:"Gathering",actBuild:"Building",inTransit:"travelling"},fr:{connecting:"Connexion au monde\u2026",offline:"Le serveur du monde ne r\xE9pond pas. Nouvel essai\u2026",noServer:"Pas encore d\u2019adresse de serveur.",enterServer:"Appuyez sur A pour taper l\u2019adresse du serveur",serverLabel:"Adresse du serveur du monde",pairTitle:"Associer cette TV",pairHow:"Sur votre t\xE9l\xE9phone, ouvrez le panneau de contr\xF4le et acceptez ce code :",pairWait:"En attente d\u2019approbation\u2026",pairExpired:"Le code a expir\xE9. Appuyez sur A pour un nouveau.",pairDenied:"L\u2019association a \xE9t\xE9 refus\xE9e. Appuyez sur A pour r\xE9essayer.",hints:"Bouger : fl\xE8ches \xB7 A : suivre une personne \xB7 X : carte suivante \xB7 L / R : zoom \xB7 + : menu",hintsRemote:"Bouger : fl\xE8ches \xB7 OK : suivre une personne \xB7 CH + / \u2212 : zoom \xB7 Retour deux fois : menu",following:"Suivi de",free:"Cam\xE9ra libre",day:"Jour",agents:"personnes",menuMap:"Carte suivante",menuZoomIn:"Zoom avant",menuZoomOut:"Zoom arri\xE8re",menuServer:"Changer l\u2019adresse du serveur",menuUnpair:"Dissocier cette TV",hintsPlay:"Bouger : stick \xB7 B : courir \xB7 A : parler \xB7 L / R : zoom \xB7 + : menu",hintsPlayRemote:"Bouger : fl\xE8ches \xB7 OK : parler \xB7 CH + / \u2212 : zoom \xB7 Retour : menu",menuPlay:"Jouer",menuWatch:"Regarder le monde",travelling:"En route vers {0}\u2026",nobody:"Personne \xE0 c\xF4t\xE9.",metPlayer:"Un autre joueur est l\xE0.",worldFull:"Le monde est plein pour le moment.",noGl:"Cet \xE9cran ne peut pas afficher la 3D.",actIdle:"Debout",actWander:"Se prom\xE8ne",actDrink:"Va boire",actEat:"Mange",actForage:"Cherche \xE0 manger",actSleep:"Dort",actTalk:"Discute",actTravel:"En voyage",actRest:"Se repose",actFlee:"S\u2019enfuit",actGo:"Va rejoindre quelqu\u2019un",actGather:"R\xE9colte",actBuild:"Construit",inTransit:"en voyage"},es:{connecting:"Conectando con el mundo\u2026",offline:"El servidor del mundo no responde. Reintentando\u2026",noServer:"Todav\xEDa no hay direcci\xF3n del servidor.",enterServer:"Pulsa A para escribir la direcci\xF3n del servidor",serverLabel:"Direcci\xF3n del servidor del mundo",pairTitle:"Vincular este televisor",pairHow:"En tu tel\xE9fono, abre el panel de control y aprueba este c\xF3digo:",pairWait:"Esperando aprobaci\xF3n\u2026",pairExpired:"El c\xF3digo caduc\xF3. Pulsa A para uno nuevo.",pairDenied:"Se rechaz\xF3 la vinculaci\xF3n. Pulsa A para reintentar.",hints:"Mover: flechas \xB7 A: seguir a alguien \xB7 X: mapa siguiente \xB7 L / R: zoom \xB7 +: men\xFA",hintsRemote:"Mover: flechas \xB7 OK: seguir a alguien \xB7 CH + / \u2212: zoom \xB7 Atr\xE1s dos veces: men\xFA",following:"Siguiendo a",free:"C\xE1mara libre",day:"D\xEDa",agents:"personas",menuMap:"Mapa siguiente",menuZoomIn:"Acercar",menuZoomOut:"Alejar",menuServer:"Cambiar la direcci\xF3n del servidor",menuUnpair:"Desvincular este televisor",hintsPlay:"Mover: stick \xB7 B: correr \xB7 A: hablar \xB7 L / R: zoom \xB7 +: men\xFA",hintsPlayRemote:"Mover: flechas \xB7 OK: hablar \xB7 CH + / \u2212: zoom \xB7 Atr\xE1s: men\xFA",menuPlay:"Jugar",menuWatch:"Mirar el mundo",travelling:"Viajando a {0}\u2026",nobody:"No hay nadie cerca.",metPlayer:"Hay otro jugador aqu\xED.",worldFull:"El mundo est\xE1 lleno ahora mismo.",noGl:"Esta pantalla no puede mostrar 3D.",actIdle:"De pie",actWander:"Paseando",actDrink:"Va a beber",actEat:"Comiendo",actForage:"Busca comida",actSleep:"Durmiendo",actTalk:"Hablando",actTravel:"De viaje",actRest:"Descansando",actFlee:"Huyendo",actGo:"Va hacia alguien",actGather:"Recogiendo",actBuild:"Construyendo",inTransit:"de viaje"},ar:{connecting:"\u062C\u0627\u0631\u064D \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0639\u0627\u0644\u0645\u2026",offline:"\u062E\u0627\u062F\u0645 \u0627\u0644\u0639\u0627\u0644\u0645 \u0644\u0627 \u064A\u0633\u062A\u062C\u064A\u0628. \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629\u2026",noServer:"\u0644\u0627 \u064A\u0648\u062C\u062F \u0639\u0646\u0648\u0627\u0646 \u062E\u0627\u062F\u0645 \u0628\u0639\u062F.",enterServer:"\u0627\u0636\u063A\u0637 A \u0644\u0643\u062A\u0627\u0628\u0629 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",serverLabel:"\u0639\u0646\u0648\u0627\u0646 \u062E\u0627\u062F\u0645 \u0627\u0644\u0639\u0627\u0644\u0645",pairTitle:"\u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",pairHow:"\u0639\u0644\u0649 \u0647\u0627\u062A\u0641\u0643\u060C \u0627\u0641\u062A\u062D \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0648\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0631\u0645\u0632:",pairWait:"\u0641\u064A \u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629\u2026",pairExpired:"\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0631\u0645\u0632. \u0627\u0636\u063A\u0637 A \u0644\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0631\u0645\u0632 \u062C\u062F\u064A\u062F.",pairDenied:"\u062A\u0645 \u0631\u0641\u0636 \u0627\u0644\u0631\u0628\u0637. \u0627\u0636\u063A\u0637 A \u0644\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.",hints:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 A: \u062A\u062A\u0628\u0639 \u0634\u062E\u0635 \xB7 X: \u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629 \xB7 L / R: \u062A\u0643\u0628\u064A\u0631 \xB7 +: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",hintsRemote:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 OK: \u062A\u062A\u0628\u0639 \u0634\u062E\u0635 \xB7 CH + / \u2212: \u062A\u0643\u0628\u064A\u0631 \xB7 \u0631\u062C\u0648\u0639 \u0645\u0631\u062A\u064A\u0646: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",following:"\u062A\u062A\u0628\u0639",free:"\u0643\u0627\u0645\u064A\u0631\u0627 \u062D\u0631\u0629",day:"\u0627\u0644\u064A\u0648\u0645",agents:"\u0623\u0634\u062E\u0627\u0635",menuMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",menuZoomIn:"\u062A\u0643\u0628\u064A\u0631",menuZoomOut:"\u062A\u0635\u063A\u064A\u0631",menuServer:"\u062A\u063A\u064A\u064A\u0631 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",menuUnpair:"\u0625\u0644\u063A\u0627\u0621 \u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",hintsPlay:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0639\u0635\u0627 \xB7 B: \u0627\u0644\u062C\u0631\u064A \xB7 A: \u0627\u0644\u062A\u062D\u062F\u062B \xB7 L / R: \u062A\u0643\u0628\u064A\u0631 \xB7 +: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",hintsPlayRemote:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 OK: \u0627\u0644\u062A\u062D\u062F\u062B \xB7 CH + / \u2212: \u062A\u0643\u0628\u064A\u0631 \xB7 \u0631\u062C\u0648\u0639: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",menuPlay:"\u0627\u0644\u0639\u0628",menuWatch:"\u0634\u0627\u0647\u062F \u0627\u0644\u0639\u0627\u0644\u0645",travelling:"\u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642 \u0625\u0644\u0649 {0}\u2026",nobody:"\u0644\u0627 \u0623\u062D\u062F \u0628\u0627\u0644\u0642\u0631\u0628.",metPlayer:"\u0644\u0627\u0639\u0628 \u0622\u062E\u0631 \u0647\u0646\u0627.",worldFull:"\u0627\u0644\u0639\u0627\u0644\u0645 \u0645\u0645\u062A\u0644\u0626 \u0627\u0644\u0622\u0646.",noGl:"\u0647\u0630\u0647 \u0627\u0644\u0634\u0627\u0634\u0629 \u0644\u0627 \u062A\u0633\u062A\u0637\u064A\u0639 \u0639\u0631\u0636 \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F.",actIdle:"\u0648\u0627\u0642\u0641",actWander:"\u064A\u062A\u062C\u0648\u0644",actDrink:"\u064A\u0630\u0647\u0628 \u0644\u064A\u0634\u0631\u0628",actEat:"\u064A\u0623\u0643\u0644",actForage:"\u064A\u0628\u062D\u062B \u0639\u0646 \u0637\u0639\u0627\u0645",actSleep:"\u0646\u0627\u0626\u0645",actTalk:"\u064A\u062A\u062D\u062F\u062B",actTravel:"\u0645\u0633\u0627\u0641\u0631",actRest:"\u064A\u0633\u062A\u0631\u064A\u062D",actFlee:"\u064A\u0647\u0631\u0628",actGo:"\u064A\u0630\u0647\u0628 \u0625\u0644\u0649 \u0634\u062E\u0635",actGather:"\u064A\u062C\u0645\u0639",actBuild:"\u064A\u0628\u0646\u064A",inTransit:"\u0641\u064A \u0633\u0641\u0631"}},Ac="en";function Ju(i){Ac=i in Tc?i:"en"}function $(i){let e=Tc[Ac],t=Ec[Ac];return e[i]??t[i]??Tc.en[i]??Ec.en[i]??i}function bt(i,...e){return $(i).replace(/\{(\d)\}/g,(t,n)=>e[Number(n)]??"")}var u_=1.25,Bo=class{body;head;hair;legs;arms;blob;mark;n=0;nm=0;base=new We;m=new We;part=new We;q=new Wt;e=new Mt;v=new P;s=new P;cap;constructor(e,t,n){this.cap=t;let s=()=>new Nn({color:16777215}),r=(o,a,l,h)=>{let c=new Oi(o,a,l);return c.instanceMatrix.setUsage(sr),c.count=0,c.frustumCulled=!1,c.castShadow=h&&n,e.add(c),c};this.body=r(new Qt(.17,.24,.6,10).translate(0,.8,0),s(),t,!0),this.head=r(new Bi(.17,14,10).translate(0,1.3,0),s(),t,!0),this.hair=r(new Bi(.182,14,6,0,Math.PI*2,0,Math.PI*.55).translate(0,1.33,-.015),s(),t,!0),this.legs=r(new Qt(.075,.065,.5,6).translate(0,-.25,0),s(),t*2,!0),this.arms=r(new Qt(.06,.05,.44,6).translate(0,-.22,0),s(),t*2,!0),this.blob=n?null:r(new vs(.38,16).rotateX(-Math.PI/2),new an({color:0,transparent:!0,opacity:.28,depthWrite:!1}),t,!1),this.mark=r(new To(.12,0).scale(1,1.6,1),new an({color:16777215}),64,!1);for(let o of[this.body,this.head,this.hair,this.legs,this.arms,this.mark])o.setColorAt(0,new Me)}begin(){this.n=0,this.nm=0}add(e,t,n,s,r,o,a,l=1,h=!1){if(this.n>=this.cap)return;let c=this.n++,u=Math.abs(Math.sin(s))*.05*r*l,f=u_*l;this.base.compose(this.v.set(e,u,t),this.q.setFromEuler(this.e.set(0,n,0)),this.s.set(f,f,f)),a&&(this.part.compose(this.v.set(0,.2,-.55),this.q.setFromEuler(this.e.set(Math.PI/2,0,0)),this.s.set(1,1,1)),this.base.multiply(this.part)),this.body.setMatrixAt(c,this.base),this.body.setColorAt(c,o.tunic),this.head.setMatrixAt(c,this.base),this.head.setColorAt(c,o.skin),this.hair.setMatrixAt(c,this.base),this.hair.setColorAt(c,o.hair);let m=Math.sin(s)*.7*r;for(let g=0;g<2;g++){let v=g?1:-1;this.part.compose(this.v.set(v*.1,.52,0),this.q.setFromEuler(this.e.set(m*v,0,0)),this.s.set(1,1,1)),this.m.multiplyMatrices(this.base,this.part),this.legs.setMatrixAt(c*2+g,this.m),this.legs.setColorAt(c*2+g,o.pants),this.part.compose(this.v.set(v*.25,1.07,0),this.q.setFromEuler(h?this.e.set(-1.35+m*v*.15,0,v*.05):this.e.set(-m*v*.8,0,v*.12)),this.s.set(1,1,1)),this.m.multiplyMatrices(this.base,this.part),this.arms.setMatrixAt(c*2+g,this.m),this.arms.setColorAt(c*2+g,o.tunic)}this.blob&&(this.m.makeTranslation(e,.03,t),this.blob.setMatrixAt(c,this.m))}marker(e,t,n,s){if(this.nm>=64)return;let r=this.nm++;this.m.compose(this.v.set(e,2.15+Math.sin(n*3)*.08,t),this.q.setFromEuler(this.e.set(0,n*2,0)),this.s.set(1,1,1)),this.mark.setMatrixAt(r,this.m),this.mark.setColorAt(r,s)}end(){let e=this.n;for(let t of[this.body,this.head,this.hair])t.count=e,Cc(t);for(let t of[this.legs,this.arms])t.count=e*2,Cc(t);this.blob&&(this.blob.count=e,this.blob.instanceMatrix.needsUpdate=!0),this.mark.count=this.nm,Cc(this.mark)}};function Cc(i){i.instanceMatrix.needsUpdate=!0,i.instanceColor&&(i.instanceColor.needsUpdate=!0)}var Ku=58*Math.PI/180,ko=class{renderer;scene=new So;camera=new Rt(30,16/9,1,400);people;hemi=new Io(13624319,6114362,1.1);sun=new Uo(16773590,2.4);lamp=new Lo(16761466,0,14,1.6);fog;bg=new Me(10274792);chunks=new xn;water;under;portals=new xn;shots;nShots=0;cans;bushes;berries;crates;nCan=0;nBush=0;nCrate=0;q=new Wt;eu=new Mt;v3=new P;s3=new P;groundMat=new Nn({vertexColors:!0});propMat=new Nn({vertexColors:!0});glowMat=new an({vertexColors:!0});target=new P;look=new P;dist=24;tier;m=new We;shadowR=30;constructor(e,t){this.tier=t,this.renderer=new Mo({canvas:e,antialias:t==="high",powerPreference:"high-performance",stencil:!1}),this.renderer.setPixelRatio(1),this.renderer.toneMapping=fc,this.renderer.toneMappingExposure=1.05;let n=t!=="low";if(n){this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=dc,this.sun.castShadow=!0;let r=t==="high"?2048:1024;this.sun.shadow.mapSize.set(r,r),this.sun.shadow.bias=-6e-4,this.sun.shadow.normalBias=.03,this.sun.shadow.camera.near=1,this.sun.shadow.camera.far=120}this.scene.background=this.bg,this.fog=new bo(this.bg,60,160),this.scene.fog=this.fog,this.scene.add(this.hemi,this.sun,this.sun.target,this.lamp,this.chunks,this.portals),this.under=new ft(new Fi(4e3,4e3).rotateX(-Math.PI/2),new Nn({color:3033642})),this.under.position.y=-.8,this.scene.add(this.under),this.water=new ft(new Fi(1,1).rotateX(-Math.PI/2),new Co({color:3114672,transparent:!0,opacity:.72,shininess:90,specular:10474736})),this.water.position.y=-.14,this.water.receiveShadow=n,this.scene.add(this.water),this.people=new Bo(this.scene,512,n),this.shots=new Oi(new Bi(.07,6,4),new an({color:16773536}),256),this.shots.instanceMatrix.setUsage(sr),this.shots.count=0,this.shots.frustumCulled=!1,this.scene.add(this.shots);let s=(r,o,a)=>{let l=new Oi(r,new Nn({color:o,flatShading:!0}),a);return l.instanceMatrix.setUsage(sr),l.count=0,l.frustumCulled=!1,l.castShadow=n,this.scene.add(l),l};this.cans=s(new Qt(.09,.09,.17,10).translate(0,.085,0),12866111,256),this.bushes=s(new Kn(.34,0).scale(1,.75,1).translate(0,.24,0),4161335,256),this.berries=s(new Kn(.055,0),14100029,256*4),this.crates=s(new Qt(.2,.2,.3,4).rotateY(Math.PI/4).translate(0,.15,0),10122312,128)}beginItems(){this.nCan=this.nBush=this.nCrate=0}item(e,t,n,s){let r=(s*2654435761>>>0)/4294967296;if(this.m.compose(this.v3.set(e,0,t),this.q.setFromEuler(this.eu.set(0,r*6.28,0)),this.s3.set(1,1,1)),n===1&&this.nCan<256)this.cans.setMatrixAt(this.nCan++,this.m);else if(n===2&&this.nBush<256){let o=this.nBush++;this.bushes.setMatrixAt(o,this.m);for(let a=0;a<4;a++){let l=r*6.28+a*1.57;this.m.makeTranslation(e+Math.cos(l)*.27,.28+(a&1)*.12,t+Math.sin(l)*.27),this.berries.setMatrixAt(o*4+a,this.m)}}else this.nCrate<128&&this.crates.setMatrixAt(this.nCrate++,this.m)}endItems(){this.cans.count=this.nCan,this.bushes.count=this.nBush,this.berries.count=this.nBush*4,this.crates.count=this.nCrate;for(let e of[this.cans,this.bushes,this.berries,this.crates])e.instanceMatrix.needsUpdate=!0}setMap(e,t,n){this.clearChunks(),this.water.scale.set(e,1,t),this.water.position.set(e/2,-.14,t/2);for(let s of this.portals.children.slice())this.portals.remove(s),f_(s);for(let s of n)this.portals.add(d_(s.x,s.y))}addChunk(e,t,n=null){let s=new xn,r=new ft(e,this.groundMat);if(r.receiveShadow=this.tier!=="low",s.add(r),t){let o=new ft(t,this.propMat);o.castShadow=o.receiveShadow=this.tier!=="low",s.add(o)}return n&&s.add(new ft(n,this.glowMat)),this.chunks.add(s),s}removeChunk(e){this.chunks.remove(e);for(let t of e.children)t.geometry.dispose()}clearChunks(){for(let e of this.chunks.children.slice())this.removeChunk(e)}beginShots(){this.nShots=0}shot(e,t){this.nShots>=256||(this.m.makeTranslation(e,1,t),this.shots.setMatrixAt(this.nShots++,this.m))}endShots(){this.shots.count=this.nShots,this.shots.instanceMatrix.needsUpdate=!0}resize(e,t){this.renderer.setSize(e,t,!1),this.camera.aspect=e/t,this.camera.updateProjectionMatrix()}pv=new P;project(e,t,n,s){let r=this.pv.set(e,t,n).project(this.camera);return r.z>1||r.x<-1.1||r.x>1.1||r.y<-1.1||r.y>1.1?!1:(s.x=(r.x+1)/2*innerWidth,s.y=(1-r.y)/2*innerHeight,!0)}follow(e,t,n,s){this.target.set(e,0,t);let r=s?1:1-Math.exp(-n*6);this.look.x+=(e-this.look.x)*r,this.look.z+=(t-this.look.z)*r;let o=this.dist;if(this.camera.position.set(this.look.x,Math.sin(Ku)*o,this.look.z+Math.cos(Ku)*o),this.camera.lookAt(this.look.x,0,this.look.z),this.fog.near=o*1.6,this.fog.far=o*3.6,this.sun.castShadow){let c=this.shadowR=Math.min(60,o*1.15+6),u=this.sun.shadow.camera;u.right!==c&&(u.left=-c,u.right=c,u.top=c,u.bottom=-c,u.updateProjectionMatrix())}let a=this.shadowR*2/this.sun.shadow.mapSize.x,l=Math.round(this.look.x/a)*a,h=Math.round(this.look.z/a)*a;this.sun.target.position.set(l,0,h),this.sun.position.set(l+this.sunDir.x*50,this.sunDir.y*50,h+this.sunDir.z*50),this.lamp.position.set(e,2.2,t)}sunDir=new P(.4,.8,.45).normalize();c1=new Me;c2=new Me;setHour(e,t){let n=e<5||e>21?0:e<8?(e-5)/3:e>18?(21-e)/3:1,s=n>0&&n<1?Math.sin(n*Math.PI):0,r=(e-6)/12*Math.PI;n>0?this.sunDir.set(-Math.cos(r)*.8,Math.max(.5,Math.sin(r)),.55).normalize():this.sunDir.set(.3,.8,.4).normalize(),this.sun.intensity=n>0?.5+2*n:.45,this.sun.color.setHex(9349375).lerp(this.c1.setHex(16773590),n).lerp(this.c2.setHex(16752736),s*.7),this.hemi.intensity=.35+.8*n,this.hemi.color.setHex(3162218).lerp(this.c1.setHex(13624319),n),this.hemi.groundColor.setHex(1841698).lerp(this.c1.setHex(6114362),n),this.bg.setHex(726054).lerp(this.c1.setHex(10274792),n).lerp(this.c2.setHex(15178346),s*.6),this.lamp.intensity=(1-n)*9;let o=1+Math.sin(t*2.5)*.06;for(let a of this.portals.children)a.children[0].rotation.y=t*.8,a.children[1].scale.set(o,1,o)}render(){this.renderer.render(this.scene,this.camera)}dispose(){this.clearChunks(),this.renderer.dispose()}};function d_(i,e){let t=new xn;t.position.set(i,0,e);let n=new ft(new Ao(1.3,.11,8,32),new an({color:9433343}));n.position.y=1.4;let s=new ft(new vs(2,32).rotateX(-Math.PI/2),new an({color:5232895,transparent:!0,opacity:.45,blending:ao,depthWrite:!1,side:mn}));return s.position.y=.05,t.add(n,s),t}function f_(i){i.traverse(e=>{let t=e;t.geometry&&t.geometry.dispose()})}var p_={grass:{shape:0,ground:7776597,top:0,side:0,height:0},dirt:{shape:0,ground:10780248,top:0,side:0,height:0},road:{shape:0,ground:6973282,top:0,side:0,height:0},floor:{shape:0,ground:11569759,top:0,side:0,height:0},sand:{shape:0,ground:14469267,top:0,side:0,height:0},water:{shape:1,ground:5009250,top:0,side:0,height:0},wall:{shape:2,ground:9275262,top:12761258,side:10918797,height:2.3},tree:{shape:3,ground:6197061,top:5215296,side:7031343,height:0},rubble:{shape:4,ground:9471865,top:10195587,side:0,height:0},woodwall:{shape:2,ground:9071176,top:9134649,side:8016946,height:1.7,even:!0,planks:!0},campfire:{shape:5,ground:9271906,top:9407106,side:5978658,height:0},ashes:{shape:6,ground:7301731,top:4012599,side:4863268,height:0}};function Qu(i){let e=[];for(let t=0;t<256;t++)e.push({shape:0,ground:7251535,top:0,side:0,height:0});for(let t of i){let n=p_[t.name];e[t.id]=n?{...n}:t.solid?{shape:2,ground:t.color,top:t.color,side:t.color,height:2}:{shape:0,ground:t.color,top:0,side:0,height:0}}return e}function St(i,e){let t=Math.imul(i|0,374761393)+Math.imul(e|0,668265263);return t=Math.imul(t^t>>>13,1274126177),((t^t>>>16)>>>0)/4294967296}function zo(i,e,t){let n=i/t,s=e/t,r=Math.floor(n),o=Math.floor(s),a=n-r,l=s-o;a=a*a*(3-2*a),l=l*l*(3-2*l);let h=St(r,o),c=St(r+1,o),u=St(r,o+1),f=St(r+1,o+1);return h+(c-h)*a+(u-h)*l+(h-c-u+f)*a*l}var or=64,m_=-.55;function Vi(i){let e=i.index?i.toNonIndexed():i;e.computeVertexNormals();let t=e.getAttribute("position").array,n=1/0,s=-1/0;for(let r=1;r<t.length;r+=3)n=Math.min(n,t[r]),s=Math.max(s,t[r]);return{pos:t,nor:e.getAttribute("normal").array,minY:n,maxY:s}}var Rc=null;function g_(){return Rc||(Rc={trunk:Vi(new Qt(.1,.17,1,6,1,!0).translate(0,.5,0)),leaf:Vi(new Kn(1,1)),leafLo:Vi(new Kn(1,0)),rock:Vi(new Kn(1,0)),blade:Vi(new tr(.045,.34,3,1,!0).translate(0,.17,0)),log:Vi(new Qt(.06,.06,.62,6,1,!1).rotateZ(Math.PI/2)),flame:Vi(new tr(.16,.5,5,1,!1).translate(0,.25,0))}),Rc}var Go=class{pos=[];nor=[];col=[];geometry(){if(!this.pos.length)return null;let e=new Nt;return e.setAttribute("position",new Ke(this.pos,3)),e.setAttribute("normal",new Ke(this.nor,3)),e.setAttribute("color",new Ke(this.col,3)),e.computeBoundingSphere(),e}},Vo=new P,Ho=new P,x_=new We,ju=new Re,__=new Wt,y_=new Mt,v_=new P,M_=new P,gv=new Me;function yn(i,e,t,n,s){ju.getNormalMatrix(t);let r=e.pos,o=e.nor,a=e.maxY-e.minY||1;for(let l=0;l<r.length;l+=3){let h=s+(1-s)*((r[l+1]-e.minY)/a);Vo.set(r[l],r[l+1],r[l+2]).applyMatrix4(t),Ho.set(o[l],o[l+1],o[l+2]).applyMatrix3(ju).normalize(),i.pos.push(Vo.x,Vo.y,Vo.z),i.nor.push(Ho.x,Ho.y,Ho.z),i.col.push(n.r*h,n.g*h,n.b*h)}}function vn(i,e,t,n,s,r,o,a,l){return x_.compose(M_.set(i,e,t),__.setFromEuler(y_.set(n,s,r)),v_.set(o,a,l))}function ar(i,e,t,n,s,r,o,a,l,h,c,u,f,m,g,v,p,d,w){let S=[e,t,n,s,r,o,a,l,h,e,t,n,a,l,h,c,u,f],_=[d,d,w,d,w,w];for(let I=0;I<6;I++)i.pos.push(S[I*3],S[I*3+1],S[I*3+2]),i.nor.push(m,g,v),i.col.push(p.r*_[I],p.g*_[I],p.b*_[I])}function ed(i,e,t){return!i.even&&St(e*7+1,t*13+5)<.3?.8+St(e,t+99)*1.2:i.height}var jt=(i,e)=>e.setHex(i),b_=new Me(11711080),td=new Me;function nd(i,e,t,n,s){let r=i*32,o=e*32,a=or+1,l=new Float32Array(a*a*3),h=new Float32Array(a*a*3),c=new Me,u=new Me;for(let S=0;S<a;S++)for(let _=0;_<a;_++){let I=_&1?_-1>>1:(_>>1)-1,T=_&1?I:_>>1,A=S&1?S-1>>1:(S>>1)-1,C=S&1?A:S>>1,b=0,x=0,R=!1,L=!1;u.setRGB(0,0,0);let O=r+_/2,B=o+S/2;for(let K=A;K<=C;K++)for(let W=I;W<=T;W++){let j=t(W,K);if(j<0)continue;let ie=n[j];if(jt(ie.ground,c),ie.shape===0&&ie.ground===7776597){let pe=zo(O+300,B,9);c.lerp(b_,Math.max(0,pe-.45)*1.1)}u.r+=c.r,u.g+=c.g,u.b+=c.b,x+=ie.shape===1?m_:0,ie.shape===2&&(R=!0),(ie.ground===6973282||ie.ground===11569759||ie.shape===1)&&(L=!0),b++}b||(u.setHex(7251535),b=1);let G=(.9+zo(O,B,3.5)*.18+(St(_+r*2,S+o*2)-.5)*.05)*(R?.7:1),z=(S*a+_)*3;h[z]=u.r/b*G,h[z+1]=u.g/b*G,h[z+2]=u.b/b*G,l[z]=O,l[z+2]=B,l[z+1]=x/b+(L?0:(zo(O,B,2.5)-.5)*.14)}let f=new Uint16Array(or*or*6),m=0;for(let S=0;S<or;S++)for(let _=0;_<or;_++){let I=S*a+_,T=I+1,A=I+a,C=A+1;_+S&1?(f[m++]=I,f[m++]=A,f[m++]=T,f[m++]=T,f[m++]=A,f[m++]=C):(f[m++]=I,f[m++]=A,f[m++]=C,f[m++]=I,f[m++]=C,f[m++]=T)}let g=new Nt;g.setAttribute("position",new Ke(l,3)),g.setAttribute("color",new Ke(h,3)),g.setIndex(new _s(f,1)),g.computeVertexNormals(),g.computeBoundingSphere();let v=g_(),p=new Go,d=new Go,w=s?v.leaf:v.leafLo;for(let S=0;S<32;S++)for(let _=0;_<32;_++){let I=t(_,S),T=n[I],A=r+_,C=o+S,b=St(A,C),x=St(C+17,A-3),R=St(A*3+7,C*5+1);if(T.shape===2){let L=ed(T,A,C),O=.92+b*.14;jt(T.top,c).multiplyScalar(O);let B=A,G=A+1,z=C,K=C+1;ar(p,B,L,K,G,L,K,G,L,z,B,L,z,0,1,0,c,1,1),jt(T.side,c).multiplyScalar(O);let W=(ie,pe)=>{let Ue=t(ie,pe);if(Ue<0)return 0;let $e=n[Ue];return $e.shape===2?ed($e,r+ie,o+pe):0},j=W(_,S+1);j<L&&ar(p,B,j,K,G,j,K,G,L,K,B,L,K,0,0,1,c,j?.85:.55,1),j=W(_,S-1),j<L&&ar(p,G,j,z,B,j,z,B,L,z,G,L,z,0,0,-1,c,j?.85:.55,1),j=W(_+1,S),j<L&&ar(p,G,j,K,G,j,z,G,L,z,G,L,K,1,0,0,c,j?.85:.55,.95),j=W(_-1,S),j<L&&ar(p,B,j,z,B,j,K,B,L,K,B,L,z,-1,0,0,c,j?.85:.55,.95)}else if(T.shape===3){let L=.85+b*.5,O=A+.5+(x-.5)*.3,B=C+.5+(R-.5)*.3,G=.9*L+.3;jt(T.side,c),yn(p,v.trunk,vn(O,0,B,0,x*6,0,L,G,L),c,.55),jt(T.top,c),td.setHex(x<.5?6989898:3963448),c.lerp(td,R*.7).multiplyScalar(.92+b*.16),yn(p,w,vn(O,G+.5*L,B,x,b*6,R,.95*L,.8*L,.95*L),c,.62),c.multiplyScalar(1.08),yn(p,w,vn(O+(x-.5)*.5*L,G+1.05*L,B+(R-.5)*.4*L,R,x*6,b,.62*L,.55*L,.62*L),c,.75)}else if(T.shape===5||T.shape===6){let L=A+.5,O=C+.5,B=T.shape===5;for(let G=0;G<7;G++){let z=G/7*Math.PI*2+b,K=.1+St(A+G,C-G)*.05;jt(T.top,c).multiplyScalar(.8+St(A*3+G,C)*.3),yn(p,v.rock,vn(L+Math.cos(z)*.34,K*.4,O+Math.sin(z)*.34,z,z*2,0,K,K*.7,K),c,.65)}jt(T.side,c);for(let G=0;G<3;G++)yn(p,v.log,vn(L,.07+G*.03,O,0,x*3+G*1.05,B?.25:.05,1,1,1),c,.6);B&&(jt(15895086,c),yn(d,v.flame,vn(L,.08,O,0,b*6,0,1,1.15,1),c,.75),jt(16369487,c),yn(d,v.flame,vn(L+.04,.1,O-.03,.1,x*6,0,.6,.8,.6),c,.85),jt(16773560,c),yn(d,v.flame,vn(L-.02,.1,O+.02,0,R*6,.1,.3,.5,.3),c,1))}else if(T.shape===4)for(let L=0;L<3;L++){let O=St(A*5+L,C*3-L),B=St(C*7+L,A-L*11);jt(T.top,c).multiplyScalar(.8+O*.35);let G=.16+O*.22;yn(p,v.rock,vn(A+.2+B*.6,G*.25,C+.2+O*.6,O*3,B*6,B,G,G*.6,G*.9),c,.6)}else if(T.shape===0&&T.ground===7776597&&b<.2){let L=A+.2+x*.6,O=C+.2+R*.6;jt(6265413,c).multiplyScalar(.85+x*.3);for(let B=0;B<3;B++)yn(p,v.blade,vn(L+(B-1)*.06,0,O+(B*7%3-1)*.05,(R-.5)*.5,B*2.1,(B-1)*.35,1,.7+b*1.5,1),c,.6);b<.05&&(jt(x<.33?15921126:x<.66?15976778:14243402,c),yn(p,v.rock,vn(L,.28,O,b,x,R,.06,.05,.06),c,1))}}return{ground:g,props:p.geometry(),glow:d.geometry()}}var lr=["use","run","eat","drink","pickup","sleep","zoomIn","zoomOut","thoughts","person","menu"],S_={use:"aUse",run:"aRun",eat:"aEat",drink:"aDrink",pickup:"aPickup",sleep:"aSleep",zoomIn:"aZoomIn",zoomOut:"aZoomOut",thoughts:"aThoughts",person:"aPerson",menu:"aMenu"},Mn=i=>$(S_[i]),Ic={pad:{use:0,run:1,eat:2,sleep:3,zoomIn:4,zoomOut:5,thoughts:8,menu:9},remote:{use:"ok",eat:"red",sleep:"green",thoughts:"yellow",person:"blue",zoomIn:"chUp",zoomOut:"chDown",menu:"info"}};function Pc(i){return{pad:{...i.pad},remote:{...i.remote}}}function Lc(i,e){for(let t of lr)if(i.pad[t]===e)return t}function ws(i,e){for(let t of lr)if(i.remote[t]===e)return t}var w_={ok:"OK",red:"\u{1F534}",green:"\u{1F7E2}",yellow:"\u{1F7E1}",blue:"\u{1F535}",chUp:"CH +",chDown:"CH \u2212",info:"Info",play:"\u25B6",pause:"\u23F8",playPause:"\u23EF",ff:"\u23E9",rew:"\u23EA",next:"\u23ED",prev:"\u23EE",stop:"\u23F9",record:"\u23FA",tools:"Tools",chList:"CH list",guide:"Guide",space:"Space",pageUp:"PgUp",pageDown:"PgDn"},qo=i=>w_[i]??(/^\d$/.test(i),i),Wo=class{constructor(e,t,n){this.build=e;this.onPick=t;this.onClose=n;this.el=document.createElement("div"),this.el.id="gmenu",this.el.hidden=!0,this.el.setAttribute("role","dialog"),this.titleEl=document.createElement("div"),this.titleEl.className="mt",this.textEl=document.createElement("div"),this.textEl.className="mx",this.listEl=document.createElement("div"),this.listEl.className="ml",this.listEl.setAttribute("role","menu"),this.el.append(this.titleEl,this.textEl,this.listEl),document.body.appendChild(this.el)}build;onPick;onClose;el;titleEl;textEl;listEl;stack=[];rows=[];open=!1;sel=0;get page(){return this.stack.length?this.stack[this.stack.length-1].id:""}show(e="root"){this.stack=[{id:e,sel:0}],this.open=!0,this.el.hidden=!1,document.body.classList.add("menu-open"),this.render()}push(e){this.stack.length&&(this.stack[this.stack.length-1].sel=this.sel),this.stack.push({id:e,sel:0}),this.render()}back(){if(this.stack.pop(),!this.stack.length){this.close();return}this.render(this.stack[this.stack.length-1].sel)}close(){this.open=!1,this.el.hidden=!0,document.body.classList.remove("menu-open"),this.stack=[],this.onClose()}refresh(){this.open&&this.render(this.sel)}render(e=0){let t=this.build(this.page);this.rows=t.rows,this.titleEl.textContent=t.title,this.el.classList.toggle("wide",!!t.wide),t.html?this.textEl.innerHTML=t.html:this.textEl.textContent=t.text??"",this.textEl.hidden=!t.text&&!t.html,this.listEl.textContent="";for(let n of t.rows){let s=document.createElement("div");s.className="mr"+(n.dim?" dim":""),s.setAttribute("role","menuitem");let r=document.createElement("span");if(r.textContent=n.label+(n.sub?" \u203A":""),s.appendChild(r),n.value!==void 0){let o=document.createElement("span");o.className="mv",o.textContent=n.value,s.appendChild(o)}this.listEl.appendChild(s)}this.select(Math.min(e,Math.max(0,t.rows.length-1)))}select(e){let t=this.listEl.children;t[this.sel]?.classList.remove("on"),this.sel=e;let n=t[e];if(n){n.classList.add("on"),n.scrollIntoView?.({block:"nearest"});let s=this.rows[e];globalThis.MyPC?.announce?.(s.label+(s.value?", "+s.value:""))}}input(e){if(!this.open)return;let t=this.rows.length;if(e==="up"&&t)this.select((this.sel+t-1)%t);else if(e==="down"&&t)this.select((this.sel+1)%t);else if(e==="back")this.back();else if(e==="ok"&&t){let n=this.rows[this.sel];this.onPick(this.page,n.id)}}};function en(i,e){let t=Math.max(0,Math.min(100,100-e)),n=t>60?"#5cc98a":t>30?"#e8b64a":"#e5625b";return`<span class="nb"><span class="nl">${i}</span><span class="nt"><i style="width:${Math.max(3,t)}%;background:${n}"></i></span></span>`}var sd={drink:"gDrink",eat:"gEat",forage:"gForage",sleep:"gSleep",talk:"gTalk",wander:"gWander",rest:"gRest",travel:"gTravel","gather wood":"wGatherWood","gather stone":"wGatherStone","gather scrap":"wGatherScrap","make an axe":"wAxe","make a spear":"wSpear","build a campfire":"wFire","build a hut":"wHut","feed the fire":"wTend","collect food and store it":"wStore","search the ruins":"wLoot","plant a field":"wFarm","repair the huts":"wRepair"};function id(i){let e={wood:"iWood",stone:"iStone",scrap:"iScrap",axe:"iAxe",spear:"iSpear"};return Object.entries(i??{}).filter(([t,n])=>n>0&&e[t]).map(([t,n])=>t==="axe"||t==="spear"?$(e[t]):`${n} ${$(e[t])}`).join(", ")}var Xo=class{constructor(e=10){this.max=e;this.box=document.createElement("div"),this.box.id="bubbles",document.body.appendChild(this.box);for(let t=0;t<e;t++){let n=document.createElement("div");n.className="bub",n.hidden=!0;let s=document.createElement("div");s.className="ba";let r=document.createElement("div");r.className="bb",n.append(s,r),this.box.appendChild(n),this.pool.push({el:n,a:s,b:r,id:-1,text:"",act:-1,ver:-1,lx:0,ly:0})}}max;box;pool=[];ver=0;pt={x:0,y:0};data=new Map;set(e,t){this.data.clear();for(let n of e){let s={id:n[0],act:n[1],to:String(n[2]??""),dist:Number(n[3])||0,wish:String(n[4]??""),wishWith:String(n[5]??""),why:String(n[6]??""),mood:String(n[7]??""),said:String(n[8]??"")};this.data.set(s.id,s)}this.ver++}hide(){for(let e of this.pool)e.el.hidden=!0,e.id=-1}cand=Array.from({length:48},()=>({id:-1,x:0,y:0,d:0}));wp={x:0,y:0};draw(e,t,n,s,r){let o=0;for(let l of this.data.keys()){if(o>=this.cand.length)break;if(!e(l,this.wp))continue;let h=this.cand[o++];h.id=l,h.x=this.wp.x,h.y=this.wp.y,h.d=Math.hypot(h.x-n,h.y-s)}let a=0;for(;a<this.pool.length&&a<o;a++){let l=a;for(let g=a+1;g<o;g++)this.cand[g].d<this.cand[l].d&&(l=g);if(l!==a){let g=this.cand[a];this.cand[a]=this.cand[l],this.cand[l]=g}let h=this.cand[a],c=this.pool[a],u=this.data.get(h.id);if(!t(h.x,h.y,this.pt)){c.el.hidden=!0;continue}if(c.id!==h.id||c.act!==u.act||c.ver!==this.ver){let g=r(u.act)+(u.to?" \xB7 "+bt("bWith",u.to):"")+(u.dist>=3?` \xB7 ${u.dist} m`:""),v=u.wish==="task"?u.why:u.wish?bt("bWants",$(sd[u.wish]??"gWander")+(u.wishWith?" "+bt("bWith",u.wishWith):""))+(u.why?` (${u.why})`:""):"",p=[u.said?`\u201C${u.said}\u201D`:"",v].filter(Boolean).join(" \xB7 "),d=g+"|"+p;c.text!==d&&(c.text=d,c.a.textContent=g,c.b.textContent=p,c.b.hidden=!p),c.id=h.id,c.act=u.act,c.ver=this.ver}c.el.hidden=!1;let f=Math.round(this.pt.x),m=Math.round(this.pt.y);(f!==c.lx||m!==c.ly)&&(c.lx=f,c.ly=m,c.el.style.transform=`translate(${f}px, ${m}px) translate(-50%, -100%)`)}for(;a<this.pool.length;a++)this.pool[a].el.hidden=!0,this.pool[a].id=-1}},E_={strength:"tStrength",speed:"tSpeed",intelligence:"tIntelligence",courage:"tCourage",empathy:"tEmpathy",metabolism:"tMetabolism",lifespan:"tLifespan"};function Uc(i,e,t){let n=o=>o.replace(/[&<>"']/g,a=>`&#${a.charCodeAt(0)};`),s=`<div class="pn">${n(i.name)}</div><div class="ps">${i.sex==="f"?$("pWoman"):$("pMan")} \xB7 ${bt("pAge",String(i.age))}${i.age<16?" \xB7 "+$("pChild"):""}${i.pregnant?" \xB7 "+$("pExpecting"):""}</div>`;if(!i.alive)return s+`<div class="ps">${$("pDead")}${i.cause?" ("+n(i.cause)+")":""}</div>`;let r=[s,`<div class="pa">${n(e(i.act??0))}${i.carry?" \xB7 "+bt("carry",String(i.carry)):""}${id(i.inv)?" \xB7 "+n(bt("has",id(i.inv))):""}</div>`,`<div class="pbars">${en($("nFood"),i.hunger??0)}${en($("nWater"),i.thirst??0)}${en($("nRest"),i.tired??0)}${en($("nFun"),i.lonely??0)}${en($("nHp"),100-(i.hp??100))}</div>`];if(i.mind){let o=i.mind;r.push(`<div class="pm">${$("pMood")}: <b>${n(o.mood)}</b>${o.plan?` \xB7 ${$("pWants")} ${n($(sd[o.plan.act]??"gWander"))}${o.plan.with?" "+n(bt("bWith",o.plan.with)):""}${o.plan.why?" ("+n(o.plan.why)+")":""}`:""}</div>`),o.said&&r.push(`<div class="pm">${$("pSaid")}: \u201C${n(o.said)}\u201D</div>`)}return t&&(r.push(`<div class="pm">${n(i.personality.join(", "))} \xB7 ${bt("pGen",String(i.generation))}</div>`,`<div class="pm">${$("pPartner")}: ${n(i.partner??$("pNone"))} \xB7 ${$("pParents")}: ${n(i.parents.join(", ")||$("pFirst"))} \xB7 ${$("pChildren")}: ${n(i.children.join(", ")||$("pNone"))}</div>`,`<div class="pm">${$("pTraits")}: ${Object.entries(i.traits).map(([o,a])=>`${$(E_[o]??"tStrength")} ${o==="lifespan"?a:Math.round(a*100)+"%"}`).join(" \xB7 ")}</div>`),i.mind?.memory&&r.push(`<div class="pm">${$("pMemory")}: ${n(i.mind.memory)}</div>`),i.mind?.recent.length&&r.push(`<div class="pm">${$("pRecent")}: ${n(i.mind.recent.join(" \xB7 "))}</div>`)),r.join("")}var vd=document.getElementById("c"),od=document.getElementById("screen"),Md=document.getElementById("top"),bd=document.getElementById("hint"),gi=document.getElementById("note"),Nc=document.getElementById("card"),jn=null,wn="",Ot=null,_t="connect",ut="play",Zo="",pi=0,Fc=0,cn=null,Pt="",eh=256,th=256,En=128,Tn=128,Rs="mid",C_=!0,qe=null,Sd=[],Oc=new Uint8Array(256),Is=new Map,fr=new Map,Hi=[],ea=0,ta=0,na=10,pr=1,wd=0,ia={radius:.3,walk:1.4,run:3.5},lt=4096,Bt=new Int32Array(lt).fill(-1),Ft=new Uint8Array(lt),Bc=new Uint8Array(lt),sa=new Uint8Array(lt),ra=new Float32Array(lt),oa=new Float32Array(lt),An=new Float32Array(lt),Cn=new Float32Array(lt),kc=new Float32Array(lt),zc=new Float32Array(lt),R_=new Float32Array(lt),ur=new Float32Array(lt),Jo=new Float32Array(lt),dr=new Float32Array(lt),Vc=new Float32Array(lt),Hc=new Float32Array(lt),Ed=[],Rn=new Map,aa=0,Gc=100,it=-1,Wc=0,xi=-1,nh=!1,Td=0,Ad="",bn=0,Sn=0,cr=0,hr=0,_i=!1,Xc=150,qc=0,Yc=0,ad=!1,ld=0,ih=0,mr=!1,wt={left:!1,right:!1,up:!1,down:!1},Et=Pc(Ic),Fn=null,ln=!0,gr=!1,Cd=0,It=null,Ts=null,Qn=null,xr=-1,cd=0,Rd=new Float32Array(lt),Id=new Float32Array(lt),Pd=new Uint32Array(lt),$c=0,Ko=0,vt=i=>new Me(i),I_=[9132604,7044426,5926790,10124111,8014667,6184558,10512442,5204830,9076586].map(vt),P_=[15845797,14724226,13011806,10250819,7227951].map(vt),L_=[2825492,4861984,8016432,13214826,1710618,9079434].map(vt),U_=[3881536,4865328,3095370,5261373].map(vt),D_={tunic:vt(7038544),skin:vt(10469247),hair:vt(5660746),pants:vt(4080694)},N_={tunic:vt(3122027),skin:vt(15251600),hair:vt(3810326),pants:vt(3817306)},F_={tunic:vt(14254635),skin:vt(14197370),hair:vt(2825492),pants:vt(4210762)},hd=vt(16765286),O_=vt(16777215);function B_(i){let e=n=>St(i&65535,n),t=(n,s)=>n[Math.floor(e(s)*n.length)];return{tunic:t(I_,1),skin:t(P_,2),hair:t(L_,3),pants:t(U_,4)}}function mi(i,e=""){_t=i,vd.style.visibility=i==="world"?"visible":"hidden",Md.hidden=bd.hidden=i!=="world",i!=="world"&&(gi.hidden=!0,Nc.hidden=!0,Kc="",Ee?.open&&Ee.close(),Ps?.hide()),od.hidden=i==="world";let t="";switch(i){case"connect":t=`<h1>${$("connecting")}</h1>`;break;case"offline":t=`<h1>${$("offline")}</h1><p class="dim">${Zc(wn)}</p><p class="key">A \xB7 ${$("menuServer")}</p>`;break;case"noserver":t=`<h1>${$("noServer")}</h1><p class="key">${$("enterServer")}</p>`;break;case"pair":t=`<h1>${$("pairTitle")}</h1><p>${$("pairHow")}</p><div class="code">${Zo.slice(0,3)} ${Zo.slice(3)}</div><p class="dim">${Zc(k_())}</p><p class="dim">${$("pairWait")}</p>`;break;case"pairfail":t=`<h1>${e}</h1>`;break;case"nogl":t=`<h1>${$("noGl")}</h1>`;break}od.innerHTML=t,i==="pair"&&MyPC.announce?.(`${$("pairTitle")}. ${Zo.split("").join(" ")}`),Sr()}var Zc=i=>i.replace(/[&<>"']/g,e=>`&#${e.charCodeAt(0)};`),k_=()=>wn.replace(/\/+$/,"")+"/panel/",ud=0;function tn(i,e=3500){gi.textContent=i,gi.hidden=!1,clearTimeout(ud),e>0&&(ud=window.setTimeout(()=>{gi.hidden=!0},e)),MyPC.announce?.(i)}function z_(i){let e=i.trim().replace(/\/+$/,"");return/^[a-z]+:\/\//i.test(e)||(e="https://"+e),e.replace(/^http/i,"ws")+"/ws"}function Ls(){if(clearTimeout(Fc),Ot&&(Ot.onclose=null,Ot.close(),Ot=null),!wn){mi("noserver");return}_t!=="world"&&mi(pi>1?"offline":"connect");let i;try{i=new WebSocket(z_(wn))}catch{mi("noserver");return}i.binaryType="arraybuffer",Ot=i,i.onopen=()=>{pi=0,jn?.token?i.send(Pr({t:Ye.Hello,v:1,token:jn.token,name:la()})):i.send(Pr({t:Ye.Pair,v:1,name:la(),dev:V_()}))},i.onmessage=e=>H_(wh(e.data)),i.onclose=()=>{Ot===i&&(Ot=null,_t!=="pairfail"&&(pi++,(_t!=="world"||pi>2)&&mi("offline"),Fc=window.setTimeout(Ls,Math.min(15e3,1e3*2**Math.min(pi,4)))))}}function la(){return String(MyPC.info?.().profile?.name||jn?.name||"Player")}function V_(){return/Tizen|SMART-TV/i.test(navigator.userAgent)?"Samsung TV":/Android/i.test(navigator.userAgent)?"Android":"Browser"}function Lt(i){Ot&&Ot.readyState===1&&Ot.send(Pr(i))}function H_(i){switch(i.t){case Ye.PairCode:Zo=i.code,mi("pair");break;case Ye.Paired:jn={token:i.token,name:i.name,server:wn},MyPC.save("auth",jn),Ot?.close();break;case Ye.Error:i.code==="auth"?(jn=null,MyPC.save("auth",null),setTimeout(Ls,300)):i.code==="expired"||i.code==="denied"?mi("pairfail",$(i.code==="expired"?"pairExpired":"pairDenied")):i.code==="full"&&tn($("worldFull"));break;case Ye.Welcome:{cn=i,gr=!!i.seer,Sd=Qu(i.tiles),Oc.fill(0);for(let e of i.tiles)e.solid&&(Oc[e.id]=1);if(i.body&&(ia=i.body),ea=i.clock.gameSec,ta=performance.now(),na=i.clock.clockScale,pr=i.clock.paused?0:i.clock.speed,!qe){try{qe=new ko(vd,Rs)}catch{mi("nogl");return}jc()}!Pt||!i.maps.some(e=>e.id===Pt)?Qo(String(MyPC.load("map",i.maps[0].id))):Qo(Pt),mi("world"),ut==="play"&&Lt({t:Ye.Join}),_r();break}case Ye.You:{xi=i.id,nh=i.transit,Ad=i.map,Td=i.arrive??0,_i=!1,!i.transit&&i.map!==Pt&&Qo(i.map),ut==="play"&&i.x!==void 0&&i.y!==void 0&&(En=i.x,Tn=i.y,yi=!0,it=-1,_r()),i.transit?tn(bt("travelling",ca(i.map)),0):gi.hidden=!0;break}case Ye.Notice:if(i.kind==="people"&&K_(i.data),i.kind==="interact"){let e=i.data,t=e?Rn.get(e.id):void 0;tn(e?e.kind===qt.Player?$("metPlayer"):`${Wi(t!==void 0?sa[t]:0)}...`:$("nobody"))}if(i.kind==="say"){let e=i.data;tn(`${e.name}: \u201C${e.text}\u201D`,7e3)}if(i.kind==="did"&&ny(i.data),i.kind==="me"&&(It=i.data,yr()),i.kind==="info"){let e=i.data;e&&e.id===xr&&(Qn=e,yr(),Ee.open&&Ee.page==="person"&&Ee.refresh())}i.kind==="minds"&&(gr=!0,Cd=performance.now(),Ps.set(i.data,Wi));break;case Ye.Pong:Xc=Xc*.7+(performance.now()-i.c)*.3;break;case Ye.Chunk:{if(i.map!==Pt||!cn)break;let e=Lr(i.cx,i.cy);Is.set(e,i.tiles),X_(e);break}case Ye.ChunkDrop:if(i.map!==Pt)break;for(let e of i.keys){Is.delete(e);let t=fr.get(e);t&&(qe?.removeChunk(t),fr.delete(e))}break;case Ye.Frame:{if(i.map!==Pt)break;let e=performance.now();Gc=Gc*.85+Math.min(400,e-aa)*.15,aa=e,ea=i.gameSec,ta=e;for(let n=0;n<lt;n++)Bt[n]!==-1&&(ra[n]=An[n],oa[n]=Cn[n]);let t=Eh(i.upd);for(let n=0;n<t.length;n+=7){let s=G_(t[n]);if(s<0)continue;let r=Ft[s]===0;Ft[s]=t[n+1]&255,Bc[s]=t[n+1]>>8&255,sa[s]=t[n+1]>>16&255,An[s]=t[n+2]/100,Cn[s]=t[n+3]/100,R_[s]=t[n+4]/1e4,kc[s]=t[n+5]/100,zc[s]=t[n+6]/100,r&&(ra[s]=Vc[s]=An[s],oa[s]=Hc[s]=Cn[s],dr[s]=0,Jo[s]=0,ur[s]=Math.atan2(kc[s],zc[s])||0,Ed[s]=B_(t[n]))}for(let n of i.del){let s=Rn.get(n);s!==void 0&&(Bt[s]=-1,Ft[s]=0,Rn.delete(n)),n===it&&(it=-1)}break}case Ye.Stats:wd=i.s.agents,pr=i.s.paused?0:i.s.speed;break}}function G_(i){let e=Rn.get(i);if(e!==void 0)return e;for(let t=0;t<lt;t++)if(Bt[t]===-1)return Bt[t]=i,Rn.set(i,t),t;return-1}function W_(){Bt.fill(-1),Ft.fill(0),Rn.clear(),it=-1}var Wi=i=>$(["actIdle","actWander","actDrink","actEat","actForage","actSleep","actTalk","actTravel","actRest","actFlee","actGo","actGather","actBuild","actFight"][i]??"actIdle"),ca=i=>cn?.maps.find(e=>e.id===i)?.name??i;function X_(i){Hi.includes(i)||Hi.push(i)}function q_(i,e,t){let n=i&65535,s=i>>>16;if(e<0?(n--,e+=32):e>=32&&(n++,e-=32),t<0?(s--,t+=32):t>=32&&(s++,t-=32),n<0||s<0)return-1;let r=Is.get(Lr(n,s));return r?r[t*32+e]:-1}function Y_(){if(!Hi.length||!qe)return;let i=0,e=1/0,t=Mr()/32-.5,n=br()/32-.5;for(let a=0;a<Hi.length;a++){let l=Hi[a],h=Math.hypot((l&65535)-t,(l>>>16)-n);h<e&&(e=h,i=a)}let s=Hi.splice(i,1)[0];if(!Is.has(s))return;let r=fr.get(s);r&&qe.removeChunk(r);let o=nd(s&65535,s>>>16,(a,l)=>q_(s,a,l),Sd,Rs==="high");fr.set(s,qe.addChunk(o.ground,o.props,o.glow))}function Qo(i){if(!cn)return;let e=cn.maps.find(t=>t.id===i)??cn.maps[0];Pt=e.id,eh=e.w,th=e.h,En=e.w/2,Tn=e.h/2,Is.clear(),fr.clear(),Hi.length=0,qe?.setMap(e.w,e.h,cn.portals.filter(t=>t.map===Pt)),W_(),_i=!1,yi=!0,MyPC.save("map",Pt),_r()}function $_(){return Math.min(96,(qe?.dist??24)*1.2+14)}function _r(){cn&&Lt({t:Ye.View,map:Pt,x:Mr(),y:br(),r:$_()})}function sh(){return xi>=0?Rn.get(xi)??-1:-1}function ua(){return ut==="play"&&xi>=0&&!nh}function Mr(){return ua()&&_i?bn:En}function br(){return ua()&&_i?Sn:Tn}function $o(i,e){let t=Math.floor(i),n=Math.floor(e);if(t<0||n<0||t>=eh||n>=th)return!0;let s=Is.get(Lr(t/32|0,n/32|0));return s?Oc[s[n%32*32+t%32]]===1:!1}function dd(i,e){let t=ia.radius*.9;return $o(i-t,e-t)||$o(i+t,e-t)||$o(i-t,e+t)||$o(i+t,e+t)}function Ld(){if(Ee.open)return Dc[0]=Dc[1]=0,Dc;let i=MyPC.gamepad?MyPC.gamepad.axis(0):0,e=MyPC.gamepad?MyPC.gamepad.axis(1):0;Math.hypot(i,e)<.18&&(i=0,e=0),wt.left&&(i=-1),wt.right&&(i=1),wt.up&&(e=-1),wt.down&&(e=1);let t=Math.hypot(i,e);return t>1&&(i/=t,e/=t),[i,e]}var fd=[0,0],Dc=[0,0];function Z_(i,e){let[t,n]=Ld();fd[0]=t,fd[1]=n;let s=mr&&!Ee.open,r=Math.round(t*50)/50,o=Math.round(n*50)/50;(r!==qc||o!==Yc||s!==ad||(r||o)&&e-ld>200)&&(qc=r,Yc=o,ad=s,ld=e,Lt({t:Ye.Input,mx:r,my:o,run:s,seq:++ih}));let a=sh();if(a<0)return;_i||(bn=An[a],Sn=Cn[a],cr=hr=0,_i=!0);let l=s?ia.run:ia.walk,h=t*l,c=n*l,u=h-cr,f=c-hr,m=Math.hypot(u,f),g=8*i,v=m>g?g/m:1;cr+=u*v,hr+=f*v;let p=bn+cr*i;dd(p,Sn)?cr=0:bn=p;let d=Sn+hr*i;dd(bn,d)?hr=0:Sn=d;let w=Math.min(.5,(e-aa)/1e3+Xc/2e3),S=An[a]+kc[a]*w,_=Cn[a]+zc[a]*w,I=S-bn,T=_-Sn,A=Math.hypot(I,T);if(A>2.5)bn=S,Sn=_;else{let C=1-Math.exp(-i*(A>.6?6:2.5));bn+=I*C,Sn+=T*C}}function Ud(){if(!cn)return;let i=cn.maps.findIndex(e=>e.id===Pt);Qo(cn.maps[(i+1)%cn.maps.length].id),MyPC.announce?.(ca(Pt))}function ha(i){qe&&(qe.dist=Math.max(12,Math.min(70,qe.dist*i)),MyPC.save("dist",qe.dist))}function Jc(){let i=-1,e=1/0,t=-1,n=1/0,s=it>=0?Rn.get(it)??-1:-1,r=s>=0?Math.hypot(An[s]-En,Cn[s]-Tn):-1;for(let a=0;a<lt;a++){if(Bt[a]===-1||Ft[a]!==qt.Agent&&Ft[a]!==qt.Player||a===s||Bt[a]===xi)continue;let l=Math.hypot(An[a]-En,Cn[a]-Tn);l<e&&(e=l,i=a),l>r&&l<n&&(n=l,t=a)}let o=s>=0&&t>=0?t:i;if(o>=0&&(s<0||t>=0)){it=Bt[o],MyPC.announce?.(`${$("following")} #${it&65535}`);return}Lt({t:Ye.Who,map:Pt})}var J_=0;function K_(i){let e=i.filter(n=>n[0]!==xi);if(!e.length){tn($("nobody"));return}let t=e[J_++%e.length];En=t[1],Tn=t[2],it=t[0],Wc=performance.now(),yi=!0,_r(),MyPC.announce?.(`${$("following")} #${it&65535}`)}function Q_(){let[i,e]=Ld();if(i||e){it=-1;let t=(qe?.dist??24)/24*.35;En=Math.max(0,Math.min(eh,En+i*t)),Tn=Math.max(0,Math.min(th,Tn+e*t))}if(it>=0){let t=Rn.get(it);t!==void 0?(En=An[t],Tn=Cn[t],Wc=performance.now()):performance.now()-Wc>4e3&&(it=-1)}}function j_(i){if(ut=i,MyPC.save("how",i),Dd(),Sr(),i==="play")Lt({t:Ye.Join}),_i=!1,yi=!0;else{Lt({t:Ye.Input,mx:0,my:0,run:!1,seq:++ih});let e=sh();e>=0&&(En=An[e],Tn=Cn[e])}}async function rh(){let i=MyPC.text?.keyboard?await MyPC.text.keyboard({value:wn,kind:"url",label:$("serverLabel"),ok:"OK"}):window.prompt($("serverLabel"),wn);i===null||!i.trim()||(wn=i.trim(),MyPC.save("server",wn),pi=0,Ls())}function ey(){jn=null,MyPC.save("auth",null),pi=0,Ls()}function Dd(){MyPC.setMenu([{id:"game",label:$("gameMenuItem")},{id:"server",label:$("menuServer")}])}function Sr(){let i=s=>{if(Ko){let o=Et.pad[s];return o===void 0?"":String(MyPC.gamepad?.label?.(o)??MyPC.gamepad?.name?.(o)??o)}let r=Et.remote[s];return r?qo(r):""},e=(s,r)=>{let o=i(s);return o?`${o}: ${r}`:""},t=`${$("hMove")}: ${Ko?"stick":"\u2190 \u2191 \u2192 \u2193"}`,n=ut==="play"?[t,e("use",Mn("use")),e("run",Mn("run")),e("eat",Mn("eat")),e("sleep",Mn("sleep")),e("menu",Mn("menu"))]:[t,e("use",$("wFollow")),e("eat",$("wMap")),e("sleep",$("wCard")),e("menu",Mn("menu"))];Ko||n.push($("hintMenu")),bd.textContent=n.filter(Boolean).join(" \xB7 ")}function Nd(i){let e=Mr(),t=br(),n=-1,s=i;for(let r=0;r<lt;r++){if(Bt[r]===-1||Ft[r]!==qt.Agent)continue;let o=Math.hypot(An[r]-e,Cn[r]-t);o<s&&(s=o,n=Bt[r])}return n}function Gi(i,e){if(i==="run"){mr=e;return}if(!(!e||_t!=="world")){switch(i){case"menu":As();return;case"zoomIn":ha(1/1.2);return;case"zoomOut":ha(1.2);return;case"thoughts":ln=!ln,MyPC.save("thoughts",ln),ln||Ps.hide(),tn(`${$("sThoughts")}: ${$(ln?"on":"off")}`,1500);return;case"person":As("person");return}if(ut==="watch"){i==="use"?Jc():i==="eat"?Ud():i==="sleep"&&As("person");return}if(ua()){if(i==="use"){if(Nd(2.8)<0){Lt({t:Ye.Do,a:"use"});return}if(!MyPC.text?.keyboard){Lt({t:Ye.Do,a:"talk"});return}Lt({t:Ye.Do,a:"hold"}),wt.left=wt.right=wt.up=wt.down=!1,mr=!1,MyPC.text.keyboard({value:"",kind:"text",label:$("sayLabel"),ok:"OK"}).then(t=>{Lt(t&&t.trim()?{t:Ye.Do,a:"talk",text:t.trim().slice(0,300)}:{t:Ye.Do,a:"talk"})});return}Lt({t:Ye.Do,a:i})}}}var ty={};function ny(i){if(i.code==="roster"){Ts=i.list??[],Ee.page==="goto"&&Ee.refresh();return}if(i.code==="tp"){bn=i.x??bn,Sn=i.y??Sn,yi=!0,tn(bt("dTp",i.name??""),3e3);return}if(i.code==="zHit"||i.code==="zKilled"){tn($(i.code),1800);return}let t={drank:"dDrank",picked:"dPicked",ate:"dAte",sleep:"dSleep",wake:"dWake",noWater:"dNoWater",nothing:"dNothing",noFood:"dNoFood",full:"dFull",talk:"dTalk",nobody:"dNobody"}[i.code];t&&tn(t==="dPicked"?bt("dPicked",ty[i.item??""]??i.item??""):$(t),2500)}var Kc="";function yr(){let i="";_t==="world"&&!Ee.open&&(ut==="play"&&It?i=`<div class="pn">${Zc(la())}</div><div class="pbars">${en($("nFood"),It.hunger)}${en($("nWater"),It.thirst)}${en($("nRest"),It.tired)}${It.hp!==void 0&&It.hp<100?en($("nHp"),100-It.hp):""}</div><div class="pa">${It.asleep?Wi(5):""}${It.carry?(It.asleep?" \xB7 ":"")+bt("carry",String(It.carry)):""}</div>`:ut==="watch"&&it>=0&&Qn&&Qn.id===it&&(i=Uc(Qn,Wi,!1))),i!==Kc&&(Kc=i,Nc.innerHTML=i,Nc.hidden=!i)}function oh(){return ut==="watch"?it:Nd(10)}function iy(i){return $(i?"on":"off")}function sy(i){let e=Et.pad[i],t=Et.remote[i];return`${e===void 0?$("cNone"):String(MyPC.gamepad?.label?.(e)??MyPC.gamepad?.name?.(e)??e)} \xB7 ${t?qo(t):$("cNone")}`}function ry(i){let e=[];switch(i){case"root":return e.push({id:"resume",label:$("mResume")}),ut==="play"&&e.push({id:"actions",label:$("mActions"),sub:!0},{id:"goto",label:$("mGoTo"),sub:!0}),oh()>=0&&e.push({id:"person",label:ut==="play"?$("mNearby"):$("mPerson"),sub:!0}),ut==="watch"&&e.push({id:"next",label:$("mNextPerson")},{id:"map",label:$("mNextMap")}),e.push({id:"how",label:$(ut==="play"?"mWatch":"mPlay")}),e.push({id:"settings",label:$("mSettings"),sub:!0},{id:"controls",label:$("mControls"),sub:!0}),{id:i,title:$("mTitle"),rows:e};case"actions":for(let t of["use","drink","eat","pickup","sleep"])e.push({id:t,label:Mn(t)});return{id:i,title:$("mActions"),rows:e,html:It?`<div class="pbars">${en($("nFood"),It.hunger)}${en($("nWater"),It.thirst)}${en($("nRest"),It.tired)}</div>`:void 0};case"goto":for(let[t,n,s]of Ts??[])e.push({id:"p"+t,label:n,value:s});return Ts&&!Ts.length&&e.push({id:"back",label:$("mBack")}),{id:i,title:$("mGoTo"),rows:e,text:Ts?$("mGoToHelp"):"\u2026"};case"person":return e.push({id:"back",label:$("mBack")}),ut==="watch"&&e.push({id:"next",label:$("mNextPerson")}),{id:i,title:Qn?.name??$("mPerson"),rows:e,wide:!0,html:Qn&&Qn.id===xr?Uc(Qn,Wi,!0):"\u2026"};case"settings":return gr&&e.push({id:"thoughts",label:$("sThoughts"),value:iy(ln)}),e.push({id:"zin",label:$("aZoomIn")},{id:"zout",label:$("aZoomOut")},{id:"server",label:$("sServer"),value:wn},{id:"unpair",label:$("sUnpair")}),{id:i,title:$("mSettings"),rows:e,text:gr?void 0:$("sThoughtsOnly")};case"controls":for(let t of lr)e.push({id:t,label:Mn(t),value:sy(t)});return e.push({id:"reset",label:$("cReset")}),{id:i,title:$("mControls"),rows:e,text:`${$("cHelp")} ${$("cWatchNote")}`}}return{id:i,title:"",rows:e}}function oy(i,e){if(i==="root")e==="resume"?Ee.close():e==="actions"||e==="settings"||e==="controls"?Ee.push(e):e==="goto"?(Ts=null,Lt({t:Ye.Do,a:"roster"}),Ee.push("goto")):e==="person"?(vr(oh(),!0),Ee.push("person")):e==="next"?(Ee.close(),Jc()):e==="map"?(Ee.close(),Ud()):e==="how"&&(Ee.close(),j_(ut==="play"?"watch":"play"));else if(i==="actions")Ee.close(),Gi(e,!0);else if(i==="goto")e==="back"?Ee.back():(Ee.close(),Lt({t:Ye.Do,a:"tp",text:e.slice(1)}));else if(i==="person")e==="back"?Ee.back():e==="next"&&(Jc(),window.setTimeout(()=>{vr(it,!0),Ee.refresh()},300));else if(i==="settings")e==="thoughts"?(ln=!ln,MyPC.save("thoughts",ln),ln||Ps.hide(),Ee.refresh()):e==="zin"?ha(1/1.2):e==="zout"?ha(1.2):e==="server"?(Ee.close(),rh()):e==="unpair"&&(Ee.close(),ey());else if(i==="controls"){if(e==="reset"){Et=Pc(Ic),MyPC.save("binds",Et),Ee.refresh(),Sr();return}Fn=e,tn(bt("cPress",Mn(Fn)),0)}}var Ee=new Wo(ry,oy,()=>{Fn=null,gi.hidden=!0,yr(),MyPC.back?.(!1)}),Ps=new Xo(8);function As(i="root"){if(_t==="world"){if(wt.left=wt.right=wt.up=wt.down=!1,mr=!1,i==="person"){let e=oh();if(e<0){tn($("nobody"),2e3);return}vr(e,!0)}Ee.show("root"),i!=="root"&&Ee.push(i),MyPC.back?.(!0),yr()}}function vr(i,e=!1){i<0||(i!==xr&&(xr=i,Qn=null),(e||performance.now()-cd>1e3)&&(cd=performance.now(),Lt({t:Ye.Info,id:i})))}function Fd(i,e){let t=Fn;Fn=null;let n=i==="pad"?Et.pad:Et.remote;for(let r of lr)n[r]===e&&delete n[r];n[t]=e,MyPC.save("binds",Et);let s=i==="pad"?String(MyPC.gamepad?.label?.(e)??e):qo(e);tn(bt("cSet",Mn(t),s),2500),Ee.refresh(),Sr()}var Qc=1e3/60,Cs=0,Es=0,jo=0,pd=0,md=0,gd=0,yi=!0;function ay(i){_t==="world"&&(ut==="play"?Z_(Qc/1e3,i):Q_())}function ly(i,e){if(_t!=="world"||!qe)return;Y_();let t=Mr(),n=br();qe.follow(t,n,e,yi),yi=!1;let s=ea+(i-ta)/1e3*na*pr;qe.setHour(((s/3600+8)%24+24)%24,i/1e3);let r=Math.min(1.25,(i-aa)/Gc),o=qe.people,a=ua()&&_i?sh():-1,l=i/1e3,h=qe.dist*1.6+8;$c++,o.begin(),qe.beginShots(),qe.beginItems();for(let c=0;c<lt;c++){if(Bt[c]===-1)continue;let u=ra[c]+(An[c]-ra[c])*r,f=oa[c]+(Cn[c]-oa[c])*r;if(c===a&&(u=bn,f=Sn),Math.abs(u-t)>h||Math.abs(f-n)>h)continue;if(Ft[c]===qt.Projectile){qe.shot(u,f);continue}if(Ft[c]===qt.Item){qe.item(u,f,sa[c],Bt[c]);continue}if(Ft[c]!==qt.Agent&&Ft[c]!==qt.Player&&Ft[c]!==qt.Threat)continue;let m=u-Vc[c],g=f-Hc[c],v=Math.hypot(m,g);Vc[c]=u,Hc[c]=f;let p=e>0?Math.min(6,v/e):0;if(dr[c]=dr[c]+(p-dr[c])*Math.min(1,e*10),v>.004){let I=Math.atan2(m,g)-ur[c];I=Math.atan2(Math.sin(I),Math.cos(I)),ur[c]=ur[c]+I*Math.min(1,e*12)}Jo[c]=(Jo[c]+v*4.2)%(Math.PI*2),Rd[c]=u,Id[c]=f,Pd[c]=$c;let d=(Bc[c]&(Tr.Sleeping|Tr.Dead))!==0,w=Ft[c]===qt.Threat,S=w?D_:c===a||Bt[c]===xi?N_:Ft[c]===qt.Player?F_:Ed[c];o.add(u,f,ur[c],Jo[c],Math.min(1,dr[c]/(w?1.2:2.2)),S,d,Bc[c]&Tr.Child?.62:1,w),Ft[c]===qt.Player?o.marker(u,f,l,Bt[c]===xi?hd:O_):Bt[c]===it&&o.marker(u,f,l,hd)}o.end(),qe.endShots(),qe.endItems(),qe.render(),gr&&ln&&!Ee.open&&i-Cd<4e3?Ps.draw(cy,hy,t,n,Wi):Ps.hide()}function cy(i,e){let t=Rn.get(i);return t===void 0||Pd[t]!==$c?!1:(e.x=Rd[t],e.y=Id[t],!0)}var hy=(i,e,t)=>!!qe&&qe.project(i,2.2,e,t);function Od(i){Cs=requestAnimationFrame(Od),Es||(Es=i);let e=Math.min(.1,(i-Es)/1e3);for(jo+=Math.min(250,i-Es),Es=i;jo>=Qc;)ay(i),jo-=Qc;ly(i,e),i-pd>250&&(pd=i,_r()),i-gd>3e3&&(gd=i,Lt({t:Ye.Ping,c:i})),i-md>500&&_t==="world"&&(md=i,uy(i),ut==="watch"&&it>=0?vr(it):Ee.open&&Ee.page==="person"&&vr(xr),yr())}var xd="";function uy(i){let e=ea+(i-ta)/1e3*na*pr,t=Math.floor((e/3600+8)/24)+1,n=Math.floor((e/3600+8)%24),s=Math.floor(e/60%60),r=it>=0?Rn.get(it):void 0,o=ut==="play"?la():it>=0?`${$("following")} #${it&65535}${r!==void 0?" \xB7 "+Wi(sa[r]):""}`:$("free"),a=`${ca(Pt)} \xB7 ${$("day")} ${t} ${String(n).padStart(2,"0")}:${String(s).padStart(2,"0")} \xB7 ${wd} ${$("agents")} \xB7 ${o}`;if(a!==xd&&(xd=a,Md.textContent=a),nh&&ut==="play"){let l=Math.max(0,Math.ceil((Td-e)/Math.max(.01,na*pr)));gi.textContent=`${bt("travelling",ca(Ad))} ${l} s`,gi.hidden=!1}}function jc(){let i=Math.min(1,Math.min(1920/innerWidth,1080/innerHeight,window.devicePixelRatio||1))*(Rs==="low"?.6:Rs==="mid"?.8:1);qe?.resize(Math.round(innerWidth*i),Math.round(innerHeight*i))}function _d(){Cs||(Es=0,jo=0,Cs=requestAnimationFrame(Od))}function yd(){Cs&&cancelAnimationFrame(Cs),Cs=0,wt.left=wt.right=wt.up=wt.down=!1,mr=!1,ut==="play"&&Lt({t:Ye.Input,mx:0,my:0,run:!1,seq:++ih}),qc=Yc=0}var Bd={left:1,right:1,up:1,down:1};function kd(i,e,t){if(Ee.open){e&&(i==="up"||i==="down")&&Ee.input(i);return}t||(wt[i]=e)}function ah(){_t==="noserver"||_t==="offline"?rh():_t==="pairfail"&&(pi=0,_t="connect",Ls())}function dy(i,e,t){if(i in Bd){kd(i,e,t);return}if(Fn){e&&!t&&Fd("remote",i);return}if(_t!=="world"){e&&i==="ok"&&ah();return}if(Ee.open){if(!e||t)return;i==="ok"?Ee.input("ok"):ws(Et,i)==="menu"&&Ee.close();return}let n=ws(Et,i);n&&!t&&Gi(n,e)}function fy(i,e){if(i>=12&&i<=16)return;if(Fn){e&&Fd("pad",i);return}if(_t!=="world"){e&&i===0&&ah();return}if(Ee.open){if(!e)return;i===0?Ee.input("ok"):i===1?Ee.input("back"):Lc(Et,i)==="menu"&&Ee.close();return}let t=Lc(Et,i);t&&Gi(t,e)}MyPC.init({keys:["channel","buttons"],ownMenu:!0,onInit(i){Ju(i.lang),document.documentElement.lang=i.lang,document.documentElement.dir=i.lang==="ar"?"rtl":"ltr",Rs=i.quality?.tier??"mid";let e=new URLSearchParams(location.search);(e.get("tier")==="low"||e.get("tier")==="mid"||e.get("tier")==="high")&&(Rs=e.get("tier"));let t=MyPC.app_config??{};jn=MyPC.load("auth",null);let n=/github\.io$/i.test(location.hostname)?"":location.origin;wn=String(e.get("server")||t.server||MyPC.load("server","")||jn?.server||n),ut=MyPC.load("how","play")==="watch"?"watch":"play",e.get("watch")!==null&&(ut="watch");let s=MyPC.load("binds",null);s&&s.pad&&s.remote&&(Et={pad:{...s.pad},remote:{...s.remote}}),ln=MyPC.load("thoughts",!0)!==!1,window.addEventListener("resize",jc),Dd(),MyPC.gamepad&&(MyPC.gamepad.on("pads",r=>{Ko=r.length,C_=!r.length,Sr()}),MyPC.gamepad.on("button",(r,o)=>fy(r,o))),MyPC.buttons?.on?.((r,o,a)=>dy(r,o,!!a)),e.get("dev")!==null&&(window.__dev={me:()=>[Mr(),br(),Pt],look:(r,o)=>{it=-1,En=r,Tn=o,yi=!0}}),MyPC.ready()},onStart(){let i=Number(MyPC.load("dist",24))||24;Ls(),_d(),queueMicrotask(()=>{qe&&(qe.dist=i)}),py=i},onPause:yd,onResume:_d,onDestroy(){yd(),clearTimeout(Fc),window.removeEventListener("resize",jc),Ot&&(Ot.onclose=null,Ot.close(),Ot=null),qe?.dispose(),qe=null},onMenu(i){i==="game"?setTimeout(()=>As(),50):i==="server"&&rh()},onInput(i,e,t,n){if(i in Bd){kd(i,e,t);return}let s=!!n&&/^pad/.test(n);if(i==="cancel")return e?Fn?(Fn=null,tn($("mControls"),800),!0):Ee.open?(Ee.input("back"),!0):s?!0:_t!=="world"?!1:(As(),!0):s?!0:void 0;if(!(s||i==="jump"||i==="menu"&&s)){if(i==="menu"){e&&(Ee.open?Ee.close():As());return}if(!Fn){if(i==="confirm"){if(!e)return;if(_t!=="world"){ah();return}if(Ee.open){Ee.input("ok");return}Gi(n==="touch"?"use":ws(Et,"ok")??"use",!0);return}if(!(_t!=="world"||Ee.open)){if(i==="run"){Gi("run",e);return}e&&(i==="pageUp"?Gi(ws(Et,"chUp")??"zoomIn",!0):i==="pageDown"&&Gi(ws(Et,"chDown")??"zoomOut",!0))}}}}});var py=24;
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2024 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
