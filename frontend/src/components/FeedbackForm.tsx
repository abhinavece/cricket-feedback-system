import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePickerCustom.css';
import RatingStars from './RatingStars';
import GroundRatingSelector from './GroundRatingSelector';
import type { FeedbackForm, GroundRatingType, PerformanceRating } from '../types';
import { Sparkles, Brain, Send, Calendar, User, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface FeedbackFormProps {
  onSubmit: (data: FeedbackForm) => void;
  loading?: boolean;
}

const RATING_FIELDS = ['batting', 'bowling', 'fielding', 'teamSpirit'] as const;
type RatingField = typeof RATING_FIELDS[number];

const isRatingField = (field: keyof FeedbackForm): field is RatingField =>
  (RATING_FIELDS as readonly string[]).includes(field as string);

// N/A labels for each rating category
const NA_LABELS: Record<RatingField, string> = {
  batting: "Didn't bat",
  bowling: "Didn't bowl",
  fielding: "Didn't field",
  teamSpirit: "Skip this"
};

const FeedbackFormComponent: React.FC<FeedbackFormProps> = ({ onSubmit, loading = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animated neural network background (same as homepage)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
    }> = [];

    const numParticles = 40;
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
        ctx.fill();

        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.1 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Helper function to auto-capitalize text like WhatsApp
  const autoCapitalize = (text: string): string => {
    if (!text) return text;
    
    // Capitalize first character
    let result = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Find all instances of period followed by space and a letter, and capitalize that letter
    result = result.replace(/\. ([a-z])/g, (match) => `. ${match.charAt(2).toUpperCase()}`);
    
    return result;
  };
  
  const [formData, setFormData] = useState<FeedbackForm>({
    playerName: '',
    matchDate: new Date(),
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.playerName.trim()) {
      newErrors.playerName = 'Player name is required';
    }

    if (!formData.matchDate) {
      newErrors.matchDate = 'Match date is required';
    }

    if (!formData.feedbackText.trim()) {
      newErrors.feedbackText = 'Experience feedback is required';
    }

    // Check that at least one rating is provided (not 0 and not all N/A)
    const ratings = RATING_FIELDS.map(field => formData[field]);
    const hasAtLeastOneRating = ratings.some(r => r !== null && r !== 0 && r >= 1);
    
    if (!hasAtLeastOneRating) {
      newErrors.ratings = 'Please rate at least one category. Use "Didn\'t bat/bowl" if you didn\'t participate.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Convert Date to string and normalize ratings for API submission
      // Convert 0 (not rated) to null for backend
      const submissionData: FeedbackForm = {
        ...formData,
        matchDate: typeof formData.matchDate === 'string' 
          ? formData.matchDate 
          : formData.matchDate.toISOString().split('T')[0],
        batting: formData.batting === 0 ? null : formData.batting,
        bowling: formData.bowling === 0 ? null : formData.bowling,
        fielding: formData.fielding === 0 ? null : formData.fielding,
        teamSpirit: formData.teamSpirit === 0 ? null : formData.teamSpirit,
      };
      onSubmit(submissionData);
    }
  };

  const handleInputChange = (field: keyof FeedbackForm, value: string | number | Date | GroundRatingType | PerformanceRating) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (isRatingField(field) && errors.ratings) {
      setErrors(prev => ({ ...prev, ratings: '' }));
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

  return (
    <div className="min-h-screen relative overflow-hidden py-6 md:py-12">
      {/* Neural Network Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container relative z-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            {/* AI Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">AI-Powered Feedback</span>
            </div>
            
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl blur-xl opacity-40 animate-pulse" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                  <span className="text-white font-black text-3xl">C</span>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900">
                  <Brain className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Share Your Match Feedback</h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Help us improve the cricket experience with your valuable insights
            </p>
          </div>

          {/* Main Form Card */}
          <div className="relative">
            {/* Card Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-violet-500/20 rounded-3xl blur-xl opacity-50" />
            
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
              {/* Form Header Strip */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-violet-500/10 border-b border-slate-700/50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Feedback Form</h2>
                    <p className="text-xs text-slate-400">All fields with * are required</p>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Player Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <User className="w-4 h-4 text-emerald-400" />
                    Player Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.playerName}
                    onChange={(e) => handleInputChange('playerName', autoCapitalize(e.target.value))}
                    className={`w-full bg-slate-800/50 border ${errors.playerName ? 'border-rose-500' : 'border-slate-700/50'} rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all`}
                    placeholder="Enter your name"
                  />
                  {errors.playerName && (
                    <p className="text-xs text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.playerName}
                    </p>
                  )}
                </div>

                {/* Match Date */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    Match Date <span className="text-rose-400">*</span>
                  </label>
                  <DatePicker
                    selected={typeof formData.matchDate === 'string' ? new Date(formData.matchDate) : formData.matchDate}
                    onChange={(date: Date | null) => {
                      if (date) {
                        handleInputChange('matchDate', date);
                      }
                    }}
                    className={`w-full bg-slate-800/50 border ${errors.matchDate ? 'border-rose-500' : 'border-slate-700/50'} rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all`}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select match date"
                    todayButton="Today"
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={15}
                    maxDate={new Date()}
                    withPortal={false}
                    popperClassName="date-picker-desktop"
                    popperPlacement="bottom-start"
                  />
                  {errors.matchDate && (
                    <p className="text-xs text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.matchDate}
                    </p>
                  )}
                </div>

                {/* Performance Ratings Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-amber-400">⭐</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Performance Ratings</h3>
                        <p className="text-xs text-slate-400">Rate your match performance</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                      Min 1 required
                    </span>
                  </div>
                  
                  {errors.ratings && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <p className="text-xs text-rose-400">{errors.ratings}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-3">
                    {([
                      { key: 'batting' as RatingField, label: 'Batting', emoji: '🏏', color: 'emerald' },
                      { key: 'bowling' as RatingField, label: 'Bowling', emoji: '⚡', color: 'cyan' },
                      { key: 'fielding' as RatingField, label: 'Fielding', emoji: '🎯', color: 'amber' },
                      { key: 'teamSpirit' as RatingField, label: 'Team Spirit', emoji: '💪', color: 'violet' },
                    ]).map(({ key, label, emoji, color }) => (
                      <div 
                        key={key} 
                        className={`bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 hover:border-${color}-500/30 transition-all`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{emoji}</span>
                            <span className="font-medium text-white text-sm">{label}</span>
                            {formData[key] === null && (
                              <span className="text-[10px] px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">N/A</span>
                            )}
                          </div>
                        </div>
                        <RatingStars
                          rating={formData[key]}
                          onChange={(value) => handleInputChange(key, value)}
                          size="lg"
                          allowNA={true}
                          naLabel={NA_LABELS[key]}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Match Experience */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <MessageSquare className="w-4 h-4 text-violet-400" />
                    Match Experience <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={formData.feedbackText}
                    onChange={(e) => handleInputChange('feedbackText', autoCapitalize(e.target.value))}
                    rows={4}
                    className={`w-full bg-slate-800/50 border ${errors.feedbackText ? 'border-rose-500' : 'border-slate-700/50'} rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none`}
                    placeholder="Describe your match experience..."
                  />
                  {errors.feedbackText && (
                    <p className="text-xs text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.feedbackText}
                    </p>
                  )}
                </div>

                {/* Issues Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Issues Faced</h3>
                        <p className="text-xs text-slate-400">Select any issues you encountered</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-1 bg-slate-700 text-slate-400 rounded-full">
                      Optional
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(formData.issues).map(([key, value]) => {
                      const issueConfig: Record<string, { emoji: string; color: string }> = {
                        venue: { emoji: '🏟️', color: 'emerald' },
                        timing: { emoji: '⏰', color: 'amber' },
                        umpiring: { emoji: '👨‍⚖️', color: 'violet' },
                        other: { emoji: '📋', color: 'rose' }
                      };
                      const config = issueConfig[key] || { emoji: '❓', color: 'slate' };
                      
                      return (
                        <div key={key}>
                          <button
                            type="button"
                            onClick={() => handleIssueChange(key as keyof typeof formData.issues)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                              value 
                                ? 'bg-emerald-500/20 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                                : 'bg-slate-800/30 border border-slate-700/50 hover:border-slate-600'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                              value ? 'bg-emerald-500' : 'border-2 border-slate-600'
                            }`}>
                              {value && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className="text-sm">{config.emoji}</span>
                            <span className={`text-sm font-medium ${value ? 'text-white' : 'text-slate-400'}`}>
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </span>
                          </button>
                          
                          {key === 'other' && value && (
                            <input
                              type="text"
                              value={formData.otherIssueText}
                              onChange={(e) => handleInputChange('otherIssueText', autoCapitalize(e.target.value))}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Describe the issue..."
                              className="w-full mt-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ground Rating */}
                <GroundRatingSelector
                  value={formData.groundRating}
                  onChange={(value: GroundRatingType) => handleInputChange('groundRating', value)}
                />

                {/* Additional Comments */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    Additional Comments
                    <span className="text-[10px] px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full">Optional</span>
                  </label>
                  <textarea
                    value={formData.additionalComments}
                    onChange={(e) => handleInputChange('additionalComments', autoCapitalize(e.target.value))}
                    rows={3}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none"
                    placeholder="Any other thoughts or suggestions..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
                  <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/25">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Feedback</span>
                        <Sparkles className="w-4 h-4 opacity-60" />
                      </>
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-center text-xs text-slate-500 mt-6">
            CricSmart • AI-Powered Cricket Management
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackFormComponent;
