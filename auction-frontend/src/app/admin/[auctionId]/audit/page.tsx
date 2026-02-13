'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getAuditLog } from '@/lib/api';
import {
  Loader2, ScrollText, Filter, ChevronLeft, ChevronRight,
  Gavel, UserCheck, UserX, ShieldOff, ShieldCheck, ArrowLeftRight,
  RotateCcw, Trash2, IndianRupee, Play, Pause, Square, CheckCircle,
  SkipForward, Undo2, Pencil, UserPlus,
} from 'lucide-react';

interface AuditEvent {
  _id: string;
  sequenceNumber: number;
  type: string;
  payload: Record<string, any>;
  reversalPayload?: Record<string, any>;
  performedBy: { _id: string; name: string; email: string } | null;
  isUndone: boolean;
  undoneAt: string | null;
  isPublic: boolean;
  publicMessage: string;
  timestamp: string;
}

const EVENT_TYPES = [
  'BID_PLACED', 'PLAYER_SOLD', 'PLAYER_UNSOLD', 'PLAYER_DISQUALIFIED',
  'PLAYER_REINSTATED', 'PLAYER_DELETED', 'PLAYER_MARKED_INELIGIBLE',
  'PLAYER_ASSIGNED', 'PLAYER_REASSIGNED', 'PLAYER_RETURNED_TO_POOL',
  'TRADE_EXECUTED', 'MANUAL_OVERRIDE', 'PURSE_ADJUSTED',
  'PLAYER_DATA_UPDATED', 'RETENTION_ADDED',
  'AUCTION_PAUSED', 'AUCTION_RESUMED', 'AUCTION_STARTED',
  'AUCTION_COMPLETED', 'PLAYER_SKIPPED',
];

const typeIcons: Record<string, React.ReactNode> = {
  BID_PLACED: <Gavel className="w-4 h-4" />,
  PLAYER_SOLD: <CheckCircle className="w-4 h-4" />,
  PLAYER_UNSOLD: <UserX className="w-4 h-4" />,
  PLAYER_DISQUALIFIED: <ShieldOff className="w-4 h-4" />,
  PLAYER_REINSTATED: <ShieldCheck className="w-4 h-4" />,
  PLAYER_DELETED: <Trash2 className="w-4 h-4" />,
  PLAYER_MARKED_INELIGIBLE: <ShieldOff className="w-4 h-4" />,
  PLAYER_ASSIGNED: <UserPlus className="w-4 h-4" />,
  PLAYER_REASSIGNED: <ArrowLeftRight className="w-4 h-4" />,
  PLAYER_RETURNED_TO_POOL: <RotateCcw className="w-4 h-4" />,
  TRADE_EXECUTED: <ArrowLeftRight className="w-4 h-4" />,
  MANUAL_OVERRIDE: <Pencil className="w-4 h-4" />,
  PURSE_ADJUSTED: <IndianRupee className="w-4 h-4" />,
  PLAYER_DATA_UPDATED: <Pencil className="w-4 h-4" />,
  RETENTION_ADDED: <UserCheck className="w-4 h-4" />,
  AUCTION_PAUSED: <Pause className="w-4 h-4" />,
  AUCTION_RESUMED: <Play className="w-4 h-4" />,
  AUCTION_STARTED: <Play className="w-4 h-4" />,
  AUCTION_COMPLETED: <Square className="w-4 h-4" />,
  PLAYER_SKIPPED: <SkipForward className="w-4 h-4" />,
};

const typeColors: Record<string, string> = {
  BID_PLACED: 'text-blue-400 bg-blue-500/10',
  PLAYER_SOLD: 'text-emerald-400 bg-emerald-500/10',
  PLAYER_UNSOLD: 'text-orange-400 bg-orange-500/10',
  PLAYER_DISQUALIFIED: 'text-red-400 bg-red-500/10',
  PLAYER_REINSTATED: 'text-blue-400 bg-blue-500/10',
  PLAYER_DELETED: 'text-red-400 bg-red-500/10',
  PLAYER_MARKED_INELIGIBLE: 'text-yellow-400 bg-yellow-500/10',
  PLAYER_ASSIGNED: 'text-purple-400 bg-purple-500/10',
  PLAYER_REASSIGNED: 'text-purple-400 bg-purple-500/10',
  PLAYER_RETURNED_TO_POOL: 'text-amber-400 bg-amber-500/10',
  TRADE_EXECUTED: 'text-cyan-400 bg-cyan-500/10',
  MANUAL_OVERRIDE: 'text-pink-400 bg-pink-500/10',
  PURSE_ADJUSTED: 'text-amber-400 bg-amber-500/10',
  PLAYER_DATA_UPDATED: 'text-slate-400 bg-slate-500/10',
  RETENTION_ADDED: 'text-emerald-400 bg-emerald-500/10',
  AUCTION_PAUSED: 'text-amber-400 bg-amber-500/10',
  AUCTION_RESUMED: 'text-emerald-400 bg-emerald-500/10',
  AUCTION_STARTED: 'text-emerald-400 bg-emerald-500/10',
  AUCTION_COMPLETED: 'text-slate-400 bg-slate-500/10',
  PLAYER_SKIPPED: 'text-slate-400 bg-slate-500/10',
};

