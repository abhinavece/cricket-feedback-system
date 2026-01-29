import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  MapPin,
  Star,
  Search,
  Plus,
  RefreshCw,
  Navigation,
  Lightbulb,
  Car,
  TreeDeciduous,
  Building2,
  Users,
  ChevronDown,
  Loader2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Check,
  ChevronRight
} from 'lucide-react';
import {
  getGrounds,
  getGroundCities,
  createGround,
  Ground,
  GroundCity,
  GroundAmenities,
  Pagination
} from '../../services/api';
import MobileGroundProfile from './MobileGroundProfile';

const MobileGroundsTab: React.FC = () => {
  const { user } = useAuth();
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [cities, setCities] = useState<GroundCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [showCityFilter, setShowCityFilter] = useState(false);

  // Views
  const [selectedGroundId, setSelectedGroundId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Ground Form
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
    } as GroundAmenities
  });
  const [addingGround, setAddingGround] = useState(false);

  const fetchGrounds = useCallback(async (page = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      }

      const result = await getGrounds({
        search: searchQuery,
        city: selectedCity,
        page,
        limit: 20,
        sortBy: 'overallScore'
      });

      if (page === 1) {
        setGrounds(result.data);
      } else {
        setGrounds(prev => [...prev, ...result.data]);
      }
      setPagination(result.pagination);
    } catch (err) {
      console.error('Error fetching grounds:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGrounds(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCity, fetchGrounds]);

  const handleRefresh = () => fetchGrounds(1, true);

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
        amenities: newGround.amenities
      });
      setShowAddForm(false);
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
        }
      });
      fetchGrounds();
      fetchCities();
    } catch (err) {
      console.error('Failed to add ground:', err);
    } finally {
      setAddingGround(false);
    }
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
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

  const getTrendIcon = (trends: Ground['trends']) => {
    if (!trends.last30Days.count) return null;

    const recent = trends.last30Days.avg;
    const older = trends.last90Days.avg;

    if (recent > older + 0.2) {
      return <TrendingUp className="w-3 h-3 text-emerald-400" />;
    } else if (recent < older - 0.2) {
      return <TrendingDown className="w-3 h-3 text-rose-400" />;
    }
    return null;
  };

  const renderAmenityIcons = (amenities: GroundAmenities) => {
    const icons = [];
    if (amenities.hasFloodlights) icons.push(<Lightbulb key="lights" className="w-3 h-3 text-amber-400" />);
    if (amenities.hasNets) icons.push(<TreeDeciduous key="nets" className="w-3 h-3 text-emerald-400" />);
    if (amenities.hasParking) icons.push(<Car key="parking" className="w-3 h-3 text-blue-400" />);
    return icons;
  };

  // Show ground profile if selected
  if (selectedGroundId) {
    return (
      <MobileGroundProfile
        groundId={selectedGroundId}
        onBack={() => setSelectedGroundId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-white">Cricket Grounds</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-slate-300 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search grounds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 -mb-1">
          <button
            onClick={() => setSelectedCity('')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !selectedCity ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            All
          </button>
          {cities.slice(0, 5).map((city) => (
            <button
              key={city.city}
              onClick={() => setSelectedCity(city.city)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCity === city.city ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {city.city} ({city.count})
            </button>
          ))}
          {cities.length > 5 && (
            <button
              onClick={() => setShowCityFilter(true)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300"
            >
              More...
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && grounds.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : grounds.length === 0 ? (
          <div className="text-center py-16 px-4">
            <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No grounds found</h3>
            <p className="text-slate-400 text-sm">
              {searchQuery || selectedCity
                ? 'Try adjusting your search'
                : 'Be the first to add a ground!'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Stats */}
            {pagination && (
              <p className="text-xs text-slate-400">{pagination.total} grounds found</p>
            )}

            {/* Ground Cards */}
            {grounds.map((ground) => (
              <div
                key={ground._id}
                onClick={() => setSelectedGroundId(ground._id)}
                className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden active:scale-[0.98] transition-transform"
              >
                {/* Image */}
                <div className="h-32 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 relative">
                  {ground.photos.length > 0 ? (
                    <img src={ground.photos[0]} alt={ground.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-10 h-10 text-emerald-500/30" />
                    </div>
                  )}

                  {/* Score Badge */}
                  {ground.reviewCount > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-slate-900/80 backdrop-blur rounded-lg">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium text-white">{ground.overallScore.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Verified Badge */}
                  {ground.verifiedReviewCount > 0 && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-emerald-500/90 backdrop-blur rounded text-xs text-white">
                      <CheckCircle2 className="w-3 h-3" />
                      {ground.verifiedReviewCount}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-white text-sm line-clamp-1">{ground.name}</h3>
                    {getTrendIcon(ground.trends)}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="line-clamp-1">{ground.location.city}</span>
                  </div>

                  {/* Amenities & Stats Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderAmenityIcons(ground.amenities)}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{ground.reviewCount} reviews</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More */}
            {pagination && pagination.hasMore && (
              <button
                onClick={() => fetchGrounds(pagination.current + 1)}
                disabled={loading}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* City Filter Modal */}
      {showCityFilter && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-2xl max-h-[70vh] overflow-hidden">
            <div className="sticky top-0 bg-slate-800 p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Select City</h3>
              <button onClick={() => setShowCityFilter(false)} className="p-2">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
              <button
                onClick={() => {
                  setSelectedCity('');
                  setShowCityFilter(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg ${
                  !selectedCity ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-white'
                }`}
              >
                All Cities
              </button>
              {cities.map((city) => (
                <button
                  key={city.city}
                  onClick={() => {
                    setSelectedCity(city.city);
                    setShowCityFilter(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between ${
                    selectedCity === city.city ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-white'
                  }`}
                >
                  <span>{city.city}</span>
                  <span className="text-xs text-slate-400">{city.count} grounds</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Ground Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-slate-800 w-full sm:max-w-lg sm:rounded-xl overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 bg-slate-800 p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Add Ground</h3>
                <button onClick={() => setShowAddForm(false)} className="p-2">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Form */}
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Ground Name *</label>
                  <input
                    type="text"
                    value={newGround.name}
                    onChange={(e) => setNewGround({ ...newGround, name: e.target.value })}
                    placeholder="e.g., Wankhede Stadium"
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">City *</label>
                    <input
                      type="text"
                      value={newGround.city}
                      onChange={(e) => setNewGround({ ...newGround, city: e.target.value })}
                      placeholder="Mumbai"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">State</label>
                    <input
                      type="text"
                      value={newGround.state}
                      onChange={(e) => setNewGround({ ...newGround, state: e.target.value })}
                      placeholder="Maharashtra"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Address *</label>
                  <input
                    type="text"
                    value={newGround.address}
                    onChange={(e) => setNewGround({ ...newGround, address: e.target.value })}
                    placeholder="Full address"
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={newGround.lat}
                      onChange={(e) => setNewGround({ ...newGround, lat: e.target.value })}
                      placeholder="18.9389"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={newGround.lng}
                      onChange={(e) => setNewGround({ ...newGround, lng: e.target.value })}
                      placeholder="72.8258"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Amenities</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(newGround.amenities).map(([key, value]) => (
                      <label
                        key={key}
                        className={`flex items-center gap-2 p-2 rounded-lg text-sm cursor-pointer ${
                          value ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-slate-700/50 border border-slate-600'
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
                        <span className="text-white text-xs">
                          {key.replace('has', '').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 bg-slate-700 text-white rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddGround}
                  disabled={addingGround || !newGround.name || !newGround.address || !newGround.city || !newGround.lat || !newGround.lng}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addingGround ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Ground'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileGroundsTab;
