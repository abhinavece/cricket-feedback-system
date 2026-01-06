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
    <div className="container py-6 md:py-12">
      <div className="card card-hover-lift max-w-2xl mx-auto animate-fade-in">
        <div className="card-header text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-solid to-primary-dark flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-primary-solid to-primary-dark bg-clip-text text-transparent">Cricket Match Feedback</h1>
          <p className="text-text-secondary mt-2">Share your match experience with us</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8 p-6">
          {/* Player Name */}
          <div className="form-floating">
            <input
              type="text"
              id="playerName"
              value={formData.playerName}
              onChange={(e) => handleInputChange('playerName', autoCapitalize(e.target.value))}
              className={`form-control ${errors.playerName ? 'is-invalid' : ''}`}
              placeholder="Player Name"
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
              placeholderText="Select match date"
              todayButton="Today"
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={15}
              maxDate={new Date()}
            />
            {errors.matchDate && <div className="invalid-feedback">{errors.matchDate}</div>}
          </div>

          {/* Ratings */}
          <div className="bg-surface-hover/30 p-6 rounded-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Performance Ratings</h3>
              <span className="text-xs px-2 py-1 bg-primary-light text-primary-solid rounded-md font-medium">Required</span>
            </div>
            
            {errors.ratings && (
              <div
                className="rounded-xl p-4 bg-accent-danger/10 border border-accent-danger/20 flex items-center gap-3 animate-fade-in"
              >
                <div className="p-2 rounded-full bg-accent-danger/20 text-accent-danger">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-accent-danger text-sm">{errors.ratings}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'batting' as keyof FeedbackForm, label: 'Batting', icon: 'M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11' },
                { key: 'bowling' as keyof FeedbackForm, label: 'Bowling', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' },
                { key: 'fielding' as keyof FeedbackForm, label: 'Fielding', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
                { key: 'teamSpirit' as keyof FeedbackForm, label: 'Team Spirit', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              ].map(({ key, label, icon }) => (
                <div key={key} className="bg-surface-card p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-surface-hover">
                      <svg className="w-5 h-5 text-primary-solid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
                      </svg>
                    </div>
                    <span className="font-medium text-white">{label}</span>
                  </div>
                  <RatingStars
                    rating={formData[key] as number}
                    onChange={(value) => handleInputChange(key, value)}
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
              placeholder="Match Experience"
            />
            <label htmlFor="feedbackText" className="form-label">Match Experience *</label>
            {errors.feedbackText && <div className="invalid-feedback">{errors.feedbackText}</div>}
          </div>

          {/* Issues Faced */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Issues Faced</h3>
              <span className="text-xs px-2 py-1 bg-surface-hover text-text-secondary rounded-md">Optional</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(formData.issues).map(([key, value]) => {
                const icons: Record<string, string> = {
                  venue: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
                  equipment: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                  timing: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                  umpiring: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2',
                  other: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                };
                
                return (
                  <div 
                    key={key} 
                    className={`form-check flex items-center p-3 rounded-lg cursor-pointer transition-all ${value ? 'bg-primary-light border border-primary-solid/30' : 'bg-surface-hover hover:bg-surface-hover/80'}`}
                    onClick={() => handleIssueChange(key as keyof typeof formData.issues)}
                  >
                    <div className="mr-3">
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${value ? 'bg-primary-solid' : 'border border-text-tertiary'}`}>
                        {value && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <svg className={`w-4 h-4 ${value ? 'text-primary-solid' : 'text-text-tertiary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icons[key] || icons.other} />
                      </svg>
                      <span className={`${value ? 'text-primary-solid font-medium' : 'text-text-secondary'}`}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </span>
                    </div>
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
              placeholder="Additional Comments"
            />
            <label htmlFor="additionalComments" className="form-label">Additional Comments</label>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full btn-hover-glow"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Feedback
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackFormComponent;
