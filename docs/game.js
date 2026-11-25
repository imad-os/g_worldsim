var ft={None:0,Agent:1,Projectile:2,Item:3,Prop:4,Threat:5,Player:6,Animal:7,Npc:8},xs={Alive:1,Moving:2,Sleeping:4,Transit:8,Dead:16,Child:32,Small:64,Carried:128},he={Hello:"hi",View:"view",Ping:"ping",Who:"who",Admin:"adm",Pair:"pair",Join:"join",Input:"in",Do:"do",Info:"info",Welcome:"wel",Error:"err",Chunk:"chk",ChunkDrop:"chx",Frame:"frm",Stats:"sts",Pong:"pong",AdminResult:"admr",PairCode:"pairc",Paired:"paired",Notice:"note",You:"you"};function Cd(i){let e=i.length,t=0,n=0;for(;n<e;){let s=i.charCodeAt(n++);if((s&4294967168)===0){t++;continue}else if((s&4294965248)===0)t+=2;else{if(s>=55296&&s<=56319&&n<e){let r=i.charCodeAt(n);(r&64512)===56320&&(++n,s=((s&1023)<<10)+(r&1023)+65536)}(s&4294901760)===0?t+=3:t+=4}}return t}function Wm(i,e,t){let n=i.length,s=t,r=0;for(;r<n;){let a=i.charCodeAt(r++);if((a&4294967168)===0){e[s++]=a;continue}else if((a&4294965248)===0)e[s++]=a>>6&31|192;else{if(a>=55296&&a<=56319&&r<n){let o=i.charCodeAt(r);(o&64512)===56320&&(++r,a=((a&1023)<<10)+(o&1023)+65536)}(a&4294901760)===0?(e[s++]=a>>12&15|224,e[s++]=a>>6&63|128):(e[s++]=a>>18&7|240,e[s++]=a>>12&63|128,e[s++]=a>>6&63|128)}e[s++]=a&63|128}}var qm=new TextEncoder,$m=50;function Xm(i,e,t){qm.encodeInto(i,e.subarray(t))}function Rd(i,e,t){i.length>$m?Xm(i,e,t):Wm(i,e,t)}var Ym=4096;function uc(i,e,t){let n=e,s=n+t,r=[],a="";for(;n<s;){let o=i[n++];if((o&128)===0)r.push(o);else if((o&224)===192){let l=i[n++]&63;r.push((o&31)<<6|l)}else if((o&240)===224){let l=i[n++]&63,h=i[n++]&63;r.push((o&31)<<12|l<<6|h)}else if((o&248)===240){let l=i[n++]&63,h=i[n++]&63,c=i[n++]&63,u=(o&7)<<18|l<<12|h<<6|c;u>65535&&(u-=65536,r.push(u>>>10&1023|55296),u=56320|u&1023),r.push(u)}else r.push(o);r.length>=Ym&&(a+=String.fromCharCode(...r),r.length=0)}return r.length>0&&(a+=String.fromCharCode(...r)),a}var Km=new TextDecoder,Zm=200;function Jm(i,e,t){let n=i.subarray(e,e+t);return Km.decode(n)}function Pd(i,e,t){return t>Zm?Jm(i,e,t):uc(i,e,t)}var ys=class{type;data;constructor(e,t){this.type=e,this.data=t}};var mn=class i extends Error{constructor(e){super(e);let t=Object.create(i.prototype);Object.setPrototypeOf(this,t),Object.defineProperty(this,"name",{configurable:!0,enumerable:!1,value:i.name})}};function Id(i,e,t){let n=t/4294967296,s=t;i.setUint32(e,n),i.setUint32(e+4,s)}function ro(i,e,t){let n=Math.floor(t/4294967296),s=t;i.setUint32(e,n),i.setUint32(e+4,s)}function ao(i,e){let t=i.getInt32(e),n=i.getUint32(e+4);return t*4294967296+n}function Ld(i,e){let t=i.getUint32(e),n=i.getUint32(e+4);return t*4294967296+n}var jm=-1,Qm=4294967296-1,eg=17179869184-1;function tg({sec:i,nsec:e}){if(i>=0&&e>=0&&i<=eg)if(e===0&&i<=Qm){let t=new Uint8Array(4);return new DataView(t.buffer).setUint32(0,i),t}else{let t=i/4294967296,n=i&4294967295,s=new Uint8Array(8),r=new DataView(s.buffer);return r.setUint32(0,e<<2|t&3),r.setUint32(4,n),s}else{let t=new Uint8Array(12),n=new DataView(t.buffer);return n.setUint32(0,e),ro(n,4,i),t}}function ng(i){let e=i.getTime(),t=Math.floor(e/1e3),n=(e-t*1e3)*1e6,s=Math.floor(n/1e9);return{sec:t+s,nsec:n-s*1e9}}function ig(i){if(i instanceof Date){let e=ng(i);return tg(e)}else return null}function sg(i){let e=new DataView(i.buffer,i.byteOffset,i.byteLength);switch(i.byteLength){case 4:return{sec:e.getUint32(0),nsec:0};case 8:{let t=e.getUint32(0),n=e.getUint32(4),s=(t&3)*4294967296+n,r=t>>>2;return{sec:s,nsec:r}}case 12:{let t=ao(e,4),n=e.getUint32(0);return{sec:t,nsec:n}}default:throw new mn(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${i.length}`)}}function rg(i){let e=sg(i);return new Date(e.sec*1e3+e.nsec/1e6)}var Dd={type:jm,encode:ig,decode:rg};var tr=class i{static defaultCodec=new i;__brand;builtInEncoders=[];builtInDecoders=[];encoders=[];decoders=[];constructor(){this.register(Dd)}register({type:e,encode:t,decode:n}){if(e>=0)this.encoders[e]=t,this.decoders[e]=n;else{let s=-1-e;this.builtInEncoders[s]=t,this.builtInDecoders[s]=n}}tryToEncode(e,t){for(let n=0;n<this.builtInEncoders.length;n++){let s=this.builtInEncoders[n];if(s!=null){let r=s(e,t);if(r!=null){let a=-1-n;return new ys(a,r)}}}for(let n=0;n<this.encoders.length;n++){let s=this.encoders[n];if(s!=null){let r=s(e,t);if(r!=null){let a=n;return new ys(a,r)}}}return e instanceof ys?e:null}decode(e,t,n){let s=t<0?this.builtInDecoders[-1-t]:this.decoders[t];return s?s(e,t,n):new ys(t,e)}};function ag(i){return i instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&i instanceof SharedArrayBuffer}function ta(i){return i instanceof Uint8Array?i:ArrayBuffer.isView(i)?new Uint8Array(i.buffer,i.byteOffset,i.byteLength):ag(i)?new Uint8Array(i):Uint8Array.from(i)}var og=100,lg=2048,na=class i{extensionCodec;context;useBigInt64;maxDepth;initialBufferSize;sortKeys;forceFloat32;ignoreUndefined;forceIntegerToFloat;pos;view;bytes;entered=!1;constructor(e){this.extensionCodec=e?.extensionCodec??tr.defaultCodec,this.context=e?.context,this.useBigInt64=e?.useBigInt64??!1,this.maxDepth=e?.maxDepth??og,this.initialBufferSize=e?.initialBufferSize??lg,this.sortKeys=e?.sortKeys??!1,this.forceFloat32=e?.forceFloat32??!1,this.ignoreUndefined=e?.ignoreUndefined??!1,this.forceIntegerToFloat=e?.forceIntegerToFloat??!1,this.pos=0,this.view=new DataView(new ArrayBuffer(this.initialBufferSize)),this.bytes=new Uint8Array(this.view.buffer)}clone(){return new i({extensionCodec:this.extensionCodec,context:this.context,useBigInt64:this.useBigInt64,maxDepth:this.maxDepth,initialBufferSize:this.initialBufferSize,sortKeys:this.sortKeys,forceFloat32:this.forceFloat32,ignoreUndefined:this.ignoreUndefined,forceIntegerToFloat:this.forceIntegerToFloat})}reinitializeState(){this.pos=0}encodeSharedRef(e){if(this.entered)return this.clone().encodeSharedRef(e);try{return this.entered=!0,this.reinitializeState(),this.doEncode(e,1),this.bytes.subarray(0,this.pos)}finally{this.entered=!1}}encode(e){if(this.entered)return this.clone().encode(e);try{return this.entered=!0,this.reinitializeState(),this.doEncode(e,1),this.bytes.slice(0,this.pos)}finally{this.entered=!1}}doEncode(e,t){if(t>this.maxDepth)throw new Error(`Too deep objects in depth ${t}`);e==null?this.encodeNil():typeof e=="boolean"?this.encodeBoolean(e):typeof e=="number"?this.forceIntegerToFloat?this.encodeNumberAsFloat(e):this.encodeNumber(e):typeof e=="string"?this.encodeString(e):this.useBigInt64&&typeof e=="bigint"?this.encodeBigInt64(e):this.encodeObject(e,t)}ensureBufferSizeToWrite(e){let t=this.pos+e;this.view.byteLength<t&&this.resizeBuffer(t*2)}resizeBuffer(e){let t=new ArrayBuffer(e),n=new Uint8Array(t),s=new DataView(t);n.set(this.bytes),this.view=s,this.bytes=n}encodeNil(){this.writeU8(192)}encodeBoolean(e){e===!1?this.writeU8(194):this.writeU8(195)}encodeNumber(e){!this.forceIntegerToFloat&&Number.isSafeInteger(e)?e>=0?e<128?this.writeU8(e):e<256?(this.writeU8(204),this.writeU8(e)):e<65536?(this.writeU8(205),this.writeU16(e)):e<4294967296?(this.writeU8(206),this.writeU32(e)):this.useBigInt64?this.encodeNumberAsFloat(e):(this.writeU8(207),this.writeU64(e)):e>=-32?this.writeU8(224|e+32):e>=-128?(this.writeU8(208),this.writeI8(e)):e>=-32768?(this.writeU8(209),this.writeI16(e)):e>=-2147483648?(this.writeU8(210),this.writeI32(e)):this.useBigInt64?this.encodeNumberAsFloat(e):(this.writeU8(211),this.writeI64(e)):this.encodeNumberAsFloat(e)}encodeNumberAsFloat(e){this.forceFloat32?(this.writeU8(202),this.writeF32(e)):(this.writeU8(203),this.writeF64(e))}encodeBigInt64(e){e>=BigInt(0)?(this.writeU8(207),this.writeBigUint64(e)):(this.writeU8(211),this.writeBigInt64(e))}writeStringHeader(e){if(e<32)this.writeU8(160+e);else if(e<256)this.writeU8(217),this.writeU8(e);else if(e<65536)this.writeU8(218),this.writeU16(e);else if(e<4294967296)this.writeU8(219),this.writeU32(e);else throw new Error(`Too long string: ${e} bytes in UTF-8`)}encodeString(e){let n=Cd(e);this.ensureBufferSizeToWrite(5+n),this.writeStringHeader(n),Rd(e,this.bytes,this.pos),this.pos+=n}encodeObject(e,t){let n=this.extensionCodec.tryToEncode(e,this.context);if(n!=null)this.encodeExtension(n);else if(Array.isArray(e))this.encodeArray(e,t);else if(ArrayBuffer.isView(e))this.encodeBinary(e);else if(typeof e=="object")this.encodeMap(e,t);else throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(e)}`)}encodeBinary(e){let t=e.byteLength;if(t<256)this.writeU8(196),this.writeU8(t);else if(t<65536)this.writeU8(197),this.writeU16(t);else if(t<4294967296)this.writeU8(198),this.writeU32(t);else throw new Error(`Too large binary: ${t}`);let n=ta(e);this.writeU8a(n)}encodeArray(e,t){let n=e.length;if(n<16)this.writeU8(144+n);else if(n<65536)this.writeU8(220),this.writeU16(n);else if(n<4294967296)this.writeU8(221),this.writeU32(n);else throw new Error(`Too large array: ${n}`);for(let s of e)this.doEncode(s,t+1)}countWithoutUndefined(e,t){let n=0;for(let s of t)e[s]!==void 0&&n++;return n}encodeMap(e,t){let n=Object.keys(e);this.sortKeys&&n.sort();let s=this.ignoreUndefined?this.countWithoutUndefined(e,n):n.length;if(s<16)this.writeU8(128+s);else if(s<65536)this.writeU8(222),this.writeU16(s);else if(s<4294967296)this.writeU8(223),this.writeU32(s);else throw new Error(`Too large map object: ${s}`);for(let r of n){let a=e[r];this.ignoreUndefined&&a===void 0||(this.encodeString(r),this.doEncode(a,t+1))}}encodeExtension(e){if(typeof e.data=="function"){let n=e.data(this.pos+6),s=n.length;if(s>=4294967296)throw new Error(`Too large extension object: ${s}`);this.writeU8(201),this.writeU32(s),this.writeI8(e.type),this.writeU8a(n);return}let t=e.data.length;if(t===1)this.writeU8(212);else if(t===2)this.writeU8(213);else if(t===4)this.writeU8(214);else if(t===8)this.writeU8(215);else if(t===16)this.writeU8(216);else if(t<256)this.writeU8(199),this.writeU8(t);else if(t<65536)this.writeU8(200),this.writeU16(t);else if(t<4294967296)this.writeU8(201),this.writeU32(t);else throw new Error(`Too large extension object: ${t}`);this.writeI8(e.type),this.writeU8a(e.data)}writeU8(e){this.ensureBufferSizeToWrite(1),this.view.setUint8(this.pos,e),this.pos++}writeU8a(e){let t=e.length;this.ensureBufferSizeToWrite(t),this.bytes.set(e,this.pos),this.pos+=t}writeI8(e){this.ensureBufferSizeToWrite(1),this.view.setInt8(this.pos,e),this.pos++}writeU16(e){this.ensureBufferSizeToWrite(2),this.view.setUint16(this.pos,e),this.pos+=2}writeI16(e){this.ensureBufferSizeToWrite(2),this.view.setInt16(this.pos,e),this.pos+=2}writeU32(e){this.ensureBufferSizeToWrite(4),this.view.setUint32(this.pos,e),this.pos+=4}writeI32(e){this.ensureBufferSizeToWrite(4),this.view.setInt32(this.pos,e),this.pos+=4}writeF32(e){this.ensureBufferSizeToWrite(4),this.view.setFloat32(this.pos,e),this.pos+=4}writeF64(e){this.ensureBufferSizeToWrite(8),this.view.setFloat64(this.pos,e),this.pos+=8}writeU64(e){this.ensureBufferSizeToWrite(8),Id(this.view,this.pos,e),this.pos+=8}writeI64(e){this.ensureBufferSizeToWrite(8),ro(this.view,this.pos,e),this.pos+=8}writeBigUint64(e){this.ensureBufferSizeToWrite(8),this.view.setBigUint64(this.pos,e),this.pos+=8}writeBigInt64(e){this.ensureBufferSizeToWrite(8),this.view.setBigInt64(this.pos,e),this.pos+=8}};function oo(i){return`${i<0?"-":""}0x${Math.abs(i).toString(16).padStart(2,"0")}`}var cg=16,hg=16,lo=class{hit=0;miss=0;caches;maxKeyLength;maxLengthPerKey;constructor(e=cg,t=hg){this.maxKeyLength=e,this.maxLengthPerKey=t,this.caches=[];for(let n=0;n<this.maxKeyLength;n++)this.caches.push([])}canBeCached(e){return e>0&&e<=this.maxKeyLength}find(e,t,n){let s=this.caches[n-1];e:for(let r of s){let a=r.bytes;for(let o=0;o<n;o++)if(a[o]!==e[t+o])continue e;return r.str}return null}store(e,t){let n=this.caches[e.length-1],s={bytes:e,str:t};n.length>=this.maxLengthPerKey?n[Math.random()*n.length|0]=s:n.push(s)}decode(e,t,n){let s=this.find(e,t,n);if(s!=null)return this.hit++,s;this.miss++;let r=uc(e,t,n),a=Uint8Array.prototype.slice.call(e,t,t+n);return this.store(a,r),r}};var dc="array",ra="map_key",kd="map_value",ug=i=>{if(typeof i=="string"||typeof i=="number")return i;throw new mn("The type of key must be string or number but "+typeof i)},fc=class{stack=[];stackHeadPosition=-1;get length(){return this.stackHeadPosition+1}top(){return this.stack[this.stackHeadPosition]}pushArrayState(e){let t=this.getUninitializedStateFromPool();t.type=dc,t.position=0,t.size=e,t.array=new Array(e)}pushMapState(e){let t=this.getUninitializedStateFromPool();t.type=ra,t.readCount=0,t.size=e,t.map={}}getUninitializedStateFromPool(){if(this.stackHeadPosition++,this.stackHeadPosition===this.stack.length){let e={type:void 0,size:0,array:void 0,position:0,readCount:0,map:void 0,key:null};this.stack.push(e)}return this.stack[this.stackHeadPosition]}release(e){if(this.stack[this.stackHeadPosition]!==e)throw new Error("Invalid stack state. Released state is not on top of the stack.");if(e.type===dc){let n=e;n.size=0,n.array=void 0,n.position=0,n.type=void 0}if(e.type===ra||e.type===kd){let n=e;n.size=0,n.map=void 0,n.readCount=0,n.type=void 0}this.stackHeadPosition--}reset(){this.stack.length=0,this.stackHeadPosition=-1}},sa=-1,pc=new DataView(new ArrayBuffer(0)),dg=new Uint8Array(pc.buffer);try{pc.getInt8(0)}catch(i){if(!(i instanceof RangeError))throw new Error("This module is not supported in the current JavaScript engine because DataView does not throw RangeError on out-of-bounds access")}var Nd=new RangeError("Insufficient data"),fg=new lo,aa=class i{extensionCodec;context;useBigInt64;rawStrings;maxStrLength;maxBinLength;maxArrayLength;maxMapLength;maxExtLength;keyDecoder;mapKeyConverter;totalPos=0;pos=0;view=pc;bytes=dg;headByte=sa;stack=new fc;entered=!1;constructor(e){this.extensionCodec=e?.extensionCodec??tr.defaultCodec,this.context=e?.context,this.useBigInt64=e?.useBigInt64??!1,this.rawStrings=e?.rawStrings??!1,this.maxStrLength=e?.maxStrLength??4294967295,this.maxBinLength=e?.maxBinLength??4294967295,this.maxArrayLength=e?.maxArrayLength??4294967295,this.maxMapLength=e?.maxMapLength??4294967295,this.maxExtLength=e?.maxExtLength??4294967295,this.keyDecoder=e?.keyDecoder!==void 0?e.keyDecoder:fg,this.mapKeyConverter=e?.mapKeyConverter??ug}clone(){return new i({extensionCodec:this.extensionCodec,context:this.context,useBigInt64:this.useBigInt64,rawStrings:this.rawStrings,maxStrLength:this.maxStrLength,maxBinLength:this.maxBinLength,maxArrayLength:this.maxArrayLength,maxMapLength:this.maxMapLength,maxExtLength:this.maxExtLength,keyDecoder:this.keyDecoder})}reinitializeState(){this.totalPos=0,this.headByte=sa,this.stack.reset()}setBuffer(e){let t=ta(e);this.bytes=t,this.view=new DataView(t.buffer,t.byteOffset,t.byteLength),this.pos=0}appendBuffer(e){if(this.headByte===sa&&!this.hasRemaining(1))this.setBuffer(e);else{let t=this.bytes.subarray(this.pos),n=ta(e),s=new Uint8Array(t.length+n.length);s.set(t),s.set(n,t.length),this.setBuffer(s)}}hasRemaining(e){return this.view.byteLength-this.pos>=e}createExtraByteError(e){let{view:t,pos:n}=this;return new RangeError(`Extra ${t.byteLength-n} of ${t.byteLength} byte(s) found at buffer[${e}]`)}decode(e){if(this.entered)return this.clone().decode(e);try{this.entered=!0,this.reinitializeState(),this.setBuffer(e);let t=this.doDecodeSync();if(this.hasRemaining(1))throw this.createExtraByteError(this.pos);return t}finally{this.entered=!1}}*decodeMulti(e){if(this.entered){yield*this.clone().decodeMulti(e);return}try{for(this.entered=!0,this.reinitializeState(),this.setBuffer(e);this.hasRemaining(1);)yield this.doDecodeSync()}finally{this.entered=!1}}async decodeAsync(e){if(this.entered)return this.clone().decodeAsync(e);try{this.entered=!0;let t=!1,n;for await(let o of e){if(t)throw this.entered=!1,this.createExtraByteError(this.totalPos);this.appendBuffer(o);try{n=this.doDecodeSync(),t=!0}catch(l){if(!(l instanceof RangeError))throw l}this.totalPos+=this.pos}if(t){if(this.hasRemaining(1))throw this.createExtraByteError(this.totalPos);return n}let{headByte:s,pos:r,totalPos:a}=this;throw new RangeError(`Insufficient data in parsing ${oo(s)} at ${a} (${r} in the current buffer)`)}finally{this.entered=!1}}decodeArrayStream(e){return this.decodeMultiAsync(e,!0)}decodeStream(e){return this.decodeMultiAsync(e,!1)}async*decodeMultiAsync(e,t){if(this.entered){yield*this.clone().decodeMultiAsync(e,t);return}try{this.entered=!0;let n=t,s=-1;for await(let r of e){if(t&&s===0)throw this.createExtraByteError(this.totalPos);this.appendBuffer(r),n&&(s=this.readArraySize(),n=!1,this.complete());try{for(;yield this.doDecodeSync(),--s!==0;);}catch(a){if(!(a instanceof RangeError))throw a}this.totalPos+=this.pos}}finally{this.entered=!1}}doDecodeSync(){e:for(;;){let e=this.readHeadByte(),t;if(e>=224)t=e-256;else if(e<192)if(e<128)t=e;else if(e<144){let s=e-128;if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e<160){let s=e-144;if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else{let s=e-160;t=this.decodeString(s,0)}else if(e===192)t=null;else if(e===194)t=!1;else if(e===195)t=!0;else if(e===202)t=this.readF32();else if(e===203)t=this.readF64();else if(e===204)t=this.readU8();else if(e===205)t=this.readU16();else if(e===206)t=this.readU32();else if(e===207)this.useBigInt64?t=this.readU64AsBigInt():t=this.readU64();else if(e===208)t=this.readI8();else if(e===209)t=this.readI16();else if(e===210)t=this.readI32();else if(e===211)this.useBigInt64?t=this.readI64AsBigInt():t=this.readI64();else if(e===217){let s=this.lookU8();t=this.decodeString(s,1)}else if(e===218){let s=this.lookU16();t=this.decodeString(s,2)}else if(e===219){let s=this.lookU32();t=this.decodeString(s,4)}else if(e===220){let s=this.readU16();if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else if(e===221){let s=this.readU32();if(s!==0){this.pushArrayState(s),this.complete();continue e}else t=[]}else if(e===222){let s=this.readU16();if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e===223){let s=this.readU32();if(s!==0){this.pushMapState(s),this.complete();continue e}else t={}}else if(e===196){let s=this.lookU8();t=this.decodeBinary(s,1)}else if(e===197){let s=this.lookU16();t=this.decodeBinary(s,2)}else if(e===198){let s=this.lookU32();t=this.decodeBinary(s,4)}else if(e===212)t=this.decodeExtension(1,0);else if(e===213)t=this.decodeExtension(2,0);else if(e===214)t=this.decodeExtension(4,0);else if(e===215)t=this.decodeExtension(8,0);else if(e===216)t=this.decodeExtension(16,0);else if(e===199){let s=this.lookU8();t=this.decodeExtension(s,1)}else if(e===200){let s=this.lookU16();t=this.decodeExtension(s,2)}else if(e===201){let s=this.lookU32();t=this.decodeExtension(s,4)}else throw new mn(`Unrecognized type byte: ${oo(e)}`);this.complete();let n=this.stack;for(;n.length>0;){let s=n.top();if(s.type===dc)if(s.array[s.position]=t,s.position++,s.position===s.size)t=s.array,n.release(s);else continue e;else if(s.type===ra){if(t==="__proto__")throw new mn("The key __proto__ is not allowed");s.key=this.mapKeyConverter(t),s.type=kd;continue e}else if(s.map[s.key]=t,s.readCount++,s.readCount===s.size)t=s.map,n.release(s);else{s.key=null,s.type=ra;continue e}}return t}}readHeadByte(){return this.headByte===sa&&(this.headByte=this.readU8()),this.headByte}complete(){this.headByte=sa}readArraySize(){let e=this.readHeadByte();switch(e){case 220:return this.readU16();case 221:return this.readU32();default:{if(e<160)return e-144;throw new mn(`Unrecognized array type byte: ${oo(e)}`)}}}pushMapState(e){if(e>this.maxMapLength)throw new mn(`Max length exceeded: map length (${e}) > maxMapLengthLength (${this.maxMapLength})`);this.stack.pushMapState(e)}pushArrayState(e){if(e>this.maxArrayLength)throw new mn(`Max length exceeded: array length (${e}) > maxArrayLength (${this.maxArrayLength})`);this.stack.pushArrayState(e)}decodeString(e,t){return!this.rawStrings||this.stateIsMapKey()?this.decodeUtf8String(e,t):this.decodeBinary(e,t)}decodeUtf8String(e,t){if(e>this.maxStrLength)throw new mn(`Max length exceeded: UTF-8 byte length (${e}) > maxStrLength (${this.maxStrLength})`);if(this.bytes.byteLength<this.pos+t+e)throw Nd;let n=this.pos+t,s;return this.stateIsMapKey()&&this.keyDecoder?.canBeCached(e)?s=this.keyDecoder.decode(this.bytes,n,e):s=Pd(this.bytes,n,e),this.pos+=t+e,s}stateIsMapKey(){return this.stack.length>0?this.stack.top().type===ra:!1}decodeBinary(e,t){if(e>this.maxBinLength)throw new mn(`Max length exceeded: bin length (${e}) > maxBinLength (${this.maxBinLength})`);if(!this.hasRemaining(e+t))throw Nd;let n=this.pos+t,s=this.bytes.subarray(n,n+e);return this.pos+=t+e,s}decodeExtension(e,t){if(e>this.maxExtLength)throw new mn(`Max length exceeded: ext length (${e}) > maxExtLength (${this.maxExtLength})`);let n=this.view.getInt8(this.pos+t),s=this.decodeBinary(e,t+1);return this.extensionCodec.decode(s,n,this.context)}lookU8(){return this.view.getUint8(this.pos)}lookU16(){return this.view.getUint16(this.pos)}lookU32(){return this.view.getUint32(this.pos)}readU8(){let e=this.view.getUint8(this.pos);return this.pos++,e}readI8(){let e=this.view.getInt8(this.pos);return this.pos++,e}readU16(){let e=this.view.getUint16(this.pos);return this.pos+=2,e}readI16(){let e=this.view.getInt16(this.pos);return this.pos+=2,e}readU32(){let e=this.view.getUint32(this.pos);return this.pos+=4,e}readI32(){let e=this.view.getInt32(this.pos);return this.pos+=4,e}readU64(){let e=Ld(this.view,this.pos);return this.pos+=8,e}readI64(){let e=ao(this.view,this.pos);return this.pos+=8,e}readU64AsBigInt(){let e=this.view.getBigUint64(this.pos);return this.pos+=8,e}readI64AsBigInt(){let e=this.view.getBigInt64(this.pos);return this.pos+=8,e}readF32(){let e=this.view.getFloat32(this.pos);return this.pos+=4,e}readF64(){let e=this.view.getFloat64(this.pos);return this.pos+=8,e}};var pg=new na({ignoreUndefined:!0}),mg=new aa;function co(i){return pg.encode(i)}function Ud(i){return mg.decode(i instanceof ArrayBuffer?new Uint8Array(i):i)}function mc(i){return i.byteOffset%4===0?new Int32Array(i.buffer,i.byteOffset,i.byteLength>>2):new Int32Array(gg(i).buffer)}function gg(i){let e=new Uint8Array(i.byteLength);return e.set(i),e}function oa(i,e){return e<<16|i}var Yi=["wood","stone","scrap","ore","brick","leather","claw"],li=["weapon","clothing","defence","furniture"],Ki=[{cat:"weapon",what:"sword",need:{wood:1,ore:1}},{cat:"weapon",what:"axe",need:{wood:1,stone:1}},{cat:"weapon",what:"spear",need:{wood:1,claw:1}},{cat:"weapon",what:"spear",need:{wood:1,scrap:1}},{cat:"weapon",what:"bow",need:{wood:2,leather:1}},{cat:"weapon",what:"arrows",need:{wood:2,stone:1},n:5},{cat:"clothing",what:"clothes",need:{leather:2}},{cat:"clothing",what:"armor",need:{leather:2,ore:1}},{cat:"clothing",what:"helmet",need:{leather:1,ore:1}},{cat:"defence",what:"palisade",need:{wood:2}},{cat:"defence",what:"spikes",need:{wood:1,claw:1}},{cat:"defence",what:"stonewall",need:{brick:2}},{cat:"furniture",what:"door",need:{wood:1,ore:1}},{cat:"furniture",what:"window",need:{wood:1,scrap:1}},{cat:"furniture",what:"bed",need:{wood:3,leather:2}},{cat:"furniture",what:"lamp",need:{scrap:1,ore:1}},{cat:"furniture",what:"campfire",need:{wood:3,stone:2}}],la={wood:14,stone:4},Zi=["palisade","spikes","stonewall","door","window","bed","lamp","campfire"],ho={sword:34,spear:30,axe:22},Fd={armor:.35,clothes:.15,helmet:.15},Bd=["rabbit","deer","boar","wolf","bear"];function nr(i,e){let t=Object.keys(e).filter(n=>(e[n]??0)>0);for(let n of Ki){if(n.cat!==i)continue;let s=Object.keys(n.need);if(s.length===t.length&&s.every(r=>e[r]===n.need[r]))return n}return null}var _s=["#b9b3a8","#62c95a","#4aa3ff","#b36cff","#ffb02e"],vg=[1,1.12,1.25,1.42,1.65],ir=10;function ca(i,e){return(vg[e]??1)*(1+.05*Math.max(0,Math.min(ir,i)))}function Od(i){return 2+2*i}var ci={sword:"weapon",axe:"weapon",spear:"weapon",bow:"ranged",helmet:"head",armor:"body",clothes:"body"},kw=Object.keys(ci),xg=30;function ha(i){return i==="bow"?xg:ho[i]??Fd[i]??0}var yg=new Set(["sword","axe","helmet","armor"]);function zd(i,e){let t=Math.ceil((e+1)/2);return i==="clothes"?{leather:t}:i==="bow"?{wood:1,leather:Math.ceil((e+1)/3)}:i==="spear"?{wood:1,stone:t}:yg.has(i)?i==="helmet"||i==="armor"?{ore:t,leather:1}:{ore:t,stone:1}:{}}function Hd(i,e){let t=e+1,n=i==="clothes"||i==="bow"?{claw:t,leather:2*t,scrap:t}:{claw:t,ore:2*t,scrap:t};return e>=2&&(n.brick=e-1),n}var _g=["","sword","axe","spear","bow"],bg=["","attack","chop","mine","build","talk","shoot","use"];function Vd(i){let e=Math.max(0,_g.indexOf(i.held)),t=Math.max(0,bg.indexOf(i.anim));return e|(i.hq&7)<<3|(i.helmet?1:0)<<6|(i.headQ&7)<<7|(i.body==="armor"?2:i.body==="clothes"?1:0)<<10|(i.bodyQ&7)<<12|t<<15|(i.seq&15)<<18|(i.back?1:0)<<22}var Mg=[{key:"guide",name:"Elder Mara",look:10,dx:0,dy:-4,title:{en:"Elder Mara, the guide",fr:"Ancienne Mara, la guide",es:"Anciana Mara, la gu\xEDa",ar:"\u0627\u0644\u062D\u0643\u064A\u0645\u0629 \u0645\u0627\u0631\u0627\u060C \u0627\u0644\u0645\u0631\u0634\u062F\u0629"},idle:{en:"Stay alive, child. Water, food, rest: never forget them.",fr:"Reste en vie, petit. L'eau, la nourriture, le repos : ne les oublie jamais.",es:"Sigue con vida. Agua, comida, descanso: nunca los olvides.",ar:"\u0627\u0628\u0642\u064E \u062D\u064A\u064B\u0627 \u064A\u0627 \u0628\u0646\u064A. \u0627\u0644\u0645\u0627\u0621 \u0648\u0627\u0644\u0637\u0639\u0627\u0645 \u0648\u0627\u0644\u0631\u0627\u062D\u0629: \u0644\u0627 \u062A\u0646\u0633\u0647\u0627 \u0623\u0628\u062F\u064B\u0627."}},{key:"smith",name:"Joren the smith",look:4,dx:6,dy:-2,title:{en:"Joren, the smith",fr:"Joren, le forgeron",es:"Joren, el herrero",ar:"\u062C\u0648\u0631\u0646\u060C \u0627\u0644\u062D\u062F\u0627\u062F"},idle:{en:"Good tools make a long life. Come back when you need to learn.",fr:"De bons outils font une longue vie. Reviens quand tu veux apprendre.",es:"Buenas herramientas, larga vida. Vuelve cuando quieras aprender.",ar:"\u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0627\u0644\u062C\u064A\u062F\u0629 \u062A\u0635\u0646\u0639 \u062D\u064A\u0627\u0629 \u0637\u0648\u064A\u0644\u0629. \u0639\u062F \u0639\u0646\u062F\u0645\u0627 \u062A\u0631\u064A\u062F \u0623\u0646 \u062A\u062A\u0639\u0644\u0645."}},{key:"hunter",name:"Sela the hunter",look:11,dx:-6,dy:-2,title:{en:"Sela, the hunter",fr:"Sela, la chasseuse",es:"Sela, la cazadora",ar:"\u0633\u064A\u0644\u0627\u060C \u0627\u0644\u0635\u064A\u0627\u062F\u0629"},idle:{en:"The woods feed the patient and eat the careless.",fr:"Les bois nourrissent les patients et d\xE9vorent les imprudents.",es:"El bosque alimenta al paciente y devora al descuidado.",ar:"\u0627\u0644\u063A\u0627\u0628\u0629 \u062A\u0637\u0639\u0645 \u0627\u0644\u0635\u0628\u0648\u0631 \u0648\u062A\u0623\u0643\u0644 \u0627\u0644\u0645\u062A\u0647\u0648\u0631."}},{key:"warden",name:"Warden Bram",look:1,dx:4,dy:4,title:{en:"Bram, the warden",fr:"Bram, le gardien",es:"Bram, el guardi\xE1n",ar:"\u0628\u0631\u0627\u0645\u060C \u0627\u0644\u062D\u0627\u0631\u0633"},idle:{en:"They come at nine at night. Be ready, keep a fire, stay together.",fr:"Ils viennent \xE0 neuf heures du soir. Sois pr\xEAt, garde un feu, restez ensemble.",es:"Vienen a las nueve de la noche. Prep\xE1rate, mant\xE9n un fuego, quedaos juntos.",ar:"\u064A\u0623\u062A\u0648\u0646 \u0641\u064A \u0627\u0644\u062A\u0627\u0633\u0639\u0629 \u0644\u064A\u0644\u064B\u0627. \u0643\u0646 \u0645\u0633\u062A\u0639\u062F\u064B\u0627\u060C \u0623\u0628\u0642\u0650 \u0646\u0627\u0631\u064B\u0627\u060C \u0648\u0627\u0628\u0642\u0648\u0627 \u0645\u0639\u064B\u0627."}},{key:"registrar",name:"Odile the registrar",look:13,dx:-4,dy:4,title:{en:"Odile, keeper of the clans",fr:"Odile, gardienne des clans",es:"Odile, guardiana de los clanes",ar:"\u0623\u0648\u062F\u064A\u0644\u060C \u062D\u0627\u0631\u0633\u0629 \u0627\u0644\u0639\u0634\u0627\u0626\u0631"},idle:{en:"Clans are founded here, in my book. Alone you survive; together you live.",fr:"Les clans se fondent ici, dans mon livre. Seul on survit ; ensemble on vit.",es:"Los clanes se fundan aqu\xED, en mi libro. Solo sobrevives; juntos viv\xEDs.",ar:"\u062A\u064F\u0624\u0633\u064E\u0651\u0633 \u0627\u0644\u0639\u0634\u0627\u0626\u0631 \u0647\u0646\u0627 \u0641\u064A \u0643\u062A\u0627\u0628\u064A. \u0648\u062D\u062F\u0643 \u062A\u0646\u062C\u0648\u060C \u0648\u0645\u0639\u064B\u0627 \u062A\u0639\u064A\u0634\u0648\u0646."}}],uo=i=>Mg.find(e=>e.key===i),Gd=[{id:"q1",npc:"guide",need:[{ev:"npc",what:"warden",n:1}],plan:[{do:"npc",what:"warden"}],reward:{xp:20,food:1},title:{en:"Know the town",fr:"Conna\xEEtre la ville",es:"Conoce el pueblo",ar:"\u062A\u0639\u0631\u0651\u0641 \u0639\u0644\u0649 \u0627\u0644\u0628\u0644\u062F\u0629"},ask:{en:"Welcome, survivor. First, meet Warden Bram: he keeps us safe at night. Walk to him and talk, then come back to me.",fr:"Bienvenue, survivant. D'abord, va voir le gardien Bram : il nous prot\xE8ge la nuit. Parle-lui, puis reviens me voir.",es:"Bienvenido, superviviente. Primero, ve a ver al guardi\xE1n Bram: nos protege de noche. Habla con \xE9l y vuelve conmigo.",ar:"\u0645\u0631\u062D\u0628\u064B\u0627 \u0623\u064A\u0647\u0627 \u0627\u0644\u0646\u0627\u062C\u064A. \u0623\u0648\u0644\u064B\u0627\u060C \u0642\u0627\u0628\u0644 \u0627\u0644\u062D\u0627\u0631\u0633 \u0628\u0631\u0627\u0645: \u0625\u0646\u0647 \u064A\u062D\u0645\u064A\u0646\u0627 \u0644\u064A\u0644\u064B\u0627. \u0627\u0645\u0634\u0650 \u0625\u0644\u064A\u0647 \u0648\u062A\u062D\u062F\u062B \u0645\u0639\u0647\u060C \u062B\u0645 \u0639\u062F \u0625\u0644\u064A\u0651."},done:{en:"Good. Faces you know are faces that help you. Here, some food.",fr:"Bien. Les visages que tu connais sont ceux qui t'aident. Tiens, de quoi manger.",es:"Bien. Las caras que conoces son las que te ayudan. Toma, algo de comida.",ar:"\u062C\u064A\u062F. \u0627\u0644\u0648\u062C\u0648\u0647 \u0627\u0644\u062A\u064A \u062A\u0639\u0631\u0641\u0647\u0627 \u0647\u064A \u0627\u0644\u062A\u064A \u062A\u0633\u0627\u0639\u062F\u0643. \u062E\u0630\u060C \u0628\u0639\u0636 \u0627\u0644\u0637\u0639\u0627\u0645."},lesson:"The town has teachers: Elder Mara (guide), Joren (smith), Sela (hunter), Bram (warden), Odile (clans). Talk to them to learn."},{id:"q2",npc:"guide",need:[{ev:"drink",n:1}],plan:[{do:"drink"}],reward:{xp:20},title:{en:"Water first",fr:"L'eau d'abord",es:"Primero el agua",ar:"\u0627\u0644\u0645\u0627\u0621 \u0623\u0648\u0644\u064B\u0627"},ask:{en:"Thirst kills faster than anything. Go to the water and drink.",fr:"La soif tue plus vite que tout. Va \xE0 l'eau et bois.",es:"La sed mata m\xE1s r\xE1pido que nada. Ve al agua y bebe.",ar:"\u0627\u0644\u0639\u0637\u0634 \u064A\u0642\u062A\u0644 \u0623\u0633\u0631\u0639 \u0645\u0646 \u0623\u064A \u0634\u064A\u0621. \u0627\u0630\u0647\u0628 \u0625\u0644\u0649 \u0627\u0644\u0645\u0627\u0621 \u0648\u0627\u0634\u0631\u0628."},done:{en:"Remember where the water is. Always.",fr:"Souviens-toi o\xF9 est l'eau. Toujours.",es:"Recuerda d\xF3nde est\xE1 el agua. Siempre.",ar:"\u062A\u0630\u0643\u0631 \u0623\u064A\u0646 \u0627\u0644\u0645\u0627\u0621. \u062F\u0627\u0626\u0645\u064B\u0627."},lesson:"Thirst kills fastest: drink before going far, and remember where the water is."},{id:"q3",npc:"guide",need:[{ev:"pickup",n:2}],plan:[{do:"collect",what:"food",times:2}],reward:{xp:25,items:{wood:1}},title:{en:"Something to eat",fr:"De quoi manger",es:"Algo que comer",ar:"\u0634\u064A\u0621 \u0644\u0644\u0623\u0643\u0644"},ask:{en:"Find food and pick up two pieces: berries, cans, whatever lies around. Keep some for later.",fr:"Trouve de la nourriture et ramasses-en deux : baies, conserves, ce qui tra\xEEne. Garde-en pour plus tard.",es:"Encuentra comida y recoge dos: bayas, latas, lo que haya. Guarda algo para luego.",ar:"\u0627\u0628\u062D\u062B \u0639\u0646 \u0627\u0644\u0637\u0639\u0627\u0645 \u0648\u0627\u0644\u062A\u0642\u0637 \u0642\u0637\u0639\u062A\u064A\u0646: \u062A\u0648\u062A\u060C \u0645\u0639\u0644\u0628\u0627\u062A\u060C \u0623\u064A \u0634\u064A\u0621 \u0645\u0644\u0642\u0649. \u0627\u062D\u062A\u0641\u0638 \u0628\u0628\u0639\u0636\u0647 \u0644\u0648\u0642\u062A \u0644\u0627\u062D\u0642."},done:{en:"A full bag is a calm night. Well done.",fr:"Un sac plein, c'est une nuit calme. Bien jou\xE9.",es:"Una bolsa llena es una noche tranquila. Bien hecho.",ar:"\u062D\u0642\u064A\u0628\u0629 \u0645\u0645\u062A\u0644\u0626\u0629 \u062A\u0639\u0646\u064A \u0644\u064A\u0644\u0629 \u0647\u0627\u062F\u0626\u0629. \u0623\u062D\u0633\u0646\u062A."},lesson:"Carry food before you are hungry; picking it up early keeps you alive when hunger comes."},{id:"q4",npc:"smith",need:[{ev:"gather",what:"wood",n:3}],plan:[{do:"gather",what:"wood",times:3}],reward:{xp:25,items:{stone:1}},title:{en:"Wood for everything",fr:"Du bois pour tout",es:"Madera para todo",ar:"\u062E\u0634\u0628 \u0644\u0643\u0644 \u0634\u064A\u0621"},ask:{en:"Chop a tree three times and bring the wood. Wood makes fires, tools and homes.",fr:"Coupe un arbre trois fois et garde le bois. Le bois fait les feux, les outils et les maisons.",es:"Corta un \xE1rbol tres veces y guarda la madera. La madera hace fuegos, herramientas y casas.",ar:"\u0627\u0642\u0637\u0639 \u0634\u062C\u0631\u0629 \u062B\u0644\u0627\u062B \u0645\u0631\u0627\u062A \u0648\u0627\u062D\u062A\u0641\u0638 \u0628\u0627\u0644\u062E\u0634\u0628. \u0627\u0644\u062E\u0634\u0628 \u064A\u0635\u0646\u0639 \u0627\u0644\u0646\u0627\u0631 \u0648\u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0648\u0627\u0644\u0628\u064A\u0648\u062A."},done:{en:"Strong arms. Here is a stone to go with it.",fr:"De bons bras. Voici une pierre pour aller avec.",es:"Buenos brazos. Toma una piedra para acompa\xF1arla.",ar:"\u0630\u0631\u0627\u0639\u0627\u0646 \u0642\u0648\u064A\u062A\u0627\u0646. \u062E\u0630 \u062D\u062C\u0631\u064B\u0627 \u0645\u0639\u0647."},lesson:"Wood comes from chopping trees (an axe gives twice as much); it is needed for fires, tools, huts and walls."},{id:"q5",npc:"smith",need:[{ev:"gather",what:"stone",n:2}],plan:[{do:"gather",what:"stone",times:2}],reward:{xp:25},title:{en:"Stone from the ruins",fr:"La pierre des ruines",es:"Piedra de las ruinas",ar:"\u062D\u062C\u0631 \u0645\u0646 \u0627\u0644\u0623\u0637\u0644\u0627\u0644"},ask:{en:"Search the rubble or break a rock: get two stones. Stone is rarer than wood, look well.",fr:"Fouille les gravats ou casse un rocher : trouve deux pierres. La pierre est plus rare que le bois.",es:"Busca en los escombros o rompe una roca: consigue dos piedras. La piedra es m\xE1s rara que la madera.",ar:"\u0627\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u0631\u0643\u0627\u0645 \u0623\u0648 \u0627\u0643\u0633\u0631 \u0635\u062E\u0631\u0629: \u0627\u062D\u0635\u0644 \u0639\u0644\u0649 \u062D\u062C\u0631\u064A\u0646. \u0627\u0644\u062D\u062C\u0631 \u0623\u0646\u062F\u0631 \u0645\u0646 \u0627\u0644\u062E\u0634\u0628."},done:{en:"Now you can make a real tool.",fr:"Maintenant tu peux faire un vrai outil.",es:"Ahora puedes hacer una herramienta de verdad.",ar:"\u0627\u0644\u0622\u0646 \u064A\u0645\u0643\u0646\u0643 \u0635\u0646\u0639 \u0623\u062F\u0627\u0629 \u062D\u0642\u064A\u0642\u064A\u0629."},lesson:"Stone comes from rubble and rocks; it is rarer than wood, so keep it for tools, fires and huts."},{id:"q6",npc:"smith",need:[{ev:"craft",what:"axe",n:1}],plan:[{do:"craft",what:"axe"}],reward:{xp:35,items:{wood:2}},title:{en:"Your first axe",fr:"Ta premi\xE8re hache",es:"Tu primera hacha",ar:"\u0641\u0623\u0633\u0643 \u0627\u0644\u0623\u0648\u0644"},ask:{en:"Two wood and one stone make an axe (Bag > Craft > Weapons). Make one: it chops twice as fast and it is a weapon too.",fr:"Deux bois et une pierre font une hache (Sac > Fabriquer > Armes). Fais-en une : elle coupe deux fois plus et c'est une arme.",es:"Dos maderas y una piedra hacen un hacha (Bolsa > Fabricar > Armas). Haz una: corta el doble y tambi\xE9n es un arma.",ar:"\u062E\u0634\u0628\u062A\u0627\u0646 \u0648\u062D\u062C\u0631 \u064A\u0635\u0646\u0639\u0648\u0646 \u0641\u0623\u0633\u064B\u0627 (\u0627\u0644\u062D\u0642\u064A\u0628\u0629 > \u0635\u0646\u0639 > \u0623\u0633\u0644\u062D\u0629). \u0627\u0635\u0646\u0639 \u0648\u0627\u062D\u062F\u0629: \u062A\u0642\u0637\u0639 \u0628\u0636\u0639\u0641 \u0627\u0644\u0633\u0631\u0639\u0629 \u0648\u0647\u064A \u0633\u0644\u0627\u062D \u0623\u064A\u0636\u064B\u0627."},done:{en:"A fine axe. Take care of it and it takes care of you.",fr:"Une belle hache. Prends-en soin et elle prendra soin de toi.",es:"Un buen hacha. Cu\xEDdala y ella te cuidar\xE1.",ar:"\u0641\u0623\u0633 \u062C\u064A\u062F\u0629. \u0627\u0639\u062A\u0646\u0650 \u0628\u0647\u0627 \u0648\u0633\u062A\u0639\u062A\u0646\u064A \u0628\u0643."},lesson:"Craft an axe early (2 wood + 1 stone): double wood from every tree, and it is a weapon against zombies."},{id:"q7",npc:"warden",need:[{ev:"build",what:"campfire",n:1},{ev:"tend",n:1}],plan:[{do:"build",what:"campfire"}],reward:{xp:35,food:1},title:{en:"Fire at night",fr:"Du feu la nuit",es:"Fuego de noche",ar:"\u0646\u0627\u0631 \u0641\u064A \u0627\u0644\u0644\u064A\u0644"},ask:{en:"Zombies and wolves fear the fire. Build a campfire (3 wood, 2 stone) or put wood on the camp's fire.",fr:"Zombies et loups craignent le feu. Construis un feu de camp (3 bois, 2 pierres) ou remets du bois sur celui du camp.",es:"Zombis y lobos temen al fuego. Construye una fogata (3 maderas, 2 piedras) o echa le\xF1a a la del campamento.",ar:"\u0627\u0644\u0632\u0648\u0645\u0628\u064A \u0648\u0627\u0644\u0630\u0626\u0627\u0628 \u062A\u062E\u0627\u0641 \u0627\u0644\u0646\u0627\u0631. \u0627\u0628\u0646\u0650 \u0646\u0627\u0631 \u0645\u062E\u064A\u0645 (3 \u062E\u0634\u0628\u060C 2 \u062D\u062C\u0631) \u0623\u0648 \u0636\u0639 \u062D\u0637\u0628\u064B\u0627 \u0639\u0644\u0649 \u0646\u0627\u0631 \u0627\u0644\u0645\u062E\u064A\u0645."},done:{en:"Keep it burning through the night and sleep close to it.",fr:"Garde-le allum\xE9 toute la nuit et dors pr\xE8s de lui.",es:"Mantenlo encendido toda la noche y duerme cerca.",ar:"\u0623\u0628\u0642\u0647\u0627 \u0645\u0634\u062A\u0639\u0644\u0629 \u0637\u0648\u0627\u0644 \u0627\u0644\u0644\u064A\u0644 \u0648\u0646\u0645 \u0628\u0642\u0631\u0628\u0647\u0627."},lesson:"A fire keeps animals and zombies off and makes sleep restful: build one at dusk, feed it wood, sleep near it."},{id:"q8",npc:"warden",need:[{ev:"craft",what:"spear",n:1},{ev:"craft",what:"sword",n:1},{ev:"craft",what:"bow",n:1}],plan:[{do:"craft",what:"spear"}],reward:{xp:40,items:{clothes:1}},title:{en:"Fight back",fr:"Riposter",es:"Defi\xE9ndete",ar:"\u062F\u0627\u0641\u0639 \u0639\u0646 \u0646\u0641\u0633\u0643"},ask:{en:"Running is not always enough. Craft a weapon: a spear (2 wood, 1 scrap), a sword or a bow. Then you fight back.",fr:"Fuir ne suffit pas toujours. Fabrique une arme : une lance (2 bois, 1 ferraille), une \xE9p\xE9e ou un arc.",es:"Huir no siempre basta. Fabrica un arma: una lanza (2 maderas, 1 chatarra), una espada o un arco.",ar:"\u0627\u0644\u0647\u0631\u0628 \u0644\u0627 \u064A\u0643\u0641\u064A \u062F\u0627\u0626\u0645\u064B\u0627. \u0627\u0635\u0646\u0639 \u0633\u0644\u0627\u062D\u064B\u0627: \u0631\u0645\u062D (2 \u062E\u0634\u0628\u060C 1 \u062E\u0631\u062F\u0629)\u060C \u0633\u064A\u0641 \u0623\u0648 \u0642\u0648\u0633. \u062B\u0645 \u062F\u0627\u0641\u0639."},done:{en:"Now when they come, you stand. Take these clothes: they soften the bites.",fr:"Maintenant, quand ils viennent, tu tiens. Prends ces v\xEAtements : ils adoucissent les morsures.",es:"Ahora, cuando vengan, resistir\xE1s. Toma esta ropa: suaviza los mordiscos.",ar:"\u0627\u0644\u0622\u0646 \u0639\u0646\u062F\u0645\u0627 \u064A\u0623\u062A\u0648\u0646 \u0633\u062A\u0635\u0645\u062F. \u062E\u0630 \u0647\u0630\u0647 \u0627\u0644\u0645\u0644\u0627\u0628\u0633: \u062A\u062E\u0641\u0641 \u0627\u0644\u0639\u0636\u0651\u0627\u062A."},lesson:"Carry a weapon (spear, sword, axe or bow) and fight back when a zombie or an animal attacks; together and armed you win, alone and unarmed run to the fire."},{id:"q9",npc:"hunter",need:[{ev:"hunt",n:1}],plan:[{do:"hunt",what:"rabbit"}],reward:{xp:40,items:{arrows:5}},title:{en:"The first hunt",fr:"La premi\xE8re chasse",es:"La primera caza",ar:"\u0627\u0644\u0635\u064A\u062F \u0627\u0644\u0623\u0648\u0644"},ask:{en:"Meat, leather, claws: the animals give everything. Hunt one, a rabbit is enough. Careful with boars and bears.",fr:"Viande, cuir, griffes : les animaux donnent tout. Chasses-en un, un lapin suffit. Attention aux sangliers et aux ours.",es:"Carne, cuero, garras: los animales lo dan todo. Caza uno, un conejo basta. Cuidado con jabal\xEDes y osos.",ar:"\u0627\u0644\u0644\u062D\u0645 \u0648\u0627\u0644\u062C\u0644\u062F \u0648\u0627\u0644\u0645\u062E\u0627\u0644\u0628: \u0627\u0644\u062D\u064A\u0648\u0627\u0646\u0627\u062A \u062A\u0639\u0637\u064A \u0643\u0644 \u0634\u064A\u0621. \u0627\u0635\u0637\u062F \u0648\u0627\u062D\u062F\u064B\u0627\u060C \u0627\u0644\u0623\u0631\u0646\u0628 \u064A\u0643\u0641\u064A. \u0627\u062D\u0630\u0631 \u0627\u0644\u062E\u0646\u0627\u0632\u064A\u0631 \u0627\u0644\u0628\u0631\u064A\u0629 \u0648\u0627\u0644\u062F\u0628\u0628\u0629."},done:{en:"You have the eye. Here, arrows for when you make a bow.",fr:"Tu as l'\u0153il. Tiens, des fl\xE8ches pour quand tu auras un arc.",es:"Tienes buen ojo. Toma flechas para cuando tengas un arco.",ar:"\u0644\u062F\u064A\u0643 \u0639\u064A\u0646 \u0627\u0644\u0635\u064A\u0627\u062F. \u062E\u0630 \u0633\u0647\u0627\u0645\u064B\u0627 \u0644\u0639\u0646\u062F\u0645\u0627 \u062A\u0635\u0646\u0639 \u0642\u0648\u0633\u064B\u0627."},lesson:"Hunting gives meat, leather (clothes, bows) and claws; rabbits and deer are safe, boars and bears fight back, wolves bite at night."},{id:"q10",npc:"registrar",need:[{ev:"clanJoin",n:1}],plan:[{do:"clan",what:"join"}],reward:{xp:50,food:2},title:{en:"Never alone",fr:"Jamais seul",es:"Nunca solo",ar:"\u0644\u0633\u062A \u0648\u062D\u062F\u0643 \u0623\u0628\u062F\u064B\u0627"},ask:{en:"A clan shares food, guards at night and votes for its leader. Join one (Game menu > Clan), or found your own here with me.",fr:"Un clan partage la nourriture, monte la garde et \xE9lit son chef. Rejoins-en un (Menu > Clan) ou fonde le tien ici avec moi.",es:"Un clan comparte comida, hace guardia y vota a su l\xEDder. \xDAnete a uno (Men\xFA > Clan) o funda el tuyo aqu\xED conmigo.",ar:"\u0627\u0644\u0639\u0634\u064A\u0631\u0629 \u062A\u062A\u0642\u0627\u0633\u0645 \u0627\u0644\u0637\u0639\u0627\u0645 \u0648\u062A\u062D\u0631\u0633 \u0644\u064A\u0644\u064B\u0627 \u0648\u062A\u0646\u062A\u062E\u0628 \u0642\u0627\u0626\u062F\u0647\u0627. \u0627\u0646\u0636\u0645 \u0625\u0644\u0649 \u0648\u0627\u062D\u062F\u0629 (\u0627\u0644\u0642\u0627\u0626\u0645\u0629 > \u0627\u0644\u0639\u0634\u064A\u0631\u0629) \u0623\u0648 \u0623\u0633\u0633 \u0639\u0634\u064A\u0631\u062A\u0643 \u0647\u0646\u0627 \u0645\u0639\u064A."},done:{en:"Your name is in my book now. Stand by your clan and it will stand by you.",fr:"Ton nom est dans mon livre. Soutiens ton clan et il te soutiendra.",es:"Tu nombre est\xE1 en mi libro. Apoya a tu clan y \xE9l te apoyar\xE1.",ar:"\u0627\u0633\u0645\u0643 \u0641\u064A \u0643\u062A\u0627\u0628\u064A \u0627\u0644\u0622\u0646. \u0642\u0641 \u0645\u0639 \u0639\u0634\u064A\u0631\u062A\u0643 \u0648\u0633\u062A\u0642\u0641 \u0645\u0639\u0643."},lesson:"A clan is safety: members share work, guard each other and vote for their leader; you may change clan if another suits you better."}],ua=i=>Gd.find(e=>e.id===i);var wg=0,Wd=1,Sg=2;var ol=1,uu=2,Li=3,as=0,xn=1,Fn=2,ss=0,_r=1,Ds=2,qd=3,$d=4,Ag=5,Cs=100,Tg=101,Eg=102,Cg=103,Rg=104,Pg=200,Ig=201,Lg=202,Dg=203,Yc=204,Kc=205,Ng=206,kg=207,Ug=208,Fg=209,Bg=210,Og=211,zg=212,Hg=213,Vg=214,Zc=0,Jc=1,jc=2,Sr=3,Qc=4,eh=5,th=6,nh=7,ll=0,Gg=1,Wg=2,rs=0,qg=1,$g=2,Xg=3,Yg=4,Kg=5,Zg=6,Ea=7;var Kf=300,Ar=301,Tr=302,ih=303,sh=304,cl=306,rh=1e3,Is=1001,ah=1002,Sn=1003,Jg=1004;var fo=1005;var ui=1006,gc=1007;var Ls=1008;var Ui=1009,Zf=1010,Jf=1011,wa=1012,du=1013,Ns=1014,di=1015,Ca=1016,fu=1017,pu=1018,Er=1020,jf=35902,Qf=1021,ep=1022,Zn=1023,tp=1024,np=1025,br=1026,Cr=1027,mu=1028,gu=1029,ip=1030,vu=1031;var xu=1033,Uo=33776,Fo=33777,Bo=33778,Oo=33779,oh=35840,lh=35841,ch=35842,hh=35843,uh=36196,dh=37492,fh=37496,ph=37808,mh=37809,gh=37810,vh=37811,xh=37812,yh=37813,_h=37814,bh=37815,Mh=37816,wh=37817,Sh=37818,Ah=37819,Th=37820,Eh=37821,zo=36492,Ch=36494,Rh=36495,sp=36283,Ph=36284,Ih=36285,Lh=36286;var Ho=2300,Dh=2301,vc=2302,Xd=2400,Yd=2401,Kd=2402;var jg=3200,Qg=3201;var yu=0,e0=1,is="",Un="srgb",kr="srgb-linear",hl="linear",xt="srgb";var sr=7680;var Zd=519,t0=512,n0=513,i0=514,rp=515,s0=516,r0=517,a0=518,o0=519,Jd=35044,zi=35048;var jd="300 es",Ni=2e3,Vo=2001,os=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let s=this._listeners[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let n=this._listeners[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},an=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var xc=Math.PI/180,Nh=180/Math.PI;function Ra(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(an[i&255]+an[i>>8&255]+an[i>>16&255]+an[i>>24&255]+"-"+an[e&255]+an[e>>8&255]+"-"+an[e>>16&15|64]+an[e>>24&255]+"-"+an[t&63|128]+an[t>>8&255]+"-"+an[t>>16&255]+an[t>>24&255]+an[n&255]+an[n>>8&255]+an[n>>16&255]+an[n>>24&255]).toLowerCase()}function vn(i,e,t){return Math.max(e,Math.min(t,i))}function l0(i,e){return(i%e+e)%e}function yc(i,e,t){return(1-t)*i+t*e}function da(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function gn(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var Xe=class i{constructor(e=0,t=0){i.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(vn(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Ue=class i{constructor(e,t,n,s,r,a,o,l,h){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,h)}set(e,t,n,s,r,a,o,l,h){let c=this.elements;return c[0]=e,c[1]=s,c[2]=o,c[3]=t,c[4]=r,c[5]=l,c[6]=n,c[7]=a,c[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],h=n[1],c=n[4],u=n[7],d=n[2],m=n[5],g=n[8],v=s[0],p=s[3],f=s[6],w=s[1],S=s[4],x=s[7],I=s[2],R=s[5],T=s[8];return r[0]=a*v+o*w+l*I,r[3]=a*p+o*S+l*R,r[6]=a*f+o*x+l*T,r[1]=h*v+c*w+u*I,r[4]=h*p+c*S+u*R,r[7]=h*f+c*x+u*T,r[2]=d*v+m*w+g*I,r[5]=d*p+m*S+g*R,r[8]=d*f+m*x+g*T,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],h=e[7],c=e[8];return t*a*c-t*o*h-n*r*c+n*o*l+s*r*h-s*a*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],h=e[7],c=e[8],u=c*a-o*h,d=o*l-c*r,m=h*r-a*l,g=t*u+n*d+s*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let v=1/g;return e[0]=u*v,e[1]=(s*h-c*n)*v,e[2]=(o*n-s*a)*v,e[3]=d*v,e[4]=(c*t-s*l)*v,e[5]=(s*r-o*t)*v,e[6]=m*v,e[7]=(n*l-h*t)*v,e[8]=(a*t-n*r)*v,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){let l=Math.cos(r),h=Math.sin(r);return this.set(n*l,n*h,-n*(l*a+h*o)+a+e,-s*h,s*l,-s*(-h*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(_c.makeScale(e,t)),this}rotate(e){return this.premultiply(_c.makeRotation(-e)),this}translate(e,t){return this.premultiply(_c.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},_c=new Ue;function ap(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Go(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function c0(){let i=Go("canvas");return i.style.display="block",i}var Qd={};function _a(i){i in Qd||(Qd[i]=!0,console.warn(i))}function h0(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}function u0(i){let e=i.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function d0(i){let e=i.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var it={enabled:!0,workingColorSpace:kr,spaces:{},convert:function(i,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===xt&&(i.r=ki(i.r),i.g=ki(i.g),i.b=ki(i.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(i.applyMatrix3(this.spaces[e].toXYZ),i.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===xt&&(i.r=Mr(i.r),i.g=Mr(i.g),i.b=Mr(i.b))),i},fromWorkingColorSpace:function(i,e){return this.convert(i,this.workingColorSpace,e)},toWorkingColorSpace:function(i,e){return this.convert(i,e,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===is?hl:this.spaces[i].transfer},getLuminanceCoefficients:function(i,e=this.workingColorSpace){return i.fromArray(this.spaces[e].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,e,t){return i.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function ki(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Mr(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var ef=[.64,.33,.3,.6,.15,.06],tf=[.2126,.7152,.0722],nf=[.3127,.329],sf=new Ue().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),rf=new Ue().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);it.define({[kr]:{primaries:ef,whitePoint:nf,transfer:hl,toXYZ:sf,fromXYZ:rf,luminanceCoefficients:tf,workingColorSpaceConfig:{unpackColorSpace:Un},outputColorSpaceConfig:{drawingBufferColorSpace:Un}},[Un]:{primaries:ef,whitePoint:nf,transfer:xt,toXYZ:sf,fromXYZ:rf,luminanceCoefficients:tf,outputColorSpaceConfig:{drawingBufferColorSpace:Un}}});var rr,kh=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{rr===void 0&&(rr=Go("canvas")),rr.width=e.width,rr.height=e.height;let n=rr.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=rr}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Go("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=ki(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(ki(t[n]/255)*255):t[n]=ki(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},f0=0,Wo=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:f0++}),this.uuid=Ra(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(bc(s[a].image)):r.push(bc(s[a]))}else r=bc(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function bc(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?kh.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var p0=0,Tn=class i extends os{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=Is,s=Is,r=ui,a=Ls,o=Zn,l=Ui,h=i.DEFAULT_ANISOTROPY,c=is){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:p0++}),this.uuid=Ra(),this.name="",this.source=new Wo(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=h,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Xe(0,0),this.repeat=new Xe(1,1),this.center=new Xe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ue,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=c,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Kf)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case rh:e.x=e.x-Math.floor(e.x);break;case Is:e.x=e.x<0?0:1;break;case ah:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case rh:e.y=e.y-Math.floor(e.y);break;case Is:e.y=e.y<0?0:1;break;case ah:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Tn.DEFAULT_IMAGE=null;Tn.DEFAULT_MAPPING=Kf;Tn.DEFAULT_ANISOTROPY=1;var yt=class i{constructor(e=0,t=0,n=0,s=1){i.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,h=l[0],c=l[4],u=l[8],d=l[1],m=l[5],g=l[9],v=l[2],p=l[6],f=l[10];if(Math.abs(c-d)<.01&&Math.abs(u-v)<.01&&Math.abs(g-p)<.01){if(Math.abs(c+d)<.1&&Math.abs(u+v)<.1&&Math.abs(g+p)<.1&&Math.abs(h+m+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let S=(h+1)/2,x=(m+1)/2,I=(f+1)/2,R=(c+d)/4,T=(u+v)/4,C=(g+p)/4;return S>x&&S>I?S<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(S),s=R/n,r=T/n):x>I?x<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(x),n=R/s,r=C/s):I<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(I),n=T/r,s=C/r),this.set(n,s,r,t),this}let w=Math.sqrt((p-g)*(p-g)+(u-v)*(u-v)+(d-c)*(d-c));return Math.abs(w)<.001&&(w=1),this.x=(p-g)/w,this.y=(u-v)/w,this.z=(d-c)/w,this.w=Math.acos((h+m+f-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Uh=class extends os{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new yt(0,0,e,t),this.scissorTest=!1,this.viewport=new yt(0,0,e,t);let s={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:ui,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new Tn(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,s=e.textures.length;n<s;n++)this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new Wo(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Fi=class extends Uh{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},qo=class extends Tn{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Sn,this.minFilter=Sn,this.wrapR=Is,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Fh=class extends Tn{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Sn,this.minFilter=Sn,this.wrapR=Is,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ln=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let l=n[s+0],h=n[s+1],c=n[s+2],u=n[s+3],d=r[a+0],m=r[a+1],g=r[a+2],v=r[a+3];if(o===0){e[t+0]=l,e[t+1]=h,e[t+2]=c,e[t+3]=u;return}if(o===1){e[t+0]=d,e[t+1]=m,e[t+2]=g,e[t+3]=v;return}if(u!==v||l!==d||h!==m||c!==g){let p=1-o,f=l*d+h*m+c*g+u*v,w=f>=0?1:-1,S=1-f*f;if(S>Number.EPSILON){let I=Math.sqrt(S),R=Math.atan2(I,f*w);p=Math.sin(p*R)/I,o=Math.sin(o*R)/I}let x=o*w;if(l=l*p+d*x,h=h*p+m*x,c=c*p+g*x,u=u*p+v*x,p===1-o){let I=1/Math.sqrt(l*l+h*h+c*c+u*u);l*=I,h*=I,c*=I,u*=I}}e[t]=l,e[t+1]=h,e[t+2]=c,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,s,r,a){let o=n[s],l=n[s+1],h=n[s+2],c=n[s+3],u=r[a],d=r[a+1],m=r[a+2],g=r[a+3];return e[t]=o*g+c*u+l*m-h*d,e[t+1]=l*g+c*d+h*u-o*m,e[t+2]=h*g+c*m+o*d-l*u,e[t+3]=c*g-o*u-l*d-h*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,h=o(n/2),c=o(s/2),u=o(r/2),d=l(n/2),m=l(s/2),g=l(r/2);switch(a){case"XYZ":this._x=d*c*u+h*m*g,this._y=h*m*u-d*c*g,this._z=h*c*g+d*m*u,this._w=h*c*u-d*m*g;break;case"YXZ":this._x=d*c*u+h*m*g,this._y=h*m*u-d*c*g,this._z=h*c*g-d*m*u,this._w=h*c*u+d*m*g;break;case"ZXY":this._x=d*c*u-h*m*g,this._y=h*m*u+d*c*g,this._z=h*c*g+d*m*u,this._w=h*c*u-d*m*g;break;case"ZYX":this._x=d*c*u-h*m*g,this._y=h*m*u+d*c*g,this._z=h*c*g-d*m*u,this._w=h*c*u+d*m*g;break;case"YZX":this._x=d*c*u+h*m*g,this._y=h*m*u+d*c*g,this._z=h*c*g-d*m*u,this._w=h*c*u-d*m*g;break;case"XZY":this._x=d*c*u-h*m*g,this._y=h*m*u-d*c*g,this._z=h*c*g+d*m*u,this._w=h*c*u+d*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],h=t[2],c=t[6],u=t[10],d=n+o+u;if(d>0){let m=.5/Math.sqrt(d+1);this._w=.25/m,this._x=(c-l)*m,this._y=(r-h)*m,this._z=(a-s)*m}else if(n>o&&n>u){let m=2*Math.sqrt(1+n-o-u);this._w=(c-l)/m,this._x=.25*m,this._y=(s+a)/m,this._z=(r+h)/m}else if(o>u){let m=2*Math.sqrt(1+o-n-u);this._w=(r-h)/m,this._x=(s+a)/m,this._y=.25*m,this._z=(l+c)/m}else{let m=2*Math.sqrt(1+u-n-o);this._w=(a-s)/m,this._x=(r+h)/m,this._y=(l+c)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(vn(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,h=t._z,c=t._w;return this._x=n*c+a*o+s*h-r*l,this._y=s*c+a*l+r*o-n*h,this._z=r*c+a*h+n*l-s*o,this._w=a*c-n*o-s*l-r*h,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,s=this._y,r=this._z,a=this._w,o=a*e._w+n*e._x+s*e._y+r*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=s,this._z=r,this;let l=1-o*o;if(l<=Number.EPSILON){let m=1-t;return this._w=m*a+t*this._w,this._x=m*n+t*this._x,this._y=m*s+t*this._y,this._z=m*r+t*this._z,this.normalize(),this}let h=Math.sqrt(l),c=Math.atan2(h,o),u=Math.sin((1-t)*c)/h,d=Math.sin(t*c)/h;return this._w=a*u+this._w*d,this._x=n*u+this._x*d,this._y=s*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},D=class i{constructor(e=0,t=0,n=0){i.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(af.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(af.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,h=2*(a*s-o*n),c=2*(o*t-r*s),u=2*(r*n-a*t);return this.x=t+l*h+a*u-o*c,this.y=n+l*c+o*h-r*u,this.z=s+l*u+r*c-a*h,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Mc.copy(this).projectOnVector(e),this.sub(Mc)}reflect(e){return this.sub(Mc.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(vn(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Mc=new D,af=new ln,Bi=class{constructor(e=new D(1/0,1/0,1/0),t=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Xn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Xn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Xn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Xn):Xn.fromBufferAttribute(r,a),Xn.applyMatrix4(e.matrixWorld),this.expandByPoint(Xn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),po.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),po.copy(n.boundingBox)),po.applyMatrix4(e.matrixWorld),this.union(po)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Xn),Xn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(fa),mo.subVectors(this.max,fa),ar.subVectors(e.a,fa),or.subVectors(e.b,fa),lr.subVectors(e.c,fa),Ji.subVectors(or,ar),ji.subVectors(lr,or),bs.subVectors(ar,lr);let t=[0,-Ji.z,Ji.y,0,-ji.z,ji.y,0,-bs.z,bs.y,Ji.z,0,-Ji.x,ji.z,0,-ji.x,bs.z,0,-bs.x,-Ji.y,Ji.x,0,-ji.y,ji.x,0,-bs.y,bs.x,0];return!wc(t,ar,or,lr,mo)||(t=[1,0,0,0,1,0,0,0,1],!wc(t,ar,or,lr,mo))?!1:(go.crossVectors(Ji,ji),t=[go.x,go.y,go.z],wc(t,ar,or,lr,mo))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Xn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Xn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Ei[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Ei[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Ei[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Ei[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Ei[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Ei[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Ei[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Ei[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Ei),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},Ei=[new D,new D,new D,new D,new D,new D,new D,new D],Xn=new D,po=new Bi,ar=new D,or=new D,lr=new D,Ji=new D,ji=new D,bs=new D,fa=new D,mo=new D,go=new D,Ms=new D;function wc(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Ms.fromArray(i,r);let o=s.x*Math.abs(Ms.x)+s.y*Math.abs(Ms.y)+s.z*Math.abs(Ms.z),l=e.dot(Ms),h=t.dot(Ms),c=n.dot(Ms);if(Math.max(-Math.max(l,h,c),Math.min(l,h,c))>o)return!1}return!0}var m0=new Bi,pa=new D,Sc=new D,ks=class{constructor(e=new D,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):m0.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;pa.subVectors(e,this.center);let t=pa.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(pa,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Sc.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(pa.copy(e.center).add(Sc)),this.expandByPoint(pa.copy(e.center).sub(Sc))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},Ci=new D,Ac=new D,vo=new D,Qi=new D,Tc=new D,xo=new D,Ec=new D,Bh=class{constructor(e=new D,t=new D(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Ci)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Ci.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Ci.copy(this.origin).addScaledVector(this.direction,t),Ci.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Ac.copy(e).add(t).multiplyScalar(.5),vo.copy(t).sub(e).normalize(),Qi.copy(this.origin).sub(Ac);let r=e.distanceTo(t)*.5,a=-this.direction.dot(vo),o=Qi.dot(this.direction),l=-Qi.dot(vo),h=Qi.lengthSq(),c=Math.abs(1-a*a),u,d,m,g;if(c>0)if(u=a*l-o,d=a*o-l,g=r*c,u>=0)if(d>=-g)if(d<=g){let v=1/c;u*=v,d*=v,m=u*(u+a*d+2*o)+d*(a*u+d+2*l)+h}else d=r,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+h;else d=-r,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+h;else d<=-g?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-l),r),m=-u*u+d*(d+2*l)+h):d<=g?(u=0,d=Math.min(Math.max(-r,-l),r),m=d*(d+2*l)+h):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-l),r),m=-u*u+d*(d+2*l)+h);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+h;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(Ac).addScaledVector(vo,d),m}intersectSphere(e,t){Ci.subVectors(e.center,this.origin);let n=Ci.dot(this.direction),s=Ci.dot(Ci)-n*n,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,l,h=1/this.direction.x,c=1/this.direction.y,u=1/this.direction.z,d=this.origin;return h>=0?(n=(e.min.x-d.x)*h,s=(e.max.x-d.x)*h):(n=(e.max.x-d.x)*h,s=(e.min.x-d.x)*h),c>=0?(r=(e.min.y-d.y)*c,a=(e.max.y-d.y)*c):(r=(e.max.y-d.y)*c,a=(e.min.y-d.y)*c),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,Ci)!==null}intersectTriangle(e,t,n,s,r){Tc.subVectors(t,e),xo.subVectors(n,e),Ec.crossVectors(Tc,xo);let a=this.direction.dot(Ec),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Qi.subVectors(this.origin,e);let l=o*this.direction.dot(xo.crossVectors(Qi,xo));if(l<0)return null;let h=o*this.direction.dot(Tc.cross(Qi));if(h<0||l+h>a)return null;let c=-o*Qi.dot(Ec);return c<0?null:this.at(c/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ge=class i{constructor(e,t,n,s,r,a,o,l,h,c,u,d,m,g,v,p){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,h,c,u,d,m,g,v,p)}set(e,t,n,s,r,a,o,l,h,c,u,d,m,g,v,p){let f=this.elements;return f[0]=e,f[4]=t,f[8]=n,f[12]=s,f[1]=r,f[5]=a,f[9]=o,f[13]=l,f[2]=h,f[6]=c,f[10]=u,f[14]=d,f[3]=m,f[7]=g,f[11]=v,f[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,s=1/cr.setFromMatrixColumn(e,0).length(),r=1/cr.setFromMatrixColumn(e,1).length(),a=1/cr.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),h=Math.sin(s),c=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=a*c,m=a*u,g=o*c,v=o*u;t[0]=l*c,t[4]=-l*u,t[8]=h,t[1]=m+g*h,t[5]=d-v*h,t[9]=-o*l,t[2]=v-d*h,t[6]=g+m*h,t[10]=a*l}else if(e.order==="YXZ"){let d=l*c,m=l*u,g=h*c,v=h*u;t[0]=d+v*o,t[4]=g*o-m,t[8]=a*h,t[1]=a*u,t[5]=a*c,t[9]=-o,t[2]=m*o-g,t[6]=v+d*o,t[10]=a*l}else if(e.order==="ZXY"){let d=l*c,m=l*u,g=h*c,v=h*u;t[0]=d-v*o,t[4]=-a*u,t[8]=g+m*o,t[1]=m+g*o,t[5]=a*c,t[9]=v-d*o,t[2]=-a*h,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let d=a*c,m=a*u,g=o*c,v=o*u;t[0]=l*c,t[4]=g*h-m,t[8]=d*h+v,t[1]=l*u,t[5]=v*h+d,t[9]=m*h-g,t[2]=-h,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let d=a*l,m=a*h,g=o*l,v=o*h;t[0]=l*c,t[4]=v-d*u,t[8]=g*u+m,t[1]=u,t[5]=a*c,t[9]=-o*c,t[2]=-h*c,t[6]=m*u+g,t[10]=d-v*u}else if(e.order==="XZY"){let d=a*l,m=a*h,g=o*l,v=o*h;t[0]=l*c,t[4]=-u,t[8]=h*c,t[1]=d*u+v,t[5]=a*c,t[9]=m*u-g,t[2]=g*u-m,t[6]=o*c,t[10]=v*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(g0,e,v0)}lookAt(e,t,n){let s=this.elements;return Mn.subVectors(e,t),Mn.lengthSq()===0&&(Mn.z=1),Mn.normalize(),es.crossVectors(n,Mn),es.lengthSq()===0&&(Math.abs(n.z)===1?Mn.x+=1e-4:Mn.z+=1e-4,Mn.normalize(),es.crossVectors(n,Mn)),es.normalize(),yo.crossVectors(Mn,es),s[0]=es.x,s[4]=yo.x,s[8]=Mn.x,s[1]=es.y,s[5]=yo.y,s[9]=Mn.y,s[2]=es.z,s[6]=yo.z,s[10]=Mn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],h=n[12],c=n[1],u=n[5],d=n[9],m=n[13],g=n[2],v=n[6],p=n[10],f=n[14],w=n[3],S=n[7],x=n[11],I=n[15],R=s[0],T=s[4],C=s[8],y=s[12],_=s[1],L=s[5],N=s[9],P=s[13],F=s[2],H=s[6],O=s[10],Z=s[14],G=s[3],ae=s[7],ee=s[11],ve=s[15];return r[0]=a*R+o*_+l*F+h*G,r[4]=a*T+o*L+l*H+h*ae,r[8]=a*C+o*N+l*O+h*ee,r[12]=a*y+o*P+l*Z+h*ve,r[1]=c*R+u*_+d*F+m*G,r[5]=c*T+u*L+d*H+m*ae,r[9]=c*C+u*N+d*O+m*ee,r[13]=c*y+u*P+d*Z+m*ve,r[2]=g*R+v*_+p*F+f*G,r[6]=g*T+v*L+p*H+f*ae,r[10]=g*C+v*N+p*O+f*ee,r[14]=g*y+v*P+p*Z+f*ve,r[3]=w*R+S*_+x*F+I*G,r[7]=w*T+S*L+x*H+I*ae,r[11]=w*C+S*N+x*O+I*ee,r[15]=w*y+S*P+x*Z+I*ve,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],h=e[13],c=e[2],u=e[6],d=e[10],m=e[14],g=e[3],v=e[7],p=e[11],f=e[15];return g*(+r*l*u-s*h*u-r*o*d+n*h*d+s*o*m-n*l*m)+v*(+t*l*m-t*h*d+r*a*d-s*a*m+s*h*c-r*l*c)+p*(+t*h*u-t*o*m-r*a*u+n*a*m+r*o*c-n*h*c)+f*(-s*o*c-t*l*u+t*o*d+s*a*u-n*a*d+n*l*c)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],h=e[7],c=e[8],u=e[9],d=e[10],m=e[11],g=e[12],v=e[13],p=e[14],f=e[15],w=u*p*h-v*d*h+v*l*m-o*p*m-u*l*f+o*d*f,S=g*d*h-c*p*h-g*l*m+a*p*m+c*l*f-a*d*f,x=c*v*h-g*u*h+g*o*m-a*v*m-c*o*f+a*u*f,I=g*u*l-c*v*l-g*o*d+a*v*d+c*o*p-a*u*p,R=t*w+n*S+s*x+r*I;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let T=1/R;return e[0]=w*T,e[1]=(v*d*r-u*p*r-v*s*m+n*p*m+u*s*f-n*d*f)*T,e[2]=(o*p*r-v*l*r+v*s*h-n*p*h-o*s*f+n*l*f)*T,e[3]=(u*l*r-o*d*r-u*s*h+n*d*h+o*s*m-n*l*m)*T,e[4]=S*T,e[5]=(c*p*r-g*d*r+g*s*m-t*p*m-c*s*f+t*d*f)*T,e[6]=(g*l*r-a*p*r-g*s*h+t*p*h+a*s*f-t*l*f)*T,e[7]=(a*d*r-c*l*r+c*s*h-t*d*h-a*s*m+t*l*m)*T,e[8]=x*T,e[9]=(g*u*r-c*v*r-g*n*m+t*v*m+c*n*f-t*u*f)*T,e[10]=(a*v*r-g*o*r+g*n*h-t*v*h-a*n*f+t*o*f)*T,e[11]=(c*o*r-a*u*r-c*n*h+t*u*h+a*n*m-t*o*m)*T,e[12]=I*T,e[13]=(c*v*s-g*u*s+g*n*d-t*v*d-c*n*p+t*u*p)*T,e[14]=(g*o*s-a*v*s-g*n*l+t*v*l+a*n*p-t*o*p)*T,e[15]=(a*u*s-c*o*s+c*n*l-t*u*l-a*n*d+t*o*d)*T,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,h=r*a,c=r*o;return this.set(h*a+n,h*o-s*l,h*l+s*o,0,h*o+s*l,c*o+n,c*l-s*a,0,h*l-s*o,c*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,h=r+r,c=a+a,u=o+o,d=r*h,m=r*c,g=r*u,v=a*c,p=a*u,f=o*u,w=l*h,S=l*c,x=l*u,I=n.x,R=n.y,T=n.z;return s[0]=(1-(v+f))*I,s[1]=(m+x)*I,s[2]=(g-S)*I,s[3]=0,s[4]=(m-x)*R,s[5]=(1-(d+f))*R,s[6]=(p+w)*R,s[7]=0,s[8]=(g+S)*T,s[9]=(p-w)*T,s[10]=(1-(d+v))*T,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements,r=cr.set(s[0],s[1],s[2]).length(),a=cr.set(s[4],s[5],s[6]).length(),o=cr.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],Yn.copy(this);let h=1/r,c=1/a,u=1/o;return Yn.elements[0]*=h,Yn.elements[1]*=h,Yn.elements[2]*=h,Yn.elements[4]*=c,Yn.elements[5]*=c,Yn.elements[6]*=c,Yn.elements[8]*=u,Yn.elements[9]*=u,Yn.elements[10]*=u,t.setFromRotationMatrix(Yn),n.x=r,n.y=a,n.z=o,this}makePerspective(e,t,n,s,r,a,o=Ni){let l=this.elements,h=2*r/(t-e),c=2*r/(n-s),u=(t+e)/(t-e),d=(n+s)/(n-s),m,g;if(o===Ni)m=-(a+r)/(a-r),g=-2*a*r/(a-r);else if(o===Vo)m=-a/(a-r),g=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=c,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=Ni){let l=this.elements,h=1/(t-e),c=1/(n-s),u=1/(a-r),d=(t+e)*h,m=(n+s)*c,g,v;if(o===Ni)g=(a+r)*u,v=-2*u;else if(o===Vo)g=r*u,v=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*h,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*c,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=v,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},cr=new D,Yn=new Ge,g0=new D(0,0,0),v0=new D(1,1,1),es=new D,yo=new D,Mn=new D,of=new Ge,lf=new ln,$t=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],h=s[5],c=s[9],u=s[2],d=s[6],m=s[10];switch(t){case"XYZ":this._y=Math.asin(vn(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-c,m),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,h),this._z=0);break;case"YXZ":this._x=Math.asin(-vn(c,-1,1)),Math.abs(c)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(l,h)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(vn(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,m),this._z=Math.atan2(-a,h)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-vn(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,h));break;case"YZX":this._z=Math.asin(vn(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-c,h),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-vn(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,h),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-c,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return of.makeRotationFromQuaternion(e),this.setFromRotationMatrix(of,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return lf.setFromEuler(this),this.setFromQuaternion(lf,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};$t.DEFAULT_ORDER="XYZ";var $o=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},x0=0,cf=new D,hr=new ln,Ri=new Ge,_o=new D,ma=new D,y0=new D,_0=new ln,hf=new D(1,0,0),uf=new D(0,1,0),df=new D(0,0,1),ff={type:"added"},b0={type:"removed"},ur={type:"childadded",child:null},Cc={type:"childremoved",child:null},un=class i extends os{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:x0++}),this.uuid=Ra(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new D,t=new $t,n=new ln,s=new D(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Ge},normalMatrix:{value:new Ue}}),this.matrix=new Ge,this.matrixWorld=new Ge,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new $o,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return hr.setFromAxisAngle(e,t),this.quaternion.multiply(hr),this}rotateOnWorldAxis(e,t){return hr.setFromAxisAngle(e,t),this.quaternion.premultiply(hr),this}rotateX(e){return this.rotateOnAxis(hf,e)}rotateY(e){return this.rotateOnAxis(uf,e)}rotateZ(e){return this.rotateOnAxis(df,e)}translateOnAxis(e,t){return cf.copy(e).applyQuaternion(this.quaternion),this.position.add(cf.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(hf,e)}translateY(e){return this.translateOnAxis(uf,e)}translateZ(e){return this.translateOnAxis(df,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Ri.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?_o.copy(e):_o.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),ma.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ri.lookAt(ma,_o,this.up):Ri.lookAt(_o,ma,this.up),this.quaternion.setFromRotationMatrix(Ri),s&&(Ri.extractRotation(s.matrixWorld),hr.setFromRotationMatrix(Ri),this.quaternion.premultiply(hr.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(ff),ur.child=e,this.dispatchEvent(ur),ur.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(b0),Cc.child=e,this.dispatchEvent(Cc),Cc.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Ri.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Ri.multiply(e.parent.matrixWorld)),e.applyMatrix4(Ri),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(ff),ur.child=e,this.dispatchEvent(ur),ur.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ma,e,y0),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ma,_0,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let h=0,c=l.length;h<c;h++){let u=l[h];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,h=this.material.length;l<h;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),h=a(e.textures),c=a(e.images),u=a(e.shapes),d=a(e.skeletons),m=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),h.length>0&&(n.textures=h),c.length>0&&(n.images=c),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){let l=[];for(let h in o){let c=o[h];delete c.metadata,l.push(c)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}};un.DEFAULT_UP=new D(0,1,0);un.DEFAULT_MATRIX_AUTO_UPDATE=!0;un.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Kn=new D,Pi=new D,Rc=new D,Ii=new D,dr=new D,fr=new D,pf=new D,Pc=new D,Ic=new D,Lc=new D,Dc=new yt,Nc=new yt,kc=new yt,Rs=class i{constructor(e=new D,t=new D,n=new D){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),Kn.subVectors(e,t),s.cross(Kn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){Kn.subVectors(s,t),Pi.subVectors(n,t),Rc.subVectors(e,t);let a=Kn.dot(Kn),o=Kn.dot(Pi),l=Kn.dot(Rc),h=Pi.dot(Pi),c=Pi.dot(Rc),u=a*h-o*o;if(u===0)return r.set(0,0,0),null;let d=1/u,m=(h*l-o*c)*d,g=(a*c-o*l)*d;return r.set(1-m-g,g,m)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,Ii)===null?!1:Ii.x>=0&&Ii.y>=0&&Ii.x+Ii.y<=1}static getInterpolation(e,t,n,s,r,a,o,l){return this.getBarycoord(e,t,n,s,Ii)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Ii.x),l.addScaledVector(a,Ii.y),l.addScaledVector(o,Ii.z),l)}static getInterpolatedAttribute(e,t,n,s,r,a){return Dc.setScalar(0),Nc.setScalar(0),kc.setScalar(0),Dc.fromBufferAttribute(e,t),Nc.fromBufferAttribute(e,n),kc.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(Dc,r.x),a.addScaledVector(Nc,r.y),a.addScaledVector(kc,r.z),a}static isFrontFacing(e,t,n,s){return Kn.subVectors(n,t),Pi.subVectors(e,t),Kn.cross(Pi).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Kn.subVectors(this.c,this.b),Pi.subVectors(this.a,this.b),Kn.cross(Pi).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,a,o;dr.subVectors(s,n),fr.subVectors(r,n),Pc.subVectors(e,n);let l=dr.dot(Pc),h=fr.dot(Pc);if(l<=0&&h<=0)return t.copy(n);Ic.subVectors(e,s);let c=dr.dot(Ic),u=fr.dot(Ic);if(c>=0&&u<=c)return t.copy(s);let d=l*u-c*h;if(d<=0&&l>=0&&c<=0)return a=l/(l-c),t.copy(n).addScaledVector(dr,a);Lc.subVectors(e,r);let m=dr.dot(Lc),g=fr.dot(Lc);if(g>=0&&m<=g)return t.copy(r);let v=m*h-l*g;if(v<=0&&h>=0&&g<=0)return o=h/(h-g),t.copy(n).addScaledVector(fr,o);let p=c*g-m*u;if(p<=0&&u-c>=0&&m-g>=0)return pf.subVectors(r,s),o=(u-c)/(u-c+(m-g)),t.copy(s).addScaledVector(pf,o);let f=1/(p+v+d);return a=v*f,o=d*f,t.copy(n).addScaledVector(dr,a).addScaledVector(fr,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},op={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ts={h:0,s:0,l:0},bo={h:0,s:0,l:0};function Uc(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var le=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Un){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,it.toWorkingColorSpace(this,t),this}setRGB(e,t,n,s=it.workingColorSpace){return this.r=e,this.g=t,this.b=n,it.toWorkingColorSpace(this,s),this}setHSL(e,t,n,s=it.workingColorSpace){if(e=l0(e,1),t=vn(t,0,1),n=vn(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Uc(a,r,e+1/3),this.g=Uc(a,r,e),this.b=Uc(a,r,e-1/3)}return it.toWorkingColorSpace(this,s),this}setStyle(e,t=Un){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Un){let n=op[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=ki(e.r),this.g=ki(e.g),this.b=ki(e.b),this}copyLinearToSRGB(e){return this.r=Mr(e.r),this.g=Mr(e.g),this.b=Mr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Un){return it.fromWorkingColorSpace(on.copy(this),e),Math.round(vn(on.r*255,0,255))*65536+Math.round(vn(on.g*255,0,255))*256+Math.round(vn(on.b*255,0,255))}getHexString(e=Un){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=it.workingColorSpace){it.fromWorkingColorSpace(on.copy(this),t);let n=on.r,s=on.g,r=on.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,h,c=(o+a)/2;if(o===a)l=0,h=0;else{let u=a-o;switch(h=c<=.5?u/(a+o):u/(2-a-o),a){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return e.h=l,e.s=h,e.l=c,e}getRGB(e,t=it.workingColorSpace){return it.fromWorkingColorSpace(on.copy(this),t),e.r=on.r,e.g=on.g,e.b=on.b,e}getStyle(e=Un){it.fromWorkingColorSpace(on.copy(this),e);let t=on.r,n=on.g,s=on.b;return e!==Un?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(ts),this.setHSL(ts.h+e,ts.s+t,ts.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(ts),e.getHSL(bo);let n=yc(ts.h,bo.h,t),s=yc(ts.s,bo.s,t),r=yc(ts.l,bo.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},on=new le;le.NAMES=op;var M0=0,ls=class extends os{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:M0++}),this.uuid=Ra(),this.name="",this.blending=_r,this.side=as,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Yc,this.blendDst=Kc,this.blendEquation=Cs,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new le(0,0,0),this.blendAlpha=0,this.depthFunc=Sr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Zd,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=sr,this.stencilZFail=sr,this.stencilZPass=sr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==_r&&(n.blending=this.blending),this.side!==as&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Yc&&(n.blendSrc=this.blendSrc),this.blendDst!==Kc&&(n.blendDst=this.blendDst),this.blendEquation!==Cs&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Sr&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Zd&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==sr&&(n.stencilFail=this.stencilFail),this.stencilZFail!==sr&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==sr&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},Qt=class extends ls{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new le(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new $t,this.combine=ll,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Vt=new D,Mo=new Xe,An=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Jd,this.updateRanges=[],this.gpuType=di,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Mo.fromBufferAttribute(this,t),Mo.applyMatrix3(e),this.setXY(t,Mo.x,Mo.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Vt.fromBufferAttribute(this,t),Vt.applyMatrix3(e),this.setXYZ(t,Vt.x,Vt.y,Vt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Vt.fromBufferAttribute(this,t),Vt.applyMatrix4(e),this.setXYZ(t,Vt.x,Vt.y,Vt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Vt.fromBufferAttribute(this,t),Vt.applyNormalMatrix(e),this.setXYZ(t,Vt.x,Vt.y,Vt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Vt.fromBufferAttribute(this,t),Vt.transformDirection(e),this.setXYZ(t,Vt.x,Vt.y,Vt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=da(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=gn(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=da(t,this.array)),t}setX(e,t){return this.normalized&&(t=gn(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=da(t,this.array)),t}setY(e,t){return this.normalized&&(t=gn(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=da(t,this.array)),t}setZ(e,t){return this.normalized&&(t=gn(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=da(t,this.array)),t}setW(e,t){return this.normalized&&(t=gn(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=gn(t,this.array),n=gn(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=gn(t,this.array),n=gn(n,this.array),s=gn(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=gn(t,this.array),n=gn(n,this.array),s=gn(s,this.array),r=gn(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Jd&&(e.usage=this.usage),e}};var Rr=class extends An{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Xo=class extends An{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var st=class extends An{constructor(e,t,n){super(new Float32Array(e),t,n)}},w0=0,kn=new Ge,Fc=new un,pr=new D,wn=new Bi,ga=new Bi,Jt=new D,nn=class i extends os{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:w0++}),this.uuid=Ra(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(ap(e)?Xo:Rr)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Ue().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return kn.makeRotationFromQuaternion(e),this.applyMatrix4(kn),this}rotateX(e){return kn.makeRotationX(e),this.applyMatrix4(kn),this}rotateY(e){return kn.makeRotationY(e),this.applyMatrix4(kn),this}rotateZ(e){return kn.makeRotationZ(e),this.applyMatrix4(kn),this}translate(e,t,n){return kn.makeTranslation(e,t,n),this.applyMatrix4(kn),this}scale(e,t,n){return kn.makeScale(e,t,n),this.applyMatrix4(kn),this}lookAt(e){return Fc.lookAt(e),Fc.updateMatrix(),this.applyMatrix4(Fc.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(pr).negate(),this.translate(pr.x,pr.y,pr.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new st(n,3))}else{for(let n=0,s=t.count;n<s;n++){let r=e[n];t.setXYZ(n,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Bi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];wn.setFromBufferAttribute(r),this.morphTargetsRelative?(Jt.addVectors(this.boundingBox.min,wn.min),this.boundingBox.expandByPoint(Jt),Jt.addVectors(this.boundingBox.max,wn.max),this.boundingBox.expandByPoint(Jt)):(this.boundingBox.expandByPoint(wn.min),this.boundingBox.expandByPoint(wn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ks);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new D,1/0);return}if(e){let n=this.boundingSphere.center;if(wn.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];ga.setFromBufferAttribute(o),this.morphTargetsRelative?(Jt.addVectors(wn.min,ga.min),wn.expandByPoint(Jt),Jt.addVectors(wn.max,ga.max),wn.expandByPoint(Jt)):(wn.expandByPoint(ga.min),wn.expandByPoint(ga.max))}wn.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)Jt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Jt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let h=0,c=o.count;h<c;h++)Jt.fromBufferAttribute(o,h),l&&(pr.fromBufferAttribute(e,h),Jt.add(pr)),s=Math.max(s,n.distanceToSquared(Jt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new An(new Float32Array(4*n.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let C=0;C<n.count;C++)o[C]=new D,l[C]=new D;let h=new D,c=new D,u=new D,d=new Xe,m=new Xe,g=new Xe,v=new D,p=new D;function f(C,y,_){h.fromBufferAttribute(n,C),c.fromBufferAttribute(n,y),u.fromBufferAttribute(n,_),d.fromBufferAttribute(r,C),m.fromBufferAttribute(r,y),g.fromBufferAttribute(r,_),c.sub(h),u.sub(h),m.sub(d),g.sub(d);let L=1/(m.x*g.y-g.x*m.y);isFinite(L)&&(v.copy(c).multiplyScalar(g.y).addScaledVector(u,-m.y).multiplyScalar(L),p.copy(u).multiplyScalar(m.x).addScaledVector(c,-g.x).multiplyScalar(L),o[C].add(v),o[y].add(v),o[_].add(v),l[C].add(p),l[y].add(p),l[_].add(p))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let C=0,y=w.length;C<y;++C){let _=w[C],L=_.start,N=_.count;for(let P=L,F=L+N;P<F;P+=3)f(e.getX(P+0),e.getX(P+1),e.getX(P+2))}let S=new D,x=new D,I=new D,R=new D;function T(C){I.fromBufferAttribute(s,C),R.copy(I);let y=o[C];S.copy(y),S.sub(I.multiplyScalar(I.dot(y))).normalize(),x.crossVectors(R,y);let L=x.dot(l[C])<0?-1:1;a.setXYZW(C,S.x,S.y,S.z,L)}for(let C=0,y=w.length;C<y;++C){let _=w[C],L=_.start,N=_.count;for(let P=L,F=L+N;P<F;P+=3)T(e.getX(P+0)),T(e.getX(P+1)),T(e.getX(P+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new An(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,m=n.count;d<m;d++)n.setXYZ(d,0,0,0);let s=new D,r=new D,a=new D,o=new D,l=new D,h=new D,c=new D,u=new D;if(e)for(let d=0,m=e.count;d<m;d+=3){let g=e.getX(d+0),v=e.getX(d+1),p=e.getX(d+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,v),a.fromBufferAttribute(t,p),c.subVectors(a,r),u.subVectors(s,r),c.cross(u),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,v),h.fromBufferAttribute(n,p),o.add(c),l.add(c),h.add(c),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(v,l.x,l.y,l.z),n.setXYZ(p,h.x,h.y,h.z)}else for(let d=0,m=t.count;d<m;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),c.subVectors(a,r),u.subVectors(s,r),c.cross(u),n.setXYZ(d+0,c.x,c.y,c.z),n.setXYZ(d+1,c.x,c.y,c.z),n.setXYZ(d+2,c.x,c.y,c.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Jt.fromBufferAttribute(e,t),Jt.normalize(),e.setXYZ(t,Jt.x,Jt.y,Jt.z)}toNonIndexed(){function e(o,l){let h=o.array,c=o.itemSize,u=o.normalized,d=new h.constructor(l.length*c),m=0,g=0;for(let v=0,p=l.length;v<p;v++){o.isInterleavedBufferAttribute?m=l[v]*o.data.stride+o.offset:m=l[v]*c;for(let f=0;f<c;f++)d[g++]=h[m++]}return new An(d,c,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],h=e(l,n);t.setAttribute(o,h)}let r=this.morphAttributes;for(let o in r){let l=[],h=r[o];for(let c=0,u=h.length;c<u;c++){let d=h[c],m=e(d,n);l.push(m)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let h=a[o];t.addGroup(h.start,h.count,h.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let h in l)l[h]!==void 0&&(e[h]=l[h]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let h=n[l];e.data.attributes[l]=h.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let h=this.morphAttributes[l],c=[];for(let u=0,d=h.length;u<d;u++){let m=h[u];c.push(m.toJSON(e.data))}c.length>0&&(s[l]=c,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone(t));let s=e.attributes;for(let h in s){let c=s[h];this.setAttribute(h,c.clone(t))}let r=e.morphAttributes;for(let h in r){let c=[],u=r[h];for(let d=0,m=u.length;d<m;d++)c.push(u[d].clone(t));this.morphAttributes[h]=c}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let h=0,c=a.length;h<c;h++){let u=a[h];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},mf=new Ge,ws=new Bh,wo=new ks,gf=new D,So=new D,Ao=new D,To=new D,Bc=new D,Eo=new D,vf=new D,Co=new D,Mt=class extends un{constructor(e=new nn,t=new Qt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){Eo.set(0,0,0);for(let l=0,h=r.length;l<h;l++){let c=o[l],u=r[l];c!==0&&(Bc.fromBufferAttribute(u,e),a?Eo.addScaledVector(Bc,c):Eo.addScaledVector(Bc.sub(t),c))}t.add(Eo)}return t}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),wo.copy(n.boundingSphere),wo.applyMatrix4(r),ws.copy(e.ray).recast(e.near),!(wo.containsPoint(ws.origin)===!1&&(ws.intersectSphere(wo,gf)===null||ws.origin.distanceToSquared(gf)>(e.far-e.near)**2))&&(mf.copy(r).invert(),ws.copy(e.ray).applyMatrix4(mf),!(n.boundingBox!==null&&ws.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,ws)))}_computeIntersections(e,t,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,h=r.attributes.uv,c=r.attributes.uv1,u=r.attributes.normal,d=r.groups,m=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,v=d.length;g<v;g++){let p=d[g],f=a[p.materialIndex],w=Math.max(p.start,m.start),S=Math.min(o.count,Math.min(p.start+p.count,m.start+m.count));for(let x=w,I=S;x<I;x+=3){let R=o.getX(x),T=o.getX(x+1),C=o.getX(x+2);s=Ro(this,f,e,n,h,c,u,R,T,C),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let g=Math.max(0,m.start),v=Math.min(o.count,m.start+m.count);for(let p=g,f=v;p<f;p+=3){let w=o.getX(p),S=o.getX(p+1),x=o.getX(p+2);s=Ro(this,a,e,n,h,c,u,w,S,x),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,v=d.length;g<v;g++){let p=d[g],f=a[p.materialIndex],w=Math.max(p.start,m.start),S=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let x=w,I=S;x<I;x+=3){let R=x,T=x+1,C=x+2;s=Ro(this,f,e,n,h,c,u,R,T,C),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let g=Math.max(0,m.start),v=Math.min(l.count,m.start+m.count);for(let p=g,f=v;p<f;p+=3){let w=p,S=p+1,x=p+2;s=Ro(this,a,e,n,h,c,u,w,S,x),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}}};function S0(i,e,t,n,s,r,a,o){let l;if(e.side===xn?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,e.side===as,o),l===null)return null;Co.copy(o),Co.applyMatrix4(i.matrixWorld);let h=t.ray.origin.distanceTo(Co);return h<t.near||h>t.far?null:{distance:h,point:Co.clone(),object:i}}function Ro(i,e,t,n,s,r,a,o,l,h){i.getVertexPosition(o,So),i.getVertexPosition(l,Ao),i.getVertexPosition(h,To);let c=S0(i,e,t,n,So,Ao,To,vf);if(c){let u=new D;Rs.getBarycoord(vf,So,Ao,To,u),s&&(c.uv=Rs.getInterpolatedAttribute(s,o,l,h,u,new Xe)),r&&(c.uv1=Rs.getInterpolatedAttribute(r,o,l,h,u,new Xe)),a&&(c.normal=Rs.getInterpolatedAttribute(a,o,l,h,u,new D),c.normal.dot(n.direction)>0&&c.normal.multiplyScalar(-1));let d={a:o,b:l,c:h,normal:new D,materialIndex:0};Rs.getNormal(So,Ao,To,d.normal),c.face=d,c.barycoord=u}return c}var Oi=class i extends nn{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],h=[],c=[],u=[],d=0,m=0;g("z","y","x",-1,-1,n,t,e,a,r,0),g("z","y","x",1,-1,n,t,-e,a,r,1),g("x","z","y",1,1,e,n,t,s,a,2),g("x","z","y",1,-1,e,n,-t,s,a,3),g("x","y","z",1,-1,e,t,n,s,r,4),g("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new st(h,3)),this.setAttribute("normal",new st(c,3)),this.setAttribute("uv",new st(u,2));function g(v,p,f,w,S,x,I,R,T,C,y){let _=x/T,L=I/C,N=x/2,P=I/2,F=R/2,H=T+1,O=C+1,Z=0,G=0,ae=new D;for(let ee=0;ee<O;ee++){let ve=ee*L-P;for(let Fe=0;Fe<H;Fe++){let ht=Fe*_-N;ae[v]=ht*w,ae[p]=ve*S,ae[f]=F,h.push(ae.x,ae.y,ae.z),ae[v]=0,ae[p]=0,ae[f]=R>0?1:-1,c.push(ae.x,ae.y,ae.z),u.push(Fe/T),u.push(1-ee/C),Z+=1}}for(let ee=0;ee<C;ee++)for(let ve=0;ve<T;ve++){let Fe=d+ve+H*ee,ht=d+ve+H*(ee+1),Y=d+(ve+1)+H*(ee+1),ie=d+(ve+1)+H*ee;l.push(Fe,ht,ie),l.push(ht,Y,ie),G+=6}o.addGroup(m,G,y),m+=G,d+=Z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Pr(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function hn(i){let e={};for(let t=0;t<i.length;t++){let n=Pr(i[t]);for(let s in n)e[s]=n[s]}return e}function A0(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function lp(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:it.workingColorSpace}var T0={clone:Pr,merge:hn},E0=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,C0=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,fi=class extends ls{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=E0,this.fragmentShader=C0,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Pr(e.uniforms),this.uniformsGroups=A0(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},Yo=class extends un{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ge,this.projectionMatrix=new Ge,this.projectionMatrixInverse=new Ge,this.coordinateSystem=Ni}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},ns=new D,xf=new Xe,yf=new Xe,jt=class extends Yo{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Nh*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(xc*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Nh*2*Math.atan(Math.tan(xc*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ns.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ns.x,ns.y).multiplyScalar(-e/ns.z),ns.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ns.x,ns.y).multiplyScalar(-e/ns.z)}getViewSize(e,t){return this.getViewBounds(e,xf,yf),t.subVectors(yf,xf)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(xc*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,h=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*n/h,s*=a.width/l,n*=a.height/h}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},mr=-90,gr=1,Oh=class extends un{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new jt(mr,gr,e,t);s.layers=this.layers,this.add(s);let r=new jt(mr,gr,e,t);r.layers=this.layers,this.add(r);let a=new jt(mr,gr,e,t);a.layers=this.layers,this.add(a);let o=new jt(mr,gr,e,t);o.layers=this.layers,this.add(o);let l=new jt(mr,gr,e,t);l.layers=this.layers,this.add(l);let h=new jt(mr,gr,e,t);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,l]=t;for(let h of t)this.remove(h);if(e===Ni)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Vo)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let h of t)this.add(h),h.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,h,c]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,a),e.setRenderTarget(n,2,s),e.render(t,o),e.setRenderTarget(n,3,s),e.render(t,l),e.setRenderTarget(n,4,s),e.render(t,h),n.texture.generateMipmaps=v,e.setRenderTarget(n,5,s),e.render(t,c),e.setRenderTarget(u,d,m),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},Ko=class extends Tn{constructor(e,t,n,s,r,a,o,l,h,c){e=e!==void 0?e:[],t=t!==void 0?t:Ar,super(e,t,n,s,r,a,o,l,h,c),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},zh=class extends Fi{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new Ko(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:ui}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new Oi(5,5,5),r=new fi({name:"CubemapFromEquirect",uniforms:Pr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:xn,blending:ss});r.uniforms.tEquirect.value=t;let a=new Mt(s,r),o=t.minFilter;return t.minFilter===Ls&&(t.minFilter=ui),new Oh(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,s){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}},Oc=new D,R0=new D,P0=new Ue,Di=class{constructor(e=new D(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=Oc.subVectors(n,t).cross(R0.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(Oc),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||P0.getNormalMatrix(e),s=this.coplanarPoint(Oc).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Ss=new ks,Po=new D,Sa=class{constructor(e=new Di,t=new Di,n=new Di,s=new Di,r=new Di,a=new Di){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Ni){let n=this.planes,s=e.elements,r=s[0],a=s[1],o=s[2],l=s[3],h=s[4],c=s[5],u=s[6],d=s[7],m=s[8],g=s[9],v=s[10],p=s[11],f=s[12],w=s[13],S=s[14],x=s[15];if(n[0].setComponents(l-r,d-h,p-m,x-f).normalize(),n[1].setComponents(l+r,d+h,p+m,x+f).normalize(),n[2].setComponents(l+a,d+c,p+g,x+w).normalize(),n[3].setComponents(l-a,d-c,p-g,x-w).normalize(),n[4].setComponents(l-o,d-u,p-v,x-S).normalize(),t===Ni)n[5].setComponents(l+o,d+u,p+v,x+S).normalize();else if(t===Vo)n[5].setComponents(o,u,v,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ss.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ss.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ss)}intersectsSprite(e){return Ss.center.set(0,0,0),Ss.radius=.7071067811865476,Ss.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ss)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(Po.x=s.normal.x>0?e.max.x:e.min.x,Po.y=s.normal.y>0?e.max.y:e.min.y,Po.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Po)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function cp(){let i=null,e=!1,t=null,n=null;function s(r,a){t(r,a),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function I0(i){let e=new WeakMap;function t(o,l){let h=o.array,c=o.usage,u=h.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,h,c),o.onUploadCallback();let m;if(h instanceof Float32Array)m=i.FLOAT;else if(h instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(h instanceof Int16Array)m=i.SHORT;else if(h instanceof Uint32Array)m=i.UNSIGNED_INT;else if(h instanceof Int32Array)m=i.INT;else if(h instanceof Int8Array)m=i.BYTE;else if(h instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:d,type:m,bytesPerElement:h.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,l,h){let c=l.array,u=l.updateRanges;if(i.bindBuffer(h,o),u.length===0)i.bufferSubData(h,0,c);else{u.sort((m,g)=>m.start-g.start);let d=0;for(let m=1;m<u.length;m++){let g=u[d],v=u[m];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++d,u[d]=v)}u.length=d+1;for(let m=0,g=u.length;m<g;m++){let v=u[m];i.bufferSubData(h,v.start*c.BYTES_PER_ELEMENT,c,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let c=e.get(o);(!c||c.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let h=e.get(o);if(h===void 0)e.set(o,t(o,l));else if(h.version<o.version){if(h.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(h.buffer,o,l),h.version=o.version}}return{get:s,remove:r,update:a}}var cs=class i extends nn{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(s),h=o+1,c=l+1,u=e/o,d=t/l,m=[],g=[],v=[],p=[];for(let f=0;f<c;f++){let w=f*d-a;for(let S=0;S<h;S++){let x=S*u-r;g.push(x,-w,0),v.push(0,0,1),p.push(S/o),p.push(1-f/l)}}for(let f=0;f<l;f++)for(let w=0;w<o;w++){let S=w+h*f,x=w+h*(f+1),I=w+1+h*(f+1),R=w+1+h*f;m.push(S,x,R),m.push(x,I,R)}this.setIndex(m),this.setAttribute("position",new st(g,3)),this.setAttribute("normal",new st(v,3)),this.setAttribute("uv",new st(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}},L0=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,D0=`#ifdef USE_ALPHAHASH
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
#endif`,N0=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,k0=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,U0=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,F0=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,B0=`#ifdef USE_AOMAP
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
#endif`,O0=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,z0=`#ifdef USE_BATCHING
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
#endif`,H0=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,V0=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,G0=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,W0=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,q0=`#ifdef USE_IRIDESCENCE
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
#endif`,$0=`#ifdef USE_BUMPMAP
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
#endif`,X0=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Y0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,K0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Z0=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,J0=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,j0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Q0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,ev=`#if defined( USE_COLOR_ALPHA )
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
#endif`,tv=`#define PI 3.141592653589793
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
} // validated`,nv=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,iv=`vec3 transformedNormal = objectNormal;
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
#endif`,sv=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,rv=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,av=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,ov=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,lv="gl_FragColor = linearToOutputTexel( gl_FragColor );",cv=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,hv=`#ifdef USE_ENVMAP
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
#endif`,uv=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,dv=`#ifdef USE_ENVMAP
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
#endif`,fv=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,pv=`#ifdef USE_ENVMAP
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
#endif`,mv=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,gv=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,vv=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,xv=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,yv=`#ifdef USE_GRADIENTMAP
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
}`,_v=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,bv=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Mv=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,wv=`uniform bool receiveShadow;
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
#endif`,Sv=`#ifdef USE_ENVMAP
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
#endif`,Av=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Tv=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Ev=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Cv=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Rv=`PhysicalMaterial material;
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
#endif`,Pv=`struct PhysicalMaterial {
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
}`,Iv=`
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
#endif`,Lv=`#if defined( RE_IndirectDiffuse )
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
#endif`,Dv=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Nv=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,kv=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Uv=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Fv=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Bv=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Ov=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,zv=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Hv=`#if defined( USE_POINTS_UV )
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
#endif`,Vv=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Gv=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Wv=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,qv=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,$v=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Xv=`#ifdef USE_MORPHTARGETS
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
#endif`,Yv=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Kv=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Zv=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Jv=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,jv=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Qv=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,ex=`#ifdef USE_NORMALMAP
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
#endif`,tx=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,nx=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,ix=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,sx=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,rx=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,ax=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,ox=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,lx=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,cx=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,hx=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,ux=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,dx=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,fx=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,px=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,mx=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,gx=`float getShadowMask() {
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
}`,vx=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,xx=`#ifdef USE_SKINNING
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
#endif`,yx=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,_x=`#ifdef USE_SKINNING
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
#endif`,bx=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Mx=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,wx=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Sx=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Ax=`#ifdef USE_TRANSMISSION
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
#endif`,Tx=`#ifdef USE_TRANSMISSION
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
#endif`,Ex=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Cx=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Rx=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Px=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Ix=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Lx=`uniform sampler2D t2D;
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
}`,Dx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Nx=`#ifdef ENVMAP_TYPE_CUBE
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
}`,kx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ux=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Fx=`#include <common>
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
}`,Bx=`#if DEPTH_PACKING == 3200
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
}`,Ox=`#define DISTANCE
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
}`,zx=`#define DISTANCE
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
}`,Hx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Vx=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Gx=`uniform float scale;
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
}`,Wx=`uniform vec3 diffuse;
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
}`,qx=`#include <common>
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
}`,$x=`uniform vec3 diffuse;
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
}`,Xx=`#define LAMBERT
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
}`,Yx=`#define LAMBERT
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
}`,Kx=`#define MATCAP
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
}`,Zx=`#define MATCAP
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
}`,Jx=`#define NORMAL
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
}`,jx=`#define NORMAL
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
}`,Qx=`#define PHONG
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
}`,ey=`#define PHONG
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
}`,ty=`#define STANDARD
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
}`,ny=`#define STANDARD
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
}`,iy=`#define TOON
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
}`,sy=`#define TOON
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
}`,ry=`uniform float size;
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
}`,ay=`uniform vec3 diffuse;
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
}`,oy=`#include <common>
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
}`,ly=`uniform vec3 color;
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
}`,cy=`uniform float rotation;
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
}`,hy=`uniform vec3 diffuse;
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
}`,Ve={alphahash_fragment:L0,alphahash_pars_fragment:D0,alphamap_fragment:N0,alphamap_pars_fragment:k0,alphatest_fragment:U0,alphatest_pars_fragment:F0,aomap_fragment:B0,aomap_pars_fragment:O0,batching_pars_vertex:z0,batching_vertex:H0,begin_vertex:V0,beginnormal_vertex:G0,bsdfs:W0,iridescence_fragment:q0,bumpmap_pars_fragment:$0,clipping_planes_fragment:X0,clipping_planes_pars_fragment:Y0,clipping_planes_pars_vertex:K0,clipping_planes_vertex:Z0,color_fragment:J0,color_pars_fragment:j0,color_pars_vertex:Q0,color_vertex:ev,common:tv,cube_uv_reflection_fragment:nv,defaultnormal_vertex:iv,displacementmap_pars_vertex:sv,displacementmap_vertex:rv,emissivemap_fragment:av,emissivemap_pars_fragment:ov,colorspace_fragment:lv,colorspace_pars_fragment:cv,envmap_fragment:hv,envmap_common_pars_fragment:uv,envmap_pars_fragment:dv,envmap_pars_vertex:fv,envmap_physical_pars_fragment:Sv,envmap_vertex:pv,fog_vertex:mv,fog_pars_vertex:gv,fog_fragment:vv,fog_pars_fragment:xv,gradientmap_pars_fragment:yv,lightmap_pars_fragment:_v,lights_lambert_fragment:bv,lights_lambert_pars_fragment:Mv,lights_pars_begin:wv,lights_toon_fragment:Av,lights_toon_pars_fragment:Tv,lights_phong_fragment:Ev,lights_phong_pars_fragment:Cv,lights_physical_fragment:Rv,lights_physical_pars_fragment:Pv,lights_fragment_begin:Iv,lights_fragment_maps:Lv,lights_fragment_end:Dv,logdepthbuf_fragment:Nv,logdepthbuf_pars_fragment:kv,logdepthbuf_pars_vertex:Uv,logdepthbuf_vertex:Fv,map_fragment:Bv,map_pars_fragment:Ov,map_particle_fragment:zv,map_particle_pars_fragment:Hv,metalnessmap_fragment:Vv,metalnessmap_pars_fragment:Gv,morphinstance_vertex:Wv,morphcolor_vertex:qv,morphnormal_vertex:$v,morphtarget_pars_vertex:Xv,morphtarget_vertex:Yv,normal_fragment_begin:Kv,normal_fragment_maps:Zv,normal_pars_fragment:Jv,normal_pars_vertex:jv,normal_vertex:Qv,normalmap_pars_fragment:ex,clearcoat_normal_fragment_begin:tx,clearcoat_normal_fragment_maps:nx,clearcoat_pars_fragment:ix,iridescence_pars_fragment:sx,opaque_fragment:rx,packing:ax,premultiplied_alpha_fragment:ox,project_vertex:lx,dithering_fragment:cx,dithering_pars_fragment:hx,roughnessmap_fragment:ux,roughnessmap_pars_fragment:dx,shadowmap_pars_fragment:fx,shadowmap_pars_vertex:px,shadowmap_vertex:mx,shadowmask_pars_fragment:gx,skinbase_vertex:vx,skinning_pars_vertex:xx,skinning_vertex:yx,skinnormal_vertex:_x,specularmap_fragment:bx,specularmap_pars_fragment:Mx,tonemapping_fragment:wx,tonemapping_pars_fragment:Sx,transmission_fragment:Ax,transmission_pars_fragment:Tx,uv_pars_fragment:Ex,uv_pars_vertex:Cx,uv_vertex:Rx,worldpos_vertex:Px,background_vert:Ix,background_frag:Lx,backgroundCube_vert:Dx,backgroundCube_frag:Nx,cube_vert:kx,cube_frag:Ux,depth_vert:Fx,depth_frag:Bx,distanceRGBA_vert:Ox,distanceRGBA_frag:zx,equirect_vert:Hx,equirect_frag:Vx,linedashed_vert:Gx,linedashed_frag:Wx,meshbasic_vert:qx,meshbasic_frag:$x,meshlambert_vert:Xx,meshlambert_frag:Yx,meshmatcap_vert:Kx,meshmatcap_frag:Zx,meshnormal_vert:Jx,meshnormal_frag:jx,meshphong_vert:Qx,meshphong_frag:ey,meshphysical_vert:ty,meshphysical_frag:ny,meshtoon_vert:iy,meshtoon_frag:sy,points_vert:ry,points_frag:ay,shadow_vert:oy,shadow_frag:ly,sprite_vert:cy,sprite_frag:hy},oe={common:{diffuse:{value:new le(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ue}},envmap:{envMap:{value:null},envMapRotation:{value:new Ue},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ue}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ue}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ue},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ue},normalScale:{value:new Xe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ue},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ue}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ue}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ue}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new le(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new le(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0},uvTransform:{value:new Ue}},sprite:{diffuse:{value:new le(16777215)},opacity:{value:1},center:{value:new Xe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}}},hi={basic:{uniforms:hn([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.fog]),vertexShader:Ve.meshbasic_vert,fragmentShader:Ve.meshbasic_frag},lambert:{uniforms:hn([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,oe.lights,{emissive:{value:new le(0)}}]),vertexShader:Ve.meshlambert_vert,fragmentShader:Ve.meshlambert_frag},phong:{uniforms:hn([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,oe.lights,{emissive:{value:new le(0)},specular:{value:new le(1118481)},shininess:{value:30}}]),vertexShader:Ve.meshphong_vert,fragmentShader:Ve.meshphong_frag},standard:{uniforms:hn([oe.common,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.roughnessmap,oe.metalnessmap,oe.fog,oe.lights,{emissive:{value:new le(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag},toon:{uniforms:hn([oe.common,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.gradientmap,oe.fog,oe.lights,{emissive:{value:new le(0)}}]),vertexShader:Ve.meshtoon_vert,fragmentShader:Ve.meshtoon_frag},matcap:{uniforms:hn([oe.common,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,{matcap:{value:null}}]),vertexShader:Ve.meshmatcap_vert,fragmentShader:Ve.meshmatcap_frag},points:{uniforms:hn([oe.points,oe.fog]),vertexShader:Ve.points_vert,fragmentShader:Ve.points_frag},dashed:{uniforms:hn([oe.common,oe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ve.linedashed_vert,fragmentShader:Ve.linedashed_frag},depth:{uniforms:hn([oe.common,oe.displacementmap]),vertexShader:Ve.depth_vert,fragmentShader:Ve.depth_frag},normal:{uniforms:hn([oe.common,oe.bumpmap,oe.normalmap,oe.displacementmap,{opacity:{value:1}}]),vertexShader:Ve.meshnormal_vert,fragmentShader:Ve.meshnormal_frag},sprite:{uniforms:hn([oe.sprite,oe.fog]),vertexShader:Ve.sprite_vert,fragmentShader:Ve.sprite_frag},background:{uniforms:{uvTransform:{value:new Ue},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ve.background_vert,fragmentShader:Ve.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ue}},vertexShader:Ve.backgroundCube_vert,fragmentShader:Ve.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ve.cube_vert,fragmentShader:Ve.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ve.equirect_vert,fragmentShader:Ve.equirect_frag},distanceRGBA:{uniforms:hn([oe.common,oe.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ve.distanceRGBA_vert,fragmentShader:Ve.distanceRGBA_frag},shadow:{uniforms:hn([oe.lights,oe.fog,{color:{value:new le(0)},opacity:{value:1}}]),vertexShader:Ve.shadow_vert,fragmentShader:Ve.shadow_frag}};hi.physical={uniforms:hn([hi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ue},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ue},clearcoatNormalScale:{value:new Xe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ue},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ue},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ue},sheen:{value:0},sheenColor:{value:new le(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ue},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ue},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ue},transmissionSamplerSize:{value:new Xe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ue},attenuationDistance:{value:0},attenuationColor:{value:new le(0)},specularColor:{value:new le(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ue},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ue},anisotropyVector:{value:new Xe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ue}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag};var Io={r:0,b:0,g:0},As=new $t,uy=new Ge;function dy(i,e,t,n,s,r,a){let o=new le(0),l=r===!0?0:1,h,c,u=null,d=0,m=null;function g(w){let S=w.isScene===!0?w.background:null;return S&&S.isTexture&&(S=(w.backgroundBlurriness>0?t:e).get(S)),S}function v(w){let S=!1,x=g(w);x===null?f(o,l):x&&x.isColor&&(f(x,1),S=!0);let I=i.xr.getEnvironmentBlendMode();I==="additive"?n.buffers.color.setClear(0,0,0,1,a):I==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||S)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function p(w,S){let x=g(S);x&&(x.isCubeTexture||x.mapping===cl)?(c===void 0&&(c=new Mt(new Oi(1,1,1),new fi({name:"BackgroundCubeMaterial",uniforms:Pr(hi.backgroundCube.uniforms),vertexShader:hi.backgroundCube.vertexShader,fragmentShader:hi.backgroundCube.fragmentShader,side:xn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(I,R,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(c)),As.copy(S.backgroundRotation),As.x*=-1,As.y*=-1,As.z*=-1,x.isCubeTexture&&x.isRenderTargetTexture===!1&&(As.y*=-1,As.z*=-1),c.material.uniforms.envMap.value=x,c.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(uy.makeRotationFromEuler(As)),c.material.toneMapped=it.getTransfer(x.colorSpace)!==xt,(u!==x||d!==x.version||m!==i.toneMapping)&&(c.material.needsUpdate=!0,u=x,d=x.version,m=i.toneMapping),c.layers.enableAll(),w.unshift(c,c.geometry,c.material,0,0,null)):x&&x.isTexture&&(h===void 0&&(h=new Mt(new cs(2,2),new fi({name:"BackgroundMaterial",uniforms:Pr(hi.background.uniforms),vertexShader:hi.background.vertexShader,fragmentShader:hi.background.fragmentShader,side:as,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),Object.defineProperty(h.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(h)),h.material.uniforms.t2D.value=x,h.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,h.material.toneMapped=it.getTransfer(x.colorSpace)!==xt,x.matrixAutoUpdate===!0&&x.updateMatrix(),h.material.uniforms.uvTransform.value.copy(x.matrix),(u!==x||d!==x.version||m!==i.toneMapping)&&(h.material.needsUpdate=!0,u=x,d=x.version,m=i.toneMapping),h.layers.enableAll(),w.unshift(h,h.geometry,h.material,0,0,null))}function f(w,S){w.getRGB(Io,lp(i)),n.buffers.color.setClear(Io.r,Io.g,Io.b,S,a)}return{getClearColor:function(){return o},setClearColor:function(w,S=1){o.set(w),l=S,f(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(w){l=w,f(o,l)},render:v,addToRenderList:p}}function fy(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null),r=s,a=!1;function o(_,L,N,P,F){let H=!1,O=u(P,N,L);r!==O&&(r=O,h(r.object)),H=m(_,P,N,F),H&&g(_,P,N,F),F!==null&&e.update(F,i.ELEMENT_ARRAY_BUFFER),(H||a)&&(a=!1,x(_,L,N,P),F!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(F).buffer))}function l(){return i.createVertexArray()}function h(_){return i.bindVertexArray(_)}function c(_){return i.deleteVertexArray(_)}function u(_,L,N){let P=N.wireframe===!0,F=n[_.id];F===void 0&&(F={},n[_.id]=F);let H=F[L.id];H===void 0&&(H={},F[L.id]=H);let O=H[P];return O===void 0&&(O=d(l()),H[P]=O),O}function d(_){let L=[],N=[],P=[];for(let F=0;F<t;F++)L[F]=0,N[F]=0,P[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:L,enabledAttributes:N,attributeDivisors:P,object:_,attributes:{},index:null}}function m(_,L,N,P){let F=r.attributes,H=L.attributes,O=0,Z=N.getAttributes();for(let G in Z)if(Z[G].location>=0){let ee=F[G],ve=H[G];if(ve===void 0&&(G==="instanceMatrix"&&_.instanceMatrix&&(ve=_.instanceMatrix),G==="instanceColor"&&_.instanceColor&&(ve=_.instanceColor)),ee===void 0||ee.attribute!==ve||ve&&ee.data!==ve.data)return!0;O++}return r.attributesNum!==O||r.index!==P}function g(_,L,N,P){let F={},H=L.attributes,O=0,Z=N.getAttributes();for(let G in Z)if(Z[G].location>=0){let ee=H[G];ee===void 0&&(G==="instanceMatrix"&&_.instanceMatrix&&(ee=_.instanceMatrix),G==="instanceColor"&&_.instanceColor&&(ee=_.instanceColor));let ve={};ve.attribute=ee,ee&&ee.data&&(ve.data=ee.data),F[G]=ve,O++}r.attributes=F,r.attributesNum=O,r.index=P}function v(){let _=r.newAttributes;for(let L=0,N=_.length;L<N;L++)_[L]=0}function p(_){f(_,0)}function f(_,L){let N=r.newAttributes,P=r.enabledAttributes,F=r.attributeDivisors;N[_]=1,P[_]===0&&(i.enableVertexAttribArray(_),P[_]=1),F[_]!==L&&(i.vertexAttribDivisor(_,L),F[_]=L)}function w(){let _=r.newAttributes,L=r.enabledAttributes;for(let N=0,P=L.length;N<P;N++)L[N]!==_[N]&&(i.disableVertexAttribArray(N),L[N]=0)}function S(_,L,N,P,F,H,O){O===!0?i.vertexAttribIPointer(_,L,N,F,H):i.vertexAttribPointer(_,L,N,P,F,H)}function x(_,L,N,P){v();let F=P.attributes,H=N.getAttributes(),O=L.defaultAttributeValues;for(let Z in H){let G=H[Z];if(G.location>=0){let ae=F[Z];if(ae===void 0&&(Z==="instanceMatrix"&&_.instanceMatrix&&(ae=_.instanceMatrix),Z==="instanceColor"&&_.instanceColor&&(ae=_.instanceColor)),ae!==void 0){let ee=ae.normalized,ve=ae.itemSize,Fe=e.get(ae);if(Fe===void 0)continue;let ht=Fe.buffer,Y=Fe.type,ie=Fe.bytesPerElement,Ae=Y===i.INT||Y===i.UNSIGNED_INT||ae.gpuType===du;if(ae.isInterleavedBufferAttribute){let de=ae.data,Ie=de.stride,Be=ae.offset;if(de.isInstancedInterleavedBuffer){for(let $e=0;$e<G.locationSize;$e++)f(G.location+$e,de.meshPerAttribute);_.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=de.meshPerAttribute*de.count)}else for(let $e=0;$e<G.locationSize;$e++)p(G.location+$e);i.bindBuffer(i.ARRAY_BUFFER,ht);for(let $e=0;$e<G.locationSize;$e++)S(G.location+$e,ve/G.locationSize,Y,ee,Ie*ie,(Be+ve/G.locationSize*$e)*ie,Ae)}else{if(ae.isInstancedBufferAttribute){for(let de=0;de<G.locationSize;de++)f(G.location+de,ae.meshPerAttribute);_.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=ae.meshPerAttribute*ae.count)}else for(let de=0;de<G.locationSize;de++)p(G.location+de);i.bindBuffer(i.ARRAY_BUFFER,ht);for(let de=0;de<G.locationSize;de++)S(G.location+de,ve/G.locationSize,Y,ee,ve*ie,ve/G.locationSize*de*ie,Ae)}}else if(O!==void 0){let ee=O[Z];if(ee!==void 0)switch(ee.length){case 2:i.vertexAttrib2fv(G.location,ee);break;case 3:i.vertexAttrib3fv(G.location,ee);break;case 4:i.vertexAttrib4fv(G.location,ee);break;default:i.vertexAttrib1fv(G.location,ee)}}}}w()}function I(){C();for(let _ in n){let L=n[_];for(let N in L){let P=L[N];for(let F in P)c(P[F].object),delete P[F];delete L[N]}delete n[_]}}function R(_){if(n[_.id]===void 0)return;let L=n[_.id];for(let N in L){let P=L[N];for(let F in P)c(P[F].object),delete P[F];delete L[N]}delete n[_.id]}function T(_){for(let L in n){let N=n[L];if(N[_.id]===void 0)continue;let P=N[_.id];for(let F in P)c(P[F].object),delete P[F];delete N[_.id]}}function C(){y(),a=!0,r!==s&&(r=s,h(r.object))}function y(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:C,resetDefaultState:y,dispose:I,releaseStatesOfGeometry:R,releaseStatesOfProgram:T,initAttributes:v,enableAttribute:p,disableUnusedAttributes:w}}function py(i,e,t){let n;function s(h){n=h}function r(h,c){i.drawArrays(n,h,c),t.update(c,n,1)}function a(h,c,u){u!==0&&(i.drawArraysInstanced(n,h,c,u),t.update(c,n,u))}function o(h,c,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,h,0,c,0,u);let m=0;for(let g=0;g<u;g++)m+=c[g];t.update(m,n,1)}function l(h,c,u,d){if(u===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<h.length;g++)a(h[g],c[g],d[g]);else{m.multiDrawArraysInstancedWEBGL(n,h,0,c,0,d,0,u);let g=0;for(let v=0;v<u;v++)g+=c[v]*d[v];t.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function my(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let T=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(T){return!(T!==Zn&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(T){let C=T===Ca&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(T!==Ui&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==di&&!C)}function l(T){if(T==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=t.precision!==void 0?t.precision:"highp",c=l(h);c!==h&&(console.warn("THREE.WebGLRenderer:",h,"not supported, using",c,"instead."),h=c);let u=t.logarithmicDepthBuffer===!0,d=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),f=i.getParameter(i.MAX_VERTEX_ATTRIBS),w=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),S=i.getParameter(i.MAX_VARYING_VECTORS),x=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),I=g>0,R=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:h,logarithmicDepthBuffer:u,reverseDepthBuffer:d,maxTextures:m,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:p,maxAttributes:f,maxVertexUniforms:w,maxVaryings:S,maxFragmentUniforms:x,vertexTextures:I,maxSamples:R}}function gy(i){let e=this,t=null,n=0,s=!1,r=!1,a=new Di,o=new Ue,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let m=u.length!==0||d||n!==0||s;return s=d,n=u.length,m},this.beginShadows=function(){r=!0,c(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=c(u,d,0)},this.setState=function(u,d,m){let g=u.clippingPlanes,v=u.clipIntersection,p=u.clipShadows,f=i.get(u);if(!s||g===null||g.length===0||r&&!p)r?c(null):h();else{let w=r?0:n,S=w*4,x=f.clippingState||null;l.value=x,x=c(g,d,S,m);for(let I=0;I!==S;++I)x[I]=t[I];f.clippingState=x,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=w}};function h(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function c(u,d,m,g){let v=u!==null?u.length:0,p=null;if(v!==0){if(p=l.value,g!==!0||p===null){let f=m+v*4,w=d.matrixWorldInverse;o.getNormalMatrix(w),(p===null||p.length<f)&&(p=new Float32Array(f));for(let S=0,x=m;S!==v;++S,x+=4)a.copy(u[S]).applyMatrix4(w,o),a.normal.toArray(p,x),p[x+3]=a.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=v,e.numIntersection=0,p}}function vy(i){let e=new WeakMap;function t(a,o){return o===ih?a.mapping=Ar:o===sh&&(a.mapping=Tr),a}function n(a){if(a&&a.isTexture){let o=a.mapping;if(o===ih||o===sh)if(e.has(a)){let l=e.get(a).texture;return t(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let h=new zh(l.height);return h.fromEquirectangularTexture(i,a),e.set(a,h),a.addEventListener("dispose",s),t(h.texture,a.mapping)}else return null}}return a}function s(a){let o=a.target;o.removeEventListener("dispose",s);let l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var Zo=class extends Yo{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,a=n+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let h=(this.right-this.left)/this.view.fullWidth/this.zoom,c=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=h*this.view.offsetX,a=r+h*this.view.width,o-=c*this.view.offsetY,l=o-c*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},yr=4,_f=[.125,.215,.35,.446,.526,.582],Ps=20,zc=new Zo,bf=new le,Hc=null,Vc=0,Gc=0,Wc=!1,Es=(1+Math.sqrt(5))/2,vr=1/Es,Mf=[new D(-Es,vr,0),new D(Es,vr,0),new D(-vr,0,Es),new D(vr,0,Es),new D(0,Es,-vr),new D(0,Es,vr),new D(-1,1,-1),new D(1,1,-1),new D(-1,1,1),new D(1,1,1)],Jo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100){Hc=this._renderer.getRenderTarget(),Vc=this._renderer.getActiveCubeFace(),Gc=this._renderer.getActiveMipmapLevel(),Wc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,s,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Af(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Sf(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Hc,Vc,Gc),this._renderer.xr.enabled=Wc,e.scissorTest=!1,Lo(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Ar||e.mapping===Tr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Hc=this._renderer.getRenderTarget(),Vc=this._renderer.getActiveCubeFace(),Gc=this._renderer.getActiveMipmapLevel(),Wc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:ui,minFilter:ui,generateMipmaps:!1,type:Ca,format:Zn,colorSpace:kr,depthBuffer:!1},s=wf(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=wf(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=xy(r)),this._blurMaterial=yy(r,e,t)}return s}_compileMaterial(e){let t=new Mt(this._lodPlanes[0],e);this._renderer.compile(t,zc)}_sceneToCubeUV(e,t,n,s){let o=new jt(90,1,t,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],c=this._renderer,u=c.autoClear,d=c.toneMapping;c.getClearColor(bf),c.toneMapping=rs,c.autoClear=!1;let m=new Qt({name:"PMREM.Background",side:xn,depthWrite:!1,depthTest:!1}),g=new Mt(new Oi,m),v=!1,p=e.background;p?p.isColor&&(m.color.copy(p),e.background=null,v=!0):(m.color.copy(bf),v=!0);for(let f=0;f<6;f++){let w=f%3;w===0?(o.up.set(0,l[f],0),o.lookAt(h[f],0,0)):w===1?(o.up.set(0,0,l[f]),o.lookAt(0,h[f],0)):(o.up.set(0,l[f],0),o.lookAt(0,0,h[f]));let S=this._cubeSize;Lo(s,w*S,f>2?S:0,S,S),c.setRenderTarget(s),v&&c.render(g,o),c.render(e,o)}g.geometry.dispose(),g.material.dispose(),c.toneMapping=d,c.autoClear=u,e.background=p}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===Ar||e.mapping===Tr;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Af()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Sf());let r=s?this._cubemapMaterial:this._equirectMaterial,a=new Mt(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=e;let l=this._cubeSize;Lo(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,zc)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=Mf[(s-r-1)%Mf.length];this._blur(e,r-1,r,a,o)}t.autoClear=n}_blur(e,t,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,s,"latitudinal",r),this._halfBlur(a,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,a,o){let l=this._renderer,h=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let c=3,u=new Mt(this._lodPlanes[s],h),d=h.uniforms,m=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*Ps-1),v=r/g,p=isFinite(r)?1+Math.floor(c*v):Ps;p>Ps&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Ps}`);let f=[],w=0;for(let T=0;T<Ps;++T){let C=T/v,y=Math.exp(-C*C/2);f.push(y),T===0?w+=y:T<p&&(w+=2*y)}for(let T=0;T<f.length;T++)f[T]=f[T]/w;d.envMap.value=e.texture,d.samples.value=p,d.weights.value=f,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);let{_lodMax:S}=this;d.dTheta.value=g,d.mipInt.value=S-n;let x=this._sizeLods[s],I=3*x*(s>S-yr?s-S+yr:0),R=4*(this._cubeSize-x);Lo(t,I,R,3*x,2*x),l.setRenderTarget(t),l.render(u,zc)}};function xy(i){let e=[],t=[],n=[],s=i,r=i-yr+1+_f.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);t.push(o);let l=1/o;a>i-yr?l=_f[a-i+yr-1]:a===0&&(l=0),n.push(l);let h=1/(o-2),c=-h,u=1+h,d=[c,c,u,c,u,u,c,c,u,u,c,u],m=6,g=6,v=3,p=2,f=1,w=new Float32Array(v*g*m),S=new Float32Array(p*g*m),x=new Float32Array(f*g*m);for(let R=0;R<m;R++){let T=R%3*2/3-1,C=R>2?0:-1,y=[T,C,0,T+2/3,C,0,T+2/3,C+1,0,T,C,0,T+2/3,C+1,0,T,C+1,0];w.set(y,v*g*R),S.set(d,p*g*R);let _=[R,R,R,R,R,R];x.set(_,f*g*R)}let I=new nn;I.setAttribute("position",new An(w,v)),I.setAttribute("uv",new An(S,p)),I.setAttribute("faceIndex",new An(x,f)),e.push(I),s>yr&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function wf(i,e,t){let n=new Fi(i,e,t);return n.texture.mapping=cl,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Lo(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function yy(i,e,t){let n=new Float32Array(Ps),s=new D(0,1,0);return new fi({name:"SphericalGaussianBlur",defines:{n:Ps,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:_u(),fragmentShader:`

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
		`,blending:ss,depthTest:!1,depthWrite:!1})}function Sf(){return new fi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:_u(),fragmentShader:`

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
		`,blending:ss,depthTest:!1,depthWrite:!1})}function Af(){return new fi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:_u(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ss,depthTest:!1,depthWrite:!1})}function _u(){return`

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
	`}function _y(i){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){let l=o.mapping,h=l===ih||l===sh,c=l===Ar||l===Tr;if(h||c){let u=e.get(o),d=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==d)return t===null&&(t=new Jo(i)),u=h?t.fromEquirectangular(o,u):t.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),u.texture;if(u!==void 0)return u.texture;{let m=o.image;return h&&m&&m.height>0||c&&m&&s(m)?(t===null&&(t=new Jo(i)),u=h?t.fromEquirectangular(o):t.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),o.addEventListener("dispose",r),u.texture):null}}}return o}function s(o){let l=0,h=6;for(let c=0;c<h;c++)o[c]!==void 0&&l++;return l===h}function r(o){let l=o.target;l.removeEventListener("dispose",r);let h=e.get(l);h!==void 0&&(e.delete(l),h.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function by(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&_a("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function My(i,e,t,n){let s={},r=new WeakMap;function a(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let g in d.attributes)e.remove(d.attributes[g]);for(let g in d.morphAttributes){let v=d.morphAttributes[g];for(let p=0,f=v.length;p<f;p++)e.remove(v[p])}d.removeEventListener("dispose",a),delete s[d.id];let m=r.get(d);m&&(e.remove(m),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(u,d){return s[d.id]===!0||(d.addEventListener("dispose",a),s[d.id]=!0,t.memory.geometries++),d}function l(u){let d=u.attributes;for(let g in d)e.update(d[g],i.ARRAY_BUFFER);let m=u.morphAttributes;for(let g in m){let v=m[g];for(let p=0,f=v.length;p<f;p++)e.update(v[p],i.ARRAY_BUFFER)}}function h(u){let d=[],m=u.index,g=u.attributes.position,v=0;if(m!==null){let w=m.array;v=m.version;for(let S=0,x=w.length;S<x;S+=3){let I=w[S+0],R=w[S+1],T=w[S+2];d.push(I,R,R,T,T,I)}}else if(g!==void 0){let w=g.array;v=g.version;for(let S=0,x=w.length/3-1;S<x;S+=3){let I=S+0,R=S+1,T=S+2;d.push(I,R,R,T,T,I)}}else return;let p=new(ap(d)?Xo:Rr)(d,1);p.version=v;let f=r.get(u);f&&e.remove(f),r.set(u,p)}function c(u){let d=r.get(u);if(d){let m=u.index;m!==null&&d.version<m.version&&h(u)}else h(u);return r.get(u)}return{get:o,update:l,getWireframeAttribute:c}}function wy(i,e,t){let n;function s(d){n=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function l(d,m){i.drawElements(n,m,r,d*a),t.update(m,n,1)}function h(d,m,g){g!==0&&(i.drawElementsInstanced(n,m,r,d*a,g),t.update(m,n,g))}function c(d,m,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,m,0,r,d,0,g);let p=0;for(let f=0;f<g;f++)p+=m[f];t.update(p,n,1)}function u(d,m,g,v){if(g===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let f=0;f<d.length;f++)h(d[f]/a,m[f],v[f]);else{p.multiDrawElementsInstancedWEBGL(n,m,0,r,d,0,v,0,g);let f=0;for(let w=0;w<g;w++)f+=m[w]*v[w];t.update(f,n,1)}}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=h,this.renderMultiDraw=c,this.renderMultiDrawInstances=u}function Sy(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function Ay(i,e,t){let n=new WeakMap,s=new yt;function r(a,o,l){let h=a.morphTargetInfluences,c=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=c!==void 0?c.length:0,d=n.get(o);if(d===void 0||d.count!==u){let y=function(){T.dispose(),n.delete(o),o.removeEventListener("dispose",y)};d!==void 0&&d.texture.dispose();let m=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,v=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],f=o.morphAttributes.normal||[],w=o.morphAttributes.color||[],S=0;m===!0&&(S=1),g===!0&&(S=2),v===!0&&(S=3);let x=o.attributes.position.count*S,I=1;x>e.maxTextureSize&&(I=Math.ceil(x/e.maxTextureSize),x=e.maxTextureSize);let R=new Float32Array(x*I*4*u),T=new qo(R,x,I,u);T.type=di,T.needsUpdate=!0;let C=S*4;for(let _=0;_<u;_++){let L=p[_],N=f[_],P=w[_],F=x*I*4*_;for(let H=0;H<L.count;H++){let O=H*C;m===!0&&(s.fromBufferAttribute(L,H),R[F+O+0]=s.x,R[F+O+1]=s.y,R[F+O+2]=s.z,R[F+O+3]=0),g===!0&&(s.fromBufferAttribute(N,H),R[F+O+4]=s.x,R[F+O+5]=s.y,R[F+O+6]=s.z,R[F+O+7]=0),v===!0&&(s.fromBufferAttribute(P,H),R[F+O+8]=s.x,R[F+O+9]=s.y,R[F+O+10]=s.z,R[F+O+11]=P.itemSize===4?s.w:1)}}d={count:u,texture:T,size:new Xe(x,I)},n.set(o,d),o.addEventListener("dispose",y)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let m=0;for(let v=0;v<h.length;v++)m+=h[v];let g=o.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",h)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function Ty(i,e,t,n){let s=new WeakMap;function r(l){let h=n.render.frame,c=l.geometry,u=e.get(l,c);if(s.get(u)!==h&&(e.update(u),s.set(u,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==h&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,h))),l.isSkinnedMesh){let d=l.skeleton;s.get(d)!==h&&(d.update(),s.set(d,h))}return u}function a(){s=new WeakMap}function o(l){let h=l.target;h.removeEventListener("dispose",o),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:r,dispose:a}}var jo=class extends Tn{constructor(e,t,n,s,r,a,o,l,h,c=br){if(c!==br&&c!==Cr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&c===br&&(n=Ns),n===void 0&&c===Cr&&(n=Er),super(null,s,r,a,o,l,c,n,h),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:Sn,this.minFilter=l!==void 0?l:Sn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},hp=new Tn,Tf=new jo(1,1),up=new qo,dp=new Fh,fp=new Ko,Ef=[],Cf=[],Rf=new Float32Array(16),Pf=new Float32Array(9),If=new Float32Array(4);function Ur(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=Ef[s];if(r===void 0&&(r=new Float32Array(s),Ef[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function Xt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Yt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function ul(i,e){let t=Cf[e];t===void 0&&(t=new Int32Array(e),Cf[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Ey(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Cy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Xt(t,e))return;i.uniform2fv(this.addr,e),Yt(t,e)}}function Ry(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Xt(t,e))return;i.uniform3fv(this.addr,e),Yt(t,e)}}function Py(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Xt(t,e))return;i.uniform4fv(this.addr,e),Yt(t,e)}}function Iy(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Xt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Yt(t,e)}else{if(Xt(t,n))return;If.set(n),i.uniformMatrix2fv(this.addr,!1,If),Yt(t,n)}}function Ly(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Xt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Yt(t,e)}else{if(Xt(t,n))return;Pf.set(n),i.uniformMatrix3fv(this.addr,!1,Pf),Yt(t,n)}}function Dy(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Xt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Yt(t,e)}else{if(Xt(t,n))return;Rf.set(n),i.uniformMatrix4fv(this.addr,!1,Rf),Yt(t,n)}}function Ny(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function ky(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Xt(t,e))return;i.uniform2iv(this.addr,e),Yt(t,e)}}function Uy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Xt(t,e))return;i.uniform3iv(this.addr,e),Yt(t,e)}}function Fy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Xt(t,e))return;i.uniform4iv(this.addr,e),Yt(t,e)}}function By(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Oy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Xt(t,e))return;i.uniform2uiv(this.addr,e),Yt(t,e)}}function zy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Xt(t,e))return;i.uniform3uiv(this.addr,e),Yt(t,e)}}function Hy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Xt(t,e))return;i.uniform4uiv(this.addr,e),Yt(t,e)}}function Vy(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Tf.compareFunction=rp,r=Tf):r=hp,t.setTexture2D(e||r,s)}function Gy(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||dp,s)}function Wy(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||fp,s)}function qy(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||up,s)}function $y(i){switch(i){case 5126:return Ey;case 35664:return Cy;case 35665:return Ry;case 35666:return Py;case 35674:return Iy;case 35675:return Ly;case 35676:return Dy;case 5124:case 35670:return Ny;case 35667:case 35671:return ky;case 35668:case 35672:return Uy;case 35669:case 35673:return Fy;case 5125:return By;case 36294:return Oy;case 36295:return zy;case 36296:return Hy;case 35678:case 36198:case 36298:case 36306:case 35682:return Vy;case 35679:case 36299:case 36307:return Gy;case 35680:case 36300:case 36308:case 36293:return Wy;case 36289:case 36303:case 36311:case 36292:return qy}}function Xy(i,e){i.uniform1fv(this.addr,e)}function Yy(i,e){let t=Ur(e,this.size,2);i.uniform2fv(this.addr,t)}function Ky(i,e){let t=Ur(e,this.size,3);i.uniform3fv(this.addr,t)}function Zy(i,e){let t=Ur(e,this.size,4);i.uniform4fv(this.addr,t)}function Jy(i,e){let t=Ur(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function jy(i,e){let t=Ur(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Qy(i,e){let t=Ur(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function e_(i,e){i.uniform1iv(this.addr,e)}function t_(i,e){i.uniform2iv(this.addr,e)}function n_(i,e){i.uniform3iv(this.addr,e)}function i_(i,e){i.uniform4iv(this.addr,e)}function s_(i,e){i.uniform1uiv(this.addr,e)}function r_(i,e){i.uniform2uiv(this.addr,e)}function a_(i,e){i.uniform3uiv(this.addr,e)}function o_(i,e){i.uniform4uiv(this.addr,e)}function l_(i,e,t){let n=this.cache,s=e.length,r=ul(t,s);Xt(n,r)||(i.uniform1iv(this.addr,r),Yt(n,r));for(let a=0;a!==s;++a)t.setTexture2D(e[a]||hp,r[a])}function c_(i,e,t){let n=this.cache,s=e.length,r=ul(t,s);Xt(n,r)||(i.uniform1iv(this.addr,r),Yt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||dp,r[a])}function h_(i,e,t){let n=this.cache,s=e.length,r=ul(t,s);Xt(n,r)||(i.uniform1iv(this.addr,r),Yt(n,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||fp,r[a])}function u_(i,e,t){let n=this.cache,s=e.length,r=ul(t,s);Xt(n,r)||(i.uniform1iv(this.addr,r),Yt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||up,r[a])}function d_(i){switch(i){case 5126:return Xy;case 35664:return Yy;case 35665:return Ky;case 35666:return Zy;case 35674:return Jy;case 35675:return jy;case 35676:return Qy;case 5124:case 35670:return e_;case 35667:case 35671:return t_;case 35668:case 35672:return n_;case 35669:case 35673:return i_;case 5125:return s_;case 36294:return r_;case 36295:return a_;case 36296:return o_;case 35678:case 36198:case 36298:case 36306:case 35682:return l_;case 35679:case 36299:case 36307:return c_;case 35680:case 36300:case 36308:case 36293:return h_;case 36289:case 36303:case 36311:case 36292:return u_}}var Hh=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=$y(t.type)}},Vh=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=d_(t.type)}},Gh=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],n)}}},qc=/(\w+)(\])?(\[|\.)?/g;function Lf(i,e){i.seq.push(e),i.map[e.id]=e}function f_(i,e,t){let n=i.name,s=n.length;for(qc.lastIndex=0;;){let r=qc.exec(n),a=qc.lastIndex,o=r[1],l=r[2]==="]",h=r[3];if(l&&(o=o|0),h===void 0||h==="["&&a+2===s){Lf(t,h===void 0?new Hh(o,i,e):new Vh(o,i,e));break}else{let u=t.map[o];u===void 0&&(u=new Gh(o),Lf(t,u)),t=u}}}var wr=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=e.getActiveUniform(t,s),a=e.getUniformLocation(t,r.name);f_(r,a,this)}}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&n.push(a)}return n}};function Df(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var p_=37297,m_=0;function g_(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}var Nf=new Ue;function v_(i){it._getMatrix(Nf,it.workingColorSpace,i);let e=`mat3( ${Nf.elements.map(t=>t.toFixed(4))} )`;switch(it.getTransfer(i)){case hl:return[e,"LinearTransferOETF"];case xt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function kf(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),s=i.getShaderInfoLog(e).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let a=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+g_(i.getShaderSource(e),a)}else return s}function x_(i,e){let t=v_(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function y_(i,e){let t;switch(e){case qg:t="Linear";break;case $g:t="Reinhard";break;case Xg:t="Cineon";break;case Yg:t="ACESFilmic";break;case Zg:t="AgX";break;case Ea:t="Neutral";break;case Kg:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Do=new D;function __(){it.getLuminanceCoefficients(Do);let i=Do.x.toFixed(4),e=Do.y.toFixed(4),t=Do.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function b_(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ba).join(`
`)}function M_(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function w_(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function ba(i){return i!==""}function Uf(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Ff(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var S_=/^[ \t]*#include +<([\w\d./]+)>/gm;function Wh(i){return i.replace(S_,T_)}var A_=new Map;function T_(i,e){let t=Ve[e];if(t===void 0){let n=A_.get(e);if(n!==void 0)t=Ve[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return Wh(t)}var E_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Bf(i){return i.replace(E_,C_)}function C_(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Of(i){let e=`precision ${i.precision} float;
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
#define LOW_PRECISION`),e}function R_(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===ol?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===uu?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Li&&(e="SHADOWMAP_TYPE_VSM"),e}function P_(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Ar:case Tr:e="ENVMAP_TYPE_CUBE";break;case cl:e="ENVMAP_TYPE_CUBE_UV";break}return e}function I_(i){let e="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===Tr&&(e="ENVMAP_MODE_REFRACTION"),e}function L_(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case ll:e="ENVMAP_BLENDING_MULTIPLY";break;case Gg:e="ENVMAP_BLENDING_MIX";break;case Wg:e="ENVMAP_BLENDING_ADD";break}return e}function D_(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function N_(i,e,t,n){let s=i.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=R_(t),h=P_(t),c=I_(t),u=L_(t),d=D_(t),m=b_(t),g=M_(r),v=s.createProgram(),p,f,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ba).join(`
`),p.length>0&&(p+=`
`),f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ba).join(`
`),f.length>0&&(f+=`
`)):(p=[Of(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ba).join(`
`),f=[Of(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==rs?"#define TONE_MAPPING":"",t.toneMapping!==rs?Ve.tonemapping_pars_fragment:"",t.toneMapping!==rs?y_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ve.colorspace_pars_fragment,x_("linearToOutputTexel",t.outputColorSpace),__(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ba).join(`
`)),a=Wh(a),a=Uf(a,t),a=Ff(a,t),o=Wh(o),o=Uf(o,t),o=Ff(o,t),a=Bf(a),o=Bf(o),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,f=["#define varying in",t.glslVersion===jd?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===jd?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let S=w+p+a,x=w+f+o,I=Df(s,s.VERTEX_SHADER,S),R=Df(s,s.FRAGMENT_SHADER,x);s.attachShader(v,I),s.attachShader(v,R),t.index0AttributeName!==void 0?s.bindAttribLocation(v,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function T(L){if(i.debug.checkShaderErrors){let N=s.getProgramInfoLog(v).trim(),P=s.getShaderInfoLog(I).trim(),F=s.getShaderInfoLog(R).trim(),H=!0,O=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if(H=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,v,I,R);else{let Z=kf(s,I,"vertex"),G=kf(s,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+`

Material Name: `+L.name+`
Material Type: `+L.type+`

Program Info Log: `+N+`
`+Z+`
`+G)}else N!==""?console.warn("THREE.WebGLProgram: Program Info Log:",N):(P===""||F==="")&&(O=!1);O&&(L.diagnostics={runnable:H,programLog:N,vertexShader:{log:P,prefix:p},fragmentShader:{log:F,prefix:f}})}s.deleteShader(I),s.deleteShader(R),C=new wr(s,v),y=w_(s,v)}let C;this.getUniforms=function(){return C===void 0&&T(this),C};let y;this.getAttributes=function(){return y===void 0&&T(this),y};let _=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return _===!1&&(_=s.getProgramParameter(v,p_)),_},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=m_++,this.cacheKey=e,this.usedTimes=1,this.program=v,this.vertexShader=I,this.fragmentShader=R,this}var k_=0,qh=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new $h(e),t.set(e,n)),n}},$h=class{constructor(e){this.id=k_++,this.code=e,this.usedTimes=0}};function U_(i,e,t,n,s,r,a){let o=new $o,l=new qh,h=new Set,c=[],u=s.logarithmicDepthBuffer,d=s.vertexTextures,m=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(y){return h.add(y),y===0?"uv":`uv${y}`}function p(y,_,L,N,P){let F=N.fog,H=P.geometry,O=y.isMeshStandardMaterial?N.environment:null,Z=(y.isMeshStandardMaterial?t:e).get(y.envMap||O),G=Z&&Z.mapping===cl?Z.image.height:null,ae=g[y.type];y.precision!==null&&(m=s.getMaxPrecision(y.precision),m!==y.precision&&console.warn("THREE.WebGLProgram.getParameters:",y.precision,"not supported, using",m,"instead."));let ee=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,ve=ee!==void 0?ee.length:0,Fe=0;H.morphAttributes.position!==void 0&&(Fe=1),H.morphAttributes.normal!==void 0&&(Fe=2),H.morphAttributes.color!==void 0&&(Fe=3);let ht,Y,ie,Ae;if(ae){let gt=hi[ae];ht=gt.vertexShader,Y=gt.fragmentShader}else ht=y.vertexShader,Y=y.fragmentShader,l.update(y),ie=l.getVertexShaderID(y),Ae=l.getFragmentShaderID(y);let de=i.getRenderTarget(),Ie=i.state.buffers.depth.getReversed(),Be=P.isInstancedMesh===!0,$e=P.isBatchedMesh===!0,Nt=!!y.map,tt=!!y.matcap,Ft=!!Z,z=!!y.aoMap,Dn=!!y.lightMap,je=!!y.bumpMap,Qe=!!y.normalMap,Re=!!y.displacementMap,Tt=!!y.emissiveMap,Ce=!!y.metalnessMap,E=!!y.roughnessMap,b=y.anisotropy>0,V=y.clearcoat>0,J=y.dispersion>0,Q=y.iridescence>0,K=y.sheen>0,Te=y.transmission>0,fe=b&&!!y.anisotropyMap,ye=V&&!!y.clearcoatMap,nt=V&&!!y.clearcoatNormalMap,te=V&&!!y.clearcoatRoughnessMap,_e=Q&&!!y.iridescenceMap,Pe=Q&&!!y.iridescenceThicknessMap,Ne=K&&!!y.sheenColorMap,be=K&&!!y.sheenRoughnessMap,et=!!y.specularMap,He=!!y.specularColorMap,St=!!y.specularIntensityMap,k=Te&&!!y.transmissionMap,ce=Te&&!!y.thicknessMap,$=!!y.gradientMap,j=!!y.alphaMap,ge=y.alphaTest>0,pe=!!y.alphaHash,Oe=!!y.extensions,Ut=rs;y.toneMapped&&(de===null||de.isXRRenderTarget===!0)&&(Ut=i.toneMapping);let rn={shaderID:ae,shaderType:y.type,shaderName:y.name,vertexShader:ht,fragmentShader:Y,defines:y.defines,customVertexShaderID:ie,customFragmentShaderID:Ae,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:m,batching:$e,batchingColor:$e&&P._colorsTexture!==null,instancing:Be,instancingColor:Be&&P.instanceColor!==null,instancingMorph:Be&&P.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:de===null?i.outputColorSpace:de.isXRRenderTarget===!0?de.texture.colorSpace:kr,alphaToCoverage:!!y.alphaToCoverage,map:Nt,matcap:tt,envMap:Ft,envMapMode:Ft&&Z.mapping,envMapCubeUVHeight:G,aoMap:z,lightMap:Dn,bumpMap:je,normalMap:Qe,displacementMap:d&&Re,emissiveMap:Tt,normalMapObjectSpace:Qe&&y.normalMapType===e0,normalMapTangentSpace:Qe&&y.normalMapType===yu,metalnessMap:Ce,roughnessMap:E,anisotropy:b,anisotropyMap:fe,clearcoat:V,clearcoatMap:ye,clearcoatNormalMap:nt,clearcoatRoughnessMap:te,dispersion:J,iridescence:Q,iridescenceMap:_e,iridescenceThicknessMap:Pe,sheen:K,sheenColorMap:Ne,sheenRoughnessMap:be,specularMap:et,specularColorMap:He,specularIntensityMap:St,transmission:Te,transmissionMap:k,thicknessMap:ce,gradientMap:$,opaque:y.transparent===!1&&y.blending===_r&&y.alphaToCoverage===!1,alphaMap:j,alphaTest:ge,alphaHash:pe,combine:y.combine,mapUv:Nt&&v(y.map.channel),aoMapUv:z&&v(y.aoMap.channel),lightMapUv:Dn&&v(y.lightMap.channel),bumpMapUv:je&&v(y.bumpMap.channel),normalMapUv:Qe&&v(y.normalMap.channel),displacementMapUv:Re&&v(y.displacementMap.channel),emissiveMapUv:Tt&&v(y.emissiveMap.channel),metalnessMapUv:Ce&&v(y.metalnessMap.channel),roughnessMapUv:E&&v(y.roughnessMap.channel),anisotropyMapUv:fe&&v(y.anisotropyMap.channel),clearcoatMapUv:ye&&v(y.clearcoatMap.channel),clearcoatNormalMapUv:nt&&v(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:te&&v(y.clearcoatRoughnessMap.channel),iridescenceMapUv:_e&&v(y.iridescenceMap.channel),iridescenceThicknessMapUv:Pe&&v(y.iridescenceThicknessMap.channel),sheenColorMapUv:Ne&&v(y.sheenColorMap.channel),sheenRoughnessMapUv:be&&v(y.sheenRoughnessMap.channel),specularMapUv:et&&v(y.specularMap.channel),specularColorMapUv:He&&v(y.specularColorMap.channel),specularIntensityMapUv:St&&v(y.specularIntensityMap.channel),transmissionMapUv:k&&v(y.transmissionMap.channel),thicknessMapUv:ce&&v(y.thicknessMap.channel),alphaMapUv:j&&v(y.alphaMap.channel),vertexTangents:!!H.attributes.tangent&&(Qe||b),vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,pointsUvs:P.isPoints===!0&&!!H.attributes.uv&&(Nt||j),fog:!!F,useFog:y.fog===!0,fogExp2:!!F&&F.isFogExp2,flatShading:y.flatShading===!0,sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:Ie,skinning:P.isSkinnedMesh===!0,morphTargets:H.morphAttributes.position!==void 0,morphNormals:H.morphAttributes.normal!==void 0,morphColors:H.morphAttributes.color!==void 0,morphTargetsCount:ve,morphTextureStride:Fe,numDirLights:_.directional.length,numPointLights:_.point.length,numSpotLights:_.spot.length,numSpotLightMaps:_.spotLightMap.length,numRectAreaLights:_.rectArea.length,numHemiLights:_.hemi.length,numDirLightShadows:_.directionalShadowMap.length,numPointLightShadows:_.pointShadowMap.length,numSpotLightShadows:_.spotShadowMap.length,numSpotLightShadowsWithMaps:_.numSpotLightShadowsWithMaps,numLightProbes:_.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:y.dithering,shadowMapEnabled:i.shadowMap.enabled&&L.length>0,shadowMapType:i.shadowMap.type,toneMapping:Ut,decodeVideoTexture:Nt&&y.map.isVideoTexture===!0&&it.getTransfer(y.map.colorSpace)===xt,decodeVideoTextureEmissive:Tt&&y.emissiveMap.isVideoTexture===!0&&it.getTransfer(y.emissiveMap.colorSpace)===xt,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===Fn,flipSided:y.side===xn,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:Oe&&y.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Oe&&y.extensions.multiDraw===!0||$e)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return rn.vertexUv1s=h.has(1),rn.vertexUv2s=h.has(2),rn.vertexUv3s=h.has(3),h.clear(),rn}function f(y){let _=[];if(y.shaderID?_.push(y.shaderID):(_.push(y.customVertexShaderID),_.push(y.customFragmentShaderID)),y.defines!==void 0)for(let L in y.defines)_.push(L),_.push(y.defines[L]);return y.isRawShaderMaterial===!1&&(w(_,y),S(_,y),_.push(i.outputColorSpace)),_.push(y.customProgramCacheKey),_.join()}function w(y,_){y.push(_.precision),y.push(_.outputColorSpace),y.push(_.envMapMode),y.push(_.envMapCubeUVHeight),y.push(_.mapUv),y.push(_.alphaMapUv),y.push(_.lightMapUv),y.push(_.aoMapUv),y.push(_.bumpMapUv),y.push(_.normalMapUv),y.push(_.displacementMapUv),y.push(_.emissiveMapUv),y.push(_.metalnessMapUv),y.push(_.roughnessMapUv),y.push(_.anisotropyMapUv),y.push(_.clearcoatMapUv),y.push(_.clearcoatNormalMapUv),y.push(_.clearcoatRoughnessMapUv),y.push(_.iridescenceMapUv),y.push(_.iridescenceThicknessMapUv),y.push(_.sheenColorMapUv),y.push(_.sheenRoughnessMapUv),y.push(_.specularMapUv),y.push(_.specularColorMapUv),y.push(_.specularIntensityMapUv),y.push(_.transmissionMapUv),y.push(_.thicknessMapUv),y.push(_.combine),y.push(_.fogExp2),y.push(_.sizeAttenuation),y.push(_.morphTargetsCount),y.push(_.morphAttributeCount),y.push(_.numDirLights),y.push(_.numPointLights),y.push(_.numSpotLights),y.push(_.numSpotLightMaps),y.push(_.numHemiLights),y.push(_.numRectAreaLights),y.push(_.numDirLightShadows),y.push(_.numPointLightShadows),y.push(_.numSpotLightShadows),y.push(_.numSpotLightShadowsWithMaps),y.push(_.numLightProbes),y.push(_.shadowMapType),y.push(_.toneMapping),y.push(_.numClippingPlanes),y.push(_.numClipIntersection),y.push(_.depthPacking)}function S(y,_){o.disableAll(),_.supportsVertexTextures&&o.enable(0),_.instancing&&o.enable(1),_.instancingColor&&o.enable(2),_.instancingMorph&&o.enable(3),_.matcap&&o.enable(4),_.envMap&&o.enable(5),_.normalMapObjectSpace&&o.enable(6),_.normalMapTangentSpace&&o.enable(7),_.clearcoat&&o.enable(8),_.iridescence&&o.enable(9),_.alphaTest&&o.enable(10),_.vertexColors&&o.enable(11),_.vertexAlphas&&o.enable(12),_.vertexUv1s&&o.enable(13),_.vertexUv2s&&o.enable(14),_.vertexUv3s&&o.enable(15),_.vertexTangents&&o.enable(16),_.anisotropy&&o.enable(17),_.alphaHash&&o.enable(18),_.batching&&o.enable(19),_.dispersion&&o.enable(20),_.batchingColor&&o.enable(21),y.push(o.mask),o.disableAll(),_.fog&&o.enable(0),_.useFog&&o.enable(1),_.flatShading&&o.enable(2),_.logarithmicDepthBuffer&&o.enable(3),_.reverseDepthBuffer&&o.enable(4),_.skinning&&o.enable(5),_.morphTargets&&o.enable(6),_.morphNormals&&o.enable(7),_.morphColors&&o.enable(8),_.premultipliedAlpha&&o.enable(9),_.shadowMapEnabled&&o.enable(10),_.doubleSided&&o.enable(11),_.flipSided&&o.enable(12),_.useDepthPacking&&o.enable(13),_.dithering&&o.enable(14),_.transmission&&o.enable(15),_.sheen&&o.enable(16),_.opaque&&o.enable(17),_.pointsUvs&&o.enable(18),_.decodeVideoTexture&&o.enable(19),_.decodeVideoTextureEmissive&&o.enable(20),_.alphaToCoverage&&o.enable(21),y.push(o.mask)}function x(y){let _=g[y.type],L;if(_){let N=hi[_];L=T0.clone(N.uniforms)}else L=y.uniforms;return L}function I(y,_){let L;for(let N=0,P=c.length;N<P;N++){let F=c[N];if(F.cacheKey===_){L=F,++L.usedTimes;break}}return L===void 0&&(L=new N_(i,_,y,r),c.push(L)),L}function R(y){if(--y.usedTimes===0){let _=c.indexOf(y);c[_]=c[c.length-1],c.pop(),y.destroy()}}function T(y){l.remove(y)}function C(){l.dispose()}return{getParameters:p,getProgramCacheKey:f,getUniforms:x,acquireProgram:I,releaseProgram:R,releaseShaderCache:T,programs:c,dispose:C}}function F_(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function B_(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function zf(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Hf(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(u,d,m,g,v,p){let f=i[e];return f===void 0?(f={id:u.id,object:u,geometry:d,material:m,groupOrder:g,renderOrder:u.renderOrder,z:v,group:p},i[e]=f):(f.id=u.id,f.object=u,f.geometry=d,f.material=m,f.groupOrder=g,f.renderOrder=u.renderOrder,f.z=v,f.group=p),e++,f}function o(u,d,m,g,v,p){let f=a(u,d,m,g,v,p);m.transmission>0?n.push(f):m.transparent===!0?s.push(f):t.push(f)}function l(u,d,m,g,v,p){let f=a(u,d,m,g,v,p);m.transmission>0?n.unshift(f):m.transparent===!0?s.unshift(f):t.unshift(f)}function h(u,d){t.length>1&&t.sort(u||B_),n.length>1&&n.sort(d||zf),s.length>1&&s.sort(d||zf)}function c(){for(let u=e,d=i.length;u<d;u++){let m=i[u];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:o,unshift:l,finish:c,sort:h}}function O_(){let i=new WeakMap;function e(n,s){let r=i.get(n),a;return r===void 0?(a=new Hf,i.set(n,[a])):s>=r.length?(a=new Hf,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function z_(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new D,color:new le};break;case"SpotLight":t={position:new D,direction:new D,color:new le,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new D,color:new le,distance:0,decay:0};break;case"HemisphereLight":t={direction:new D,skyColor:new le,groundColor:new le};break;case"RectAreaLight":t={color:new le,position:new D,halfWidth:new D,halfHeight:new D};break}return i[e.id]=t,t}}}function H_(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xe,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var V_=0;function G_(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function W_(i){let e=new z_,t=H_(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)n.probe.push(new D);let s=new D,r=new Ge,a=new Ge;function o(h){let c=0,u=0,d=0;for(let y=0;y<9;y++)n.probe[y].set(0,0,0);let m=0,g=0,v=0,p=0,f=0,w=0,S=0,x=0,I=0,R=0,T=0;h.sort(G_);for(let y=0,_=h.length;y<_;y++){let L=h[y],N=L.color,P=L.intensity,F=L.distance,H=L.shadow&&L.shadow.map?L.shadow.map.texture:null;if(L.isAmbientLight)c+=N.r*P,u+=N.g*P,d+=N.b*P;else if(L.isLightProbe){for(let O=0;O<9;O++)n.probe[O].addScaledVector(L.sh.coefficients[O],P);T++}else if(L.isDirectionalLight){let O=e.get(L);if(O.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let Z=L.shadow,G=t.get(L);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,n.directionalShadow[m]=G,n.directionalShadowMap[m]=H,n.directionalShadowMatrix[m]=L.shadow.matrix,w++}n.directional[m]=O,m++}else if(L.isSpotLight){let O=e.get(L);O.position.setFromMatrixPosition(L.matrixWorld),O.color.copy(N).multiplyScalar(P),O.distance=F,O.coneCos=Math.cos(L.angle),O.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),O.decay=L.decay,n.spot[v]=O;let Z=L.shadow;if(L.map&&(n.spotLightMap[I]=L.map,I++,Z.updateMatrices(L),L.castShadow&&R++),n.spotLightMatrix[v]=Z.matrix,L.castShadow){let G=t.get(L);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,n.spotShadow[v]=G,n.spotShadowMap[v]=H,x++}v++}else if(L.isRectAreaLight){let O=e.get(L);O.color.copy(N).multiplyScalar(P),O.halfWidth.set(L.width*.5,0,0),O.halfHeight.set(0,L.height*.5,0),n.rectArea[p]=O,p++}else if(L.isPointLight){let O=e.get(L);if(O.color.copy(L.color).multiplyScalar(L.intensity),O.distance=L.distance,O.decay=L.decay,L.castShadow){let Z=L.shadow,G=t.get(L);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,G.shadowCameraNear=Z.camera.near,G.shadowCameraFar=Z.camera.far,n.pointShadow[g]=G,n.pointShadowMap[g]=H,n.pointShadowMatrix[g]=L.shadow.matrix,S++}n.point[g]=O,g++}else if(L.isHemisphereLight){let O=e.get(L);O.skyColor.copy(L.color).multiplyScalar(P),O.groundColor.copy(L.groundColor).multiplyScalar(P),n.hemi[f]=O,f++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=oe.LTC_FLOAT_1,n.rectAreaLTC2=oe.LTC_FLOAT_2):(n.rectAreaLTC1=oe.LTC_HALF_1,n.rectAreaLTC2=oe.LTC_HALF_2)),n.ambient[0]=c,n.ambient[1]=u,n.ambient[2]=d;let C=n.hash;(C.directionalLength!==m||C.pointLength!==g||C.spotLength!==v||C.rectAreaLength!==p||C.hemiLength!==f||C.numDirectionalShadows!==w||C.numPointShadows!==S||C.numSpotShadows!==x||C.numSpotMaps!==I||C.numLightProbes!==T)&&(n.directional.length=m,n.spot.length=v,n.rectArea.length=p,n.point.length=g,n.hemi.length=f,n.directionalShadow.length=w,n.directionalShadowMap.length=w,n.pointShadow.length=S,n.pointShadowMap.length=S,n.spotShadow.length=x,n.spotShadowMap.length=x,n.directionalShadowMatrix.length=w,n.pointShadowMatrix.length=S,n.spotLightMatrix.length=x+I-R,n.spotLightMap.length=I,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=T,C.directionalLength=m,C.pointLength=g,C.spotLength=v,C.rectAreaLength=p,C.hemiLength=f,C.numDirectionalShadows=w,C.numPointShadows=S,C.numSpotShadows=x,C.numSpotMaps=I,C.numLightProbes=T,n.version=V_++)}function l(h,c){let u=0,d=0,m=0,g=0,v=0,p=c.matrixWorldInverse;for(let f=0,w=h.length;f<w;f++){let S=h[f];if(S.isDirectionalLight){let x=n.directional[u];x.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(p),u++}else if(S.isSpotLight){let x=n.spot[m];x.position.setFromMatrixPosition(S.matrixWorld),x.position.applyMatrix4(p),x.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(p),m++}else if(S.isRectAreaLight){let x=n.rectArea[g];x.position.setFromMatrixPosition(S.matrixWorld),x.position.applyMatrix4(p),a.identity(),r.copy(S.matrixWorld),r.premultiply(p),a.extractRotation(r),x.halfWidth.set(S.width*.5,0,0),x.halfHeight.set(0,S.height*.5,0),x.halfWidth.applyMatrix4(a),x.halfHeight.applyMatrix4(a),g++}else if(S.isPointLight){let x=n.point[d];x.position.setFromMatrixPosition(S.matrixWorld),x.position.applyMatrix4(p),d++}else if(S.isHemisphereLight){let x=n.hemi[v];x.direction.setFromMatrixPosition(S.matrixWorld),x.direction.transformDirection(p),v++}}}return{setup:o,setupView:l,state:n}}function Vf(i){let e=new W_(i),t=[],n=[];function s(c){h.camera=c,t.length=0,n.length=0}function r(c){t.push(c)}function a(c){n.push(c)}function o(){e.setup(t)}function l(c){e.setupView(t,c)}let h={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:h,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function q_(i){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new Vf(i),e.set(s,[o])):r>=a.length?(o=new Vf(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}var Xh=class extends ls{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=jg,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Yh=class extends ls{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},$_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,X_=`uniform sampler2D shadow_pass;
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
}`;function Y_(i,e,t){let n=new Sa,s=new Xe,r=new Xe,a=new yt,o=new Xh({depthPacking:Qg}),l=new Yh,h={},c=t.maxTextureSize,u={[as]:xn,[xn]:as,[Fn]:Fn},d=new fi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Xe},radius:{value:4}},vertexShader:$_,fragmentShader:X_}),m=d.clone();m.defines.HORIZONTAL_PASS=1;let g=new nn;g.setAttribute("position",new An(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let v=new Mt(g,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ol;let f=this.type;this.render=function(R,T,C){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||R.length===0)return;let y=i.getRenderTarget(),_=i.getActiveCubeFace(),L=i.getActiveMipmapLevel(),N=i.state;N.setBlending(ss),N.buffers.color.setClear(1,1,1,1),N.buffers.depth.setTest(!0),N.setScissorTest(!1);let P=f!==Li&&this.type===Li,F=f===Li&&this.type!==Li;for(let H=0,O=R.length;H<O;H++){let Z=R[H],G=Z.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",Z,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;s.copy(G.mapSize);let ae=G.getFrameExtents();if(s.multiply(ae),r.copy(G.mapSize),(s.x>c||s.y>c)&&(s.x>c&&(r.x=Math.floor(c/ae.x),s.x=r.x*ae.x,G.mapSize.x=r.x),s.y>c&&(r.y=Math.floor(c/ae.y),s.y=r.y*ae.y,G.mapSize.y=r.y)),G.map===null||P===!0||F===!0){let ve=this.type!==Li?{minFilter:Sn,magFilter:Sn}:{};G.map!==null&&G.map.dispose(),G.map=new Fi(s.x,s.y,ve),G.map.texture.name=Z.name+".shadowMap",G.camera.updateProjectionMatrix()}i.setRenderTarget(G.map),i.clear();let ee=G.getViewportCount();for(let ve=0;ve<ee;ve++){let Fe=G.getViewport(ve);a.set(r.x*Fe.x,r.y*Fe.y,r.x*Fe.z,r.y*Fe.w),N.viewport(a),G.updateMatrices(Z,ve),n=G.getFrustum(),x(T,C,G.camera,Z,this.type)}G.isPointLightShadow!==!0&&this.type===Li&&w(G,C),G.needsUpdate=!1}f=this.type,p.needsUpdate=!1,i.setRenderTarget(y,_,L)};function w(R,T){let C=e.update(v);d.defines.VSM_SAMPLES!==R.blurSamples&&(d.defines.VSM_SAMPLES=R.blurSamples,m.defines.VSM_SAMPLES=R.blurSamples,d.needsUpdate=!0,m.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new Fi(s.x,s.y)),d.uniforms.shadow_pass.value=R.map.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,i.setRenderTarget(R.mapPass),i.clear(),i.renderBufferDirect(T,null,C,d,v,null),m.uniforms.shadow_pass.value=R.mapPass.texture,m.uniforms.resolution.value=R.mapSize,m.uniforms.radius.value=R.radius,i.setRenderTarget(R.map),i.clear(),i.renderBufferDirect(T,null,C,m,v,null)}function S(R,T,C,y){let _=null,L=C.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(L!==void 0)_=L;else if(_=C.isPointLight===!0?l:o,i.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0){let N=_.uuid,P=T.uuid,F=h[N];F===void 0&&(F={},h[N]=F);let H=F[P];H===void 0&&(H=_.clone(),F[P]=H,T.addEventListener("dispose",I)),_=H}if(_.visible=T.visible,_.wireframe=T.wireframe,y===Li?_.side=T.shadowSide!==null?T.shadowSide:T.side:_.side=T.shadowSide!==null?T.shadowSide:u[T.side],_.alphaMap=T.alphaMap,_.alphaTest=T.alphaTest,_.map=T.map,_.clipShadows=T.clipShadows,_.clippingPlanes=T.clippingPlanes,_.clipIntersection=T.clipIntersection,_.displacementMap=T.displacementMap,_.displacementScale=T.displacementScale,_.displacementBias=T.displacementBias,_.wireframeLinewidth=T.wireframeLinewidth,_.linewidth=T.linewidth,C.isPointLight===!0&&_.isMeshDistanceMaterial===!0){let N=i.properties.get(_);N.light=C}return _}function x(R,T,C,y,_){if(R.visible===!1)return;if(R.layers.test(T.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&_===Li)&&(!R.frustumCulled||n.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,R.matrixWorld);let P=e.update(R),F=R.material;if(Array.isArray(F)){let H=P.groups;for(let O=0,Z=H.length;O<Z;O++){let G=H[O],ae=F[G.materialIndex];if(ae&&ae.visible){let ee=S(R,ae,y,_);R.onBeforeShadow(i,R,T,C,P,ee,G),i.renderBufferDirect(C,null,P,ee,R,G),R.onAfterShadow(i,R,T,C,P,ee,G)}}}else if(F.visible){let H=S(R,F,y,_);R.onBeforeShadow(i,R,T,C,P,H,null),i.renderBufferDirect(C,null,P,H,R,null),R.onAfterShadow(i,R,T,C,P,H,null)}}let N=R.children;for(let P=0,F=N.length;P<F;P++)x(N[P],T,C,y,_)}function I(R){R.target.removeEventListener("dispose",I);for(let C in h){let y=h[C],_=R.target.uuid;_ in y&&(y[_].dispose(),delete y[_])}}}var K_={[Zc]:Jc,[jc]:th,[Qc]:nh,[Sr]:eh,[Jc]:Zc,[th]:jc,[nh]:Qc,[eh]:Sr};function Z_(i,e){function t(){let k=!1,ce=new yt,$=null,j=new yt(0,0,0,0);return{setMask:function(ge){$!==ge&&!k&&(i.colorMask(ge,ge,ge,ge),$=ge)},setLocked:function(ge){k=ge},setClear:function(ge,pe,Oe,Ut,rn){rn===!0&&(ge*=Ut,pe*=Ut,Oe*=Ut),ce.set(ge,pe,Oe,Ut),j.equals(ce)===!1&&(i.clearColor(ge,pe,Oe,Ut),j.copy(ce))},reset:function(){k=!1,$=null,j.set(-1,0,0,0)}}}function n(){let k=!1,ce=!1,$=null,j=null,ge=null;return{setReversed:function(pe){if(ce!==pe){let Oe=e.get("EXT_clip_control");ce?Oe.clipControlEXT(Oe.LOWER_LEFT_EXT,Oe.ZERO_TO_ONE_EXT):Oe.clipControlEXT(Oe.LOWER_LEFT_EXT,Oe.NEGATIVE_ONE_TO_ONE_EXT);let Ut=ge;ge=null,this.setClear(Ut)}ce=pe},getReversed:function(){return ce},setTest:function(pe){pe?de(i.DEPTH_TEST):Ie(i.DEPTH_TEST)},setMask:function(pe){$!==pe&&!k&&(i.depthMask(pe),$=pe)},setFunc:function(pe){if(ce&&(pe=K_[pe]),j!==pe){switch(pe){case Zc:i.depthFunc(i.NEVER);break;case Jc:i.depthFunc(i.ALWAYS);break;case jc:i.depthFunc(i.LESS);break;case Sr:i.depthFunc(i.LEQUAL);break;case Qc:i.depthFunc(i.EQUAL);break;case eh:i.depthFunc(i.GEQUAL);break;case th:i.depthFunc(i.GREATER);break;case nh:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}j=pe}},setLocked:function(pe){k=pe},setClear:function(pe){ge!==pe&&(ce&&(pe=1-pe),i.clearDepth(pe),ge=pe)},reset:function(){k=!1,$=null,j=null,ge=null,ce=!1}}}function s(){let k=!1,ce=null,$=null,j=null,ge=null,pe=null,Oe=null,Ut=null,rn=null;return{setTest:function(gt){k||(gt?de(i.STENCIL_TEST):Ie(i.STENCIL_TEST))},setMask:function(gt){ce!==gt&&!k&&(i.stencilMask(gt),ce=gt)},setFunc:function(gt,qn,Ai){($!==gt||j!==qn||ge!==Ai)&&(i.stencilFunc(gt,qn,Ai),$=gt,j=qn,ge=Ai)},setOp:function(gt,qn,Ai){(pe!==gt||Oe!==qn||Ut!==Ai)&&(i.stencilOp(gt,qn,Ai),pe=gt,Oe=qn,Ut=Ai)},setLocked:function(gt){k=gt},setClear:function(gt){rn!==gt&&(i.clearStencil(gt),rn=gt)},reset:function(){k=!1,ce=null,$=null,j=null,ge=null,pe=null,Oe=null,Ut=null,rn=null}}}let r=new t,a=new n,o=new s,l=new WeakMap,h=new WeakMap,c={},u={},d=new WeakMap,m=[],g=null,v=!1,p=null,f=null,w=null,S=null,x=null,I=null,R=null,T=new le(0,0,0),C=0,y=!1,_=null,L=null,N=null,P=null,F=null,H=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),O=!1,Z=0,G=i.getParameter(i.VERSION);G.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(G)[1]),O=Z>=1):G.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),O=Z>=2);let ae=null,ee={},ve=i.getParameter(i.SCISSOR_BOX),Fe=i.getParameter(i.VIEWPORT),ht=new yt().fromArray(ve),Y=new yt().fromArray(Fe);function ie(k,ce,$,j){let ge=new Uint8Array(4),pe=i.createTexture();i.bindTexture(k,pe),i.texParameteri(k,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(k,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Oe=0;Oe<$;Oe++)k===i.TEXTURE_3D||k===i.TEXTURE_2D_ARRAY?i.texImage3D(ce,0,i.RGBA,1,1,j,0,i.RGBA,i.UNSIGNED_BYTE,ge):i.texImage2D(ce+Oe,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ge);return pe}let Ae={};Ae[i.TEXTURE_2D]=ie(i.TEXTURE_2D,i.TEXTURE_2D,1),Ae[i.TEXTURE_CUBE_MAP]=ie(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Ae[i.TEXTURE_2D_ARRAY]=ie(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Ae[i.TEXTURE_3D]=ie(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),de(i.DEPTH_TEST),a.setFunc(Sr),je(!1),Qe(Wd),de(i.CULL_FACE),z(ss);function de(k){c[k]!==!0&&(i.enable(k),c[k]=!0)}function Ie(k){c[k]!==!1&&(i.disable(k),c[k]=!1)}function Be(k,ce){return u[k]!==ce?(i.bindFramebuffer(k,ce),u[k]=ce,k===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=ce),k===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=ce),!0):!1}function $e(k,ce){let $=m,j=!1;if(k){$=d.get(ce),$===void 0&&($=[],d.set(ce,$));let ge=k.textures;if($.length!==ge.length||$[0]!==i.COLOR_ATTACHMENT0){for(let pe=0,Oe=ge.length;pe<Oe;pe++)$[pe]=i.COLOR_ATTACHMENT0+pe;$.length=ge.length,j=!0}}else $[0]!==i.BACK&&($[0]=i.BACK,j=!0);j&&i.drawBuffers($)}function Nt(k){return g!==k?(i.useProgram(k),g=k,!0):!1}let tt={[Cs]:i.FUNC_ADD,[Tg]:i.FUNC_SUBTRACT,[Eg]:i.FUNC_REVERSE_SUBTRACT};tt[Cg]=i.MIN,tt[Rg]=i.MAX;let Ft={[Pg]:i.ZERO,[Ig]:i.ONE,[Lg]:i.SRC_COLOR,[Yc]:i.SRC_ALPHA,[Bg]:i.SRC_ALPHA_SATURATE,[Ug]:i.DST_COLOR,[Ng]:i.DST_ALPHA,[Dg]:i.ONE_MINUS_SRC_COLOR,[Kc]:i.ONE_MINUS_SRC_ALPHA,[Fg]:i.ONE_MINUS_DST_COLOR,[kg]:i.ONE_MINUS_DST_ALPHA,[Og]:i.CONSTANT_COLOR,[zg]:i.ONE_MINUS_CONSTANT_COLOR,[Hg]:i.CONSTANT_ALPHA,[Vg]:i.ONE_MINUS_CONSTANT_ALPHA};function z(k,ce,$,j,ge,pe,Oe,Ut,rn,gt){if(k===ss){v===!0&&(Ie(i.BLEND),v=!1);return}if(v===!1&&(de(i.BLEND),v=!0),k!==Ag){if(k!==p||gt!==y){if((f!==Cs||x!==Cs)&&(i.blendEquation(i.FUNC_ADD),f=Cs,x=Cs),gt)switch(k){case _r:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ds:i.blendFunc(i.ONE,i.ONE);break;case qd:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case $d:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",k);break}else switch(k){case _r:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ds:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case qd:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case $d:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",k);break}w=null,S=null,I=null,R=null,T.set(0,0,0),C=0,p=k,y=gt}return}ge=ge||ce,pe=pe||$,Oe=Oe||j,(ce!==f||ge!==x)&&(i.blendEquationSeparate(tt[ce],tt[ge]),f=ce,x=ge),($!==w||j!==S||pe!==I||Oe!==R)&&(i.blendFuncSeparate(Ft[$],Ft[j],Ft[pe],Ft[Oe]),w=$,S=j,I=pe,R=Oe),(Ut.equals(T)===!1||rn!==C)&&(i.blendColor(Ut.r,Ut.g,Ut.b,rn),T.copy(Ut),C=rn),p=k,y=!1}function Dn(k,ce){k.side===Fn?Ie(i.CULL_FACE):de(i.CULL_FACE);let $=k.side===xn;ce&&($=!$),je($),k.blending===_r&&k.transparent===!1?z(ss):z(k.blending,k.blendEquation,k.blendSrc,k.blendDst,k.blendEquationAlpha,k.blendSrcAlpha,k.blendDstAlpha,k.blendColor,k.blendAlpha,k.premultipliedAlpha),a.setFunc(k.depthFunc),a.setTest(k.depthTest),a.setMask(k.depthWrite),r.setMask(k.colorWrite);let j=k.stencilWrite;o.setTest(j),j&&(o.setMask(k.stencilWriteMask),o.setFunc(k.stencilFunc,k.stencilRef,k.stencilFuncMask),o.setOp(k.stencilFail,k.stencilZFail,k.stencilZPass)),Tt(k.polygonOffset,k.polygonOffsetFactor,k.polygonOffsetUnits),k.alphaToCoverage===!0?de(i.SAMPLE_ALPHA_TO_COVERAGE):Ie(i.SAMPLE_ALPHA_TO_COVERAGE)}function je(k){_!==k&&(k?i.frontFace(i.CW):i.frontFace(i.CCW),_=k)}function Qe(k){k!==wg?(de(i.CULL_FACE),k!==L&&(k===Wd?i.cullFace(i.BACK):k===Sg?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Ie(i.CULL_FACE),L=k}function Re(k){k!==N&&(O&&i.lineWidth(k),N=k)}function Tt(k,ce,$){k?(de(i.POLYGON_OFFSET_FILL),(P!==ce||F!==$)&&(i.polygonOffset(ce,$),P=ce,F=$)):Ie(i.POLYGON_OFFSET_FILL)}function Ce(k){k?de(i.SCISSOR_TEST):Ie(i.SCISSOR_TEST)}function E(k){k===void 0&&(k=i.TEXTURE0+H-1),ae!==k&&(i.activeTexture(k),ae=k)}function b(k,ce,$){$===void 0&&(ae===null?$=i.TEXTURE0+H-1:$=ae);let j=ee[$];j===void 0&&(j={type:void 0,texture:void 0},ee[$]=j),(j.type!==k||j.texture!==ce)&&(ae!==$&&(i.activeTexture($),ae=$),i.bindTexture(k,ce||Ae[k]),j.type=k,j.texture=ce)}function V(){let k=ee[ae];k!==void 0&&k.type!==void 0&&(i.bindTexture(k.type,null),k.type=void 0,k.texture=void 0)}function J(){try{i.compressedTexImage2D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Q(){try{i.compressedTexImage3D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function K(){try{i.texSubImage2D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Te(){try{i.texSubImage3D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function fe(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function ye(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function nt(){try{i.texStorage2D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function te(){try{i.texStorage3D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function _e(){try{i.texImage2D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Pe(){try{i.texImage3D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Ne(k){ht.equals(k)===!1&&(i.scissor(k.x,k.y,k.z,k.w),ht.copy(k))}function be(k){Y.equals(k)===!1&&(i.viewport(k.x,k.y,k.z,k.w),Y.copy(k))}function et(k,ce){let $=h.get(ce);$===void 0&&($=new WeakMap,h.set(ce,$));let j=$.get(k);j===void 0&&(j=i.getUniformBlockIndex(ce,k.name),$.set(k,j))}function He(k,ce){let j=h.get(ce).get(k);l.get(ce)!==j&&(i.uniformBlockBinding(ce,j,k.__bindingPointIndex),l.set(ce,j))}function St(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),c={},ae=null,ee={},u={},d=new WeakMap,m=[],g=null,v=!1,p=null,f=null,w=null,S=null,x=null,I=null,R=null,T=new le(0,0,0),C=0,y=!1,_=null,L=null,N=null,P=null,F=null,ht.set(0,0,i.canvas.width,i.canvas.height),Y.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:de,disable:Ie,bindFramebuffer:Be,drawBuffers:$e,useProgram:Nt,setBlending:z,setMaterial:Dn,setFlipSided:je,setCullFace:Qe,setLineWidth:Re,setPolygonOffset:Tt,setScissorTest:Ce,activeTexture:E,bindTexture:b,unbindTexture:V,compressedTexImage2D:J,compressedTexImage3D:Q,texImage2D:_e,texImage3D:Pe,updateUBOMapping:et,uniformBlockBinding:He,texStorage2D:nt,texStorage3D:te,texSubImage2D:K,texSubImage3D:Te,compressedTexSubImage2D:fe,compressedTexSubImage3D:ye,scissor:Ne,viewport:be,reset:St}}function Gf(i,e,t,n){let s=J_(n);switch(t){case Qf:return i*e;case tp:return i*e;case np:return i*e*2;case mu:return i*e/s.components*s.byteLength;case gu:return i*e/s.components*s.byteLength;case ip:return i*e*2/s.components*s.byteLength;case vu:return i*e*2/s.components*s.byteLength;case ep:return i*e*3/s.components*s.byteLength;case Zn:return i*e*4/s.components*s.byteLength;case xu:return i*e*4/s.components*s.byteLength;case Uo:case Fo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Bo:case Oo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case lh:case hh:return Math.max(i,16)*Math.max(e,8)/4;case oh:case ch:return Math.max(i,8)*Math.max(e,8)/2;case uh:case dh:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case fh:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case ph:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case mh:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case gh:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case vh:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case xh:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case yh:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case _h:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case bh:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Mh:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case wh:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case Sh:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case Ah:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case Th:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case Eh:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case zo:case Ch:case Rh:return Math.ceil(i/4)*Math.ceil(e/4)*16;case sp:case Ph:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Ih:case Lh:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function J_(i){switch(i){case Ui:case Zf:return{byteLength:1,components:1};case wa:case Jf:case Ca:return{byteLength:2,components:1};case fu:case pu:return{byteLength:2,components:4};case Ns:case du:case di:return{byteLength:4,components:1};case jf:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function j_(i,e,t,n,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new Xe,c=new WeakMap,u,d=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(E,b){return m?new OffscreenCanvas(E,b):Go("canvas")}function v(E,b,V){let J=1,Q=Ce(E);if((Q.width>V||Q.height>V)&&(J=V/Math.max(Q.width,Q.height)),J<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){let K=Math.floor(J*Q.width),Te=Math.floor(J*Q.height);u===void 0&&(u=g(K,Te));let fe=b?g(K,Te):u;return fe.width=K,fe.height=Te,fe.getContext("2d").drawImage(E,0,0,K,Te),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Q.width+"x"+Q.height+") to ("+K+"x"+Te+")."),fe}else return"data"in E&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Q.width+"x"+Q.height+")."),E;return E}function p(E){return E.generateMipmaps}function f(E){i.generateMipmap(E)}function w(E){return E.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:E.isWebGL3DRenderTarget?i.TEXTURE_3D:E.isWebGLArrayRenderTarget||E.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function S(E,b,V,J,Q=!1){if(E!==null){if(i[E]!==void 0)return i[E];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let K=b;if(b===i.RED&&(V===i.FLOAT&&(K=i.R32F),V===i.HALF_FLOAT&&(K=i.R16F),V===i.UNSIGNED_BYTE&&(K=i.R8)),b===i.RED_INTEGER&&(V===i.UNSIGNED_BYTE&&(K=i.R8UI),V===i.UNSIGNED_SHORT&&(K=i.R16UI),V===i.UNSIGNED_INT&&(K=i.R32UI),V===i.BYTE&&(K=i.R8I),V===i.SHORT&&(K=i.R16I),V===i.INT&&(K=i.R32I)),b===i.RG&&(V===i.FLOAT&&(K=i.RG32F),V===i.HALF_FLOAT&&(K=i.RG16F),V===i.UNSIGNED_BYTE&&(K=i.RG8)),b===i.RG_INTEGER&&(V===i.UNSIGNED_BYTE&&(K=i.RG8UI),V===i.UNSIGNED_SHORT&&(K=i.RG16UI),V===i.UNSIGNED_INT&&(K=i.RG32UI),V===i.BYTE&&(K=i.RG8I),V===i.SHORT&&(K=i.RG16I),V===i.INT&&(K=i.RG32I)),b===i.RGB_INTEGER&&(V===i.UNSIGNED_BYTE&&(K=i.RGB8UI),V===i.UNSIGNED_SHORT&&(K=i.RGB16UI),V===i.UNSIGNED_INT&&(K=i.RGB32UI),V===i.BYTE&&(K=i.RGB8I),V===i.SHORT&&(K=i.RGB16I),V===i.INT&&(K=i.RGB32I)),b===i.RGBA_INTEGER&&(V===i.UNSIGNED_BYTE&&(K=i.RGBA8UI),V===i.UNSIGNED_SHORT&&(K=i.RGBA16UI),V===i.UNSIGNED_INT&&(K=i.RGBA32UI),V===i.BYTE&&(K=i.RGBA8I),V===i.SHORT&&(K=i.RGBA16I),V===i.INT&&(K=i.RGBA32I)),b===i.RGB&&V===i.UNSIGNED_INT_5_9_9_9_REV&&(K=i.RGB9_E5),b===i.RGBA){let Te=Q?hl:it.getTransfer(J);V===i.FLOAT&&(K=i.RGBA32F),V===i.HALF_FLOAT&&(K=i.RGBA16F),V===i.UNSIGNED_BYTE&&(K=Te===xt?i.SRGB8_ALPHA8:i.RGBA8),V===i.UNSIGNED_SHORT_4_4_4_4&&(K=i.RGBA4),V===i.UNSIGNED_SHORT_5_5_5_1&&(K=i.RGB5_A1)}return(K===i.R16F||K===i.R32F||K===i.RG16F||K===i.RG32F||K===i.RGBA16F||K===i.RGBA32F)&&e.get("EXT_color_buffer_float"),K}function x(E,b){let V;return E?b===null||b===Ns||b===Er?V=i.DEPTH24_STENCIL8:b===di?V=i.DEPTH32F_STENCIL8:b===wa&&(V=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):b===null||b===Ns||b===Er?V=i.DEPTH_COMPONENT24:b===di?V=i.DEPTH_COMPONENT32F:b===wa&&(V=i.DEPTH_COMPONENT16),V}function I(E,b){return p(E)===!0||E.isFramebufferTexture&&E.minFilter!==Sn&&E.minFilter!==ui?Math.log2(Math.max(b.width,b.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?b.mipmaps.length:1}function R(E){let b=E.target;b.removeEventListener("dispose",R),C(b),b.isVideoTexture&&c.delete(b)}function T(E){let b=E.target;b.removeEventListener("dispose",T),_(b)}function C(E){let b=n.get(E);if(b.__webglInit===void 0)return;let V=E.source,J=d.get(V);if(J){let Q=J[b.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&y(E),Object.keys(J).length===0&&d.delete(V)}n.remove(E)}function y(E){let b=n.get(E);i.deleteTexture(b.__webglTexture);let V=E.source,J=d.get(V);delete J[b.__cacheKey],a.memory.textures--}function _(E){let b=n.get(E);if(E.depthTexture&&(E.depthTexture.dispose(),n.remove(E.depthTexture)),E.isWebGLCubeRenderTarget)for(let J=0;J<6;J++){if(Array.isArray(b.__webglFramebuffer[J]))for(let Q=0;Q<b.__webglFramebuffer[J].length;Q++)i.deleteFramebuffer(b.__webglFramebuffer[J][Q]);else i.deleteFramebuffer(b.__webglFramebuffer[J]);b.__webglDepthbuffer&&i.deleteRenderbuffer(b.__webglDepthbuffer[J])}else{if(Array.isArray(b.__webglFramebuffer))for(let J=0;J<b.__webglFramebuffer.length;J++)i.deleteFramebuffer(b.__webglFramebuffer[J]);else i.deleteFramebuffer(b.__webglFramebuffer);if(b.__webglDepthbuffer&&i.deleteRenderbuffer(b.__webglDepthbuffer),b.__webglMultisampledFramebuffer&&i.deleteFramebuffer(b.__webglMultisampledFramebuffer),b.__webglColorRenderbuffer)for(let J=0;J<b.__webglColorRenderbuffer.length;J++)b.__webglColorRenderbuffer[J]&&i.deleteRenderbuffer(b.__webglColorRenderbuffer[J]);b.__webglDepthRenderbuffer&&i.deleteRenderbuffer(b.__webglDepthRenderbuffer)}let V=E.textures;for(let J=0,Q=V.length;J<Q;J++){let K=n.get(V[J]);K.__webglTexture&&(i.deleteTexture(K.__webglTexture),a.memory.textures--),n.remove(V[J])}n.remove(E)}let L=0;function N(){L=0}function P(){let E=L;return E>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+s.maxTextures),L+=1,E}function F(E){let b=[];return b.push(E.wrapS),b.push(E.wrapT),b.push(E.wrapR||0),b.push(E.magFilter),b.push(E.minFilter),b.push(E.anisotropy),b.push(E.internalFormat),b.push(E.format),b.push(E.type),b.push(E.generateMipmaps),b.push(E.premultiplyAlpha),b.push(E.flipY),b.push(E.unpackAlignment),b.push(E.colorSpace),b.join()}function H(E,b){let V=n.get(E);if(E.isVideoTexture&&Re(E),E.isRenderTargetTexture===!1&&E.version>0&&V.__version!==E.version){let J=E.image;if(J===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(J.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Y(V,E,b);return}}t.bindTexture(i.TEXTURE_2D,V.__webglTexture,i.TEXTURE0+b)}function O(E,b){let V=n.get(E);if(E.version>0&&V.__version!==E.version){Y(V,E,b);return}t.bindTexture(i.TEXTURE_2D_ARRAY,V.__webglTexture,i.TEXTURE0+b)}function Z(E,b){let V=n.get(E);if(E.version>0&&V.__version!==E.version){Y(V,E,b);return}t.bindTexture(i.TEXTURE_3D,V.__webglTexture,i.TEXTURE0+b)}function G(E,b){let V=n.get(E);if(E.version>0&&V.__version!==E.version){ie(V,E,b);return}t.bindTexture(i.TEXTURE_CUBE_MAP,V.__webglTexture,i.TEXTURE0+b)}let ae={[rh]:i.REPEAT,[Is]:i.CLAMP_TO_EDGE,[ah]:i.MIRRORED_REPEAT},ee={[Sn]:i.NEAREST,[Jg]:i.NEAREST_MIPMAP_NEAREST,[fo]:i.NEAREST_MIPMAP_LINEAR,[ui]:i.LINEAR,[gc]:i.LINEAR_MIPMAP_NEAREST,[Ls]:i.LINEAR_MIPMAP_LINEAR},ve={[t0]:i.NEVER,[o0]:i.ALWAYS,[n0]:i.LESS,[rp]:i.LEQUAL,[i0]:i.EQUAL,[a0]:i.GEQUAL,[s0]:i.GREATER,[r0]:i.NOTEQUAL};function Fe(E,b){if(b.type===di&&e.has("OES_texture_float_linear")===!1&&(b.magFilter===ui||b.magFilter===gc||b.magFilter===fo||b.magFilter===Ls||b.minFilter===ui||b.minFilter===gc||b.minFilter===fo||b.minFilter===Ls)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(E,i.TEXTURE_WRAP_S,ae[b.wrapS]),i.texParameteri(E,i.TEXTURE_WRAP_T,ae[b.wrapT]),(E===i.TEXTURE_3D||E===i.TEXTURE_2D_ARRAY)&&i.texParameteri(E,i.TEXTURE_WRAP_R,ae[b.wrapR]),i.texParameteri(E,i.TEXTURE_MAG_FILTER,ee[b.magFilter]),i.texParameteri(E,i.TEXTURE_MIN_FILTER,ee[b.minFilter]),b.compareFunction&&(i.texParameteri(E,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(E,i.TEXTURE_COMPARE_FUNC,ve[b.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(b.magFilter===Sn||b.minFilter!==fo&&b.minFilter!==Ls||b.type===di&&e.has("OES_texture_float_linear")===!1)return;if(b.anisotropy>1||n.get(b).__currentAnisotropy){let V=e.get("EXT_texture_filter_anisotropic");i.texParameterf(E,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(b.anisotropy,s.getMaxAnisotropy())),n.get(b).__currentAnisotropy=b.anisotropy}}}function ht(E,b){let V=!1;E.__webglInit===void 0&&(E.__webglInit=!0,b.addEventListener("dispose",R));let J=b.source,Q=d.get(J);Q===void 0&&(Q={},d.set(J,Q));let K=F(b);if(K!==E.__cacheKey){Q[K]===void 0&&(Q[K]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,V=!0),Q[K].usedTimes++;let Te=Q[E.__cacheKey];Te!==void 0&&(Q[E.__cacheKey].usedTimes--,Te.usedTimes===0&&y(b)),E.__cacheKey=K,E.__webglTexture=Q[K].texture}return V}function Y(E,b,V){let J=i.TEXTURE_2D;(b.isDataArrayTexture||b.isCompressedArrayTexture)&&(J=i.TEXTURE_2D_ARRAY),b.isData3DTexture&&(J=i.TEXTURE_3D);let Q=ht(E,b),K=b.source;t.bindTexture(J,E.__webglTexture,i.TEXTURE0+V);let Te=n.get(K);if(K.version!==Te.__version||Q===!0){t.activeTexture(i.TEXTURE0+V);let fe=it.getPrimaries(it.workingColorSpace),ye=b.colorSpace===is?null:it.getPrimaries(b.colorSpace),nt=b.colorSpace===is||fe===ye?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,b.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,b.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,nt);let te=v(b.image,!1,s.maxTextureSize);te=Tt(b,te);let _e=r.convert(b.format,b.colorSpace),Pe=r.convert(b.type),Ne=S(b.internalFormat,_e,Pe,b.colorSpace,b.isVideoTexture);Fe(J,b);let be,et=b.mipmaps,He=b.isVideoTexture!==!0,St=Te.__version===void 0||Q===!0,k=K.dataReady,ce=I(b,te);if(b.isDepthTexture)Ne=x(b.format===Cr,b.type),St&&(He?t.texStorage2D(i.TEXTURE_2D,1,Ne,te.width,te.height):t.texImage2D(i.TEXTURE_2D,0,Ne,te.width,te.height,0,_e,Pe,null));else if(b.isDataTexture)if(et.length>0){He&&St&&t.texStorage2D(i.TEXTURE_2D,ce,Ne,et[0].width,et[0].height);for(let $=0,j=et.length;$<j;$++)be=et[$],He?k&&t.texSubImage2D(i.TEXTURE_2D,$,0,0,be.width,be.height,_e,Pe,be.data):t.texImage2D(i.TEXTURE_2D,$,Ne,be.width,be.height,0,_e,Pe,be.data);b.generateMipmaps=!1}else He?(St&&t.texStorage2D(i.TEXTURE_2D,ce,Ne,te.width,te.height),k&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,te.width,te.height,_e,Pe,te.data)):t.texImage2D(i.TEXTURE_2D,0,Ne,te.width,te.height,0,_e,Pe,te.data);else if(b.isCompressedTexture)if(b.isCompressedArrayTexture){He&&St&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ce,Ne,et[0].width,et[0].height,te.depth);for(let $=0,j=et.length;$<j;$++)if(be=et[$],b.format!==Zn)if(_e!==null)if(He){if(k)if(b.layerUpdates.size>0){let ge=Gf(be.width,be.height,b.format,b.type);for(let pe of b.layerUpdates){let Oe=be.data.subarray(pe*ge/be.data.BYTES_PER_ELEMENT,(pe+1)*ge/be.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,pe,be.width,be.height,1,_e,Oe)}b.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,0,be.width,be.height,te.depth,_e,be.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,$,Ne,be.width,be.height,te.depth,0,be.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else He?k&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,0,be.width,be.height,te.depth,_e,Pe,be.data):t.texImage3D(i.TEXTURE_2D_ARRAY,$,Ne,be.width,be.height,te.depth,0,_e,Pe,be.data)}else{He&&St&&t.texStorage2D(i.TEXTURE_2D,ce,Ne,et[0].width,et[0].height);for(let $=0,j=et.length;$<j;$++)be=et[$],b.format!==Zn?_e!==null?He?k&&t.compressedTexSubImage2D(i.TEXTURE_2D,$,0,0,be.width,be.height,_e,be.data):t.compressedTexImage2D(i.TEXTURE_2D,$,Ne,be.width,be.height,0,be.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):He?k&&t.texSubImage2D(i.TEXTURE_2D,$,0,0,be.width,be.height,_e,Pe,be.data):t.texImage2D(i.TEXTURE_2D,$,Ne,be.width,be.height,0,_e,Pe,be.data)}else if(b.isDataArrayTexture)if(He){if(St&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ce,Ne,te.width,te.height,te.depth),k)if(b.layerUpdates.size>0){let $=Gf(te.width,te.height,b.format,b.type);for(let j of b.layerUpdates){let ge=te.data.subarray(j*$/te.data.BYTES_PER_ELEMENT,(j+1)*$/te.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,j,te.width,te.height,1,_e,Pe,ge)}b.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,te.width,te.height,te.depth,_e,Pe,te.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Ne,te.width,te.height,te.depth,0,_e,Pe,te.data);else if(b.isData3DTexture)He?(St&&t.texStorage3D(i.TEXTURE_3D,ce,Ne,te.width,te.height,te.depth),k&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,te.width,te.height,te.depth,_e,Pe,te.data)):t.texImage3D(i.TEXTURE_3D,0,Ne,te.width,te.height,te.depth,0,_e,Pe,te.data);else if(b.isFramebufferTexture){if(St)if(He)t.texStorage2D(i.TEXTURE_2D,ce,Ne,te.width,te.height);else{let $=te.width,j=te.height;for(let ge=0;ge<ce;ge++)t.texImage2D(i.TEXTURE_2D,ge,Ne,$,j,0,_e,Pe,null),$>>=1,j>>=1}}else if(et.length>0){if(He&&St){let $=Ce(et[0]);t.texStorage2D(i.TEXTURE_2D,ce,Ne,$.width,$.height)}for(let $=0,j=et.length;$<j;$++)be=et[$],He?k&&t.texSubImage2D(i.TEXTURE_2D,$,0,0,_e,Pe,be):t.texImage2D(i.TEXTURE_2D,$,Ne,_e,Pe,be);b.generateMipmaps=!1}else if(He){if(St){let $=Ce(te);t.texStorage2D(i.TEXTURE_2D,ce,Ne,$.width,$.height)}k&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,_e,Pe,te)}else t.texImage2D(i.TEXTURE_2D,0,Ne,_e,Pe,te);p(b)&&f(J),Te.__version=K.version,b.onUpdate&&b.onUpdate(b)}E.__version=b.version}function ie(E,b,V){if(b.image.length!==6)return;let J=ht(E,b),Q=b.source;t.bindTexture(i.TEXTURE_CUBE_MAP,E.__webglTexture,i.TEXTURE0+V);let K=n.get(Q);if(Q.version!==K.__version||J===!0){t.activeTexture(i.TEXTURE0+V);let Te=it.getPrimaries(it.workingColorSpace),fe=b.colorSpace===is?null:it.getPrimaries(b.colorSpace),ye=b.colorSpace===is||Te===fe?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,b.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,b.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ye);let nt=b.isCompressedTexture||b.image[0].isCompressedTexture,te=b.image[0]&&b.image[0].isDataTexture,_e=[];for(let j=0;j<6;j++)!nt&&!te?_e[j]=v(b.image[j],!0,s.maxCubemapSize):_e[j]=te?b.image[j].image:b.image[j],_e[j]=Tt(b,_e[j]);let Pe=_e[0],Ne=r.convert(b.format,b.colorSpace),be=r.convert(b.type),et=S(b.internalFormat,Ne,be,b.colorSpace),He=b.isVideoTexture!==!0,St=K.__version===void 0||J===!0,k=Q.dataReady,ce=I(b,Pe);Fe(i.TEXTURE_CUBE_MAP,b);let $;if(nt){He&&St&&t.texStorage2D(i.TEXTURE_CUBE_MAP,ce,et,Pe.width,Pe.height);for(let j=0;j<6;j++){$=_e[j].mipmaps;for(let ge=0;ge<$.length;ge++){let pe=$[ge];b.format!==Zn?Ne!==null?He?k&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge,0,0,pe.width,pe.height,Ne,pe.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge,et,pe.width,pe.height,0,pe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):He?k&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge,0,0,pe.width,pe.height,Ne,be,pe.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge,et,pe.width,pe.height,0,Ne,be,pe.data)}}}else{if($=b.mipmaps,He&&St){$.length>0&&ce++;let j=Ce(_e[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,ce,et,j.width,j.height)}for(let j=0;j<6;j++)if(te){He?k&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,_e[j].width,_e[j].height,Ne,be,_e[j].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,et,_e[j].width,_e[j].height,0,Ne,be,_e[j].data);for(let ge=0;ge<$.length;ge++){let Oe=$[ge].image[j].image;He?k&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge+1,0,0,Oe.width,Oe.height,Ne,be,Oe.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge+1,et,Oe.width,Oe.height,0,Ne,be,Oe.data)}}else{He?k&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,Ne,be,_e[j]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,et,Ne,be,_e[j]);for(let ge=0;ge<$.length;ge++){let pe=$[ge];He?k&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge+1,0,0,Ne,be,pe.image[j]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,ge+1,et,Ne,be,pe.image[j])}}}p(b)&&f(i.TEXTURE_CUBE_MAP),K.__version=Q.version,b.onUpdate&&b.onUpdate(b)}E.__version=b.version}function Ae(E,b,V,J,Q,K){let Te=r.convert(V.format,V.colorSpace),fe=r.convert(V.type),ye=S(V.internalFormat,Te,fe,V.colorSpace),nt=n.get(b),te=n.get(V);if(te.__renderTarget=b,!nt.__hasExternalTextures){let _e=Math.max(1,b.width>>K),Pe=Math.max(1,b.height>>K);Q===i.TEXTURE_3D||Q===i.TEXTURE_2D_ARRAY?t.texImage3D(Q,K,ye,_e,Pe,b.depth,0,Te,fe,null):t.texImage2D(Q,K,ye,_e,Pe,0,Te,fe,null)}t.bindFramebuffer(i.FRAMEBUFFER,E),Qe(b)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,J,Q,te.__webglTexture,0,je(b)):(Q===i.TEXTURE_2D||Q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,J,Q,te.__webglTexture,K),t.bindFramebuffer(i.FRAMEBUFFER,null)}function de(E,b,V){if(i.bindRenderbuffer(i.RENDERBUFFER,E),b.depthBuffer){let J=b.depthTexture,Q=J&&J.isDepthTexture?J.type:null,K=x(b.stencilBuffer,Q),Te=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,fe=je(b);Qe(b)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,fe,K,b.width,b.height):V?i.renderbufferStorageMultisample(i.RENDERBUFFER,fe,K,b.width,b.height):i.renderbufferStorage(i.RENDERBUFFER,K,b.width,b.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Te,i.RENDERBUFFER,E)}else{let J=b.textures;for(let Q=0;Q<J.length;Q++){let K=J[Q],Te=r.convert(K.format,K.colorSpace),fe=r.convert(K.type),ye=S(K.internalFormat,Te,fe,K.colorSpace),nt=je(b);V&&Qe(b)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,nt,ye,b.width,b.height):Qe(b)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,nt,ye,b.width,b.height):i.renderbufferStorage(i.RENDERBUFFER,ye,b.width,b.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Ie(E,b){if(b&&b.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,E),!(b.depthTexture&&b.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let J=n.get(b.depthTexture);J.__renderTarget=b,(!J.__webglTexture||b.depthTexture.image.width!==b.width||b.depthTexture.image.height!==b.height)&&(b.depthTexture.image.width=b.width,b.depthTexture.image.height=b.height,b.depthTexture.needsUpdate=!0),H(b.depthTexture,0);let Q=J.__webglTexture,K=je(b);if(b.depthTexture.format===br)Qe(b)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Q,0,K):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Q,0);else if(b.depthTexture.format===Cr)Qe(b)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Q,0,K):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Q,0);else throw new Error("Unknown depthTexture format")}function Be(E){let b=n.get(E),V=E.isWebGLCubeRenderTarget===!0;if(b.__boundDepthTexture!==E.depthTexture){let J=E.depthTexture;if(b.__depthDisposeCallback&&b.__depthDisposeCallback(),J){let Q=()=>{delete b.__boundDepthTexture,delete b.__depthDisposeCallback,J.removeEventListener("dispose",Q)};J.addEventListener("dispose",Q),b.__depthDisposeCallback=Q}b.__boundDepthTexture=J}if(E.depthTexture&&!b.__autoAllocateDepthBuffer){if(V)throw new Error("target.depthTexture not supported in Cube render targets");Ie(b.__webglFramebuffer,E)}else if(V){b.__webglDepthbuffer=[];for(let J=0;J<6;J++)if(t.bindFramebuffer(i.FRAMEBUFFER,b.__webglFramebuffer[J]),b.__webglDepthbuffer[J]===void 0)b.__webglDepthbuffer[J]=i.createRenderbuffer(),de(b.__webglDepthbuffer[J],E,!1);else{let Q=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,K=b.__webglDepthbuffer[J];i.bindRenderbuffer(i.RENDERBUFFER,K),i.framebufferRenderbuffer(i.FRAMEBUFFER,Q,i.RENDERBUFFER,K)}}else if(t.bindFramebuffer(i.FRAMEBUFFER,b.__webglFramebuffer),b.__webglDepthbuffer===void 0)b.__webglDepthbuffer=i.createRenderbuffer(),de(b.__webglDepthbuffer,E,!1);else{let J=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Q=b.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Q),i.framebufferRenderbuffer(i.FRAMEBUFFER,J,i.RENDERBUFFER,Q)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function $e(E,b,V){let J=n.get(E);b!==void 0&&Ae(J.__webglFramebuffer,E,E.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),V!==void 0&&Be(E)}function Nt(E){let b=E.texture,V=n.get(E),J=n.get(b);E.addEventListener("dispose",T);let Q=E.textures,K=E.isWebGLCubeRenderTarget===!0,Te=Q.length>1;if(Te||(J.__webglTexture===void 0&&(J.__webglTexture=i.createTexture()),J.__version=b.version,a.memory.textures++),K){V.__webglFramebuffer=[];for(let fe=0;fe<6;fe++)if(b.mipmaps&&b.mipmaps.length>0){V.__webglFramebuffer[fe]=[];for(let ye=0;ye<b.mipmaps.length;ye++)V.__webglFramebuffer[fe][ye]=i.createFramebuffer()}else V.__webglFramebuffer[fe]=i.createFramebuffer()}else{if(b.mipmaps&&b.mipmaps.length>0){V.__webglFramebuffer=[];for(let fe=0;fe<b.mipmaps.length;fe++)V.__webglFramebuffer[fe]=i.createFramebuffer()}else V.__webglFramebuffer=i.createFramebuffer();if(Te)for(let fe=0,ye=Q.length;fe<ye;fe++){let nt=n.get(Q[fe]);nt.__webglTexture===void 0&&(nt.__webglTexture=i.createTexture(),a.memory.textures++)}if(E.samples>0&&Qe(E)===!1){V.__webglMultisampledFramebuffer=i.createFramebuffer(),V.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let fe=0;fe<Q.length;fe++){let ye=Q[fe];V.__webglColorRenderbuffer[fe]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,V.__webglColorRenderbuffer[fe]);let nt=r.convert(ye.format,ye.colorSpace),te=r.convert(ye.type),_e=S(ye.internalFormat,nt,te,ye.colorSpace,E.isXRRenderTarget===!0),Pe=je(E);i.renderbufferStorageMultisample(i.RENDERBUFFER,Pe,_e,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.RENDERBUFFER,V.__webglColorRenderbuffer[fe])}i.bindRenderbuffer(i.RENDERBUFFER,null),E.depthBuffer&&(V.__webglDepthRenderbuffer=i.createRenderbuffer(),de(V.__webglDepthRenderbuffer,E,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(K){t.bindTexture(i.TEXTURE_CUBE_MAP,J.__webglTexture),Fe(i.TEXTURE_CUBE_MAP,b);for(let fe=0;fe<6;fe++)if(b.mipmaps&&b.mipmaps.length>0)for(let ye=0;ye<b.mipmaps.length;ye++)Ae(V.__webglFramebuffer[fe][ye],E,b,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,ye);else Ae(V.__webglFramebuffer[fe],E,b,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+fe,0);p(b)&&f(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Te){for(let fe=0,ye=Q.length;fe<ye;fe++){let nt=Q[fe],te=n.get(nt);t.bindTexture(i.TEXTURE_2D,te.__webglTexture),Fe(i.TEXTURE_2D,nt),Ae(V.__webglFramebuffer,E,nt,i.COLOR_ATTACHMENT0+fe,i.TEXTURE_2D,0),p(nt)&&f(i.TEXTURE_2D)}t.unbindTexture()}else{let fe=i.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(fe=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(fe,J.__webglTexture),Fe(fe,b),b.mipmaps&&b.mipmaps.length>0)for(let ye=0;ye<b.mipmaps.length;ye++)Ae(V.__webglFramebuffer[ye],E,b,i.COLOR_ATTACHMENT0,fe,ye);else Ae(V.__webglFramebuffer,E,b,i.COLOR_ATTACHMENT0,fe,0);p(b)&&f(fe),t.unbindTexture()}E.depthBuffer&&Be(E)}function tt(E){let b=E.textures;for(let V=0,J=b.length;V<J;V++){let Q=b[V];if(p(Q)){let K=w(E),Te=n.get(Q).__webglTexture;t.bindTexture(K,Te),f(K),t.unbindTexture()}}}let Ft=[],z=[];function Dn(E){if(E.samples>0){if(Qe(E)===!1){let b=E.textures,V=E.width,J=E.height,Q=i.COLOR_BUFFER_BIT,K=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Te=n.get(E),fe=b.length>1;if(fe)for(let ye=0;ye<b.length;ye++)t.bindFramebuffer(i.FRAMEBUFFER,Te.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ye,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Te.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ye,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Te.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Te.__webglFramebuffer);for(let ye=0;ye<b.length;ye++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(Q|=i.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(Q|=i.STENCIL_BUFFER_BIT)),fe){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Te.__webglColorRenderbuffer[ye]);let nt=n.get(b[ye]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,nt,0)}i.blitFramebuffer(0,0,V,J,0,0,V,J,Q,i.NEAREST),l===!0&&(Ft.length=0,z.length=0,Ft.push(i.COLOR_ATTACHMENT0+ye),E.depthBuffer&&E.resolveDepthBuffer===!1&&(Ft.push(K),z.push(K),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,z)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Ft))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),fe)for(let ye=0;ye<b.length;ye++){t.bindFramebuffer(i.FRAMEBUFFER,Te.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ye,i.RENDERBUFFER,Te.__webglColorRenderbuffer[ye]);let nt=n.get(b[ye]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Te.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ye,i.TEXTURE_2D,nt,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Te.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.resolveDepthBuffer===!1&&l){let b=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[b])}}}function je(E){return Math.min(s.maxSamples,E.samples)}function Qe(E){let b=n.get(E);return E.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&b.__useRenderToTexture!==!1}function Re(E){let b=a.render.frame;c.get(E)!==b&&(c.set(E,b),E.update())}function Tt(E,b){let V=E.colorSpace,J=E.format,Q=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||V!==kr&&V!==is&&(it.getTransfer(V)===xt?(J!==Zn||Q!==Ui)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",V)),b}function Ce(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(h.width=E.naturalWidth||E.width,h.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(h.width=E.displayWidth,h.height=E.displayHeight):(h.width=E.width,h.height=E.height),h}this.allocateTextureUnit=P,this.resetTextureUnits=N,this.setTexture2D=H,this.setTexture2DArray=O,this.setTexture3D=Z,this.setTextureCube=G,this.rebindTextures=$e,this.setupRenderTarget=Nt,this.updateRenderTargetMipmap=tt,this.updateMultisampleRenderTarget=Dn,this.setupDepthRenderbuffer=Be,this.setupFrameBufferTexture=Ae,this.useMultisampledRTT=Qe}function Q_(i,e){function t(n,s=is){let r,a=it.getTransfer(s);if(n===Ui)return i.UNSIGNED_BYTE;if(n===fu)return i.UNSIGNED_SHORT_4_4_4_4;if(n===pu)return i.UNSIGNED_SHORT_5_5_5_1;if(n===jf)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Zf)return i.BYTE;if(n===Jf)return i.SHORT;if(n===wa)return i.UNSIGNED_SHORT;if(n===du)return i.INT;if(n===Ns)return i.UNSIGNED_INT;if(n===di)return i.FLOAT;if(n===Ca)return i.HALF_FLOAT;if(n===Qf)return i.ALPHA;if(n===ep)return i.RGB;if(n===Zn)return i.RGBA;if(n===tp)return i.LUMINANCE;if(n===np)return i.LUMINANCE_ALPHA;if(n===br)return i.DEPTH_COMPONENT;if(n===Cr)return i.DEPTH_STENCIL;if(n===mu)return i.RED;if(n===gu)return i.RED_INTEGER;if(n===ip)return i.RG;if(n===vu)return i.RG_INTEGER;if(n===xu)return i.RGBA_INTEGER;if(n===Uo||n===Fo||n===Bo||n===Oo)if(a===xt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Uo)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Fo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Bo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Oo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Uo)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Fo)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Bo)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Oo)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===oh||n===lh||n===ch||n===hh)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===oh)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===lh)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ch)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===hh)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===uh||n===dh||n===fh)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===uh||n===dh)return a===xt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===fh)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===ph||n===mh||n===gh||n===vh||n===xh||n===yh||n===_h||n===bh||n===Mh||n===wh||n===Sh||n===Ah||n===Th||n===Eh)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===ph)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===mh)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===gh)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===vh)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===xh)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===yh)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===_h)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===bh)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Mh)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===wh)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Sh)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Ah)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Th)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Eh)return a===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===zo||n===Ch||n===Rh)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===zo)return a===xt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Ch)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Rh)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===sp||n===Ph||n===Ih||n===Lh)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===zo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Ph)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ih)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Lh)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Er?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var Kh=class extends jt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},Jn=class extends un{constructor(){super(),this.isGroup=!0,this.type="Group"}},eb={type:"move"},Ma=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Jn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Jn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Jn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,h=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(h&&e.hand){a=!0;for(let v of e.hand.values()){let p=t.getJointPose(v,n),f=this._getHandJoint(h,v);p!==null&&(f.matrix.fromArray(p.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=p.radius),f.visible=p!==null}let c=h.joints["index-finger-tip"],u=h.joints["thumb-tip"],d=c.position.distanceTo(u.position),m=.02,g=.005;h.inputState.pinching&&d>m+g?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!h.inputState.pinching&&d<=m-g&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(eb)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),h!==null&&(h.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Jn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},tb=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,nb=`
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

}`,Zh=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){let s=new Tn,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!=n.depthNear||t.depthFar!=n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new fi({vertexShader:tb,fragmentShader:nb,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Mt(new cs(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Jh=class extends os{constructor(e,t){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,h=null,c=null,u=null,d=null,m=null,g=null,v=new Zh,p=t.getContextAttributes(),f=null,w=null,S=[],x=[],I=new Xe,R=null,T=new jt;T.viewport=new yt;let C=new jt;C.viewport=new yt;let y=[T,C],_=new Kh,L=null,N=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let ie=S[Y];return ie===void 0&&(ie=new Ma,S[Y]=ie),ie.getTargetRaySpace()},this.getControllerGrip=function(Y){let ie=S[Y];return ie===void 0&&(ie=new Ma,S[Y]=ie),ie.getGripSpace()},this.getHand=function(Y){let ie=S[Y];return ie===void 0&&(ie=new Ma,S[Y]=ie),ie.getHandSpace()};function P(Y){let ie=x.indexOf(Y.inputSource);if(ie===-1)return;let Ae=S[ie];Ae!==void 0&&(Ae.update(Y.inputSource,Y.frame,h||a),Ae.dispatchEvent({type:Y.type,data:Y.inputSource}))}function F(){s.removeEventListener("select",P),s.removeEventListener("selectstart",P),s.removeEventListener("selectend",P),s.removeEventListener("squeeze",P),s.removeEventListener("squeezestart",P),s.removeEventListener("squeezeend",P),s.removeEventListener("end",F),s.removeEventListener("inputsourceschange",H);for(let Y=0;Y<S.length;Y++){let ie=x[Y];ie!==null&&(x[Y]=null,S[Y].disconnect(ie))}L=null,N=null,v.reset(),e.setRenderTarget(f),m=null,d=null,u=null,s=null,w=null,ht.stop(),n.isPresenting=!1,e.setPixelRatio(R),e.setSize(I.width,I.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){r=Y,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){o=Y,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||a},this.setReferenceSpace=function(Y){h=Y},this.getBaseLayer=function(){return d!==null?d:m},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(Y){if(s=Y,s!==null){if(f=e.getRenderTarget(),s.addEventListener("select",P),s.addEventListener("selectstart",P),s.addEventListener("selectend",P),s.addEventListener("squeeze",P),s.addEventListener("squeezestart",P),s.addEventListener("squeezeend",P),s.addEventListener("end",F),s.addEventListener("inputsourceschange",H),p.xrCompatible!==!0&&await t.makeXRCompatible(),R=e.getPixelRatio(),e.getSize(I),s.renderState.layers===void 0){let ie={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,t,ie),s.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),w=new Fi(m.framebufferWidth,m.framebufferHeight,{format:Zn,type:Ui,colorSpace:e.outputColorSpace,stencilBuffer:p.stencil})}else{let ie=null,Ae=null,de=null;p.depth&&(de=p.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ie=p.stencil?Cr:br,Ae=p.stencil?Er:Ns);let Ie={colorFormat:t.RGBA8,depthFormat:de,scaleFactor:r};u=new XRWebGLBinding(s,t),d=u.createProjectionLayer(Ie),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),w=new Fi(d.textureWidth,d.textureHeight,{format:Zn,type:Ui,depthTexture:new jo(d.textureWidth,d.textureHeight,Ae,void 0,void 0,void 0,void 0,void 0,void 0,ie),stencilBuffer:p.stencil,colorSpace:e.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}w.isXRRenderTarget=!0,this.setFoveation(l),h=null,a=await s.requestReferenceSpace(o),ht.setContext(s),ht.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function H(Y){for(let ie=0;ie<Y.removed.length;ie++){let Ae=Y.removed[ie],de=x.indexOf(Ae);de>=0&&(x[de]=null,S[de].disconnect(Ae))}for(let ie=0;ie<Y.added.length;ie++){let Ae=Y.added[ie],de=x.indexOf(Ae);if(de===-1){for(let Be=0;Be<S.length;Be++)if(Be>=x.length){x.push(Ae),de=Be;break}else if(x[Be]===null){x[Be]=Ae,de=Be;break}if(de===-1)break}let Ie=S[de];Ie&&Ie.connect(Ae)}}let O=new D,Z=new D;function G(Y,ie,Ae){O.setFromMatrixPosition(ie.matrixWorld),Z.setFromMatrixPosition(Ae.matrixWorld);let de=O.distanceTo(Z),Ie=ie.projectionMatrix.elements,Be=Ae.projectionMatrix.elements,$e=Ie[14]/(Ie[10]-1),Nt=Ie[14]/(Ie[10]+1),tt=(Ie[9]+1)/Ie[5],Ft=(Ie[9]-1)/Ie[5],z=(Ie[8]-1)/Ie[0],Dn=(Be[8]+1)/Be[0],je=$e*z,Qe=$e*Dn,Re=de/(-z+Dn),Tt=Re*-z;if(ie.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(Tt),Y.translateZ(Re),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert(),Ie[10]===-1)Y.projectionMatrix.copy(ie.projectionMatrix),Y.projectionMatrixInverse.copy(ie.projectionMatrixInverse);else{let Ce=$e+Re,E=Nt+Re,b=je-Tt,V=Qe+(de-Tt),J=tt*Nt/E*Ce,Q=Ft*Nt/E*Ce;Y.projectionMatrix.makePerspective(b,V,J,Q,Ce,E),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}}function ae(Y,ie){ie===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(ie.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(s===null)return;let ie=Y.near,Ae=Y.far;v.texture!==null&&(v.depthNear>0&&(ie=v.depthNear),v.depthFar>0&&(Ae=v.depthFar)),_.near=C.near=T.near=ie,_.far=C.far=T.far=Ae,(L!==_.near||N!==_.far)&&(s.updateRenderState({depthNear:_.near,depthFar:_.far}),L=_.near,N=_.far),T.layers.mask=Y.layers.mask|2,C.layers.mask=Y.layers.mask|4,_.layers.mask=T.layers.mask|C.layers.mask;let de=Y.parent,Ie=_.cameras;ae(_,de);for(let Be=0;Be<Ie.length;Be++)ae(Ie[Be],de);Ie.length===2?G(_,T,C):_.projectionMatrix.copy(T.projectionMatrix),ee(Y,_,de)};function ee(Y,ie,Ae){Ae===null?Y.matrix.copy(ie.matrixWorld):(Y.matrix.copy(Ae.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(ie.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(!0),Y.projectionMatrix.copy(ie.projectionMatrix),Y.projectionMatrixInverse.copy(ie.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=Nh*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}this.getCamera=function(){return _},this.getFoveation=function(){if(!(d===null&&m===null))return l},this.setFoveation=function(Y){l=Y,d!==null&&(d.fixedFoveation=Y),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=Y)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(_)};let ve=null;function Fe(Y,ie){if(c=ie.getViewerPose(h||a),g=ie,c!==null){let Ae=c.views;m!==null&&(e.setRenderTargetFramebuffer(w,m.framebuffer),e.setRenderTarget(w));let de=!1;Ae.length!==_.cameras.length&&(_.cameras.length=0,de=!0);for(let Be=0;Be<Ae.length;Be++){let $e=Ae[Be],Nt=null;if(m!==null)Nt=m.getViewport($e);else{let Ft=u.getViewSubImage(d,$e);Nt=Ft.viewport,Be===0&&(e.setRenderTargetTextures(w,Ft.colorTexture,d.ignoreDepthValues?void 0:Ft.depthStencilTexture),e.setRenderTarget(w))}let tt=y[Be];tt===void 0&&(tt=new jt,tt.layers.enable(Be),tt.viewport=new yt,y[Be]=tt),tt.matrix.fromArray($e.transform.matrix),tt.matrix.decompose(tt.position,tt.quaternion,tt.scale),tt.projectionMatrix.fromArray($e.projectionMatrix),tt.projectionMatrixInverse.copy(tt.projectionMatrix).invert(),tt.viewport.set(Nt.x,Nt.y,Nt.width,Nt.height),Be===0&&(_.matrix.copy(tt.matrix),_.matrix.decompose(_.position,_.quaternion,_.scale)),de===!0&&_.cameras.push(tt)}let Ie=s.enabledFeatures;if(Ie&&Ie.includes("depth-sensing")){let Be=u.getDepthInformation(Ae[0]);Be&&Be.isValid&&Be.texture&&v.init(e,Be,s.renderState)}}for(let Ae=0;Ae<S.length;Ae++){let de=x[Ae],Ie=S[Ae];de!==null&&Ie!==void 0&&Ie.update(de,ie,h||a)}ve&&ve(Y,ie),ie.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ie}),g=null}let ht=new cp;ht.setAnimationLoop(Fe),this.setAnimationLoop=function(Y){ve=Y},this.dispose=function(){}}},Ts=new $t,ib=new Ge;function sb(i,e){function t(p,f){p.matrixAutoUpdate===!0&&p.updateMatrix(),f.value.copy(p.matrix)}function n(p,f){f.color.getRGB(p.fogColor.value,lp(i)),f.isFog?(p.fogNear.value=f.near,p.fogFar.value=f.far):f.isFogExp2&&(p.fogDensity.value=f.density)}function s(p,f,w,S,x){f.isMeshBasicMaterial||f.isMeshLambertMaterial?r(p,f):f.isMeshToonMaterial?(r(p,f),u(p,f)):f.isMeshPhongMaterial?(r(p,f),c(p,f)):f.isMeshStandardMaterial?(r(p,f),d(p,f),f.isMeshPhysicalMaterial&&m(p,f,x)):f.isMeshMatcapMaterial?(r(p,f),g(p,f)):f.isMeshDepthMaterial?r(p,f):f.isMeshDistanceMaterial?(r(p,f),v(p,f)):f.isMeshNormalMaterial?r(p,f):f.isLineBasicMaterial?(a(p,f),f.isLineDashedMaterial&&o(p,f)):f.isPointsMaterial?l(p,f,w,S):f.isSpriteMaterial?h(p,f):f.isShadowMaterial?(p.color.value.copy(f.color),p.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(p,f){p.opacity.value=f.opacity,f.color&&p.diffuse.value.copy(f.color),f.emissive&&p.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(p.map.value=f.map,t(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.bumpMap&&(p.bumpMap.value=f.bumpMap,t(f.bumpMap,p.bumpMapTransform),p.bumpScale.value=f.bumpScale,f.side===xn&&(p.bumpScale.value*=-1)),f.normalMap&&(p.normalMap.value=f.normalMap,t(f.normalMap,p.normalMapTransform),p.normalScale.value.copy(f.normalScale),f.side===xn&&p.normalScale.value.negate()),f.displacementMap&&(p.displacementMap.value=f.displacementMap,t(f.displacementMap,p.displacementMapTransform),p.displacementScale.value=f.displacementScale,p.displacementBias.value=f.displacementBias),f.emissiveMap&&(p.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,p.emissiveMapTransform)),f.specularMap&&(p.specularMap.value=f.specularMap,t(f.specularMap,p.specularMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest);let w=e.get(f),S=w.envMap,x=w.envMapRotation;S&&(p.envMap.value=S,Ts.copy(x),Ts.x*=-1,Ts.y*=-1,Ts.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(Ts.y*=-1,Ts.z*=-1),p.envMapRotation.value.setFromMatrix4(ib.makeRotationFromEuler(Ts)),p.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=f.reflectivity,p.ior.value=f.ior,p.refractionRatio.value=f.refractionRatio),f.lightMap&&(p.lightMap.value=f.lightMap,p.lightMapIntensity.value=f.lightMapIntensity,t(f.lightMap,p.lightMapTransform)),f.aoMap&&(p.aoMap.value=f.aoMap,p.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,p.aoMapTransform))}function a(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,f.map&&(p.map.value=f.map,t(f.map,p.mapTransform))}function o(p,f){p.dashSize.value=f.dashSize,p.totalSize.value=f.dashSize+f.gapSize,p.scale.value=f.scale}function l(p,f,w,S){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.size.value=f.size*w,p.scale.value=S*.5,f.map&&(p.map.value=f.map,t(f.map,p.uvTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function h(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.rotation.value=f.rotation,f.map&&(p.map.value=f.map,t(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function c(p,f){p.specular.value.copy(f.specular),p.shininess.value=Math.max(f.shininess,1e-4)}function u(p,f){f.gradientMap&&(p.gradientMap.value=f.gradientMap)}function d(p,f){p.metalness.value=f.metalness,f.metalnessMap&&(p.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,p.metalnessMapTransform)),p.roughness.value=f.roughness,f.roughnessMap&&(p.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,p.roughnessMapTransform)),f.envMap&&(p.envMapIntensity.value=f.envMapIntensity)}function m(p,f,w){p.ior.value=f.ior,f.sheen>0&&(p.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),p.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(p.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,p.sheenColorMapTransform)),f.sheenRoughnessMap&&(p.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,p.sheenRoughnessMapTransform))),f.clearcoat>0&&(p.clearcoat.value=f.clearcoat,p.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(p.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,p.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(p.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===xn&&p.clearcoatNormalScale.value.negate())),f.dispersion>0&&(p.dispersion.value=f.dispersion),f.iridescence>0&&(p.iridescence.value=f.iridescence,p.iridescenceIOR.value=f.iridescenceIOR,p.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(p.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,p.iridescenceMapTransform)),f.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),f.transmission>0&&(p.transmission.value=f.transmission,p.transmissionSamplerMap.value=w.texture,p.transmissionSamplerSize.value.set(w.width,w.height),f.transmissionMap&&(p.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,p.transmissionMapTransform)),p.thickness.value=f.thickness,f.thicknessMap&&(p.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=f.attenuationDistance,p.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(p.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(p.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=f.specularIntensity,p.specularColor.value.copy(f.specularColor),f.specularColorMap&&(p.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,p.specularColorMapTransform)),f.specularIntensityMap&&(p.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,f){f.matcap&&(p.matcap.value=f.matcap)}function v(p,f){let w=e.get(f).light;p.referencePosition.value.setFromMatrixPosition(w.matrixWorld),p.nearDistance.value=w.shadow.camera.near,p.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function rb(i,e,t,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(w,S){let x=S.program;n.uniformBlockBinding(w,x)}function h(w,S){let x=s[w.id];x===void 0&&(g(w),x=c(w),s[w.id]=x,w.addEventListener("dispose",p));let I=S.program;n.updateUBOMapping(w,I);let R=e.render.frame;r[w.id]!==R&&(d(w),r[w.id]=R)}function c(w){let S=u();w.__bindingPointIndex=S;let x=i.createBuffer(),I=w.__size,R=w.usage;return i.bindBuffer(i.UNIFORM_BUFFER,x),i.bufferData(i.UNIFORM_BUFFER,I,R),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,S,x),x}function u(){for(let w=0;w<o;w++)if(a.indexOf(w)===-1)return a.push(w),w;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(w){let S=s[w.id],x=w.uniforms,I=w.__cache;i.bindBuffer(i.UNIFORM_BUFFER,S);for(let R=0,T=x.length;R<T;R++){let C=Array.isArray(x[R])?x[R]:[x[R]];for(let y=0,_=C.length;y<_;y++){let L=C[y];if(m(L,R,y,I)===!0){let N=L.__offset,P=Array.isArray(L.value)?L.value:[L.value],F=0;for(let H=0;H<P.length;H++){let O=P[H],Z=v(O);typeof O=="number"||typeof O=="boolean"?(L.__data[0]=O,i.bufferSubData(i.UNIFORM_BUFFER,N+F,L.__data)):O.isMatrix3?(L.__data[0]=O.elements[0],L.__data[1]=O.elements[1],L.__data[2]=O.elements[2],L.__data[3]=0,L.__data[4]=O.elements[3],L.__data[5]=O.elements[4],L.__data[6]=O.elements[5],L.__data[7]=0,L.__data[8]=O.elements[6],L.__data[9]=O.elements[7],L.__data[10]=O.elements[8],L.__data[11]=0):(O.toArray(L.__data,F),F+=Z.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,N,L.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(w,S,x,I){let R=w.value,T=S+"_"+x;if(I[T]===void 0)return typeof R=="number"||typeof R=="boolean"?I[T]=R:I[T]=R.clone(),!0;{let C=I[T];if(typeof R=="number"||typeof R=="boolean"){if(C!==R)return I[T]=R,!0}else if(C.equals(R)===!1)return C.copy(R),!0}return!1}function g(w){let S=w.uniforms,x=0,I=16;for(let T=0,C=S.length;T<C;T++){let y=Array.isArray(S[T])?S[T]:[S[T]];for(let _=0,L=y.length;_<L;_++){let N=y[_],P=Array.isArray(N.value)?N.value:[N.value];for(let F=0,H=P.length;F<H;F++){let O=P[F],Z=v(O),G=x%I,ae=G%Z.boundary,ee=G+ae;x+=ae,ee!==0&&I-ee<Z.storage&&(x+=I-ee),N.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),N.__offset=x,x+=Z.storage}}}let R=x%I;return R>0&&(x+=I-R),w.__size=x,w.__cache={},this}function v(w){let S={boundary:0,storage:0};return typeof w=="number"||typeof w=="boolean"?(S.boundary=4,S.storage=4):w.isVector2?(S.boundary=8,S.storage=8):w.isVector3||w.isColor?(S.boundary=16,S.storage=12):w.isVector4?(S.boundary=16,S.storage=16):w.isMatrix3?(S.boundary=48,S.storage=48):w.isMatrix4?(S.boundary=64,S.storage=64):w.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",w),S}function p(w){let S=w.target;S.removeEventListener("dispose",p);let x=a.indexOf(S.__bindingPointIndex);a.splice(x,1),i.deleteBuffer(s[S.id]),delete s[S.id],delete r[S.id]}function f(){for(let w in s)i.deleteBuffer(s[w]);a=[],s={},r={}}return{bind:l,update:h,dispose:f}}var Ir=class{constructor(e={}){let{canvas:t=c0(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:h=!1,powerPreference:c="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=a;let g=new Uint32Array(4),v=new Int32Array(4),p=null,f=null,w=[],S=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Un,this.toneMapping=rs,this.toneMappingExposure=1;let x=this,I=!1,R=0,T=0,C=null,y=-1,_=null,L=new yt,N=new yt,P=null,F=new le(0),H=0,O=t.width,Z=t.height,G=1,ae=null,ee=null,ve=new yt(0,0,O,Z),Fe=new yt(0,0,O,Z),ht=!1,Y=new Sa,ie=!1,Ae=!1,de=new Ge,Ie=new Ge,Be=new D,$e=new yt,Nt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},tt=!1;function Ft(){return C===null?G:1}let z=n;function Dn(M,U){return t.getContext(M,U)}try{let M={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:h,powerPreference:c,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine","three.js r170"),t.addEventListener("webglcontextlost",j,!1),t.addEventListener("webglcontextrestored",ge,!1),t.addEventListener("webglcontextcreationerror",pe,!1),z===null){let U="webgl2";if(z=Dn(U,M),z===null)throw Dn(U)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let je,Qe,Re,Tt,Ce,E,b,V,J,Q,K,Te,fe,ye,nt,te,_e,Pe,Ne,be,et,He,St,k;function ce(){je=new by(z),je.init(),He=new Q_(z,je),Qe=new my(z,je,e,He),Re=new Z_(z,je),Qe.reverseDepthBuffer&&d&&Re.buffers.depth.setReversed(!0),Tt=new Sy(z),Ce=new F_,E=new j_(z,je,Re,Ce,Qe,He,Tt),b=new vy(x),V=new _y(x),J=new I0(z),St=new fy(z,J),Q=new My(z,J,Tt,St),K=new Ty(z,Q,J,Tt),Ne=new Ay(z,Qe,E),te=new gy(Ce),Te=new U_(x,b,V,je,Qe,St,te),fe=new sb(x,Ce),ye=new O_,nt=new q_(je),Pe=new dy(x,b,V,Re,K,m,l),_e=new Y_(x,K,Qe),k=new rb(z,Tt,Qe,Re),be=new py(z,je,Tt),et=new wy(z,je,Tt),Tt.programs=Te.programs,x.capabilities=Qe,x.extensions=je,x.properties=Ce,x.renderLists=ye,x.shadowMap=_e,x.state=Re,x.info=Tt}ce();let $=new Jh(x,z);this.xr=$,this.getContext=function(){return z},this.getContextAttributes=function(){return z.getContextAttributes()},this.forceContextLoss=function(){let M=je.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){let M=je.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return G},this.setPixelRatio=function(M){M!==void 0&&(G=M,this.setSize(O,Z,!1))},this.getSize=function(M){return M.set(O,Z)},this.setSize=function(M,U,W=!0){if($.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}O=M,Z=U,t.width=Math.floor(M*G),t.height=Math.floor(U*G),W===!0&&(t.style.width=M+"px",t.style.height=U+"px"),this.setViewport(0,0,M,U)},this.getDrawingBufferSize=function(M){return M.set(O*G,Z*G).floor()},this.setDrawingBufferSize=function(M,U,W){O=M,Z=U,G=W,t.width=Math.floor(M*W),t.height=Math.floor(U*W),this.setViewport(0,0,M,U)},this.getCurrentViewport=function(M){return M.copy(L)},this.getViewport=function(M){return M.copy(ve)},this.setViewport=function(M,U,W,q){M.isVector4?ve.set(M.x,M.y,M.z,M.w):ve.set(M,U,W,q),Re.viewport(L.copy(ve).multiplyScalar(G).round())},this.getScissor=function(M){return M.copy(Fe)},this.setScissor=function(M,U,W,q){M.isVector4?Fe.set(M.x,M.y,M.z,M.w):Fe.set(M,U,W,q),Re.scissor(N.copy(Fe).multiplyScalar(G).round())},this.getScissorTest=function(){return ht},this.setScissorTest=function(M){Re.setScissorTest(ht=M)},this.setOpaqueSort=function(M){ae=M},this.setTransparentSort=function(M){ee=M},this.getClearColor=function(M){return M.copy(Pe.getClearColor())},this.setClearColor=function(){Pe.setClearColor.apply(Pe,arguments)},this.getClearAlpha=function(){return Pe.getClearAlpha()},this.setClearAlpha=function(){Pe.setClearAlpha.apply(Pe,arguments)},this.clear=function(M=!0,U=!0,W=!0){let q=0;if(M){let B=!1;if(C!==null){let ne=C.texture.format;B=ne===xu||ne===vu||ne===gu}if(B){let ne=C.texture.type,me=ne===Ui||ne===Ns||ne===wa||ne===Er||ne===fu||ne===pu,Me=Pe.getClearColor(),we=Pe.getClearAlpha(),ke=Me.r,ze=Me.g,Se=Me.b;me?(g[0]=ke,g[1]=ze,g[2]=Se,g[3]=we,z.clearBufferuiv(z.COLOR,0,g)):(v[0]=ke,v[1]=ze,v[2]=Se,v[3]=we,z.clearBufferiv(z.COLOR,0,v))}else q|=z.COLOR_BUFFER_BIT}U&&(q|=z.DEPTH_BUFFER_BIT),W&&(q|=z.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),z.clear(q)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",j,!1),t.removeEventListener("webglcontextrestored",ge,!1),t.removeEventListener("webglcontextcreationerror",pe,!1),ye.dispose(),nt.dispose(),Ce.dispose(),b.dispose(),V.dispose(),K.dispose(),St.dispose(),k.dispose(),Te.dispose(),$.dispose(),$.removeEventListener("sessionstart",_d),$.removeEventListener("sessionend",bd),vs.stop()};function j(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),I=!0}function ge(){console.log("THREE.WebGLRenderer: Context Restored."),I=!1;let M=Tt.autoReset,U=_e.enabled,W=_e.autoUpdate,q=_e.needsUpdate,B=_e.type;ce(),Tt.autoReset=M,_e.enabled=U,_e.autoUpdate=W,_e.needsUpdate=q,_e.type=B}function pe(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function Oe(M){let U=M.target;U.removeEventListener("dispose",Oe),Ut(U)}function Ut(M){rn(M),Ce.remove(M)}function rn(M){let U=Ce.get(M).programs;U!==void 0&&(U.forEach(function(W){Te.releaseProgram(W)}),M.isShaderMaterial&&Te.releaseShaderCache(M))}this.renderBufferDirect=function(M,U,W,q,B,ne){U===null&&(U=Nt);let me=B.isMesh&&B.matrixWorld.determinant()<0,Me=Hm(M,U,W,q,B);Re.setMaterial(q,me);let we=W.index,ke=1;if(q.wireframe===!0){if(we=Q.getWireframeAttribute(W),we===void 0)return;ke=2}let ze=W.drawRange,Se=W.attributes.position,ot=ze.start*ke,At=(ze.start+ze.count)*ke;ne!==null&&(ot=Math.max(ot,ne.start*ke),At=Math.min(At,(ne.start+ne.count)*ke)),we!==null?(ot=Math.max(ot,0),At=Math.min(At,we.count)):Se!=null&&(ot=Math.max(ot,0),At=Math.min(At,Se.count));let Et=At-ot;if(Et<0||Et===1/0)return;St.setup(B,q,Me,W,we);let pn,ut=be;if(we!==null&&(pn=J.get(we),ut=et,ut.setIndex(pn)),B.isMesh)q.wireframe===!0?(Re.setLineWidth(q.wireframeLinewidth*Ft()),ut.setMode(z.LINES)):ut.setMode(z.TRIANGLES);else if(B.isLine){let Ee=q.linewidth;Ee===void 0&&(Ee=1),Re.setLineWidth(Ee*Ft()),B.isLineSegments?ut.setMode(z.LINES):B.isLineLoop?ut.setMode(z.LINE_LOOP):ut.setMode(z.LINE_STRIP)}else B.isPoints?ut.setMode(z.POINTS):B.isSprite&&ut.setMode(z.TRIANGLES);if(B.isBatchedMesh)if(B._multiDrawInstances!==null)ut.renderMultiDrawInstances(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount,B._multiDrawInstances);else if(je.get("WEBGL_multi_draw"))ut.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{let Ee=B._multiDrawStarts,Ti=B._multiDrawCounts,dt=B._multiDrawCount,$n=we?J.get(we).bytesPerElement:1,er=Ce.get(q).currentProgram.getUniforms();for(let bn=0;bn<dt;bn++)er.setValue(z,"_gl_DrawID",bn),ut.render(Ee[bn]/$n,Ti[bn])}else if(B.isInstancedMesh)ut.renderInstances(ot,Et,B.count);else if(W.isInstancedBufferGeometry){let Ee=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,Ti=Math.min(W.instanceCount,Ee);ut.renderInstances(ot,Et,Ti)}else ut.render(ot,Et)};function gt(M,U,W){M.transparent===!0&&M.side===Fn&&M.forceSinglePass===!1?(M.side=xn,M.needsUpdate=!0,so(M,U,W),M.side=as,M.needsUpdate=!0,so(M,U,W),M.side=Fn):so(M,U,W)}this.compile=function(M,U,W=null){W===null&&(W=M),f=nt.get(W),f.init(U),S.push(f),W.traverseVisible(function(B){B.isLight&&B.layers.test(U.layers)&&(f.pushLight(B),B.castShadow&&f.pushShadow(B))}),M!==W&&M.traverseVisible(function(B){B.isLight&&B.layers.test(U.layers)&&(f.pushLight(B),B.castShadow&&f.pushShadow(B))}),f.setupLights();let q=new Set;return M.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;let ne=B.material;if(ne)if(Array.isArray(ne))for(let me=0;me<ne.length;me++){let Me=ne[me];gt(Me,W,B),q.add(Me)}else gt(ne,W,B),q.add(ne)}),S.pop(),f=null,q},this.compileAsync=function(M,U,W=null){let q=this.compile(M,U,W);return new Promise(B=>{function ne(){if(q.forEach(function(me){Ce.get(me).currentProgram.isReady()&&q.delete(me)}),q.size===0){B(M);return}setTimeout(ne,10)}je.get("KHR_parallel_shader_compile")!==null?ne():setTimeout(ne,10)})};let qn=null;function Ai(M){qn&&qn(M)}function _d(){vs.stop()}function bd(){vs.start()}let vs=new cp;vs.setAnimationLoop(Ai),typeof self<"u"&&vs.setContext(self),this.setAnimationLoop=function(M){qn=M,$.setAnimationLoop(M),M===null?vs.stop():vs.start()},$.addEventListener("sessionstart",_d),$.addEventListener("sessionend",bd),this.render=function(M,U){if(U!==void 0&&U.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),$.enabled===!0&&$.isPresenting===!0&&($.cameraAutoUpdate===!0&&$.updateCamera(U),U=$.getCamera()),M.isScene===!0&&M.onBeforeRender(x,M,U,C),f=nt.get(M,S.length),f.init(U),S.push(f),Ie.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),Y.setFromProjectionMatrix(Ie),Ae=this.localClippingEnabled,ie=te.init(this.clippingPlanes,Ae),p=ye.get(M,w.length),p.init(),w.push(p),$.enabled===!0&&$.isPresenting===!0){let ne=x.xr.getDepthSensingMesh();ne!==null&&hc(ne,U,-1/0,x.sortObjects)}hc(M,U,0,x.sortObjects),p.finish(),x.sortObjects===!0&&p.sort(ae,ee),tt=$.enabled===!1||$.isPresenting===!1||$.hasDepthSensing()===!1,tt&&Pe.addToRenderList(p,M),this.info.render.frame++,ie===!0&&te.beginShadows();let W=f.state.shadowsArray;_e.render(W,M,U),ie===!0&&te.endShadows(),this.info.autoReset===!0&&this.info.reset();let q=p.opaque,B=p.transmissive;if(f.setupLights(),U.isArrayCamera){let ne=U.cameras;if(B.length>0)for(let me=0,Me=ne.length;me<Me;me++){let we=ne[me];wd(q,B,M,we)}tt&&Pe.render(M);for(let me=0,Me=ne.length;me<Me;me++){let we=ne[me];Md(p,M,we,we.viewport)}}else B.length>0&&wd(q,B,M,U),tt&&Pe.render(M),Md(p,M,U);C!==null&&(E.updateMultisampleRenderTarget(C),E.updateRenderTargetMipmap(C)),M.isScene===!0&&M.onAfterRender(x,M,U),St.resetDefaultState(),y=-1,_=null,S.pop(),S.length>0?(f=S[S.length-1],ie===!0&&te.setGlobalState(x.clippingPlanes,f.state.camera)):f=null,w.pop(),w.length>0?p=w[w.length-1]:p=null};function hc(M,U,W,q){if(M.visible===!1)return;if(M.layers.test(U.layers)){if(M.isGroup)W=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(U);else if(M.isLight)f.pushLight(M),M.castShadow&&f.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||Y.intersectsSprite(M)){q&&$e.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Ie);let me=K.update(M),Me=M.material;Me.visible&&p.push(M,me,Me,W,$e.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||Y.intersectsObject(M))){let me=K.update(M),Me=M.material;if(q&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),$e.copy(M.boundingSphere.center)):(me.boundingSphere===null&&me.computeBoundingSphere(),$e.copy(me.boundingSphere.center)),$e.applyMatrix4(M.matrixWorld).applyMatrix4(Ie)),Array.isArray(Me)){let we=me.groups;for(let ke=0,ze=we.length;ke<ze;ke++){let Se=we[ke],ot=Me[Se.materialIndex];ot&&ot.visible&&p.push(M,me,ot,W,$e.z,Se)}}else Me.visible&&p.push(M,me,Me,W,$e.z,null)}}let ne=M.children;for(let me=0,Me=ne.length;me<Me;me++)hc(ne[me],U,W,q)}function Md(M,U,W,q){let B=M.opaque,ne=M.transmissive,me=M.transparent;f.setupLightsView(W),ie===!0&&te.setGlobalState(x.clippingPlanes,W),q&&Re.viewport(L.copy(q)),B.length>0&&io(B,U,W),ne.length>0&&io(ne,U,W),me.length>0&&io(me,U,W),Re.buffers.depth.setTest(!0),Re.buffers.depth.setMask(!0),Re.buffers.color.setMask(!0),Re.setPolygonOffset(!1)}function wd(M,U,W,q){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[q.id]===void 0&&(f.state.transmissionRenderTarget[q.id]=new Fi(1,1,{generateMipmaps:!0,type:je.has("EXT_color_buffer_half_float")||je.has("EXT_color_buffer_float")?Ca:Ui,minFilter:Ls,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:it.workingColorSpace}));let ne=f.state.transmissionRenderTarget[q.id],me=q.viewport||L;ne.setSize(me.z,me.w);let Me=x.getRenderTarget();x.setRenderTarget(ne),x.getClearColor(F),H=x.getClearAlpha(),H<1&&x.setClearColor(16777215,.5),x.clear(),tt&&Pe.render(W);let we=x.toneMapping;x.toneMapping=rs;let ke=q.viewport;if(q.viewport!==void 0&&(q.viewport=void 0),f.setupLightsView(q),ie===!0&&te.setGlobalState(x.clippingPlanes,q),io(M,W,q),E.updateMultisampleRenderTarget(ne),E.updateRenderTargetMipmap(ne),je.has("WEBGL_multisampled_render_to_texture")===!1){let ze=!1;for(let Se=0,ot=U.length;Se<ot;Se++){let At=U[Se],Et=At.object,pn=At.geometry,ut=At.material,Ee=At.group;if(ut.side===Fn&&Et.layers.test(q.layers)){let Ti=ut.side;ut.side=xn,ut.needsUpdate=!0,Sd(Et,W,q,pn,ut,Ee),ut.side=Ti,ut.needsUpdate=!0,ze=!0}}ze===!0&&(E.updateMultisampleRenderTarget(ne),E.updateRenderTargetMipmap(ne))}x.setRenderTarget(Me),x.setClearColor(F,H),ke!==void 0&&(q.viewport=ke),x.toneMapping=we}function io(M,U,W){let q=U.isScene===!0?U.overrideMaterial:null;for(let B=0,ne=M.length;B<ne;B++){let me=M[B],Me=me.object,we=me.geometry,ke=q===null?me.material:q,ze=me.group;Me.layers.test(W.layers)&&Sd(Me,U,W,we,ke,ze)}}function Sd(M,U,W,q,B,ne){M.onBeforeRender(x,U,W,q,B,ne),M.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),B.onBeforeRender(x,U,W,q,M,ne),B.transparent===!0&&B.side===Fn&&B.forceSinglePass===!1?(B.side=xn,B.needsUpdate=!0,x.renderBufferDirect(W,U,q,B,M,ne),B.side=as,B.needsUpdate=!0,x.renderBufferDirect(W,U,q,B,M,ne),B.side=Fn):x.renderBufferDirect(W,U,q,B,M,ne),M.onAfterRender(x,U,W,q,B,ne)}function so(M,U,W){U.isScene!==!0&&(U=Nt);let q=Ce.get(M),B=f.state.lights,ne=f.state.shadowsArray,me=B.state.version,Me=Te.getParameters(M,B.state,ne,U,W),we=Te.getProgramCacheKey(Me),ke=q.programs;q.environment=M.isMeshStandardMaterial?U.environment:null,q.fog=U.fog,q.envMap=(M.isMeshStandardMaterial?V:b).get(M.envMap||q.environment),q.envMapRotation=q.environment!==null&&M.envMap===null?U.environmentRotation:M.envMapRotation,ke===void 0&&(M.addEventListener("dispose",Oe),ke=new Map,q.programs=ke);let ze=ke.get(we);if(ze!==void 0){if(q.currentProgram===ze&&q.lightsStateVersion===me)return Td(M,Me),ze}else Me.uniforms=Te.getUniforms(M),M.onBeforeCompile(Me,x),ze=Te.acquireProgram(Me,we),ke.set(we,ze),q.uniforms=Me.uniforms;let Se=q.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Se.clippingPlanes=te.uniform),Td(M,Me),q.needsLights=Gm(M),q.lightsStateVersion=me,q.needsLights&&(Se.ambientLightColor.value=B.state.ambient,Se.lightProbe.value=B.state.probe,Se.directionalLights.value=B.state.directional,Se.directionalLightShadows.value=B.state.directionalShadow,Se.spotLights.value=B.state.spot,Se.spotLightShadows.value=B.state.spotShadow,Se.rectAreaLights.value=B.state.rectArea,Se.ltc_1.value=B.state.rectAreaLTC1,Se.ltc_2.value=B.state.rectAreaLTC2,Se.pointLights.value=B.state.point,Se.pointLightShadows.value=B.state.pointShadow,Se.hemisphereLights.value=B.state.hemi,Se.directionalShadowMap.value=B.state.directionalShadowMap,Se.directionalShadowMatrix.value=B.state.directionalShadowMatrix,Se.spotShadowMap.value=B.state.spotShadowMap,Se.spotLightMatrix.value=B.state.spotLightMatrix,Se.spotLightMap.value=B.state.spotLightMap,Se.pointShadowMap.value=B.state.pointShadowMap,Se.pointShadowMatrix.value=B.state.pointShadowMatrix),q.currentProgram=ze,q.uniformsList=null,ze}function Ad(M){if(M.uniformsList===null){let U=M.currentProgram.getUniforms();M.uniformsList=wr.seqWithValue(U.seq,M.uniforms)}return M.uniformsList}function Td(M,U){let W=Ce.get(M);W.outputColorSpace=U.outputColorSpace,W.batching=U.batching,W.batchingColor=U.batchingColor,W.instancing=U.instancing,W.instancingColor=U.instancingColor,W.instancingMorph=U.instancingMorph,W.skinning=U.skinning,W.morphTargets=U.morphTargets,W.morphNormals=U.morphNormals,W.morphColors=U.morphColors,W.morphTargetsCount=U.morphTargetsCount,W.numClippingPlanes=U.numClippingPlanes,W.numIntersection=U.numClipIntersection,W.vertexAlphas=U.vertexAlphas,W.vertexTangents=U.vertexTangents,W.toneMapping=U.toneMapping}function Hm(M,U,W,q,B){U.isScene!==!0&&(U=Nt),E.resetTextureUnits();let ne=U.fog,me=q.isMeshStandardMaterial?U.environment:null,Me=C===null?x.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:kr,we=(q.isMeshStandardMaterial?V:b).get(q.envMap||me),ke=q.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,ze=!!W.attributes.tangent&&(!!q.normalMap||q.anisotropy>0),Se=!!W.morphAttributes.position,ot=!!W.morphAttributes.normal,At=!!W.morphAttributes.color,Et=rs;q.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(Et=x.toneMapping);let pn=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,ut=pn!==void 0?pn.length:0,Ee=Ce.get(q),Ti=f.state.lights;if(ie===!0&&(Ae===!0||M!==_)){let Nn=M===_&&q.id===y;te.setState(q,M,Nn)}let dt=!1;q.version===Ee.__version?(Ee.needsLights&&Ee.lightsStateVersion!==Ti.state.version||Ee.outputColorSpace!==Me||B.isBatchedMesh&&Ee.batching===!1||!B.isBatchedMesh&&Ee.batching===!0||B.isBatchedMesh&&Ee.batchingColor===!0&&B.colorTexture===null||B.isBatchedMesh&&Ee.batchingColor===!1&&B.colorTexture!==null||B.isInstancedMesh&&Ee.instancing===!1||!B.isInstancedMesh&&Ee.instancing===!0||B.isSkinnedMesh&&Ee.skinning===!1||!B.isSkinnedMesh&&Ee.skinning===!0||B.isInstancedMesh&&Ee.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&Ee.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&Ee.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&Ee.instancingMorph===!1&&B.morphTexture!==null||Ee.envMap!==we||q.fog===!0&&Ee.fog!==ne||Ee.numClippingPlanes!==void 0&&(Ee.numClippingPlanes!==te.numPlanes||Ee.numIntersection!==te.numIntersection)||Ee.vertexAlphas!==ke||Ee.vertexTangents!==ze||Ee.morphTargets!==Se||Ee.morphNormals!==ot||Ee.morphColors!==At||Ee.toneMapping!==Et||Ee.morphTargetsCount!==ut)&&(dt=!0):(dt=!0,Ee.__version=q.version);let $n=Ee.currentProgram;dt===!0&&($n=so(q,U,B));let er=!1,bn=!1,Qr=!1,Ct=$n.getUniforms(),oi=Ee.uniforms;if(Re.useProgram($n.program)&&(er=!0,bn=!0,Qr=!0),q.id!==y&&(y=q.id,bn=!0),er||_!==M){Re.buffers.depth.getReversed()?(de.copy(M.projectionMatrix),u0(de),d0(de),Ct.setValue(z,"projectionMatrix",de)):Ct.setValue(z,"projectionMatrix",M.projectionMatrix),Ct.setValue(z,"viewMatrix",M.matrixWorldInverse);let $i=Ct.map.cameraPosition;$i!==void 0&&$i.setValue(z,Be.setFromMatrixPosition(M.matrixWorld)),Qe.logarithmicDepthBuffer&&Ct.setValue(z,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(q.isMeshPhongMaterial||q.isMeshToonMaterial||q.isMeshLambertMaterial||q.isMeshBasicMaterial||q.isMeshStandardMaterial||q.isShaderMaterial)&&Ct.setValue(z,"isOrthographic",M.isOrthographicCamera===!0),_!==M&&(_=M,bn=!0,Qr=!0)}if(B.isSkinnedMesh){Ct.setOptional(z,B,"bindMatrix"),Ct.setOptional(z,B,"bindMatrixInverse");let Nn=B.skeleton;Nn&&(Nn.boneTexture===null&&Nn.computeBoneTexture(),Ct.setValue(z,"boneTexture",Nn.boneTexture,E))}B.isBatchedMesh&&(Ct.setOptional(z,B,"batchingTexture"),Ct.setValue(z,"batchingTexture",B._matricesTexture,E),Ct.setOptional(z,B,"batchingIdTexture"),Ct.setValue(z,"batchingIdTexture",B._indirectTexture,E),Ct.setOptional(z,B,"batchingColorTexture"),B._colorsTexture!==null&&Ct.setValue(z,"batchingColorTexture",B._colorsTexture,E));let ea=W.morphAttributes;if((ea.position!==void 0||ea.normal!==void 0||ea.color!==void 0)&&Ne.update(B,W,$n),(bn||Ee.receiveShadow!==B.receiveShadow)&&(Ee.receiveShadow=B.receiveShadow,Ct.setValue(z,"receiveShadow",B.receiveShadow)),q.isMeshGouraudMaterial&&q.envMap!==null&&(oi.envMap.value=we,oi.flipEnvMap.value=we.isCubeTexture&&we.isRenderTargetTexture===!1?-1:1),q.isMeshStandardMaterial&&q.envMap===null&&U.environment!==null&&(oi.envMapIntensity.value=U.environmentIntensity),bn&&(Ct.setValue(z,"toneMappingExposure",x.toneMappingExposure),Ee.needsLights&&Vm(oi,Qr),ne&&q.fog===!0&&fe.refreshFogUniforms(oi,ne),fe.refreshMaterialUniforms(oi,q,G,Z,f.state.transmissionRenderTarget[M.id]),wr.upload(z,Ad(Ee),oi,E)),q.isShaderMaterial&&q.uniformsNeedUpdate===!0&&(wr.upload(z,Ad(Ee),oi,E),q.uniformsNeedUpdate=!1),q.isSpriteMaterial&&Ct.setValue(z,"center",B.center),Ct.setValue(z,"modelViewMatrix",B.modelViewMatrix),Ct.setValue(z,"normalMatrix",B.normalMatrix),Ct.setValue(z,"modelMatrix",B.matrixWorld),q.isShaderMaterial||q.isRawShaderMaterial){let Nn=q.uniformsGroups;for(let $i=0,Xi=Nn.length;$i<Xi;$i++){let Ed=Nn[$i];k.update(Ed,$n),k.bind(Ed,$n)}}return $n}function Vm(M,U){M.ambientLightColor.needsUpdate=U,M.lightProbe.needsUpdate=U,M.directionalLights.needsUpdate=U,M.directionalLightShadows.needsUpdate=U,M.pointLights.needsUpdate=U,M.pointLightShadows.needsUpdate=U,M.spotLights.needsUpdate=U,M.spotLightShadows.needsUpdate=U,M.rectAreaLights.needsUpdate=U,M.hemisphereLights.needsUpdate=U}function Gm(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(M,U,W){Ce.get(M.texture).__webglTexture=U,Ce.get(M.depthTexture).__webglTexture=W;let q=Ce.get(M);q.__hasExternalTextures=!0,q.__autoAllocateDepthBuffer=W===void 0,q.__autoAllocateDepthBuffer||je.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),q.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(M,U){let W=Ce.get(M);W.__webglFramebuffer=U,W.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(M,U=0,W=0){C=M,R=U,T=W;let q=!0,B=null,ne=!1,me=!1;if(M){let we=Ce.get(M);if(we.__useDefaultFramebuffer!==void 0)Re.bindFramebuffer(z.FRAMEBUFFER,null),q=!1;else if(we.__webglFramebuffer===void 0)E.setupRenderTarget(M);else if(we.__hasExternalTextures)E.rebindTextures(M,Ce.get(M.texture).__webglTexture,Ce.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let Se=M.depthTexture;if(we.__boundDepthTexture!==Se){if(Se!==null&&Ce.has(Se)&&(M.width!==Se.image.width||M.height!==Se.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");E.setupDepthRenderbuffer(M)}}let ke=M.texture;(ke.isData3DTexture||ke.isDataArrayTexture||ke.isCompressedArrayTexture)&&(me=!0);let ze=Ce.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(ze[U])?B=ze[U][W]:B=ze[U],ne=!0):M.samples>0&&E.useMultisampledRTT(M)===!1?B=Ce.get(M).__webglMultisampledFramebuffer:Array.isArray(ze)?B=ze[W]:B=ze,L.copy(M.viewport),N.copy(M.scissor),P=M.scissorTest}else L.copy(ve).multiplyScalar(G).floor(),N.copy(Fe).multiplyScalar(G).floor(),P=ht;if(Re.bindFramebuffer(z.FRAMEBUFFER,B)&&q&&Re.drawBuffers(M,B),Re.viewport(L),Re.scissor(N),Re.setScissorTest(P),ne){let we=Ce.get(M.texture);z.framebufferTexture2D(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_CUBE_MAP_POSITIVE_X+U,we.__webglTexture,W)}else if(me){let we=Ce.get(M.texture),ke=U||0;z.framebufferTextureLayer(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0,we.__webglTexture,W||0,ke)}y=-1},this.readRenderTargetPixels=function(M,U,W,q,B,ne,me){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Me=Ce.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&me!==void 0&&(Me=Me[me]),Me){Re.bindFramebuffer(z.FRAMEBUFFER,Me);try{let we=M.texture,ke=we.format,ze=we.type;if(!Qe.textureFormatReadable(ke)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Qe.textureTypeReadable(ze)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=M.width-q&&W>=0&&W<=M.height-B&&z.readPixels(U,W,q,B,He.convert(ke),He.convert(ze),ne)}finally{let we=C!==null?Ce.get(C).__webglFramebuffer:null;Re.bindFramebuffer(z.FRAMEBUFFER,we)}}},this.readRenderTargetPixelsAsync=async function(M,U,W,q,B,ne,me){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Me=Ce.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&me!==void 0&&(Me=Me[me]),Me){let we=M.texture,ke=we.format,ze=we.type;if(!Qe.textureFormatReadable(ke))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Qe.textureTypeReadable(ze))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(U>=0&&U<=M.width-q&&W>=0&&W<=M.height-B){Re.bindFramebuffer(z.FRAMEBUFFER,Me);let Se=z.createBuffer();z.bindBuffer(z.PIXEL_PACK_BUFFER,Se),z.bufferData(z.PIXEL_PACK_BUFFER,ne.byteLength,z.STREAM_READ),z.readPixels(U,W,q,B,He.convert(ke),He.convert(ze),0);let ot=C!==null?Ce.get(C).__webglFramebuffer:null;Re.bindFramebuffer(z.FRAMEBUFFER,ot);let At=z.fenceSync(z.SYNC_GPU_COMMANDS_COMPLETE,0);return z.flush(),await h0(z,At,4),z.bindBuffer(z.PIXEL_PACK_BUFFER,Se),z.getBufferSubData(z.PIXEL_PACK_BUFFER,0,ne),z.deleteBuffer(Se),z.deleteSync(At),ne}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(M,U=null,W=0){M.isTexture!==!0&&(_a("WebGLRenderer: copyFramebufferToTexture function signature has changed."),U=arguments[0]||null,M=arguments[1]);let q=Math.pow(2,-W),B=Math.floor(M.image.width*q),ne=Math.floor(M.image.height*q),me=U!==null?U.x:0,Me=U!==null?U.y:0;E.setTexture2D(M,0),z.copyTexSubImage2D(z.TEXTURE_2D,W,0,0,me,Me,B,ne),Re.unbindTexture()},this.copyTextureToTexture=function(M,U,W=null,q=null,B=0){M.isTexture!==!0&&(_a("WebGLRenderer: copyTextureToTexture function signature has changed."),q=arguments[0]||null,M=arguments[1],U=arguments[2],B=arguments[3]||0,W=null);let ne,me,Me,we,ke,ze,Se,ot,At,Et=M.isCompressedTexture?M.mipmaps[B]:M.image;W!==null?(ne=W.max.x-W.min.x,me=W.max.y-W.min.y,Me=W.isBox3?W.max.z-W.min.z:1,we=W.min.x,ke=W.min.y,ze=W.isBox3?W.min.z:0):(ne=Et.width,me=Et.height,Me=Et.depth||1,we=0,ke=0,ze=0),q!==null?(Se=q.x,ot=q.y,At=q.z):(Se=0,ot=0,At=0);let pn=He.convert(U.format),ut=He.convert(U.type),Ee;U.isData3DTexture?(E.setTexture3D(U,0),Ee=z.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(E.setTexture2DArray(U,0),Ee=z.TEXTURE_2D_ARRAY):(E.setTexture2D(U,0),Ee=z.TEXTURE_2D),z.pixelStorei(z.UNPACK_FLIP_Y_WEBGL,U.flipY),z.pixelStorei(z.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),z.pixelStorei(z.UNPACK_ALIGNMENT,U.unpackAlignment);let Ti=z.getParameter(z.UNPACK_ROW_LENGTH),dt=z.getParameter(z.UNPACK_IMAGE_HEIGHT),$n=z.getParameter(z.UNPACK_SKIP_PIXELS),er=z.getParameter(z.UNPACK_SKIP_ROWS),bn=z.getParameter(z.UNPACK_SKIP_IMAGES);z.pixelStorei(z.UNPACK_ROW_LENGTH,Et.width),z.pixelStorei(z.UNPACK_IMAGE_HEIGHT,Et.height),z.pixelStorei(z.UNPACK_SKIP_PIXELS,we),z.pixelStorei(z.UNPACK_SKIP_ROWS,ke),z.pixelStorei(z.UNPACK_SKIP_IMAGES,ze);let Qr=M.isDataArrayTexture||M.isData3DTexture,Ct=U.isDataArrayTexture||U.isData3DTexture;if(M.isRenderTargetTexture||M.isDepthTexture){let oi=Ce.get(M),ea=Ce.get(U),Nn=Ce.get(oi.__renderTarget),$i=Ce.get(ea.__renderTarget);Re.bindFramebuffer(z.READ_FRAMEBUFFER,Nn.__webglFramebuffer),Re.bindFramebuffer(z.DRAW_FRAMEBUFFER,$i.__webglFramebuffer);for(let Xi=0;Xi<Me;Xi++)Qr&&z.framebufferTextureLayer(z.READ_FRAMEBUFFER,z.COLOR_ATTACHMENT0,Ce.get(M).__webglTexture,B,ze+Xi),M.isDepthTexture?(Ct&&z.framebufferTextureLayer(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0,Ce.get(U).__webglTexture,B,At+Xi),z.blitFramebuffer(we,ke,ne,me,Se,ot,ne,me,z.DEPTH_BUFFER_BIT,z.NEAREST)):Ct?z.copyTexSubImage3D(Ee,B,Se,ot,At+Xi,we,ke,ne,me):z.copyTexSubImage2D(Ee,B,Se,ot,At+Xi,we,ke,ne,me);Re.bindFramebuffer(z.READ_FRAMEBUFFER,null),Re.bindFramebuffer(z.DRAW_FRAMEBUFFER,null)}else Ct?M.isDataTexture||M.isData3DTexture?z.texSubImage3D(Ee,B,Se,ot,At,ne,me,Me,pn,ut,Et.data):U.isCompressedArrayTexture?z.compressedTexSubImage3D(Ee,B,Se,ot,At,ne,me,Me,pn,Et.data):z.texSubImage3D(Ee,B,Se,ot,At,ne,me,Me,pn,ut,Et):M.isDataTexture?z.texSubImage2D(z.TEXTURE_2D,B,Se,ot,ne,me,pn,ut,Et.data):M.isCompressedTexture?z.compressedTexSubImage2D(z.TEXTURE_2D,B,Se,ot,Et.width,Et.height,pn,Et.data):z.texSubImage2D(z.TEXTURE_2D,B,Se,ot,ne,me,pn,ut,Et);z.pixelStorei(z.UNPACK_ROW_LENGTH,Ti),z.pixelStorei(z.UNPACK_IMAGE_HEIGHT,dt),z.pixelStorei(z.UNPACK_SKIP_PIXELS,$n),z.pixelStorei(z.UNPACK_SKIP_ROWS,er),z.pixelStorei(z.UNPACK_SKIP_IMAGES,bn),B===0&&U.generateMipmaps&&z.generateMipmap(Ee),Re.unbindTexture()},this.copyTextureToTexture3D=function(M,U,W=null,q=null,B=0){return M.isTexture!==!0&&(_a("WebGLRenderer: copyTextureToTexture3D function signature has changed."),W=arguments[0]||null,q=arguments[1]||null,M=arguments[2],U=arguments[3],B=arguments[4]||0),_a('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(M,U,W,q,B)},this.initRenderTarget=function(M){Ce.get(M).__webglFramebuffer===void 0&&E.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?E.setTextureCube(M,0):M.isData3DTexture?E.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?E.setTexture2DArray(M,0):E.setTexture2D(M,0),Re.unbindTexture()},this.resetState=function(){R=0,T=0,C=null,Re.reset(),St.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Ni}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorspace=it._getDrawingBufferColorSpace(e),t.unpackColorSpace=it._getUnpackColorSpace()}};var Qo=class i{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new le(e),this.near=t,this.far=n}clone(){return new i(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Lr=class extends un{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new $t,this.environmentIntensity=1,this.environmentRotation=new $t,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var jh=class extends Tn{constructor(e=null,t=1,n=1,s,r,a,o,l,h=Sn,c=Sn,u,d){super(null,a,o,l,h,c,s,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var el=class extends An{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},xr=new Ge,Wf=new Ge,No=[],qf=new Bi,ab=new Ge,va=new Mt,xa=new ks,jn=class extends Mt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new el(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,ab)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Bi),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,xr),qf.copy(e.boundingBox).applyMatrix4(xr),this.boundingBox.union(qf)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new ks),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,xr),xa.copy(e.boundingSphere).applyMatrix4(xr),this.boundingSphere.union(xa)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=e*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(e,t){let n=this.matrixWorld,s=this.count;if(va.geometry=this.geometry,va.material=this.material,va.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),xa.copy(this.boundingSphere),xa.applyMatrix4(n),e.ray.intersectsSphere(xa)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,xr),Wf.multiplyMatrices(n,xr),va.matrixWorld=Wf,va.raycast(e,No);for(let a=0,o=No.length;a<o;a++){let l=No[a];l.instanceId=r,l.object=this,t.push(l)}No.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new el(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new jh(new Float32Array(s*this.count),s,this.count,mu,di));let r=this.morphTexture.source.data.data,a=0;for(let h=0;h<n.length;h++)a+=n[h];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*e;r[l]=o,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}};var pi=class i extends nn{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);let r=[],a=[],o=[],l=[],h=new D,c=new Xe;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let m=n+u/t*s;h.x=e*Math.cos(m),h.y=e*Math.sin(m),a.push(h.x,h.y,h.z),o.push(0,0,1),c.x=(a[d]/e+1)/2,c.y=(a[d+1]/e+1)/2,l.push(c.x,c.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new st(a,3)),this.setAttribute("normal",new st(o,3)),this.setAttribute("uv",new st(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.segments,e.thetaStart,e.thetaLength)}},sn=class i extends nn{constructor(e=1,t=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let h=this;s=Math.floor(s),r=Math.floor(r);let c=[],u=[],d=[],m=[],g=0,v=[],p=n/2,f=0;w(),a===!1&&(e>0&&S(!0),t>0&&S(!1)),this.setIndex(c),this.setAttribute("position",new st(u,3)),this.setAttribute("normal",new st(d,3)),this.setAttribute("uv",new st(m,2));function w(){let x=new D,I=new D,R=0,T=(t-e)/n;for(let C=0;C<=r;C++){let y=[],_=C/r,L=_*(t-e)+e;for(let N=0;N<=s;N++){let P=N/s,F=P*l+o,H=Math.sin(F),O=Math.cos(F);I.x=L*H,I.y=-_*n+p,I.z=L*O,u.push(I.x,I.y,I.z),x.set(H,T,O).normalize(),d.push(x.x,x.y,x.z),m.push(P,1-_),y.push(g++)}v.push(y)}for(let C=0;C<s;C++)for(let y=0;y<r;y++){let _=v[y][C],L=v[y+1][C],N=v[y+1][C+1],P=v[y][C+1];(e>0||y!==0)&&(c.push(_,L,P),R+=3),(t>0||y!==r-1)&&(c.push(L,N,P),R+=3)}h.addGroup(f,R,0),f+=R}function S(x){let I=g,R=new Xe,T=new D,C=0,y=x===!0?e:t,_=x===!0?1:-1;for(let N=1;N<=s;N++)u.push(0,p*_,0),d.push(0,_,0),m.push(.5,.5),g++;let L=g;for(let N=0;N<=s;N++){let F=N/s*l+o,H=Math.cos(F),O=Math.sin(F);T.x=y*O,T.y=p*_,T.z=y*H,u.push(T.x,T.y,T.z),d.push(0,_,0),R.x=H*.5+.5,R.y=O*.5*_+.5,m.push(R.x,R.y),g++}for(let N=0;N<s;N++){let P=I+N,F=L+N;x===!0?c.push(F,F+1,P):c.push(F+1,F,P),C+=3}h.addGroup(f,C,x===!0?1:2),f+=C}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},mi=class i extends sn{constructor(e=1,t=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,e,t,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(e){return new i(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},tl=class i extends nn{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};let r=[],a=[];o(s),h(n),c(),this.setAttribute("position",new st(r,3)),this.setAttribute("normal",new st(r.slice(),3)),this.setAttribute("uv",new st(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(w){let S=new D,x=new D,I=new D;for(let R=0;R<t.length;R+=3)m(t[R+0],S),m(t[R+1],x),m(t[R+2],I),l(S,x,I,w)}function l(w,S,x,I){let R=I+1,T=[];for(let C=0;C<=R;C++){T[C]=[];let y=w.clone().lerp(x,C/R),_=S.clone().lerp(x,C/R),L=R-C;for(let N=0;N<=L;N++)N===0&&C===R?T[C][N]=y:T[C][N]=y.clone().lerp(_,N/L)}for(let C=0;C<R;C++)for(let y=0;y<2*(R-C)-1;y++){let _=Math.floor(y/2);y%2===0?(d(T[C][_+1]),d(T[C+1][_]),d(T[C][_])):(d(T[C][_+1]),d(T[C+1][_+1]),d(T[C+1][_]))}}function h(w){let S=new D;for(let x=0;x<r.length;x+=3)S.x=r[x+0],S.y=r[x+1],S.z=r[x+2],S.normalize().multiplyScalar(w),r[x+0]=S.x,r[x+1]=S.y,r[x+2]=S.z}function c(){let w=new D;for(let S=0;S<r.length;S+=3){w.x=r[S+0],w.y=r[S+1],w.z=r[S+2];let x=p(w)/2/Math.PI+.5,I=f(w)/Math.PI+.5;a.push(x,1-I)}g(),u()}function u(){for(let w=0;w<a.length;w+=6){let S=a[w+0],x=a[w+2],I=a[w+4],R=Math.max(S,x,I),T=Math.min(S,x,I);R>.9&&T<.1&&(S<.2&&(a[w+0]+=1),x<.2&&(a[w+2]+=1),I<.2&&(a[w+4]+=1))}}function d(w){r.push(w.x,w.y,w.z)}function m(w,S){let x=w*3;S.x=e[x+0],S.y=e[x+1],S.z=e[x+2]}function g(){let w=new D,S=new D,x=new D,I=new D,R=new Xe,T=new Xe,C=new Xe;for(let y=0,_=0;y<r.length;y+=9,_+=6){w.set(r[y+0],r[y+1],r[y+2]),S.set(r[y+3],r[y+4],r[y+5]),x.set(r[y+6],r[y+7],r[y+8]),R.set(a[_+0],a[_+1]),T.set(a[_+2],a[_+3]),C.set(a[_+4],a[_+5]),I.copy(w).add(S).add(x).divideScalar(3);let L=p(I);v(R,_+0,w,L),v(T,_+2,S,L),v(C,_+4,x,L)}}function v(w,S,x,I){I<0&&w.x===1&&(a[S]=w.x-1),x.x===0&&x.z===0&&(a[S]=I/2/Math.PI+.5)}function p(w){return Math.atan2(w.z,-w.x)}function f(w){return Math.atan2(-w.y,Math.sqrt(w.x*w.x+w.z*w.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.vertices,e.indices,e.radius,e.details)}};var Qn=class i extends tl{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}},nl=class i extends tl{constructor(e=1,t=0){let n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}};var ei=class i extends nn{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),h=0,c=[],u=new D,d=new D,m=[],g=[],v=[],p=[];for(let f=0;f<=n;f++){let w=[],S=f/n,x=0;f===0&&a===0?x=.5/t:f===n&&l===Math.PI&&(x=-.5/t);for(let I=0;I<=t;I++){let R=I/t;u.x=-e*Math.cos(s+R*r)*Math.sin(a+S*o),u.y=e*Math.cos(a+S*o),u.z=e*Math.sin(s+R*r)*Math.sin(a+S*o),g.push(u.x,u.y,u.z),d.copy(u).normalize(),v.push(d.x,d.y,d.z),p.push(R+x,1-S),w.push(h++)}c.push(w)}for(let f=0;f<n;f++)for(let w=0;w<t;w++){let S=c[f][w+1],x=c[f][w],I=c[f+1][w],R=c[f+1][w+1];(f!==0||a>0)&&m.push(S,x,R),(f!==n-1||l<Math.PI)&&m.push(x,I,R)}this.setIndex(m),this.setAttribute("position",new st(g,3)),this.setAttribute("normal",new st(v,3)),this.setAttribute("uv",new st(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Aa=class i extends nn{constructor(e=1,t=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);let a=[],o=[],l=[],h=[],c=new D,u=new D,d=new D;for(let m=0;m<=n;m++)for(let g=0;g<=s;g++){let v=g/s*r,p=m/n*Math.PI*2;u.x=(e+t*Math.cos(p))*Math.cos(v),u.y=(e+t*Math.cos(p))*Math.sin(v),u.z=t*Math.sin(p),o.push(u.x,u.y,u.z),c.x=e*Math.cos(v),c.y=e*Math.sin(v),d.subVectors(u,c).normalize(),l.push(d.x,d.y,d.z),h.push(g/s),h.push(m/n)}for(let m=1;m<=n;m++)for(let g=1;g<=s;g++){let v=(s+1)*m+g-1,p=(s+1)*(m-1)+g-1,f=(s+1)*(m-1)+g,w=(s+1)*m+g;a.push(v,p,w),a.push(p,f,w)}this.setIndex(a),this.setAttribute("position",new st(o,3)),this.setAttribute("normal",new st(l,3)),this.setAttribute("uv",new st(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var il=class extends ls{static get type(){return"MeshPhongMaterial"}constructor(e){super(),this.isMeshPhongMaterial=!0,this.color=new le(16777215),this.specular=new le(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new le(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=yu,this.normalScale=new Xe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new $t,this.combine=ll,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.specular.copy(e.specular),this.shininess=e.shininess,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var dn=class extends ls{static get type(){return"MeshLambertMaterial"}constructor(e){super(),this.isMeshLambertMaterial=!0,this.color=new le(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new le(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=yu,this.normalScale=new Xe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new $t,this.combine=ll,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};function ko(i,e,t){return!i||!t&&i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function ob(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var Dr=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];e:{t:{let a;n:{i:if(!(e<s)){for(let o=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=t[++n],e<s)break t}a=t.length;break n}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break t}a=n,n=0;break n}break e}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Qh=class extends Dr{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Xd,endingEnd:Xd}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case Yd:r=e,o=2*t-n;break;case Kd:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Yd:a=e,l=2*n-t;break;case Kd:a=1,l=n+s[1]-s[0];break;default:a=e-1,l=t}let h=(n-t)*.5,c=this.valueSize;this._weightPrev=h/(t-o),this._weightNext=h/(l-n),this._offsetPrev=r*c,this._offsetNext=a*c}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,h=l-o,c=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,m=this._weightNext,g=(n-t)/(s-t),v=g*g,p=v*g,f=-d*p+2*d*v-d*g,w=(1+d)*p+(-1.5-2*d)*v+(-.5+d)*g+1,S=(-1-m)*p+(1.5+m)*v+.5*g,x=m*p-m*v;for(let I=0;I!==o;++I)r[I]=f*a[c+I]+w*a[h+I]+S*a[l+I]+x*a[u+I];return r}},eu=class extends Dr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,h=l-o,c=(n-t)/(s-t),u=1-c;for(let d=0;d!==o;++d)r[d]=a[h+d]*u+a[l+d]*c;return r}},tu=class extends Dr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},ti=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=ko(t,this.TimeBufferType),this.values=ko(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:ko(e.times,Array),values:ko(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new tu(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new eu(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Qh(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Ho:t=this.InterpolantFactoryMethodDiscrete;break;case Dh:t=this.InterpolantFactoryMethodLinear;break;case vc:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ho;case this.InterpolantFactoryMethodLinear:return Dh;case this.InterpolantFactoryMethodSmooth:return vc}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(s!==void 0&&ob(s))for(let o=0,l=s.length;o!==l;++o){let h=s[o];if(isNaN(h)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,h),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===vc,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,h=e[o],c=e[o+1];if(h!==c&&(o!==1||h!==e[0]))if(s)l=!0;else{let u=o*n,d=u-n,m=u+n;for(let g=0;g!==n;++g){let v=t[u+g];if(v!==t[d+g]||v!==t[m+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let u=o*n,d=a*n;for(let m=0;m!==n;++m)t[d+m]=t[u+m]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,h=0;h!==n;++h)t[l+h]=t[o+h];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};ti.prototype.TimeBufferType=Float32Array;ti.prototype.ValueBufferType=Float32Array;ti.prototype.DefaultInterpolation=Dh;var Us=class extends ti{constructor(e,t,n){super(e,t,n)}};Us.prototype.ValueTypeName="bool";Us.prototype.ValueBufferType=Array;Us.prototype.DefaultInterpolation=Ho;Us.prototype.InterpolantFactoryMethodLinear=void 0;Us.prototype.InterpolantFactoryMethodSmooth=void 0;var nu=class extends ti{};nu.prototype.ValueTypeName="color";var iu=class extends ti{};iu.prototype.ValueTypeName="number";var su=class extends Dr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(s-t),h=e*o;for(let c=h+o;h!==c;h+=4)ln.slerpFlat(r,0,a,h-o,a,h,l);return r}},sl=class extends ti{InterpolantFactoryMethodLinear(e){return new su(this.times,this.values,this.getValueSize(),e)}};sl.prototype.ValueTypeName="quaternion";sl.prototype.InterpolantFactoryMethodSmooth=void 0;var Fs=class extends ti{constructor(e,t,n){super(e,t,n)}};Fs.prototype.ValueTypeName="string";Fs.prototype.ValueBufferType=Array;Fs.prototype.DefaultInterpolation=Ho;Fs.prototype.InterpolantFactoryMethodLinear=void 0;Fs.prototype.InterpolantFactoryMethodSmooth=void 0;var ru=class extends ti{};ru.prototype.ValueTypeName="vector";var au=class{constructor(e,t,n){let s=this,r=!1,a=0,o=0,l,h=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(c){o++,r===!1&&s.onStart!==void 0&&s.onStart(c,a,o),r=!0},this.itemEnd=function(c){a++,s.onProgress!==void 0&&s.onProgress(c,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(c){s.onError!==void 0&&s.onError(c)},this.resolveURL=function(c){return l?l(c):c},this.setURLModifier=function(c){return l=c,this},this.addHandler=function(c,u){return h.push(c,u),this},this.removeHandler=function(c){let u=h.indexOf(c);return u!==-1&&h.splice(u,2),this},this.getHandler=function(c){for(let u=0,d=h.length;u<d;u+=2){let m=h[u],g=h[u+1];if(m.global&&(m.lastIndex=0),m.test(c))return g}return null}}},lb=new au,ou=class{constructor(e){this.manager=e!==void 0?e:lb,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};ou.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ta=class extends un{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new le(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},Nr=class extends Ta{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(un.DEFAULT_UP),this.updateMatrix(),this.groundColor=new le(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},$c=new Ge,$f=new D,Xf=new D,rl=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Xe(512,512),this.map=null,this.mapPass=null,this.matrix=new Ge,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Sa,this._frameExtents=new Xe(1,1),this._viewportCount=1,this._viewports=[new yt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;$f.setFromMatrixPosition(e.matrixWorld),t.position.copy($f),Xf.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Xf),t.updateMatrixWorld(),$c.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix($c),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply($c)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var Yf=new Ge,ya=new D,Xc=new D,lu=class extends rl{constructor(){super(new jt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Xe(4,2),this._viewportCount=6,this._viewports=[new yt(2,1,1,1),new yt(0,1,1,1),new yt(3,1,1,1),new yt(1,1,1,1),new yt(3,0,1,1),new yt(1,0,1,1)],this._cubeDirections=[new D(1,0,0),new D(-1,0,0),new D(0,0,1),new D(0,0,-1),new D(0,1,0),new D(0,-1,0)],this._cubeUps=[new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,0,1),new D(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,s=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),ya.setFromMatrixPosition(e.matrixWorld),n.position.copy(ya),Xc.copy(n.position),Xc.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(Xc),n.updateMatrixWorld(),s.makeTranslation(-ya.x,-ya.y,-ya.z),Yf.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Yf)}},al=class extends Ta{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new lu}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},cu=class extends rl{constructor(){super(new Zo(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Bs=class extends Ta{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(un.DEFAULT_UP),this.updateMatrix(),this.target=new un,this.shadow=new cu}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var bu="\\[\\]\\.:\\/",cb=new RegExp("["+bu+"]","g"),Mu="[^"+bu+"]",hb="[^"+bu.replace("\\.","")+"]",ub=/((?:WC+[\/:])*)/.source.replace("WC",Mu),db=/(WCOD+)?/.source.replace("WCOD",hb),fb=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Mu),pb=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Mu),mb=new RegExp("^"+ub+db+fb+pb+"$"),gb=["material","materials","bones","map"],hu=class{constructor(e,t,n){let s=n||Lt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Lt=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(cb,"")}static parseTrackName(e){let t=mb.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);gb.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let h=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let c=0;c<e.length;c++)if(e[c].name===h){h=c;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(h!==void 0){if(e[h]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[h]}}let a=e[s];if(a===void 0){let h=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+h+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Lt.Composite=hu;Lt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Lt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Lt.prototype.GetterByBindingType=[Lt.prototype._getValue_direct,Lt.prototype._getValue_array,Lt.prototype._getValue_arrayElement,Lt.prototype._getValue_toArray];Lt.prototype.SetterByBindingTypeAndVersioning=[[Lt.prototype._setValue_direct,Lt.prototype._setValue_direct_setNeedsUpdate,Lt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Lt.prototype._setValue_array,Lt.prototype._setValue_array_setNeedsUpdate,Lt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Lt.prototype._setValue_arrayElement,Lt.prototype._setValue_arrayElement_setNeedsUpdate,Lt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Lt.prototype._setValue_fromArray,Lt.prototype._setValue_fromArray_setNeedsUpdate,Lt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var $w=new Float32Array(1);typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"170"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="170");var wu={en:{mResume:"Resume",mActions:"Actions",mSettings:"Settings",mControls:"Buttons",mPerson:"This person",mNextPerson:"Next person",mFollowMe:"Follow my character",followingMe:"Following my character",mNextMap:"Next map",mPlay:"Play (my character)",mWatch:"Watch the world",mBack:"Back",mTitle:"World",aUse:"Interact (take, gather)",aRun:"Run",aEat:"Eat",aDrink:"Drink",aPickup:"Pick up food",aSleep:"Sleep / wake up",aTalk:"Talk",aZoomIn:"Zoom in",aZoomOut:"Zoom out",aThoughts:"Show / hide thoughts",aMenu:"Game menu",aPerson:"Person card",sThoughts:"Thoughts over heads",on:"On",off:"Off",sServer:"Server address",sUnpair:"Unpair this TV",cHelp:"Choose an action, press A / OK, then press the button you want for it.",cPad:"Controller",cRemote:"Remote",cPress:"Press the button for \u201C{0}\u201D\u2026 (Back cancels)",cSet:"{0} is now on {1}",cReset:"Back to the default buttons",cNone:"\u2014",cWatchNote:"In watch mode: Use = next person, Eat = next map, Sleep = person card.",dDrank:"You drank.",dPicked:"You picked up {0}.",dAte:"You ate.",dSleep:"You lie down to sleep. Move to wake up.",dWake:"You wake up.",dNoWater:"No water here: stand next to the water.",dNothing:"Nothing to do here.",dNoFood:"You carry no food.",dFull:"Your hands are full (5).",nFood:"food",nWater:"water",nRest:"rest",nFun:"company",nHp:"health",carry:"carrying {0}",iWood:"wood",iStone:"stone",iScrap:"scrap",iAxe:"an axe",iSpear:"a spear",has:"has {0}",wGatherWood:"gather wood",wGatherStone:"gather stone",wGatherScrap:"gather scrap",wAxe:"make an axe",wSpear:"make a spear",wFire:"build a campfire",wHut:"build a hut",wTend:"feed the fire",wStore:"collect food and store it",wLoot:"search the ruins",wFarm:"plant a field",wRepair:"repair the huts",listening:"Listening\u2026 say it (A again: done)",mPast:"Past events",pastHelp:"Zombie attacks (the last 20). Pick one to watch how everyone behaved.",pastNone:"No zombie attack recorded yet.",pastZ:"zombies",pastKilled:"{0} killed",rpTitle:"Replay",rpHint:"A: pause \xB7 \u25C0 \u25B6: 5 s \xB7 \u25B2 \u25BC: speed \xB7 B: back",evBite:"{0} bit {1} (health {2})",evKilled:"{0} killed {1}",evDeath:"{0} died",evFight:"{0} fights {1}",evFlee:"{0} runs from {1}",mGoTo:"Go to someone",mGoToHelp:"Pick a person: your character appears next to them.",dTp:"You are next to {0}.",zHit:"You hit the zombie!",zKilled:"The zombie is down.",actFight:"Fighting a zombie",pAge:"{0} years",pMan:"Man",pWoman:"Woman",pChild:"child",pExpecting:"expecting a baby",pPartner:"Partner",pParents:"Parents",pChildren:"Children",pGen:"Generation {0}",pNone:"none",pDead:"Died",pMood:"Mood",pWants:"Wants to",pMemory:"Remembers",pSaid:"Said",pRecent:"Lately",pTraits:"Traits",pFirst:"first survivors",tStrength:"strength",tSpeed:"speed",tIntelligence:"intelligence",tCourage:"courage",tEmpathy:"empathy",tMetabolism:"appetite",tLifespan:"lifespan",bTo:"going to {0}",bWith:"with {0}",bWants:"wants: {0}",gDrink:"drink",gEat:"eat",gForage:"find food",gSleep:"sleep",gTalk:"talk",gWander:"walk around",gRest:"rest",gTravel:"travel",hintMenu:"+ / Back: menu",gameMenuItem:"Game menu",hMove:"Move",sayLabel:"Say something (empty = just say hello)",wFollow:"follow a person",wMap:"next map",wCard:"person card",mNearby:"Nearest person",sThoughtsOnly:"Only players the owner allows see thoughts.",mMe:"Me",dTalk:"You talk to them.",dNobody:"Nobody close enough.",sZoom:"Zoom",cPressed:"Pressed: {0}"},fr:{mResume:"Reprendre",mActions:"Actions",mSettings:"R\xE9glages",mControls:"Boutons",mPerson:"Cette personne",mNextPerson:"Personne suivante",mFollowMe:"Suivre mon personnage",followingMe:"Je suis votre personnage",mNextMap:"Carte suivante",mPlay:"Jouer (mon personnage)",mWatch:"Regarder le monde",mBack:"Retour",mTitle:"Monde",aUse:"Interagir (prendre, r\xE9colter)",aRun:"Courir",aEat:"Manger",aDrink:"Boire",aPickup:"Ramasser de la nourriture",aSleep:"Dormir / se r\xE9veiller",aTalk:"Parler",aZoomIn:"Zoom avant",aZoomOut:"Zoom arri\xE8re",aThoughts:"Afficher / masquer les pens\xE9es",aMenu:"Menu du jeu",aPerson:"Fiche de la personne",sThoughts:"Pens\xE9es au-dessus des t\xEAtes",on:"Oui",off:"Non",sServer:"Adresse du serveur",sUnpair:"Dissocier cette TV",cHelp:"Choisissez une action, appuyez sur A / OK, puis sur le bouton voulu.",cPad:"Manette",cRemote:"T\xE9l\xE9commande",cPress:"Appuyez sur le bouton pour \xAB {0} \xBB\u2026 (Retour annule)",cSet:"{0} est maintenant sur {1}",cReset:"Revenir aux boutons par d\xE9faut",cNone:"\u2014",cWatchNote:"En mode regarder : Utiliser = personne suivante, Manger = carte suivante, Dormir = fiche.",dDrank:"Vous avez bu.",dPicked:"Vous avez ramass\xE9 {0}.",dAte:"Vous avez mang\xE9.",dSleep:"Vous vous allongez pour dormir. Bougez pour vous r\xE9veiller.",dWake:"Vous vous r\xE9veillez.",dNoWater:"Pas d\u2019eau ici : placez-vous au bord de l\u2019eau.",dNothing:"Rien \xE0 faire ici.",dNoFood:"Vous n\u2019avez pas de nourriture.",dFull:"Vos mains sont pleines (5).",nFood:"faim",nWater:"eau",nRest:"repos",nFun:"compagnie",nHp:"sant\xE9",carry:"porte {0}",iWood:"bois",iStone:"pierre",iScrap:"ferraille",iAxe:"une hache",iSpear:"une lance",has:"a {0}",wGatherWood:"ramasser du bois",wGatherStone:"ramasser des pierres",wGatherScrap:"chercher de la ferraille",wAxe:"fabriquer une hache",wSpear:"fabriquer une lance",wFire:"faire un feu de camp",wHut:"construire une cabane",wTend:"entretenir le feu",wStore:"ramasser de la nourriture et la stocker",wLoot:"fouiller les ruines",wFarm:"planter un champ",wRepair:"r\xE9parer les cabanes",listening:"J\u2019\xE9coute\u2026 parlez (A encore : termin\xE9)",mPast:"\xC9v\xE9nements pass\xE9s",pastHelp:"Attaques de zombies (les 20 derni\xE8res). Choisissez-en une pour voir comment chacun a r\xE9agi.",pastNone:"Aucune attaque de zombies enregistr\xE9e pour l\u2019instant.",pastZ:"zombies",pastKilled:"{0} tu\xE9s",rpTitle:"Rediffusion",rpHint:"A : pause \xB7 \u25C0 \u25B6 : 5 s \xB7 \u25B2 \u25BC : vitesse \xB7 B : retour",evBite:"{0} a mordu {1} (sant\xE9 {2})",evKilled:"{0} a tu\xE9 {1}",evDeath:"{0} est mort(e)",evFight:"{0} combat {1}",evFlee:"{0} fuit {1}",mGoTo:"Aller vers quelqu\u2019un",mGoToHelp:"Choisissez une personne : votre personnage appara\xEEt \xE0 c\xF4t\xE9.",dTp:"Vous \xEAtes \xE0 c\xF4t\xE9 de {0}.",zHit:"Vous frappez le zombie !",zKilled:"Le zombie est \xE0 terre.",actFight:"Combat un zombie",pAge:"{0} ans",pMan:"Homme",pWoman:"Femme",pChild:"enfant",pExpecting:"attend un b\xE9b\xE9",pPartner:"Partenaire",pParents:"Parents",pChildren:"Enfants",pGen:"G\xE9n\xE9ration {0}",pNone:"aucun",pDead:"Mort",pMood:"Humeur",pWants:"Veut",pMemory:"Se souvient",pSaid:"A dit",pRecent:"Derni\xE8rement",pTraits:"Traits",pFirst:"premiers survivants",tStrength:"force",tSpeed:"vitesse",tIntelligence:"intelligence",tCourage:"courage",tEmpathy:"empathie",tMetabolism:"app\xE9tit",tLifespan:"esp\xE9rance de vie",bTo:"va vers {0}",bWith:"avec {0}",bWants:"veut : {0}",gDrink:"boire",gEat:"manger",gForage:"trouver \xE0 manger",gSleep:"dormir",gTalk:"parler",gWander:"se promener",gRest:"se reposer",gTravel:"voyager",hintMenu:"+ / Retour : menu",gameMenuItem:"Menu du jeu",hMove:"Bouger",sayLabel:"Dire quelque chose (vide = juste saluer)",wFollow:"suivre une personne",wMap:"carte suivante",wCard:"fiche",mNearby:"Personne la plus proche",sThoughtsOnly:"Seuls les joueurs autoris\xE9s par le propri\xE9taire voient les pens\xE9es.",mMe:"Moi",dTalk:"Vous lui parlez.",dNobody:"Personne assez pr\xE8s.",sZoom:"Zoom",cPressed:"Appuy\xE9 : {0}"},es:{mResume:"Continuar",mActions:"Acciones",mSettings:"Ajustes",mControls:"Botones",mPerson:"Esta persona",mNextPerson:"Siguiente persona",mFollowMe:"Seguir a mi personaje",followingMe:"Siguiendo a tu personaje",mNextMap:"Siguiente mapa",mPlay:"Jugar (mi personaje)",mWatch:"Mirar el mundo",mBack:"Atr\xE1s",mTitle:"Mundo",aUse:"Interactuar (tomar, recoger)",aRun:"Correr",aEat:"Comer",aDrink:"Beber",aPickup:"Recoger comida",aSleep:"Dormir / despertar",aTalk:"Hablar",aZoomIn:"Acercar",aZoomOut:"Alejar",aThoughts:"Mostrar / ocultar pensamientos",aMenu:"Men\xFA del juego",aPerson:"Ficha de la persona",sThoughts:"Pensamientos sobre las cabezas",on:"S\xED",off:"No",sServer:"Direcci\xF3n del servidor",sUnpair:"Desvincular esta TV",cHelp:"Elige una acci\xF3n, pulsa A / OK y luego el bot\xF3n que quieras.",cPad:"Mando",cRemote:"Mando a distancia",cPress:"Pulsa el bot\xF3n para \xAB{0}\xBB\u2026 (Atr\xE1s cancela)",cSet:"{0} est\xE1 ahora en {1}",cReset:"Volver a los botones por defecto",cNone:"\u2014",cWatchNote:"En modo mirar: Usar = siguiente persona, Comer = siguiente mapa, Dormir = ficha.",dDrank:"Has bebido.",dPicked:"Has recogido {0}.",dAte:"Has comido.",dSleep:"Te tumbas a dormir. Mu\xE9vete para despertar.",dWake:"Te despiertas.",dNoWater:"No hay agua aqu\xED: ponte junto al agua.",dNothing:"Nada que hacer aqu\xED.",dNoFood:"No llevas comida.",dFull:"Tienes las manos llenas (5).",nFood:"hambre",nWater:"agua",nRest:"descanso",nFun:"compa\xF1\xEDa",nHp:"salud",carry:"lleva {0}",iWood:"madera",iStone:"piedra",iScrap:"chatarra",iAxe:"un hacha",iSpear:"una lanza",has:"tiene {0}",wGatherWood:"recoger madera",wGatherStone:"recoger piedras",wGatherScrap:"buscar chatarra",wAxe:"hacer un hacha",wSpear:"hacer una lanza",wFire:"hacer una hoguera",wHut:"construir una caba\xF1a",wTend:"avivar el fuego",wStore:"recoger comida y guardarla",wLoot:"registrar las ruinas",wFarm:"plantar un huerto",wRepair:"reparar las caba\xF1as",listening:"Escuchando\u2026 habla (A otra vez: listo)",mPast:"Eventos pasados",pastHelp:"Ataques de zombis (los 20 \xFAltimos). Elige uno para ver c\xF3mo reaccion\xF3 cada uno.",pastNone:"Todav\xEDa no hay ning\xFAn ataque de zombis grabado.",pastZ:"zombis",pastKilled:"{0} abatidos",rpTitle:"Repetici\xF3n",rpHint:"A: pausa \xB7 \u25C0 \u25B6: 5 s \xB7 \u25B2 \u25BC: velocidad \xB7 B: atr\xE1s",evBite:"{0} mordi\xF3 a {1} (salud {2})",evKilled:"{0} mat\xF3 a {1}",evDeath:"{0} muri\xF3",evFight:"{0} lucha contra {1}",evFlee:"{0} huye de {1}",mGoTo:"Ir hacia alguien",mGoToHelp:"Elige a una persona: tu personaje aparece a su lado.",dTp:"Est\xE1s junto a {0}.",zHit:"\xA1Golpeas al zombi!",zKilled:"El zombi ha ca\xEDdo.",actFight:"Luchando contra un zombi",pAge:"{0} a\xF1os",pMan:"Hombre",pWoman:"Mujer",pChild:"ni\xF1o",pExpecting:"espera un beb\xE9",pPartner:"Pareja",pParents:"Padres",pChildren:"Hijos",pGen:"Generaci\xF3n {0}",pNone:"ninguno",pDead:"Muri\xF3",pMood:"\xC1nimo",pWants:"Quiere",pMemory:"Recuerda",pSaid:"Dijo",pRecent:"\xDAltimamente",pTraits:"Rasgos",pFirst:"primeros supervivientes",tStrength:"fuerza",tSpeed:"velocidad",tIntelligence:"inteligencia",tCourage:"valor",tEmpathy:"empat\xEDa",tMetabolism:"apetito",tLifespan:"esperanza de vida",bTo:"va a {0}",bWith:"con {0}",bWants:"quiere: {0}",gDrink:"beber",gEat:"comer",gForage:"buscar comida",gSleep:"dormir",gTalk:"hablar",gWander:"pasear",gRest:"descansar",gTravel:"viajar",hintMenu:"+ / Atr\xE1s: men\xFA",gameMenuItem:"Men\xFA del juego",hMove:"Mover",sayLabel:"Decir algo (vac\xEDo = solo saludar)",wFollow:"seguir a alguien",wMap:"mapa siguiente",wCard:"ficha",mNearby:"Persona m\xE1s cercana",sThoughtsOnly:"Solo los jugadores que el due\xF1o permite ven los pensamientos.",mMe:"Yo",dTalk:"Le hablas.",dNobody:"No hay nadie lo bastante cerca.",sZoom:"Zoom",cPressed:"Pulsado: {0}"},ar:{mResume:"\u0645\u062A\u0627\u0628\u0639\u0629",mActions:"\u0627\u0644\u0623\u0641\u0639\u0627\u0644",mSettings:"\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",mControls:"\u0627\u0644\u0623\u0632\u0631\u0627\u0631",mPerson:"\u0647\u0630\u0627 \u0627\u0644\u0634\u062E\u0635",mNextPerson:"\u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062A\u0627\u0644\u064A",mFollowMe:"\u062A\u0627\u0628\u0639 \u0634\u062E\u0635\u064A\u062A\u064A",followingMe:"\u0623\u062A\u0627\u0628\u0639 \u0634\u062E\u0635\u064A\u062A\u0643",mNextMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",mPlay:"\u0627\u0644\u0639\u0628 (\u0634\u062E\u0635\u064A\u062A\u064A)",mWatch:"\u0634\u0627\u0647\u062F \u0627\u0644\u0639\u0627\u0644\u0645",mBack:"\u0631\u062C\u0648\u0639",mTitle:"\u0627\u0644\u0639\u0627\u0644\u0645",aUse:"\u062A\u0641\u0627\u0639\u0644 (\u0623\u062E\u0630\u060C \u062C\u0645\u0639)",aRun:"\u062C\u0631\u064A",aEat:"\u0623\u0643\u0644",aDrink:"\u0634\u0631\u0628",aPickup:"\u0627\u0644\u062A\u0642\u0627\u0637 \u0637\u0639\u0627\u0645",aSleep:"\u0646\u0648\u0645 / \u0627\u0633\u062A\u064A\u0642\u0627\u0638",aTalk:"\u062A\u062D\u062F\u062B",aZoomIn:"\u062A\u0643\u0628\u064A\u0631",aZoomOut:"\u062A\u0635\u063A\u064A\u0631",aThoughts:"\u0625\u0638\u0647\u0627\u0631 / \u0625\u062E\u0641\u0627\u0621 \u0627\u0644\u0623\u0641\u0643\u0627\u0631",aMenu:"\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0644\u0639\u0628\u0629",aPerson:"\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0634\u062E\u0635",sThoughts:"\u0627\u0644\u0623\u0641\u0643\u0627\u0631 \u0641\u0648\u0642 \u0627\u0644\u0631\u0624\u0648\u0633",on:"\u0646\u0639\u0645",off:"\u0644\u0627",sServer:"\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",sUnpair:"\u0625\u0644\u063A\u0627\u0621 \u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",cHelp:"\u0627\u062E\u062A\u0631 \u0641\u0639\u0644\u0627\u064B\u060C \u0627\u0636\u063A\u0637 A / OK\u060C \u062B\u0645 \u0627\u0636\u063A\u0637 \u0627\u0644\u0632\u0631 \u0627\u0644\u0630\u064A \u062A\u0631\u064A\u062F\u0647 \u0644\u0647.",cPad:"\u0630\u0631\u0627\u0639 \u0627\u0644\u062A\u062D\u0643\u0645",cRemote:"\u062C\u0647\u0627\u0632 \u0627\u0644\u062A\u062D\u0643\u0645",cPress:"\u0627\u0636\u063A\u0637 \u0627\u0644\u0632\u0631 \u0644\u0640 \xAB{0}\xBB\u2026 (\u0631\u062C\u0648\u0639 \u0644\u0644\u0625\u0644\u063A\u0627\u0621)",cSet:"{0} \u0627\u0644\u0622\u0646 \u0639\u0644\u0649 {1}",cReset:"\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u0623\u0632\u0631\u0627\u0631 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629",cNone:"\u2014",cWatchNote:"\u0641\u064A \u0648\u0636\u0639 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629: \u0627\u0633\u062A\u062E\u062F\u0627\u0645 = \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062A\u0627\u0644\u064A\u060C \u0623\u0643\u0644 = \u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629\u060C \u0646\u0648\u0645 = \u0627\u0644\u0628\u0637\u0627\u0642\u0629.",dDrank:"\u0634\u0631\u0628\u062A.",dPicked:"\u0627\u0644\u062A\u0642\u0637\u062A {0}.",dAte:"\u0623\u0643\u0644\u062A.",dSleep:"\u0627\u0633\u062A\u0644\u0642\u064A\u062A \u0644\u0644\u0646\u0648\u0645. \u062A\u062D\u0631\u0643 \u0644\u062A\u0633\u062A\u064A\u0642\u0638.",dWake:"\u0627\u0633\u062A\u064A\u0642\u0638\u062A.",dNoWater:"\u0644\u0627 \u0645\u0627\u0621 \u0647\u0646\u0627: \u0642\u0641 \u0628\u062C\u0627\u0646\u0628 \u0627\u0644\u0645\u0627\u0621.",dNothing:"\u0644\u0627 \u0634\u064A\u0621 \u0644\u0641\u0639\u0644\u0647 \u0647\u0646\u0627.",dNoFood:"\u0644\u0627 \u062A\u062D\u0645\u0644 \u0637\u0639\u0627\u0645\u0627\u064B.",dFull:"\u064A\u062F\u0627\u0643 \u0645\u0645\u062A\u0644\u0626\u062A\u0627\u0646 (5).",nFood:"\u062C\u0648\u0639",nWater:"\u0645\u0627\u0621",nRest:"\u0631\u0627\u062D\u0629",nFun:"\u0631\u0641\u0642\u0629",nHp:"\u0635\u062D\u0629",carry:"\u064A\u062D\u0645\u0644 {0}",iWood:"\u062E\u0634\u0628",iStone:"\u062D\u062C\u0627\u0631\u0629",iScrap:"\u062E\u0631\u062F\u0629",iAxe:"\u0641\u0623\u0633",iSpear:"\u0631\u0645\u062D",has:"\u0644\u062F\u064A\u0647 {0}",wGatherWood:"\u062C\u0645\u0639 \u0627\u0644\u062D\u0637\u0628",wGatherStone:"\u062C\u0645\u0639 \u0627\u0644\u062D\u062C\u0627\u0631\u0629",wGatherScrap:"\u062C\u0645\u0639 \u0627\u0644\u062E\u0631\u062F\u0629",wAxe:"\u0635\u0646\u0639 \u0641\u0623\u0633",wSpear:"\u0635\u0646\u0639 \u0631\u0645\u062D",wFire:"\u0625\u0634\u0639\u0627\u0644 \u0646\u0627\u0631 \u0627\u0644\u0645\u062E\u064A\u0645",wHut:"\u0628\u0646\u0627\u0621 \u0643\u0648\u062E",wTend:"\u062A\u063A\u0630\u064A\u0629 \u0627\u0644\u0646\u0627\u0631",wStore:"\u062C\u0645\u0639 \u0627\u0644\u0637\u0639\u0627\u0645 \u0648\u062A\u062E\u0632\u064A\u0646\u0647",wLoot:"\u062A\u0641\u062A\u064A\u0634 \u0627\u0644\u0623\u0646\u0642\u0627\u0636",wFarm:"\u0632\u0631\u0627\u0639\u0629 \u062D\u0642\u0644",wRepair:"\u0625\u0635\u0644\u0627\u062D \u0627\u0644\u0623\u0643\u0648\u0627\u062E",listening:"\u0623\u0633\u062A\u0645\u0639\u2026 \u062A\u0643\u0644\u0645 (A \u0645\u0631\u0629 \u0623\u062E\u0631\u0649: \u0627\u0646\u062A\u0647\u064A\u062A)",mPast:"\u0623\u062D\u062F\u0627\u062B \u0633\u0627\u0628\u0642\u0629",pastHelp:"\u0647\u062C\u0645\u0627\u062A \u0627\u0644\u0632\u0648\u0645\u0628\u064A (\u0622\u062E\u0631 20). \u0627\u062E\u062A\u0631 \u0648\u0627\u062D\u062F\u0629 \u0644\u062A\u0631\u0649 \u0643\u064A\u0641 \u062A\u0635\u0631\u0641 \u0627\u0644\u062C\u0645\u064A\u0639.",pastNone:"\u0644\u0645 \u064A\u0633\u062C\u0644 \u0623\u064A \u0647\u062C\u0648\u0645 \u0632\u0648\u0645\u0628\u064A \u0628\u0639\u062F.",pastZ:"\u0632\u0648\u0645\u0628\u064A",pastKilled:"\u0642\u062A\u0644 {0}",rpTitle:"\u0625\u0639\u0627\u062F\u0629",rpHint:"A: \u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A \xB7 \u25C0 \u25B6: 5 \u062B \xB7 \u25B2 \u25BC: \u0627\u0644\u0633\u0631\u0639\u0629 \xB7 B: \u0631\u062C\u0648\u0639",evBite:"{0} \u0639\u0636 {1} (\u0627\u0644\u0635\u062D\u0629 {2})",evKilled:"{0} \u0642\u062A\u0644 {1}",evDeath:"\u0645\u0627\u062A {0}",evFight:"{0} \u064A\u0642\u0627\u062A\u0644 {1}",evFlee:"{0} \u064A\u0647\u0631\u0628 \u0645\u0646 {1}",mGoTo:"\u0627\u0630\u0647\u0628 \u0625\u0644\u0649 \u0634\u062E\u0635",mGoToHelp:"\u0627\u062E\u062A\u0631 \u0634\u062E\u0635\u0627: \u062A\u0638\u0647\u0631 \u0634\u062E\u0635\u064A\u062A\u0643 \u0628\u062C\u0627\u0646\u0628\u0647.",dTp:"\u0623\u0646\u062A \u0628\u062C\u0627\u0646\u0628 {0}.",zHit:"\u0636\u0631\u0628\u062A \u0627\u0644\u0632\u0648\u0645\u0628\u064A!",zKilled:"\u0633\u0642\u0637 \u0627\u0644\u0632\u0648\u0645\u0628\u064A.",actFight:"\u064A\u0642\u0627\u062A\u0644 \u0632\u0648\u0645\u0628\u064A",pAge:"{0} \u0633\u0646\u0629",pMan:"\u0631\u062C\u0644",pWoman:"\u0627\u0645\u0631\u0623\u0629",pChild:"\u0637\u0641\u0644",pExpecting:"\u062A\u0646\u062A\u0638\u0631 \u0645\u0648\u0644\u0648\u062F\u0627\u064B",pPartner:"\u0627\u0644\u0634\u0631\u064A\u0643",pParents:"\u0627\u0644\u0648\u0627\u0644\u062F\u0627\u0646",pChildren:"\u0627\u0644\u0623\u0628\u0646\u0627\u0621",pGen:"\u0627\u0644\u062C\u064A\u0644 {0}",pNone:"\u0644\u0627 \u0623\u062D\u062F",pDead:"\u062A\u0648\u0641\u064A",pMood:"\u0627\u0644\u0645\u0632\u0627\u062C",pWants:"\u064A\u0631\u064A\u062F",pMemory:"\u064A\u062A\u0630\u0643\u0631",pSaid:"\u0642\u0627\u0644",pRecent:"\u0645\u0624\u062E\u0631\u0627\u064B",pTraits:"\u0627\u0644\u0635\u0641\u0627\u062A",pFirst:"\u0623\u0648\u0627\u0626\u0644 \u0627\u0644\u0646\u0627\u062C\u064A\u0646",tStrength:"\u0642\u0648\u0629",tSpeed:"\u0633\u0631\u0639\u0629",tIntelligence:"\u0630\u0643\u0627\u0621",tCourage:"\u0634\u062C\u0627\u0639\u0629",tEmpathy:"\u062A\u0639\u0627\u0637\u0641",tMetabolism:"\u0634\u0647\u064A\u0629",tLifespan:"\u0627\u0644\u0639\u0645\u0631 \u0627\u0644\u0645\u062A\u0648\u0642\u0639",bTo:"\u0630\u0627\u0647\u0628 \u0625\u0644\u0649 {0}",bWith:"\u0645\u0639 {0}",bWants:"\u064A\u0631\u064A\u062F: {0}",gDrink:"\u0627\u0644\u0634\u0631\u0628",gEat:"\u0627\u0644\u0623\u0643\u0644",gForage:"\u0625\u064A\u062C\u0627\u062F \u0637\u0639\u0627\u0645",gSleep:"\u0627\u0644\u0646\u0648\u0645",gTalk:"\u0627\u0644\u062D\u062F\u064A\u062B",gWander:"\u0627\u0644\u062A\u062C\u0648\u0644",gRest:"\u0627\u0644\u0631\u0627\u062D\u0629",gTravel:"\u0627\u0644\u0633\u0641\u0631",hintMenu:"+ / \u0631\u062C\u0648\u0639: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",gameMenuItem:"\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0644\u0639\u0628\u0629",hMove:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643",sayLabel:"\u0642\u0644 \u0634\u064A\u0626\u064B\u0627 (\u0641\u0627\u0631\u063A = \u0645\u062C\u0631\u062F \u062A\u062D\u064A\u0629)",wFollow:"\u062A\u062A\u0628\u0639 \u0634\u062E\u0635",wMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",wCard:"\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0634\u062E\u0635",mNearby:"\u0623\u0642\u0631\u0628 \u0634\u062E\u0635",sThoughtsOnly:"\u0644\u0627 \u064A\u0631\u0649 \u0627\u0644\u0623\u0641\u0643\u0627\u0631 \u0625\u0644\u0627 \u0627\u0644\u0644\u0627\u0639\u0628\u0648\u0646 \u0627\u0644\u0630\u064A\u0646 \u064A\u0633\u0645\u062D \u0644\u0647\u0645 \u0627\u0644\u0645\u0627\u0644\u0643.",mMe:"\u0623\u0646\u0627",dTalk:"\u062A\u062A\u062D\u062F\u062B \u0625\u0644\u064A\u0647.",dNobody:"\u0644\u0627 \u0623\u062D\u062F \u0642\u0631\u064A\u0628 \u0628\u0645\u0627 \u064A\u0643\u0641\u064A.",sZoom:"\u062A\u0643\u0628\u064A\u0631",cPressed:"\u062A\u0645 \u0627\u0644\u0636\u063A\u0637: {0}"}};var Su={en:{mBag:"Bag & crafting",bagHelp:"What you carry. The best weapon and clothes are used by themselves.",bagEmpty:"Your bag is empty. Press A next to a tree, a rock or rubble to gather; hunt animals the same way.",mCraft:"Craft",mGuide:"Recipe guide",guideHelp:"Pick a recipe to put its ingredients in, then Make.",catHelp:"Put ingredients in (A adds one more), then Make.",cMake:"Make",cNoRecipe:"nothing (no recipe)",cClear:"Take everything out",cPut:"Put down: {0}",cWeapon:"Weapon: {0}",cDefence:"Defence: {0} %",cHave:"\u2713",cIn:"In: {0}",cNothingIn:"Nothing in yet.",dCrafted:"You made {0}.",dNoRecipe:"No recipe for that in this category: see the guide.",dNoMat:"You do not have enough for that.",dBagFull:"You cannot carry more of that.",dPlaced:"You put down {0}.",dNoRoom:"No room there: face open ground (a door or a window can go into a wall).",dNoItem:"You have none.",dGot:"You got {0}.",dTooThick:"These trees are too thick to cut.",aHit:"You hit the {0}!",aKilled:"You killed the {0}: {1}.",dBlocked:"Wrecked cars block the road: nobody gets through while travel is closed.",kWeapon:"Weapons",kClothing:"Clothes and armour",kDefence:"Defences",kFurniture:"Furniture",rWood:"wood",rStone:"stone",rScrap:"scrap",rOre:"ore",rBrick:"bricks",rLeather:"leather",rClaw:"claws",rMeat:"meat",xSword:"sword",xAxe:"axe",xSpear:"spear",xBow:"bow",xArrows:"arrows",xClothes:"clothes",xArmor:"armour",xHelmet:"helmet",xPalisade:"palisade",xSpikes:"spikes",xStonewall:"stone wall",xDoor:"door",xWindow:"window",xBed:"bed",xLamp:"lamp",xCampfire:"campfire",anRabbit:"rabbit",anDeer:"deer",anBoar:"boar",anWolf:"wolf",anBear:"bear"},fr:{mBag:"Sac et fabrication",bagHelp:"Ce que tu portes. La meilleure arme et les meilleurs v\xEAtements servent tout seuls.",bagEmpty:"Ton sac est vide. Appuie sur A pr\xE8s d'un arbre, d'un rocher ou de gravats pour r\xE9colter ; chasse les animaux de la m\xEAme fa\xE7on.",mCraft:"Fabriquer",mGuide:"Guide des recettes",guideHelp:"Choisis une recette pour y mettre ses ingr\xE9dients, puis Fabriquer.",catHelp:"Mets des ingr\xE9dients (A en ajoute un), puis Fabriquer.",cMake:"Fabriquer",cNoRecipe:"rien (pas de recette)",cClear:"Tout retirer",cPut:"Poser : {0}",cWeapon:"Arme : {0}",cDefence:"D\xE9fense : {0} %",cHave:"\u2713",cIn:"Dedans : {0}",cNothingIn:"Rien pour l'instant.",dCrafted:"Tu as fabriqu\xE9 : {0}.",dNoRecipe:"Pas de recette pour \xE7a dans cette cat\xE9gorie : vois le guide.",dNoMat:"Tu n'en as pas assez.",dBagFull:"Tu ne peux pas en porter plus.",dPlaced:"Tu as pos\xE9 : {0}.",dNoRoom:"Pas de place : tourne-toi vers un sol libre (une porte ou une fen\xEAtre peut aller dans un mur).",dNoItem:"Tu n'en as pas.",dGot:"Tu as obtenu : {0}.",dTooThick:"Ces arbres sont trop \xE9pais pour \xEAtre coup\xE9s.",aHit:"Tu as frapp\xE9 : {0} !",aKilled:"Tu as tu\xE9 : {0} ({1}).",dBlocked:"Des voitures accident\xE9es bloquent la route : personne ne passe tant que le voyage est ferm\xE9.",kWeapon:"Armes",kClothing:"V\xEAtements et armures",kDefence:"D\xE9fenses",kFurniture:"Meubles",rWood:"bois",rStone:"pierre",rScrap:"ferraille",rOre:"minerai",rBrick:"briques",rLeather:"cuir",rClaw:"griffes",rMeat:"viande",xSword:"\xE9p\xE9e",xAxe:"hache",xSpear:"lance",xBow:"arc",xArrows:"fl\xE8ches",xClothes:"v\xEAtements",xArmor:"armure",xHelmet:"casque",xPalisade:"palissade",xSpikes:"pieux",xStonewall:"mur de pierre",xDoor:"porte",xWindow:"fen\xEAtre",xBed:"lit",xLamp:"lampe",xCampfire:"feu de camp",anRabbit:"lapin",anDeer:"cerf",anBoar:"sanglier",anWolf:"loup",anBear:"ours"},es:{mBag:"Bolsa y fabricaci\xF3n",bagHelp:"Lo que llevas. La mejor arma y la mejor ropa se usan solas.",bagEmpty:"Tu bolsa est\xE1 vac\xEDa. Pulsa A junto a un \xE1rbol, una roca o escombros para recoger; caza animales igual.",mCraft:"Fabricar",mGuide:"Gu\xEDa de recetas",guideHelp:"Elige una receta para poner sus ingredientes y luego Fabricar.",catHelp:"Pon ingredientes (A a\xF1ade uno m\xE1s) y luego Fabricar.",cMake:"Fabricar",cNoRecipe:"nada (no hay receta)",cClear:"Sacarlo todo",cPut:"Colocar: {0}",cWeapon:"Arma: {0}",cDefence:"Defensa: {0} %",cHave:"\u2713",cIn:"Dentro: {0}",cNothingIn:"Nada todav\xEDa.",dCrafted:"Has fabricado: {0}.",dNoRecipe:"No hay receta para eso en esta categor\xEDa: mira la gu\xEDa.",dNoMat:"No tienes suficiente.",dBagFull:"No puedes llevar m\xE1s de eso.",dPlaced:"Has colocado: {0}.",dNoRoom:"No hay sitio: mira hacia suelo libre (una puerta o ventana puede ir en una pared).",dNoItem:"No tienes.",dGot:"Has conseguido: {0}.",dTooThick:"Estos \xE1rboles son demasiado gruesos para cortarlos.",aHit:"\xA1Has golpeado: {0}!",aKilled:"Has matado: {0} ({1}).",dBlocked:"Coches destrozados bloquean la carretera: nadie pasa mientras el viaje est\xE9 cerrado.",kWeapon:"Armas",kClothing:"Ropa y armadura",kDefence:"Defensas",kFurniture:"Muebles",rWood:"madera",rStone:"piedra",rScrap:"chatarra",rOre:"mineral",rBrick:"ladrillos",rLeather:"cuero",rClaw:"garras",rMeat:"carne",xSword:"espada",xAxe:"hacha",xSpear:"lanza",xBow:"arco",xArrows:"flechas",xClothes:"ropa",xArmor:"armadura",xHelmet:"casco",xPalisade:"empalizada",xSpikes:"estacas",xStonewall:"muro de piedra",xDoor:"puerta",xWindow:"ventana",xBed:"cama",xLamp:"l\xE1mpara",xCampfire:"hoguera",anRabbit:"conejo",anDeer:"ciervo",anBoar:"jabal\xED",anWolf:"lobo",anBear:"oso"},ar:{mBag:"\u0627\u0644\u062D\u0642\u064A\u0628\u0629 \u0648\u0627\u0644\u0635\u0646\u0627\u0639\u0629",bagHelp:"\u0645\u0627 \u062A\u062D\u0645\u0644\u0647. \u0623\u0641\u0636\u0644 \u0633\u0644\u0627\u062D \u0648\u0623\u0641\u0636\u0644 \u0644\u0628\u0627\u0633 \u064A\u064F\u0633\u062A\u0639\u0645\u0644\u0627\u0646 \u0648\u062D\u062F\u0647\u0645\u0627.",bagEmpty:"\u062D\u0642\u064A\u0628\u062A\u0643 \u0641\u0627\u0631\u063A\u0629. \u0627\u0636\u063A\u0637 A \u0628\u062C\u0627\u0646\u0628 \u0634\u062C\u0631\u0629 \u0623\u0648 \u0635\u062E\u0631\u0629 \u0623\u0648 \u0623\u0646\u0642\u0627\u0636 \u0644\u062A\u062C\u0645\u0639\u061B \u0648\u0627\u0635\u0637\u062F \u0627\u0644\u062D\u064A\u0648\u0627\u0646\u0627\u062A \u0628\u0627\u0644\u0637\u0631\u064A\u0642\u0629 \u0646\u0641\u0633\u0647\u0627.",mCraft:"\u0627\u0635\u0646\u0639",mGuide:"\u062F\u0644\u064A\u0644 \u0627\u0644\u0648\u0635\u0641\u0627\u062A",guideHelp:"\u0627\u062E\u062A\u0631 \u0648\u0635\u0641\u0629 \u0644\u062A\u0636\u0639 \u0645\u0643\u0648\u0646\u0627\u062A\u0647\u0627\u060C \u062B\u0645 \u0627\u0635\u0646\u0639.",catHelp:"\u0636\u0639 \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A (A \u064A\u0636\u064A\u0641 \u0648\u0627\u062D\u062F\u0627)\u060C \u062B\u0645 \u0627\u0635\u0646\u0639.",cMake:"\u0627\u0635\u0646\u0639",cNoRecipe:"\u0644\u0627 \u0634\u064A\u0621 (\u0644\u0627 \u0648\u0635\u0641\u0629)",cClear:"\u0623\u062E\u0631\u062C \u0643\u0644 \u0634\u064A\u0621",cPut:"\u0636\u0639: {0}",cWeapon:"\u0627\u0644\u0633\u0644\u0627\u062D: {0}",cDefence:"\u0627\u0644\u062F\u0641\u0627\u0639: {0} %",cHave:"\u2713",cIn:"\u0628\u0627\u0644\u062F\u0627\u062E\u0644: {0}",cNothingIn:"\u0644\u0627 \u0634\u064A\u0621 \u0628\u0639\u062F.",dCrafted:"\u0635\u0646\u0639\u062A: {0}.",dNoRecipe:"\u0644\u0627 \u0648\u0635\u0641\u0629 \u0644\u0647\u0630\u0627 \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0641\u0626\u0629: \u0627\u0646\u0638\u0631 \u0627\u0644\u062F\u0644\u064A\u0644.",dNoMat:"\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0645\u0627 \u064A\u0643\u0641\u064A.",dBagFull:"\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062D\u0645\u0644 \u0627\u0644\u0645\u0632\u064A\u062F \u0645\u0646 \u0647\u0630\u0627.",dPlaced:"\u0648\u0636\u0639\u062A: {0}.",dNoRoom:"\u0644\u0627 \u0645\u0643\u0627\u0646 \u0647\u0646\u0627: \u0627\u062A\u062C\u0647 \u0625\u0644\u0649 \u0623\u0631\u0636 \u0641\u0627\u0631\u063A\u0629 (\u0627\u0644\u0628\u0627\u0628 \u0623\u0648 \u0627\u0644\u0646\u0627\u0641\u0630\u0629 \u064A\u0645\u0643\u0646 \u0648\u0636\u0639\u0647\u0645\u0627 \u0641\u064A \u062C\u062F\u0627\u0631).",dNoItem:"\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0645\u0646\u0647.",dGot:"\u062D\u0635\u0644\u062A \u0639\u0644\u0649: {0}.",dTooThick:"\u0647\u0630\u0647 \u0627\u0644\u0623\u0634\u062C\u0627\u0631 \u0633\u0645\u064A\u0643\u0629 \u062C\u062F\u0627 \u0644\u0642\u0637\u0639\u0647\u0627.",aHit:"\u0636\u0631\u0628\u062A: {0}!",aKilled:"\u0642\u062A\u0644\u062A: {0} ({1}).",dBlocked:"\u0633\u064A\u0627\u0631\u0627\u062A \u0645\u062D\u0637\u0645\u0629 \u062A\u0633\u062F \u0627\u0644\u0637\u0631\u064A\u0642: \u0644\u0627 \u0623\u062D\u062F \u064A\u0645\u0631 \u0645\u0627 \u062F\u0627\u0645 \u0627\u0644\u0633\u0641\u0631 \u0645\u063A\u0644\u0642\u0627.",kWeapon:"\u0627\u0644\u0623\u0633\u0644\u062D\u0629",kClothing:"\u0627\u0644\u0645\u0644\u0627\u0628\u0633 \u0648\u0627\u0644\u062F\u0631\u0648\u0639",kDefence:"\u0627\u0644\u062F\u0641\u0627\u0639\u0627\u062A",kFurniture:"\u0627\u0644\u0623\u062B\u0627\u062B",rWood:"\u062E\u0634\u0628",rStone:"\u062D\u062C\u0631",rScrap:"\u062E\u0631\u062F\u0629",rOre:"\u062E\u0627\u0645",rBrick:"\u0637\u0648\u0628",rLeather:"\u062C\u0644\u062F",rClaw:"\u0645\u062E\u0627\u0644\u0628",rMeat:"\u0644\u062D\u0645",xSword:"\u0633\u064A\u0641",xAxe:"\u0641\u0623\u0633",xSpear:"\u0631\u0645\u062D",xBow:"\u0642\u0648\u0633",xArrows:"\u0633\u0647\u0627\u0645",xClothes:"\u0645\u0644\u0627\u0628\u0633",xArmor:"\u062F\u0631\u0639",xHelmet:"\u062E\u0648\u0630\u0629",xPalisade:"\u0633\u064A\u0627\u062C \u062E\u0634\u0628\u064A",xSpikes:"\u0623\u0648\u062A\u0627\u062F",xStonewall:"\u062C\u062F\u0627\u0631 \u062D\u062C\u0631\u064A",xDoor:"\u0628\u0627\u0628",xWindow:"\u0646\u0627\u0641\u0630\u0629",xBed:"\u0633\u0631\u064A\u0631",xLamp:"\u0645\u0635\u0628\u0627\u062D",xCampfire:"\u0646\u0627\u0631 \u0645\u062E\u064A\u0645",anRabbit:"\u0623\u0631\u0646\u0628",anDeer:"\u063A\u0632\u0627\u0644",anBoar:"\u062E\u0646\u0632\u064A\u0631 \u0628\u0631\u064A",anWolf:"\u0630\u0626\u0628",anBear:"\u062F\u0628"}};var Au={en:{sCamera:"Camera",camTop:"From above",camThird:"Third person",camFirst:"First person",aCamera:"Change the camera",hTurn:"turn",aWheel:"Quick actions (hold)",wheelHelp:"Hold, point with the stick, let go",wheelRemote:"Arrows to pick, OK to do it, Back to close",qUse:"Use / talk",qEat:"Eat",qDrink:"Drink",qSleep:"Sleep / wake up",qPickup:"Pick up",qBag:"Bag",qCraft:"Craft",qPlace:"Put down",qCamera:"Camera",qNothing:"Nothing to put down."},fr:{sCamera:"Cam\xE9ra",camTop:"Vue du dessus",camThird:"Troisi\xE8me personne",camFirst:"Premi\xE8re personne",aCamera:"Changer de cam\xE9ra",hTurn:"tourner",aWheel:"Actions rapides (maintenir)",wheelHelp:"Maintenez, visez avec le stick, rel\xE2chez",wheelRemote:"Fl\xE8ches pour choisir, OK pour agir, Retour pour fermer",qUse:"Utiliser / parler",qEat:"Manger",qDrink:"Boire",qSleep:"Dormir / se r\xE9veiller",qPickup:"Ramasser",qBag:"Sac",qCraft:"Fabriquer",qPlace:"Poser",qCamera:"Cam\xE9ra",qNothing:"Rien \xE0 poser."},es:{sCamera:"C\xE1mara",camTop:"Desde arriba",camThird:"Tercera persona",camFirst:"Primera persona",aCamera:"Cambiar la c\xE1mara",hTurn:"girar",aWheel:"Acciones r\xE1pidas (mantener)",wheelHelp:"Mant\xE9n, apunta con el stick, suelta",wheelRemote:"Flechas para elegir, OK para hacerlo, Atr\xE1s para cerrar",qUse:"Usar / hablar",qEat:"Comer",qDrink:"Beber",qSleep:"Dormir / despertar",qPickup:"Recoger",qBag:"Bolsa",qCraft:"Fabricar",qPlace:"Colocar",qCamera:"C\xE1mara",qNothing:"Nada que colocar."},ar:{sCamera:"\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627",camTop:"\u0645\u0646 \u0627\u0644\u0623\u0639\u0644\u0649",camThird:"\u0645\u0646\u0638\u0648\u0631 \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062B\u0627\u0644\u062B",camFirst:"\u0645\u0646\u0638\u0648\u0631 \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u0623\u0648\u0644",aCamera:"\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627",hTurn:"\u0627\u0644\u062F\u0648\u0631\u0627\u0646",aWheel:"\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0633\u0631\u064A\u0639\u0629 (\u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u0627\u064B)",wheelHelp:"\u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u0627\u064B\u060C \u0648\u062C\u0651\u0647 \u0628\u0627\u0644\u0639\u0635\u0627\u060C \u062B\u0645 \u0627\u062A\u0631\u0643",wheelRemote:"\u0627\u0644\u0623\u0633\u0647\u0645 \u0644\u0644\u0627\u062E\u062A\u064A\u0627\u0631\u060C OK \u0644\u0644\u062A\u0646\u0641\u064A\u0630\u060C \u0631\u062C\u0648\u0639 \u0644\u0644\u0625\u063A\u0644\u0627\u0642",qUse:"\u0627\u0633\u062A\u062E\u062F\u0627\u0645 / \u062A\u062D\u062F\u062B",qEat:"\u0623\u0643\u0644",qDrink:"\u0634\u0631\u0628",qSleep:"\u0646\u0648\u0645 / \u0627\u0633\u062A\u064A\u0642\u0627\u0638",qPickup:"\u0627\u0644\u062A\u0642\u0627\u0637",qBag:"\u0627\u0644\u062D\u0642\u064A\u0628\u0629",qCraft:"\u0635\u0646\u0639",qPlace:"\u0648\u0636\u0639",qCamera:"\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627",qNothing:"\u0644\u0627 \u0634\u064A\u0621 \u0644\u0648\u0636\u0639\u0647."}};var Tu={en:{married:"You and {0} are married now!",divorced:"You and {0} are divorced.",sndTitle:"Sound",sndOn:"Sound",sndMaster:"Volume",sndFx:"Effects, people and animals",sndAmb:"Ambience (birds, night, fire)",sndUi:"Menus",sndHelp:"OK changes a volume by 10 %. Real recordings (CC0), see docs/audio/CREDITS.md.",aAttack:"Attack",aAim:"Aim the bow (hold)",aBuild:"Build",aAttackPerson:"Attack a person (PvP)",mPvp:"PvP (fighting people)",pvpOnW:"On",pvpOffW:"Off",pvpNoteOn:"PvP is ON: you can hit people and they can hit you back. Damage is small.",pvpNoteOff:"PvP is off. Nobody can hit you and you cannot hit people.",pvpNeed:"Turn PvP on first (Settings > How to fight).",theirPvpOff:"That player has PvP off.",pHit:"You hit them: {0} damage.",pvpHelp:"PvP is a separate action: Attack never hits a person. Turn PvP on, then use Attack a person. Damage is small (at most 30 with a strong weapon on someone unarmed, about 10 on an armed person, 3 bare-handed on armour). Nobody dies of it.",dNobodyNear:"Nobody next to you to talk to.",dSwing:"Nothing to hit in front of you.",noBow:"You need a bow (Bag > Craft > Weapons: 2 wood + 1 leather).",noArrows:"No arrows left (Weapons: 2 wood + 1 stone = 5 arrows).",missed:"Missed. {0} arrows left.",arrowsLeft:"{0} arrows left.",aimOn:"Aiming: point with the stick, {0} to shoot.",bindsNew:"New buttons: {0}",mFight:"How to fight",fightHelp:"Attack hits what is in front of you: turn towards it first. Your best weapon is used by itself. With a bow and arrows, Attack shoots when nothing is in reach; hold Aim to point exactly, a red ring shows what you will hit.",fFists:"Bare hands: {0} damage, reach 2.5 m.",fWeapon:"{0}: {1} damage. Craft: {2}.",fBow:"Bow: 30 damage up close, 24 at 10 to 16 m, 18 up to 22 m. Craft: {0}. Arrows: {1} = 5.",fArmour:"Clothes and armour take part of every bite: clothes 15 %, armour 35 %, helmet 15 %.",fTips:"Zombies come at 21:00 and crumble at dawn. Fire and lamps keep animals away; spikes hurt zombies; stone walls take half damage.",fHave:"You have",bTitle:"Build",bHelp:"Turn to where it should go, then pick it: it is put on the ground in front of you. Things not in your bag are made from your materials first.",bHut:"Hut (12 wood, 4 stone)",bInBag:"in bag: {0}",bMissing:"missing",buildNeed:"Not enough materials: {0}.",bKept:"Made, but there is no room in front: it is in your bag.",gTitle:"Graphics",gQuality:"Quality",gAuto:"Automatic",gLow:"Low (fastest)",gMid:"Medium",gHigh:"High",gFog:"Fog",gOff:"Off",gLight:"Light",gNormal:"Normal",gThick:"Thick",gDist:"View distance",gNear:"Near (faster)",gFar:"Far",gFps:"Show fps",gRestart:"Apply the new quality now (reloads the view)",gHelp:"Low quality, thick fog and a near view make the game faster on small TVs. A new quality needs the view to reload.",pGoal:"Objective",pLevel:"Level {0} \xB7 {1} points",mMe:"Me",meTitle:"My character",lookTitle:"How I look",lookHelp:"Welcome! Choose your character: woman or man, and a skin tone. Then Save.",lookWoman:"Woman",lookMan:"Man",lookSkin:"Skin tone",lookSave:"Save",lookSexNote:"You can change between woman and man once a week.",sexWeek:"You can change that again in {0} days.",sexPregnant:"Not while expecting a baby.",looked:"Saved.",autoRow:"AI autopilot when I am away",autoHelp:"On: when you leave, the AI lives your character (eats, works, talks) following your rules. Off: it sleeps until you come back.",autoOn:"Autopilot on: the AI lives for you while you are away.",autoOff:"Autopilot off: your character sleeps while you are away.",myRules:"My rules for the autopilot",ruleAdd:"Add a rule",ruleHelp:'Up to {0} rules, in your own words ("never go to the woods", "you must get married"). OK on a rule removes it.',ruleLabel:"A rule for your character",rulesFull:"You already have 5 rules: remove one first.",ruleAdded:"Rule added.",ruleRemoved:"Rule removed.",meHut:"Build a hut here (12 wood, 4 stone)",built:"Hut built.",needHut:"A hut needs 12 wood and 4 stone.",mePartner:"Partner",meChildren:"Children",meNone:"none yet",meExpecting:"A baby is coming in {0} hours.",meTraits:"Strength {0} \xB7 Speed {1} \xB7 Mind {2} \xB7 Courage {3} \xB7 Kindness {4}",meHp:"Health {0}",meGoals:"Done lately",askPartner:"Ask to be my partner",askMarry:"Propose marriage",askDivorce:"Ask for a divorce",askingMarry:"You ask {0} to marry you\u2026",askingDivorce:"You tell {0} you want a divorce\u2026",tryChild:"Try for a child",partners:"{0} said yes: you are partners now.",expecting:"A baby is on the way!",tooFar:"Get closer first."},fr:{married:"Vous \xEAtes maintenant mari\xE9(e) avec {0} !",divorced:"Vous avez divorc\xE9 de {0}.",sndTitle:"Son",sndOn:"Son",sndMaster:"Volume",sndFx:"Effets, personnes et animaux",sndAmb:"Ambiance (oiseaux, nuit, feu)",sndUi:"Menus",sndHelp:"OK change un volume de 10 %. Vrais enregistrements (CC0), voir docs/audio/CREDITS.md.",aAttack:"Attaquer",aAim:"Viser \xE0 l\u2019arc (maintenir)",aBuild:"Construire",aAttackPerson:"Attaquer une personne (JcJ)",mPvp:"JcJ (se battre contre des gens)",pvpOnW:"Activ\xE9",pvpOffW:"D\xE9sactiv\xE9",pvpNoteOn:"JcJ ACTIV\xC9 : vous pouvez frapper des gens et ils peuvent riposter. Les d\xE9g\xE2ts sont faibles.",pvpNoteOff:"JcJ d\xE9sactiv\xE9. Personne ne peut vous frapper et vous ne pouvez frapper personne.",pvpNeed:"Activez d\u2019abord le JcJ (R\xE9glages > Comment se battre).",theirPvpOff:"Ce joueur a d\xE9sactiv\xE9 le JcJ.",pHit:"Vous le frappez : {0} d\xE9g\xE2ts.",pvpHelp:"Le JcJ est une action \xE0 part : Attaquer ne frappe jamais une personne. Activez le JcJ, puis utilisez Attaquer une personne. Les d\xE9g\xE2ts sont faibles (30 au plus avec une arme forte sur quelqu\u2019un de d\xE9sarm\xE9, environ 10 sur une personne arm\xE9e, 3 \xE0 mains nues sur une armure). Personne n\u2019en meurt.",dNobodyNear:"Personne \xE0 c\xF4t\xE9 de vous \xE0 qui parler.",dSwing:"Rien \xE0 frapper devant vous.",noBow:"Il faut un arc (Sac > Fabriquer > Armes : 2 bois + 1 cuir).",noArrows:"Plus de fl\xE8ches (Armes : 2 bois + 1 pierre = 5 fl\xE8ches).",missed:"Rat\xE9. Il reste {0} fl\xE8ches.",arrowsLeft:"Il reste {0} fl\xE8ches.",aimOn:"Vis\xE9e : orientez avec le stick, {0} pour tirer.",bindsNew:"Nouveaux boutons : {0}",mFight:"Comment se battre",fightHelp:"Attaquer frappe ce qui est devant vous : tournez-vous d\u2019abord vers lui. Votre meilleure arme est utilis\xE9e toute seule. Avec un arc et des fl\xE8ches, Attaquer tire quand rien n\u2019est \xE0 port\xE9e ; maintenez Viser pour viser pr\xE9cis\xE9ment, un anneau rouge montre ce que vous toucherez.",fFists:"Mains nues : {0} de d\xE9g\xE2ts, port\xE9e 2,5 m.",fWeapon:"{0} : {1} de d\xE9g\xE2ts. Fabrication : {2}.",fBow:"Arc : 30 de d\xE9g\xE2ts de pr\xE8s, 24 entre 10 et 16 m, 18 jusqu\u2019\xE0 22 m. Fabrication : {0}. Fl\xE8ches : {1} = 5.",fArmour:"Les v\xEAtements et l\u2019armure retirent une part de chaque morsure : v\xEAtements 15 %, armure 35 %, casque 15 %.",fTips:"Les zombies arrivent \xE0 21 h et tombent en poussi\xE8re \xE0 l\u2019aube. Le feu et les lampes \xE9loignent les animaux ; les pieux blessent les zombies ; les murs de pierre prennent moiti\xE9 moins de d\xE9g\xE2ts.",fHave:"Vous avez",bTitle:"Construire",bHelp:"Tournez-vous vers l\u2019endroit voulu, puis choisissez : c\u2019est pos\xE9 au sol devant vous. Ce qui n\u2019est pas dans votre sac est d\u2019abord fabriqu\xE9 avec vos mat\xE9riaux.",bHut:"Cabane (12 bois, 4 pierres)",bInBag:"dans le sac : {0}",bMissing:"manque",buildNeed:"Pas assez de mat\xE9riaux : {0}.",bKept:"Fabriqu\xE9, mais pas de place devant : c\u2019est dans votre sac.",gTitle:"Graphismes",gQuality:"Qualit\xE9",gAuto:"Automatique",gLow:"Basse (la plus rapide)",gMid:"Moyenne",gHigh:"Haute",gFog:"Brouillard",gOff:"Aucun",gLight:"L\xE9ger",gNormal:"Normal",gThick:"\xC9pais",gDist:"Distance de vue",gNear:"Proche (plus rapide)",gFar:"Loin",gFps:"Afficher les fps",gRestart:"Appliquer la nouvelle qualit\xE9 maintenant (recharge la vue)",gHelp:"Une qualit\xE9 basse, un brouillard \xE9pais et une vue proche rendent le jeu plus rapide sur les petites TV. Une nouvelle qualit\xE9 demande de recharger la vue.",pGoal:"Objectif",pLevel:"Niveau {0} \xB7 {1} points",mMe:"Moi",meTitle:"Mon personnage",lookTitle:"Mon apparence",lookHelp:"Bienvenue ! Choisissez votre personnage : femme ou homme, et une couleur de peau. Puis Enregistrer.",lookWoman:"Femme",lookMan:"Homme",lookSkin:"Couleur de peau",lookSave:"Enregistrer",lookSexNote:"Vous pouvez changer entre femme et homme une fois par semaine.",sexWeek:"Vous pourrez changer cela dans {0} jours.",sexPregnant:"Pas pendant une grossesse.",looked:"Enregistr\xE9.",autoRow:"Pilote IA quand je suis absent",autoHelp:"Activ\xE9 : quand vous partez, l\u2019IA vit votre personnage (mange, travaille, parle) selon vos r\xE8gles. D\xE9sactiv\xE9 : il dort jusqu\u2019\xE0 votre retour.",autoOn:"Pilote activ\xE9 : l\u2019IA vit pour vous pendant votre absence.",autoOff:"Pilote d\xE9sactiv\xE9 : votre personnage dort pendant votre absence.",myRules:"Mes r\xE8gles pour le pilote",ruleAdd:"Ajouter une r\xE8gle",ruleHelp:"Jusqu\u2019\xE0 {0} r\xE8gles, avec vos mots (\xAB ne va jamais dans les bois \xBB, \xAB tu dois te marier \xBB). OK sur une r\xE8gle la retire.",ruleLabel:"Une r\xE8gle pour votre personnage",rulesFull:"Vous avez d\xE9j\xE0 5 r\xE8gles : retirez-en une d\u2019abord.",ruleAdded:"R\xE8gle ajout\xE9e.",ruleRemoved:"R\xE8gle retir\xE9e.",meHut:"Construire une cabane ici (12 bois, 4 pierres)",built:"Cabane construite.",needHut:"Une cabane demande 12 bois et 4 pierres.",mePartner:"Partenaire",meChildren:"Enfants",meNone:"pas encore",meExpecting:"Un b\xE9b\xE9 arrive dans {0} heures.",meTraits:"Force {0} \xB7 Vitesse {1} \xB7 Esprit {2} \xB7 Courage {3} \xB7 Gentillesse {4}",meHp:"Sant\xE9 {0}",meGoals:"Fait r\xE9cemment",askPartner:"Demander d\u2019\xEAtre mon partenaire",askMarry:"Demander en mariage",askDivorce:"Demander le divorce",askingMarry:"Vous demandez \xE0 {0} de vous \xE9pouser\u2026",askingDivorce:"Vous dites \xE0 {0} que vous voulez divorcer\u2026",tryChild:"Essayer d\u2019avoir un enfant",partners:"{0} a dit oui : vous \xEAtes partenaires.",expecting:"Un b\xE9b\xE9 est en route !",tooFar:"Approchez-vous d\u2019abord."},es:{married:"\xA1Ahora est\xE1s casado/a con {0}!",divorced:"Te has divorciado de {0}.",sndTitle:"Sonido",sndOn:"Sonido",sndMaster:"Volumen",sndFx:"Efectos, personas y animales",sndAmb:"Ambiente (p\xE1jaros, noche, fuego)",sndUi:"Men\xFAs",sndHelp:"OK cambia un volumen en un 10 %. Grabaciones reales (CC0), ver docs/audio/CREDITS.md.",aAttack:"Atacar",aAim:"Apuntar con el arco (mantener)",aBuild:"Construir",aAttackPerson:"Atacar a una persona (PvP)",mPvp:"PvP (pelear con gente)",pvpOnW:"Activado",pvpOffW:"Desactivado",pvpNoteOn:"PvP ACTIVADO: puedes golpear a la gente y te pueden devolver el golpe. El da\xF1o es peque\xF1o.",pvpNoteOff:"PvP desactivado. Nadie puede golpearte y t\xFA no puedes golpear a nadie.",pvpNeed:"Activa primero el PvP (Ajustes > C\xF3mo luchar).",theirPvpOff:"Ese jugador tiene el PvP desactivado.",pHit:"Lo golpeas: {0} de da\xF1o.",pvpHelp:"El PvP es una acci\xF3n aparte: Atacar nunca golpea a una persona. Activa el PvP y usa Atacar a una persona. El da\xF1o es peque\xF1o (30 como mucho con un arma fuerte contra alguien desarmado, unos 10 contra una persona armada, 3 con las manos contra armadura). Nadie muere por eso.",dNobodyNear:"No hay nadie a tu lado con quien hablar.",dSwing:"Nada que golpear delante de ti.",noBow:"Necesitas un arco (Bolsa > Fabricar > Armas: 2 madera + 1 cuero).",noArrows:"No quedan flechas (Armas: 2 madera + 1 piedra = 5 flechas).",missed:"Fallaste. Quedan {0} flechas.",arrowsLeft:"Quedan {0} flechas.",aimOn:"Apuntando: dirige con el stick, {0} para disparar.",bindsNew:"Botones nuevos: {0}",mFight:"C\xF3mo luchar",fightHelp:"Atacar golpea lo que tienes delante: g\xEDrate hacia ello primero. Tu mejor arma se usa sola. Con arco y flechas, Atacar dispara cuando nada est\xE1 al alcance; mant\xE9n Apuntar para apuntar con precisi\xF3n, un anillo rojo muestra a qu\xE9 dar\xE1s.",fFists:"Manos vac\xEDas: {0} de da\xF1o, alcance 2,5 m.",fWeapon:"{0}: {1} de da\xF1o. Fabricar: {2}.",fBow:"Arco: 30 de da\xF1o de cerca, 24 entre 10 y 16 m, 18 hasta 22 m. Fabricar: {0}. Flechas: {1} = 5.",fArmour:"La ropa y la armadura quitan parte de cada mordisco: ropa 15 %, armadura 35 %, casco 15 %.",fTips:"Los zombis llegan a las 21:00 y se deshacen al amanecer. El fuego y las l\xE1mparas alejan a los animales; las estacas hieren a los zombis; los muros de piedra reciben la mitad de da\xF1o.",fHave:"Tienes",bTitle:"Construir",bHelp:"G\xEDrate hacia donde debe ir y el\xEDgelo: se pone en el suelo delante de ti. Lo que no est\xE1 en tu bolsa se fabrica antes con tus materiales.",bHut:"Caba\xF1a (12 madera, 4 piedra)",bInBag:"en la bolsa: {0}",bMissing:"falta",buildNeed:"No hay materiales suficientes: {0}.",bKept:"Fabricado, pero no hay sitio delante: est\xE1 en tu bolsa.",gTitle:"Gr\xE1ficos",gQuality:"Calidad",gAuto:"Autom\xE1tica",gLow:"Baja (la m\xE1s r\xE1pida)",gMid:"Media",gHigh:"Alta",gFog:"Niebla",gOff:"No",gLight:"Ligera",gNormal:"Normal",gThick:"Densa",gDist:"Distancia de vista",gNear:"Cerca (m\xE1s r\xE1pido)",gFar:"Lejos",gFps:"Mostrar fps",gRestart:"Aplicar la nueva calidad ahora (recarga la vista)",gHelp:"Calidad baja, niebla densa y vista cercana hacen el juego m\xE1s r\xE1pido en televisores peque\xF1os. Una nueva calidad necesita recargar la vista.",pGoal:"Objetivo",pLevel:"Nivel {0} \xB7 {1} puntos",mMe:"Yo",meTitle:"Mi personaje",lookTitle:"Mi aspecto",lookHelp:"\xA1Bienvenido! Elige tu personaje: mujer u hombre, y un tono de piel. Luego Guardar.",lookWoman:"Mujer",lookMan:"Hombre",lookSkin:"Tono de piel",lookSave:"Guardar",lookSexNote:"Puedes cambiar entre mujer y hombre una vez por semana.",sexWeek:"Podr\xE1s cambiarlo de nuevo en {0} d\xEDas.",sexPregnant:"No durante un embarazo.",looked:"Guardado.",autoRow:"Piloto IA cuando no estoy",autoHelp:"Activado: cuando te vas, la IA vive tu personaje (come, trabaja, habla) seg\xFAn tus reglas. Desactivado: duerme hasta que vuelvas.",autoOn:"Piloto activado: la IA vive por ti mientras no est\xE1s.",autoOff:"Piloto desactivado: tu personaje duerme mientras no est\xE1s.",myRules:"Mis reglas para el piloto",ruleAdd:"A\xF1adir una regla",ruleHelp:"Hasta {0} reglas, con tus palabras (\xABnunca vayas al bosque\xBB, \xABdebes casarte\xBB). OK en una regla la quita.",ruleLabel:"Una regla para tu personaje",rulesFull:"Ya tienes 5 reglas: quita una primero.",ruleAdded:"Regla a\xF1adida.",ruleRemoved:"Regla quitada.",meHut:"Construir una caba\xF1a aqu\xED (12 madera, 4 piedra)",built:"Caba\xF1a construida.",needHut:"Una caba\xF1a necesita 12 de madera y 4 de piedra.",mePartner:"Pareja",meChildren:"Hijos",meNone:"todav\xEDa no",meExpecting:"Un beb\xE9 llega en {0} horas.",meTraits:"Fuerza {0} \xB7 Velocidad {1} \xB7 Mente {2} \xB7 Valor {3} \xB7 Bondad {4}",meHp:"Salud {0}",meGoals:"Hecho hace poco",askPartner:"Pedir que sea mi pareja",askMarry:"Proponer matrimonio",askDivorce:"Pedir el divorcio",askingMarry:"Le pides a {0} que se case contigo\u2026",askingDivorce:"Le dices a {0} que quieres divorciarte\u2026",tryChild:"Intentar tener un hijo",partners:"{0} dijo que s\xED: ahora sois pareja.",expecting:"\xA1Viene un beb\xE9!",tooFar:"Ac\xE9rcate primero."},ar:{married:"\u0623\u0646\u062A \u0648{0} \u0645\u062A\u0632\u0648\u062C\u0627\u0646 \u0627\u0644\u0622\u0646!",divorced:"\u0623\u0646\u062A \u0648{0} \u0645\u0637\u0644\u0642\u0627\u0646 \u0627\u0644\u0622\u0646.",sndTitle:"\u0627\u0644\u0635\u0648\u062A",sndOn:"\u0627\u0644\u0635\u0648\u062A",sndMaster:"\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0635\u0648\u062A",sndFx:"\u0627\u0644\u0645\u0624\u062B\u0631\u0627\u062A \u0648\u0627\u0644\u0646\u0627\u0633 \u0648\u0627\u0644\u062D\u064A\u0648\u0627\u0646\u0627\u062A",sndAmb:"\u0627\u0644\u0623\u062C\u0648\u0627\u0621 (\u0637\u064A\u0648\u0631\u060C \u0644\u064A\u0644\u060C \u0646\u0627\u0631)",sndUi:"\u0627\u0644\u0642\u0648\u0627\u0626\u0645",sndHelp:"OK \u064A\u063A\u064A\u0651\u0631 \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0635\u0648\u062A \u0628\u0640 10 %. \u062A\u0633\u062C\u064A\u0644\u0627\u062A \u062D\u0642\u064A\u0642\u064A\u0629 (CC0)\u060C \u0627\u0646\u0638\u0631 docs/audio/CREDITS.md.",aAttack:"\u0647\u062C\u0648\u0645",aAim:"\u0627\u0644\u062A\u0635\u0648\u064A\u0628 \u0628\u0627\u0644\u0642\u0648\u0633 (\u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u0627\u064B)",aBuild:"\u0628\u0646\u0627\u0621",aAttackPerson:"\u0645\u0647\u0627\u062C\u0645\u0629 \u0634\u062E\u0635 (\u0644\u0627\u0639\u0628 \u0636\u062F \u0644\u0627\u0639\u0628)",mPvp:"\u0642\u062A\u0627\u0644 \u0627\u0644\u0623\u0634\u062E\u0627\u0635 (PvP)",pvpOnW:"\u0645\u0641\u0639\u0651\u0644",pvpOffW:"\u0645\u062A\u0648\u0642\u0641",pvpNoteOn:"\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0642\u062A\u0627\u0644: \u064A\u0645\u0643\u0646\u0643 \u0636\u0631\u0628 \u0627\u0644\u0646\u0627\u0633 \u0648\u064A\u0645\u0643\u0646\u0647\u0645 \u0627\u0644\u0631\u062F. \u0627\u0644\u0636\u0631\u0631 \u0635\u063A\u064A\u0631.",pvpNoteOff:"\u0627\u0644\u0642\u062A\u0627\u0644 \u0645\u062A\u0648\u0642\u0641. \u0644\u0627 \u0623\u062D\u062F \u064A\u0633\u062A\u0637\u064A\u0639 \u0636\u0631\u0628\u0643 \u0648\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0636\u0631\u0628 \u0623\u062D\u062F.",pvpNeed:"\u0641\u0639\u0651\u0644 \u0627\u0644\u0642\u062A\u0627\u0644 \u0623\u0648\u0644\u0627\u064B (\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A > \u0643\u064A\u0641 \u062A\u0642\u0627\u062A\u0644).",theirPvpOff:"\u0647\u0630\u0627 \u0627\u0644\u0644\u0627\u0639\u0628 \u0623\u0648\u0642\u0641 \u0627\u0644\u0642\u062A\u0627\u0644.",pHit:"\u0636\u0631\u0628\u062A\u0647: \u0636\u0631\u0631 {0}.",pvpHelp:"\u0627\u0644\u0642\u062A\u0627\u0644 \u0628\u064A\u0646 \u0627\u0644\u0623\u0634\u062E\u0627\u0635 \u0625\u062C\u0631\u0627\u0621 \u0645\u0646\u0641\u0635\u0644: \u0627\u0644\u0647\u062C\u0648\u0645 \u0644\u0627 \u064A\u0636\u0631\u0628 \u0634\u062E\u0635\u0627\u064B \u0623\u0628\u062F\u0627\u064B. \u0641\u0639\u0651\u0644 \u0627\u0644\u0642\u062A\u0627\u0644 \u062B\u0645 \u0627\u0633\u062A\u062E\u062F\u0645 \u0645\u0647\u0627\u062C\u0645\u0629 \u0634\u062E\u0635. \u0627\u0644\u0636\u0631\u0631 \u0635\u063A\u064A\u0631 (30 \u0643\u062D\u062F \u0623\u0642\u0635\u0649 \u0628\u0633\u0644\u0627\u062D \u0642\u0648\u064A \u0639\u0644\u0649 \u0634\u062E\u0635 \u0623\u0639\u0632\u0644\u060C \u0646\u062D\u0648 10 \u0639\u0644\u0649 \u0645\u0633\u0644\u0651\u062D\u060C 3 \u0628\u0627\u0644\u064A\u062F\u064A\u0646 \u0639\u0644\u0649 \u062F\u0631\u0639). \u0644\u0627 \u0623\u062D\u062F \u064A\u0645\u0648\u062A \u0628\u0633\u0628\u0628\u0647.",dNobodyNear:"\u0644\u0627 \u0623\u062D\u062F \u0628\u062C\u0627\u0646\u0628\u0643 \u0644\u0644\u062A\u062D\u062F\u062B \u0645\u0639\u0647.",dSwing:"\u0644\u0627 \u0634\u064A\u0621 \u0623\u0645\u0627\u0645\u0643 \u0644\u0636\u0631\u0628\u0647.",noBow:"\u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0642\u0648\u0633 (\u0627\u0644\u062D\u0642\u064A\u0628\u0629 > \u0627\u0644\u0635\u0646\u0639 > \u0627\u0644\u0623\u0633\u0644\u062D\u0629: 2 \u062E\u0634\u0628 + 1 \u062C\u0644\u062F).",noArrows:"\u0644\u0645 \u062A\u0628\u0642 \u0633\u0647\u0627\u0645 (\u0627\u0644\u0623\u0633\u0644\u062D\u0629: 2 \u062E\u0634\u0628 + 1 \u062D\u062C\u0631 = 5 \u0633\u0647\u0627\u0645).",missed:"\u0623\u062E\u0637\u0623\u062A. \u0628\u0642\u064A {0} \u0633\u0647\u0627\u0645.",arrowsLeft:"\u0628\u0642\u064A {0} \u0633\u0647\u0627\u0645.",aimOn:"\u0627\u0644\u062A\u0635\u0648\u064A\u0628: \u0648\u062C\u0651\u0647 \u0628\u0627\u0644\u0639\u0635\u0627\u060C {0} \u0644\u0644\u0631\u0645\u064A.",bindsNew:"\u0623\u0632\u0631\u0627\u0631 \u062C\u062F\u064A\u062F\u0629: {0}",mFight:"\u0643\u064A\u0641 \u062A\u0642\u0627\u062A\u0644",fightHelp:"\u0627\u0644\u0647\u062C\u0648\u0645 \u064A\u0636\u0631\u0628 \u0645\u0627 \u0623\u0645\u0627\u0645\u0643: \u0627\u0633\u062A\u062F\u0631 \u0646\u062D\u0648\u0647 \u0623\u0648\u0644\u064B\u0627. \u064A\u064F\u0633\u062A\u0639\u0645\u0644 \u0623\u0641\u0636\u0644 \u0633\u0644\u0627\u062D \u0644\u062F\u064A\u0643 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627. \u0645\u0639 \u0642\u0648\u0633 \u0648\u0633\u0647\u0627\u0645\u060C \u064A\u0631\u0645\u064A \u0627\u0644\u0647\u062C\u0648\u0645 \u0639\u0646\u062F\u0645\u0627 \u0644\u0627 \u064A\u0643\u0648\u0646 \u0634\u064A\u0621 \u0641\u064A \u0645\u062A\u0646\u0627\u0648\u0644\u0643\u061B \u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u064B\u0627 \u0639\u0644\u0649 \u0627\u0644\u062A\u0635\u0648\u064A\u0628 \u0644\u062A\u0635\u0648\u0651\u0628 \u0628\u062F\u0642\u0629\u060C \u0648\u062A\u064F\u0638\u0647\u0631 \u062D\u0644\u0642\u0629 \u062D\u0645\u0631\u0627\u0621 \u0645\u0627 \u0633\u062A\u0635\u064A\u0628\u0647.",fFists:"\u0628\u0627\u0644\u064A\u062F\u064A\u0646: {0} \u0636\u0631\u0631\u060C \u0627\u0644\u0645\u062F\u0649 2.5 \u0645.",fWeapon:"{0}: {1} \u0636\u0631\u0631. \u0627\u0644\u0635\u0646\u0639: {2}.",fBow:"\u0627\u0644\u0642\u0648\u0633: 30 \u0636\u0631\u0631\u064B\u0627 \u0639\u0646 \u0642\u0631\u0628\u060C 24 \u0628\u064A\u0646 10 \u064816 \u0645\u060C 18 \u062D\u062A\u0649 22 \u0645. \u0627\u0644\u0635\u0646\u0639: {0}. \u0627\u0644\u0633\u0647\u0627\u0645: {1} = 5.",fArmour:"\u0627\u0644\u0645\u0644\u0627\u0628\u0633 \u0648\u0627\u0644\u062F\u0631\u0639 \u062A\u062E\u0641\u0641 \u0643\u0644 \u0639\u0636\u0629: \u0627\u0644\u0645\u0644\u0627\u0628\u0633 15 %\u060C \u0627\u0644\u062F\u0631\u0639 35 %\u060C \u0627\u0644\u062E\u0648\u0630\u0629 15 %.",fTips:"\u064A\u0623\u062A\u064A \u0627\u0644\u0632\u0648\u0645\u0628\u064A \u0639\u0646\u062F 21:00 \u0648\u064A\u062A\u0641\u062A\u062A\u0648\u0646 \u0639\u0646\u062F \u0627\u0644\u0641\u062C\u0631. \u0627\u0644\u0646\u0627\u0631 \u0648\u0627\u0644\u0645\u0635\u0627\u0628\u064A\u062D \u062A\u0628\u0639\u062F \u0627\u0644\u062D\u064A\u0648\u0627\u0646\u0627\u062A\u061B \u0627\u0644\u0623\u0648\u062A\u0627\u062F \u062A\u062C\u0631\u062D \u0627\u0644\u0632\u0648\u0645\u0628\u064A\u061B \u0627\u0644\u062C\u062F\u0631\u0627\u0646 \u0627\u0644\u062D\u062C\u0631\u064A\u0629 \u062A\u062A\u0644\u0642\u0649 \u0646\u0635\u0641 \u0627\u0644\u0636\u0631\u0631.",fHave:"\u0644\u062F\u064A\u0643",bTitle:"\u0628\u0646\u0627\u0621",bHelp:"\u0627\u0633\u062A\u062F\u0631 \u0646\u062D\u0648 \u0627\u0644\u0645\u0643\u0627\u0646 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062B\u0645 \u0627\u062E\u062A\u0631: \u064A\u0648\u0636\u0639 \u0639\u0644\u0649 \u0627\u0644\u0623\u0631\u0636 \u0623\u0645\u0627\u0645\u0643. \u0645\u0627 \u0644\u064A\u0633 \u0641\u064A \u062D\u0642\u064A\u0628\u062A\u0643 \u064A\u064F\u0635\u0646\u0639 \u0623\u0648\u0644\u064B\u0627 \u0645\u0646 \u0645\u0648\u0627\u062F\u0643.",bHut:"\u0643\u0648\u062E (12 \u062E\u0634\u0628\u060C 4 \u062D\u062C\u0627\u0631\u0629)",bInBag:"\u0641\u064A \u0627\u0644\u062D\u0642\u064A\u0628\u0629: {0}",bMissing:"\u0646\u0627\u0642\u0635",buildNeed:"\u0627\u0644\u0645\u0648\u0627\u062F \u063A\u064A\u0631 \u0643\u0627\u0641\u064A\u0629: {0}.",bKept:"\u0635\u064F\u0646\u0639\u060C \u0644\u0643\u0646 \u0644\u0627 \u0645\u0643\u0627\u0646 \u0623\u0645\u0627\u0645\u0643: \u0625\u0646\u0647 \u0641\u064A \u062D\u0642\u064A\u0628\u062A\u0643.",gTitle:"\u0627\u0644\u0631\u0633\u0648\u0645\u0627\u062A",gQuality:"\u0627\u0644\u062C\u0648\u062F\u0629",gAuto:"\u062A\u0644\u0642\u0627\u0626\u064A",gLow:"\u0645\u0646\u062E\u0641\u0636\u0629 (\u0627\u0644\u0623\u0633\u0631\u0639)",gMid:"\u0645\u062A\u0648\u0633\u0637\u0629",gHigh:"\u0639\u0627\u0644\u064A\u0629",gFog:"\u0627\u0644\u0636\u0628\u0627\u0628",gOff:"\u0628\u062F\u0648\u0646",gLight:"\u062E\u0641\u064A\u0641",gNormal:"\u0639\u0627\u062F\u064A",gThick:"\u0643\u062B\u064A\u0641",gDist:"\u0645\u0633\u0627\u0641\u0629 \u0627\u0644\u0631\u0624\u064A\u0629",gNear:"\u0642\u0631\u064A\u0628\u0629 (\u0623\u0633\u0631\u0639)",gFar:"\u0628\u0639\u064A\u062F\u0629",gFps:"\u0625\u0638\u0647\u0627\u0631 \u0639\u062F\u062F \u0627\u0644\u0625\u0637\u0627\u0631\u0627\u062A",gRestart:"\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0627\u0644\u0622\u0646 (\u064A\u0639\u064A\u062F \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0639\u0631\u0636)",gHelp:"\u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0645\u0646\u062E\u0641\u0636\u0629 \u0648\u0627\u0644\u0636\u0628\u0627\u0628 \u0627\u0644\u0643\u062B\u064A\u0641 \u0648\u0627\u0644\u0631\u0624\u064A\u0629 \u0627\u0644\u0642\u0631\u064A\u0628\u0629 \u062A\u062C\u0639\u0644 \u0627\u0644\u0644\u0639\u0628\u0629 \u0623\u0633\u0631\u0639 \u0639\u0644\u0649 \u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u062A\u0644\u0641\u0627\u0632 \u0627\u0644\u0635\u063A\u064A\u0631\u0629. \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0625\u0639\u0627\u062F\u0629 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0639\u0631\u0636.",pGoal:"\u0627\u0644\u0647\u062F\u0641",pLevel:"\u0627\u0644\u0645\u0633\u062A\u0648\u0649 {0} \xB7 {1} \u0646\u0642\u0637\u0629",mMe:"\u0623\u0646\u0627",meTitle:"\u0634\u062E\u0635\u064A\u062A\u064A",lookTitle:"\u0645\u0638\u0647\u0631\u064A",lookHelp:"\u0645\u0631\u062D\u0628\u064B\u0627! \u0627\u062E\u062A\u0631 \u0634\u062E\u0635\u064A\u062A\u0643: \u0627\u0645\u0631\u0623\u0629 \u0623\u0648 \u0631\u062C\u0644\u060C \u0648\u0644\u0648\u0646 \u0627\u0644\u0628\u0634\u0631\u0629. \u062B\u0645 \u0627\u062D\u0641\u0638.",lookWoman:"\u0627\u0645\u0631\u0623\u0629",lookMan:"\u0631\u062C\u0644",lookSkin:"\u0644\u0648\u0646 \u0627\u0644\u0628\u0634\u0631\u0629",lookSave:"\u062D\u0641\u0638",lookSexNote:"\u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0628\u064A\u0646 \u0627\u0645\u0631\u0623\u0629 \u0648\u0631\u062C\u0644 \u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0641\u064A \u0627\u0644\u0623\u0633\u0628\u0648\u0639.",sexWeek:"\u064A\u0645\u0643\u0646\u0643 \u062A\u063A\u064A\u064A\u0631 \u0630\u0644\u0643 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649 \u0628\u0639\u062F {0} \u0623\u064A\u0627\u0645.",sexPregnant:"\u0644\u064A\u0633 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062D\u0645\u0644.",looked:"\u062A\u0645 \u0627\u0644\u062D\u0641\u0638.",autoRow:"\u0627\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0639\u0646\u062F \u063A\u064A\u0627\u0628\u064A",autoHelp:"\u0645\u0641\u0639\u0651\u0644: \u0639\u0646\u062F\u0645\u0627 \u062A\u063A\u0627\u062F\u0631\u060C \u064A\u0639\u064A\u0634 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0634\u062E\u0635\u064A\u062A\u0643 (\u064A\u0623\u0643\u0644\u060C \u064A\u0639\u0645\u0644\u060C \u064A\u062A\u062D\u062F\u062B) \u062D\u0633\u0628 \u0642\u0648\u0627\u0639\u062F\u0643. \u0645\u0639\u0637\u0651\u0644: \u062A\u0646\u0627\u0645 \u062D\u062A\u0649 \u062A\u0639\u0648\u062F.",autoOn:"\u0627\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A \u0645\u0641\u0639\u0651\u0644: \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u064A\u0639\u064A\u0634 \u0639\u0646\u0643 \u0623\u062B\u0646\u0627\u0621 \u063A\u064A\u0627\u0628\u0643.",autoOff:"\u0627\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A \u0645\u0639\u0637\u0651\u0644: \u0634\u062E\u0635\u064A\u062A\u0643 \u062A\u0646\u0627\u0645 \u0623\u062B\u0646\u0627\u0621 \u063A\u064A\u0627\u0628\u0643.",myRules:"\u0642\u0648\u0627\u0639\u062F\u064A \u0644\u0644\u0637\u064A\u0627\u0631 \u0627\u0644\u0622\u0644\u064A",ruleAdd:"\u0625\u0636\u0627\u0641\u0629 \u0642\u0627\u0639\u062F\u0629",ruleHelp:"\u062D\u062A\u0649 {0} \u0642\u0648\u0627\u0639\u062F \u0628\u0643\u0644\u0645\u0627\u062A\u0643 (\xAB\u0644\u0627 \u062A\u0630\u0647\u0628 \u0625\u0644\u0649 \u0627\u0644\u063A\u0627\u0628\u0629 \u0623\u0628\u062F\u064B\u0627\xBB\u060C \xAB\u064A\u062C\u0628 \u0623\u0646 \u062A\u062A\u0632\u0648\u062C\xBB). OK \u0639\u0644\u0649 \u0642\u0627\u0639\u062F\u0629 \u064A\u062D\u0630\u0641\u0647\u0627.",ruleLabel:"\u0642\u0627\u0639\u062F\u0629 \u0644\u0634\u062E\u0635\u064A\u062A\u0643",rulesFull:"\u0644\u062F\u064A\u0643 5 \u0642\u0648\u0627\u0639\u062F \u0628\u0627\u0644\u0641\u0639\u0644: \u0627\u062D\u0630\u0641 \u0648\u0627\u062D\u062F\u0629 \u0623\u0648\u0644\u064B\u0627.",ruleAdded:"\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0642\u0627\u0639\u062F\u0629.",ruleRemoved:"\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0642\u0627\u0639\u062F\u0629.",meHut:"\u0628\u0646\u0627\u0621 \u0643\u0648\u062E \u0647\u0646\u0627 (12 \u062E\u0634\u0628\u060C 4 \u062D\u062C\u0627\u0631\u0629)",built:"\u062A\u0645 \u0628\u0646\u0627\u0621 \u0627\u0644\u0643\u0648\u062E.",needHut:"\u0627\u0644\u0643\u0648\u062E \u064A\u062D\u062A\u0627\u062C 12 \u062E\u0634\u0628\u064B\u0627 \u06484 \u062D\u062C\u0627\u0631\u0629.",mePartner:"\u0627\u0644\u0634\u0631\u064A\u0643",meChildren:"\u0627\u0644\u0623\u0637\u0641\u0627\u0644",meNone:"\u0644\u0627 \u0623\u062D\u062F \u0628\u0639\u062F",meExpecting:"\u0637\u0641\u0644 \u0642\u0627\u062F\u0645 \u0628\u0639\u062F {0} \u0633\u0627\u0639\u0627\u062A.",meTraits:"\u0627\u0644\u0642\u0648\u0629 {0} \xB7 \u0627\u0644\u0633\u0631\u0639\u0629 {1} \xB7 \u0627\u0644\u0639\u0642\u0644 {2} \xB7 \u0627\u0644\u0634\u062C\u0627\u0639\u0629 {3} \xB7 \u0627\u0644\u0644\u0637\u0641 {4}",meHp:"\u0627\u0644\u0635\u062D\u0629 {0}",meGoals:"\u0623\u064F\u0646\u062C\u0632 \u0645\u0624\u062E\u0631\u064B\u0627",askPartner:"\u0627\u0637\u0644\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0634\u0631\u064A\u0643\u064A",askMarry:"\u0637\u0644\u0628 \u0627\u0644\u0632\u0648\u0627\u062C",askDivorce:"\u0637\u0644\u0628 \u0627\u0644\u0637\u0644\u0627\u0642",askingMarry:"\u062A\u0637\u0644\u0628 \u0645\u0646 {0} \u0623\u0646 \u064A\u062A\u0632\u0648\u062C\u0643\u2026",askingDivorce:"\u062A\u062E\u0628\u0631 {0} \u0623\u0646\u0643 \u062A\u0631\u064A\u062F \u0627\u0644\u0637\u0644\u0627\u0642\u2026",tryChild:"\u0645\u062D\u0627\u0648\u0644\u0629 \u0625\u0646\u062C\u0627\u0628 \u0637\u0641\u0644",partners:"{0} \u0648\u0627\u0641\u0642: \u0623\u0646\u062A\u0645\u0627 \u0634\u0631\u064A\u0643\u0627\u0646 \u0627\u0644\u0622\u0646.",expecting:"\u0637\u0641\u0644 \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642!",tooFar:"\u0627\u0642\u062A\u0631\u0628 \u0623\u0648\u0644\u064B\u0627."}};var Eu={en:{famTitle:"My family",famHelp:"Children under 3 cannot eat, drink or go anywhere by themselves: stand next to them (3 m) and look after them. Carry a baby to water, then Give water.",famNone:"No children yet.",famFeed:"Feed {0}",famWater:"Give {0} water",famCarry:"Pick up {0}",famDown:"Put {0} down",famBed:"Put {0} to bed",famNeeds:"Food {0} % \xB7 Water {1} % \xB7 Rest {2} %",famLooked:"looked after by {0}",famFar:"go next to them to look after them",stBaby:"baby",stToddler:"toddler",stChild:"child",stTeen:"teenager",stAdult:"grown up",famChosen:"Chosen family",famAsks:"Asks for you",famDrop:"No longer my {0}",famAskFrom:"{0} asks to be your {1}",famYes:"Accept",famNo:"Refuse",rolechild:"child",rolesibling:"brother / sister",roleparent:"parent",askChild:"Ask to be my child",askSibling:"Ask to be my brother / sister",askParent:"Ask to be my parent",kinAsked:"Asked {0}. They answer on their TV.",kinAskedYou:"{0} asks you to be family ({1}): Me > My family.",kinYes:"{0} said yes: you are family now.",kinNo:"{0} said no.",kinSet:"You are family now.",kinRefused:"Refused.",kinDropped:"Done.",kinAlready:"You are already that family.",kinOnlyPlayers:"Family roles are chosen between players only.",kidFed:"Fed.",kidWater:"They drank.",kidUp:"In your arms.",kidDown:"Put down.",kidBed:"Asleep.",kidNone:"That child is gone.",kidNotMine:"That is not your child.",kidFar:"Go next to them first (3 m)."},fr:{famTitle:"Ma famille",famHelp:"Les enfants de moins de 3 ans ne mangent, ne boivent et ne vont nulle part seuls : place-toi \xE0 c\xF4t\xE9 (3 m) et occupe-toi d'eux. Porte un b\xE9b\xE9 jusqu'\xE0 l'eau, puis Donner \xE0 boire.",famNone:"Pas encore d'enfants.",famFeed:"Nourrir {0}",famWater:"Donner \xE0 boire \xE0 {0}",famCarry:"Prendre {0}",famDown:"Poser {0}",famBed:"Coucher {0}",famNeeds:"Faim {0} % \xB7 Eau {1} % \xB7 Repos {2} %",famLooked:"gard\xE9 par {0}",famFar:"va \xE0 c\xF4t\xE9 pour t'en occuper",stBaby:"b\xE9b\xE9",stToddler:"tout-petit",stChild:"enfant",stTeen:"adolescent",stAdult:"adulte",famChosen:"Famille choisie",famAsks:"Demandes",famDrop:"Plus mon {0}",famAskFrom:"{0} demande \xE0 \xEAtre ton {1}",famYes:"Accepter",famNo:"Refuser",rolechild:"enfant",rolesibling:"fr\xE8re / s\u0153ur",roleparent:"parent",askChild:"Demander \xE0 \xEAtre mon enfant",askSibling:"Demander \xE0 \xEAtre mon fr\xE8re / ma s\u0153ur",askParent:"Demander \xE0 \xEAtre mon parent",kinAsked:"Demand\xE9 \xE0 {0}. R\xE9ponse sur sa t\xE9l\xE9.",kinAskedYou:"{0} te demande d'\xEAtre de la famille ({1}) : Moi > Ma famille.",kinYes:"{0} a dit oui : vous \xEAtes de la m\xEAme famille.",kinNo:"{0} a dit non.",kinSet:"Vous \xEAtes de la m\xEAme famille.",kinRefused:"Refus\xE9.",kinDropped:"Fait.",kinAlready:"C'est d\xE9j\xE0 le cas.",kinOnlyPlayers:"Les liens de famille se choisissent entre joueurs.",kidFed:"Nourri.",kidWater:"Il a bu.",kidUp:"Dans tes bras.",kidDown:"Pos\xE9.",kidBed:"Endormi.",kidNone:"Cet enfant n'est plus l\xE0.",kidNotMine:"Ce n'est pas ton enfant.",kidFar:"Approche-toi d'abord (3 m)."},es:{famTitle:"Mi familia",famHelp:"Los ni\xF1os menores de 3 a\xF1os no comen, beben ni van a ning\xFAn sitio solos: ponte a su lado (3 m) y cu\xEDdalos. Lleva al beb\xE9 al agua y luego Dar agua.",famNone:"A\xFAn no hay hijos.",famFeed:"Alimentar a {0}",famWater:"Dar agua a {0}",famCarry:"Coger a {0}",famDown:"Dejar a {0}",famBed:"Acostar a {0}",famNeeds:"Comida {0} % \xB7 Agua {1} % \xB7 Descanso {2} %",famLooked:"cuidado por {0}",famFar:"ve a su lado para cuidarlo",stBaby:"beb\xE9",stToddler:"ni\xF1o peque\xF1o",stChild:"ni\xF1o",stTeen:"adolescente",stAdult:"adulto",famChosen:"Familia elegida",famAsks:"Peticiones",famDrop:"Ya no es mi {0}",famAskFrom:"{0} pide ser tu {1}",famYes:"Aceptar",famNo:"Rechazar",rolechild:"hijo",rolesibling:"hermano / hermana",roleparent:"padre / madre",askChild:"Pedir que sea mi hijo",askSibling:"Pedir que sea mi hermano",askParent:"Pedir que sea mi padre / madre",kinAsked:"Preguntado a {0}. Responde en su tele.",kinAskedYou:"{0} te pide ser familia ({1}): Yo > Mi familia.",kinYes:"{0} dijo que s\xED: ya sois familia.",kinNo:"{0} dijo que no.",kinSet:"Ya sois familia.",kinRefused:"Rechazado.",kinDropped:"Hecho.",kinAlready:"Ya sois esa familia.",kinOnlyPlayers:"Los lazos de familia se eligen solo entre jugadores.",kidFed:"Alimentado.",kidWater:"Ha bebido.",kidUp:"En tus brazos.",kidDown:"En el suelo.",kidBed:"Dormido.",kidNone:"Ese ni\xF1o ya no est\xE1.",kidNotMine:"No es tu hijo.",kidFar:"Ac\xE9rcate primero (3 m)."},ar:{famTitle:"\u0639\u0627\u0626\u0644\u062A\u064A",famHelp:"\u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u062F\u0648\u0646 3 \u0633\u0646\u0648\u0627\u062A \u0644\u0627 \u064A\u0623\u0643\u0644\u0648\u0646 \u0648\u0644\u0627 \u064A\u0634\u0631\u0628\u0648\u0646 \u0648\u0644\u0627 \u064A\u0630\u0647\u0628\u0648\u0646 \u0648\u062D\u062F\u0647\u0645: \u0642\u0641 \u0628\u062C\u0627\u0646\u0628\u0647\u0645 (3 \u0645) \u0648\u0627\u0639\u062A\u0646\u0650 \u0628\u0647\u0645. \u0627\u062D\u0645\u0644 \u0627\u0644\u0631\u0636\u064A\u0639 \u0625\u0644\u0649 \u0627\u0644\u0645\u0627\u0621 \u062B\u0645 \u0627\u0633\u0642\u0647.",famNone:"\u0644\u0627 \u0623\u0637\u0641\u0627\u0644 \u0628\u0639\u062F.",famFeed:"\u0623\u0637\u0639\u0645 {0}",famWater:"\u0627\u0633\u0642\u0650 {0}",famCarry:"\u0627\u062D\u0645\u0644 {0}",famDown:"\u0636\u0639 {0} \u0623\u0631\u0636\u064B\u0627",famBed:"\u0646\u0648\u0651\u0645 {0}",famNeeds:"\u0637\u0639\u0627\u0645 {0} % \xB7 \u0645\u0627\u0621 {1} % \xB7 \u0631\u0627\u062D\u0629 {2} %",famLooked:"\u064A\u0639\u062A\u0646\u064A \u0628\u0647 {0}",famFar:"\u0627\u0642\u062A\u0631\u0628 \u0645\u0646\u0647 \u0644\u062A\u0639\u062A\u0646\u064A \u0628\u0647",stBaby:"\u0631\u0636\u064A\u0639",stToddler:"\u0637\u0641\u0644 \u0635\u063A\u064A\u0631",stChild:"\u0637\u0641\u0644",stTeen:"\u0645\u0631\u0627\u0647\u0642",stAdult:"\u0628\u0627\u0644\u063A",famChosen:"\u0639\u0627\u0626\u0644\u0629 \u0645\u062E\u062A\u0627\u0631\u0629",famAsks:"\u0637\u0644\u0628\u0627\u062A",famDrop:"\u0644\u0645 \u064A\u0639\u062F {0}",famAskFrom:"{0} \u064A\u0637\u0644\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 {1}",famYes:"\u0642\u0628\u0648\u0644",famNo:"\u0631\u0641\u0636",rolechild:"\u0627\u0628\u0646\u0643",rolesibling:"\u0623\u062E\u0627\u0643 / \u0623\u062E\u062A\u0643",roleparent:"\u0648\u0627\u0644\u062F\u0643",askChild:"\u0627\u0637\u0644\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0627\u0628\u0646\u064A",askSibling:"\u0627\u0637\u0644\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u062E\u064A / \u0623\u062E\u062A\u064A",askParent:"\u0627\u0637\u0644\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0648\u0627\u0644\u062F\u064A",kinAsked:"\u062A\u0645 \u0633\u0624\u0627\u0644 {0}. \u064A\u062C\u064A\u0628 \u0645\u0646 \u062A\u0644\u0641\u0627\u0632\u0647.",kinAskedYou:"{0} \u064A\u0637\u0644\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646\u0627 \u0639\u0627\u0626\u0644\u0629 ({1}): \u0623\u0646\u0627 > \u0639\u0627\u0626\u0644\u062A\u064A.",kinYes:"\u0648\u0627\u0641\u0642 {0}: \u0623\u0646\u062A\u0645\u0627 \u0639\u0627\u0626\u0644\u0629 \u0627\u0644\u0622\u0646.",kinNo:"\u0631\u0641\u0636 {0}.",kinSet:"\u0623\u0646\u062A\u0645\u0627 \u0639\u0627\u0626\u0644\u0629 \u0627\u0644\u0622\u0646.",kinRefused:"\u062A\u0645 \u0627\u0644\u0631\u0641\u0636.",kinDropped:"\u062A\u0645.",kinAlready:"\u0623\u0646\u062A\u0645\u0627 \u0643\u0630\u0644\u0643 \u0628\u0627\u0644\u0641\u0639\u0644.",kinOnlyPlayers:"\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u062A\u064F\u062E\u062A\u0627\u0631 \u0628\u064A\u0646 \u0627\u0644\u0644\u0627\u0639\u0628\u064A\u0646 \u0641\u0642\u0637.",kidFed:"\u062A\u0645 \u0627\u0644\u0625\u0637\u0639\u0627\u0645.",kidWater:"\u0634\u0631\u0628.",kidUp:"\u0628\u064A\u0646 \u0630\u0631\u0627\u0639\u064A\u0643.",kidDown:"\u0648\u064F\u0636\u0639 \u0623\u0631\u0636\u064B\u0627.",kidBed:"\u0646\u0627\u0645.",kidNone:"\u0647\u0630\u0627 \u0627\u0644\u0637\u0641\u0644 \u0644\u0645 \u064A\u0639\u062F \u0647\u0646\u0627.",kidNotMine:"\u0644\u064A\u0633 \u0637\u0641\u0644\u0643.",kidFar:"\u0627\u0642\u062A\u0631\u0628 \u0623\u0648\u0644\u064B\u0627 (3 \u0645)."}};var Cu={en:{plTitle:"Building: {0}",plPad:"Stick: move \xB7 {0}: build here \xB7 {1}: turn \xB7 {2}: cancel",plRemote:"Arrows: move \xB7 OK: build here \xB7 {0}: turn \xB7 Back: cancel",plBad:"Not here: {0}",plOk:"Good spot",plDoor:"the door faces {0}",plSent:"Building\u2026",dirS:"south",dirE:"east",dirN:"north",dirW:"west",cTooFar:"too far from you (8 m at most)",cSomeone:"someone is standing there",cDoorBlocked:"the door would open onto a wall",cNoRoom:"the ground there is taken",cUnknown:"not seen yet",dTooFar:"That is too far: aim closer to you.",dSomeone:"Someone is standing there.",dDoorBlocked:"The door would open onto a wall: turn it.",dDoorShut:"This is not your home: its door opens only for the owner's family.",dHard:"The rock is hard: keep hitting it.",bHut2:"Hut ({0}, with its own door)",bHelp2:"Pick what to build, then aim it: a see-through model shows where it goes (green = fine, red = not there). Move it with the stick or the arrows, turn a hut's door, and confirm. Things not in your bag are made from your materials first.",meHut2:"Build a hut here ({0})",needHut2:"A hut needs {0}."},fr:{plTitle:"Construction : {0}",plPad:"Stick : d\xE9placer \xB7 {0} : construire ici \xB7 {1} : tourner \xB7 {2} : annuler",plRemote:"Fl\xE8ches : d\xE9placer \xB7 OK : construire ici \xB7 {0} : tourner \xB7 Retour : annuler",plBad:"Pas ici : {0}",plOk:"Bon endroit",plDoor:"la porte donne au {0}",plSent:"Construction\u2026",dirS:"sud",dirE:"est",dirN:"nord",dirW:"ouest",cTooFar:"trop loin de toi (8 m au plus)",cSomeone:"quelqu'un se tient l\xE0",cDoorBlocked:"la porte donnerait sur un mur",cNoRoom:"le terrain est pris",cUnknown:"pas encore vu",dTooFar:"C'est trop loin : vise plus pr\xE8s de toi.",dSomeone:"Quelqu'un se tient l\xE0.",dDoorBlocked:"La porte donnerait sur un mur : tourne-la.",dDoorShut:"Ce n'est pas ta maison : sa porte ne s'ouvre que pour la famille du propri\xE9taire.",dHard:"La roche est dure : continue de frapper.",bHut2:"Cabane ({0}, avec sa porte)",bHelp2:"Choisis quoi construire, puis vise : un mod\xE8le transparent montre o\xF9 il ira (vert = bon, rouge = impossible). D\xE9place-le avec le stick ou les fl\xE8ches, tourne la porte d'une cabane, puis confirme. Ce qui n'est pas dans ton sac est d'abord fabriqu\xE9 avec tes mat\xE9riaux.",meHut2:"Construire une cabane ici ({0})",needHut2:"Une cabane demande {0}."},es:{plTitle:"Construir: {0}",plPad:"Stick: mover \xB7 {0}: construir aqu\xED \xB7 {1}: girar \xB7 {2}: cancelar",plRemote:"Flechas: mover \xB7 OK: construir aqu\xED \xB7 {0}: girar \xB7 Atr\xE1s: cancelar",plBad:"Aqu\xED no: {0}",plOk:"Buen sitio",plDoor:"la puerta da al {0}",plSent:"Construyendo\u2026",dirS:"sur",dirE:"este",dirN:"norte",dirW:"oeste",cTooFar:"demasiado lejos (8 m como mucho)",cSomeone:"hay alguien ah\xED",cDoorBlocked:"la puerta dar\xEDa a una pared",cNoRoom:"el terreno est\xE1 ocupado",cUnknown:"a\xFAn no visto",dTooFar:"Est\xE1 demasiado lejos: apunta m\xE1s cerca.",dSomeone:"Hay alguien ah\xED.",dDoorBlocked:"La puerta dar\xEDa a una pared: g\xEDrala.",dDoorShut:"No es tu casa: su puerta solo se abre para la familia del due\xF1o.",dHard:"La roca es dura: sigue golpeando.",bHut2:"Caba\xF1a ({0}, con su puerta)",bHelp2:"Elige qu\xE9 construir y apunta: un modelo transparente muestra d\xF3nde ir\xE1 (verde = bien, rojo = no). Mu\xE9velo con el stick o las flechas, gira la puerta de una caba\xF1a y confirma. Lo que no est\xE1 en tu bolsa se hace antes con tus materiales.",meHut2:"Construir una caba\xF1a aqu\xED ({0})",needHut2:"Una caba\xF1a necesita {0}."},ar:{plTitle:"\u0628\u0646\u0627\u0621: {0}",plPad:"\u0627\u0644\u0639\u0635\u0627: \u062A\u062D\u0631\u064A\u0643 \xB7 {0}: \u0627\u0628\u0646 \u0647\u0646\u0627 \xB7 {1}: \u062A\u062F\u0648\u064A\u0631 \xB7 {2}: \u0625\u0644\u063A\u0627\u0621",plRemote:"\u0627\u0644\u0623\u0633\u0647\u0645: \u062A\u062D\u0631\u064A\u0643 \xB7 OK: \u0627\u0628\u0646 \u0647\u0646\u0627 \xB7 {0}: \u062A\u062F\u0648\u064A\u0631 \xB7 \u0631\u062C\u0648\u0639: \u0625\u0644\u063A\u0627\u0621",plBad:"\u0644\u064A\u0633 \u0647\u0646\u0627: {0}",plOk:"\u0645\u0643\u0627\u0646 \u062C\u064A\u062F",plDoor:"\u0627\u0644\u0628\u0627\u0628 \u0646\u062D\u0648 {0}",plSent:"\u062C\u0627\u0631 \u0627\u0644\u0628\u0646\u0627\u0621\u2026",dirS:"\u0627\u0644\u062C\u0646\u0648\u0628",dirE:"\u0627\u0644\u0634\u0631\u0642",dirN:"\u0627\u0644\u0634\u0645\u0627\u0644",dirW:"\u0627\u0644\u063A\u0631\u0628",cTooFar:"\u0628\u0639\u064A\u062F \u062C\u062F\u0627 \u0639\u0646\u0643 (8 \u0645 \u0639\u0644\u0649 \u0627\u0644\u0623\u0643\u062B\u0631)",cSomeone:"\u0647\u0646\u0627\u0643 \u0634\u062E\u0635 \u0648\u0627\u0642\u0641",cDoorBlocked:"\u0633\u064A\u0641\u062A\u062D \u0627\u0644\u0628\u0627\u0628 \u0639\u0644\u0649 \u062C\u062F\u0627\u0631",cNoRoom:"\u0627\u0644\u0623\u0631\u0636 \u0645\u0634\u063A\u0648\u0644\u0629",cUnknown:"\u0644\u0645 \u064A\u0638\u0647\u0631 \u0628\u0639\u062F",dTooFar:"\u0647\u0630\u0627 \u0628\u0639\u064A\u062F \u062C\u062F\u0627: \u0635\u0648\u0628 \u0623\u0642\u0631\u0628 \u0625\u0644\u064A\u0643.",dSomeone:"\u0647\u0646\u0627\u0643 \u0634\u062E\u0635 \u0648\u0627\u0642\u0641.",dDoorBlocked:"\u0633\u064A\u0641\u062A\u062D \u0627\u0644\u0628\u0627\u0628 \u0639\u0644\u0649 \u062C\u062F\u0627\u0631: \u0623\u062F\u0631\u0647.",dDoorShut:"\u0647\u0630\u0627 \u0644\u064A\u0633 \u0628\u064A\u062A\u0643: \u0628\u0627\u0628\u0647 \u0644\u0627 \u064A\u0641\u062A\u062D \u0625\u0644\u0627 \u0644\u0639\u0627\u0626\u0644\u0629 \u0635\u0627\u062D\u0628\u0647.",dHard:"\u0627\u0644\u0635\u062E\u0631\u0629 \u0635\u0644\u0628\u0629: \u0648\u0627\u0635\u0644 \u0627\u0644\u0636\u0631\u0628.",bHut2:"\u0643\u0648\u062E ({0}\u060C \u0645\u0639 \u0628\u0627\u0628\u0647)",bHelp2:"\u0627\u062E\u062A\u0631 \u0645\u0627 \u062A\u0628\u0646\u064A\u0647 \u062B\u0645 \u0635\u0648\u0628: \u0646\u0645\u0648\u0630\u062C \u0634\u0641\u0627\u0641 \u064A\u0628\u064A\u0646 \u0645\u0643\u0627\u0646\u0647 (\u0623\u062E\u0636\u0631 = \u062C\u064A\u062F\u060C \u0623\u062D\u0645\u0631 = \u0644\u0627). \u062D\u0631\u0643\u0647 \u0628\u0627\u0644\u0639\u0635\u0627 \u0623\u0648 \u0627\u0644\u0623\u0633\u0647\u0645\u060C \u0623\u062F\u0631 \u0628\u0627\u0628 \u0627\u0644\u0643\u0648\u062E\u060C \u062B\u0645 \u0623\u0643\u062F. \u0645\u0627 \u0644\u064A\u0633 \u0641\u064A \u062D\u0642\u064A\u0628\u062A\u0643 \u064A\u0635\u0646\u0639 \u0623\u0648\u0644\u0627 \u0645\u0646 \u0645\u0648\u0627\u062F\u0643.",meHut2:"\u0627\u0628\u0646 \u0643\u0648\u062E\u0627 \u0647\u0646\u0627 ({0})",needHut2:"\u0627\u0644\u0643\u0648\u062E \u064A\u062D\u062A\u0627\u062C {0}."}};var Ru={en:{invTitle:"Bag & crafting",invCraft:"Crafting",invBag:"Bag",invBook:"Recipes",invNav:"\u25C0 \u25B6 \u25B2 \u25BC move \xB7 A pick \xB7 B back",invHintRes:"A: put one in the crafting grid",invHintGear:"A: use it (gear)",invHintPlace:"A: put it down in front of me",invHintGrid:"A: take it back",invHintMake:"A: make {0}",invHintNone:"Put materials in the grid, or pick a recipe",invHintBook:"A: fill the grid with it",invHintTab:"\u25C0 \u25B6 another category",invMissing:"Missing: {0}",invEmpty:"Empty",invIn:"in {0}",mGear:"Gear",gearTitle:"Gear",gSlotWeapon:"Weapon",gSlotRanged:"Bow",gSlotHead:"Head",gSlotBody:"Body",gBest:"Best",gNone:"Nothing",gLevelUp:"Level up",gQualityUp:"Raise quality",gDamage:"Damage",gDefence:"Defence",gNeedLv:"needs +{0} first",gMax:"at its best",gEmpty:"Nothing for this slot in the bag: craft one.",gNav:"\u25B2 \u25BC slot \xB7 \u25B6 choose / upgrade \xB7 A do it",gHands:"Bare hands",qual0:"Normal",qual1:"Fine",qual2:"Superior",qual3:"Epic",qual4:"Elite",dEquipped:"Equipped.",dUpgraded:"{0} is now {1}.",dUpNeed:"Not enough: {0}",dNeedLevel:"Level it up to +{0} first.",dMaxLevel:"Already at +10.",dMaxQuality:"Already elite.",dNotCarried:"Not in your bag."},fr:{invTitle:"Sac & fabrication",invCraft:"Fabrication",invBag:"Sac",invBook:"Recettes",invNav:"\u25C0 \u25B6 \u25B2 \u25BC bouger \xB7 A choisir \xB7 B retour",invHintRes:"A : en mettre un dans la grille",invHintGear:"A : l'utiliser (\xE9quipement)",invHintPlace:"A : le poser devant moi",invHintGrid:"A : le reprendre",invHintMake:"A : fabriquer {0}",invHintNone:"Mettez des mat\xE9riaux dans la grille, ou choisissez une recette",invHintBook:"A : remplir la grille",invHintTab:"\u25C0 \u25B6 autre cat\xE9gorie",invMissing:"Il manque : {0}",invEmpty:"Vide",invIn:"dans {0}",mGear:"\xC9quipement",gearTitle:"\xC9quipement",gSlotWeapon:"Arme",gSlotRanged:"Arc",gSlotHead:"T\xEAte",gSlotBody:"Corps",gBest:"Le meilleur",gNone:"Rien",gLevelUp:"Monter de niveau",gQualityUp:"Am\xE9liorer la qualit\xE9",gDamage:"D\xE9g\xE2ts",gDefence:"D\xE9fense",gNeedLv:"il faut +{0} d'abord",gMax:"au maximum",gEmpty:"Rien pour cet emplacement dans le sac : fabriquez-en un.",gNav:"\u25B2 \u25BC emplacement \xB7 \u25B6 choisir / am\xE9liorer \xB7 A valider",gHands:"Mains nues",qual0:"Normal",qual1:"Bon",qual2:"Sup\xE9rieur",qual3:"\xC9pique",qual4:"\xC9lite",dEquipped:"\xC9quip\xE9.",dUpgraded:"{0} est maintenant {1}.",dUpNeed:"Pas assez : {0}",dNeedLevel:"Montez-le d'abord \xE0 +{0}.",dMaxLevel:"D\xE9j\xE0 \xE0 +10.",dMaxQuality:"D\xE9j\xE0 \xE9lite.",dNotCarried:"Pas dans votre sac."},es:{invTitle:"Bolsa y fabricaci\xF3n",invCraft:"Fabricaci\xF3n",invBag:"Bolsa",invBook:"Recetas",invNav:"\u25C0 \u25B6 \u25B2 \u25BC mover \xB7 A elegir \xB7 B volver",invHintRes:"A: poner uno en la cuadr\xEDcula",invHintGear:"A: usarlo (equipo)",invHintPlace:"A: colocarlo delante de m\xED",invHintGrid:"A: recuperarlo",invHintMake:"A: fabricar {0}",invHintNone:"Pon materiales en la cuadr\xEDcula o elige una receta",invHintBook:"A: llenar la cuadr\xEDcula",invHintTab:"\u25C0 \u25B6 otra categor\xEDa",invMissing:"Falta: {0}",invEmpty:"Vac\xEDo",invIn:"en {0}",mGear:"Equipo",gearTitle:"Equipo",gSlotWeapon:"Arma",gSlotRanged:"Arco",gSlotHead:"Cabeza",gSlotBody:"Cuerpo",gBest:"El mejor",gNone:"Nada",gLevelUp:"Subir de nivel",gQualityUp:"Mejorar la calidad",gDamage:"Da\xF1o",gDefence:"Defensa",gNeedLv:"antes necesita +{0}",gMax:"al m\xE1ximo",gEmpty:"Nada para este hueco en la bolsa: fabrica uno.",gNav:"\u25B2 \u25BC hueco \xB7 \u25B6 elegir / mejorar \xB7 A hacerlo",gHands:"Manos desnudas",qual0:"Normal",qual1:"Bueno",qual2:"Superior",qual3:"\xC9pico",qual4:"\xC9lite",dEquipped:"Equipado.",dUpgraded:"{0} ahora es {1}.",dUpNeed:"No basta: {0}",dNeedLevel:"Primero s\xFAbelo a +{0}.",dMaxLevel:"Ya est\xE1 a +10.",dMaxQuality:"Ya es \xE9lite.",dNotCarried:"No est\xE1 en tu bolsa."},ar:{invTitle:"\u0627\u0644\u062D\u0642\u064A\u0628\u0629 \u0648\u0627\u0644\u0635\u0646\u0627\u0639\u0629",invCraft:"\u0627\u0644\u0635\u0646\u0627\u0639\u0629",invBag:"\u0627\u0644\u062D\u0642\u064A\u0628\u0629",invBook:"\u0627\u0644\u0648\u0635\u0641\u0627\u062A",invNav:"\u25C0 \u25B6 \u25B2 \u25BC \u062A\u062D\u0631\u064A\u0643 \xB7 A \u0627\u062E\u062A\u064A\u0627\u0631 \xB7 B \u0631\u062C\u0648\u0639",invHintRes:"A: \u0636\u0639 \u0648\u0627\u062D\u062F\u0629 \u0641\u064A \u0634\u0628\u0643\u0629 \u0627\u0644\u0635\u0646\u0627\u0639\u0629",invHintGear:"A: \u0627\u0633\u062A\u062E\u062F\u0645\u0647 (\u0639\u062A\u0627\u062F)",invHintPlace:"A: \u0636\u0639\u0647 \u0623\u0645\u0627\u0645\u064A",invHintGrid:"A: \u0627\u0633\u062A\u0631\u062C\u0639\u0647",invHintMake:"A: \u0627\u0635\u0646\u0639 {0}",invHintNone:"\u0636\u0639 \u0627\u0644\u0645\u0648\u0627\u062F \u0641\u064A \u0627\u0644\u0634\u0628\u0643\u0629 \u0623\u0648 \u0627\u062E\u062A\u0631 \u0648\u0635\u0641\u0629",invHintBook:"A: \u0627\u0645\u0644\u0623 \u0627\u0644\u0634\u0628\u0643\u0629 \u0628\u0647\u0627",invHintTab:"\u25C0 \u25B6 \u0641\u0626\u0629 \u0623\u062E\u0631\u0649",invMissing:"\u064A\u0646\u0642\u0635: {0}",invEmpty:"\u0641\u0627\u0631\u063A",invIn:"\u0641\u064A {0}",mGear:"\u0627\u0644\u0639\u062A\u0627\u062F",gearTitle:"\u0627\u0644\u0639\u062A\u0627\u062F",gSlotWeapon:"\u0627\u0644\u0633\u0644\u0627\u062D",gSlotRanged:"\u0627\u0644\u0642\u0648\u0633",gSlotHead:"\u0627\u0644\u0631\u0623\u0633",gSlotBody:"\u0627\u0644\u062C\u0633\u0645",gBest:"\u0627\u0644\u0623\u0641\u0636\u0644",gNone:"\u0644\u0627 \u0634\u064A\u0621",gLevelUp:"\u0631\u0641\u0639 \u0627\u0644\u0645\u0633\u062A\u0648\u0649",gQualityUp:"\u0631\u0641\u0639 \u0627\u0644\u062C\u0648\u062F\u0629",gDamage:"\u0627\u0644\u0636\u0631\u0631",gDefence:"\u0627\u0644\u062F\u0641\u0627\u0639",gNeedLv:"\u064A\u062D\u062A\u0627\u062C +{0} \u0623\u0648\u0644\u0627\u064B",gMax:"\u0641\u064A \u0623\u0642\u0635\u0649 \u062D\u062F",gEmpty:"\u0644\u0627 \u0634\u064A\u0621 \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u0627\u0646\u0629 \u0641\u064A \u0627\u0644\u062D\u0642\u064A\u0628\u0629: \u0627\u0635\u0646\u0639 \u0648\u0627\u062D\u062F\u0627\u064B.",gNav:"\u25B2 \u25BC \u0627\u0644\u062E\u0627\u0646\u0629 \xB7 \u25B6 \u0627\u062E\u062A\u064A\u0627\u0631 / \u062A\u0637\u0648\u064A\u0631 \xB7 A \u062A\u0646\u0641\u064A\u0630",gHands:"\u064A\u062F\u0627\u0646 \u0641\u0627\u0631\u063A\u062A\u0627\u0646",qual0:"\u0639\u0627\u062F\u064A",qual1:"\u062C\u064A\u062F",qual2:"\u0645\u0645\u062A\u0627\u0632",qual3:"\u0645\u0644\u062D\u0645\u064A",qual4:"\u0646\u062E\u0628\u0629",dEquipped:"\u062A\u0645 \u0627\u0644\u062A\u062C\u0647\u064A\u0632.",dUpgraded:"{0} \u0623\u0635\u0628\u062D {1}.",dUpNeed:"\u063A\u064A\u0631 \u0643\u0627\u0641\u064D: {0}",dNeedLevel:"\u0627\u0631\u0641\u0639 \u0645\u0633\u062A\u0648\u0627\u0647 \u0625\u0644\u0649 +{0} \u0623\u0648\u0644\u0627\u064B.",dMaxLevel:"\u0628\u0627\u0644\u0641\u0639\u0644 \u0641\u064A +10.",dMaxQuality:"\u0628\u0627\u0644\u0641\u0639\u0644 \u0646\u062E\u0628\u0629.",dNotCarried:"\u0644\u064A\u0633 \u0641\u064A \u062D\u0642\u064A\u0628\u062A\u0643."}};var Pu={en:{connecting:"Connecting to the world\u2026",offline:"The world server is not answering. Trying again\u2026",noServer:"No server address yet.",enterServer:"Press A to type the server address",serverLabel:"World server address",pairTitle:"Pair this TV",pairHow:"On your phone, open the control panel and approve this code:",pairWait:"Waiting for approval\u2026",pairExpired:"The code expired. Press A for a new one.",pairDenied:"The pairing was refused. Press A to try again.",hints:"Move: arrows \xB7 A: follow a person \xB7 X: next map \xB7 L / R: zoom \xB7 +: menu",hintsRemote:"Move: arrows \xB7 OK: follow a person \xB7 CH + / \u2212: zoom \xB7 Back twice: menu",following:"Following",free:"Free camera",day:"Day",agents:"people",menuMap:"Next map",menuZoomIn:"Zoom in",menuZoomOut:"Zoom out",menuServer:"Change server address",menuUnpair:"Unpair this TV",hintsPlay:"Move: stick \xB7 B: run \xB7 A: talk \xB7 L / R: zoom \xB7 +: menu",hintsPlayRemote:"Move: arrows \xB7 OK: talk \xB7 CH + / \u2212: zoom \xB7 Back: menu",menuPlay:"Play",menuWatch:"Watch the world",travelling:"Travelling to {0}\u2026",nobody:"Nobody close by.",metPlayer:"Another player is here.",worldFull:"The world is full right now.",noGl:"This screen can\u2019t draw 3D.",actIdle:"Standing",actWander:"Walking around",actDrink:"Getting water",actEat:"Eating",actForage:"Looking for food",actSleep:"Sleeping",actTalk:"Talking",actTravel:"Travelling",actRest:"Resting",actFlee:"Running away",actGo:"Going to someone",actGather:"Gathering",actBuild:"Building",inTransit:"travelling"},fr:{connecting:"Connexion au monde\u2026",offline:"Le serveur du monde ne r\xE9pond pas. Nouvel essai\u2026",noServer:"Pas encore d\u2019adresse de serveur.",enterServer:"Appuyez sur A pour taper l\u2019adresse du serveur",serverLabel:"Adresse du serveur du monde",pairTitle:"Associer cette TV",pairHow:"Sur votre t\xE9l\xE9phone, ouvrez le panneau de contr\xF4le et acceptez ce code :",pairWait:"En attente d\u2019approbation\u2026",pairExpired:"Le code a expir\xE9. Appuyez sur A pour un nouveau.",pairDenied:"L\u2019association a \xE9t\xE9 refus\xE9e. Appuyez sur A pour r\xE9essayer.",hints:"Bouger : fl\xE8ches \xB7 A : suivre une personne \xB7 X : carte suivante \xB7 L / R : zoom \xB7 + : menu",hintsRemote:"Bouger : fl\xE8ches \xB7 OK : suivre une personne \xB7 CH + / \u2212 : zoom \xB7 Retour deux fois : menu",following:"Suivi de",free:"Cam\xE9ra libre",day:"Jour",agents:"personnes",menuMap:"Carte suivante",menuZoomIn:"Zoom avant",menuZoomOut:"Zoom arri\xE8re",menuServer:"Changer l\u2019adresse du serveur",menuUnpair:"Dissocier cette TV",hintsPlay:"Bouger : stick \xB7 B : courir \xB7 A : parler \xB7 L / R : zoom \xB7 + : menu",hintsPlayRemote:"Bouger : fl\xE8ches \xB7 OK : parler \xB7 CH + / \u2212 : zoom \xB7 Retour : menu",menuPlay:"Jouer",menuWatch:"Regarder le monde",travelling:"En route vers {0}\u2026",nobody:"Personne \xE0 c\xF4t\xE9.",metPlayer:"Un autre joueur est l\xE0.",worldFull:"Le monde est plein pour le moment.",noGl:"Cet \xE9cran ne peut pas afficher la 3D.",actIdle:"Debout",actWander:"Se prom\xE8ne",actDrink:"Va boire",actEat:"Mange",actForage:"Cherche \xE0 manger",actSleep:"Dort",actTalk:"Discute",actTravel:"En voyage",actRest:"Se repose",actFlee:"S\u2019enfuit",actGo:"Va rejoindre quelqu\u2019un",actGather:"R\xE9colte",actBuild:"Construit",inTransit:"en voyage"},es:{connecting:"Conectando con el mundo\u2026",offline:"El servidor del mundo no responde. Reintentando\u2026",noServer:"Todav\xEDa no hay direcci\xF3n del servidor.",enterServer:"Pulsa A para escribir la direcci\xF3n del servidor",serverLabel:"Direcci\xF3n del servidor del mundo",pairTitle:"Vincular este televisor",pairHow:"En tu tel\xE9fono, abre el panel de control y aprueba este c\xF3digo:",pairWait:"Esperando aprobaci\xF3n\u2026",pairExpired:"El c\xF3digo caduc\xF3. Pulsa A para uno nuevo.",pairDenied:"Se rechaz\xF3 la vinculaci\xF3n. Pulsa A para reintentar.",hints:"Mover: flechas \xB7 A: seguir a alguien \xB7 X: mapa siguiente \xB7 L / R: zoom \xB7 +: men\xFA",hintsRemote:"Mover: flechas \xB7 OK: seguir a alguien \xB7 CH + / \u2212: zoom \xB7 Atr\xE1s dos veces: men\xFA",following:"Siguiendo a",free:"C\xE1mara libre",day:"D\xEDa",agents:"personas",menuMap:"Mapa siguiente",menuZoomIn:"Acercar",menuZoomOut:"Alejar",menuServer:"Cambiar la direcci\xF3n del servidor",menuUnpair:"Desvincular este televisor",hintsPlay:"Mover: stick \xB7 B: correr \xB7 A: hablar \xB7 L / R: zoom \xB7 +: men\xFA",hintsPlayRemote:"Mover: flechas \xB7 OK: hablar \xB7 CH + / \u2212: zoom \xB7 Atr\xE1s: men\xFA",menuPlay:"Jugar",menuWatch:"Mirar el mundo",travelling:"Viajando a {0}\u2026",nobody:"No hay nadie cerca.",metPlayer:"Hay otro jugador aqu\xED.",worldFull:"El mundo est\xE1 lleno ahora mismo.",noGl:"Esta pantalla no puede mostrar 3D.",actIdle:"De pie",actWander:"Paseando",actDrink:"Va a beber",actEat:"Comiendo",actForage:"Busca comida",actSleep:"Durmiendo",actTalk:"Hablando",actTravel:"De viaje",actRest:"Descansando",actFlee:"Huyendo",actGo:"Va hacia alguien",actGather:"Recogiendo",actBuild:"Construyendo",inTransit:"de viaje"},ar:{connecting:"\u062C\u0627\u0631\u064D \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0639\u0627\u0644\u0645\u2026",offline:"\u062E\u0627\u062F\u0645 \u0627\u0644\u0639\u0627\u0644\u0645 \u0644\u0627 \u064A\u0633\u062A\u062C\u064A\u0628. \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629\u2026",noServer:"\u0644\u0627 \u064A\u0648\u062C\u062F \u0639\u0646\u0648\u0627\u0646 \u062E\u0627\u062F\u0645 \u0628\u0639\u062F.",enterServer:"\u0627\u0636\u063A\u0637 A \u0644\u0643\u062A\u0627\u0628\u0629 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",serverLabel:"\u0639\u0646\u0648\u0627\u0646 \u062E\u0627\u062F\u0645 \u0627\u0644\u0639\u0627\u0644\u0645",pairTitle:"\u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",pairHow:"\u0639\u0644\u0649 \u0647\u0627\u062A\u0641\u0643\u060C \u0627\u0641\u062A\u062D \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0648\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0631\u0645\u0632:",pairWait:"\u0641\u064A \u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629\u2026",pairExpired:"\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0631\u0645\u0632. \u0627\u0636\u063A\u0637 A \u0644\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0631\u0645\u0632 \u062C\u062F\u064A\u062F.",pairDenied:"\u062A\u0645 \u0631\u0641\u0636 \u0627\u0644\u0631\u0628\u0637. \u0627\u0636\u063A\u0637 A \u0644\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.",hints:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 A: \u062A\u062A\u0628\u0639 \u0634\u062E\u0635 \xB7 X: \u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629 \xB7 L / R: \u062A\u0643\u0628\u064A\u0631 \xB7 +: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",hintsRemote:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 OK: \u062A\u062A\u0628\u0639 \u0634\u062E\u0635 \xB7 CH + / \u2212: \u062A\u0643\u0628\u064A\u0631 \xB7 \u0631\u062C\u0648\u0639 \u0645\u0631\u062A\u064A\u0646: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",following:"\u062A\u062A\u0628\u0639",free:"\u0643\u0627\u0645\u064A\u0631\u0627 \u062D\u0631\u0629",day:"\u0627\u0644\u064A\u0648\u0645",agents:"\u0623\u0634\u062E\u0627\u0635",menuMap:"\u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629",menuZoomIn:"\u062A\u0643\u0628\u064A\u0631",menuZoomOut:"\u062A\u0635\u063A\u064A\u0631",menuServer:"\u062A\u063A\u064A\u064A\u0631 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062E\u0627\u062F\u0645",menuUnpair:"\u0625\u0644\u063A\u0627\u0621 \u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062A\u0644\u0641\u0627\u0632",hintsPlay:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0639\u0635\u0627 \xB7 B: \u0627\u0644\u062C\u0631\u064A \xB7 A: \u0627\u0644\u062A\u062D\u062F\u062B \xB7 L / R: \u062A\u0643\u0628\u064A\u0631 \xB7 +: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",hintsPlayRemote:"\u0627\u0644\u062A\u062D\u0631\u064A\u0643: \u0627\u0644\u0623\u0633\u0647\u0645 \xB7 OK: \u0627\u0644\u062A\u062D\u062F\u062B \xB7 CH + / \u2212: \u062A\u0643\u0628\u064A\u0631 \xB7 \u0631\u062C\u0648\u0639: \u0627\u0644\u0642\u0627\u0626\u0645\u0629",menuPlay:"\u0627\u0644\u0639\u0628",menuWatch:"\u0634\u0627\u0647\u062F \u0627\u0644\u0639\u0627\u0644\u0645",travelling:"\u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642 \u0625\u0644\u0649 {0}\u2026",nobody:"\u0644\u0627 \u0623\u062D\u062F \u0628\u0627\u0644\u0642\u0631\u0628.",metPlayer:"\u0644\u0627\u0639\u0628 \u0622\u062E\u0631 \u0647\u0646\u0627.",worldFull:"\u0627\u0644\u0639\u0627\u0644\u0645 \u0645\u0645\u062A\u0644\u0626 \u0627\u0644\u0622\u0646.",noGl:"\u0647\u0630\u0647 \u0627\u0644\u0634\u0627\u0634\u0629 \u0644\u0627 \u062A\u0633\u062A\u0637\u064A\u0639 \u0639\u0631\u0636 \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F.",actIdle:"\u0648\u0627\u0642\u0641",actWander:"\u064A\u062A\u062C\u0648\u0644",actDrink:"\u064A\u0630\u0647\u0628 \u0644\u064A\u0634\u0631\u0628",actEat:"\u064A\u0623\u0643\u0644",actForage:"\u064A\u0628\u062D\u062B \u0639\u0646 \u0637\u0639\u0627\u0645",actSleep:"\u0646\u0627\u0626\u0645",actTalk:"\u064A\u062A\u062D\u062F\u062B",actTravel:"\u0645\u0633\u0627\u0641\u0631",actRest:"\u064A\u0633\u062A\u0631\u064A\u062D",actFlee:"\u064A\u0647\u0631\u0628",actGo:"\u064A\u0630\u0647\u0628 \u0625\u0644\u0649 \u0634\u062E\u0635",actGather:"\u064A\u062C\u0645\u0639",actBuild:"\u064A\u0628\u0646\u064A",inTransit:"\u0641\u064A \u0633\u0641\u0631"}},gi="en";function pp(i){gi=i in Pu?i:"en"}function Iu(){return gi}function A(i){let e=Pu[gi],t=wu[gi],n=Su[gi],s=Au[gi],r=Tu[gi],a=Eu[gi],o=Cu[gi],l=Ru[gi];return e[i]??t[i]??n[i]??s[i]??r[i]??a[i]??o[i]??l[i]??Pu.en[i]??wu.en[i]??Su.en[i]??Au.en[i]??Tu.en[i]??Eu.en[i]??Cu.en[i]??Ru.en[i]??i}function se(i,...e){return A(i).replace(/\{(\d)\}/g,(t,n)=>e[Number(n)]??"")}var vp=new Map,dl=null,mp=null,Lu=!1;function gp(i){let e=atob(i),t=new Uint8Array(e.length);for(let n=0;n<e.length;n++)t[n]=e.charCodeAt(n);return t}function vb(i){let e=new Int16Array(gp(i.p).buffer),t=gp(i.c),n=new Float32Array(e.length),s=new Float32Array(t.length);for(let a=0;a<e.length;a++)n[a]=e[a]*i.s;for(let a=0;a<t.length;a++){let o=t[a]/255;s[a]=o<=.04045?o/12.92:Math.pow((o+.055)/1.055,2.4)}let r=new nn;return r.setAttribute("position",new st(n,3)),r.setAttribute("color",new st(s,3)),r.computeVertexNormals(),r}function xp(){return mp??=(async()=>{try{let[i,e]=await Promise.all([fetch("models/items.json").then(t=>t.json()),fetch("icons/items.json").then(t=>t.json())]);for(let[t,n]of Object.entries(i))vp.set(t,vb(n));dl=e,Lu=!0}catch{}})(),mp}var yp=i=>vp.get(i);function fl(i,e){let t=dl,n=t?t.ids.indexOf(i):-1;if(!t||n<0)return"";let s=Math.ceil(t.ids.length/t.cols),r=n%t.cols*e,a=Math.floor(n/t.cols)*e;return`background-image:url(icons/items.png);background-size:${t.cols*e}px ${s*e}px;background-position:-${r}px -${a}px`}var Du=i=>!!dl&&dl.ids.includes(i);var xb=1.25,Pa=[new le(1,1,1),new le(.95,1.08,.95),new le(.88,.97,1.18),new le(1.06,.86,1.22),new le(1.35,1.08,.55)],yb=[new le(0),new le(0),new le(2780159),new le(10173695),new le(16753434)],_b=new le(8357779),bb=new le(9132597),Mb=["","sword","axe","spear","bow"],_p=["sword","axe","spear","bow","hammer","sledge","helmet","pads"],wb={sword:1,axe:.75,spear:1.75,bow:.55,hammer:.55,sledge:.85},Hi=i=>i*i*(3-2*i),Fr=class{constructor(e,t,n){this.scene=e;this.shadows=n;this.cap=t,this.gcap=Math.min(t,160);let s=()=>new dn({color:16777215}),r=(a,o,l,h)=>{let c=new jn(a,o,l);return c.instanceMatrix.setUsage(zi),c.count=0,c.frustumCulled=!1,c.castShadow=h&&n,e.add(c),c};this.body=r(new sn(.17,.24,.6,10).translate(0,.8,0),s(),t,!0),this.head=r(new ei(.17,14,10).translate(0,1.3,0),s(),t,!0),this.hair=r(new ei(.182,14,6,0,Math.PI*2,0,Math.PI*.55).translate(0,1.33,-.015),s(),t,!0),this.legs=r(new sn(.075,.065,.5,6).translate(0,-.25,0),s(),t*2,!0),this.arms=r(new sn(.06,.05,.44,6).translate(0,-.22,0),s(),t*2,!0),this.blob=n?null:r(new pi(.38,16).rotateX(-Math.PI/2),new Qt({color:0,transparent:!0,opacity:.28,depthWrite:!1}),t,!1),this.mark=r(new nl(.12,0).scale(1,1.6,1),new Qt({color:16777215}),64,!1),this.glow=r(new Qn(1,1),new Qt({color:16777215,transparent:!0,opacity:.32,blending:Ds,depthWrite:!1}),this.gcap,!1);for(let a of[this.body,this.head,this.hair,this.legs,this.arms,this.mark,this.glow])a.setColorAt(0,new le)}scene;shadows;body;head;hair;legs;arms;blob;mark;glow;gear={};gn={sword:0,axe:0,spear:0,bow:0,hammer:0,sledge:0,helmet:0,pads:0};nGlow=0;n=0;nm=0;base=new Ge;m=new Ge;part=new Ge;hand=new Ge;lhand=new Ge;hm=new Ge;q=new ln;e=new $t;v=new D;s=new D;cap;gcap;tmpC=new le;model(e){let t=this.gear[e];if(t)return t;if(!Lu)return null;let n=yp(e);if(!n)return null;let s=new jn(n,new dn({vertexColors:!0}),this.gcap);return s.instanceMatrix.setUsage(zi),s.count=0,s.frustumCulled=!1,s.castShadow=this.shadows,s.setColorAt(0,new le),this.scene.add(s),this.gear[e]=s}begin(){this.n=0,this.nm=0,this.nGlow=0;for(let e of _p)this.gn[e]=0}add(e,t,n,s,r,a,o,l=1,h=!1,c=0,u=0){if(this.n>=this.cap)return;let d=this.n++,m=o?0:c>>15&7,g=0,v=.12,p=0,f=.12,w=0,S=0,x=0,I=!1;if(m===1){let N=u%.55/.55;g=N<.45?-.3-2.4*Hi(N/.45):-2.7+2.2*Hi((N-.45)/.55),p=-.6,w=N<.45?.3*Hi(N/.45):.3-.65*Hi((N-.45)/.55),S=N<.45?0:.12,I=!0}else if(m===2){let N=u%.85/.85;g=p=-1.25,v=.35,f=-.25,w=N<.55?.75*Hi(N/.55):.75-1.15*Hi((N-.55)/.45),S=.08,I=!0}else if(m===3){let N=u%.9/.9;g=p=N<.5?-.5-2.4*Hi(N/.5):-2.9+2.25*Hi((N-.5)/.5),v=.25,f=-.25,S=N<.5?-.05:.22,I=!0}else if(m===4){let N=u%.42/.42;g=-.8-.75*Math.sin(N*Math.PI),p=-1,f=-.15,S=.25,I=!0}else if(m===5)g=-.45-.35*(.5+.5*Math.sin(u*5.2)),v=.35,p=-.2-.25*(.5+.5*Math.sin(u*3.7+1)),f=.25,x=.12*Math.sin(u*7.5),I=!0;else if(m===6){let N=Math.min(1,u/.9);p=-1.55,f=-.05,g=-1.5,v=N<.7?-.15-.35*Hi(N/.7):-.1,w=.25,I=!0}else if(m===7){let N=Math.min(1,u/.6);g=-.9*Math.sin(N*Math.PI),S=.3*Math.sin(N*Math.PI),I=!0}let R=Math.abs(Math.sin(s))*.05*r*l,T=xb*l;this.base.compose(this.v.set(e,R,t),this.q.setFromEuler(this.e.set(0,n+w,0)),this.s.set(T,T,T)),o&&(this.part.compose(this.v.set(0,.2,-.55),this.q.setFromEuler(this.e.set(Math.PI/2,0,0)),this.s.set(1,1,1)),this.base.multiply(this.part)),this.hm.copy(this.base),S&&(this.part.compose(this.v.set(0,.5,0),this.q.setFromEuler(this.e.set(S,0,0)),this.s.set(1,1,1)),this.m.makeTranslation(0,-.5,0),this.part.multiply(this.m),this.hm.multiply(this.part));let C=c>>10&3,y=c>>12&7,_=C===2?this.tmpC.copy(_b).lerp(a.tunic,.25):C===1?this.tmpC.copy(bb).lerp(a.tunic,.35):a.tunic;this.body.setMatrixAt(d,this.hm),this.body.setColorAt(d,_),x?(this.part.compose(this.v.set(0,1.15,0),this.q.setFromEuler(this.e.set(x,0,0)),this.s.set(1,1,1)),this.m.makeTranslation(0,-1.15,0),this.part.multiply(this.m),this.m.multiplyMatrices(this.hm,this.part)):this.m.copy(this.hm),this.head.setMatrixAt(d,this.m),this.head.setColorAt(d,a.skin),this.hair.setMatrixAt(d,this.m),this.hair.setColorAt(d,a.hair),c>>6&1&&this.wear("helmet",this.m,0,1.36,0,1.02,c>>7&7),C===2&&this.wear("pads",this.hm,0,1.1,0,1,y);let L=Math.sin(s)*.7*r;for(let N=0;N<2;N++){let P=N?1:-1;this.part.compose(this.v.set(P*.1,.52,0),this.q.setFromEuler(this.e.set(L*P,0,0)),this.s.set(1,1,1)),this.m.multiplyMatrices(this.base,this.part),this.legs.setMatrixAt(d*2+N,this.m),this.legs.setColorAt(d*2+N,a.pants);let F=h?this.e.set(-1.35+L*P*.15,0,P*.05):I?N?this.e.set(p,0,-f*P):this.e.set(g,0,-v*P):this.e.set(-L*P*.8,0,P*.12);this.part.compose(this.v.set(P*.25,1.07,0),this.q.setFromEuler(F),this.s.set(1,1,1)),this.m.multiplyMatrices(this.hm,this.part),this.arms.setMatrixAt(d*2+N,this.m),this.arms.setColorAt(d*2+N,_),(N===0?this.hand:this.lhand).copy(this.m)}if(!o&&!h){let N=Mb[c&7]??"",P=c>>3&7,F=m===2?"axe":m===3?"sledge":m===4?"hammer":m===6?"bow":N;if(F==="bow"?this.holdIn("bow",this.lhand,N==="bow"?P:0):F&&this.holdIn(F,this.hand,F===N?P:0),c>>22&1&&F!=="bow"){let H=this.model("bow");if(H&&this.gn.bow<this.gcap){this.part.compose(this.v.set(.02,.92,-.24),this.q.setFromEuler(this.e.set(0,Math.PI/2,.55)),this.s.set(.85,.85,.85)),this.m.multiplyMatrices(this.hm,this.part);let O=this.gn.bow++;H.setMatrixAt(O,this.m),H.setColorAt(O,Pa[0])}}}this.blob&&(this.m.makeTranslation(e,.03,t),this.blob.setMatrixAt(d,this.m))}holdIn(e,t,n){let s=this.model(e);if(!s||this.gn[e]>=this.gcap)return;this.part.compose(this.v.set(0,-.4,.02),this.q.setFromEuler(this.e.set(Math.PI/2,0,0)),this.s.set(.8,.8,.8)),e==="spear"&&this.part.multiply(this.m.makeTranslation(0,-.55,0)),this.m.multiplyMatrices(t,this.part);let r=this.gn[e]++;if(s.setMatrixAt(r,this.m),s.setColorAt(r,Pa[n]??Pa[0]),n>=2&&this.nGlow<this.gcap){let a=wb[e]??.6,o=1+.08*Math.sin(performance.now()/180);this.part.compose(this.v.set(0,e==="bow"?0:a*.62,0),this.q.identity(),this.s.set(.1*o,a*.45*o,.1*o)),this.m.multiply(this.part);let l=this.nGlow++;this.glow.setMatrixAt(l,this.m),this.glow.setColorAt(l,yb[n])}}wear(e,t,n,s,r,a,o){let l=this.model(e);if(!l||this.gn[e]>=this.gcap)return;this.part.compose(this.v.set(n,s,r),this.q.identity(),this.s.set(a,a,a)),this.m.multiplyMatrices(t,this.part);let h=this.gn[e]++;l.setMatrixAt(h,this.m),l.setColorAt(h,Pa[o]??Pa[0])}marker(e,t,n,s){if(this.nm>=64)return;let r=this.nm++;this.m.compose(this.v.set(e,2.15+Math.sin(n*3)*.08,t),this.q.setFromEuler(this.e.set(0,n*2,0)),this.s.set(1,1,1)),this.mark.setMatrixAt(r,this.m),this.mark.setColorAt(r,s)}end(){let e=this.n;for(let t of[this.body,this.head,this.hair])t.count=e,Ia(t);for(let t of[this.legs,this.arms])t.count=e*2,Ia(t);this.blob&&(this.blob.count=e,this.blob.instanceMatrix.needsUpdate=!0),this.mark.count=this.nm,Ia(this.mark),this.glow.count=this.nGlow,Ia(this.glow);for(let t of _p){let n=this.gear[t];n&&(n.count=this.gn[t],Ia(n))}}};function Ia(i){i.instanceMatrix.needsUpdate=!0,i.instanceColor&&(i.instanceColor.needsUpdate=!0)}var Nu=[{len:.32,h:.2,wide:.2,head:.12,leg:.08,ear:.16,earUp:1,tail:.06,body:11772042,headC:12101264,earC:13219488},{len:.9,h:.42,wide:.32,head:.17,leg:.62,ear:.3,earUp:.5,tail:.07,body:10514495,headC:10119738,earC:7031338},{len:.78,h:.42,wide:.4,head:.2,leg:.3,ear:.1,earUp:.6,tail:.04,body:5193008,headC:4667179,earC:15129798},{len:.75,h:.32,wide:.26,head:.16,leg:.42,ear:.13,earUp:1,tail:.12,body:8224128,headC:9079438,earC:5921374},{len:1.25,h:.62,wide:.66,head:.3,leg:.48,ear:.1,earUp:1,tail:.06,body:4862756,headC:5388841,earC:3811356}],pl=class{constructor(e,t,n){this.cap=t;let s=(r,a)=>{let o=new jn(r,new dn({color:16777215,flatShading:!0}),a);return o.instanceMatrix.setUsage(zi),o.count=0,o.frustumCulled=!1,o.castShadow=n,o.setColorAt(0,new le),e.add(o),o};this.body=s(new ei(.5,10,7),t),this.head=s(new ei(.5,9,6),t),this.legs=s(new sn(.5,.4,1,5).translate(0,-.5,0),t*4),this.ears=s(new mi(.5,1,4).translate(0,.5,0),t*2),this.tail=s(new ei(.5,6,4),t),this.cols=Nu.map(r=>({body:new le(r.body),head:new le(r.headC),ear:new le(r.earC)}))}cap;body;head;legs;ears;tail;n=0;base=new Ge;m=new Ge;part=new Ge;q=new ln;e=new $t;v=new D;s=new D;cols;begin(){this.n=0}add(e,t,n,s,r,a){if(this.n>=this.cap)return;let o=Nu[e]??Nu[0],l=this.cols[e]??this.cols[0],h=this.n++,c=e===0?Math.abs(Math.sin(r))*.12*a:Math.abs(Math.sin(r*2))*.03*a,u=o.leg+o.h/2+c;this.base.compose(this.v.set(t,0,n),this.q.setFromEuler(this.e.set(0,s,0)),this.s.set(1.35,1.35,1.35));let d=(p,f,w,S,x,I,R,T,C,y,_,L)=>{this.part.compose(this.v.set(w,S,x),this.q.setFromEuler(this.e.set(I,R,T)),this.s.set(C,y,_)),this.m.multiplyMatrices(this.base,this.part),p.setMatrixAt(f,this.m),p.setColorAt(f,L)};d(this.body,h,0,u,0,0,0,0,o.wide,o.h,o.len,l.body);let m=o.len/2+o.head*.55,g=u+o.h*.35;d(this.head,h,0,g,m,0,0,0,o.head*1.6,o.head*1.5,o.head*(e===2?2.4:2),l.head),d(this.tail,h,0,u+o.h*.2,-o.len/2,.6,0,0,o.tail*1.2,o.tail,o.tail*(e===3?4:1.4),l.ear);let v=Math.sin(r)*.35*a;for(let p=0;p<4;p++){let f=p&1?1:-1,w=p<2?1:-1;d(this.legs,h*4+p,f*o.wide*.3,o.leg+.02,w*o.len*.3,v*f*w,0,0,o.wide*.22+.02,o.leg+.02,o.wide*.22+.02,l.body)}for(let p=0;p<2;p++){let f=p?1:-1;e===2?d(this.ears,h*2+p,f*o.head*.5,g-o.head*.3,m+o.head*.9,1.3,0,-f*.3,.04,o.ear,.04,l.ear):d(this.ears,h*2+p,f*o.head*.45,g+o.head*.55,m-o.head*.1,-.2*o.earUp,0,f*(e===1?.6:.25),o.ear*(e===1?.18:.45),o.ear,o.ear*.25,l.ear)}}end(){let e=this.n;for(let[t,n]of[[this.body,1],[this.head,1],[this.tail,1],[this.legs,4],[this.ears,2]])t.count=e*n,t.instanceMatrix.needsUpdate=!0,t.instanceColor&&(t.instanceColor.needsUpdate=!0)}};var bp=58*Math.PI/180,ml=class{renderer;scene=new Lr;camera=new jt(30,16/9,1,400);people;hemi=new Nr(13624319,6114362,1.1);sun=new Bs(16773590,2.4);lamp=new al(16761466,0,14,1.6);fog;bg=new le(10274792);chunks=new Jn;water;under;portals=new Jn;shots;nShots=0;cans;bushes;berries;crates;nCan=0;nBush=0;nCrate=0;q=new ln;eu=new $t;v3=new D;s3=new D;groundMat=new dn({vertexColors:!0});propMat=new dn({vertexColors:!0});glowMat=new Qt({vertexColors:!0});poolMat=new Qt({vertexColors:!0,transparent:!0,opacity:0,blending:Ds,depthWrite:!1,side:Fn});animals;target=new D;look=new D;dist=24;view="top";yaw=0;back=7;viewSet="";tier;m=new Ge;shadowR=30;constructor(e,t){this.tier=t,this.renderer=new Ir({canvas:e,antialias:t==="high",powerPreference:"high-performance",stencil:!1}),this.renderer.setPixelRatio(1),this.renderer.toneMapping=Ea,this.renderer.toneMappingExposure=1.05;let n=t!=="low";if(n){this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=t==="high"?uu:ol,this.sun.castShadow=!0;let r=t==="high"?2048:1024;this.sun.shadow.mapSize.set(r,r),this.sun.shadow.bias=-6e-4,this.sun.shadow.normalBias=.03,this.sun.shadow.camera.near=1,this.sun.shadow.camera.far=120}this.scene.background=this.bg,this.fog=new Qo(this.bg,60,160),this.scene.fog=this.fog,this.scene.add(this.hemi,this.sun,this.sun.target,this.lamp,this.chunks,this.portals),this.under=new Mt(new cs(4e3,4e3).rotateX(-Math.PI/2),new dn({color:3033642})),this.under.position.y=-.8,this.scene.add(this.under),this.water=new Mt(new cs(1,1).rotateX(-Math.PI/2),new il({color:3114672,transparent:!0,opacity:.72,shininess:90,specular:10474736})),this.water.position.y=-.14,this.water.receiveShadow=n,this.scene.add(this.water),this.people=new Fr(this.scene,512,n),this.animals=new pl(this.scene,128,n),this.shots=new jn(new ei(.07,6,4),new Qt({color:16773536}),256),this.shots.instanceMatrix.setUsage(zi),this.shots.count=0,this.shots.frustumCulled=!1,this.scene.add(this.shots);let s=(r,a,o)=>{let l=new jn(r,new dn({color:a,flatShading:!0}),o);return l.instanceMatrix.setUsage(zi),l.count=0,l.frustumCulled=!1,l.castShadow=n,this.scene.add(l),l};this.cans=s(new sn(.09,.09,.17,10).translate(0,.085,0),12866111,256),this.bushes=s(new Qn(.52,1).scale(1,.8,1).translate(0,.38,0),4161335,256),this.berries=s(new Qn(.075,0),14688314,256*6),this.crates=s(new sn(.2,.2,.3,4).rotateY(Math.PI/4).translate(0,.15,0),10122312,128)}aimLine=null;aimRing=null;aim(e,t=0,n=0,s=0,r=20,a=NaN,o=NaN){if(!e){this.aimLine&&(this.aimLine.visible=!1),this.aimRing&&(this.aimRing.visible=!1);return}if(!this.aimLine){let h=new Qt({color:16769146,transparent:!0,opacity:.75,depthWrite:!1});this.aimLine=new Mt(new cs(1,.09).rotateX(-Math.PI/2).translate(.5,0,0),h),this.aimRing=new Mt(new Aa(.55,.06,6,24).rotateX(-Math.PI/2),new Qt({color:16734780,depthWrite:!1})),this.aimLine.renderOrder=this.aimRing.renderOrder=5,this.scene.add(this.aimLine,this.aimRing)}this.aimLine.visible=!0,this.aimLine.position.set(t+Math.cos(s)*.5,.06,n+Math.sin(s)*.5),this.aimLine.rotation.set(0,-s,0),this.aimLine.scale.set(r,1,1);let l=Number.isFinite(a);this.aimRing.visible=l,l&&this.aimRing.position.set(a,.08,o)}ghostBox=null;ghostArrow=null;ghost(e,t=!0,n=null){if(!e){this.ghostBox&&(this.ghostBox.visible=!1),this.ghostArrow&&(this.ghostArrow.visible=!1);return}this.ghostBox||(this.ghostBox=new jn(new Oi(1,1,1),new Qt({color:8188058,transparent:!0,opacity:.42,depthWrite:!1}),40),this.ghostBox.instanceMatrix.setUsage(zi),this.ghostBox.frustumCulled=!1,this.ghostBox.renderOrder=6,this.ghostArrow=new Mt(new mi(.42,.9,3).rotateX(Math.PI/2).rotateY(Math.PI/2),new Qt({color:16765786,transparent:!0,opacity:.9,depthWrite:!1})),this.ghostArrow.renderOrder=7,this.scene.add(this.ghostBox,this.ghostArrow));let s=this.ghostBox,r=Math.min(40,e.length/3|0);s.material.color.setHex(t?8188058:16734794);for(let o=0;o<r;o++){let l=Math.max(.06,e[o*3+2]);this.v3.set(e[o*3]+.5,l/2+.01,e[o*3+1]+.5),this.s3.set(.96,l,.96),this.q.identity(),this.m.compose(this.v3,this.q,this.s3),s.setMatrixAt(o,this.m)}s.count=r,s.instanceMatrix.needsUpdate=!0,s.visible=!0;let a=this.ghostArrow;a.visible=!!n,n&&(a.position.set(n[0],.35,n[1]),a.rotation.set(0,-n[2],0))}beginItems(){this.nCan=this.nBush=this.nCrate=0}item(e,t,n,s){let r=(s*2654435761>>>0)/4294967296;if(this.m.compose(this.v3.set(e,0,t),this.q.setFromEuler(this.eu.set(0,r*6.28,0)),this.s3.set(1,1,1)),n===1&&this.nCan<256)this.cans.setMatrixAt(this.nCan++,this.m);else if(n===2&&this.nBush<256){let a=this.nBush++;this.bushes.setMatrixAt(a,this.m);for(let o=0;o<6;o++){let l=r*6.28+o*1.05;this.m.makeTranslation(e+Math.cos(l)*.43,.32+o%3*.14,t+Math.sin(l)*.43),this.berries.setMatrixAt(a*6+o,this.m)}}else this.nCrate<128&&this.crates.setMatrixAt(this.nCrate++,this.m)}endItems(){this.cans.count=this.nCan,this.bushes.count=this.nBush,this.berries.count=this.nBush*6,this.crates.count=this.nCrate;for(let e of[this.cans,this.bushes,this.berries,this.crates])e.instanceMatrix.needsUpdate=!0}setMap(e,t,n){this.clearChunks(),this.water.scale.set(e,1,t),this.water.position.set(e/2,-.14,t/2);for(let s of this.portals.children.slice())this.portals.remove(s),Ab(s);for(let s of n)this.portals.add(Sb(s.x,s.y))}addChunk(e,t,n=null,s=null){let r=new Jn,a=new Mt(e,this.groundMat);if(a.receiveShadow=this.tier!=="low",r.add(a),t){let o=new Mt(t,this.propMat);o.castShadow=o.receiveShadow=this.tier!=="low",r.add(o)}if(n&&r.add(new Mt(n,this.glowMat)),s){let o=new Mt(s,this.poolMat);o.renderOrder=2,r.add(o)}return this.chunks.add(r),r}removeChunk(e){this.chunks.remove(e);for(let t of e.children)t.geometry.dispose()}clearChunks(){for(let e of this.chunks.children.slice())this.removeChunk(e)}beginShots(){this.nShots=0}shot(e,t){this.nShots>=256||(this.m.makeTranslation(e,1,t),this.shots.setMatrixAt(this.nShots++,this.m))}endShots(){this.shots.count=this.nShots,this.shots.instanceMatrix.needsUpdate=!0}resize(e,t){this.renderer.setSize(e,t,!1),this.camera.aspect=e/t,this.camera.updateProjectionMatrix()}pv=new D;project(e,t,n,s){let r=this.pv.set(e,t,n).project(this.camera);return r.z>1||r.x<-1.1||r.x>1.1||r.y<-1.1||r.y>1.1?!1:(s.x=(r.x+1)/2*innerWidth,s.y=(1-r.y)/2*innerHeight,!0)}get sight(){return(this.tier==="low"?42:this.tier==="mid"?52:64)*this.distK}distK=1;fogK=1;fogAt(e,t){if(!this.fogK){this.fog.near=1e5,this.fog.far=1e6;return}this.fog.near=e*this.fogK,this.fog.far=t*this.fogK}settingsChanged(){this.viewSet=""}follow(e,t,n,s){this.target.set(e,0,t);let r=s?1:1-Math.exp(-n*(this.view==="top"?6:14));this.look.x+=(e-this.look.x)*r,this.look.z+=(t-this.look.z)*r;let a=this.dist;if(this.view!==this.viewSet){this.viewSet=this.view;let d=this.camera;this.view==="top"?(d.fov=30,d.near=1,d.far=400):(d.fov=this.view==="first"?62:55,d.near=.12,d.far=this.sight*(this.fogK?Math.max(1,this.fogK):1.6)+6),d.updateProjectionMatrix()}let o=this.look.x,l=this.look.z;if(this.view==="top")this.camera.position.set(this.look.x,Math.sin(bp)*a,this.look.z+Math.cos(bp)*a),this.camera.lookAt(this.look.x,0,this.look.z),this.fogAt(a*1.6*this.distK,a*3.6*this.distK);else{let d=Math.sin(this.yaw),m=-Math.cos(this.yaw);if(this.view==="third"){let g=this.back;this.camera.position.set(this.look.x-d*g,1.4+g*.42,this.look.z-m*g),this.camera.lookAt(this.look.x+d*3,1.1,this.look.z+m*3)}else this.camera.position.set(this.look.x+d*.18,1.55,this.look.z+m*.18),this.camera.lookAt(this.look.x+d*10,.9,this.look.z+m*10);this.fogAt(this.sight*.35,this.sight),a=this.sight*.4,o=this.look.x+d*a*.8,l=this.look.z+m*a*.8}if(this.sun.castShadow){let d=this.shadowR=Math.min(60,a*1.15+6),m=this.sun.shadow.camera;m.right!==d&&(m.left=-d,m.right=d,m.top=d,m.bottom=-d,m.updateProjectionMatrix())}let h=this.shadowR*2/this.sun.shadow.mapSize.x,c=Math.round(o/h)*h,u=Math.round(l/h)*h;this.sun.target.position.set(c,0,u),this.sun.position.set(c+this.sunDir.x*50,this.sunDir.y*50,u+this.sunDir.z*50),this.lamp.position.set(e,2.2,t)}sunDir=new D(.4,.8,.45).normalize();c1=new le;c2=new le;setHour(e,t){let n=e<5||e>21?0:e<8?(e-5)/3:e>18?(21-e)/3:1,s=n>0&&n<1?Math.sin(n*Math.PI):0,r=(e-6)/12*Math.PI;n>0?this.sunDir.set(-Math.cos(r)*.8,Math.max(.5,Math.sin(r)),.55).normalize():this.sunDir.set(.3,.8,.4).normalize(),this.sun.intensity=n>0?.5+2*n:.45,this.sun.color.setHex(9349375).lerp(this.c1.setHex(16773590),n).lerp(this.c2.setHex(16752736),s*.7),this.hemi.intensity=(.35+.8*n)*(this.view==="top"?1:1.5),this.hemi.color.setHex(3162218).lerp(this.c1.setHex(13624319),n),this.hemi.groundColor.setHex(1841698).lerp(this.c1.setHex(6114362),n),this.bg.setHex(726054).lerp(this.c1.setHex(10274792),n).lerp(this.c2.setHex(15178346),s*.6),this.lamp.intensity=(1-n)*9,this.poolMat.opacity=(1-n)*.42,this.poolMat.visible=n<.98;let a=1+Math.sin(t*2.5)*.06;for(let o of this.portals.children)o.children[0].rotation.y=t*.8,o.children[1].scale.set(a,1,a)}render(){this.renderer.render(this.scene,this.camera)}dispose(){this.clearChunks(),this.renderer.dispose()}};function Sb(i,e){let t=new Jn;t.position.set(i,0,e);let n=new Mt(new Aa(1.3,.11,8,32),new Qt({color:9433343}));n.position.y=1.4;let s=new Mt(new pi(2,32).rotateX(-Math.PI/2),new Qt({color:5232895,transparent:!0,opacity:.45,blending:Ds,depthWrite:!1,side:Fn}));return s.position.y=.05,t.add(n,s),t}function Ab(i){i.traverse(e=>{let t=e;t.geometry&&t.geometry.dispose()})}var Tb={grass:{shape:0,ground:7776597,top:0,side:0,height:0},dirt:{shape:0,ground:10780248,top:0,side:0,height:0},road:{shape:0,ground:6973282,top:0,side:0,height:0},floor:{shape:0,ground:11569759,top:0,side:0,height:0},sand:{shape:0,ground:14469267,top:0,side:0,height:0},water:{shape:1,ground:5009250,top:0,side:0,height:0},wall:{shape:2,ground:9275262,top:12761258,side:10918797,height:2.3},tree:{shape:3,ground:6197061,top:5215296,side:7031343,height:0},rubble:{shape:4,ground:9471865,top:10195587,side:0,height:0},woodwall:{shape:2,ground:9071176,top:9134649,side:8016946,height:1.7,even:!0,planks:!0},campfire:{shape:5,ground:9271906,top:9407106,side:5978658,height:0},ashes:{shape:6,ground:7301731,top:4012599,side:4863268,height:0},crate:{shape:2,ground:9071176,top:10779208,side:9134649,height:.8,even:!0,planks:!0},farm:{shape:0,ground:7033398,top:0,side:0,height:0},rock:{shape:7,ground:9275262,top:10130572,side:0,height:0},wreck:{shape:8,ground:6973282,top:9063986,side:3881528,height:0},palisade:{shape:9,ground:9071176,top:10186822,side:7228204,height:0},spikes:{shape:10,ground:9071176,top:10517066,side:7228204,height:0},stonewall:{shape:2,ground:9275262,top:11906723,side:10194816,height:1.9,even:!0},door:{shape:11,ground:11569759,top:9134649,side:7031343,height:0},window:{shape:12,ground:9071176,top:9134649,side:8016946,height:1.7},bed:{shape:13,ground:11569759,top:11554876,side:8016946,height:0},lamp:{shape:14,ground:9271906,top:16769162,side:4867136,height:0}};function Mp(i){let e=[];for(let t=0;t<256;t++)e.push({shape:0,ground:7251535,top:0,side:0,height:0});for(let t of i){let n=Tb[t.name];e[t.id]=n?{...n}:t.solid?{shape:2,ground:t.color,top:t.color,side:t.color,height:2}:{shape:0,ground:t.color,top:0,side:0,height:0}}return e}function Dt(i,e){let t=Math.imul(i|0,374761393)+Math.imul(e|0,668265263);return t=Math.imul(t^t>>>13,1274126177),((t^t>>>16)>>>0)/4294967296}function gl(i,e,t){let n=i/t,s=e/t,r=Math.floor(n),a=Math.floor(s),o=n-r,l=s-a;o=o*o*(3-2*o),l=l*l*(3-2*l);let h=Dt(r,a),c=Dt(r+1,a),u=Dt(r,a+1),d=Dt(r+1,a+1);return h+(c-h)*o+(u-h)*l+(h-c-u+d)*o*l}var La=64,Eb=-.55;function Bn(i){let e=i.index?i.toNonIndexed():i;e.computeVertexNormals();let t=e.getAttribute("position").array,n=1/0,s=-1/0;for(let r=1;r<t.length;r+=3)n=Math.min(n,t[r]),s=Math.max(s,t[r]);return{pos:t,nor:e.getAttribute("normal").array,minY:n,maxY:s}}var ku=null;function Cb(){return ku||(ku={trunk:Bn(new sn(.1,.17,1,6,1,!0).translate(0,.5,0)),leaf:Bn(new Qn(1,1)),leafLo:Bn(new Qn(1,0)),rock:Bn(new Qn(1,0)),blade:Bn(new mi(.045,.34,3,1,!0).translate(0,.17,0)),log:Bn(new sn(.06,.06,.62,6,1,!1).rotateZ(Math.PI/2)),flame:Bn(new mi(.16,.5,5,1,!1).translate(0,.25,0)),box:Bn(new Oi(1,1,1).translate(0,.5,0)),spike:Bn(new mi(.5,1,6,1,!1).translate(0,.5,0)),post:Bn(new sn(.5,.5,1,7,1,!1).translate(0,.5,0)),disc:Bn(new pi(1,16).rotateX(-Math.PI/2)),wheel:Bn(new sn(.5,.5,1,8,1,!1).rotateZ(Math.PI/2))}),ku}var ka=class{pos=[];nor=[];col=[];geometry(){if(!this.pos.length)return null;let e=new nn;return e.setAttribute("position",new st(this.pos,3)),e.setAttribute("normal",new st(this.nor,3)),e.setAttribute("color",new st(this.col,3)),e.computeBoundingSphere(),e}},vl=new D,xl=new D,Rb=new Ge,wp=new Ue,Pb=new ln,Ib=new $t,Lb=new D,Db=new D,AS=new le;function Ye(i,e,t,n,s){wp.getNormalMatrix(t);let r=e.pos,a=e.nor,o=e.maxY-e.minY||1;for(let l=0;l<r.length;l+=3){let h=s+(1-s)*((r[l+1]-e.minY)/o);vl.set(r[l],r[l+1],r[l+2]).applyMatrix4(t),xl.set(a[l],a[l+1],a[l+2]).applyMatrix3(wp).normalize(),i.pos.push(vl.x,vl.y,vl.z),i.nor.push(xl.x,xl.y,xl.z),i.col.push(n.r*h,n.g*h,n.b*h)}}var Uu=[0,.3,.6,.82,1],Sp=[1,.75,.38,.12,0],Fu=20;function Nb(i,e,t,n,s){for(let r=0;r<Uu.length-1;r++){let a=Uu[r]*n,o=Uu[r+1]*n,l=Sp[r],h=Sp[r+1];for(let c=0;c<Fu;c++){let u=c/Fu*Math.PI*2,d=(c+1)/Fu*Math.PI*2,m=Math.cos(u),g=Math.sin(u),v=Math.cos(d),p=Math.sin(d),f=[[a*m,a*g,l],[o*v,o*p,h],[o*m,o*g,h],[a*m,a*g,l],[a*v,a*p,l],[o*v,o*p,h]];for(let[w,S,x]of f)i.pos.push(e+w,.05,t+S),i.nor.push(0,1,0),i.col.push(s.r*x,s.g*x,s.b*x)}}}function Ke(i,e,t,n,s,r,a,o,l){return Rb.compose(Db.set(i,e,t),Pb.setFromEuler(Ib.set(n,s,r)),Lb.set(a,o,l))}function Da(i,e,t,n,s,r,a,o,l,h,c,u,d,m,g,v,p,f,w){let S=[e,t,n,s,r,a,o,l,h,e,t,n,o,l,h,c,u,d],x=[f,f,w,f,w,w];for(let I=0;I<6;I++)i.pos.push(S[I*3],S[I*3+1],S[I*3+2]),i.nor.push(m,g,v),i.col.push(p.r*x[I],p.g*x[I],p.b*x[I])}function Ap(i,e,t){return!i.even&&Dt(e*7+1,t*13+5)<.3?.8+Dt(e,t+99)*1.2:i.height}var pt=(i,e)=>e.setHex(i),kb=new le(11711080),Na=new le;function Tp(i,e,t,n,s){let r=i*32,a=e*32,o=La+1,l=new Float32Array(o*o*3),h=new Float32Array(o*o*3),c=new le,u=new le;for(let x=0;x<o;x++)for(let I=0;I<o;I++){let R=I&1?I-1>>1:(I>>1)-1,T=I&1?R:I>>1,C=x&1?x-1>>1:(x>>1)-1,y=x&1?C:x>>1,_=0,L=0,N=!1,P=!1;u.setRGB(0,0,0);let F=r+I/2,H=a+x/2;for(let G=C;G<=y;G++)for(let ae=R;ae<=T;ae++){let ee=t(ae,G);if(ee<0)continue;let ve=n[ee];if(pt(ve.ground,c),ve.shape===0&&ve.ground===7776597){let Fe=gl(F+300,H,9);c.lerp(kb,Math.max(0,Fe-.45)*1.1)}u.r+=c.r,u.g+=c.g,u.b+=c.b,L+=ve.shape===1?Eb:0,ve.shape===2&&(N=!0),(ve.ground===6973282||ve.ground===11569759||ve.shape===1)&&(P=!0),_++}_||(u.setHex(7251535),_=1);let O=(.9+gl(F,H,3.5)*.18+(Dt(I+r*2,x+a*2)-.5)*.05)*(N?.7:1),Z=(x*o+I)*3;h[Z]=u.r/_*O,h[Z+1]=u.g/_*O,h[Z+2]=u.b/_*O,l[Z]=F,l[Z+2]=H,l[Z+1]=L/_+(P?0:(gl(F,H,2.5)-.5)*.14)}let d=new Uint16Array(La*La*6),m=0;for(let x=0;x<La;x++)for(let I=0;I<La;I++){let R=x*o+I,T=R+1,C=R+o,y=C+1;I+x&1?(d[m++]=R,d[m++]=C,d[m++]=T,d[m++]=T,d[m++]=C,d[m++]=y):(d[m++]=R,d[m++]=C,d[m++]=y,d[m++]=R,d[m++]=y,d[m++]=T)}let g=new nn;g.setAttribute("position",new st(l,3)),g.setAttribute("color",new st(h,3)),g.setIndex(new Rr(d,1)),g.computeVertexNormals(),g.computeBoundingSphere();let v=Cb(),p=new ka,f=new ka,w=new ka,S=s?v.leaf:v.leafLo;for(let x=0;x<32;x++)for(let I=0;I<32;I++){let R=t(I,x),T=n[R],C=r+I,y=a+x,_=Dt(C,y),L=Dt(y+17,C-3),N=Dt(C*3+7,y*5+1);if(T.shape===2){let P=Ap(T,C,y),F=.92+_*.14;pt(T.top,c).multiplyScalar(F);let H=C,O=C+1,Z=y,G=y+1;Da(p,H,P,G,O,P,G,O,P,Z,H,P,Z,0,1,0,c,1,1),pt(T.side,c).multiplyScalar(F);let ae=(ve,Fe)=>{let ht=t(ve,Fe);if(ht<0)return 0;let Y=n[ht];return Y.shape===2?Ap(Y,r+ve,a+Fe):0},ee=ae(I,x+1);ee<P&&Da(p,H,ee,G,O,ee,G,O,P,G,H,P,G,0,0,1,c,ee?.85:.55,1),ee=ae(I,x-1),ee<P&&Da(p,O,ee,Z,H,ee,Z,H,P,Z,O,P,Z,0,0,-1,c,ee?.85:.55,1),ee=ae(I+1,x),ee<P&&Da(p,O,ee,G,O,ee,Z,O,P,Z,O,P,G,1,0,0,c,ee?.85:.55,.95),ee=ae(I-1,x),ee<P&&Da(p,H,ee,Z,H,ee,G,H,P,G,H,P,Z,-1,0,0,c,ee?.85:.55,.95)}else if(T.shape===3){let P=.85+_*.5,F=C+.5+(L-.5)*.3,H=y+.5+(N-.5)*.3,O=.9*P+.3;pt(T.side,c),Ye(p,v.trunk,Ke(F,0,H,0,L*6,0,P,O,P),c,.55),pt(T.top,c),Na.setHex(L<.5?6989898:3963448),c.lerp(Na,N*.7).multiplyScalar(.92+_*.16),Ye(p,S,Ke(F,O+.5*P,H,L,_*6,N,.95*P,.8*P,.95*P),c,.62),c.multiplyScalar(1.08),Ye(p,S,Ke(F+(L-.5)*.5*P,O+1.05*P,H+(N-.5)*.4*P,N,L*6,_,.62*P,.55*P,.62*P),c,.75)}else if(T.shape===5||T.shape===6){let P=C+.5,F=y+.5,H=T.shape===5;for(let O=0;O<7;O++){let Z=O/7*Math.PI*2+_,G=.1+Dt(C+O,y-O)*.05;pt(T.top,c).multiplyScalar(.8+Dt(C*3+O,y)*.3),Ye(p,v.rock,Ke(P+Math.cos(Z)*.34,G*.4,F+Math.sin(Z)*.34,Z,Z*2,0,G,G*.7,G),c,.65)}pt(T.side,c);for(let O=0;O<3;O++)Ye(p,v.log,Ke(P,.07+O*.03,F,0,L*3+O*1.05,H?.25:.05,1,1,1),c,.6);H&&(pt(15895086,c),Ye(f,v.flame,Ke(P,.08,F,0,_*6,0,1,1.15,1),c,.75),pt(16369487,c),Ye(f,v.flame,Ke(P+.04,.1,F-.03,.1,L*6,0,.6,.8,.6),c,.85),pt(16773560,c),Ye(f,v.flame,Ke(P-.02,.1,F+.02,0,N*6,.1,.3,.5,.3),c,1))}else if(T.shape===4)for(let P=0;P<3;P++){let F=Dt(C*5+P,y*3-P),H=Dt(y*7+P,C-P*11);pt(T.top,c).multiplyScalar(.8+F*.35);let O=.16+F*.22;Ye(p,v.rock,Ke(C+.2+H*.6,O*.25,y+.2+F*.6,F*3,H*6,H,O,O*.6,O*.9),c,.6)}else if(T.shape===7)for(let P=0;P<2;P++){let F=Dt(C*3+P,y*7-P),H=Dt(y*5+P,C+P*13);pt(T.top,c).multiplyScalar(.78+F*.3),P===1&&L<.4&&c.lerp(Na.setHex(10512188),.45);let O=P?.28+F*.15:.45+F*.15;Ye(p,v.rock,Ke(C+.3+H*.4,O*.45,y+.3+F*.4,F*3,H*6,H,O,O*.8,O*.95),c,.55)}else if(T.shape===8){let P=(_-.5)*1.2+(C+y&1?Math.PI/2:0),F=(L-.5)*.25,H=C+.5,O=y+.5;Na.setHex([9063986,6253426,8022586,7223856][Math.floor(N*4)]),c.copy(Na).multiplyScalar(.85+_*.2),Ye(p,v.box,Ke(H,.18,O,F,P,F*.6,1.15,.42,.62),c,.6),c.multiplyScalar(.8),Ye(p,v.box,Ke(H+Math.cos(P)*.1,.58,O-Math.sin(P)*.1,F,P,F+.1,.6,.3*(.5+L),.55),c,.7),pt(T.side,c),Ye(p,v.wheel,Ke(H+Math.cos(P)*.4,.17,O-Math.sin(P)*.4+.3,0,P,0,.17,.34,.34),c,.5),_<.6&&Ye(p,v.wheel,Ke(H-Math.cos(P)*.4,.12,O+Math.sin(P)*.4-.3,.4,P,1.2,.17,.3,.3),c,.5)}else if(T.shape===9){for(let P=0;P<3;P++){let F=1.5+Dt(C+P*5,y-P)*.4,H=C+.18+P*.32,O=y+.5+(Dt(C*9+P,y)-.5)*.1;pt(T.side,c).multiplyScalar(.85+Dt(C+P,y*3)*.25),Ye(p,v.post,Ke(H,0,O,0,P,0,.3,F,.3),c,.55),pt(T.top,c),Ye(p,v.spike,Ke(H,F,O,0,P,0,.3,.28,.3),c,.8)}for(let P=0;P<3;P++){let F=y+.2+P*.3,H=C+.5;pt(T.side,c).multiplyScalar(.85+Dt(C+P,y*5)*.25),Ye(p,v.post,Ke(H,0,F,0,P,0,.28,1.4+Dt(C-P,y+P)*.4,.28),c,.55)}}else if(T.shape===10)for(let P=0;P<3;P++){let F=C+.2+P*.3;for(let H of[.5,-.5]){let Z=Math.sin(H)*1.05,G=Math.cos(H)*1.05;pt(T.side,c),Ye(p,v.post,Ke(F,0,y+.5,H,0,0,.12,1.05,.12),c,.6),pt(T.top,c),Ye(p,v.spike,Ke(F,G,y+.5+Z,H,0,0,.12,.32,.12),c,.85)}}else if(T.shape===11)pt(T.side,c),Ye(p,v.box,Ke(C+.06,0,y+.5,0,0,0,.12,1.8,.14),c,.6),Ye(p,v.box,Ke(C+.94,0,y+.5,0,0,0,.12,1.8,.14),c,.6),Ye(p,v.box,Ke(C+.5,1.72,y+.5,0,0,0,1,.12,.16),c,.8),pt(T.top,c),Ye(p,v.box,Ke(C+.12+.3,.02,y+.5+.3,0,-.9,0,.78,1.65,.07),c,.7);else if(T.shape===12)pt(T.side,c),Ye(p,v.box,Ke(C+.5,0,y+.5,0,0,0,1,.8,.92),c,.6),Ye(p,v.box,Ke(C+.06,.8,y+.5,0,0,0,.12,.9,.92),c,.8),Ye(p,v.box,Ke(C+.94,.8,y+.5,0,0,0,.12,.9,.92),c,.8),Ye(p,v.box,Ke(C+.5,1.6,y+.5,0,0,0,1,.12,.92),c,.85),pt(10474728,c),Ye(f,v.box,Ke(C+.5,.8,y+.5,0,0,0,.78,.8,.04),c,1);else if(T.shape===13)pt(T.side,c),Ye(p,v.box,Ke(C+.5,0,y+.5,0,0,0,.72,.28,.96),c,.6),pt(T.top,c),Ye(p,v.box,Ke(C+.5,.28,y+.56,0,0,0,.66,.1,.76),c,.85),pt(15656662,c),Ye(p,v.box,Ke(C+.5,.28,y+.13,0,0,0,.5,.12,.18),c,.9);else if(T.shape===14)pt(T.side,c),Ye(p,v.post,Ke(C+.5,0,y+.5,0,0,0,.1,1.7,.1),c,.6),Ye(p,v.box,Ke(C+.5,1.68,y+.5,0,.6,0,.3,.06,.3),c,.8),pt(T.top,c),Ye(f,v.box,Ke(C+.5,1.45,y+.5,0,.6,0,.2,.24,.2),c,1),pt(16757322,c),Nb(w,C+.5,y+.5,4.2,c);else if(T.shape===0&&T.ground===7776597&&_<.2){let P=C+.2+L*.6,F=y+.2+N*.6;pt(6265413,c).multiplyScalar(.85+L*.3);for(let H=0;H<3;H++)Ye(p,v.blade,Ke(P+(H-1)*.06,0,F+(H*7%3-1)*.05,(N-.5)*.5,H*2.1,(H-1)*.35,1,.7+_*1.5,1),c,.6);_<.05&&(pt(L<.33?15921126:L<.66?15976778:14243402,c),Ye(p,v.rock,Ke(P,.28,F,_,L,N,.06,.05,.06),c,1))}}return{ground:g,props:p.geometry(),glow:f.geometry(),pool:w.geometry()}}var Ua=i=>i.replace(/[&<>"']/g,e=>`&#${e.charCodeAt(0)};`),Ub=new le(16777215),Bu=[.5,1,2,4],Fb=4,Bb=8,Ob=32;function Ou(i,e){let t=Math.floor((i/3600+8)/24)+1,n=Math.floor((i/3600+8)%24),s=Math.floor(i/60%60);return`${e} ${t} ${String(n).padStart(2,"0")}:${String(s).padStart(2,"0")}`}var yl=class{constructor(e,t,n,s,r){this.mapName=t;this.scale=n;this.looks=s;this.zombie=r;this.rec=e;let a=atob(e.frames),o=new Uint8Array(a.length);for(let h=0;h<a.length;h++)o[h]=a.charCodeAt(h);this.data=new Int16Array(o.buffer,0,o.length>>1);for(let h=0;h<this.data.length;h+=1+this.data[h]*7)this.offs.push(h);let l=e.who.length;this.face=new Float32Array(l),this.phase=new Float32Array(l),this.lastX=new Float32Array(l).fill(NaN),this.lastY=new Float32Array(l),this.spd=new Float32Array(l),this.el=document.createElement("div"),this.el.id="replay",document.body.appendChild(this.el),this.centre(0)}mapName;scale;looks;zombie;rec;t=0;playing=!0;speed=1;data;offs=[];face;phase;lastX;lastY;spd;el;html="";cx=0;cy=0;span=10;get length(){return Math.max(0,this.offs.length-1)/this.rec.hz}close(){this.el.remove()}toggle(){this.t>=this.length&&(this.t=0),this.playing=!this.playing}seek(e){this.t=Math.max(0,Math.min(this.length,this.t+e)),this.lastX.fill(NaN)}faster(e){let t=Bu.indexOf(this.speed);this.speed=Bu[Math.max(0,Math.min(Bu.length-1,t+(e?1:-1)))]}update(e){this.playing&&(this.t+=e*this.speed,this.t>=this.length&&(this.t=this.length,this.playing=!1))}rows(e,t){t.clear();let n=this.data,s=this.offs[Math.max(0,Math.min(this.offs.length-1,e))];if(s===void 0)return;let r=n[s];for(let a=0,o=s+1;a<r;a++,o+=7)t.set(n[o],[n[o+1]/10,n[o+2]/10,n[o+3]/5e3,n[o+4],n[o+5],n[o+6]])}a=new Map;b=new Map;centre(e){this.rows(e,this.a);let t=0,n=0,s=0;for(let[r,a]of this.a){let o=this.rec.who[r][1]===2?2:1;t+=a[0]*o,n+=a[1]*o,s+=o}s&&(this.cx=t/s,this.cy=n/s)}draw(e,t,n){let s=this.t*this.rec.hz,r=Math.floor(s),a=s-r;this.rows(r,this.a),this.rows(r+1,this.b);let o=1/0,l=1/0,h=-1/0,c=-1/0;for(let[u,d]of this.a){let m=this.b.get(u)??d,g=this.rec.who[u],v=g[1]===2,p=d[0]+(m[0]-d[0])*a,f=d[1]+(m[1]-d[1])*a,w=this.lastX[u],S=Number.isNaN(w)?0:Math.hypot(p-w,f-this.lastY[u]);S>.004&&(this.face[u]=Math.atan2(p-w,f-this.lastY[u])),this.lastX[u]=p,this.lastY[u]=f;let x=t>0?Math.min(6,S/t):0;this.spd[u]=this.spd[u]+(x-this.spd[u])*Math.min(1,t*10),this.phase[u]=(this.phase[u]+S*4.2)%(Math.PI*2);let I=d[5];e.add(p,f,this.face[u],this.phase[u],Math.min(1,this.spd[u]/(v?1.2:2.2)),v?this.zombie:this.looks(g[0],g[2]),(I&(Fb|Bb))!==0,I&Ob?.62:1,v),v||e.marker(p,f,performance.now()/1e3,Ub),o=Math.min(o,p),h=Math.max(h,p),l=Math.min(l,f),c=Math.max(c,f)}if(o<=h){let u=Math.min(1,t*3);this.cx+=((o+h)/2-this.cx)*u,this.cy+=((l+c)/2-this.cy)*u,this.span+=(Math.max(h-o,(c-l)*1.6)-this.span)*u}this.overlay(r,n)}overlay(e,t){let n=this.rec,s=c=>c>=0?Ua(n.who[c]?.[2]??"?"):"?",r=[];for(let c=n.events.length-1;c>=0&&r.length<4;c--){let[u,d,m,g,v]=n.events[c];if(u>e||e-u>n.hz*6)continue;let p=d==="bite"?se("evBite",s(g),s(m),String(v)):d==="killed"?se("evKilled",s(g),s(m)):d==="death"?se("evDeath",s(m)):d==="fight"?se("evFight",s(m),s(g)):d==="flee"?se("evFlee",s(m),s(g)):`${s(m)}: \u201C${Ua(String(v))}\u201D`;r.unshift(`<div class="re re-${d}">${p}</div>`)}this.rows(e,this.a);let a=[];for(let[c,u]of this.a){let d=n.who[c];d[1]!==2&&a.push(`<span class="rp-p"><b>${Ua(d[2])}</b> ${t(u[3])} \xB7 ${u[4]}</span>`)}let o=c=>`${Math.floor(c/60)}:${String(Math.floor(c%60)).padStart(2,"0")}`,l=this.length?this.t/this.length*100:0,h=`<div class="rp-t">${A("rpTitle")} \xB7 ${Ua(Ou(n.start+this.t*this.scale,A("day")))} \xB7 ${Ua(this.mapName)}</div><div class="rp-bar"><i style="width:${l.toFixed(1)}%"></i></div><div class="rp-s"><span>${this.playing?"\u25B6":"\u275A\u275A"} ${o(this.t)} / ${o(this.length)} \xB7 x${this.speed}</span><span>${A("rpHint")}</span></div><div class="rp-people">${a.join("")}</div><div class="rp-ev">${r.join("")}</div>`;h!==this.html&&(this.html=h,this.el.innerHTML=h)}};var Br=["use","talk","attack","aim","build","run","eat","drink","pickup","sleep","zoomIn","zoomOut","thoughts","person","menu","camera","wheel","attackPerson"],zb={use:"aUse",run:"aRun",eat:"aEat",drink:"aDrink",pickup:"aPickup",sleep:"aSleep",zoomIn:"aZoomIn",zoomOut:"aZoomOut",thoughts:"aThoughts",person:"aPerson",menu:"aMenu",camera:"aCamera",wheel:"aWheel",talk:"aTalk",attack:"aAttack",aim:"aAim",build:"aBuild",attackPerson:"aAttackPerson"},cn=i=>A(zb[i]),Ml=2,Or={pad:{use:0,run:1,attack:2,talk:3,zoomIn:4,zoomOut:5,aim:6,wheel:7,thoughts:8,menu:9,build:10,camera:11},remote:{use:"ok",attack:"red",talk:"green",thoughts:"yellow",person:"blue",zoomIn:"chUp",zoomOut:"chDown",menu:"info",wheel:"playPause",aim:"ff",build:"tools"},v:Ml};function wl(i){return{pad:{...i.pad},remote:{...i.remote},v:i.v}}function Os(i,e){for(let t of Br)if(i.pad[t]===e)return t}function zs(i,e){for(let t of Br)if(i.remote[t]===e)return t}var Hb={ok:"OK",red:"\u{1F534}",green:"\u{1F7E2}",yellow:"\u{1F7E1}",blue:"\u{1F535}",chUp:"CH +",chDown:"CH \u2212",info:"Info",play:"\u25B6",pause:"\u23F8",playPause:"\u23EF",ff:"\u23E9",rew:"\u23EA",next:"\u23ED",prev:"\u23EE",stop:"\u23F9",record:"\u23FA",tools:"Tools",chList:"CH list",guide:"Guide",space:"Space",pageUp:"PgUp",pageDown:"PgDn"},Fa=i=>Hb[i]??(/^\d$/.test(i),i),_l=class{constructor(e,t,n){this.build=e;this.onPick=t;this.onClose=n;this.el=document.createElement("div"),this.el.id="gmenu",this.el.hidden=!0,this.el.setAttribute("role","dialog"),this.titleEl=document.createElement("div"),this.titleEl.className="mt",this.textEl=document.createElement("div"),this.textEl.className="mx",this.listEl=document.createElement("div"),this.listEl.className="ml",this.listEl.setAttribute("role","menu"),this.el.append(this.titleEl,this.textEl,this.listEl),document.body.appendChild(this.el)}build;onPick;onClose;el;titleEl;textEl;listEl;stack=[];rows=[];cur=null;open=!1;sel=0;get page(){return this.stack.length?this.stack[this.stack.length-1].id:""}show(e="root"){this.onSound("ui_open"),this.stack=[{id:e,sel:0}],this.open=!0,this.el.hidden=!1,document.body.classList.add("menu-open"),this.render()}push(e){this.stack.length&&(this.stack[this.stack.length-1].sel=this.sel),this.stack.push({id:e,sel:0}),this.render()}back(){if(this.stack.pop(),!this.stack.length){this.close();return}this.render(this.stack[this.stack.length-1].sel)}close(){this.open=!1,this.el.hidden=!0,document.body.classList.remove("menu-open"),this.stack=[],this.onClose()}refresh(){this.open&&this.render(this.sel)}render(e=0){let t=this.build(this.page);this.cur=t,this.rows=t.rows,this.titleEl.textContent=t.title,this.el.classList.toggle("wide",!!t.wide),this.el.classList.toggle("big",!!t.big),t.html?this.textEl.innerHTML=t.html:this.textEl.textContent=t.text??"",this.textEl.hidden=!t.text&&!t.html,this.listEl.textContent="";for(let n of t.rows){let s=document.createElement("div");s.className="mr"+(n.dim?" dim":""),s.setAttribute("role","menuitem");let r=document.createElement("span");if(r.textContent=n.label+(n.sub?" \u203A":""),s.appendChild(r),n.value!==void 0){let a=document.createElement("span");a.className="mv",a.textContent=n.value,s.appendChild(a)}this.listEl.appendChild(s)}this.select(Math.min(e,Math.max(0,t.rows.length-1)))}select(e){let t=this.listEl.children;t[this.sel]?.classList.remove("on"),this.sel=e;let n=t[e];if(n){n.classList.add("on"),n.scrollIntoView?.({block:"nearest"});let s=this.rows[e];globalThis.MyPC?.announce?.(s.label+(s.value?", "+s.value:""))}}input(e){if(!this.open)return;let t=this.cur?.grid;if(t&&e!=="back"){this.onSound(e==="ok"?"ui_ok":"ui_move"),e==="ok"?t.ok():t.move(e),this.refresh();return}if(e==="left"||e==="right")return;let n=this.rows.length;if(this.onSound(e==="up"||e==="down"?"ui_move":e==="ok"?"ui_ok":this.stack.length>1?"ui_back":"ui_close"),e==="up"&&n)this.select((this.sel+n-1)%n);else if(e==="down"&&n)this.select((this.sel+1)%n);else if(e==="back")this.back();else if(e==="ok"&&n){let s=this.rows[this.sel];this.onPick(this.page,s.id)}}onSound=()=>{}};function En(i,e){let t=Math.max(0,Math.min(100,100-e)),n=t>60?"#5cc98a":t>30?"#e8b64a":"#e5625b";return`<span class="nb"><span class="nl">${i}</span><span class="nt"><i style="width:${Math.max(3,t)}%;background:${n}"></i></span></span>`}var Cp={drink:"gDrink",eat:"gEat",forage:"gForage",sleep:"gSleep",talk:"gTalk",wander:"gWander",rest:"gRest",travel:"gTravel","gather wood":"wGatherWood","gather stone":"wGatherStone","gather scrap":"wGatherScrap","make an axe":"wAxe","make a spear":"wSpear","build a campfire":"wFire","build a hut":"wHut","feed the fire":"wTend","collect food and store it":"wStore","search the ruins":"wLoot","plant a field":"wFarm","repair the huts":"wRepair"};function Ep(i){let e={wood:"iWood",stone:"iStone",scrap:"iScrap",axe:"iAxe",spear:"iSpear"};return Object.entries(i??{}).filter(([t,n])=>n>0&&e[t]).map(([t,n])=>t==="axe"||t==="spear"?A(e[t]):`${n} ${A(e[t])}`).join(", ")}var bl=class{constructor(e=10){this.max=e;this.box=document.createElement("div"),this.box.id="bubbles",document.body.appendChild(this.box);for(let t=0;t<e;t++){let n=document.createElement("div");n.className="bub",n.hidden=!0;let s=document.createElement("div");s.className="ba";let r=document.createElement("div");r.className="bb";let a=document.createElement("div");a.className="bp",a.hidden=!0;let o=document.createElement("i");a.appendChild(o),n.append(s,r,a),this.box.appendChild(n),this.pool.push({el:n,a:s,b:r,p:a,pi:o,pct:-2,id:-1,text:"",act:-1,ver:-1,lx:0,ly:0})}}max;box;pool=[];ver=0;pt={x:0,y:0};data=new Map;set(e,t){this.data.clear();for(let n of e){let s={id:n[0],act:n[1],to:String(n[2]??""),dist:Number(n[3])||0,wish:String(n[4]??""),wishWith:String(n[5]??""),why:String(n[6]??""),mood:String(n[7]??""),said:String(n[8]??""),pct:typeof n[9]=="number"?n[9]:-1,from:String(n[10]??"")};this.data.set(s.id,s)}this.ver++}hide(){for(let e of this.pool)e.el.hidden=!0,e.id=-1}cand=Array.from({length:48},()=>({id:-1,x:0,y:0,d:0}));wp={x:0,y:0};draw(e,t,n,s,r){let a=0;for(let l of this.data.keys()){if(a>=this.cand.length)break;if(!e(l,this.wp))continue;let h=this.cand[a++];h.id=l,h.x=this.wp.x,h.y=this.wp.y,h.d=Math.hypot(h.x-n,h.y-s)}let o=0;for(;o<this.pool.length&&o<a;o++){let l=o;for(let g=o+1;g<a;g++)this.cand[g].d<this.cand[l].d&&(l=g);if(l!==o){let g=this.cand[o];this.cand[o]=this.cand[l],this.cand[l]=g}let h=this.cand[o],c=this.pool[o],u=this.data.get(h.id);if(!t(h.x,h.y,this.pt)){c.el.hidden=!0;continue}if(c.id!==h.id||c.act!==u.act||c.ver!==this.ver){let g=r(u.act)+(u.to?" \xB7 "+se("bWith",u.to):"")+(u.dist>=3?` \xB7 ${u.dist} m`:""),v=u.wish==="task"?u.why:u.wish?se("bWants",A(Cp[u.wish]??"gWander")+(u.wishWith?" "+se("bWith",u.wishWith):""))+(u.why?` (${u.why})`:""):"",p=[u.said?`\u201C${u.said}\u201D`:"",v].filter(Boolean).join(" \xB7 "),f=g+"|"+p;c.text!==f&&(c.text=f,c.a.textContent=g,c.b.textContent=p,c.b.hidden=!p);let w=u.wish==="task"?u.pct:-1;c.pct!==w&&(c.pct=w,c.p.hidden=w<0,w>=0&&(c.pi.style.width=`${Math.max(6,w)}%`,c.p.className=u.from?"bp ord":"bp")),c.id=h.id,c.act=u.act,c.ver=this.ver}c.el.hidden=!1;let d=Math.round(this.pt.x),m=Math.round(this.pt.y);(d!==c.lx||m!==c.ly)&&(c.lx=d,c.ly=m,c.el.style.transform=`translate(${d}px, ${m}px) translate(-50%, -100%)`)}for(;o<this.pool.length;o++)this.pool[o].el.hidden=!0,this.pool[o].id=-1}},zu={baby:"stBaby",toddler:"stToddler",child:"stChild",teen:"stTeen",adult:"stAdult"},Vb={strength:"tStrength",speed:"tSpeed",intelligence:"tIntelligence",courage:"tCourage",empathy:"tEmpathy",metabolism:"tMetabolism",lifespan:"tLifespan"};function Hu(i,e,t){let n=a=>a.replace(/[&<>"']/g,o=>`&#${o.charCodeAt(0)};`),s=`<div class="pn">${n(i.name)}</div><div class="ps">${i.sex==="f"?A("pWoman"):A("pMan")} \xB7 ${se("pAge",String(i.age))}${i.stage&&i.stage!=="adult"?" \xB7 "+A(zu[i.stage]??"stChild"):i.age<16?" \xB7 "+A("pChild"):""}${i.carer?" \xB7 "+n(se("famLooked",i.carer)):""}${i.pregnant?" \xB7 "+A("pExpecting"):""}</div>`;if(!i.alive)return s+`<div class="ps">${A("pDead")}${i.cause?" ("+n(i.cause)+")":""}</div>`;let r=[s,`<div class="pa">${n(e(i.act??0))}${i.carry?" \xB7 "+se("carry",String(i.carry)):""}${Ep(i.inv)?" \xB7 "+n(se("has",Ep(i.inv))):""}</div>`,`<div class="pbars">${En(A("nFood"),i.hunger??0)}${En(A("nWater"),i.thirst??0)}${En(A("nRest"),i.tired??0)}${En(A("nFun"),i.lonely??0)}${En(A("nHp"),100-(i.hp??100))}</div>`];if(i.goal&&r.push(`<div class="pm">${A("pGoal")}: <b>${n(i.goal.text)}</b> \xB7 ${Math.min(i.goal.k+1,i.goal.n)}/${i.goal.n}</div><div class="bp${i.goal.from!=="myself"?" ord":""}"><i style="width:${Math.max(6,i.goal.pct)}%"></i></div>`),i.level!==void 0&&r.push(`<div class="pm">${se("pLevel",String(i.level),String(i.xp??0))}</div>`),i.mind){let a=i.mind;r.push(`<div class="pm">${A("pMood")}: <b>${n(a.mood)}</b>${a.plan?` \xB7 ${A("pWants")} ${n(A(Cp[a.plan.act]??"gWander"))}${a.plan.with?" "+n(se("bWith",a.plan.with)):""}${a.plan.why?" ("+n(a.plan.why)+")":""}`:""}</div>`),a.said&&r.push(`<div class="pm">${A("pSaid")}: \u201C${n(a.said)}\u201D</div>`)}return t&&(r.push(`<div class="pm">${n(i.personality.join(", "))} \xB7 ${se("pGen",String(i.generation))}</div>`,`<div class="pm">${A("pPartner")}: ${n(i.partner??A("pNone"))} \xB7 ${A("pParents")}: ${n(i.parents.join(", ")||A("pFirst"))} \xB7 ${A("pChildren")}: ${n(i.children.join(", ")||A("pNone"))}${i.siblings?.length?" \xB7 "+n(i.siblings.join(", ")):""}</div>`,`<div class="pm">${A("pTraits")}: ${Object.entries(i.traits).map(([a,o])=>`${A(Vb[a]??"tStrength")} ${a==="lifespan"?o:Math.round(o*100)+"%"}`).join(" \xB7 ")}</div>`),i.mind?.memory&&r.push(`<div class="pm">${A("pMemory")}: ${n(i.mind.memory)}</div>`),i.mind?.recent.length&&r.push(`<div class="pm">${A("pRecent")}: ${n(i.mind.recent.join(" \xB7 "))}</div>`)),r.join("")}var Sl=class{constructor(e){this.el=e;e.hidden=!0,this.mid=document.createElement("div"),this.mid.className="wh-mid",this.helpEl=document.createElement("div"),this.helpEl.className="wh-help"}el;open=!1;hold=!1;sel=-1;openedAt=0;items=[];slots=[];mid;helpEl;show(e,t,n){this.items=e,this.hold=t,this.open=!0,this.sel=-1,this.openedAt=performance.now(),this.el.textContent="",this.slots=e.map((s,r)=>{let a=r/e.length*Math.PI*2,o=document.createElement("div");o.className="wh-s",o.style.left=`${50+Math.sin(a)*36}%`,o.style.top=`${50-Math.cos(a)*36}%`;let l=document.createElement("b");l.textContent=s.icon;let h=document.createElement("span");return h.textContent=s.label,o.append(l,h),this.el.appendChild(o),o}),this.mid.textContent="",this.helpEl.textContent=n,this.el.append(this.mid,this.helpEl),this.el.hidden=!1}aim(e,t){if(e*e+t*t<.3)return;let n=this.items.length,s=Math.atan2(e,-t);s<0&&(s+=Math.PI*2),this.choose(Math.round(s/(Math.PI*2/n))%n)}step(e){let t=this.items.length;e==="up"?this.choose(0):e==="down"?this.choose(Math.floor(t/2)):this.choose(((this.sel<0?0:this.sel)+(e==="right"?1:t-1))%t)}choose(e){if(e===this.sel)return;this.sel>=0&&this.slots[this.sel]?.classList.remove("on"),this.sel=e;let t=this.slots[e];t&&(t.classList.add("on"),this.mid.textContent=this.items[e].label)}close(){if(!this.open)return null;let e=this.sel>=0?this.items[this.sel].id:null;return this.open=!1,this.hold=!1,this.sel=-1,this.el.hidden=!0,e}};var Vu={on:!0,master:.8,fx:.9,amb:.5,ui:.6},Gb=14,Rp=26,Al=class{prefs={...Vu};ctx=null;master=null;bus={};entries=new Map;buffers=new Map;loading=new Set;lastAt=new Map;voices=0;loops=new Map;base="";lx=0;ly=0;yaw=0;topView=!0;ready=!1;log=[];stats(){return{ready:this.ready,state:this.ctx?.state??"none",sounds:this.entries.size,decoded:this.buffers.size,loops:[...this.loops.entries()].map(([e,t])=>`${e}:${t.cur.toFixed(2)}`),log:this.log.slice()}}async load(e){this.base=e;try{let t=await fetch(e+"manifest.json",{cache:"no-cache"});if(!t.ok)return;let n=await t.json();for(let s of n.sounds??[])s&&s.id&&Array.isArray(s.files)&&s.files.length&&this.entries.set(s.id,s);this.ready=!0}catch{}}has(e){return this.entries.has(e)}unlock(){if(this.ctx){this.ctx.state==="suspended"&&this.ctx.resume().catch(()=>{});return}try{let e=window.AudioContext||window.webkitAudioContext;this.ctx=new e({latencyHint:"interactive"})}catch{return}this.master=this.ctx.createGain(),this.master.connect(this.ctx.destination);for(let e of["fx","ui"]){let t=this.ctx.createGain();t.connect(this.master),this.bus[e]=t}this.apply(),this.preload()}async preload(){let e=[...this.entries.values()].filter(t=>!t.loop);for(let t=0;t<e.length;t+=4)await Promise.all(e.slice(t,t+4).map(n=>this.decode(n)))}async decode(e){if(this.buffers.has(e.id))return this.buffers.get(e.id);if(!this.ctx||this.loading.has(e.id))return null;this.loading.add(e.id);let t=[];for(let n of e.files)try{let s=await fetch(this.base+n);if(!s.ok)continue;let r=await s.arrayBuffer();t.push(await new Promise((a,o)=>this.ctx.decodeAudioData(r,a,o)))}catch{}return this.loading.delete(e.id),this.buffers.set(e.id,t),t}apply(){let e=this.prefs;this.master&&(this.master.gain.value=e.on?e.master:0),this.bus.fx&&(this.bus.fx.gain.value=e.fx),this.bus.ui&&(this.bus.ui.gain.value=e.ui);for(let t of this.loops.values())this.setLoopVol(t)}play(e,t,n,s=1,r=1){let a=this.ctx,o=this.entries.get(e);if(!a||!o||!this.prefs.on||a.state!=="running"||this.voices>=Gb)return;let l=performance.now();if(l-(this.lastAt.get(e)??0)<60)return;let h=this.buffers.get(e);if(!h){this.decode(o);return}if(!h.length)return;let c=(o.gain??1)*s,u=0;if(t!==void 0&&n!==void 0){let v=t-this.lx,p=n-this.ly,f=Math.hypot(v,p);if(f>Rp)return;c*=f<3?1:Math.pow(1-(f-3)/(Rp-3),1.6);let w=this.topView?v:v*Math.cos(this.yaw)+p*Math.sin(this.yaw);u=Math.max(-.85,Math.min(.85,w/10))}if(c<.02)return;this.lastAt.set(e,l);let d=a.createBufferSource();d.buffer=h[Math.random()*h.length|0],d.playbackRate.value=r*(.94+Math.random()*.12);let m=a.createGain();m.gain.value=c,d.connect(m);let g=m;if(u&&a.createStereoPanner){let v=a.createStereoPanner();v.pan.value=u,m.connect(v),g=v}g.connect(o.cat==="ui"?this.bus.ui:this.bus.fx),this.voices++,this.log.push(e),this.log.length>30&&this.log.shift(),d.onended=()=>{this.voices--;try{g.disconnect(),m.disconnect()}catch{}},d.start()}loop(e,t){let n=this.entries.get(e);if(!n||!n.loop)return;let s=this.loops.get(e);if(!s){if(t<=.01||!this.ctx)return;let r=new Audio(this.base+n.files[0]);r.loop=!0,r.preload="auto",r.volume=0,s={el:r,want:0,cur:0},this.loops.set(e,s)}s.want=t*(n.gain??1)}setLoopVol(e){let t=this.prefs,n=t.on?e.cur*t.amb*t.master:0;e.el.volume=Math.max(0,Math.min(1,n))}tick(e){for(let[t,n]of this.loops){let s=Math.min(1,e*1.5);if(n.cur+=(n.want-n.cur)*s,n.want<=.01&&n.cur<.01){n.el.pause(),n.el.removeAttribute("src"),n.el.load(),this.loops.delete(t);continue}this.setLoopVol(n),n.el.paused&&this.prefs.on&&this.ctx&&n.el.play().catch(()=>{})}}pause(e){if(e){for(let t of this.loops.values())t.el.pause();this.ctx?.suspend().catch(()=>{})}else this.ctx?.resume().catch(()=>{})}};var kt=i=>i.replace(/[&<>"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[e]),Wb=["sword","axe","spear","bow","arrows","clothes","armor","helmet"],Pp=[...Yi,...Wb,...Zi],Ip={weapon:"sword",clothing:"armor",defence:"palisade",furniture:"bed"},Ba=i=>A("qual"+i),Wu=()=>Math.max(24,Math.round(innerWidth*.036));function hs(i,e,t,n="",s=-1){let r=i?fl(i,Wu()):"",a=s>0?` style="border-color:${_s[s]};box-shadow:0 0 0.6vw ${_s[s]} inset"`:"",o=i?r?`<i style="${r}"></i>`:`<i class="tx">${kt(i.slice(0,2))}</i>`:"";return`<div class="sl${t?" on":""}${n}"${a}>${o}${e>1?`<b>${e}</b>`:""}</div>`}function Lp(i,e,t){return Object.entries(i).map(([n,s])=>{let r=(e[n]??0)>=s,a=Du(n)?fl(n,Math.round(Wu()*.62)):"";return`<span class="cc${r?"":" no"}">${a?`<i style="${a}"></i>`:""}${s} ${kt(t(n))}</span>`}).join("")}var Tl=class{constructor(e){this.c=e}c;zone="bag";i=0;tab=0;cells=Array(9).fill("");pot(){let e={};for(let t of this.cells)t&&(e[t]=(e[t]??0)+1);return e}clear(){this.cells.fill("")}bag(){let e=this.c.inv(),t=this.pot(),n=[],s=Object.keys(e).filter(r=>(e[r]??0)>0).sort((r,a)=>(Pp.indexOf(r)+1||99)-(Pp.indexOf(a)+1||99));for(let r of s){let a=(e[r]??0)-(t[r]??0);a>0&&n.push([r,a])}return n}result(){let e=this.pot();if(!Object.keys(e).length)return null;let t=li[this.tab];return nr(t,e)??li.map(n=>nr(n,e)).find(n=>n)??null}book(){return Ki.filter(e=>e.cat===li[this.tab])}html(){let e=this.c,t=e.inv(),n=this.zone,s=this.result(),r=this.book(),a=this.bag(),o=li.map((g,v)=>`<div class="tb${v===this.tab?" cur":""}${n==="tabs"&&this.i===v?" on":""}">${Du(Ip[g])?`<i style="${fl(Ip[g],Math.round(Wu()*.7))}"></i>`:""}${kt(e.catName(g))}</div>`).join(""),l=this.cells.map((g,v)=>hs(g,1,n==="grid"&&this.i===v)).join(""),h=s?hs(s.what,s.n??1,n==="result",s.cat!==li[this.tab]?" other":""):hs("",0,n==="result"," empty"),c=r.map((g,v)=>{let p=Object.entries(g.need).every(([f,w])=>(t[f]??0)>=w);return hs(g.what,g.n??1,n==="book"&&this.i===v,p?" can":" cant")}).join(""),u=Array.from({length:36},(g,v)=>{let p=a[v];return hs(p?.[0]??"",p?.[1]??0,n==="bag"&&this.i===v,"",p&&ci[p[0]]?e.gear()?.up?.[p[0]]?.[1]??0:-1)}).join(""),d="",m="";if(n==="tabs")d=e.catName(li[this.i]),m=A("invHintTab");else if(n==="grid"){let g=this.cells[this.i];d=g?e.thing(g):A("invEmpty"),m=g?A("invHintGrid"):A("invHintNone")}else if(n==="result")d=s?`${e.thing(s.what)}${s.n&&s.n>1?" x"+s.n:""}${s.cat!==li[this.tab]?" \xB7 "+se("invIn",e.catName(s.cat)):""}`:A("invEmpty"),m=s?se("invHintMake",e.thing(s.what)):A("invHintNone");else if(n==="book"){let g=r[this.i];g&&(d=`${e.thing(g.what)} = ${Object.entries(g.need).map(([v,p])=>`${p} ${e.thing(v)}`).join(" + ")}`,m=A("invHintBook"))}else{let g=a[this.i];if(g){let[v]=g,p=e.gear()?.up?.[v];d=`${e.thing(v)}${p&&(p[0]||p[1])?` +${p[0]} \xB7 ${Ba(p[1])}`:""}`,m=Yi.includes(v)?A("invHintRes"):ci[v]?A("invHintGear"):Zi.includes(v)?A("invHintPlace"):""}else d=A("invEmpty")}return`<div class="inv"><div class="tabs">${o}</div>
<div class="r1"><div class="box"><div class="bt">${kt(A("invCraft"))}</div><div class="cr"><div class="cg">${l}</div><div class="arr">\u279C</div>${h}</div></div>
<div class="box bkb"><div class="bt">${kt(A("invBook"))}</div><div class="bk">${c}</div></div></div>
<div class="box"><div class="bt">${kt(A("invBag"))}</div><div class="bg">${u}</div></div>
<div class="ds"><b>${kt(d)}</b><span>${kt(m)}</span></div><div class="nv">${kt(A("invNav"))}</div></div>`}move(e){let t=this.zone,n=this.i,s=this.book().length,r=(a,o)=>{this.zone=a,this.i=o};if(t==="tabs")e==="left"||e==="right"?(this.i=(n+(e==="left"?3:1))%4,this.tab=this.i):e==="down"&&r("grid",Math.min(n,2));else if(t==="grid"){let a=Math.floor(n/3),o=n%3;e==="left"&&o>0?this.i--:e==="right"?o<2?this.i++:r("result",0):e==="up"?a>0?this.i-=3:r("tabs",this.tab):e==="down"&&(a<2?this.i+=3:r("bag",o*2))}else if(t==="result")e==="left"?r("grid",5):e==="right"&&s?r("book",0):e==="up"?r("tabs",this.tab):e==="down"&&r("bag",6);else if(t==="book"){let a=Math.floor(n/3),o=n%3;e==="left"?o>0?this.i--:r("result",0):e==="right"&&o<2&&n+1<s?this.i++:e==="up"?a>0?this.i-=3:r("tabs",this.tab):e==="down"&&(n+3<s?this.i+=3:r("bag",6+o))}else{let a=Math.floor(n/9),o=n%9;e==="left"&&o>0?this.i--:e==="right"&&o<8?this.i++:e==="down"&&a<3?this.i+=9:e==="up"&&(a>0?this.i-=9:o<=4?r("grid",6+Math.min(2,Math.floor(o/2))):o===5||!s?r("result",0):r("book",Math.min(s-1,Math.floor((s-1)/3)*3+Math.min(2,o-6))))}}ok(){let e=this.c,t=this.zone;if(t==="tabs"){this.tab=this.i;return}if(t==="grid"){this.cells[this.i]="";return}if(t==="result"){let r=this.result();if(!r){e.note(A("invHintNone"),2e3);return}e.send("craft",`${r.cat}:${Object.entries(this.pot()).map(([a,o])=>`${a}=${o}`).join(",")}`);return}if(t==="book"){let r=this.book()[this.i];if(!r)return;let a=e.inv(),o=Object.entries(r.need).filter(([h,c])=>(a[h]??0)<c);if(o.length){e.note(se("invMissing",o.map(([h,c])=>`${c-(a[h]??0)} ${e.thing(h)}`).join(", ")),3e3);return}this.clear();let l=0;for(let[h,c]of Object.entries(r.need))for(let u=0;u<c&&l<9;u++)this.cells[l++]=h;this.zone="result",this.i=0;return}let n=this.bag()[this.i];if(!n)return;let[s]=n;if(Yi.includes(s)){let r=this.cells.indexOf("");if(r<0){e.note(A("invHintGrid"),1500);return}this.cells[r]=s,this.bag()[this.i]||(this.i=Math.max(0,this.i-1))}else ci[s]?e.send("equip",`${ci[s]}:${s}`):Zi.includes(s)&&(e.send("place",s),e.close())}},Dp=["weapon","ranged","head","body"],qb={weapon:"gSlotWeapon",ranged:"gSlotRanged",head:"gSlotHead",body:"gSlotBody"},$b={weapon:"sword",ranged:"bow",head:"helmet",body:"armor"},El=class{constructor(e){this.c=e}c;col=0;row=0;opt=0;prev=null;slotNow(){return Dp[this.row0]}row0=0;options(e){let t=this.c.inv();return["","-",...Object.keys(ci).filter(n=>ci[n]===e&&(t[n]??0)>0)]}used(e){return this.c.gear()?.use?.[e]??""}up(e){return this.c.gear()?.up?.[e]??[0,0]}stat(e,t,n){if(!e)return"";let s=ha(e)*ca(t,n);return ci[e]==="body"||ci[e]==="head"?`${A("gDefence")} ${Math.round(s*100)} %`:`${A("gDamage")} ${s.toFixed(1)}`}html(){let e=this.c,t=e.inv(),n=this.slotNow(),s=Dp.map((f,w)=>{let S=this.used(f),[x,I]=S?this.up(S):[0,0],R=this.col===0&&this.row0===w,T=this.row0===w;return`<div class="gs${R?" on":""}${T?" cur":""}">${hs(S||$b[f],0,!1,S?"":" ghost",S?I:-1)}<div><div class="gl">${kt(A(qb[f]))}</div><div class="gv">${S?`${kt(e.thing(S))} <span style="color:${_s[I]}">+${x} ${kt(Ba(I))}</span>`:kt(f==="weapon"?A("gHands"):A("gNone"))}</div></div></div>`}).join(""),r=this.options(n),a=e.gear()?.[n]??"",o=r.map((f,w)=>{let S=this.col===1&&this.row===0&&this.opt===w,x=(a||"")===f,I=f===""?A("gBest"):f==="-"?A("gNone"):e.thing(f),[,R]=f&&f!=="-"?this.up(f):[0,0];return`<div class="go${S?" on":""}${x?" cur":""}">${f&&f!=="-"?hs(f,t[f]??0,!1,"",R):`<div class="sl txt">${f===""?"\u2605":"\u2205"}</div>`}<span>${kt(I)}</span></div>`}).join(""),l=this.used(n),[h,c]=l?this.up(l):[0,0],u=`<p class="dim">${kt(A("gEmpty"))}</p>`;if(l){let f=this.col===1&&this.row===1,w=this.col===1&&this.row===2,S=h>=ir?A("gMax"):`${this.stat(l,h,c)} \u279C ${this.stat(l,h+1,c)}`,x=Od(c),I=c>=4?A("gMax"):h<x?se("gNeedLv",String(x)):`${Ba(c)} \u279C <span style="color:${_s[c+1]}">${kt(Ba(c+1))}</span>`;u=`<div class="gd"><div class="gbig">${hs(l,0,!1," big",c)}<div><b style="color:${_s[c]}">${kt(e.thing(l))} +${h}</b><div>${kt(Ba(c))} \xB7 ${kt(this.stat(l,h,c))}</div>
<div class="qbar">${[0,1,2,3,4].map(R=>`<i style="background:${R<=c?_s[R]:"rgba(255,255,255,.12)"}"></i>`).join("")}</div><div class="lbar">${Array.from({length:ir},(R,T)=>`<i class="${T<h?"f":""}"></i>`).join("")}</div></div></div>
<div class="gb${f?" on":""}${h>=ir?" off":""}"><b>${kt(A("gLevelUp"))}</b><span>${kt(S)}</span><div>${h<ir?Lp(zd(l,h),t,e.thing):""}</div></div>
<div class="gb${w?" on":""}${c>=4||h<x?" off":""}"><b>${kt(A("gQualityUp"))}</b><span>${I}</span><div>${c<4?Lp(Hd(l,c),t,e.thing):""}</div></div></div>`}let d=this.used("weapon"),m=this.used("body"),g=this.used("head"),v=d?ha(d)*ca(...this.up(d)):15,p=Math.min(.7,(m?ha(m)*ca(...this.up(m)):0)+(g?ha(g)*ca(...this.up(g)):0));return`<div class="gear"><div class="gp"><div id="gprev"></div><div class="gt"><span>\u2694 ${v.toFixed(0)}</span><span>\u{1F6E1} ${Math.round(p*100)} %</span></div></div>
<div class="gsl">${s}</div><div class="gr"><div class="gor">${o}</div>${u}</div></div><div class="nv">${kt(A("gNav"))}</div>`}move(e){let t=!!this.used(this.slotNow());if(this.col===0){e==="up"?this.row0=(this.row0+3)%4:e==="down"?this.row0=(this.row0+1)%4:e==="right"&&(this.col=1,this.row=0,this.opt=Math.max(0,this.options(this.slotNow()).indexOf(this.c.gear()?.[this.slotNow()]??"")));return}let n=this.options(this.slotNow()).length;this.row===0?e==="left"?this.opt>0?this.opt--:this.col=0:e==="right"?this.opt=Math.min(n-1,this.opt+1):e==="down"&&t&&(this.row=1):e==="up"?this.row--:e==="down"?this.row=Math.min(2,this.row+1):e==="left"&&(this.col=0)}ok(){let e=this.slotNow();if(this.col===0){this.move("right");return}if(this.row===0){let n=this.options(e)[this.opt]??"";this.c.send("equip",`${e}:${n}`);return}let t=this.used(e);t&&this.c.send("upgrade",`${t}:${this.row===1?"lv":"q"}`)}draw(e){let t=document.getElementById("gprev");if(!t){this.stop();return}this.prev??=new Gu;let n=this.c.gear(),s=n?.use??{},r=c=>c?n?.up?.[c]??[0,0]:[0,0],a=s.weapon||(s.ranged?"bow":""),o=e/1e3%5,l=o>3.6?a==="bow"?"shoot":a?"attack":"use":"",h=Vd({held:a,hq:r(a)[1],helmet:s.head==="helmet",headQ:r(s.head)[1],body:s.body==="armor"?"armor":s.body==="clothes"?"clothes":"",bodyQ:r(s.body)[1],anim:l,seq:0,back:!!s.ranged&&a!=="bow"});this.prev.draw(t,this.c.look(),h,l?o-3.6:0,e/1e3)}stop(){this.prev?.dispose(),this.prev=null}},Gu=class{canvas=Object.assign(document.createElement("canvas"),{className:"gpc"});r;scene=new Lr;cam=new jt(30,.75,.1,50);people;w=0;h=0;constructor(){this.r=new Ir({canvas:this.canvas,antialias:!0,alpha:!0}),this.r.setPixelRatio(1),this.r.toneMapping=Ea,this.scene.add(new Nr(15397631,4865072,1.6));let e=new Bs(16773590,2.4);e.position.set(-2,4,4),this.scene.add(e);let t=new Bs(11061503,1.3);t.position.set(3,3,-4),this.scene.add(t);let n=new Mt(new pi(1.1,40).rotateX(-Math.PI/2),new dn({color:3814440}));this.scene.add(n),this.people=new Fr(this.scene,1,!1),this.cam.position.set(0,1.5,5.3),this.cam.lookAt(0,.98,0)}draw(e,t,n,s,r){this.canvas.parentElement!==e&&(e.textContent="",e.appendChild(this.canvas));let a=e.clientWidth,o=e.clientHeight;(a!==this.w||o!==this.h)&&(this.w=a,this.h=o,this.r.setSize(a,o,!1),this.cam.aspect=a/Math.max(1,o),this.cam.updateProjectionMatrix());let l=this.people;l.begin(),l.add(0,0,Math.sin(r*.6)*.9,0,0,t,!1,1,!1,n,s),l.end(),this.r.render(this.scene,this.cam)}dispose(){this.r.dispose(),this.r.forceContextLoss(),this.canvas.remove()}};var Np={en:{quests:"Quests",again:"Talk to me again for the next quest.",clan:"Clan",qHelp:"Talk to the town's teachers (Talk next to them): they give the quests in order, and you hand each one in to the one who gave it.",done:"done",active:"in hand",ready:"done: hand it in",next:"next",locked:"locked",from:"from {0}",goSee:"Go and see {0}.",handIn:"Hand it in to {0}.",taken:"Quest taken: {0}",handed:"Quest done: {0} (+{1} points)",progress:"{0}: {1} / {2}",readyNote:"{0}: done! Go back to {1}.",noNpc:"No one to talk to here.",allDone:"You finished every quest. Well done!",reward:"Reward: {0}",close:"OK",npcClan:"Clans",found:"Found a clan",foundLabel:"Name of your clan",noClan:"You are in no clan.",leader:"Leader",approval:"Approval {0} %",loyalty:"Your loyalty {0} %",members:"Members (by respect)",join:"Join a clan",quit:"Quit my clan",callVote:"Ask for a vote",vote:"Vote for the leader",voteOn:"Election: {0}. Closes in {1} min.",voted:"You voted for {0}.",order:"Give my clan an order",orderLabel:"Your order to the clan",lastVote:"Last vote: {0} won",ordered:"Your order went to {0} members.",joined:"You joined {0}.",left:"You left {0}.",founded:"You founded {0}.",refused:"{0} would not take you.",atReg:"Clans are founded with Odile, the registrar in town: talk to her.",leadAlready:"You already lead a clan.",noVote:"There is no vote now.",tooSoon:"There was a vote a short while ago.",notLeader:"Only the leader gives the clan orders.",clanNone:"No such clan.",others:"Other clans here",none:"none",clanHelp:"Members vote for their leader (by respect and how they feel). The leader gives orders; loyal members follow them. You can change clan at any time.",order0:"Leader's order: {0}",rivals:"Rivals: {0}"},fr:{quests:"Qu\xEAtes",again:"Reparle-moi pour la qu\xEAte suivante.",clan:"Clan",qHelp:"Parle aux ma\xEEtres de la ville (Parler \xE0 c\xF4t\xE9 d'eux) : ils donnent les qu\xEAtes dans l'ordre, et tu rends chacune \xE0 celui qui l'a donn\xE9e.",done:"faite",active:"en cours",ready:"faite : \xE0 rendre",next:"suivante",locked:"verrouill\xE9e",from:"de {0}",goSee:"Va voir {0}.",handIn:"Rends-la \xE0 {0}.",taken:"Qu\xEAte prise : {0}",handed:"Qu\xEAte finie : {0} (+{1} points)",progress:"{0} : {1} / {2}",readyNote:"{0} : fait ! Retourne voir {1}.",noNpc:"Personne \xE0 qui parler ici.",allDone:"Tu as fini toutes les qu\xEAtes. Bravo !",reward:"R\xE9compense : {0}",close:"OK",npcClan:"Clans",found:"Fonder un clan",foundLabel:"Nom de ton clan",noClan:"Tu n'es dans aucun clan.",leader:"Chef",approval:"Approbation {0} %",loyalty:"Ta loyaut\xE9 {0} %",members:"Membres (par respect)",join:"Rejoindre un clan",quit:"Quitter mon clan",callVote:"Demander un vote",vote:"Voter pour le chef",voteOn:"\xC9lection : {0}. Fin dans {1} min.",voted:"Tu as vot\xE9 pour {0}.",order:"Donner un ordre au clan",orderLabel:"Ton ordre au clan",lastVote:"Dernier vote : {0} a gagn\xE9",ordered:"Ton ordre est all\xE9 \xE0 {0} membres.",joined:"Tu as rejoint {0}.",left:"Tu as quitt\xE9 {0}.",founded:"Tu as fond\xE9 {0}.",refused:"{0} ne veut pas de toi.",atReg:"Les clans se fondent avec Odile, en ville : parle-lui.",leadAlready:"Tu diriges d\xE9j\xE0 un clan.",noVote:"Pas de vote en ce moment.",tooSoon:"Un vote a eu lieu il y a peu.",notLeader:"Seul le chef donne des ordres au clan.",clanNone:"Ce clan n'existe pas.",others:"Autres clans ici",none:"aucun",clanHelp:"Les membres \xE9lisent leur chef (respect et sentiments). Le chef donne des ordres ; les membres loyaux les suivent. Tu peux changer de clan \xE0 tout moment.",order0:"Ordre du chef : {0}",rivals:"Rivaux : {0}"},es:{quests:"Misiones",again:"H\xE1blame otra vez para la siguiente misi\xF3n.",clan:"Clan",qHelp:"Habla con los maestros del pueblo (Hablar a su lado): dan las misiones en orden y entregas cada una a quien te la dio.",done:"hecha",active:"en curso",ready:"hecha: entr\xE9gala",next:"siguiente",locked:"bloqueada",from:"de {0}",goSee:"Ve a ver a {0}.",handIn:"Entr\xE9gala a {0}.",taken:"Misi\xF3n aceptada: {0}",handed:"Misi\xF3n cumplida: {0} (+{1} puntos)",progress:"{0}: {1} / {2}",readyNote:"{0}: \xA1hecho! Vuelve con {1}.",noNpc:"No hay nadie con quien hablar aqu\xED.",allDone:"Terminaste todas las misiones. \xA1Bien hecho!",reward:"Recompensa: {0}",close:"OK",npcClan:"Clanes",found:"Fundar un clan",foundLabel:"Nombre de tu clan",noClan:"No est\xE1s en ning\xFAn clan.",leader:"L\xEDder",approval:"Aprobaci\xF3n {0} %",loyalty:"Tu lealtad {0} %",members:"Miembros (por respeto)",join:"Unirme a un clan",quit:"Dejar mi clan",callVote:"Pedir una votaci\xF3n",vote:"Votar al l\xEDder",voteOn:"Elecci\xF3n: {0}. Cierra en {1} min.",voted:"Votaste por {0}.",order:"Dar una orden al clan",orderLabel:"Tu orden al clan",lastVote:"\xDAltima votaci\xF3n: gan\xF3 {0}",ordered:"Tu orden lleg\xF3 a {0} miembros.",joined:"Te uniste a {0}.",left:"Dejaste {0}.",founded:"Fundaste {0}.",refused:"{0} no te acepta.",atReg:"Los clanes se fundan con Odile, en el pueblo: habla con ella.",leadAlready:"Ya diriges un clan.",noVote:"No hay votaci\xF3n ahora.",tooSoon:"Hubo una votaci\xF3n hace poco.",notLeader:"Solo el l\xEDder da \xF3rdenes al clan.",clanNone:"Ese clan no existe.",others:"Otros clanes aqu\xED",none:"ninguno",clanHelp:"Los miembros eligen a su l\xEDder (respeto y sentimientos). El l\xEDder da \xF3rdenes; los leales las siguen. Puedes cambiar de clan cuando quieras.",order0:"Orden del l\xEDder: {0}",rivals:"Rivales: {0}"},ar:{quests:"\u0627\u0644\u0645\u0647\u0627\u0645",again:"\u062A\u062D\u062F\u062B \u0645\u0639\u064A \u0645\u0631\u0629 \u0623\u062E\u0631\u0649 \u0644\u0644\u0645\u0647\u0645\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629.",clan:"\u0627\u0644\u0639\u0634\u064A\u0631\u0629",qHelp:"\u062A\u062D\u062F\u062B \u0645\u0639 \u0645\u0639\u0644\u0645\u064A \u0627\u0644\u0628\u0644\u062F\u0629 (\u062A\u062D\u062F\u062B \u0628\u062C\u0627\u0646\u0628\u0647\u0645): \u064A\u0639\u0637\u0648\u0646 \u0627\u0644\u0645\u0647\u0627\u0645 \u0628\u0627\u0644\u062A\u0631\u062A\u064A\u0628\u060C \u0648\u062A\u0633\u0644\u0651\u0645 \u0643\u0644 \u0645\u0647\u0645\u0629 \u0644\u0645\u0646 \u0623\u0639\u0637\u0627\u0643 \u0625\u064A\u0627\u0647\u0627.",done:"\u0645\u0646\u062C\u0632\u0629",active:"\u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630",ready:"\u0645\u0646\u062C\u0632\u0629: \u0633\u0644\u0651\u0645\u0647\u0627",next:"\u0627\u0644\u062A\u0627\u0644\u064A\u0629",locked:"\u0645\u0642\u0641\u0644\u0629",from:"\u0645\u0646 {0}",goSee:"\u0627\u0630\u0647\u0628 \u0625\u0644\u0649 {0}.",handIn:"\u0633\u0644\u0651\u0645\u0647\u0627 \u0625\u0644\u0649 {0}.",taken:"\u0645\u0647\u0645\u0629 \u062C\u062F\u064A\u062F\u0629: {0}",handed:"\u0623\u0646\u062C\u0632\u062A \u0627\u0644\u0645\u0647\u0645\u0629: {0} (+{1} \u0646\u0642\u0637\u0629)",progress:"{0}: {1} / {2}",readyNote:"{0}: \u062A\u0645! \u0639\u062F \u0625\u0644\u0649 {1}.",noNpc:"\u0644\u0627 \u0623\u062D\u062F \u0644\u0644\u062A\u062D\u062F\u062B \u0645\u0639\u0647 \u0647\u0646\u0627.",allDone:"\u0623\u0646\u0647\u064A\u062A \u0643\u0644 \u0627\u0644\u0645\u0647\u0627\u0645. \u0623\u062D\u0633\u0646\u062A!",reward:"\u0627\u0644\u0645\u0643\u0627\u0641\u0623\u0629: {0}",close:"\u062D\u0633\u0646\u064B\u0627",npcClan:"\u0627\u0644\u0639\u0634\u0627\u0626\u0631",found:"\u062A\u0623\u0633\u064A\u0633 \u0639\u0634\u064A\u0631\u0629",foundLabel:"\u0627\u0633\u0645 \u0639\u0634\u064A\u0631\u062A\u0643",noClan:"\u0644\u0633\u062A \u0641\u064A \u0623\u064A \u0639\u0634\u064A\u0631\u0629.",leader:"\u0627\u0644\u0642\u0627\u0626\u062F",approval:"\u0627\u0644\u0631\u0636\u0627 {0} %",loyalty:"\u0648\u0644\u0627\u0624\u0643 {0} %",members:"\u0627\u0644\u0623\u0639\u0636\u0627\u0621 (\u062D\u0633\u0628 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0645)",join:"\u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645 \u0625\u0644\u0649 \u0639\u0634\u064A\u0631\u0629",quit:"\u0645\u063A\u0627\u062F\u0631\u0629 \u0639\u0634\u064A\u0631\u062A\u064A",callVote:"\u0637\u0644\u0628 \u062A\u0635\u0648\u064A\u062A",vote:"\u0627\u0644\u062A\u0635\u0648\u064A\u062A \u0644\u0644\u0642\u0627\u0626\u062F",voteOn:"\u0627\u0646\u062A\u062E\u0627\u0628: {0}. \u064A\u0646\u062A\u0647\u064A \u0628\u0639\u062F {1} \u062F\u0642\u064A\u0642\u0629.",voted:"\u0635\u0648\u0651\u062A\u062A \u0644\u0640 {0}.",order:"\u0625\u0639\u0637\u0627\u0621 \u0623\u0645\u0631 \u0644\u0644\u0639\u0634\u064A\u0631\u0629",orderLabel:"\u0623\u0645\u0631\u0643 \u0644\u0644\u0639\u0634\u064A\u0631\u0629",lastVote:"\u0622\u062E\u0631 \u062A\u0635\u0648\u064A\u062A: \u0641\u0627\u0632 {0}",ordered:"\u0648\u0635\u0644 \u0623\u0645\u0631\u0643 \u0625\u0644\u0649 {0} \u0623\u0639\u0636\u0627\u0621.",joined:"\u0627\u0646\u0636\u0645\u0645\u062A \u0625\u0644\u0649 {0}.",left:"\u063A\u0627\u062F\u0631\u062A {0}.",founded:"\u0623\u0633\u0633\u062A {0}.",refused:"{0} \u0644\u0627 \u064A\u0642\u0628\u0644\u0643.",atReg:"\u062A\u064F\u0624\u0633\u064E\u0651\u0633 \u0627\u0644\u0639\u0634\u0627\u0626\u0631 \u0639\u0646\u062F \u0623\u0648\u062F\u064A\u0644 \u0641\u064A \u0627\u0644\u0628\u0644\u062F\u0629: \u062A\u062D\u062F\u062B \u0645\u0639\u0647\u0627.",leadAlready:"\u0623\u0646\u062A \u062A\u0642\u0648\u062F \u0639\u0634\u064A\u0631\u0629 \u0628\u0627\u0644\u0641\u0639\u0644.",noVote:"\u0644\u0627 \u064A\u0648\u062C\u062F \u062A\u0635\u0648\u064A\u062A \u0627\u0644\u0622\u0646.",tooSoon:"\u062C\u0631\u0649 \u062A\u0635\u0648\u064A\u062A \u0642\u0628\u0644 \u0642\u0644\u064A\u0644.",notLeader:"\u0627\u0644\u0642\u0627\u0626\u062F \u0648\u062D\u062F\u0647 \u064A\u0639\u0637\u064A \u0627\u0644\u0623\u0648\u0627\u0645\u0631 \u0644\u0644\u0639\u0634\u064A\u0631\u0629.",clanNone:"\u0647\u0630\u0647 \u0627\u0644\u0639\u0634\u064A\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629.",others:"\u0639\u0634\u0627\u0626\u0631 \u0623\u062E\u0631\u0649 \u0647\u0646\u0627",none:"\u0644\u0627 \u0634\u064A\u0621",clanHelp:"\u064A\u0646\u062A\u062E\u0628 \u0627\u0644\u0623\u0639\u0636\u0627\u0621 \u0642\u0627\u0626\u062F\u0647\u0645 (\u0628\u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0645 \u0648\u0627\u0644\u0645\u0634\u0627\u0639\u0631). \u0627\u0644\u0642\u0627\u0626\u062F \u064A\u0639\u0637\u064A \u0627\u0644\u0623\u0648\u0627\u0645\u0631 \u0648\u064A\u062A\u0628\u0639\u0647\u0627 \u0627\u0644\u0623\u0648\u0641\u064A\u0627\u0621. \u064A\u0645\u0643\u0646\u0643 \u062A\u063A\u064A\u064A\u0631 \u0639\u0634\u064A\u0631\u062A\u0643 \u0645\u062A\u0649 \u0634\u0626\u062A.",order0:"\u0623\u0645\u0631 \u0627\u0644\u0642\u0627\u0626\u062F: {0}",rivals:"\u0627\u0644\u062E\u0635\u0648\u0645: {0}"}},kp=()=>["en","fr","es","ar"].includes(Iu())?Iu():"en",ue=(i,...e)=>(Np[kp()][i]??Np.en[i]).replace(/\{(\d)\}/g,(t,n)=>e[Number(n)]??""),On=i=>i[kp()]||i.en,Pt=i=>i.replace(/[&<>"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[e]),Hs=i=>uo(i)?.name??i,Cl=class{constructor(e){this.c=e}c;rows=null;talk=null;clan=null;talkToNpc(){this.talk=null,this.c.send({t:he.Do,a:"npc"}),this.c.push("npc")}rootRows(){return[{id:"quests",label:ue("quests"),sub:!0},{id:"clan",label:ue("clan"),sub:!0}]}page(e){let t=[];switch(e){case"quests":{for(let a of this.rows??[]){let o=ua(a.id);t.push({id:"q:"+a.id,label:`${a.state==="done"?"\u2713 ":a.state==="ready"?"\u2605 ":a.state==="active"?"\u25B6 ":""}${On(o.title)}`,value:a.state==="active"?`${a.n} / ${a.need}`:ue(a.state),dim:a.state==="locked"})}let n=this.rows?.find(a=>a.state==="active"||a.state==="ready"||a.state==="next"),s=n?ua(n.id):void 0,r=s?`<p><b>${Pt(On(s.title))}</b> \xB7 ${Pt(ue("from",Hs(s.npc)))}</p><p>${Pt(On(s.ask))}</p><p class="dim">${Pt(n.state==="next"?ue("goSee",Hs(s.npc)):n.state==="ready"?ue("handIn",Hs(s.npc)):ue("progress",On(s.title),String(n.n),String(n.need)))}</p>`:this.rows?`<p>${Pt(ue("allDone"))}</p>`:"<p>\u2026</p>";return t.length||t.push({id:"back",label:ue("close")}),{id:e,title:ue("quests"),rows:t,wide:!0,html:`${r}<p class="dim">${Pt(ue("qHelp"))}</p>`}}case"npc":{let n=this.talk;if(!n)return{id:e,title:"\u2026",rows:[{id:"back",label:ue("close")}],text:"\u2026"};let s=n.quest?ua(n.quest):void 0,r="";n.state==="taken"&&s?r=ue("taken",On(s.title)):n.state==="handed"&&s?r=ue("handed",On(s.title),String(n.reward?.xp??0))+(n.reward?" \xB7 "+ue("reward",this.rewardText(n.reward)):"")+(n.next?" "+(n.next===n.npc?ue("again"):ue("goSee",Hs(n.next))):""):n.state==="remind"&&s?r=ue("progress",On(s.title),String(n.n??0),String(n.need??1)):n.state==="elsewhere"&&n.next?r=s?ue("handIn",Hs(n.next))+` (${On(s.title)} ${n.n??0}/${n.need??1})`:ue("goSee",Hs(n.next)):n.state==="all"&&(r=ue("allDone")),n.npc==="registrar"&&t.push({id:"found",label:ue("found")},{id:"clan",label:ue("clan"),sub:!0}),t.push({id:"quests",label:ue("quests"),sub:!0},{id:"back",label:ue("close")});let a=uo(n.npc)?On(uo(n.npc).title):n.name;return{id:e,title:a,rows:t,wide:!0,html:`<p>\u201C${Pt(On(n.say))}\u201D</p>${r?`<p><b>${Pt(r)}</b></p>`:""}`}}case"clan":{let n=this.clan;if(!n)return{id:e,title:ue("clan"),rows:[{id:"back",label:ue("close")}],text:"\u2026"};let s=n.mine,r="";return s?(r=`<p><b>${Pt(s.name)}</b> \xB7 ${Pt(ue("leader"))}: <b>${Pt(s.leaderName)}</b> \xB7 ${Pt(ue("approval",String(s.approval)))} \xB7 ${Pt(ue("loyalty",String(s.loyalty)))}</p>`+(s.vote?`<p><b>${Pt(ue("voteOn",s.vote.cands.map(a=>a.name).join(" / "),String(Math.max(0,Math.round((s.vote.end-s.now)/60)))))}</b></p>`:"")+(s.order?`<p>${Pt(ue("order0",s.order))}</p>`:"")+`<p class="dim">${Pt(ue("members"))}: ${s.members.map(a=>`${Pt(a.name)} (${a.respect})`).join(", ")}</p>`+(s.result?`<p class="dim">${Pt(ue("lastVote",s.result.winner))}</p>`:"")+(s.rivals.length?`<p class="dim">${Pt(ue("rivals",s.rivals.map(a=>`${a.name} ${a.tension}/10`).join(", ")))}</p>`:""),s.vote&&t.push({id:"vote",label:ue("vote"),sub:!0,value:s.vote.my>=0?s.vote.cands.find(a=>a.id===s.vote.my)?.name??"":""}),s.lead?t.push({id:"order",label:ue("order")}):s.vote||t.push({id:"call",label:ue("callVote")}),t.push({id:"quit",label:ue("quit")})):r=`<p>${Pt(ue("noClan"))}</p>`,n.others.length&&t.push({id:"join",label:ue("join"),sub:!0}),n.nearReg&&t.push({id:"found",label:ue("found")}),t.push({id:"back",label:ue("close")}),r+=`<p class="dim">${Pt(ue("others"))}: ${n.others.length?n.others.map(a=>`${Pt(a.name)} (${Pt(a.leader)}, ${a.n})`).join(", "):Pt(ue("none"))}</p><p class="dim">${Pt(ue("clanHelp"))}</p>`,{id:e,title:ue("clan"),rows:t,wide:!0,html:r}}case"clanJoin":for(let n of this.clan?.others??[])t.push({id:"j:"+n.id,label:n.name,value:`${n.leader} \xB7 ${n.n} \xB7 ${n.approval} %`});return t.push({id:"back",label:ue("close")}),{id:e,title:ue("join"),rows:t};case"clanVote":for(let n of this.clan?.mine?.vote?.cands??[])t.push({id:"v:"+n.id,label:n.name,value:this.clan.mine.vote.my===n.id?"\u25CF":""});return t.push({id:"back",label:ue("close")}),{id:e,title:ue("vote"),rows:t,text:this.clan?.mine?.vote?.why}}return null}pick(e,t,n){let s=this.c;return t==="quests"&&(e==="root"||e==="npc")?(this.rows=null,s.send({t:he.Do,a:"quests"}),s.push("quests"),!0):t==="clan"&&(e==="root"||e==="npc")?(this.openClan(),!0):e==="quests"?(n(),!0):e==="npc"?t==="found"?(s.keyboard(ue("foundLabel"),r=>s.send({t:he.Do,a:"clan",text:"found:"+r.slice(0,20)})),!0):t==="back"?(n(),!0):!1:e==="clan"?t==="join"?(s.push("clanJoin"),!0):t==="vote"?(s.push("clanVote"),!0):t==="quit"?(s.send({t:he.Do,a:"clan",text:"quit"}),!0):t==="call"?(s.send({t:he.Do,a:"clan",text:"call"}),!0):t==="found"?(s.keyboard(ue("foundLabel"),r=>s.send({t:he.Do,a:"clan",text:"found:"+r.slice(0,20)})),!0):t==="order"?(s.keyboard(ue("orderLabel"),r=>{r.trim()&&s.send({t:he.Do,a:"clan",text:"order:"+r.slice(0,200)})}),!0):t==="back"?(n(),!0):!1:e==="clanJoin"?(t.startsWith("j:")&&s.send({t:he.Do,a:"clan",text:"join:"+t.slice(2)}),n(),!0):e==="clanVote"?(t.startsWith("v:")&&s.send({t:he.Do,a:"clan",text:"vote:"+t.slice(2)}),n(),!0):!1}openClan(){this.clan=null,this.c.send({t:he.Do,a:"clan",text:"info"}),this.c.push("clan")}did(e){let t=this.c;if(e.code==="quests")return this.rows=e.list,t.refresh("quests"),!0;if(e.code==="npc")return this.talk=e.talk,this.rows=e.quests,e.clan&&(this.clan=e.clan),t.refresh("npc"),!0;if(e.code==="noNpc")return t.note(ue("noNpc"),2500),!0;if(e.a!=="clan")return!1;e.clan&&(this.clan=e.clan);let n=String(e.name??""),s={clanJoined:ue("joined",n),clanLeft:ue("left",n),clanFounded:ue("founded",n),clanVoted:ue("voted",n),clanOrdered:ue("ordered",String(e.n??0)),clanRefused:ue("refused",n),clanAtRegistrar:ue("atReg"),clanLeadAlready:ue("leadAlready"),clanNoVote:ue("noVote"),clanTooSoon:ue("tooSoon"),clanNotLeader:ue("notLeader"),clanNone:ue("clanNone"),clanVoteOn:ue("voteOn",this.clan?.mine?.vote?.cands.map(r=>r.name).join(" / ")??"","120")};return s[e.code]&&t.note(s[e.code],3500),t.refresh("clan"),t.refresh("npc"),!0}notice(e,t){if(e==="quest"){let n=t,s=ua(n.quest);s&&this.c.note(n.ready?ue("readyNote",On(s.title),Hs(n.npc)):ue("progress",On(s.title),String(n.n),String(n.need)),3500);let r=this.rows?.find(a=>a.id===n.quest);return r&&(r.n=n.n,n.ready&&(r.state="ready"),this.c.refresh("quests")),!0}if(e==="clanVote"){let n=t;return this.c.note(n.open?`${n.clan}: ${ue("vote")}`:`${n.clan}: ${ue("lastVote","\u2026")}`,4e3),!0}return!1}rewardText(e){let t=[`${e.xp} xp`];for(let[n,s]of Object.entries(e.items??{}))t.push(`${s} ${this.c.thing(n)}`);return e.food&&t.push(`${e.food} ${this.c.thing("food")}`),t.join(", ")}};var qe=new Al,Yb={grass:"step_grass",dirt:"step_dirt",sand:"step_dirt",farm:"step_dirt",ashes:"step_dirt",berries:"step_grass",road:"step_stone",rubble:"step_stone",rock:"step_stone",floor:"step_wood",bed:"step_wood",door:"step_wood",water:"step_water"},Yu=[],qu=0,$u=-1,Bp=0,Gl=-1,Ga=[],Op={zHit:"hit",zKilled:"zombie_die",aHit:"animal_hurt",aKilled:"animal_die",chopped:"chop",mined:"mine",drank:"drink",ate:"eat",picked:"pickup",crafted:"craft",placed:"place",built:"build",swing:"swing",missed:"bow_shot",sleep:"drop",wake:"equip",partners:"reward",married:"levelup",expecting:"reward",noRecipe:"ui_error",noMat:"ui_error",noRoom:"ui_error",noItem:"ui_error",buildNeed:"ui_error",needHut:"ui_error",noBow:"ui_error",noArrows:"ui_error",tooFar:"ui_error"},Kb=["rabbit","deer","boar","wolf_growl","bear_roar"],lm=document.getElementById("c"),zp=document.getElementById("screen"),cm=document.getElementById("top"),hm=document.getElementById("hint"),si=document.getElementById("note"),Ku=document.getElementById("card"),Wi=null,ni="",fn=null,It="connect",Je="play",kl="",us=0,Zu=0,Gn=null,Ot="",Qa=256,eo=256,Cn=128,Rn=128,qi="mid",vt={q:"auto",fog:2,dist:1,fps:!1},Zb=[0,1.6,1,.6],Jb=[.7,1,1.4];function um(){re&&(re.fogK=Zb[vt.fog]??1,re.distK=Jb[vt.dist]??1,re.settingsChanged(),js.hidden=!vt.fps||It!=="world",ai())}var js=document.createElement("div");js.id="fps";js.hidden=!0;document.body.appendChild(js);var Ul=0,Fl=0,Pl=0,jb=!0,re=null,dm=[],Wl=new Uint8Array(256),Ys=new Map,Wa=new Map,Gs=[],qa=0,$a=0,Xr=10,Yr=1,fm=0,ql={radius:.3,walk:1.4,run:3.5},ct=4096,zt=new Int32Array(ct).fill(-1),lt=new Uint8Array(ct),Vr=new Uint8Array(ct),$l=new Uint8Array(ct),Ws=new Uint8Array(ct),pm=new Int32Array(ct),Hp=new Int32Array(ct),mm=new Float64Array(ct),Xl=new Float32Array(ct),Yl=new Float32Array(ct),Ht=new Float32Array(ct),Wt=new Float32Array(ct),Ju=new Float32Array(ct),ju=new Float32Array(ct),Qb=new Float32Array(ct),Il=new Float64Array(256*64),ds=new Float32Array(ct),Oa=new Float32Array(ct),zr=new Float32Array(ct),Qu=new Float32Array(ct),ed=new Float32Array(ct),gm=[],ri=new Map,Kl=0,td=100,wt=-1,Zl=0,Pn=-1,to=!1,vm=0,Ha="",en=0,tn=0,vi=0,xi=0,_n=!1,Jl=150,Bl=0,Ol=0,Vp=!1,Ll=0,rc=0,Ks=!1,rt={left:!1,right:!1,up:!1,down:!1},_t=wl(Or),nd=!1,bi=null,ms=!1,Zs=0,_i=-1,Xa=NaN;function ac(){if(ms)return Zs;if(Number.isFinite(Xa))return Xa;let i=wi();return i>=0?Math.PI/2-ds[i]:0}function id(i,e,t,n,s){let r=-1,a=n;for(let o=0;o<ct;o++){if(zt[o]===-1||lt[o]!==ft.Threat&&lt[o]!==ft.Animal||Vr[o]&xs.Dead)continue;let l=Ht[o]-i,h=Wt[o]-e,c=Math.hypot(l,h);if(c>=a)continue;let u=Math.atan2(h,l)-t;u=Math.atan2(Math.sin(u),Math.cos(u)),Math.abs(u)<=s&&(a=c,r=o)}return r}var Hn=!0,zl=["top","third","first"],yi="top",Mi=0,Ya=!1,xm=0,Ze=null,yn="",Kt={},qs=null,Vs=null,Zt=null,Gp=!1,zn={sex:"m",skin:1},mt=null,Gr="",ym=24,Gt=null,Kr=-1,Wp=0,_m=new Float32Array(ct),bm=new Float32Array(ct),Mm=new Uint32Array(ct),sd=0,fs=0,qt=i=>new le(i),eM=[9132604,7044426,5926790,10124111,8014667,6184558,10512442,5204830,9076586].map(qt),jl=[15845797,14724226,13011806,10250819,7227951].map(qt),tM=[2825492,4861984,8016432,13214826,1710618,9079434].map(qt),nM=[3881536,4865328,3095370,5261373].map(qt),wm={tunic:qt(7038544),skin:qt(10469247),hair:qt(5660746),pants:qt(4080694)},dd={tunic:qt(3122027),skin:qt(15251600),hair:qt(3810326),pants:qt(3817306)},Sm={tunic:qt(14254635),skin:qt(14197370),hair:qt(2825492),pants:qt(4210762)},qp=qt(16765286),iM=qt(16777215),sM=qt(5951999),$p=new Map;function Am(i,e){let t=(i?64:0)+e,n=$p.get(t);if(!n){let s=i?dd:Sm,r=(e&8)!==0;n={tunic:s.tunic,skin:jl[Math.min(jl.length-1,e-1&7)],hair:r?qt(5911584):s.hair,pants:r?s.tunic:s.pants},$p.set(t,n)}return n}function Tm(i){let e=n=>Dt(i&65535,n),t=(n,s)=>n[Math.floor(e(s)*n.length)];return{tunic:t(eM,1),skin:t(jl,2),hair:t(tM,3),pants:t(nM,4)}}function ps(i,e=""){It=i,lm.style.visibility=i==="world"?"visible":"hidden",cm.hidden=hm.hidden=i!=="world",js.hidden=!vt.fps||i!=="world",i!=="world"&&(si.hidden=!0,Ku.hidden=!0,cd="",X?.open&&X.close(),Xs?.hide()),zp.hidden=i==="world";let t="";switch(i){case"connect":t=`<h1>${A("connecting")}</h1>`;break;case"offline":t=`<h1>${A("offline")}</h1><p class="dim">${We(ni)}</p><p class="key">A \xB7 ${A("menuServer")}</p>`;break;case"noserver":t=`<h1>${A("noServer")}</h1><p class="key">${A("enterServer")}</p>`;break;case"pair":t=`<h1>${A("pairTitle")}</h1><p>${A("pairHow")}</p><div class="code">${kl.slice(0,3)} ${kl.slice(3)}</div><p class="dim">${We(rM())}</p><p class="dim">${A("pairWait")}</p>`;break;case"pairfail":t=`<h1>${e}</h1>`;break;case"nogl":t=`<h1>${A("noGl")}</h1>`;break}zp.innerHTML=t,i==="pair"&&MyPC.announce?.(`${A("pairTitle")}. ${kl.split("").join(" ")}`),Qs()}var We=i=>i.replace(/[&<>"']/g,e=>`&#${e.charCodeAt(0)};`),rM=()=>ni.replace(/\/+$/,"")+"/panel/",Xp=0;function xe(i,e=3500){si.textContent=i,si.hidden=!1,clearTimeout(Xp),e>0&&(Xp=window.setTimeout(()=>{si.hidden=!0},e)),MyPC.announce?.(i)}function aM(i){let e=i.trim().replace(/\/+$/,"");return/^[a-z]+:\/\//i.test(e)||(e="https://"+e),e.replace(/^http/i,"ws")+"/ws"}function jr(){if(clearTimeout(Zu),fn&&(fn.onclose=null,fn.close(),fn=null),!ni){ps("noserver");return}It!=="world"&&ps(us>1?"offline":"connect");let i;try{i=new WebSocket(aM(ni))}catch{ps("noserver");return}i.binaryType="arraybuffer",fn=i,i.onopen=()=>{us=0,Wi?.token?i.send(co({t:he.Hello,v:1,token:Wi.token,name:Ql()})):i.send(co({t:he.Pair,v:1,name:Ql(),dev:oM()}))},i.onmessage=e=>lM(Ud(e.data)),i.onclose=()=>{fn===i&&(fn=null,It!=="pairfail"&&(us++,(It!=="world"||us>2)&&ps("offline"),Zu=window.setTimeout(jr,Math.min(15e3,1e3*2**Math.min(us,4)))))}}function Ql(){return String(MyPC.info?.().profile?.name||Wi?.name||"Player")}function oM(){return/Tizen|SMART-TV/i.test(navigator.userAgent)?"Samsung TV":/Android/i.test(navigator.userAgent)?"Android":"Browser"}function Le(i){fn&&fn.readyState===1&&fn.send(co(i))}function lM(i){switch(i.t){case he.PairCode:kl=i.code,ps("pair");break;case he.Paired:Wi={token:i.token,name:i.name,server:ni},MyPC.save("auth",Wi),fn?.close();break;case he.Error:i.code==="auth"?(Wi=null,MyPC.save("auth",null),setTimeout(jr,300)):i.code==="expired"||i.code==="denied"?ps("pairfail",A(i.code==="expired"?"pairExpired":"pairDenied")):i.code==="full"&&xe(A("worldFull"));break;case he.Welcome:{Gn=i,Ya=!!i.seer,dm=Mp(i.tiles),Wl.fill(0);for(let e of i.tiles)e.solid&&(Wl[e.id]=1);Yu=[],Gl=-1,Ga=[];for(let e of i.tiles)Yu[e.id]=Yb[e.name]??"step_dirt",Ga[e.id]=e.name,e.name==="campfire"&&(Gl=e.id);if(i.body&&(ql=i.body),qa=i.clock.gameSec,$a=performance.now(),Xr=i.clock.clockScale,Yr=i.clock.paused?0:i.clock.speed,!re){try{re=new ml(lm,qi)}catch{ps("nogl");return}xp(),ud(),um()}!Ot||!i.maps.some(e=>e.id===Ot)?$s(String(MyPC.load("map",i.maps[0].id))):$s(Ot),ps("world"),Le({t:he.Join,watch:Je==="watch"}),ai();break}case he.You:{Pn=i.id,to=i.transit,Ha=i.map,vm=i.arrive??0,_n=!1,!i.transit&&i.map!==Ot&&$s(i.map),Je==="play"&&i.x!==void 0&&i.y!==void 0&&(Cn=i.x,Rn=i.y,Wn=!0,wt=-1,ai()),Je==="play"&&!Gp&&(Gp=!0,Le({t:he.Do,a:"mine"})),i.transit?xe(se("travelling",Ka(i.map)),0):si.hidden=!0;break}case he.Notice:if(i.kind==="people"&&RM(i.data),i.kind==="interact"){let e=i.data,t=e?ri.get(e.id):void 0;xe(e?e.kind===ft.Player?A("metPlayer"):`${gs(t!==void 0?$l[t]:0)}...`:A("nobody"))}if(i.kind==="say"){let e=i.data;xe(`${e.name}: \u201C${e.text}\u201D`,7e3)}if(i.kind==="did"&&zM(i.data),(i.kind==="quest"||i.kind==="clanVote")&&Jr.notice(i.kind,i.data),i.kind==="me"){let e=i.data.hp??100;$u>=0&&e<$u-1&&qe.play("hurt"),$u=e,Ze=i.data,Ja(),X.open&&(X.page==="bag"||X.page==="cat"||X.page==="guide"||X.page==="fight"||X.page==="inv"||X.page==="gear")&&X.refresh()}if(i.kind==="blocked"&&xe(A(i.data?.why==="door"?"dDoorShut":"dBlocked"),5e3),i.kind==="info"){let e=i.data;e&&e.id===Kr&&(Gt=e,Ja(),X.open&&X.page==="person"&&X.refresh())}i.kind==="minds"&&(Ya=!0,xm=performance.now(),Xs.set(i.data,gs));break;case he.Pong:Jl=Jl*.7+(performance.now()-i.c)*.3;break;case he.Chunk:{if(i.map!==Ot||!Gn)break;let e=oa(i.cx,i.cy);Ys.set(e,i.tiles),uM(e);break}case he.ChunkDrop:if(i.map!==Ot)break;for(let e of i.keys){Ys.delete(e);let t=Wa.get(e);t&&(re?.removeChunk(t),Wa.delete(e))}break;case he.Frame:{if(i.map!==Ot)break;let e=performance.now();td=td*.85+Math.min(400,e-Kl)*.15,Kl=e,qa=i.gameSec,$a=e;for(let s=0;s<ct;s++)zt[s]!==-1&&(Xl[s]=Ht[s],Yl[s]=Wt[s]);let t=mc(i.upd),n=i.gx?mc(i.gx):null;for(let s=0;s<t.length;s+=7){let r=cM(t[s]);if(r<0)continue;let a=lt[r]===0,o=n?n[s/7]??0:0,l=o>>15&127;(l!==Hp[r]||a)&&(Hp[r]=l,mm[r]=e),pm[r]=o,lt[r]=t[s+1]&255,Vr[r]=t[s+1]>>8&255,$l[r]=t[s+1]>>16&255,Ws[r]=t[s+1]>>>24&63,Ht[r]=t[s+2]/100,Wt[r]=t[s+3]/100,Qb[r]=t[s+4]/1e4,Ju[r]=t[s+5]/100,ju[r]=t[s+6]/100,a&&(Xl[r]=Qu[r]=Ht[r],Yl[r]=ed[r]=Wt[r],zr[r]=0,Oa[r]=0,ds[r]=Math.atan2(Ju[r],ju[r])||0,gm[r]=Tm(t[s]))}for(let s of i.del){let r=ri.get(s);r!==void 0&&(zt[r]=-1,lt[r]=0,ri.delete(s)),s===wt&&(wt=-1)}break}case he.Stats:fm=i.s.agents,Yr=i.s.paused?0:i.s.speed;break}}function cM(i){let e=ri.get(i);if(e!==void 0)return e;for(let t=0;t<ct;t++)if(zt[t]===-1)return zt[t]=i,ri.set(i,t),t;return-1}function hM(){zt.fill(-1),lt.fill(0),ri.clear(),wt=-1}var gs=i=>A(["actIdle","actWander","actDrink","actEat","actForage","actSleep","actTalk","actTravel","actRest","actFlee","actGo","actGather","actBuild","actFight"][i]??"actIdle"),Ka=i=>Gn?.maps.find(e=>e.id===i)?.name??i;function uM(i){Gs.includes(i)||Gs.push(i)}function dM(i,e,t){let n=i&65535,s=i>>>16;if(e<0?(n--,e+=32):e>=32&&(n++,e-=32),t<0?(s--,t+=32):t>=32&&(s++,t-=32),n<0||s<0)return-1;let r=Ys.get(oa(n,s));return r?r[t*32+e]:-1}function fM(){if(!Gs.length||!re)return;let i=0,e=1/0,t=In()/32-.5,n=Ln()/32-.5;for(let o=0;o<Gs.length;o++){let l=Gs[o],h=Math.hypot((l&65535)-t,(l>>>16)-n);h<e&&(e=h,i=o)}let s=Gs.splice(i,1)[0];if(!Ys.has(s))return;let r=Wa.get(s);r&&re.removeChunk(r);let a=Tp(s&65535,s>>>16,(o,l)=>dM(s,o,l),dm,qi==="high");Wa.set(s,re.addChunk(a.ground,a.props,a.glow,a.pool))}function $s(i){if(!Gn)return;let e=Gn.maps.find(t=>t.id===i)??Gn.maps[0];Ot=e.id,Qa=e.w,eo=e.h,Cn=e.w/2,Rn=e.h/2,Ys.clear(),Wa.clear(),Gs.length=0,re?.setMap(e.w,e.h,Gn.portals.filter(t=>t.map===Ot)),hM(),_n=!1,Wn=!0,MyPC.save("map",Ot),ai()}function pM(){return re&&re.view!=="top"?Math.min(96,re.sight+10):Math.min(96,((re?.dist??24)*1.2+14)*(re?.distK??1))}function ai(){Gn&&Le({t:he.View,map:Ot,x:In(),y:Ln(),r:pM()})}function wi(){return Pn>=0?ri.get(Pn)??-1:-1}function Si(){return Je==="play"&&Pn>=0&&!to}function In(){return mt?mt.cx:Si()&&_n?en:Cn}function Ln(){return mt?mt.cy:Si()&&_n?tn:Rn}function mM(i){mt&&mt.close(),Gr||(Gr=Ot),i.map!==Ot&&$s(i.map),Je==="play"&&Le({t:he.Input,mx:0,my:0,run:!1,seq:++rc}),rt.left=rt.right=rt.up=rt.down=!1,at.left=at.right=at.up=at.down=!1,!mt&&re&&(ym=re.dist),mt=new yl(i,Ka(i.map),Xr,e=>Tm(e),wm),document.body.classList.add("replaying"),Wn=!0,ai(),MyPC.announce?.(A("rpTitle"))}function Em(){mt&&(mt.close(),mt=null,re&&(re.dist=ym),document.body.classList.remove("replaying"),Gr&&Gr!==Ot&&$s(Gr),Gr="",_n=!1,Wn=!0,ai(),ii("past"))}function Dl(i,e){let t=Math.floor(i),n=Math.floor(e);if(t<0||n<0||t>=Qa||n>=eo)return!0;let s=Ys.get(oa(t/32|0,n/32|0));return s?Wl[s[n%32*32+t%32]]===1:!1}function Wr(i,e){let t=Math.floor(i),n=Math.floor(e);if(t<0||n<0||t>=Qa||n>=eo)return-1;let s=Ys.get(oa(t/32|0,n/32|0));return s?s[n%32*32+t%32]:-1}function gM(i,e){let t=Wr(i,e);return Yu[t]??"step_dirt"}function vM(i){if(i-Bp<1e3)return;if(Bp=i,It!=="world"||mt){for(let r of["amb_day","amb_night","amb_woods","fire_loop"])qe.loop(r,0);return}let e=(((qa+(i-$a)/1e3*Xr*Yr)/3600+8)%24+24)%24,t=e<5.5||e>=20.5,n=/wood|forest/i.test(Ot);qe.loop("amb_night",t?.8:0),qe.loop("amb_woods",!t&&n?.8:0),qe.loop("amb_day",!t&&!n?.6:0);let s=99;if(Gl>=0){let r=Math.floor(In()),a=Math.floor(Ln());for(let o=a-9;o<=a+9;o++)for(let l=r-9;l<=r+9;l++)Wr(l+.5,o+.5)===Gl&&(s=Math.min(s,Math.hypot(l+.5-In(),o+.5-Ln())))}qe.loop("fire_loop",s<9?Math.min(1,(1-s/9)*1.2):0)}function Yp(i,e){let t=ql.radius*.9;return Dl(i-t,e-t)||Dl(i+t,e-t)||Dl(i-t,e+t)||Dl(i+t,e+t)}function fd(){if(X.open||bt.open)return qr[0]=qr[1]=0,qr;let i=MyPC.gamepad?MyPC.gamepad.axis(0):0,e=MyPC.gamepad?MyPC.gamepad.axis(1):0;Math.hypot(i,e)<.18&&(i=0,e=0),(rt.left||at.left)&&(i=-1),(rt.right||at.right)&&(i=1),(rt.up||at.up)&&(e=-1),(rt.down||at.down)&&(e=1);let t=Math.hypot(i,e);return t>1&&(i/=t,e/=t),[i,e]}var Kp=[0,0],qr=[0,0];function xM(i){if(X.open||bt.open)return qr[0]=qr[1]=0,qr;let e=MyPC.gamepad,t=e?e.axis(0):0,n=e?e.axis(1):0,s=e?e.axis(2):0;Math.hypot(t,n)<.18&&(t=0,n=0),Math.abs(s)<.2&&(s=0);let r=s*Math.abs(s)+(rt.right?1:0)-(rt.left?1:0);Mi+=r*2.4*i,!t&&!n&&(t=(at.right?1:0)-(at.left?1:0),n=(at.down?1:0)-(at.up?1:0));let a=-n+(rt.up?1:0)-(rt.down?1:0),o=t,l=Math.sin(Mi),h=-Math.cos(Mi),c=l*a-h*o,u=h*a+l*o,d=Math.hypot(c,u);return d>1&&(c/=d,u/=d),Xu[0]=c,Xu[1]=u,Xu}var Xu=[0,0],bt=new Sl(document.getElementById("wheel")),yM=["use","eat","drink","sleep","build","place","bag","camera","attackPerson"],_M={use:"\u270B",eat:"\u{1F356}",drink:"\u{1F4A7}",sleep:"\u{1F6CF}",build:"\u{1F528}",place:"\u{1F9F1}",bag:"\u{1F392}",camera:"\u{1F3A5}",attackPerson:"\u2694\uFE0F"},bM={use:"qUse",eat:"qEat",drink:"qDrink",sleep:"qSleep",build:"aBuild",place:"qPlace",bag:"qBag",camera:"qCamera",attackPerson:"aAttackPerson"};function pd(i,e){if(!(It!=="world"||X.open||mt)){if(i){if(bt.open){e||bt.close();return}if(Je!=="play"||!Si())return;rt.left=rt.right=rt.up=rt.down=!1,at.left=at.right=at.up=at.down=!1,Ks=!1;let t=yM.map(n=>({id:n,icon:_M[n],label:n==="place"?TM():A(bM[n])}));bt.show(t,e,A(e?"wheelHelp":"wheelRemote"));return}if(!(!e||!bt.hold)){if(bt.sel<0&&performance.now()-bt.openedAt<350){bt.hold=!1;return}lc(bt.close())}}}function Cm(){let i=Ze?.inv??{};for(let e of Zi)if((i[e]??0)>0)return e;return null}var De=null,rd=8,Rm=[[0,1],[1,0],[0,-1],[-1,0]],Zp=new Set(["grass","dirt","sand","ashes","road"]),MM=new Set(["woodwall","palisade","stonewall","floor"]),wM={palisade:1.3,spikes:.5,stonewall:1.3,door:1.5,window:1.2,bed:.35,lamp:1.6,campfire:.3};function ec(i){if(Je!=="play"||!Si())return;X.close(),bt.open&&bt.close(),ms&&vd(!1);let e=ac(),t=In(),n=Ln();if(rt.left=rt.right=rt.up=rt.down=!1,at.left=at.right=at.up=at.down=!1,Ks=!1,i==="hut"){let s=t+Math.cos(e)*4.5,r=n+Math.sin(e)*4.5,a=t-s,o=n-r,l=Math.abs(a)>Math.abs(o)?a>0?1:3:o>0?0:2;De={what:i,tx:Math.floor(s-2),ty:Math.floor(r-2),dir:l,moveAt:0,sent:!1}}else De={what:i,tx:Math.floor(t+Math.cos(e)*1.6),ty:Math.floor(n+Math.sin(e)*1.6),dir:0,moveAt:0,sent:!1};qe.play("ui_open"),no()}function Js(){De&&(De=null,re?.ghost(null),si.hidden=!0,Qs())}function oc(i){let e=In(),t=Ln(),n=(a,o)=>{for(let l=0;l<ct;l++)if(zt[l]!==-1&&(lt[l]===ft.Agent||lt[l]===ft.Player)&&Math.abs(Ht[l]-a-.5)<.9&&Math.abs(Wt[l]-o-.5)<.9)return!0;return!1};if(i.what==="hut"){let a=Math.max(i.tx,Math.min(i.tx+4,e-.5)),o=Math.max(i.ty,Math.min(i.ty+4,t-.5));if(Math.hypot(a+.5-e,o+.5-t)>rd)return"tooFar";let[l,h]=Rm[i.dir],c=i.tx+2+l*2,u=i.ty+2+h*2;for(let m=0;m<5;m++)for(let g=0;g<5;g++){let v=Wr(i.tx+g+.5,i.ty+m+.5);if(v<0)return"unknown";if(!Zp.has(Ga[v]??""))return"noRoom";if((g===0||m===0||g===4||m===4)&&!(i.tx+g===c&&i.ty+m===u)&&n(i.tx+g,i.ty+m))return"someone"}let d=Wr(i.tx+2+l*3+.5,i.ty+2+h*3+.5);return d<0||Wl[d]?"doorBlocked":""}if(Math.hypot(i.tx+.5-e,i.ty+.5-t)>rd)return"tooFar";let s=Wr(i.tx+.5,i.ty+.5);if(s<0)return"unknown";let r=Ga[s]??"";return!Zp.has(r)&&r!=="floor"&&!((i.what==="door"||i.what==="window")&&MM.has(r))?"noRoom":i.what!=="bed"&&i.what!=="campfire"&&n(i.tx,i.ty)?"someone":""}var Pm={tooFar:"cTooFar",someone:"cSomeone",doorBlocked:"cDoorBlocked",noRoom:"cNoRoom",unknown:"cUnknown"};function no(){if(!De)return;let i=oc(De),e=De.what==="hut"?A("bHut2").replace(/ \(.*$/,""):Vn(Bt(De.what)),t=fs?se("plPad",String(MyPC.gamepad?.label?.(0)??"A"),De.what==="hut"?`${String(MyPC.gamepad?.label?.(2)??"X")} / ${Zr("build")||"Y"}`:"\u2014",String(MyPC.gamepad?.label?.(1)??"B")):se("plRemote",De.what==="hut"?Zr("build")||"CH+":"\u2014"),n=De.what==="hut"?" \xB7 "+se("plDoor",A(["dirS","dirE","dirN","dirW"][De.dir])):"";xe(`${se("plTitle",e)} \xB7 ${i?se("plBad",A(Pm[i]??"cNoRoom")):A("plOk")}${n} \u2014 ${t}`,0)}function Va(i,e){if(!De)return;let t=De,n=t.what==="hut"?5:1,s=Math.max(0,Math.min(Qa-n,t.tx+i)),r=Math.max(0,Math.min(eo-n,t.ty+e)),a=s+n/2,o=r+n/2;if(Math.hypot(a-In(),o-Ln())>rd+n/2+.8){qe.play("ui_error");return}t.tx=s,t.ty=r,qe.play("ui_move",void 0,void 0,.5),no()}function Za(){!De||De.what!=="hut"||(De.dir=(De.dir+1)%4,qe.play("ui_move"),no())}function tc(){if(!De||De.sent)return;let i=oc(De);if(i&&i!=="unknown"){qe.play("ui_error"),xe(se("plBad",A(Pm[i]??"cNoRoom")),2e3),setTimeout(no,2e3);return}De.sent=!0,Le({t:he.Do,a:"build",text:`${De.what}#${De.tx},${De.ty},${De.dir}`}),xe(A("plSent"),0)}function SM(i){if(!De)return;let[e,t]=fd();if(re&&re.view!=="top"){let n=-t,s=e,r=Math.sin(Mi),a=-Math.cos(Mi);e=r*n-a*s,t=a*n+r*s}if(Math.hypot(e,t)<.5){De.moveAt=0;return}i<De.moveAt||(De.moveAt=i+(De.moveAt?140:300),Math.abs(e)>Math.abs(t)*1.2?Va(Math.sign(e),0):Math.abs(t)>Math.abs(e)*1.2?Va(0,Math.sign(t)):Va(Math.sign(e),Math.sign(t)))}function AM(){if(!re)return;if(!De||Je!=="play"){re.ghost(null);return}let i=De,e=!oc(i),t=[];if(i.what==="hut"){let[n,s]=Rm[i.dir],r=i.tx+2+n*2,a=i.ty+2+s*2;for(let o=0;o<5;o++)for(let l=0;l<5;l++){let h=i.tx+l,c=i.ty+o,u=l===0||o===0||l===4||o===4;t.push(h,c,h===r&&c===a?1.5:u?1.2:0)}re.ghost(t,e,[r+.5+n*1.1,a+.5+s*1.1,Math.atan2(s,n)])}else t.push(i.tx,i.ty,wM[i.what]??.8),re.ghost(t,e)}function TM(){let i=Cm();return i?se("cPut",Bt(i)):A("qPlace")}function lc(i){if(i){if(i==="camera"){cc();return}if(i==="bag"){ii("inv");return}if(i==="place"){let e=Cm();e?ec(e):xe(A("qNothing"),2e3);return}Gi(i,!0)}}function cc(i){yi=i??zl[(zl.indexOf(yi)+1)%zl.length],MyPC.save("cam",yi);let e=wi();yi!=="top"&&e>=0&&(Mi=Math.PI-ds[e]),re&&(re.yaw=Mi),Wn=!0,xe(`${A("sCamera")}: ${Im(yi)}`,1500),Qs(),ai()}function Im(i){return A(i==="top"?"camTop":i==="third"?"camThird":"camFirst")}function EM(i,e){let[t,n]=De?[0,0]:re&&re.view!=="top"?xM(i):fd();if(De&&SM(e),ms){Math.hypot(t,n)>.35&&(Zs=Math.atan2(n,t)),t=n=0;let y=wi();y>=0&&(_i=id(_n?en:Ht[y],_n?tn:Wt[y],Zs,22,.14))}Kp[0]=t,Kp[1]=n;let s=Ks&&!X.open,r=wi();if(r<0)return;_n||(en=Ht[r],tn=Wt[r],vi=xi=0,_n=!0);let a=s?ql.run:ql.walk,o=t*a,l=n*a,h=o-vi,c=l-xi,u=Math.hypot(h,c),d=8*i,m=u>d?d/u:1;vi+=h*m,xi+=c*m;let g=en+vi*i;Yp(g,tn)?vi=0:en=g;let v=tn+xi*i;Yp(en,v)?xi=0:tn=v;let p=Math.abs(vi)+Math.abs(xi)>.01;p&&(qu+=Math.hypot(vi,xi)*i,qu>(s?.9:.68)&&(qu=0,qe.play(gM(en,tn),void 0,void 0,s?.6:.42))),Math.abs(vi)+Math.abs(xi)>.3&&(Xa=Math.atan2(xi,vi));let f=Math.round(t*50)/50,w=Math.round(n*50)/50;((f!==Bl||w!==Ol)&&(e-Ll>50||!f&&!w||!Bl&&!Ol)||s!==Vp||(p||im)&&e-Ll>100)&&(Bl=f,Ol=w,Vp=s,Ll=e,im=p,Le({t:he.Input,mx:f,my:w,run:s,seq:++rc,x:Math.round(en*100)/100,y:Math.round(tn*100)/100}));let S=Math.min(.5,(e-Kl)/1e3+Jl/2e3),x=Ht[r]+Ju[r]*S,I=Wt[r]+ju[r]*S,R=x-en,T=I-tn,C=Math.hypot(R,T);if(C>3)en=x,tn=I,vi=xi=0;else if(!p&&!f&&!w&&C>.4&&e-Ll>600){let y=1-Math.exp(-i*2);en+=R*y,tn+=T*y}}function Lm(){if(!Gn)return;let i=Gn.maps.findIndex(e=>e.id===Ot);$s(Gn.maps[(i+1)%Gn.maps.length].id),MyPC.announce?.(Ka(Ot))}function nc(i){if(re){if(re.view==="third"){re.back=Math.max(3.5,Math.min(14,re.back*i)),MyPC.save("back",re.back);return}re.view!=="first"&&(re.dist=Math.max(12,Math.min(70,re.dist*i)),MyPC.save("dist",re.dist))}}function Dm(){Pn<0||(!to&&Ha&&Ha!==Ot&&$s(Ha),wt=Pn,Zl=performance.now(),Wn=!0,ai(),MyPC.announce?.(A("followingMe")))}function ad(){let i=-1,e=1/0,t=-1,n=1/0,s=wt>=0?ri.get(wt)??-1:-1,r=s>=0?Math.hypot(Ht[s]-Cn,Wt[s]-Rn):-1;for(let o=0;o<ct;o++){if(zt[o]===-1||lt[o]!==ft.Agent&&lt[o]!==ft.Player||o===s||zt[o]===Pn)continue;let l=Math.hypot(Ht[o]-Cn,Wt[o]-Rn);l<e&&(e=l,i=o),l>r&&l<n&&(n=l,t=o)}let a=s>=0&&t>=0?t:i;if(a>=0&&(s<0||t>=0)){wt=zt[a],MyPC.announce?.(`${A("following")} #${wt&65535}`);return}Le({t:he.Who,map:Ot})}var CM=0;function RM(i){let e=i.filter(n=>n[0]!==Pn);if(!e.length){xe(A("nobody"));return}let t=e[CM++%e.length];Cn=t[1],Rn=t[2],wt=t[0],Zl=performance.now(),Wn=!0,ai(),MyPC.announce?.(`${A("following")} #${wt&65535}`)}function PM(){let[i,e]=fd();if(i||e){wt=-1;let t=(re?.dist??24)/24*.35;Cn=Math.max(0,Math.min(Qa,Cn+i*t)),Rn=Math.max(0,Math.min(eo,Rn+e*t))}if(wt>=0){let t=ri.get(wt);t!==void 0?(Cn=Ht[t],Rn=Wt[t],Zl=performance.now()):performance.now()-Zl>4e3&&(wt=-1)}}function IM(i){if(Je=i,MyPC.save("how",i),Nm(),Qs(),i==="play")Le({t:he.Join}),_n=!1,Wn=!0;else{Le({t:he.Join,watch:!0}),Pn>=0&&window.setTimeout(Dm,400),Le({t:he.Input,mx:0,my:0,run:!1,seq:++rc});let e=wi();e>=0&&(Cn=Ht[e],Rn=Wt[e])}}async function md(){let i=MyPC.text?.keyboard?await MyPC.text.keyboard({value:ni,kind:"url",label:A("serverLabel"),ok:"OK"}):window.prompt(A("serverLabel"),ni);i===null||!i.trim()||(ni=i.trim(),MyPC.save("server",ni),us=0,jr())}function LM(){Wi=null,MyPC.save("auth",null),us=0,jr()}function Nm(){MyPC.setMenu([{id:"game",label:A("gameMenuItem")},{id:"server",label:A("menuServer")}])}function Qs(){let i=r=>{if(fs){let o=_t.pad[r];return o===void 0?"":String(MyPC.gamepad?.label?.(o)??MyPC.gamepad?.name?.(o)??o)}let a=_t.remote[r];return a?Fa(a):""},e=(r,a)=>{let o=i(r);return o?`${o}: ${a}`:""},n=Je==="play"&&yi!=="top"?`${A("hMove")}: ${fs?"stick":"\u2191 \u2193"} \xB7 ${A("hTurn")}: ${fs?"R stick":"\u2190 \u2192"}`:`${A("hMove")}: ${fs?"stick":"\u2190 \u2191 \u2192 \u2193"}`,s=Je==="play"?[n,e("use",cn("use").replace(/ \(.*\)$/,"")),e("talk",cn("talk")),e("attack",cn("attack")),e("aim",cn("aim").replace(/ \(.*\)$/,"")),e("run",cn("run")),e("wheel",A("aWheel").replace(/ \(.*\)$/,"")),e("build",cn("build")),e("menu",cn("menu"))]:[n,e("use",A("wFollow")),e("eat",A("wMap")),e("sleep",A("wCard")),e("menu",cn("menu"))];fs||s.push(A("hintMenu")),hm.textContent=s.filter(Boolean).join(" \xB7 ")}function gd(i){let e=In(),t=Ln(),n=-1,s=i;for(let r=0;r<ct;r++){if(zt[r]===-1||lt[r]!==ft.Agent)continue;let a=Math.hypot(Ht[r]-e,Wt[r]-t);a<s&&(s=a,n=zt[r])}return n}function DM(i){let e=In(),t=Ln(),n=1/0,s=1/0;for(let r=0;r<ct;r++){if(zt[r]===-1||lt[r]!==ft.Npc&&lt[r]!==ft.Agent)continue;let a=Math.hypot(Ht[r]-e,Wt[r]-t);lt[r]===ft.Npc?n=Math.min(n,a):s=Math.min(s,a)}return n<i&&n<=s}function Gi(i,e){if(i==="run"){Ks=e;return}if(i==="aim"){vd(e);return}if(!(!e||It!=="world")){switch(i){case"menu":ii();return;case"zoomIn":nc(1/1.2);return;case"zoomOut":nc(1.2);return;case"thoughts":Hn=!Hn,MyPC.save("thoughts",Hn),Hn||Xs.hide(),xe(`${A("sThoughts")}: ${A(Hn?"on":"off")}`,1500);return;case"person":ii("person");return;case"camera":Je==="play"&&cc();return;case"wheel":pd(!0,!1);return;case"build":De?Za():Je==="play"&&ii("build");return}if(Je==="watch"){i==="use"?ad():i==="eat"?Lm():i==="sleep"&&ii("person");return}if(Si()){if(i==="use"){Le({t:he.Do,a:"take"});return}if(i==="attack"){NM();return}if(i==="attackPerson"){if(!Ze?.pvp){xe(A("pvpNeed"),3e3);return}Le({t:he.Do,a:"hitperson",text:ac().toFixed(3)});return}if(i==="talk"){if(DM(3.5)){Jr.talkToNpc();return}if(gd(3.5)<0){xe(A("dNobodyNear"),2e3);return}if(Le({t:he.Do,a:"hold"}),rt.left=rt.right=rt.up=rt.down=!1,at.left=at.right=at.up=at.down=!1,Ks=!1,UM()){BM();return}km();return}Le({t:he.Do,a:i})}}}function NM(){let i=Ze?.inv??{},e=(i.bow??0)>0&&(i.arrows??0)>0,t=In(),n=Ln(),s=ac();if(ms){if(!e){xe(A((i.bow??0)>0?"noArrows":"noBow"),3500);return}let a=_i>=0&&zt[_i]!==-1?Math.atan2(Wt[_i]-n,Ht[_i]-t):Zs;Le({t:he.Do,a:"shoot",text:a.toFixed(3)});return}if(id(t,n,s,2.6,1.2)<0&&e){let a=id(t,n,s,20,.45);if(a>=0){Le({t:he.Do,a:"shoot",text:Math.atan2(Wt[a]-n,Ht[a]-t).toFixed(3)});return}}Le({t:he.Do,a:"hit",text:s.toFixed(3)})}function vd(i){if(i!==ms&&!(i&&(Je!=="play"||!Si()||X.open||It!=="world")))if(ms=i,i){Zs=Number.isFinite(Xa)?Xa:ac();let e=Ze?.inv??{};(e.bow??0)<1?xe(A("noBow"),3500):(e.arrows??0)<1?xe(A("noArrows"),3500):xe(se("aimOn",Zr("attack")),2500)}else _i=-1,re?.aim(!1)}function Zr(i){if(fs){let t=_t.pad[i];return t===void 0?"":String(MyPC.gamepad?.label?.(t)??MyPC.gamepad?.name?.(t)??t)}let e=_t.remote[i];return e?Fa(e):""}var kM={},Vn=i=>i.charAt(0).toUpperCase()+i.slice(1);function Bt(i){let e=Yi.includes(i)||i==="meat"?"r"+Vn(i):Bd.includes(i)?"an"+Vn(i):"x"+Vn(i),t=A(e);return t===e?i:t}function Vi(i){return Object.entries(i).map(([e,t])=>`${t} ${Bt(e)}`).join(" + ")}function Jp(i){return i?Object.entries(i).filter(([,e])=>e>0).map(([e,t])=>`${t} ${Bt(e)}`).join(", "):""}function za(i){return A("k"+Vn(i))}var Hl=!1;function UM(){try{return(MyPC.apiLevel??0)>=24&&!!MyPC.stt?.enabled?.()}catch{return!1}}var jp="",Qp=0;function od(i){let e=(i??"").trim(),t=performance.now();e&&e===jp&&t-Qp<3e3||(jp=e,Qp=t,ld(e))}function ld(i){let e=(i??"").trim();Le(e?{t:he.Do,a:"talk",text:e.slice(0,300)}:{t:he.Do,a:"talk"})}function km(){if(!MyPC.text?.keyboard){ld("");return}MyPC.text.keyboard({value:"",kind:"text",label:A("sayLabel"),ok:"OK"}).then(i=>ld(i))}function FM(){let i=new Set;Gt?.name&&i.add(Gt.name);for(let[,e]of qs??[])i.add(e);return[...i].slice(0,30)}function BM(){if(Hl){MyPC.stt.stop?.();return}Hl=!0,xe(A("listening"),0),MyPC.stt.listen({maxSeconds:10,hint:FM()}).then(i=>{si.hidden=!0,od(i.text)}).catch(i=>{si.hidden=!0,!(i?.code==="nothing"||i?.code==="cancelled")&&km()}).finally(()=>{Hl=!1})}function OM(i){if(Hl){od(i.text);return}if(It!=="world"||!Si()||mt||gd(2.8)<0){xe(`\u201C${i.text}\u201D`,2500);return}Le({t:he.Do,a:"hold"}),od(i.text)}function zM(i){if(Jr.did(i))return;if(i.a==="build"&&De&&(i.ok?Js():(De.sent=!1,setTimeout(no,3200))),i.a==="build"){let l={tooFar:"dTooFar",someone:"dSomeone",doorBlocked:"dDoorBlocked"};if(l[i.code]){qe.play("ui_error"),xe(A(l[i.code]),3e3);return}if(i.code==="needHut"){qe.play("ui_error"),xe(se("needHut2",Vi(la)),3500);return}}i.a==="shoot"?(qe.play("bow_shot"),i.ok&&setTimeout(()=>qe.play("arrow_hit"),180)):Op[i.code]&&qe.play(Op[i.code],void 0,void 0,i.code==="zKilled"?.9:1),i.code==="chopped"&&i.got?.wood&&Math.random()<.25&&qe.play("tree_fall",void 0,void 0,.6);let e=i;if(e.me&&(Zt=e.me,X.open&&(X.page==="me"||X.page==="rules"||X.page==="look"||X.page==="family")&&X.refresh(),!Zt.chose&&Je==="play"&&It==="world"&&!X.open&&(zn.sex=Zt.sex,zn.skin=Zt.skin,ii("look"))),i.code==="mine")return;let t={looked:"looked",sexPregnant:"sexPregnant",autoOn:"autoOn",autoOff:"autoOff",ruleAdded:"ruleAdded",ruleRemoved:"ruleRemoved",rulesFull:"rulesFull",built:"built",needHut:"needHut",expecting:"expecting",tooFar:"tooFar",kinSet:"kinSet",kinRefused:"kinRefused",kinDropped:"kinDropped",kinAlready:"kinAlready",kinOnlyPlayers:"kinOnlyPlayers",kidFed:"kidFed",kidWater:"kidWater",kidUp:"kidUp",kidDown:"kidDown",kidBed:"kidBed",kidNone:"kidNone",kidNotMine:"kidNotMine",kidFar:"kidFar"};if(t[i.code]){xe(A(t[i.code]),3e3),i.code==="looked"&&X.page==="look"&&X.back();return}if(i.code==="sexWeek"){xe(se("sexWeek",String(e.days??7)),3500);return}if(i.code==="partners"){xe(se("partners",i.name??""),4e3);return}if(i.code==="kinAsked"||i.code==="kinYes"||i.code==="kinNo"){xe(se(i.code,i.name??""),4e3);return}if(i.code==="kinAskedYou"){xe(se("kinAskedYou",i.name??"",A("role"+String(i.role??"child"))),7e3),Le({t:he.Do,a:"mine"});return}if(i.code==="married"||i.code==="divorced"){xe(se(i.code,i.name??""),6e3),X.open&&X.page==="me"&&Le({t:he.Do,a:"mine"});return}if(i.code==="asking"){xe(se(e.what==="divorce"?"askingDivorce":"askingMarry",i.name??""),4e3);return}if(i.code==="why"){xe(e.why??"",4e3);return}if(i.code==="replays"){Vs=i.list,X.page==="past"&&X.refresh();return}if(i.code==="replay"){mM(i.rec);return}if(i.code==="noReplay"){xe(A("pastNone"),2500);return}if(i.code==="roster"){qs=i.list??[],X.page==="goto"&&X.refresh();return}if(i.code==="tp"){en=Cn=i.x??en,tn=Rn=i.y??tn,Wn=!0,ai(),xe(se("dTp",i.name??""),3e3);return}let n=i,s=n.left!==void 0?" "+se("arrowsLeft",String(n.left)):"";if(i.code==="zHit"||i.code==="zKilled"){xe(A(i.code)+s,1800);return}if(i.code==="swing"){xe(A("dSwing"),1200);return}if(i.code==="pvp"){xe(A(e.on?"pvpNoteOn":"pvpNoteOff"),4e3);return}if(i.code==="pvpOff"){xe(A("pvpNeed"),3e3);return}if(i.code==="theirPvpOff"){xe(A("theirPvpOff"),2500);return}if(i.code==="pHit"){xe(se("pHit",String(e.dmg??0)),1500);return}if(i.code==="noBow"||i.code==="noArrows"){xe(A(i.code),3500);return}if(i.code==="missed"){xe(se("missed",String(n.left??0)),1800);return}if(i.code==="buildNeed"){xe(se("buildNeed",Vi(n.need??{})),3500);return}if(n.kept){xe(A("bKept"),3500);return}if(i.code==="aHit"){xe(se("aHit",Bt(i.item??""))+s,1500);return}if(i.code==="aKilled"){xe(se("aKilled",Bt(i.item??""),Jp(n.got)),3500);return}if(i.code==="mined"&&!Object.keys(n.got??{}).length){xe(A("dHard"),1200);return}if(i.code==="chopped"||i.code==="mined"){xe(se("dGot",Jp(n.got)),1500);return}if(i.code==="equipped"){xe(A("dEquipped"),1500);return}if(i.code==="upgraded"){xe(se("dUpgraded",Vn(Bt(n.item??"")),`+${n.lv??0} ${A("qual"+(n.q??0))}`),3e3);return}if(i.code==="upNeed"){xe(se("dUpNeed",Vi(n.need??{})),3500);return}if(i.code==="needLevel"){xe(se("dNeedLevel",String(n.need?.level??"")),3e3);return}if(i.code==="maxLevel"||i.code==="maxQuality"||i.code==="notCarried"){xe(A(i.code==="maxLevel"?"dMaxLevel":i.code==="maxQuality"?"dMaxQuality":"dNotCarried"),2500);return}if(i.code==="crafted"){hd.clear();for(let l of Object.keys(Kt))delete Kt[l];xe(se("dCrafted",Bt(i.item??"")),2500),X.refresh();return}if(i.code==="placed"){xe(se("dPlaced",Bt(i.item??"")),2500);return}let r={noRecipe:"dNoRecipe",noMat:"dNoMat",noRoom:"dNoRoom",noItem:"dNoItem",tooThick:"dTooThick"};if(r[i.code]){xe(A(r[i.code]),2800);return}if(i.code==="wait")return;if(i.code==="full"&&i.a==="craft"){xe(A("dBagFull"),2500);return}let o={drank:"dDrank",picked:"dPicked",ate:"dAte",sleep:"dSleep",wake:"dWake",noWater:"dNoWater",nothing:"dNothing",noFood:"dNoFood",full:"dFull",talk:"dTalk",nobody:"dNobody"}[i.code];o&&xe(o==="dPicked"?se("dPicked",kM[i.item??""]??i.item??""):A(o),2500)}var cd="";function Ja(){let i="";It==="world"&&!X.open&&(Je==="play"&&Ze?i=`<div class="pn">${We(Ql())}</div><div class="pbars">${En(A("nFood"),Ze.hunger)}${En(A("nWater"),Ze.thirst)}${En(A("nRest"),Ze.tired)}${Ze.hp!==void 0&&Ze.hp<100?En(A("nHp"),100-Ze.hp):""}</div><div class="pa">${Ze.asleep?gs(5):""}${Ze.carry?(Ze.asleep?" \xB7 ":"")+se("carry",String(Ze.carry)):""}</div>`:Je==="watch"&&wt>=0&&Gt&&Gt.id===wt&&(i=Hu(Gt,gs,!1))),i!==cd&&(cd=i,Ku.innerHTML=i,Ku.hidden=!i)}function xd(){return Je==="watch"?wt:gd(10)}function Nl(i){return A(i?"on":"off")}function HM(i){let e=_t.pad[i],t=_t.remote[i];return`${e===void 0?A("cNone"):String(MyPC.gamepad?.label?.(e)??MyPC.gamepad?.name?.(e)??e)} \xB7 ${t?Fa(t):A("cNone")}`}function VM(i){{let t=Jr.page(i);if(t)return t}let e=[];switch(i){case"inv":return{id:i,title:A("invTitle"),rows:e,big:!0,html:hd.html(),grid:hd};case"gear":return{id:i,title:A("gearTitle"),rows:e,big:!0,html:ic.html(),grid:ic};case"root":return e.push({id:"resume",label:A("mResume")}),Je==="play"&&e.push({id:"me",label:A("mMe"),sub:!0},{id:"actions",label:A("mActions"),sub:!0},{id:"build",label:A("bTitle"),sub:!0},{id:"inv",label:A("invTitle"),sub:!0},{id:"gear",label:A("mGear"),sub:!0},{id:"fight",label:A("mFight"),sub:!0},{id:"goto",label:A("mGoTo"),sub:!0},...Jr.rootRows()),xd()>=0&&e.push({id:"person",label:Je==="play"?A("mNearby"):A("mPerson"),sub:!0}),Je==="watch"&&e.push(...Pn>=0?[{id:"mine",label:A("mFollowMe")}]:[],{id:"next",label:A("mNextPerson")},{id:"map",label:A("mNextMap")}),e.push({id:"past",label:A("mPast"),sub:!0}),e.push({id:"how",label:A(Je==="play"?"mWatch":"mPlay")}),e.push({id:"settings",label:A("mSettings"),sub:!0},{id:"controls",label:A("mControls"),sub:!0}),{id:i,title:A("mTitle"),rows:e};case"build":{let t=Ze?.inv??{},n=Object.entries(la).every(([r,a])=>(t[r]??0)>=a);e.push({id:"b:hut",label:se("bHut2",Vi(la)),value:n?A("cHave"):A("bMissing"),dim:!n});for(let r of Zi){let a=Ki.find(h=>h.what===r),o=t[r]??0,l=!!a&&Object.entries(a.need).every(([h,c])=>(t[h]??0)>=c);e.push({id:"b:"+r,label:`${Vn(Bt(r))}${a?" ("+Vi(a.need)+")":""}`,value:o?se("bInBag",String(o)):l?A("cHave"):A("bMissing"),dim:!o&&!l})}let s=Yi.filter(r=>(t[r]??0)>0).map(r=>`${t[r]} ${Bt(r)}`).join(", ");return{id:i,title:A("bTitle"),rows:e,wide:!0,html:`<p>${We(A("bHelp2"))}</p>${s?`<p class="dim">${We(A("fHave"))}: ${We(s)}</p>`:""}`}}case"fight":{let t=o=>{let l=Ki.find(h=>h.what===o);return l?Vi(l.need):"\u2014"},n=Ze?.inv??{},s=[A("fightHelp"),se("fFists","15")];for(let[o,l]of Object.entries(ho))s.push(se("fWeapon",Vn(Bt(o)),String(l),t(o)));s.push(se("fBow",t("bow"),t("arrows")),A("fArmour"),A("fTips"),A("pvpHelp"));let r=`${cn("attack")}: <b>${We(Zr("attack")||A("cNone"))}</b> \xB7 ${We(cn("aim"))}: <b>${We(Zr("aim")||A("cNone"))}</b>`,a=["sword","spear","axe","bow","arrows","clothes","armor","helmet"].filter(o=>(n[o]??0)>0).map(o=>`${n[o]} ${Bt(o)}`).join(", ");return e.push({id:"pvp",label:A("mPvp"),value:A(Ze?.pvp?"pvpOnW":"pvpOffW")},{id:"craft",label:A("mCraft"),sub:!0},{id:"back",label:A("mBack")}),{id:i,title:A("mFight"),rows:e,wide:!0,html:`<p>${r}</p>${s.map(o=>`<p>${We(o)}</p>`).join("")}${a?`<p class="dim">${We(A("fHave"))}: ${We(a)}</p>`:""}`}}case"actions":for(let t of["use","talk","attack","attackPerson","drink","eat","pickup","sleep"])e.push({id:t,label:cn(t)});return{id:i,title:A("mActions"),rows:e,html:Ze?`<div class="pbars">${En(A("nFood"),Ze.hunger)}${En(A("nWater"),Ze.thirst)}${En(A("nRest"),Ze.tired)}</div>`:void 0};case"past":for(let t of Vs??[])e.push({id:"r"+t.id,label:`${Ou(t.start,A("day"))} \xB7 ${t.people.join(", ")||"\u2014"}`,value:`${t.zombies} ${A("pastZ")} \xB7 ${t.secs} s${t.deaths.length?" \xB7 \u271D "+t.deaths.join(", "):t.killed?" \xB7 "+se("pastKilled",String(t.killed)):""}`});return Vs&&!Vs.length&&e.push({id:"back",label:A("mBack")}),{id:i,title:A("mPast"),rows:e,wide:!0,text:Vs?Vs.length?A("pastHelp"):A("pastNone"):"\u2026"};case"bag":{let t=Ze?.inv??{},n=Object.entries(t).filter(([,r])=>r>0),s=(n.length?`<div class="bag">${n.map(([r,a])=>`<span class="bi"><b>${a}</b> ${We(Bt(r))}</span>`).join("")}</div>`:`<p>${We(A("bagEmpty"))}</p>`)+`<p class="dim">${Ze?.weapon?We(se("cWeapon",Bt(Ze.weapon)))+" \xB7 ":""}${We(se("cDefence",String(Ze?.def??0)))}${Ze?.carry?" \xB7 "+We(se("carry",String(Ze.carry))):""}</p>`;e.push({id:"craft",label:A("mCraft"),sub:!0},{id:"guide",label:A("mGuide"),sub:!0});for(let r of Zi)(t[r]??0)>0&&e.push({id:"pl:"+r,label:se("cPut",Bt(r)),value:String(t[r])});return{id:i,title:A("mBag"),rows:e,html:s,wide:!0}}case"craft":for(let t of li)e.push({id:"c:"+t,label:za(t),sub:!0});return{id:i,title:A("mCraft"),rows:e,text:A("catHelp")};case"cat":{let t=Ze?.inv??{};for(let a of Yi){let o=t[a]??0;!o&&!Kt[a]||e.push({id:"r:"+a,label:Vn(Bt(a)),value:`${Kt[a]??0} / ${o}`})}let n=nr(yn,Kt),s=Object.entries(Kt).filter(([,a])=>a>0);e.push({id:"make",label:`${A("cMake")}: ${n?Vn(Bt(n.what))+(n.n&&n.n>1?" x"+n.n:""):A("cNoRecipe")}`,dim:!n}),e.push({id:"clear",label:A("cClear")},{id:"guide",label:A("mGuide"),sub:!0});let r=`<p>${We(s.length?se("cIn",Vi(Kt)):A("cNothingIn"))}</p><p class="dim">${We(A("catHelp"))}</p>`;return{id:i,title:za(yn),rows:e,html:r}}case"guide":{let t=Ze?.inv??{};return Ki.forEach((n,s)=>{if(yn&&n.cat!==yn)return;let r=Object.entries(n.need).every(([a,o])=>(t[a]??0)>=o);e.push({id:"g:"+s,label:`${yn?"":za(n.cat)+" \xB7 "}${Vn(Bt(n.what))}${n.n&&n.n>1?" x"+n.n:""}`,value:`${Vi(n.need)}${r?" "+A("cHave"):""}`})}),{id:i,title:yn?`${A("mGuide")} \xB7 ${za(yn)}`:A("mGuide"),rows:e,wide:!0,text:A("guideHelp")}}case"goto":for(let[t,n,s]of qs??[])e.push({id:"p"+t,label:n,value:s});return qs&&!qs.length&&e.push({id:"back",label:A("mBack")}),{id:i,title:A("mGoTo"),rows:e,text:qs?A("mGoToHelp"):"\u2026"};case"me":{let t=Zt;if(!t)return{id:i,title:A("meTitle"),rows:[{id:"back",label:A("mBack")}],text:"\u2026"};let n=t.traits,s=`<div class="pm"><b>${We(t.name)}</b> \xB7 ${We(A(t.sex==="f"?"lookWoman":"lookMan"))} \xB7 ${We(se("meHp",String(t.hp)))}</div><div class="pm">${se("pLevel",String(t.level),String(t.xp))}</div><div class="bp"><i style="width:${Math.max(4,Math.min(100,(t.xp-50*t.level*t.level)/Math.max(1,50*(t.level+1)**2-50*t.level*t.level)*100))}%"></i></div>`+(t.goal?`<div class="pm">${A("pGoal")}: <b>${We(t.goal.text)}</b> \xB7 ${Math.min(t.goal.k+1,t.goal.n)}/${t.goal.n}</div><div class="bp${t.goal.from!=="myself"?" ord":""}"><i style="width:${Math.max(6,t.goal.pct)}%"></i></div>`:"")+`<div class="pm">${A("mePartner")}: <b>${We(t.partner?.name??A("meNone"))}</b></div><div class="pm">${A("meChildren")}: <b>${t.children.length?t.children.map(r=>`${We(r.name)} (${r.age})`).join(", "):We(A("meNone"))}</b></div>`+(t.expecting>=0?`<div class="pm">${We(se("meExpecting",String(t.expecting)))}</div>`:"")+`<div class="pm dim">${We(se("meTraits",String(n.strength??0),String(n.speed??0),String(n.intelligence??0),String(n.courage??0),String(n.empathy??0)))}</div>`+(t.goals.length?`<div class="pm dim">${A("meGoals")}: ${t.goals.map(r=>`${r.ok?"\u2713":"\u2717"} ${We(r.text)} (+${r.xp})`).join(" \xB7 ")}</div>`:"");return e.push({id:"family",label:A("famTitle"),value:t.asks?.length?`${t.asks.length} !`:t.children.some(r=>r.stage==="baby"||r.stage==="toddler")?"\u2665":"",sub:!0}),e.push({id:"look",label:A("lookTitle"),sub:!0},{id:"auto",label:A("autoRow"),value:Nl(t.auto)},{id:"rules",label:A("myRules"),value:`${t.rules.length} / ${t.max}`,sub:!0},{id:"hut",label:se("meHut2",Vi(la))}),{id:i,title:A("meTitle"),rows:e,html:s,wide:!0}}case"family":{let t=Zt;if(!t)return{id:i,title:A("famTitle"),rows:[{id:"back",label:A("mBack")}],text:"\u2026"};let n=r=>String(Math.max(0,100-Math.round(r))),s="";for(let r of t.asks??[])e.push({id:`ay:${r.from}`,label:se("famAskFrom",r.name,A("role"+r.role)),value:A("famYes")},{id:`an:${r.from}`,label:"   "+A("famNo"),value:"\u2715"});for(let r of t.children){let a=r.stage==="baby"||r.stage==="toddler";s+=`<div class="pm"><b>${We(r.name)}</b> \xB7 ${We(A(zu[r.stage]??"stChild"))} (${Math.floor(r.age)})${r.carer?" \xB7 "+We(se("famLooked",r.carer)):""}</div><div class="pm dim">${We(se("famNeeds",n(r.hunger),n(r.thirst),n(r.tired)))}${a&&!r.near?" \xB7 "+We(A("famFar")):""}</div><div class="bp"><i style="width:${Math.max(4,100-Math.max(r.hunger,r.thirst))}%"></i></div>`,a&&e.push({id:`kf:${r.id}`,label:se("famFeed",r.name),dim:!r.near},{id:`kw:${r.id}`,label:se("famWater",r.name),dim:!r.near},{id:`kc:${r.id}`,label:se(r.held?"famDown":"famCarry",r.name),dim:!r.near&&!r.held},{id:`kb:${r.id}`,label:se("famBed",r.name),dim:!r.near})}if(t.children.length||(s+=`<p>${We(A("famNone"))}</p>`),t.family?.length){s+=`<div class="pm">${We(A("famChosen"))}: ${t.family.map(r=>`<b>${We(r.name)}</b> (${We(r.rel||A("role"+r.role))})`).join(", ")}</div>`;for(let r of t.family)e.push({id:`kd:${r.id}`,label:se("famDrop",r.rel||A("role"+r.role))+` \xB7 ${r.name}`,value:"\u2715"})}return e.length||e.push({id:"back",label:A("mBack")}),{id:i,title:A("famTitle"),rows:e,html:s,wide:!0,text:A("famHelp")}}case"look":{e.push({id:"f",label:A("lookWoman"),value:zn.sex==="f"?"\u25CF":""},{id:"m",label:A("lookMan"),value:zn.sex==="m"?"\u25CF":""});for(let n=0;n<5;n++)e.push({id:"s"+n,label:`${A("lookSkin")} ${n+1}`,value:zn.skin===n?"\u25CF":""});e.push({id:"save",label:A("lookSave")});let t=jl.map((n,s)=>`<span class="sw${zn.skin===s?" on":""}" style="background:#${n.getHexString()}"></span>`).join("");return{id:i,title:A("lookTitle"),rows:e,html:`<p>${We(Zt&&!Zt.chose?A("lookHelp"):A("lookSexNote"))}</p><div class="sws">${t}</div>`}}case"rules":return(Zt?.rules??[]).forEach((t,n)=>e.push({id:"r"+n,label:t,value:"\u2715"})),(Zt?.rules.length??0)<(Zt?.max??5)&&e.push({id:"add",label:A("ruleAdd")}),{id:i,title:A("myRules"),rows:e,wide:!0,text:`${se("ruleHelp",String(Zt?.max??5))} ${A("autoHelp")}`};case"person":return e.push({id:"back",label:A("mBack")}),Je==="play"&&Gt&&Gt.id===Kr&&(Zt?.partner?.id===Gt.id?e.push({id:"child",label:A("tryChild")},{id:"divorce",label:A("askDivorce")}):Zt?.partner||e.push({id:"court",label:A("askPartner")},{id:"marry",label:A("askMarry")}),Gt.isPlayer&&Zt?.partner?.id!==Gt.id&&!Zt?.family?.some(t=>t.id===Gt.id)&&e.push({id:"kin:child",label:A("askChild")},{id:"kin:sibling",label:A("askSibling")},{id:"kin:parent",label:A("askParent")})),Je==="watch"&&e.push({id:"next",label:A("mNextPerson")}),{id:i,title:Gt?.name??A("mPerson"),rows:e,wide:!0,html:Gt&&Gt.id===Kr?Hu(Gt,gs,!0):"\u2026"};case"settings":return Ya&&e.push({id:"thoughts",label:A("sThoughts"),value:Nl(Hn)}),Je==="play"&&e.push({id:"cam",label:A("sCamera"),value:Im(yi)}),e.push({id:"gfx",label:A("gTitle"),sub:!0},{id:"snd",label:A("sndTitle"),sub:!0}),e.push({id:"zin",label:A("aZoomIn")},{id:"zout",label:A("aZoomOut")},{id:"server",label:A("sServer"),value:ni},{id:"unpair",label:A("sUnpair")}),{id:i,title:A("mSettings"),rows:e,text:Ya?void 0:A("sThoughtsOnly")};case"snd":{let t=s=>`${Math.round(s*100)} %`,n=qe.prefs;return e.push({id:"on",label:A("sndOn"),value:Nl(n.on)},{id:"master",label:A("sndMaster"),value:t(n.master),dim:!n.on},{id:"fx",label:A("sndFx"),value:t(n.fx),dim:!n.on},{id:"amb",label:A("sndAmb"),value:t(n.amb),dim:!n.on},{id:"ui",label:A("sndUi"),value:t(n.ui),dim:!n.on}),{id:i,title:A("sndTitle"),rows:e,text:A("sndHelp")}}case"gfx":return e.push({id:"q",label:A("gQuality"),value:A(vt.q==="auto"?"gAuto":vt.q==="low"?"gLow":vt.q==="mid"?"gMid":"gHigh")+(vt.q!=="auto"&&vt.q!==qi?" *":"")},{id:"fog",label:A("gFog"),value:A(["gOff","gLight","gNormal","gThick"][vt.fog]??"gNormal")},{id:"dist",label:A("gDist"),value:A(["gNear","gNormal","gFar"][vt.dist]??"gNormal")},{id:"fps",label:A("gFps"),value:Nl(vt.fps)}),vt.q!=="auto"&&vt.q!==qi&&e.push({id:"restart",label:A("gRestart")}),{id:i,title:A("gTitle"),rows:e,text:A("gHelp")};case"controls":for(let t of Br)e.push({id:t,label:cn(t),value:HM(t)});return e.push({id:"reset",label:A("cReset")}),{id:i,title:A("mControls"),rows:e,text:`${A("cHelp")} ${A("cWatchNote")}`}}return{id:i,title:"",rows:e}}function GM(i,e){if(!Jr.pick(i,e,()=>X.back())){if(i==="root")e==="resume"?X.close():e==="actions"||e==="settings"||e==="controls"?X.push(e):e==="past"?(Vs=null,Le({t:he.Do,a:"replays"}),X.push("past")):e==="bag"||e==="build"||e==="fight"||e==="inv"||e==="gear"?X.push(e):e==="me"?(Le({t:he.Do,a:"mine"}),X.push("me")):e==="goto"?(qs=null,Le({t:he.Do,a:"roster"}),X.push("goto")):e==="person"?(ja(xd(),!0),X.push("person")):e==="mine"?(X.close(),Dm()):e==="next"?(X.close(),ad()):e==="map"?(X.close(),Lm()):e==="how"&&(X.close(),IM(Je==="play"?"watch":"play"));else if(i==="actions")X.close(),Gi(e,!0);else if(i==="build")ec(e.slice(2));else if(i==="fight")e==="back"?X.back():e==="craft"?X.push("inv"):e==="pvp"&&Le({t:he.Do,a:"pvp",text:Ze?.pvp?"0":"1"});else if(i==="past")e==="back"?X.back():(X.close(),xe("\u2026",1500),Le({t:he.Do,a:"replay",text:e.slice(1)}));else if(i==="bag")e==="craft"?(yn="",X.push("craft")):e==="guide"?(yn="",X.push("guide")):e.startsWith("pl:")&&(X.close(),Le({t:he.Do,a:"place",text:e.slice(3)}));else if(i==="craft"){yn=e.slice(2);for(let t of Object.keys(Kt))delete Kt[t];X.push("cat")}else if(i==="cat"){if(e.startsWith("r:")){let t=e.slice(2),n=Ze?.inv?.[t]??0;Kt[t]=(Kt[t]??0)+1>Math.min(n,4)?0:(Kt[t]??0)+1,X.refresh()}else if(e==="clear"){for(let t of Object.keys(Kt))delete Kt[t];X.refresh()}else if(e==="guide")X.push("guide");else if(e==="make"){let t=Object.entries(Kt).filter(([,n])=>n>0).map(([n,s])=>`${n}=${s}`).join(",");if(!nr(yn,Kt)){xe(A("dNoRecipe"),2500);return}Le({t:he.Do,a:"craft",text:`${yn}:${t}`})}}else if(i==="guide"){let t=Ki[Number(e.slice(2))];if(!t)return;for(let n of Object.keys(Kt))delete Kt[n];for(let[n,s]of Object.entries(t.need))Kt[n]=s;yn===t.cat?X.back():(yn=t.cat,X.push("cat"))}else if(i==="goto")e==="back"?X.back():(X.close(),Le({t:he.Do,a:"tp",text:e.slice(1)}));else if(i==="me")e==="back"?X.back():e==="look"?(zn.sex=Zt?.sex??"m",zn.skin=Zt?.skin??1,X.push("look")):e==="auto"?Le({t:he.Do,a:"auto",text:Zt?.auto?"0":"1"}):e==="rules"?X.push("rules"):e==="family"?(Le({t:he.Do,a:"mine"}),X.push("family")):e==="hut"&&ec("hut");else if(i==="family"){if(e==="back"){X.back();return}let[t,n]=e.split(":");if(t==="ay"||t==="an")Le({t:he.Do,a:"kinAnswer",text:`${n}:${t==="ay"?1:0}`});else if(t==="kd")Le({t:he.Do,a:"kinDrop",text:n});else{let s={kf:"feed",kw:"water",kc:"carry",kb:"bed"}[t];s&&Le({t:he.Do,a:"care",text:`${s}:${n}`})}}else if(i==="look")e==="f"||e==="m"?(zn.sex=e,X.refresh()):e==="save"?Le({t:he.Do,a:"look",text:`${zn.sex}:${zn.skin}`}):e.startsWith("s")&&(zn.skin=Number(e.slice(1)),X.refresh());else if(i==="rules")if(e==="add"){if(!MyPC.text?.keyboard)return;MyPC.text.keyboard({value:"",kind:"text",label:A("ruleLabel"),ok:"OK"}).then(t=>{t&&t.trim()&&Le({t:he.Do,a:"ruleAdd",text:t.trim().slice(0,200)})})}else e.startsWith("r")&&Le({t:he.Do,a:"ruleDel",text:e.slice(1)});else if(i==="person")e==="back"?X.back():e==="court"?Le({t:he.Do,a:"court",text:String(Gt?.id??-1)}):e==="marry"||e==="divorce"?(Le({t:he.Do,a:e,text:String(Gt?.id??-1)}),X.close()):e==="child"?Le({t:he.Do,a:"child"}):e.startsWith("kin:")?Le({t:he.Do,a:"kinAsk",text:`${Gt?.id??-1}:${e.slice(4)}`}):e==="next"&&(ad(),window.setTimeout(()=>{ja(wt,!0),X.refresh()},300));else if(i==="settings")e==="thoughts"?(Hn=!Hn,MyPC.save("thoughts",Hn),Hn||Xs.hide(),X.refresh()):e==="cam"?(cc(),X.refresh()):e==="gfx"||e==="snd"?X.push(e):e==="zin"?nc(1/1.2):e==="zout"?nc(1.2):e==="server"?(X.close(),md()):e==="unpair"&&(X.close(),LM());else if(i==="snd"){let t=qe.prefs;if(e==="on")t.on=!t.on;else if(e==="master"||e==="fx"||e==="amb"||e==="ui"){let n=Math.round(t[e]*10);t[e]=(n>=10?0:n+1)/10}qe.apply(),MyPC.save("sound",t),X.refresh(),e!=="on"&&qe.play(e==="ui"?"ui_ok":e==="amb"?"bird":"hit")}else if(i==="gfx"){if(e==="q"){let t=["auto","low","mid","high"];vt.q=t[(t.indexOf(vt.q)+1)%t.length]}else if(e==="fog")vt.fog=(vt.fog+1)%4;else if(e==="dist")vt.dist=(vt.dist+1)%3;else if(e==="fps")vt.fps=!vt.fps,Ul=0,Fl=performance.now(),js.textContent="";else if(e==="restart"){MyPC.save("gfx",vt),location.reload();return}MyPC.save("gfx",vt),um(),X.refresh()}else if(i==="controls"){if(e==="reset"){_t=wl(Or),MyPC.save("binds",_t),X.refresh(),Qs();return}bi=e,xe(se("cPress",cn(bi)),0)}}}var Um={inv:()=>Ze?.inv??{},gear:()=>Ze?.gear,thing:i=>Vn(Bt(i)),catName:i=>za(i),send:(i,e)=>Le({t:he.Do,a:i,text:e}),note:(i,e)=>xe(i,e),close:()=>X.close(),look:()=>{let i=wi();return i>=0&&Ws[i]>0?Am(!0,Ws[i]):dd}},hd=new Tl(Um),ic=new El(Um),X=new _l(VM,GM,()=>{bi=null,si.hidden=!0,Ja(),MyPC.back?.(!1)}),Jr=new Cl({send:i=>Le(i),push:i=>{X.open?X.push(i):X.show(i)},refresh:i=>{X.open&&X.page===i&&X.refresh()},note:(i,e)=>xe(i,e),keyboard:(i,e)=>{MyPC.text?.keyboard&&MyPC.text.keyboard({value:"",kind:"text",label:i,ok:"OK"}).then(t=>{t&&e(t)})},thing:i=>Bt(i)});X.onSound=i=>qe.play(i);var Xs=new bl(8);function ii(i="root"){if(It==="world"){if(bt.close(),vd(!1),Js(),rt.left=rt.right=rt.up=rt.down=!1,at.left=at.right=at.up=at.down=!1,Ks=!1,i==="person"){let e=xd();if(e<0){xe(A("nobody"),2e3);return}ja(e,!0)}X.show("root"),i!=="root"&&X.push(i),MyPC.back?.(!0),Ja()}}function ja(i,e=!1){i<0||(i!==Kr&&(Kr=i,Gt=null),(e||performance.now()-Wp>1e3)&&(Wp=performance.now(),Le({t:he.Info,id:i})))}function Fm(i,e){let t=bi;bi=null;let n=i==="pad"?_t.pad:_t.remote;for(let r of Br)n[r]===e&&delete n[r];n[t]=e,MyPC.save("binds",_t);let s=i==="pad"?String(MyPC.gamepad?.label?.(e)??e):Fa(e);xe(se("cSet",cn(t),s),2500),X.refresh(),Qs()}var sc=1e3/60,$r=0,Hr=0,Vl=0,em=0,tm=0,nm=0,im=!1,Wn=!0;function WM(i){if(It==="world"){if(mt){mt.update(sc/1e3);return}bt.open&&bt.hold&&MyPC.gamepad&&bt.aim(MyPC.gamepad.axis(0),MyPC.gamepad.axis(1)),Je==="play"?EM(sc/1e3,i):PM()}}function qM(i,e){if(It!=="world"||!re)return;if(fM(),qe.lx=In(),qe.ly=Ln(),qe.yaw=Mi,qe.topView=re.view==="top",qe.tick(e),vM(i),nd&&Si()&&_n){nd=!1;let u=["use","talk","attack","aim","build"].map(d=>`${Zr(d)}: ${cn(d).replace(/ \(.*\)$/,"")}`);xe(se("bindsNew",u.join(" \xB7 ")),9e3)}let t=In(),n=Ln();re.view=mt||!Si()||!_n?"top":yi,re.yaw=Mi,re.follow(t,n,e,Wn),Wn=!1;let s=qa+(i-$a)/1e3*Xr*Yr;re.setHour(((s/3600+8)%24+24)%24,i/1e3);let r=Math.min(1.25,(i-Kl)/td),a=re.people,o=Si()&&_n?wi():-1,l=i/1e3,h=re.view==="top"?(re.dist*1.6+8)*re.distK:re.sight+4,c=re.view==="first";if(sd++,a.begin(),re.beginShots(),re.beginItems(),re.animals.begin(),mt){mt.draw(a,e,gs),re.dist+=(Math.max(16,Math.min(42,mt.span*1.1+10))-re.dist)*Math.min(1,e*2),a.end(),re.endShots(),re.endItems(),re.animals.end(),re.render(),Xs.hide();return}for(let u=0;u<ct;u++){if(zt[u]===-1)continue;let d=Xl[u]+(Ht[u]-Xl[u])*r,m=Yl[u]+(Wt[u]-Yl[u])*r;if(u===o&&(d=en,m=tn),Math.abs(d-t)>h||Math.abs(m-n)>h)continue;if(lt[u]===ft.Projectile){re.shot(d,m);continue}if(lt[u]===ft.Item){re.item(d,m,$l[u],zt[u]);continue}if(lt[u]!==ft.Agent&&lt[u]!==ft.Player&&lt[u]!==ft.Threat&&lt[u]!==ft.Animal&&lt[u]!==ft.Npc)continue;let g=d-Qu[u],v=m-ed[u],p=Math.hypot(g,v);Qu[u]=d,ed[u]=m;let f=e>0?Math.min(6,p/e):0;if(zr[u]=zr[u]+(f-zr[u])*Math.min(1,e*10),p>.004){let T=Math.atan2(g,v)-ds[u];T=Math.atan2(Math.sin(T),Math.cos(T)),ds[u]=ds[u]+T*Math.min(1,e*12)}if(Oa[u]=(Oa[u]+p*4.2)%(Math.PI*2),_m[u]=d,bm[u]=m,Mm[u]=sd,(lt[u]===ft.Animal||lt[u]===ft.Threat)&&!(Vr[u]&xs.Dead)){let R=zt[u]&16383;if(!Il[R])Il[R]=i+1500+Math.random()*6e3;else if(i>Il[R]){let T=lt[u]===ft.Threat;Il[R]=i+(T?5e3+Math.random()*7e3:9e3+Math.random()*14e3),qe.play(T?Math.hypot(d-t,m-n)<2.5?"zombie_attack":"zombie_groan":Kb[Ws[u]]??"bird",d,m,T?.9:.7)}}if(lt[u]===ft.Animal){re.animals.add(Ws[u],d,m,ds[u],Oa[u]*1.4,Math.min(1,zr[u]/1.6));continue}if(c&&u===o)continue;let w=(Vr[u]&(xs.Sleeping|xs.Dead))!==0,S=lt[u]===ft.Threat,x=u===o||zt[u]===Pn,I=S?wm:Ws[u]>0&&(lt[u]===ft.Player||lt[u]===ft.Agent||lt[u]===ft.Npc)?Am(x,Ws[u]):x?dd:lt[u]===ft.Player?Sm:gm[u];a.add(d,m,ds[u],Oa[u],Math.min(1,zr[u]/(S?1.2:2.2)),I,w,Vr[u]&xs.Small?.42:Vr[u]&xs.Child?.62:1,S,S?0:pm[u],(i-mm[u])/1e3),lt[u]===ft.Player&&!(u===o&&re.view!=="top")?a.marker(d,m,l,zt[u]===Pn?qp:iM):lt[u]===ft.Npc?a.marker(d,m,l,sM):zt[u]===wt&&a.marker(d,m,l,qp)}if(a.end(),re.endShots(),re.endItems(),re.animals.end(),ms&&o>=0){let u=_i>=0&&zt[_i]!==-1?_i:-1,d=u>=0?Math.atan2(Wt[u]-tn,Ht[u]-en):Zs;re.aim(!0,en,tn,d,u>=0?Math.max(1,Math.hypot(Ht[u]-en,Wt[u]-tn)-.6):22,u>=0?Ht[u]:NaN,u>=0?Wt[u]:NaN)}else re.aim(!1);AM(),re.render(),Ya&&Hn&&!X.open&&i-xm<4e3?Xs.draw($M,XM,t,n,gs):Xs.hide()}function $M(i,e){let t=ri.get(i);return t===void 0||Mm[t]!==sd?!1:(e.x=_m[t],e.y=bm[t],!0)}var XM=(i,e,t)=>!!re&&re.project(i,2.2,e,t),sm=0;function Bm(i){$r=requestAnimationFrame(Bm),X.open&&X.page==="family"&&i-sm>2e3&&(sm=i,Le({t:he.Do,a:"mine"})),Hr||(Hr=i);let e=Math.min(.1,(i-Hr)/1e3);for(Vl+=Math.min(250,i-Hr),Hr=i;Vl>=sc;)WM(i),Vl-=sc;X.open&&X.page==="gear"?ic.draw(i):ic.stop(),(!X.open||i-Pl>100)&&(qM(i,i-Pl>200?e:Math.min(.1,(i-Pl)/1e3)),Pl=i,Ul++),vt.fps&&i-Fl>500&&(js.textContent=`${Math.round(Ul*1e3/(i-Fl))} fps \xB7 ${Math.round(Jl)} ms`,Ul=0,Fl=i),i-em>250&&(em=i,ai()),i-nm>3e3&&(nm=i,Le({t:he.Ping,c:i})),i-tm>500&&It==="world"&&(tm=i,YM(i),Je==="watch"&&wt>=0?ja(wt):X.open&&X.page==="person"&&ja(Kr),Ja())}var rm="";function YM(i){let e=qa+(i-$a)/1e3*Xr*Yr,t=Math.floor((e/3600+8)/24)+1,n=Math.floor((e/3600+8)%24),s=Math.floor(e/60%60),r=wt>=0?ri.get(wt):void 0,a=Je==="play"?Ql():wt>=0?`${A("following")} #${wt&65535}${r!==void 0?" \xB7 "+gs($l[r]):""}`:A("free"),o=`${Ka(Ot)} \xB7 ${A("day")} ${t} ${String(n).padStart(2,"0")}:${String(s).padStart(2,"0")} \xB7 ${fm} ${A("agents")} \xB7 ${a}`;if(o!==rm&&(rm=o,cm.textContent=o),to&&Je==="play"){let l=Math.max(0,Math.ceil((vm-e)/Math.max(.01,Xr*Yr)));si.textContent=`${se("travelling",Ka(Ha))} ${l} s`,si.hidden=!1}}function ud(){let i=Math.min(1,Math.min(1920/innerWidth,1080/innerHeight,window.devicePixelRatio||1))*(qi==="low"?.6:qi==="mid"?.8:1);re?.resize(Math.round(innerWidth*i),Math.round(innerHeight*i))}function am(){$r||(Hr=0,Vl=0,$r=requestAnimationFrame(Bm))}function om(){$r&&cancelAnimationFrame($r),$r=0,rt.left=rt.right=rt.up=rt.down=!1,at.left=at.right=at.up=at.down=!1,Ks=!1,Je==="play"&&Le({t:he.Input,mx:0,my:0,run:!1,seq:++rc}),Bl=Ol=0}var Om={left:1,right:1,up:1,down:1};function zm(i,e,t,n=!1){if(mt&&!X.open){e&&(i==="left"||i==="right"?mt.seek(i==="left"?-5:5):t||mt.faster(i==="up"));return}if(X.open){e&&X.input(i);return}if(bt.open){e&&!t&&bt.step(i);return}t||(n?at[i]=e:rt[i]=e)}var at={left:!1,right:!1,up:!1,down:!1};function yd(){It==="noserver"||It==="offline"?md():It==="pairfail"&&(us=0,It="connect",jr())}function KM(i,e,t){if(e&&qe.unlock(),i in Om){zm(i,e,t);return}if(bi){e&&!t&&Fm("remote",i);return}if(It!=="world"){e&&i==="ok"&&yd();return}if(mt&&!X.open){e&&!t&&i==="ok"&&mt.toggle();return}if(X.open){if(!e||t)return;i==="ok"?X.input("ok"):zs(_t,i)==="menu"&&X.close();return}let n=zs(_t,i);if(De){if(!e||t)return;i==="ok"?tc():n==="build"||i==="chUp"||i==="chDown"?Za():(n==="menu"||i==="back")&&Js();return}if(bt.open){if(!e||t)return;i==="ok"?lc(bt.close()):(n==="wheel"||n==="menu")&&bt.close();return}if(n==="wheel"){t||pd(e,!1);return}n&&!t&&Gi(n,e)}function ZM(i,e){if(e&&qe.unlock(),i>=12&&i<=16)return;if(bi){e&&Fm("pad",i);return}if(It!=="world"){e&&i===0&&yd();return}if(mt&&!X.open){e&&(i===0?mt.toggle():(i===1||Os(_t,i)==="menu")&&Em());return}if(X.open){if(!e)return;i===0?X.input("ok"):i===1?X.input("back"):Os(_t,i)==="menu"&&X.close();return}if(De){if(!e)return;i===0?tc():i===1?Js():i===2||i===3||i===4||i===5||Os(_t,i)==="build"?Za():Os(_t,i)==="menu"&&(Js(),ii());return}let t=Os(_t,i);if(t==="wheel"){pd(e,!0);return}if(bt.open){if(!e)return;i===0?lc(bt.close()):(i===1||t==="menu")&&bt.close();return}t&&Gi(t,e)}MyPC.init({keys:["channel","buttons"],ownMenu:!0,onInit(i){pp(i.lang),document.documentElement.lang=i.lang,document.documentElement.dir=i.lang==="ar"?"rtl":"ltr",qi=i.quality?.tier??"mid",vt={...vt,...MyPC.load("gfx",{})},vt.q!=="auto"&&(qi=vt.q);let e=new URLSearchParams(location.search);(e.get("tier")==="low"||e.get("tier")==="mid"||e.get("tier")==="high")&&(qi=e.get("tier"));let t=MyPC.app_config??{};Wi=MyPC.load("auth",null);let n=/github\.io$/i.test(location.hostname)?"":location.origin;ni=String(e.get("server")||t.server||MyPC.load("server","")||Wi?.server||n),Je=MyPC.load("how","play")==="watch"?"watch":"play",e.get("watch")!==null&&(Je="watch");let s=MyPC.load("binds",null);if(s&&s.pad&&s.remote&&(s.v??1)<Ml)_t=wl(Or),MyPC.save("binds",_t),nd=!0;else if(s&&s.pad&&s.remote){_t={pad:{...s.pad},remote:{...s.remote},v:Ml};for(let a of Br){let o=Or.pad[a],l=Or.remote[a];!(a in s.pad)&&o!==void 0&&Os(_t,o)===void 0&&(_t.pad[a]=o),!(a in s.remote)&&l!==void 0&&zs(_t,l)===void 0&&(_t.remote[a]=l)}}{let a=MyPC.load("sound",null);qe.prefs={...Vu,...a&&typeof a=="object"?a:{}}}qe.load(new URL("audio/",location.href).href);for(let a of["keydown","pointerdown","touchstart"])window.addEventListener(a,()=>qe.unlock(),{passive:!0});let r=MyPC.load("cam","top");yi=zl.includes(r)?r:"top",Hn=MyPC.load("thoughts",!0)!==!1,window.addEventListener("resize",ud),Nm(),MyPC.gamepad&&(MyPC.gamepad.on("pads",a=>{fs=a.length,jb=!a.length,Qs()}),MyPC.gamepad.on("button",(a,o)=>ZM(a,o))),MyPC.buttons?.on?.((a,o,l)=>KM(a,o,!!l)),(MyPC.apiLevel??0)>=24&&MyPC.stt?.on&&MyPC.stt.on("text",OM),e.get("dev")!==null&&(window.__dev={unplace:()=>Js(),tile:(a,o)=>Ga[Wr(a+.5,o+.5)]??"?",place:(a,o,l,h,c)=>{a&&ec(a);for(let u=0;u<Math.abs(o??0);u++)Va(Math.sign(o),0);for(let u=0;u<Math.abs(l??0);u++)Va(0,Math.sign(l));for(let u=0;u<(h??0);u++)Za();return c&&tc(),De?{...De,check:oc(De)}:null},snd:()=>qe.stats(),act:(a,o=!0)=>Gi(a,o),aim:()=>({aimOn:ms,aimAng:Zs,aimLock:_i}),me:()=>[In(),Ln(),Ot],cam:a=>cc(a),dbg:()=>({yaw:Mi,camView:yi,how:Je,meId:Pn,meTransit:to,predOk:_n,predX:en,predY:tn,camX:Cn,camY:Rn,s:wi(),sx:wi()>=0?Ht[wi()]:null}),look:(a,o)=>{wt=-1,Cn=a,Rn=o,Wn=!0}}),MyPC.ready()},onStart(){let i=Number(MyPC.load("dist",24))||24,e=Number(MyPC.load("back",7))||7;jr(),am(),queueMicrotask(()=>{re&&(re.dist=i,re.back=e)}),JM=i},onPause(){om(),qe.pause(!0)},onResume(){qe.pause(!1),am()},onDestroy(){om(),qe.pause(!0),clearTimeout(Zu),window.removeEventListener("resize",ud),fn&&(fn.onclose=null,fn.close(),fn=null),re?.dispose(),re=null},onMenu(i){i==="game"?setTimeout(()=>ii(),50):i==="server"&&md()},onInput(i,e,t,n){e&&qe.unlock();let s=!!n&&/^pad/.test(n);if(i in Om){zm(i,e,t,s);return}if(i==="cancel")return e?bi?(bi=null,xe(A("mControls"),800),!0):De&&!X.open?(Js(),!0):bt.open?(bt.close(),!0):X.open?(X.input("back"),!0):mt&&!s?(Em(),!0):s?!0:It!=="world"?!1:(ii(),!0):s?!0:void 0;if(!(s||i==="jump"||i==="menu"&&s)){if(i==="menu"){e&&(X.open?X.close():ii());return}if(!bi){if(i==="confirm"){if(!e)return;if(It!=="world"){yd();return}if(X.open){X.input("ok");return}if(De){tc();return}if(bt.open){lc(bt.close());return}if(mt){mt.toggle();return}Gi(n==="touch"?"use":zs(_t,"ok")??"use",!0);return}if(!(It!=="world"||X.open)){if(i==="run"){Gi("run",e);return}if(e){if(De&&(i==="pageUp"||i==="pageDown")){Za();return}i==="pageUp"?Gi(zs(_t,"chUp")??"zoomIn",!0):i==="pageDown"&&Gi(zs(_t,"chDown")??"zoomOut",!0)}}}}}});var JM=24;
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2024 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
