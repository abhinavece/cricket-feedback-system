import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ConfirmDialog from './ConfirmDialog';
import {
  X,
  MapPin,
  Star,
  Navigation,
  Lightbulb,
  Car,
  TreeDeciduous,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  ExternalLink,
  Droplets,
  Utensils,
  Trophy,
  AlertCircle,
  Info,
  MessageSquare,
  ThumbsUp,
  Trash2
} from 'lucide-react';
import {
  getGroundById,
  getGroundReviewTags,
  submitGroundReview,
  deleteGroundReview,
  Ground,
  GroundReview,
  GroundReviewRatings,
  Pagination
} from '../services/api';

interface GroundProfileModalProps {
  groundId: string;
  onClose: () => void;
}

const RATING_CATEGORIES = [
  { key: 'pitch', label: 'Pitch Quality', description: 'Surface, bounce, consistency', weight: 'High', required: true },
  { key: 'outfield', label: 'Outfield', description: 'Grass coverage, evenness, speed', weight: 'High', required: true },
  { key: 'lighting', label: 'Lighting', description: 'Brightness, coverage for night play', weight: 'Medium', required: false, conditional: 'hasFloodlights' },
  { key: 'management', label: 'Ground Management', description: 'Staff, organization, professionalism', weight: 'Medium', required: true },
  { key: 'routeAccess', label: 'Route Access', description: 'Road quality, signage', weight: 'Low', required: true },
  { key: 'locationAccessibility', label: 'Location Accessibility', description: 'Ease of finding, landmarks', weight: 'Low', required: true },
  { key: 'nets', label: 'Practice Nets', description: 'Quality, availability', weight: 'Low', required: false, conditional: 'hasNets' },
  { key: 'parking', label: 'Parking', description: 'Space, security, proximity', weight: 'Low', required: true },
  { key: 'amenities', label: 'Amenities', description: 'Toilets, changing rooms, water', weight: 'Low', required: true }
];

const TAG_CATEGORIES = {
  pitch: ['hard_pitch', 'soft_pitch', 'bouncy', 'slow', 'good_for_pacers', 'good_for_spinners', 'unpredictable_bounce', 'true_bounce', 'cracked_pitch', 'well_maintained_pitch'],
  outfield: ['fast_outfield', 'slow_outfield', 'uneven_outfield', 'grassy', 'patchy'],
  lighting: ['excellent_lights', 'dim_lights', 'uneven_lighting', 'no_shadows'],
  general: ['professional', 'beginner_friendly', 'value_for_money', 'overpriced', 'good_for_practice', 'match_quality', 'family_friendly', 'weekend_crowded'],
  issues: ['drainage_issues', 'muddy_when_wet', 'dusty', 'mosquitoes', 'noisy_surroundings']
};

