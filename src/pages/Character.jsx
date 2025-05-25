import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import './Character.css';

// Tipos de personagem disponíveis
const characterTypes = [
  {
    id: 'gladiator',
    name: 'Gladiador',
    description: 'Um poderoso gladiador, treinado nas artes do combate. Equilibrado em todas as habilidades.',
    icon: '⚔️',
    specialty: 'Balanceado',
    maxAttackSpeed: 3,
    maxDefenseReduction: 30,
    critMultiplier: 2
  },
  {
    id: 'assassin',
    name: 'Assassino',
    description: 'Um ninja ágil e mortal, especialista em ataques rápidos e precisos. A velocidade é sua maior arma!',
    icon: '🗡️',
    specialty: 'Velocidade até 5.0',
    maxAttackSpeed: 5,
    maxDefenseReduction: 30,
    critMultiplier: 2
  },
  {
    id: 'guardian',
    name: 'Guardião',
    description: 'Um defensor resiliente, mestre na arte da proteção. Sua defesa é praticamente impenetrável!',
    icon: '🛡️',
    specialty: 'Defesa até 50%',
    maxAttackSpeed: 3,
    maxDefenseReduction: 50,
    critMultiplier: 2
  },
  {
    id: 'berserker',
    name: 'Berserker',
    description: 'Um guerreiro selvagem e implacável. Seus ataques críticos são devastadores!',
    icon: '🪓',
    specialty: 'Crítico x3',
    maxAttackSpeed: 3,
    maxDefenseReduction: 30,
    critMultiplier: 3
  }
];

