/**
 * @fileoverview Invite Page
 * 
 * Handles invite link flow:
 * 1. Fetches invite details
 * 2. Shows team info
 * 3. Allows user to join (requires login)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building2, 
  Users, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  LogIn,
  ChevronRight,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import LoginModal from '../components/home/LoginModal';

interface InviteDetails {
  code: string;
  role: string;
  organization: {
    _id: string;
    name: string;
    slug: string;
    logo?: string;
  };
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const InvitePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Fetch invite details
  useEffect(() => {
    const fetchInvite = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/organizations/invite/${code}`);
        const data = await response.json();
        
        if (!response.ok) {
          setError(data.message || 'Invalid invite link');
          return;
        }
        
        setInvite(data.invite);
      } catch (err) {
        setError('Failed to load invite details');
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchInvite();
    }
  }, [code]);

  // Handle join
  const handleJoin = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    try {
      setJoining(true);
      setJoinError(null);
      
      const response = await fetch(`${API_BASE_URL}/organizations/join/${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.code === 'ALREADY_MEMBER') {
          // User is already a member - redirect to dashboard
          setSuccess(true);
          setTimeout(() => {
            window.location.href = '/app/feedback';
          }, 2000);
          return;
        }
        setJoinError(data.message || 'Failed to join team');
        return;
      }
      
      setSuccess(true);
      
      // Redirect to dashboard after success
      setTimeout(() => {
        window.location.href = '/app/feedback';
      }, 2000);
      
    } catch (err) {
      setJoinError('Failed to join team. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  // Handle login success
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // After login, automatically try to join
    handleJoin();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'editor': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Loading State */}
          {loading && (
            <div className="p-12 text-center">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading invite details...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Invalid Invite</h2>
              <p className="text-slate-400 mb-6">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Go to Homepage
              </button>
            </div>
          )}

          {/* Success State */}
          {!loading && success && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Welcome to the Team!</h2>
              <p className="text-slate-400 mb-4">
                You've joined <span className="text-emerald-400 font-medium">{invite?.organization.name}</span>
              </p>
              <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
            </div>
          )}

          {/* Invite Details */}
          {!loading && !error && !success && invite && (
            <div className="p-8">
              {/* Team Logo/Icon */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {invite.organization.logo ? (
                    <img 
                      src={invite.organization.logo} 
                      alt={invite.organization.name}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-white" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {invite.organization.name}
                </h2>
                <p className="text-slate-400 text-sm">
                  You've been invited to join this team
                </p>
              </div>

              {/* Role Badge */}
              <div className="flex justify-center mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(invite.role)}`}>
                  You'll join as: {invite.role}
                </span>
              </div>

              {/* Join Error */}
              {joinError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {joinError}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {isAuthenticated ? (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Users className="w-5 h-5" />
                        Join Team
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all"
                  >
                    <LogIn className="w-5 h-5" />
                    Login to Join
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={() => navigate('/')}
                  className="w-full px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Info */}
              {!isAuthenticated && (
                <p className="mt-6 text-xs text-slate-500 text-center">
                  You'll need to sign in with Google to join the team
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default InvitePage;
