import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import usePiNetwork from '../utils/usePiNetwork';
import './Login.css';

export default function Login() {
  const [error, setError] = useState('');
  const [piLoginLoading, setPiLoginLoading] = useState(false);
  const { showNotification, fetchPlayerByToken, loading, player } = useGame();
  const { loginWithPi } = usePiNetwork();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token && !player) {
      fetchPlayerByToken(token);
    } else if (player) {
      navigate('/character');
    }
  }, [navigate, fetchPlayerByToken, player]);

  useEffect(() => {
    if (player && !loading) {
      navigate('/character');
    }
  }, [player, loading, navigate]);

  const handlePiLogin = async () => {
    setPiLoginLoading(true);
    setError('');
    
    try {
      const authResult = await loginWithPi();
      
      if (authResult && authResult.accessToken) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

        const resp = await fetch(`${API_URL}/api/auth/pi-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: authResult.accessToken }),
        });

        if (!resp.ok) {
          const errJson = await resp.json().catch(() => null);
          throw new Error(errJson?.error || 'Falha no login Pi');
        }

        const { token: jwtToken } = await resp.json();
        localStorage.setItem('jwt', jwtToken);

        await fetchPlayerByToken(jwtToken);

      } else {
        setError('Falha na autenticação com Pi Network');
      }
    } catch (err) {
      console.error('Pi Network login error:', err);
      setError(`Erro ao conectar com Pi Network: ${err.message}`);
    } finally {
      setPiLoginLoading(false);
    }
  };

  if (loading || (localStorage.getItem('jwt') && !player && !error)) {
    return (
      <div className="login-container">
        <div className="loading-section">
          <p>Carregando dados do jogador...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <h1>Welcome to Gladiator!</h1>
      <p className="login-description">
        Connect via Pi Network to start your journey!
      </p>

      <div className="pi-login-section">
        <button
          onClick={handlePiLogin}
          className="pi-login-button"
          disabled={piLoginLoading || loading}
        >
          {piLoginLoading ? 'Connecting...' : 'Login with Pi Network'}
        </button>
      </div>

      {error && <div className="login-error">{error}</div>}

      <div className="login-info">
        <p className="pi-info">
          <strong>Pi Network:</strong> Connect with your Pi wallet for authentication.
        </p>
      </div>
    </div>
  );
}