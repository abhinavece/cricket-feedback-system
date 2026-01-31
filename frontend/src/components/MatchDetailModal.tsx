import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  X, Calendar, Clock, MapPin, Users, Send, Edit, Trash2, RefreshCw, 
  Search, Copy, CheckCircle, XCircle, AlertCircle, Circle, Bell, 
  UserPlus, Image as ImageIcon, Share2, Wifi, WifiOff, Loader2, 
  ExternalLink, MessageSquare, Trophy, Sparkles, Brain, Eye,
  LayoutGrid, UserCheck, ChevronRight
} from 'lucide-react';
import { getMatchAvailability, sendReminder, updateAvailability, deleteAvailability, getPlayers, createAvailability, sendWhatsAppImage } from '../services/api';
import { matchApi } from '../services/matchApi';
import SquadImageGenerator from './SquadImageGenerator';
import WhatsAppImageShareModal from './WhatsAppImageShareModal';
import ShareLinkModal from './ShareLinkModal';
import MatchFeedbackDashboard from './MatchFeedbackDashboard';
import { useSSE } from '../hooks/useSSE';

interface Match {
  _id: string;
  matchId: string;
  cricHeroesMatchId: string;
  date: string;
  time: string;
  slot: string;
  opponent: string;
  ground: string;
  locationLink?: string;
  matchType?: 'practice' | 'tournament' | 'friendly';
  status: 'draft' | 'confirmed' | 'cancelled' | 'completed';
  squad?: Array<{
    player: {
      _id: string;
      name: string;
      phone: string;
      role: string;
      team: string;
    };
    response: 'yes' | 'no' | 'tentative' | 'pending';
    respondedAt: string | null;
    notes: string;
  }>;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  notes: string;
  availabilitySent?: boolean;
  availabilitySentAt?: string;
  totalPlayersRequested?: number;
  confirmedPlayers?: number;
  declinedPlayers?: number;
  tentativePlayers?: number;
  noResponsePlayers?: number;
  lastAvailabilityUpdate?: string;
  squadStatus?: 'pending' | 'partial' | 'full';
}

interface AvailabilityRecord {
  _id: string;
  matchId: string;
  playerId: string;
  playerName: string;
  playerPhone: string;
  response: 'yes' | 'no' | 'tentative' | 'pending';
  respondedAt?: Date;
  messageContent?: string;
  outgoingMessageId?: string;
  incomingMessageId?: string;
  status: 'sent' | 'delivered' | 'read' | 'responded' | 'no_response';
  createdAt: Date;
  updatedAt: Date;
}

interface MatchDetailModalProps {
  match: Match;
  onClose: () => void;
  onEdit?: (match: Match) => void;
  onDelete?: (matchId: string) => void;
  onSendAvailability?: (match: Match) => void;
  initialTab?: 'overview' | 'responses' | 'squad' | 'feedback';
}

