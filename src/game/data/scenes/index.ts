import type { SceneDef, SceneId } from '../../types';
import { street } from './street';
import { house, shop, ritu, hideout, cinema } from './interiors';

export const SCENES: Record<SceneId, SceneDef> = { street, house, shop, ritu, hideout, cinema };

export { street, house, shop, ritu, hideout, cinema };
