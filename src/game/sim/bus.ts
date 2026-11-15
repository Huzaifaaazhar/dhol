/** Tiny event bus between effects/dialogue and the mission directors (avoids import cycles). */
type Handler = (name: string, data?: unknown) => void;
const handlers = new Set<Handler>();

export function onGameEvent(h: Handler) {
  handlers.add(h);
  return () => handlers.delete(h);
}

export function emitGameEvent(name: string, data?: unknown) {
  handlers.forEach((h) => h(name, data));
}
