import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneDef } from '../game/types';
import { CHAR_IDS } from '../game/types';
import { useGame } from '../game/store';
import { ent } from '../game/runtime';
import { actionsFor } from '../game/effects';
import { FRIENDS } from '../game/data/characters';

/** Follows a runtime entity (or fixed point) every frame. */
function Anchor({ id, x, z, y, children }: { id?: string; x?: number; z?: number; y: number; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (id) {
      const e = ent(id);
      g.current.position.set(e.x, y + e.y, e.z);
    } else g.current.position.set(x ?? 0, y, z ?? 0);
  });
  return <group ref={g}>{children}</group>;
}

export function InteractionPrompt({ scene }: { scene: SceneDef }) {
  const focus = useGame((s) => s.focus);
  const active = useGame((s) => s.active);
  useGame((s) => s.flags); // re-render when actions unlock
  const dialogue = useGame((s) => s.dialogue);
  const it = scene.interactables.find((i) => i.id === focus);
  if (!it || dialogue) return null;
  const acts = actionsFor(it);
  const main = acts.find((a) => !a.who);
  const mine = acts.find((a) => a.who === active);
  const others = acts.filter((a) => a.who && a.who !== active);
  return (
    <Anchor id={it.npc} x={it.x} z={it.z} y={it.y ?? 2.4}>
      <Html center zIndexRange={[30, 20]} style={{ pointerEvents: 'none' }}>
        <div className="prompt" key={it.id}>
          <div className="prompt-label">{it.label}</div>
          {main && (
            <div className="prompt-row">
              <kbd>E</kbd>
              <span>{main.verb}</span>
            </div>
          )}
          {mine && (
            <div className="prompt-row prompt-special" style={{ ['--c' as string]: FRIENDS[active].color }}>
              <kbd>F</kbd>
              <span>{mine.verb}</span>
            </div>
          )}
          {!main && !mine && others.length > 0 && <div className="prompt-row prompt-muted">Not a job for {FRIENDS[active].name}</div>}
          {others.length > 0 && (
            <div className="prompt-others">
              {others.map((a) => (
                <span key={a.id} className="chip" style={{ ['--c' as string]: FRIENDS[a.who!].color }}>
                  <b>{CHAR_IDS.indexOf(a.who!) + 1}</b> {FRIENDS[a.who!].name} could try something
                </span>
              ))}
            </div>
          )}
        </div>
      </Html>
    </Anchor>
  );
}

export function Bubbles() {
  const bubbles = useGame((s) => s.bubbles);
  const dialogue = useGame((s) => s.dialogue);
  return (
    <>
      {bubbles.map((b) => {
        const friend = FRIENDS[b.target as keyof typeof FRIENDS];
        return (
          <Anchor key={b.id} id={b.target} y={3.0}>
            <Html center zIndexRange={[40, 30]} style={{ pointerEvents: 'none', opacity: dialogue ? 0.35 : 1 }}>
              <div className="bubble" style={{ ['--c' as string]: friend?.color ?? '#ffffff' }}>
                {b.text}
              </div>
            </Html>
          </Anchor>
        );
      })}
    </>
  );
}

export function Emotes() {
  const emotes = useGame((s) => s.emotes);
  return (
    <>
      {Object.entries(emotes).map(([id, e]) => (
        <Anchor key={id + e.until} id={id} y={id === 'gauri' ? 2.2 : 3.1}>
          <Html center zIndexRange={[35, 25]} style={{ pointerEvents: 'none' }}>
            <div className={`emote emote-${e.kind === '💢' ? 'angry' : e.kind === '♥' ? 'love' : 'plain'}`}>{e.kind}</div>
          </Html>
        </Anchor>
      ))}
    </>
  );
}
