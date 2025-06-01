import React, { createContext, useContext, useState, useEffect } from 'react';
import { generatePlayerStats } from '../utils/player';
import { availableMissions } from '../pages/Missoes';

// -----------------------------------------------------------------------------
// Constantes e dados estáticos
// -----------------------------------------------------------------------------

// URL base da API (pode mudar para produção ou outro ambiente)
//const API_URL = 'http://localhost:4000/api';
 const API_URL = 'http://192.168.20.109:4000/api';

// -----------------------------------------------------------------------------
// Criação do contexto e hook personalizado
// -----------------------------------------------------------------------------

// Cria o context do jogo (não passa valor inicial, será definido no Provider)
const GameContext = createContext();

// Hook customizado para acessar o contexto mais facilmente nos componentes
export const useGame = () => useContext(GameContext);

// -----------------------------------------------------------------------------
// Componente Provider
// -----------------------------------------------------------------------------

export function GameProvider({ children }) {
  // Estados principais
  const [player, setPlayer] = useState(null);              // Dados do jogador logado
  const [playerMissions, setPlayerMissions] = useState({}); // Progresso das missões do jogador

  // Notificação (tipo “toast”): show controla visibilidade, message é texto e type é css (info, success, error)
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'info'
  });

  const [loading, setLoading] = useState(false);           // Indicador de carregamento (spinner, etc.)

  // ---------------------------------------------------------------------------
  // Funções de notificação
  // ---------------------------------------------------------------------------

  /**
   * Exibe uma notificação e oculta automaticamente após 3 segundos.
   * @param {string} message - Texto da notificação.
   * @param {'info'|'success'|'error'} type - Tipo para estilização.
   */
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    // Oculta após 3 segundos
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 3000);
  };

  // ---------------------------------------------------------------------------
  // Efeitos (useEffect) para carregar dados iniciais
  // ---------------------------------------------------------------------------

  // Ao montar o Provider, tenta recuperar o ID do jogador salvo no localStorage
  useEffect(() => {
    const savedPlayerId = localStorage.getItem('gladiator_player_id');
    if (savedPlayerId) {
      fetchPlayerById(savedPlayerId);
    }
  }, []);

  // Quando o objeto player é definido, carrega as missões associadas
  useEffect(() => {
    if (player) {
      loadPlayerMissions();
    }
  }, [player]);

  // ---------------------------------------------------------------------------
  // Funções relacionadas a missões
  // ---------------------------------------------------------------------------

  /**
   * Carrega o progresso das missões do jogador no servidor.
   * Se falhar, faz fallback para o localStorage.
   */
  const loadPlayerMissions = async () => {
    if (!player) return;

    try {
      const response = await fetch(`${API_URL}/players/${player.id}/missions`);
      if (response.ok) {
        const missions = await response.json();
        setPlayerMissions(missions);
      } else {
        console.error('Erro ao carregar missões do servidor');
        loadPlayerMissionsFromLocalStorage();
      }
    } catch (error) {
      console.error('Erro ao conectar com o servidor para carregar missões:', error);
      loadPlayerMissionsFromLocalStorage();
    }
  };

  /**
   * Fallback: carrega missões do localStorage ou inicializa tudo zerado
   */
  const loadPlayerMissionsFromLocalStorage = () => {
    const savedMissions = localStorage.getItem(`gladiator_missions_${player.id}`);
    if (savedMissions) {
      setPlayerMissions(JSON.parse(savedMissions));
    } else {
      // Se não tiver nada, inicializa todas as missões com progresso 0
      const initialMissions = {};
      availableMissions.forEach(mission => {
        initialMissions[mission.id] = { progress: 0, completed: false, claimed: false };
      });
      setPlayerMissions(initialMissions);
      saveMissionsToServer(initialMissions);
    }
  };

  /**
   * Salva todo o progresso das missões no servidor.
   * Em caso de erro, faz fallback para salvar no localStorage.
   * @param {object} missions - Objeto com todas as missões e progresso.
   */
  const saveMissionsToServer = async (missions) => {
    if (!player) return;

    try {
      const response = await fetch(`${API_URL}/players/${player.id}/missions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missions),
      });

      if (!response.ok) {
        console.error('Erro ao salvar missões no servidor');
        saveMissionsToLocalStorage(missions);
      }
    } catch (error) {
      console.error('Erro ao conectar com o servidor para salvar missões:', error);
      saveMissionsToLocalStorage(missions);
    }
  };

  /**
   * Fallback: salva progresso das missões no localStorage
   * @param {object} missions - Objeto com todas as missões e progresso.
   */
  const saveMissionsToLocalStorage = (missions) => {
    if (player) {
      localStorage.setItem(`gladiator_missions_${player.id}`, JSON.stringify(missions));
    }
  };

  /**
   * Salva apenas uma missão específica no servidor (usado ao atualizar progresso pontual).
   * @param {number} missionId - ID da missão a salvar.
   * @param {object} missionData - Dados (progress/completed/claimed) da missão.
   */
  const saveSingleMissionToServer = async (missionId, missionData) => {
    if (!player) return;

    try {
      const response = await fetch(`${API_URL}/players/${player.id}/missions/${missionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missionData),
      });

      if (!response.ok) {
        console.error('Erro ao salvar missão no servidor');
      }
    } catch (error) {
      console.error('Erro ao conectar com o servidor para salvar missão:', error);
    }
  };

  /**
   * Normaliza nome de inimigo para comparar strings (minúsculas, sem espaços extras).
   * @param {string} name - Nome do inimigo.
   * @returns {string} Nome normalizado.
   */
  const normalizeEnemyName = (name) => {
    return name.toLowerCase().trim();
  };

  /**
   * Atualiza progresso das missões após cada vitória contra um inimigo.
   * Recebe o nome do inimigo e se houve vitória.
   * @param {string} enemyName - Nome do inimigo derrotado.
   * @param {boolean} isVictory - Se o jogador venceu o combate.
   */
  const updateMissionProgress = (enemyName, isVictory) => {
    if (!isVictory || !player) return;

    // Copia o objeto de missões atual
    const updatedMissions = { ...playerMissions };
    let hasUpdates = false;

    availableMissions.forEach(mission => {
      // Se missão já foi completada, ignora
      if (updatedMissions[mission.id]?.completed) return;

      let applies = false;

      // Verifica se a missão é "qualquer inimigo" ou se o nome bate
      if (mission.target === "any") {
        applies = true;
      } else {
        const normalizedTarget = normalizeEnemyName(mission.target);
        const normalizedEnemy = normalizeEnemyName(enemyName);
        applies = normalizedTarget === normalizedEnemy;
      }

      if (applies) {
        // Se não houver entrada para a missão, inicializa
        if (!updatedMissions[mission.id]) {
          updatedMissions[mission.id] = { progress: 0, completed: false, claimed: false };
        }

        // Incrementa progresso
        updatedMissions[mission.id].progress += 1;
        hasUpdates = true;

        // Verifica se atingiu quantidade necessária para completar a missão
        if (updatedMissions[mission.id].progress >= mission.targetCount && !updatedMissions[mission.id].completed) {
          updatedMissions[mission.id].completed = true;
          showNotification(`🎯 Missão "${mission.title}" completada!`, 'success');
        }

        // Salva apenas essa missão no servidor
        saveSingleMissionToServer(mission.id, updatedMissions[mission.id]);
      }
    });

    if (hasUpdates) {
      setPlayerMissions(updatedMissions);
      saveMissionsToLocalStorage(updatedMissions);
    }
  };

  /**
   * Coleta a recompensa de uma missão, adicionando XP e ouro ao jogador.
   * Retorna true se a recompensa foi coletada com sucesso.
   * @param {number} missionId - ID da missão a reivindicar.
   * @returns {Promise<boolean>}
   */
  const claimMissionReward = async (missionId) => {
    const mission = availableMissions.find(m => m.id === missionId);
    const missionProgress = playerMissions[missionId];

    // Só segue se a missão existir, estiver completada e não tiver sido reivindicada ainda
    if (!mission || !missionProgress?.completed || missionProgress.claimed) return false;

    try {
      // Dá recompensas ao jogador
      await updatePlayer({
        xp: player.xp + mission.rewards.xp,
        gold: player.gold + mission.rewards.gold
      });

      // Marca como reivindicada
      const updatedMissions = { ...playerMissions };
      updatedMissions[missionId].claimed = true;
      setPlayerMissions(updatedMissions);

      // Salva no servidor e localStorage
      await saveSingleMissionToServer(missionId, updatedMissions[missionId]);
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

  /**
   * Retorna lista de missões que ainda não foram reivindicadas (ativas).
   * @returns {Array}
   */
  const getActiveMissions = () => {
    return availableMissions.filter(mission => {
      const progress = playerMissions[mission.id];
      return !progress?.claimed;
    });
  };

  /**
   * Retorna lista de missões completadas mas ainda não reivindicadas.
   * @returns {Array}
   */
  const getCompletedMissions = () => {
    return availableMissions.filter(mission => {
      const progress = playerMissions[mission.id];
      return progress?.completed && !progress?.claimed;
    });
  };

  // ---------------------------------------------------------------------------
  // Funções relacionadas ao jogador (fetch, criação, atualização, logout, etc.)
  // ---------------------------------------------------------------------------

  /**
   * Busca dados do jogador pelo ID na API e formata para o frontend.
   * @param {string} playerId - ID do jogador.
   */
  const fetchPlayerById = async (playerId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/players/${playerId}`);

      if (!response.ok) {
        // Se não encontrar o jogador (404), limpa localStorage
        if (response.status === 404) {
          localStorage.removeItem('gladiator_player_id');
        }
        throw new Error('Failed to fetch player data');
      }

      const playerData = await response.json();
      const formattedPlayer = formatPlayerData(playerData);
      setPlayer(formattedPlayer);

    } catch (error) {
      console.error('Error fetching player:', error);
      showNotification('Erro ao carregar dados do jogador', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Converte o objeto recebido do banco (banco de dados) para o formato usado no frontend.
   * @param {object} dbPlayer - Objeto bruto vindo da API.
   * @returns {object} Jogador formatado para o frontend.
   */
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
    speedBoost: !!dbPlayer.speedBoost
  });

  /**
   * Converte o objeto do frontend para o formato esperado pelo banco de dados (remove o campo id).
   * @param {object} frontendPlayer - Objeto de jogador no estado do React.
   * @returns {object} Objeto para enviar à API.
   */
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


  /**
   * Cria ou faz login de um jogador com base no nome.
   * Retorna o objeto do jogador formatado.
   * @param {string} name - Nome do jogador a criar/logar.
   * @returns {Promise<object>}
   */
  const createPlayer = async (name) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/players/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to create/login player');
      }

      const playerData = await response.json();
      // Salva o ID no localStorage para recuperar depois
      localStorage.setItem('gladiator_player_id', playerData.id);

      const formattedPlayer = formatPlayerData(playerData);
      setPlayer(formattedPlayer);

      // Mensagem de boas-vindas (diferencia novo/veterano)
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

  /**
   * Se atualizar attackSpeed, considera o limite baseado no speedBoost.
   * Retorna o jogador atualizado.
   * @param {object} updates - Campos a modificar no jogador (pode conter xp, gold, hp etc.).
   * @returns {Promise<object|null>}
   */
  const updatePlayer = async (updates) => {
    if (!player) return null;

    // Limita attackSpeed baseado no speedBoost
    if (updates.attackSpeed !== undefined) {
      const currentPlayer = { ...player, ...updates };
      const maxSpeed = currentPlayer.speedBoost ? 3.5 : 3;
      if (updates.attackSpeed > maxSpeed) {
        updates.attackSpeed = maxSpeed;
      }
    }

    try {
      // Monta o novo estado e atualiza localmente primeiro
      const updatedPlayer = { ...player, ...updates };
      setPlayer(updatedPlayer);

      // Persiste no servidor
      const response = await fetch(`${API_URL}/players/${player.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formatPlayerForDB(updatedPlayer)),
      });

      if (!response.ok) {
        console.error('Erro na resposta do servidor:', response.status);
        throw new Error('Falha ao atualizar o jogador no servidor');
      }

      return updatedPlayer;
    } catch (err) {
      console.error('Erro ao atualizar no servidor', err);
      // Em caso de erro, tenta recarregar dados do servidor para consistência
      fetchPlayerById(player.id);
      throw err;
    }
  };

  /**
   * Redefine os atributos do jogador (stats) com base no nível atual.
   * Usa função generatePlayerStats para obter estatísticas baseadas no nível.
   */
  const resetStats = () => {
    if (!player) return;

    const baseStats = generatePlayerStats(player.level);

    // Salva HP atual e calcula novo maxHp
    const currentHp = player.hp;
    const newMaxHp = baseStats.hp;
    // Garante que HP atual não exceda o novo maxHp
    const adjustedHp = Math.min(currentHp, newMaxHp);

    // ─── Defense base ───
    let defParaAtualizar = baseStats.physicalDefense;
    // Se o jogador tiver Reflect ativo, adiciona +50
    if (player.reflect) {
      defParaAtualizar = baseStats.physicalDefense + 50;
    }

    // ─── AttackSpeed ───

    let newAttackSpeed = Math.min(3, baseStats.attackSpeed);
    if (player.speedBoost) {
      newAttackSpeed = Math.min(newAttackSpeed + 0.5, 3.5);
    }

    // Se Critical x3 está ativo, adiciona +10% ao critChance base
    let critParaAtualizar = baseStats.critChance;
    if (player.criticalX3) {
      critParaAtualizar = Math.min(critParaAtualizar + 10, 100);
    }
    // AttackSpeed: manter +0.5 se speedBoost ativo
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

  /**
   * Faz logout do jogador removendo dados do localStorage e limpando estados.
   */
  const logout = () => {
    localStorage.removeItem('gladiator_player_id');
    if (player) {
      localStorage.removeItem(`gladiator_missions_${player.id}`);
    }
    setPlayer(null);
    setPlayerMissions({});
    showNotification('Você saiu do jogo', 'info');
  };

  /**
   * Sobe o jogador de nível (level up), atualiza XP restante e pontos de atributo.
   */
  const levelUp = async () => {
    if (!player) return;

    const newLevel = player.level + 1;
    const xpToNextLevel = Math.floor(player.xpToNextLevel * 1.02);

    try {
      const updatedPlayer = await updatePlayer({
        level: newLevel,
        attributePoints: (player.attributePoints || 0) + 3, // 3 pontos por nível
        xpToNextLevel: xpToNextLevel,
        hp: player.maxHp // restaura HP ao máximo
      });

      showNotification(`Avançou para o nível ${newLevel}! Ganhou 3 pontos de atributo.`, 'success');
      return updatedPlayer;
    } catch (error) {
      console.error('Erro ao subir de nível:', error);
      showNotification('Ocorreu um erro ao subir de nível.', 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // Função principal de batalha
  // -----------------------------------------------------------------------------

  /**
   * Função que simula o combate entre jogador e inimigo.
   * Recebe o objeto enemy e retorna um objeto com detalhes do resultado (logs, vitória/derrota, etc.).
   * @param {object} enemy - Objeto contendo stats do inimigo (hp, attack, defense, critChance, attackSpeed, level, rewardXP, rewardGoldMultiplier, name).
   * @returns {object} { success, combatLog, result }
   */
  const handleBattle = (enemy) => {
    if (!player) return { success: false, combatLog: [], result: null };

    // Cria clones para evitar mutação direta dos objetos originais
    const enemyClone = { ...enemy, currentHp: enemy.hp };
    const playerClone = { ...player, currentHp: player.hp };
    if (player.speedBoost) {
      playerClone.attackSpeed = Math.min(3.5, playerClone.attackSpeed + 0.5);
    }


    const combatLog = [];
    let battleTime = 0;
    const timeIncrement = 0.1; // simula o tempo em segundos

    let playerAttackCounter = 0;
    let enemyAttackCounter = 0;

    // Mensagem inicial no log de combate
    combatLog.push({ type: 'system', message: `Combate iniciado contra ${enemy.name}!` });

    // Loop principal do combate (até o HP chegar a zero ou timeout)
    while (playerClone.currentHp > 0 && enemyClone.currentHp > 0) {
      battleTime += timeIncrement;

      // Checa se é hora do jogador atacar baseado na attackSpeed
      if (battleTime >= (playerAttackCounter + 1) / playerClone.attackSpeed) {
        playerAttackCounter++;

        // Cálculo de dano do jogador
        let playerBaseDamage = Math.max(1, playerClone.attack);
        const enemyDamageReduction = Math.min(30, enemyClone.defense * 0.1);
        let playerDamage = Math.floor(playerBaseDamage * (1 - enemyDamageReduction / 100));
        playerDamage = Math.max(1, playerDamage);

        // Sorteio de crítico (dobra dano)
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

        // Se inimigo for derrotado, sai do loop
        if (enemyClone.currentHp <= 0) {
          break;
        }
      }

      // Checa se é hora do inimigo atacar baseado na attackSpeed dele
      if (battleTime >= (enemyAttackCounter + 1) / enemyClone.attackSpeed) {
        enemyAttackCounter++;

        const enemyBaseDamage = Math.max(1, enemyClone.attack);
        const damageReduction = Math.min(30, playerClone.physicalDefense * 0.1);
        let enemyDamage = Math.floor(enemyBaseDamage * (1 - damageReduction / 100));

        // Crítico do inimigo (1.5x)
        const enemyCrit = Math.random() * 100 < enemyClone.critChance;
        const finalEnemyDamage = enemyCrit ? Math.floor(enemyDamage * 1.5) : enemyDamage;

        playerClone.currentHp -= finalEnemyDamage;

        // Log do ataque inimigo, mostrando redução se houver
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
        if (playerClone.reflect && finalEnemyDamage > 0) {
          const reflected = Math.floor(finalEnemyDamage * 0.2);
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


        // Se jogador for derrotado, sai do loop
        if (playerClone.currentHp <= 0) {
          combatLog.push({ type: 'enemy', message: `Você foi derrotado por ${enemy.name}!` });
          break;
        }
      }

      // Prevenção: se o combate demorar mais de 100 segundos, termina em empate
      if (battleTime > 100) {
        combatLog.push({ type: 'system', message: `O combate foi muito longo e terminou em empate!` });
        break;
      }
    }

    // Determina resultado final e ajusta stats do jogador
    const isVictory = playerClone.currentHp > 0;
    let result = null;

    if (!isVictory) {
      // Derrota: garante que o jogador termine com ao menos 1 de HP e atualiza no servidor
      result = {
        type: 'defeat',
        title: 'Derrota!',
        message: `Você foi derrotado por ${enemy.name}.`
      };
      updatePlayer({ hp: 1 });
    } else {
      // Vitória: atualiza progresso das missões antes de calcular recompensas
      updateMissionProgress(enemy.name, true);

      // Cálculo de experiência e possibilidade de level up
      const newXP = player.xp + enemy.rewardXP;
      let newLevel = player.level;
      let newXpToNext = player.xpToNextLevel;
      let remainingXP = newXP;
      let leveledUp = false;
      let attributePointsGained = 0;

      // Loop para nivelamentos múltiplos caso XP seja suficiente
      while (remainingXP >= newXpToNext) {
        remainingXP -= newXpToNext;
        newLevel += 1;
        newXpToNext = Math.floor(newXpToNext * 1.2);
        attributePointsGained += 3;
        leveledUp = true;
      }

      // Se subiu de nível, restaura HP inteiro e ajusta mensagem
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

      // Cálculo de ouro baseado no nível do inimigo e modificadores
      const goldMultiplier = enemy.rewardGoldMultiplier || 1;
      const rewardGold = Math.floor(enemy.level * 4 * (1 + Math.random() * 0.5) * goldMultiplier);
      result.message += ` +${rewardGold} de ouro!`;

      // Aplica todas as atualizações ao jogador de uma só vez
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

  // ---------------------------------------------------------------------------
  // Exposição dos valores e funções via Context
  // -----------------------------------------------------------------------------

  const contextValue = {
    player,
    loading,
    createPlayer,
    updatePlayer,
    logout,
    levelUp,
    handleBattle,
    notification,
    showNotification,    // Agora expomos showNotification
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
