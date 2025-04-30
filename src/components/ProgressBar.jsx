import React from 'react';
import './ProgressBar.css';

export default function ProgressBar({ current, max, type = 'xp' }) {
  const percent = Math.min(100, Math.max(0, (current / max) * 100)).toFixed(1);
  
  return (
    <div className="progress-container">
      <div className={`progress-bar ${type}-bar`}>
        <div className={`progress-fill ${type}-fill`} style={{ width: `${percent}%` }}></div>
      </div>
      <div className="progress-text">
        {current} / {max}
      </div>
    </div>
  );
}