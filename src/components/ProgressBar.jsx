import React from 'react';
import './ProgressBar.css';

export default function ProgressBar({ current, max, type = 'xp' }) {
  const percent = ((current / max) * 100).toFixed(1);
  
  return (
    <div className="progress-container">
      <div className={`progress-bar ${type}-bar`}>
        <div className={`progress-fill ${type}-fill`} style={{ width: `${percent}%` }}></div>
      </div>
      <p className="progress-text">
        {current} / {max}
      </p>
    </div>
  );
}