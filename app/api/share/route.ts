import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { savePitch } from '@/lib/storage/memory-store';
import type { Pitch } from '@/lib/types/pitch';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Pitch, 'id' | 'createdAt'>;
  const id = randomUUID().slice(0, 8);
  const pitch: Pitch = {
    ...body,
    id,
    createdAt: new Date().toISOString(),
  };
  savePitch(pitch);
  return NextResponse.json({ id, url: `/p/${id}` });
}
