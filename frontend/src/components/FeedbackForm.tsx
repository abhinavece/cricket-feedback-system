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
    <div className="container py-4 md:py-10">
      <div className="card max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8" style={{color: 'var(--primary-green)'}}>Cricket Match Feedback</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Player Name */}
          <div className="form-group">
            <label className="form-label">
              Player Name *
            </label>
            <input
              type="text"
              value={formData.playerName}
              onChange={(e) => handleInputChange('playerName', autoCapitalize(e.target.value))}
              className={`form-control ${errors.playerName ? 'border-red-500' : ''}`}
              placeholder="Enter your name"
            />
            {errors.playerName && <p className="text-red-500 text-sm mt-1">{errors.playerName}</p>}
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
              className={`form-control ${errors.matchDate ? 'border-red-500' : ''}`}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select match date"
              todayButton="Today"
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={15}
              maxDate={new Date()}
            />
            {errors.matchDate && (
              <p className="text-red-500 text-sm mt-1">{errors.matchDate}</p>
            )}
          </div>

          {/* Ratings */}
          <div className="space-y-6 md:space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{color: 'var(--text-primary)'}}>
              Performance Ratings <span className="text-accent-red text-xl">*</span>
            </h3>
            {errors.ratings && (
              <div
                className="rounded-2xl p-4 shadow-lg flex items-center gap-3 animate-fade-in"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,99,71,0.15), rgba(255,165,0,0.15))',
                  border: '1px solid rgba(255, 99, 71, 0.4)'
                }}
              >
                <span className="text-xl">✨</span>
                <div>
                  <p className="font-semibold text-accent-orange text-sm md:text-base">Complete your star lineup!</p>
                  <p className="text-xs md:text-sm text-secondary">{errors.ratings}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {[
                { key: 'batting' as keyof FeedbackForm, label: 'Batting' },
                { key: 'bowling' as keyof FeedbackForm, label: 'Bowling' },
                { key: 'fielding' as keyof FeedbackForm, label: 'Fielding' },
                { key: 'teamSpirit' as keyof FeedbackForm, label: 'Team Spirit' },
              ].map(({ key, label }) => (
                <div key={key} className="form-group mb-0">
                  <label className="form-label flex items-center justify-between">
                    <span>{label}</span>
                  </label>
                  <RatingStars
                    rating={formData[key] as number}
                    onChange={(value) => handleInputChange(key, value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Experience Feedback */}
          <div className="form-group">
            <label className="form-label">
              Match Experience *
            </label>
            <textarea
              value={formData.feedbackText}
              onChange={(e) => handleInputChange('feedbackText', autoCapitalize(e.target.value))}
              rows={4}
              className={`form-control ${errors.feedbackText ? 'border-red-500' : ''}`}
              placeholder="How was your game today?"
            />
            {errors.feedbackText && (
              <p className="text-red-500 text-sm mt-1">{errors.feedbackText}</p>
            )}
          </div>

          {/* Issues Faced */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold" style={{color: 'var(--text-primary)'}}>Issues Faced</h3>
            <div className="checkbox-group">
              {Object.entries(formData.issues).map(([key, value]) => (
                <div key={key} className="checkbox-item flex items-center group cursor-pointer" onClick={() => handleIssueChange(key as keyof typeof formData.issues)}>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => e.stopPropagation()} /* Handled by parent click for larger target */
                    className="form-checkbox pointer-events-none"
                  />
                  <label className="flex-1 cursor-pointer ml-3">{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Comments */}
          <div className="form-group pt-4">
            <label className="form-label">
              Additional Comments
            </label>
            <textarea
              value={formData.additionalComments}
              onChange={(e) => handleInputChange('additionalComments', autoCapitalize(e.target.value))}
              rows={3}
              className="form-control"
              placeholder="Any other thoughts?"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-14"
              style={{fontSize: '18px'}}
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackFormComponent;
