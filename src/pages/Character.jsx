import React from 'react';
import { useGame } from '../context/GameContext';
import ProgressBar from '../components/ProgressBar';
import './Character.css';
import character from '../assets/images/gladiator.jpg'

export default function Character() {
  const { player, levelUp } = useGame();

  if (!player) return <p>Carregando...</p>;

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
          <img className="player-img" src={character} alt="Gladiador" />
        </div>
      </div>

      <div className="character-actions">
        <button onClick={levelUp} className="action-button">Aumentar Nível (Teste)</button>
      </div>
      

    </div>
  );
}