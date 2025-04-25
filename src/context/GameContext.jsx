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
      attackSpeed: baseStats.attackSpeed,
      physicalDefense: baseStats.physicalDefense,
      magicPower: baseStats.magicPower,
      magicResistance: baseStats.magicResistance,
      xpToNextLevel: baseStats.xpToNextLevel
    };
    
    setPlayer(newPlayer);
    showNotification(`Bem-vindo, ${name}!`, 'success');
  };

  // Update player stats
  const updatePlayer = (updates) => {
    setPlayer(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      return updated;
    });
    return player;
  };

  // Log the player out (clear data)
  const logout = () => {
    localStorage.removeItem('gladiator_player');
    setPlayer(null);
    showNotification('Você saiu do jogo', 'info');
  };

  // Level up the player (for testing)
  const levelUp = () => {
    if (!player) return;
    
    const newLevel = player.level + 1;
    const newStats = generatePlayerStats(newLevel);
    
    updatePlayer({
      level: newLevel,
      hp: newStats.hp,
      maxHp: newStats.hp,
      attack: newStats.attack,
      critChance: newStats.critChance,
      attackSpeed: newStats.attackSpeed,
      physicalDefense: newStats.physicalDefense,
      magicPower: newStats.magicPower,
      magicResistance: newStats.magicResistance,
      xpToNextLevel: newStats.xpToNextLevel
    });
    
    showNotification(`Avançou para o nível ${newLevel}!`, 'success');
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
      combatLog.push({ type: 'system', message: `--- Rodada ${roundCount} ---` });
      
      // Player attack
      const playerDamage = Math.max(1, playerClone.attack - enemyClone.defense);
      const playerCrit = Math.random() * 100 < playerClone.critChance;
      const finalPlayerDamage = playerCrit ? Math.floor(playerDamage * 1.5) : playerDamage;
      
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
      
      // Enemy attack
      const enemyDamage = Math.max(1, enemyClone.attack - playerClone.physicalDefense);
      const enemyCrit = Math.random() * 100 < enemyClone.critChance;
      const finalEnemyDamage = enemyCrit ? Math.floor(enemyDamage * 1.5) : enemyDamage;
      
      playerClone.currentHp -= finalEnemyDamage;
      
      combatLog.push({ 
        type: 'enemy', 
        message: `${enemy.name} causou ${finalEnemyDamage} de dano${enemyCrit ? ' (crítico!)' : ''} a você.` 
      });
      
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
      
      while (remainingXP >= newXpToNext) {
        remainingXP -= newXpToNext;
        newLevel += 1;
        newXpToNext = Math.floor(newXpToNext * 1.2);
        leveledUp = true;
      }
      
      // If leveled up, restore full health
      let newHp = playerClone.currentHp;
      if (leveledUp) {
        const newStats = generatePlayerStats(newLevel);
        newHp = newStats.hp;
        result = {
          type: 'victory',
          title: 'Vitória! Subiu de Nível!',
          message: `Você derrotou ${enemy.name} e subiu para o nível ${newLevel}!`
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
        maxHp: leveledUp ? newHp : player.maxHp,
        xp: remainingXP,
        level: newLevel,
        xpToNextLevel: newXpToNext,
        gold: player.gold + rewardGold
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
    showNotification
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}