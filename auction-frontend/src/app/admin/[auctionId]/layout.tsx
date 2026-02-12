'use client';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, UserCheck, Settings, ArrowLeft } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '' },
  { id: 'teams', label: 'Teams', icon: Users, href: '/teams' },
  { id: 'players', label: 'Players', icon: UserCheck, href: '/players' },
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
            return (
              <Link
                key={tab.id}
                href={`${basePath}${tab.href}`}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
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
