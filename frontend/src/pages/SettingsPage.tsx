import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Save, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Mail,
  Shield,
  RefreshCw,
  LogOut,
  Edit3,
  X,
  Calendar
} from 'lucide-react';
import { getProfile, updateProfile, createProfile, ProfileData, ProfileCreateData, checkDeveloperAccess } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import DeveloperSettings from '../components/DeveloperSettings';
import DateOfBirthPicker from '../components/DateOfBirthPicker';
import DeploymentInfo from '../components/DeploymentInfo';

const BATTING_STYLES = [
  { value: '', label: 'Not specified' },
  { value: 'right-handed', label: 'Right Handed' },
  { value: 'left-handed', label: 'Left Handed' }
];

const BOWLING_STYLES = [
  { value: '', label: 'Not specified' },
  { value: 'right-arm-fast', label: 'Right Arm Fast' },
  { value: 'right-arm-medium', label: 'Right Arm Medium' },
  { value: 'right-arm-spin', label: 'Right Arm Spin' },
  { value: 'left-arm-fast', label: 'Left Arm Fast' },
  { value: 'left-arm-medium', label: 'Left Arm Medium' },
  { value: 'left-arm-spin', label: 'Left Arm Spin' },
  { value: 'none', label: 'Non-bowler' }
];

const PLAYER_ROLES = [
  { value: 'player', label: 'Player' },
  { value: 'batsman', label: 'Batsman' },
  { value: 'bowler', label: 'Bowler' },
  { value: 'all-rounder', label: 'All-rounder' },
  { value: 'wicket-keeper', label: 'Wicket Keeper' }
];

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasDeveloperAccess, setHasDeveloperAccess] = useState(false);
  const [isMasterDeveloper, setIsMasterDeveloper] = useState(false);
    
  const [formData, setFormData] = useState<ProfileCreateData>({
    name: '',
    phone: '',
    dateOfBirth: '',
    playerRole: 'player',
    team: 'Mavericks XI',
    cricHeroesId: '',
    about: '',
    battingStyle: '',
    bowlingStyle: ''
  });

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getProfile();
      setProfile(response.data);
      if (response.data.player) {
        setFormData({
          name: response.data.player.name || '',
          phone: response.data.player.phone || '',
          dateOfBirth: response.data.player.dateOfBirth || '',
          playerRole: response.data.player.role || 'player',
          team: response.data.player.team || 'Mavericks XI',
          cricHeroesId: response.data.player.cricHeroesId || '',
          about: response.data.player.about || '',
          battingStyle: response.data.player.battingStyle || '',
          bowlingStyle: response.data.player.bowlingStyle || ''
        });
      } else {
        setFormData(prev => ({
          ...prev,
          name: response.data.user.name || '',
          dateOfBirth: ''
        }));
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      if (err.response?.status === 404) {
        setProfile(null);
      } else {
        setError('Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // Check developer access
    checkDeveloperAccess()
      .then(response => {
        setHasDeveloperAccess(response.hasDeveloperAccess);
        setIsMasterDeveloper(response.isMasterDeveloper);
      })
      .catch(() => {
        setHasDeveloperAccess(false);
        setIsMasterDeveloper(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 12);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneDisplay(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.phone || formData.phone.length < 10) {
      setError('Valid phone number is required');
      return;
    }
    if (!formData.dateOfBirth?.trim()) {
      setError('Date of birth is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const submitData: ProfileCreateData = {
        ...formData,
        battingStyle: formData.battingStyle || undefined,
        bowlingStyle: formData.bowlingStyle || undefined,
        cricHeroesId: formData.cricHeroesId || undefined,
        about: formData.about || undefined
      };

      let response;
      if (isCreating) {
        response = await createProfile(submitData);
        setIsCreating(false);
      } else {
        response = await updateProfile(submitData);
      }
      
      setProfile(response.data);
      setSuccess(isCreating ? 'Profile created successfully' : 'Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  
  const handleCancel = () => {
    if (profile?.player) {
      setFormData({
        name: profile.player.name || '',
        phone: profile.player.phone || '',
        dateOfBirth: profile.player.dateOfBirth || '',
        playerRole: profile.player.role || 'player',
        team: profile.player.team || 'Mavericks XI',
        cricHeroesId: profile.player.cricHeroesId || '',
        about: profile.player.about || '',
        battingStyle: profile.player.battingStyle || '',
        bowlingStyle: profile.player.bowlingStyle || ''
      });
    }
    setIsEditing(false);
    setIsCreating(false);
    setError(null);
  };

  const startCreateProfile = () => {
    setFormData({
      name: profile?.user?.name || user?.name || '',
      phone: '',
      dateOfBirth: '',
      playerRole: 'player',
      team: 'Mavericks XI',
      cricHeroesId: '',
      about: '',
      battingStyle: '',
      bowlingStyle: ''
    });
    setIsCreating(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const hasProfile = profile?.user?.profileComplete && profile?.player;
  const showForm = isEditing || isCreating;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
          <p className="text-slate-400 text-sm">Manage your account and player profile</p>
        </div>
        <button
          onClick={fetchProfile}
          className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-emerald-400">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Card */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Account</h2>
            <div className="flex flex-col items-center text-center mb-4">
              {profile?.user?.avatar ? (
                <img 
                  src={profile.user.avatar} 
                  alt={profile.user.name} 
                  className="w-20 h-20 rounded-full border-2 border-emerald-500/30 mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30 mb-3">
                  <User className="w-10 h-10 text-emerald-400" />
                </div>
              )}
              <p className="font-semibold text-white text-lg">{profile?.user?.name}</p>
              <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{profile?.user?.email}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/30 rounded-lg mb-6">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-300">Role:</span>
              <span className="text-sm font-medium text-emerald-400 capitalize">{profile?.user?.role}</span>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 font-medium rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Player Profile Card */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Player Profile</h2>
              {hasProfile && !showForm && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>

            {showForm ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      WhatsApp Number <span className="text-red-400">*</span>
                      {isEditing && <span className="text-slate-500 text-xs ml-2">(cannot be changed)</span>}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400">+91</span>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone?.replace(/^91/, '') || ''}
                        onChange={handlePhoneChange}
                        placeholder="9876543210"
                        maxLength={10}
                        disabled={isEditing}
                        className={`w-full pl-20 pr-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="md:col-span-2">
                  <DateOfBirthPicker
                    value={formData.dateOfBirth}
                    onChange={(date) => setFormData(prev => ({ ...prev, dateOfBirth: date }))}
                    label="Date of Birth"
                    required={true}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Playing Role</label>
                    <div className="relative">
                      <select
                        name="playerRole"
                        value={formData.playerRole}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                      >
                        {PLAYER_ROLES.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Batting */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Batting Style</label>
                    <div className="relative">
                      <select
                        name="battingStyle"
                        value={formData.battingStyle}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                      >
                        {BATTING_STYLES.map(style => (
                          <option key={style.value} value={style.value}>{style.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Bowling */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Bowling Style</label>
                    <div className="relative">
                      <select
                        name="bowlingStyle"
                        value={formData.bowlingStyle}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                      >
                        {BOWLING_STYLES.map(style => (
                          <option key={style.value} value={style.value}>{style.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* CricHeroes ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    CricHeroes ID <span className="text-slate-500 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="cricHeroesId"
                    value={formData.cricHeroesId}
                    onChange={handleChange}
                    placeholder="Your CricHeroes username"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* About */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    About <span className="text-slate-500 text-xs">(optional)</span>
                  </label>
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1 text-right">{formData.about?.length || 0}/500</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 bg-slate-700/50 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isCreating ? 'Create Profile' : 'Save Changes'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : hasProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <User className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Name</p>
                      <p className="text-white">{profile?.player?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <Phone className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">WhatsApp</p>
                      <p className="text-white">+{profile?.player?.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-700/30 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Playing Role</p>
                    <p className="text-emerald-400 font-medium capitalize">{profile?.player?.role || 'Not specified'}</p>
                  </div>
                  <div className="p-3 bg-slate-700/30 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Batting Style</p>
                    <p className="text-sky-400">
                      {profile?.player?.battingStyle 
                        ? BATTING_STYLES.find(s => s.value === profile.player?.battingStyle)?.label 
                        : 'Not specified'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-700/30 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Bowling Style</p>
                    <p className="text-purple-400">
                      {profile?.player?.bowlingStyle 
                        ? BOWLING_STYLES.find(s => s.value === profile.player?.bowlingStyle)?.label 
                        : 'Not specified'}
                    </p>
                  </div>
                </div>

                {profile?.player?.cricHeroesId && (
                  <div className="p-3 bg-slate-700/30 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">CricHeroes ID</p>
                    <p className="text-white">{profile.player.cricHeroesId}</p>
                  </div>
                )}

                {profile?.player?.about && (
                  <div className="p-3 bg-slate-700/30 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">About</p>
                    <p className="text-slate-300">{profile.player.about}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-slate-700/30 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Player Profile</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                  Create your player profile to be added to the team's player list and receive match updates via WhatsApp.
                </p>
                <button
                  onClick={startCreateProfile}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
                >
                  Create Player Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Developer Tools - Visible to all admins, but only master can edit */}
      {(user?.role === 'admin') && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Developer Tools</h2>
          <DeveloperSettings isMasterDeveloper={isMasterDeveloper} />
        </div>
      )}

      {/* Deployment Info - Always visible at the bottom */}
      <div className="mt-8">
        <DeploymentInfo />
      </div>
    </div>
  );
};

export default SettingsPage;