export default function Character() {
  const { player, updatePlayer, showNotification, resetStats } = useGame();
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(0);
  const [showTitles, setShowTitles] = useState(false);

  const titles = Array.isArray(player?.titles) ? player.titles : [];


  // Sincronizar o índice selecionado com o personagem atual quando o componente carrega
  useEffect(() => {
    if (player && player.characterType) {
      const currentIndex = characterTypes.findIndex(char => char.id === player.characterType);
      if (currentIndex >= 0) {
        setSelectedCharacterIndex(currentIndex);
      }
    }
  }, [player]);

  if (!player) return <p>Carregando...</p>;

  // Encontrar o tipo atual do personagem ou usar o primeiro como padrão
  const currentCharacterType = player.characterType || 'gladiator';
  const currentCharacterIndex = characterTypes.findIndex(char => char.id === currentCharacterType);
  const currentCharacter = characterTypes[currentCharacterIndex >= 0 ? currentCharacterIndex : 0];

  // Navegação entre personagens
  const nextCharacter = () => {
    const nextIndex = (selectedCharacterIndex + 1) % characterTypes.length;
    setSelectedCharacterIndex(nextIndex);
  };

  const prevCharacter = () => {
    const prevIndex = selectedCharacterIndex === 0 ? characterTypes.length - 1 : selectedCharacterIndex - 1;
    setSelectedCharacterIndex(prevIndex);
  };

  // Trocar personagem
  const changeCharacter = async () => {
    const newCharacterType = characterTypes[selectedCharacterIndex];

    try {
      await updatePlayer({ characterType: newCharacterType.id });
      showNotification(`Você agora é um ${newCharacterType.name}!`, 'success');
    } catch (error) {
      console.error('Erro ao trocar personagem:', error);
      showNotification('Erro ao trocar personagem', 'error');
    }
  };

  // Função para aumentar atributos (flexível para 1x ou 10x)
  const handleStatIncrease = async (statName, amount = 1) => {
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
        // Usar o limite do personagem atual
        const maxSpeed = currentCharacter.maxAttackSpeed;

        let newAttackSpeed = player.attackSpeed;
        let pointsToUse = amount;

        for (let i = 0; i < amount; i++) {
          if (newAttackSpeed >= maxSpeed) {
            pointsToUse = i;
            break;
          }
          newAttackSpeed += 0.1;

          if (newAttackSpeed >= maxSpeed) {
            newAttackSpeed = maxSpeed;
            pointsToUse = i + 1;
            break;
          }
        }

        if (pointsToUse === 0 || newAttackSpeed === player.attackSpeed) {
          showNotification(`Velocidade de ataque máxima já atingida (${maxSpeed})!`, "info");
          return;
        }

        if (pointsToUse < amount) {
          showNotification(`Velocidade máxima atingida! Usados ${pointsToUse} pontos.`, "info");
        }

        updatedStats.attackSpeed = parseFloat(newAttackSpeed.toFixed(2));
        updatedStats.attributePoints = player.attributePoints - pointsToUse;
        break;
      default:
        return;
    }

    try {
      await updatePlayer(updatedStats);
    } catch (error) {
      console.error('Erro ao atualizar atributos:', error);
      showNotification('Erro ao atualizar atributos', 'error');
    }
  };

  // Calcular redução de dano baseada no limite do personagem
  const maxReduction = currentCharacter.maxDefenseReduction;
  const damageReduction = Math.min(maxReduction, (player.physicalDefense * 0.1).toFixed(1));

  return (
    <div className="character-container">
      <div className="character-header">
        <div className="titles-button-wrapper">
          <button
            className="titles-button"
            onClick={() => setShowTitles(v => !v)}
          >
            🎖 Títulos
          </button>
          {showTitles && (
            <ul className="titles-dropdown">
              {titles.length > 0
                ? titles.map((t, i) => <li key={i}>{t}</li>)
                : <li>(sem títulos ainda)</li>
              }
            </ul>

          )}
          <button
            onClick={async () => {
              const newTitles = [...titles, 'Título de Teste'];
              await updatePlayer({ titles: newTitles });
              showNotification('Título de Teste adicionado!', 'success');
            }}
            className="test-title-btn"
          >
            Adicionar Título de Teste
          </button>
        </div>
        <div className='name-level'>
          <p className="level-display">Nível: {player.level}</p>
          <h1>{player.name}</h1>
        </div>
        <p className="level-display">Tipo: {currentCharacter.name} {currentCharacter.icon}</p>
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
                  title="Aumentar 1 ponto (+10 HP)"
                >
                  1x
                </button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('maxHp', 10)}
                  disabled={player.attributePoints < 10}
                  title="Aumentar 10 pontos (+100 HP)"
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
                <h3>Ataque</h3>
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
                  title="Aumentar 1 ponto (+2 Ataque)"
                >
                  1x
                </button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('attack', 10)}
                  disabled={player.attributePoints < 10}
                  title="Aumentar 10 pontos (+20 Ataque)"
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
                  <span className="info-tooltip" data-tooltip={`Redução de dano Atual: ${damageReduction}%`}>ⓘ</span>
                </h3>
              </div>
              <div className="stat-bar">
                <div className="stat-fill defense-fill" style={{ width: `${Math.min(100, (player.physicalDefense / (maxReduction * 10)) * 100)}%` }}></div>
                <div className="stat-value-inside">{player.physicalDefense}</div>
              </div>
              <div className="stat-buttons">
                <button
                  className="increase-stat-btn btn-1x"
                  onClick={() => handleStatIncrease('physicalDefense', 1)}
                  disabled={player.attributePoints < 1}
                  title="Aumentar 1 ponto (+5 Defesa)"
                >
                  1x
                </button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('physicalDefense', 10)}
                  disabled={player.attributePoints < 10}
                  title="Aumentar 10 pontos (+50 Defesa)"
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
                <h3>
                  Crítico
                  <span className="info-tooltip" data-tooltip={`Causa ${currentCharacter.critMultiplier}x dano de ataque.`}>ⓘ</span>
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
                  title="Aumentar 1 ponto (+1% Crítico)"
                >
                  1x
                </button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('critChance', 10)}
                  disabled={player.attributePoints < 10}
                  title="Aumentar 10 pontos (+10% Crítico)"
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
                <h3>
                  Vel. Ataq
                  <span className="info-tooltip" data-tooltip={`Máximo: ${currentCharacter.maxAttackSpeed}`}>ⓘ</span>
                </h3>
              </div>
              <div className="stat-bar">
                <div className="stat-fill speed-fill" style={{ width: `${Math.min(100, (player.attackSpeed / currentCharacter.maxAttackSpeed) * 100)}%` }}></div>
                <div className="stat-value-inside">{player.attackSpeed?.toFixed(2)}</div>
              </div>
              <div className="stat-buttons">
                <button
                  className="increase-stat-btn btn-1x"
                  onClick={() => handleStatIncrease('attackSpeed', 1)}
                  disabled={player.attributePoints < 1 || player.attackSpeed >= currentCharacter.maxAttackSpeed}
                  title="Aumentar 1 ponto (+0.1 Velocidade)"
                >
                  1x
                </button>
                <button
                  className="increase-stat-btn btn-10x"
                  onClick={() => handleStatIncrease('attackSpeed', 10)}
                  disabled={player.attributePoints < 10 || player.attackSpeed >= currentCharacter.maxAttackSpeed}
                  title="Aumentar 10 pontos (+1.0 Velocidade)"
                >
                  10x
                </button>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="reset-button-wrapper">
            <button
              onClick={resetStats}
              className="reset-button"
              disabled={player.attributePoints === 3 * player.level}
            >
              Reset Atributos
            </button>
          </div>
        </div>

        {/* Character Selector */}
        <div className="character-visual">
          <div className="character-selector">
            <button className="character-nav-btn" onClick={prevCharacter}>
              ‹
            </button>

            <div className="character-display">
              <div className="character-icon">
                {characterTypes[selectedCharacterIndex].icon}
              </div>
              <h3>{characterTypes[selectedCharacterIndex].name}</h3>
              <p className="character-specialty">{characterTypes[selectedCharacterIndex].specialty}</p>

              {currentCharacter.id !== characterTypes[selectedCharacterIndex].id && (
                <button className="change-character-btn" onClick={changeCharacter}>
                  Escolher
                </button>
              )}

              {currentCharacter.id === characterTypes[selectedCharacterIndex].id && (
                <span className="current-character">Atual</span>
              )}
            </div>

            <button className="character-nav-btn" onClick={nextCharacter}>
              ›
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}