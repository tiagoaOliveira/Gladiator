import React, { createContext, useContext, useState, useEffect } from 'react';
import { generatePlayerStats } from '../utils/player';

// API base URL
const API_URL = 'http://localhost:4000/api';

// Create the context
const GameContext = createContext();

// Custom hook to use the game context
export const useGame = () => useContext(GameContext);

// Definindo as missões disponíveis
const availableMissions = [
  {
    id: 1,
    title: "Caçador de Goblins",
    description: "Derrote 50 Goblins na arena",
    target: "Goblin Berserker",
    targetCount: 50,
    rewards: {
      xp: 5000,
      gold: 2500
    },
    difficulty: "Fácil",
    icon: "🏹"
  },
  {
    id: 2,
    title: "Exterminador de Orcs",
    description: "Derrote 20 Orcs Guerreiros",
    target: "Orc Selvagem",
    targetCount: 20,
    rewards: {
      xp: 8000,
      gold: 4000
    },
    difficulty: "Médio",
    icon: "⚔️"
  },
    {
    id: 3,
    title: "Caçador de Dragões",
    description: "Derrote 5 Dragões Vermelhos",
    target: "Dragão Ancião",
    targetCount: 5,
    rewards: {
      xp: 20000,
      gold: 10000
    },
    difficulty: "Extremo",
    icon: "🐉"
  },
  {
    id: 4,
    title: "Domador de Trolls",
    description: "Derrote 10 Trolls das Cavernas",
    target: "Guarda Real",
    targetCount: 10,
    rewards: {
      xp: 12000,
      gold: 6000
    },
    difficulty: "Difícil",
    icon: "🛡️"
  },
  {
    id: 5,
    title: "Assassino de Esqueletos",
    description: "Derrote 30 Esqueletos Guerreiros",
    target: "Esqueleto Guerreiro",
    targetCount: 30,
    rewards: {
      xp: 6000,
      gold: 3000
    },
    difficulty: "Médio",
    icon: "💀"
  },
  {
    id: 6,
    title: "Conquistador do Minotauro",
    description: "Derrote 8 Minotauros",
    target: "Minotauro",
    targetCount: 8,
    rewards: {
      xp: 15000,
      gold: 7500
    },
    difficulty: "Difícil",
    icon: "🐂"
  },
  {
    id: 7,
    title: "Sobrevivente Iniciante",
    description: "Vença 100 batalhas na arena",
    target: "any",
    targetCount: 100,
    rewards: {
      xp: 3000,
      gold: 1500
    },
    difficulty: "Fácil",
    icon: "🏆"
  },
  {
    id: 8,
    title: "Gladiador Veterano",
    description: "Vença 500 batalhas na arena",
    target: "any",
    targetCount: 500,
    rewards: {
      xp: 25000,
      gold: 15000
    },
    difficulty: "Extremo",
    icon: "👑"
  }
];

