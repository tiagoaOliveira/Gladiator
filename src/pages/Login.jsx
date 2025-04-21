import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { savePlayer } from '../utils/storage';

export default function Login() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!name) return;

    const newPlayer = {
      name,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      hp: 100,
      attack: 10,
      defense: 5,
      magicPower: 8,
      magicResistance: 4,
      critChance: 5,
      attackSpeed: 1,
      gold: 50
    };

    savePlayer(newPlayer);
    navigate('/character');
  };

  return (
    <div className="login-container">
      <h1>Bem-vindo à Arena!</h1>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Digite seu nome"
      />
      <button onClick={handleLogin}>Entrar</button>
    </div>
  );
}
