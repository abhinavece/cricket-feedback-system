import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  MapPin,
  Star,
  Search,
  Plus,
  Filter,
  ChevronRight,
  RefreshCw,
  Users,
  Lightbulb,
  Car,
  TreeDeciduous,
  Award,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Navigation,
  X,
  Check,
  ChevronDown,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Building2
} from 'lucide-react';
import {
  getGrounds,
  getGroundCities,
  createGround,
  Ground,
  GroundCity,
  GroundLocation,
  GroundAmenities,
  Pagination
} from '../services/api';
import GroundProfileModal from './GroundProfileModal';

interface GroundsTabProps {
  onOpenGround?: (groundId: string) => void;
}

const GroundsTab: React.FC<GroundsTabProps> = ({ onOpenGround }) => {
  const { user, isAdmin } = useAuth();
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [cities, setCities] = useState<GroundCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroundId, setSelectedGroundId] = useState<string | null>(null);

  // Add Ground Form State
  const [newGround, setNewGround] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    lat: '',
    lng: '',
    amenities: {
      hasFloodlights: false,
      hasNets: false,
      hasParking: false,
      hasChangingRoom: false,
      hasToilets: false,
      hasDrinkingWater: false,
      hasScoreboard: false,
      hasPavilion: false
    } as GroundAmenities,
    pitchType: 'unknown' as const,
    groundSize: 'medium' as const,
    boundaryType: 'unknown' as const
  });
  const [addingGround, setAddingGround] = useState(false);

  const fetchGrounds = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getGrounds({
        search: searchQuery,
        city: selectedCity,
        page,
        limit: 20,
        sortBy: 'overallScore'
      });
      setGrounds(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError('Failed to fetch grounds');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCity]);

  const fetchCities = useCallback(async () => {
    try {
      const result = await getGroundCities();
      setCities(result.data);
    } catch (err) {
      console.error('Failed to fetch cities:', err);
    }
  }, []);

  useEffect(() => {
    fetchGrounds();
    fetchCities();
  }, [fetchGrounds, fetchCities]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGrounds();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCity, fetchGrounds]);

  const handleAddGround = async () => {
    if (!newGround.name || !newGround.address || !newGround.city || !newGround.lat || !newGround.lng) {
      return;
    }

    try {
      setAddingGround(true);
      await createGround({
        name: newGround.name,
        location: {
          address: newGround.address,
          city: newGround.city,
          state: newGround.state || undefined,
          coordinates: {
            lat: parseFloat(newGround.lat),
            lng: parseFloat(newGround.lng)
          }
        },
        amenities: newGround.amenities,
        characteristics: {
          pitchType: newGround.pitchType,
          groundSize: newGround.groundSize,
          boundaryType: newGround.boundaryType
        }
      });
      setShowAddModal(false);
      setNewGround({
        name: '',
        address: '',
        city: '',
        state: '',
        lat: '',
        lng: '',
        amenities: {
          hasFloodlights: false,
          hasNets: false,
          hasParking: false,
          hasChangingRoom: false,
          hasToilets: false,
          hasDrinkingWater: false,
          hasScoreboard: false,
          hasPavilion: false
        },
        pitchType: 'unknown',
        groundSize: 'medium',
        boundaryType: 'unknown'
      });
      fetchGrounds();
      fetchCities();
    } catch (err) {
      console.error('Failed to add ground:', err);
    } finally {
      setAddingGround(false);
    }
  };

  const handleOpenGround = (groundId: string) => {
    if (onOpenGround) {
      onOpenGround(groundId);
    } else {
      setSelectedGroundId(groundId);
    }
  };

  const renderStars = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score - fullStars >= 0.5;

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < fullStars
                ? 'text-amber-400 fill-amber-400'
                : i === fullStars && hasHalfStar
                  ? 'text-amber-400 fill-amber-400/50'
                  : 'text-slate-600'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-white">{score.toFixed(1)}</span>
      </div>
    );
  };

  const getTrendIcon = (trends: Ground['trends']) => {
    if (!trends.last30Days.count) return null;

    const recent = trends.last30Days.avg;
    const older = trends.last90Days.avg;

    if (recent > older + 0.2) {
      return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    } else if (recent < older - 0.2) {
      return <TrendingDown className="w-4 h-4 text-rose-400" />;
    }
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const renderAmenityIcons = (amenities: GroundAmenities) => {
    const icons = [];
    if (amenities.hasFloodlights) icons.push(<Lightbulb key="lights" className="w-4 h-4 text-amber-400" />);
    if (amenities.hasNets) icons.push(<TreeDeciduous key="nets" className="w-4 h-4 text-emerald-400" />);
    if (amenities.hasParking) icons.push(<Car key="parking" className="w-4 h-4 text-blue-400" />);
    if (amenities.hasPavilion) icons.push(<Building2 key="pavilion" className="w-4 h-4 text-purple-400" />);
    return icons;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Cricket Grounds</h2>
          <p className="text-slate-400 text-sm mt-1">
            Discover and review cricket grounds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchGrounds()}
            className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isAdmin() && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-medium transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Ground
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search grounds by name, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* City Filter */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city.city} value={city.city}>
                  {city.city} ({city.count})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {pagination && (
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span>Found {pagination.total} grounds</span>
          {selectedCity && (
            <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
              <MapPin className="w-3 h-3" />
              {selectedCity}
              <button onClick={() => setSelectedCity('')} className="ml-1 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Grounds Grid */}
      {loading && grounds.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-rose-400">{error}</p>
          <button onClick={() => fetchGrounds()} className="mt-4 text-emerald-400 hover:text-emerald-300">
            Try again
          </button>
        </div>
      ) : grounds.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl">
          <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No grounds found</h3>
          <p className="text-slate-400 mb-6">
            {searchQuery || selectedCity
              ? 'Try adjusting your search or filters'
              : 'Be the first to add a cricket ground!'}
          </p>
          {isAdmin() && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
            >
              <Plus className="w-5 h-5" />
              Add Ground
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grounds.map((ground) => (
            <div
              key={ground._id}
              onClick={() => handleOpenGround(ground._id)}
              className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all cursor-pointer group"
            >
              {/* Ground Image Placeholder */}
              <div className="h-40 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 relative">
                {ground.photos.length > 0 ? (
                  <img
                    src={ground.photos[0]}
                    alt={ground.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-emerald-500/30" />
                  </div>
                )}

                {/* Score Badge */}
                {ground.reviewCount > 0 && (
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-slate-900/80 backdrop-blur rounded-lg">
                    {renderStars(ground.overallScore)}
                  </div>
                )}

                {/* Verified Badge */}
                {ground.verifiedReviewCount > 0 && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-emerald-500/90 backdrop-blur rounded text-xs text-white font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    {ground.verifiedReviewCount} verified
                  </div>
                )}
              </div>

              {/* Ground Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {ground.name}
                  </h3>
                  {getTrendIcon(ground.trends)}
                </div>

                <div className="flex items-center gap-1 text-sm text-slate-400 mb-3">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="line-clamp-1">{ground.location.city}</span>
                </div>

                {/* Amenities */}
                <div className="flex items-center gap-3 mb-3">
                  {renderAmenityIcons(ground.amenities)}
                  {renderAmenityIcons(ground.amenities).length === 0 && (
                    <span className="text-xs text-slate-500">No amenities listed</span>
                  )}
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>{ground.reviewCount} reviews</span>
                  </div>

                  <a
                    href={ground.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${ground.location.coordinates.lat},${ground.location.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    <Navigation className="w-4 h-4" />
                    Directions
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {pagination && pagination.hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => fetchGrounds(pagination.current + 1)}
            disabled={loading}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Add Ground Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Add New Ground</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">Basic Information</h4>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Ground Name *</label>
                  <input
                    type="text"
                    value={newGround.name}
                    onChange={(e) => setNewGround({ ...newGround, name: e.target.value })}
                    placeholder="e.g., Wankhede Stadium"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">City *</label>
                    <input
                      type="text"
                      value={newGround.city}
                      onChange={(e) => setNewGround({ ...newGround, city: e.target.value })}
                      placeholder="e.g., Mumbai"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">State</label>
                    <input
                      type="text"
                      value={newGround.state}
                      onChange={(e) => setNewGround({ ...newGround, state: e.target.value })}
                      placeholder="e.g., Maharashtra"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Full Address *</label>
                  <input
                    type="text"
                    value={newGround.address}
                    onChange={(e) => setNewGround({ ...newGround, address: e.target.value })}
                    placeholder="e.g., D Road, Churchgate, Mumbai"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={newGround.lat}
                      onChange={(e) => setNewGround({ ...newGround, lat: e.target.value })}
                      placeholder="e.g., 18.9389"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={newGround.lng}
                      onChange={(e) => setNewGround({ ...newGround, lng: e.target.value })}
                      placeholder="e.g., 72.8258"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Tip: Get coordinates from Google Maps by right-clicking on the location
                </p>
              </div>

              {/* Amenities */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">Amenities</h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(newGround.amenities).map(([key, value]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        value ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-slate-700/50 border border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNewGround({
                          ...newGround,
                          amenities: { ...newGround.amenities, [key]: e.target.checked }
                        })}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        value ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'
                      }`}>
                        {value && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-white">
                        {key.replace('has', '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Characteristics */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">Ground Characteristics</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Pitch Type</label>
                    <select
                      value={newGround.pitchType}
                      onChange={(e) => setNewGround({ ...newGround, pitchType: e.target.value as any })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="unknown">Unknown</option>
                      <option value="turf">Turf</option>
                      <option value="matting">Matting</option>
                      <option value="cement">Cement</option>
                      <option value="astroturf">Astroturf</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Ground Size</label>
                    <select
                      value={newGround.groundSize}
                      onChange={(e) => setNewGround({ ...newGround, groundSize: e.target.value as any })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="unknown">Unknown</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Boundary Type</label>
                    <select
                      value={newGround.boundaryType}
                      onChange={(e) => setNewGround({ ...newGround, boundaryType: e.target.value as any })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="unknown">Unknown</option>
                      <option value="rope">Rope</option>
                      <option value="fence">Fence</option>
                      <option value="natural">Natural</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-800 border-t border-white/10 p-4 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGround}
                disabled={addingGround || !newGround.name || !newGround.address || !newGround.city || !newGround.lat || !newGround.lng}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingGround ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Ground
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ground Profile Modal */}
      {selectedGroundId && (
        <GroundProfileModal
          groundId={selectedGroundId}
          onClose={() => setSelectedGroundId(null)}
        />
      )}
    </div>
  );
};

export default GroundsTab;
