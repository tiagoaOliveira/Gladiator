// src/components/NotificationDot.jsx
import React from 'react';
import './NotificationDot.css';

export default function NotificationDot({ show }) {
  if (!show) return null;
  
  return <div className="notification-dot"></div>;
}