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
      // Só chama fetchPlayerByToken se não tiver player carregado
      console.log('Login.jsx: Token encontrado, carregando dados do player...');
      fetchPlayerByToken(token);
    } else if (player) {
      // Se já tem player, navega direto
      console.log('Login.jsx: Player já carregado, navegando para /character');
      navigate('/character');
    }
  }, [navigate, fetchPlayerByToken, player]);

  // Navegar quando o player for carregado
  useEffect(() => {
    if (player && !loading) {
      console.log('Login.jsx: Player carregado com sucesso:', player);
      navigate('/character');
    }
  }, [player, loading, navigate]);

  const handlePiLogin = async () => {
    setPiLoginLoading(true);
    setError('');
    
    try {
      console.log('Login.jsx: Iniciando login Pi Network...');
      const authResult = await loginWithPi();
      
      if (authResult && authResult.accessToken) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        console.log('Login.jsx: usando API_URL =', API_URL);

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
        console.log('Login.jsx: JWT token recebido, salvando...');
        localStorage.setItem('jwt', jwtToken);

        // Aguardar um pouco antes de carregar os dados do player
        console.log('Login.jsx: Carregando dados do player...');
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

  // Mostrar loading se estiver carregando dados do player
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
      <h1>Bem-vindo à Arena!</h1>
      <p className="login-description">
        Conecte-se via Pi Network para começar sua jornada como gladiador!
      </p>

      {/* Botão de login via Pi Network */}
      <div className="pi-login-section">
        <button
          onClick={handlePiLogin}
          className="pi-login-button"
          disabled={piLoginLoading || loading}
        >
          {piLoginLoading ? 'Conectando...' : '🥧 Entrar com Pi Network'}
        </button>
      </div>

      {error && <div className="login-error">{error}</div>}

      <div className="login-info">
        <p className="pi-info">
          <strong>Pi Network:</strong> Conecte-se com sua carteira Pi para autenticação.
        </p>
      </div>
    </div>
  );
}