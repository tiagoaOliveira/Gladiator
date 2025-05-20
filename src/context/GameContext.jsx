import React, { createContext, useContext, useState, useEffect } from 'react';
import { generatePlayerStats } from '../utils/player';

// API base URL
const API_URL = 'http://localhost:4000/api';

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
  const [loading, setLoading] = useState(false);

  // Check for existing player in localStorage on startup for fallback
  useEffect(() => {
    const savedPlayerId = localStorage.getItem('gladiator_player_id');
    if (savedPlayerId) {
      fetchPlayerById(savedPlayerId);
    }
  }, []);

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
      attributePoints: dbPlayer.attributePoints
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
    setPlayer(null);
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
      success: playerClone.currentHp > 0,
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
    resetStats
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}