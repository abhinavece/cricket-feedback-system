'use client';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, UserCheck, Settings, ArrowLeft, Radio, ListChecks } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '' },
  { id: 'live', label: 'Live Control', icon: Radio, href: '/live' },
  { id: 'teams', label: 'Teams', icon: Users, href: '/teams' },
  { id: 'players', label: 'Players', icon: UserCheck, href: '/players' },
  { id: 'fields', label: 'Player Fields', icon: ListChecks, href: '/fields' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export default function AuctionDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const auctionId = params.auctionId as string;
  const basePath = `/admin/${auctionId}`;

  const activeTab = TABS.find(tab => {
    if (tab.href === '') return pathname === basePath;
    return pathname.startsWith(`${basePath}${tab.href}`);
  })?.id || 'overview';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Back link */}
      <Link href="/admin" className="btn-ghost text-sm mb-4 -ml-2 inline-flex">
        <ArrowLeft className="w-4 h-4" /> All Auctions
      </Link>

      {/* Tab navigation */}
      <div className="border-b border-white/5 mb-6 sm:mb-8 -mx-4 sm:mx-0 px-4 sm:px-0">
        <nav className="flex gap-1 overflow-x-auto scrollbar-none">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const isLiveTab = tab.id === 'live';
            return (
              <Link
                key={tab.id}
                href={`${basePath}${tab.href}`}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? isLiveTab
                      ? 'border-red-500 text-red-400'
                      : 'border-amber-500 text-amber-400'
                    : isLiveTab
                      ? 'border-transparent text-red-400/60 hover:text-red-400 hover:border-red-500/30'
                      : 'border-transparent text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {isLiveTab && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </div>
  );
}
