import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { enemies } from '../utils/enemies';
import CombatModal from '../components/CombatModal';
import './Arena.css';

export default function Arena() {
  const { player, handleBattle, updatePlayer } = useGame();
  const [selectedEnemy, setSelectedEnemy] = useState(enemies[0]);
  const [showCombatModal, setShowCombatModal] = useState(false);
  const [combatLog, setCombatLog] = useState([]);
  const [combatResult, setCombatResult] = useState(null);
  const [autoBattleActive, setAutoBattleActive] = useState(false);
  const [autoBattleResults, setAutoBattleResults] = useState({
    battles: 0,
    totalXpGained: 0,
    totalGoldGained: 0,
    hpLost: 0,
    initialHp: 0
  });

  // Recuperar estado de auto-batalha do localStorage
  useEffect(() => {
    const savedAutoBattle = localStorage.getItem('gladiator_auto_battle');
    if (savedAutoBattle) {
      const autoBattleData = JSON.parse(savedAutoBattle);
      // Verificar se a auto-batalha ainda deve estar ativa
      if (autoBattleData.active && player) {
        setSelectedEnemy(enemies.find(e => e.id === autoBattleData.enemyId) || enemies[0]);
        setAutoBattleActive(true);
        setAutoBattleResults({
          battles: autoBattleData.battles || 0,
          totalXpGained: autoBattleData.totalXpGained || 0,
          totalGoldGained: autoBattleData.totalGoldGained || 0,
          hpLost: player.maxHp - player.hp,
          initialHp: autoBattleData.initialHp || player.maxHp
        });
      }
    }
  }, [player]);

  // Processar auto-batalha
  useEffect(() => {
    if (!autoBattleActive || !player) return;

    // Se o HP é 1 ou menor, encerrar auto-batalha
    if (player.hp <= 1) {
      endAutoBattle(true);
      return;
    }

    // Executar batalha automática a cada 2 segundos
    const autoBattleInterval = setInterval(() => {
      if (player.hp > 1) {
        processAutoBattle();
      } else {
        clearInterval(autoBattleInterval);
        endAutoBattle(true);
      }
    }, 1500);

    return () => clearInterval(autoBattleInterval);
  }, [autoBattleActive, player]);

  if (!player) return <p>Carregando...</p>;

  const startBattle = () => {
    const battleResult = handleBattle(selectedEnemy);
    setCombatLog(battleResult.combatLog);
    setCombatResult(battleResult.result);
    setShowCombatModal(true);
  };

  const retryBattle = () => {
    const battleResult = handleBattle(selectedEnemy);
    setCombatLog(battleResult.combatLog);
    setCombatResult(battleResult.result);
    setShowCombatModal(true);
  };

  // Iniciar batalha automática
  const startAutoBattle = () => {
    // Salvar HP inicial para calcular perda total
    const initialHp = player.hp;

    setAutoBattleActive(true);
    setAutoBattleResults({
      battles: 0,
      totalXpGained: 0,
      totalGoldGained: 0,
      hpLost: 0,
      initialHp: initialHp
    });

    // Salvar estado no localStorage
    localStorage.setItem('gladiator_auto_battle', JSON.stringify({
      active: true,
      enemyId: selectedEnemy.id,
      battles: 0,
      totalXpGained: 0,
      totalGoldGained: 0,
      initialHp: initialHp
    }));
  };

  // Processar uma batalha automática
  const processAutoBattle = () => {
    const battleResult = handleBattle(selectedEnemy);
    const success = battleResult.result.type === 'victory';

    // Calcular recompensas (apenas para vitórias)
    let xpGained = 0;
    let goldGained = 0;

    if (success) {
      xpGained = selectedEnemy.rewardXP;
      goldGained = Math.floor(selectedEnemy.level * 1 * selectedEnemy.rewardGoldMultiplier);
    }

    // Atualizar resultados acumulados
    const updatedResults = {
      battles: autoBattleResults.battles + 1,
      totalXpGained: autoBattleResults.totalXpGained + xpGained,
      totalGoldGained: autoBattleResults.totalGoldGained + goldGained,
      hpLost: autoBattleResults.initialHp - player.hp,
      initialHp: autoBattleResults.initialHp
    };

    setAutoBattleResults(updatedResults);

    // Atualizar localStorage
    localStorage.setItem('gladiator_auto_battle', JSON.stringify({
      active: true,
      enemyId: selectedEnemy.id,
      battles: updatedResults.battles,
      totalXpGained: updatedResults.totalXpGained,
      totalGoldGained: updatedResults.totalGoldGained,
      initialHp: updatedResults.initialHp
    }));

    // Se o HP ficar em 1 ou menos, encerrar auto-batalha
    if (player.hp <= 1) {
      endAutoBattle(true);
    }
  };

  // Encerrar batalha automática
  const endAutoBattle = (showResults = false) => {
    setAutoBattleActive(false);
    localStorage.removeItem('gladiator_auto_battle');

    if (showResults) {
      // Mostrar resultados no modal
      const summaryLog = [{
        type: 'system',
        message: `Batalha automática contra ${selectedEnemy.name} encerrada!`
      }];

      setCombatLog(summaryLog);
      setCombatResult({
        type: 'auto-battle',
        title: 'Relatório de Batalha Automática',
        message: `Batalhas: ${autoBattleResults.battles}, XP: ${autoBattleResults.totalXpGained}, Ouro: ${autoBattleResults.totalGoldGained}, HP Perdido: ${autoBattleResults.hpLost}`
      });
      setShowCombatModal(true);
    }
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
          <p>🎯 Velocidade: {selectedEnemy.attackSpeed}</p>
          <p>🌟XP: {selectedEnemy.rewardXP}</p>
          <p>💰Ouro: ~{Math.round(selectedEnemy.level * 0.8 * selectedEnemy.rewardGoldMultiplier)}</p>
        </div>

        <div className="enemy-visual">

          <img src={selectedEnemy.image} alt={selectedEnemy.name} className="enemy-image" />
        </div>
      </div>

      {autoBattleActive && (
        <div className="auto-battle-progress">
          <h3>Batalha Automática em Andamento</h3>
          <p>Batalhas: {autoBattleResults.battles} | XP: +{autoBattleResults.totalXpGained} | Ouro: +{autoBattleResults.totalGoldGained} | HP: -{autoBattleResults.hpLost}</p>
          <button onClick={() => endAutoBattle(true)} className="stop-auto-battle-button">
            Parar Batalha
          </button>
        </div>
      )}

      <div className="arena-actions">
        <button
          onClick={startBattle}
          className="battle-button"
          disabled={player.hp <= 0 || autoBattleActive}
        >
          Iniciar Batalha
        </button>

        <button
          onClick={startAutoBattle}
          className="auto-battle-button"
          disabled={player.hp <= 1 || autoBattleActive || !player.premium}
        >
          {!player.premium ? 'Premium Necessário' : 'Batalha Automática'}
        </button>
      </div>

      <CombatModal
        show={showCombatModal}
        onClose={() => setShowCombatModal(false)}
        combatLog={combatLog}
        result={combatResult}
        enemyImage={selectedEnemy.image}
        enemyName={selectedEnemy.name}
        onRetry={retryBattle}
        isAutoBattle={!!combatResult && combatResult.type === 'auto-battle'}
      />
    </div>
  );
}