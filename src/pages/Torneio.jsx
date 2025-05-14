import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import CombatModal from '../components/CombatModal';
import { generatePlayerStats } from '../utils/player';
import './Torneio.css';

// Gerando pseudo-jogadores para o torneio com os mesmos atributos do player base
const generatePseudoPlayers = (count = 31) => {
  const names = [
    'Maximus', 'Spartacus', 'Crixus', 'Gannicus', 'Atticus', 'Brutus', 'Flamma',
    'Carpophorus', 'Priscus', 'Verus', 'Magnus', 'Commodus', 'Titus', 'Proximo',
    'Oenomaus', 'Batiatus', 'Varro', 'Ashur', 'Dagan', 'Theokoles', 'Drago',
    'Leonidas', 'Pollux', 'Castor', 'Marcus', 'Lucius', 'Tiberius', 'Quintus',
    'Glaber', 'Agron', 'Duro', 'Donar', 'Nemetes', 'Nasir', 'Castus', 'Barca',
    'Auctus', 'Duro', 'Nemetes', 'Rhaskos', 'Gnaeus', 'Hamilcar', 'Kerza'
  ];

  return Array.from({ length: count }, (_, i) => {
    const level = Math.floor(Math.random() * 5) + 1; // Nível entre 1 e 5
    
    // Usar os mesmos atributos base do jogador da generatePlayerStats
    const baseStats = generatePlayerStats(level);
    
    return {
      id: i + 1,
      name: names[i % names.length],
      level,
      hp: baseStats.hp,
      maxHp: baseStats.hp,
      attack: baseStats.attack,
      physicalDefense: baseStats.physicalDefense,
      critChance: baseStats.critChance,
      attackSpeed: baseStats.attackSpeed,
      wins: 0
    };
  });
};

