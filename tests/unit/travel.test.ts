import { describe, expect, it } from 'vitest';
import { planTrip, doorOf } from '../../src/game/sim/agents';
import { SCENES } from '../../src/game/data/scenes';

describe('NPC trips between buildings', () => {
  it('stays on one leg inside a single scene', () => {
    const legs = planTrip('street', 'street', 1, 2);
    expect(legs).toEqual([{ x: 1, z: 2 }]);
  });

  it('walks out of the shop, along the street and into the friends’ room', () => {
    const legs = planTrip('shop', 'house', 0, 0);
    expect(legs).toHaveLength(3);
    expect(legs[0].cross?.scene).toBe('street');
    expect(legs[1].cross?.scene).toBe('house');
    // comes out of the shop at the shop door, goes in at the house door
    expect(legs[0].cross).toMatchObject({ x: SCENES.street.spawns.shopDoor.x, z: SCENES.street.spawns.shopDoor.z });
    expect(legs[1]).toMatchObject({ x: SCENES.street.spawns.houseDoor.x, z: SCENES.street.spawns.houseDoor.z });
    expect(legs[2]).toEqual({ x: 0, z: 0 });
  });

  it('knows every interior’s door from both sides', () => {
    for (const id of ['house', 'shop', 'ritu', 'hideout', 'cinema'] as const) {
      const d = doorOf(id);
      expect(d, id).not.toBeNull();
    }
    expect(doorOf('street')).toBeNull();
  });
});
