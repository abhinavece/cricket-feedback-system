import React from 'react';
import PlayerFeedbackHistory from '../PlayerFeedbackHistory';

interface MobilePlayerFeedbackHistoryProps {
  playerId: string;
  playerName?: string;
}

const MobilePlayerFeedbackHistory: React.FC<MobilePlayerFeedbackHistoryProps> = ({
  playerId,
  playerName
}) => {
  return (
    <div className="p-4">
      <PlayerFeedbackHistory playerId={playerId} playerName={playerName} />
    </div>
  );
};

export default MobilePlayerFeedbackHistory;
