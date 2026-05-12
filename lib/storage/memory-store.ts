import type { Pitch } from '@/lib/types/pitch';
import { put, head } from '@vercel/blob';

/**
 * Pitch persistence.
 *
 * Strategy:
 *   - When BLOB_READ_WRITE_TOKEN is set (production on Vercel): use Vercel Blob.
 *     Each pitch is stored as `pitches/<id>.json`, public so the listener view
 *     can read it without server-side auth round-trips.
 *   - Otherwise (local dev without Blob token): fall back to the global in-memory
 *     Map for fast iteration.
 *
 * Both paths expose the same async interface.
 */

declare global {
  // eslint-disable-next-line no-var
  var __pitchStore: Map<string, Pitch> | undefined;
}

const memStore = globalThis.__pitchStore ?? new Map<string, Pitch>();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__pitchStore = memStore;
}

const BLOB_PATH = (id: string) => `pitches/${id}.json`;

function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function savePitch(p: Pitch): Promise<void> {
  // Always update local memory too — read-after-write within the same instance is free.
  memStore.set(p.id, p);

  if (useBlob()) {
    await put(BLOB_PATH(p.id), JSON.stringify(p), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  }
}

export async function getPitch(id: string): Promise<Pitch | undefined> {
  // Try memory first (same instance, hot)
  const cached = memStore.get(id);
  if (cached) return cached;

  if (!useBlob()) return undefined;

  // Fetch from blob. We don't have the URL upfront with addRandomSuffix:false,
  // but the URL is deterministic from the pathname + store config — easier to
  // fetch the head and then the body via its public URL.
  try {
    const meta = await head(BLOB_PATH(id));
    if (!meta?.url) return undefined;
    const res = await fetch(meta.url, { cache: 'no-store' });
    if (!res.ok) return undefined;
    const pitch = (await res.json()) as Pitch;
    memStore.set(id, pitch);
    return pitch;
  } catch {
    return undefined;
  }
}
