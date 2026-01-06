import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePickerCustom.css';
import RatingStars from './RatingStars';
import type { FeedbackForm } from '../types';

interface FeedbackFormProps {
  onSubmit: (data: FeedbackForm) => void;
  loading?: boolean;
}

const REQUIRED_RATING_FIELDS = ['batting', 'bowling', 'fielding', 'teamSpirit'] as const;
type RatingField = typeof REQUIRED_RATING_FIELDS[number];

const isRatingField = (field: keyof FeedbackForm): field is RatingField =>
  (REQUIRED_RATING_FIELDS as readonly string[]).includes(field as string);

const FeedbackFormComponent: React.FC<FeedbackFormProps> = ({ onSubmit, loading = false }) => {
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
    batting: 0,
    bowling: 0,
    fielding: 0,
    teamSpirit: 0,
    feedbackText: '',
    issues: {
      venue: false,
      equipment: false,
      timing: false,
      umpiring: false,
      other: false,
    },
    additionalComments: '',
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

    REQUIRED_RATING_FIELDS.forEach((field) => {
      const value = formData[field] as number;
      if (!value || value < 1) {
        newErrors.ratings = 'Rate batting, bowling, fielding, and team spirit to continue.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Convert Date to string for API submission
      const submissionData = {
        ...formData,
        matchDate: typeof formData.matchDate === 'string' 
          ? formData.matchDate 
          : formData.matchDate.toISOString().split('T')[0]
      };
      onSubmit(submissionData);
    }
  };

  const handleInputChange = (field: keyof FeedbackForm, value: string | number | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (isRatingField(field) && errors.ratings) {
      setErrors(prev => ({ ...prev, ratings: '' }));
    }
  };

  const handleIssueChange = (issue: keyof typeof formData.issues) => {
    setFormData(prev => ({
      ...prev,
      issues: { ...prev.issues, [issue]: !prev.issues[issue] }
    }));
  };

  return (
    <div className="container py-4 md:py-8">
      <div className="relative max-w-xl mx-auto">
        {/* Animated background glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
        
        <div className="relative card card-hover-lift animate-fade-in bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-2 border-emerald-500/20">
          <div className="card-header text-center relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-emerald-400 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-cyan-400 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
            
            <div className="flex justify-center mb-3 relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-xl opacity-60 animate-pulse"></div>
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/50 animate-bounce" style={{animationDuration: '2s'}}>
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2 animate-pulse">Share your match experience with us</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 p-4 md:p-5">
          {/* Player Name */}
          <div className="form-floating">
            <input
              type="text"
              id="playerName"
              value={formData.playerName}
              onChange={(e) => handleInputChange('playerName', autoCapitalize(e.target.value))}
              className={`form-control ${errors.playerName ? 'is-invalid' : ''}`}
              placeholder=""
            />
            <label htmlFor="playerName" className="form-label">Player Name *</label>
            {errors.playerName && <div className="invalid-feedback">{errors.playerName}</div>}
          </div>

          {/* Match Date */}
          <div className="form-group">
            <label className="form-label">
              Match Date *
            </label>
            <DatePicker
              selected={typeof formData.matchDate === 'string' ? new Date(formData.matchDate) : formData.matchDate}
              onChange={(date: Date | null) => {
                if (date) {
                  handleInputChange('matchDate', date);
                }
              }}
              className={`form-control ${errors.matchDate ? 'is-invalid' : ''}`}
              dateFormat="yyyy-MM-dd"
              placeholderText=""
              todayButton="Today"
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={15}
              maxDate={new Date()}
            />
            {errors.matchDate && <div className="invalid-feedback">{errors.matchDate}</div>}
          </div>

          {/* Ratings */}
          <div className="relative bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 p-4 rounded-2xl space-y-4 border border-emerald-500/30">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-2xl animate-pulse"></div>
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-base font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">⭐ Performance Ratings</h3>
              <span className="text-xs px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold shadow-lg">Required</span>
            </div>
            
            {errors.ratings && (
              <div
                className="relative z-10 rounded-xl p-3 bg-red-500/20 border-2 border-red-500 flex items-center gap-2 animate-bounce shadow-lg shadow-red-500/50"
              >
                <div className="p-1.5 rounded-full bg-red-500 text-white animate-pulse">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{errors.ratings}</p>
                </div>
              </div>
            )}
            
            <div className="relative z-10 grid grid-cols-2 gap-3">
              {[
                { key: 'batting' as keyof FeedbackForm, label: '🏏 Batting', color: 'from-orange-500 to-red-500' },
                { key: 'bowling' as keyof FeedbackForm, label: '⚡ Bowling', color: 'from-blue-500 to-cyan-500' },
                { key: 'fielding' as keyof FeedbackForm, label: '🎯 Fielding', color: 'from-yellow-500 to-orange-500' },
                { key: 'teamSpirit' as keyof FeedbackForm, label: '💪 Spirit', color: 'from-purple-500 to-pink-500' },
              ].map(({ key, label, color }) => (
                <div key={key} className={`bg-gradient-to-br ${color} p-3 rounded-xl shadow-lg transform transition-all hover:scale-105`}>
                  <div className="text-center mb-2">
                    <span className="font-bold text-white text-sm">{label}</span>
                  </div>
                  <RatingStars
                    rating={formData[key] as number}
                    onChange={(value) => handleInputChange(key, value)}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Experience Feedback */}
          <div className="form-floating">
            <textarea
              id="feedbackText"
              value={formData.feedbackText}
              onChange={(e) => handleInputChange('feedbackText', autoCapitalize(e.target.value))}
              rows={4}
              className={`form-control ${errors.feedbackText ? 'is-invalid' : ''}`}
              placeholder=""
            />
            <label htmlFor="feedbackText" className="form-label">Match Experience *</label>
            {errors.feedbackText && <div className="invalid-feedback">{errors.feedbackText}</div>}
          </div>

          {/* Issues Faced */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold bg-gradient-to-r from-slate-300 to-slate-500 bg-clip-text text-transparent">⚠️ Issues Faced</h3>
              <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">Optional</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(formData.issues).map(([key, value]) => {
                return (
                  <div 
                    key={key} 
                    className={`form-check flex items-center p-2 rounded-lg cursor-pointer transition-all ${value ? 'bg-gradient-to-r from-red-500 to-orange-500 shadow-lg shadow-red-500/50 scale-105' : 'bg-slate-800 hover:bg-slate-700'}`}
                    onClick={() => handleIssueChange(key as keyof typeof formData.issues)}
                  >
                    <div className="mr-2">
                      <div className={`w-4 h-4 rounded flex items-center justify-center ${value ? 'bg-white' : 'border border-slate-500'}`}>
                        {value && (
                          <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    <span className={`text-xs font-medium ${value ? 'text-white' : 'text-slate-400'}`}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Comments */}
          <div className="form-floating">
            <textarea
              id="additionalComments"
              value={formData.additionalComments}
              onChange={(e) => handleInputChange('additionalComments', autoCapitalize(e.target.value))}
              rows={3}
              className="form-control"
              placeholder=""
            />
            <label htmlFor="additionalComments" className="form-label">Additional Comments</label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3 px-6 rounded-xl font-bold text-white overflow-hidden group transform transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 animate-gradient-x"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    SUBMIT FEEDBACK
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackFormComponent;
