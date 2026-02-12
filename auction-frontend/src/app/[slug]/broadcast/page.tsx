import { fetchAuctionBySlug } from '@/lib/server-api';
import { BroadcastView } from './client';

export default async function BroadcastPage({ params }: { params: { slug: string } }) {
  let auctionId = '';
  let auctionName = '';
  try {
    const res = await fetchAuctionBySlug(params.slug);
    auctionId = res.data?._id || '';
    auctionName = res.data?.name || '';
  } catch {}

  if (!auctionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-500">Auction not found.</p>
      </div>
    );
  }

  return <BroadcastView auctionId={auctionId} slug={params.slug} auctionName={auctionName} />;
}
