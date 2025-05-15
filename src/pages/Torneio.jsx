// src/pages/Torneio.jsx
import React, { useState, useEffect } from 'react';
import './Torneio.css';
import CombatModal from '../components/CombatModal';

export default function Torneio() {
  const [stage, setStage] = useState('idle'); // 'idle' | 'pending' | 'in-progress' | 'results'
  const [matches, setMatches] = useState([]);
  const [round, setRound] = useState(1);
  const [countdown, setCountdown] = useState(5);
  const [champion, setChampion] = useState(null);

  // Inicia o torneio: busca jogadores e monta bracket de 32
  const startTournament = async () => {
    setStage('pending');
    try {
      const res = await fetch('http://localhost:4000/api/players');
      let players = await res.json();
      // Completa com bots até 32
      const botsNeeded = 32 - players.length;
      for (let i = 0; i < botsNeeded; i++) {
        players.push({ id: `bot-${i}`, name: `Bot #${i+1}`, level: Math.ceil(Math.random()*10), image: '/placeholder.png' });
      }
      // Shuffle
      players = players.sort(() => Math.random() - 0.5);
      // Cria pares iniciais
      const initial = [];
      for (let i = 0; i < 32; i += 2) {
        initial.push({
          a: players[i],
          b: players[i+1],
          winner: null,
          result: []
        });
      }
      setMatches(initial);
      setStage('in-progress');
      // Inicia contagem regressiva
      setCountdown(5);
    } catch (err) {
      console.error(err);
      setStage('idle');
    }
  };

  // Countdown para simular a rodada
  useEffect(() => {
    if (stage !== 'in-progress') return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    // Após contagem, simula cada match
    const next = matches.map(m => {
      // Melhor de 3
      const wins = { a: 0, b: 0 };
      while (wins.a < 2 && wins.b < 2) {
        Math.random() < 0.5 ? wins.a++ : wins.b++;
      }
      const winner = wins.a > wins.b ? m.a : m.b;
      return { ...m, winner, result: [wins.a, wins.b] };
    });
    setMatches(next);
  }, [countdown, stage]);

  // Avança para próxima rodada ou termina torneio
  useEffect(() => {
    if (stage !== 'in-progress' || countdown >= 0) return;
    // Se todos tiverem vencedor, prepara próxima fase
    if (matches.every(m => m.winner)) {
      const winners = matches.map(m => m.winner);
      if (winners.length === 1) {
        setChampion(winners[0]);
        setStage('results');
        return;
      }
      // Monta próximos pares
      const nextPairs = [];
      for (let i = 0; i < winners.length; i += 2) {
        nextPairs.push({ a: winners[i], b: winners[i+1], winner: null, result: [] });
      }
      setMatches(nextPairs);
      setRound(r => r + 1);
      setCountdown(5);
    }
  }, [matches, countdown, stage]);

  if (stage === 'idle') {
    return (
      <div className="start-container" onClick={startTournament}>
        <h2>Clique aqui para iniciar o torneio</h2>
      </div>
    );
  }

  if (stage === 'pending' || (stage === 'in-progress' && countdown > 0)) {
    return (
      <div className="loading-container">
        <h2>Rodada {round} inicia em {countdown}s</h2>
      </div>
    );
  }

  if (stage === 'in-progress') {
    return (
      <div className="tournament-container">
        <h2>Rodada {round}</h2>
        <div className="matches-grid">
          {matches.map((m, i) => (
            <div key={i} className="match-card">
              <div className="player">
                <img src={m.a.image} alt={m.a.name} />
                <strong>{m.a.name}</strong> (Lvl {m.a.level})
              </div>
              <div className="vl">VS</div>
              <div className="player">
                <img src={m.b.image} alt={m.b.name} />
                <strong>{m.b.name}</strong> (Lvl {m.b.level})
              </div>
              {m.winner && <div className="result">Resultado: {m.result[0]} x {m.result[1]}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === 'results') {
    return (
      <div className="champion-container">
        <h2>🏆 Campeão: {champion.name}</h2>
        <img src={champion.image} alt={champion.name} />
        <p>Recompensa: +500 ouro, +100 XP</p>
      </div>
    );
  }

  return null;
}