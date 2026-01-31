import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { createPlayer, getPlayers, sendWhatsAppMessage, getMessageHistory, updatePlayer, deletePlayer, getUpcomingMatches, createMatch } from '../services/api';
import type { Player } from '../types';
import ConfirmDialog from './ConfirmDialog';
import MatchForm from './MatchForm';
import PlayerNameLink from './PlayerNameLink';
import { validateIndianPhoneNumber, sanitizeIndianPhoneNumber } from '../utils/phoneValidation';
import { matchEvents } from '../utils/matchEvents';
import { useSSE } from '../hooks/useSSE';
import { 
  Wifi, WifiOff, Loader2, MessageSquare, Users, Send, Plus, Edit, Trash2, 
  Search, Check, X, Phone, User, Calendar, MapPin, Clock, ChevronDown,
  Sparkles, Brain, RefreshCw, ExternalLink, MessageCircle, Settings,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

interface TemplateConfig {
  id: string;
  name: string;
  label: string;
  format: string;
  expectedParams: number;
  language: string;
  header?: string;
  footer?: string;
  buttons?: string[];
  hasImage?: boolean;
}

const TEMPLATES: TemplateConfig[] = [
  {
    id: 'mavericks_team_availability',
    name: 'mavericks_team_availability',
    label: 'Team Availability (Basic)',
    header: 'Mavericks XI Team Availability',
    format: 'Hi {{1}},\n\nWe have an upcoming match scheduled at {{2}} on {{3}}.\n\nAre you available for the match?',
    footer: 'Select an option to confirm your availability',
    expectedParams: 3,
    language: 'en',
    buttons: ['Yes', 'No']
  },
  {
    id: 'team_availability_check_new',
    name: 'team_availability_check_new',
    label: 'Team Availability (With Image)',
    header: '🏏 Mavericks XI - Match Availability',
    format: 'Hey {{1}}! 👋\n\n📍 *{{2}}*\n📅 *{{3}}*\n\nPlease confirm your availability for this match.',
    footer: 'Tap a button below to respond',
    expectedParams: 3,
    language: 'en',
    buttons: ['Available', 'Not Available', 'Tentative'],
    hasImage: true
  },
  {
    id: 'custom',
    name: '',
    label: 'Custom Template',
    format: '',
    expectedParams: 0,
    language: 'en_US'
  }
];

const WhatsAppMessagingTab: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const hasFetchedInitial = useRef(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', phone: '', notes: '' });
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sendMode, setSendMode] = useState<'text' | 'template'>('template');
  const [message, setMessage] = useState('Hey team, please confirm availability for tomorrow\'s match at 7:00 AM.');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig>(TEMPLATES[0]);
  const [templateName, setTemplateName] = useState(TEMPLATES[0].name);
  const [templateLanguage, setTemplateLanguage] = useState(TEMPLATES[0].language);
  const [templateBodyParams, setTemplateBodyParams] = useState<string>('');
  const [matchDateTime, setMatchDateTime] = useState('');
  const [matchVenue, setMatchVenue] = useState('');
  const [templateExpectedParams, setTemplateExpectedParams] = useState(TEMPLATES[0].expectedParams);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; attempted: number; results?: Array<{ playerId: string; name: string; phone: string; status: string; messageId?: string; timestamp?: string }> } | null>(null);
  const [showAlert, setShowAlert] = useState(true);
  const [historyPlayer, setHistoryPlayer] = useState<Player | null>(null);
  const [historyMessages, setHistoryMessages] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [oldestTimestamp, setOldestTimestamp] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [historyNewMessage, setHistoryNewMessage] = useState('');
  const [sendingHistoryMessage, setSendingHistoryMessage] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendingHistoryMessageRef = useRef(false);

  // Neural network animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles: Array<{
      x: number; y: number; vx: number; vy: number; radius: number; opacity: number;
    }> = [];

    const numParticles = 30;
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
        ctx.fill();

        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

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
  }, [historyMessages]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPlayers();
      setPlayers(response);
    } catch (err) {
      console.error(err);
      setError('Failed to load players. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoadingMatches(true);
      const response = await getUpcomingMatches();
      setMatches(response);
      return response;
    } catch (err) {
      console.error('Failed to load matches:', err);
      return [];
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleCreateMatch = async (matchData: any) => {
    try {
      setCreatingMatch(true);
      const newMatch = await createMatch(matchData);
      const updatedMatches = await fetchMatches();
      const matchFromList = updatedMatches.find((m: any) => m._id === newMatch._id);
      setSelectedMatch(matchFromList || newMatch);
      const matchToUse = matchFromList || newMatch;
      const matchDate = new Date(matchToUse.date);
      const timeStr = matchToUse.time || matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setMatchDateTime(`${matchDate.toLocaleDateString()} ${timeStr}`);
      setMatchVenue(matchToUse.ground || '');
      setShowMatchForm(false);
      setSuccess('Match created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to create match:', err);
      setError('Failed to create match. Please try again.');
    } finally {
      setCreatingMatch(false);
    }
  };

  const handleUpdatePlayer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingPlayer) return;
    if (!editingPlayer.name.trim() || !editingPlayer.phone.trim()) {
      setError('Name and WhatsApp number are required.');
      return;
    }
    if (!validateIndianPhoneNumber(editingPlayer.phone)) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }
    const sanitizedPhone = sanitizeIndianPhoneNumber(editingPlayer.phone);
    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(null);
      await updatePlayer(editingPlayer._id, {
        name: editingPlayer.name.trim(),
        phone: sanitizedPhone,
        notes: editingPlayer.notes?.trim() || undefined,
      });
      setEditingPlayer(null);
      setShowPlayerModal(false);
      await fetchPlayers();
    } catch (err: any) {
      console.error('Update failed:', err);
      setError(err?.response?.data?.error || 'Failed to update player');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePlayer = async () => {
    if (!playerToDelete) return;
    try {
      setError(null);
      setSuccess(null);
      await deletePlayer(playerToDelete._id);
      setPlayerToDelete(null);
      setSelectedPlayers(prev => prev.filter(id => id !== playerToDelete._id));
      await fetchPlayers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err?.response?.data?.error || 'Failed to delete player');
    }
  };

  const fetchHistory = async (player: Player, isInitial = true) => {
    try {
      if (isInitial) {
        setLoadingHistory(true);
        setHistoryPlayer(player);
        setHistoryMessages([]);
        setOldestTimestamp(null);
      }
      const response = await getMessageHistory(player.phone, { limit: 10 });
      setHistoryMessages(response.data || []);
      setHasMoreHistory(response.pagination?.hasMore || false);
      setOldestTimestamp(response.pagination?.oldestTimestamp || null);
      setLastSynced(new Date());
    } catch (err) {
      console.error(err);
      setError('Failed to load message history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadMoreHistory = async () => {
    if (!historyPlayer || !oldestTimestamp || loadingMoreHistory) return;
    try {
      setLoadingMoreHistory(true);
      const response = await getMessageHistory(historyPlayer.phone, { limit: 10, before: oldestTimestamp });
      if (response.data && response.data.length > 0) {
        setHistoryMessages(prev => [...response.data, ...prev]);
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

  const sseSubscriptions = useMemo(() => {
    if (!historyPlayer) return [];
    let formattedPhone = historyPlayer.phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    return ['messages', `phone:${formattedPhone}`];
  }, [historyPlayer]);

  const handleSSEEvent = useCallback((event: any) => {
    if (event.type === 'message:received' || event.type === 'message:sent') {
      const messageData = event.data || event;
      const eventPhone = messageData.to || messageData.from || messageData.phone;
      if (historyPlayer && eventPhone) {
        const playerLast10 = historyPlayer.phone.slice(-10);
        const eventLast10 = eventPhone.slice(-10);
        if (playerLast10 === eventLast10) {
          setHistoryMessages(prev => {
            const existsById = prev.some(m =>
              m._id === messageData.messageId ||
              m.messageId === messageData.messageId ||
              m._id === messageData._id
            );
            if (existsById) return prev;
            if (event.type === 'message:sent') {
              const eventTime = messageData.timestamp ? new Date(messageData.timestamp).getTime() : 0;
              const sameRecentOutgoing = prev.some(m => {
                if (m.direction !== 'outgoing') return false;
                const sameText = (m.text || '').trim() === (messageData.text || messageData.message || '').trim();
                const mTime = m.timestamp ? new Date(m.timestamp).getTime() : 0;
                const withinSeconds = Math.abs(mTime - eventTime) < 15000;
                return sameText && withinSeconds;
              });
              if (sameRecentOutgoing) return prev;
            }
            const newMessage = {
              _id: messageData.messageId || messageData._id,
              messageId: messageData.messageId,
              direction: messageData.direction || (event.type === 'message:sent' ? 'outgoing' : 'incoming'),
              text: messageData.text || messageData.message,
              timestamp: messageData.timestamp || new Date().toISOString(),
              imageId: messageData.imageId,
              status: messageData.status
            };
            return [...prev, newMessage];
          });
          setLastSynced(new Date());
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    }
  }, [historyPlayer]);

  const { isConnected: sseConnected, status: sseStatus } = useSSE({
    subscriptions: sseSubscriptions,
    onEvent: handleSSEEvent,
    enabled: !!historyPlayer
  });

  const handleSendHistoryMessage = async () => {
    if (!historyNewMessage.trim() || !historyPlayer) return;
    if (sendingHistoryMessageRef.current) return;
    sendingHistoryMessageRef.current = true;
    const messageText = historyNewMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      direction: 'outgoing',
      text: messageText,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };
    setHistoryMessages(prev => [...prev, optimisticMessage]);
    setHistoryNewMessage('');
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    try {
      setSendingHistoryMessage(true);
      const response = await sendWhatsAppMessage({
        playerIds: [historyPlayer._id],
        message: messageText,
        previewUrl: false
      });
      setHistoryMessages(prev => prev.map(msg => 
        msg._id === tempId 
          ? { ...msg, _id: response.results?.[0]?.messageId || tempId, status: 'sent' }
          : msg
      ));
    } catch (err: any) {
      console.error(err);
      setHistoryMessages(prev => prev.map(msg => 
        msg._id === tempId ? { ...msg, status: 'failed' } : msg
      ));
      setError(err?.response?.data?.error || 'Failed to send message');
    } finally {
      setSendingHistoryMessage(false);
      sendingHistoryMessageRef.current = false;
    }
  };

  useEffect(() => {
    if (hasFetchedInitial.current) return;
    hasFetchedInitial.current = true;
    fetchPlayers();
    fetchMatches();
  }, []);

  useEffect(() => {
    const unsubscribe = matchEvents.subscribe(() => {
      fetchMatches();
    });
    return unsubscribe;
  }, []);

  const stats = useMemo(() => {
    const total = players.length;
    const selected = selectedPlayers.length;
    return { total, selected };
  }, [players, selectedPlayers]);

  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return players;
    const term = searchTerm.toLowerCase();
    return players.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.phone.includes(term)
    );
  }, [players, searchTerm]);

  const toggleSelection = (id: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((playerId) => playerId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (players.length === 0) return;
    const allIds = players.map((player) => player._id);
    setSelectedPlayers(allIds);
  };

  const handleClearSelection = () => {
    setSelectedPlayers([]);
  };

  const handleAddPlayer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newPlayer.name.trim() || !newPlayer.phone.trim()) {
      setError('Name and WhatsApp number are required.');
      return;
    }
    if (!validateIndianPhoneNumber(newPlayer.phone)) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }
    const sanitizedPhone = sanitizeIndianPhoneNumber(newPlayer.phone);
    try {
      setError(null);
      await createPlayer({
        name: newPlayer.name.trim(),
        phone: sanitizedPhone,
        notes: newPlayer.notes.trim() || undefined,
      });
      setNewPlayer({ name: '', phone: '', notes: '' });
      setShowPlayerModal(false);
      await fetchPlayers();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to save player');
    }
  };

  const handleSendMessages = async () => {
    if (!selectedPlayers.length) {
      setError('Please select at least one player.');
      return;
    }
    if (sendMode === 'text') {
      if (!message.trim()) {
        setError('Message content cannot be empty.');
        return;
      }
    } else {
      if (!selectedMatch) {
        setError('Please select a match for availability tracking.');
        return;
      }
      if (selectedTemplate.id === 'mavericks_team_availability') {
        if (!matchDateTime.trim() || !matchVenue.trim()) {
          setError('Please provide Match Time and Venue details.');
          return;
        }
      } else if (selectedTemplate.id === 'custom') {
        if (!templateName.trim()) {
          setError('Template name is required.');
          return;
        }
      }
    }
    const targets = selectedPlayers;
    try {
      setSending(true);
      setError(null);
      setSendResult(null);
      const payload: Parameters<typeof sendWhatsAppMessage>[0] = { playerIds: targets };
      if (selectedMatch) {
        payload.matchId = selectedMatch._id;
        payload.matchTitle = selectedMatch.opponent || 'Practice Match';
      }
      if (sendMode === 'text') {
        payload.message = message.trim();
        payload.previewUrl = false;
      } else {
        if (selectedTemplate.id === 'mavericks_team_availability') {
          payload.template = {
            name: selectedTemplate.name,
            languageCode: templateLanguage.trim() || selectedTemplate.language,
            components: [{
              type: 'body',
              parameters: [
                { type: 'text', text: '{{PLAYER_NAME}}' },
                { type: 'text', text: matchDateTime.trim() },
                { type: 'text', text: matchVenue.trim() }
              ]
            }]
          };
        } else if (selectedTemplate.id === 'team_availability_check_new') {
          payload.template = {
            name: selectedTemplate.name,
            languageCode: templateLanguage.trim() || selectedTemplate.language,
            components: [{
              type: 'body',
              parameters: [
                { type: 'text', text: '{{PLAYER_NAME}}' },
                { type: 'text', text: matchVenue.trim() },
                { type: 'text', text: matchDateTime.trim() }
              ]
            }]
          };
        } else if (selectedTemplate.id === 'custom') {
          const bodyParams = templateBodyParams
            .split('\n')
            .map((line: string) => line.trim())
            .filter(Boolean)
            .map((text: string) => ({ type: 'text', text }));
          if (bodyParams.length !== templateExpectedParams) {
            setError(`Template expects ${templateExpectedParams} placeholder(s) but you provided ${bodyParams.length}.`);
            return;
          }
          payload.template = {
            name: templateName.trim(),
            languageCode: templateLanguage.trim() || 'en_US',
            components: bodyParams.length ? [{ type: 'body', parameters: bodyParams }] : undefined,
          };
        }
      }
      const response = await sendWhatsAppMessage(payload);
      setSendResult(response?.data || null);
      setShowAlert(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Neural Network Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
        style={{ zIndex: 0 }}
      />

      {/* Gradient Overlays */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <MessageSquare className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                WhatsApp Hub
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/20 border border-violet-500/30 rounded-full text-xs text-violet-400">
                  <Brain className="w-3 h-3" />
                  AI
                </span>
              </h2>
              <p className="text-sm text-slate-400">Manage contacts & send notifications</p>
            </div>
          </div>

          {/* Compact Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white font-medium">{stats.total}</span>
              <span className="text-xs text-slate-500">players</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">{stats.selected}</span>
              <span className="text-xs text-emerald-400/70">selected</span>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-sm">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-rose-500/20 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Player List - 3 columns */}
          <div className="lg:col-span-3 bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-2xl overflow-hidden">
            {/* List Header */}
            <div className="p-4 border-b border-slate-700/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Players
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    disabled={loading || players.length === 0}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-all disabled:opacity-50"
                  >
                    Select All
                  </button>
                  {selectedPlayers.length > 0 && (
                    <button
                      onClick={handleClearSelection}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingPlayer(null); setNewPlayer({ name: '', phone: '', notes: '' }); setShowPlayerModal(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg shadow-lg shadow-emerald-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            {/* Player List */}
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                  <p className="text-sm text-slate-400">Loading players...</p>
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Users className="w-10 h-10 text-slate-600" />
                  <p className="text-sm text-slate-400">{searchTerm ? 'No players found' : 'Add your first player'}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/30">
                  {filteredPlayers.map(player => {
                    const isSelected = selectedPlayers.includes(player._id);
                    return (
                      <div
                        key={player._id}
                        className={`p-3 flex items-center gap-3 cursor-pointer transition-all hover:bg-slate-800/50 ${isSelected ? 'bg-emerald-500/10' : ''}`}
                        onClick={() => toggleSelection(player._id)}
                      >
                        {/* Selection Checkbox */}
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-slate-500'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white font-medium shrink-0">
                          {player.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <PlayerNameLink
                            playerId={player._id}
                            playerName={player.name}
                            className="text-sm font-medium text-white hover:text-emerald-400 transition-colors"
                          />
                          <p className="text-xs text-slate-500">{player.phone}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => fetchHistory(player)}
                            className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-all"
                            title="Chat"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingPlayer(player); setShowPlayerModal(true); }}
                            className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-400 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPlayerToDelete(player)}
                            className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Message Panel - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Message Settings Card */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Message Settings</h3>
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSendMode('template')}
                  className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                    sendMode === 'template'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800/50 text-slate-400 border border-transparent hover:border-slate-700'
                  }`}
                >
                  Template
                </button>
                <button
                  onClick={() => setSendMode('text')}
                  className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                    sendMode === 'text'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800/50 text-slate-400 border border-transparent hover:border-slate-700'
                  }`}
                >
                  Text
                </button>
              </div>

              {sendMode === 'text' ? (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(autoCapitalize(e.target.value))}
                    placeholder="Type your message..."
                    className="w-full p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                    rows={4}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Match Selection */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Select Match *</label>
                    <select
                      value={selectedMatch?._id || ''}
                      onChange={(e) => {
                        if (e.target.value === 'create-new') {
                          setShowMatchForm(true);
                          return;
                        }
                        const match = matches.find(m => m._id === e.target.value);
                        setSelectedMatch(match || null);
                        if (match) {
                          const matchDate = new Date(match.date);
                          const timeStr = match.time || matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                          setMatchDateTime(`${matchDate.toLocaleDateString()} ${timeStr}`);
                          setMatchVenue(match.ground || '');
                        }
                      }}
                      className="w-full p-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="">-- Select match --</option>
                      <option value="create-new">+ Create new match</option>
                      {matches.map(match => {
                        const matchDate = new Date(match.date);
                        const dateStr = matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        return (
                          <option key={match._id} value={match._id}>
                            {dateStr} - {match.opponent || 'Practice'} @ {match.ground}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {selectedMatch && (
                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                      <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(selectedMatch.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-cyan-400">
                        <MapPin className="w-3 h-3" />
                        <span>{selectedMatch.ground}</span>
                      </div>
                    </div>
                  )}

                  {/* Template Selection */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Template</label>
                    <select
                      value={selectedTemplate.id}
                      onChange={(e) => {
                        const template = TEMPLATES.find(t => t.id === e.target.value) || TEMPLATES[0];
                        setSelectedTemplate(template);
                        setTemplateName(template.name);
                        setTemplateLanguage(template.language);
                        setTemplateExpectedParams(template.expectedParams);
                      }}
                      className="w-full p-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      {TEMPLATES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {(selectedTemplate.id === 'mavericks_team_availability' || selectedTemplate.id === 'team_availability_check_new') && (
                    <>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Venue</label>
                        <input
                          type="text"
                          value={matchVenue}
                          onChange={(e) => setMatchVenue(e.target.value)}
                          placeholder="Ground name"
                          className="w-full p-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Date & Time</label>
                        <input
                          type="text"
                          value={matchDateTime}
                          onChange={(e) => setMatchDateTime(e.target.value)}
                          placeholder="Sunday, 11th Jan | 2:00 PM"
                          className="w-full p-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                    </>
                  )}

                  {selectedTemplate.id === 'custom' && (
                    <>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Template Name</label>
                        <input
                          type="text"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="e.g., hello_world"
                          className="w-full p-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Parameters (one per line)</label>
                        <textarea
                          value={templateBodyParams}
                          onChange={(e) => setTemplateBodyParams(autoCapitalize(e.target.value))}
                          placeholder="Param 1&#10;Param 2"
                          className="w-full p-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  {/* Template Preview */}
                  {selectedTemplate.id !== 'custom' && (
                    <div>
                      <label className="text-xs text-slate-400 mb-2 block">Preview</label>
                      <div className="bg-[#efe7de] rounded-xl p-3 max-h-48 overflow-y-auto">
                        <div className="bg-[#dcf8c6] rounded-xl px-3 py-2 text-[13px] text-gray-800 max-w-[90%] ml-auto relative">
                          <div className="whitespace-pre-wrap text-xs leading-relaxed">
                            {selectedTemplate.format
                              .replace('{{1}}', players[0]?.name || 'Player Name')
                              .replace('{{2}}', matchVenue || 'Venue')
                              .replace('{{3}}', matchDateTime || 'Date & Time')}
                          </div>
                          <div className="text-[9px] text-gray-500 text-right mt-1">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {selectedTemplate.buttons && (
                          <div className="mt-2 space-y-1">
                            {selectedTemplate.buttons.map((btn, i) => (
                              <div key={i} className="bg-white rounded-lg py-1.5 text-center text-xs font-medium text-emerald-600">
                                {btn}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Validation */}
              {(!selectedPlayers.length || (sendMode === 'template' && !selectedMatch)) && (
                <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400">
                    {!selectedPlayers.length ? 'Select players from the list to send' : 'Select a match for tracking'}
                  </p>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendMessages}
                disabled={sending || loading || selectedPlayers.length === 0 || (sendMode === 'template' && !selectedMatch)}
                className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:shadow-emerald-500/30"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send to {selectedPlayers.length} players
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Send Result Modal */}
      {sendResult && showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  sendResult.failed === 0 ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                }`}>
                  {sendResult.failed === 0 ? (
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-400" />
                  )}
                </div>
                <div>
                  <h3 className={`font-bold ${sendResult.failed === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {sendResult.failed === 0 ? 'Sent Successfully!' : 'Partial Success'}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {sendResult.sent}/{sendResult.attempted} delivered
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAlert(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {sendResult.results && sendResult.results.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                {sendResult.results.map((result, index) => (
                  <div key={index} className={`p-3 rounded-xl border ${
                    result.status === 'sent' 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-rose-500/10 border-rose-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{result.name}</p>
                        <p className="text-xs text-slate-500">{result.phone}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        result.status === 'sent'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}>
                        {result.status === 'sent' ? '✓ Sent' : '✗ Failed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowAlert(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Chat History Modal */}
      {historyPlayer && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm md:p-4">
          <div className="bg-slate-900 rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] flex flex-col border border-slate-700/50 overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700/30 flex items-center justify-between bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <PlayerNameLink
                    playerId={historyPlayer._id}
                    playerName={historyPlayer.name}
                    className="text-base font-bold text-white hover:text-emerald-400 transition-colors"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{historyPlayer.phone}</span>
                    {sseConnected && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchHistory(historyPlayer)}
                  disabled={loadingHistory}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-all"
                >
                  <RefreshCw className={`w-5 h-5 ${loadingHistory ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setHistoryPlayer(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#efe7de] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat min-h-[300px] max-h-[50vh]">
              {loadingHistory && historyMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                  <p className="text-sm text-gray-600">Loading...</p>
                </div>
              ) : historyMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
                  <MessageCircle className="w-10 h-10 text-gray-500" />
                  <p className="text-sm text-gray-600">No messages yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {hasMoreHistory && (
                    <button
                      onClick={loadMoreHistory}
                      disabled={loadingMoreHistory}
                      className="mx-auto px-3 py-1.5 bg-white rounded-full text-xs text-emerald-600 font-medium shadow-sm"
                    >
                      {loadingMoreHistory ? 'Loading...' : 'Load older'}
                    </button>
                  )}
                  {historyMessages.map((msg, idx) => {
                    const isIncoming = msg.direction === 'incoming';
                    return (
                      <div key={msg._id || idx} className={`flex ${isIncoming ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                          isIncoming ? 'bg-white text-gray-800' : 'bg-[#dcf8c6] text-gray-800'
                        }`}>
                          {msg.imageId && (
                            <img
                              src={`${process.env.REACT_APP_API_URL || ''}/whatsapp/media/${msg.imageId}`}
                              alt="Shared"
                              className="max-w-full rounded-lg mb-1 cursor-pointer"
                              onClick={() => window.open(`${process.env.REACT_APP_API_URL || ''}/whatsapp/media/${msg.imageId}`, '_blank')}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                          {msg.text && msg.text !== '[Image]' && (
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                          )}
                          <div className="text-[10px] text-gray-500 text-right mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-slate-800/50 border-t border-slate-700/30 flex items-center gap-2">
              <input
                type="text"
                value={historyNewMessage}
                onChange={(e) => setHistoryNewMessage(autoCapitalize(e.target.value))}
                placeholder="Type a message..."
                className="flex-1 p-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendHistoryMessage();
                  }
                }}
              />
              <button
                onClick={handleSendHistoryMessage}
                disabled={!historyNewMessage.trim() || sendingHistoryMessage}
                className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all"
              >
                {sendingHistoryMessage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-slate-800/30 border-t border-slate-700/30 flex items-center justify-between">
              <span className={`flex items-center gap-1.5 text-xs ${sseConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {sseConnected ? <Wifi className="w-3 h-3" /> : sseStatus === 'connecting' ? <Loader2 className="w-3 h-3 animate-spin" /> : <WifiOff className="w-3 h-3" />}
                {sseConnected ? 'Live' : sseStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </span>
              <button
                onClick={() => setHistoryPlayer(null)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Add/Edit Modal */}
      {showPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                {editingPlayer ? 'Edit Player' : 'Add Player'}
              </h3>
              <button
                onClick={() => { setShowPlayerModal(false); setEditingPlayer(null); }}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingPlayer ? handleUpdatePlayer : handleAddPlayer} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={editingPlayer ? editingPlayer.name : newPlayer.name}
                    onChange={(e) => {
                      const val = autoCapitalize(e.target.value);
                      editingPlayer
                        ? setEditingPlayer(prev => prev ? { ...prev, name: val } : null)
                        : setNewPlayer(prev => ({ ...prev, name: val }));
                    }}
                    placeholder="Player name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">WhatsApp Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={editingPlayer ? editingPlayer.phone : newPlayer.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      editingPlayer
                        ? setEditingPlayer(prev => prev ? { ...prev, phone: val } : null)
                        : setNewPlayer(prev => ({ ...prev, phone: val }));
                    }}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                <textarea
                  value={editingPlayer ? (editingPlayer.notes || '') : newPlayer.notes}
                  onChange={(e) => {
                    const val = autoCapitalize(e.target.value);
                    editingPlayer
                      ? setEditingPlayer(prev => prev ? { ...prev, notes: val } : null)
                      : setNewPlayer(prev => ({ ...prev, notes: val }));
                  }}
                  placeholder="Optional notes..."
                  className="w-full p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPlayerModal(false); setEditingPlayer(null); }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !(editingPlayer ? editingPlayer.name.trim() && validateIndianPhoneNumber(editingPlayer.phone) : newPlayer.name.trim() && validateIndianPhoneNumber(newPlayer.phone))}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : editingPlayer ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Match Creation Modal */}
      {showMatchForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Match</h2>
                <button
                  onClick={() => setShowMatchForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <MatchForm
                mode="create"
                onSubmit={handleCreateMatch}
                onCancel={() => setShowMatchForm(false)}
                loading={creatingMatch}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!playerToDelete}
        title="Delete Player"
        message={`Remove ${playerToDelete?.name} from the list?`}
        onConfirm={handleDeletePlayer}
        onCancel={() => setPlayerToDelete(null)}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default WhatsAppMessagingTab;
