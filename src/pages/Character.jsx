import React from 'react';
import { useGame } from '../context/GameContext';
import './Character.css';
import character from '../assets/images/gladiator.jpg';

export default function Character() {
  const { player, updatePlayer, showNotification, resetStats } = useGame();

  if (!player) return <p>Carregando...</p>;

  // ─── Função para aumentar atributos ───
  const handleStatIncrease = (statName, amount = 1) => {
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
      case 'attackSpeed': {
        const maxSpeed = player.speedBoost ? 3.5 : 3;
        // Converter valores para centésimos (evitar problemas de ponto flutuante)
        const maxSpeedCents = maxSpeed * 100;
        const velocidadeAtualCents = Math.round(player.attackSpeed * 100);

        if (velocidadeAtualCents >= maxSpeedCents) {
          showNotification("Velocidade de ataque máxima atingida!", "info");
          return;
        }

        // Calcular espaço restante em centésimos
        const espacoRestanteCents = maxSpeedCents - velocidadeAtualCents;
        const pontosMaximosPossiveis = Math.floor(espacoRestanteCents / 5); // Cada ponto = 0.05 (5 centésimos)

        if (pontosMaximosPossiveis <= 0) {
          showNotification("Velocidade de ataque máxima atingida!", "info");
          return;
        }

        const pontosParaGastar = Math.min(amount, pontosMaximosPossiveis);

        // Calcular nova velocidade em centésimos
        const novaVelocidadeCents = velocidadeAtualCents + (pontosParaGastar * 5);
        let novaVelocidade = novaVelocidadeCents / 100;

        // Garantir que não ultrapasse o máximo
        if (novaVelocidade > maxSpeed) novaVelocidade = maxSpeed;

        updatedStats.attackSpeed = Number(novaVelocidade.toFixed(2));
        updatedStats.attributePoints = player.attributePoints - pontosParaGastar;
        break;
      }


      default:
        return;
    }

    updatePlayer(updatedStats);
  };

  const selectPower = (powerName) => {
    // Se já está selecionado, não faz nada
    if (player[powerName]) return;

    // Inicializa estado base
    const updates = {
      reflect: false,
      criticalX3: false,
      speedBoost: false,
    };

    const velocidadeAtual = Number(player.attackSpeed);
    const tinhaSpeedBoost = player.speedBoost;

    // Marca o novo poder selecionado
    updates[powerName] = true;

    // Lógica específica para speedBoost
    if (powerName === 'speedBoost') {
      // Ativando speedBoost: +0.5 velocidade (máx 3.5)
      updates.attackSpeed = Math.min(velocidadeAtual + 0.5, 4);
    } else if (tinhaSpeedBoost) {
      // Desativando speedBoost: -0.5 velocidade, mas respeita o novo máximo (3)
      const novaVelocidade = velocidadeAtual - 0.5;
      updates.attackSpeed = Math.min(Math.max(novaVelocidade, 1), 3);
    }

    updatePlayer(updates);
  };

  // ─── Cálculos do teto e do percentual para a barra de velocidade ───
  const maxSpeed = player.speedBoost ? 3.5 : 3;
  const velocidadeAtual = Number(player.attackSpeed);
  const speedPercent = Math.min((velocidadeAtual / maxSpeed) * 100, 100);
  const isSpeedMaxed = velocidadeAtual >= maxSpeed;

  // ─── HTML/JSX do componente ───────────────────────────────────────────────────────────────
  return (
    <div className="character-container">
      <div className="character-header">
        <h1>{player.name}</h1>
        <p className="level-display">Nível: {player.level}</p>
        <div className="character-visual">
          <img className="player-img" src={character} alt="Gladiador" />
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
                <div
                  className="stat-fill"
                  style={{
                    width: `${(player.hp / player.maxHp) * 100}%`,
                    backgroundColor: "#f44336"
                  }}
                ></div>
                <div className="stat-value-inside">{player.hp} / {player.maxHp}</div>
              </div>
              <div className="stat-buttons">
                <button
                  className="increase-stat-btn btn-1x"
                  onClick={() => handleStatIncrease('maxHp', 1)}
                  disabled={player.attributePoints < 1}
                  title="Aumentar 1 ponto"
                >1x</button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('maxHp', 10)}
                  disabled={player.attributePoints < 10}
                  title="Aumentar 10 pontos"
                >10x</button>
              </div>
            </div>
          </div>

          {/* Ataque */}
          <div className="stat-block">
            <div className="stat-bar-wrapper">
              <div className="stat-header">
                <h3>Ataque</h3>
              </div>
              <div className="stat-bar">
                <div
                  className="stat-fill attack-fill"
                  style={{ width: `${Math.min(100, player.attack / 2)}%` }}
                ></div>
                <div className="stat-value-inside">{player.attack}</div>
              </div>
              <div className="stat-buttons">
                <button
                  className="increase-stat-btn btn-1x"
                  onClick={() => handleStatIncrease('attack', 1)}
                  disabled={player.attributePoints < 1}
                  title="Aumentar 1 ponto"
                >1x</button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('attack', 10)}
                  disabled={player.attributePoints < 10}
                  title="Aumentar 10 pontos"
                >10x</button>
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
                <div
                  className="stat-fill defense-fill"
                  style={{ width: `${Math.min(100, player.physicalDefense / 3)}%` }}
                ></div>
                <div className="stat-value-inside">{player.physicalDefense}</div>
              </div>
              <div className="stat-buttons">
                <button
                  className="increase-stat-btn btn-1x"
                  onClick={() => handleStatIncrease('physicalDefense', 1)}
                  disabled={player.attributePoints < 1}
                  title="Aumentar 1 ponto"
                >1x</button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('physicalDefense', 10)}
                  disabled={player.attributePoints < 10}
                  title="Aumentar 10 pontos"
                >10x</button>
              </div>
            </div>
          </div>

          {/* Chance Crítica */}
          <div className="stat-block">
            <div className="stat-bar-wrapper">
              <div className="stat-header">
                <h3>
                  Crítico
                  <span className="info-tooltip" data-tooltip="Causa o dobro do valor de ataque.">ⓘ</span>
                </h3>
              </div>
              <div className="stat-bar">
                <div
                  className="stat-fill crit-fill"
                  style={{ width: `${Math.min(100, player.critChance)}%` }}
                ></div>
                <div className="stat-value-inside">{player.critChance?.toFixed(1)}%</div>
              </div>
              <div className="stat-buttons">
                <button
                  className="increase-stat-btn btn-1x"
                  onClick={() => handleStatIncrease('critChance', 1)}
                  disabled={player.attributePoints < 1}
                  title="Aumentar 1 ponto"
                >1x</button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('critChance', 10)}
                  disabled={player.attributePoints < 10}
                  title="Aumentar 10 pontos"
                >10x</button>
              </div>
            </div>
          </div>

          {/* Velocidade de Ataque */}
          <div className="stat-block">
            <div className="stat-bar-wrapper">
              <div className="stat-header">
                <h3>
                  Vel. Ataq {isSpeedMaxed && <span style={{ color: '#ffd700' }}>(MAX)</span>}
                </h3>
              </div>
              <div className="stat-bar">
                <div
                  className="stat-fill speed-fill"
                  style={{ width: `${speedPercent}%` }}
                ></div>
                <div className="stat-value-inside">
                  {velocidadeAtual.toFixed(2)}
                </div>
              </div>
              <div className="stat-buttons">
                <button
                  className="increase-stat-btn btn-1x"
                  onClick={() => handleStatIncrease('attackSpeed', 1)}
                  disabled={player.attributePoints < 1 || isSpeedMaxed}
                  title="Aumentar 1 ponto"
                >1x</button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('attackSpeed', 10)}
                  disabled={player.attributePoints < 10 || isSpeedMaxed}
                  title="Aumentar 10 pontos"
                >10x</button>
              </div>
            </div>
          </div>

          {/* Botão de reset de atributos */}
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

        {/* ─── Seção de Poderes ──────────────────────────────────────────────────────────── */}
        <div className="powers-section">
          <h2>Poderes Especiais</h2>

          <button
            onClick={() => selectPower('reflect')}
            className={`power-btn ${player.reflect ? 'owned' : ''}`}
          >
            20% Reflect {player.reflect ? '✓' : ''}
          </button>

          <button
            onClick={() => selectPower('criticalX3')}
            className={`power-btn ${player.criticalX3 ? 'owned' : ''}`}
          >
            Dano Crítico x3 {player.criticalX3 ? '✓' : ''}
          </button>

          <button
            onClick={() => selectPower('speedBoost')}
            className={`power-btn ${player.speedBoost ? 'owned' : ''}`}
          >
            +0.5 Velocidade {player.speedBoost ? '✓' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}