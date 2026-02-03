import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { List } from 'react-window';
import { 
  Search, X, ChevronRight, Users, Calendar, Trophy,
  Phone, Mail, Building2, MapPin, Hash, ExternalLink,
  Filter, ChevronDown, Sparkles
} from 'lucide-react';
import axios from 'axios';
import { useViewTracking } from '../hooks/useViewTracking';

// Types
interface TournamentBranding {
  tagline?: string;
  logo?: string;
  coverImage?: string;
  primaryColor?: string;
  theme?: string;
}

interface TournamentStats {
  entryCount: number;
  teamCount: number;
}

interface Tournament {
  _id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  branding?: TournamentBranding;
  stats?: TournamentStats;
}

interface TournamentEntry {
  _id: string;
  name: string;
  role: string;
  teamName?: string;
  companyName?: string;
  cricHeroesId?: string;
  jerseyNumber?: number;
  phone?: string;
  email?: string;
  age?: number;
  address?: string;
}

interface TournamentData {
  tournament: Tournament;
  entries: TournamentEntry[];
  filters: {
    teams: string[];
    roles: string[];
  };
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasMore: boolean;
  };
}

// Role colors and labels
const ROLE_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  'batsman': { color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Batsman' },
  'bowler': { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'Bowler' },
  'all-rounder': { color: 'text-purple-400', bgColor: 'bg-purple-500/20', label: 'All-Rounder' },
  'wicket-keeper': { color: 'text-amber-400', bgColor: 'bg-amber-500/20', label: 'WK' },
  'captain': { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', label: 'Captain' },
  'vice-captain': { color: 'text-teal-400', bgColor: 'bg-teal-500/20', label: 'Vice Captain' },
  'coach': { color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: 'Coach' },
  'manager': { color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', label: 'Manager' },
  'player': { color: 'text-slate-400', bgColor: 'bg-slate-500/20', label: 'Player' },
};

// Avatar gradient colors based on role
const getAvatarGradient = (role: string) => {
  const gradients: Record<string, string> = {
    'batsman': 'from-blue-500 to-blue-600',
    'bowler': 'from-red-500 to-red-600',
    'all-rounder': 'from-purple-500 to-purple-600',
    'wicket-keeper': 'from-amber-500 to-amber-600',
    'captain': 'from-emerald-500 to-emerald-600',
    'vice-captain': 'from-teal-500 to-teal-600',
    'coach': 'from-orange-500 to-orange-600',
    'manager': 'from-cyan-500 to-cyan-600',
    'player': 'from-slate-500 to-slate-600',
  };
  return gradients[role] || gradients['player'];
};

// Get initials from name
const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Format date range
const formatDateRange = (start?: string, end?: string) => {
  if (!start) return '';
  const startDate = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  if (!end) return startDate.toLocaleDateString('en-US', opts);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', opts)}`;
};

const TournamentPublicView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const listRef = useRef<React.ComponentRef<typeof List>>(null);
  const { token } = useParams<{ token: string }>();

  // Track public link views
  useViewTracking({
    type: 'public-link',
    token: token,
    organizationId: 'default-org' // This will be resolved from the public link in the backend
  });
  
  const [data, setData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Bottom sheet state
  const [selectedPlayer, setSelectedPlayer] = useState<TournamentEntry | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  
  // List dimensions
  const [listHeight, setListHeight] = useState(500);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter entries client-side
  const filteredEntries = useMemo(() => {
    if (!data?.entries) return [];
    
    let filtered = data.entries;
    
    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.name?.toLowerCase().includes(query) ||
        entry.phone?.slice(-4).includes(query) ||
        entry.cricHeroesId?.toLowerCase().includes(query) ||
        entry.companyName?.toLowerCase().includes(query) ||
        entry.teamName?.toLowerCase().includes(query)
      );
    }
    
    // Role filter
    if (selectedRole) {
      filtered = filtered.filter(entry => entry.role === selectedRole);
    }
    
    // Team filter
    if (selectedTeam) {
      filtered = filtered.filter(entry => entry.teamName === selectedTeam);
    }
    
    return filtered;
  }, [data?.entries, debouncedSearch, selectedRole, selectedTeam]);

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

    // Reduce particles on mobile for performance
    const isMobile = window.innerWidth < 768;
    const numParticles = isMobile ? 30 : 50;
    
    const particles: Array<{
      x: number; y: number; vx: number; vy: number; radius: number; opacity: number;
    }> = [];
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
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

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.REACT_APP_API_URL || '';
        const response = await axios.get(`${apiUrl}/public/tournament/${token}`);
        
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError(response.data.error || 'Failed to load tournament');
        }
      } catch (err: any) {
        console.error('Error fetching tournament:', err);
        setError(err.response?.data?.error || 'Failed to load tournament data');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  // Calculate list height
  useEffect(() => {
    const updateHeight = () => {
      const headerHeight = 280; // Approximate header height
      const searchHeight = 60;
      const filterHeight = showFilters ? 50 : 0;
      const footerHeight = 80;
      const padding = 16;
      const available = window.innerHeight - headerHeight - searchHeight - filterHeight - footerHeight - padding;
      setListHeight(Math.max(300, available));
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [showFilters]);

  // Open player detail sheet
  const openPlayerDetail = useCallback((player: TournamentEntry) => {
    setSelectedPlayer(player);
    setSheetVisible(true);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }, []);

  // Close player detail sheet
  const closePlayerDetail = useCallback(() => {
    setSheetVisible(false);
    setTimeout(() => setSelectedPlayer(null), 300);
    document.body.style.overflow = '';
  }, []);

  // Player card row renderer (react-window v2 rowComponent: receives index, style, ariaAttributes)
  const PlayerCardRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties; ariaAttributes?: { 'aria-posinset': number; 'aria-setsize': number; role: 'listitem' } }) => {
    const entry = filteredEntries[index];
    if (!entry) return null;
    
    const roleConfig = ROLE_CONFIG[entry.role] || ROLE_CONFIG['player'];
    
    return (
      <div style={style} className="px-4 pb-2">
        <button
          onClick={() => openPlayerDetail(entry)}
          className="w-full bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-xl p-3
                     flex items-center gap-3 transition-all duration-150
                     active:scale-[0.98] active:bg-slate-700/60 text-left"
        >
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(entry.role)}
                          flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
            {getInitials(entry.name)}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{entry.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full ${roleConfig.bgColor} ${roleConfig.color}`}>
                {roleConfig.label}
              </span>
              {entry.teamName && (
                <span className="text-slate-400 text-xs truncate">{entry.teamName}</span>
              )}
            </div>
            {entry.companyName && (
              <p className="text-slate-500 text-xs mt-0.5 truncate">{entry.companyName}</p>
            )}
          </div>
          
          {/* Chevron */}
          <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
        </button>
      </div>
    );
  }, [filteredEntries, openPlayerDetail]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading tournament...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Tournament Not Found</h2>
          <p className="text-slate-400">{error || 'The tournament link may be invalid or expired.'}</p>
        </div>
      </div>
    );
  }

  const { tournament, filters } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Neural Network Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent" />
          
          <div className="relative px-4 pt-8 pb-6 text-center">
            {/* Logo */}
            {tournament.branding?.logo ? (
              <img 
                src={tournament.branding.logo} 
                alt={tournament.name}
                className="h-16 mx-auto mb-4 object-contain"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl 
                            flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            )}
            
            {/* Tournament Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {tournament.name}
            </h1>
            
            {/* Stats Pills */}
            <div className="flex justify-center gap-3 text-sm mb-3">
              <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {tournament.stats?.entryCount || filteredEntries.length} Players
              </span>
              {(tournament.stats?.teamCount || filters.teams.length > 0) && (
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  {tournament.stats?.teamCount || filters.teams.length} Teams
                </span>
              )}
            </div>
            
            {/* Dates */}
            {(tournament.startDate || tournament.endDate) && (
              <p className="text-slate-400 text-sm flex items-center justify-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDateRange(tournament.startDate, tournament.endDate)}
              </p>
            )}
          </div>
        </header>

        {/* Search & Filters */}
        <div className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 px-4 py-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-10 py-2.5
                       text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50
                       transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
          
          {/* Filter Toggle */}
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            <span className="text-slate-500 text-sm">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'player' : 'players'}
            </span>
          </div>
          
          {/* Filter Pills */}
          {showFilters && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              {/* Role Filter */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm
                         text-white focus:outline-none focus:border-emerald-500/50 flex-shrink-0"
              >
                <option value="">All Roles</option>
                {filters.roles.map(role => (
                  <option key={role} value={role}>
                    {ROLE_CONFIG[role]?.label || role}
                  </option>
                ))}
              </select>
              
              {/* Team Filter */}
              {filters.teams.length > 0 && (
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm
                           text-white focus:outline-none focus:border-emerald-500/50 flex-shrink-0"
                >
                  <option value="">All Teams</option>
                  {filters.teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              )}
              
              {/* Clear Filters */}
              {(selectedRole || selectedTeam) && (
                <button
                  onClick={() => { setSelectedRole(''); setSelectedTeam(''); }}
                  className="text-emerald-400 text-sm px-3 py-1.5 flex-shrink-0 hover:text-emerald-300"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Player List (Virtualized) */}
        <div className="px-0 pt-2">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No players found matching your search</p>
            </div>
          ) : (
            <List<object>
              listRef={listRef}
              rowCount={filteredEntries.length}
              rowHeight={88}
              rowComponent={PlayerCardRow as (props: { index: number; style: React.CSSProperties }) => React.ReactElement | null}
              rowProps={{}}
              style={{ height: listHeight, width: '100%' }}
              overscanCount={5}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-white/5 mt-4">
          <p className="text-slate-500 text-sm">Powered by</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-medium">CricSmart AI</span>
          </div>
          <p className="text-slate-600 text-xs mt-1">Cricket Platform</p>
        </footer>
      </div>

      {/* Player Detail Bottom Sheet */}
      {selectedPlayer && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300
                       ${sheetVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closePlayerDetail}
          />
          
          {/* Sheet */}
          <div
            className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out
                       ${sheetVisible ? 'translate-y-0' : 'translate-y-full'}`}
          >
            <div className="bg-slate-800 rounded-t-3xl max-h-[85vh] overflow-y-auto">
              {/* Drag Handle */}
              <div className="sticky top-0 bg-slate-800 pt-3 pb-2 z-10">
                <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto" />
              </div>
              
              {/* Player Header */}
              <div className="px-6 pb-6 text-center">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarGradient(selectedPlayer.role)}
                              flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4`}>
                  {getInitials(selectedPlayer.name)}
                </div>
                
                <h2 className="text-xl font-bold text-white mb-1">{selectedPlayer.name}</h2>
                
                <div className="flex items-center justify-center gap-2">
                  {(() => {
                    const roleConfig = ROLE_CONFIG[selectedPlayer.role] || ROLE_CONFIG['player'];
                    return (
                      <span className={`text-sm px-3 py-1 rounded-full ${roleConfig.bgColor} ${roleConfig.color}`}>
                        {roleConfig.label}
                      </span>
                    );
                  })()}
                  {selectedPlayer.jerseyNumber && (
                    <span className="text-sm px-3 py-1 rounded-full bg-slate-700 text-slate-300">
                      #{selectedPlayer.jerseyNumber}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Player Details */}
              <div className="px-6 pb-8">
                <div className="bg-slate-900/50 rounded-2xl overflow-hidden divide-y divide-white/5">
                  {selectedPlayer.phone && (
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Phone</p>
                        <p className="text-white">{selectedPlayer.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedPlayer.email && (
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Email</p>
                        <p className="text-white truncate">{selectedPlayer.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedPlayer.age && (
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Age</p>
                        <p className="text-white">{selectedPlayer.age} years</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedPlayer.teamName && (
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Team</p>
                        <p className="text-white">{selectedPlayer.teamName}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedPlayer.companyName && (
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Company</p>
                        <p className="text-white">{selectedPlayer.companyName}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedPlayer.address && (
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Address</p>
                        <p className="text-white">{selectedPlayer.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedPlayer.cricHeroesId && (
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <Hash className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-400 text-xs">CricHeroes ID</p>
                        <p className="text-white">{selectedPlayer.cricHeroesId}</p>
                      </div>
                      <a
                        href={`https://cricheroes.com/player/${selectedPlayer.cricHeroesId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-orange-500/20 rounded-full text-orange-400 hover:bg-orange-500/30"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Close Button */}
                <button
                  onClick={closePlayerDetail}
                  className="w-full mt-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium
                           transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TournamentPublicView;
