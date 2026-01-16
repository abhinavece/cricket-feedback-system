import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllConversations } from '../../services/api';
import ConversationPanel from '../ConversationPanel';
import { RefreshCw, MessageCircle, Search, Loader2 } from 'lucide-react';
import type { Player } from '../../types';

interface Conversation {
  player: {
    _id: string;
    name: string;
    phone: string;
  };
  lastMessage: {
    text: string;
    timestamp: string;
    direction: string;
  } | null;
  unreadCount: number;
}

const MobileChatsTab: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const fetchConversations = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await getAllConversations();
      setConversations(response.data);
    } catch (err: any) {
      console.error('Failed to fetch conversations:', err);
      setError(err?.response?.data?.error || 'Failed to load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleOpenChat = (conversation: Conversation) => {
    // Convert to Player type for ConversationPanel
    const player: Player = {
      _id: conversation.player._id,
      name: conversation.player.name,
      phone: conversation.player.phone
    };
    setSelectedPlayer(player);
  };

  const handleNavigateToProfile = (playerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/player/${playerId}`);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.player.phone.includes(searchQuery)
  );

  // Show full-screen chat when a player is selected
  if (selectedPlayer) {
    return (
      <ConversationPanel
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        variant="fullscreen"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-lg border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white">Chats</h1>
          <button
            onClick={() => fetchConversations(true)}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
            <p className="text-sm text-slate-400">Loading conversations...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-rose-400 mb-3">{error}</p>
            <button
              onClick={() => fetchConversations()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm"
            >
              Try again
            </button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 font-medium">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'Try a different search' : 'Start a chat from the WhatsApp tab'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.player._id}
                onClick={() => handleOpenChat(conversation)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 active:bg-slate-800 transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div
                  onClick={(e) => handleNavigateToProfile(conversation.player._id, e)}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg font-bold shrink-0 hover:ring-2 hover:ring-emerald-400/50 transition-all cursor-pointer"
                >
                  {conversation.player.name.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => handleNavigateToProfile(conversation.player._id, e)}
                      className="text-sm font-semibold text-white hover:text-emerald-400 transition-colors truncate text-left"
                    >
                      {conversation.player.name}
                    </button>
                    {conversation.lastMessage && (
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {formatTimestamp(conversation.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>

                  {conversation.lastMessage ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      {conversation.lastMessage.direction === 'outgoing' && (
                        <span className="text-emerald-500 shrink-0">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/>
                          </svg>
                        </span>
                      )}
                      <p className="text-xs text-slate-400 truncate">
                        {conversation.lastMessage.text || '[Image]'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic mt-0.5">No messages</p>
                  )}
                </div>

                {/* Unread badge (for future use) */}
                {conversation.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white">
                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileChatsTab;