// Provider component
export function GameProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [playerMissions, setPlayerMissions] = useState({});
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'info'
  });
  const [loading, setLoading] = useState(false);

  // Check for existing player in localStorage on startup for fallback
  useEffect(() => {
    const savedPlayerId = localStorage.getItem('gladiator_player_id');
    if (savedPlayerId) {
      fetchPlayerById(savedPlayerId);
    }
  }, []);

  // Carregar missões quando o jogador for carregado
  useEffect(() => {
    if (player) {
      loadPlayerMissions();
    }
  }, [player]);

  // Carregar progresso das missões do banco de dados
  const loadPlayerMissions = async () => {
    if (!player) return;
    
    try {
      const response = await fetch(`${API_URL}/players/${player.id}/missions`);
      if (response.ok) {
        const missions = await response.json();
        setPlayerMissions(missions);
      } else {
        console.error('Erro ao carregar missões do servidor');
        // Fallback para localStorage se o servidor falhar
        loadPlayerMissionsFromLocalStorage();
      }
    } catch (error) {
      console.error('Erro ao conectar com o servidor para carregar missões:', error);
      // Fallback para localStorage se houver erro de conexão
      loadPlayerMissionsFromLocalStorage();
    }
  };

  // Fallback: carregar do localStorage se o servidor não estiver disponível
  const loadPlayerMissionsFromLocalStorage = () => {
    const savedMissions = localStorage.getItem(`gladiator_missions_${player.id}`);
    if (savedMissions) {
      setPlayerMissions(JSON.parse(savedMissions));
    } else {
      // Primeira vez - inicializar todas as missões
      const initialMissions = {};
      availableMissions.forEach(mission => {
        initialMissions[mission.id] = { progress: 0, completed: false, claimed: false };
      });
      setPlayerMissions(initialMissions);
      saveMissionsToServer(initialMissions);
    }
  };

  // Salvar progresso das missões no servidor
  const saveMissionsToServer = async (missions) => {
    if (!player) return;

    try {
      const response = await fetch(`${API_URL}/players/${player.id}/missions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(missions),
      });

      if (!response.ok) {
        console.error('Erro ao salvar missões no servidor');
        // Fallback para localStorage se o servidor falhar
        saveMissionsToLocalStorage(missions);
      }
    } catch (error) {
      console.error('Erro ao conectar com o servidor para salvar missões:', error);
      // Fallback para localStorage se houver erro de conexão
      saveMissionsToLocalStorage(missions);
    }
  };

  // Fallback: salvar no localStorage
  const saveMissionsToLocalStorage = (missions) => {
    if (player) {
      localStorage.setItem(`gladiator_missions_${player.id}`, JSON.stringify(missions));
    }
  };

  // Salvar uma missão específica no servidor
  const saveSingleMissionToServer = async (missionId, missionData) => {
    if (!player) return;

    try {
      const response = await fetch(`${API_URL}/players/${player.id}/missions/${missionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(missionData),
      });

      if (!response.ok) {
        console.error('Erro ao salvar missão no servidor');
      }
    } catch (error) {
      console.error('Erro ao conectar com o servidor para salvar missão:', error);
    }
  };

  // Função para normalizar nomes de inimigos para comparação
  const normalizeEnemyName = (name) => {
    return name.toLowerCase().trim();
  };

  // Atualizar progresso das missões
  const updateMissionProgress = (enemyName, isVictory) => {
    if (!isVictory || !player) return;

    const updatedMissions = { ...playerMissions };
    let hasUpdates = false;

    availableMissions.forEach(mission => {
      if (updatedMissions[mission.id]?.completed) return;

      let applies = false;
      
      // Verificar se a missão se aplica à batalha
      if (mission.target === "any") {
        applies = true;
      } else {
        // Comparação normalizada para evitar problemas de case/espaços
        const normalizedTarget = normalizeEnemyName(mission.target);
        const normalizedEnemy = normalizeEnemyName(enemyName);
        applies = normalizedTarget === normalizedEnemy;
      }
      
      if (applies) {
        if (!updatedMissions[mission.id]) {
          updatedMissions[mission.id] = { progress: 0, completed: false, claimed: false };
        }
        
        updatedMissions[mission.id].progress += 1;
        hasUpdates = true;

        // Verificar se a missão foi completada
        if (updatedMissions[mission.id].progress >= mission.targetCount && !updatedMissions[mission.id].completed) {
          updatedMissions[mission.id].completed = true;
          showNotification(`🎯 Missão "${mission.title}" completada!`, 'success');
        }

        // Salvar esta missão específica no servidor
        saveSingleMissionToServer(mission.id, updatedMissions[mission.id]);
      }
    });

    if (hasUpdates) {
      setPlayerMissions(updatedMissions);
      // Também manter backup no localStorage
      saveMissionsToLocalStorage(updatedMissions);
    }
  };

  // Coletar recompensa da missão
  const claimMissionReward = async (missionId) => {
    const mission = availableMissions.find(m => m.id === missionId);
    const missionProgress = playerMissions[missionId];
    
    if (!mission || !missionProgress?.completed || missionProgress.claimed) return false;

    try {
      // Dar recompensas ao jogador
      await updatePlayer({
        xp: player.xp + mission.rewards.xp,
        gold: player.gold + mission.rewards.gold
      });

      // Marcar missão como reivindicada
      const updatedMissions = { ...playerMissions };
      updatedMissions[missionId].claimed = true;
      setPlayerMissions(updatedMissions);
      
      // Salvar no servidor
      await saveSingleMissionToServer(missionId, updatedMissions[missionId]);
      // Backup no localStorage
      saveMissionsToLocalStorage(updatedMissions);

      showNotification(
        `💰 Recompensa coletada: +${mission.rewards.xp} XP, +${mission.rewards.gold} Ouro!`, 
        'success'
      );
      
      return true;
    } catch (error) {
      console.error('Erro ao coletar recompensa:', error);
      showNotification('Erro ao coletar recompensa da missão', 'error');
      return false;
    }
  };

  // Obter missões ativas (não reivindicadas)
  const getActiveMissions = () => {
    return availableMissions.filter(mission => {
      const progress = playerMissions[mission.id];
      return !progress?.claimed;
    });
  };

  // Obter missões completadas mas não reivindicadas
  const getCompletedMissions = () => {
    return availableMissions.filter(mission => {
      const progress = playerMissions[mission.id];
      return progress?.completed && !progress?.claimed;
    });
  };

  // Fetch player by ID from API
  const fetchPlayerById = async (playerId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/players/${playerId}`);

      if (!response.ok) {
        // Se o jogador não for encontrado, limpar localStorage
        if (response.status === 404) {
          localStorage.removeItem('gladiator_player_id');
        }
        throw new Error('Failed to fetch player data');
      }

      const playerData = await response.json();

      // Converter jogador do banco para o formato usado pelo frontend
      const formattedPlayer = formatPlayerData(playerData);
      setPlayer(formattedPlayer);

    } catch (error) {
      console.error('Error fetching player:', error);
      showNotification('Erro ao carregar dados do jogador', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Converter formato do banco para o formato usado pelo frontend
  const formatPlayerData = (dbPlayer) => {
    return {
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
      rankedPoints: dbPlayer.rankedPoints || 0
    };
  };

  // Converter formato do frontend para o formato do banco
  const formatPlayerForDB = (frontendPlayer) => {
    const { id, ...playerData } = frontendPlayer;
    return playerData;
  };

  // Show notification with auto-hide
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });

    // Auto hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Create or log in a player
  const createPlayer = async (name) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/players/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to create/login player');
      }

      const playerData = await response.json();

      // Salvar ID do jogador no localStorage para recuperação posterior
      localStorage.setItem('gladiator_player_id', playerData.id);

      // Formatar dados do jogador para o formato do frontend
      const formattedPlayer = formatPlayerData(playerData);
      setPlayer(formattedPlayer);

      const isNewPlayer = playerData.xp === 0 && playerData.level === 1;
      showNotification(
        isNewPlayer
          ? `Bem-vindo, ${name}!`
          : `Bem-vindo de volta, ${name}!`,
        'success'
      );

      return formattedPlayer;
    } catch (error) {
      console.error('Error creating/logging in player:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update player stats in database
  const updatePlayer = async (updates) => {
    if (!player) return null;

    // 1) Limita attackSpeed
    if (updates.attackSpeed && updates.attackSpeed > 3) {
      updates.attackSpeed = 3;
    }

    try {
      // 2) Mescla corretamente o novo estado
      const updatedPlayer = { ...player, ...updates };
      setPlayer(updatedPlayer);

      // 3) Persiste no servidor e aguarda a resposta
      const response = await fetch(`${API_URL}/players/${player.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formatPlayerForDB(updatedPlayer)),
      });

      if (!response.ok) {
        console.error('Erro na resposta do servidor:', response.status);
        // Em caso de erro, podemos atualizar o estado local com os dados do servidor para consistência
        throw new Error('Falha ao atualizar o jogador no servidor');
      }

      return updatedPlayer;
    } catch (err) {
      console.error('Erro ao atualizar no servidor', err);
      // No caso de um erro, podemos tentar buscar o estado atual do servidor
      fetchPlayerById(player.id);
      throw err;
    }
  };

  // Resetar atributos do jogador com base no nível atual
  const resetStats = () => {
    if (!player) return;

    const baseStats = generatePlayerStats(player.level);

    // Salvar o HP atual antes do reset
    const currentHp = player.hp;

    // Calcular o novo maxHp para o nível atual
    const newMaxHp = baseStats.hp;

    // Garantir que o HP atual não ultrapasse o novo maxHp
    const adjustedHp = Math.min(currentHp, newMaxHp);

    updatePlayer({
      maxHp: newMaxHp,
      hp: adjustedHp, // Mantém o HP atual, mas limita ao novo maxHp
      attack: baseStats.attack,
      physicalDefense: baseStats.physicalDefense,
      critChance: baseStats.critChance,
      attackSpeed: Math.min(3, baseStats.attackSpeed),
      attributePoints: 3 * player.level // Recalcula pontos
    });

    showNotification("Atributos reiniciados!", "info");
  };

  // Log the player out (clear data)
  const logout = () => {
    localStorage.removeItem('gladiator_player_id');
    if (player) {
      localStorage.removeItem(`gladiator_missions_${player.id}`);
    }
    setPlayer(null);
    setPlayerMissions({});
    showNotification('Você saiu do jogo', 'info');
  };

  // Level up the player
  const levelUp = async () => {
    if (!player) return;

    const newLevel = player.level + 1;
    const xpToNextLevel = Math.floor(player.xpToNextLevel * 1.1);

    try {
      // Realizar atualização de nível em uma única operação
      const updatedPlayer = await updatePlayer({
        level: newLevel,
        attributePoints: (player.attributePoints || 0) + 3, // 3 pontos por nível
        xpToNextLevel: xpToNextLevel,
        // Restaurar HP completo ao subir de nível
        hp: player.maxHp
      });

      showNotification(`Avançou para o nível ${newLevel}! Ganhou 3 pontos de atributo.`, 'success');
      return updatedPlayer;
    } catch (error) {
      console.error('Erro ao subir de nível:', error);
      showNotification('Ocorreu um erro ao subir de nível.', 'error');
    }
  };

  // Handle battle function
  const handleBattle = (enemy) => {
    if (!player) return { success: false, combatLog: [] };

    // Clone the enemy and player for combat
    const enemyClone = { ...enemy, currentHp: enemy.hp };
    const playerClone = { ...player, currentHp: player.hp };

    // Combat log
    const combatLog = [];

    // Tempo de simulação (em segundos)
    let battleTime = 0;
    const timeIncrement = 0.1; // Incrementos de 0.1 segundos

    // Contadores para ataques baseados na velocidade
    let playerAttackCounter = 0;
    let enemyAttackCounter = 0;

    combatLog.push({ type: 'system', message: `Combate iniciado contra ${enemy.name}!` });

    // Combat loop - agora simulamos o tempo passando
    while (playerClone.currentHp > 0 && enemyClone.currentHp > 0) {
      battleTime += timeIncrement;

      // Verificar se é hora do jogador atacar com base na velocidade de ataque
      // attackSpeed 1.0 = ataque a cada 1 segundo
      // attackSpeed 2.0 = ataque a cada 0.5 segundos
      if (battleTime >= (playerAttackCounter + 1) / playerClone.attackSpeed) {
        playerAttackCounter++;

        // Player attack
        let playerBaseDamage = Math.max(1, playerClone.attack);
        // Aplicar a defesa do inimigo como redução percentual (0,1% por ponto, máx 30%)
        const enemyDamageReduction = Math.min(30, enemyClone.defense * 0.1);
        let playerDamage = Math.floor(playerBaseDamage * (1 - enemyDamageReduction / 100));
        playerDamage = Math.max(1, playerDamage); // Garantir dano mínimo de 1

        // Verificar acerto crítico (dobro de dano)
        const playerCrit = Math.random() * 100 < playerClone.critChance;
        const finalPlayerDamage = playerCrit ? Math.floor(playerDamage * 2) : playerDamage;

        enemyClone.currentHp -= finalPlayerDamage;

        combatLog.push({
          type: 'player',
          message: `Você causou ${finalPlayerDamage} de dano${playerCrit ? ' (crítico!)' : ''} ao ${enemy.name}.`,
          attackSpeed: playerClone.attackSpeed
        });

        // Check if enemy is defeated
        if (enemyClone.currentHp <= 0) {
          combatLog.push({ type: 'player', message: `Você derrotou o ${enemy.name}!` });
          break;
        }
      }

      // Verificar se é hora do inimigo atacar com base na velocidade de ataque
      if (battleTime >= (enemyAttackCounter + 1) / enemyClone.attackSpeed) {
        enemyAttackCounter++;

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
            message: `${enemy.name} causou ${finalEnemyDamage} de dano${enemyCrit ? ' (crítico!)' : ''} a você. (Redução de dano: ${damageReduction.toFixed(1)}%)`,
            attackSpeed: enemyClone.attackSpeed
          });
        } else {
          combatLog.push({
            type: 'enemy',
            message: `${enemy.name} causou ${finalEnemyDamage} de dano${enemyCrit ? ' (crítico!)' : ''} a você.`,
            attackSpeed: enemyClone.attackSpeed
          });
        }

        // Check if player is defeated
        if (playerClone.currentHp <= 0) {
          combatLog.push({ type: 'enemy', message: `Você foi derrotado por ${enemy.name}!` });
          break;
        }
      }

      // Evitar loops infinitos - limite de 100 segundos de combate
      if (battleTime > 100) {
        combatLog.push({ type: 'system', message: `O combate foi muito longo e terminou em empate!` });
        break;
      }
    }

    // Combat result
    let result;
    const isVictory = playerClone.currentHp > 0;
    
    if (!isVictory) {
      // Player defeated
      result = {
        type: 'defeat',
        title: 'Derrota!',
        message: `Você foi derrotado por ${enemy.name}.`
      };

      // Update player HP (minimum 1)
      updatePlayer({ hp: 1 });
    } else {
      // Player won - atualizar progresso das missões
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
          message: `Você derrotou ${enemy.name}, subiu para o nível ${newLevel}, ganhou ${attributePointsGained} pontos de atributo`
        };
      } else {
        result = {
          type: 'victory',
          title: 'Vitória!',
          message: `Você derrotou ${enemy.name}, ganhou ${enemy.rewardXP} XP`
        };
      }

      // Use gold reward multiplier if available
      const goldMultiplier = enemy.rewardGoldMultiplier || 1;
      const rewardGold = Math.floor(enemy.level * 10 * (1 + Math.random() * 0.5) * goldMultiplier);
      result.message += ` e mais ${rewardGold} de ouro!`;

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

  // Context value
  const contextValue = {
    player,
    loading,
    createPlayer,
    updatePlayer,
    logout,
    levelUp,
    handleBattle,
    notification,
    showNotification,
    resetStats,
    // Missões
    playerMissions,
    availableMissions,
    updateMissionProgress,
    claimMissionReward,
    getActiveMissions,
    getCompletedMissions
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}