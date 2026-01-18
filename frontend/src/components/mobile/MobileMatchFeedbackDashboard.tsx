import React from 'react';
import MatchFeedbackDashboard from '../MatchFeedbackDashboard';

interface MobileMatchFeedbackDashboardProps {
  matchId: string;
  matchOpponent?: string;
}

const MobileMatchFeedbackDashboard: React.FC<MobileMatchFeedbackDashboardProps> = ({
  matchId,
  matchOpponent
}) => {
  return (
    <div className="p-4">
      <MatchFeedbackDashboard matchId={matchId} matchOpponent={matchOpponent} />
    </div>
  );
};

export default MobileMatchFeedbackDashboard;
