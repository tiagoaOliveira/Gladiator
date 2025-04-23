import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import './Login.css';

export default function Login() {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { createPlayer, player } = useGame();

  useEffect(() => {
    // Se já estiver logado, redireciona para a página de personagem
    if (player) {
      navigate('/character');
    }
  }, [player, navigate]);

  const handleLogin = () => {
    if (!name.trim()) return;
    
    createPlayer(name);
    navigate('/character');
  };

  return (
    <div className="login-container">
      <h1>Bem-vindo à Arena!</h1>
      <div className="login-form">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Digite seu nome"
          className="login-input"
        />
        <button onClick={handleLogin} className="login-button">Entrar</button>
      </div>
    </div>
  );
}