/**
 * Everyday life between the missions. Ramesh the postman does his round through the
 * colony, and actually goes into the buildings he delivers to: the shop and the
 * friends' rented room. Paths follow open road (the same lines Shambhu's cart uses).
 */
import { SCENES } from '../data/scenes';
import type { TourStop } from './agents';

const house = SCENES.house.spawns.door;

export const POSTMAN_TOUR: TourStop[] = [
  { scene: 'street', x: 4.6, z: -5.4, face: 0.6, stay: 4, anim: 'read', say: 'Chhaant raha hoon. Chhaant raha hoon. Har cheez “Nivaasi” ke naam kyun hai?' },
  { scene: 'shop', x: -0.8, z: 0.1, face: Math.PI, stay: 9, say: 'Lalaji! Teen bill aur ek prem patra. Aapke liye nahi, sorry.' },
  { scene: 'street', x: 4.6, z: -5.4, stay: 0 },
  { scene: 'street', x: -8.6, z: -5.2, stay: 0 },
  { scene: 'house', x: house.x - 0.6, z: house.z - 1.4, face: Math.PI, stay: 8, say: 'Chaar berozgaar sajjanon ke naam khat. Dongre sahab ki taraf se. Bas likha hai: KARZA. Bade akshar mein.' },
  { scene: 'street', x: -8.6, z: -5.2, stay: 0 },
  { scene: 'street', x: 4.6, z: -5.4, stay: 0 },
  { scene: 'street', x: -8, z: 6.6, face: -0.4, stay: 6, anim: 'read', say: 'Das saal is sadak pe. Mujhe aaj tak kisi ne khat nahi likha.' },
  { scene: 'street', x: 4.6, z: -5.4, stay: 0 },
];
