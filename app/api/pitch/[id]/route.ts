import { NextResponse } from 'next/server';
import { getPitch } from '@/lib/storage/memory-store';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pitch = await getPitch(id);
  if (!pitch) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(pitch);
}
