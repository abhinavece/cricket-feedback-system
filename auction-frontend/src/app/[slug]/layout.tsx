import Link from 'next/link';
import { fetchAuctionBySlug } from '@/lib/server-api';
import { AUCTION_STATUSES } from '@/lib/constants';

export default async function AuctionPublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  let auction: any = null;
  try {
    const res = await fetchAuctionBySlug(params.slug);
    auction = res.data;
  } catch {}

  if (!auction) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="text-6xl mb-6">🏏</div>
        <h1 className="text-2xl font-bold text-white mb-3">Auction Not Found</h1>
        <p className="text-slate-400 mb-8">This auction doesn&apos;t exist or isn&apos;t publicly available yet.</p>
        <Link href="/explore" className="btn-primary">Browse Auctions</Link>
      </div>
    );
  }

  const statusConfig = AUCTION_STATUSES[auction.status as keyof typeof AUCTION_STATUSES] || AUCTION_STATUSES.draft;
  const isLive = auction.status === 'live';
  const isCompleted = ['completed', 'trade_window', 'finalized'].includes(auction.status);

  const navItems = [
    { label: 'Overview', href: `/${params.slug}` },
    { label: 'Teams', href: `/${params.slug}/teams` },
    ...(isCompleted ? [{ label: 'Trades', href: `/${params.slug}/trades` }] : []),
    ...(isCompleted ? [{ label: 'Analytics', href: `/${params.slug}/analytics` }] : []),
    ...(isLive ? [{ label: 'Watch Live', href: `/${params.slug}/live`, live: true }] : []),
    ...(isLive ? [{ label: 'Broadcast', href: `/${params.slug}/broadcast`, external: true }] : []),
  ];

  return (
    <div className="min-h-screen">
      {/* Auction header bar */}
      <div className="border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`badge ${statusConfig.bg} ${statusConfig.color} flex-shrink-0`}>
                <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white truncate">{auction.name}</h1>
            </div>
          </div>

          {/* Sub-navigation */}
          <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-none">
            {navItems.map(item => {
              const isExternal = 'external' in item && item.external;
              const isLiveTab = 'live' in item && item.live;

              if (isExternal) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-300 hover:border-white/10 whitespace-nowrap transition-all"
                  >
                    {item.label} ↗
                  </a>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    isLiveTab
                      ? 'border-red-500 text-red-400 animate-pulse'
                      : 'border-transparent text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {isLiveTab && (
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {children}
    </div>
  );
}
