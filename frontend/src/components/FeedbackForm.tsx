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
    <div className="container">
      <div className="card">
        <h1 className="text-3xl font-bold text-center mb-6" style={{color: 'var(--primary-green)'}}>Cricket Match Feedback</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Player Name */}
          <div className="form-group">
            <label className="form-label">
              Player Name *
            </label>
            <input
              type="text"
              value={formData.playerName}
              onChange={(e) => handleInputChange('playerName', e.target.value)}
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{color: 'var(--text-primary)'}}>
              Performance Ratings <span className="text-accent-red text-xl">*</span>
            </h3>
            {errors.ratings && (
              <div
                className="rounded-2xl p-4 shadow-lg flex items-center gap-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,99,71,0.15), rgba(255,165,0,0.15))',
                  border: '1px solid rgba(255, 99, 71, 0.4)'
                }}
              >
                <span role="img" aria-label="spark">✨</span>
                <div>
                  <p className="font-semibold text-accent-orange">Complete your star lineup!</p>
                  <p className="text-sm text-secondary">{errors.ratings}</p>
                </div>
              </div>
            )}
            
            {[
              { key: 'batting' as keyof FeedbackForm, label: 'Batting' },
              { key: 'bowling' as keyof FeedbackForm, label: 'Bowling' },
              { key: 'fielding' as keyof FeedbackForm, label: 'Fielding' },
              { key: 'teamSpirit' as keyof FeedbackForm, label: 'Team Spirit' },
            ].map(({ key, label }) => (
              <div key={key} className="form-group">
                <label className="form-label">
                  {label} (1-5) <span className="text-accent-red">*</span>
                </label>
                <RatingStars
                  rating={formData[key] as number}
                  onChange={(value) => handleInputChange(key, value)}
                />
              </div>
            ))}
          </div>

          {/* Experience Feedback */}
          <div className="form-group">
            <label className="form-label">
              Match Experience *
            </label>
            <textarea
              value={formData.feedbackText}
              onChange={(e) => handleInputChange('feedbackText', e.target.value)}
              rows={4}
              className={`form-control ${errors.feedbackText ? 'border-red-500' : ''}`}
              placeholder="Describe your match experience..."
            />
            {errors.feedbackText && (
              <p className="text-red-500 text-sm mt-1">{errors.feedbackText}</p>
            )}
          </div>

          {/* Issues Faced */}
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{color: 'var(--text-primary)'}}>Issues Faced</h3>
            <div className="checkbox-group">
              {Object.entries(formData.issues).map(([key, value]) => (
                <div key={key} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleIssueChange(key as keyof typeof formData.issues)}
                  />
                  <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Comments */}
          <div className="form-group">
            <label className="form-label">
              Additional Comments
            </label>
            <textarea
              value={formData.additionalComments}
              onChange={(e) => handleInputChange('additionalComments', e.target.value)}
              rows={3}
              className="form-control"
              placeholder="Any additional feedback or suggestions..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
            style={{fontSize: '18px', padding: '12px 24px'}}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackFormComponent;
