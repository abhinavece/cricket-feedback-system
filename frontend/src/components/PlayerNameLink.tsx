import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

interface PlayerNameLinkProps {
  playerId: string;
  playerName: string;
  className?: string;
  showIcon?: boolean;
}

const PlayerNameLink: React.FC<PlayerNameLinkProps> = ({
  playerId,
  playerName,
  className = '',
  showIcon = false
}) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/player/${playerId}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 text-left hover:text-emerald-400 transition-colors cursor-pointer bg-transparent border-none p-0 ${className}`}
      title={`View ${playerName}'s profile`}
    >
      <span className="hover:underline">{playerName}</span>
      {showIcon && <ExternalLink className="w-3 h-3 opacity-50" />}
    </button>
  );
};

export default PlayerNameLink;
