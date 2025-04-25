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
    }
    
    // Usa o multiplicador de recompensa de ouro se disponível
    const goldMultiplier = enemy.rewardGoldMultiplier || 1;
    const rewardGold = Math.floor(enemy.level * 10 * (1 + Math.random() * 0.5) * goldMultiplier);
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