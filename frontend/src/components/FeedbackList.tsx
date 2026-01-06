import React from 'react';
import { FeedbackSubmission } from '../types';
import FeedbackCard from './FeedbackCard';

interface FeedbackListProps {
  feedback: FeedbackSubmission[];
  currentView: 'active' | 'trash';
  selectedIssue: string | null;
  onFeedbackClick: (item: FeedbackSubmission) => void;
  onTrashClick: (id: string) => void;
  onRestoreClick?: (id: string) => void;
  onPermanentDeleteClick?: (id: string) => void;
}

const FeedbackList: React.FC<FeedbackListProps> = ({
  feedback,
  currentView,
  selectedIssue,
  onFeedbackClick,
  onTrashClick,
  onRestoreClick,
  onPermanentDeleteClick
}) => {
  if (!feedback.length) {
    return (
      <div className="card text-center py-12">
        <p className="text-secondary">
          {currentView === 'active'
            ? selectedIssue
              ? 'No feedback found for this issue filter.'
              : 'No feedback submissions yet.'
            : 'Trash is empty.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {feedback.map((item, index) => (
        <FeedbackCard
          key={item._id}
          item={item}
          index={index}
          onClick={onFeedbackClick}
          onTrash={currentView === 'active' ? onTrashClick : undefined}
          onRestore={currentView === 'trash' ? onRestoreClick : undefined}
          onDelete={currentView === 'trash' ? onPermanentDeleteClick : undefined}
        />
      ))}
    </div>
  );
};

export default FeedbackList;
