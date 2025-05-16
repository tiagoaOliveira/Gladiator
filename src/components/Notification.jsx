import React, { useEffect, useState } from 'react';
import './Notification.css';

export default function Notification({ message, type = 'info' }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  if (!visible) return null;

  return (
    <div className={`notification ${type}`}>
      <div className="notification-content">
        {type === 'success' && <span className="notification-icon">✓</span>}
        {type === 'error' && <span className="notification-icon">✗</span>}
        {type === 'info' && <span className="notification-icon">ℹ</span>}
        {type === 'warning' && <span className="notification-icon">⚠</span>}
        <span className="notification-message">{message}</span>
      </div>
    </div>
  );
}