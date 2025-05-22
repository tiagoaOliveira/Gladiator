import React from 'react';
import { useGame } from '../context/GameContext';
import './Missoes.css';

export default function Missões() {
  const { 
    player, 
    playerMissions, 
    availableMissions, 
    claimMissionReward, 
    getActiveMissions, 
    getCompletedMissions 
  } = useGame();

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

  // Obter missões ativas do contexto
  const activeMissions = getActiveMissions();
  const completedMissions = getCompletedMissions();

  return (
    <div className="missions-container">
      <div className="missions-header">
        <h1>📜 Missões</h1>
        <p>Complete missões para ganhar XP e ouro extra!</p>
      </div>

      {/* Missões Completadas (prontas para coletar) */}
      {completedMissions.length > 0 && (
        <>
          <div className="missions-section">
            <h2 style={{ color: '#4caf50', marginBottom: '20px', textAlign: 'center' }}>
              🎯 Missões Completadas - Prontas para Coletar!
            </h2>
            <div className="missions-grid">
              {completedMissions.map(mission => {
                const missionProgress = playerMissions[mission.id] || { progress: 0, completed: false, claimed: false };
                const progressPercentage = getProgressPercentage(mission);

                return (
                  <div key={mission.id} className="mission-card completed">
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
                          className="progress-bar-missoes"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <div className="progress-text-missoes">
                        {missionProgress.progress} / {mission.targetCount} ✅
                      </div>
                    </div>

                    <div className="mission-rewards">
                      <h4>Recompensas:</h4>
                      <div className="rewards-list">
                        <span className="reward-item">🌟 {mission.rewards.xp} XP</span>
                        <span className="reward-item">💰 {mission.rewards.gold} Ouro</span>
                      </div>
                    </div>

                    <button 
                      className="claim-button"
                      onClick={() => claimMissionReward(mission.id)}
                    >
                      Coletar Recompensa
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Missões Ativas */}
      <div className="missions-section">
        <h2 style={{ color: '#ffc107', marginBottom: '20px', textAlign: 'center' }}>
          🎯 Missões Ativas
        </h2>
        <div className="missions-grid">
          {activeMissions.map(mission => {
            const missionProgress = playerMissions[mission.id] || { progress: 0, completed: false, claimed: false };
            const isCompleted = missionProgress.completed;
            const isClaimed = missionProgress.claimed;
            const progressPercentage = getProgressPercentage(mission);

            // Não mostrar missões já completadas na seção ativa
            if (isCompleted && !isClaimed) return null;
            if (isClaimed) return null;

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
                      className="progress-bar-missoes"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="progress-text-missoes">
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

                {/* Status da missão */}
                <div style={{ 
                  textAlign: 'center', 
                  padding: '10px', 
                  backgroundColor: '#2a1f16', 
                  borderRadius: '6px',
                  color: '#ffc107',
                  fontWeight: 'bold'
                }}>
                  {progressPercentage < 100 ? 
                    `${progressPercentage.toFixed(1)}% Completo` : 
                    'Pronto para coletar!'
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mensagem quando não há missões */}
      {activeMissions.length === 0 && completedMissions.length === 0 && (
        <div className="no-missions">
          <h2>🎉 Parabéns!</h2>
          <p>Você completou todas as missões disponíveis!</p>
        </div>
      )}

    </div>
  );
}