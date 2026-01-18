import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Target, MessageCircle, ExternalLink, Loader2, Mail, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { getPlayerProfile, type PublicPlayerProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import PlayerFeedbackHistory from '../components/PlayerFeedbackHistory';

const PlayerProfilePage: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicPlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!playerId) {
        setError('Player ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getPlayerProfile(playerId);
        setProfile(response.data);
      } catch (err: any) {
        console.error('Error fetching player profile:', err);
        setError(err?.response?.data?.error || 'Failed to load player profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [playerId]);

  const formatRole = (role: string) => {
    const roleMap: Record<string, string> = {
      'batsman': 'Batsman',
      'bowler': 'Bowler',
      'all-rounder': 'All-rounder',
      'wicket-keeper': 'Wicket-keeper',
      'player': 'Player'
    };
    return roleMap[role] || role;
  };

  const formatBattingStyle = (style: string | null | undefined) => {
    if (!style) return null;
    const styleMap: Record<string, string> = {
      'right-handed': 'Right Handed',
      'left-handed': 'Left Handed'
    };
    return styleMap[style] || style;
  };

  const formatBowlingStyle = (style: string | null | undefined) => {
    if (!style || style === 'none') return null;
    const styleMap: Record<string, string> = {
      'right-arm-fast': 'Right Arm Fast',
      'right-arm-medium': 'Right Arm Medium',
      'right-arm-spin': 'Right Arm Spin',
      'left-arm-fast': 'Left Arm Fast',
      'left-arm-medium': 'Left Arm Medium',
      'left-arm-spin': 'Left Arm Spin'
    };
    return styleMap[style] || style;
  };

  const handleStartConversation = () => {
    // Navigate to WhatsApp tab with this player selected
    navigate('/', { state: { openChatWith: playerId } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-8 text-center">
          <p className="text-rose-400">{error || 'Player not found'}</p>
        </div>
      </div>
    );
  }

  const battingStyle = formatBattingStyle(profile.battingStyle);
  const bowlingStyle = formatBowlingStyle(profile.bowlingStyle);
  const hasSkills = battingStyle || bowlingStyle;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Player Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Main Profile Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl md:text-3xl font-bold shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-white truncate">
                {profile.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Users className="w-3 h-3" />
                  {profile.team || 'Mavericks XI'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Target className="w-3 h-3" />
                  {formatRole(profile.role)}
                </span>
                {profile.age && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30">
                    {profile.age} yrs
                  </span>
                )}
              </div>

              {/* Email */}
              {profile.email && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">{profile.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cricket Skills */}
        {hasSkills && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Cricket Skills
            </h3>
            <div className="space-y-3">
              {battingStyle && (
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏏</span>
                  <div>
                    <p className="text-xs text-slate-400">Batting</p>
                    <p className="text-sm font-medium text-white">{battingStyle}</p>
                  </div>
                </div>
              )}
              {bowlingStyle && (
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎯</span>
                  <div>
                    <p className="text-xs text-slate-400">Bowling</p>
                    <p className="text-sm font-medium text-white">{bowlingStyle}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* About */}
        {profile.about && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              About
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              "{profile.about}"
            </p>
          </div>
        )}

        {/* CricHeroes Link */}
        {profile.cricHeroesId && (
          <a
            href={`https://cricheroes.com/player-profile/${profile.cricHeroesId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:bg-slate-700/50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                View CricHeroes Profile
              </p>
              <p className="text-xs text-slate-400">
                See detailed stats and match history
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
          </a>
        )}

        {/* Feedback History Section */}
        {playerId && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Feedback History
              </h3>
            </div>
            <div className="p-4">
              <PlayerFeedbackHistory playerId={playerId} playerName={profile.name} />
            </div>
          </div>
        )}

        {/* Admin: Start Conversation Button */}
        {user?.role === 'admin' && (
          <button
            onClick={handleStartConversation}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            <MessageCircle className="w-5 h-5" />
            Start Conversation
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayerProfilePage;
