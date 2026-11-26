import { ShaderChunk } from 'three';

/**
 * Cheaper, nicer shadows (imad 2026-11-26: "60 fps on low-end devices without losing quality").
 *
 * three.js 0.170 keeps the shadow map as packed RGBA depth, and its PCF filter reads it 17 times per pixel (PCF soft: 25) on
 * every lit pixel of the ground and the props. On the TVs' and the HD 530's small GPUs that was the biggest single cost of a
 * frame (measured: 78 ms -> 33 ms with shadows off in software GL). Here PCF becomes a 2 x 2 bilinear filter: 4 reads, each
 * shadow edge smoothed across one texel (the same softness the 17 reads gave at radius 1), so the look stays the same.
 * The shadow also fades out over the last 8 % of the shadow box instead of stopping on a hard line.
 */
let done = false;
export function patchShadows(): void {
  if (done) return;
  done = true;
  let s = ShaderChunk.shadowmap_pars_fragment;
  const a = s.indexOf('#if defined( SHADOWMAP_TYPE_PCF )'), b = s.indexOf('#elif defined( SHADOWMAP_TYPE_PCF_SOFT )');
  if (a < 0 || b < a) return; // another three.js: keep its own
  s = s.slice(0, a) + `#if defined( SHADOWMAP_TYPE_PCF )

			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			vec2 st = shadowCoord.xy * shadowMapSize - 0.5;
			vec2 f = fract( st );
			vec2 uv = ( floor( st ) + 0.5 ) * texelSize;
			float s00 = texture2DCompare( shadowMap, uv, shadowCoord.z );
			float s10 = texture2DCompare( shadowMap, uv + vec2( texelSize.x, 0.0 ), shadowCoord.z );
			float s01 = texture2DCompare( shadowMap, uv + vec2( 0.0, texelSize.y ), shadowCoord.z );
			float s11 = texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z );
			shadow = mix( mix( s00, s10, f.x ), mix( s01, s11, f.x ), f.y );

		` + s.slice(b);
  const end = 'shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );';
  const e = s.indexOf(end), close = e >= 0 ? s.indexOf('#endif', e) : -1;
  if (close > 0) {
    const fade = `#endif
			vec2 edge = min( shadowCoord.xy, 1.0 - shadowCoord.xy );
			shadow = mix( 1.0, shadow, clamp( min( edge.x, edge.y ) * 12.5, 0.0, 1.0 ) );`;
    s = s.slice(0, close) + fade + s.slice(close + '#endif'.length);
  }
  ShaderChunk.shadowmap_pars_fragment = s;
}
