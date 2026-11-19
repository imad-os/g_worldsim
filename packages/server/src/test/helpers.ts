import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadScenario } from '../sim/scenario.js';
import { World } from '../sim/world.js';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../../../..');
export const scenario = () => loadScenario(resolve(ROOT, 'scenarios/post-apocalypse'));
export const newWorld = (seed?: string) => new World(scenario(), { tickRate: 20, clockScale: 10, capacity: 1024, seed });
