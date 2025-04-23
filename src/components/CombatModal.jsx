import React from 'react';
import './CombatModal.css';

export default function CombatModal({ show, onClose, combatLog, result }) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="combat-modal">
        <h2>Log de Combate</h2>
        
        <div className="combat-log-content">
          {combatLog.map((log, index) => (
            <p key={index} className={`log-entry ${log.type}`}>
              {log.message}
            </p>
          ))}
        </div>
        
        {result && (
          <div className={`combat-result ${result.type}`}>
            <h3>{result.title}</h3>
            <p>{result.message}</p>
          </div>
        )}
        
        <button className="close-modal-button" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