export default function Torneio() {
  const { player, handleBattle, showNotification } = useGame();
  const [pseudoPlayers, setPseudoPlayers] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [combatResult, setCombatResult] = useState(null);
  const [tournamentWinner, setTournamentWinner] = useState(null);
  const [playerInTournament, setPlayerInTournament] = useState(false);
  const [playerMatchups, setPlayerMatchups] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [roundNames] = useState(['Primeira Rodada', 'Segunda Rodada', 'Quartas de Final', 'Semifinal', 'Final']);
  
  // Constante para definir quantas vitórias são necessárias (melhor de 5 = 3 vitórias)
  const WINS_NEEDED = 3;

  // Inicializar torneio
  useEffect(() => {
    if (!player) return;
    
    // Gerar pseudo-jogadores e adicionar o jogador real ao torneio
    const bots = generatePseudoPlayers(31);
    const allPlayers = [
      { 
        ...player, 
        id: 0, 
        name: player.name, 
        maxHp: player.maxHp,
        hp: player.maxHp, // Garantir HP cheio ao iniciar
        wins: 0 
      },
      ...bots
    ];
    
    setPseudoPlayers(allPlayers);
    setPlayerInTournament(true);
    
    // Embaralhar os jogadores para matchups aleatórios
    const shuffled = [...allPlayers].sort(() => 0.5 - Math.random());
    
    // Criar os confrontos iniciais
    const initialBrackets = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      initialBrackets.push({
        player1: shuffled[i],
        player2: shuffled[i + 1],
        winner: null,
        matches: [],
        matchesWon: { player1: 0, player2: 0 }
      });
    }
    
    setBrackets(initialBrackets);
    setCurrentRound(0);
    
    // Encontrar confrontos do jogador
    const playerMatchups = initialBrackets.filter(
      bracket => bracket.player1.id === 0 || bracket.player2.id === 0
    );
    setPlayerMatchups(playerMatchups);
    
  }, [player]);

  // Simular uma batalha entre o jogador e um oponente
  const simulateBattle = (player1, player2) => {
    // Garantir que ambos os jogadores estejam com HP cheio antes da batalha
    const playerWithFullHp = { ...player1, hp: player1.maxHp, currentHp: player1.maxHp };
    
    // Converter jogador para formato de inimigo para usar com handleBattle
    const enemyFormat = {
      name: player2.name,
      level: player2.level,
      hp: player2.maxHp, // Garantir HP cheio
      attack: player2.attack,
      defense: player2.physicalDefense,
      critChance: player2.critChance,
      attackSpeed: player2.attackSpeed,
      rewardXP: 0, // Sem recompensa de XP
      rewardGoldMultiplier: 0 // Sem multiplicador de ouro
    };

    // Usar a função handleBattle do GameContext
    const battle = handleBattle(enemyFormat);
    
    // Criar resultado personalizado sem premiações
    if (battle.result) {
      if (battle.result.type === 'victory') {
        battle.result.message = `Você derrotou ${player2.name}!`;
      } else {
        battle.result.message = `Você foi derrotado por ${player2.name}.`;
      }
    }
    
    return {
      winner: battle.success ? playerWithFullHp : player2,
      loser: battle.success ? player2 : playerWithFullHp,
      combatLog: battle.combatLog,
      result: battle.result
    };
  };

  // Simular batalha entre dois pseudo-jogadores (bots)
  const simulateBotBattle = (player1, player2) => {
    // Sistema simplificado de combate para simulação entre bots
    const log = [];
    
    // Garantir HP cheio para ambos os combatentes
    let player1HP = player1.maxHp;
    let player2HP = player2.maxHp;
    
    log.push({ type: 'system', message: `Combate iniciado entre ${player1.name} e ${player2.name}!` });

    // Evitar loops infinitos limitando o número de rodadas
    let rounds = 0;
    const maxRounds = 50;
    
    // Simular rounds de combate
    while (player1HP > 0 && player2HP > 0 && rounds < maxRounds) {
      rounds++;
      
      // Ataque do jogador 1
      const p1Damage = Math.max(1, Math.floor(player1.attack * (1 - player2.physicalDefense * 0.01)));
      const p1IsCrit = Math.random() * 100 < player1.critChance;
      const finalP1Damage = Math.floor(p1IsCrit ? p1Damage * 2 : p1Damage);
      
      player2HP -= finalP1Damage;
      log.push({
        type: 'player',
        message: `${player1.name} causou ${finalP1Damage} de dano${p1IsCrit ? ' (crítico!)' : ''} a ${player2.name}.`,
        attackSpeed: player1.attackSpeed
      });
      
      if (player2HP <= 0) break;
      
      // Ataque do jogador 2
      const p2Damage = Math.max(1, Math.floor(player2.attack * (1 - player1.physicalDefense * 0.01)));
      const p2IsCrit = Math.random() * 100 < player2.critChance;
      const finalP2Damage = Math.floor(p2IsCrit ? p2Damage * 2 : p2Damage);
      
      player1HP -= finalP2Damage;
      log.push({
        type: 'enemy',
        message: `${player2.name} causou ${finalP2Damage} de dano${p2IsCrit ? ' (crítico!)' : ''} a ${player1.name}.`,
        attackSpeed: player2.attackSpeed
      });
    }
    
    // Determinar vencedor (em caso de empate por limite de rodadas, escolhemos aleatoriamente)
    let winner, loser;
    if (player1HP <= 0) {
      winner = player2;
      loser = player1;
    } else if (player2HP <= 0) {
      winner = player1;
      loser = player2;
    } else {
      // Empate por limite de rodadas - escolher aleatoriamente
      winner = Math.random() < 0.5 ? player1 : player2;
      loser = winner === player1 ? player2 : player1;
      log.push({ 
        type: 'system', 
        message: `O combate foi muito longo e ${winner.name} venceu por decisão!` 
      });
    }
    
    log.push({ 
      type: winner.id === player1.id ? 'player' : 'enemy', 
      message: `${winner.name} venceu o combate contra ${loser.name}!` 
    });
    
    const result = {
      type: 'victory',
      title: 'Vitória!',
      message: `${winner.name} derrotou ${loser.name}!`
    };
    
    return {
      winner,
      loser,
      combatLog: log,
      result
    };
  };

  // Jogar uma partida de melhor de 5
  const playBestOfFive = (bracket, isPlayerMatch = false) => {
    const { player1, player2, matchesWon } = bracket;
    const newBracket = { ...bracket };
    
    try {
      // Simular a batalha
      let battleResult;
      if (isPlayerMatch) {
        const playerObj = player1.id === 0 ? player1 : player2;
        const enemyObj = player1.id === 0 ? player2 : player1;
        battleResult = simulateBattle(playerObj, enemyObj);
      } else {
        battleResult = simulateBotBattle(player1, player2);
      }
      
      // Atualizar pontuação da série
      if (battleResult.winner.id === player1.id) {
        newBracket.matchesWon.player1 += 1;
      } else {
        newBracket.matchesWon.player2 += 1;
      }
      
      // Adicionar resultado da partida ao histórico
      newBracket.matches.push({
        winner: battleResult.winner,
        combatLog: battleResult.combatLog,
        result: battleResult.result
      });
      
      // Verificar se há um vencedor na série (agora precisa de 3 vitórias para melhor de 5)
      if (newBracket.matchesWon.player1 >= WINS_NEEDED) {
        newBracket.winner = player1;
      } else if (newBracket.matchesWon.player2 >= WINS_NEEDED) {
        newBracket.winner = player2;
      }
      
      return {
        updatedBracket: newBracket,
        battleResult
      };
    } catch (error) {
      console.error("Erro ao simular batalha:", error);
      showNotification("Erro ao simular a batalha", "error");
      return {
        updatedBracket: bracket,
        battleResult: null
      };
    }
  };

  // Avançar uma rodada no torneio
  const advanceRound = () => {
    // Verificar se todas as chaves têm vencedores
    const allMatchesComplete = brackets.every(bracket => bracket.winner);
    
    if (!allMatchesComplete) {
      showNotification("Complete todos os confrontos desta rodada primeiro", "error");
      return;
    }
    
    // Obter vencedores da rodada atual
    const winners = brackets.map(bracket => bracket.winner);
    
    // Se só há um vencedor, o torneio acabou
    if (winners.length === 1) {
      setTournamentWinner(winners[0]);
      showNotification(`${winners[0].name} é o campeão do torneio!`, "success");
      return;
    }
    
    // Criar próxima rodada de matchups
    const nextRoundBrackets = [];
    for (let i = 0; i < winners.length; i += 2) {
      // Garantir que temos jogadores suficientes para formar um par
      if (i + 1 < winners.length) {
        // Garantir que os jogadores estão com HP cheio antes da próxima rodada
        const player1 = { ...winners[i], hp: winners[i].maxHp };
        const player2 = { ...winners[i + 1], hp: winners[i + 1].maxHp };
        
        nextRoundBrackets.push({
          player1,
          player2,
          winner: null,
          matches: [],
          matchesWon: { player1: 0, player2: 0 }
        });
      }
    }
    
    setBrackets(nextRoundBrackets);
    setCurrentRound(prev => prev + 1);
    
    // Verificar se o jogador está na próxima rodada
    const playerMatchups = nextRoundBrackets.filter(
      bracket => bracket.player1.id === 0 || bracket.player2.id === 0
    );
    setPlayerMatchups(playerMatchups);
    setCurrentMatchIndex(0);
    
    showNotification(`Avançando para ${roundNames[currentRound + 1] || "Próxima Rodada"}!`, "info");
  };

  // Jogar uma partida manualmente (quando o jogador está envolvido)
  const playPlayerMatch = (bracketIndex) => {
    const bracket = brackets[bracketIndex];
    
    // Verificar se o jogador está neste confronto
    const isPlayerBracket = bracket.player1.id === 0 || bracket.player2.id === 0;
    
    if (!isPlayerBracket) {
      showNotification("Este não é um confronto do seu jogador", "error");
      return;
    }
    
    // Configurar e abrir o modal de combate
    setSelectedMatch(bracketIndex);
    
    try {
      // Jogar a partida
      const { updatedBracket, battleResult } = playBestOfFive(bracket, true);
      
      if (!battleResult) {
        showNotification("Ocorreu um erro ao jogar a partida", "error");
        return;
      }
      
      // Atualizar os brackets - IMPORTANTE: Criar um novo array para garantir que o React detecte a mudança
      const newBrackets = [...brackets];
      newBrackets[bracketIndex] = updatedBracket;
      setBrackets(newBrackets);
      
      // Mostrar o resultado no modal
      setCombatLog(battleResult.combatLog);
      setCombatResult(battleResult.result);
      setIsModalOpen(true);
      
      // Verificar se há um vencedor na série
      if (updatedBracket.winner) {
        const playerWon = updatedBracket.winner.id === 0;
        showNotification(playerWon ? "Você venceu a série!" : "Você perdeu a série!", playerWon ? "success" : "error");
      } else {
        // Indicar o progresso da série
        const player1Wins = updatedBracket.matchesWon.player1;
        const player2Wins = updatedBracket.matchesWon.player2;
        const playerIsPlayer1 = updatedBracket.player1.id === 0;
        
        const playerWins = playerIsPlayer1 ? player1Wins : player2Wins;
        const opponentWins = playerIsPlayer1 ? player2Wins : player1Wins;
        
        showNotification(`Série em andamento: Você ${playerWins}-${opponentWins} Oponente`, "info");
      }
    } catch (error) {
      console.error("Erro ao jogar partida:", error);
      showNotification("Ocorreu um erro ao jogar a partida", "error");
    }
  };

  // Simular todos os confrontos de bots na rodada atual
  const simulateAllBotMatches = () => {
    try {
      const newBrackets = [...brackets];
      let anyPlayerMatchSimulated = false;
      
      for (let index = 0; index < newBrackets.length; index++) {
        const bracket = newBrackets[index];
        
        // Pular confrontos que já têm vencedor
        if (bracket.winner) continue;
        
        // Pular confrontos do jogador
        if (bracket.player1.id === 0 || bracket.player2.id === 0) {
          anyPlayerMatchSimulated = true;
          continue;
        }
        
        // Jogar melhor de 5 para bots até determinar um vencedor
        while (!bracket.winner && 
               bracket.matchesWon.player1 < WINS_NEEDED && 
               bracket.matchesWon.player2 < WINS_NEEDED) {
          const { updatedBracket } = playBestOfFive(newBrackets[index]);
          newBrackets[index] = updatedBracket;
        }
      }
      
      if (anyPlayerMatchSimulated) {
        showNotification("Você precisa jogar seus próprios confrontos", "info");
      }
      
      // Importante: Use setBrackets com um novo array para garantir que o React detecte a mudança
      setBrackets([...newBrackets]);
    } catch (error) {
      console.error("Erro ao simular partidas:", error);
      showNotification("Ocorreu um erro ao simular as partidas", "error");
    }
  };

  // Reiniciar o torneio
  const restartTournament = () => {
    try {
      // Gerar pseudo-jogadores e adicionar o jogador real ao torneio
      const bots = generatePseudoPlayers(31);
      const allPlayers = [
        { 
          ...player, 
          id: 0, 
          name: player.name, 
          hp: player.maxHp, // Garantir HP cheio
          maxHp: player.maxHp, 
          wins: 0 
        },
        ...bots
      ];
      
      setPseudoPlayers(allPlayers);
      
      // Embaralhar os jogadores para matchups aleatórios
      const shuffled = [...allPlayers].sort(() => 0.5 - Math.random());
      
      // Criar os confrontos iniciais
      const initialBrackets = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) { // Garantir que temos par completo
          initialBrackets.push({
            player1: shuffled[i],
            player2: shuffled[i + 1],
            winner: null,
            matches: [],
            matchesWon: { player1: 0, player2: 0 }
          });
        }
      }
      
      setBrackets(initialBrackets);
      setCurrentRound(0);
      setTournamentWinner(null);
      
      // Encontrar confrontos do jogador
      const playerMatchups = initialBrackets.filter(
        bracket => bracket.player1.id === 0 || bracket.player2.id === 0
      );
      setPlayerMatchups(playerMatchups);
      setCurrentMatchIndex(0);
      
      showNotification("Torneio reiniciado!", "success");
    } catch (error) {
      console.error("Erro ao reiniciar torneio:", error);
      showNotification("Ocorreu um erro ao reiniciar o torneio", "error");
    }
  };

  if (!player) return <p>Carregando...</p>;

  return (
    <div className="tournament-container">
      <div className="tournament-header">
        <h1>🏆 Torneio de Gladiadores</h1>
        <p className="tournament-round">{roundNames[currentRound] || "Rodada Final"}</p>
        
        {tournamentWinner && (
          <div className="tournament-winner">
            <h2>Campeão do Torneio</h2>
            <div className="winner-info">
              <p className="winner-name">{tournamentWinner.name}</p>
              <p className="winner-level">Nível {tournamentWinner.level}</p>
            </div>
            <button className="restart-tournament-button" onClick={restartTournament}>
              Iniciar Novo Torneio
            </button>
          </div>
        )}
      </div>

      {!tournamentWinner && (
        <>
          {/* Controles do Torneio */}
          <div className="tournament-controls">
            <button 
              className="simulate-button" 
              onClick={simulateAllBotMatches}
              disabled={!brackets.length}
            >
              Simular Batalhas de NPCs
            </button>
            <button 
              className="advance-button" 
              onClick={advanceRound}
              disabled={!brackets.length || !brackets.every(bracket => bracket.winner)}
            >
              Avançar para Próxima Rodada
            </button>
          </div>

          {/* Chaves do Torneio */}
          <div className="tournament-brackets">
            {brackets.map((bracket, index) => (
              <div key={index} className={`bracket ${bracket.winner ? 'completed' : ''}`}>
                <div className="bracket-header">
                  <span>Melhor de 5</span>
                  <span className="bracket-score">
                    {bracket.matchesWon.player1}-{bracket.matchesWon.player2}
                  </span>
                </div>
                
                <div className="bracket-players">
                  <div className={`bracket-player ${bracket.winner?.id === bracket.player1.id ? 'winner' : ''}`}>
                    <span className="player-name">
                      {bracket.player1.name} 
                      {bracket.player1.id === 0 && " (Você)"}
                    </span>
                    <span className="player-level">Nível {bracket.player1.level}</span>
                  </div>
                  
                  <div className="bracket-vs">vs</div>
                  
                  <div className={`bracket-player ${bracket.winner?.id === bracket.player2.id ? 'winner' : ''}`}>
                    <span className="player-name">
                      {bracket.player2.name}
                      {bracket.player2.id === 0 && " (Você)"}
                    </span>
                    <span className="player-level">Nível {bracket.player2.level}</span>
                  </div>
                </div>
                
                <div className="bracket-status">
                  {bracket.winner ? (
                    <span className="winner-tag">
                      Vencedor: {bracket.winner.name}
                      {bracket.winner.id === 0 && " (Você)"}
                    </span>
                  ) : (bracket.player1.id === 0 || bracket.player2.id === 0) ? (
                    <button 
                      className="play-match-button"
                      onClick={() => playPlayerMatch(index)}
                    >
                      Jogar Partida {bracket.matches.length + 1}
                    </button>
                  ) : (
                    <span className="pending-tag">Aguardando...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal de Combate */}
      <CombatModal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRetry={() => {
          setIsModalOpen(false);
          if (selectedMatch !== null) {
            playPlayerMatch(selectedMatch);
          }
        }}
        combatLog={combatLog}
        result={combatResult}
      />
    </div>
  );
}