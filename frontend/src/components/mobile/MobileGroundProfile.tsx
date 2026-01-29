import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from '../ConfirmDialog';
import {
  ArrowLeft,
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
  Droplets,
  Trophy,
  MessageSquare,
  Trash2,
  X,
  Check,
  RefreshCw
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
} from '../../services/api';

interface MobileGroundProfileProps {
  groundId: string;
  onBack: () => void;
}

const RATING_CATEGORIES = [
  { key: 'pitch', label: 'Pitch', required: true, weight: 'High' },
  { key: 'outfield', label: 'Outfield', required: true, weight: 'High' },
  { key: 'lighting', label: 'Lighting', required: false, conditional: 'hasFloodlights' },
  { key: 'management', label: 'Management', required: true },
  { key: 'routeAccess', label: 'Route Access', required: true },
  { key: 'locationAccessibility', label: 'Accessibility', required: true },
  { key: 'nets', label: 'Nets', required: false, conditional: 'hasNets' },
  { key: 'parking', label: 'Parking', required: true },
  { key: 'amenities', label: 'Amenities', required: true }
];

const MobileGroundProfile: React.FC<MobileGroundProfileProps> = ({ groundId, onBack }) => {
  const { user } = useAuth();
  const [ground, setGround] = useState<Ground | null>(null);
  const [reviews, setReviews] = useState<GroundReview[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // View state
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewRatings, setReviewRatings] = useState<Partial<GroundReviewRatings>>({});
  const [reviewComment, setReviewComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitType, setVisitType] = useState<'match' | 'practice' | 'casual' | 'other'>('match');
  const [timeSlot, setTimeSlot] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');

  const fetchGround = useCallback(async (page = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      }

      const result = await getGroundById(groundId, { page, limit: 10 });
      setGround(result.data);
      setReviews(page === 1 ? result.reviews : [...reviews, ...result.reviews]);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Error fetching ground:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const handleRefresh = () => fetchGround(1, true);

  const handleSubmitReview = async () => {
    if (!ground) return;

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

      setShowReviewForm(false);
      setReviewRatings({});
      setReviewComment('');
      setSelectedTags([]);
      fetchGround();
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review');
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

  const renderStars = (score: number, interactive = false, category?: string) => {
    const currentRating = category ? (reviewRatings[category as keyof GroundReviewRatings] || 0) : score;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={interactive && category ? () => setReviewRatings({ ...reviewRatings, [category]: value }) : undefined}
            disabled={!interactive}
            className={`${interactive ? 'p-1' : ''}`}
          >
            <Star
              className={`${interactive ? 'w-6 h-6' : 'w-4 h-4'} ${
                value <= currentRating
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-600'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getTrendInfo = () => {
    if (!ground?.trends.last30Days.count) return null;

    const recent = ground.trends.last30Days.avg;
    const older = ground.trends.last90Days.avg;
    const diff = recent - older;

    if (Math.abs(diff) < 0.2) {
      return { icon: <Minus className="w-4 h-4" />, color: 'text-slate-400' };
    } else if (diff > 0) {
      return { icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-400' };
    } else {
      return { icon: <TrendingDown className="w-4 h-4" />, color: 'text-rose-400' };
    }
  };

  const formatTagLabel = (tag: string) => {
    return tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading && !ground) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!ground) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-rose-400 mb-4">Ground not found</p>
        <button onClick={onBack} className="text-emerald-400">Go back</button>
      </div>
    );
  }

  const trend = getTrendInfo();

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header Image */}
      <div className="relative h-48 flex-shrink-0">
        {ground.photos.length > 0 ? (
          <img src={ground.photos[0]} alt={ground.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600/30 to-teal-600/30 flex items-center justify-center">
            <MapPin className="w-16 h-16 text-emerald-500/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-slate-900/50 backdrop-blur rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="absolute top-4 right-4 p-2 bg-slate-900/50 backdrop-blur rounded-full"
        >
          <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Ground Info */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-xl font-bold text-white mb-1">{ground.name}</h1>
              <div className="flex items-center gap-1 text-sm text-slate-300">
                <MapPin className="w-4 h-4" />
                {ground.location.city}
              </div>
            </div>

            {ground.reviewCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 backdrop-blur rounded-lg">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-bold text-white">{ground.overallScore.toFixed(1)}</span>
                {trend && <span className={trend.color}>{trend.icon}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Directions Button */}
      <div className="px-4 py-3 border-b border-white/10">
        <a
          href={ground.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${ground.location.coordinates.lat},${ground.location.coordinates.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
        >
          <Navigation className="w-5 h-5" />
          Get Directions
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'info'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400'
          }`}
        >
          Info
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'reviews'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400'
          }`}
        >
          Reviews ({ground.reviewCount})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' ? (
          <div className="p-4 space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <Users className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <div className="text-lg font-semibold text-white">{ground.reviewCount}</div>
                <div className="text-xs text-slate-400">Reviews</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <div className="text-lg font-semibold text-white">{ground.verifiedReviewCount}</div>
                <div className="text-xs text-slate-400">Verified</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <div className="text-lg font-semibold text-white">{ground.trends.last30Days.count}</div>
                <div className="text-xs text-slate-400">30 Days</div>
              </div>
            </div>

            {/* Ratings */}
            {ground.reviewCount > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Ratings</h3>
                <div className="space-y-2">
                  {RATING_CATEGORIES.map((category) => {
                    const rating = ground.aggregatedRatings[category.key as keyof typeof ground.aggregatedRatings];
                    if (!rating || rating.count === 0) return null;

                    return (
                      <div key={category.key} className="flex items-center gap-3">
                        <span className="w-24 text-xs text-slate-400">{category.label}</span>
                        <div className="flex-1 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${(rating.avg / 5) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-medium text-white">{rating.avg.toFixed(1)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Amenities */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">Amenities</h3>
              <div className="grid grid-cols-2 gap-2">
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
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                        available ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {amenity.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            {ground.popularTags.length > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">What Players Say</h3>
                <div className="flex flex-wrap gap-2">
                  {ground.popularTags.map((tag) => (
                    <span
                      key={tag.tag}
                      className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs"
                    >
                      {formatTagLabel(tag.tag)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Address</span>
                  <span className="text-white text-right max-w-[60%]">{ground.location.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pitch Type</span>
                  <span className="text-white capitalize">{ground.characteristics.pitchType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ground Size</span>
                  <span className="text-white capitalize">{ground.characteristics.groundSize}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Add Review Button */}
            {!showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 font-medium"
              >
                <Plus className="w-5 h-5" />
                Write a Review
              </button>
            )}

            {/* Review Form */}
            {showReviewForm && (
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Your Review</h3>
                  <button onClick={() => setShowReviewForm(false)}>
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Visit Info */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Type</label>
                    <select
                      value={visitType}
                      onChange={(e) => setVisitType(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs focus:outline-none"
                    >
                      <option value="match">Match</option>
                      <option value="practice">Practice</option>
                      <option value="casual">Casual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Time</label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs focus:outline-none"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="night">Night</option>
                    </select>
                  </div>
                </div>

                {/* Ratings */}
                <div className="space-y-3">
                  {RATING_CATEGORIES.map((category) => {
                    if (category.conditional && ground) {
                      if (category.conditional === 'hasFloodlights' && !ground.amenities.hasFloodlights) return null;
                      if (category.conditional === 'hasNets' && !ground.amenities.hasNets) return null;
                    }

                    return (
                      <div key={category.key} className="flex items-center justify-between">
                        <span className="text-sm text-white">
                          {category.label}
                          {category.required && <span className="text-rose-400 ml-1">*</span>}
                        </span>
                        {renderStars(0, true, category.key)}
                      </div>
                    );
                  })}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Quick Tags</label>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.slice(0, 10).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (selectedTags.includes(tag)) {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          } else if (selectedTags.length < 5) {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        className={`px-2 py-1 rounded text-xs ${
                          selectedTags.includes(tag)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-600 text-slate-300'
                        }`}
                      >
                        {formatTagLabel(tag)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Additional comments..."
                    rows={2}
                    maxLength={500}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="w-full py-2.5 bg-emerald-500 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-slate-800/50 rounded-lg p-3">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-sm">{review.reviewerName}</span>
                          {review.isVerified && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                              <CheckCircle2 className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {new Date(review.visitDate).toLocaleDateString()} • {review.visitType}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderStars(
                          Object.values(review.ratings).filter((v): v is number => v !== null).reduce((a, b) => a + b, 0) /
                          Object.values(review.ratings).filter((v): v is number => v !== null).length
                        )}
                        {(review.reviewerId === user?._id || user?.role === 'admin') && (
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="p-1 text-slate-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {review.tags.map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-slate-600 text-slate-300 rounded text-xs">
                            {formatTagLabel(tag)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Comment */}
                    {review.comment && (
                      <p className="text-slate-300 text-sm">{review.comment}</p>
                    )}

                    {/* Expand Details */}
                    <button
                      onClick={() => setExpandedReview(expandedReview === review._id ? null : review._id)}
                      className="flex items-center gap-1 text-xs text-slate-400 mt-2"
                    >
                      {expandedReview === review._id ? (
                        <><ChevronUp className="w-3 h-3" /> Hide</>
                      ) : (
                        <><ChevronDown className="w-3 h-3" /> Details</>
                      )}
                    </button>

                    {expandedReview === review._id && (
                      <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-1">
                        {Object.entries(review.ratings).map(([key, value]) => {
                          if (value === null) return null;
                          const category = RATING_CATEGORIES.find(c => c.key === key);
                          return (
                            <div key={key} className="flex items-center justify-between bg-slate-700/50 px-2 py-1 rounded text-xs">
                              <span className="text-slate-400">{category?.label || key}</span>
                              <span className="text-white">{value}/5</span>
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
                    className="w-full py-2.5 bg-slate-700 text-white text-sm rounded-lg"
                  >
                    Load More
                  </button>
                )}
              </div>
            )}
          </div>
        )}
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

export default MobileGroundProfile;
