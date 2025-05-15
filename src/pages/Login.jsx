// src/pages/Login.jsx  (baseado na sua versão :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3})
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import './Login.css';

export default function Login() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { player, createPlayer } = useGame();

  useEffect(() => {
    if (player) navigate('/character');
  }, [player, navigate]);

  const handleLogin = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setError('O nome deve ter ao menos 3 caracteres');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await createPlayer(trimmed);
      navigate('/character');
    } catch (err) {
      console.error(err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = e => e.key === 'Enter' && handleLogin();

  return (
    <div className="login-container">
      <h1>Bem‑vindo à Arena!</h1>
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
          disabled={loading}
        />
        {error && <div className="login-error">{error}</div>}
        <button
          onClick={handleLogin}
          className="login-button"
          disabled={loading || name.trim().length < 3}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>

      <div className="login-info">
        <p>Guerreiros que já batalharam aqui antes serão reconhecidos!</p>
      </div>
    </div>
  );
}
