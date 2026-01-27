import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePickerCustom.css';
import RatingStars from './RatingStars';
import GroundRatingSelector from './GroundRatingSelector';
import type { FeedbackForm, GroundRatingType, PerformanceRating } from '../types';

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
    <div className="container py-4 md:py-8">
      <div className="relative max-w-xl mx-auto">
        {/* Animated background glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 rounded-3xl blur-2xl opacity-10"></div>
        
        <div className="relative card card-hover-lift animate-fade-in bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-2 border-gray-600/20">
          <div className="card-header text-center relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-gray-600 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-gray-700 rounded-full blur-3xl"></div>
            </div>
            
            <div className="flex justify-center mb-3 relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full blur-xl opacity-40"></div>
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex items-center justify-center shadow-2xl shadow-green-500/50">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">Send us your feedback</h1>
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
            {errors.matchDate && <div className="invalid-feedback">{errors.matchDate}</div>}
          </div>

          {/* Ratings */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-300">⭐ Your Performance Ratings</h3>
              <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded-full">At least 1 required</span>
            </div>
            
            <p className="text-xs text-slate-400 -mt-4">
              Didn't get a chance to bat or bowl? No problem - just mark it as N/A!
            </p>
            
            {errors.ratings && (
              <div className="rounded-xl p-3 bg-red-500/20 border-2 border-red-500 flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-red-500 text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="font-bold text-white text-sm">{errors.ratings}</p>
              </div>
            )}
            
            <div className="space-y-4">
              {([
                { key: 'batting' as RatingField, label: 'Batting', emoji: '🏏' },
                { key: 'bowling' as RatingField, label: 'Bowling', emoji: '⚡' },
                { key: 'fielding' as RatingField, label: 'Fielding', emoji: '🎯' },
                { key: 'teamSpirit' as RatingField, label: 'Team Spirit', emoji: '💪' },
              ]).map(({ key, label, emoji }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{emoji}</span>
                    <span className="font-medium text-gray-200 text-base">{label}</span>
                    {formData[key] === null && (
                      <span className="text-xs px-2 py-0.5 bg-slate-600 text-slate-300 rounded-full">N/A</span>
                    )}
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
            
            <div className="space-y-3">
              {Object.entries(formData.issues).map(([key, value]) => {
                const issueLabels: Record<string, string> = {
                  venue: 'Venue',
                  timing: 'Timing',
                  umpiring: 'Umpiring',
                  other: 'Other'
                };
                
                return (
                  <div key={key}>
                    <div 
                      className={`form-check flex items-center p-4 rounded-xl cursor-pointer transition-all ${value ? 'bg-gradient-to-r from-gray-600 to-gray-700 shadow-lg shadow-gray-600/30 scale-[1.02]' : 'bg-slate-800 hover:bg-slate-700'}`}
                      onClick={() => handleIssueChange(key as keyof typeof formData.issues)}
                    >
                      <div className="mr-4">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${value ? 'bg-white' : 'border-2 border-slate-500'}`}>
                          {value && (
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      <span className={`text-base font-medium ${value ? 'text-white' : 'text-slate-400'}`}>
                        {issueLabels[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                      </span>
                    </div>
                    
                    {/* Show text input when "Other" is selected */}
                    {key === 'other' && value && (
                      <div className="mt-2 ml-10">
                        <input
                          type="text"
                          value={formData.otherIssueText}
                          onChange={(e) => handleInputChange('otherIssueText', autoCapitalize(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Please describe the issue..."
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
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
              <div className="absolute inset-0 bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
