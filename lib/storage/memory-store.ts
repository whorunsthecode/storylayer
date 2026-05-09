import type { Pitch } from '@/lib/types/pitch';

declare global {
  // eslint-disable-next-line no-var
  var __pitchStore: Map<string, Pitch> | undefined;
}

const store = globalThis.__pitchStore ?? new Map<string, Pitch>();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__pitchStore = store;
}

export function savePitch(p: Pitch): void {
  store.set(p.id, p);
}

export function getPitch(id: string): Pitch | undefined {
  return store.get(id);
}
