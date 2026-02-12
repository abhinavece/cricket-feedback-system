'use client';

import { TeamInfo } from '@/contexts/AuctionSocketContext';

interface TeamPanelProps {
  teams: TeamInfo[];
  currentBidTeamId: string | null;
  compact?: boolean;
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(0)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function TeamPanel({ teams, currentBidTeamId, compact }: TeamPanelProps) {
  return (
    <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3'}`}>
      {teams.map(team => {
        const isHighestBidder = team._id === currentBidTeamId;
        const spentPct = team.purseValue > 0 ? ((team.purseValue - team.purseRemaining) / team.purseValue) * 100 : 0;

        return (
          <div
            key={team._id}
            className={`rounded-xl border transition-all ${
              isHighestBidder
                ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
                : 'bg-slate-800/30 border-white/5'
            } ${compact ? 'p-2.5' : 'p-3'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`${compact ? 'w-7 h-7 text-[8px]' : 'w-8 h-8 text-[9px]'} rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0 ${isHighestBidder ? 'ring-2 ring-amber-400/50' : ''}`}
                style={{ background: team.primaryColor }}
              >
                {team.shortName}
              </div>
              <div className="min-w-0">
                <div className={`${compact ? 'text-[11px]' : 'text-xs'} font-semibold text-white truncate`}>
                  {team.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  {team.squadSize} player{team.squadSize !== 1 ? 's' : ''}
                </div>
              </div>
              {isHighestBidder && (
                <span className="ml-auto text-amber-400 text-lg flex-shrink-0">🔨</span>
              )}
            </div>

            {/* Purse bar */}
            <div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${100 - spentPct}%`,
                    background: team.primaryColor,
                  }}
                />
              </div>
              <div className={`flex justify-between ${compact ? 'text-[9px]' : 'text-[10px]'} text-slate-500 mt-1`}>
                <span>{formatCurrency(team.purseRemaining)}</span>
                <span>{Math.round(spentPct)}% used</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
