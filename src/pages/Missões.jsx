import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import './Missões.css';

// Definindo as missões disponíveis
const availableMissions = [
  {
    id: 1,
    title: "Caçador de Goblins",
    description: "Derrote 50 Goblins na arena",
    target: "Goblin",
    targetCount: 50,
    rewards: {
      xp: 5000,
      gold: 2500
    },
    difficulty: "Fácil",
    icon: "🏹"
  },
  {
    id: 2,
    title: "Exterminador de Orcs",
    description: "Derrote 20 Orcs Guerreiros",
    target: "Orc Guerreiro",
    targetCount: 20,
    rewards: {
      xp: 8000,
      gold: 4000
    },
    difficulty: "Médio",
    icon: "⚔️"
  },
  {
    id: 3,
    title: "Domador de Trolls",
    description: "Derrote 10 Trolls das Cavernas",
    target: "Troll das Cavernas",
    targetCount: 10,
    rewards: {
      xp: 12000,
      gold: 6000
    },
    difficulty: "Difícil",
    icon: "🛡️"
  },
  {
    id: 4,
    title: "Caçador de Dragões",
    description: "Derrote 5 Dragões Vermelhos",
    target: "Dragão Vermelho",
    targetCount: 5,
    rewards: {
      xp: 20000,
      gold: 10000
    },
    difficulty: "Extremo",
    icon: "🐉"
  },
  {
    id: 5,
    title: "Assassino de Esqueletos",
    description: "Derrote 30 Esqueletos Guerreiros",
    target: "Esqueleto Guerreiro",
    targetCount: 30,
    rewards: {
      xp: 6000,
      gold: 3000
    },
    difficulty: "Médio",
    icon: "💀"
  },
  {
    id: 6,
    title: "Conquistador do Minotauro",
    description: "Derrote 8 Minotauros",
    target: "Minotauro",
    targetCount: 8,
    rewards: {
      xp: 15000,
      gold: 7500
    },
    difficulty: "Difícil",
    icon: "🐂"
  },
  {
    id: 7,
    title: "Sobrevivente Iniciante",
    description: "Vença 100 batalhas na arena",
    target: "any",
    targetCount: 100,
    rewards: {
      xp: 3000,
      gold: 1500
    },
    difficulty: "Fácil",
    icon: "🏆"
  },
  {
    id: 8,
    title: "Gladiador Veterano",
    description: "Vença 500 batalhas na arena",
    target: "any",
    targetCount: 500,
    rewards: {
      xp: 25000,
      gold: 15000
    },
    difficulty: "Extremo",
    icon: "👑"
  }
];