function formatType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function describeEvent(event: AuditEvent): string {
  const p = event.payload || {};
  switch (event.type) {
    case 'PLAYER_SOLD':
      return `${p.playerName || 'Player'} sold to ${p.teamName || 'team'} for ₹${(p.soldAmount || 0).toLocaleString('en-IN')}`;
    case 'PLAYER_UNSOLD':
      return `${p.playerName || 'Player'} went unsold`;
    case 'PLAYER_DISQUALIFIED':
      return `${p.playerName || 'Player'} disqualified${p.reason ? `: ${p.reason}` : ''}`;
    case 'PLAYER_REINSTATED':
      return `${p.playerName || 'Player'} reinstated to pool (was ${p.previousStatus || 'removed'})`;
    case 'PLAYER_DELETED':
      return `${p.playerName || 'Player'} deleted${p.refundAmount ? ` (₹${p.refundAmount.toLocaleString('en-IN')} refunded to ${p.refundTeamName})` : ''}`;
    case 'PLAYER_MARKED_INELIGIBLE':
      return `${p.playerName || 'Player'} marked ineligible${p.reason ? `: ${p.reason}` : ''}`;
    case 'PLAYER_ASSIGNED':
      return `${p.playerName || 'Player'} assigned to ${p.teamName || 'team'} for ₹${(p.amount || 0).toLocaleString('en-IN')}`;
    case 'PLAYER_REASSIGNED':
      return `${p.playerName || 'Player'} reassigned from ${p.fromTeamName || '?'} to ${p.toTeamName || '?'}`;
    case 'PLAYER_RETURNED_TO_POOL':
      return `${p.playerName || 'Player'} returned to pool${p.refundAmount ? ` (₹${p.refundAmount.toLocaleString('en-IN')} refunded)` : ''}`;
    case 'PURSE_ADJUSTED':
      return `${p.teamName || 'Team'} purse adjusted by ₹${(p.amount || 0).toLocaleString('en-IN')}${p.reason ? ` — ${p.reason}` : ''}`;
    case 'BID_PLACED':
      return `Bid of ₹${(p.amount || 0).toLocaleString('en-IN')} by ${p.teamName || 'team'} for ${p.playerName || 'player'}`;
    case 'TRADE_EXECUTED':
      return `Trade executed between ${p.fromTeamName || '?'} and ${p.toTeamName || '?'}`;
    case 'MANUAL_OVERRIDE':
      return `Manual override: ${p.action || 'unknown'}${p.reason ? ` — ${p.reason}` : ''}`;
    case 'PLAYER_SKIPPED':
      return `${p.playerName || 'Player'} skipped`;
    default:
      return event.publicMessage || formatType(event.type);
  }
}

export default function AuditLogPage() {
  const params = useParams();
  const auctionId = params.auctionId as string;

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page };
      if (filterType) params.type = filterType;
      const res = await getAuditLog(auctionId, params);
      setEvents(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      console.error('Failed to load audit log:', err);
    } finally {
      setLoading(false);
    }
  }, [auctionId, page, filterType]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Audit Log</h2>
          <p className="text-sm text-slate-400 mt-1">{total} event{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); }}
          className="input-field w-full sm:w-56"
        >
          <option value="">All Event Types</option>
          {EVENT_TYPES.map(t => (
            <option key={t} value={t}>{formatType(t)}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ScrollText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Events</h3>
          <p className="text-sm text-slate-400">Audit log entries will appear here as actions are taken.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {events.map(event => {
              const color = typeColors[event.type] || 'text-slate-400 bg-slate-500/10';
              const icon = typeIcons[event.type] || <ScrollText className="w-4 h-4" />;
              const isExpanded = expandedId === event._id;

              return (
                <div
                  key={event._id}
                  className={`glass-card p-4 transition-all cursor-pointer hover:bg-white/[0.02] ${
                    event.isUndone ? 'opacity-50' : ''
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : event._id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
                          {formatType(event.type)}
                        </span>
                        <span className="text-xs text-slate-600">#{event.sequenceNumber}</span>
                        {event.isUndone && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 flex items-center gap-1">
                            <Undo2 className="w-3 h-3" /> Undone
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-200 mt-1">{describeEvent(event)}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span>
                          {new Date(event.timestamp).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                          })}
                        </span>
                        {event.performedBy && (
                          <span>by {event.performedBy.name || event.performedBy.email}</span>
                        )}
                        {!event.isPublic && (
                          <span className="text-slate-600">Private</span>
                        )}
                      </div>

                      {/* Expanded payload */}
                      {isExpanded && (
                        <div className="mt-3 p-3 rounded-lg bg-slate-900/50 border border-white/5">
                          <p className="text-xs text-slate-500 font-medium mb-1">Payload</p>
                          <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap break-all">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                          {event.reversalPayload && Object.keys(event.reversalPayload).length > 0 && (
                            <>
                              <p className="text-xs text-slate-500 font-medium mt-2 mb-1">Reversal Payload</p>
                              <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap break-all">
                                {JSON.stringify(event.reversalPayload, null, 2)}
                              </pre>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary text-sm disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-400">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="btn-secondary text-sm disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
