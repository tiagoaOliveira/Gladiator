import React from 'react';
import { useGame } from '../context/GameContext';
import './Character.css';
import character from '../assets/images/gladiator.jpg';

export default function Character() {
  const { player, updatePlayer, showNotification, resetStats } = useGame();

  if (!player) return <p>Carregando...</p>;

  const handleStatIncrease = (statName) => {
    if (player.attributePoints <= 0) {
      showNotification("Você não tem pontos de atributo disponíveis!", "error");
      return;
    }

    const updatedStats = { attributePoints: player.attributePoints - 1 };

    switch (statName) {
      case 'attack':
        updatedStats.attack = player.attack + 2;
        break;
      case 'physicalDefense':
        updatedStats.physicalDefense = player.physicalDefense + 2;
        break;
      case 'maxHp':
        updatedStats.maxHp = player.maxHp + 10;
        updatedStats.hp = player.hp + 10;
        break;
      case 'critChance':
        updatedStats.critChance = player.critChance + 1;
        break;
      case 'attackSpeed':
        // Limitar a velocidade de ataque a 2
        const newAttackSpeed = (player.attackSpeed + 0.1).toFixed(2);
        updatedStats.attackSpeed = Math.min(2, parseFloat(newAttackSpeed));

        // Verificar se já está no limite e notificar o jogador
        if (player.attackSpeed >= 1.9) {
          showNotification("Velocidade de ataque máxima atingida!", "info");
        }
        break;
      default:
        return;
    }

    updatePlayer(updatedStats);
  };

  // Novo cálculo de redução de dano: cada ponto de defesa reduz 0,1% do dano
  const damageReduction = Math.min(30, (player.physicalDefense * 0.1).toFixed(1));

  return (
    <div className="character-container">
      <div className="character-header">
        <h1>{player.name}</h1>
        <p className="level-display">Nível: {player.level}</p>
        <p className="points-display">Pontos de Atributo: {player.attributePoints || 0}</p>
      </div>

      <div className="character-content">
        <div className="character-stats">

          {/* HP */}
          <div className="stat-block">
            <div className="stat-bar-wrapper">
              <div className="stat-header">
                <h3>HP</h3>
              </div>
              <div className="stat-bar">
                <div className="stat-fill" style={{ width: `${(player.hp / player.maxHp) * 100}%`, backgroundColor: "#f44336" }}></div>
                <div className="stat-value-inside">{player.hp} / {player.maxHp}</div>
              </div>
              <button className="increase-stat-text-btn" onClick={() => handleStatIncrease('maxHp')} disabled={player.attributePoints <= 0}>+</button>
            </div>
          </div>

          {/* Ataque */}
          <div className="stat-block">
            <div className="stat-bar-wrapper">
              <div className="stat-header">
                <h3>
                  Ataque
                </h3>
              </div>
              <div className="stat-bar">
                <div className="stat-fill attack-fill" style={{ width: `${Math.min(100, player.attack / 2)}%` }}></div>
                <div className="stat-value-inside">{player.attack}</div>
              </div>
              <button
                className="increase-stat-text-btn"
                onClick={() => handleStatIncrease('attack')}
                disabled={player.attributePoints <= 0}
                title="Aumentar ataque"
              >
                ＋
              </button>
            </div>
          </div>

          {/* Defesa */}
          <div className="stat-block">
            <div className="stat-bar-wrapper">
              <div className="stat-header">
                <h3>
                  Defesa
                  <span className="info-tooltip" data-tooltip="Reduz 0,1% do dano por ponto, máximo de 30%.">ⓘ</span>
                </h3>
              </div>
              <div className="stat-bar">
                <div className="stat-fill defense-fill" style={{ width: `${Math.min(100, player.physicalDefense / 3)}%` }}></div>
                <div className="stat-value-inside">{player.physicalDefense}</div>
              </div>
              <button
                className="increase-stat-text-btn"
                onClick={() => handleStatIncrease('physicalDefense')}
                disabled={player.attributePoints <= 0}
                title="Aumentar defesa"
              >
                ＋
              </button>
            </div>
          </div>

          {/* Chance Crítica */}
          <div className="stat-block">
            <div className="stat-bar-wrapper">
              <div className="stat-header">
                <h3>Crítico
                  <span className="info-tooltip" data-tooltip="Causa o dobro do valor de ataque.">ⓘ
                  </span>
                </h3>
              </div>
              <div className="stat-bar">
                <div className="stat-fill crit-fill" style={{ width: `${Math.min(100, player.critChance)}%` }}></div>
                <div className="stat-value-inside">{player.critChance?.toFixed(1)}%</div>
              </div>
              <button className="increase-stat-text-btn" onClick={() => handleStatIncrease('critChance')} disabled={player.attributePoints <= 0}>+</button>
            </div>
          </div>

          {/* Velocidade de Ataque */}
          <div className="stat-block">
            <div className="stat-bar-wrapper">
              <div className="stat-header">
                <h3>Vel. Ataq</h3>
              </div>
              <div className="stat-bar">
                <div className="stat-fill speed-fill" style={{ width: `${Math.min(100, player.attackSpeed * 50)}%` }}></div>
                <div className="stat-value-inside">{player.attackSpeed?.toFixed(2)}</div>
              </div>
              <button
                className="increase-stat-text-btn"
                onClick={() => handleStatIncrease('attackSpeed')}
                disabled={player.attributePoints <= 0 || player.attackSpeed >= 2}
              >+</button>
            </div>
          </div>

          {/*resetStats */}
          <div className="reset-button-wrapper">
            <button
              onClick={resetStats}
              className="reset-button"
              disabled={player.attributePoints === 3 * player.level}
            >
              Reset
            </button>
          </div>



        </div>

        <div className="character-visual">
          <img className="player-img" src={character} alt="Gladiador" />
          <div className="character-description">
            <p>Um poderoso gladiador, treinado nas artes do combate.</p>
            <p>Aprimorando suas habilidades a cada batalha!</p>
          </div>
        </div>
      </div>
    </div>
  );
}