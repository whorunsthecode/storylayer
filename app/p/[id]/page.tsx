import { notFound } from 'next/navigation';
import { getPitch } from '@/lib/storage/memory-store';
import { PublicPitchView } from '@/components/public-view/PublicPitchView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function PublicPitchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pitch = getPitch(id);
  if (!pitch) notFound();
  return <PublicPitchView pitch={pitch} />;
}
