import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import './Login.css';

export default function Login() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { createPlayer, player } = useGame();

  useEffect(() => {
    // Se já estiver logado, redireciona para a página de personagem
    if (player) {
      navigate('/character');
    }
  }, [player, navigate]);

  const handleLogin = () => {
    // Validação básica do nome
    if (!name.trim()) {
      setError('Por favor, digite um nome');
      return;
    }
    
    if (name.length < 3) {
      setError('O nome deve ter pelo menos 3 caracteres');
      return;
    }
    
    setError(''); // Limpa o erro se passou na validação
    createPlayer(name);
    navigate('/character');
  };

  // Função para lidar com a tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <h1>Bem-vindo à Arena!</h1>
      <p className="login-description">
        Entre com seu nome para começar sua jornada como gladiador!
      </p>
      
      <div className="login-form">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite seu nome"
          className="login-input"
          autoFocus
        />
        
        {error && <div className="login-error">{error}</div>}
        
        <button 
          onClick={handleLogin} 
          className="login-button"
          disabled={!name.trim()}
        >
          Entrar
        </button>
      </div>
      
      <div className="login-info">
        <p>Guerreiros que já batalharam aqui antes serão reconhecidos!</p>
      </div>
    </div>
  );
}