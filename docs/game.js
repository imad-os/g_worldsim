var Dt={None:0,Agent:1,Projectile:2,Item:3,Prop:4,Threat:5,Player:6,Animal:7},Mr={Alive:1,Moving:2,Sleeping:4,Transit:8,Dead:16,Child:32},Te={Hello:"hi",View:"view",Ping:"ping",Who:"who",Admin:"adm",Pair:"pair",Join:"join",Input:"in",Do:"do",Info:"info",Welcome:"wel",Error:"err",Chunk:"chk",ChunkDrop:"chx",Frame:"frm",Stats:"sts",Pong:"pong",AdminResult:"admr",PairCode:"pairc",Paired:"paired",Notice:"note",You:"you"};function Mu(i){let e=i.length,t=0,n=0;for(;n<e;){let s=i.charCodeAt(n++);if((s&4294967168)===0){t++;continue}else if((s&4294965248)===0)t+=2;else{if(s>=55296&&s<=56319&&n<e){let r=i.charCodeAt(n);(r&64512)===56320&&(++n,s=((s&1023)<<10)+(r&1023)+65536)}(s&4294901760)===0?t+=3:t+=4}}return t}function fp(i,e,t){let n=i.length,s=t,r=0;for(;r<n;){let o=i.charCodeAt(r++);if((o&4294967168)===0){e[s++]=o;continue}else if((o&4294965248)===0)e[s++]=o>>6&31|192;else{if(o>=55296&&o<=56319&&r<n){let a=i.charCodeAt(r);(a&64512)===56320&&(++r,o=((o&1023)<<10)+(a&1023)+65536)}(o&4294901760)===0?(e[s++]=o>>12&15|224,e[s++]=o>>6&63|128):(e[s++]=o>>18&7|240,e[s++]=o>>12&63|128,e[s++]=o>>6&63|128)}e[s++]=o&63|128}}var pp=new TextEncoder,mp=50;function gp(i,e,t){pp.encodeInto(i,e.subarray(t))}function Su(i,e,t){i.length>mp?gp(i,e,t):fp(i,e,t)}var xp=4096;function gl(i,e,t){let n=e,s=n+t,r=[],o="";for(;n<s;){let a=i[n++];if((a&128)===0)r.push(a);else if((a&224)===192){let l=i[n++]&63;r.push((a&31)<<6|l)}else if((a&240)===224){let l=i[n++]&63,h=i[n++]&63;r.push((a&31)<<12|l<<6|h)}else if((a&248)===240){let l=i[n++]&63,h=i[n++]&63,c=i[n++]&63,u=(a&7)<<18|l<<12|h<<6|c;u>65535&&(u-=65536,r.push(u>>>10&1023|55296),u=56320|u&1023),r.push(u)}else r.push(a);r.length>=xp&&(o+=String.fromCharCode(...r),r.length=0)}return r.length>0&&(o+=String.fromCharCode(...r)),o}var vp=new TextDecoder,yp=200;function _p(i,e,t){let n=i.subarray(e,e+t);return vp.decode(n)}function wu(i,e,t){return t>yp?_p(i,e,t):gl(i,e,t)}var Ki=class{type;data;constructor(e,t){this.type=e,this.data=t}};var cn=class i extends Error{constructor(e){super(e);let t=Object.create(i.prototype);Object.setPrototypeOf(this,t),Object.defineProperty(this,"name",{configurable:!0,enumerable:!1,value:i.name})}};function Au(i,e,t){let n=t/4294967296,s=t;i.setUint32(e,n),i.setUint32(e+4,s)}function da(i,e,t){let n=Math.floor(t/4294967296),s=t;i.setUint32(e,n),i.setUint32(e+4,s)}function fa(i,e){let t=i.getInt32(e),n=i.getUint32(e+4);return t*4294967296+n}function Tu(i,e){let t=i.getUint32(e),n=i.getUint32(e+4);return t*4294967296+n}var bp=-1,Mp=4294967296-1,Sp=17179869184-1;function wp({sec:i,nsec:e}){if(i>=0&&e>=0&&i<=Sp)if(e===0&&i<=Mp){let t=new Uint8Array(4);return new DataView(t.buffer).setUint32(0,i),t}else{let t=i/4294967296,n=i&4294967295,s=new Uint8Array(8),r=new DataView(s.buffer);return r.setUint32(0,e<<2|t&3),r.setUint32(4,n),s}else{let t=new Uint8Array(12),n=new DataView(t.buffer);return n.setUint32(0,e),da(n,4,i),t}}function Ap(i){let e=i.getTime(),t=Math.floor(e/1e3),n=(e-t*1e3)*1e6,s=Math.floor(n/1e9);return{sec:t+s,nsec:n-s*1e9}}function Tp(i){if(i instanceof Date){let e=Ap(i);return wp(e)}else return null}function Ep(i){let e=new DataView(i.buffer,i.byteOffset,i.byteLength);switch(i.byteLength){case 4:return{sec:e.getUint32(0),nsec:0};case 8:{let t=e.getUint32(0),n=e.getUint32(4),s=(t&3)*4294967296+n,r=t>>>2;return{sec:s,nsec:r}}case 12:{let t=fa(e,4),n=e.getUint32(0);return{sec:t,nsec:n}}default:throw new cn(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${i.length}`)}}function Cp(i){let e=Ep(i);return new Date(e.sec*1e3+e.nsec/1e6)}var Eu={type:bp,encode:Tp,decode:Cp};var Ts=class i{static defaultCodec=new i;__brand;builtInEncoders=[];builtInDecoders=[];encoders=[];decoders=[];constructor(){this.register(Eu)}register({type:e,encode:t,decode:n}){if(e>=0)this.encoders[e]=t,this.decoders[e]=n;else{let s=-1-e;this.builtInEncoders[s]=t,this.builtInDecoders[s]=n}}tryToEncode(e,t){for(let n=0;n<this.builtInEncoders.length;n++){let s=this.builtInEncoders[n];if(s!=null){let r=s(e,t);if(r!=null){let o=-1-n;return new Ki(o,r)}}}for(let n=0;n<this.encoders.length;n++){let s=this.encoders[n];if(s!=null){let r=s(e,t);if(r!=null){let o=n;return new Ki(o,r)}}}return e instanceof Ki?e:null}decode(e,t,n){let s=t<0?this.builtInDecoders[-1-t]:this.decoders[t];return s?s(e,t,n):new Ki(t,e)}};function Rp(i){return i instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&i instanceof SharedArrayBuffer}function Sr(i){return i instanceof Uint8Array?i:ArrayBuffer.isView(i)?new Uint8Array(i.buffer,i.byteOffset,i.byteLength):Rp(i)?new Uint8Array(i):Uint8Array.from(i)}var Pp=100,Ip=2048,wr=class i{extensionCodec;context;useBigInt64;maxDepth;initialBufferSize;sortKeys;forceFloat32;ignoreUndefined;forceIntegerToFloat;pos;view;bytes;entered=!1;constructor(e){this.extensionCodec=e?.extensionCodec??Ts.defaultCodec,this.context=e?.context,this.useBigInt64=e?.useBigInt64??!1,this.maxDepth=e?.maxDepth??Pp,this.initialBufferSize=e?.initialBufferSize??Ip,this.sortKeys=e?.sortKeys??!1,this.forceFloat32=e?.forceFloat32??!1,this.ignoreUndefined=e?.ignoreUndefined??!1,this.forceIntegerToFloat=e?.forceIntegerToFloat??!1,this.pos=0,this.view=new DataView(new ArrayBuffer(this.initialBufferSize)),this.bytes=new Uint8Array(this.view.buffer)}clone(){return new i({extensionCodec:this.extensionCodec,context:this.context,useBigInt64:this.useBigInt64,maxDepth:this.maxDepth,initialBufferSize:this.initialBufferSize,sortKeys:this.sortKeys,forceFloat32:this.forceFloat32,ignoreUndefined:this.ignoreUndefined,forceIntegerToFloat:this.forceIntegerToFloat})}reinitializeState(){this.pos=0}encodeSharedRef(e){if(this.entered)return this.clone().encodeSharedRef(e);try{return this.entered=!0,this.reinitializeState(),this.doEncode(e,1),this.bytes.subarray(0,this.pos)}finally{this.entered=!1}}encode(e){if(this.entered)return this.clone().encode(e);try{return this.entered=!0,this.reinitializeState(),this.doEncode(e,1),this.bytes.slice(0,this.pos)}finally{this.entered=!1}}doEncode(e,t){if(t>this.maxDepth)throw new Error(`Too deep objects in depth ${t}`);e==null?this.encodeNil():typeof e=="boolean"?this.encodeBoolean(e):typeof e=="number"?this.forceIntegerToFloat?this.encodeNumberAsFloat(e):this.encodeNumber(e):typeof e=="string"?this.encodeString(e):this.useBigInt64&&typeof e=="bigint"?this.encodeBigInt64(e):this.encodeObject(e,t)}ensureBufferSizeToWrite(e){let t=this.pos+e;this.view.byteLength<t&&this.resizeBuffer(t*2)}resizeBuffer(e){let t=new ArrayBuffer(e),n=new Uint8Array(t),s=new DataView(t);n.set(this.bytes),this.view=s,this.bytes=n}encodeNil(){this.writeU8(192)}encodeBoolean(e){e===!1?this.writeU8(194):this.writeU8(195)}encodeNumber(e){!this.forceIntegerToFloat&&Number.isSafeInteger(e)?e>=0?e<128?this.writeU8(e):e<256?(this.writeU8(204),this.writeU8(e)):e<65536?(this.writeU8(205),this.writeU16(e)):e<4294967296?(this.writeU8(206),this.writeU32(e)):this.useBigInt64?this.encodeNumberAsFloat(e):(this.writeU8(207),this.writeU64(e)):e>=-32?this.writeU8(224|e+32):e>=-128?(this.writeU8(208),this.writeI8(e)):e>=-32768?(this.writeU8(209),this.writeI16(e)):e>=-2147483648?(this.writeU8(210),this.writeI32(e)):this.useBigInt64?this.encodeNumberAsFloat(e):(this.writeU8(211),this.writeI64(e)):this.encodeNumberAsFloat(e)}encodeNumberAsFloat(e){this.forceFloat32?(this.writeU8(202),this.writeF32(e)):(this.writeU8(203),this.writeF64(e))}encodeBigInt64(e){e>=BigInt(0)?(this.writeU8(207),this.writeBigUint64(e)):(this.writeU8(211),this.writeBigInt64(e))}writeStringHeader(e){if(e<32)this.writeU8(160+e);else if(e<256)this.writeU8(217),this.writeU8(e);else if(e<65536)this.writeU8(218),this.writeU16(e);else if(e<4294967296)this.writeU8(219),this.writeU32(e);else throw new Error(`Too long string: ${e} bytes in UTF-8`)}encodeString(e){let n=Mu(e);this.ensureBufferSizeToWrite(5+n),this.writeStringHeader(n),Su(e,this.bytes,this.pos),this.pos+=n}encodeObject(e,t){let n=this.extensionCodec.tryToEncode(e,this.context);if(n!=null)this.encodeExtension(n);else if(Array.isArray(e))this.encodeArray(e,t);else if(ArrayBuffer.isView(e))this.encodeBinary(e);else if(typeof e=="object")this.encodeMap(e,t);else throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(e)}`)}encodeBinary(e){let t=e.byteLength;if(t<256)this.writeU8(196),this.writeU8(t);else if(t<65536)this.writeU8(197),this.writeU16(t);else if(t<4294967296)this.writeU8(198),this.writeU32(t);else throw new Error(`Too large binary: ${t}`);let n=Sr(e);this.writeU8a(n)}encodeArray(e,t){let n=e.length;if(n<16)this.writeU8(144+n);else if(n<65536)this.writeU8(220),this.writeU16(n);else if(n<4294967296)this.writeU8(221),this.writeU32(n);else throw new Error(`Too large array: ${n}`);for(let s of e)this.doEncode(s,t+1)}countWithoutUndefined(e,t){let n=0;for(let s of t)e[s]!==void 0&&n++;return n}encodeMap(e,t){let n=Object.keys(e);this.sortKeys&&n.sort();let s=this.ignoreUndefined?this.countWithoutUndefined(e,n):n.length;if(s<16)this.writeU8(128+s);else if(s<65536)this.writeU8(222),this.writeU16(s);else if(s<4294967296)this.writeU8(223),this.writeU32(s);else throw new Error(`Too large map object: ${s}`);for(let r of n){let o=e[r];this.ignoreUndefined&&o===void 0||(this.encodeString(r),this.doEncode(o,t+1))}}encodeExtension(e){if(typeof e.data=="function"){let n=e.data(this.pos+6),s=n.length;if(s>=4294967296)throw new Error(`Too large extension object: ${s}`);this.writeU8(201),this.writeU32(s),this.writeI8(e.type),this.writeU8a(n);return}let t=e.data.length;if(t===1)this.writeU8(212);else if(t===2)this.writeU8(213);else if(t===4)this.writeU8(214);else if(t===8)this.writeU8(215);else if(t===16)this.writeU8(216);else if(t<256)this.writeU8(199),this.writeU8(t);else if(t<65536)this.writeU8(200),this.writeU16(t);else if(t<4294967296)this.writeU8(201),this.writeU32(t);else throw new Error(`Too large extension object: ${t}`);this.writeI8(e.type),this.writeU8a(e.data)}writeU8(e){this.ensureBufferSizeToWrite(1),this.view.setUint8(this.pos,e),this.pos++}writeU8a(e){let t=e.length;this.ensureBufferSizeToWrite(t),this.bytes.set(e,this.pos),this.pos+=t}writeI8(e){this.ensureBufferSizeToWrite(1),this.view.setInt8(this.pos,e),this.pos++}writeU16(e){this.ensureBufferSizeToWrite(2),this.view.setUint16(this.pos,e),this.pos+=2}writeI16(e){this.ensureBufferSizeToWrite(2),this.view.setInt16(this.pos,e),this.pos+=2}writeU32(e){this.ensureBufferSizeToWrite(4),this.view.setUint32(this.pos,e),this.pos+=4}writeI32(e){this.ensureBufferSizeToWrite(4),this.view.setInt32(this.pos,e),this.pos+=4}writeF32(e){this.ensureBufferSizeToWrite(4),this.view.setFloat32(this.pos,e),this.pos+=4}writeF64(e){this.ensureBufferSizeToWrite(8),this.view.setFloat64(this.pos,e),this.pos+=8}writeU64(e){this.ensureBufferSizeToWrite(8),Au(this.view,this.pos,e),this.pos+=8}writeI64(e){this.ensureBufferSizeToWrite(8),da(this.view,this.pos,e),this.pos+=8}writeBigUint64(e){this.ensureBufferSizeToWrite(8),this.view.setBigUint64(this.pos,e),this.pos+=8}writeBigInt64(e){this.ensureBufferSizeToWrite(8),this.view.setBigInt64(this.pos,e),this.pos+=8}};function pa(i){return`${i<0?"-":""}0x${Math.abs(i).toString(16).padStart(2,"0")}`}var Lp=16,Dp=16,ma=class{hit=0;miss=0;caches;maxKeyLength;maxLengthPerKey;constructor(e=Lp,t=Dp){this.maxKeyLength=e,this.maxLengthPerKey=t,this.caches=[];for(let n=0;n<this.maxKeyLength;n++)this.caches.push([])}canBeCached(e){return e>0&&e<=this.maxKeyLength}find(e,t,n){let s=this.caches[n-1];e:for(let r of s){let o=r.bytes;for(let a=0;a<n;a++)if(o[a]!==e[t+a])continue e;return r.str}return null}store(e,t){let n=this.caches[e.length-1],s={bytes:e,str:t};n.length>=this.maxLengthPerKey?n[Math.random()*n.length|0]=s:n.push(s)}decode(e,t,n){let s=this.find(e,t,n);if(s!=null)return this.hit++,s;this.miss++;let r=gl(e,t,n),o=Uint8Array.prototype.slice.call(e,t,t+n);return this.store(o,r),r}};var xl="array",Er="map_key",Ru="map_value",Up=i=>{if(typeof i=="string"||typeof i=="number")return i;throw new cn("The type of key must be string or number but "+typeof i)},vl=class{stack=[];stackHeadPosition=-1;get length(){return this.stackHeadPosition+1}top(){return this.stack[this.stackHeadPosition]}pushArrayState(e){let t=this.getUninitializedStateFromPool();t.type=xl,t.position=0,t.size=e,t.array=new Array(e)}pushMapState(e){let t=this.getUninitializedStateFromPool();t.type=Er,t.readCount=0,t.size=e,t.map={}}getUninitializedStateFromPool(){if(this.stackHeadPosition++,this.stackHeadPosition===this.stack.length){let e={type:void 0,size:0,array:void 0,position:0,readCount:0,map:void 0,key:null};this.stack.push(e)}return this.stack[this.stackHeadPosition]}release(e){if(this.stack[this.stackHeadPosition]!==e)throw new Error("Invalid stack state. Released state is not on top of the stack.");if(e.type===xl){let n=e;n.size=0,n.array=void 0,n.position=0,n.type=void 0}if(e.type===Er||e.type===Ru){let n=e;n.size=0,n.map=void 0,n.readCount=0,n.type=void 0}this.stackHeadPosition--}reset(){this.stack.length=0,this.stackHeadPosition=-1}},Tr=-1,yl=new DataView(new ArrayBuffer(0)),Np=new Uint8Array(yl.buffer);try{yl.getInt8(0)}catch(i){if(!(i instanceof RangeError))throw new Error("This module is not supported in the current JavaScript engine because DataView does not throw RangeError on out-of-bounds access")}var Cu=new RangeError("Insufficient data"),Fp=new ma,Cr=class i{extensionCodec;context;useBigInt64;rawStrings;maxStrLength;maxBinLength;maxArrayLength;maxMapLength;maxExtLength;keyDecoder;mapKeyConverter;totalPos=0;pos=0;view=yl;bytes=Np;headByte=Tr;stack=new vl;entered=!1;constructor(e){this.extensionCodec=e?.extensionCodec??Ts.defaultCodec,this.context=e?.context,this.useBigInt64=e?.useBigInt64??!1,this.rawStrings=e?.rawStrings??!1,this.maxStrLength=e?.maxStrLength??4294967295,this.maxBinLength=e?.maxBinLength??4294967295,this.maxArrayLength=e?.maxArrayLength??4294967295,this.maxMapLength=e?.maxMapLength??4294967295,this.maxExtLength=e?.maxExtLength??4294967295,this.keyDecoder=e?.keyDecoder!==void 0?e.keyDecoder:Fp,this.mapKeyConverter=e?.mapKeyConverter??Up}clone(){return new i({extensionCodec:this.extensionCodec,context:this.context,useBigInt64:this.useBigInt64,rawStrings:this.rawStrings,maxStrLength:this.maxStrLength,maxBinLength:this.maxBinLength,maxArrayLength:this.maxArrayLength,maxMapLength:this.maxMapLength,maxExtLength:this.maxExtLength,keyDecoder:this.keyDecoder})}reinitializeState(){this.totalPos=0,this.headByte=Tr,this.stack.reset()}setBuffer(e){let t=Sr(e);this.bytes=t,this.view=new DataView(t.buffer,t.byteOffset,t.byteLength),this.pos=0}appendBuffer(e){if(this.headByte===Tr&&!this.hasRemaining(1))this.setBuffer(e);else{let t=this.bytes.subarray(this.pos),n=Sr(e),s=new Uint8Array(t.length+n.length);s.set(t),s.set(n,t.length),this.setBuffer(s)}}hasRemaining(e){return this.view.byteLength-this.pos>=e}createExtraByteError(e){let{view:t,pos:n}=this;return new RangeError(`Extra ${t.byteLength-n} of ${t.byteLength} byte(s) found at buffer[${e}]`)}decode(e){if(this.entered)return this.clone().decode(e);try{this.entered=!0,this.reinitializeState(),this.setBuffer(e);let t=this.doDecodeSync();if(this.hasRemaining(1))throw this.createExtraByteError(this.pos);return t}finally{this.entered=!1}}*decodeMulti(e){if(this.entered){yield*this.clone().decodeMulti(e);return}try{for(this.entered=!0,this.reinitializeState(),this.setBuffer(e);this.hasRemaining(1);)yield this.doDecodeSync()}finally{this.entered=!1}}async decodeAsync(e){if(this.entered)return this.clone().decodeAsync(e);try{this.entered=!0;let t=!1,n;for await(let a of e){if(t)throw this.entered=!1,this.createExtraByteError(this.totalPos);this.appendBuffer(a);try{n=this.doDecodeSync(),t=!0}catch(l){if(!(l instanceof RangeError))throw l}this.totalPos+=this.pos}if(t){if(this.hasRemaining(1))throw this.createExtraByteError(this.totalPos);return n}let{headByte:s,pos:r,totalPos:o}=this;throw new RangeError(`Insufficient data in parsing ${pa(s)} at ${o} (${r} in the current buffer)`)}finally{this.entered=!1}}decodeArrayStream(e){return this.decodeMultiAsync(e,!0)}decodeStream(e){return this.decodeMultiAsync(e,!1)}async*decodeMultiAsync(e,t){if(this.entered){yield*this.clone().decodeMultiAsync(e,t);return}try{this.entered=!0;let n=t,s=-1;for await(let r of e){if(t&&s===0)throw this.createExtraByteError(this.totalPos);this.appendBuffer(r),n&&(s=this.readArraySize(),n=!1,this.complete());try{for(;yield this.doDecodeSync(),--s!==0;);}catch(o){if(!(o instanceof RangeError))throw o}this.totalPos+=this.pos}}finally{this.entered=!1}}doDecodeSync(){e:for(;;){let e=this.readHeadByte(),t;if(e>=224)t=e-256;else if(e<192)if(e<128)t=e;else if(e<144){let s=e-128;if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e<160){let s=e-144;if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else{let s=e-160;t=this.decodeString(s,0)}else if(e===192)t=null;else if(e===194)t=!1;else if(e===195)t=!0;else if(e===202)t=this.readF32();else if(e===203)t=this.readF64();else if(e===204)t=this.readU8();else if(e===205)t=this.readU16();else if(e===206)t=this.readU32();else if(e===207)this.useBigInt64?t=this.readU64AsBigInt():t=this.readU64();else if(e===208)t=this.readI8();else if(e===209)t=this.readI16();else if(e===210)t=this.readI32();else if(e===211)this.useBigInt64?t=this.readI64AsBigInt():t=this.readI64();else if(e===217){let s=this.lookU8();t=this.decodeString(s,1)}else if(e===218){let s=this.lookU16();t=this.decodeString(s,2)}else if(e===219){let s=this.lookU32();t=this.decodeString(s,4)}else if(e===220){let s=this.readU16();if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else if(e===221){let s=this.readU32();if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else if(e===222){let s=this.readU16();if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e===223){let s=this.readU32();if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e===196){let s=this.lookU8();t=this.decodeBinary(s,1)}else if(e===197){let s=this.lookU16();t=this.decodeBinary(s,2)}else if(e===198){let s=this.lookU32();t=this.decodeBinary(s,4)}else if(e===212)t=this.decodeExtension(1,0);else if(e===213)t=this.decodeExtension(2,0);else if(e===214)t=this.decodeExtension(4,0);else if(e===215)t=this.decodeExtension(8,0);else if(e===216)t=this.decodeExtension(16,0);else if(e===199){let s=this.lookU8();t=this.decodeExtension(s,1)}else if(e===200){let s=this.lookU16();t=this.decodeExtension(s,2)}else if(e===201){let s=this.lookU32();t=this.decodeExtension(s,4)}else throw new cn(`Unrecognized type byte: ${pa(e)}`);this.complete();let n=this.stack;for(;n.length>0;){let s=n.top();if(s.type===xl)if(s.array[s.position]=t,s.position++,s.position===s.size)t=s.array,n.release(s);else continue e;else if(s.type===Er){if(t==="__proto__")throw new cn("The key __proto__ is not allowed");s.key=this.mapKeyConverter(t),s.type=Ru;continue e}else if(s.map[s.key]=t,s.readCount++,s.readCount===s.size)t=s.map,n.release(s);else{s.key=null,s.type=Er;continue e}}return t}}readHeadByte(){return this.headByte===Tr&&(this.headByte=this.readU8()),this.headByte}complete(){this.headByte=Tr}readArraySize(){let e=this.readHeadByte();switch(e){case 220:return this.readU16();case 221:return this.readU32();default:{if(e<160)return e-144;throw new cn(`Unrecognized array type byte: ${pa(e)}`)}}}pushMapState(e){if(e>this.maxMapLength)throw new cn(`Max length exceeded: map length (${e}) > maxMapLengthLength (${this.maxMapLength})`);this.stack.pushMapState(e)}pushArrayState(e){if(e>this.maxArrayLength)throw new cn(`Max length exceeded: array length (${e}) > maxArrayLength (${this.maxArrayLength})`);this.stack.pushArrayState(e)}decodeString(e,t){return!this.rawStrings||this.stateIsMapKey()?this.decodeUtf8String(e,t):this.decodeBinary(e,t)}decodeUtf8String(e,t){if(e>this.maxStrLength)throw new cn(`Max length exceeded: UTF-8 byte length (${e}) > maxStrLength (${this.maxStrLength})`);if(this.bytes.byteLength<this.pos+t+e)throw Cu;let n=this.pos+t,s;return this.stateIsMapKey()&&this.keyDecoder?.canBeCached(e)?s=this.keyDecoder.decode(this.bytes,n,e):s=wu(this.bytes,n,e),this.pos+=t+e,s}stateIsMapKey(){return this.stack.length>0?this.stack.top().type===Er:!1}decodeBinary(e,t){if(e>this.maxBinLength)throw new cn(`Max length exceeded: bin length (${e}) > maxBinLength (${this.maxBinLength})`);if(!this.hasRemaining(e+t))throw Cu;let n=this.pos+t,s=this.bytes.subarray(n,n+e);return this.pos+=t+e,s}decodeExtension(e,t){if(e>this.maxExtLength)throw new cn(`Max length exceeded: ext length (${e}) > maxExtLength (${this.maxExtLength})`);let n=this.view.getInt8(this.pos+t),s=this.decodeBinary(e,t+1);return this.extensionCodec.decode(s,n,this.context)}lookU8(){return this.view.getUint8(this.pos)}lookU16(){return this.view.getUint16(this.pos)}lookU32(){return this.view.getUint32(this.pos)}readU8(){let e=this.view.getUint8(this.pos);return this.pos++,e}readI8(){let e=this.view.getInt8(this.pos);return this.pos++,e}readU16(){let e=this.view.getUint16(this.pos);return this.pos+=2,e}readI16(){let e=this.view.getInt16(this.pos);return this.pos+=2,e}readU32(){let e=this.view.getUint32(this.pos);return this.pos+=4,e}readI32(){let e=this.view.getInt32(this.pos);return this.pos+=4,e}readU64(){let e=Tu(this.view,this.pos);return this.pos+=8,e}readI64(){let e=fa(this.view,this.pos);return this.pos+=8,e}readU64AsBigInt(){let e=this.view.getBigUint64(this.pos);return this.pos+=8,e}readI64AsBigInt(){let e=this.view.getBigInt64(this.pos);return this.pos+=8,e}readF32(){let e=this.view.getFloat32(this.pos);return this.pos+=4,e}readF64(){let e=this.view.getFloat64(this.pos);return this.pos+=8,e}};var kp=new wr({ignoreUndefined:!0}),Bp=new Cr;function ga(i){return kp.encode(i)}function Pu(i){return Bp.decode(i instanceof ArrayBuffer?new Uint8Array(i):i)}function Iu(i){return i.byteOffset%4===0?new Int32Array(i.buffer,i.byteOffset,i.byteLength>>2):new Int32Array(Op(i).buffer)}function Op(i){let e=new Uint8Array(i.byteLength);return e.set(i),e}function xa(i,e){return e<<16|i}var va=["wood","stone","scrap","ore","brick","leather","claw"],Lu=["weapon","clothing","defence","furniture"],Es=[{cat:"weapon",what:"sword",need:{wood:1,ore:1}},{cat:"weapon",what:"axe",need:{wood:1,stone:1}},{cat:"weapon",what:"spear",need:{wood:1,claw:1}},{cat:"weapon",what:"spear",need:{wood:1,scrap:1}},{cat:"weapon",what:"bow",need:{wood:2,leather:1}},{cat:"weapon",what:"arrows",need:{wood:2,stone:1},n:5},{cat:"clothing",what:"clothes",need:{leather:2}},{cat:"clothing",what:"armor",need:{leather:2,ore:1}},{cat:"clothing",what:"helmet",need:{leather:1,ore:1}},{cat:"defence",what:"palisade",need:{wood:2}},{cat:"defence",what:"spikes",need:{wood:1,claw:1}},{cat:"defence",what:"stonewall",need:{brick:2}},{cat:"furniture",what:"door",need:{wood:1,ore:1}},{cat:"furniture",what:"window",need:{wood:1,scrap:1}},{cat:"furniture",what:"bed",need:{wood:3,leather:2}},{cat:"furniture",what:"lamp",need:{scrap:1,ore:1}},{cat:"furniture",what:"campfire",need:{wood:3,stone:2}}],ya=["palisade","spikes","stonewall","door","window","bed","lamp","campfire"],Du={sword:34,spear:30,axe:22};var Uu=["rabbit","deer","boar","wolf","bear"];function _l(i,e){let t=Object.keys(e).filter(n=>(e[n]??0)>0);for(let n of Es){if(n.cat!==i)continue;let s=Object.keys(n.need);if(s.length===t.length&&s.every(r=>e[r]===n.need[r]))return n}return null}var zp=0,Nu=1,Hp=2;var yo=1,gh=2,hi=3,Oi=0,dn=1,Cn=2,ki=0,Ws=1,zr=2,Fu=3,ku=4,Vp=5,ss=100,Gp=101,Wp=102,Xp=103,qp=104,$p=200,Yp=201,Zp=202,Kp=203,Ql=204,ec=205,Jp=206,jp=207,Qp=208,em=209,tm=210,nm=211,im=212,sm=213,rm=214,tc=0,nc=1,ic=2,Ys=3,sc=4,rc=5,ac=6,oc=7,_o=0,am=1,om=2,Bi=0,lm=1,cm=2,hm=3,um=4,dm=5,fm=6,xh=7;var Od=300,Zs=301,Ks=302,lc=303,cc=304,bo=306,hc=1e3,os=1001,uc=1002,vn=1003,pm=1004;var _a=1005;var Yn=1006,bl=1007;var ls=1008;var pi=1009,zd=1010,Hd=1011,Hr=1012,vh=1013,cs=1014,Zn=1015,Xr=1016,yh=1017,_h=1018,Js=1020,Vd=35902,Gd=1021,Wd=1022,On=1023,Xd=1024,qd=1025,Xs=1026,js=1027,bh=1028,Mh=1029,$d=1030,Sh=1031;var wh=1033,Ga=33776,Wa=33777,Xa=33778,qa=33779,dc=35840,fc=35841,pc=35842,mc=35843,gc=36196,xc=37492,vc=37496,yc=37808,_c=37809,bc=37810,Mc=37811,Sc=37812,wc=37813,Ac=37814,Tc=37815,Ec=37816,Cc=37817,Rc=37818,Pc=37819,Ic=37820,Lc=37821,$a=36492,Dc=36494,Uc=36495,Yd=36283,Nc=36284,Fc=36285,kc=36286;var Ya=2300,Bc=2301,Ml=2302,Bu=2400,Ou=2401,zu=2402;var mm=3200,gm=3201;var Ah=0,xm=1,Fi="",En="srgb",nr="srgb-linear",Mo="linear",dt="srgb";var Cs=7680;var Hu=519,vm=512,ym=513,_m=514,Zd=515,bm=516,Mm=517,Sm=518,wm=519,Vu=35044,ps=35048;var Gu="300 es",di=2e3,Za=2001,zi=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let s=this._listeners[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let n=this._listeners[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},Zt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Sl=Math.PI/180,Oc=180/Math.PI;function qr(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Zt[i&255]+Zt[i>>8&255]+Zt[i>>16&255]+Zt[i>>24&255]+"-"+Zt[e&255]+Zt[e>>8&255]+"-"+Zt[e>>16&15|64]+Zt[e>>24&255]+"-"+Zt[t&63|128]+Zt[t>>8&255]+"-"+Zt[t>>16&255]+Zt[t>>24&255]+Zt[n&255]+Zt[n>>8&255]+Zt[n>>16&255]+Zt[n>>24&255]).toLowerCase()}function un(i,e,t){return Math.max(e,Math.min(t,i))}function Am(i,e){return(i%e+e)%e}function wl(i,e,t){return(1-t)*i+t*e}function Rr(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function hn(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var He=class i{constructor(e=0,t=0){i.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(un(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*s+e.x,this.y=r*s+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Le=class i{constructor(e,t,n,s,r,o,a,l,h){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,l,h)}set(e,t,n,s,r,o,a,l,h){let c=this.elements;return c[0]=e,c[1]=s,c[2]=a,c[3]=t,c[4]=r,c[5]=l,c[6]=n,c[7]=o,c[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[3],l=n[6],h=n[1],c=n[4],u=n[7],d=n[2],m=n[5],g=n[8],x=s[0],p=s[3],f=s[6],S=s[1],w=s[4],y=s[7],L=s[2],C=s[5],A=s[8];return r[0]=o*x+a*S+l*L,r[3]=o*p+a*w+l*C,r[6]=o*f+a*y+l*A,r[1]=h*x+c*S+u*L,r[4]=h*p+c*w+u*C,r[7]=h*f+c*y+u*A,r[2]=d*x+m*S+g*L,r[5]=d*p+m*w+g*C,r[8]=d*f+m*y+g*A,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],h=e[7],c=e[8];return t*o*c-t*a*h-n*r*c+n*a*l+s*r*h-s*o*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],h=e[7],c=e[8],u=c*o-a*h,d=a*l-c*r,m=h*r-o*l,g=t*u+n*d+s*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/g;return e[0]=u*x,e[1]=(s*h-c*n)*x,e[2]=(a*n-s*o)*x,e[3]=d*x,e[4]=(c*t-s*l)*x,e[5]=(s*r-a*t)*x,e[6]=m*x,e[7]=(n*l-h*t)*x,e[8]=(o*t-n*r)*x,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,o,a){let l=Math.cos(r),h=Math.sin(r);return this.set(n*l,n*h,-n*(l*o+h*a)+o+e,-s*h,s*l,-s*(-h*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Al.makeScale(e,t)),this}rotate(e){return this.premultiply(Al.makeRotation(-e)),this}translate(e,t){return this.premultiply(Al.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Al=new Le;function Kd(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Ka(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Tm(){let i=Ka("canvas");return i.style.display="block",i}var Wu={};function kr(i){i in Wu||(Wu[i]=!0,console.warn(i))}function Em(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}function Cm(i){let e=i.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function Rm(i){let e=i.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var Je={enabled:!0,workingColorSpace:nr,spaces:{},convert:function(i,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===dt&&(i.r=fi(i.r),i.g=fi(i.g),i.b=fi(i.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(i.applyMatrix3(this.spaces[e].toXYZ),i.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===dt&&(i.r=qs(i.r),i.g=qs(i.g),i.b=qs(i.b))),i},fromWorkingColorSpace:function(i,e){return this.convert(i,this.workingColorSpace,e)},toWorkingColorSpace:function(i,e){return this.convert(i,e,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Fi?Mo:this.spaces[i].transfer},getLuminanceCoefficients:function(i,e=this.workingColorSpace){return i.fromArray(this.spaces[e].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,e,t){return i.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function fi(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function qs(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Xu=[.64,.33,.3,.6,.15,.06],qu=[.2126,.7152,.0722],$u=[.3127,.329],Yu=new Le().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Zu=new Le().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Je.define({[nr]:{primaries:Xu,whitePoint:$u,transfer:Mo,toXYZ:Yu,fromXYZ:Zu,luminanceCoefficients:qu,workingColorSpaceConfig:{unpackColorSpace:En},outputColorSpaceConfig:{drawingBufferColorSpace:En}},[En]:{primaries:Xu,whitePoint:$u,transfer:dt,toXYZ:Yu,fromXYZ:Zu,luminanceCoefficients:qu,outputColorSpaceConfig:{drawingBufferColorSpace:En}}});var Rs,zc=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Rs===void 0&&(Rs=Ka("canvas")),Rs.width=e.width,Rs.height=e.height;let n=Rs.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=Rs}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Ka("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=fi(r[o]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(fi(t[n]/255)*255):t[n]=fi(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Pm=0,Ja=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Pm++}),this.uuid=qr(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Tl(s[o].image)):r.push(Tl(s[o]))}else r=Tl(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function Tl(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?zc.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Im=0,_n=class i extends zi{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=os,s=os,r=Yn,o=ls,a=On,l=pi,h=i.DEFAULT_ANISOTROPY,c=Fi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Im++}),this.uuid=qr(),this.name="",this.source=new Ja(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=h,this.format=a,this.internalFormat=null,this.type=l,this.offset=new He(0,0),this.repeat=new He(1,1),this.center=new He(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Le,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=c,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Od)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case hc:e.x=e.x-Math.floor(e.x);break;case os:e.x=e.x<0?0:1;break;case uc:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case hc:e.y=e.y-Math.floor(e.y);break;case os:e.y=e.y<0?0:1;break;case uc:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};_n.DEFAULT_IMAGE=null;_n.DEFAULT_MAPPING=Od;_n.DEFAULT_ANISOTROPY=1;var ft=class i{constructor(e=0,t=0,n=0,s=1){i.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,h=l[0],c=l[4],u=l[8],d=l[1],m=l[5],g=l[9],x=l[2],p=l[6],f=l[10];if(Math.abs(c-d)<.01&&Math.abs(u-x)<.01&&Math.abs(g-p)<.01){if(Math.abs(c+d)<.1&&Math.abs(u+x)<.1&&Math.abs(g+p)<.1&&Math.abs(h+m+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let w=(h+1)/2,y=(m+1)/2,L=(f+1)/2,C=(c+d)/4,A=(u+x)/4,E=(g+p)/4;return w>y&&w>L?w<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(w),s=C/n,r=A/n):y>L?y<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(y),n=C/s,r=E/s):L<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(L),n=A/r,s=E/r),this.set(n,s,r,t),this}let S=Math.sqrt((p-g)*(p-g)+(u-x)*(u-x)+(d-c)*(d-c));return Math.abs(S)<.001&&(S=1),this.x=(p-g)/S,this.y=(u-x)/S,this.z=(d-c)/S,this.w=Math.acos((h+m+f-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Hc=class extends zi{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new ft(0,0,e,t),this.scissorTest=!1,this.viewport=new ft(0,0,e,t);let s={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Yn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new _n(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,s=e.textures.length;n<s;n++)this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new Ja(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},mi=class extends Hc{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},ja=class extends _n{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=vn,this.minFilter=vn,this.wrapR=os,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Vc=class extends _n{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=vn,this.minFilter=vn,this.wrapR=os,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var jt=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,o,a){let l=n[s+0],h=n[s+1],c=n[s+2],u=n[s+3],d=r[o+0],m=r[o+1],g=r[o+2],x=r[o+3];if(a===0){e[t+0]=l,e[t+1]=h,e[t+2]=c,e[t+3]=u;return}if(a===1){e[t+0]=d,e[t+1]=m,e[t+2]=g,e[t+3]=x;return}if(u!==x||l!==d||h!==m||c!==g){let p=1-a,f=l*d+h*m+c*g+u*x,S=f>=0?1:-1,w=1-f*f;if(w>Number.EPSILON){let L=Math.sqrt(w),C=Math.atan2(L,f*S);p=Math.sin(p*C)/L,a=Math.sin(a*C)/L}let y=a*S;if(l=l*p+d*y,h=h*p+m*y,c=c*p+g*y,u=u*p+x*y,p===1-a){let L=1/Math.sqrt(l*l+h*h+c*c+u*u);l*=L,h*=L,c*=L,u*=L}}e[t]=l,e[t+1]=h,e[t+2]=c,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,s,r,o){let a=n[s],l=n[s+1],h=n[s+2],c=n[s+3],u=r[o],d=r[o+1],m=r[o+2],g=r[o+3];return e[t]=a*g+c*u+l*m-h*d,e[t+1]=l*g+c*d+h*u-a*m,e[t+2]=h*g+c*m+a*d-l*u,e[t+3]=c*g-a*u-l*d-h*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,h=a(n/2),c=a(s/2),u=a(r/2),d=l(n/2),m=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=d*c*u+h*m*g,this._y=h*m*u-d*c*g,this._z=h*c*g+d*m*u,this._w=h*c*u-d*m*g;break;case"YXZ":this._x=d*c*u+h*m*g,this._y=h*m*u-d*c*g,this._z=h*c*g-d*m*u,this._w=h*c*u+d*m*g;break;case"ZXY":this._x=d*c*u-h*m*g,this._y=h*m*u+d*c*g,this._z=h*c*g+d*m*u,this._w=h*c*u-d*m*g;break;case"ZYX":this._x=d*c*u-h*m*g,this._y=h*m*u+d*c*g,this._z=h*c*g-d*m*u,this._w=h*c*u+d*m*g;break;case"YZX":this._x=d*c*u+h*m*g,this._y=h*m*u+d*c*g,this._z=h*c*g-d*m*u,this._w=h*c*u-d*m*g;break;case"XZY":this._x=d*c*u-h*m*g,this._y=h*m*u-d*c*g,this._z=h*c*g+d*m*u,this._w=h*c*u+d*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],o=t[1],a=t[5],l=t[9],h=t[2],c=t[6],u=t[10],d=n+a+u;if(d>0){let m=.5/Math.sqrt(d+1);this._w=.25/m,this._x=(c-l)*m,this._y=(r-h)*m,this._z=(o-s)*m}else if(n>a&&n>u){let m=2*Math.sqrt(1+n-a-u);this._w=(c-l)/m,this._x=.25*m,this._y=(s+o)/m,this._z=(r+h)/m}else if(a>u){let m=2*Math.sqrt(1+a-n-u);this._w=(r-h)/m,this._x=(s+o)/m,this._y=.25*m,this._z=(l+c)/m}else{let m=2*Math.sqrt(1+u-n-a);this._w=(o-s)/m,this._x=(r+h)/m,this._y=(l+c)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(un(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,o=e._w,a=t._x,l=t._y,h=t._z,c=t._w;return this._x=n*c+o*a+s*h-r*l,this._y=s*c+o*l+r*a-n*h,this._z=r*c+o*h+n*l-s*a,this._w=o*c-n*a-s*l-r*h,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,s=this._y,r=this._z,o=this._w,a=o*e._w+n*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let m=1-t;return this._w=m*o+t*this._w,this._x=m*n+t*this._x,this._y=m*s+t*this._y,this._z=m*r+t*this._z,this.normalize(),this}let h=Math.sqrt(l),c=Math.atan2(h,a),u=Math.sin((1-t)*c)/h,d=Math.sin(t*c)/h;return this._w=o*u+this._w*d,this._x=n*u+this._x*d,this._y=s*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},D=class i{constructor(e=0,t=0,n=0){i.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Ku.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Ku.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,o=e.y,a=e.z,l=e.w,h=2*(o*s-a*n),c=2*(a*t-r*s),u=2*(r*n-o*t);return this.x=t+l*h+o*u-a*c,this.y=n+l*c+a*h-r*u,this.z=s+l*u+r*c-o*h,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return El.copy(this).projectOnVector(e),this.sub(El)}reflect(e){return this.sub(El.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(un(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},El=new D,Ku=new jt,gi=class{constructor(e=new D(1/0,1/0,1/0),t=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Fn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Fn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Fn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,Fn):Fn.fromBufferAttribute(r,o),Fn.applyMatrix4(e.matrixWorld),this.expandByPoint(Fn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ba.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ba.copy(n.boundingBox)),ba.applyMatrix4(e.matrixWorld),this.union(ba)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Fn),Fn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Pr),Ma.subVectors(this.max,Pr),Ps.subVectors(e.a,Pr),Is.subVectors(e.b,Pr),Ls.subVectors(e.c,Pr),Pi.subVectors(Is,Ps),Ii.subVectors(Ls,Is),Ji.subVectors(Ps,Ls);let t=[0,-Pi.z,Pi.y,0,-Ii.z,Ii.y,0,-Ji.z,Ji.y,Pi.z,0,-Pi.x,Ii.z,0,-Ii.x,Ji.z,0,-Ji.x,-Pi.y,Pi.x,0,-Ii.y,Ii.x,0,-Ji.y,Ji.x,0];return!Cl(t,Ps,Is,Ls,Ma)||(t=[1,0,0,0,1,0,0,0,1],!Cl(t,Ps,Is,Ls,Ma))?!1:(Sa.crossVectors(Pi,Ii),t=[Sa.x,Sa.y,Sa.z],Cl(t,Ps,Is,Ls,Ma))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Fn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Fn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ri[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ri[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ri[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ri[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ri[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ri[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ri[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ri[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ri),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},ri=[new D,new D,new D,new D,new D,new D,new D,new D],Fn=new D,ba=new gi,Ps=new D,Is=new D,Ls=new D,Pi=new D,Ii=new D,Ji=new D,Pr=new D,Ma=new D,Sa=new D,ji=new D;function Cl(i,e,t,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){ji.fromArray(i,r);let a=s.x*Math.abs(ji.x)+s.y*Math.abs(ji.y)+s.z*Math.abs(ji.z),l=e.dot(ji),h=t.dot(ji),c=n.dot(ji);if(Math.max(-Math.max(l,h,c),Math.min(l,h,c))>a)return!1}return!0}var Lm=new gi,Ir=new D,Rl=new D,hs=class{constructor(e=new D,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Lm.setFromPoints(e).getCenter(n);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Ir.subVectors(e,this.center);let t=Ir.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(Ir,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Rl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Ir.copy(e.center).add(Rl)),this.expandByPoint(Ir.copy(e.center).sub(Rl))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},ai=new D,Pl=new D,wa=new D,Li=new D,Il=new D,Aa=new D,Ll=new D,Gc=class{constructor(e=new D,t=new D(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ai)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=ai.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ai.copy(this.origin).addScaledVector(this.direction,t),ai.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Pl.copy(e).add(t).multiplyScalar(.5),wa.copy(t).sub(e).normalize(),Li.copy(this.origin).sub(Pl);let r=e.distanceTo(t)*.5,o=-this.direction.dot(wa),a=Li.dot(this.direction),l=-Li.dot(wa),h=Li.lengthSq(),c=Math.abs(1-o*o),u,d,m,g;if(c>0)if(u=o*l-a,d=o*a-l,g=r*c,u>=0)if(d>=-g)if(d<=g){let x=1/c;u*=x,d*=x,m=u*(u+o*d+2*a)+d*(o*u+d+2*l)+h}else d=r,u=Math.max(0,-(o*d+a)),m=-u*u+d*(d+2*l)+h;else d=-r,u=Math.max(0,-(o*d+a)),m=-u*u+d*(d+2*l)+h;else d<=-g?(u=Math.max(0,-(-o*r+a)),d=u>0?-r:Math.min(Math.max(-r,-l),r),m=-u*u+d*(d+2*l)+h):d<=g?(u=0,d=Math.min(Math.max(-r,-l),r),m=d*(d+2*l)+h):(u=Math.max(0,-(o*r+a)),d=u>0?r:Math.min(Math.max(-r,-l),r),m=-u*u+d*(d+2*l)+h);else d=o>0?-r:r,u=Math.max(0,-(o*d+a)),m=-u*u+d*(d+2*l)+h;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(Pl).addScaledVector(wa,d),m}intersectSphere(e,t){ai.subVectors(e.center,this.origin);let n=ai.dot(this.direction),s=ai.dot(ai)-n*n,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,o,a,l,h=1/this.direction.x,c=1/this.direction.y,u=1/this.direction.z,d=this.origin;return h>=0?(n=(e.min.x-d.x)*h,s=(e.max.x-d.x)*h):(n=(e.max.x-d.x)*h,s=(e.min.x-d.x)*h),c>=0?(r=(e.min.y-d.y)*c,o=(e.max.y-d.y)*c):(r=(e.max.y-d.y)*c,o=(e.min.y-d.y)*c),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(a=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,ai)!==null}intersectTriangle(e,t,n,s,r){Il.subVectors(t,e),Aa.subVectors(n,e),Ll.crossVectors(Il,Aa);let o=this.direction.dot(Ll),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Li.subVectors(this.origin,e);let l=a*this.direction.dot(Aa.crossVectors(Li,Aa));if(l<0)return null;let h=a*this.direction.dot(Il.cross(Li));if(h<0||l+h>o)return null;let c=-a*Li.dot(Ll);return c<0?null:this.at(c/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ve=class i{constructor(e,t,n,s,r,o,a,l,h,c,u,d,m,g,x,p){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,l,h,c,u,d,m,g,x,p)}set(e,t,n,s,r,o,a,l,h,c,u,d,m,g,x,p){let f=this.elements;return f[0]=e,f[4]=t,f[8]=n,f[12]=s,f[1]=r,f[5]=o,f[9]=a,f[13]=l,f[2]=h,f[6]=c,f[10]=u,f[14]=d,f[3]=m,f[7]=g,f[11]=x,f[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,s=1/Ds.setFromMatrixColumn(e,0).length(),r=1/Ds.setFromMatrixColumn(e,1).length(),o=1/Ds.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),h=Math.sin(s),c=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=o*c,m=o*u,g=a*c,x=a*u;t[0]=l*c,t[4]=-l*u,t[8]=h,t[1]=m+g*h,t[5]=d-x*h,t[9]=-a*l,t[2]=x-d*h,t[6]=g+m*h,t[10]=o*l}else if(e.order==="YXZ"){let d=l*c,m=l*u,g=h*c,x=h*u;t[0]=d+x*a,t[4]=g*a-m,t[8]=o*h,t[1]=o*u,t[5]=o*c,t[9]=-a,t[2]=m*a-g,t[6]=x+d*a,t[10]=o*l}else if(e.order==="ZXY"){let d=l*c,m=l*u,g=h*c,x=h*u;t[0]=d-x*a,t[4]=-o*u,t[8]=g+m*a,t[1]=m+g*a,t[5]=o*c,t[9]=x-d*a,t[2]=-o*h,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){let d=o*c,m=o*u,g=a*c,x=a*u;t[0]=l*c,t[4]=g*h-m,t[8]=d*h+x,t[1]=l*u,t[5]=x*h+d,t[9]=m*h-g,t[2]=-h,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){let d=o*l,m=o*h,g=a*l,x=a*h;t[0]=l*c,t[4]=x-d*u,t[8]=g*u+m,t[1]=u,t[5]=o*c,t[9]=-a*c,t[2]=-h*c,t[6]=m*u+g,t[10]=d-x*u}else if(e.order==="XZY"){let d=o*l,m=o*h,g=a*l,x=a*h;t[0]=l*c,t[4]=-u,t[8]=h*c,t[1]=d*u+x,t[5]=o*c,t[9]=m*u-g,t[2]=g*u-m,t[6]=a*c,t[10]=x*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Dm,e,Um)}lookAt(e,t,n){let s=this.elements;return gn.subVectors(e,t),gn.lengthSq()===0&&(gn.z=1),gn.normalize(),Di.crossVectors(n,gn),Di.lengthSq()===0&&(Math.abs(n.z)===1?gn.x+=1e-4:gn.z+=1e-4,gn.normalize(),Di.crossVectors(n,gn)),Di.normalize(),Ta.crossVectors(gn,Di),s[0]=Di.x,s[4]=Ta.x,s[8]=gn.x,s[1]=Di.y,s[5]=Ta.y,s[9]=gn.y,s[2]=Di.z,s[6]=Ta.z,s[10]=gn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[4],l=n[8],h=n[12],c=n[1],u=n[5],d=n[9],m=n[13],g=n[2],x=n[6],p=n[10],f=n[14],S=n[3],w=n[7],y=n[11],L=n[15],C=s[0],A=s[4],E=s[8],v=s[12],_=s[1],I=s[5],H=s[9],R=s[13],O=s[2],z=s[6],B=s[10],Z=s[14],G=s[3],se=s[7],ee=s[11],fe=s[15];return r[0]=o*C+a*_+l*O+h*G,r[4]=o*A+a*I+l*z+h*se,r[8]=o*E+a*H+l*B+h*ee,r[12]=o*v+a*R+l*Z+h*fe,r[1]=c*C+u*_+d*O+m*G,r[5]=c*A+u*I+d*z+m*se,r[9]=c*E+u*H+d*B+m*ee,r[13]=c*v+u*R+d*Z+m*fe,r[2]=g*C+x*_+p*O+f*G,r[6]=g*A+x*I+p*z+f*se,r[10]=g*E+x*H+p*B+f*ee,r[14]=g*v+x*R+p*Z+f*fe,r[3]=S*C+w*_+y*O+L*G,r[7]=S*A+w*I+y*z+L*se,r[11]=S*E+w*H+y*B+L*ee,r[15]=S*v+w*R+y*Z+L*fe,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],o=e[1],a=e[5],l=e[9],h=e[13],c=e[2],u=e[6],d=e[10],m=e[14],g=e[3],x=e[7],p=e[11],f=e[15];return g*(+r*l*u-s*h*u-r*a*d+n*h*d+s*a*m-n*l*m)+x*(+t*l*m-t*h*d+r*o*d-s*o*m+s*h*c-r*l*c)+p*(+t*h*u-t*a*m-r*o*u+n*o*m+r*a*c-n*h*c)+f*(-s*a*c-t*l*u+t*a*d+s*o*u-n*o*d+n*l*c)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],h=e[7],c=e[8],u=e[9],d=e[10],m=e[11],g=e[12],x=e[13],p=e[14],f=e[15],S=u*p*h-x*d*h+x*l*m-a*p*m-u*l*f+a*d*f,w=g*d*h-c*p*h-g*l*m+o*p*m+c*l*f-o*d*f,y=c*x*h-g*u*h+g*a*m-o*x*m-c*a*f+o*u*f,L=g*u*l-c*x*l-g*a*d+o*x*d+c*a*p-o*u*p,C=t*S+n*w+s*y+r*L;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/C;return e[0]=S*A,e[1]=(x*d*r-u*p*r-x*s*m+n*p*m+u*s*f-n*d*f)*A,e[2]=(a*p*r-x*l*r+x*s*h-n*p*h-a*s*f+n*l*f)*A,e[3]=(u*l*r-a*d*r-u*s*h+n*d*h+a*s*m-n*l*m)*A,e[4]=w*A,e[5]=(c*p*r-g*d*r+g*s*m-t*p*m-c*s*f+t*d*f)*A,e[6]=(g*l*r-o*p*r-g*s*h+t*p*h+o*s*f-t*l*f)*A,e[7]=(o*d*r-c*l*r+c*s*h-t*d*h-o*s*m+t*l*m)*A,e[8]=y*A,e[9]=(g*u*r-c*x*r-g*n*m+t*x*m+c*n*f-t*u*f)*A,e[10]=(o*x*r-g*a*r+g*n*h-t*x*h-o*n*f+t*a*f)*A,e[11]=(c*a*r-o*u*r-c*n*h+t*u*h+o*n*m-t*a*m)*A,e[12]=L*A,e[13]=(c*x*s-g*u*s+g*n*d-t*x*d-c*n*p+t*u*p)*A,e[14]=(g*a*s-o*x*s-g*n*l+t*x*l+o*n*p-t*a*p)*A,e[15]=(o*u*s-c*a*s+c*n*l-t*u*l-o*n*d+t*a*d)*A,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,o=e.x,a=e.y,l=e.z,h=r*o,c=r*a;return this.set(h*o+n,h*a-s*l,h*l+s*a,0,h*a+s*l,c*a+n,c*l-s*o,0,h*l-s*a,c*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,o){return this.set(1,n,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,h=r+r,c=o+o,u=a+a,d=r*h,m=r*c,g=r*u,x=o*c,p=o*u,f=a*u,S=l*h,w=l*c,y=l*u,L=n.x,C=n.y,A=n.z;return s[0]=(1-(x+f))*L,s[1]=(m+y)*L,s[2]=(g-w)*L,s[3]=0,s[4]=(m-y)*C,s[5]=(1-(d+f))*C,s[6]=(p+S)*C,s[7]=0,s[8]=(g+w)*A,s[9]=(p-S)*A,s[10]=(1-(d+x))*A,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements,r=Ds.set(s[0],s[1],s[2]).length(),o=Ds.set(s[4],s[5],s[6]).length(),a=Ds.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],kn.copy(this);let h=1/r,c=1/o,u=1/a;return kn.elements[0]*=h,kn.elements[1]*=h,kn.elements[2]*=h,kn.elements[4]*=c,kn.elements[5]*=c,kn.elements[6]*=c,kn.elements[8]*=u,kn.elements[9]*=u,kn.elements[10]*=u,t.setFromRotationMatrix(kn),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,s,r,o,a=di){let l=this.elements,h=2*r/(t-e),c=2*r/(n-s),u=(t+e)/(t-e),d=(n+s)/(n-s),m,g;if(a===di)m=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===Za)m=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=c,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,r,o,a=di){let l=this.elements,h=1/(t-e),c=1/(n-s),u=1/(o-r),d=(t+e)*h,m=(n+s)*c,g,x;if(a===di)g=(o+r)*u,x=-2*u;else if(a===Za)g=r*u,x=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*h,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*c,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=x,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Ds=new D,kn=new Ve,Dm=new D(0,0,0),Um=new D(1,1,1),Di=new D,Ta=new D,gn=new D,Ju=new Ve,ju=new jt,Ut=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],l=s[1],h=s[5],c=s[9],u=s[2],d=s[6],m=s[10];switch(t){case"XYZ":this._y=Math.asin(un(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-c,m),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,h),this._z=0);break;case"YXZ":this._x=Math.asin(-un(c,-1,1)),Math.abs(c)<.9999999?(this._y=Math.atan2(a,m),this._z=Math.atan2(l,h)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(un(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,m),this._z=Math.atan2(-o,h)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-un(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,h));break;case"YZX":this._z=Math.asin(un(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-c,h),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,m));break;case"XZY":this._z=Math.asin(-un(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,h),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-c,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Ju.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Ju,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return ju.setFromEuler(this),this.setFromQuaternion(ju,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Ut.DEFAULT_ORDER="XYZ";var Qa=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Nm=0,Qu=new D,Us=new jt,oi=new Ve,Ea=new D,Lr=new D,Fm=new D,km=new jt,ed=new D(1,0,0),td=new D(0,1,0),nd=new D(0,0,1),id={type:"added"},Bm={type:"removed"},Ns={type:"childadded",child:null},Dl={type:"childremoved",child:null},nn=class i extends zi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Nm++}),this.uuid=qr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new D,t=new Ut,n=new jt,s=new D(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Ve},normalMatrix:{value:new Le}}),this.matrix=new Ve,this.matrixWorld=new Ve,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Qa,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Us.setFromAxisAngle(e,t),this.quaternion.multiply(Us),this}rotateOnWorldAxis(e,t){return Us.setFromAxisAngle(e,t),this.quaternion.premultiply(Us),this}rotateX(e){return this.rotateOnAxis(ed,e)}rotateY(e){return this.rotateOnAxis(td,e)}rotateZ(e){return this.rotateOnAxis(nd,e)}translateOnAxis(e,t){return Qu.copy(e).applyQuaternion(this.quaternion),this.position.add(Qu.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(ed,e)}translateY(e){return this.translateOnAxis(td,e)}translateZ(e){return this.translateOnAxis(nd,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(oi.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ea.copy(e):Ea.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Lr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?oi.lookAt(Lr,Ea,this.up):oi.lookAt(Ea,Lr,this.up),this.quaternion.setFromRotationMatrix(oi),s&&(oi.extractRotation(s.matrixWorld),Us.setFromRotationMatrix(oi),this.quaternion.premultiply(Us.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(id),Ns.child=e,this.dispatchEvent(Ns),Ns.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Bm),Dl.child=e,this.dispatchEvent(Dl),Dl.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),oi.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),oi.multiply(e.parent.matrixWorld)),e.applyMatrix4(oi),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(id),Ns.child=e,this.dispatchEvent(Ns),Ns.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Lr,e,Fm),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Lr,km,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let h=0,c=l.length;h<c;h++){let u=l[h];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,h=this.material.length;l<h;l++)a.push(r(e.materials,this.material[l]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(e.animations,l))}}if(t){let a=o(e.geometries),l=o(e.materials),h=o(e.textures),c=o(e.images),u=o(e.shapes),d=o(e.skeletons),m=o(e.animations),g=o(e.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),h.length>0&&(n.textures=h),c.length>0&&(n.images=c),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){let l=[];for(let h in a){let c=a[h];delete c.metadata,l.push(c)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}};nn.DEFAULT_UP=new D(0,1,0);nn.DEFAULT_MATRIX_AUTO_UPDATE=!0;nn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Bn=new D,li=new D,Ul=new D,ci=new D,Fs=new D,ks=new D,sd=new D,Nl=new D,Fl=new D,kl=new D,Bl=new ft,Ol=new ft,zl=new ft,rs=class i{constructor(e=new D,t=new D,n=new D){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),Bn.subVectors(e,t),s.cross(Bn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){Bn.subVectors(s,t),li.subVectors(n,t),Ul.subVectors(e,t);let o=Bn.dot(Bn),a=Bn.dot(li),l=Bn.dot(Ul),h=li.dot(li),c=li.dot(Ul),u=o*h-a*a;if(u===0)return r.set(0,0,0),null;let d=1/u,m=(h*l-a*c)*d,g=(o*c-a*l)*d;return r.set(1-m-g,g,m)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,ci)===null?!1:ci.x>=0&&ci.y>=0&&ci.x+ci.y<=1}static getInterpolation(e,t,n,s,r,o,a,l){return this.getBarycoord(e,t,n,s,ci)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,ci.x),l.addScaledVector(o,ci.y),l.addScaledVector(a,ci.z),l)}static getInterpolatedAttribute(e,t,n,s,r,o){return Bl.setScalar(0),Ol.setScalar(0),zl.setScalar(0),Bl.fromBufferAttribute(e,t),Ol.fromBufferAttribute(e,n),zl.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(Bl,r.x),o.addScaledVector(Ol,r.y),o.addScaledVector(zl,r.z),o}static isFrontFacing(e,t,n,s){return Bn.subVectors(n,t),li.subVectors(e,t),Bn.cross(li).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Bn.subVectors(this.c,this.b),li.subVectors(this.a,this.b),Bn.cross(li).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,o,a;Fs.subVectors(s,n),ks.subVectors(r,n),Nl.subVectors(e,n);let l=Fs.dot(Nl),h=ks.dot(Nl);if(l<=0&&h<=0)return t.copy(n);Fl.subVectors(e,s);let c=Fs.dot(Fl),u=ks.dot(Fl);if(c>=0&&u<=c)return t.copy(s);let d=l*u-c*h;if(d<=0&&l>=0&&c<=0)return o=l/(l-c),t.copy(n).addScaledVector(Fs,o);kl.subVectors(e,r);let m=Fs.dot(kl),g=ks.dot(kl);if(g>=0&&m<=g)return t.copy(r);let x=m*h-l*g;if(x<=0&&h>=0&&g<=0)return a=h/(h-g),t.copy(n).addScaledVector(ks,a);let p=c*g-m*u;if(p<=0&&u-c>=0&&m-g>=0)return sd.subVectors(r,s),a=(u-c)/(u-c+(m-g)),t.copy(s).addScaledVector(sd,a);let f=1/(p+x+d);return o=x*f,a=d*f,t.copy(n).addScaledVector(Fs,o).addScaledVector(ks,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Jd={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ui={h:0,s:0,l:0},Ca={h:0,s:0,l:0};function Hl(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var xe=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=En){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Je.toWorkingColorSpace(this,t),this}setRGB(e,t,n,s=Je.workingColorSpace){return this.r=e,this.g=t,this.b=n,Je.toWorkingColorSpace(this,s),this}setHSL(e,t,n,s=Je.workingColorSpace){if(e=Am(e,1),t=un(t,0,1),n=un(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=Hl(o,r,e+1/3),this.g=Hl(o,r,e),this.b=Hl(o,r,e-1/3)}return Je.toWorkingColorSpace(this,s),this}setStyle(e,t=En){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=En){let n=Jd[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=fi(e.r),this.g=fi(e.g),this.b=fi(e.b),this}copyLinearToSRGB(e){return this.r=qs(e.r),this.g=qs(e.g),this.b=qs(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=En){return Je.fromWorkingColorSpace(Kt.copy(this),e),Math.round(un(Kt.r*255,0,255))*65536+Math.round(un(Kt.g*255,0,255))*256+Math.round(un(Kt.b*255,0,255))}getHexString(e=En){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Je.workingColorSpace){Je.fromWorkingColorSpace(Kt.copy(this),t);let n=Kt.r,s=Kt.g,r=Kt.b,o=Math.max(n,s,r),a=Math.min(n,s,r),l,h,c=(a+o)/2;if(a===o)l=0,h=0;else{let u=o-a;switch(h=c<=.5?u/(o+a):u/(2-o-a),o){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return e.h=l,e.s=h,e.l=c,e}getRGB(e,t=Je.workingColorSpace){return Je.fromWorkingColorSpace(Kt.copy(this),t),e.r=Kt.r,e.g=Kt.g,e.b=Kt.b,e}getStyle(e=En){Je.fromWorkingColorSpace(Kt.copy(this),e);let t=Kt.r,n=Kt.g,s=Kt.b;return e!==En?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(Ui),this.setHSL(Ui.h+e,Ui.s+t,Ui.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Ui),e.getHSL(Ca);let n=wl(Ui.h,Ca.h,t),s=wl(Ui.s,Ca.s,t),r=wl(Ui.l,Ca.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Kt=new xe;xe.NAMES=Jd;var Om=0,Hi=class extends zi{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Om++}),this.uuid=qr(),this.name="",this.blending=Ws,this.side=Oi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ql,this.blendDst=ec,this.blendEquation=ss,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new xe(0,0,0),this.blendAlpha=0,this.depthFunc=Ys,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Hu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Cs,this.stencilZFail=Cs,this.stencilZPass=Cs,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Ws&&(n.blending=this.blending),this.side!==Oi&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Ql&&(n.blendSrc=this.blendSrc),this.blendDst!==ec&&(n.blendDst=this.blendDst),this.blendEquation!==ss&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ys&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Hu&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Cs&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Cs&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Cs&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},sn=class extends Hi{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new xe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ut,this.combine=_o,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var It=new D,Ra=new He,yn=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Vu,this.updateRanges=[],this.gpuType=Zn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Ra.fromBufferAttribute(this,t),Ra.applyMatrix3(e),this.setXY(t,Ra.x,Ra.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyMatrix3(e),this.setXYZ(t,It.x,It.y,It.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyMatrix4(e),this.setXYZ(t,It.x,It.y,It.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyNormalMatrix(e),this.setXYZ(t,It.x,It.y,It.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.transformDirection(e),this.setXYZ(t,It.x,It.y,It.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Rr(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=hn(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Rr(t,this.array)),t}setX(e,t){return this.normalized&&(t=hn(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Rr(t,this.array)),t}setY(e,t){return this.normalized&&(t=hn(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Rr(t,this.array)),t}setZ(e,t){return this.normalized&&(t=hn(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Rr(t,this.array)),t}setW(e,t){return this.normalized&&(t=hn(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=hn(t,this.array),n=hn(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=hn(t,this.array),n=hn(n,this.array),s=hn(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=hn(t,this.array),n=hn(n,this.array),s=hn(s,this.array),r=hn(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Vu&&(e.usage=this.usage),e}};var Qs=class extends yn{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var eo=class extends yn{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var it=class extends yn{constructor(e,t,n){super(new Float32Array(e),t,n)}},zm=0,Tn=new Ve,Vl=new nn,Bs=new D,xn=new gi,Dr=new gi,Ht=new D,rn=class i extends zi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:zm++}),this.uuid=qr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Kd(e)?eo:Qs)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Le().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Tn.makeRotationFromQuaternion(e),this.applyMatrix4(Tn),this}rotateX(e){return Tn.makeRotationX(e),this.applyMatrix4(Tn),this}rotateY(e){return Tn.makeRotationY(e),this.applyMatrix4(Tn),this}rotateZ(e){return Tn.makeRotationZ(e),this.applyMatrix4(Tn),this}translate(e,t,n){return Tn.makeTranslation(e,t,n),this.applyMatrix4(Tn),this}scale(e,t,n){return Tn.makeScale(e,t,n),this.applyMatrix4(Tn),this}lookAt(e){return Vl.lookAt(e),Vl.updateMatrix(),this.applyMatrix4(Vl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Bs).negate(),this.translate(Bs.x,Bs.y,Bs.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new it(n,3))}else{for(let n=0,s=t.count;n<s;n++){let r=e[n];t.setXYZ(n,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new gi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];xn.setFromBufferAttribute(r),this.morphTargetsRelative?(Ht.addVectors(this.boundingBox.min,xn.min),this.boundingBox.expandByPoint(Ht),Ht.addVectors(this.boundingBox.max,xn.max),this.boundingBox.expandByPoint(Ht)):(this.boundingBox.expandByPoint(xn.min),this.boundingBox.expandByPoint(xn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new hs);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new D,1/0);return}if(e){let n=this.boundingSphere.center;if(xn.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];Dr.setFromBufferAttribute(a),this.morphTargetsRelative?(Ht.addVectors(xn.min,Dr.min),xn.expandByPoint(Ht),Ht.addVectors(xn.max,Dr.max),xn.expandByPoint(Ht)):(xn.expandByPoint(Dr.min),xn.expandByPoint(Dr.max))}xn.getCenter(n);let s=0;for(let r=0,o=e.count;r<o;r++)Ht.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Ht));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],l=this.morphTargetsRelative;for(let h=0,c=a.count;h<c;h++)Ht.fromBufferAttribute(a,h),l&&(Bs.fromBufferAttribute(e,h),Ht.add(Bs)),s=Math.max(s,n.distanceToSquared(Ht))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new yn(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let E=0;E<n.count;E++)a[E]=new D,l[E]=new D;let h=new D,c=new D,u=new D,d=new He,m=new He,g=new He,x=new D,p=new D;function f(E,v,_){h.fromBufferAttribute(n,E),c.fromBufferAttribute(n,v),u.fromBufferAttribute(n,_),d.fromBufferAttribute(r,E),m.fromBufferAttribute(r,v),g.fromBufferAttribute(r,_),c.sub(h),u.sub(h),m.sub(d),g.sub(d);let I=1/(m.x*g.y-g.x*m.y);isFinite(I)&&(x.copy(c).multiplyScalar(g.y).addScaledVector(u,-m.y).multiplyScalar(I),p.copy(u).multiplyScalar(m.x).addScaledVector(c,-g.x).multiplyScalar(I),a[E].add(x),a[v].add(x),a[_].add(x),l[E].add(p),l[v].add(p),l[_].add(p))}let S=this.groups;S.length===0&&(S=[{start:0,count:e.count}]);for(let E=0,v=S.length;E<v;++E){let _=S[E],I=_.start,H=_.count;for(let R=I,O=I+H;R<O;R+=3)f(e.getX(R+0),e.getX(R+1),e.getX(R+2))}let w=new D,y=new D,L=new D,C=new D;function A(E){L.fromBufferAttribute(s,E),C.copy(L);let v=a[E];w.copy(v),w.sub(L.multiplyScalar(L.dot(v))).normalize(),y.crossVectors(C,v);let I=y.dot(l[E])<0?-1:1;o.setXYZW(E,w.x,w.y,w.z,I)}for(let E=0,v=S.length;E<v;++E){let _=S[E],I=_.start,H=_.count;for(let R=I,O=I+H;R<O;R+=3)A(e.getX(R+0)),A(e.getX(R+1)),A(e.getX(R+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new yn(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,m=n.count;d<m;d++)n.setXYZ(d,0,0,0);let s=new D,r=new D,o=new D,a=new D,l=new D,h=new D,c=new D,u=new D;if(e)for(let d=0,m=e.count;d<m;d+=3){let g=e.getX(d+0),x=e.getX(d+1),p=e.getX(d+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,x),o.fromBufferAttribute(t,p),c.subVectors(o,r),u.subVectors(s,r),c.cross(u),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,x),h.fromBufferAttribute(n,p),a.add(c),l.add(c),h.add(c),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(p,h.x,h.y,h.z)}else for(let d=0,m=t.count;d<m;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),c.subVectors(o,r),u.subVectors(s,r),c.cross(u),n.setXYZ(d+0,c.x,c.y,c.z),n.setXYZ(d+1,c.x,c.y,c.z),n.setXYZ(d+2,c.x,c.y,c.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Ht.fromBufferAttribute(e,t),Ht.normalize(),e.setXYZ(t,Ht.x,Ht.y,Ht.z)}toNonIndexed(){function e(a,l){let h=a.array,c=a.itemSize,u=a.normalized,d=new h.constructor(l.length*c),m=0,g=0;for(let x=0,p=l.length;x<p;x++){a.isInterleavedBufferAttribute?m=l[x]*a.data.stride+a.offset:m=l[x]*c;for(let f=0;f<c;f++)d[g++]=h[m++]}return new yn(d,c,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let a in s){let l=s[a],h=e(l,n);t.setAttribute(a,h)}let r=this.morphAttributes;for(let a in r){let l=[],h=r[a];for(let c=0,u=h.length;c<u;c++){let d=h[c],m=e(d,n);l.push(m)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let h=o[a];t.addGroup(h.start,h.count,h.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let h in l)l[h]!==void 0&&(e[h]=l[h]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let h=n[l];e.data.attributes[l]=h.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let h=this.morphAttributes[l],c=[];for(let u=0,d=h.length;u<d;u++){let m=h[u];c.push(m.toJSON(e.data))}c.length>0&&(s[l]=c,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone(t));let s=e.attributes;for(let h in s){let c=s[h];this.setAttribute(h,c.clone(t))}let r=e.morphAttributes;for(let h in r){let c=[],u=r[h];for(let d=0,m=u.length;d<m;d++)c.push(u[d].clone(t));this.morphAttributes[h]=c}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let h=0,c=o.length;h<c;h++){let u=o[h];this.addGroup(u.start,u.count,u.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},rd=new Ve,Qi=new Gc,Pa=new hs,ad=new D,Ia=new D,La=new D,Da=new D,Gl=new D,Ua=new D,od=new D,Na=new D,wt=class extends nn{constructor(e=new rn,t=new sn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){Ua.set(0,0,0);for(let l=0,h=r.length;l<h;l++){let c=a[l],u=r[l];c!==0&&(Gl.fromBufferAttribute(u,e),o?Ua.addScaledVector(Gl,c):Ua.addScaledVector(Gl.sub(t),c))}t.add(Ua)}return t}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Pa.copy(n.boundingSphere),Pa.applyMatrix4(r),Qi.copy(e.ray).recast(e.near),!(Pa.containsPoint(Qi.origin)===!1&&(Qi.intersectSphere(Pa,ad)===null||Qi.origin.distanceToSquared(ad)>(e.far-e.near)**2))&&(rd.copy(r).invert(),Qi.copy(e.ray).applyMatrix4(rd),!(n.boundingBox!==null&&Qi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Qi)))}_computeIntersections(e,t,n){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,h=r.attributes.uv,c=r.attributes.uv1,u=r.attributes.normal,d=r.groups,m=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,x=d.length;g<x;g++){let p=d[g],f=o[p.materialIndex],S=Math.max(p.start,m.start),w=Math.min(a.count,Math.min(p.start+p.count,m.start+m.count));for(let y=S,L=w;y<L;y+=3){let C=a.getX(y),A=a.getX(y+1),E=a.getX(y+2);s=Fa(this,f,e,n,h,c,u,C,A,E),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let g=Math.max(0,m.start),x=Math.min(a.count,m.start+m.count);for(let p=g,f=x;p<f;p+=3){let S=a.getX(p),w=a.getX(p+1),y=a.getX(p+2);s=Fa(this,o,e,n,h,c,u,S,w,y),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,x=d.length;g<x;g++){let p=d[g],f=o[p.materialIndex],S=Math.max(p.start,m.start),w=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let y=S,L=w;y<L;y+=3){let C=y,A=y+1,E=y+2;s=Fa(this,f,e,n,h,c,u,C,A,E),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let g=Math.max(0,m.start),x=Math.min(l.count,m.start+m.count);for(let p=g,f=x;p<f;p+=3){let S=p,w=p+1,y=p+2;s=Fa(this,o,e,n,h,c,u,S,w,y),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}}};function Hm(i,e,t,n,s,r,o,a){let l;if(e.side===dn?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,e.side===Oi,a),l===null)return null;Na.copy(a),Na.applyMatrix4(i.matrixWorld);let h=t.ray.origin.distanceTo(Na);return h<t.near||h>t.far?null:{distance:h,point:Na.clone(),object:i}}function Fa(i,e,t,n,s,r,o,a,l,h){i.getVertexPosition(a,Ia),i.getVertexPosition(l,La),i.getVertexPosition(h,Da);let c=Hm(i,e,t,n,Ia,La,Da,od);if(c){let u=new D;rs.getBarycoord(od,Ia,La,Da,u),s&&(c.uv=rs.getInterpolatedAttribute(s,a,l,h,u,new He)),r&&(c.uv1=rs.getInterpolatedAttribute(r,a,l,h,u,new He)),o&&(c.normal=rs.getInterpolatedAttribute(o,a,l,h,u,new D),c.normal.dot(n.direction)>0&&c.normal.multiplyScalar(-1));let d={a,b:l,c:h,normal:new D,materialIndex:0};rs.getNormal(Ia,La,Da,d.normal),c.face=d,c.barycoord=u}return c}var us=class i extends rn{constructor(e=1,t=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],h=[],c=[],u=[],d=0,m=0;g("z","y","x",-1,-1,n,t,e,o,r,0),g("z","y","x",1,-1,n,t,-e,o,r,1),g("x","z","y",1,1,e,n,t,s,o,2),g("x","z","y",1,-1,e,n,-t,s,o,3),g("x","y","z",1,-1,e,t,n,s,r,4),g("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new it(h,3)),this.setAttribute("normal",new it(c,3)),this.setAttribute("uv",new it(u,2));function g(x,p,f,S,w,y,L,C,A,E,v){let _=y/A,I=L/E,H=y/2,R=L/2,O=C/2,z=A+1,B=E+1,Z=0,G=0,se=new D;for(let ee=0;ee<B;ee++){let fe=ee*I-R;for(let Ue=0;Ue<z;Ue++){let et=Ue*_-H;se[x]=et*S,se[p]=fe*w,se[f]=O,h.push(se.x,se.y,se.z),se[x]=0,se[p]=0,se[f]=C>0?1:-1,c.push(se.x,se.y,se.z),u.push(Ue/A),u.push(1-ee/E),Z+=1}}for(let ee=0;ee<E;ee++)for(let fe=0;fe<A;fe++){let Ue=d+fe+z*ee,et=d+fe+z*(ee+1),$=d+(fe+1)+z*(ee+1),ie=d+(fe+1)+z*ee;l.push(Ue,et,ie),l.push(et,$,ie),G+=6}a.addGroup(m,G,v),m+=G,d+=Z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function er(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function tn(i){let e={};for(let t=0;t<i.length;t++){let n=er(i[t]);for(let s in n)e[s]=n[s]}return e}function Vm(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function jd(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Je.workingColorSpace}var Gm={clone:er,merge:tn},Wm=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Xm=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Kn=class extends Hi{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Wm,this.fragmentShader=Xm,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=er(e.uniforms),this.uniformsGroups=Vm(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},to=class extends nn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ve,this.projectionMatrix=new Ve,this.projectionMatrixInverse=new Ve,this.coordinateSystem=di}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Ni=new D,ld=new He,cd=new He,Jt=class extends to{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Oc*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Sl*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Oc*2*Math.atan(Math.tan(Sl*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Ni.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Ni.x,Ni.y).multiplyScalar(-e/Ni.z),Ni.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Ni.x,Ni.y).multiplyScalar(-e/Ni.z)}getViewSize(e,t){return this.getViewBounds(e,ld,cd),t.subVectors(cd,ld)}setViewOffset(e,t,n,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Sl*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,h=o.fullHeight;r+=o.offsetX*s/l,t-=o.offsetY*n/h,s*=o.width/l,n*=o.height/h}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Os=-90,zs=1,Wc=class extends nn{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Jt(Os,zs,e,t);s.layers=this.layers,this.add(s);let r=new Jt(Os,zs,e,t);r.layers=this.layers,this.add(r);let o=new Jt(Os,zs,e,t);o.layers=this.layers,this.add(o);let a=new Jt(Os,zs,e,t);a.layers=this.layers,this.add(a);let l=new Jt(Os,zs,e,t);l.layers=this.layers,this.add(l);let h=new Jt(Os,zs,e,t);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,o,a,l]=t;for(let h of t)this.remove(h);if(e===di)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Za)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let h of t)this.add(h),h.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,h,c]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,o),e.setRenderTarget(n,2,s),e.render(t,a),e.setRenderTarget(n,3,s),e.render(t,l),e.setRenderTarget(n,4,s),e.render(t,h),n.texture.generateMipmaps=x,e.setRenderTarget(n,5,s),e.render(t,c),e.setRenderTarget(u,d,m),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},no=class extends _n{constructor(e,t,n,s,r,o,a,l,h,c){e=e!==void 0?e:[],t=t!==void 0?t:Zs,super(e,t,n,s,r,o,a,l,h,c),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Xc=class extends mi{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new no(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Yn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new us(5,5,5),r=new Kn({name:"CubemapFromEquirect",uniforms:er(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:dn,blending:ki});r.uniforms.tEquirect.value=t;let o=new wt(s,r),a=t.minFilter;return t.minFilter===ls&&(t.minFilter=Yn),new Wc(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,n,s){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,s);e.setRenderTarget(r)}},Wl=new D,qm=new D,$m=new Le,ui=class{constructor(e=new D(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=Wl.subVectors(n,t).cross(qm.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(Wl),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||$m.getNormalMatrix(e),s=this.coplanarPoint(Wl).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},es=new hs,ka=new D,Vr=class{constructor(e=new ui,t=new ui,n=new ui,s=new ui,r=new ui,o=new ui){this.planes=[e,t,n,s,r,o]}set(e,t,n,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=di){let n=this.planes,s=e.elements,r=s[0],o=s[1],a=s[2],l=s[3],h=s[4],c=s[5],u=s[6],d=s[7],m=s[8],g=s[9],x=s[10],p=s[11],f=s[12],S=s[13],w=s[14],y=s[15];if(n[0].setComponents(l-r,d-h,p-m,y-f).normalize(),n[1].setComponents(l+r,d+h,p+m,y+f).normalize(),n[2].setComponents(l+o,d+c,p+g,y+S).normalize(),n[3].setComponents(l-o,d-c,p-g,y-S).normalize(),n[4].setComponents(l-a,d-u,p-x,y-w).normalize(),t===di)n[5].setComponents(l+a,d+u,p+x,y+w).normalize();else if(t===Za)n[5].setComponents(a,u,x,w).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),es.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),es.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(es)}intersectsSprite(e){return es.center.set(0,0,0),es.radius=.7071067811865476,es.applyMatrix4(e.matrixWorld),this.intersectsSphere(es)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(ka.x=s.normal.x>0?e.max.x:e.min.x,ka.y=s.normal.y>0?e.max.y:e.min.y,ka.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(ka)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function Qd(){let i=null,e=!1,t=null,n=null;function s(r,o){t(r,o),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Ym(i){let e=new WeakMap;function t(a,l){let h=a.array,c=a.usage,u=h.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,h,c),a.onUploadCallback();let m;if(h instanceof Float32Array)m=i.FLOAT;else if(h instanceof Uint16Array)a.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(h instanceof Int16Array)m=i.SHORT;else if(h instanceof Uint32Array)m=i.UNSIGNED_INT;else if(h instanceof Int32Array)m=i.INT;else if(h instanceof Int8Array)m=i.BYTE;else if(h instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:d,type:m,bytesPerElement:h.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,l,h){let c=l.array,u=l.updateRanges;if(i.bindBuffer(h,a),u.length===0)i.bufferSubData(h,0,c);else{u.sort((m,g)=>m.start-g.start);let d=0;for(let m=1;m<u.length;m++){let g=u[d],x=u[m];x.start<=g.start+g.count+1?g.count=Math.max(g.count,x.start+x.count-g.start):(++d,u[d]=x)}u.length=d+1;for(let m=0,g=u.length;m<g;m++){let x=u[m];i.bufferSubData(h,x.start*c.BYTES_PER_ELEMENT,c,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(i.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let c=e.get(a);(!c||c.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let h=e.get(a);if(h===void 0)e.set(a,t(a,l));else if(h.version<a.version){if(h.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(h.buffer,a,l),h.version=a.version}}return{get:s,remove:r,update:o}}var Vi=class i extends rn{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(n),l=Math.floor(s),h=a+1,c=l+1,u=e/a,d=t/l,m=[],g=[],x=[],p=[];for(let f=0;f<c;f++){let S=f*d-o;for(let w=0;w<h;w++){let y=w*u-r;g.push(y,-S,0),x.push(0,0,1),p.push(w/a),p.push(1-f/l)}}for(let f=0;f<l;f++)for(let S=0;S<a;S++){let w=S+h*f,y=S+h*(f+1),L=S+1+h*(f+1),C=S+1+h*f;m.push(w,y,C),m.push(y,L,C)}this.setIndex(m),this.setAttribute("position",new it(g,3)),this.setAttribute("normal",new it(x,3)),this.setAttribute("uv",new it(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}},Zm=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Km=`#ifdef USE_ALPHAHASH
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
#endif`,Jm=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,jm=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Qm=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,eg=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,tg=`#ifdef USE_AOMAP
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
#endif`,ng=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,ig=`#ifdef USE_BATCHING
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
#endif`,sg=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,rg=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,ag=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,og=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,lg=`#ifdef USE_IRIDESCENCE
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
#endif`,cg=`#ifdef USE_BUMPMAP
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
#endif`,hg=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,ug=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,dg=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,fg=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,pg=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,mg=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,gg=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,xg=`#if defined( USE_COLOR_ALPHA )
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
#endif`,vg=`#define PI 3.141592653589793
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
} // validated`,yg=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,_g=`vec3 transformedNormal = objectNormal;
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
#endif`,bg=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Mg=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Sg=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,wg=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Ag="gl_FragColor = linearToOutputTexel( gl_FragColor );",Tg=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Eg=`#ifdef USE_ENVMAP
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
#endif`,Cg=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Rg=`#ifdef USE_ENVMAP
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
#endif`,Pg=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Ig=`#ifdef USE_ENVMAP
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
#endif`,Lg=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Dg=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Ug=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ng=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Fg=`#ifdef USE_GRADIENTMAP
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
}`,kg=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Bg=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Og=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,zg=`uniform bool receiveShadow;
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
#endif`,Hg=`#ifdef USE_ENVMAP
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
#endif`,Vg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Gg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Wg=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Xg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,qg=`PhysicalMaterial material;
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
#endif`,$g=`struct PhysicalMaterial {
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
}`,Yg=`
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
#endif`,Zg=`#if defined( RE_IndirectDiffuse )
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
#endif`,Kg=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Jg=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,jg=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Qg=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,e0=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,t0=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,n0=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,i0=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,s0=`#if defined( USE_POINTS_UV )
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
#endif`,r0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,a0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,o0=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,l0=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,c0=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,h0=`#ifdef USE_MORPHTARGETS
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
#endif`,u0=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,d0=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,f0=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,p0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,m0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,g0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,x0=`#ifdef USE_NORMALMAP
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
#endif`,v0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,y0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,_0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,b0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,M0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,S0=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,w0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,A0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,T0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,E0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,C0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,R0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,P0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,I0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,L0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,D0=`float getShadowMask() {
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
}`,U0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,N0=`#ifdef USE_SKINNING
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
#endif`,F0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,k0=`#ifdef USE_SKINNING
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
#endif`,B0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,O0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,z0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,H0=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,V0=`#ifdef USE_TRANSMISSION
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
#endif`,G0=`#ifdef USE_TRANSMISSION
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
#endif`,W0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,X0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,q0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,$0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Y0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Z0=`uniform sampler2D t2D;
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
}`,K0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,J0=`#ifdef ENVMAP_TYPE_CUBE
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
}`,j0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Q0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ex=`#include <common>
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
}`,tx=`#if DEPTH_PACKING == 3200
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
}`,nx=`#define DISTANCE
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
}`,ix=`#define DISTANCE
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
}`,sx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,rx=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ax=`uniform float scale;
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
}`,ox=`uniform vec3 diffuse;
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
}`,lx=`#include <common>
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
}`,cx=`uniform vec3 diffuse;
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
}`,hx=`#define LAMBERT
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
}`,ux=`#define LAMBERT
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
}`,dx=`#define MATCAP
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
}`,fx=`#define MATCAP
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
}`,px=`#define NORMAL
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
}`,mx=`#define NORMAL
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
}`,gx=`#define PHONG
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
}`,xx=`#define PHONG
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
}`,vx=`#define STANDARD
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
}`,yx=`#define STANDARD
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
}`,_x=`#define TOON
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
}`,bx=`#define TOON
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
}`,Mx=`uniform float size;
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
}`,Sx=`uniform vec3 diffuse;
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
}`,wx=`#include <common>
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
}`,Ax=`uniform vec3 color;
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
}`,Tx=`uniform float rotation;
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
}`,Ex=`uniform vec3 diffuse;
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
}`,Oe={alphahash_fragment:Zm,alphahash_pars_fragment:Km,alphamap_fragment:Jm,alphamap_pars_fragment:jm,alphatest_fragment:Qm,alphatest_pars_fragment:eg,aomap_fragment:tg,aomap_pars_fragment:ng,batching_pars_vertex:ig,batching_vertex:sg,begin_vertex:rg,beginnormal_vertex:ag,bsdfs:og,iridescence_fragment:lg,bumpmap_pars_fragment:cg,clipping_planes_fragment:hg,clipping_planes_pars_fragment:ug,clipping_planes_pars_vertex:dg,clipping_planes_vertex:fg,color_fragment:pg,color_pars_fragment:mg,color_pars_vertex:gg,color_vertex:xg,common:vg,cube_uv_reflection_fragment:yg,defaultnormal_vertex:_g,displacementmap_pars_vertex:bg,displacementmap_vertex:Mg,emissivemap_fragment:Sg,emissivemap_pars_fragment:wg,colorspace_fragment:Ag,colorspace_pars_fragment:Tg,envmap_fragment:Eg,envmap_common_pars_fragment:Cg,envmap_pars_fragment:Rg,envmap_pars_vertex:Pg,envmap_physical_pars_fragment:Hg,envmap_vertex:Ig,fog_vertex:Lg,fog_pars_vertex:Dg,fog_fragment:Ug,fog_pars_fragment:Ng,gradientmap_pars_fragment:Fg,lightmap_pars_fragment:kg,lights_lambert_fragment:Bg,lights_lambert_pars_fragment:Og,lights_pars_begin:zg,lights_toon_fragment:Vg,lights_toon_pars_fragment:Gg,lights_phong_fragment:Wg,lights_phong_pars_fragment:Xg,lights_physical_fragment:qg,lights_physical_pars_fragment:$g,lights_fragment_begin:Yg,lights_fragment_maps:Zg,lights_fragment_end:Kg,logdepthbuf_fragment:Jg,logdepthbuf_pars_fragment:jg,logdepthbuf_pars_vertex:Qg,logdepthbuf_vertex:e0,map_fragment:t0,map_pars_fragment:n0,map_particle_fragment:i0,map_particle_pars_fragment:s0,metalnessmap_fragment:r0,metalnessmap_pars_fragment:a0,morphinstance_vertex:o0,morphcolor_vertex:l0,morphnormal_vertex:c0,morphtarget_pars_vertex:h0,morphtarget_vertex:u0,normal_fragment_begin:d0,normal_fragment_maps:f0,normal_pars_fragment:p0,normal_pars_vertex:m0,normal_vertex:g0,normalmap_pars_fragment:x0,clearcoat_normal_fragment_begin:v0,clearcoat_normal_fragment_maps:y0,clearcoat_pars_fragment:_0,iridescence_pars_fragment:b0,opaque_fragment:M0,packing:S0,premultiplied_alpha_fragment:w0,project_vertex:A0,dithering_fragment:T0,dithering_pars_fragment:E0,roughnessmap_fragment:C0,roughnessmap_pars_fragment:R0,shadowmap_pars_fragment:P0,shadowmap_pars_vertex:I0,shadowmap_vertex:L0,shadowmask_pars_fragment:D0,skinbase_vertex:U0,skinning_pars_vertex:N0,skinning_vertex:F0,skinnormal_vertex:k0,specularmap_fragment:B0,specularmap_pars_fragment:O0,tonemapping_fragment:z0,tonemapping_pars_fragment:H0,transmission_fragment:V0,transmission_pars_fragment:G0,uv_pars_fragment:W0,uv_pars_vertex:X0,uv_vertex:q0,worldpos_vertex:$0,background_vert:Y0,background_frag:Z0,backgroundCube_vert:K0,backgroundCube_frag:J0,cube_vert:j0,cube_frag:Q0,depth_vert:ex,depth_frag:tx,distanceRGBA_vert:nx,distanceRGBA_frag:ix,equirect_vert:sx,equirect_frag:rx,linedashed_vert:ax,linedashed_frag:ox,meshbasic_vert:lx,meshbasic_frag:cx,meshlambert_vert:hx,meshlambert_frag:ux,meshmatcap_vert:dx,meshmatcap_frag:fx,meshnormal_vert:px,meshnormal_frag:mx,meshphong_vert:gx,meshphong_frag:xx,meshphysical_vert:vx,meshphysical_frag:yx,meshtoon_vert:_x,meshtoon_frag:bx,points_vert:Mx,points_frag:Sx,shadow_vert:wx,shadow_frag:Ax,sprite_vert:Tx,sprite_frag:Ex},re={common:{diffuse:{value:new xe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Le}},envmap:{envMap:{value:null},envMapRotation:{value:new Le},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Le}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Le}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Le},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Le},normalScale:{value:new He(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Le},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Le}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Le}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Le}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new xe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new xe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0},uvTransform:{value:new Le}},sprite:{diffuse:{value:new xe(16777215)},opacity:{value:1},center:{value:new He(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}}},$n={basic:{uniforms:tn([re.common,re.specularmap,re.envmap,re.aomap,re.lightmap,re.fog]),vertexShader:Oe.meshbasic_vert,fragmentShader:Oe.meshbasic_frag},lambert:{uniforms:tn([re.common,re.specularmap,re.envmap,re.aomap,re.lightmap,re.emissivemap,re.bumpmap,re.normalmap,re.displacementmap,re.fog,re.lights,{emissive:{value:new xe(0)}}]),vertexShader:Oe.meshlambert_vert,fragmentShader:Oe.meshlambert_frag},phong:{uniforms:tn([re.common,re.specularmap,re.envmap,re.aomap,re.lightmap,re.emissivemap,re.bumpmap,re.normalmap,re.displacementmap,re.fog,re.lights,{emissive:{value:new xe(0)},specular:{value:new xe(1118481)},shininess:{value:30}}]),vertexShader:Oe.meshphong_vert,fragmentShader:Oe.meshphong_frag},standard:{uniforms:tn([re.common,re.envmap,re.aomap,re.lightmap,re.emissivemap,re.bumpmap,re.normalmap,re.displacementmap,re.roughnessmap,re.metalnessmap,re.fog,re.lights,{emissive:{value:new xe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Oe.meshphysical_vert,fragmentShader:Oe.meshphysical_frag},toon:{uniforms:tn([re.common,re.aomap,re.lightmap,re.emissivemap,re.bumpmap,re.normalmap,re.displacementmap,re.gradientmap,re.fog,re.lights,{emissive:{value:new xe(0)}}]),vertexShader:Oe.meshtoon_vert,fragmentShader:Oe.meshtoon_frag},matcap:{uniforms:tn([re.common,re.bumpmap,re.normalmap,re.displacementmap,re.fog,{matcap:{value:null}}]),vertexShader:Oe.meshmatcap_vert,fragmentShader:Oe.meshmatcap_frag},points:{uniforms:tn([re.points,re.fog]),vertexShader:Oe.points_vert,fragmentShader:Oe.points_frag},dashed:{uniforms:tn([re.common,re.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Oe.linedashed_vert,fragmentShader:Oe.linedashed_frag},depth:{uniforms:tn([re.common,re.displacementmap]),vertexShader:Oe.depth_vert,fragmentShader:Oe.depth_frag},normal:{uniforms:tn([re.common,re.bumpmap,re.normalmap,re.displacementmap,{opacity:{value:1}}]),vertexShader:Oe.meshnormal_vert,fragmentShader:Oe.meshnormal_frag},sprite:{uniforms:tn([re.sprite,re.fog]),vertexShader:Oe.sprite_vert,fragmentShader:Oe.sprite_frag},background:{uniforms:{uvTransform:{value:new Le},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Oe.background_vert,fragmentShader:Oe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Le}},vertexShader:Oe.backgroundCube_vert,fragmentShader:Oe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Oe.cube_vert,fragmentShader:Oe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Oe.equirect_vert,fragmentShader:Oe.equirect_frag},distanceRGBA:{uniforms:tn([re.common,re.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Oe.distanceRGBA_vert,fragmentShader:Oe.distanceRGBA_frag},shadow:{uniforms:tn([re.lights,re.fog,{color:{value:new xe(0)},opacity:{value:1}}]),vertexShader:Oe.shadow_vert,fragmentShader:Oe.shadow_frag}};$n.physical={uniforms:tn([$n.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Le},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Le},clearcoatNormalScale:{value:new He(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Le},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Le},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Le},sheen:{value:0},sheenColor:{value:new xe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Le},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Le},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Le},transmissionSamplerSize:{value:new He},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Le},attenuationDistance:{value:0},attenuationColor:{value:new xe(0)},specularColor:{value:new xe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Le},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Le},anisotropyVector:{value:new He},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Le}}]),vertexShader:Oe.meshphysical_vert,fragmentShader:Oe.meshphysical_frag};var Ba={r:0,b:0,g:0},ts=new Ut,Cx=new Ve;function Rx(i,e,t,n,s,r,o){let a=new xe(0),l=r===!0?0:1,h,c,u=null,d=0,m=null;function g(S){let w=S.isScene===!0?S.background:null;return w&&w.isTexture&&(w=(S.backgroundBlurriness>0?t:e).get(w)),w}function x(S){let w=!1,y=g(S);y===null?f(a,l):y&&y.isColor&&(f(y,1),w=!0);let L=i.xr.getEnvironmentBlendMode();L==="additive"?n.buffers.color.setClear(0,0,0,1,o):L==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||w)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function p(S,w){let y=g(w);y&&(y.isCubeTexture||y.mapping===bo)?(c===void 0&&(c=new wt(new us(1,1,1),new Kn({name:"BackgroundCubeMaterial",uniforms:er($n.backgroundCube.uniforms),vertexShader:$n.backgroundCube.vertexShader,fragmentShader:$n.backgroundCube.fragmentShader,side:dn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(L,C,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(c)),ts.copy(w.backgroundRotation),ts.x*=-1,ts.y*=-1,ts.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(ts.y*=-1,ts.z*=-1),c.material.uniforms.envMap.value=y,c.material.uniforms.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Cx.makeRotationFromEuler(ts)),c.material.toneMapped=Je.getTransfer(y.colorSpace)!==dt,(u!==y||d!==y.version||m!==i.toneMapping)&&(c.material.needsUpdate=!0,u=y,d=y.version,m=i.toneMapping),c.layers.enableAll(),S.unshift(c,c.geometry,c.material,0,0,null)):y&&y.isTexture&&(h===void 0&&(h=new wt(new Vi(2,2),new Kn({name:"BackgroundMaterial",uniforms:er($n.background.uniforms),vertexShader:$n.background.vertexShader,fragmentShader:$n.background.fragmentShader,side:Oi,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),Object.defineProperty(h.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(h)),h.material.uniforms.t2D.value=y,h.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,h.material.toneMapped=Je.getTransfer(y.colorSpace)!==dt,y.matrixAutoUpdate===!0&&y.updateMatrix(),h.material.uniforms.uvTransform.value.copy(y.matrix),(u!==y||d!==y.version||m!==i.toneMapping)&&(h.material.needsUpdate=!0,u=y,d=y.version,m=i.toneMapping),h.layers.enableAll(),S.unshift(h,h.geometry,h.material,0,0,null))}function f(S,w){S.getRGB(Ba,jd(i)),n.buffers.color.setClear(Ba.r,Ba.g,Ba.b,w,o)}return{getClearColor:function(){return a},setClearColor:function(S,w=1){a.set(S),l=w,f(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(S){l=S,f(a,l)},render:x,addToRenderList:p}}function Px(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null),r=s,o=!1;function a(_,I,H,R,O){let z=!1,B=u(R,H,I);r!==B&&(r=B,h(r.object)),z=m(_,R,H,O),z&&g(_,R,H,O),O!==null&&e.update(O,i.ELEMENT_ARRAY_BUFFER),(z||o)&&(o=!1,y(_,I,H,R),O!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(O).buffer))}function l(){return i.createVertexArray()}function h(_){return i.bindVertexArray(_)}function c(_){return i.deleteVertexArray(_)}function u(_,I,H){let R=H.wireframe===!0,O=n[_.id];O===void 0&&(O={},n[_.id]=O);let z=O[I.id];z===void 0&&(z={},O[I.id]=z);let B=z[R];return B===void 0&&(B=d(l()),z[R]=B),B}function d(_){let I=[],H=[],R=[];for(let O=0;O<t;O++)I[O]=0,H[O]=0,R[O]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:I,enabledAttributes:H,attributeDivisors:R,object:_,attributes:{},index:null}}function m(_,I,H,R){let O=r.attributes,z=I.attributes,B=0,Z=H.getAttributes();for(let G in Z)if(Z[G].location>=0){let ee=O[G],fe=z[G];if(fe===void 0&&(G==="instanceMatrix"&&_.instanceMatrix&&(fe=_.instanceMatrix),G==="instanceColor"&&_.instanceColor&&(fe=_.instanceColor)),ee===void 0||ee.attribute!==fe||fe&&ee.data!==fe.data)return!0;B++}return r.attributesNum!==B||r.index!==R}function g(_,I,H,R){let O={},z=I.attributes,B=0,Z=H.getAttributes();for(let G in Z)if(Z[G].location>=0){let ee=z[G];ee===void 0&&(G==="instanceMatrix"&&_.instanceMatrix&&(ee=_.instanceMatrix),G==="instanceColor"&&_.instanceColor&&(ee=_.instanceColor));let fe={};fe.attribute=ee,ee&&ee.data&&(fe.data=ee.data),O[G]=fe,B++}r.attributes=O,r.attributesNum=B,r.index=R}function x(){let _=r.newAttributes;for(let I=0,H=_.length;I<H;I++)_[I]=0}function p(_){f(_,0)}function f(_,I){let H=r.newAttributes,R=r.enabledAttributes,O=r.attributeDivisors;H[_]=1,R[_]===0&&(i.enableVertexAttribArray(_),R[_]=1),O[_]!==I&&(i.vertexAttribDivisor(_,I),O[_]=I)}function S(){let _=r.newAttributes,I=r.enabledAttributes;for(let H=0,R=I.length;H<R;H++)I[H]!==_[H]&&(i.disableVertexAttribArray(H),I[H]=0)}function w(_,I,H,R,O,z,B){B===!0?i.vertexAttribIPointer(_,I,H,O,z):i.vertexAttribPointer(_,I,H,R,O,z)}function y(_,I,H,R){x();let O=R.attributes,z=H.getAttributes(),B=I.defaultAttributeValues;for(let Z in z){let G=z[Z];if(G.location>=0){let se=O[Z];if(se===void 0&&(Z==="instanceMatrix"&&_.instanceMatrix&&(se=_.instanceMatrix),Z==="instanceColor"&&_.instanceColor&&(se=_.instanceColor)),se!==void 0){let ee=se.normalized,fe=se.itemSize,Ue=e.get(se);if(Ue===void 0)continue;let et=Ue.buffer,$=Ue.type,ie=Ue.bytesPerElement,be=$===i.INT||$===i.UNSIGNED_INT||se.gpuType===vh;if(se.isInterleavedBufferAttribute){let le=se.data,Re=le.stride,Ne=se.offset;if(le.isInstancedInterleavedBuffer){for(let ze=0;ze<G.locationSize;ze++)f(G.location+ze,le.meshPerAttribute);_.isInstancedMesh!==!0&&R._maxInstanceCount===void 0&&(R._maxInstanceCount=le.meshPerAttribute*le.count)}else for(let ze=0;ze<G.locationSize;ze++)p(G.location+ze);i.bindBuffer(i.ARRAY_BUFFER,et);for(let ze=0;ze<G.locationSize;ze++)w(G.location+ze,fe/G.locationSize,$,ee,Re*ie,(Ne+fe/G.locationSize*ze)*ie,be)}else{if(se.isInstancedBufferAttribute){for(let le=0;le<G.locationSize;le++)f(G.location+le,se.meshPerAttribute);_.isInstancedMesh!==!0&&R._maxInstanceCount===void 0&&(R._maxInstanceCount=se.meshPerAttribute*se.count)}else for(let le=0;le<G.locationSize;le++)p(G.location+le);i.bindBuffer(i.ARRAY_BUFFER,et);for(let le=0;le<G.locationSize;le++)w(G.location+le,fe/G.locationSize,$,ee,fe*ie,fe/G.locationSize*le*ie,be)}}else if(B!==void 0){let ee=B[Z];if(ee!==void 0)switch(ee.length){case 2:i.vertexAttrib2fv(G.location,ee);break;case 3:i.vertexAttrib3fv(G.location,ee);break;case 4:i.vertexAttrib4fv(G.location,ee);break;default:i.vertexAttrib1fv(G.location,ee)}}}}S()}function L(){E();for(let _ in n){let I=n[_];for(let H in I){let R=I[H];for(let O in R)c(R[O].object),delete R[O];delete I[H]}delete n[_]}}function C(_){if(n[_.id]===void 0)return;let I=n[_.id];for(let H in I){let R=I[H];for(let O in R)c(R[O].object),delete R[O];delete I[H]}delete n[_.id]}function A(_){for(let I in n){let H=n[I];if(H[_.id]===void 0)continue;let R=H[_.id];for(let O in R)c(R[O].object),delete R[O];delete H[_.id]}}function E(){v(),o=!0,r!==s&&(r=s,h(r.object))}function v(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:E,resetDefaultState:v,dispose:L,releaseStatesOfGeometry:C,releaseStatesOfProgram:A,initAttributes:x,enableAttribute:p,disableUnusedAttributes:S}}function Ix(i,e,t){let n;function s(h){n=h}function r(h,c){i.drawArrays(n,h,c),t.update(c,n,1)}function o(h,c,u){u!==0&&(i.drawArraysInstanced(n,h,c,u),t.update(c,n,u))}function a(h,c,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,h,0,c,0,u);let m=0;for(let g=0;g<u;g++)m+=c[g];t.update(m,n,1)}function l(h,c,u,d){if(u===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<h.length;g++)o(h[g],c[g],d[g]);else{m.multiDrawArraysInstancedWEBGL(n,h,0,c,0,d,0,u);let g=0;for(let x=0;x<u;x++)g+=c[x]*d[x];t.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function Lx(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let A=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(A){return!(A!==On&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(A){let E=A===Xr&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(A!==pi&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==Zn&&!E)}function l(A){if(A==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=t.precision!==void 0?t.precision:"highp",c=l(h);c!==h&&(console.warn("THREE.WebGLRenderer:",h,"not supported, using",c,"instead."),h=c);let u=t.logarithmicDepthBuffer===!0,d=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),f=i.getParameter(i.MAX_VERTEX_ATTRIBS),S=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),w=i.getParameter(i.MAX_VARYING_VECTORS),y=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),L=g>0,C=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:h,logarithmicDepthBuffer:u,reverseDepthBuffer:d,maxTextures:m,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:p,maxAttributes:f,maxVertexUniforms:S,maxVaryings:w,maxFragmentUniforms:y,vertexTextures:L,maxSamples:C}}function Dx(i){let e=this,t=null,n=0,s=!1,r=!1,o=new ui,a=new Le,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let m=u.length!==0||d||n!==0||s;return s=d,n=u.length,m},this.beginShadows=function(){r=!0,c(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=c(u,d,0)},this.setState=function(u,d,m){let g=u.clippingPlanes,x=u.clipIntersection,p=u.clipShadows,f=i.get(u);if(!s||g===null||g.length===0||r&&!p)r?c(null):h();else{let S=r?0:n,w=S*4,y=f.clippingState||null;l.value=y,y=c(g,d,w,m);for(let L=0;L!==w;++L)y[L]=t[L];f.clippingState=y,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=S}};function h(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function c(u,d,m,g){let x=u!==null?u.length:0,p=null;if(x!==0){if(p=l.value,g!==!0||p===null){let f=m+x*4,S=d.matrixWorldInverse;a.getNormalMatrix(S),(p===null||p.length<f)&&(p=new Float32Array(f));for(let w=0,y=m;w!==x;++w,y+=4)o.copy(u[w]).applyMatrix4(S,a),o.normal.toArray(p,y),p[y+3]=o.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,p}}function Ux(i){let e=new WeakMap;function t(o,a){return a===lc?o.mapping=Zs:a===cc&&(o.mapping=Ks),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===lc||a===cc)if(e.has(o)){let l=e.get(o).texture;return t(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let h=new Xc(l.height);return h.fromEquirectangularTexture(i,o),e.set(o,h),o.addEventListener("dispose",s),t(h.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var io=class extends to{constructor(e=-1,t=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,o=n+e,a=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let h=(this.right-this.left)/this.view.fullWidth/this.zoom,c=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=h*this.view.offsetX,o=r+h*this.view.width,a-=c*this.view.offsetY,l=a-c*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Gs=4,hd=[.125,.215,.35,.446,.526,.582],as=20,Xl=new io,ud=new xe,ql=null,$l=0,Yl=0,Zl=!1,is=(1+Math.sqrt(5))/2,Hs=1/is,dd=[new D(-is,Hs,0),new D(is,Hs,0),new D(-Hs,0,is),new D(Hs,0,is),new D(0,is,-Hs),new D(0,is,Hs),new D(-1,1,-1),new D(1,1,-1),new D(-1,1,1),new D(1,1,1)],so=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100){ql=this._renderer.getRenderTarget(),$l=this._renderer.getActiveCubeFace(),Yl=this._renderer.getActiveMipmapLevel(),Zl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,s,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=md(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=pd(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(ql,$l,Yl),this._renderer.xr.enabled=Zl,e.scissorTest=!1,Oa(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Zs||e.mapping===Ks?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),ql=this._renderer.getRenderTarget(),$l=this._renderer.getActiveCubeFace(),Yl=this._renderer.getActiveMipmapLevel(),Zl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Yn,minFilter:Yn,generateMipmaps:!1,type:Xr,format:On,colorSpace:nr,depthBuffer:!1},s=fd(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=fd(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Nx(r)),this._blurMaterial=Fx(r,e,t)}return s}_compileMaterial(e){let t=new wt(this._lodPlanes[0],e);this._renderer.compile(t,Xl)}_sceneToCubeUV(e,t,n,s){let a=new Jt(90,1,t,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],c=this._renderer,u=c.autoClear,d=c.toneMapping;c.getClearColor(ud),c.toneMapping=Bi,c.autoClear=!1;let m=new sn({name:"PMREM.Background",side:dn,depthWrite:!1,depthTest:!1}),g=new wt(new us,m),x=!1,p=e.background;p?p.isColor&&(m.color.copy(p),e.background=null,x=!0):(m.color.copy(ud),x=!0);for(let f=0;f<6;f++){let S=f%3;S===0?(a.up.set(0,l[f],0),a.lookAt(h[f],0,0)):S===1?(a.up.set(0,0,l[f]),a.lookAt(0,h[f],0)):(a.up.set(0,l[f],0),a.lookAt(0,0,h[f]));let w=this._cubeSize;Oa(s,S*w,f>2?w:0,w,w),c.setRenderTarget(s),x&&c.render(g,a),c.render(e,a)}g.geometry.dispose(),g.material.dispose(),c.toneMapping=d,c.autoClear=u,e.background=p}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===Zs||e.mapping===Ks;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=md()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=pd());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new wt(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let l=this._cubeSize;Oa(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(o,Xl)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=dd[(s-r-1)%dd.length];this._blur(e,r-1,r,o,a)}t.autoClear=n}_blur(e,t,n,s,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,s,"latitudinal",r),this._halfBlur(o,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,o,a){let l=this._renderer,h=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let c=3,u=new wt(this._lodPlanes[s],h),d=h.uniforms,m=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*as-1),x=r/g,p=isFinite(r)?1+Math.floor(c*x):as;p>as&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${as}`);let f=[],S=0;for(let A=0;A<as;++A){let E=A/x,v=Math.exp(-E*E/2);f.push(v),A===0?S+=v:A<p&&(S+=2*v)}for(let A=0;A<f.length;A++)f[A]=f[A]/S;d.envMap.value=e.texture,d.samples.value=p,d.weights.value=f,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);let{_lodMax:w}=this;d.dTheta.value=g,d.mipInt.value=w-n;let y=this._sizeLods[s],L=3*y*(s>w-Gs?s-w+Gs:0),C=4*(this._cubeSize-y);Oa(t,L,C,3*y,2*y),l.setRenderTarget(t),l.render(u,Xl)}};function Nx(i){let e=[],t=[],n=[],s=i,r=i-Gs+1+hd.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);t.push(a);let l=1/a;o>i-Gs?l=hd[o-i+Gs-1]:o===0&&(l=0),n.push(l);let h=1/(a-2),c=-h,u=1+h,d=[c,c,u,c,u,u,c,c,u,u,c,u],m=6,g=6,x=3,p=2,f=1,S=new Float32Array(x*g*m),w=new Float32Array(p*g*m),y=new Float32Array(f*g*m);for(let C=0;C<m;C++){let A=C%3*2/3-1,E=C>2?0:-1,v=[A,E,0,A+2/3,E,0,A+2/3,E+1,0,A,E,0,A+2/3,E+1,0,A,E+1,0];S.set(v,x*g*C),w.set(d,p*g*C);let _=[C,C,C,C,C,C];y.set(_,f*g*C)}let L=new rn;L.setAttribute("position",new yn(S,x)),L.setAttribute("uv",new yn(w,p)),L.setAttribute("faceIndex",new yn(y,f)),e.push(L),s>Gs&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function fd(i,e,t){let n=new mi(i,e,t);return n.texture.mapping=bo,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Oa(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function Fx(i,e,t){let n=new Float32Array(as),s=new D(0,1,0);return new Kn({name:"SphericalGaussianBlur",defines:{n:as,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Th(),fragmentShader:`

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
		`,blending:ki,depthTest:!1,depthWrite:!1})}function pd(){return new Kn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Th(),fragmentShader:`

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
		`,blending:ki,depthTest:!1,depthWrite:!1})}function md(){return new Kn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Th(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ki,depthTest:!1,depthWrite:!1})}function Th(){return`

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
	`}function kx(i){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){let l=a.mapping,h=l===lc||l===cc,c=l===Zs||l===Ks;if(h||c){let u=e.get(a),d=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return t===null&&(t=new so(i)),u=h?t.fromEquirectangular(a,u):t.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),u.texture;if(u!==void 0)return u.texture;{let m=a.image;return h&&m&&m.height>0||c&&m&&s(m)?(t===null&&(t=new so(i)),u=h?t.fromEquirectangular(a):t.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let l=0,h=6;for(let c=0;c<h;c++)a[c]!==void 0&&l++;return l===h}function r(a){let l=a.target;l.removeEventListener("dispose",r);let h=e.get(l);h!==void 0&&(e.delete(l),h.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function Bx(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&kr("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function Ox(i,e,t,n){let s={},r=new WeakMap;function o(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let g in d.attributes)e.remove(d.attributes[g]);for(let g in d.morphAttributes){let x=d.morphAttributes[g];for(let p=0,f=x.length;p<f;p++)e.remove(x[p])}d.removeEventListener("dispose",o),delete s[d.id];let m=r.get(d);m&&(e.remove(m),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(u,d){return s[d.id]===!0||(d.addEventListener("dispose",o),s[d.id]=!0,t.memory.geometries++),d}function l(u){let d=u.attributes;for(let g in d)e.update(d[g],i.ARRAY_BUFFER);let m=u.morphAttributes;for(let g in m){let x=m[g];for(let p=0,f=x.length;p<f;p++)e.update(x[p],i.ARRAY_BUFFER)}}function h(u){let d=[],m=u.index,g=u.attributes.position,x=0;if(m!==null){let S=m.array;x=m.version;for(let w=0,y=S.length;w<y;w+=3){let L=S[w+0],C=S[w+1],A=S[w+2];d.push(L,C,C,A,A,L)}}else if(g!==void 0){let S=g.array;x=g.version;for(let w=0,y=S.length/3-1;w<y;w+=3){let L=w+0,C=w+1,A=w+2;d.push(L,C,C,A,A,L)}}else return;let p=new(Kd(d)?eo:Qs)(d,1);p.version=x;let f=r.get(u);f&&e.remove(f),r.set(u,p)}function c(u){let d=r.get(u);if(d){let m=u.index;m!==null&&d.version<m.version&&h(u)}else h(u);return r.get(u)}return{get:a,update:l,getWireframeAttribute:c}}function zx(i,e,t){let n;function s(d){n=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function l(d,m){i.drawElements(n,m,r,d*o),t.update(m,n,1)}function h(d,m,g){g!==0&&(i.drawElementsInstanced(n,m,r,d*o,g),t.update(m,n,g))}function c(d,m,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,m,0,r,d,0,g);let p=0;for(let f=0;f<g;f++)p+=m[f];t.update(p,n,1)}function u(d,m,g,x){if(g===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let f=0;f<d.length;f++)h(d[f]/o,m[f],x[f]);else{p.multiDrawElementsInstancedWEBGL(n,m,0,r,d,0,x,0,g);let f=0;for(let S=0;S<g;S++)f+=m[S]*x[S];t.update(f,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=h,this.renderMultiDraw=c,this.renderMultiDrawInstances=u}function Hx(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case i.TRIANGLES:t.triangles+=a*(r/3);break;case i.LINES:t.lines+=a*(r/2);break;case i.LINE_STRIP:t.lines+=a*(r-1);break;case i.LINE_LOOP:t.lines+=a*r;break;case i.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function Vx(i,e,t){let n=new WeakMap,s=new ft;function r(o,a,l){let h=o.morphTargetInfluences,c=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=c!==void 0?c.length:0,d=n.get(a);if(d===void 0||d.count!==u){let v=function(){A.dispose(),n.delete(a),a.removeEventListener("dispose",v)};d!==void 0&&d.texture.dispose();let m=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,x=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],f=a.morphAttributes.normal||[],S=a.morphAttributes.color||[],w=0;m===!0&&(w=1),g===!0&&(w=2),x===!0&&(w=3);let y=a.attributes.position.count*w,L=1;y>e.maxTextureSize&&(L=Math.ceil(y/e.maxTextureSize),y=e.maxTextureSize);let C=new Float32Array(y*L*4*u),A=new ja(C,y,L,u);A.type=Zn,A.needsUpdate=!0;let E=w*4;for(let _=0;_<u;_++){let I=p[_],H=f[_],R=S[_],O=y*L*4*_;for(let z=0;z<I.count;z++){let B=z*E;m===!0&&(s.fromBufferAttribute(I,z),C[O+B+0]=s.x,C[O+B+1]=s.y,C[O+B+2]=s.z,C[O+B+3]=0),g===!0&&(s.fromBufferAttribute(H,z),C[O+B+4]=s.x,C[O+B+5]=s.y,C[O+B+6]=s.z,C[O+B+7]=0),x===!0&&(s.fromBufferAttribute(R,z),C[O+B+8]=s.x,C[O+B+9]=s.y,C[O+B+10]=s.z,C[O+B+11]=R.itemSize===4?s.w:1)}}d={count:u,texture:A,size:new He(y,L)},n.set(a,d),a.addEventListener("dispose",v)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,t);else{let m=0;for(let x=0;x<h.length;x++)m+=h[x];let g=a.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",h)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function Gx(i,e,t,n){let s=new WeakMap;function r(l){let h=n.render.frame,c=l.geometry,u=e.get(l,c);if(s.get(u)!==h&&(e.update(u),s.set(u,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==h&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,h))),l.isSkinnedMesh){let d=l.skeleton;s.get(d)!==h&&(d.update(),s.set(d,h))}return u}function o(){s=new WeakMap}function a(l){let h=l.target;h.removeEventListener("dispose",a),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:r,dispose:o}}var ro=class extends _n{constructor(e,t,n,s,r,o,a,l,h,c=Xs){if(c!==Xs&&c!==js)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&c===Xs&&(n=cs),n===void 0&&c===js&&(n=Js),super(null,s,r,o,a,l,c,n,h),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=a!==void 0?a:vn,this.minFilter=l!==void 0?l:vn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},ef=new _n,gd=new ro(1,1),tf=new ja,nf=new Vc,sf=new no,xd=[],vd=[],yd=new Float32Array(16),_d=new Float32Array(9),bd=new Float32Array(4);function ir(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=xd[s];if(r===void 0&&(r=new Float32Array(s),xd[s]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,i[o].toArray(r,a)}return r}function Nt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Ft(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function So(i,e){let t=vd[e];t===void 0&&(t=new Int32Array(e),vd[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Wx(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Xx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Nt(t,e))return;i.uniform2fv(this.addr,e),Ft(t,e)}}function qx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Nt(t,e))return;i.uniform3fv(this.addr,e),Ft(t,e)}}function $x(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Nt(t,e))return;i.uniform4fv(this.addr,e),Ft(t,e)}}function Yx(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Nt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Ft(t,e)}else{if(Nt(t,n))return;bd.set(n),i.uniformMatrix2fv(this.addr,!1,bd),Ft(t,n)}}function Zx(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Nt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Ft(t,e)}else{if(Nt(t,n))return;_d.set(n),i.uniformMatrix3fv(this.addr,!1,_d),Ft(t,n)}}function Kx(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Nt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Ft(t,e)}else{if(Nt(t,n))return;yd.set(n),i.uniformMatrix4fv(this.addr,!1,yd),Ft(t,n)}}function Jx(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function jx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Nt(t,e))return;i.uniform2iv(this.addr,e),Ft(t,e)}}function Qx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Nt(t,e))return;i.uniform3iv(this.addr,e),Ft(t,e)}}function ev(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Nt(t,e))return;i.uniform4iv(this.addr,e),Ft(t,e)}}function tv(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function nv(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Nt(t,e))return;i.uniform2uiv(this.addr,e),Ft(t,e)}}function iv(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Nt(t,e))return;i.uniform3uiv(this.addr,e),Ft(t,e)}}function sv(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Nt(t,e))return;i.uniform4uiv(this.addr,e),Ft(t,e)}}function rv(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(gd.compareFunction=Zd,r=gd):r=ef,t.setTexture2D(e||r,s)}function av(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||nf,s)}function ov(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||sf,s)}function lv(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||tf,s)}function cv(i){switch(i){case 5126:return Wx;case 35664:return Xx;case 35665:return qx;case 35666:return $x;case 35674:return Yx;case 35675:return Zx;case 35676:return Kx;case 5124:case 35670:return Jx;case 35667:case 35671:return jx;case 35668:case 35672:return Qx;case 35669:case 35673:return ev;case 5125:return tv;case 36294:return nv;case 36295:return iv;case 36296:return sv;case 35678:case 36198:case 36298:case 36306:case 35682:return rv;case 35679:case 36299:case 36307:return av;case 35680:case 36300:case 36308:case 36293:return ov;case 36289:case 36303:case 36311:case 36292:return lv}}function hv(i,e){i.uniform1fv(this.addr,e)}function uv(i,e){let t=ir(e,this.size,2);i.uniform2fv(this.addr,t)}function dv(i,e){let t=ir(e,this.size,3);i.uniform3fv(this.addr,t)}function fv(i,e){let t=ir(e,this.size,4);i.uniform4fv(this.addr,t)}function pv(i,e){let t=ir(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function mv(i,e){let t=ir(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function gv(i,e){let t=ir(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function xv(i,e){i.uniform1iv(this.addr,e)}function vv(i,e){i.uniform2iv(this.addr,e)}function yv(i,e){i.uniform3iv(this.addr,e)}function _v(i,e){i.uniform4iv(this.addr,e)}function bv(i,e){i.uniform1uiv(this.addr,e)}function Mv(i,e){i.uniform2uiv(this.addr,e)}function Sv(i,e){i.uniform3uiv(this.addr,e)}function wv(i,e){i.uniform4uiv(this.addr,e)}function Av(i,e,t){let n=this.cache,s=e.length,r=So(t,s);Nt(n,r)||(i.uniform1iv(this.addr,r),Ft(n,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||ef,r[o])}function Tv(i,e,t){let n=this.cache,s=e.length,r=So(t,s);Nt(n,r)||(i.uniform1iv(this.addr,r),Ft(n,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||nf,r[o])}function Ev(i,e,t){let n=this.cache,s=e.length,r=So(t,s);Nt(n,r)||(i.uniform1iv(this.addr,r),Ft(n,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||sf,r[o])}function Cv(i,e,t){let n=this.cache,s=e.length,r=So(t,s);Nt(n,r)||(i.uniform1iv(this.addr,r),Ft(n,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||tf,r[o])}function Rv(i){switch(i){case 5126:return hv;case 35664:return uv;case 35665:return dv;case 35666:return fv;case 35674:return pv;case 35675:return mv;case 35676:return gv;case 5124:case 35670:return xv;case 35667:case 35671:return vv;case 35668:case 35672:return yv;case 35669:case 35673:return _v;case 5125:return bv;case 36294:return Mv;case 36295:return Sv;case 36296:return wv;case 35678:case 36198:case 36298:case 36306:case 35682:return Av;case 35679:case 36299:case 36307:return Tv;case 35680:case 36300:case 36308:case 36293:return Ev;case 36289:case 36303:case 36311:case 36292:return Cv}}var qc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=cv(t.type)}},$c=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Rv(t.type)}},Yc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],n)}}},Kl=/(\w+)(\])?(\[|\.)?/g;function Md(i,e){i.seq.push(e),i.map[e.id]=e}function Pv(i,e,t){let n=i.name,s=n.length;for(Kl.lastIndex=0;;){let r=Kl.exec(n),o=Kl.lastIndex,a=r[1],l=r[2]==="]",h=r[3];if(l&&(a=a|0),h===void 0||h==="["&&o+2===s){Md(t,h===void 0?new qc(a,i,e):new $c(a,i,e));break}else{let u=t.map[a];u===void 0&&(u=new Yc(a),Md(t,u)),t=u}}}var $s=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);Pv(r,o,this)}}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&n.push(o)}return n}};function Sd(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var Iv=37297,Lv=0;function Dv(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}var wd=new Le;function Uv(i){Je._getMatrix(wd,Je.workingColorSpace,i);let e=`mat3( ${wd.elements.map(t=>t.toFixed(4))} )`;switch(Je.getTransfer(i)){case Mo:return[e,"LinearTransferOETF"];case dt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Ad(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),s=i.getShaderInfoLog(e).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+Dv(i.getShaderSource(e),o)}else return s}function Nv(i,e){let t=Uv(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Fv(i,e){let t;switch(e){case lm:t="Linear";break;case cm:t="Reinhard";break;case hm:t="Cineon";break;case um:t="ACESFilmic";break;case fm:t="AgX";break;case xh:t="Neutral";break;case dm:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var za=new D;function kv(){Je.getLuminanceCoefficients(za);let i=za.x.toFixed(4),e=za.y.toFixed(4),t=za.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Bv(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Br).join(`
`)}function Ov(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function zv(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:i.getAttribLocation(e,o),locationSize:a}}return t}function Br(i){return i!==""}function Td(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Ed(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Hv=/^[ \t]*#include +<([\w\d./]+)>/gm;function Zc(i){return i.replace(Hv,Gv)}var Vv=new Map;function Gv(i,e){let t=Oe[e];if(t===void 0){let n=Vv.get(e);if(n!==void 0)t=Oe[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return Zc(t)}var Wv=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Cd(i){return i.replace(Wv,Xv)}function Xv(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Rd(i){let e=`precision ${i.precision} float;
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
#define LOW_PRECISION`),e}function qv(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===yo?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===gh?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===hi&&(e="SHADOWMAP_TYPE_VSM"),e}function $v(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Zs:case Ks:e="ENVMAP_TYPE_CUBE";break;case bo:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Yv(i){let e="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===Ks&&(e="ENVMAP_MODE_REFRACTION"),e}function Zv(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case _o:e="ENVMAP_BLENDING_MULTIPLY";break;case am:e="ENVMAP_BLENDING_MIX";break;case om:e="ENVMAP_BLENDING_ADD";break}return e}function Kv(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Jv(i,e,t,n){let s=i.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,l=qv(t),h=$v(t),c=Yv(t),u=Zv(t),d=Kv(t),m=Bv(t),g=Ov(r),x=s.createProgram(),p,f,S=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Br).join(`
`),p.length>0&&(p+=`
`),f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Br).join(`
`),f.length>0&&(f+=`
`)):(p=[Rd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Br).join(`
`),f=[Rd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Bi?"#define TONE_MAPPING":"",t.toneMapping!==Bi?Oe.tonemapping_pars_fragment:"",t.toneMapping!==Bi?Fv("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Oe.colorspace_pars_fragment,Nv("linearToOutputTexel",t.outputColorSpace),kv(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Br).join(`
`)),o=Zc(o),o=Td(o,t),o=Ed(o,t),a=Zc(a),a=Td(a,t),a=Ed(a,t),o=Cd(o),a=Cd(a),t.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,f=["#define varying in",t.glslVersion===Gu?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Gu?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let w=S+p+o,y=S+f+a,L=Sd(s,s.VERTEX_SHADER,w),C=Sd(s,s.FRAGMENT_SHADER,y);s.attachShader(x,L),s.attachShader(x,C),t.index0AttributeName!==void 0?s.bindAttribLocation(x,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function A(I){if(i.debug.checkShaderErrors){let H=s.getProgramInfoLog(x).trim(),R=s.getShaderInfoLog(L).trim(),O=s.getShaderInfoLog(C).trim(),z=!0,B=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(z=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,L,C);else{let Z=Ad(s,L,"vertex"),G=Ad(s,C,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+H+`
`+Z+`
`+G)}else H!==""?console.warn("THREE.WebGLProgram: Program Info Log:",H):(R===""||O==="")&&(B=!1);B&&(I.diagnostics={runnable:z,programLog:H,vertexShader:{log:R,prefix:p},fragmentShader:{log:O,prefix:f}})}s.deleteShader(L),s.deleteShader(C),E=new $s(s,x),v=zv(s,x)}let E;this.getUniforms=function(){return E===void 0&&A(this),E};let v;this.getAttributes=function(){return v===void 0&&A(this),v};let _=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return _===!1&&(_=s.getProgramParameter(x,Iv)),_},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Lv++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=L,this.fragmentShader=C,this}var jv=0,Kc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Jc(e),t.set(e,n)),n}},Jc=class{constructor(e){this.id=jv++,this.code=e,this.usedTimes=0}};function Qv(i,e,t,n,s,r,o){let a=new Qa,l=new Kc,h=new Set,c=[],u=s.logarithmicDepthBuffer,d=s.vertexTextures,m=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(v){return h.add(v),v===0?"uv":`uv${v}`}function p(v,_,I,H,R){let O=H.fog,z=R.geometry,B=v.isMeshStandardMaterial?H.environment:null,Z=(v.isMeshStandardMaterial?t:e).get(v.envMap||B),G=Z&&Z.mapping===bo?Z.image.height:null,se=g[v.type];v.precision!==null&&(m=s.getMaxPrecision(v.precision),m!==v.precision&&console.warn("THREE.WebGLProgram.getParameters:",v.precision,"not supported, using",m,"instead."));let ee=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,fe=ee!==void 0?ee.length:0,Ue=0;z.morphAttributes.position!==void 0&&(Ue=1),z.morphAttributes.normal!==void 0&&(Ue=2),z.morphAttributes.color!==void 0&&(Ue=3);let et,$,ie,be;if(se){let ot=$n[se];et=ot.vertexShader,$=ot.fragmentShader}else et=v.vertexShader,$=v.fragmentShader,l.update(v),ie=l.getVertexShaderID(v),be=l.getFragmentShaderID(v);let le=i.getRenderTarget(),Re=i.state.buffers.depth.getReversed(),Ne=R.isInstancedMesh===!0,ze=R.isBatchedMesh===!0,Et=!!v.map,Ze=!!v.matcap,Rt=!!Z,k=!!v.aoMap,wn=!!v.lightMap,qe=!!v.bumpMap,$e=!!v.normalMap,Ee=!!v.displacementMap,_t=!!v.emissiveMap,Ae=!!v.metalnessMap,T=!!v.roughnessMap,b=v.anisotropy>0,V=v.clearcoat>0,K=v.dispersion>0,j=v.iridescence>0,Y=v.sheen>0,Me=v.transmission>0,ce=b&&!!v.anisotropyMap,pe=V&&!!v.clearcoatMap,Ke=V&&!!v.clearcoatNormalMap,te=V&&!!v.clearcoatRoughnessMap,me=j&&!!v.iridescenceMap,Ce=j&&!!v.iridescenceThicknessMap,Pe=Y&&!!v.sheenColorMap,ge=Y&&!!v.sheenRoughnessMap,Ye=!!v.specularMap,Be=!!v.specularColorMap,pt=!!v.specularIntensityMap,U=Me&&!!v.transmissionMap,oe=Me&&!!v.thicknessMap,q=!!v.gradientMap,J=!!v.alphaMap,de=v.alphaTest>0,he=!!v.alphaHash,Fe=!!v.extensions,Ct=Bi;v.toneMapped&&(le===null||le.isXRRenderTarget===!0)&&(Ct=i.toneMapping);let Yt={shaderID:se,shaderType:v.type,shaderName:v.name,vertexShader:et,fragmentShader:$,defines:v.defines,customVertexShaderID:ie,customFragmentShaderID:be,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:m,batching:ze,batchingColor:ze&&R._colorsTexture!==null,instancing:Ne,instancingColor:Ne&&R.instanceColor!==null,instancingMorph:Ne&&R.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:le===null?i.outputColorSpace:le.isXRRenderTarget===!0?le.texture.colorSpace:nr,alphaToCoverage:!!v.alphaToCoverage,map:Et,matcap:Ze,envMap:Rt,envMapMode:Rt&&Z.mapping,envMapCubeUVHeight:G,aoMap:k,lightMap:wn,bumpMap:qe,normalMap:$e,displacementMap:d&&Ee,emissiveMap:_t,normalMapObjectSpace:$e&&v.normalMapType===xm,normalMapTangentSpace:$e&&v.normalMapType===Ah,metalnessMap:Ae,roughnessMap:T,anisotropy:b,anisotropyMap:ce,clearcoat:V,clearcoatMap:pe,clearcoatNormalMap:Ke,clearcoatRoughnessMap:te,dispersion:K,iridescence:j,iridescenceMap:me,iridescenceThicknessMap:Ce,sheen:Y,sheenColorMap:Pe,sheenRoughnessMap:ge,specularMap:Ye,specularColorMap:Be,specularIntensityMap:pt,transmission:Me,transmissionMap:U,thicknessMap:oe,gradientMap:q,opaque:v.transparent===!1&&v.blending===Ws&&v.alphaToCoverage===!1,alphaMap:J,alphaTest:de,alphaHash:he,combine:v.combine,mapUv:Et&&x(v.map.channel),aoMapUv:k&&x(v.aoMap.channel),lightMapUv:wn&&x(v.lightMap.channel),bumpMapUv:qe&&x(v.bumpMap.channel),normalMapUv:$e&&x(v.normalMap.channel),displacementMapUv:Ee&&x(v.displacementMap.channel),emissiveMapUv:_t&&x(v.emissiveMap.channel),metalnessMapUv:Ae&&x(v.metalnessMap.channel),roughnessMapUv:T&&x(v.roughnessMap.channel),anisotropyMapUv:ce&&x(v.anisotropyMap.channel),clearcoatMapUv:pe&&x(v.clearcoatMap.channel),clearcoatNormalMapUv:Ke&&x(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:te&&x(v.clearcoatRoughnessMap.channel),iridescenceMapUv:me&&x(v.iridescenceMap.channel),iridescenceThicknessMapUv:Ce&&x(v.iridescenceThicknessMap.channel),sheenColorMapUv:Pe&&x(v.sheenColorMap.channel),sheenRoughnessMapUv:ge&&x(v.sheenRoughnessMap.channel),specularMapUv:Ye&&x(v.specularMap.channel),specularColorMapUv:Be&&x(v.specularColorMap.channel),specularIntensityMapUv:pt&&x(v.specularIntensityMap.channel),transmissionMapUv:U&&x(v.transmissionMap.channel),thicknessMapUv:oe&&x(v.thicknessMap.channel),alphaMapUv:J&&x(v.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&($e||b),vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,pointsUvs:R.isPoints===!0&&!!z.attributes.uv&&(Et||J),fog:!!O,useFog:v.fog===!0,fogExp2:!!O&&O.isFogExp2,flatShading:v.flatShading===!0,sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:Re,skinning:R.isSkinnedMesh===!0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:fe,morphTextureStride:Ue,numDirLights:_.directional.length,numPointLights:_.point.length,numSpotLights:_.spot.length,numSpotLightMaps:_.spotLightMap.length,numRectAreaLights:_.rectArea.length,numHemiLights:_.hemi.length,numDirLightShadows:_.directionalShadowMap.length,numPointLightShadows:_.pointShadowMap.length,numSpotLightShadows:_.spotShadowMap.length,numSpotLightShadowsWithMaps:_.numSpotLightShadowsWithMaps,numLightProbes:_.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:v.dithering,shadowMapEnabled:i.shadowMap.enabled&&I.length>0,shadowMapType:i.shadowMap.type,toneMapping:Ct,decodeVideoTexture:Et&&v.map.isVideoTexture===!0&&Je.getTransfer(v.map.colorSpace)===dt,decodeVideoTextureEmissive:_t&&v.emissiveMap.isVideoTexture===!0&&Je.getTransfer(v.emissiveMap.colorSpace)===dt,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===Cn,flipSided:v.side===dn,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:Fe&&v.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Fe&&v.extensions.multiDraw===!0||ze)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return Yt.vertexUv1s=h.has(1),Yt.vertexUv2s=h.has(2),Yt.vertexUv3s=h.has(3),h.clear(),Yt}function f(v){let _=[];if(v.shaderID?_.push(v.shaderID):(_.push(v.customVertexShaderID),_.push(v.customFragmentShaderID)),v.defines!==void 0)for(let I in v.defines)_.push(I),_.push(v.defines[I]);return v.isRawShaderMaterial===!1&&(S(_,v),w(_,v),_.push(i.outputColorSpace)),_.push(v.customProgramCacheKey),_.join()}function S(v,_){v.push(_.precision),v.push(_.outputColorSpace),v.push(_.envMapMode),v.push(_.envMapCubeUVHeight),v.push(_.mapUv),v.push(_.alphaMapUv),v.push(_.lightMapUv),v.push(_.aoMapUv),v.push(_.bumpMapUv),v.push(_.normalMapUv),v.push(_.displacementMapUv),v.push(_.emissiveMapUv),v.push(_.metalnessMapUv),v.push(_.roughnessMapUv),v.push(_.anisotropyMapUv),v.push(_.clearcoatMapUv),v.push(_.clearcoatNormalMapUv),v.push(_.clearcoatRoughnessMapUv),v.push(_.iridescenceMapUv),v.push(_.iridescenceThicknessMapUv),v.push(_.sheenColorMapUv),v.push(_.sheenRoughnessMapUv),v.push(_.specularMapUv),v.push(_.specularColorMapUv),v.push(_.specularIntensityMapUv),v.push(_.transmissionMapUv),v.push(_.thicknessMapUv),v.push(_.combine),v.push(_.fogExp2),v.push(_.sizeAttenuation),v.push(_.morphTargetsCount),v.push(_.morphAttributeCount),v.push(_.numDirLights),v.push(_.numPointLights),v.push(_.numSpotLights),v.push(_.numSpotLightMaps),v.push(_.numHemiLights),v.push(_.numRectAreaLights),v.push(_.numDirLightShadows),v.push(_.numPointLightShadows),v.push(_.numSpotLightShadows),v.push(_.numSpotLightShadowsWithMaps),v.push(_.numLightProbes),v.push(_.shadowMapType),v.push(_.toneMapping),v.push(_.numClippingPlanes),v.push(_.numClipIntersection),v.push(_.depthPacking)}function w(v,_){a.disableAll(),_.supportsVertexTextures&&a.enable(0),_.instancing&&a.enable(1),_.instancingColor&&a.enable(2),_.instancingMorph&&a.enable(3),_.matcap&&a.enable(4),_.envMap&&a.enable(5),_.normalMapObjectSpace&&a.enable(6),_.normalMapTangentSpace&&a.enable(7),_.clearcoat&&a.enable(8),_.iridescence&&a.enable(9),_.alphaTest&&a.enable(10),_.vertexColors&&a.enable(11),_.vertexAlphas&&a.enable(12),_.vertexUv1s&&a.enable(13),_.vertexUv2s&&a.enable(14),_.vertexUv3s&&a.enable(15),_.vertexTangents&&a.enable(16),_.anisotropy&&a.enable(17),_.alphaHash&&a.enable(18),_.batching&&a.enable(19),_.dispersion&&a.enable(20),_.batchingColor&&a.enable(21),v.push(a.mask),a.disableAll(),_.fog&&a.enable(0),_.useFog&&a.enable(1),_.flatShading&&a.enable(2),_.logarithmicDepthBuffer&&a.enable(3),_.reverseDepthBuffer&&a.enable(4),_.skinning&&a.enable(5),_.morphTargets&&a.enable(6),_.morphNormals&&a.enable(7),_.morphColors&&a.enable(8),_.premultipliedAlpha&&a.enable(9),_.shadowMapEnabled&&a.enable(10),_.doubleSided&&a.enable(11),_.flipSided&&a.enable(12),_.useDepthPacking&&a.enable(13),_.dithering&&a.enable(14),_.transmission&&a.enable(15),_.sheen&&a.enable(16),_.opaque&&a.enable(17),_.pointsUvs&&a.enable(18),_.decodeVideoTexture&&a.enable(19),_.decodeVideoTextureEmissive&&a.enable(20),_.alphaToCoverage&&a.enable(21),v.push(a.mask)}function y(v){let _=g[v.type],I;if(_){let H=$n[_];I=Gm.clone(H.uniforms)}else I=v.uniforms;return I}function L(v,_){let I;for(let H=0,R=c.length;H<R;H++){let O=c[H];if(O.cacheKey===_){I=O,++I.usedTimes;break}}return I===void 0&&(I=new Jv(i,_,v,r),c.push(I)),I}function C(v){if(--v.usedTimes===0){let _=c.indexOf(v);c[_]=c[c.length-1],c.pop(),v.destroy()}}function A(v){l.remove(v)}function E(){l.dispose()}return{getParameters:p,getProgramCacheKey:f,getUniforms:y,acquireProgram:L,releaseProgram:C,releaseShaderCache:A,programs:c,dispose:E}}function ey(){let i=new WeakMap;function e(o){return i.has(o)}function t(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function ty(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function Pd(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Id(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function o(u,d,m,g,x,p){let f=i[e];return f===void 0?(f={id:u.id,object:u,geometry:d,material:m,groupOrder:g,renderOrder:u.renderOrder,z:x,group:p},i[e]=f):(f.id=u.id,f.object=u,f.geometry=d,f.material=m,f.groupOrder=g,f.renderOrder=u.renderOrder,f.z=x,f.group=p),e++,f}function a(u,d,m,g,x,p){let f=o(u,d,m,g,x,p);m.transmission>0?n.push(f):m.transparent===!0?s.push(f):t.push(f)}function l(u,d,m,g,x,p){let f=o(u,d,m,g,x,p);m.transmission>0?n.unshift(f):m.transparent===!0?s.unshift(f):t.unshift(f)}function h(u,d){t.length>1&&t.sort(u||ty),n.length>1&&n.sort(d||Pd),s.length>1&&s.sort(d||Pd)}function c(){for(let u=e,d=i.length;u<d;u++){let m=i[u];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:c,sort:h}}function ny(){let i=new WeakMap;function e(n,s){let r=i.get(n),o;return r===void 0?(o=new Id,i.set(n,[o])):s>=r.length?(o=new Id,r.push(o)):o=r[s],o}function t(){i=new WeakMap}return{get:e,dispose:t}}function iy(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new D,color:new xe};break;case"SpotLight":t={position:new D,direction:new D,color:new xe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new D,color:new xe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new D,skyColor:new xe,groundColor:new xe};break;case"RectAreaLight":t={color:new xe,position:new D,halfWidth:new D,halfHeight:new D};break}return i[e.id]=t,t}}}function sy(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new He};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new He};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new He,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var ry=0;function ay(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function oy(i){let e=new iy,t=sy(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)n.probe.push(new D);let s=new D,r=new Ve,o=new Ve;function a(h){let c=0,u=0,d=0;for(let v=0;v<9;v++)n.probe[v].set(0,0,0);let m=0,g=0,x=0,p=0,f=0,S=0,w=0,y=0,L=0,C=0,A=0;h.sort(ay);for(let v=0,_=h.length;v<_;v++){let I=h[v],H=I.color,R=I.intensity,O=I.distance,z=I.shadow&&I.shadow.map?I.shadow.map.texture:null;if(I.isAmbientLight)c+=H.r*R,u+=H.g*R,d+=H.b*R;else if(I.isLightProbe){for(let B=0;B<9;B++)n.probe[B].addScaledVector(I.sh.coefficients[B],R);A++}else if(I.isDirectionalLight){let B=e.get(I);if(B.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let Z=I.shadow,G=t.get(I);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,n.directionalShadow[m]=G,n.directionalShadowMap[m]=z,n.directionalShadowMatrix[m]=I.shadow.matrix,S++}n.directional[m]=B,m++}else if(I.isSpotLight){let B=e.get(I);B.position.setFromMatrixPosition(I.matrixWorld),B.color.copy(H).multiplyScalar(R),B.distance=O,B.coneCos=Math.cos(I.angle),B.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),B.decay=I.decay,n.spot[x]=B;let Z=I.shadow;if(I.map&&(n.spotLightMap[L]=I.map,L++,Z.updateMatrices(I),I.castShadow&&C++),n.spotLightMatrix[x]=Z.matrix,I.castShadow){let G=t.get(I);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,n.spotShadow[x]=G,n.spotShadowMap[x]=z,y++}x++}else if(I.isRectAreaLight){let B=e.get(I);B.color.copy(H).multiplyScalar(R),B.halfWidth.set(I.width*.5,0,0),B.halfHeight.set(0,I.height*.5,0),n.rectArea[p]=B,p++}else if(I.isPointLight){let B=e.get(I);if(B.color.copy(I.color).multiplyScalar(I.intensity),B.distance=I.distance,B.decay=I.decay,I.castShadow){let Z=I.shadow,G=t.get(I);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,G.shadowCameraNear=Z.camera.near,G.shadowCameraFar=Z.camera.far,n.pointShadow[g]=G,n.pointShadowMap[g]=z,n.pointShadowMatrix[g]=I.shadow.matrix,w++}n.point[g]=B,g++}else if(I.isHemisphereLight){let B=e.get(I);B.skyColor.copy(I.color).multiplyScalar(R),B.groundColor.copy(I.groundColor).multiplyScalar(R),n.hemi[f]=B,f++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=re.LTC_FLOAT_1,n.rectAreaLTC2=re.LTC_FLOAT_2):(n.rectAreaLTC1=re.LTC_HALF_1,n.rectAreaLTC2=re.LTC_HALF_2)),n.ambient[0]=c,n.ambient[1]=u,n.ambient[2]=d;let E=n.hash;(E.directionalLength!==m||E.pointLength!==g||E.spotLength!==x||E.rectAreaLength!==p||E.hemiLength!==f||E.numDirectionalShadows!==S||E.numPointShadows!==w||E.numSpotShadows!==y||E.numSpotMaps!==L||E.numLightProbes!==A)&&(n.directional.length=m,n.spot.length=x,n.rectArea.length=p,n.point.length=g,n.hemi.length=f,n.directionalShadow.length=S,n.directionalShadowMap.length=S,n.pointShadow.length=w,n.pointShadowMap.length=w,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=S,n.pointShadowMatrix.length=w,n.spotLightMatrix.length=y+L-C,n.spotLightMap.length=L,n.numSpotLightShadowsWithMaps=C,n.numLightProbes=A,E.directionalLength=m,E.pointLength=g,E.spotLength=x,E.rectAreaLength=p,E.hemiLength=f,E.numDirectionalShadows=S,E.numPointShadows=w,E.numSpotShadows=y,E.numSpotMaps=L,E.numLightProbes=A,n.version=ry++)}function l(h,c){let u=0,d=0,m=0,g=0,x=0,p=c.matrixWorldInverse;for(let f=0,S=h.length;f<S;f++){let w=h[f];if(w.isDirectionalLight){let y=n.directional[u];y.direction.setFromMatrixPosition(w.matrixWorld),s.setFromMatrixPosition(w.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(p),u++}else if(w.isSpotLight){let y=n.spot[m];y.position.setFromMatrixPosition(w.matrixWorld),y.position.applyMatrix4(p),y.direction.setFromMatrixPosition(w.matrixWorld),s.setFromMatrixPosition(w.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(p),m++}else if(w.isRectAreaLight){let y=n.rectArea[g];y.position.setFromMatrixPosition(w.matrixWorld),y.position.applyMatrix4(p),o.identity(),r.copy(w.matrixWorld),r.premultiply(p),o.extractRotation(r),y.halfWidth.set(w.width*.5,0,0),y.halfHeight.set(0,w.height*.5,0),y.halfWidth.applyMatrix4(o),y.halfHeight.applyMatrix4(o),g++}else if(w.isPointLight){let y=n.point[d];y.position.setFromMatrixPosition(w.matrixWorld),y.position.applyMatrix4(p),d++}else if(w.isHemisphereLight){let y=n.hemi[x];y.direction.setFromMatrixPosition(w.matrixWorld),y.direction.transformDirection(p),x++}}}return{setup:a,setupView:l,state:n}}function Ld(i){let e=new oy(i),t=[],n=[];function s(c){h.camera=c,t.length=0,n.length=0}function r(c){t.push(c)}function o(c){n.push(c)}function a(){e.setup(t)}function l(c){e.setupView(t,c)}let h={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:h,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function ly(i){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new Ld(i),e.set(s,[a])):r>=o.length?(a=new Ld(i),o.push(a)):a=o[r],a}function n(){e=new WeakMap}return{get:t,dispose:n}}var jc=class extends Hi{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=mm,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Qc=class extends Hi{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},cy=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,hy=`uniform sampler2D shadow_pass;
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
}`;function uy(i,e,t){let n=new Vr,s=new He,r=new He,o=new ft,a=new jc({depthPacking:gm}),l=new Qc,h={},c=t.maxTextureSize,u={[Oi]:dn,[dn]:Oi,[Cn]:Cn},d=new Kn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new He},radius:{value:4}},vertexShader:cy,fragmentShader:hy}),m=d.clone();m.defines.HORIZONTAL_PASS=1;let g=new rn;g.setAttribute("position",new yn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new wt(g,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=yo;let f=this.type;this.render=function(C,A,E){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||C.length===0)return;let v=i.getRenderTarget(),_=i.getActiveCubeFace(),I=i.getActiveMipmapLevel(),H=i.state;H.setBlending(ki),H.buffers.color.setClear(1,1,1,1),H.buffers.depth.setTest(!0),H.setScissorTest(!1);let R=f!==hi&&this.type===hi,O=f===hi&&this.type!==hi;for(let z=0,B=C.length;z<B;z++){let Z=C[z],G=Z.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",Z,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;s.copy(G.mapSize);let se=G.getFrameExtents();if(s.multiply(se),r.copy(G.mapSize),(s.x>c||s.y>c)&&(s.x>c&&(r.x=Math.floor(c/se.x),s.x=r.x*se.x,G.mapSize.x=r.x),s.y>c&&(r.y=Math.floor(c/se.y),s.y=r.y*se.y,G.mapSize.y=r.y)),G.map===null||R===!0||O===!0){let fe=this.type!==hi?{minFilter:vn,magFilter:vn}:{};G.map!==null&&G.map.dispose(),G.map=new mi(s.x,s.y,fe),G.map.texture.name=Z.name+".shadowMap",G.camera.updateProjectionMatrix()}i.setRenderTarget(G.map),i.clear();let ee=G.getViewportCount();for(let fe=0;fe<ee;fe++){let Ue=G.getViewport(fe);o.set(r.x*Ue.x,r.y*Ue.y,r.x*Ue.z,r.y*Ue.w),H.viewport(o),G.updateMatrices(Z,fe),n=G.getFrustum(),y(A,E,G.camera,Z,this.type)}G.isPointLightShadow!==!0&&this.type===hi&&S(G,E),G.needsUpdate=!1}f=this.type,p.needsUpdate=!1,i.setRenderTarget(v,_,I)};function S(C,A){let E=e.update(x);d.defines.VSM_SAMPLES!==C.blurSamples&&(d.defines.VSM_SAMPLES=C.blurSamples,m.defines.VSM_SAMPLES=C.blurSamples,d.needsUpdate=!0,m.needsUpdate=!0),C.mapPass===null&&(C.mapPass=new mi(s.x,s.y)),d.uniforms.shadow_pass.value=C.map.texture,d.uniforms.resolution.value=C.mapSize,d.uniforms.radius.value=C.radius,i.setRenderTarget(C.mapPass),i.clear(),i.renderBufferDirect(A,null,E,d,x,null),m.uniforms.shadow_pass.value=C.mapPass.texture,m.uniforms.resolution.value=C.mapSize,m.uniforms.radius.value=C.radius,i.setRenderTarget(C.map),i.clear(),i.renderBufferDirect(A,null,E,m,x,null)}function w(C,A,E,v){let _=null,I=E.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(I!==void 0)_=I;else if(_=E.isPointLight===!0?l:a,i.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){let H=_.uuid,R=A.uuid,O=h[H];O===void 0&&(O={},h[H]=O);let z=O[R];z===void 0&&(z=_.clone(),O[R]=z,A.addEventListener("dispose",L)),_=z}if(_.visible=A.visible,_.wireframe=A.wireframe,v===hi?_.side=A.shadowSide!==null?A.shadowSide:A.side:_.side=A.shadowSide!==null?A.shadowSide:u[A.side],_.alphaMap=A.alphaMap,_.alphaTest=A.alphaTest,_.map=A.map,_.clipShadows=A.clipShadows,_.clippingPlanes=A.clippingPlanes,_.clipIntersection=A.clipIntersection,_.displacementMap=A.displacementMap,_.displacementScale=A.displacementScale,_.displacementBias=A.displacementBias,_.wireframeLinewidth=A.wireframeLinewidth,_.linewidth=A.linewidth,E.isPointLight===!0&&_.isMeshDistanceMaterial===!0){let H=i.properties.get(_);H.light=E}return _}function y(C,A,E,v,_){if(C.visible===!1)return;if(C.layers.test(A.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&_===hi)&&(!C.frustumCulled||n.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices(E.matrixWorldInverse,C.matrixWorld);let R=e.update(C),O=C.material;if(Array.isArray(O)){let z=R.groups;for(let B=0,Z=z.length;B<Z;B++){let G=z[B],se=O[G.materialIndex];if(se&&se.visible){let ee=w(C,se,v,_);C.onBeforeShadow(i,C,A,E,R,ee,G),i.renderBufferDirect(E,null,R,ee,C,G),C.onAfterShadow(i,C,A,E,R,ee,G)}}}else if(O.visible){let z=w(C,O,v,_);C.onBeforeShadow(i,C,A,E,R,z,null),i.renderBufferDirect(E,null,R,z,C,null),C.onAfterShadow(i,C,A,E,R,z,null)}}let H=C.children;for(let R=0,O=H.length;R<O;R++)y(H[R],A,E,v,_)}function L(C){C.target.removeEventListener("dispose",L);for(let E in h){let v=h[E],_=C.target.uuid;_ in v&&(v[_].dispose(),delete v[_])}}}var dy={[tc]:nc,[ic]:ac,[sc]:oc,[Ys]:rc,[nc]:tc,[ac]:ic,[oc]:sc,[rc]:Ys};function fy(i,e){function t(){let U=!1,oe=new ft,q=null,J=new ft(0,0,0,0);return{setMask:function(de){q!==de&&!U&&(i.colorMask(de,de,de,de),q=de)},setLocked:function(de){U=de},setClear:function(de,he,Fe,Ct,Yt){Yt===!0&&(de*=Ct,he*=Ct,Fe*=Ct),oe.set(de,he,Fe,Ct),J.equals(oe)===!1&&(i.clearColor(de,he,Fe,Ct),J.copy(oe))},reset:function(){U=!1,q=null,J.set(-1,0,0,0)}}}function n(){let U=!1,oe=!1,q=null,J=null,de=null;return{setReversed:function(he){if(oe!==he){let Fe=e.get("EXT_clip_control");oe?Fe.clipControlEXT(Fe.LOWER_LEFT_EXT,Fe.ZERO_TO_ONE_EXT):Fe.clipControlEXT(Fe.LOWER_LEFT_EXT,Fe.NEGATIVE_ONE_TO_ONE_EXT);let Ct=de;de=null,this.setClear(Ct)}oe=he},getReversed:function(){return oe},setTest:function(he){he?le(i.DEPTH_TEST):Re(i.DEPTH_TEST)},setMask:function(he){q!==he&&!U&&(i.depthMask(he),q=he)},setFunc:function(he){if(oe&&(he=dy[he]),J!==he){switch(he){case tc:i.depthFunc(i.NEVER);break;case nc:i.depthFunc(i.ALWAYS);break;case ic:i.depthFunc(i.LESS);break;case Ys:i.depthFunc(i.LEQUAL);break;case sc:i.depthFunc(i.EQUAL);break;case rc:i.depthFunc(i.GEQUAL);break;case ac:i.depthFunc(i.GREATER);break;case oc:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}J=he}},setLocked:function(he){U=he},setClear:function(he){de!==he&&(oe&&(he=1-he),i.clearDepth(he),de=he)},reset:function(){U=!1,q=null,J=null,de=null,oe=!1}}}function s(){let U=!1,oe=null,q=null,J=null,de=null,he=null,Fe=null,Ct=null,Yt=null;return{setTest:function(ot){U||(ot?le(i.STENCIL_TEST):Re(i.STENCIL_TEST))},setMask:function(ot){oe!==ot&&!U&&(i.stencilMask(ot),oe=ot)},setFunc:function(ot,Un,ii){(q!==ot||J!==Un||de!==ii)&&(i.stencilFunc(ot,Un,ii),q=ot,J=Un,de=ii)},setOp:function(ot,Un,ii){(he!==ot||Fe!==Un||Ct!==ii)&&(i.stencilOp(ot,Un,ii),he=ot,Fe=Un,Ct=ii)},setLocked:function(ot){U=ot},setClear:function(ot){Yt!==ot&&(i.clearStencil(ot),Yt=ot)},reset:function(){U=!1,oe=null,q=null,J=null,de=null,he=null,Fe=null,Ct=null,Yt=null}}}let r=new t,o=new n,a=new s,l=new WeakMap,h=new WeakMap,c={},u={},d=new WeakMap,m=[],g=null,x=!1,p=null,f=null,S=null,w=null,y=null,L=null,C=null,A=new xe(0,0,0),E=0,v=!1,_=null,I=null,H=null,R=null,O=null,z=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),B=!1,Z=0,G=i.getParameter(i.VERSION);G.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(G)[1]),B=Z>=1):G.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),B=Z>=2);let se=null,ee={},fe=i.getParameter(i.SCISSOR_BOX),Ue=i.getParameter(i.VIEWPORT),et=new ft().fromArray(fe),$=new ft().fromArray(Ue);function ie(U,oe,q,J){let de=new Uint8Array(4),he=i.createTexture();i.bindTexture(U,he),i.texParameteri(U,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(U,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Fe=0;Fe<q;Fe++)U===i.TEXTURE_3D||U===i.TEXTURE_2D_ARRAY?i.texImage3D(oe,0,i.RGBA,1,1,J,0,i.RGBA,i.UNSIGNED_BYTE,de):i.texImage2D(oe+Fe,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,de);return he}let be={};be[i.TEXTURE_2D]=ie(i.TEXTURE_2D,i.TEXTURE_2D,1),be[i.TEXTURE_CUBE_MAP]=ie(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),be[i.TEXTURE_2D_ARRAY]=ie(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),be[i.TEXTURE_3D]=ie(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),le(i.DEPTH_TEST),o.setFunc(Ys),qe(!1),$e(Nu),le(i.CULL_FACE),k(ki);function le(U){c[U]!==!0&&(i.enable(U),c[U]=!0)}function Re(U){c[U]!==!1&&(i.disable(U),c[U]=!1)}function Ne(U,oe){return u[U]!==oe?(i.bindFramebuffer(U,oe),u[U]=oe,U===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=oe),U===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=oe),!0):!1}function ze(U,oe){let q=m,J=!1;if(U){q=d.get(oe),q===void 0&&(q=[],d.set(oe,q));let de=U.textures;if(q.length!==de.length||q[0]!==i.COLOR_ATTACHMENT0){for(let he=0,Fe=de.length;he<Fe;he++)q[he]=i.COLOR_ATTACHMENT0+he;q.length=de.length,J=!0}}else q[0]!==i.BACK&&(q[0]=i.BACK,J=!0);J&&i.drawBuffers(q)}function Et(U){return g!==U?(i.useProgram(U),g=U,!0):!1}let Ze={[ss]:i.FUNC_ADD,[Gp]:i.FUNC_SUBTRACT,[Wp]:i.FUNC_REVERSE_SUBTRACT};Ze[Xp]=i.MIN,Ze[qp]=i.MAX;let Rt={[$p]:i.ZERO,[Yp]:i.ONE,[Zp]:i.SRC_COLOR,[Ql]:i.SRC_ALPHA,[tm]:i.SRC_ALPHA_SATURATE,[Qp]:i.DST_COLOR,[Jp]:i.DST_ALPHA,[Kp]:i.ONE_MINUS_SRC_COLOR,[ec]:i.ONE_MINUS_SRC_ALPHA,[em]:i.ONE_MINUS_DST_COLOR,[jp]:i.ONE_MINUS_DST_ALPHA,[nm]:i.CONSTANT_COLOR,[im]:i.ONE_MINUS_CONSTANT_COLOR,[sm]:i.CONSTANT_ALPHA,[rm]:i.ONE_MINUS_CONSTANT_ALPHA};function k(U,oe,q,J,de,he,Fe,Ct,Yt,ot){if(U===ki){x===!0&&(Re(i.BLEND),x=!1);return}if(x===!1&&(le(i.BLEND),x=!0),U!==Vp){if(U!==p||ot!==v){if((f!==ss||y!==ss)&&(i.blendEquation(i.FUNC_ADD),f=ss,y=ss),ot)switch(U){case Ws:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case zr:i.blendFunc(i.ONE,i.ONE);break;case Fu:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case ku:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}else switch(U){case Ws:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case zr:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Fu:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case ku:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}S=null,w=null,L=null,C=null,A.set(0,0,0),E=0,p=U,v=ot}return}de=de||oe,he=he||q,Fe=Fe||J,(oe!==f||de!==y)&&(i.blendEquationSeparate(Ze[oe],Ze[de]),f=oe,y=de),(q!==S||J!==w||he!==L||Fe!==C)&&(i.blendFuncSeparate(Rt[q],Rt[J],Rt[he],Rt[Fe]),S=q,w=J,L=he,C=Fe),(Ct.equals(A)===!1||Yt!==E)&&(i.blendColor(Ct.r,Ct.g,Ct.b,Yt),A.copy(Ct),E=Yt),p=U,v=!1}function wn(U,oe){U.side===Cn?Re(i.CULL_FACE):le(i.CULL_FACE);let q=U.side===dn;oe&&(q=!q),qe(q),U.blending===Ws&&U.transparent===!1?k(ki):k(U.blending,U.blendEquation,U.blendSrc,U.blendDst,U.blendEquationAlpha,U.blendSrcAlpha,U.blendDstAlpha,U.blendColor,U.blendAlpha,U.premultipliedAlpha),o.setFunc(U.depthFunc),o.setTest(U.depthTest),o.setMask(U.depthWrite),r.setMask(U.colorWrite);let J=U.stencilWrite;a.setTest(J),J&&(a.setMask(U.stencilWriteMask),a.setFunc(U.stencilFunc,U.stencilRef,U.stencilFuncMask),a.setOp(U.stencilFail,U.stencilZFail,U.stencilZPass)),_t(U.polygonOffset,U.polygonOffsetFactor,U.polygonOffsetUnits),U.alphaToCoverage===!0?le(i.SAMPLE_ALPHA_TO_COVERAGE):Re(i.SAMPLE_ALPHA_TO_COVERAGE)}function qe(U){_!==U&&(U?i.frontFace(i.CW):i.frontFace(i.CCW),_=U)}function $e(U){U!==zp?(le(i.CULL_FACE),U!==I&&(U===Nu?i.cullFace(i.BACK):U===Hp?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Re(i.CULL_FACE),I=U}function Ee(U){U!==H&&(B&&i.lineWidth(U),H=U)}function _t(U,oe,q){U?(le(i.POLYGON_OFFSET_FILL),(R!==oe||O!==q)&&(i.polygonOffset(oe,q),R=oe,O=q)):Re(i.POLYGON_OFFSET_FILL)}function Ae(U){U?le(i.SCISSOR_TEST):Re(i.SCISSOR_TEST)}function T(U){U===void 0&&(U=i.TEXTURE0+z-1),se!==U&&(i.activeTexture(U),se=U)}function b(U,oe,q){q===void 0&&(se===null?q=i.TEXTURE0+z-1:q=se);let J=ee[q];J===void 0&&(J={type:void 0,texture:void 0},ee[q]=J),(J.type!==U||J.texture!==oe)&&(se!==q&&(i.activeTexture(q),se=q),i.bindTexture(U,oe||be[U]),J.type=U,J.texture=oe)}function V(){let U=ee[se];U!==void 0&&U.type!==void 0&&(i.bindTexture(U.type,null),U.type=void 0,U.texture=void 0)}function K(){try{i.compressedTexImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function j(){try{i.compressedTexImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Y(){try{i.texSubImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Me(){try{i.texSubImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ce(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function pe(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Ke(){try{i.texStorage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function te(){try{i.texStorage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function me(){try{i.texImage2D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Ce(){try{i.texImage3D.apply(i,arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Pe(U){et.equals(U)===!1&&(i.scissor(U.x,U.y,U.z,U.w),et.copy(U))}function ge(U){$.equals(U)===!1&&(i.viewport(U.x,U.y,U.z,U.w),$.copy(U))}function Ye(U,oe){let q=h.get(oe);q===void 0&&(q=new WeakMap,h.set(oe,q));let J=q.get(U);J===void 0&&(J=i.getUniformBlockIndex(oe,U.name),q.set(U,J))}function Be(U,oe){let J=h.get(oe).get(U);l.get(oe)!==J&&(i.uniformBlockBinding(oe,J,U.__bindingPointIndex),l.set(oe,J))}function pt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),c={},se=null,ee={},u={},d=new WeakMap,m=[],g=null,x=!1,p=null,f=null,S=null,w=null,y=null,L=null,C=null,A=new xe(0,0,0),E=0,v=!1,_=null,I=null,H=null,R=null,O=null,et.set(0,0,i.canvas.width,i.canvas.height),$.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:le,disable:Re,bindFramebuffer:Ne,drawBuffers:ze,useProgram:Et,setBlending:k,setMaterial:wn,setFlipSided:qe,setCullFace:$e,setLineWidth:Ee,setPolygonOffset:_t,setScissorTest:Ae,activeTexture:T,bindTexture:b,unbindTexture:V,compressedTexImage2D:K,compressedTexImage3D:j,texImage2D:me,texImage3D:Ce,updateUBOMapping:Ye,uniformBlockBinding:Be,texStorage2D:Ke,texStorage3D:te,texSubImage2D:Y,texSubImage3D:Me,compressedTexSubImage2D:ce,compressedTexSubImage3D:pe,scissor:Pe,viewport:ge,reset:pt}}function Dd(i,e,t,n){let s=py(n);switch(t){case Gd:return i*e;case Xd:return i*e;case qd:return i*e*2;case bh:return i*e/s.components*s.byteLength;case Mh:return i*e/s.components*s.byteLength;case $d:return i*e*2/s.components*s.byteLength;case Sh:return i*e*2/s.components*s.byteLength;case Wd:return i*e*3/s.components*s.byteLength;case On:return i*e*4/s.components*s.byteLength;case wh:return i*e*4/s.components*s.byteLength;case Ga:case Wa:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Xa:case qa:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case fc:case mc:return Math.max(i,16)*Math.max(e,8)/4;case dc:case pc:return Math.max(i,8)*Math.max(e,8)/2;case gc:case xc:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case vc:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case yc:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case _c:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case bc:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Mc:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case Sc:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case wc:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Ac:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case Tc:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Ec:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case Cc:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case Rc:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case Pc:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case Ic:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case Lc:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case $a:case Dc:case Uc:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Yd:case Nc:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Fc:case kc:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function py(i){switch(i){case pi:case zd:return{byteLength:1,components:1};case Hr:case Hd:case Xr:return{byteLength:2,components:1};case yh:case _h:return{byteLength:2,components:4};case cs:case vh:case Zn:return{byteLength:4,components:1};case Vd:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function my(i,e,t,n,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new He,c=new WeakMap,u,d=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(T,b){return m?new OffscreenCanvas(T,b):Ka("canvas")}function x(T,b,V){let K=1,j=Ae(T);if((j.width>V||j.height>V)&&(K=V/Math.max(j.width,j.height)),K<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){let Y=Math.floor(K*j.width),Me=Math.floor(K*j.height);u===void 0&&(u=g(Y,Me));let ce=b?g(Y,Me):u;return ce.width=Y,ce.height=Me,ce.getContext("2d").drawImage(T,0,0,Y,Me),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+j.width+"x"+j.height+") to ("+Y+"x"+Me+")."),ce}else return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+j.width+"x"+j.height+")."),T;return T}function p(T){return T.generateMipmaps}function f(T){i.generateMipmap(T)}function S(T){return T.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?i.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function w(T,b,V,K,j=!1){if(T!==null){if(i[T]!==void 0)return i[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let Y=b;if(b===i.RED&&(V===i.FLOAT&&(Y=i.R32F),V===i.HALF_FLOAT&&(Y=i.R16F),V===i.UNSIGNED_BYTE&&(Y=i.R8)),b===i.RED_INTEGER&&(V===i.UNSIGNED_BYTE&&(Y=i.R8UI),V===i.UNSIGNED_SHORT&&(Y=i.R16UI),V===i.UNSIGNED_INT&&(Y=i.R32UI),V===i.BYTE&&(Y=i.R8I),V===i.SHORT&&(Y=i.R16I),V===i.INT&&(Y=i.R32I)),b===i.RG&&(V===i.FLOAT&&(Y=i.RG32F),V===i.HALF_FLOAT&&(Y=i.RG16F),V===i.UNSIGNED_BYTE&&(Y=i.RG8)),b===i.RG_INTEGER&&(V===i.UNSIGNED_BYTE&&(Y=i.RG8UI),V===i.UNSIGNED_SHORT&&(Y=i.RG16UI),V===i.UNSIGNED_INT&&(Y=i.RG32UI),V===i.BYTE&&(Y=i.RG8I),V===i.SHORT&&(Y=i.RG16I),V===i.INT&&(Y=i.RG32I)),b===i.RGB_INTEGER&&(V===i.UNSIGNED_BYTE&&(Y=i.RGB8UI),V===i.UNSIGNED_SHORT&&(Y=i.RGB16UI),V===i.UNSIGNED_INT&&(Y=i.RGB32UI),V===i.BYTE&&(Y=i.RGB8I),V===i.SHORT&&(Y=i.RGB16I),V===i.INT&&(Y=i.RGB32I)),b===i.RGBA_INTEGER&&(V===i.UNSIGNED_BYTE&&(Y=i.RGBA8UI),V===i.UNSIGNED_SHORT&&(Y=i.RGBA16UI),V===i.UNSIGNED_INT&&(Y=i.RGBA32UI),V===i.BYTE&&(Y=i.RGBA8I),V===i.SHORT&&(Y=i.RGBA16I),V===i.INT&&(Y=i.RGBA32I)),b===i.RGB&&V===i.UNSIGNED_INT_5_9_9_9_REV&&(Y=i.RGB9_E5),b===i.RGBA){let Me=j?Mo:Je.getTransfer(K);V===i.FLOAT&&(Y=i.RGBA32F),V===i.HALF_FLOAT&&(Y=i.RGBA16F),V===i.UNSIGNED_BYTE&&(Y=Me===dt?i.SRGB8_ALPHA8:i.RGBA8),V===i.UNSIGNED_SHORT_4_4_4_4&&(Y=i.RGBA4),V===i.UNSIGNED_SHORT_5_5_5_1&&(Y=i.RGB5_A1)}return(Y===i.R16F||Y===i.R32F||Y===i.RG16F||Y===i.RG32F||Y===i.RGBA16F||Y===i.RGBA32F)&&e.get("EXT_color_buffer_float"),Y}function y(T,b){let V;return T?b===null||b===cs||b===Js?V=i.DEPTH24_STENCIL8:b===Zn?V=i.DEPTH32F_STENCIL8:b===Hr&&(V=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):b===null||b===cs||b===Js?V=i.DEPTH_COMPONENT24:b===Zn?V=i.DEPTH_COMPONENT32F:b===Hr&&(V=i.DEPTH_COMPONENT16),V}function L(T,b){return p(T)===!0||T.isFramebufferTexture&&T.minFilter!==vn&&T.minFilter!==Yn?Math.log2(Math.max(b.width,b.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?b.mipmaps.length:1}function C(T){let b=T.target;b.removeEventListener("dispose",C),E(b),b.isVideoTexture&&c.delete(b)}function A(T){let b=T.target;b.removeEventListener("dispose",A),_(b)}function E(T){let b=n.get(T);if(b.__webglInit===void 0)return;let V=T.source,K=d.get(V);if(K){let j=K[b.__cacheKey];j.usedTimes--,j.usedTimes===0&&v(T),Object.keys(K).length===0&&d.delete(V)}n.remove(T)}function v(T){let b=n.get(T);i.deleteTexture(b.__webglTexture);let V=T.source,K=d.get(V);delete K[b.__cacheKey],o.memory.textures--}function _(T){let b=n.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),n.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(b.__webglFramebuffer[K]))for(let j=0;j<b.__webglFramebuffer[K].length;j++)i.deleteFramebuffer(b.__webglFramebuffer[K][j]);else i.deleteFramebuffer(b.__webglFramebuffer[K]);b.__webglDepthbuffer&&i.deleteRenderbuffer(b.__webglDepthbuffer[K])}else{if(Array.isArray(b.__webglFramebuffer))for(let K=0;K<b.__webglFramebuffer.length;K++)i.deleteFramebuffer(b.__webglFramebuffer[K]);else i.deleteFramebuffer(b.__webglFramebuffer);if(b.__webglDepthbuffer&&i.deleteRenderbuffer(b.__webglDepthbuffer),b.__webglMultisampledFramebuffer&&i.deleteFramebuffer(b.__webglMultisampledFramebuffer),b.__webglColorRenderbuffer)for(let K=0;K<b.__webglColorRenderbuffer.length;K++)b.__webglColorRenderbuffer[K]&&i.deleteRenderbuffer(b.__webglColorRenderbuffer[K]);b.__webglDepthRenderbuffer&&i.deleteRenderbuffer(b.__webglDepthRenderbuffer)}let V=T.textures;for(let K=0,j=V.length;K<j;K++){let Y=n.get(V[K]);Y.__webglTexture&&(i.deleteTexture(Y.__webglTexture),o.memory.textures--),n.remove(V[K])}n.remove(T)}let I=0;function H(){I=0}function R(){let T=I;return T>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+s.maxTextures),I+=1,T}function O(T){let b=[];return b.push(T.wrapS),b.push(T.wrapT),b.push(T.wrapR||0),b.push(T.magFilter),b.push(T.minFilter),b.push(T.anisotropy),b.push(T.internalFormat),b.push(T.format),b.push(T.type),b.push(T.generateMipmaps),b.push(T.premultiplyAlpha),b.push(T.flipY),b.push(T.unpackAlignment),b.push(T.colorSpace),b.join()}function z(T,b){let V=n.get(T);if(T.isVideoTexture&&Ee(T),T.isRenderTargetTexture===!1&&T.version>0&&V.__version!==T.version){let K=T.image;if(K===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(K.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{$(V,T,b);return}}t.bindTexture(i.TEXTURE_2D,V.__webglTexture,i.TEXTURE0+b)}function B(T,b){let V=n.get(T);if(T.version>0&&V.__version!==T.version){$(V,T,b);return}t.bindTexture(i.TEXTURE_2D_ARRAY,V.__webglTexture,i.TEXTURE0+b)}function Z(T,b){let V=n.get(T);if(T.version>0&&V.__version!==T.version){$(V,T,b);return}t.bindTexture(i.TEXTURE_3D,V.__webglTexture,i.TEXTURE0+b)}function G(T,b){let V=n.get(T);if(T.version>0&&V.__version!==T.version){ie(V,T,b);return}t.bindTexture(i.TEXTURE_CUBE_MAP,V.__webglTexture,i.TEXTURE0+b)}let se={[hc]:i.REPEAT,[os]:i.CLAMP_TO_EDGE,[uc]:i.MIRRORED_REPEAT},ee={[vn]:i.NEAREST,[pm]:i.NEAREST_MIPMAP_NEAREST,[_a]:i.NEAREST_MIPMAP_LINEAR,[Yn]:i.LINEAR,[bl]:i.LINEAR_MIPMAP_NEAREST,[ls]:i.LINEAR_MIPMAP_LINEAR},fe={[vm]:i.NEVER,[wm]:i.ALWAYS,[ym]:i.LESS,[Zd]:i.LEQUAL,[_m]:i.EQUAL,[Sm]:i.GEQUAL,[bm]:i.GREATER,[Mm]:i.NOTEQUAL};function Ue(T,b){if(b.type===Zn&&e.has("OES_texture_float_linear")===!1&&(b.magFilter===Yn||b.magFilter===bl||b.magFilter===_a||b.magFilter===ls||b.minFilter===Yn||b.minFilter===bl||b.minFilter===_a||b.minFilter===ls)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(T,i.TEXTURE_WRAP_S,se[b.wrapS]),i.texParameteri(T,i.TEXTURE_WRAP_T,se[b.wrapT]),(T===i.TEXTURE_3D||T===i.TEXTURE_2D_ARRAY)&&i.texParameteri(T,i.TEXTURE_WRAP_R,se[b.wrapR]),i.texParameteri(T,i.TEXTURE_MAG_FILTER,ee[b.magFilter]),i.texParameteri(T,i.TEXTURE_MIN_FILTER,ee[b.minFilter]),b.compareFunction&&(i.texParameteri(T,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(T,i.TEXTURE_COMPARE_FUNC,fe[b.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(b.magFilter===vn||b.minFilter!==_a&&b.minFilter!==ls||b.type===Zn&&e.has("OES_texture_float_linear")===!1)return;if(b.anisotropy>1||n.get(b).__currentAnisotropy){let V=e.get("EXT_texture_filter_anisotropic");i.texParameterf(T,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(b.anisotropy,s.getMaxAnisotropy())),n.get(b).__currentAnisotropy=b.anisotropy}}}function et(T,b){let V=!1;T.__webglInit===void 0&&(T.__webglInit=!0,b.addEventListener("dispose",C));let K=b.source,j=d.get(K);j===void 0&&(j={},d.set(K,j));let Y=O(b);if(Y!==T.__cacheKey){j[Y]===void 0&&(j[Y]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,V=!0),j[Y].usedTimes++;let Me=j[T.__cacheKey];Me!==void 0&&(j[T.__cacheKey].usedTimes--,Me.usedTimes===0&&v(b)),T.__cacheKey=Y,T.__webglTexture=j[Y].texture}return V}function $(T,b,V){let K=i.TEXTURE_2D;(b.isDataArrayTexture||b.isCompressedArrayTexture)&&(K=i.TEXTURE_2D_ARRAY),b.isData3DTexture&&(K=i.TEXTURE_3D);let j=et(T,b),Y=b.source;t.bindTexture(K,T.__webglTexture,i.TEXTURE0+V);let Me=n.get(Y);if(Y.version!==Me.__version||j===!0){t.activeTexture(i.TEXTURE0+V);let ce=Je.getPrimaries(Je.workingColorSpace),pe=b.colorSpace===Fi?null:Je.getPrimaries(b.colorSpace),Ke=b.colorSpace===Fi||ce===pe?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,b.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,b.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ke);let te=x(b.image,!1,s.maxTextureSize);te=_t(b,te);let me=r.convert(b.format,b.colorSpace),Ce=r.convert(b.type),Pe=w(b.internalFormat,me,Ce,b.colorSpace,b.isVideoTexture);Ue(K,b);let ge,Ye=b.mipmaps,Be=b.isVideoTexture!==!0,pt=Me.__version===void 0||j===!0,U=Y.dataReady,oe=L(b,te);if(b.isDepthTexture)Pe=y(b.format===js,b.type),pt&&(Be?t.texStorage2D(i.TEXTURE_2D,1,Pe,te.width,te.height):t.texImage2D(i.TEXTURE_2D,0,Pe,te.width,te.height,0,me,Ce,null));else if(b.isDataTexture)if(Ye.length>0){Be&&pt&&t.texStorage2D(i.TEXTURE_2D,oe,Pe,Ye[0].width,Ye[0].height);for(let q=0,J=Ye.length;q<J;q++)ge=Ye[q],Be?U&&t.texSubImage2D(i.TEXTURE_2D,q,0,0,ge.width,ge.height,me,Ce,ge.data):t.texImage2D(i.TEXTURE_2D,q,Pe,ge.width,ge.height,0,me,Ce,ge.data);b.generateMipmaps=!1}else Be?(pt&&t.texStorage2D(i.TEXTURE_2D,oe,Pe,te.width,te.height),U&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,te.width,te.height,me,Ce,te.data)):t.texImage2D(i.TEXTURE_2D,0,Pe,te.width,te.height,0,me,Ce,te.data);else if(b.isCompressedTexture)if(b.isCompressedArrayTexture){Be&&pt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,oe,Pe,Ye[0].width,Ye[0].height,te.depth);for(let q=0,J=Ye.length;q<J;q++)if(ge=Ye[q],b.format!==On)if(me!==null)if(Be){if(U)if(b.layerUpdates.size>0){let de=Dd(ge.width,ge.height,b.format,b.type);for(let he of b.layerUpdates){let Fe=ge.data.subarray(he*de/ge.data.BYTES_PER_ELEMENT,(he+1)*de/ge.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,q,0,0,he,ge.width,ge.height,1,me,Fe)}b.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,q,0,0,0,ge.width,ge.height,te.depth,me,ge.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,q,Pe,ge.width,ge.height,te.depth,0,ge.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Be?U&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,q,0,0,0,ge.width,ge.height,te.depth,me,Ce,ge.data):t.texImage3D(i.TEXTURE_2D_ARRAY,q,Pe,ge.width,ge.height,te.depth,0,me,Ce,ge.data)}else{Be&&pt&&t.texStorage2D(i.TEXTURE_2D,oe,Pe,Ye[0].width,Ye[0].height);for(let q=0,J=Ye.length;q<J;q++)ge=Ye[q],b.format!==On?me!==null?Be?U&&t.compressedTexSubImage2D(i.TEXTURE_2D,q,0,0,ge.width,ge.height,me,ge.data):t.compressedTexImage2D(i.TEXTURE_2D,q,Pe,ge.width,ge.height,0,ge.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Be?U&&t.texSubImage2D(i.TEXTURE_2D,q,0,0,ge.width,ge.height,me,Ce,ge.data):t.texImage2D(i.TEXTURE_2D,q,Pe,ge.width,ge.height,0,me,Ce,ge.data)}else if(b.isDataArrayTexture)if(Be){if(pt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,oe,Pe,te.width,te.height,te.depth),U)if(b.layerUpdates.size>0){let q=Dd(te.width,te.height,b.format,b.type);for(let J of b.layerUpdates){let de=te.data.subarray(J*q/te.data.BYTES_PER_ELEMENT,(J+1)*q/te.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,J,te.width,te.height,1,me,Ce,de)}b.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,te.width,te.height,te.depth,me,Ce,te.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Pe,te.width,te.height,te.depth,0,me,Ce,te.data);else if(b.isData3DTexture)Be?(pt&&t.texStorage3D(i.TEXTURE_3D,oe,Pe,te.width,te.height,te.depth),U&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,te.width,te.height,te.depth,me,Ce,te.data)):t.texImage3D(i.TEXTURE_3D,0,Pe,te.width,te.height,te.depth,0,me,Ce,te.data);else if(b.isFramebufferTexture){if(pt)if(Be)t.texStorage2D(i.TEXTURE_2D,oe,Pe,te.width,te.height);else{let q=te.width,J=te.height;for(let de=0;de<oe;de++)t.texImage2D(i.TEXTURE_2D,de,Pe,q,J,0,me,Ce,null),q>>=1,J>>=1}}else if(Ye.length>0){if(Be&&pt){let q=Ae(Ye[0]);t.texStorage2D(i.TEXTURE_2D,oe,Pe,q.width,q.height)}for(let q=0,J=Ye.length;q<J;q++)ge=Ye[q],Be?U&&t.texSubImage2D(i.TEXTURE_2D,q,0,0,me,Ce,ge):t.texImage2D(i.TEXTURE_2D,q,Pe,me,Ce,ge);b.generateMipmaps=!1}else if(Be){if(pt){let q=Ae(te);t.texStorage2D(i.TEXTURE_2D,oe,Pe,q.width,q.height)}U&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,me,Ce,te)}else t.texImage2D(i.TEXTURE_2D,0,Pe,me,Ce,te);p(b)&&f(K),Me.__version=Y.version,b.onUpdate&&b.onUpdate(b)}T.__version=b.version}function ie(T,b,V){if(b.image.length!==6)return;let K=et(T,b),j=b.source;t.bindTexture(i.TEXTURE_CUBE_MAP,T.__webglTexture,i.TEXTURE0+V);let Y=n.get(j);if(j.version!==Y.__version||K===!0){t.activeTexture(i.TEXTURE0+V);let Me=Je.getPrimaries(Je.workingColorSpace),ce=b.colorSpace===Fi?null:Je.getPrimaries(b.colorSpace),pe=b.colorSpace===Fi||Me===ce?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,b.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,b.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,pe);let Ke=b.isCompressedTexture||b.image[0].isCompressedTexture,te=b.image[0]&&b.image[0].isDataTexture,me=[];for(let J=0;J<6;J++)!Ke&&!te?me[J]=x(b.image[J],!0,s.maxCubemapSize):me[J]=te?b.image[J].image:b.image[J],me[J]=_t(b,me[J]);let Ce=me[0],Pe=r.convert(b.format,b.colorSpace),ge=r.convert(b.type),Ye=w(b.internalFormat,Pe,ge,b.colorSpace),Be=b.isVideoTexture!==!0,pt=Y.__version===void 0||K===!0,U=j.dataReady,oe=L(b,Ce);Ue(i.TEXTURE_CUBE_MAP,b);let q;if(Ke){Be&&pt&&t.texStorage2D(i.TEXTURE_CUBE_MAP,oe,Ye,Ce.width,Ce.height);for(let J=0;J<6;J++){q=me[J].mipmaps;for(let de=0;de<q.length;de++){let he=q[de];b.format!==On?Pe!==null?Be?U&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,de,0,0,he.width,he.height,Pe,he.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,de,Ye,he.width,he.height,0,he.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Be?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,de,0,0,he.width,he.height,Pe,ge,he.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,de,Ye,he.width,he.height,0,Pe,ge,he.data)}}}else{if(q=b.mipmaps,Be&&pt){q.length>0&&oe++;let J=Ae(me[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,oe,Ye,J.width,J.height)}for(let J=0;J<6;J++)if(te){Be?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,me[J].width,me[J].height,Pe,ge,me[J].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,Ye,me[J].width,me[J].height,0,Pe,ge,me[J].data);for(let de=0;de<q.length;de++){let Fe=q[de].image[J].image;Be?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,de+1,0,0,Fe.width,Fe.height,Pe,ge,Fe.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,de+1,Ye,Fe.width,Fe.height,0,Pe,ge,Fe.data)}}else{Be?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,Pe,ge,me[J]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,Ye,Pe,ge,me[J]);for(let de=0;de<q.length;de++){let he=q[de];Be?U&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,de+1,0,0,Pe,ge,he.image[J]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,de+1,Ye,Pe,ge,he.image[J])}}}p(b)&&f(i.TEXTURE_CUBE_MAP),Y.__version=j.version,b.onUpdate&&b.onUpdate(b)}T.__version=b.version}function be(T,b,V,K,j,Y){let Me=r.convert(V.format,V.colorSpace),ce=r.convert(V.type),pe=w(V.internalFormat,Me,ce,V.colorSpace),Ke=n.get(b),te=n.get(V);if(te.__renderTarget=b,!Ke.__hasExternalTextures){let me=Math.max(1,b.width>>Y),Ce=Math.max(1,b.height>>Y);j===i.TEXTURE_3D||j===i.TEXTURE_2D_ARRAY?t.texImage3D(j,Y,pe,me,Ce,b.depth,0,Me,ce,null):t.texImage2D(j,Y,pe,me,Ce,0,Me,ce,null)}t.bindFramebuffer(i.FRAMEBUFFER,T),$e(b)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,K,j,te.__webglTexture,0,qe(b)):(j===i.TEXTURE_2D||j>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,K,j,te.__webglTexture,Y),t.bindFramebuffer(i.FRAMEBUFFER,null)}function le(T,b,V){if(i.bindRenderbuffer(i.RENDERBUFFER,T),b.depthBuffer){let K=b.depthTexture,j=K&&K.isDepthTexture?K.type:null,Y=y(b.stencilBuffer,j),Me=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ce=qe(b);$e(b)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ce,Y,b.width,b.height):V?i.renderbufferStorageMultisample(i.RENDERBUFFER,ce,Y,b.width,b.height):i.renderbufferStorage(i.RENDERBUFFER,Y,b.width,b.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Me,i.RENDERBUFFER,T)}else{let K=b.textures;for(let j=0;j<K.length;j++){let Y=K[j],Me=r.convert(Y.format,Y.colorSpace),ce=r.convert(Y.type),pe=w(Y.internalFormat,Me,ce,Y.colorSpace),Ke=qe(b);V&&$e(b)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ke,pe,b.width,b.height):$e(b)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ke,pe,b.width,b.height):i.renderbufferStorage(i.RENDERBUFFER,pe,b.width,b.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Re(T,b){if(b&&b.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,T),!(b.depthTexture&&b.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let K=n.get(b.depthTexture);K.__renderTarget=b,(!K.__webglTexture||b.depthTexture.image.width!==b.width||b.depthTexture.image.height!==b.height)&&(b.depthTexture.image.width=b.width,b.depthTexture.image.height=b.height,b.depthTexture.needsUpdate=!0),z(b.depthTexture,0);let j=K.__webglTexture,Y=qe(b);if(b.depthTexture.format===Xs)$e(b)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,j,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,j,0);else if(b.depthTexture.format===js)$e(b)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,j,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,j,0);else throw new Error("Unknown depthTexture format")}function Ne(T){let b=n.get(T),V=T.isWebGLCubeRenderTarget===!0;if(b.__boundDepthTexture!==T.depthTexture){let K=T.depthTexture;if(b.__depthDisposeCallback&&b.__depthDisposeCallback(),K){let j=()=>{delete b.__boundDepthTexture,delete b.__depthDisposeCallback,K.removeEventListener("dispose",j)};K.addEventListener("dispose",j),b.__depthDisposeCallback=j}b.__boundDepthTexture=K}if(T.depthTexture&&!b.__autoAllocateDepthBuffer){if(V)throw new Error("target.depthTexture not supported in Cube render targets");Re(b.__webglFramebuffer,T)}else if(V){b.__webglDepthbuffer=[];for(let K=0;K<6;K++)if(t.bindFramebuffer(i.FRAMEBUFFER,b.__webglFramebuffer[K]),b.__webglDepthbuffer[K]===void 0)b.__webglDepthbuffer[K]=i.createRenderbuffer(),le(b.__webglDepthbuffer[K],T,!1);else{let j=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Y=b.__webglDepthbuffer[K];i.bindRenderbuffer(i.RENDERBUFFER,Y),i.framebufferRenderbuffer(i.FRAMEBUFFER,j,i.RENDERBUFFER,Y)}}else if(t.bindFramebuffer(i.FRAMEBUFFER,b.__webglFramebuffer),b.__webglDepthbuffer===void 0)b.__webglDepthbuffer=i.createRenderbuffer(),le(b.__webglDepthbuffer,T,!1);else{let K=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,j=b.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,j),i.framebufferRenderbuffer(i.FRAMEBUFFER,K,i.RENDERBUFFER,j)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function ze(T,b,V){let K=n.get(T);b!==void 0&&be(K.__webglFramebuffer,T,T.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),V!==void 0&&Ne(T)}function Et(T){let b=T.texture,V=n.get(T),K=n.get(b);T.addEventListener("dispose",A);let j=T.textures,Y=T.isWebGLCubeRenderTarget===!0,Me=j.length>1;if(Me||(K.__webglTexture===void 0&&(K.__webglTexture=i.createTexture()),K.__version=b.version,o.memory.textures++),Y){V.__webglFramebuffer=[];for(let ce=0;ce<6;ce++)if(b.mipmaps&&b.mipmaps.length>0){V.__webglFramebuffer[ce]=[];for(let pe=0;pe<b.mipmaps.length;pe++)V.__webglFramebuffer[ce][pe]=i.createFramebuffer()}else V.__webglFramebuffer[ce]=i.createFramebuffer()}else{if(b.mipmaps&&b.mipmaps.length>0){V.__webglFramebuffer=[];for(let ce=0;ce<b.mipmaps.length;ce++)V.__webglFramebuffer[ce]=i.createFramebuffer()}else V.__webglFramebuffer=i.createFramebuffer();if(Me)for(let ce=0,pe=j.length;ce<pe;ce++){let Ke=n.get(j[ce]);Ke.__webglTexture===void 0&&(Ke.__webglTexture=i.createTexture(),o.memory.textures++)}if(T.samples>0&&$e(T)===!1){V.__webglMultisampledFramebuffer=i.createFramebuffer(),V.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let ce=0;ce<j.length;ce++){let pe=j[ce];V.__webglColorRenderbuffer[ce]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,V.__webglColorRenderbuffer[ce]);let Ke=r.convert(pe.format,pe.colorSpace),te=r.convert(pe.type),me=w(pe.internalFormat,Ke,te,pe.colorSpace,T.isXRRenderTarget===!0),Ce=qe(T);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ce,me,T.width,T.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ce,i.RENDERBUFFER,V.__webglColorRenderbuffer[ce])}i.bindRenderbuffer(i.RENDERBUFFER,null),T.depthBuffer&&(V.__webglDepthRenderbuffer=i.createRenderbuffer(),le(V.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(Y){t.bindTexture(i.TEXTURE_CUBE_MAP,K.__webglTexture),Ue(i.TEXTURE_CUBE_MAP,b);for(let ce=0;ce<6;ce++)if(b.mipmaps&&b.mipmaps.length>0)for(let pe=0;pe<b.mipmaps.length;pe++)be(V.__webglFramebuffer[ce][pe],T,b,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ce,pe);else be(V.__webglFramebuffer[ce],T,b,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ce,0);p(b)&&f(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Me){for(let ce=0,pe=j.length;ce<pe;ce++){let Ke=j[ce],te=n.get(Ke);t.bindTexture(i.TEXTURE_2D,te.__webglTexture),Ue(i.TEXTURE_2D,Ke),be(V.__webglFramebuffer,T,Ke,i.COLOR_ATTACHMENT0+ce,i.TEXTURE_2D,0),p(Ke)&&f(i.TEXTURE_2D)}t.unbindTexture()}else{let ce=i.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(ce=T.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ce,K.__webglTexture),Ue(ce,b),b.mipmaps&&b.mipmaps.length>0)for(let pe=0;pe<b.mipmaps.length;pe++)be(V.__webglFramebuffer[pe],T,b,i.COLOR_ATTACHMENT0,ce,pe);else be(V.__webglFramebuffer,T,b,i.COLOR_ATTACHMENT0,ce,0);p(b)&&f(ce),t.unbindTexture()}T.depthBuffer&&Ne(T)}function Ze(T){let b=T.textures;for(let V=0,K=b.length;V<K;V++){let j=b[V];if(p(j)){let Y=S(T),Me=n.get(j).__webglTexture;t.bindTexture(Y,Me),f(Y),t.unbindTexture()}}}let Rt=[],k=[];function wn(T){if(T.samples>0){if($e(T)===!1){let b=T.textures,V=T.width,K=T.height,j=i.COLOR_BUFFER_BIT,Y=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Me=n.get(T),ce=b.length>1;if(ce)for(let pe=0;pe<b.length;pe++)t.bindFramebuffer(i.FRAMEBUFFER,Me.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+pe,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Me.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+pe,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Me.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Me.__webglFramebuffer);for(let pe=0;pe<b.length;pe++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(j|=i.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(j|=i.STENCIL_BUFFER_BIT)),ce){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Me.__webglColorRenderbuffer[pe]);let Ke=n.get(b[pe]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Ke,0)}i.blitFramebuffer(0,0,V,K,0,0,V,K,j,i.NEAREST),l===!0&&(Rt.length=0,k.length=0,Rt.push(i.COLOR_ATTACHMENT0+pe),T.depthBuffer&&T.resolveDepthBuffer===!1&&(Rt.push(Y),k.push(Y),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,k)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Rt))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ce)for(let pe=0;pe<b.length;pe++){t.bindFramebuffer(i.FRAMEBUFFER,Me.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+pe,i.RENDERBUFFER,Me.__webglColorRenderbuffer[pe]);let Ke=n.get(b[pe]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Me.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+pe,i.TEXTURE_2D,Ke,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Me.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&l){let b=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[b])}}}function qe(T){return Math.min(s.maxSamples,T.samples)}function $e(T){let b=n.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&b.__useRenderToTexture!==!1}function Ee(T){let b=o.render.frame;c.get(T)!==b&&(c.set(T,b),T.update())}function _t(T,b){let V=T.colorSpace,K=T.format,j=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||V!==nr&&V!==Fi&&(Je.getTransfer(V)===dt?(K!==On||j!==pi)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",V)),b}function Ae(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(h.width=T.naturalWidth||T.width,h.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(h.width=T.displayWidth,h.height=T.displayHeight):(h.width=T.width,h.height=T.height),h}this.allocateTextureUnit=R,this.resetTextureUnits=H,this.setTexture2D=z,this.setTexture2DArray=B,this.setTexture3D=Z,this.setTextureCube=G,this.rebindTextures=ze,this.setupRenderTarget=Et,this.updateRenderTargetMipmap=Ze,this.updateMultisampleRenderTarget=wn,this.setupDepthRenderbuffer=Ne,this.setupFrameBufferTexture=be,this.useMultisampledRTT=$e}function gy(i,e){function t(n,s=Fi){let r,o=Je.getTransfer(s);if(n===pi)return i.UNSIGNED_BYTE;if(n===yh)return i.UNSIGNED_SHORT_4_4_4_4;if(n===_h)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Vd)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===zd)return i.BYTE;if(n===Hd)return i.SHORT;if(n===Hr)return i.UNSIGNED_SHORT;if(n===vh)return i.INT;if(n===cs)return i.UNSIGNED_INT;if(n===Zn)return i.FLOAT;if(n===Xr)return i.HALF_FLOAT;if(n===Gd)return i.ALPHA;if(n===Wd)return i.RGB;if(n===On)return i.RGBA;if(n===Xd)return i.LUMINANCE;if(n===qd)return i.LUMINANCE_ALPHA;if(n===Xs)return i.DEPTH_COMPONENT;if(n===js)return i.DEPTH_STENCIL;if(n===bh)return i.RED;if(n===Mh)return i.RED_INTEGER;if(n===$d)return i.RG;if(n===Sh)return i.RG_INTEGER;if(n===wh)return i.RGBA_INTEGER;if(n===Ga||n===Wa||n===Xa||n===qa)if(o===dt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Ga)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Wa)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Xa)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===qa)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Ga)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Wa)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Xa)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===qa)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===dc||n===fc||n===pc||n===mc)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===dc)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===fc)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===pc)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===mc)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===gc||n===xc||n===vc)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===gc||n===xc)return o===dt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===vc)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===yc||n===_c||n===bc||n===Mc||n===Sc||n===wc||n===Ac||n===Tc||n===Ec||n===Cc||n===Rc||n===Pc||n===Ic||n===Lc)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===yc)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===_c)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===bc)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Mc)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Sc)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===wc)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Ac)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Tc)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ec)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Cc)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Rc)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Pc)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Ic)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Lc)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===$a||n===Dc||n===Uc)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===$a)return o===dt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Dc)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Uc)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Yd||n===Nc||n===Fc||n===kc)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===$a)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Nc)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Fc)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===kc)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Js?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var eh=class extends Jt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},zn=class extends nn{constructor(){super(),this.isGroup=!0,this.type="Group"}},xy={type:"move"},Or=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new zn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new zn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new zn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,h=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(h&&e.hand){o=!0;for(let x of e.hand.values()){let p=t.getJointPose(x,n),f=this._getHandJoint(h,x);p!==null&&(f.matrix.fromArray(p.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=p.radius),f.visible=p!==null}let c=h.joints["index-finger-tip"],u=h.joints["thumb-tip"],d=c.position.distanceTo(u.position),m=.02,g=.005;h.inputState.pinching&&d>m+g?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!h.inputState.pinching&&d<=m-g&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(xy)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),h!==null&&(h.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new zn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},vy=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,yy=`
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

}`,th=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){let s=new _n,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!=n.depthNear||t.depthFar!=n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Kn({vertexShader:vy,fragmentShader:yy,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new wt(new Vi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},nh=class extends zi{constructor(e,t){super();let n=this,s=null,r=1,o=null,a="local-floor",l=1,h=null,c=null,u=null,d=null,m=null,g=null,x=new th,p=t.getContextAttributes(),f=null,S=null,w=[],y=[],L=new He,C=null,A=new Jt;A.viewport=new ft;let E=new Jt;E.viewport=new ft;let v=[A,E],_=new eh,I=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let ie=w[$];return ie===void 0&&(ie=new Or,w[$]=ie),ie.getTargetRaySpace()},this.getControllerGrip=function($){let ie=w[$];return ie===void 0&&(ie=new Or,w[$]=ie),ie.getGripSpace()},this.getHand=function($){let ie=w[$];return ie===void 0&&(ie=new Or,w[$]=ie),ie.getHandSpace()};function R($){let ie=y.indexOf($.inputSource);if(ie===-1)return;let be=w[ie];be!==void 0&&(be.update($.inputSource,$.frame,h||o),be.dispatchEvent({type:$.type,data:$.inputSource}))}function O(){s.removeEventListener("select",R),s.removeEventListener("selectstart",R),s.removeEventListener("selectend",R),s.removeEventListener("squeeze",R),s.removeEventListener("squeezestart",R),s.removeEventListener("squeezeend",R),s.removeEventListener("end",O),s.removeEventListener("inputsourceschange",z);for(let $=0;$<w.length;$++){let ie=y[$];ie!==null&&(y[$]=null,w[$].disconnect(ie))}I=null,H=null,x.reset(),e.setRenderTarget(f),m=null,d=null,u=null,s=null,S=null,et.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(L.width,L.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){r=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){a=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||o},this.setReferenceSpace=function($){h=$},this.getBaseLayer=function(){return d!==null?d:m},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function($){if(s=$,s!==null){if(f=e.getRenderTarget(),s.addEventListener("select",R),s.addEventListener("selectstart",R),s.addEventListener("selectend",R),s.addEventListener("squeeze",R),s.addEventListener("squeezestart",R),s.addEventListener("squeezeend",R),s.addEventListener("end",O),s.addEventListener("inputsourceschange",z),p.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(L),s.renderState.layers===void 0){let ie={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,t,ie),s.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),S=new mi(m.framebufferWidth,m.framebufferHeight,{format:On,type:pi,colorSpace:e.outputColorSpace,stencilBuffer:p.stencil})}else{let ie=null,be=null,le=null;p.depth&&(le=p.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ie=p.stencil?js:Xs,be=p.stencil?Js:cs);let Re={colorFormat:t.RGBA8,depthFormat:le,scaleFactor:r};u=new XRWebGLBinding(s,t),d=u.createProjectionLayer(Re),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),S=new mi(d.textureWidth,d.textureHeight,{format:On,type:pi,depthTexture:new ro(d.textureWidth,d.textureHeight,be,void 0,void 0,void 0,void 0,void 0,void 0,ie),stencilBuffer:p.stencil,colorSpace:e.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(l),h=null,o=await s.requestReferenceSpace(a),et.setContext(s),et.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function z($){for(let ie=0;ie<$.removed.length;ie++){let be=$.removed[ie],le=y.indexOf(be);le>=0&&(y[le]=null,w[le].disconnect(be))}for(let ie=0;ie<$.added.length;ie++){let be=$.added[ie],le=y.indexOf(be);if(le===-1){for(let Ne=0;Ne<w.length;Ne++)if(Ne>=y.length){y.push(be),le=Ne;break}else if(y[Ne]===null){y[Ne]=be,le=Ne;break}if(le===-1)break}let Re=w[le];Re&&Re.connect(be)}}let B=new D,Z=new D;function G($,ie,be){B.setFromMatrixPosition(ie.matrixWorld),Z.setFromMatrixPosition(be.matrixWorld);let le=B.distanceTo(Z),Re=ie.projectionMatrix.elements,Ne=be.projectionMatrix.elements,ze=Re[14]/(Re[10]-1),Et=Re[14]/(Re[10]+1),Ze=(Re[9]+1)/Re[5],Rt=(Re[9]-1)/Re[5],k=(Re[8]-1)/Re[0],wn=(Ne[8]+1)/Ne[0],qe=ze*k,$e=ze*wn,Ee=le/(-k+wn),_t=Ee*-k;if(ie.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(_t),$.translateZ(Ee),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),Re[10]===-1)$.projectionMatrix.copy(ie.projectionMatrix),$.projectionMatrixInverse.copy(ie.projectionMatrixInverse);else{let Ae=ze+Ee,T=Et+Ee,b=qe-_t,V=$e+(le-_t),K=Ze*Et/T*Ae,j=Rt*Et/T*Ae;$.projectionMatrix.makePerspective(b,V,K,j,Ae,T),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function se($,ie){ie===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(ie.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(s===null)return;let ie=$.near,be=$.far;x.texture!==null&&(x.depthNear>0&&(ie=x.depthNear),x.depthFar>0&&(be=x.depthFar)),_.near=E.near=A.near=ie,_.far=E.far=A.far=be,(I!==_.near||H!==_.far)&&(s.updateRenderState({depthNear:_.near,depthFar:_.far}),I=_.near,H=_.far),A.layers.mask=$.layers.mask|2,E.layers.mask=$.layers.mask|4,_.layers.mask=A.layers.mask|E.layers.mask;let le=$.parent,Re=_.cameras;se(_,le);for(let Ne=0;Ne<Re.length;Ne++)se(Re[Ne],le);Re.length===2?G(_,A,E):_.projectionMatrix.copy(A.projectionMatrix),ee($,_,le)};function ee($,ie,be){be===null?$.matrix.copy(ie.matrixWorld):($.matrix.copy(be.matrixWorld),$.matrix.invert(),$.matrix.multiply(ie.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(ie.projectionMatrix),$.projectionMatrixInverse.copy(ie.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=Oc*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return _},this.getFoveation=function(){if(!(d===null&&m===null))return l},this.setFoveation=function($){l=$,d!==null&&(d.fixedFoveation=$),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=$)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(_)};let fe=null;function Ue($,ie){if(c=ie.getViewerPose(h||o),g=ie,c!==null){let be=c.views;m!==null&&(e.setRenderTargetFramebuffer(S,m.framebuffer),e.setRenderTarget(S));let le=!1;be.length!==_.cameras.length&&(_.cameras.length=0,le=!0);for(let Ne=0;Ne<be.length;Ne++){let ze=be[Ne],Et=null;if(m!==null)Et=m.getViewport(ze);else{let Rt=u.getViewSubImage(d,ze);Et=Rt.viewport,Ne===0&&(e.setRenderTargetTextures(S,Rt.colorTexture,d.ignoreDepthValues?void 0:Rt.depthStencilTexture),e.setRenderTarget(S))}let Ze=v[Ne];Ze===void 0&&(Ze=new Jt,Ze.layers.enable(Ne),Ze.viewport=new ft,v[Ne]=Ze),Ze.matrix.fromArray(ze.transform.matrix),Ze.matrix.decompose(Ze.position,Ze.quaternion,Ze.scale),Ze.projectionMatrix.fromArray(ze.projectionMatrix),Ze.projectionMatrixInverse.copy(Ze.projectionMatrix).invert(),Ze.viewport.set(Et.x,Et.y,Et.width,Et.height),Ne===0&&(_.matrix.copy(Ze.matrix),_.matrix.decompose(_.position,_.quaternion,_.scale)),le===!0&&_.cameras.push(Ze)}let Re=s.enabledFeatures;if(Re&&Re.includes("depth-sensing")){let Ne=u.getDepthInformation(be[0]);Ne&&Ne.isValid&&Ne.texture&&x.init(e,Ne,s.renderState)}}for(let be=0;be<w.length;be++){let le=y[be],Re=w[be];le!==null&&Re!==void 0&&Re.update(le,ie,h||o)}fe&&fe($,ie),ie.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ie}),g=null}let et=new Qd;et.setAnimationLoop(Ue),this.setAnimationLoop=function($){fe=$},this.dispose=function(){}}},ns=new Ut,_y=new Ve;function by(i,e){function t(p,f){p.matrixAutoUpdate===!0&&p.updateMatrix(),f.value.copy(p.matrix)}function n(p,f){f.color.getRGB(p.fogColor.value,jd(i)),f.isFog?(p.fogNear.value=f.near,p.fogFar.value=f.far):f.isFogExp2&&(p.fogDensity.value=f.density)}function s(p,f,S,w,y){f.isMeshBasicMaterial||f.isMeshLambertMaterial?r(p,f):f.isMeshToonMaterial?(r(p,f),u(p,f)):f.isMeshPhongMaterial?(r(p,f),c(p,f)):f.isMeshStandardMaterial?(r(p,f),d(p,f),f.isMeshPhysicalMaterial&&m(p,f,y)):f.isMeshMatcapMaterial?(r(p,f),g(p,f)):f.isMeshDepthMaterial?r(p,f):f.isMeshDistanceMaterial?(r(p,f),x(p,f)):f.isMeshNormalMaterial?r(p,f):f.isLineBasicMaterial?(o(p,f),f.isLineDashedMaterial&&a(p,f)):f.isPointsMaterial?l(p,f,S,w):f.isSpriteMaterial?h(p,f):f.isShadowMaterial?(p.color.value.copy(f.color),p.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(p,f){p.opacity.value=f.opacity,f.color&&p.diffuse.value.copy(f.color),f.emissive&&p.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(p.map.value=f.map,t(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.bumpMap&&(p.bumpMap.value=f.bumpMap,t(f.bumpMap,p.bumpMapTransform),p.bumpScale.value=f.bumpScale,f.side===dn&&(p.bumpScale.value*=-1)),f.normalMap&&(p.normalMap.value=f.normalMap,t(f.normalMap,p.normalMapTransform),p.normalScale.value.copy(f.normalScale),f.side===dn&&p.normalScale.value.negate()),f.displacementMap&&(p.displacementMap.value=f.displacementMap,t(f.displacementMap,p.displacementMapTransform),p.displacementScale.value=f.displacementScale,p.displacementBias.value=f.displacementBias),f.emissiveMap&&(p.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,p.emissiveMapTransform)),f.specularMap&&(p.specularMap.value=f.specularMap,t(f.specularMap,p.specularMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest);let S=e.get(f),w=S.envMap,y=S.envMapRotation;w&&(p.envMap.value=w,ns.copy(y),ns.x*=-1,ns.y*=-1,ns.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(ns.y*=-1,ns.z*=-1),p.envMapRotation.value.setFromMatrix4(_y.makeRotationFromEuler(ns)),p.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=f.reflectivity,p.ior.value=f.ior,p.refractionRatio.value=f.refractionRatio),f.lightMap&&(p.lightMap.value=f.lightMap,p.lightMapIntensity.value=f.lightMapIntensity,t(f.lightMap,p.lightMapTransform)),f.aoMap&&(p.aoMap.value=f.aoMap,p.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,p.aoMapTransform))}function o(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,f.map&&(p.map.value=f.map,t(f.map,p.mapTransform))}function a(p,f){p.dashSize.value=f.dashSize,p.totalSize.value=f.dashSize+f.gapSize,p.scale.value=f.scale}function l(p,f,S,w){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.size.value=f.size*S,p.scale.value=w*.5,f.map&&(p.map.value=f.map,t(f.map,p.uvTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function h(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.rotation.value=f.rotation,f.map&&(p.map.value=f.map,t(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function c(p,f){p.specular.value.copy(f.specular),p.shininess.value=Math.max(f.shininess,1e-4)}function u(p,f){f.gradientMap&&(p.gradientMap.value=f.gradientMap)}function d(p,f){p.metalness.value=f.metalness,f.metalnessMap&&(p.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,p.metalnessMapTransform)),p.roughness.value=f.roughness,f.roughnessMap&&(p.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,p.roughnessMapTransform)),f.envMap&&(p.envMapIntensity.value=f.envMapIntensity)}function m(p,f,S){p.ior.value=f.ior,f.sheen>0&&(p.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),p.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(p.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,p.sheenColorMapTransform)),f.sheenRoughnessMap&&(p.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,p.sheenRoughnessMapTransform))),f.clearcoat>0&&(p.clearcoat.value=f.clearcoat,p.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(p.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,p.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(p.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===dn&&p.clearcoatNormalScale.value.negate())),f.dispersion>0&&(p.dispersion.value=f.dispersion),f.iridescence>0&&(p.iridescence.value=f.iridescence,p.iridescenceIOR.value=f.iridescenceIOR,p.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(p.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,p.iridescenceMapTransform)),f.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),f.transmission>0&&(p.transmission.value=f.transmission,p.transmissionSamplerMap.value=S.texture,p.transmissionSamplerSize.value.set(S.width,S.height),f.transmissionMap&&(p.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,p.transmissionMapTransform)),p.thickness.value=f.thickness,f.thicknessMap&&(p.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=f.attenuationDistance,p.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(p.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(p.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=f.specularIntensity,p.specularColor.value.copy(f.specularColor),f.specularColorMap&&(p.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,p.specularColorMapTransform)),f.specularIntensityMap&&(p.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,f){f.matcap&&(p.matcap.value=f.matcap)}function x(p,f){let S=e.get(f).light;p.referencePosition.value.setFromMatrixPosition(S.matrixWorld),p.nearDistance.value=S.shadow.camera.near,p.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function My(i,e,t,n){let s={},r={},o=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(S,w){let y=w.program;n.uniformBlockBinding(S,y)}function h(S,w){let y=s[S.id];y===void 0&&(g(S),y=c(S),s[S.id]=y,S.addEventListener("dispose",p));let L=w.program;n.updateUBOMapping(S,L);let C=e.render.frame;r[S.id]!==C&&(d(S),r[S.id]=C)}function c(S){let w=u();S.__bindingPointIndex=w;let y=i.createBuffer(),L=S.__size,C=S.usage;return i.bindBuffer(i.UNIFORM_BUFFER,y),i.bufferData(i.UNIFORM_BUFFER,L,C),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,w,y),y}function u(){for(let S=0;S<a;S++)if(o.indexOf(S)===-1)return o.push(S),S;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(S){let w=s[S.id],y=S.uniforms,L=S.__cache;i.bindBuffer(i.UNIFORM_BUFFER,w);for(let C=0,A=y.length;C<A;C++){let E=Array.isArray(y[C])?y[C]:[y[C]];for(let v=0,_=E.length;v<_;v++){let I=E[v];if(m(I,C,v,L)===!0){let H=I.__offset,R=Array.isArray(I.value)?I.value:[I.value],O=0;for(let z=0;z<R.length;z++){let B=R[z],Z=x(B);typeof B=="number"||typeof B=="boolean"?(I.__data[0]=B,i.bufferSubData(i.UNIFORM_BUFFER,H+O,I.__data)):B.isMatrix3?(I.__data[0]=B.elements[0],I.__data[1]=B.elements[1],I.__data[2]=B.elements[2],I.__data[3]=0,I.__data[4]=B.elements[3],I.__data[5]=B.elements[4],I.__data[6]=B.elements[5],I.__data[7]=0,I.__data[8]=B.elements[6],I.__data[9]=B.elements[7],I.__data[10]=B.elements[8],I.__data[11]=0):(B.toArray(I.__data,O),O+=Z.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,H,I.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(S,w,y,L){let C=S.value,A=w+"_"+y;if(L[A]===void 0)return typeof C=="number"||typeof C=="boolean"?L[A]=C:L[A]=C.clone(),!0;{let E=L[A];if(typeof C=="number"||typeof C=="boolean"){if(E!==C)return L[A]=C,!0}else if(E.equals(C)===!1)return E.copy(C),!0}return!1}function g(S){let w=S.uniforms,y=0,L=16;for(let A=0,E=w.length;A<E;A++){let v=Array.isArray(w[A])?w[A]:[w[A]];for(let _=0,I=v.length;_<I;_++){let H=v[_],R=Array.isArray(H.value)?H.value:[H.value];for(let O=0,z=R.length;O<z;O++){let B=R[O],Z=x(B),G=y%L,se=G%Z.boundary,ee=G+se;y+=se,ee!==0&&L-ee<Z.storage&&(y+=L-ee),H.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),H.__offset=y,y+=Z.storage}}}let C=y%L;return C>0&&(y+=L-C),S.__size=y,S.__cache={},this}function x(S){let w={boundary:0,storage:0};return typeof S=="number"||typeof S=="boolean"?(w.boundary=4,w.storage=4):S.isVector2?(w.boundary=8,w.storage=8):S.isVector3||S.isColor?(w.boundary=16,w.storage=12):S.isVector4?(w.boundary=16,w.storage=16):S.isMatrix3?(w.boundary=48,w.storage=48):S.isMatrix4?(w.boundary=64,w.storage=64):S.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",S),w}function p(S){let w=S.target;w.removeEventListener("dispose",p);let y=o.indexOf(w.__bindingPointIndex);o.splice(y,1),i.deleteBuffer(s[w.id]),delete s[w.id],delete r[w.id]}function f(){for(let S in s)i.deleteBuffer(s[S]);o=[],s={},r={}}return{bind:l,update:h,dispose:f}}var ao=class{constructor(e={}){let{canvas:t=Tm(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:h=!1,powerPreference:c="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=o;let g=new Uint32Array(4),x=new Int32Array(4),p=null,f=null,S=[],w=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=En,this.toneMapping=Bi,this.toneMappingExposure=1;let y=this,L=!1,C=0,A=0,E=null,v=-1,_=null,I=new ft,H=new ft,R=null,O=new xe(0),z=0,B=t.width,Z=t.height,G=1,se=null,ee=null,fe=new ft(0,0,B,Z),Ue=new ft(0,0,B,Z),et=!1,$=new Vr,ie=!1,be=!1,le=new Ve,Re=new Ve,Ne=new D,ze=new ft,Et={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ze=!1;function Rt(){return E===null?G:1}let k=n;function wn(M,N){return t.getContext(M,N)}try{let M={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:h,powerPreference:c,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine","three.js r170"),t.addEventListener("webglcontextlost",J,!1),t.addEventListener("webglcontextrestored",de,!1),t.addEventListener("webglcontextcreationerror",he,!1),k===null){let N="webgl2";if(k=wn(N,M),k===null)throw wn(N)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let qe,$e,Ee,_t,Ae,T,b,V,K,j,Y,Me,ce,pe,Ke,te,me,Ce,Pe,ge,Ye,Be,pt,U;function oe(){qe=new Bx(k),qe.init(),Be=new gy(k,qe),$e=new Lx(k,qe,e,Be),Ee=new fy(k,qe),$e.reverseDepthBuffer&&d&&Ee.buffers.depth.setReversed(!0),_t=new Hx(k),Ae=new ey,T=new my(k,qe,Ee,Ae,$e,Be,_t),b=new Ux(y),V=new kx(y),K=new Ym(k),pt=new Px(k,K),j=new Ox(k,K,_t,pt),Y=new Gx(k,j,K,_t),Pe=new Vx(k,$e,T),te=new Dx(Ae),Me=new Qv(y,b,V,qe,$e,pt,te),ce=new by(y,Ae),pe=new ny,Ke=new ly(qe),Ce=new Rx(y,b,V,Ee,Y,m,l),me=new uy(y,Y,$e),U=new My(k,_t,$e,Ee),ge=new Ix(k,qe,_t),Ye=new zx(k,qe,_t),_t.programs=Me.programs,y.capabilities=$e,y.extensions=qe,y.properties=Ae,y.renderLists=pe,y.shadowMap=me,y.state=Ee,y.info=_t}oe();let q=new nh(y,k);this.xr=q,this.getContext=function(){return k},this.getContextAttributes=function(){return k.getContextAttributes()},this.forceContextLoss=function(){let M=qe.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){let M=qe.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return G},this.setPixelRatio=function(M){M!==void 0&&(G=M,this.setSize(B,Z,!1))},this.getSize=function(M){return M.set(B,Z)},this.setSize=function(M,N,W=!0){if(q.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}B=M,Z=N,t.width=Math.floor(M*G),t.height=Math.floor(N*G),W===!0&&(t.style.width=M+"px",t.style.height=N+"px"),this.setViewport(0,0,M,N)},this.getDrawingBufferSize=function(M){return M.set(B*G,Z*G).floor()},this.setDrawingBufferSize=function(M,N,W){B=M,Z=N,G=W,t.width=Math.floor(M*W),t.height=Math.floor(N*W),this.setViewport(0,0,M,N)},this.getCurrentViewport=function(M){return M.copy(I)},this.getViewport=function(M){return M.copy(fe)},this.setViewport=function(M,N,W,X){M.isVector4?fe.set(M.x,M.y,M.z,M.w):fe.set(M,N,W,X),Ee.viewport(I.copy(fe).multiplyScalar(G).round())},this.getScissor=function(M){return M.copy(Ue)},this.setScissor=function(M,N,W,X){M.isVector4?Ue.set(M.x,M.y,M.z,M.w):Ue.set(M,N,W,X),Ee.scissor(H.copy(Ue).multiplyScalar(G).round())},this.getScissorTest=function(){return et},this.setScissorTest=function(M){Ee.setScissorTest(et=M)},this.setOpaqueSort=function(M){se=M},this.setTransparentSort=function(M){ee=M},this.getClearColor=function(M){return M.copy(Ce.getClearColor())},this.setClearColor=function(){Ce.setClearColor.apply(Ce,arguments)},this.getClearAlpha=function(){return Ce.getClearAlpha()},this.setClearAlpha=function(){Ce.setClearAlpha.apply(Ce,arguments)},this.clear=function(M=!0,N=!0,W=!0){let X=0;if(M){let F=!1;if(E!==null){let ne=E.texture.format;F=ne===wh||ne===Sh||ne===Mh}if(F){let ne=E.texture.type,ue=ne===pi||ne===cs||ne===Hr||ne===Js||ne===yh||ne===_h,ve=Ce.getClearColor(),ye=Ce.getClearAlpha(),Ie=ve.r,ke=ve.g,_e=ve.b;ue?(g[0]=Ie,g[1]=ke,g[2]=_e,g[3]=ye,k.clearBufferuiv(k.COLOR,0,g)):(x[0]=Ie,x[1]=ke,x[2]=_e,x[3]=ye,k.clearBufferiv(k.COLOR,0,x))}else X|=k.COLOR_BUFFER_BIT}N&&(X|=k.DEPTH_BUFFER_BIT),W&&(X|=k.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),k.clear(X)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",J,!1),t.removeEventListener("webglcontextrestored",de,!1),t.removeEventListener("webglcontextcreationerror",he,!1),pe.dispose(),Ke.dispose(),Ae.dispose(),b.dispose(),V.dispose(),Y.dispose(),pt.dispose(),U.dispose(),Me.dispose(),q.dispose(),q.removeEventListener("sessionstart",pu),q.removeEventListener("sessionend",mu),Zi.stop()};function J(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),L=!0}function de(){console.log("THREE.WebGLRenderer: Context Restored."),L=!1;let M=_t.autoReset,N=me.enabled,W=me.autoUpdate,X=me.needsUpdate,F=me.type;oe(),_t.autoReset=M,me.enabled=N,me.autoUpdate=W,me.needsUpdate=X,me.type=F}function he(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function Fe(M){let N=M.target;N.removeEventListener("dispose",Fe),Ct(N)}function Ct(M){Yt(M),Ae.remove(M)}function Yt(M){let N=Ae.get(M).programs;N!==void 0&&(N.forEach(function(W){Me.releaseProgram(W)}),M.isShaderMaterial&&Me.releaseShaderCache(M))}this.renderBufferDirect=function(M,N,W,X,F,ne){N===null&&(N=Et);let ue=F.isMesh&&F.matrixWorld.determinant()<0,ve=hp(M,N,W,X,F);Ee.setMaterial(X,ue);let ye=W.index,Ie=1;if(X.wireframe===!0){if(ye=j.getWireframeAttribute(W),ye===void 0)return;Ie=2}let ke=W.drawRange,_e=W.attributes.position,Qe=ke.start*Ie,mt=(ke.start+ke.count)*Ie;ne!==null&&(Qe=Math.max(Qe,ne.start*Ie),mt=Math.min(mt,(ne.start+ne.count)*Ie)),ye!==null?(Qe=Math.max(Qe,0),mt=Math.min(mt,ye.count)):_e!=null&&(Qe=Math.max(Qe,0),mt=Math.min(mt,_e.count));let bt=mt-Qe;if(bt<0||bt===1/0)return;pt.setup(F,X,ve,W,ye);let ln,tt=ge;if(ye!==null&&(ln=K.get(ye),tt=Ye,tt.setIndex(ln)),F.isMesh)X.wireframe===!0?(Ee.setLineWidth(X.wireframeLinewidth*Rt()),tt.setMode(k.LINES)):tt.setMode(k.TRIANGLES);else if(F.isLine){let Se=X.linewidth;Se===void 0&&(Se=1),Ee.setLineWidth(Se*Rt()),F.isLineSegments?tt.setMode(k.LINES):F.isLineLoop?tt.setMode(k.LINE_LOOP):tt.setMode(k.LINE_STRIP)}else F.isPoints?tt.setMode(k.POINTS):F.isSprite&&tt.setMode(k.TRIANGLES);if(F.isBatchedMesh)if(F._multiDrawInstances!==null)tt.renderMultiDrawInstances(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount,F._multiDrawInstances);else if(qe.get("WEBGL_multi_draw"))tt.renderMultiDraw(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount);else{let Se=F._multiDrawStarts,si=F._multiDrawCounts,nt=F._multiDrawCount,Nn=ye?K.get(ye).bytesPerElement:1,As=Ae.get(X).currentProgram.getUniforms();for(let mn=0;mn<nt;mn++)As.setValue(k,"_gl_DrawID",mn),tt.render(Se[mn]/Nn,si[mn])}else if(F.isInstancedMesh)tt.renderInstances(Qe,bt,F.count);else if(W.isInstancedBufferGeometry){let Se=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,si=Math.min(W.instanceCount,Se);tt.renderInstances(Qe,bt,si)}else tt.render(Qe,bt)};function ot(M,N,W){M.transparent===!0&&M.side===Cn&&M.forceSinglePass===!1?(M.side=dn,M.needsUpdate=!0,ua(M,N,W),M.side=Oi,M.needsUpdate=!0,ua(M,N,W),M.side=Cn):ua(M,N,W)}this.compile=function(M,N,W=null){W===null&&(W=M),f=Ke.get(W),f.init(N),w.push(f),W.traverseVisible(function(F){F.isLight&&F.layers.test(N.layers)&&(f.pushLight(F),F.castShadow&&f.pushShadow(F))}),M!==W&&M.traverseVisible(function(F){F.isLight&&F.layers.test(N.layers)&&(f.pushLight(F),F.castShadow&&f.pushShadow(F))}),f.setupLights();let X=new Set;return M.traverse(function(F){if(!(F.isMesh||F.isPoints||F.isLine||F.isSprite))return;let ne=F.material;if(ne)if(Array.isArray(ne))for(let ue=0;ue<ne.length;ue++){let ve=ne[ue];ot(ve,W,F),X.add(ve)}else ot(ne,W,F),X.add(ne)}),w.pop(),f=null,X},this.compileAsync=function(M,N,W=null){let X=this.compile(M,N,W);return new Promise(F=>{function ne(){if(X.forEach(function(ue){Ae.get(ue).currentProgram.isReady()&&X.delete(ue)}),X.size===0){F(M);return}setTimeout(ne,10)}qe.get("KHR_parallel_shader_compile")!==null?ne():setTimeout(ne,10)})};let Un=null;function ii(M){Un&&Un(M)}function pu(){Zi.stop()}function mu(){Zi.start()}let Zi=new Qd;Zi.setAnimationLoop(ii),typeof self<"u"&&Zi.setContext(self),this.setAnimationLoop=function(M){Un=M,q.setAnimationLoop(M),M===null?Zi.stop():Zi.start()},q.addEventListener("sessionstart",pu),q.addEventListener("sessionend",mu),this.render=function(M,N){if(N!==void 0&&N.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(L===!0)return;if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),q.enabled===!0&&q.isPresenting===!0&&(q.cameraAutoUpdate===!0&&q.updateCamera(N),N=q.getCamera()),M.isScene===!0&&M.onBeforeRender(y,M,N,E),f=Ke.get(M,w.length),f.init(N),w.push(f),Re.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),$.setFromProjectionMatrix(Re),be=this.localClippingEnabled,ie=te.init(this.clippingPlanes,be),p=pe.get(M,S.length),p.init(),S.push(p),q.enabled===!0&&q.isPresenting===!0){let ne=y.xr.getDepthSensingMesh();ne!==null&&ml(ne,N,-1/0,y.sortObjects)}ml(M,N,0,y.sortObjects),p.finish(),y.sortObjects===!0&&p.sort(se,ee),Ze=q.enabled===!1||q.isPresenting===!1||q.hasDepthSensing()===!1,Ze&&Ce.addToRenderList(p,M),this.info.render.frame++,ie===!0&&te.beginShadows();let W=f.state.shadowsArray;me.render(W,M,N),ie===!0&&te.endShadows(),this.info.autoReset===!0&&this.info.reset();let X=p.opaque,F=p.transmissive;if(f.setupLights(),N.isArrayCamera){let ne=N.cameras;if(F.length>0)for(let ue=0,ve=ne.length;ue<ve;ue++){let ye=ne[ue];xu(X,F,M,ye)}Ze&&Ce.render(M);for(let ue=0,ve=ne.length;ue<ve;ue++){let ye=ne[ue];gu(p,M,ye,ye.viewport)}}else F.length>0&&xu(X,F,M,N),Ze&&Ce.render(M),gu(p,M,N);E!==null&&(T.updateMultisampleRenderTarget(E),T.updateRenderTargetMipmap(E)),M.isScene===!0&&M.onAfterRender(y,M,N),pt.resetDefaultState(),v=-1,_=null,w.pop(),w.length>0?(f=w[w.length-1],ie===!0&&te.setGlobalState(y.clippingPlanes,f.state.camera)):f=null,S.pop(),S.length>0?p=S[S.length-1]:p=null};function ml(M,N,W,X){if(M.visible===!1)return;if(M.layers.test(N.layers)){if(M.isGroup)W=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(N);else if(M.isLight)f.pushLight(M),M.castShadow&&f.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||$.intersectsSprite(M)){X&&ze.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Re);let ue=Y.update(M),ve=M.material;ve.visible&&p.push(M,ue,ve,W,ze.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||$.intersectsObject(M))){let ue=Y.update(M),ve=M.material;if(X&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),ze.copy(M.boundingSphere.center)):(ue.boundingSphere===null&&ue.computeBoundingSphere(),ze.copy(ue.boundingSphere.center)),ze.applyMatrix4(M.matrixWorld).applyMatrix4(Re)),Array.isArray(ve)){let ye=ue.groups;for(let Ie=0,ke=ye.length;Ie<ke;Ie++){let _e=ye[Ie],Qe=ve[_e.materialIndex];Qe&&Qe.visible&&p.push(M,ue,Qe,W,ze.z,_e)}}else ve.visible&&p.push(M,ue,ve,W,ze.z,null)}}let ne=M.children;for(let ue=0,ve=ne.length;ue<ve;ue++)ml(ne[ue],N,W,X)}function gu(M,N,W,X){let F=M.opaque,ne=M.transmissive,ue=M.transparent;f.setupLightsView(W),ie===!0&&te.setGlobalState(y.clippingPlanes,W),X&&Ee.viewport(I.copy(X)),F.length>0&&ha(F,N,W),ne.length>0&&ha(ne,N,W),ue.length>0&&ha(ue,N,W),Ee.buffers.depth.setTest(!0),Ee.buffers.depth.setMask(!0),Ee.buffers.color.setMask(!0),Ee.setPolygonOffset(!1)}function xu(M,N,W,X){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[X.id]===void 0&&(f.state.transmissionRenderTarget[X.id]=new mi(1,1,{generateMipmaps:!0,type:qe.has("EXT_color_buffer_half_float")||qe.has("EXT_color_buffer_float")?Xr:pi,minFilter:ls,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Je.workingColorSpace}));let ne=f.state.transmissionRenderTarget[X.id],ue=X.viewport||I;ne.setSize(ue.z,ue.w);let ve=y.getRenderTarget();y.setRenderTarget(ne),y.getClearColor(O),z=y.getClearAlpha(),z<1&&y.setClearColor(16777215,.5),y.clear(),Ze&&Ce.render(W);let ye=y.toneMapping;y.toneMapping=Bi;let Ie=X.viewport;if(X.viewport!==void 0&&(X.viewport=void 0),f.setupLightsView(X),ie===!0&&te.setGlobalState(y.clippingPlanes,X),ha(M,W,X),T.updateMultisampleRenderTarget(ne),T.updateRenderTargetMipmap(ne),qe.has("WEBGL_multisampled_render_to_texture")===!1){let ke=!1;for(let _e=0,Qe=N.length;_e<Qe;_e++){let mt=N[_e],bt=mt.object,ln=mt.geometry,tt=mt.material,Se=mt.group;if(tt.side===Cn&&bt.layers.test(X.layers)){let si=tt.side;tt.side=dn,tt.needsUpdate=!0,vu(bt,W,X,ln,tt,Se),tt.side=si,tt.needsUpdate=!0,ke=!0}}ke===!0&&(T.updateMultisampleRenderTarget(ne),T.updateRenderTargetMipmap(ne))}y.setRenderTarget(ve),y.setClearColor(O,z),Ie!==void 0&&(X.viewport=Ie),y.toneMapping=ye}function ha(M,N,W){let X=N.isScene===!0?N.overrideMaterial:null;for(let F=0,ne=M.length;F<ne;F++){let ue=M[F],ve=ue.object,ye=ue.geometry,Ie=X===null?ue.material:X,ke=ue.group;ve.layers.test(W.layers)&&vu(ve,N,W,ye,Ie,ke)}}function vu(M,N,W,X,F,ne){M.onBeforeRender(y,N,W,X,F,ne),M.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),F.onBeforeRender(y,N,W,X,M,ne),F.transparent===!0&&F.side===Cn&&F.forceSinglePass===!1?(F.side=dn,F.needsUpdate=!0,y.renderBufferDirect(W,N,X,F,M,ne),F.side=Oi,F.needsUpdate=!0,y.renderBufferDirect(W,N,X,F,M,ne),F.side=Cn):y.renderBufferDirect(W,N,X,F,M,ne),M.onAfterRender(y,N,W,X,F,ne)}function ua(M,N,W){N.isScene!==!0&&(N=Et);let X=Ae.get(M),F=f.state.lights,ne=f.state.shadowsArray,ue=F.state.version,ve=Me.getParameters(M,F.state,ne,N,W),ye=Me.getProgramCacheKey(ve),Ie=X.programs;X.environment=M.isMeshStandardMaterial?N.environment:null,X.fog=N.fog,X.envMap=(M.isMeshStandardMaterial?V:b).get(M.envMap||X.environment),X.envMapRotation=X.environment!==null&&M.envMap===null?N.environmentRotation:M.envMapRotation,Ie===void 0&&(M.addEventListener("dispose",Fe),Ie=new Map,X.programs=Ie);let ke=Ie.get(ye);if(ke!==void 0){if(X.currentProgram===ke&&X.lightsStateVersion===ue)return _u(M,ve),ke}else ve.uniforms=Me.getUniforms(M),M.onBeforeCompile(ve,y),ke=Me.acquireProgram(ve,ye),Ie.set(ye,ke),X.uniforms=ve.uniforms;let _e=X.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(_e.clippingPlanes=te.uniform),_u(M,ve),X.needsLights=dp(M),X.lightsStateVersion=ue,X.needsLights&&(_e.ambientLightColor.value=F.state.ambient,_e.lightProbe.value=F.state.probe,_e.directionalLights.value=F.state.directional,_e.directionalLightShadows.value=F.state.directionalShadow,_e.spotLights.value=F.state.spot,_e.spotLightShadows.value=F.state.spotShadow,_e.rectAreaLights.value=F.state.rectArea,_e.ltc_1.value=F.state.rectAreaLTC1,_e.ltc_2.value=F.state.rectAreaLTC2,_e.pointLights.value=F.state.point,_e.pointLightShadows.value=F.state.pointShadow,_e.hemisphereLights.value=F.state.hemi,_e.directionalShadowMap.value=F.state.directionalShadowMap,_e.directionalShadowMatrix.value=F.state.directionalShadowMatrix,_e.spotShadowMap.value=F.state.spotShadowMap,_e.spotLightMatrix.value=F.state.spotLightMatrix,_e.spotLightMap.value=F.state.spotLightMap,_e.pointShadowMap.value=F.state.pointShadowMap,_e.pointShadowMatrix.value=F.state.pointShadowMatrix),X.currentProgram=ke,X.uniformsList=null,ke}function yu(M){if(M.uniformsList===null){let N=M.currentProgram.getUniforms();M.uniformsList=$s.seqWithValue(N.seq,M.uniforms)}return M.uniformsList}function _u(M,N){let W=Ae.get(M);W.outputColorSpace=N.outputColorSpace,W.batching=N.batching,W.batchingColor=N.batchingColor,W.instancing=N.instancing,W.instancingColor=N.instancingColor,W.instancingMorph=N.instancingMorph,W.skinning=N.skinning,W.morphTargets=N.morphTargets,W.morphNormals=N.morphNormals,W.morphColors=N.morphColors,W.morphTargetsCount=N.morphTargetsCount,W.numClippingPlanes=N.numClippingPlanes,W.numIntersection=N.numClipIntersection,W.vertexAlphas=N.vertexAlphas,W.vertexTangents=N.vertexTangents,W.toneMapping=N.toneMapping}function hp(M,N,W,X,F){N.isScene!==!0&&(N=Et),T.resetTextureUnits();let ne=N.fog,ue=X.isMeshStandardMaterial?N.environment:null,ve=E===null?y.outputColorSpace:E.isXRRenderTarget===!0?E.texture.colorSpace:nr,ye=(X.isMeshStandardMaterial?V:b).get(X.envMap||ue),Ie=X.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,ke=!!W.attributes.tangent&&(!!X.normalMap||X.anisotropy>0),_e=!!W.morphAttributes.position,Qe=!!W.morphAttributes.normal,mt=!!W.morphAttributes.color,bt=Bi;X.toneMapped&&(E===null||E.isXRRenderTarget===!0)&&(bt=y.toneMapping);let ln=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,tt=ln!==void 0?ln.length:0,Se=Ae.get(X),si=f.state.lights;if(ie===!0&&(be===!0||M!==_)){let An=M===_&&X.id===v;te.setState(X,M,An)}let nt=!1;X.version===Se.__version?(Se.needsLights&&Se.lightsStateVersion!==si.state.version||Se.outputColorSpace!==ve||F.isBatchedMesh&&Se.batching===!1||!F.isBatchedMesh&&Se.batching===!0||F.isBatchedMesh&&Se.batchingColor===!0&&F.colorTexture===null||F.isBatchedMesh&&Se.batchingColor===!1&&F.colorTexture!==null||F.isInstancedMesh&&Se.instancing===!1||!F.isInstancedMesh&&Se.instancing===!0||F.isSkinnedMesh&&Se.skinning===!1||!F.isSkinnedMesh&&Se.skinning===!0||F.isInstancedMesh&&Se.instancingColor===!0&&F.instanceColor===null||F.isInstancedMesh&&Se.instancingColor===!1&&F.instanceColor!==null||F.isInstancedMesh&&Se.instancingMorph===!0&&F.morphTexture===null||F.isInstancedMesh&&Se.instancingMorph===!1&&F.morphTexture!==null||Se.envMap!==ye||X.fog===!0&&Se.fog!==ne||Se.numClippingPlanes!==void 0&&(Se.numClippingPlanes!==te.numPlanes||Se.numIntersection!==te.numIntersection)||Se.vertexAlphas!==Ie||Se.vertexTangents!==ke||Se.morphTargets!==_e||Se.morphNormals!==Qe||Se.morphColors!==mt||Se.toneMapping!==bt||Se.morphTargetsCount!==tt)&&(nt=!0):(nt=!0,Se.__version=X.version);let Nn=Se.currentProgram;nt===!0&&(Nn=ua(X,N,F));let As=!1,mn=!1,_r=!1,Mt=Nn.getUniforms(),qn=Se.uniforms;if(Ee.useProgram(Nn.program)&&(As=!0,mn=!0,_r=!0),X.id!==v&&(v=X.id,mn=!0),As||_!==M){Ee.buffers.depth.getReversed()?(le.copy(M.projectionMatrix),Cm(le),Rm(le),Mt.setValue(k,"projectionMatrix",le)):Mt.setValue(k,"projectionMatrix",M.projectionMatrix),Mt.setValue(k,"viewMatrix",M.matrixWorldInverse);let Ci=Mt.map.cameraPosition;Ci!==void 0&&Ci.setValue(k,Ne.setFromMatrixPosition(M.matrixWorld)),$e.logarithmicDepthBuffer&&Mt.setValue(k,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(X.isMeshPhongMaterial||X.isMeshToonMaterial||X.isMeshLambertMaterial||X.isMeshBasicMaterial||X.isMeshStandardMaterial||X.isShaderMaterial)&&Mt.setValue(k,"isOrthographic",M.isOrthographicCamera===!0),_!==M&&(_=M,mn=!0,_r=!0)}if(F.isSkinnedMesh){Mt.setOptional(k,F,"bindMatrix"),Mt.setOptional(k,F,"bindMatrixInverse");let An=F.skeleton;An&&(An.boneTexture===null&&An.computeBoneTexture(),Mt.setValue(k,"boneTexture",An.boneTexture,T))}F.isBatchedMesh&&(Mt.setOptional(k,F,"batchingTexture"),Mt.setValue(k,"batchingTexture",F._matricesTexture,T),Mt.setOptional(k,F,"batchingIdTexture"),Mt.setValue(k,"batchingIdTexture",F._indirectTexture,T),Mt.setOptional(k,F,"batchingColorTexture"),F._colorsTexture!==null&&Mt.setValue(k,"batchingColorTexture",F._colorsTexture,T));let br=W.morphAttributes;if((br.position!==void 0||br.normal!==void 0||br.color!==void 0)&&Pe.update(F,W,Nn),(mn||Se.receiveShadow!==F.receiveShadow)&&(Se.receiveShadow=F.receiveShadow,Mt.setValue(k,"receiveShadow",F.receiveShadow)),X.isMeshGouraudMaterial&&X.envMap!==null&&(qn.envMap.value=ye,qn.flipEnvMap.value=ye.isCubeTexture&&ye.isRenderTargetTexture===!1?-1:1),X.isMeshStandardMaterial&&X.envMap===null&&N.environment!==null&&(qn.envMapIntensity.value=N.environmentIntensity),mn&&(Mt.setValue(k,"toneMappingExposure",y.toneMappingExposure),Se.needsLights&&up(qn,_r),ne&&X.fog===!0&&ce.refreshFogUniforms(qn,ne),ce.refreshMaterialUniforms(qn,X,G,Z,f.state.transmissionRenderTarget[M.id]),$s.upload(k,yu(Se),qn,T)),X.isShaderMaterial&&X.uniformsNeedUpdate===!0&&($s.upload(k,yu(Se),qn,T),X.uniformsNeedUpdate=!1),X.isSpriteMaterial&&Mt.setValue(k,"center",F.center),Mt.setValue(k,"modelViewMatrix",F.modelViewMatrix),Mt.setValue(k,"normalMatrix",F.normalMatrix),Mt.setValue(k,"modelMatrix",F.matrixWorld),X.isShaderMaterial||X.isRawShaderMaterial){let An=X.uniformsGroups;for(let Ci=0,Ri=An.length;Ci<Ri;Ci++){let bu=An[Ci];U.update(bu,Nn),U.bind(bu,Nn)}}return Nn}function up(M,N){M.ambientLightColor.needsUpdate=N,M.lightProbe.needsUpdate=N,M.directionalLights.needsUpdate=N,M.directionalLightShadows.needsUpdate=N,M.pointLights.needsUpdate=N,M.pointLightShadows.needsUpdate=N,M.spotLights.needsUpdate=N,M.spotLightShadows.needsUpdate=N,M.rectAreaLights.needsUpdate=N,M.hemisphereLights.needsUpdate=N}function dp(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return C},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return E},this.setRenderTargetTextures=function(M,N,W){Ae.get(M.texture).__webglTexture=N,Ae.get(M.depthTexture).__webglTexture=W;let X=Ae.get(M);X.__hasExternalTextures=!0,X.__autoAllocateDepthBuffer=W===void 0,X.__autoAllocateDepthBuffer||qe.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),X.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(M,N){let W=Ae.get(M);W.__webglFramebuffer=N,W.__useDefaultFramebuffer=N===void 0},this.setRenderTarget=function(M,N=0,W=0){E=M,C=N,A=W;let X=!0,F=null,ne=!1,ue=!1;if(M){let ye=Ae.get(M);if(ye.__useDefaultFramebuffer!==void 0)Ee.bindFramebuffer(k.FRAMEBUFFER,null),X=!1;else if(ye.__webglFramebuffer===void 0)T.setupRenderTarget(M);else if(ye.__hasExternalTextures)T.rebindTextures(M,Ae.get(M.texture).__webglTexture,Ae.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let _e=M.depthTexture;if(ye.__boundDepthTexture!==_e){if(_e!==null&&Ae.has(_e)&&(M.width!==_e.image.width||M.height!==_e.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");T.setupDepthRenderbuffer(M)}}let Ie=M.texture;(Ie.isData3DTexture||Ie.isDataArrayTexture||Ie.isCompressedArrayTexture)&&(ue=!0);let ke=Ae.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(ke[N])?F=ke[N][W]:F=ke[N],ne=!0):M.samples>0&&T.useMultisampledRTT(M)===!1?F=Ae.get(M).__webglMultisampledFramebuffer:Array.isArray(ke)?F=ke[W]:F=ke,I.copy(M.viewport),H.copy(M.scissor),R=M.scissorTest}else I.copy(fe).multiplyScalar(G).floor(),H.copy(Ue).multiplyScalar(G).floor(),R=et;if(Ee.bindFramebuffer(k.FRAMEBUFFER,F)&&X&&Ee.drawBuffers(M,F),Ee.viewport(I),Ee.scissor(H),Ee.setScissorTest(R),ne){let ye=Ae.get(M.texture);k.framebufferTexture2D(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_CUBE_MAP_POSITIVE_X+N,ye.__webglTexture,W)}else if(ue){let ye=Ae.get(M.texture),Ie=N||0;k.framebufferTextureLayer(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0,ye.__webglTexture,W||0,Ie)}v=-1},this.readRenderTargetPixels=function(M,N,W,X,F,ne,ue){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ve=Ae.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ue!==void 0&&(ve=ve[ue]),ve){Ee.bindFramebuffer(k.FRAMEBUFFER,ve);try{let ye=M.texture,Ie=ye.format,ke=ye.type;if(!$e.textureFormatReadable(Ie)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!$e.textureTypeReadable(ke)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=M.width-X&&W>=0&&W<=M.height-F&&k.readPixels(N,W,X,F,Be.convert(Ie),Be.convert(ke),ne)}finally{let ye=E!==null?Ae.get(E).__webglFramebuffer:null;Ee.bindFramebuffer(k.FRAMEBUFFER,ye)}}},this.readRenderTargetPixelsAsync=async function(M,N,W,X,F,ne,ue){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ve=Ae.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ue!==void 0&&(ve=ve[ue]),ve){let ye=M.texture,Ie=ye.format,ke=ye.type;if(!$e.textureFormatReadable(Ie))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!$e.textureTypeReadable(ke))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(N>=0&&N<=M.width-X&&W>=0&&W<=M.height-F){Ee.bindFramebuffer(k.FRAMEBUFFER,ve);let _e=k.createBuffer();k.bindBuffer(k.PIXEL_PACK_BUFFER,_e),k.bufferData(k.PIXEL_PACK_BUFFER,ne.byteLength,k.STREAM_READ),k.readPixels(N,W,X,F,Be.convert(Ie),Be.convert(ke),0);let Qe=E!==null?Ae.get(E).__webglFramebuffer:null;Ee.bindFramebuffer(k.FRAMEBUFFER,Qe);let mt=k.fenceSync(k.SYNC_GPU_COMMANDS_COMPLETE,0);return k.flush(),await Em(k,mt,4),k.bindBuffer(k.PIXEL_PACK_BUFFER,_e),k.getBufferSubData(k.PIXEL_PACK_BUFFER,0,ne),k.deleteBuffer(_e),k.deleteSync(mt),ne}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(M,N=null,W=0){M.isTexture!==!0&&(kr("WebGLRenderer: copyFramebufferToTexture function signature has changed."),N=arguments[0]||null,M=arguments[1]);let X=Math.pow(2,-W),F=Math.floor(M.image.width*X),ne=Math.floor(M.image.height*X),ue=N!==null?N.x:0,ve=N!==null?N.y:0;T.setTexture2D(M,0),k.copyTexSubImage2D(k.TEXTURE_2D,W,0,0,ue,ve,F,ne),Ee.unbindTexture()},this.copyTextureToTexture=function(M,N,W=null,X=null,F=0){M.isTexture!==!0&&(kr("WebGLRenderer: copyTextureToTexture function signature has changed."),X=arguments[0]||null,M=arguments[1],N=arguments[2],F=arguments[3]||0,W=null);let ne,ue,ve,ye,Ie,ke,_e,Qe,mt,bt=M.isCompressedTexture?M.mipmaps[F]:M.image;W!==null?(ne=W.max.x-W.min.x,ue=W.max.y-W.min.y,ve=W.isBox3?W.max.z-W.min.z:1,ye=W.min.x,Ie=W.min.y,ke=W.isBox3?W.min.z:0):(ne=bt.width,ue=bt.height,ve=bt.depth||1,ye=0,Ie=0,ke=0),X!==null?(_e=X.x,Qe=X.y,mt=X.z):(_e=0,Qe=0,mt=0);let ln=Be.convert(N.format),tt=Be.convert(N.type),Se;N.isData3DTexture?(T.setTexture3D(N,0),Se=k.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(T.setTexture2DArray(N,0),Se=k.TEXTURE_2D_ARRAY):(T.setTexture2D(N,0),Se=k.TEXTURE_2D),k.pixelStorei(k.UNPACK_FLIP_Y_WEBGL,N.flipY),k.pixelStorei(k.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),k.pixelStorei(k.UNPACK_ALIGNMENT,N.unpackAlignment);let si=k.getParameter(k.UNPACK_ROW_LENGTH),nt=k.getParameter(k.UNPACK_IMAGE_HEIGHT),Nn=k.getParameter(k.UNPACK_SKIP_PIXELS),As=k.getParameter(k.UNPACK_SKIP_ROWS),mn=k.getParameter(k.UNPACK_SKIP_IMAGES);k.pixelStorei(k.UNPACK_ROW_LENGTH,bt.width),k.pixelStorei(k.UNPACK_IMAGE_HEIGHT,bt.height),k.pixelStorei(k.UNPACK_SKIP_PIXELS,ye),k.pixelStorei(k.UNPACK_SKIP_ROWS,Ie),k.pixelStorei(k.UNPACK_SKIP_IMAGES,ke);let _r=M.isDataArrayTexture||M.isData3DTexture,Mt=N.isDataArrayTexture||N.isData3DTexture;if(M.isRenderTargetTexture||M.isDepthTexture){let qn=Ae.get(M),br=Ae.get(N),An=Ae.get(qn.__renderTarget),Ci=Ae.get(br.__renderTarget);Ee.bindFramebuffer(k.READ_FRAMEBUFFER,An.__webglFramebuffer),Ee.bindFramebuffer(k.DRAW_FRAMEBUFFER,Ci.__webglFramebuffer);for(let Ri=0;Ri<ve;Ri++)_r&&k.framebufferTextureLayer(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,Ae.get(M).__webglTexture,F,ke+Ri),M.isDepthTexture?(Mt&&k.framebufferTextureLayer(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,Ae.get(N).__webglTexture,F,mt+Ri),k.blitFramebuffer(ye,Ie,ne,ue,_e,Qe,ne,ue,k.DEPTH_BUFFER_BIT,k.NEAREST)):Mt?k.copyTexSubImage3D(Se,F,_e,Qe,mt+Ri,ye,Ie,ne,ue):k.copyTexSubImage2D(Se,F,_e,Qe,mt+Ri,ye,Ie,ne,ue);Ee.bindFramebuffer(k.READ_FRAMEBUFFER,null),Ee.bindFramebuffer(k.DRAW_FRAMEBUFFER,null)}else Mt?M.isDataTexture||M.isData3DTexture?k.texSubImage3D(Se,F,_e,Qe,mt,ne,ue,ve,ln,tt,bt.data):N.isCompressedArrayTexture?k.compressedTexSubImage3D(Se,F,_e,Qe,mt,ne,ue,ve,ln,bt.data):k.texSubImage3D(Se,F,_e,Qe,mt,ne,ue,ve,ln,tt,bt):M.isDataTexture?k.texSubImage2D(k.TEXTURE_2D,F,_e,Qe,ne,ue,ln,tt,bt.data):M.isCompressedTexture?k.compressedTexSubImage2D(k.TEXTURE_2D,F,_e,Qe,bt.width,bt.height,ln,bt.data):k.texSubImage2D(k.TEXTURE_2D,F,_e,Qe,ne,ue,ln,tt,bt);k.pixelStorei(k.UNPACK_ROW_LENGTH,si),k.pixelStorei(k.UNPACK_IMAGE_HEIGHT,nt),k.pixelStorei(k.UNPACK_SKIP_PIXELS,Nn),k.pixelStorei(k.UNPACK_SKIP_ROWS,As),k.pixelStorei(k.UNPACK_SKIP_IMAGES,mn),F===0&&N.generateMipmaps&&k.generateMipmap(Se),Ee.unbindTexture()},this.copyTextureToTexture3D=function(M,N,W=null,X=null,F=0){return M.isTexture!==!0&&(kr("WebGLRenderer: copyTextureToTexture3D function signature has changed."),W=arguments[0]||null,X=arguments[1]||null,M=arguments[2],N=arguments[3],F=arguments[4]||0),kr('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(M,N,W,X,F)},this.initRenderTarget=function(M){Ae.get(M).__webglFramebuffer===void 0&&T.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?T.setTextureCube(M,0):M.isData3DTexture?T.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?T.setTexture2DArray(M,0):T.setTexture2D(M,0),Ee.unbindTexture()},this.resetState=function(){C=0,A=0,E=null,Ee.reset(),pt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return di}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorspace=Je._getDrawingBufferColorSpace(e),t.unpackColorSpace=Je._getUnpackColorSpace()}};var oo=class i{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new xe(e),this.near=t,this.far=n}clone(){return new i(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},lo=class extends nn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ut,this.environmentIntensity=1,this.environmentRotation=new Ut,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var ih=class extends _n{constructor(e=null,t=1,n=1,s,r,o,a,l,h=vn,c=vn,u,d){super(null,o,a,l,h,c,s,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var co=class extends yn{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Vs=new Ve,Ud=new Ve,Ha=[],Nd=new gi,Sy=new Ve,Ur=new wt,Nr=new hs,xi=class extends wt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new co(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Sy)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new gi),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Vs),Nd.copy(e.boundingBox).applyMatrix4(Vs),this.boundingBox.union(Nd)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new hs),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Vs),Nr.copy(e.boundingSphere).applyMatrix4(Vs),this.boundingSphere.union(Nr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=e*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(e,t){let n=this.matrixWorld,s=this.count;if(Ur.geometry=this.geometry,Ur.material=this.material,Ur.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Nr.copy(this.boundingSphere),Nr.applyMatrix4(n),e.ray.intersectsSphere(Nr)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Vs),Ud.multiplyMatrices(n,Vs),Ur.matrixWorld=Ud,Ur.raycast(e,Ha);for(let o=0,a=Ha.length;o<a;o++){let l=Ha[o];l.instanceId=r,l.object=this,t.push(l)}Ha.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new co(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new ih(new Float32Array(s*this.count),s,this.count,bh,Zn));let r=this.morphTexture.source.data.data,o=0;for(let h=0;h<n.length;h++)o+=n[h];let a=this.geometry.morphTargetsRelative?1:1-o,l=s*e;r[l]=a,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}};var Gi=class i extends rn{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);let r=[],o=[],a=[],l=[],h=new D,c=new He;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let m=n+u/t*s;h.x=e*Math.cos(m),h.y=e*Math.sin(m),o.push(h.x,h.y,h.z),a.push(0,0,1),c.x=(o[d]/e+1)/2,c.y=(o[d+1]/e+1)/2,l.push(c.x,c.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new it(o,3)),this.setAttribute("normal",new it(a,3)),this.setAttribute("uv",new it(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.segments,e.thetaStart,e.thetaLength)}},Wt=class i extends rn{constructor(e=1,t=1,n=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let h=this;s=Math.floor(s),r=Math.floor(r);let c=[],u=[],d=[],m=[],g=0,x=[],p=n/2,f=0;S(),o===!1&&(e>0&&w(!0),t>0&&w(!1)),this.setIndex(c),this.setAttribute("position",new it(u,3)),this.setAttribute("normal",new it(d,3)),this.setAttribute("uv",new it(m,2));function S(){let y=new D,L=new D,C=0,A=(t-e)/n;for(let E=0;E<=r;E++){let v=[],_=E/r,I=_*(t-e)+e;for(let H=0;H<=s;H++){let R=H/s,O=R*l+a,z=Math.sin(O),B=Math.cos(O);L.x=I*z,L.y=-_*n+p,L.z=I*B,u.push(L.x,L.y,L.z),y.set(z,A,B).normalize(),d.push(y.x,y.y,y.z),m.push(R,1-_),v.push(g++)}x.push(v)}for(let E=0;E<s;E++)for(let v=0;v<r;v++){let _=x[v][E],I=x[v+1][E],H=x[v+1][E+1],R=x[v][E+1];(e>0||v!==0)&&(c.push(_,I,R),C+=3),(t>0||v!==r-1)&&(c.push(I,H,R),C+=3)}h.addGroup(f,C,0),f+=C}function w(y){let L=g,C=new He,A=new D,E=0,v=y===!0?e:t,_=y===!0?1:-1;for(let H=1;H<=s;H++)u.push(0,p*_,0),d.push(0,_,0),m.push(.5,.5),g++;let I=g;for(let H=0;H<=s;H++){let O=H/s*l+a,z=Math.cos(O),B=Math.sin(O);A.x=v*B,A.y=p*_,A.z=v*z,u.push(A.x,A.y,A.z),d.push(0,_,0),C.x=z*.5+.5,C.y=B*.5*_+.5,m.push(C.x,C.y),g++}for(let H=0;H<s;H++){let R=L+H,O=I+H;y===!0?c.push(O,O+1,R):c.push(O+1,O,R),E+=3}h.addGroup(f,E,y===!0?1:2),f+=E}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Wi=class i extends Wt{constructor(e=1,t=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new i(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},ho=class i extends rn{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};let r=[],o=[];a(s),h(n),c(),this.setAttribute("position",new it(r,3)),this.setAttribute("normal",new it(r.slice(),3)),this.setAttribute("uv",new it(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(S){let w=new D,y=new D,L=new D;for(let C=0;C<t.length;C+=3)m(t[C+0],w),m(t[C+1],y),m(t[C+2],L),l(w,y,L,S)}function l(S,w,y,L){let C=L+1,A=[];for(let E=0;E<=C;E++){A[E]=[];let v=S.clone().lerp(y,E/C),_=w.clone().lerp(y,E/C),I=C-E;for(let H=0;H<=I;H++)H===0&&E===C?A[E][H]=v:A[E][H]=v.clone().lerp(_,H/I)}for(let E=0;E<C;E++)for(let v=0;v<2*(C-E)-1;v++){let _=Math.floor(v/2);v%2===0?(d(A[E][_+1]),d(A[E+1][_]),d(A[E][_])):(d(A[E][_+1]),d(A[E+1][_+1]),d(A[E+1][_]))}}function h(S){let w=new D;for(let y=0;y<r.length;y+=3)w.x=r[y+0],w.y=r[y+1],w.z=r[y+2],w.normalize().multiplyScalar(S),r[y+0]=w.x,r[y+1]=w.y,r[y+2]=w.z}function c(){let S=new D;for(let w=0;w<r.length;w+=3){S.x=r[w+0],S.y=r[w+1],S.z=r[w+2];let y=p(S)/2/Math.PI+.5,L=f(S)/Math.PI+.5;o.push(y,1-L)}g(),u()}function u(){for(let S=0;S<o.length;S+=6){let w=o[S+0],y=o[S+2],L=o[S+4],C=Math.max(w,y,L),A=Math.min(w,y,L);C>.9&&A<.1&&(w<.2&&(o[S+0]+=1),y<.2&&(o[S+2]+=1),L<.2&&(o[S+4]+=1))}}function d(S){r.push(S.x,S.y,S.z)}function m(S,w){let y=S*3;w.x=e[y+0],w.y=e[y+1],w.z=e[y+2]}function g(){let S=new D,w=new D,y=new D,L=new D,C=new He,A=new He,E=new He;for(let v=0,_=0;v<r.length;v+=9,_+=6){S.set(r[v+0],r[v+1],r[v+2]),w.set(r[v+3],r[v+4],r[v+5]),y.set(r[v+6],r[v+7],r[v+8]),C.set(o[_+0],o[_+1]),A.set(o[_+2],o[_+3]),E.set(o[_+4],o[_+5]),L.copy(S).add(w).add(y).divideScalar(3);let I=p(L);x(C,_+0,S,I),x(A,_+2,w,I),x(E,_+4,y,I)}}function x(S,w,y,L){L<0&&S.x===1&&(o[w]=S.x-1),y.x===0&&y.z===0&&(o[w]=L/2/Math.PI+.5)}function p(S){return Math.atan2(S.z,-S.x)}function f(S){return Math.atan2(-S.y,Math.sqrt(S.x*S.x+S.z*S.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.vertices,e.indices,e.radius,e.details)}};var vi=class i extends ho{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}},uo=class i extends ho{constructor(e=1,t=0){let n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}};var Hn=class i extends rn{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(o+a,Math.PI),h=0,c=[],u=new D,d=new D,m=[],g=[],x=[],p=[];for(let f=0;f<=n;f++){let S=[],w=f/n,y=0;f===0&&o===0?y=.5/t:f===n&&l===Math.PI&&(y=-.5/t);for(let L=0;L<=t;L++){let C=L/t;u.x=-e*Math.cos(s+C*r)*Math.sin(o+w*a),u.y=e*Math.cos(o+w*a),u.z=e*Math.sin(s+C*r)*Math.sin(o+w*a),g.push(u.x,u.y,u.z),d.copy(u).normalize(),x.push(d.x,d.y,d.z),p.push(C+y,1-w),S.push(h++)}c.push(S)}for(let f=0;f<n;f++)for(let S=0;S<t;S++){let w=c[f][S+1],y=c[f][S],L=c[f+1][S],C=c[f+1][S+1];(f!==0||o>0)&&m.push(w,y,C),(f!==n-1||l<Math.PI)&&m.push(y,L,C)}this.setIndex(m),this.setAttribute("position",new it(g,3)),this.setAttribute("normal",new it(x,3)),this.setAttribute("uv",new it(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Gr=class i extends rn{constructor(e=1,t=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);let o=[],a=[],l=[],h=[],c=new D,u=new D,d=new D;for(let m=0;m<=n;m++)for(let g=0;g<=s;g++){let x=g/s*r,p=m/n*Math.PI*2;u.x=(e+t*Math.cos(p))*Math.cos(x),u.y=(e+t*Math.cos(p))*Math.sin(x),u.z=t*Math.sin(p),a.push(u.x,u.y,u.z),c.x=e*Math.cos(x),c.y=e*Math.sin(x),d.subVectors(u,c).normalize(),l.push(d.x,d.y,d.z),h.push(g/s),h.push(m/n)}for(let m=1;m<=n;m++)for(let g=1;g<=s;g++){let x=(s+1)*m+g-1,p=(s+1)*(m-1)+g-1,f=(s+1)*(m-1)+g,S=(s+1)*m+g;o.push(x,p,S),o.push(p,f,S)}this.setIndex(o),this.setAttribute("position",new it(a,3)),this.setAttribute("normal",new it(l,3)),this.setAttribute("uv",new it(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var fo=class extends Hi{static get type(){return"MeshPhongMaterial"}constructor(e){super(),this.isMeshPhongMaterial=!0,this.color=new xe(16777215),this.specular=new xe(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new xe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ah,this.normalScale=new He(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ut,this.combine=_o,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.specular.copy(e.specular),this.shininess=e.shininess,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Rn=class extends Hi{static get type(){return"MeshLambertMaterial"}constructor(e){super(),this.isMeshLambertMaterial=!0,this.color=new xe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new xe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ah,this.normalScale=new He(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ut,this.combine=_o,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};function Va(i,e,t){return!i||!t&&i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function wy(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var tr=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];e:{t:{let o;n:{i:if(!(e<s)){for(let a=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=t[++n],e<s)break t}o=t.length;break n}if(!(e>=r)){let a=t[1];e<a&&(n=2,r=a);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break t}o=n,n=0;break n}break e}for(;n<o;){let a=n+o>>>1;e<t[a]?o=a:n=a+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=n[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},sh=class extends tr{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Bu,endingEnd:Bu}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case Ou:r=e,a=2*t-n;break;case zu:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Ou:o=e,l=2*n-t;break;case zu:o=1,l=n+s[1]-s[0];break;default:o=e-1,l=t}let h=(n-t)*.5,c=this.valueSize;this._weightPrev=h/(t-a),this._weightNext=h/(l-n),this._offsetPrev=r*c,this._offsetNext=o*c}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,h=l-a,c=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,m=this._weightNext,g=(n-t)/(s-t),x=g*g,p=x*g,f=-d*p+2*d*x-d*g,S=(1+d)*p+(-1.5-2*d)*x+(-.5+d)*g+1,w=(-1-m)*p+(1.5+m)*x+.5*g,y=m*p-m*x;for(let L=0;L!==a;++L)r[L]=f*o[c+L]+S*o[h+L]+w*o[l+L]+y*o[u+L];return r}},rh=class extends tr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,h=l-a,c=(n-t)/(s-t),u=1-c;for(let d=0;d!==a;++d)r[d]=o[h+d]*u+o[l+d]*c;return r}},ah=class extends tr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},Vn=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Va(t,this.TimeBufferType),this.values=Va(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Va(e.times,Array),values:Va(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new ah(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new rh(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new sh(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Ya:t=this.InterpolantFactoryMethodDiscrete;break;case Bc:t=this.InterpolantFactoryMethodLinear;break;case Ml:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ya;case this.InterpolantFactoryMethodLinear:return Bc;case this.InterpolantFactoryMethodSmooth:return Ml}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<e;)++r;for(;o!==-1&&n[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let l=n[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(s!==void 0&&wy(s))for(let a=0,l=s.length;a!==l;++a){let h=s[a];if(isNaN(h)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,h),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Ml,r=e.length-1,o=1;for(let a=1;a<r;++a){let l=!1,h=e[a],c=e[a+1];if(h!==c&&(a!==1||h!==e[0]))if(s)l=!0;else{let u=a*n,d=u-n,m=u+n;for(let g=0;g!==n;++g){let x=t[u+g];if(x!==t[d+g]||x!==t[m+g]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let u=a*n,d=o*n;for(let m=0;m!==n;++m)t[d+m]=t[u+m]}++o}}if(r>0){e[o]=e[r];for(let a=r*n,l=o*n,h=0;h!==n;++h)t[l+h]=t[a+h];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};Vn.prototype.TimeBufferType=Float32Array;Vn.prototype.ValueBufferType=Float32Array;Vn.prototype.DefaultInterpolation=Bc;var ds=class extends Vn{constructor(e,t,n){super(e,t,n)}};ds.prototype.ValueTypeName="bool";ds.prototype.ValueBufferType=Array;ds.prototype.DefaultInterpolation=Ya;ds.prototype.InterpolantFactoryMethodLinear=void 0;ds.prototype.InterpolantFactoryMethodSmooth=void 0;var oh=class extends Vn{};oh.prototype.ValueTypeName="color";var lh=class extends Vn{};lh.prototype.ValueTypeName="number";var ch=class extends tr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(n-t)/(s-t),h=e*a;for(let c=h+a;h!==c;h+=4)jt.slerpFlat(r,0,o,h-a,o,h,l);return r}},po=class extends Vn{InterpolantFactoryMethodLinear(e){return new ch(this.times,this.values,this.getValueSize(),e)}};po.prototype.ValueTypeName="quaternion";po.prototype.InterpolantFactoryMethodSmooth=void 0;var fs=class extends Vn{constructor(e,t,n){super(e,t,n)}};fs.prototype.ValueTypeName="string";fs.prototype.ValueBufferType=Array;fs.prototype.DefaultInterpolation=Ya;fs.prototype.InterpolantFactoryMethodLinear=void 0;fs.prototype.InterpolantFactoryMethodSmooth=void 0;var hh=class extends Vn{};hh.prototype.ValueTypeName="vector";var uh=class{constructor(e,t,n){let s=this,r=!1,o=0,a=0,l,h=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(c){a++,r===!1&&s.onStart!==void 0&&s.onStart(c,o,a),r=!0},this.itemEnd=function(c){o++,s.onProgress!==void 0&&s.onProgress(c,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(c){s.onError!==void 0&&s.onError(c)},this.resolveURL=function(c){return l?l(c):c},this.setURLModifier=function(c){return l=c,this},this.addHandler=function(c,u){return h.push(c,u),this},this.removeHandler=function(c){let u=h.indexOf(c);return u!==-1&&h.splice(u,2),this},this.getHandler=function(c){for(let u=0,d=h.length;u<d;u+=2){let m=h[u],g=h[u+1];if(m.global&&(m.lastIndex=0),m.test(c))return g}return null}}},Ay=new uh,dh=class{constructor(e){this.manager=e!==void 0?e:Ay,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};dh.DEFAULT_MATERIAL_NAME="__DEFAULT";var Wr=class extends nn{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new xe(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},mo=class extends Wr{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(nn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new xe(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},Jl=new Ve,Fd=new D,kd=new D,go=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new He(512,512),this.map=null,this.mapPass=null,this.matrix=new Ve,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Vr,this._frameExtents=new He(1,1),this._viewportCount=1,this._viewports=[new ft(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;Fd.setFromMatrixPosition(e.matrixWorld),t.position.copy(Fd),kd.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(kd),t.updateMatrixWorld(),Jl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Jl),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Jl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var Bd=new Ve,Fr=new D,jl=new D,fh=class extends go{constructor(){super(new Jt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new He(4,2),this._viewportCount=6,this._viewports=[new ft(2,1,1,1),new ft(0,1,1,1),new ft(3,1,1,1),new ft(1,1,1,1),new ft(3,0,1,1),new ft(1,0,1,1)],this._cubeDirections=[new D(1,0,0),new D(-1,0,0),new D(0,0,1),new D(0,0,-1),new D(0,1,0),new D(0,-1,0)],this._cubeUps=[new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,0,1),new D(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,s=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Fr.setFromMatrixPosition(e.matrixWorld),n.position.copy(Fr),jl.copy(n.position),jl.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(jl),n.updateMatrixWorld(),s.makeTranslation(-Fr.x,-Fr.y,-Fr.z),Bd.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Bd)}},xo=class extends Wr{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new fh}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},ph=class extends go{constructor(){super(new io(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},vo=class extends Wr{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(nn.DEFAULT_UP),this.updateMatrix(),this.target=new nn,this.shadow=new ph}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var Eh="\\[\\]\\.:\\/",Ty=new RegExp("["+Eh+"]","g"),Ch="[^"+Eh+"]",Ey="[^"+Eh.replace("\\.","")+"]",Cy=/((?:WC+[\/:])*)/.source.replace("WC",Ch),Ry=/(WCOD+)?/.source.replace("WCOD",Ey),Py=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Ch),Iy=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Ch),Ly=new RegExp("^"+Cy+Ry+Py+Iy+"$"),Dy=["material","materials","bones","map"],mh=class{constructor(e,t,n){let s=n||St.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},St=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Ty,"")}static parseTrackName(e){let t=Ly.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);Dy.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let l=n(a.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let h=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let c=0;c<e.length;c++)if(e[c].name===h){h=c;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(h!==void 0){if(e[h]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[h]}}let o=e[s];if(o===void 0){let h=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+h+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};St.Composite=mh;St.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};St.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};St.prototype.GetterByBindingType=[St.prototype._getValue_direct,St.prototype._getValue_array,St.prototype._getValue_arrayElement,St.prototype._getValue_toArray];St.prototype.SetterByBindingTypeAndVersioning=[[St.prototype._setValue_direct,St.prototype._setValue_direct_setNeedsUpdate,St.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[St.prototype._setValue_array,St.prototype._setValue_array_setNeedsUpdate,St.prototype._setValue_array_setMatrixWorldNeedsUpdate],[St.prototype._setValue_arrayElement,St.prototype._setValue_arrayElement_setNeedsUpdate,St.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[St.prototype._setValue_fromArray,St.prototype._setValue_fromArray_setNeedsUpdate,St.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Ob=new Float32Array(1);typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"170"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="170");var Rh={en:{mResume:"Resume",mActions:"Actions",mSettings:"Settings",mControls:"Buttons",mPerson:"This person",mNextPerson:"Next person",mNextMap:"Next map",mPlay:"Play (my character)",mWatch:"Watch the world",mBack:"Back",mTitle:"World",aUse:"Interact (take, gather)",aRun:"Run",aEat:"Eat",aDrink:"Drink",aPickup:"Pick up food",aSleep:"Sleep / wake up",aTalk:"Talk",aZoomIn:"Zoom in",aZoomOut:"Zoom out",aThoughts:"Show / hide thoughts",aMenu:"Game menu",aPerson:"Person card",sThoughts:"Thoughts over heads",on:"On",off:"Off",sServer:"Server address",sUnpair:"Unpair this TV",cHelp:"Choose an action, press A / OK, then press the button you want for it.",cPad:"Controller",cRemote:"Remote",cPress:"Press the button for \u201C{0}\u201D\u2026 (Back cancels)",cSet:"{0} is now on {1}",cReset:"Back to the default buttons",cNone:"\u2014",cWatchNote:"In watch mode: Use = next person, Eat = next map, Sleep = person card.",dDrank:"You drank.",dPicked:"You picked up {0}.",dAte:"You ate.",dSleep:"You lie down to sleep. Move to wake up.",dWake:"You wake up.",dNoWater:"No water here: stand next to the water.",dNothing:"Nothing to do here.",dNoFood:"You carry no food.",dFull:"Your hands are full (5).",nFood:"food",nWater:"water",nRest:"rest",nFun:"company",nHp:"health",carry:"carrying {0}",iWood:"wood",iStone:"stone",iScrap:"scrap",iAxe:"an axe",iSpear:"a spear",has:"has {0}",wGatherWood:"gather wood",wGatherStone:"gather stone",wGatherScrap:"gather scrap",wAxe:"make an axe",wSpear:"make a spear",wFire:"build a campfire",wHut:"build a hut",wTend:"feed the fire",wStore:"collect food and store it",wLoot:"search the ruins",wFarm:"plant a field",wRepair:"repair the huts",listening:"Listening\u2026 say it (A again: done)",mPast:"Past events",pastHelp:"Zombie attacks (the last 20). Pick one to watch how everyone behaved.",pastNone:"No zombie attack recorded yet.",pastZ:"zombies",pastKilled:"{0} killed",rpTitle:"Replay",rpHint:"A: pause \xB7 \u25C0 \u25B6: 5 s \xB7 \u25B2 \u25BC: speed \xB7 B: back",evBite:"{0} bit {1} (health {2})",evKilled:"{0} killed {1}",evDeath:"{0} died",evFight:"{0} fights {1}",evFlee:"{0} runs from {1}",mGoTo:"Go to someone",mGoToHelp:"Pick a person: your character appears next to them.",dTp:"You are next to {0}.",zHit:"You hit the zombie!",zKilled:"The zombie is down.",actFight:"Fighting a zombie",pAge:"{0} years",pMan:"Man",pWoman:"Woman",pChild:"child",pExpecting:"expecting a baby",pPartner:"Partner",pParents:"Parents",pChildren:"Children",pGen:"Generation {0}",pNone:"none",pDead:"Died",pMood:"Mood",pWants:"Wants to",pMemory:"Remembers",pSaid:"Said",pRecent:"Lately",pTraits:"Traits",pFirst:"first survivors",tStrength:"strength",tSpeed:"speed",tIntelligence:"intelligence",tCourage:"courage",tEmpathy:"empathy",tMetabolism:"appetite",tLifespan:"lifespan",bTo:"going to {0}",bWith:"with {0}",bWants:"wants: {0}",gDrink:"drink",gEat:"eat",gForage:"find food",gSleep:"sleep",gTalk:"talk",gWander:"walk around",gRest:"rest",gTravel:"travel",hintMenu:"+ / Back: menu",gameMenuItem:"Game menu",hMove:"Move",sayLabel:"Say something (empty = just say hello)",wFollow:"follow a person",wMap:"next map",wCard:"person card",mNearby:"Nearest person",sThoughtsOnly:"Only players the owner allows see thoughts.",mMe:"Me",dTalk:"You talk to them.",dNobody:"Nobody close enough.",sZoom:"Zoom",cPressed:"Pressed: {0}"},fr:{mResume:"Reprendre",mActions:"Actions",mSettings:"R\xE9glages",mControls:"Boutons",mPerson:"Cette personne",mNextPerson:"Personne suivante",mNextMap:"Carte suivante",mPlay:"Jouer (mon personnage)",mWatch:"Regarder le monde",mBack:"Retour",mTitle:"Monde",aUse:"Interagir (prendre, r\xE9colter)",aRun:"Courir",aEat:"Manger",aDrink:"Boire",aPickup:"Ramasser de la nourriture",aSleep:"Dormir / se r\xE9veiller",aTalk:"Parler",aZoomIn:"Zoom avant",aZoomOut:"Zoom arri\xE8re",aThoughts:"Afficher / masquer les pens\xE9es",aMenu:"Menu du jeu",aPerson:"Fiche de la personne",sThoughts:"Pens\xE9es au-dessus des t\xEAtes",on:"Oui",off:"Non",sServer:"Adresse du serveur",sUnpair:"Dissocier cette TV",cHelp:"Choisissez une action, appuyez sur A / OK, puis sur le bouton voulu.",cPad:"Manette",cRemote:"T\xE9l\xE9commande",cPress:"Appuyez sur le bouton pour \xAB {0} \xBB\u2026 (Retour annule)",cSet:"{0} est maintenant sur {1}",cReset:"Revenir aux boutons par d\xE9faut",cNone:"\u2014",cWatchNote:"En mode regarder : Utiliser = personne suivante, Manger = carte suivante, Dormir = fiche.",dDrank:"Vous avez bu.",dPicked:"Vous avez ramass\xE9 {0}.",dAte:"Vous avez mang\xE9.",dSleep:"Vous vous allongez pour dormir. Bougez pour vous r\xE9veiller.",dWake:"Vous vous r\xE9veillez.",dNoWater:"Pas d\u2019eau ici : placez-vous au bord de l\u2019eau.",dNothing:"Rien \xE0 faire ici.",dNoFood:"Vous n\u2019avez pas de nourriture.",dFull:"Vos mains sont pleines (5).",nFood:"faim",nWater:"eau",nRest:"repos",nFun:"compagnie",nHp:"sant\xE9",carry:"porte {0}",iWood:"bois",iStone:"pierre",iScrap:"ferraille",iAxe:"une hache",iSpear:"une lance",has:"a {0}",wGatherWood:"ramasser du bois",wGatherStone:"ramasser des pierres",wGatherScrap:"chercher de la ferraille",wAxe:"fabriquer une hache",wSpear:"fabriquer une lance",wFire:"faire un feu de camp",wHut:"construire une cabane",wTend:"entretenir le feu",wStore:"ramasser de la nourriture et la stocker",wLoot:"fouiller les ruines",wFarm:"planter un champ",wRepair:"r\xE9parer les cabanes",listening:"J\u2019\xE9coute\u2026 parlez (A encore : termin\xE9)",mPast:"\xC9v\xE9nements pass\xE9s",pastHelp:"Attaques de zombies (les 20 derni\xE8res). Choisissez-en une pour voir comment chacun a r\xE9agi.",pastNone:"Aucune attaque de zombies enregistr\xE9e pour l\u2019instant.",pastZ:"zombies",pastKilled:"{0} tu\xE9s",rpTitle:"Rediffusion",rpHint:"A : pause \xB7 \u25C0 \u25B6 : 5 s \xB7 \u25B2 \u25BC : vitesse \xB7 B : retour",evBite:"{0} a mordu {1} (sant\xE9 {2})",evKilled:"{0} a tu\xE9 {1}",evDeath:"{0} est mort(e)",evFight:"{0} combat {1}",evFlee:"{0} fuit {1}",mGoTo:"Aller vers quelqu\u2019un",mGoToHelp:"Choisissez une personne : votre personnage appara\xEEt \xE0 c\xF4t\xE9.",dTp:"Vous \xEAtes \xE0 c\xF4t\xE9 de {0}.",zHit:"Vous frappez le zombie !",zKilled:"Le zombie est \xE0 terre.",actFight:"Combat un zombie",pAge:"{0} ans",pMan:"Homme",pWoman:"Femme",pChild:"enfant",pExpecting:"attend un b\xE9b\xE9",pPartner:"Partenaire",pParents:"Parents",pChildren:"Enfants",pGen:"G\xE9n\xE9ration {0}",pNone:"aucun",pDead:"Mort",pMood:"Humeur",pWants:"Veut",pMemory:"Se souvient",pSaid:"A dit",pRecent:"Derni\xE8rement",pTraits:"Traits",pFirst:"premiers survivants",tStrength:"force",tSpeed:"vitesse",tIntelligence:"intelligence",tCourage:"courage",tEmpathy:"empathie",tMetabolism:"app\xE9tit",tLifespan:"esp\xE9rance de vie",bTo:"va vers {0}",bWith:"avec {0}",bWants:"veut : {0}",gDrink:"boire",gEat:"manger",gForage:"trouver \xE0 manger",gSleep:"dormir",gTalk:"parler",gWander:"se promener",gRest:"se reposer",gTravel:"voyager",hintMenu:"+ / Retour : menu",gameMenuItem:"Menu du jeu",hMove:"Bouger",sayLabel:"Dire quelque chose (vide = juste saluer)",wFollow:"suivre une personne",wMap:"carte suivante",wCard:"fiche",mNearby:"Personne la plus proche",sThoughtsOnly:"Seuls les joueurs autoris\xE9s par le propri\xE9taire voient les pens\xE9es.",mMe:"Moi",dTalk:"Vous lui parlez.",dNobody:"Personne assez pr\xE8s.",sZoom:"Zoom",cPressed:"Appuy\xE9 : {0}"},es:{mResume:"Continuar",mActions:"Acciones",mSettings:"Ajustes",mControls:"Botones",mPerson:"Esta persona",mNextPerson:"Siguiente persona",mNextMap:"Siguiente mapa",mPlay:"Jugar (mi personaje)",mWatch:"Mirar el mundo",mBack:"Atr\xE1s",mTitle:"Mundo",aUse:"Interactuar (tomar, recoger)",aRun:"Correr",aEat:"Comer",aDrink:"Beber",aPickup:"Recoger comida",aSleep:"Dormir / despertar",aTalk:"Hablar",aZoomIn:"Acercar",aZoomOut:"Alejar",aThoughts:"Mostrar / ocultar pensamientos",aMenu:"Men\xFA del juego",aPerson:"Ficha de la persona",sThoughts:"Pensamientos sobre las cabezas",on:"S\xED",off:"No",sServer:"Direcci\xF3n del servidor",sUnpair:"Desvincular esta TV",cHelp:"Elige una acci\xF3n, pulsa A / OK y luego el bot\xF3n que quieras.",cPad:"Mando",cRemote:"Mando a distancia",cPress:"Pulsa el bot\xF3n para \xAB{0}\xBB\u2026 (Atr\xE1s cancela)",cSet:"{0} est\xE1 ahora en {1}",cReset:"Volver a los botones por defecto",cNone:"\u2014",cWatchNote:"En modo mirar: Usar = siguiente persona, Comer = siguiente mapa, Dormir = ficha.",dDrank:"Has bebido.",dPicked:"Has recogido {0}.",dAte:"Has comido.",dSleep:"Te tumbas a dormir. Mu\xE9vete para despertar.",dWake:"Te despiertas.",dNoWater:"No hay agua aqu\xED: ponte junto al agua.",dNothing:"Nada que hacer aqu\xED.",dNoFood:"No llevas comida.",dFull:"Tienes las manos llenas (5).",nFood:"hambre",nWater:"agua",nRest:"descanso",nFun:"compa\xF1\xEDa",nHp:"salud",carry:"lleva {0}",iWood:"madera",iStone:"piedra",iScrap:"chatarra",iAxe:"un hacha",iSpear:"una lanza",has:"tiene {0}",wGatherWood:"recoger madera",wGatherStone:"recoger piedras",wGatherScrap:"buscar chatarra",wAxe:"hacer un hacha",wSpear:"hacer una lanza",wFire:"hacer una hoguera",wHut:"construir una caba\xF1a",wTend:"avivar el fuego",wStore:"recoger comida y guardarla",wLoot:"registrar las ruinas",wFarm:"plantar un huerto",wRepair:"reparar las caba\xF1as",listening:"Escuchando\u2026 habla (A otra vez: listo)",mPast:"Eventos pasados",pastHelp:"Ataques de zombis (los 20 \xFAltimos). Elige uno para ver c\xF3mo reaccion\xF3 cada uno.",pastNone:"Todav\xEDa no hay ning\xFAn ataque de zombis grabado.",pastZ:"zombis",pastKilled:"{0} abatidos",rpTitle:"Repetici\xF3n",rpHint:"A: pausa \xB7 \u25C0 \u25B6: 5 s \xB7 \u25B2 \u25BC: velocidad \xB7 B: atr\xE1s",evBite:"{0} mordi\xF3 a {1} (salud {2})",evKilled:"{0} mat\xF3 a {1}",evDeath:"{0} muri\xF3",evFight:"{0} lucha contra {1}",evFlee:"{0} huye de {1}",mGoTo:"Ir hacia alguien",mGoToHelp:"Elige a una persona: tu personaje aparece a su lado.",dTp:"Est\xE1s junto a {0}.",zHit:"\xA1Golpeas al zombi!",zKilled:"El zombi ha ca\xEDdo.",actFight:"Luchando contra un zombi",pAge:"{0} a\xF1os",pMan:"Hombre",pWoman:"Mujer",pChild:"ni\xF1o",pExpecting:"espera un beb\xE9",pPartner:"Pareja",pParents:"Padres",pChildren:"Hijos",pGen:"Generaci\xF3n {0}",pNone:"ninguno",pDead:"Muri\xF3",pMood:"\xC1nimo",pWants:"Quiere",pMemory:"Recuerda",pSaid:"Dijo",pRecent:"\xDAltimamente",pTraits:"Rasgos",pFirst:"primeros supervivientes",tStrength:"fuerza",tSpeed:"velocidad",tIntelligence:"inteligencia",tCourage:"valor",tEmpathy:"empat\xEDa",tMetabolism:"apetito",tLifespan:"esperanza de vida",bTo:"va a {0}",bWith:"con {0}",bWants:"quiere: {0}",gDrink:"beber",gEat:"comer",gForage:"buscar comida",gSleep:"dormir",gTalk:"hablar",gWander:"pasear",gRest:"descansar",gTravel:"viajar",hintMenu:"+ / Atr\xE1s: men\xFA",gameMenuItem:"Men\xFA del juego",hMove:"Mover",sayLabel:"Decir algo (vac\xEDo = solo saludar)",wFollow:"seguir a alguien",wMap:"mapa siguiente",wCard:"ficha",mNearby:"Persona m\xE1s cercana",sThoughtsOnly:"Solo los jugadores que el due\xF1o permite ven los pensamientos.",mMe:"Yo",dTalk:"Le hablas.",dNobody:"No hay nadie lo bastante cerca.",sZoom:"Zoom",cPressed:"Pulsado: {0}"},ar:{mResume:"\u0645\u062A\u0627\u0628\u0639\u0629",mActions:"\u0627\u0644\u0623\u0641\u0639\u0627\u0644",mSettings:"\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",mControls:"\u0627\u0644\u0623\u0632\u0631\u0627\u0631",mPerson:"\u0647\u0630\u0627 \u0627\u0644\u0634\u062E\u0635",mNextPerson:"\u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062A\u0627\u0644\u064A",mNextMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",mPlay:"\u0627\u0644\u0639\u0628 (\u0634\u062E\u0635\u064A\u062A\u064A)",mWatch:"\u0634\u0627\u0647\u062F \u0627\u0644\u0639\u0627\u0644\u0645",mBack:"\u0631\u062C\u0648\u0639",mTitle:"\u0627\u0644\u0639\u0627\u0644\u0645",aUse:"\u062A\u0641\u0627\u0639\u0644 (\u0623\u062E\u0630\u060C \u062C\u0645\u0639)",aRun:"\u062C\u0631\u064A",aEat:"\u0623\u0643\u0644",aDrink:"\u0634\u0631\u0628",aPickup:"\u0627\u0644\u062A\u0642\u0627\u0637 \u0637\u0639\u0627\u0645",aSleep:"\u0646\u0648\u0645 / \u0627\u0633\u062A\u064A\u0642\u0627\u0638",aTalk:"\u062A\u062D\u062F\u062B",aZoomIn:"\u062A\u0643\u0628\u064A\u0631",aZoomOut:"\u062A\u0635\u063A\u064A\u0631",aThoughts:"\u0625\u0638\u0647\u0627\u0631 / \u0625\u062E\u0641\u0627\u0621 \u0627\u0644\u0623\u0641\u0643\u0627\u0631",aMenu:"\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0644\u0639\u0628\u0629",aPerson:"\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0634\u062E\u0635",sThoughts:"\u0627\u0644\u0623\u0641\u0643\u0627\u0631 \u0641\u0648\u0642 \u0627\u0644\u0631\u0624\u0648\u0633",on:"\u0646\u0639\u0645",off:"\u0644\u0627",sServer:"\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",sUnpair:"\u0625\u0644\u063A\u0627\u0621 \u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",cHelp:"\u0627\u062E\u062A\u0631 \u0641\u0639\u0644\u0627\u064B\u060C \u0627\u0636\u063A\u0637 A / OK\u060C \u062B\u0645 \u0627\u0636\u063A\u0637 \u0627\u0644\u0632\u0631 \u0627\u0644\u0630\u064A \u062A\u0631\u064A\u062F\u0647 \u0644\u0647.",cPad:"\u0630\u0631\u0627\u0639 \u0627\u0644\u062A\u062D\u0643\u0645",cRemote:"\u062C\u0647\u0627\u0632 \u0627\u0644\u062A\u062D\u0643\u0645",cPress:"\u0627\u0636\u063A\u0637 \u0627\u0644\u0632\u0631 \u0644\u0640 \xAB{0}\xBB\u2026 (\u0631\u062C\u0648\u0639 \u0644\u0644\u0625\u0644\u063A\u0627\u0621)",cSet:"{0} \u0627\u0644\u0622\u0646 \u0639\u0644\u0649 {1}",cReset:"\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u0623\u0632\u0631\u0627\u0631 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629",cNone:"\u2014",cWatchNote:"\u0641\u064A \u0648\u0636\u0639 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629: \u0627\u0633\u062A\u062E\u062F\u0627\u0645 = \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062A\u0627\u0644\u064A\u060C \u0623\u0643\u0644 = \u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629\u060C \u0646\u0648\u0645 = \u0627\u0644\u0628\u0637\u0627\u0642\u0629.",dDrank:"\u0634\u0631\u0628\u062A.",dPicked:"\u0627\u0644\u062A\u0642\u0637\u062A {0}.",dAte:"\u0623\u0643\u0644\u062A.",dSleep:"\u0627\u0633\u062A\u0644\u0642\u064A\u062A \u0644\u0644\u0646\u0648\u0645. \u062A\u062D\u0631\u0643 \u0644\u062A\u0633\u062A\u064A\u0642\u0638.",dWake:"\u0627\u0633\u062A\u064A\u0642\u0638\u062A.",dNoWater:"\u0644\u0627 \u0645\u0627\u0621 \u0647\u0646\u0627: \u0642\u0641 \u0628\u062C\u0627\u0646\u0628 \u0627\u0644\u0645\u0627\u0621.",dNothing:"\u0644\u0627 \u0634\u064A\u0621 \u0644\u0641\u0639\u0644\u0647 \u0647\u0646\u0627.",dNoFood:"\u0644\u0627 \u062A\u062D\u0645\u0644 \u0637\u0639\u0627\u0645\u0627\u064B.",dFull:"\u064A\u062F\u0627\u0643 \u0645\u0645\u062A\u0644\u0626\u062A\u0627\u0646 (5).",nFood:"\u062C\u0648\u0639",nWater:"\u0645\u0627\u0621",nRest:"\u0631\u0627\u062D\u0629",nFun:"\u0631\u0641\u0642\u0629",nHp:"\u0635\u062D\u0629",carry:"\u064A\u062D\u0645\u0644 {0}",iWood:"\u062E\u0634\u0628",iStone:"\u062D\u062C\u0627\u0631\u0629",iScrap:"\u062E\u0631\u062F\u0629",iAxe:"\u0641\u0623\u0633",iSpear:"\u0631\u0645\u062D",has:"\u0644\u062F\u064A\u0647 {0}",wGatherWood:"\u062C\u0645\u0639 \u0627\u0644\u062D\u0637\u0628",wGatherStone:"\u062C\u0645\u0639 \u0627\u0644\u062D\u062C\u0627\u0631\u0629",wGatherScrap:"\u062C\u0645\u0639 \u0627\u0644\u062E\u0631\u062F\u0629",wAxe:"\u0635\u0646\u0639 \u0641\u0623\u0633",wSpear:"\u0635\u0646\u0639 \u0631\u0645\u062D",wFire:"\u0625\u0634\u0639\u0627\u0644 \u0646\u0627\u0631 \u0627\u0644\u0645\u062E\u064A\u0645",wHut:"\u0628\u0646\u0627\u0621 \u0643\u0648\u062E",wTend:"\u062A\u063A\u0630\u064A\u0629 \u0627\u0644\u0646\u0627\u0631",wStore:"\u062C\u0645\u0639 \u0627\u0644\u0637\u0639\u0627\u0645 \u0648\u062A\u062E\u0632\u064A\u0646\u0647",wLoot:"\u062A\u0641\u062A\u064A\u0634 \u0627\u0644\u0623\u0646\u0642\u0627\u0636",wFarm:"\u0632\u0631\u0627\u0639\u0629 \u062D\u0642\u0644",wRepair:"\u0625\u0635\u0644\u0627\u062D \u0627\u0644\u0623\u0643\u0648\u0627\u062E",listening:"\u0623\u0633\u062A\u0645\u0639\u2026 \u062A\u0643\u0644\u0645 (A \u0645\u0631\u0629 \u0623\u062E\u0631\u0649: \u0627\u0646\u062A\u0647\u064A\u062A)",mPast:"\u0623\u062D\u062F\u0627\u062B \u0633\u0627\u0628\u0642\u0629",pastHelp:"\u0647\u062C\u0645\u0627\u062A \u0627\u0644\u0632\u0648\u0645\u0628\u064A (\u0622\u062E\u0631 20). \u0627\u062E\u062A\u0631 \u0648\u0627\u062D\u062F\u0629 \u0644\u062A\u0631\u0649 \u0643\u064A\u0641 \u062A\u0635\u0631\u0641 \u0627\u0644\u062C\u0645\u064A\u0639.",pastNone:"\u0644\u0645 \u064A\u0633\u062C\u0644 \u0623\u064A \u0647\u062C\u0648\u0645 \u0632\u0648\u0645\u0628\u064A \u0628\u0639\u062F.",pastZ:"\u0632\u0648\u0645\u0628\u064A",pastKilled:"\u0642\u062A\u0644 {0}",rpTitle:"\u0625\u0639\u0627\u062F\u0629",rpHint:"A: \u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A \xB7 \u25C0 \u25B6: 5 \u062B \xB7 \u25B2 \u25BC: \u0627\u0644\u0633\u0631\u0639\u0629 \xB7 B: \u0631\u062C\u0648\u0639",evBite:"{0} \u0639\u0636 {1} (\u0627\u0644\u0635\u062D\u0629 {2})",evKilled:"{0} \u0642\u062A\u0644 {1}",evDeath:"\u0645\u0627\u062A {0}",evFight:"{0} \u064A\u0642\u0627\u062A\u0644 {1}",evFlee:"{0} \u064A\u0647\u0631\u0628 \u0645\u0646 {1}",mGoTo:"\u0627\u0630\u0647\u0628 \u0625\u0644\u0649 \u0634\u062E\u0635",mGoToHelp:"\u0627\u062E\u062A\u0631 \u0634\u062E\u0635\u0627: \u062A\u0638\u0647\u0631 \u0634\u062E\u0635\u064A\u062A\u0643 \u0628\u062C\u0627\u0646\u0628\u0647.",dTp:"\u0623\u0646\u062A \u0628\u062C\u0627\u0646\u0628 {0}.",zHit:"\u0636\u0631\u0628\u062A \u0627\u0644\u0632\u0648\u0645\u0628\u064A!",zKilled:"\u0633\u0642\u0637 \u0627\u0644\u0632\u0648\u0645\u0628\u064A.",actFight:"\u064A\u0642\u0627\u062A\u0644 \u0632\u0648\u0645\u0628\u064A",pAge:"{0} \u0633\u0646\u0629",pMan:"\u0631\u062C\u0644",pWoman:"\u0627\u0645\u0631\u0623\u0629",pChild:"\u0637\u0641\u0644",pExpecting:"\u062A\u0646\u062A\u0638\u0631 \u0645\u0648\u0644\u0648\u062F\u0627\u064B",pPartner:"\u0627\u0644\u0634\u0631\u064A\u0643",pParents:"\u0627\u0644\u0648\u0627\u0644\u062F\u0627\u0646",pChildren:"\u0627\u0644\u0623\u0628\u0646\u0627\u0621",pGen:"\u0627\u0644\u062C\u064A\u0644 {0}",pNone:"\u0644\u0627 \u0623\u062D\u062F",pDead:"\u062A\u0648\u0641\u064A",pMood:"\u0627\u0644\u0645\u0632\u0627\u062C",pWants:"\u064A\u0631\u064A\u062F",pMemory:"\u064A\u062A\u0630\u0643\u0631",pSaid:"\u0642\u0627\u0644",pRecent:"\u0645\u0624\u062E\u0631\u0627\u064B",pTraits:"\u0627\u0644\u0635\u0641\u0627\u062A",pFirst:"\u0623\u0648\u0627\u0626\u0644 \u0627\u0644\u0646\u0627\u062C\u064A\u0646",tStrength:"\u0642\u0648\u0629",tSpeed:"\u0633\u0631\u0639\u0629",tIntelligence:"\u0630\u0643\u0627\u0621",tCourage:"\u0634\u062C\u0627\u0639\u0629",tEmpathy:"\u062A\u0639\u0627\u0637\u0641",tMetabolism:"\u0634\u0647\u064A\u0629",tLifespan:"\u0627\u0644\u0639\u0645\u0631 \u0627\u0644\u0645\u062A\u0648\u0642\u0639",bTo:"\u0630\u0627\u0647\u0628 \u0625\u0644\u0649 {0}",bWith:"\u0645\u0639 {0}",bWants:"\u064A\u0631\u064A\u062F: {0}",gDrink:"\u0627\u0644\u0634\u0631\u0628",gEat:"\u0627\u0644\u0623\u0643\u0644",gForage:"\u0625\u064A\u062C\u0627\u062F \u0637\u0639\u0627\u0645",gSleep:"\u0627\u0644\u0646\u0648\u0645",gTalk:"\u0627\u0644\u062D\u062F\u064A\u062B",gWander:"\u0627\u0644\u062A\u062C\u0648\u0644",gRest:"\u0627\u0644\u0631\u0627\u062D\u0629",gTravel:"\u0627\u0644\u0633\u0641\u0631",hintMenu:"+ / \u0631\u062C\u0648\u0639: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",gameMenuItem:"\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0644\u0639\u0628\u0629",hMove:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643",sayLabel:"\u0642\u0644 \u0634\u064A\u0626\u064B\u0627 (\u0641\u0627\u0631\u063A = \u0645\u062C\u0631\u062F \u062A\u062D\u064A\u0629)",wFollow:"\u062A\u062A\u0628\u0639 \u0634\u062E\u0635",wMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",wCard:"\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0634\u062E\u0635",mNearby:"\u0623\u0642\u0631\u0628 \u0634\u062E\u0635",sThoughtsOnly:"\u0644\u0627 \u064A\u0631\u0649 \u0627\u0644\u0623\u0641\u0643\u0627\u0631 \u0625\u0644\u0627 \u0627\u0644\u0644\u0627\u0639\u0628\u0648\u0646 \u0627\u0644\u0630\u064A\u0646 \u064A\u0633\u0645\u062D \u0644\u0647\u0645 \u0627\u0644\u0645\u0627\u0644\u0643.",mMe:"\u0623\u0646\u0627",dTalk:"\u062A\u062A\u062D\u062F\u062B \u0625\u0644\u064A\u0647.",dNobody:"\u0644\u0627 \u0623\u062D\u062F \u0642\u0631\u064A\u0628 \u0628\u0645\u0627 \u064A\u0643\u0641\u064A.",sZoom:"\u062A\u0643\u0628\u064A\u0631",cPressed:"\u062A\u0645 \u0627\u0644\u0636\u063A\u0637: {0}"}};var Ph={en:{mBag:"Bag & crafting",bagHelp:"What you carry. The best weapon and clothes are used by themselves.",bagEmpty:"Your bag is empty. Press A next to a tree, a rock or rubble to gather; hunt animals the same way.",mCraft:"Craft",mGuide:"Recipe guide",guideHelp:"Pick a recipe to put its ingredients in, then Make.",catHelp:"Put ingredients in (A adds one more), then Make.",cMake:"Make",cNoRecipe:"nothing (no recipe)",cClear:"Take everything out",cPut:"Put down: {0}",cWeapon:"Weapon: {0}",cDefence:"Defence: {0} %",cHave:"\u2713",cIn:"In: {0}",cNothingIn:"Nothing in yet.",dCrafted:"You made {0}.",dNoRecipe:"No recipe for that in this category: see the guide.",dNoMat:"You do not have enough for that.",dBagFull:"You cannot carry more of that.",dPlaced:"You put down {0}.",dNoRoom:"No room there: face open ground (a door or a window can go into a wall).",dNoItem:"You have none.",dGot:"You got {0}.",dTooThick:"These trees are too thick to cut.",aHit:"You hit the {0}!",aKilled:"You killed the {0}: {1}.",dBlocked:"Wrecked cars block the road: nobody gets through while travel is closed.",kWeapon:"Weapons",kClothing:"Clothes and armour",kDefence:"Defences",kFurniture:"Furniture",rWood:"wood",rStone:"stone",rScrap:"scrap",rOre:"ore",rBrick:"bricks",rLeather:"leather",rClaw:"claws",rMeat:"meat",xSword:"sword",xAxe:"axe",xSpear:"spear",xBow:"bow",xArrows:"arrows",xClothes:"clothes",xArmor:"armour",xHelmet:"helmet",xPalisade:"palisade",xSpikes:"spikes",xStonewall:"stone wall",xDoor:"door",xWindow:"window",xBed:"bed",xLamp:"lamp",xCampfire:"campfire",anRabbit:"rabbit",anDeer:"deer",anBoar:"boar",anWolf:"wolf",anBear:"bear"},fr:{mBag:"Sac et fabrication",bagHelp:"Ce que tu portes. La meilleure arme et les meilleurs v\xEAtements servent tout seuls.",bagEmpty:"Ton sac est vide. Appuie sur A pr\xE8s d'un arbre, d'un rocher ou de gravats pour r\xE9colter ; chasse les animaux de la m\xEAme fa\xE7on.",mCraft:"Fabriquer",mGuide:"Guide des recettes",guideHelp:"Choisis une recette pour y mettre ses ingr\xE9dients, puis Fabriquer.",catHelp:"Mets des ingr\xE9dients (A en ajoute un), puis Fabriquer.",cMake:"Fabriquer",cNoRecipe:"rien (pas de recette)",cClear:"Tout retirer",cPut:"Poser : {0}",cWeapon:"Arme : {0}",cDefence:"D\xE9fense : {0} %",cHave:"\u2713",cIn:"Dedans : {0}",cNothingIn:"Rien pour l'instant.",dCrafted:"Tu as fabriqu\xE9 : {0}.",dNoRecipe:"Pas de recette pour \xE7a dans cette cat\xE9gorie : vois le guide.",dNoMat:"Tu n'en as pas assez.",dBagFull:"Tu ne peux pas en porter plus.",dPlaced:"Tu as pos\xE9 : {0}.",dNoRoom:"Pas de place : tourne-toi vers un sol libre (une porte ou une fen\xEAtre peut aller dans un mur).",dNoItem:"Tu n'en as pas.",dGot:"Tu as obtenu : {0}.",dTooThick:"Ces arbres sont trop \xE9pais pour \xEAtre coup\xE9s.",aHit:"Tu as frapp\xE9 : {0} !",aKilled:"Tu as tu\xE9 : {0} ({1}).",dBlocked:"Des voitures accident\xE9es bloquent la route : personne ne passe tant que le voyage est ferm\xE9.",kWeapon:"Armes",kClothing:"V\xEAtements et armures",kDefence:"D\xE9fenses",kFurniture:"Meubles",rWood:"bois",rStone:"pierre",rScrap:"ferraille",rOre:"minerai",rBrick:"briques",rLeather:"cuir",rClaw:"griffes",rMeat:"viande",xSword:"\xE9p\xE9e",xAxe:"hache",xSpear:"lance",xBow:"arc",xArrows:"fl\xE8ches",xClothes:"v\xEAtements",xArmor:"armure",xHelmet:"casque",xPalisade:"palissade",xSpikes:"pieux",xStonewall:"mur de pierre",xDoor:"porte",xWindow:"fen\xEAtre",xBed:"lit",xLamp:"lampe",xCampfire:"feu de camp",anRabbit:"lapin",anDeer:"cerf",anBoar:"sanglier",anWolf:"loup",anBear:"ours"},es:{mBag:"Bolsa y fabricaci\xF3n",bagHelp:"Lo que llevas. La mejor arma y la mejor ropa se usan solas.",bagEmpty:"Tu bolsa est\xE1 vac\xEDa. Pulsa A junto a un \xE1rbol, una roca o escombros para recoger; caza animales igual.",mCraft:"Fabricar",mGuide:"Gu\xEDa de recetas",guideHelp:"Elige una receta para poner sus ingredientes y luego Fabricar.",catHelp:"Pon ingredientes (A a\xF1ade uno m\xE1s) y luego Fabricar.",cMake:"Fabricar",cNoRecipe:"nada (no hay receta)",cClear:"Sacarlo todo",cPut:"Colocar: {0}",cWeapon:"Arma: {0}",cDefence:"Defensa: {0} %",cHave:"\u2713",cIn:"Dentro: {0}",cNothingIn:"Nada todav\xEDa.",dCrafted:"Has fabricado: {0}.",dNoRecipe:"No hay receta para eso en esta categor\xEDa: mira la gu\xEDa.",dNoMat:"No tienes suficiente.",dBagFull:"No puedes llevar m\xE1s de eso.",dPlaced:"Has colocado: {0}.",dNoRoom:"No hay sitio: mira hacia suelo libre (una puerta o ventana puede ir en una pared).",dNoItem:"No tienes.",dGot:"Has conseguido: {0}.",dTooThick:"Estos \xE1rboles son demasiado gruesos para cortarlos.",aHit:"\xA1Has golpeado: {0}!",aKilled:"Has matado: {0} ({1}).",dBlocked:"Coches destrozados bloquean la carretera: nadie pasa mientras el viaje est\xE9 cerrado.",kWeapon:"Armas",kClothing:"Ropa y armadura",kDefence:"Defensas",kFurniture:"Muebles",rWood:"madera",rStone:"piedra",rScrap:"chatarra",rOre:"mineral",rBrick:"ladrillos",rLeather:"cuero",rClaw:"garras",rMeat:"carne",xSword:"espada",xAxe:"hacha",xSpear:"lanza",xBow:"arco",xArrows:"flechas",xClothes:"ropa",xArmor:"armadura",xHelmet:"casco",xPalisade:"empalizada",xSpikes:"estacas",xStonewall:"muro de piedra",xDoor:"puerta",xWindow:"ventana",xBed:"cama",xLamp:"l\xE1mpara",xCampfire:"hoguera",anRabbit:"conejo",anDeer:"ciervo",anBoar:"jabal\xED",anWolf:"lobo",anBear:"oso"},ar:{mBag:"\u0627\u0644\u062D\u0642\u064A\u0628\u0629 \u0648\u0627\u0644\u0635\u0646\u0627\u0639\u0629",bagHelp:"\u0645\u0627 \u062A\u062D\u0645\u0644\u0647. \u0623\u0641\u0636\u0644 \u0633\u0644\u0627\u062D \u0648\u0623\u0641\u0636\u0644 \u0644\u0628\u0627\u0633 \u064A\u064F\u0633\u062A\u0639\u0645\u0644\u0627\u0646 \u0648\u062D\u062F\u0647\u0645\u0627.",bagEmpty:"\u062D\u0642\u064A\u0628\u062A\u0643 \u0641\u0627\u0631\u063A\u0629. \u0627\u0636\u063A\u0637 A \u0628\u062C\u0627\u0646\u0628 \u0634\u062C\u0631\u0629 \u0623\u0648 \u0635\u062E\u0631\u0629 \u0623\u0648 \u0623\u0646\u0642\u0627\u0636 \u0644\u062A\u062C\u0645\u0639\u061B \u0648\u0627\u0635\u0637\u062F \u0627\u0644\u062D\u064A\u0648\u0627\u0646\u0627\u062A \u0628\u0627\u0644\u0637\u0631\u064A\u0642\u0629 \u0646\u0641\u0633\u0647\u0627.",mCraft:"\u0627\u0635\u0646\u0639",mGuide:"\u062F\u0644\u064A\u0644 \u0627\u0644\u0648\u0635\u0641\u0627\u062A",guideHelp:"\u0627\u062E\u062A\u0631 \u0648\u0635\u0641\u0629 \u0644\u062A\u0636\u0639 \u0645\u0643\u0648\u0646\u0627\u062A\u0647\u0627\u060C \u062B\u0645 \u0627\u0635\u0646\u0639.",catHelp:"\u0636\u0639 \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A (A \u064A\u0636\u064A\u0641 \u0648\u0627\u062D\u062F\u0627)\u060C \u062B\u0645 \u0627\u0635\u0646\u0639.",cMake:"\u0627\u0635\u0646\u0639",cNoRecipe:"\u0644\u0627 \u0634\u064A\u0621 (\u0644\u0627 \u0648\u0635\u0641\u0629)",cClear:"\u0623\u062E\u0631\u062C \u0643\u0644 \u0634\u064A\u0621",cPut:"\u0636\u0639: {0}",cWeapon:"\u0627\u0644\u0633\u0644\u0627\u062D: {0}",cDefence:"\u0627\u0644\u062F\u0641\u0627\u0639: {0} %",cHave:"\u2713",cIn:"\u0628\u0627\u0644\u062F\u0627\u062E\u0644: {0}",cNothingIn:"\u0644\u0627 \u0634\u064A\u0621 \u0628\u0639\u062F.",dCrafted:"\u0635\u0646\u0639\u062A: {0}.",dNoRecipe:"\u0644\u0627 \u0648\u0635\u0641\u0629 \u0644\u0647\u0630\u0627 \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0641\u0626\u0629: \u0627\u0646\u0638\u0631 \u0627\u0644\u062F\u0644\u064A\u0644.",dNoMat:"\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0645\u0627 \u064A\u0643\u0641\u064A.",dBagFull:"\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062D\u0645\u0644 \u0627\u0644\u0645\u0632\u064A\u062F \u0645\u0646 \u0647\u0630\u0627.",dPlaced:"\u0648\u0636\u0639\u062A: {0}.",dNoRoom:"\u0644\u0627 \u0645\u0643\u0627\u0646 \u0647\u0646\u0627: \u0627\u062A\u062C\u0647 \u0625\u0644\u0649 \u0623\u0631\u0636 \u0641\u0627\u0631\u063A\u0629 (\u0627\u0644\u0628\u0627\u0628 \u0623\u0648 \u0627\u0644\u0646\u0627\u0641\u0630\u0629 \u064A\u0645\u0643\u0646 \u0648\u0636\u0639\u0647\u0645\u0627 \u0641\u064A \u062C\u062F\u0627\u0631).",dNoItem:"\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0645\u0646\u0647.",dGot:"\u062D\u0635\u0644\u062A \u0639\u0644\u0649: {0}.",dTooThick:"\u0647\u0630\u0647 \u0627\u0644\u0623\u0634\u062C\u0627\u0631 \u0633\u0645\u064A\u0643\u0629 \u062C\u062F\u0627 \u0644\u0642\u0637\u0639\u0647\u0627.",aHit:"\u0636\u0631\u0628\u062A: {0}!",aKilled:"\u0642\u062A\u0644\u062A: {0} ({1}).",dBlocked:"\u0633\u064A\u0627\u0631\u0627\u062A \u0645\u062D\u0637\u0645\u0629 \u062A\u0633\u062F \u0627\u0644\u0637\u0631\u064A\u0642: \u0644\u0627 \u0623\u062D\u062F \u064A\u0645\u0631 \u0645\u0627 \u062F\u0627\u0645 \u0627\u0644\u0633\u0641\u0631 \u0645\u063A\u0644\u0642\u0627.",kWeapon:"\u0627\u0644\u0623\u0633\u0644\u062D\u0629",kClothing:"\u0627\u0644\u0645\u0644\u0627\u0628\u0633 \u0648\u0627\u0644\u062F\u0631\u0648\u0639",kDefence:"\u0627\u0644\u062F\u0641\u0627\u0639\u0627\u062A",kFurniture:"\u0627\u0644\u0623\u062B\u0627\u062B",rWood:"\u062E\u0634\u0628",rStone:"\u062D\u062C\u0631",rScrap:"\u062E\u0631\u062F\u0629",rOre:"\u062E\u0627\u0645",rBrick:"\u0637\u0648\u0628",rLeather:"\u062C\u0644\u062F",rClaw:"\u0645\u062E\u0627\u0644\u0628",rMeat:"\u0644\u062D\u0645",xSword:"\u0633\u064A\u0641",xAxe:"\u0641\u0623\u0633",xSpear:"\u0631\u0645\u062D",xBow:"\u0642\u0648\u0633",xArrows:"\u0633\u0647\u0627\u0645",xClothes:"\u0645\u0644\u0627\u0628\u0633",xArmor:"\u062F\u0631\u0639",xHelmet:"\u062E\u0648\u0630\u0629",xPalisade:"\u0633\u064A\u0627\u062C \u062E\u0634\u0628\u064A",xSpikes:"\u0623\u0648\u062A\u0627\u062F",xStonewall:"\u062C\u062F\u0627\u0631 \u062D\u062C\u0631\u064A",xDoor:"\u0628\u0627\u0628",xWindow:"\u0646\u0627\u0641\u0630\u0629",xBed:"\u0633\u0631\u064A\u0631",xLamp:"\u0645\u0635\u0628\u0627\u062D",xCampfire:"\u0646\u0627\u0631 \u0645\u062E\u064A\u0645",anRabbit:"\u0623\u0631\u0646\u0628",anDeer:"\u063A\u0632\u0627\u0644",anBoar:"\u062E\u0646\u0632\u064A\u0631 \u0628\u0631\u064A",anWolf:"\u0630\u0626\u0628",anBear:"\u062F\u0628"}};var Ih={en:{sCamera:"Camera",camTop:"From above",camThird:"Third person",camFirst:"First person",aCamera:"Change the camera",hTurn:"turn",aWheel:"Quick actions (hold)",wheelHelp:"Hold, point with the stick, let go",wheelRemote:"Arrows to pick, OK to do it, Back to close",qUse:"Use / talk",qEat:"Eat",qDrink:"Drink",qSleep:"Sleep / wake up",qPickup:"Pick up",qBag:"Bag",qCraft:"Craft",qPlace:"Put down",qCamera:"Camera",qNothing:"Nothing to put down."},fr:{sCamera:"Cam\xE9ra",camTop:"Vue du dessus",camThird:"Troisi\xE8me personne",camFirst:"Premi\xE8re personne",aCamera:"Changer de cam\xE9ra",hTurn:"tourner",aWheel:"Actions rapides (maintenir)",wheelHelp:"Maintenez, visez avec le stick, rel\xE2chez",wheelRemote:"Fl\xE8ches pour choisir, OK pour agir, Retour pour fermer",qUse:"Utiliser / parler",qEat:"Manger",qDrink:"Boire",qSleep:"Dormir / se r\xE9veiller",qPickup:"Ramasser",qBag:"Sac",qCraft:"Fabriquer",qPlace:"Poser",qCamera:"Cam\xE9ra",qNothing:"Rien \xE0 poser."},es:{sCamera:"C\xE1mara",camTop:"Desde arriba",camThird:"Tercera persona",camFirst:"Primera persona",aCamera:"Cambiar la c\xE1mara",hTurn:"girar",aWheel:"Acciones r\xE1pidas (mantener)",wheelHelp:"Mant\xE9n, apunta con el stick, suelta",wheelRemote:"Flechas para elegir, OK para hacerlo, Atr\xE1s para cerrar",qUse:"Usar / hablar",qEat:"Comer",qDrink:"Beber",qSleep:"Dormir / despertar",qPickup:"Recoger",qBag:"Bolsa",qCraft:"Fabricar",qPlace:"Colocar",qCamera:"C\xE1mara",qNothing:"Nada que colocar."},ar:{sCamera:"\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627",camTop:"\u0645\u0646 \u0627\u0644\u0623\u0639\u0644\u0649",camThird:"\u0645\u0646\u0638\u0648\u0631 \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062B\u0627\u0644\u062B",camFirst:"\u0645\u0646\u0638\u0648\u0631 \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u0623\u0648\u0644",aCamera:"\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627",hTurn:"\u0627\u0644\u062F\u0648\u0631\u0627\u0646",aWheel:"\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0633\u0631\u064A\u0639\u0629 (\u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u0627\u064B)",wheelHelp:"\u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u0627\u064B\u060C \u0648\u062C\u0651\u0647 \u0628\u0627\u0644\u0639\u0635\u0627\u060C \u062B\u0645 \u0627\u062A\u0631\u0643",wheelRemote:"\u0627\u0644\u0623\u0633\u0647\u0645 \u0644\u0644\u0627\u062E\u062A\u064A\u0627\u0631\u060C OK \u0644\u0644\u062A\u0646\u0641\u064A\u0630\u060C \u0631\u062C\u0648\u0639 \u0644\u0644\u0625\u063A\u0644\u0627\u0642",qUse:"\u0627\u0633\u062A\u062E\u062F\u0627\u0645 / \u062A\u062D\u062F\u062B",qEat:"\u0623\u0643\u0644",qDrink:"\u0634\u0631\u0628",qSleep:"\u0646\u0648\u0645 / \u0627\u0633\u062A\u064A\u0642\u0627\u0638",qPickup:"\u0627\u0644\u062A\u0642\u0627\u0637",qBag:"\u0627\u0644\u062D\u0642\u064A\u0628\u0629",qCraft:"\u0635\u0646\u0639",qPlace:"\u0648\u0636\u0639",qCamera:"\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627",qNothing:"\u0644\u0627 \u0634\u064A\u0621 \u0644\u0648\u0636\u0639\u0647."}};var Lh={en:{aAttack:"Attack",aAim:"Aim the bow (hold)",aBuild:"Build",dNobodyNear:"Nobody next to you to talk to.",dSwing:"Nothing to hit in front of you.",noBow:"You need a bow (Bag > Craft > Weapons: 2 wood + 1 leather).",noArrows:"No arrows left (Weapons: 2 wood + 1 stone = 5 arrows).",missed:"Missed. {0} arrows left.",arrowsLeft:"{0} arrows left.",aimOn:"Aiming: point with the stick, {0} to shoot.",bindsNew:"New buttons: {0}",mFight:"How to fight",fightHelp:"Attack hits what is in front of you: turn towards it first. Your best weapon is used by itself. With a bow and arrows, Attack shoots when nothing is in reach; hold Aim to point exactly, a red ring shows what you will hit.",fFists:"Bare hands: {0} damage, reach 2.5 m.",fWeapon:"{0}: {1} damage. Craft: {2}.",fBow:"Bow: 30 damage up close, 24 at 10 to 16 m, 18 up to 22 m. Craft: {0}. Arrows: {1} = 5.",fArmour:"Clothes and armour take part of every bite: clothes 15 %, armour 35 %, helmet 15 %.",fTips:"Zombies come at 21:00 and crumble at dawn. Fire and lamps keep animals away; spikes hurt zombies; stone walls take half damage.",fHave:"You have",bTitle:"Build",bHelp:"Turn to where it should go, then pick it: it is put on the ground in front of you. Things not in your bag are made from your materials first.",bHut:"Hut (12 wood, 4 stone)",bInBag:"in bag: {0}",bMissing:"missing",buildNeed:"Not enough materials: {0}.",bKept:"Made, but there is no room in front: it is in your bag.",gTitle:"Graphics",gQuality:"Quality",gAuto:"Automatic",gLow:"Low (fastest)",gMid:"Medium",gHigh:"High",gFog:"Fog",gOff:"Off",gLight:"Light",gNormal:"Normal",gThick:"Thick",gDist:"View distance",gNear:"Near (faster)",gFar:"Far",gFps:"Show fps",gRestart:"Apply the new quality now (reloads the view)",gHelp:"Low quality, thick fog and a near view make the game faster on small TVs. A new quality needs the view to reload.",pGoal:"Objective",pLevel:"Level {0} \xB7 {1} points",mMe:"Me",meTitle:"My character",lookTitle:"How I look",lookHelp:"Welcome! Choose your character: woman or man, and a skin tone. Then Save.",lookWoman:"Woman",lookMan:"Man",lookSkin:"Skin tone",lookSave:"Save",lookSexNote:"You can change between woman and man once a week.",sexWeek:"You can change that again in {0} days.",sexPregnant:"Not while expecting a baby.",looked:"Saved.",autoRow:"AI autopilot when I am away",autoHelp:"On: when you leave, the AI lives your character (eats, works, talks) following your rules. Off: it sleeps until you come back.",autoOn:"Autopilot on: the AI lives for you while you are away.",autoOff:"Autopilot off: your character sleeps while you are away.",myRules:"My rules for the autopilot",ruleAdd:"Add a rule",ruleHelp:'Up to {0} rules, in your own words ("never go to the woods", "you must get married"). OK on a rule removes it.',ruleLabel:"A rule for your character",rulesFull:"You already have 5 rules: remove one first.",ruleAdded:"Rule added.",ruleRemoved:"Rule removed.",meHut:"Build a hut here (12 wood, 4 stone)",built:"Hut built.",needHut:"A hut needs 12 wood and 4 stone.",mePartner:"Partner",meChildren:"Children",meNone:"none yet",meExpecting:"A baby is coming in {0} hours.",meTraits:"Strength {0} \xB7 Speed {1} \xB7 Mind {2} \xB7 Courage {3} \xB7 Kindness {4}",meHp:"Health {0}",meGoals:"Done lately",askPartner:"Ask to be my partner",tryChild:"Try for a child",partners:"{0} said yes: you are partners now.",expecting:"A baby is on the way!",tooFar:"Get closer first."},fr:{aAttack:"Attaquer",aAim:"Viser \xE0 l\u2019arc (maintenir)",aBuild:"Construire",dNobodyNear:"Personne \xE0 c\xF4t\xE9 de vous \xE0 qui parler.",dSwing:"Rien \xE0 frapper devant vous.",noBow:"Il faut un arc (Sac > Fabriquer > Armes : 2 bois + 1 cuir).",noArrows:"Plus de fl\xE8ches (Armes : 2 bois + 1 pierre = 5 fl\xE8ches).",missed:"Rat\xE9. Il reste {0} fl\xE8ches.",arrowsLeft:"Il reste {0} fl\xE8ches.",aimOn:"Vis\xE9e : orientez avec le stick, {0} pour tirer.",bindsNew:"Nouveaux boutons : {0}",mFight:"Comment se battre",fightHelp:"Attaquer frappe ce qui est devant vous : tournez-vous d\u2019abord vers lui. Votre meilleure arme est utilis\xE9e toute seule. Avec un arc et des fl\xE8ches, Attaquer tire quand rien n\u2019est \xE0 port\xE9e ; maintenez Viser pour viser pr\xE9cis\xE9ment, un anneau rouge montre ce que vous toucherez.",fFists:"Mains nues : {0} de d\xE9g\xE2ts, port\xE9e 2,5 m.",fWeapon:"{0} : {1} de d\xE9g\xE2ts. Fabrication : {2}.",fBow:"Arc : 30 de d\xE9g\xE2ts de pr\xE8s, 24 entre 10 et 16 m, 18 jusqu\u2019\xE0 22 m. Fabrication : {0}. Fl\xE8ches : {1} = 5.",fArmour:"Les v\xEAtements et l\u2019armure retirent une part de chaque morsure : v\xEAtements 15 %, armure 35 %, casque 15 %.",fTips:"Les zombies arrivent \xE0 21 h et tombent en poussi\xE8re \xE0 l\u2019aube. Le feu et les lampes \xE9loignent les animaux ; les pieux blessent les zombies ; les murs de pierre prennent moiti\xE9 moins de d\xE9g\xE2ts.",fHave:"Vous avez",bTitle:"Construire",bHelp:"Tournez-vous vers l\u2019endroit voulu, puis choisissez : c\u2019est pos\xE9 au sol devant vous. Ce qui n\u2019est pas dans votre sac est d\u2019abord fabriqu\xE9 avec vos mat\xE9riaux.",bHut:"Cabane (12 bois, 4 pierres)",bInBag:"dans le sac : {0}",bMissing:"manque",buildNeed:"Pas assez de mat\xE9riaux : {0}.",bKept:"Fabriqu\xE9, mais pas de place devant : c\u2019est dans votre sac.",gTitle:"Graphismes",gQuality:"Qualit\xE9",gAuto:"Automatique",gLow:"Basse (la plus rapide)",gMid:"Moyenne",gHigh:"Haute",gFog:"Brouillard",gOff:"Aucun",gLight:"L\xE9ger",gNormal:"Normal",gThick:"\xC9pais",gDist:"Distance de vue",gNear:"Proche (plus rapide)",gFar:"Loin",gFps:"Afficher les fps",gRestart:"Appliquer la nouvelle qualit\xE9 maintenant (recharge la vue)",gHelp:"Une qualit\xE9 basse, un brouillard \xE9pais et une vue proche rendent le jeu plus rapide sur les petites TV. Une nouvelle qualit\xE9 demande de recharger la vue.",pGoal:"Objectif",pLevel:"Niveau {0} \xB7 {1} points",mMe:"Moi",meTitle:"Mon personnage",lookTitle:"Mon apparence",lookHelp:"Bienvenue ! Choisissez votre personnage : femme ou homme, et une couleur de peau. Puis Enregistrer.",lookWoman:"Femme",lookMan:"Homme",lookSkin:"Couleur de peau",lookSave:"Enregistrer",lookSexNote:"Vous pouvez changer entre femme et homme une fois par semaine.",sexWeek:"Vous pourrez changer cela dans {0} jours.",sexPregnant:"Pas pendant une grossesse.",looked:"Enregistr\xE9.",autoRow:"Pilote IA quand je suis absent",autoHelp:"Activ\xE9 : quand vous partez, l\u2019IA vit votre personnage (mange, travaille, parle) selon vos r\xE8gles. D\xE9sactiv\xE9 : il dort jusqu\u2019\xE0 votre retour.",autoOn:"Pilote activ\xE9 : l\u2019IA vit pour vous pendant votre absence.",autoOff:"Pilote d\xE9sactiv\xE9 : votre personnage dort pendant votre absence.",myRules:"Mes r\xE8gles pour le pilote",ruleAdd:"Ajouter une r\xE8gle",ruleHelp:"Jusqu\u2019\xE0 {0} r\xE8gles, avec vos mots (\xAB ne va jamais dans les bois \xBB, \xAB tu dois te marier \xBB). OK sur une r\xE8gle la retire.",ruleLabel:"Une r\xE8gle pour votre personnage",rulesFull:"Vous avez d\xE9j\xE0 5 r\xE8gles : retirez-en une d\u2019abord.",ruleAdded:"R\xE8gle ajout\xE9e.",ruleRemoved:"R\xE8gle retir\xE9e.",meHut:"Construire une cabane ici (12 bois, 4 pierres)",built:"Cabane construite.",needHut:"Une cabane demande 12 bois et 4 pierres.",mePartner:"Partenaire",meChildren:"Enfants",meNone:"pas encore",meExpecting:"Un b\xE9b\xE9 arrive dans {0} heures.",meTraits:"Force {0} \xB7 Vitesse {1} \xB7 Esprit {2} \xB7 Courage {3} \xB7 Gentillesse {4}",meHp:"Sant\xE9 {0}",meGoals:"Fait r\xE9cemment",askPartner:"Demander d\u2019\xEAtre mon partenaire",tryChild:"Essayer d\u2019avoir un enfant",partners:"{0} a dit oui : vous \xEAtes partenaires.",expecting:"Un b\xE9b\xE9 est en route !",tooFar:"Approchez-vous d\u2019abord."},es:{aAttack:"Atacar",aAim:"Apuntar con el arco (mantener)",aBuild:"Construir",dNobodyNear:"No hay nadie a tu lado con quien hablar.",dSwing:"Nada que golpear delante de ti.",noBow:"Necesitas un arco (Bolsa > Fabricar > Armas: 2 madera + 1 cuero).",noArrows:"No quedan flechas (Armas: 2 madera + 1 piedra = 5 flechas).",missed:"Fallaste. Quedan {0} flechas.",arrowsLeft:"Quedan {0} flechas.",aimOn:"Apuntando: dirige con el stick, {0} para disparar.",bindsNew:"Botones nuevos: {0}",mFight:"C\xF3mo luchar",fightHelp:"Atacar golpea lo que tienes delante: g\xEDrate hacia ello primero. Tu mejor arma se usa sola. Con arco y flechas, Atacar dispara cuando nada est\xE1 al alcance; mant\xE9n Apuntar para apuntar con precisi\xF3n, un anillo rojo muestra a qu\xE9 dar\xE1s.",fFists:"Manos vac\xEDas: {0} de da\xF1o, alcance 2,5 m.",fWeapon:"{0}: {1} de da\xF1o. Fabricar: {2}.",fBow:"Arco: 30 de da\xF1o de cerca, 24 entre 10 y 16 m, 18 hasta 22 m. Fabricar: {0}. Flechas: {1} = 5.",fArmour:"La ropa y la armadura quitan parte de cada mordisco: ropa 15 %, armadura 35 %, casco 15 %.",fTips:"Los zombis llegan a las 21:00 y se deshacen al amanecer. El fuego y las l\xE1mparas alejan a los animales; las estacas hieren a los zombis; los muros de piedra reciben la mitad de da\xF1o.",fHave:"Tienes",bTitle:"Construir",bHelp:"G\xEDrate hacia donde debe ir y el\xEDgelo: se pone en el suelo delante de ti. Lo que no est\xE1 en tu bolsa se fabrica antes con tus materiales.",bHut:"Caba\xF1a (12 madera, 4 piedra)",bInBag:"en la bolsa: {0}",bMissing:"falta",buildNeed:"No hay materiales suficientes: {0}.",bKept:"Fabricado, pero no hay sitio delante: est\xE1 en tu bolsa.",gTitle:"Gr\xE1ficos",gQuality:"Calidad",gAuto:"Autom\xE1tica",gLow:"Baja (la m\xE1s r\xE1pida)",gMid:"Media",gHigh:"Alta",gFog:"Niebla",gOff:"No",gLight:"Ligera",gNormal:"Normal",gThick:"Densa",gDist:"Distancia de vista",gNear:"Cerca (m\xE1s r\xE1pido)",gFar:"Lejos",gFps:"Mostrar fps",gRestart:"Aplicar la nueva calidad ahora (recarga la vista)",gHelp:"Calidad baja, niebla densa y vista cercana hacen el juego m\xE1s r\xE1pido en televisores peque\xF1os. Una nueva calidad necesita recargar la vista.",pGoal:"Objetivo",pLevel:"Nivel {0} \xB7 {1} puntos",mMe:"Yo",meTitle:"Mi personaje",lookTitle:"Mi aspecto",lookHelp:"\xA1Bienvenido! Elige tu personaje: mujer u hombre, y un tono de piel. Luego Guardar.",lookWoman:"Mujer",lookMan:"Hombre",lookSkin:"Tono de piel",lookSave:"Guardar",lookSexNote:"Puedes cambiar entre mujer y hombre una vez por semana.",sexWeek:"Podr\xE1s cambiarlo de nuevo en {0} d\xEDas.",sexPregnant:"No durante un embarazo.",looked:"Guardado.",autoRow:"Piloto IA cuando no estoy",autoHelp:"Activado: cuando te vas, la IA vive tu personaje (come, trabaja, habla) seg\xFAn tus reglas. Desactivado: duerme hasta que vuelvas.",autoOn:"Piloto activado: la IA vive por ti mientras no est\xE1s.",autoOff:"Piloto desactivado: tu personaje duerme mientras no est\xE1s.",myRules:"Mis reglas para el piloto",ruleAdd:"A\xF1adir una regla",ruleHelp:"Hasta {0} reglas, con tus palabras (\xABnunca vayas al bosque\xBB, \xABdebes casarte\xBB). OK en una regla la quita.",ruleLabel:"Una regla para tu personaje",rulesFull:"Ya tienes 5 reglas: quita una primero.",ruleAdded:"Regla a\xF1adida.",ruleRemoved:"Regla quitada.",meHut:"Construir una caba\xF1a aqu\xED (12 madera, 4 piedra)",built:"Caba\xF1a construida.",needHut:"Una caba\xF1a necesita 12 de madera y 4 de piedra.",mePartner:"Pareja",meChildren:"Hijos",meNone:"todav\xEDa no",meExpecting:"Un beb\xE9 llega en {0} horas.",meTraits:"Fuerza {0} \xB7 Velocidad {1} \xB7 Mente {2} \xB7 Valor {3} \xB7 Bondad {4}",meHp:"Salud {0}",meGoals:"Hecho hace poco",askPartner:"Pedir que sea mi pareja",tryChild:"Intentar tener un hijo",partners:"{0} dijo que s\xED: ahora sois pareja.",expecting:"\xA1Viene un beb\xE9!",tooFar:"Ac\xE9rcate primero."},ar:{aAttack:"\u0647\u062C\u0648\u0645",aAim:"\u0627\u0644\u062A\u0635\u0648\u064A\u0628 \u0628\u0627\u0644\u0642\u0648\u0633 (\u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u0627\u064B)",aBuild:"\u0628\u0646\u0627\u0621",dNobodyNear:"\u0644\u0627 \u0623\u062D\u062F \u0628\u062C\u0627\u0646\u0628\u0643 \u0644\u0644\u062A\u062D\u062F\u062B \u0645\u0639\u0647.",dSwing:"\u0644\u0627 \u0634\u064A\u0621 \u0623\u0645\u0627\u0645\u0643 \u0644\u0636\u0631\u0628\u0647.",noBow:"\u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0642\u0648\u0633 (\u0627\u0644\u062D\u0642\u064A\u0628\u0629 > \u0627\u0644\u0635\u0646\u0639 > \u0627\u0644\u0623\u0633\u0644\u062D\u0629: 2 \u062E\u0634\u0628 + 1 \u062C\u0644\u062F).",noArrows:"\u0644\u0645 \u062A\u0628\u0642 \u0633\u0647\u0627\u0645 (\u0627\u0644\u0623\u0633\u0644\u062D\u0629: 2 \u062E\u0634\u0628 + 1 \u062D\u062C\u0631 = 5 \u0633\u0647\u0627\u0645).",missed:"\u0623\u062E\u0637\u0623\u062A. \u0628\u0642\u064A {0} \u0633\u0647\u0627\u0645.",arrowsLeft:"\u0628\u0642\u064A {0} \u0633\u0647\u0627\u0645.",aimOn:"\u0627\u0644\u062A\u0635\u0648\u064A\u0628: \u0648\u062C\u0651\u0647 \u0628\u0627\u0644\u0639\u0635\u0627\u060C {0} \u0644\u0644\u0631\u0645\u064A.",bindsNew:"\u0623\u0632\u0631\u0627\u0631 \u062C\u062F\u064A\u062F\u0629: {0}",mFight:"\u0643\u064A\u0641 \u062A\u0642\u0627\u062A\u0644",fightHelp:"\u0627\u0644\u0647\u062C\u0648\u0645 \u064A\u0636\u0631\u0628 \u0645\u0627 \u0623\u0645\u0627\u0645\u0643: \u0627\u0633\u062A\u062F\u0631 \u0646\u062D\u0648\u0647 \u0623\u0648\u0644\u064B\u0627. \u064A\u064F\u0633\u062A\u0639\u0645\u0644 \u0623\u0641\u0636\u0644 \u0633\u0644\u0627\u062D \u0644\u062F\u064A\u0643 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627. \u0645\u0639 \u0642\u0648\u0633 \u0648\u0633\u0647\u0627\u0645\u060C \u064A\u0631\u0645\u064A \u0627\u0644\u0647\u062C\u0648\u0645 \u0639\u0646\u062F\u0645\u0627 \u0644\u0627 \u064A\u0643\u0648\u0646 \u0634\u064A\u0621 \u0641\u064A \u0645\u062A\u0646\u0627\u0648\u0644\u0643\u061B \u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u064B\u0627 \u0639\u0644\u0649 \u0627\u0644\u062A\u0635\u0648\u064A\u0628 \u0644\u062A\u0635\u0648\u0651\u0628 \u0628\u062F\u0642\u0629\u060C \u0648\u062A\u064F\u0638\u0647\u0631 \u062D\u0644\u0642\u0629 \u062D\u0645\u0631\u0627\u0621 \u0645\u0627 \u0633\u062A\u0635\u064A\u0628\u0647.",fFists:"\u0628\u0627\u0644\u064A\u062F\u064A\u0646: {0} \u0636\u0631\u0631\u060C \u0627\u0644\u0645\u062F\u0649 2.5 \u0645.",fWeapon:"{0}: {1} \u0636\u0631\u0631. \u0627\u0644\u0635\u0646\u0639: {2}.",fBow:"\u0627\u0644\u0642\u0648\u0633: 30 \u0636\u0631\u0631\u064B\u0627 \u0639\u0646 \u0642\u0631\u0628\u060C 24 \u0628\u064A\u0646 10 \u064816 \u0645\u060C 18 \u062D\u062A\u0649 22 \u0645. \u0627\u0644\u0635\u0646\u0639: {0}. \u0627\u0644\u0633\u0647\u0627\u0645: {1} = 5.",fArmour:"\u0627\u0644\u0645\u0644\u0627\u0628\u0633 \u0648\u0627\u0644\u062F\u0631\u0639 \u062A\u062E\u0641\u0641 \u0643\u0644 \u0639\u0636\u0629: \u0627\u0644\u0645\u0644\u0627\u0628\u0633 15 %\u060C \u0627\u0644\u062F\u0631\u0639 35 %\u060C \u0627\u0644\u062E\u0648\u0630\u0629 15 %.",fTips:"\u064A\u0623\u062A\u064A \u0627\u0644\u0632\u0648\u0645\u0628\u064A \u0639\u0646\u062F 21:00 \u0648\u064A\u062A\u0641\u062A\u062A\u0648\u0646 \u0639\u0646\u062F \u0627\u0644\u0641\u062C\u0631. \u0627\u0644\u0646\u0627\u0631 \u0648\u0627\u0644\u0645\u0635\u0627\u0628\u064A\u062D \u062A\u0628\u0639\u062F \u0627\u0644\u062D\u064A\u0648\u0627\u0646\u0627\u062A\u061B \u0627\u0644\u0623\u0648\u062A\u0627\u062F \u062A\u062C\u0631\u062D \u0627\u0644\u0632\u0648\u0645\u0628\u064A\u061B \u0627\u0644\u062C\u062F\u0631\u0627\u0646 \u0627\u0644\u062D\u062C\u0631\u064A\u0629 \u062A\u062A\u0644\u0642\u0649 \u0646\u0635\u0641 \u0627\u0644\u0636\u0631\u0631.",fHave:"\u0644\u062F\u064A\u0643",bTitle:"\u0628\u0646\u0627\u0621",bHelp:"\u0627\u0633\u062A\u062F\u0631 \u0646\u062D\u0648 \u0627\u0644\u0645\u0643\u0627\u0646 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062B\u0645 \u0627\u062E\u062A\u0631: \u064A\u0648\u0636\u0639 \u0639\u0644\u0649 \u0627\u0644\u0623\u0631\u0636 \u0623\u0645\u0627\u0645\u0643. \u0645\u0627 \u0644\u064A\u0633 \u0641\u064A \u062D\u0642\u064A\u0628\u062A\u0643 \u064A\u064F\u0635\u0646\u0639 \u0623\u0648\u0644\u064B\u0627 \u0645\u0646 \u0645\u0648\u0627\u062F\u0643.",bHut:"\u0643\u0648\u062E (12 \u062E\u0634\u0628\u060C 4 \u062D\u062C\u0627\u0631\u0629)",bInBag:"\u0641\u064A \u0627\u0644\u062D\u0642\u064A\u0628\u0629: {0}",bMissing:"\u0646\u0627\u0642\u0635",buildNeed:"\u0627\u0644\u0645\u0648\u0627\u062F \u063A\u064A\u0631 \u0643\u0627\u0641\u064A\u0629: {0}.",bKept:"\u0635\u064F\u0646\u0639\u060C \u0644\u0643\u0646 \u0644\u0627 \u0645\u0643\u0627\u0646 \u0623\u0645\u0627\u0645\u0643: \u0625\u0646\u0647 \u0641\u064A \u062D\u0642\u064A\u0628\u062A\u0643.",gTitle:"\u0627\u0644\u0631\u0633\u0648\u0645\u0627\u062A",gQuality:"\u0627\u0644\u062C\u0648\u062F\u0629",gAuto:"\u062A\u0644\u0642\u0627\u0626\u064A",gLow:"\u0645\u0646\u062E\u0641\u0636\u0629 (\u0627\u0644\u0623\u0633\u0631\u0639)",gMid:"\u0645\u062A\u0648\u0633\u0637\u0629",gHigh:"\u0639\u0627\u0644\u064A\u0629",gFog:"\u0627\u0644\u0636\u0628\u0627\u0628",gOff:"\u0628\u062F\u0648\u0646",gLight:"\u062E\u0641\u064A\u0641",gNormal:"\u0639\u0627\u062F\u064A",gThick:"\u0643\u062B\u064A\u0641",gDist:"\u0645\u0633\u0627\u0641\u0629 \u0627\u0644\u0631\u0624\u064A\u0629",gNear:"\u0642\u0631\u064A\u0628\u0629 (\u0623\u0633\u0631\u0639)",gFar:"\u0628\u0639\u064A\u062F\u0629",gFps:"\u0625\u0638\u0647\u0627\u0631 \u0639\u062F\u062F \u0627\u0644\u0625\u0637\u0627\u0631\u0627\u062A",gRestart:"\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0627\u0644\u0622\u0646 (\u064A\u0639\u064A\u062F \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0639\u0631\u0636)",gHelp:"\u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0645\u0646\u062E\u0641\u0636\u0629 \u0648\u0627\u0644\u0636\u0628\u0627\u0628 \u0627\u0644\u0643\u062B\u064A\u0641 \u0648\u0627\u0644\u0631\u0624\u064A\u0629 \u0627\u0644\u0642\u0631\u064A\u0628\u0629 \u062A\u062C\u0639\u0644 \u0627\u0644\u0644\u0639\u0628\u0629 \u0623\u0633\u0631\u0639 \u0639\u0644\u0649 \u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u062A\u0644\u0641\u0627\u0632 \u0627\u0644\u0635\u063A\u064A\u0631\u0629. \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0625\u0639\u0627\u062F\u0629 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0639\u0631\u0636.",pGoal:"\u0627\u0644\u0647\u062F\u0641",pLevel:"\u0627\u0644\u0645\u0633\u062A\u0648\u0649 {0} \xB7 {1} \u0646\u0642\u0637\u0629",mMe:"\u0623\u0646\u0627",meTitle:"\u0634\u062E\u0635\u064A\u062A\u064A",lookTitle:"\u0645\u0638\u0647\u0631\u064A",lookHelp:"\u0645\u0631\u062D\u0628\u064B\u0627! \u0627\u062E\u062A\u0631 \u0634\u062E\u0635\u064A\u062A\u0643: \u0627\u0645\u0631\u0623\u0629 \u0623\u0648 \u0631\u062C\u0644\u060C \u0648\u0644\u0648\u0646 \u0627\u0644\u0628\u0634\u0631\u0629. \u062B\u0645 \u0627\u062D\u0641\u0638.",lookWoman:"\u0627\u0645\u0631\u0623\u0629",lookMan:"\u0631\u062C\u0644",lookSkin:"\u0644\u0648\u0646 \u0627\u0644\u0628\u0634\u0631\u0629",lookSave:"\u062D\u0641\u0638",lookSexNote:"\u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0628\u064A\u0646 \u0627\u0645\u0631\u0623\u0629 \u0648\u0631\u062C\u0644 \u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0641\u064A \u0627\u0644\u0623\u0633\u0628\u0648\u0639.",sexWeek:"\u064A\u0645\u0643\u0646\u0643 \u062A\u063A\u064A\u064A\u0631 \u0630\u0644\u0643 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649 \u0628\u0639\u062F {0} \u0623\u064A\u0627\u0645.",sexPregnant:"\u0644\u064A\u0633 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062D\u0645\u0644.",looked:"\u062A\u0645 \u0627\u0644\u062D\u0641\u0638.",autoRow:"\u0627\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0639\u0646\u062F \u063A\u064A\u0627\u0628\u064A",autoHelp:"\u0645\u0641\u0639\u0651\u0644: \u0639\u0646\u062F\u0645\u0627 \u062A\u063A\u0627\u062F\u0631\u060C \u064A\u0639\u064A\u0634 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0634\u062E\u0635\u064A\u062A\u0643 (\u064A\u0623\u0643\u0644\u060C \u064A\u0639\u0645\u0644\u060C \u064A\u062A\u062D\u062F\u062B) \u062D\u0633\u0628 \u0642\u0648\u0627\u0639\u062F\u0643. \u0645\u0639\u0637\u0651\u0644: \u062A\u0646\u0627\u0645 \u062D\u062A\u0649 \u062A\u0639\u0648\u062F.",autoOn:"\u0627\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A \u0645\u0641\u0639\u0651\u0644: \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u064A\u0639\u064A\u0634 \u0639\u0646\u0643 \u0623\u062B\u0646\u0627\u0621 \u063A\u064A\u0627\u0628\u0643.",autoOff:"\u0627\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A \u0645\u0639\u0637\u0651\u0644: \u0634\u062E\u0635\u064A\u062A\u0643 \u062A\u0646\u0627\u0645 \u0623\u062B\u0646\u0627\u0621 \u063A\u064A\u0627\u0628\u0643.",myRules:"\u0642\u0648\u0627\u0639\u062F\u064A \u0644\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A",ruleAdd:"\u0625\u0636\u0627\u0641\u0629 \u0642\u0627\u0639\u062F\u0629",ruleHelp:"\u062D\u062A\u0649 {0} \u0642\u0648\u0627\u0639\u062F \u0628\u0643\u0644\u0645\u0627\u062A\u0643 (\xAB\u0644\u0627 \u062A\u0630\u0647\u0628 \u0625\u0644\u0649 \u0627\u0644\u063A\u0627\u0628\u0629 \u0623\u0628\u062F\u064B\u0627\xBB\u060C \xAB\u064A\u062C\u0628 \u0623\u0646 \u062A\u062A\u0632\u0648\u062C\xBB). OK \u0639\u0644\u0649 \u0642\u0627\u0639\u062F\u0629 \u064A\u062D\u0630\u0641\u0647\u0627.",ruleLabel:"\u0642\u0627\u0639\u062F\u0629 \u0644\u0634\u062E\u0635\u064A\u062A\u0643",rulesFull:"\u0644\u062F\u064A\u0643 5 \u0642\u0648\u0627\u0639\u062F \u0628\u0627\u0644\u0641\u0639\u0644: \u0627\u062D\u0630\u0641 \u0648\u0627\u062D\u062F\u0629 \u0623\u0648\u0644\u064B\u0627.",ruleAdded:"\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0642\u0627\u0639\u062F\u0629.",ruleRemoved:"\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0642\u0627\u0639\u062F\u0629.",meHut:"\u0628\u0646\u0627\u0621 \u0643\u0648\u062E \u0647\u0646\u0627 (12 \u062E\u0634\u0628\u060C 4 \u062D\u062C\u0627\u0631\u0629)",built:"\u062A\u0645 \u0628\u0646\u0627\u0621 \u0627\u0644\u0643\u0648\u062E.",needHut:"\u0627\u0644\u0643\u0648\u062E \u064A\u062D\u062A\u0627\u062C 12 \u062E\u0634\u0628\u064B\u0627 \u06484 \u062D\u062C\u0627\u0631\u0629.",mePartner:"\u0627\u0644\u0634\u0631\u064A\u0643",meChildren:"\u0627\u0644\u0623\u0637\u0641\u0627\u0644",meNone:"\u0644\u0627 \u0623\u062D\u062F \u0628\u0639\u062F",meExpecting:"\u0637\u0641\u0644 \u0642\u0627\u062F\u0645 \u0628\u0639\u062F {0} \u0633\u0627\u0639\u0627\u062A.",meTraits:"\u0627\u0644\u0642\u0648\u0629 {0} \xB7 \u0627\u0644\u0633\u0631\u0639\u0629 {1} \xB7 \u0627\u0644\u0639\u0642\u0644 {2} \xB7 \u0627\u0644\u0634\u062C\u0627\u0639\u0629 {3} \xB7 \u0627\u0644\u0644\u0637\u0641 {4}",meHp:"\u0627\u0644\u0635\u062D\u0629 {0}",meGoals:"\u0623\u064F\u0646\u062C\u0632 \u0645\u0624\u062E\u0631\u064B\u0627",askPartner:"\u0627\u0637\u0644\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0634\u0631\u064A\u0643\u064A",tryChild:"\u0645\u062D\u0627\u0648\u0644\u0629 \u0625\u0646\u062C\u0627\u0628 \u0637\u0641\u0644",partners:"{0} \u0648\u0627\u0641\u0642: \u0623\u0646\u062A\u0645\u0627 \u0634\u0631\u064A\u0643\u0627\u0646 \u0627\u0644\u0622\u0646.",expecting:"\u0637\u0641\u0644 \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642!",tooFar:"\u0627\u0642\u062A\u0631\u0628 \u0623\u0648\u0644\u064B\u0627."}};var Dh={en:{connecting:"Connecting to the world\u2026",offline:"The world server is not answering. Trying again\u2026",noServer:"No server address yet.",enterServer:"Press A to type the server address",serverLabel:"World server address",pairTitle:"Pair this TV",pairHow:"On your phone, open the control panel and approve this code:",pairWait:"Waiting for approval\u2026",pairExpired:"The code expired. Press A for a new one.",pairDenied:"The pairing was refused. Press A to try again.",hints:"Move: arrows \xB7 A: follow a person \xB7 X: next map \xB7 L / R: zoom \xB7 +: menu",hintsRemote:"Move: arrows \xB7 OK: follow a person \xB7 CH + / \u2212: zoom \xB7 Back twice: menu",following:"Following",free:"Free camera",day:"Day",agents:"people",menuMap:"Next map",menuZoomIn:"Zoom in",menuZoomOut:"Zoom out",menuServer:"Change server address",menuUnpair:"Unpair this TV",hintsPlay:"Move: stick \xB7 B: run \xB7 A: talk \xB7 L / R: zoom \xB7 +: menu",hintsPlayRemote:"Move: arrows \xB7 OK: talk \xB7 CH + / \u2212: zoom \xB7 Back: menu",menuPlay:"Play",menuWatch:"Watch the world",travelling:"Travelling to {0}\u2026",nobody:"Nobody close by.",metPlayer:"Another player is here.",worldFull:"The world is full right now.",noGl:"This screen can\u2019t draw 3D.",actIdle:"Standing",actWander:"Walking around",actDrink:"Getting water",actEat:"Eating",actForage:"Looking for food",actSleep:"Sleeping",actTalk:"Talking",actTravel:"Travelling",actRest:"Resting",actFlee:"Running away",actGo:"Going to someone",actGather:"Gathering",actBuild:"Building",inTransit:"travelling"},fr:{connecting:"Connexion au monde\u2026",offline:"Le serveur du monde ne r\xE9pond pas. Nouvel essai\u2026",noServer:"Pas encore d\u2019adresse de serveur.",enterServer:"Appuyez sur A pour taper l\u2019adresse du serveur",serverLabel:"Adresse du serveur du monde",pairTitle:"Associer cette TV",pairHow:"Sur votre t\xE9l\xE9phone, ouvrez le panneau de contr\xF4le et acceptez ce code :",pairWait:"En attente d\u2019approbation\u2026",pairExpired:"Le code a expir\xE9. Appuyez sur A pour un nouveau.",pairDenied:"L\u2019association a \xE9t\xE9 refus\xE9e. Appuyez sur A pour r\xE9essayer.",hints:"Bouger : fl\xE8ches \xB7 A : suivre une personne \xB7 X : carte suivante \xB7 L / R : zoom \xB7 + : menu",hintsRemote:"Bouger : fl\xE8ches \xB7 OK : suivre une personne \xB7 CH + / \u2212 : zoom \xB7 Retour deux fois : menu",following:"Suivi de",free:"Cam\xE9ra libre",day:"Jour",agents:"personnes",menuMap:"Carte suivante",menuZoomIn:"Zoom avant",menuZoomOut:"Zoom arri\xE8re",menuServer:"Changer l\u2019adresse du serveur",menuUnpair:"Dissocier cette TV",hintsPlay:"Bouger : stick \xB7 B : courir \xB7 A : parler \xB7 L / R : zoom \xB7 + : menu",hintsPlayRemote:"Bouger : fl\xE8ches \xB7 OK : parler \xB7 CH + / \u2212 : zoom \xB7 Retour : menu",menuPlay:"Jouer",menuWatch:"Regarder le monde",travelling:"En route vers {0}\u2026",nobody:"Personne \xE0 c\xF4t\xE9.",metPlayer:"Un autre joueur est l\xE0.",worldFull:"Le monde est plein pour le moment.",noGl:"Cet \xE9cran ne peut pas afficher la 3D.",actIdle:"Debout",actWander:"Se prom\xE8ne",actDrink:"Va boire",actEat:"Mange",actForage:"Cherche \xE0 manger",actSleep:"Dort",actTalk:"Discute",actTravel:"En voyage",actRest:"Se repose",actFlee:"S\u2019enfuit",actGo:"Va rejoindre quelqu\u2019un",actGather:"R\xE9colte",actBuild:"Construit",inTransit:"en voyage"},es:{connecting:"Conectando con el mundo\u2026",offline:"El servidor del mundo no responde. Reintentando\u2026",noServer:"Todav\xEDa no hay direcci\xF3n del servidor.",enterServer:"Pulsa A para escribir la direcci\xF3n del servidor",serverLabel:"Direcci\xF3n del servidor del mundo",pairTitle:"Vincular este televisor",pairHow:"En tu tel\xE9fono, abre el panel de control y aprueba este c\xF3digo:",pairWait:"Esperando aprobaci\xF3n\u2026",pairExpired:"El c\xF3digo caduc\xF3. Pulsa A para uno nuevo.",pairDenied:"Se rechaz\xF3 la vinculaci\xF3n. Pulsa A para reintentar.",hints:"Mover: flechas \xB7 A: seguir a alguien \xB7 X: mapa siguiente \xB7 L / R: zoom \xB7 +: men\xFA",hintsRemote:"Mover: flechas \xB7 OK: seguir a alguien \xB7 CH + / \u2212: zoom \xB7 Atr\xE1s dos veces: men\xFA",following:"Siguiendo a",free:"C\xE1mara libre",day:"D\xEDa",agents:"personas",menuMap:"Mapa siguiente",menuZoomIn:"Acercar",menuZoomOut:"Alejar",menuServer:"Cambiar la direcci\xF3n del servidor",menuUnpair:"Desvincular este televisor",hintsPlay:"Mover: stick \xB7 B: correr \xB7 A: hablar \xB7 L / R: zoom \xB7 +: men\xFA",hintsPlayRemote:"Mover: flechas \xB7 OK: hablar \xB7 CH + / \u2212: zoom \xB7 Atr\xE1s: men\xFA",menuPlay:"Jugar",menuWatch:"Mirar el mundo",travelling:"Viajando a {0}\u2026",nobody:"No hay nadie cerca.",metPlayer:"Hay otro jugador aqu\xED.",worldFull:"El mundo est\xE1 lleno ahora mismo.",noGl:"Esta pantalla no puede mostrar 3D.",actIdle:"De pie",actWander:"Paseando",actDrink:"Va a beber",actEat:"Comiendo",actForage:"Busca comida",actSleep:"Durmiendo",actTalk:"Hablando",actTravel:"De viaje",actRest:"Descansando",actFlee:"Huyendo",actGo:"Va hacia alguien",actGather:"Recogiendo",actBuild:"Construyendo",inTransit:"de viaje"},ar:{connecting:"\u062C\u0627\u0631\u064D \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0639\u0627\u0644\u0645\u2026",offline:"\u062E\u0627\u062F\u0645 \u0627\u0644\u0639\u0627\u0644\u0645 \u0644\u0627 \u064A\u0633\u062A\u062C\u064A\u0628. \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629\u2026",noServer:"\u0644\u0627 \u064A\u0648\u062C\u062F \u0639\u0646\u0648\u0627\u0646 \u062E\u0627\u062F\u0645 \u0628\u0639\u062F.",enterServer:"\u0627\u0636\u063A\u0637 A \u0644\u0643\u062A\u0627\u0628\u0629 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",serverLabel:"\u0639\u0646\u0648\u0627\u0646 \u062E\u0627\u062F\u0645 \u0627\u0644\u0639\u0627\u0644\u0645",pairTitle:"\u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",pairHow:"\u0639\u0644\u0649 \u0647\u0627\u062A\u0641\u0643\u060C \u0627\u0641\u062A\u062D \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0648\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0631\u0645\u0632:",pairWait:"\u0641\u064A \u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629\u2026",pairExpired:"\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0631\u0645\u0632. \u0627\u0636\u063A\u0637 A \u0644\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0631\u0645\u0632 \u062C\u062F\u064A\u062F.",pairDenied:"\u062A\u0645 \u0631\u0641\u0636 \u0627\u0644\u0631\u0628\u0637. \u0627\u0636\u063A\u0637 A \u0644\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.",hints:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 A: \u062A\u062A\u0628\u0639 \u0634\u062E\u0635 \xB7 X: \u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629 \xB7 L / R: \u062A\u0643\u0628\u064A\u0631 \xB7 +: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",hintsRemote:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 OK: \u062A\u062A\u0628\u0639 \u0634\u062E\u0635 \xB7 CH + / \u2212: \u062A\u0643\u0628\u064A\u0631 \xB7 \u0631\u062C\u0648\u0639 \u0645\u0631\u062A\u064A\u0646: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",following:"\u062A\u062A\u0628\u0639",free:"\u0643\u0627\u0645\u064A\u0631\u0627 \u062D\u0631\u0629",day:"\u0627\u0644\u064A\u0648\u0645",agents:"\u0623\u0634\u062E\u0627\u0635",menuMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",menuZoomIn:"\u062A\u0643\u0628\u064A\u0631",menuZoomOut:"\u062A\u0635\u063A\u064A\u0631",menuServer:"\u062A\u063A\u064A\u064A\u0631 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",menuUnpair:"\u0625\u0644\u063A\u0627\u0621 \u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",hintsPlay:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0639\u0635\u0627 \xB7 B: \u0627\u0644\u062C\u0631\u064A \xB7 A: \u0627\u0644\u062A\u062D\u062F\u062B \xB7 L / R: \u062A\u0643\u0628\u064A\u0631 \xB7 +: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",hintsPlayRemote:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 OK: \u0627\u0644\u062A\u062D\u062F\u062B \xB7 CH + / \u2212: \u062A\u0643\u0628\u064A\u0631 \xB7 \u0631\u062C\u0648\u0639: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",menuPlay:"\u0627\u0644\u0639\u0628",menuWatch:"\u0634\u0627\u0647\u062F \u0627\u0644\u0639\u0627\u0644\u0645",travelling:"\u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642 \u0625\u0644\u0649 {0}\u2026",nobody:"\u0644\u0627 \u0623\u062D\u062F \u0628\u0627\u0644\u0642\u0631\u0628.",metPlayer:"\u0644\u0627\u0639\u0628 \u0622\u062E\u0631 \u0647\u0646\u0627.",worldFull:"\u0627\u0644\u0639\u0627\u0644\u0645 \u0645\u0645\u062A\u0644\u0626 \u0627\u0644\u0622\u0646.",noGl:"\u0647\u0630\u0647 \u0627\u0644\u0634\u0627\u0634\u0629 \u0644\u0627 \u062A\u0633\u062A\u0637\u064A\u0639 \u0639\u0631\u0636 \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F.",actIdle:"\u0648\u0627\u0642\u0641",actWander:"\u064A\u062A\u062C\u0648\u0644",actDrink:"\u064A\u0630\u0647\u0628 \u0644\u064A\u0634\u0631\u0628",actEat:"\u064A\u0623\u0643\u0644",actForage:"\u064A\u0628\u062D\u062B \u0639\u0646 \u0637\u0639\u0627\u0645",actSleep:"\u0646\u0627\u0626\u0645",actTalk:"\u064A\u062A\u062D\u062F\u062B",actTravel:"\u0645\u0633\u0627\u0641\u0631",actRest:"\u064A\u0633\u062A\u0631\u064A\u062D",actFlee:"\u064A\u0647\u0631\u0628",actGo:"\u064A\u0630\u0647\u0628 \u0625\u0644\u0649 \u0634\u062E\u0635",actGather:"\u064A\u062C\u0645\u0639",actBuild:"\u064A\u0628\u0646\u064A",inTransit:"\u0641\u064A \u0633\u0641\u0631"}},sr="en";function rf(i){sr=i in Dh?i:"en"}function P(i){let e=Dh[sr],t=Rh[sr],n=Ph[sr],s=Ih[sr],r=Lh[sr];return e[i]??t[i]??n[i]??s[i]??r[i]??Dh.en[i]??Rh.en[i]??Ph.en[i]??Ih.en[i]??Lh.en[i]??i}function we(i,...e){return P(i).replace(/\{(\d)\}/g,(t,n)=>e[Number(n)]??"")}var Uy=1.25,wo=class{body;head;hair;legs;arms;blob;mark;n=0;nm=0;base=new Ve;m=new Ve;part=new Ve;q=new jt;e=new Ut;v=new D;s=new D;cap;constructor(e,t,n){this.cap=t;let s=()=>new Rn({color:16777215}),r=(o,a,l,h)=>{let c=new xi(o,a,l);return c.instanceMatrix.setUsage(ps),c.count=0,c.frustumCulled=!1,c.castShadow=h&&n,e.add(c),c};this.body=r(new Wt(.17,.24,.6,10).translate(0,.8,0),s(),t,!0),this.head=r(new Hn(.17,14,10).translate(0,1.3,0),s(),t,!0),this.hair=r(new Hn(.182,14,6,0,Math.PI*2,0,Math.PI*.55).translate(0,1.33,-.015),s(),t,!0),this.legs=r(new Wt(.075,.065,.5,6).translate(0,-.25,0),s(),t*2,!0),this.arms=r(new Wt(.06,.05,.44,6).translate(0,-.22,0),s(),t*2,!0),this.blob=n?null:r(new Gi(.38,16).rotateX(-Math.PI/2),new sn({color:0,transparent:!0,opacity:.28,depthWrite:!1}),t,!1),this.mark=r(new uo(.12,0).scale(1,1.6,1),new sn({color:16777215}),64,!1);for(let o of[this.body,this.head,this.hair,this.legs,this.arms,this.mark])o.setColorAt(0,new xe)}begin(){this.n=0,this.nm=0}add(e,t,n,s,r,o,a,l=1,h=!1){if(this.n>=this.cap)return;let c=this.n++,u=Math.abs(Math.sin(s))*.05*r*l,d=Uy*l;this.base.compose(this.v.set(e,u,t),this.q.setFromEuler(this.e.set(0,n,0)),this.s.set(d,d,d)),a&&(this.part.compose(this.v.set(0,.2,-.55),this.q.setFromEuler(this.e.set(Math.PI/2,0,0)),this.s.set(1,1,1)),this.base.multiply(this.part)),this.body.setMatrixAt(c,this.base),this.body.setColorAt(c,o.tunic),this.head.setMatrixAt(c,this.base),this.head.setColorAt(c,o.skin),this.hair.setMatrixAt(c,this.base),this.hair.setColorAt(c,o.hair);let m=Math.sin(s)*.7*r;for(let g=0;g<2;g++){let x=g?1:-1;this.part.compose(this.v.set(x*.1,.52,0),this.q.setFromEuler(this.e.set(m*x,0,0)),this.s.set(1,1,1)),this.m.multiplyMatrices(this.base,this.part),this.legs.setMatrixAt(c*2+g,this.m),this.legs.setColorAt(c*2+g,o.pants),this.part.compose(this.v.set(x*.25,1.07,0),this.q.setFromEuler(h?this.e.set(-1.35+m*x*.15,0,x*.05):this.e.set(-m*x*.8,0,x*.12)),this.s.set(1,1,1)),this.m.multiplyMatrices(this.base,this.part),this.arms.setMatrixAt(c*2+g,this.m),this.arms.setColorAt(c*2+g,o.tunic)}this.blob&&(this.m.makeTranslation(e,.03,t),this.blob.setMatrixAt(c,this.m))}marker(e,t,n,s){if(this.nm>=64)return;let r=this.nm++;this.m.compose(this.v.set(e,2.15+Math.sin(n*3)*.08,t),this.q.setFromEuler(this.e.set(0,n*2,0)),this.s.set(1,1,1)),this.mark.setMatrixAt(r,this.m),this.mark.setColorAt(r,s)}end(){let e=this.n;for(let t of[this.body,this.head,this.hair])t.count=e,Uh(t);for(let t of[this.legs,this.arms])t.count=e*2,Uh(t);this.blob&&(this.blob.count=e,this.blob.instanceMatrix.needsUpdate=!0),this.mark.count=this.nm,Uh(this.mark)}};function Uh(i){i.instanceMatrix.needsUpdate=!0,i.instanceColor&&(i.instanceColor.needsUpdate=!0)}var Nh=[{len:.32,h:.2,wide:.2,head:.12,leg:.08,ear:.16,earUp:1,tail:.06,body:11772042,headC:12101264,earC:13219488},{len:.9,h:.42,wide:.32,head:.17,leg:.62,ear:.3,earUp:.5,tail:.07,body:10514495,headC:10119738,earC:7031338},{len:.78,h:.42,wide:.4,head:.2,leg:.3,ear:.1,earUp:.6,tail:.04,body:5193008,headC:4667179,earC:15129798},{len:.75,h:.32,wide:.26,head:.16,leg:.42,ear:.13,earUp:1,tail:.12,body:8224128,headC:9079438,earC:5921374},{len:1.25,h:.62,wide:.66,head:.3,leg:.48,ear:.1,earUp:1,tail:.06,body:4862756,headC:5388841,earC:3811356}],Ao=class{constructor(e,t,n){this.cap=t;let s=(r,o)=>{let a=new xi(r,new Rn({color:16777215,flatShading:!0}),o);return a.instanceMatrix.setUsage(ps),a.count=0,a.frustumCulled=!1,a.castShadow=n,a.setColorAt(0,new xe),e.add(a),a};this.body=s(new Hn(.5,10,7),t),this.head=s(new Hn(.5,9,6),t),this.legs=s(new Wt(.5,.4,1,5).translate(0,-.5,0),t*4),this.ears=s(new Wi(.5,1,4).translate(0,.5,0),t*2),this.tail=s(new Hn(.5,6,4),t),this.cols=Nh.map(r=>({body:new xe(r.body),head:new xe(r.headC),ear:new xe(r.earC)}))}cap;body;head;legs;ears;tail;n=0;base=new Ve;m=new Ve;part=new Ve;q=new jt;e=new Ut;v=new D;s=new D;cols;begin(){this.n=0}add(e,t,n,s,r,o){if(this.n>=this.cap)return;let a=Nh[e]??Nh[0],l=this.cols[e]??this.cols[0],h=this.n++,c=e===0?Math.abs(Math.sin(r))*.12*o:Math.abs(Math.sin(r*2))*.03*o,u=a.leg+a.h/2+c;this.base.compose(this.v.set(t,0,n),this.q.setFromEuler(this.e.set(0,s,0)),this.s.set(1.35,1.35,1.35));let d=(p,f,S,w,y,L,C,A,E,v,_,I)=>{this.part.compose(this.v.set(S,w,y),this.q.setFromEuler(this.e.set(L,C,A)),this.s.set(E,v,_)),this.m.multiplyMatrices(this.base,this.part),p.setMatrixAt(f,this.m),p.setColorAt(f,I)};d(this.body,h,0,u,0,0,0,0,a.wide,a.h,a.len,l.body);let m=a.len/2+a.head*.55,g=u+a.h*.35;d(this.head,h,0,g,m,0,0,0,a.head*1.6,a.head*1.5,a.head*(e===2?2.4:2),l.head),d(this.tail,h,0,u+a.h*.2,-a.len/2,.6,0,0,a.tail*1.2,a.tail,a.tail*(e===3?4:1.4),l.ear);let x=Math.sin(r)*.35*o;for(let p=0;p<4;p++){let f=p&1?1:-1,S=p<2?1:-1;d(this.legs,h*4+p,f*a.wide*.3,a.leg+.02,S*a.len*.3,x*f*S,0,0,a.wide*.22+.02,a.leg+.02,a.wide*.22+.02,l.body)}for(let p=0;p<2;p++){let f=p?1:-1;e===2?d(this.ears,h*2+p,f*a.head*.5,g-a.head*.3,m+a.head*.9,1.3,0,-f*.3,.04,a.ear,.04,l.ear):d(this.ears,h*2+p,f*a.head*.45,g+a.head*.55,m-a.head*.1,-.2*a.earUp,0,f*(e===1?.6:.25),a.ear*(e===1?.18:.45),a.ear,a.ear*.25,l.ear)}}end(){let e=this.n;for(let[t,n]of[[this.body,1],[this.head,1],[this.tail,1],[this.legs,4],[this.ears,2]])t.count=e*n,t.instanceMatrix.needsUpdate=!0,t.instanceColor&&(t.instanceColor.needsUpdate=!0)}};var af=58*Math.PI/180,To=class{renderer;scene=new lo;camera=new Jt(30,16/9,1,400);people;hemi=new mo(13624319,6114362,1.1);sun=new vo(16773590,2.4);lamp=new xo(16761466,0,14,1.6);fog;bg=new xe(10274792);chunks=new zn;water;under;portals=new zn;shots;nShots=0;cans;bushes;berries;crates;nCan=0;nBush=0;nCrate=0;q=new jt;eu=new Ut;v3=new D;s3=new D;groundMat=new Rn({vertexColors:!0});propMat=new Rn({vertexColors:!0});glowMat=new sn({vertexColors:!0});poolMat=new sn({vertexColors:!0,transparent:!0,opacity:0,blending:zr,depthWrite:!1,side:Cn});animals;target=new D;look=new D;dist=24;view="top";yaw=0;back=7;viewSet="";tier;m=new Ve;shadowR=30;constructor(e,t){this.tier=t,this.renderer=new ao({canvas:e,antialias:t==="high",powerPreference:"high-performance",stencil:!1}),this.renderer.setPixelRatio(1),this.renderer.toneMapping=xh,this.renderer.toneMappingExposure=1.05;let n=t!=="low";if(n){this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=t==="high"?gh:yo,this.sun.castShadow=!0;let r=t==="high"?2048:1024;this.sun.shadow.mapSize.set(r,r),this.sun.shadow.bias=-6e-4,this.sun.shadow.normalBias=.03,this.sun.shadow.camera.near=1,this.sun.shadow.camera.far=120}this.scene.background=this.bg,this.fog=new oo(this.bg,60,160),this.scene.fog=this.fog,this.scene.add(this.hemi,this.sun,this.sun.target,this.lamp,this.chunks,this.portals),this.under=new wt(new Vi(4e3,4e3).rotateX(-Math.PI/2),new Rn({color:3033642})),this.under.position.y=-.8,this.scene.add(this.under),this.water=new wt(new Vi(1,1).rotateX(-Math.PI/2),new fo({color:3114672,transparent:!0,opacity:.72,shininess:90,specular:10474736})),this.water.position.y=-.14,this.water.receiveShadow=n,this.scene.add(this.water),this.people=new wo(this.scene,512,n),this.animals=new Ao(this.scene,128,n),this.shots=new xi(new Hn(.07,6,4),new sn({color:16773536}),256),this.shots.instanceMatrix.setUsage(ps),this.shots.count=0,this.shots.frustumCulled=!1,this.scene.add(this.shots);let s=(r,o,a)=>{let l=new xi(r,new Rn({color:o,flatShading:!0}),a);return l.instanceMatrix.setUsage(ps),l.count=0,l.frustumCulled=!1,l.castShadow=n,this.scene.add(l),l};this.cans=s(new Wt(.09,.09,.17,10).translate(0,.085,0),12866111,256),this.bushes=s(new vi(.52,1).scale(1,.8,1).translate(0,.38,0),4161335,256),this.berries=s(new vi(.075,0),14688314,256*6),this.crates=s(new Wt(.2,.2,.3,4).rotateY(Math.PI/4).translate(0,.15,0),10122312,128)}aimLine=null;aimRing=null;aim(e,t=0,n=0,s=0,r=20,o=NaN,a=NaN){if(!e){this.aimLine&&(this.aimLine.visible=!1),this.aimRing&&(this.aimRing.visible=!1);return}if(!this.aimLine){let h=new sn({color:16769146,transparent:!0,opacity:.75,depthWrite:!1});this.aimLine=new wt(new Vi(1,.09).rotateX(-Math.PI/2).translate(.5,0,0),h),this.aimRing=new wt(new Gr(.55,.06,6,24).rotateX(-Math.PI/2),new sn({color:16734780,depthWrite:!1})),this.aimLine.renderOrder=this.aimRing.renderOrder=5,this.scene.add(this.aimLine,this.aimRing)}this.aimLine.visible=!0,this.aimLine.position.set(t+Math.cos(s)*.5,.06,n+Math.sin(s)*.5),this.aimLine.rotation.set(0,-s,0),this.aimLine.scale.set(r,1,1);let l=Number.isFinite(o);this.aimRing.visible=l,l&&this.aimRing.position.set(o,.08,a)}beginItems(){this.nCan=this.nBush=this.nCrate=0}item(e,t,n,s){let r=(s*2654435761>>>0)/4294967296;if(this.m.compose(this.v3.set(e,0,t),this.q.setFromEuler(this.eu.set(0,r*6.28,0)),this.s3.set(1,1,1)),n===1&&this.nCan<256)this.cans.setMatrixAt(this.nCan++,this.m);else if(n===2&&this.nBush<256){let o=this.nBush++;this.bushes.setMatrixAt(o,this.m);for(let a=0;a<6;a++){let l=r*6.28+a*1.05;this.m.makeTranslation(e+Math.cos(l)*.43,.32+a%3*.14,t+Math.sin(l)*.43),this.berries.setMatrixAt(o*6+a,this.m)}}else this.nCrate<128&&this.crates.setMatrixAt(this.nCrate++,this.m)}endItems(){this.cans.count=this.nCan,this.bushes.count=this.nBush,this.berries.count=this.nBush*6,this.crates.count=this.nCrate;for(let e of[this.cans,this.bushes,this.berries,this.crates])e.instanceMatrix.needsUpdate=!0}setMap(e,t,n){this.clearChunks(),this.water.scale.set(e,1,t),this.water.position.set(e/2,-.14,t/2);for(let s of this.portals.children.slice())this.portals.remove(s),Fy(s);for(let s of n)this.portals.add(Ny(s.x,s.y))}addChunk(e,t,n=null,s=null){let r=new zn,o=new wt(e,this.groundMat);if(o.receiveShadow=this.tier!=="low",r.add(o),t){let a=new wt(t,this.propMat);a.castShadow=a.receiveShadow=this.tier!=="low",r.add(a)}if(n&&r.add(new wt(n,this.glowMat)),s){let a=new wt(s,this.poolMat);a.renderOrder=2,r.add(a)}return this.chunks.add(r),r}removeChunk(e){this.chunks.remove(e);for(let t of e.children)t.geometry.dispose()}clearChunks(){for(let e of this.chunks.children.slice())this.removeChunk(e)}beginShots(){this.nShots=0}shot(e,t){this.nShots>=256||(this.m.makeTranslation(e,1,t),this.shots.setMatrixAt(this.nShots++,this.m))}endShots(){this.shots.count=this.nShots,this.shots.instanceMatrix.needsUpdate=!0}resize(e,t){this.renderer.setSize(e,t,!1),this.camera.aspect=e/t,this.camera.updateProjectionMatrix()}pv=new D;project(e,t,n,s){let r=this.pv.set(e,t,n).project(this.camera);return r.z>1||r.x<-1.1||r.x>1.1||r.y<-1.1||r.y>1.1?!1:(s.x=(r.x+1)/2*innerWidth,s.y=(1-r.y)/2*innerHeight,!0)}get sight(){return(this.tier==="low"?42:this.tier==="mid"?52:64)*this.distK}distK=1;fogK=1;fogAt(e,t){if(!this.fogK){this.fog.near=1e5,this.fog.far=1e6;return}this.fog.near=e*this.fogK,this.fog.far=t*this.fogK}settingsChanged(){this.viewSet=""}follow(e,t,n,s){this.target.set(e,0,t);let r=s?1:1-Math.exp(-n*(this.view==="top"?6:14));this.look.x+=(e-this.look.x)*r,this.look.z+=(t-this.look.z)*r;let o=this.dist;if(this.view!==this.viewSet){this.viewSet=this.view;let d=this.camera;this.view==="top"?(d.fov=30,d.near=1,d.far=400):(d.fov=this.view==="first"?62:55,d.near=.12,d.far=this.sight*(this.fogK?Math.max(1,this.fogK):1.6)+6),d.updateProjectionMatrix()}let a=this.look.x,l=this.look.z;if(this.view==="top")this.camera.position.set(this.look.x,Math.sin(af)*o,this.look.z+Math.cos(af)*o),this.camera.lookAt(this.look.x,0,this.look.z),this.fogAt(o*1.6*this.distK,o*3.6*this.distK);else{let d=Math.sin(this.yaw),m=-Math.cos(this.yaw);if(this.view==="third"){let g=this.back;this.camera.position.set(this.look.x-d*g,1.4+g*.42,this.look.z-m*g),this.camera.lookAt(this.look.x+d*3,1.1,this.look.z+m*3)}else this.camera.position.set(this.look.x+d*.18,1.55,this.look.z+m*.18),this.camera.lookAt(this.look.x+d*10,.9,this.look.z+m*10);this.fogAt(this.sight*.35,this.sight),o=this.sight*.4,a=this.look.x+d*o*.8,l=this.look.z+m*o*.8}if(this.sun.castShadow){let d=this.shadowR=Math.min(60,o*1.15+6),m=this.sun.shadow.camera;m.right!==d&&(m.left=-d,m.right=d,m.top=d,m.bottom=-d,m.updateProjectionMatrix())}let h=this.shadowR*2/this.sun.shadow.mapSize.x,c=Math.round(a/h)*h,u=Math.round(l/h)*h;this.sun.target.position.set(c,0,u),this.sun.position.set(c+this.sunDir.x*50,this.sunDir.y*50,u+this.sunDir.z*50),this.lamp.position.set(e,2.2,t)}sunDir=new D(.4,.8,.45).normalize();c1=new xe;c2=new xe;setHour(e,t){let n=e<5||e>21?0:e<8?(e-5)/3:e>18?(21-e)/3:1,s=n>0&&n<1?Math.sin(n*Math.PI):0,r=(e-6)/12*Math.PI;n>0?this.sunDir.set(-Math.cos(r)*.8,Math.max(.5,Math.sin(r)),.55).normalize():this.sunDir.set(.3,.8,.4).normalize(),this.sun.intensity=n>0?.5+2*n:.45,this.sun.color.setHex(9349375).lerp(this.c1.setHex(16773590),n).lerp(this.c2.setHex(16752736),s*.7),this.hemi.intensity=(.35+.8*n)*(this.view==="top"?1:1.5),this.hemi.color.setHex(3162218).lerp(this.c1.setHex(13624319),n),this.hemi.groundColor.setHex(1841698).lerp(this.c1.setHex(6114362),n),this.bg.setHex(726054).lerp(this.c1.setHex(10274792),n).lerp(this.c2.setHex(15178346),s*.6),this.lamp.intensity=(1-n)*9,this.poolMat.opacity=(1-n)*.42,this.poolMat.visible=n<.98;let o=1+Math.sin(t*2.5)*.06;for(let a of this.portals.children)a.children[0].rotation.y=t*.8,a.children[1].scale.set(o,1,o)}render(){this.renderer.render(this.scene,this.camera)}dispose(){this.clearChunks(),this.renderer.dispose()}};function Ny(i,e){let t=new zn;t.position.set(i,0,e);let n=new wt(new Gr(1.3,.11,8,32),new sn({color:9433343}));n.position.y=1.4;let s=new wt(new Gi(2,32).rotateX(-Math.PI/2),new sn({color:5232895,transparent:!0,opacity:.45,blending:zr,depthWrite:!1,side:Cn}));return s.position.y=.05,t.add(n,s),t}function Fy(i){i.traverse(e=>{let t=e;t.geometry&&t.geometry.dispose()})}var ky={grass:{shape:0,ground:7776597,top:0,side:0,height:0},dirt:{shape:0,ground:10780248,top:0,side:0,height:0},road:{shape:0,ground:6973282,top:0,side:0,height:0},floor:{shape:0,ground:11569759,top:0,side:0,height:0},sand:{shape:0,ground:14469267,top:0,side:0,height:0},water:{shape:1,ground:5009250,top:0,side:0,height:0},wall:{shape:2,ground:9275262,top:12761258,side:10918797,height:2.3},tree:{shape:3,ground:6197061,top:5215296,side:7031343,height:0},rubble:{shape:4,ground:9471865,top:10195587,side:0,height:0},woodwall:{shape:2,ground:9071176,top:9134649,side:8016946,height:1.7,even:!0,planks:!0},campfire:{shape:5,ground:9271906,top:9407106,side:5978658,height:0},ashes:{shape:6,ground:7301731,top:4012599,side:4863268,height:0},crate:{shape:2,ground:9071176,top:10779208,side:9134649,height:.8,even:!0,planks:!0},farm:{shape:0,ground:7033398,top:0,side:0,height:0},rock:{shape:7,ground:9275262,top:10130572,side:0,height:0},wreck:{shape:8,ground:6973282,top:9063986,side:3881528,height:0},palisade:{shape:9,ground:9071176,top:10186822,side:7228204,height:0},spikes:{shape:10,ground:9071176,top:10517066,side:7228204,height:0},stonewall:{shape:2,ground:9275262,top:11906723,side:10194816,height:1.9,even:!0},door:{shape:11,ground:11569759,top:9134649,side:7031343,height:0},window:{shape:12,ground:9071176,top:9134649,side:8016946,height:1.7},bed:{shape:13,ground:11569759,top:11554876,side:8016946,height:0},lamp:{shape:14,ground:9271906,top:16769162,side:4867136,height:0}};function of(i){let e=[];for(let t=0;t<256;t++)e.push({shape:0,ground:7251535,top:0,side:0,height:0});for(let t of i){let n=ky[t.name];e[t.id]=n?{...n}:t.solid?{shape:2,ground:t.color,top:t.color,side:t.color,height:2}:{shape:0,ground:t.color,top:0,side:0,height:0}}return e}function At(i,e){let t=Math.imul(i|0,374761393)+Math.imul(e|0,668265263);return t=Math.imul(t^t>>>13,1274126177),((t^t>>>16)>>>0)/4294967296}function Eo(i,e,t){let n=i/t,s=e/t,r=Math.floor(n),o=Math.floor(s),a=n-r,l=s-o;a=a*a*(3-2*a),l=l*l*(3-2*l);let h=At(r,o),c=At(r+1,o),u=At(r,o+1),d=At(r+1,o+1);return h+(c-h)*a+(u-h)*l+(h-c-u+d)*a*l}var $r=64,By=-.55;function Pn(i){let e=i.index?i.toNonIndexed():i;e.computeVertexNormals();let t=e.getAttribute("position").array,n=1/0,s=-1/0;for(let r=1;r<t.length;r+=3)n=Math.min(n,t[r]),s=Math.max(s,t[r]);return{pos:t,nor:e.getAttribute("normal").array,minY:n,maxY:s}}var Fh=null;function Oy(){return Fh||(Fh={trunk:Pn(new Wt(.1,.17,1,6,1,!0).translate(0,.5,0)),leaf:Pn(new vi(1,1)),leafLo:Pn(new vi(1,0)),rock:Pn(new vi(1,0)),blade:Pn(new Wi(.045,.34,3,1,!0).translate(0,.17,0)),log:Pn(new Wt(.06,.06,.62,6,1,!1).rotateZ(Math.PI/2)),flame:Pn(new Wi(.16,.5,5,1,!1).translate(0,.25,0)),box:Pn(new us(1,1,1).translate(0,.5,0)),spike:Pn(new Wi(.5,1,6,1,!1).translate(0,.5,0)),post:Pn(new Wt(.5,.5,1,7,1,!1).translate(0,.5,0)),disc:Pn(new Gi(1,16).rotateX(-Math.PI/2)),wheel:Pn(new Wt(.5,.5,1,8,1,!1).rotateZ(Math.PI/2))}),Fh}var Kr=class{pos=[];nor=[];col=[];geometry(){if(!this.pos.length)return null;let e=new rn;return e.setAttribute("position",new it(this.pos,3)),e.setAttribute("normal",new it(this.nor,3)),e.setAttribute("color",new it(this.col,3)),e.computeBoundingSphere(),e}},Co=new D,Ro=new D,zy=new Ve,lf=new Le,Hy=new jt,Vy=new Ut,Gy=new D,Wy=new D,cM=new xe;function Ge(i,e,t,n,s){lf.getNormalMatrix(t);let r=e.pos,o=e.nor,a=e.maxY-e.minY||1;for(let l=0;l<r.length;l+=3){let h=s+(1-s)*((r[l+1]-e.minY)/a);Co.set(r[l],r[l+1],r[l+2]).applyMatrix4(t),Ro.set(o[l],o[l+1],o[l+2]).applyMatrix3(lf).normalize(),i.pos.push(Co.x,Co.y,Co.z),i.nor.push(Ro.x,Ro.y,Ro.z),i.col.push(n.r*h,n.g*h,n.b*h)}}var kh=[0,.3,.6,.82,1],cf=[1,.75,.38,.12,0],Bh=20;function Xy(i,e,t,n,s){for(let r=0;r<kh.length-1;r++){let o=kh[r]*n,a=kh[r+1]*n,l=cf[r],h=cf[r+1];for(let c=0;c<Bh;c++){let u=c/Bh*Math.PI*2,d=(c+1)/Bh*Math.PI*2,m=Math.cos(u),g=Math.sin(u),x=Math.cos(d),p=Math.sin(d),f=[[o*m,o*g,l],[a*x,a*p,h],[a*m,a*g,h],[o*m,o*g,l],[o*x,o*p,l],[a*x,a*p,h]];for(let[S,w,y]of f)i.pos.push(e+S,.05,t+w),i.nor.push(0,1,0),i.col.push(s.r*y,s.g*y,s.b*y)}}}function We(i,e,t,n,s,r,o,a,l){return zy.compose(Wy.set(i,e,t),Hy.setFromEuler(Vy.set(n,s,r)),Gy.set(o,a,l))}function Yr(i,e,t,n,s,r,o,a,l,h,c,u,d,m,g,x,p,f,S){let w=[e,t,n,s,r,o,a,l,h,e,t,n,a,l,h,c,u,d],y=[f,f,S,f,S,S];for(let L=0;L<6;L++)i.pos.push(w[L*3],w[L*3+1],w[L*3+2]),i.nor.push(m,g,x),i.col.push(p.r*y[L],p.g*y[L],p.b*y[L])}function hf(i,e,t){return!i.even&&At(e*7+1,t*13+5)<.3?.8+At(e,t+99)*1.2:i.height}var st=(i,e)=>e.setHex(i),qy=new xe(11711080),Zr=new xe;function uf(i,e,t,n,s){let r=i*32,o=e*32,a=$r+1,l=new Float32Array(a*a*3),h=new Float32Array(a*a*3),c=new xe,u=new xe;for(let y=0;y<a;y++)for(let L=0;L<a;L++){let C=L&1?L-1>>1:(L>>1)-1,A=L&1?C:L>>1,E=y&1?y-1>>1:(y>>1)-1,v=y&1?E:y>>1,_=0,I=0,H=!1,R=!1;u.setRGB(0,0,0);let O=r+L/2,z=o+y/2;for(let G=E;G<=v;G++)for(let se=C;se<=A;se++){let ee=t(se,G);if(ee<0)continue;let fe=n[ee];if(st(fe.ground,c),fe.shape===0&&fe.ground===7776597){let Ue=Eo(O+300,z,9);c.lerp(qy,Math.max(0,Ue-.45)*1.1)}u.r+=c.r,u.g+=c.g,u.b+=c.b,I+=fe.shape===1?By:0,fe.shape===2&&(H=!0),(fe.ground===6973282||fe.ground===11569759||fe.shape===1)&&(R=!0),_++}_||(u.setHex(7251535),_=1);let B=(.9+Eo(O,z,3.5)*.18+(At(L+r*2,y+o*2)-.5)*.05)*(H?.7:1),Z=(y*a+L)*3;h[Z]=u.r/_*B,h[Z+1]=u.g/_*B,h[Z+2]=u.b/_*B,l[Z]=O,l[Z+2]=z,l[Z+1]=I/_+(R?0:(Eo(O,z,2.5)-.5)*.14)}let d=new Uint16Array($r*$r*6),m=0;for(let y=0;y<$r;y++)for(let L=0;L<$r;L++){let C=y*a+L,A=C+1,E=C+a,v=E+1;L+y&1?(d[m++]=C,d[m++]=E,d[m++]=A,d[m++]=A,d[m++]=E,d[m++]=v):(d[m++]=C,d[m++]=E,d[m++]=v,d[m++]=C,d[m++]=v,d[m++]=A)}let g=new rn;g.setAttribute("position",new it(l,3)),g.setAttribute("color",new it(h,3)),g.setIndex(new Qs(d,1)),g.computeVertexNormals(),g.computeBoundingSphere();let x=Oy(),p=new Kr,f=new Kr,S=new Kr,w=s?x.leaf:x.leafLo;for(let y=0;y<32;y++)for(let L=0;L<32;L++){let C=t(L,y),A=n[C],E=r+L,v=o+y,_=At(E,v),I=At(v+17,E-3),H=At(E*3+7,v*5+1);if(A.shape===2){let R=hf(A,E,v),O=.92+_*.14;st(A.top,c).multiplyScalar(O);let z=E,B=E+1,Z=v,G=v+1;Yr(p,z,R,G,B,R,G,B,R,Z,z,R,Z,0,1,0,c,1,1),st(A.side,c).multiplyScalar(O);let se=(fe,Ue)=>{let et=t(fe,Ue);if(et<0)return 0;let $=n[et];return $.shape===2?hf($,r+fe,o+Ue):0},ee=se(L,y+1);ee<R&&Yr(p,z,ee,G,B,ee,G,B,R,G,z,R,G,0,0,1,c,ee?.85:.55,1),ee=se(L,y-1),ee<R&&Yr(p,B,ee,Z,z,ee,Z,z,R,Z,B,R,Z,0,0,-1,c,ee?.85:.55,1),ee=se(L+1,y),ee<R&&Yr(p,B,ee,G,B,ee,Z,B,R,Z,B,R,G,1,0,0,c,ee?.85:.55,.95),ee=se(L-1,y),ee<R&&Yr(p,z,ee,Z,z,ee,G,z,R,G,z,R,Z,-1,0,0,c,ee?.85:.55,.95)}else if(A.shape===3){let R=.85+_*.5,O=E+.5+(I-.5)*.3,z=v+.5+(H-.5)*.3,B=.9*R+.3;st(A.side,c),Ge(p,x.trunk,We(O,0,z,0,I*6,0,R,B,R),c,.55),st(A.top,c),Zr.setHex(I<.5?6989898:3963448),c.lerp(Zr,H*.7).multiplyScalar(.92+_*.16),Ge(p,w,We(O,B+.5*R,z,I,_*6,H,.95*R,.8*R,.95*R),c,.62),c.multiplyScalar(1.08),Ge(p,w,We(O+(I-.5)*.5*R,B+1.05*R,z+(H-.5)*.4*R,H,I*6,_,.62*R,.55*R,.62*R),c,.75)}else if(A.shape===5||A.shape===6){let R=E+.5,O=v+.5,z=A.shape===5;for(let B=0;B<7;B++){let Z=B/7*Math.PI*2+_,G=.1+At(E+B,v-B)*.05;st(A.top,c).multiplyScalar(.8+At(E*3+B,v)*.3),Ge(p,x.rock,We(R+Math.cos(Z)*.34,G*.4,O+Math.sin(Z)*.34,Z,Z*2,0,G,G*.7,G),c,.65)}st(A.side,c);for(let B=0;B<3;B++)Ge(p,x.log,We(R,.07+B*.03,O,0,I*3+B*1.05,z?.25:.05,1,1,1),c,.6);z&&(st(15895086,c),Ge(f,x.flame,We(R,.08,O,0,_*6,0,1,1.15,1),c,.75),st(16369487,c),Ge(f,x.flame,We(R+.04,.1,O-.03,.1,I*6,0,.6,.8,.6),c,.85),st(16773560,c),Ge(f,x.flame,We(R-.02,.1,O+.02,0,H*6,.1,.3,.5,.3),c,1))}else if(A.shape===4)for(let R=0;R<3;R++){let O=At(E*5+R,v*3-R),z=At(v*7+R,E-R*11);st(A.top,c).multiplyScalar(.8+O*.35);let B=.16+O*.22;Ge(p,x.rock,We(E+.2+z*.6,B*.25,v+.2+O*.6,O*3,z*6,z,B,B*.6,B*.9),c,.6)}else if(A.shape===7)for(let R=0;R<2;R++){let O=At(E*3+R,v*7-R),z=At(v*5+R,E+R*13);st(A.top,c).multiplyScalar(.78+O*.3),R===1&&I<.4&&c.lerp(Zr.setHex(10512188),.45);let B=R?.28+O*.15:.45+O*.15;Ge(p,x.rock,We(E+.3+z*.4,B*.45,v+.3+O*.4,O*3,z*6,z,B,B*.8,B*.95),c,.55)}else if(A.shape===8){let R=(_-.5)*1.2+(E+v&1?Math.PI/2:0),O=(I-.5)*.25,z=E+.5,B=v+.5;Zr.setHex([9063986,6253426,8022586,7223856][Math.floor(H*4)]),c.copy(Zr).multiplyScalar(.85+_*.2),Ge(p,x.box,We(z,.18,B,O,R,O*.6,1.15,.42,.62),c,.6),c.multiplyScalar(.8),Ge(p,x.box,We(z+Math.cos(R)*.1,.58,B-Math.sin(R)*.1,O,R,O+.1,.6,.3*(.5+I),.55),c,.7),st(A.side,c),Ge(p,x.wheel,We(z+Math.cos(R)*.4,.17,B-Math.sin(R)*.4+.3,0,R,0,.17,.34,.34),c,.5),_<.6&&Ge(p,x.wheel,We(z-Math.cos(R)*.4,.12,B+Math.sin(R)*.4-.3,.4,R,1.2,.17,.3,.3),c,.5)}else if(A.shape===9){for(let R=0;R<3;R++){let O=1.5+At(E+R*5,v-R)*.4,z=E+.18+R*.32,B=v+.5+(At(E*9+R,v)-.5)*.1;st(A.side,c).multiplyScalar(.85+At(E+R,v*3)*.25),Ge(p,x.post,We(z,0,B,0,R,0,.3,O,.3),c,.55),st(A.top,c),Ge(p,x.spike,We(z,O,B,0,R,0,.3,.28,.3),c,.8)}for(let R=0;R<3;R++){let O=v+.2+R*.3,z=E+.5;st(A.side,c).multiplyScalar(.85+At(E+R,v*5)*.25),Ge(p,x.post,We(z,0,O,0,R,0,.28,1.4+At(E-R,v+R)*.4,.28),c,.55)}}else if(A.shape===10)for(let R=0;R<3;R++){let O=E+.2+R*.3;for(let z of[.5,-.5]){let Z=Math.sin(z)*1.05,G=Math.cos(z)*1.05;st(A.side,c),Ge(p,x.post,We(O,0,v+.5,z,0,0,.12,1.05,.12),c,.6),st(A.top,c),Ge(p,x.spike,We(O,G,v+.5+Z,z,0,0,.12,.32,.12),c,.85)}}else if(A.shape===11)st(A.side,c),Ge(p,x.box,We(E+.06,0,v+.5,0,0,0,.12,1.8,.14),c,.6),Ge(p,x.box,We(E+.94,0,v+.5,0,0,0,.12,1.8,.14),c,.6),Ge(p,x.box,We(E+.5,1.72,v+.5,0,0,0,1,.12,.16),c,.8),st(A.top,c),Ge(p,x.box,We(E+.12+.3,.02,v+.5+.3,0,-.9,0,.78,1.65,.07),c,.7);else if(A.shape===12)st(A.side,c),Ge(p,x.box,We(E+.5,0,v+.5,0,0,0,1,.8,.92),c,.6),Ge(p,x.box,We(E+.06,.8,v+.5,0,0,0,.12,.9,.92),c,.8),Ge(p,x.box,We(E+.94,.8,v+.5,0,0,0,.12,.9,.92),c,.8),Ge(p,x.box,We(E+.5,1.6,v+.5,0,0,0,1,.12,.92),c,.85),st(10474728,c),Ge(f,x.box,We(E+.5,.8,v+.5,0,0,0,.78,.8,.04),c,1);else if(A.shape===13)st(A.side,c),Ge(p,x.box,We(E+.5,0,v+.5,0,0,0,.72,.28,.96),c,.6),st(A.top,c),Ge(p,x.box,We(E+.5,.28,v+.56,0,0,0,.66,.1,.76),c,.85),st(15656662,c),Ge(p,x.box,We(E+.5,.28,v+.13,0,0,0,.5,.12,.18),c,.9);else if(A.shape===14)st(A.side,c),Ge(p,x.post,We(E+.5,0,v+.5,0,0,0,.1,1.7,.1),c,.6),Ge(p,x.box,We(E+.5,1.68,v+.5,0,.6,0,.3,.06,.3),c,.8),st(A.top,c),Ge(f,x.box,We(E+.5,1.45,v+.5,0,.6,0,.2,.24,.2),c,1),st(16757322,c),Xy(S,E+.5,v+.5,4.2,c);else if(A.shape===0&&A.ground===7776597&&_<.2){let R=E+.2+I*.6,O=v+.2+H*.6;st(6265413,c).multiplyScalar(.85+I*.3);for(let z=0;z<3;z++)Ge(p,x.blade,We(R+(z-1)*.06,0,O+(z*7%3-1)*.05,(H-.5)*.5,z*2.1,(z-1)*.35,1,.7+_*1.5,1),c,.6);_<.05&&(st(I<.33?15921126:I<.66?15976778:14243402,c),Ge(p,x.rock,We(R,.28,O,_,I,H,.06,.05,.06),c,1))}}return{ground:g,props:p.geometry(),glow:f.geometry(),pool:S.geometry()}}var Jr=i=>i.replace(/[&<>"']/g,e=>`&#${e.charCodeAt(0)};`),$y=new xe(16777215),Oh=[.5,1,2,4],Yy=4,Zy=8,Ky=32;function zh(i,e){let t=Math.floor((i/3600+8)/24)+1,n=Math.floor((i/3600+8)%24),s=Math.floor(i/60%60);return`${e} ${t} ${String(n).padStart(2,"0")}:${String(s).padStart(2,"0")}`}var Po=class{constructor(e,t,n,s,r){this.mapName=t;this.scale=n;this.looks=s;this.zombie=r;this.rec=e;let o=atob(e.frames),a=new Uint8Array(o.length);for(let h=0;h<o.length;h++)a[h]=o.charCodeAt(h);this.data=new Int16Array(a.buffer,0,a.length>>1);for(let h=0;h<this.data.length;h+=1+this.data[h]*7)this.offs.push(h);let l=e.who.length;this.face=new Float32Array(l),this.phase=new Float32Array(l),this.lastX=new Float32Array(l).fill(NaN),this.lastY=new Float32Array(l),this.spd=new Float32Array(l),this.el=document.createElement("div"),this.el.id="replay",document.body.appendChild(this.el),this.centre(0)}mapName;scale;looks;zombie;rec;t=0;playing=!0;speed=1;data;offs=[];face;phase;lastX;lastY;spd;el;html="";cx=0;cy=0;span=10;get length(){return Math.max(0,this.offs.length-1)/this.rec.hz}close(){this.el.remove()}toggle(){this.t>=this.length&&(this.t=0),this.playing=!this.playing}seek(e){this.t=Math.max(0,Math.min(this.length,this.t+e)),this.lastX.fill(NaN)}faster(e){let t=Oh.indexOf(this.speed);this.speed=Oh[Math.max(0,Math.min(Oh.length-1,t+(e?1:-1)))]}update(e){this.playing&&(this.t+=e*this.speed,this.t>=this.length&&(this.t=this.length,this.playing=!1))}rows(e,t){t.clear();let n=this.data,s=this.offs[Math.max(0,Math.min(this.offs.length-1,e))];if(s===void 0)return;let r=n[s];for(let o=0,a=s+1;o<r;o++,a+=7)t.set(n[a],[n[a+1]/10,n[a+2]/10,n[a+3]/5e3,n[a+4],n[a+5],n[a+6]])}a=new Map;b=new Map;centre(e){this.rows(e,this.a);let t=0,n=0,s=0;for(let[r,o]of this.a){let a=this.rec.who[r][1]===2?2:1;t+=o[0]*a,n+=o[1]*a,s+=a}s&&(this.cx=t/s,this.cy=n/s)}draw(e,t,n){let s=this.t*this.rec.hz,r=Math.floor(s),o=s-r;this.rows(r,this.a),this.rows(r+1,this.b);let a=1/0,l=1/0,h=-1/0,c=-1/0;for(let[u,d]of this.a){let m=this.b.get(u)??d,g=this.rec.who[u],x=g[1]===2,p=d[0]+(m[0]-d[0])*o,f=d[1]+(m[1]-d[1])*o,S=this.lastX[u],w=Number.isNaN(S)?0:Math.hypot(p-S,f-this.lastY[u]);w>.004&&(this.face[u]=Math.atan2(p-S,f-this.lastY[u])),this.lastX[u]=p,this.lastY[u]=f;let y=t>0?Math.min(6,w/t):0;this.spd[u]=this.spd[u]+(y-this.spd[u])*Math.min(1,t*10),this.phase[u]=(this.phase[u]+w*4.2)%(Math.PI*2);let L=d[5];e.add(p,f,this.face[u],this.phase[u],Math.min(1,this.spd[u]/(x?1.2:2.2)),x?this.zombie:this.looks(g[0],g[2]),(L&(Yy|Zy))!==0,L&Ky?.62:1,x),x||e.marker(p,f,performance.now()/1e3,$y),a=Math.min(a,p),h=Math.max(h,p),l=Math.min(l,f),c=Math.max(c,f)}if(a<=h){let u=Math.min(1,t*3);this.cx+=((a+h)/2-this.cx)*u,this.cy+=((l+c)/2-this.cy)*u,this.span+=(Math.max(h-a,(c-l)*1.6)-this.span)*u}this.overlay(r,n)}overlay(e,t){let n=this.rec,s=c=>c>=0?Jr(n.who[c]?.[2]??"?"):"?",r=[];for(let c=n.events.length-1;c>=0&&r.length<4;c--){let[u,d,m,g,x]=n.events[c];if(u>e||e-u>n.hz*6)continue;let p=d==="bite"?we("evBite",s(g),s(m),String(x)):d==="killed"?we("evKilled",s(g),s(m)):d==="death"?we("evDeath",s(m)):d==="fight"?we("evFight",s(m),s(g)):d==="flee"?we("evFlee",s(m),s(g)):`${s(m)}: \u201C${Jr(String(x))}\u201D`;r.unshift(`<div class="re re-${d}">${p}</div>`)}this.rows(e,this.a);let o=[];for(let[c,u]of this.a){let d=n.who[c];d[1]!==2&&o.push(`<span class="rp-p"><b>${Jr(d[2])}</b> ${t(u[3])} \xB7 ${u[4]}</span>`)}let a=c=>`${Math.floor(c/60)}:${String(Math.floor(c%60)).padStart(2,"0")}`,l=this.length?this.t/this.length*100:0,h=`<div class="rp-t">${P("rpTitle")} \xB7 ${Jr(zh(n.start+this.t*this.scale,P("day")))} \xB7 ${Jr(this.mapName)}</div><div class="rp-bar"><i style="width:${l.toFixed(1)}%"></i></div><div class="rp-s"><span>${this.playing?"\u25B6":"\u275A\u275A"} ${a(this.t)} / ${a(this.length)} \xB7 x${this.speed}</span><span>${P("rpHint")}</span></div><div class="rp-people">${o.join("")}</div><div class="rp-ev">${r.join("")}</div>`;h!==this.html&&(this.html=h,this.el.innerHTML=h)}};var rr=["use","talk","attack","aim","build","run","eat","drink","pickup","sleep","zoomIn","zoomOut","thoughts","person","menu","camera","wheel"],Jy={use:"aUse",run:"aRun",eat:"aEat",drink:"aDrink",pickup:"aPickup",sleep:"aSleep",zoomIn:"aZoomIn",zoomOut:"aZoomOut",thoughts:"aThoughts",person:"aPerson",menu:"aMenu",camera:"aCamera",wheel:"aWheel",talk:"aTalk",attack:"aAttack",aim:"aAim",build:"aBuild"},Qt=i=>P(Jy[i]),Do=2,ar={pad:{use:0,run:1,attack:2,talk:3,zoomIn:4,zoomOut:5,aim:6,wheel:7,thoughts:8,menu:9,build:10,camera:11},remote:{use:"ok",attack:"red",talk:"green",thoughts:"yellow",person:"blue",zoomIn:"chUp",zoomOut:"chDown",menu:"info",wheel:"playPause",aim:"ff",build:"tools"},v:Do};function Uo(i){return{pad:{...i.pad},remote:{...i.remote},v:i.v}}function jr(i,e){for(let t of rr)if(i.pad[t]===e)return t}function ms(i,e){for(let t of rr)if(i.remote[t]===e)return t}var jy={ok:"OK",red:"\u{1F534}",green:"\u{1F7E2}",yellow:"\u{1F7E1}",blue:"\u{1F535}",chUp:"CH +",chDown:"CH \u2212",info:"Info",play:"\u25B6",pause:"\u23F8",playPause:"\u23EF",ff:"\u23E9",rew:"\u23EA",next:"\u23ED",prev:"\u23EE",stop:"\u23F9",record:"\u23FA",tools:"Tools",chList:"CH list",guide:"Guide",space:"Space",pageUp:"PgUp",pageDown:"PgDn"},Qr=i=>jy[i]??(/^\d$/.test(i),i),Io=class{constructor(e,t,n){this.build=e;this.onPick=t;this.onClose=n;this.el=document.createElement("div"),this.el.id="gmenu",this.el.hidden=!0,this.el.setAttribute("role","dialog"),this.titleEl=document.createElement("div"),this.titleEl.className="mt",this.textEl=document.createElement("div"),this.textEl.className="mx",this.listEl=document.createElement("div"),this.listEl.className="ml",this.listEl.setAttribute("role","menu"),this.el.append(this.titleEl,this.textEl,this.listEl),document.body.appendChild(this.el)}build;onPick;onClose;el;titleEl;textEl;listEl;stack=[];rows=[];open=!1;sel=0;get page(){return this.stack.length?this.stack[this.stack.length-1].id:""}show(e="root"){this.stack=[{id:e,sel:0}],this.open=!0,this.el.hidden=!1,document.body.classList.add("menu-open"),this.render()}push(e){this.stack.length&&(this.stack[this.stack.length-1].sel=this.sel),this.stack.push({id:e,sel:0}),this.render()}back(){if(this.stack.pop(),!this.stack.length){this.close();return}this.render(this.stack[this.stack.length-1].sel)}close(){this.open=!1,this.el.hidden=!0,document.body.classList.remove("menu-open"),this.stack=[],this.onClose()}refresh(){this.open&&this.render(this.sel)}render(e=0){let t=this.build(this.page);this.rows=t.rows,this.titleEl.textContent=t.title,this.el.classList.toggle("wide",!!t.wide),t.html?this.textEl.innerHTML=t.html:this.textEl.textContent=t.text??"",this.textEl.hidden=!t.text&&!t.html,this.listEl.textContent="";for(let n of t.rows){let s=document.createElement("div");s.className="mr"+(n.dim?" dim":""),s.setAttribute("role","menuitem");let r=document.createElement("span");if(r.textContent=n.label+(n.sub?" \u203A":""),s.appendChild(r),n.value!==void 0){let o=document.createElement("span");o.className="mv",o.textContent=n.value,s.appendChild(o)}this.listEl.appendChild(s)}this.select(Math.min(e,Math.max(0,t.rows.length-1)))}select(e){let t=this.listEl.children;t[this.sel]?.classList.remove("on"),this.sel=e;let n=t[e];if(n){n.classList.add("on"),n.scrollIntoView?.({block:"nearest"});let s=this.rows[e];globalThis.MyPC?.announce?.(s.label+(s.value?", "+s.value:""))}}input(e){if(!this.open)return;let t=this.rows.length;if(e==="up"&&t)this.select((this.sel+t-1)%t);else if(e==="down"&&t)this.select((this.sel+1)%t);else if(e==="back")this.back();else if(e==="ok"&&t){let n=this.rows[this.sel];this.onPick(this.page,n.id)}}};function bn(i,e){let t=Math.max(0,Math.min(100,100-e)),n=t>60?"#5cc98a":t>30?"#e8b64a":"#e5625b";return`<span class="nb"><span class="nl">${i}</span><span class="nt"><i style="width:${Math.max(3,t)}%;background:${n}"></i></span></span>`}var ff={drink:"gDrink",eat:"gEat",forage:"gForage",sleep:"gSleep",talk:"gTalk",wander:"gWander",rest:"gRest",travel:"gTravel","gather wood":"wGatherWood","gather stone":"wGatherStone","gather scrap":"wGatherScrap","make an axe":"wAxe","make a spear":"wSpear","build a campfire":"wFire","build a hut":"wHut","feed the fire":"wTend","collect food and store it":"wStore","search the ruins":"wLoot","plant a field":"wFarm","repair the huts":"wRepair"};function df(i){let e={wood:"iWood",stone:"iStone",scrap:"iScrap",axe:"iAxe",spear:"iSpear"};return Object.entries(i??{}).filter(([t,n])=>n>0&&e[t]).map(([t,n])=>t==="axe"||t==="spear"?P(e[t]):`${n} ${P(e[t])}`).join(", ")}var Lo=class{constructor(e=10){this.max=e;this.box=document.createElement("div"),this.box.id="bubbles",document.body.appendChild(this.box);for(let t=0;t<e;t++){let n=document.createElement("div");n.className="bub",n.hidden=!0;let s=document.createElement("div");s.className="ba";let r=document.createElement("div");r.className="bb";let o=document.createElement("div");o.className="bp",o.hidden=!0;let a=document.createElement("i");o.appendChild(a),n.append(s,r,o),this.box.appendChild(n),this.pool.push({el:n,a:s,b:r,p:o,pi:a,pct:-2,id:-1,text:"",act:-1,ver:-1,lx:0,ly:0})}}max;box;pool=[];ver=0;pt={x:0,y:0};data=new Map;set(e,t){this.data.clear();for(let n of e){let s={id:n[0],act:n[1],to:String(n[2]??""),dist:Number(n[3])||0,wish:String(n[4]??""),wishWith:String(n[5]??""),why:String(n[6]??""),mood:String(n[7]??""),said:String(n[8]??""),pct:typeof n[9]=="number"?n[9]:-1,from:String(n[10]??"")};this.data.set(s.id,s)}this.ver++}hide(){for(let e of this.pool)e.el.hidden=!0,e.id=-1}cand=Array.from({length:48},()=>({id:-1,x:0,y:0,d:0}));wp={x:0,y:0};draw(e,t,n,s,r){let o=0;for(let l of this.data.keys()){if(o>=this.cand.length)break;if(!e(l,this.wp))continue;let h=this.cand[o++];h.id=l,h.x=this.wp.x,h.y=this.wp.y,h.d=Math.hypot(h.x-n,h.y-s)}let a=0;for(;a<this.pool.length&&a<o;a++){let l=a;for(let g=a+1;g<o;g++)this.cand[g].d<this.cand[l].d&&(l=g);if(l!==a){let g=this.cand[a];this.cand[a]=this.cand[l],this.cand[l]=g}let h=this.cand[a],c=this.pool[a],u=this.data.get(h.id);if(!t(h.x,h.y,this.pt)){c.el.hidden=!0;continue}if(c.id!==h.id||c.act!==u.act||c.ver!==this.ver){let g=r(u.act)+(u.to?" \xB7 "+we("bWith",u.to):"")+(u.dist>=3?` \xB7 ${u.dist} m`:""),x=u.wish==="task"?u.why:u.wish?we("bWants",P(ff[u.wish]??"gWander")+(u.wishWith?" "+we("bWith",u.wishWith):""))+(u.why?` (${u.why})`:""):"",p=[u.said?`\u201C${u.said}\u201D`:"",x].filter(Boolean).join(" \xB7 "),f=g+"|"+p;c.text!==f&&(c.text=f,c.a.textContent=g,c.b.textContent=p,c.b.hidden=!p);let S=u.wish==="task"?u.pct:-1;c.pct!==S&&(c.pct=S,c.p.hidden=S<0,S>=0&&(c.pi.style.width=`${Math.max(6,S)}%`,c.p.className=u.from?"bp ord":"bp")),c.id=h.id,c.act=u.act,c.ver=this.ver}c.el.hidden=!1;let d=Math.round(this.pt.x),m=Math.round(this.pt.y);(d!==c.lx||m!==c.ly)&&(c.lx=d,c.ly=m,c.el.style.transform=`translate(${d}px, ${m}px) translate(-50%, -100%)`)}for(;a<this.pool.length;a++)this.pool[a].el.hidden=!0,this.pool[a].id=-1}},Qy={strength:"tStrength",speed:"tSpeed",intelligence:"tIntelligence",courage:"tCourage",empathy:"tEmpathy",metabolism:"tMetabolism",lifespan:"tLifespan"};function Hh(i,e,t){let n=o=>o.replace(/[&<>"']/g,a=>`&#${a.charCodeAt(0)};`),s=`<div class="pn">${n(i.name)}</div><div class="ps">${i.sex==="f"?P("pWoman"):P("pMan")} \xB7 ${we("pAge",String(i.age))}${i.age<16?" \xB7 "+P("pChild"):""}${i.pregnant?" \xB7 "+P("pExpecting"):""}</div>`;if(!i.alive)return s+`<div class="ps">${P("pDead")}${i.cause?" ("+n(i.cause)+")":""}</div>`;let r=[s,`<div class="pa">${n(e(i.act??0))}${i.carry?" \xB7 "+we("carry",String(i.carry)):""}${df(i.inv)?" \xB7 "+n(we("has",df(i.inv))):""}</div>`,`<div class="pbars">${bn(P("nFood"),i.hunger??0)}${bn(P("nWater"),i.thirst??0)}${bn(P("nRest"),i.tired??0)}${bn(P("nFun"),i.lonely??0)}${bn(P("nHp"),100-(i.hp??100))}</div>`];if(i.goal&&r.push(`<div class="pm">${P("pGoal")}: <b>${n(i.goal.text)}</b> \xB7 ${Math.min(i.goal.k+1,i.goal.n)}/${i.goal.n}</div><div class="bp${i.goal.from!=="myself"?" ord":""}"><i style="width:${Math.max(6,i.goal.pct)}%"></i></div>`),i.level!==void 0&&r.push(`<div class="pm">${we("pLevel",String(i.level),String(i.xp??0))}</div>`),i.mind){let o=i.mind;r.push(`<div class="pm">${P("pMood")}: <b>${n(o.mood)}</b>${o.plan?` \xB7 ${P("pWants")} ${n(P(ff[o.plan.act]??"gWander"))}${o.plan.with?" "+n(we("bWith",o.plan.with)):""}${o.plan.why?" ("+n(o.plan.why)+")":""}`:""}</div>`),o.said&&r.push(`<div class="pm">${P("pSaid")}: \u201C${n(o.said)}\u201D</div>`)}return t&&(r.push(`<div class="pm">${n(i.personality.join(", "))} \xB7 ${we("pGen",String(i.generation))}</div>`,`<div class="pm">${P("pPartner")}: ${n(i.partner??P("pNone"))} \xB7 ${P("pParents")}: ${n(i.parents.join(", ")||P("pFirst"))} \xB7 ${P("pChildren")}: ${n(i.children.join(", ")||P("pNone"))}</div>`,`<div class="pm">${P("pTraits")}: ${Object.entries(i.traits).map(([o,a])=>`${P(Qy[o]??"tStrength")} ${o==="lifespan"?a:Math.round(a*100)+"%"}`).join(" \xB7 ")}</div>`),i.mind?.memory&&r.push(`<div class="pm">${P("pMemory")}: ${n(i.mind.memory)}</div>`),i.mind?.recent.length&&r.push(`<div class="pm">${P("pRecent")}: ${n(i.mind.recent.join(" \xB7 "))}</div>`)),r.join("")}var No=class{constructor(e){this.el=e;e.hidden=!0,this.mid=document.createElement("div"),this.mid.className="wh-mid",this.helpEl=document.createElement("div"),this.helpEl.className="wh-help"}el;open=!1;hold=!1;sel=-1;openedAt=0;items=[];slots=[];mid;helpEl;show(e,t,n){this.items=e,this.hold=t,this.open=!0,this.sel=-1,this.openedAt=performance.now(),this.el.textContent="",this.slots=e.map((s,r)=>{let o=r/e.length*Math.PI*2,a=document.createElement("div");a.className="wh-s",a.style.left=`${50+Math.sin(o)*36}%`,a.style.top=`${50-Math.cos(o)*36}%`;let l=document.createElement("b");l.textContent=s.icon;let h=document.createElement("span");return h.textContent=s.label,a.append(l,h),this.el.appendChild(a),a}),this.mid.textContent="",this.helpEl.textContent=n,this.el.append(this.mid,this.helpEl),this.el.hidden=!1}aim(e,t){if(e*e+t*t<.3)return;let n=this.items.length,s=Math.atan2(e,-t);s<0&&(s+=Math.PI*2),this.choose(Math.round(s/(Math.PI*2/n))%n)}step(e){let t=this.items.length;e==="up"?this.choose(0):e==="down"?this.choose(Math.floor(t/2)):this.choose(((this.sel<0?0:this.sel)+(e==="right"?1:t-1))%t)}choose(e){if(e===this.sel)return;this.sel>=0&&this.slots[this.sel]?.classList.remove("on"),this.sel=e;let t=this.slots[e];t&&(t.classList.add("on"),this.mid.textContent=this.items[e].label)}close(){if(!this.open)return null;let e=this.sel>=0?this.items[this.sel].id:null;return this.open=!1,this.hold=!1,this.sel=-1,this.el.hidden=!0,e}};var Uf=document.getElementById("c"),mf=document.getElementById("screen"),Nf=document.getElementById("top"),Ff=document.getElementById("hint"),ei=document.getElementById("note"),Wh=document.getElementById("card"),Si=null,Gn="",an=null,Tt="connect",je="play",Ho="",Xi=0,Xh=0,Dn=null,Bt="",ou=256,lu=256,Mn=128,Sn=128,wi="mid",lt={q:"auto",fog:2,dist:1,fps:!1},n_=[0,1.6,1,.6],i_=[.7,1,1.4];function kf(){ae&&(ae.fogK=n_[lt.fog]??1,ae.distK=i_[lt.dist]??1,ae.settingsChanged(),ws.hidden=!lt.fps||Tt!=="world",ni())}var ws=document.createElement("div");ws.id="fps";ws.hidden=!0;document.body.appendChild(ws);var Vo=0,Go=0,ko=0,s_=!0,ae=null,Bf=[],qh=new Uint8Array(256),fr=new Map,na=new Map,vs=[],Ko=0,Jo=0,ia=10,sa=1,Of=0,jo={radius:.3,walk:1.4,run:3.5},yt=4096,Vt=new Int32Array(yt).fill(-1),Pt=new Uint8Array(yt),Qo=new Uint8Array(yt),el=new Uint8Array(yt),Wo=new Uint8Array(yt),tl=new Float32Array(yt),nl=new Float32Array(yt),Ot=new Float32Array(yt),Gt=new Float32Array(yt),$h=new Float32Array(yt),Yh=new Float32Array(yt),r_=new Float32Array(yt),qi=new Float32Array(yt),ea=new Float32Array(yt),or=new Float32Array(yt),Zh=new Float32Array(yt),Kh=new Float32Array(yt),zf=[],Wn=new Map,il=0,Jh=100,vt=-1,jh=0,Ei=-1,hl=!1,Hf=0,Vf="",qt=0,$t=0,yi=0,_i=0,pn=!1,sl=150,Xo=0,qo=0,gf=!1,Bo=0,ul=0,pr=!1,ct={left:!1,right:!1,up:!1,down:!1},gt=Uo(ar),Qh=!1,ti=null,Ms=!1,Ss=0,jn=-1,ra=NaN;function dl(){if(Ms)return Ss;if(Number.isFinite(ra))return ra;let i=Ai();return i>=0?Math.PI/2-qi[i]:0}function eu(i,e,t,n,s){let r=-1,o=n;for(let a=0;a<yt;a++){if(Vt[a]===-1||Pt[a]!==Dt.Threat&&Pt[a]!==Dt.Animal||Qo[a]&Mr.Dead)continue;let l=Ot[a]-i,h=Gt[a]-e,c=Math.hypot(l,h);if(c>=o)continue;let u=Math.atan2(h,l)-t;u=Math.atan2(Math.sin(u),Math.cos(u)),Math.abs(u)<=s&&(o=c,r=a)}return r}var Ln=!0,$o=["top","third","first"],Jn="top",_s=0,aa=!1,Gf=0,at=null,fn="",kt={},ys=null,gs=null,en=null,xf=!1,In={sex:"m",skin:1},ht=null,cr="",Wf=24,on=null,mr=-1,vf=0,Xf=new Float32Array(yt),qf=new Float32Array(yt),$f=new Uint32Array(yt),tu=0,xs=0,zt=i=>new xe(i),a_=[9132604,7044426,5926790,10124111,8014667,6184558,10512442,5204830,9076586].map(zt),rl=[15845797,14724226,13011806,10250819,7227951].map(zt),o_=[2825492,4861984,8016432,13214826,1710618,9079434].map(zt),l_=[3881536,4865328,3095370,5261373].map(zt),Yf={tunic:zt(7038544),skin:zt(10469247),hair:zt(5660746),pants:zt(4080694)},Zf={tunic:zt(3122027),skin:zt(15251600),hair:zt(3810326),pants:zt(3817306)},Kf={tunic:zt(14254635),skin:zt(14197370),hair:zt(2825492),pants:zt(4210762)},yf=zt(16765286),c_=zt(16777215),_f=new Map;function h_(i,e){let t=(i?64:0)+e,n=_f.get(t);if(!n){let s=i?Zf:Kf,r=(e&8)!==0;n={tunic:s.tunic,skin:rl[Math.min(rl.length-1,e-1&7)],hair:r?zt(5911584):s.hair,pants:r?s.tunic:s.pants},_f.set(t,n)}return n}function Jf(i){let e=n=>At(i&65535,n),t=(n,s)=>n[Math.floor(e(s)*n.length)];return{tunic:t(a_,1),skin:t(rl,2),hair:t(o_,3),pants:t(l_,4)}}function $i(i,e=""){Tt=i,Uf.style.visibility=i==="world"?"visible":"hidden",Nf.hidden=Ff.hidden=i!=="world",ws.hidden=!lt.fps||i!=="world",i!=="world"&&(ei.hidden=!0,Wh.hidden=!0,ru="",Q?.open&&Q.close(),bs?.hide()),mf.hidden=i==="world";let t="";switch(i){case"connect":t=`<h1>${P("connecting")}</h1>`;break;case"offline":t=`<h1>${P("offline")}</h1><p class="dim">${rt(Gn)}</p><p class="key">A \xB7 ${P("menuServer")}</p>`;break;case"noserver":t=`<h1>${P("noServer")}</h1><p class="key">${P("enterServer")}</p>`;break;case"pair":t=`<h1>${P("pairTitle")}</h1><p>${P("pairHow")}</p><div class="code">${Ho.slice(0,3)} ${Ho.slice(3)}</div><p class="dim">${rt(u_())}</p><p class="dim">${P("pairWait")}</p>`;break;case"pairfail":t=`<h1>${e}</h1>`;break;case"nogl":t=`<h1>${P("noGl")}</h1>`;break}mf.innerHTML=t,i==="pair"&&MyPC.announce?.(`${P("pairTitle")}. ${Ho.split("").join(" ")}`),yr()}var rt=i=>i.replace(/[&<>"']/g,e=>`&#${e.charCodeAt(0)};`),u_=()=>Gn.replace(/\/+$/,"")+"/panel/",bf=0;function De(i,e=3500){ei.textContent=i,ei.hidden=!1,clearTimeout(bf),e>0&&(bf=window.setTimeout(()=>{ei.hidden=!0},e)),MyPC.announce?.(i)}function d_(i){let e=i.trim().replace(/\/+$/,"");return/^[a-z]+:\/\//i.test(e)||(e="https://"+e),e.replace(/^http/i,"ws")+"/ws"}function gr(){if(clearTimeout(Xh),an&&(an.onclose=null,an.close(),an=null),!Gn){$i("noserver");return}Tt!=="world"&&$i(Xi>1?"offline":"connect");let i;try{i=new WebSocket(d_(Gn))}catch{$i("noserver");return}i.binaryType="arraybuffer",an=i,i.onopen=()=>{Xi=0,Si?.token?i.send(ga({t:Te.Hello,v:1,token:Si.token,name:al()})):i.send(ga({t:Te.Pair,v:1,name:al(),dev:f_()}))},i.onmessage=e=>p_(Pu(e.data)),i.onclose=()=>{an===i&&(an=null,Tt!=="pairfail"&&(Xi++,(Tt!=="world"||Xi>2)&&$i("offline"),Xh=window.setTimeout(gr,Math.min(15e3,1e3*2**Math.min(Xi,4)))))}}function al(){return String(MyPC.info?.().profile?.name||Si?.name||"Player")}function f_(){return/Tizen|SMART-TV/i.test(navigator.userAgent)?"Samsung TV":/Android/i.test(navigator.userAgent)?"Android":"Browser"}function Xe(i){an&&an.readyState===1&&an.send(ga(i))}function p_(i){switch(i.t){case Te.PairCode:Ho=i.code,$i("pair");break;case Te.Paired:Si={token:i.token,name:i.name,server:Gn},MyPC.save("auth",Si),an?.close();break;case Te.Error:i.code==="auth"?(Si=null,MyPC.save("auth",null),setTimeout(gr,300)):i.code==="expired"||i.code==="denied"?$i("pairfail",P(i.code==="expired"?"pairExpired":"pairDenied")):i.code==="full"&&De(P("worldFull"));break;case Te.Welcome:{Dn=i,aa=!!i.seer,Bf=of(i.tiles),qh.fill(0);for(let e of i.tiles)e.solid&&(qh[e.id]=1);if(i.body&&(jo=i.body),Ko=i.clock.gameSec,Jo=performance.now(),ia=i.clock.clockScale,sa=i.clock.paused?0:i.clock.speed,!ae){try{ae=new To(Uf,wi)}catch{$i("nogl");return}au(),kf()}!Bt||!i.maps.some(e=>e.id===Bt)?hr(String(MyPC.load("map",i.maps[0].id))):hr(Bt),$i("world"),je==="play"&&Xe({t:Te.Join}),ni();break}case Te.You:{Ei=i.id,hl=i.transit,Vf=i.map,Hf=i.arrive??0,pn=!1,!i.transit&&i.map!==Bt&&hr(i.map),je==="play"&&i.x!==void 0&&i.y!==void 0&&(Mn=i.x,Sn=i.y,Xn=!0,vt=-1,ni()),je==="play"&&!xf&&(xf=!0,Xe({t:Te.Do,a:"mine"})),i.transit?De(we("travelling",oa(i.map)),0):ei.hidden=!0;break}case Te.Notice:if(i.kind==="people"&&R_(i.data),i.kind==="interact"){let e=i.data,t=e?Wn.get(e.id):void 0;De(e?e.kind===Dt.Player?P("metPlayer"):`${Yi(t!==void 0?el[t]:0)}...`:P("nobody"))}if(i.kind==="say"){let e=i.data;De(`${e.name}: \u201C${e.text}\u201D`,7e3)}if(i.kind==="did"&&O_(i.data),i.kind==="me"&&(at=i.data,la(),Q.open&&(Q.page==="bag"||Q.page==="cat"||Q.page==="guide")&&Q.refresh()),i.kind==="blocked"&&De(P("dBlocked"),5e3),i.kind==="info"){let e=i.data;e&&e.id===mr&&(on=e,la(),Q.open&&Q.page==="person"&&Q.refresh())}i.kind==="minds"&&(aa=!0,Gf=performance.now(),bs.set(i.data,Yi));break;case Te.Pong:sl=sl*.7+(performance.now()-i.c)*.3;break;case Te.Chunk:{if(i.map!==Bt||!Dn)break;let e=xa(i.cx,i.cy);fr.set(e,i.tiles),x_(e);break}case Te.ChunkDrop:if(i.map!==Bt)break;for(let e of i.keys){fr.delete(e);let t=na.get(e);t&&(ae?.removeChunk(t),na.delete(e))}break;case Te.Frame:{if(i.map!==Bt)break;let e=performance.now();Jh=Jh*.85+Math.min(400,e-il)*.15,il=e,Ko=i.gameSec,Jo=e;for(let n=0;n<yt;n++)Vt[n]!==-1&&(tl[n]=Ot[n],nl[n]=Gt[n]);let t=Iu(i.upd);for(let n=0;n<t.length;n+=7){let s=m_(t[n]);if(s<0)continue;let r=Pt[s]===0;Pt[s]=t[n+1]&255,Qo[s]=t[n+1]>>8&255,el[s]=t[n+1]>>16&255,Wo[s]=t[n+1]>>>24&63,Ot[s]=t[n+2]/100,Gt[s]=t[n+3]/100,r_[s]=t[n+4]/1e4,$h[s]=t[n+5]/100,Yh[s]=t[n+6]/100,r&&(tl[s]=Zh[s]=Ot[s],nl[s]=Kh[s]=Gt[s],or[s]=0,ea[s]=0,qi[s]=Math.atan2($h[s],Yh[s])||0,zf[s]=Jf(t[n]))}for(let n of i.del){let s=Wn.get(n);s!==void 0&&(Vt[s]=-1,Pt[s]=0,Wn.delete(n)),n===vt&&(vt=-1)}break}case Te.Stats:Of=i.s.agents,sa=i.s.paused?0:i.s.speed;break}}function m_(i){let e=Wn.get(i);if(e!==void 0)return e;for(let t=0;t<yt;t++)if(Vt[t]===-1)return Vt[t]=i,Wn.set(i,t),t;return-1}function g_(){Vt.fill(-1),Pt.fill(0),Wn.clear(),vt=-1}var Yi=i=>P(["actIdle","actWander","actDrink","actEat","actForage","actSleep","actTalk","actTravel","actRest","actFlee","actGo","actGather","actBuild","actFight"][i]??"actIdle"),oa=i=>Dn?.maps.find(e=>e.id===i)?.name??i;function x_(i){vs.includes(i)||vs.push(i)}function v_(i,e,t){let n=i&65535,s=i>>>16;if(e<0?(n--,e+=32):e>=32&&(n++,e-=32),t<0?(s--,t+=32):t>=32&&(s++,t-=32),n<0||s<0)return-1;let r=fr.get(xa(n,s));return r?r[t*32+e]:-1}function y_(){if(!vs.length||!ae)return;let i=0,e=1/0,t=xr()/32-.5,n=vr()/32-.5;for(let a=0;a<vs.length;a++){let l=vs[a],h=Math.hypot((l&65535)-t,(l>>>16)-n);h<e&&(e=h,i=a)}let s=vs.splice(i,1)[0];if(!fr.has(s))return;let r=na.get(s);r&&ae.removeChunk(r);let o=uf(s&65535,s>>>16,(a,l)=>v_(s,a,l),Bf,wi==="high");na.set(s,ae.addChunk(o.ground,o.props,o.glow,o.pool))}function hr(i){if(!Dn)return;let e=Dn.maps.find(t=>t.id===i)??Dn.maps[0];Bt=e.id,ou=e.w,lu=e.h,Mn=e.w/2,Sn=e.h/2,fr.clear(),na.clear(),vs.length=0,ae?.setMap(e.w,e.h,Dn.portals.filter(t=>t.map===Bt)),g_(),pn=!1,Xn=!0,MyPC.save("map",Bt),ni()}function __(){return ae&&ae.view!=="top"?Math.min(96,ae.sight+10):Math.min(96,((ae?.dist??24)*1.2+14)*(ae?.distK??1))}function ni(){Dn&&Xe({t:Te.View,map:Bt,x:xr(),y:vr(),r:__()})}function Ai(){return Ei>=0?Wn.get(Ei)??-1:-1}function Ti(){return je==="play"&&Ei>=0&&!hl}function xr(){return ht?ht.cx:Ti()&&pn?qt:Mn}function vr(){return ht?ht.cy:Ti()&&pn?$t:Sn}function b_(i){ht&&ht.close(),cr||(cr=Bt),i.map!==Bt&&hr(i.map),je==="play"&&Xe({t:Te.Input,mx:0,my:0,run:!1,seq:++ul}),ct.left=ct.right=ct.up=ct.down=!1,ut.left=ut.right=ut.up=ut.down=!1,!ht&&ae&&(Wf=ae.dist),ht=new Po(i,oa(i.map),ia,e=>Jf(e),Yf),document.body.classList.add("replaying"),Xn=!0,ni(),MyPC.announce?.(P("rpTitle"))}function jf(){ht&&(ht.close(),ht=null,ae&&(ae.dist=Wf),document.body.classList.remove("replaying"),cr&&cr!==Bt&&hr(cr),cr="",pn=!1,Xn=!0,ni(),Qn("past"))}function Oo(i,e){let t=Math.floor(i),n=Math.floor(e);if(t<0||n<0||t>=ou||n>=lu)return!0;let s=fr.get(xa(t/32|0,n/32|0));return s?qh[s[n%32*32+t%32]]===1:!1}function Mf(i,e){let t=jo.radius*.9;return Oo(i-t,e-t)||Oo(i+t,e-t)||Oo(i-t,e+t)||Oo(i+t,e+t)}function Qf(){if(Q.open||xt.open)return ur[0]=ur[1]=0,ur;let i=MyPC.gamepad?MyPC.gamepad.axis(0):0,e=MyPC.gamepad?MyPC.gamepad.axis(1):0;Math.hypot(i,e)<.18&&(i=0,e=0),(ct.left||ut.left)&&(i=-1),(ct.right||ut.right)&&(i=1),(ct.up||ut.up)&&(e=-1),(ct.down||ut.down)&&(e=1);let t=Math.hypot(i,e);return t>1&&(i/=t,e/=t),[i,e]}var Sf=[0,0],ur=[0,0];function M_(i){if(Q.open||xt.open)return ur[0]=ur[1]=0,ur;let e=MyPC.gamepad,t=e?e.axis(0):0,n=e?e.axis(1):0,s=e?e.axis(2):0;Math.hypot(t,n)<.18&&(t=0,n=0),Math.abs(s)<.2&&(s=0);let r=s*Math.abs(s)+(ct.right?1:0)-(ct.left?1:0);_s+=r*2.4*i,!t&&!n&&(t=(ut.right?1:0)-(ut.left?1:0),n=(ut.down?1:0)-(ut.up?1:0));let o=-n+(ct.up?1:0)-(ct.down?1:0),a=t,l=Math.sin(_s),h=-Math.cos(_s),c=l*o-h*a,u=h*o+l*a,d=Math.hypot(c,u);return d>1&&(c/=d,u/=d),Vh[0]=c,Vh[1]=u,Vh}var Vh=[0,0],xt=new No(document.getElementById("wheel")),S_=["use","eat","drink","sleep","build","place","bag","camera"],w_={use:"\u270B",eat:"\u{1F356}",drink:"\u{1F4A7}",sleep:"\u{1F6CF}",build:"\u{1F528}",place:"\u{1F9F1}",bag:"\u{1F392}",camera:"\u{1F3A5}"},A_={use:"qUse",eat:"qEat",drink:"qDrink",sleep:"qSleep",build:"aBuild",place:"qPlace",bag:"qBag",camera:"qCamera"};function cu(i,e){if(!(Tt!=="world"||Q.open||ht)){if(i){if(xt.open){e||xt.close();return}if(je!=="play"||!Ti())return;ct.left=ct.right=ct.up=ct.down=!1,ut.left=ut.right=ut.up=ut.down=!1,pr=!1;let t=S_.map(n=>({id:n,icon:w_[n],label:n==="place"?T_():P(A_[n])}));xt.show(t,e,P(e?"wheelHelp":"wheelRemote"));return}if(!(!e||!xt.hold)){if(xt.sel<0&&performance.now()-xt.openedAt<350){xt.hold=!1;return}fl(xt.close())}}}function ep(){let i=at?.inv??{};for(let e of ya)if((i[e]??0)>0)return e;return null}function T_(){let i=ep();return i?we("cPut",Xt(i)):P("qPlace")}function fl(i){if(i){if(i==="camera"){pl();return}if(i==="bag"){Qn("bag");return}if(i==="place"){let e=ep();e?Xe({t:Te.Do,a:"build",text:`${e}@${dl().toFixed(3)}`}):De(P("qNothing"),2e3);return}bi(i,!0)}}function pl(i){Jn=i??$o[($o.indexOf(Jn)+1)%$o.length],MyPC.save("cam",Jn);let e=Ai();Jn!=="top"&&e>=0&&(_s=Math.PI-qi[e]),ae&&(ae.yaw=_s),Xn=!0,De(`${P("sCamera")}: ${tp(Jn)}`,1500),yr(),ni()}function tp(i){return P(i==="top"?"camTop":i==="third"?"camThird":"camFirst")}function E_(i,e){let[t,n]=ae&&ae.view!=="top"?M_(i):Qf();if(Ms){Math.hypot(t,n)>.35&&(Ss=Math.atan2(n,t)),t=n=0;let v=Ai();v>=0&&(jn=eu(pn?qt:Ot[v],pn?$t:Gt[v],Ss,22,.14))}Sf[0]=t,Sf[1]=n;let s=pr&&!Q.open,r=Ai();if(r<0)return;pn||(qt=Ot[r],$t=Gt[r],yi=_i=0,pn=!0);let o=s?jo.run:jo.walk,a=t*o,l=n*o,h=a-yi,c=l-_i,u=Math.hypot(h,c),d=8*i,m=u>d?d/u:1;yi+=h*m,_i+=c*m;let g=qt+yi*i;Mf(g,$t)?yi=0:qt=g;let x=$t+_i*i;Mf(qt,x)?_i=0:$t=x;let p=Math.abs(yi)+Math.abs(_i)>.01;Math.abs(yi)+Math.abs(_i)>.3&&(ra=Math.atan2(_i,yi));let f=Math.round(t*50)/50,S=Math.round(n*50)/50;((f!==Xo||S!==qo)&&(e-Bo>50||!f&&!S||!Xo&&!qo)||s!==gf||(p||Pf)&&e-Bo>100)&&(Xo=f,qo=S,gf=s,Bo=e,Pf=p,Xe({t:Te.Input,mx:f,my:S,run:s,seq:++ul,x:Math.round(qt*100)/100,y:Math.round($t*100)/100}));let w=Math.min(.5,(e-il)/1e3+sl/2e3),y=Ot[r]+$h[r]*w,L=Gt[r]+Yh[r]*w,C=y-qt,A=L-$t,E=Math.hypot(C,A);if(E>3)qt=y,$t=L,yi=_i=0;else if(!p&&!f&&!S&&E>.4&&e-Bo>600){let v=1-Math.exp(-i*2);qt+=C*v,$t+=A*v}}function np(){if(!Dn)return;let i=Dn.maps.findIndex(e=>e.id===Bt);hr(Dn.maps[(i+1)%Dn.maps.length].id),MyPC.announce?.(oa(Bt))}function ol(i){if(ae){if(ae.view==="third"){ae.back=Math.max(3.5,Math.min(14,ae.back*i)),MyPC.save("back",ae.back);return}ae.view!=="first"&&(ae.dist=Math.max(12,Math.min(70,ae.dist*i)),MyPC.save("dist",ae.dist))}}function nu(){let i=-1,e=1/0,t=-1,n=1/0,s=vt>=0?Wn.get(vt)??-1:-1,r=s>=0?Math.hypot(Ot[s]-Mn,Gt[s]-Sn):-1;for(let a=0;a<yt;a++){if(Vt[a]===-1||Pt[a]!==Dt.Agent&&Pt[a]!==Dt.Player||a===s||Vt[a]===Ei)continue;let l=Math.hypot(Ot[a]-Mn,Gt[a]-Sn);l<e&&(e=l,i=a),l>r&&l<n&&(n=l,t=a)}let o=s>=0&&t>=0?t:i;if(o>=0&&(s<0||t>=0)){vt=Vt[o],MyPC.announce?.(`${P("following")} #${vt&65535}`);return}Xe({t:Te.Who,map:Bt})}var C_=0;function R_(i){let e=i.filter(n=>n[0]!==Ei);if(!e.length){De(P("nobody"));return}let t=e[C_++%e.length];Mn=t[1],Sn=t[2],vt=t[0],jh=performance.now(),Xn=!0,ni(),MyPC.announce?.(`${P("following")} #${vt&65535}`)}function P_(){let[i,e]=Qf();if(i||e){vt=-1;let t=(ae?.dist??24)/24*.35;Mn=Math.max(0,Math.min(ou,Mn+i*t)),Sn=Math.max(0,Math.min(lu,Sn+e*t))}if(vt>=0){let t=Wn.get(vt);t!==void 0?(Mn=Ot[t],Sn=Gt[t],jh=performance.now()):performance.now()-jh>4e3&&(vt=-1)}}function I_(i){if(je=i,MyPC.save("how",i),ip(),yr(),i==="play")Xe({t:Te.Join}),pn=!1,Xn=!0;else{Xe({t:Te.Input,mx:0,my:0,run:!1,seq:++ul});let e=Ai();e>=0&&(Mn=Ot[e],Sn=Gt[e])}}async function hu(){let i=MyPC.text?.keyboard?await MyPC.text.keyboard({value:Gn,kind:"url",label:P("serverLabel"),ok:"OK"}):window.prompt(P("serverLabel"),Gn);i===null||!i.trim()||(Gn=i.trim(),MyPC.save("server",Gn),Xi=0,gr())}function L_(){Si=null,MyPC.save("auth",null),Xi=0,gr()}function ip(){MyPC.setMenu([{id:"game",label:P("gameMenuItem")},{id:"server",label:P("menuServer")}])}function yr(){let i=r=>{if(xs){let a=gt.pad[r];return a===void 0?"":String(MyPC.gamepad?.label?.(a)??MyPC.gamepad?.name?.(a)??a)}let o=gt.remote[r];return o?Qr(o):""},e=(r,o)=>{let a=i(r);return a?`${a}: ${o}`:""},n=je==="play"&&Jn!=="top"?`${P("hMove")}: ${xs?"stick":"\u2191 \u2193"} \xB7 ${P("hTurn")}: ${xs?"R stick":"\u2190 \u2192"}`:`${P("hMove")}: ${xs?"stick":"\u2190 \u2191 \u2192 \u2193"}`,s=je==="play"?[n,e("use",Qt("use").replace(/ \(.*\)$/,"")),e("talk",Qt("talk")),e("attack",Qt("attack")),e("aim",Qt("aim").replace(/ \(.*\)$/,"")),e("run",Qt("run")),e("wheel",P("aWheel").replace(/ \(.*\)$/,"")),e("build",Qt("build")),e("menu",Qt("menu"))]:[n,e("use",P("wFollow")),e("eat",P("wMap")),e("sleep",P("wCard")),e("menu",Qt("menu"))];xs||s.push(P("hintMenu")),Ff.textContent=s.filter(Boolean).join(" \xB7 ")}function uu(i){let e=xr(),t=vr(),n=-1,s=i;for(let r=0;r<yt;r++){if(Vt[r]===-1||Pt[r]!==Dt.Agent)continue;let o=Math.hypot(Ot[r]-e,Gt[r]-t);o<s&&(s=o,n=Vt[r])}return n}function bi(i,e){if(i==="run"){pr=e;return}if(i==="aim"){sp(e);return}if(!(!e||Tt!=="world")){switch(i){case"menu":Qn();return;case"zoomIn":ol(1/1.2);return;case"zoomOut":ol(1.2);return;case"thoughts":Ln=!Ln,MyPC.save("thoughts",Ln),Ln||bs.hide(),De(`${P("sThoughts")}: ${P(Ln?"on":"off")}`,1500);return;case"person":Qn("person");return;case"camera":je==="play"&&pl();return;case"wheel":cu(!0,!1);return;case"build":je==="play"&&Qn("build");return}if(je==="watch"){i==="use"?nu():i==="eat"?np():i==="sleep"&&Qn("person");return}if(Ti()){if(i==="use"){Xe({t:Te.Do,a:"take"});return}if(i==="attack"){D_();return}if(i==="talk"){if(uu(3.5)<0){De(P("dNobodyNear"),2e3);return}if(Xe({t:Te.Do,a:"hold"}),ct.left=ct.right=ct.up=ct.down=!1,ut.left=ut.right=ut.up=ut.down=!1,pr=!1,N_()){k_();return}rp();return}Xe({t:Te.Do,a:i})}}}function D_(){let i=at?.inv??{},e=(i.bow??0)>0&&(i.arrows??0)>0,t=xr(),n=vr(),s=dl();if(Ms){if(!e){De(P((i.bow??0)>0?"noArrows":"noBow"),3500);return}let o=jn>=0&&Vt[jn]!==-1?Math.atan2(Gt[jn]-n,Ot[jn]-t):Ss;Xe({t:Te.Do,a:"shoot",text:o.toFixed(3)});return}if(eu(t,n,s,2.6,1.2)<0&&e){let o=eu(t,n,s,20,.45);if(o>=0){Xe({t:Te.Do,a:"shoot",text:Math.atan2(Gt[o]-n,Ot[o]-t).toFixed(3)});return}}Xe({t:Te.Do,a:"hit",text:s.toFixed(3)})}function sp(i){if(i!==Ms&&!(i&&(je!=="play"||!Ti()||Q.open||Tt!=="world")))if(Ms=i,i){Ss=Number.isFinite(ra)?ra:dl();let e=at?.inv??{};(e.bow??0)<1?De(P("noBow"),3500):(e.arrows??0)<1?De(P("noArrows"),3500):De(we("aimOn",ll("attack")),2500)}else jn=-1,ae?.aim(!1)}function ll(i){if(xs){let t=gt.pad[i];return t===void 0?"":String(MyPC.gamepad?.label?.(t)??MyPC.gamepad?.name?.(t)??t)}let e=gt.remote[i];return e?Qr(e):""}var U_={},Mi=i=>i.charAt(0).toUpperCase()+i.slice(1);function Xt(i){let e=va.includes(i)||i==="meat"?"r"+Mi(i):Uu.includes(i)?"an"+Mi(i):"x"+Mi(i),t=P(e);return t===e?i:t}function ta(i){return Object.entries(i).map(([e,t])=>`${t} ${Xt(e)}`).join(" + ")}function wf(i){return i?Object.entries(i).filter(([,e])=>e>0).map(([e,t])=>`${t} ${Xt(e)}`).join(", "):""}function zo(i){return P("k"+Mi(i))}var Yo=!1;function N_(){try{return(MyPC.apiLevel??0)>=24&&!!MyPC.stt?.enabled?.()}catch{return!1}}var Af="",Tf=0;function iu(i){let e=(i??"").trim(),t=performance.now();e&&e===Af&&t-Tf<3e3||(Af=e,Tf=t,su(e))}function su(i){let e=(i??"").trim();Xe(e?{t:Te.Do,a:"talk",text:e.slice(0,300)}:{t:Te.Do,a:"talk"})}function rp(){if(!MyPC.text?.keyboard){su("");return}MyPC.text.keyboard({value:"",kind:"text",label:P("sayLabel"),ok:"OK"}).then(i=>su(i))}function F_(){let i=new Set;on?.name&&i.add(on.name);for(let[,e]of ys??[])i.add(e);return[...i].slice(0,30)}function k_(){if(Yo){MyPC.stt.stop?.();return}Yo=!0,De(P("listening"),0),MyPC.stt.listen({maxSeconds:10,hint:F_()}).then(i=>{ei.hidden=!0,iu(i.text)}).catch(i=>{ei.hidden=!0,!(i?.code==="nothing"||i?.code==="cancelled")&&rp()}).finally(()=>{Yo=!1})}function B_(i){if(Yo){iu(i.text);return}if(Tt!=="world"||!Ti()||ht||uu(2.8)<0){De(`\u201C${i.text}\u201D`,2500);return}Xe({t:Te.Do,a:"hold"}),iu(i.text)}function O_(i){let e=i;if(e.me&&(en=e.me,Q.open&&(Q.page==="me"||Q.page==="rules"||Q.page==="look")&&Q.refresh(),!en.chose&&je==="play"&&Tt==="world"&&!Q.open&&(In.sex=en.sex,In.skin=en.skin,Qn("look"))),i.code==="mine")return;let t={looked:"looked",sexPregnant:"sexPregnant",autoOn:"autoOn",autoOff:"autoOff",ruleAdded:"ruleAdded",ruleRemoved:"ruleRemoved",rulesFull:"rulesFull",built:"built",needHut:"needHut",expecting:"expecting",tooFar:"tooFar"};if(t[i.code]){De(P(t[i.code]),3e3),i.code==="looked"&&Q.page==="look"&&Q.back();return}if(i.code==="sexWeek"){De(we("sexWeek",String(e.days??7)),3500);return}if(i.code==="partners"){De(we("partners",i.name??""),4e3);return}if(i.code==="why"){De(e.why??"",4e3);return}if(i.code==="replays"){gs=i.list,Q.page==="past"&&Q.refresh();return}if(i.code==="replay"){b_(i.rec);return}if(i.code==="noReplay"){De(P("pastNone"),2500);return}if(i.code==="roster"){ys=i.list??[],Q.page==="goto"&&Q.refresh();return}if(i.code==="tp"){qt=Mn=i.x??qt,$t=Sn=i.y??$t,Xn=!0,ni(),De(we("dTp",i.name??""),3e3);return}let n=i,s=n.left!==void 0?" "+we("arrowsLeft",String(n.left)):"";if(i.code==="zHit"||i.code==="zKilled"){De(P(i.code)+s,1800);return}if(i.code==="swing"){De(P("dSwing"),1200);return}if(i.code==="noBow"||i.code==="noArrows"){De(P(i.code),3500);return}if(i.code==="missed"){De(we("missed",String(n.left??0)),1800);return}if(i.code==="buildNeed"){De(we("buildNeed",ta(n.need??{})),3500);return}if(n.kept){De(P("bKept"),3500);return}if(i.code==="aHit"){De(we("aHit",Xt(i.item??""))+s,1500);return}if(i.code==="aKilled"){De(we("aKilled",Xt(i.item??""),wf(n.got)),3500);return}if(i.code==="chopped"||i.code==="mined"){De(we("dGot",wf(n.got)),1500);return}if(i.code==="crafted"){for(let l of Object.keys(kt))delete kt[l];De(we("dCrafted",Xt(i.item??"")),2500),Q.refresh();return}if(i.code==="placed"){De(we("dPlaced",Xt(i.item??"")),2500);return}let r={noRecipe:"dNoRecipe",noMat:"dNoMat",noRoom:"dNoRoom",noItem:"dNoItem",tooThick:"dTooThick"};if(r[i.code]){De(P(r[i.code]),2800);return}if(i.code==="wait")return;if(i.code==="full"&&i.a==="craft"){De(P("dBagFull"),2500);return}let a={drank:"dDrank",picked:"dPicked",ate:"dAte",sleep:"dSleep",wake:"dWake",noWater:"dNoWater",nothing:"dNothing",noFood:"dNoFood",full:"dFull",talk:"dTalk",nobody:"dNobody"}[i.code];a&&De(a==="dPicked"?we("dPicked",U_[i.item??""]??i.item??""):P(a),2500)}var ru="";function la(){let i="";Tt==="world"&&!Q.open&&(je==="play"&&at?i=`<div class="pn">${rt(al())}</div><div class="pbars">${bn(P("nFood"),at.hunger)}${bn(P("nWater"),at.thirst)}${bn(P("nRest"),at.tired)}${at.hp!==void 0&&at.hp<100?bn(P("nHp"),100-at.hp):""}</div><div class="pa">${at.asleep?Yi(5):""}${at.carry?(at.asleep?" \xB7 ":"")+we("carry",String(at.carry)):""}</div>`:je==="watch"&&vt>=0&&on&&on.id===vt&&(i=Hh(on,Yi,!1))),i!==ru&&(ru=i,Wh.innerHTML=i,Wh.hidden=!i)}function du(){return je==="watch"?vt:uu(10)}function Gh(i){return P(i?"on":"off")}function z_(i){let e=gt.pad[i],t=gt.remote[i];return`${e===void 0?P("cNone"):String(MyPC.gamepad?.label?.(e)??MyPC.gamepad?.name?.(e)??e)} \xB7 ${t?Qr(t):P("cNone")}`}function H_(i){let e=[];switch(i){case"root":return e.push({id:"resume",label:P("mResume")}),je==="play"&&e.push({id:"me",label:P("mMe"),sub:!0},{id:"actions",label:P("mActions"),sub:!0},{id:"build",label:P("bTitle"),sub:!0},{id:"bag",label:P("mBag"),sub:!0},{id:"fight",label:P("mFight"),sub:!0},{id:"goto",label:P("mGoTo"),sub:!0}),du()>=0&&e.push({id:"person",label:je==="play"?P("mNearby"):P("mPerson"),sub:!0}),je==="watch"&&e.push({id:"next",label:P("mNextPerson")},{id:"map",label:P("mNextMap")}),e.push({id:"past",label:P("mPast"),sub:!0}),e.push({id:"how",label:P(je==="play"?"mWatch":"mPlay")}),e.push({id:"settings",label:P("mSettings"),sub:!0},{id:"controls",label:P("mControls"),sub:!0}),{id:i,title:P("mTitle"),rows:e};case"build":{let t=at?.inv??{},n=(t.wood??0)>=12&&(t.stone??0)>=4;e.push({id:"b:hut",label:P("bHut"),value:n?P("cHave"):P("bMissing"),dim:!n});for(let r of ya){let o=Es.find(h=>h.what===r),a=t[r]??0,l=!!o&&Object.entries(o.need).every(([h,c])=>(t[h]??0)>=c);e.push({id:"b:"+r,label:`${Mi(Xt(r))}${o?" ("+ta(o.need)+")":""}`,value:a?we("bInBag",String(a)):l?P("cHave"):P("bMissing"),dim:!a&&!l})}let s=va.filter(r=>(t[r]??0)>0).map(r=>`${t[r]} ${Xt(r)}`).join(", ");return{id:i,title:P("bTitle"),rows:e,wide:!0,html:`<p>${rt(P("bHelp"))}</p>${s?`<p class="dim">${rt(P("fHave"))}: ${rt(s)}</p>`:""}`}}case"fight":{let t=a=>{let l=Es.find(h=>h.what===a);return l?ta(l.need):"\u2014"},n=at?.inv??{},s=[P("fightHelp"),we("fFists","15")];for(let[a,l]of Object.entries(Du))s.push(we("fWeapon",Mi(Xt(a)),String(l),t(a)));s.push(we("fBow",t("bow"),t("arrows")),P("fArmour"),P("fTips"));let r=`${Qt("attack")}: <b>${rt(ll("attack")||P("cNone"))}</b> \xB7 ${rt(Qt("aim"))}: <b>${rt(ll("aim")||P("cNone"))}</b>`,o=["sword","spear","axe","bow","arrows","clothes","armor","helmet"].filter(a=>(n[a]??0)>0).map(a=>`${n[a]} ${Xt(a)}`).join(", ");return e.push({id:"craft",label:P("mCraft"),sub:!0},{id:"back",label:P("mBack")}),{id:i,title:P("mFight"),rows:e,wide:!0,html:`<p>${r}</p>${s.map(a=>`<p>${rt(a)}</p>`).join("")}${o?`<p class="dim">${rt(P("fHave"))}: ${rt(o)}</p>`:""}`}}case"actions":for(let t of["use","talk","attack","drink","eat","pickup","sleep"])e.push({id:t,label:Qt(t)});return{id:i,title:P("mActions"),rows:e,html:at?`<div class="pbars">${bn(P("nFood"),at.hunger)}${bn(P("nWater"),at.thirst)}${bn(P("nRest"),at.tired)}</div>`:void 0};case"past":for(let t of gs??[])e.push({id:"r"+t.id,label:`${zh(t.start,P("day"))} \xB7 ${t.people.join(", ")||"\u2014"}`,value:`${t.zombies} ${P("pastZ")} \xB7 ${t.secs} s${t.deaths.length?" \xB7 \u271D "+t.deaths.join(", "):t.killed?" \xB7 "+we("pastKilled",String(t.killed)):""}`});return gs&&!gs.length&&e.push({id:"back",label:P("mBack")}),{id:i,title:P("mPast"),rows:e,wide:!0,text:gs?gs.length?P("pastHelp"):P("pastNone"):"\u2026"};case"bag":{let t=at?.inv??{},n=Object.entries(t).filter(([,r])=>r>0),s=(n.length?`<div class="bag">${n.map(([r,o])=>`<span class="bi"><b>${o}</b> ${rt(Xt(r))}</span>`).join("")}</div>`:`<p>${rt(P("bagEmpty"))}</p>`)+`<p class="dim">${at?.weapon?rt(we("cWeapon",Xt(at.weapon)))+" \xB7 ":""}${rt(we("cDefence",String(at?.def??0)))}${at?.carry?" \xB7 "+rt(we("carry",String(at.carry))):""}</p>`;e.push({id:"craft",label:P("mCraft"),sub:!0},{id:"guide",label:P("mGuide"),sub:!0});for(let r of ya)(t[r]??0)>0&&e.push({id:"pl:"+r,label:we("cPut",Xt(r)),value:String(t[r])});return{id:i,title:P("mBag"),rows:e,html:s,wide:!0}}case"craft":for(let t of Lu)e.push({id:"c:"+t,label:zo(t),sub:!0});return{id:i,title:P("mCraft"),rows:e,text:P("catHelp")};case"cat":{let t=at?.inv??{};for(let o of va){let a=t[o]??0;!a&&!kt[o]||e.push({id:"r:"+o,label:Mi(Xt(o)),value:`${kt[o]??0} / ${a}`})}let n=_l(fn,kt),s=Object.entries(kt).filter(([,o])=>o>0);e.push({id:"make",label:`${P("cMake")}: ${n?Mi(Xt(n.what))+(n.n&&n.n>1?" x"+n.n:""):P("cNoRecipe")}`,dim:!n}),e.push({id:"clear",label:P("cClear")},{id:"guide",label:P("mGuide"),sub:!0});let r=`<p>${rt(s.length?we("cIn",ta(kt)):P("cNothingIn"))}</p><p class="dim">${rt(P("catHelp"))}</p>`;return{id:i,title:zo(fn),rows:e,html:r}}case"guide":{let t=at?.inv??{};return Es.forEach((n,s)=>{if(fn&&n.cat!==fn)return;let r=Object.entries(n.need).every(([o,a])=>(t[o]??0)>=a);e.push({id:"g:"+s,label:`${fn?"":zo(n.cat)+" \xB7 "}${Mi(Xt(n.what))}${n.n&&n.n>1?" x"+n.n:""}`,value:`${ta(n.need)}${r?" "+P("cHave"):""}`})}),{id:i,title:fn?`${P("mGuide")} \xB7 ${zo(fn)}`:P("mGuide"),rows:e,wide:!0,text:P("guideHelp")}}case"goto":for(let[t,n,s]of ys??[])e.push({id:"p"+t,label:n,value:s});return ys&&!ys.length&&e.push({id:"back",label:P("mBack")}),{id:i,title:P("mGoTo"),rows:e,text:ys?P("mGoToHelp"):"\u2026"};case"me":{let t=en;if(!t)return{id:i,title:P("meTitle"),rows:[{id:"back",label:P("mBack")}],text:"\u2026"};let n=t.traits,s=`<div class="pm"><b>${rt(t.name)}</b> \xB7 ${rt(P(t.sex==="f"?"lookWoman":"lookMan"))} \xB7 ${rt(we("meHp",String(t.hp)))}</div><div class="pm">${we("pLevel",String(t.level),String(t.xp))}</div><div class="bp"><i style="width:${Math.max(4,Math.min(100,(t.xp-50*t.level*t.level)/Math.max(1,50*(t.level+1)**2-50*t.level*t.level)*100))}%"></i></div>`+(t.goal?`<div class="pm">${P("pGoal")}: <b>${rt(t.goal.text)}</b> \xB7 ${Math.min(t.goal.k+1,t.goal.n)}/${t.goal.n}</div><div class="bp${t.goal.from!=="myself"?" ord":""}"><i style="width:${Math.max(6,t.goal.pct)}%"></i></div>`:"")+`<div class="pm">${P("mePartner")}: <b>${rt(t.partner?.name??P("meNone"))}</b></div><div class="pm">${P("meChildren")}: <b>${t.children.length?t.children.map(r=>`${rt(r.name)} (${r.age})`).join(", "):rt(P("meNone"))}</b></div>`+(t.expecting>=0?`<div class="pm">${rt(we("meExpecting",String(t.expecting)))}</div>`:"")+`<div class="pm dim">${rt(we("meTraits",String(n.strength??0),String(n.speed??0),String(n.intelligence??0),String(n.courage??0),String(n.empathy??0)))}</div>`+(t.goals.length?`<div class="pm dim">${P("meGoals")}: ${t.goals.map(r=>`${r.ok?"\u2713":"\u2717"} ${rt(r.text)} (+${r.xp})`).join(" \xB7 ")}</div>`:"");return e.push({id:"look",label:P("lookTitle"),sub:!0},{id:"auto",label:P("autoRow"),value:Gh(t.auto)},{id:"rules",label:P("myRules"),value:`${t.rules.length} / ${t.max}`,sub:!0},{id:"hut",label:P("meHut")}),{id:i,title:P("meTitle"),rows:e,html:s,wide:!0}}case"look":{e.push({id:"f",label:P("lookWoman"),value:In.sex==="f"?"\u25CF":""},{id:"m",label:P("lookMan"),value:In.sex==="m"?"\u25CF":""});for(let n=0;n<5;n++)e.push({id:"s"+n,label:`${P("lookSkin")} ${n+1}`,value:In.skin===n?"\u25CF":""});e.push({id:"save",label:P("lookSave")});let t=rl.map((n,s)=>`<span class="sw${In.skin===s?" on":""}" style="background:#${n.getHexString()}"></span>`).join("");return{id:i,title:P("lookTitle"),rows:e,html:`<p>${rt(en&&!en.chose?P("lookHelp"):P("lookSexNote"))}</p><div class="sws">${t}</div>`}}case"rules":return(en?.rules??[]).forEach((t,n)=>e.push({id:"r"+n,label:t,value:"\u2715"})),(en?.rules.length??0)<(en?.max??5)&&e.push({id:"add",label:P("ruleAdd")}),{id:i,title:P("myRules"),rows:e,wide:!0,text:`${we("ruleHelp",String(en?.max??5))} ${P("autoHelp")}`};case"person":return e.push({id:"back",label:P("mBack")}),je==="play"&&on&&on.id===mr&&(en?.partner?.id===on.id?e.push({id:"child",label:P("tryChild")}):en?.partner||e.push({id:"court",label:P("askPartner")})),je==="watch"&&e.push({id:"next",label:P("mNextPerson")}),{id:i,title:on?.name??P("mPerson"),rows:e,wide:!0,html:on&&on.id===mr?Hh(on,Yi,!0):"\u2026"};case"settings":return aa&&e.push({id:"thoughts",label:P("sThoughts"),value:Gh(Ln)}),je==="play"&&e.push({id:"cam",label:P("sCamera"),value:tp(Jn)}),e.push({id:"gfx",label:P("gTitle"),sub:!0}),e.push({id:"zin",label:P("aZoomIn")},{id:"zout",label:P("aZoomOut")},{id:"server",label:P("sServer"),value:Gn},{id:"unpair",label:P("sUnpair")}),{id:i,title:P("mSettings"),rows:e,text:aa?void 0:P("sThoughtsOnly")};case"gfx":return e.push({id:"q",label:P("gQuality"),value:P(lt.q==="auto"?"gAuto":lt.q==="low"?"gLow":lt.q==="mid"?"gMid":"gHigh")+(lt.q!=="auto"&&lt.q!==wi?" *":"")},{id:"fog",label:P("gFog"),value:P(["gOff","gLight","gNormal","gThick"][lt.fog]??"gNormal")},{id:"dist",label:P("gDist"),value:P(["gNear","gNormal","gFar"][lt.dist]??"gNormal")},{id:"fps",label:P("gFps"),value:Gh(lt.fps)}),lt.q!=="auto"&&lt.q!==wi&&e.push({id:"restart",label:P("gRestart")}),{id:i,title:P("gTitle"),rows:e,text:P("gHelp")};case"controls":for(let t of rr)e.push({id:t,label:Qt(t),value:z_(t)});return e.push({id:"reset",label:P("cReset")}),{id:i,title:P("mControls"),rows:e,text:`${P("cHelp")} ${P("cWatchNote")}`}}return{id:i,title:"",rows:e}}function V_(i,e){if(i==="root")e==="resume"?Q.close():e==="actions"||e==="settings"||e==="controls"?Q.push(e):e==="past"?(gs=null,Xe({t:Te.Do,a:"replays"}),Q.push("past")):e==="bag"||e==="build"||e==="fight"?Q.push(e):e==="me"?(Xe({t:Te.Do,a:"mine"}),Q.push("me")):e==="goto"?(ys=null,Xe({t:Te.Do,a:"roster"}),Q.push("goto")):e==="person"?(ca(du(),!0),Q.push("person")):e==="next"?(Q.close(),nu()):e==="map"?(Q.close(),np()):e==="how"&&(Q.close(),I_(je==="play"?"watch":"play"));else if(i==="actions")Q.close(),bi(e,!0);else if(i==="build")Q.close(),Xe({t:Te.Do,a:"build",text:`${e.slice(2)}@${dl().toFixed(3)}`});else if(i==="fight")e==="back"?Q.back():e==="craft"&&Q.push("craft");else if(i==="past")e==="back"?Q.back():(Q.close(),De("\u2026",1500),Xe({t:Te.Do,a:"replay",text:e.slice(1)}));else if(i==="bag")e==="craft"?(fn="",Q.push("craft")):e==="guide"?(fn="",Q.push("guide")):e.startsWith("pl:")&&(Q.close(),Xe({t:Te.Do,a:"place",text:e.slice(3)}));else if(i==="craft"){fn=e.slice(2);for(let t of Object.keys(kt))delete kt[t];Q.push("cat")}else if(i==="cat"){if(e.startsWith("r:")){let t=e.slice(2),n=at?.inv?.[t]??0;kt[t]=(kt[t]??0)+1>Math.min(n,4)?0:(kt[t]??0)+1,Q.refresh()}else if(e==="clear"){for(let t of Object.keys(kt))delete kt[t];Q.refresh()}else if(e==="guide")Q.push("guide");else if(e==="make"){let t=Object.entries(kt).filter(([,n])=>n>0).map(([n,s])=>`${n}=${s}`).join(",");if(!_l(fn,kt)){De(P("dNoRecipe"),2500);return}Xe({t:Te.Do,a:"craft",text:`${fn}:${t}`})}}else if(i==="guide"){let t=Es[Number(e.slice(2))];if(!t)return;for(let n of Object.keys(kt))delete kt[n];for(let[n,s]of Object.entries(t.need))kt[n]=s;fn===t.cat?Q.back():(fn=t.cat,Q.push("cat"))}else if(i==="goto")e==="back"?Q.back():(Q.close(),Xe({t:Te.Do,a:"tp",text:e.slice(1)}));else if(i==="me")e==="back"?Q.back():e==="look"?(In.sex=en?.sex??"m",In.skin=en?.skin??1,Q.push("look")):e==="auto"?Xe({t:Te.Do,a:"auto",text:en?.auto?"0":"1"}):e==="rules"?Q.push("rules"):e==="hut"&&(Q.close(),Xe({t:Te.Do,a:"hut"}));else if(i==="look")e==="f"||e==="m"?(In.sex=e,Q.refresh()):e==="save"?Xe({t:Te.Do,a:"look",text:`${In.sex}:${In.skin}`}):e.startsWith("s")&&(In.skin=Number(e.slice(1)),Q.refresh());else if(i==="rules")if(e==="add"){if(!MyPC.text?.keyboard)return;MyPC.text.keyboard({value:"",kind:"text",label:P("ruleLabel"),ok:"OK"}).then(t=>{t&&t.trim()&&Xe({t:Te.Do,a:"ruleAdd",text:t.trim().slice(0,200)})})}else e.startsWith("r")&&Xe({t:Te.Do,a:"ruleDel",text:e.slice(1)});else if(i==="person")e==="back"?Q.back():e==="court"?Xe({t:Te.Do,a:"court",text:String(on?.id??-1)}):e==="child"?Xe({t:Te.Do,a:"child"}):e==="next"&&(nu(),window.setTimeout(()=>{ca(vt,!0),Q.refresh()},300));else if(i==="settings")e==="thoughts"?(Ln=!Ln,MyPC.save("thoughts",Ln),Ln||bs.hide(),Q.refresh()):e==="cam"?(pl(),Q.refresh()):e==="gfx"?Q.push("gfx"):e==="zin"?ol(1/1.2):e==="zout"?ol(1.2):e==="server"?(Q.close(),hu()):e==="unpair"&&(Q.close(),L_());else if(i==="gfx"){if(e==="q"){let t=["auto","low","mid","high"];lt.q=t[(t.indexOf(lt.q)+1)%t.length]}else if(e==="fog")lt.fog=(lt.fog+1)%4;else if(e==="dist")lt.dist=(lt.dist+1)%3;else if(e==="fps")lt.fps=!lt.fps,Vo=0,Go=performance.now(),ws.textContent="";else if(e==="restart"){MyPC.save("gfx",lt),location.reload();return}MyPC.save("gfx",lt),kf(),Q.refresh()}else if(i==="controls"){if(e==="reset"){gt=Uo(ar),MyPC.save("binds",gt),Q.refresh(),yr();return}ti=e,De(we("cPress",Qt(ti)),0)}}var Q=new Io(H_,V_,()=>{ti=null,ei.hidden=!0,la(),MyPC.back?.(!1)}),bs=new Lo(8);function Qn(i="root"){if(Tt==="world"){if(xt.close(),sp(!1),ct.left=ct.right=ct.up=ct.down=!1,ut.left=ut.right=ut.up=ut.down=!1,pr=!1,i==="person"){let e=du();if(e<0){De(P("nobody"),2e3);return}ca(e,!0)}Q.show("root"),i!=="root"&&Q.push(i),MyPC.back?.(!0),la()}}function ca(i,e=!1){i<0||(i!==mr&&(mr=i,on=null),(e||performance.now()-vf>1e3)&&(vf=performance.now(),Xe({t:Te.Info,id:i})))}function ap(i,e){let t=ti;ti=null;let n=i==="pad"?gt.pad:gt.remote;for(let r of rr)n[r]===e&&delete n[r];n[t]=e,MyPC.save("binds",gt);let s=i==="pad"?String(MyPC.gamepad?.label?.(e)??e):Qr(e);De(we("cSet",Qt(t),s),2500),Q.refresh(),yr()}var cl=1e3/60,dr=0,lr=0,Zo=0,Ef=0,Cf=0,Rf=0,Pf=!1,Xn=!0;function G_(i){if(Tt==="world"){if(ht){ht.update(cl/1e3);return}xt.open&&xt.hold&&MyPC.gamepad&&xt.aim(MyPC.gamepad.axis(0),MyPC.gamepad.axis(1)),je==="play"?E_(cl/1e3,i):P_()}}function W_(i,e){if(Tt!=="world"||!ae)return;if(y_(),Qh&&Ti()&&pn){Qh=!1;let u=["use","talk","attack","aim","build"].map(d=>`${ll(d)}: ${Qt(d).replace(/ \(.*\)$/,"")}`);De(we("bindsNew",u.join(" \xB7 ")),9e3)}let t=xr(),n=vr();ae.view=ht||!Ti()||!pn?"top":Jn,ae.yaw=_s,ae.follow(t,n,e,Xn),Xn=!1;let s=Ko+(i-Jo)/1e3*ia*sa;ae.setHour(((s/3600+8)%24+24)%24,i/1e3);let r=Math.min(1.25,(i-il)/Jh),o=ae.people,a=Ti()&&pn?Ai():-1,l=i/1e3,h=ae.view==="top"?(ae.dist*1.6+8)*ae.distK:ae.sight+4,c=ae.view==="first";if(tu++,o.begin(),ae.beginShots(),ae.beginItems(),ae.animals.begin(),ht){ht.draw(o,e,Yi),ae.dist+=(Math.max(16,Math.min(42,ht.span*1.1+10))-ae.dist)*Math.min(1,e*2),o.end(),ae.endShots(),ae.endItems(),ae.animals.end(),ae.render(),bs.hide();return}for(let u=0;u<yt;u++){if(Vt[u]===-1)continue;let d=tl[u]+(Ot[u]-tl[u])*r,m=nl[u]+(Gt[u]-nl[u])*r;if(u===a&&(d=qt,m=$t),Math.abs(d-t)>h||Math.abs(m-n)>h)continue;if(Pt[u]===Dt.Projectile){ae.shot(d,m);continue}if(Pt[u]===Dt.Item){ae.item(d,m,el[u],Vt[u]);continue}if(Pt[u]!==Dt.Agent&&Pt[u]!==Dt.Player&&Pt[u]!==Dt.Threat&&Pt[u]!==Dt.Animal)continue;let g=d-Zh[u],x=m-Kh[u],p=Math.hypot(g,x);Zh[u]=d,Kh[u]=m;let f=e>0?Math.min(6,p/e):0;if(or[u]=or[u]+(f-or[u])*Math.min(1,e*10),p>.004){let A=Math.atan2(g,x)-qi[u];A=Math.atan2(Math.sin(A),Math.cos(A)),qi[u]=qi[u]+A*Math.min(1,e*12)}if(ea[u]=(ea[u]+p*4.2)%(Math.PI*2),Xf[u]=d,qf[u]=m,$f[u]=tu,Pt[u]===Dt.Animal){ae.animals.add(Wo[u],d,m,qi[u],ea[u]*1.4,Math.min(1,or[u]/1.6));continue}if(c&&u===a)continue;let S=(Qo[u]&(Mr.Sleeping|Mr.Dead))!==0,w=Pt[u]===Dt.Threat,y=u===a||Vt[u]===Ei,L=w?Yf:Wo[u]>0&&(Pt[u]===Dt.Player||Pt[u]===Dt.Agent)?h_(y,Wo[u]):y?Zf:Pt[u]===Dt.Player?Kf:zf[u];o.add(d,m,qi[u],ea[u],Math.min(1,or[u]/(w?1.2:2.2)),L,S,Qo[u]&Mr.Child?.62:1,w),Pt[u]===Dt.Player&&!(u===a&&ae.view!=="top")?o.marker(d,m,l,Vt[u]===Ei?yf:c_):Vt[u]===vt&&o.marker(d,m,l,yf)}if(o.end(),ae.endShots(),ae.endItems(),ae.animals.end(),Ms&&a>=0){let u=jn>=0&&Vt[jn]!==-1?jn:-1,d=u>=0?Math.atan2(Gt[u]-$t,Ot[u]-qt):Ss;ae.aim(!0,qt,$t,d,u>=0?Math.max(1,Math.hypot(Ot[u]-qt,Gt[u]-$t)-.6):22,u>=0?Ot[u]:NaN,u>=0?Gt[u]:NaN)}else ae.aim(!1);ae.render(),aa&&Ln&&!Q.open&&i-Gf<4e3?bs.draw(X_,q_,t,n,Yi):bs.hide()}function X_(i,e){let t=Wn.get(i);return t===void 0||$f[t]!==tu?!1:(e.x=Xf[t],e.y=qf[t],!0)}var q_=(i,e,t)=>!!ae&&ae.project(i,2.2,e,t);function op(i){dr=requestAnimationFrame(op),lr||(lr=i);let e=Math.min(.1,(i-lr)/1e3);for(Zo+=Math.min(250,i-lr),lr=i;Zo>=cl;)G_(i),Zo-=cl;(!Q.open||i-ko>100)&&(W_(i,i-ko>200?e:Math.min(.1,(i-ko)/1e3)),ko=i,Vo++),lt.fps&&i-Go>500&&(ws.textContent=`${Math.round(Vo*1e3/(i-Go))} fps \xB7 ${Math.round(sl)} ms`,Vo=0,Go=i),i-Ef>250&&(Ef=i,ni()),i-Rf>3e3&&(Rf=i,Xe({t:Te.Ping,c:i})),i-Cf>500&&Tt==="world"&&(Cf=i,$_(i),je==="watch"&&vt>=0?ca(vt):Q.open&&Q.page==="person"&&ca(mr),la())}var If="";function $_(i){let e=Ko+(i-Jo)/1e3*ia*sa,t=Math.floor((e/3600+8)/24)+1,n=Math.floor((e/3600+8)%24),s=Math.floor(e/60%60),r=vt>=0?Wn.get(vt):void 0,o=je==="play"?al():vt>=0?`${P("following")} #${vt&65535}${r!==void 0?" \xB7 "+Yi(el[r]):""}`:P("free"),a=`${oa(Bt)} \xB7 ${P("day")} ${t} ${String(n).padStart(2,"0")}:${String(s).padStart(2,"0")} \xB7 ${Of} ${P("agents")} \xB7 ${o}`;if(a!==If&&(If=a,Nf.textContent=a),hl&&je==="play"){let l=Math.max(0,Math.ceil((Hf-e)/Math.max(.01,ia*sa)));ei.textContent=`${we("travelling",oa(Vf))} ${l} s`,ei.hidden=!1}}function au(){let i=Math.min(1,Math.min(1920/innerWidth,1080/innerHeight,window.devicePixelRatio||1))*(wi==="low"?.6:wi==="mid"?.8:1);ae?.resize(Math.round(innerWidth*i),Math.round(innerHeight*i))}function Lf(){dr||(lr=0,Zo=0,dr=requestAnimationFrame(op))}function Df(){dr&&cancelAnimationFrame(dr),dr=0,ct.left=ct.right=ct.up=ct.down=!1,ut.left=ut.right=ut.up=ut.down=!1,pr=!1,je==="play"&&Xe({t:Te.Input,mx:0,my:0,run:!1,seq:++ul}),Xo=qo=0}var lp={left:1,right:1,up:1,down:1};function cp(i,e,t,n=!1){if(ht&&!Q.open){e&&(i==="left"||i==="right"?ht.seek(i==="left"?-5:5):t||ht.faster(i==="up"));return}if(Q.open){e&&(i==="up"||i==="down")&&Q.input(i);return}if(xt.open){e&&!t&&xt.step(i);return}t||(n?ut[i]=e:ct[i]=e)}var ut={left:!1,right:!1,up:!1,down:!1};function fu(){Tt==="noserver"||Tt==="offline"?hu():Tt==="pairfail"&&(Xi=0,Tt="connect",gr())}function Y_(i,e,t){if(i in lp){cp(i,e,t);return}if(ti){e&&!t&&ap("remote",i);return}if(Tt!=="world"){e&&i==="ok"&&fu();return}if(ht&&!Q.open){e&&!t&&i==="ok"&&ht.toggle();return}if(Q.open){if(!e||t)return;i==="ok"?Q.input("ok"):ms(gt,i)==="menu"&&Q.close();return}let n=ms(gt,i);if(xt.open){if(!e||t)return;i==="ok"?fl(xt.close()):(n==="wheel"||n==="menu")&&xt.close();return}if(n==="wheel"){t||cu(e,!1);return}n&&!t&&bi(n,e)}function Z_(i,e){if(i>=12&&i<=16)return;if(ti){e&&ap("pad",i);return}if(Tt!=="world"){e&&i===0&&fu();return}if(ht&&!Q.open){e&&(i===0?ht.toggle():(i===1||jr(gt,i)==="menu")&&jf());return}if(Q.open){if(!e)return;i===0?Q.input("ok"):i===1?Q.input("back"):jr(gt,i)==="menu"&&Q.close();return}let t=jr(gt,i);if(t==="wheel"){cu(e,!0);return}if(xt.open){if(!e)return;i===0?fl(xt.close()):(i===1||t==="menu")&&xt.close();return}t&&bi(t,e)}MyPC.init({keys:["channel","buttons"],ownMenu:!0,onInit(i){rf(i.lang),document.documentElement.lang=i.lang,document.documentElement.dir=i.lang==="ar"?"rtl":"ltr",wi=i.quality?.tier??"mid",lt={...lt,...MyPC.load("gfx",{})},lt.q!=="auto"&&(wi=lt.q);let e=new URLSearchParams(location.search);(e.get("tier")==="low"||e.get("tier")==="mid"||e.get("tier")==="high")&&(wi=e.get("tier"));let t=MyPC.app_config??{};Si=MyPC.load("auth",null);let n=/github\.io$/i.test(location.hostname)?"":location.origin;Gn=String(e.get("server")||t.server||MyPC.load("server","")||Si?.server||n),je=MyPC.load("how","play")==="watch"?"watch":"play",e.get("watch")!==null&&(je="watch");let s=MyPC.load("binds",null);if(s&&s.pad&&s.remote&&(s.v??1)<Do)gt=Uo(ar),MyPC.save("binds",gt),Qh=!0;else if(s&&s.pad&&s.remote){gt={pad:{...s.pad},remote:{...s.remote},v:Do};for(let o of rr){let a=ar.pad[o],l=ar.remote[o];!(o in s.pad)&&a!==void 0&&jr(gt,a)===void 0&&(gt.pad[o]=a),!(o in s.remote)&&l!==void 0&&ms(gt,l)===void 0&&(gt.remote[o]=l)}}let r=MyPC.load("cam","top");Jn=$o.includes(r)?r:"top",Ln=MyPC.load("thoughts",!0)!==!1,window.addEventListener("resize",au),ip(),MyPC.gamepad&&(MyPC.gamepad.on("pads",o=>{xs=o.length,s_=!o.length,yr()}),MyPC.gamepad.on("button",(o,a)=>Z_(o,a))),MyPC.buttons?.on?.((o,a,l)=>Y_(o,a,!!l)),(MyPC.apiLevel??0)>=24&&MyPC.stt?.on&&MyPC.stt.on("text",B_),e.get("dev")!==null&&(window.__dev={act:(o,a=!0)=>bi(o,a),aim:()=>({aimOn:Ms,aimAng:Ss,aimLock:jn}),me:()=>[xr(),vr(),Bt],cam:o=>pl(o),dbg:()=>({yaw:_s,camView:Jn,how:je,meId:Ei,meTransit:hl,predOk:pn,predX:qt,predY:$t,camX:Mn,camY:Sn,s:Ai(),sx:Ai()>=0?Ot[Ai()]:null}),look:(o,a)=>{vt=-1,Mn=o,Sn=a,Xn=!0}}),MyPC.ready()},onStart(){let i=Number(MyPC.load("dist",24))||24,e=Number(MyPC.load("back",7))||7;gr(),Lf(),queueMicrotask(()=>{ae&&(ae.dist=i,ae.back=e)}),K_=i},onPause:Df,onResume:Lf,onDestroy(){Df(),clearTimeout(Xh),window.removeEventListener("resize",au),an&&(an.onclose=null,an.close(),an=null),ae?.dispose(),ae=null},onMenu(i){i==="game"?setTimeout(()=>Qn(),50):i==="server"&&hu()},onInput(i,e,t,n){let s=!!n&&/^pad/.test(n);if(i in lp){cp(i,e,t,s);return}if(i==="cancel")return e?ti?(ti=null,De(P("mControls"),800),!0):xt.open?(xt.close(),!0):Q.open?(Q.input("back"),!0):ht&&!s?(jf(),!0):s?!0:Tt!=="world"?!1:(Qn(),!0):s?!0:void 0;if(!(s||i==="jump"||i==="menu"&&s)){if(i==="menu"){e&&(Q.open?Q.close():Qn());return}if(!ti){if(i==="confirm"){if(!e)return;if(Tt!=="world"){fu();return}if(Q.open){Q.input("ok");return}if(xt.open){fl(xt.close());return}if(ht){ht.toggle();return}bi(n==="touch"?"use":ms(gt,"ok")??"use",!0);return}if(!(Tt!=="world"||Q.open)){if(i==="run"){bi("run",e);return}e&&(i==="pageUp"?bi(ms(gt,"chUp")??"zoomIn",!0):i==="pageDown"&&bi(ms(gt,"chDown")??"zoomOut",!0))}}}}});var K_=24;
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2024 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