export default function Missões() {
  const { player, updatePlayer, showNotification } = useGame();
  const [playerMissions, setPlayerMissions] = useState({});
  const [activeMissions, setActiveMissions] = useState([]);

  // Carregar progresso das missões do localStorage
  useEffect(() => {
    if (player) {
      const savedMissions = localStorage.getItem(`gladiator_missions_${player.id}`);
      if (savedMissions) {
        const missions = JSON.parse(savedMissions);
        setPlayerMissions(missions);
        
        // Filtrar missões ativas (não completadas)
        const active = availableMissions.filter(mission => {
          const progress = missions[mission.id] || { progress: 0, completed: false };
          return !progress.completed;
        });
        setActiveMissions(active);
      } else {
        // Primeira vez - inicializar todas as missões
        const initialMissions = {};
        availableMissions.forEach(mission => {
          initialMissions[mission.id] = { progress: 0, completed: false };
        });
        setPlayerMissions(initialMissions);
        setActiveMissions(availableMissions);
      }
    }
  }, [player]);

  // Salvar progresso no localStorage
  const saveMissions = (missions) => {
    if (player) {
      localStorage.setItem(`gladiator_missions_${player.id}`, JSON.stringify(missions));
    }
  };

  // Simular progresso das missões (esta função seria chamada após batalhas)
  const updateMissionProgress = (enemyName, isVictory) => {
    if (!isVictory) return;

    const updatedMissions = { ...playerMissions };
    let hasUpdates = false;

    availableMissions.forEach(mission => {
      if (updatedMissions[mission.id]?.completed) return;

      // Verificar se a missão se aplica à batalha
      const applies = mission.target === "any" || mission.target === enemyName;
      
      if (applies) {
        if (!updatedMissions[mission.id]) {
          updatedMissions[mission.id] = { progress: 0, completed: false };
        }
        
        updatedMissions[mission.id].progress += 1;
        hasUpdates = true;

        // Verificar se a missão foi completada
        if (updatedMissions[mission.id].progress >= mission.targetCount) {
          updatedMissions[mission.id].completed = true;
          showNotification(`Missão "${mission.title}" completada!`, 'success');
        }
      }
    });

    if (hasUpdates) {
      setPlayerMissions(updatedMissions);
      saveMissions(updatedMissions);
      
      // Atualizar lista de missões ativas
      const active = availableMissions.filter(mission => !updatedMissions[mission.id]?.completed);
      setActiveMissions(active);
    }
  };

  // Coletar recompensa da missão
  const claimReward = (mission) => {
    const missionProgress = playerMissions[mission.id];
    if (!missionProgress?.completed) return;

    // Dar recompensas ao jogador
    updatePlayer({
      xp: player.xp + mission.rewards.xp,
      gold: player.gold + mission.rewards.gold
    });

    // Marcar missão como reivindicada
    const updatedMissions = { ...playerMissions };
    updatedMissions[mission.id].claimed = true;
    setPlayerMissions(updatedMissions);
    saveMissions(updatedMissions);

    // Remover da lista de missões ativas
    const active = activeMissions.filter(m => m.id !== mission.id);
    setActiveMissions(active);

    showNotification(
      `Recompensa coletada: +${mission.rewards.xp} XP, +${mission.rewards.gold} Ouro!`, 
      'success'
    );
  };

  // Função para obter a cor da dificuldade
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Fácil": return "#4caf50";
      case "Médio": return "#ff9800";
      case "Difícil": return "#f44336";
      case "Extremo": return "#9c27b0";
      default: return "#757575";
    }
  };

  // Função para calcular a porcentagem de progresso
  const getProgressPercentage = (mission) => {
    const progress = playerMissions[mission.id]?.progress || 0;
    return Math.min((progress / mission.targetCount) * 100, 100);
  };

  if (!player) return <p>Carregando...</p>;

  return (
    <div className="missions-container">
      <div className="missions-header">
        <h1>📜 Missões</h1>
        <p>Complete missões para ganhar XP e ouro extra!</p>
      </div>

      <div className="missions-grid">
        {activeMissions.map(mission => {
          const missionProgress = playerMissions[mission.id] || { progress: 0, completed: false };
          const isCompleted = missionProgress.completed;
          const isClaimed = missionProgress.claimed;
          const progressPercentage = getProgressPercentage(mission);

          return (
            <div 
              key={mission.id} 
              className={`mission-card ${isCompleted ? 'completed' : ''} ${isClaimed ? 'claimed' : ''}`}
            >
              <div className="mission-header">
                <div className="mission-icon">{mission.icon}</div>
                <div className="mission-title-section">
                  <h3>{mission.title}</h3>
                  <span 
                    className="mission-difficulty"
                    style={{ backgroundColor: getDifficultyColor(mission.difficulty) }}
                  >
                    {mission.difficulty}
                  </span>
                </div>
              </div>

              <div className="mission-description">
                <p>{mission.description}</p>
              </div>

              <div className="mission-progress">
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  {missionProgress.progress} / {mission.targetCount}
                </div>
              </div>

              <div className="mission-rewards">
                <h4>Recompensas:</h4>
                <div className="rewards-list">
                  <span className="reward-item">🌟 {mission.rewards.xp} XP</span>
                  <span className="reward-item">💰 {mission.rewards.gold} Ouro</span>
                </div>
              </div>

              {isCompleted && !isClaimed && (
                <button 
                  className="claim-button"
                  onClick={() => claimReward(mission)}
                >
                  Coletar Recompensa
                </button>
              )}

              {isClaimed && (
                <div className="claimed-badge">
                  ✅ Recompensa Coletada
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeMissions.length === 0 && (
        <div className="no-missions">
          <h2>🎉 Parabéns!</h2>
          <p>Você completou todas as missões disponíveis!</p>
        </div>
      )}

      <div className="missions-footer">
        <p>💡 Dica: Vença batalhas na arena para progredir nas missões!</p>
      </div>
    </div>
  );
}