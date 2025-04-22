import React, { useEffect, useState } from 'react';
import { getPlayer, savePlayer } from '../utils/storage';
import { generatePlayerStats } from '../utils/player';
import './Character.css'; // caso tenha um CSS próprio opcional

export default function Character() {
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    const storedPlayer = getPlayer();

    if (storedPlayer) {
      // Se por algum motivo o nível não estiver salvo, assumimos 1
      if (!storedPlayer.level) storedPlayer.level = 1;
      setPlayer(storedPlayer);
    }
  }, []);


  useEffect(() => {
    const data = getPlayer();
    if (data) {
      const updatedStats = generatePlayerStats(data.level || 1);
      const updatedPlayer = { ...data, ...updatedStats };
      setPlayer(updatedPlayer);
    }
  }, []);

  const handleLevelUp = () => {
    if (!player || typeof player.level !== 'number') return;

    const nextLevel = player.level + 1;
    const newStats = generatePlayerStats(nextLevel);
    const updatedPlayer = {
      ...player,
      level: nextLevel,
      xp: 0,
      xpToNextLevel: newStats.xpToNextLevel,
      hp: newStats.hp,
      attack: newStats.attack,
      critChance: newStats.critChance,
      attackSpeed: newStats.attackSpeed,
      physicalDefense: newStats.physicalDefense,
    };

    setPlayer(updatedPlayer);
    savePlayer(updatedPlayer);
  };

  if (!player) return <p>Carregando...</p>;

  const xpPercent = ((player.xp / player.xpToNextLevel) * 100).toFixed(1);

  return (
    <div className="character-container">
      <div className='container-player'>
        <div className="character-stats">
          <h1>{player.name}</h1>
          <p>Nível: {player.level}</p>
          <p>❤️HP: {player.hp}</p>
          <p>🗡️Ataque: {player.attack}</p>
          <p>🎯Chance Crítica: {player.critChance?.toFixed(1)}%</p>
          <p>⚡Velocidade de Ataque: {player.attackSpeed?.toFixed(2)}</p>
          <p>🛡️Defesa Física: {player.physicalDefense}</p>
        </div>

        <div>
          <img className='player-img' src="\src\assets\images\gladiator.jpg" alt="teste" />
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${xpPercent}%` }}></div>
          </div>
          <p>
            XP: {player.xp} / {player.xpToNextLevel}
          </p>
          <div className="hp-bar">
            <div className="hp-fill" style={{ width: `${xpPercent}%` }}></div>
          </div>
          <p>
            HP: {player.hp} / {player.hp}
          </p>
        </div>
      </div>

      <div className='button-teste'>
        <button onClick={handleLevelUp}>Aumentar Nível (Teste)</button>
      </div>


    </div>
  );
}
