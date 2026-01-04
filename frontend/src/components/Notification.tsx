import React from 'react';
import './Notification.css';

interface NotificationProps {
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
  return (
    <div className="notification-overlay">
      <div className="notification-modal">
        <div className="notification-icon">🏏</div>
        <h3 className="notification-title">Access Restricted</h3>
        <p className="notification-message">{message}</p>
        <button className="notification-button" onClick={onClose}>
          I Understand
        </button>
      </div>
    </div>
  );
};

export default Notification;
