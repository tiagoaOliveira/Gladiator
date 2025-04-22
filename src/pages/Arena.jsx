import React, { useState, useEffect } from 'react';
import { getPlayer, savePlayer } from '../utils/storage';
import { useNavigate } from 'react-router-dom';
import './Arena.css';

export default function Arena() {
  const navigate = useNavigate();
  const [player, setPlayer] = useState(getPlayer());

  const [mostrarNotificacao, setMostrarNotificacao] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const enemy = {
    name: 'Goblin Berserker',
    level: 1,
    hp: 80,
    attack: 8,
    defense: 3,
    critChance: 3,
    attackSpeed: 1,
    image: '/src/assets/images/goblin.jpg',
    rewardXP: 300
  };

  const handleBattle = () => {
    const playerDamage = Math.max(0, player.attack - enemy.defense);
    const enemyDamage = Math.max(0, enemy.attack - player.defense);

    const newHp = player.hp - enemyDamage;

    if (newHp <= 0) {
      setMensagem('Você foi derrotado! 😢');
      setMostrarNotificacao(true);
      return;
    }

    const newXP = player.xp + enemy.rewardXP;
    let newLevel = player.level;
    let newXpToNext = player.xpToNextLevel;
    let remainingXP = newXP;

    while (remainingXP >= newXpToNext) {
      remainingXP -= newXpToNext;
      newLevel += 1;
      newXpToNext = Math.floor(newXpToNext * 1.2);
    }

    const updatedPlayer = {
      ...player,
      hp: newHp,
      xp: remainingXP,
      level: newLevel,
      xpToNextLevel: newXpToNext
    };

    savePlayer(updatedPlayer);
    setPlayer(updatedPlayer);

    setMensagem(`Vitória! Ganhou ${enemy.rewardXP} XP`);
    setMostrarNotificacao(true);
  };

  return (
    <div className="arena-container">
      {/* Notificação custom */}
      {mostrarNotificacao && (
        <div className="notificacao-arena">
          <p>{mensagem}</p>
          <button onClick={() => setMostrarNotificacao(false)}>Fechar</button>
        </div>
      )}

      <div className="enemy-stats">
        <div>
          <h2>{enemy.name}</h2>
          <p>Nível: {enemy.level}</p>
          <p>❤️HP: {enemy.hp}</p>
          <p>🗡️Ataque: {enemy.attack}</p>
          <p>🎯Defesa: {enemy.defense}</p>
          <p>⚡Crítico: {enemy.critChance}%</p>
          <p>🛡️Vel. de Ataque: {enemy.attackSpeed}</p>
        </div>

        <div className="enemy-image">
          <img src={enemy.image} alt="Inimigo" />
        </div>
      </div>

      <div className='button-arena'>
        <button onClick={handleBattle}>Iniciar Batalha</button>
      </div>
    </div>
  );
}
