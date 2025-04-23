import React from 'react';
import './Notification.css';

export default function Notification({ message, type = 'info' }) {
  return (
    <div className={`notification notification-${type}`}>
      <p>{message}</p>
    </div>
  );
}