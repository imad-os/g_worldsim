/** Seasons and weather (imad 2026-11-26), shared by the server, the TV and the panel. */
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export const WEATHERS = ['clear', 'cloudy', 'rain', 'storm', 'snow', 'blizzard', 'fog'] as const;
export type WeatherKind = (typeof WEATHERS)[number];
/** Below this (°C) standing still in the open costs health. */
export const COLD_BELOW = 5;
/** How much of the cold worn things keep off (x their level / quality, at most 0.8 together). */
export const WARMTH: Record<string, number> = { clothes: 0.45, armor: 0.3, helmet: 0.1 };
/** Notice 'weather' (once a second when it changed, else every 10 s): season, its length, day of it, sky, strength, °C on the viewer's map, year fraction. */
export interface WeatherInfo { s: number; sd: number; day: number; w: WeatherKind; k: number; t: number; f: number }
