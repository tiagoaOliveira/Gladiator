import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { generatePlayerStats } from '../utils/player';
import NotificationDot from '../components/NotificationDot';
import './Character.css';

export default function Character() {
  const { player, updatePlayer, showNotification, resetStats } = useGame();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!player) return <p>Carregando...</p>;

  const isCritMaxed = player.critChance >= 100;
  const baseStats = generatePlayerStats(player.level);
  const defBase = baseStats.physicalDefense;
  const defComBonus = player.physicalDefense;
  const DEFENSE_MAX = 300;
  const isDefMaxed = defComBonus >= DEFENSE_MAX;

  // Verifica se há pontos de atributo disponíveis
  const hasAttributePoints = player.attributePoints > 0;

  // ─── Função para aumentar atributos ───
  const handleStatIncrease = (statName, amount = 1) => {
    if (player.attributePoints < amount) {
      showNotification(`Você precisa de ${amount} pontos de atributo disponíveis!`, "error");
      return;
    }

    const updatedStats = { attributePoints: player.attributePoints - amount };

    switch (statName) {
      case 'attack':
        updatedStats.attack = player.attack + (6 * amount);
        break;
      case 'physicalDefense':
        // Verificar se ainda pode aumentar (máximo é 300)
        if (player.physicalDefense >= DEFENSE_MAX) {
          showNotification("Defesa física já está no máximo (30% redução)!", "info");
          return;
        }

        // Calcular quantos pontos podem ser adicionados sem ultrapassar o máximo
        const espacoRestanteDefesa = DEFENSE_MAX - player.physicalDefense;
        const pontosParaAdicionarDefesa = Math.min(amount * 5, espacoRestanteDefesa);
        const pontosAtributoGastosDefesa = Math.ceil(pontosParaAdicionarDefesa / 5);

        updatedStats.physicalDefense = player.physicalDefense + pontosParaAdicionarDefesa;
        updatedStats.attributePoints = player.attributePoints - pontosAtributoGastosDefesa;
        break;
      case 'maxHp':
        updatedStats.maxHp = player.maxHp + (20 * amount);
        updatedStats.hp = player.hp + (20 * amount);
        break;
      case 'critChance':
        // Cada ponto equivale a +1% de crit. Não deixa ultrapassar 100%.
        const espacoRestante = 100 - player.critChance;
        // Se já estiver no teto, mostra notificação e sai
        if (espacoRestante <= 0) {
          showNotification("Chance crítica já está no máximo (100%)!", "info");
          return;
        }
        // Quantos pontos podem ser efetivamente gastos (1 ponto = 1%)
        const pontosMaximosPossiveis = Math.min(amount, Math.floor(espacoRestante));
        if (pontosMaximosPossiveis <= 0) {
          showNotification("Chance crítica já está no máximo (100%)!", "info");
          return;
        }
        updatedStats.critChance = player.critChance + pontosMaximosPossiveis;
        // Ajusta pontos de atributo gastos
        updatedStats.attributePoints = player.attributePoints - pontosMaximosPossiveis;
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

    // OK, o poder clicado NÃO está ativo; vamos ativá-lo e remover eventuais outros
    const tinhaCritical = player.criticalX3;
    const tinhaSpeedBoost = player.speedBoost;
    const tinhaReflect = player.reflect;

    // Começamos zerando todas as flags de poder
    const updates = {
      reflect: false,
      criticalX3: false,
      speedBoost: false,
    };

    // Ativa somente o clique atual
    updates[powerName] = true;

    // ─── Lógica para Critical X3 ───
    if (powerName === 'criticalX3') {
      // Ao ativar, soma 10% de critChance (até no máximo 100%)
      updates.critChance = Math.min(player.critChance + 10, 100);
    } else if (tinhaCritical) {
      // Se estava ativo e clicou em outro poder, remove os 10%
      const baseStats = generatePlayerStats(player.level);
      updates.critChance = baseStats.critChance;
    }

    // ─── Lógica para SpeedBoost ───
    if (powerName === 'speedBoost') {
      // Ao ativar, soma 0.5 ao attackSpeed (até teto 4)
      updates.attackSpeed = Math.min(player.attackSpeed + 0.5, 4);
    } else if (tinhaSpeedBoost) {
      // Se removeu o boost, subtrai 0.5 (mantendo ao menos 1)
      const novaVel = Math.max(player.attackSpeed - 0.5, 1);
      updates.attackSpeed = novaVel;
    }

    // ─── Lógica para Reflect ───
    if (powerName === 'reflect') {
      // Ao ativar, soma +50 de physicalDefense (máximo 300)
      updates.physicalDefense = Math.min(player.physicalDefense + 50, 300);
    } else if (tinhaReflect) {
      // Se removeu o reflect, subtrai 50 (mínimo é a defesa base)
      const baseStats = generatePlayerStats(player.level);
      const novaDefesa = Math.max(player.physicalDefense - 50, baseStats.physicalDefense);
      updates.physicalDefense = novaDefesa;
    }

    updatePlayer(updates);
  };

  // ─── Cálculos do teto e do percentual para a barra de velocidade ───
  const maxSpeed = player.speedBoost ? 3.5 : 3;
  const velocidadeAtual = Number(player.attackSpeed);
  const speedPercent = Math.min((velocidadeAtual / maxSpeed) * 100, 100);
  const isSpeedMaxed = velocidadeAtual >= maxSpeed;

  // ─── Função para abrir/fechar modal ───
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // ─── HTML/JSX do componente ───────────────────────────────────────────────────────────────
  return (
    <div className={`character-container ${player.reflect ? 'reflect-active' :
        player.criticalX3 ? 'critical-active' :
          player.speedBoost ? 'speed-active' : ''
      }`}>
      <div className="character-header">
        <h1>{player.name}</h1>
        <div>
        </div>

        {/* Botão para abrir o modal */}
        <button className="open-modal-btn" onClick={openModal}>
          📊 Atributos
          <NotificationDot show={hasAttributePoints} />
        </button>
        {/* ─── Seção de Poderes ─────────────────── */}
        <div className="powers-section">
          <button
            onClick={() => selectPower('reflect')}
            className={`power-btn ${player.reflect ? 'owned' : ''}`}
          >
            <div>
              <p>🛡️ Reflete dano </p>
              <p>+50 de defesa</p>
            </div>
          </button>

          <button
            onClick={() => selectPower('criticalX3')}
            className={`power-btn ${player.criticalX3 ? 'owned' : ''}`}
            disabled={player.critChance >= 100 && !player.criticalX3}
            title={player.critChance >= 100 && !player.criticalX3 ? "CritChance já em 100%" : ""}>
            <div>
              <p>💪 Dano Crítico x3</p>
              <p>+10% chance crítica</p>
            </div>
          </button>

          <button
            onClick={() => selectPower('speedBoost')}
            className={`power-btn ${player.speedBoost ? 'owned' : ''}`}>
            <div>
              <p>⚡ +0.5 Velocidade</p>
              <p>de Ataque</p>
            </div>
          </button>
        </div>
      </div>

      {/* Modal com poderes e atributos */}
      <div className='modal-body'>
        {isModalOpen && (
          <div className="modal-overlay-character" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Atributos</h2>
                <button className="close-modal-btn" onClick={closeModal} title="Fechar">
                  ×
                </button>
              </div>

              <div className="character-content">
                <div className="character-stats">
                  <p className="points-display">Pontos de Atributo: {player.attributePoints || 0}</p>

                  {/* HP */}
                  <div className="stat-block">
                    <div className="stat-bar-wrapper">
                      <div className="stat-header">
                        <h3>Vida</h3>
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
                          style={{ width: `${Math.min(100, player.attack / 8)}%` }}
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
                        <h3>Defesa
                        </h3>
                      </div>
                      <div className="stat-bar">
                        <div
                          className="stat-fill defense-fill"
                          style={{ width: `${Math.min(100, defComBonus / 3)}%` }}
                        ></div>
                        <div className="stat-value-inside">{player.physicalDefense}</div>
                      </div>
                      <div className="stat-buttons">
                        {!isDefMaxed ? (
                          <>
                            <button
                              className="increase-stat-btn btn-1x"
                              onClick={() => handleStatIncrease('physicalDefense', 1)}
                              disabled={player.attributePoints < 1}
                              title="Aumentar 1 ponto">
                              1x
                            </button>
                            <button
                              className="increase-stat-btn btn-10x"
                              onClick={() => handleStatIncrease('physicalDefense', 10)}
                              disabled={player.attributePoints < 10}
                              title="Aumentar 10 pontos">
                              10x
                            </button>
                          </>
                        ) : (
                          <span style={{ color: '#ffd700' }}>(MAX)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chance Crítica */}
                  <div className="stat-block">
                    <div className="stat-bar-wrapper">
                      <div className="stat-header">
                        <h3>
                          Crítico
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
                        {!isCritMaxed ? (
                          <>
                            <button
                              className="increase-stat-btn btn-1x"
                              onClick={() => handleStatIncrease('critChance', 1)}
                              disabled={player.attributePoints < 1}
                              title="Aumentar 1 ponto">
                              1x
                            </button>
                            <button
                              className="increase-stat-btn btn-10x"
                              onClick={() => handleStatIncrease('critChance', 10)}
                              disabled={player.attributePoints < 10}
                              title="Aumentar 10 pontos">
                              10x
                            </button>
                          </>
                        ) : (
                          <span style={{ color: '#ffd700' }}>(MAX)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Velocidade de Ataque */}
                  <div className="stat-block">
                    <div className="stat-bar-wrapper">
                      <div className="stat-header">
                        <h3>Speed</h3>
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
                        {!isSpeedMaxed ? (
                          <>
                            <button
                              className="increase-stat-btn btn-1x"
                              onClick={() => handleStatIncrease('attackSpeed', 1)}
                              disabled={player.attributePoints < 1}
                              title="Aumentar 1 ponto">
                              1x
                            </button>
                            <button
                              className="increase-stat-btn btn-10x"
                              onClick={() => handleStatIncrease('attackSpeed', 10)}
                              disabled={player.attributePoints < 10}
                              title="Aumentar 10 pontos">
                              10x
                            </button>
                          </>
                        ) : (
                          <span style={{ color: '#ffd700' }}>(MAX)</span>
                        )}
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
                      Reset Stats
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}