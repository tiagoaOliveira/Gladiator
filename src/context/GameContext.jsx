import React, { createContext, useContext, useState, useEffect } from 'react';
import { generatePlayerStats } from '../utils/player';
import { availableMissions } from '../pages/Missoes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const GameContext = createContext();
export const useGame = () => useContext(GameContext);

export function GameProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [playerMissions, setPlayerMissions] = useState({});
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'info'
  });
  const [loading, setLoading] = useState(false);

  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      fetchPlayerByToken(token);
    }
  }, []);

  useEffect(() => {
    if (player) {
      loadPlayerMissions();
    }
  }, [player]);

  const authFetch = async (path, options = {}) => {
    const token = localStorage.getItem('jwt');
    const headers = { ...(options.headers || {}), 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const resp = await fetch(`${API_URL}${path}`, { ...options, headers });
    return resp;
  };

  const loadPlayerMissions = async () => {
    if (!player) return;
    try {
      const response = await authFetch(`/api/players/${player.id}/missions`);
      if (response.ok) {
        const missions = await response.json();
        setPlayerMissions(missions);
      } else {
        loadPlayerMissionsFromLocalStorage();
      }
    } catch (error) {
      loadPlayerMissionsFromLocalStorage();
    }
  };

  const loadPlayerMissionsFromLocalStorage = () => {
    if (!player) return;
    const savedMissions = localStorage.getItem(`gladiator_missions_${player.id}`);
    if (savedMissions) {
      setPlayerMissions(JSON.parse(savedMissions));
    } else {
      const initialMissions = {};
      availableMissions.forEach(mission => {
        initialMissions[mission.id] = { progress: 0, completed: false, claimed: false };
      });
      setPlayerMissions(initialMissions);
      saveMissionsToServer(initialMissions);
    }
  };

  const saveMissionsToServer = async (missions) => {
    if (!player) return;
    try {
      const response = await authFetch(`/api/players/${player.id}/missions`, {
        method: 'PUT',
        body: JSON.stringify(missions),
      });
      if (!response.ok) {
        saveMissionsToLocalStorage(missions);
      }
    } catch (error) {
      saveMissionsToLocalStorage(missions);
    }
  };

  const saveMissionsToLocalStorage = (missions) => {
    if (player) {
      localStorage.setItem(`gladiator_missions_${player.id}`, JSON.stringify(missions));
    }
  };

  const saveSingleMissionToServer = async (missionId, missionData) => {
    if (!player) return;
    try {
      const response = await authFetch(`/api/players/${player.id}/missions/${missionId}`, {
        method: 'PUT',
        body: JSON.stringify(missionData),
      });
    } catch (error) {
    }
  };

  const normalizeEnemyName = (name) => name.toLowerCase().trim();

  const updateMissionProgress = (enemyName, isVictory) => {
    if (!isVictory || !player) return;
    const updatedMissions = { ...playerMissions };
    let hasUpdates = false;
    availableMissions.forEach(mission => {
      if (updatedMissions[mission.id]?.completed) return;
      let applies = false;
      if (mission.target === "any") {
        applies = true;
      } else {
        const normT = normalizeEnemyName(mission.target);
        const normE = normalizeEnemyName(enemyName);
        applies = normT === normE;
      }
      if (applies) {
        if (!updatedMissions[mission.id]) {
          updatedMissions[mission.id] = { progress: 0, completed: false, claimed: false };
        }
        updatedMissions[mission.id].progress += 1;
        hasUpdates = true;
        if (updatedMissions[mission.id].progress >= mission.targetCount && !updatedMissions[mission.id].completed) {
          updatedMissions[mission.id].completed = true;
          showNotification(`🎯 Missão "${mission.title}" completada!`, 'success');
        }
        saveSingleMissionToServer(mission.id, updatedMissions[mission.id]);
      }
    });
    if (hasUpdates) {
      setPlayerMissions(updatedMissions);
      saveMissionsToLocalStorage(updatedMissions);
    }
  };

  const claimMissionReward = async (missionId) => {
    const mission = availableMissions.find(m => m.id === missionId);
    const missionProgress = playerMissions[missionId];
    if (!mission || !missionProgress?.completed || missionProgress.claimed) return false;
    try {
      await updatePlayer({
        xp: player.xp + mission.rewards.xp,
        gold: player.gold + mission.rewards.gold
      });
      const updatedMissions = { ...playerMissions };
      updatedMissions[missionId].claimed = true;
      setPlayerMissions(updatedMissions);
      await saveSingleMissionToServer(missionId, updatedMissions[missionId]);
      saveMissionsToLocalStorage(updatedMissions);
      showNotification(
        `💰 Recompensa coletada: +${mission.rewards.xp} XP, +${mission.rewards.gold} Ouro!`,
        'success'
      );
      return true;
    } catch (error) {
      showNotification('Erro ao coletar recompensa da missão', 'error');
      return false;
    }
  };

  const getActiveMissions = () =>
    availableMissions.filter(mission => {
      const progress = playerMissions[mission.id];
      return !progress?.claimed;
    });

  const getCompletedMissions = () =>
    availableMissions.filter(mission => {
      const progress = playerMissions[mission.id];
      return progress?.completed && !progress?.claimed;
    });

  const fetchPlayerByToken = async (token) => {
    try {
      setLoading(true);
      setPlayer(null);

      const resp = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!resp.ok) {
        localStorage.removeItem('jwt');
        setPlayer(null);
        return null;
      }

      const playerData = await resp.json();
      const formattedPlayer = formatPlayerData(playerData);
      setPlayer(formattedPlayer);
      return formattedPlayer;

    } catch (err) {
      localStorage.removeItem('jwt');
      setPlayer(null);
      showNotification('Erro ao carregar dados do jogador', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const formatPlayerData = (dbPlayer) => ({
    id: dbPlayer.id,
    name: dbPlayer.name,
    level: dbPlayer.level,
    xp: dbPlayer.xp,
    gold: dbPlayer.gold,
    hp: dbPlayer.hp,
    maxHp: dbPlayer.maxHp,
    attack: dbPlayer.attack,
    critChance: dbPlayer.critChance,
    attackSpeed: dbPlayer.attackSpeed,
    physicalDefense: dbPlayer.physicalDefense,
    magicPower: dbPlayer.magicPower || 0,
    magicResistance: dbPlayer.magicResistance || 0,
    xpToNextLevel: dbPlayer.xpToNextLevel,
    attributePoints: dbPlayer.attributePoints,
    rankedPoints: dbPlayer.rankedPoints || 0,
    reflect: !!dbPlayer.reflect,
    criticalX3: !!dbPlayer.criticalX3,
    speedBoost: !!dbPlayer.speedBoost,
    premium: !!dbPlayer.premium
  });

  const formatPlayerForDB = (frontendPlayer) => {
    const {
      id,
      reflect = false,
      criticalX3 = false,
      speedBoost = false,
      ...playerData
    } = frontendPlayer;
    return {
      ...playerData,
      reflect: reflect ? 1 : 0,
      criticalX3: criticalX3 ? 1 : 0,
      speedBoost: speedBoost ? 1 : 0
    };
  };

  const updatePlayer = async (updates) => {
    if (!player) return null;
    if (updates.attackSpeed !== undefined) {
      const currentPlayer = { ...player, ...updates };
      const maxSpeed = currentPlayer.speedBoost ? 3.5 : 3;
      if (updates.attackSpeed > maxSpeed) {
        updates.attackSpeed = maxSpeed;
      }
    }
    try {
      const updatedPlayer = { ...player, ...updates };
      setPlayer(updatedPlayer);
      const response = await authFetch(`/api/players/${player.id}`, {
        method: 'PUT',
        body: JSON.stringify(formatPlayerForDB(updatedPlayer)),
      });
      if (!response.ok) {
        throw new Error('Falha ao atualizar o jogador no servidor');
      }
      return updatedPlayer;
    } catch (err) {
      fetchPlayerByToken(localStorage.getItem('jwt'));
      throw err;
    }
  };

  const resetStats = () => {
    if (!player) return;
    const baseStats = generatePlayerStats(player.level);
    const currentHp = player.hp;
    const newMaxHp = baseStats.hp;
    const adjustedHp = Math.min(currentHp, newMaxHp);
    let defParaAtualizar = baseStats.physicalDefense;
    if (player.reflect) {
      defParaAtualizar = baseStats.physicalDefense + 70;
    }
    let newAttackSpeed = Math.min(3, baseStats.attackSpeed);
    if (player.speedBoost) {
      newAttackSpeed = Math.min(newAttackSpeed + 0.5, 3.5);
    }
    let critParaAtualizar = baseStats.critChance;
    if (player.criticalX3) {
      critParaAtualizar = Math.min(critParaAtualizar + 10, 100);
    }
    let atkSpeedParaAtualizar = Math.min(baseStats.attackSpeed, 3);
    if (player.speedBoost) {
      atkSpeedParaAtualizar = Math.min(atkSpeedParaAtualizar + 0.5, 4);
    }
    updatePlayer({
      maxHp: newMaxHp,
      hp: adjustedHp,
      attack: baseStats.attack,
      physicalDefense: defParaAtualizar,
      critChance: critParaAtualizar,
      attackSpeed: atkSpeedParaAtualizar,
      attributePoints: 3 * player.level
    });
    showNotification("Atributos reiniciados!", "info");
  };

  const logout = () => {
    localStorage.removeItem('jwt');
    setPlayer(null);
    setPlayerMissions({});
    showNotification('Você saiu do jogo', 'info');
  };

  const levelUp = async () => {
    if (!player) return;
    const newLevel = player.level + 1;
    const xpToNextLevel = Math.floor(player.xpToNextLevel * 1.01);
    try {
      const updatedPlayer = await updatePlayer({
        level: newLevel,
        attributePoints: (player.attributePoints || 0) + 3,
        xpToNextLevel: xpToNextLevel,
        hp: player.maxHp
      });
      showNotification(`Avançou para o nível ${newLevel}! Ganhou 3 pontos de atributo.`, 'success');
      return updatedPlayer;
    } catch (error) {
      showNotification('Ocorreu um erro ao subir de nível.', 'error');
    }
  };

  const handleBattle = (enemy) => {
    if (!player) return { success: false, combatLog: [], result: null };
    const enemyClone = { ...enemy, currentHp: enemy.hp };
    const playerClone = { ...player, currentHp: player.hp };
    if (player.speedBoost) {
      playerClone.attackSpeed = Math.min(3.5, playerClone.attackSpeed + 0.5);
    }
    const combatLog = [];
    let battleTime = 0;
    const timeIncrement = 0.1;
    let playerAttackCounter = 0;
    let enemyAttackCounter = 0;
    combatLog.push({ type: 'system', message: `Combate iniciado contra ${enemy.name}!` });
    while (playerClone.currentHp > 0 && enemyClone.currentHp > 0) {
      battleTime += timeIncrement;
      if (battleTime >= (playerAttackCounter + 1) / playerClone.attackSpeed) {
        playerAttackCounter++;
        let playerBaseDamage = Math.max(1, playerClone.attack);
        const enemyDamageReduction = Math.min(30, enemyClone.defense * 0.1);
        let playerDamage = Math.floor(playerBaseDamage * (1 - enemyDamageReduction / 100));
        playerDamage = Math.max(1, playerDamage);
        const playerCrit = Math.random() * 100 < playerClone.critChance;
        const finalPlayerDamage = playerCrit
          ? Math.floor(playerDamage * (playerClone.criticalX3 ? 3 : 2))
          : playerDamage;
        enemyClone.currentHp -= finalPlayerDamage;
        combatLog.push({
          type: 'player',
          message: `Você causou ${finalPlayerDamage} de dano${playerCrit ? ' (crítico!)' : ''} ao ${enemy.name}.`,
          attackSpeed: playerClone.attackSpeed
        });
        if (enemyClone.currentHp <= 0) break;
      }
      if (battleTime >= (enemyAttackCounter + 1) / enemyClone.attackSpeed) {
        enemyAttackCounter++;
        const enemyBaseDamage = Math.max(1, enemyClone.attack);
        const damageReduction = Math.min(30, playerClone.physicalDefense * 0.1);
        const enemyCrit = Math.random() * 100 < enemyClone.critChance;
        const rawDamage = enemyCrit ? Math.floor(enemyBaseDamage * 2) : enemyBaseDamage;
        const finalEnemyDamage = Math.floor(rawDamage * (1 - damageReduction / 100));
        const damageReduced = rawDamage - finalEnemyDamage;
        playerClone.currentHp -= finalEnemyDamage;
        if (damageReduction > 0) {
          combatLog.push({
            type: 'enemy',
            message: `${enemy.name} causou ${finalEnemyDamage} de dano${enemyCrit ? ' (crítico!)' : ''} a você.)`,
            attackSpeed: enemyClone.attackSpeed
          });
        } else {
          combatLog.push({
            type: 'enemy',
            message: `${enemy.name} causou ${finalEnemyDamage} de dano${enemyCrit ? ' (crítico!)' : ''} a você.`,
            attackSpeed: enemyClone.attackSpeed
          });
        }
        if (playerClone.reflect && damageReduced > 0) {
          const reflected = Math.floor(damageReduced);
          enemyClone.currentHp -= reflected;
          combatLog.push({
            type: 'system',
            message: `🔥 Você refletiu ${reflected} de dano ao ${enemy.name}.`,
          });
          if (enemyClone.currentHp <= 0) {
            combatLog.push({ type: 'player', message: `Você derrotou o ${enemy.name} com dano refletido!` });
            break;
          }
        }
        if (playerClone.currentHp <= 0) {
          combatLog.push({ type: 'enemy', message: `Você foi derrotado por ${enemy.name}!` });
          break;
        }
      }
      if (battleTime > 100) {
        combatLog.push({ type: 'system', message: `O combate foi muito longo e terminou em empate!` });
        break;
      }
    }
    const isVictory = playerClone.currentHp > 0;
    let result = null;
    if (!isVictory) {
      result = {
        type: 'defeat',
        title: 'Derrota!',
        message: `Você foi derrotado por ${enemy.name}.`
      };
      updatePlayer({ hp: 1 });
    } else {
      updateMissionProgress(enemy.name, true);
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
        attributePointsGained += 3;
        leveledUp = true;
      }
      let newHp = playerClone.currentHp;
      if (leveledUp) {
        newHp = player.maxHp;
        result = {
          type: 'victory',
          title: 'Vitória!',
          message: `Subiu para o nível ${newLevel}: `
        };
      } else {
        result = {
          type: 'victory',
          title: 'Vitória!',
          message: ` Ganhou ${enemy.rewardXP} XP`
        };
      }
      const goldMultiplier = enemy.rewardGoldMultiplier || 1;
      const rewardGold = Math.floor(2 * (1 + Math.random() * 0.5) * goldMultiplier);
      result.message += ` +${rewardGold} de ouro!`;
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
      success: isVictory,
      combatLog,
      result
    };
  };

  const contextValue = {
    player,
    setPlayer,
    fetchPlayerByToken,
    loading,
    updatePlayer,
    logout,
    levelUp,
    handleBattle,
    notification,
    showNotification,
    resetStats,
    playerMissions,
    availableMissions,
    updateMissionProgress,
    claimMissionReward,
    getActiveMissions,
    getCompletedMissions,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}