const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  match: initialMatch,
  onClose,
  onEdit,
  onDelete,
  onSendAvailability,
  initialTab = 'overview'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [match, setMatch] = useState<Match>(initialMatch);
  const [availabilities, setAvailabilities] = useState<AvailabilityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'responded' | 'pending' | 'yes' | 'no' | 'tentative'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'squad' | 'feedback'>(initialTab);
  const [sendingReminder, setSendingReminder] = useState(false);
  
  const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Array<{_id: string; name: string; phone: string}>>([]);
  const [selectedPlayersToAdd, setSelectedPlayersToAdd] = useState<string[]>([]);
  const [addingPlayers, setAddingPlayers] = useState(false);
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);
  
  const [showWhatsAppShareModal, setShowWhatsAppShareModal] = useState(false);
  const [squadImageBlob, setSquadImageBlob] = useState<Blob | null>(null);
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);

  // Animated neural network background
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
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
    }> = [];

    const numParticles = 25;
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.2 + 0.1,
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
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.05 * (1 - dist / 100)})`;
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

  const loadMatchAndAvailability = React.useCallback(async () => {
    try {
      setLoading(true);
      const updatedMatch = await matchApi.getMatch(match._id);
      setMatch(updatedMatch);

      if (updatedMatch.availabilitySent) {
        const response = await getMatchAvailability(match._id);
        setAvailabilities(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load match data:', err);
    } finally {
      setLoading(false);
    }
  }, [match._id]);

  const sseSubscriptions = useMemo(() => [`match:${match._id}`], [match._id]);

  const handleSSEEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'availability:update':
        setAvailabilities(prev =>
          prev.map(a =>
            a.playerId === event.playerId
              ? { ...a, response: event.response, respondedAt: event.respondedAt }
              : a
          )
        );
        if (event.stats) {
          setMatch(prev => ({
            ...prev,
            confirmedPlayers: event.stats.confirmed,
            declinedPlayers: event.stats.declined,
            tentativePlayers: event.stats.tentative,
            noResponsePlayers: event.stats.pending,
            lastAvailabilityUpdate: event.timestamp
          }));
        }
        break;
      case 'availability:new':
        loadMatchAndAvailability();
        break;
      case 'availability:delete':
        setAvailabilities(prev => prev.filter(a => a.playerId !== event.playerId));
        if (event.stats) {
          setMatch(prev => ({
            ...prev,
            confirmedPlayers: event.stats.confirmed,
            declinedPlayers: event.stats.declined,
            tentativePlayers: event.stats.tentative,
            noResponsePlayers: event.stats.pending,
            totalPlayersRequested: event.stats.total
          }));
        }
        break;
      case 'match:update':
        setMatch(prev => ({ ...prev, [event.field]: event.value }));
        break;
    }
  }, [loadMatchAndAvailability]);

  const { isConnected: sseConnected, status: sseStatus } = useSSE({
    subscriptions: sseSubscriptions,
    onEvent: handleSSEEvent,
    onConnect: () => console.log('📡 SSE connected for match:', match._id),
    onError: (error) => console.error('📡 SSE error:', error),
    enabled: true
  });

  useEffect(() => {
    loadMatchAndAvailability();
  }, [loadMatchAndAvailability]);

  const matchDate = new Date(match.date);
  const isUpcoming = matchDate > new Date();

  const getStatusConfig = () => {
    switch (match.status) {
      case 'confirmed': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: <CheckCircle className="w-3 h-3" /> };
      case 'draft': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', icon: <Clock className="w-3 h-3" /> };
      case 'cancelled': return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30', icon: <XCircle className="w-3 h-3" /> };
      case 'completed': return { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30', icon: <Trophy className="w-3 h-3" /> };
      default: return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', icon: <Circle className="w-3 h-3" /> };
    }
  };

  const getMatchTypeConfig = () => {
    switch (match.matchType) {
      case 'tournament': return { emoji: '🏆', text: 'Tournament' };
      case 'friendly': return { emoji: '🤝', text: 'Friendly' };
      default: return { emoji: '🏏', text: 'Practice' };
    }
  };

  const getResponseIcon = (response: string, size: string = 'w-5 h-5') => {
    switch (response) {
      case 'yes': return <CheckCircle className={`${size} text-emerald-400`} />;
      case 'no': return <XCircle className={`${size} text-rose-400`} />;
      case 'tentative': return <AlertCircle className={`${size} text-amber-400`} />;
      default: return <Circle className={`${size} text-slate-400`} />;
    }
  };

  const getResponseBadge = (response: string) => {
    switch (response) {
      case 'yes': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'no': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'tentative': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const filteredAvailabilities = availabilities.filter(avail => {
    const matchesSearch = avail.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         avail.playerPhone.includes(searchTerm);
    
    let matchesFilter = true;
    if (filterStatus === 'responded') {
      matchesFilter = avail.response !== 'pending';
    } else if (filterStatus === 'pending') {
      matchesFilter = avail.response === 'pending';
    } else if (filterStatus !== 'all') {
      matchesFilter = avail.response === filterStatus;
    }
    
    return matchesSearch && matchesFilter;
  });

  const availableSquad = availabilities.filter(a => a.response === 'yes');
  const tentativeSquad = availabilities.filter(a => a.response === 'tentative');
  const unavailableSquad = availabilities.filter(a => a.response === 'no');

  const stats = {
    total: match.totalPlayersRequested || 0,
    confirmed: match.confirmedPlayers || 0,
    declined: match.declinedPlayers || 0,
    tentative: match.tentativePlayers || 0,
    pending: match.noResponsePlayers || 0,
    responded: (match.confirmedPlayers || 0) + (match.declinedPlayers || 0) + (match.tentativePlayers || 0),
    responseRate: match.totalPlayersRequested ? Math.round((((match.confirmedPlayers || 0) + (match.declinedPlayers || 0) + (match.tentativePlayers || 0)) / match.totalPlayersRequested) * 100) : 0
  };

  const handleSendReminder = async () => {
    try {
      setSendingReminder(true);
      const response = await sendReminder(match._id);
      setActionMessage({ type: 'success', text: response.message || 'Reminders sent!' });
      loadMatchAndAvailability();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.error || 'Failed to send reminders' });
    } finally {
      setSendingReminder(false);
    }
  };

  const copySquadList = () => {
    const squadText = `Match: ${match.opponent || 'Practice Match'} @ ${match.ground}
