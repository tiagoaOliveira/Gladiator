import React from 'react';
import { useGame } from '../context/GameContext';
import './Character.css';
import character from '../assets/images/gladiator.jpg';

export default function Character() {
  const { player, updatePlayer, showNotification, resetStats } = useGame();

  if (!player) return <p>Carregando...</p>;

  // Função para aumentar atributos (flexível para 1x ou 10x)
  const handleStatIncrease = (statName, amount = 1) => {
    // Verificar pontos disponíveis
    if (player.attributePoints < amount) {
      showNotification(`Você precisa de ${amount} pontos de atributo disponíveis!`, "error");
      return;
    }

    const updatedStats = { attributePoints: player.attributePoints - amount };

    switch (statName) {
      case 'attack':
        updatedStats.attack = player.attack + (2 * amount);
        break;
      case 'physicalDefense':
        updatedStats.physicalDefense = player.physicalDefense + (5 * amount);
        break;
      case 'maxHp':
        updatedStats.maxHp = player.maxHp + (10 * amount);
        updatedStats.hp = player.hp + (10 * amount);
        break;
      case 'critChance':
        updatedStats.critChance = player.critChance + (1 * amount);
        break;
      case 'attackSpeed':
        // Calcular nova velocidade de ataque
        let newAttackSpeed = player.attackSpeed;
        let pointsUsed = 0;
        
        for (let i = 0; i < amount; i++) {
          const maxSpeed = player.speedBoost ? 4 : 3;
          
          if (newAttackSpeed >= maxSpeed) {
            showNotification("Velocidade de ataque máxima atingida!", "info");
            break;
          }
          
          newAttackSpeed += 0.1;
          pointsUsed++;
          
          // Se atingir o limite máximo, interrompe o loop
          if (newAttackSpeed >= maxSpeed) {
            newAttackSpeed = maxSpeed;
            showNotification("Velocidade de ataque máxima atingida!", "info");
            break;
          }
        }

        // Retornar os pontos não usados
        updatedStats.attributePoints = player.attributePoints - pointsUsed;
        updatedStats.attackSpeed = parseFloat(newAttackSpeed.toFixed(2));
        break;
      default:
        return;
    }

    updatePlayer(updatedStats);
  };

  const buyPower = (powerName, cost) => {
    if (player.attributePoints < cost) {
      showNotification(`Você precisa de ${cost} pontos!`, "error");
      return;
    }

    const updates = { attributePoints: player.attributePoints - cost };

    switch (powerName) {
      case 'reflect':
        if (player.reflect) {
          showNotification("Você já possui este poder!", "error");
          return;
        }
        updates.reflect = true;
        break;
      case 'criticalX3':
        if (player.criticalX3) {
          showNotification("Você já possui este poder!", "error");
          return;
        }
        updates.criticalX3 = true;
        break;
      case 'speedBoost':
        if (player.speedBoost) {
          showNotification("Você já possui este poder!", "error");
          return;
        }
        updates.speedBoost = true;
        updates.attackSpeed = Math.min(4, player.attackSpeed + 1);
        break;
    }

    updatePlayer(updates);
  };

  // Novo cálculo de redução de dano: cada ponto de defesa reduz 0,1% do dano
  const damageReduction = Math.min(30, (player.physicalDefense * 0.1).toFixed(1));

  return (
    <div className="character-container">
      <div className="character-header">
        <h1>{player.name}</h1>
        <p className="level-display">Nível: {player.level}</p>
        <div className="character-visual">
          <img className="player-img" src={character} alt="Gladiador" />
          <div className="character-description">
          </div>
        </div>
      </div>

      <div className="character-content">
        <div className="character-stats">
          <p className="points-display">Pontos de Atributo: {player.attributePoints || 0}</p>

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
              <div className="stat-buttons">
                <button
                  className="increase-stat-btn btn-1x"
                  onClick={() => handleStatIncrease('maxHp', 1)}
                  disabled={player.attributePoints < 1}
                  title="Aumentar 1 ponto"
                >
                  1x
                </button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('maxHp', 10)}
                  disabled={player.attributePoints < 10}
                  title="Aumentar 10 pontos"
                >
                  10x
                </button>
              </div>
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
              <div className="stat-buttons">
                <button
                  className="increase-stat-btn btn-1x"
                  onClick={() => handleStatIncrease('attack', 1)}
                  disabled={player.attributePoints < 1}
                  title="Aumentar 1 ponto"
                >
                  1x
                </button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('attack', 10)}
                  disabled={player.attributePoints < 10}
                  title="Aumentar 10 pontos"
                >
                  10x
                </button>
              </div>
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
              <div className="stat-buttons">
                <button
                  className="increase-stat-btn btn-1x"
                  onClick={() => handleStatIncrease('physicalDefense', 1)}
                  disabled={player.attributePoints < 1}
                  title="Aumentar 1 ponto"
                >
                  1x
                </button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('physicalDefense', 10)}
                  disabled={player.attributePoints < 10}
                  title="Aumentar 10 pontos"
                >
                  10x
                </button>
              </div>
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
              <div className="stat-buttons">
                <button
                  className="increase-stat-btn btn-1x"
                  onClick={() => handleStatIncrease('critChance', 1)}
                  disabled={player.attributePoints < 1}
                  title="Aumentar 1 ponto"
                >
                  1x
                </button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('critChance', 10)}
                  disabled={player.attributePoints < 10}
                  title="Aumentar 10 pontos"
                >
                  10x
                </button>
              </div>
            </div>
          </div>

          {/* Velocidade de Ataque */}
          <div className="stat-block">
            <div className="stat-bar-wrapper">
              <div className="stat-header">
                <h3>Vel. Ataq</h3>
              </div>
              <div className="stat-bar">
                <div className="stat-fill speed-fill" style={{ width: `${Math.min(100, player.attackSpeed * 33.33)}%` }}></div>
                <div className="stat-value-inside">{player.attackSpeed?.toFixed(2)}</div>
              </div>
              <div className="stat-buttons">
                <button
                  className="increase-stat-btn btn-1x"
                  onClick={() => handleStatIncrease('attackSpeed', 1)}
                  disabled={player.attributePoints < 1 || player.attackSpeed >= (player.speedBoost ? 4 : 3)}
                  title="Aumentar 1 ponto"
                >
                  1x
                </button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('attackSpeed', 10)}
                  disabled={player.attributePoints < 10 || player.attackSpeed >= (player.speedBoost ? 4 : 3)}
                  title="Aumentar 10 pontos"
                >
                  10x
                </button>
              </div>
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
        <div>
          <div className="powers-section">
            <h2>Poderes Especiais</h2>

            <button
              onClick={() => buyPower('reflect', 50)}
              disabled={player.reflect || player.attributePoints < 50}
              className={`power-btn ${player.reflect ? 'owned' : ''}`}
            >
              Reflect {player.reflect ? '✓' : `(50 pts)`}
            </button>

            <button
              onClick={() => buyPower('criticalX3', 75)}
              disabled={player.criticalX3 || player.attributePoints < 75}
              className={`power-btn ${player.criticalX3 ? 'owned' : ''}`}
            >
              Crítico x3 {player.criticalX3 ? '✓' : `(75 pts)`}
            </button>

            <button
              onClick={() => buyPower('speedBoost', 100)}
              disabled={player.speedBoost || player.attributePoints < 100}
              className={`power-btn ${player.speedBoost ? 'owned' : ''}`}
            >
              +1 Velocidade {player.speedBoost ? '✓' : `(100 pts)`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}