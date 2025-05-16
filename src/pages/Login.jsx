import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import './Login.css';

export default function Login() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { player, createPlayer, loading } = useGame();
  const navigate = useNavigate();

  // Redirecionar para página de personagem se já estiver logado
  useEffect(() => {
    if (player) navigate('/character');
  }, [player, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      setError('O nome deve ter ao menos 3 caracteres');
      return;
    }
    
    setError('');
    
    try {
      await createPlayer(trimmedName);
      navigate('/character');
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro ao conectar com o servidor. Tente novamente.');
    }
  };

  return (
    <div className="login-container">
      <h1>Bem-vindo à Arena!</h1>
      <p className="login-description">
        Entre com seu nome para começar sua jornada como gladiador!
      </p>

      <form className="login-form" onSubmit={handleLogin}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Digite seu nome"
          className="login-input"
          autoFocus
          disabled={loading}
        />
        {error && <div className="login-error">{error}</div>}
        <button
          type="submit"
          className="login-button"
          disabled={loading || name.trim().length < 3}
        >
          {loading ? 'Carregando...' : 'Entrar'}
        </button>
      </form>

      <div className="login-info">
        <p>Guerreiros que já batalharam aqui antes serão reconhecidos pelo nome!</p>
      </div>
    </div>
  );
}