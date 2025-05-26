// src/pages/Torneio.jsx
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import CombatModal from '../components/CombatModal';
import './Torneio.css';

export default function Torneio() {
  const { player, updatePlayer } = useGame();
  const [rankingVisible, setRankingVisible] = useState(false);
  const [ranking, setRanking] = useState([]);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [showCombatModal, setShowCombatModal] = useState(false);
  const [combatLog, setCombatLog] = useState([]);
  const [combatResult, setCombatResult] = useState(null);
  const [loadingOpponent, setLoadingOpponent] = useState(false);

  const TOP_N = 5; // número de posições a exibir no ranking

  const fetchRanking = async () => {
    setLoading(true);
    try {
      // 1) Busca ranking completo do servidor
      const resTop = await fetch('http://localhost:4000/api/ranking');
      const fullRanking = await resTop.json();

      // 2) Guarda os TOP_N primeiros
      const topRanking = fullRanking.slice(0, TOP_N);
      setRanking(topRanking);

      // 3) Se o player estiver logado e não estiver no top, calcula posição real
      if (player?.id && !topRanking.find(p => p.id === player.id)) {
        const playerIndex = fullRanking.findIndex(p => p.id === player.id);
        if (playerIndex >= 0) setPlayerPosition(playerIndex + 1);
      } else {
        setPlayerPosition(null);
      }
    } catch (err) {
      console.error('Erro ao carregar ranking:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRanking = () => {
    if (!rankingVisible) fetchRanking();
    setRankingVisible(v => !v);
  };

  const findOpponent = async () => {
    if (!player?.id) return;
    
    setLoadingOpponent(true);
    try {
      const response = await fetch(`http://localhost:4000/api/tournament/opponent/${player.id}`);
      
      if (!response.ok) {
        throw new Error('Falha ao buscar oponente');
      }
      
      const opponentData = await response.json();
      
      // Converter para o formato esperado pela batalha
      const formattedOpponent = {
        id: opponentData.id,
        name: opponentData.name,
        level: opponentData.level,
        hp: opponentData.maxHp,
        attack: opponentData.attack,
        defense: opponentData.physicalDefense,
        critChance: opponentData.critChance,
        attackSpeed: opponentData.attackSpeed,
        // Imagem placeholder
        image: '/api/placeholder/150/150',
        rewardXP: 0, // Sem recompensa de XP em batalhas PVP
        rewardGoldMultiplier: 0 // Sem recompensa de ouro em batalhas PVP
      };
      
      setOpponent(formattedOpponent);
      return formattedOpponent;
    } catch (err) {
      console.error('Erro ao buscar oponente:', err);
      return null;
    } finally {
      setLoadingOpponent(false);
    }
  };

  const startTournamentBattle = async () => {
    // Buscar oponente
    const battleOpponent = await findOpponent();
    if (!battleOpponent) return;
    
    // Iniciar batalha
    const battleResult = handleTournamentBattle(battleOpponent);
    setCombatLog(battleResult.combatLog);
    setCombatResult(battleResult.result);
    setShowCombatModal(true);
    
    // Registrar batalha no servidor
    registerBattleResult(battleResult.success, battleOpponent.id, battleResult.combatLog);
  };

  // Esta função ainda existe mas não será mais acessível pelo botão
  const retryTournamentBattle = async () => {
    // Buscar novo oponente
    const battleOpponent = await findOpponent();
    if (!battleOpponent) return;
    
    // Iniciar nova batalha
    const battleResult = handleTournamentBattle(battleOpponent);
    setCombatLog(battleResult.combatLog);
    setCombatResult(battleResult.result);
    setShowCombatModal(true);
    
    // Registrar batalha no servidor
    registerBattleResult(battleResult.success, battleOpponent.id, battleResult.combatLog);
  };

  const registerBattleResult = async (playerWon, opponentId, battleLog) => {
    try {
      const winnerId = playerWon ? player.id : opponentId;
      
      const response = await fetch('http://localhost:4000/api/tournament/battle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1Id: player.id,
          player2Id: opponentId,
          winnerId: winnerId,
          battleLog: battleLog
        }),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao registrar resultado da batalha');
      }
      
      // Atualizar pontuação local do jogador para feedback imediato
      const pointsChange = playerWon ? 30 : -10;
      const newRankedPoints = Math.max(0, (player.rankedPoints || 0) + pointsChange);
      
      // Atualiza o estado local do jogador (sem atualizar o servidor, pois já foi feito pelo endpoint)
      // Isso é apenas para atualizar a interface imediatamente
      if (player.rankedPoints !== undefined) {
        player.rankedPoints = newRankedPoints;
      }
      
      // Após a batalha, atualizar o ranking
      if (rankingVisible) {
        fetchRanking();
      }
    } catch (err) {
      console.error('Erro ao registrar batalha:', err);
    }
  };

  const handleTournamentBattle = (enemy) => {
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

    combatLog.push({ type: 'system', message: `Batalha de torneio iniciada contra ${enemy.name}!` });

    // Combat loop - simulação do tempo passando
    while (playerClone.currentHp > 0 && enemyClone.currentHp > 0) {
      battleTime += timeIncrement;

      // Verificar se é hora do jogador atacar com base na velocidade de ataque
      if (battleTime >= (playerAttackCounter + 1) / playerClone.attackSpeed) {
        playerAttackCounter++;

        // Player attack
        let playerBaseDamage = Math.max(1, playerClone.attack);
        // Usar a mesma lógica percentual para defesa dos inimigos
const enemyDamageReduction = Math.min(30, enemyClone.defense * 0.1);
let playerDamage = Math.floor(playerBaseDamage * (1 - enemyDamageReduction / 100));

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
        message: `Você foi derrotado por ${enemy.name}. -10 pontos de ranking.`
      };

      // Update player HP (minimum 1)
      updatePlayer({ hp: 1 });
    } else {
      // Player won
      result = {
        type: 'victory',
        title: 'Vitória!',
        message: `Você derrotou ${enemy.name} e ganhou 30 pontos de ranking!`
      };

      // Atualizar HP do jogador após a batalha
      updatePlayer({ hp: playerClone.currentHp });
    }

    return {
      success: playerClone.currentHp > 0,
      combatLog,
      result
    };
  };

  // Inicialmente carregar o ranking
  useEffect(() => {
    if (player) fetchRanking();
  }, [player]);

  return (
    <div className="tournament-page">
      <h1>🏆 Torneio Gladiador</h1>

      <button onClick={toggleRanking} className="ranking-button">
        {rankingVisible ? 'Ocultar Ranking' : 'Ver Ranking de Gladiadores'}
      </button>

      {rankingVisible && (
        <div className="ranking-list">
          {loading ? (
            <p>Carregando ranking...</p>
          ) : (
            <>
              <h3>Ranking de Pontos</h3>
              <ol>
                {ranking.map((p, i) => (
                  <li key={p.id} className={p.id === player?.id ? "your-position" : ""}>
                    <strong>{i + 1}º</strong> {p.name} – {p.rankedPoints || 0} pontos (Nível {p.level})
                  </li>
                ))}

                {playerPosition && playerPosition > TOP_N && (
                  <>
                    <li className="separator">…</li>
                    <li className="your-position">
                      <strong>{playerPosition}º</strong> {player.name} – {player.rankedPoints || 0} pontos (Nível {player.level})
                    </li>
                  </>
                )}
              </ol>
            </>
          )}
        </div>
      )}

      <div className="tournament-info">
        <h2>📜 Sobre o Torneio</h2>
        <p>
          O torneio é uma competição entre todos os gladiadores cadastrados.
          Enfrente oponentes de nível similar e ganhe pontos de ranking para subir na classificação!
        </p>
        <p>
          <strong>Vitória:</strong> +30 pontos de ranking<br />
          <strong>Derrota:</strong> -10 pontos de ranking
        </p>
      </div>

      <button 
        className="participate-button" 
        onClick={startTournamentBattle}
        disabled={loadingOpponent || player?.hp <= 1}
      >
        {loadingOpponent ? 'Procurando oponente...' : 'Participar do Torneio'}
      </button>

      {player?.hp <= 1 && (
        <p className="health-warning">Você precisa se recuperar antes de batalhar novamente!</p>
      )}

      <CombatModal
        show={showCombatModal}
        onClose={() => setShowCombatModal(false)}
        combatLog={combatLog}
        result={combatResult}
        enemyImage={opponent?.image}
        enemyName={opponent?.name}
        onRetry={retryTournamentBattle}
        showRetryButton={false} /* Esta é a mudança principal - não mostrar o botão de retry */
      />
    </div>
  );
}