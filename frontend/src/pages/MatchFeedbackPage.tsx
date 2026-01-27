import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, XCircle, CheckCircle, AlertTriangle, User, Shield, LogIn, ChevronRight, Star, MessageSquare } from 'lucide-react';
import axios from 'axios';
import RatingStars from '../components/RatingStars';
import GroundRatingSelector from '../components/GroundRatingSelector';
import CountdownTimer from '../components/CountdownTimer';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import type { GroundRatingType, PerformanceRating } from '../types';

interface MatchInfo {
  opponent: string;
  date: string;
  time: string;
  ground: string;
  slot: string;
}

interface FeedbackLinkInfo {
  success: boolean;
  match: MatchInfo;
  canSubmit: boolean;
  alreadySubmitted: boolean;
  expiresAt: string | null;
}

type RatingField = 'batting' | 'bowling' | 'fielding' | 'teamSpirit';

// N/A labels for each rating category
const NA_LABELS: Record<RatingField, string> = {
  batting: "Didn't bat",
  bowling: "Didn't bowl",
  fielding: "Didn't field",
  teamSpirit: "Skip this"
};

interface FormData {
  playerName: string;
  batting: PerformanceRating;
  bowling: PerformanceRating;
  fielding: PerformanceRating;
  teamSpirit: PerformanceRating;
  feedbackText: string;
  issues: {
    venue: boolean;
    timing: boolean;
    umpiring: boolean;
    other: boolean;
  };
  otherIssueText: string;
  additionalComments: string;
  groundRating: GroundRatingType;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const MatchFeedbackPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth();
  const [linkInfo, setLinkInfo] = useState<FeedbackLinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginError, setLoginError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    playerName: '',
    batting: 0,  // 0 = not yet rated, null = N/A, 1-5 = rated
    bowling: 0,
    fielding: 0,
    teamSpirit: 0,
    feedbackText: '',
    issues: {
      venue: false,
      timing: false,
      umpiring: false,
      other: false,
    },
    otherIssueText: '',
    additionalComments: '',
    groundRating: null,
  });

  // Set player name from authenticated user
  useEffect(() => {
    if (user?.name) {
      setFormData(prev => ({ ...prev, playerName: user.name }));
    }
  }, [user]);

  useEffect(() => {
    const fetchLinkInfo = async () => {
      try {
        setLoading(true);
        const playerNameParam = user?.name ? `?playerName=${encodeURIComponent(user.name)}` : '';
        const response = await axios.get(`${API_BASE_URL}/feedback/link/${token}${playerNameParam}`);
        setLinkInfo(response.data);

        // Check if already submitted
        if (response.data.alreadySubmitted) {
          setSubmitted(true);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('This feedback link is invalid or does not exist.');
        } else if (err.response?.status === 410) {
          setError('This feedback link has expired.');
        } else {
          setError('Failed to load feedback form. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchLinkInfo();
    }
  }, [token, user]);

  const autoCapitalize = (text: string): string => {
    if (!text) return text;
    let result = text.charAt(0).toUpperCase() + text.slice(1);
    result = result.replace(/\. ([a-z])/g, (match) => `. ${match.charAt(2).toUpperCase()}`);
    return result;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.playerName.trim()) {
      newErrors.playerName = 'Player name is required';
    }

    if (!formData.feedbackText.trim()) {
      newErrors.feedbackText = 'Match experience feedback is required';
    }

    // Check that at least one rating is provided (not 0 and not all N/A)
    const ratingFields: RatingField[] = ['batting', 'bowling', 'fielding', 'teamSpirit'];
    const ratings = ratingFields.map(field => formData[field]);
    const hasAtLeastOneRating = ratings.some(r => r !== null && r !== 0 && r >= 1);
    
    if (!hasAtLeastOneRating) {
      newErrors.ratings = 'Please rate at least one category. Use "Didn\'t bat/bowl" if you didn\'t participate.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const authToken = localStorage.getItem('token');
      
      // Normalize ratings for API submission (convert 0 to null)
      const submissionData = {
        ...formData,
        batting: formData.batting === 0 ? null : formData.batting,
        bowling: formData.bowling === 0 ? null : formData.bowling,
        fielding: formData.fielding === 0 ? null : formData.fielding,
        teamSpirit: formData.teamSpirit === 0 ? null : formData.teamSpirit,
        userId: user?.id
      };
      
      await axios.post(
        `${API_BASE_URL}/feedback/link/${token}/submit`,
        submissionData,
        {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        }
      );
      setSubmitted(true);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrors({ playerName: 'You have already submitted feedback for this match.' });
      } else if (err.response?.status === 410) {
        setError('This feedback link has expired.');
      } else {
        setError('Failed to submit feedback. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number | GroundRatingType | PerformanceRating) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (['batting', 'bowling', 'fielding', 'teamSpirit'].includes(field) && errors.ratings) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.ratings;
        return newErrors;
      });
    }
  };

  const handleIssueChange = (issue: keyof typeof formData.issues) => {
    const newValue = !formData.issues[issue];
    setFormData(prev => ({
      ...prev,
      issues: { ...prev.issues, [issue]: newValue },
      // Clear otherIssueText when "other" is unchecked
      otherIssueText: issue === 'other' && !newValue ? '' : prev.otherIssueText
    }));
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoginError(null);
      const response = await axios.post(
        `${API_BASE_URL}/auth/google`,
        { token: credentialResponse.credential }
      );

      if (response.data.token && response.data.user) {
        login(response.data.token, response.data.user);
      } else {
        setLoginError('Authentication failed. Please try again.');
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.error || err.message || 'Failed to login. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getSlotDisplay = (slot: string, time: string) => {
    if (time) return time;
    switch(slot) {
      case 'morning': return 'Morning Session';
      case 'evening': return 'Evening Session';
      case 'night': return 'Night Session';
      default: return slot;
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-400 text-lg">Loading feedback form...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-10 max-w-md w-full text-center border border-white/10 shadow-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Link Not Available</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
          >
            Go to Home
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Already Submitted State
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Elegant Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-emerald-600/20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
          <div className="relative py-8 px-4">
            <div className="max-w-xl mx-auto text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors mb-4"
              >
                <div className="w-10 h-10 bg-emerald-500/20 backdrop-blur rounded-xl flex items-center justify-center border border-emerald-500/30">
                  <span className="text-lg font-bold">M</span>
                </div>
                <span className="font-semibold">Mavericks XI</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 -mt-8">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-10 max-w-md w-full text-center border border-white/10 shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Feedback Submitted!</h1>
            <p className="text-slate-400 mb-6">Thank you for sharing your match experience. Your feedback helps us improve!</p>
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-white/5">
              <p className="text-slate-500 text-sm mb-1">Match</p>
              <p className="text-white font-semibold">vs {linkInfo?.match.opponent || 'Unknown'}</p>
              <p className="text-slate-400 text-sm">{linkInfo?.match.ground} - {formatShortDate(linkInfo?.match.date || '')}</p>
            </div>
            
            {/* Conditional content based on authentication */}
            {isAuthenticated ? (
              /* Logged-in user: Show countdown timer */
              <CountdownTimer
                seconds={5}
                onComplete={() => {
                  // Ensure we land on the feedback tab, not the last visited tab
                  localStorage.setItem('activeTab', 'feedback');
                  navigate('/');
                }}
                message="Let's check out other feedback from the team!"
              />
            ) : (
              /* Non-logged-in user: Show login prompt */
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                  <p className="text-slate-300 mb-2">Want to see feedback from other players?</p>
                  <p className="text-slate-500 text-sm">Login to view all feedback and team insights</p>
                </div>
                
                <button
                  onClick={() => {
                    // Reload page to trigger login flow
                    window.location.reload();
                  }}
                  className="w-full py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                >
                  <LogIn className="w-5 h-5" />
                  Login to View Feedback
                </button>
                
                <Link
                  to="/"
                  className="block w-full py-3 px-6 rounded-xl font-medium text-slate-400 bg-slate-800/50 hover:bg-slate-700/50 transition-all border border-white/10 text-center"
                >
                  Submit Another Feedback
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Login Required State
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Elegant Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-emerald-600/20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
          <div className="relative py-8 px-4">
            <div className="max-w-xl mx-auto text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <div className="w-10 h-10 bg-emerald-500/20 backdrop-blur rounded-xl flex items-center justify-center border border-emerald-500/30">
                  <span className="text-lg font-bold">M</span>
                </div>
                <span className="font-semibold">Mavericks XI</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-8">
          {/* Match Preview Card */}
          {linkInfo && (
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                  <Star className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Match Feedback</h2>
                  <p className="text-sm text-slate-400">Share your experience</p>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                <div className="text-center mb-3">
                  <span className="text-emerald-400 font-semibold">Mavericks XI</span>
                  <span className="px-3 text-slate-500">vs</span>
                  <span className="text-rose-400 font-semibold">{linkInfo.match.opponent || 'TBD'}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>{formatShortDate(linkInfo.match.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-pink-400" />
                    <span>{linkInfo.match.ground}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Login Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-xl text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-slate-400 mb-6 text-sm">
              Please sign in with your Google account to submit feedback. This ensures authenticity and prevents impersonation.
            </p>

            {loginError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{loginError}</p>
              </div>
            )}

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setLoginError('Google login failed. Please try again.')}
                theme="filled_black"
                size="large"
                text="signin_with"
                shape="rectangular"
              />
            </div>

            <p className="text-xs text-slate-500 mt-6">
              Your identity will be verified and your name will be automatically filled in the feedback form.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!linkInfo) return null;

  const { match } = linkInfo;

  // Main Feedback Form (Authenticated User)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Elegant Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-emerald-600/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
        <div className="relative py-6 sm:py-8 px-4">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <div className="w-10 h-10 bg-emerald-500/20 backdrop-blur rounded-xl flex items-center justify-center border border-emerald-500/30">
                  <span className="text-lg font-bold">M</span>
                </div>
                <span className="font-semibold hidden sm:inline">Mavericks XI</span>
              </Link>

              {/* User Info */}
              <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-lg rounded-full px-3 py-1.5 border border-white/10">
                <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-white font-medium max-w-[120px] truncate">{user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Match Info Card */}
      <div className="max-w-xl mx-auto px-4 -mt-2 relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <MessageSquare className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Match Feedback</h1>
              <p className="text-sm text-slate-400">Share your experience from the match</p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
            <div className="text-center mb-4">
              <span className="text-lg font-bold text-emerald-400">Mavericks XI</span>
              <span className="px-3 text-slate-500">vs</span>
              <span className="text-lg font-bold text-rose-400">{match.opponent || 'TBD'}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="font-medium">{formatShortDate(match.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Time</p>
                  <p className="font-medium">{getSlotDisplay(match.slot, match.time)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Venue</p>
                  <p className="font-medium">{match.ground}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Form */}
      <div className="max-w-xl mx-auto p-4 space-y-4 mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Player Name (Read-only) */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <User className="w-4 h-4 inline mr-1.5" />
              Submitting as
            </label>
            <div className="flex items-center gap-3 bg-slate-800/50 border border-emerald-500/30 rounded-lg px-4 py-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {formData.playerName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-white font-medium">{formData.playerName}</span>
              <Shield className="w-4 h-4 text-emerald-400 ml-auto" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Your identity is verified through Google authentication
            </p>
          </div>

          {/* Ratings */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-300">Performance Ratings</h3>
              <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded-full">At least 1</span>
            </div>
            
            <p className="text-xs text-slate-400 mb-4">
              Didn't get a chance to bat or bowl? No problem - just mark it as N/A!
            </p>

            {errors.ratings && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-sm text-red-400">{errors.ratings}</p>
              </div>
            )}

            <div className="space-y-4">
              {([
                { key: 'batting' as RatingField, label: 'Batting', emoji: '🏏' },
                { key: 'bowling' as RatingField, label: 'Bowling', emoji: '⚡' },
                { key: 'fielding' as RatingField, label: 'Fielding', emoji: '🎯' },
                { key: 'teamSpirit' as RatingField, label: 'Team Spirit', emoji: '💪' },
              ]).map(({ key, label, emoji }) => (
                <div key={key} className="bg-slate-800/30 rounded-lg p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{emoji}</span>
                    <span className="text-sm font-medium text-slate-300">{label}</span>
                    {formData[key] === null && (
                      <span className="text-xs px-2 py-0.5 bg-slate-600 text-slate-300 rounded-full">N/A</span>
                    )}
                  </div>
                  <RatingStars
                    rating={formData[key]}
                    onChange={(value) => handleInputChange(key, value)}
                    size="md"
                    allowNA={true}
                    naLabel={NA_LABELS[key]}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Match Experience */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Match Experience <span className="text-emerald-400">*</span>
            </label>
            <textarea
              value={formData.feedbackText}
              onChange={(e) => handleInputChange('feedbackText', autoCapitalize(e.target.value))}
              rows={4}
              className={`w-full bg-slate-800/50 border ${errors.feedbackText ? 'border-red-500' : 'border-slate-600'} rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none`}
              placeholder="How was your match experience? Share your thoughts, highlights, and areas for improvement..."
            />
            {errors.feedbackText && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {errors.feedbackText}
              </p>
            )}
          </div>

          {/* Issues */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-300">Issues Faced</h3>
              <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded-full">Optional</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(formData.issues).map(([key, value]) => {
                const issueLabels: Record<string, string> = {
                  venue: 'Venue',
                  timing: 'Timing',
                  umpiring: 'Umpiring',
                  other: 'Other'
                };
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleIssueChange(key as keyof typeof formData.issues)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      value
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-600 hover:border-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {issueLabels[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                );
              })}
            </div>
            
            {/* Show text input when "Other" is selected */}
            {formData.issues.other && (
              <div className="mt-3">
                <input
                  type="text"
                  value={formData.otherIssueText}
                  onChange={(e) => handleInputChange('otherIssueText', autoCapitalize(e.target.value))}
                  placeholder="Please describe the issue..."
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Ground Rating */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <GroundRatingSelector
              value={formData.groundRating}
              onChange={(value) => handleInputChange('groundRating', value)}
            />
          </div>

          {/* Additional Comments */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Additional Comments
              <span className="text-xs text-slate-500 ml-2">(Optional)</span>
            </label>
            <textarea
              value={formData.additionalComments}
              onChange={(e) => handleInputChange('additionalComments', autoCapitalize(e.target.value))}
              rows={3}
              className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Any other comments, suggestions, or feedback for the team..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Feedback
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

      </div>

      <Footer minimal />
    </div>
  );
};

export default MatchFeedbackPage;