Date: ${matchDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

AVAILABLE (${availableSquad.length}):
${availableSquad.map((p, i) => `${i + 1}. ${p.playerName} - ${p.playerPhone}`).join('\n')}

TENTATIVE (${tentativeSquad.length}):
${tentativeSquad.map((p, i) => `${i + 1}. ${p.playerName} - ${p.playerPhone}`).join('\n')}

NOT AVAILABLE (${unavailableSquad.length}):
${unavailableSquad.map((p, i) => `${i + 1}. ${p.playerName} - ${p.playerPhone}`).join('\n')}`.trim();
    
    navigator.clipboard.writeText(squadText);
    setActionMessage({ type: 'success', text: 'Squad list copied!' });
    setTimeout(() => setActionMessage(null), 2000);
  };

  const handleShareSquadImage = (imageBlob: Blob) => {
    setSquadImageBlob(imageBlob);
    setShowWhatsAppShareModal(true);
  };

  const handleSendWhatsAppImage = async (playerIds: string[], imageBlob: Blob) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const matchTitle = `${match.opponent || 'Match'} - ${matchDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
          
          await sendWhatsAppImage({
            playerIds,
            imageBase64: base64,
            caption: `🏏 Squad Availability\n${match.opponent || 'Match'} @ ${match.ground}\n📅 ${matchDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`,
            matchTitle
          });
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(imageBlob);
    });
  };

  const handleUpdateAvailabilityStatus = async (availabilityId: string, newStatus: 'yes' | 'no' | 'tentative') => {
    try {
      setUpdatingStatus(true);
      await updateAvailability(availabilityId, { response: newStatus });
      setActionMessage({ type: 'success', text: 'Status updated' });
      setEditingAvailabilityId(null);
      loadMatchAndAvailability();
      setTimeout(() => setActionMessage(null), 2000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteAvailability = async (availabilityId: string, playerName: string) => {
    if (!window.confirm(`Remove ${playerName}?`)) return;
    try {
      setUpdatingStatus(true);
      await deleteAvailability(availabilityId);
      setActionMessage({ type: 'success', text: `${playerName} removed` });
      loadMatchAndAvailability();
      setTimeout(() => setActionMessage(null), 2000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.error || 'Failed to remove' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenAddPlayerModal = async () => {
    try {
      const players = await getPlayers();
      const existingPlayerIds = new Set(availabilities.map(a => a.playerId));
      setAllPlayers(players.filter((p: any) => !existingPlayerIds.has(p._id)));
      setSelectedPlayersToAdd([]);
      setShowAddPlayerModal(true);
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to load players' });
    }
  };

  const handleAddPlayersToAvailability = async () => {
    if (selectedPlayersToAdd.length === 0) return;
    try {
      setAddingPlayers(true);
      await createAvailability(match._id, selectedPlayersToAdd);
      setActionMessage({ type: 'success', text: `Added ${selectedPlayersToAdd.length} player(s)` });
      setShowAddPlayerModal(false);
      setSelectedPlayersToAdd([]);
      loadMatchAndAvailability();
      setTimeout(() => setActionMessage(null), 2000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.error || 'Failed to add' });
    } finally {
      setAddingPlayers(false);
    }
  };

  const statusConfig = getStatusConfig();
  const matchTypeConfig = getMatchTypeConfig();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Eye className="w-4 h-4" /> },
    { id: 'responses', label: 'Responses', icon: <UserCheck className="w-4 h-4" />, count: availabilities.length },
    { id: 'squad', label: 'Squad', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'feedback', label: 'Feedback', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 md:p-4">
      <div className="relative bg-slate-900 rounded-2xl md:rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-white/10">
        
        {/* Neural Network Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
          style={{ zIndex: 0 }}
        />

        {/* Gradient Overlays */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full max-h-[95vh]">
          
          {/* Header */}
          <div className="shrink-0 p-4 md:p-6 border-b border-white/5">
            {/* Top Row */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="relative">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shadow-lg ${
                    match.status === 'confirmed' ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-emerald-500/20' :
                    match.status === 'completed' ? 'bg-gradient-to-br from-violet-500 to-purple-500 shadow-violet-500/20' :
                    match.status === 'cancelled' ? 'bg-gradient-to-br from-rose-500 to-pink-500 shadow-rose-500/20' :
                    'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20'
                  }`}>
                    <Trophy className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg md:text-xl font-bold text-white">{match.matchId}</h2>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                      {statusConfig.icon}
                      {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                    </span>
                    {match.matchType && (
                      <span className="px-2 py-0.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-[10px] text-slate-400">
                        {matchTypeConfig.emoji} {matchTypeConfig.text}
                      </span>
                    )}
                  </div>
                  <p className="text-sm md:text-base text-slate-300 font-medium mt-0.5">vs {match.opponent || 'TBD'}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Match Info Cards */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-xl border border-slate-700/30">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300 truncate">
                  {matchDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-xl border border-slate-700/30">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-slate-300 truncate">{match.time || match.slot}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-xl border border-slate-700/30">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                {match.locationLink ? (
                  <a
                    href={match.locationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-rose-300 hover:text-rose-200 truncate flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {match.ground}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-300 truncate">{match.ground}</span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {onEdit && (
                <button onClick={() => onEdit(match)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 text-xs font-medium rounded-lg transition-all border border-slate-700/50">
                  <Edit className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}
              {onSendAvailability && isUpcoming && !match.availabilitySent && (
                <button onClick={() => onSendAvailability(match)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg transition-all border border-emerald-500/30">
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              )}
              {match.availabilitySent && stats.pending > 0 && (
                <button onClick={handleSendReminder} disabled={sendingReminder} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-medium rounded-lg transition-all border border-amber-500/30 disabled:opacity-50">
                  <Bell className={`w-3.5 h-3.5 ${sendingReminder ? 'animate-pulse' : ''}`} />
                  <span className="hidden sm:inline">Remind</span> ({stats.pending})
                </button>
              )}
              {availabilities.length > 0 && (
                <button onClick={copySquadList} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs font-medium rounded-lg transition-all border border-purple-500/30">
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </button>
              )}
              <button onClick={() => setShowShareLinkModal(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 text-xs font-medium rounded-lg transition-all border border-pink-500/30">
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
              {onDelete && (
                <button onClick={() => onDelete(match._id)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-medium rounded-lg transition-all border border-rose-500/30">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 -mb-4 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 md:px-4 py-2.5 text-xs font-medium rounded-t-xl transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-slate-800/80 text-emerald-400 border-t border-l border-r border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                      activeTab === tab.id ? 'bg-emerald-500/30' : 'bg-slate-700/50'
                    }`}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Message Toast */}
          {actionMessage && (
            <div className={`mx-4 mt-4 p-3 rounded-xl flex items-center gap-2 ${
              actionMessage.type === 'success' 
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
            }`}>
              {actionMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span className="text-xs font-medium">{actionMessage.text}</span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Availability Stats */}
                {match.availabilitySent ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">Availability Summary</h3>
                      {match.availabilitySent && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-medium rounded border border-cyan-500/30">
                          <Send className="w-2.5 h-2.5" /> Sent
                        </span>
                      )}
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-4">
                      {[
                        { label: 'Sent', value: stats.total, icon: <Send className="w-4 h-4" />, color: 'cyan' },
                        { label: 'Yes', value: stats.confirmed, icon: <CheckCircle className="w-4 h-4" />, color: 'emerald' },
                        { label: 'No', value: stats.declined, icon: <XCircle className="w-4 h-4" />, color: 'rose' },
                        { label: 'Maybe', value: stats.tentative, icon: <AlertCircle className="w-4 h-4" />, color: 'amber' },
                        { label: 'Pending', value: stats.pending, icon: <Circle className="w-4 h-4" />, color: 'slate' },
                      ].map((stat, idx) => (
                        <div key={idx} className={`p-3 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-${stat.color}-400`}>{stat.icon}</span>
                          </div>
                          <p className={`text-xl font-bold text-${stat.color}-400`}>{stat.value}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-400">Response Rate</span>
                        <span className="text-xs font-bold text-white">{stats.responded}/{stats.total} ({stats.responseRate}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-700"
                          style={{ width: `${stats.responseRate}%` }}
                        />
                      </div>
                      {match.availabilitySentAt && (
                        <p className="text-[10px] text-slate-500 mt-2">
                          Sent {new Date(match.availabilitySentAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>

                    {/* Quick Player List */}
                    {availabilities.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Players</h4>
                          <button onClick={() => setActiveTab('responses')} className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                            View All <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid gap-2">
                          {availabilities.slice(0, 5).map((avail) => (
                            <div key={avail._id} className="flex items-center justify-between p-2.5 bg-slate-800/30 rounded-lg border border-slate-700/30">
                              <div className="flex items-center gap-2">
                                {getResponseIcon(avail.response, 'w-4 h-4')}
                                <span className="text-sm text-white">{avail.playerName}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getResponseBadge(avail.response)}`}>
                                {avail.response === 'yes' ? 'Yes' : avail.response === 'no' ? 'No' : avail.response === 'tentative' ? 'Maybe' : 'Pending'}
                              </span>
                            </div>
                          ))}
                          {availabilities.length > 5 && (
                            <button onClick={() => setActiveTab('responses')} className="p-2.5 text-center text-xs text-slate-400 hover:text-white bg-slate-800/20 rounded-lg border border-slate-700/30 hover:border-slate-600 transition-all">
                              +{availabilities.length - 5} more players
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
                      <Send className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">No Availability Sent</h3>
                    <p className="text-sm text-slate-400 max-w-sm mb-4">Send availability requests to track player responses for this match</p>
                    {onSendAvailability && isUpcoming && (
                      <button onClick={() => onSendAvailability(match)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-500/20">
                        <Send className="w-4 h-4" />
                        Send Availability Request
                      </button>
                    )}
                  </div>
                )}

                {/* Match Notes */}
                {match.notes && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Notes</h3>
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{match.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Responses Tab */}
            {activeTab === 'responses' && (
              <div className="space-y-4">
                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search players..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="tentative">Maybe</option>
                    <option value="pending">Pending</option>
                  </select>
                  <button onClick={handleOpenAddPlayerModal} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium rounded-xl border border-emerald-500/30 transition-all">
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>

                {/* Player List */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                  </div>
                ) : filteredAvailabilities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Users className="w-12 h-12 text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400">{availabilities.length === 0 ? 'No availability sent' : 'No matches'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAvailabilities.map((avail) => (
                      <div key={avail._id} className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 hover:border-slate-600 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getResponseIcon(avail.response)}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-white">{avail.playerName}</h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getResponseBadge(avail.response)}`}>
                                  {avail.response === 'yes' ? 'Yes' : avail.response === 'no' ? 'No' : avail.response === 'tentative' ? 'Maybe' : 'Pending'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{avail.playerPhone}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {editingAvailabilityId === avail._id ? (
                              <>
                                <button onClick={() => handleUpdateAvailabilityStatus(avail._id, 'yes')} disabled={updatingStatus} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] rounded hover:bg-emerald-500/30">Y</button>
                                <button onClick={() => handleUpdateAvailabilityStatus(avail._id, 'tentative')} disabled={updatingStatus} className="px-2 py-1 bg-amber-500/20 text-amber-400 text-[10px] rounded hover:bg-amber-500/30">?</button>
                                <button onClick={() => handleUpdateAvailabilityStatus(avail._id, 'no')} disabled={updatingStatus} className="px-2 py-1 bg-rose-500/20 text-rose-400 text-[10px] rounded hover:bg-rose-500/30">N</button>
                                <button onClick={() => setEditingAvailabilityId(null)} className="px-2 py-1 bg-slate-600 text-white text-[10px] rounded">✕</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => setEditingAvailabilityId(avail._id)} className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded transition-all">
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDeleteAvailability(avail._id, avail.playerName)} className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded transition-all">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Squad Tab */}
            {activeTab === 'squad' && (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                    <p className="text-2xl font-bold text-emerald-400">{availableSquad.length}</p>
                    <p className="text-xs text-slate-400">Available</p>
                  </div>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                    <p className="text-2xl font-bold text-amber-400">{tentativeSquad.length}</p>
                    <p className="text-xs text-slate-400">Maybe</p>
                  </div>
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-center">
                    <p className="text-2xl font-bold text-rose-400">{unavailableSquad.length}</p>
                    <p className="text-xs text-slate-400">Unavailable</p>
                  </div>
                </div>

                {/* Share Image Card */}
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">Share Squad Image</h4>
                        <p className="text-[10px] text-slate-400">Generate & share availability</p>
                      </div>
                    </div>
                    <SquadImageGenerator
                      match={match}
                      availableSquad={availableSquad}
                      tentativeSquad={tentativeSquad}
                      unavailableSquad={unavailableSquad}
                      onShareWhatsApp={handleShareSquadImage}
                      teamName="Mavericks XI"
                    />
                  </div>
                </div>

                {/* Squad Lists */}
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { title: 'Available', data: availableSquad, color: 'emerald', icon: <CheckCircle className="w-4 h-4" /> },
                    { title: 'Maybe', data: tentativeSquad, color: 'amber', icon: <AlertCircle className="w-4 h-4" /> },
                    { title: 'Unavailable', data: unavailableSquad, color: 'rose', icon: <XCircle className="w-4 h-4" /> },
                  ].map((section) => (
                    <div key={section.title} className={`bg-${section.color}-500/10 border border-${section.color}-500/30 rounded-xl p-4`}>
                      <div className={`flex items-center gap-2 mb-3 text-${section.color}-400`}>
                        {section.icon}
                        <span className="text-sm font-bold">{section.title} ({section.data.length})</span>
                      </div>
                      <div className="space-y-2">
                        {section.data.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-4">None</p>
                        ) : section.data.map((player, idx) => (
                          <div key={player._id} className="bg-slate-800/50 rounded-lg p-2.5">
                            <p className="text-sm text-white">{idx + 1}. {player.playerName}</p>
                            <p className="text-[10px] text-slate-500">{player.playerPhone}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <MatchFeedbackDashboard matchId={match._id} matchOpponent={match.opponent} />
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 p-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 text-xs ${sseConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {sseConnected ? (
                  <><Wifi className="w-3 h-3" /> Live</>
                ) : sseStatus === 'connecting' ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Connecting</>
                ) : (
                  <><WifiOff className="w-3 h-3" /> Offline</>
                )}
              </span>
              {match.lastAvailabilityUpdate && (
                <span className="text-[10px] text-slate-500 hidden md:inline">
                  Updated {new Date(match.lastAvailabilityUpdate).toLocaleTimeString()}
                </span>
              )}
            </div>
            <button onClick={onClose} className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-white text-sm font-medium rounded-xl border border-slate-700/50 transition-all">
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Add Player Modal */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Add Players
              </h3>
              <button onClick={() => setShowAddPlayerModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {allPlayers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">All players already added</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400 mb-3">{selectedPlayersToAdd.length} selected</p>
                <div className="flex-1 overflow-y-auto space-y-1.5 mb-4">
                  {allPlayers.map((player) => {
                    const isSelected = selectedPlayersToAdd.includes(player._id);
                    return (
                      <div
                        key={player._id}
                        onClick={() => isSelected ? setSelectedPlayersToAdd(prev => prev.filter(id => id !== player._id)) : setSelectedPlayersToAdd(prev => [...prev, player._id])}
                        className={`p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-800/50 border border-transparent hover:border-slate-700'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                            {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <p className="text-sm text-white">{player.name}</p>
                            <p className="text-[10px] text-slate-500">{player.phone}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddPlayerModal(false)} className="flex-1 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 text-white text-sm rounded-xl border border-slate-700/50 transition-all">Cancel</button>
                  <button onClick={handleAddPlayersToAvailability} disabled={selectedPlayersToAdd.length === 0 || addingPlayers} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                    {addingPlayers ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Add ({selectedPlayersToAdd.length})</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <WhatsAppImageShareModal
        isOpen={showWhatsAppShareModal}
        onClose={() => { setShowWhatsAppShareModal(false); setSquadImageBlob(null); }}
        imageBlob={squadImageBlob}
        matchTitle={`${match.opponent || 'Match'} @ ${match.ground}`}
        onSend={handleSendWhatsAppImage}
      />

      <ShareLinkModal
        isOpen={showShareLinkModal}
        onClose={() => setShowShareLinkModal(false)}
        resourceType="match"
        resourceId={match._id}
        resourceTitle={`${match.opponent || 'Match'} @ ${match.ground} - ${new Date(match.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MatchDetailModal;
