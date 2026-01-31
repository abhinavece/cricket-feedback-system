import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertCircle, Circle, 
  ExternalLink, Trophy, Sparkles, Brain, Share2, Zap
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { getHomepageUrl, getAppUrl, isLocalhost } from '../utils/domain';

interface AvailabilityRecord {
  _id: string;
  playerName: string;
  playerPhone: string;
  response: 'yes' | 'no' | 'tentative' | 'pending' | null;
  respondedAt: string;
}

interface MatchData {
  _id: string;
  matchId: string;
  opponent: string;
  date: string;
  time: string;
  slot: string;
  ground: string;
  locationLink?: string;
  status: string;
  matchType?: 'practice' | 'tournament' | 'friendly';
  teamName: string;
  availabilitySent: boolean;
  statistics: {
    totalPlayers: number;
    responded: number;
    available: number;
    unavailable: number;
    tentative: number;
    pending: number;
  };
}

interface PublicData {
  type: string;
  viewType: string;
  match: MatchData;
  availabilities: AvailabilityRecord[];
  squad: {
    available: AvailabilityRecord[];
    tentative: AvailabilityRecord[];
    unavailable: AvailabilityRecord[];
    pending: AvailabilityRecord[];
  };
}

const PublicMatchView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    const numParticles = 50;
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
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

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.1 * (1 - dist / 120)})`;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.REACT_APP_API_URL || '';
        const response = await axios.get(`${apiUrl}/public/${token}`);
        
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError(response.data.error || 'Failed to load data');
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('This link is invalid or has been removed');
        } else if (err.response?.status === 410) {
          setError('This link has expired');
        } else {
          setError('Failed to load match data');
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  const handleLogoClick = () => {
    if (user) {
      window.location.href = getAppUrl();
    } else {
      window.location.href = getHomepageUrl();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Match: ${data?.match?.teamName || 'Team'} vs ${data?.match?.opponent || 'TBD'}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl blur-lg opacity-50 animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-slate-400 text-lg">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden p-4">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center border border-white/10 shadow-2xl">
          <div className="w-20 h-20 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Link Not Available</h1>
          <p className="text-slate-400 text-base mb-6">{error}</p>
          <button
            onClick={handleLogoClick}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30"
          >
            Go to CricSmart
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { match, squad } = data;
  const matchDate = new Date(match.date);
  const totalPlayers = squad.available.length + squad.tentative.length + squad.unavailable.length + squad.pending.length;
  const responseRate = totalPlayers > 0 ? Math.round(((totalPlayers - squad.pending.length) / totalPlayers) * 100) : 0;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getSlotTime = (slot: string) => {
    switch(slot) {
      case 'morning': return '🌅 Morning';
      case 'evening': return '🌆 Evening';
      case 'night': return '🌙 Night';
      default: return match.time || slot;
    }
  };

  const getMatchTypeConfig = (type?: string) => {
    switch(type) {
      case 'tournament': return { emoji: '🏆', label: 'Tournament', color: 'amber' };
      case 'friendly': return { emoji: '🤝', label: 'Friendly', color: 'purple' };
      default: return { emoji: '🏏', label: 'Practice', color: 'slate' };
    }
  };

  const matchTypeConfig = getMatchTypeConfig(match.matchType);

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Neural Network Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button onClick={handleLogoClick} className="flex items-center gap-2 sm:gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-lg sm:text-xl">C</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-violet-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                </div>
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold text-white">CricSmart</span>
                <span className="block text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider">AI Cricket Platform</span>
              </div>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-sm text-slate-300 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Match Hero */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden mb-6">
          {/* Hero Gradient Bar */}
          <div className="h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500" />
          
          <div className="p-6 sm:p-8">
            {/* Match Type Badge */}
            <div className="flex justify-center mb-4">
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border bg-${matchTypeConfig.color}-500/20 text-${matchTypeConfig.color}-400 border-${matchTypeConfig.color}-500/30`}>
                <span>{matchTypeConfig.emoji}</span>
                {matchTypeConfig.label}
              </span>
            </div>

            {/* Teams Display */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6">
              <div className="text-right flex-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-400">
                  {match.teamName || 'Mavericks XI'}
                </h2>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl flex items-center justify-center border border-slate-600/50 shadow-lg">
                  <span className="text-slate-400 font-bold text-sm sm:text-base">VS</span>
                </div>
              </div>
              <div className="text-left flex-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-rose-400">
                  {match.opponent || 'TBD'}
                </h2>
              </div>
            </div>

            {/* Match Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-medium text-white">{formatDate(matchDate)}</p>
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider">Time</p>
                  <p className="text-sm font-medium text-white">{getSlotTime(match.slot)}</p>
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 col-span-2 sm:col-span-1">
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-pink-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider">Venue</p>
                  {match.locationLink ? (
                    <a
                      href={match.locationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-pink-400 hover:text-pink-300 flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{match.ground}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-white truncate">{match.ground}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Response Stats */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Squad Response</h3>
            </div>
            <span className="text-sm text-slate-500">{totalPlayers} players</span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400">Response Rate</span>
              <span className="text-emerald-400 font-medium">{responseRate}%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
              {squad.available.length > 0 && (
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                  style={{ width: `${(squad.available.length / totalPlayers) * 100}%` }}
                />
              )}
              {squad.tentative.length > 0 && (
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
                  style={{ width: `${(squad.tentative.length / totalPlayers) * 100}%` }}
                />
              )}
              {squad.unavailable.length > 0 && (
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-700"
                  style={{ width: `${(squad.unavailable.length / totalPlayers) * 100}%` }}
                />
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{squad.available.length}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1">Available</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-amber-400">{squad.tentative.length}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1">Maybe</p>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-rose-400">{squad.unavailable.length}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1">Unavailable</p>
            </div>
            <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-3 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-slate-400">{squad.pending.length}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1">Pending</p>
            </div>
          </div>
        </div>

        {/* Squad Lists */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Available */}
          <div className="bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/30 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 px-4 py-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-emerald-400">Available</span>
                <span className="ml-auto bg-emerald-500/30 px-2 py-0.5 rounded-full text-xs font-bold text-emerald-300">
                  {squad.available.length}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {squad.available.map((player, idx) => (
                <div key={player._id} className="bg-slate-800/50 rounded-xl px-3 py-2.5 flex items-center gap-3">
                  <span className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-white font-medium text-sm">{player.playerName}</span>
                </div>
              ))}
              {squad.available.length === 0 && (
                <p className="text-slate-500 text-center py-6 text-sm">No confirmed players</p>
              )}
            </div>
          </div>

          {/* Tentative */}
          <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/30 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 px-4 py-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-amber-400">Maybe</span>
                <span className="ml-auto bg-amber-500/30 px-2 py-0.5 rounded-full text-xs font-bold text-amber-300">
                  {squad.tentative.length}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {squad.tentative.map((player, idx) => (
                <div key={player._id} className="bg-slate-800/50 rounded-xl px-3 py-2.5 flex items-center gap-3">
                  <span className="w-6 h-6 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-white font-medium text-sm">{player.playerName}</span>
                </div>
              ))}
              {squad.tentative.length === 0 && (
                <p className="text-slate-500 text-center py-6 text-sm">No tentative players</p>
              )}
            </div>
          </div>

          {/* Not Available */}
          <div className="bg-rose-500/10 backdrop-blur-sm border border-rose-500/30 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500/20 to-rose-600/20 px-4 py-3 border-b border-rose-500/20">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span className="font-bold text-rose-400">Unavailable</span>
                <span className="ml-auto bg-rose-500/30 px-2 py-0.5 rounded-full text-xs font-bold text-rose-300">
                  {squad.unavailable.length}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {squad.unavailable.map((player, idx) => (
                <div key={player._id} className="bg-slate-800/50 rounded-xl px-3 py-2.5 flex items-center gap-3">
                  <span className="w-6 h-6 bg-rose-500/20 rounded-lg flex items-center justify-center text-rose-400 text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-white font-medium text-sm">{player.playerName}</span>
                </div>
              ))}
              {squad.unavailable.length === 0 && (
                <p className="text-slate-500 text-center py-6 text-sm">No declined players</p>
              )}
            </div>
          </div>
        </div>

        {/* Pending Section */}
        {squad.pending.length > 0 && (
          <div className="mt-4 bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-2xl overflow-hidden">
            <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <Circle className="w-5 h-5 text-slate-400" />
                <span className="font-bold text-slate-400">Awaiting Response</span>
                <span className="ml-auto bg-slate-500/30 px-2 py-0.5 rounded-full text-xs font-bold text-slate-300">
                  {squad.pending.length}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {squad.pending.map((player) => (
                  <span key={player._id} className="bg-slate-800/50 border border-slate-700/50 rounded-full px-3 py-1.5 text-sm text-slate-300">
                    {player.playerName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button onClick={handleLogoClick} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-sm font-medium">CricSmart</span>
            </button>
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Powered by AI Cricket Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicMatchView;
