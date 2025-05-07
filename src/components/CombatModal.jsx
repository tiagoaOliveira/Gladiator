import React, { useState, useEffect } from 'react';
import './CombatModal.css';
import character from '../assets/images/gladiator.jpg';

export default function CombatModal({ show, onClose, combatLog, result }) {
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [playerDamage, setPlayerDamage] = useState(null);
  const [enemyDamage, setEnemyDamage] = useState(null);
  const [enemyImage, setEnemyImage] = useState('');
  const [enemyName, setEnemyName] = useState('');
  const [battleFinished, setBattleFinished] = useState(false);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(100);
  
  // Reset state when modal opens
  useEffect(() => {
    if (show) {
      setCurrentLogIndex(0);
      setPlayerDamage(null);
      setEnemyDamage(null);
      setBattleFinished(false);
      setPlayerHealth(100);
      setEnemyHealth(100);
      
      // Extract enemy image and name from the combat log
      if (combatLog && combatLog.length > 0) {
        // Try to find enemy information in the first message
        const firstMessage = combatLog[0].message;
        if (firstMessage.includes('contra')) {
          const enemyNameMatch = firstMessage.match(/contra (.+?)!/);
          if (enemyNameMatch && enemyNameMatch[1]) {
            setEnemyName(enemyNameMatch[1]);
          }
        }
      }
    }
  }, [show, combatLog]);
  
  // Process the combat log to show battle animations
  useEffect(() => {
    if (!show || !combatLog || combatLog.length === 0 || currentLogIndex >= combatLog.length) {
      return;
    }
    
    const log = combatLog[currentLogIndex];
    
    if (log.type === 'player') {
      // Extract damage from player action
      const damageMatch = log.message.match(/causou (\d+) de dano/);
      if (damageMatch && damageMatch[1]) {
        const damage = parseInt(damageMatch[1]);
        setPlayerDamage(damage);
        setEnemyHealth(prev => Math.max(0, prev - (damage / 2))); // Adjust health reduction for visual effect
        
        // Clear after animation
        setTimeout(() => {
          setPlayerDamage(null);
        }, 1000);
      }
    } else if (log.type === 'enemy') {
      // Extract damage from enemy action
      const damageMatch = log.message.match(/causou (\d+) de dano/);
      if (damageMatch && damageMatch[1]) {
        const damage = parseInt(damageMatch[1]);
        setEnemyDamage(damage);
        setPlayerHealth(prev => Math.max(0, prev - (damage / 2))); // Adjust health reduction for visual effect
        
        // Clear after animation
        setTimeout(() => {
          setEnemyDamage(null);
        }, 1000);
      }
    }
    
    // Move to next log entry after a delay
    const nextLogTimeout = setTimeout(() => {
      if (currentLogIndex < combatLog.length - 1) {
        setCurrentLogIndex(prev => prev + 1);
      } else {
        setBattleFinished(true);
      }
    }, 500);
    
    return () => clearTimeout(nextLogTimeout);
  }, [show, combatLog, currentLogIndex]);

  if (!show) return null;

  // Try to extract enemy image from current enemy if possible
  const getEnemyImage = () => {
    // In a real implementation, you'd pass the enemy image from Arena.jsx
    // For now we'll return a placeholder if the enemy image isn't set
    return enemyImage || '/api/placeholder/150/150';
  };

  return (
    <div className="modal-overlay">
      <div className="combat-modal">
        <h2>Batalha contra {enemyName}</h2>
        
        <div className="battle-visualization">
          <div className="combatant player-combatant">
            <div className="health-bar-wrapper">
              <div className="health-bar">
                <div className="health-fill" style={{ width: `${playerHealth}%` }}></div>
              </div>
            </div>
            <img src={character} alt="Player character" className="combatant-image" />
            {enemyDamage && <div className="damage-number player-damage">-{enemyDamage}</div>}
          </div>
          
          <div className="battle-vs">VS</div>
          
          <div className="combatant enemy-combatant">
            <div className="health-bar-wrapper">
              <div className="health-bar">
                <div className="health-fill" style={{ width: `${enemyHealth}%` }}></div>
              </div>
            </div>
            <img src={getEnemyImage()} alt={enemyName} className="combatant-image" />
            {playerDamage && <div className="damage-number enemy-damage">-{playerDamage}</div>}
          </div>
        </div>
        
        <div className="combat-log-content">
          {combatLog.slice(0, currentLogIndex + 1).map((log, index) => (
            <p key={index} className={`log-entry ${log.type}`}>
              {log.message}
            </p>
          ))}
        </div>
        
        {battleFinished && result && (
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