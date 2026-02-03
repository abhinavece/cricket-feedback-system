import React, { useEffect, useState } from 'react';
import { Routes, Route, useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Building2,
  MessageSquare,
  Settings,
  ChevronLeft,
  Calendar,
  Trophy,
  Share2,
  Copy,
  Check,
  Link as LinkIcon,
  ExternalLink,
  X,
} from 'lucide-react';
import { tournamentApi } from '../services/api';
import { useTournament } from '../contexts/TournamentContext';
import PlayersTab from '../components/tabs/PlayersTab';
import FranchisesTab from '../components/tabs/FranchisesTab';
import FeedbackTab from '../components/tabs/FeedbackTab';

type TabId = 'players' | 'franchises' | 'feedback' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  path: string;
}

const tabs: Tab[] = [
  { id: 'players', label: 'Players', icon: Users, path: '' },
  { id: 'franchises', label: 'Franchises', icon: Building2, path: 'franchises' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: 'feedback' },
];

const TournamentPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { setCurrentTournament } = useTournament();

  // Determine active tab from URL
  const getActiveTab = (): TabId => {
    const path = location.pathname.split('/').pop();
    if (path === 'franchises') return 'franchises';
    if (path === 'feedback') return 'feedback';
    if (path === 'settings') return 'settings';
    return 'players';
  };

  const [activeTab, setActiveTab] = useState<TabId>(getActiveTab());
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch tournament details
  const { data: tournamentData, isLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentApi.get(tournamentId!),
    enabled: !!tournamentId,
  });

  const tournament = tournamentData?.data;

  // Set current tournament in context
  useEffect(() => {
    if (tournament) {
      setCurrentTournament(tournament);
    }
    return () => setCurrentTournament(null);
  }, [tournament, setCurrentTournament]);

  // Generate public link mutation
  const generateLinkMutation = useMutation({
    mutationFn: () => tournamentApi.generatePublicLink(tournamentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    },
  });

  // Get public link URL
  const getPublicUrl = () => {
    if (!tournament?.publicToken) return null;
    const baseUrl = window.location.origin;
    return `${baseUrl}/share/tournament/${tournament.publicToken}`;
  };

  const publicUrl = getPublicUrl();

  // Copy link handler
  const handleCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab.id);
    const basePath = `/tournament/${tournamentId}`;
    navigate(tab.path ? `${basePath}/${tab.path}` : basePath);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-accent-500/20 text-accent-400 border-accent-500/30',
      published: 'bg-accent-500/20 text-accent-400 border-accent-500/30',
      ongoing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      completed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return styles[status] || styles.draft;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-16">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-600" />
        <h2 className="font-heading text-xl uppercase text-slate-400 mb-2">
          Tournament not found
        </h2>
        <Link to="/" className="text-accent-400 hover:text-accent-300 text-sm">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tournament Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors self-start"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl text-white">
              {tournament.name}
            </h1>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${getStatusBadge(tournament.status)}`}>
              {tournament.status}
            </span>
          </div>
          {tournament.startDate && (
            <p className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(tournament.startDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Share Button */}
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-500/20 text-accent-400 border border-accent-500/30 hover:bg-accent-500/30 transition-all text-sm font-heading uppercase tracking-wider"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Total Players</span>
          </div>
          <p className="score-display text-3xl text-white">
            {(tournament as any).stats?.entryCount ?? tournament.playerCount ?? 0}
          </p>
        </div>
        <div className="stat-card p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Building2 className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Franchises</span>
          </div>
          <p className="score-display text-3xl text-white">
            {(tournament as any).stats?.teamCount ?? tournament.franchiseCount ?? 0}
          </p>
        </div>
        <div className="stat-card p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Feedback</span>
          </div>
          <p className="score-display text-3xl text-accent-400">
            --
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/10">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-heading uppercase tracking-wider
                  border-b-2 transition-all duration-200
                  ${isActive
                    ? 'text-accent-400 border-accent-400'
                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-600'}
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        <Routes>
          <Route index element={<PlayersTab tournamentId={tournamentId!} />} />
          <Route path="franchises" element={<FranchisesTab tournamentId={tournamentId!} />} />
          <Route path="feedback" element={<FeedbackTab tournamentId={tournamentId!} />} />
        </Routes>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          />
          <div className="relative glass-panel rounded-2xl w-full max-w-md overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-accent-400" />
                </div>
                <h2 className="font-display text-xl text-white">Share Tournament</h2>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Info text */}
              <p className="text-sm text-slate-400">
                Share this link with anyone to let them view the tournament players and teams. 
                They won't need to log in.
              </p>

              {/* Link status */}
              {!publicUrl ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-400">
                      {tournament.status === 'draft' 
                        ? 'This will publish the tournament and generate a shareable link.'
                        : 'No public link generated yet. Click below to create one.'}
                    </p>
                  </div>
                  <button
                    onClick={() => generateLinkMutation.mutate()}
                    disabled={generateLinkMutation.isPending}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    {generateLinkMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {tournament.status === 'draft' ? 'Publishing...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4" />
                        {tournament.status === 'draft' ? 'Publish & Generate Link' : 'Generate Public Link'}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Link display */}
                  <div className="p-3 rounded-xl bg-broadcast-700/50 border border-white/10">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-heading uppercase tracking-wider">Public Link</span>
                    </div>
                    <p className="text-sm text-white break-all font-mono">{publicUrl}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 btn-primary flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex items-center justify-center gap-2 px-4"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </a>
                  </div>

                  {/* WhatsApp share */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out ${tournament.name} tournament!\n${publicUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/30 transition-all text-sm font-heading uppercase tracking-wider"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Share on WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentPage;
