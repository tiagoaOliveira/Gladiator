import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { enemies } from '../utils/enemies';
import CombatModal from '../components/CombatModal';
import './Arena.css';

export default function Arena() {
  const { player, handleBattle } = useGame();
  const [selectedEnemy, setSelectedEnemy] = useState(enemies[0]);
  const [showCombatModal, setShowCombatModal] = useState(false);
  const [combatLog, setCombatLog] = useState([]);
  const [combatResult, setCombatResult] = useState(null);
  
  if (!player) return <p>Carregando...</p>;

  const startBattle = () => {
    const battleResult = handleBattle(selectedEnemy);
    setCombatLog(battleResult.combatLog);
    setCombatResult(battleResult.result);
    setShowCombatModal(true);
  };

  return (
    <div className="arena-container">
      <div className="enemy-selector">
        <h2>Escolha seu Oponente</h2>
        <div className="enemy-list">
          {enemies.map(enemy => (
            <div 
              key={enemy.id} 
              className={`enemy-option ${selectedEnemy.id === enemy.id ? 'selected' : ''}`}
              onClick={() => setSelectedEnemy(enemy)}
            >
              <img src={enemy.image} alt={enemy.name} className="enemy-thumbnail" />
              <div className="enemy-option-info">
                <h3>{enemy.name}</h3>
                <p>Nível: {enemy.level}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="enemy-container">
        <div className="enemy-stats">
          <h2>{selectedEnemy.name}</h2>
          <p>Nível: {selectedEnemy.level}</p>
          <p>❤️ HP: {selectedEnemy.hp}</p>
          <p>🗡️ Ataque: {selectedEnemy.attack}</p>
          <p>🛡️ Defesa: {selectedEnemy.defense}</p>
          <p>⚡ Crítico: {selectedEnemy.critChance}%</p>
          <p>🎯 Vel. de Ataque: {selectedEnemy.attackSpeed}</p>
        </div>

        <div className="enemy-visual">
          <img src={selectedEnemy.image} alt={selectedEnemy.name} className="enemy-image" />
        </div>
      </div>

      <div className="enemy-rewards">
        <h3>Recompensas</h3>
        <p>🌟 XP: {selectedEnemy.rewardXP}</p>
        <p>💰 Ouro: ~{selectedEnemy.level * 10 * selectedEnemy.rewardGoldMultiplier}</p>
      </div>

      <div className="arena-actions">
        <button 
          onClick={startBattle} 
          className="battle-button" 
          disabled={player.hp <= 0}
        >
          Iniciar Batalha
        </button>
      </div>

      <CombatModal 
        show={showCombatModal} 
        onClose={() => setShowCombatModal(false)} 
        combatLog={combatLog}
        result={combatResult}
      />
    </div>
  );
}