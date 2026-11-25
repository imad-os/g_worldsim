var Rt={None:0,Agent:1,Projectile:2,Item:3,Prop:4,Threat:5,Player:6,Animal:7,Npc:8},ms={Alive:1,Moving:2,Sleeping:4,Transit:8,Dead:16,Child:32,Small:64,Carried:128},_e={Hello:"hi",View:"view",Ping:"ping",Who:"who",Admin:"adm",Pair:"pair",Join:"join",Input:"in",Do:"do",Info:"info",Welcome:"wel",Error:"err",Chunk:"chk",ChunkDrop:"chx",Frame:"frm",Stats:"sts",Pong:"pong",AdminResult:"admr",PairCode:"pairc",Paired:"paired",Notice:"note",You:"you"};function yd(i){let e=i.length,t=0,n=0;for(;n<e;){let s=i.charCodeAt(n++);if((s&4294967168)===0){t++;continue}else if((s&4294965248)===0)t+=2;else{if(s>=55296&&s<=56319&&n<e){let r=i.charCodeAt(n);(r&64512)===56320&&(++n,s=((s&1023)<<10)+(r&1023)+65536)}(s&4294901760)===0?t+=3:t+=4}}return t}function Lm(i,e,t){let n=i.length,s=t,r=0;for(;r<n;){let a=i.charCodeAt(r++);if((a&4294967168)===0){e[s++]=a;continue}else if((a&4294965248)===0)e[s++]=a>>6&31|192;else{if(a>=55296&&a<=56319&&r<n){let o=i.charCodeAt(r);(o&64512)===56320&&(++r,a=((a&1023)<<10)+(o&1023)+65536)}(a&4294901760)===0?(e[s++]=a>>12&15|224,e[s++]=a>>6&63|128):(e[s++]=a>>18&7|240,e[s++]=a>>12&63|128,e[s++]=a>>6&63|128)}e[s++]=a&63|128}}var Dm=new TextEncoder,Nm=50;function Um(i,e,t){Dm.encodeInto(i,e.subarray(t))}function _d(i,e,t){i.length>Nm?Um(i,e,t):Lm(i,e,t)}var km=4096;function ic(i,e,t){let n=e,s=n+t,r=[],a="";for(;n<s;){let o=i[n++];if((o&128)===0)r.push(o);else if((o&224)===192){let l=i[n++]&63;r.push((o&31)<<6|l)}else if((o&240)===224){let l=i[n++]&63,h=i[n++]&63;r.push((o&31)<<12|l<<6|h)}else if((o&248)===240){let l=i[n++]&63,h=i[n++]&63,c=i[n++]&63,u=(o&7)<<18|l<<12|h<<6|c;u>65535&&(u-=65536,r.push(u>>>10&1023|55296),u=56320|u&1023),r.push(u)}else r.push(o);r.length>=km&&(a+=String.fromCharCode(...r),r.length=0)}return r.length>0&&(a+=String.fromCharCode(...r)),a}var Fm=new TextDecoder,Bm=200;function Om(i,e,t){let n=i.subarray(e,e+t);return Fm.decode(n)}function bd(i,e,t){return t>Bm?Om(i,e,t):ic(i,e,t)}var gs=class{type;data;constructor(e,t){this.type=e,this.data=t}};var fn=class i extends Error{constructor(e){super(e);let t=Object.create(i.prototype);Object.setPrototypeOf(this,t),Object.defineProperty(this,"name",{configurable:!0,enumerable:!1,value:i.name})}};function Md(i,e,t){let n=t/4294967296,s=t;i.setUint32(e,n),i.setUint32(e+4,s)}function Qa(i,e,t){let n=Math.floor(t/4294967296),s=t;i.setUint32(e,n),i.setUint32(e+4,s)}function eo(i,e){let t=i.getInt32(e),n=i.getUint32(e+4);return t*4294967296+n}function wd(i,e){let t=i.getUint32(e),n=i.getUint32(e+4);return t*4294967296+n}var zm=-1,Hm=4294967296-1,Vm=17179869184-1;function Gm({sec:i,nsec:e}){if(i>=0&&e>=0&&i<=Vm)if(e===0&&i<=Hm){let t=new Uint8Array(4);return new DataView(t.buffer).setUint32(0,i),t}else{let t=i/4294967296,n=i&4294967295,s=new Uint8Array(8),r=new DataView(s.buffer);return r.setUint32(0,e<<2|t&3),r.setUint32(4,n),s}else{let t=new Uint8Array(12),n=new DataView(t.buffer);return n.setUint32(0,e),Qa(n,4,i),t}}function Wm(i){let e=i.getTime(),t=Math.floor(e/1e3),n=(e-t*1e3)*1e6,s=Math.floor(n/1e9);return{sec:t+s,nsec:n-s*1e9}}function qm(i){if(i instanceof Date){let e=Wm(i);return Gm(e)}else return null}function $m(i){let e=new DataView(i.buffer,i.byteOffset,i.byteLength);switch(i.byteLength){case 4:return{sec:e.getUint32(0),nsec:0};case 8:{let t=e.getUint32(0),n=e.getUint32(4),s=(t&3)*4294967296+n,r=t>>>2;return{sec:s,nsec:r}}case 12:{let t=eo(e,4),n=e.getUint32(0);return{sec:t,nsec:n}}default:throw new fn(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${i.length}`)}}function Xm(i){let e=$m(i);return new Date(e.sec*1e3+e.nsec/1e6)}var Sd={type:zm,encode:qm,decode:Xm};var Js=class i{static defaultCodec=new i;__brand;builtInEncoders=[];builtInDecoders=[];encoders=[];decoders=[];constructor(){this.register(Sd)}register({type:e,encode:t,decode:n}){if(e>=0)this.encoders[e]=t,this.decoders[e]=n;else{let s=-1-e;this.builtInEncoders[s]=t,this.builtInDecoders[s]=n}}tryToEncode(e,t){for(let n=0;n<this.builtInEncoders.length;n++){let s=this.builtInEncoders[n];if(s!=null){let r=s(e,t);if(r!=null){let a=-1-n;return new gs(a,r)}}}for(let n=0;n<this.encoders.length;n++){let s=this.encoders[n];if(s!=null){let r=s(e,t);if(r!=null){let a=n;return new gs(a,r)}}}return e instanceof gs?e:null}decode(e,t,n){let s=t<0?this.builtInDecoders[-1-t]:this.decoders[t];return s?s(e,t,n):new gs(t,e)}};function Ym(i){return i instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&i instanceof SharedArrayBuffer}function Zr(i){return i instanceof Uint8Array?i:ArrayBuffer.isView(i)?new Uint8Array(i.buffer,i.byteOffset,i.byteLength):Ym(i)?new Uint8Array(i):Uint8Array.from(i)}var Km=100,Zm=2048,Jr=class i{extensionCodec;context;useBigInt64;maxDepth;initialBufferSize;sortKeys;forceFloat32;ignoreUndefined;forceIntegerToFloat;pos;view;bytes;entered=!1;constructor(e){this.extensionCodec=e?.extensionCodec??Js.defaultCodec,this.context=e?.context,this.useBigInt64=e?.useBigInt64??!1,this.maxDepth=e?.maxDepth??Km,this.initialBufferSize=e?.initialBufferSize??Zm,this.sortKeys=e?.sortKeys??!1,this.forceFloat32=e?.forceFloat32??!1,this.ignoreUndefined=e?.ignoreUndefined??!1,this.forceIntegerToFloat=e?.forceIntegerToFloat??!1,this.pos=0,this.view=new DataView(new ArrayBuffer(this.initialBufferSize)),this.bytes=new Uint8Array(this.view.buffer)}clone(){return new i({extensionCodec:this.extensionCodec,context:this.context,useBigInt64:this.useBigInt64,maxDepth:this.maxDepth,initialBufferSize:this.initialBufferSize,sortKeys:this.sortKeys,forceFloat32:this.forceFloat32,ignoreUndefined:this.ignoreUndefined,forceIntegerToFloat:this.forceIntegerToFloat})}reinitializeState(){this.pos=0}encodeSharedRef(e){if(this.entered)return this.clone().encodeSharedRef(e);try{return this.entered=!0,this.reinitializeState(),this.doEncode(e,1),this.bytes.subarray(0,this.pos)}finally{this.entered=!1}}encode(e){if(this.entered)return this.clone().encode(e);try{return this.entered=!0,this.reinitializeState(),this.doEncode(e,1),this.bytes.slice(0,this.pos)}finally{this.entered=!1}}doEncode(e,t){if(t>this.maxDepth)throw new Error(`Too deep objects in depth ${t}`);e==null?this.encodeNil():typeof e=="boolean"?this.encodeBoolean(e):typeof e=="number"?this.forceIntegerToFloat?this.encodeNumberAsFloat(e):this.encodeNumber(e):typeof e=="string"?this.encodeString(e):this.useBigInt64&&typeof e=="bigint"?this.encodeBigInt64(e):this.encodeObject(e,t)}ensureBufferSizeToWrite(e){let t=this.pos+e;this.view.byteLength<t&&this.resizeBuffer(t*2)}resizeBuffer(e){let t=new ArrayBuffer(e),n=new Uint8Array(t),s=new DataView(t);n.set(this.bytes),this.view=s,this.bytes=n}encodeNil(){this.writeU8(192)}encodeBoolean(e){e===!1?this.writeU8(194):this.writeU8(195)}encodeNumber(e){!this.forceIntegerToFloat&&Number.isSafeInteger(e)?e>=0?e<128?this.writeU8(e):e<256?(this.writeU8(204),this.writeU8(e)):e<65536?(this.writeU8(205),this.writeU16(e)):e<4294967296?(this.writeU8(206),this.writeU32(e)):this.useBigInt64?this.encodeNumberAsFloat(e):(this.writeU8(207),this.writeU64(e)):e>=-32?this.writeU8(224|e+32):e>=-128?(this.writeU8(208),this.writeI8(e)):e>=-32768?(this.writeU8(209),this.writeI16(e)):e>=-2147483648?(this.writeU8(210),this.writeI32(e)):this.useBigInt64?this.encodeNumberAsFloat(e):(this.writeU8(211),this.writeI64(e)):this.encodeNumberAsFloat(e)}encodeNumberAsFloat(e){this.forceFloat32?(this.writeU8(202),this.writeF32(e)):(this.writeU8(203),this.writeF64(e))}encodeBigInt64(e){e>=BigInt(0)?(this.writeU8(207),this.writeBigUint64(e)):(this.writeU8(211),this.writeBigInt64(e))}writeStringHeader(e){if(e<32)this.writeU8(160+e);else if(e<256)this.writeU8(217),this.writeU8(e);else if(e<65536)this.writeU8(218),this.writeU16(e);else if(e<4294967296)this.writeU8(219),this.writeU32(e);else throw new Error(`Too long string: ${e} bytes in UTF-8`)}encodeString(e){let n=yd(e);this.ensureBufferSizeToWrite(5+n),this.writeStringHeader(n),_d(e,this.bytes,this.pos),this.pos+=n}encodeObject(e,t){let n=this.extensionCodec.tryToEncode(e,this.context);if(n!=null)this.encodeExtension(n);else if(Array.isArray(e))this.encodeArray(e,t);else if(ArrayBuffer.isView(e))this.encodeBinary(e);else if(typeof e=="object")this.encodeMap(e,t);else throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(e)}`)}encodeBinary(e){let t=e.byteLength;if(t<256)this.writeU8(196),this.writeU8(t);else if(t<65536)this.writeU8(197),this.writeU16(t);else if(t<4294967296)this.writeU8(198),this.writeU32(t);else throw new Error(`Too large binary: ${t}`);let n=Zr(e);this.writeU8a(n)}encodeArray(e,t){let n=e.length;if(n<16)this.writeU8(144+n);else if(n<65536)this.writeU8(220),this.writeU16(n);else if(n<4294967296)this.writeU8(221),this.writeU32(n);else throw new Error(`Too large array: ${n}`);for(let s of e)this.doEncode(s,t+1)}countWithoutUndefined(e,t){let n=0;for(let s of t)e[s]!==void 0&&n++;return n}encodeMap(e,t){let n=Object.keys(e);this.sortKeys&&n.sort();let s=this.ignoreUndefined?this.countWithoutUndefined(e,n):n.length;if(s<16)this.writeU8(128+s);else if(s<65536)this.writeU8(222),this.writeU16(s);else if(s<4294967296)this.writeU8(223),this.writeU32(s);else throw new Error(`Too large map object: ${s}`);for(let r of n){let a=e[r];this.ignoreUndefined&&a===void 0||(this.encodeString(r),this.doEncode(a,t+1))}}encodeExtension(e){if(typeof e.data=="function"){let n=e.data(this.pos+6),s=n.length;if(s>=4294967296)throw new Error(`Too large extension object: ${s}`);this.writeU8(201),this.writeU32(s),this.writeI8(e.type),this.writeU8a(n);return}let t=e.data.length;if(t===1)this.writeU8(212);else if(t===2)this.writeU8(213);else if(t===4)this.writeU8(214);else if(t===8)this.writeU8(215);else if(t===16)this.writeU8(216);else if(t<256)this.writeU8(199),this.writeU8(t);else if(t<65536)this.writeU8(200),this.writeU16(t);else if(t<4294967296)this.writeU8(201),this.writeU32(t);else throw new Error(`Too large extension object: ${t}`);this.writeI8(e.type),this.writeU8a(e.data)}writeU8(e){this.ensureBufferSizeToWrite(1),this.view.setUint8(this.pos,e),this.pos++}writeU8a(e){let t=e.length;this.ensureBufferSizeToWrite(t),this.bytes.set(e,this.pos),this.pos+=t}writeI8(e){this.ensureBufferSizeToWrite(1),this.view.setInt8(this.pos,e),this.pos++}writeU16(e){this.ensureBufferSizeToWrite(2),this.view.setUint16(this.pos,e),this.pos+=2}writeI16(e){this.ensureBufferSizeToWrite(2),this.view.setInt16(this.pos,e),this.pos+=2}writeU32(e){this.ensureBufferSizeToWrite(4),this.view.setUint32(this.pos,e),this.pos+=4}writeI32(e){this.ensureBufferSizeToWrite(4),this.view.setInt32(this.pos,e),this.pos+=4}writeF32(e){this.ensureBufferSizeToWrite(4),this.view.setFloat32(this.pos,e),this.pos+=4}writeF64(e){this.ensureBufferSizeToWrite(8),this.view.setFloat64(this.pos,e),this.pos+=8}writeU64(e){this.ensureBufferSizeToWrite(8),Md(this.view,this.pos,e),this.pos+=8}writeI64(e){this.ensureBufferSizeToWrite(8),Qa(this.view,this.pos,e),this.pos+=8}writeBigUint64(e){this.ensureBufferSizeToWrite(8),this.view.setBigUint64(this.pos,e),this.pos+=8}writeBigInt64(e){this.ensureBufferSizeToWrite(8),this.view.setBigInt64(this.pos,e),this.pos+=8}};function to(i){return`${i<0?"-":""}0x${Math.abs(i).toString(16).padStart(2,"0")}`}var Jm=16,jm=16,no=class{hit=0;miss=0;caches;maxKeyLength;maxLengthPerKey;constructor(e=Jm,t=jm){this.maxKeyLength=e,this.maxLengthPerKey=t,this.caches=[];for(let n=0;n<this.maxKeyLength;n++)this.caches.push([])}canBeCached(e){return e>0&&e<=this.maxKeyLength}find(e,t,n){let s=this.caches[n-1];e:for(let r of s){let a=r.bytes;for(let o=0;o<n;o++)if(a[o]!==e[t+o])continue e;return r.str}return null}store(e,t){let n=this.caches[e.length-1],s={bytes:e,str:t};n.length>=this.maxLengthPerKey?n[Math.random()*n.length|0]=s:n.push(s)}decode(e,t,n){let s=this.find(e,t,n);if(s!=null)return this.hit++,s;this.miss++;let r=ic(e,t,n),a=Uint8Array.prototype.slice.call(e,t,t+n);return this.store(a,r),r}};var sc="array",ea="map_key",Td="map_value",Qm=i=>{if(typeof i=="string"||typeof i=="number")return i;throw new fn("The type of key must be string or number but "+typeof i)},rc=class{stack=[];stackHeadPosition=-1;get length(){return this.stackHeadPosition+1}top(){return this.stack[this.stackHeadPosition]}pushArrayState(e){let t=this.getUninitializedStateFromPool();t.type=sc,t.position=0,t.size=e,t.array=new Array(e)}pushMapState(e){let t=this.getUninitializedStateFromPool();t.type=ea,t.readCount=0,t.size=e,t.map={}}getUninitializedStateFromPool(){if(this.stackHeadPosition++,this.stackHeadPosition===this.stack.length){let e={type:void 0,size:0,array:void 0,position:0,readCount:0,map:void 0,key:null};this.stack.push(e)}return this.stack[this.stackHeadPosition]}release(e){if(this.stack[this.stackHeadPosition]!==e)throw new Error("Invalid stack state. Released state is not on top of the stack.");if(e.type===sc){let n=e;n.size=0,n.array=void 0,n.position=0,n.type=void 0}if(e.type===ea||e.type===Td){let n=e;n.size=0,n.map=void 0,n.readCount=0,n.type=void 0}this.stackHeadPosition--}reset(){this.stack.length=0,this.stackHeadPosition=-1}},Qr=-1,ac=new DataView(new ArrayBuffer(0)),eg=new Uint8Array(ac.buffer);try{ac.getInt8(0)}catch(i){if(!(i instanceof RangeError))throw new Error("This module is not supported in the current JavaScript engine because DataView does not throw RangeError on out-of-bounds access")}var Ad=new RangeError("Insufficient data"),tg=new no,ta=class i{extensionCodec;context;useBigInt64;rawStrings;maxStrLength;maxBinLength;maxArrayLength;maxMapLength;maxExtLength;keyDecoder;mapKeyConverter;totalPos=0;pos=0;view=ac;bytes=eg;headByte=Qr;stack=new rc;entered=!1;constructor(e){this.extensionCodec=e?.extensionCodec??Js.defaultCodec,this.context=e?.context,this.useBigInt64=e?.useBigInt64??!1,this.rawStrings=e?.rawStrings??!1,this.maxStrLength=e?.maxStrLength??4294967295,this.maxBinLength=e?.maxBinLength??4294967295,this.maxArrayLength=e?.maxArrayLength??4294967295,this.maxMapLength=e?.maxMapLength??4294967295,this.maxExtLength=e?.maxExtLength??4294967295,this.keyDecoder=e?.keyDecoder!==void 0?e.keyDecoder:tg,this.mapKeyConverter=e?.mapKeyConverter??Qm}clone(){return new i({extensionCodec:this.extensionCodec,context:this.context,useBigInt64:this.useBigInt64,rawStrings:this.rawStrings,maxStrLength:this.maxStrLength,maxBinLength:this.maxBinLength,maxArrayLength:this.maxArrayLength,maxMapLength:this.maxMapLength,maxExtLength:this.maxExtLength,keyDecoder:this.keyDecoder})}reinitializeState(){this.totalPos=0,this.headByte=Qr,this.stack.reset()}setBuffer(e){let t=Zr(e);this.bytes=t,this.view=new DataView(t.buffer,t.byteOffset,t.byteLength),this.pos=0}appendBuffer(e){if(this.headByte===Qr&&!this.hasRemaining(1))this.setBuffer(e);else{let t=this.bytes.subarray(this.pos),n=Zr(e),s=new Uint8Array(t.length+n.length);s.set(t),s.set(n,t.length),this.setBuffer(s)}}hasRemaining(e){return this.view.byteLength-this.pos>=e}createExtraByteError(e){let{view:t,pos:n}=this;return new RangeError(`Extra ${t.byteLength-n} of ${t.byteLength} byte(s) found at buffer[${e}]`)}decode(e){if(this.entered)return this.clone().decode(e);try{this.entered=!0,this.reinitializeState(),this.setBuffer(e);let t=this.doDecodeSync();if(this.hasRemaining(1))throw this.createExtraByteError(this.pos);return t}finally{this.entered=!1}}*decodeMulti(e){if(this.entered){yield*this.clone().decodeMulti(e);return}try{for(this.entered=!0,this.reinitializeState(),this.setBuffer(e);this.hasRemaining(1);)yield this.doDecodeSync()}finally{this.entered=!1}}async decodeAsync(e){if(this.entered)return this.clone().decodeAsync(e);try{this.entered=!0;let t=!1,n;for await(let o of e){if(t)throw this.entered=!1,this.createExtraByteError(this.totalPos);this.appendBuffer(o);try{n=this.doDecodeSync(),t=!0}catch(l){if(!(l instanceof RangeError))throw l}this.totalPos+=this.pos}if(t){if(this.hasRemaining(1))throw this.createExtraByteError(this.totalPos);return n}let{headByte:s,pos:r,totalPos:a}=this;throw new RangeError(`Insufficient data in parsing ${to(s)} at ${a} (${r} in the current buffer)`)}finally{this.entered=!1}}decodeArrayStream(e){return this.decodeMultiAsync(e,!0)}decodeStream(e){return this.decodeMultiAsync(e,!1)}async*decodeMultiAsync(e,t){if(this.entered){yield*this.clone().decodeMultiAsync(e,t);return}try{this.entered=!0;let n=t,s=-1;for await(let r of e){if(t&&s===0)throw this.createExtraByteError(this.totalPos);this.appendBuffer(r),n&&(s=this.readArraySize(),n=!1,this.complete());try{for(;yield this.doDecodeSync(),--s!==0;);}catch(a){if(!(a instanceof RangeError))throw a}this.totalPos+=this.pos}}finally{this.entered=!1}}doDecodeSync(){e:for(;;){let e=this.readHeadByte(),t;if(e>=224)t=e-256;else if(e<192)if(e<128)t=e;else if(e<144){let s=e-128;if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e<160){let s=e-144;if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else{let s=e-160;t=this.decodeString(s,0)}else if(e===192)t=null;else if(e===194)t=!1;else if(e===195)t=!0;else if(e===202)t=this.readF32();else if(e===203)t=this.readF64();else if(e===204)t=this.readU8();else if(e===205)t=this.readU16();else if(e===206)t=this.readU32();else if(e===207)this.useBigInt64?t=this.readU64AsBigInt():t=this.readU64();else if(e===208)t=this.readI8();else if(e===209)t=this.readI16();else if(e===210)t=this.readI32();else if(e===211)this.useBigInt64?t=this.readI64AsBigInt():t=this.readI64();else if(e===217){let s=this.lookU8();t=this.decodeString(s,1)}else if(e===218){let s=this.lookU16();t=this.decodeString(s,2)}else if(e===219){let s=this.lookU32();t=this.decodeString(s,4)}else if(e===220){let s=this.readU16();if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else if(e===221){let s=this.readU32();if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else if(e===222){let s=this.readU16();if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e===223){let s=this.readU32();if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e===196){let s=this.lookU8();t=this.decodeBinary(s,1)}else if(e===197){let s=this.lookU16();t=this.decodeBinary(s,2)}else if(e===198){let s=this.lookU32();t=this.decodeBinary(s,4)}else if(e===212)t=this.decodeExtension(1,0);else if(e===213)t=this.decodeExtension(2,0);else if(e===214)t=this.decodeExtension(4,0);else if(e===215)t=this.decodeExtension(8,0);else if(e===216)t=this.decodeExtension(16,0);else if(e===199){let s=this.lookU8();t=this.decodeExtension(s,1)}else if(e===200){let s=this.lookU16();t=this.decodeExtension(s,2)}else if(e===201){let s=this.lookU32();t=this.decodeExtension(s,4)}else throw new fn(`Unrecognized type byte: ${to(e)}`);this.complete();let n=this.stack;for(;n.length>0;){let s=n.top();if(s.type===sc)if(s.array[s.position]=t,s.position++,s.position===s.size)t=s.array,n.release(s);else continue e;else if(s.type===ea){if(t==="__proto__")throw new fn("The key __proto__ is not allowed");s.key=this.mapKeyConverter(t),s.type=Td;continue e}else if(s.map[s.key]=t,s.readCount++,s.readCount===s.size)t=s.map,n.release(s);else{s.key=null,s.type=ea;continue e}}return t}}readHeadByte(){return this.headByte===Qr&&(this.headByte=this.readU8()),this.headByte}complete(){this.headByte=Qr}readArraySize(){let e=this.readHeadByte();switch(e){case 220:return this.readU16();case 221:return this.readU32();default:{if(e<160)return e-144;throw new fn(`Unrecognized array type byte: ${to(e)}`)}}}pushMapState(e){if(e>this.maxMapLength)throw new fn(`Max length exceeded: map length (${e}) > maxMapLengthLength (${this.maxMapLength})`);this.stack.pushMapState(e)}pushArrayState(e){if(e>this.maxArrayLength)throw new fn(`Max length exceeded: array length (${e}) > maxArrayLength (${this.maxArrayLength})`);this.stack.pushArrayState(e)}decodeString(e,t){return!this.rawStrings||this.stateIsMapKey()?this.decodeUtf8String(e,t):this.decodeBinary(e,t)}decodeUtf8String(e,t){if(e>this.maxStrLength)throw new fn(`Max length exceeded: UTF-8 byte length (${e}) > maxStrLength (${this.maxStrLength})`);if(this.bytes.byteLength<this.pos+t+e)throw Ad;let n=this.pos+t,s;return this.stateIsMapKey()&&this.keyDecoder?.canBeCached(e)?s=this.keyDecoder.decode(this.bytes,n,e):s=bd(this.bytes,n,e),this.pos+=t+e,s}stateIsMapKey(){return this.stack.length>0?this.stack.top().type===ea:!1}decodeBinary(e,t){if(e>this.maxBinLength)throw new fn(`Max length exceeded: bin length (${e}) > maxBinLength (${this.maxBinLength})`);if(!this.hasRemaining(e+t))throw Ad;let n=this.pos+t,s=this.bytes.subarray(n,n+e);return this.pos+=t+e,s}decodeExtension(e,t){if(e>this.maxExtLength)throw new fn(`Max length exceeded: ext length (${e}) > maxExtLength (${this.maxExtLength})`);let n=this.view.getInt8(this.pos+t),s=this.decodeBinary(e,t+1);return this.extensionCodec.decode(s,n,this.context)}lookU8(){return this.view.getUint8(this.pos)}lookU16(){return this.view.getUint16(this.pos)}lookU32(){return this.view.getUint32(this.pos)}readU8(){let e=this.view.getUint8(this.pos);return this.pos++,e}readI8(){let e=this.view.getInt8(this.pos);return this.pos++,e}readU16(){let e=this.view.getUint16(this.pos);return this.pos+=2,e}readI16(){let e=this.view.getInt16(this.pos);return this.pos+=2,e}readU32(){let e=this.view.getUint32(this.pos);return this.pos+=4,e}readI32(){let e=this.view.getInt32(this.pos);return this.pos+=4,e}readU64(){let e=wd(this.view,this.pos);return this.pos+=8,e}readI64(){let e=eo(this.view,this.pos);return this.pos+=8,e}readU64AsBigInt(){let e=this.view.getBigUint64(this.pos);return this.pos+=8,e}readI64AsBigInt(){let e=this.view.getBigInt64(this.pos);return this.pos+=8,e}readF32(){let e=this.view.getFloat32(this.pos);return this.pos+=4,e}readF64(){let e=this.view.getFloat64(this.pos);return this.pos+=8,e}};var ng=new Jr({ignoreUndefined:!0}),ig=new ta;function io(i){return ng.encode(i)}function Ed(i){return ig.decode(i instanceof ArrayBuffer?new Uint8Array(i):i)}function oc(i){return i.byteOffset%4===0?new Int32Array(i.buffer,i.byteOffset,i.byteLength>>2):new Int32Array(sg(i).buffer)}function sg(i){let e=new Uint8Array(i.byteLength);return e.set(i),e}function na(i,e){return e<<16|i}var qi=["wood","stone","scrap","ore","brick","leather","claw"],ri=["weapon","clothing","defence","furniture"],$i=[{cat:"weapon",what:"sword",need:{wood:1,ore:1}},{cat:"weapon",what:"axe",need:{wood:1,stone:1}},{cat:"weapon",what:"spear",need:{wood:1,claw:1}},{cat:"weapon",what:"spear",need:{wood:1,scrap:1}},{cat:"weapon",what:"bow",need:{wood:2,leather:1}},{cat:"weapon",what:"arrows",need:{wood:2,stone:1},n:5},{cat:"clothing",what:"clothes",need:{leather:2}},{cat:"clothing",what:"armor",need:{leather:2,ore:1}},{cat:"clothing",what:"helmet",need:{leather:1,ore:1}},{cat:"defence",what:"palisade",need:{wood:2}},{cat:"defence",what:"spikes",need:{wood:1,claw:1}},{cat:"defence",what:"stonewall",need:{brick:2}},{cat:"furniture",what:"door",need:{wood:1,ore:1}},{cat:"furniture",what:"window",need:{wood:1,scrap:1}},{cat:"furniture",what:"bed",need:{wood:3,leather:2}},{cat:"furniture",what:"lamp",need:{scrap:1,ore:1}},{cat:"furniture",what:"campfire",need:{wood:3,stone:2}}],ia={wood:14,stone:4},Xi=["palisade","spikes","stonewall","door","window","bed","lamp","campfire"],so={sword:34,spear:30,axe:22},Cd={armor:.35,clothes:.15,helmet:.15},Rd=["rabbit","deer","boar","wolf","bear"];function js(i,e){let t=Object.keys(e).filter(n=>(e[n]??0)>0);for(let n of $i){if(n.cat!==i)continue;let s=Object.keys(n.need);if(s.length===t.length&&s.every(r=>e[r]===n.need[r]))return n}return null}var xs=["#b9b3a8","#62c95a","#4aa3ff","#b36cff","#ffb02e"],rg=[1,1.12,1.25,1.42,1.65],Qs=10;function sa(i,e){return(rg[e]??1)*(1+.05*Math.max(0,Math.min(Qs,i)))}function Pd(i){return 2+2*i}var ai={sword:"weapon",axe:"weapon",spear:"weapon",bow:"ranged",helmet:"head",armor:"body",clothes:"body"},_w=Object.keys(ai),ag=30;function ra(i){return i==="bow"?ag:so[i]??Cd[i]??0}var og=new Set(["sword","axe","helmet","armor"]);function Id(i,e){let t=Math.ceil((e+1)/2);return i==="clothes"?{leather:t}:i==="bow"?{wood:1,leather:Math.ceil((e+1)/3)}:i==="spear"?{wood:1,stone:t}:og.has(i)?i==="helmet"||i==="armor"?{ore:t,leather:1}:{ore:t,stone:1}:{}}function Ld(i,e){let t=e+1,n=i==="clothes"||i==="bow"?{claw:t,leather:2*t,scrap:t}:{claw:t,ore:2*t,scrap:t};return e>=2&&(n.brick=e-1),n}var lg=["","sword","axe","spear","bow"],cg=["","attack","chop","mine","build","talk","shoot","use"];function Dd(i){let e=Math.max(0,lg.indexOf(i.held)),t=Math.max(0,cg.indexOf(i.anim));return e|(i.hq&7)<<3|(i.helmet?1:0)<<6|(i.headQ&7)<<7|(i.body==="armor"?2:i.body==="clothes"?1:0)<<10|(i.bodyQ&7)<<12|t<<15|(i.seq&15)<<18|(i.back?1:0)<<22}var hg=0,Nd=1,ug=2;var el=1,iu=2,Ci=3,is=0,gn=1,Dn=2,ts=0,gr=1,Ps=2,Ud=3,kd=4,dg=5,As=100,fg=101,pg=102,mg=103,gg=104,xg=200,vg=201,yg=202,_g=203,zc=204,Hc=205,bg=206,Mg=207,wg=208,Sg=209,Ag=210,Tg=211,Eg=212,Cg=213,Rg=214,Vc=0,Gc=1,Wc=2,_r=3,qc=4,$c=5,Xc=6,Yc=7,tl=0,Pg=1,Ig=2,ns=0,Lg=1,Dg=2,Ng=3,Ug=4,kg=5,Fg=6,ba=7;var Of=300,br=301,Mr=302,Kc=303,Zc=304,nl=306,Jc=1e3,Cs=1001,jc=1002,Mn=1003,Bg=1004;var ro=1005;var li=1006,lc=1007;var Rs=1008;var Li=1009,zf=1010,Hf=1011,xa=1012,su=1013,Is=1014,ci=1015,Ma=1016,ru=1017,au=1018,wr=1020,Vf=35902,Gf=1021,Wf=1022,Xn=1023,qf=1024,$f=1025,xr=1026,Sr=1027,ou=1028,lu=1029,Xf=1030,cu=1031;var hu=1033,Ro=33776,Po=33777,Io=33778,Lo=33779,Qc=35840,eh=35841,th=35842,nh=35843,ih=36196,sh=37492,rh=37496,ah=37808,oh=37809,lh=37810,ch=37811,hh=37812,uh=37813,dh=37814,fh=37815,ph=37816,mh=37817,gh=37818,xh=37819,vh=37820,yh=37821,Do=36492,_h=36494,bh=36495,Yf=36283,Mh=36284,wh=36285,Sh=36286;var No=2300,Ah=2301,cc=2302,Fd=2400,Bd=2401,Od=2402;var Og=3200,zg=3201;var uu=0,Hg=1,es="",Ln="srgb",Ir="srgb-linear",il="linear",mt="srgb";var er=7680;var zd=519,Vg=512,Gg=513,Wg=514,Kf=515,qg=516,$g=517,Xg=518,Yg=519,Hd=35044,ki=35048;var Vd="300 es",Pi=2e3,Uo=2001,ss=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let s=this._listeners[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let n=this._listeners[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},sn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var hc=Math.PI/180,Th=180/Math.PI;function wa(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(sn[i&255]+sn[i>>8&255]+sn[i>>16&255]+sn[i>>24&255]+"-"+sn[e&255]+sn[e>>8&255]+"-"+sn[e>>16&15|64]+sn[e>>24&255]+"-"+sn[t&63|128]+sn[t>>8&255]+"-"+sn[t>>16&255]+sn[t>>24&255]+sn[n&255]+sn[n>>8&255]+sn[n>>16&255]+sn[n>>24&255]).toLowerCase()}function mn(i,e,t){return Math.max(e,Math.min(t,i))}function Kg(i,e){return(i%e+e)%e}function uc(i,e,t){return(1-t)*i+t*e}function aa(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function pn(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var $e=class i{constructor(e=0,t=0){i.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(mn(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Ue=class i{constructor(e,t,n,s,r,a,o,l,h){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,h)}set(e,t,n,s,r,a,o,l,h){let c=this.elements;return c[0]=e,c[1]=s,c[2]=o,c[3]=t,c[4]=r,c[5]=l,c[6]=n,c[7]=a,c[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],h=n[1],c=n[4],u=n[7],d=n[2],m=n[5],g=n[8],x=s[0],p=s[3],f=s[6],w=s[1],S=s[4],v=s[7],I=s[2],R=s[5],T=s[8];return r[0]=a*x+o*w+l*I,r[3]=a*p+o*S+l*R,r[6]=a*f+o*v+l*T,r[1]=h*x+c*w+u*I,r[4]=h*p+c*S+u*R,r[7]=h*f+c*v+u*T,r[2]=d*x+m*w+g*I,r[5]=d*p+m*S+g*R,r[8]=d*f+m*v+g*T,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],h=e[7],c=e[8];return t*a*c-t*o*h-n*r*c+n*o*l+s*r*h-s*a*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],h=e[7],c=e[8],u=c*a-o*h,d=o*l-c*r,m=h*r-a*l,g=t*u+n*d+s*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/g;return e[0]=u*x,e[1]=(s*h-c*n)*x,e[2]=(o*n-s*a)*x,e[3]=d*x,e[4]=(c*t-s*l)*x,e[5]=(s*r-o*t)*x,e[6]=m*x,e[7]=(n*l-h*t)*x,e[8]=(a*t-n*r)*x,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){let l=Math.cos(r),h=Math.sin(r);return this.set(n*l,n*h,-n*(l*a+h*o)+a+e,-s*h,s*l,-s*(-h*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(dc.makeScale(e,t)),this}rotate(e){return this.premultiply(dc.makeRotation(-e)),this}translate(e,t){return this.premultiply(dc.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},dc=new Ue;function Zf(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function ko(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Zg(){let i=ko("canvas");return i.style.display="block",i}var Gd={};function pa(i){i in Gd||(Gd[i]=!0,console.warn(i))}function Jg(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}function jg(i){let e=i.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function Qg(i){let e=i.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var nt={enabled:!0,workingColorSpace:Ir,spaces:{},convert:function(i,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===mt&&(i.r=Ii(i.r),i.g=Ii(i.g),i.b=Ii(i.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(i.applyMatrix3(this.spaces[e].toXYZ),i.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===mt&&(i.r=vr(i.r),i.g=vr(i.g),i.b=vr(i.b))),i},fromWorkingColorSpace:function(i,e){return this.convert(i,this.workingColorSpace,e)},toWorkingColorSpace:function(i,e){return this.convert(i,e,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===es?il:this.spaces[i].transfer},getLuminanceCoefficients:function(i,e=this.workingColorSpace){return i.fromArray(this.spaces[e].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,e,t){return i.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function Ii(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function vr(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Wd=[.64,.33,.3,.6,.15,.06],qd=[.2126,.7152,.0722],$d=[.3127,.329],Xd=new Ue().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Yd=new Ue().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);nt.define({[Ir]:{primaries:Wd,whitePoint:$d,transfer:il,toXYZ:Xd,fromXYZ:Yd,luminanceCoefficients:qd,workingColorSpaceConfig:{unpackColorSpace:Ln},outputColorSpaceConfig:{drawingBufferColorSpace:Ln}},[Ln]:{primaries:Wd,whitePoint:$d,transfer:mt,toXYZ:Xd,fromXYZ:Yd,luminanceCoefficients:qd,outputColorSpaceConfig:{drawingBufferColorSpace:Ln}}});var tr,Eh=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{tr===void 0&&(tr=ko("canvas")),tr.width=e.width,tr.height=e.height;let n=tr.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=tr}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=ko("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Ii(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Ii(t[n]/255)*255):t[n]=Ii(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},e0=0,Fo=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:e0++}),this.uuid=wa(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(fc(s[a].image)):r.push(fc(s[a]))}else r=fc(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function fc(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Eh.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var t0=0,Sn=class i extends ss{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=Cs,s=Cs,r=li,a=Rs,o=Xn,l=Li,h=i.DEFAULT_ANISOTROPY,c=es){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:t0++}),this.uuid=wa(),this.name="",this.source=new Fo(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=h,this.format=o,this.internalFormat=null,this.type=l,this.offset=new $e(0,0),this.repeat=new $e(1,1),this.center=new $e(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ue,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=c,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Of)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Jc:e.x=e.x-Math.floor(e.x);break;case Cs:e.x=e.x<0?0:1;break;case jc:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Jc:e.y=e.y-Math.floor(e.y);break;case Cs:e.y=e.y<0?0:1;break;case jc:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Sn.DEFAULT_IMAGE=null;Sn.DEFAULT_MAPPING=Of;Sn.DEFAULT_ANISOTROPY=1;var gt=class i{constructor(e=0,t=0,n=0,s=1){i.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,h=l[0],c=l[4],u=l[8],d=l[1],m=l[5],g=l[9],x=l[2],p=l[6],f=l[10];if(Math.abs(c-d)<.01&&Math.abs(u-x)<.01&&Math.abs(g-p)<.01){if(Math.abs(c+d)<.1&&Math.abs(u+x)<.1&&Math.abs(g+p)<.1&&Math.abs(h+m+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let S=(h+1)/2,v=(m+1)/2,I=(f+1)/2,R=(c+d)/4,T=(u+x)/4,C=(g+p)/4;return S>v&&S>I?S<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(S),s=R/n,r=T/n):v>I?v<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),n=R/s,r=C/s):I<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(I),n=T/r,s=C/r),this.set(n,s,r,t),this}let w=Math.sqrt((p-g)*(p-g)+(u-x)*(u-x)+(d-c)*(d-c));return Math.abs(w)<.001&&(w=1),this.x=(p-g)/w,this.y=(u-x)/w,this.z=(d-c)/w,this.w=Math.acos((h+m+f-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Ch=class extends ss{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new gt(0,0,e,t),this.scissorTest=!1,this.viewport=new gt(0,0,e,t);let s={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:li,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new Sn(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,s=e.textures.length;n<s;n++)this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new Fo(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Di=class extends Ch{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Bo=class extends Sn{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Mn,this.minFilter=Mn,this.wrapR=Cs,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Rh=class extends Sn{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Mn,this.minFilter=Mn,this.wrapR=Cs,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var an=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let l=n[s+0],h=n[s+1],c=n[s+2],u=n[s+3],d=r[a+0],m=r[a+1],g=r[a+2],x=r[a+3];if(o===0){e[t+0]=l,e[t+1]=h,e[t+2]=c,e[t+3]=u;return}if(o===1){e[t+0]=d,e[t+1]=m,e[t+2]=g,e[t+3]=x;return}if(u!==x||l!==d||h!==m||c!==g){let p=1-o,f=l*d+h*m+c*g+u*x,w=f>=0?1:-1,S=1-f*f;if(S>Number.EPSILON){let I=Math.sqrt(S),R=Math.atan2(I,f*w);p=Math.sin(p*R)/I,o=Math.sin(o*R)/I}let v=o*w;if(l=l*p+d*v,h=h*p+m*v,c=c*p+g*v,u=u*p+x*v,p===1-o){let I=1/Math.sqrt(l*l+h*h+c*c+u*u);l*=I,h*=I,c*=I,u*=I}}e[t]=l,e[t+1]=h,e[t+2]=c,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,s,r,a){let o=n[s],l=n[s+1],h=n[s+2],c=n[s+3],u=r[a],d=r[a+1],m=r[a+2],g=r[a+3];return e[t]=o*g+c*u+l*m-h*d,e[t+1]=l*g+c*d+h*u-o*m,e[t+2]=h*g+c*m+o*d-l*u,e[t+3]=c*g-o*u-l*d-h*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,h=o(n/2),c=o(s/2),u=o(r/2),d=l(n/2),m=l(s/2),g=l(r/2);switch(a){case"XYZ":this._x=d*c*u+h*m*g,this._y=h*m*u-d*c*g,this._z=h*c*g+d*m*u,this._w=h*c*u-d*m*g;break;case"YXZ":this._x=d*c*u+h*m*g,this._y=h*m*u-d*c*g,this._z=h*c*g-d*m*u,this._w=h*c*u+d*m*g;break;case"ZXY":this._x=d*c*u-h*m*g,this._y=h*m*u+d*c*g,this._z=h*c*g+d*m*u,this._w=h*c*u-d*m*g;break;case"ZYX":this._x=d*c*u-h*m*g,this._y=h*m*u+d*c*g,this._z=h*c*g-d*m*u,this._w=h*c*u+d*m*g;break;case"YZX":this._x=d*c*u+h*m*g,this._y=h*m*u+d*c*g,this._z=h*c*g-d*m*u,this._w=h*c*u-d*m*g;break;case"XZY":this._x=d*c*u-h*m*g,this._y=h*m*u-d*c*g,this._z=h*c*g+d*m*u,this._w=h*c*u+d*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],h=t[2],c=t[6],u=t[10],d=n+o+u;if(d>0){let m=.5/Math.sqrt(d+1);this._w=.25/m,this._x=(c-l)*m,this._y=(r-h)*m,this._z=(a-s)*m}else if(n>o&&n>u){let m=2*Math.sqrt(1+n-o-u);this._w=(c-l)/m,this._x=.25*m,this._y=(s+a)/m,this._z=(r+h)/m}else if(o>u){let m=2*Math.sqrt(1+o-n-u);this._w=(r-h)/m,this._x=(s+a)/m,this._y=.25*m,this._z=(l+c)/m}else{let m=2*Math.sqrt(1+u-n-o);this._w=(a-s)/m,this._x=(r+h)/m,this._y=(l+c)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(mn(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,h=t._z,c=t._w;return this._x=n*c+a*o+s*h-r*l,this._y=s*c+a*l+r*o-n*h,this._z=r*c+a*h+n*l-s*o,this._w=a*c-n*o-s*l-r*h,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,s=this._y,r=this._z,a=this._w,o=a*e._w+n*e._x+s*e._y+r*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=s,this._z=r,this;let l=1-o*o;if(l<=Number.EPSILON){let m=1-t;return this._w=m*a+t*this._w,this._x=m*n+t*this._x,this._y=m*s+t*this._y,this._z=m*r+t*this._z,this.normalize(),this}let h=Math.sqrt(l),c=Math.atan2(h,o),u=Math.sin((1-t)*c)/h,d=Math.sin(t*c)/h;return this._w=a*u+this._w*d,this._x=n*u+this._x*d,this._y=s*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},D=class i{constructor(e=0,t=0,n=0){i.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Kd.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Kd.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,h=2*(a*s-o*n),c=2*(o*t-r*s),u=2*(r*n-a*t);return this.x=t+l*h+a*u-o*c,this.y=n+l*c+o*h-r*u,this.z=s+l*u+r*c-a*h,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return pc.copy(this).projectOnVector(e),this.sub(pc)}reflect(e){return this.sub(pc.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(mn(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},pc=new D,Kd=new an,Ni=class{constructor(e=new D(1/0,1/0,1/0),t=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Wn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Wn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Wn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Wn):Wn.fromBufferAttribute(r,a),Wn.applyMatrix4(e.matrixWorld),this.expandByPoint(Wn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ao.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ao.copy(n.boundingBox)),ao.applyMatrix4(e.matrixWorld),this.union(ao)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Wn),Wn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(oa),oo.subVectors(this.max,oa),nr.subVectors(e.a,oa),ir.subVectors(e.b,oa),sr.subVectors(e.c,oa),Yi.subVectors(ir,nr),Ki.subVectors(sr,ir),vs.subVectors(nr,sr);let t=[0,-Yi.z,Yi.y,0,-Ki.z,Ki.y,0,-vs.z,vs.y,Yi.z,0,-Yi.x,Ki.z,0,-Ki.x,vs.z,0,-vs.x,-Yi.y,Yi.x,0,-Ki.y,Ki.x,0,-vs.y,vs.x,0];return!mc(t,nr,ir,sr,oo)||(t=[1,0,0,0,1,0,0,0,1],!mc(t,nr,ir,sr,oo))?!1:(lo.crossVectors(Yi,Ki),t=[lo.x,lo.y,lo.z],mc(t,nr,ir,sr,oo))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Wn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Wn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(wi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),wi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),wi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),wi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),wi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),wi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),wi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),wi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(wi),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},wi=[new D,new D,new D,new D,new D,new D,new D,new D],Wn=new D,ao=new Ni,nr=new D,ir=new D,sr=new D,Yi=new D,Ki=new D,vs=new D,oa=new D,oo=new D,lo=new D,ys=new D;function mc(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){ys.fromArray(i,r);let o=s.x*Math.abs(ys.x)+s.y*Math.abs(ys.y)+s.z*Math.abs(ys.z),l=e.dot(ys),h=t.dot(ys),c=n.dot(ys);if(Math.max(-Math.max(l,h,c),Math.min(l,h,c))>o)return!1}return!0}var n0=new Ni,la=new D,gc=new D,Ls=class{constructor(e=new D,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):n0.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;la.subVectors(e,this.center);let t=la.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(la,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(gc.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(la.copy(e.center).add(gc)),this.expandByPoint(la.copy(e.center).sub(gc))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},Si=new D,xc=new D,co=new D,Zi=new D,vc=new D,ho=new D,yc=new D,Ph=class{constructor(e=new D,t=new D(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Si)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Si.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Si.copy(this.origin).addScaledVector(this.direction,t),Si.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){xc.copy(e).add(t).multiplyScalar(.5),co.copy(t).sub(e).normalize(),Zi.copy(this.origin).sub(xc);let r=e.distanceTo(t)*.5,a=-this.direction.dot(co),o=Zi.dot(this.direction),l=-Zi.dot(co),h=Zi.lengthSq(),c=Math.abs(1-a*a),u,d,m,g;if(c>0)if(u=a*l-o,d=a*o-l,g=r*c,u>=0)if(d>=-g)if(d<=g){let x=1/c;u*=x,d*=x,m=u*(u+a*d+2*o)+d*(a*u+d+2*l)+h}else d=r,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+h;else d=-r,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+h;else d<=-g?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-l),r),m=-u*u+d*(d+2*l)+h):d<=g?(u=0,d=Math.min(Math.max(-r,-l),r),m=d*(d+2*l)+h):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-l),r),m=-u*u+d*(d+2*l)+h);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+h;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(xc).addScaledVector(co,d),m}intersectSphere(e,t){Si.subVectors(e.center,this.origin);let n=Si.dot(this.direction),s=Si.dot(Si)-n*n,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,l,h=1/this.direction.x,c=1/this.direction.y,u=1/this.direction.z,d=this.origin;return h>=0?(n=(e.min.x-d.x)*h,s=(e.max.x-d.x)*h):(n=(e.max.x-d.x)*h,s=(e.min.x-d.x)*h),c>=0?(r=(e.min.y-d.y)*c,a=(e.max.y-d.y)*c):(r=(e.max.y-d.y)*c,a=(e.min.y-d.y)*c),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,Si)!==null}intersectTriangle(e,t,n,s,r){vc.subVectors(t,e),ho.subVectors(n,e),yc.crossVectors(vc,ho);let a=this.direction.dot(yc),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Zi.subVectors(this.origin,e);let l=o*this.direction.dot(ho.crossVectors(Zi,ho));if(l<0)return null;let h=o*this.direction.dot(vc.cross(Zi));if(h<0||l+h>a)return null;let c=-o*Zi.dot(yc);return c<0?null:this.at(c/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ve=class i{constructor(e,t,n,s,r,a,o,l,h,c,u,d,m,g,x,p){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,h,c,u,d,m,g,x,p)}set(e,t,n,s,r,a,o,l,h,c,u,d,m,g,x,p){let f=this.elements;return f[0]=e,f[4]=t,f[8]=n,f[12]=s,f[1]=r,f[5]=a,f[9]=o,f[13]=l,f[2]=h,f[6]=c,f[10]=u,f[14]=d,f[3]=m,f[7]=g,f[11]=x,f[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,s=1/rr.setFromMatrixColumn(e,0).length(),r=1/rr.setFromMatrixColumn(e,1).length(),a=1/rr.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),h=Math.sin(s),c=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=a*c,m=a*u,g=o*c,x=o*u;t[0]=l*c,t[4]=-l*u,t[8]=h,t[1]=m+g*h,t[5]=d-x*h,t[9]=-o*l,t[2]=x-d*h,t[6]=g+m*h,t[10]=a*l}else if(e.order==="YXZ"){let d=l*c,m=l*u,g=h*c,x=h*u;t[0]=d+x*o,t[4]=g*o-m,t[8]=a*h,t[1]=a*u,t[5]=a*c,t[9]=-o,t[2]=m*o-g,t[6]=x+d*o,t[10]=a*l}else if(e.order==="ZXY"){let d=l*c,m=l*u,g=h*c,x=h*u;t[0]=d-x*o,t[4]=-a*u,t[8]=g+m*o,t[1]=m+g*o,t[5]=a*c,t[9]=x-d*o,t[2]=-a*h,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let d=a*c,m=a*u,g=o*c,x=o*u;t[0]=l*c,t[4]=g*h-m,t[8]=d*h+x,t[1]=l*u,t[5]=x*h+d,t[9]=m*h-g,t[2]=-h,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let d=a*l,m=a*h,g=o*l,x=o*h;t[0]=l*c,t[4]=x-d*u,t[8]=g*u+m,t[1]=u,t[5]=a*c,t[9]=-o*c,t[2]=-h*c,t[6]=m*u+g,t[10]=d-x*u}else if(e.order==="XZY"){let d=a*l,m=a*h,g=o*l,x=o*h;t[0]=l*c,t[4]=-u,t[8]=h*c,t[1]=d*u+x,t[5]=a*c,t[9]=m*u-g,t[2]=g*u-m,t[6]=o*c,t[10]=x*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(i0,e,s0)}lookAt(e,t,n){let s=this.elements;return _n.subVectors(e,t),_n.lengthSq()===0&&(_n.z=1),_n.normalize(),Ji.crossVectors(n,_n),Ji.lengthSq()===0&&(Math.abs(n.z)===1?_n.x+=1e-4:_n.z+=1e-4,_n.normalize(),Ji.crossVectors(n,_n)),Ji.normalize(),uo.crossVectors(_n,Ji),s[0]=Ji.x,s[4]=uo.x,s[8]=_n.x,s[1]=Ji.y,s[5]=uo.y,s[9]=_n.y,s[2]=Ji.z,s[6]=uo.z,s[10]=_n.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],h=n[12],c=n[1],u=n[5],d=n[9],m=n[13],g=n[2],x=n[6],p=n[10],f=n[14],w=n[3],S=n[7],v=n[11],I=n[15],R=s[0],T=s[4],C=s[8],y=s[12],_=s[1],L=s[5],N=s[9],P=s[13],F=s[2],H=s[6],O=s[10],Z=s[14],G=s[3],ae=s[7],ee=s[11],me=s[15];return r[0]=a*R+o*_+l*F+h*G,r[4]=a*T+o*L+l*H+h*ae,r[8]=a*C+o*N+l*O+h*ee,r[12]=a*y+o*P+l*Z+h*me,r[1]=c*R+u*_+d*F+m*G,r[5]=c*T+u*L+d*H+m*ae,r[9]=c*C+u*N+d*O+m*ee,r[13]=c*y+u*P+d*Z+m*me,r[2]=g*R+x*_+p*F+f*G,r[6]=g*T+x*L+p*H+f*ae,r[10]=g*C+x*N+p*O+f*ee,r[14]=g*y+x*P+p*Z+f*me,r[3]=w*R+S*_+v*F+I*G,r[7]=w*T+S*L+v*H+I*ae,r[11]=w*C+S*N+v*O+I*ee,r[15]=w*y+S*P+v*Z+I*me,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],h=e[13],c=e[2],u=e[6],d=e[10],m=e[14],g=e[3],x=e[7],p=e[11],f=e[15];return g*(+r*l*u-s*h*u-r*o*d+n*h*d+s*o*m-n*l*m)+x*(+t*l*m-t*h*d+r*a*d-s*a*m+s*h*c-r*l*c)+p*(+t*h*u-t*o*m-r*a*u+n*a*m+r*o*c-n*h*c)+f*(-s*o*c-t*l*u+t*o*d+s*a*u-n*a*d+n*l*c)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],h=e[7],c=e[8],u=e[9],d=e[10],m=e[11],g=e[12],x=e[13],p=e[14],f=e[15],w=u*p*h-x*d*h+x*l*m-o*p*m-u*l*f+o*d*f,S=g*d*h-c*p*h-g*l*m+a*p*m+c*l*f-a*d*f,v=c*x*h-g*u*h+g*o*m-a*x*m-c*o*f+a*u*f,I=g*u*l-c*x*l-g*o*d+a*x*d+c*o*p-a*u*p,R=t*w+n*S+s*v+r*I;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let T=1/R;return e[0]=w*T,e[1]=(x*d*r-u*p*r-x*s*m+n*p*m+u*s*f-n*d*f)*T,e[2]=(o*p*r-x*l*r+x*s*h-n*p*h-o*s*f+n*l*f)*T,e[3]=(u*l*r-o*d*r-u*s*h+n*d*h+o*s*m-n*l*m)*T,e[4]=S*T,e[5]=(c*p*r-g*d*r+g*s*m-t*p*m-c*s*f+t*d*f)*T,e[6]=(g*l*r-a*p*r-g*s*h+t*p*h+a*s*f-t*l*f)*T,e[7]=(a*d*r-c*l*r+c*s*h-t*d*h-a*s*m+t*l*m)*T,e[8]=v*T,e[9]=(g*u*r-c*x*r-g*n*m+t*x*m+c*n*f-t*u*f)*T,e[10]=(a*x*r-g*o*r+g*n*h-t*x*h-a*n*f+t*o*f)*T,e[11]=(c*o*r-a*u*r-c*n*h+t*u*h+a*n*m-t*o*m)*T,e[12]=I*T,e[13]=(c*x*s-g*u*s+g*n*d-t*x*d-c*n*p+t*u*p)*T,e[14]=(g*o*s-a*x*s-g*n*l+t*x*l+a*n*p-t*o*p)*T,e[15]=(a*u*s-c*o*s+c*n*l-t*u*l-a*n*d+t*o*d)*T,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,h=r*a,c=r*o;return this.set(h*a+n,h*o-s*l,h*l+s*o,0,h*o+s*l,c*o+n,c*l-s*a,0,h*l-s*o,c*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,h=r+r,c=a+a,u=o+o,d=r*h,m=r*c,g=r*u,x=a*c,p=a*u,f=o*u,w=l*h,S=l*c,v=l*u,I=n.x,R=n.y,T=n.z;return s[0]=(1-(x+f))*I,s[1]=(m+v)*I,s[2]=(g-S)*I,s[3]=0,s[4]=(m-v)*R,s[5]=(1-(d+f))*R,s[6]=(p+w)*R,s[7]=0,s[8]=(g+S)*T,s[9]=(p-w)*T,s[10]=(1-(d+x))*T,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements,r=rr.set(s[0],s[1],s[2]).length(),a=rr.set(s[4],s[5],s[6]).length(),o=rr.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],qn.copy(this);let h=1/r,c=1/a,u=1/o;return qn.elements[0]*=h,qn.elements[1]*=h,qn.elements[2]*=h,qn.elements[4]*=c,qn.elements[5]*=c,qn.elements[6]*=c,qn.elements[8]*=u,qn.elements[9]*=u,qn.elements[10]*=u,t.setFromRotationMatrix(qn),n.x=r,n.y=a,n.z=o,this}makePerspective(e,t,n,s,r,a,o=Pi){let l=this.elements,h=2*r/(t-e),c=2*r/(n-s),u=(t+e)/(t-e),d=(n+s)/(n-s),m,g;if(o===Pi)m=-(a+r)/(a-r),g=-2*a*r/(a-r);else if(o===Uo)m=-a/(a-r),g=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=c,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=Pi){let l=this.elements,h=1/(t-e),c=1/(n-s),u=1/(a-r),d=(t+e)*h,m=(n+s)*c,g,x;if(o===Pi)g=(a+r)*u,x=-2*u;else if(o===Uo)g=r*u,x=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*h,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*c,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=x,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},rr=new D,qn=new Ve,i0=new D(0,0,0),s0=new D(1,1,1),Ji=new D,uo=new D,_n=new D,Zd=new Ve,Jd=new an,Vt=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],h=s[5],c=s[9],u=s[2],d=s[6],m=s[10];switch(t){case"XYZ":this._y=Math.asin(mn(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-c,m),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,h),this._z=0);break;case"YXZ":this._x=Math.asin(-mn(c,-1,1)),Math.abs(c)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(l,h)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(mn(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,m),this._z=Math.atan2(-a,h)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-mn(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,h));break;case"YZX":this._z=Math.asin(mn(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-c,h),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-mn(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,h),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-c,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Zd.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Zd,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Jd.setFromEuler(this),this.setFromQuaternion(Jd,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Vt.DEFAULT_ORDER="XYZ";var Oo=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},r0=0,jd=new D,ar=new an,Ai=new Ve,fo=new D,ca=new D,a0=new D,o0=new an,Qd=new D(1,0,0),ef=new D(0,1,0),tf=new D(0,0,1),nf={type:"added"},l0={type:"removed"},or={type:"childadded",child:null},_c={type:"childremoved",child:null},cn=class i extends ss{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:r0++}),this.uuid=wa(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new D,t=new Vt,n=new an,s=new D(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Ve},normalMatrix:{value:new Ue}}),this.matrix=new Ve,this.matrixWorld=new Ve,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Oo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ar.setFromAxisAngle(e,t),this.quaternion.multiply(ar),this}rotateOnWorldAxis(e,t){return ar.setFromAxisAngle(e,t),this.quaternion.premultiply(ar),this}rotateX(e){return this.rotateOnAxis(Qd,e)}rotateY(e){return this.rotateOnAxis(ef,e)}rotateZ(e){return this.rotateOnAxis(tf,e)}translateOnAxis(e,t){return jd.copy(e).applyQuaternion(this.quaternion),this.position.add(jd.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Qd,e)}translateY(e){return this.translateOnAxis(ef,e)}translateZ(e){return this.translateOnAxis(tf,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Ai.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?fo.copy(e):fo.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),ca.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ai.lookAt(ca,fo,this.up):Ai.lookAt(fo,ca,this.up),this.quaternion.setFromRotationMatrix(Ai),s&&(Ai.extractRotation(s.matrixWorld),ar.setFromRotationMatrix(Ai),this.quaternion.premultiply(ar.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(nf),or.child=e,this.dispatchEvent(or),or.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(l0),_c.child=e,this.dispatchEvent(_c),_c.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Ai.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Ai.multiply(e.parent.matrixWorld)),e.applyMatrix4(Ai),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(nf),or.child=e,this.dispatchEvent(or),or.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ca,e,a0),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ca,o0,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let h=0,c=l.length;h<c;h++){let u=l[h];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,h=this.material.length;l<h;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),h=a(e.textures),c=a(e.images),u=a(e.shapes),d=a(e.skeletons),m=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),h.length>0&&(n.textures=h),c.length>0&&(n.images=c),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){let l=[];for(let h in o){let c=o[h];delete c.metadata,l.push(c)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}};cn.DEFAULT_UP=new D(0,1,0);cn.DEFAULT_MATRIX_AUTO_UPDATE=!0;cn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var $n=new D,Ti=new D,bc=new D,Ei=new D,lr=new D,cr=new D,sf=new D,Mc=new D,wc=new D,Sc=new D,Ac=new gt,Tc=new gt,Ec=new gt,Ts=class i{constructor(e=new D,t=new D,n=new D){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),$n.subVectors(e,t),s.cross($n);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){$n.subVectors(s,t),Ti.subVectors(n,t),bc.subVectors(e,t);let a=$n.dot($n),o=$n.dot(Ti),l=$n.dot(bc),h=Ti.dot(Ti),c=Ti.dot(bc),u=a*h-o*o;if(u===0)return r.set(0,0,0),null;let d=1/u,m=(h*l-o*c)*d,g=(a*c-o*l)*d;return r.set(1-m-g,g,m)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,Ei)===null?!1:Ei.x>=0&&Ei.y>=0&&Ei.x+Ei.y<=1}static getInterpolation(e,t,n,s,r,a,o,l){return this.getBarycoord(e,t,n,s,Ei)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Ei.x),l.addScaledVector(a,Ei.y),l.addScaledVector(o,Ei.z),l)}static getInterpolatedAttribute(e,t,n,s,r,a){return Ac.setScalar(0),Tc.setScalar(0),Ec.setScalar(0),Ac.fromBufferAttribute(e,t),Tc.fromBufferAttribute(e,n),Ec.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(Ac,r.x),a.addScaledVector(Tc,r.y),a.addScaledVector(Ec,r.z),a}static isFrontFacing(e,t,n,s){return $n.subVectors(n,t),Ti.subVectors(e,t),$n.cross(Ti).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return $n.subVectors(this.c,this.b),Ti.subVectors(this.a,this.b),$n.cross(Ti).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,a,o;lr.subVectors(s,n),cr.subVectors(r,n),Mc.subVectors(e,n);let l=lr.dot(Mc),h=cr.dot(Mc);if(l<=0&&h<=0)return t.copy(n);wc.subVectors(e,s);let c=lr.dot(wc),u=cr.dot(wc);if(c>=0&&u<=c)return t.copy(s);let d=l*u-c*h;if(d<=0&&l>=0&&c<=0)return a=l/(l-c),t.copy(n).addScaledVector(lr,a);Sc.subVectors(e,r);let m=lr.dot(Sc),g=cr.dot(Sc);if(g>=0&&m<=g)return t.copy(r);let x=m*h-l*g;if(x<=0&&h>=0&&g<=0)return o=h/(h-g),t.copy(n).addScaledVector(cr,o);let p=c*g-m*u;if(p<=0&&u-c>=0&&m-g>=0)return sf.subVectors(r,s),o=(u-c)/(u-c+(m-g)),t.copy(s).addScaledVector(sf,o);let f=1/(p+x+d);return a=x*f,o=d*f,t.copy(n).addScaledVector(lr,a).addScaledVector(cr,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Jf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ji={h:0,s:0,l:0},po={h:0,s:0,l:0};function Cc(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var le=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Ln){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,nt.toWorkingColorSpace(this,t),this}setRGB(e,t,n,s=nt.workingColorSpace){return this.r=e,this.g=t,this.b=n,nt.toWorkingColorSpace(this,s),this}setHSL(e,t,n,s=nt.workingColorSpace){if(e=Kg(e,1),t=mn(t,0,1),n=mn(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Cc(a,r,e+1/3),this.g=Cc(a,r,e),this.b=Cc(a,r,e-1/3)}return nt.toWorkingColorSpace(this,s),this}setStyle(e,t=Ln){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Ln){let n=Jf[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ii(e.r),this.g=Ii(e.g),this.b=Ii(e.b),this}copyLinearToSRGB(e){return this.r=vr(e.r),this.g=vr(e.g),this.b=vr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Ln){return nt.fromWorkingColorSpace(rn.copy(this),e),Math.round(mn(rn.r*255,0,255))*65536+Math.round(mn(rn.g*255,0,255))*256+Math.round(mn(rn.b*255,0,255))}getHexString(e=Ln){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=nt.workingColorSpace){nt.fromWorkingColorSpace(rn.copy(this),t);let n=rn.r,s=rn.g,r=rn.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,h,c=(o+a)/2;if(o===a)l=0,h=0;else{let u=a-o;switch(h=c<=.5?u/(a+o):u/(2-a-o),a){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return e.h=l,e.s=h,e.l=c,e}getRGB(e,t=nt.workingColorSpace){return nt.fromWorkingColorSpace(rn.copy(this),t),e.r=rn.r,e.g=rn.g,e.b=rn.b,e}getStyle(e=Ln){nt.fromWorkingColorSpace(rn.copy(this),e);let t=rn.r,n=rn.g,s=rn.b;return e!==Ln?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(ji),this.setHSL(ji.h+e,ji.s+t,ji.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(ji),e.getHSL(po);let n=uc(ji.h,po.h,t),s=uc(ji.s,po.s,t),r=uc(ji.l,po.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},rn=new le;le.NAMES=Jf;var c0=0,rs=class extends ss{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:c0++}),this.uuid=wa(),this.name="",this.blending=gr,this.side=is,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=zc,this.blendDst=Hc,this.blendEquation=As,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new le(0,0,0),this.blendAlpha=0,this.depthFunc=_r,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=zd,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=er,this.stencilZFail=er,this.stencilZPass=er,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==gr&&(n.blending=this.blending),this.side!==is&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==zc&&(n.blendSrc=this.blendSrc),this.blendDst!==Hc&&(n.blendDst=this.blendDst),this.blendEquation!==As&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==_r&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==zd&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==er&&(n.stencilFail=this.stencilFail),this.stencilZFail!==er&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==er&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},Jt=class extends rs{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new le(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Vt,this.combine=tl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Ft=new D,mo=new $e,wn=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Hd,this.updateRanges=[],this.gpuType=ci,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)mo.fromBufferAttribute(this,t),mo.applyMatrix3(e),this.setXY(t,mo.x,mo.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Ft.fromBufferAttribute(this,t),Ft.applyMatrix3(e),this.setXYZ(t,Ft.x,Ft.y,Ft.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Ft.fromBufferAttribute(this,t),Ft.applyMatrix4(e),this.setXYZ(t,Ft.x,Ft.y,Ft.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Ft.fromBufferAttribute(this,t),Ft.applyNormalMatrix(e),this.setXYZ(t,Ft.x,Ft.y,Ft.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Ft.fromBufferAttribute(this,t),Ft.transformDirection(e),this.setXYZ(t,Ft.x,Ft.y,Ft.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=aa(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=pn(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=aa(t,this.array)),t}setX(e,t){return this.normalized&&(t=pn(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=aa(t,this.array)),t}setY(e,t){return this.normalized&&(t=pn(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=aa(t,this.array)),t}setZ(e,t){return this.normalized&&(t=pn(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=aa(t,this.array)),t}setW(e,t){return this.normalized&&(t=pn(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=pn(t,this.array),n=pn(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=pn(t,this.array),n=pn(n,this.array),s=pn(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=pn(t,this.array),n=pn(n,this.array),s=pn(s,this.array),r=pn(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Hd&&(e.usage=this.usage),e}};var Ar=class extends wn{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var zo=class extends wn{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var it=class extends wn{constructor(e,t,n){super(new Float32Array(e),t,n)}},h0=0,In=new Ve,Rc=new cn,hr=new D,bn=new Ni,ha=new Ni,Kt=new D,en=class i extends ss{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:h0++}),this.uuid=wa(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Zf(e)?zo:Ar)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Ue().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return In.makeRotationFromQuaternion(e),this.applyMatrix4(In),this}rotateX(e){return In.makeRotationX(e),this.applyMatrix4(In),this}rotateY(e){return In.makeRotationY(e),this.applyMatrix4(In),this}rotateZ(e){return In.makeRotationZ(e),this.applyMatrix4(In),this}translate(e,t,n){return In.makeTranslation(e,t,n),this.applyMatrix4(In),this}scale(e,t,n){return In.makeScale(e,t,n),this.applyMatrix4(In),this}lookAt(e){return Rc.lookAt(e),Rc.updateMatrix(),this.applyMatrix4(Rc.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(hr).negate(),this.translate(hr.x,hr.y,hr.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new it(n,3))}else{for(let n=0,s=t.count;n<s;n++){let r=e[n];t.setXYZ(n,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ni);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];bn.setFromBufferAttribute(r),this.morphTargetsRelative?(Kt.addVectors(this.boundingBox.min,bn.min),this.boundingBox.expandByPoint(Kt),Kt.addVectors(this.boundingBox.max,bn.max),this.boundingBox.expandByPoint(Kt)):(this.boundingBox.expandByPoint(bn.min),this.boundingBox.expandByPoint(bn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ls);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new D,1/0);return}if(e){let n=this.boundingSphere.center;if(bn.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];ha.setFromBufferAttribute(o),this.morphTargetsRelative?(Kt.addVectors(bn.min,ha.min),bn.expandByPoint(Kt),Kt.addVectors(bn.max,ha.max),bn.expandByPoint(Kt)):(bn.expandByPoint(ha.min),bn.expandByPoint(ha.max))}bn.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)Kt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Kt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let h=0,c=o.count;h<c;h++)Kt.fromBufferAttribute(o,h),l&&(hr.fromBufferAttribute(e,h),Kt.add(hr)),s=Math.max(s,n.distanceToSquared(Kt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new wn(new Float32Array(4*n.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let C=0;C<n.count;C++)o[C]=new D,l[C]=new D;let h=new D,c=new D,u=new D,d=new $e,m=new $e,g=new $e,x=new D,p=new D;function f(C,y,_){h.fromBufferAttribute(n,C),c.fromBufferAttribute(n,y),u.fromBufferAttribute(n,_),d.fromBufferAttribute(r,C),m.fromBufferAttribute(r,y),g.fromBufferAttribute(r,_),c.sub(h),u.sub(h),m.sub(d),g.sub(d);let L=1/(m.x*g.y-g.x*m.y);isFinite(L)&&(x.copy(c).multiplyScalar(g.y).addScaledVector(u,-m.y).multiplyScalar(L),p.copy(u).multiplyScalar(m.x).addScaledVector(c,-g.x).multiplyScalar(L),o[C].add(x),o[y].add(x),o[_].add(x),l[C].add(p),l[y].add(p),l[_].add(p))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let C=0,y=w.length;C<y;++C){let _=w[C],L=_.start,N=_.count;for(let P=L,F=L+N;P<F;P+=3)f(e.getX(P+0),e.getX(P+1),e.getX(P+2))}let S=new D,v=new D,I=new D,R=new D;function T(C){I.fromBufferAttribute(s,C),R.copy(I);let y=o[C];S.copy(y),S.sub(I.multiplyScalar(I.dot(y))).normalize(),v.crossVectors(R,y);let L=v.dot(l[C])<0?-1:1;a.setXYZW(C,S.x,S.y,S.z,L)}for(let C=0,y=w.length;C<y;++C){let _=w[C],L=_.start,N=_.count;for(let P=L,F=L+N;P<F;P+=3)T(e.getX(P+0)),T(e.getX(P+1)),T(e.getX(P+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new wn(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,m=n.count;d<m;d++)n.setXYZ(d,0,0,0);let s=new D,r=new D,a=new D,o=new D,l=new D,h=new D,c=new D,u=new D;if(e)for(let d=0,m=e.count;d<m;d+=3){let g=e.getX(d+0),x=e.getX(d+1),p=e.getX(d+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,x),a.fromBufferAttribute(t,p),c.subVectors(a,r),u.subVectors(s,r),c.cross(u),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,x),h.fromBufferAttribute(n,p),o.add(c),l.add(c),h.add(c),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(p,h.x,h.y,h.z)}else for(let d=0,m=t.count;d<m;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),c.subVectors(a,r),u.subVectors(s,r),c.cross(u),n.setXYZ(d+0,c.x,c.y,c.z),n.setXYZ(d+1,c.x,c.y,c.z),n.setXYZ(d+2,c.x,c.y,c.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Kt.fromBufferAttribute(e,t),Kt.normalize(),e.setXYZ(t,Kt.x,Kt.y,Kt.z)}toNonIndexed(){function e(o,l){let h=o.array,c=o.itemSize,u=o.normalized,d=new h.constructor(l.length*c),m=0,g=0;for(let x=0,p=l.length;x<p;x++){o.isInterleavedBufferAttribute?m=l[x]*o.data.stride+o.offset:m=l[x]*c;for(let f=0;f<c;f++)d[g++]=h[m++]}return new wn(d,c,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],h=e(l,n);t.setAttribute(o,h)}let r=this.morphAttributes;for(let o in r){let l=[],h=r[o];for(let c=0,u=h.length;c<u;c++){let d=h[c],m=e(d,n);l.push(m)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let h=a[o];t.addGroup(h.start,h.count,h.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let h in l)l[h]!==void 0&&(e[h]=l[h]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let h=n[l];e.data.attributes[l]=h.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let h=this.morphAttributes[l],c=[];for(let u=0,d=h.length;u<d;u++){let m=h[u];c.push(m.toJSON(e.data))}c.length>0&&(s[l]=c,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone(t));let s=e.attributes;for(let h in s){let c=s[h];this.setAttribute(h,c.clone(t))}let r=e.morphAttributes;for(let h in r){let c=[],u=r[h];for(let d=0,m=u.length;d<m;d++)c.push(u[d].clone(t));this.morphAttributes[h]=c}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let h=0,c=a.length;h<c;h++){let u=a[h];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},rf=new Ve,_s=new Ph,go=new Ls,af=new D,xo=new D,vo=new D,yo=new D,Pc=new D,_o=new D,of=new D,bo=new D,yt=class extends cn{constructor(e=new en,t=new Jt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){_o.set(0,0,0);for(let l=0,h=r.length;l<h;l++){let c=o[l],u=r[l];c!==0&&(Pc.fromBufferAttribute(u,e),a?_o.addScaledVector(Pc,c):_o.addScaledVector(Pc.sub(t),c))}t.add(_o)}return t}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),go.copy(n.boundingSphere),go.applyMatrix4(r),_s.copy(e.ray).recast(e.near),!(go.containsPoint(_s.origin)===!1&&(_s.intersectSphere(go,af)===null||_s.origin.distanceToSquared(af)>(e.far-e.near)**2))&&(rf.copy(r).invert(),_s.copy(e.ray).applyMatrix4(rf),!(n.boundingBox!==null&&_s.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,_s)))}_computeIntersections(e,t,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,h=r.attributes.uv,c=r.attributes.uv1,u=r.attributes.normal,d=r.groups,m=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,x=d.length;g<x;g++){let p=d[g],f=a[p.materialIndex],w=Math.max(p.start,m.start),S=Math.min(o.count,Math.min(p.start+p.count,m.start+m.count));for(let v=w,I=S;v<I;v+=3){let R=o.getX(v),T=o.getX(v+1),C=o.getX(v+2);s=Mo(this,f,e,n,h,c,u,R,T,C),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let g=Math.max(0,m.start),x=Math.min(o.count,m.start+m.count);for(let p=g,f=x;p<f;p+=3){let w=o.getX(p),S=o.getX(p+1),v=o.getX(p+2);s=Mo(this,a,e,n,h,c,u,w,S,v),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,x=d.length;g<x;g++){let p=d[g],f=a[p.materialIndex],w=Math.max(p.start,m.start),S=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let v=w,I=S;v<I;v+=3){let R=v,T=v+1,C=v+2;s=Mo(this,f,e,n,h,c,u,R,T,C),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let g=Math.max(0,m.start),x=Math.min(l.count,m.start+m.count);for(let p=g,f=x;p<f;p+=3){let w=p,S=p+1,v=p+2;s=Mo(this,a,e,n,h,c,u,w,S,v),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}}};function u0(i,e,t,n,s,r,a,o){let l;if(e.side===gn?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,e.side===is,o),l===null)return null;bo.copy(o),bo.applyMatrix4(i.matrixWorld);let h=t.ray.origin.distanceTo(bo);return h<t.near||h>t.far?null:{distance:h,point:bo.clone(),object:i}}function Mo(i,e,t,n,s,r,a,o,l,h){i.getVertexPosition(o,xo),i.getVertexPosition(l,vo),i.getVertexPosition(h,yo);let c=u0(i,e,t,n,xo,vo,yo,of);if(c){let u=new D;Ts.getBarycoord(of,xo,vo,yo,u),s&&(c.uv=Ts.getInterpolatedAttribute(s,o,l,h,u,new $e)),r&&(c.uv1=Ts.getInterpolatedAttribute(r,o,l,h,u,new $e)),a&&(c.normal=Ts.getInterpolatedAttribute(a,o,l,h,u,new D),c.normal.dot(n.direction)>0&&c.normal.multiplyScalar(-1));let d={a:o,b:l,c:h,normal:new D,materialIndex:0};Ts.getNormal(xo,vo,yo,d.normal),c.face=d,c.barycoord=u}return c}var Ui=class i extends en{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],h=[],c=[],u=[],d=0,m=0;g("z","y","x",-1,-1,n,t,e,a,r,0),g("z","y","x",1,-1,n,t,-e,a,r,1),g("x","z","y",1,1,e,n,t,s,a,2),g("x","z","y",1,-1,e,n,-t,s,a,3),g("x","y","z",1,-1,e,t,n,s,r,4),g("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new it(h,3)),this.setAttribute("normal",new it(c,3)),this.setAttribute("uv",new it(u,2));function g(x,p,f,w,S,v,I,R,T,C,y){let _=v/T,L=I/C,N=v/2,P=I/2,F=R/2,H=T+1,O=C+1,Z=0,G=0,ae=new D;for(let ee=0;ee<O;ee++){let me=ee*L-P;for(let ke=0;ke<H;ke++){let ot=ke*_-N;ae[x]=ot*w,ae[p]=me*S,ae[f]=F,h.push(ae.x,ae.y,ae.z),ae[x]=0,ae[p]=0,ae[f]=R>0?1:-1,c.push(ae.x,ae.y,ae.z),u.push(ke/T),u.push(1-ee/C),Z+=1}}for(let ee=0;ee<C;ee++)for(let me=0;me<T;me++){let ke=d+me+H*ee,ot=d+me+H*(ee+1),X=d+(me+1)+H*(ee+1),ie=d+(me+1)+H*ee;l.push(ke,ot,ie),l.push(ot,X,ie),G+=6}o.addGroup(m,G,y),m+=G,d+=Z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Tr(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function ln(i){let e={};for(let t=0;t<i.length;t++){let n=Tr(i[t]);for(let s in n)e[s]=n[s]}return e}function d0(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function jf(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:nt.workingColorSpace}var f0={clone:Tr,merge:ln},p0=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,m0=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,hi=class extends rs{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=p0,this.fragmentShader=m0,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Tr(e.uniforms),this.uniformsGroups=d0(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},Ho=class extends cn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ve,this.projectionMatrix=new Ve,this.projectionMatrixInverse=new Ve,this.coordinateSystem=Pi}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Qi=new D,lf=new $e,cf=new $e,Zt=class extends Ho{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Th*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(hc*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Th*2*Math.atan(Math.tan(hc*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Qi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Qi.x,Qi.y).multiplyScalar(-e/Qi.z),Qi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Qi.x,Qi.y).multiplyScalar(-e/Qi.z)}getViewSize(e,t){return this.getViewBounds(e,lf,cf),t.subVectors(cf,lf)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(hc*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,h=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*n/h,s*=a.width/l,n*=a.height/h}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},ur=-90,dr=1,Ih=class extends cn{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Zt(ur,dr,e,t);s.layers=this.layers,this.add(s);let r=new Zt(ur,dr,e,t);r.layers=this.layers,this.add(r);let a=new Zt(ur,dr,e,t);a.layers=this.layers,this.add(a);let o=new Zt(ur,dr,e,t);o.layers=this.layers,this.add(o);let l=new Zt(ur,dr,e,t);l.layers=this.layers,this.add(l);let h=new Zt(ur,dr,e,t);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,l]=t;for(let h of t)this.remove(h);if(e===Pi)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Uo)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let h of t)this.add(h),h.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,h,c]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,a),e.setRenderTarget(n,2,s),e.render(t,o),e.setRenderTarget(n,3,s),e.render(t,l),e.setRenderTarget(n,4,s),e.render(t,h),n.texture.generateMipmaps=x,e.setRenderTarget(n,5,s),e.render(t,c),e.setRenderTarget(u,d,m),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},Vo=class extends Sn{constructor(e,t,n,s,r,a,o,l,h,c){e=e!==void 0?e:[],t=t!==void 0?t:br,super(e,t,n,s,r,a,o,l,h,c),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Lh=class extends Di{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new Vo(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:li}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new Ui(5,5,5),r=new hi({name:"CubemapFromEquirect",uniforms:Tr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:gn,blending:ts});r.uniforms.tEquirect.value=t;let a=new yt(s,r),o=t.minFilter;return t.minFilter===Rs&&(t.minFilter=li),new Ih(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,s){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}},Ic=new D,g0=new D,x0=new Ue,Ri=class{constructor(e=new D(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=Ic.subVectors(n,t).cross(g0.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(Ic),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||x0.getNormalMatrix(e),s=this.coplanarPoint(Ic).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},bs=new Ls,wo=new D,va=class{constructor(e=new Ri,t=new Ri,n=new Ri,s=new Ri,r=new Ri,a=new Ri){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Pi){let n=this.planes,s=e.elements,r=s[0],a=s[1],o=s[2],l=s[3],h=s[4],c=s[5],u=s[6],d=s[7],m=s[8],g=s[9],x=s[10],p=s[11],f=s[12],w=s[13],S=s[14],v=s[15];if(n[0].setComponents(l-r,d-h,p-m,v-f).normalize(),n[1].setComponents(l+r,d+h,p+m,v+f).normalize(),n[2].setComponents(l+a,d+c,p+g,v+w).normalize(),n[3].setComponents(l-a,d-c,p-g,v-w).normalize(),n[4].setComponents(l-o,d-u,p-x,v-S).normalize(),t===Pi)n[5].setComponents(l+o,d+u,p+x,v+S).normalize();else if(t===Uo)n[5].setComponents(o,u,x,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),bs.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),bs.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(bs)}intersectsSprite(e){return bs.center.set(0,0,0),bs.radius=.7071067811865476,bs.applyMatrix4(e.matrixWorld),this.intersectsSphere(bs)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(wo.x=s.normal.x>0?e.max.x:e.min.x,wo.y=s.normal.y>0?e.max.y:e.min.y,wo.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(wo)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function Qf(){let i=null,e=!1,t=null,n=null;function s(r,a){t(r,a),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function v0(i){let e=new WeakMap;function t(o,l){let h=o.array,c=o.usage,u=h.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,h,c),o.onUploadCallback();let m;if(h instanceof Float32Array)m=i.FLOAT;else if(h instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(h instanceof Int16Array)m=i.SHORT;else if(h instanceof Uint32Array)m=i.UNSIGNED_INT;else if(h instanceof Int32Array)m=i.INT;else if(h instanceof Int8Array)m=i.BYTE;else if(h instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:d,type:m,bytesPerElement:h.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,l,h){let c=l.array,u=l.updateRanges;if(i.bindBuffer(h,o),u.length===0)i.bufferSubData(h,0,c);else{u.sort((m,g)=>m.start-g.start);let d=0;for(let m=1;m<u.length;m++){let g=u[d],x=u[m];x.start<=g.start+g.count+1?g.count=Math.max(g.count,x.start+x.count-g.start):(++d,u[d]=x)}u.length=d+1;for(let m=0,g=u.length;m<g;m++){let x=u[m];i.bufferSubData(h,x.start*c.BYTES_PER_ELEMENT,c,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let c=e.get(o);(!c||c.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let h=e.get(o);if(h===void 0)e.set(o,t(o,l));else if(h.version<o.version){if(h.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(h.buffer,o,l),h.version=o.version}}return{get:s,remove:r,update:a}}var as=class i extends en{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(s),h=o+1,c=l+1,u=e/o,d=t/l,m=[],g=[],x=[],p=[];for(let f=0;f<c;f++){let w=f*d-a;for(let S=0;S<h;S++){let v=S*u-r;g.push(v,-w,0),x.push(0,0,1),p.push(S/o),p.push(1-f/l)}}for(let f=0;f<l;f++)for(let w=0;w<o;w++){let S=w+h*f,v=w+h*(f+1),I=w+1+h*(f+1),R=w+1+h*f;m.push(S,v,R),m.push(v,I,R)}this.setIndex(m),this.setAttribute("position",new it(g,3)),this.setAttribute("normal",new it(x,3)),this.setAttribute("uv",new it(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}},y0=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,_0=`#ifdef USE_ALPHAHASH
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
#endif`,b0=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,M0=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,w0=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,S0=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,A0=`#ifdef USE_AOMAP
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
#endif`,T0=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,E0=`#ifdef USE_BATCHING
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
#endif`,C0=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,R0=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,P0=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,I0=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,L0=`#ifdef USE_IRIDESCENCE
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
#endif`,D0=`#ifdef USE_BUMPMAP
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
#endif`,N0=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,U0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,k0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,F0=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,B0=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,O0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,z0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,H0=`#if defined( USE_COLOR_ALPHA )
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
#endif`,V0=`#define PI 3.141592653589793
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
} // validated`,G0=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,W0=`vec3 transformedNormal = objectNormal;
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
#endif`,q0=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,$0=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,X0=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Y0=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,K0="gl_FragColor = linearToOutputTexel( gl_FragColor );",Z0=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,J0=`#ifdef USE_ENVMAP
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
#endif`,j0=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Q0=`#ifdef USE_ENVMAP
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
#endif`,ex=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,tx=`#ifdef USE_ENVMAP
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
#endif`,nx=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ix=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,sx=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,rx=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,ax=`#ifdef USE_GRADIENTMAP
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
}`,ox=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lx=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,cx=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,hx=`uniform bool receiveShadow;
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
#endif`,ux=`#ifdef USE_ENVMAP
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
#endif`,dx=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,fx=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,px=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,mx=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,gx=`PhysicalMaterial material;
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
#endif`,xx=`struct PhysicalMaterial {
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
}`,vx=`
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
#endif`,yx=`#if defined( RE_IndirectDiffuse )
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
#endif`,_x=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,bx=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Mx=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,wx=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Sx=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Ax=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Tx=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Ex=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Cx=`#if defined( USE_POINTS_UV )
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
#endif`,Rx=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Px=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Ix=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Lx=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Dx=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Nx=`#ifdef USE_MORPHTARGETS
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
#endif`,Ux=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,kx=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Fx=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Bx=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ox=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,zx=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Hx=`#ifdef USE_NORMALMAP
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
#endif`,Vx=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Gx=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Wx=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,qx=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,$x=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Xx=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Yx=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Kx=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Zx=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Jx=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,jx=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Qx=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,ev=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,tv=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,nv=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,iv=`float getShadowMask() {
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
}`,sv=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,rv=`#ifdef USE_SKINNING
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
#endif`,av=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,ov=`#ifdef USE_SKINNING
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
#endif`,lv=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,cv=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,hv=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,uv=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,dv=`#ifdef USE_TRANSMISSION
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
#endif`,fv=`#ifdef USE_TRANSMISSION
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
#endif`,pv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,mv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,gv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,xv=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,vv=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,yv=`uniform sampler2D t2D;
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
}`,_v=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,bv=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Mv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,wv=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Sv=`#include <common>
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
}`,Av=`#if DEPTH_PACKING == 3200
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
}`,Tv=`#define DISTANCE
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
}`,Ev=`#define DISTANCE
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
}`,Cv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Rv=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Pv=`uniform float scale;
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
}`,Iv=`uniform vec3 diffuse;
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
}`,Lv=`#include <common>
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
}`,Dv=`uniform vec3 diffuse;
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
}`,Nv=`#define LAMBERT
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
}`,Uv=`#define LAMBERT
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
}`,kv=`#define MATCAP
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
}`,Fv=`#define MATCAP
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
}`,Bv=`#define NORMAL
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
}`,Ov=`#define NORMAL
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
}`,zv=`#define PHONG
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
}`,Hv=`#define PHONG
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
}`,Vv=`#define STANDARD
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
}`,Gv=`#define STANDARD
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
}`,Wv=`#define TOON
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
}`,qv=`#define TOON
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
}`,$v=`uniform float size;
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
}`,Xv=`uniform vec3 diffuse;
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
}`,Yv=`#include <common>
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
}`,Kv=`uniform vec3 color;
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
}`,Zv=`uniform float rotation;
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
}`,Jv=`uniform vec3 diffuse;
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
}`,He={alphahash_fragment:y0,alphahash_pars_fragment:_0,alphamap_fragment:b0,alphamap_pars_fragment:M0,alphatest_fragment:w0,alphatest_pars_fragment:S0,aomap_fragment:A0,aomap_pars_fragment:T0,batching_pars_vertex:E0,batching_vertex:C0,begin_vertex:R0,beginnormal_vertex:P0,bsdfs:I0,iridescence_fragment:L0,bumpmap_pars_fragment:D0,clipping_planes_fragment:N0,clipping_planes_pars_fragment:U0,clipping_planes_pars_vertex:k0,clipping_planes_vertex:F0,color_fragment:B0,color_pars_fragment:O0,color_pars_vertex:z0,color_vertex:H0,common:V0,cube_uv_reflection_fragment:G0,defaultnormal_vertex:W0,displacementmap_pars_vertex:q0,displacementmap_vertex:$0,emissivemap_fragment:X0,emissivemap_pars_fragment:Y0,colorspace_fragment:K0,colorspace_pars_fragment:Z0,envmap_fragment:J0,envmap_common_pars_fragment:j0,envmap_pars_fragment:Q0,envmap_pars_vertex:ex,envmap_physical_pars_fragment:ux,envmap_vertex:tx,fog_vertex:nx,fog_pars_vertex:ix,fog_fragment:sx,fog_pars_fragment:rx,gradientmap_pars_fragment:ax,lightmap_pars_fragment:ox,lights_lambert_fragment:lx,lights_lambert_pars_fragment:cx,lights_pars_begin:hx,lights_toon_fragment:dx,lights_toon_pars_fragment:fx,lights_phong_fragment:px,lights_phong_pars_fragment:mx,lights_physical_fragment:gx,lights_physical_pars_fragment:xx,lights_fragment_begin:vx,lights_fragment_maps:yx,lights_fragment_end:_x,logdepthbuf_fragment:bx,logdepthbuf_pars_fragment:Mx,logdepthbuf_pars_vertex:wx,logdepthbuf_vertex:Sx,map_fragment:Ax,map_pars_fragment:Tx,map_particle_fragment:Ex,map_particle_pars_fragment:Cx,metalnessmap_fragment:Rx,metalnessmap_pars_fragment:Px,morphinstance_vertex:Ix,morphcolor_vertex:Lx,morphnormal_vertex:Dx,morphtarget_pars_vertex:Nx,morphtarget_vertex:Ux,normal_fragment_begin:kx,normal_fragment_maps:Fx,normal_pars_fragment:Bx,normal_pars_vertex:Ox,normal_vertex:zx,normalmap_pars_fragment:Hx,clearcoat_normal_fragment_begin:Vx,clearcoat_normal_fragment_maps:Gx,clearcoat_pars_fragment:Wx,iridescence_pars_fragment:qx,opaque_fragment:$x,packing:Xx,premultiplied_alpha_fragment:Yx,project_vertex:Kx,dithering_fragment:Zx,dithering_pars_fragment:Jx,roughnessmap_fragment:jx,roughnessmap_pars_fragment:Qx,shadowmap_pars_fragment:ev,shadowmap_pars_vertex:tv,shadowmap_vertex:nv,shadowmask_pars_fragment:iv,skinbase_vertex:sv,skinning_pars_vertex:rv,skinning_vertex:av,skinnormal_vertex:ov,specularmap_fragment:lv,specularmap_pars_fragment:cv,tonemapping_fragment:hv,tonemapping_pars_fragment:uv,transmission_fragment:dv,transmission_pars_fragment:fv,uv_pars_fragment:pv,uv_pars_vertex:mv,uv_vertex:gv,worldpos_vertex:xv,background_vert:vv,background_frag:yv,backgroundCube_vert:_v,backgroundCube_frag:bv,cube_vert:Mv,cube_frag:wv,depth_vert:Sv,depth_frag:Av,distanceRGBA_vert:Tv,distanceRGBA_frag:Ev,equirect_vert:Cv,equirect_frag:Rv,linedashed_vert:Pv,linedashed_frag:Iv,meshbasic_vert:Lv,meshbasic_frag:Dv,meshlambert_vert:Nv,meshlambert_frag:Uv,meshmatcap_vert:kv,meshmatcap_frag:Fv,meshnormal_vert:Bv,meshnormal_frag:Ov,meshphong_vert:zv,meshphong_frag:Hv,meshphysical_vert:Vv,meshphysical_frag:Gv,meshtoon_vert:Wv,meshtoon_frag:qv,points_vert:$v,points_frag:Xv,shadow_vert:Yv,shadow_frag:Kv,sprite_vert:Zv,sprite_frag:Jv},oe={common:{diffuse:{value:new le(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ue}},envmap:{envMap:{value:null},envMapRotation:{value:new Ue},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ue}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ue}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ue},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ue},normalScale:{value:new $e(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ue},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ue}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ue}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ue}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new le(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new le(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0},uvTransform:{value:new Ue}},sprite:{diffuse:{value:new le(16777215)},opacity:{value:1},center:{value:new $e(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}}},oi={basic:{uniforms:ln([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.fog]),vertexShader:He.meshbasic_vert,fragmentShader:He.meshbasic_frag},lambert:{uniforms:ln([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,oe.lights,{emissive:{value:new le(0)}}]),vertexShader:He.meshlambert_vert,fragmentShader:He.meshlambert_frag},phong:{uniforms:ln([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,oe.lights,{emissive:{value:new le(0)},specular:{value:new le(1118481)},shininess:{value:30}}]),vertexShader:He.meshphong_vert,fragmentShader:He.meshphong_frag},standard:{uniforms:ln([oe.common,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.roughnessmap,oe.metalnessmap,oe.fog,oe.lights,{emissive:{value:new le(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag},toon:{uniforms:ln([oe.common,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.gradientmap,oe.fog,oe.lights,{emissive:{value:new le(0)}}]),vertexShader:He.meshtoon_vert,fragmentShader:He.meshtoon_frag},matcap:{uniforms:ln([oe.common,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,{matcap:{value:null}}]),vertexShader:He.meshmatcap_vert,fragmentShader:He.meshmatcap_frag},points:{uniforms:ln([oe.points,oe.fog]),vertexShader:He.points_vert,fragmentShader:He.points_frag},dashed:{uniforms:ln([oe.common,oe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:He.linedashed_vert,fragmentShader:He.linedashed_frag},depth:{uniforms:ln([oe.common,oe.displacementmap]),vertexShader:He.depth_vert,fragmentShader:He.depth_frag},normal:{uniforms:ln([oe.common,oe.bumpmap,oe.normalmap,oe.displacementmap,{opacity:{value:1}}]),vertexShader:He.meshnormal_vert,fragmentShader:He.meshnormal_frag},sprite:{uniforms:ln([oe.sprite,oe.fog]),vertexShader:He.sprite_vert,fragmentShader:He.sprite_frag},background:{uniforms:{uvTransform:{value:new Ue},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:He.background_vert,fragmentShader:He.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ue}},vertexShader:He.backgroundCube_vert,fragmentShader:He.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:He.cube_vert,fragmentShader:He.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:He.equirect_vert,fragmentShader:He.equirect_frag},distanceRGBA:{uniforms:ln([oe.common,oe.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:He.distanceRGBA_vert,fragmentShader:He.distanceRGBA_frag},shadow:{uniforms:ln([oe.lights,oe.fog,{color:{value:new le(0)},opacity:{value:1}}]),vertexShader:He.shadow_vert,fragmentShader:He.shadow_frag}};oi.physical={uniforms:ln([oi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ue},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ue},clearcoatNormalScale:{value:new $e(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ue},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ue},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ue},sheen:{value:0},sheenColor:{value:new le(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ue},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ue},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ue},transmissionSamplerSize:{value:new $e},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ue},attenuationDistance:{value:0},attenuationColor:{value:new le(0)},specularColor:{value:new le(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ue},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ue},anisotropyVector:{value:new $e},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ue}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag};var So={r:0,b:0,g:0},Ms=new Vt,jv=new Ve;function Qv(i,e,t,n,s,r,a){let o=new le(0),l=r===!0?0:1,h,c,u=null,d=0,m=null;function g(w){let S=w.isScene===!0?w.background:null;return S&&S.isTexture&&(S=(w.backgroundBlurriness>0?t:e).get(S)),S}function x(w){let S=!1,v=g(w);v===null?f(o,l):v&&v.isColor&&(f(v,1),S=!0);let I=i.xr.getEnvironmentBlendMode();I==="additive"?n.buffers.color.setClear(0,0,0,1,a):I==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||S)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function p(w,S){let v=g(S);v&&(v.isCubeTexture||v.mapping===nl)?(c===void 0&&(c=new yt(new Ui(1,1,1),new hi({name:"BackgroundCubeMaterial",uniforms:Tr(oi.backgroundCube.uniforms),vertexShader:oi.backgroundCube.vertexShader,fragmentShader:oi.backgroundCube.fragmentShader,side:gn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(I,R,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(c)),Ms.copy(S.backgroundRotation),Ms.x*=-1,Ms.y*=-1,Ms.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(Ms.y*=-1,Ms.z*=-1),c.material.uniforms.envMap.value=v,c.material.uniforms.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(jv.makeRotationFromEuler(Ms)),c.material.toneMapped=nt.getTransfer(v.colorSpace)!==mt,(u!==v||d!==v.version||m!==i.toneMapping)&&(c.material.needsUpdate=!0,u=v,d=v.version,m=i.toneMapping),c.layers.enableAll(),w.unshift(c,c.geometry,c.material,0,0,null)):v&&v.isTexture&&(h===void 0&&(h=new yt(new as(2,2),new hi({name:"BackgroundMaterial",uniforms:Tr(oi.background.uniforms),vertexShader:oi.background.vertexShader,fragmentShader:oi.background.fragmentShader,side:is,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),Object.defineProperty(h.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(h)),h.material.uniforms.t2D.value=v,h.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,h.material.toneMapped=nt.getTransfer(v.colorSpace)!==mt,v.matrixAutoUpdate===!0&&v.updateMatrix(),h.material.uniforms.uvTransform.value.copy(v.matrix),(u!==v||d!==v.version||m!==i.toneMapping)&&(h.material.needsUpdate=!0,u=v,d=v.version,m=i.toneMapping),h.layers.enableAll(),w.unshift(h,h.geometry,h.material,0,0,null))}function f(w,S){w.getRGB(So,jf(i)),n.buffers.color.setClear(So.r,So.g,So.b,S,a)}return{getClearColor:function(){return o},setClearColor:function(w,S=1){o.set(w),l=S,f(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(w){l=w,f(o,l)},render:x,addToRenderList:p}}function ey(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null),r=s,a=!1;function o(_,L,N,P,F){let H=!1,O=u(P,N,L);r!==O&&(r=O,h(r.object)),H=m(_,P,N,F),H&&g(_,P,N,F),F!==null&&e.update(F,i.ELEMENT_ARRAY_BUFFER),(H||a)&&(a=!1,v(_,L,N,P),F!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(F).buffer))}function l(){return i.createVertexArray()}function h(_){return i.bindVertexArray(_)}function c(_){return i.deleteVertexArray(_)}function u(_,L,N){let P=N.wireframe===!0,F=n[_.id];F===void 0&&(F={},n[_.id]=F);let H=F[L.id];H===void 0&&(H={},F[L.id]=H);let O=H[P];return O===void 0&&(O=d(l()),H[P]=O),O}function d(_){let L=[],N=[],P=[];for(let F=0;F<t;F++)L[F]=0,N[F]=0,P[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:L,enabledAttributes:N,attributeDivisors:P,object:_,attributes:{},index:null}}function m(_,L,N,P){let F=r.attributes,H=L.attributes,O=0,Z=N.getAttributes();for(let G in Z)if(Z[G].location>=0){let ee=F[G],me=H[G];if(me===void 0&&(G==="instanceMatrix"&&_.instanceMatrix&&(me=_.instanceMatrix),G==="instanceColor"&&_.instanceColor&&(me=_.instanceColor)),ee===void 0||ee.attribute!==me||me&&ee.data!==me.data)return!0;O++}return r.attributesNum!==O||r.index!==P}function g(_,L,N,P){let F={},H=L.attributes,O=0,Z=N.getAttributes();for(let G in Z)if(Z[G].location>=0){let ee=H[G];ee===void 0&&(G==="instanceMatrix"&&_.instanceMatrix&&(ee=_.instanceMatrix),G==="instanceColor"&&_.instanceColor&&(ee=_.instanceColor));let me={};me.attribute=ee,ee&&ee.data&&(me.data=ee.data),F[G]=me,O++}r.attributes=F,r.attributesNum=O,r.index=P}function x(){let _=r.newAttributes;for(let L=0,N=_.length;L<N;L++)_[L]=0}function p(_){f(_,0)}function f(_,L){let N=r.newAttributes,P=r.enabledAttributes,F=r.attributeDivisors;N[_]=1,P[_]===0&&(i.enableVertexAttribArray(_),P[_]=1),F[_]!==L&&(i.vertexAttribDivisor(_,L),F[_]=L)}function w(){let _=r.newAttributes,L=r.enabledAttributes;for(let N=0,P=L.length;N<P;N++)L[N]!==_[N]&&(i.disableVertexAttribArray(N),L[N]=0)}function S(_,L,N,P,F,H,O){O===!0?i.vertexAttribIPointer(_,L,N,F,H):i.vertexAttribPointer(_,L,N,P,F,H)}function v(_,L,N,P){x();let F=P.attributes,H=N.getAttributes(),O=L.defaultAttributeValues;for(let Z in H){let G=H[Z];if(G.location>=0){let ae=F[Z];if(ae===void 0&&(Z==="instanceMatrix"&&_.instanceMatrix&&(ae=_.instanceMatrix),Z==="instanceColor"&&_.instanceColor&&(ae=_.instanceColor)),ae!==void 0){let ee=ae.normalized,me=ae.itemSize,ke=e.get(ae);if(ke===void 0)continue;let ot=ke.buffer,X=ke.type,ie=ke.bytesPerElement,Se=X===i.INT||X===i.UNSIGNED_INT||ae.gpuType===su;if(ae.isInterleavedBufferAttribute){let he=ae.data,Pe=he.stride,Fe=ae.offset;if(he.isInstancedInterleavedBuffer){for(let qe=0;qe<G.locationSize;qe++)f(G.location+qe,he.meshPerAttribute);_.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=he.meshPerAttribute*he.count)}else for(let qe=0;qe<G.locationSize;qe++)p(G.location+qe);i.bindBuffer(i.ARRAY_BUFFER,ot);for(let qe=0;qe<G.locationSize;qe++)S(G.location+qe,me/G.locationSize,X,ee,Pe*ie,(Fe+me/G.locationSize*qe)*ie,Se)}else{if(ae.isInstancedBufferAttribute){for(let he=0;he<G.locationSize;he++)f(G.location+he,ae.meshPerAttribute);_.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=ae.meshPerAttribute*ae.count)}else for(let he=0;he<G.locationSize;he++)p(G.location+he);i.bindBuffer(i.ARRAY_BUFFER,ot);for(let he=0;he<G.locationSize;he++)S(G.location+he,me/G.locationSize,X,ee,me*ie,me/G.locationSize*he*ie,Se)}}else if(O!==void 0){let ee=O[Z];if(ee!==void 0)switch(ee.length){case 2:i.vertexAttrib2fv(G.location,ee);break;case 3:i.vertexAttrib3fv(G.location,ee);break;case 4:i.vertexAttrib4fv(G.location,ee);break;default:i.vertexAttrib1fv(G.location,ee)}}}}w()}function I(){C();for(let _ in n){let L=n[_];for(let N in L){let P=L[N];for(let F in P)c(P[F].object),delete P[F];delete L[N]}delete n[_]}}function R(_){if(n[_.id]===void 0)return;let L=n[_.id];for(let N in L){let P=L[N];for(let F in P)c(P[F].object),delete P[F];delete L[N]}delete n[_.id]}function T(_){for(let L in n){let N=n[L];if(N[_.id]===void 0)continue;let P=N[_.id];for(let F in P)c(P[F].object),delete P[F];delete N[_.id]}}function C(){y(),a=!0,r!==s&&(r=s,h(r.object))}function y(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:C,resetDefaultState:y,dispose:I,releaseStatesOfGeometry:R,releaseStatesOfProgram:T,initAttributes:x,enableAttribute:p,disableUnusedAttributes:w}}function ty(i,e,t){let n;function s(h){n=h}function r(h,c){i.drawArrays(n,h,c),t.update(c,n,1)}function a(h,c,u){u!==0&&(i.drawArraysInstanced(n,h,c,u),t.update(c,n,u))}function o(h,c,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,h,0,c,0,u);let m=0;for(let g=0;g<u;g++)m+=c[g];t.update(m,n,1)}function l(h,c,u,d){if(u===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<h.length;g++)a(h[g],c[g],d[g]);else{m.multiDrawArraysInstancedWEBGL(n,h,0,c,0,d,0,u);let g=0;for(let x=0;x<u;x++)g+=c[x]*d[x];t.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function ny(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let T=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(T){return!(T!==Xn&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(T){let C=T===Ma&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(T!==Li&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==ci&&!C)}function l(T){if(T==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=t.precision!==void 0?t.precision:"highp",c=l(h);c!==h&&(console.warn("THREE.WebGLRenderer:",h,"not supported, using",c,"instead."),h=c);let u=t.logarithmicDepthBuffer===!0,d=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),f=i.getParameter(i.MAX_VERTEX_ATTRIBS),w=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),S=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),I=g>0,R=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:h,logarithmicDepthBuffer:u,reverseDepthBuffer:d,maxTextures:m,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:p,maxAttributes:f,maxVertexUniforms:w,maxVaryings:S,maxFragmentUniforms:v,vertexTextures:I,maxSamples:R}}function iy(i){let e=this,t=null,n=0,s=!1,r=!1,a=new Ri,o=new Ue,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let m=u.length!==0||d||n!==0||s;return s=d,n=u.length,m},this.beginShadows=function(){r=!0,c(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=c(u,d,0)},this.setState=function(u,d,m){let g=u.clippingPlanes,x=u.clipIntersection,p=u.clipShadows,f=i.get(u);if(!s||g===null||g.length===0||r&&!p)r?c(null):h();else{let w=r?0:n,S=w*4,v=f.clippingState||null;l.value=v,v=c(g,d,S,m);for(let I=0;I!==S;++I)v[I]=t[I];f.clippingState=v,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=w}};function h(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function c(u,d,m,g){let x=u!==null?u.length:0,p=null;if(x!==0){if(p=l.value,g!==!0||p===null){let f=m+x*4,w=d.matrixWorldInverse;o.getNormalMatrix(w),(p===null||p.length<f)&&(p=new Float32Array(f));for(let S=0,v=m;S!==x;++S,v+=4)a.copy(u[S]).applyMatrix4(w,o),a.normal.toArray(p,v),p[v+3]=a.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,p}}function sy(i){let e=new WeakMap;function t(a,o){return o===Kc?a.mapping=br:o===Zc&&(a.mapping=Mr),a}function n(a){if(a&&a.isTexture){let o=a.mapping;if(o===Kc||o===Zc)if(e.has(a)){let l=e.get(a).texture;return t(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let h=new Lh(l.height);return h.fromEquirectangularTexture(i,a),e.set(a,h),a.addEventListener("dispose",s),t(h.texture,a.mapping)}else return null}}return a}function s(a){let o=a.target;o.removeEventListener("dispose",s);let l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var Go=class extends Ho{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,a=n+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let h=(this.right-this.left)/this.view.fullWidth/this.zoom,c=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=h*this.view.offsetX,a=r+h*this.view.width,o-=c*this.view.offsetY,l=o-c*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},mr=4,hf=[.125,.215,.35,.446,.526,.582],Es=20,Lc=new Go,uf=new le,Dc=null,Nc=0,Uc=0,kc=!1,Ss=(1+Math.sqrt(5))/2,fr=1/Ss,df=[new D(-Ss,fr,0),new D(Ss,fr,0),new D(-fr,0,Ss),new D(fr,0,Ss),new D(0,Ss,-fr),new D(0,Ss,fr),new D(-1,1,-1),new D(1,1,-1),new D(-1,1,1),new D(1,1,1)],Wo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100){Dc=this._renderer.getRenderTarget(),Nc=this._renderer.getActiveCubeFace(),Uc=this._renderer.getActiveMipmapLevel(),kc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,s,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=mf(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=pf(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Dc,Nc,Uc),this._renderer.xr.enabled=kc,e.scissorTest=!1,Ao(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===br||e.mapping===Mr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Dc=this._renderer.getRenderTarget(),Nc=this._renderer.getActiveCubeFace(),Uc=this._renderer.getActiveMipmapLevel(),kc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:li,minFilter:li,generateMipmaps:!1,type:Ma,format:Xn,colorSpace:Ir,depthBuffer:!1},s=ff(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ff(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=ry(r)),this._blurMaterial=ay(r,e,t)}return s}_compileMaterial(e){let t=new yt(this._lodPlanes[0],e);this._renderer.compile(t,Lc)}_sceneToCubeUV(e,t,n,s){let o=new Zt(90,1,t,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],c=this._renderer,u=c.autoClear,d=c.toneMapping;c.getClearColor(uf),c.toneMapping=ns,c.autoClear=!1;let m=new Jt({name:"PMREM.Background",side:gn,depthWrite:!1,depthTest:!1}),g=new yt(new Ui,m),x=!1,p=e.background;p?p.isColor&&(m.color.copy(p),e.background=null,x=!0):(m.color.copy(uf),x=!0);for(let f=0;f<6;f++){let w=f%3;w===0?(o.up.set(0,l[f],0),o.lookAt(h[f],0,0)):w===1?(o.up.set(0,0,l[f]),o.lookAt(0,h[f],0)):(o.up.set(0,l[f],0),o.lookAt(0,0,h[f]));let S=this._cubeSize;Ao(s,w*S,f>2?S:0,S,S),c.setRenderTarget(s),x&&c.render(g,o),c.render(e,o)}g.geometry.dispose(),g.material.dispose(),c.toneMapping=d,c.autoClear=u,e.background=p}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===br||e.mapping===Mr;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=mf()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=pf());let r=s?this._cubemapMaterial:this._equirectMaterial,a=new yt(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=e;let l=this._cubeSize;Ao(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,Lc)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=df[(s-r-1)%df.length];this._blur(e,r-1,r,a,o)}t.autoClear=n}_blur(e,t,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,s,"latitudinal",r),this._halfBlur(a,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,a,o){let l=this._renderer,h=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let c=3,u=new yt(this._lodPlanes[s],h),d=h.uniforms,m=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*Es-1),x=r/g,p=isFinite(r)?1+Math.floor(c*x):Es;p>Es&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Es}`);let f=[],w=0;for(let T=0;T<Es;++T){let C=T/x,y=Math.exp(-C*C/2);f.push(y),T===0?w+=y:T<p&&(w+=2*y)}for(let T=0;T<f.length;T++)f[T]=f[T]/w;d.envMap.value=e.texture,d.samples.value=p,d.weights.value=f,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);let{_lodMax:S}=this;d.dTheta.value=g,d.mipInt.value=S-n;let v=this._sizeLods[s],I=3*v*(s>S-mr?s-S+mr:0),R=4*(this._cubeSize-v);Ao(t,I,R,3*v,2*v),l.setRenderTarget(t),l.render(u,Lc)}};function ry(i){let e=[],t=[],n=[],s=i,r=i-mr+1+hf.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);t.push(o);let l=1/o;a>i-mr?l=hf[a-i+mr-1]:a===0&&(l=0),n.push(l);let h=1/(o-2),c=-h,u=1+h,d=[c,c,u,c,u,u,c,c,u,u,c,u],m=6,g=6,x=3,p=2,f=1,w=new Float32Array(x*g*m),S=new Float32Array(p*g*m),v=new Float32Array(f*g*m);for(let R=0;R<m;R++){let T=R%3*2/3-1,C=R>2?0:-1,y=[T,C,0,T+2/3,C,0,T+2/3,C+1,0,T,C,0,T+2/3,C+1,0,T,C+1,0];w.set(y,x*g*R),S.set(d,p*g*R);let _=[R,R,R,R,R,R];v.set(_,f*g*R)}let I=new en;I.setAttribute("position",new wn(w,x)),I.setAttribute("uv",new wn(S,p)),I.setAttribute("faceIndex",new wn(v,f)),e.push(I),s>mr&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function ff(i,e,t){let n=new Di(i,e,t);return n.texture.mapping=nl,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ao(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function ay(i,e,t){let n=new Float32Array(Es),s=new D(0,1,0);return new hi({name:"SphericalGaussianBlur",defines:{n:Es,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:du(),fragmentShader:`

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
		`,blending:ts,depthTest:!1,depthWrite:!1})}function pf(){return new hi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:du(),fragmentShader:`

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
		`,blending:ts,depthTest:!1,depthWrite:!1})}function mf(){return new hi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:du(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ts,depthTest:!1,depthWrite:!1})}function du(){return`

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
	`}function oy(i){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){let l=o.mapping,h=l===Kc||l===Zc,c=l===br||l===Mr;if(h||c){let u=e.get(o),d=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==d)return t===null&&(t=new Wo(i)),u=h?t.fromEquirectangular(o,u):t.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),u.texture;if(u!==void 0)return u.texture;{let m=o.image;return h&&m&&m.height>0||c&&m&&s(m)?(t===null&&(t=new Wo(i)),u=h?t.fromEquirectangular(o):t.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),o.addEventListener("dispose",r),u.texture):null}}}return o}function s(o){let l=0,h=6;for(let c=0;c<h;c++)o[c]!==void 0&&l++;return l===h}function r(o){let l=o.target;l.removeEventListener("dispose",r);let h=e.get(l);h!==void 0&&(e.delete(l),h.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function ly(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&pa("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function cy(i,e,t,n){let s={},r=new WeakMap;function a(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let g in d.attributes)e.remove(d.attributes[g]);for(let g in d.morphAttributes){let x=d.morphAttributes[g];for(let p=0,f=x.length;p<f;p++)e.remove(x[p])}d.removeEventListener("dispose",a),delete s[d.id];let m=r.get(d);m&&(e.remove(m),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(u,d){return s[d.id]===!0||(d.addEventListener("dispose",a),s[d.id]=!0,t.memory.geometries++),d}function l(u){let d=u.attributes;for(let g in d)e.update(d[g],i.ARRAY_BUFFER);let m=u.morphAttributes;for(let g in m){let x=m[g];for(let p=0,f=x.length;p<f;p++)e.update(x[p],i.ARRAY_BUFFER)}}function h(u){let d=[],m=u.index,g=u.attributes.position,x=0;if(m!==null){let w=m.array;x=m.version;for(let S=0,v=w.length;S<v;S+=3){let I=w[S+0],R=w[S+1],T=w[S+2];d.push(I,R,R,T,T,I)}}else if(g!==void 0){let w=g.array;x=g.version;for(let S=0,v=w.length/3-1;S<v;S+=3){let I=S+0,R=S+1,T=S+2;d.push(I,R,R,T,T,I)}}else return;let p=new(Zf(d)?zo:Ar)(d,1);p.version=x;let f=r.get(u);f&&e.remove(f),r.set(u,p)}function c(u){let d=r.get(u);if(d){let m=u.index;m!==null&&d.version<m.version&&h(u)}else h(u);return r.get(u)}return{get:o,update:l,getWireframeAttribute:c}}function hy(i,e,t){let n;function s(d){n=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function l(d,m){i.drawElements(n,m,r,d*a),t.update(m,n,1)}function h(d,m,g){g!==0&&(i.drawElementsInstanced(n,m,r,d*a,g),t.update(m,n,g))}function c(d,m,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,m,0,r,d,0,g);let p=0;for(let f=0;f<g;f++)p+=m[f];t.update(p,n,1)}function u(d,m,g,x){if(g===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let f=0;f<d.length;f++)h(d[f]/a,m[f],x[f]);else{p.multiDrawElementsInstancedWEBGL(n,m,0,r,d,0,x,0,g);let f=0;for(let w=0;w<g;w++)f+=m[w]*x[w];t.update(f,n,1)}}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=h,this.renderMultiDraw=c,this.renderMultiDrawInstances=u}function uy(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function dy(i,e,t){let n=new WeakMap,s=new gt;function r(a,o,l){let h=a.morphTargetInfluences,c=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=c!==void 0?c.length:0,d=n.get(o);if(d===void 0||d.count!==u){let y=function(){T.dispose(),n.delete(o),o.removeEventListener("dispose",y)};d!==void 0&&d.texture.dispose();let m=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,x=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],f=o.morphAttributes.normal||[],w=o.morphAttributes.color||[],S=0;m===!0&&(S=1),g===!0&&(S=2),x===!0&&(S=3);let v=o.attributes.position.count*S,I=1;v>e.maxTextureSize&&(I=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);let R=new Float32Array(v*I*4*u),T=new Bo(R,v,I,u);T.type=ci,T.needsUpdate=!0;let C=S*4;for(let _=0;_<u;_++){let L=p[_],N=f[_],P=w[_],F=v*I*4*_;for(let H=0;H<L.count;H++){let O=H*C;m===!0&&(s.fromBufferAttribute(L,H),R[F+O+0]=s.x,R[F+O+1]=s.y,R[F+O+2]=s.z,R[F+O+3]=0),g===!0&&(s.fromBufferAttribute(N,H),R[F+O+4]=s.x,R[F+O+5]=s.y,R[F+O+6]=s.z,R[F+O+7]=0),x===!0&&(s.fromBufferAttribute(P,H),R[F+O+8]=s.x,R[F+O+9]=s.y,R[F+O+10]=s.z,R[F+O+11]=P.itemSize===4?s.w:1)}}d={count:u,texture:T,size:new $e(v,I)},n.set(o,d),o.addEventListener("dispose",y)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let m=0;for(let x=0;x<h.length;x++)m+=h[x];let g=o.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",h)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function fy(i,e,t,n){let s=new WeakMap;function r(l){let h=n.render.frame,c=l.geometry,u=e.get(l,c);if(s.get(u)!==h&&(e.update(u),s.set(u,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==h&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,h))),l.isSkinnedMesh){let d=l.skeleton;s.get(d)!==h&&(d.update(),s.set(d,h))}return u}function a(){s=new WeakMap}function o(l){let h=l.target;h.removeEventListener("dispose",o),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:r,dispose:a}}var qo=class extends Sn{constructor(e,t,n,s,r,a,o,l,h,c=xr){if(c!==xr&&c!==Sr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&c===xr&&(n=Is),n===void 0&&c===Sr&&(n=wr),super(null,s,r,a,o,l,c,n,h),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:Mn,this.minFilter=l!==void 0?l:Mn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},ep=new Sn,gf=new qo(1,1),tp=new Bo,np=new Rh,ip=new Vo,xf=[],vf=[],yf=new Float32Array(16),_f=new Float32Array(9),bf=new Float32Array(4);function Lr(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=xf[s];if(r===void 0&&(r=new Float32Array(s),xf[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function Gt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Wt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function sl(i,e){let t=vf[e];t===void 0&&(t=new Int32Array(e),vf[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function py(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function my(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Gt(t,e))return;i.uniform2fv(this.addr,e),Wt(t,e)}}function gy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Gt(t,e))return;i.uniform3fv(this.addr,e),Wt(t,e)}}function xy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Gt(t,e))return;i.uniform4fv(this.addr,e),Wt(t,e)}}function vy(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Gt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Wt(t,e)}else{if(Gt(t,n))return;bf.set(n),i.uniformMatrix2fv(this.addr,!1,bf),Wt(t,n)}}function yy(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Gt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Wt(t,e)}else{if(Gt(t,n))return;_f.set(n),i.uniformMatrix3fv(this.addr,!1,_f),Wt(t,n)}}function _y(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Gt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Wt(t,e)}else{if(Gt(t,n))return;yf.set(n),i.uniformMatrix4fv(this.addr,!1,yf),Wt(t,n)}}function by(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function My(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Gt(t,e))return;i.uniform2iv(this.addr,e),Wt(t,e)}}function wy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Gt(t,e))return;i.uniform3iv(this.addr,e),Wt(t,e)}}function Sy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Gt(t,e))return;i.uniform4iv(this.addr,e),Wt(t,e)}}function Ay(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Ty(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Gt(t,e))return;i.uniform2uiv(this.addr,e),Wt(t,e)}}function Ey(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Gt(t,e))return;i.uniform3uiv(this.addr,e),Wt(t,e)}}function Cy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Gt(t,e))return;i.uniform4uiv(this.addr,e),Wt(t,e)}}function Ry(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(gf.compareFunction=Kf,r=gf):r=ep,t.setTexture2D(e||r,s)}function Py(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||np,s)}function Iy(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||ip,s)}function Ly(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||tp,s)}function Dy(i){switch(i){case 5126:return py;case 35664:return my;case 35665:return gy;case 35666:return xy;case 35674:return vy;case 35675:return yy;case 35676:return _y;case 5124:case 35670:return by;case 35667:case 35671:return My;case 35668:case 35672:return wy;case 35669:case 35673:return Sy;case 5125:return Ay;case 36294:return Ty;case 36295:return Ey;case 36296:return Cy;case 35678:case 36198:case 36298:case 36306:case 35682:return Ry;case 35679:case 36299:case 36307:return Py;case 35680:case 36300:case 36308:case 36293:return Iy;case 36289:case 36303:case 36311:case 36292:return Ly}}function Ny(i,e){i.uniform1fv(this.addr,e)}function Uy(i,e){let t=Lr(e,this.size,2);i.uniform2fv(this.addr,t)}function ky(i,e){let t=Lr(e,this.size,3);i.uniform3fv(this.addr,t)}function Fy(i,e){let t=Lr(e,this.size,4);i.uniform4fv(this.addr,t)}function By(i,e){let t=Lr(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Oy(i,e){let t=Lr(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function zy(i,e){let t=Lr(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Hy(i,e){i.uniform1iv(this.addr,e)}function Vy(i,e){i.uniform2iv(this.addr,e)}function Gy(i,e){i.uniform3iv(this.addr,e)}function Wy(i,e){i.uniform4iv(this.addr,e)}function qy(i,e){i.uniform1uiv(this.addr,e)}function $y(i,e){i.uniform2uiv(this.addr,e)}function Xy(i,e){i.uniform3uiv(this.addr,e)}function Yy(i,e){i.uniform4uiv(this.addr,e)}function Ky(i,e,t){let n=this.cache,s=e.length,r=sl(t,s);Gt(n,r)||(i.uniform1iv(this.addr,r),Wt(n,r));for(let a=0;a!==s;++a)t.setTexture2D(e[a]||ep,r[a])}function Zy(i,e,t){let n=this.cache,s=e.length,r=sl(t,s);Gt(n,r)||(i.uniform1iv(this.addr,r),Wt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||np,r[a])}function Jy(i,e,t){let n=this.cache,s=e.length,r=sl(t,s);Gt(n,r)||(i.uniform1iv(this.addr,r),Wt(n,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||ip,r[a])}function jy(i,e,t){let n=this.cache,s=e.length,r=sl(t,s);Gt(n,r)||(i.uniform1iv(this.addr,r),Wt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||tp,r[a])}function Qy(i){switch(i){case 5126:return Ny;case 35664:return Uy;case 35665:return ky;case 35666:return Fy;case 35674:return By;case 35675:return Oy;case 35676:return zy;case 5124:case 35670:return Hy;case 35667:case 35671:return Vy;case 35668:case 35672:return Gy;case 35669:case 35673:return Wy;case 5125:return qy;case 36294:return $y;case 36295:return Xy;case 36296:return Yy;case 35678:case 36198:case 36298:case 36306:case 35682:return Ky;case 35679:case 36299:case 36307:return Zy;case 35680:case 36300:case 36308:case 36293:return Jy;case 36289:case 36303:case 36311:case 36292:return jy}}var Dh=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Dy(t.type)}},Nh=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Qy(t.type)}},Uh=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],n)}}},Fc=/(\w+)(\])?(\[|\.)?/g;function Mf(i,e){i.seq.push(e),i.map[e.id]=e}function e_(i,e,t){let n=i.name,s=n.length;for(Fc.lastIndex=0;;){let r=Fc.exec(n),a=Fc.lastIndex,o=r[1],l=r[2]==="]",h=r[3];if(l&&(o=o|0),h===void 0||h==="["&&a+2===s){Mf(t,h===void 0?new Dh(o,i,e):new Nh(o,i,e));break}else{let u=t.map[o];u===void 0&&(u=new Uh(o),Mf(t,u)),t=u}}}var yr=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=e.getActiveUniform(t,s),a=e.getUniformLocation(t,r.name);e_(r,a,this)}}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&n.push(a)}return n}};function wf(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var t_=37297,n_=0;function i_(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}var Sf=new Ue;function s_(i){nt._getMatrix(Sf,nt.workingColorSpace,i);let e=`mat3( ${Sf.elements.map(t=>t.toFixed(4))} )`;switch(nt.getTransfer(i)){case il:return[e,"LinearTransferOETF"];case mt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Af(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),s=i.getShaderInfoLog(e).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let a=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+i_(i.getShaderSource(e),a)}else return s}function r_(i,e){let t=s_(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function a_(i,e){let t;switch(e){case Lg:t="Linear";break;case Dg:t="Reinhard";break;case Ng:t="Cineon";break;case Ug:t="ACESFilmic";break;case Fg:t="AgX";break;case ba:t="Neutral";break;case kg:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var To=new D;function o_(){nt.getLuminanceCoefficients(To);let i=To.x.toFixed(4),e=To.y.toFixed(4),t=To.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function l_(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ma).join(`
`)}function c_(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function h_(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function ma(i){return i!==""}function Tf(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Ef(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var u_=/^[ \t]*#include +<([\w\d./]+)>/gm;function kh(i){return i.replace(u_,f_)}var d_=new Map;function f_(i,e){let t=He[e];if(t===void 0){let n=d_.get(e);if(n!==void 0)t=He[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return kh(t)}var p_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Cf(i){return i.replace(p_,m_)}function m_(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Rf(i){let e=`precision ${i.precision} float;
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
#define LOW_PRECISION`),e}function g_(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===el?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===iu?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Ci&&(e="SHADOWMAP_TYPE_VSM"),e}function x_(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case br:case Mr:e="ENVMAP_TYPE_CUBE";break;case nl:e="ENVMAP_TYPE_CUBE_UV";break}return e}function v_(i){let e="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===Mr&&(e="ENVMAP_MODE_REFRACTION"),e}function y_(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case tl:e="ENVMAP_BLENDING_MULTIPLY";break;case Pg:e="ENVMAP_BLENDING_MIX";break;case Ig:e="ENVMAP_BLENDING_ADD";break}return e}function __(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function b_(i,e,t,n){let s=i.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=g_(t),h=x_(t),c=v_(t),u=y_(t),d=__(t),m=l_(t),g=c_(r),x=s.createProgram(),p,f,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ma).join(`
`),p.length>0&&(p+=`
`),f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ma).join(`
`),f.length>0&&(f+=`
`)):(p=[Rf(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ma).join(`
`),f=[Rf(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==ns?"#define TONE_MAPPING":"",t.toneMapping!==ns?He.tonemapping_pars_fragment:"",t.toneMapping!==ns?a_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",He.colorspace_pars_fragment,r_("linearToOutputTexel",t.outputColorSpace),o_(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ma).join(`
`)),a=kh(a),a=Tf(a,t),a=Ef(a,t),o=kh(o),o=Tf(o,t),o=Ef(o,t),a=Cf(a),o=Cf(o),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,f=["#define varying in",t.glslVersion===Vd?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Vd?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let S=w+p+a,v=w+f+o,I=wf(s,s.VERTEX_SHADER,S),R=wf(s,s.FRAGMENT_SHADER,v);s.attachShader(x,I),s.attachShader(x,R),t.index0AttributeName!==void 0?s.bindAttribLocation(x,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function T(L){if(i.debug.checkShaderErrors){let N=s.getProgramInfoLog(x).trim(),P=s.getShaderInfoLog(I).trim(),F=s.getShaderInfoLog(R).trim(),H=!0,O=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(H=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,I,R);else{let Z=Af(s,I,"vertex"),G=Af(s,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+L.name+`
Material Type: `+L.type+`

Program Info Log: `+N+`
`+Z+`
`+G)}else N!==""?console.warn("THREE.WebGLProgram: Program Info Log:",N):(P===""||F==="")&&(O=!1);O&&(L.diagnostics={runnable:H,programLog:N,vertexShader:{log:P,prefix:p},fragmentShader:{log:F,prefix:f}})}s.deleteShader(I),s.deleteShader(R),C=new yr(s,x),y=h_(s,x)}let C;this.getUniforms=function(){return C===void 0&&T(this),C};let y;this.getAttributes=function(){return y===void 0&&T(this),y};let _=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return _===!1&&(_=s.getProgramParameter(x,t_)),_},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=n_++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=I,this.fragmentShader=R,this}var M_=0,Fh=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Bh(e),t.set(e,n)),n}},Bh=class{constructor(e){this.id=M_++,this.code=e,this.usedTimes=0}};function w_(i,e,t,n,s,r,a){let o=new Oo,l=new Fh,h=new Set,c=[],u=s.logarithmicDepthBuffer,d=s.vertexTextures,m=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(y){return h.add(y),y===0?"uv":`uv${y}`}function p(y,_,L,N,P){let F=N.fog,H=P.geometry,O=y.isMeshStandardMaterial?N.environment:null,Z=(y.isMeshStandardMaterial?t:e).get(y.envMap||O),G=Z&&Z.mapping===nl?Z.image.height:null,ae=g[y.type];y.precision!==null&&(m=s.getMaxPrecision(y.precision),m!==y.precision&&console.warn("THREE.WebGLProgram.getParameters:",y.precision,"not supported, using",m,"instead."));let ee=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,me=ee!==void 0?ee.length:0,ke=0;H.morphAttributes.position!==void 0&&(ke=1),H.morphAttributes.normal!==void 0&&(ke=2),H.morphAttributes.color!==void 0&&(ke=3);let ot,X,ie,Se;if(ae){let ft=oi[ae];ot=ft.vertexShader,X=ft.fragmentShader}else ot=y.vertexShader,X=y.fragmentShader,l.update(y),ie=l.getVertexShaderID(y),Se=l.getFragmentShaderID(y);let he=i.getRenderTarget(),Pe=i.state.buffers.depth.getReversed(),Fe=P.isInstancedMesh===!0,qe=P.isBatchedMesh===!0,Lt=!!y.map,et=!!y.matcap,Ut=!!Z,z=!!y.aoMap,Rn=!!y.lightMap,Je=!!y.bumpMap,je=!!y.normalMap,Ce=!!y.displacementMap,St=!!y.emissiveMap,Ee=!!y.metalnessMap,E=!!y.roughnessMap,b=y.anisotropy>0,V=y.clearcoat>0,J=y.dispersion>0,Q=y.iridescence>0,K=y.sheen>0,Ae=y.transmission>0,ue=b&&!!y.anisotropyMap,ge=V&&!!y.clearcoatMap,tt=V&&!!y.clearcoatNormalMap,te=V&&!!y.clearcoatRoughnessMap,ve=Q&&!!y.iridescenceMap,Re=Q&&!!y.iridescenceThicknessMap,De=K&&!!y.sheenColorMap,ye=K&&!!y.sheenRoughnessMap,Qe=!!y.specularMap,ze=!!y.specularColorMap,bt=!!y.specularIntensityMap,U=Ae&&!!y.transmissionMap,ce=Ae&&!!y.thicknessMap,$=!!y.gradientMap,j=!!y.alphaMap,pe=y.alphaTest>0,de=!!y.alphaHash,Be=!!y.extensions,Nt=ns;y.toneMapped&&(he===null||he.isXRRenderTarget===!0)&&(Nt=i.toneMapping);let nn={shaderID:ae,shaderType:y.type,shaderName:y.name,vertexShader:ot,fragmentShader:X,defines:y.defines,customVertexShaderID:ie,customFragmentShaderID:Se,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:m,batching:qe,batchingColor:qe&&P._colorsTexture!==null,instancing:Fe,instancingColor:Fe&&P.instanceColor!==null,instancingMorph:Fe&&P.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:he===null?i.outputColorSpace:he.isXRRenderTarget===!0?he.texture.colorSpace:Ir,alphaToCoverage:!!y.alphaToCoverage,map:Lt,matcap:et,envMap:Ut,envMapMode:Ut&&Z.mapping,envMapCubeUVHeight:G,aoMap:z,lightMap:Rn,bumpMap:Je,normalMap:je,displacementMap:d&&Ce,emissiveMap:St,normalMapObjectSpace:je&&y.normalMapType===Hg,normalMapTangentSpace:je&&y.normalMapType===uu,metalnessMap:Ee,roughnessMap:E,anisotropy:b,anisotropyMap:ue,clearcoat:V,clearcoatMap:ge,clearcoatNormalMap:tt,clearcoatRoughnessMap:te,dispersion:J,iridescence:Q,iridescenceMap:ve,iridescenceThicknessMap:Re,sheen:K,sheenColorMap:De,sheenRoughnessMap:ye,specularMap:Qe,specularColorMap:ze,specularIntensityMap:bt,transmission:Ae,transmissionMap:U,thicknessMap:ce,gradientMap:$,opaque:y.transparent===!1&&y.blending===gr&&y.alphaToCoverage===!1,alphaMap:j,alphaTest:pe,alphaHash:de,combine:y.combine,mapUv:Lt&&x(y.map.channel),aoMapUv:z&&x(y.aoMap.channel),lightMapUv:Rn&&x(y.lightMap.channel),bumpMapUv:Je&&x(y.bumpMap.channel),normalMapUv:je&&x(y.normalMap.channel),displacementMapUv:Ce&&x(y.displacementMap.channel),emissiveMapUv:St&&x(y.emissiveMap.channel),metalnessMapUv:Ee&&x(y.metalnessMap.channel),roughnessMapUv:E&&x(y.roughnessMap.channel),anisotropyMapUv:ue&&x(y.anisotropyMap.channel),clearcoatMapUv:ge&&x(y.clearcoatMap.channel),clearcoatNormalMapUv:tt&&x(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:te&&x(y.clearcoatRoughnessMap.channel),iridescenceMapUv:ve&&x(y.iridescenceMap.channel),iridescenceThicknessMapUv:Re&&x(y.iridescenceThicknessMap.channel),sheenColorMapUv:De&&x(y.sheenColorMap.channel),sheenRoughnessMapUv:ye&&x(y.sheenRoughnessMap.channel),specularMapUv:Qe&&x(y.specularMap.channel),specularColorMapUv:ze&&x(y.specularColorMap.channel),specularIntensityMapUv:bt&&x(y.specularIntensityMap.channel),transmissionMapUv:U&&x(y.transmissionMap.channel),thicknessMapUv:ce&&x(y.thicknessMap.channel),alphaMapUv:j&&x(y.alphaMap.channel),vertexTangents:!!H.attributes.tangent&&(je||b),vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,pointsUvs:P.isPoints===!0&&!!H.attributes.uv&&(Lt||j),fog:!!F,useFog:y.fog===!0,fogExp2:!!F&&F.isFogExp2,flatShading:y.flatShading===!0,sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:Pe,skinning:P.isSkinnedMesh===!0,morphTargets:H.morphAttributes.position!==void 0,morphNormals:H.morphAttributes.normal!==void 0,morphColors:H.morphAttributes.color!==void 0,morphTargetsCount:me,morphTextureStride:ke,numDirLights:_.directional.length,numPointLights:_.point.length,numSpotLights:_.spot.length,numSpotLightMaps:_.spotLightMap.length,numRectAreaLights:_.rectArea.length,numHemiLights:_.hemi.length,numDirLightShadows:_.directionalShadowMap.length,numPointLightShadows:_.pointShadowMap.length,numSpotLightShadows:_.spotShadowMap.length,numSpotLightShadowsWithMaps:_.numSpotLightShadowsWithMaps,numLightProbes:_.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:y.dithering,shadowMapEnabled:i.shadowMap.enabled&&L.length>0,shadowMapType:i.shadowMap.type,toneMapping:Nt,decodeVideoTexture:Lt&&y.map.isVideoTexture===!0&&nt.getTransfer(y.map.colorSpace)===mt,decodeVideoTextureEmissive:St&&y.emissiveMap.isVideoTexture===!0&&nt.getTransfer(y.emissiveMap.colorSpace)===mt,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===Dn,flipSided:y.side===gn,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:Be&&y.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Be&&y.extensions.multiDraw===!0||qe)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return nn.vertexUv1s=h.has(1),nn.vertexUv2s=h.has(2),nn.vertexUv3s=h.has(3),h.clear(),nn}function f(y){let _=[];if(y.shaderID?_.push(y.shaderID):(_.push(y.customVertexShaderID),_.push(y.customFragmentShaderID)),y.defines!==void 0)for(let L in y.defines)_.push(L),_.push(y.defines[L]);return y.isRawShaderMaterial===!1&&(w(_,y),S(_,y),_.push(i.outputColorSpace)),_.push(y.customProgramCacheKey),_.join()}function w(y,_){y.push(_.precision),y.push(_.outputColorSpace),y.push(_.envMapMode),y.push(_.envMapCubeUVHeight),y.push(_.mapUv),y.push(_.alphaMapUv),y.push(_.lightMapUv),y.push(_.aoMapUv),y.push(_.bumpMapUv),y.push(_.normalMapUv),y.push(_.displacementMapUv),y.push(_.emissiveMapUv),y.push(_.metalnessMapUv),y.push(_.roughnessMapUv),y.push(_.anisotropyMapUv),y.push(_.clearcoatMapUv),y.push(_.clearcoatNormalMapUv),y.push(_.clearcoatRoughnessMapUv),y.push(_.iridescenceMapUv),y.push(_.iridescenceThicknessMapUv),y.push(_.sheenColorMapUv),y.push(_.sheenRoughnessMapUv),y.push(_.specularMapUv),y.push(_.specularColorMapUv),y.push(_.specularIntensityMapUv),y.push(_.transmissionMapUv),y.push(_.thicknessMapUv),y.push(_.combine),y.push(_.fogExp2),y.push(_.sizeAttenuation),y.push(_.morphTargetsCount),y.push(_.morphAttributeCount),y.push(_.numDirLights),y.push(_.numPointLights),y.push(_.numSpotLights),y.push(_.numSpotLightMaps),y.push(_.numHemiLights),y.push(_.numRectAreaLights),y.push(_.numDirLightShadows),y.push(_.numPointLightShadows),y.push(_.numSpotLightShadows),y.push(_.numSpotLightShadowsWithMaps),y.push(_.numLightProbes),y.push(_.shadowMapType),y.push(_.toneMapping),y.push(_.numClippingPlanes),y.push(_.numClipIntersection),y.push(_.depthPacking)}function S(y,_){o.disableAll(),_.supportsVertexTextures&&o.enable(0),_.instancing&&o.enable(1),_.instancingColor&&o.enable(2),_.instancingMorph&&o.enable(3),_.matcap&&o.enable(4),_.envMap&&o.enable(5),_.normalMapObjectSpace&&o.enable(6),_.normalMapTangentSpace&&o.enable(7),_.clearcoat&&o.enable(8),_.iridescence&&o.enable(9),_.alphaTest&&o.enable(10),_.vertexColors&&o.enable(11),_.vertexAlphas&&o.enable(12),_.vertexUv1s&&o.enable(13),_.vertexUv2s&&o.enable(14),_.vertexUv3s&&o.enable(15),_.vertexTangents&&o.enable(16),_.anisotropy&&o.enable(17),_.alphaHash&&o.enable(18),_.batching&&o.enable(19),_.dispersion&&o.enable(20),_.batchingColor&&o.enable(21),y.push(o.mask),o.disableAll(),_.fog&&o.enable(0),_.useFog&&o.enable(1),_.flatShading&&o.enable(2),_.logarithmicDepthBuffer&&o.enable(3),_.reverseDepthBuffer&&o.enable(4),_.skinning&&o.enable(5),_.morphTargets&&o.enable(6),_.morphNormals&&o.enable(7),_.morphColors&&o.enable(8),_.premultipliedAlpha&&o.enable(9),_.shadowMapEnabled&&o.enable(10),_.doubleSided&&o.enable(11),_.flipSided&&o.enable(12),_.useDepthPacking&&o.enable(13),_.dithering&&o.enable(14),_.transmission&&o.enable(15),_.sheen&&o.enable(16),_.opaque&&o.enable(17),_.pointsUvs&&o.enable(18),_.decodeVideoTexture&&o.enable(19),_.decodeVideoTextureEmissive&&o.enable(20),_.alphaToCoverage&&o.enable(21),y.push(o.mask)}function v(y){let _=g[y.type],L;if(_){let N=oi[_];L=f0.clone(N.uniforms)}else L=y.uniforms;return L}function I(y,_){let L;for(let N=0,P=c.length;N<P;N++){let F=c[N];if(F.cacheKey===_){L=F,++L.usedTimes;break}}return L===void 0&&(L=new b_(i,_,y,r),c.push(L)),L}function R(y){if(--y.usedTimes===0){let _=c.indexOf(y);c[_]=c[c.length-1],c.pop(),y.destroy()}}function T(y){l.remove(y)}function C(){l.dispose()}return{getParameters:p,getProgramCacheKey:f,getUniforms:v,acquireProgram:I,releaseProgram:R,releaseShaderCache:T,programs:c,dispose:C}}function S_(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function A_(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function Pf(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function If(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(u,d,m,g,x,p){let f=i[e];return f===void 0?(f={id:u.id,object:u,geometry:d,material:m,groupOrder:g,renderOrder:u.renderOrder,z:x,group:p},i[e]=f):(f.id=u.id,f.object=u,f.geometry=d,f.material=m,f.groupOrder=g,f.renderOrder=u.renderOrder,f.z=x,f.group=p),e++,f}function o(u,d,m,g,x,p){let f=a(u,d,m,g,x,p);m.transmission>0?n.push(f):m.transparent===!0?s.push(f):t.push(f)}function l(u,d,m,g,x,p){let f=a(u,d,m,g,x,p);m.transmission>0?n.unshift(f):m.transparent===!0?s.unshift(f):t.unshift(f)}function h(u,d){t.length>1&&t.sort(u||A_),n.length>1&&n.sort(d||Pf),s.length>1&&s.sort(d||Pf)}function c(){for(let u=e,d=i.length;u<d;u++){let m=i[u];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:o,unshift:l,finish:c,sort:h}}function T_(){let i=new WeakMap;function e(n,s){let r=i.get(n),a;return r===void 0?(a=new If,i.set(n,[a])):s>=r.length?(a=new If,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function E_(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new D,color:new le};break;case"SpotLight":t={position:new D,direction:new D,color:new le,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new D,color:new le,distance:0,decay:0};break;case"HemisphereLight":t={direction:new D,skyColor:new le,groundColor:new le};break;case"RectAreaLight":t={color:new le,position:new D,halfWidth:new D,halfHeight:new D};break}return i[e.id]=t,t}}}function C_(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $e};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $e};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $e,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var R_=0;function P_(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function I_(i){let e=new E_,t=C_(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)n.probe.push(new D);let s=new D,r=new Ve,a=new Ve;function o(h){let c=0,u=0,d=0;for(let y=0;y<9;y++)n.probe[y].set(0,0,0);let m=0,g=0,x=0,p=0,f=0,w=0,S=0,v=0,I=0,R=0,T=0;h.sort(P_);for(let y=0,_=h.length;y<_;y++){let L=h[y],N=L.color,P=L.intensity,F=L.distance,H=L.shadow&&L.shadow.map?L.shadow.map.texture:null;if(L.isAmbientLight)c+=N.r*P,u+=N.g*P,d+=N.b*P;else if(L.isLightProbe){for(let O=0;O<9;O++)n.probe[O].addScaledVector(L.sh.coefficients[O],P);T++}else if(L.isDirectionalLight){let O=e.get(L);if(O.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let Z=L.shadow,G=t.get(L);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,n.directionalShadow[m]=G,n.directionalShadowMap[m]=H,n.directionalShadowMatrix[m]=L.shadow.matrix,w++}n.directional[m]=O,m++}else if(L.isSpotLight){let O=e.get(L);O.position.setFromMatrixPosition(L.matrixWorld),O.color.copy(N).multiplyScalar(P),O.distance=F,O.coneCos=Math.cos(L.angle),O.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),O.decay=L.decay,n.spot[x]=O;let Z=L.shadow;if(L.map&&(n.spotLightMap[I]=L.map,I++,Z.updateMatrices(L),L.castShadow&&R++),n.spotLightMatrix[x]=Z.matrix,L.castShadow){let G=t.get(L);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,n.spotShadow[x]=G,n.spotShadowMap[x]=H,v++}x++}else if(L.isRectAreaLight){let O=e.get(L);O.color.copy(N).multiplyScalar(P),O.halfWidth.set(L.width*.5,0,0),O.halfHeight.set(0,L.height*.5,0),n.rectArea[p]=O,p++}else if(L.isPointLight){let O=e.get(L);if(O.color.copy(L.color).multiplyScalar(L.intensity),O.distance=L.distance,O.decay=L.decay,L.castShadow){let Z=L.shadow,G=t.get(L);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,G.shadowCameraNear=Z.camera.near,G.shadowCameraFar=Z.camera.far,n.pointShadow[g]=G,n.pointShadowMap[g]=H,n.pointShadowMatrix[g]=L.shadow.matrix,S++}n.point[g]=O,g++}else if(L.isHemisphereLight){let O=e.get(L);O.skyColor.copy(L.color).multiplyScalar(P),O.groundColor.copy(L.groundColor).multiplyScalar(P),n.hemi[f]=O,f++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=oe.LTC_FLOAT_1,n.rectAreaLTC2=oe.LTC_FLOAT_2):(n.rectAreaLTC1=oe.LTC_HALF_1,n.rectAreaLTC2=oe.LTC_HALF_2)),n.ambient[0]=c,n.ambient[1]=u,n.ambient[2]=d;let C=n.hash;(C.directionalLength!==m||C.pointLength!==g||C.spotLength!==x||C.rectAreaLength!==p||C.hemiLength!==f||C.numDirectionalShadows!==w||C.numPointShadows!==S||C.numSpotShadows!==v||C.numSpotMaps!==I||C.numLightProbes!==T)&&(n.directional.length=m,n.spot.length=x,n.rectArea.length=p,n.point.length=g,n.hemi.length=f,n.directionalShadow.length=w,n.directionalShadowMap.length=w,n.pointShadow.length=S,n.pointShadowMap.length=S,n.spotShadow.length=v,n.spotShadowMap.length=v,n.directionalShadowMatrix.length=w,n.pointShadowMatrix.length=S,n.spotLightMatrix.length=v+I-R,n.spotLightMap.length=I,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=T,C.directionalLength=m,C.pointLength=g,C.spotLength=x,C.rectAreaLength=p,C.hemiLength=f,C.numDirectionalShadows=w,C.numPointShadows=S,C.numSpotShadows=v,C.numSpotMaps=I,C.numLightProbes=T,n.version=R_++)}function l(h,c){let u=0,d=0,m=0,g=0,x=0,p=c.matrixWorldInverse;for(let f=0,w=h.length;f<w;f++){let S=h[f];if(S.isDirectionalLight){let v=n.directional[u];v.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(p),u++}else if(S.isSpotLight){let v=n.spot[m];v.position.setFromMatrixPosition(S.matrixWorld),v.position.applyMatrix4(p),v.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(p),m++}else if(S.isRectAreaLight){let v=n.rectArea[g];v.position.setFromMatrixPosition(S.matrixWorld),v.position.applyMatrix4(p),a.identity(),r.copy(S.matrixWorld),r.premultiply(p),a.extractRotation(r),v.halfWidth.set(S.width*.5,0,0),v.halfHeight.set(0,S.height*.5,0),v.halfWidth.applyMatrix4(a),v.halfHeight.applyMatrix4(a),g++}else if(S.isPointLight){let v=n.point[d];v.position.setFromMatrixPosition(S.matrixWorld),v.position.applyMatrix4(p),d++}else if(S.isHemisphereLight){let v=n.hemi[x];v.direction.setFromMatrixPosition(S.matrixWorld),v.direction.transformDirection(p),x++}}}return{setup:o,setupView:l,state:n}}function Lf(i){let e=new I_(i),t=[],n=[];function s(c){h.camera=c,t.length=0,n.length=0}function r(c){t.push(c)}function a(c){n.push(c)}function o(){e.setup(t)}function l(c){e.setupView(t,c)}let h={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:h,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function L_(i){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new Lf(i),e.set(s,[o])):r>=a.length?(o=new Lf(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}var Oh=class extends rs{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Og,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},zh=class extends rs{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},D_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,N_=`uniform sampler2D shadow_pass;
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
}`;function U_(i,e,t){let n=new va,s=new $e,r=new $e,a=new gt,o=new Oh({depthPacking:zg}),l=new zh,h={},c=t.maxTextureSize,u={[is]:gn,[gn]:is,[Dn]:Dn},d=new hi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new $e},radius:{value:4}},vertexShader:D_,fragmentShader:N_}),m=d.clone();m.defines.HORIZONTAL_PASS=1;let g=new en;g.setAttribute("position",new wn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new yt(g,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=el;let f=this.type;this.render=function(R,T,C){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||R.length===0)return;let y=i.getRenderTarget(),_=i.getActiveCubeFace(),L=i.getActiveMipmapLevel(),N=i.state;N.setBlending(ts),N.buffers.color.setClear(1,1,1,1),N.buffers.depth.setTest(!0),N.setScissorTest(!1);let P=f!==Ci&&this.type===Ci,F=f===Ci&&this.type!==Ci;for(let H=0,O=R.length;H<O;H++){let Z=R[H],G=Z.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",Z,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;s.copy(G.mapSize);let ae=G.getFrameExtents();if(s.multiply(ae),r.copy(G.mapSize),(s.x>c||s.y>c)&&(s.x>c&&(r.x=Math.floor(c/ae.x),s.x=r.x*ae.x,G.mapSize.x=r.x),s.y>c&&(r.y=Math.floor(c/ae.y),s.y=r.y*ae.y,G.mapSize.y=r.y)),G.map===null||P===!0||F===!0){let me=this.type!==Ci?{minFilter:Mn,magFilter:Mn}:{};G.map!==null&&G.map.dispose(),G.map=new Di(s.x,s.y,me),G.map.texture.name=Z.name+".shadowMap",G.camera.updateProjectionMatrix()}i.setRenderTarget(G.map),i.clear();let ee=G.getViewportCount();for(let me=0;me<ee;me++){let ke=G.getViewport(me);a.set(r.x*ke.x,r.y*ke.y,r.x*ke.z,r.y*ke.w),N.viewport(a),G.updateMatrices(Z,me),n=G.getFrustum(),v(T,C,G.camera,Z,this.type)}G.isPointLightShadow!==!0&&this.type===Ci&&w(G,C),G.needsUpdate=!1}f=this.type,p.needsUpdate=!1,i.setRenderTarget(y,_,L)};function w(R,T){let C=e.update(x);d.defines.VSM_SAMPLES!==R.blurSamples&&(d.defines.VSM_SAMPLES=R.blurSamples,m.defines.VSM_SAMPLES=R.blurSamples,d.needsUpdate=!0,m.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new Di(s.x,s.y)),d.uniforms.shadow_pass.value=R.map.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,i.setRenderTarget(R.mapPass),i.clear(),i.renderBufferDirect(T,null,C,d,x,null),m.uniforms.shadow_pass.value=R.mapPass.texture,m.uniforms.resolution.value=R.mapSize,m.uniforms.radius.value=R.radius,i.setRenderTarget(R.map),i.clear(),i.renderBufferDirect(T,null,C,m,x,null)}function S(R,T,C,y){let _=null,L=C.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(L!==void 0)_=L;else if(_=C.isPointLight===!0?l:o,i.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0){let N=_.uuid,P=T.uuid,F=h[N];F===void 0&&(F={},h[N]=F);let H=F[P];H===void 0&&(H=_.clone(),F[P]=H,T.addEventListener("dispose",I)),_=H}if(_.visible=T.visible,_.wireframe=T.wireframe,y===Ci?_.side=T.shadowSide!==null?T.shadowSide:T.side:_.side=T.shadowSide!==null?T.shadowSide:u[T.side],_.alphaMap=T.alphaMap,_.alphaTest=T.alphaTest,_.map=T.map,_.clipShadows=T.clipShadows,_.clippingPlanes=T.clippingPlanes,_.clipIntersection=T.clipIntersection,_.displacementMap=T.displacementMap,_.displacementScale=T.displacementScale,_.displacementBias=T.displacementBias,_.wireframeLinewidth=T.wireframeLinewidth,_.linewidth=T.linewidth,C.isPointLight===!0&&_.isMeshDistanceMaterial===!0){let N=i.properties.get(_);N.light=C}return _}function v(R,T,C,y,_){if(R.visible===!1)return;if(R.layers.test(T.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&_===Ci)&&(!R.frustumCulled||n.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,R.matrixWorld);let P=e.update(R),F=R.material;if(Array.isArray(F)){let H=P.groups;for(let O=0,Z=H.length;O<Z;O++){let G=H[O],ae=F[G.materialIndex];if(ae&&ae.visible){let ee=S(R,ae,y,_);R.onBeforeShadow(i,R,T,C,P,ee,G),i.renderBufferDirect(C,null,P,ee,R,G),R.onAfterShadow(i,R,T,C,P,ee,G)}}}else if(F.visible){let H=S(R,F,y,_);R.onBeforeShadow(i,R,T,C,P,H,null),i.renderBufferDirect(C,null,P,H,R,null),R.onAfterShadow(i,R,T,C,P,H,null)}}let N=R.children;for(let P=0,F=N.length;P<F;P++)v(N[P],T,C,y,_)}function I(R){R.target.removeEventListener("dispose",I);for(let C in h){let y=h[C],_=R.target.uuid;_ in y&&(y[_].dispose(),delete y[_])}}}var k_={[Vc]:Gc,[Wc]:Xc,[qc]:Yc,[_r]:$c,[Gc]:Vc,[Xc]:Wc,[Yc]:qc,[$c]:_r};function F_(i,e){function t(){let U=!1,ce=new gt,$=null,j=new gt(0,0,0,0);return{setMask:function(pe){$!==pe&&!U&&(i.colorMask(pe,pe,pe,pe),$=pe)},setLocked:function(pe){U=pe},setClear:function(pe,de,Be,Nt,nn){nn===!0&&(pe*=Nt,de*=Nt,Be*=Nt),ce.set(pe,de,Be,Nt),j.equals(ce)===!1&&(i.clearColor(pe,de,Be,Nt),j.copy(ce))},reset:function(){U=!1,$=null,j.set(-1,0,0,0)}}}function n(){let U=!1,ce=!1,$=null,j=null,pe=null;return{setReversed:function(de){if(ce!==de){let Be=e.get("EXT_clip_control");ce?Be.clipControlEXT(Be.LOWER_LEFT_EXT,Be.ZERO_TO_ONE_EXT):Be.clipControlEXT(Be.LOWER_LEFT_EXT,Be.NEGATIVE_ONE_TO_ONE_EXT);let Nt=pe;pe=null,this.setClear(Nt)}ce=de},getReversed:function(){return ce},setTest:function(de){de?he(i.DEPTH_TEST):Pe(i.DEPTH_TEST)},setMask:function(de){$!==de&&!U&&(i.depthMask(de),$=de)},setFunc:function(de){if(ce&&(de=k_[de]),j!==de){switch(de){case Vc:i.depthFunc(i.NEVER);break;case Gc:i.depthFunc(i.ALWAYS);break;case Wc:i.depthFunc(i.LESS);break;case _r:i.depthFunc(i.LEQUAL);break;case qc:i.depthFunc(i.EQUAL);break;case $c:i.depthFunc(i.GEQUAL);break;case Xc:i.depthFunc(i.GREATER);break;case Yc:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}j=de}},setLocked:function(de){U=de},setClear:function(de){pe!==de&&(ce&&(de=1-de),i.clearDepth(de),pe=de)},reset:function(){U=!1,$=null,j=null,pe=null,ce=!1}}}function s(){let U=!1,ce=null,$=null,j=null,pe=null,de=null,Be=null,Nt=null,nn=null;return{setTest:function(ft){U||(ft?he(i.STENCIL_TEST):Pe(i.STENCIL_TEST))},setMask:function(ft){ce!==ft&&!U&&(i.stencilMask(ft),ce=ft)},setFunc:function(ft,Vn,bi){($!==ft||j!==Vn||pe!==bi)&&(i.stencilFunc(ft,Vn,bi),$=ft,j=Vn,pe=bi)},setOp:function(ft,Vn,bi){(de!==ft||Be!==Vn||Nt!==bi)&&(i.stencilOp(ft,Vn,bi),de=ft,Be=Vn,Nt=bi)},setLocked:function(ft){U=ft},setClear:function(ft){nn!==ft&&(i.clearStencil(ft),nn=ft)},reset:function(){U=!1,ce=null,$=null,j=null,pe=null,de=null,Be=null,Nt=null,nn=null}}}let r=new t,a=new n,o=new s,l=new WeakMap,h=new WeakMap,c={},u={},d=new WeakMap,m=[],g=null,x=!1,p=null,f=null,w=null,S=null,v=null,I=null,R=null,T=new le(0,0,0),C=0,y=!1,_=null,L=null,N=null,P=null,F=null,H=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),O=!1,Z=0,G=i.getParameter(i.VERSION);G.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(G)[1]),O=Z>=1):G.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),O=Z>=2);let ae=null,ee={},me=i.getParameter(i.SCISSOR_BOX),ke=i.getParameter(i.VIEWPORT),ot=new gt().fromArray(me),X=new gt().fromArray(ke);function ie(U,ce,$,j){let pe=new Uint8Array(4),de=i.createTexture();i.bindTexture(U,de),i.texParameteri(U,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(U,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Be=0;Be<$;Be++)U===i.TEXTURE_3D||U===i.TEXTURE_2D_ARRAY?i.texImage3D(ce,0,i.RGBA,1,1,j,0,i.RGBA,i.UNSIGNED_BYTE,pe):i.texImage2D(ce+Be,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,pe);return de}let Se={};Se[i.TEXTURE_2D]=ie(i.TEXTURE_2D,i.TEXTURE_2D,1),Se[i.TEXTURE_CUBE_MAP]=ie(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Se[i.TEXTURE_2D_ARRAY]=ie(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Se[i.TEXTURE_3D]=ie(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),he(i.DEPTH_TEST),a.setFunc(_r),Je(!1),je(Nd),he(i.CULL_FACE),z(ts);function he(U){c[U]!==!0&&(i.enable(U),c[U]=!0)}function Pe(U){c[U]!==!1&&(i.disable(U),c[U]=!1)}function Fe(U,ce){return u[U]!==ce?(i.bindFramebuffer(U,ce),u[U]=ce,U===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=ce),U===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=ce),!0):!1}function qe(U,ce){let $=m,j=!1;if(U){$=d.get(ce),$===void 0&&($=[],d.set(ce,$));let pe=U.textures;if($.length!==pe.length||$[0]!==i.COLOR_ATTACHMENT0){for(let de=0,Be=pe.length;de<Be;de++)$[de]=i.COLOR_ATTACHMENT0+de;$.length=pe.length,j=!0}}else $[0]!==i.BACK&&($[0]=i.BACK,j=!0);j&&i.drawBuffers($)}function Lt(U){return g!==U?(i.useProgram(U),g=U,!0):!1}let et={[As]:i.FUNC_ADD,[fg]:i.FUNC_SUBTRACT,[pg]:i.FUNC_REVERSE_SUBTRACT};et[mg]=i.MIN,et[gg]=i.MAX;let Ut={[xg]:i.ZERO,[vg]:i.ONE,[yg]:i.SRC_COLOR,[zc]:i.SRC_ALPHA,[Ag]:i.SRC_ALPHA_SATURATE,[wg]:i.DST_COLOR,[bg]:i.DST_ALPHA,[_g]:i.ONE_MINUS_SRC_COLOR,[Hc]:i.ONE_MINUS_SRC_ALPHA,[Sg]:i.ONE_MINUS_DST_COLOR,[Mg]:i.ONE_MINUS_DST_ALPHA,[Tg]:i.CONSTANT_COLOR,[Eg]:i.ONE_MINUS_CONSTANT_COLOR,[Cg]:i.CONSTANT_ALPHA,[Rg]:i.ONE_MINUS_CONSTANT_ALPHA};function z(U,ce,$,j,pe,de,Be,Nt,nn,ft){if(U===ts){x===!0&&(Pe(i.BLEND),x=!1);return}if(x===!1&&(he(i.BLEND),x=!0),U!==dg){if(U!==p||ft!==y){if((f!==As||v!==As)&&(i.blendEquation(i.FUNC_ADD),f=As,v=As),ft)switch(U){case gr:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ps:i.blendFunc(i.ONE,i.ONE);break;case Ud:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case kd:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}else switch(U){case gr:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ps:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Ud:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case kd:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}w=null,S=null,I=null,R=null,T.set(0,0,0),C=0,p=U,y=ft}return}pe=pe||ce,de=de||$,Be=Be||j,(ce!==f||pe!==v)&&(i.blendEquationSeparate(et[ce],et[pe]),f=ce,v=pe),($!==w||j!==S||de!==I||Be!==R)&&(i.blendFuncSeparate(Ut[$],Ut[j],Ut[de],Ut[Be]),w=$,S=j,I=de,R=Be),(Nt.equals(T)===!1||nn!==C)&&(i.blendColor(Nt.r,Nt.g,Nt.b,nn),T.copy(Nt),C=nn),p=U,y=!1}function Rn(U,ce){U.side===Dn?Pe(i.CULL_FACE):he(i.CULL_FACE);let $=U.side===gn;ce&&($=!$),Je($),U.blending===gr&&U.transparent===!1?z(ts):z(U.blending,U.blendEquation,U.blendSrc,U.blendDst,U.blendEquationAlpha,U.blendSrcAlpha,U.blendDstAlpha,U.blendColor,U.blendAlpha,U.premultipliedAlpha),a.setFunc(U.depthFunc),a.setTest(U.depthTest),a.setMask(U.depthWrite),r.setMask(U.colorWrite);let j=U.stencilWrite;o.setTest(j),j&&(o.setMask(U.stencilWriteMask),o.setFunc(U.stencilFunc,U.stencilRef,U.stencilFuncMask),o.setOp(U.stencilFail,U.stencilZFail,U.stencilZPass)),St(U.polygonOffset,U.polygonOffsetFactor,U.polygonOffsetUnits),U.alphaToCoverage===!0?he(i.SAMPLE_ALPHA_TO_COVERAGE):Pe(i.SAMPLE_ALPHA_TO_COVERAGE)}function Je(U){_!==U&&(U?i.frontFace(i.CW):i.frontFace(i.CCW),_=U)}function je(U){U!==hg?(he(i.CULL_FACE),U!==L&&(U===Nd?i.cullFace(i.BACK):U===ug?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Pe(i.CULL_FACE),L=U}function Ce(U){U!==N&&(O&&i.lineWidth(U),N=U)}function St(U,ce,$){U?(he(i.POLYGON_OFFSET_FILL),(P!==ce||F!==$)&&(i.polygonOffset(ce,$),P=ce,F=$)):Pe(i.POLYGON_OFFSET_FILL)}function Ee(U){U?he(i.SCISSOR_TEST):Pe(i.SCISSOR_TEST)}function E(U){U===void 0&&(U=i.TEXTURE0+H-1),ae!==U&&(i.activeTexture(U),ae=U)}function b(U,ce,$){$===void 0&&(ae===null?$=i.TEXTURE0+H-1:$=ae);let j=ee[$];j===void 0&&(j={type:void 0,texture:void 0},ee[$]=j),(j.type!==U||j.texture!==ce)&&(ae!==$&&(i.activeTexture($),ae=$),i.bindTexture(U,ce||Se[U]),j.type=U,j.texture=ce)}function V(){let U=ee[ae];U!==void 0&&U.type!==void 0&&(i.bindTexture(U.type,null),U.type=void 0,U.texture=void 0)}function J(){try{i.compressedTexImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Q(){try{i.compressedTexImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function K(){try{i.texSubImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Ae(){try{i.texSubImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ue(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ge(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function tt(){try{i.texStorage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function te(){try{i.texStorage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ve(){try{i.texImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Re(){try{i.texImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function De(U){ot.equals(U)===!1&&(i.scissor(U.x,U.y,U.z,U.w),ot.copy(U))}function ye(U){X.equals(U)===!1&&(i.viewport(U.x,U.y,U.z,U.w),X.copy(U))}function Qe(U,ce){let $=h.get(ce);$===void 0&&($=new WeakMap,h.set(ce,$));let j=$.get(U);j===void 0&&(j=i.getUniformBlockIndex(ce,U.name),$.set(U,j))}function ze(U,ce){let j=h.get(ce).get(U);l.get(ce)!==j&&(i.uniformBlockBinding(ce,j,U.__bindingPointIndex),l.set(ce,j))}function bt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),c={},ae=null,ee={},u={},d=new WeakMap,m=[],g=null,x=!1,p=null,f=null,w=null,S=null,v=null,I=null,R=null,T=new le(0,0,0),C=0,y=!1,_=null,L=null,N=null,P=null,F=null,ot.set(0,0,i.canvas.width,i.canvas.height),X.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:he,disable:Pe,bindFramebuffer:Fe,drawBuffers:qe,useProgram:Lt,setBlending:z,setMaterial:Rn,setFlipSided:Je,setCullFace:je,setLineWidth:Ce,setPolygonOffset:St,setScissorTest:Ee,activeTexture:E,bindTexture:b,unbindTexture:V,compressedTexImage2D:J,compressedTexImage3D:Q,texImage2D:ve,texImage3D:Re,updateUBOMapping:Qe,uniformBlockBinding:ze,texStorage2D:tt,texStorage3D:te,texSubImage2D:K,texSubImage3D:Ae,compressedTexSubImage2D:ue,compressedTexSubImage3D:ge,scissor:De,viewport:ye,reset:bt}}function Df(i,e,t,n){let s=B_(n);switch(t){case Gf:return i*e;case qf:return i*e;case $f:return i*e*2;case ou:return i*e/s.components*s.byteLength;case lu:return i*e/s.components*s.byteLength;case Xf:return i*e*2/s.components*s.byteLength;case cu:return i*e*2/s.components*s.byteLength;case Wf:return i*e*3/s.components*s.byteLength;case Xn:return i*e*4/s.components*s.byteLength;case hu:return i*e*4/s.components*s.byteLength;case Ro:case Po:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Io:case Lo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case eh:case nh:return Math.max(i,16)*Math.max(e,8)/4;case Qc:case th:return Math.max(i,8)*Math.max(e,8)/2;case ih:case sh:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case rh:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case ah:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case oh:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case lh:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case ch:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case hh:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case uh:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case dh:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case fh:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case ph:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case mh:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case gh:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case xh:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case vh:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case yh:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Do:case _h:case bh:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Yf:case Mh:return Math.ceil(i/4)*Math.ceil(e/4)*8;case wh:case Sh:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function B_(i){switch(i){case Li:case zf:return{byteLength:1,components:1};case xa:case Hf:case Ma:return{byteLength:2,components:1};case ru:case au:return{byteLength:2,components:4};case Is:case su:case ci:return{byteLength:4,components:1};case Vf:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function O_(i,e,t,n,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new $e,c=new WeakMap,u,d=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(E,b){return m?new OffscreenCanvas(E,b):ko("canvas")}function x(E,b,V){let J=1,Q=Ee(E);if((Q.width>V||Q.height>V)&&(J=V/Math.max(Q.width,Q.height)),J<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){let K=Math.floor(J*Q.width),Ae=Math.floor(J*Q.height);u===void 0&&(u=g(K,Ae));let ue=b?g(K,Ae):u;return ue.width=K,ue.height=Ae,ue.getContext("2d").drawImage(E,0,0,K,Ae),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Q.width+"x"+Q.height+") to ("+K+"x"+Ae+")."),ue}else return"data"in E&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Q.width+"x"+Q.height+")."),E;return E}function p(E){return E.generateMipmaps}function f(E){i.generateMipmap(E)}function w(E){return E.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:E.isWebGL3DRenderTarget?i.TEXTURE_3D:E.isWebGLArrayRenderTarget||E.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function S(E,b,V,J,Q=!1){if(E!==null){if(i[E]!==void 0)return i[E];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let K=b;if(b===i.RED&&(V===i.FLOAT&&(K=i.R32F),V===i.HALF_FLOAT&&(K=i.R16F),V===i.UNSIGNED_BYTE&&(K=i.R8)),b===i.RED_INTEGER&&(V===i.UNSIGNED_BYTE&&(K=i.R8UI),V===i.UNSIGNED_SHORT&&(K=i.R16UI),V===i.UNSIGNED_INT&&(K=i.R32UI),V===i.BYTE&&(K=i.R8I),V===i.SHORT&&(K=i.R16I),V===i.INT&&(K=i.R32I)),b===i.RG&&(V===i.FLOAT&&(K=i.RG32F),V===i.HALF_FLOAT&&(K=i.RG16F),V===i.UNSIGNED_BYTE&&(K=i.RG8)),b===i.RG_INTEGER&&(V===i.UNSIGNED_BYTE&&(K=i.RG8UI),V===i.UNSIGNED_SHORT&&(K=i.RG16UI),V===i.UNSIGNED_INT&&(K=i.RG32UI),V===i.BYTE&&(K=i.RG8I),V===i.SHORT&&(K=i.RG16I),V===i.INT&&(K=i.RG32I)),b===i.RGB_INTEGER&&(V===i.UNSIGNED_BYTE&&(K=i.RGB8UI),V===i.UNSIGNED_SHORT&&(K=i.RGB16UI),V===i.UNSIGNED_INT&&(K=i.RGB32UI),V===i.BYTE&&(K=i.RGB8I),V===i.SHORT&&(K=i.RGB16I),V===i.INT&&(K=i.RGB32I)),b===i.RGBA_INTEGER&&(V===i.UNSIGNED_BYTE&&(K=i.RGBA8UI),V===i.UNSIGNED_SHORT&&(K=i.RGBA16UI),V===i.UNSIGNED_INT&&(K=i.RGBA32UI),V===i.BYTE&&(K=i.RGBA8I),V===i.SHORT&&(K=i.RGBA16I),V===i.INT&&(K=i.RGBA32I)),b===i.RGB&&V===i.UNSIGNED_INT_5_9_9_9_REV&&(K=i.RGB9_E5),b===i.RGBA){let Ae=Q?il:nt.getTransfer(J);V===i.FLOAT&&(K=i.RGBA32F),V===i.HALF_FLOAT&&(K=i.RGBA16F),V===i.UNSIGNED_BYTE&&(K=Ae===mt?i.SRGB8_ALPHA8:i.RGBA8),V===i.UNSIGNED_SHORT_4_4_4_4&&(K=i.RGBA4),V===i.UNSIGNED_SHORT_5_5_5_1&&(K=i.RGB5_A1)}return(K===i.R16F||K===i.R32F||K===i.RG16F||K===i.RG32F||K===i.RGBA16F||K===i.RGBA32F)&&e.get("EXT_color_buffer_float"),K}function v(E,b){let V;return E?b===null||b===Is||b===wr?V=i.DEPTH24_STENCIL8:b===ci?V=i.DEPTH32F_STENCIL8:b===xa&&(V=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):b===null||b===Is||b===wr?V=i.DEPTH_COMPONENT24:b===ci?V=i.DEPTH_COMPONENT32F:b===xa&&(V=i.DEPTH_COMPONENT16),V}function I(E,b){return p(E)===!0||E.isFramebufferTexture&&E.minFilter!==Mn&&E.minFilter!==li?Math.log2(Math.max(b.width,b.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?b.mipmaps.length:1}function R(E){let b=E.target;b.removeEventListener("dispose",R),C(b),b.isVideoTexture&&c.delete(b)}function T(E){let b=E.target;b.removeEventListener("dispose",T),_(b)}function C(E){let b=n.get(E);if(b.__webglInit===void 0)return;let V=E.source,J=d.get(V);if(J){let Q=J[b.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&y(E),Object.keys(J).length===0&&d.delete(V)}n.remove(E)}function y(E){let b=n.get(E);i.deleteTexture(b.__webglTexture);let V=E.source,J=d.get(V);delete J[b.__cacheKey],a.memory.textures--}function _(E){let b=n.get(E);if(E.depthTexture&&(E.depthTexture.dispose(),n.remove(E.depthTexture)),E.isWebGLCubeRenderTarget)for(let J=0;J<6;J++){if(Array.isArray(b.__webglFramebuffer[J]))for(let Q=0;Q<b.__webglFramebuffer[J].length;Q++)i.deleteFramebuffer(b.__webglFramebuffer[J][Q]);else i.deleteFramebuffer(b.__webglFramebuffer[J]);b.__webglDepthbuffer&&i.deleteRenderbuffer(b.__webglDepthbuffer[J])}else{if(Array.isArray(b.__webglFramebuffer))for(let J=0;J<b.__webglFramebuffer.length;J++)i.deleteFramebuffer(b.__webglFramebuffer[J]);else i.deleteFramebuffer(b.__webglFramebuffer);if(b.__webglDepthbuffer&&i.deleteRenderbuffer(b.__webglDepthbuffer),b.__webglMultisampledFramebuffer&&i.deleteFramebuffer(b.__webglMultisampledFramebuffer),b.__webglColorRenderbuffer)for(let J=0;J<b.__webglColorRenderbuffer.length;J++)b.__webglColorRenderbuffer[J]&&i.deleteRenderbuffer(b.__webglColorRenderbuffer[J]);b.__webglDepthRenderbuffer&&i.deleteRenderbuffer(b.__webglDepthRenderbuffer)}let V=E.textures;for(let J=0,Q=V.length;J<Q;J++){let K=n.get(V[J]);K.__webglTexture&&(i.deleteTexture(K.__webglTexture),a.memory.textures--),n.remove(V[J])}n.remove(E)}let L=0;function N(){L=0}function P(){let E=L;return E>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+s.maxTextures),L+=1,E}function F(E){let b=[];return b.push(E.wrapS),b.push(E.wrapT),b.push(E.wrapR||0),b.push(E.magFilter),b.push(E.minFilter),b.push(E.anisotropy),b.push(E.internalFormat),b.push(E.format),b.push(E.type),b.push(E.generateMipmaps),b.push(E.premultiplyAlpha),b.push(E.flipY),b.push(E.unpackAlignment),b.push(E.colorSpace),b.join()}function H(E,b){let V=n.get(E);if(E.isVideoTexture&&Ce(E),E.isRenderTargetTexture===!1&&E.version>0&&V.__version!==E.version){let J=E.image;if(J===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(J.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{X(V,E,b);return}}t.bindTexture(i.TEXTURE_2D,V.__webglTexture,i.TEXTURE0+b)}function O(E,b){let V=n.get(E);if(E.version>0&&V.__version!==E.version){X(V,E,b);return}t.bindTexture(i.TEXTURE_2D_ARRAY,V.__webglTexture,i.TEXTURE0+b)}function Z(E,b){let V=n.get(E);if(E.version>0&&V.__version!==E.version){X(V,E,b);return}t.bindTexture(i.TEXTURE_3D,V.__webglTexture,i.TEXTURE0+b)}function G(E,b){let V=n.get(E);if(E.version>0&&V.__version!==E.version){ie(V,E,b);return}t.bindTexture(i.TEXTURE_CUBE_MAP,V.__webglTexture,i.TEXTURE0+b)}let ae={[Jc]:i.REPEAT,[Cs]:i.CLAMP_TO_EDGE,[jc]:i.MIRRORED_REPEAT},ee={[Mn]:i.NEAREST,[Bg]:i.NEAREST_MIPMAP_NEAREST,[ro]:i.NEAREST_MIPMAP_LINEAR,[li]:i.LINEAR,[lc]:i.LINEAR_MIPMAP_NEAREST,[Rs]:i.LINEAR_MIPMAP_LINEAR},me={[Vg]:i.NEVER,[Yg]:i.ALWAYS,[Gg]:i.LESS,[Kf]:i.LEQUAL,[Wg]:i.EQUAL,[Xg]:i.GEQUAL,[qg]:i.GREATER,[$g]:i.NOTEQUAL};function ke(E,b){if(b.type===ci&&e.has("OES_texture_float_linear")===!1&&(b.magFilter===li||b.magFilter===lc||b.magFilter===ro||b.magFilter===Rs||b.minFilter===li||b.minFilter===lc||b.minFilter===ro||b.minFilter===Rs)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(E,i.TEXTURE_WRAP_S,ae[b.wrapS]),i.texParameteri(E,i.TEXTURE_WRAP_T,ae[b.wrapT]),(E===i.TEXTURE_3D||E===i.TEXTURE_2D_ARRAY)&&i.texParameteri(E,i.TEXTURE_WRAP_R,ae[b.wrapR]),i.texParameteri(E,i.TEXTURE_MAG_FILTER,ee[b.magFilter]),i.texParameteri(E,i.TEXTURE_MIN_FILTER,ee[b.minFilter]),b.compareFunction&&(i.texParameteri(E,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(E,i.TEXTURE_COMPARE_FUNC,me[b.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(b.magFilter===Mn||b.minFilter!==ro&&b.minFilter!==Rs||b.type===ci&&e.has("OES_texture_float_linear")===!1)return;if(b.anisotropy>1||n.get(b).__currentAnisotropy){let V=e.get("EXT_texture_filter_anisotropic");i.texParameterf(E,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(b.anisotropy,s.getMaxAnisotropy())),n.get(b).__currentAnisotropy=b.anisotropy}}}function ot(E,b){let V=!1;E.__webglInit===void 0&&(E.__webglInit=!0,b.addEventListener("dispose",R));let J=b.source,Q=d.get(J);Q===void 0&&(Q={},d.set(J,Q));let K=F(b);if(K!==E.__cacheKey){Q[K]===void 0&&(Q[K]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,V=!0),Q[K].usedTimes++;let Ae=Q[E.__cacheKey];Ae!==void 0&&(Q[E.__cacheKey].usedTimes--,Ae.usedTimes===0&&y(b)),E.__cacheKey=K,E.__webglTexture=Q[K].texture}return V}function X(E,b,V){let J=i.TEXTURE_2D;(b.isDataArrayTexture||b.isCompressedArrayTexture)&&(J=i.TEXTURE_2D_ARRAY),b.isData3DTexture&&(J=i.TEXTURE_3D);let Q=ot(E,b),K=b.source;t.bindTexture(J,E.__webglTexture,i.TEXTURE0+V);let Ae=n.get(K);if(K.version!==Ae.__version||Q===!0){t.activeTexture(i.TEXTURE0+V);let ue=nt.getPrimaries(nt.workingColorSpace),ge=b.colorSpace===es?null:nt.getPrimaries(b.colorSpace),tt=b.colorSpace===es||ue===ge?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,b.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,b.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,tt);let te=x(b.image,!1,s.maxTextureSize);te=St(b,te);let ve=r.convert(b.format,b.colorSpace),Re=r.convert(b.type),De=S(b.internalFormat,ve,Re,b.colorSpace,b.isVideoTexture);ke(J,b);let ye,Qe=b.mipmaps,ze=b.isVideoTexture!==!0,bt=Ae.__version===void 0||Q===!0,U=K.dataReady,ce=I(b,te);if(b.isDepthTexture)De=v(b.format===Sr,b.type),bt&&(ze?t.texStorage2D(i.TEXTURE_2D,1,De,te.width,te.height):t.texImage2D(i.TEXTURE_2D,0,De,te.width,te.height,0,ve,Re,null));else if(b.isDataTexture)if(Qe.length>0){ze&&bt&&t.texStorage2D(i.TEXTURE_2D,ce,De,Qe[0].width,Qe[0].height);for(let $=0,j=Qe.length;$<j;$++)ye=Qe[$],ze?U&&t.texSubImage2D(i.TEXTURE_2D,$,0,0,ye.width,ye.height,ve,Re,ye.data):t.texImage2D(i.TEXTURE_2D,$,De,ye.width,ye.height,0,ve,Re,ye.data);b.generateMipmaps=!1}else ze?(bt&&t.texStorage2D(i.TEXTURE_2D,ce,De,te.width,te.height),U&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,te.width,te.height,ve,Re,te.data)):t.texImage2D(i.TEXTURE_2D,0,De,te.width,te.height,0,ve,Re,te.data);else if(b.isCompressedTexture)if(b.isCompressedArrayTexture){ze&&bt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ce,De,Qe[0].width,Qe[0].height,te.depth);for(let $=0,j=Qe.length;$<j;$++)if(ye=Qe[$],b.format!==Xn)if(ve!==null)if(ze){if(U)if(b.layerUpdates.size>0){let pe=Df(ye.width,ye.height,b.format,b.type);for(let de of b.layerUpdates){let Be=ye.data.subarray(de*pe/ye.data.BYTES_PER_ELEMENT,(de+1)*pe/ye.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,de,ye.width,ye.height,1,ve,Be)}b.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,0,ye.width,ye.height,te.depth,ve,ye.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,$,De,ye.width,ye.height,te.depth,0,ye.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ze?U&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,0,ye.width,ye.height,te.depth,ve,Re,ye.data):t.texImage3D(i.TEXTURE_2D_ARRAY,$,De,ye.width,ye.height,te.depth,0,ve,Re,ye.data)}else{ze&&bt&&t.texStorage2D(i.TEXTURE_2D,ce,De,Qe[0].width,Qe[0].height);for(let $=0,j=Qe.length;$<j;$++)ye=Qe[$],b.format!==Xn?ve!==null?ze?U&&t.compressedTexSubImage2D(i.TEXTURE_2D,$,0,0,ye.width,ye.height,ve,ye.data):t.compressedTexImage2D(i.TEXTURE_2D,$,De,ye.width,ye.height,0,ye.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ze?U&&t.texSubImage2D(i.TEXTURE_2D,$,0,0,ye.width,ye.height,ve,Re,ye.data):t.texImage2D(i.TEXTURE_2D,$,De,ye.width,ye.height,0,ve,Re,ye.data)}else if(b.isDataArrayTexture)if(ze){if(bt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ce,De,te.width,te.height,te.depth),U)if(b.layerUpdates.size>0){let $=Df(te.width,te.height,b.format,b.type);for(let j of b.layerUpdates){let pe=te.data.subarray(j*$/te.data.BYTES_PER_ELEMENT,(j+1)*$/te.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,j,te.width,te.height,1,ve,Re,pe)}b.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,te.width,te.height,te.depth,ve,Re,te.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,De,te.width,te.height,te.depth,0,ve,Re,te.data);else if(b.isData3DTexture)ze?(bt&&t.texStorage3D(i.TEXTURE_3D,ce,De,te.width,te.height,te.depth),U&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,te.width,te.height,te.depth,ve,Re,te.data)):t.texImage3D(i.TEXTURE_3D,0,De,te.width,te.height,te.depth,0,ve,Re,te.data);else if(b.isFramebufferTexture){if(bt)if(ze)t.texStorage2D(i.TEXTURE_2D,ce,De,te.width,te.height);else{let $=te.width,j=te.height;for(let pe=0;pe<ce;pe++)t.texImage2D(i.TEXTURE_2D,pe,De,$,j,0,ve,Re,null),$>>=1,j>>=1}}else if(Qe.length>0){if(ze&&bt){let $=Ee(Qe[0]);t.texStorage2D(i.TEXTURE_2D,ce,De,$.width,$.height)}for(let $=0,j=Qe.length;$<j;$++)ye=Qe[$],ze?U&&t.texSubImage2D(i.TEXTURE_2D,$,0,0,ve,Re,ye):t.texImage2D(i.TEXTURE_2D,$,De,ve,Re,ye);b.generateMipmaps=!1}else if(ze){if(bt){let $=Ee(te);t.texStorage2D(i.TEXTURE_2D,ce,De,$.width,$.height)}U&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,ve,Re,te)}else t.texImage2D(i.TEXTURE_2D,0,De,ve,Re,te);p(b)&&f(J),Ae.__version=K.version,b.onUpdate&&b.onUpdate(b)}E.__version=b.version}function ie(E,b,V){if(b.image.length!==6)return;let J=ot(E,b),Q=b.source;t.bindTexture(i.TEXTURE_CUBE_MAP,E.__webglTexture,i.TEXTURE0+V);let K=n.get(Q);if(Q.version!==K.__version||J===!0){t.activeTexture(i.TEXTURE0+V);let Ae=nt.getPrimaries(nt.workingColorSpace),ue=b.colorSpace===es?null:nt.getPrimaries(b.colorSpace),ge=b.colorSpace===es||Ae===ue?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,b.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,b.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ge);let tt=b.isCompressedTexture||b.image[0].isCompressedTexture,te=b.image[0]&&b.image[0].isDataTexture,ve=[];for(let j=0;j<6;j++)!tt&&!te?ve[j]=x(b.image[j],!0,s.maxCubemapSize):ve[j]=te?b.image[j].image:b.image[j],ve[j]=St(b,ve[j]);let Re=ve[0],De=r.convert(b.format,b.colorSpace),ye=r.convert(b.type),Qe=S(b.internalFormat,De,ye,b.colorSpace),ze=b.isVideoTexture!==!0,bt=K.__version===void 0||J===!0,U=Q.dataReady,ce=I(b,Re);ke(i.TEXTURE_CUBE_MAP,b);let $;if(tt){ze&&bt&&t.texStorage2D(i.TEXTURE_CUBE_MAP,ce,Qe,Re.width,Re.height);for(let j=0;j<6;j++){$=ve[j].mipmaps;for(let pe=0;pe<$.length;pe++){let de=$[pe];b.format!==Xn?De!==null?ze?U&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,pe,0,0,de.width,de.height,De,de.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,pe,Qe,de.width,de.height,0,de.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):ze?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,pe,0,0,de.width,de.height,De,ye,de.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,pe,Qe,de.width,de.height,0,De,ye,de.data)}}}else{if($=b.mipmaps,ze&&bt){$.length>0&&ce++;let j=Ee(ve[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,ce,Qe,j.width,j.height)}for(let j=0;j<6;j++)if(te){ze?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,ve[j].width,ve[j].height,De,ye,ve[j].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Qe,ve[j].width,ve[j].height,0,De,ye,ve[j].data);for(let pe=0;pe<$.length;pe++){let Be=$[pe].image[j].image;ze?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,pe+1,0,0,Be.width,Be.height,De,ye,Be.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,pe+1,Qe,Be.width,Be.height,0,De,ye,Be.data)}}else{ze?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,De,ye,ve[j]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Qe,De,ye,ve[j]);for(let pe=0;pe<$.length;pe++){let de=$[pe];ze?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,pe+1,0,0,De,ye,de.image[j]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,pe+1,Qe,De,ye,de.image[j])}}}p(b)&&f(i.TEXTURE_CUBE_MAP),K.__version=Q.version,b.onUpdate&&b.onUpdate(b)}E.__version=b.version}function Se(E,b,V,J,Q,K){let Ae=r.convert(V.format,V.colorSpace),ue=r.convert(V.type),ge=S(V.internalFormat,Ae,ue,V.colorSpace),tt=n.get(b),te=n.get(V);if(te.__renderTarget=b,!tt.__hasExternalTextures){let ve=Math.max(1,b.width>>K),Re=Math.max(1,b.height>>K);Q===i.TEXTURE_3D||Q===i.TEXTURE_2D_ARRAY?t.texImage3D(Q,K,ge,ve,Re,b.depth,0,Ae,ue,null):t.texImage2D(Q,K,ge,ve,Re,0,Ae,ue,null)}t.bindFramebuffer(i.FRAMEBUFFER,E),je(b)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,J,Q,te.__webglTexture,0,Je(b)):(Q===i.TEXTURE_2D||Q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,J,Q,te.__webglTexture,K),t.bindFramebuffer(i.FRAMEBUFFER,null)}function he(E,b,V){if(i.bindRenderbuffer(i.RENDERBUFFER,E),b.depthBuffer){let J=b.depthTexture,Q=J&&J.isDepthTexture?J.type:null,K=v(b.stencilBuffer,Q),Ae=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ue=Je(b);je(b)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ue,K,b.width,b.height):V?i.renderbufferStorageMultisample(i.RENDERBUFFER,ue,K,b.width,b.height):i.renderbufferStorage(i.RENDERBUFFER,K,b.width,b.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Ae,i.RENDERBUFFER,E)}else{let J=b.textures;for(let Q=0;Q<J.length;Q++){let K=J[Q],Ae=r.convert(K.format,K.colorSpace),ue=r.convert(K.type),ge=S(K.internalFormat,Ae,ue,K.colorSpace),tt=Je(b);V&&je(b)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,tt,ge,b.width,b.height):je(b)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,tt,ge,b.width,b.height):i.renderbufferStorage(i.RENDERBUFFER,ge,b.width,b.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Pe(E,b){if(b&&b.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,E),!(b.depthTexture&&b.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let J=n.get(b.depthTexture);J.__renderTarget=b,(!J.__webglTexture||b.depthTexture.image.width!==b.width||b.depthTexture.image.height!==b.height)&&(b.depthTexture.image.width=b.width,b.depthTexture.image.height=b.height,b.depthTexture.needsUpdate=!0),H(b.depthTexture,0);let Q=J.__webglTexture,K=Je(b);if(b.depthTexture.format===xr)je(b)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Q,0,K):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Q,0);else if(b.depthTexture.format===Sr)je(b)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Q,0,K):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Q,0);else throw new Error("Unknown depthTexture format")}function Fe(E){let b=n.get(E),V=E.isWebGLCubeRenderTarget===!0;if(b.__boundDepthTexture!==E.depthTexture){let J=E.depthTexture;if(b.__depthDisposeCallback&&b.__depthDisposeCallback(),J){let Q=()=>{delete b.__boundDepthTexture,delete b.__depthDisposeCallback,J.removeEventListener("dispose",Q)};J.addEventListener("dispose",Q),b.__depthDisposeCallback=Q}b.__boundDepthTexture=J}if(E.depthTexture&&!b.__autoAllocateDepthBuffer){if(V)throw new Error("target.depthTexture not supported in Cube render targets");Pe(b.__webglFramebuffer,E)}else if(V){b.__webglDepthbuffer=[];for(let J=0;J<6;J++)if(t.bindFramebuffer(i.FRAMEBUFFER,b.__webglFramebuffer[J]),b.__webglDepthbuffer[J]===void 0)b.__webglDepthbuffer[J]=i.createRenderbuffer(),he(b.__webglDepthbuffer[J],E,!1);else{let Q=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,K=b.__webglDepthbuffer[J];i.bindRenderbuffer(i.RENDERBUFFER,K),i.framebufferRenderbuffer(i.FRAMEBUFFER,Q,i.RENDERBUFFER,K)}}else if(t.bindFramebuffer(i.FRAMEBUFFER,b.__webglFramebuffer),b.__webglDepthbuffer===void 0)b.__webglDepthbuffer=i.createRenderbuffer(),he(b.__webglDepthbuffer,E,!1);else{let J=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Q=b.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Q),i.framebufferRenderbuffer(i.FRAMEBUFFER,J,i.RENDERBUFFER,Q)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function qe(E,b,V){let J=n.get(E);b!==void 0&&Se(J.__webglFramebuffer,E,E.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),V!==void 0&&Fe(E)}function Lt(E){let b=E.texture,V=n.get(E),J=n.get(b);E.addEventListener("dispose",T);let Q=E.textures,K=E.isWebGLCubeRenderTarget===!0,Ae=Q.length>1;if(Ae||(J.__webglTexture===void 0&&(J.__webglTexture=i.createTexture()),J.__version=b.version,a.memory.textures++),K){V.__webglFramebuffer=[];for(let ue=0;ue<6;ue++)if(b.mipmaps&&b.mipmaps.length>0){V.__webglFramebuffer[ue]=[];for(let ge=0;ge<b.mipmaps.length;ge++)V.__webglFramebuffer[ue][ge]=i.createFramebuffer()}else V.__webglFramebuffer[ue]=i.createFramebuffer()}else{if(b.mipmaps&&b.mipmaps.length>0){V.__webglFramebuffer=[];for(let ue=0;ue<b.mipmaps.length;ue++)V.__webglFramebuffer[ue]=i.createFramebuffer()}else V.__webglFramebuffer=i.createFramebuffer();if(Ae)for(let ue=0,ge=Q.length;ue<ge;ue++){let tt=n.get(Q[ue]);tt.__webglTexture===void 0&&(tt.__webglTexture=i.createTexture(),a.memory.textures++)}if(E.samples>0&&je(E)===!1){V.__webglMultisampledFramebuffer=i.createFramebuffer(),V.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let ue=0;ue<Q.length;ue++){let ge=Q[ue];V.__webglColorRenderbuffer[ue]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,V.__webglColorRenderbuffer[ue]);let tt=r.convert(ge.format,ge.colorSpace),te=r.convert(ge.type),ve=S(ge.internalFormat,tt,te,ge.colorSpace,E.isXRRenderTarget===!0),Re=Je(E);i.renderbufferStorageMultisample(i.RENDERBUFFER,Re,ve,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ue,i.RENDERBUFFER,V.__webglColorRenderbuffer[ue])}i.bindRenderbuffer(i.RENDERBUFFER,null),E.depthBuffer&&(V.__webglDepthRenderbuffer=i.createRenderbuffer(),he(V.__webglDepthRenderbuffer,E,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(K){t.bindTexture(i.TEXTURE_CUBE_MAP,J.__webglTexture),ke(i.TEXTURE_CUBE_MAP,b);for(let ue=0;ue<6;ue++)if(b.mipmaps&&b.mipmaps.length>0)for(let ge=0;ge<b.mipmaps.length;ge++)Se(V.__webglFramebuffer[ue][ge],E,b,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,ge);else Se(V.__webglFramebuffer[ue],E,b,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0);p(b)&&f(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ae){for(let ue=0,ge=Q.length;ue<ge;ue++){let tt=Q[ue],te=n.get(tt);t.bindTexture(i.TEXTURE_2D,te.__webglTexture),ke(i.TEXTURE_2D,tt),Se(V.__webglFramebuffer,E,tt,i.COLOR_ATTACHMENT0+ue,i.TEXTURE_2D,0),p(tt)&&f(i.TEXTURE_2D)}t.unbindTexture()}else{let ue=i.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(ue=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ue,J.__webglTexture),ke(ue,b),b.mipmaps&&b.mipmaps.length>0)for(let ge=0;ge<b.mipmaps.length;ge++)Se(V.__webglFramebuffer[ge],E,b,i.COLOR_ATTACHMENT0,ue,ge);else Se(V.__webglFramebuffer,E,b,i.COLOR_ATTACHMENT0,ue,0);p(b)&&f(ue),t.unbindTexture()}E.depthBuffer&&Fe(E)}function et(E){let b=E.textures;for(let V=0,J=b.length;V<J;V++){let Q=b[V];if(p(Q)){let K=w(E),Ae=n.get(Q).__webglTexture;t.bindTexture(K,Ae),f(K),t.unbindTexture()}}}let Ut=[],z=[];function Rn(E){if(E.samples>0){if(je(E)===!1){let b=E.textures,V=E.width,J=E.height,Q=i.COLOR_BUFFER_BIT,K=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Ae=n.get(E),ue=b.length>1;if(ue)for(let ge=0;ge<b.length;ge++)t.bindFramebuffer(i.FRAMEBUFFER,Ae.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ge,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Ae.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ge,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Ae.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ae.__webglFramebuffer);for(let ge=0;ge<b.length;ge++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(Q|=i.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(Q|=i.STENCIL_BUFFER_BIT)),ue){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Ae.__webglColorRenderbuffer[ge]);let tt=n.get(b[ge]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,tt,0)}i.blitFramebuffer(0,0,V,J,0,0,V,J,Q,i.NEAREST),l===!0&&(Ut.length=0,z.length=0,Ut.push(i.COLOR_ATTACHMENT0+ge),E.depthBuffer&&E.resolveDepthBuffer===!1&&(Ut.push(K),z.push(K),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,z)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Ut))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ue)for(let ge=0;ge<b.length;ge++){t.bindFramebuffer(i.FRAMEBUFFER,Ae.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ge,i.RENDERBUFFER,Ae.__webglColorRenderbuffer[ge]);let tt=n.get(b[ge]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Ae.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ge,i.TEXTURE_2D,tt,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ae.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.resolveDepthBuffer===!1&&l){let b=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[b])}}}function Je(E){return Math.min(s.maxSamples,E.samples)}function je(E){let b=n.get(E);return E.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&b.__useRenderToTexture!==!1}function Ce(E){let b=a.render.frame;c.get(E)!==b&&(c.set(E,b),E.update())}function St(E,b){let V=E.colorSpace,J=E.format,Q=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||V!==Ir&&V!==es&&(nt.getTransfer(V)===mt?(J!==Xn||Q!==Li)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",V)),b}function Ee(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(h.width=E.naturalWidth||E.width,h.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(h.width=E.displayWidth,h.height=E.displayHeight):(h.width=E.width,h.height=E.height),h}this.allocateTextureUnit=P,this.resetTextureUnits=N,this.setTexture2D=H,this.setTexture2DArray=O,this.setTexture3D=Z,this.setTextureCube=G,this.rebindTextures=qe,this.setupRenderTarget=Lt,this.updateRenderTargetMipmap=et,this.updateMultisampleRenderTarget=Rn,this.setupDepthRenderbuffer=Fe,this.setupFrameBufferTexture=Se,this.useMultisampledRTT=je}function z_(i,e){function t(n,s=es){let r,a=nt.getTransfer(s);if(n===Li)return i.UNSIGNED_BYTE;if(n===ru)return i.UNSIGNED_SHORT_4_4_4_4;if(n===au)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Vf)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===zf)return i.BYTE;if(n===Hf)return i.SHORT;if(n===xa)return i.UNSIGNED_SHORT;if(n===su)return i.INT;if(n===Is)return i.UNSIGNED_INT;if(n===ci)return i.FLOAT;if(n===Ma)return i.HALF_FLOAT;if(n===Gf)return i.ALPHA;if(n===Wf)return i.RGB;if(n===Xn)return i.RGBA;if(n===qf)return i.LUMINANCE;if(n===$f)return i.LUMINANCE_ALPHA;if(n===xr)return i.DEPTH_COMPONENT;if(n===Sr)return i.DEPTH_STENCIL;if(n===ou)return i.RED;if(n===lu)return i.RED_INTEGER;if(n===Xf)return i.RG;if(n===cu)return i.RG_INTEGER;if(n===hu)return i.RGBA_INTEGER;if(n===Ro||n===Po||n===Io||n===Lo)if(a===mt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Ro)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Po)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Io)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Lo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Ro)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Po)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Io)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Lo)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Qc||n===eh||n===th||n===nh)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Qc)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===eh)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===th)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===nh)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===ih||n===sh||n===rh)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===ih||n===sh)return a===mt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===rh)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===ah||n===oh||n===lh||n===ch||n===hh||n===uh||n===dh||n===fh||n===ph||n===mh||n===gh||n===xh||n===vh||n===yh)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===ah)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===oh)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===lh)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ch)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===hh)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===uh)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===dh)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===fh)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ph)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===mh)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===gh)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===xh)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===vh)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===yh)return a===mt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Do||n===_h||n===bh)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Do)return a===mt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===_h)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===bh)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Yf||n===Mh||n===wh||n===Sh)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Do)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Mh)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===wh)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Sh)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===wr?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var Hh=class extends Zt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},Yn=class extends cn{constructor(){super(),this.isGroup=!0,this.type="Group"}},H_={type:"move"},ga=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Yn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Yn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Yn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,h=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(h&&e.hand){a=!0;for(let x of e.hand.values()){let p=t.getJointPose(x,n),f=this._getHandJoint(h,x);p!==null&&(f.matrix.fromArray(p.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=p.radius),f.visible=p!==null}let c=h.joints["index-finger-tip"],u=h.joints["thumb-tip"],d=c.position.distanceTo(u.position),m=.02,g=.005;h.inputState.pinching&&d>m+g?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!h.inputState.pinching&&d<=m-g&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(H_)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),h!==null&&(h.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Yn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},V_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,G_=`
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

}`,Vh=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){let s=new Sn,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!=n.depthNear||t.depthFar!=n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new hi({vertexShader:V_,fragmentShader:G_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new yt(new as(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Gh=class extends ss{constructor(e,t){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,h=null,c=null,u=null,d=null,m=null,g=null,x=new Vh,p=t.getContextAttributes(),f=null,w=null,S=[],v=[],I=new $e,R=null,T=new Zt;T.viewport=new gt;let C=new Zt;C.viewport=new gt;let y=[T,C],_=new Hh,L=null,N=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(X){let ie=S[X];return ie===void 0&&(ie=new ga,S[X]=ie),ie.getTargetRaySpace()},this.getControllerGrip=function(X){let ie=S[X];return ie===void 0&&(ie=new ga,S[X]=ie),ie.getGripSpace()},this.getHand=function(X){let ie=S[X];return ie===void 0&&(ie=new ga,S[X]=ie),ie.getHandSpace()};function P(X){let ie=v.indexOf(X.inputSource);if(ie===-1)return;let Se=S[ie];Se!==void 0&&(Se.update(X.inputSource,X.frame,h||a),Se.dispatchEvent({type:X.type,data:X.inputSource}))}function F(){s.removeEventListener("select",P),s.removeEventListener("selectstart",P),s.removeEventListener("selectend",P),s.removeEventListener("squeeze",P),s.removeEventListener("squeezestart",P),s.removeEventListener("squeezeend",P),s.removeEventListener("end",F),s.removeEventListener("inputsourceschange",H);for(let X=0;X<S.length;X++){let ie=v[X];ie!==null&&(v[X]=null,S[X].disconnect(ie))}L=null,N=null,x.reset(),e.setRenderTarget(f),m=null,d=null,u=null,s=null,w=null,ot.stop(),n.isPresenting=!1,e.setPixelRatio(R),e.setSize(I.width,I.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(X){r=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(X){o=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||a},this.setReferenceSpace=function(X){h=X},this.getBaseLayer=function(){return d!==null?d:m},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(X){if(s=X,s!==null){if(f=e.getRenderTarget(),s.addEventListener("select",P),s.addEventListener("selectstart",P),s.addEventListener("selectend",P),s.addEventListener("squeeze",P),s.addEventListener("squeezestart",P),s.addEventListener("squeezeend",P),s.addEventListener("end",F),s.addEventListener("inputsourceschange",H),p.xrCompatible!==!0&&await t.makeXRCompatible(),R=e.getPixelRatio(),e.getSize(I),s.renderState.layers===void 0){let ie={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,t,ie),s.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),w=new Di(m.framebufferWidth,m.framebufferHeight,{format:Xn,type:Li,colorSpace:e.outputColorSpace,stencilBuffer:p.stencil})}else{let ie=null,Se=null,he=null;p.depth&&(he=p.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ie=p.stencil?Sr:xr,Se=p.stencil?wr:Is);let Pe={colorFormat:t.RGBA8,depthFormat:he,scaleFactor:r};u=new XRWebGLBinding(s,t),d=u.createProjectionLayer(Pe),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),w=new Di(d.textureWidth,d.textureHeight,{format:Xn,type:Li,depthTexture:new qo(d.textureWidth,d.textureHeight,Se,void 0,void 0,void 0,void 0,void 0,void 0,ie),stencilBuffer:p.stencil,colorSpace:e.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}w.isXRRenderTarget=!0,this.setFoveation(l),h=null,a=await s.requestReferenceSpace(o),ot.setContext(s),ot.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function H(X){for(let ie=0;ie<X.removed.length;ie++){let Se=X.removed[ie],he=v.indexOf(Se);he>=0&&(v[he]=null,S[he].disconnect(Se))}for(let ie=0;ie<X.added.length;ie++){let Se=X.added[ie],he=v.indexOf(Se);if(he===-1){for(let Fe=0;Fe<S.length;Fe++)if(Fe>=v.length){v.push(Se),he=Fe;break}else if(v[Fe]===null){v[Fe]=Se,he=Fe;break}if(he===-1)break}let Pe=S[he];Pe&&Pe.connect(Se)}}let O=new D,Z=new D;function G(X,ie,Se){O.setFromMatrixPosition(ie.matrixWorld),Z.setFromMatrixPosition(Se.matrixWorld);let he=O.distanceTo(Z),Pe=ie.projectionMatrix.elements,Fe=Se.projectionMatrix.elements,qe=Pe[14]/(Pe[10]-1),Lt=Pe[14]/(Pe[10]+1),et=(Pe[9]+1)/Pe[5],Ut=(Pe[9]-1)/Pe[5],z=(Pe[8]-1)/Pe[0],Rn=(Fe[8]+1)/Fe[0],Je=qe*z,je=qe*Rn,Ce=he/(-z+Rn),St=Ce*-z;if(ie.matrixWorld.decompose(X.position,X.quaternion,X.scale),X.translateX(St),X.translateZ(Ce),X.matrixWorld.compose(X.position,X.quaternion,X.scale),X.matrixWorldInverse.copy(X.matrixWorld).invert(),Pe[10]===-1)X.projectionMatrix.copy(ie.projectionMatrix),X.projectionMatrixInverse.copy(ie.projectionMatrixInverse);else{let Ee=qe+Ce,E=Lt+Ce,b=Je-St,V=je+(he-St),J=et*Lt/E*Ee,Q=Ut*Lt/E*Ee;X.projectionMatrix.makePerspective(b,V,J,Q,Ee,E),X.projectionMatrixInverse.copy(X.projectionMatrix).invert()}}function ae(X,ie){ie===null?X.matrixWorld.copy(X.matrix):X.matrixWorld.multiplyMatrices(ie.matrixWorld,X.matrix),X.matrixWorldInverse.copy(X.matrixWorld).invert()}this.updateCamera=function(X){if(s===null)return;let ie=X.near,Se=X.far;x.texture!==null&&(x.depthNear>0&&(ie=x.depthNear),x.depthFar>0&&(Se=x.depthFar)),_.near=C.near=T.near=ie,_.far=C.far=T.far=Se,(L!==_.near||N!==_.far)&&(s.updateRenderState({depthNear:_.near,depthFar:_.far}),L=_.near,N=_.far),T.layers.mask=X.layers.mask|2,C.layers.mask=X.layers.mask|4,_.layers.mask=T.layers.mask|C.layers.mask;let he=X.parent,Pe=_.cameras;ae(_,he);for(let Fe=0;Fe<Pe.length;Fe++)ae(Pe[Fe],he);Pe.length===2?G(_,T,C):_.projectionMatrix.copy(T.projectionMatrix),ee(X,_,he)};function ee(X,ie,Se){Se===null?X.matrix.copy(ie.matrixWorld):(X.matrix.copy(Se.matrixWorld),X.matrix.invert(),X.matrix.multiply(ie.matrixWorld)),X.matrix.decompose(X.position,X.quaternion,X.scale),X.updateMatrixWorld(!0),X.projectionMatrix.copy(ie.projectionMatrix),X.projectionMatrixInverse.copy(ie.projectionMatrixInverse),X.isPerspectiveCamera&&(X.fov=Th*2*Math.atan(1/X.projectionMatrix.elements[5]),X.zoom=1)}this.getCamera=function(){return _},this.getFoveation=function(){if(!(d===null&&m===null))return l},this.setFoveation=function(X){l=X,d!==null&&(d.fixedFoveation=X),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=X)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(_)};let me=null;function ke(X,ie){if(c=ie.getViewerPose(h||a),g=ie,c!==null){let Se=c.views;m!==null&&(e.setRenderTargetFramebuffer(w,m.framebuffer),e.setRenderTarget(w));let he=!1;Se.length!==_.cameras.length&&(_.cameras.length=0,he=!0);for(let Fe=0;Fe<Se.length;Fe++){let qe=Se[Fe],Lt=null;if(m!==null)Lt=m.getViewport(qe);else{let Ut=u.getViewSubImage(d,qe);Lt=Ut.viewport,Fe===0&&(e.setRenderTargetTextures(w,Ut.colorTexture,d.ignoreDepthValues?void 0:Ut.depthStencilTexture),e.setRenderTarget(w))}let et=y[Fe];et===void 0&&(et=new Zt,et.layers.enable(Fe),et.viewport=new gt,y[Fe]=et),et.matrix.fromArray(qe.transform.matrix),et.matrix.decompose(et.position,et.quaternion,et.scale),et.projectionMatrix.fromArray(qe.projectionMatrix),et.projectionMatrixInverse.copy(et.projectionMatrix).invert(),et.viewport.set(Lt.x,Lt.y,Lt.width,Lt.height),Fe===0&&(_.matrix.copy(et.matrix),_.matrix.decompose(_.position,_.quaternion,_.scale)),he===!0&&_.cameras.push(et)}let Pe=s.enabledFeatures;if(Pe&&Pe.includes("depth-sensing")){let Fe=u.getDepthInformation(Se[0]);Fe&&Fe.isValid&&Fe.texture&&x.init(e,Fe,s.renderState)}}for(let Se=0;Se<S.length;Se++){let he=v[Se],Pe=S[Se];he!==null&&Pe!==void 0&&Pe.update(he,ie,h||a)}me&&me(X,ie),ie.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ie}),g=null}let ot=new Qf;ot.setAnimationLoop(ke),this.setAnimationLoop=function(X){me=X},this.dispose=function(){}}},ws=new Vt,W_=new Ve;function q_(i,e){function t(p,f){p.matrixAutoUpdate===!0&&p.updateMatrix(),f.value.copy(p.matrix)}function n(p,f){f.color.getRGB(p.fogColor.value,jf(i)),f.isFog?(p.fogNear.value=f.near,p.fogFar.value=f.far):f.isFogExp2&&(p.fogDensity.value=f.density)}function s(p,f,w,S,v){f.isMeshBasicMaterial||f.isMeshLambertMaterial?r(p,f):f.isMeshToonMaterial?(r(p,f),u(p,f)):f.isMeshPhongMaterial?(r(p,f),c(p,f)):f.isMeshStandardMaterial?(r(p,f),d(p,f),f.isMeshPhysicalMaterial&&m(p,f,v)):f.isMeshMatcapMaterial?(r(p,f),g(p,f)):f.isMeshDepthMaterial?r(p,f):f.isMeshDistanceMaterial?(r(p,f),x(p,f)):f.isMeshNormalMaterial?r(p,f):f.isLineBasicMaterial?(a(p,f),f.isLineDashedMaterial&&o(p,f)):f.isPointsMaterial?l(p,f,w,S):f.isSpriteMaterial?h(p,f):f.isShadowMaterial?(p.color.value.copy(f.color),p.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(p,f){p.opacity.value=f.opacity,f.color&&p.diffuse.value.copy(f.color),f.emissive&&p.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(p.map.value=f.map,t(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.bumpMap&&(p.bumpMap.value=f.bumpMap,t(f.bumpMap,p.bumpMapTransform),p.bumpScale.value=f.bumpScale,f.side===gn&&(p.bumpScale.value*=-1)),f.normalMap&&(p.normalMap.value=f.normalMap,t(f.normalMap,p.normalMapTransform),p.normalScale.value.copy(f.normalScale),f.side===gn&&p.normalScale.value.negate()),f.displacementMap&&(p.displacementMap.value=f.displacementMap,t(f.displacementMap,p.displacementMapTransform),p.displacementScale.value=f.displacementScale,p.displacementBias.value=f.displacementBias),f.emissiveMap&&(p.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,p.emissiveMapTransform)),f.specularMap&&(p.specularMap.value=f.specularMap,t(f.specularMap,p.specularMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest);let w=e.get(f),S=w.envMap,v=w.envMapRotation;S&&(p.envMap.value=S,ws.copy(v),ws.x*=-1,ws.y*=-1,ws.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(ws.y*=-1,ws.z*=-1),p.envMapRotation.value.setFromMatrix4(W_.makeRotationFromEuler(ws)),p.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=f.reflectivity,p.ior.value=f.ior,p.refractionRatio.value=f.refractionRatio),f.lightMap&&(p.lightMap.value=f.lightMap,p.lightMapIntensity.value=f.lightMapIntensity,t(f.lightMap,p.lightMapTransform)),f.aoMap&&(p.aoMap.value=f.aoMap,p.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,p.aoMapTransform))}function a(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,f.map&&(p.map.value=f.map,t(f.map,p.mapTransform))}function o(p,f){p.dashSize.value=f.dashSize,p.totalSize.value=f.dashSize+f.gapSize,p.scale.value=f.scale}function l(p,f,w,S){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.size.value=f.size*w,p.scale.value=S*.5,f.map&&(p.map.value=f.map,t(f.map,p.uvTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function h(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.rotation.value=f.rotation,f.map&&(p.map.value=f.map,t(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function c(p,f){p.specular.value.copy(f.specular),p.shininess.value=Math.max(f.shininess,1e-4)}function u(p,f){f.gradientMap&&(p.gradientMap.value=f.gradientMap)}function d(p,f){p.metalness.value=f.metalness,f.metalnessMap&&(p.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,p.metalnessMapTransform)),p.roughness.value=f.roughness,f.roughnessMap&&(p.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,p.roughnessMapTransform)),f.envMap&&(p.envMapIntensity.value=f.envMapIntensity)}function m(p,f,w){p.ior.value=f.ior,f.sheen>0&&(p.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),p.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(p.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,p.sheenColorMapTransform)),f.sheenRoughnessMap&&(p.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,p.sheenRoughnessMapTransform))),f.clearcoat>0&&(p.clearcoat.value=f.clearcoat,p.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(p.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,p.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(p.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===gn&&p.clearcoatNormalScale.value.negate())),f.dispersion>0&&(p.dispersion.value=f.dispersion),f.iridescence>0&&(p.iridescence.value=f.iridescence,p.iridescenceIOR.value=f.iridescenceIOR,p.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(p.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,p.iridescenceMapTransform)),f.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),f.transmission>0&&(p.transmission.value=f.transmission,p.transmissionSamplerMap.value=w.texture,p.transmissionSamplerSize.value.set(w.width,w.height),f.transmissionMap&&(p.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,p.transmissionMapTransform)),p.thickness.value=f.thickness,f.thicknessMap&&(p.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=f.attenuationDistance,p.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(p.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(p.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=f.specularIntensity,p.specularColor.value.copy(f.specularColor),f.specularColorMap&&(p.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,p.specularColorMapTransform)),f.specularIntensityMap&&(p.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,f){f.matcap&&(p.matcap.value=f.matcap)}function x(p,f){let w=e.get(f).light;p.referencePosition.value.setFromMatrixPosition(w.matrixWorld),p.nearDistance.value=w.shadow.camera.near,p.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function $_(i,e,t,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(w,S){let v=S.program;n.uniformBlockBinding(w,v)}function h(w,S){let v=s[w.id];v===void 0&&(g(w),v=c(w),s[w.id]=v,w.addEventListener("dispose",p));let I=S.program;n.updateUBOMapping(w,I);let R=e.render.frame;r[w.id]!==R&&(d(w),r[w.id]=R)}function c(w){let S=u();w.__bindingPointIndex=S;let v=i.createBuffer(),I=w.__size,R=w.usage;return i.bindBuffer(i.UNIFORM_BUFFER,v),i.bufferData(i.UNIFORM_BUFFER,I,R),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,S,v),v}function u(){for(let w=0;w<o;w++)if(a.indexOf(w)===-1)return a.push(w),w;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(w){let S=s[w.id],v=w.uniforms,I=w.__cache;i.bindBuffer(i.UNIFORM_BUFFER,S);for(let R=0,T=v.length;R<T;R++){let C=Array.isArray(v[R])?v[R]:[v[R]];for(let y=0,_=C.length;y<_;y++){let L=C[y];if(m(L,R,y,I)===!0){let N=L.__offset,P=Array.isArray(L.value)?L.value:[L.value],F=0;for(let H=0;H<P.length;H++){let O=P[H],Z=x(O);typeof O=="number"||typeof O=="boolean"?(L.__data[0]=O,i.bufferSubData(i.UNIFORM_BUFFER,N+F,L.__data)):O.isMatrix3?(L.__data[0]=O.elements[0],L.__data[1]=O.elements[1],L.__data[2]=O.elements[2],L.__data[3]=0,L.__data[4]=O.elements[3],L.__data[5]=O.elements[4],L.__data[6]=O.elements[5],L.__data[7]=0,L.__data[8]=O.elements[6],L.__data[9]=O.elements[7],L.__data[10]=O.elements[8],L.__data[11]=0):(O.toArray(L.__data,F),F+=Z.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,N,L.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(w,S,v,I){let R=w.value,T=S+"_"+v;if(I[T]===void 0)return typeof R=="number"||typeof R=="boolean"?I[T]=R:I[T]=R.clone(),!0;{let C=I[T];if(typeof R=="number"||typeof R=="boolean"){if(C!==R)return I[T]=R,!0}else if(C.equals(R)===!1)return C.copy(R),!0}return!1}function g(w){let S=w.uniforms,v=0,I=16;for(let T=0,C=S.length;T<C;T++){let y=Array.isArray(S[T])?S[T]:[S[T]];for(let _=0,L=y.length;_<L;_++){let N=y[_],P=Array.isArray(N.value)?N.value:[N.value];for(let F=0,H=P.length;F<H;F++){let O=P[F],Z=x(O),G=v%I,ae=G%Z.boundary,ee=G+ae;v+=ae,ee!==0&&I-ee<Z.storage&&(v+=I-ee),N.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),N.__offset=v,v+=Z.storage}}}let R=v%I;return R>0&&(v+=I-R),w.__size=v,w.__cache={},this}function x(w){let S={boundary:0,storage:0};return typeof w=="number"||typeof w=="boolean"?(S.boundary=4,S.storage=4):w.isVector2?(S.boundary=8,S.storage=8):w.isVector3||w.isColor?(S.boundary=16,S.storage=12):w.isVector4?(S.boundary=16,S.storage=16):w.isMatrix3?(S.boundary=48,S.storage=48):w.isMatrix4?(S.boundary=64,S.storage=64):w.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",w),S}function p(w){let S=w.target;S.removeEventListener("dispose",p);let v=a.indexOf(S.__bindingPointIndex);a.splice(v,1),i.deleteBuffer(s[S.id]),delete s[S.id],delete r[S.id]}function f(){for(let w in s)i.deleteBuffer(s[w]);a=[],s={},r={}}return{bind:l,update:h,dispose:f}}var Er=class{constructor(e={}){let{canvas:t=Zg(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:h=!1,powerPreference:c="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=a;let g=new Uint32Array(4),x=new Int32Array(4),p=null,f=null,w=[],S=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ln,this.toneMapping=ns,this.toneMappingExposure=1;let v=this,I=!1,R=0,T=0,C=null,y=-1,_=null,L=new gt,N=new gt,P=null,F=new le(0),H=0,O=t.width,Z=t.height,G=1,ae=null,ee=null,me=new gt(0,0,O,Z),ke=new gt(0,0,O,Z),ot=!1,X=new va,ie=!1,Se=!1,he=new Ve,Pe=new Ve,Fe=new D,qe=new gt,Lt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},et=!1;function Ut(){return C===null?G:1}let z=n;function Rn(M,k){return t.getContext(M,k)}try{let M={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:h,powerPreference:c,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine","three.js r170"),t.addEventListener("webglcontextlost",j,!1),t.addEventListener("webglcontextrestored",pe,!1),t.addEventListener("webglcontextcreationerror",de,!1),z===null){let k="webgl2";if(z=Rn(k,M),z===null)throw Rn(k)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let Je,je,Ce,St,Ee,E,b,V,J,Q,K,Ae,ue,ge,tt,te,ve,Re,De,ye,Qe,ze,bt,U;function ce(){Je=new ly(z),Je.init(),ze=new z_(z,Je),je=new ny(z,Je,e,ze),Ce=new F_(z,Je),je.reverseDepthBuffer&&d&&Ce.buffers.depth.setReversed(!0),St=new uy(z),Ee=new S_,E=new O_(z,Je,Ce,Ee,je,ze,St),b=new sy(v),V=new oy(v),J=new v0(z),bt=new ey(z,J),Q=new cy(z,J,St,bt),K=new fy(z,Q,J,St),De=new dy(z,je,E),te=new iy(Ee),Ae=new w_(v,b,V,Je,je,bt,te),ue=new q_(v,Ee),ge=new T_,tt=new L_(Je),Re=new Qv(v,b,V,Ce,K,m,l),ve=new U_(v,K,je),U=new $_(z,St,je,Ce),ye=new ty(z,Je,St),Qe=new hy(z,Je,St),St.programs=Ae.programs,v.capabilities=je,v.extensions=Je,v.properties=Ee,v.renderLists=ge,v.shadowMap=ve,v.state=Ce,v.info=St}ce();let $=new Gh(v,z);this.xr=$,this.getContext=function(){return z},this.getContextAttributes=function(){return z.getContextAttributes()},this.forceContextLoss=function(){let M=Je.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){let M=Je.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return G},this.setPixelRatio=function(M){M!==void 0&&(G=M,this.setSize(O,Z,!1))},this.getSize=function(M){return M.set(O,Z)},this.setSize=function(M,k,W=!0){if($.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}O=M,Z=k,t.width=Math.floor(M*G),t.height=Math.floor(k*G),W===!0&&(t.style.width=M+"px",t.style.height=k+"px"),this.setViewport(0,0,M,k)},this.getDrawingBufferSize=function(M){return M.set(O*G,Z*G).floor()},this.setDrawingBufferSize=function(M,k,W){O=M,Z=k,G=W,t.width=Math.floor(M*W),t.height=Math.floor(k*W),this.setViewport(0,0,M,k)},this.getCurrentViewport=function(M){return M.copy(L)},this.getViewport=function(M){return M.copy(me)},this.setViewport=function(M,k,W,q){M.isVector4?me.set(M.x,M.y,M.z,M.w):me.set(M,k,W,q),Ce.viewport(L.copy(me).multiplyScalar(G).round())},this.getScissor=function(M){return M.copy(ke)},this.setScissor=function(M,k,W,q){M.isVector4?ke.set(M.x,M.y,M.z,M.w):ke.set(M,k,W,q),Ce.scissor(N.copy(ke).multiplyScalar(G).round())},this.getScissorTest=function(){return ot},this.setScissorTest=function(M){Ce.setScissorTest(ot=M)},this.setOpaqueSort=function(M){ae=M},this.setTransparentSort=function(M){ee=M},this.getClearColor=function(M){return M.copy(Re.getClearColor())},this.setClearColor=function(){Re.setClearColor.apply(Re,arguments)},this.getClearAlpha=function(){return Re.getClearAlpha()},this.setClearAlpha=function(){Re.setClearAlpha.apply(Re,arguments)},this.clear=function(M=!0,k=!0,W=!0){let q=0;if(M){let B=!1;if(C!==null){let ne=C.texture.format;B=ne===hu||ne===cu||ne===lu}if(B){let ne=C.texture.type,fe=ne===Li||ne===Is||ne===xa||ne===wr||ne===ru||ne===au,be=Re.getClearColor(),Me=Re.getClearAlpha(),Ne=be.r,Oe=be.g,we=be.b;fe?(g[0]=Ne,g[1]=Oe,g[2]=we,g[3]=Me,z.clearBufferuiv(z.COLOR,0,g)):(x[0]=Ne,x[1]=Oe,x[2]=we,x[3]=Me,z.clearBufferiv(z.COLOR,0,x))}else q|=z.COLOR_BUFFER_BIT}k&&(q|=z.DEPTH_BUFFER_BIT),W&&(q|=z.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),z.clear(q)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",j,!1),t.removeEventListener("webglcontextrestored",pe,!1),t.removeEventListener("webglcontextcreationerror",de,!1),ge.dispose(),tt.dispose(),Ee.dispose(),b.dispose(),V.dispose(),K.dispose(),bt.dispose(),U.dispose(),Ae.dispose(),$.dispose(),$.removeEventListener("sessionstart",ud),$.removeEventListener("sessionend",dd),ps.stop()};function j(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),I=!0}function pe(){console.log("THREE.WebGLRenderer: Context Restored."),I=!1;let M=St.autoReset,k=ve.enabled,W=ve.autoUpdate,q=ve.needsUpdate,B=ve.type;ce(),St.autoReset=M,ve.enabled=k,ve.autoUpdate=W,ve.needsUpdate=q,ve.type=B}function de(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function Be(M){let k=M.target;k.removeEventListener("dispose",Be),Nt(k)}function Nt(M){nn(M),Ee.remove(M)}function nn(M){let k=Ee.get(M).programs;k!==void 0&&(k.forEach(function(W){Ae.releaseProgram(W)}),M.isShaderMaterial&&Ae.releaseShaderCache(M))}this.renderBufferDirect=function(M,k,W,q,B,ne){k===null&&(k=Lt);let fe=B.isMesh&&B.matrixWorld.determinant()<0,be=Rm(M,k,W,q,B);Ce.setMaterial(q,fe);let Me=W.index,Ne=1;if(q.wireframe===!0){if(Me=Q.getWireframeAttribute(W),Me===void 0)return;Ne=2}let Oe=W.drawRange,we=W.attributes.position,at=Oe.start*Ne,Mt=(Oe.start+Oe.count)*Ne;ne!==null&&(at=Math.max(at,ne.start*Ne),Mt=Math.min(Mt,(ne.start+ne.count)*Ne)),Me!==null?(at=Math.max(at,0),Mt=Math.min(Mt,Me.count)):we!=null&&(at=Math.max(at,0),Mt=Math.min(Mt,we.count));let At=Mt-at;if(At<0||At===1/0)return;bt.setup(B,q,be,W,Me);let dn,lt=ye;if(Me!==null&&(dn=J.get(Me),lt=Qe,lt.setIndex(dn)),B.isMesh)q.wireframe===!0?(Ce.setLineWidth(q.wireframeLinewidth*Ut()),lt.setMode(z.LINES)):lt.setMode(z.TRIANGLES);else if(B.isLine){let Te=q.linewidth;Te===void 0&&(Te=1),Ce.setLineWidth(Te*Ut()),B.isLineSegments?lt.setMode(z.LINES):B.isLineLoop?lt.setMode(z.LINE_LOOP):lt.setMode(z.LINE_STRIP)}else B.isPoints?lt.setMode(z.POINTS):B.isSprite&&lt.setMode(z.TRIANGLES);if(B.isBatchedMesh)if(B._multiDrawInstances!==null)lt.renderMultiDrawInstances(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount,B._multiDrawInstances);else if(Je.get("WEBGL_multi_draw"))lt.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{let Te=B._multiDrawStarts,Mi=B._multiDrawCounts,ct=B._multiDrawCount,Gn=Me?J.get(Me).bytesPerElement:1,Zs=Ee.get(q).currentProgram.getUniforms();for(let yn=0;yn<ct;yn++)Zs.setValue(z,"_gl_DrawID",yn),lt.render(Te[yn]/Gn,Mi[yn])}else if(B.isInstancedMesh)lt.renderInstances(at,At,B.count);else if(W.isInstancedBufferGeometry){let Te=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,Mi=Math.min(W.instanceCount,Te);lt.renderInstances(at,At,Mi)}else lt.render(at,At)};function ft(M,k,W){M.transparent===!0&&M.side===Dn&&M.forceSinglePass===!1?(M.side=gn,M.needsUpdate=!0,ja(M,k,W),M.side=is,M.needsUpdate=!0,ja(M,k,W),M.side=Dn):ja(M,k,W)}this.compile=function(M,k,W=null){W===null&&(W=M),f=tt.get(W),f.init(k),S.push(f),W.traverseVisible(function(B){B.isLight&&B.layers.test(k.layers)&&(f.pushLight(B),B.castShadow&&f.pushShadow(B))}),M!==W&&M.traverseVisible(function(B){B.isLight&&B.layers.test(k.layers)&&(f.pushLight(B),B.castShadow&&f.pushShadow(B))}),f.setupLights();let q=new Set;return M.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;let ne=B.material;if(ne)if(Array.isArray(ne))for(let fe=0;fe<ne.length;fe++){let be=ne[fe];ft(be,W,B),q.add(be)}else ft(ne,W,B),q.add(ne)}),S.pop(),f=null,q},this.compileAsync=function(M,k,W=null){let q=this.compile(M,k,W);return new Promise(B=>{function ne(){if(q.forEach(function(fe){Ee.get(fe).currentProgram.isReady()&&q.delete(fe)}),q.size===0){B(M);return}setTimeout(ne,10)}Je.get("KHR_parallel_shader_compile")!==null?ne():setTimeout(ne,10)})};let Vn=null;function bi(M){Vn&&Vn(M)}function ud(){ps.stop()}function dd(){ps.start()}let ps=new Qf;ps.setAnimationLoop(bi),typeof self<"u"&&ps.setContext(self),this.setAnimationLoop=function(M){Vn=M,$.setAnimationLoop(M),M===null?ps.stop():ps.start()},$.addEventListener("sessionstart",ud),$.addEventListener("sessionend",dd),this.render=function(M,k){if(k!==void 0&&k.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),k.parent===null&&k.matrixWorldAutoUpdate===!0&&k.updateMatrixWorld(),$.enabled===!0&&$.isPresenting===!0&&($.cameraAutoUpdate===!0&&$.updateCamera(k),k=$.getCamera()),M.isScene===!0&&M.onBeforeRender(v,M,k,C),f=tt.get(M,S.length),f.init(k),S.push(f),Pe.multiplyMatrices(k.projectionMatrix,k.matrixWorldInverse),X.setFromProjectionMatrix(Pe),Se=this.localClippingEnabled,ie=te.init(this.clippingPlanes,Se),p=ge.get(M,w.length),p.init(),w.push(p),$.enabled===!0&&$.isPresenting===!0){let ne=v.xr.getDepthSensingMesh();ne!==null&&nc(ne,k,-1/0,v.sortObjects)}nc(M,k,0,v.sortObjects),p.finish(),v.sortObjects===!0&&p.sort(ae,ee),et=$.enabled===!1||$.isPresenting===!1||$.hasDepthSensing()===!1,et&&Re.addToRenderList(p,M),this.info.render.frame++,ie===!0&&te.beginShadows();let W=f.state.shadowsArray;ve.render(W,M,k),ie===!0&&te.endShadows(),this.info.autoReset===!0&&this.info.reset();let q=p.opaque,B=p.transmissive;if(f.setupLights(),k.isArrayCamera){let ne=k.cameras;if(B.length>0)for(let fe=0,be=ne.length;fe<be;fe++){let Me=ne[fe];pd(q,B,M,Me)}et&&Re.render(M);for(let fe=0,be=ne.length;fe<be;fe++){let Me=ne[fe];fd(p,M,Me,Me.viewport)}}else B.length>0&&pd(q,B,M,k),et&&Re.render(M),fd(p,M,k);C!==null&&(E.updateMultisampleRenderTarget(C),E.updateRenderTargetMipmap(C)),M.isScene===!0&&M.onAfterRender(v,M,k),bt.resetDefaultState(),y=-1,_=null,S.pop(),S.length>0?(f=S[S.length-1],ie===!0&&te.setGlobalState(v.clippingPlanes,f.state.camera)):f=null,w.pop(),w.length>0?p=w[w.length-1]:p=null};function nc(M,k,W,q){if(M.visible===!1)return;if(M.layers.test(k.layers)){if(M.isGroup)W=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(k);else if(M.isLight)f.pushLight(M),M.castShadow&&f.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||X.intersectsSprite(M)){q&&qe.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Pe);let fe=K.update(M),be=M.material;be.visible&&p.push(M,fe,be,W,qe.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||X.intersectsObject(M))){let fe=K.update(M),be=M.material;if(q&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),qe.copy(M.boundingSphere.center)):(fe.boundingSphere===null&&fe.computeBoundingSphere(),qe.copy(fe.boundingSphere.center)),qe.applyMatrix4(M.matrixWorld).applyMatrix4(Pe)),Array.isArray(be)){let Me=fe.groups;for(let Ne=0,Oe=Me.length;Ne<Oe;Ne++){let we=Me[Ne],at=be[we.materialIndex];at&&at.visible&&p.push(M,fe,at,W,qe.z,we)}}else be.visible&&p.push(M,fe,be,W,qe.z,null)}}let ne=M.children;for(let fe=0,be=ne.length;fe<be;fe++)nc(ne[fe],k,W,q)}function fd(M,k,W,q){let B=M.opaque,ne=M.transmissive,fe=M.transparent;f.setupLightsView(W),ie===!0&&te.setGlobalState(v.clippingPlanes,W),q&&Ce.viewport(L.copy(q)),B.length>0&&Ja(B,k,W),ne.length>0&&Ja(ne,k,W),fe.length>0&&Ja(fe,k,W),Ce.buffers.depth.setTest(!0),Ce.buffers.depth.setMask(!0),Ce.buffers.color.setMask(!0),Ce.setPolygonOffset(!1)}function pd(M,k,W,q){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[q.id]===void 0&&(f.state.transmissionRenderTarget[q.id]=new Di(1,1,{generateMipmaps:!0,type:Je.has("EXT_color_buffer_half_float")||Je.has("EXT_color_buffer_float")?Ma:Li,minFilter:Rs,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:nt.workingColorSpace}));let ne=f.state.transmissionRenderTarget[q.id],fe=q.viewport||L;ne.setSize(fe.z,fe.w);let be=v.getRenderTarget();v.setRenderTarget(ne),v.getClearColor(F),H=v.getClearAlpha(),H<1&&v.setClearColor(16777215,.5),v.clear(),et&&Re.render(W);let Me=v.toneMapping;v.toneMapping=ns;let Ne=q.viewport;if(q.viewport!==void 0&&(q.viewport=void 0),f.setupLightsView(q),ie===!0&&te.setGlobalState(v.clippingPlanes,q),Ja(M,W,q),E.updateMultisampleRenderTarget(ne),E.updateRenderTargetMipmap(ne),Je.has("WEBGL_multisampled_render_to_texture")===!1){let Oe=!1;for(let we=0,at=k.length;we<at;we++){let Mt=k[we],At=Mt.object,dn=Mt.geometry,lt=Mt.material,Te=Mt.group;if(lt.side===Dn&&At.layers.test(q.layers)){let Mi=lt.side;lt.side=gn,lt.needsUpdate=!0,md(At,W,q,dn,lt,Te),lt.side=Mi,lt.needsUpdate=!0,Oe=!0}}Oe===!0&&(E.updateMultisampleRenderTarget(ne),E.updateRenderTargetMipmap(ne))}v.setRenderTarget(be),v.setClearColor(F,H),Ne!==void 0&&(q.viewport=Ne),v.toneMapping=Me}function Ja(M,k,W){let q=k.isScene===!0?k.overrideMaterial:null;for(let B=0,ne=M.length;B<ne;B++){let fe=M[B],be=fe.object,Me=fe.geometry,Ne=q===null?fe.material:q,Oe=fe.group;be.layers.test(W.layers)&&md(be,k,W,Me,Ne,Oe)}}function md(M,k,W,q,B,ne){M.onBeforeRender(v,k,W,q,B,ne),M.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),B.onBeforeRender(v,k,W,q,M,ne),B.transparent===!0&&B.side===Dn&&B.forceSinglePass===!1?(B.side=gn,B.needsUpdate=!0,v.renderBufferDirect(W,k,q,B,M,ne),B.side=is,B.needsUpdate=!0,v.renderBufferDirect(W,k,q,B,M,ne),B.side=Dn):v.renderBufferDirect(W,k,q,B,M,ne),M.onAfterRender(v,k,W,q,B,ne)}function ja(M,k,W){k.isScene!==!0&&(k=Lt);let q=Ee.get(M),B=f.state.lights,ne=f.state.shadowsArray,fe=B.state.version,be=Ae.getParameters(M,B.state,ne,k,W),Me=Ae.getProgramCacheKey(be),Ne=q.programs;q.environment=M.isMeshStandardMaterial?k.environment:null,q.fog=k.fog,q.envMap=(M.isMeshStandardMaterial?V:b).get(M.envMap||q.environment),q.envMapRotation=q.environment!==null&&M.envMap===null?k.environmentRotation:M.envMapRotation,Ne===void 0&&(M.addEventListener("dispose",Be),Ne=new Map,q.programs=Ne);let Oe=Ne.get(Me);if(Oe!==void 0){if(q.currentProgram===Oe&&q.lightsStateVersion===fe)return xd(M,be),Oe}else be.uniforms=Ae.getUniforms(M),M.onBeforeCompile(be,v),Oe=Ae.acquireProgram(be,Me),Ne.set(Me,Oe),q.uniforms=be.uniforms;let we=q.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(we.clippingPlanes=te.uniform),xd(M,be),q.needsLights=Im(M),q.lightsStateVersion=fe,q.needsLights&&(we.ambientLightColor.value=B.state.ambient,we.lightProbe.value=B.state.probe,we.directionalLights.value=B.state.directional,we.directionalLightShadows.value=B.state.directionalShadow,we.spotLights.value=B.state.spot,we.spotLightShadows.value=B.state.spotShadow,we.rectAreaLights.value=B.state.rectArea,we.ltc_1.value=B.state.rectAreaLTC1,we.ltc_2.value=B.state.rectAreaLTC2,we.pointLights.value=B.state.point,we.pointLightShadows.value=B.state.pointShadow,we.hemisphereLights.value=B.state.hemi,we.directionalShadowMap.value=B.state.directionalShadowMap,we.directionalShadowMatrix.value=B.state.directionalShadowMatrix,we.spotShadowMap.value=B.state.spotShadowMap,we.spotLightMatrix.value=B.state.spotLightMatrix,we.spotLightMap.value=B.state.spotLightMap,we.pointShadowMap.value=B.state.pointShadowMap,we.pointShadowMatrix.value=B.state.pointShadowMatrix),q.currentProgram=Oe,q.uniformsList=null,Oe}function gd(M){if(M.uniformsList===null){let k=M.currentProgram.getUniforms();M.uniformsList=yr.seqWithValue(k.seq,M.uniforms)}return M.uniformsList}function xd(M,k){let W=Ee.get(M);W.outputColorSpace=k.outputColorSpace,W.batching=k.batching,W.batchingColor=k.batchingColor,W.instancing=k.instancing,W.instancingColor=k.instancingColor,W.instancingMorph=k.instancingMorph,W.skinning=k.skinning,W.morphTargets=k.morphTargets,W.morphNormals=k.morphNormals,W.morphColors=k.morphColors,W.morphTargetsCount=k.morphTargetsCount,W.numClippingPlanes=k.numClippingPlanes,W.numIntersection=k.numClipIntersection,W.vertexAlphas=k.vertexAlphas,W.vertexTangents=k.vertexTangents,W.toneMapping=k.toneMapping}function Rm(M,k,W,q,B){k.isScene!==!0&&(k=Lt),E.resetTextureUnits();let ne=k.fog,fe=q.isMeshStandardMaterial?k.environment:null,be=C===null?v.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:Ir,Me=(q.isMeshStandardMaterial?V:b).get(q.envMap||fe),Ne=q.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Oe=!!W.attributes.tangent&&(!!q.normalMap||q.anisotropy>0),we=!!W.morphAttributes.position,at=!!W.morphAttributes.normal,Mt=!!W.morphAttributes.color,At=ns;q.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(At=v.toneMapping);let dn=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,lt=dn!==void 0?dn.length:0,Te=Ee.get(q),Mi=f.state.lights;if(ie===!0&&(Se===!0||M!==_)){let Pn=M===_&&q.id===y;te.setState(q,M,Pn)}let ct=!1;q.version===Te.__version?(Te.needsLights&&Te.lightsStateVersion!==Mi.state.version||Te.outputColorSpace!==be||B.isBatchedMesh&&Te.batching===!1||!B.isBatchedMesh&&Te.batching===!0||B.isBatchedMesh&&Te.batchingColor===!0&&B.colorTexture===null||B.isBatchedMesh&&Te.batchingColor===!1&&B.colorTexture!==null||B.isInstancedMesh&&Te.instancing===!1||!B.isInstancedMesh&&Te.instancing===!0||B.isSkinnedMesh&&Te.skinning===!1||!B.isSkinnedMesh&&Te.skinning===!0||B.isInstancedMesh&&Te.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&Te.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&Te.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&Te.instancingMorph===!1&&B.morphTexture!==null||Te.envMap!==Me||q.fog===!0&&Te.fog!==ne||Te.numClippingPlanes!==void 0&&(Te.numClippingPlanes!==te.numPlanes||Te.numIntersection!==te.numIntersection)||Te.vertexAlphas!==Ne||Te.vertexTangents!==Oe||Te.morphTargets!==we||Te.morphNormals!==at||Te.morphColors!==Mt||Te.toneMapping!==At||Te.morphTargetsCount!==lt)&&(ct=!0):(ct=!0,Te.__version=q.version);let Gn=Te.currentProgram;ct===!0&&(Gn=ja(q,k,B));let Zs=!1,yn=!1,Yr=!1,Tt=Gn.getUniforms(),si=Te.uniforms;if(Ce.useProgram(Gn.program)&&(Zs=!0,yn=!0,Yr=!0),q.id!==y&&(y=q.id,yn=!0),Zs||_!==M){Ce.buffers.depth.getReversed()?(he.copy(M.projectionMatrix),jg(he),Qg(he),Tt.setValue(z,"projectionMatrix",he)):Tt.setValue(z,"projectionMatrix",M.projectionMatrix),Tt.setValue(z,"viewMatrix",M.matrixWorldInverse);let Gi=Tt.map.cameraPosition;Gi!==void 0&&Gi.setValue(z,Fe.setFromMatrixPosition(M.matrixWorld)),je.logarithmicDepthBuffer&&Tt.setValue(z,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(q.isMeshPhongMaterial||q.isMeshToonMaterial||q.isMeshLambertMaterial||q.isMeshBasicMaterial||q.isMeshStandardMaterial||q.isShaderMaterial)&&Tt.setValue(z,"isOrthographic",M.isOrthographicCamera===!0),_!==M&&(_=M,yn=!0,Yr=!0)}if(B.isSkinnedMesh){Tt.setOptional(z,B,"bindMatrix"),Tt.setOptional(z,B,"bindMatrixInverse");let Pn=B.skeleton;Pn&&(Pn.boneTexture===null&&Pn.computeBoneTexture(),Tt.setValue(z,"boneTexture",Pn.boneTexture,E))}B.isBatchedMesh&&(Tt.setOptional(z,B,"batchingTexture"),Tt.setValue(z,"batchingTexture",B._matricesTexture,E),Tt.setOptional(z,B,"batchingIdTexture"),Tt.setValue(z,"batchingIdTexture",B._indirectTexture,E),Tt.setOptional(z,B,"batchingColorTexture"),B._colorsTexture!==null&&Tt.setValue(z,"batchingColorTexture",B._colorsTexture,E));let Kr=W.morphAttributes;if((Kr.position!==void 0||Kr.normal!==void 0||Kr.color!==void 0)&&De.update(B,W,Gn),(yn||Te.receiveShadow!==B.receiveShadow)&&(Te.receiveShadow=B.receiveShadow,Tt.setValue(z,"receiveShadow",B.receiveShadow)),q.isMeshGouraudMaterial&&q.envMap!==null&&(si.envMap.value=Me,si.flipEnvMap.value=Me.isCubeTexture&&Me.isRenderTargetTexture===!1?-1:1),q.isMeshStandardMaterial&&q.envMap===null&&k.environment!==null&&(si.envMapIntensity.value=k.environmentIntensity),yn&&(Tt.setValue(z,"toneMappingExposure",v.toneMappingExposure),Te.needsLights&&Pm(si,Yr),ne&&q.fog===!0&&ue.refreshFogUniforms(si,ne),ue.refreshMaterialUniforms(si,q,G,Z,f.state.transmissionRenderTarget[M.id]),yr.upload(z,gd(Te),si,E)),q.isShaderMaterial&&q.uniformsNeedUpdate===!0&&(yr.upload(z,gd(Te),si,E),q.uniformsNeedUpdate=!1),q.isSpriteMaterial&&Tt.setValue(z,"center",B.center),Tt.setValue(z,"modelViewMatrix",B.modelViewMatrix),Tt.setValue(z,"normalMatrix",B.normalMatrix),Tt.setValue(z,"modelMatrix",B.matrixWorld),q.isShaderMaterial||q.isRawShaderMaterial){let Pn=q.uniformsGroups;for(let Gi=0,Wi=Pn.length;Gi<Wi;Gi++){let vd=Pn[Gi];U.update(vd,Gn),U.bind(vd,Gn)}}return Gn}function Pm(M,k){M.ambientLightColor.needsUpdate=k,M.lightProbe.needsUpdate=k,M.directionalLights.needsUpdate=k,M.directionalLightShadows.needsUpdate=k,M.pointLights.needsUpdate=k,M.pointLightShadows.needsUpdate=k,M.spotLights.needsUpdate=k,M.spotLightShadows.needsUpdate=k,M.rectAreaLights.needsUpdate=k,M.hemisphereLights.needsUpdate=k}function Im(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(M,k,W){Ee.get(M.texture).__webglTexture=k,Ee.get(M.depthTexture).__webglTexture=W;let q=Ee.get(M);q.__hasExternalTextures=!0,q.__autoAllocateDepthBuffer=W===void 0,q.__autoAllocateDepthBuffer||Je.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),q.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(M,k){let W=Ee.get(M);W.__webglFramebuffer=k,W.__useDefaultFramebuffer=k===void 0},this.setRenderTarget=function(M,k=0,W=0){C=M,R=k,T=W;let q=!0,B=null,ne=!1,fe=!1;if(M){let Me=Ee.get(M);if(Me.__useDefaultFramebuffer!==void 0)Ce.bindFramebuffer(z.FRAMEBUFFER,null),q=!1;else if(Me.__webglFramebuffer===void 0)E.setupRenderTarget(M);else if(Me.__hasExternalTextures)E.rebindTextures(M,Ee.get(M.texture).__webglTexture,Ee.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let we=M.depthTexture;if(Me.__boundDepthTexture!==we){if(we!==null&&Ee.has(we)&&(M.width!==we.image.width||M.height!==we.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");E.setupDepthRenderbuffer(M)}}let Ne=M.texture;(Ne.isData3DTexture||Ne.isDataArrayTexture||Ne.isCompressedArrayTexture)&&(fe=!0);let Oe=Ee.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Oe[k])?B=Oe[k][W]:B=Oe[k],ne=!0):M.samples>0&&E.useMultisampledRTT(M)===!1?B=Ee.get(M).__webglMultisampledFramebuffer:Array.isArray(Oe)?B=Oe[W]:B=Oe,L.copy(M.viewport),N.copy(M.scissor),P=M.scissorTest}else L.copy(me).multiplyScalar(G).floor(),N.copy(ke).multiplyScalar(G).floor(),P=ot;if(Ce.bindFramebuffer(z.FRAMEBUFFER,B)&&q&&Ce.drawBuffers(M,B),Ce.viewport(L),Ce.scissor(N),Ce.setScissorTest(P),ne){let Me=Ee.get(M.texture);z.framebufferTexture2D(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_CUBE_MAP_POSITIVE_X+k,Me.__webglTexture,W)}else if(fe){let Me=Ee.get(M.texture),Ne=k||0;z.framebufferTextureLayer(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0,Me.__webglTexture,W||0,Ne)}y=-1},this.readRenderTargetPixels=function(M,k,W,q,B,ne,fe){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let be=Ee.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&fe!==void 0&&(be=be[fe]),be){Ce.bindFramebuffer(z.FRAMEBUFFER,be);try{let Me=M.texture,Ne=Me.format,Oe=Me.type;if(!je.textureFormatReadable(Ne)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!je.textureTypeReadable(Oe)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}k>=0&&k<=M.width-q&&W>=0&&W<=M.height-B&&z.readPixels(k,W,q,B,ze.convert(Ne),ze.convert(Oe),ne)}finally{let Me=C!==null?Ee.get(C).__webglFramebuffer:null;Ce.bindFramebuffer(z.FRAMEBUFFER,Me)}}},this.readRenderTargetPixelsAsync=async function(M,k,W,q,B,ne,fe){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let be=Ee.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&fe!==void 0&&(be=be[fe]),be){let Me=M.texture,Ne=Me.format,Oe=Me.type;if(!je.textureFormatReadable(Ne))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!je.textureTypeReadable(Oe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(k>=0&&k<=M.width-q&&W>=0&&W<=M.height-B){Ce.bindFramebuffer(z.FRAMEBUFFER,be);let we=z.createBuffer();z.bindBuffer(z.PIXEL_PACK_BUFFER,we),z.bufferData(z.PIXEL_PACK_BUFFER,ne.byteLength,z.STREAM_READ),z.readPixels(k,W,q,B,ze.convert(Ne),ze.convert(Oe),0);let at=C!==null?Ee.get(C).__webglFramebuffer:null;Ce.bindFramebuffer(z.FRAMEBUFFER,at);let Mt=z.fenceSync(z.SYNC_GPU_COMMANDS_COMPLETE,0);return z.flush(),await Jg(z,Mt,4),z.bindBuffer(z.PIXEL_PACK_BUFFER,we),z.getBufferSubData(z.PIXEL_PACK_BUFFER,0,ne),z.deleteBuffer(we),z.deleteSync(Mt),ne}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(M,k=null,W=0){M.isTexture!==!0&&(pa("WebGLRenderer: copyFramebufferToTexture function signature has changed."),k=arguments[0]||null,M=arguments[1]);let q=Math.pow(2,-W),B=Math.floor(M.image.width*q),ne=Math.floor(M.image.height*q),fe=k!==null?k.x:0,be=k!==null?k.y:0;E.setTexture2D(M,0),z.copyTexSubImage2D(z.TEXTURE_2D,W,0,0,fe,be,B,ne),Ce.unbindTexture()},this.copyTextureToTexture=function(M,k,W=null,q=null,B=0){M.isTexture!==!0&&(pa("WebGLRenderer: copyTextureToTexture function signature has changed."),q=arguments[0]||null,M=arguments[1],k=arguments[2],B=arguments[3]||0,W=null);let ne,fe,be,Me,Ne,Oe,we,at,Mt,At=M.isCompressedTexture?M.mipmaps[B]:M.image;W!==null?(ne=W.max.x-W.min.x,fe=W.max.y-W.min.y,be=W.isBox3?W.max.z-W.min.z:1,Me=W.min.x,Ne=W.min.y,Oe=W.isBox3?W.min.z:0):(ne=At.width,fe=At.height,be=At.depth||1,Me=0,Ne=0,Oe=0),q!==null?(we=q.x,at=q.y,Mt=q.z):(we=0,at=0,Mt=0);let dn=ze.convert(k.format),lt=ze.convert(k.type),Te;k.isData3DTexture?(E.setTexture3D(k,0),Te=z.TEXTURE_3D):k.isDataArrayTexture||k.isCompressedArrayTexture?(E.setTexture2DArray(k,0),Te=z.TEXTURE_2D_ARRAY):(E.setTexture2D(k,0),Te=z.TEXTURE_2D),z.pixelStorei(z.UNPACK_FLIP_Y_WEBGL,k.flipY),z.pixelStorei(z.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),z.pixelStorei(z.UNPACK_ALIGNMENT,k.unpackAlignment);let Mi=z.getParameter(z.UNPACK_ROW_LENGTH),ct=z.getParameter(z.UNPACK_IMAGE_HEIGHT),Gn=z.getParameter(z.UNPACK_SKIP_PIXELS),Zs=z.getParameter(z.UNPACK_SKIP_ROWS),yn=z.getParameter(z.UNPACK_SKIP_IMAGES);z.pixelStorei(z.UNPACK_ROW_LENGTH,At.width),z.pixelStorei(z.UNPACK_IMAGE_HEIGHT,At.height),z.pixelStorei(z.UNPACK_SKIP_PIXELS,Me),z.pixelStorei(z.UNPACK_SKIP_ROWS,Ne),z.pixelStorei(z.UNPACK_SKIP_IMAGES,Oe);let Yr=M.isDataArrayTexture||M.isData3DTexture,Tt=k.isDataArrayTexture||k.isData3DTexture;if(M.isRenderTargetTexture||M.isDepthTexture){let si=Ee.get(M),Kr=Ee.get(k),Pn=Ee.get(si.__renderTarget),Gi=Ee.get(Kr.__renderTarget);Ce.bindFramebuffer(z.READ_FRAMEBUFFER,Pn.__webglFramebuffer),Ce.bindFramebuffer(z.DRAW_FRAMEBUFFER,Gi.__webglFramebuffer);for(let Wi=0;Wi<be;Wi++)Yr&&z.framebufferTextureLayer(z.READ_FRAMEBUFFER,z.COLOR_ATTACHMENT0,Ee.get(M).__webglTexture,B,Oe+Wi),M.isDepthTexture?(Tt&&z.framebufferTextureLayer(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0,Ee.get(k).__webglTexture,B,Mt+Wi),z.blitFramebuffer(Me,Ne,ne,fe,we,at,ne,fe,z.DEPTH_BUFFER_BIT,z.NEAREST)):Tt?z.copyTexSubImage3D(Te,B,we,at,Mt+Wi,Me,Ne,ne,fe):z.copyTexSubImage2D(Te,B,we,at,Mt+Wi,Me,Ne,ne,fe);Ce.bindFramebuffer(z.READ_FRAMEBUFFER,null),Ce.bindFramebuffer(z.DRAW_FRAMEBUFFER,null)}else Tt?M.isDataTexture||M.isData3DTexture?z.texSubImage3D(Te,B,we,at,Mt,ne,fe,be,dn,lt,At.data):k.isCompressedArrayTexture?z.compressedTexSubImage3D(Te,B,we,at,Mt,ne,fe,be,dn,At.data):z.texSubImage3D(Te,B,we,at,Mt,ne,fe,be,dn,lt,At):M.isDataTexture?z.texSubImage2D(z.TEXTURE_2D,B,we,at,ne,fe,dn,lt,At.data):M.isCompressedTexture?z.compressedTexSubImage2D(z.TEXTURE_2D,B,we,at,At.width,At.height,dn,At.data):z.texSubImage2D(z.TEXTURE_2D,B,we,at,ne,fe,dn,lt,At);z.pixelStorei(z.UNPACK_ROW_LENGTH,Mi),z.pixelStorei(z.UNPACK_IMAGE_HEIGHT,ct),z.pixelStorei(z.UNPACK_SKIP_PIXELS,Gn),z.pixelStorei(z.UNPACK_SKIP_ROWS,Zs),z.pixelStorei(z.UNPACK_SKIP_IMAGES,yn),B===0&&k.generateMipmaps&&z.generateMipmap(Te),Ce.unbindTexture()},this.copyTextureToTexture3D=function(M,k,W=null,q=null,B=0){return M.isTexture!==!0&&(pa("WebGLRenderer: copyTextureToTexture3D function signature has changed."),W=arguments[0]||null,q=arguments[1]||null,M=arguments[2],k=arguments[3],B=arguments[4]||0),pa('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(M,k,W,q,B)},this.initRenderTarget=function(M){Ee.get(M).__webglFramebuffer===void 0&&E.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?E.setTextureCube(M,0):M.isData3DTexture?E.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?E.setTexture2DArray(M,0):E.setTexture2D(M,0),Ce.unbindTexture()},this.resetState=function(){R=0,T=0,C=null,Ce.reset(),bt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Pi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorspace=nt._getDrawingBufferColorSpace(e),t.unpackColorSpace=nt._getUnpackColorSpace()}};var $o=class i{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new le(e),this.near=t,this.far=n}clone(){return new i(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Cr=class extends cn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Vt,this.environmentIntensity=1,this.environmentRotation=new Vt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var Wh=class extends Sn{constructor(e=null,t=1,n=1,s,r,a,o,l,h=Mn,c=Mn,u,d){super(null,a,o,l,h,c,s,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Xo=class extends wn{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},pr=new Ve,Nf=new Ve,Eo=[],Uf=new Ni,X_=new Ve,ua=new yt,da=new Ls,Kn=class extends yt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Xo(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,X_)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Ni),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,pr),Uf.copy(e.boundingBox).applyMatrix4(pr),this.boundingBox.union(Uf)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Ls),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,pr),da.copy(e.boundingSphere).applyMatrix4(pr),this.boundingSphere.union(da)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=e*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(e,t){let n=this.matrixWorld,s=this.count;if(ua.geometry=this.geometry,ua.material=this.material,ua.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),da.copy(this.boundingSphere),da.applyMatrix4(n),e.ray.intersectsSphere(da)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,pr),Nf.multiplyMatrices(n,pr),ua.matrixWorld=Nf,ua.raycast(e,Eo);for(let a=0,o=Eo.length;a<o;a++){let l=Eo[a];l.instanceId=r,l.object=this,t.push(l)}Eo.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Xo(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new Wh(new Float32Array(s*this.count),s,this.count,ou,ci));let r=this.morphTexture.source.data.data,a=0;for(let h=0;h<n.length;h++)a+=n[h];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*e;r[l]=o,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}};var ui=class i extends en{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);let r=[],a=[],o=[],l=[],h=new D,c=new $e;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let m=n+u/t*s;h.x=e*Math.cos(m),h.y=e*Math.sin(m),a.push(h.x,h.y,h.z),o.push(0,0,1),c.x=(a[d]/e+1)/2,c.y=(a[d+1]/e+1)/2,l.push(c.x,c.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new it(a,3)),this.setAttribute("normal",new it(o,3)),this.setAttribute("uv",new it(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.segments,e.thetaStart,e.thetaLength)}},tn=class i extends en{constructor(e=1,t=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let h=this;s=Math.floor(s),r=Math.floor(r);let c=[],u=[],d=[],m=[],g=0,x=[],p=n/2,f=0;w(),a===!1&&(e>0&&S(!0),t>0&&S(!1)),this.setIndex(c),this.setAttribute("position",new it(u,3)),this.setAttribute("normal",new it(d,3)),this.setAttribute("uv",new it(m,2));function w(){let v=new D,I=new D,R=0,T=(t-e)/n;for(let C=0;C<=r;C++){let y=[],_=C/r,L=_*(t-e)+e;for(let N=0;N<=s;N++){let P=N/s,F=P*l+o,H=Math.sin(F),O=Math.cos(F);I.x=L*H,I.y=-_*n+p,I.z=L*O,u.push(I.x,I.y,I.z),v.set(H,T,O).normalize(),d.push(v.x,v.y,v.z),m.push(P,1-_),y.push(g++)}x.push(y)}for(let C=0;C<s;C++)for(let y=0;y<r;y++){let _=x[y][C],L=x[y+1][C],N=x[y+1][C+1],P=x[y][C+1];(e>0||y!==0)&&(c.push(_,L,P),R+=3),(t>0||y!==r-1)&&(c.push(L,N,P),R+=3)}h.addGroup(f,R,0),f+=R}function S(v){let I=g,R=new $e,T=new D,C=0,y=v===!0?e:t,_=v===!0?1:-1;for(let N=1;N<=s;N++)u.push(0,p*_,0),d.push(0,_,0),m.push(.5,.5),g++;let L=g;for(let N=0;N<=s;N++){let F=N/s*l+o,H=Math.cos(F),O=Math.sin(F);T.x=y*O,T.y=p*_,T.z=y*H,u.push(T.x,T.y,T.z),d.push(0,_,0),R.x=H*.5+.5,R.y=O*.5*_+.5,m.push(R.x,R.y),g++}for(let N=0;N<s;N++){let P=I+N,F=L+N;v===!0?c.push(F,F+1,P):c.push(F+1,F,P),C+=3}h.addGroup(f,C,v===!0?1:2),f+=C}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},di=class i extends tn{constructor(e=1,t=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,e,t,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(e){return new i(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Yo=class i extends en{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};let r=[],a=[];o(s),h(n),c(),this.setAttribute("position",new it(r,3)),this.setAttribute("normal",new it(r.slice(),3)),this.setAttribute("uv",new it(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(w){let S=new D,v=new D,I=new D;for(let R=0;R<t.length;R+=3)m(t[R+0],S),m(t[R+1],v),m(t[R+2],I),l(S,v,I,w)}function l(w,S,v,I){let R=I+1,T=[];for(let C=0;C<=R;C++){T[C]=[];let y=w.clone().lerp(v,C/R),_=S.clone().lerp(v,C/R),L=R-C;for(let N=0;N<=L;N++)N===0&&C===R?T[C][N]=y:T[C][N]=y.clone().lerp(_,N/L)}for(let C=0;C<R;C++)for(let y=0;y<2*(R-C)-1;y++){let _=Math.floor(y/2);y%2===0?(d(T[C][_+1]),d(T[C+1][_]),d(T[C][_])):(d(T[C][_+1]),d(T[C+1][_+1]),d(T[C+1][_]))}}function h(w){let S=new D;for(let v=0;v<r.length;v+=3)S.x=r[v+0],S.y=r[v+1],S.z=r[v+2],S.normalize().multiplyScalar(w),r[v+0]=S.x,r[v+1]=S.y,r[v+2]=S.z}function c(){let w=new D;for(let S=0;S<r.length;S+=3){w.x=r[S+0],w.y=r[S+1],w.z=r[S+2];let v=p(w)/2/Math.PI+.5,I=f(w)/Math.PI+.5;a.push(v,1-I)}g(),u()}function u(){for(let w=0;w<a.length;w+=6){let S=a[w+0],v=a[w+2],I=a[w+4],R=Math.max(S,v,I),T=Math.min(S,v,I);R>.9&&T<.1&&(S<.2&&(a[w+0]+=1),v<.2&&(a[w+2]+=1),I<.2&&(a[w+4]+=1))}}function d(w){r.push(w.x,w.y,w.z)}function m(w,S){let v=w*3;S.x=e[v+0],S.y=e[v+1],S.z=e[v+2]}function g(){let w=new D,S=new D,v=new D,I=new D,R=new $e,T=new $e,C=new $e;for(let y=0,_=0;y<r.length;y+=9,_+=6){w.set(r[y+0],r[y+1],r[y+2]),S.set(r[y+3],r[y+4],r[y+5]),v.set(r[y+6],r[y+7],r[y+8]),R.set(a[_+0],a[_+1]),T.set(a[_+2],a[_+3]),C.set(a[_+4],a[_+5]),I.copy(w).add(S).add(v).divideScalar(3);let L=p(I);x(R,_+0,w,L),x(T,_+2,S,L),x(C,_+4,v,L)}}function x(w,S,v,I){I<0&&w.x===1&&(a[S]=w.x-1),v.x===0&&v.z===0&&(a[S]=I/2/Math.PI+.5)}function p(w){return Math.atan2(w.z,-w.x)}function f(w){return Math.atan2(-w.y,Math.sqrt(w.x*w.x+w.z*w.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.vertices,e.indices,e.radius,e.details)}};var Zn=class i extends Yo{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}},Ko=class i extends Yo{constructor(e=1,t=0){let n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}};var Jn=class i extends en{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),h=0,c=[],u=new D,d=new D,m=[],g=[],x=[],p=[];for(let f=0;f<=n;f++){let w=[],S=f/n,v=0;f===0&&a===0?v=.5/t:f===n&&l===Math.PI&&(v=-.5/t);for(let I=0;I<=t;I++){let R=I/t;u.x=-e*Math.cos(s+R*r)*Math.sin(a+S*o),u.y=e*Math.cos(a+S*o),u.z=e*Math.sin(s+R*r)*Math.sin(a+S*o),g.push(u.x,u.y,u.z),d.copy(u).normalize(),x.push(d.x,d.y,d.z),p.push(R+v,1-S),w.push(h++)}c.push(w)}for(let f=0;f<n;f++)for(let w=0;w<t;w++){let S=c[f][w+1],v=c[f][w],I=c[f+1][w],R=c[f+1][w+1];(f!==0||a>0)&&m.push(S,v,R),(f!==n-1||l<Math.PI)&&m.push(v,I,R)}this.setIndex(m),this.setAttribute("position",new it(g,3)),this.setAttribute("normal",new it(x,3)),this.setAttribute("uv",new it(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var ya=class i extends en{constructor(e=1,t=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);let a=[],o=[],l=[],h=[],c=new D,u=new D,d=new D;for(let m=0;m<=n;m++)for(let g=0;g<=s;g++){let x=g/s*r,p=m/n*Math.PI*2;u.x=(e+t*Math.cos(p))*Math.cos(x),u.y=(e+t*Math.cos(p))*Math.sin(x),u.z=t*Math.sin(p),o.push(u.x,u.y,u.z),c.x=e*Math.cos(x),c.y=e*Math.sin(x),d.subVectors(u,c).normalize(),l.push(d.x,d.y,d.z),h.push(g/s),h.push(m/n)}for(let m=1;m<=n;m++)for(let g=1;g<=s;g++){let x=(s+1)*m+g-1,p=(s+1)*(m-1)+g-1,f=(s+1)*(m-1)+g,w=(s+1)*m+g;a.push(x,p,w),a.push(p,f,w)}this.setIndex(a),this.setAttribute("position",new it(o,3)),this.setAttribute("normal",new it(l,3)),this.setAttribute("uv",new it(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var Zo=class extends rs{static get type(){return"MeshPhongMaterial"}constructor(e){super(),this.isMeshPhongMaterial=!0,this.color=new le(16777215),this.specular=new le(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new le(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=uu,this.normalScale=new $e(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Vt,this.combine=tl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.specular.copy(e.specular),this.shininess=e.shininess,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var hn=class extends rs{static get type(){return"MeshLambertMaterial"}constructor(e){super(),this.isMeshLambertMaterial=!0,this.color=new le(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new le(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=uu,this.normalScale=new $e(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Vt,this.combine=tl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};function Co(i,e,t){return!i||!t&&i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function Y_(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var Rr=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];e:{t:{let a;n:{i:if(!(e<s)){for(let o=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=t[++n],e<s)break t}a=t.length;break n}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break t}a=n,n=0;break n}break e}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},qh=class extends Rr{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Fd,endingEnd:Fd}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case Bd:r=e,o=2*t-n;break;case Od:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Bd:a=e,l=2*n-t;break;case Od:a=1,l=n+s[1]-s[0];break;default:a=e-1,l=t}let h=(n-t)*.5,c=this.valueSize;this._weightPrev=h/(t-o),this._weightNext=h/(l-n),this._offsetPrev=r*c,this._offsetNext=a*c}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,h=l-o,c=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,m=this._weightNext,g=(n-t)/(s-t),x=g*g,p=x*g,f=-d*p+2*d*x-d*g,w=(1+d)*p+(-1.5-2*d)*x+(-.5+d)*g+1,S=(-1-m)*p+(1.5+m)*x+.5*g,v=m*p-m*x;for(let I=0;I!==o;++I)r[I]=f*a[c+I]+w*a[h+I]+S*a[l+I]+v*a[u+I];return r}},$h=class extends Rr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,h=l-o,c=(n-t)/(s-t),u=1-c;for(let d=0;d!==o;++d)r[d]=a[h+d]*u+a[l+d]*c;return r}},Xh=class extends Rr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},jn=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Co(t,this.TimeBufferType),this.values=Co(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Co(e.times,Array),values:Co(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Xh(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new $h(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new qh(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case No:t=this.InterpolantFactoryMethodDiscrete;break;case Ah:t=this.InterpolantFactoryMethodLinear;break;case cc:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return No;case this.InterpolantFactoryMethodLinear:return Ah;case this.InterpolantFactoryMethodSmooth:return cc}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(s!==void 0&&Y_(s))for(let o=0,l=s.length;o!==l;++o){let h=s[o];if(isNaN(h)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,h),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===cc,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,h=e[o],c=e[o+1];if(h!==c&&(o!==1||h!==e[0]))if(s)l=!0;else{let u=o*n,d=u-n,m=u+n;for(let g=0;g!==n;++g){let x=t[u+g];if(x!==t[d+g]||x!==t[m+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let u=o*n,d=a*n;for(let m=0;m!==n;++m)t[d+m]=t[u+m]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,h=0;h!==n;++h)t[l+h]=t[o+h];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};jn.prototype.TimeBufferType=Float32Array;jn.prototype.ValueBufferType=Float32Array;jn.prototype.DefaultInterpolation=Ah;var Ds=class extends jn{constructor(e,t,n){super(e,t,n)}};Ds.prototype.ValueTypeName="bool";Ds.prototype.ValueBufferType=Array;Ds.prototype.DefaultInterpolation=No;Ds.prototype.InterpolantFactoryMethodLinear=void 0;Ds.prototype.InterpolantFactoryMethodSmooth=void 0;var Yh=class extends jn{};Yh.prototype.ValueTypeName="color";var Kh=class extends jn{};Kh.prototype.ValueTypeName="number";var Zh=class extends Rr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(s-t),h=e*o;for(let c=h+o;h!==c;h+=4)an.slerpFlat(r,0,a,h-o,a,h,l);return r}},Jo=class extends jn{InterpolantFactoryMethodLinear(e){return new Zh(this.times,this.values,this.getValueSize(),e)}};Jo.prototype.ValueTypeName="quaternion";Jo.prototype.InterpolantFactoryMethodSmooth=void 0;var Ns=class extends jn{constructor(e,t,n){super(e,t,n)}};Ns.prototype.ValueTypeName="string";Ns.prototype.ValueBufferType=Array;Ns.prototype.DefaultInterpolation=No;Ns.prototype.InterpolantFactoryMethodLinear=void 0;Ns.prototype.InterpolantFactoryMethodSmooth=void 0;var Jh=class extends jn{};Jh.prototype.ValueTypeName="vector";var jh=class{constructor(e,t,n){let s=this,r=!1,a=0,o=0,l,h=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(c){o++,r===!1&&s.onStart!==void 0&&s.onStart(c,a,o),r=!0},this.itemEnd=function(c){a++,s.onProgress!==void 0&&s.onProgress(c,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(c){s.onError!==void 0&&s.onError(c)},this.resolveURL=function(c){return l?l(c):c},this.setURLModifier=function(c){return l=c,this},this.addHandler=function(c,u){return h.push(c,u),this},this.removeHandler=function(c){let u=h.indexOf(c);return u!==-1&&h.splice(u,2),this},this.getHandler=function(c){for(let u=0,d=h.length;u<d;u+=2){let m=h[u],g=h[u+1];if(m.global&&(m.lastIndex=0),m.test(c))return g}return null}}},K_=new jh,Qh=class{constructor(e){this.manager=e!==void 0?e:K_,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};Qh.DEFAULT_MATERIAL_NAME="__DEFAULT";var _a=class extends cn{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new le(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},Pr=class extends _a{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(cn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new le(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},Bc=new Ve,kf=new D,Ff=new D,jo=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new $e(512,512),this.map=null,this.mapPass=null,this.matrix=new Ve,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new va,this._frameExtents=new $e(1,1),this._viewportCount=1,this._viewports=[new gt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;kf.setFromMatrixPosition(e.matrixWorld),t.position.copy(kf),Ff.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ff),t.updateMatrixWorld(),Bc.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Bc),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Bc)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var Bf=new Ve,fa=new D,Oc=new D,eu=class extends jo{constructor(){super(new Zt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new $e(4,2),this._viewportCount=6,this._viewports=[new gt(2,1,1,1),new gt(0,1,1,1),new gt(3,1,1,1),new gt(1,1,1,1),new gt(3,0,1,1),new gt(1,0,1,1)],this._cubeDirections=[new D(1,0,0),new D(-1,0,0),new D(0,0,1),new D(0,0,-1),new D(0,1,0),new D(0,-1,0)],this._cubeUps=[new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,0,1),new D(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,s=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),fa.setFromMatrixPosition(e.matrixWorld),n.position.copy(fa),Oc.copy(n.position),Oc.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(Oc),n.updateMatrixWorld(),s.makeTranslation(-fa.x,-fa.y,-fa.z),Bf.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Bf)}},Qo=class extends _a{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new eu}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},tu=class extends jo{constructor(){super(new Go(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Us=class extends _a{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(cn.DEFAULT_UP),this.updateMatrix(),this.target=new cn,this.shadow=new tu}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var fu="\\[\\]\\.:\\/",Z_=new RegExp("["+fu+"]","g"),pu="[^"+fu+"]",J_="[^"+fu.replace("\\.","")+"]",j_=/((?:WC+[\/:])*)/.source.replace("WC",pu),Q_=/(WCOD+)?/.source.replace("WCOD",J_),eb=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",pu),tb=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",pu),nb=new RegExp("^"+j_+Q_+eb+tb+"$"),ib=["material","materials","bones","map"],nu=class{constructor(e,t,n){let s=n||Pt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Pt=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Z_,"")}static parseTrackName(e){let t=nb.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);ib.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let h=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let c=0;c<e.length;c++)if(e[c].name===h){h=c;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(h!==void 0){if(e[h]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[h]}}let a=e[s];if(a===void 0){let h=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+h+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Pt.Composite=nu;Pt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Pt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Pt.prototype.GetterByBindingType=[Pt.prototype._getValue_direct,Pt.prototype._getValue_array,Pt.prototype._getValue_arrayElement,Pt.prototype._getValue_toArray];Pt.prototype.SetterByBindingTypeAndVersioning=[[Pt.prototype._setValue_direct,Pt.prototype._setValue_direct_setNeedsUpdate,Pt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Pt.prototype._setValue_array,Pt.prototype._setValue_array_setNeedsUpdate,Pt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Pt.prototype._setValue_arrayElement,Pt.prototype._setValue_arrayElement_setNeedsUpdate,Pt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Pt.prototype._setValue_fromArray,Pt.prototype._setValue_fromArray_setNeedsUpdate,Pt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Iw=new Float32Array(1);typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"170"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="170");var mu={en:{mResume:"Resume",mActions:"Actions",mSettings:"Settings",mControls:"Buttons",mPerson:"This person",mNextPerson:"Next person",mFollowMe:"Follow my character",followingMe:"Following my character",mNextMap:"Next map",mPlay:"Play (my character)",mWatch:"Watch the world",mBack:"Back",mTitle:"World",aUse:"Interact (take, gather)",aRun:"Run",aEat:"Eat",aDrink:"Drink",aPickup:"Pick up food",aSleep:"Sleep / wake up",aTalk:"Talk",aZoomIn:"Zoom in",aZoomOut:"Zoom out",aThoughts:"Show / hide thoughts",aMenu:"Game menu",aPerson:"Person card",sThoughts:"Thoughts over heads",on:"On",off:"Off",sServer:"Server address",sUnpair:"Unpair this TV",cHelp:"Choose an action, press A / OK, then press the button you want for it.",cPad:"Controller",cRemote:"Remote",cPress:"Press the button for \u201C{0}\u201D\u2026 (Back cancels)",cSet:"{0} is now on {1}",cReset:"Back to the default buttons",cNone:"\u2014",cWatchNote:"In watch mode: Use = next person, Eat = next map, Sleep = person card.",dDrank:"You drank.",dPicked:"You picked up {0}.",dAte:"You ate.",dSleep:"You lie down to sleep. Move to wake up.",dWake:"You wake up.",dNoWater:"No water here: stand next to the water.",dNothing:"Nothing to do here.",dNoFood:"You carry no food.",dFull:"Your hands are full (5).",nFood:"food",nWater:"water",nRest:"rest",nFun:"company",nHp:"health",carry:"carrying {0}",iWood:"wood",iStone:"stone",iScrap:"scrap",iAxe:"an axe",iSpear:"a spear",has:"has {0}",wGatherWood:"gather wood",wGatherStone:"gather stone",wGatherScrap:"gather scrap",wAxe:"make an axe",wSpear:"make a spear",wFire:"build a campfire",wHut:"build a hut",wTend:"feed the fire",wStore:"collect food and store it",wLoot:"search the ruins",wFarm:"plant a field",wRepair:"repair the huts",listening:"Listening\u2026 say it (A again: done)",mPast:"Past events",pastHelp:"Zombie attacks (the last 20). Pick one to watch how everyone behaved.",pastNone:"No zombie attack recorded yet.",pastZ:"zombies",pastKilled:"{0} killed",rpTitle:"Replay",rpHint:"A: pause \xB7 \u25C0 \u25B6: 5 s \xB7 \u25B2 \u25BC: speed \xB7 B: back",evBite:"{0} bit {1} (health {2})",evKilled:"{0} killed {1}",evDeath:"{0} died",evFight:"{0} fights {1}",evFlee:"{0} runs from {1}",mGoTo:"Go to someone",mGoToHelp:"Pick a person: your character appears next to them.",dTp:"You are next to {0}.",zHit:"You hit the zombie!",zKilled:"The zombie is down.",actFight:"Fighting a zombie",pAge:"{0} years",pMan:"Man",pWoman:"Woman",pChild:"child",pExpecting:"expecting a baby",pPartner:"Partner",pParents:"Parents",pChildren:"Children",pGen:"Generation {0}",pNone:"none",pDead:"Died",pMood:"Mood",pWants:"Wants to",pMemory:"Remembers",pSaid:"Said",pRecent:"Lately",pTraits:"Traits",pFirst:"first survivors",tStrength:"strength",tSpeed:"speed",tIntelligence:"intelligence",tCourage:"courage",tEmpathy:"empathy",tMetabolism:"appetite",tLifespan:"lifespan",bTo:"going to {0}",bWith:"with {0}",bWants:"wants: {0}",gDrink:"drink",gEat:"eat",gForage:"find food",gSleep:"sleep",gTalk:"talk",gWander:"walk around",gRest:"rest",gTravel:"travel",hintMenu:"+ / Back: menu",gameMenuItem:"Game menu",hMove:"Move",sayLabel:"Say something (empty = just say hello)",wFollow:"follow a person",wMap:"next map",wCard:"person card",mNearby:"Nearest person",sThoughtsOnly:"Only players the owner allows see thoughts.",mMe:"Me",dTalk:"You talk to them.",dNobody:"Nobody close enough.",sZoom:"Zoom",cPressed:"Pressed: {0}"},fr:{mResume:"Reprendre",mActions:"Actions",mSettings:"R\xE9glages",mControls:"Boutons",mPerson:"Cette personne",mNextPerson:"Personne suivante",mFollowMe:"Suivre mon personnage",followingMe:"Je suis votre personnage",mNextMap:"Carte suivante",mPlay:"Jouer (mon personnage)",mWatch:"Regarder le monde",mBack:"Retour",mTitle:"Monde",aUse:"Interagir (prendre, r\xE9colter)",aRun:"Courir",aEat:"Manger",aDrink:"Boire",aPickup:"Ramasser de la nourriture",aSleep:"Dormir / se r\xE9veiller",aTalk:"Parler",aZoomIn:"Zoom avant",aZoomOut:"Zoom arri\xE8re",aThoughts:"Afficher / masquer les pens\xE9es",aMenu:"Menu du jeu",aPerson:"Fiche de la personne",sThoughts:"Pens\xE9es au-dessus des t\xEAtes",on:"Oui",off:"Non",sServer:"Adresse du serveur",sUnpair:"Dissocier cette TV",cHelp:"Choisissez une action, appuyez sur A / OK, puis sur le bouton voulu.",cPad:"Manette",cRemote:"T\xE9l\xE9commande",cPress:"Appuyez sur le bouton pour \xAB {0} \xBB\u2026 (Retour annule)",cSet:"{0} est maintenant sur {1}",cReset:"Revenir aux boutons par d\xE9faut",cNone:"\u2014",cWatchNote:"En mode regarder : Utiliser = personne suivante, Manger = carte suivante, Dormir = fiche.",dDrank:"Vous avez bu.",dPicked:"Vous avez ramass\xE9 {0}.",dAte:"Vous avez mang\xE9.",dSleep:"Vous vous allongez pour dormir. Bougez pour vous r\xE9veiller.",dWake:"Vous vous r\xE9veillez.",dNoWater:"Pas d\u2019eau ici : placez-vous au bord de l\u2019eau.",dNothing:"Rien \xE0 faire ici.",dNoFood:"Vous n\u2019avez pas de nourriture.",dFull:"Vos mains sont pleines (5).",nFood:"faim",nWater:"eau",nRest:"repos",nFun:"compagnie",nHp:"sant\xE9",carry:"porte {0}",iWood:"bois",iStone:"pierre",iScrap:"ferraille",iAxe:"une hache",iSpear:"une lance",has:"a {0}",wGatherWood:"ramasser du bois",wGatherStone:"ramasser des pierres",wGatherScrap:"chercher de la ferraille",wAxe:"fabriquer une hache",wSpear:"fabriquer une lance",wFire:"faire un feu de camp",wHut:"construire une cabane",wTend:"entretenir le feu",wStore:"ramasser de la nourriture et la stocker",wLoot:"fouiller les ruines",wFarm:"planter un champ",wRepair:"r\xE9parer les cabanes",listening:"J\u2019\xE9coute\u2026 parlez (A encore : termin\xE9)",mPast:"\xC9v\xE9nements pass\xE9s",pastHelp:"Attaques de zombies (les 20 derni\xE8res). Choisissez-en une pour voir comment chacun a r\xE9agi.",pastNone:"Aucune attaque de zombies enregistr\xE9e pour l\u2019instant.",pastZ:"zombies",pastKilled:"{0} tu\xE9s",rpTitle:"Rediffusion",rpHint:"A : pause \xB7 \u25C0 \u25B6 : 5 s \xB7 \u25B2 \u25BC : vitesse \xB7 B : retour",evBite:"{0} a mordu {1} (sant\xE9 {2})",evKilled:"{0} a tu\xE9 {1}",evDeath:"{0} est mort(e)",evFight:"{0} combat {1}",evFlee:"{0} fuit {1}",mGoTo:"Aller vers quelqu\u2019un",mGoToHelp:"Choisissez une personne : votre personnage appara\xEEt \xE0 c\xF4t\xE9.",dTp:"Vous \xEAtes \xE0 c\xF4t\xE9 de {0}.",zHit:"Vous frappez le zombie !",zKilled:"Le zombie est \xE0 terre.",actFight:"Combat un zombie",pAge:"{0} ans",pMan:"Homme",pWoman:"Femme",pChild:"enfant",pExpecting:"attend un b\xE9b\xE9",pPartner:"Partenaire",pParents:"Parents",pChildren:"Enfants",pGen:"G\xE9n\xE9ration {0}",pNone:"aucun",pDead:"Mort",pMood:"Humeur",pWants:"Veut",pMemory:"Se souvient",pSaid:"A dit",pRecent:"Derni\xE8rement",pTraits:"Traits",pFirst:"premiers survivants",tStrength:"force",tSpeed:"vitesse",tIntelligence:"intelligence",tCourage:"courage",tEmpathy:"empathie",tMetabolism:"app\xE9tit",tLifespan:"esp\xE9rance de vie",bTo:"va vers {0}",bWith:"avec {0}",bWants:"veut : {0}",gDrink:"boire",gEat:"manger",gForage:"trouver \xE0 manger",gSleep:"dormir",gTalk:"parler",gWander:"se promener",gRest:"se reposer",gTravel:"voyager",hintMenu:"+ / Retour : menu",gameMenuItem:"Menu du jeu",hMove:"Bouger",sayLabel:"Dire quelque chose (vide = juste saluer)",wFollow:"suivre une personne",wMap:"carte suivante",wCard:"fiche",mNearby:"Personne la plus proche",sThoughtsOnly:"Seuls les joueurs autoris\xE9s par le propri\xE9taire voient les pens\xE9es.",mMe:"Moi",dTalk:"Vous lui parlez.",dNobody:"Personne assez pr\xE8s.",sZoom:"Zoom",cPressed:"Appuy\xE9 : {0}"},es:{mResume:"Continuar",mActions:"Acciones",mSettings:"Ajustes",mControls:"Botones",mPerson:"Esta persona",mNextPerson:"Siguiente persona",mFollowMe:"Seguir a mi personaje",followingMe:"Siguiendo a tu personaje",mNextMap:"Siguiente mapa",mPlay:"Jugar (mi personaje)",mWatch:"Mirar el mundo",mBack:"Atr\xE1s",mTitle:"Mundo",aUse:"Interactuar (tomar, recoger)",aRun:"Correr",aEat:"Comer",aDrink:"Beber",aPickup:"Recoger comida",aSleep:"Dormir / despertar",aTalk:"Hablar",aZoomIn:"Acercar",aZoomOut:"Alejar",aThoughts:"Mostrar / ocultar pensamientos",aMenu:"Men\xFA del juego",aPerson:"Ficha de la persona",sThoughts:"Pensamientos sobre las cabezas",on:"S\xED",off:"No",sServer:"Direcci\xF3n del servidor",sUnpair:"Desvincular esta TV",cHelp:"Elige una acci\xF3n, pulsa A / OK y luego el bot\xF3n que quieras.",cPad:"Mando",cRemote:"Mando a distancia",cPress:"Pulsa el bot\xF3n para \xAB{0}\xBB\u2026 (Atr\xE1s cancela)",cSet:"{0} est\xE1 ahora en {1}",cReset:"Volver a los botones por defecto",cNone:"\u2014",cWatchNote:"En modo mirar: Usar = siguiente persona, Comer = siguiente mapa, Dormir = ficha.",dDrank:"Has bebido.",dPicked:"Has recogido {0}.",dAte:"Has comido.",dSleep:"Te tumbas a dormir. Mu\xE9vete para despertar.",dWake:"Te despiertas.",dNoWater:"No hay agua aqu\xED: ponte junto al agua.",dNothing:"Nada que hacer aqu\xED.",dNoFood:"No llevas comida.",dFull:"Tienes las manos llenas (5).",nFood:"hambre",nWater:"agua",nRest:"descanso",nFun:"compa\xF1\xEDa",nHp:"salud",carry:"lleva {0}",iWood:"madera",iStone:"piedra",iScrap:"chatarra",iAxe:"un hacha",iSpear:"una lanza",has:"tiene {0}",wGatherWood:"recoger madera",wGatherStone:"recoger piedras",wGatherScrap:"buscar chatarra",wAxe:"hacer un hacha",wSpear:"hacer una lanza",wFire:"hacer una hoguera",wHut:"construir una caba\xF1a",wTend:"avivar el fuego",wStore:"recoger comida y guardarla",wLoot:"registrar las ruinas",wFarm:"plantar un huerto",wRepair:"reparar las caba\xF1as",listening:"Escuchando\u2026 habla (A otra vez: listo)",mPast:"Eventos pasados",pastHelp:"Ataques de zombis (los 20 \xFAltimos). Elige uno para ver c\xF3mo reaccion\xF3 cada uno.",pastNone:"Todav\xEDa no hay ning\xFAn ataque de zombis grabado.",pastZ:"zombis",pastKilled:"{0} abatidos",rpTitle:"Repetici\xF3n",rpHint:"A: pausa \xB7 \u25C0 \u25B6: 5 s \xB7 \u25B2 \u25BC: velocidad \xB7 B: atr\xE1s",evBite:"{0} mordi\xF3 a {1} (salud {2})",evKilled:"{0} mat\xF3 a {1}",evDeath:"{0} muri\xF3",evFight:"{0} lucha contra {1}",evFlee:"{0} huye de {1}",mGoTo:"Ir hacia alguien",mGoToHelp:"Elige a una persona: tu personaje aparece a su lado.",dTp:"Est\xE1s junto a {0}.",zHit:"\xA1Golpeas al zombi!",zKilled:"El zombi ha ca\xEDdo.",actFight:"Luchando contra un zombi",pAge:"{0} a\xF1os",pMan:"Hombre",pWoman:"Mujer",pChild:"ni\xF1o",pExpecting:"espera un beb\xE9",pPartner:"Pareja",pParents:"Padres",pChildren:"Hijos",pGen:"Generaci\xF3n {0}",pNone:"ninguno",pDead:"Muri\xF3",pMood:"\xC1nimo",pWants:"Quiere",pMemory:"Recuerda",pSaid:"Dijo",pRecent:"\xDAltimamente",pTraits:"Rasgos",pFirst:"primeros supervivientes",tStrength:"fuerza",tSpeed:"velocidad",tIntelligence:"inteligencia",tCourage:"valor",tEmpathy:"empat\xEDa",tMetabolism:"apetito",tLifespan:"esperanza de vida",bTo:"va a {0}",bWith:"con {0}",bWants:"quiere: {0}",gDrink:"beber",gEat:"comer",gForage:"buscar comida",gSleep:"dormir",gTalk:"hablar",gWander:"pasear",gRest:"descansar",gTravel:"viajar",hintMenu:"+ / Atr\xE1s: men\xFA",gameMenuItem:"Men\xFA del juego",hMove:"Mover",sayLabel:"Decir algo (vac\xEDo = solo saludar)",wFollow:"seguir a alguien",wMap:"mapa siguiente",wCard:"ficha",mNearby:"Persona m\xE1s cercana",sThoughtsOnly:"Solo los jugadores que el due\xF1o permite ven los pensamientos.",mMe:"Yo",dTalk:"Le hablas.",dNobody:"No hay nadie lo bastante cerca.",sZoom:"Zoom",cPressed:"Pulsado: {0}"},ar:{mResume:"\u0645\u062A\u0627\u0628\u0639\u0629",mActions:"\u0627\u0644\u0623\u0641\u0639\u0627\u0644",mSettings:"\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",mControls:"\u0627\u0644\u0623\u0632\u0631\u0627\u0631",mPerson:"\u0647\u0630\u0627 \u0627\u0644\u0634\u062E\u0635",mNextPerson:"\u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062A\u0627\u0644\u064A",mFollowMe:"\u062A\u0627\u0628\u0639 \u0634\u062E\u0635\u064A\u062A\u064A",followingMe:"\u0623\u062A\u0627\u0628\u0639 \u0634\u062E\u0635\u064A\u062A\u0643",mNextMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",mPlay:"\u0627\u0644\u0639\u0628 (\u0634\u062E\u0635\u064A\u062A\u064A)",mWatch:"\u0634\u0627\u0647\u062F \u0627\u0644\u0639\u0627\u0644\u0645",mBack:"\u0631\u062C\u0648\u0639",mTitle:"\u0627\u0644\u0639\u0627\u0644\u0645",aUse:"\u062A\u0641\u0627\u0639\u0644 (\u0623\u062E\u0630\u060C \u062C\u0645\u0639)",aRun:"\u062C\u0631\u064A",aEat:"\u0623\u0643\u0644",aDrink:"\u0634\u0631\u0628",aPickup:"\u0627\u0644\u062A\u0642\u0627\u0637 \u0637\u0639\u0627\u0645",aSleep:"\u0646\u0648\u0645 / \u0627\u0633\u062A\u064A\u0642\u0627\u0638",aTalk:"\u062A\u062D\u062F\u062B",aZoomIn:"\u062A\u0643\u0628\u064A\u0631",aZoomOut:"\u062A\u0635\u063A\u064A\u0631",aThoughts:"\u0625\u0638\u0647\u0627\u0631 / \u0625\u062E\u0641\u0627\u0621 \u0627\u0644\u0623\u0641\u0643\u0627\u0631",aMenu:"\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0644\u0639\u0628\u0629",aPerson:"\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0634\u062E\u0635",sThoughts:"\u0627\u0644\u0623\u0641\u0643\u0627\u0631 \u0641\u0648\u0642 \u0627\u0644\u0631\u0624\u0648\u0633",on:"\u0646\u0639\u0645",off:"\u0644\u0627",sServer:"\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",sUnpair:"\u0625\u0644\u063A\u0627\u0621 \u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",cHelp:"\u0627\u062E\u062A\u0631 \u0641\u0639\u0644\u0627\u064B\u060C \u0627\u0636\u063A\u0637 A / OK\u060C \u062B\u0645 \u0627\u0636\u063A\u0637 \u0627\u0644\u0632\u0631 \u0627\u0644\u0630\u064A \u062A\u0631\u064A\u062F\u0647 \u0644\u0647.",cPad:"\u0630\u0631\u0627\u0639 \u0627\u0644\u062A\u062D\u0643\u0645",cRemote:"\u062C\u0647\u0627\u0632 \u0627\u0644\u062A\u062D\u0643\u0645",cPress:"\u0627\u0636\u063A\u0637 \u0627\u0644\u0632\u0631 \u0644\u0640 \xAB{0}\xBB\u2026 (\u0631\u062C\u0648\u0639 \u0644\u0644\u0625\u0644\u063A\u0627\u0621)",cSet:"{0} \u0627\u0644\u0622\u0646 \u0639\u0644\u0649 {1}",cReset:"\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u0623\u0632\u0631\u0627\u0631 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629",cNone:"\u2014",cWatchNote:"\u0641\u064A \u0648\u0636\u0639 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629: \u0627\u0633\u062A\u062E\u062F\u0627\u0645 = \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062A\u0627\u0644\u064A\u060C \u0623\u0643\u0644 = \u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629\u060C \u0646\u0648\u0645 = \u0627\u0644\u0628\u0637\u0627\u0642\u0629.",dDrank:"\u0634\u0631\u0628\u062A.",dPicked:"\u0627\u0644\u062A\u0642\u0637\u062A {0}.",dAte:"\u0623\u0643\u0644\u062A.",dSleep:"\u0627\u0633\u062A\u0644\u0642\u064A\u062A \u0644\u0644\u0646\u0648\u0645. \u062A\u062D\u0631\u0643 \u0644\u062A\u0633\u062A\u064A\u0642\u0638.",dWake:"\u0627\u0633\u062A\u064A\u0642\u0638\u062A.",dNoWater:"\u0644\u0627 \u0645\u0627\u0621 \u0647\u0646\u0627: \u0642\u0641 \u0628\u062C\u0627\u0646\u0628 \u0627\u0644\u0645\u0627\u0621.",dNothing:"\u0644\u0627 \u0634\u064A\u0621 \u0644\u0641\u0639\u0644\u0647 \u0647\u0646\u0627.",dNoFood:"\u0644\u0627 \u062A\u062D\u0645\u0644 \u0637\u0639\u0627\u0645\u0627\u064B.",dFull:"\u064A\u062F\u0627\u0643 \u0645\u0645\u062A\u0644\u0626\u062A\u0627\u0646 (5).",nFood:"\u062C\u0648\u0639",nWater:"\u0645\u0627\u0621",nRest:"\u0631\u0627\u062D\u0629",nFun:"\u0631\u0641\u0642\u0629",nHp:"\u0635\u062D\u0629",carry:"\u064A\u062D\u0645\u0644 {0}",iWood:"\u062E\u0634\u0628",iStone:"\u062D\u062C\u0627\u0631\u0629",iScrap:"\u062E\u0631\u062F\u0629",iAxe:"\u0641\u0623\u0633",iSpear:"\u0631\u0645\u062D",has:"\u0644\u062F\u064A\u0647 {0}",wGatherWood:"\u062C\u0645\u0639 \u0627\u0644\u062D\u0637\u0628",wGatherStone:"\u062C\u0645\u0639 \u0627\u0644\u062D\u062C\u0627\u0631\u0629",wGatherScrap:"\u062C\u0645\u0639 \u0627\u0644\u062E\u0631\u062F\u0629",wAxe:"\u0635\u0646\u0639 \u0641\u0623\u0633",wSpear:"\u0635\u0646\u0639 \u0631\u0645\u062D",wFire:"\u0625\u0634\u0639\u0627\u0644 \u0646\u0627\u0631 \u0627\u0644\u0645\u062E\u064A\u0645",wHut:"\u0628\u0646\u0627\u0621 \u0643\u0648\u062E",wTend:"\u062A\u063A\u0630\u064A\u0629 \u0627\u0644\u0646\u0627\u0631",wStore:"\u062C\u0645\u0639 \u0627\u0644\u0637\u0639\u0627\u0645 \u0648\u062A\u062E\u0632\u064A\u0646\u0647",wLoot:"\u062A\u0641\u062A\u064A\u0634 \u0627\u0644\u0623\u0646\u0642\u0627\u0636",wFarm:"\u0632\u0631\u0627\u0639\u0629 \u062D\u0642\u0644",wRepair:"\u0625\u0635\u0644\u0627\u062D \u0627\u0644\u0623\u0643\u0648\u0627\u062E",listening:"\u0623\u0633\u062A\u0645\u0639\u2026 \u062A\u0643\u0644\u0645 (A \u0645\u0631\u0629 \u0623\u062E\u0631\u0649: \u0627\u0646\u062A\u0647\u064A\u062A)",mPast:"\u0623\u062D\u062F\u0627\u062B \u0633\u0627\u0628\u0642\u0629",pastHelp:"\u0647\u062C\u0645\u0627\u062A \u0627\u0644\u0632\u0648\u0645\u0628\u064A (\u0622\u062E\u0631 20). \u0627\u062E\u062A\u0631 \u0648\u0627\u062D\u062F\u0629 \u0644\u062A\u0631\u0649 \u0643\u064A\u0641 \u062A\u0635\u0631\u0641 \u0627\u0644\u062C\u0645\u064A\u0639.",pastNone:"\u0644\u0645 \u064A\u0633\u062C\u0644 \u0623\u064A \u0647\u062C\u0648\u0645 \u0632\u0648\u0645\u0628\u064A \u0628\u0639\u062F.",pastZ:"\u0632\u0648\u0645\u0628\u064A",pastKilled:"\u0642\u062A\u0644 {0}",rpTitle:"\u0625\u0639\u0627\u062F\u0629",rpHint:"A: \u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A \xB7 \u25C0 \u25B6: 5 \u062B \xB7 \u25B2 \u25BC: \u0627\u0644\u0633\u0631\u0639\u0629 \xB7 B: \u0631\u062C\u0648\u0639",evBite:"{0} \u0639\u0636 {1} (\u0627\u0644\u0635\u062D\u0629 {2})",evKilled:"{0} \u0642\u062A\u0644 {1}",evDeath:"\u0645\u0627\u062A {0}",evFight:"{0} \u064A\u0642\u0627\u062A\u0644 {1}",evFlee:"{0} \u064A\u0647\u0631\u0628 \u0645\u0646 {1}",mGoTo:"\u0627\u0630\u0647\u0628 \u0625\u0644\u0649 \u0634\u062E\u0635",mGoToHelp:"\u0627\u062E\u062A\u0631 \u0634\u062E\u0635\u0627: \u062A\u0638\u0647\u0631 \u0634\u062E\u0635\u064A\u062A\u0643 \u0628\u062C\u0627\u0646\u0628\u0647.",dTp:"\u0623\u0646\u062A \u0628\u062C\u0627\u0646\u0628 {0}.",zHit:"\u0636\u0631\u0628\u062A \u0627\u0644\u0632\u0648\u0645\u0628\u064A!",zKilled:"\u0633\u0642\u0637 \u0627\u0644\u0632\u0648\u0645\u0628\u064A.",actFight:"\u064A\u0642\u0627\u062A\u0644 \u0632\u0648\u0645\u0628\u064A",pAge:"{0} \u0633\u0646\u0629",pMan:"\u0631\u062C\u0644",pWoman:"\u0627\u0645\u0631\u0623\u0629",pChild:"\u0637\u0641\u0644",pExpecting:"\u062A\u0646\u062A\u0638\u0631 \u0645\u0648\u0644\u0648\u062F\u0627\u064B",pPartner:"\u0627\u0644\u0634\u0631\u064A\u0643",pParents:"\u0627\u0644\u0648\u0627\u0644\u062F\u0627\u0646",pChildren:"\u0627\u0644\u0623\u0628\u0646\u0627\u0621",pGen:"\u0627\u0644\u062C\u064A\u0644 {0}",pNone:"\u0644\u0627 \u0623\u062D\u062F",pDead:"\u062A\u0648\u0641\u064A",pMood:"\u0627\u0644\u0645\u0632\u0627\u062C",pWants:"\u064A\u0631\u064A\u062F",pMemory:"\u064A\u062A\u0630\u0643\u0631",pSaid:"\u0642\u0627\u0644",pRecent:"\u0645\u0624\u062E\u0631\u0627\u064B",pTraits:"\u0627\u0644\u0635\u0641\u0627\u062A",pFirst:"\u0623\u0648\u0627\u0626\u0644 \u0627\u0644\u0646\u0627\u062C\u064A\u0646",tStrength:"\u0642\u0648\u0629",tSpeed:"\u0633\u0631\u0639\u0629",tIntelligence:"\u0630\u0643\u0627\u0621",tCourage:"\u0634\u062C\u0627\u0639\u0629",tEmpathy:"\u062A\u0639\u0627\u0637\u0641",tMetabolism:"\u0634\u0647\u064A\u0629",tLifespan:"\u0627\u0644\u0639\u0645\u0631 \u0627\u0644\u0645\u062A\u0648\u0642\u0639",bTo:"\u0630\u0627\u0647\u0628 \u0625\u0644\u0649 {0}",bWith:"\u0645\u0639 {0}",bWants:"\u064A\u0631\u064A\u062F: {0}",gDrink:"\u0627\u0644\u0634\u0631\u0628",gEat:"\u0627\u0644\u0623\u0643\u0644",gForage:"\u0625\u064A\u062C\u0627\u062F \u0637\u0639\u0627\u0645",gSleep:"\u0627\u0644\u0646\u0648\u0645",gTalk:"\u0627\u0644\u062D\u062F\u064A\u062B",gWander:"\u0627\u0644\u062A\u062C\u0648\u0644",gRest:"\u0627\u0644\u0631\u0627\u062D\u0629",gTravel:"\u0627\u0644\u0633\u0641\u0631",hintMenu:"+ / \u0631\u062C\u0648\u0639: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",gameMenuItem:"\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0644\u0639\u0628\u0629",hMove:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643",sayLabel:"\u0642\u0644 \u0634\u064A\u0626\u064B\u0627 (\u0641\u0627\u0631\u063A = \u0645\u062C\u0631\u062F \u062A\u062D\u064A\u0629)",wFollow:"\u062A\u062A\u0628\u0639 \u0634\u062E\u0635",wMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",wCard:"\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0634\u062E\u0635",mNearby:"\u0623\u0642\u0631\u0628 \u0634\u062E\u0635",sThoughtsOnly:"\u0644\u0627 \u064A\u0631\u0649 \u0627\u0644\u0623\u0641\u0643\u0627\u0631 \u0625\u0644\u0627 \u0627\u0644\u0644\u0627\u0639\u0628\u0648\u0646 \u0627\u0644\u0630\u064A\u0646 \u064A\u0633\u0645\u062D \u0644\u0647\u0645 \u0627\u0644\u0645\u0627\u0644\u0643.",mMe:"\u0623\u0646\u0627",dTalk:"\u062A\u062A\u062D\u062F\u062B \u0625\u0644\u064A\u0647.",dNobody:"\u0644\u0627 \u0623\u062D\u062F \u0642\u0631\u064A\u0628 \u0628\u0645\u0627 \u064A\u0643\u0641\u064A.",sZoom:"\u062A\u0643\u0628\u064A\u0631",cPressed:"\u062A\u0645 \u0627\u0644\u0636\u063A\u0637: {0}"}};var gu={en:{mBag:"Bag & crafting",bagHelp:"What you carry. The best weapon and clothes are used by themselves.",bagEmpty:"Your bag is empty. Press A next to a tree, a rock or rubble to gather; hunt animals the same way.",mCraft:"Craft",mGuide:"Recipe guide",guideHelp:"Pick a recipe to put its ingredients in, then Make.",catHelp:"Put ingredients in (A adds one more), then Make.",cMake:"Make",cNoRecipe:"nothing (no recipe)",cClear:"Take everything out",cPut:"Put down: {0}",cWeapon:"Weapon: {0}",cDefence:"Defence: {0} %",cHave:"\u2713",cIn:"In: {0}",cNothingIn:"Nothing in yet.",dCrafted:"You made {0}.",dNoRecipe:"No recipe for that in this category: see the guide.",dNoMat:"You do not have enough for that.",dBagFull:"You cannot carry more of that.",dPlaced:"You put down {0}.",dNoRoom:"No room there: face open ground (a door or a window can go into a wall).",dNoItem:"You have none.",dGot:"You got {0}.",dTooThick:"These trees are too thick to cut.",aHit:"You hit the {0}!",aKilled:"You killed the {0}: {1}.",dBlocked:"Wrecked cars block the road: nobody gets through while travel is closed.",kWeapon:"Weapons",kClothing:"Clothes and armour",kDefence:"Defences",kFurniture:"Furniture",rWood:"wood",rStone:"stone",rScrap:"scrap",rOre:"ore",rBrick:"bricks",rLeather:"leather",rClaw:"claws",rMeat:"meat",xSword:"sword",xAxe:"axe",xSpear:"spear",xBow:"bow",xArrows:"arrows",xClothes:"clothes",xArmor:"armour",xHelmet:"helmet",xPalisade:"palisade",xSpikes:"spikes",xStonewall:"stone wall",xDoor:"door",xWindow:"window",xBed:"bed",xLamp:"lamp",xCampfire:"campfire",anRabbit:"rabbit",anDeer:"deer",anBoar:"boar",anWolf:"wolf",anBear:"bear"},fr:{mBag:"Sac et fabrication",bagHelp:"Ce que tu portes. La meilleure arme et les meilleurs v\xEAtements servent tout seuls.",bagEmpty:"Ton sac est vide. Appuie sur A pr\xE8s d'un arbre, d'un rocher ou de gravats pour r\xE9colter ; chasse les animaux de la m\xEAme fa\xE7on.",mCraft:"Fabriquer",mGuide:"Guide des recettes",guideHelp:"Choisis une recette pour y mettre ses ingr\xE9dients, puis Fabriquer.",catHelp:"Mets des ingr\xE9dients (A en ajoute un), puis Fabriquer.",cMake:"Fabriquer",cNoRecipe:"rien (pas de recette)",cClear:"Tout retirer",cPut:"Poser : {0}",cWeapon:"Arme : {0}",cDefence:"D\xE9fense : {0} %",cHave:"\u2713",cIn:"Dedans : {0}",cNothingIn:"Rien pour l'instant.",dCrafted:"Tu as fabriqu\xE9 : {0}.",dNoRecipe:"Pas de recette pour \xE7a dans cette cat\xE9gorie : vois le guide.",dNoMat:"Tu n'en as pas assez.",dBagFull:"Tu ne peux pas en porter plus.",dPlaced:"Tu as pos\xE9 : {0}.",dNoRoom:"Pas de place : tourne-toi vers un sol libre (une porte ou une fen\xEAtre peut aller dans un mur).",dNoItem:"Tu n'en as pas.",dGot:"Tu as obtenu : {0}.",dTooThick:"Ces arbres sont trop \xE9pais pour \xEAtre coup\xE9s.",aHit:"Tu as frapp\xE9 : {0} !",aKilled:"Tu as tu\xE9 : {0} ({1}).",dBlocked:"Des voitures accident\xE9es bloquent la route : personne ne passe tant que le voyage est ferm\xE9.",kWeapon:"Armes",kClothing:"V\xEAtements et armures",kDefence:"D\xE9fenses",kFurniture:"Meubles",rWood:"bois",rStone:"pierre",rScrap:"ferraille",rOre:"minerai",rBrick:"briques",rLeather:"cuir",rClaw:"griffes",rMeat:"viande",xSword:"\xE9p\xE9e",xAxe:"hache",xSpear:"lance",xBow:"arc",xArrows:"fl\xE8ches",xClothes:"v\xEAtements",xArmor:"armure",xHelmet:"casque",xPalisade:"palissade",xSpikes:"pieux",xStonewall:"mur de pierre",xDoor:"porte",xWindow:"fen\xEAtre",xBed:"lit",xLamp:"lampe",xCampfire:"feu de camp",anRabbit:"lapin",anDeer:"cerf",anBoar:"sanglier",anWolf:"loup",anBear:"ours"},es:{mBag:"Bolsa y fabricaci\xF3n",bagHelp:"Lo que llevas. La mejor arma y la mejor ropa se usan solas.",bagEmpty:"Tu bolsa est\xE1 vac\xEDa. Pulsa A junto a un \xE1rbol, una roca o escombros para recoger; caza animales igual.",mCraft:"Fabricar",mGuide:"Gu\xEDa de recetas",guideHelp:"Elige una receta para poner sus ingredientes y luego Fabricar.",catHelp:"Pon ingredientes (A a\xF1ade uno m\xE1s) y luego Fabricar.",cMake:"Fabricar",cNoRecipe:"nada (no hay receta)",cClear:"Sacarlo todo",cPut:"Colocar: {0}",cWeapon:"Arma: {0}",cDefence:"Defensa: {0} %",cHave:"\u2713",cIn:"Dentro: {0}",cNothingIn:"Nada todav\xEDa.",dCrafted:"Has fabricado: {0}.",dNoRecipe:"No hay receta para eso en esta categor\xEDa: mira la gu\xEDa.",dNoMat:"No tienes suficiente.",dBagFull:"No puedes llevar m\xE1s de eso.",dPlaced:"Has colocado: {0}.",dNoRoom:"No hay sitio: mira hacia suelo libre (una puerta o ventana puede ir en una pared).",dNoItem:"No tienes.",dGot:"Has conseguido: {0}.",dTooThick:"Estos \xE1rboles son demasiado gruesos para cortarlos.",aHit:"\xA1Has golpeado: {0}!",aKilled:"Has matado: {0} ({1}).",dBlocked:"Coches destrozados bloquean la carretera: nadie pasa mientras el viaje est\xE9 cerrado.",kWeapon:"Armas",kClothing:"Ropa y armadura",kDefence:"Defensas",kFurniture:"Muebles",rWood:"madera",rStone:"piedra",rScrap:"chatarra",rOre:"mineral",rBrick:"ladrillos",rLeather:"cuero",rClaw:"garras",rMeat:"carne",xSword:"espada",xAxe:"hacha",xSpear:"lanza",xBow:"arco",xArrows:"flechas",xClothes:"ropa",xArmor:"armadura",xHelmet:"casco",xPalisade:"empalizada",xSpikes:"estacas",xStonewall:"muro de piedra",xDoor:"puerta",xWindow:"ventana",xBed:"cama",xLamp:"l\xE1mpara",xCampfire:"hoguera",anRabbit:"conejo",anDeer:"ciervo",anBoar:"jabal\xED",anWolf:"lobo",anBear:"oso"},ar:{mBag:"\u0627\u0644\u062D\u0642\u064A\u0628\u0629 \u0648\u0627\u0644\u0635\u0646\u0627\u0639\u0629",bagHelp:"\u0645\u0627 \u062A\u062D\u0645\u0644\u0647. \u0623\u0641\u0636\u0644 \u0633\u0644\u0627\u062D \u0648\u0623\u0641\u0636\u0644 \u0644\u0628\u0627\u0633 \u064A\u064F\u0633\u062A\u0639\u0645\u0644\u0627\u0646 \u0648\u062D\u062F\u0647\u0645\u0627.",bagEmpty:"\u062D\u0642\u064A\u0628\u062A\u0643 \u0641\u0627\u0631\u063A\u0629. \u0627\u0636\u063A\u0637 A \u0628\u062C\u0627\u0646\u0628 \u0634\u062C\u0631\u0629 \u0623\u0648 \u0635\u062E\u0631\u0629 \u0623\u0648 \u0623\u0646\u0642\u0627\u0636 \u0644\u062A\u062C\u0645\u0639\u061B \u0648\u0627\u0635\u0637\u062F \u0627\u0644\u062D\u064A\u0648\u0627\u0646\u0627\u062A \u0628\u0627\u0644\u0637\u0631\u064A\u0642\u0629 \u0646\u0641\u0633\u0647\u0627.",mCraft:"\u0627\u0635\u0646\u0639",mGuide:"\u062F\u0644\u064A\u0644 \u0627\u0644\u0648\u0635\u0641\u0627\u062A",guideHelp:"\u0627\u062E\u062A\u0631 \u0648\u0635\u0641\u0629 \u0644\u062A\u0636\u0639 \u0645\u0643\u0648\u0646\u0627\u062A\u0647\u0627\u060C \u062B\u0645 \u0627\u0635\u0646\u0639.",catHelp:"\u0636\u0639 \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A (A \u064A\u0636\u064A\u0641 \u0648\u0627\u062D\u062F\u0627)\u060C \u062B\u0645 \u0627\u0635\u0646\u0639.",cMake:"\u0627\u0635\u0646\u0639",cNoRecipe:"\u0644\u0627 \u0634\u064A\u0621 (\u0644\u0627 \u0648\u0635\u0641\u0629)",cClear:"\u0623\u062E\u0631\u062C \u0643\u0644 \u0634\u064A\u0621",cPut:"\u0636\u0639: {0}",cWeapon:"\u0627\u0644\u0633\u0644\u0627\u062D: {0}",cDefence:"\u0627\u0644\u062F\u0641\u0627\u0639: {0} %",cHave:"\u2713",cIn:"\u0628\u0627\u0644\u062F\u0627\u062E\u0644: {0}",cNothingIn:"\u0644\u0627 \u0634\u064A\u0621 \u0628\u0639\u062F.",dCrafted:"\u0635\u0646\u0639\u062A: {0}.",dNoRecipe:"\u0644\u0627 \u0648\u0635\u0641\u0629 \u0644\u0647\u0630\u0627 \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0641\u0626\u0629: \u0627\u0646\u0638\u0631 \u0627\u0644\u062F\u0644\u064A\u0644.",dNoMat:"\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0645\u0627 \u064A\u0643\u0641\u064A.",dBagFull:"\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062D\u0645\u0644 \u0627\u0644\u0645\u0632\u064A\u062F \u0645\u0646 \u0647\u0630\u0627.",dPlaced:"\u0648\u0636\u0639\u062A: {0}.",dNoRoom:"\u0644\u0627 \u0645\u0643\u0627\u0646 \u0647\u0646\u0627: \u0627\u062A\u062C\u0647 \u0625\u0644\u0649 \u0623\u0631\u0636 \u0641\u0627\u0631\u063A\u0629 (\u0627\u0644\u0628\u0627\u0628 \u0623\u0648 \u0627\u0644\u0646\u0627\u0641\u0630\u0629 \u064A\u0645\u0643\u0646 \u0648\u0636\u0639\u0647\u0645\u0627 \u0641\u064A \u062C\u062F\u0627\u0631).",dNoItem:"\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0645\u0646\u0647.",dGot:"\u062D\u0635\u0644\u062A \u0639\u0644\u0649: {0}.",dTooThick:"\u0647\u0630\u0647 \u0627\u0644\u0623\u0634\u062C\u0627\u0631 \u0633\u0645\u064A\u0643\u0629 \u062C\u062F\u0627 \u0644\u0642\u0637\u0639\u0647\u0627.",aHit:"\u0636\u0631\u0628\u062A: {0}!",aKilled:"\u0642\u062A\u0644\u062A: {0} ({1}).",dBlocked:"\u0633\u064A\u0627\u0631\u0627\u062A \u0645\u062D\u0637\u0645\u0629 \u062A\u0633\u062F \u0627\u0644\u0637\u0631\u064A\u0642: \u0644\u0627 \u0623\u062D\u062F \u064A\u0645\u0631 \u0645\u0627 \u062F\u0627\u0645 \u0627\u0644\u0633\u0641\u0631 \u0645\u063A\u0644\u0642\u0627.",kWeapon:"\u0627\u0644\u0623\u0633\u0644\u062D\u0629",kClothing:"\u0627\u0644\u0645\u0644\u0627\u0628\u0633 \u0648\u0627\u0644\u062F\u0631\u0648\u0639",kDefence:"\u0627\u0644\u062F\u0641\u0627\u0639\u0627\u062A",kFurniture:"\u0627\u0644\u0623\u062B\u0627\u062B",rWood:"\u062E\u0634\u0628",rStone:"\u062D\u062C\u0631",rScrap:"\u062E\u0631\u062F\u0629",rOre:"\u062E\u0627\u0645",rBrick:"\u0637\u0648\u0628",rLeather:"\u062C\u0644\u062F",rClaw:"\u0645\u062E\u0627\u0644\u0628",rMeat:"\u0644\u062D\u0645",xSword:"\u0633\u064A\u0641",xAxe:"\u0641\u0623\u0633",xSpear:"\u0631\u0645\u062D",xBow:"\u0642\u0648\u0633",xArrows:"\u0633\u0647\u0627\u0645",xClothes:"\u0645\u0644\u0627\u0628\u0633",xArmor:"\u062F\u0631\u0639",xHelmet:"\u062E\u0648\u0630\u0629",xPalisade:"\u0633\u064A\u0627\u062C \u062E\u0634\u0628\u064A",xSpikes:"\u0623\u0648\u062A\u0627\u062F",xStonewall:"\u062C\u062F\u0627\u0631 \u062D\u062C\u0631\u064A",xDoor:"\u0628\u0627\u0628",xWindow:"\u0646\u0627\u0641\u0630\u0629",xBed:"\u0633\u0631\u064A\u0631",xLamp:"\u0645\u0635\u0628\u0627\u062D",xCampfire:"\u0646\u0627\u0631 \u0645\u062E\u064A\u0645",anRabbit:"\u0623\u0631\u0646\u0628",anDeer:"\u063A\u0632\u0627\u0644",anBoar:"\u062E\u0646\u0632\u064A\u0631 \u0628\u0631\u064A",anWolf:"\u0630\u0626\u0628",anBear:"\u062F\u0628"}};var xu={en:{sCamera:"Camera",camTop:"From above",camThird:"Third person",camFirst:"First person",aCamera:"Change the camera",hTurn:"turn",aWheel:"Quick actions (hold)",wheelHelp:"Hold, point with the stick, let go",wheelRemote:"Arrows to pick, OK to do it, Back to close",qUse:"Use / talk",qEat:"Eat",qDrink:"Drink",qSleep:"Sleep / wake up",qPickup:"Pick up",qBag:"Bag",qCraft:"Craft",qPlace:"Put down",qCamera:"Camera",qNothing:"Nothing to put down."},fr:{sCamera:"Cam\xE9ra",camTop:"Vue du dessus",camThird:"Troisi\xE8me personne",camFirst:"Premi\xE8re personne",aCamera:"Changer de cam\xE9ra",hTurn:"tourner",aWheel:"Actions rapides (maintenir)",wheelHelp:"Maintenez, visez avec le stick, rel\xE2chez",wheelRemote:"Fl\xE8ches pour choisir, OK pour agir, Retour pour fermer",qUse:"Utiliser / parler",qEat:"Manger",qDrink:"Boire",qSleep:"Dormir / se r\xE9veiller",qPickup:"Ramasser",qBag:"Sac",qCraft:"Fabriquer",qPlace:"Poser",qCamera:"Cam\xE9ra",qNothing:"Rien \xE0 poser."},es:{sCamera:"C\xE1mara",camTop:"Desde arriba",camThird:"Tercera persona",camFirst:"Primera persona",aCamera:"Cambiar la c\xE1mara",hTurn:"girar",aWheel:"Acciones r\xE1pidas (mantener)",wheelHelp:"Mant\xE9n, apunta con el stick, suelta",wheelRemote:"Flechas para elegir, OK para hacerlo, Atr\xE1s para cerrar",qUse:"Usar / hablar",qEat:"Comer",qDrink:"Beber",qSleep:"Dormir / despertar",qPickup:"Recoger",qBag:"Bolsa",qCraft:"Fabricar",qPlace:"Colocar",qCamera:"C\xE1mara",qNothing:"Nada que colocar."},ar:{sCamera:"\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627",camTop:"\u0645\u0646 \u0627\u0644\u0623\u0639\u0644\u0649",camThird:"\u0645\u0646\u0638\u0648\u0631 \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062B\u0627\u0644\u062B",camFirst:"\u0645\u0646\u0638\u0648\u0631 \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u0623\u0648\u0644",aCamera:"\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627",hTurn:"\u0627\u0644\u062F\u0648\u0631\u0627\u0646",aWheel:"\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0633\u0631\u064A\u0639\u0629 (\u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u0627\u064B)",wheelHelp:"\u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u0627\u064B\u060C \u0648\u062C\u0651\u0647 \u0628\u0627\u0644\u0639\u0635\u0627\u060C \u062B\u0645 \u0627\u062A\u0631\u0643",wheelRemote:"\u0627\u0644\u0623\u0633\u0647\u0645 \u0644\u0644\u0627\u062E\u062A\u064A\u0627\u0631\u060C OK \u0644\u0644\u062A\u0646\u0641\u064A\u0630\u060C \u0631\u062C\u0648\u0639 \u0644\u0644\u0625\u063A\u0644\u0627\u0642",qUse:"\u0627\u0633\u062A\u062E\u062F\u0627\u0645 / \u062A\u062D\u062F\u062B",qEat:"\u0623\u0643\u0644",qDrink:"\u0634\u0631\u0628",qSleep:"\u0646\u0648\u0645 / \u0627\u0633\u062A\u064A\u0642\u0627\u0638",qPickup:"\u0627\u0644\u062A\u0642\u0627\u0637",qBag:"\u0627\u0644\u062D\u0642\u064A\u0628\u0629",qCraft:"\u0635\u0646\u0639",qPlace:"\u0648\u0636\u0639",qCamera:"\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627",qNothing:"\u0644\u0627 \u0634\u064A\u0621 \u0644\u0648\u0636\u0639\u0647."}};var vu={en:{married:"You and {0} are married now!",divorced:"You and {0} are divorced.",sndTitle:"Sound",sndOn:"Sound",sndMaster:"Volume",sndFx:"Effects, people and animals",sndAmb:"Ambience (birds, night, fire)",sndUi:"Menus",sndHelp:"OK changes a volume by 10 %. Real recordings (CC0), see docs/audio/CREDITS.md.",aAttack:"Attack",aAim:"Aim the bow (hold)",aBuild:"Build",aAttackPerson:"Attack a person (PvP)",mPvp:"PvP (fighting people)",pvpOnW:"On",pvpOffW:"Off",pvpNoteOn:"PvP is ON: you can hit people and they can hit you back. Damage is small.",pvpNoteOff:"PvP is off. Nobody can hit you and you cannot hit people.",pvpNeed:"Turn PvP on first (Settings > How to fight).",theirPvpOff:"That player has PvP off.",pHit:"You hit them: {0} damage.",pvpHelp:"PvP is a separate action: Attack never hits a person. Turn PvP on, then use Attack a person. Damage is small (at most 30 with a strong weapon on someone unarmed, about 10 on an armed person, 3 bare-handed on armour). Nobody dies of it.",dNobodyNear:"Nobody next to you to talk to.",dSwing:"Nothing to hit in front of you.",noBow:"You need a bow (Bag > Craft > Weapons: 2 wood + 1 leather).",noArrows:"No arrows left (Weapons: 2 wood + 1 stone = 5 arrows).",missed:"Missed. {0} arrows left.",arrowsLeft:"{0} arrows left.",aimOn:"Aiming: point with the stick, {0} to shoot.",bindsNew:"New buttons: {0}",mFight:"How to fight",fightHelp:"Attack hits what is in front of you: turn towards it first. Your best weapon is used by itself. With a bow and arrows, Attack shoots when nothing is in reach; hold Aim to point exactly, a red ring shows what you will hit.",fFists:"Bare hands: {0} damage, reach 2.5 m.",fWeapon:"{0}: {1} damage. Craft: {2}.",fBow:"Bow: 30 damage up close, 24 at 10 to 16 m, 18 up to 22 m. Craft: {0}. Arrows: {1} = 5.",fArmour:"Clothes and armour take part of every bite: clothes 15 %, armour 35 %, helmet 15 %.",fTips:"Zombies come at 21:00 and crumble at dawn. Fire and lamps keep animals away; spikes hurt zombies; stone walls take half damage.",fHave:"You have",bTitle:"Build",bHelp:"Turn to where it should go, then pick it: it is put on the ground in front of you. Things not in your bag are made from your materials first.",bHut:"Hut (12 wood, 4 stone)",bInBag:"in bag: {0}",bMissing:"missing",buildNeed:"Not enough materials: {0}.",bKept:"Made, but there is no room in front: it is in your bag.",gTitle:"Graphics",gQuality:"Quality",gAuto:"Automatic",gLow:"Low (fastest)",gMid:"Medium",gHigh:"High",gFog:"Fog",gOff:"Off",gLight:"Light",gNormal:"Normal",gThick:"Thick",gDist:"View distance",gNear:"Near (faster)",gFar:"Far",gFps:"Show fps",gRestart:"Apply the new quality now (reloads the view)",gHelp:"Low quality, thick fog and a near view make the game faster on small TVs. A new quality needs the view to reload.",pGoal:"Objective",pLevel:"Level {0} \xB7 {1} points",mMe:"Me",meTitle:"My character",lookTitle:"How I look",lookHelp:"Welcome! Choose your character: woman or man, and a skin tone. Then Save.",lookWoman:"Woman",lookMan:"Man",lookSkin:"Skin tone",lookSave:"Save",lookSexNote:"You can change between woman and man once a week.",sexWeek:"You can change that again in {0} days.",sexPregnant:"Not while expecting a baby.",looked:"Saved.",autoRow:"AI autopilot when I am away",autoHelp:"On: when you leave, the AI lives your character (eats, works, talks) following your rules. Off: it sleeps until you come back.",autoOn:"Autopilot on: the AI lives for you while you are away.",autoOff:"Autopilot off: your character sleeps while you are away.",myRules:"My rules for the autopilot",ruleAdd:"Add a rule",ruleHelp:'Up to {0} rules, in your own words ("never go to the woods", "you must get married"). OK on a rule removes it.',ruleLabel:"A rule for your character",rulesFull:"You already have 5 rules: remove one first.",ruleAdded:"Rule added.",ruleRemoved:"Rule removed.",meHut:"Build a hut here (12 wood, 4 stone)",built:"Hut built.",needHut:"A hut needs 12 wood and 4 stone.",mePartner:"Partner",meChildren:"Children",meNone:"none yet",meExpecting:"A baby is coming in {0} hours.",meTraits:"Strength {0} \xB7 Speed {1} \xB7 Mind {2} \xB7 Courage {3} \xB7 Kindness {4}",meHp:"Health {0}",meGoals:"Done lately",askPartner:"Ask to be my partner",askMarry:"Propose marriage",askDivorce:"Ask for a divorce",askingMarry:"You ask {0} to marry you\u2026",askingDivorce:"You tell {0} you want a divorce\u2026",tryChild:"Try for a child",partners:"{0} said yes: you are partners now.",expecting:"A baby is on the way!",tooFar:"Get closer first."},fr:{married:"Vous \xEAtes maintenant mari\xE9(e) avec {0} !",divorced:"Vous avez divorc\xE9 de {0}.",sndTitle:"Son",sndOn:"Son",sndMaster:"Volume",sndFx:"Effets, personnes et animaux",sndAmb:"Ambiance (oiseaux, nuit, feu)",sndUi:"Menus",sndHelp:"OK change un volume de 10 %. Vrais enregistrements (CC0), voir docs/audio/CREDITS.md.",aAttack:"Attaquer",aAim:"Viser \xE0 l\u2019arc (maintenir)",aBuild:"Construire",aAttackPerson:"Attaquer une personne (JcJ)",mPvp:"JcJ (se battre contre des gens)",pvpOnW:"Activ\xE9",pvpOffW:"D\xE9sactiv\xE9",pvpNoteOn:"JcJ ACTIV\xC9 : vous pouvez frapper des gens et ils peuvent riposter. Les d\xE9g\xE2ts sont faibles.",pvpNoteOff:"JcJ d\xE9sactiv\xE9. Personne ne peut vous frapper et vous ne pouvez frapper personne.",pvpNeed:"Activez d\u2019abord le JcJ (R\xE9glages > Comment se battre).",theirPvpOff:"Ce joueur a d\xE9sactiv\xE9 le JcJ.",pHit:"Vous le frappez : {0} d\xE9g\xE2ts.",pvpHelp:"Le JcJ est une action \xE0 part : Attaquer ne frappe jamais une personne. Activez le JcJ, puis utilisez Attaquer une personne. Les d\xE9g\xE2ts sont faibles (30 au plus avec une arme forte sur quelqu\u2019un de d\xE9sarm\xE9, environ 10 sur une personne arm\xE9e, 3 \xE0 mains nues sur une armure). Personne n\u2019en meurt.",dNobodyNear:"Personne \xE0 c\xF4t\xE9 de vous \xE0 qui parler.",dSwing:"Rien \xE0 frapper devant vous.",noBow:"Il faut un arc (Sac > Fabriquer > Armes : 2 bois + 1 cuir).",noArrows:"Plus de fl\xE8ches (Armes : 2 bois + 1 pierre = 5 fl\xE8ches).",missed:"Rat\xE9. Il reste {0} fl\xE8ches.",arrowsLeft:"Il reste {0} fl\xE8ches.",aimOn:"Vis\xE9e : orientez avec le stick, {0} pour tirer.",bindsNew:"Nouveaux boutons : {0}",mFight:"Comment se battre",fightHelp:"Attaquer frappe ce qui est devant vous : tournez-vous d\u2019abord vers lui. Votre meilleure arme est utilis\xE9e toute seule. Avec un arc et des fl\xE8ches, Attaquer tire quand rien n\u2019est \xE0 port\xE9e ; maintenez Viser pour viser pr\xE9cis\xE9ment, un anneau rouge montre ce que vous toucherez.",fFists:"Mains nues : {0} de d\xE9g\xE2ts, port\xE9e 2,5 m.",fWeapon:"{0} : {1} de d\xE9g\xE2ts. Fabrication : {2}.",fBow:"Arc : 30 de d\xE9g\xE2ts de pr\xE8s, 24 entre 10 et 16 m, 18 jusqu\u2019\xE0 22 m. Fabrication : {0}. Fl\xE8ches : {1} = 5.",fArmour:"Les v\xEAtements et l\u2019armure retirent une part de chaque morsure : v\xEAtements 15 %, armure 35 %, casque 15 %.",fTips:"Les zombies arrivent \xE0 21 h et tombent en poussi\xE8re \xE0 l\u2019aube. Le feu et les lampes \xE9loignent les animaux ; les pieux blessent les zombies ; les murs de pierre prennent moiti\xE9 moins de d\xE9g\xE2ts.",fHave:"Vous avez",bTitle:"Construire",bHelp:"Tournez-vous vers l\u2019endroit voulu, puis choisissez : c\u2019est pos\xE9 au sol devant vous. Ce qui n\u2019est pas dans votre sac est d\u2019abord fabriqu\xE9 avec vos mat\xE9riaux.",bHut:"Cabane (12 bois, 4 pierres)",bInBag:"dans le sac : {0}",bMissing:"manque",buildNeed:"Pas assez de mat\xE9riaux : {0}.",bKept:"Fabriqu\xE9, mais pas de place devant : c\u2019est dans votre sac.",gTitle:"Graphismes",gQuality:"Qualit\xE9",gAuto:"Automatique",gLow:"Basse (la plus rapide)",gMid:"Moyenne",gHigh:"Haute",gFog:"Brouillard",gOff:"Aucun",gLight:"L\xE9ger",gNormal:"Normal",gThick:"\xC9pais",gDist:"Distance de vue",gNear:"Proche (plus rapide)",gFar:"Loin",gFps:"Afficher les fps",gRestart:"Appliquer la nouvelle qualit\xE9 maintenant (recharge la vue)",gHelp:"Une qualit\xE9 basse, un brouillard \xE9pais et une vue proche rendent le jeu plus rapide sur les petites TV. Une nouvelle qualit\xE9 demande de recharger la vue.",pGoal:"Objectif",pLevel:"Niveau {0} \xB7 {1} points",mMe:"Moi",meTitle:"Mon personnage",lookTitle:"Mon apparence",lookHelp:"Bienvenue ! Choisissez votre personnage : femme ou homme, et une couleur de peau. Puis Enregistrer.",lookWoman:"Femme",lookMan:"Homme",lookSkin:"Couleur de peau",lookSave:"Enregistrer",lookSexNote:"Vous pouvez changer entre femme et homme une fois par semaine.",sexWeek:"Vous pourrez changer cela dans {0} jours.",sexPregnant:"Pas pendant une grossesse.",looked:"Enregistr\xE9.",autoRow:"Pilote IA quand je suis absent",autoHelp:"Activ\xE9 : quand vous partez, l\u2019IA vit votre personnage (mange, travaille, parle) selon vos r\xE8gles. D\xE9sactiv\xE9 : il dort jusqu\u2019\xE0 votre retour.",autoOn:"Pilote activ\xE9 : l\u2019IA vit pour vous pendant votre absence.",autoOff:"Pilote d\xE9sactiv\xE9 : votre personnage dort pendant votre absence.",myRules:"Mes r\xE8gles pour le pilote",ruleAdd:"Ajouter une r\xE8gle",ruleHelp:"Jusqu\u2019\xE0 {0} r\xE8gles, avec vos mots (\xAB ne va jamais dans les bois \xBB, \xAB tu dois te marier \xBB). OK sur une r\xE8gle la retire.",ruleLabel:"Une r\xE8gle pour votre personnage",rulesFull:"Vous avez d\xE9j\xE0 5 r\xE8gles : retirez-en une d\u2019abord.",ruleAdded:"R\xE8gle ajout\xE9e.",ruleRemoved:"R\xE8gle retir\xE9e.",meHut:"Construire une cabane ici (12 bois, 4 pierres)",built:"Cabane construite.",needHut:"Une cabane demande 12 bois et 4 pierres.",mePartner:"Partenaire",meChildren:"Enfants",meNone:"pas encore",meExpecting:"Un b\xE9b\xE9 arrive dans {0} heures.",meTraits:"Force {0} \xB7 Vitesse {1} \xB7 Esprit {2} \xB7 Courage {3} \xB7 Gentillesse {4}",meHp:"Sant\xE9 {0}",meGoals:"Fait r\xE9cemment",askPartner:"Demander d\u2019\xEAtre mon partenaire",askMarry:"Demander en mariage",askDivorce:"Demander le divorce",askingMarry:"Vous demandez \xE0 {0} de vous \xE9pouser\u2026",askingDivorce:"Vous dites \xE0 {0} que vous voulez divorcer\u2026",tryChild:"Essayer d\u2019avoir un enfant",partners:"{0} a dit oui : vous \xEAtes partenaires.",expecting:"Un b\xE9b\xE9 est en route !",tooFar:"Approchez-vous d\u2019abord."},es:{married:"\xA1Ahora est\xE1s casado/a con {0}!",divorced:"Te has divorciado de {0}.",sndTitle:"Sonido",sndOn:"Sonido",sndMaster:"Volumen",sndFx:"Efectos, personas y animales",sndAmb:"Ambiente (p\xE1jaros, noche, fuego)",sndUi:"Men\xFAs",sndHelp:"OK cambia un volumen en un 10 %. Grabaciones reales (CC0), ver docs/audio/CREDITS.md.",aAttack:"Atacar",aAim:"Apuntar con el arco (mantener)",aBuild:"Construir",aAttackPerson:"Atacar a una persona (PvP)",mPvp:"PvP (pelear con gente)",pvpOnW:"Activado",pvpOffW:"Desactivado",pvpNoteOn:"PvP ACTIVADO: puedes golpear a la gente y te pueden devolver el golpe. El da\xF1o es peque\xF1o.",pvpNoteOff:"PvP desactivado. Nadie puede golpearte y t\xFA no puedes golpear a nadie.",pvpNeed:"Activa primero el PvP (Ajustes > C\xF3mo luchar).",theirPvpOff:"Ese jugador tiene el PvP desactivado.",pHit:"Lo golpeas: {0} de da\xF1o.",pvpHelp:"El PvP es una acci\xF3n aparte: Atacar nunca golpea a una persona. Activa el PvP y usa Atacar a una persona. El da\xF1o es peque\xF1o (30 como mucho con un arma fuerte contra alguien desarmado, unos 10 contra una persona armada, 3 con las manos contra armadura). Nadie muere por eso.",dNobodyNear:"No hay nadie a tu lado con quien hablar.",dSwing:"Nada que golpear delante de ti.",noBow:"Necesitas un arco (Bolsa > Fabricar > Armas: 2 madera + 1 cuero).",noArrows:"No quedan flechas (Armas: 2 madera + 1 piedra = 5 flechas).",missed:"Fallaste. Quedan {0} flechas.",arrowsLeft:"Quedan {0} flechas.",aimOn:"Apuntando: dirige con el stick, {0} para disparar.",bindsNew:"Botones nuevos: {0}",mFight:"C\xF3mo luchar",fightHelp:"Atacar golpea lo que tienes delante: g\xEDrate hacia ello primero. Tu mejor arma se usa sola. Con arco y flechas, Atacar dispara cuando nada est\xE1 al alcance; mant\xE9n Apuntar para apuntar con precisi\xF3n, un anillo rojo muestra a qu\xE9 dar\xE1s.",fFists:"Manos vac\xEDas: {0} de da\xF1o, alcance 2,5 m.",fWeapon:"{0}: {1} de da\xF1o. Fabricar: {2}.",fBow:"Arco: 30 de da\xF1o de cerca, 24 entre 10 y 16 m, 18 hasta 22 m. Fabricar: {0}. Flechas: {1} = 5.",fArmour:"La ropa y la armadura quitan parte de cada mordisco: ropa 15 %, armadura 35 %, casco 15 %.",fTips:"Los zombis llegan a las 21:00 y se deshacen al amanecer. El fuego y las l\xE1mparas alejan a los animales; las estacas hieren a los zombis; los muros de piedra reciben la mitad de da\xF1o.",fHave:"Tienes",bTitle:"Construir",bHelp:"G\xEDrate hacia donde debe ir y el\xEDgelo: se pone en el suelo delante de ti. Lo que no est\xE1 en tu bolsa se fabrica antes con tus materiales.",bHut:"Caba\xF1a (12 madera, 4 piedra)",bInBag:"en la bolsa: {0}",bMissing:"falta",buildNeed:"No hay materiales suficientes: {0}.",bKept:"Fabricado, pero no hay sitio delante: est\xE1 en tu bolsa.",gTitle:"Gr\xE1ficos",gQuality:"Calidad",gAuto:"Autom\xE1tica",gLow:"Baja (la m\xE1s r\xE1pida)",gMid:"Media",gHigh:"Alta",gFog:"Niebla",gOff:"No",gLight:"Ligera",gNormal:"Normal",gThick:"Densa",gDist:"Distancia de vista",gNear:"Cerca (m\xE1s r\xE1pido)",gFar:"Lejos",gFps:"Mostrar fps",gRestart:"Aplicar la nueva calidad ahora (recarga la vista)",gHelp:"Calidad baja, niebla densa y vista cercana hacen el juego m\xE1s r\xE1pido en televisores peque\xF1os. Una nueva calidad necesita recargar la vista.",pGoal:"Objetivo",pLevel:"Nivel {0} \xB7 {1} puntos",mMe:"Yo",meTitle:"Mi personaje",lookTitle:"Mi aspecto",lookHelp:"\xA1Bienvenido! Elige tu personaje: mujer u hombre, y un tono de piel. Luego Guardar.",lookWoman:"Mujer",lookMan:"Hombre",lookSkin:"Tono de piel",lookSave:"Guardar",lookSexNote:"Puedes cambiar entre mujer y hombre una vez por semana.",sexWeek:"Podr\xE1s cambiarlo de nuevo en {0} d\xEDas.",sexPregnant:"No durante un embarazo.",looked:"Guardado.",autoRow:"Piloto IA cuando no estoy",autoHelp:"Activado: cuando te vas, la IA vive tu personaje (come, trabaja, habla) seg\xFAn tus reglas. Desactivado: duerme hasta que vuelvas.",autoOn:"Piloto activado: la IA vive por ti mientras no est\xE1s.",autoOff:"Piloto desactivado: tu personaje duerme mientras no est\xE1s.",myRules:"Mis reglas para el piloto",ruleAdd:"A\xF1adir una regla",ruleHelp:"Hasta {0} reglas, con tus palabras (\xABnunca vayas al bosque\xBB, \xABdebes casarte\xBB). OK en una regla la quita.",ruleLabel:"Una regla para tu personaje",rulesFull:"Ya tienes 5 reglas: quita una primero.",ruleAdded:"Regla a\xF1adida.",ruleRemoved:"Regla quitada.",meHut:"Construir una caba\xF1a aqu\xED (12 madera, 4 piedra)",built:"Caba\xF1a construida.",needHut:"Una caba\xF1a necesita 12 de madera y 4 de piedra.",mePartner:"Pareja",meChildren:"Hijos",meNone:"todav\xEDa no",meExpecting:"Un beb\xE9 llega en {0} horas.",meTraits:"Fuerza {0} \xB7 Velocidad {1} \xB7 Mente {2} \xB7 Valor {3} \xB7 Bondad {4}",meHp:"Salud {0}",meGoals:"Hecho hace poco",askPartner:"Pedir que sea mi pareja",askMarry:"Proponer matrimonio",askDivorce:"Pedir el divorcio",askingMarry:"Le pides a {0} que se case contigo\u2026",askingDivorce:"Le dices a {0} que quieres divorciarte\u2026",tryChild:"Intentar tener un hijo",partners:"{0} dijo que s\xED: ahora sois pareja.",expecting:"\xA1Viene un beb\xE9!",tooFar:"Ac\xE9rcate primero."},ar:{married:"\u0623\u0646\u062A \u0648{0} \u0645\u062A\u0632\u0648\u062C\u0627\u0646 \u0627\u0644\u0622\u0646!",divorced:"\u0623\u0646\u062A \u0648{0} \u0645\u0637\u0644\u0642\u0627\u0646 \u0627\u0644\u0622\u0646.",sndTitle:"\u0627\u0644\u0635\u0648\u062A",sndOn:"\u0627\u0644\u0635\u0648\u062A",sndMaster:"\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0635\u0648\u062A",sndFx:"\u0627\u0644\u0645\u0624\u062B\u0631\u0627\u062A \u0648\u0627\u0644\u0646\u0627\u0633 \u0648\u0627\u0644\u062D\u064A\u0648\u0627\u0646\u0627\u062A",sndAmb:"\u0627\u0644\u0623\u062C\u0648\u0627\u0621 (\u0637\u064A\u0648\u0631\u060C \u0644\u064A\u0644\u060C \u0646\u0627\u0631)",sndUi:"\u0627\u0644\u0642\u0648\u0627\u0626\u0645",sndHelp:"OK \u064A\u063A\u064A\u0651\u0631 \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0635\u0648\u062A \u0628\u0640 10 %. \u062A\u0633\u062C\u064A\u0644\u0627\u062A \u062D\u0642\u064A\u0642\u064A\u0629 (CC0)\u060C \u0627\u0646\u0638\u0631 docs/audio/CREDITS.md.",aAttack:"\u0647\u062C\u0648\u0645",aAim:"\u0627\u0644\u062A\u0635\u0648\u064A\u0628 \u0628\u0627\u0644\u0642\u0648\u0633 (\u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u0627\u064B)",aBuild:"\u0628\u0646\u0627\u0621",aAttackPerson:"\u0645\u0647\u0627\u062C\u0645\u0629 \u0634\u062E\u0635 (\u0644\u0627\u0639\u0628 \u0636\u062F \u0644\u0627\u0639\u0628)",mPvp:"\u0642\u062A\u0627\u0644 \u0627\u0644\u0623\u0634\u062E\u0627\u0635 (PvP)",pvpOnW:"\u0645\u0641\u0639\u0651\u0644",pvpOffW:"\u0645\u062A\u0648\u0642\u0641",pvpNoteOn:"\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0642\u062A\u0627\u0644: \u064A\u0645\u0643\u0646\u0643 \u0636\u0631\u0628 \u0627\u0644\u0646\u0627\u0633 \u0648\u064A\u0645\u0643\u0646\u0647\u0645 \u0627\u0644\u0631\u062F. \u0627\u0644\u0636\u0631\u0631 \u0635\u063A\u064A\u0631.",pvpNoteOff:"\u0627\u0644\u0642\u062A\u0627\u0644 \u0645\u062A\u0648\u0642\u0641. \u0644\u0627 \u0623\u062D\u062F \u064A\u0633\u062A\u0637\u064A\u0639 \u0636\u0631\u0628\u0643 \u0648\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0636\u0631\u0628 \u0623\u062D\u062F.",pvpNeed:"\u0641\u0639\u0651\u0644 \u0627\u0644\u0642\u062A\u0627\u0644 \u0623\u0648\u0644\u0627\u064B (\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A > \u0643\u064A\u0641 \u062A\u0642\u0627\u062A\u0644).",theirPvpOff:"\u0647\u0630\u0627 \u0627\u0644\u0644\u0627\u0639\u0628 \u0623\u0648\u0642\u0641 \u0627\u0644\u0642\u062A\u0627\u0644.",pHit:"\u0636\u0631\u0628\u062A\u0647: \u0636\u0631\u0631 {0}.",pvpHelp:"\u0627\u0644\u0642\u062A\u0627\u0644 \u0628\u064A\u0646 \u0627\u0644\u0623\u0634\u062E\u0627\u0635 \u0625\u062C\u0631\u0627\u0621 \u0645\u0646\u0641\u0635\u0644: \u0627\u0644\u0647\u062C\u0648\u0645 \u0644\u0627 \u064A\u0636\u0631\u0628 \u0634\u062E\u0635\u0627\u064B \u0623\u0628\u062F\u0627\u064B. \u0641\u0639\u0651\u0644 \u0627\u0644\u0642\u062A\u0627\u0644 \u062B\u0645 \u0627\u0633\u062A\u062E\u062F\u0645 \u0645\u0647\u0627\u062C\u0645\u0629 \u0634\u062E\u0635. \u0627\u0644\u0636\u0631\u0631 \u0635\u063A\u064A\u0631 (30 \u0643\u062D\u062F \u0623\u0642\u0635\u0649 \u0628\u0633\u0644\u0627\u062D \u0642\u0648\u064A \u0639\u0644\u0649 \u0634\u062E\u0635 \u0623\u0639\u0632\u0644\u060C \u0646\u062D\u0648 10 \u0639\u0644\u0649 \u0645\u0633\u0644\u0651\u062D\u060C 3 \u0628\u0627\u0644\u064A\u062F\u064A\u0646 \u0639\u0644\u0649 \u062F\u0631\u0639). \u0644\u0627 \u0623\u062D\u062F \u064A\u0645\u0648\u062A \u0628\u0633\u0628\u0628\u0647.",dNobodyNear:"\u0644\u0627 \u0623\u062D\u062F \u0628\u062C\u0627\u0646\u0628\u0643 \u0644\u0644\u062A\u062D\u062F\u062B \u0645\u0639\u0647.",dSwing:"\u0644\u0627 \u0634\u064A\u0621 \u0623\u0645\u0627\u0645\u0643 \u0644\u0636\u0631\u0628\u0647.",noBow:"\u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0642\u0648\u0633 (\u0627\u0644\u062D\u0642\u064A\u0628\u0629 > \u0627\u0644\u0635\u0646\u0639 > \u0627\u0644\u0623\u0633\u0644\u062D\u0629: 2 \u062E\u0634\u0628 + 1 \u062C\u0644\u062F).",noArrows:"\u0644\u0645 \u062A\u0628\u0642 \u0633\u0647\u0627\u0645 (\u0627\u0644\u0623\u0633\u0644\u062D\u0629: 2 \u062E\u0634\u0628 + 1 \u062D\u062C\u0631 = 5 \u0633\u0647\u0627\u0645).",missed:"\u0623\u062E\u0637\u0623\u062A. \u0628\u0642\u064A {0} \u0633\u0647\u0627\u0645.",arrowsLeft:"\u0628\u0642\u064A {0} \u0633\u0647\u0627\u0645.",aimOn:"\u0627\u0644\u062A\u0635\u0648\u064A\u0628: \u0648\u062C\u0651\u0647 \u0628\u0627\u0644\u0639\u0635\u0627\u060C {0} \u0644\u0644\u0631\u0645\u064A.",bindsNew:"\u0623\u0632\u0631\u0627\u0631 \u062C\u062F\u064A\u062F\u0629: {0}",mFight:"\u0643\u064A\u0641 \u062A\u0642\u0627\u062A\u0644",fightHelp:"\u0627\u0644\u0647\u062C\u0648\u0645 \u064A\u0636\u0631\u0628 \u0645\u0627 \u0623\u0645\u0627\u0645\u0643: \u0627\u0633\u062A\u062F\u0631 \u0646\u062D\u0648\u0647 \u0623\u0648\u0644\u064B\u0627. \u064A\u064F\u0633\u062A\u0639\u0645\u0644 \u0623\u0641\u0636\u0644 \u0633\u0644\u0627\u062D \u0644\u062F\u064A\u0643 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627. \u0645\u0639 \u0642\u0648\u0633 \u0648\u0633\u0647\u0627\u0645\u060C \u064A\u0631\u0645\u064A \u0627\u0644\u0647\u062C\u0648\u0645 \u0639\u0646\u062F\u0645\u0627 \u0644\u0627 \u064A\u0643\u0648\u0646 \u0634\u064A\u0621 \u0641\u064A \u0645\u062A\u0646\u0627\u0648\u0644\u0643\u061B \u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u064B\u0627 \u0639\u0644\u0649 \u0627\u0644\u062A\u0635\u0648\u064A\u0628 \u0644\u062A\u0635\u0648\u0651\u0628 \u0628\u062F\u0642\u0629\u060C \u0648\u062A\u064F\u0638\u0647\u0631 \u062D\u0644\u0642\u0629 \u062D\u0645\u0631\u0627\u0621 \u0645\u0627 \u0633\u062A\u0635\u064A\u0628\u0647.",fFists:"\u0628\u0627\u0644\u064A\u062F\u064A\u0646: {0} \u0636\u0631\u0631\u060C \u0627\u0644\u0645\u062F\u0649 2.5 \u0645.",fWeapon:"{0}: {1} \u0636\u0631\u0631. \u0627\u0644\u0635\u0646\u0639: {2}.",fBow:"\u0627\u0644\u0642\u0648\u0633: 30 \u0636\u0631\u0631\u064B\u0627 \u0639\u0646 \u0642\u0631\u0628\u060C 24 \u0628\u064A\u0646 10 \u064816 \u0645\u060C 18 \u062D\u062A\u0649 22 \u0645. \u0627\u0644\u0635\u0646\u0639: {0}. \u0627\u0644\u0633\u0647\u0627\u0645: {1} = 5.",fArmour:"\u0627\u0644\u0645\u0644\u0627\u0628\u0633 \u0648\u0627\u0644\u062F\u0631\u0639 \u062A\u062E\u0641\u0641 \u0643\u0644 \u0639\u0636\u0629: \u0627\u0644\u0645\u0644\u0627\u0628\u0633 15 %\u060C \u0627\u0644\u062F\u0631\u0639 35 %\u060C \u0627\u0644\u062E\u0648\u0630\u0629 15 %.",fTips:"\u064A\u0623\u062A\u064A \u0627\u0644\u0632\u0648\u0645\u0628\u064A \u0639\u0646\u062F 21:00 \u0648\u064A\u062A\u0641\u062A\u062A\u0648\u0646 \u0639\u0646\u062F \u0627\u0644\u0641\u062C\u0631. \u0627\u0644\u0646\u0627\u0631 \u0648\u0627\u0644\u0645\u0635\u0627\u0628\u064A\u062D \u062A\u0628\u0639\u062F \u0627\u0644\u062D\u064A\u0648\u0627\u0646\u0627\u062A\u061B \u0627\u0644\u0623\u0648\u062A\u0627\u062F \u062A\u062C\u0631\u062D \u0627\u0644\u0632\u0648\u0645\u0628\u064A\u061B \u0627\u0644\u062C\u062F\u0631\u0627\u0646 \u0627\u0644\u062D\u062C\u0631\u064A\u0629 \u062A\u062A\u0644\u0642\u0649 \u0646\u0635\u0641 \u0627\u0644\u0636\u0631\u0631.",fHave:"\u0644\u062F\u064A\u0643",bTitle:"\u0628\u0646\u0627\u0621",bHelp:"\u0627\u0633\u062A\u062F\u0631 \u0646\u062D\u0648 \u0627\u0644\u0645\u0643\u0627\u0646 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062B\u0645 \u0627\u062E\u062A\u0631: \u064A\u0648\u0636\u0639 \u0639\u0644\u0649 \u0627\u0644\u0623\u0631\u0636 \u0623\u0645\u0627\u0645\u0643. \u0645\u0627 \u0644\u064A\u0633 \u0641\u064A \u062D\u0642\u064A\u0628\u062A\u0643 \u064A\u064F\u0635\u0646\u0639 \u0623\u0648\u0644\u064B\u0627 \u0645\u0646 \u0645\u0648\u0627\u062F\u0643.",bHut:"\u0643\u0648\u062E (12 \u062E\u0634\u0628\u060C 4 \u062D\u062C\u0627\u0631\u0629)",bInBag:"\u0641\u064A \u0627\u0644\u062D\u0642\u064A\u0628\u0629: {0}",bMissing:"\u0646\u0627\u0642\u0635",buildNeed:"\u0627\u0644\u0645\u0648\u0627\u062F \u063A\u064A\u0631 \u0643\u0627\u0641\u064A\u0629: {0}.",bKept:"\u0635\u064F\u0646\u0639\u060C \u0644\u0643\u0646 \u0644\u0627 \u0645\u0643\u0627\u0646 \u0623\u0645\u0627\u0645\u0643: \u0625\u0646\u0647 \u0641\u064A \u062D\u0642\u064A\u0628\u062A\u0643.",gTitle:"\u0627\u0644\u0631\u0633\u0648\u0645\u0627\u062A",gQuality:"\u0627\u0644\u062C\u0648\u062F\u0629",gAuto:"\u062A\u0644\u0642\u0627\u0626\u064A",gLow:"\u0645\u0646\u062E\u0641\u0636\u0629 (\u0627\u0644\u0623\u0633\u0631\u0639)",gMid:"\u0645\u062A\u0648\u0633\u0637\u0629",gHigh:"\u0639\u0627\u0644\u064A\u0629",gFog:"\u0627\u0644\u0636\u0628\u0627\u0628",gOff:"\u0628\u062F\u0648\u0646",gLight:"\u062E\u0641\u064A\u0641",gNormal:"\u0639\u0627\u062F\u064A",gThick:"\u0643\u062B\u064A\u0641",gDist:"\u0645\u0633\u0627\u0641\u0629 \u0627\u0644\u0631\u0624\u064A\u0629",gNear:"\u0642\u0631\u064A\u0628\u0629 (\u0623\u0633\u0631\u0639)",gFar:"\u0628\u0639\u064A\u062F\u0629",gFps:"\u0625\u0638\u0647\u0627\u0631 \u0639\u062F\u062F \u0627\u0644\u0625\u0637\u0627\u0631\u0627\u062A",gRestart:"\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0627\u0644\u0622\u0646 (\u064A\u0639\u064A\u062F \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0639\u0631\u0636)",gHelp:"\u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0645\u0646\u062E\u0641\u0636\u0629 \u0648\u0627\u0644\u0636\u0628\u0627\u0628 \u0627\u0644\u0643\u062B\u064A\u0641 \u0648\u0627\u0644\u0631\u0624\u064A\u0629 \u0627\u0644\u0642\u0631\u064A\u0628\u0629 \u062A\u062C\u0639\u0644 \u0627\u0644\u0644\u0639\u0628\u0629 \u0623\u0633\u0631\u0639 \u0639\u0644\u0649 \u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u062A\u0644\u0641\u0627\u0632 \u0627\u0644\u0635\u063A\u064A\u0631\u0629. \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0625\u0639\u0627\u062F\u0629 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0639\u0631\u0636.",pGoal:"\u0627\u0644\u0647\u062F\u0641",pLevel:"\u0627\u0644\u0645\u0633\u062A\u0648\u0649 {0} \xB7 {1} \u0646\u0642\u0637\u0629",mMe:"\u0623\u0646\u0627",meTitle:"\u0634\u062E\u0635\u064A\u062A\u064A",lookTitle:"\u0645\u0638\u0647\u0631\u064A",lookHelp:"\u0645\u0631\u062D\u0628\u064B\u0627! \u0627\u062E\u062A\u0631 \u0634\u062E\u0635\u064A\u062A\u0643: \u0627\u0645\u0631\u0623\u0629 \u0623\u0648 \u0631\u062C\u0644\u060C \u0648\u0644\u0648\u0646 \u0627\u0644\u0628\u0634\u0631\u0629. \u062B\u0645 \u0627\u062D\u0641\u0638.",lookWoman:"\u0627\u0645\u0631\u0623\u0629",lookMan:"\u0631\u062C\u0644",lookSkin:"\u0644\u0648\u0646 \u0627\u0644\u0628\u0634\u0631\u0629",lookSave:"\u062D\u0641\u0638",lookSexNote:"\u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0628\u064A\u0646 \u0627\u0645\u0631\u0623\u0629 \u0648\u0631\u062C\u0644 \u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0641\u064A \u0627\u0644\u0623\u0633\u0628\u0648\u0639.",sexWeek:"\u064A\u0645\u0643\u0646\u0643 \u062A\u063A\u064A\u064A\u0631 \u0630\u0644\u0643 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649 \u0628\u0639\u062F {0} \u0623\u064A\u0627\u0645.",sexPregnant:"\u0644\u064A\u0633 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062D\u0645\u0644.",looked:"\u062A\u0645 \u0627\u0644\u062D\u0641\u0638.",autoRow:"\u0627\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0639\u0646\u062F \u063A\u064A\u0627\u0628\u064A",autoHelp:"\u0645\u0641\u0639\u0651\u0644: \u0639\u0646\u062F\u0645\u0627 \u062A\u063A\u0627\u062F\u0631\u060C \u064A\u0639\u064A\u0634 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0634\u062E\u0635\u064A\u062A\u0643 (\u064A\u0623\u0643\u0644\u060C \u064A\u0639\u0645\u0644\u060C \u064A\u062A\u062D\u062F\u062B) \u062D\u0633\u0628 \u0642\u0648\u0627\u0639\u062F\u0643. \u0645\u0639\u0637\u0651\u0644: \u062A\u0646\u0627\u0645 \u062D\u062A\u0649 \u062A\u0639\u0648\u062F.",autoOn:"\u0627\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A \u0645\u0641\u0639\u0651\u0644: \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u064A\u0639\u064A\u0634 \u0639\u0646\u0643 \u0623\u062B\u0646\u0627\u0621 \u063A\u064A\u0627\u0628\u0643.",autoOff:"\u0627\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A \u0645\u0639\u0637\u0651\u0644: \u0634\u062E\u0635\u064A\u062A\u0643 \u062A\u0646\u0627\u0645 \u0623\u062B\u0646\u0627\u0621 \u063A\u064A\u0627\u0628\u0643.",myRules:"\u0642\u0648\u0627\u0639\u062F\u064A \u0644\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A",ruleAdd:"\u0625\u0636\u0627\u0641\u0629 \u0642\u0627\u0639\u062F\u0629",ruleHelp:"\u062D\u062A\u0649 {0} \u0642\u0648\u0627\u0639\u062F \u0628\u0643\u0644\u0645\u0627\u062A\u0643 (\xAB\u0644\u0627 \u062A\u0630\u0647\u0628 \u0625\u0644\u0649 \u0627\u0644\u063A\u0627\u0628\u0629 \u0623\u0628\u062F\u064B\u0627\xBB\u060C \xAB\u064A\u062C\u0628 \u0623\u0646 \u062A\u062A\u0632\u0648\u062C\xBB). OK \u0639\u0644\u0649 \u0642\u0627\u0639\u062F\u0629 \u064A\u062D\u0630\u0641\u0647\u0627.",ruleLabel:"\u0642\u0627\u0639\u062F\u0629 \u0644\u0634\u062E\u0635\u064A\u062A\u0643",rulesFull:"\u0644\u062F\u064A\u0643 5 \u0642\u0648\u0627\u0639\u062F \u0628\u0627\u0644\u0641\u0639\u0644: \u0627\u062D\u0630\u0641 \u0648\u0627\u062D\u062F\u0629 \u0623\u0648\u0644\u064B\u0627.",ruleAdded:"\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0642\u0627\u0639\u062F\u0629.",ruleRemoved:"\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0642\u0627\u0639\u062F\u0629.",meHut:"\u0628\u0646\u0627\u0621 \u0643\u0648\u062E \u0647\u0646\u0627 (12 \u062E\u0634\u0628\u060C 4 \u062D\u062C\u0627\u0631\u0629)",built:"\u062A\u0645 \u0628\u0646\u0627\u0621 \u0627\u0644\u0643\u0648\u062E.",needHut:"\u0627\u0644\u0643\u0648\u062E \u064A\u062D\u062A\u0627\u062C 12 \u062E\u0634\u0628\u064B\u0627 \u06484 \u062D\u062C\u0627\u0631\u0629.",mePartner:"\u0627\u0644\u0634\u0631\u064A\u0643",meChildren:"\u0627\u0644\u0623\u0637\u0641\u0627\u0644",meNone:"\u0644\u0627 \u0623\u062D\u062F \u0628\u0639\u062F",meExpecting:"\u0637\u0641\u0644 \u0642\u0627\u062F\u0645 \u0628\u0639\u062F {0} \u0633\u0627\u0639\u0627\u062A.",meTraits:"\u0627\u0644\u0642\u0648\u0629 {0} \xB7 \u0627\u0644\u0633\u0631\u0639\u0629 {1} \xB7 \u0627\u0644\u0639\u0642\u0644 {2} \xB7 \u0627\u0644\u0634\u062C\u0627\u0639\u0629 {3} \xB7 \u0627\u0644\u0644\u0637\u0641 {4}",meHp:"\u0627\u0644\u0635\u062D\u0629 {0}",meGoals:"\u0623\u064F\u0646\u062C\u0632 \u0645\u0624\u062E\u0631\u064B\u0627",askPartner:"\u0627\u0637\u0644\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0634\u0631\u064A\u0643\u064A",askMarry:"\u0637\u0644\u0628 \u0627\u0644\u0632\u0648\u0627\u062C",askDivorce:"\u0637\u0644\u0628 \u0627\u0644\u0637\u0644\u0627\u0642",askingMarry:"\u062A\u0637\u0644\u0628 \u0645\u0646 {0} \u0623\u0646 \u064A\u062A\u0632\u0648\u062C\u0643\u2026",askingDivorce:"\u062A\u062E\u0628\u0631 {0} \u0623\u0646\u0643 \u062A\u0631\u064A\u062F \u0627\u0644\u0637\u0644\u0627\u0642\u2026",tryChild:"\u0645\u062D\u0627\u0648\u0644\u0629 \u0625\u0646\u062C\u0627\u0628 \u0637\u0641\u0644",partners:"{0} \u0648\u0627\u0641\u0642: \u0623\u0646\u062A\u0645\u0627 \u0634\u0631\u064A\u0643\u0627\u0646 \u0627\u0644\u0622\u0646.",expecting:"\u0637\u0641\u0644 \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642!",tooFar:"\u0627\u0642\u062A\u0631\u0628 \u0623\u0648\u0644\u064B\u0627."}};var yu={en:{famTitle:"My family",famHelp:"Children under 3 cannot eat, drink or go anywhere by themselves: stand next to them (3 m) and look after them. Carry a baby to water, then Give water.",famNone:"No children yet.",famFeed:"Feed {0}",famWater:"Give {0} water",famCarry:"Pick up {0}",famDown:"Put {0} down",famBed:"Put {0} to bed",famNeeds:"Food {0} % \xB7 Water {1} % \xB7 Rest {2} %",famLooked:"looked after by {0}",famFar:"go next to them to look after them",stBaby:"baby",stToddler:"toddler",stChild:"child",stTeen:"teenager",stAdult:"grown up",famChosen:"Chosen family",famAsks:"Asks for you",famDrop:"No longer my {0}",famAskFrom:"{0} asks to be your {1}",famYes:"Accept",famNo:"Refuse",rolechild:"child",rolesibling:"brother / sister",roleparent:"parent",askChild:"Ask to be my child",askSibling:"Ask to be my brother / sister",askParent:"Ask to be my parent",kinAsked:"Asked {0}. They answer on their TV.",kinAskedYou:"{0} asks you to be family ({1}): Me > My family.",kinYes:"{0} said yes: you are family now.",kinNo:"{0} said no.",kinSet:"You are family now.",kinRefused:"Refused.",kinDropped:"Done.",kinAlready:"You are already that family.",kinOnlyPlayers:"Family roles are chosen between players only.",kidFed:"Fed.",kidWater:"They drank.",kidUp:"In your arms.",kidDown:"Put down.",kidBed:"Asleep.",kidNone:"That child is gone.",kidNotMine:"That is not your child.",kidFar:"Go next to them first (3 m)."},fr:{famTitle:"Ma famille",famHelp:"Les enfants de moins de 3 ans ne mangent, ne boivent et ne vont nulle part seuls : place-toi \xE0 c\xF4t\xE9 (3 m) et occupe-toi d'eux. Porte un b\xE9b\xE9 jusqu'\xE0 l'eau, puis Donner \xE0 boire.",famNone:"Pas encore d'enfants.",famFeed:"Nourrir {0}",famWater:"Donner \xE0 boire \xE0 {0}",famCarry:"Prendre {0}",famDown:"Poser {0}",famBed:"Coucher {0}",famNeeds:"Faim {0} % \xB7 Eau {1} % \xB7 Repos {2} %",famLooked:"gard\xE9 par {0}",famFar:"va \xE0 c\xF4t\xE9 pour t'en occuper",stBaby:"b\xE9b\xE9",stToddler:"tout-petit",stChild:"enfant",stTeen:"adolescent",stAdult:"adulte",famChosen:"Famille choisie",famAsks:"Demandes",famDrop:"Plus mon {0}",famAskFrom:"{0} demande \xE0 \xEAtre ton {1}",famYes:"Accepter",famNo:"Refuser",rolechild:"enfant",rolesibling:"fr\xE8re / s\u0153ur",roleparent:"parent",askChild:"Demander \xE0 \xEAtre mon enfant",askSibling:"Demander \xE0 \xEAtre mon fr\xE8re / ma s\u0153ur",askParent:"Demander \xE0 \xEAtre mon parent",kinAsked:"Demand\xE9 \xE0 {0}. R\xE9ponse sur sa t\xE9l\xE9.",kinAskedYou:"{0} te demande d'\xEAtre de la famille ({1}) : Moi > Ma famille.",kinYes:"{0} a dit oui : vous \xEAtes de la m\xEAme famille.",kinNo:"{0} a dit non.",kinSet:"Vous \xEAtes de la m\xEAme famille.",kinRefused:"Refus\xE9.",kinDropped:"Fait.",kinAlready:"C'est d\xE9j\xE0 le cas.",kinOnlyPlayers:"Les liens de famille se choisissent entre joueurs.",kidFed:"Nourri.",kidWater:"Il a bu.",kidUp:"Dans tes bras.",kidDown:"Pos\xE9.",kidBed:"Endormi.",kidNone:"Cet enfant n'est plus l\xE0.",kidNotMine:"Ce n'est pas ton enfant.",kidFar:"Approche-toi d'abord (3 m)."},es:{famTitle:"Mi familia",famHelp:"Los ni\xF1os menores de 3 a\xF1os no comen, beben ni van a ning\xFAn sitio solos: ponte a su lado (3 m) y cu\xEDdalos. Lleva al beb\xE9 al agua y luego Dar agua.",famNone:"A\xFAn no hay hijos.",famFeed:"Alimentar a {0}",famWater:"Dar agua a {0}",famCarry:"Coger a {0}",famDown:"Dejar a {0}",famBed:"Acostar a {0}",famNeeds:"Comida {0} % \xB7 Agua {1} % \xB7 Descanso {2} %",famLooked:"cuidado por {0}",famFar:"ve a su lado para cuidarlo",stBaby:"beb\xE9",stToddler:"ni\xF1o peque\xF1o",stChild:"ni\xF1o",stTeen:"adolescente",stAdult:"adulto",famChosen:"Familia elegida",famAsks:"Peticiones",famDrop:"Ya no es mi {0}",famAskFrom:"{0} pide ser tu {1}",famYes:"Aceptar",famNo:"Rechazar",rolechild:"hijo",rolesibling:"hermano / hermana",roleparent:"padre / madre",askChild:"Pedir que sea mi hijo",askSibling:"Pedir que sea mi hermano",askParent:"Pedir que sea mi padre / madre",kinAsked:"Preguntado a {0}. Responde en su tele.",kinAskedYou:"{0} te pide ser familia ({1}): Yo > Mi familia.",kinYes:"{0} dijo que s\xED: ya sois familia.",kinNo:"{0} dijo que no.",kinSet:"Ya sois familia.",kinRefused:"Rechazado.",kinDropped:"Hecho.",kinAlready:"Ya sois esa familia.",kinOnlyPlayers:"Los lazos de familia se eligen solo entre jugadores.",kidFed:"Alimentado.",kidWater:"Ha bebido.",kidUp:"En tus brazos.",kidDown:"En el suelo.",kidBed:"Dormido.",kidNone:"Ese ni\xF1o ya no est\xE1.",kidNotMine:"No es tu hijo.",kidFar:"Ac\xE9rcate primero (3 m)."},ar:{famTitle:"\u0639\u0627\u0626\u0644\u062A\u064A",famHelp:"\u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u062F\u0648\u0646 3 \u0633\u0646\u0648\u0627\u062A \u0644\u0627 \u064A\u0623\u0643\u0644\u0648\u0646 \u0648\u0644\u0627 \u064A\u0634\u0631\u0628\u0648\u0646 \u0648\u0644\u0627 \u064A\u0630\u0647\u0628\u0648\u0646 \u0648\u062D\u062F\u0647\u0645: \u0642\u0641 \u0628\u062C\u0627\u0646\u0628\u0647\u0645 (3 \u0645) \u0648\u0627\u0639\u062A\u0646\u0650 \u0628\u0647\u0645. \u0627\u062D\u0645\u0644 \u0627\u0644\u0631\u0636\u064A\u0639 \u0625\u0644\u0649 \u0627\u0644\u0645\u0627\u0621 \u062B\u0645 \u0627\u0633\u0642\u0647.",famNone:"\u0644\u0627 \u0623\u0637\u0641\u0627\u0644 \u0628\u0639\u062F.",famFeed:"\u0623\u0637\u0639\u0645 {0}",famWater:"\u0627\u0633\u0642\u0650 {0}",famCarry:"\u0627\u062D\u0645\u0644 {0}",famDown:"\u0636\u0639 {0} \u0623\u0631\u0636\u064B\u0627",famBed:"\u0646\u0648\u0651\u0645 {0}",famNeeds:"\u0637\u0639\u0627\u0645 {0} % \xB7 \u0645\u0627\u0621 {1} % \xB7 \u0631\u0627\u062D\u0629 {2} %",famLooked:"\u064A\u0639\u062A\u0646\u064A \u0628\u0647 {0}",famFar:"\u0627\u0642\u062A\u0631\u0628 \u0645\u0646\u0647 \u0644\u062A\u0639\u062A\u0646\u064A \u0628\u0647",stBaby:"\u0631\u0636\u064A\u0639",stToddler:"\u0637\u0641\u0644 \u0635\u063A\u064A\u0631",stChild:"\u0637\u0641\u0644",stTeen:"\u0645\u0631\u0627\u0647\u0642",stAdult:"\u0628\u0627\u0644\u063A",famChosen:"\u0639\u0627\u0626\u0644\u0629 \u0645\u062E\u062A\u0627\u0631\u0629",famAsks:"\u0637\u0644\u0628\u0627\u062A",famDrop:"\u0644\u0645 \u064A\u0639\u062F {0}",famAskFrom:"{0} \u064A\u0637\u0644\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 {1}",famYes:"\u0642\u0628\u0648\u0644",famNo:"\u0631\u0641\u0636",rolechild:"\u0627\u0628\u0646\u0643",rolesibling:"\u0623\u062E\u0627\u0643 / \u0623\u062E\u062A\u0643",roleparent:"\u0648\u0627\u0644\u062F\u0643",askChild:"\u0627\u0637\u0644\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0627\u0628\u0646\u064A",askSibling:"\u0627\u0637\u0644\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u062E\u064A / \u0623\u062E\u062A\u064A",askParent:"\u0627\u0637\u0644\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0648\u0627\u0644\u062F\u064A",kinAsked:"\u062A\u0645 \u0633\u0624\u0627\u0644 {0}. \u064A\u062C\u064A\u0628 \u0645\u0646 \u062A\u0644\u0641\u0627\u0632\u0647.",kinAskedYou:"{0} \u064A\u0637\u0644\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646\u0627 \u0639\u0627\u0626\u0644\u0629 ({1}): \u0623\u0646\u0627 > \u0639\u0627\u0626\u0644\u062A\u064A.",kinYes:"\u0648\u0627\u0641\u0642 {0}: \u0623\u0646\u062A\u0645\u0627 \u0639\u0627\u0626\u0644\u0629 \u0627\u0644\u0622\u0646.",kinNo:"\u0631\u0641\u0636 {0}.",kinSet:"\u0623\u0646\u062A\u0645\u0627 \u0639\u0627\u0626\u0644\u0629 \u0627\u0644\u0622\u0646.",kinRefused:"\u062A\u0645 \u0627\u0644\u0631\u0641\u0636.",kinDropped:"\u062A\u0645.",kinAlready:"\u0623\u0646\u062A\u0645\u0627 \u0643\u0630\u0644\u0643 \u0628\u0627\u0644\u0641\u0639\u0644.",kinOnlyPlayers:"\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u062A\u064F\u062E\u062A\u0627\u0631 \u0628\u064A\u0646 \u0627\u0644\u0644\u0627\u0639\u0628\u064A\u0646 \u0641\u0642\u0637.",kidFed:"\u062A\u0645 \u0627\u0644\u0625\u0637\u0639\u0627\u0645.",kidWater:"\u0634\u0631\u0628.",kidUp:"\u0628\u064A\u0646 \u0630\u0631\u0627\u0639\u064A\u0643.",kidDown:"\u0648\u064F\u0636\u0639 \u0623\u0631\u0636\u064B\u0627.",kidBed:"\u0646\u0627\u0645.",kidNone:"\u0647\u0630\u0627 \u0627\u0644\u0637\u0641\u0644 \u0644\u0645 \u064A\u0639\u062F \u0647\u0646\u0627.",kidNotMine:"\u0644\u064A\u0633 \u0637\u0641\u0644\u0643.",kidFar:"\u0627\u0642\u062A\u0631\u0628 \u0623\u0648\u0644\u064B\u0627 (3 \u0645)."}};var _u={en:{plTitle:"Building: {0}",plPad:"Stick: move \xB7 {0}: build here \xB7 {1}: turn \xB7 {2}: cancel",plRemote:"Arrows: move \xB7 OK: build here \xB7 {0}: turn \xB7 Back: cancel",plBad:"Not here: {0}",plOk:"Good spot",plDoor:"the door faces {0}",plSent:"Building\u2026",dirS:"south",dirE:"east",dirN:"north",dirW:"west",cTooFar:"too far from you (8 m at most)",cSomeone:"someone is standing there",cDoorBlocked:"the door would open onto a wall",cNoRoom:"the ground there is taken",cUnknown:"not seen yet",dTooFar:"That is too far: aim closer to you.",dSomeone:"Someone is standing there.",dDoorBlocked:"The door would open onto a wall: turn it.",dDoorShut:"This is not your home: its door opens only for the owner's family.",dHard:"The rock is hard: keep hitting it.",bHut2:"Hut ({0}, with its own door)",bHelp2:"Pick what to build, then aim it: a see-through model shows where it goes (green = fine, red = not there). Move it with the stick or the arrows, turn a hut's door, and confirm. Things not in your bag are made from your materials first.",meHut2:"Build a hut here ({0})",needHut2:"A hut needs {0}."},fr:{plTitle:"Construction : {0}",plPad:"Stick : d\xE9placer \xB7 {0} : construire ici \xB7 {1} : tourner \xB7 {2} : annuler",plRemote:"Fl\xE8ches : d\xE9placer \xB7 OK : construire ici \xB7 {0} : tourner \xB7 Retour : annuler",plBad:"Pas ici : {0}",plOk:"Bon endroit",plDoor:"la porte donne au {0}",plSent:"Construction\u2026",dirS:"sud",dirE:"est",dirN:"nord",dirW:"ouest",cTooFar:"trop loin de toi (8 m au plus)",cSomeone:"quelqu'un se tient l\xE0",cDoorBlocked:"la porte donnerait sur un mur",cNoRoom:"le terrain est pris",cUnknown:"pas encore vu",dTooFar:"C'est trop loin : vise plus pr\xE8s de toi.",dSomeone:"Quelqu'un se tient l\xE0.",dDoorBlocked:"La porte donnerait sur un mur : tourne-la.",dDoorShut:"Ce n'est pas ta maison : sa porte ne s'ouvre que pour la famille du propri\xE9taire.",dHard:"La roche est dure : continue de frapper.",bHut2:"Cabane ({0}, avec sa porte)",bHelp2:"Choisis quoi construire, puis vise : un mod\xE8le transparent montre o\xF9 il ira (vert = bon, rouge = impossible). D\xE9place-le avec le stick ou les fl\xE8ches, tourne la porte d'une cabane, puis confirme. Ce qui n'est pas dans ton sac est d'abord fabriqu\xE9 avec tes mat\xE9riaux.",meHut2:"Construire une cabane ici ({0})",needHut2:"Une cabane demande {0}."},es:{plTitle:"Construir: {0}",plPad:"Stick: mover \xB7 {0}: construir aqu\xED \xB7 {1}: girar \xB7 {2}: cancelar",plRemote:"Flechas: mover \xB7 OK: construir aqu\xED \xB7 {0}: girar \xB7 Atr\xE1s: cancelar",plBad:"Aqu\xED no: {0}",plOk:"Buen sitio",plDoor:"la puerta da al {0}",plSent:"Construyendo\u2026",dirS:"sur",dirE:"este",dirN:"norte",dirW:"oeste",cTooFar:"demasiado lejos (8 m como mucho)",cSomeone:"hay alguien ah\xED",cDoorBlocked:"la puerta dar\xEDa a una pared",cNoRoom:"el terreno est\xE1 ocupado",cUnknown:"a\xFAn no visto",dTooFar:"Est\xE1 demasiado lejos: apunta m\xE1s cerca.",dSomeone:"Hay alguien ah\xED.",dDoorBlocked:"La puerta dar\xEDa a una pared: g\xEDrala.",dDoorShut:"No es tu casa: su puerta solo se abre para la familia del due\xF1o.",dHard:"La roca es dura: sigue golpeando.",bHut2:"Caba\xF1a ({0}, con su puerta)",bHelp2:"Elige qu\xE9 construir y apunta: un modelo transparente muestra d\xF3nde ir\xE1 (verde = bien, rojo = no). Mu\xE9velo con el stick o las flechas, gira la puerta de una caba\xF1a y confirma. Lo que no est\xE1 en tu bolsa se hace antes con tus materiales.",meHut2:"Construir una caba\xF1a aqu\xED ({0})",needHut2:"Una caba\xF1a necesita {0}."},ar:{plTitle:"\u0628\u0646\u0627\u0621: {0}",plPad:"\u0627\u0644\u0639\u0635\u0627: \u062A\u062D\u0631\u064A\u0643 \xB7 {0}: \u0627\u0628\u0646 \u0647\u0646\u0627 \xB7 {1}: \u062A\u062F\u0648\u064A\u0631 \xB7 {2}: \u0625\u0644\u063A\u0627\u0621",plRemote:"\u0627\u0644\u0623\u0633\u0647\u0645: \u062A\u062D\u0631\u064A\u0643 \xB7 OK: \u0627\u0628\u0646 \u0647\u0646\u0627 \xB7 {0}: \u062A\u062F\u0648\u064A\u0631 \xB7 \u0631\u062C\u0648\u0639: \u0625\u0644\u063A\u0627\u0621",plBad:"\u0644\u064A\u0633 \u0647\u0646\u0627: {0}",plOk:"\u0645\u0643\u0627\u0646 \u062C\u064A\u062F",plDoor:"\u0627\u0644\u0628\u0627\u0628 \u0646\u062D\u0648 {0}",plSent:"\u062C\u0627\u0631 \u0627\u0644\u0628\u0646\u0627\u0621\u2026",dirS:"\u0627\u0644\u062C\u0646\u0648\u0628",dirE:"\u0627\u0644\u0634\u0631\u0642",dirN:"\u0627\u0644\u0634\u0645\u0627\u0644",dirW:"\u0627\u0644\u063A\u0631\u0628",cTooFar:"\u0628\u0639\u064A\u062F \u062C\u062F\u0627 \u0639\u0646\u0643 (8 \u0645 \u0639\u0644\u0649 \u0627\u0644\u0623\u0643\u062B\u0631)",cSomeone:"\u0647\u0646\u0627\u0643 \u0634\u062E\u0635 \u0648\u0627\u0642\u0641",cDoorBlocked:"\u0633\u064A\u0641\u062A\u062D \u0627\u0644\u0628\u0627\u0628 \u0639\u0644\u0649 \u062C\u062F\u0627\u0631",cNoRoom:"\u0627\u0644\u0623\u0631\u0636 \u0645\u0634\u063A\u0648\u0644\u0629",cUnknown:"\u0644\u0645 \u064A\u0638\u0647\u0631 \u0628\u0639\u062F",dTooFar:"\u0647\u0630\u0627 \u0628\u0639\u064A\u062F \u062C\u062F\u0627: \u0635\u0648\u0628 \u0623\u0642\u0631\u0628 \u0625\u0644\u064A\u0643.",dSomeone:"\u0647\u0646\u0627\u0643 \u0634\u062E\u0635 \u0648\u0627\u0642\u0641.",dDoorBlocked:"\u0633\u064A\u0641\u062A\u062D \u0627\u0644\u0628\u0627\u0628 \u0639\u0644\u0649 \u062C\u062F\u0627\u0631: \u0623\u062F\u0631\u0647.",dDoorShut:"\u0647\u0630\u0627 \u0644\u064A\u0633 \u0628\u064A\u062A\u0643: \u0628\u0627\u0628\u0647 \u0644\u0627 \u064A\u0641\u062A\u062D \u0625\u0644\u0627 \u0644\u0639\u0627\u0626\u0644\u0629 \u0635\u0627\u062D\u0628\u0647.",dHard:"\u0627\u0644\u0635\u062E\u0631\u0629 \u0635\u0644\u0628\u0629: \u0648\u0627\u0635\u0644 \u0627\u0644\u0636\u0631\u0628.",bHut2:"\u0643\u0648\u062E ({0}\u060C \u0645\u0639 \u0628\u0627\u0628\u0647)",bHelp2:"\u0627\u062E\u062A\u0631 \u0645\u0627 \u062A\u0628\u0646\u064A\u0647 \u062B\u0645 \u0635\u0648\u0628: \u0646\u0645\u0648\u0630\u062C \u0634\u0641\u0627\u0641 \u064A\u0628\u064A\u0646 \u0645\u0643\u0627\u0646\u0647 (\u0623\u062E\u0636\u0631 = \u062C\u064A\u062F\u060C \u0623\u062D\u0645\u0631 = \u0644\u0627). \u062D\u0631\u0643\u0647 \u0628\u0627\u0644\u0639\u0635\u0627 \u0623\u0648 \u0627\u0644\u0623\u0633\u0647\u0645\u060C \u0623\u062F\u0631 \u0628\u0627\u0628 \u0627\u0644\u0643\u0648\u062E\u060C \u062B\u0645 \u0623\u0643\u062F. \u0645\u0627 \u0644\u064A\u0633 \u0641\u064A \u062D\u0642\u064A\u0628\u062A\u0643 \u064A\u0635\u0646\u0639 \u0623\u0648\u0644\u0627 \u0645\u0646 \u0645\u0648\u0627\u062F\u0643.",meHut2:"\u0627\u0628\u0646 \u0643\u0648\u062E\u0627 \u0647\u0646\u0627 ({0})",needHut2:"\u0627\u0644\u0643\u0648\u062E \u064A\u062D\u062A\u0627\u062C {0}."}};var bu={en:{invTitle:"Bag & crafting",invCraft:"Crafting",invBag:"Bag",invBook:"Recipes",invNav:"\u25C0 \u25B6 \u25B2 \u25BC move \xB7 A pick \xB7 B back",invHintRes:"A: put one in the crafting grid",invHintGear:"A: use it (gear)",invHintPlace:"A: put it down in front of me",invHintGrid:"A: take it back",invHintMake:"A: make {0}",invHintNone:"Put materials in the grid, or pick a recipe",invHintBook:"A: fill the grid with it",invHintTab:"\u25C0 \u25B6 another category",invMissing:"Missing: {0}",invEmpty:"Empty",invIn:"in {0}",mGear:"Gear",gearTitle:"Gear",gSlotWeapon:"Weapon",gSlotRanged:"Bow",gSlotHead:"Head",gSlotBody:"Body",gBest:"Best",gNone:"Nothing",gLevelUp:"Level up",gQualityUp:"Raise quality",gDamage:"Damage",gDefence:"Defence",gNeedLv:"needs +{0} first",gMax:"at its best",gEmpty:"Nothing for this slot in the bag: craft one.",gNav:"\u25B2 \u25BC slot \xB7 \u25B6 choose / upgrade \xB7 A do it",gHands:"Bare hands",qual0:"Normal",qual1:"Fine",qual2:"Superior",qual3:"Epic",qual4:"Elite",dEquipped:"Equipped.",dUpgraded:"{0} is now {1}.",dUpNeed:"Not enough: {0}",dNeedLevel:"Level it up to +{0} first.",dMaxLevel:"Already at +10.",dMaxQuality:"Already elite.",dNotCarried:"Not in your bag."},fr:{invTitle:"Sac & fabrication",invCraft:"Fabrication",invBag:"Sac",invBook:"Recettes",invNav:"\u25C0 \u25B6 \u25B2 \u25BC bouger \xB7 A choisir \xB7 B retour",invHintRes:"A : en mettre un dans la grille",invHintGear:"A : l'utiliser (\xE9quipement)",invHintPlace:"A : le poser devant moi",invHintGrid:"A : le reprendre",invHintMake:"A : fabriquer {0}",invHintNone:"Mettez des mat\xE9riaux dans la grille, ou choisissez une recette",invHintBook:"A : remplir la grille",invHintTab:"\u25C0 \u25B6 autre cat\xE9gorie",invMissing:"Il manque : {0}",invEmpty:"Vide",invIn:"dans {0}",mGear:"\xC9quipement",gearTitle:"\xC9quipement",gSlotWeapon:"Arme",gSlotRanged:"Arc",gSlotHead:"T\xEAte",gSlotBody:"Corps",gBest:"Le meilleur",gNone:"Rien",gLevelUp:"Monter de niveau",gQualityUp:"Am\xE9liorer la qualit\xE9",gDamage:"D\xE9g\xE2ts",gDefence:"D\xE9fense",gNeedLv:"il faut +{0} d'abord",gMax:"au maximum",gEmpty:"Rien pour cet emplacement dans le sac : fabriquez-en un.",gNav:"\u25B2 \u25BC emplacement \xB7 \u25B6 choisir / am\xE9liorer \xB7 A valider",gHands:"Mains nues",qual0:"Normal",qual1:"Bon",qual2:"Sup\xE9rieur",qual3:"\xC9pique",qual4:"\xC9lite",dEquipped:"\xC9quip\xE9.",dUpgraded:"{0} est maintenant {1}.",dUpNeed:"Pas assez : {0}",dNeedLevel:"Montez-le d'abord \xE0 +{0}.",dMaxLevel:"D\xE9j\xE0 \xE0 +10.",dMaxQuality:"D\xE9j\xE0 \xE9lite.",dNotCarried:"Pas dans votre sac."},es:{invTitle:"Bolsa y fabricaci\xF3n",invCraft:"Fabricaci\xF3n",invBag:"Bolsa",invBook:"Recetas",invNav:"\u25C0 \u25B6 \u25B2 \u25BC mover \xB7 A elegir \xB7 B volver",invHintRes:"A: poner uno en la cuadr\xEDcula",invHintGear:"A: usarlo (equipo)",invHintPlace:"A: colocarlo delante de m\xED",invHintGrid:"A: recuperarlo",invHintMake:"A: fabricar {0}",invHintNone:"Pon materiales en la cuadr\xEDcula o elige una receta",invHintBook:"A: llenar la cuadr\xEDcula",invHintTab:"\u25C0 \u25B6 otra categor\xEDa",invMissing:"Falta: {0}",invEmpty:"Vac\xEDo",invIn:"en {0}",mGear:"Equipo",gearTitle:"Equipo",gSlotWeapon:"Arma",gSlotRanged:"Arco",gSlotHead:"Cabeza",gSlotBody:"Cuerpo",gBest:"El mejor",gNone:"Nada",gLevelUp:"Subir de nivel",gQualityUp:"Mejorar la calidad",gDamage:"Da\xF1o",gDefence:"Defensa",gNeedLv:"antes necesita +{0}",gMax:"al m\xE1ximo",gEmpty:"Nada para este hueco en la bolsa: fabrica uno.",gNav:"\u25B2 \u25BC hueco \xB7 \u25B6 elegir / mejorar \xB7 A hacerlo",gHands:"Manos desnudas",qual0:"Normal",qual1:"Bueno",qual2:"Superior",qual3:"\xC9pico",qual4:"\xC9lite",dEquipped:"Equipado.",dUpgraded:"{0} ahora es {1}.",dUpNeed:"No basta: {0}",dNeedLevel:"Primero s\xFAbelo a +{0}.",dMaxLevel:"Ya est\xE1 a +10.",dMaxQuality:"Ya es \xE9lite.",dNotCarried:"No est\xE1 en tu bolsa."},ar:{invTitle:"\u0627\u0644\u062D\u0642\u064A\u0628\u0629 \u0648\u0627\u0644\u0635\u0646\u0627\u0639\u0629",invCraft:"\u0627\u0644\u0635\u0646\u0627\u0639\u0629",invBag:"\u0627\u0644\u062D\u0642\u064A\u0628\u0629",invBook:"\u0627\u0644\u0648\u0635\u0641\u0627\u062A",invNav:"\u25C0 \u25B6 \u25B2 \u25BC \u062A\u062D\u0631\u064A\u0643 \xB7 A \u0627\u062E\u062A\u064A\u0627\u0631 \xB7 B \u0631\u062C\u0648\u0639",invHintRes:"A: \u0636\u0639 \u0648\u0627\u062D\u062F\u0629 \u0641\u064A \u0634\u0628\u0643\u0629 \u0627\u0644\u0635\u0646\u0627\u0639\u0629",invHintGear:"A: \u0627\u0633\u062A\u062E\u062F\u0645\u0647 (\u0639\u062A\u0627\u062F)",invHintPlace:"A: \u0636\u0639\u0647 \u0623\u0645\u0627\u0645\u064A",invHintGrid:"A: \u0627\u0633\u062A\u0631\u062C\u0639\u0647",invHintMake:"A: \u0627\u0635\u0646\u0639 {0}",invHintNone:"\u0636\u0639 \u0627\u0644\u0645\u0648\u0627\u062F \u0641\u064A \u0627\u0644\u0634\u0628\u0643\u0629 \u0623\u0648 \u0627\u062E\u062A\u0631 \u0648\u0635\u0641\u0629",invHintBook:"A: \u0627\u0645\u0644\u0623 \u0627\u0644\u0634\u0628\u0643\u0629 \u0628\u0647\u0627",invHintTab:"\u25C0 \u25B6 \u0641\u0626\u0629 \u0623\u062E\u0631\u0649",invMissing:"\u064A\u0646\u0642\u0635: {0}",invEmpty:"\u0641\u0627\u0631\u063A",invIn:"\u0641\u064A {0}",mGear:"\u0627\u0644\u0639\u062A\u0627\u062F",gearTitle:"\u0627\u0644\u0639\u062A\u0627\u062F",gSlotWeapon:"\u0627\u0644\u0633\u0644\u0627\u062D",gSlotRanged:"\u0627\u0644\u0642\u0648\u0633",gSlotHead:"\u0627\u0644\u0631\u0623\u0633",gSlotBody:"\u0627\u0644\u062C\u0633\u0645",gBest:"\u0627\u0644\u0623\u0641\u0636\u0644",gNone:"\u0644\u0627 \u0634\u064A\u0621",gLevelUp:"\u0631\u0641\u0639 \u0627\u0644\u0645\u0633\u062A\u0648\u0649",gQualityUp:"\u0631\u0641\u0639 \u0627\u0644\u062C\u0648\u062F\u0629",gDamage:"\u0627\u0644\u0636\u0631\u0631",gDefence:"\u0627\u0644\u062F\u0641\u0627\u0639",gNeedLv:"\u064A\u062D\u062A\u0627\u062C +{0} \u0623\u0648\u0644\u0627\u064B",gMax:"\u0641\u064A \u0623\u0642\u0635\u0649 \u062D\u062F",gEmpty:"\u0644\u0627 \u0634\u064A\u0621 \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u0627\u0646\u0629 \u0641\u064A \u0627\u0644\u062D\u0642\u064A\u0628\u0629: \u0627\u0635\u0646\u0639 \u0648\u0627\u062D\u062F\u0627\u064B.",gNav:"\u25B2 \u25BC \u0627\u0644\u062E\u0627\u0646\u0629 \xB7 \u25B6 \u0627\u062E\u062A\u064A\u0627\u0631 / \u062A\u0637\u0648\u064A\u0631 \xB7 A \u062A\u0646\u0641\u064A\u0630",gHands:"\u064A\u062F\u0627\u0646 \u0641\u0627\u0631\u063A\u062A\u0627\u0646",qual0:"\u0639\u0627\u062F\u064A",qual1:"\u062C\u064A\u062F",qual2:"\u0645\u0645\u062A\u0627\u0632",qual3:"\u0645\u0644\u062D\u0645\u064A",qual4:"\u0646\u062E\u0628\u0629",dEquipped:"\u062A\u0645 \u0627\u0644\u062A\u062C\u0647\u064A\u0632.",dUpgraded:"{0} \u0623\u0635\u0628\u062D {1}.",dUpNeed:"\u063A\u064A\u0631 \u0643\u0627\u0641\u064D: {0}",dNeedLevel:"\u0627\u0631\u0641\u0639 \u0645\u0633\u062A\u0648\u0627\u0647 \u0625\u0644\u0649 +{0} \u0623\u0648\u0644\u0627\u064B.",dMaxLevel:"\u0628\u0627\u0644\u0641\u0639\u0644 \u0641\u064A +10.",dMaxQuality:"\u0628\u0627\u0644\u0641\u0639\u0644 \u0646\u062E\u0628\u0629.",dNotCarried:"\u0644\u064A\u0633 \u0641\u064A \u062D\u0642\u064A\u0628\u062A\u0643."}};var Mu={en:{connecting:"Connecting to the world\u2026",offline:"The world server is not answering. Trying again\u2026",noServer:"No server address yet.",enterServer:"Press A to type the server address",serverLabel:"World server address",pairTitle:"Pair this TV",pairHow:"On your phone, open the control panel and approve this code:",pairWait:"Waiting for approval\u2026",pairExpired:"The code expired. Press A for a new one.",pairDenied:"The pairing was refused. Press A to try again.",hints:"Move: arrows \xB7 A: follow a person \xB7 X: next map \xB7 L / R: zoom \xB7 +: menu",hintsRemote:"Move: arrows \xB7 OK: follow a person \xB7 CH + / \u2212: zoom \xB7 Back twice: menu",following:"Following",free:"Free camera",day:"Day",agents:"people",menuMap:"Next map",menuZoomIn:"Zoom in",menuZoomOut:"Zoom out",menuServer:"Change server address",menuUnpair:"Unpair this TV",hintsPlay:"Move: stick \xB7 B: run \xB7 A: talk \xB7 L / R: zoom \xB7 +: menu",hintsPlayRemote:"Move: arrows \xB7 OK: talk \xB7 CH + / \u2212: zoom \xB7 Back: menu",menuPlay:"Play",menuWatch:"Watch the world",travelling:"Travelling to {0}\u2026",nobody:"Nobody close by.",metPlayer:"Another player is here.",worldFull:"The world is full right now.",noGl:"This screen can\u2019t draw 3D.",actIdle:"Standing",actWander:"Walking around",actDrink:"Getting water",actEat:"Eating",actForage:"Looking for food",actSleep:"Sleeping",actTalk:"Talking",actTravel:"Travelling",actRest:"Resting",actFlee:"Running away",actGo:"Going to someone",actGather:"Gathering",actBuild:"Building",inTransit:"travelling"},fr:{connecting:"Connexion au monde\u2026",offline:"Le serveur du monde ne r\xE9pond pas. Nouvel essai\u2026",noServer:"Pas encore d\u2019adresse de serveur.",enterServer:"Appuyez sur A pour taper l\u2019adresse du serveur",serverLabel:"Adresse du serveur du monde",pairTitle:"Associer cette TV",pairHow:"Sur votre t\xE9l\xE9phone, ouvrez le panneau de contr\xF4le et acceptez ce code :",pairWait:"En attente d\u2019approbation\u2026",pairExpired:"Le code a expir\xE9. Appuyez sur A pour un nouveau.",pairDenied:"L\u2019association a \xE9t\xE9 refus\xE9e. Appuyez sur A pour r\xE9essayer.",hints:"Bouger : fl\xE8ches \xB7 A : suivre une personne \xB7 X : carte suivante \xB7 L / R : zoom \xB7 + : menu",hintsRemote:"Bouger : fl\xE8ches \xB7 OK : suivre une personne \xB7 CH + / \u2212 : zoom \xB7 Retour deux fois : menu",following:"Suivi de",free:"Cam\xE9ra libre",day:"Jour",agents:"personnes",menuMap:"Carte suivante",menuZoomIn:"Zoom avant",menuZoomOut:"Zoom arri\xE8re",menuServer:"Changer l\u2019adresse du serveur",menuUnpair:"Dissocier cette TV",hintsPlay:"Bouger : stick \xB7 B : courir \xB7 A : parler \xB7 L / R : zoom \xB7 + : menu",hintsPlayRemote:"Bouger : fl\xE8ches \xB7 OK : parler \xB7 CH + / \u2212 : zoom \xB7 Retour : menu",menuPlay:"Jouer",menuWatch:"Regarder le monde",travelling:"En route vers {0}\u2026",nobody:"Personne \xE0 c\xF4t\xE9.",metPlayer:"Un autre joueur est l\xE0.",worldFull:"Le monde est plein pour le moment.",noGl:"Cet \xE9cran ne peut pas afficher la 3D.",actIdle:"Debout",actWander:"Se prom\xE8ne",actDrink:"Va boire",actEat:"Mange",actForage:"Cherche \xE0 manger",actSleep:"Dort",actTalk:"Discute",actTravel:"En voyage",actRest:"Se repose",actFlee:"S\u2019enfuit",actGo:"Va rejoindre quelqu\u2019un",actGather:"R\xE9colte",actBuild:"Construit",inTransit:"en voyage"},es:{connecting:"Conectando con el mundo\u2026",offline:"El servidor del mundo no responde. Reintentando\u2026",noServer:"Todav\xEDa no hay direcci\xF3n del servidor.",enterServer:"Pulsa A para escribir la direcci\xF3n del servidor",serverLabel:"Direcci\xF3n del servidor del mundo",pairTitle:"Vincular este televisor",pairHow:"En tu tel\xE9fono, abre el panel de control y aprueba este c\xF3digo:",pairWait:"Esperando aprobaci\xF3n\u2026",pairExpired:"El c\xF3digo caduc\xF3. Pulsa A para uno nuevo.",pairDenied:"Se rechaz\xF3 la vinculaci\xF3n. Pulsa A para reintentar.",hints:"Mover: flechas \xB7 A: seguir a alguien \xB7 X: mapa siguiente \xB7 L / R: zoom \xB7 +: men\xFA",hintsRemote:"Mover: flechas \xB7 OK: seguir a alguien \xB7 CH + / \u2212: zoom \xB7 Atr\xE1s dos veces: men\xFA",following:"Siguiendo a",free:"C\xE1mara libre",day:"D\xEDa",agents:"personas",menuMap:"Mapa siguiente",menuZoomIn:"Acercar",menuZoomOut:"Alejar",menuServer:"Cambiar la direcci\xF3n del servidor",menuUnpair:"Desvincular este televisor",hintsPlay:"Mover: stick \xB7 B: correr \xB7 A: hablar \xB7 L / R: zoom \xB7 +: men\xFA",hintsPlayRemote:"Mover: flechas \xB7 OK: hablar \xB7 CH + / \u2212: zoom \xB7 Atr\xE1s: men\xFA",menuPlay:"Jugar",menuWatch:"Mirar el mundo",travelling:"Viajando a {0}\u2026",nobody:"No hay nadie cerca.",metPlayer:"Hay otro jugador aqu\xED.",worldFull:"El mundo est\xE1 lleno ahora mismo.",noGl:"Esta pantalla no puede mostrar 3D.",actIdle:"De pie",actWander:"Paseando",actDrink:"Va a beber",actEat:"Comiendo",actForage:"Busca comida",actSleep:"Durmiendo",actTalk:"Hablando",actTravel:"De viaje",actRest:"Descansando",actFlee:"Huyendo",actGo:"Va hacia alguien",actGather:"Recogiendo",actBuild:"Construyendo",inTransit:"de viaje"},ar:{connecting:"\u062C\u0627\u0631\u064D \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0639\u0627\u0644\u0645\u2026",offline:"\u062E\u0627\u062F\u0645 \u0627\u0644\u0639\u0627\u0644\u0645 \u0644\u0627 \u064A\u0633\u062A\u062C\u064A\u0628. \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629\u2026",noServer:"\u0644\u0627 \u064A\u0648\u062C\u062F \u0639\u0646\u0648\u0627\u0646 \u062E\u0627\u062F\u0645 \u0628\u0639\u062F.",enterServer:"\u0627\u0636\u063A\u0637 A \u0644\u0643\u062A\u0627\u0628\u0629 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",serverLabel:"\u0639\u0646\u0648\u0627\u0646 \u062E\u0627\u062F\u0645 \u0627\u0644\u0639\u0627\u0644\u0645",pairTitle:"\u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",pairHow:"\u0639\u0644\u0649 \u0647\u0627\u062A\u0641\u0643\u060C \u0627\u0641\u062A\u062D \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0648\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0631\u0645\u0632:",pairWait:"\u0641\u064A \u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629\u2026",pairExpired:"\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0631\u0645\u0632. \u0627\u0636\u063A\u0637 A \u0644\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0631\u0645\u0632 \u062C\u062F\u064A\u062F.",pairDenied:"\u062A\u0645 \u0631\u0641\u0636 \u0627\u0644\u0631\u0628\u0637. \u0627\u0636\u063A\u0637 A \u0644\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.",hints:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 A: \u062A\u062A\u0628\u0639 \u0634\u062E\u0635 \xB7 X: \u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629 \xB7 L / R: \u062A\u0643\u0628\u064A\u0631 \xB7 +: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",hintsRemote:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 OK: \u062A\u062A\u0628\u0639 \u0634\u062E\u0635 \xB7 CH + / \u2212: \u062A\u0643\u0628\u064A\u0631 \xB7 \u0631\u062C\u0648\u0639 \u0645\u0631\u062A\u064A\u0646: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",following:"\u062A\u062A\u0628\u0639",free:"\u0643\u0627\u0645\u064A\u0631\u0627 \u062D\u0631\u0629",day:"\u0627\u0644\u064A\u0648\u0645",agents:"\u0623\u0634\u062E\u0627\u0635",menuMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",menuZoomIn:"\u062A\u0643\u0628\u064A\u0631",menuZoomOut:"\u062A\u0635\u063A\u064A\u0631",menuServer:"\u062A\u063A\u064A\u064A\u0631 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",menuUnpair:"\u0625\u0644\u063A\u0627\u0621 \u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",hintsPlay:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0639\u0635\u0627 \xB7 B: \u0627\u0644\u062C\u0631\u064A \xB7 A: \u0627\u0644\u062A\u062D\u062F\u062B \xB7 L / R: \u062A\u0643\u0628\u064A\u0631 \xB7 +: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",hintsPlayRemote:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 OK: \u0627\u0644\u062A\u062D\u062F\u062B \xB7 CH + / \u2212: \u062A\u0643\u0628\u064A\u0631 \xB7 \u0631\u062C\u0648\u0639: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",menuPlay:"\u0627\u0644\u0639\u0628",menuWatch:"\u0634\u0627\u0647\u062F \u0627\u0644\u0639\u0627\u0644\u0645",travelling:"\u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642 \u0625\u0644\u0649 {0}\u2026",nobody:"\u0644\u0627 \u0623\u062D\u062F \u0628\u0627\u0644\u0642\u0631\u0628.",metPlayer:"\u0644\u0627\u0639\u0628 \u0622\u062E\u0631 \u0647\u0646\u0627.",worldFull:"\u0627\u0644\u0639\u0627\u0644\u0645 \u0645\u0645\u062A\u0644\u0626 \u0627\u0644\u0622\u0646.",noGl:"\u0647\u0630\u0647 \u0627\u0644\u0634\u0627\u0634\u0629 \u0644\u0627 \u062A\u0633\u062A\u0637\u064A\u0639 \u0639\u0631\u0636 \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F.",actIdle:"\u0648\u0627\u0642\u0641",actWander:"\u064A\u062A\u062C\u0648\u0644",actDrink:"\u064A\u0630\u0647\u0628 \u0644\u064A\u0634\u0631\u0628",actEat:"\u064A\u0623\u0643\u0644",actForage:"\u064A\u0628\u062D\u062B \u0639\u0646 \u0637\u0639\u0627\u0645",actSleep:"\u0646\u0627\u0626\u0645",actTalk:"\u064A\u062A\u062D\u062F\u062B",actTravel:"\u0645\u0633\u0627\u0641\u0631",actRest:"\u064A\u0633\u062A\u0631\u064A\u062D",actFlee:"\u064A\u0647\u0631\u0628",actGo:"\u064A\u0630\u0647\u0628 \u0625\u0644\u0649 \u0634\u062E\u0635",actGather:"\u064A\u062C\u0645\u0639",actBuild:"\u064A\u0628\u0646\u064A",inTransit:"\u0641\u064A \u0633\u0641\u0631"}},Fi="en";function sp(i){Fi=i in Mu?i:"en"}function A(i){let e=Mu[Fi],t=mu[Fi],n=gu[Fi],s=xu[Fi],r=vu[Fi],a=yu[Fi],o=_u[Fi],l=bu[Fi];return e[i]??t[i]??n[i]??s[i]??r[i]??a[i]??o[i]??l[i]??Mu.en[i]??mu.en[i]??gu.en[i]??xu.en[i]??vu.en[i]??yu.en[i]??_u.en[i]??bu.en[i]??i}function se(i,...e){return A(i).replace(/\{(\d)\}/g,(t,n)=>e[Number(n)]??"")}var op=new Map,rl=null,rp=null,wu=!1;function ap(i){let e=atob(i),t=new Uint8Array(e.length);for(let n=0;n<e.length;n++)t[n]=e.charCodeAt(n);return t}function sb(i){let e=new Int16Array(ap(i.p).buffer),t=ap(i.c),n=new Float32Array(e.length),s=new Float32Array(t.length);for(let a=0;a<e.length;a++)n[a]=e[a]*i.s;for(let a=0;a<t.length;a++){let o=t[a]/255;s[a]=o<=.04045?o/12.92:Math.pow((o+.055)/1.055,2.4)}let r=new en;return r.setAttribute("position",new it(n,3)),r.setAttribute("color",new it(s,3)),r.computeVertexNormals(),r}function lp(){return rp??=(async()=>{try{let[i,e]=await Promise.all([fetch("models/items.json").then(t=>t.json()),fetch("icons/items.json").then(t=>t.json())]);for(let[t,n]of Object.entries(i))op.set(t,sb(n));rl=e,wu=!0}catch{}})(),rp}var cp=i=>op.get(i);function al(i,e){let t=rl,n=t?t.ids.indexOf(i):-1;if(!t||n<0)return"";let s=Math.ceil(t.ids.length/t.cols),r=n%t.cols*e,a=Math.floor(n/t.cols)*e;return`background-image:url(icons/items.png);background-size:${t.cols*e}px ${s*e}px;background-position:-${r}px -${a}px`}var Su=i=>!!rl&&rl.ids.includes(i);var rb=1.25,Sa=[new le(1,1,1),new le(.95,1.08,.95),new le(.88,.97,1.18),new le(1.06,.86,1.22),new le(1.35,1.08,.55)],ab=[new le(0),new le(0),new le(2780159),new le(10173695),new le(16753434)],ob=new le(8357779),lb=new le(9132597),cb=["","sword","axe","spear","bow"],hp=["sword","axe","spear","bow","hammer","sledge","helmet","pads"],hb={sword:1,axe:.75,spear:1.75,bow:.55,hammer:.55,sledge:.85},Bi=i=>i*i*(3-2*i),Dr=class{constructor(e,t,n){this.scene=e;this.shadows=n;this.cap=t,this.gcap=Math.min(t,160);let s=()=>new hn({color:16777215}),r=(a,o,l,h)=>{let c=new Kn(a,o,l);return c.instanceMatrix.setUsage(ki),c.count=0,c.frustumCulled=!1,c.castShadow=h&&n,e.add(c),c};this.body=r(new tn(.17,.24,.6,10).translate(0,.8,0),s(),t,!0),this.head=r(new Jn(.17,14,10).translate(0,1.3,0),s(),t,!0),this.hair=r(new Jn(.182,14,6,0,Math.PI*2,0,Math.PI*.55).translate(0,1.33,-.015),s(),t,!0),this.legs=r(new tn(.075,.065,.5,6).translate(0,-.25,0),s(),t*2,!0),this.arms=r(new tn(.06,.05,.44,6).translate(0,-.22,0),s(),t*2,!0),this.blob=n?null:r(new ui(.38,16).rotateX(-Math.PI/2),new Jt({color:0,transparent:!0,opacity:.28,depthWrite:!1}),t,!1),this.mark=r(new Ko(.12,0).scale(1,1.6,1),new Jt({color:16777215}),64,!1),this.glow=r(new Zn(1,1),new Jt({color:16777215,transparent:!0,opacity:.32,blending:Ps,depthWrite:!1}),this.gcap,!1);for(let a of[this.body,this.head,this.hair,this.legs,this.arms,this.mark,this.glow])a.setColorAt(0,new le)}scene;shadows;body;head;hair;legs;arms;blob;mark;glow;gear={};gn={sword:0,axe:0,spear:0,bow:0,hammer:0,sledge:0,helmet:0,pads:0};nGlow=0;n=0;nm=0;base=new Ve;m=new Ve;part=new Ve;hand=new Ve;lhand=new Ve;hm=new Ve;q=new an;e=new Vt;v=new D;s=new D;cap;gcap;tmpC=new le;model(e){let t=this.gear[e];if(t)return t;if(!wu)return null;let n=cp(e);if(!n)return null;let s=new Kn(n,new hn({vertexColors:!0}),this.gcap);return s.instanceMatrix.setUsage(ki),s.count=0,s.frustumCulled=!1,s.castShadow=this.shadows,s.setColorAt(0,new le),this.scene.add(s),this.gear[e]=s}begin(){this.n=0,this.nm=0,this.nGlow=0;for(let e of hp)this.gn[e]=0}add(e,t,n,s,r,a,o,l=1,h=!1,c=0,u=0){if(this.n>=this.cap)return;let d=this.n++,m=o?0:c>>15&7,g=0,x=.12,p=0,f=.12,w=0,S=0,v=0,I=!1;if(m===1){let N=u%.55/.55;g=N<.45?-.3-2.4*Bi(N/.45):-2.7+2.2*Bi((N-.45)/.55),p=-.6,w=N<.45?.3*Bi(N/.45):.3-.65*Bi((N-.45)/.55),S=N<.45?0:.12,I=!0}else if(m===2){let N=u%.85/.85;g=p=-1.25,x=.35,f=-.25,w=N<.55?.75*Bi(N/.55):.75-1.15*Bi((N-.55)/.45),S=.08,I=!0}else if(m===3){let N=u%.9/.9;g=p=N<.5?-.5-2.4*Bi(N/.5):-2.9+2.25*Bi((N-.5)/.5),x=.25,f=-.25,S=N<.5?-.05:.22,I=!0}else if(m===4){let N=u%.42/.42;g=-.8-.75*Math.sin(N*Math.PI),p=-1,f=-.15,S=.25,I=!0}else if(m===5)g=-.45-.35*(.5+.5*Math.sin(u*5.2)),x=.35,p=-.2-.25*(.5+.5*Math.sin(u*3.7+1)),f=.25,v=.12*Math.sin(u*7.5),I=!0;else if(m===6){let N=Math.min(1,u/.9);p=-1.55,f=-.05,g=-1.5,x=N<.7?-.15-.35*Bi(N/.7):-.1,w=.25,I=!0}else if(m===7){let N=Math.min(1,u/.6);g=-.9*Math.sin(N*Math.PI),S=.3*Math.sin(N*Math.PI),I=!0}let R=Math.abs(Math.sin(s))*.05*r*l,T=rb*l;this.base.compose(this.v.set(e,R,t),this.q.setFromEuler(this.e.set(0,n+w,0)),this.s.set(T,T,T)),o&&(this.part.compose(this.v.set(0,.2,-.55),this.q.setFromEuler(this.e.set(Math.PI/2,0,0)),this.s.set(1,1,1)),this.base.multiply(this.part)),this.hm.copy(this.base),S&&(this.part.compose(this.v.set(0,.5,0),this.q.setFromEuler(this.e.set(S,0,0)),this.s.set(1,1,1)),this.m.makeTranslation(0,-.5,0),this.part.multiply(this.m),this.hm.multiply(this.part));let C=c>>10&3,y=c>>12&7,_=C===2?this.tmpC.copy(ob).lerp(a.tunic,.25):C===1?this.tmpC.copy(lb).lerp(a.tunic,.35):a.tunic;this.body.setMatrixAt(d,this.hm),this.body.setColorAt(d,_),v?(this.part.compose(this.v.set(0,1.15,0),this.q.setFromEuler(this.e.set(v,0,0)),this.s.set(1,1,1)),this.m.makeTranslation(0,-1.15,0),this.part.multiply(this.m),this.m.multiplyMatrices(this.hm,this.part)):this.m.copy(this.hm),this.head.setMatrixAt(d,this.m),this.head.setColorAt(d,a.skin),this.hair.setMatrixAt(d,this.m),this.hair.setColorAt(d,a.hair),c>>6&1&&this.wear("helmet",this.m,0,1.36,0,1.02,c>>7&7),C===2&&this.wear("pads",this.hm,0,1.1,0,1,y);let L=Math.sin(s)*.7*r;for(let N=0;N<2;N++){let P=N?1:-1;this.part.compose(this.v.set(P*.1,.52,0),this.q.setFromEuler(this.e.set(L*P,0,0)),this.s.set(1,1,1)),this.m.multiplyMatrices(this.base,this.part),this.legs.setMatrixAt(d*2+N,this.m),this.legs.setColorAt(d*2+N,a.pants);let F=h?this.e.set(-1.35+L*P*.15,0,P*.05):I?N?this.e.set(p,0,-f*P):this.e.set(g,0,-x*P):this.e.set(-L*P*.8,0,P*.12);this.part.compose(this.v.set(P*.25,1.07,0),this.q.setFromEuler(F),this.s.set(1,1,1)),this.m.multiplyMatrices(this.hm,this.part),this.arms.setMatrixAt(d*2+N,this.m),this.arms.setColorAt(d*2+N,_),(N===0?this.hand:this.lhand).copy(this.m)}if(!o&&!h){let N=cb[c&7]??"",P=c>>3&7,F=m===2?"axe":m===3?"sledge":m===4?"hammer":m===6?"bow":N;if(F==="bow"?this.holdIn("bow",this.lhand,N==="bow"?P:0):F&&this.holdIn(F,this.hand,F===N?P:0),c>>22&1&&F!=="bow"){let H=this.model("bow");if(H&&this.gn.bow<this.gcap){this.part.compose(this.v.set(.02,.92,-.24),this.q.setFromEuler(this.e.set(0,Math.PI/2,.55)),this.s.set(.85,.85,.85)),this.m.multiplyMatrices(this.hm,this.part);let O=this.gn.bow++;H.setMatrixAt(O,this.m),H.setColorAt(O,Sa[0])}}}this.blob&&(this.m.makeTranslation(e,.03,t),this.blob.setMatrixAt(d,this.m))}holdIn(e,t,n){let s=this.model(e);if(!s||this.gn[e]>=this.gcap)return;this.part.compose(this.v.set(0,-.4,.02),this.q.setFromEuler(this.e.set(Math.PI/2,0,0)),this.s.set(.8,.8,.8)),e==="spear"&&this.part.multiply(this.m.makeTranslation(0,-.55,0)),this.m.multiplyMatrices(t,this.part);let r=this.gn[e]++;if(s.setMatrixAt(r,this.m),s.setColorAt(r,Sa[n]??Sa[0]),n>=2&&this.nGlow<this.gcap){let a=hb[e]??.6,o=1+.08*Math.sin(performance.now()/180);this.part.compose(this.v.set(0,e==="bow"?0:a*.62,0),this.q.identity(),this.s.set(.1*o,a*.45*o,.1*o)),this.m.multiply(this.part);let l=this.nGlow++;this.glow.setMatrixAt(l,this.m),this.glow.setColorAt(l,ab[n])}}wear(e,t,n,s,r,a,o){let l=this.model(e);if(!l||this.gn[e]>=this.gcap)return;this.part.compose(this.v.set(n,s,r),this.q.identity(),this.s.set(a,a,a)),this.m.multiplyMatrices(t,this.part);let h=this.gn[e]++;l.setMatrixAt(h,this.m),l.setColorAt(h,Sa[o]??Sa[0])}marker(e,t,n,s){if(this.nm>=64)return;let r=this.nm++;this.m.compose(this.v.set(e,2.15+Math.sin(n*3)*.08,t),this.q.setFromEuler(this.e.set(0,n*2,0)),this.s.set(1,1,1)),this.mark.setMatrixAt(r,this.m),this.mark.setColorAt(r,s)}end(){let e=this.n;for(let t of[this.body,this.head,this.hair])t.count=e,Aa(t);for(let t of[this.legs,this.arms])t.count=e*2,Aa(t);this.blob&&(this.blob.count=e,this.blob.instanceMatrix.needsUpdate=!0),this.mark.count=this.nm,Aa(this.mark),this.glow.count=this.nGlow,Aa(this.glow);for(let t of hp){let n=this.gear[t];n&&(n.count=this.gn[t],Aa(n))}}};function Aa(i){i.instanceMatrix.needsUpdate=!0,i.instanceColor&&(i.instanceColor.needsUpdate=!0)}var Au=[{len:.32,h:.2,wide:.2,head:.12,leg:.08,ear:.16,earUp:1,tail:.06,body:11772042,headC:12101264,earC:13219488},{len:.9,h:.42,wide:.32,head:.17,leg:.62,ear:.3,earUp:.5,tail:.07,body:10514495,headC:10119738,earC:7031338},{len:.78,h:.42,wide:.4,head:.2,leg:.3,ear:.1,earUp:.6,tail:.04,body:5193008,headC:4667179,earC:15129798},{len:.75,h:.32,wide:.26,head:.16,leg:.42,ear:.13,earUp:1,tail:.12,body:8224128,headC:9079438,earC:5921374},{len:1.25,h:.62,wide:.66,head:.3,leg:.48,ear:.1,earUp:1,tail:.06,body:4862756,headC:5388841,earC:3811356}],ol=class{constructor(e,t,n){this.cap=t;let s=(r,a)=>{let o=new Kn(r,new hn({color:16777215,flatShading:!0}),a);return o.instanceMatrix.setUsage(ki),o.count=0,o.frustumCulled=!1,o.castShadow=n,o.setColorAt(0,new le),e.add(o),o};this.body=s(new Jn(.5,10,7),t),this.head=s(new Jn(.5,9,6),t),this.legs=s(new tn(.5,.4,1,5).translate(0,-.5,0),t*4),this.ears=s(new di(.5,1,4).translate(0,.5,0),t*2),this.tail=s(new Jn(.5,6,4),t),this.cols=Au.map(r=>({body:new le(r.body),head:new le(r.headC),ear:new le(r.earC)}))}cap;body;head;legs;ears;tail;n=0;base=new Ve;m=new Ve;part=new Ve;q=new an;e=new Vt;v=new D;s=new D;cols;begin(){this.n=0}add(e,t,n,s,r,a){if(this.n>=this.cap)return;let o=Au[e]??Au[0],l=this.cols[e]??this.cols[0],h=this.n++,c=e===0?Math.abs(Math.sin(r))*.12*a:Math.abs(Math.sin(r*2))*.03*a,u=o.leg+o.h/2+c;this.base.compose(this.v.set(t,0,n),this.q.setFromEuler(this.e.set(0,s,0)),this.s.set(1.35,1.35,1.35));let d=(p,f,w,S,v,I,R,T,C,y,_,L)=>{this.part.compose(this.v.set(w,S,v),this.q.setFromEuler(this.e.set(I,R,T)),this.s.set(C,y,_)),this.m.multiplyMatrices(this.base,this.part),p.setMatrixAt(f,this.m),p.setColorAt(f,L)};d(this.body,h,0,u,0,0,0,0,o.wide,o.h,o.len,l.body);let m=o.len/2+o.head*.55,g=u+o.h*.35;d(this.head,h,0,g,m,0,0,0,o.head*1.6,o.head*1.5,o.head*(e===2?2.4:2),l.head),d(this.tail,h,0,u+o.h*.2,-o.len/2,.6,0,0,o.tail*1.2,o.tail,o.tail*(e===3?4:1.4),l.ear);let x=Math.sin(r)*.35*a;for(let p=0;p<4;p++){let f=p&1?1:-1,w=p<2?1:-1;d(this.legs,h*4+p,f*o.wide*.3,o.leg+.02,w*o.len*.3,x*f*w,0,0,o.wide*.22+.02,o.leg+.02,o.wide*.22+.02,l.body)}for(let p=0;p<2;p++){let f=p?1:-1;e===2?d(this.ears,h*2+p,f*o.head*.5,g-o.head*.3,m+o.head*.9,1.3,0,-f*.3,.04,o.ear,.04,l.ear):d(this.ears,h*2+p,f*o.head*.45,g+o.head*.55,m-o.head*.1,-.2*o.earUp,0,f*(e===1?.6:.25),o.ear*(e===1?.18:.45),o.ear,o.ear*.25,l.ear)}}end(){let e=this.n;for(let[t,n]of[[this.body,1],[this.head,1],[this.tail,1],[this.legs,4],[this.ears,2]])t.count=e*n,t.instanceMatrix.needsUpdate=!0,t.instanceColor&&(t.instanceColor.needsUpdate=!0)}};var up=58*Math.PI/180,ll=class{renderer;scene=new Cr;camera=new Zt(30,16/9,1,400);people;hemi=new Pr(13624319,6114362,1.1);sun=new Us(16773590,2.4);lamp=new Qo(16761466,0,14,1.6);fog;bg=new le(10274792);chunks=new Yn;water;under;portals=new Yn;shots;nShots=0;cans;bushes;berries;crates;nCan=0;nBush=0;nCrate=0;q=new an;eu=new Vt;v3=new D;s3=new D;groundMat=new hn({vertexColors:!0});propMat=new hn({vertexColors:!0});glowMat=new Jt({vertexColors:!0});poolMat=new Jt({vertexColors:!0,transparent:!0,opacity:0,blending:Ps,depthWrite:!1,side:Dn});animals;target=new D;look=new D;dist=24;view="top";yaw=0;back=7;viewSet="";tier;m=new Ve;shadowR=30;constructor(e,t){this.tier=t,this.renderer=new Er({canvas:e,antialias:t==="high",powerPreference:"high-performance",stencil:!1}),this.renderer.setPixelRatio(1),this.renderer.toneMapping=ba,this.renderer.toneMappingExposure=1.05;let n=t!=="low";if(n){this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=t==="high"?iu:el,this.sun.castShadow=!0;let r=t==="high"?2048:1024;this.sun.shadow.mapSize.set(r,r),this.sun.shadow.bias=-6e-4,this.sun.shadow.normalBias=.03,this.sun.shadow.camera.near=1,this.sun.shadow.camera.far=120}this.scene.background=this.bg,this.fog=new $o(this.bg,60,160),this.scene.fog=this.fog,this.scene.add(this.hemi,this.sun,this.sun.target,this.lamp,this.chunks,this.portals),this.under=new yt(new as(4e3,4e3).rotateX(-Math.PI/2),new hn({color:3033642})),this.under.position.y=-.8,this.scene.add(this.under),this.water=new yt(new as(1,1).rotateX(-Math.PI/2),new Zo({color:3114672,transparent:!0,opacity:.72,shininess:90,specular:10474736})),this.water.position.y=-.14,this.water.receiveShadow=n,this.scene.add(this.water),this.people=new Dr(this.scene,512,n),this.animals=new ol(this.scene,128,n),this.shots=new Kn(new Jn(.07,6,4),new Jt({color:16773536}),256),this.shots.instanceMatrix.setUsage(ki),this.shots.count=0,this.shots.frustumCulled=!1,this.scene.add(this.shots);let s=(r,a,o)=>{let l=new Kn(r,new hn({color:a,flatShading:!0}),o);return l.instanceMatrix.setUsage(ki),l.count=0,l.frustumCulled=!1,l.castShadow=n,this.scene.add(l),l};this.cans=s(new tn(.09,.09,.17,10).translate(0,.085,0),12866111,256),this.bushes=s(new Zn(.52,1).scale(1,.8,1).translate(0,.38,0),4161335,256),this.berries=s(new Zn(.075,0),14688314,256*6),this.crates=s(new tn(.2,.2,.3,4).rotateY(Math.PI/4).translate(0,.15,0),10122312,128)}aimLine=null;aimRing=null;aim(e,t=0,n=0,s=0,r=20,a=NaN,o=NaN){if(!e){this.aimLine&&(this.aimLine.visible=!1),this.aimRing&&(this.aimRing.visible=!1);return}if(!this.aimLine){let h=new Jt({color:16769146,transparent:!0,opacity:.75,depthWrite:!1});this.aimLine=new yt(new as(1,.09).rotateX(-Math.PI/2).translate(.5,0,0),h),this.aimRing=new yt(new ya(.55,.06,6,24).rotateX(-Math.PI/2),new Jt({color:16734780,depthWrite:!1})),this.aimLine.renderOrder=this.aimRing.renderOrder=5,this.scene.add(this.aimLine,this.aimRing)}this.aimLine.visible=!0,this.aimLine.position.set(t+Math.cos(s)*.5,.06,n+Math.sin(s)*.5),this.aimLine.rotation.set(0,-s,0),this.aimLine.scale.set(r,1,1);let l=Number.isFinite(a);this.aimRing.visible=l,l&&this.aimRing.position.set(a,.08,o)}ghostBox=null;ghostArrow=null;ghost(e,t=!0,n=null){if(!e){this.ghostBox&&(this.ghostBox.visible=!1),this.ghostArrow&&(this.ghostArrow.visible=!1);return}this.ghostBox||(this.ghostBox=new Kn(new Ui(1,1,1),new Jt({color:8188058,transparent:!0,opacity:.42,depthWrite:!1}),40),this.ghostBox.instanceMatrix.setUsage(ki),this.ghostBox.frustumCulled=!1,this.ghostBox.renderOrder=6,this.ghostArrow=new yt(new di(.42,.9,3).rotateX(Math.PI/2).rotateY(Math.PI/2),new Jt({color:16765786,transparent:!0,opacity:.9,depthWrite:!1})),this.ghostArrow.renderOrder=7,this.scene.add(this.ghostBox,this.ghostArrow));let s=this.ghostBox,r=Math.min(40,e.length/3|0);s.material.color.setHex(t?8188058:16734794);for(let o=0;o<r;o++){let l=Math.max(.06,e[o*3+2]);this.v3.set(e[o*3]+.5,l/2+.01,e[o*3+1]+.5),this.s3.set(.96,l,.96),this.q.identity(),this.m.compose(this.v3,this.q,this.s3),s.setMatrixAt(o,this.m)}s.count=r,s.instanceMatrix.needsUpdate=!0,s.visible=!0;let a=this.ghostArrow;a.visible=!!n,n&&(a.position.set(n[0],.35,n[1]),a.rotation.set(0,-n[2],0))}beginItems(){this.nCan=this.nBush=this.nCrate=0}item(e,t,n,s){let r=(s*2654435761>>>0)/4294967296;if(this.m.compose(this.v3.set(e,0,t),this.q.setFromEuler(this.eu.set(0,r*6.28,0)),this.s3.set(1,1,1)),n===1&&this.nCan<256)this.cans.setMatrixAt(this.nCan++,this.m);else if(n===2&&this.nBush<256){let a=this.nBush++;this.bushes.setMatrixAt(a,this.m);for(let o=0;o<6;o++){let l=r*6.28+o*1.05;this.m.makeTranslation(e+Math.cos(l)*.43,.32+o%3*.14,t+Math.sin(l)*.43),this.berries.setMatrixAt(a*6+o,this.m)}}else this.nCrate<128&&this.crates.setMatrixAt(this.nCrate++,this.m)}endItems(){this.cans.count=this.nCan,this.bushes.count=this.nBush,this.berries.count=this.nBush*6,this.crates.count=this.nCrate;for(let e of[this.cans,this.bushes,this.berries,this.crates])e.instanceMatrix.needsUpdate=!0}setMap(e,t,n){this.clearChunks(),this.water.scale.set(e,1,t),this.water.position.set(e/2,-.14,t/2);for(let s of this.portals.children.slice())this.portals.remove(s),db(s);for(let s of n)this.portals.add(ub(s.x,s.y))}addChunk(e,t,n=null,s=null){let r=new Yn,a=new yt(e,this.groundMat);if(a.receiveShadow=this.tier!=="low",r.add(a),t){let o=new yt(t,this.propMat);o.castShadow=o.receiveShadow=this.tier!=="low",r.add(o)}if(n&&r.add(new yt(n,this.glowMat)),s){let o=new yt(s,this.poolMat);o.renderOrder=2,r.add(o)}return this.chunks.add(r),r}removeChunk(e){this.chunks.remove(e);for(let t of e.children)t.geometry.dispose()}clearChunks(){for(let e of this.chunks.children.slice())this.removeChunk(e)}beginShots(){this.nShots=0}shot(e,t){this.nShots>=256||(this.m.makeTranslation(e,1,t),this.shots.setMatrixAt(this.nShots++,this.m))}endShots(){this.shots.count=this.nShots,this.shots.instanceMatrix.needsUpdate=!0}resize(e,t){this.renderer.setSize(e,t,!1),this.camera.aspect=e/t,this.camera.updateProjectionMatrix()}pv=new D;project(e,t,n,s){let r=this.pv.set(e,t,n).project(this.camera);return r.z>1||r.x<-1.1||r.x>1.1||r.y<-1.1||r.y>1.1?!1:(s.x=(r.x+1)/2*innerWidth,s.y=(1-r.y)/2*innerHeight,!0)}get sight(){return(this.tier==="low"?42:this.tier==="mid"?52:64)*this.distK}distK=1;fogK=1;fogAt(e,t){if(!this.fogK){this.fog.near=1e5,this.fog.far=1e6;return}this.fog.near=e*this.fogK,this.fog.far=t*this.fogK}settingsChanged(){this.viewSet=""}follow(e,t,n,s){this.target.set(e,0,t);let r=s?1:1-Math.exp(-n*(this.view==="top"?6:14));this.look.x+=(e-this.look.x)*r,this.look.z+=(t-this.look.z)*r;let a=this.dist;if(this.view!==this.viewSet){this.viewSet=this.view;let d=this.camera;this.view==="top"?(d.fov=30,d.near=1,d.far=400):(d.fov=this.view==="first"?62:55,d.near=.12,d.far=this.sight*(this.fogK?Math.max(1,this.fogK):1.6)+6),d.updateProjectionMatrix()}let o=this.look.x,l=this.look.z;if(this.view==="top")this.camera.position.set(this.look.x,Math.sin(up)*a,this.look.z+Math.cos(up)*a),this.camera.lookAt(this.look.x,0,this.look.z),this.fogAt(a*1.6*this.distK,a*3.6*this.distK);else{let d=Math.sin(this.yaw),m=-Math.cos(this.yaw);if(this.view==="third"){let g=this.back;this.camera.position.set(this.look.x-d*g,1.4+g*.42,this.look.z-m*g),this.camera.lookAt(this.look.x+d*3,1.1,this.look.z+m*3)}else this.camera.position.set(this.look.x+d*.18,1.55,this.look.z+m*.18),this.camera.lookAt(this.look.x+d*10,.9,this.look.z+m*10);this.fogAt(this.sight*.35,this.sight),a=this.sight*.4,o=this.look.x+d*a*.8,l=this.look.z+m*a*.8}if(this.sun.castShadow){let d=this.shadowR=Math.min(60,a*1.15+6),m=this.sun.shadow.camera;m.right!==d&&(m.left=-d,m.right=d,m.top=d,m.bottom=-d,m.updateProjectionMatrix())}let h=this.shadowR*2/this.sun.shadow.mapSize.x,c=Math.round(o/h)*h,u=Math.round(l/h)*h;this.sun.target.position.set(c,0,u),this.sun.position.set(c+this.sunDir.x*50,this.sunDir.y*50,u+this.sunDir.z*50),this.lamp.position.set(e,2.2,t)}sunDir=new D(.4,.8,.45).normalize();c1=new le;c2=new le;setHour(e,t){let n=e<5||e>21?0:e<8?(e-5)/3:e>18?(21-e)/3:1,s=n>0&&n<1?Math.sin(n*Math.PI):0,r=(e-6)/12*Math.PI;n>0?this.sunDir.set(-Math.cos(r)*.8,Math.max(.5,Math.sin(r)),.55).normalize():this.sunDir.set(.3,.8,.4).normalize(),this.sun.intensity=n>0?.5+2*n:.45,this.sun.color.setHex(9349375).lerp(this.c1.setHex(16773590),n).lerp(this.c2.setHex(16752736),s*.7),this.hemi.intensity=(.35+.8*n)*(this.view==="top"?1:1.5),this.hemi.color.setHex(3162218).lerp(this.c1.setHex(13624319),n),this.hemi.groundColor.setHex(1841698).lerp(this.c1.setHex(6114362),n),this.bg.setHex(726054).lerp(this.c1.setHex(10274792),n).lerp(this.c2.setHex(15178346),s*.6),this.lamp.intensity=(1-n)*9,this.poolMat.opacity=(1-n)*.42,this.poolMat.visible=n<.98;let a=1+Math.sin(t*2.5)*.06;for(let o of this.portals.children)o.children[0].rotation.y=t*.8,o.children[1].scale.set(a,1,a)}render(){this.renderer.render(this.scene,this.camera)}dispose(){this.clearChunks(),this.renderer.dispose()}};function ub(i,e){let t=new Yn;t.position.set(i,0,e);let n=new yt(new ya(1.3,.11,8,32),new Jt({color:9433343}));n.position.y=1.4;let s=new yt(new ui(2,32).rotateX(-Math.PI/2),new Jt({color:5232895,transparent:!0,opacity:.45,blending:Ps,depthWrite:!1,side:Dn}));return s.position.y=.05,t.add(n,s),t}function db(i){i.traverse(e=>{let t=e;t.geometry&&t.geometry.dispose()})}var fb={grass:{shape:0,ground:7776597,top:0,side:0,height:0},dirt:{shape:0,ground:10780248,top:0,side:0,height:0},road:{shape:0,ground:6973282,top:0,side:0,height:0},floor:{shape:0,ground:11569759,top:0,side:0,height:0},sand:{shape:0,ground:14469267,top:0,side:0,height:0},water:{shape:1,ground:5009250,top:0,side:0,height:0},wall:{shape:2,ground:9275262,top:12761258,side:10918797,height:2.3},tree:{shape:3,ground:6197061,top:5215296,side:7031343,height:0},rubble:{shape:4,ground:9471865,top:10195587,side:0,height:0},woodwall:{shape:2,ground:9071176,top:9134649,side:8016946,height:1.7,even:!0,planks:!0},campfire:{shape:5,ground:9271906,top:9407106,side:5978658,height:0},ashes:{shape:6,ground:7301731,top:4012599,side:4863268,height:0},crate:{shape:2,ground:9071176,top:10779208,side:9134649,height:.8,even:!0,planks:!0},farm:{shape:0,ground:7033398,top:0,side:0,height:0},rock:{shape:7,ground:9275262,top:10130572,side:0,height:0},wreck:{shape:8,ground:6973282,top:9063986,side:3881528,height:0},palisade:{shape:9,ground:9071176,top:10186822,side:7228204,height:0},spikes:{shape:10,ground:9071176,top:10517066,side:7228204,height:0},stonewall:{shape:2,ground:9275262,top:11906723,side:10194816,height:1.9,even:!0},door:{shape:11,ground:11569759,top:9134649,side:7031343,height:0},window:{shape:12,ground:9071176,top:9134649,side:8016946,height:1.7},bed:{shape:13,ground:11569759,top:11554876,side:8016946,height:0},lamp:{shape:14,ground:9271906,top:16769162,side:4867136,height:0}};function dp(i){let e=[];for(let t=0;t<256;t++)e.push({shape:0,ground:7251535,top:0,side:0,height:0});for(let t of i){let n=fb[t.name];e[t.id]=n?{...n}:t.solid?{shape:2,ground:t.color,top:t.color,side:t.color,height:2}:{shape:0,ground:t.color,top:0,side:0,height:0}}return e}function It(i,e){let t=Math.imul(i|0,374761393)+Math.imul(e|0,668265263);return t=Math.imul(t^t>>>13,1274126177),((t^t>>>16)>>>0)/4294967296}function cl(i,e,t){let n=i/t,s=e/t,r=Math.floor(n),a=Math.floor(s),o=n-r,l=s-a;o=o*o*(3-2*o),l=l*l*(3-2*l);let h=It(r,a),c=It(r+1,a),u=It(r,a+1),d=It(r+1,a+1);return h+(c-h)*o+(u-h)*l+(h-c-u+d)*o*l}var Ta=64,pb=-.55;function Nn(i){let e=i.index?i.toNonIndexed():i;e.computeVertexNormals();let t=e.getAttribute("position").array,n=1/0,s=-1/0;for(let r=1;r<t.length;r+=3)n=Math.min(n,t[r]),s=Math.max(s,t[r]);return{pos:t,nor:e.getAttribute("normal").array,minY:n,maxY:s}}var Tu=null;function mb(){return Tu||(Tu={trunk:Nn(new tn(.1,.17,1,6,1,!0).translate(0,.5,0)),leaf:Nn(new Zn(1,1)),leafLo:Nn(new Zn(1,0)),rock:Nn(new Zn(1,0)),blade:Nn(new di(.045,.34,3,1,!0).translate(0,.17,0)),log:Nn(new tn(.06,.06,.62,6,1,!1).rotateZ(Math.PI/2)),flame:Nn(new di(.16,.5,5,1,!1).translate(0,.25,0)),box:Nn(new Ui(1,1,1).translate(0,.5,0)),spike:Nn(new di(.5,1,6,1,!1).translate(0,.5,0)),post:Nn(new tn(.5,.5,1,7,1,!1).translate(0,.5,0)),disc:Nn(new ui(1,16).rotateX(-Math.PI/2)),wheel:Nn(new tn(.5,.5,1,8,1,!1).rotateZ(Math.PI/2))}),Tu}var Ra=class{pos=[];nor=[];col=[];geometry(){if(!this.pos.length)return null;let e=new en;return e.setAttribute("position",new it(this.pos,3)),e.setAttribute("normal",new it(this.nor,3)),e.setAttribute("color",new it(this.col,3)),e.computeBoundingSphere(),e}},hl=new D,ul=new D,gb=new Ve,fp=new Ue,xb=new an,vb=new Vt,yb=new D,_b=new D,hS=new le;function Xe(i,e,t,n,s){fp.getNormalMatrix(t);let r=e.pos,a=e.nor,o=e.maxY-e.minY||1;for(let l=0;l<r.length;l+=3){let h=s+(1-s)*((r[l+1]-e.minY)/o);hl.set(r[l],r[l+1],r[l+2]).applyMatrix4(t),ul.set(a[l],a[l+1],a[l+2]).applyMatrix3(fp).normalize(),i.pos.push(hl.x,hl.y,hl.z),i.nor.push(ul.x,ul.y,ul.z),i.col.push(n.r*h,n.g*h,n.b*h)}}var Eu=[0,.3,.6,.82,1],pp=[1,.75,.38,.12,0],Cu=20;function bb(i,e,t,n,s){for(let r=0;r<Eu.length-1;r++){let a=Eu[r]*n,o=Eu[r+1]*n,l=pp[r],h=pp[r+1];for(let c=0;c<Cu;c++){let u=c/Cu*Math.PI*2,d=(c+1)/Cu*Math.PI*2,m=Math.cos(u),g=Math.sin(u),x=Math.cos(d),p=Math.sin(d),f=[[a*m,a*g,l],[o*x,o*p,h],[o*m,o*g,h],[a*m,a*g,l],[a*x,a*p,l],[o*x,o*p,h]];for(let[w,S,v]of f)i.pos.push(e+w,.05,t+S),i.nor.push(0,1,0),i.col.push(s.r*v,s.g*v,s.b*v)}}}function Ye(i,e,t,n,s,r,a,o,l){return gb.compose(_b.set(i,e,t),xb.setFromEuler(vb.set(n,s,r)),yb.set(a,o,l))}function Ea(i,e,t,n,s,r,a,o,l,h,c,u,d,m,g,x,p,f,w){let S=[e,t,n,s,r,a,o,l,h,e,t,n,o,l,h,c,u,d],v=[f,f,w,f,w,w];for(let I=0;I<6;I++)i.pos.push(S[I*3],S[I*3+1],S[I*3+2]),i.nor.push(m,g,x),i.col.push(p.r*v[I],p.g*v[I],p.b*v[I])}function mp(i,e,t){return!i.even&&It(e*7+1,t*13+5)<.3?.8+It(e,t+99)*1.2:i.height}var ht=(i,e)=>e.setHex(i),Mb=new le(11711080),Ca=new le;function gp(i,e,t,n,s){let r=i*32,a=e*32,o=Ta+1,l=new Float32Array(o*o*3),h=new Float32Array(o*o*3),c=new le,u=new le;for(let v=0;v<o;v++)for(let I=0;I<o;I++){let R=I&1?I-1>>1:(I>>1)-1,T=I&1?R:I>>1,C=v&1?v-1>>1:(v>>1)-1,y=v&1?C:v>>1,_=0,L=0,N=!1,P=!1;u.setRGB(0,0,0);let F=r+I/2,H=a+v/2;for(let G=C;G<=y;G++)for(let ae=R;ae<=T;ae++){let ee=t(ae,G);if(ee<0)continue;let me=n[ee];if(ht(me.ground,c),me.shape===0&&me.ground===7776597){let ke=cl(F+300,H,9);c.lerp(Mb,Math.max(0,ke-.45)*1.1)}u.r+=c.r,u.g+=c.g,u.b+=c.b,L+=me.shape===1?pb:0,me.shape===2&&(N=!0),(me.ground===6973282||me.ground===11569759||me.shape===1)&&(P=!0),_++}_||(u.setHex(7251535),_=1);let O=(.9+cl(F,H,3.5)*.18+(It(I+r*2,v+a*2)-.5)*.05)*(N?.7:1),Z=(v*o+I)*3;h[Z]=u.r/_*O,h[Z+1]=u.g/_*O,h[Z+2]=u.b/_*O,l[Z]=F,l[Z+2]=H,l[Z+1]=L/_+(P?0:(cl(F,H,2.5)-.5)*.14)}let d=new Uint16Array(Ta*Ta*6),m=0;for(let v=0;v<Ta;v++)for(let I=0;I<Ta;I++){let R=v*o+I,T=R+1,C=R+o,y=C+1;I+v&1?(d[m++]=R,d[m++]=C,d[m++]=T,d[m++]=T,d[m++]=C,d[m++]=y):(d[m++]=R,d[m++]=C,d[m++]=y,d[m++]=R,d[m++]=y,d[m++]=T)}let g=new en;g.setAttribute("position",new it(l,3)),g.setAttribute("color",new it(h,3)),g.setIndex(new Ar(d,1)),g.computeVertexNormals(),g.computeBoundingSphere();let x=mb(),p=new Ra,f=new Ra,w=new Ra,S=s?x.leaf:x.leafLo;for(let v=0;v<32;v++)for(let I=0;I<32;I++){let R=t(I,v),T=n[R],C=r+I,y=a+v,_=It(C,y),L=It(y+17,C-3),N=It(C*3+7,y*5+1);if(T.shape===2){let P=mp(T,C,y),F=.92+_*.14;ht(T.top,c).multiplyScalar(F);let H=C,O=C+1,Z=y,G=y+1;Ea(p,H,P,G,O,P,G,O,P,Z,H,P,Z,0,1,0,c,1,1),ht(T.side,c).multiplyScalar(F);let ae=(me,ke)=>{let ot=t(me,ke);if(ot<0)return 0;let X=n[ot];return X.shape===2?mp(X,r+me,a+ke):0},ee=ae(I,v+1);ee<P&&Ea(p,H,ee,G,O,ee,G,O,P,G,H,P,G,0,0,1,c,ee?.85:.55,1),ee=ae(I,v-1),ee<P&&Ea(p,O,ee,Z,H,ee,Z,H,P,Z,O,P,Z,0,0,-1,c,ee?.85:.55,1),ee=ae(I+1,v),ee<P&&Ea(p,O,ee,G,O,ee,Z,O,P,Z,O,P,G,1,0,0,c,ee?.85:.55,.95),ee=ae(I-1,v),ee<P&&Ea(p,H,ee,Z,H,ee,G,H,P,G,H,P,Z,-1,0,0,c,ee?.85:.55,.95)}else if(T.shape===3){let P=.85+_*.5,F=C+.5+(L-.5)*.3,H=y+.5+(N-.5)*.3,O=.9*P+.3;ht(T.side,c),Xe(p,x.trunk,Ye(F,0,H,0,L*6,0,P,O,P),c,.55),ht(T.top,c),Ca.setHex(L<.5?6989898:3963448),c.lerp(Ca,N*.7).multiplyScalar(.92+_*.16),Xe(p,S,Ye(F,O+.5*P,H,L,_*6,N,.95*P,.8*P,.95*P),c,.62),c.multiplyScalar(1.08),Xe(p,S,Ye(F+(L-.5)*.5*P,O+1.05*P,H+(N-.5)*.4*P,N,L*6,_,.62*P,.55*P,.62*P),c,.75)}else if(T.shape===5||T.shape===6){let P=C+.5,F=y+.5,H=T.shape===5;for(let O=0;O<7;O++){let Z=O/7*Math.PI*2+_,G=.1+It(C+O,y-O)*.05;ht(T.top,c).multiplyScalar(.8+It(C*3+O,y)*.3),Xe(p,x.rock,Ye(P+Math.cos(Z)*.34,G*.4,F+Math.sin(Z)*.34,Z,Z*2,0,G,G*.7,G),c,.65)}ht(T.side,c);for(let O=0;O<3;O++)Xe(p,x.log,Ye(P,.07+O*.03,F,0,L*3+O*1.05,H?.25:.05,1,1,1),c,.6);H&&(ht(15895086,c),Xe(f,x.flame,Ye(P,.08,F,0,_*6,0,1,1.15,1),c,.75),ht(16369487,c),Xe(f,x.flame,Ye(P+.04,.1,F-.03,.1,L*6,0,.6,.8,.6),c,.85),ht(16773560,c),Xe(f,x.flame,Ye(P-.02,.1,F+.02,0,N*6,.1,.3,.5,.3),c,1))}else if(T.shape===4)for(let P=0;P<3;P++){let F=It(C*5+P,y*3-P),H=It(y*7+P,C-P*11);ht(T.top,c).multiplyScalar(.8+F*.35);let O=.16+F*.22;Xe(p,x.rock,Ye(C+.2+H*.6,O*.25,y+.2+F*.6,F*3,H*6,H,O,O*.6,O*.9),c,.6)}else if(T.shape===7)for(let P=0;P<2;P++){let F=It(C*3+P,y*7-P),H=It(y*5+P,C+P*13);ht(T.top,c).multiplyScalar(.78+F*.3),P===1&&L<.4&&c.lerp(Ca.setHex(10512188),.45);let O=P?.28+F*.15:.45+F*.15;Xe(p,x.rock,Ye(C+.3+H*.4,O*.45,y+.3+F*.4,F*3,H*6,H,O,O*.8,O*.95),c,.55)}else if(T.shape===8){let P=(_-.5)*1.2+(C+y&1?Math.PI/2:0),F=(L-.5)*.25,H=C+.5,O=y+.5;Ca.setHex([9063986,6253426,8022586,7223856][Math.floor(N*4)]),c.copy(Ca).multiplyScalar(.85+_*.2),Xe(p,x.box,Ye(H,.18,O,F,P,F*.6,1.15,.42,.62),c,.6),c.multiplyScalar(.8),Xe(p,x.box,Ye(H+Math.cos(P)*.1,.58,O-Math.sin(P)*.1,F,P,F+.1,.6,.3*(.5+L),.55),c,.7),ht(T.side,c),Xe(p,x.wheel,Ye(H+Math.cos(P)*.4,.17,O-Math.sin(P)*.4+.3,0,P,0,.17,.34,.34),c,.5),_<.6&&Xe(p,x.wheel,Ye(H-Math.cos(P)*.4,.12,O+Math.sin(P)*.4-.3,.4,P,1.2,.17,.3,.3),c,.5)}else if(T.shape===9){for(let P=0;P<3;P++){let F=1.5+It(C+P*5,y-P)*.4,H=C+.18+P*.32,O=y+.5+(It(C*9+P,y)-.5)*.1;ht(T.side,c).multiplyScalar(.85+It(C+P,y*3)*.25),Xe(p,x.post,Ye(H,0,O,0,P,0,.3,F,.3),c,.55),ht(T.top,c),Xe(p,x.spike,Ye(H,F,O,0,P,0,.3,.28,.3),c,.8)}for(let P=0;P<3;P++){let F=y+.2+P*.3,H=C+.5;ht(T.side,c).multiplyScalar(.85+It(C+P,y*5)*.25),Xe(p,x.post,Ye(H,0,F,0,P,0,.28,1.4+It(C-P,y+P)*.4,.28),c,.55)}}else if(T.shape===10)for(let P=0;P<3;P++){let F=C+.2+P*.3;for(let H of[.5,-.5]){let Z=Math.sin(H)*1.05,G=Math.cos(H)*1.05;ht(T.side,c),Xe(p,x.post,Ye(F,0,y+.5,H,0,0,.12,1.05,.12),c,.6),ht(T.top,c),Xe(p,x.spike,Ye(F,G,y+.5+Z,H,0,0,.12,.32,.12),c,.85)}}else if(T.shape===11)ht(T.side,c),Xe(p,x.box,Ye(C+.06,0,y+.5,0,0,0,.12,1.8,.14),c,.6),Xe(p,x.box,Ye(C+.94,0,y+.5,0,0,0,.12,1.8,.14),c,.6),Xe(p,x.box,Ye(C+.5,1.72,y+.5,0,0,0,1,.12,.16),c,.8),ht(T.top,c),Xe(p,x.box,Ye(C+.12+.3,.02,y+.5+.3,0,-.9,0,.78,1.65,.07),c,.7);else if(T.shape===12)ht(T.side,c),Xe(p,x.box,Ye(C+.5,0,y+.5,0,0,0,1,.8,.92),c,.6),Xe(p,x.box,Ye(C+.06,.8,y+.5,0,0,0,.12,.9,.92),c,.8),Xe(p,x.box,Ye(C+.94,.8,y+.5,0,0,0,.12,.9,.92),c,.8),Xe(p,x.box,Ye(C+.5,1.6,y+.5,0,0,0,1,.12,.92),c,.85),ht(10474728,c),Xe(f,x.box,Ye(C+.5,.8,y+.5,0,0,0,.78,.8,.04),c,1);else if(T.shape===13)ht(T.side,c),Xe(p,x.box,Ye(C+.5,0,y+.5,0,0,0,.72,.28,.96),c,.6),ht(T.top,c),Xe(p,x.box,Ye(C+.5,.28,y+.56,0,0,0,.66,.1,.76),c,.85),ht(15656662,c),Xe(p,x.box,Ye(C+.5,.28,y+.13,0,0,0,.5,.12,.18),c,.9);else if(T.shape===14)ht(T.side,c),Xe(p,x.post,Ye(C+.5,0,y+.5,0,0,0,.1,1.7,.1),c,.6),Xe(p,x.box,Ye(C+.5,1.68,y+.5,0,.6,0,.3,.06,.3),c,.8),ht(T.top,c),Xe(f,x.box,Ye(C+.5,1.45,y+.5,0,.6,0,.2,.24,.2),c,1),ht(16757322,c),bb(w,C+.5,y+.5,4.2,c);else if(T.shape===0&&T.ground===7776597&&_<.2){let P=C+.2+L*.6,F=y+.2+N*.6;ht(6265413,c).multiplyScalar(.85+L*.3);for(let H=0;H<3;H++)Xe(p,x.blade,Ye(P+(H-1)*.06,0,F+(H*7%3-1)*.05,(N-.5)*.5,H*2.1,(H-1)*.35,1,.7+_*1.5,1),c,.6);_<.05&&(ht(L<.33?15921126:L<.66?15976778:14243402,c),Xe(p,x.rock,Ye(P,.28,F,_,L,N,.06,.05,.06),c,1))}}return{ground:g,props:p.geometry(),glow:f.geometry(),pool:w.geometry()}}var Pa=i=>i.replace(/[&<>"']/g,e=>`&#${e.charCodeAt(0)};`),wb=new le(16777215),Ru=[.5,1,2,4],Sb=4,Ab=8,Tb=32;function Pu(i,e){let t=Math.floor((i/3600+8)/24)+1,n=Math.floor((i/3600+8)%24),s=Math.floor(i/60%60);return`${e} ${t} ${String(n).padStart(2,"0")}:${String(s).padStart(2,"0")}`}var dl=class{constructor(e,t,n,s,r){this.mapName=t;this.scale=n;this.looks=s;this.zombie=r;this.rec=e;let a=atob(e.frames),o=new Uint8Array(a.length);for(let h=0;h<a.length;h++)o[h]=a.charCodeAt(h);this.data=new Int16Array(o.buffer,0,o.length>>1);for(let h=0;h<this.data.length;h+=1+this.data[h]*7)this.offs.push(h);let l=e.who.length;this.face=new Float32Array(l),this.phase=new Float32Array(l),this.lastX=new Float32Array(l).fill(NaN),this.lastY=new Float32Array(l),this.spd=new Float32Array(l),this.el=document.createElement("div"),this.el.id="replay",document.body.appendChild(this.el),this.centre(0)}mapName;scale;looks;zombie;rec;t=0;playing=!0;speed=1;data;offs=[];face;phase;lastX;lastY;spd;el;html="";cx=0;cy=0;span=10;get length(){return Math.max(0,this.offs.length-1)/this.rec.hz}close(){this.el.remove()}toggle(){this.t>=this.length&&(this.t=0),this.playing=!this.playing}seek(e){this.t=Math.max(0,Math.min(this.length,this.t+e)),this.lastX.fill(NaN)}faster(e){let t=Ru.indexOf(this.speed);this.speed=Ru[Math.max(0,Math.min(Ru.length-1,t+(e?1:-1)))]}update(e){this.playing&&(this.t+=e*this.speed,this.t>=this.length&&(this.t=this.length,this.playing=!1))}rows(e,t){t.clear();let n=this.data,s=this.offs[Math.max(0,Math.min(this.offs.length-1,e))];if(s===void 0)return;let r=n[s];for(let a=0,o=s+1;a<r;a++,o+=7)t.set(n[o],[n[o+1]/10,n[o+2]/10,n[o+3]/5e3,n[o+4],n[o+5],n[o+6]])}a=new Map;b=new Map;centre(e){this.rows(e,this.a);let t=0,n=0,s=0;for(let[r,a]of this.a){let o=this.rec.who[r][1]===2?2:1;t+=a[0]*o,n+=a[1]*o,s+=o}s&&(this.cx=t/s,this.cy=n/s)}draw(e,t,n){let s=this.t*this.rec.hz,r=Math.floor(s),a=s-r;this.rows(r,this.a),this.rows(r+1,this.b);let o=1/0,l=1/0,h=-1/0,c=-1/0;for(let[u,d]of this.a){let m=this.b.get(u)??d,g=this.rec.who[u],x=g[1]===2,p=d[0]+(m[0]-d[0])*a,f=d[1]+(m[1]-d[1])*a,w=this.lastX[u],S=Number.isNaN(w)?0:Math.hypot(p-w,f-this.lastY[u]);S>.004&&(this.face[u]=Math.atan2(p-w,f-this.lastY[u])),this.lastX[u]=p,this.lastY[u]=f;let v=t>0?Math.min(6,S/t):0;this.spd[u]=this.spd[u]+(v-this.spd[u])*Math.min(1,t*10),this.phase[u]=(this.phase[u]+S*4.2)%(Math.PI*2);let I=d[5];e.add(p,f,this.face[u],this.phase[u],Math.min(1,this.spd[u]/(x?1.2:2.2)),x?this.zombie:this.looks(g[0],g[2]),(I&(Sb|Ab))!==0,I&Tb?.62:1,x),x||e.marker(p,f,performance.now()/1e3,wb),o=Math.min(o,p),h=Math.max(h,p),l=Math.min(l,f),c=Math.max(c,f)}if(o<=h){let u=Math.min(1,t*3);this.cx+=((o+h)/2-this.cx)*u,this.cy+=((l+c)/2-this.cy)*u,this.span+=(Math.max(h-o,(c-l)*1.6)-this.span)*u}this.overlay(r,n)}overlay(e,t){let n=this.rec,s=c=>c>=0?Pa(n.who[c]?.[2]??"?"):"?",r=[];for(let c=n.events.length-1;c>=0&&r.length<4;c--){let[u,d,m,g,x]=n.events[c];if(u>e||e-u>n.hz*6)continue;let p=d==="bite"?se("evBite",s(g),s(m),String(x)):d==="killed"?se("evKilled",s(g),s(m)):d==="death"?se("evDeath",s(m)):d==="fight"?se("evFight",s(m),s(g)):d==="flee"?se("evFlee",s(m),s(g)):`${s(m)}: \u201C${Pa(String(x))}\u201D`;r.unshift(`<div class="re re-${d}">${p}</div>`)}this.rows(e,this.a);let a=[];for(let[c,u]of this.a){let d=n.who[c];d[1]!==2&&a.push(`<span class="rp-p"><b>${Pa(d[2])}</b> ${t(u[3])} \xB7 ${u[4]}</span>`)}let o=c=>`${Math.floor(c/60)}:${String(Math.floor(c%60)).padStart(2,"0")}`,l=this.length?this.t/this.length*100:0,h=`<div class="rp-t">${A("rpTitle")} \xB7 ${Pa(Pu(n.start+this.t*this.scale,A("day")))} \xB7 ${Pa(this.mapName)}</div><div class="rp-bar"><i style="width:${l.toFixed(1)}%"></i></div><div class="rp-s"><span>${this.playing?"\u25B6":"\u275A\u275A"} ${o(this.t)} / ${o(this.length)} \xB7 x${this.speed}</span><span>${A("rpHint")}</span></div><div class="rp-people">${a.join("")}</div><div class="rp-ev">${r.join("")}</div>`;h!==this.html&&(this.html=h,this.el.innerHTML=h)}};var Nr=["use","talk","attack","aim","build","run","eat","drink","pickup","sleep","zoomIn","zoomOut","thoughts","person","menu","camera","wheel","attackPerson"],Eb={use:"aUse",run:"aRun",eat:"aEat",drink:"aDrink",pickup:"aPickup",sleep:"aSleep",zoomIn:"aZoomIn",zoomOut:"aZoomOut",thoughts:"aThoughts",person:"aPerson",menu:"aMenu",camera:"aCamera",wheel:"aWheel",talk:"aTalk",attack:"aAttack",aim:"aAim",build:"aBuild",attackPerson:"aAttackPerson"},on=i=>A(Eb[i]),ml=2,Ur={pad:{use:0,run:1,attack:2,talk:3,zoomIn:4,zoomOut:5,aim:6,wheel:7,thoughts:8,menu:9,build:10,camera:11},remote:{use:"ok",attack:"red",talk:"green",thoughts:"yellow",person:"blue",zoomIn:"chUp",zoomOut:"chDown",menu:"info",wheel:"playPause",aim:"ff",build:"tools"},v:ml};function gl(i){return{pad:{...i.pad},remote:{...i.remote},v:i.v}}function ks(i,e){for(let t of Nr)if(i.pad[t]===e)return t}function Fs(i,e){for(let t of Nr)if(i.remote[t]===e)return t}var Cb={ok:"OK",red:"\u{1F534}",green:"\u{1F7E2}",yellow:"\u{1F7E1}",blue:"\u{1F535}",chUp:"CH +",chDown:"CH \u2212",info:"Info",play:"\u25B6",pause:"\u23F8",playPause:"\u23EF",ff:"\u23E9",rew:"\u23EA",next:"\u23ED",prev:"\u23EE",stop:"\u23F9",record:"\u23FA",tools:"Tools",chList:"CH list",guide:"Guide",space:"Space",pageUp:"PgUp",pageDown:"PgDn"},Ia=i=>Cb[i]??(/^\d$/.test(i),i),fl=class{constructor(e,t,n){this.build=e;this.onPick=t;this.onClose=n;this.el=document.createElement("div"),this.el.id="gmenu",this.el.hidden=!0,this.el.setAttribute("role","dialog"),this.titleEl=document.createElement("div"),this.titleEl.className="mt",this.textEl=document.createElement("div"),this.textEl.className="mx",this.listEl=document.createElement("div"),this.listEl.className="ml",this.listEl.setAttribute("role","menu"),this.el.append(this.titleEl,this.textEl,this.listEl),document.body.appendChild(this.el)}build;onPick;onClose;el;titleEl;textEl;listEl;stack=[];rows=[];cur=null;open=!1;sel=0;get page(){return this.stack.length?this.stack[this.stack.length-1].id:""}show(e="root"){this.onSound("ui_open"),this.stack=[{id:e,sel:0}],this.open=!0,this.el.hidden=!1,document.body.classList.add("menu-open"),this.render()}push(e){this.stack.length&&(this.stack[this.stack.length-1].sel=this.sel),this.stack.push({id:e,sel:0}),this.render()}back(){if(this.stack.pop(),!this.stack.length){this.close();return}this.render(this.stack[this.stack.length-1].sel)}close(){this.open=!1,this.el.hidden=!0,document.body.classList.remove("menu-open"),this.stack=[],this.onClose()}refresh(){this.open&&this.render(this.sel)}render(e=0){let t=this.build(this.page);this.cur=t,this.rows=t.rows,this.titleEl.textContent=t.title,this.el.classList.toggle("wide",!!t.wide),this.el.classList.toggle("big",!!t.big),t.html?this.textEl.innerHTML=t.html:this.textEl.textContent=t.text??"",this.textEl.hidden=!t.text&&!t.html,this.listEl.textContent="";for(let n of t.rows){let s=document.createElement("div");s.className="mr"+(n.dim?" dim":""),s.setAttribute("role","menuitem");let r=document.createElement("span");if(r.textContent=n.label+(n.sub?" \u203A":""),s.appendChild(r),n.value!==void 0){let a=document.createElement("span");a.className="mv",a.textContent=n.value,s.appendChild(a)}this.listEl.appendChild(s)}this.select(Math.min(e,Math.max(0,t.rows.length-1)))}select(e){let t=this.listEl.children;t[this.sel]?.classList.remove("on"),this.sel=e;let n=t[e];if(n){n.classList.add("on"),n.scrollIntoView?.({block:"nearest"});let s=this.rows[e];globalThis.MyPC?.announce?.(s.label+(s.value?", "+s.value:""))}}input(e){if(!this.open)return;let t=this.cur?.grid;if(t&&e!=="back"){this.onSound(e==="ok"?"ui_ok":"ui_move"),e==="ok"?t.ok():t.move(e),this.refresh();return}if(e==="left"||e==="right")return;let n=this.rows.length;if(this.onSound(e==="up"||e==="down"?"ui_move":e==="ok"?"ui_ok":this.stack.length>1?"ui_back":"ui_close"),e==="up"&&n)this.select((this.sel+n-1)%n);else if(e==="down"&&n)this.select((this.sel+1)%n);else if(e==="back")this.back();else if(e==="ok"&&n){let s=this.rows[this.sel];this.onPick(this.page,s.id)}}onSound=()=>{}};function An(i,e){let t=Math.max(0,Math.min(100,100-e)),n=t>60?"#5cc98a":t>30?"#e8b64a":"#e5625b";return`<span class="nb"><span class="nl">${i}</span><span class="nt"><i style="width:${Math.max(3,t)}%;background:${n}"></i></span></span>`}var vp={drink:"gDrink",eat:"gEat",forage:"gForage",sleep:"gSleep",talk:"gTalk",wander:"gWander",rest:"gRest",travel:"gTravel","gather wood":"wGatherWood","gather stone":"wGatherStone","gather scrap":"wGatherScrap","make an axe":"wAxe","make a spear":"wSpear","build a campfire":"wFire","build a hut":"wHut","feed the fire":"wTend","collect food and store it":"wStore","search the ruins":"wLoot","plant a field":"wFarm","repair the huts":"wRepair"};function xp(i){let e={wood:"iWood",stone:"iStone",scrap:"iScrap",axe:"iAxe",spear:"iSpear"};return Object.entries(i??{}).filter(([t,n])=>n>0&&e[t]).map(([t,n])=>t==="axe"||t==="spear"?A(e[t]):`${n} ${A(e[t])}`).join(", ")}var pl=class{constructor(e=10){this.max=e;this.box=document.createElement("div"),this.box.id="bubbles",document.body.appendChild(this.box);for(let t=0;t<e;t++){let n=document.createElement("div");n.className="bub",n.hidden=!0;let s=document.createElement("div");s.className="ba";let r=document.createElement("div");r.className="bb";let a=document.createElement("div");a.className="bp",a.hidden=!0;let o=document.createElement("i");a.appendChild(o),n.append(s,r,a),this.box.appendChild(n),this.pool.push({el:n,a:s,b:r,p:a,pi:o,pct:-2,id:-1,text:"",act:-1,ver:-1,lx:0,ly:0})}}max;box;pool=[];ver=0;pt={x:0,y:0};data=new Map;set(e,t){this.data.clear();for(let n of e){let s={id:n[0],act:n[1],to:String(n[2]??""),dist:Number(n[3])||0,wish:String(n[4]??""),wishWith:String(n[5]??""),why:String(n[6]??""),mood:String(n[7]??""),said:String(n[8]??""),pct:typeof n[9]=="number"?n[9]:-1,from:String(n[10]??"")};this.data.set(s.id,s)}this.ver++}hide(){for(let e of this.pool)e.el.hidden=!0,e.id=-1}cand=Array.from({length:48},()=>({id:-1,x:0,y:0,d:0}));wp={x:0,y:0};draw(e,t,n,s,r){let a=0;for(let l of this.data.keys()){if(a>=this.cand.length)break;if(!e(l,this.wp))continue;let h=this.cand[a++];h.id=l,h.x=this.wp.x,h.y=this.wp.y,h.d=Math.hypot(h.x-n,h.y-s)}let o=0;for(;o<this.pool.length&&o<a;o++){let l=o;for(let g=o+1;g<a;g++)this.cand[g].d<this.cand[l].d&&(l=g);if(l!==o){let g=this.cand[o];this.cand[o]=this.cand[l],this.cand[l]=g}let h=this.cand[o],c=this.pool[o],u=this.data.get(h.id);if(!t(h.x,h.y,this.pt)){c.el.hidden=!0;continue}if(c.id!==h.id||c.act!==u.act||c.ver!==this.ver){let g=r(u.act)+(u.to?" \xB7 "+se("bWith",u.to):"")+(u.dist>=3?` \xB7 ${u.dist} m`:""),x=u.wish==="task"?u.why:u.wish?se("bWants",A(vp[u.wish]??"gWander")+(u.wishWith?" "+se("bWith",u.wishWith):""))+(u.why?` (${u.why})`:""):"",p=[u.said?`\u201C${u.said}\u201D`:"",x].filter(Boolean).join(" \xB7 "),f=g+"|"+p;c.text!==f&&(c.text=f,c.a.textContent=g,c.b.textContent=p,c.b.hidden=!p);let w=u.wish==="task"?u.pct:-1;c.pct!==w&&(c.pct=w,c.p.hidden=w<0,w>=0&&(c.pi.style.width=`${Math.max(6,w)}%`,c.p.className=u.from?"bp ord":"bp")),c.id=h.id,c.act=u.act,c.ver=this.ver}c.el.hidden=!1;let d=Math.round(this.pt.x),m=Math.round(this.pt.y);(d!==c.lx||m!==c.ly)&&(c.lx=d,c.ly=m,c.el.style.transform=`translate(${d}px, ${m}px) translate(-50%, -100%)`)}for(;o<this.pool.length;o++)this.pool[o].el.hidden=!0,this.pool[o].id=-1}},Iu={baby:"stBaby",toddler:"stToddler",child:"stChild",teen:"stTeen",adult:"stAdult"},Rb={strength:"tStrength",speed:"tSpeed",intelligence:"tIntelligence",courage:"tCourage",empathy:"tEmpathy",metabolism:"tMetabolism",lifespan:"tLifespan"};function Lu(i,e,t){let n=a=>a.replace(/[&<>"']/g,o=>`&#${o.charCodeAt(0)};`),s=`<div class="pn">${n(i.name)}</div><div class="ps">${i.sex==="f"?A("pWoman"):A("pMan")} \xB7 ${se("pAge",String(i.age))}${i.stage&&i.stage!=="adult"?" \xB7 "+A(Iu[i.stage]??"stChild"):i.age<16?" \xB7 "+A("pChild"):""}${i.carer?" \xB7 "+n(se("famLooked",i.carer)):""}${i.pregnant?" \xB7 "+A("pExpecting"):""}</div>`;if(!i.alive)return s+`<div class="ps">${A("pDead")}${i.cause?" ("+n(i.cause)+")":""}</div>`;let r=[s,`<div class="pa">${n(e(i.act??0))}${i.carry?" \xB7 "+se("carry",String(i.carry)):""}${xp(i.inv)?" \xB7 "+n(se("has",xp(i.inv))):""}</div>`,`<div class="pbars">${An(A("nFood"),i.hunger??0)}${An(A("nWater"),i.thirst??0)}${An(A("nRest"),i.tired??0)}${An(A("nFun"),i.lonely??0)}${An(A("nHp"),100-(i.hp??100))}</div>`];if(i.goal&&r.push(`<div class="pm">${A("pGoal")}: <b>${n(i.goal.text)}</b> \xB7 ${Math.min(i.goal.k+1,i.goal.n)}/${i.goal.n}</div><div class="bp${i.goal.from!=="myself"?" ord":""}"><i style="width:${Math.max(6,i.goal.pct)}%"></i></div>`),i.level!==void 0&&r.push(`<div class="pm">${se("pLevel",String(i.level),String(i.xp??0))}</div>`),i.mind){let a=i.mind;r.push(`<div class="pm">${A("pMood")}: <b>${n(a.mood)}</b>${a.plan?` \xB7 ${A("pWants")} ${n(A(vp[a.plan.act]??"gWander"))}${a.plan.with?" "+n(se("bWith",a.plan.with)):""}${a.plan.why?" ("+n(a.plan.why)+")":""}`:""}</div>`),a.said&&r.push(`<div class="pm">${A("pSaid")}: \u201C${n(a.said)}\u201D</div>`)}return t&&(r.push(`<div class="pm">${n(i.personality.join(", "))} \xB7 ${se("pGen",String(i.generation))}</div>`,`<div class="pm">${A("pPartner")}: ${n(i.partner??A("pNone"))} \xB7 ${A("pParents")}: ${n(i.parents.join(", ")||A("pFirst"))} \xB7 ${A("pChildren")}: ${n(i.children.join(", ")||A("pNone"))}${i.siblings?.length?" \xB7 "+n(i.siblings.join(", ")):""}</div>`,`<div class="pm">${A("pTraits")}: ${Object.entries(i.traits).map(([a,o])=>`${A(Rb[a]??"tStrength")} ${a==="lifespan"?o:Math.round(o*100)+"%"}`).join(" \xB7 ")}</div>`),i.mind?.memory&&r.push(`<div class="pm">${A("pMemory")}: ${n(i.mind.memory)}</div>`),i.mind?.recent.length&&r.push(`<div class="pm">${A("pRecent")}: ${n(i.mind.recent.join(" \xB7 "))}</div>`)),r.join("")}var xl=class{constructor(e){this.el=e;e.hidden=!0,this.mid=document.createElement("div"),this.mid.className="wh-mid",this.helpEl=document.createElement("div"),this.helpEl.className="wh-help"}el;open=!1;hold=!1;sel=-1;openedAt=0;items=[];slots=[];mid;helpEl;show(e,t,n){this.items=e,this.hold=t,this.open=!0,this.sel=-1,this.openedAt=performance.now(),this.el.textContent="",this.slots=e.map((s,r)=>{let a=r/e.length*Math.PI*2,o=document.createElement("div");o.className="wh-s",o.style.left=`${50+Math.sin(a)*36}%`,o.style.top=`${50-Math.cos(a)*36}%`;let l=document.createElement("b");l.textContent=s.icon;let h=document.createElement("span");return h.textContent=s.label,o.append(l,h),this.el.appendChild(o),o}),this.mid.textContent="",this.helpEl.textContent=n,this.el.append(this.mid,this.helpEl),this.el.hidden=!1}aim(e,t){if(e*e+t*t<.3)return;let n=this.items.length,s=Math.atan2(e,-t);s<0&&(s+=Math.PI*2),this.choose(Math.round(s/(Math.PI*2/n))%n)}step(e){let t=this.items.length;e==="up"?this.choose(0):e==="down"?this.choose(Math.floor(t/2)):this.choose(((this.sel<0?0:this.sel)+(e==="right"?1:t-1))%t)}choose(e){if(e===this.sel)return;this.sel>=0&&this.slots[this.sel]?.classList.remove("on"),this.sel=e;let t=this.slots[e];t&&(t.classList.add("on"),this.mid.textContent=this.items[e].label)}close(){if(!this.open)return null;let e=this.sel>=0?this.items[this.sel].id:null;return this.open=!1,this.hold=!1,this.sel=-1,this.el.hidden=!0,e}};var Du={on:!0,master:.8,fx:.9,amb:.5,ui:.6},Pb=14,yp=26,vl=class{prefs={...Du};ctx=null;master=null;bus={};entries=new Map;buffers=new Map;loading=new Set;lastAt=new Map;voices=0;loops=new Map;base="";lx=0;ly=0;yaw=0;topView=!0;ready=!1;log=[];stats(){return{ready:this.ready,state:this.ctx?.state??"none",sounds:this.entries.size,decoded:this.buffers.size,loops:[...this.loops.entries()].map(([e,t])=>`${e}:${t.cur.toFixed(2)}`),log:this.log.slice()}}async load(e){this.base=e;try{let t=await fetch(e+"manifest.json",{cache:"no-cache"});if(!t.ok)return;let n=await t.json();for(let s of n.sounds??[])s&&s.id&&Array.isArray(s.files)&&s.files.length&&this.entries.set(s.id,s);this.ready=!0}catch{}}has(e){return this.entries.has(e)}unlock(){if(this.ctx){this.ctx.state==="suspended"&&this.ctx.resume().catch(()=>{});return}try{let e=window.AudioContext||window.webkitAudioContext;this.ctx=new e({latencyHint:"interactive"})}catch{return}this.master=this.ctx.createGain(),this.master.connect(this.ctx.destination);for(let e of["fx","ui"]){let t=this.ctx.createGain();t.connect(this.master),this.bus[e]=t}this.apply(),this.preload()}async preload(){let e=[...this.entries.values()].filter(t=>!t.loop);for(let t=0;t<e.length;t+=4)await Promise.all(e.slice(t,t+4).map(n=>this.decode(n)))}async decode(e){if(this.buffers.has(e.id))return this.buffers.get(e.id);if(!this.ctx||this.loading.has(e.id))return null;this.loading.add(e.id);let t=[];for(let n of e.files)try{let s=await fetch(this.base+n);if(!s.ok)continue;let r=await s.arrayBuffer();t.push(await new Promise((a,o)=>this.ctx.decodeAudioData(r,a,o)))}catch{}return this.loading.delete(e.id),this.buffers.set(e.id,t),t}apply(){let e=this.prefs;this.master&&(this.master.gain.value=e.on?e.master:0),this.bus.fx&&(this.bus.fx.gain.value=e.fx),this.bus.ui&&(this.bus.ui.gain.value=e.ui);for(let t of this.loops.values())this.setLoopVol(t)}play(e,t,n,s=1,r=1){let a=this.ctx,o=this.entries.get(e);if(!a||!o||!this.prefs.on||a.state!=="running"||this.voices>=Pb)return;let l=performance.now();if(l-(this.lastAt.get(e)??0)<60)return;let h=this.buffers.get(e);if(!h){this.decode(o);return}if(!h.length)return;let c=(o.gain??1)*s,u=0;if(t!==void 0&&n!==void 0){let x=t-this.lx,p=n-this.ly,f=Math.hypot(x,p);if(f>yp)return;c*=f<3?1:Math.pow(1-(f-3)/(yp-3),1.6);let w=this.topView?x:x*Math.cos(this.yaw)+p*Math.sin(this.yaw);u=Math.max(-.85,Math.min(.85,w/10))}if(c<.02)return;this.lastAt.set(e,l);let d=a.createBufferSource();d.buffer=h[Math.random()*h.length|0],d.playbackRate.value=r*(.94+Math.random()*.12);let m=a.createGain();m.gain.value=c,d.connect(m);let g=m;if(u&&a.createStereoPanner){let x=a.createStereoPanner();x.pan.value=u,m.connect(x),g=x}g.connect(o.cat==="ui"?this.bus.ui:this.bus.fx),this.voices++,this.log.push(e),this.log.length>30&&this.log.shift(),d.onended=()=>{this.voices--;try{g.disconnect(),m.disconnect()}catch{}},d.start()}loop(e,t){let n=this.entries.get(e);if(!n||!n.loop)return;let s=this.loops.get(e);if(!s){if(t<=.01||!this.ctx)return;let r=new Audio(this.base+n.files[0]);r.loop=!0,r.preload="auto",r.volume=0,s={el:r,want:0,cur:0},this.loops.set(e,s)}s.want=t*(n.gain??1)}setLoopVol(e){let t=this.prefs,n=t.on?e.cur*t.amb*t.master:0;e.el.volume=Math.max(0,Math.min(1,n))}tick(e){for(let[t,n]of this.loops){let s=Math.min(1,e*1.5);if(n.cur+=(n.want-n.cur)*s,n.want<=.01&&n.cur<.01){n.el.pause(),n.el.removeAttribute("src"),n.el.load(),this.loops.delete(t);continue}this.setLoopVol(n),n.el.paused&&this.prefs.on&&this.ctx&&n.el.play().catch(()=>{})}}pause(e){if(e){for(let t of this.loops.values())t.el.pause();this.ctx?.suspend().catch(()=>{})}else this.ctx?.resume().catch(()=>{})}};var Dt=i=>i.replace(/[&<>"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[e]),Ib=["sword","axe","spear","bow","arrows","clothes","armor","helmet"],_p=[...qi,...Ib,...Xi],bp={weapon:"sword",clothing:"armor",defence:"palisade",furniture:"bed"},La=i=>A("qual"+i),Uu=()=>Math.max(24,Math.round(innerWidth*.036));function os(i,e,t,n="",s=-1){let r=i?al(i,Uu()):"",a=s>0?` style="border-color:${xs[s]};box-shadow:0 0 0.6vw ${xs[s]} inset"`:"",o=i?r?`<i style="${r}"></i>`:`<i class="tx">${Dt(i.slice(0,2))}</i>`:"";return`<div class="sl${t?" on":""}${n}"${a}>${o}${e>1?`<b>${e}</b>`:""}</div>`}function Mp(i,e,t){return Object.entries(i).map(([n,s])=>{let r=(e[n]??0)>=s,a=Su(n)?al(n,Math.round(Uu()*.62)):"";return`<span class="cc${r?"":" no"}">${a?`<i style="${a}"></i>`:""}${s} ${Dt(t(n))}</span>`}).join("")}var yl=class{constructor(e){this.c=e}c;zone="bag";i=0;tab=0;cells=Array(9).fill("");pot(){let e={};for(let t of this.cells)t&&(e[t]=(e[t]??0)+1);return e}clear(){this.cells.fill("")}bag(){let e=this.c.inv(),t=this.pot(),n=[],s=Object.keys(e).filter(r=>(e[r]??0)>0).sort((r,a)=>(_p.indexOf(r)+1||99)-(_p.indexOf(a)+1||99));for(let r of s){let a=(e[r]??0)-(t[r]??0);a>0&&n.push([r,a])}return n}result(){let e=this.pot();if(!Object.keys(e).length)return null;let t=ri[this.tab];return js(t,e)??ri.map(n=>js(n,e)).find(n=>n)??null}book(){return $i.filter(e=>e.cat===ri[this.tab])}html(){let e=this.c,t=e.inv(),n=this.zone,s=this.result(),r=this.book(),a=this.bag(),o=ri.map((g,x)=>`<div class="tb${x===this.tab?" cur":""}${n==="tabs"&&this.i===x?" on":""}">${Su(bp[g])?`<i style="${al(bp[g],Math.round(Uu()*.7))}"></i>`:""}${Dt(e.catName(g))}</div>`).join(""),l=this.cells.map((g,x)=>os(g,1,n==="grid"&&this.i===x)).join(""),h=s?os(s.what,s.n??1,n==="result",s.cat!==ri[this.tab]?" other":""):os("",0,n==="result"," empty"),c=r.map((g,x)=>{let p=Object.entries(g.need).every(([f,w])=>(t[f]??0)>=w);return os(g.what,g.n??1,n==="book"&&this.i===x,p?" can":" cant")}).join(""),u=Array.from({length:36},(g,x)=>{let p=a[x];return os(p?.[0]??"",p?.[1]??0,n==="bag"&&this.i===x,"",p&&ai[p[0]]?e.gear()?.up?.[p[0]]?.[1]??0:-1)}).join(""),d="",m="";if(n==="tabs")d=e.catName(ri[this.i]),m=A("invHintTab");else if(n==="grid"){let g=this.cells[this.i];d=g?e.thing(g):A("invEmpty"),m=g?A("invHintGrid"):A("invHintNone")}else if(n==="result")d=s?`${e.thing(s.what)}${s.n&&s.n>1?" x"+s.n:""}${s.cat!==ri[this.tab]?" \xB7 "+se("invIn",e.catName(s.cat)):""}`:A("invEmpty"),m=s?se("invHintMake",e.thing(s.what)):A("invHintNone");else if(n==="book"){let g=r[this.i];g&&(d=`${e.thing(g.what)} = ${Object.entries(g.need).map(([x,p])=>`${p} ${e.thing(x)}`).join(" + ")}`,m=A("invHintBook"))}else{let g=a[this.i];if(g){let[x]=g,p=e.gear()?.up?.[x];d=`${e.thing(x)}${p&&(p[0]||p[1])?` +${p[0]} \xB7 ${La(p[1])}`:""}`,m=qi.includes(x)?A("invHintRes"):ai[x]?A("invHintGear"):Xi.includes(x)?A("invHintPlace"):""}else d=A("invEmpty")}return`<div class="inv"><div class="tabs">${o}</div>
<div class="r1"><div class="box"><div class="bt">${Dt(A("invCraft"))}</div><div class="cr"><div class="cg">${l}</div><div class="arr">\u279C</div>${h}</div></div>
<div class="box bkb"><div class="bt">${Dt(A("invBook"))}</div><div class="bk">${c}</div></div></div>
<div class="box"><div class="bt">${Dt(A("invBag"))}</div><div class="bg">${u}</div></div>
<div class="ds"><b>${Dt(d)}</b><span>${Dt(m)}</span></div><div class="nv">${Dt(A("invNav"))}</div></div>`}move(e){let t=this.zone,n=this.i,s=this.book().length,r=(a,o)=>{this.zone=a,this.i=o};if(t==="tabs")e==="left"||e==="right"?(this.i=(n+(e==="left"?3:1))%4,this.tab=this.i):e==="down"&&r("grid",Math.min(n,2));else if(t==="grid"){let a=Math.floor(n/3),o=n%3;e==="left"&&o>0?this.i--:e==="right"?o<2?this.i++:r("result",0):e==="up"?a>0?this.i-=3:r("tabs",this.tab):e==="down"&&(a<2?this.i+=3:r("bag",o*2))}else if(t==="result")e==="left"?r("grid",5):e==="right"&&s?r("book",0):e==="up"?r("tabs",this.tab):e==="down"&&r("bag",6);else if(t==="book"){let a=Math.floor(n/3),o=n%3;e==="left"?o>0?this.i--:r("result",0):e==="right"&&o<2&&n+1<s?this.i++:e==="up"?a>0?this.i-=3:r("tabs",this.tab):e==="down"&&(n+3<s?this.i+=3:r("bag",6+o))}else{let a=Math.floor(n/9),o=n%9;e==="left"&&o>0?this.i--:e==="right"&&o<8?this.i++:e==="down"&&a<3?this.i+=9:e==="up"&&(a>0?this.i-=9:o<=4?r("grid",6+Math.min(2,Math.floor(o/2))):o===5||!s?r("result",0):r("book",Math.min(s-1,Math.floor((s-1)/3)*3+Math.min(2,o-6))))}}ok(){let e=this.c,t=this.zone;if(t==="tabs"){this.tab=this.i;return}if(t==="grid"){this.cells[this.i]="";return}if(t==="result"){let r=this.result();if(!r){e.note(A("invHintNone"),2e3);return}e.send("craft",`${r.cat}:${Object.entries(this.pot()).map(([a,o])=>`${a}=${o}`).join(",")}`);return}if(t==="book"){let r=this.book()[this.i];if(!r)return;let a=e.inv(),o=Object.entries(r.need).filter(([h,c])=>(a[h]??0)<c);if(o.length){e.note(se("invMissing",o.map(([h,c])=>`${c-(a[h]??0)} ${e.thing(h)}`).join(", ")),3e3);return}this.clear();let l=0;for(let[h,c]of Object.entries(r.need))for(let u=0;u<c&&l<9;u++)this.cells[l++]=h;this.zone="result",this.i=0;return}let n=this.bag()[this.i];if(!n)return;let[s]=n;if(qi.includes(s)){let r=this.cells.indexOf("");if(r<0){e.note(A("invHintGrid"),1500);return}this.cells[r]=s,this.bag()[this.i]||(this.i=Math.max(0,this.i-1))}else ai[s]?e.send("equip",`${ai[s]}:${s}`):Xi.includes(s)&&(e.send("place",s),e.close())}},wp=["weapon","ranged","head","body"],Lb={weapon:"gSlotWeapon",ranged:"gSlotRanged",head:"gSlotHead",body:"gSlotBody"},Db={weapon:"sword",ranged:"bow",head:"helmet",body:"armor"},_l=class{constructor(e){this.c=e}c;col=0;row=0;opt=0;prev=null;slotNow(){return wp[this.row0]}row0=0;options(e){let t=this.c.inv();return["","-",...Object.keys(ai).filter(n=>ai[n]===e&&(t[n]??0)>0)]}used(e){return this.c.gear()?.use?.[e]??""}up(e){return this.c.gear()?.up?.[e]??[0,0]}stat(e,t,n){if(!e)return"";let s=ra(e)*sa(t,n);return ai[e]==="body"||ai[e]==="head"?`${A("gDefence")} ${Math.round(s*100)} %`:`${A("gDamage")} ${s.toFixed(1)}`}html(){let e=this.c,t=e.inv(),n=this.slotNow(),s=wp.map((f,w)=>{let S=this.used(f),[v,I]=S?this.up(S):[0,0],R=this.col===0&&this.row0===w,T=this.row0===w;return`<div class="gs${R?" on":""}${T?" cur":""}">${os(S||Db[f],0,!1,S?"":" ghost",S?I:-1)}<div><div class="gl">${Dt(A(Lb[f]))}</div><div class="gv">${S?`${Dt(e.thing(S))} <span style="color:${xs[I]}">+${v} ${Dt(La(I))}</span>`:Dt(f==="weapon"?A("gHands"):A("gNone"))}</div></div></div>`}).join(""),r=this.options(n),a=e.gear()?.[n]??"",o=r.map((f,w)=>{let S=this.col===1&&this.row===0&&this.opt===w,v=(a||"")===f,I=f===""?A("gBest"):f==="-"?A("gNone"):e.thing(f),[,R]=f&&f!=="-"?this.up(f):[0,0];return`<div class="go${S?" on":""}${v?" cur":""}">${f&&f!=="-"?os(f,t[f]??0,!1,"",R):`<div class="sl txt">${f===""?"\u2605":"\u2205"}</div>`}<span>${Dt(I)}</span></div>`}).join(""),l=this.used(n),[h,c]=l?this.up(l):[0,0],u=`<p class="dim">${Dt(A("gEmpty"))}</p>`;if(l){let f=this.col===1&&this.row===1,w=this.col===1&&this.row===2,S=h>=Qs?A("gMax"):`${this.stat(l,h,c)} \u279C ${this.stat(l,h+1,c)}`,v=Pd(c),I=c>=4?A("gMax"):h<v?se("gNeedLv",String(v)):`${La(c)} \u279C <span style="color:${xs[c+1]}">${Dt(La(c+1))}</span>`;u=`<div class="gd"><div class="gbig">${os(l,0,!1," big",c)}<div><b style="color:${xs[c]}">${Dt(e.thing(l))} +${h}</b><div>${Dt(La(c))} \xB7 ${Dt(this.stat(l,h,c))}</div>
<div class="qbar">${[0,1,2,3,4].map(R=>`<i style="background:${R<=c?xs[R]:"rgba(255,255,255,.12)"}"></i>`).join("")}</div><div class="lbar">${Array.from({length:Qs},(R,T)=>`<i class="${T<h?"f":""}"></i>`).join("")}</div></div></div>
<div class="gb${f?" on":""}${h>=Qs?" off":""}"><b>${Dt(A("gLevelUp"))}</b><span>${Dt(S)}</span><div>${h<Qs?Mp(Id(l,h),t,e.thing):""}</div></div>
<div class="gb${w?" on":""}${c>=4||h<v?" off":""}"><b>${Dt(A("gQualityUp"))}</b><span>${I}</span><div>${c<4?Mp(Ld(l,c),t,e.thing):""}</div></div></div>`}let d=this.used("weapon"),m=this.used("body"),g=this.used("head"),x=d?ra(d)*sa(...this.up(d)):15,p=Math.min(.7,(m?ra(m)*sa(...this.up(m)):0)+(g?ra(g)*sa(...this.up(g)):0));return`<div class="gear"><div class="gp"><div id="gprev"></div><div class="gt"><span>\u2694 ${x.toFixed(0)}</span><span>\u{1F6E1} ${Math.round(p*100)} %</span></div></div>
<div class="gsl">${s}</div><div class="gr"><div class="gor">${o}</div>${u}</div></div><div class="nv">${Dt(A("gNav"))}</div>`}move(e){let t=!!this.used(this.slotNow());if(this.col===0){e==="up"?this.row0=(this.row0+3)%4:e==="down"?this.row0=(this.row0+1)%4:e==="right"&&(this.col=1,this.row=0,this.opt=Math.max(0,this.options(this.slotNow()).indexOf(this.c.gear()?.[this.slotNow()]??"")));return}let n=this.options(this.slotNow()).length;this.row===0?e==="left"?this.opt>0?this.opt--:this.col=0:e==="right"?this.opt=Math.min(n-1,this.opt+1):e==="down"&&t&&(this.row=1):e==="up"?this.row--:e==="down"?this.row=Math.min(2,this.row+1):e==="left"&&(this.col=0)}ok(){let e=this.slotNow();if(this.col===0){this.move("right");return}if(this.row===0){let n=this.options(e)[this.opt]??"";this.c.send("equip",`${e}:${n}`);return}let t=this.used(e);t&&this.c.send("upgrade",`${t}:${this.row===1?"lv":"q"}`)}draw(e){let t=document.getElementById("gprev");if(!t){this.stop();return}this.prev??=new Nu;let n=this.c.gear(),s=n?.use??{},r=c=>c?n?.up?.[c]??[0,0]:[0,0],a=s.weapon||(s.ranged?"bow":""),o=e/1e3%5,l=o>3.6?a==="bow"?"shoot":a?"attack":"use":"",h=Dd({held:a,hq:r(a)[1],helmet:s.head==="helmet",headQ:r(s.head)[1],body:s.body==="armor"?"armor":s.body==="clothes"?"clothes":"",bodyQ:r(s.body)[1],anim:l,seq:0,back:!!s.ranged&&a!=="bow"});this.prev.draw(t,this.c.look(),h,l?o-3.6:0,e/1e3)}stop(){this.prev?.dispose(),this.prev=null}},Nu=class{canvas=Object.assign(document.createElement("canvas"),{className:"gpc"});r;scene=new Cr;cam=new Zt(30,.75,.1,50);people;w=0;h=0;constructor(){this.r=new Er({canvas:this.canvas,antialias:!0,alpha:!0}),this.r.setPixelRatio(1),this.r.toneMapping=ba,this.scene.add(new Pr(15397631,4865072,1.6));let e=new Us(16773590,2.4);e.position.set(-2,4,4),this.scene.add(e);let t=new Us(11061503,1.3);t.position.set(3,3,-4),this.scene.add(t);let n=new yt(new ui(1.1,40).rotateX(-Math.PI/2),new hn({color:3814440}));this.scene.add(n),this.people=new Dr(this.scene,1,!1),this.cam.position.set(0,1.5,5.3),this.cam.lookAt(0,.98,0)}draw(e,t,n,s,r){this.canvas.parentElement!==e&&(e.textContent="",e.appendChild(this.canvas));let a=e.clientWidth,o=e.clientHeight;(a!==this.w||o!==this.h)&&(this.w=a,this.h=o,this.r.setSize(a,o,!1),this.cam.aspect=a/Math.max(1,o),this.cam.updateProjectionMatrix());let l=this.people;l.begin(),l.add(0,0,Math.sin(r*.6)*.9,0,0,t,!1,1,!1,n,s),l.end(),this.r.render(this.scene,this.cam)}dispose(){this.r.dispose(),this.r.forceContextLoss(),this.canvas.remove()}};var We=new vl,Ub={grass:"step_grass",dirt:"step_dirt",sand:"step_dirt",farm:"step_dirt",ashes:"step_dirt",berries:"step_grass",road:"step_stone",rubble:"step_stone",rock:"step_stone",floor:"step_wood",bed:"step_wood",door:"step_wood",water:"step_water"},Ou=[],ku=0,Fu=-1,Tp=0,Ul=-1,Fa=[],Ep={zHit:"hit",zKilled:"zombie_die",aHit:"animal_hurt",aKilled:"animal_die",chopped:"chop",mined:"mine",drank:"drink",ate:"eat",picked:"pickup",crafted:"craft",placed:"place",built:"build",swing:"swing",missed:"bow_shot",sleep:"drop",wake:"equip",partners:"reward",married:"levelup",expecting:"reward",noRecipe:"ui_error",noMat:"ui_error",noRoom:"ui_error",noItem:"ui_error",buildNeed:"ui_error",needHut:"ui_error",noBow:"ui_error",noArrows:"ui_error",tooFar:"ui_error"},kb=["rabbit","deer","boar","wolf_growl","bear_roar"],Zp=document.getElementById("c"),Cp=document.getElementById("screen"),Jp=document.getElementById("top"),jp=document.getElementById("hint"),ti=document.getElementById("note"),zu=document.getElementById("card"),Hi=null,Qn="",un=null,Ct="connect",Ze="play",El="",ls=0,Hu=0,Bn=null,kt="",Xa=256,Ya=256,Tn=128,En=128,Vi="mid",pt={q:"auto",fog:2,dist:1,fps:!1},Fb=[0,1.6,1,.6],Bb=[.7,1,1.4];function Qp(){re&&(re.fogK=Fb[pt.fog]??1,re.distK=Bb[pt.dist]??1,re.settingsChanged(),Ys.hidden=!pt.fps||Ct!=="world",ii())}var Ys=document.createElement("div");Ys.id="fps";Ys.hidden=!0;document.body.appendChild(Ys);var Cl=0,Rl=0,Ml=0,Ob=!0,re=null,em=[],kl=new Uint8Array(256),Ws=new Map,Ba=new Map,Os=[],Oa=0,za=0,Gr=10,Wr=1,tm=0,Fl={radius:.3,walk:1.4,run:3.5},dt=4096,zt=new Int32Array(dt).fill(-1),wt=new Uint8Array(dt),Br=new Uint8Array(dt),Bl=new Uint8Array(dt),zs=new Uint8Array(dt),nm=new Int32Array(dt),Rp=new Int32Array(dt),im=new Float64Array(dt),Ol=new Float32Array(dt),zl=new Float32Array(dt),Ht=new Float32Array(dt),Xt=new Float32Array(dt),Vu=new Float32Array(dt),Gu=new Float32Array(dt),zb=new Float32Array(dt),wl=new Float64Array(256*64),cs=new Float32Array(dt),Da=new Float32Array(dt),kr=new Float32Array(dt),Wu=new Float32Array(dt),qu=new Float32Array(dt),sm=[],ni=new Map,Hl=0,$u=100,_t=-1,Vl=0,Cn=-1,Ka=!1,rm=0,Ua="",jt=0,Qt=0,fi=0,pi=0,vn=!1,Gl=150,Pl=0,Il=0,Pp=!1,Sl=0,Jl=0,qs=!1,st={left:!1,right:!1,up:!1,down:!1},xt=gl(Ur),Xu=!1,xi=null,ds=!1,$s=0,gi=-1,Ha=NaN;function jl(){if(ds)return $s;if(Number.isFinite(Ha))return Ha;let i=yi();return i>=0?Math.PI/2-cs[i]:0}function Yu(i,e,t,n,s){let r=-1,a=n;for(let o=0;o<dt;o++){if(zt[o]===-1||wt[o]!==Rt.Threat&&wt[o]!==Rt.Animal||Br[o]&ms.Dead)continue;let l=Ht[o]-i,h=Xt[o]-e,c=Math.hypot(l,h);if(c>=a)continue;let u=Math.atan2(h,l)-t;u=Math.atan2(Math.sin(u),Math.cos(u)),Math.abs(u)<=s&&(a=c,r=o)}return r}var kn=!0,Ll=["top","third","first"],mi="top",vi=0,Va=!1,am=0,Ke=null,xn="",qt={},Hs=null,Bs=null,$t=null,Ip=!1,Un={sex:"m",skin:1},ut=null,Or="",om=24,Bt=null,qr=-1,Lp=0,lm=new Float32Array(dt),cm=new Float32Array(dt),hm=new Uint32Array(dt),Ku=0,hs=0,Yt=i=>new le(i),Hb=[9132604,7044426,5926790,10124111,8014667,6184558,10512442,5204830,9076586].map(Yt),Wl=[15845797,14724226,13011806,10250819,7227951].map(Yt),Vb=[2825492,4861984,8016432,13214826,1710618,9079434].map(Yt),Gb=[3881536,4865328,3095370,5261373].map(Yt),um={tunic:Yt(7038544),skin:Yt(10469247),hair:Yt(5660746),pants:Yt(4080694)},id={tunic:Yt(3122027),skin:Yt(15251600),hair:Yt(3810326),pants:Yt(3817306)},dm={tunic:Yt(14254635),skin:Yt(14197370),hair:Yt(2825492),pants:Yt(4210762)},Dp=Yt(16765286),Wb=Yt(16777215),Np=new Map;function fm(i,e){let t=(i?64:0)+e,n=Np.get(t);if(!n){let s=i?id:dm,r=(e&8)!==0;n={tunic:s.tunic,skin:Wl[Math.min(Wl.length-1,e-1&7)],hair:r?Yt(5911584):s.hair,pants:r?s.tunic:s.pants},Np.set(t,n)}return n}function pm(i){let e=n=>It(i&65535,n),t=(n,s)=>n[Math.floor(e(s)*n.length)];return{tunic:t(Hb,1),skin:t(Wl,2),hair:t(Vb,3),pants:t(Gb,4)}}function us(i,e=""){Ct=i,Zp.style.visibility=i==="world"?"visible":"hidden",Jp.hidden=jp.hidden=i!=="world",Ys.hidden=!pt.fps||i!=="world",i!=="world"&&(ti.hidden=!0,zu.hidden=!0,ed="",Y?.open&&Y.close(),Gs?.hide()),Cp.hidden=i==="world";let t="";switch(i){case"connect":t=`<h1>${A("connecting")}</h1>`;break;case"offline":t=`<h1>${A("offline")}</h1><p class="dim">${Ge(Qn)}</p><p class="key">A \xB7 ${A("menuServer")}</p>`;break;case"noserver":t=`<h1>${A("noServer")}</h1><p class="key">${A("enterServer")}</p>`;break;case"pair":t=`<h1>${A("pairTitle")}</h1><p>${A("pairHow")}</p><div class="code">${El.slice(0,3)} ${El.slice(3)}</div><p class="dim">${Ge(qb())}</p><p class="dim">${A("pairWait")}</p>`;break;case"pairfail":t=`<h1>${e}</h1>`;break;case"nogl":t=`<h1>${A("noGl")}</h1>`;break}Cp.innerHTML=t,i==="pair"&&MyPC.announce?.(`${A("pairTitle")}. ${El.split("").join(" ")}`),Ks()}var Ge=i=>i.replace(/[&<>"']/g,e=>`&#${e.charCodeAt(0)};`),qb=()=>Qn.replace(/\/+$/,"")+"/panel/",Up=0;function xe(i,e=3500){ti.textContent=i,ti.hidden=!1,clearTimeout(Up),e>0&&(Up=window.setTimeout(()=>{ti.hidden=!0},e)),MyPC.announce?.(i)}function $b(i){let e=i.trim().replace(/\/+$/,"");return/^[a-z]+:\/\//i.test(e)||(e="https://"+e),e.replace(/^http/i,"ws")+"/ws"}function Xr(){if(clearTimeout(Hu),un&&(un.onclose=null,un.close(),un=null),!Qn){us("noserver");return}Ct!=="world"&&us(ls>1?"offline":"connect");let i;try{i=new WebSocket($b(Qn))}catch{us("noserver");return}i.binaryType="arraybuffer",un=i,i.onopen=()=>{ls=0,Hi?.token?i.send(io({t:_e.Hello,v:1,token:Hi.token,name:ql()})):i.send(io({t:_e.Pair,v:1,name:ql(),dev:Xb()}))},i.onmessage=e=>Yb(Ed(e.data)),i.onclose=()=>{un===i&&(un=null,Ct!=="pairfail"&&(ls++,(Ct!=="world"||ls>2)&&us("offline"),Hu=window.setTimeout(Xr,Math.min(15e3,1e3*2**Math.min(ls,4)))))}}function ql(){return String(MyPC.info?.().profile?.name||Hi?.name||"Player")}function Xb(){return/Tizen|SMART-TV/i.test(navigator.userAgent)?"Samsung TV":/Android/i.test(navigator.userAgent)?"Android":"Browser"}function Ie(i){un&&un.readyState===1&&un.send(io(i))}function Yb(i){switch(i.t){case _e.PairCode:El=i.code,us("pair");break;case _e.Paired:Hi={token:i.token,name:i.name,server:Qn},MyPC.save("auth",Hi),un?.close();break;case _e.Error:i.code==="auth"?(Hi=null,MyPC.save("auth",null),setTimeout(Xr,300)):i.code==="expired"||i.code==="denied"?us("pairfail",A(i.code==="expired"?"pairExpired":"pairDenied")):i.code==="full"&&xe(A("worldFull"));break;case _e.Welcome:{Bn=i,Va=!!i.seer,em=dp(i.tiles),kl.fill(0);for(let e of i.tiles)e.solid&&(kl[e.id]=1);Ou=[],Ul=-1,Fa=[];for(let e of i.tiles)Ou[e.id]=Ub[e.name]??"step_dirt",Fa[e.id]=e.name,e.name==="campfire"&&(Ul=e.id);if(i.body&&(Fl=i.body),Oa=i.clock.gameSec,za=performance.now(),Gr=i.clock.clockScale,Wr=i.clock.paused?0:i.clock.speed,!re){try{re=new ll(Zp,Vi)}catch{us("nogl");return}lp(),nd(),Qp()}!kt||!i.maps.some(e=>e.id===kt)?Vs(String(MyPC.load("map",i.maps[0].id))):Vs(kt),us("world"),Ie({t:_e.Join,watch:Ze==="watch"}),ii();break}case _e.You:{Cn=i.id,Ka=i.transit,Ua=i.map,rm=i.arrive??0,vn=!1,!i.transit&&i.map!==kt&&Vs(i.map),Ze==="play"&&i.x!==void 0&&i.y!==void 0&&(Tn=i.x,En=i.y,Hn=!0,_t=-1,ii()),Ze==="play"&&!Ip&&(Ip=!0,Ie({t:_e.Do,a:"mine"})),i.transit?xe(se("travelling",Ga(i.map)),0):ti.hidden=!0;break}case _e.Notice:if(i.kind==="people"&&mM(i.data),i.kind==="interact"){let e=i.data,t=e?ni.get(e.id):void 0;xe(e?e.kind===Rt.Player?A("metPlayer"):`${fs(t!==void 0?Bl[t]:0)}...`:A("nobody"))}if(i.kind==="say"){let e=i.data;xe(`${e.name}: \u201C${e.text}\u201D`,7e3)}if(i.kind==="did"&&AM(i.data),i.kind==="me"){let e=i.data.hp??100;Fu>=0&&e<Fu-1&&We.play("hurt"),Fu=e,Ke=i.data,qa(),Y.open&&(Y.page==="bag"||Y.page==="cat"||Y.page==="guide"||Y.page==="fight"||Y.page==="inv"||Y.page==="gear")&&Y.refresh()}if(i.kind==="blocked"&&xe(A(i.data?.why==="door"?"dDoorShut":"dBlocked"),5e3),i.kind==="info"){let e=i.data;e&&e.id===qr&&(Bt=e,qa(),Y.open&&Y.page==="person"&&Y.refresh())}i.kind==="minds"&&(Va=!0,am=performance.now(),Gs.set(i.data,fs));break;case _e.Pong:Gl=Gl*.7+(performance.now()-i.c)*.3;break;case _e.Chunk:{if(i.map!==kt||!Bn)break;let e=na(i.cx,i.cy);Ws.set(e,i.tiles),Jb(e);break}case _e.ChunkDrop:if(i.map!==kt)break;for(let e of i.keys){Ws.delete(e);let t=Ba.get(e);t&&(re?.removeChunk(t),Ba.delete(e))}break;case _e.Frame:{if(i.map!==kt)break;let e=performance.now();$u=$u*.85+Math.min(400,e-Hl)*.15,Hl=e,Oa=i.gameSec,za=e;for(let s=0;s<dt;s++)zt[s]!==-1&&(Ol[s]=Ht[s],zl[s]=Xt[s]);let t=oc(i.upd),n=i.gx?oc(i.gx):null;for(let s=0;s<t.length;s+=7){let r=Kb(t[s]);if(r<0)continue;let a=wt[r]===0,o=n?n[s/7]??0:0,l=o>>15&127;(l!==Rp[r]||a)&&(Rp[r]=l,im[r]=e),nm[r]=o,wt[r]=t[s+1]&255,Br[r]=t[s+1]>>8&255,Bl[r]=t[s+1]>>16&255,zs[r]=t[s+1]>>>24&63,Ht[r]=t[s+2]/100,Xt[r]=t[s+3]/100,zb[r]=t[s+4]/1e4,Vu[r]=t[s+5]/100,Gu[r]=t[s+6]/100,a&&(Ol[r]=Wu[r]=Ht[r],zl[r]=qu[r]=Xt[r],kr[r]=0,Da[r]=0,cs[r]=Math.atan2(Vu[r],Gu[r])||0,sm[r]=pm(t[s]))}for(let s of i.del){let r=ni.get(s);r!==void 0&&(zt[r]=-1,wt[r]=0,ni.delete(s)),s===_t&&(_t=-1)}break}case _e.Stats:tm=i.s.agents,Wr=i.s.paused?0:i.s.speed;break}}function Kb(i){let e=ni.get(i);if(e!==void 0)return e;for(let t=0;t<dt;t++)if(zt[t]===-1)return zt[t]=i,ni.set(i,t),t;return-1}function Zb(){zt.fill(-1),wt.fill(0),ni.clear(),_t=-1}var fs=i=>A(["actIdle","actWander","actDrink","actEat","actForage","actSleep","actTalk","actTravel","actRest","actFlee","actGo","actGather","actBuild","actFight"][i]??"actIdle"),Ga=i=>Bn?.maps.find(e=>e.id===i)?.name??i;function Jb(i){Os.includes(i)||Os.push(i)}function jb(i,e,t){let n=i&65535,s=i>>>16;if(e<0?(n--,e+=32):e>=32&&(n++,e-=32),t<0?(s--,t+=32):t>=32&&(s++,t-=32),n<0||s<0)return-1;let r=Ws.get(na(n,s));return r?r[t*32+e]:-1}function Qb(){if(!Os.length||!re)return;let i=0,e=1/0,t=On()/32-.5,n=zn()/32-.5;for(let o=0;o<Os.length;o++){let l=Os[o],h=Math.hypot((l&65535)-t,(l>>>16)-n);h<e&&(e=h,i=o)}let s=Os.splice(i,1)[0];if(!Ws.has(s))return;let r=Ba.get(s);r&&re.removeChunk(r);let a=gp(s&65535,s>>>16,(o,l)=>jb(s,o,l),em,Vi==="high");Ba.set(s,re.addChunk(a.ground,a.props,a.glow,a.pool))}function Vs(i){if(!Bn)return;let e=Bn.maps.find(t=>t.id===i)??Bn.maps[0];kt=e.id,Xa=e.w,Ya=e.h,Tn=e.w/2,En=e.h/2,Ws.clear(),Ba.clear(),Os.length=0,re?.setMap(e.w,e.h,Bn.portals.filter(t=>t.map===kt)),Zb(),vn=!1,Hn=!0,MyPC.save("map",kt),ii()}function eM(){return re&&re.view!=="top"?Math.min(96,re.sight+10):Math.min(96,((re?.dist??24)*1.2+14)*(re?.distK??1))}function ii(){Bn&&Ie({t:_e.View,map:kt,x:On(),y:zn(),r:eM()})}function yi(){return Cn>=0?ni.get(Cn)??-1:-1}function _i(){return Ze==="play"&&Cn>=0&&!Ka}function On(){return ut?ut.cx:_i()&&vn?jt:Tn}function zn(){return ut?ut.cy:_i()&&vn?Qt:En}function tM(i){ut&&ut.close(),Or||(Or=kt),i.map!==kt&&Vs(i.map),Ze==="play"&&Ie({t:_e.Input,mx:0,my:0,run:!1,seq:++Jl}),st.left=st.right=st.up=st.down=!1,rt.left=rt.right=rt.up=rt.down=!1,!ut&&re&&(om=re.dist),ut=new dl(i,Ga(i.map),Gr,e=>pm(e),um),document.body.classList.add("replaying"),Hn=!0,ii(),MyPC.announce?.(A("rpTitle"))}function mm(){ut&&(ut.close(),ut=null,re&&(re.dist=om),document.body.classList.remove("replaying"),Or&&Or!==kt&&Vs(Or),Or="",vn=!1,Hn=!0,ii(),ei("past"))}function Al(i,e){let t=Math.floor(i),n=Math.floor(e);if(t<0||n<0||t>=Xa||n>=Ya)return!0;let s=Ws.get(na(t/32|0,n/32|0));return s?kl[s[n%32*32+t%32]]===1:!1}function zr(i,e){let t=Math.floor(i),n=Math.floor(e);if(t<0||n<0||t>=Xa||n>=Ya)return-1;let s=Ws.get(na(t/32|0,n/32|0));return s?s[n%32*32+t%32]:-1}function nM(i,e){let t=zr(i,e);return Ou[t]??"step_dirt"}function iM(i){if(i-Tp<1e3)return;if(Tp=i,Ct!=="world"||ut){for(let r of["amb_day","amb_night","amb_woods","fire_loop"])We.loop(r,0);return}let e=(((Oa+(i-za)/1e3*Gr*Wr)/3600+8)%24+24)%24,t=e<5.5||e>=20.5,n=/wood|forest/i.test(kt);We.loop("amb_night",t?.8:0),We.loop("amb_woods",!t&&n?.8:0),We.loop("amb_day",!t&&!n?.6:0);let s=99;if(Ul>=0){let r=Math.floor(On()),a=Math.floor(zn());for(let o=a-9;o<=a+9;o++)for(let l=r-9;l<=r+9;l++)zr(l+.5,o+.5)===Ul&&(s=Math.min(s,Math.hypot(l+.5-On(),o+.5-zn())))}We.loop("fire_loop",s<9?Math.min(1,(1-s/9)*1.2):0)}function kp(i,e){let t=Fl.radius*.9;return Al(i-t,e-t)||Al(i+t,e-t)||Al(i-t,e+t)||Al(i+t,e+t)}function sd(){if(Y.open||vt.open)return Hr[0]=Hr[1]=0,Hr;let i=MyPC.gamepad?MyPC.gamepad.axis(0):0,e=MyPC.gamepad?MyPC.gamepad.axis(1):0;Math.hypot(i,e)<.18&&(i=0,e=0),(st.left||rt.left)&&(i=-1),(st.right||rt.right)&&(i=1),(st.up||rt.up)&&(e=-1),(st.down||rt.down)&&(e=1);let t=Math.hypot(i,e);return t>1&&(i/=t,e/=t),[i,e]}var Fp=[0,0],Hr=[0,0];function sM(i){if(Y.open||vt.open)return Hr[0]=Hr[1]=0,Hr;let e=MyPC.gamepad,t=e?e.axis(0):0,n=e?e.axis(1):0,s=e?e.axis(2):0;Math.hypot(t,n)<.18&&(t=0,n=0),Math.abs(s)<.2&&(s=0);let r=s*Math.abs(s)+(st.right?1:0)-(st.left?1:0);vi+=r*2.4*i,!t&&!n&&(t=(rt.right?1:0)-(rt.left?1:0),n=(rt.down?1:0)-(rt.up?1:0));let a=-n+(st.up?1:0)-(st.down?1:0),o=t,l=Math.sin(vi),h=-Math.cos(vi),c=l*a-h*o,u=h*a+l*o,d=Math.hypot(c,u);return d>1&&(c/=d,u/=d),Bu[0]=c,Bu[1]=u,Bu}var Bu=[0,0],vt=new xl(document.getElementById("wheel")),rM=["use","eat","drink","sleep","build","place","bag","camera","attackPerson"],aM={use:"\u270B",eat:"\u{1F356}",drink:"\u{1F4A7}",sleep:"\u{1F6CF}",build:"\u{1F528}",place:"\u{1F9F1}",bag:"\u{1F392}",camera:"\u{1F3A5}",attackPerson:"\u2694\uFE0F"},oM={use:"qUse",eat:"qEat",drink:"qDrink",sleep:"qSleep",build:"aBuild",place:"qPlace",bag:"qBag",camera:"qCamera",attackPerson:"aAttackPerson"};function rd(i,e){if(!(Ct!=="world"||Y.open||ut)){if(i){if(vt.open){e||vt.close();return}if(Ze!=="play"||!_i())return;st.left=st.right=st.up=st.down=!1,rt.left=rt.right=rt.up=rt.down=!1,qs=!1;let t=rM.map(n=>({id:n,icon:aM[n],label:n==="place"?dM():A(oM[n])}));vt.show(t,e,A(e?"wheelHelp":"wheelRemote"));return}if(!(!e||!vt.hold)){if(vt.sel<0&&performance.now()-vt.openedAt<350){vt.hold=!1;return}ec(vt.close())}}}function gm(){let i=Ke?.inv??{};for(let e of Xi)if((i[e]??0)>0)return e;return null}var Le=null,Zu=8,xm=[[0,1],[1,0],[0,-1],[-1,0]],Bp=new Set(["grass","dirt","sand","ashes","road"]),lM=new Set(["woodwall","palisade","stonewall","floor"]),cM={palisade:1.3,spikes:.5,stonewall:1.3,door:1.5,window:1.2,bed:.35,lamp:1.6,campfire:.3};function $l(i){if(Ze!=="play"||!_i())return;Y.close(),vt.open&&vt.close(),ds&&ld(!1);let e=jl(),t=On(),n=zn();if(st.left=st.right=st.up=st.down=!1,rt.left=rt.right=rt.up=rt.down=!1,qs=!1,i==="hut"){let s=t+Math.cos(e)*4.5,r=n+Math.sin(e)*4.5,a=t-s,o=n-r,l=Math.abs(a)>Math.abs(o)?a>0?1:3:o>0?0:2;Le={what:i,tx:Math.floor(s-2),ty:Math.floor(r-2),dir:l,moveAt:0,sent:!1}}else Le={what:i,tx:Math.floor(t+Math.cos(e)*1.6),ty:Math.floor(n+Math.sin(e)*1.6),dir:0,moveAt:0,sent:!1};We.play("ui_open"),Za()}function Xs(){Le&&(Le=null,re?.ghost(null),ti.hidden=!0,Ks())}function Ql(i){let e=On(),t=zn(),n=(a,o)=>{for(let l=0;l<dt;l++)if(zt[l]!==-1&&(wt[l]===Rt.Agent||wt[l]===Rt.Player)&&Math.abs(Ht[l]-a-.5)<.9&&Math.abs(Xt[l]-o-.5)<.9)return!0;return!1};if(i.what==="hut"){let a=Math.max(i.tx,Math.min(i.tx+4,e-.5)),o=Math.max(i.ty,Math.min(i.ty+4,t-.5));if(Math.hypot(a+.5-e,o+.5-t)>Zu)return"tooFar";let[l,h]=xm[i.dir],c=i.tx+2+l*2,u=i.ty+2+h*2;for(let m=0;m<5;m++)for(let g=0;g<5;g++){let x=zr(i.tx+g+.5,i.ty+m+.5);if(x<0)return"unknown";if(!Bp.has(Fa[x]??""))return"noRoom";if((g===0||m===0||g===4||m===4)&&!(i.tx+g===c&&i.ty+m===u)&&n(i.tx+g,i.ty+m))return"someone"}let d=zr(i.tx+2+l*3+.5,i.ty+2+h*3+.5);return d<0||kl[d]?"doorBlocked":""}if(Math.hypot(i.tx+.5-e,i.ty+.5-t)>Zu)return"tooFar";let s=zr(i.tx+.5,i.ty+.5);if(s<0)return"unknown";let r=Fa[s]??"";return!Bp.has(r)&&r!=="floor"&&!((i.what==="door"||i.what==="window")&&lM.has(r))?"noRoom":i.what!=="bed"&&i.what!=="campfire"&&n(i.tx,i.ty)?"someone":""}var vm={tooFar:"cTooFar",someone:"cSomeone",doorBlocked:"cDoorBlocked",noRoom:"cNoRoom",unknown:"cUnknown"};function Za(){if(!Le)return;let i=Ql(Le),e=Le.what==="hut"?A("bHut2").replace(/ \(.*$/,""):Fn(Ot(Le.what)),t=hs?se("plPad",String(MyPC.gamepad?.label?.(0)??"A"),Le.what==="hut"?`${String(MyPC.gamepad?.label?.(2)??"X")} / ${$r("build")||"Y"}`:"\u2014",String(MyPC.gamepad?.label?.(1)??"B")):se("plRemote",Le.what==="hut"?$r("build")||"CH+":"\u2014"),n=Le.what==="hut"?" \xB7 "+se("plDoor",A(["dirS","dirE","dirN","dirW"][Le.dir])):"";xe(`${se("plTitle",e)} \xB7 ${i?se("plBad",A(vm[i]??"cNoRoom")):A("plOk")}${n} \u2014 ${t}`,0)}function ka(i,e){if(!Le)return;let t=Le,n=t.what==="hut"?5:1,s=Math.max(0,Math.min(Xa-n,t.tx+i)),r=Math.max(0,Math.min(Ya-n,t.ty+e)),a=s+n/2,o=r+n/2;if(Math.hypot(a-On(),o-zn())>Zu+n/2+.8){We.play("ui_error");return}t.tx=s,t.ty=r,We.play("ui_move",void 0,void 0,.5),Za()}function Wa(){!Le||Le.what!=="hut"||(Le.dir=(Le.dir+1)%4,We.play("ui_move"),Za())}function Xl(){if(!Le||Le.sent)return;let i=Ql(Le);if(i&&i!=="unknown"){We.play("ui_error"),xe(se("plBad",A(vm[i]??"cNoRoom")),2e3),setTimeout(Za,2e3);return}Le.sent=!0,Ie({t:_e.Do,a:"build",text:`${Le.what}#${Le.tx},${Le.ty},${Le.dir}`}),xe(A("plSent"),0)}function hM(i){if(!Le)return;let[e,t]=sd();if(re&&re.view!=="top"){let n=-t,s=e,r=Math.sin(vi),a=-Math.cos(vi);e=r*n-a*s,t=a*n+r*s}if(Math.hypot(e,t)<.5){Le.moveAt=0;return}i<Le.moveAt||(Le.moveAt=i+(Le.moveAt?140:300),Math.abs(e)>Math.abs(t)*1.2?ka(Math.sign(e),0):Math.abs(t)>Math.abs(e)*1.2?ka(0,Math.sign(t)):ka(Math.sign(e),Math.sign(t)))}function uM(){if(!re)return;if(!Le||Ze!=="play"){re.ghost(null);return}let i=Le,e=!Ql(i),t=[];if(i.what==="hut"){let[n,s]=xm[i.dir],r=i.tx+2+n*2,a=i.ty+2+s*2;for(let o=0;o<5;o++)for(let l=0;l<5;l++){let h=i.tx+l,c=i.ty+o,u=l===0||o===0||l===4||o===4;t.push(h,c,h===r&&c===a?1.5:u?1.2:0)}re.ghost(t,e,[r+.5+n*1.1,a+.5+s*1.1,Math.atan2(s,n)])}else t.push(i.tx,i.ty,cM[i.what]??.8),re.ghost(t,e)}function dM(){let i=gm();return i?se("cPut",Ot(i)):A("qPlace")}function ec(i){if(i){if(i==="camera"){tc();return}if(i==="bag"){ei("inv");return}if(i==="place"){let e=gm();e?$l(e):xe(A("qNothing"),2e3);return}zi(i,!0)}}function tc(i){mi=i??Ll[(Ll.indexOf(mi)+1)%Ll.length],MyPC.save("cam",mi);let e=yi();mi!=="top"&&e>=0&&(vi=Math.PI-cs[e]),re&&(re.yaw=vi),Hn=!0,xe(`${A("sCamera")}: ${ym(mi)}`,1500),Ks(),ii()}function ym(i){return A(i==="top"?"camTop":i==="third"?"camThird":"camFirst")}function fM(i,e){let[t,n]=Le?[0,0]:re&&re.view!=="top"?sM(i):sd();if(Le&&hM(e),ds){Math.hypot(t,n)>.35&&($s=Math.atan2(n,t)),t=n=0;let y=yi();y>=0&&(gi=Yu(vn?jt:Ht[y],vn?Qt:Xt[y],$s,22,.14))}Fp[0]=t,Fp[1]=n;let s=qs&&!Y.open,r=yi();if(r<0)return;vn||(jt=Ht[r],Qt=Xt[r],fi=pi=0,vn=!0);let a=s?Fl.run:Fl.walk,o=t*a,l=n*a,h=o-fi,c=l-pi,u=Math.hypot(h,c),d=8*i,m=u>d?d/u:1;fi+=h*m,pi+=c*m;let g=jt+fi*i;kp(g,Qt)?fi=0:jt=g;let x=Qt+pi*i;kp(jt,x)?pi=0:Qt=x;let p=Math.abs(fi)+Math.abs(pi)>.01;p&&(ku+=Math.hypot(fi,pi)*i,ku>(s?.9:.68)&&(ku=0,We.play(nM(jt,Qt),void 0,void 0,s?.6:.42))),Math.abs(fi)+Math.abs(pi)>.3&&(Ha=Math.atan2(pi,fi));let f=Math.round(t*50)/50,w=Math.round(n*50)/50;((f!==Pl||w!==Il)&&(e-Sl>50||!f&&!w||!Pl&&!Il)||s!==Pp||(p||qp)&&e-Sl>100)&&(Pl=f,Il=w,Pp=s,Sl=e,qp=p,Ie({t:_e.Input,mx:f,my:w,run:s,seq:++Jl,x:Math.round(jt*100)/100,y:Math.round(Qt*100)/100}));let S=Math.min(.5,(e-Hl)/1e3+Gl/2e3),v=Ht[r]+Vu[r]*S,I=Xt[r]+Gu[r]*S,R=v-jt,T=I-Qt,C=Math.hypot(R,T);if(C>3)jt=v,Qt=I,fi=pi=0;else if(!p&&!f&&!w&&C>.4&&e-Sl>600){let y=1-Math.exp(-i*2);jt+=R*y,Qt+=T*y}}function _m(){if(!Bn)return;let i=Bn.maps.findIndex(e=>e.id===kt);Vs(Bn.maps[(i+1)%Bn.maps.length].id),MyPC.announce?.(Ga(kt))}function Yl(i){if(re){if(re.view==="third"){re.back=Math.max(3.5,Math.min(14,re.back*i)),MyPC.save("back",re.back);return}re.view!=="first"&&(re.dist=Math.max(12,Math.min(70,re.dist*i)),MyPC.save("dist",re.dist))}}function bm(){Cn<0||(!Ka&&Ua&&Ua!==kt&&Vs(Ua),_t=Cn,Vl=performance.now(),Hn=!0,ii(),MyPC.announce?.(A("followingMe")))}function Ju(){let i=-1,e=1/0,t=-1,n=1/0,s=_t>=0?ni.get(_t)??-1:-1,r=s>=0?Math.hypot(Ht[s]-Tn,Xt[s]-En):-1;for(let o=0;o<dt;o++){if(zt[o]===-1||wt[o]!==Rt.Agent&&wt[o]!==Rt.Player||o===s||zt[o]===Cn)continue;let l=Math.hypot(Ht[o]-Tn,Xt[o]-En);l<e&&(e=l,i=o),l>r&&l<n&&(n=l,t=o)}let a=s>=0&&t>=0?t:i;if(a>=0&&(s<0||t>=0)){_t=zt[a],MyPC.announce?.(`${A("following")} #${_t&65535}`);return}Ie({t:_e.Who,map:kt})}var pM=0;function mM(i){let e=i.filter(n=>n[0]!==Cn);if(!e.length){xe(A("nobody"));return}let t=e[pM++%e.length];Tn=t[1],En=t[2],_t=t[0],Vl=performance.now(),Hn=!0,ii(),MyPC.announce?.(`${A("following")} #${_t&65535}`)}function gM(){let[i,e]=sd();if(i||e){_t=-1;let t=(re?.dist??24)/24*.35;Tn=Math.max(0,Math.min(Xa,Tn+i*t)),En=Math.max(0,Math.min(Ya,En+e*t))}if(_t>=0){let t=ni.get(_t);t!==void 0?(Tn=Ht[t],En=Xt[t],Vl=performance.now()):performance.now()-Vl>4e3&&(_t=-1)}}function xM(i){if(Ze=i,MyPC.save("how",i),Mm(),Ks(),i==="play")Ie({t:_e.Join}),vn=!1,Hn=!0;else{Ie({t:_e.Join,watch:!0}),Cn>=0&&window.setTimeout(bm,400),Ie({t:_e.Input,mx:0,my:0,run:!1,seq:++Jl});let e=yi();e>=0&&(Tn=Ht[e],En=Xt[e])}}async function ad(){let i=MyPC.text?.keyboard?await MyPC.text.keyboard({value:Qn,kind:"url",label:A("serverLabel"),ok:"OK"}):window.prompt(A("serverLabel"),Qn);i===null||!i.trim()||(Qn=i.trim(),MyPC.save("server",Qn),ls=0,Xr())}function vM(){Hi=null,MyPC.save("auth",null),ls=0,Xr()}function Mm(){MyPC.setMenu([{id:"game",label:A("gameMenuItem")},{id:"server",label:A("menuServer")}])}function Ks(){let i=r=>{if(hs){let o=xt.pad[r];return o===void 0?"":String(MyPC.gamepad?.label?.(o)??MyPC.gamepad?.name?.(o)??o)}let a=xt.remote[r];return a?Ia(a):""},e=(r,a)=>{let o=i(r);return o?`${o}: ${a}`:""},n=Ze==="play"&&mi!=="top"?`${A("hMove")}: ${hs?"stick":"\u2191 \u2193"} \xB7 ${A("hTurn")}: ${hs?"R stick":"\u2190 \u2192"}`:`${A("hMove")}: ${hs?"stick":"\u2190 \u2191 \u2192 \u2193"}`,s=Ze==="play"?[n,e("use",on("use").replace(/ \(.*\)$/,"")),e("talk",on("talk")),e("attack",on("attack")),e("aim",on("aim").replace(/ \(.*\)$/,"")),e("run",on("run")),e("wheel",A("aWheel").replace(/ \(.*\)$/,"")),e("build",on("build")),e("menu",on("menu"))]:[n,e("use",A("wFollow")),e("eat",A("wMap")),e("sleep",A("wCard")),e("menu",on("menu"))];hs||s.push(A("hintMenu")),jp.textContent=s.filter(Boolean).join(" \xB7 ")}function od(i){let e=On(),t=zn(),n=-1,s=i;for(let r=0;r<dt;r++){if(zt[r]===-1||wt[r]!==Rt.Agent)continue;let a=Math.hypot(Ht[r]-e,Xt[r]-t);a<s&&(s=a,n=zt[r])}return n}function zi(i,e){if(i==="run"){qs=e;return}if(i==="aim"){ld(e);return}if(!(!e||Ct!=="world")){switch(i){case"menu":ei();return;case"zoomIn":Yl(1/1.2);return;case"zoomOut":Yl(1.2);return;case"thoughts":kn=!kn,MyPC.save("thoughts",kn),kn||Gs.hide(),xe(`${A("sThoughts")}: ${A(kn?"on":"off")}`,1500);return;case"person":ei("person");return;case"camera":Ze==="play"&&tc();return;case"wheel":rd(!0,!1);return;case"build":Le?Wa():Ze==="play"&&ei("build");return}if(Ze==="watch"){i==="use"?Ju():i==="eat"?_m():i==="sleep"&&ei("person");return}if(_i()){if(i==="use"){Ie({t:_e.Do,a:"take"});return}if(i==="attack"){yM();return}if(i==="attackPerson"){if(!Ke?.pvp){xe(A("pvpNeed"),3e3);return}Ie({t:_e.Do,a:"hitperson",text:jl().toFixed(3)});return}if(i==="talk"){if(od(3.5)<0){xe(A("dNobodyNear"),2e3);return}if(Ie({t:_e.Do,a:"hold"}),st.left=st.right=st.up=st.down=!1,rt.left=rt.right=rt.up=rt.down=!1,qs=!1,bM()){wM();return}wm();return}Ie({t:_e.Do,a:i})}}}function yM(){let i=Ke?.inv??{},e=(i.bow??0)>0&&(i.arrows??0)>0,t=On(),n=zn(),s=jl();if(ds){if(!e){xe(A((i.bow??0)>0?"noArrows":"noBow"),3500);return}let a=gi>=0&&zt[gi]!==-1?Math.atan2(Xt[gi]-n,Ht[gi]-t):$s;Ie({t:_e.Do,a:"shoot",text:a.toFixed(3)});return}if(Yu(t,n,s,2.6,1.2)<0&&e){let a=Yu(t,n,s,20,.45);if(a>=0){Ie({t:_e.Do,a:"shoot",text:Math.atan2(Xt[a]-n,Ht[a]-t).toFixed(3)});return}}Ie({t:_e.Do,a:"hit",text:s.toFixed(3)})}function ld(i){if(i!==ds&&!(i&&(Ze!=="play"||!_i()||Y.open||Ct!=="world")))if(ds=i,i){$s=Number.isFinite(Ha)?Ha:jl();let e=Ke?.inv??{};(e.bow??0)<1?xe(A("noBow"),3500):(e.arrows??0)<1?xe(A("noArrows"),3500):xe(se("aimOn",$r("attack")),2500)}else gi=-1,re?.aim(!1)}function $r(i){if(hs){let t=xt.pad[i];return t===void 0?"":String(MyPC.gamepad?.label?.(t)??MyPC.gamepad?.name?.(t)??t)}let e=xt.remote[i];return e?Ia(e):""}var _M={},Fn=i=>i.charAt(0).toUpperCase()+i.slice(1);function Ot(i){let e=qi.includes(i)||i==="meat"?"r"+Fn(i):Rd.includes(i)?"an"+Fn(i):"x"+Fn(i),t=A(e);return t===e?i:t}function Oi(i){return Object.entries(i).map(([e,t])=>`${t} ${Ot(e)}`).join(" + ")}function Op(i){return i?Object.entries(i).filter(([,e])=>e>0).map(([e,t])=>`${t} ${Ot(e)}`).join(", "):""}function Na(i){return A("k"+Fn(i))}var Dl=!1;function bM(){try{return(MyPC.apiLevel??0)>=24&&!!MyPC.stt?.enabled?.()}catch{return!1}}var zp="",Hp=0;function ju(i){let e=(i??"").trim(),t=performance.now();e&&e===zp&&t-Hp<3e3||(zp=e,Hp=t,Qu(e))}function Qu(i){let e=(i??"").trim();Ie(e?{t:_e.Do,a:"talk",text:e.slice(0,300)}:{t:_e.Do,a:"talk"})}function wm(){if(!MyPC.text?.keyboard){Qu("");return}MyPC.text.keyboard({value:"",kind:"text",label:A("sayLabel"),ok:"OK"}).then(i=>Qu(i))}function MM(){let i=new Set;Bt?.name&&i.add(Bt.name);for(let[,e]of Hs??[])i.add(e);return[...i].slice(0,30)}function wM(){if(Dl){MyPC.stt.stop?.();return}Dl=!0,xe(A("listening"),0),MyPC.stt.listen({maxSeconds:10,hint:MM()}).then(i=>{ti.hidden=!0,ju(i.text)}).catch(i=>{ti.hidden=!0,!(i?.code==="nothing"||i?.code==="cancelled")&&wm()}).finally(()=>{Dl=!1})}function SM(i){if(Dl){ju(i.text);return}if(Ct!=="world"||!_i()||ut||od(2.8)<0){xe(`\u201C${i.text}\u201D`,2500);return}Ie({t:_e.Do,a:"hold"}),ju(i.text)}function AM(i){if(i.a==="build"&&Le&&(i.ok?Xs():(Le.sent=!1,setTimeout(Za,3200))),i.a==="build"){let l={tooFar:"dTooFar",someone:"dSomeone",doorBlocked:"dDoorBlocked"};if(l[i.code]){We.play("ui_error"),xe(A(l[i.code]),3e3);return}if(i.code==="needHut"){We.play("ui_error"),xe(se("needHut2",Oi(ia)),3500);return}}i.a==="shoot"?(We.play("bow_shot"),i.ok&&setTimeout(()=>We.play("arrow_hit"),180)):Ep[i.code]&&We.play(Ep[i.code],void 0,void 0,i.code==="zKilled"?.9:1),i.code==="chopped"&&i.got?.wood&&Math.random()<.25&&We.play("tree_fall",void 0,void 0,.6);let e=i;if(e.me&&($t=e.me,Y.open&&(Y.page==="me"||Y.page==="rules"||Y.page==="look"||Y.page==="family")&&Y.refresh(),!$t.chose&&Ze==="play"&&Ct==="world"&&!Y.open&&(Un.sex=$t.sex,Un.skin=$t.skin,ei("look"))),i.code==="mine")return;let t={looked:"looked",sexPregnant:"sexPregnant",autoOn:"autoOn",autoOff:"autoOff",ruleAdded:"ruleAdded",ruleRemoved:"ruleRemoved",rulesFull:"rulesFull",built:"built",needHut:"needHut",expecting:"expecting",tooFar:"tooFar",kinSet:"kinSet",kinRefused:"kinRefused",kinDropped:"kinDropped",kinAlready:"kinAlready",kinOnlyPlayers:"kinOnlyPlayers",kidFed:"kidFed",kidWater:"kidWater",kidUp:"kidUp",kidDown:"kidDown",kidBed:"kidBed",kidNone:"kidNone",kidNotMine:"kidNotMine",kidFar:"kidFar"};if(t[i.code]){xe(A(t[i.code]),3e3),i.code==="looked"&&Y.page==="look"&&Y.back();return}if(i.code==="sexWeek"){xe(se("sexWeek",String(e.days??7)),3500);return}if(i.code==="partners"){xe(se("partners",i.name??""),4e3);return}if(i.code==="kinAsked"||i.code==="kinYes"||i.code==="kinNo"){xe(se(i.code,i.name??""),4e3);return}if(i.code==="kinAskedYou"){xe(se("kinAskedYou",i.name??"",A("role"+String(i.role??"child"))),7e3),Ie({t:_e.Do,a:"mine"});return}if(i.code==="married"||i.code==="divorced"){xe(se(i.code,i.name??""),6e3),Y.open&&Y.page==="me"&&Ie({t:_e.Do,a:"mine"});return}if(i.code==="asking"){xe(se(e.what==="divorce"?"askingDivorce":"askingMarry",i.name??""),4e3);return}if(i.code==="why"){xe(e.why??"",4e3);return}if(i.code==="replays"){Bs=i.list,Y.page==="past"&&Y.refresh();return}if(i.code==="replay"){tM(i.rec);return}if(i.code==="noReplay"){xe(A("pastNone"),2500);return}if(i.code==="roster"){Hs=i.list??[],Y.page==="goto"&&Y.refresh();return}if(i.code==="tp"){jt=Tn=i.x??jt,Qt=En=i.y??Qt,Hn=!0,ii(),xe(se("dTp",i.name??""),3e3);return}let n=i,s=n.left!==void 0?" "+se("arrowsLeft",String(n.left)):"";if(i.code==="zHit"||i.code==="zKilled"){xe(A(i.code)+s,1800);return}if(i.code==="swing"){xe(A("dSwing"),1200);return}if(i.code==="pvp"){xe(A(e.on?"pvpNoteOn":"pvpNoteOff"),4e3);return}if(i.code==="pvpOff"){xe(A("pvpNeed"),3e3);return}if(i.code==="theirPvpOff"){xe(A("theirPvpOff"),2500);return}if(i.code==="pHit"){xe(se("pHit",String(e.dmg??0)),1500);return}if(i.code==="noBow"||i.code==="noArrows"){xe(A(i.code),3500);return}if(i.code==="missed"){xe(se("missed",String(n.left??0)),1800);return}if(i.code==="buildNeed"){xe(se("buildNeed",Oi(n.need??{})),3500);return}if(n.kept){xe(A("bKept"),3500);return}if(i.code==="aHit"){xe(se("aHit",Ot(i.item??""))+s,1500);return}if(i.code==="aKilled"){xe(se("aKilled",Ot(i.item??""),Op(n.got)),3500);return}if(i.code==="mined"&&!Object.keys(n.got??{}).length){xe(A("dHard"),1200);return}if(i.code==="chopped"||i.code==="mined"){xe(se("dGot",Op(n.got)),1500);return}if(i.code==="equipped"){xe(A("dEquipped"),1500);return}if(i.code==="upgraded"){xe(se("dUpgraded",Fn(Ot(n.item??"")),`+${n.lv??0} ${A("qual"+(n.q??0))}`),3e3);return}if(i.code==="upNeed"){xe(se("dUpNeed",Oi(n.need??{})),3500);return}if(i.code==="needLevel"){xe(se("dNeedLevel",String(n.need?.level??"")),3e3);return}if(i.code==="maxLevel"||i.code==="maxQuality"||i.code==="notCarried"){xe(A(i.code==="maxLevel"?"dMaxLevel":i.code==="maxQuality"?"dMaxQuality":"dNotCarried"),2500);return}if(i.code==="crafted"){td.clear();for(let l of Object.keys(qt))delete qt[l];xe(se("dCrafted",Ot(i.item??"")),2500),Y.refresh();return}if(i.code==="placed"){xe(se("dPlaced",Ot(i.item??"")),2500);return}let r={noRecipe:"dNoRecipe",noMat:"dNoMat",noRoom:"dNoRoom",noItem:"dNoItem",tooThick:"dTooThick"};if(r[i.code]){xe(A(r[i.code]),2800);return}if(i.code==="wait")return;if(i.code==="full"&&i.a==="craft"){xe(A("dBagFull"),2500);return}let o={drank:"dDrank",picked:"dPicked",ate:"dAte",sleep:"dSleep",wake:"dWake",noWater:"dNoWater",nothing:"dNothing",noFood:"dNoFood",full:"dFull",talk:"dTalk",nobody:"dNobody"}[i.code];o&&xe(o==="dPicked"?se("dPicked",_M[i.item??""]??i.item??""):A(o),2500)}var ed="";function qa(){let i="";Ct==="world"&&!Y.open&&(Ze==="play"&&Ke?i=`<div class="pn">${Ge(ql())}</div><div class="pbars">${An(A("nFood"),Ke.hunger)}${An(A("nWater"),Ke.thirst)}${An(A("nRest"),Ke.tired)}${Ke.hp!==void 0&&Ke.hp<100?An(A("nHp"),100-Ke.hp):""}</div><div class="pa">${Ke.asleep?fs(5):""}${Ke.carry?(Ke.asleep?" \xB7 ":"")+se("carry",String(Ke.carry)):""}</div>`:Ze==="watch"&&_t>=0&&Bt&&Bt.id===_t&&(i=Lu(Bt,fs,!1))),i!==ed&&(ed=i,zu.innerHTML=i,zu.hidden=!i)}function cd(){return Ze==="watch"?_t:od(10)}function Tl(i){return A(i?"on":"off")}function TM(i){let e=xt.pad[i],t=xt.remote[i];return`${e===void 0?A("cNone"):String(MyPC.gamepad?.label?.(e)??MyPC.gamepad?.name?.(e)??e)} \xB7 ${t?Ia(t):A("cNone")}`}function EM(i){let e=[];switch(i){case"inv":return{id:i,title:A("invTitle"),rows:e,big:!0,html:td.html(),grid:td};case"gear":return{id:i,title:A("gearTitle"),rows:e,big:!0,html:Kl.html(),grid:Kl};case"root":return e.push({id:"resume",label:A("mResume")}),Ze==="play"&&e.push({id:"me",label:A("mMe"),sub:!0},{id:"actions",label:A("mActions"),sub:!0},{id:"build",label:A("bTitle"),sub:!0},{id:"inv",label:A("invTitle"),sub:!0},{id:"gear",label:A("mGear"),sub:!0},{id:"fight",label:A("mFight"),sub:!0},{id:"goto",label:A("mGoTo"),sub:!0}),cd()>=0&&e.push({id:"person",label:Ze==="play"?A("mNearby"):A("mPerson"),sub:!0}),Ze==="watch"&&e.push(...Cn>=0?[{id:"mine",label:A("mFollowMe")}]:[],{id:"next",label:A("mNextPerson")},{id:"map",label:A("mNextMap")}),e.push({id:"past",label:A("mPast"),sub:!0}),e.push({id:"how",label:A(Ze==="play"?"mWatch":"mPlay")}),e.push({id:"settings",label:A("mSettings"),sub:!0},{id:"controls",label:A("mControls"),sub:!0}),{id:i,title:A("mTitle"),rows:e};case"build":{let t=Ke?.inv??{},n=Object.entries(ia).every(([r,a])=>(t[r]??0)>=a);e.push({id:"b:hut",label:se("bHut2",Oi(ia)),value:n?A("cHave"):A("bMissing"),dim:!n});for(let r of Xi){let a=$i.find(h=>h.what===r),o=t[r]??0,l=!!a&&Object.entries(a.need).every(([h,c])=>(t[h]??0)>=c);e.push({id:"b:"+r,label:`${Fn(Ot(r))}${a?" ("+Oi(a.need)+")":""}`,value:o?se("bInBag",String(o)):l?A("cHave"):A("bMissing"),dim:!o&&!l})}let s=qi.filter(r=>(t[r]??0)>0).map(r=>`${t[r]} ${Ot(r)}`).join(", ");return{id:i,title:A("bTitle"),rows:e,wide:!0,html:`<p>${Ge(A("bHelp2"))}</p>${s?`<p class="dim">${Ge(A("fHave"))}: ${Ge(s)}</p>`:""}`}}case"fight":{let t=o=>{let l=$i.find(h=>h.what===o);return l?Oi(l.need):"\u2014"},n=Ke?.inv??{},s=[A("fightHelp"),se("fFists","15")];for(let[o,l]of Object.entries(so))s.push(se("fWeapon",Fn(Ot(o)),String(l),t(o)));s.push(se("fBow",t("bow"),t("arrows")),A("fArmour"),A("fTips"),A("pvpHelp"));let r=`${on("attack")}: <b>${Ge($r("attack")||A("cNone"))}</b> \xB7 ${Ge(on("aim"))}: <b>${Ge($r("aim")||A("cNone"))}</b>`,a=["sword","spear","axe","bow","arrows","clothes","armor","helmet"].filter(o=>(n[o]??0)>0).map(o=>`${n[o]} ${Ot(o)}`).join(", ");return e.push({id:"pvp",label:A("mPvp"),value:A(Ke?.pvp?"pvpOnW":"pvpOffW")},{id:"craft",label:A("mCraft"),sub:!0},{id:"back",label:A("mBack")}),{id:i,title:A("mFight"),rows:e,wide:!0,html:`<p>${r}</p>${s.map(o=>`<p>${Ge(o)}</p>`).join("")}${a?`<p class="dim">${Ge(A("fHave"))}: ${Ge(a)}</p>`:""}`}}case"actions":for(let t of["use","talk","attack","attackPerson","drink","eat","pickup","sleep"])e.push({id:t,label:on(t)});return{id:i,title:A("mActions"),rows:e,html:Ke?`<div class="pbars">${An(A("nFood"),Ke.hunger)}${An(A("nWater"),Ke.thirst)}${An(A("nRest"),Ke.tired)}</div>`:void 0};case"past":for(let t of Bs??[])e.push({id:"r"+t.id,label:`${Pu(t.start,A("day"))} \xB7 ${t.people.join(", ")||"\u2014"}`,value:`${t.zombies} ${A("pastZ")} \xB7 ${t.secs} s${t.deaths.length?" \xB7 \u271D "+t.deaths.join(", "):t.killed?" \xB7 "+se("pastKilled",String(t.killed)):""}`});return Bs&&!Bs.length&&e.push({id:"back",label:A("mBack")}),{id:i,title:A("mPast"),rows:e,wide:!0,text:Bs?Bs.length?A("pastHelp"):A("pastNone"):"\u2026"};case"bag":{let t=Ke?.inv??{},n=Object.entries(t).filter(([,r])=>r>0),s=(n.length?`<div class="bag">${n.map(([r,a])=>`<span class="bi"><b>${a}</b> ${Ge(Ot(r))}</span>`).join("")}</div>`:`<p>${Ge(A("bagEmpty"))}</p>`)+`<p class="dim">${Ke?.weapon?Ge(se("cWeapon",Ot(Ke.weapon)))+" \xB7 ":""}${Ge(se("cDefence",String(Ke?.def??0)))}${Ke?.carry?" \xB7 "+Ge(se("carry",String(Ke.carry))):""}</p>`;e.push({id:"craft",label:A("mCraft"),sub:!0},{id:"guide",label:A("mGuide"),sub:!0});for(let r of Xi)(t[r]??0)>0&&e.push({id:"pl:"+r,label:se("cPut",Ot(r)),value:String(t[r])});return{id:i,title:A("mBag"),rows:e,html:s,wide:!0}}case"craft":for(let t of ri)e.push({id:"c:"+t,label:Na(t),sub:!0});return{id:i,title:A("mCraft"),rows:e,text:A("catHelp")};case"cat":{let t=Ke?.inv??{};for(let a of qi){let o=t[a]??0;!o&&!qt[a]||e.push({id:"r:"+a,label:Fn(Ot(a)),value:`${qt[a]??0} / ${o}`})}let n=js(xn,qt),s=Object.entries(qt).filter(([,a])=>a>0);e.push({id:"make",label:`${A("cMake")}: ${n?Fn(Ot(n.what))+(n.n&&n.n>1?" x"+n.n:""):A("cNoRecipe")}`,dim:!n}),e.push({id:"clear",label:A("cClear")},{id:"guide",label:A("mGuide"),sub:!0});let r=`<p>${Ge(s.length?se("cIn",Oi(qt)):A("cNothingIn"))}</p><p class="dim">${Ge(A("catHelp"))}</p>`;return{id:i,title:Na(xn),rows:e,html:r}}case"guide":{let t=Ke?.inv??{};return $i.forEach((n,s)=>{if(xn&&n.cat!==xn)return;let r=Object.entries(n.need).every(([a,o])=>(t[a]??0)>=o);e.push({id:"g:"+s,label:`${xn?"":Na(n.cat)+" \xB7 "}${Fn(Ot(n.what))}${n.n&&n.n>1?" x"+n.n:""}`,value:`${Oi(n.need)}${r?" "+A("cHave"):""}`})}),{id:i,title:xn?`${A("mGuide")} \xB7 ${Na(xn)}`:A("mGuide"),rows:e,wide:!0,text:A("guideHelp")}}case"goto":for(let[t,n,s]of Hs??[])e.push({id:"p"+t,label:n,value:s});return Hs&&!Hs.length&&e.push({id:"back",label:A("mBack")}),{id:i,title:A("mGoTo"),rows:e,text:Hs?A("mGoToHelp"):"\u2026"};case"me":{let t=$t;if(!t)return{id:i,title:A("meTitle"),rows:[{id:"back",label:A("mBack")}],text:"\u2026"};let n=t.traits,s=`<div class="pm"><b>${Ge(t.name)}</b> \xB7 ${Ge(A(t.sex==="f"?"lookWoman":"lookMan"))} \xB7 ${Ge(se("meHp",String(t.hp)))}</div><div class="pm">${se("pLevel",String(t.level),String(t.xp))}</div><div class="bp"><i style="width:${Math.max(4,Math.min(100,(t.xp-50*t.level*t.level)/Math.max(1,50*(t.level+1)**2-50*t.level*t.level)*100))}%"></i></div>`+(t.goal?`<div class="pm">${A("pGoal")}: <b>${Ge(t.goal.text)}</b> \xB7 ${Math.min(t.goal.k+1,t.goal.n)}/${t.goal.n}</div><div class="bp${t.goal.from!=="myself"?" ord":""}"><i style="width:${Math.max(6,t.goal.pct)}%"></i></div>`:"")+`<div class="pm">${A("mePartner")}: <b>${Ge(t.partner?.name??A("meNone"))}</b></div><div class="pm">${A("meChildren")}: <b>${t.children.length?t.children.map(r=>`${Ge(r.name)} (${r.age})`).join(", "):Ge(A("meNone"))}</b></div>`+(t.expecting>=0?`<div class="pm">${Ge(se("meExpecting",String(t.expecting)))}</div>`:"")+`<div class="pm dim">${Ge(se("meTraits",String(n.strength??0),String(n.speed??0),String(n.intelligence??0),String(n.courage??0),String(n.empathy??0)))}</div>`+(t.goals.length?`<div class="pm dim">${A("meGoals")}: ${t.goals.map(r=>`${r.ok?"\u2713":"\u2717"} ${Ge(r.text)} (+${r.xp})`).join(" \xB7 ")}</div>`:"");return e.push({id:"family",label:A("famTitle"),value:t.asks?.length?`${t.asks.length} !`:t.children.some(r=>r.stage==="baby"||r.stage==="toddler")?"\u2665":"",sub:!0}),e.push({id:"look",label:A("lookTitle"),sub:!0},{id:"auto",label:A("autoRow"),value:Tl(t.auto)},{id:"rules",label:A("myRules"),value:`${t.rules.length} / ${t.max}`,sub:!0},{id:"hut",label:se("meHut2",Oi(ia))}),{id:i,title:A("meTitle"),rows:e,html:s,wide:!0}}case"family":{let t=$t;if(!t)return{id:i,title:A("famTitle"),rows:[{id:"back",label:A("mBack")}],text:"\u2026"};let n=r=>String(Math.max(0,100-Math.round(r))),s="";for(let r of t.asks??[])e.push({id:`ay:${r.from}`,label:se("famAskFrom",r.name,A("role"+r.role)),value:A("famYes")},{id:`an:${r.from}`,label:"   "+A("famNo"),value:"\u2715"});for(let r of t.children){let a=r.stage==="baby"||r.stage==="toddler";s+=`<div class="pm"><b>${Ge(r.name)}</b> \xB7 ${Ge(A(Iu[r.stage]??"stChild"))} (${Math.floor(r.age)})${r.carer?" \xB7 "+Ge(se("famLooked",r.carer)):""}</div><div class="pm dim">${Ge(se("famNeeds",n(r.hunger),n(r.thirst),n(r.tired)))}${a&&!r.near?" \xB7 "+Ge(A("famFar")):""}</div><div class="bp"><i style="width:${Math.max(4,100-Math.max(r.hunger,r.thirst))}%"></i></div>`,a&&e.push({id:`kf:${r.id}`,label:se("famFeed",r.name),dim:!r.near},{id:`kw:${r.id}`,label:se("famWater",r.name),dim:!r.near},{id:`kc:${r.id}`,label:se(r.held?"famDown":"famCarry",r.name),dim:!r.near&&!r.held},{id:`kb:${r.id}`,label:se("famBed",r.name),dim:!r.near})}if(t.children.length||(s+=`<p>${Ge(A("famNone"))}</p>`),t.family?.length){s+=`<div class="pm">${Ge(A("famChosen"))}: ${t.family.map(r=>`<b>${Ge(r.name)}</b> (${Ge(r.rel||A("role"+r.role))})`).join(", ")}</div>`;for(let r of t.family)e.push({id:`kd:${r.id}`,label:se("famDrop",r.rel||A("role"+r.role))+` \xB7 ${r.name}`,value:"\u2715"})}return e.length||e.push({id:"back",label:A("mBack")}),{id:i,title:A("famTitle"),rows:e,html:s,wide:!0,text:A("famHelp")}}case"look":{e.push({id:"f",label:A("lookWoman"),value:Un.sex==="f"?"\u25CF":""},{id:"m",label:A("lookMan"),value:Un.sex==="m"?"\u25CF":""});for(let n=0;n<5;n++)e.push({id:"s"+n,label:`${A("lookSkin")} ${n+1}`,value:Un.skin===n?"\u25CF":""});e.push({id:"save",label:A("lookSave")});let t=Wl.map((n,s)=>`<span class="sw${Un.skin===s?" on":""}" style="background:#${n.getHexString()}"></span>`).join("");return{id:i,title:A("lookTitle"),rows:e,html:`<p>${Ge($t&&!$t.chose?A("lookHelp"):A("lookSexNote"))}</p><div class="sws">${t}</div>`}}case"rules":return($t?.rules??[]).forEach((t,n)=>e.push({id:"r"+n,label:t,value:"\u2715"})),($t?.rules.length??0)<($t?.max??5)&&e.push({id:"add",label:A("ruleAdd")}),{id:i,title:A("myRules"),rows:e,wide:!0,text:`${se("ruleHelp",String($t?.max??5))} ${A("autoHelp")}`};case"person":return e.push({id:"back",label:A("mBack")}),Ze==="play"&&Bt&&Bt.id===qr&&($t?.partner?.id===Bt.id?e.push({id:"child",label:A("tryChild")},{id:"divorce",label:A("askDivorce")}):$t?.partner||e.push({id:"court",label:A("askPartner")},{id:"marry",label:A("askMarry")}),Bt.isPlayer&&$t?.partner?.id!==Bt.id&&!$t?.family?.some(t=>t.id===Bt.id)&&e.push({id:"kin:child",label:A("askChild")},{id:"kin:sibling",label:A("askSibling")},{id:"kin:parent",label:A("askParent")})),Ze==="watch"&&e.push({id:"next",label:A("mNextPerson")}),{id:i,title:Bt?.name??A("mPerson"),rows:e,wide:!0,html:Bt&&Bt.id===qr?Lu(Bt,fs,!0):"\u2026"};case"settings":return Va&&e.push({id:"thoughts",label:A("sThoughts"),value:Tl(kn)}),Ze==="play"&&e.push({id:"cam",label:A("sCamera"),value:ym(mi)}),e.push({id:"gfx",label:A("gTitle"),sub:!0},{id:"snd",label:A("sndTitle"),sub:!0}),e.push({id:"zin",label:A("aZoomIn")},{id:"zout",label:A("aZoomOut")},{id:"server",label:A("sServer"),value:Qn},{id:"unpair",label:A("sUnpair")}),{id:i,title:A("mSettings"),rows:e,text:Va?void 0:A("sThoughtsOnly")};case"snd":{let t=s=>`${Math.round(s*100)} %`,n=We.prefs;return e.push({id:"on",label:A("sndOn"),value:Tl(n.on)},{id:"master",label:A("sndMaster"),value:t(n.master),dim:!n.on},{id:"fx",label:A("sndFx"),value:t(n.fx),dim:!n.on},{id:"amb",label:A("sndAmb"),value:t(n.amb),dim:!n.on},{id:"ui",label:A("sndUi"),value:t(n.ui),dim:!n.on}),{id:i,title:A("sndTitle"),rows:e,text:A("sndHelp")}}case"gfx":return e.push({id:"q",label:A("gQuality"),value:A(pt.q==="auto"?"gAuto":pt.q==="low"?"gLow":pt.q==="mid"?"gMid":"gHigh")+(pt.q!=="auto"&&pt.q!==Vi?" *":"")},{id:"fog",label:A("gFog"),value:A(["gOff","gLight","gNormal","gThick"][pt.fog]??"gNormal")},{id:"dist",label:A("gDist"),value:A(["gNear","gNormal","gFar"][pt.dist]??"gNormal")},{id:"fps",label:A("gFps"),value:Tl(pt.fps)}),pt.q!=="auto"&&pt.q!==Vi&&e.push({id:"restart",label:A("gRestart")}),{id:i,title:A("gTitle"),rows:e,text:A("gHelp")};case"controls":for(let t of Nr)e.push({id:t,label:on(t),value:TM(t)});return e.push({id:"reset",label:A("cReset")}),{id:i,title:A("mControls"),rows:e,text:`${A("cHelp")} ${A("cWatchNote")}`}}return{id:i,title:"",rows:e}}function CM(i,e){if(i==="root")e==="resume"?Y.close():e==="actions"||e==="settings"||e==="controls"?Y.push(e):e==="past"?(Bs=null,Ie({t:_e.Do,a:"replays"}),Y.push("past")):e==="bag"||e==="build"||e==="fight"||e==="inv"||e==="gear"?Y.push(e):e==="me"?(Ie({t:_e.Do,a:"mine"}),Y.push("me")):e==="goto"?(Hs=null,Ie({t:_e.Do,a:"roster"}),Y.push("goto")):e==="person"?($a(cd(),!0),Y.push("person")):e==="mine"?(Y.close(),bm()):e==="next"?(Y.close(),Ju()):e==="map"?(Y.close(),_m()):e==="how"&&(Y.close(),xM(Ze==="play"?"watch":"play"));else if(i==="actions")Y.close(),zi(e,!0);else if(i==="build")$l(e.slice(2));else if(i==="fight")e==="back"?Y.back():e==="craft"?Y.push("inv"):e==="pvp"&&Ie({t:_e.Do,a:"pvp",text:Ke?.pvp?"0":"1"});else if(i==="past")e==="back"?Y.back():(Y.close(),xe("\u2026",1500),Ie({t:_e.Do,a:"replay",text:e.slice(1)}));else if(i==="bag")e==="craft"?(xn="",Y.push("craft")):e==="guide"?(xn="",Y.push("guide")):e.startsWith("pl:")&&(Y.close(),Ie({t:_e.Do,a:"place",text:e.slice(3)}));else if(i==="craft"){xn=e.slice(2);for(let t of Object.keys(qt))delete qt[t];Y.push("cat")}else if(i==="cat"){if(e.startsWith("r:")){let t=e.slice(2),n=Ke?.inv?.[t]??0;qt[t]=(qt[t]??0)+1>Math.min(n,4)?0:(qt[t]??0)+1,Y.refresh()}else if(e==="clear"){for(let t of Object.keys(qt))delete qt[t];Y.refresh()}else if(e==="guide")Y.push("guide");else if(e==="make"){let t=Object.entries(qt).filter(([,n])=>n>0).map(([n,s])=>`${n}=${s}`).join(",");if(!js(xn,qt)){xe(A("dNoRecipe"),2500);return}Ie({t:_e.Do,a:"craft",text:`${xn}:${t}`})}}else if(i==="guide"){let t=$i[Number(e.slice(2))];if(!t)return;for(let n of Object.keys(qt))delete qt[n];for(let[n,s]of Object.entries(t.need))qt[n]=s;xn===t.cat?Y.back():(xn=t.cat,Y.push("cat"))}else if(i==="goto")e==="back"?Y.back():(Y.close(),Ie({t:_e.Do,a:"tp",text:e.slice(1)}));else if(i==="me")e==="back"?Y.back():e==="look"?(Un.sex=$t?.sex??"m",Un.skin=$t?.skin??1,Y.push("look")):e==="auto"?Ie({t:_e.Do,a:"auto",text:$t?.auto?"0":"1"}):e==="rules"?Y.push("rules"):e==="family"?(Ie({t:_e.Do,a:"mine"}),Y.push("family")):e==="hut"&&$l("hut");else if(i==="family"){if(e==="back"){Y.back();return}let[t,n]=e.split(":");if(t==="ay"||t==="an")Ie({t:_e.Do,a:"kinAnswer",text:`${n}:${t==="ay"?1:0}`});else if(t==="kd")Ie({t:_e.Do,a:"kinDrop",text:n});else{let s={kf:"feed",kw:"water",kc:"carry",kb:"bed"}[t];s&&Ie({t:_e.Do,a:"care",text:`${s}:${n}`})}}else if(i==="look")e==="f"||e==="m"?(Un.sex=e,Y.refresh()):e==="save"?Ie({t:_e.Do,a:"look",text:`${Un.sex}:${Un.skin}`}):e.startsWith("s")&&(Un.skin=Number(e.slice(1)),Y.refresh());else if(i==="rules")if(e==="add"){if(!MyPC.text?.keyboard)return;MyPC.text.keyboard({value:"",kind:"text",label:A("ruleLabel"),ok:"OK"}).then(t=>{t&&t.trim()&&Ie({t:_e.Do,a:"ruleAdd",text:t.trim().slice(0,200)})})}else e.startsWith("r")&&Ie({t:_e.Do,a:"ruleDel",text:e.slice(1)});else if(i==="person")e==="back"?Y.back():e==="court"?Ie({t:_e.Do,a:"court",text:String(Bt?.id??-1)}):e==="marry"||e==="divorce"?(Ie({t:_e.Do,a:e,text:String(Bt?.id??-1)}),Y.close()):e==="child"?Ie({t:_e.Do,a:"child"}):e.startsWith("kin:")?Ie({t:_e.Do,a:"kinAsk",text:`${Bt?.id??-1}:${e.slice(4)}`}):e==="next"&&(Ju(),window.setTimeout(()=>{$a(_t,!0),Y.refresh()},300));else if(i==="settings")e==="thoughts"?(kn=!kn,MyPC.save("thoughts",kn),kn||Gs.hide(),Y.refresh()):e==="cam"?(tc(),Y.refresh()):e==="gfx"||e==="snd"?Y.push(e):e==="zin"?Yl(1/1.2):e==="zout"?Yl(1.2):e==="server"?(Y.close(),ad()):e==="unpair"&&(Y.close(),vM());else if(i==="snd"){let t=We.prefs;if(e==="on")t.on=!t.on;else if(e==="master"||e==="fx"||e==="amb"||e==="ui"){let n=Math.round(t[e]*10);t[e]=(n>=10?0:n+1)/10}We.apply(),MyPC.save("sound",t),Y.refresh(),e!=="on"&&We.play(e==="ui"?"ui_ok":e==="amb"?"bird":"hit")}else if(i==="gfx"){if(e==="q"){let t=["auto","low","mid","high"];pt.q=t[(t.indexOf(pt.q)+1)%t.length]}else if(e==="fog")pt.fog=(pt.fog+1)%4;else if(e==="dist")pt.dist=(pt.dist+1)%3;else if(e==="fps")pt.fps=!pt.fps,Cl=0,Rl=performance.now(),Ys.textContent="";else if(e==="restart"){MyPC.save("gfx",pt),location.reload();return}MyPC.save("gfx",pt),Qp(),Y.refresh()}else if(i==="controls"){if(e==="reset"){xt=gl(Ur),MyPC.save("binds",xt),Y.refresh(),Ks();return}xi=e,xe(se("cPress",on(xi)),0)}}var Sm={inv:()=>Ke?.inv??{},gear:()=>Ke?.gear,thing:i=>Fn(Ot(i)),catName:i=>Na(i),send:(i,e)=>Ie({t:_e.Do,a:i,text:e}),note:(i,e)=>xe(i,e),close:()=>Y.close(),look:()=>{let i=yi();return i>=0&&zs[i]>0?fm(!0,zs[i]):id}},td=new yl(Sm),Kl=new _l(Sm),Y=new fl(EM,CM,()=>{xi=null,ti.hidden=!0,qa(),MyPC.back?.(!1)});Y.onSound=i=>We.play(i);var Gs=new pl(8);function ei(i="root"){if(Ct==="world"){if(vt.close(),ld(!1),Xs(),st.left=st.right=st.up=st.down=!1,rt.left=rt.right=rt.up=rt.down=!1,qs=!1,i==="person"){let e=cd();if(e<0){xe(A("nobody"),2e3);return}$a(e,!0)}Y.show("root"),i!=="root"&&Y.push(i),MyPC.back?.(!0),qa()}}function $a(i,e=!1){i<0||(i!==qr&&(qr=i,Bt=null),(e||performance.now()-Lp>1e3)&&(Lp=performance.now(),Ie({t:_e.Info,id:i})))}function Am(i,e){let t=xi;xi=null;let n=i==="pad"?xt.pad:xt.remote;for(let r of Nr)n[r]===e&&delete n[r];n[t]=e,MyPC.save("binds",xt);let s=i==="pad"?String(MyPC.gamepad?.label?.(e)??e):Ia(e);xe(se("cSet",on(t),s),2500),Y.refresh(),Ks()}var Zl=1e3/60,Vr=0,Fr=0,Nl=0,Vp=0,Gp=0,Wp=0,qp=!1,Hn=!0;function RM(i){if(Ct==="world"){if(ut){ut.update(Zl/1e3);return}vt.open&&vt.hold&&MyPC.gamepad&&vt.aim(MyPC.gamepad.axis(0),MyPC.gamepad.axis(1)),Ze==="play"?fM(Zl/1e3,i):gM()}}function PM(i,e){if(Ct!=="world"||!re)return;if(Qb(),We.lx=On(),We.ly=zn(),We.yaw=vi,We.topView=re.view==="top",We.tick(e),iM(i),Xu&&_i()&&vn){Xu=!1;let u=["use","talk","attack","aim","build"].map(d=>`${$r(d)}: ${on(d).replace(/ \(.*\)$/,"")}`);xe(se("bindsNew",u.join(" \xB7 ")),9e3)}let t=On(),n=zn();re.view=ut||!_i()||!vn?"top":mi,re.yaw=vi,re.follow(t,n,e,Hn),Hn=!1;let s=Oa+(i-za)/1e3*Gr*Wr;re.setHour(((s/3600+8)%24+24)%24,i/1e3);let r=Math.min(1.25,(i-Hl)/$u),a=re.people,o=_i()&&vn?yi():-1,l=i/1e3,h=re.view==="top"?(re.dist*1.6+8)*re.distK:re.sight+4,c=re.view==="first";if(Ku++,a.begin(),re.beginShots(),re.beginItems(),re.animals.begin(),ut){ut.draw(a,e,fs),re.dist+=(Math.max(16,Math.min(42,ut.span*1.1+10))-re.dist)*Math.min(1,e*2),a.end(),re.endShots(),re.endItems(),re.animals.end(),re.render(),Gs.hide();return}for(let u=0;u<dt;u++){if(zt[u]===-1)continue;let d=Ol[u]+(Ht[u]-Ol[u])*r,m=zl[u]+(Xt[u]-zl[u])*r;if(u===o&&(d=jt,m=Qt),Math.abs(d-t)>h||Math.abs(m-n)>h)continue;if(wt[u]===Rt.Projectile){re.shot(d,m);continue}if(wt[u]===Rt.Item){re.item(d,m,Bl[u],zt[u]);continue}if(wt[u]!==Rt.Agent&&wt[u]!==Rt.Player&&wt[u]!==Rt.Threat&&wt[u]!==Rt.Animal)continue;let g=d-Wu[u],x=m-qu[u],p=Math.hypot(g,x);Wu[u]=d,qu[u]=m;let f=e>0?Math.min(6,p/e):0;if(kr[u]=kr[u]+(f-kr[u])*Math.min(1,e*10),p>.004){let T=Math.atan2(g,x)-cs[u];T=Math.atan2(Math.sin(T),Math.cos(T)),cs[u]=cs[u]+T*Math.min(1,e*12)}if(Da[u]=(Da[u]+p*4.2)%(Math.PI*2),lm[u]=d,cm[u]=m,hm[u]=Ku,(wt[u]===Rt.Animal||wt[u]===Rt.Threat)&&!(Br[u]&ms.Dead)){let R=zt[u]&16383;if(!wl[R])wl[R]=i+1500+Math.random()*6e3;else if(i>wl[R]){let T=wt[u]===Rt.Threat;wl[R]=i+(T?5e3+Math.random()*7e3:9e3+Math.random()*14e3),We.play(T?Math.hypot(d-t,m-n)<2.5?"zombie_attack":"zombie_groan":kb[zs[u]]??"bird",d,m,T?.9:.7)}}if(wt[u]===Rt.Animal){re.animals.add(zs[u],d,m,cs[u],Da[u]*1.4,Math.min(1,kr[u]/1.6));continue}if(c&&u===o)continue;let w=(Br[u]&(ms.Sleeping|ms.Dead))!==0,S=wt[u]===Rt.Threat,v=u===o||zt[u]===Cn,I=S?um:zs[u]>0&&(wt[u]===Rt.Player||wt[u]===Rt.Agent)?fm(v,zs[u]):v?id:wt[u]===Rt.Player?dm:sm[u];a.add(d,m,cs[u],Da[u],Math.min(1,kr[u]/(S?1.2:2.2)),I,w,Br[u]&ms.Small?.42:Br[u]&ms.Child?.62:1,S,S?0:nm[u],(i-im[u])/1e3),wt[u]===Rt.Player&&!(u===o&&re.view!=="top")?a.marker(d,m,l,zt[u]===Cn?Dp:Wb):zt[u]===_t&&a.marker(d,m,l,Dp)}if(a.end(),re.endShots(),re.endItems(),re.animals.end(),ds&&o>=0){let u=gi>=0&&zt[gi]!==-1?gi:-1,d=u>=0?Math.atan2(Xt[u]-Qt,Ht[u]-jt):$s;re.aim(!0,jt,Qt,d,u>=0?Math.max(1,Math.hypot(Ht[u]-jt,Xt[u]-Qt)-.6):22,u>=0?Ht[u]:NaN,u>=0?Xt[u]:NaN)}else re.aim(!1);uM(),re.render(),Va&&kn&&!Y.open&&i-am<4e3?Gs.draw(IM,LM,t,n,fs):Gs.hide()}function IM(i,e){let t=ni.get(i);return t===void 0||hm[t]!==Ku?!1:(e.x=lm[t],e.y=cm[t],!0)}var LM=(i,e,t)=>!!re&&re.project(i,2.2,e,t),$p=0;function Tm(i){Vr=requestAnimationFrame(Tm),Y.open&&Y.page==="family"&&i-$p>2e3&&($p=i,Ie({t:_e.Do,a:"mine"})),Fr||(Fr=i);let e=Math.min(.1,(i-Fr)/1e3);for(Nl+=Math.min(250,i-Fr),Fr=i;Nl>=Zl;)RM(i),Nl-=Zl;Y.open&&Y.page==="gear"?Kl.draw(i):Kl.stop(),(!Y.open||i-Ml>100)&&(PM(i,i-Ml>200?e:Math.min(.1,(i-Ml)/1e3)),Ml=i,Cl++),pt.fps&&i-Rl>500&&(Ys.textContent=`${Math.round(Cl*1e3/(i-Rl))} fps \xB7 ${Math.round(Gl)} ms`,Cl=0,Rl=i),i-Vp>250&&(Vp=i,ii()),i-Wp>3e3&&(Wp=i,Ie({t:_e.Ping,c:i})),i-Gp>500&&Ct==="world"&&(Gp=i,DM(i),Ze==="watch"&&_t>=0?$a(_t):Y.open&&Y.page==="person"&&$a(qr),qa())}var Xp="";function DM(i){let e=Oa+(i-za)/1e3*Gr*Wr,t=Math.floor((e/3600+8)/24)+1,n=Math.floor((e/3600+8)%24),s=Math.floor(e/60%60),r=_t>=0?ni.get(_t):void 0,a=Ze==="play"?ql():_t>=0?`${A("following")} #${_t&65535}${r!==void 0?" \xB7 "+fs(Bl[r]):""}`:A("free"),o=`${Ga(kt)} \xB7 ${A("day")} ${t} ${String(n).padStart(2,"0")}:${String(s).padStart(2,"0")} \xB7 ${tm} ${A("agents")} \xB7 ${a}`;if(o!==Xp&&(Xp=o,Jp.textContent=o),Ka&&Ze==="play"){let l=Math.max(0,Math.ceil((rm-e)/Math.max(.01,Gr*Wr)));ti.textContent=`${se("travelling",Ga(Ua))} ${l} s`,ti.hidden=!1}}function nd(){let i=Math.min(1,Math.min(1920/innerWidth,1080/innerHeight,window.devicePixelRatio||1))*(Vi==="low"?.6:Vi==="mid"?.8:1);re?.resize(Math.round(innerWidth*i),Math.round(innerHeight*i))}function Yp(){Vr||(Fr=0,Nl=0,Vr=requestAnimationFrame(Tm))}function Kp(){Vr&&cancelAnimationFrame(Vr),Vr=0,st.left=st.right=st.up=st.down=!1,rt.left=rt.right=rt.up=rt.down=!1,qs=!1,Ze==="play"&&Ie({t:_e.Input,mx:0,my:0,run:!1,seq:++Jl}),Pl=Il=0}var Em={left:1,right:1,up:1,down:1};function Cm(i,e,t,n=!1){if(ut&&!Y.open){e&&(i==="left"||i==="right"?ut.seek(i==="left"?-5:5):t||ut.faster(i==="up"));return}if(Y.open){e&&Y.input(i);return}if(vt.open){e&&!t&&vt.step(i);return}t||(n?rt[i]=e:st[i]=e)}var rt={left:!1,right:!1,up:!1,down:!1};function hd(){Ct==="noserver"||Ct==="offline"?ad():Ct==="pairfail"&&(ls=0,Ct="connect",Xr())}function NM(i,e,t){if(e&&We.unlock(),i in Em){Cm(i,e,t);return}if(xi){e&&!t&&Am("remote",i);return}if(Ct!=="world"){e&&i==="ok"&&hd();return}if(ut&&!Y.open){e&&!t&&i==="ok"&&ut.toggle();return}if(Y.open){if(!e||t)return;i==="ok"?Y.input("ok"):Fs(xt,i)==="menu"&&Y.close();return}let n=Fs(xt,i);if(Le){if(!e||t)return;i==="ok"?Xl():n==="build"||i==="chUp"||i==="chDown"?Wa():(n==="menu"||i==="back")&&Xs();return}if(vt.open){if(!e||t)return;i==="ok"?ec(vt.close()):(n==="wheel"||n==="menu")&&vt.close();return}if(n==="wheel"){t||rd(e,!1);return}n&&!t&&zi(n,e)}function UM(i,e){if(e&&We.unlock(),i>=12&&i<=16)return;if(xi){e&&Am("pad",i);return}if(Ct!=="world"){e&&i===0&&hd();return}if(ut&&!Y.open){e&&(i===0?ut.toggle():(i===1||ks(xt,i)==="menu")&&mm());return}if(Y.open){if(!e)return;i===0?Y.input("ok"):i===1?Y.input("back"):ks(xt,i)==="menu"&&Y.close();return}if(Le){if(!e)return;i===0?Xl():i===1?Xs():i===2||i===3||i===4||i===5||ks(xt,i)==="build"?Wa():ks(xt,i)==="menu"&&(Xs(),ei());return}let t=ks(xt,i);if(t==="wheel"){rd(e,!0);return}if(vt.open){if(!e)return;i===0?ec(vt.close()):(i===1||t==="menu")&&vt.close();return}t&&zi(t,e)}MyPC.init({keys:["channel","buttons"],ownMenu:!0,onInit(i){sp(i.lang),document.documentElement.lang=i.lang,document.documentElement.dir=i.lang==="ar"?"rtl":"ltr",Vi=i.quality?.tier??"mid",pt={...pt,...MyPC.load("gfx",{})},pt.q!=="auto"&&(Vi=pt.q);let e=new URLSearchParams(location.search);(e.get("tier")==="low"||e.get("tier")==="mid"||e.get("tier")==="high")&&(Vi=e.get("tier"));let t=MyPC.app_config??{};Hi=MyPC.load("auth",null);let n=/github\.io$/i.test(location.hostname)?"":location.origin;Qn=String(e.get("server")||t.server||MyPC.load("server","")||Hi?.server||n),Ze=MyPC.load("how","play")==="watch"?"watch":"play",e.get("watch")!==null&&(Ze="watch");let s=MyPC.load("binds",null);if(s&&s.pad&&s.remote&&(s.v??1)<ml)xt=gl(Ur),MyPC.save("binds",xt),Xu=!0;else if(s&&s.pad&&s.remote){xt={pad:{...s.pad},remote:{...s.remote},v:ml};for(let a of Nr){let o=Ur.pad[a],l=Ur.remote[a];!(a in s.pad)&&o!==void 0&&ks(xt,o)===void 0&&(xt.pad[a]=o),!(a in s.remote)&&l!==void 0&&Fs(xt,l)===void 0&&(xt.remote[a]=l)}}{let a=MyPC.load("sound",null);We.prefs={...Du,...a&&typeof a=="object"?a:{}}}We.load(new URL("audio/",location.href).href);for(let a of["keydown","pointerdown","touchstart"])window.addEventListener(a,()=>We.unlock(),{passive:!0});let r=MyPC.load("cam","top");mi=Ll.includes(r)?r:"top",kn=MyPC.load("thoughts",!0)!==!1,window.addEventListener("resize",nd),Mm(),MyPC.gamepad&&(MyPC.gamepad.on("pads",a=>{hs=a.length,Ob=!a.length,Ks()}),MyPC.gamepad.on("button",(a,o)=>UM(a,o))),MyPC.buttons?.on?.((a,o,l)=>NM(a,o,!!l)),(MyPC.apiLevel??0)>=24&&MyPC.stt?.on&&MyPC.stt.on("text",SM),e.get("dev")!==null&&(window.__dev={unplace:()=>Xs(),tile:(a,o)=>Fa[zr(a+.5,o+.5)]??"?",place:(a,o,l,h,c)=>{a&&$l(a);for(let u=0;u<Math.abs(o??0);u++)ka(Math.sign(o),0);for(let u=0;u<Math.abs(l??0);u++)ka(0,Math.sign(l));for(let u=0;u<(h??0);u++)Wa();return c&&Xl(),Le?{...Le,check:Ql(Le)}:null},snd:()=>We.stats(),act:(a,o=!0)=>zi(a,o),aim:()=>({aimOn:ds,aimAng:$s,aimLock:gi}),me:()=>[On(),zn(),kt],cam:a=>tc(a),dbg:()=>({yaw:vi,camView:mi,how:Ze,meId:Cn,meTransit:Ka,predOk:vn,predX:jt,predY:Qt,camX:Tn,camY:En,s:yi(),sx:yi()>=0?Ht[yi()]:null}),look:(a,o)=>{_t=-1,Tn=a,En=o,Hn=!0}}),MyPC.ready()},onStart(){let i=Number(MyPC.load("dist",24))||24,e=Number(MyPC.load("back",7))||7;Xr(),Yp(),queueMicrotask(()=>{re&&(re.dist=i,re.back=e)}),kM=i},onPause(){Kp(),We.pause(!0)},onResume(){We.pause(!1),Yp()},onDestroy(){Kp(),We.pause(!0),clearTimeout(Hu),window.removeEventListener("resize",nd),un&&(un.onclose=null,un.close(),un=null),re?.dispose(),re=null},onMenu(i){i==="game"?setTimeout(()=>ei(),50):i==="server"&&ad()},onInput(i,e,t,n){e&&We.unlock();let s=!!n&&/^pad/.test(n);if(i in Em){Cm(i,e,t,s);return}if(i==="cancel")return e?xi?(xi=null,xe(A("mControls"),800),!0):Le&&!Y.open?(Xs(),!0):vt.open?(vt.close(),!0):Y.open?(Y.input("back"),!0):ut&&!s?(mm(),!0):s?!0:Ct!=="world"?!1:(ei(),!0):s?!0:void 0;if(!(s||i==="jump"||i==="menu"&&s)){if(i==="menu"){e&&(Y.open?Y.close():ei());return}if(!xi){if(i==="confirm"){if(!e)return;if(Ct!=="world"){hd();return}if(Y.open){Y.input("ok");return}if(Le){Xl();return}if(vt.open){ec(vt.close());return}if(ut){ut.toggle();return}zi(n==="touch"?"use":Fs(xt,"ok")??"use",!0);return}if(!(Ct!=="world"||Y.open)){if(i==="run"){zi("run",e);return}if(e){if(Le&&(i==="pageUp"||i==="pageDown")){Wa();return}i==="pageUp"?zi(Fs(xt,"chUp")??"zoomIn",!0):i==="pageDown"&&zi(Fs(xt,"chDown")??"zoomOut",!0)}}}}}});var kM=24;
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2024 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
