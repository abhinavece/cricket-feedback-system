import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Building2,
  Hash,
  ExternalLink,
  ChevronRight,
  Ban,
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
  ineligibilityReason?: string | null;
  dateOfBirth?: string;
  cricHeroesId?: string;
  companyName?: string;
  address?: string;
  jerseyNumber?: number;
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

// Neural network background matching homepage design
const ParticleField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particles matching homepage design
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
    }> = [];

    const numParticles = Math.min(80, Math.floor(window.innerWidth / 15));
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle with emerald color
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
        ctx.fill();

        // Draw connections
        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.15 * (1 - dist / 120)})`;
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
  const [selectedPlayer, setSelectedPlayer] = useState<PublicPlayer | null>(null);

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

  // Set dynamic document title and OG meta tags
  useEffect(() => {
    if (data?.tournament) {
      const tournamentName = data.tournament.name;
      document.title = `${tournamentName} | CricSmart - AI Cricket Platform`;
      
      // Update or create OG meta tags
      const ogTags = {
        'og:title': `${tournamentName} - Player List`,
        'og:description': `View ${data.tournament.stats?.entryCount || 0} registered players for ${tournamentName}. Powered by CricSmart - AI Cricket Platform.`,
        'og:image': 'https://cricsmart.in/og-tournament-preview.png',
        'og:url': window.location.href,
        'og:type': 'website',
        'og:site_name': 'CricSmart - AI Cricket Platform',
      };

      Object.entries(ogTags).forEach(([property, content]) => {
        let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      });
    }

    return () => {
      document.title = 'CricSmart - AI Cricket Platform';
    };
  }, [data]);

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

  // Get display status (hide draft)
  const getDisplayStatus = (status: string) => {
    if (status === 'draft') return null;
    if (status === 'published' || status === 'active') return { label: 'Live', color: '#10b981' };
    if (status === 'ongoing') return { label: 'Ongoing', color: '#3b82f6' };
    if (status === 'completed') return { label: 'Completed', color: '#6b7280' };
    return null;
  };
  const displayStatus = getDisplayStatus(tournament.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <ParticleField />

      {/* Gradient orbs - AI themed colors */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
      </div>

      {/* Grid overlay */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* CricSmart Branding Header */}
      <div className="relative z-20 bg-slate-900/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <a 
            href="https://cricsmart.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              <span className="text-white font-black text-sm">C</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg text-white leading-none group-hover:text-emerald-400 transition-colors">
                CricSmart
              </span>
              <span className="text-[9px] uppercase tracking-widest text-emerald-400">
                AI Cricket Platform
              </span>
            </div>
          </a>
        </div>
      </div>

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

        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8 pb-6">
          {/* Tournament Branding */}
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
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-white leading-tight">
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
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {tournament.startDate && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-accent-400" />
                {formatDate(tournament.startDate)}
                {tournament.endDate && ` - ${formatDate(tournament.endDate)}`}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
              <Users className="w-3.5 h-3.5 text-accent-400" />
              {tournament.stats?.entryCount || 0} Players
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
              <Shield className="w-3.5 h-3.5 text-accent-400" />
              {tournament.stats?.teamCount || 0} Teams
            </span>
            {displayStatus && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading uppercase tracking-wider"
                style={{
                  background: `${displayStatus.color}33`,
                  color: displayStatus.color,
                  border: `1px solid ${displayStatus.color}50`,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {displayStatus.label}
              </span>
            )}
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
              <PlayerCard 
                key={player._id} 
                player={player} 
                index={idx} 
                onClick={() => setSelectedPlayer(player)}
              />
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
                    <PlayerCard 
                      key={player._id} 
                      player={player} 
                      index={idx}
                      onClick={() => setSelectedPlayer(player)}
                    />
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
          <a 
            href="https://cricsmart.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-accent-400 transition-colors"
          >
            <div className="w-5 h-5 rounded bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span>Powered by <span className="font-heading text-accent-400">CricSmart</span> • AI Cricket Platform</span>
          </a>
        </div>
      </footer>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal 
          player={selectedPlayer} 
          onClose={() => setSelectedPlayer(null)} 
        />
      )}
    </div>
  );
};

// Player Card Component
const PlayerCard: React.FC<{ player: PublicPlayer; index: number; onClick: () => void }> = ({ player, index, onClick }) => {
  const roleStyle = getRoleBadge(player.role);
  const isIneligible = player.status === 'withdrawn';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left glass-panel rounded-xl p-4 hover:border-accent-500/30 transition-all duration-200 animate-slide-up group ${
        isIneligible ? 'opacity-60' : ''
      }`}
      style={{ animationDelay: `${Math.min(index, 20) * 30}ms` }}
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
          <div className="flex items-center gap-2">
            <h3 className={`font-heading text-white truncate group-hover:text-accent-400 transition-colors ${
              isIneligible ? 'line-through text-slate-500' : ''
            }`}>
              {player.name}
            </h3>
            {isIneligible && (
              <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Ineligible
              </span>
            )}
            {player.jerseyNumber && (
              <span className="text-xs text-slate-500">#{player.jerseyNumber}</span>
            )}
          </div>

          {/* Role badge */}
          {player.role && (
            <span
              className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${roleStyle.bg} ${roleStyle.border} ${roleStyle.text} border`}
            >
              <span>{roleStyle.icon}</span>
              {player.role}
            </span>
          )}

          {/* Company */}
          {player.companyName && (
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
              <Building2 className="w-3 h-3" />
              <span className="truncate">{player.companyName}</span>
            </div>
          )}

          {/* Contact info on larger screens */}
          <div className="hidden sm:flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
            {player.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {player.phone}
              </span>
            )}
          </div>
        </div>

        {/* Arrow indicator */}
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-accent-400 transition-colors flex-shrink-0" />
      </div>
    </button>
  );
};

// Player Detail Modal (Bottom Sheet style for mobile)
const PlayerDetailModal: React.FC<{ player: PublicPlayer; onClose: () => void }> = ({ player, onClose }) => {
  const roleStyle = getRoleBadge(player.role);
  const isIneligible = player.status === 'withdrawn';

  // Format date
  const formatDOB = (dob?: string) => {
    if (!dob) return null;
    const date = new Date(dob);
    const age = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365));
    return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${age} yrs)`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full sm:max-w-lg sm:mx-4 glass-panel rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="p-5 pb-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div
              className={`w-16 h-16 rounded-2xl ${roleStyle.bg} border-2 ${roleStyle.border} flex items-center justify-center flex-shrink-0`}
            >
              <span className="font-display text-2xl text-white">
                {player.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Basic Info */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`font-display text-xl text-white ${isIneligible ? 'line-through text-slate-500' : ''}`}>
                  {player.name}
                </h2>
                {isIneligible && (
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Ineligible
                  </span>
                )}
              </div>
              
              {/* Role badge */}
              {player.role && (
                <span
                  className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded text-xs uppercase tracking-wider ${roleStyle.bg} ${roleStyle.border} ${roleStyle.text} border`}
                >
                  <span>{roleStyle.icon}</span>
                  {player.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-5 pb-6 space-y-3">
          {/* Ineligibility Reason */}
          {isIneligible && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <div className="flex items-center gap-2 text-rose-400 mb-1">
                <Ban className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Ineligibility Reason</span>
              </div>
              <p className="text-sm text-rose-300">{player.ineligibilityReason || 'NA'}</p>
            </div>
          )}

          {/* Contact Info */}
          <div className="grid grid-cols-1 gap-3">
            {player.phone && (
              <div className="p-3 rounded-xl bg-broadcast-700/50 border border-white/5">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">Phone</span>
                </div>
                <p className="text-sm text-white font-mono">{player.phone}</p>
              </div>
            )}

            {player.email && (
              <div className="p-3 rounded-xl bg-broadcast-700/50 border border-white/5">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">Email</span>
                </div>
                <p className="text-sm text-white break-all">{player.email}</p>
              </div>
            )}
          </div>

          {/* Additional Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {player.dateOfBirth && (
              <div className="p-3 rounded-xl bg-broadcast-700/50 border border-white/5">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">DOB</span>
                </div>
                <p className="text-sm text-white">{formatDOB(player.dateOfBirth)}</p>
              </div>
            )}

            {player.cricHeroesId && (
              <div className="p-3 rounded-xl bg-broadcast-700/50 border border-white/5">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Hash className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">CricHeroes</span>
                </div>
                <a
                  href={`https://cricheroes.com/player-profile/${player.cricHeroesId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent-400 hover:text-accent-300 flex items-center gap-1"
                >
                  {player.cricHeroesId}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {player.companyName && (
              <div className="p-3 rounded-xl bg-broadcast-700/50 border border-white/5">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">Company</span>
                </div>
                <p className="text-sm text-white">{player.companyName}</p>
              </div>
            )}

            {player.teamName && (
              <div className="p-3 rounded-xl bg-broadcast-700/50 border border-white/5">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">Team</span>
                </div>
                <p className="text-sm text-white">{player.teamName}</p>
              </div>
            )}
          </div>

          {/* Address */}
          {player.address && (
            <div className="p-3 rounded-xl bg-broadcast-700/50 border border-white/5">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider">Address</span>
              </div>
              <p className="text-sm text-white">{player.address}</p>
            </div>
          )}

          {/* Playing Style */}
          {(player.battingStyle || player.bowlingStyle) && (
            <div className="pt-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Playing Style</div>
              <div className="flex flex-wrap gap-2">
                {player.battingStyle && (
                  <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 capitalize">
                    🏏 {player.battingStyle}
                  </span>
                )}
                {player.bowlingStyle && (
                  <span className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                    ⚾ {player.bowlingStyle}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer branding */}
        <div className="px-5 py-4 border-t border-white/5 bg-broadcast-800/50">
          <a 
            href="https://cricsmart.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-accent-400 transition-colors"
          >
            <Zap className="w-3 h-3" />
            <span>Powered by CricSmart • AI Cricket Platform</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default PublicTournamentView;
