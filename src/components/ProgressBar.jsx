import React from 'react';
import './ProgressBar.css';

export default function ProgressBar({ current, max, type = 'xp' }) {
  const percent = Math.min(100, Math.max(0, (current / max) * 100)).toFixed(1);
  // Se for HP, exibe "HP: current/max", se for XP, exibe "XP: current/max"
  const label = type === 'hp' ? 'HP' : 'XP';

  return (
    <div className="progress-container">
      <div className={`progress-bar ${type}-bar`}>
        <div
          className={`progress-fill ${type}-fill`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <div className="progress-text">
        {label}: {current}/{max}
      </div>
    </div>
  );
}
