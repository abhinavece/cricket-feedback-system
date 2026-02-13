'use client';

import { motion } from 'framer-motion';
import { TeamInfo } from '@/contexts/AuctionSocketContext';
import { Gavel, Users } from 'lucide-react';
import TeamLogo from './TeamLogo';

interface TeamPanelProps {
  teams: TeamInfo[];
  currentBidTeamId: string | null;
  compact?: boolean;
}

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function TeamPanel({ teams, currentBidTeamId, compact }: TeamPanelProps) {
  return (
    <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3'}`}>
      {teams.map(team => {
        const isHighestBidder = team._id === currentBidTeamId;
        const spentPct = team.purseValue > 0 ? ((team.purseValue - team.purseRemaining) / team.purseValue) * 100 : 0;
        const remainPct = 100 - spentPct;

        return (
          <motion.div
            key={team._id}
            layout
            animate={isHighestBidder ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`rounded-xl border transition-all relative overflow-hidden ${
              isHighestBidder
                ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-slate-800/50 to-orange-500/5'
                : 'bg-slate-800/30 border-white/5 hover:border-white/10'
            } ${compact ? 'p-2.5' : 'p-3'}`}
          >
            {/* Ambient team color glow for highest bidder */}
            {isHighestBidder && (
              <div
                className="absolute inset-0 opacity-[0.07] blur-2xl"
                style={{ background: team.primaryColor }}
              />
            )}

            <div className="relative flex items-center gap-2 mb-2.5">
              <TeamLogo
                logo={team.logo}
                name={team.name}
                shortName={team.shortName}
                primaryColor={team.primaryColor}
                size={compact ? 'xs' : 'sm'}
              />
              <div className="min-w-0 flex-1">
                <div className={`${compact ? 'text-[11px]' : 'text-xs'} font-semibold text-white truncate`}>
                  {team.name}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Users className="w-2.5 h-2.5" />
                  <span>{team.squadSize}</span>
                </div>
              </div>
              {isHighestBidder && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="flex-shrink-0"
                >
                  <Gavel className="w-4 h-4 text-amber-400" />
                </motion.div>
              )}
            </div>

            {/* Purse bar */}
            <div className="relative">
              <div className="h-1.5 bg-slate-900/60 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${remainPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ background: `linear-gradient(90deg, ${team.primaryColor}, ${team.primaryColor}80)` }}
                />
              </div>
              <div className={`flex justify-between ${compact ? 'text-[9px]' : 'text-[10px]'} mt-1`}>
                <span className="text-slate-400 font-medium tabular-nums">{formatCurrency(team.purseRemaining)}</span>
                <span className="text-slate-600 tabular-nums">{Math.round(spentPct)}%</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
