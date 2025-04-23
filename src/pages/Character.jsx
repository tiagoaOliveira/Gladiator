import React from 'react';
import { useGame } from '../context/GameContext';
import ProgressBar from '../components/ProgressBar';
import './Character.css';

export default function Character() {
  const { player, levelUp } = useGame();

  if (!player) return <p>Carregando...</p>;

  const hpPercent = player.maxHp ? ((player.hp / player.maxHp) * 100).toFixed(1) : 100;

  return (
    <div className="character-container">
      <div className="character-content">
        <div className="character-stats">
          <h1>{player.name}</h1>
          <p>Nível: {player.level}</p>
          <p>❤️ HP: {player.hp} / {player.maxHp}</p>
          <p>🗡️ Ataque: {player.attack}</p>
          <p>🎯 Chance Crítica: {player.critChance?.toFixed(1)}%</p>
          <p>⚡ Velocidade de Ataque: {player.attackSpeed?.toFixed(2)}</p>
          <p>🛡️ Defesa Física: {player.physicalDefense}</p>
          <p>💰 Ouro: {player.gold}</p>
        </div>

        <div className="character-visual">
          <img className="player-img" src="/src/assets/images/gladiator.jpg" alt="Gladiador" />
          
          <div className="progress-section">
            <h3>Experiência</h3>
            <ProgressBar current={player.xp} max={player.xpToNextLevel} type="xp" />
            
            <h3>Saúde</h3>
            <ProgressBar current={player.hp} max={player.maxHp} type="hp" />
            
            {player.hp < player.maxHp && (
              <p className="hp-recovery-info">
                Recuperando 2% de HP por minuto ({Math.ceil(player.maxHp * 0.02)} HP)
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="character-actions">
        <button onClick={levelUp} className="action-button">Aumentar Nível (Teste)</button>
      </div>
    </div>
  );
}