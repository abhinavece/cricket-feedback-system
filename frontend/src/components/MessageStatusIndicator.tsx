import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface MessageStatusIndicatorProps {
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  errorMessage?: string;
}

const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
  status,
  size = 'sm',
  showTooltip = true,
  errorMessage
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const iconSize = sizeClasses[size];

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className={`${iconSize} text-slate-400`} />;
      case 'sent':
        return <Check className={`${iconSize} text-slate-400`} />;
      case 'delivered':
        return <CheckCheck className={`${iconSize} text-slate-400`} />;
      case 'read':
        return <CheckCheck className={`${iconSize} text-blue-400`} />;
      case 'failed':
        return <AlertCircle className={`${iconSize} text-rose-400`} />;
      default:
        return null;
    }
  };

  const getTooltipText = () => {
    switch (status) {
      case 'pending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      case 'failed':
        return errorMessage ? `Failed: ${errorMessage}` : 'Failed to send';
      default:
        return '';
    }
  };

  if (!showTooltip) {
    return <span className="inline-flex items-center">{getStatusIcon()}</span>;
  }

  return (
    <span
      className="inline-flex items-center cursor-help"
      title={getTooltipText()}
    >
      {getStatusIcon()}
    </span>
  );
};

export default MessageStatusIndicator;
