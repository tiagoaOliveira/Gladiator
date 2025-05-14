import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import CombatModal from '../components/CombatModal';
import './Torneio.css';

// Gerando pseudo-jogadores para o torneio
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
    const baseStats = {
      id: i + 1,
      name: names[i % names.length],
      level,
      hp: 100 + level * 20,
      maxHp: 100 + level * 20,
      attack: 15 + level * 5,
      physicalDefense: 10 + level * 3,
      critChance: 5 + level * 1.5,
      attackSpeed: Math.min(3, 1 + level * 0.1),
      wins: 0
    };
    return baseStats;
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

  // Inicializar torneio
  useEffect(() => {
    if (!player) return;
    
    // Gerar pseudo-jogadores e adicionar o jogador real ao torneio
    const bots = generatePseudoPlayers(31);
    const allPlayers = [
      { ...player, id: 0, name: player.name, maxHp: player.maxHp, wins: 0 },
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

  // Simular uma batalha entre dois jogadores
  const simulateBattle = (player1, player2) => {
    // Converter jogador para formato de inimigo para usar com handleBattle
    const enemyFormat = {
      name: player2.name,
      level: player2.level,
      hp: player2.hp,
      attack: player2.attack,
      defense: player2.physicalDefense,
      critChance: player2.critChance,
      attackSpeed: player2.attackSpeed,
      rewardXP: player2.level * 50,
      rewardGoldMultiplier: 1
    };

    // Usar a função handleBattle do GameContext
    const battle = handleBattle(enemyFormat);
    
    return {
      winner: battle.success ? player1 : player2,
      loser: battle.success ? player2 : player1,
      combatLog: battle.combatLog,
      result: battle.result
    };
  };

  // Simular batalha entre dois pseudo-jogadores (bots)
  const simulateBotBattle = (player1, player2) => {
    // Sistema simplificado de combate para simulação entre bots
    const log = [];
    let player1HP = player1.hp;
    let player2HP = player2.hp;
    
    log.push({ type: 'system', message: `Combate iniciado entre ${player1.name} e ${player2.name}!` });

    // Simular rounds de combate
    while (player1HP > 0 && player2HP > 0) {
      // Ataque do jogador 1
      const p1Damage = Math.floor(player1.attack * (1 - player2.physicalDefense * 0.01));
      const p1IsCrit = Math.random() * 100 < player1.critChance;
      const finalP1Damage = p1IsCrit ? p1Damage * 2 : p1Damage;
      
      player2HP -= finalP1Damage;
      log.push({
        type: 'player',
        message: `${player1.name} causou ${finalP1Damage} de dano${p1IsCrit ? ' (crítico!)' : ''} a ${player2.name}.`
      });
      
      if (player2HP <= 0) break;
      
      // Ataque do jogador 2
      const p2Damage = Math.floor(player2.attack * (1 - player1.physicalDefense * 0.01));
      const p2IsCrit = Math.random() * 100 < player2.critChance;
      const finalP2Damage = p2IsCrit ? p2Damage * 2 : p2Damage;
      
      player1HP -= finalP2Damage;
      log.push({
        type: 'enemy',
        message: `${player2.name} causou ${finalP2Damage} de dano${p2IsCrit ? ' (crítico!)' : ''} a ${player1.name}.`
      });
    }
    
    // Determinar vencedor
    const winner = player1HP > 0 ? player1 : player2;
    const loser = player1HP > 0 ? player2 : player1;
    
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

  // Jogar uma partida de melhor de 3
  const playBestOfThree = (bracket, isPlayerMatch = false) => {
    const { player1, player2, matchesWon } = bracket;
    const newBracket = { ...bracket };
    
    // Simular a batalha
    let battleResult;
    if (isPlayerMatch) {
      battleResult = simulateBattle(player1.id === 0 ? player1 : player2, player1.id === 0 ? player2 : player1);
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
    
    // Verificar se há um vencedor na série
    if (newBracket.matchesWon.player1 >= 2) {
      newBracket.winner = player1;
    } else if (newBracket.matchesWon.player2 >= 2) {
      newBracket.winner = player2;
    }
    
    return {
      updatedBracket: newBracket,
      battleResult
    };
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
      nextRoundBrackets.push({
        player1: winners[i],
        player2: winners[i + 1],
        winner: null,
        matches: [],
        matchesWon: { player1: 0, player2: 0 }
      });
    }
    
    setBrackets(nextRoundBrackets);
    setCurrentRound(prev => prev + 1);
    
    // Verificar se o jogador está na próxima rodada
    const playerMatchups = nextRoundBrackets.filter(
      bracket => bracket.player1.id === 0 || bracket.player2.id === 0
    );
    setPlayerMatchups(playerMatchups);
    setCurrentMatchIndex(0);
    
    showNotification(`Avançando para ${roundNames[currentRound + 1]}!`, "info");
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
    
    // Jogar a partida
    const { updatedBracket, battleResult } = playBestOfThree(bracket, true);
    
    // Atualizar os brackets
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
      if (playerWon) {
        showNotification("Você venceu a série!", "success");
      } else {
        showNotification("Você perdeu a série!", "error");
      }
    }
  };

  // Simular todos os confrontos de bots na rodada atual
  const simulateAllBotMatches = () => {
    const newBrackets = [...brackets];
    let anyPlayerMatchSimulated = false;
    
    newBrackets.forEach((bracket, index) => {
      // Pular confrontos que já têm vencedor
      if (bracket.winner) return;
      
      // Pular confrontos do jogador
      if (bracket.player1.id === 0 || bracket.player2.id === 0) {
        anyPlayerMatchSimulated = true;
        return;
      }
      
      // Jogar melhor de 3 para bots
      while (!bracket.winner) {
        const { updatedBracket } = playBestOfThree(bracket);
        newBrackets[index] = updatedBracket;
      }
    });
    
    if (anyPlayerMatchSimulated) {
      showNotification("Você precisa jogar seus próprios confrontos", "info");
    }
    
    setBrackets(newBrackets);
  };

  // Reiniciar o torneio
  const restartTournament = () => {
    // Gerar pseudo-jogadores e adicionar o jogador real ao torneio
    const bots = generatePseudoPlayers(31);
    const allPlayers = [
      { ...player, id: 0, name: player.name, maxHp: player.maxHp, wins: 0 },
      ...bots
    ];
    
    setPseudoPlayers(allPlayers);
    
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
    setTournamentWinner(null);
    
    // Encontrar confrontos do jogador
    const playerMatchups = initialBrackets.filter(
      bracket => bracket.player1.id === 0 || bracket.player2.id === 0
    );
    setPlayerMatchups(playerMatchups);
    setCurrentMatchIndex(0);
    
    showNotification("Torneio reiniciado!", "success");
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
                  <span>Melhor de 3</span>
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
                      Jogar Partida
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