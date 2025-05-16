// src/pages/Torneio.jsx
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import './Torneio.css';

export default function Torneio() {
  const { player } = useGame();
  const [rankingVisible, setRankingVisible] = useState(false);
  const [ranking, setRanking] = useState([]);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [loading, setLoading] = useState(false);

  const TOP_N = 2; // número de posições a exibir no ranking

  const fetchRanking = async () => {
    setLoading(true);
    try {
      // 1) Busca ranking completo do servidor
      const resTop = await fetch('http://localhost:4000/api/ranking');
      const fullRanking = await resTop.json();

      // 2) Guarda só os TOP_N primeiros
      const topRanking = fullRanking.slice(0, TOP_N);
      setRanking(topRanking);

      // 3) Se o player estiver logado e não estiver no top, calcula posição real
      if (player?.id && !topRanking.find(p => p.id === player.id)) {
        const resAll = await fetch('http://localhost:4000/api/players');
        const all = await resAll.json();
        all.sort((a, b) =>
          b.level !== a.level ? b.level - a.level : b.xp - a.xp
        );
        const idx = all.findIndex(p => p.id === player.id);
        if (idx >= 0) setPlayerPosition(idx + 1);
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
            <ol>
              {ranking.map((p, i) => (
                <li key={p.id}>
                  <strong>{i + 1}º</strong> {p.name} – Lvl {p.level} ({p.xp} XP)
                </li>
              ))}

              {playerPosition && (
                <li className="your-position">
                  <li className="separator">…</li>
                  <strong>{playerPosition}º</strong> {player.name} – Lvl {player.level} ({player.xp} XP)
                </li>
              )}
            </ol>
          )}
        </div>
      )}

      <div className="tournament-info">
        <h2>📜 Sobre o Torneio</h2>
        <p>
          O torneio é uma competição entre todos os gladiadores cadastrados.
          As batalhas são apenas simuladas, e o campeão recebe recompensas em ouro e experiência.
        </p>
      </div>

      <button className="participate-button">
        Participar do Torneio
      </button>
    </div>
  );
}
