// src/pages/Torneio.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import CombatModal from '../components/CombatModal';
import './Torneio.css';

/** Define os elos e seus intervalos de pontos (min e max). */
const TIERS = [
  { name: 'Bronze', min: 0, max: 299, color: '#cd7f32' },
  { name: 'Prata', min: 300, max: 599, color: '#c0c0c0' },
  { name: 'Ouro', min: 600, max: 999, color: '#ffd700' },
  { name: 'Diamante', min: 1000, max: 1399, color: '#b9f2ff' },
  { name: 'Mestre', min: 1400, max: Infinity, color: '#ff4500' }
];

const API_BASE_URL = 'http://192.168.20.109:4000/api';
const VICTORY_POINTS = 30;
const DEFEAT_POINTS = -10;
const TOP_N = 5;

export default function Torneio() {
  const { player, updatePlayer } = useGame();

  // Estados do ranking
  const [rankingVisible, setRankingVisible] = useState(false);
  const [ranking, setRanking] = useState([]);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados da batalha
  const [opponent, setOpponent] = useState(null);
  const [showCombatModal, setShowCombatModal] = useState(false);
  const [combatLog, setCombatLog] = useState([]);
  const [combatResult, setCombatResult] = useState(null);
  const [loadingOpponent, setLoadingOpponent] = useState(false);

  // Estados do modal de elos
  const [showTierModal, setShowTierModal] = useState(false);
  const [allPlayers, setAllPlayers] = useState([]);
  const [tieredPlayers, setTieredPlayers] = useState([]);
  const [currentTierIndex, setCurrentTierIndex] = useState(0);

  // Função para buscar ranking completo
  const fetchRanking = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ranking`);
      if (!response.ok) throw new Error('Falha ao buscar ranking');

      const fullRanking = await response.json();
      const topRanking = fullRanking.slice(0, TOP_N);
      setRanking(topRanking);

      // Calcular posição do jogador se não estiver no top
      if (player?.id && !topRanking.find(p => p.id === player.id)) {
        const playerIndex = fullRanking.findIndex(p => p.id === player.id);
        setPlayerPosition(playerIndex >= 0 ? playerIndex + 1 : null);
      } else {
        setPlayerPosition(null);
      }
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setLoading(false);
    }
  }, [player?.id]);

  // Função para abrir modal de elos
  const openTierModal = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ranking`);
      if (!response.ok) throw new Error('Falha ao buscar ranking');

      const fullRanking = await response.json();
      setAllPlayers(fullRanking);

      // Agrupar jogadores por tier
      const grouped = TIERS.map(tier =>
        fullRanking.filter(p => {
          const pts = p.rankedPoints || 0;
          return pts >= tier.min && pts <= tier.max;
        })
      );
      setTieredPlayers(grouped);

      // Determinar tier do jogador atual
      const myPoints = player?.rankedPoints ?? 0;
      const myTierIdx = TIERS.findIndex(t => myPoints >= t.min && myPoints <= t.max);
      setCurrentTierIndex(myTierIdx >= 0 ? myTierIdx : 0);

      setShowTierModal(true);
    } catch (error) {
      console.error('Erro ao carregar ranking completo:', error);
    }
  };

  const closeTierModal = () => setShowTierModal(false);
  const nextTier = () => setCurrentTierIndex(idx => Math.min(idx + 1, TIERS.length - 1));
  const prevTier = () => setCurrentTierIndex(idx => Math.max(idx - 1, 0));

  // Função para buscar oponente
  const findOpponent = async () => {
    if (!player?.id) return null;

    setLoadingOpponent(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tournament/opponent/${player.id}`);
      if (!response.ok) throw new Error('Falha ao buscar oponente');

      const opponentData = await response.json();
      return {
        id: opponentData.id,
        name: opponentData.name,
        level: opponentData.level,
        hp: opponentData.maxHp,
        attack: opponentData.attack,
        defense: opponentData.physicalDefense,
        critChance: opponentData.critChance,
        attackSpeed: opponentData.attackSpeed,
        reflect: opponentData.reflect || false,
        criticalX3: opponentData.criticalX3 || false,
        speedBoost: opponentData.speedBoost || false,
        image: '/api/placeholder/150/150',
        rewardXP: 0,
        rewardGoldMultiplier: 0
      };
    } catch (error) {
      console.error('Erro ao buscar oponente:', error);
      return null;
    } finally {
      setLoadingOpponent(false);
    }
  };

  // Função para registrar resultado da batalha
  const registerBattleResult = async (playerWon, opponentId, battleLog, finalHp) => {
    try {
      const winnerId = playerWon ? player.id : opponentId;

      // 1) Registrar a batalha no servidor (POST)
      const response = await fetch(
        `${API_BASE_URL}/tournament/battle`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player1Id: player.id,
            player2Id: opponentId,
            winnerId: winnerId,
            battleLog: battleLog
          }),
        }
      );
      if (!response.ok) throw new Error('Falha ao registrar resultado da batalha');

      // 2) Agora que o servidor já atualizou rankedPoints (+30 ou -10),
      // fazemos um GET em /api/players/:id para buscar o valor atualizado.
      const playerResponse = await fetch(`${API_BASE_URL}/players/${player.id}`);
      if (!playerResponse.ok) {
        console.error('Erro ao buscar jogador para atualizar pontos:', playerResponse.status);
      } else {
        const updatedPlayerData = await playerResponse.json();
        const currentPlayerHp = player.hp;
        // 3) Atualizamos apenas rankedPoints no contexto React
        updatePlayer({
          rankedPoints: updatedPlayerData.rankedPoints,
          hp: finalHp
        });
      }
    } catch (err) {
      console.error('Erro ao registrar batalha:', err);
    }
  };


  // Função principal de batalha
  const startTournamentBattle = async () => {
    const battleOpponent = await findOpponent();
    if (!battleOpponent) return;

    setOpponent(battleOpponent);
    const battleResult = handleTournamentBattle(battleOpponent);
    setCombatLog(battleResult.combatLog);
    setCombatResult(battleResult.result);
    setShowCombatModal(true);

    await updatePlayer({ hp: Math.max(1, battleResult.playerFinalHp) });

    // Registrar resultado no servidor - FIXED: Use battleResult.playerFinalHp instead of playerClone.currentHp
    await registerBattleResult(battleResult.success, battleOpponent.id, battleResult.combatLog, Math.max(1, battleResult.playerFinalHp));
  };

  // Lógica de combate
  const handleTournamentBattle = (enemy) => {
    if (!player) return { success: false, combatLog: [] };

    const enemyClone = { ...enemy, currentHp: enemy.hp };
    const playerClone = { ...player, currentHp: player.hp };
    const combatLog = [];

    let battleTime = 0;
    const timeIncrement = 0.1;
    let playerAttackCounter = 0;
    let enemyAttackCounter = 0;

    combatLog.push({
      type: 'system',
      message: `Batalha de torneio iniciada contra ${enemy.name}!`
    });

    // Loop principal de combate
    while (playerClone.currentHp > 0 && enemyClone.currentHp > 0 && battleTime <= 100) {
      battleTime += timeIncrement;

      // Ataque do jogador
      if (battleTime >= (playerAttackCounter + 1) / playerClone.attackSpeed) {
        playerAttackCounter++;
        const attackResult = executePlayerAttack(playerClone, enemyClone, enemy.name);
        combatLog.push(...attackResult.logs);

        if (enemyClone.currentHp <= 0 || playerClone.currentHp <= 0) break;
      }

      // Ataque do inimigo
      if (battleTime >= (enemyAttackCounter + 1) / enemyClone.attackSpeed) {
        enemyAttackCounter++;
        const attackResult = executeEnemyAttack(enemyClone, playerClone, enemy.name);
        combatLog.push(...attackResult.logs);

        if (playerClone.currentHp <= 0 || enemyClone.currentHp <= 0) break;
      }
    }

    // Timeout de combate
    if (battleTime > 100) {
      combatLog.push({
        type: 'system',
        message: 'O combate foi muito longo e terminou em empate!'
      });
    }

    // Resultado da batalha
    const playerWon = playerClone.currentHp > 0;
    const result = createBattleResult(playerWon, enemy.name);

    // Atualizar HP do jogador
    //updatePlayer({ hp: Math.max(1, playerClone.currentHp) });

    return {
      success: playerWon,
      combatLog,
      result, 
      playerFinalHp: playerClone.currentHp
    };
  };

  // Função auxiliar para ataque do jogador
  const executePlayerAttack = (playerClone, enemyClone, enemyName) => {
    const logs = [];
    let playerBaseDamage = Math.max(1, playerClone.attack);
    const enemyDamageReduction = Math.min(30, enemyClone.defense * 0.1);
    let playerDamage = Math.floor(playerBaseDamage * (1 - enemyDamageReduction / 100));

    const playerCrit = Math.random() * 100 < playerClone.critChance;
    const critMultiplier = (playerClone.criticalX3 && playerCrit) ? 3 : (playerCrit ? 2 : 1);

    // Calculamos o dano total com crítico
    const totalDamageWithCrit = Math.floor(playerBaseDamage * critMultiplier);

    // Calculamos o dano reduzido pela defesa (considerando o crítico)
    const finalPlayerDamage = Math.floor(totalDamageWithCrit * (1 - enemyDamageReduction / 100));

    // O dano que foi "absorvido" pela defesa
    const absorbedDamage = totalDamageWithCrit - finalPlayerDamage;

    enemyClone.currentHp -= finalPlayerDamage;

    let critMessage = '';
    if (playerCrit) {
      critMessage = playerClone.criticalX3 ? ' (crítico x3!)' : ' (crítico!)';
    }

    if (enemyClone.reflect && absorbedDamage > 0) {
      playerClone.currentHp -= absorbedDamage;
      logs.push({
        type: 'player',
        message: `Você causou ${finalPlayerDamage} de dano${critMessage} ao ${enemyName} e recebeu 🔥 ${absorbedDamage} de dano refletido.`
      });

      if (playerClone.currentHp <= 0) {
        logs.push({
          type: 'enemy',
          message: `💀 Você foi derrotado pelo Reflect de ${enemyName}!`
        });
      }
    } else {
      logs.push({
        type: 'player',
        message: `Você causou ${finalPlayerDamage} de dano${critMessage} ao ${enemyName}.`
      });
    }

    if (enemyClone.currentHp <= 0) {
      logs.push({
        type: 'player',
        message: `Você derrotou o ${enemyName}!`
      });
    }

    return { logs };
  };

  // Função auxiliar para ataque do inimigo
  const executeEnemyAttack = (enemyClone, playerClone, enemyName) => {
    const logs = [];
    const enemyBaseDamage = Math.max(1, enemyClone.attack);
    const damageReduction = Math.min(30, playerClone.physicalDefense * 0.1);

    const enemyCrit = Math.random() * 100 < enemyClone.critChance;
    const critMultiplier = (enemyClone.criticalX3 && enemyCrit) ? 3 : (enemyCrit ? 1.5 : 1);

    // Calculamos o dano total com crítico
    const totalDamageWithCrit = Math.floor(enemyBaseDamage * critMultiplier);

    // Calculamos o dano reduzido pela defesa (considerando o crítico)
    const finalEnemyDamage = Math.floor(totalDamageWithCrit * (1 - damageReduction / 100));

    // O dano que foi "absorvido" pela defesa
    const absorbedDamage = totalDamageWithCrit - finalEnemyDamage;

    playerClone.currentHp -= finalEnemyDamage;

    let critMessage = '';
    if (enemyCrit) {
      critMessage = enemyClone.criticalX3 ? ' (crítico x3!)' : ' (crítico!)';
    }

    let message = `${enemyName} causou ${finalEnemyDamage} de dano${critMessage} a você.`;

    if (playerClone.reflect && absorbedDamage > 0) {
      enemyClone.currentHp -= absorbedDamage;
      message += ` 🔥 Você refletiu ${absorbedDamage} de dano.`;

      if (enemyClone.currentHp <= 0) {
        logs.push({ type: 'enemy', message });
        logs.push({
          type: 'player',
          message: `${enemyName} foi derrotado pelo dano refletido!`
        });
        return { logs };
      }
    }

    logs.push({ type: 'enemy', message });

    if (playerClone.currentHp <= 0) {
      logs.push({
        type: 'enemy',
        message: `💀 Você foi derrotado por ${enemyName}!`
      });
    }

    return { logs };
  };

  // Função para criar resultado da batalha
  const createBattleResult = (playerWon, enemyName) => {
    if (playerWon) {
      return {
        type: 'victory',
        title: 'Vitória!',
        message: `Você derrotou ${enemyName}:  +${VICTORY_POINTS} pontos de ranking!`
      };
    } else {
      return {
        type: 'defeat',
        title: 'Derrota!',
        message: `💀 Você foi derrotado por ${enemyName}. ${DEFEAT_POINTS} pontos de ranking.`
      };
    }
  };

  const toggleRanking = () => {
    if (!rankingVisible) fetchRanking();
    setRankingVisible(v => !v);
  };

  // Carregar ranking inicial
  useEffect(() => {
    if (player) fetchRanking();
  }, [player, fetchRanking]);

  const isPlayerHealthy = player?.hp > 1;

  return (
    <div className="tournament-page">
      <h1>🏆 Torneio Gladiador</h1>

      <button onClick={openTierModal} className="ranking-button">
        Ver Ranking de Gladiadores
      </button>

      {/* Modal de Elos */}
      {showTierModal && (
        <div className="tier-modal-overlay" onClick={closeTierModal}>
          <div className="tier-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tier-modal-header">
              <button
                className="tier-nav-btn"
                onClick={prevTier}
                disabled={currentTierIndex === 0}
              >
                &lt;
              </button>
              <h2 style={{ color: TIERS[currentTierIndex].color }}>
                {TIERS[currentTierIndex].name}
              </h2>
              <button
                className="tier-nav-btn"
                onClick={nextTier}
                disabled={currentTierIndex === TIERS.length - 1}
              >
                &gt;
              </button>
            </div>

            <div className="tier-modal-body">
              {tieredPlayers[currentTierIndex]?.length > 0 ? (
                <ul className="tier-players-list">
                  {tieredPlayers[currentTierIndex].map((p, idx) => (
                    <li key={p.id} className={p.id === player?.id ? 'your-player' : ''}>
                      <span className="place">{idx + 1}º</span>
                      {p.name} – {p.rankedPoints || 0} pts (Nv. {p.level})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhum jogador neste elo.</p>
              )}
            </div>

            <button className="tier-close-btn" onClick={closeTierModal}>
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="tournament-info">
        <h2>📜 Sobre</h2>
        <p>
          O torneio é uma competição entre todos os gladiadores cadastrados.
          Enfrente oponentes de nível similar e ganhe pontos de ranking para subir na classificação!
        </p>
        <p>
          <strong>Vitória:</strong> +{VICTORY_POINTS} pontos de ranking<br />
          <strong>Derrota:</strong> {DEFEAT_POINTS} pontos de ranking
        </p>
      </div>
      <button
        className="participate-button"
        onClick={startTournamentBattle}
        disabled={loadingOpponent || !isPlayerHealthy}
      >
        {loadingOpponent ? 'Procurando oponente...' : 'Participar do Torneio'}
      </button>

      {!isPlayerHealthy && (
        <p className="health-warning">
          Você precisa se recuperar antes de batalhar novamente!
        </p>
      )}

      <CombatModal
        show={showCombatModal}
        onClose={() => setShowCombatModal(false)}
        combatLog={combatLog}
        result={combatResult}
        enemyImage={opponent?.image}
        enemyName={opponent?.name}
        showRetryButton={false}
      />
    </div>
  );
}