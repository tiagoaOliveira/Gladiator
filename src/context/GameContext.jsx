import React, { createContext, useContext, useState, useEffect } from 'react';
import { generatePlayerStats } from '../utils/player';

// Create the context
const GameContext = createContext();

// Custom hook to use the game context
export const useGame = () => useContext(GameContext);

// Provider component
export function GameProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'info'
  });

  // Check for existing player in localStorage on startup
  useEffect(() => {
    const savedPlayer = localStorage.getItem('gladiator_player');
    if (savedPlayer) {
      setPlayer(JSON.parse(savedPlayer));
    }
  }, []);

  // Save player to localStorage when updated
  useEffect(() => {
    if (player) {
      localStorage.setItem('gladiator_player', JSON.stringify(player));
    }
  }, [player]);

  // Show notification with auto-hide
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });

    // Auto hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Create a new player
  const createPlayer = (name) => {
    const baseStats = generatePlayerStats(1);
    const newPlayer = {
      name,
      level: 1,
      xp: 0,
      gold: 50,
      hp: baseStats.hp,
      maxHp: baseStats.hp,
      attack: baseStats.attack,
      critChance: baseStats.critChance,
      attackSpeed: Math.min(2, baseStats.attackSpeed), // Limitar a velocidade de ataque a 2
      physicalDefense: baseStats.physicalDefense,
      magicPower: baseStats.magicPower,
      magicResistance: baseStats.magicResistance,
      xpToNextLevel: baseStats.xpToNextLevel,
      attributePoints: 3 // Iniciamos com 3 pontos de atributo
    };

    setPlayer(newPlayer);
    showNotification(`Bem-vindo, ${name}!`, 'success');
  };

  // Update player stats
  const updatePlayer = (updates) => {
    setPlayer(prev => {
      if (!prev) return null;

      // Ensure attackSpeed never exceeds 2
      if (updates.attackSpeed && updates.attackSpeed > 2) {
        updates.attackSpeed = 2;
      }

      const updated = { ...prev, ...updates };
      return updated;
    });
    return player;
  };

  // Resetar atributos do jogador com base no nível atual
  const resetStats = () => {
    if (!player) return;

    const baseStats = generatePlayerStats(player.level);

    updatePlayer({
      hp: baseStats.hp,
      maxHp: baseStats.hp,
      attack: baseStats.attack,
      physicalDefense: baseStats.physicalDefense,
      critChance: baseStats.critChance,
      attackSpeed: Math.min(2, baseStats.attackSpeed),
      attributePoints: 3 * player.level // Recalcula pontos
    });

    showNotification("Atributos reiniciados!", "info");
  };


  // Log the player out (clear data)
  const logout = () => {
    localStorage.removeItem('gladiator_player');
    setPlayer(null);
    showNotification('Você saiu do jogo', 'info');
  };

  // Level up the player (atualizado para dar pontos de atributo em vez de stats automáticos)
  const levelUp = () => {
    if (!player) return;

    const newLevel = player.level + 1;
    const xpToNextLevel = Math.floor(player.xpToNextLevel * 1.2);

    updatePlayer({
      level: newLevel,
      attributePoints: (player.attributePoints || 0) + 3, // 3 pontos por nível
      xpToNextLevel: xpToNextLevel
    });

    showNotification(`Avançou para o nível ${newLevel}! Ganhou 3 pontos de atributo.`, 'success');
  };

  // Handle battle function
  const handleBattle = (enemy) => {
    if (!player) return { success: false, combatLog: [] };

    // Clone the enemy and player for combat
    const enemyClone = { ...enemy, currentHp: enemy.hp };
    const playerClone = { ...player, currentHp: player.hp };

    // Combat log
    const combatLog = [];
    let roundCount = 1;

    combatLog.push({ type: 'system', message: `Combate iniciado contra ${enemy.name}!` });

    // Combat loop
    while (playerClone.currentHp > 0 && enemyClone.currentHp > 0) {

      // Player attack
      let playerBaseDamage = Math.max(1, playerClone.attack);
      // Aplicar a defesa do inimigo (redução direta)
      let playerDamage = Math.max(1, playerBaseDamage - enemyClone.defense);

      // Verificar acerto crítico (dobro de dano)
      const playerCrit = Math.random() * 100 < playerClone.critChance;
      const finalPlayerDamage = playerCrit ? Math.floor(playerDamage * 2) : playerDamage;

      enemyClone.currentHp -= finalPlayerDamage;

      combatLog.push({
        type: 'player',
        message: `Você causou ${finalPlayerDamage} de dano${playerCrit ? ' (crítico!)' : ''} ao ${enemy.name}.`
      });

      // Check if enemy is defeated
      if (enemyClone.currentHp <= 0) {
        combatLog.push({ type: 'player', message: `Você derrotou o ${enemy.name}!` });
        break;
      }

      // Enemy attack with defense damage reduction
      const enemyBaseDamage = Math.max(1, enemyClone.attack);

      // Nova lógica: cada ponto de defesa reduz 0,1% do dano, limitado a 30%
      const damageReduction = Math.min(30, playerClone.physicalDefense * 0.1);

      // Apply percentage damage reduction from defense
      let enemyDamage = Math.floor(enemyBaseDamage * (1 - damageReduction / 100));

      // Enemy critical hit (1.5x for enemies)
      const enemyCrit = Math.random() * 100 < enemyClone.critChance;
      const finalEnemyDamage = enemyCrit ? Math.floor(enemyDamage * 1.5) : enemyDamage;

      playerClone.currentHp -= finalEnemyDamage;

      // Add defense reduction info to combat log if applicable
      if (damageReduction > 0) {
        combatLog.push({
          type: 'enemy',
          message: `${enemy.name} causou ${finalEnemyDamage} de dano${enemyCrit ? ' (crítico!)' : ''} a você. (Redução de dano: ${damageReduction.toFixed(1)}%)`
        });
      } else {
        combatLog.push({
          type: 'enemy',
          message: `${enemy.name} causou ${finalEnemyDamage} de dano${enemyCrit ? ' (crítico!)' : ''} a você.`
        });
      }

      // Check if player is defeated
      if (playerClone.currentHp <= 0) {
        combatLog.push({ type: 'enemy', message: `Você foi derrotado por ${enemy.name}!` });
        break;
      }

      roundCount++;
    }

    // Combat result
    let result;
    if (playerClone.currentHp <= 0) {
      // Player defeated
      result = {
        type: 'defeat',
        title: 'Derrota!',
        message: `Você foi derrotado por ${enemy.name}.`
      };

      // Update player HP (minimum 1)
      updatePlayer({ hp: 1 });
    } else {
      // Player won
      const newXP = player.xp + enemy.rewardXP;
      let newLevel = player.level;
      let newXpToNext = player.xpToNextLevel;
      let remainingXP = newXP;
      let leveledUp = false;
      let attributePointsGained = 0;

      while (remainingXP >= newXpToNext) {
        remainingXP -= newXpToNext;
        newLevel += 1;
        newXpToNext = Math.floor(newXpToNext * 1.2);
        attributePointsGained += 3; // 3 pontos por nível
        leveledUp = true;
      }

      // If leveled up
      let newHp = playerClone.currentHp;
      if (leveledUp) {
        // Restaurar HP completo ao subir de nível
        newHp = player.maxHp;
        result = {
          type: 'victory',
          title: 'Vitória! Subiu de Nível!',
          message: `Você derrotou ${enemy.name}, subiu para o nível ${newLevel} e ganhou ${attributePointsGained} pontos de atributo!`
        };
      } else {
        result = {
          type: 'victory',
          title: 'Vitória!',
          message: `Você derrotou ${enemy.name} e ganhou ${enemy.rewardXP} XP!`
        };
      }

      // Use gold reward multiplier if available
      const goldMultiplier = enemy.rewardGoldMultiplier || 1;
      const rewardGold = Math.floor(enemy.level * 10 * (1 + Math.random() * 0.5) * goldMultiplier);
      combatLog.push({ type: 'system', message: `Você ganhou ${rewardGold} de ouro!` });

      updatePlayer({
        hp: newHp,
        xp: remainingXP,
        level: newLevel,
        xpToNextLevel: newXpToNext,
        gold: player.gold + rewardGold,
        attributePoints: (player.attributePoints || 0) + attributePointsGained
      });
    }

    return {
      success: playerClone.currentHp > 0,
      combatLog,
      result
    };
  };

  // Context value
  const contextValue = {
    player,
    createPlayer,
    updatePlayer,
    logout,
    levelUp,
    handleBattle,
    notification,
    showNotification,
    resetStats
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}