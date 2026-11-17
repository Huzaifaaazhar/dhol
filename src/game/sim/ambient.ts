/**
 * Everyday life between the missions. Ramesh the postman does his round through the
 * colony, and actually goes into the buildings he delivers to: the shop and the
 * friends' rented room. Paths follow open road (the same lines Shambhu's cart uses).
 */
import { SCENES } from '../data/scenes';
import type { TourStop } from './agents';

const house = SCENES.house.spawns.door;

export const POSTMAN_TOUR: TourStop[] = [
  { scene: 'street', x: 4.6, z: -5.4, face: 0.6, stay: 4, anim: 'read', say: 'Sorting. Sorting. Why is everything addressed to “Occupant”?' },
  { scene: 'shop', x: -0.8, z: 0.1, face: Math.PI, stay: 9, say: 'Lalaji! Three bills and one love letter. Not for you, sorry.' },
  { scene: 'street', x: 4.6, z: -5.4, stay: 0 },
  { scene: 'street', x: -8.6, z: -5.2, stay: 0 },
  { scene: 'house', x: house.x - 0.6, z: house.z - 1.4, face: Math.PI, stay: 8, say: 'Letter for four unemployed gentlemen. From Tiwari-ji. It just says RENT. Very big.' },
  { scene: 'street', x: -8.6, z: -5.2, stay: 0 },
  { scene: 'street', x: 4.6, z: -5.4, stay: 0 },
  { scene: 'street', x: -8, z: 6.6, face: -0.4, stay: 6, anim: 'read', say: 'Ten years on this road. Nobody has ever written to me.' },
  { scene: 'street', x: 4.6, z: -5.4, stay: 0 },
];
