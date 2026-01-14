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
  Edit3
} from 'lucide-react';
import { getProfile, updateProfile, ProfileData, ProfileCreateData } from '../../services/api';

interface MobileSettingsTabProps {
  onLogout: () => void;
}

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

const MobileSettingsTab: React.FC<MobileSettingsTabProps> = ({ onLogout }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<ProfileCreateData>>({
    name: '',
    phone: '',
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
          playerRole: response.data.player.role || 'player',
          team: response.data.player.team || 'Mavericks XI',
          cricHeroesId: response.data.player.cricHeroesId || '',
          about: response.data.player.about || '',
          battingStyle: response.data.player.battingStyle || '',
          bowlingStyle: response.data.player.bowlingStyle || ''
        });
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
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

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const submitData: Partial<ProfileCreateData> = {
        ...formData,
        battingStyle: formData.battingStyle || undefined,
        bowlingStyle: formData.bowlingStyle || undefined,
        cricHeroesId: formData.cricHeroesId || undefined,
        about: formData.about || undefined
      };

      const response = await updateProfile(submitData);
      setProfile(response.data);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile?.player) {
      setFormData({
        name: profile.player.name || '',
        phone: profile.player.phone || '',
        playerRole: profile.player.role || 'player',
        team: profile.player.team || 'Mavericks XI',
        cricHeroesId: profile.player.cricHeroesId || '',
        about: profile.player.about || '',
        battingStyle: profile.player.battingStyle || '',
        bowlingStyle: profile.player.bowlingStyle || ''
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  const hasProfile = profile?.user?.profileComplete && profile?.player;

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <button
          onClick={fetchProfile}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Account Info Card */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4 mb-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Account</h2>
        <div className="flex items-center gap-3 mb-3">
          {profile?.user?.avatar ? (
            <img 
              src={profile.user.avatar} 
              alt={profile.user.name} 
              className="w-12 h-12 rounded-full border-2 border-emerald-500/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
              <User className="w-6 h-6 text-emerald-400" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-medium text-white">{profile?.user?.name}</p>
            <div className="flex items-center gap-1 text-sm text-slate-400">
              <Mail className="w-3.5 h-3.5" />
              <span>{profile?.user?.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/30 rounded-lg">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-slate-300">Role:</span>
          <span className="text-sm font-medium text-emerald-400 capitalize">{profile?.user?.role}</span>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      {/* Player Profile Card */}
      {hasProfile && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Player Profile</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">WhatsApp Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 text-sm">+91</span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone?.replace(/^91/, '') || ''}
                    onChange={handlePhoneChange}
                    maxLength={10}
                    className="w-full pl-20 pr-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Playing Role</label>
                <div className="relative">
                  <select
                    name="playerRole"
                    value={formData.playerRole}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                  >
                    {PLAYER_ROLES.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Batting & Bowling */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Batting</label>
                  <div className="relative">
                    <select
                      name="battingStyle"
                      value={formData.battingStyle}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white text-sm appearance-none focus:outline-none focus:border-emerald-500/50"
                    >
                      {BATTING_STYLES.map(style => (
                        <option key={style.value} value={style.value}>{style.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Bowling</label>
                  <div className="relative">
                    <select
                      name="bowlingStyle"
                      value={formData.bowlingStyle}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white text-sm appearance-none focus:outline-none focus:border-emerald-500/50"
                    >
                      {BOWLING_STYLES.map(style => (
                        <option key={style.value} value={style.value}>{style.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* CricHeroes ID */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">CricHeroes ID</label>
                <input
                  type="text"
                  name="cricHeroesId"
                  value={formData.cricHeroesId}
                  onChange={handleChange}
                  placeholder="Your CricHeroes username"
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* About */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">About</label>
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
                <p className="text-xs text-slate-500 mt-1 text-right">{formData.about?.length || 0}/500</p>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2.5 bg-slate-700/50 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-slate-300">{profile?.player?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500" />
                <span className="text-slate-300">+{profile?.player?.phone}</span>
              </div>
              {profile?.player?.role && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">Role:</span>
                  <span className="text-sm text-emerald-400 capitalize">{profile.player.role}</span>
                </div>
              )}
              {(profile?.player?.battingStyle || profile?.player?.bowlingStyle) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile?.player?.battingStyle && (
                    <span className="px-2 py-1 text-xs bg-sky-500/10 text-sky-400 rounded-lg">
                      {BATTING_STYLES.find(s => s.value === profile.player?.battingStyle)?.label}
                    </span>
                  )}
                  {profile?.player?.bowlingStyle && profile.player.bowlingStyle !== 'none' && (
                    <span className="px-2 py-1 text-xs bg-purple-500/10 text-purple-400 rounded-lg">
                      {BOWLING_STYLES.find(s => s.value === profile.player?.bowlingStyle)?.label}
                    </span>
                  )}
                </div>
              )}
              {profile?.player?.cricHeroesId && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">CricHeroes:</span>
                  <span className="text-sm text-slate-300">{profile.player.cricHeroesId}</span>
                </div>
              )}
              {profile?.player?.about && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-sm text-slate-400">{profile.player.about}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!hasProfile && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4 mb-4">
          <div className="text-center py-4">
            <User className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-3">No player profile linked yet</p>
            <p className="text-xs text-slate-500">Contact admin to link your player profile</p>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 font-medium rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  );
};

export default MobileSettingsTab;
