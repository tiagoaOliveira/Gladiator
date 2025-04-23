import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Notification from './Notification';
import './Layout.css';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { logout, player, notification } = useGame();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Só exibimos a navegação se houver um jogador logado
  const showNavigation = !!player;

  return (
    <div className="container">
      {notification.show && <Notification message={notification.message} type={notification.type} />}
      
      {showNavigation && (
        <nav className="navigation">
          <Link to="/character">🏹 Perfil</Link>
          <Link to="/arena">⚔️ Arena</Link>
          <Link to="/shop">🏛️ Loja</Link>
          <button onClick={handleLogout}>🚪 Sair</button>
        </nav>
      )}
      
      <main className="content">
        {children}
      </main>
    </div>
  );
}
