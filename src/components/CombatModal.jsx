import React, { useState, useEffect, useRef } from 'react';
import './CombatModal.css';
import character from '../assets/images/gladiator.jpg';
import { enemies } from '../utils/enemies';


export default function CombatModal({ 
  show, 
  onClose, 
  onRetry, 
  combatLog, 
  result, 
  showRetryButton = true,
  isAutoBattle = false
}) {
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [playerDamage, setPlayerDamage] = useState(null);
  const [enemyDamage, setEnemyDamage] = useState(null);
  const [enemyImage, setEnemyImage] = useState('');
  const [enemyName, setEnemyName] = useState('');
  const [battleFinished, setBattleFinished] = useState(false);
  const logEndRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (show) {
      setCurrentLogIndex(0);
      setPlayerDamage(null);
      setEnemyDamage(null);
      setBattleFinished(false);

      // Extrair nome e imagem do inimigo a partir do combatLog
      if (combatLog && combatLog.length > 0) {
        const firstMessage = combatLog[0].message;
        if (firstMessage.includes('contra')) {
          const enemyNameMatch = firstMessage.match(/contra (.+?)!/);
          if (enemyNameMatch && enemyNameMatch[1]) {
            const name = enemyNameMatch[1];
            setEnemyName(name);

            // Buscar imagem do inimigo com base no nome
            const matchedEnemy = enemies.find(e => e.name === name);
            if (matchedEnemy) {
              setEnemyImage(matchedEnemy.image);
            }
          }
        }
      }
      
      // Em modo de batalha automática, definir o log como finalizado imediatamente
      if (isAutoBattle) {
        setBattleFinished(true);
      }
    }
  }, [show, combatLog, isAutoBattle]);


  // Process the combat log to show battle animations (skip in auto-battle mode)
  useEffect(() => {
    if (!show || !combatLog || combatLog.length === 0 || currentLogIndex >= combatLog.length || isAutoBattle) {
      return;
    }

    const log = combatLog[currentLogIndex];

    if (log.type === 'player') {
      // Extract damage from player action
      const damageMatch = log.message.match(/causou (\d+) de dano/);
      if (damageMatch && damageMatch[1]) {
        const damage = parseInt(damageMatch[1]);
        setPlayerDamage(damage);

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

        // Clear after animation
        setTimeout(() => {
          setEnemyDamage(null);
        }, 1000);
      }
    }

    // Regular entries get standard delay, but we'll make attack speed entries faster
    let displayDelay = 500; // Default delay

    // If the message contains attack speed information, adjust the delay
    if (log.attackSpeed) {
      // Min delay of 200ms for readability
      displayDelay = Math.max(200, 500 / log.attackSpeed);
    }

    // Move to next log entry after a delay
    const nextLogTimeout = setTimeout(() => {
      if (currentLogIndex < combatLog.length - 1) {
        setCurrentLogIndex(prev => prev + 1);
      } else {
        setBattleFinished(true);
      }
    }, displayDelay);

    return () => clearTimeout(nextLogTimeout);
  }, [show, combatLog, currentLogIndex, isAutoBattle]);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentLogIndex]);


  if (!show) return null;

  // Try to extract enemy image from current enemy if possible
  const getEnemyImage = () => {
    // In a real implementation, you'd pass the enemy image from Arena.jsx
    // For now we'll return a placeholder if the enemy image isn't set
    return enemyImage || '/api/placeholder/150/150';
  };

  // Renderização para modo de batalha automática
  if (isAutoBattle && result && result.type === 'auto-battle') {
    // Extrair os números do resultado
    const resultParts = result.message.split(', ');
    const extractValue = (part, label) => {
      const match = part.match(new RegExp(`${label}: (\\d+)`));
      return match ? match[1] : '0';
    };

    const battles = extractValue(resultParts[0], 'Batalhas');
    const xp = extractValue(resultParts[1], 'XP');
    const gold = extractValue(resultParts[2], 'Ouro');
    const hpLost = extractValue(resultParts[3], 'HP Perdido');

    return (
      <div className="modal-overlay">
        <div className="combat-modal">
          <h2>Resumo de Batalha Automática</h2>

          <div className="auto-battle-summary">
            <div className="auto-battle-stats">
              <div className="stat-item">
                <span className="stat-label">Batalhas:</span>
                <span className="stat-value">{battles}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">XP Ganho:</span>
                <span className="stat-value xp-value">+{xp}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Ouro Ganho:</span>
                <span className="stat-value gold-value">+{gold}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">HP Perdido:</span>
                <span className="stat-value hp-value">-{hpLost}</span>
              </div>
            </div>
          </div>

          <div className="combat-modal-buttons">
            <button className="close-modal-button" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderização padrão para batalha normal
  return (
    <div className="modal-overlay">
      <div className="combat-modal">

        <div className="battle-visualization">
          <div className="combatant player-combatant">
            <img src={character} alt="Player character" className="combatant-image" />
            {enemyDamage && <div className="damage-number player-damage">-{enemyDamage}</div>}
          </div>

          <div className="battle-vs">VS</div>

          <div className="combatant enemy-combatant">
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
          <div ref={logEndRef} />
        </div>


        {battleFinished && result && (
          <div className={`combat-result ${result.type}`}>
            <h3>{result.title}</h3>
            <p>{result.message}</p>
          </div>
        )}

        <div className="combat-modal-buttons">
          {battleFinished && showRetryButton && (
            <button className="retry-button" onClick={onRetry}>
              Lutar Novamente
            </button>
          )}
          <button className="close-modal-button" onClick={onClose}>
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}