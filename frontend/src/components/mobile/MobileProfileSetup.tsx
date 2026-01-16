import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Save, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Trophy,
  Info,
  Calendar
} from 'lucide-react';
import { createProfile, ProfileCreateData } from '../../services/api';
import DateOfBirthPicker from '../DateOfBirthPicker';

interface MobileProfileSetupProps {
  userName?: string;
  userEmail?: string;
  onProfileCreated: () => void;
}

const BATTING_STYLES = [
  { value: '', label: 'Select batting style' },
  { value: 'right-handed', label: 'Right Handed' },
  { value: 'left-handed', label: 'Left Handed' }
];

const BOWLING_STYLES = [
  { value: '', label: 'Select bowling style' },
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

const MobileProfileSetup: React.FC<MobileProfileSetupProps> = ({ 
  userName, 
  userEmail,
  onProfileCreated 
}) => {
  const [formData, setFormData] = useState<ProfileCreateData>({
    name: userName || '',
    phone: '',
    dateOfBirth: '',
    playerRole: 'player',
    team: 'Mavericks XI',
    cricHeroesId: '',
    about: '',
    battingStyle: '',
    bowlingStyle: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      return digits;
    }
    return digits.slice(0, 12);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneDisplay(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!formData.dateOfBirth?.trim()) {
      setError('Please select your date of birth');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const submitData: ProfileCreateData = {
        ...formData,
        battingStyle: formData.battingStyle || undefined,
        bowlingStyle: formData.bowlingStyle || undefined,
        cricHeroesId: formData.cricHeroesId || undefined,
        about: formData.about || undefined
      };

      await createProfile(submitData);
      setSuccess(true);
      
      setTimeout(() => {
        onProfileCreated();
      }, 1500);
    } catch (err: any) {
      console.error('Error creating profile:', err);
      setError(err.response?.data?.error || 'Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Profile Created!</h2>
        <p className="text-sm text-slate-400">Welcome to Mavericks XI</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
          <Trophy className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">
          Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}!
        </h2>
        <p className="text-sm text-slate-400">
          Complete your player profile to join the team
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Full Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Phone Field */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            WhatsApp Number <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 text-sm">+91</span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="9876543210"
              maxLength={10}
              className="w-full pl-20 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Used for match updates & availability requests</p>
        </div>

        {/* Date of Birth Field */}
        <DateOfBirthPicker
          value={formData.dateOfBirth}
          onChange={(date) => setFormData(prev => ({ ...prev, dateOfBirth: date }))}
          label="Date of Birth"
          required={true}
        />

        {/* Player Role */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Playing Role
          </label>
          <div className="relative">
            <select
              name="playerRole"
              value={formData.playerRole}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
            >
              {PLAYER_ROLES.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Batting & Bowling Style - Side by Side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Batting
            </label>
            <div className="relative">
              <select
                name="battingStyle"
                value={formData.battingStyle}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm appearance-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
              >
                {BATTING_STYLES.map(style => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Bowling
            </label>
            <div className="relative">
              <select
                name="bowlingStyle"
                value={formData.bowlingStyle}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm appearance-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
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
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            CricHeroes ID
            <span className="text-slate-500 text-xs ml-1">(optional)</span>
          </label>
          <input
            type="text"
            name="cricHeroesId"
            value={formData.cricHeroesId}
            onChange={handleChange}
            placeholder="Your CricHeroes username"
            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>

        {/* About */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            About
            <span className="text-slate-500 text-xs ml-1">(optional)</span>
          </label>
          <textarea
            name="about"
            value={formData.about}
            onChange={handleChange}
            placeholder="Tell us a bit about yourself..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-none"
          />
          <p className="text-xs text-slate-500 mt-1 text-right">{formData.about?.length || 0}/500</p>
        </div>

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 bg-slate-800/30 rounded-xl border border-white/5">
          <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">
            Your profile will be added to the team's player list. You'll receive match updates and availability requests via WhatsApp.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Profile...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Create Profile
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default MobileProfileSetup;
