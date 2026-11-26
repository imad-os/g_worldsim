/**
 * The TV map's marks (imad 2026-11-25: "mark home, mines, hunt spots on the map"): ONE list of kinds for the server and the TV.
 * A player's marks are kept by character name on the server (Do `mark`), so every TV of that player sees them.
 */
export const MARK_KINDS = ['home', 'mine', 'hunt', 'wood', 'water', 'farm', 'danger', 'camp', 'star'] as const;
export type MarkKind = (typeof MARK_KINDS)[number];
export const MARK_ICON: Record<MarkKind, string> = { home: '🏠', mine: '⛏', hunt: '🦌', wood: '🌲', water: '💧', farm: '🌾', danger: '☠', camp: '🔥', star: '⭐' };
export const MAX_MARKS = 60;
export interface MapMark { id: number; map: string; x: number; y: number; kind: MarkKind; label: string; at: number }
