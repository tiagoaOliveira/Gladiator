import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { generatePlayerStats } from '../utils/player';

const GameContext = createContext();

export function GameProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  
  // Para o sistema de recuperação de HP
  const hpRecoveryTimerRef = useRef(null);

  // Carregar jogador do localStorage
  useEffect(() => {
    const storedPlayer = getPlayerFromStorage();
    if (storedPlayer) {
      // Garantir que as estatísticas estejam atualizadas
      const updatedStats = generatePlayerStats(storedPlayer.level || 1);
      setPlayer({ ...storedPlayer, ...updatedStats });
    }
  }, []);

  // Configurar o timer de recuperação de HP quando o jogador é carregado
  useEffect(() => {
    if (player && player.hp < player.maxHp) {
      startHpRecovery();
    }

    return () => {
      if (hpRecoveryTimerRef.current) {
        clearInterval(hpRecoveryTimerRef.current);
      }
    };
  }, [player]);

  const savePlayerToStorage = (playerData) => {
    // Garantimos que maxHp esteja sempre definido
    const dataToSave = {
      ...playerData,
      maxHp: playerData.hp || playerData.maxHp || 100
    };
    
    localStorage.setItem('player', JSON.stringify(dataToSave));
    setPlayer(dataToSave);
  };

  const getPlayerFromStorage = () => {
    const stored = JSON.parse(localStorage.getItem('player'));
    if (stored) {
      // Garantimos que maxHp esteja sempre definido para jogadores existentes
      return {
        ...stored,
        maxHp: stored.maxHp || stored.hp || 100
      };
    }
    return null;
  };

  const updatePlayer = (newData) => {
    const updatedPlayer = { ...player, ...newData };
    savePlayerToStorage(updatedPlayer);
    return updatedPlayer;
  };

  const createPlayer = (name) => {
    const baseStats = generatePlayerStats(1);
    const newPlayer = {
      name,
      level: 1,
      xp: 0,
      gold: 50,
      ...baseStats,
      maxHp: baseStats.hp // Adicionando maxHp para referência
    };
    
    savePlayerToStorage(newPlayer);
    return newPlayer;
  };

  const levelUp = () => {
    if (!player) return;
    
    const nextLevel = player.level + 1;
    const newStats = generatePlayerStats(nextLevel);
    const updatedPlayer = {
      ...player,
      level: nextLevel,
      xp: 0,
      hp: newStats.hp, // Vida cheia ao subir de nível
      maxHp: newStats.hp,
      ...newStats
    };
    
    savePlayerToStorage(updatedPlayer);
    showNotification(`Nível ${nextLevel} alcançado!`, 'success');
  };

  const startHpRecovery = () => {
    // Limpa qualquer timer existente
    if (hpRecoveryTimerRef.current) {
      clearInterval(hpRecoveryTimerRef.current);
    }
    
    // Configura o novo timer (a cada minuto recupera 2% do HP máximo)
    hpRecoveryTimerRef.current = setInterval(() => {
      const currentPlayer = getPlayerFromStorage();
      
      if (!currentPlayer || currentPlayer.hp >= currentPlayer.maxHp) {
        clearInterval(hpRecoveryTimerRef.current);
        return;
      }
      
      const recoveryAmount = Math.ceil(currentPlayer.maxHp * 0.02); // 2% do HP máximo
      const newHp = Math.min(currentPlayer.maxHp, currentPlayer.hp + recoveryAmount);
      
      const updatedPlayer = {
        ...currentPlayer,
        hp: newHp
      };
      
      savePlayerToStorage(updatedPlayer);
      setPlayer(updatedPlayer);
      
      // Se a vida estiver completa, paramos o timer
      if (newHp >= currentPlayer.maxHp) {
        clearInterval(hpRecoveryTimerRef.current);
      }
    }, 60000); // 60000 ms = 1 minuto
  };

  const handleBattle = (enemy) => {
    if (!player) return { success: false, combatLog: [] };
    
    // Clone o inimigo e o jogador para o combate
    const enemyClone = { ...enemy, currentHp: enemy.hp };
    const playerClone = { ...player, currentHp: player.hp };
    
    // Log de combate
    const combatLog = [];
    let roundCount = 1;
    
    combatLog.push({ type: 'system', message: `Combate iniciado contra ${enemy.name}!` });
    
    // Loop de combate
    while (playerClone.currentHp > 0 && enemyClone.currentHp > 0) {
      combatLog.push({ type: 'system', message: `--- Rodada ${roundCount} ---` });
      
      // Ataque do jogador
      const playerDamage = Math.max(1, playerClone.attack - enemyClone.defense);
      const playerCrit = Math.random() * 100 < playerClone.critChance;
      const finalPlayerDamage = playerCrit ? Math.floor(playerDamage * 1.5) : playerDamage;
      
      enemyClone.currentHp -= finalPlayerDamage;
      
      combatLog.push({ 
        type: 'player', 
        message: `Você causou ${finalPlayerDamage} de dano${playerCrit ? ' (crítico!)' : ''} ao ${enemy.name}.` 
      });
      
      // Verifica se o inimigo foi derrotado
      if (enemyClone.currentHp <= 0) {
        combatLog.push({ type: 'player', message: `Você derrotou o ${enemy.name}!` });
        break;
      }
      
      // Ataque do inimigo
      const enemyDamage = Math.max(1, enemyClone.attack - playerClone.physicalDefense);
      const enemyCrit = Math.random() * 100 < enemyClone.critChance;
      const finalEnemyDamage = enemyCrit ? Math.floor(enemyDamage * 1.5) : enemyDamage;
      
      playerClone.currentHp -= finalEnemyDamage;
      
      combatLog.push({ 
        type: 'enemy', 
        message: `${enemy.name} causou ${finalEnemyDamage} de dano${enemyCrit ? ' (crítico!)' : ''} a você.` 
      });
      
      // Verifica se o jogador foi derrotado
      if (playerClone.currentHp <= 0) {
        combatLog.push({ type: 'enemy', message: `Você foi derrotado por ${enemy.name}!` });
        break;
      }
      
      roundCount++;
    }
    
    // Resultado do combate
    let result;
    if (playerClone.currentHp <= 0) {
      // Jogador derrotado
      result = {
        type: 'defeat',
        title: 'Derrota!',
        message: `Você foi derrotado por ${enemy.name}.`
      };
      
      // Atualiza o HP do jogador (mínimo 1)
      updatePlayer({ hp: 1 });
    } else {
      // Jogador venceu
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
      
      // Se subiu de nível, recupera vida completa
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
        // Inicia recuperação de HP se necessário
        if (newHp < player.maxHp) {
          startHpRecovery();
        }
      }
      
      const rewardGold = Math.floor(enemy.level * 10 * (1 + Math.random() * 0.5));
      combatLog.push({ type: 'system', message: `Você ganhou ${rewardGold} de ouro!` });
      
      const updatedPlayer = updatePlayer({
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

  const logout = () => {
    if (hpRecoveryTimerRef.current) {
      clearInterval(hpRecoveryTimerRef.current);
    }
    localStorage.removeItem('player');
    setPlayer(null);
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  return (
    <GameContext.Provider 
      value={{ 
        player, 
        createPlayer, 
        updatePlayer, 
        levelUp, 
        handleBattle, 
        logout,
        notification,
        showNotification 
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);