'use client';

/**
 * Combined WebSocket + Auction State context.
 * Manages Socket.IO connection and provides real-time auction state to all children.
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { connectToAuction, disconnectSocket } from '@/lib/socket';

// ---- Types ----

export interface BiddingPlayer {
  _id: string;
  name: string;
  role: string;
  playerNumber: number;
  imageUrl?: string;
  customFields?: Record<string, any>;
}

export interface BidEntry {
  teamId: string;
  amount: number;
  timestamp: string;
}

export interface BiddingState {
  status: 'waiting' | 'revealed' | 'open' | 'going_once' | 'going_twice' | 'sold' | 'unsold';
  currentBid: number;
  currentBidTeamId: string | null;
  bidHistory: BidEntry[];
  timerExpiresAt: string | null;
  player: BiddingPlayer | null;
}

export interface TeamInfo {
  _id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor?: string;
  logo?: string;
  purseValue: number;
  purseRemaining: number;
  squadSize: number;
}

export interface MyTeamInfo {
  _id: string;
  name: string;
  shortName: string;
  purseRemaining: number;
  maxBid: number;
  squadSize: number;
  canBid: boolean;
}

export interface AuctionConfig {
  basePrice: number;
  purseValue: number;
  minSquadSize: number;
  maxSquadSize: number;
  maxRounds: number;
  timerDuration: number;
  bidResetTimer: number;
  goingOnceTimer: number;
  goingTwiceTimer: number;
  playerRevealDelay: number;
}

export interface PlayerFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'url' | 'date';
  showOnCard: boolean;
  showInList: boolean;
  sortable: boolean;
  order: number;
}

export interface AuctionState {
  auctionId: string;
  name: string;
  slug: string;
  status: string;
  currentRound: number;
  config: AuctionConfig;
  bidding: BiddingState | null;
  teams: TeamInfo[];
  stats: { totalPlayers: number; inPool: number; sold: number; unsold: number };
  playerFields?: PlayerFieldConfig[];
  myTeam?: MyTeamInfo;
  isAdmin?: boolean;
  remainingPlayerCount?: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface AuctionSocketContextValue {
  socket: Socket | null;
  state: AuctionState | null;
  connectionStatus: ConnectionStatus;
  role: 'admin' | 'team' | 'spectator';
  announcements: { message: string; timestamp: string }[];
  emit: (event: string, data?: any, callback?: (res: any) => void) => void;
}

const AuctionSocketContext = createContext<AuctionSocketContextValue>({
  socket: null,
  state: null,
  connectionStatus: 'disconnected',
  role: 'spectator',
  announcements: [],
  emit: () => {},
});

export function useAuctionSocket() {
  return useContext(AuctionSocketContext);
}

// ---- Provider ----

interface ProviderProps {
  children: React.ReactNode;
  auctionId: string;
  token?: string;
  teamToken?: string;
  role?: 'admin' | 'team' | 'spectator';
}

export function AuctionSocketProvider({ children, auctionId, token, teamToken, role = 'spectator' }: ProviderProps) {
  const [state, setState] = useState<AuctionState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [announcements, setAnnouncements] = useState<{ message: string; timestamp: string }[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!auctionId) return;

    const sock = connectToAuction({ auctionId, token, teamToken });
    socketRef.current = sock;

    sock.on('connect', () => setConnectionStatus('connected'));
    sock.on('disconnect', () => setConnectionStatus('disconnected'));
    sock.on('connect_error', () => setConnectionStatus('error'));

    // Full state sync on connect
    sock.on('auction:state', (data: AuctionState) => {
      setState(data);
    });

    // Status changes
    sock.on('auction:status_change', (data: { status: string; reason?: string }) => {
      setState(prev => prev ? { ...prev, status: data.status } : prev);
    });

    // Player revealed
    sock.on('player:revealed', (data: any) => {
      setState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          bidding: {
            status: 'revealed',
            currentBid: 0,
            currentBidTeamId: null,
            bidHistory: [],
            timerExpiresAt: null,
            player: data.player,
          },
          stats: { ...prev.stats, inPool: data.remainingInPool },
        };
      });
    });

    // Bidding opened
    sock.on('bidding:open', (data: any) => {
      setState(prev => {
        if (!prev || !prev.bidding) return prev;
        return {
          ...prev,
          bidding: {
            ...prev.bidding,
            status: 'open',
            currentBid: data.basePrice,
            timerExpiresAt: data.timerExpiresAt,
          },
        };
      });
    });

    // Bid placed
    sock.on('bid:placed', (data: any) => {
      setState(prev => {
        if (!prev || !prev.bidding) return prev;
        return {
          ...prev,
          bidding: {
            ...prev.bidding,
            status: 'open',
            currentBid: data.amount,
            currentBidTeamId: data.teamId,
            timerExpiresAt: data.timerExpiresAt,
            bidHistory: [
              ...prev.bidding.bidHistory,
              { teamId: data.teamId, amount: data.amount, timestamp: data.timestamp },
            ],
          },
        };
      });
    });

    // Timer phase changes
    sock.on('timer:phase', (data: any) => {
      setState(prev => {
        if (!prev || !prev.bidding) return prev;
        return {
          ...prev,
          bidding: {
            ...prev.bidding,
            status: data.phase,
            timerExpiresAt: data.timerExpiresAt,
          },
        };
      });
    });

    // Player sold
    sock.on('player:sold', (data: any) => {
      setState(prev => {
        if (!prev || !prev.bidding) return prev;
        // Update team purse in teams array
        const updatedTeams = prev.teams.map(t =>
          t._id === data.team._id
            ? { ...t, purseRemaining: data.team.purseRemaining, squadSize: t.squadSize + 1 }
            : t
        );
        return {
          ...prev,
          bidding: { ...prev.bidding, status: 'sold' },
          teams: updatedTeams,
          stats: { ...prev.stats, sold: prev.stats.sold + 1 },
        };
      });
    });

    // Player unsold
    sock.on('player:unsold', (data: any) => {
      setState(prev => {
        if (!prev || !prev.bidding) return prev;
        return {
          ...prev,
          bidding: { ...prev.bidding, status: 'unsold' },
          stats: { ...prev.stats, unsold: prev.stats.unsold + 1 },
        };
      });
    });

    // Player skipped
    sock.on('player:skipped', () => {
      setState(prev => {
        if (!prev) return prev;
        return { ...prev, bidding: prev.bidding ? { ...prev.bidding, status: 'waiting' } : null };
      });
    });

    // Round started
    sock.on('round:started', (data: any) => {
      setState(prev => prev ? { ...prev, currentRound: data.round } : prev);
    });

    // Team private update (for team role)
    sock.on('team:update', (data: MyTeamInfo) => {
      setState(prev => prev ? { ...prev, myTeam: { ...prev.myTeam!, ...data } } : prev);
    });

    // Admin announcements
    sock.on('admin:announcement', (data: { message: string; timestamp: string }) => {
      setAnnouncements(prev => [data, ...prev].slice(0, 20));
    });

    return () => {
      disconnectSocket();
      socketRef.current = null;
    };
  }, [auctionId, token, teamToken]);

  const emit = useCallback((event: string, data?: any, callback?: (res: any) => void) => {
    if (socketRef.current?.connected) {
      // Only send data arg if it's defined, otherwise Socket.IO misaligns the callback
      if (data !== undefined && data !== null) {
        socketRef.current.emit(event, data, callback);
      } else if (callback) {
        socketRef.current.emit(event, callback);
      } else {
        socketRef.current.emit(event);
      }
    }
  }, []);

  return (
    <AuctionSocketContext.Provider value={{
      socket: socketRef.current,
      state,
      connectionStatus,
      role,
      announcements,
      emit,
    }}>
      {children}
    </AuctionSocketContext.Provider>
  );
}
