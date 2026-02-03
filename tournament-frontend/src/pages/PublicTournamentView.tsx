import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Trophy,
  Users,
  Search,
  Filter,
  ChevronDown,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Sparkles,
  Shield,
  Zap,
  Star,
  X,
} from 'lucide-react';
import axios from 'axios';

// Types
interface PublicPlayer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  teamName?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  status?: string;
}

interface PublicTeam {
  name: string;
  playerCount: number;
}

interface TournamentData {
  _id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  stats: {
    entryCount: number;
    teamCount: number;
  };
}

interface PublicData {
  tournament: TournamentData;
  entries: PublicPlayer[];
  teams: PublicTeam[];
}

// Background particle animation
const ParticleField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Array<{
      x: number; y: number; vx: number; vy: number; size: number; opacity: number; hue: number;
    }> = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        hue: 160 + Math.random() * 40,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.opacity})`;
        ctx.fill();

        // Connect nearby particles
        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(${p.hue}, 50%, 50%, ${0.1 * (1 - dist / 100)})`;
            ctx.stroke();
          }
        });
      });

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

// Role badge styles
const getRoleBadge = (role?: string) => {
  const styles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    batsman: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', icon: '🏏' },
    bowler: { bg: 'bg-rose-500/20', border: 'border-rose-500/30', text: 'text-rose-400', icon: '⚾' },
    'all-rounder': { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', icon: '⭐' },
    'wicket-keeper': { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', icon: '🧤' },
  };
  return styles[role || ''] || { bg: 'bg-slate-500/20', border: 'border-slate-500/30', text: 'text-slate-400', icon: '👤' };
};

// Main Component
const PublicTournamentView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filterRole, setFilterRole] = useState(searchParams.get('role') || '');
  const [filterTeam, setFilterTeam] = useState(searchParams.get('team') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch tournament data
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        // Backend route is /api/tournaments/public/:token
        const res = await axios.get(`${apiUrl}/tournaments/public/${token}`);
        setData(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load tournament');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Filtered players
  const filteredPlayers = useMemo(() => {
    if (!data?.entries) return [];
    
    return data.entries.filter((p) => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterRole && p.role !== filterRole) return false;
      if (filterTeam && p.teamName !== filterTeam) return false;
      return true;
    });
  }, [data?.entries, searchQuery, filterRole, filterTeam]);

  // Group players by team
  const playersByTeam = useMemo(() => {
    const grouped: Record<string, PublicPlayer[]> = {};
    filteredPlayers.forEach((p) => {
      const team = p.teamName || 'Unassigned';
      if (!grouped[team]) grouped[team] = [];
      grouped[team].push(p);
    });
    return grouped;
  }, [filteredPlayers]);

  // Format date
  const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-broadcast-900 flex items-center justify-center">
        <ParticleField />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-400 font-heading uppercase tracking-widest text-sm">
            Loading tournament...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-broadcast-900 flex items-center justify-center p-4">
        <ParticleField />
        <div className="relative z-10 glass-panel rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-rose-400" />
          </div>
          <h1 className="font-display text-2xl text-white mb-2">Tournament Not Found</h1>
          <p className="text-slate-400">{error || 'This link may have expired or the tournament is not yet published.'}</p>
        </div>
      </div>
    );
  }

  const { tournament, teams } = data;
  const primaryColor = tournament.branding?.primaryColor || '#14b8a6';

  return (
    <div className="min-h-screen bg-broadcast-900 text-white">
      <ParticleField />

      {/* Hero Header */}
      <header className="relative">
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}33 0%, transparent 50%, ${primaryColor}11 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-broadcast-900/50 to-broadcast-900" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-12 pb-8">
          {/* Branding */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center border-2"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}10 100%)`,
                borderColor: `${primaryColor}50`,
              }}
            >
              {tournament.branding?.logo ? (
                <img src={tournament.branding.logo} alt="" className="w-10 h-10 object-contain" />
              ) : (
                <Trophy className="w-7 h-7" style={{ color: primaryColor }} />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-heading uppercase tracking-[0.2em] text-slate-500">
                Tournament
              </span>
              <h1 className="font-display text-3xl md:text-4xl text-white leading-tight">
                {tournament.name}
              </h1>
            </div>
          </div>

          {/* Description */}
          {tournament.description && (
            <p className="text-center text-slate-400 max-w-2xl mx-auto mb-6 text-sm">
              {tournament.description}
            </p>
          )}

          {/* Meta badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {tournament.startDate && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-accent-400" />
                {formatDate(tournament.startDate)}
                {tournament.endDate && ` - ${formatDate(tournament.endDate)}`}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
              <Users className="w-3.5 h-3.5 text-accent-400" />
              {tournament.stats.entryCount} Players
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
              <Shield className="w-3.5 h-3.5 text-accent-400" />
              {tournament.stats.teamCount} Teams
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading uppercase tracking-wider"
              style={{
                background: tournament.status === 'active' ? '#10b98133' : '#f5970033',
                color: tournament.status === 'active' ? '#10b981' : '#f59e0b',
                border: `1px solid ${tournament.status === 'active' ? '#10b98150' : '#f5970050'}`,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {tournament.status === 'active' ? 'Live' : tournament.status}
            </span>
          </div>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-40 bg-broadcast-900/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent-500/50 transition-colors"
              />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${
                showFilters || filterRole || filterTeam
                  ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {(filterRole || filterTeam) && (
                <span className="w-5 h-5 rounded-full bg-accent-500 text-white text-xs flex items-center justify-center">
                  {[filterRole, filterTeam].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-3 animate-slide-up">
              {/* Role filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-accent-500/50"
              >
                <option value="">All Roles</option>
                <option value="batsman">Batsman</option>
                <option value="bowler">Bowler</option>
                <option value="all-rounder">All-Rounder</option>
                <option value="wicket-keeper">Wicket Keeper</option>
              </select>

              {/* Team filter */}
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-accent-500/50"
              >
                <option value="">All Teams</option>
                {teams.map((team) => (
                  <option key={team.name} value={team.name}>
                    {team.name} ({team.playerCount})
                  </option>
                ))}
              </select>

              {/* Clear filters */}
              {(filterRole || filterTeam) && (
                <button
                  onClick={() => {
                    setFilterRole('');
                    setFilterTeam('');
                  }}
                  className="px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Player Grid */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-400">
            Showing <span className="text-white font-medium">{filteredPlayers.length}</span> players
          </p>
        </div>

        {/* Grouped by team or flat list */}
        {filterTeam || Object.keys(playersByTeam).length === 1 ? (
          // Flat list when filtering by team
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlayers.map((player, idx) => (
              <PlayerCard key={player._id} player={player} index={idx} />
            ))}
          </div>
        ) : (
          // Grouped by team
          <div className="space-y-8">
            {Object.entries(playersByTeam).map(([team, players]) => (
              <div key={team}>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-accent-400" />
                  <h2 className="font-heading text-lg text-white uppercase tracking-wider">
                    {team}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-slate-400">
                    {players.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {players.map((player, idx) => (
                    <PlayerCard key={player._id} player={player} index={idx} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredPlayers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="font-heading text-xl text-white mb-2">No players found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-500">
            Powered by{' '}
            <span className="text-accent-400 font-heading">CricSmart</span>
            {' '}• AI Cricket Platform
          </p>
        </div>
      </footer>
    </div>
  );
};

// Player Card Component
const PlayerCard: React.FC<{ player: PublicPlayer; index: number }> = ({ player, index }) => {
  const roleStyle = getRoleBadge(player.role);

  return (
    <div
      className="glass-panel rounded-xl p-4 hover:border-accent-500/30 transition-all duration-200 animate-slide-up"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className={`w-12 h-12 rounded-xl ${roleStyle.bg} border ${roleStyle.border} flex items-center justify-center flex-shrink-0`}
        >
          <span className="font-display text-lg text-white">
            {player.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-white truncate">{player.name}</h3>

          {/* Role badge */}
          {player.role && (
            <span
              className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${roleStyle.bg} ${roleStyle.border} ${roleStyle.text} border`}
            >
              <span>{roleStyle.icon}</span>
              {player.role}
            </span>
          )}

          {/* Contact (masked) */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
            {player.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {player.phone}
              </span>
            )}
            {player.email && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="w-3 h-3" />
                {player.email}
              </span>
            )}
          </div>

          {/* Playing style */}
          {(player.battingStyle || player.bowlingStyle) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {player.battingStyle && (
                <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 capitalize">
                  🏏 {player.battingStyle}
                </span>
              )}
              {player.bowlingStyle && (
                <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-400">
                  ⚾ {player.bowlingStyle}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicTournamentView;