const GroundProfileModal: React.FC<GroundProfileModalProps> = ({ groundId, onClose }) => {
  const { user } = useAuth();
  const [ground, setGround] = useState<Ground | null>(null);
  const [reviews, setReviews] = useState<GroundReview[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewRatings, setReviewRatings] = useState<Partial<GroundReviewRatings>>({});
  const [reviewComment, setReviewComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitType, setVisitType] = useState<'match' | 'practice' | 'casual' | 'other'>('match');
  const [timeSlot, setTimeSlot] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');

  // View state
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const fetchGround = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getGroundById(groundId, { page, limit: 10 });
      setGround(result.data);
      setReviews(page === 1 ? result.reviews : [...reviews, ...result.reviews]);
      setPagination(result.pagination);
    } catch (err) {
      setError('Failed to load ground details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [groundId]);

  const fetchTags = useCallback(async () => {
    try {
      const result = await getGroundReviewTags();
      setAvailableTags(result.data);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  }, []);

  useEffect(() => {
    fetchGround();
    fetchTags();
  }, [fetchGround, fetchTags]);

  const handleSubmitReview = async () => {
    if (!ground) return;

    // Validate required ratings
    const requiredCategories = RATING_CATEGORIES.filter(c => c.required);
    const missingRatings = requiredCategories.filter(c => !reviewRatings[c.key as keyof GroundReviewRatings]);

    if (missingRatings.length > 0) {
      alert(`Please rate: ${missingRatings.map(c => c.label).join(', ')}`);
      return;
    }

    try {
      setSubmittingReview(true);
      await submitGroundReview(groundId, {
        ratings: reviewRatings as GroundReviewRatings,
        tags: selectedTags,
        comment: reviewComment,
        visitDate,
        visitType,
        timeSlot
      });

      // Reset form and refresh
      setShowReviewForm(false);
      setReviewRatings({});
      setReviewComment('');
      setSelectedTags([]);
      fetchGround();
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      await deleteGroundReview(groundId, reviewToDelete);
      setDeleteConfirmOpen(false);
      setReviewToDelete(null);
      fetchGround();
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const renderStars = (score: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${sizeClasses[size]} ${
              i < Math.floor(score)
                ? 'text-amber-400 fill-amber-400'
                : i < score
                  ? 'text-amber-400 fill-amber-400/50'
                  : 'text-slate-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingInput = (category: typeof RATING_CATEGORIES[0]) => {
    const rating = reviewRatings[category.key as keyof GroundReviewRatings] || 0;

    // Skip conditional categories if amenity not available
    if (category.conditional && ground) {
      if (category.conditional === 'hasFloodlights' && !ground.amenities.hasFloodlights) return null;
      if (category.conditional === 'hasNets' && !ground.amenities.hasNets) return null;
    }

    return (
      <div key={category.key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{category.label}</span>
            {category.required && <span className="text-xs text-rose-400">*</span>}
            {category.weight === 'High' && (
              <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">Important</span>
            )}
          </div>
          <span className="text-xs text-slate-400">{category.description}</span>
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setReviewRatings({ ...reviewRatings, [category.key]: value })}
              className={`p-1 rounded transition-colors ${
                rating >= value ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <Star className={`w-6 h-6 ${rating >= value ? 'fill-amber-400' : ''}`} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const getTrendInfo = () => {
    if (!ground?.trends.last30Days.count) return null;

    const recent = ground.trends.last30Days.avg;
    const older = ground.trends.last90Days.avg;
    const diff = recent - older;

    if (Math.abs(diff) < 0.2) {
      return { icon: <Minus className="w-4 h-4" />, text: 'Stable', color: 'text-slate-400' };
    } else if (diff > 0) {
      return { icon: <TrendingUp className="w-4 h-4" />, text: `+${diff.toFixed(1)} in 30d`, color: 'text-emerald-400' };
    } else {
      return { icon: <TrendingDown className="w-4 h-4" />, text: `${diff.toFixed(1)} in 30d`, color: 'text-rose-400' };
    }
  };

  const formatTagLabel = (tag: string) => {
    return tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading && !ground) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error || !ground) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <p className="text-white mb-4">{error || 'Ground not found'}</p>
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  const trend = getTrendInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 relative">
            {ground.photos.length > 0 ? (
              <img src={ground.photos[0]} alt={ground.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-20 h-20 text-emerald-500/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-slate-900/50 hover:bg-slate-900/70 backdrop-blur rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Ground Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{ground.name}</h2>
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4" />
                  <span>{ground.location.city}, {ground.location.state || 'India'}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Score */}
                {ground.reviewCount > 0 && (
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {renderStars(ground.overallScore, 'lg')}
                      <span className="text-2xl font-bold text-white">{ground.overallScore.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-slate-400">{ground.reviewCount} reviews</span>
                  </div>
                )}

                {/* Directions Button */}
                <a
                  href={ground.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${ground.location.coordinates.lat},${ground.location.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Directions
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'reviews'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Reviews ({ground.reviewCount})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <Users className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-white">{ground.reviewCount}</div>
                  <div className="text-xs text-slate-400">Total Reviews</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-white">{ground.verifiedReviewCount}</div>
                  <div className="text-xs text-slate-400">Verified</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-white">{ground.trends.last30Days.count}</div>
                  <div className="text-xs text-slate-400">Last 30 Days</div>
                </div>
                {trend && (
                  <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                    <div className={`w-6 h-6 mx-auto mb-2 ${trend.color}`}>{trend.icon}</div>
                    <div className={`text-lg font-semibold ${trend.color}`}>{trend.text}</div>
                    <div className="text-xs text-slate-400">Trend</div>
                  </div>
                )}
              </div>

              {/* Ratings Breakdown */}
              {ground.reviewCount > 0 && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Ratings Breakdown</h3>
                  <div className="space-y-3">
                    {RATING_CATEGORIES.map((category) => {
                      const rating = ground.aggregatedRatings[category.key as keyof typeof ground.aggregatedRatings];
                      if (!rating || rating.count === 0) return null;

                      return (
                        <div key={category.key} className="flex items-center gap-4">
                          <span className="w-32 text-sm text-slate-300">{category.label}</span>
                          <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                              style={{ width: `${(rating.avg / 5) * 100}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-sm font-medium text-white">{rating.avg.toFixed(1)}</span>
                          <span className="w-16 text-right text-xs text-slate-500">({rating.count})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Amenities */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'hasFloodlights', label: 'Floodlights', icon: Lightbulb },
                    { key: 'hasNets', label: 'Practice Nets', icon: TreeDeciduous },
                    { key: 'hasParking', label: 'Parking', icon: Car },
                    { key: 'hasPavilion', label: 'Pavilion', icon: Building2 },
                    { key: 'hasChangingRoom', label: 'Changing Room', icon: Users },
                    { key: 'hasToilets', label: 'Toilets', icon: Building2 },
                    { key: 'hasDrinkingWater', label: 'Drinking Water', icon: Droplets },
                    { key: 'hasScoreboard', label: 'Scoreboard', icon: Trophy }
                  ].map((amenity) => {
                    const available = ground.amenities[amenity.key as keyof typeof ground.amenities];
                    const Icon = amenity.icon;
                    return (
                      <div
                        key={amenity.key}
                        className={`flex items-center gap-2 p-3 rounded-lg ${
                          available ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/50 text-slate-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm">{amenity.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Popular Tags */}
              {ground.popularTags.length > 0 && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">What Players Say</h3>
                  <div className="flex flex-wrap gap-2">
                    {ground.popularTags.map((tag) => (
                      <span
                        key={tag.tag}
                        className="px-3 py-1.5 bg-slate-600 text-slate-200 rounded-full text-sm"
                      >
                        {formatTagLabel(tag.tag)} ({tag.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ground Details */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Ground Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Address:</span>
                    <p className="text-white">{ground.location.address}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Pitch Type:</span>
                    <p className="text-white capitalize">{ground.characteristics.pitchType}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Ground Size:</span>
                    <p className="text-white capitalize">{ground.characteristics.groundSize}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Boundary:</span>
                    <p className="text-white capitalize">{ground.characteristics.boundaryType}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add Review Button */}
              {!showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/50 rounded-lg text-emerald-400 font-medium transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Write a Review
                </button>
              )}

              {/* Review Form */}
              {showReviewForm && (
                <div className="bg-slate-700/50 rounded-lg p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Write Your Review</h3>
                    <button onClick={() => setShowReviewForm(false)} className="text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Visit Info */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Visit Date</label>
                      <input
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Visit Type</label>
                      <select
                        value={visitType}
                        onChange={(e) => setVisitType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="match">Match</option>
                        <option value="practice">Practice</option>
                        <option value="casual">Casual</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Time Slot</label>
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                        <option value="night">Night</option>
                      </select>
                    </div>
                  </div>

                  {/* Ratings */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide mb-3">Rate Your Experience</h4>
                    <div className="bg-slate-600/50 rounded-lg p-4">
                      {RATING_CATEGORIES.map(renderRatingInput)}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide mb-3">Quick Tags (Optional)</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.slice(0, 15).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            if (selectedTags.includes(tag)) {
                              setSelectedTags(selectedTags.filter(t => t !== tag));
                            } else if (selectedTags.length < 5) {
                              setSelectedTags([...selectedTags, tag]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                          }`}
                        >
                          {formatTagLabel(tag)}
                        </button>
                      ))}
                    </div>
                    {selectedTags.length >= 5 && (
                      <p className="text-xs text-amber-400 mt-2">Maximum 5 tags allowed</p>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Additional Comments (Optional)</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience at this ground..."
                      rows={3}
                      maxLength={1000}
                      className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                    <p className="text-xs text-slate-500 text-right">{reviewComment.length}/1000</p>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      disabled={submittingReview}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Review'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No reviews yet</h3>
                  <p className="text-slate-400">Be the first to review this ground!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review._id}
                      className="bg-slate-700/50 rounded-lg p-4"
                    >
                      {/* Review Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{review.reviewerName}</span>
                            {review.isVerified && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span>{new Date(review.visitDate).toLocaleDateString()}</span>
                            <span className="capitalize">{review.visitType}</span>
                            <span className="capitalize">{review.timeSlot}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {renderStars(
                            Object.values(review.ratings).filter((v): v is number => v !== null).reduce((a, b) => a + b, 0) /
                            Object.values(review.ratings).filter((v): v is number => v !== null).length,
                            'sm'
                          )}

                          {(review.reviewerId === user?._id || user?.role === 'admin') && (
                            <button
                              onClick={() => handleDeleteReview(review._id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete review"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      {review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {review.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-slate-600 text-slate-300 rounded text-xs"
                            >
                              {formatTagLabel(tag)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Comment */}
                      {review.comment && (
                        <p className="text-slate-300 text-sm">{review.comment}</p>
                      )}

                      {/* Expandable Ratings */}
                      <button
                        onClick={() => setExpandedReview(expandedReview === review._id ? null : review._id)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mt-3"
                      >
                        {expandedReview === review._id ? (
                          <>
                            <ChevronUp className="w-4 h-4" /> Hide details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" /> Show rating details
                          </>
                        )}
                      </button>

                      {expandedReview === review._id && (
                        <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                          {Object.entries(review.ratings).map(([key, value]) => {
                            if (value === null) return null;
                            const category = RATING_CATEGORIES.find(c => c.key === key);
                            return (
                              <div key={key} className="flex items-center justify-between bg-slate-600/50 px-2 py-1 rounded">
                                <span className="text-slate-400">{category?.label || key}</span>
                                <span className="text-white font-medium">{value}/5</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Load More */}
                  {pagination && pagination.hasMore && (
                    <button
                      onClick={() => fetchGround(pagination.current + 1)}
                      disabled={loading}
                      className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Load More Reviews'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteReview}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setReviewToDelete(null);
        }}
      />
    </div>
  );
};

export default GroundProfileModal;
