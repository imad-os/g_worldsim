var kt={None:0,Agent:1,Projectile:2,Item:3,Prop:4,Threat:5,Player:6,Animal:7},ea={Alive:1,Moving:2,Sleeping:4,Transit:8,Dead:16,Child:32},Ce={Hello:"hi",View:"view",Ping:"ping",Who:"who",Admin:"adm",Pair:"pair",Join:"join",Input:"in",Do:"do",Info:"info",Welcome:"wel",Error:"err",Chunk:"chk",ChunkDrop:"chx",Frame:"frm",Stats:"sts",Pong:"pong",AdminResult:"admr",PairCode:"pairc",Paired:"paired",Notice:"note",You:"you"};function su(i){let e=i.length,t=0,n=0;for(;n<e;){let s=i.charCodeAt(n++);if((s&4294967168)===0){t++;continue}else if((s&4294965248)===0)t+=2;else{if(s>=55296&&s<=56319&&n<e){let r=i.charCodeAt(n);(r&64512)===56320&&(++n,s=((s&1023)<<10)+(r&1023)+65536)}(s&4294901760)===0?t+=3:t+=4}}return t}function Yf(i,e,t){let n=i.length,s=t,r=0;for(;r<n;){let a=i.charCodeAt(r++);if((a&4294967168)===0){e[s++]=a;continue}else if((a&4294965248)===0)e[s++]=a>>6&31|192;else{if(a>=55296&&a<=56319&&r<n){let o=i.charCodeAt(r);(o&64512)===56320&&(++r,a=((a&1023)<<10)+(o&1023)+65536)}(a&4294901760)===0?(e[s++]=a>>12&15|224,e[s++]=a>>6&63|128):(e[s++]=a>>18&7|240,e[s++]=a>>12&63|128,e[s++]=a>>6&63|128)}e[s++]=a&63|128}}var Zf=new TextEncoder,Kf=50;function Jf(i,e,t){Zf.encodeInto(i,e.subarray(t))}function ru(i,e,t){i.length>Kf?Jf(i,e,t):Yf(i,e,t)}var jf=4096;function Yo(i,e,t){let n=e,s=n+t,r=[],a="";for(;n<s;){let o=i[n++];if((o&128)===0)r.push(o);else if((o&224)===192){let l=i[n++]&63;r.push((o&31)<<6|l)}else if((o&240)===224){let l=i[n++]&63,h=i[n++]&63;r.push((o&31)<<12|l<<6|h)}else if((o&248)===240){let l=i[n++]&63,h=i[n++]&63,c=i[n++]&63,u=(o&7)<<18|l<<12|h<<6|c;u>65535&&(u-=65536,r.push(u>>>10&1023|55296),u=56320|u&1023),r.push(u)}else r.push(o);r.length>=jf&&(a+=String.fromCharCode(...r),r.length=0)}return r.length>0&&(a+=String.fromCharCode(...r)),a}var Qf=new TextDecoder,ep=200;function tp(i,e,t){let n=i.subarray(e,e+t);return Qf.decode(n)}function au(i,e,t){return t>ep?tp(i,e,t):Yo(i,e,t)}var Oi=class{type;data;constructor(e,t){this.type=e,this.data=t}};var Qt=class i extends Error{constructor(e){super(e);let t=Object.create(i.prototype);Object.setPrototypeOf(this,t),Object.defineProperty(this,"name",{configurable:!0,enumerable:!1,value:i.name})}};function ou(i,e,t){let n=t/4294967296,s=t;i.setUint32(e,n),i.setUint32(e+4,s)}function ta(i,e,t){let n=Math.floor(t/4294967296),s=t;i.setUint32(e,n),i.setUint32(e+4,s)}function na(i,e){let t=i.getInt32(e),n=i.getUint32(e+4);return t*4294967296+n}function lu(i,e){let t=i.getUint32(e),n=i.getUint32(e+4);return t*4294967296+n}var np=-1,ip=4294967296-1,sp=17179869184-1;function rp({sec:i,nsec:e}){if(i>=0&&e>=0&&i<=sp)if(e===0&&i<=ip){let t=new Uint8Array(4);return new DataView(t.buffer).setUint32(0,i),t}else{let t=i/4294967296,n=i&4294967295,s=new Uint8Array(8),r=new DataView(s.buffer);return r.setUint32(0,e<<2|t&3),r.setUint32(4,n),s}else{let t=new Uint8Array(12),n=new DataView(t.buffer);return n.setUint32(0,e),ta(n,4,i),t}}function ap(i){let e=i.getTime(),t=Math.floor(e/1e3),n=(e-t*1e3)*1e6,s=Math.floor(n/1e9);return{sec:t+s,nsec:n-s*1e9}}function op(i){if(i instanceof Date){let e=ap(i);return rp(e)}else return null}function lp(i){let e=new DataView(i.buffer,i.byteOffset,i.byteLength);switch(i.byteLength){case 4:return{sec:e.getUint32(0),nsec:0};case 8:{let t=e.getUint32(0),n=e.getUint32(4),s=(t&3)*4294967296+n,r=t>>>2;return{sec:s,nsec:r}}case 12:{let t=na(e,4),n=e.getUint32(0);return{sec:t,nsec:n}}default:throw new Qt(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${i.length}`)}}function cp(i){let e=lp(i);return new Date(e.sec*1e3+e.nsec/1e6)}var cu={type:np,encode:op,decode:cp};var ms=class i{static defaultCodec=new i;__brand;builtInEncoders=[];builtInDecoders=[];encoders=[];decoders=[];constructor(){this.register(cu)}register({type:e,encode:t,decode:n}){if(e>=0)this.encoders[e]=t,this.decoders[e]=n;else{let s=-1-e;this.builtInEncoders[s]=t,this.builtInDecoders[s]=n}}tryToEncode(e,t){for(let n=0;n<this.builtInEncoders.length;n++){let s=this.builtInEncoders[n];if(s!=null){let r=s(e,t);if(r!=null){let a=-1-n;return new Oi(a,r)}}}for(let n=0;n<this.encoders.length;n++){let s=this.encoders[n];if(s!=null){let r=s(e,t);if(r!=null){let a=n;return new Oi(a,r)}}}return e instanceof Oi?e:null}decode(e,t,n){let s=t<0?this.builtInDecoders[-1-t]:this.decoders[t];return s?s(e,t,n):new Oi(t,e)}};function hp(i){return i instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&i instanceof SharedArrayBuffer}function hr(i){return i instanceof Uint8Array?i:ArrayBuffer.isView(i)?new Uint8Array(i.buffer,i.byteOffset,i.byteLength):hp(i)?new Uint8Array(i):Uint8Array.from(i)}var up=100,dp=2048,ur=class i{extensionCodec;context;useBigInt64;maxDepth;initialBufferSize;sortKeys;forceFloat32;ignoreUndefined;forceIntegerToFloat;pos;view;bytes;entered=!1;constructor(e){this.extensionCodec=e?.extensionCodec??ms.defaultCodec,this.context=e?.context,this.useBigInt64=e?.useBigInt64??!1,this.maxDepth=e?.maxDepth??up,this.initialBufferSize=e?.initialBufferSize??dp,this.sortKeys=e?.sortKeys??!1,this.forceFloat32=e?.forceFloat32??!1,this.ignoreUndefined=e?.ignoreUndefined??!1,this.forceIntegerToFloat=e?.forceIntegerToFloat??!1,this.pos=0,this.view=new DataView(new ArrayBuffer(this.initialBufferSize)),this.bytes=new Uint8Array(this.view.buffer)}clone(){return new i({extensionCodec:this.extensionCodec,context:this.context,useBigInt64:this.useBigInt64,maxDepth:this.maxDepth,initialBufferSize:this.initialBufferSize,sortKeys:this.sortKeys,forceFloat32:this.forceFloat32,ignoreUndefined:this.ignoreUndefined,forceIntegerToFloat:this.forceIntegerToFloat})}reinitializeState(){this.pos=0}encodeSharedRef(e){if(this.entered)return this.clone().encodeSharedRef(e);try{return this.entered=!0,this.reinitializeState(),this.doEncode(e,1),this.bytes.subarray(0,this.pos)}finally{this.entered=!1}}encode(e){if(this.entered)return this.clone().encode(e);try{return this.entered=!0,this.reinitializeState(),this.doEncode(e,1),this.bytes.slice(0,this.pos)}finally{this.entered=!1}}doEncode(e,t){if(t>this.maxDepth)throw new Error(`Too deep objects in depth ${t}`);e==null?this.encodeNil():typeof e=="boolean"?this.encodeBoolean(e):typeof e=="number"?this.forceIntegerToFloat?this.encodeNumberAsFloat(e):this.encodeNumber(e):typeof e=="string"?this.encodeString(e):this.useBigInt64&&typeof e=="bigint"?this.encodeBigInt64(e):this.encodeObject(e,t)}ensureBufferSizeToWrite(e){let t=this.pos+e;this.view.byteLength<t&&this.resizeBuffer(t*2)}resizeBuffer(e){let t=new ArrayBuffer(e),n=new Uint8Array(t),s=new DataView(t);n.set(this.bytes),this.view=s,this.bytes=n}encodeNil(){this.writeU8(192)}encodeBoolean(e){e===!1?this.writeU8(194):this.writeU8(195)}encodeNumber(e){!this.forceIntegerToFloat&&Number.isSafeInteger(e)?e>=0?e<128?this.writeU8(e):e<256?(this.writeU8(204),this.writeU8(e)):e<65536?(this.writeU8(205),this.writeU16(e)):e<4294967296?(this.writeU8(206),this.writeU32(e)):this.useBigInt64?this.encodeNumberAsFloat(e):(this.writeU8(207),this.writeU64(e)):e>=-32?this.writeU8(224|e+32):e>=-128?(this.writeU8(208),this.writeI8(e)):e>=-32768?(this.writeU8(209),this.writeI16(e)):e>=-2147483648?(this.writeU8(210),this.writeI32(e)):this.useBigInt64?this.encodeNumberAsFloat(e):(this.writeU8(211),this.writeI64(e)):this.encodeNumberAsFloat(e)}encodeNumberAsFloat(e){this.forceFloat32?(this.writeU8(202),this.writeF32(e)):(this.writeU8(203),this.writeF64(e))}encodeBigInt64(e){e>=BigInt(0)?(this.writeU8(207),this.writeBigUint64(e)):(this.writeU8(211),this.writeBigInt64(e))}writeStringHeader(e){if(e<32)this.writeU8(160+e);else if(e<256)this.writeU8(217),this.writeU8(e);else if(e<65536)this.writeU8(218),this.writeU16(e);else if(e<4294967296)this.writeU8(219),this.writeU32(e);else throw new Error(`Too long string: ${e} bytes in UTF-8`)}encodeString(e){let n=su(e);this.ensureBufferSizeToWrite(5+n),this.writeStringHeader(n),ru(e,this.bytes,this.pos),this.pos+=n}encodeObject(e,t){let n=this.extensionCodec.tryToEncode(e,this.context);if(n!=null)this.encodeExtension(n);else if(Array.isArray(e))this.encodeArray(e,t);else if(ArrayBuffer.isView(e))this.encodeBinary(e);else if(typeof e=="object")this.encodeMap(e,t);else throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(e)}`)}encodeBinary(e){let t=e.byteLength;if(t<256)this.writeU8(196),this.writeU8(t);else if(t<65536)this.writeU8(197),this.writeU16(t);else if(t<4294967296)this.writeU8(198),this.writeU32(t);else throw new Error(`Too large binary: ${t}`);let n=hr(e);this.writeU8a(n)}encodeArray(e,t){let n=e.length;if(n<16)this.writeU8(144+n);else if(n<65536)this.writeU8(220),this.writeU16(n);else if(n<4294967296)this.writeU8(221),this.writeU32(n);else throw new Error(`Too large array: ${n}`);for(let s of e)this.doEncode(s,t+1)}countWithoutUndefined(e,t){let n=0;for(let s of t)e[s]!==void 0&&n++;return n}encodeMap(e,t){let n=Object.keys(e);this.sortKeys&&n.sort();let s=this.ignoreUndefined?this.countWithoutUndefined(e,n):n.length;if(s<16)this.writeU8(128+s);else if(s<65536)this.writeU8(222),this.writeU16(s);else if(s<4294967296)this.writeU8(223),this.writeU32(s);else throw new Error(`Too large map object: ${s}`);for(let r of n){let a=e[r];this.ignoreUndefined&&a===void 0||(this.encodeString(r),this.doEncode(a,t+1))}}encodeExtension(e){if(typeof e.data=="function"){let n=e.data(this.pos+6),s=n.length;if(s>=4294967296)throw new Error(`Too large extension object: ${s}`);this.writeU8(201),this.writeU32(s),this.writeI8(e.type),this.writeU8a(n);return}let t=e.data.length;if(t===1)this.writeU8(212);else if(t===2)this.writeU8(213);else if(t===4)this.writeU8(214);else if(t===8)this.writeU8(215);else if(t===16)this.writeU8(216);else if(t<256)this.writeU8(199),this.writeU8(t);else if(t<65536)this.writeU8(200),this.writeU16(t);else if(t<4294967296)this.writeU8(201),this.writeU32(t);else throw new Error(`Too large extension object: ${t}`);this.writeI8(e.type),this.writeU8a(e.data)}writeU8(e){this.ensureBufferSizeToWrite(1),this.view.setUint8(this.pos,e),this.pos++}writeU8a(e){let t=e.length;this.ensureBufferSizeToWrite(t),this.bytes.set(e,this.pos),this.pos+=t}writeI8(e){this.ensureBufferSizeToWrite(1),this.view.setInt8(this.pos,e),this.pos++}writeU16(e){this.ensureBufferSizeToWrite(2),this.view.setUint16(this.pos,e),this.pos+=2}writeI16(e){this.ensureBufferSizeToWrite(2),this.view.setInt16(this.pos,e),this.pos+=2}writeU32(e){this.ensureBufferSizeToWrite(4),this.view.setUint32(this.pos,e),this.pos+=4}writeI32(e){this.ensureBufferSizeToWrite(4),this.view.setInt32(this.pos,e),this.pos+=4}writeF32(e){this.ensureBufferSizeToWrite(4),this.view.setFloat32(this.pos,e),this.pos+=4}writeF64(e){this.ensureBufferSizeToWrite(8),this.view.setFloat64(this.pos,e),this.pos+=8}writeU64(e){this.ensureBufferSizeToWrite(8),ou(this.view,this.pos,e),this.pos+=8}writeI64(e){this.ensureBufferSizeToWrite(8),ta(this.view,this.pos,e),this.pos+=8}writeBigUint64(e){this.ensureBufferSizeToWrite(8),this.view.setBigUint64(this.pos,e),this.pos+=8}writeBigInt64(e){this.ensureBufferSizeToWrite(8),this.view.setBigInt64(this.pos,e),this.pos+=8}};function ia(i){return`${i<0?"-":""}0x${Math.abs(i).toString(16).padStart(2,"0")}`}var fp=16,pp=16,sa=class{hit=0;miss=0;caches;maxKeyLength;maxLengthPerKey;constructor(e=fp,t=pp){this.maxKeyLength=e,this.maxLengthPerKey=t,this.caches=[];for(let n=0;n<this.maxKeyLength;n++)this.caches.push([])}canBeCached(e){return e>0&&e<=this.maxKeyLength}find(e,t,n){let s=this.caches[n-1];e:for(let r of s){let a=r.bytes;for(let o=0;o<n;o++)if(a[o]!==e[t+o])continue e;return r.str}return null}store(e,t){let n=this.caches[e.length-1],s={bytes:e,str:t};n.length>=this.maxLengthPerKey?n[Math.random()*n.length|0]=s:n.push(s)}decode(e,t,n){let s=this.find(e,t,n);if(s!=null)return this.hit++,s;this.miss++;let r=Yo(e,t,n),a=Uint8Array.prototype.slice.call(e,t,t+n);return this.store(a,r),r}};var Zo="array",pr="map_key",uu="map_value",mp=i=>{if(typeof i=="string"||typeof i=="number")return i;throw new Qt("The type of key must be string or number but "+typeof i)},Ko=class{stack=[];stackHeadPosition=-1;get length(){return this.stackHeadPosition+1}top(){return this.stack[this.stackHeadPosition]}pushArrayState(e){let t=this.getUninitializedStateFromPool();t.type=Zo,t.position=0,t.size=e,t.array=new Array(e)}pushMapState(e){let t=this.getUninitializedStateFromPool();t.type=pr,t.readCount=0,t.size=e,t.map={}}getUninitializedStateFromPool(){if(this.stackHeadPosition++,this.stackHeadPosition===this.stack.length){let e={type:void 0,size:0,array:void 0,position:0,readCount:0,map:void 0,key:null};this.stack.push(e)}return this.stack[this.stackHeadPosition]}release(e){if(this.stack[this.stackHeadPosition]!==e)throw new Error("Invalid stack state. Released state is not on top of the stack.");if(e.type===Zo){let n=e;n.size=0,n.array=void 0,n.position=0,n.type=void 0}if(e.type===pr||e.type===uu){let n=e;n.size=0,n.map=void 0,n.readCount=0,n.type=void 0}this.stackHeadPosition--}reset(){this.stack.length=0,this.stackHeadPosition=-1}},fr=-1,Jo=new DataView(new ArrayBuffer(0)),gp=new Uint8Array(Jo.buffer);try{Jo.getInt8(0)}catch(i){if(!(i instanceof RangeError))throw new Error("This module is not supported in the current JavaScript engine because DataView does not throw RangeError on out-of-bounds access")}var hu=new RangeError("Insufficient data"),xp=new sa,mr=class i{extensionCodec;context;useBigInt64;rawStrings;maxStrLength;maxBinLength;maxArrayLength;maxMapLength;maxExtLength;keyDecoder;mapKeyConverter;totalPos=0;pos=0;view=Jo;bytes=gp;headByte=fr;stack=new Ko;entered=!1;constructor(e){this.extensionCodec=e?.extensionCodec??ms.defaultCodec,this.context=e?.context,this.useBigInt64=e?.useBigInt64??!1,this.rawStrings=e?.rawStrings??!1,this.maxStrLength=e?.maxStrLength??4294967295,this.maxBinLength=e?.maxBinLength??4294967295,this.maxArrayLength=e?.maxArrayLength??4294967295,this.maxMapLength=e?.maxMapLength??4294967295,this.maxExtLength=e?.maxExtLength??4294967295,this.keyDecoder=e?.keyDecoder!==void 0?e.keyDecoder:xp,this.mapKeyConverter=e?.mapKeyConverter??mp}clone(){return new i({extensionCodec:this.extensionCodec,context:this.context,useBigInt64:this.useBigInt64,rawStrings:this.rawStrings,maxStrLength:this.maxStrLength,maxBinLength:this.maxBinLength,maxArrayLength:this.maxArrayLength,maxMapLength:this.maxMapLength,maxExtLength:this.maxExtLength,keyDecoder:this.keyDecoder})}reinitializeState(){this.totalPos=0,this.headByte=fr,this.stack.reset()}setBuffer(e){let t=hr(e);this.bytes=t,this.view=new DataView(t.buffer,t.byteOffset,t.byteLength),this.pos=0}appendBuffer(e){if(this.headByte===fr&&!this.hasRemaining(1))this.setBuffer(e);else{let t=this.bytes.subarray(this.pos),n=hr(e),s=new Uint8Array(t.length+n.length);s.set(t),s.set(n,t.length),this.setBuffer(s)}}hasRemaining(e){return this.view.byteLength-this.pos>=e}createExtraByteError(e){let{view:t,pos:n}=this;return new RangeError(`Extra ${t.byteLength-n} of ${t.byteLength} byte(s) found at buffer[${e}]`)}decode(e){if(this.entered)return this.clone().decode(e);try{this.entered=!0,this.reinitializeState(),this.setBuffer(e);let t=this.doDecodeSync();if(this.hasRemaining(1))throw this.createExtraByteError(this.pos);return t}finally{this.entered=!1}}*decodeMulti(e){if(this.entered){yield*this.clone().decodeMulti(e);return}try{for(this.entered=!0,this.reinitializeState(),this.setBuffer(e);this.hasRemaining(1);)yield this.doDecodeSync()}finally{this.entered=!1}}async decodeAsync(e){if(this.entered)return this.clone().decodeAsync(e);try{this.entered=!0;let t=!1,n;for await(let o of e){if(t)throw this.entered=!1,this.createExtraByteError(this.totalPos);this.appendBuffer(o);try{n=this.doDecodeSync(),t=!0}catch(l){if(!(l instanceof RangeError))throw l}this.totalPos+=this.pos}if(t){if(this.hasRemaining(1))throw this.createExtraByteError(this.totalPos);return n}let{headByte:s,pos:r,totalPos:a}=this;throw new RangeError(`Insufficient data in parsing ${ia(s)} at ${a} (${r} in the current buffer)`)}finally{this.entered=!1}}decodeArrayStream(e){return this.decodeMultiAsync(e,!0)}decodeStream(e){return this.decodeMultiAsync(e,!1)}async*decodeMultiAsync(e,t){if(this.entered){yield*this.clone().decodeMultiAsync(e,t);return}try{this.entered=!0;let n=t,s=-1;for await(let r of e){if(t&&s===0)throw this.createExtraByteError(this.totalPos);this.appendBuffer(r),n&&(s=this.readArraySize(),n=!1,this.complete());try{for(;yield this.doDecodeSync(),--s!==0;);}catch(a){if(!(a instanceof RangeError))throw a}this.totalPos+=this.pos}}finally{this.entered=!1}}doDecodeSync(){e:for(;;){let e=this.readHeadByte(),t;if(e>=224)t=e-256;else if(e<192)if(e<128)t=e;else if(e<144){let s=e-128;if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e<160){let s=e-144;if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else{let s=e-160;t=this.decodeString(s,0)}else if(e===192)t=null;else if(e===194)t=!1;else if(e===195)t=!0;else if(e===202)t=this.readF32();else if(e===203)t=this.readF64();else if(e===204)t=this.readU8();else if(e===205)t=this.readU16();else if(e===206)t=this.readU32();else if(e===207)this.useBigInt64?t=this.readU64AsBigInt():t=this.readU64();else if(e===208)t=this.readI8();else if(e===209)t=this.readI16();else if(e===210)t=this.readI32();else if(e===211)this.useBigInt64?t=this.readI64AsBigInt():t=this.readI64();else if(e===217){let s=this.lookU8();t=this.decodeString(s,1)}else if(e===218){let s=this.lookU16();t=this.decodeString(s,2)}else if(e===219){let s=this.lookU32();t=this.decodeString(s,4)}else if(e===220){let s=this.readU16();if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else if(e===221){let s=this.readU32();if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else if(e===222){let s=this.readU16();if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e===223){let s=this.readU32();if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e===196){let s=this.lookU8();t=this.decodeBinary(s,1)}else if(e===197){let s=this.lookU16();t=this.decodeBinary(s,2)}else if(e===198){let s=this.lookU32();t=this.decodeBinary(s,4)}else if(e===212)t=this.decodeExtension(1,0);else if(e===213)t=this.decodeExtension(2,0);else if(e===214)t=this.decodeExtension(4,0);else if(e===215)t=this.decodeExtension(8,0);else if(e===216)t=this.decodeExtension(16,0);else if(e===199){let s=this.lookU8();t=this.decodeExtension(s,1)}else if(e===200){let s=this.lookU16();t=this.decodeExtension(s,2)}else if(e===201){let s=this.lookU32();t=this.decodeExtension(s,4)}else throw new Qt(`Unrecognized type byte: ${ia(e)}`);this.complete();let n=this.stack;for(;n.length>0;){let s=n.top();if(s.type===Zo)if(s.array[s.position]=t,s.position++,s.position===s.size)t=s.array,n.release(s);else continue e;else if(s.type===pr){if(t==="__proto__")throw new Qt("The key __proto__ is not allowed");s.key=this.mapKeyConverter(t),s.type=uu;continue e}else if(s.map[s.key]=t,s.readCount++,s.readCount===s.size)t=s.map,n.release(s);else{s.key=null,s.type=pr;continue e}}return t}}readHeadByte(){return this.headByte===fr&&(this.headByte=this.readU8()),this.headByte}complete(){this.headByte=fr}readArraySize(){let e=this.readHeadByte();switch(e){case 220:return this.readU16();case 221:return this.readU32();default:{if(e<160)return e-144;throw new Qt(`Unrecognized array type byte: ${ia(e)}`)}}}pushMapState(e){if(e>this.maxMapLength)throw new Qt(`Max length exceeded: map length (${e}) > maxMapLengthLength (${this.maxMapLength})`);this.stack.pushMapState(e)}pushArrayState(e){if(e>this.maxArrayLength)throw new Qt(`Max length exceeded: array length (${e}) > maxArrayLength (${this.maxArrayLength})`);this.stack.pushArrayState(e)}decodeString(e,t){return!this.rawStrings||this.stateIsMapKey()?this.decodeUtf8String(e,t):this.decodeBinary(e,t)}decodeUtf8String(e,t){if(e>this.maxStrLength)throw new Qt(`Max length exceeded: UTF-8 byte length (${e}) > maxStrLength (${this.maxStrLength})`);if(this.bytes.byteLength<this.pos+t+e)throw hu;let n=this.pos+t,s;return this.stateIsMapKey()&&this.keyDecoder?.canBeCached(e)?s=this.keyDecoder.decode(this.bytes,n,e):s=au(this.bytes,n,e),this.pos+=t+e,s}stateIsMapKey(){return this.stack.length>0?this.stack.top().type===pr:!1}decodeBinary(e,t){if(e>this.maxBinLength)throw new Qt(`Max length exceeded: bin length (${e}) > maxBinLength (${this.maxBinLength})`);if(!this.hasRemaining(e+t))throw hu;let n=this.pos+t,s=this.bytes.subarray(n,n+e);return this.pos+=t+e,s}decodeExtension(e,t){if(e>this.maxExtLength)throw new Qt(`Max length exceeded: ext length (${e}) > maxExtLength (${this.maxExtLength})`);let n=this.view.getInt8(this.pos+t),s=this.decodeBinary(e,t+1);return this.extensionCodec.decode(s,n,this.context)}lookU8(){return this.view.getUint8(this.pos)}lookU16(){return this.view.getUint16(this.pos)}lookU32(){return this.view.getUint32(this.pos)}readU8(){let e=this.view.getUint8(this.pos);return this.pos++,e}readI8(){let e=this.view.getInt8(this.pos);return this.pos++,e}readU16(){let e=this.view.getUint16(this.pos);return this.pos+=2,e}readI16(){let e=this.view.getInt16(this.pos);return this.pos+=2,e}readU32(){let e=this.view.getUint32(this.pos);return this.pos+=4,e}readI32(){let e=this.view.getInt32(this.pos);return this.pos+=4,e}readU64(){let e=lu(this.view,this.pos);return this.pos+=8,e}readI64(){let e=na(this.view,this.pos);return this.pos+=8,e}readU64AsBigInt(){let e=this.view.getBigUint64(this.pos);return this.pos+=8,e}readI64AsBigInt(){let e=this.view.getBigInt64(this.pos);return this.pos+=8,e}readF32(){let e=this.view.getFloat32(this.pos);return this.pos+=4,e}readF64(){let e=this.view.getFloat64(this.pos);return this.pos+=8,e}};var vp=new ur({ignoreUndefined:!0}),yp=new mr;function ra(i){return vp.encode(i)}function du(i){return yp.decode(i instanceof ArrayBuffer?new Uint8Array(i):i)}function fu(i){return i.byteOffset%4===0?new Int32Array(i.buffer,i.byteOffset,i.byteLength>>2):new Int32Array(_p(i).buffer)}function _p(i){let e=new Uint8Array(i.byteLength);return e.set(i),e}function aa(i,e){return e<<16|i}var jo=["wood","stone","scrap","ore","brick","leather","claw"],pu=["weapon","clothing","defence","furniture"],oa=[{cat:"weapon",what:"sword",need:{wood:1,ore:1}},{cat:"weapon",what:"axe",need:{wood:1,stone:1}},{cat:"weapon",what:"spear",need:{wood:1,claw:1}},{cat:"weapon",what:"spear",need:{wood:1,scrap:1}},{cat:"weapon",what:"bow",need:{wood:2,leather:1}},{cat:"weapon",what:"arrows",need:{wood:2,stone:1},n:5},{cat:"clothing",what:"clothes",need:{leather:2}},{cat:"clothing",what:"armor",need:{leather:2,ore:1}},{cat:"clothing",what:"helmet",need:{leather:1,ore:1}},{cat:"defence",what:"palisade",need:{wood:2}},{cat:"defence",what:"spikes",need:{wood:1,claw:1}},{cat:"defence",what:"stonewall",need:{brick:2}},{cat:"furniture",what:"door",need:{wood:1,ore:1}},{cat:"furniture",what:"window",need:{wood:1,scrap:1}},{cat:"furniture",what:"bed",need:{wood:3,leather:2}},{cat:"furniture",what:"lamp",need:{scrap:1,ore:1}},{cat:"furniture",what:"campfire",need:{wood:3,stone:2}}],Qo=["palisade","spikes","stonewall","door","window","bed","lamp","campfire"];var mu=["rabbit","deer","boar","wolf","bear"];function el(i,e){let t=Object.keys(e).filter(n=>(e[n]??0)>0);for(let n of oa){if(n.cat!==i)continue;let s=Object.keys(n.need);if(s.length===t.length&&s.every(r=>e[r]===n.need[r]))return n}return null}var Mp=0,gu=1,bp=2;var _d=1,Kc=2,si=3,Ri=0,nn=1,_n=2,Ai=0,Ls=1,Ar=2,xu=3,vu=4,Sp=5,$i=100,wp=101,Ep=102,Tp=103,Ap=104,Cp=200,Rp=201,Pp=202,Ip=203,Dl=204,Ul=205,Lp=206,Dp=207,Up=208,Np=209,Fp=210,Bp=211,kp=212,Op=213,zp=214,Nl=0,Fl=1,Bl=2,Fs=3,kl=4,Ol=5,zl=6,Hl=7,oo=0,Hp=1,Vp=2,Ci=0,Gp=1,Wp=2,Xp=3,qp=4,$p=5,Yp=6,Jc=7;var Md=300,Bs=301,ks=302,Vl=303,Gl=304,lo=306,Wl=1e3,Ki=1001,Xl=1002,ln=1003,Zp=1004;var la=1005;var qn=1006,tl=1007;var Ji=1008;var li=1009,bd=1010,Sd=1011,Cr=1012,jc=1013,ji=1014,$n=1015,Ir=1016,Qc=1017,eh=1018,Os=1020,wd=35902,Ed=1021,Td=1022,Un=1023,Ad=1024,Cd=1025,Ds=1026,zs=1027,th=1028,nh=1029,Rd=1030,ih=1031;var sh=1033,Ia=33776,La=33777,Da=33778,Ua=33779,ql=35840,$l=35841,Yl=35842,Zl=35843,Kl=36196,Jl=37492,jl=37496,Ql=37808,ec=37809,tc=37810,nc=37811,ic=37812,sc=37813,rc=37814,ac=37815,oc=37816,lc=37817,cc=37818,hc=37819,uc=37820,dc=37821,Na=36492,fc=36494,pc=36495,Pd=36283,mc=36284,gc=36285,xc=36286;var Fa=2300,vc=2301,nl=2302,yu=2400,_u=2401,Mu=2402;var Kp=3200,Jp=3201;var rh=0,jp=1,Ti="",yn="srgb",Ws="srgb-linear",co="linear",lt="srgb";var gs=7680;var bu=519,Qp=512,em=513,tm=514,Id=515,nm=516,im=517,sm=518,rm=519,Su=35044,ss=35048;var wu="300 es",ai=2e3,Ba=2001,Pi=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let s=this._listeners[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let n=this._listeners[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},Ht=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var il=Math.PI/180,yc=180/Math.PI;function Lr(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ht[i&255]+Ht[i>>8&255]+Ht[i>>16&255]+Ht[i>>24&255]+"-"+Ht[e&255]+Ht[e>>8&255]+"-"+Ht[e>>16&15|64]+Ht[e>>24&255]+"-"+Ht[t&63|128]+Ht[t>>8&255]+"-"+Ht[t>>16&255]+Ht[t>>24&255]+Ht[n&255]+Ht[n>>8&255]+Ht[n>>16&255]+Ht[n>>24&255]).toLowerCase()}function tn(i,e,t){return Math.max(e,Math.min(t,i))}function am(i,e){return(i%e+e)%e}function sl(i,e,t){return(1-t)*i+t*e}function gr(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function en(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var ze=class i{constructor(e=0,t=0){i.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(tn(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Ie=class i{constructor(e,t,n,s,r,a,o,l,h){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,h)}set(e,t,n,s,r,a,o,l,h){let c=this.elements;return c[0]=e,c[1]=s,c[2]=o,c[3]=t,c[4]=r,c[5]=l,c[6]=n,c[7]=a,c[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],h=n[1],c=n[4],u=n[7],d=n[2],m=n[5],g=n[8],x=s[0],p=s[3],f=s[6],S=s[1],w=s[4],v=s[7],I=s[2],C=s[5],E=s[8];return r[0]=a*x+o*S+l*I,r[3]=a*p+o*w+l*C,r[6]=a*f+o*v+l*E,r[1]=h*x+c*S+u*I,r[4]=h*p+c*w+u*C,r[7]=h*f+c*v+u*E,r[2]=d*x+m*S+g*I,r[5]=d*p+m*w+g*C,r[8]=d*f+m*v+g*E,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],h=e[7],c=e[8];return t*a*c-t*o*h-n*r*c+n*o*l+s*r*h-s*a*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],h=e[7],c=e[8],u=c*a-o*h,d=o*l-c*r,m=h*r-a*l,g=t*u+n*d+s*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/g;return e[0]=u*x,e[1]=(s*h-c*n)*x,e[2]=(o*n-s*a)*x,e[3]=d*x,e[4]=(c*t-s*l)*x,e[5]=(s*r-o*t)*x,e[6]=m*x,e[7]=(n*l-h*t)*x,e[8]=(a*t-n*r)*x,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){let l=Math.cos(r),h=Math.sin(r);return this.set(n*l,n*h,-n*(l*a+h*o)+a+e,-s*h,s*l,-s*(-h*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(rl.makeScale(e,t)),this}rotate(e){return this.premultiply(rl.makeRotation(-e)),this}translate(e,t){return this.premultiply(rl.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},rl=new Ie;function Ld(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function ka(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function om(){let i=ka("canvas");return i.style.display="block",i}var Eu={};function wr(i){i in Eu||(Eu[i]=!0,console.warn(i))}function lm(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}function cm(i){let e=i.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function hm(i){let e=i.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var Ze={enabled:!0,workingColorSpace:Ws,spaces:{},convert:function(i,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===lt&&(i.r=oi(i.r),i.g=oi(i.g),i.b=oi(i.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(i.applyMatrix3(this.spaces[e].toXYZ),i.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===lt&&(i.r=Us(i.r),i.g=Us(i.g),i.b=Us(i.b))),i},fromWorkingColorSpace:function(i,e){return this.convert(i,this.workingColorSpace,e)},toWorkingColorSpace:function(i,e){return this.convert(i,e,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Ti?co:this.spaces[i].transfer},getLuminanceCoefficients:function(i,e=this.workingColorSpace){return i.fromArray(this.spaces[e].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,e,t){return i.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function oi(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Us(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Tu=[.64,.33,.3,.6,.15,.06],Au=[.2126,.7152,.0722],Cu=[.3127,.329],Ru=new Ie().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Pu=new Ie().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Ze.define({[Ws]:{primaries:Tu,whitePoint:Cu,transfer:co,toXYZ:Ru,fromXYZ:Pu,luminanceCoefficients:Au,workingColorSpaceConfig:{unpackColorSpace:yn},outputColorSpaceConfig:{drawingBufferColorSpace:yn}},[yn]:{primaries:Tu,whitePoint:Cu,transfer:lt,toXYZ:Ru,fromXYZ:Pu,luminanceCoefficients:Au,outputColorSpaceConfig:{drawingBufferColorSpace:yn}}});var xs,_c=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{xs===void 0&&(xs=ka("canvas")),xs.width=e.width,xs.height=e.height;let n=xs.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=xs}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=ka("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=oi(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(oi(t[n]/255)*255):t[n]=oi(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},um=0,Oa=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:um++}),this.uuid=Lr(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(al(s[a].image)):r.push(al(s[a]))}else r=al(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function al(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?_c.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var dm=0,hn=class i extends Pi{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=Ki,s=Ki,r=qn,a=Ji,o=Un,l=li,h=i.DEFAULT_ANISOTROPY,c=Ti){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:dm++}),this.uuid=Lr(),this.name="",this.source=new Oa(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=h,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ze(0,0),this.repeat=new ze(1,1),this.center=new ze(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ie,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=c,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Md)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Wl:e.x=e.x-Math.floor(e.x);break;case Ki:e.x=e.x<0?0:1;break;case Xl:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Wl:e.y=e.y-Math.floor(e.y);break;case Ki:e.y=e.y<0?0:1;break;case Xl:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};hn.DEFAULT_IMAGE=null;hn.DEFAULT_MAPPING=Md;hn.DEFAULT_ANISOTROPY=1;var ct=class i{constructor(e=0,t=0,n=0,s=1){i.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,h=l[0],c=l[4],u=l[8],d=l[1],m=l[5],g=l[9],x=l[2],p=l[6],f=l[10];if(Math.abs(c-d)<.01&&Math.abs(u-x)<.01&&Math.abs(g-p)<.01){if(Math.abs(c+d)<.1&&Math.abs(u+x)<.1&&Math.abs(g+p)<.1&&Math.abs(h+m+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let w=(h+1)/2,v=(m+1)/2,I=(f+1)/2,C=(c+d)/4,E=(u+x)/4,A=(g+p)/4;return w>v&&w>I?w<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(w),s=C/n,r=E/n):v>I?v<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),n=C/s,r=A/s):I<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(I),n=E/r,s=A/r),this.set(n,s,r,t),this}let S=Math.sqrt((p-g)*(p-g)+(u-x)*(u-x)+(d-c)*(d-c));return Math.abs(S)<.001&&(S=1),this.x=(p-g)/S,this.y=(u-x)/S,this.z=(d-c)/S,this.w=Math.acos((h+m+f-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Mc=class extends Pi{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new ct(0,0,e,t),this.scissorTest=!1,this.viewport=new ct(0,0,e,t);let s={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:qn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new hn(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,s=e.textures.length;n<s;n++)this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new Oa(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},ci=class extends Mc{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},za=class extends hn{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=ln,this.minFilter=ln,this.wrapR=Ki,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var bc=class extends hn{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=ln,this.minFilter=ln,this.wrapR=Ki,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Wt=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let l=n[s+0],h=n[s+1],c=n[s+2],u=n[s+3],d=r[a+0],m=r[a+1],g=r[a+2],x=r[a+3];if(o===0){e[t+0]=l,e[t+1]=h,e[t+2]=c,e[t+3]=u;return}if(o===1){e[t+0]=d,e[t+1]=m,e[t+2]=g,e[t+3]=x;return}if(u!==x||l!==d||h!==m||c!==g){let p=1-o,f=l*d+h*m+c*g+u*x,S=f>=0?1:-1,w=1-f*f;if(w>Number.EPSILON){let I=Math.sqrt(w),C=Math.atan2(I,f*S);p=Math.sin(p*C)/I,o=Math.sin(o*C)/I}let v=o*S;if(l=l*p+d*v,h=h*p+m*v,c=c*p+g*v,u=u*p+x*v,p===1-o){let I=1/Math.sqrt(l*l+h*h+c*c+u*u);l*=I,h*=I,c*=I,u*=I}}e[t]=l,e[t+1]=h,e[t+2]=c,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,s,r,a){let o=n[s],l=n[s+1],h=n[s+2],c=n[s+3],u=r[a],d=r[a+1],m=r[a+2],g=r[a+3];return e[t]=o*g+c*u+l*m-h*d,e[t+1]=l*g+c*d+h*u-o*m,e[t+2]=h*g+c*m+o*d-l*u,e[t+3]=c*g-o*u-l*d-h*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,h=o(n/2),c=o(s/2),u=o(r/2),d=l(n/2),m=l(s/2),g=l(r/2);switch(a){case"XYZ":this._x=d*c*u+h*m*g,this._y=h*m*u-d*c*g,this._z=h*c*g+d*m*u,this._w=h*c*u-d*m*g;break;case"YXZ":this._x=d*c*u+h*m*g,this._y=h*m*u-d*c*g,this._z=h*c*g-d*m*u,this._w=h*c*u+d*m*g;break;case"ZXY":this._x=d*c*u-h*m*g,this._y=h*m*u+d*c*g,this._z=h*c*g+d*m*u,this._w=h*c*u-d*m*g;break;case"ZYX":this._x=d*c*u-h*m*g,this._y=h*m*u+d*c*g,this._z=h*c*g-d*m*u,this._w=h*c*u+d*m*g;break;case"YZX":this._x=d*c*u+h*m*g,this._y=h*m*u+d*c*g,this._z=h*c*g-d*m*u,this._w=h*c*u-d*m*g;break;case"XZY":this._x=d*c*u-h*m*g,this._y=h*m*u-d*c*g,this._z=h*c*g+d*m*u,this._w=h*c*u+d*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],h=t[2],c=t[6],u=t[10],d=n+o+u;if(d>0){let m=.5/Math.sqrt(d+1);this._w=.25/m,this._x=(c-l)*m,this._y=(r-h)*m,this._z=(a-s)*m}else if(n>o&&n>u){let m=2*Math.sqrt(1+n-o-u);this._w=(c-l)/m,this._x=.25*m,this._y=(s+a)/m,this._z=(r+h)/m}else if(o>u){let m=2*Math.sqrt(1+o-n-u);this._w=(r-h)/m,this._x=(s+a)/m,this._y=.25*m,this._z=(l+c)/m}else{let m=2*Math.sqrt(1+u-n-o);this._w=(a-s)/m,this._x=(r+h)/m,this._y=(l+c)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(tn(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,h=t._z,c=t._w;return this._x=n*c+a*o+s*h-r*l,this._y=s*c+a*l+r*o-n*h,this._z=r*c+a*h+n*l-s*o,this._w=a*c-n*o-s*l-r*h,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,s=this._y,r=this._z,a=this._w,o=a*e._w+n*e._x+s*e._y+r*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=s,this._z=r,this;let l=1-o*o;if(l<=Number.EPSILON){let m=1-t;return this._w=m*a+t*this._w,this._x=m*n+t*this._x,this._y=m*s+t*this._y,this._z=m*r+t*this._z,this.normalize(),this}let h=Math.sqrt(l),c=Math.atan2(h,o),u=Math.sin((1-t)*c)/h,d=Math.sin(t*c)/h;return this._w=a*u+this._w*d,this._x=n*u+this._x*d,this._y=s*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},L=class i{constructor(e=0,t=0,n=0){i.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Iu.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Iu.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,h=2*(a*s-o*n),c=2*(o*t-r*s),u=2*(r*n-a*t);return this.x=t+l*h+a*u-o*c,this.y=n+l*c+o*h-r*u,this.z=s+l*u+r*c-a*h,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return ol.copy(this).projectOnVector(e),this.sub(ol)}reflect(e){return this.sub(ol.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(tn(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ol=new L,Iu=new Wt,hi=class{constructor(e=new L(1/0,1/0,1/0),t=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(In.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(In.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=In.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,In):In.fromBufferAttribute(r,a),In.applyMatrix4(e.matrixWorld),this.expandByPoint(In);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ca.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ca.copy(n.boundingBox)),ca.applyMatrix4(e.matrixWorld),this.union(ca)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,In),In.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(xr),ha.subVectors(this.max,xr),vs.subVectors(e.a,xr),ys.subVectors(e.b,xr),_s.subVectors(e.c,xr),_i.subVectors(ys,vs),Mi.subVectors(_s,ys),zi.subVectors(vs,_s);let t=[0,-_i.z,_i.y,0,-Mi.z,Mi.y,0,-zi.z,zi.y,_i.z,0,-_i.x,Mi.z,0,-Mi.x,zi.z,0,-zi.x,-_i.y,_i.x,0,-Mi.y,Mi.x,0,-zi.y,zi.x,0];return!ll(t,vs,ys,_s,ha)||(t=[1,0,0,0,1,0,0,0,1],!ll(t,vs,ys,_s,ha))?!1:(ua.crossVectors(_i,Mi),t=[ua.x,ua.y,ua.z],ll(t,vs,ys,_s,ha))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,In).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(In).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Qn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Qn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Qn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Qn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Qn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Qn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Qn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Qn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Qn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},Qn=[new L,new L,new L,new L,new L,new L,new L,new L],In=new L,ca=new hi,vs=new L,ys=new L,_s=new L,_i=new L,Mi=new L,zi=new L,xr=new L,ha=new L,ua=new L,Hi=new L;function ll(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Hi.fromArray(i,r);let o=s.x*Math.abs(Hi.x)+s.y*Math.abs(Hi.y)+s.z*Math.abs(Hi.z),l=e.dot(Hi),h=t.dot(Hi),c=n.dot(Hi);if(Math.max(-Math.max(l,h,c),Math.min(l,h,c))>o)return!1}return!0}var fm=new hi,vr=new L,cl=new L,Qi=class{constructor(e=new L,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):fm.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;vr.subVectors(e,this.center);let t=vr.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(vr,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(cl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(vr.copy(e.center).add(cl)),this.expandByPoint(vr.copy(e.center).sub(cl))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},ei=new L,hl=new L,da=new L,bi=new L,ul=new L,fa=new L,dl=new L,Sc=class{constructor(e=new L,t=new L(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ei)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=ei.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ei.copy(this.origin).addScaledVector(this.direction,t),ei.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){hl.copy(e).add(t).multiplyScalar(.5),da.copy(t).sub(e).normalize(),bi.copy(this.origin).sub(hl);let r=e.distanceTo(t)*.5,a=-this.direction.dot(da),o=bi.dot(this.direction),l=-bi.dot(da),h=bi.lengthSq(),c=Math.abs(1-a*a),u,d,m,g;if(c>0)if(u=a*l-o,d=a*o-l,g=r*c,u>=0)if(d>=-g)if(d<=g){let x=1/c;u*=x,d*=x,m=u*(u+a*d+2*o)+d*(a*u+d+2*l)+h}else d=r,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+h;else d=-r,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+h;else d<=-g?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-l),r),m=-u*u+d*(d+2*l)+h):d<=g?(u=0,d=Math.min(Math.max(-r,-l),r),m=d*(d+2*l)+h):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-l),r),m=-u*u+d*(d+2*l)+h);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+h;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(hl).addScaledVector(da,d),m}intersectSphere(e,t){ei.subVectors(e.center,this.origin);let n=ei.dot(this.direction),s=ei.dot(ei)-n*n,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,l,h=1/this.direction.x,c=1/this.direction.y,u=1/this.direction.z,d=this.origin;return h>=0?(n=(e.min.x-d.x)*h,s=(e.max.x-d.x)*h):(n=(e.max.x-d.x)*h,s=(e.min.x-d.x)*h),c>=0?(r=(e.min.y-d.y)*c,a=(e.max.y-d.y)*c):(r=(e.max.y-d.y)*c,a=(e.min.y-d.y)*c),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,ei)!==null}intersectTriangle(e,t,n,s,r){ul.subVectors(t,e),fa.subVectors(n,e),dl.crossVectors(ul,fa);let a=this.direction.dot(dl),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;bi.subVectors(this.origin,e);let l=o*this.direction.dot(fa.crossVectors(bi,fa));if(l<0)return null;let h=o*this.direction.dot(ul.cross(bi));if(h<0||l+h>a)return null;let c=-o*bi.dot(dl);return c<0?null:this.at(c/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},He=class i{constructor(e,t,n,s,r,a,o,l,h,c,u,d,m,g,x,p){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,h,c,u,d,m,g,x,p)}set(e,t,n,s,r,a,o,l,h,c,u,d,m,g,x,p){let f=this.elements;return f[0]=e,f[4]=t,f[8]=n,f[12]=s,f[1]=r,f[5]=a,f[9]=o,f[13]=l,f[2]=h,f[6]=c,f[10]=u,f[14]=d,f[3]=m,f[7]=g,f[11]=x,f[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,s=1/Ms.setFromMatrixColumn(e,0).length(),r=1/Ms.setFromMatrixColumn(e,1).length(),a=1/Ms.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),h=Math.sin(s),c=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=a*c,m=a*u,g=o*c,x=o*u;t[0]=l*c,t[4]=-l*u,t[8]=h,t[1]=m+g*h,t[5]=d-x*h,t[9]=-o*l,t[2]=x-d*h,t[6]=g+m*h,t[10]=a*l}else if(e.order==="YXZ"){let d=l*c,m=l*u,g=h*c,x=h*u;t[0]=d+x*o,t[4]=g*o-m,t[8]=a*h,t[1]=a*u,t[5]=a*c,t[9]=-o,t[2]=m*o-g,t[6]=x+d*o,t[10]=a*l}else if(e.order==="ZXY"){let d=l*c,m=l*u,g=h*c,x=h*u;t[0]=d-x*o,t[4]=-a*u,t[8]=g+m*o,t[1]=m+g*o,t[5]=a*c,t[9]=x-d*o,t[2]=-a*h,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let d=a*c,m=a*u,g=o*c,x=o*u;t[0]=l*c,t[4]=g*h-m,t[8]=d*h+x,t[1]=l*u,t[5]=x*h+d,t[9]=m*h-g,t[2]=-h,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let d=a*l,m=a*h,g=o*l,x=o*h;t[0]=l*c,t[4]=x-d*u,t[8]=g*u+m,t[1]=u,t[5]=a*c,t[9]=-o*c,t[2]=-h*c,t[6]=m*u+g,t[10]=d-x*u}else if(e.order==="XZY"){let d=a*l,m=a*h,g=o*l,x=o*h;t[0]=l*c,t[4]=-u,t[8]=h*c,t[1]=d*u+x,t[5]=a*c,t[9]=m*u-g,t[2]=g*u-m,t[6]=o*c,t[10]=x*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(pm,e,mm)}lookAt(e,t,n){let s=this.elements;return an.subVectors(e,t),an.lengthSq()===0&&(an.z=1),an.normalize(),Si.crossVectors(n,an),Si.lengthSq()===0&&(Math.abs(n.z)===1?an.x+=1e-4:an.z+=1e-4,an.normalize(),Si.crossVectors(n,an)),Si.normalize(),pa.crossVectors(an,Si),s[0]=Si.x,s[4]=pa.x,s[8]=an.x,s[1]=Si.y,s[5]=pa.y,s[9]=an.y,s[2]=Si.z,s[6]=pa.z,s[10]=an.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],h=n[12],c=n[1],u=n[5],d=n[9],m=n[13],g=n[2],x=n[6],p=n[10],f=n[14],S=n[3],w=n[7],v=n[11],I=n[15],C=s[0],E=s[4],A=s[8],_=s[12],y=s[1],P=s[5],H=s[9],R=s[13],O=s[2],z=s[6],k=s[10],Z=s[14],G=s[3],se=s[7],ee=s[11],de=s[15];return r[0]=a*C+o*y+l*O+h*G,r[4]=a*E+o*P+l*z+h*se,r[8]=a*A+o*H+l*k+h*ee,r[12]=a*_+o*R+l*Z+h*de,r[1]=c*C+u*y+d*O+m*G,r[5]=c*E+u*P+d*z+m*se,r[9]=c*A+u*H+d*k+m*ee,r[13]=c*_+u*R+d*Z+m*de,r[2]=g*C+x*y+p*O+f*G,r[6]=g*E+x*P+p*z+f*se,r[10]=g*A+x*H+p*k+f*ee,r[14]=g*_+x*R+p*Z+f*de,r[3]=S*C+w*y+v*O+I*G,r[7]=S*E+w*P+v*z+I*se,r[11]=S*A+w*H+v*k+I*ee,r[15]=S*_+w*R+v*Z+I*de,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],h=e[13],c=e[2],u=e[6],d=e[10],m=e[14],g=e[3],x=e[7],p=e[11],f=e[15];return g*(+r*l*u-s*h*u-r*o*d+n*h*d+s*o*m-n*l*m)+x*(+t*l*m-t*h*d+r*a*d-s*a*m+s*h*c-r*l*c)+p*(+t*h*u-t*o*m-r*a*u+n*a*m+r*o*c-n*h*c)+f*(-s*o*c-t*l*u+t*o*d+s*a*u-n*a*d+n*l*c)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],h=e[7],c=e[8],u=e[9],d=e[10],m=e[11],g=e[12],x=e[13],p=e[14],f=e[15],S=u*p*h-x*d*h+x*l*m-o*p*m-u*l*f+o*d*f,w=g*d*h-c*p*h-g*l*m+a*p*m+c*l*f-a*d*f,v=c*x*h-g*u*h+g*o*m-a*x*m-c*o*f+a*u*f,I=g*u*l-c*x*l-g*o*d+a*x*d+c*o*p-a*u*p,C=t*S+n*w+s*v+r*I;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let E=1/C;return e[0]=S*E,e[1]=(x*d*r-u*p*r-x*s*m+n*p*m+u*s*f-n*d*f)*E,e[2]=(o*p*r-x*l*r+x*s*h-n*p*h-o*s*f+n*l*f)*E,e[3]=(u*l*r-o*d*r-u*s*h+n*d*h+o*s*m-n*l*m)*E,e[4]=w*E,e[5]=(c*p*r-g*d*r+g*s*m-t*p*m-c*s*f+t*d*f)*E,e[6]=(g*l*r-a*p*r-g*s*h+t*p*h+a*s*f-t*l*f)*E,e[7]=(a*d*r-c*l*r+c*s*h-t*d*h-a*s*m+t*l*m)*E,e[8]=v*E,e[9]=(g*u*r-c*x*r-g*n*m+t*x*m+c*n*f-t*u*f)*E,e[10]=(a*x*r-g*o*r+g*n*h-t*x*h-a*n*f+t*o*f)*E,e[11]=(c*o*r-a*u*r-c*n*h+t*u*h+a*n*m-t*o*m)*E,e[12]=I*E,e[13]=(c*x*s-g*u*s+g*n*d-t*x*d-c*n*p+t*u*p)*E,e[14]=(g*o*s-a*x*s-g*n*l+t*x*l+a*n*p-t*o*p)*E,e[15]=(a*u*s-c*o*s+c*n*l-t*u*l-a*n*d+t*o*d)*E,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,h=r*a,c=r*o;return this.set(h*a+n,h*o-s*l,h*l+s*o,0,h*o+s*l,c*o+n,c*l-s*a,0,h*l-s*o,c*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,h=r+r,c=a+a,u=o+o,d=r*h,m=r*c,g=r*u,x=a*c,p=a*u,f=o*u,S=l*h,w=l*c,v=l*u,I=n.x,C=n.y,E=n.z;return s[0]=(1-(x+f))*I,s[1]=(m+v)*I,s[2]=(g-w)*I,s[3]=0,s[4]=(m-v)*C,s[5]=(1-(d+f))*C,s[6]=(p+S)*C,s[7]=0,s[8]=(g+w)*E,s[9]=(p-S)*E,s[10]=(1-(d+x))*E,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements,r=Ms.set(s[0],s[1],s[2]).length(),a=Ms.set(s[4],s[5],s[6]).length(),o=Ms.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],Ln.copy(this);let h=1/r,c=1/a,u=1/o;return Ln.elements[0]*=h,Ln.elements[1]*=h,Ln.elements[2]*=h,Ln.elements[4]*=c,Ln.elements[5]*=c,Ln.elements[6]*=c,Ln.elements[8]*=u,Ln.elements[9]*=u,Ln.elements[10]*=u,t.setFromRotationMatrix(Ln),n.x=r,n.y=a,n.z=o,this}makePerspective(e,t,n,s,r,a,o=ai){let l=this.elements,h=2*r/(t-e),c=2*r/(n-s),u=(t+e)/(t-e),d=(n+s)/(n-s),m,g;if(o===ai)m=-(a+r)/(a-r),g=-2*a*r/(a-r);else if(o===Ba)m=-a/(a-r),g=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=c,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=ai){let l=this.elements,h=1/(t-e),c=1/(n-s),u=1/(a-r),d=(t+e)*h,m=(n+s)*c,g,x;if(o===ai)g=(a+r)*u,x=-2*u;else if(o===Ba)g=r*u,x=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*h,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*c,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=x,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Ms=new L,Ln=new He,pm=new L(0,0,0),mm=new L(1,1,1),Si=new L,pa=new L,an=new L,Lu=new He,Du=new Wt,Pt=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],h=s[5],c=s[9],u=s[2],d=s[6],m=s[10];switch(t){case"XYZ":this._y=Math.asin(tn(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-c,m),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,h),this._z=0);break;case"YXZ":this._x=Math.asin(-tn(c,-1,1)),Math.abs(c)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(l,h)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(tn(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,m),this._z=Math.atan2(-a,h)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-tn(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,h));break;case"YZX":this._z=Math.asin(tn(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-c,h),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-tn(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,h),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-c,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Lu.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Lu,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Du.setFromEuler(this),this.setFromQuaternion(Du,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Pt.DEFAULT_ORDER="XYZ";var Ha=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},gm=0,Uu=new L,bs=new Wt,ti=new He,ma=new L,yr=new L,xm=new L,vm=new Wt,Nu=new L(1,0,0),Fu=new L(0,1,0),Bu=new L(0,0,1),ku={type:"added"},ym={type:"removed"},Ss={type:"childadded",child:null},fl={type:"childremoved",child:null},$t=class i extends Pi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:gm++}),this.uuid=Lr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new L,t=new Pt,n=new Wt,s=new L(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new He},normalMatrix:{value:new Ie}}),this.matrix=new He,this.matrixWorld=new He,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ha,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return bs.setFromAxisAngle(e,t),this.quaternion.multiply(bs),this}rotateOnWorldAxis(e,t){return bs.setFromAxisAngle(e,t),this.quaternion.premultiply(bs),this}rotateX(e){return this.rotateOnAxis(Nu,e)}rotateY(e){return this.rotateOnAxis(Fu,e)}rotateZ(e){return this.rotateOnAxis(Bu,e)}translateOnAxis(e,t){return Uu.copy(e).applyQuaternion(this.quaternion),this.position.add(Uu.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Nu,e)}translateY(e){return this.translateOnAxis(Fu,e)}translateZ(e){return this.translateOnAxis(Bu,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ti.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?ma.copy(e):ma.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),yr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ti.lookAt(yr,ma,this.up):ti.lookAt(ma,yr,this.up),this.quaternion.setFromRotationMatrix(ti),s&&(ti.extractRotation(s.matrixWorld),bs.setFromRotationMatrix(ti),this.quaternion.premultiply(bs.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(ku),Ss.child=e,this.dispatchEvent(Ss),Ss.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(ym),fl.child=e,this.dispatchEvent(fl),fl.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ti.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ti.multiply(e.parent.matrixWorld)),e.applyMatrix4(ti),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(ku),Ss.child=e,this.dispatchEvent(Ss),Ss.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(yr,e,xm),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(yr,vm,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let h=0,c=l.length;h<c;h++){let u=l[h];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,h=this.material.length;l<h;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),h=a(e.textures),c=a(e.images),u=a(e.shapes),d=a(e.skeletons),m=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),h.length>0&&(n.textures=h),c.length>0&&(n.images=c),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){let l=[];for(let h in o){let c=o[h];delete c.metadata,l.push(c)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}};$t.DEFAULT_UP=new L(0,1,0);$t.DEFAULT_MATRIX_AUTO_UPDATE=!0;$t.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Dn=new L,ni=new L,pl=new L,ii=new L,ws=new L,Es=new L,Ou=new L,ml=new L,gl=new L,xl=new L,vl=new ct,yl=new ct,_l=new ct,Yi=class i{constructor(e=new L,t=new L,n=new L){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),Dn.subVectors(e,t),s.cross(Dn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){Dn.subVectors(s,t),ni.subVectors(n,t),pl.subVectors(e,t);let a=Dn.dot(Dn),o=Dn.dot(ni),l=Dn.dot(pl),h=ni.dot(ni),c=ni.dot(pl),u=a*h-o*o;if(u===0)return r.set(0,0,0),null;let d=1/u,m=(h*l-o*c)*d,g=(a*c-o*l)*d;return r.set(1-m-g,g,m)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,ii)===null?!1:ii.x>=0&&ii.y>=0&&ii.x+ii.y<=1}static getInterpolation(e,t,n,s,r,a,o,l){return this.getBarycoord(e,t,n,s,ii)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,ii.x),l.addScaledVector(a,ii.y),l.addScaledVector(o,ii.z),l)}static getInterpolatedAttribute(e,t,n,s,r,a){return vl.setScalar(0),yl.setScalar(0),_l.setScalar(0),vl.fromBufferAttribute(e,t),yl.fromBufferAttribute(e,n),_l.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(vl,r.x),a.addScaledVector(yl,r.y),a.addScaledVector(_l,r.z),a}static isFrontFacing(e,t,n,s){return Dn.subVectors(n,t),ni.subVectors(e,t),Dn.cross(ni).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Dn.subVectors(this.c,this.b),ni.subVectors(this.a,this.b),Dn.cross(ni).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,a,o;ws.subVectors(s,n),Es.subVectors(r,n),ml.subVectors(e,n);let l=ws.dot(ml),h=Es.dot(ml);if(l<=0&&h<=0)return t.copy(n);gl.subVectors(e,s);let c=ws.dot(gl),u=Es.dot(gl);if(c>=0&&u<=c)return t.copy(s);let d=l*u-c*h;if(d<=0&&l>=0&&c<=0)return a=l/(l-c),t.copy(n).addScaledVector(ws,a);xl.subVectors(e,r);let m=ws.dot(xl),g=Es.dot(xl);if(g>=0&&m<=g)return t.copy(r);let x=m*h-l*g;if(x<=0&&h>=0&&g<=0)return o=h/(h-g),t.copy(n).addScaledVector(Es,o);let p=c*g-m*u;if(p<=0&&u-c>=0&&m-g>=0)return Ou.subVectors(r,s),o=(u-c)/(u-c+(m-g)),t.copy(s).addScaledVector(Ou,o);let f=1/(p+x+d);return a=x*f,o=d*f,t.copy(n).addScaledVector(ws,a).addScaledVector(Es,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Dd={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},wi={h:0,s:0,l:0},ga={h:0,s:0,l:0};function Ml(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var xe=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=yn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ze.toWorkingColorSpace(this,t),this}setRGB(e,t,n,s=Ze.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ze.toWorkingColorSpace(this,s),this}setHSL(e,t,n,s=Ze.workingColorSpace){if(e=am(e,1),t=tn(t,0,1),n=tn(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Ml(a,r,e+1/3),this.g=Ml(a,r,e),this.b=Ml(a,r,e-1/3)}return Ze.toWorkingColorSpace(this,s),this}setStyle(e,t=yn){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=yn){let n=Dd[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=oi(e.r),this.g=oi(e.g),this.b=oi(e.b),this}copyLinearToSRGB(e){return this.r=Us(e.r),this.g=Us(e.g),this.b=Us(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=yn){return Ze.fromWorkingColorSpace(Vt.copy(this),e),Math.round(tn(Vt.r*255,0,255))*65536+Math.round(tn(Vt.g*255,0,255))*256+Math.round(tn(Vt.b*255,0,255))}getHexString(e=yn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ze.workingColorSpace){Ze.fromWorkingColorSpace(Vt.copy(this),t);let n=Vt.r,s=Vt.g,r=Vt.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,h,c=(o+a)/2;if(o===a)l=0,h=0;else{let u=a-o;switch(h=c<=.5?u/(a+o):u/(2-a-o),a){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return e.h=l,e.s=h,e.l=c,e}getRGB(e,t=Ze.workingColorSpace){return Ze.fromWorkingColorSpace(Vt.copy(this),t),e.r=Vt.r,e.g=Vt.g,e.b=Vt.b,e}getStyle(e=yn){Ze.fromWorkingColorSpace(Vt.copy(this),e);let t=Vt.r,n=Vt.g,s=Vt.b;return e!==yn?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(wi),this.setHSL(wi.h+e,wi.s+t,wi.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(wi),e.getHSL(ga);let n=sl(wi.h,ga.h,t),s=sl(wi.s,ga.s,t),r=sl(wi.l,ga.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Vt=new xe;xe.NAMES=Dd;var _m=0,Ii=class extends Pi{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:_m++}),this.uuid=Lr(),this.name="",this.blending=Ls,this.side=Ri,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Dl,this.blendDst=Ul,this.blendEquation=$i,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new xe(0,0,0),this.blendAlpha=0,this.depthFunc=Fs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=bu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=gs,this.stencilZFail=gs,this.stencilZPass=gs,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Ls&&(n.blending=this.blending),this.side!==Ri&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Dl&&(n.blendSrc=this.blendSrc),this.blendDst!==Ul&&(n.blendDst=this.blendDst),this.blendEquation!==$i&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Fs&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==bu&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==gs&&(n.stencilFail=this.stencilFail),this.stencilZFail!==gs&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==gs&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},un=class extends Ii{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new xe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Pt,this.combine=oo,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Ct=new L,xa=new ze,cn=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Su,this.updateRanges=[],this.gpuType=$n,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)xa.fromBufferAttribute(this,t),xa.applyMatrix3(e),this.setXY(t,xa.x,xa.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Ct.fromBufferAttribute(this,t),Ct.applyMatrix3(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Ct.fromBufferAttribute(this,t),Ct.applyMatrix4(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Ct.fromBufferAttribute(this,t),Ct.applyNormalMatrix(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Ct.fromBufferAttribute(this,t),Ct.transformDirection(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=gr(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=en(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=gr(t,this.array)),t}setX(e,t){return this.normalized&&(t=en(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=gr(t,this.array)),t}setY(e,t){return this.normalized&&(t=en(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=gr(t,this.array)),t}setZ(e,t){return this.normalized&&(t=en(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=gr(t,this.array)),t}setW(e,t){return this.normalized&&(t=en(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=en(t,this.array),n=en(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=en(t,this.array),n=en(n,this.array),s=en(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=en(t,this.array),n=en(n,this.array),s=en(s,this.array),r=en(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Su&&(e.usage=this.usage),e}};var Hs=class extends cn{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Va=class extends cn{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var it=class extends cn{constructor(e,t,n){super(new Float32Array(e),t,n)}},Mm=0,vn=new He,bl=new $t,Ts=new L,on=new hi,_r=new hi,Bt=new L,Yt=class i extends Pi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Mm++}),this.uuid=Lr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Ld(e)?Va:Hs)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Ie().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return vn.makeRotationFromQuaternion(e),this.applyMatrix4(vn),this}rotateX(e){return vn.makeRotationX(e),this.applyMatrix4(vn),this}rotateY(e){return vn.makeRotationY(e),this.applyMatrix4(vn),this}rotateZ(e){return vn.makeRotationZ(e),this.applyMatrix4(vn),this}translate(e,t,n){return vn.makeTranslation(e,t,n),this.applyMatrix4(vn),this}scale(e,t,n){return vn.makeScale(e,t,n),this.applyMatrix4(vn),this}lookAt(e){return bl.lookAt(e),bl.updateMatrix(),this.applyMatrix4(bl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ts).negate(),this.translate(Ts.x,Ts.y,Ts.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new it(n,3))}else{for(let n=0,s=t.count;n<s;n++){let r=e[n];t.setXYZ(n,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new hi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];on.setFromBufferAttribute(r),this.morphTargetsRelative?(Bt.addVectors(this.boundingBox.min,on.min),this.boundingBox.expandByPoint(Bt),Bt.addVectors(this.boundingBox.max,on.max),this.boundingBox.expandByPoint(Bt)):(this.boundingBox.expandByPoint(on.min),this.boundingBox.expandByPoint(on.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Qi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new L,1/0);return}if(e){let n=this.boundingSphere.center;if(on.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];_r.setFromBufferAttribute(o),this.morphTargetsRelative?(Bt.addVectors(on.min,_r.min),on.expandByPoint(Bt),Bt.addVectors(on.max,_r.max),on.expandByPoint(Bt)):(on.expandByPoint(_r.min),on.expandByPoint(_r.max))}on.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)Bt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Bt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let h=0,c=o.count;h<c;h++)Bt.fromBufferAttribute(o,h),l&&(Ts.fromBufferAttribute(e,h),Bt.add(Ts)),s=Math.max(s,n.distanceToSquared(Bt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new cn(new Float32Array(4*n.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let A=0;A<n.count;A++)o[A]=new L,l[A]=new L;let h=new L,c=new L,u=new L,d=new ze,m=new ze,g=new ze,x=new L,p=new L;function f(A,_,y){h.fromBufferAttribute(n,A),c.fromBufferAttribute(n,_),u.fromBufferAttribute(n,y),d.fromBufferAttribute(r,A),m.fromBufferAttribute(r,_),g.fromBufferAttribute(r,y),c.sub(h),u.sub(h),m.sub(d),g.sub(d);let P=1/(m.x*g.y-g.x*m.y);isFinite(P)&&(x.copy(c).multiplyScalar(g.y).addScaledVector(u,-m.y).multiplyScalar(P),p.copy(u).multiplyScalar(m.x).addScaledVector(c,-g.x).multiplyScalar(P),o[A].add(x),o[_].add(x),o[y].add(x),l[A].add(p),l[_].add(p),l[y].add(p))}let S=this.groups;S.length===0&&(S=[{start:0,count:e.count}]);for(let A=0,_=S.length;A<_;++A){let y=S[A],P=y.start,H=y.count;for(let R=P,O=P+H;R<O;R+=3)f(e.getX(R+0),e.getX(R+1),e.getX(R+2))}let w=new L,v=new L,I=new L,C=new L;function E(A){I.fromBufferAttribute(s,A),C.copy(I);let _=o[A];w.copy(_),w.sub(I.multiplyScalar(I.dot(_))).normalize(),v.crossVectors(C,_);let P=v.dot(l[A])<0?-1:1;a.setXYZW(A,w.x,w.y,w.z,P)}for(let A=0,_=S.length;A<_;++A){let y=S[A],P=y.start,H=y.count;for(let R=P,O=P+H;R<O;R+=3)E(e.getX(R+0)),E(e.getX(R+1)),E(e.getX(R+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new cn(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,m=n.count;d<m;d++)n.setXYZ(d,0,0,0);let s=new L,r=new L,a=new L,o=new L,l=new L,h=new L,c=new L,u=new L;if(e)for(let d=0,m=e.count;d<m;d+=3){let g=e.getX(d+0),x=e.getX(d+1),p=e.getX(d+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,x),a.fromBufferAttribute(t,p),c.subVectors(a,r),u.subVectors(s,r),c.cross(u),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,x),h.fromBufferAttribute(n,p),o.add(c),l.add(c),h.add(c),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(p,h.x,h.y,h.z)}else for(let d=0,m=t.count;d<m;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),c.subVectors(a,r),u.subVectors(s,r),c.cross(u),n.setXYZ(d+0,c.x,c.y,c.z),n.setXYZ(d+1,c.x,c.y,c.z),n.setXYZ(d+2,c.x,c.y,c.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Bt.fromBufferAttribute(e,t),Bt.normalize(),e.setXYZ(t,Bt.x,Bt.y,Bt.z)}toNonIndexed(){function e(o,l){let h=o.array,c=o.itemSize,u=o.normalized,d=new h.constructor(l.length*c),m=0,g=0;for(let x=0,p=l.length;x<p;x++){o.isInterleavedBufferAttribute?m=l[x]*o.data.stride+o.offset:m=l[x]*c;for(let f=0;f<c;f++)d[g++]=h[m++]}return new cn(d,c,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],h=e(l,n);t.setAttribute(o,h)}let r=this.morphAttributes;for(let o in r){let l=[],h=r[o];for(let c=0,u=h.length;c<u;c++){let d=h[c],m=e(d,n);l.push(m)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let h=a[o];t.addGroup(h.start,h.count,h.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let h in l)l[h]!==void 0&&(e[h]=l[h]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let h=n[l];e.data.attributes[l]=h.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let h=this.morphAttributes[l],c=[];for(let u=0,d=h.length;u<d;u++){let m=h[u];c.push(m.toJSON(e.data))}c.length>0&&(s[l]=c,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone(t));let s=e.attributes;for(let h in s){let c=s[h];this.setAttribute(h,c.clone(t))}let r=e.morphAttributes;for(let h in r){let c=[],u=r[h];for(let d=0,m=u.length;d<m;d++)c.push(u[d].clone(t));this.morphAttributes[h]=c}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let h=0,c=a.length;h<c;h++){let u=a[h];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},zu=new He,Vi=new Sc,va=new Qi,Hu=new L,ya=new L,_a=new L,Ma=new L,Sl=new L,ba=new L,Vu=new L,Sa=new L,St=class extends $t{constructor(e=new Yt,t=new un){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){ba.set(0,0,0);for(let l=0,h=r.length;l<h;l++){let c=o[l],u=r[l];c!==0&&(Sl.fromBufferAttribute(u,e),a?ba.addScaledVector(Sl,c):ba.addScaledVector(Sl.sub(t),c))}t.add(ba)}return t}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),va.copy(n.boundingSphere),va.applyMatrix4(r),Vi.copy(e.ray).recast(e.near),!(va.containsPoint(Vi.origin)===!1&&(Vi.intersectSphere(va,Hu)===null||Vi.origin.distanceToSquared(Hu)>(e.far-e.near)**2))&&(zu.copy(r).invert(),Vi.copy(e.ray).applyMatrix4(zu),!(n.boundingBox!==null&&Vi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Vi)))}_computeIntersections(e,t,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,h=r.attributes.uv,c=r.attributes.uv1,u=r.attributes.normal,d=r.groups,m=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,x=d.length;g<x;g++){let p=d[g],f=a[p.materialIndex],S=Math.max(p.start,m.start),w=Math.min(o.count,Math.min(p.start+p.count,m.start+m.count));for(let v=S,I=w;v<I;v+=3){let C=o.getX(v),E=o.getX(v+1),A=o.getX(v+2);s=wa(this,f,e,n,h,c,u,C,E,A),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let g=Math.max(0,m.start),x=Math.min(o.count,m.start+m.count);for(let p=g,f=x;p<f;p+=3){let S=o.getX(p),w=o.getX(p+1),v=o.getX(p+2);s=wa(this,a,e,n,h,c,u,S,w,v),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,x=d.length;g<x;g++){let p=d[g],f=a[p.materialIndex],S=Math.max(p.start,m.start),w=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let v=S,I=w;v<I;v+=3){let C=v,E=v+1,A=v+2;s=wa(this,f,e,n,h,c,u,C,E,A),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let g=Math.max(0,m.start),x=Math.min(l.count,m.start+m.count);for(let p=g,f=x;p<f;p+=3){let S=p,w=p+1,v=p+2;s=wa(this,a,e,n,h,c,u,S,w,v),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}}};function bm(i,e,t,n,s,r,a,o){let l;if(e.side===nn?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,e.side===Ri,o),l===null)return null;Sa.copy(o),Sa.applyMatrix4(i.matrixWorld);let h=t.ray.origin.distanceTo(Sa);return h<t.near||h>t.far?null:{distance:h,point:Sa.clone(),object:i}}function wa(i,e,t,n,s,r,a,o,l,h){i.getVertexPosition(o,ya),i.getVertexPosition(l,_a),i.getVertexPosition(h,Ma);let c=bm(i,e,t,n,ya,_a,Ma,Vu);if(c){let u=new L;Yi.getBarycoord(Vu,ya,_a,Ma,u),s&&(c.uv=Yi.getInterpolatedAttribute(s,o,l,h,u,new ze)),r&&(c.uv1=Yi.getInterpolatedAttribute(r,o,l,h,u,new ze)),a&&(c.normal=Yi.getInterpolatedAttribute(a,o,l,h,u,new L),c.normal.dot(n.direction)>0&&c.normal.multiplyScalar(-1));let d={a:o,b:l,c:h,normal:new L,materialIndex:0};Yi.getNormal(ya,_a,Ma,d.normal),c.face=d,c.barycoord=u}return c}var es=class i extends Yt{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],h=[],c=[],u=[],d=0,m=0;g("z","y","x",-1,-1,n,t,e,a,r,0),g("z","y","x",1,-1,n,t,-e,a,r,1),g("x","z","y",1,1,e,n,t,s,a,2),g("x","z","y",1,-1,e,n,-t,s,a,3),g("x","y","z",1,-1,e,t,n,s,r,4),g("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new it(h,3)),this.setAttribute("normal",new it(c,3)),this.setAttribute("uv",new it(u,2));function g(x,p,f,S,w,v,I,C,E,A,_){let y=v/E,P=I/A,H=v/2,R=I/2,O=C/2,z=E+1,k=A+1,Z=0,G=0,se=new L;for(let ee=0;ee<k;ee++){let de=ee*P-R;for(let De=0;De<z;De++){let et=De*y-H;se[x]=et*S,se[p]=de*w,se[f]=O,h.push(se.x,se.y,se.z),se[x]=0,se[p]=0,se[f]=C>0?1:-1,c.push(se.x,se.y,se.z),u.push(De/E),u.push(1-ee/A),Z+=1}}for(let ee=0;ee<A;ee++)for(let de=0;de<E;de++){let De=d+de+z*ee,et=d+de+z*(ee+1),$=d+(de+1)+z*(ee+1),ie=d+(de+1)+z*ee;l.push(De,et,ie),l.push(et,$,ie),G+=6}o.addGroup(m,G,_),m+=G,d+=Z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Vs(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function qt(i){let e={};for(let t=0;t<i.length;t++){let n=Vs(i[t]);for(let s in n)e[s]=n[s]}return e}function Sm(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Ud(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ze.workingColorSpace}var wm={clone:Vs,merge:qt},Em=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Tm=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Yn=class extends Ii{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Em,this.fragmentShader=Tm,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Vs(e.uniforms),this.uniformsGroups=Sm(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},Ga=class extends $t{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new He,this.projectionMatrix=new He,this.projectionMatrixInverse=new He,this.coordinateSystem=ai}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Ei=new L,Gu=new ze,Wu=new ze,Gt=class extends Ga{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=yc*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(il*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return yc*2*Math.atan(Math.tan(il*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Ei.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Ei.x,Ei.y).multiplyScalar(-e/Ei.z),Ei.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Ei.x,Ei.y).multiplyScalar(-e/Ei.z)}getViewSize(e,t){return this.getViewBounds(e,Gu,Wu),t.subVectors(Wu,Gu)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(il*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,h=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*n/h,s*=a.width/l,n*=a.height/h}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},As=-90,Cs=1,wc=class extends $t{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Gt(As,Cs,e,t);s.layers=this.layers,this.add(s);let r=new Gt(As,Cs,e,t);r.layers=this.layers,this.add(r);let a=new Gt(As,Cs,e,t);a.layers=this.layers,this.add(a);let o=new Gt(As,Cs,e,t);o.layers=this.layers,this.add(o);let l=new Gt(As,Cs,e,t);l.layers=this.layers,this.add(l);let h=new Gt(As,Cs,e,t);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,l]=t;for(let h of t)this.remove(h);if(e===ai)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Ba)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let h of t)this.add(h),h.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,h,c]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,a),e.setRenderTarget(n,2,s),e.render(t,o),e.setRenderTarget(n,3,s),e.render(t,l),e.setRenderTarget(n,4,s),e.render(t,h),n.texture.generateMipmaps=x,e.setRenderTarget(n,5,s),e.render(t,c),e.setRenderTarget(u,d,m),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},Wa=class extends hn{constructor(e,t,n,s,r,a,o,l,h,c){e=e!==void 0?e:[],t=t!==void 0?t:Bs,super(e,t,n,s,r,a,o,l,h,c),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Ec=class extends ci{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new Wa(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:qn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new es(5,5,5),r=new Yn({name:"CubemapFromEquirect",uniforms:Vs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:nn,blending:Ai});r.uniforms.tEquirect.value=t;let a=new St(s,r),o=t.minFilter;return t.minFilter===Ji&&(t.minFilter=qn),new wc(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,s){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}},wl=new L,Am=new L,Cm=new Ie,ri=class{constructor(e=new L(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=wl.subVectors(n,t).cross(Am.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(wl),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Cm.getNormalMatrix(e),s=this.coplanarPoint(wl).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Gi=new Qi,Ea=new L,Rr=class{constructor(e=new ri,t=new ri,n=new ri,s=new ri,r=new ri,a=new ri){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=ai){let n=this.planes,s=e.elements,r=s[0],a=s[1],o=s[2],l=s[3],h=s[4],c=s[5],u=s[6],d=s[7],m=s[8],g=s[9],x=s[10],p=s[11],f=s[12],S=s[13],w=s[14],v=s[15];if(n[0].setComponents(l-r,d-h,p-m,v-f).normalize(),n[1].setComponents(l+r,d+h,p+m,v+f).normalize(),n[2].setComponents(l+a,d+c,p+g,v+S).normalize(),n[3].setComponents(l-a,d-c,p-g,v-S).normalize(),n[4].setComponents(l-o,d-u,p-x,v-w).normalize(),t===ai)n[5].setComponents(l+o,d+u,p+x,v+w).normalize();else if(t===Ba)n[5].setComponents(o,u,x,w).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Gi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Gi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Gi)}intersectsSprite(e){return Gi.center.set(0,0,0),Gi.radius=.7071067811865476,Gi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Gi)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(Ea.x=s.normal.x>0?e.max.x:e.min.x,Ea.y=s.normal.y>0?e.max.y:e.min.y,Ea.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Ea)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function Nd(){let i=null,e=!1,t=null,n=null;function s(r,a){t(r,a),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Rm(i){let e=new WeakMap;function t(o,l){let h=o.array,c=o.usage,u=h.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,h,c),o.onUploadCallback();let m;if(h instanceof Float32Array)m=i.FLOAT;else if(h instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(h instanceof Int16Array)m=i.SHORT;else if(h instanceof Uint32Array)m=i.UNSIGNED_INT;else if(h instanceof Int32Array)m=i.INT;else if(h instanceof Int8Array)m=i.BYTE;else if(h instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:d,type:m,bytesPerElement:h.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,l,h){let c=l.array,u=l.updateRanges;if(i.bindBuffer(h,o),u.length===0)i.bufferSubData(h,0,c);else{u.sort((m,g)=>m.start-g.start);let d=0;for(let m=1;m<u.length;m++){let g=u[d],x=u[m];x.start<=g.start+g.count+1?g.count=Math.max(g.count,x.start+x.count-g.start):(++d,u[d]=x)}u.length=d+1;for(let m=0,g=u.length;m<g;m++){let x=u[m];i.bufferSubData(h,x.start*c.BYTES_PER_ELEMENT,c,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let c=e.get(o);(!c||c.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let h=e.get(o);if(h===void 0)e.set(o,t(o,l));else if(h.version<o.version){if(h.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(h.buffer,o,l),h.version=o.version}}return{get:s,remove:r,update:a}}var ts=class i extends Yt{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(s),h=o+1,c=l+1,u=e/o,d=t/l,m=[],g=[],x=[],p=[];for(let f=0;f<c;f++){let S=f*d-a;for(let w=0;w<h;w++){let v=w*u-r;g.push(v,-S,0),x.push(0,0,1),p.push(w/o),p.push(1-f/l)}}for(let f=0;f<l;f++)for(let S=0;S<o;S++){let w=S+h*f,v=S+h*(f+1),I=S+1+h*(f+1),C=S+1+h*f;m.push(w,v,C),m.push(v,I,C)}this.setIndex(m),this.setAttribute("position",new it(g,3)),this.setAttribute("normal",new it(x,3)),this.setAttribute("uv",new it(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}},Pm=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Im=`#ifdef USE_ALPHAHASH
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
#endif`,Lm=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Dm=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Um=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Nm=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Fm=`#ifdef USE_AOMAP
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
#endif`,Bm=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,km=`#ifdef USE_BATCHING
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
#endif`,Om=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,zm=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Hm=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Vm=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Gm=`#ifdef USE_IRIDESCENCE
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
#endif`,Wm=`#ifdef USE_BUMPMAP
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
#endif`,Xm=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,qm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,$m=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Ym=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Zm=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Km=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Jm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,jm=`#if defined( USE_COLOR_ALPHA )
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
#endif`,Qm=`#define PI 3.141592653589793
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
} // validated`,eg=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,tg=`vec3 transformedNormal = objectNormal;
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
#endif`,ng=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,ig=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,sg=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,rg=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,ag="gl_FragColor = linearToOutputTexel( gl_FragColor );",og=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,lg=`#ifdef USE_ENVMAP
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
#endif`,cg=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,hg=`#ifdef USE_ENVMAP
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
#endif`,ug=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,dg=`#ifdef USE_ENVMAP
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
#endif`,fg=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,pg=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,mg=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,gg=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,xg=`#ifdef USE_GRADIENTMAP
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
}`,vg=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,yg=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,_g=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Mg=`uniform bool receiveShadow;
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
#endif`,bg=`#ifdef USE_ENVMAP
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
#endif`,Sg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,wg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Eg=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Tg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Ag=`PhysicalMaterial material;
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
#endif`,Cg=`struct PhysicalMaterial {
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
}`,Rg=`
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
#endif`,Pg=`#if defined( RE_IndirectDiffuse )
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
#endif`,Ig=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Lg=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Dg=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ug=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ng=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Fg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Bg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,kg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Og=`#if defined( USE_POINTS_UV )
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
#endif`,zg=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Hg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Vg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Gg=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Wg=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Xg=`#ifdef USE_MORPHTARGETS
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
#endif`,qg=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,$g=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Yg=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Zg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Kg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Jg=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,jg=`#ifdef USE_NORMALMAP
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
#endif`,Qg=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,e0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,t0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,n0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,i0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,s0=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,r0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,a0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,o0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,l0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,c0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,h0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,u0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,d0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,f0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,p0=`float getShadowMask() {
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
}`,m0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,g0=`#ifdef USE_SKINNING
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
#endif`,x0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,v0=`#ifdef USE_SKINNING
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
#endif`,y0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,_0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,M0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,b0=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,S0=`#ifdef USE_TRANSMISSION
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
#endif`,w0=`#ifdef USE_TRANSMISSION
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
#endif`,E0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,T0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,A0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,C0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,R0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,P0=`uniform sampler2D t2D;
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
}`,I0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,L0=`#ifdef ENVMAP_TYPE_CUBE
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
}`,D0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,U0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,N0=`#include <common>
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
}`,F0=`#if DEPTH_PACKING == 3200
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
}`,B0=`#define DISTANCE
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
}`,k0=`#define DISTANCE
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
}`,O0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,z0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,H0=`uniform float scale;
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
}`,V0=`uniform vec3 diffuse;
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
}`,G0=`#include <common>
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
}`,W0=`uniform vec3 diffuse;
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
}`,X0=`#define LAMBERT
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
}`,q0=`#define LAMBERT
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
}`,$0=`#define MATCAP
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
}`,Y0=`#define MATCAP
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
}`,Z0=`#define NORMAL
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
}`,K0=`#define NORMAL
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
}`,J0=`#define PHONG
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
}`,j0=`#define PHONG
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
}`,Q0=`#define STANDARD
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
}`,ex=`#define STANDARD
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
}`,tx=`#define TOON
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
}`,nx=`#define TOON
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
}`,ix=`uniform float size;
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
}`,sx=`uniform vec3 diffuse;
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
}`,rx=`#include <common>
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
}`,ax=`uniform vec3 color;
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
}`,ox=`uniform float rotation;
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
}`,lx=`uniform vec3 diffuse;
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
}`,ke={alphahash_fragment:Pm,alphahash_pars_fragment:Im,alphamap_fragment:Lm,alphamap_pars_fragment:Dm,alphatest_fragment:Um,alphatest_pars_fragment:Nm,aomap_fragment:Fm,aomap_pars_fragment:Bm,batching_pars_vertex:km,batching_vertex:Om,begin_vertex:zm,beginnormal_vertex:Hm,bsdfs:Vm,iridescence_fragment:Gm,bumpmap_pars_fragment:Wm,clipping_planes_fragment:Xm,clipping_planes_pars_fragment:qm,clipping_planes_pars_vertex:$m,clipping_planes_vertex:Ym,color_fragment:Zm,color_pars_fragment:Km,color_pars_vertex:Jm,color_vertex:jm,common:Qm,cube_uv_reflection_fragment:eg,defaultnormal_vertex:tg,displacementmap_pars_vertex:ng,displacementmap_vertex:ig,emissivemap_fragment:sg,emissivemap_pars_fragment:rg,colorspace_fragment:ag,colorspace_pars_fragment:og,envmap_fragment:lg,envmap_common_pars_fragment:cg,envmap_pars_fragment:hg,envmap_pars_vertex:ug,envmap_physical_pars_fragment:bg,envmap_vertex:dg,fog_vertex:fg,fog_pars_vertex:pg,fog_fragment:mg,fog_pars_fragment:gg,gradientmap_pars_fragment:xg,lightmap_pars_fragment:vg,lights_lambert_fragment:yg,lights_lambert_pars_fragment:_g,lights_pars_begin:Mg,lights_toon_fragment:Sg,lights_toon_pars_fragment:wg,lights_phong_fragment:Eg,lights_phong_pars_fragment:Tg,lights_physical_fragment:Ag,lights_physical_pars_fragment:Cg,lights_fragment_begin:Rg,lights_fragment_maps:Pg,lights_fragment_end:Ig,logdepthbuf_fragment:Lg,logdepthbuf_pars_fragment:Dg,logdepthbuf_pars_vertex:Ug,logdepthbuf_vertex:Ng,map_fragment:Fg,map_pars_fragment:Bg,map_particle_fragment:kg,map_particle_pars_fragment:Og,metalnessmap_fragment:zg,metalnessmap_pars_fragment:Hg,morphinstance_vertex:Vg,morphcolor_vertex:Gg,morphnormal_vertex:Wg,morphtarget_pars_vertex:Xg,morphtarget_vertex:qg,normal_fragment_begin:$g,normal_fragment_maps:Yg,normal_pars_fragment:Zg,normal_pars_vertex:Kg,normal_vertex:Jg,normalmap_pars_fragment:jg,clearcoat_normal_fragment_begin:Qg,clearcoat_normal_fragment_maps:e0,clearcoat_pars_fragment:t0,iridescence_pars_fragment:n0,opaque_fragment:i0,packing:s0,premultiplied_alpha_fragment:r0,project_vertex:a0,dithering_fragment:o0,dithering_pars_fragment:l0,roughnessmap_fragment:c0,roughnessmap_pars_fragment:h0,shadowmap_pars_fragment:u0,shadowmap_pars_vertex:d0,shadowmap_vertex:f0,shadowmask_pars_fragment:p0,skinbase_vertex:m0,skinning_pars_vertex:g0,skinning_vertex:x0,skinnormal_vertex:v0,specularmap_fragment:y0,specularmap_pars_fragment:_0,tonemapping_fragment:M0,tonemapping_pars_fragment:b0,transmission_fragment:S0,transmission_pars_fragment:w0,uv_pars_fragment:E0,uv_pars_vertex:T0,uv_vertex:A0,worldpos_vertex:C0,background_vert:R0,background_frag:P0,backgroundCube_vert:I0,backgroundCube_frag:L0,cube_vert:D0,cube_frag:U0,depth_vert:N0,depth_frag:F0,distanceRGBA_vert:B0,distanceRGBA_frag:k0,equirect_vert:O0,equirect_frag:z0,linedashed_vert:H0,linedashed_frag:V0,meshbasic_vert:G0,meshbasic_frag:W0,meshlambert_vert:X0,meshlambert_frag:q0,meshmatcap_vert:$0,meshmatcap_frag:Y0,meshnormal_vert:Z0,meshnormal_frag:K0,meshphong_vert:J0,meshphong_frag:j0,meshphysical_vert:Q0,meshphysical_frag:ex,meshtoon_vert:tx,meshtoon_frag:nx,points_vert:ix,points_frag:sx,shadow_vert:rx,shadow_frag:ax,sprite_vert:ox,sprite_frag:lx},re={common:{diffuse:{value:new xe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ie},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ie}},envmap:{envMap:{value:null},envMapRotation:{value:new Ie},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ie}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ie}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ie},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ie},normalScale:{value:new ze(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ie},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ie}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ie}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ie}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new xe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new xe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0},uvTransform:{value:new Ie}},sprite:{diffuse:{value:new xe(16777215)},opacity:{value:1},center:{value:new ze(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ie},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0}}},Xn={basic:{uniforms:qt([re.common,re.specularmap,re.envmap,re.aomap,re.lightmap,re.fog]),vertexShader:ke.meshbasic_vert,fragmentShader:ke.meshbasic_frag},lambert:{uniforms:qt([re.common,re.specularmap,re.envmap,re.aomap,re.lightmap,re.emissivemap,re.bumpmap,re.normalmap,re.displacementmap,re.fog,re.lights,{emissive:{value:new xe(0)}}]),vertexShader:ke.meshlambert_vert,fragmentShader:ke.meshlambert_frag},phong:{uniforms:qt([re.common,re.specularmap,re.envmap,re.aomap,re.lightmap,re.emissivemap,re.bumpmap,re.normalmap,re.displacementmap,re.fog,re.lights,{emissive:{value:new xe(0)},specular:{value:new xe(1118481)},shininess:{value:30}}]),vertexShader:ke.meshphong_vert,fragmentShader:ke.meshphong_frag},standard:{uniforms:qt([re.common,re.envmap,re.aomap,re.lightmap,re.emissivemap,re.bumpmap,re.normalmap,re.displacementmap,re.roughnessmap,re.metalnessmap,re.fog,re.lights,{emissive:{value:new xe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ke.meshphysical_vert,fragmentShader:ke.meshphysical_frag},toon:{uniforms:qt([re.common,re.aomap,re.lightmap,re.emissivemap,re.bumpmap,re.normalmap,re.displacementmap,re.gradientmap,re.fog,re.lights,{emissive:{value:new xe(0)}}]),vertexShader:ke.meshtoon_vert,fragmentShader:ke.meshtoon_frag},matcap:{uniforms:qt([re.common,re.bumpmap,re.normalmap,re.displacementmap,re.fog,{matcap:{value:null}}]),vertexShader:ke.meshmatcap_vert,fragmentShader:ke.meshmatcap_frag},points:{uniforms:qt([re.points,re.fog]),vertexShader:ke.points_vert,fragmentShader:ke.points_frag},dashed:{uniforms:qt([re.common,re.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ke.linedashed_vert,fragmentShader:ke.linedashed_frag},depth:{uniforms:qt([re.common,re.displacementmap]),vertexShader:ke.depth_vert,fragmentShader:ke.depth_frag},normal:{uniforms:qt([re.common,re.bumpmap,re.normalmap,re.displacementmap,{opacity:{value:1}}]),vertexShader:ke.meshnormal_vert,fragmentShader:ke.meshnormal_frag},sprite:{uniforms:qt([re.sprite,re.fog]),vertexShader:ke.sprite_vert,fragmentShader:ke.sprite_frag},background:{uniforms:{uvTransform:{value:new Ie},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ke.background_vert,fragmentShader:ke.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ie}},vertexShader:ke.backgroundCube_vert,fragmentShader:ke.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ke.cube_vert,fragmentShader:ke.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ke.equirect_vert,fragmentShader:ke.equirect_frag},distanceRGBA:{uniforms:qt([re.common,re.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ke.distanceRGBA_vert,fragmentShader:ke.distanceRGBA_frag},shadow:{uniforms:qt([re.lights,re.fog,{color:{value:new xe(0)},opacity:{value:1}}]),vertexShader:ke.shadow_vert,fragmentShader:ke.shadow_frag}};Xn.physical={uniforms:qt([Xn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ie},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ie},clearcoatNormalScale:{value:new ze(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ie},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ie},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ie},sheen:{value:0},sheenColor:{value:new xe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ie},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ie},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ie},transmissionSamplerSize:{value:new ze},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ie},attenuationDistance:{value:0},attenuationColor:{value:new xe(0)},specularColor:{value:new xe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ie},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ie},anisotropyVector:{value:new ze},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ie}}]),vertexShader:ke.meshphysical_vert,fragmentShader:ke.meshphysical_frag};var Ta={r:0,b:0,g:0},Wi=new Pt,cx=new He;function hx(i,e,t,n,s,r,a){let o=new xe(0),l=r===!0?0:1,h,c,u=null,d=0,m=null;function g(S){let w=S.isScene===!0?S.background:null;return w&&w.isTexture&&(w=(S.backgroundBlurriness>0?t:e).get(w)),w}function x(S){let w=!1,v=g(S);v===null?f(o,l):v&&v.isColor&&(f(v,1),w=!0);let I=i.xr.getEnvironmentBlendMode();I==="additive"?n.buffers.color.setClear(0,0,0,1,a):I==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||w)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function p(S,w){let v=g(w);v&&(v.isCubeTexture||v.mapping===lo)?(c===void 0&&(c=new St(new es(1,1,1),new Yn({name:"BackgroundCubeMaterial",uniforms:Vs(Xn.backgroundCube.uniforms),vertexShader:Xn.backgroundCube.vertexShader,fragmentShader:Xn.backgroundCube.fragmentShader,side:nn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(I,C,E){this.matrixWorld.copyPosition(E.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(c)),Wi.copy(w.backgroundRotation),Wi.x*=-1,Wi.y*=-1,Wi.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(Wi.y*=-1,Wi.z*=-1),c.material.uniforms.envMap.value=v,c.material.uniforms.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(cx.makeRotationFromEuler(Wi)),c.material.toneMapped=Ze.getTransfer(v.colorSpace)!==lt,(u!==v||d!==v.version||m!==i.toneMapping)&&(c.material.needsUpdate=!0,u=v,d=v.version,m=i.toneMapping),c.layers.enableAll(),S.unshift(c,c.geometry,c.material,0,0,null)):v&&v.isTexture&&(h===void 0&&(h=new St(new ts(2,2),new Yn({name:"BackgroundMaterial",uniforms:Vs(Xn.background.uniforms),vertexShader:Xn.background.vertexShader,fragmentShader:Xn.background.fragmentShader,side:Ri,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),Object.defineProperty(h.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(h)),h.material.uniforms.t2D.value=v,h.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,h.material.toneMapped=Ze.getTransfer(v.colorSpace)!==lt,v.matrixAutoUpdate===!0&&v.updateMatrix(),h.material.uniforms.uvTransform.value.copy(v.matrix),(u!==v||d!==v.version||m!==i.toneMapping)&&(h.material.needsUpdate=!0,u=v,d=v.version,m=i.toneMapping),h.layers.enableAll(),S.unshift(h,h.geometry,h.material,0,0,null))}function f(S,w){S.getRGB(Ta,Ud(i)),n.buffers.color.setClear(Ta.r,Ta.g,Ta.b,w,a)}return{getClearColor:function(){return o},setClearColor:function(S,w=1){o.set(S),l=w,f(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(S){l=S,f(o,l)},render:x,addToRenderList:p}}function ux(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null),r=s,a=!1;function o(y,P,H,R,O){let z=!1,k=u(R,H,P);r!==k&&(r=k,h(r.object)),z=m(y,R,H,O),z&&g(y,R,H,O),O!==null&&e.update(O,i.ELEMENT_ARRAY_BUFFER),(z||a)&&(a=!1,v(y,P,H,R),O!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(O).buffer))}function l(){return i.createVertexArray()}function h(y){return i.bindVertexArray(y)}function c(y){return i.deleteVertexArray(y)}function u(y,P,H){let R=H.wireframe===!0,O=n[y.id];O===void 0&&(O={},n[y.id]=O);let z=O[P.id];z===void 0&&(z={},O[P.id]=z);let k=z[R];return k===void 0&&(k=d(l()),z[R]=k),k}function d(y){let P=[],H=[],R=[];for(let O=0;O<t;O++)P[O]=0,H[O]=0,R[O]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:H,attributeDivisors:R,object:y,attributes:{},index:null}}function m(y,P,H,R){let O=r.attributes,z=P.attributes,k=0,Z=H.getAttributes();for(let G in Z)if(Z[G].location>=0){let ee=O[G],de=z[G];if(de===void 0&&(G==="instanceMatrix"&&y.instanceMatrix&&(de=y.instanceMatrix),G==="instanceColor"&&y.instanceColor&&(de=y.instanceColor)),ee===void 0||ee.attribute!==de||de&&ee.data!==de.data)return!0;k++}return r.attributesNum!==k||r.index!==R}function g(y,P,H,R){let O={},z=P.attributes,k=0,Z=H.getAttributes();for(let G in Z)if(Z[G].location>=0){let ee=z[G];ee===void 0&&(G==="instanceMatrix"&&y.instanceMatrix&&(ee=y.instanceMatrix),G==="instanceColor"&&y.instanceColor&&(ee=y.instanceColor));let de={};de.attribute=ee,ee&&ee.data&&(de.data=ee.data),O[G]=de,k++}r.attributes=O,r.attributesNum=k,r.index=R}function x(){let y=r.newAttributes;for(let P=0,H=y.length;P<H;P++)y[P]=0}function p(y){f(y,0)}function f(y,P){let H=r.newAttributes,R=r.enabledAttributes,O=r.attributeDivisors;H[y]=1,R[y]===0&&(i.enableVertexAttribArray(y),R[y]=1),O[y]!==P&&(i.vertexAttribDivisor(y,P),O[y]=P)}function S(){let y=r.newAttributes,P=r.enabledAttributes;for(let H=0,R=P.length;H<R;H++)P[H]!==y[H]&&(i.disableVertexAttribArray(H),P[H]=0)}function w(y,P,H,R,O,z,k){k===!0?i.vertexAttribIPointer(y,P,H,O,z):i.vertexAttribPointer(y,P,H,R,O,z)}function v(y,P,H,R){x();let O=R.attributes,z=H.getAttributes(),k=P.defaultAttributeValues;for(let Z in z){let G=z[Z];if(G.location>=0){let se=O[Z];if(se===void 0&&(Z==="instanceMatrix"&&y.instanceMatrix&&(se=y.instanceMatrix),Z==="instanceColor"&&y.instanceColor&&(se=y.instanceColor)),se!==void 0){let ee=se.normalized,de=se.itemSize,De=e.get(se);if(De===void 0)continue;let et=De.buffer,$=De.type,ie=De.bytesPerElement,Me=$===i.INT||$===i.UNSIGNED_INT||se.gpuType===jc;if(se.isInterleavedBufferAttribute){let oe=se.data,Ae=oe.stride,Ue=se.offset;if(oe.isInstancedInterleavedBuffer){for(let Oe=0;Oe<G.locationSize;Oe++)f(G.location+Oe,oe.meshPerAttribute);y.isInstancedMesh!==!0&&R._maxInstanceCount===void 0&&(R._maxInstanceCount=oe.meshPerAttribute*oe.count)}else for(let Oe=0;Oe<G.locationSize;Oe++)p(G.location+Oe);i.bindBuffer(i.ARRAY_BUFFER,et);for(let Oe=0;Oe<G.locationSize;Oe++)w(G.location+Oe,de/G.locationSize,$,ee,Ae*ie,(Ue+de/G.locationSize*Oe)*ie,Me)}else{if(se.isInstancedBufferAttribute){for(let oe=0;oe<G.locationSize;oe++)f(G.location+oe,se.meshPerAttribute);y.isInstancedMesh!==!0&&R._maxInstanceCount===void 0&&(R._maxInstanceCount=se.meshPerAttribute*se.count)}else for(let oe=0;oe<G.locationSize;oe++)p(G.location+oe);i.bindBuffer(i.ARRAY_BUFFER,et);for(let oe=0;oe<G.locationSize;oe++)w(G.location+oe,de/G.locationSize,$,ee,de*ie,de/G.locationSize*oe*ie,Me)}}else if(k!==void 0){let ee=k[Z];if(ee!==void 0)switch(ee.length){case 2:i.vertexAttrib2fv(G.location,ee);break;case 3:i.vertexAttrib3fv(G.location,ee);break;case 4:i.vertexAttrib4fv(G.location,ee);break;default:i.vertexAttrib1fv(G.location,ee)}}}}S()}function I(){A();for(let y in n){let P=n[y];for(let H in P){let R=P[H];for(let O in R)c(R[O].object),delete R[O];delete P[H]}delete n[y]}}function C(y){if(n[y.id]===void 0)return;let P=n[y.id];for(let H in P){let R=P[H];for(let O in R)c(R[O].object),delete R[O];delete P[H]}delete n[y.id]}function E(y){for(let P in n){let H=n[P];if(H[y.id]===void 0)continue;let R=H[y.id];for(let O in R)c(R[O].object),delete R[O];delete H[y.id]}}function A(){_(),a=!0,r!==s&&(r=s,h(r.object))}function _(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:A,resetDefaultState:_,dispose:I,releaseStatesOfGeometry:C,releaseStatesOfProgram:E,initAttributes:x,enableAttribute:p,disableUnusedAttributes:S}}function dx(i,e,t){let n;function s(h){n=h}function r(h,c){i.drawArrays(n,h,c),t.update(c,n,1)}function a(h,c,u){u!==0&&(i.drawArraysInstanced(n,h,c,u),t.update(c,n,u))}function o(h,c,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,h,0,c,0,u);let m=0;for(let g=0;g<u;g++)m+=c[g];t.update(m,n,1)}function l(h,c,u,d){if(u===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<h.length;g++)a(h[g],c[g],d[g]);else{m.multiDrawArraysInstancedWEBGL(n,h,0,c,0,d,0,u);let g=0;for(let x=0;x<u;x++)g+=c[x]*d[x];t.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function fx(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let E=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(E.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(E){return!(E!==Un&&n.convert(E)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(E){let A=E===Ir&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(E!==li&&n.convert(E)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&E!==$n&&!A)}function l(E){if(E==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";E="mediump"}return E==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=t.precision!==void 0?t.precision:"highp",c=l(h);c!==h&&(console.warn("THREE.WebGLRenderer:",h,"not supported, using",c,"instead."),h=c);let u=t.logarithmicDepthBuffer===!0,d=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),f=i.getParameter(i.MAX_VERTEX_ATTRIBS),S=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),w=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),I=g>0,C=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:h,logarithmicDepthBuffer:u,reverseDepthBuffer:d,maxTextures:m,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:p,maxAttributes:f,maxVertexUniforms:S,maxVaryings:w,maxFragmentUniforms:v,vertexTextures:I,maxSamples:C}}function px(i){let e=this,t=null,n=0,s=!1,r=!1,a=new ri,o=new Ie,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let m=u.length!==0||d||n!==0||s;return s=d,n=u.length,m},this.beginShadows=function(){r=!0,c(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=c(u,d,0)},this.setState=function(u,d,m){let g=u.clippingPlanes,x=u.clipIntersection,p=u.clipShadows,f=i.get(u);if(!s||g===null||g.length===0||r&&!p)r?c(null):h();else{let S=r?0:n,w=S*4,v=f.clippingState||null;l.value=v,v=c(g,d,w,m);for(let I=0;I!==w;++I)v[I]=t[I];f.clippingState=v,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=S}};function h(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function c(u,d,m,g){let x=u!==null?u.length:0,p=null;if(x!==0){if(p=l.value,g!==!0||p===null){let f=m+x*4,S=d.matrixWorldInverse;o.getNormalMatrix(S),(p===null||p.length<f)&&(p=new Float32Array(f));for(let w=0,v=m;w!==x;++w,v+=4)a.copy(u[w]).applyMatrix4(S,o),a.normal.toArray(p,v),p[v+3]=a.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,p}}function mx(i){let e=new WeakMap;function t(a,o){return o===Vl?a.mapping=Bs:o===Gl&&(a.mapping=ks),a}function n(a){if(a&&a.isTexture){let o=a.mapping;if(o===Vl||o===Gl)if(e.has(a)){let l=e.get(a).texture;return t(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let h=new Ec(l.height);return h.fromEquirectangularTexture(i,a),e.set(a,h),a.addEventListener("dispose",s),t(h.texture,a.mapping)}else return null}}return a}function s(a){let o=a.target;o.removeEventListener("dispose",s);let l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var Xa=class extends Ga{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,a=n+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let h=(this.right-this.left)/this.view.fullWidth/this.zoom,c=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=h*this.view.offsetX,a=r+h*this.view.width,o-=c*this.view.offsetY,l=o-c*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Is=4,Xu=[.125,.215,.35,.446,.526,.582],Zi=20,El=new Xa,qu=new xe,Tl=null,Al=0,Cl=0,Rl=!1,qi=(1+Math.sqrt(5))/2,Rs=1/qi,$u=[new L(-qi,Rs,0),new L(qi,Rs,0),new L(-Rs,0,qi),new L(Rs,0,qi),new L(0,qi,-Rs),new L(0,qi,Rs),new L(-1,1,-1),new L(1,1,-1),new L(-1,1,1),new L(1,1,1)],qa=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100){Tl=this._renderer.getRenderTarget(),Al=this._renderer.getActiveCubeFace(),Cl=this._renderer.getActiveMipmapLevel(),Rl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,s,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ku(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Zu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Tl,Al,Cl),this._renderer.xr.enabled=Rl,e.scissorTest=!1,Aa(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Bs||e.mapping===ks?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Tl=this._renderer.getRenderTarget(),Al=this._renderer.getActiveCubeFace(),Cl=this._renderer.getActiveMipmapLevel(),Rl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:qn,minFilter:qn,generateMipmaps:!1,type:Ir,format:Un,colorSpace:Ws,depthBuffer:!1},s=Yu(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Yu(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=gx(r)),this._blurMaterial=xx(r,e,t)}return s}_compileMaterial(e){let t=new St(this._lodPlanes[0],e);this._renderer.compile(t,El)}_sceneToCubeUV(e,t,n,s){let o=new Gt(90,1,t,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],c=this._renderer,u=c.autoClear,d=c.toneMapping;c.getClearColor(qu),c.toneMapping=Ci,c.autoClear=!1;let m=new un({name:"PMREM.Background",side:nn,depthWrite:!1,depthTest:!1}),g=new St(new es,m),x=!1,p=e.background;p?p.isColor&&(m.color.copy(p),e.background=null,x=!0):(m.color.copy(qu),x=!0);for(let f=0;f<6;f++){let S=f%3;S===0?(o.up.set(0,l[f],0),o.lookAt(h[f],0,0)):S===1?(o.up.set(0,0,l[f]),o.lookAt(0,h[f],0)):(o.up.set(0,l[f],0),o.lookAt(0,0,h[f]));let w=this._cubeSize;Aa(s,S*w,f>2?w:0,w,w),c.setRenderTarget(s),x&&c.render(g,o),c.render(e,o)}g.geometry.dispose(),g.material.dispose(),c.toneMapping=d,c.autoClear=u,e.background=p}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===Bs||e.mapping===ks;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ku()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Zu());let r=s?this._cubemapMaterial:this._equirectMaterial,a=new St(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=e;let l=this._cubeSize;Aa(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,El)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=$u[(s-r-1)%$u.length];this._blur(e,r-1,r,a,o)}t.autoClear=n}_blur(e,t,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,s,"latitudinal",r),this._halfBlur(a,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,a,o){let l=this._renderer,h=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let c=3,u=new St(this._lodPlanes[s],h),d=h.uniforms,m=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*Zi-1),x=r/g,p=isFinite(r)?1+Math.floor(c*x):Zi;p>Zi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Zi}`);let f=[],S=0;for(let E=0;E<Zi;++E){let A=E/x,_=Math.exp(-A*A/2);f.push(_),E===0?S+=_:E<p&&(S+=2*_)}for(let E=0;E<f.length;E++)f[E]=f[E]/S;d.envMap.value=e.texture,d.samples.value=p,d.weights.value=f,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);let{_lodMax:w}=this;d.dTheta.value=g,d.mipInt.value=w-n;let v=this._sizeLods[s],I=3*v*(s>w-Is?s-w+Is:0),C=4*(this._cubeSize-v);Aa(t,I,C,3*v,2*v),l.setRenderTarget(t),l.render(u,El)}};function gx(i){let e=[],t=[],n=[],s=i,r=i-Is+1+Xu.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);t.push(o);let l=1/o;a>i-Is?l=Xu[a-i+Is-1]:a===0&&(l=0),n.push(l);let h=1/(o-2),c=-h,u=1+h,d=[c,c,u,c,u,u,c,c,u,u,c,u],m=6,g=6,x=3,p=2,f=1,S=new Float32Array(x*g*m),w=new Float32Array(p*g*m),v=new Float32Array(f*g*m);for(let C=0;C<m;C++){let E=C%3*2/3-1,A=C>2?0:-1,_=[E,A,0,E+2/3,A,0,E+2/3,A+1,0,E,A,0,E+2/3,A+1,0,E,A+1,0];S.set(_,x*g*C),w.set(d,p*g*C);let y=[C,C,C,C,C,C];v.set(y,f*g*C)}let I=new Yt;I.setAttribute("position",new cn(S,x)),I.setAttribute("uv",new cn(w,p)),I.setAttribute("faceIndex",new cn(v,f)),e.push(I),s>Is&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Yu(i,e,t){let n=new ci(i,e,t);return n.texture.mapping=lo,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Aa(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function xx(i,e,t){let n=new Float32Array(Zi),s=new L(0,1,0);return new Yn({name:"SphericalGaussianBlur",defines:{n:Zi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:ah(),fragmentShader:`

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
		`,blending:Ai,depthTest:!1,depthWrite:!1})}function Zu(){return new Yn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ah(),fragmentShader:`

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
		`,blending:Ai,depthTest:!1,depthWrite:!1})}function Ku(){return new Yn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ah(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Ai,depthTest:!1,depthWrite:!1})}function ah(){return`

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
	`}function vx(i){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){let l=o.mapping,h=l===Vl||l===Gl,c=l===Bs||l===ks;if(h||c){let u=e.get(o),d=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==d)return t===null&&(t=new qa(i)),u=h?t.fromEquirectangular(o,u):t.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),u.texture;if(u!==void 0)return u.texture;{let m=o.image;return h&&m&&m.height>0||c&&m&&s(m)?(t===null&&(t=new qa(i)),u=h?t.fromEquirectangular(o):t.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),o.addEventListener("dispose",r),u.texture):null}}}return o}function s(o){let l=0,h=6;for(let c=0;c<h;c++)o[c]!==void 0&&l++;return l===h}function r(o){let l=o.target;l.removeEventListener("dispose",r);let h=e.get(l);h!==void 0&&(e.delete(l),h.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function yx(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&wr("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function _x(i,e,t,n){let s={},r=new WeakMap;function a(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let g in d.attributes)e.remove(d.attributes[g]);for(let g in d.morphAttributes){let x=d.morphAttributes[g];for(let p=0,f=x.length;p<f;p++)e.remove(x[p])}d.removeEventListener("dispose",a),delete s[d.id];let m=r.get(d);m&&(e.remove(m),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(u,d){return s[d.id]===!0||(d.addEventListener("dispose",a),s[d.id]=!0,t.memory.geometries++),d}function l(u){let d=u.attributes;for(let g in d)e.update(d[g],i.ARRAY_BUFFER);let m=u.morphAttributes;for(let g in m){let x=m[g];for(let p=0,f=x.length;p<f;p++)e.update(x[p],i.ARRAY_BUFFER)}}function h(u){let d=[],m=u.index,g=u.attributes.position,x=0;if(m!==null){let S=m.array;x=m.version;for(let w=0,v=S.length;w<v;w+=3){let I=S[w+0],C=S[w+1],E=S[w+2];d.push(I,C,C,E,E,I)}}else if(g!==void 0){let S=g.array;x=g.version;for(let w=0,v=S.length/3-1;w<v;w+=3){let I=w+0,C=w+1,E=w+2;d.push(I,C,C,E,E,I)}}else return;let p=new(Ld(d)?Va:Hs)(d,1);p.version=x;let f=r.get(u);f&&e.remove(f),r.set(u,p)}function c(u){let d=r.get(u);if(d){let m=u.index;m!==null&&d.version<m.version&&h(u)}else h(u);return r.get(u)}return{get:o,update:l,getWireframeAttribute:c}}function Mx(i,e,t){let n;function s(d){n=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function l(d,m){i.drawElements(n,m,r,d*a),t.update(m,n,1)}function h(d,m,g){g!==0&&(i.drawElementsInstanced(n,m,r,d*a,g),t.update(m,n,g))}function c(d,m,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,m,0,r,d,0,g);let p=0;for(let f=0;f<g;f++)p+=m[f];t.update(p,n,1)}function u(d,m,g,x){if(g===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let f=0;f<d.length;f++)h(d[f]/a,m[f],x[f]);else{p.multiDrawElementsInstancedWEBGL(n,m,0,r,d,0,x,0,g);let f=0;for(let S=0;S<g;S++)f+=m[S]*x[S];t.update(f,n,1)}}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=h,this.renderMultiDraw=c,this.renderMultiDrawInstances=u}function bx(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function Sx(i,e,t){let n=new WeakMap,s=new ct;function r(a,o,l){let h=a.morphTargetInfluences,c=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=c!==void 0?c.length:0,d=n.get(o);if(d===void 0||d.count!==u){let _=function(){E.dispose(),n.delete(o),o.removeEventListener("dispose",_)};d!==void 0&&d.texture.dispose();let m=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,x=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],f=o.morphAttributes.normal||[],S=o.morphAttributes.color||[],w=0;m===!0&&(w=1),g===!0&&(w=2),x===!0&&(w=3);let v=o.attributes.position.count*w,I=1;v>e.maxTextureSize&&(I=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);let C=new Float32Array(v*I*4*u),E=new za(C,v,I,u);E.type=$n,E.needsUpdate=!0;let A=w*4;for(let y=0;y<u;y++){let P=p[y],H=f[y],R=S[y],O=v*I*4*y;for(let z=0;z<P.count;z++){let k=z*A;m===!0&&(s.fromBufferAttribute(P,z),C[O+k+0]=s.x,C[O+k+1]=s.y,C[O+k+2]=s.z,C[O+k+3]=0),g===!0&&(s.fromBufferAttribute(H,z),C[O+k+4]=s.x,C[O+k+5]=s.y,C[O+k+6]=s.z,C[O+k+7]=0),x===!0&&(s.fromBufferAttribute(R,z),C[O+k+8]=s.x,C[O+k+9]=s.y,C[O+k+10]=s.z,C[O+k+11]=R.itemSize===4?s.w:1)}}d={count:u,texture:E,size:new ze(v,I)},n.set(o,d),o.addEventListener("dispose",_)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let m=0;for(let x=0;x<h.length;x++)m+=h[x];let g=o.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",h)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function wx(i,e,t,n){let s=new WeakMap;function r(l){let h=n.render.frame,c=l.geometry,u=e.get(l,c);if(s.get(u)!==h&&(e.update(u),s.set(u,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==h&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,h))),l.isSkinnedMesh){let d=l.skeleton;s.get(d)!==h&&(d.update(),s.set(d,h))}return u}function a(){s=new WeakMap}function o(l){let h=l.target;h.removeEventListener("dispose",o),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:r,dispose:a}}var $a=class extends hn{constructor(e,t,n,s,r,a,o,l,h,c=Ds){if(c!==Ds&&c!==zs)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&c===Ds&&(n=ji),n===void 0&&c===zs&&(n=Os),super(null,s,r,a,o,l,c,n,h),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:ln,this.minFilter=l!==void 0?l:ln,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Fd=new hn,Ju=new $a(1,1),Bd=new za,kd=new bc,Od=new Wa,ju=[],Qu=[],ed=new Float32Array(16),td=new Float32Array(9),nd=new Float32Array(4);function Xs(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=ju[s];if(r===void 0&&(r=new Float32Array(s),ju[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function It(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Lt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function ho(i,e){let t=Qu[e];t===void 0&&(t=new Int32Array(e),Qu[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Ex(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Tx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;i.uniform2fv(this.addr,e),Lt(t,e)}}function Ax(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(It(t,e))return;i.uniform3fv(this.addr,e),Lt(t,e)}}function Cx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;i.uniform4fv(this.addr,e),Lt(t,e)}}function Rx(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(It(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Lt(t,e)}else{if(It(t,n))return;nd.set(n),i.uniformMatrix2fv(this.addr,!1,nd),Lt(t,n)}}function Px(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(It(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Lt(t,e)}else{if(It(t,n))return;td.set(n),i.uniformMatrix3fv(this.addr,!1,td),Lt(t,n)}}function Ix(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(It(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Lt(t,e)}else{if(It(t,n))return;ed.set(n),i.uniformMatrix4fv(this.addr,!1,ed),Lt(t,n)}}function Lx(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function Dx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;i.uniform2iv(this.addr,e),Lt(t,e)}}function Ux(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(It(t,e))return;i.uniform3iv(this.addr,e),Lt(t,e)}}function Nx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;i.uniform4iv(this.addr,e),Lt(t,e)}}function Fx(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Bx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;i.uniform2uiv(this.addr,e),Lt(t,e)}}function kx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(It(t,e))return;i.uniform3uiv(this.addr,e),Lt(t,e)}}function Ox(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;i.uniform4uiv(this.addr,e),Lt(t,e)}}function zx(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Ju.compareFunction=Id,r=Ju):r=Fd,t.setTexture2D(e||r,s)}function Hx(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||kd,s)}function Vx(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||Od,s)}function Gx(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Bd,s)}function Wx(i){switch(i){case 5126:return Ex;case 35664:return Tx;case 35665:return Ax;case 35666:return Cx;case 35674:return Rx;case 35675:return Px;case 35676:return Ix;case 5124:case 35670:return Lx;case 35667:case 35671:return Dx;case 35668:case 35672:return Ux;case 35669:case 35673:return Nx;case 5125:return Fx;case 36294:return Bx;case 36295:return kx;case 36296:return Ox;case 35678:case 36198:case 36298:case 36306:case 35682:return zx;case 35679:case 36299:case 36307:return Hx;case 35680:case 36300:case 36308:case 36293:return Vx;case 36289:case 36303:case 36311:case 36292:return Gx}}function Xx(i,e){i.uniform1fv(this.addr,e)}function qx(i,e){let t=Xs(e,this.size,2);i.uniform2fv(this.addr,t)}function $x(i,e){let t=Xs(e,this.size,3);i.uniform3fv(this.addr,t)}function Yx(i,e){let t=Xs(e,this.size,4);i.uniform4fv(this.addr,t)}function Zx(i,e){let t=Xs(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Kx(i,e){let t=Xs(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Jx(i,e){let t=Xs(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function jx(i,e){i.uniform1iv(this.addr,e)}function Qx(i,e){i.uniform2iv(this.addr,e)}function ev(i,e){i.uniform3iv(this.addr,e)}function tv(i,e){i.uniform4iv(this.addr,e)}function nv(i,e){i.uniform1uiv(this.addr,e)}function iv(i,e){i.uniform2uiv(this.addr,e)}function sv(i,e){i.uniform3uiv(this.addr,e)}function rv(i,e){i.uniform4uiv(this.addr,e)}function av(i,e,t){let n=this.cache,s=e.length,r=ho(t,s);It(n,r)||(i.uniform1iv(this.addr,r),Lt(n,r));for(let a=0;a!==s;++a)t.setTexture2D(e[a]||Fd,r[a])}function ov(i,e,t){let n=this.cache,s=e.length,r=ho(t,s);It(n,r)||(i.uniform1iv(this.addr,r),Lt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||kd,r[a])}function lv(i,e,t){let n=this.cache,s=e.length,r=ho(t,s);It(n,r)||(i.uniform1iv(this.addr,r),Lt(n,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||Od,r[a])}function cv(i,e,t){let n=this.cache,s=e.length,r=ho(t,s);It(n,r)||(i.uniform1iv(this.addr,r),Lt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||Bd,r[a])}function hv(i){switch(i){case 5126:return Xx;case 35664:return qx;case 35665:return $x;case 35666:return Yx;case 35674:return Zx;case 35675:return Kx;case 35676:return Jx;case 5124:case 35670:return jx;case 35667:case 35671:return Qx;case 35668:case 35672:return ev;case 35669:case 35673:return tv;case 5125:return nv;case 36294:return iv;case 36295:return sv;case 36296:return rv;case 35678:case 36198:case 36298:case 36306:case 35682:return av;case 35679:case 36299:case 36307:return ov;case 35680:case 36300:case 36308:case 36293:return lv;case 36289:case 36303:case 36311:case 36292:return cv}}var Tc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Wx(t.type)}},Ac=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=hv(t.type)}},Cc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],n)}}},Pl=/(\w+)(\])?(\[|\.)?/g;function id(i,e){i.seq.push(e),i.map[e.id]=e}function uv(i,e,t){let n=i.name,s=n.length;for(Pl.lastIndex=0;;){let r=Pl.exec(n),a=Pl.lastIndex,o=r[1],l=r[2]==="]",h=r[3];if(l&&(o=o|0),h===void 0||h==="["&&a+2===s){id(t,h===void 0?new Tc(o,i,e):new Ac(o,i,e));break}else{let u=t.map[o];u===void 0&&(u=new Cc(o),id(t,u)),t=u}}}var Ns=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=e.getActiveUniform(t,s),a=e.getUniformLocation(t,r.name);uv(r,a,this)}}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&n.push(a)}return n}};function sd(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var dv=37297,fv=0;function pv(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}var rd=new Ie;function mv(i){Ze._getMatrix(rd,Ze.workingColorSpace,i);let e=`mat3( ${rd.elements.map(t=>t.toFixed(4))} )`;switch(Ze.getTransfer(i)){case co:return[e,"LinearTransferOETF"];case lt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function ad(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),s=i.getShaderInfoLog(e).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let a=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+pv(i.getShaderSource(e),a)}else return s}function gv(i,e){let t=mv(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function xv(i,e){let t;switch(e){case Gp:t="Linear";break;case Wp:t="Reinhard";break;case Xp:t="Cineon";break;case qp:t="ACESFilmic";break;case Yp:t="AgX";break;case Jc:t="Neutral";break;case $p:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Ca=new L;function vv(){Ze.getLuminanceCoefficients(Ca);let i=Ca.x.toFixed(4),e=Ca.y.toFixed(4),t=Ca.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function yv(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Er).join(`
`)}function _v(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Mv(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function Er(i){return i!==""}function od(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function ld(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var bv=/^[ \t]*#include +<([\w\d./]+)>/gm;function Rc(i){return i.replace(bv,wv)}var Sv=new Map;function wv(i,e){let t=ke[e];if(t===void 0){let n=Sv.get(e);if(n!==void 0)t=ke[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return Rc(t)}var Ev=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function cd(i){return i.replace(Ev,Tv)}function Tv(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function hd(i){let e=`precision ${i.precision} float;
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
#define LOW_PRECISION`),e}function Av(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===_d?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===Kc?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===si&&(e="SHADOWMAP_TYPE_VSM"),e}function Cv(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Bs:case ks:e="ENVMAP_TYPE_CUBE";break;case lo:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Rv(i){let e="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===ks&&(e="ENVMAP_MODE_REFRACTION"),e}function Pv(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case oo:e="ENVMAP_BLENDING_MULTIPLY";break;case Hp:e="ENVMAP_BLENDING_MIX";break;case Vp:e="ENVMAP_BLENDING_ADD";break}return e}function Iv(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Lv(i,e,t,n){let s=i.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=Av(t),h=Cv(t),c=Rv(t),u=Pv(t),d=Iv(t),m=yv(t),g=_v(r),x=s.createProgram(),p,f,S=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Er).join(`
`),p.length>0&&(p+=`
`),f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Er).join(`
`),f.length>0&&(f+=`
`)):(p=[hd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Er).join(`
`),f=[hd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Ci?"#define TONE_MAPPING":"",t.toneMapping!==Ci?ke.tonemapping_pars_fragment:"",t.toneMapping!==Ci?xv("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",ke.colorspace_pars_fragment,gv("linearToOutputTexel",t.outputColorSpace),vv(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Er).join(`
`)),a=Rc(a),a=od(a,t),a=ld(a,t),o=Rc(o),o=od(o,t),o=ld(o,t),a=cd(a),o=cd(o),t.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,f=["#define varying in",t.glslVersion===wu?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===wu?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let w=S+p+a,v=S+f+o,I=sd(s,s.VERTEX_SHADER,w),C=sd(s,s.FRAGMENT_SHADER,v);s.attachShader(x,I),s.attachShader(x,C),t.index0AttributeName!==void 0?s.bindAttribLocation(x,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function E(P){if(i.debug.checkShaderErrors){let H=s.getProgramInfoLog(x).trim(),R=s.getShaderInfoLog(I).trim(),O=s.getShaderInfoLog(C).trim(),z=!0,k=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(z=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,I,C);else{let Z=ad(s,I,"vertex"),G=ad(s,C,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+H+`
`+Z+`
`+G)}else H!==""?console.warn("THREE.WebGLProgram: Program Info Log:",H):(R===""||O==="")&&(k=!1);k&&(P.diagnostics={runnable:z,programLog:H,vertexShader:{log:R,prefix:p},fragmentShader:{log:O,prefix:f}})}s.deleteShader(I),s.deleteShader(C),A=new Ns(s,x),_=Mv(s,x)}let A;this.getUniforms=function(){return A===void 0&&E(this),A};let _;this.getAttributes=function(){return _===void 0&&E(this),_};let y=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return y===!1&&(y=s.getProgramParameter(x,dv)),y},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=fv++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=I,this.fragmentShader=C,this}var Dv=0,Pc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Ic(e),t.set(e,n)),n}},Ic=class{constructor(e){this.id=Dv++,this.code=e,this.usedTimes=0}};function Uv(i,e,t,n,s,r,a){let o=new Ha,l=new Pc,h=new Set,c=[],u=s.logarithmicDepthBuffer,d=s.vertexTextures,m=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(_){return h.add(_),_===0?"uv":`uv${_}`}function p(_,y,P,H,R){let O=H.fog,z=R.geometry,k=_.isMeshStandardMaterial?H.environment:null,Z=(_.isMeshStandardMaterial?t:e).get(_.envMap||k),G=Z&&Z.mapping===lo?Z.image.height:null,se=g[_.type];_.precision!==null&&(m=s.getMaxPrecision(_.precision),m!==_.precision&&console.warn("THREE.WebGLProgram.getParameters:",_.precision,"not supported, using",m,"instead."));let ee=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,de=ee!==void 0?ee.length:0,De=0;z.morphAttributes.position!==void 0&&(De=1),z.morphAttributes.normal!==void 0&&(De=2),z.morphAttributes.color!==void 0&&(De=3);let et,$,ie,Me;if(se){let rt=Xn[se];et=rt.vertexShader,$=rt.fragmentShader}else et=_.vertexShader,$=_.fragmentShader,l.update(_),ie=l.getVertexShaderID(_),Me=l.getFragmentShaderID(_);let oe=i.getRenderTarget(),Ae=i.state.buffers.depth.getReversed(),Ue=R.isInstancedMesh===!0,Oe=R.isBatchedMesh===!0,Mt=!!_.map,$e=!!_.matcap,Tt=!!Z,B=!!_.aoMap,gn=!!_.lightMap,We=!!_.bumpMap,Xe=!!_.normalMap,Ee=!!_.displacementMap,mt=!!_.emissiveMap,we=!!_.metalnessMap,T=!!_.roughnessMap,M=_.anisotropy>0,V=_.clearcoat>0,K=_.dispersion>0,j=_.iridescence>0,Y=_.sheen>0,be=_.transmission>0,le=M&&!!_.anisotropyMap,fe=V&&!!_.clearcoatMap,Ye=V&&!!_.clearcoatNormalMap,te=V&&!!_.clearcoatRoughnessMap,me=j&&!!_.iridescenceMap,Te=j&&!!_.iridescenceThicknessMap,Re=Y&&!!_.sheenColorMap,ge=Y&&!!_.sheenRoughnessMap,qe=!!_.specularMap,Be=!!_.specularColorMap,ht=!!_.specularIntensityMap,U=be&&!!_.transmissionMap,ae=be&&!!_.thicknessMap,q=!!_.gradientMap,J=!!_.alphaMap,ue=_.alphaTest>0,ce=!!_.alphaHash,Ne=!!_.extensions,bt=Ci;_.toneMapped&&(oe===null||oe.isXRRenderTarget===!0)&&(bt=i.toneMapping);let zt={shaderID:se,shaderType:_.type,shaderName:_.name,vertexShader:et,fragmentShader:$,defines:_.defines,customVertexShaderID:ie,customFragmentShaderID:Me,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:m,batching:Oe,batchingColor:Oe&&R._colorsTexture!==null,instancing:Ue,instancingColor:Ue&&R.instanceColor!==null,instancingMorph:Ue&&R.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:oe===null?i.outputColorSpace:oe.isXRRenderTarget===!0?oe.texture.colorSpace:Ws,alphaToCoverage:!!_.alphaToCoverage,map:Mt,matcap:$e,envMap:Tt,envMapMode:Tt&&Z.mapping,envMapCubeUVHeight:G,aoMap:B,lightMap:gn,bumpMap:We,normalMap:Xe,displacementMap:d&&Ee,emissiveMap:mt,normalMapObjectSpace:Xe&&_.normalMapType===jp,normalMapTangentSpace:Xe&&_.normalMapType===rh,metalnessMap:we,roughnessMap:T,anisotropy:M,anisotropyMap:le,clearcoat:V,clearcoatMap:fe,clearcoatNormalMap:Ye,clearcoatRoughnessMap:te,dispersion:K,iridescence:j,iridescenceMap:me,iridescenceThicknessMap:Te,sheen:Y,sheenColorMap:Re,sheenRoughnessMap:ge,specularMap:qe,specularColorMap:Be,specularIntensityMap:ht,transmission:be,transmissionMap:U,thicknessMap:ae,gradientMap:q,opaque:_.transparent===!1&&_.blending===Ls&&_.alphaToCoverage===!1,alphaMap:J,alphaTest:ue,alphaHash:ce,combine:_.combine,mapUv:Mt&&x(_.map.channel),aoMapUv:B&&x(_.aoMap.channel),lightMapUv:gn&&x(_.lightMap.channel),bumpMapUv:We&&x(_.bumpMap.channel),normalMapUv:Xe&&x(_.normalMap.channel),displacementMapUv:Ee&&x(_.displacementMap.channel),emissiveMapUv:mt&&x(_.emissiveMap.channel),metalnessMapUv:we&&x(_.metalnessMap.channel),roughnessMapUv:T&&x(_.roughnessMap.channel),anisotropyMapUv:le&&x(_.anisotropyMap.channel),clearcoatMapUv:fe&&x(_.clearcoatMap.channel),clearcoatNormalMapUv:Ye&&x(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:te&&x(_.clearcoatRoughnessMap.channel),iridescenceMapUv:me&&x(_.iridescenceMap.channel),iridescenceThicknessMapUv:Te&&x(_.iridescenceThicknessMap.channel),sheenColorMapUv:Re&&x(_.sheenColorMap.channel),sheenRoughnessMapUv:ge&&x(_.sheenRoughnessMap.channel),specularMapUv:qe&&x(_.specularMap.channel),specularColorMapUv:Be&&x(_.specularColorMap.channel),specularIntensityMapUv:ht&&x(_.specularIntensityMap.channel),transmissionMapUv:U&&x(_.transmissionMap.channel),thicknessMapUv:ae&&x(_.thicknessMap.channel),alphaMapUv:J&&x(_.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&(Xe||M),vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,pointsUvs:R.isPoints===!0&&!!z.attributes.uv&&(Mt||J),fog:!!O,useFog:_.fog===!0,fogExp2:!!O&&O.isFogExp2,flatShading:_.flatShading===!0,sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:Ae,skinning:R.isSkinnedMesh===!0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:de,morphTextureStride:De,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:_.dithering,shadowMapEnabled:i.shadowMap.enabled&&P.length>0,shadowMapType:i.shadowMap.type,toneMapping:bt,decodeVideoTexture:Mt&&_.map.isVideoTexture===!0&&Ze.getTransfer(_.map.colorSpace)===lt,decodeVideoTextureEmissive:mt&&_.emissiveMap.isVideoTexture===!0&&Ze.getTransfer(_.emissiveMap.colorSpace)===lt,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===_n,flipSided:_.side===nn,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:Ne&&_.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ne&&_.extensions.multiDraw===!0||Oe)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return zt.vertexUv1s=h.has(1),zt.vertexUv2s=h.has(2),zt.vertexUv3s=h.has(3),h.clear(),zt}function f(_){let y=[];if(_.shaderID?y.push(_.shaderID):(y.push(_.customVertexShaderID),y.push(_.customFragmentShaderID)),_.defines!==void 0)for(let P in _.defines)y.push(P),y.push(_.defines[P]);return _.isRawShaderMaterial===!1&&(S(y,_),w(y,_),y.push(i.outputColorSpace)),y.push(_.customProgramCacheKey),y.join()}function S(_,y){_.push(y.precision),_.push(y.outputColorSpace),_.push(y.envMapMode),_.push(y.envMapCubeUVHeight),_.push(y.mapUv),_.push(y.alphaMapUv),_.push(y.lightMapUv),_.push(y.aoMapUv),_.push(y.bumpMapUv),_.push(y.normalMapUv),_.push(y.displacementMapUv),_.push(y.emissiveMapUv),_.push(y.metalnessMapUv),_.push(y.roughnessMapUv),_.push(y.anisotropyMapUv),_.push(y.clearcoatMapUv),_.push(y.clearcoatNormalMapUv),_.push(y.clearcoatRoughnessMapUv),_.push(y.iridescenceMapUv),_.push(y.iridescenceThicknessMapUv),_.push(y.sheenColorMapUv),_.push(y.sheenRoughnessMapUv),_.push(y.specularMapUv),_.push(y.specularColorMapUv),_.push(y.specularIntensityMapUv),_.push(y.transmissionMapUv),_.push(y.thicknessMapUv),_.push(y.combine),_.push(y.fogExp2),_.push(y.sizeAttenuation),_.push(y.morphTargetsCount),_.push(y.morphAttributeCount),_.push(y.numDirLights),_.push(y.numPointLights),_.push(y.numSpotLights),_.push(y.numSpotLightMaps),_.push(y.numHemiLights),_.push(y.numRectAreaLights),_.push(y.numDirLightShadows),_.push(y.numPointLightShadows),_.push(y.numSpotLightShadows),_.push(y.numSpotLightShadowsWithMaps),_.push(y.numLightProbes),_.push(y.shadowMapType),_.push(y.toneMapping),_.push(y.numClippingPlanes),_.push(y.numClipIntersection),_.push(y.depthPacking)}function w(_,y){o.disableAll(),y.supportsVertexTextures&&o.enable(0),y.instancing&&o.enable(1),y.instancingColor&&o.enable(2),y.instancingMorph&&o.enable(3),y.matcap&&o.enable(4),y.envMap&&o.enable(5),y.normalMapObjectSpace&&o.enable(6),y.normalMapTangentSpace&&o.enable(7),y.clearcoat&&o.enable(8),y.iridescence&&o.enable(9),y.alphaTest&&o.enable(10),y.vertexColors&&o.enable(11),y.vertexAlphas&&o.enable(12),y.vertexUv1s&&o.enable(13),y.vertexUv2s&&o.enable(14),y.vertexUv3s&&o.enable(15),y.vertexTangents&&o.enable(16),y.anisotropy&&o.enable(17),y.alphaHash&&o.enable(18),y.batching&&o.enable(19),y.dispersion&&o.enable(20),y.batchingColor&&o.enable(21),_.push(o.mask),o.disableAll(),y.fog&&o.enable(0),y.useFog&&o.enable(1),y.flatShading&&o.enable(2),y.logarithmicDepthBuffer&&o.enable(3),y.reverseDepthBuffer&&o.enable(4),y.skinning&&o.enable(5),y.morphTargets&&o.enable(6),y.morphNormals&&o.enable(7),y.morphColors&&o.enable(8),y.premultipliedAlpha&&o.enable(9),y.shadowMapEnabled&&o.enable(10),y.doubleSided&&o.enable(11),y.flipSided&&o.enable(12),y.useDepthPacking&&o.enable(13),y.dithering&&o.enable(14),y.transmission&&o.enable(15),y.sheen&&o.enable(16),y.opaque&&o.enable(17),y.pointsUvs&&o.enable(18),y.decodeVideoTexture&&o.enable(19),y.decodeVideoTextureEmissive&&o.enable(20),y.alphaToCoverage&&o.enable(21),_.push(o.mask)}function v(_){let y=g[_.type],P;if(y){let H=Xn[y];P=wm.clone(H.uniforms)}else P=_.uniforms;return P}function I(_,y){let P;for(let H=0,R=c.length;H<R;H++){let O=c[H];if(O.cacheKey===y){P=O,++P.usedTimes;break}}return P===void 0&&(P=new Lv(i,y,_,r),c.push(P)),P}function C(_){if(--_.usedTimes===0){let y=c.indexOf(_);c[y]=c[c.length-1],c.pop(),_.destroy()}}function E(_){l.remove(_)}function A(){l.dispose()}return{getParameters:p,getProgramCacheKey:f,getUniforms:v,acquireProgram:I,releaseProgram:C,releaseShaderCache:E,programs:c,dispose:A}}function Nv(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function Fv(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function ud(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function dd(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(u,d,m,g,x,p){let f=i[e];return f===void 0?(f={id:u.id,object:u,geometry:d,material:m,groupOrder:g,renderOrder:u.renderOrder,z:x,group:p},i[e]=f):(f.id=u.id,f.object=u,f.geometry=d,f.material=m,f.groupOrder=g,f.renderOrder=u.renderOrder,f.z=x,f.group=p),e++,f}function o(u,d,m,g,x,p){let f=a(u,d,m,g,x,p);m.transmission>0?n.push(f):m.transparent===!0?s.push(f):t.push(f)}function l(u,d,m,g,x,p){let f=a(u,d,m,g,x,p);m.transmission>0?n.unshift(f):m.transparent===!0?s.unshift(f):t.unshift(f)}function h(u,d){t.length>1&&t.sort(u||Fv),n.length>1&&n.sort(d||ud),s.length>1&&s.sort(d||ud)}function c(){for(let u=e,d=i.length;u<d;u++){let m=i[u];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:o,unshift:l,finish:c,sort:h}}function Bv(){let i=new WeakMap;function e(n,s){let r=i.get(n),a;return r===void 0?(a=new dd,i.set(n,[a])):s>=r.length?(a=new dd,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function kv(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new L,color:new xe};break;case"SpotLight":t={position:new L,direction:new L,color:new xe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new L,color:new xe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new L,skyColor:new xe,groundColor:new xe};break;case"RectAreaLight":t={color:new xe,position:new L,halfWidth:new L,halfHeight:new L};break}return i[e.id]=t,t}}}function Ov(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ze};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ze};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ze,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var zv=0;function Hv(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function Vv(i){let e=new kv,t=Ov(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)n.probe.push(new L);let s=new L,r=new He,a=new He;function o(h){let c=0,u=0,d=0;for(let _=0;_<9;_++)n.probe[_].set(0,0,0);let m=0,g=0,x=0,p=0,f=0,S=0,w=0,v=0,I=0,C=0,E=0;h.sort(Hv);for(let _=0,y=h.length;_<y;_++){let P=h[_],H=P.color,R=P.intensity,O=P.distance,z=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)c+=H.r*R,u+=H.g*R,d+=H.b*R;else if(P.isLightProbe){for(let k=0;k<9;k++)n.probe[k].addScaledVector(P.sh.coefficients[k],R);E++}else if(P.isDirectionalLight){let k=e.get(P);if(k.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){let Z=P.shadow,G=t.get(P);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,n.directionalShadow[m]=G,n.directionalShadowMap[m]=z,n.directionalShadowMatrix[m]=P.shadow.matrix,S++}n.directional[m]=k,m++}else if(P.isSpotLight){let k=e.get(P);k.position.setFromMatrixPosition(P.matrixWorld),k.color.copy(H).multiplyScalar(R),k.distance=O,k.coneCos=Math.cos(P.angle),k.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),k.decay=P.decay,n.spot[x]=k;let Z=P.shadow;if(P.map&&(n.spotLightMap[I]=P.map,I++,Z.updateMatrices(P),P.castShadow&&C++),n.spotLightMatrix[x]=Z.matrix,P.castShadow){let G=t.get(P);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,n.spotShadow[x]=G,n.spotShadowMap[x]=z,v++}x++}else if(P.isRectAreaLight){let k=e.get(P);k.color.copy(H).multiplyScalar(R),k.halfWidth.set(P.width*.5,0,0),k.halfHeight.set(0,P.height*.5,0),n.rectArea[p]=k,p++}else if(P.isPointLight){let k=e.get(P);if(k.color.copy(P.color).multiplyScalar(P.intensity),k.distance=P.distance,k.decay=P.decay,P.castShadow){let Z=P.shadow,G=t.get(P);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,G.shadowCameraNear=Z.camera.near,G.shadowCameraFar=Z.camera.far,n.pointShadow[g]=G,n.pointShadowMap[g]=z,n.pointShadowMatrix[g]=P.shadow.matrix,w++}n.point[g]=k,g++}else if(P.isHemisphereLight){let k=e.get(P);k.skyColor.copy(P.color).multiplyScalar(R),k.groundColor.copy(P.groundColor).multiplyScalar(R),n.hemi[f]=k,f++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=re.LTC_FLOAT_1,n.rectAreaLTC2=re.LTC_FLOAT_2):(n.rectAreaLTC1=re.LTC_HALF_1,n.rectAreaLTC2=re.LTC_HALF_2)),n.ambient[0]=c,n.ambient[1]=u,n.ambient[2]=d;let A=n.hash;(A.directionalLength!==m||A.pointLength!==g||A.spotLength!==x||A.rectAreaLength!==p||A.hemiLength!==f||A.numDirectionalShadows!==S||A.numPointShadows!==w||A.numSpotShadows!==v||A.numSpotMaps!==I||A.numLightProbes!==E)&&(n.directional.length=m,n.spot.length=x,n.rectArea.length=p,n.point.length=g,n.hemi.length=f,n.directionalShadow.length=S,n.directionalShadowMap.length=S,n.pointShadow.length=w,n.pointShadowMap.length=w,n.spotShadow.length=v,n.spotShadowMap.length=v,n.directionalShadowMatrix.length=S,n.pointShadowMatrix.length=w,n.spotLightMatrix.length=v+I-C,n.spotLightMap.length=I,n.numSpotLightShadowsWithMaps=C,n.numLightProbes=E,A.directionalLength=m,A.pointLength=g,A.spotLength=x,A.rectAreaLength=p,A.hemiLength=f,A.numDirectionalShadows=S,A.numPointShadows=w,A.numSpotShadows=v,A.numSpotMaps=I,A.numLightProbes=E,n.version=zv++)}function l(h,c){let u=0,d=0,m=0,g=0,x=0,p=c.matrixWorldInverse;for(let f=0,S=h.length;f<S;f++){let w=h[f];if(w.isDirectionalLight){let v=n.directional[u];v.direction.setFromMatrixPosition(w.matrixWorld),s.setFromMatrixPosition(w.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(p),u++}else if(w.isSpotLight){let v=n.spot[m];v.position.setFromMatrixPosition(w.matrixWorld),v.position.applyMatrix4(p),v.direction.setFromMatrixPosition(w.matrixWorld),s.setFromMatrixPosition(w.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(p),m++}else if(w.isRectAreaLight){let v=n.rectArea[g];v.position.setFromMatrixPosition(w.matrixWorld),v.position.applyMatrix4(p),a.identity(),r.copy(w.matrixWorld),r.premultiply(p),a.extractRotation(r),v.halfWidth.set(w.width*.5,0,0),v.halfHeight.set(0,w.height*.5,0),v.halfWidth.applyMatrix4(a),v.halfHeight.applyMatrix4(a),g++}else if(w.isPointLight){let v=n.point[d];v.position.setFromMatrixPosition(w.matrixWorld),v.position.applyMatrix4(p),d++}else if(w.isHemisphereLight){let v=n.hemi[x];v.direction.setFromMatrixPosition(w.matrixWorld),v.direction.transformDirection(p),x++}}}return{setup:o,setupView:l,state:n}}function fd(i){let e=new Vv(i),t=[],n=[];function s(c){h.camera=c,t.length=0,n.length=0}function r(c){t.push(c)}function a(c){n.push(c)}function o(){e.setup(t)}function l(c){e.setupView(t,c)}let h={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:h,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function Gv(i){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new fd(i),e.set(s,[o])):r>=a.length?(o=new fd(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}var Lc=class extends Ii{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Kp,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Dc=class extends Ii{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},Wv=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Xv=`uniform sampler2D shadow_pass;
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
}`;function qv(i,e,t){let n=new Rr,s=new ze,r=new ze,a=new ct,o=new Lc({depthPacking:Jp}),l=new Dc,h={},c=t.maxTextureSize,u={[Ri]:nn,[nn]:Ri,[_n]:_n},d=new Yn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ze},radius:{value:4}},vertexShader:Wv,fragmentShader:Xv}),m=d.clone();m.defines.HORIZONTAL_PASS=1;let g=new Yt;g.setAttribute("position",new cn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new St(g,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=_d;let f=this.type;this.render=function(C,E,A){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||C.length===0)return;let _=i.getRenderTarget(),y=i.getActiveCubeFace(),P=i.getActiveMipmapLevel(),H=i.state;H.setBlending(Ai),H.buffers.color.setClear(1,1,1,1),H.buffers.depth.setTest(!0),H.setScissorTest(!1);let R=f!==si&&this.type===si,O=f===si&&this.type!==si;for(let z=0,k=C.length;z<k;z++){let Z=C[z],G=Z.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",Z,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;s.copy(G.mapSize);let se=G.getFrameExtents();if(s.multiply(se),r.copy(G.mapSize),(s.x>c||s.y>c)&&(s.x>c&&(r.x=Math.floor(c/se.x),s.x=r.x*se.x,G.mapSize.x=r.x),s.y>c&&(r.y=Math.floor(c/se.y),s.y=r.y*se.y,G.mapSize.y=r.y)),G.map===null||R===!0||O===!0){let de=this.type!==si?{minFilter:ln,magFilter:ln}:{};G.map!==null&&G.map.dispose(),G.map=new ci(s.x,s.y,de),G.map.texture.name=Z.name+".shadowMap",G.camera.updateProjectionMatrix()}i.setRenderTarget(G.map),i.clear();let ee=G.getViewportCount();for(let de=0;de<ee;de++){let De=G.getViewport(de);a.set(r.x*De.x,r.y*De.y,r.x*De.z,r.y*De.w),H.viewport(a),G.updateMatrices(Z,de),n=G.getFrustum(),v(E,A,G.camera,Z,this.type)}G.isPointLightShadow!==!0&&this.type===si&&S(G,A),G.needsUpdate=!1}f=this.type,p.needsUpdate=!1,i.setRenderTarget(_,y,P)};function S(C,E){let A=e.update(x);d.defines.VSM_SAMPLES!==C.blurSamples&&(d.defines.VSM_SAMPLES=C.blurSamples,m.defines.VSM_SAMPLES=C.blurSamples,d.needsUpdate=!0,m.needsUpdate=!0),C.mapPass===null&&(C.mapPass=new ci(s.x,s.y)),d.uniforms.shadow_pass.value=C.map.texture,d.uniforms.resolution.value=C.mapSize,d.uniforms.radius.value=C.radius,i.setRenderTarget(C.mapPass),i.clear(),i.renderBufferDirect(E,null,A,d,x,null),m.uniforms.shadow_pass.value=C.mapPass.texture,m.uniforms.resolution.value=C.mapSize,m.uniforms.radius.value=C.radius,i.setRenderTarget(C.map),i.clear(),i.renderBufferDirect(E,null,A,m,x,null)}function w(C,E,A,_){let y=null,P=A.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(P!==void 0)y=P;else if(y=A.isPointLight===!0?l:o,i.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0){let H=y.uuid,R=E.uuid,O=h[H];O===void 0&&(O={},h[H]=O);let z=O[R];z===void 0&&(z=y.clone(),O[R]=z,E.addEventListener("dispose",I)),y=z}if(y.visible=E.visible,y.wireframe=E.wireframe,_===si?y.side=E.shadowSide!==null?E.shadowSide:E.side:y.side=E.shadowSide!==null?E.shadowSide:u[E.side],y.alphaMap=E.alphaMap,y.alphaTest=E.alphaTest,y.map=E.map,y.clipShadows=E.clipShadows,y.clippingPlanes=E.clippingPlanes,y.clipIntersection=E.clipIntersection,y.displacementMap=E.displacementMap,y.displacementScale=E.displacementScale,y.displacementBias=E.displacementBias,y.wireframeLinewidth=E.wireframeLinewidth,y.linewidth=E.linewidth,A.isPointLight===!0&&y.isMeshDistanceMaterial===!0){let H=i.properties.get(y);H.light=A}return y}function v(C,E,A,_,y){if(C.visible===!1)return;if(C.layers.test(E.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&y===si)&&(!C.frustumCulled||n.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices(A.matrixWorldInverse,C.matrixWorld);let R=e.update(C),O=C.material;if(Array.isArray(O)){let z=R.groups;for(let k=0,Z=z.length;k<Z;k++){let G=z[k],se=O[G.materialIndex];if(se&&se.visible){let ee=w(C,se,_,y);C.onBeforeShadow(i,C,E,A,R,ee,G),i.renderBufferDirect(A,null,R,ee,C,G),C.onAfterShadow(i,C,E,A,R,ee,G)}}}else if(O.visible){let z=w(C,O,_,y);C.onBeforeShadow(i,C,E,A,R,z,null),i.renderBufferDirect(A,null,R,z,C,null),C.onAfterShadow(i,C,E,A,R,z,null)}}let H=C.children;for(let R=0,O=H.length;R<O;R++)v(H[R],E,A,_,y)}function I(C){C.target.removeEventListener("dispose",I);for(let A in h){let _=h[A],y=C.target.uuid;y in _&&(_[y].dispose(),delete _[y])}}}var $v={[Nl]:Fl,[Bl]:zl,[kl]:Hl,[Fs]:Ol,[Fl]:Nl,[zl]:Bl,[Hl]:kl,[Ol]:Fs};function Yv(i,e){function t(){let U=!1,ae=new ct,q=null,J=new ct(0,0,0,0);return{setMask:function(ue){q!==ue&&!U&&(i.colorMask(ue,ue,ue,ue),q=ue)},setLocked:function(ue){U=ue},setClear:function(ue,ce,Ne,bt,zt){zt===!0&&(ue*=bt,ce*=bt,Ne*=bt),ae.set(ue,ce,Ne,bt),J.equals(ae)===!1&&(i.clearColor(ue,ce,Ne,bt),J.copy(ae))},reset:function(){U=!1,q=null,J.set(-1,0,0,0)}}}function n(){let U=!1,ae=!1,q=null,J=null,ue=null;return{setReversed:function(ce){if(ae!==ce){let Ne=e.get("EXT_clip_control");ae?Ne.clipControlEXT(Ne.LOWER_LEFT_EXT,Ne.ZERO_TO_ONE_EXT):Ne.clipControlEXT(Ne.LOWER_LEFT_EXT,Ne.NEGATIVE_ONE_TO_ONE_EXT);let bt=ue;ue=null,this.setClear(bt)}ae=ce},getReversed:function(){return ae},setTest:function(ce){ce?oe(i.DEPTH_TEST):Ae(i.DEPTH_TEST)},setMask:function(ce){q!==ce&&!U&&(i.depthMask(ce),q=ce)},setFunc:function(ce){if(ae&&(ce=$v[ce]),J!==ce){switch(ce){case Nl:i.depthFunc(i.NEVER);break;case Fl:i.depthFunc(i.ALWAYS);break;case Bl:i.depthFunc(i.LESS);break;case Fs:i.depthFunc(i.LEQUAL);break;case kl:i.depthFunc(i.EQUAL);break;case Ol:i.depthFunc(i.GEQUAL);break;case zl:i.depthFunc(i.GREATER);break;case Hl:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}J=ce}},setLocked:function(ce){U=ce},setClear:function(ce){ue!==ce&&(ae&&(ce=1-ce),i.clearDepth(ce),ue=ce)},reset:function(){U=!1,q=null,J=null,ue=null,ae=!1}}}function s(){let U=!1,ae=null,q=null,J=null,ue=null,ce=null,Ne=null,bt=null,zt=null;return{setTest:function(rt){U||(rt?oe(i.STENCIL_TEST):Ae(i.STENCIL_TEST))},setMask:function(rt){ae!==rt&&!U&&(i.stencilMask(rt),ae=rt)},setFunc:function(rt,Rn,Jn){(q!==rt||J!==Rn||ue!==Jn)&&(i.stencilFunc(rt,Rn,Jn),q=rt,J=Rn,ue=Jn)},setOp:function(rt,Rn,Jn){(ce!==rt||Ne!==Rn||bt!==Jn)&&(i.stencilOp(rt,Rn,Jn),ce=rt,Ne=Rn,bt=Jn)},setLocked:function(rt){U=rt},setClear:function(rt){zt!==rt&&(i.clearStencil(rt),zt=rt)},reset:function(){U=!1,ae=null,q=null,J=null,ue=null,ce=null,Ne=null,bt=null,zt=null}}}let r=new t,a=new n,o=new s,l=new WeakMap,h=new WeakMap,c={},u={},d=new WeakMap,m=[],g=null,x=!1,p=null,f=null,S=null,w=null,v=null,I=null,C=null,E=new xe(0,0,0),A=0,_=!1,y=null,P=null,H=null,R=null,O=null,z=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),k=!1,Z=0,G=i.getParameter(i.VERSION);G.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(G)[1]),k=Z>=1):G.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),k=Z>=2);let se=null,ee={},de=i.getParameter(i.SCISSOR_BOX),De=i.getParameter(i.VIEWPORT),et=new ct().fromArray(de),$=new ct().fromArray(De);function ie(U,ae,q,J){let ue=new Uint8Array(4),ce=i.createTexture();i.bindTexture(U,ce),i.texParameteri(U,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(U,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ne=0;Ne<q;Ne++)U===i.TEXTURE_3D||U===i.TEXTURE_2D_ARRAY?i.texImage3D(ae,0,i.RGBA,1,1,J,0,i.RGBA,i.UNSIGNED_BYTE,ue):i.texImage2D(ae+Ne,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ue);return ce}let Me={};Me[i.TEXTURE_2D]=ie(i.TEXTURE_2D,i.TEXTURE_2D,1),Me[i.TEXTURE_CUBE_MAP]=ie(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Me[i.TEXTURE_2D_ARRAY]=ie(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Me[i.TEXTURE_3D]=ie(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),oe(i.DEPTH_TEST),a.setFunc(Fs),We(!1),Xe(gu),oe(i.CULL_FACE),B(Ai);function oe(U){c[U]!==!0&&(i.enable(U),c[U]=!0)}function Ae(U){c[U]!==!1&&(i.disable(U),c[U]=!1)}function Ue(U,ae){return u[U]!==ae?(i.bindFramebuffer(U,ae),u[U]=ae,U===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=ae),U===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=ae),!0):!1}function Oe(U,ae){let q=m,J=!1;if(U){q=d.get(ae),q===void 0&&(q=[],d.set(ae,q));let ue=U.textures;if(q.length!==ue.length||q[0]!==i.COLOR_ATTACHMENT0){for(let ce=0,Ne=ue.length;ce<Ne;ce++)q[ce]=i.COLOR_ATTACHMENT0+ce;q.length=ue.length,J=!0}}else q[0]!==i.BACK&&(q[0]=i.BACK,J=!0);J&&i.drawBuffers(q)}function Mt(U){return g!==U?(i.useProgram(U),g=U,!0):!1}let $e={[$i]:i.FUNC_ADD,[wp]:i.FUNC_SUBTRACT,[Ep]:i.FUNC_REVERSE_SUBTRACT};$e[Tp]=i.MIN,$e[Ap]=i.MAX;let Tt={[Cp]:i.ZERO,[Rp]:i.ONE,[Pp]:i.SRC_COLOR,[Dl]:i.SRC_ALPHA,[Fp]:i.SRC_ALPHA_SATURATE,[Up]:i.DST_COLOR,[Lp]:i.DST_ALPHA,[Ip]:i.ONE_MINUS_SRC_COLOR,[Ul]:i.ONE_MINUS_SRC_ALPHA,[Np]:i.ONE_MINUS_DST_COLOR,[Dp]:i.ONE_MINUS_DST_ALPHA,[Bp]:i.CONSTANT_COLOR,[kp]:i.ONE_MINUS_CONSTANT_COLOR,[Op]:i.CONSTANT_ALPHA,[zp]:i.ONE_MINUS_CONSTANT_ALPHA};function B(U,ae,q,J,ue,ce,Ne,bt,zt,rt){if(U===Ai){x===!0&&(Ae(i.BLEND),x=!1);return}if(x===!1&&(oe(i.BLEND),x=!0),U!==Sp){if(U!==p||rt!==_){if((f!==$i||v!==$i)&&(i.blendEquation(i.FUNC_ADD),f=$i,v=$i),rt)switch(U){case Ls:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ar:i.blendFunc(i.ONE,i.ONE);break;case xu:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case vu:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}else switch(U){case Ls:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ar:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case xu:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case vu:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}S=null,w=null,I=null,C=null,E.set(0,0,0),A=0,p=U,_=rt}return}ue=ue||ae,ce=ce||q,Ne=Ne||J,(ae!==f||ue!==v)&&(i.blendEquationSeparate($e[ae],$e[ue]),f=ae,v=ue),(q!==S||J!==w||ce!==I||Ne!==C)&&(i.blendFuncSeparate(Tt[q],Tt[J],Tt[ce],Tt[Ne]),S=q,w=J,I=ce,C=Ne),(bt.equals(E)===!1||zt!==A)&&(i.blendColor(bt.r,bt.g,bt.b,zt),E.copy(bt),A=zt),p=U,_=!1}function gn(U,ae){U.side===_n?Ae(i.CULL_FACE):oe(i.CULL_FACE);let q=U.side===nn;ae&&(q=!q),We(q),U.blending===Ls&&U.transparent===!1?B(Ai):B(U.blending,U.blendEquation,U.blendSrc,U.blendDst,U.blendEquationAlpha,U.blendSrcAlpha,U.blendDstAlpha,U.blendColor,U.blendAlpha,U.premultipliedAlpha),a.setFunc(U.depthFunc),a.setTest(U.depthTest),a.setMask(U.depthWrite),r.setMask(U.colorWrite);let J=U.stencilWrite;o.setTest(J),J&&(o.setMask(U.stencilWriteMask),o.setFunc(U.stencilFunc,U.stencilRef,U.stencilFuncMask),o.setOp(U.stencilFail,U.stencilZFail,U.stencilZPass)),mt(U.polygonOffset,U.polygonOffsetFactor,U.polygonOffsetUnits),U.alphaToCoverage===!0?oe(i.SAMPLE_ALPHA_TO_COVERAGE):Ae(i.SAMPLE_ALPHA_TO_COVERAGE)}function We(U){y!==U&&(U?i.frontFace(i.CW):i.frontFace(i.CCW),y=U)}function Xe(U){U!==Mp?(oe(i.CULL_FACE),U!==P&&(U===gu?i.cullFace(i.BACK):U===bp?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Ae(i.CULL_FACE),P=U}function Ee(U){U!==H&&(k&&i.lineWidth(U),H=U)}function mt(U,ae,q){U?(oe(i.POLYGON_OFFSET_FILL),(R!==ae||O!==q)&&(i.polygonOffset(ae,q),R=ae,O=q)):Ae(i.POLYGON_OFFSET_FILL)}function we(U){U?oe(i.SCISSOR_TEST):Ae(i.SCISSOR_TEST)}function T(U){U===void 0&&(U=i.TEXTURE0+z-1),se!==U&&(i.activeTexture(U),se=U)}function M(U,ae,q){q===void 0&&(se===null?q=i.TEXTURE0+z-1:q=se);let J=ee[q];J===void 0&&(J={type:void 0,texture:void 0},ee[q]=J),(J.type!==U||J.texture!==ae)&&(se!==q&&(i.activeTexture(q),se=q),i.bindTexture(U,ae||Me[U]),J.type=U,J.texture=ae)}function V(){let U=ee[se];U!==void 0&&U.type!==void 0&&(i.bindTexture(U.type,null),U.type=void 0,U.texture=void 0)}function K(){try{i.compressedTexImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function j(){try{i.compressedTexImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Y(){try{i.texSubImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function be(){try{i.texSubImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function le(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function fe(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Ye(){try{i.texStorage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function te(){try{i.texStorage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function me(){try{i.texImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Te(){try{i.texImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Re(U){et.equals(U)===!1&&(i.scissor(U.x,U.y,U.z,U.w),et.copy(U))}function ge(U){$.equals(U)===!1&&(i.viewport(U.x,U.y,U.z,U.w),$.copy(U))}function qe(U,ae){let q=h.get(ae);q===void 0&&(q=new WeakMap,h.set(ae,q));let J=q.get(U);J===void 0&&(J=i.getUniformBlockIndex(ae,U.name),q.set(U,J))}function Be(U,ae){let J=h.get(ae).get(U);l.get(ae)!==J&&(i.uniformBlockBinding(ae,J,U.__bindingPointIndex),l.set(ae,J))}function ht(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),c={},se=null,ee={},u={},d=new WeakMap,m=[],g=null,x=!1,p=null,f=null,S=null,w=null,v=null,I=null,C=null,E=new xe(0,0,0),A=0,_=!1,y=null,P=null,H=null,R=null,O=null,et.set(0,0,i.canvas.width,i.canvas.height),$.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:oe,disable:Ae,bindFramebuffer:Ue,drawBuffers:Oe,useProgram:Mt,setBlending:B,setMaterial:gn,setFlipSided:We,setCullFace:Xe,setLineWidth:Ee,setPolygonOffset:mt,setScissorTest:we,activeTexture:T,bindTexture:M,unbindTexture:V,compressedTexImage2D:K,compressedTexImage3D:j,texImage2D:me,texImage3D:Te,updateUBOMapping:qe,uniformBlockBinding:Be,texStorage2D:Ye,texStorage3D:te,texSubImage2D:Y,texSubImage3D:be,compressedTexSubImage2D:le,compressedTexSubImage3D:fe,scissor:Re,viewport:ge,reset:ht}}function pd(i,e,t,n){let s=Zv(n);switch(t){case Ed:return i*e;case Ad:return i*e;case Cd:return i*e*2;case th:return i*e/s.components*s.byteLength;case nh:return i*e/s.components*s.byteLength;case Rd:return i*e*2/s.components*s.byteLength;case ih:return i*e*2/s.components*s.byteLength;case Td:return i*e*3/s.components*s.byteLength;case Un:return i*e*4/s.components*s.byteLength;case sh:return i*e*4/s.components*s.byteLength;case Ia:case La:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Da:case Ua:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case $l:case Zl:return Math.max(i,16)*Math.max(e,8)/4;case ql:case Yl:return Math.max(i,8)*Math.max(e,8)/2;case Kl:case Jl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case jl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ql:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case ec:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case tc:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case nc:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case ic:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case sc:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case rc:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case ac:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case oc:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case lc:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case cc:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case hc:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case uc:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case dc:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Na:case fc:case pc:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Pd:case mc:return Math.ceil(i/4)*Math.ceil(e/4)*8;case gc:case xc:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Zv(i){switch(i){case li:case bd:return{byteLength:1,components:1};case Cr:case Sd:case Ir:return{byteLength:2,components:1};case Qc:case eh:return{byteLength:2,components:4};case ji:case jc:case $n:return{byteLength:4,components:1};case wd:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function Kv(i,e,t,n,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new ze,c=new WeakMap,u,d=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(T,M){return m?new OffscreenCanvas(T,M):ka("canvas")}function x(T,M,V){let K=1,j=we(T);if((j.width>V||j.height>V)&&(K=V/Math.max(j.width,j.height)),K<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){let Y=Math.floor(K*j.width),be=Math.floor(K*j.height);u===void 0&&(u=g(Y,be));let le=M?g(Y,be):u;return le.width=Y,le.height=be,le.getContext("2d").drawImage(T,0,0,Y,be),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+j.width+"x"+j.height+") to ("+Y+"x"+be+")."),le}else return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+j.width+"x"+j.height+")."),T;return T}function p(T){return T.generateMipmaps}function f(T){i.generateMipmap(T)}function S(T){return T.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?i.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function w(T,M,V,K,j=!1){if(T!==null){if(i[T]!==void 0)return i[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let Y=M;if(M===i.RED&&(V===i.FLOAT&&(Y=i.R32F),V===i.HALF_FLOAT&&(Y=i.R16F),V===i.UNSIGNED_BYTE&&(Y=i.R8)),M===i.RED_INTEGER&&(V===i.UNSIGNED_BYTE&&(Y=i.R8UI),V===i.UNSIGNED_SHORT&&(Y=i.R16UI),V===i.UNSIGNED_INT&&(Y=i.R32UI),V===i.BYTE&&(Y=i.R8I),V===i.SHORT&&(Y=i.R16I),V===i.INT&&(Y=i.R32I)),M===i.RG&&(V===i.FLOAT&&(Y=i.RG32F),V===i.HALF_FLOAT&&(Y=i.RG16F),V===i.UNSIGNED_BYTE&&(Y=i.RG8)),M===i.RG_INTEGER&&(V===i.UNSIGNED_BYTE&&(Y=i.RG8UI),V===i.UNSIGNED_SHORT&&(Y=i.RG16UI),V===i.UNSIGNED_INT&&(Y=i.RG32UI),V===i.BYTE&&(Y=i.RG8I),V===i.SHORT&&(Y=i.RG16I),V===i.INT&&(Y=i.RG32I)),M===i.RGB_INTEGER&&(V===i.UNSIGNED_BYTE&&(Y=i.RGB8UI),V===i.UNSIGNED_SHORT&&(Y=i.RGB16UI),V===i.UNSIGNED_INT&&(Y=i.RGB32UI),V===i.BYTE&&(Y=i.RGB8I),V===i.SHORT&&(Y=i.RGB16I),V===i.INT&&(Y=i.RGB32I)),M===i.RGBA_INTEGER&&(V===i.UNSIGNED_BYTE&&(Y=i.RGBA8UI),V===i.UNSIGNED_SHORT&&(Y=i.RGBA16UI),V===i.UNSIGNED_INT&&(Y=i.RGBA32UI),V===i.BYTE&&(Y=i.RGBA8I),V===i.SHORT&&(Y=i.RGBA16I),V===i.INT&&(Y=i.RGBA32I)),M===i.RGB&&V===i.UNSIGNED_INT_5_9_9_9_REV&&(Y=i.RGB9_E5),M===i.RGBA){let be=j?co:Ze.getTransfer(K);V===i.FLOAT&&(Y=i.RGBA32F),V===i.HALF_FLOAT&&(Y=i.RGBA16F),V===i.UNSIGNED_BYTE&&(Y=be===lt?i.SRGB8_ALPHA8:i.RGBA8),V===i.UNSIGNED_SHORT_4_4_4_4&&(Y=i.RGBA4),V===i.UNSIGNED_SHORT_5_5_5_1&&(Y=i.RGB5_A1)}return(Y===i.R16F||Y===i.R32F||Y===i.RG16F||Y===i.RG32F||Y===i.RGBA16F||Y===i.RGBA32F)&&e.get("EXT_color_buffer_float"),Y}function v(T,M){let V;return T?M===null||M===ji||M===Os?V=i.DEPTH24_STENCIL8:M===$n?V=i.DEPTH32F_STENCIL8:M===Cr&&(V=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):M===null||M===ji||M===Os?V=i.DEPTH_COMPONENT24:M===$n?V=i.DEPTH_COMPONENT32F:M===Cr&&(V=i.DEPTH_COMPONENT16),V}function I(T,M){return p(T)===!0||T.isFramebufferTexture&&T.minFilter!==ln&&T.minFilter!==qn?Math.log2(Math.max(M.width,M.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?M.mipmaps.length:1}function C(T){let M=T.target;M.removeEventListener("dispose",C),A(M),M.isVideoTexture&&c.delete(M)}function E(T){let M=T.target;M.removeEventListener("dispose",E),y(M)}function A(T){let M=n.get(T);if(M.__webglInit===void 0)return;let V=T.source,K=d.get(V);if(K){let j=K[M.__cacheKey];j.usedTimes--,j.usedTimes===0&&_(T),Object.keys(K).length===0&&d.delete(V)}n.remove(T)}function _(T){let M=n.get(T);i.deleteTexture(M.__webglTexture);let V=T.source,K=d.get(V);delete K[M.__cacheKey],a.memory.textures--}function y(T){let M=n.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),n.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(M.__webglFramebuffer[K]))for(let j=0;j<M.__webglFramebuffer[K].length;j++)i.deleteFramebuffer(M.__webglFramebuffer[K][j]);else i.deleteFramebuffer(M.__webglFramebuffer[K]);M.__webglDepthbuffer&&i.deleteRenderbuffer(M.__webglDepthbuffer[K])}else{if(Array.isArray(M.__webglFramebuffer))for(let K=0;K<M.__webglFramebuffer.length;K++)i.deleteFramebuffer(M.__webglFramebuffer[K]);else i.deleteFramebuffer(M.__webglFramebuffer);if(M.__webglDepthbuffer&&i.deleteRenderbuffer(M.__webglDepthbuffer),M.__webglMultisampledFramebuffer&&i.deleteFramebuffer(M.__webglMultisampledFramebuffer),M.__webglColorRenderbuffer)for(let K=0;K<M.__webglColorRenderbuffer.length;K++)M.__webglColorRenderbuffer[K]&&i.deleteRenderbuffer(M.__webglColorRenderbuffer[K]);M.__webglDepthRenderbuffer&&i.deleteRenderbuffer(M.__webglDepthRenderbuffer)}let V=T.textures;for(let K=0,j=V.length;K<j;K++){let Y=n.get(V[K]);Y.__webglTexture&&(i.deleteTexture(Y.__webglTexture),a.memory.textures--),n.remove(V[K])}n.remove(T)}let P=0;function H(){P=0}function R(){let T=P;return T>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+s.maxTextures),P+=1,T}function O(T){let M=[];return M.push(T.wrapS),M.push(T.wrapT),M.push(T.wrapR||0),M.push(T.magFilter),M.push(T.minFilter),M.push(T.anisotropy),M.push(T.internalFormat),M.push(T.format),M.push(T.type),M.push(T.generateMipmaps),M.push(T.premultiplyAlpha),M.push(T.flipY),M.push(T.unpackAlignment),M.push(T.colorSpace),M.join()}function z(T,M){let V=n.get(T);if(T.isVideoTexture&&Ee(T),T.isRenderTargetTexture===!1&&T.version>0&&V.__version!==T.version){let K=T.image;if(K===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(K.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{$(V,T,M);return}}t.bindTexture(i.TEXTURE_2D,V.__webglTexture,i.TEXTURE0+M)}function k(T,M){let V=n.get(T);if(T.version>0&&V.__version!==T.version){$(V,T,M);return}t.bindTexture(i.TEXTURE_2D_ARRAY,V.__webglTexture,i.TEXTURE0+M)}function Z(T,M){let V=n.get(T);if(T.version>0&&V.__version!==T.version){$(V,T,M);return}t.bindTexture(i.TEXTURE_3D,V.__webglTexture,i.TEXTURE0+M)}function G(T,M){let V=n.get(T);if(T.version>0&&V.__version!==T.version){ie(V,T,M);return}t.bindTexture(i.TEXTURE_CUBE_MAP,V.__webglTexture,i.TEXTURE0+M)}let se={[Wl]:i.REPEAT,[Ki]:i.CLAMP_TO_EDGE,[Xl]:i.MIRRORED_REPEAT},ee={[ln]:i.NEAREST,[Zp]:i.NEAREST_MIPMAP_NEAREST,[la]:i.NEAREST_MIPMAP_LINEAR,[qn]:i.LINEAR,[tl]:i.LINEAR_MIPMAP_NEAREST,[Ji]:i.LINEAR_MIPMAP_LINEAR},de={[Qp]:i.NEVER,[rm]:i.ALWAYS,[em]:i.LESS,[Id]:i.LEQUAL,[tm]:i.EQUAL,[sm]:i.GEQUAL,[nm]:i.GREATER,[im]:i.NOTEQUAL};function De(T,M){if(M.type===$n&&e.has("OES_texture_float_linear")===!1&&(M.magFilter===qn||M.magFilter===tl||M.magFilter===la||M.magFilter===Ji||M.minFilter===qn||M.minFilter===tl||M.minFilter===la||M.minFilter===Ji)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(T,i.TEXTURE_WRAP_S,se[M.wrapS]),i.texParameteri(T,i.TEXTURE_WRAP_T,se[M.wrapT]),(T===i.TEXTURE_3D||T===i.TEXTURE_2D_ARRAY)&&i.texParameteri(T,i.TEXTURE_WRAP_R,se[M.wrapR]),i.texParameteri(T,i.TEXTURE_MAG_FILTER,ee[M.magFilter]),i.texParameteri(T,i.TEXTURE_MIN_FILTER,ee[M.minFilter]),M.compareFunction&&(i.texParameteri(T,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(T,i.TEXTURE_COMPARE_FUNC,de[M.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(M.magFilter===ln||M.minFilter!==la&&M.minFilter!==Ji||M.type===$n&&e.has("OES_texture_float_linear")===!1)return;if(M.anisotropy>1||n.get(M).__currentAnisotropy){let V=e.get("EXT_texture_filter_anisotropic");i.texParameterf(T,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,s.getMaxAnisotropy())),n.get(M).__currentAnisotropy=M.anisotropy}}}function et(T,M){let V=!1;T.__webglInit===void 0&&(T.__webglInit=!0,M.addEventListener("dispose",C));let K=M.source,j=d.get(K);j===void 0&&(j={},d.set(K,j));let Y=O(M);if(Y!==T.__cacheKey){j[Y]===void 0&&(j[Y]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,V=!0),j[Y].usedTimes++;let be=j[T.__cacheKey];be!==void 0&&(j[T.__cacheKey].usedTimes--,be.usedTimes===0&&_(M)),T.__cacheKey=Y,T.__webglTexture=j[Y].texture}return V}function $(T,M,V){let K=i.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(K=i.TEXTURE_2D_ARRAY),M.isData3DTexture&&(K=i.TEXTURE_3D);let j=et(T,M),Y=M.source;t.bindTexture(K,T.__webglTexture,i.TEXTURE0+V);let be=n.get(Y);if(Y.version!==be.__version||j===!0){t.activeTexture(i.TEXTURE0+V);let le=Ze.getPrimaries(Ze.workingColorSpace),fe=M.colorSpace===Ti?null:Ze.getPrimaries(M.colorSpace),Ye=M.colorSpace===Ti||le===fe?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,M.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,M.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ye);let te=x(M.image,!1,s.maxTextureSize);te=mt(M,te);let me=r.convert(M.format,M.colorSpace),Te=r.convert(M.type),Re=w(M.internalFormat,me,Te,M.colorSpace,M.isVideoTexture);De(K,M);let ge,qe=M.mipmaps,Be=M.isVideoTexture!==!0,ht=be.__version===void 0||j===!0,U=Y.dataReady,ae=I(M,te);if(M.isDepthTexture)Re=v(M.format===zs,M.type),ht&&(Be?t.texStorage2D(i.TEXTURE_2D,1,Re,te.width,te.height):t.texImage2D(i.TEXTURE_2D,0,Re,te.width,te.height,0,me,Te,null));else if(M.isDataTexture)if(qe.length>0){Be&&ht&&t.texStorage2D(i.TEXTURE_2D,ae,Re,qe[0].width,qe[0].height);for(let q=0,J=qe.length;q<J;q++)ge=qe[q],Be?U&&t.texSubImage2D(i.TEXTURE_2D,q,0,0,ge.width,ge.height,me,Te,ge.data):t.texImage2D(i.TEXTURE_2D,q,Re,ge.width,ge.height,0,me,Te,ge.data);M.generateMipmaps=!1}else Be?(ht&&t.texStorage2D(i.TEXTURE_2D,ae,Re,te.width,te.height),U&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,te.width,te.height,me,Te,te.data)):t.texImage2D(i.TEXTURE_2D,0,Re,te.width,te.height,0,me,Te,te.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){Be&&ht&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ae,Re,qe[0].width,qe[0].height,te.depth);for(let q=0,J=qe.length;q<J;q++)if(ge=qe[q],M.format!==Un)if(me!==null)if(Be){if(U)if(M.layerUpdates.size>0){let ue=pd(ge.width,ge.height,M.format,M.type);for(let ce of M.layerUpdates){let Ne=ge.data.subarray(ce*ue/ge.data.BYTES_PER_ELEMENT,(ce+1)*ue/ge.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,q,0,0,ce,ge.width,ge.height,1,me,Ne)}M.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,q,0,0,0,ge.width,ge.height,te.depth,me,ge.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,q,Re,ge.width,ge.height,te.depth,0,ge.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Be?U&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,q,0,0,0,ge.width,ge.height,te.depth,me,Te,ge.data):t.texImage3D(i.TEXTURE_2D_ARRAY,q,Re,ge.width,ge.height,te.depth,0,me,Te,ge.data)}else{Be&&ht&&t.texStorage2D(i.TEXTURE_2D,ae,Re,qe[0].width,qe[0].height);for(let q=0,J=qe.length;q<J;q++)ge=qe[q],M.format!==Un?me!==null?Be?U&&t.compressedTexSubImage2D(i.TEXTURE_2D,q,0,0,ge.width,ge.height,me,ge.data):t.compressedTexImage2D(i.TEXTURE_2D,q,Re,ge.width,ge.height,0,ge.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Be?U&&t.texSubImage2D(i.TEXTURE_2D,q,0,0,ge.width,ge.height,me,Te,ge.data):t.texImage2D(i.TEXTURE_2D,q,Re,ge.width,ge.height,0,me,Te,ge.data)}else if(M.isDataArrayTexture)if(Be){if(ht&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ae,Re,te.width,te.height,te.depth),U)if(M.layerUpdates.size>0){let q=pd(te.width,te.height,M.format,M.type);for(let J of M.layerUpdates){let ue=te.data.subarray(J*q/te.data.BYTES_PER_ELEMENT,(J+1)*q/te.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,J,te.width,te.height,1,me,Te,ue)}M.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,te.width,te.height,te.depth,me,Te,te.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Re,te.width,te.height,te.depth,0,me,Te,te.data);else if(M.isData3DTexture)Be?(ht&&t.texStorage3D(i.TEXTURE_3D,ae,Re,te.width,te.height,te.depth),U&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,te.width,te.height,te.depth,me,Te,te.data)):t.texImage3D(i.TEXTURE_3D,0,Re,te.width,te.height,te.depth,0,me,Te,te.data);else if(M.isFramebufferTexture){if(ht)if(Be)t.texStorage2D(i.TEXTURE_2D,ae,Re,te.width,te.height);else{let q=te.width,J=te.height;for(let ue=0;ue<ae;ue++)t.texImage2D(i.TEXTURE_2D,ue,Re,q,J,0,me,Te,null),q>>=1,J>>=1}}else if(qe.length>0){if(Be&&ht){let q=we(qe[0]);t.texStorage2D(i.TEXTURE_2D,ae,Re,q.width,q.height)}for(let q=0,J=qe.length;q<J;q++)ge=qe[q],Be?U&&t.texSubImage2D(i.TEXTURE_2D,q,0,0,me,Te,ge):t.texImage2D(i.TEXTURE_2D,q,Re,me,Te,ge);M.generateMipmaps=!1}else if(Be){if(ht){let q=we(te);t.texStorage2D(i.TEXTURE_2D,ae,Re,q.width,q.height)}U&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,me,Te,te)}else t.texImage2D(i.TEXTURE_2D,0,Re,me,Te,te);p(M)&&f(K),be.__version=Y.version,M.onUpdate&&M.onUpdate(M)}T.__version=M.version}function ie(T,M,V){if(M.image.length!==6)return;let K=et(T,M),j=M.source;t.bindTexture(i.TEXTURE_CUBE_MAP,T.__webglTexture,i.TEXTURE0+V);let Y=n.get(j);if(j.version!==Y.__version||K===!0){t.activeTexture(i.TEXTURE0+V);let be=Ze.getPrimaries(Ze.workingColorSpace),le=M.colorSpace===Ti?null:Ze.getPrimaries(M.colorSpace),fe=M.colorSpace===Ti||be===le?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,M.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,M.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,fe);let Ye=M.isCompressedTexture||M.image[0].isCompressedTexture,te=M.image[0]&&M.image[0].isDataTexture,me=[];for(let J=0;J<6;J++)!Ye&&!te?me[J]=x(M.image[J],!0,s.maxCubemapSize):me[J]=te?M.image[J].image:M.image[J],me[J]=mt(M,me[J]);let Te=me[0],Re=r.convert(M.format,M.colorSpace),ge=r.convert(M.type),qe=w(M.internalFormat,Re,ge,M.colorSpace),Be=M.isVideoTexture!==!0,ht=Y.__version===void 0||K===!0,U=j.dataReady,ae=I(M,Te);De(i.TEXTURE_CUBE_MAP,M);let q;if(Ye){Be&&ht&&t.texStorage2D(i.TEXTURE_CUBE_MAP,ae,qe,Te.width,Te.height);for(let J=0;J<6;J++){q=me[J].mipmaps;for(let ue=0;ue<q.length;ue++){let ce=q[ue];M.format!==Un?Re!==null?Be?U&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,ue,0,0,ce.width,ce.height,Re,ce.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,ue,qe,ce.width,ce.height,0,ce.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Be?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,ue,0,0,ce.width,ce.height,Re,ge,ce.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,ue,qe,ce.width,ce.height,0,Re,ge,ce.data)}}}else{if(q=M.mipmaps,Be&&ht){q.length>0&&ae++;let J=we(me[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,ae,qe,J.width,J.height)}for(let J=0;J<6;J++)if(te){Be?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,me[J].width,me[J].height,Re,ge,me[J].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,qe,me[J].width,me[J].height,0,Re,ge,me[J].data);for(let ue=0;ue<q.length;ue++){let Ne=q[ue].image[J].image;Be?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,ue+1,0,0,Ne.width,Ne.height,Re,ge,Ne.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,ue+1,qe,Ne.width,Ne.height,0,Re,ge,Ne.data)}}else{Be?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,Re,ge,me[J]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,qe,Re,ge,me[J]);for(let ue=0;ue<q.length;ue++){let ce=q[ue];Be?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,ue+1,0,0,Re,ge,ce.image[J]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,ue+1,qe,Re,ge,ce.image[J])}}}p(M)&&f(i.TEXTURE_CUBE_MAP),Y.__version=j.version,M.onUpdate&&M.onUpdate(M)}T.__version=M.version}function Me(T,M,V,K,j,Y){let be=r.convert(V.format,V.colorSpace),le=r.convert(V.type),fe=w(V.internalFormat,be,le,V.colorSpace),Ye=n.get(M),te=n.get(V);if(te.__renderTarget=M,!Ye.__hasExternalTextures){let me=Math.max(1,M.width>>Y),Te=Math.max(1,M.height>>Y);j===i.TEXTURE_3D||j===i.TEXTURE_2D_ARRAY?t.texImage3D(j,Y,fe,me,Te,M.depth,0,be,le,null):t.texImage2D(j,Y,fe,me,Te,0,be,le,null)}t.bindFramebuffer(i.FRAMEBUFFER,T),Xe(M)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,K,j,te.__webglTexture,0,We(M)):(j===i.TEXTURE_2D||j>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,K,j,te.__webglTexture,Y),t.bindFramebuffer(i.FRAMEBUFFER,null)}function oe(T,M,V){if(i.bindRenderbuffer(i.RENDERBUFFER,T),M.depthBuffer){let K=M.depthTexture,j=K&&K.isDepthTexture?K.type:null,Y=v(M.stencilBuffer,j),be=M.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,le=We(M);Xe(M)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,le,Y,M.width,M.height):V?i.renderbufferStorageMultisample(i.RENDERBUFFER,le,Y,M.width,M.height):i.renderbufferStorage(i.RENDERBUFFER,Y,M.width,M.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,be,i.RENDERBUFFER,T)}else{let K=M.textures;for(let j=0;j<K.length;j++){let Y=K[j],be=r.convert(Y.format,Y.colorSpace),le=r.convert(Y.type),fe=w(Y.internalFormat,be,le,Y.colorSpace),Ye=We(M);V&&Xe(M)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ye,fe,M.width,M.height):Xe(M)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ye,fe,M.width,M.height):i.renderbufferStorage(i.RENDERBUFFER,fe,M.width,M.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Ae(T,M){if(M&&M.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,T),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let K=n.get(M.depthTexture);K.__renderTarget=M,(!K.__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),z(M.depthTexture,0);let j=K.__webglTexture,Y=We(M);if(M.depthTexture.format===Ds)Xe(M)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,j,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,j,0);else if(M.depthTexture.format===zs)Xe(M)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,j,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,j,0);else throw new Error("Unknown depthTexture format")}function Ue(T){let M=n.get(T),V=T.isWebGLCubeRenderTarget===!0;if(M.__boundDepthTexture!==T.depthTexture){let K=T.depthTexture;if(M.__depthDisposeCallback&&M.__depthDisposeCallback(),K){let j=()=>{delete M.__boundDepthTexture,delete M.__depthDisposeCallback,K.removeEventListener("dispose",j)};K.addEventListener("dispose",j),M.__depthDisposeCallback=j}M.__boundDepthTexture=K}if(T.depthTexture&&!M.__autoAllocateDepthBuffer){if(V)throw new Error("target.depthTexture not supported in Cube render targets");Ae(M.__webglFramebuffer,T)}else if(V){M.__webglDepthbuffer=[];for(let K=0;K<6;K++)if(t.bindFramebuffer(i.FRAMEBUFFER,M.__webglFramebuffer[K]),M.__webglDepthbuffer[K]===void 0)M.__webglDepthbuffer[K]=i.createRenderbuffer(),oe(M.__webglDepthbuffer[K],T,!1);else{let j=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Y=M.__webglDepthbuffer[K];i.bindRenderbuffer(i.RENDERBUFFER,Y),i.framebufferRenderbuffer(i.FRAMEBUFFER,j,i.RENDERBUFFER,Y)}}else if(t.bindFramebuffer(i.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer===void 0)M.__webglDepthbuffer=i.createRenderbuffer(),oe(M.__webglDepthbuffer,T,!1);else{let K=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,j=M.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,j),i.framebufferRenderbuffer(i.FRAMEBUFFER,K,i.RENDERBUFFER,j)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Oe(T,M,V){let K=n.get(T);M!==void 0&&Me(K.__webglFramebuffer,T,T.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),V!==void 0&&Ue(T)}function Mt(T){let M=T.texture,V=n.get(T),K=n.get(M);T.addEventListener("dispose",E);let j=T.textures,Y=T.isWebGLCubeRenderTarget===!0,be=j.length>1;if(be||(K.__webglTexture===void 0&&(K.__webglTexture=i.createTexture()),K.__version=M.version,a.memory.textures++),Y){V.__webglFramebuffer=[];for(let le=0;le<6;le++)if(M.mipmaps&&M.mipmaps.length>0){V.__webglFramebuffer[le]=[];for(let fe=0;fe<M.mipmaps.length;fe++)V.__webglFramebuffer[le][fe]=i.createFramebuffer()}else V.__webglFramebuffer[le]=i.createFramebuffer()}else{if(M.mipmaps&&M.mipmaps.length>0){V.__webglFramebuffer=[];for(let le=0;le<M.mipmaps.length;le++)V.__webglFramebuffer[le]=i.createFramebuffer()}else V.__webglFramebuffer=i.createFramebuffer();if(be)for(let le=0,fe=j.length;le<fe;le++){let Ye=n.get(j[le]);Ye.__webglTexture===void 0&&(Ye.__webglTexture=i.createTexture(),a.memory.textures++)}if(T.samples>0&&Xe(T)===!1){V.__webglMultisampledFramebuffer=i.createFramebuffer(),V.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let le=0;le<j.length;le++){let fe=j[le];V.__webglColorRenderbuffer[le]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,V.__webglColorRenderbuffer[le]);let Ye=r.convert(fe.format,fe.colorSpace),te=r.convert(fe.type),me=w(fe.internalFormat,Ye,te,fe.colorSpace,T.isXRRenderTarget===!0),Te=We(T);i.renderbufferStorageMultisample(i.RENDERBUFFER,Te,me,T.width,T.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+le,i.RENDERBUFFER,V.__webglColorRenderbuffer[le])}i.bindRenderbuffer(i.RENDERBUFFER,null),T.depthBuffer&&(V.__webglDepthRenderbuffer=i.createRenderbuffer(),oe(V.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(Y){t.bindTexture(i.TEXTURE_CUBE_MAP,K.__webglTexture),De(i.TEXTURE_CUBE_MAP,M);for(let le=0;le<6;le++)if(M.mipmaps&&M.mipmaps.length>0)for(let fe=0;fe<M.mipmaps.length;fe++)Me(V.__webglFramebuffer[le][fe],T,M,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+le,fe);else Me(V.__webglFramebuffer[le],T,M,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+le,0);p(M)&&f(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(be){for(let le=0,fe=j.length;le<fe;le++){let Ye=j[le],te=n.get(Ye);t.bindTexture(i.TEXTURE_2D,te.__webglTexture),De(i.TEXTURE_2D,Ye),Me(V.__webglFramebuffer,T,Ye,i.COLOR_ATTACHMENT0+le,i.TEXTURE_2D,0),p(Ye)&&f(i.TEXTURE_2D)}t.unbindTexture()}else{let le=i.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(le=T.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(le,K.__webglTexture),De(le,M),M.mipmaps&&M.mipmaps.length>0)for(let fe=0;fe<M.mipmaps.length;fe++)Me(V.__webglFramebuffer[fe],T,M,i.COLOR_ATTACHMENT0,le,fe);else Me(V.__webglFramebuffer,T,M,i.COLOR_ATTACHMENT0,le,0);p(M)&&f(le),t.unbindTexture()}T.depthBuffer&&Ue(T)}function $e(T){let M=T.textures;for(let V=0,K=M.length;V<K;V++){let j=M[V];if(p(j)){let Y=S(T),be=n.get(j).__webglTexture;t.bindTexture(Y,be),f(Y),t.unbindTexture()}}}let Tt=[],B=[];function gn(T){if(T.samples>0){if(Xe(T)===!1){let M=T.textures,V=T.width,K=T.height,j=i.COLOR_BUFFER_BIT,Y=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,be=n.get(T),le=M.length>1;if(le)for(let fe=0;fe<M.length;fe++)t.bindFramebuffer(i.FRAMEBUFFER,be.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,be.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,be.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,be.__webglFramebuffer);for(let fe=0;fe<M.length;fe++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(j|=i.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(j|=i.STENCIL_BUFFER_BIT)),le){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,be.__webglColorRenderbuffer[fe]);let Ye=n.get(M[fe]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Ye,0)}i.blitFramebuffer(0,0,V,K,0,0,V,K,j,i.NEAREST),l===!0&&(Tt.length=0,B.length=0,Tt.push(i.COLOR_ATTACHMENT0+fe),T.depthBuffer&&T.resolveDepthBuffer===!1&&(Tt.push(Y),B.push(Y),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,B)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Tt))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),le)for(let fe=0;fe<M.length;fe++){t.bindFramebuffer(i.FRAMEBUFFER,be.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.RENDERBUFFER,be.__webglColorRenderbuffer[fe]);let Ye=n.get(M[fe]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,be.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.TEXTURE_2D,Ye,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,be.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&l){let M=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[M])}}}function We(T){return Math.min(s.maxSamples,T.samples)}function Xe(T){let M=n.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function Ee(T){let M=a.render.frame;c.get(T)!==M&&(c.set(T,M),T.update())}function mt(T,M){let V=T.colorSpace,K=T.format,j=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||V!==Ws&&V!==Ti&&(Ze.getTransfer(V)===lt?(K!==Un||j!==li)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",V)),M}function we(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(h.width=T.naturalWidth||T.width,h.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(h.width=T.displayWidth,h.height=T.displayHeight):(h.width=T.width,h.height=T.height),h}this.allocateTextureUnit=R,this.resetTextureUnits=H,this.setTexture2D=z,this.setTexture2DArray=k,this.setTexture3D=Z,this.setTextureCube=G,this.rebindTextures=Oe,this.setupRenderTarget=Mt,this.updateRenderTargetMipmap=$e,this.updateMultisampleRenderTarget=gn,this.setupDepthRenderbuffer=Ue,this.setupFrameBufferTexture=Me,this.useMultisampledRTT=Xe}function Jv(i,e){function t(n,s=Ti){let r,a=Ze.getTransfer(s);if(n===li)return i.UNSIGNED_BYTE;if(n===Qc)return i.UNSIGNED_SHORT_4_4_4_4;if(n===eh)return i.UNSIGNED_SHORT_5_5_5_1;if(n===wd)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===bd)return i.BYTE;if(n===Sd)return i.SHORT;if(n===Cr)return i.UNSIGNED_SHORT;if(n===jc)return i.INT;if(n===ji)return i.UNSIGNED_INT;if(n===$n)return i.FLOAT;if(n===Ir)return i.HALF_FLOAT;if(n===Ed)return i.ALPHA;if(n===Td)return i.RGB;if(n===Un)return i.RGBA;if(n===Ad)return i.LUMINANCE;if(n===Cd)return i.LUMINANCE_ALPHA;if(n===Ds)return i.DEPTH_COMPONENT;if(n===zs)return i.DEPTH_STENCIL;if(n===th)return i.RED;if(n===nh)return i.RED_INTEGER;if(n===Rd)return i.RG;if(n===ih)return i.RG_INTEGER;if(n===sh)return i.RGBA_INTEGER;if(n===Ia||n===La||n===Da||n===Ua)if(a===lt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Ia)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===La)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Da)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ua)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Ia)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===La)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Da)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ua)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===ql||n===$l||n===Yl||n===Zl)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===ql)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===$l)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Yl)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Zl)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Kl||n===Jl||n===jl)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Kl||n===Jl)return a===lt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===jl)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Ql||n===ec||n===tc||n===nc||n===ic||n===sc||n===rc||n===ac||n===oc||n===lc||n===cc||n===hc||n===uc||n===dc)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Ql)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ec)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===tc)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===nc)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===ic)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===sc)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===rc)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ac)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===oc)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===lc)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===cc)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===hc)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===uc)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===dc)return a===lt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Na||n===fc||n===pc)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Na)return a===lt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===fc)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===pc)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Pd||n===mc||n===gc||n===xc)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Na)return r.COMPRESSED_RED_RGTC1_EXT;if(n===mc)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===gc)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===xc)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Os?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var Uc=class extends Gt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},Nn=class extends $t{constructor(){super(),this.isGroup=!0,this.type="Group"}},jv={type:"move"},Tr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Nn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Nn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Nn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,h=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(h&&e.hand){a=!0;for(let x of e.hand.values()){let p=t.getJointPose(x,n),f=this._getHandJoint(h,x);p!==null&&(f.matrix.fromArray(p.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=p.radius),f.visible=p!==null}let c=h.joints["index-finger-tip"],u=h.joints["thumb-tip"],d=c.position.distanceTo(u.position),m=.02,g=.005;h.inputState.pinching&&d>m+g?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!h.inputState.pinching&&d<=m-g&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(jv)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),h!==null&&(h.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Nn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Qv=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,ey=`
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

}`,Nc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){let s=new hn,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!=n.depthNear||t.depthFar!=n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Yn({vertexShader:Qv,fragmentShader:ey,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new St(new ts(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Fc=class extends Pi{constructor(e,t){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,h=null,c=null,u=null,d=null,m=null,g=null,x=new Nc,p=t.getContextAttributes(),f=null,S=null,w=[],v=[],I=new ze,C=null,E=new Gt;E.viewport=new ct;let A=new Gt;A.viewport=new ct;let _=[E,A],y=new Uc,P=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let ie=w[$];return ie===void 0&&(ie=new Tr,w[$]=ie),ie.getTargetRaySpace()},this.getControllerGrip=function($){let ie=w[$];return ie===void 0&&(ie=new Tr,w[$]=ie),ie.getGripSpace()},this.getHand=function($){let ie=w[$];return ie===void 0&&(ie=new Tr,w[$]=ie),ie.getHandSpace()};function R($){let ie=v.indexOf($.inputSource);if(ie===-1)return;let Me=w[ie];Me!==void 0&&(Me.update($.inputSource,$.frame,h||a),Me.dispatchEvent({type:$.type,data:$.inputSource}))}function O(){s.removeEventListener("select",R),s.removeEventListener("selectstart",R),s.removeEventListener("selectend",R),s.removeEventListener("squeeze",R),s.removeEventListener("squeezestart",R),s.removeEventListener("squeezeend",R),s.removeEventListener("end",O),s.removeEventListener("inputsourceschange",z);for(let $=0;$<w.length;$++){let ie=v[$];ie!==null&&(v[$]=null,w[$].disconnect(ie))}P=null,H=null,x.reset(),e.setRenderTarget(f),m=null,d=null,u=null,s=null,S=null,et.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(I.width,I.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){r=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){o=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||a},this.setReferenceSpace=function($){h=$},this.getBaseLayer=function(){return d!==null?d:m},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function($){if(s=$,s!==null){if(f=e.getRenderTarget(),s.addEventListener("select",R),s.addEventListener("selectstart",R),s.addEventListener("selectend",R),s.addEventListener("squeeze",R),s.addEventListener("squeezestart",R),s.addEventListener("squeezeend",R),s.addEventListener("end",O),s.addEventListener("inputsourceschange",z),p.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(I),s.renderState.layers===void 0){let ie={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,t,ie),s.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),S=new ci(m.framebufferWidth,m.framebufferHeight,{format:Un,type:li,colorSpace:e.outputColorSpace,stencilBuffer:p.stencil})}else{let ie=null,Me=null,oe=null;p.depth&&(oe=p.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ie=p.stencil?zs:Ds,Me=p.stencil?Os:ji);let Ae={colorFormat:t.RGBA8,depthFormat:oe,scaleFactor:r};u=new XRWebGLBinding(s,t),d=u.createProjectionLayer(Ae),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),S=new ci(d.textureWidth,d.textureHeight,{format:Un,type:li,depthTexture:new $a(d.textureWidth,d.textureHeight,Me,void 0,void 0,void 0,void 0,void 0,void 0,ie),stencilBuffer:p.stencil,colorSpace:e.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(l),h=null,a=await s.requestReferenceSpace(o),et.setContext(s),et.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function z($){for(let ie=0;ie<$.removed.length;ie++){let Me=$.removed[ie],oe=v.indexOf(Me);oe>=0&&(v[oe]=null,w[oe].disconnect(Me))}for(let ie=0;ie<$.added.length;ie++){let Me=$.added[ie],oe=v.indexOf(Me);if(oe===-1){for(let Ue=0;Ue<w.length;Ue++)if(Ue>=v.length){v.push(Me),oe=Ue;break}else if(v[Ue]===null){v[Ue]=Me,oe=Ue;break}if(oe===-1)break}let Ae=w[oe];Ae&&Ae.connect(Me)}}let k=new L,Z=new L;function G($,ie,Me){k.setFromMatrixPosition(ie.matrixWorld),Z.setFromMatrixPosition(Me.matrixWorld);let oe=k.distanceTo(Z),Ae=ie.projectionMatrix.elements,Ue=Me.projectionMatrix.elements,Oe=Ae[14]/(Ae[10]-1),Mt=Ae[14]/(Ae[10]+1),$e=(Ae[9]+1)/Ae[5],Tt=(Ae[9]-1)/Ae[5],B=(Ae[8]-1)/Ae[0],gn=(Ue[8]+1)/Ue[0],We=Oe*B,Xe=Oe*gn,Ee=oe/(-B+gn),mt=Ee*-B;if(ie.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(mt),$.translateZ(Ee),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),Ae[10]===-1)$.projectionMatrix.copy(ie.projectionMatrix),$.projectionMatrixInverse.copy(ie.projectionMatrixInverse);else{let we=Oe+Ee,T=Mt+Ee,M=We-mt,V=Xe+(oe-mt),K=$e*Mt/T*we,j=Tt*Mt/T*we;$.projectionMatrix.makePerspective(M,V,K,j,we,T),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function se($,ie){ie===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(ie.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(s===null)return;let ie=$.near,Me=$.far;x.texture!==null&&(x.depthNear>0&&(ie=x.depthNear),x.depthFar>0&&(Me=x.depthFar)),y.near=A.near=E.near=ie,y.far=A.far=E.far=Me,(P!==y.near||H!==y.far)&&(s.updateRenderState({depthNear:y.near,depthFar:y.far}),P=y.near,H=y.far),E.layers.mask=$.layers.mask|2,A.layers.mask=$.layers.mask|4,y.layers.mask=E.layers.mask|A.layers.mask;let oe=$.parent,Ae=y.cameras;se(y,oe);for(let Ue=0;Ue<Ae.length;Ue++)se(Ae[Ue],oe);Ae.length===2?G(y,E,A):y.projectionMatrix.copy(E.projectionMatrix),ee($,y,oe)};function ee($,ie,Me){Me===null?$.matrix.copy(ie.matrixWorld):($.matrix.copy(Me.matrixWorld),$.matrix.invert(),$.matrix.multiply(ie.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(ie.projectionMatrix),$.projectionMatrixInverse.copy(ie.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=yc*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return y},this.getFoveation=function(){if(!(d===null&&m===null))return l},this.setFoveation=function($){l=$,d!==null&&(d.fixedFoveation=$),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=$)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(y)};let de=null;function De($,ie){if(c=ie.getViewerPose(h||a),g=ie,c!==null){let Me=c.views;m!==null&&(e.setRenderTargetFramebuffer(S,m.framebuffer),e.setRenderTarget(S));let oe=!1;Me.length!==y.cameras.length&&(y.cameras.length=0,oe=!0);for(let Ue=0;Ue<Me.length;Ue++){let Oe=Me[Ue],Mt=null;if(m!==null)Mt=m.getViewport(Oe);else{let Tt=u.getViewSubImage(d,Oe);Mt=Tt.viewport,Ue===0&&(e.setRenderTargetTextures(S,Tt.colorTexture,d.ignoreDepthValues?void 0:Tt.depthStencilTexture),e.setRenderTarget(S))}let $e=_[Ue];$e===void 0&&($e=new Gt,$e.layers.enable(Ue),$e.viewport=new ct,_[Ue]=$e),$e.matrix.fromArray(Oe.transform.matrix),$e.matrix.decompose($e.position,$e.quaternion,$e.scale),$e.projectionMatrix.fromArray(Oe.projectionMatrix),$e.projectionMatrixInverse.copy($e.projectionMatrix).invert(),$e.viewport.set(Mt.x,Mt.y,Mt.width,Mt.height),Ue===0&&(y.matrix.copy($e.matrix),y.matrix.decompose(y.position,y.quaternion,y.scale)),oe===!0&&y.cameras.push($e)}let Ae=s.enabledFeatures;if(Ae&&Ae.includes("depth-sensing")){let Ue=u.getDepthInformation(Me[0]);Ue&&Ue.isValid&&Ue.texture&&x.init(e,Ue,s.renderState)}}for(let Me=0;Me<w.length;Me++){let oe=v[Me],Ae=w[Me];oe!==null&&Ae!==void 0&&Ae.update(oe,ie,h||a)}de&&de($,ie),ie.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ie}),g=null}let et=new Nd;et.setAnimationLoop(De),this.setAnimationLoop=function($){de=$},this.dispose=function(){}}},Xi=new Pt,ty=new He;function ny(i,e){function t(p,f){p.matrixAutoUpdate===!0&&p.updateMatrix(),f.value.copy(p.matrix)}function n(p,f){f.color.getRGB(p.fogColor.value,Ud(i)),f.isFog?(p.fogNear.value=f.near,p.fogFar.value=f.far):f.isFogExp2&&(p.fogDensity.value=f.density)}function s(p,f,S,w,v){f.isMeshBasicMaterial||f.isMeshLambertMaterial?r(p,f):f.isMeshToonMaterial?(r(p,f),u(p,f)):f.isMeshPhongMaterial?(r(p,f),c(p,f)):f.isMeshStandardMaterial?(r(p,f),d(p,f),f.isMeshPhysicalMaterial&&m(p,f,v)):f.isMeshMatcapMaterial?(r(p,f),g(p,f)):f.isMeshDepthMaterial?r(p,f):f.isMeshDistanceMaterial?(r(p,f),x(p,f)):f.isMeshNormalMaterial?r(p,f):f.isLineBasicMaterial?(a(p,f),f.isLineDashedMaterial&&o(p,f)):f.isPointsMaterial?l(p,f,S,w):f.isSpriteMaterial?h(p,f):f.isShadowMaterial?(p.color.value.copy(f.color),p.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(p,f){p.opacity.value=f.opacity,f.color&&p.diffuse.value.copy(f.color),f.emissive&&p.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(p.map.value=f.map,t(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.bumpMap&&(p.bumpMap.value=f.bumpMap,t(f.bumpMap,p.bumpMapTransform),p.bumpScale.value=f.bumpScale,f.side===nn&&(p.bumpScale.value*=-1)),f.normalMap&&(p.normalMap.value=f.normalMap,t(f.normalMap,p.normalMapTransform),p.normalScale.value.copy(f.normalScale),f.side===nn&&p.normalScale.value.negate()),f.displacementMap&&(p.displacementMap.value=f.displacementMap,t(f.displacementMap,p.displacementMapTransform),p.displacementScale.value=f.displacementScale,p.displacementBias.value=f.displacementBias),f.emissiveMap&&(p.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,p.emissiveMapTransform)),f.specularMap&&(p.specularMap.value=f.specularMap,t(f.specularMap,p.specularMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest);let S=e.get(f),w=S.envMap,v=S.envMapRotation;w&&(p.envMap.value=w,Xi.copy(v),Xi.x*=-1,Xi.y*=-1,Xi.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(Xi.y*=-1,Xi.z*=-1),p.envMapRotation.value.setFromMatrix4(ty.makeRotationFromEuler(Xi)),p.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=f.reflectivity,p.ior.value=f.ior,p.refractionRatio.value=f.refractionRatio),f.lightMap&&(p.lightMap.value=f.lightMap,p.lightMapIntensity.value=f.lightMapIntensity,t(f.lightMap,p.lightMapTransform)),f.aoMap&&(p.aoMap.value=f.aoMap,p.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,p.aoMapTransform))}function a(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,f.map&&(p.map.value=f.map,t(f.map,p.mapTransform))}function o(p,f){p.dashSize.value=f.dashSize,p.totalSize.value=f.dashSize+f.gapSize,p.scale.value=f.scale}function l(p,f,S,w){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.size.value=f.size*S,p.scale.value=w*.5,f.map&&(p.map.value=f.map,t(f.map,p.uvTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function h(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.rotation.value=f.rotation,f.map&&(p.map.value=f.map,t(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function c(p,f){p.specular.value.copy(f.specular),p.shininess.value=Math.max(f.shininess,1e-4)}function u(p,f){f.gradientMap&&(p.gradientMap.value=f.gradientMap)}function d(p,f){p.metalness.value=f.metalness,f.metalnessMap&&(p.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,p.metalnessMapTransform)),p.roughness.value=f.roughness,f.roughnessMap&&(p.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,p.roughnessMapTransform)),f.envMap&&(p.envMapIntensity.value=f.envMapIntensity)}function m(p,f,S){p.ior.value=f.ior,f.sheen>0&&(p.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),p.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(p.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,p.sheenColorMapTransform)),f.sheenRoughnessMap&&(p.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,p.sheenRoughnessMapTransform))),f.clearcoat>0&&(p.clearcoat.value=f.clearcoat,p.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(p.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,p.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(p.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===nn&&p.clearcoatNormalScale.value.negate())),f.dispersion>0&&(p.dispersion.value=f.dispersion),f.iridescence>0&&(p.iridescence.value=f.iridescence,p.iridescenceIOR.value=f.iridescenceIOR,p.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(p.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,p.iridescenceMapTransform)),f.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),f.transmission>0&&(p.transmission.value=f.transmission,p.transmissionSamplerMap.value=S.texture,p.transmissionSamplerSize.value.set(S.width,S.height),f.transmissionMap&&(p.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,p.transmissionMapTransform)),p.thickness.value=f.thickness,f.thicknessMap&&(p.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=f.attenuationDistance,p.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(p.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(p.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=f.specularIntensity,p.specularColor.value.copy(f.specularColor),f.specularColorMap&&(p.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,p.specularColorMapTransform)),f.specularIntensityMap&&(p.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,f){f.matcap&&(p.matcap.value=f.matcap)}function x(p,f){let S=e.get(f).light;p.referencePosition.value.setFromMatrixPosition(S.matrixWorld),p.nearDistance.value=S.shadow.camera.near,p.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function iy(i,e,t,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(S,w){let v=w.program;n.uniformBlockBinding(S,v)}function h(S,w){let v=s[S.id];v===void 0&&(g(S),v=c(S),s[S.id]=v,S.addEventListener("dispose",p));let I=w.program;n.updateUBOMapping(S,I);let C=e.render.frame;r[S.id]!==C&&(d(S),r[S.id]=C)}function c(S){let w=u();S.__bindingPointIndex=w;let v=i.createBuffer(),I=S.__size,C=S.usage;return i.bindBuffer(i.UNIFORM_BUFFER,v),i.bufferData(i.UNIFORM_BUFFER,I,C),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,w,v),v}function u(){for(let S=0;S<o;S++)if(a.indexOf(S)===-1)return a.push(S),S;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(S){let w=s[S.id],v=S.uniforms,I=S.__cache;i.bindBuffer(i.UNIFORM_BUFFER,w);for(let C=0,E=v.length;C<E;C++){let A=Array.isArray(v[C])?v[C]:[v[C]];for(let _=0,y=A.length;_<y;_++){let P=A[_];if(m(P,C,_,I)===!0){let H=P.__offset,R=Array.isArray(P.value)?P.value:[P.value],O=0;for(let z=0;z<R.length;z++){let k=R[z],Z=x(k);typeof k=="number"||typeof k=="boolean"?(P.__data[0]=k,i.bufferSubData(i.UNIFORM_BUFFER,H+O,P.__data)):k.isMatrix3?(P.__data[0]=k.elements[0],P.__data[1]=k.elements[1],P.__data[2]=k.elements[2],P.__data[3]=0,P.__data[4]=k.elements[3],P.__data[5]=k.elements[4],P.__data[6]=k.elements[5],P.__data[7]=0,P.__data[8]=k.elements[6],P.__data[9]=k.elements[7],P.__data[10]=k.elements[8],P.__data[11]=0):(k.toArray(P.__data,O),O+=Z.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,H,P.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(S,w,v,I){let C=S.value,E=w+"_"+v;if(I[E]===void 0)return typeof C=="number"||typeof C=="boolean"?I[E]=C:I[E]=C.clone(),!0;{let A=I[E];if(typeof C=="number"||typeof C=="boolean"){if(A!==C)return I[E]=C,!0}else if(A.equals(C)===!1)return A.copy(C),!0}return!1}function g(S){let w=S.uniforms,v=0,I=16;for(let E=0,A=w.length;E<A;E++){let _=Array.isArray(w[E])?w[E]:[w[E]];for(let y=0,P=_.length;y<P;y++){let H=_[y],R=Array.isArray(H.value)?H.value:[H.value];for(let O=0,z=R.length;O<z;O++){let k=R[O],Z=x(k),G=v%I,se=G%Z.boundary,ee=G+se;v+=se,ee!==0&&I-ee<Z.storage&&(v+=I-ee),H.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),H.__offset=v,v+=Z.storage}}}let C=v%I;return C>0&&(v+=I-C),S.__size=v,S.__cache={},this}function x(S){let w={boundary:0,storage:0};return typeof S=="number"||typeof S=="boolean"?(w.boundary=4,w.storage=4):S.isVector2?(w.boundary=8,w.storage=8):S.isVector3||S.isColor?(w.boundary=16,w.storage=12):S.isVector4?(w.boundary=16,w.storage=16):S.isMatrix3?(w.boundary=48,w.storage=48):S.isMatrix4?(w.boundary=64,w.storage=64):S.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",S),w}function p(S){let w=S.target;w.removeEventListener("dispose",p);let v=a.indexOf(w.__bindingPointIndex);a.splice(v,1),i.deleteBuffer(s[w.id]),delete s[w.id],delete r[w.id]}function f(){for(let S in s)i.deleteBuffer(s[S]);a=[],s={},r={}}return{bind:l,update:h,dispose:f}}var Ya=class{constructor(e={}){let{canvas:t=om(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:h=!1,powerPreference:c="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=a;let g=new Uint32Array(4),x=new Int32Array(4),p=null,f=null,S=[],w=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=yn,this.toneMapping=Ci,this.toneMappingExposure=1;let v=this,I=!1,C=0,E=0,A=null,_=-1,y=null,P=new ct,H=new ct,R=null,O=new xe(0),z=0,k=t.width,Z=t.height,G=1,se=null,ee=null,de=new ct(0,0,k,Z),De=new ct(0,0,k,Z),et=!1,$=new Rr,ie=!1,Me=!1,oe=new He,Ae=new He,Ue=new L,Oe=new ct,Mt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},$e=!1;function Tt(){return A===null?G:1}let B=n;function gn(b,N){return t.getContext(b,N)}try{let b={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:h,powerPreference:c,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine","three.js r170"),t.addEventListener("webglcontextlost",J,!1),t.addEventListener("webglcontextrestored",ue,!1),t.addEventListener("webglcontextcreationerror",ce,!1),B===null){let N="webgl2";if(B=gn(N,b),B===null)throw gn(N)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(b){throw console.error("THREE.WebGLRenderer: "+b.message),b}let We,Xe,Ee,mt,we,T,M,V,K,j,Y,be,le,fe,Ye,te,me,Te,Re,ge,qe,Be,ht,U;function ae(){We=new yx(B),We.init(),Be=new Jv(B,We),Xe=new fx(B,We,e,Be),Ee=new Yv(B,We),Xe.reverseDepthBuffer&&d&&Ee.buffers.depth.setReversed(!0),mt=new bx(B),we=new Nv,T=new Kv(B,We,Ee,we,Xe,Be,mt),M=new mx(v),V=new vx(v),K=new Rm(B),ht=new ux(B,K),j=new _x(B,K,mt,ht),Y=new wx(B,j,K,mt),Re=new Sx(B,Xe,T),te=new px(we),be=new Uv(v,M,V,We,Xe,ht,te),le=new ny(v,we),fe=new Bv,Ye=new Gv(We),Te=new hx(v,M,V,Ee,Y,m,l),me=new qv(v,Y,Xe),U=new iy(B,mt,Xe,Ee),ge=new dx(B,We,mt),qe=new Mx(B,We,mt),mt.programs=be.programs,v.capabilities=Xe,v.extensions=We,v.properties=we,v.renderLists=fe,v.shadowMap=me,v.state=Ee,v.info=mt}ae();let q=new Fc(v,B);this.xr=q,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){let b=We.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){let b=We.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return G},this.setPixelRatio=function(b){b!==void 0&&(G=b,this.setSize(k,Z,!1))},this.getSize=function(b){return b.set(k,Z)},this.setSize=function(b,N,W=!0){if(q.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}k=b,Z=N,t.width=Math.floor(b*G),t.height=Math.floor(N*G),W===!0&&(t.style.width=b+"px",t.style.height=N+"px"),this.setViewport(0,0,b,N)},this.getDrawingBufferSize=function(b){return b.set(k*G,Z*G).floor()},this.setDrawingBufferSize=function(b,N,W){k=b,Z=N,G=W,t.width=Math.floor(b*W),t.height=Math.floor(N*W),this.setViewport(0,0,b,N)},this.getCurrentViewport=function(b){return b.copy(P)},this.getViewport=function(b){return b.copy(de)},this.setViewport=function(b,N,W,X){b.isVector4?de.set(b.x,b.y,b.z,b.w):de.set(b,N,W,X),Ee.viewport(P.copy(de).multiplyScalar(G).round())},this.getScissor=function(b){return b.copy(De)},this.setScissor=function(b,N,W,X){b.isVector4?De.set(b.x,b.y,b.z,b.w):De.set(b,N,W,X),Ee.scissor(H.copy(De).multiplyScalar(G).round())},this.getScissorTest=function(){return et},this.setScissorTest=function(b){Ee.setScissorTest(et=b)},this.setOpaqueSort=function(b){se=b},this.setTransparentSort=function(b){ee=b},this.getClearColor=function(b){return b.copy(Te.getClearColor())},this.setClearColor=function(){Te.setClearColor.apply(Te,arguments)},this.getClearAlpha=function(){return Te.getClearAlpha()},this.setClearAlpha=function(){Te.setClearAlpha.apply(Te,arguments)},this.clear=function(b=!0,N=!0,W=!0){let X=0;if(b){let F=!1;if(A!==null){let ne=A.texture.format;F=ne===sh||ne===ih||ne===nh}if(F){let ne=A.texture.type,he=ne===li||ne===ji||ne===Cr||ne===Os||ne===Qc||ne===eh,ve=Te.getClearColor(),ye=Te.getClearAlpha(),Pe=ve.r,Fe=ve.g,_e=ve.b;he?(g[0]=Pe,g[1]=Fe,g[2]=_e,g[3]=ye,B.clearBufferuiv(B.COLOR,0,g)):(x[0]=Pe,x[1]=Fe,x[2]=_e,x[3]=ye,B.clearBufferiv(B.COLOR,0,x))}else X|=B.COLOR_BUFFER_BIT}N&&(X|=B.DEPTH_BUFFER_BIT),W&&(X|=B.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),B.clear(X)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",J,!1),t.removeEventListener("webglcontextrestored",ue,!1),t.removeEventListener("webglcontextcreationerror",ce,!1),fe.dispose(),Ye.dispose(),we.dispose(),M.dispose(),V.dispose(),Y.dispose(),ht.dispose(),U.dispose(),be.dispose(),q.dispose(),q.removeEventListener("sessionstart",Kh),q.removeEventListener("sessionend",Jh),ki.stop()};function J(b){b.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),I=!0}function ue(){console.log("THREE.WebGLRenderer: Context Restored."),I=!1;let b=mt.autoReset,N=me.enabled,W=me.autoUpdate,X=me.needsUpdate,F=me.type;ae(),mt.autoReset=b,me.enabled=N,me.autoUpdate=W,me.needsUpdate=X,me.type=F}function ce(b){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function Ne(b){let N=b.target;N.removeEventListener("dispose",Ne),bt(N)}function bt(b){zt(b),we.remove(b)}function zt(b){let N=we.get(b).programs;N!==void 0&&(N.forEach(function(W){be.releaseProgram(W)}),b.isShaderMaterial&&be.releaseShaderCache(b))}this.renderBufferDirect=function(b,N,W,X,F,ne){N===null&&(N=Mt);let he=F.isMesh&&F.matrixWorld.determinant()<0,ve=Xf(b,N,W,X,F);Ee.setMaterial(X,he);let ye=W.index,Pe=1;if(X.wireframe===!0){if(ye=j.getWireframeAttribute(W),ye===void 0)return;Pe=2}let Fe=W.drawRange,_e=W.attributes.position,Ke=Fe.start*Pe,ut=(Fe.start+Fe.count)*Pe;ne!==null&&(Ke=Math.max(Ke,ne.start*Pe),ut=Math.min(ut,(ne.start+ne.count)*Pe)),ye!==null?(Ke=Math.max(Ke,0),ut=Math.min(ut,ye.count)):_e!=null&&(Ke=Math.max(Ke,0),ut=Math.min(ut,_e.count));let gt=ut-Ke;if(gt<0||gt===1/0)return;ht.setup(F,X,ve,W,ye);let jt,tt=ge;if(ye!==null&&(jt=K.get(ye),tt=qe,tt.setIndex(jt)),F.isMesh)X.wireframe===!0?(Ee.setLineWidth(X.wireframeLinewidth*Tt()),tt.setMode(B.LINES)):tt.setMode(B.TRIANGLES);else if(F.isLine){let Se=X.linewidth;Se===void 0&&(Se=1),Ee.setLineWidth(Se*Tt()),F.isLineSegments?tt.setMode(B.LINES):F.isLineLoop?tt.setMode(B.LINE_LOOP):tt.setMode(B.LINE_STRIP)}else F.isPoints?tt.setMode(B.POINTS):F.isSprite&&tt.setMode(B.TRIANGLES);if(F.isBatchedMesh)if(F._multiDrawInstances!==null)tt.renderMultiDrawInstances(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount,F._multiDrawInstances);else if(We.get("WEBGL_multi_draw"))tt.renderMultiDraw(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount);else{let Se=F._multiDrawStarts,jn=F._multiDrawCounts,nt=F._multiDrawCount,Pn=ye?K.get(ye).bytesPerElement:1,ps=we.get(X).currentProgram.getUniforms();for(let rn=0;rn<nt;rn++)ps.setValue(B,"_gl_DrawID",rn),tt.render(Se[rn]/Pn,jn[rn])}else if(F.isInstancedMesh)tt.renderInstances(Ke,gt,F.count);else if(W.isInstancedBufferGeometry){let Se=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,jn=Math.min(W.instanceCount,Se);tt.renderInstances(Ke,gt,jn)}else tt.render(Ke,gt)};function rt(b,N,W){b.transparent===!0&&b.side===_n&&b.forceSinglePass===!1?(b.side=nn,b.needsUpdate=!0,Qr(b,N,W),b.side=Ri,b.needsUpdate=!0,Qr(b,N,W),b.side=_n):Qr(b,N,W)}this.compile=function(b,N,W=null){W===null&&(W=b),f=Ye.get(W),f.init(N),w.push(f),W.traverseVisible(function(F){F.isLight&&F.layers.test(N.layers)&&(f.pushLight(F),F.castShadow&&f.pushShadow(F))}),b!==W&&b.traverseVisible(function(F){F.isLight&&F.layers.test(N.layers)&&(f.pushLight(F),F.castShadow&&f.pushShadow(F))}),f.setupLights();let X=new Set;return b.traverse(function(F){if(!(F.isMesh||F.isPoints||F.isLine||F.isSprite))return;let ne=F.material;if(ne)if(Array.isArray(ne))for(let he=0;he<ne.length;he++){let ve=ne[he];rt(ve,W,F),X.add(ve)}else rt(ne,W,F),X.add(ne)}),w.pop(),f=null,X},this.compileAsync=function(b,N,W=null){let X=this.compile(b,N,W);return new Promise(F=>{function ne(){if(X.forEach(function(he){we.get(he).currentProgram.isReady()&&X.delete(he)}),X.size===0){F(b);return}setTimeout(ne,10)}We.get("KHR_parallel_shader_compile")!==null?ne():setTimeout(ne,10)})};let Rn=null;function Jn(b){Rn&&Rn(b)}function Kh(){ki.stop()}function Jh(){ki.start()}let ki=new Nd;ki.setAnimationLoop(Jn),typeof self<"u"&&ki.setContext(self),this.setAnimationLoop=function(b){Rn=b,q.setAnimationLoop(b),b===null?ki.stop():ki.start()},q.addEventListener("sessionstart",Kh),q.addEventListener("sessionend",Jh),this.render=function(b,N){if(N!==void 0&&N.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),q.enabled===!0&&q.isPresenting===!0&&(q.cameraAutoUpdate===!0&&q.updateCamera(N),N=q.getCamera()),b.isScene===!0&&b.onBeforeRender(v,b,N,A),f=Ye.get(b,w.length),f.init(N),w.push(f),Ae.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),$.setFromProjectionMatrix(Ae),Me=this.localClippingEnabled,ie=te.init(this.clippingPlanes,Me),p=fe.get(b,S.length),p.init(),S.push(p),q.enabled===!0&&q.isPresenting===!0){let ne=v.xr.getDepthSensingMesh();ne!==null&&$o(ne,N,-1/0,v.sortObjects)}$o(b,N,0,v.sortObjects),p.finish(),v.sortObjects===!0&&p.sort(se,ee),$e=q.enabled===!1||q.isPresenting===!1||q.hasDepthSensing()===!1,$e&&Te.addToRenderList(p,b),this.info.render.frame++,ie===!0&&te.beginShadows();let W=f.state.shadowsArray;me.render(W,b,N),ie===!0&&te.endShadows(),this.info.autoReset===!0&&this.info.reset();let X=p.opaque,F=p.transmissive;if(f.setupLights(),N.isArrayCamera){let ne=N.cameras;if(F.length>0)for(let he=0,ve=ne.length;he<ve;he++){let ye=ne[he];Qh(X,F,b,ye)}$e&&Te.render(b);for(let he=0,ve=ne.length;he<ve;he++){let ye=ne[he];jh(p,b,ye,ye.viewport)}}else F.length>0&&Qh(X,F,b,N),$e&&Te.render(b),jh(p,b,N);A!==null&&(T.updateMultisampleRenderTarget(A),T.updateRenderTargetMipmap(A)),b.isScene===!0&&b.onAfterRender(v,b,N),ht.resetDefaultState(),_=-1,y=null,w.pop(),w.length>0?(f=w[w.length-1],ie===!0&&te.setGlobalState(v.clippingPlanes,f.state.camera)):f=null,S.pop(),S.length>0?p=S[S.length-1]:p=null};function $o(b,N,W,X){if(b.visible===!1)return;if(b.layers.test(N.layers)){if(b.isGroup)W=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(N);else if(b.isLight)f.pushLight(b),b.castShadow&&f.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||$.intersectsSprite(b)){X&&Oe.setFromMatrixPosition(b.matrixWorld).applyMatrix4(Ae);let he=Y.update(b),ve=b.material;ve.visible&&p.push(b,he,ve,W,Oe.z,null)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||$.intersectsObject(b))){let he=Y.update(b),ve=b.material;if(X&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Oe.copy(b.boundingSphere.center)):(he.boundingSphere===null&&he.computeBoundingSphere(),Oe.copy(he.boundingSphere.center)),Oe.applyMatrix4(b.matrixWorld).applyMatrix4(Ae)),Array.isArray(ve)){let ye=he.groups;for(let Pe=0,Fe=ye.length;Pe<Fe;Pe++){let _e=ye[Pe],Ke=ve[_e.materialIndex];Ke&&Ke.visible&&p.push(b,he,Ke,W,Oe.z,_e)}}else ve.visible&&p.push(b,he,ve,W,Oe.z,null)}}let ne=b.children;for(let he=0,ve=ne.length;he<ve;he++)$o(ne[he],N,W,X)}function jh(b,N,W,X){let F=b.opaque,ne=b.transmissive,he=b.transparent;f.setupLightsView(W),ie===!0&&te.setGlobalState(v.clippingPlanes,W),X&&Ee.viewport(P.copy(X)),F.length>0&&jr(F,N,W),ne.length>0&&jr(ne,N,W),he.length>0&&jr(he,N,W),Ee.buffers.depth.setTest(!0),Ee.buffers.depth.setMask(!0),Ee.buffers.color.setMask(!0),Ee.setPolygonOffset(!1)}function Qh(b,N,W,X){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[X.id]===void 0&&(f.state.transmissionRenderTarget[X.id]=new ci(1,1,{generateMipmaps:!0,type:We.has("EXT_color_buffer_half_float")||We.has("EXT_color_buffer_float")?Ir:li,minFilter:Ji,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ze.workingColorSpace}));let ne=f.state.transmissionRenderTarget[X.id],he=X.viewport||P;ne.setSize(he.z,he.w);let ve=v.getRenderTarget();v.setRenderTarget(ne),v.getClearColor(O),z=v.getClearAlpha(),z<1&&v.setClearColor(16777215,.5),v.clear(),$e&&Te.render(W);let ye=v.toneMapping;v.toneMapping=Ci;let Pe=X.viewport;if(X.viewport!==void 0&&(X.viewport=void 0),f.setupLightsView(X),ie===!0&&te.setGlobalState(v.clippingPlanes,X),jr(b,W,X),T.updateMultisampleRenderTarget(ne),T.updateRenderTargetMipmap(ne),We.has("WEBGL_multisampled_render_to_texture")===!1){let Fe=!1;for(let _e=0,Ke=N.length;_e<Ke;_e++){let ut=N[_e],gt=ut.object,jt=ut.geometry,tt=ut.material,Se=ut.group;if(tt.side===_n&&gt.layers.test(X.layers)){let jn=tt.side;tt.side=nn,tt.needsUpdate=!0,eu(gt,W,X,jt,tt,Se),tt.side=jn,tt.needsUpdate=!0,Fe=!0}}Fe===!0&&(T.updateMultisampleRenderTarget(ne),T.updateRenderTargetMipmap(ne))}v.setRenderTarget(ve),v.setClearColor(O,z),Pe!==void 0&&(X.viewport=Pe),v.toneMapping=ye}function jr(b,N,W){let X=N.isScene===!0?N.overrideMaterial:null;for(let F=0,ne=b.length;F<ne;F++){let he=b[F],ve=he.object,ye=he.geometry,Pe=X===null?he.material:X,Fe=he.group;ve.layers.test(W.layers)&&eu(ve,N,W,ye,Pe,Fe)}}function eu(b,N,W,X,F,ne){b.onBeforeRender(v,N,W,X,F,ne),b.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),F.onBeforeRender(v,N,W,X,b,ne),F.transparent===!0&&F.side===_n&&F.forceSinglePass===!1?(F.side=nn,F.needsUpdate=!0,v.renderBufferDirect(W,N,X,F,b,ne),F.side=Ri,F.needsUpdate=!0,v.renderBufferDirect(W,N,X,F,b,ne),F.side=_n):v.renderBufferDirect(W,N,X,F,b,ne),b.onAfterRender(v,N,W,X,F,ne)}function Qr(b,N,W){N.isScene!==!0&&(N=Mt);let X=we.get(b),F=f.state.lights,ne=f.state.shadowsArray,he=F.state.version,ve=be.getParameters(b,F.state,ne,N,W),ye=be.getProgramCacheKey(ve),Pe=X.programs;X.environment=b.isMeshStandardMaterial?N.environment:null,X.fog=N.fog,X.envMap=(b.isMeshStandardMaterial?V:M).get(b.envMap||X.environment),X.envMapRotation=X.environment!==null&&b.envMap===null?N.environmentRotation:b.envMapRotation,Pe===void 0&&(b.addEventListener("dispose",Ne),Pe=new Map,X.programs=Pe);let Fe=Pe.get(ye);if(Fe!==void 0){if(X.currentProgram===Fe&&X.lightsStateVersion===he)return nu(b,ve),Fe}else ve.uniforms=be.getUniforms(b),b.onBeforeCompile(ve,v),Fe=be.acquireProgram(ve,ye),Pe.set(ye,Fe),X.uniforms=ve.uniforms;let _e=X.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(_e.clippingPlanes=te.uniform),nu(b,ve),X.needsLights=$f(b),X.lightsStateVersion=he,X.needsLights&&(_e.ambientLightColor.value=F.state.ambient,_e.lightProbe.value=F.state.probe,_e.directionalLights.value=F.state.directional,_e.directionalLightShadows.value=F.state.directionalShadow,_e.spotLights.value=F.state.spot,_e.spotLightShadows.value=F.state.spotShadow,_e.rectAreaLights.value=F.state.rectArea,_e.ltc_1.value=F.state.rectAreaLTC1,_e.ltc_2.value=F.state.rectAreaLTC2,_e.pointLights.value=F.state.point,_e.pointLightShadows.value=F.state.pointShadow,_e.hemisphereLights.value=F.state.hemi,_e.directionalShadowMap.value=F.state.directionalShadowMap,_e.directionalShadowMatrix.value=F.state.directionalShadowMatrix,_e.spotShadowMap.value=F.state.spotShadowMap,_e.spotLightMatrix.value=F.state.spotLightMatrix,_e.spotLightMap.value=F.state.spotLightMap,_e.pointShadowMap.value=F.state.pointShadowMap,_e.pointShadowMatrix.value=F.state.pointShadowMatrix),X.currentProgram=Fe,X.uniformsList=null,Fe}function tu(b){if(b.uniformsList===null){let N=b.currentProgram.getUniforms();b.uniformsList=Ns.seqWithValue(N.seq,b.uniforms)}return b.uniformsList}function nu(b,N){let W=we.get(b);W.outputColorSpace=N.outputColorSpace,W.batching=N.batching,W.batchingColor=N.batchingColor,W.instancing=N.instancing,W.instancingColor=N.instancingColor,W.instancingMorph=N.instancingMorph,W.skinning=N.skinning,W.morphTargets=N.morphTargets,W.morphNormals=N.morphNormals,W.morphColors=N.morphColors,W.morphTargetsCount=N.morphTargetsCount,W.numClippingPlanes=N.numClippingPlanes,W.numIntersection=N.numClipIntersection,W.vertexAlphas=N.vertexAlphas,W.vertexTangents=N.vertexTangents,W.toneMapping=N.toneMapping}function Xf(b,N,W,X,F){N.isScene!==!0&&(N=Mt),T.resetTextureUnits();let ne=N.fog,he=X.isMeshStandardMaterial?N.environment:null,ve=A===null?v.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:Ws,ye=(X.isMeshStandardMaterial?V:M).get(X.envMap||he),Pe=X.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Fe=!!W.attributes.tangent&&(!!X.normalMap||X.anisotropy>0),_e=!!W.morphAttributes.position,Ke=!!W.morphAttributes.normal,ut=!!W.morphAttributes.color,gt=Ci;X.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(gt=v.toneMapping);let jt=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,tt=jt!==void 0?jt.length:0,Se=we.get(X),jn=f.state.lights;if(ie===!0&&(Me===!0||b!==y)){let xn=b===y&&X.id===_;te.setState(X,b,xn)}let nt=!1;X.version===Se.__version?(Se.needsLights&&Se.lightsStateVersion!==jn.state.version||Se.outputColorSpace!==ve||F.isBatchedMesh&&Se.batching===!1||!F.isBatchedMesh&&Se.batching===!0||F.isBatchedMesh&&Se.batchingColor===!0&&F.colorTexture===null||F.isBatchedMesh&&Se.batchingColor===!1&&F.colorTexture!==null||F.isInstancedMesh&&Se.instancing===!1||!F.isInstancedMesh&&Se.instancing===!0||F.isSkinnedMesh&&Se.skinning===!1||!F.isSkinnedMesh&&Se.skinning===!0||F.isInstancedMesh&&Se.instancingColor===!0&&F.instanceColor===null||F.isInstancedMesh&&Se.instancingColor===!1&&F.instanceColor!==null||F.isInstancedMesh&&Se.instancingMorph===!0&&F.morphTexture===null||F.isInstancedMesh&&Se.instancingMorph===!1&&F.morphTexture!==null||Se.envMap!==ye||X.fog===!0&&Se.fog!==ne||Se.numClippingPlanes!==void 0&&(Se.numClippingPlanes!==te.numPlanes||Se.numIntersection!==te.numIntersection)||Se.vertexAlphas!==Pe||Se.vertexTangents!==Fe||Se.morphTargets!==_e||Se.morphNormals!==Ke||Se.morphColors!==ut||Se.toneMapping!==gt||Se.morphTargetsCount!==tt)&&(nt=!0):(nt=!0,Se.__version=X.version);let Pn=Se.currentProgram;nt===!0&&(Pn=Qr(X,N,F));let ps=!1,rn=!1,lr=!1,xt=Pn.getUniforms(),Wn=Se.uniforms;if(Ee.useProgram(Pn.program)&&(ps=!0,rn=!0,lr=!0),X.id!==_&&(_=X.id,rn=!0),ps||y!==b){Ee.buffers.depth.getReversed()?(oe.copy(b.projectionMatrix),cm(oe),hm(oe),xt.setValue(B,"projectionMatrix",oe)):xt.setValue(B,"projectionMatrix",b.projectionMatrix),xt.setValue(B,"viewMatrix",b.matrixWorldInverse);let vi=xt.map.cameraPosition;vi!==void 0&&vi.setValue(B,Ue.setFromMatrixPosition(b.matrixWorld)),Xe.logarithmicDepthBuffer&&xt.setValue(B,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(X.isMeshPhongMaterial||X.isMeshToonMaterial||X.isMeshLambertMaterial||X.isMeshBasicMaterial||X.isMeshStandardMaterial||X.isShaderMaterial)&&xt.setValue(B,"isOrthographic",b.isOrthographicCamera===!0),y!==b&&(y=b,rn=!0,lr=!0)}if(F.isSkinnedMesh){xt.setOptional(B,F,"bindMatrix"),xt.setOptional(B,F,"bindMatrixInverse");let xn=F.skeleton;xn&&(xn.boneTexture===null&&xn.computeBoneTexture(),xt.setValue(B,"boneTexture",xn.boneTexture,T))}F.isBatchedMesh&&(xt.setOptional(B,F,"batchingTexture"),xt.setValue(B,"batchingTexture",F._matricesTexture,T),xt.setOptional(B,F,"batchingIdTexture"),xt.setValue(B,"batchingIdTexture",F._indirectTexture,T),xt.setOptional(B,F,"batchingColorTexture"),F._colorsTexture!==null&&xt.setValue(B,"batchingColorTexture",F._colorsTexture,T));let cr=W.morphAttributes;if((cr.position!==void 0||cr.normal!==void 0||cr.color!==void 0)&&Re.update(F,W,Pn),(rn||Se.receiveShadow!==F.receiveShadow)&&(Se.receiveShadow=F.receiveShadow,xt.setValue(B,"receiveShadow",F.receiveShadow)),X.isMeshGouraudMaterial&&X.envMap!==null&&(Wn.envMap.value=ye,Wn.flipEnvMap.value=ye.isCubeTexture&&ye.isRenderTargetTexture===!1?-1:1),X.isMeshStandardMaterial&&X.envMap===null&&N.environment!==null&&(Wn.envMapIntensity.value=N.environmentIntensity),rn&&(xt.setValue(B,"toneMappingExposure",v.toneMappingExposure),Se.needsLights&&qf(Wn,lr),ne&&X.fog===!0&&le.refreshFogUniforms(Wn,ne),le.refreshMaterialUniforms(Wn,X,G,Z,f.state.transmissionRenderTarget[b.id]),Ns.upload(B,tu(Se),Wn,T)),X.isShaderMaterial&&X.uniformsNeedUpdate===!0&&(Ns.upload(B,tu(Se),Wn,T),X.uniformsNeedUpdate=!1),X.isSpriteMaterial&&xt.setValue(B,"center",F.center),xt.setValue(B,"modelViewMatrix",F.modelViewMatrix),xt.setValue(B,"normalMatrix",F.normalMatrix),xt.setValue(B,"modelMatrix",F.matrixWorld),X.isShaderMaterial||X.isRawShaderMaterial){let xn=X.uniformsGroups;for(let vi=0,yi=xn.length;vi<yi;vi++){let iu=xn[vi];U.update(iu,Pn),U.bind(iu,Pn)}}return Pn}function qf(b,N){b.ambientLightColor.needsUpdate=N,b.lightProbe.needsUpdate=N,b.directionalLights.needsUpdate=N,b.directionalLightShadows.needsUpdate=N,b.pointLights.needsUpdate=N,b.pointLightShadows.needsUpdate=N,b.spotLights.needsUpdate=N,b.spotLightShadows.needsUpdate=N,b.rectAreaLights.needsUpdate=N,b.hemisphereLights.needsUpdate=N}function $f(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return C},this.getActiveMipmapLevel=function(){return E},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(b,N,W){we.get(b.texture).__webglTexture=N,we.get(b.depthTexture).__webglTexture=W;let X=we.get(b);X.__hasExternalTextures=!0,X.__autoAllocateDepthBuffer=W===void 0,X.__autoAllocateDepthBuffer||We.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),X.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(b,N){let W=we.get(b);W.__webglFramebuffer=N,W.__useDefaultFramebuffer=N===void 0},this.setRenderTarget=function(b,N=0,W=0){A=b,C=N,E=W;let X=!0,F=null,ne=!1,he=!1;if(b){let ye=we.get(b);if(ye.__useDefaultFramebuffer!==void 0)Ee.bindFramebuffer(B.FRAMEBUFFER,null),X=!1;else if(ye.__webglFramebuffer===void 0)T.setupRenderTarget(b);else if(ye.__hasExternalTextures)T.rebindTextures(b,we.get(b.texture).__webglTexture,we.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){let _e=b.depthTexture;if(ye.__boundDepthTexture!==_e){if(_e!==null&&we.has(_e)&&(b.width!==_e.image.width||b.height!==_e.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");T.setupDepthRenderbuffer(b)}}let Pe=b.texture;(Pe.isData3DTexture||Pe.isDataArrayTexture||Pe.isCompressedArrayTexture)&&(he=!0);let Fe=we.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Fe[N])?F=Fe[N][W]:F=Fe[N],ne=!0):b.samples>0&&T.useMultisampledRTT(b)===!1?F=we.get(b).__webglMultisampledFramebuffer:Array.isArray(Fe)?F=Fe[W]:F=Fe,P.copy(b.viewport),H.copy(b.scissor),R=b.scissorTest}else P.copy(de).multiplyScalar(G).floor(),H.copy(De).multiplyScalar(G).floor(),R=et;if(Ee.bindFramebuffer(B.FRAMEBUFFER,F)&&X&&Ee.drawBuffers(b,F),Ee.viewport(P),Ee.scissor(H),Ee.setScissorTest(R),ne){let ye=we.get(b.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_CUBE_MAP_POSITIVE_X+N,ye.__webglTexture,W)}else if(he){let ye=we.get(b.texture),Pe=N||0;B.framebufferTextureLayer(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,ye.__webglTexture,W||0,Pe)}_=-1},this.readRenderTargetPixels=function(b,N,W,X,F,ne,he){if(!(b&&b.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ve=we.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&he!==void 0&&(ve=ve[he]),ve){Ee.bindFramebuffer(B.FRAMEBUFFER,ve);try{let ye=b.texture,Pe=ye.format,Fe=ye.type;if(!Xe.textureFormatReadable(Pe)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Xe.textureTypeReadable(Fe)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=b.width-X&&W>=0&&W<=b.height-F&&B.readPixels(N,W,X,F,Be.convert(Pe),Be.convert(Fe),ne)}finally{let ye=A!==null?we.get(A).__webglFramebuffer:null;Ee.bindFramebuffer(B.FRAMEBUFFER,ye)}}},this.readRenderTargetPixelsAsync=async function(b,N,W,X,F,ne,he){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ve=we.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&he!==void 0&&(ve=ve[he]),ve){let ye=b.texture,Pe=ye.format,Fe=ye.type;if(!Xe.textureFormatReadable(Pe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Xe.textureTypeReadable(Fe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(N>=0&&N<=b.width-X&&W>=0&&W<=b.height-F){Ee.bindFramebuffer(B.FRAMEBUFFER,ve);let _e=B.createBuffer();B.bindBuffer(B.PIXEL_PACK_BUFFER,_e),B.bufferData(B.PIXEL_PACK_BUFFER,ne.byteLength,B.STREAM_READ),B.readPixels(N,W,X,F,Be.convert(Pe),Be.convert(Fe),0);let Ke=A!==null?we.get(A).__webglFramebuffer:null;Ee.bindFramebuffer(B.FRAMEBUFFER,Ke);let ut=B.fenceSync(B.SYNC_GPU_COMMANDS_COMPLETE,0);return B.flush(),await lm(B,ut,4),B.bindBuffer(B.PIXEL_PACK_BUFFER,_e),B.getBufferSubData(B.PIXEL_PACK_BUFFER,0,ne),B.deleteBuffer(_e),B.deleteSync(ut),ne}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(b,N=null,W=0){b.isTexture!==!0&&(wr("WebGLRenderer: copyFramebufferToTexture function signature has changed."),N=arguments[0]||null,b=arguments[1]);let X=Math.pow(2,-W),F=Math.floor(b.image.width*X),ne=Math.floor(b.image.height*X),he=N!==null?N.x:0,ve=N!==null?N.y:0;T.setTexture2D(b,0),B.copyTexSubImage2D(B.TEXTURE_2D,W,0,0,he,ve,F,ne),Ee.unbindTexture()},this.copyTextureToTexture=function(b,N,W=null,X=null,F=0){b.isTexture!==!0&&(wr("WebGLRenderer: copyTextureToTexture function signature has changed."),X=arguments[0]||null,b=arguments[1],N=arguments[2],F=arguments[3]||0,W=null);let ne,he,ve,ye,Pe,Fe,_e,Ke,ut,gt=b.isCompressedTexture?b.mipmaps[F]:b.image;W!==null?(ne=W.max.x-W.min.x,he=W.max.y-W.min.y,ve=W.isBox3?W.max.z-W.min.z:1,ye=W.min.x,Pe=W.min.y,Fe=W.isBox3?W.min.z:0):(ne=gt.width,he=gt.height,ve=gt.depth||1,ye=0,Pe=0,Fe=0),X!==null?(_e=X.x,Ke=X.y,ut=X.z):(_e=0,Ke=0,ut=0);let jt=Be.convert(N.format),tt=Be.convert(N.type),Se;N.isData3DTexture?(T.setTexture3D(N,0),Se=B.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(T.setTexture2DArray(N,0),Se=B.TEXTURE_2D_ARRAY):(T.setTexture2D(N,0),Se=B.TEXTURE_2D),B.pixelStorei(B.UNPACK_FLIP_Y_WEBGL,N.flipY),B.pixelStorei(B.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),B.pixelStorei(B.UNPACK_ALIGNMENT,N.unpackAlignment);let jn=B.getParameter(B.UNPACK_ROW_LENGTH),nt=B.getParameter(B.UNPACK_IMAGE_HEIGHT),Pn=B.getParameter(B.UNPACK_SKIP_PIXELS),ps=B.getParameter(B.UNPACK_SKIP_ROWS),rn=B.getParameter(B.UNPACK_SKIP_IMAGES);B.pixelStorei(B.UNPACK_ROW_LENGTH,gt.width),B.pixelStorei(B.UNPACK_IMAGE_HEIGHT,gt.height),B.pixelStorei(B.UNPACK_SKIP_PIXELS,ye),B.pixelStorei(B.UNPACK_SKIP_ROWS,Pe),B.pixelStorei(B.UNPACK_SKIP_IMAGES,Fe);let lr=b.isDataArrayTexture||b.isData3DTexture,xt=N.isDataArrayTexture||N.isData3DTexture;if(b.isRenderTargetTexture||b.isDepthTexture){let Wn=we.get(b),cr=we.get(N),xn=we.get(Wn.__renderTarget),vi=we.get(cr.__renderTarget);Ee.bindFramebuffer(B.READ_FRAMEBUFFER,xn.__webglFramebuffer),Ee.bindFramebuffer(B.DRAW_FRAMEBUFFER,vi.__webglFramebuffer);for(let yi=0;yi<ve;yi++)lr&&B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,we.get(b).__webglTexture,F,Fe+yi),b.isDepthTexture?(xt&&B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,we.get(N).__webglTexture,F,ut+yi),B.blitFramebuffer(ye,Pe,ne,he,_e,Ke,ne,he,B.DEPTH_BUFFER_BIT,B.NEAREST)):xt?B.copyTexSubImage3D(Se,F,_e,Ke,ut+yi,ye,Pe,ne,he):B.copyTexSubImage2D(Se,F,_e,Ke,ut+yi,ye,Pe,ne,he);Ee.bindFramebuffer(B.READ_FRAMEBUFFER,null),Ee.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else xt?b.isDataTexture||b.isData3DTexture?B.texSubImage3D(Se,F,_e,Ke,ut,ne,he,ve,jt,tt,gt.data):N.isCompressedArrayTexture?B.compressedTexSubImage3D(Se,F,_e,Ke,ut,ne,he,ve,jt,gt.data):B.texSubImage3D(Se,F,_e,Ke,ut,ne,he,ve,jt,tt,gt):b.isDataTexture?B.texSubImage2D(B.TEXTURE_2D,F,_e,Ke,ne,he,jt,tt,gt.data):b.isCompressedTexture?B.compressedTexSubImage2D(B.TEXTURE_2D,F,_e,Ke,gt.width,gt.height,jt,gt.data):B.texSubImage2D(B.TEXTURE_2D,F,_e,Ke,ne,he,jt,tt,gt);B.pixelStorei(B.UNPACK_ROW_LENGTH,jn),B.pixelStorei(B.UNPACK_IMAGE_HEIGHT,nt),B.pixelStorei(B.UNPACK_SKIP_PIXELS,Pn),B.pixelStorei(B.UNPACK_SKIP_ROWS,ps),B.pixelStorei(B.UNPACK_SKIP_IMAGES,rn),F===0&&N.generateMipmaps&&B.generateMipmap(Se),Ee.unbindTexture()},this.copyTextureToTexture3D=function(b,N,W=null,X=null,F=0){return b.isTexture!==!0&&(wr("WebGLRenderer: copyTextureToTexture3D function signature has changed."),W=arguments[0]||null,X=arguments[1]||null,b=arguments[2],N=arguments[3],F=arguments[4]||0),wr('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(b,N,W,X,F)},this.initRenderTarget=function(b){we.get(b).__webglFramebuffer===void 0&&T.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?T.setTextureCube(b,0):b.isData3DTexture?T.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?T.setTexture2DArray(b,0):T.setTexture2D(b,0),Ee.unbindTexture()},this.resetState=function(){C=0,E=0,A=null,Ee.reset(),ht.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ai}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorspace=Ze._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ze._getUnpackColorSpace()}};var Za=class i{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new xe(e),this.near=t,this.far=n}clone(){return new i(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Ka=class extends $t{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Pt,this.environmentIntensity=1,this.environmentRotation=new Pt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var Bc=class extends hn{constructor(e=null,t=1,n=1,s,r,a,o,l,h=ln,c=ln,u,d){super(null,a,o,l,h,c,s,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Ja=class extends cn{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Ps=new He,md=new He,Ra=[],gd=new hi,sy=new He,Mr=new St,br=new Qi,ui=class extends St{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Ja(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,sy)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new hi),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Ps),gd.copy(e.boundingBox).applyMatrix4(Ps),this.boundingBox.union(gd)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Qi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Ps),br.copy(e.boundingSphere).applyMatrix4(Ps),this.boundingSphere.union(br)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=e*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(e,t){let n=this.matrixWorld,s=this.count;if(Mr.geometry=this.geometry,Mr.material=this.material,Mr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),br.copy(this.boundingSphere),br.applyMatrix4(n),e.ray.intersectsSphere(br)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Ps),md.multiplyMatrices(n,Ps),Mr.matrixWorld=md,Mr.raycast(e,Ra);for(let a=0,o=Ra.length;a<o;a++){let l=Ra[a];l.instanceId=r,l.object=this,t.push(l)}Ra.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Ja(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new Bc(new Float32Array(s*this.count),s,this.count,th,$n));let r=this.morphTexture.source.data.data,a=0;for(let h=0;h<n.length;h++)a+=n[h];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*e;r[l]=o,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}};var Li=class i extends Yt{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);let r=[],a=[],o=[],l=[],h=new L,c=new ze;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let m=n+u/t*s;h.x=e*Math.cos(m),h.y=e*Math.sin(m),a.push(h.x,h.y,h.z),o.push(0,0,1),c.x=(a[d]/e+1)/2,c.y=(a[d+1]/e+1)/2,l.push(c.x,c.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new it(a,3)),this.setAttribute("normal",new it(o,3)),this.setAttribute("uv",new it(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.segments,e.thetaStart,e.thetaLength)}},Ot=class i extends Yt{constructor(e=1,t=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let h=this;s=Math.floor(s),r=Math.floor(r);let c=[],u=[],d=[],m=[],g=0,x=[],p=n/2,f=0;S(),a===!1&&(e>0&&w(!0),t>0&&w(!1)),this.setIndex(c),this.setAttribute("position",new it(u,3)),this.setAttribute("normal",new it(d,3)),this.setAttribute("uv",new it(m,2));function S(){let v=new L,I=new L,C=0,E=(t-e)/n;for(let A=0;A<=r;A++){let _=[],y=A/r,P=y*(t-e)+e;for(let H=0;H<=s;H++){let R=H/s,O=R*l+o,z=Math.sin(O),k=Math.cos(O);I.x=P*z,I.y=-y*n+p,I.z=P*k,u.push(I.x,I.y,I.z),v.set(z,E,k).normalize(),d.push(v.x,v.y,v.z),m.push(R,1-y),_.push(g++)}x.push(_)}for(let A=0;A<s;A++)for(let _=0;_<r;_++){let y=x[_][A],P=x[_+1][A],H=x[_+1][A+1],R=x[_][A+1];(e>0||_!==0)&&(c.push(y,P,R),C+=3),(t>0||_!==r-1)&&(c.push(P,H,R),C+=3)}h.addGroup(f,C,0),f+=C}function w(v){let I=g,C=new ze,E=new L,A=0,_=v===!0?e:t,y=v===!0?1:-1;for(let H=1;H<=s;H++)u.push(0,p*y,0),d.push(0,y,0),m.push(.5,.5),g++;let P=g;for(let H=0;H<=s;H++){let O=H/s*l+o,z=Math.cos(O),k=Math.sin(O);E.x=_*k,E.y=p*y,E.z=_*z,u.push(E.x,E.y,E.z),d.push(0,y,0),C.x=z*.5+.5,C.y=k*.5*y+.5,m.push(C.x,C.y),g++}for(let H=0;H<s;H++){let R=I+H,O=P+H;v===!0?c.push(O,O+1,R):c.push(O+1,O,R),A+=3}h.addGroup(f,A,v===!0?1:2),f+=A}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Di=class i extends Ot{constructor(e=1,t=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,e,t,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(e){return new i(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},ja=class i extends Yt{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};let r=[],a=[];o(s),h(n),c(),this.setAttribute("position",new it(r,3)),this.setAttribute("normal",new it(r.slice(),3)),this.setAttribute("uv",new it(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(S){let w=new L,v=new L,I=new L;for(let C=0;C<t.length;C+=3)m(t[C+0],w),m(t[C+1],v),m(t[C+2],I),l(w,v,I,S)}function l(S,w,v,I){let C=I+1,E=[];for(let A=0;A<=C;A++){E[A]=[];let _=S.clone().lerp(v,A/C),y=w.clone().lerp(v,A/C),P=C-A;for(let H=0;H<=P;H++)H===0&&A===C?E[A][H]=_:E[A][H]=_.clone().lerp(y,H/P)}for(let A=0;A<C;A++)for(let _=0;_<2*(C-A)-1;_++){let y=Math.floor(_/2);_%2===0?(d(E[A][y+1]),d(E[A+1][y]),d(E[A][y])):(d(E[A][y+1]),d(E[A+1][y+1]),d(E[A+1][y]))}}function h(S){let w=new L;for(let v=0;v<r.length;v+=3)w.x=r[v+0],w.y=r[v+1],w.z=r[v+2],w.normalize().multiplyScalar(S),r[v+0]=w.x,r[v+1]=w.y,r[v+2]=w.z}function c(){let S=new L;for(let w=0;w<r.length;w+=3){S.x=r[w+0],S.y=r[w+1],S.z=r[w+2];let v=p(S)/2/Math.PI+.5,I=f(S)/Math.PI+.5;a.push(v,1-I)}g(),u()}function u(){for(let S=0;S<a.length;S+=6){let w=a[S+0],v=a[S+2],I=a[S+4],C=Math.max(w,v,I),E=Math.min(w,v,I);C>.9&&E<.1&&(w<.2&&(a[S+0]+=1),v<.2&&(a[S+2]+=1),I<.2&&(a[S+4]+=1))}}function d(S){r.push(S.x,S.y,S.z)}function m(S,w){let v=S*3;w.x=e[v+0],w.y=e[v+1],w.z=e[v+2]}function g(){let S=new L,w=new L,v=new L,I=new L,C=new ze,E=new ze,A=new ze;for(let _=0,y=0;_<r.length;_+=9,y+=6){S.set(r[_+0],r[_+1],r[_+2]),w.set(r[_+3],r[_+4],r[_+5]),v.set(r[_+6],r[_+7],r[_+8]),C.set(a[y+0],a[y+1]),E.set(a[y+2],a[y+3]),A.set(a[y+4],a[y+5]),I.copy(S).add(w).add(v).divideScalar(3);let P=p(I);x(C,y+0,S,P),x(E,y+2,w,P),x(A,y+4,v,P)}}function x(S,w,v,I){I<0&&S.x===1&&(a[w]=S.x-1),v.x===0&&v.z===0&&(a[w]=I/2/Math.PI+.5)}function p(S){return Math.atan2(S.z,-S.x)}function f(S){return Math.atan2(-S.y,Math.sqrt(S.x*S.x+S.z*S.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.vertices,e.indices,e.radius,e.details)}};var di=class i extends ja{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}},Qa=class i extends ja{constructor(e=1,t=0){let n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}};var Fn=class i extends Yt{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),h=0,c=[],u=new L,d=new L,m=[],g=[],x=[],p=[];for(let f=0;f<=n;f++){let S=[],w=f/n,v=0;f===0&&a===0?v=.5/t:f===n&&l===Math.PI&&(v=-.5/t);for(let I=0;I<=t;I++){let C=I/t;u.x=-e*Math.cos(s+C*r)*Math.sin(a+w*o),u.y=e*Math.cos(a+w*o),u.z=e*Math.sin(s+C*r)*Math.sin(a+w*o),g.push(u.x,u.y,u.z),d.copy(u).normalize(),x.push(d.x,d.y,d.z),p.push(C+v,1-w),S.push(h++)}c.push(S)}for(let f=0;f<n;f++)for(let S=0;S<t;S++){let w=c[f][S+1],v=c[f][S],I=c[f+1][S],C=c[f+1][S+1];(f!==0||a>0)&&m.push(w,v,C),(f!==n-1||l<Math.PI)&&m.push(v,I,C)}this.setIndex(m),this.setAttribute("position",new it(g,3)),this.setAttribute("normal",new it(x,3)),this.setAttribute("uv",new it(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var eo=class i extends Yt{constructor(e=1,t=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);let a=[],o=[],l=[],h=[],c=new L,u=new L,d=new L;for(let m=0;m<=n;m++)for(let g=0;g<=s;g++){let x=g/s*r,p=m/n*Math.PI*2;u.x=(e+t*Math.cos(p))*Math.cos(x),u.y=(e+t*Math.cos(p))*Math.sin(x),u.z=t*Math.sin(p),o.push(u.x,u.y,u.z),c.x=e*Math.cos(x),c.y=e*Math.sin(x),d.subVectors(u,c).normalize(),l.push(d.x,d.y,d.z),h.push(g/s),h.push(m/n)}for(let m=1;m<=n;m++)for(let g=1;g<=s;g++){let x=(s+1)*m+g-1,p=(s+1)*(m-1)+g-1,f=(s+1)*(m-1)+g,S=(s+1)*m+g;a.push(x,p,S),a.push(p,f,S)}this.setIndex(a),this.setAttribute("position",new it(o,3)),this.setAttribute("normal",new it(l,3)),this.setAttribute("uv",new it(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var to=class extends Ii{static get type(){return"MeshPhongMaterial"}constructor(e){super(),this.isMeshPhongMaterial=!0,this.color=new xe(16777215),this.specular=new xe(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new xe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=rh,this.normalScale=new ze(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Pt,this.combine=oo,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.specular.copy(e.specular),this.shininess=e.shininess,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Mn=class extends Ii{static get type(){return"MeshLambertMaterial"}constructor(e){super(),this.isMeshLambertMaterial=!0,this.color=new xe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new xe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=rh,this.normalScale=new ze(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Pt,this.combine=oo,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};function Pa(i,e,t){return!i||!t&&i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function ry(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var Gs=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];e:{t:{let a;n:{i:if(!(e<s)){for(let o=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=t[++n],e<s)break t}a=t.length;break n}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break t}a=n,n=0;break n}break e}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},kc=class extends Gs{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:yu,endingEnd:yu}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case _u:r=e,o=2*t-n;break;case Mu:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case _u:a=e,l=2*n-t;break;case Mu:a=1,l=n+s[1]-s[0];break;default:a=e-1,l=t}let h=(n-t)*.5,c=this.valueSize;this._weightPrev=h/(t-o),this._weightNext=h/(l-n),this._offsetPrev=r*c,this._offsetNext=a*c}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,h=l-o,c=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,m=this._weightNext,g=(n-t)/(s-t),x=g*g,p=x*g,f=-d*p+2*d*x-d*g,S=(1+d)*p+(-1.5-2*d)*x+(-.5+d)*g+1,w=(-1-m)*p+(1.5+m)*x+.5*g,v=m*p-m*x;for(let I=0;I!==o;++I)r[I]=f*a[c+I]+S*a[h+I]+w*a[l+I]+v*a[u+I];return r}},Oc=class extends Gs{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,h=l-o,c=(n-t)/(s-t),u=1-c;for(let d=0;d!==o;++d)r[d]=a[h+d]*u+a[l+d]*c;return r}},zc=class extends Gs{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},Bn=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Pa(t,this.TimeBufferType),this.values=Pa(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Pa(e.times,Array),values:Pa(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new zc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Oc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new kc(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Fa:t=this.InterpolantFactoryMethodDiscrete;break;case vc:t=this.InterpolantFactoryMethodLinear;break;case nl:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Fa;case this.InterpolantFactoryMethodLinear:return vc;case this.InterpolantFactoryMethodSmooth:return nl}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(s!==void 0&&ry(s))for(let o=0,l=s.length;o!==l;++o){let h=s[o];if(isNaN(h)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,h),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===nl,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,h=e[o],c=e[o+1];if(h!==c&&(o!==1||h!==e[0]))if(s)l=!0;else{let u=o*n,d=u-n,m=u+n;for(let g=0;g!==n;++g){let x=t[u+g];if(x!==t[d+g]||x!==t[m+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let u=o*n,d=a*n;for(let m=0;m!==n;++m)t[d+m]=t[u+m]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,h=0;h!==n;++h)t[l+h]=t[o+h];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};Bn.prototype.TimeBufferType=Float32Array;Bn.prototype.ValueBufferType=Float32Array;Bn.prototype.DefaultInterpolation=vc;var ns=class extends Bn{constructor(e,t,n){super(e,t,n)}};ns.prototype.ValueTypeName="bool";ns.prototype.ValueBufferType=Array;ns.prototype.DefaultInterpolation=Fa;ns.prototype.InterpolantFactoryMethodLinear=void 0;ns.prototype.InterpolantFactoryMethodSmooth=void 0;var Hc=class extends Bn{};Hc.prototype.ValueTypeName="color";var Vc=class extends Bn{};Vc.prototype.ValueTypeName="number";var Gc=class extends Gs{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(s-t),h=e*o;for(let c=h+o;h!==c;h+=4)Wt.slerpFlat(r,0,a,h-o,a,h,l);return r}},no=class extends Bn{InterpolantFactoryMethodLinear(e){return new Gc(this.times,this.values,this.getValueSize(),e)}};no.prototype.ValueTypeName="quaternion";no.prototype.InterpolantFactoryMethodSmooth=void 0;var is=class extends Bn{constructor(e,t,n){super(e,t,n)}};is.prototype.ValueTypeName="string";is.prototype.ValueBufferType=Array;is.prototype.DefaultInterpolation=Fa;is.prototype.InterpolantFactoryMethodLinear=void 0;is.prototype.InterpolantFactoryMethodSmooth=void 0;var Wc=class extends Bn{};Wc.prototype.ValueTypeName="vector";var Xc=class{constructor(e,t,n){let s=this,r=!1,a=0,o=0,l,h=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(c){o++,r===!1&&s.onStart!==void 0&&s.onStart(c,a,o),r=!0},this.itemEnd=function(c){a++,s.onProgress!==void 0&&s.onProgress(c,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(c){s.onError!==void 0&&s.onError(c)},this.resolveURL=function(c){return l?l(c):c},this.setURLModifier=function(c){return l=c,this},this.addHandler=function(c,u){return h.push(c,u),this},this.removeHandler=function(c){let u=h.indexOf(c);return u!==-1&&h.splice(u,2),this},this.getHandler=function(c){for(let u=0,d=h.length;u<d;u+=2){let m=h[u],g=h[u+1];if(m.global&&(m.lastIndex=0),m.test(c))return g}return null}}},ay=new Xc,qc=class{constructor(e){this.manager=e!==void 0?e:ay,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};qc.DEFAULT_MATERIAL_NAME="__DEFAULT";var Pr=class extends $t{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new xe(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},io=class extends Pr{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy($t.DEFAULT_UP),this.updateMatrix(),this.groundColor=new xe(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},Il=new He,xd=new L,vd=new L,so=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ze(512,512),this.map=null,this.mapPass=null,this.matrix=new He,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Rr,this._frameExtents=new ze(1,1),this._viewportCount=1,this._viewports=[new ct(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;xd.setFromMatrixPosition(e.matrixWorld),t.position.copy(xd),vd.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(vd),t.updateMatrixWorld(),Il.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Il),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Il)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var yd=new He,Sr=new L,Ll=new L,$c=class extends so{constructor(){super(new Gt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new ze(4,2),this._viewportCount=6,this._viewports=[new ct(2,1,1,1),new ct(0,1,1,1),new ct(3,1,1,1),new ct(1,1,1,1),new ct(3,0,1,1),new ct(1,0,1,1)],this._cubeDirections=[new L(1,0,0),new L(-1,0,0),new L(0,0,1),new L(0,0,-1),new L(0,1,0),new L(0,-1,0)],this._cubeUps=[new L(0,1,0),new L(0,1,0),new L(0,1,0),new L(0,1,0),new L(0,0,1),new L(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,s=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Sr.setFromMatrixPosition(e.matrixWorld),n.position.copy(Sr),Ll.copy(n.position),Ll.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(Ll),n.updateMatrixWorld(),s.makeTranslation(-Sr.x,-Sr.y,-Sr.z),yd.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(yd)}},ro=class extends Pr{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new $c}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},Yc=class extends so{constructor(){super(new Xa(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},ao=class extends Pr{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy($t.DEFAULT_UP),this.updateMatrix(),this.target=new $t,this.shadow=new Yc}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var oh="\\[\\]\\.:\\/",oy=new RegExp("["+oh+"]","g"),lh="[^"+oh+"]",ly="[^"+oh.replace("\\.","")+"]",cy=/((?:WC+[\/:])*)/.source.replace("WC",lh),hy=/(WCOD+)?/.source.replace("WCOD",ly),uy=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",lh),dy=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",lh),fy=new RegExp("^"+cy+hy+uy+dy+"$"),py=["material","materials","bones","map"],Zc=class{constructor(e,t,n){let s=n||yt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},yt=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(oy,"")}static parseTrackName(e){let t=fy.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);py.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let h=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let c=0;c<e.length;c++)if(e[c].name===h){h=c;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(h!==void 0){if(e[h]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[h]}}let a=e[s];if(a===void 0){let h=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+h+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};yt.Composite=Zc;yt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};yt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};yt.prototype.GetterByBindingType=[yt.prototype._getValue_direct,yt.prototype._getValue_array,yt.prototype._getValue_arrayElement,yt.prototype._getValue_toArray];yt.prototype.SetterByBindingTypeAndVersioning=[[yt.prototype._setValue_direct,yt.prototype._setValue_direct_setNeedsUpdate,yt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[yt.prototype._setValue_array,yt.prototype._setValue_array_setNeedsUpdate,yt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[yt.prototype._setValue_arrayElement,yt.prototype._setValue_arrayElement_setNeedsUpdate,yt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[yt.prototype._setValue_fromArray,yt.prototype._setValue_fromArray_setNeedsUpdate,yt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var xM=new Float32Array(1);typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"170"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="170");var ch={en:{mResume:"Resume",mActions:"Actions",mSettings:"Settings",mControls:"Buttons",mPerson:"This person",mNextPerson:"Next person",mNextMap:"Next map",mPlay:"Play (my character)",mWatch:"Watch the world",mBack:"Back",mTitle:"World",aUse:"Use / talk",aRun:"Run",aEat:"Eat",aDrink:"Drink",aPickup:"Pick up food",aSleep:"Sleep / wake up",aTalk:"Talk",aZoomIn:"Zoom in",aZoomOut:"Zoom out",aThoughts:"Show / hide thoughts",aMenu:"Game menu",aPerson:"Person card",sThoughts:"Thoughts over heads",on:"On",off:"Off",sServer:"Server address",sUnpair:"Unpair this TV",cHelp:"Choose an action, press A / OK, then press the button you want for it.",cPad:"Controller",cRemote:"Remote",cPress:"Press the button for \u201C{0}\u201D\u2026 (Back cancels)",cSet:"{0} is now on {1}",cReset:"Back to the default buttons",cNone:"\u2014",cWatchNote:"In watch mode: Use = next person, Eat = next map, Sleep = person card.",dDrank:"You drank.",dPicked:"You picked up {0}.",dAte:"You ate.",dSleep:"You lie down to sleep. Move to wake up.",dWake:"You wake up.",dNoWater:"No water here: stand next to the water.",dNothing:"Nothing to do here.",dNoFood:"You carry no food.",dFull:"Your hands are full (5).",nFood:"food",nWater:"water",nRest:"rest",nFun:"company",nHp:"health",carry:"carrying {0}",iWood:"wood",iStone:"stone",iScrap:"scrap",iAxe:"an axe",iSpear:"a spear",has:"has {0}",wGatherWood:"gather wood",wGatherStone:"gather stone",wGatherScrap:"gather scrap",wAxe:"make an axe",wSpear:"make a spear",wFire:"build a campfire",wHut:"build a hut",wTend:"feed the fire",wStore:"collect food and store it",wLoot:"search the ruins",wFarm:"plant a field",wRepair:"repair the huts",listening:"Listening\u2026 say it (A again: done)",mPast:"Past events",pastHelp:"Zombie attacks (the last 20). Pick one to watch how everyone behaved.",pastNone:"No zombie attack recorded yet.",pastZ:"zombies",pastKilled:"{0} killed",rpTitle:"Replay",rpHint:"A: pause \xB7 \u25C0 \u25B6: 5 s \xB7 \u25B2 \u25BC: speed \xB7 B: back",evBite:"{0} bit {1} (health {2})",evKilled:"{0} killed {1}",evDeath:"{0} died",evFight:"{0} fights {1}",evFlee:"{0} runs from {1}",mGoTo:"Go to someone",mGoToHelp:"Pick a person: your character appears next to them.",dTp:"You are next to {0}.",zHit:"You hit the zombie!",zKilled:"The zombie is down.",actFight:"Fighting a zombie",pAge:"{0} years",pMan:"Man",pWoman:"Woman",pChild:"child",pExpecting:"expecting a baby",pPartner:"Partner",pParents:"Parents",pChildren:"Children",pGen:"Generation {0}",pNone:"none",pDead:"Died",pMood:"Mood",pWants:"Wants to",pMemory:"Remembers",pSaid:"Said",pRecent:"Lately",pTraits:"Traits",pFirst:"first survivors",tStrength:"strength",tSpeed:"speed",tIntelligence:"intelligence",tCourage:"courage",tEmpathy:"empathy",tMetabolism:"appetite",tLifespan:"lifespan",bTo:"going to {0}",bWith:"with {0}",bWants:"wants: {0}",gDrink:"drink",gEat:"eat",gForage:"find food",gSleep:"sleep",gTalk:"talk",gWander:"walk around",gRest:"rest",gTravel:"travel",hintMenu:"+ / Back: menu",gameMenuItem:"Game menu",hMove:"Move",sayLabel:"Say something (empty = just say hello)",wFollow:"follow a person",wMap:"next map",wCard:"person card",mNearby:"Nearest person",sThoughtsOnly:"Only players the owner allows see thoughts.",mMe:"Me",dTalk:"You talk to them.",dNobody:"Nobody close enough.",sZoom:"Zoom",cPressed:"Pressed: {0}"},fr:{mResume:"Reprendre",mActions:"Actions",mSettings:"R\xE9glages",mControls:"Boutons",mPerson:"Cette personne",mNextPerson:"Personne suivante",mNextMap:"Carte suivante",mPlay:"Jouer (mon personnage)",mWatch:"Regarder le monde",mBack:"Retour",mTitle:"Monde",aUse:"Utiliser / parler",aRun:"Courir",aEat:"Manger",aDrink:"Boire",aPickup:"Ramasser de la nourriture",aSleep:"Dormir / se r\xE9veiller",aTalk:"Parler",aZoomIn:"Zoom avant",aZoomOut:"Zoom arri\xE8re",aThoughts:"Afficher / masquer les pens\xE9es",aMenu:"Menu du jeu",aPerson:"Fiche de la personne",sThoughts:"Pens\xE9es au-dessus des t\xEAtes",on:"Oui",off:"Non",sServer:"Adresse du serveur",sUnpair:"Dissocier cette TV",cHelp:"Choisissez une action, appuyez sur A / OK, puis sur le bouton voulu.",cPad:"Manette",cRemote:"T\xE9l\xE9commande",cPress:"Appuyez sur le bouton pour \xAB {0} \xBB\u2026 (Retour annule)",cSet:"{0} est maintenant sur {1}",cReset:"Revenir aux boutons par d\xE9faut",cNone:"\u2014",cWatchNote:"En mode regarder : Utiliser = personne suivante, Manger = carte suivante, Dormir = fiche.",dDrank:"Vous avez bu.",dPicked:"Vous avez ramass\xE9 {0}.",dAte:"Vous avez mang\xE9.",dSleep:"Vous vous allongez pour dormir. Bougez pour vous r\xE9veiller.",dWake:"Vous vous r\xE9veillez.",dNoWater:"Pas d\u2019eau ici : placez-vous au bord de l\u2019eau.",dNothing:"Rien \xE0 faire ici.",dNoFood:"Vous n\u2019avez pas de nourriture.",dFull:"Vos mains sont pleines (5).",nFood:"faim",nWater:"eau",nRest:"repos",nFun:"compagnie",nHp:"sant\xE9",carry:"porte {0}",iWood:"bois",iStone:"pierre",iScrap:"ferraille",iAxe:"une hache",iSpear:"une lance",has:"a {0}",wGatherWood:"ramasser du bois",wGatherStone:"ramasser des pierres",wGatherScrap:"chercher de la ferraille",wAxe:"fabriquer une hache",wSpear:"fabriquer une lance",wFire:"faire un feu de camp",wHut:"construire une cabane",wTend:"entretenir le feu",wStore:"ramasser de la nourriture et la stocker",wLoot:"fouiller les ruines",wFarm:"planter un champ",wRepair:"r\xE9parer les cabanes",listening:"J\u2019\xE9coute\u2026 parlez (A encore : termin\xE9)",mPast:"\xC9v\xE9nements pass\xE9s",pastHelp:"Attaques de zombies (les 20 derni\xE8res). Choisissez-en une pour voir comment chacun a r\xE9agi.",pastNone:"Aucune attaque de zombies enregistr\xE9e pour l\u2019instant.",pastZ:"zombies",pastKilled:"{0} tu\xE9s",rpTitle:"Rediffusion",rpHint:"A : pause \xB7 \u25C0 \u25B6 : 5 s \xB7 \u25B2 \u25BC : vitesse \xB7 B : retour",evBite:"{0} a mordu {1} (sant\xE9 {2})",evKilled:"{0} a tu\xE9 {1}",evDeath:"{0} est mort(e)",evFight:"{0} combat {1}",evFlee:"{0} fuit {1}",mGoTo:"Aller vers quelqu\u2019un",mGoToHelp:"Choisissez une personne : votre personnage appara\xEEt \xE0 c\xF4t\xE9.",dTp:"Vous \xEAtes \xE0 c\xF4t\xE9 de {0}.",zHit:"Vous frappez le zombie !",zKilled:"Le zombie est \xE0 terre.",actFight:"Combat un zombie",pAge:"{0} ans",pMan:"Homme",pWoman:"Femme",pChild:"enfant",pExpecting:"attend un b\xE9b\xE9",pPartner:"Partenaire",pParents:"Parents",pChildren:"Enfants",pGen:"G\xE9n\xE9ration {0}",pNone:"aucun",pDead:"Mort",pMood:"Humeur",pWants:"Veut",pMemory:"Se souvient",pSaid:"A dit",pRecent:"Derni\xE8rement",pTraits:"Traits",pFirst:"premiers survivants",tStrength:"force",tSpeed:"vitesse",tIntelligence:"intelligence",tCourage:"courage",tEmpathy:"empathie",tMetabolism:"app\xE9tit",tLifespan:"esp\xE9rance de vie",bTo:"va vers {0}",bWith:"avec {0}",bWants:"veut : {0}",gDrink:"boire",gEat:"manger",gForage:"trouver \xE0 manger",gSleep:"dormir",gTalk:"parler",gWander:"se promener",gRest:"se reposer",gTravel:"voyager",hintMenu:"+ / Retour : menu",gameMenuItem:"Menu du jeu",hMove:"Bouger",sayLabel:"Dire quelque chose (vide = juste saluer)",wFollow:"suivre une personne",wMap:"carte suivante",wCard:"fiche",mNearby:"Personne la plus proche",sThoughtsOnly:"Seuls les joueurs autoris\xE9s par le propri\xE9taire voient les pens\xE9es.",mMe:"Moi",dTalk:"Vous lui parlez.",dNobody:"Personne assez pr\xE8s.",sZoom:"Zoom",cPressed:"Appuy\xE9 : {0}"},es:{mResume:"Continuar",mActions:"Acciones",mSettings:"Ajustes",mControls:"Botones",mPerson:"Esta persona",mNextPerson:"Siguiente persona",mNextMap:"Siguiente mapa",mPlay:"Jugar (mi personaje)",mWatch:"Mirar el mundo",mBack:"Atr\xE1s",mTitle:"Mundo",aUse:"Usar / hablar",aRun:"Correr",aEat:"Comer",aDrink:"Beber",aPickup:"Recoger comida",aSleep:"Dormir / despertar",aTalk:"Hablar",aZoomIn:"Acercar",aZoomOut:"Alejar",aThoughts:"Mostrar / ocultar pensamientos",aMenu:"Men\xFA del juego",aPerson:"Ficha de la persona",sThoughts:"Pensamientos sobre las cabezas",on:"S\xED",off:"No",sServer:"Direcci\xF3n del servidor",sUnpair:"Desvincular esta TV",cHelp:"Elige una acci\xF3n, pulsa A / OK y luego el bot\xF3n que quieras.",cPad:"Mando",cRemote:"Mando a distancia",cPress:"Pulsa el bot\xF3n para \xAB{0}\xBB\u2026 (Atr\xE1s cancela)",cSet:"{0} est\xE1 ahora en {1}",cReset:"Volver a los botones por defecto",cNone:"\u2014",cWatchNote:"En modo mirar: Usar = siguiente persona, Comer = siguiente mapa, Dormir = ficha.",dDrank:"Has bebido.",dPicked:"Has recogido {0}.",dAte:"Has comido.",dSleep:"Te tumbas a dormir. Mu\xE9vete para despertar.",dWake:"Te despiertas.",dNoWater:"No hay agua aqu\xED: ponte junto al agua.",dNothing:"Nada que hacer aqu\xED.",dNoFood:"No llevas comida.",dFull:"Tienes las manos llenas (5).",nFood:"hambre",nWater:"agua",nRest:"descanso",nFun:"compa\xF1\xEDa",nHp:"salud",carry:"lleva {0}",iWood:"madera",iStone:"piedra",iScrap:"chatarra",iAxe:"un hacha",iSpear:"una lanza",has:"tiene {0}",wGatherWood:"recoger madera",wGatherStone:"recoger piedras",wGatherScrap:"buscar chatarra",wAxe:"hacer un hacha",wSpear:"hacer una lanza",wFire:"hacer una hoguera",wHut:"construir una caba\xF1a",wTend:"avivar el fuego",wStore:"recoger comida y guardarla",wLoot:"registrar las ruinas",wFarm:"plantar un huerto",wRepair:"reparar las caba\xF1as",listening:"Escuchando\u2026 habla (A otra vez: listo)",mPast:"Eventos pasados",pastHelp:"Ataques de zombis (los 20 \xFAltimos). Elige uno para ver c\xF3mo reaccion\xF3 cada uno.",pastNone:"Todav\xEDa no hay ning\xFAn ataque de zombis grabado.",pastZ:"zombis",pastKilled:"{0} abatidos",rpTitle:"Repetici\xF3n",rpHint:"A: pausa \xB7 \u25C0 \u25B6: 5 s \xB7 \u25B2 \u25BC: velocidad \xB7 B: atr\xE1s",evBite:"{0} mordi\xF3 a {1} (salud {2})",evKilled:"{0} mat\xF3 a {1}",evDeath:"{0} muri\xF3",evFight:"{0} lucha contra {1}",evFlee:"{0} huye de {1}",mGoTo:"Ir hacia alguien",mGoToHelp:"Elige a una persona: tu personaje aparece a su lado.",dTp:"Est\xE1s junto a {0}.",zHit:"\xA1Golpeas al zombi!",zKilled:"El zombi ha ca\xEDdo.",actFight:"Luchando contra un zombi",pAge:"{0} a\xF1os",pMan:"Hombre",pWoman:"Mujer",pChild:"ni\xF1o",pExpecting:"espera un beb\xE9",pPartner:"Pareja",pParents:"Padres",pChildren:"Hijos",pGen:"Generaci\xF3n {0}",pNone:"ninguno",pDead:"Muri\xF3",pMood:"\xC1nimo",pWants:"Quiere",pMemory:"Recuerda",pSaid:"Dijo",pRecent:"\xDAltimamente",pTraits:"Rasgos",pFirst:"primeros supervivientes",tStrength:"fuerza",tSpeed:"velocidad",tIntelligence:"inteligencia",tCourage:"valor",tEmpathy:"empat\xEDa",tMetabolism:"apetito",tLifespan:"esperanza de vida",bTo:"va a {0}",bWith:"con {0}",bWants:"quiere: {0}",gDrink:"beber",gEat:"comer",gForage:"buscar comida",gSleep:"dormir",gTalk:"hablar",gWander:"pasear",gRest:"descansar",gTravel:"viajar",hintMenu:"+ / Atr\xE1s: men\xFA",gameMenuItem:"Men\xFA del juego",hMove:"Mover",sayLabel:"Decir algo (vac\xEDo = solo saludar)",wFollow:"seguir a alguien",wMap:"mapa siguiente",wCard:"ficha",mNearby:"Persona m\xE1s cercana",sThoughtsOnly:"Solo los jugadores que el due\xF1o permite ven los pensamientos.",mMe:"Yo",dTalk:"Le hablas.",dNobody:"No hay nadie lo bastante cerca.",sZoom:"Zoom",cPressed:"Pulsado: {0}"},ar:{mResume:"\u0645\u062A\u0627\u0628\u0639\u0629",mActions:"\u0627\u0644\u0623\u0641\u0639\u0627\u0644",mSettings:"\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",mControls:"\u0627\u0644\u0623\u0632\u0631\u0627\u0631",mPerson:"\u0647\u0630\u0627 \u0627\u0644\u0634\u062E\u0635",mNextPerson:"\u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062A\u0627\u0644\u064A",mNextMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",mPlay:"\u0627\u0644\u0639\u0628 (\u0634\u062E\u0635\u064A\u062A\u064A)",mWatch:"\u0634\u0627\u0647\u062F \u0627\u0644\u0639\u0627\u0644\u0645",mBack:"\u0631\u062C\u0648\u0639",mTitle:"\u0627\u0644\u0639\u0627\u0644\u0645",aUse:"\u0627\u0633\u062A\u062E\u062F\u0627\u0645 / \u062A\u062D\u062F\u062B",aRun:"\u062C\u0631\u064A",aEat:"\u0623\u0643\u0644",aDrink:"\u0634\u0631\u0628",aPickup:"\u0627\u0644\u062A\u0642\u0627\u0637 \u0637\u0639\u0627\u0645",aSleep:"\u0646\u0648\u0645 / \u0627\u0633\u062A\u064A\u0642\u0627\u0638",aTalk:"\u062A\u062D\u062F\u062B",aZoomIn:"\u062A\u0643\u0628\u064A\u0631",aZoomOut:"\u062A\u0635\u063A\u064A\u0631",aThoughts:"\u0625\u0638\u0647\u0627\u0631 / \u0625\u062E\u0641\u0627\u0621 \u0627\u0644\u0623\u0641\u0643\u0627\u0631",aMenu:"\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0644\u0639\u0628\u0629",aPerson:"\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0634\u062E\u0635",sThoughts:"\u0627\u0644\u0623\u0641\u0643\u0627\u0631 \u0641\u0648\u0642 \u0627\u0644\u0631\u0624\u0648\u0633",on:"\u0646\u0639\u0645",off:"\u0644\u0627",sServer:"\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",sUnpair:"\u0625\u0644\u063A\u0627\u0621 \u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",cHelp:"\u0627\u062E\u062A\u0631 \u0641\u0639\u0644\u0627\u064B\u060C \u0627\u0636\u063A\u0637 A / OK\u060C \u062B\u0645 \u0627\u0636\u063A\u0637 \u0627\u0644\u0632\u0631 \u0627\u0644\u0630\u064A \u062A\u0631\u064A\u062F\u0647 \u0644\u0647.",cPad:"\u0630\u0631\u0627\u0639 \u0627\u0644\u062A\u062D\u0643\u0645",cRemote:"\u062C\u0647\u0627\u0632 \u0627\u0644\u062A\u062D\u0643\u0645",cPress:"\u0627\u0636\u063A\u0637 \u0627\u0644\u0632\u0631 \u0644\u0640 \xAB{0}\xBB\u2026 (\u0631\u062C\u0648\u0639 \u0644\u0644\u0625\u0644\u063A\u0627\u0621)",cSet:"{0} \u0627\u0644\u0622\u0646 \u0639\u0644\u0649 {1}",cReset:"\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u0623\u0632\u0631\u0627\u0631 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629",cNone:"\u2014",cWatchNote:"\u0641\u064A \u0648\u0636\u0639 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629: \u0627\u0633\u062A\u062E\u062F\u0627\u0645 = \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062A\u0627\u0644\u064A\u060C \u0623\u0643\u0644 = \u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629\u060C \u0646\u0648\u0645 = \u0627\u0644\u0628\u0637\u0627\u0642\u0629.",dDrank:"\u0634\u0631\u0628\u062A.",dPicked:"\u0627\u0644\u062A\u0642\u0637\u062A {0}.",dAte:"\u0623\u0643\u0644\u062A.",dSleep:"\u0627\u0633\u062A\u0644\u0642\u064A\u062A \u0644\u0644\u0646\u0648\u0645. \u062A\u062D\u0631\u0643 \u0644\u062A\u0633\u062A\u064A\u0642\u0638.",dWake:"\u0627\u0633\u062A\u064A\u0642\u0638\u062A.",dNoWater:"\u0644\u0627 \u0645\u0627\u0621 \u0647\u0646\u0627: \u0642\u0641 \u0628\u062C\u0627\u0646\u0628 \u0627\u0644\u0645\u0627\u0621.",dNothing:"\u0644\u0627 \u0634\u064A\u0621 \u0644\u0641\u0639\u0644\u0647 \u0647\u0646\u0627.",dNoFood:"\u0644\u0627 \u062A\u062D\u0645\u0644 \u0637\u0639\u0627\u0645\u0627\u064B.",dFull:"\u064A\u062F\u0627\u0643 \u0645\u0645\u062A\u0644\u0626\u062A\u0627\u0646 (5).",nFood:"\u062C\u0648\u0639",nWater:"\u0645\u0627\u0621",nRest:"\u0631\u0627\u062D\u0629",nFun:"\u0631\u0641\u0642\u0629",nHp:"\u0635\u062D\u0629",carry:"\u064A\u062D\u0645\u0644 {0}",iWood:"\u062E\u0634\u0628",iStone:"\u062D\u062C\u0627\u0631\u0629",iScrap:"\u062E\u0631\u062F\u0629",iAxe:"\u0641\u0623\u0633",iSpear:"\u0631\u0645\u062D",has:"\u0644\u062F\u064A\u0647 {0}",wGatherWood:"\u062C\u0645\u0639 \u0627\u0644\u062D\u0637\u0628",wGatherStone:"\u062C\u0645\u0639 \u0627\u0644\u062D\u062C\u0627\u0631\u0629",wGatherScrap:"\u062C\u0645\u0639 \u0627\u0644\u062E\u0631\u062F\u0629",wAxe:"\u0635\u0646\u0639 \u0641\u0623\u0633",wSpear:"\u0635\u0646\u0639 \u0631\u0645\u062D",wFire:"\u0625\u0634\u0639\u0627\u0644 \u0646\u0627\u0631 \u0627\u0644\u0645\u062E\u064A\u0645",wHut:"\u0628\u0646\u0627\u0621 \u0643\u0648\u062E",wTend:"\u062A\u063A\u0630\u064A\u0629 \u0627\u0644\u0646\u0627\u0631",wStore:"\u062C\u0645\u0639 \u0627\u0644\u0637\u0639\u0627\u0645 \u0648\u062A\u062E\u0632\u064A\u0646\u0647",wLoot:"\u062A\u0641\u062A\u064A\u0634 \u0627\u0644\u0623\u0646\u0642\u0627\u0636",wFarm:"\u0632\u0631\u0627\u0639\u0629 \u062D\u0642\u0644",wRepair:"\u0625\u0635\u0644\u0627\u062D \u0627\u0644\u0623\u0643\u0648\u0627\u062E",listening:"\u0623\u0633\u062A\u0645\u0639\u2026 \u062A\u0643\u0644\u0645 (A \u0645\u0631\u0629 \u0623\u062E\u0631\u0649: \u0627\u0646\u062A\u0647\u064A\u062A)",mPast:"\u0623\u062D\u062F\u0627\u062B \u0633\u0627\u0628\u0642\u0629",pastHelp:"\u0647\u062C\u0645\u0627\u062A \u0627\u0644\u0632\u0648\u0645\u0628\u064A (\u0622\u062E\u0631 20). \u0627\u062E\u062A\u0631 \u0648\u0627\u062D\u062F\u0629 \u0644\u062A\u0631\u0649 \u0643\u064A\u0641 \u062A\u0635\u0631\u0641 \u0627\u0644\u062C\u0645\u064A\u0639.",pastNone:"\u0644\u0645 \u064A\u0633\u062C\u0644 \u0623\u064A \u0647\u062C\u0648\u0645 \u0632\u0648\u0645\u0628\u064A \u0628\u0639\u062F.",pastZ:"\u0632\u0648\u0645\u0628\u064A",pastKilled:"\u0642\u062A\u0644 {0}",rpTitle:"\u0625\u0639\u0627\u062F\u0629",rpHint:"A: \u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A \xB7 \u25C0 \u25B6: 5 \u062B \xB7 \u25B2 \u25BC: \u0627\u0644\u0633\u0631\u0639\u0629 \xB7 B: \u0631\u062C\u0648\u0639",evBite:"{0} \u0639\u0636 {1} (\u0627\u0644\u0635\u062D\u0629 {2})",evKilled:"{0} \u0642\u062A\u0644 {1}",evDeath:"\u0645\u0627\u062A {0}",evFight:"{0} \u064A\u0642\u0627\u062A\u0644 {1}",evFlee:"{0} \u064A\u0647\u0631\u0628 \u0645\u0646 {1}",mGoTo:"\u0627\u0630\u0647\u0628 \u0625\u0644\u0649 \u0634\u062E\u0635",mGoToHelp:"\u0627\u062E\u062A\u0631 \u0634\u062E\u0635\u0627: \u062A\u0638\u0647\u0631 \u0634\u062E\u0635\u064A\u062A\u0643 \u0628\u062C\u0627\u0646\u0628\u0647.",dTp:"\u0623\u0646\u062A \u0628\u062C\u0627\u0646\u0628 {0}.",zHit:"\u0636\u0631\u0628\u062A \u0627\u0644\u0632\u0648\u0645\u0628\u064A!",zKilled:"\u0633\u0642\u0637 \u0627\u0644\u0632\u0648\u0645\u0628\u064A.",actFight:"\u064A\u0642\u0627\u062A\u0644 \u0632\u0648\u0645\u0628\u064A",pAge:"{0} \u0633\u0646\u0629",pMan:"\u0631\u062C\u0644",pWoman:"\u0627\u0645\u0631\u0623\u0629",pChild:"\u0637\u0641\u0644",pExpecting:"\u062A\u0646\u062A\u0638\u0631 \u0645\u0648\u0644\u0648\u062F\u0627\u064B",pPartner:"\u0627\u0644\u0634\u0631\u064A\u0643",pParents:"\u0627\u0644\u0648\u0627\u0644\u062F\u0627\u0646",pChildren:"\u0627\u0644\u0623\u0628\u0646\u0627\u0621",pGen:"\u0627\u0644\u062C\u064A\u0644 {0}",pNone:"\u0644\u0627 \u0623\u062D\u062F",pDead:"\u062A\u0648\u0641\u064A",pMood:"\u0627\u0644\u0645\u0632\u0627\u062C",pWants:"\u064A\u0631\u064A\u062F",pMemory:"\u064A\u062A\u0630\u0643\u0631",pSaid:"\u0642\u0627\u0644",pRecent:"\u0645\u0624\u062E\u0631\u0627\u064B",pTraits:"\u0627\u0644\u0635\u0641\u0627\u062A",pFirst:"\u0623\u0648\u0627\u0626\u0644 \u0627\u0644\u0646\u0627\u062C\u064A\u0646",tStrength:"\u0642\u0648\u0629",tSpeed:"\u0633\u0631\u0639\u0629",tIntelligence:"\u0630\u0643\u0627\u0621",tCourage:"\u0634\u062C\u0627\u0639\u0629",tEmpathy:"\u062A\u0639\u0627\u0637\u0641",tMetabolism:"\u0634\u0647\u064A\u0629",tLifespan:"\u0627\u0644\u0639\u0645\u0631 \u0627\u0644\u0645\u062A\u0648\u0642\u0639",bTo:"\u0630\u0627\u0647\u0628 \u0625\u0644\u0649 {0}",bWith:"\u0645\u0639 {0}",bWants:"\u064A\u0631\u064A\u062F: {0}",gDrink:"\u0627\u0644\u0634\u0631\u0628",gEat:"\u0627\u0644\u0623\u0643\u0644",gForage:"\u0625\u064A\u062C\u0627\u062F \u0637\u0639\u0627\u0645",gSleep:"\u0627\u0644\u0646\u0648\u0645",gTalk:"\u0627\u0644\u062D\u062F\u064A\u062B",gWander:"\u0627\u0644\u062A\u062C\u0648\u0644",gRest:"\u0627\u0644\u0631\u0627\u062D\u0629",gTravel:"\u0627\u0644\u0633\u0641\u0631",hintMenu:"+ / \u0631\u062C\u0648\u0639: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",gameMenuItem:"\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0644\u0639\u0628\u0629",hMove:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643",sayLabel:"\u0642\u0644 \u0634\u064A\u0626\u064B\u0627 (\u0641\u0627\u0631\u063A = \u0645\u062C\u0631\u062F \u062A\u062D\u064A\u0629)",wFollow:"\u062A\u062A\u0628\u0639 \u0634\u062E\u0635",wMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",wCard:"\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0634\u062E\u0635",mNearby:"\u0623\u0642\u0631\u0628 \u0634\u062E\u0635",sThoughtsOnly:"\u0644\u0627 \u064A\u0631\u0649 \u0627\u0644\u0623\u0641\u0643\u0627\u0631 \u0625\u0644\u0627 \u0627\u0644\u0644\u0627\u0639\u0628\u0648\u0646 \u0627\u0644\u0630\u064A\u0646 \u064A\u0633\u0645\u062D \u0644\u0647\u0645 \u0627\u0644\u0645\u0627\u0644\u0643.",mMe:"\u0623\u0646\u0627",dTalk:"\u062A\u062A\u062D\u062F\u062B \u0625\u0644\u064A\u0647.",dNobody:"\u0644\u0627 \u0623\u062D\u062F \u0642\u0631\u064A\u0628 \u0628\u0645\u0627 \u064A\u0643\u0641\u064A.",sZoom:"\u062A\u0643\u0628\u064A\u0631",cPressed:"\u062A\u0645 \u0627\u0644\u0636\u063A\u0637: {0}"}};var hh={en:{mBag:"Bag & crafting",bagHelp:"What you carry. The best weapon and clothes are used by themselves.",bagEmpty:"Your bag is empty. Press A next to a tree, a rock or rubble to gather; hunt animals the same way.",mCraft:"Craft",mGuide:"Recipe guide",guideHelp:"Pick a recipe to put its ingredients in, then Make.",catHelp:"Put ingredients in (A adds one more), then Make.",cMake:"Make",cNoRecipe:"nothing (no recipe)",cClear:"Take everything out",cPut:"Put down: {0}",cWeapon:"Weapon: {0}",cDefence:"Defence: {0} %",cHave:"\u2713",cIn:"In: {0}",cNothingIn:"Nothing in yet.",dCrafted:"You made {0}.",dNoRecipe:"No recipe for that in this category: see the guide.",dNoMat:"You do not have enough for that.",dBagFull:"You cannot carry more of that.",dPlaced:"You put down {0}.",dNoRoom:"No room there: face open ground (a door or a window can go into a wall).",dNoItem:"You have none.",dGot:"You got {0}.",dTooThick:"These trees are too thick to cut.",aHit:"You hit the {0}!",aKilled:"You killed the {0}: {1}.",dBlocked:"Wrecked cars block the road: nobody gets through while travel is closed.",kWeapon:"Weapons",kClothing:"Clothes and armour",kDefence:"Defences",kFurniture:"Furniture",rWood:"wood",rStone:"stone",rScrap:"scrap",rOre:"ore",rBrick:"bricks",rLeather:"leather",rClaw:"claws",rMeat:"meat",xSword:"sword",xAxe:"axe",xSpear:"spear",xBow:"bow",xArrows:"arrows",xClothes:"clothes",xArmor:"armour",xHelmet:"helmet",xPalisade:"palisade",xSpikes:"spikes",xStonewall:"stone wall",xDoor:"door",xWindow:"window",xBed:"bed",xLamp:"lamp",xCampfire:"campfire",anRabbit:"rabbit",anDeer:"deer",anBoar:"boar",anWolf:"wolf",anBear:"bear"},fr:{mBag:"Sac et fabrication",bagHelp:"Ce que tu portes. La meilleure arme et les meilleurs v\xEAtements servent tout seuls.",bagEmpty:"Ton sac est vide. Appuie sur A pr\xE8s d'un arbre, d'un rocher ou de gravats pour r\xE9colter ; chasse les animaux de la m\xEAme fa\xE7on.",mCraft:"Fabriquer",mGuide:"Guide des recettes",guideHelp:"Choisis une recette pour y mettre ses ingr\xE9dients, puis Fabriquer.",catHelp:"Mets des ingr\xE9dients (A en ajoute un), puis Fabriquer.",cMake:"Fabriquer",cNoRecipe:"rien (pas de recette)",cClear:"Tout retirer",cPut:"Poser : {0}",cWeapon:"Arme : {0}",cDefence:"D\xE9fense : {0} %",cHave:"\u2713",cIn:"Dedans : {0}",cNothingIn:"Rien pour l'instant.",dCrafted:"Tu as fabriqu\xE9 : {0}.",dNoRecipe:"Pas de recette pour \xE7a dans cette cat\xE9gorie : vois le guide.",dNoMat:"Tu n'en as pas assez.",dBagFull:"Tu ne peux pas en porter plus.",dPlaced:"Tu as pos\xE9 : {0}.",dNoRoom:"Pas de place : tourne-toi vers un sol libre (une porte ou une fen\xEAtre peut aller dans un mur).",dNoItem:"Tu n'en as pas.",dGot:"Tu as obtenu : {0}.",dTooThick:"Ces arbres sont trop \xE9pais pour \xEAtre coup\xE9s.",aHit:"Tu as frapp\xE9 : {0} !",aKilled:"Tu as tu\xE9 : {0} ({1}).",dBlocked:"Des voitures accident\xE9es bloquent la route : personne ne passe tant que le voyage est ferm\xE9.",kWeapon:"Armes",kClothing:"V\xEAtements et armures",kDefence:"D\xE9fenses",kFurniture:"Meubles",rWood:"bois",rStone:"pierre",rScrap:"ferraille",rOre:"minerai",rBrick:"briques",rLeather:"cuir",rClaw:"griffes",rMeat:"viande",xSword:"\xE9p\xE9e",xAxe:"hache",xSpear:"lance",xBow:"arc",xArrows:"fl\xE8ches",xClothes:"v\xEAtements",xArmor:"armure",xHelmet:"casque",xPalisade:"palissade",xSpikes:"pieux",xStonewall:"mur de pierre",xDoor:"porte",xWindow:"fen\xEAtre",xBed:"lit",xLamp:"lampe",xCampfire:"feu de camp",anRabbit:"lapin",anDeer:"cerf",anBoar:"sanglier",anWolf:"loup",anBear:"ours"},es:{mBag:"Bolsa y fabricaci\xF3n",bagHelp:"Lo que llevas. La mejor arma y la mejor ropa se usan solas.",bagEmpty:"Tu bolsa est\xE1 vac\xEDa. Pulsa A junto a un \xE1rbol, una roca o escombros para recoger; caza animales igual.",mCraft:"Fabricar",mGuide:"Gu\xEDa de recetas",guideHelp:"Elige una receta para poner sus ingredientes y luego Fabricar.",catHelp:"Pon ingredientes (A a\xF1ade uno m\xE1s) y luego Fabricar.",cMake:"Fabricar",cNoRecipe:"nada (no hay receta)",cClear:"Sacarlo todo",cPut:"Colocar: {0}",cWeapon:"Arma: {0}",cDefence:"Defensa: {0} %",cHave:"\u2713",cIn:"Dentro: {0}",cNothingIn:"Nada todav\xEDa.",dCrafted:"Has fabricado: {0}.",dNoRecipe:"No hay receta para eso en esta categor\xEDa: mira la gu\xEDa.",dNoMat:"No tienes suficiente.",dBagFull:"No puedes llevar m\xE1s de eso.",dPlaced:"Has colocado: {0}.",dNoRoom:"No hay sitio: mira hacia suelo libre (una puerta o ventana puede ir en una pared).",dNoItem:"No tienes.",dGot:"Has conseguido: {0}.",dTooThick:"Estos \xE1rboles son demasiado gruesos para cortarlos.",aHit:"\xA1Has golpeado: {0}!",aKilled:"Has matado: {0} ({1}).",dBlocked:"Coches destrozados bloquean la carretera: nadie pasa mientras el viaje est\xE9 cerrado.",kWeapon:"Armas",kClothing:"Ropa y armadura",kDefence:"Defensas",kFurniture:"Muebles",rWood:"madera",rStone:"piedra",rScrap:"chatarra",rOre:"mineral",rBrick:"ladrillos",rLeather:"cuero",rClaw:"garras",rMeat:"carne",xSword:"espada",xAxe:"hacha",xSpear:"lanza",xBow:"arco",xArrows:"flechas",xClothes:"ropa",xArmor:"armadura",xHelmet:"casco",xPalisade:"empalizada",xSpikes:"estacas",xStonewall:"muro de piedra",xDoor:"puerta",xWindow:"ventana",xBed:"cama",xLamp:"l\xE1mpara",xCampfire:"hoguera",anRabbit:"conejo",anDeer:"ciervo",anBoar:"jabal\xED",anWolf:"lobo",anBear:"oso"},ar:{mBag:"\u0627\u0644\u062D\u0642\u064A\u0628\u0629 \u0648\u0627\u0644\u0635\u0646\u0627\u0639\u0629",bagHelp:"\u0645\u0627 \u062A\u062D\u0645\u0644\u0647. \u0623\u0641\u0636\u0644 \u0633\u0644\u0627\u062D \u0648\u0623\u0641\u0636\u0644 \u0644\u0628\u0627\u0633 \u064A\u064F\u0633\u062A\u0639\u0645\u0644\u0627\u0646 \u0648\u062D\u062F\u0647\u0645\u0627.",bagEmpty:"\u062D\u0642\u064A\u0628\u062A\u0643 \u0641\u0627\u0631\u063A\u0629. \u0627\u0636\u063A\u0637 A \u0628\u062C\u0627\u0646\u0628 \u0634\u062C\u0631\u0629 \u0623\u0648 \u0635\u062E\u0631\u0629 \u0623\u0648 \u0623\u0646\u0642\u0627\u0636 \u0644\u062A\u062C\u0645\u0639\u061B \u0648\u0627\u0635\u0637\u062F \u0627\u0644\u062D\u064A\u0648\u0627\u0646\u0627\u062A \u0628\u0627\u0644\u0637\u0631\u064A\u0642\u0629 \u0646\u0641\u0633\u0647\u0627.",mCraft:"\u0627\u0635\u0646\u0639",mGuide:"\u062F\u0644\u064A\u0644 \u0627\u0644\u0648\u0635\u0641\u0627\u062A",guideHelp:"\u0627\u062E\u062A\u0631 \u0648\u0635\u0641\u0629 \u0644\u062A\u0636\u0639 \u0645\u0643\u0648\u0646\u0627\u062A\u0647\u0627\u060C \u062B\u0645 \u0627\u0635\u0646\u0639.",catHelp:"\u0636\u0639 \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A (A \u064A\u0636\u064A\u0641 \u0648\u0627\u062D\u062F\u0627)\u060C \u062B\u0645 \u0627\u0635\u0646\u0639.",cMake:"\u0627\u0635\u0646\u0639",cNoRecipe:"\u0644\u0627 \u0634\u064A\u0621 (\u0644\u0627 \u0648\u0635\u0641\u0629)",cClear:"\u0623\u062E\u0631\u062C \u0643\u0644 \u0634\u064A\u0621",cPut:"\u0636\u0639: {0}",cWeapon:"\u0627\u0644\u0633\u0644\u0627\u062D: {0}",cDefence:"\u0627\u0644\u062F\u0641\u0627\u0639: {0} %",cHave:"\u2713",cIn:"\u0628\u0627\u0644\u062F\u0627\u062E\u0644: {0}",cNothingIn:"\u0644\u0627 \u0634\u064A\u0621 \u0628\u0639\u062F.",dCrafted:"\u0635\u0646\u0639\u062A: {0}.",dNoRecipe:"\u0644\u0627 \u0648\u0635\u0641\u0629 \u0644\u0647\u0630\u0627 \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0641\u0626\u0629: \u0627\u0646\u0638\u0631 \u0627\u0644\u062F\u0644\u064A\u0644.",dNoMat:"\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0645\u0627 \u064A\u0643\u0641\u064A.",dBagFull:"\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062D\u0645\u0644 \u0627\u0644\u0645\u0632\u064A\u062F \u0645\u0646 \u0647\u0630\u0627.",dPlaced:"\u0648\u0636\u0639\u062A: {0}.",dNoRoom:"\u0644\u0627 \u0645\u0643\u0627\u0646 \u0647\u0646\u0627: \u0627\u062A\u062C\u0647 \u0625\u0644\u0649 \u0623\u0631\u0636 \u0641\u0627\u0631\u063A\u0629 (\u0627\u0644\u0628\u0627\u0628 \u0623\u0648 \u0627\u0644\u0646\u0627\u0641\u0630\u0629 \u064A\u0645\u0643\u0646 \u0648\u0636\u0639\u0647\u0645\u0627 \u0641\u064A \u062C\u062F\u0627\u0631).",dNoItem:"\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0645\u0646\u0647.",dGot:"\u062D\u0635\u0644\u062A \u0639\u0644\u0649: {0}.",dTooThick:"\u0647\u0630\u0647 \u0627\u0644\u0623\u0634\u062C\u0627\u0631 \u0633\u0645\u064A\u0643\u0629 \u062C\u062F\u0627 \u0644\u0642\u0637\u0639\u0647\u0627.",aHit:"\u0636\u0631\u0628\u062A: {0}!",aKilled:"\u0642\u062A\u0644\u062A: {0} ({1}).",dBlocked:"\u0633\u064A\u0627\u0631\u0627\u062A \u0645\u062D\u0637\u0645\u0629 \u062A\u0633\u062F \u0627\u0644\u0637\u0631\u064A\u0642: \u0644\u0627 \u0623\u062D\u062F \u064A\u0645\u0631 \u0645\u0627 \u062F\u0627\u0645 \u0627\u0644\u0633\u0641\u0631 \u0645\u063A\u0644\u0642\u0627.",kWeapon:"\u0627\u0644\u0623\u0633\u0644\u062D\u0629",kClothing:"\u0627\u0644\u0645\u0644\u0627\u0628\u0633 \u0648\u0627\u0644\u062F\u0631\u0648\u0639",kDefence:"\u0627\u0644\u062F\u0641\u0627\u0639\u0627\u062A",kFurniture:"\u0627\u0644\u0623\u062B\u0627\u062B",rWood:"\u062E\u0634\u0628",rStone:"\u062D\u062C\u0631",rScrap:"\u062E\u0631\u062F\u0629",rOre:"\u062E\u0627\u0645",rBrick:"\u0637\u0648\u0628",rLeather:"\u062C\u0644\u062F",rClaw:"\u0645\u062E\u0627\u0644\u0628",rMeat:"\u0644\u062D\u0645",xSword:"\u0633\u064A\u0641",xAxe:"\u0641\u0623\u0633",xSpear:"\u0631\u0645\u062D",xBow:"\u0642\u0648\u0633",xArrows:"\u0633\u0647\u0627\u0645",xClothes:"\u0645\u0644\u0627\u0628\u0633",xArmor:"\u062F\u0631\u0639",xHelmet:"\u062E\u0648\u0630\u0629",xPalisade:"\u0633\u064A\u0627\u062C \u062E\u0634\u0628\u064A",xSpikes:"\u0623\u0648\u062A\u0627\u062F",xStonewall:"\u062C\u062F\u0627\u0631 \u062D\u062C\u0631\u064A",xDoor:"\u0628\u0627\u0628",xWindow:"\u0646\u0627\u0641\u0630\u0629",xBed:"\u0633\u0631\u064A\u0631",xLamp:"\u0645\u0635\u0628\u0627\u062D",xCampfire:"\u0646\u0627\u0631 \u0645\u062E\u064A\u0645",anRabbit:"\u0623\u0631\u0646\u0628",anDeer:"\u063A\u0632\u0627\u0644",anBoar:"\u062E\u0646\u0632\u064A\u0631 \u0628\u0631\u064A",anWolf:"\u0630\u0626\u0628",anBear:"\u062F\u0628"}};var uh={en:{sCamera:"Camera",camTop:"From above",camThird:"Third person",camFirst:"First person",aCamera:"Change the camera",hTurn:"turn",aWheel:"Quick actions (hold)",wheelHelp:"Hold, point with the stick, let go",wheelRemote:"Arrows to pick, OK to do it, Back to close",qUse:"Use / talk",qEat:"Eat",qDrink:"Drink",qSleep:"Sleep / wake up",qPickup:"Pick up",qBag:"Bag",qCraft:"Craft",qPlace:"Put down",qCamera:"Camera",qNothing:"Nothing to put down."},fr:{sCamera:"Cam\xE9ra",camTop:"Vue du dessus",camThird:"Troisi\xE8me personne",camFirst:"Premi\xE8re personne",aCamera:"Changer de cam\xE9ra",hTurn:"tourner",aWheel:"Actions rapides (maintenir)",wheelHelp:"Maintenez, visez avec le stick, rel\xE2chez",wheelRemote:"Fl\xE8ches pour choisir, OK pour agir, Retour pour fermer",qUse:"Utiliser / parler",qEat:"Manger",qDrink:"Boire",qSleep:"Dormir / se r\xE9veiller",qPickup:"Ramasser",qBag:"Sac",qCraft:"Fabriquer",qPlace:"Poser",qCamera:"Cam\xE9ra",qNothing:"Rien \xE0 poser."},es:{sCamera:"C\xE1mara",camTop:"Desde arriba",camThird:"Tercera persona",camFirst:"Primera persona",aCamera:"Cambiar la c\xE1mara",hTurn:"girar",aWheel:"Acciones r\xE1pidas (mantener)",wheelHelp:"Mant\xE9n, apunta con el stick, suelta",wheelRemote:"Flechas para elegir, OK para hacerlo, Atr\xE1s para cerrar",qUse:"Usar / hablar",qEat:"Comer",qDrink:"Beber",qSleep:"Dormir / despertar",qPickup:"Recoger",qBag:"Bolsa",qCraft:"Fabricar",qPlace:"Colocar",qCamera:"C\xE1mara",qNothing:"Nada que colocar."},ar:{sCamera:"\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627",camTop:"\u0645\u0646 \u0627\u0644\u0623\u0639\u0644\u0649",camThird:"\u0645\u0646\u0638\u0648\u0631 \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062B\u0627\u0644\u062B",camFirst:"\u0645\u0646\u0638\u0648\u0631 \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u0623\u0648\u0644",aCamera:"\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627",hTurn:"\u0627\u0644\u062F\u0648\u0631\u0627\u0646",aWheel:"\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0633\u0631\u064A\u0639\u0629 (\u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u0627\u064B)",wheelHelp:"\u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u0627\u064B\u060C \u0648\u062C\u0651\u0647 \u0628\u0627\u0644\u0639\u0635\u0627\u060C \u062B\u0645 \u0627\u062A\u0631\u0643",wheelRemote:"\u0627\u0644\u0623\u0633\u0647\u0645 \u0644\u0644\u0627\u062E\u062A\u064A\u0627\u0631\u060C OK \u0644\u0644\u062A\u0646\u0641\u064A\u0630\u060C \u0631\u062C\u0648\u0639 \u0644\u0644\u0625\u063A\u0644\u0627\u0642",qUse:"\u0627\u0633\u062A\u062E\u062F\u0627\u0645 / \u062A\u062D\u062F\u062B",qEat:"\u0623\u0643\u0644",qDrink:"\u0634\u0631\u0628",qSleep:"\u0646\u0648\u0645 / \u0627\u0633\u062A\u064A\u0642\u0627\u0638",qPickup:"\u0627\u0644\u062A\u0642\u0627\u0637",qBag:"\u0627\u0644\u062D\u0642\u064A\u0628\u0629",qCraft:"\u0635\u0646\u0639",qPlace:"\u0648\u0636\u0639",qCamera:"\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627",qNothing:"\u0644\u0627 \u0634\u064A\u0621 \u0644\u0648\u0636\u0639\u0647."}};var dh={en:{pGoal:"Objective",pLevel:"Level {0} \xB7 {1} points",mMe:"Me",meTitle:"My character",lookTitle:"How I look",lookHelp:"Welcome! Choose your character: woman or man, and a skin tone. Then Save.",lookWoman:"Woman",lookMan:"Man",lookSkin:"Skin tone",lookSave:"Save",lookSexNote:"You can change between woman and man once a week.",sexWeek:"You can change that again in {0} days.",sexPregnant:"Not while expecting a baby.",looked:"Saved.",autoRow:"AI autopilot when I am away",autoHelp:"On: when you leave, the AI lives your character (eats, works, talks) following your rules. Off: it sleeps until you come back.",autoOn:"Autopilot on: the AI lives for you while you are away.",autoOff:"Autopilot off: your character sleeps while you are away.",myRules:"My rules for the autopilot",ruleAdd:"Add a rule",ruleHelp:'Up to {0} rules, in your own words ("never go to the woods", "you must get married"). OK on a rule removes it.',ruleLabel:"A rule for your character",rulesFull:"You already have 5 rules: remove one first.",ruleAdded:"Rule added.",ruleRemoved:"Rule removed.",meHut:"Build a hut here (12 wood, 4 stone)",built:"Hut built.",needHut:"A hut needs 12 wood and 4 stone.",mePartner:"Partner",meChildren:"Children",meNone:"none yet",meExpecting:"A baby is coming in {0} hours.",meTraits:"Strength {0} \xB7 Speed {1} \xB7 Mind {2} \xB7 Courage {3} \xB7 Kindness {4}",meHp:"Health {0}",meGoals:"Done lately",askPartner:"Ask to be my partner",tryChild:"Try for a child",partners:"{0} said yes: you are partners now.",expecting:"A baby is on the way!",tooFar:"Get closer first."},fr:{pGoal:"Objectif",pLevel:"Niveau {0} \xB7 {1} points",mMe:"Moi",meTitle:"Mon personnage",lookTitle:"Mon apparence",lookHelp:"Bienvenue ! Choisissez votre personnage : femme ou homme, et une couleur de peau. Puis Enregistrer.",lookWoman:"Femme",lookMan:"Homme",lookSkin:"Couleur de peau",lookSave:"Enregistrer",lookSexNote:"Vous pouvez changer entre femme et homme une fois par semaine.",sexWeek:"Vous pourrez changer cela dans {0} jours.",sexPregnant:"Pas pendant une grossesse.",looked:"Enregistr\xE9.",autoRow:"Pilote IA quand je suis absent",autoHelp:"Activ\xE9 : quand vous partez, l\u2019IA vit votre personnage (mange, travaille, parle) selon vos r\xE8gles. D\xE9sactiv\xE9 : il dort jusqu\u2019\xE0 votre retour.",autoOn:"Pilote activ\xE9 : l\u2019IA vit pour vous pendant votre absence.",autoOff:"Pilote d\xE9sactiv\xE9 : votre personnage dort pendant votre absence.",myRules:"Mes r\xE8gles pour le pilote",ruleAdd:"Ajouter une r\xE8gle",ruleHelp:"Jusqu\u2019\xE0 {0} r\xE8gles, avec vos mots (\xAB ne va jamais dans les bois \xBB, \xAB tu dois te marier \xBB). OK sur une r\xE8gle la retire.",ruleLabel:"Une r\xE8gle pour votre personnage",rulesFull:"Vous avez d\xE9j\xE0 5 r\xE8gles : retirez-en une d\u2019abord.",ruleAdded:"R\xE8gle ajout\xE9e.",ruleRemoved:"R\xE8gle retir\xE9e.",meHut:"Construire une cabane ici (12 bois, 4 pierres)",built:"Cabane construite.",needHut:"Une cabane demande 12 bois et 4 pierres.",mePartner:"Partenaire",meChildren:"Enfants",meNone:"pas encore",meExpecting:"Un b\xE9b\xE9 arrive dans {0} heures.",meTraits:"Force {0} \xB7 Vitesse {1} \xB7 Esprit {2} \xB7 Courage {3} \xB7 Gentillesse {4}",meHp:"Sant\xE9 {0}",meGoals:"Fait r\xE9cemment",askPartner:"Demander d\u2019\xEAtre mon partenaire",tryChild:"Essayer d\u2019avoir un enfant",partners:"{0} a dit oui : vous \xEAtes partenaires.",expecting:"Un b\xE9b\xE9 est en route !",tooFar:"Approchez-vous d\u2019abord."},es:{pGoal:"Objetivo",pLevel:"Nivel {0} \xB7 {1} puntos",mMe:"Yo",meTitle:"Mi personaje",lookTitle:"Mi aspecto",lookHelp:"\xA1Bienvenido! Elige tu personaje: mujer u hombre, y un tono de piel. Luego Guardar.",lookWoman:"Mujer",lookMan:"Hombre",lookSkin:"Tono de piel",lookSave:"Guardar",lookSexNote:"Puedes cambiar entre mujer y hombre una vez por semana.",sexWeek:"Podr\xE1s cambiarlo de nuevo en {0} d\xEDas.",sexPregnant:"No durante un embarazo.",looked:"Guardado.",autoRow:"Piloto IA cuando no estoy",autoHelp:"Activado: cuando te vas, la IA vive tu personaje (come, trabaja, habla) seg\xFAn tus reglas. Desactivado: duerme hasta que vuelvas.",autoOn:"Piloto activado: la IA vive por ti mientras no est\xE1s.",autoOff:"Piloto desactivado: tu personaje duerme mientras no est\xE1s.",myRules:"Mis reglas para el piloto",ruleAdd:"A\xF1adir una regla",ruleHelp:"Hasta {0} reglas, con tus palabras (\xABnunca vayas al bosque\xBB, \xABdebes casarte\xBB). OK en una regla la quita.",ruleLabel:"Una regla para tu personaje",rulesFull:"Ya tienes 5 reglas: quita una primero.",ruleAdded:"Regla a\xF1adida.",ruleRemoved:"Regla quitada.",meHut:"Construir una caba\xF1a aqu\xED (12 madera, 4 piedra)",built:"Caba\xF1a construida.",needHut:"Una caba\xF1a necesita 12 de madera y 4 de piedra.",mePartner:"Pareja",meChildren:"Hijos",meNone:"todav\xEDa no",meExpecting:"Un beb\xE9 llega en {0} horas.",meTraits:"Fuerza {0} \xB7 Velocidad {1} \xB7 Mente {2} \xB7 Valor {3} \xB7 Bondad {4}",meHp:"Salud {0}",meGoals:"Hecho hace poco",askPartner:"Pedir que sea mi pareja",tryChild:"Intentar tener un hijo",partners:"{0} dijo que s\xED: ahora sois pareja.",expecting:"\xA1Viene un beb\xE9!",tooFar:"Ac\xE9rcate primero."},ar:{pGoal:"\u0627\u0644\u0647\u062F\u0641",pLevel:"\u0627\u0644\u0645\u0633\u062A\u0648\u0649 {0} \xB7 {1} \u0646\u0642\u0637\u0629",mMe:"\u0623\u0646\u0627",meTitle:"\u0634\u062E\u0635\u064A\u062A\u064A",lookTitle:"\u0645\u0638\u0647\u0631\u064A",lookHelp:"\u0645\u0631\u062D\u0628\u064B\u0627! \u0627\u062E\u062A\u0631 \u0634\u062E\u0635\u064A\u062A\u0643: \u0627\u0645\u0631\u0623\u0629 \u0623\u0648 \u0631\u062C\u0644\u060C \u0648\u0644\u0648\u0646 \u0627\u0644\u0628\u0634\u0631\u0629. \u062B\u0645 \u0627\u062D\u0641\u0638.",lookWoman:"\u0627\u0645\u0631\u0623\u0629",lookMan:"\u0631\u062C\u0644",lookSkin:"\u0644\u0648\u0646 \u0627\u0644\u0628\u0634\u0631\u0629",lookSave:"\u062D\u0641\u0638",lookSexNote:"\u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0628\u064A\u0646 \u0627\u0645\u0631\u0623\u0629 \u0648\u0631\u062C\u0644 \u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0641\u064A \u0627\u0644\u0623\u0633\u0628\u0648\u0639.",sexWeek:"\u064A\u0645\u0643\u0646\u0643 \u062A\u063A\u064A\u064A\u0631 \u0630\u0644\u0643 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649 \u0628\u0639\u062F {0} \u0623\u064A\u0627\u0645.",sexPregnant:"\u0644\u064A\u0633 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062D\u0645\u0644.",looked:"\u062A\u0645 \u0627\u0644\u062D\u0641\u0638.",autoRow:"\u0627\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0639\u0646\u062F \u063A\u064A\u0627\u0628\u064A",autoHelp:"\u0645\u0641\u0639\u0651\u0644: \u0639\u0646\u062F\u0645\u0627 \u062A\u063A\u0627\u062F\u0631\u060C \u064A\u0639\u064A\u0634 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0634\u062E\u0635\u064A\u062A\u0643 (\u064A\u0623\u0643\u0644\u060C \u064A\u0639\u0645\u0644\u060C \u064A\u062A\u062D\u062F\u062B) \u062D\u0633\u0628 \u0642\u0648\u0627\u0639\u062F\u0643. \u0645\u0639\u0637\u0651\u0644: \u062A\u0646\u0627\u0645 \u062D\u062A\u0649 \u062A\u0639\u0648\u062F.",autoOn:"\u0627\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A \u0645\u0641\u0639\u0651\u0644: \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u064A\u0639\u064A\u0634 \u0639\u0646\u0643 \u0623\u062B\u0646\u0627\u0621 \u063A\u064A\u0627\u0628\u0643.",autoOff:"\u0627\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A \u0645\u0639\u0637\u0651\u0644: \u0634\u062E\u0635\u064A\u062A\u0643 \u062A\u0646\u0627\u0645 \u0623\u062B\u0646\u0627\u0621 \u063A\u064A\u0627\u0628\u0643.",myRules:"\u0642\u0648\u0627\u0639\u062F\u064A \u0644\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A",ruleAdd:"\u0625\u0636\u0627\u0641\u0629 \u0642\u0627\u0639\u062F\u0629",ruleHelp:"\u062D\u062A\u0649 {0} \u0642\u0648\u0627\u0639\u062F \u0628\u0643\u0644\u0645\u0627\u062A\u0643 (\xAB\u0644\u0627 \u062A\u0630\u0647\u0628 \u0625\u0644\u0649 \u0627\u0644\u063A\u0627\u0628\u0629 \u0623\u0628\u062F\u064B\u0627\xBB\u060C \xAB\u064A\u062C\u0628 \u0623\u0646 \u062A\u062A\u0632\u0648\u062C\xBB). OK \u0639\u0644\u0649 \u0642\u0627\u0639\u062F\u0629 \u064A\u062D\u0630\u0641\u0647\u0627.",ruleLabel:"\u0642\u0627\u0639\u062F\u0629 \u0644\u0634\u062E\u0635\u064A\u062A\u0643",rulesFull:"\u0644\u062F\u064A\u0643 5 \u0642\u0648\u0627\u0639\u062F \u0628\u0627\u0644\u0641\u0639\u0644: \u0627\u062D\u0630\u0641 \u0648\u0627\u062D\u062F\u0629 \u0623\u0648\u0644\u064B\u0627.",ruleAdded:"\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0642\u0627\u0639\u062F\u0629.",ruleRemoved:"\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0642\u0627\u0639\u062F\u0629.",meHut:"\u0628\u0646\u0627\u0621 \u0643\u0648\u062E \u0647\u0646\u0627 (12 \u062E\u0634\u0628\u060C 4 \u062D\u062C\u0627\u0631\u0629)",built:"\u062A\u0645 \u0628\u0646\u0627\u0621 \u0627\u0644\u0643\u0648\u062E.",needHut:"\u0627\u0644\u0643\u0648\u062E \u064A\u062D\u062A\u0627\u062C 12 \u062E\u0634\u0628\u064B\u0627 \u06484 \u062D\u062C\u0627\u0631\u0629.",mePartner:"\u0627\u0644\u0634\u0631\u064A\u0643",meChildren:"\u0627\u0644\u0623\u0637\u0641\u0627\u0644",meNone:"\u0644\u0627 \u0623\u062D\u062F \u0628\u0639\u062F",meExpecting:"\u0637\u0641\u0644 \u0642\u0627\u062F\u0645 \u0628\u0639\u062F {0} \u0633\u0627\u0639\u0627\u062A.",meTraits:"\u0627\u0644\u0642\u0648\u0629 {0} \xB7 \u0627\u0644\u0633\u0631\u0639\u0629 {1} \xB7 \u0627\u0644\u0639\u0642\u0644 {2} \xB7 \u0627\u0644\u0634\u062C\u0627\u0639\u0629 {3} \xB7 \u0627\u0644\u0644\u0637\u0641 {4}",meHp:"\u0627\u0644\u0635\u062D\u0629 {0}",meGoals:"\u0623\u064F\u0646\u062C\u0632 \u0645\u0624\u062E\u0631\u064B\u0627",askPartner:"\u0627\u0637\u0644\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0634\u0631\u064A\u0643\u064A",tryChild:"\u0645\u062D\u0627\u0648\u0644\u0629 \u0625\u0646\u062C\u0627\u0628 \u0637\u0641\u0644",partners:"{0} \u0648\u0627\u0641\u0642: \u0623\u0646\u062A\u0645\u0627 \u0634\u0631\u064A\u0643\u0627\u0646 \u0627\u0644\u0622\u0646.",expecting:"\u0637\u0641\u0644 \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642!",tooFar:"\u0627\u0642\u062A\u0631\u0628 \u0623\u0648\u0644\u064B\u0627."}};var fh={en:{connecting:"Connecting to the world\u2026",offline:"The world server is not answering. Trying again\u2026",noServer:"No server address yet.",enterServer:"Press A to type the server address",serverLabel:"World server address",pairTitle:"Pair this TV",pairHow:"On your phone, open the control panel and approve this code:",pairWait:"Waiting for approval\u2026",pairExpired:"The code expired. Press A for a new one.",pairDenied:"The pairing was refused. Press A to try again.",hints:"Move: arrows \xB7 A: follow a person \xB7 X: next map \xB7 L / R: zoom \xB7 +: menu",hintsRemote:"Move: arrows \xB7 OK: follow a person \xB7 CH + / \u2212: zoom \xB7 Back twice: menu",following:"Following",free:"Free camera",day:"Day",agents:"people",menuMap:"Next map",menuZoomIn:"Zoom in",menuZoomOut:"Zoom out",menuServer:"Change server address",menuUnpair:"Unpair this TV",hintsPlay:"Move: stick \xB7 B: run \xB7 A: talk \xB7 L / R: zoom \xB7 +: menu",hintsPlayRemote:"Move: arrows \xB7 OK: talk \xB7 CH + / \u2212: zoom \xB7 Back: menu",menuPlay:"Play",menuWatch:"Watch the world",travelling:"Travelling to {0}\u2026",nobody:"Nobody close by.",metPlayer:"Another player is here.",worldFull:"The world is full right now.",noGl:"This screen can\u2019t draw 3D.",actIdle:"Standing",actWander:"Walking around",actDrink:"Getting water",actEat:"Eating",actForage:"Looking for food",actSleep:"Sleeping",actTalk:"Talking",actTravel:"Travelling",actRest:"Resting",actFlee:"Running away",actGo:"Going to someone",actGather:"Gathering",actBuild:"Building",inTransit:"travelling"},fr:{connecting:"Connexion au monde\u2026",offline:"Le serveur du monde ne r\xE9pond pas. Nouvel essai\u2026",noServer:"Pas encore d\u2019adresse de serveur.",enterServer:"Appuyez sur A pour taper l\u2019adresse du serveur",serverLabel:"Adresse du serveur du monde",pairTitle:"Associer cette TV",pairHow:"Sur votre t\xE9l\xE9phone, ouvrez le panneau de contr\xF4le et acceptez ce code :",pairWait:"En attente d\u2019approbation\u2026",pairExpired:"Le code a expir\xE9. Appuyez sur A pour un nouveau.",pairDenied:"L\u2019association a \xE9t\xE9 refus\xE9e. Appuyez sur A pour r\xE9essayer.",hints:"Bouger : fl\xE8ches \xB7 A : suivre une personne \xB7 X : carte suivante \xB7 L / R : zoom \xB7 + : menu",hintsRemote:"Bouger : fl\xE8ches \xB7 OK : suivre une personne \xB7 CH + / \u2212 : zoom \xB7 Retour deux fois : menu",following:"Suivi de",free:"Cam\xE9ra libre",day:"Jour",agents:"personnes",menuMap:"Carte suivante",menuZoomIn:"Zoom avant",menuZoomOut:"Zoom arri\xE8re",menuServer:"Changer l\u2019adresse du serveur",menuUnpair:"Dissocier cette TV",hintsPlay:"Bouger : stick \xB7 B : courir \xB7 A : parler \xB7 L / R : zoom \xB7 + : menu",hintsPlayRemote:"Bouger : fl\xE8ches \xB7 OK : parler \xB7 CH + / \u2212 : zoom \xB7 Retour : menu",menuPlay:"Jouer",menuWatch:"Regarder le monde",travelling:"En route vers {0}\u2026",nobody:"Personne \xE0 c\xF4t\xE9.",metPlayer:"Un autre joueur est l\xE0.",worldFull:"Le monde est plein pour le moment.",noGl:"Cet \xE9cran ne peut pas afficher la 3D.",actIdle:"Debout",actWander:"Se prom\xE8ne",actDrink:"Va boire",actEat:"Mange",actForage:"Cherche \xE0 manger",actSleep:"Dort",actTalk:"Discute",actTravel:"En voyage",actRest:"Se repose",actFlee:"S\u2019enfuit",actGo:"Va rejoindre quelqu\u2019un",actGather:"R\xE9colte",actBuild:"Construit",inTransit:"en voyage"},es:{connecting:"Conectando con el mundo\u2026",offline:"El servidor del mundo no responde. Reintentando\u2026",noServer:"Todav\xEDa no hay direcci\xF3n del servidor.",enterServer:"Pulsa A para escribir la direcci\xF3n del servidor",serverLabel:"Direcci\xF3n del servidor del mundo",pairTitle:"Vincular este televisor",pairHow:"En tu tel\xE9fono, abre el panel de control y aprueba este c\xF3digo:",pairWait:"Esperando aprobaci\xF3n\u2026",pairExpired:"El c\xF3digo caduc\xF3. Pulsa A para uno nuevo.",pairDenied:"Se rechaz\xF3 la vinculaci\xF3n. Pulsa A para reintentar.",hints:"Mover: flechas \xB7 A: seguir a alguien \xB7 X: mapa siguiente \xB7 L / R: zoom \xB7 +: men\xFA",hintsRemote:"Mover: flechas \xB7 OK: seguir a alguien \xB7 CH + / \u2212: zoom \xB7 Atr\xE1s dos veces: men\xFA",following:"Siguiendo a",free:"C\xE1mara libre",day:"D\xEDa",agents:"personas",menuMap:"Mapa siguiente",menuZoomIn:"Acercar",menuZoomOut:"Alejar",menuServer:"Cambiar la direcci\xF3n del servidor",menuUnpair:"Desvincular este televisor",hintsPlay:"Mover: stick \xB7 B: correr \xB7 A: hablar \xB7 L / R: zoom \xB7 +: men\xFA",hintsPlayRemote:"Mover: flechas \xB7 OK: hablar \xB7 CH + / \u2212: zoom \xB7 Atr\xE1s: men\xFA",menuPlay:"Jugar",menuWatch:"Mirar el mundo",travelling:"Viajando a {0}\u2026",nobody:"No hay nadie cerca.",metPlayer:"Hay otro jugador aqu\xED.",worldFull:"El mundo est\xE1 lleno ahora mismo.",noGl:"Esta pantalla no puede mostrar 3D.",actIdle:"De pie",actWander:"Paseando",actDrink:"Va a beber",actEat:"Comiendo",actForage:"Busca comida",actSleep:"Durmiendo",actTalk:"Hablando",actTravel:"De viaje",actRest:"Descansando",actFlee:"Huyendo",actGo:"Va hacia alguien",actGather:"Recogiendo",actBuild:"Construyendo",inTransit:"de viaje"},ar:{connecting:"\u062C\u0627\u0631\u064D \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0639\u0627\u0644\u0645\u2026",offline:"\u062E\u0627\u062F\u0645 \u0627\u0644\u0639\u0627\u0644\u0645 \u0644\u0627 \u064A\u0633\u062A\u062C\u064A\u0628. \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629\u2026",noServer:"\u0644\u0627 \u064A\u0648\u062C\u062F \u0639\u0646\u0648\u0627\u0646 \u062E\u0627\u062F\u0645 \u0628\u0639\u062F.",enterServer:"\u0627\u0636\u063A\u0637 A \u0644\u0643\u062A\u0627\u0628\u0629 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",serverLabel:"\u0639\u0646\u0648\u0627\u0646 \u062E\u0627\u062F\u0645 \u0627\u0644\u0639\u0627\u0644\u0645",pairTitle:"\u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",pairHow:"\u0639\u0644\u0649 \u0647\u0627\u062A\u0641\u0643\u060C \u0627\u0641\u062A\u062D \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0648\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0631\u0645\u0632:",pairWait:"\u0641\u064A \u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629\u2026",pairExpired:"\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0631\u0645\u0632. \u0627\u0636\u063A\u0637 A \u0644\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0631\u0645\u0632 \u062C\u062F\u064A\u062F.",pairDenied:"\u062A\u0645 \u0631\u0641\u0636 \u0627\u0644\u0631\u0628\u0637. \u0627\u0636\u063A\u0637 A \u0644\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.",hints:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 A: \u062A\u062A\u0628\u0639 \u0634\u062E\u0635 \xB7 X: \u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629 \xB7 L / R: \u062A\u0643\u0628\u064A\u0631 \xB7 +: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",hintsRemote:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 OK: \u062A\u062A\u0628\u0639 \u0634\u062E\u0635 \xB7 CH + / \u2212: \u062A\u0643\u0628\u064A\u0631 \xB7 \u0631\u062C\u0648\u0639 \u0645\u0631\u062A\u064A\u0646: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",following:"\u062A\u062A\u0628\u0639",free:"\u0643\u0627\u0645\u064A\u0631\u0627 \u062D\u0631\u0629",day:"\u0627\u0644\u064A\u0648\u0645",agents:"\u0623\u0634\u062E\u0627\u0635",menuMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",menuZoomIn:"\u062A\u0643\u0628\u064A\u0631",menuZoomOut:"\u062A\u0635\u063A\u064A\u0631",menuServer:"\u062A\u063A\u064A\u064A\u0631 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",menuUnpair:"\u0625\u0644\u063A\u0627\u0621 \u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",hintsPlay:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0639\u0635\u0627 \xB7 B: \u0627\u0644\u062C\u0631\u064A \xB7 A: \u0627\u0644\u062A\u062D\u062F\u062B \xB7 L / R: \u062A\u0643\u0628\u064A\u0631 \xB7 +: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",hintsPlayRemote:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 OK: \u0627\u0644\u062A\u062D\u062F\u062B \xB7 CH + / \u2212: \u062A\u0643\u0628\u064A\u0631 \xB7 \u0631\u062C\u0648\u0639: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",menuPlay:"\u0627\u0644\u0639\u0628",menuWatch:"\u0634\u0627\u0647\u062F \u0627\u0644\u0639\u0627\u0644\u0645",travelling:"\u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642 \u0625\u0644\u0649 {0}\u2026",nobody:"\u0644\u0627 \u0623\u062D\u062F \u0628\u0627\u0644\u0642\u0631\u0628.",metPlayer:"\u0644\u0627\u0639\u0628 \u0622\u062E\u0631 \u0647\u0646\u0627.",worldFull:"\u0627\u0644\u0639\u0627\u0644\u0645 \u0645\u0645\u062A\u0644\u0626 \u0627\u0644\u0622\u0646.",noGl:"\u0647\u0630\u0647 \u0627\u0644\u0634\u0627\u0634\u0629 \u0644\u0627 \u062A\u0633\u062A\u0637\u064A\u0639 \u0639\u0631\u0636 \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F.",actIdle:"\u0648\u0627\u0642\u0641",actWander:"\u064A\u062A\u062C\u0648\u0644",actDrink:"\u064A\u0630\u0647\u0628 \u0644\u064A\u0634\u0631\u0628",actEat:"\u064A\u0623\u0643\u0644",actForage:"\u064A\u0628\u062D\u062B \u0639\u0646 \u0637\u0639\u0627\u0645",actSleep:"\u0646\u0627\u0626\u0645",actTalk:"\u064A\u062A\u062D\u062F\u062B",actTravel:"\u0645\u0633\u0627\u0641\u0631",actRest:"\u064A\u0633\u062A\u0631\u064A\u062D",actFlee:"\u064A\u0647\u0631\u0628",actGo:"\u064A\u0630\u0647\u0628 \u0625\u0644\u0649 \u0634\u062E\u0635",actGather:"\u064A\u062C\u0645\u0639",actBuild:"\u064A\u0628\u0646\u064A",inTransit:"\u0641\u064A \u0633\u0641\u0631"}},qs="en";function zd(i){qs=i in fh?i:"en"}function D(i){let e=fh[qs],t=ch[qs],n=hh[qs],s=uh[qs],r=dh[qs];return e[i]??t[i]??n[i]??s[i]??r[i]??fh.en[i]??ch.en[i]??hh.en[i]??uh.en[i]??dh.en[i]??i}function Le(i,...e){return D(i).replace(/\{(\d)\}/g,(t,n)=>e[Number(n)]??"")}var my=1.25,uo=class{body;head;hair;legs;arms;blob;mark;n=0;nm=0;base=new He;m=new He;part=new He;q=new Wt;e=new Pt;v=new L;s=new L;cap;constructor(e,t,n){this.cap=t;let s=()=>new Mn({color:16777215}),r=(a,o,l,h)=>{let c=new ui(a,o,l);return c.instanceMatrix.setUsage(ss),c.count=0,c.frustumCulled=!1,c.castShadow=h&&n,e.add(c),c};this.body=r(new Ot(.17,.24,.6,10).translate(0,.8,0),s(),t,!0),this.head=r(new Fn(.17,14,10).translate(0,1.3,0),s(),t,!0),this.hair=r(new Fn(.182,14,6,0,Math.PI*2,0,Math.PI*.55).translate(0,1.33,-.015),s(),t,!0),this.legs=r(new Ot(.075,.065,.5,6).translate(0,-.25,0),s(),t*2,!0),this.arms=r(new Ot(.06,.05,.44,6).translate(0,-.22,0),s(),t*2,!0),this.blob=n?null:r(new Li(.38,16).rotateX(-Math.PI/2),new un({color:0,transparent:!0,opacity:.28,depthWrite:!1}),t,!1),this.mark=r(new Qa(.12,0).scale(1,1.6,1),new un({color:16777215}),64,!1);for(let a of[this.body,this.head,this.hair,this.legs,this.arms,this.mark])a.setColorAt(0,new xe)}begin(){this.n=0,this.nm=0}add(e,t,n,s,r,a,o,l=1,h=!1){if(this.n>=this.cap)return;let c=this.n++,u=Math.abs(Math.sin(s))*.05*r*l,d=my*l;this.base.compose(this.v.set(e,u,t),this.q.setFromEuler(this.e.set(0,n,0)),this.s.set(d,d,d)),o&&(this.part.compose(this.v.set(0,.2,-.55),this.q.setFromEuler(this.e.set(Math.PI/2,0,0)),this.s.set(1,1,1)),this.base.multiply(this.part)),this.body.setMatrixAt(c,this.base),this.body.setColorAt(c,a.tunic),this.head.setMatrixAt(c,this.base),this.head.setColorAt(c,a.skin),this.hair.setMatrixAt(c,this.base),this.hair.setColorAt(c,a.hair);let m=Math.sin(s)*.7*r;for(let g=0;g<2;g++){let x=g?1:-1;this.part.compose(this.v.set(x*.1,.52,0),this.q.setFromEuler(this.e.set(m*x,0,0)),this.s.set(1,1,1)),this.m.multiplyMatrices(this.base,this.part),this.legs.setMatrixAt(c*2+g,this.m),this.legs.setColorAt(c*2+g,a.pants),this.part.compose(this.v.set(x*.25,1.07,0),this.q.setFromEuler(h?this.e.set(-1.35+m*x*.15,0,x*.05):this.e.set(-m*x*.8,0,x*.12)),this.s.set(1,1,1)),this.m.multiplyMatrices(this.base,this.part),this.arms.setMatrixAt(c*2+g,this.m),this.arms.setColorAt(c*2+g,a.tunic)}this.blob&&(this.m.makeTranslation(e,.03,t),this.blob.setMatrixAt(c,this.m))}marker(e,t,n,s){if(this.nm>=64)return;let r=this.nm++;this.m.compose(this.v.set(e,2.15+Math.sin(n*3)*.08,t),this.q.setFromEuler(this.e.set(0,n*2,0)),this.s.set(1,1,1)),this.mark.setMatrixAt(r,this.m),this.mark.setColorAt(r,s)}end(){let e=this.n;for(let t of[this.body,this.head,this.hair])t.count=e,ph(t);for(let t of[this.legs,this.arms])t.count=e*2,ph(t);this.blob&&(this.blob.count=e,this.blob.instanceMatrix.needsUpdate=!0),this.mark.count=this.nm,ph(this.mark)}};function ph(i){i.instanceMatrix.needsUpdate=!0,i.instanceColor&&(i.instanceColor.needsUpdate=!0)}var mh=[{len:.32,h:.2,wide:.2,head:.12,leg:.08,ear:.16,earUp:1,tail:.06,body:11772042,headC:12101264,earC:13219488},{len:.9,h:.42,wide:.32,head:.17,leg:.62,ear:.3,earUp:.5,tail:.07,body:10514495,headC:10119738,earC:7031338},{len:.78,h:.42,wide:.4,head:.2,leg:.3,ear:.1,earUp:.6,tail:.04,body:5193008,headC:4667179,earC:15129798},{len:.75,h:.32,wide:.26,head:.16,leg:.42,ear:.13,earUp:1,tail:.12,body:8224128,headC:9079438,earC:5921374},{len:1.25,h:.62,wide:.66,head:.3,leg:.48,ear:.1,earUp:1,tail:.06,body:4862756,headC:5388841,earC:3811356}],fo=class{constructor(e,t,n){this.cap=t;let s=(r,a)=>{let o=new ui(r,new Mn({color:16777215,flatShading:!0}),a);return o.instanceMatrix.setUsage(ss),o.count=0,o.frustumCulled=!1,o.castShadow=n,o.setColorAt(0,new xe),e.add(o),o};this.body=s(new Fn(.5,10,7),t),this.head=s(new Fn(.5,9,6),t),this.legs=s(new Ot(.5,.4,1,5).translate(0,-.5,0),t*4),this.ears=s(new Di(.5,1,4).translate(0,.5,0),t*2),this.tail=s(new Fn(.5,6,4),t),this.cols=mh.map(r=>({body:new xe(r.body),head:new xe(r.headC),ear:new xe(r.earC)}))}cap;body;head;legs;ears;tail;n=0;base=new He;m=new He;part=new He;q=new Wt;e=new Pt;v=new L;s=new L;cols;begin(){this.n=0}add(e,t,n,s,r,a){if(this.n>=this.cap)return;let o=mh[e]??mh[0],l=this.cols[e]??this.cols[0],h=this.n++,c=e===0?Math.abs(Math.sin(r))*.12*a:Math.abs(Math.sin(r*2))*.03*a,u=o.leg+o.h/2+c;this.base.compose(this.v.set(t,0,n),this.q.setFromEuler(this.e.set(0,s,0)),this.s.set(1.35,1.35,1.35));let d=(p,f,S,w,v,I,C,E,A,_,y,P)=>{this.part.compose(this.v.set(S,w,v),this.q.setFromEuler(this.e.set(I,C,E)),this.s.set(A,_,y)),this.m.multiplyMatrices(this.base,this.part),p.setMatrixAt(f,this.m),p.setColorAt(f,P)};d(this.body,h,0,u,0,0,0,0,o.wide,o.h,o.len,l.body);let m=o.len/2+o.head*.55,g=u+o.h*.35;d(this.head,h,0,g,m,0,0,0,o.head*1.6,o.head*1.5,o.head*(e===2?2.4:2),l.head),d(this.tail,h,0,u+o.h*.2,-o.len/2,.6,0,0,o.tail*1.2,o.tail,o.tail*(e===3?4:1.4),l.ear);let x=Math.sin(r)*.35*a;for(let p=0;p<4;p++){let f=p&1?1:-1,S=p<2?1:-1;d(this.legs,h*4+p,f*o.wide*.3,o.leg+.02,S*o.len*.3,x*f*S,0,0,o.wide*.22+.02,o.leg+.02,o.wide*.22+.02,l.body)}for(let p=0;p<2;p++){let f=p?1:-1;e===2?d(this.ears,h*2+p,f*o.head*.5,g-o.head*.3,m+o.head*.9,1.3,0,-f*.3,.04,o.ear,.04,l.ear):d(this.ears,h*2+p,f*o.head*.45,g+o.head*.55,m-o.head*.1,-.2*o.earUp,0,f*(e===1?.6:.25),o.ear*(e===1?.18:.45),o.ear,o.ear*.25,l.ear)}}end(){let e=this.n;for(let[t,n]of[[this.body,1],[this.head,1],[this.tail,1],[this.legs,4],[this.ears,2]])t.count=e*n,t.instanceMatrix.needsUpdate=!0,t.instanceColor&&(t.instanceColor.needsUpdate=!0)}};var Hd=58*Math.PI/180,po=class{renderer;scene=new Ka;camera=new Gt(30,16/9,1,400);people;hemi=new io(13624319,6114362,1.1);sun=new ao(16773590,2.4);lamp=new ro(16761466,0,14,1.6);fog;bg=new xe(10274792);chunks=new Nn;water;under;portals=new Nn;shots;nShots=0;cans;bushes;berries;crates;nCan=0;nBush=0;nCrate=0;q=new Wt;eu=new Pt;v3=new L;s3=new L;groundMat=new Mn({vertexColors:!0});propMat=new Mn({vertexColors:!0});glowMat=new un({vertexColors:!0});poolMat=new un({vertexColors:!0,transparent:!0,opacity:0,blending:Ar,depthWrite:!1,side:_n});animals;target=new L;look=new L;dist=24;view="top";yaw=0;back=7;viewSet="";tier;m=new He;shadowR=30;constructor(e,t){this.tier=t,this.renderer=new Ya({canvas:e,antialias:t==="high",powerPreference:"high-performance",stencil:!1}),this.renderer.setPixelRatio(1),this.renderer.toneMapping=Jc,this.renderer.toneMappingExposure=1.05;let n=t!=="low";if(n){this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=Kc,this.sun.castShadow=!0;let r=t==="high"?2048:1024;this.sun.shadow.mapSize.set(r,r),this.sun.shadow.bias=-6e-4,this.sun.shadow.normalBias=.03,this.sun.shadow.camera.near=1,this.sun.shadow.camera.far=120}this.scene.background=this.bg,this.fog=new Za(this.bg,60,160),this.scene.fog=this.fog,this.scene.add(this.hemi,this.sun,this.sun.target,this.lamp,this.chunks,this.portals),this.under=new St(new ts(4e3,4e3).rotateX(-Math.PI/2),new Mn({color:3033642})),this.under.position.y=-.8,this.scene.add(this.under),this.water=new St(new ts(1,1).rotateX(-Math.PI/2),new to({color:3114672,transparent:!0,opacity:.72,shininess:90,specular:10474736})),this.water.position.y=-.14,this.water.receiveShadow=n,this.scene.add(this.water),this.people=new uo(this.scene,512,n),this.animals=new fo(this.scene,128,n),this.shots=new ui(new Fn(.07,6,4),new un({color:16773536}),256),this.shots.instanceMatrix.setUsage(ss),this.shots.count=0,this.shots.frustumCulled=!1,this.scene.add(this.shots);let s=(r,a,o)=>{let l=new ui(r,new Mn({color:a,flatShading:!0}),o);return l.instanceMatrix.setUsage(ss),l.count=0,l.frustumCulled=!1,l.castShadow=n,this.scene.add(l),l};this.cans=s(new Ot(.09,.09,.17,10).translate(0,.085,0),12866111,256),this.bushes=s(new di(.52,1).scale(1,.8,1).translate(0,.38,0),4161335,256),this.berries=s(new di(.075,0),14688314,256*6),this.crates=s(new Ot(.2,.2,.3,4).rotateY(Math.PI/4).translate(0,.15,0),10122312,128)}beginItems(){this.nCan=this.nBush=this.nCrate=0}item(e,t,n,s){let r=(s*2654435761>>>0)/4294967296;if(this.m.compose(this.v3.set(e,0,t),this.q.setFromEuler(this.eu.set(0,r*6.28,0)),this.s3.set(1,1,1)),n===1&&this.nCan<256)this.cans.setMatrixAt(this.nCan++,this.m);else if(n===2&&this.nBush<256){let a=this.nBush++;this.bushes.setMatrixAt(a,this.m);for(let o=0;o<6;o++){let l=r*6.28+o*1.05;this.m.makeTranslation(e+Math.cos(l)*.43,.32+o%3*.14,t+Math.sin(l)*.43),this.berries.setMatrixAt(a*6+o,this.m)}}else this.nCrate<128&&this.crates.setMatrixAt(this.nCrate++,this.m)}endItems(){this.cans.count=this.nCan,this.bushes.count=this.nBush,this.berries.count=this.nBush*6,this.crates.count=this.nCrate;for(let e of[this.cans,this.bushes,this.berries,this.crates])e.instanceMatrix.needsUpdate=!0}setMap(e,t,n){this.clearChunks(),this.water.scale.set(e,1,t),this.water.position.set(e/2,-.14,t/2);for(let s of this.portals.children.slice())this.portals.remove(s),xy(s);for(let s of n)this.portals.add(gy(s.x,s.y))}addChunk(e,t,n=null,s=null){let r=new Nn,a=new St(e,this.groundMat);if(a.receiveShadow=this.tier!=="low",r.add(a),t){let o=new St(t,this.propMat);o.castShadow=o.receiveShadow=this.tier!=="low",r.add(o)}if(n&&r.add(new St(n,this.glowMat)),s){let o=new St(s,this.poolMat);o.renderOrder=2,r.add(o)}return this.chunks.add(r),r}removeChunk(e){this.chunks.remove(e);for(let t of e.children)t.geometry.dispose()}clearChunks(){for(let e of this.chunks.children.slice())this.removeChunk(e)}beginShots(){this.nShots=0}shot(e,t){this.nShots>=256||(this.m.makeTranslation(e,1,t),this.shots.setMatrixAt(this.nShots++,this.m))}endShots(){this.shots.count=this.nShots,this.shots.instanceMatrix.needsUpdate=!0}resize(e,t){this.renderer.setSize(e,t,!1),this.camera.aspect=e/t,this.camera.updateProjectionMatrix()}pv=new L;project(e,t,n,s){let r=this.pv.set(e,t,n).project(this.camera);return r.z>1||r.x<-1.1||r.x>1.1||r.y<-1.1||r.y>1.1?!1:(s.x=(r.x+1)/2*innerWidth,s.y=(1-r.y)/2*innerHeight,!0)}get sight(){return this.tier==="low"?42:this.tier==="mid"?52:64}follow(e,t,n,s){this.target.set(e,0,t);let r=s?1:1-Math.exp(-n*(this.view==="top"?6:14));this.look.x+=(e-this.look.x)*r,this.look.z+=(t-this.look.z)*r;let a=this.dist;if(this.view!==this.viewSet){this.viewSet=this.view;let d=this.camera;this.view==="top"?(d.fov=30,d.near=1,d.far=400):(d.fov=this.view==="first"?62:55,d.near=.12,d.far=this.sight+6),d.updateProjectionMatrix()}let o=this.look.x,l=this.look.z;if(this.view==="top")this.camera.position.set(this.look.x,Math.sin(Hd)*a,this.look.z+Math.cos(Hd)*a),this.camera.lookAt(this.look.x,0,this.look.z),this.fog.near=a*1.6,this.fog.far=a*3.6;else{let d=Math.sin(this.yaw),m=-Math.cos(this.yaw);if(this.view==="third"){let g=this.back;this.camera.position.set(this.look.x-d*g,1.4+g*.42,this.look.z-m*g),this.camera.lookAt(this.look.x+d*3,1.1,this.look.z+m*3)}else this.camera.position.set(this.look.x+d*.18,1.55,this.look.z+m*.18),this.camera.lookAt(this.look.x+d*10,.9,this.look.z+m*10);this.fog.near=this.sight*.35,this.fog.far=this.sight,a=this.sight*.4,o=this.look.x+d*a*.8,l=this.look.z+m*a*.8}if(this.sun.castShadow){let d=this.shadowR=Math.min(60,a*1.15+6),m=this.sun.shadow.camera;m.right!==d&&(m.left=-d,m.right=d,m.top=d,m.bottom=-d,m.updateProjectionMatrix())}let h=this.shadowR*2/this.sun.shadow.mapSize.x,c=Math.round(o/h)*h,u=Math.round(l/h)*h;this.sun.target.position.set(c,0,u),this.sun.position.set(c+this.sunDir.x*50,this.sunDir.y*50,u+this.sunDir.z*50),this.lamp.position.set(e,2.2,t)}sunDir=new L(.4,.8,.45).normalize();c1=new xe;c2=new xe;setHour(e,t){let n=e<5||e>21?0:e<8?(e-5)/3:e>18?(21-e)/3:1,s=n>0&&n<1?Math.sin(n*Math.PI):0,r=(e-6)/12*Math.PI;n>0?this.sunDir.set(-Math.cos(r)*.8,Math.max(.5,Math.sin(r)),.55).normalize():this.sunDir.set(.3,.8,.4).normalize(),this.sun.intensity=n>0?.5+2*n:.45,this.sun.color.setHex(9349375).lerp(this.c1.setHex(16773590),n).lerp(this.c2.setHex(16752736),s*.7),this.hemi.intensity=(.35+.8*n)*(this.view==="top"?1:1.5),this.hemi.color.setHex(3162218).lerp(this.c1.setHex(13624319),n),this.hemi.groundColor.setHex(1841698).lerp(this.c1.setHex(6114362),n),this.bg.setHex(726054).lerp(this.c1.setHex(10274792),n).lerp(this.c2.setHex(15178346),s*.6),this.lamp.intensity=(1-n)*9,this.poolMat.opacity=(1-n)*.42,this.poolMat.visible=n<.98;let a=1+Math.sin(t*2.5)*.06;for(let o of this.portals.children)o.children[0].rotation.y=t*.8,o.children[1].scale.set(a,1,a)}render(){this.renderer.render(this.scene,this.camera)}dispose(){this.clearChunks(),this.renderer.dispose()}};function gy(i,e){let t=new Nn;t.position.set(i,0,e);let n=new St(new eo(1.3,.11,8,32),new un({color:9433343}));n.position.y=1.4;let s=new St(new Li(2,32).rotateX(-Math.PI/2),new un({color:5232895,transparent:!0,opacity:.45,blending:Ar,depthWrite:!1,side:_n}));return s.position.y=.05,t.add(n,s),t}function xy(i){i.traverse(e=>{let t=e;t.geometry&&t.geometry.dispose()})}var vy={grass:{shape:0,ground:7776597,top:0,side:0,height:0},dirt:{shape:0,ground:10780248,top:0,side:0,height:0},road:{shape:0,ground:6973282,top:0,side:0,height:0},floor:{shape:0,ground:11569759,top:0,side:0,height:0},sand:{shape:0,ground:14469267,top:0,side:0,height:0},water:{shape:1,ground:5009250,top:0,side:0,height:0},wall:{shape:2,ground:9275262,top:12761258,side:10918797,height:2.3},tree:{shape:3,ground:6197061,top:5215296,side:7031343,height:0},rubble:{shape:4,ground:9471865,top:10195587,side:0,height:0},woodwall:{shape:2,ground:9071176,top:9134649,side:8016946,height:1.7,even:!0,planks:!0},campfire:{shape:5,ground:9271906,top:9407106,side:5978658,height:0},ashes:{shape:6,ground:7301731,top:4012599,side:4863268,height:0},crate:{shape:2,ground:9071176,top:10779208,side:9134649,height:.8,even:!0,planks:!0},farm:{shape:0,ground:7033398,top:0,side:0,height:0},rock:{shape:7,ground:9275262,top:10130572,side:0,height:0},wreck:{shape:8,ground:6973282,top:9063986,side:3881528,height:0},palisade:{shape:9,ground:9071176,top:10186822,side:7228204,height:0},spikes:{shape:10,ground:9071176,top:10517066,side:7228204,height:0},stonewall:{shape:2,ground:9275262,top:11906723,side:10194816,height:1.9,even:!0},door:{shape:11,ground:11569759,top:9134649,side:7031343,height:0},window:{shape:12,ground:9071176,top:9134649,side:8016946,height:1.7},bed:{shape:13,ground:11569759,top:11554876,side:8016946,height:0},lamp:{shape:14,ground:9271906,top:16769162,side:4867136,height:0}};function Vd(i){let e=[];for(let t=0;t<256;t++)e.push({shape:0,ground:7251535,top:0,side:0,height:0});for(let t of i){let n=vy[t.name];e[t.id]=n?{...n}:t.solid?{shape:2,ground:t.color,top:t.color,side:t.color,height:2}:{shape:0,ground:t.color,top:0,side:0,height:0}}return e}function _t(i,e){let t=Math.imul(i|0,374761393)+Math.imul(e|0,668265263);return t=Math.imul(t^t>>>13,1274126177),((t^t>>>16)>>>0)/4294967296}function mo(i,e,t){let n=i/t,s=e/t,r=Math.floor(n),a=Math.floor(s),o=n-r,l=s-a;o=o*o*(3-2*o),l=l*l*(3-2*l);let h=_t(r,a),c=_t(r+1,a),u=_t(r,a+1),d=_t(r+1,a+1);return h+(c-h)*o+(u-h)*l+(h-c-u+d)*o*l}var Dr=64,yy=-.55;function bn(i){let e=i.index?i.toNonIndexed():i;e.computeVertexNormals();let t=e.getAttribute("position").array,n=1/0,s=-1/0;for(let r=1;r<t.length;r+=3)n=Math.min(n,t[r]),s=Math.max(s,t[r]);return{pos:t,nor:e.getAttribute("normal").array,minY:n,maxY:s}}var gh=null;function _y(){return gh||(gh={trunk:bn(new Ot(.1,.17,1,6,1,!0).translate(0,.5,0)),leaf:bn(new di(1,1)),leafLo:bn(new di(1,0)),rock:bn(new di(1,0)),blade:bn(new Di(.045,.34,3,1,!0).translate(0,.17,0)),log:bn(new Ot(.06,.06,.62,6,1,!1).rotateZ(Math.PI/2)),flame:bn(new Di(.16,.5,5,1,!1).translate(0,.25,0)),box:bn(new es(1,1,1).translate(0,.5,0)),spike:bn(new Di(.5,1,6,1,!1).translate(0,.5,0)),post:bn(new Ot(.5,.5,1,7,1,!1).translate(0,.5,0)),disc:bn(new Li(1,16).rotateX(-Math.PI/2)),wheel:bn(new Ot(.5,.5,1,8,1,!1).rotateZ(Math.PI/2))}),gh}var Fr=class{pos=[];nor=[];col=[];geometry(){if(!this.pos.length)return null;let e=new Yt;return e.setAttribute("position",new it(this.pos,3)),e.setAttribute("normal",new it(this.nor,3)),e.setAttribute("color",new it(this.col,3)),e.computeBoundingSphere(),e}},go=new L,xo=new L,My=new He,Gd=new Ie,by=new Wt,Sy=new Pt,wy=new L,Ey=new L,HM=new xe;function Ve(i,e,t,n,s){Gd.getNormalMatrix(t);let r=e.pos,a=e.nor,o=e.maxY-e.minY||1;for(let l=0;l<r.length;l+=3){let h=s+(1-s)*((r[l+1]-e.minY)/o);go.set(r[l],r[l+1],r[l+2]).applyMatrix4(t),xo.set(a[l],a[l+1],a[l+2]).applyMatrix3(Gd).normalize(),i.pos.push(go.x,go.y,go.z),i.nor.push(xo.x,xo.y,xo.z),i.col.push(n.r*h,n.g*h,n.b*h)}}var xh=[0,.3,.6,.82,1],Wd=[1,.75,.38,.12,0],vh=20;function Ty(i,e,t,n,s){for(let r=0;r<xh.length-1;r++){let a=xh[r]*n,o=xh[r+1]*n,l=Wd[r],h=Wd[r+1];for(let c=0;c<vh;c++){let u=c/vh*Math.PI*2,d=(c+1)/vh*Math.PI*2,m=Math.cos(u),g=Math.sin(u),x=Math.cos(d),p=Math.sin(d),f=[[a*m,a*g,l],[o*x,o*p,h],[o*m,o*g,h],[a*m,a*g,l],[a*x,a*p,l],[o*x,o*p,h]];for(let[S,w,v]of f)i.pos.push(e+S,.05,t+w),i.nor.push(0,1,0),i.col.push(s.r*v,s.g*v,s.b*v)}}}function Ge(i,e,t,n,s,r,a,o,l){return My.compose(Ey.set(i,e,t),by.setFromEuler(Sy.set(n,s,r)),wy.set(a,o,l))}function Ur(i,e,t,n,s,r,a,o,l,h,c,u,d,m,g,x,p,f,S){let w=[e,t,n,s,r,a,o,l,h,e,t,n,o,l,h,c,u,d],v=[f,f,S,f,S,S];for(let I=0;I<6;I++)i.pos.push(w[I*3],w[I*3+1],w[I*3+2]),i.nor.push(m,g,x),i.col.push(p.r*v[I],p.g*v[I],p.b*v[I])}function Xd(i,e,t){return!i.even&&_t(e*7+1,t*13+5)<.3?.8+_t(e,t+99)*1.2:i.height}var st=(i,e)=>e.setHex(i),Ay=new xe(11711080),Nr=new xe;function qd(i,e,t,n,s){let r=i*32,a=e*32,o=Dr+1,l=new Float32Array(o*o*3),h=new Float32Array(o*o*3),c=new xe,u=new xe;for(let v=0;v<o;v++)for(let I=0;I<o;I++){let C=I&1?I-1>>1:(I>>1)-1,E=I&1?C:I>>1,A=v&1?v-1>>1:(v>>1)-1,_=v&1?A:v>>1,y=0,P=0,H=!1,R=!1;u.setRGB(0,0,0);let O=r+I/2,z=a+v/2;for(let G=A;G<=_;G++)for(let se=C;se<=E;se++){let ee=t(se,G);if(ee<0)continue;let de=n[ee];if(st(de.ground,c),de.shape===0&&de.ground===7776597){let De=mo(O+300,z,9);c.lerp(Ay,Math.max(0,De-.45)*1.1)}u.r+=c.r,u.g+=c.g,u.b+=c.b,P+=de.shape===1?yy:0,de.shape===2&&(H=!0),(de.ground===6973282||de.ground===11569759||de.shape===1)&&(R=!0),y++}y||(u.setHex(7251535),y=1);let k=(.9+mo(O,z,3.5)*.18+(_t(I+r*2,v+a*2)-.5)*.05)*(H?.7:1),Z=(v*o+I)*3;h[Z]=u.r/y*k,h[Z+1]=u.g/y*k,h[Z+2]=u.b/y*k,l[Z]=O,l[Z+2]=z,l[Z+1]=P/y+(R?0:(mo(O,z,2.5)-.5)*.14)}let d=new Uint16Array(Dr*Dr*6),m=0;for(let v=0;v<Dr;v++)for(let I=0;I<Dr;I++){let C=v*o+I,E=C+1,A=C+o,_=A+1;I+v&1?(d[m++]=C,d[m++]=A,d[m++]=E,d[m++]=E,d[m++]=A,d[m++]=_):(d[m++]=C,d[m++]=A,d[m++]=_,d[m++]=C,d[m++]=_,d[m++]=E)}let g=new Yt;g.setAttribute("position",new it(l,3)),g.setAttribute("color",new it(h,3)),g.setIndex(new Hs(d,1)),g.computeVertexNormals(),g.computeBoundingSphere();let x=_y(),p=new Fr,f=new Fr,S=new Fr,w=s?x.leaf:x.leafLo;for(let v=0;v<32;v++)for(let I=0;I<32;I++){let C=t(I,v),E=n[C],A=r+I,_=a+v,y=_t(A,_),P=_t(_+17,A-3),H=_t(A*3+7,_*5+1);if(E.shape===2){let R=Xd(E,A,_),O=.92+y*.14;st(E.top,c).multiplyScalar(O);let z=A,k=A+1,Z=_,G=_+1;Ur(p,z,R,G,k,R,G,k,R,Z,z,R,Z,0,1,0,c,1,1),st(E.side,c).multiplyScalar(O);let se=(de,De)=>{let et=t(de,De);if(et<0)return 0;let $=n[et];return $.shape===2?Xd($,r+de,a+De):0},ee=se(I,v+1);ee<R&&Ur(p,z,ee,G,k,ee,G,k,R,G,z,R,G,0,0,1,c,ee?.85:.55,1),ee=se(I,v-1),ee<R&&Ur(p,k,ee,Z,z,ee,Z,z,R,Z,k,R,Z,0,0,-1,c,ee?.85:.55,1),ee=se(I+1,v),ee<R&&Ur(p,k,ee,G,k,ee,Z,k,R,Z,k,R,G,1,0,0,c,ee?.85:.55,.95),ee=se(I-1,v),ee<R&&Ur(p,z,ee,Z,z,ee,G,z,R,G,z,R,Z,-1,0,0,c,ee?.85:.55,.95)}else if(E.shape===3){let R=.85+y*.5,O=A+.5+(P-.5)*.3,z=_+.5+(H-.5)*.3,k=.9*R+.3;st(E.side,c),Ve(p,x.trunk,Ge(O,0,z,0,P*6,0,R,k,R),c,.55),st(E.top,c),Nr.setHex(P<.5?6989898:3963448),c.lerp(Nr,H*.7).multiplyScalar(.92+y*.16),Ve(p,w,Ge(O,k+.5*R,z,P,y*6,H,.95*R,.8*R,.95*R),c,.62),c.multiplyScalar(1.08),Ve(p,w,Ge(O+(P-.5)*.5*R,k+1.05*R,z+(H-.5)*.4*R,H,P*6,y,.62*R,.55*R,.62*R),c,.75)}else if(E.shape===5||E.shape===6){let R=A+.5,O=_+.5,z=E.shape===5;for(let k=0;k<7;k++){let Z=k/7*Math.PI*2+y,G=.1+_t(A+k,_-k)*.05;st(E.top,c).multiplyScalar(.8+_t(A*3+k,_)*.3),Ve(p,x.rock,Ge(R+Math.cos(Z)*.34,G*.4,O+Math.sin(Z)*.34,Z,Z*2,0,G,G*.7,G),c,.65)}st(E.side,c);for(let k=0;k<3;k++)Ve(p,x.log,Ge(R,.07+k*.03,O,0,P*3+k*1.05,z?.25:.05,1,1,1),c,.6);z&&(st(15895086,c),Ve(f,x.flame,Ge(R,.08,O,0,y*6,0,1,1.15,1),c,.75),st(16369487,c),Ve(f,x.flame,Ge(R+.04,.1,O-.03,.1,P*6,0,.6,.8,.6),c,.85),st(16773560,c),Ve(f,x.flame,Ge(R-.02,.1,O+.02,0,H*6,.1,.3,.5,.3),c,1))}else if(E.shape===4)for(let R=0;R<3;R++){let O=_t(A*5+R,_*3-R),z=_t(_*7+R,A-R*11);st(E.top,c).multiplyScalar(.8+O*.35);let k=.16+O*.22;Ve(p,x.rock,Ge(A+.2+z*.6,k*.25,_+.2+O*.6,O*3,z*6,z,k,k*.6,k*.9),c,.6)}else if(E.shape===7)for(let R=0;R<2;R++){let O=_t(A*3+R,_*7-R),z=_t(_*5+R,A+R*13);st(E.top,c).multiplyScalar(.78+O*.3),R===1&&P<.4&&c.lerp(Nr.setHex(10512188),.45);let k=R?.28+O*.15:.45+O*.15;Ve(p,x.rock,Ge(A+.3+z*.4,k*.45,_+.3+O*.4,O*3,z*6,z,k,k*.8,k*.95),c,.55)}else if(E.shape===8){let R=(y-.5)*1.2+(A+_&1?Math.PI/2:0),O=(P-.5)*.25,z=A+.5,k=_+.5;Nr.setHex([9063986,6253426,8022586,7223856][Math.floor(H*4)]),c.copy(Nr).multiplyScalar(.85+y*.2),Ve(p,x.box,Ge(z,.18,k,O,R,O*.6,1.15,.42,.62),c,.6),c.multiplyScalar(.8),Ve(p,x.box,Ge(z+Math.cos(R)*.1,.58,k-Math.sin(R)*.1,O,R,O+.1,.6,.3*(.5+P),.55),c,.7),st(E.side,c),Ve(p,x.wheel,Ge(z+Math.cos(R)*.4,.17,k-Math.sin(R)*.4+.3,0,R,0,.17,.34,.34),c,.5),y<.6&&Ve(p,x.wheel,Ge(z-Math.cos(R)*.4,.12,k+Math.sin(R)*.4-.3,.4,R,1.2,.17,.3,.3),c,.5)}else if(E.shape===9){for(let R=0;R<3;R++){let O=1.5+_t(A+R*5,_-R)*.4,z=A+.18+R*.32,k=_+.5+(_t(A*9+R,_)-.5)*.1;st(E.side,c).multiplyScalar(.85+_t(A+R,_*3)*.25),Ve(p,x.post,Ge(z,0,k,0,R,0,.3,O,.3),c,.55),st(E.top,c),Ve(p,x.spike,Ge(z,O,k,0,R,0,.3,.28,.3),c,.8)}for(let R=0;R<3;R++){let O=_+.2+R*.3,z=A+.5;st(E.side,c).multiplyScalar(.85+_t(A+R,_*5)*.25),Ve(p,x.post,Ge(z,0,O,0,R,0,.28,1.4+_t(A-R,_+R)*.4,.28),c,.55)}}else if(E.shape===10)for(let R=0;R<3;R++){let O=A+.2+R*.3;for(let z of[.5,-.5]){let Z=Math.sin(z)*1.05,G=Math.cos(z)*1.05;st(E.side,c),Ve(p,x.post,Ge(O,0,_+.5,z,0,0,.12,1.05,.12),c,.6),st(E.top,c),Ve(p,x.spike,Ge(O,G,_+.5+Z,z,0,0,.12,.32,.12),c,.85)}}else if(E.shape===11)st(E.side,c),Ve(p,x.box,Ge(A+.06,0,_+.5,0,0,0,.12,1.8,.14),c,.6),Ve(p,x.box,Ge(A+.94,0,_+.5,0,0,0,.12,1.8,.14),c,.6),Ve(p,x.box,Ge(A+.5,1.72,_+.5,0,0,0,1,.12,.16),c,.8),st(E.top,c),Ve(p,x.box,Ge(A+.12+.3,.02,_+.5+.3,0,-.9,0,.78,1.65,.07),c,.7);else if(E.shape===12)st(E.side,c),Ve(p,x.box,Ge(A+.5,0,_+.5,0,0,0,1,.8,.92),c,.6),Ve(p,x.box,Ge(A+.06,.8,_+.5,0,0,0,.12,.9,.92),c,.8),Ve(p,x.box,Ge(A+.94,.8,_+.5,0,0,0,.12,.9,.92),c,.8),Ve(p,x.box,Ge(A+.5,1.6,_+.5,0,0,0,1,.12,.92),c,.85),st(10474728,c),Ve(f,x.box,Ge(A+.5,.8,_+.5,0,0,0,.78,.8,.04),c,1);else if(E.shape===13)st(E.side,c),Ve(p,x.box,Ge(A+.5,0,_+.5,0,0,0,.72,.28,.96),c,.6),st(E.top,c),Ve(p,x.box,Ge(A+.5,.28,_+.56,0,0,0,.66,.1,.76),c,.85),st(15656662,c),Ve(p,x.box,Ge(A+.5,.28,_+.13,0,0,0,.5,.12,.18),c,.9);else if(E.shape===14)st(E.side,c),Ve(p,x.post,Ge(A+.5,0,_+.5,0,0,0,.1,1.7,.1),c,.6),Ve(p,x.box,Ge(A+.5,1.68,_+.5,0,.6,0,.3,.06,.3),c,.8),st(E.top,c),Ve(f,x.box,Ge(A+.5,1.45,_+.5,0,.6,0,.2,.24,.2),c,1),st(16757322,c),Ty(S,A+.5,_+.5,4.2,c);else if(E.shape===0&&E.ground===7776597&&y<.2){let R=A+.2+P*.6,O=_+.2+H*.6;st(6265413,c).multiplyScalar(.85+P*.3);for(let z=0;z<3;z++)Ve(p,x.blade,Ge(R+(z-1)*.06,0,O+(z*7%3-1)*.05,(H-.5)*.5,z*2.1,(z-1)*.35,1,.7+y*1.5,1),c,.6);y<.05&&(st(P<.33?15921126:P<.66?15976778:14243402,c),Ve(p,x.rock,Ge(R,.28,O,y,P,H,.06,.05,.06),c,1))}}return{ground:g,props:p.geometry(),glow:f.geometry(),pool:S.geometry()}}var Br=i=>i.replace(/[&<>"']/g,e=>`&#${e.charCodeAt(0)};`),Cy=new xe(16777215),yh=[.5,1,2,4],Ry=4,Py=8,Iy=32;function _h(i,e){let t=Math.floor((i/3600+8)/24)+1,n=Math.floor((i/3600+8)%24),s=Math.floor(i/60%60);return`${e} ${t} ${String(n).padStart(2,"0")}:${String(s).padStart(2,"0")}`}var vo=class{constructor(e,t,n,s,r){this.mapName=t;this.scale=n;this.looks=s;this.zombie=r;this.rec=e;let a=atob(e.frames),o=new Uint8Array(a.length);for(let h=0;h<a.length;h++)o[h]=a.charCodeAt(h);this.data=new Int16Array(o.buffer,0,o.length>>1);for(let h=0;h<this.data.length;h+=1+this.data[h]*7)this.offs.push(h);let l=e.who.length;this.face=new Float32Array(l),this.phase=new Float32Array(l),this.lastX=new Float32Array(l).fill(NaN),this.lastY=new Float32Array(l),this.spd=new Float32Array(l),this.el=document.createElement("div"),this.el.id="replay",document.body.appendChild(this.el),this.centre(0)}mapName;scale;looks;zombie;rec;t=0;playing=!0;speed=1;data;offs=[];face;phase;lastX;lastY;spd;el;html="";cx=0;cy=0;span=10;get length(){return Math.max(0,this.offs.length-1)/this.rec.hz}close(){this.el.remove()}toggle(){this.t>=this.length&&(this.t=0),this.playing=!this.playing}seek(e){this.t=Math.max(0,Math.min(this.length,this.t+e)),this.lastX.fill(NaN)}faster(e){let t=yh.indexOf(this.speed);this.speed=yh[Math.max(0,Math.min(yh.length-1,t+(e?1:-1)))]}update(e){this.playing&&(this.t+=e*this.speed,this.t>=this.length&&(this.t=this.length,this.playing=!1))}rows(e,t){t.clear();let n=this.data,s=this.offs[Math.max(0,Math.min(this.offs.length-1,e))];if(s===void 0)return;let r=n[s];for(let a=0,o=s+1;a<r;a++,o+=7)t.set(n[o],[n[o+1]/10,n[o+2]/10,n[o+3]/5e3,n[o+4],n[o+5],n[o+6]])}a=new Map;b=new Map;centre(e){this.rows(e,this.a);let t=0,n=0,s=0;for(let[r,a]of this.a){let o=this.rec.who[r][1]===2?2:1;t+=a[0]*o,n+=a[1]*o,s+=o}s&&(this.cx=t/s,this.cy=n/s)}draw(e,t,n){let s=this.t*this.rec.hz,r=Math.floor(s),a=s-r;this.rows(r,this.a),this.rows(r+1,this.b);let o=1/0,l=1/0,h=-1/0,c=-1/0;for(let[u,d]of this.a){let m=this.b.get(u)??d,g=this.rec.who[u],x=g[1]===2,p=d[0]+(m[0]-d[0])*a,f=d[1]+(m[1]-d[1])*a,S=this.lastX[u],w=Number.isNaN(S)?0:Math.hypot(p-S,f-this.lastY[u]);w>.004&&(this.face[u]=Math.atan2(p-S,f-this.lastY[u])),this.lastX[u]=p,this.lastY[u]=f;let v=t>0?Math.min(6,w/t):0;this.spd[u]=this.spd[u]+(v-this.spd[u])*Math.min(1,t*10),this.phase[u]=(this.phase[u]+w*4.2)%(Math.PI*2);let I=d[5];e.add(p,f,this.face[u],this.phase[u],Math.min(1,this.spd[u]/(x?1.2:2.2)),x?this.zombie:this.looks(g[0],g[2]),(I&(Ry|Py))!==0,I&Iy?.62:1,x),x||e.marker(p,f,performance.now()/1e3,Cy),o=Math.min(o,p),h=Math.max(h,p),l=Math.min(l,f),c=Math.max(c,f)}if(o<=h){let u=Math.min(1,t*3);this.cx+=((o+h)/2-this.cx)*u,this.cy+=((l+c)/2-this.cy)*u,this.span+=(Math.max(h-o,(c-l)*1.6)-this.span)*u}this.overlay(r,n)}overlay(e,t){let n=this.rec,s=c=>c>=0?Br(n.who[c]?.[2]??"?"):"?",r=[];for(let c=n.events.length-1;c>=0&&r.length<4;c--){let[u,d,m,g,x]=n.events[c];if(u>e||e-u>n.hz*6)continue;let p=d==="bite"?Le("evBite",s(g),s(m),String(x)):d==="killed"?Le("evKilled",s(g),s(m)):d==="death"?Le("evDeath",s(m)):d==="fight"?Le("evFight",s(m),s(g)):d==="flee"?Le("evFlee",s(m),s(g)):`${s(m)}: \u201C${Br(String(x))}\u201D`;r.unshift(`<div class="re re-${d}">${p}</div>`)}this.rows(e,this.a);let a=[];for(let[c,u]of this.a){let d=n.who[c];d[1]!==2&&a.push(`<span class="rp-p"><b>${Br(d[2])}</b> ${t(u[3])} \xB7 ${u[4]}</span>`)}let o=c=>`${Math.floor(c/60)}:${String(Math.floor(c%60)).padStart(2,"0")}`,l=this.length?this.t/this.length*100:0,h=`<div class="rp-t">${D("rpTitle")} \xB7 ${Br(_h(n.start+this.t*this.scale,D("day")))} \xB7 ${Br(this.mapName)}</div><div class="rp-bar"><i style="width:${l.toFixed(1)}%"></i></div><div class="rp-s"><span>${this.playing?"\u25B6":"\u275A\u275A"} ${o(this.t)} / ${o(this.length)} \xB7 x${this.speed}</span><span>${D("rpHint")}</span></div><div class="rp-people">${a.join("")}</div><div class="rp-ev">${r.join("")}</div>`;h!==this.html&&(this.html=h,this.el.innerHTML=h)}};var $s=["use","run","eat","drink","pickup","sleep","zoomIn","zoomOut","thoughts","person","menu","camera","wheel"],Ly={use:"aUse",run:"aRun",eat:"aEat",drink:"aDrink",pickup:"aPickup",sleep:"aSleep",zoomIn:"aZoomIn",zoomOut:"aZoomOut",thoughts:"aThoughts",person:"aPerson",menu:"aMenu",camera:"aCamera",wheel:"aWheel"},kn=i=>D(Ly[i]),kr={pad:{use:0,run:1,eat:2,sleep:3,zoomIn:4,zoomOut:5,wheel:7,thoughts:8,menu:9,camera:11},remote:{use:"ok",eat:"red",sleep:"green",thoughts:"yellow",person:"blue",zoomIn:"chUp",zoomOut:"chDown",menu:"info",wheel:"playPause"}};function Mh(i){return{pad:{...i.pad},remote:{...i.remote}}}function Or(i,e){for(let t of $s)if(i.pad[t]===e)return t}function rs(i,e){for(let t of $s)if(i.remote[t]===e)return t}var Dy={ok:"OK",red:"\u{1F534}",green:"\u{1F7E2}",yellow:"\u{1F7E1}",blue:"\u{1F535}",chUp:"CH +",chDown:"CH \u2212",info:"Info",play:"\u25B6",pause:"\u23F8",playPause:"\u23EF",ff:"\u23E9",rew:"\u23EA",next:"\u23ED",prev:"\u23EE",stop:"\u23F9",record:"\u23FA",tools:"Tools",chList:"CH list",guide:"Guide",space:"Space",pageUp:"PgUp",pageDown:"PgDn"},Mo=i=>Dy[i]??(/^\d$/.test(i),i),yo=class{constructor(e,t,n){this.build=e;this.onPick=t;this.onClose=n;this.el=document.createElement("div"),this.el.id="gmenu",this.el.hidden=!0,this.el.setAttribute("role","dialog"),this.titleEl=document.createElement("div"),this.titleEl.className="mt",this.textEl=document.createElement("div"),this.textEl.className="mx",this.listEl=document.createElement("div"),this.listEl.className="ml",this.listEl.setAttribute("role","menu"),this.el.append(this.titleEl,this.textEl,this.listEl),document.body.appendChild(this.el)}build;onPick;onClose;el;titleEl;textEl;listEl;stack=[];rows=[];open=!1;sel=0;get page(){return this.stack.length?this.stack[this.stack.length-1].id:""}show(e="root"){this.stack=[{id:e,sel:0}],this.open=!0,this.el.hidden=!1,document.body.classList.add("menu-open"),this.render()}push(e){this.stack.length&&(this.stack[this.stack.length-1].sel=this.sel),this.stack.push({id:e,sel:0}),this.render()}back(){if(this.stack.pop(),!this.stack.length){this.close();return}this.render(this.stack[this.stack.length-1].sel)}close(){this.open=!1,this.el.hidden=!0,document.body.classList.remove("menu-open"),this.stack=[],this.onClose()}refresh(){this.open&&this.render(this.sel)}render(e=0){let t=this.build(this.page);this.rows=t.rows,this.titleEl.textContent=t.title,this.el.classList.toggle("wide",!!t.wide),t.html?this.textEl.innerHTML=t.html:this.textEl.textContent=t.text??"",this.textEl.hidden=!t.text&&!t.html,this.listEl.textContent="";for(let n of t.rows){let s=document.createElement("div");s.className="mr"+(n.dim?" dim":""),s.setAttribute("role","menuitem");let r=document.createElement("span");if(r.textContent=n.label+(n.sub?" \u203A":""),s.appendChild(r),n.value!==void 0){let a=document.createElement("span");a.className="mv",a.textContent=n.value,s.appendChild(a)}this.listEl.appendChild(s)}this.select(Math.min(e,Math.max(0,t.rows.length-1)))}select(e){let t=this.listEl.children;t[this.sel]?.classList.remove("on"),this.sel=e;let n=t[e];if(n){n.classList.add("on"),n.scrollIntoView?.({block:"nearest"});let s=this.rows[e];globalThis.MyPC?.announce?.(s.label+(s.value?", "+s.value:""))}}input(e){if(!this.open)return;let t=this.rows.length;if(e==="up"&&t)this.select((this.sel+t-1)%t);else if(e==="down"&&t)this.select((this.sel+1)%t);else if(e==="back")this.back();else if(e==="ok"&&t){let n=this.rows[this.sel];this.onPick(this.page,n.id)}}};function dn(i,e){let t=Math.max(0,Math.min(100,100-e)),n=t>60?"#5cc98a":t>30?"#e8b64a":"#e5625b";return`<span class="nb"><span class="nl">${i}</span><span class="nt"><i style="width:${Math.max(3,t)}%;background:${n}"></i></span></span>`}var Yd={drink:"gDrink",eat:"gEat",forage:"gForage",sleep:"gSleep",talk:"gTalk",wander:"gWander",rest:"gRest",travel:"gTravel","gather wood":"wGatherWood","gather stone":"wGatherStone","gather scrap":"wGatherScrap","make an axe":"wAxe","make a spear":"wSpear","build a campfire":"wFire","build a hut":"wHut","feed the fire":"wTend","collect food and store it":"wStore","search the ruins":"wLoot","plant a field":"wFarm","repair the huts":"wRepair"};function $d(i){let e={wood:"iWood",stone:"iStone",scrap:"iScrap",axe:"iAxe",spear:"iSpear"};return Object.entries(i??{}).filter(([t,n])=>n>0&&e[t]).map(([t,n])=>t==="axe"||t==="spear"?D(e[t]):`${n} ${D(e[t])}`).join(", ")}var _o=class{constructor(e=10){this.max=e;this.box=document.createElement("div"),this.box.id="bubbles",document.body.appendChild(this.box);for(let t=0;t<e;t++){let n=document.createElement("div");n.className="bub",n.hidden=!0;let s=document.createElement("div");s.className="ba";let r=document.createElement("div");r.className="bb";let a=document.createElement("div");a.className="bp",a.hidden=!0;let o=document.createElement("i");a.appendChild(o),n.append(s,r,a),this.box.appendChild(n),this.pool.push({el:n,a:s,b:r,p:a,pi:o,pct:-2,id:-1,text:"",act:-1,ver:-1,lx:0,ly:0})}}max;box;pool=[];ver=0;pt={x:0,y:0};data=new Map;set(e,t){this.data.clear();for(let n of e){let s={id:n[0],act:n[1],to:String(n[2]??""),dist:Number(n[3])||0,wish:String(n[4]??""),wishWith:String(n[5]??""),why:String(n[6]??""),mood:String(n[7]??""),said:String(n[8]??""),pct:typeof n[9]=="number"?n[9]:-1,from:String(n[10]??"")};this.data.set(s.id,s)}this.ver++}hide(){for(let e of this.pool)e.el.hidden=!0,e.id=-1}cand=Array.from({length:48},()=>({id:-1,x:0,y:0,d:0}));wp={x:0,y:0};draw(e,t,n,s,r){let a=0;for(let l of this.data.keys()){if(a>=this.cand.length)break;if(!e(l,this.wp))continue;let h=this.cand[a++];h.id=l,h.x=this.wp.x,h.y=this.wp.y,h.d=Math.hypot(h.x-n,h.y-s)}let o=0;for(;o<this.pool.length&&o<a;o++){let l=o;for(let g=o+1;g<a;g++)this.cand[g].d<this.cand[l].d&&(l=g);if(l!==o){let g=this.cand[o];this.cand[o]=this.cand[l],this.cand[l]=g}let h=this.cand[o],c=this.pool[o],u=this.data.get(h.id);if(!t(h.x,h.y,this.pt)){c.el.hidden=!0;continue}if(c.id!==h.id||c.act!==u.act||c.ver!==this.ver){let g=r(u.act)+(u.to?" \xB7 "+Le("bWith",u.to):"")+(u.dist>=3?` \xB7 ${u.dist} m`:""),x=u.wish==="task"?u.why:u.wish?Le("bWants",D(Yd[u.wish]??"gWander")+(u.wishWith?" "+Le("bWith",u.wishWith):""))+(u.why?` (${u.why})`:""):"",p=[u.said?`\u201C${u.said}\u201D`:"",x].filter(Boolean).join(" \xB7 "),f=g+"|"+p;c.text!==f&&(c.text=f,c.a.textContent=g,c.b.textContent=p,c.b.hidden=!p);let S=u.wish==="task"?u.pct:-1;c.pct!==S&&(c.pct=S,c.p.hidden=S<0,S>=0&&(c.pi.style.width=`${Math.max(6,S)}%`,c.p.className=u.from?"bp ord":"bp")),c.id=h.id,c.act=u.act,c.ver=this.ver}c.el.hidden=!1;let d=Math.round(this.pt.x),m=Math.round(this.pt.y);(d!==c.lx||m!==c.ly)&&(c.lx=d,c.ly=m,c.el.style.transform=`translate(${d}px, ${m}px) translate(-50%, -100%)`)}for(;o<this.pool.length;o++)this.pool[o].el.hidden=!0,this.pool[o].id=-1}},Uy={strength:"tStrength",speed:"tSpeed",intelligence:"tIntelligence",courage:"tCourage",empathy:"tEmpathy",metabolism:"tMetabolism",lifespan:"tLifespan"};function bh(i,e,t){let n=a=>a.replace(/[&<>"']/g,o=>`&#${o.charCodeAt(0)};`),s=`<div class="pn">${n(i.name)}</div><div class="ps">${i.sex==="f"?D("pWoman"):D("pMan")} \xB7 ${Le("pAge",String(i.age))}${i.age<16?" \xB7 "+D("pChild"):""}${i.pregnant?" \xB7 "+D("pExpecting"):""}</div>`;if(!i.alive)return s+`<div class="ps">${D("pDead")}${i.cause?" ("+n(i.cause)+")":""}</div>`;let r=[s,`<div class="pa">${n(e(i.act??0))}${i.carry?" \xB7 "+Le("carry",String(i.carry)):""}${$d(i.inv)?" \xB7 "+n(Le("has",$d(i.inv))):""}</div>`,`<div class="pbars">${dn(D("nFood"),i.hunger??0)}${dn(D("nWater"),i.thirst??0)}${dn(D("nRest"),i.tired??0)}${dn(D("nFun"),i.lonely??0)}${dn(D("nHp"),100-(i.hp??100))}</div>`];if(i.goal&&r.push(`<div class="pm">${D("pGoal")}: <b>${n(i.goal.text)}</b> \xB7 ${Math.min(i.goal.k+1,i.goal.n)}/${i.goal.n}</div><div class="bp${i.goal.from!=="myself"?" ord":""}"><i style="width:${Math.max(6,i.goal.pct)}%"></i></div>`),i.level!==void 0&&r.push(`<div class="pm">${Le("pLevel",String(i.level),String(i.xp??0))}</div>`),i.mind){let a=i.mind;r.push(`<div class="pm">${D("pMood")}: <b>${n(a.mood)}</b>${a.plan?` \xB7 ${D("pWants")} ${n(D(Yd[a.plan.act]??"gWander"))}${a.plan.with?" "+n(Le("bWith",a.plan.with)):""}${a.plan.why?" ("+n(a.plan.why)+")":""}`:""}</div>`),a.said&&r.push(`<div class="pm">${D("pSaid")}: \u201C${n(a.said)}\u201D</div>`)}return t&&(r.push(`<div class="pm">${n(i.personality.join(", "))} \xB7 ${Le("pGen",String(i.generation))}</div>`,`<div class="pm">${D("pPartner")}: ${n(i.partner??D("pNone"))} \xB7 ${D("pParents")}: ${n(i.parents.join(", ")||D("pFirst"))} \xB7 ${D("pChildren")}: ${n(i.children.join(", ")||D("pNone"))}</div>`,`<div class="pm">${D("pTraits")}: ${Object.entries(i.traits).map(([a,o])=>`${D(Uy[a]??"tStrength")} ${a==="lifespan"?o:Math.round(o*100)+"%"}`).join(" \xB7 ")}</div>`),i.mind?.memory&&r.push(`<div class="pm">${D("pMemory")}: ${n(i.mind.memory)}</div>`),i.mind?.recent.length&&r.push(`<div class="pm">${D("pRecent")}: ${n(i.mind.recent.join(" \xB7 "))}</div>`)),r.join("")}var bo=class{constructor(e){this.el=e;e.hidden=!0,this.mid=document.createElement("div"),this.mid.className="wh-mid",this.helpEl=document.createElement("div"),this.helpEl.className="wh-help"}el;open=!1;hold=!1;sel=-1;openedAt=0;items=[];slots=[];mid;helpEl;show(e,t,n){this.items=e,this.hold=t,this.open=!0,this.sel=-1,this.openedAt=performance.now(),this.el.textContent="",this.slots=e.map((s,r)=>{let a=r/e.length*Math.PI*2,o=document.createElement("div");o.className="wh-s",o.style.left=`${50+Math.sin(a)*36}%`,o.style.top=`${50-Math.cos(a)*36}%`;let l=document.createElement("b");l.textContent=s.icon;let h=document.createElement("span");return h.textContent=s.label,o.append(l,h),this.el.appendChild(o),o}),this.mid.textContent="",this.helpEl.textContent=n,this.el.append(this.mid,this.helpEl),this.el.hidden=!1}aim(e,t){if(e*e+t*t<.3)return;let n=this.items.length,s=Math.atan2(e,-t);s<0&&(s+=Math.PI*2),this.choose(Math.round(s/(Math.PI*2/n))%n)}step(e){let t=this.items.length;e==="up"?this.choose(0):e==="down"?this.choose(Math.floor(t/2)):this.choose(((this.sel<0?0:this.sel)+(e==="right"?1:t-1))%t)}choose(e){if(e===this.sel)return;this.sel>=0&&this.slots[this.sel]?.classList.remove("on"),this.sel=e;let t=this.slots[e];t&&(t.classList.add("on"),this.mid.textContent=this.items[e].label)}close(){if(!this.open)return null;let e=this.sel>=0?this.items[this.sel].id:null;return this.open=!1,this.hold=!1,this.sel=-1,this.el.hidden=!0,e}};var xf=document.getElementById("c"),Kd=document.getElementById("screen"),vf=document.getElementById("top"),yf=document.getElementById("hint"),Zn=document.getElementById("note"),Eh=document.getElementById("card"),pi=null,On="",Zt=null,Et="connect",Qe="play",To="",Ui=0,Th=0,An=null,Nt="",Vh=256,Gh=256,pn=128,mn=128,nr="mid",By=!0,pe=null,_f=[],Ah=new Uint8Array(256),ir=new Map,Gr=new Map,ls=[],Do=0,Uo=0,Wr=10,Xr=1,Mf=0,No={radius:.3,walk:1.4,run:3.5},vt=4096,Jt=new Int32Array(vt).fill(-1),Dt=new Uint8Array(vt),Ch=new Uint8Array(vt),Fo=new Uint8Array(vt),Ao=new Uint8Array(vt),Bo=new Float32Array(vt),ko=new Float32Array(vt),Cn=new Float32Array(vt),zn=new Float32Array(vt),Rh=new Float32Array(vt),Ph=new Float32Array(vt),ky=new Float32Array(vt),as=new Float32Array(vt),Vr=new Float32Array(vt),Ys=new Float32Array(vt),Ih=new Float32Array(vt),Lh=new Float32Array(vt),bf=[],Hn=new Map,Oo=0,Dh=100,pt=-1,Uh=0,gi=-1,Wo=!1,Sf=0,wf="",Sn=0,wn=0,zr=0,Hr=0,Vn=!1,Nh=150,Co=0,Ro=0,Jd=!1,Sh=0,Xo=0,sr=!1,at={left:!1,right:!1,up:!1,down:!1},wt=Mh(kr),Kn=null,Tn=!0,Po=["top","third","first"],fi="top",js=0,qr=!1,Ef=0,dt=null,sn="",Ut={},cs=null,os=null,Xt=null,jd=!1,En={sex:"m",skin:1},ot=null,Js="",Tf=24,Kt=null,rr=-1,Qd=0,Af=new Float32Array(vt),Cf=new Float32Array(vt),Rf=new Uint32Array(vt),Fh=0,Zs=0,Ft=i=>new xe(i),Oy=[9132604,7044426,5926790,10124111,8014667,6184558,10512442,5204830,9076586].map(Ft),zo=[15845797,14724226,13011806,10250819,7227951].map(Ft),zy=[2825492,4861984,8016432,13214826,1710618,9079434].map(Ft),Hy=[3881536,4865328,3095370,5261373].map(Ft),Pf={tunic:Ft(7038544),skin:Ft(10469247),hair:Ft(5660746),pants:Ft(4080694)},If={tunic:Ft(3122027),skin:Ft(15251600),hair:Ft(3810326),pants:Ft(3817306)},Lf={tunic:Ft(14254635),skin:Ft(14197370),hair:Ft(2825492),pants:Ft(4210762)},ef=Ft(16765286),Vy=Ft(16777215),tf=new Map;function Gy(i,e){let t=(i?64:0)+e,n=tf.get(t);if(!n){let s=i?If:Lf,r=(e&8)!==0;n={tunic:s.tunic,skin:zo[Math.min(zo.length-1,e-1&7)],hair:r?Ft(5911584):s.hair,pants:r?s.tunic:s.pants},tf.set(t,n)}return n}function Df(i){let e=n=>_t(i&65535,n),t=(n,s)=>n[Math.floor(e(s)*n.length)];return{tunic:t(Oy,1),skin:t(zo,2),hair:t(zy,3),pants:t(Hy,4)}}function Ni(i,e=""){Et=i,xf.style.visibility=i==="world"?"visible":"hidden",vf.hidden=yf.hidden=i!=="world",i!=="world"&&(Zn.hidden=!0,Eh.hidden=!0,zh="",Q?.open&&Q.close(),ds?.hide()),Kd.hidden=i==="world";let t="";switch(i){case"connect":t=`<h1>${D("connecting")}</h1>`;break;case"offline":t=`<h1>${D("offline")}</h1><p class="dim">${At(On)}</p><p class="key">A \xB7 ${D("menuServer")}</p>`;break;case"noserver":t=`<h1>${D("noServer")}</h1><p class="key">${D("enterServer")}</p>`;break;case"pair":t=`<h1>${D("pairTitle")}</h1><p>${D("pairHow")}</p><div class="code">${To.slice(0,3)} ${To.slice(3)}</div><p class="dim">${At(Wy())}</p><p class="dim">${D("pairWait")}</p>`;break;case"pairfail":t=`<h1>${e}</h1>`;break;case"nogl":t=`<h1>${D("noGl")}</h1>`;break}Kd.innerHTML=t,i==="pair"&&MyPC.announce?.(`${D("pairTitle")}. ${To.split("").join(" ")}`),or()}var At=i=>i.replace(/[&<>"']/g,e=>`&#${e.charCodeAt(0)};`),Wy=()=>On.replace(/\/+$/,"")+"/panel/",nf=0;function Je(i,e=3500){Zn.textContent=i,Zn.hidden=!1,clearTimeout(nf),e>0&&(nf=window.setTimeout(()=>{Zn.hidden=!0},e)),MyPC.announce?.(i)}function Xy(i){let e=i.trim().replace(/\/+$/,"");return/^[a-z]+:\/\//i.test(e)||(e="https://"+e),e.replace(/^http/i,"ws")+"/ws"}function ar(){if(clearTimeout(Th),Zt&&(Zt.onclose=null,Zt.close(),Zt=null),!On){Ni("noserver");return}Et!=="world"&&Ni(Ui>1?"offline":"connect");let i;try{i=new WebSocket(Xy(On))}catch{Ni("noserver");return}i.binaryType="arraybuffer",Zt=i,i.onopen=()=>{Ui=0,pi?.token?i.send(ra({t:Ce.Hello,v:1,token:pi.token,name:Ho()})):i.send(ra({t:Ce.Pair,v:1,name:Ho(),dev:qy()}))},i.onmessage=e=>$y(du(e.data)),i.onclose=()=>{Zt===i&&(Zt=null,Et!=="pairfail"&&(Ui++,(Et!=="world"||Ui>2)&&Ni("offline"),Th=window.setTimeout(ar,Math.min(15e3,1e3*2**Math.min(Ui,4)))))}}function Ho(){return String(MyPC.info?.().profile?.name||pi?.name||"Player")}function qy(){return/Tizen|SMART-TV/i.test(navigator.userAgent)?"Samsung TV":/Android/i.test(navigator.userAgent)?"Android":"Browser"}function je(i){Zt&&Zt.readyState===1&&Zt.send(ra(i))}function $y(i){switch(i.t){case Ce.PairCode:To=i.code,Ni("pair");break;case Ce.Paired:pi={token:i.token,name:i.name,server:On},MyPC.save("auth",pi),Zt?.close();break;case Ce.Error:i.code==="auth"?(pi=null,MyPC.save("auth",null),setTimeout(ar,300)):i.code==="expired"||i.code==="denied"?Ni("pairfail",D(i.code==="expired"?"pairExpired":"pairDenied")):i.code==="full"&&Je(D("worldFull"));break;case Ce.Welcome:{An=i,qr=!!i.seer,_f=Vd(i.tiles),Ah.fill(0);for(let e of i.tiles)e.solid&&(Ah[e.id]=1);if(i.body&&(No=i.body),Do=i.clock.gameSec,Uo=performance.now(),Wr=i.clock.clockScale,Xr=i.clock.paused?0:i.clock.speed,!pe){try{pe=new po(xf,nr)}catch{Ni("nogl");return}Hh()}!Nt||!i.maps.some(e=>e.id===Nt)?Qs(String(MyPC.load("map",i.maps[0].id))):Qs(Nt),Ni("world"),Qe==="play"&&je({t:Ce.Join}),xi();break}case Ce.You:{gi=i.id,Wo=i.transit,wf=i.map,Sf=i.arrive??0,Vn=!1,!i.transit&&i.map!==Nt&&Qs(i.map),Qe==="play"&&i.x!==void 0&&i.y!==void 0&&(pn=i.x,mn=i.y,Gn=!0,pt=-1,xi()),Qe==="play"&&!jd&&(jd=!0,je({t:Ce.Do,a:"mine"})),i.transit?Je(Le("travelling",$r(i.map)),0):Zn.hidden=!0;break}case Ce.Notice:if(i.kind==="people"&&l_(i.data),i.kind==="interact"){let e=i.data,t=e?Hn.get(e.id):void 0;Je(e?e.kind===kt.Player?D("metPlayer"):`${Bi(t!==void 0?Fo[t]:0)}...`:D("nobody"))}if(i.kind==="say"){let e=i.data;Je(`${e.name}: \u201C${e.text}\u201D`,7e3)}if(i.kind==="did"&&x_(i.data),i.kind==="me"&&(dt=i.data,Yr(),Q.open&&(Q.page==="bag"||Q.page==="cat"||Q.page==="guide")&&Q.refresh()),i.kind==="blocked"&&Je(D("dBlocked"),5e3),i.kind==="info"){let e=i.data;e&&e.id===rr&&(Kt=e,Yr(),Q.open&&Q.page==="person"&&Q.refresh())}i.kind==="minds"&&(qr=!0,Ef=performance.now(),ds.set(i.data,Bi));break;case Ce.Pong:Nh=Nh*.7+(performance.now()-i.c)*.3;break;case Ce.Chunk:{if(i.map!==Nt||!An)break;let e=aa(i.cx,i.cy);ir.set(e,i.tiles),Ky(e);break}case Ce.ChunkDrop:if(i.map!==Nt)break;for(let e of i.keys){ir.delete(e);let t=Gr.get(e);t&&(pe?.removeChunk(t),Gr.delete(e))}break;case Ce.Frame:{if(i.map!==Nt)break;let e=performance.now();Dh=Dh*.85+Math.min(400,e-Oo)*.15,Oo=e,Do=i.gameSec,Uo=e;for(let n=0;n<vt;n++)Jt[n]!==-1&&(Bo[n]=Cn[n],ko[n]=zn[n]);let t=fu(i.upd);for(let n=0;n<t.length;n+=7){let s=Yy(t[n]);if(s<0)continue;let r=Dt[s]===0;Dt[s]=t[n+1]&255,Ch[s]=t[n+1]>>8&255,Fo[s]=t[n+1]>>16&255,Ao[s]=t[n+1]>>>24&63,Cn[s]=t[n+2]/100,zn[s]=t[n+3]/100,ky[s]=t[n+4]/1e4,Rh[s]=t[n+5]/100,Ph[s]=t[n+6]/100,r&&(Bo[s]=Ih[s]=Cn[s],ko[s]=Lh[s]=zn[s],Ys[s]=0,Vr[s]=0,as[s]=Math.atan2(Rh[s],Ph[s])||0,bf[s]=Df(t[n]))}for(let n of i.del){let s=Hn.get(n);s!==void 0&&(Jt[s]=-1,Dt[s]=0,Hn.delete(n)),n===pt&&(pt=-1)}break}case Ce.Stats:Mf=i.s.agents,Xr=i.s.paused?0:i.s.speed;break}}function Yy(i){let e=Hn.get(i);if(e!==void 0)return e;for(let t=0;t<vt;t++)if(Jt[t]===-1)return Jt[t]=i,Hn.set(i,t),t;return-1}function Zy(){Jt.fill(-1),Dt.fill(0),Hn.clear(),pt=-1}var Bi=i=>D(["actIdle","actWander","actDrink","actEat","actForage","actSleep","actTalk","actTravel","actRest","actFlee","actGo","actGather","actBuild","actFight"][i]??"actIdle"),$r=i=>An?.maps.find(e=>e.id===i)?.name??i;function Ky(i){ls.includes(i)||ls.push(i)}function Jy(i,e,t){let n=i&65535,s=i>>>16;if(e<0?(n--,e+=32):e>=32&&(n++,e-=32),t<0?(s--,t+=32):t>=32&&(s++,t-=32),n<0||s<0)return-1;let r=ir.get(aa(n,s));return r?r[t*32+e]:-1}function jy(){if(!ls.length||!pe)return;let i=0,e=1/0,t=Kr()/32-.5,n=Jr()/32-.5;for(let o=0;o<ls.length;o++){let l=ls[o],h=Math.hypot((l&65535)-t,(l>>>16)-n);h<e&&(e=h,i=o)}let s=ls.splice(i,1)[0];if(!ir.has(s))return;let r=Gr.get(s);r&&pe.removeChunk(r);let a=qd(s&65535,s>>>16,(o,l)=>Jy(s,o,l),_f,nr==="high");Gr.set(s,pe.addChunk(a.ground,a.props,a.glow,a.pool))}function Qs(i){if(!An)return;let e=An.maps.find(t=>t.id===i)??An.maps[0];Nt=e.id,Vh=e.w,Gh=e.h,pn=e.w/2,mn=e.h/2,ir.clear(),Gr.clear(),ls.length=0,pe?.setMap(e.w,e.h,An.portals.filter(t=>t.map===Nt)),Zy(),Vn=!1,Gn=!0,MyPC.save("map",Nt),xi()}function Qy(){return pe&&pe.view!=="top"?Math.min(96,pe.sight+10):Math.min(96,(pe?.dist??24)*1.2+14)}function xi(){An&&je({t:Ce.View,map:Nt,x:Kr(),y:Jr(),r:Qy()})}function hs(){return gi>=0?Hn.get(gi)??-1:-1}function fs(){return Qe==="play"&&gi>=0&&!Wo}function Kr(){return ot?ot.cx:fs()&&Vn?Sn:pn}function Jr(){return ot?ot.cy:fs()&&Vn?wn:mn}function e_(i){ot&&ot.close(),Js||(Js=Nt),i.map!==Nt&&Qs(i.map),Qe==="play"&&je({t:Ce.Input,mx:0,my:0,run:!1,seq:++Xo}),at.left=at.right=at.up=at.down=!1,!ot&&pe&&(Tf=pe.dist),ot=new vo(i,$r(i.map),Wr,e=>Df(e),Pf),document.body.classList.add("replaying"),Gn=!0,xi(),MyPC.announce?.(D("rpTitle"))}function Uf(){ot&&(ot.close(),ot=null,pe&&(pe.dist=Tf),document.body.classList.remove("replaying"),Js&&Js!==Nt&&Qs(Js),Js="",Vn=!1,Gn=!0,xi(),mi("past"))}function wo(i,e){let t=Math.floor(i),n=Math.floor(e);if(t<0||n<0||t>=Vh||n>=Gh)return!0;let s=ir.get(aa(t/32|0,n/32|0));return s?Ah[s[n%32*32+t%32]]===1:!1}function sf(i,e){let t=No.radius*.9;return wo(i-t,e-t)||wo(i+t,e-t)||wo(i-t,e+t)||wo(i+t,e+t)}function Nf(){if(Q.open||ft.open)return er[0]=er[1]=0,er;let i=MyPC.gamepad?MyPC.gamepad.axis(0):0,e=MyPC.gamepad?MyPC.gamepad.axis(1):0;Math.hypot(i,e)<.18&&(i=0,e=0),at.left&&(i=-1),at.right&&(i=1),at.up&&(e=-1),at.down&&(e=1);let t=Math.hypot(i,e);return t>1&&(i/=t,e/=t),[i,e]}var rf=[0,0],er=[0,0];function t_(i){if(Q.open||ft.open)return er[0]=er[1]=0,er;let e=MyPC.gamepad,t=e?e.axis(0):0,n=e?e.axis(1):0,s=e?e.axis(2):0;Math.hypot(t,n)<.18&&(t=0,n=0),Math.abs(s)<.2&&(s=0);let r=s*Math.abs(s)+(at.right?1:0)-(at.left?1:0);js+=r*2.4*i;let a=-n+(at.up?1:0)-(at.down?1:0),o=t,l=Math.sin(js),h=-Math.cos(js),c=l*a-h*o,u=h*a+l*o,d=Math.hypot(c,u);return d>1&&(c/=d,u/=d),wh[0]=c,wh[1]=u,wh}var wh=[0,0],ft=new bo(document.getElementById("wheel")),n_=["use","eat","drink","sleep","pickup","place","bag","camera"],i_={use:"\u270B",eat:"\u{1F356}",drink:"\u{1F4A7}",sleep:"\u{1F6CF}",pickup:"\u{1F9FA}",place:"\u{1F9F1}",bag:"\u{1F392}",camera:"\u{1F3A5}"},s_={use:"qUse",eat:"qEat",drink:"qDrink",sleep:"qSleep",pickup:"qPickup",place:"qPlace",bag:"qBag",camera:"qCamera"};function Wh(i,e){if(!(Et!=="world"||Q.open||ot)){if(i){if(ft.open){e||ft.close();return}if(Qe!=="play"||!fs())return;at.left=at.right=at.up=at.down=!1,sr=!1;let t=n_.map(n=>({id:n,icon:i_[n],label:n==="place"?r_():D(s_[n])}));ft.show(t,e,D(e?"wheelHelp":"wheelRemote"));return}if(!(!e||!ft.hold)){if(ft.sel<0&&performance.now()-ft.openedAt<350){ft.hold=!1;return}qo(ft.close())}}}function Ff(){let i=dt?.inv??{};for(let e of Qo)if((i[e]??0)>0)return e;return null}function r_(){let i=Ff();return i?Le("cPut",fn(i)):D("qPlace")}function qo(i){if(i){if(i==="camera"){Xh();return}if(i==="bag"){mi("bag");return}if(i==="place"){let e=Ff();e?je({t:Ce.Do,a:"place",text:e}):Je(D("qNothing"),2e3);return}Fi(i,!0)}}function Xh(i){fi=i??Po[(Po.indexOf(fi)+1)%Po.length],MyPC.save("cam",fi);let e=hs();fi!=="top"&&e>=0&&(js=Math.PI-as[e]),pe&&(pe.yaw=js),Gn=!0,Je(`${D("sCamera")}: ${Bf(fi)}`,1500),or(),xi()}function Bf(i){return D(i==="top"?"camTop":i==="third"?"camThird":"camFirst")}function a_(i,e){let[t,n]=pe&&pe.view!=="top"?t_(i):Nf();rf[0]=t,rf[1]=n;let s=sr&&!Q.open,r=Math.round(t*50)/50,a=Math.round(n*50)/50;((r!==Co||a!==Ro)&&(e-Sh>50||!r&&!a||!Co&&!Ro)||s!==Jd||(r||a)&&e-Sh>200)&&(Co=r,Ro=a,Jd=s,Sh=e,je({t:Ce.Input,mx:r,my:a,run:s,seq:++Xo}));let o=hs();if(o<0)return;Vn||(Sn=Cn[o],wn=zn[o],zr=Hr=0,Vn=!0);let l=s?No.run:No.walk,h=t*l,c=n*l,u=h-zr,d=c-Hr,m=Math.hypot(u,d),g=8*i,x=m>g?g/m:1;zr+=u*x,Hr+=d*x;let p=Sn+zr*i;sf(p,wn)?zr=0:Sn=p;let f=wn+Hr*i;sf(Sn,f)?Hr=0:wn=f;let S=Math.min(.5,(e-Oo)/1e3+Nh/2e3),w=Cn[o]+Rh[o]*S,v=zn[o]+Ph[o]*S,I=w-Sn,C=v-wn,E=Math.hypot(I,C);if(E>2.5)Sn=w,wn=v;else{let A=1-Math.exp(-i*(E>.6?6:2.5));Sn+=I*A,wn+=C*A}}function kf(){if(!An)return;let i=An.maps.findIndex(e=>e.id===Nt);Qs(An.maps[(i+1)%An.maps.length].id),MyPC.announce?.($r(Nt))}function Vo(i){if(pe){if(pe.view==="third"){pe.back=Math.max(3.5,Math.min(14,pe.back*i)),MyPC.save("back",pe.back);return}pe.view!=="first"&&(pe.dist=Math.max(12,Math.min(70,pe.dist*i)),MyPC.save("dist",pe.dist))}}function Bh(){let i=-1,e=1/0,t=-1,n=1/0,s=pt>=0?Hn.get(pt)??-1:-1,r=s>=0?Math.hypot(Cn[s]-pn,zn[s]-mn):-1;for(let o=0;o<vt;o++){if(Jt[o]===-1||Dt[o]!==kt.Agent&&Dt[o]!==kt.Player||o===s||Jt[o]===gi)continue;let l=Math.hypot(Cn[o]-pn,zn[o]-mn);l<e&&(e=l,i=o),l>r&&l<n&&(n=l,t=o)}let a=s>=0&&t>=0?t:i;if(a>=0&&(s<0||t>=0)){pt=Jt[a],MyPC.announce?.(`${D("following")} #${pt&65535}`);return}je({t:Ce.Who,map:Nt})}var o_=0;function l_(i){let e=i.filter(n=>n[0]!==gi);if(!e.length){Je(D("nobody"));return}let t=e[o_++%e.length];pn=t[1],mn=t[2],pt=t[0],Uh=performance.now(),Gn=!0,xi(),MyPC.announce?.(`${D("following")} #${pt&65535}`)}function c_(){let[i,e]=Nf();if(i||e){pt=-1;let t=(pe?.dist??24)/24*.35;pn=Math.max(0,Math.min(Vh,pn+i*t)),mn=Math.max(0,Math.min(Gh,mn+e*t))}if(pt>=0){let t=Hn.get(pt);t!==void 0?(pn=Cn[t],mn=zn[t],Uh=performance.now()):performance.now()-Uh>4e3&&(pt=-1)}}function h_(i){if(Qe=i,MyPC.save("how",i),Of(),or(),i==="play")je({t:Ce.Join}),Vn=!1,Gn=!0;else{je({t:Ce.Input,mx:0,my:0,run:!1,seq:++Xo});let e=hs();e>=0&&(pn=Cn[e],mn=zn[e])}}async function qh(){let i=MyPC.text?.keyboard?await MyPC.text.keyboard({value:On,kind:"url",label:D("serverLabel"),ok:"OK"}):window.prompt(D("serverLabel"),On);i===null||!i.trim()||(On=i.trim(),MyPC.save("server",On),Ui=0,ar())}function u_(){pi=null,MyPC.save("auth",null),Ui=0,ar()}function Of(){MyPC.setMenu([{id:"game",label:D("gameMenuItem")},{id:"server",label:D("menuServer")}])}function or(){let i=r=>{if(Zs){let o=wt.pad[r];return o===void 0?"":String(MyPC.gamepad?.label?.(o)??MyPC.gamepad?.name?.(o)??o)}let a=wt.remote[r];return a?Mo(a):""},e=(r,a)=>{let o=i(r);return o?`${o}: ${a}`:""},n=Qe==="play"&&fi!=="top"?`${D("hMove")}: ${Zs?"stick":"\u2191 \u2193"} \xB7 ${D("hTurn")}: ${Zs?"R stick":"\u2190 \u2192"}`:`${D("hMove")}: ${Zs?"stick":"\u2190 \u2191 \u2192 \u2193"}`,s=Qe==="play"?[n,e("use",kn("use")),e("run",kn("run")),e("eat",kn("eat")),e("sleep",kn("sleep")),e("wheel",D("aWheel").replace(/ \(.*\)$/,"")),e("menu",kn("menu"))]:[n,e("use",D("wFollow")),e("eat",D("wMap")),e("sleep",D("wCard")),e("menu",kn("menu"))];Zs||s.push(D("hintMenu")),yf.textContent=s.filter(Boolean).join(" \xB7 ")}function $h(i){let e=Kr(),t=Jr(),n=-1,s=i;for(let r=0;r<vt;r++){if(Jt[r]===-1||Dt[r]!==kt.Agent)continue;let a=Math.hypot(Cn[r]-e,zn[r]-t);a<s&&(s=a,n=Jt[r])}return n}function Fi(i,e){if(i==="run"){sr=e;return}if(!(!e||Et!=="world")){switch(i){case"menu":mi();return;case"zoomIn":Vo(1/1.2);return;case"zoomOut":Vo(1.2);return;case"thoughts":Tn=!Tn,MyPC.save("thoughts",Tn),Tn||ds.hide(),Je(`${D("sThoughts")}: ${D(Tn?"on":"off")}`,1500);return;case"person":mi("person");return;case"camera":Qe==="play"&&Xh();return;case"wheel":Wh(!0,!1);return}if(Qe==="watch"){i==="use"?Bh():i==="eat"?kf():i==="sleep"&&mi("person");return}if(fs()){if(i==="use"){if($h(2.8)<0){je({t:Ce.Do,a:"use"});return}if(je({t:Ce.Do,a:"hold"}),at.left=at.right=at.up=at.down=!1,sr=!1,f_()){m_();return}zf();return}je({t:Ce.Do,a:i})}}}var d_={},us=i=>i.charAt(0).toUpperCase()+i.slice(1);function fn(i){let e=jo.includes(i)||i==="meat"?"r"+us(i):mu.includes(i)?"an"+us(i):"x"+us(i),t=D(e);return t===e?i:t}function af(i){return Object.entries(i).map(([e,t])=>`${t} ${fn(e)}`).join(" + ")}function of(i){return i?Object.entries(i).filter(([,e])=>e>0).map(([e,t])=>`${t} ${fn(e)}`).join(", "):""}function Eo(i){return D("k"+us(i))}var Io=!1;function f_(){try{return(MyPC.apiLevel??0)>=24&&!!MyPC.stt?.enabled?.()}catch{return!1}}var lf="",cf=0;function kh(i){let e=(i??"").trim(),t=performance.now();e&&e===lf&&t-cf<3e3||(lf=e,cf=t,Oh(e))}function Oh(i){let e=(i??"").trim();je(e?{t:Ce.Do,a:"talk",text:e.slice(0,300)}:{t:Ce.Do,a:"talk"})}function zf(){if(!MyPC.text?.keyboard){Oh("");return}MyPC.text.keyboard({value:"",kind:"text",label:D("sayLabel"),ok:"OK"}).then(i=>Oh(i))}function p_(){let i=new Set;Kt?.name&&i.add(Kt.name);for(let[,e]of cs??[])i.add(e);return[...i].slice(0,30)}function m_(){if(Io){MyPC.stt.stop?.();return}Io=!0,Je(D("listening"),0),MyPC.stt.listen({maxSeconds:10,hint:p_()}).then(i=>{Zn.hidden=!0,kh(i.text)}).catch(i=>{Zn.hidden=!0,!(i?.code==="nothing"||i?.code==="cancelled")&&zf()}).finally(()=>{Io=!1})}function g_(i){if(Io){kh(i.text);return}if(Et!=="world"||!fs()||ot||$h(2.8)<0){Je(`\u201C${i.text}\u201D`,2500);return}je({t:Ce.Do,a:"hold"}),kh(i.text)}function x_(i){let e=i;if(e.me&&(Xt=e.me,Q.open&&(Q.page==="me"||Q.page==="rules"||Q.page==="look")&&Q.refresh(),!Xt.chose&&Qe==="play"&&Et==="world"&&!Q.open&&(En.sex=Xt.sex,En.skin=Xt.skin,mi("look"))),i.code==="mine")return;let t={looked:"looked",sexPregnant:"sexPregnant",autoOn:"autoOn",autoOff:"autoOff",ruleAdded:"ruleAdded",ruleRemoved:"ruleRemoved",rulesFull:"rulesFull",built:"built",needHut:"needHut",expecting:"expecting",tooFar:"tooFar"};if(t[i.code]){Je(D(t[i.code]),3e3),i.code==="looked"&&Q.page==="look"&&Q.back();return}if(i.code==="sexWeek"){Je(Le("sexWeek",String(e.days??7)),3500);return}if(i.code==="partners"){Je(Le("partners",i.name??""),4e3);return}if(i.code==="why"){Je(e.why??"",4e3);return}if(i.code==="replays"){os=i.list,Q.page==="past"&&Q.refresh();return}if(i.code==="replay"){e_(i.rec);return}if(i.code==="noReplay"){Je(D("pastNone"),2500);return}if(i.code==="roster"){cs=i.list??[],Q.page==="goto"&&Q.refresh();return}if(i.code==="tp"){Sn=pn=i.x??Sn,wn=mn=i.y??wn,Gn=!0,xi(),Je(Le("dTp",i.name??""),3e3);return}if(i.code==="zHit"||i.code==="zKilled"){Je(D(i.code),1800);return}let n=i;if(i.code==="aHit"){Je(Le("aHit",fn(i.item??"")),1500);return}if(i.code==="aKilled"){Je(Le("aKilled",fn(i.item??""),of(n.got)),3500);return}if(i.code==="chopped"||i.code==="mined"){Je(Le("dGot",of(n.got)),1500);return}if(i.code==="crafted"){for(let o of Object.keys(Ut))delete Ut[o];Je(Le("dCrafted",fn(i.item??"")),2500),Q.refresh();return}if(i.code==="placed"){Je(Le("dPlaced",fn(i.item??"")),2500);return}let s={noRecipe:"dNoRecipe",noMat:"dNoMat",noRoom:"dNoRoom",noItem:"dNoItem",tooThick:"dTooThick"};if(s[i.code]){Je(D(s[i.code]),2800);return}if(i.code==="wait")return;if(i.code==="full"&&i.a==="craft"){Je(D("dBagFull"),2500);return}let a={drank:"dDrank",picked:"dPicked",ate:"dAte",sleep:"dSleep",wake:"dWake",noWater:"dNoWater",nothing:"dNothing",noFood:"dNoFood",full:"dFull",talk:"dTalk",nobody:"dNobody"}[i.code];a&&Je(a==="dPicked"?Le("dPicked",d_[i.item??""]??i.item??""):D(a),2500)}var zh="";function Yr(){let i="";Et==="world"&&!Q.open&&(Qe==="play"&&dt?i=`<div class="pn">${At(Ho())}</div><div class="pbars">${dn(D("nFood"),dt.hunger)}${dn(D("nWater"),dt.thirst)}${dn(D("nRest"),dt.tired)}${dt.hp!==void 0&&dt.hp<100?dn(D("nHp"),100-dt.hp):""}</div><div class="pa">${dt.asleep?Bi(5):""}${dt.carry?(dt.asleep?" \xB7 ":"")+Le("carry",String(dt.carry)):""}</div>`:Qe==="watch"&&pt>=0&&Kt&&Kt.id===pt&&(i=bh(Kt,Bi,!1))),i!==zh&&(zh=i,Eh.innerHTML=i,Eh.hidden=!i)}function Yh(){return Qe==="watch"?pt:$h(10)}function hf(i){return D(i?"on":"off")}function v_(i){let e=wt.pad[i],t=wt.remote[i];return`${e===void 0?D("cNone"):String(MyPC.gamepad?.label?.(e)??MyPC.gamepad?.name?.(e)??e)} \xB7 ${t?Mo(t):D("cNone")}`}function y_(i){let e=[];switch(i){case"root":return e.push({id:"resume",label:D("mResume")}),Qe==="play"&&e.push({id:"me",label:D("mMe"),sub:!0},{id:"actions",label:D("mActions"),sub:!0},{id:"bag",label:D("mBag"),sub:!0},{id:"goto",label:D("mGoTo"),sub:!0}),Yh()>=0&&e.push({id:"person",label:Qe==="play"?D("mNearby"):D("mPerson"),sub:!0}),Qe==="watch"&&e.push({id:"next",label:D("mNextPerson")},{id:"map",label:D("mNextMap")}),e.push({id:"past",label:D("mPast"),sub:!0}),e.push({id:"how",label:D(Qe==="play"?"mWatch":"mPlay")}),e.push({id:"settings",label:D("mSettings"),sub:!0},{id:"controls",label:D("mControls"),sub:!0}),{id:i,title:D("mTitle"),rows:e};case"actions":for(let t of["use","drink","eat","pickup","sleep"])e.push({id:t,label:kn(t)});return{id:i,title:D("mActions"),rows:e,html:dt?`<div class="pbars">${dn(D("nFood"),dt.hunger)}${dn(D("nWater"),dt.thirst)}${dn(D("nRest"),dt.tired)}</div>`:void 0};case"past":for(let t of os??[])e.push({id:"r"+t.id,label:`${_h(t.start,D("day"))} \xB7 ${t.people.join(", ")||"\u2014"}`,value:`${t.zombies} ${D("pastZ")} \xB7 ${t.secs} s${t.deaths.length?" \xB7 \u271D "+t.deaths.join(", "):t.killed?" \xB7 "+Le("pastKilled",String(t.killed)):""}`});return os&&!os.length&&e.push({id:"back",label:D("mBack")}),{id:i,title:D("mPast"),rows:e,wide:!0,text:os?os.length?D("pastHelp"):D("pastNone"):"\u2026"};case"bag":{let t=dt?.inv??{},n=Object.entries(t).filter(([,r])=>r>0),s=(n.length?`<div class="bag">${n.map(([r,a])=>`<span class="bi"><b>${a}</b> ${At(fn(r))}</span>`).join("")}</div>`:`<p>${At(D("bagEmpty"))}</p>`)+`<p class="dim">${dt?.weapon?At(Le("cWeapon",fn(dt.weapon)))+" \xB7 ":""}${At(Le("cDefence",String(dt?.def??0)))}${dt?.carry?" \xB7 "+At(Le("carry",String(dt.carry))):""}</p>`;e.push({id:"craft",label:D("mCraft"),sub:!0},{id:"guide",label:D("mGuide"),sub:!0});for(let r of Qo)(t[r]??0)>0&&e.push({id:"pl:"+r,label:Le("cPut",fn(r)),value:String(t[r])});return{id:i,title:D("mBag"),rows:e,html:s,wide:!0}}case"craft":for(let t of pu)e.push({id:"c:"+t,label:Eo(t),sub:!0});return{id:i,title:D("mCraft"),rows:e,text:D("catHelp")};case"cat":{let t=dt?.inv??{};for(let a of jo){let o=t[a]??0;!o&&!Ut[a]||e.push({id:"r:"+a,label:us(fn(a)),value:`${Ut[a]??0} / ${o}`})}let n=el(sn,Ut),s=Object.entries(Ut).filter(([,a])=>a>0);e.push({id:"make",label:`${D("cMake")}: ${n?us(fn(n.what))+(n.n&&n.n>1?" x"+n.n:""):D("cNoRecipe")}`,dim:!n}),e.push({id:"clear",label:D("cClear")},{id:"guide",label:D("mGuide"),sub:!0});let r=`<p>${At(s.length?Le("cIn",af(Ut)):D("cNothingIn"))}</p><p class="dim">${At(D("catHelp"))}</p>`;return{id:i,title:Eo(sn),rows:e,html:r}}case"guide":{let t=dt?.inv??{};return oa.forEach((n,s)=>{if(sn&&n.cat!==sn)return;let r=Object.entries(n.need).every(([a,o])=>(t[a]??0)>=o);e.push({id:"g:"+s,label:`${sn?"":Eo(n.cat)+" \xB7 "}${us(fn(n.what))}${n.n&&n.n>1?" x"+n.n:""}`,value:`${af(n.need)}${r?" "+D("cHave"):""}`})}),{id:i,title:sn?`${D("mGuide")} \xB7 ${Eo(sn)}`:D("mGuide"),rows:e,wide:!0,text:D("guideHelp")}}case"goto":for(let[t,n,s]of cs??[])e.push({id:"p"+t,label:n,value:s});return cs&&!cs.length&&e.push({id:"back",label:D("mBack")}),{id:i,title:D("mGoTo"),rows:e,text:cs?D("mGoToHelp"):"\u2026"};case"me":{let t=Xt;if(!t)return{id:i,title:D("meTitle"),rows:[{id:"back",label:D("mBack")}],text:"\u2026"};let n=t.traits,s=`<div class="pm"><b>${At(t.name)}</b> \xB7 ${At(D(t.sex==="f"?"lookWoman":"lookMan"))} \xB7 ${At(Le("meHp",String(t.hp)))}</div><div class="pm">${Le("pLevel",String(t.level),String(t.xp))}</div><div class="bp"><i style="width:${Math.max(4,Math.min(100,(t.xp-50*t.level*t.level)/Math.max(1,50*(t.level+1)**2-50*t.level*t.level)*100))}%"></i></div>`+(t.goal?`<div class="pm">${D("pGoal")}: <b>${At(t.goal.text)}</b> \xB7 ${Math.min(t.goal.k+1,t.goal.n)}/${t.goal.n}</div><div class="bp${t.goal.from!=="myself"?" ord":""}"><i style="width:${Math.max(6,t.goal.pct)}%"></i></div>`:"")+`<div class="pm">${D("mePartner")}: <b>${At(t.partner?.name??D("meNone"))}</b></div><div class="pm">${D("meChildren")}: <b>${t.children.length?t.children.map(r=>`${At(r.name)} (${r.age})`).join(", "):At(D("meNone"))}</b></div>`+(t.expecting>=0?`<div class="pm">${At(Le("meExpecting",String(t.expecting)))}</div>`:"")+`<div class="pm dim">${At(Le("meTraits",String(n.strength??0),String(n.speed??0),String(n.intelligence??0),String(n.courage??0),String(n.empathy??0)))}</div>`+(t.goals.length?`<div class="pm dim">${D("meGoals")}: ${t.goals.map(r=>`${r.ok?"\u2713":"\u2717"} ${At(r.text)} (+${r.xp})`).join(" \xB7 ")}</div>`:"");return e.push({id:"look",label:D("lookTitle"),sub:!0},{id:"auto",label:D("autoRow"),value:hf(t.auto)},{id:"rules",label:D("myRules"),value:`${t.rules.length} / ${t.max}`,sub:!0},{id:"hut",label:D("meHut")}),{id:i,title:D("meTitle"),rows:e,html:s,wide:!0}}case"look":{e.push({id:"f",label:D("lookWoman"),value:En.sex==="f"?"\u25CF":""},{id:"m",label:D("lookMan"),value:En.sex==="m"?"\u25CF":""});for(let n=0;n<5;n++)e.push({id:"s"+n,label:`${D("lookSkin")} ${n+1}`,value:En.skin===n?"\u25CF":""});e.push({id:"save",label:D("lookSave")});let t=zo.map((n,s)=>`<span class="sw${En.skin===s?" on":""}" style="background:#${n.getHexString()}"></span>`).join("");return{id:i,title:D("lookTitle"),rows:e,html:`<p>${At(Xt&&!Xt.chose?D("lookHelp"):D("lookSexNote"))}</p><div class="sws">${t}</div>`}}case"rules":return(Xt?.rules??[]).forEach((t,n)=>e.push({id:"r"+n,label:t,value:"\u2715"})),(Xt?.rules.length??0)<(Xt?.max??5)&&e.push({id:"add",label:D("ruleAdd")}),{id:i,title:D("myRules"),rows:e,wide:!0,text:`${Le("ruleHelp",String(Xt?.max??5))} ${D("autoHelp")}`};case"person":return e.push({id:"back",label:D("mBack")}),Qe==="play"&&Kt&&Kt.id===rr&&(Xt?.partner?.id===Kt.id?e.push({id:"child",label:D("tryChild")}):Xt?.partner||e.push({id:"court",label:D("askPartner")})),Qe==="watch"&&e.push({id:"next",label:D("mNextPerson")}),{id:i,title:Kt?.name??D("mPerson"),rows:e,wide:!0,html:Kt&&Kt.id===rr?bh(Kt,Bi,!0):"\u2026"};case"settings":return qr&&e.push({id:"thoughts",label:D("sThoughts"),value:hf(Tn)}),Qe==="play"&&e.push({id:"cam",label:D("sCamera"),value:Bf(fi)}),e.push({id:"zin",label:D("aZoomIn")},{id:"zout",label:D("aZoomOut")},{id:"server",label:D("sServer"),value:On},{id:"unpair",label:D("sUnpair")}),{id:i,title:D("mSettings"),rows:e,text:qr?void 0:D("sThoughtsOnly")};case"controls":for(let t of $s)e.push({id:t,label:kn(t),value:v_(t)});return e.push({id:"reset",label:D("cReset")}),{id:i,title:D("mControls"),rows:e,text:`${D("cHelp")} ${D("cWatchNote")}`}}return{id:i,title:"",rows:e}}function __(i,e){if(i==="root")e==="resume"?Q.close():e==="actions"||e==="settings"||e==="controls"?Q.push(e):e==="past"?(os=null,je({t:Ce.Do,a:"replays"}),Q.push("past")):e==="bag"?Q.push("bag"):e==="me"?(je({t:Ce.Do,a:"mine"}),Q.push("me")):e==="goto"?(cs=null,je({t:Ce.Do,a:"roster"}),Q.push("goto")):e==="person"?(Zr(Yh(),!0),Q.push("person")):e==="next"?(Q.close(),Bh()):e==="map"?(Q.close(),kf()):e==="how"&&(Q.close(),h_(Qe==="play"?"watch":"play"));else if(i==="actions")Q.close(),Fi(e,!0);else if(i==="past")e==="back"?Q.back():(Q.close(),Je("\u2026",1500),je({t:Ce.Do,a:"replay",text:e.slice(1)}));else if(i==="bag")e==="craft"?(sn="",Q.push("craft")):e==="guide"?(sn="",Q.push("guide")):e.startsWith("pl:")&&(Q.close(),je({t:Ce.Do,a:"place",text:e.slice(3)}));else if(i==="craft"){sn=e.slice(2);for(let t of Object.keys(Ut))delete Ut[t];Q.push("cat")}else if(i==="cat"){if(e.startsWith("r:")){let t=e.slice(2),n=dt?.inv?.[t]??0;Ut[t]=(Ut[t]??0)+1>Math.min(n,4)?0:(Ut[t]??0)+1,Q.refresh()}else if(e==="clear"){for(let t of Object.keys(Ut))delete Ut[t];Q.refresh()}else if(e==="guide")Q.push("guide");else if(e==="make"){let t=Object.entries(Ut).filter(([,n])=>n>0).map(([n,s])=>`${n}=${s}`).join(",");if(!el(sn,Ut)){Je(D("dNoRecipe"),2500);return}je({t:Ce.Do,a:"craft",text:`${sn}:${t}`})}}else if(i==="guide"){let t=oa[Number(e.slice(2))];if(!t)return;for(let n of Object.keys(Ut))delete Ut[n];for(let[n,s]of Object.entries(t.need))Ut[n]=s;sn===t.cat?Q.back():(sn=t.cat,Q.push("cat"))}else if(i==="goto")e==="back"?Q.back():(Q.close(),je({t:Ce.Do,a:"tp",text:e.slice(1)}));else if(i==="me")e==="back"?Q.back():e==="look"?(En.sex=Xt?.sex??"m",En.skin=Xt?.skin??1,Q.push("look")):e==="auto"?je({t:Ce.Do,a:"auto",text:Xt?.auto?"0":"1"}):e==="rules"?Q.push("rules"):e==="hut"&&(Q.close(),je({t:Ce.Do,a:"hut"}));else if(i==="look")e==="f"||e==="m"?(En.sex=e,Q.refresh()):e==="save"?je({t:Ce.Do,a:"look",text:`${En.sex}:${En.skin}`}):e.startsWith("s")&&(En.skin=Number(e.slice(1)),Q.refresh());else if(i==="rules")if(e==="add"){if(!MyPC.text?.keyboard)return;MyPC.text.keyboard({value:"",kind:"text",label:D("ruleLabel"),ok:"OK"}).then(t=>{t&&t.trim()&&je({t:Ce.Do,a:"ruleAdd",text:t.trim().slice(0,200)})})}else e.startsWith("r")&&je({t:Ce.Do,a:"ruleDel",text:e.slice(1)});else if(i==="person")e==="back"?Q.back():e==="court"?je({t:Ce.Do,a:"court",text:String(Kt?.id??-1)}):e==="child"?je({t:Ce.Do,a:"child"}):e==="next"&&(Bh(),window.setTimeout(()=>{Zr(pt,!0),Q.refresh()},300));else if(i==="settings")e==="thoughts"?(Tn=!Tn,MyPC.save("thoughts",Tn),Tn||ds.hide(),Q.refresh()):e==="cam"?(Xh(),Q.refresh()):e==="zin"?Vo(1/1.2):e==="zout"?Vo(1.2):e==="server"?(Q.close(),qh()):e==="unpair"&&(Q.close(),u_());else if(i==="controls"){if(e==="reset"){wt=Mh(kr),MyPC.save("binds",wt),Q.refresh(),or();return}Kn=e,Je(Le("cPress",kn(Kn)),0)}}var Q=new yo(y_,__,()=>{Kn=null,Zn.hidden=!0,Yr(),MyPC.back?.(!1)}),ds=new _o(8);function mi(i="root"){if(Et==="world"){if(ft.close(),at.left=at.right=at.up=at.down=!1,sr=!1,i==="person"){let e=Yh();if(e<0){Je(D("nobody"),2e3);return}Zr(e,!0)}Q.show("root"),i!=="root"&&Q.push(i),MyPC.back?.(!0),Yr()}}function Zr(i,e=!1){i<0||(i!==rr&&(rr=i,Kt=null),(e||performance.now()-Qd>1e3)&&(Qd=performance.now(),je({t:Ce.Info,id:i})))}function Hf(i,e){let t=Kn;Kn=null;let n=i==="pad"?wt.pad:wt.remote;for(let r of $s)n[r]===e&&delete n[r];n[t]=e,MyPC.save("binds",wt);let s=i==="pad"?String(MyPC.gamepad?.label?.(e)??e):Mo(e);Je(Le("cSet",kn(t),s),2500),Q.refresh(),or()}var Go=1e3/60,tr=0,Ks=0,Lo=0,uf=0,df=0,ff=0,Gn=!0;function M_(i){if(Et==="world"){if(ot){ot.update(Go/1e3);return}ft.open&&ft.hold&&MyPC.gamepad&&ft.aim(MyPC.gamepad.axis(0),MyPC.gamepad.axis(1)),Qe==="play"?a_(Go/1e3,i):c_()}}function b_(i,e){if(Et!=="world"||!pe)return;jy();let t=Kr(),n=Jr();pe.view=ot||!fs()||!Vn?"top":fi,pe.yaw=js,pe.follow(t,n,e,Gn),Gn=!1;let s=Do+(i-Uo)/1e3*Wr*Xr;pe.setHour(((s/3600+8)%24+24)%24,i/1e3);let r=Math.min(1.25,(i-Oo)/Dh),a=pe.people,o=fs()&&Vn?hs():-1,l=i/1e3,h=pe.view==="top"?pe.dist*1.6+8:pe.sight+4,c=pe.view==="first";if(Fh++,a.begin(),pe.beginShots(),pe.beginItems(),pe.animals.begin(),ot){ot.draw(a,e,Bi),pe.dist+=(Math.max(16,Math.min(42,ot.span*1.1+10))-pe.dist)*Math.min(1,e*2),a.end(),pe.endShots(),pe.endItems(),pe.animals.end(),pe.render(),ds.hide();return}for(let u=0;u<vt;u++){if(Jt[u]===-1)continue;let d=Bo[u]+(Cn[u]-Bo[u])*r,m=ko[u]+(zn[u]-ko[u])*r;if(u===o&&(d=Sn,m=wn),Math.abs(d-t)>h||Math.abs(m-n)>h)continue;if(Dt[u]===kt.Projectile){pe.shot(d,m);continue}if(Dt[u]===kt.Item){pe.item(d,m,Fo[u],Jt[u]);continue}if(Dt[u]!==kt.Agent&&Dt[u]!==kt.Player&&Dt[u]!==kt.Threat&&Dt[u]!==kt.Animal)continue;let g=d-Ih[u],x=m-Lh[u],p=Math.hypot(g,x);Ih[u]=d,Lh[u]=m;let f=e>0?Math.min(6,p/e):0;if(Ys[u]=Ys[u]+(f-Ys[u])*Math.min(1,e*10),p>.004){let E=Math.atan2(g,x)-as[u];E=Math.atan2(Math.sin(E),Math.cos(E)),as[u]=as[u]+E*Math.min(1,e*12)}if(Vr[u]=(Vr[u]+p*4.2)%(Math.PI*2),Af[u]=d,Cf[u]=m,Rf[u]=Fh,Dt[u]===kt.Animal){pe.animals.add(Ao[u],d,m,as[u],Vr[u]*1.4,Math.min(1,Ys[u]/1.6));continue}if(c&&u===o)continue;let S=(Ch[u]&(ea.Sleeping|ea.Dead))!==0,w=Dt[u]===kt.Threat,v=u===o||Jt[u]===gi,I=w?Pf:Ao[u]>0&&(Dt[u]===kt.Player||Dt[u]===kt.Agent)?Gy(v,Ao[u]):v?If:Dt[u]===kt.Player?Lf:bf[u];a.add(d,m,as[u],Vr[u],Math.min(1,Ys[u]/(w?1.2:2.2)),I,S,Ch[u]&ea.Child?.62:1,w),Dt[u]===kt.Player&&!(u===o&&pe.view!=="top")?a.marker(d,m,l,Jt[u]===gi?ef:Vy):Jt[u]===pt&&a.marker(d,m,l,ef)}a.end(),pe.endShots(),pe.endItems(),pe.animals.end(),pe.render(),qr&&Tn&&!Q.open&&i-Ef<4e3?ds.draw(S_,w_,t,n,Bi):ds.hide()}function S_(i,e){let t=Hn.get(i);return t===void 0||Rf[t]!==Fh?!1:(e.x=Af[t],e.y=Cf[t],!0)}var w_=(i,e,t)=>!!pe&&pe.project(i,2.2,e,t);function Vf(i){tr=requestAnimationFrame(Vf),Ks||(Ks=i);let e=Math.min(.1,(i-Ks)/1e3);for(Lo+=Math.min(250,i-Ks),Ks=i;Lo>=Go;)M_(i),Lo-=Go;b_(i,e),i-uf>250&&(uf=i,xi()),i-ff>3e3&&(ff=i,je({t:Ce.Ping,c:i})),i-df>500&&Et==="world"&&(df=i,E_(i),Qe==="watch"&&pt>=0?Zr(pt):Q.open&&Q.page==="person"&&Zr(rr),Yr())}var pf="";function E_(i){let e=Do+(i-Uo)/1e3*Wr*Xr,t=Math.floor((e/3600+8)/24)+1,n=Math.floor((e/3600+8)%24),s=Math.floor(e/60%60),r=pt>=0?Hn.get(pt):void 0,a=Qe==="play"?Ho():pt>=0?`${D("following")} #${pt&65535}${r!==void 0?" \xB7 "+Bi(Fo[r]):""}`:D("free"),o=`${$r(Nt)} \xB7 ${D("day")} ${t} ${String(n).padStart(2,"0")}:${String(s).padStart(2,"0")} \xB7 ${Mf} ${D("agents")} \xB7 ${a}`;if(o!==pf&&(pf=o,vf.textContent=o),Wo&&Qe==="play"){let l=Math.max(0,Math.ceil((Sf-e)/Math.max(.01,Wr*Xr)));Zn.textContent=`${Le("travelling",$r(wf))} ${l} s`,Zn.hidden=!1}}function Hh(){let i=Math.min(1,Math.min(1920/innerWidth,1080/innerHeight,window.devicePixelRatio||1))*(nr==="low"?.6:nr==="mid"?.8:1);pe?.resize(Math.round(innerWidth*i),Math.round(innerHeight*i))}function mf(){tr||(Ks=0,Lo=0,tr=requestAnimationFrame(Vf))}function gf(){tr&&cancelAnimationFrame(tr),tr=0,at.left=at.right=at.up=at.down=!1,sr=!1,Qe==="play"&&je({t:Ce.Input,mx:0,my:0,run:!1,seq:++Xo}),Co=Ro=0}var Gf={left:1,right:1,up:1,down:1};function Wf(i,e,t){if(ot&&!Q.open){e&&(i==="left"||i==="right"?ot.seek(i==="left"?-5:5):t||ot.faster(i==="up"));return}if(Q.open){e&&(i==="up"||i==="down")&&Q.input(i);return}if(ft.open){e&&!t&&ft.step(i);return}t||(at[i]=e)}function Zh(){Et==="noserver"||Et==="offline"?qh():Et==="pairfail"&&(Ui=0,Et="connect",ar())}function T_(i,e,t){if(i in Gf){Wf(i,e,t);return}if(Kn){e&&!t&&Hf("remote",i);return}if(Et!=="world"){e&&i==="ok"&&Zh();return}if(ot&&!Q.open){e&&!t&&i==="ok"&&ot.toggle();return}if(Q.open){if(!e||t)return;i==="ok"?Q.input("ok"):rs(wt,i)==="menu"&&Q.close();return}let n=rs(wt,i);if(ft.open){if(!e||t)return;i==="ok"?qo(ft.close()):(n==="wheel"||n==="menu")&&ft.close();return}if(n==="wheel"){t||Wh(e,!1);return}n&&!t&&Fi(n,e)}function A_(i,e){if(i>=12&&i<=16)return;if(Kn){e&&Hf("pad",i);return}if(Et!=="world"){e&&i===0&&Zh();return}if(ot&&!Q.open){e&&(i===0?ot.toggle():(i===1||Or(wt,i)==="menu")&&Uf());return}if(Q.open){if(!e)return;i===0?Q.input("ok"):i===1?Q.input("back"):Or(wt,i)==="menu"&&Q.close();return}let t=Or(wt,i);if(t==="wheel"){Wh(e,!0);return}if(ft.open){if(!e)return;i===0?qo(ft.close()):(i===1||t==="menu")&&ft.close();return}t&&Fi(t,e)}MyPC.init({keys:["channel","buttons"],ownMenu:!0,onInit(i){zd(i.lang),document.documentElement.lang=i.lang,document.documentElement.dir=i.lang==="ar"?"rtl":"ltr",nr=i.quality?.tier??"mid";let e=new URLSearchParams(location.search);(e.get("tier")==="low"||e.get("tier")==="mid"||e.get("tier")==="high")&&(nr=e.get("tier"));let t=MyPC.app_config??{};pi=MyPC.load("auth",null);let n=/github\.io$/i.test(location.hostname)?"":location.origin;On=String(e.get("server")||t.server||MyPC.load("server","")||pi?.server||n),Qe=MyPC.load("how","play")==="watch"?"watch":"play",e.get("watch")!==null&&(Qe="watch");let s=MyPC.load("binds",null);if(s&&s.pad&&s.remote){wt={pad:{...s.pad},remote:{...s.remote}};for(let a of $s){let o=kr.pad[a],l=kr.remote[a];!(a in s.pad)&&o!==void 0&&Or(wt,o)===void 0&&(wt.pad[a]=o),!(a in s.remote)&&l!==void 0&&rs(wt,l)===void 0&&(wt.remote[a]=l)}}let r=MyPC.load("cam","top");fi=Po.includes(r)?r:"top",Tn=MyPC.load("thoughts",!0)!==!1,window.addEventListener("resize",Hh),Of(),MyPC.gamepad&&(MyPC.gamepad.on("pads",a=>{Zs=a.length,By=!a.length,or()}),MyPC.gamepad.on("button",(a,o)=>A_(a,o))),MyPC.buttons?.on?.((a,o,l)=>T_(a,o,!!l)),(MyPC.apiLevel??0)>=24&&MyPC.stt?.on&&MyPC.stt.on("text",g_),e.get("dev")!==null&&(window.__dev={me:()=>[Kr(),Jr(),Nt],dbg:()=>({how:Qe,meId:gi,meTransit:Wo,predOk:Vn,predX:Sn,predY:wn,camX:pn,camY:mn,s:hs(),sx:hs()>=0?Cn[hs()]:null}),look:(a,o)=>{pt=-1,pn=a,mn=o,Gn=!0}}),MyPC.ready()},onStart(){let i=Number(MyPC.load("dist",24))||24,e=Number(MyPC.load("back",7))||7;ar(),mf(),queueMicrotask(()=>{pe&&(pe.dist=i,pe.back=e)}),C_=i},onPause:gf,onResume:mf,onDestroy(){gf(),clearTimeout(Th),window.removeEventListener("resize",Hh),Zt&&(Zt.onclose=null,Zt.close(),Zt=null),pe?.dispose(),pe=null},onMenu(i){i==="game"?setTimeout(()=>mi(),50):i==="server"&&qh()},onInput(i,e,t,n){if(i in Gf){Wf(i,e,t);return}let s=!!n&&/^pad/.test(n);if(i==="cancel")return e?Kn?(Kn=null,Je(D("mControls"),800),!0):ft.open?(ft.close(),!0):Q.open?(Q.input("back"),!0):ot&&!s?(Uf(),!0):s?!0:Et!=="world"?!1:(mi(),!0):s?!0:void 0;if(!(s||i==="jump"||i==="menu"&&s)){if(i==="menu"){e&&(Q.open?Q.close():mi());return}if(!Kn){if(i==="confirm"){if(!e)return;if(Et!=="world"){Zh();return}if(Q.open){Q.input("ok");return}if(ft.open){qo(ft.close());return}if(ot){ot.toggle();return}Fi(n==="touch"?"use":rs(wt,"ok")??"use",!0);return}if(!(Et!=="world"||Q.open)){if(i==="run"){Fi("run",e);return}e&&(i==="pageUp"?Fi(rs(wt,"chUp")??"zoomIn",!0):i==="pageDown"&&Fi(rs(wt,"chDown")??"zoomOut",!0))}}}}});var C_=24;
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2024 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
