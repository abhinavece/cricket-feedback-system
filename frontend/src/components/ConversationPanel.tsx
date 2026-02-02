import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMessageHistory, sendWhatsAppMessage } from '../services/api';
import { useSSE } from '../hooks/useSSE';
import { Wifi, WifiOff, Loader2, X, RefreshCw, ExternalLink, ArrowLeft } from 'lucide-react';
import type { Player } from '../types';
import MessageStatusIndicator from './MessageStatusIndicator';

interface ConversationPanelProps {
  player: Player | null;
  onClose: () => void;
  variant?: 'panel' | 'fullscreen';
}

const ConversationPanel: React.FC<ConversationPanelProps> = ({
  player,
  onClose,
  variant = 'panel'
}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [oldestTimestamp, setOldestTimestamp] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-capitalize helper
  const autoCapitalize = (text: string): string => {
    if (!text) return text;
    let result = text.charAt(0).toUpperCase() + text.slice(1);
    result = result.replace(/\. ([a-z])/g, (match) => `. ${match.charAt(2).toUpperCase()}`);
    return result;
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch history when player changes
  const fetchHistory = useCallback(async (isInitial = true) => {
    if (!player) return;

    try {
      if (isInitial) {
        setLoadingHistory(true);
        setMessages([]);
        setOldestTimestamp(null);
      }
      const response = await getMessageHistory(player.phone, { limit: 10 });
      setMessages(response.data || []);
      setHasMoreHistory(response.pagination?.hasMore || false);
      setOldestTimestamp(response.pagination?.oldestTimestamp || null);
      setLastSynced(new Date());
    } catch (err) {
      console.error('Failed to load message history:', err);
      setError('Failed to load message history.');
    } finally {
      setLoadingHistory(false);
    }
  }, [player]);

  // Load more older messages
  const loadMoreHistory = async () => {
    if (!player || !oldestTimestamp || loadingMoreHistory) return;

    try {
      setLoadingMoreHistory(true);
      const response = await getMessageHistory(player.phone, {
        limit: 10,
        before: oldestTimestamp
      });

      if (response.data && response.data.length > 0) {
        setMessages(prev => [...response.data, ...prev]);
        setOldestTimestamp(response.pagination?.oldestTimestamp || null);
        setHasMoreHistory(response.pagination?.hasMore || false);
      } else {
        setHasMoreHistory(false);
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      setLoadingMoreHistory(false);
    }
  };

  // Load history when player changes
  useEffect(() => {
    if (player) {
      fetchHistory(true);
    }
  }, [player, fetchHistory]);

  // SSE subscriptions for real-time updates
  // Format phone number to match backend broadcast format (with 91 prefix)
  const sseSubscriptions = useMemo(() => {
    if (!player) return [];
    let formattedPhone = player.phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    return ['messages', `phone:${formattedPhone}`];
  }, [player]);

  // Handle SSE events
  const handleSSEEvent = useCallback((event: any) => {
    if (event.type === 'message:received' || event.type === 'message:sent') {
      const messageData = event.data || event;
      const eventPhone = messageData.to || messageData.from || messageData.phone;

      if (player && eventPhone) {
        const playerLast10 = player.phone.slice(-10);
        const eventLast10 = eventPhone.slice(-10);

        if (playerLast10 === eventLast10) {
          setMessages(prev => {
            const exists = prev.some(m =>
              m._id === messageData.messageId ||
              m.messageId === messageData.messageId ||
              m._id === messageData._id
            );
            if (exists) return prev;

            const newMsg = {
              _id: messageData.messageId || messageData._id,
              messageId: messageData.messageId,
              direction: messageData.direction || (event.type === 'message:sent' ? 'outgoing' : 'incoming'),
              text: messageData.text || messageData.message,
              timestamp: messageData.timestamp || new Date().toISOString(),
              imageId: messageData.imageId,
              status: messageData.status || 'sent'
            };

            return [...prev, newMsg];
          });
          setLastSynced(new Date());

          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    }

    // Handle message status updates (sent, delivered, read, failed)
    if (event.type === 'message:status') {
      const statusData = event.data || event;
      const { messageId, whatsappMessageId, status } = statusData;

      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId || msg.messageId === messageId ||
            msg._id === whatsappMessageId || msg.messageId === whatsappMessageId ||
            msg.whatsappMessageId === whatsappMessageId) {
          return { ...msg, status };
        }
        return msg;
      }));
    }
  }, [player]);

  const { isConnected: sseConnected, status: sseStatus } = useSSE({
    subscriptions: sseSubscriptions,
    onEvent: handleSSEEvent,
    onConnect: () => console.log('SSE connected for chat:', player?.phone),
    enabled: !!player
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !player) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;

    // Optimistic update
    const optimisticMessage = {
      _id: tempId,
      direction: 'outgoing',
      text: messageText,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      setSendingMessage(true);
      const response = await sendWhatsAppMessage({
        playerIds: [player._id],
        message: messageText,
        previewUrl: false
      });

      setMessages(prev => prev.map(msg =>
        msg._id === tempId
          ? { ...msg, _id: response.results?.[0]?.messageId || tempId, status: 'sent' }
          : msg
      ));
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.map(msg =>
        msg._id === tempId
          ? { ...msg, status: 'failed' }
          : msg
      ));
      setError(err?.response?.data?.error || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleNavigateToProfile = () => {
    if (player) {
      navigate(`/player/${player._id}`);
    }
  };

  if (!player) {
    return (
      <div className={`flex flex-col items-center justify-center text-center p-8 ${variant === 'panel' ? 'h-full' : 'min-h-screen'} bg-slate-800/30`}>
        <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No conversation selected</h3>
        <p className="text-sm text-slate-400">Click "Chat" on a player to start a conversation</p>
      </div>
    );
  }

  const isFullscreen = variant === 'fullscreen';

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : 'h-full'}`}>
      {/* Header */}
      <div className={`${isFullscreen ? 'p-4' : 'p-3'} border-b border-white/10 flex items-center justify-between bg-slate-800/80 backdrop-blur-lg shrink-0`}>
        <div className="flex items-center gap-3">
          {isFullscreen && (
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold cursor-pointer hover:ring-2 hover:ring-emerald-400/50 transition-all"
            onClick={handleNavigateToProfile}
            title="View profile"
          >
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <button
              onClick={handleNavigateToProfile}
              className="text-base font-bold text-white leading-tight hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            >
              {player.name}
              <ExternalLink className="w-3 h-3 opacity-50" />
            </button>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400 font-medium tabular-nums">{player.phone}</span>
              {lastSynced && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchHistory(true)}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
            title="Refresh conversation"
            disabled={loadingHistory}
          >
            <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
          </button>
          {!isFullscreen && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className="flex-1 overflow-y-auto p-4 bg-[#efe7de] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"
        style={{ maxHeight: isFullscreen ? 'calc(100vh - 180px)' : undefined }}
      >
        {loadingHistory && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <div className="w-8 h-8 border-3 border-[#128C7E]/20 border-t-[#128C7E] rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-500">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No messages yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Load More Button */}
            {hasMoreHistory && (
              <div className="flex justify-center py-2">
                <button
                  onClick={loadMoreHistory}
                  disabled={loadingMoreHistory}
                  className="px-4 py-2 text-xs font-medium text-[#128C7E] bg-white rounded-full shadow-sm hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMoreHistory ? (
                    <>
                      <div className="w-3 h-3 border-2 border-[#128C7E]/20 border-t-[#128C7E] rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                      </svg>
                      Load older messages
                    </>
                  )}
                </button>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isIncoming = msg.direction === 'incoming';
              const hasImage = msg.imageId;
              return (
                <div
                  key={msg._id || idx}
                  className={`flex flex-col ${isIncoming ? 'items-start' : 'items-end'} max-w-[85%] ${isIncoming ? 'self-start' : 'self-end'}`}
                >
                  <div className={`relative px-3 py-2 rounded-2xl shadow-sm text-[14px] leading-relaxed ${
                    isIncoming
                      ? 'bg-white text-gray-800 rounded-tl-none'
                      : 'bg-[#dcf8c6] text-gray-800 rounded-tr-none'
                  }`}>
                    {/* Chat bubble tail */}
                    <div className={`absolute top-0 w-0 h-0 border-t-[10px] ${
                      isIncoming
                        ? '-left-2 border-t-white border-l-[10px] border-l-transparent'
                        : '-right-2 border-t-[#dcf8c6] border-r-[10px] border-r-transparent'
                    }`}></div>

                    {/* Image display */}
                    {hasImage && (
                      <div className="mb-2">
                        <img
                          src={`${process.env.REACT_APP_API_URL || ''}/whatsapp/media/${msg.imageId}`}
                          alt="Shared image"
                          className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(`${process.env.REACT_APP_API_URL || ''}/whatsapp/media/${msg.imageId}`, '_blank')}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Text */}
                    {msg.text && msg.text !== '[Image]' && (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] opacity-50 font-medium tabular-nums">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!isIncoming && (
                        msg.status === 'sending' ? (
                          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <MessageStatusIndicator
                            status={msg.status || 'sent'}
                            size="sm"
                            showTooltip={true}
                            errorMessage={msg.errorMessage}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-2 bg-slate-800 border-t border-white/10 flex items-center gap-2 shrink-0">
        <div className="flex-1 relative min-w-0">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(autoCapitalize(e.target.value))}
            placeholder="Type a message"
            className="w-full bg-slate-700 rounded-full py-2 px-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border-none shadow-sm resize-none max-h-24 min-h-[40px] overflow-hidden"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
        </div>
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sendingMessage}
          className={`w-10 h-10 rounded-full transition-all flex items-center justify-center shrink-0 ${
            sendingMessage
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 shadow-md'
          }`}
        >
          {sendingMessage ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Footer Status */}
      <div className="px-3 py-2 bg-slate-800/80 border-t border-white/5 flex items-center justify-between shrink-0">
        <span className={`flex items-center gap-1.5 text-xs font-medium ${sseConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
          {sseConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>Live updates</span>
            </>
          ) : sseStatus === 'connecting' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </>
          )}
        </span>
        {error && (
          <span className="text-xs text-rose-400">{error}</span>
        )}
      </div>
    </div>
  );
};

export default ConversationPanel;
