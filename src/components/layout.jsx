// src/components/Layout.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Notification from './Notification';
import NotificationDot from './NotificationDot';
import ProgressBar from './ProgressBar';
import './Layout.css';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { logout, player, notification, getCompletedMissions } = useGame();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Exibe navegação somente se houver jogador logado
  const showNavigation = !!player;

  // Verifica se há pontos disponiveis,missão e pouco HP
  const hasAttributePoints = player && player.attributePoints > 0;
  const hasCompletedMissions = getCompletedMissions().length > 0;
  const hasLowHealth = player && player.hp < (player.maxHp * 0.3);

  // Alterna estado de menu (para mobile)
  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  // Fecha menu (chamado ao clicar em um link no mobile)
  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="container">
      {notification.show && (
        <Notification message={notification.message} type={notification.type} />
      )}

      {showNavigation && (
        <nav className={`navigation ${menuOpen ? 'open' : ''}`}>
          {/* Ícone de "hamburger" apenas em mobile */}
          <button className="mobile-toggle-btn" onClick={toggleMenu}>
            ☰
            <NotificationDot show={hasAttributePoints} />
          </button>

          {/* Links de navegação */}
          <div className="nav-links">
            <Link to="/character" onClick={closeMenu}>
              🏹 Perfil
              <NotificationDot show={hasAttributePoints} />
            </Link>
            <Link to="/arena" onClick={closeMenu}>⚔️ Arena</Link>
            <Link to="/Torneio" onClick={closeMenu}>🏆 Torneio</Link>
            <Link to="/shop" onClick={closeMenu}>
              🏛️ Loja
              <NotificationDot show={hasLowHealth} />
            </Link>
            <Link to="/missoes" onClick={closeMenu}>
              📜 Missões
              <NotificationDot show={hasCompletedMissions} />
            </Link>
            <Link to="/tutorial" onClick={closeMenu}>📖 Tutorial</Link>
            <button onClick={() => { closeMenu(); handleLogout(); }}>
              🚪 Sair
            </button>
          </div>
          {showNavigation && (
            <div className="character-game-footer">
              <div className="level-circle">
                {player.level}
              </div>
              <div className="health-bar-container">
                <ProgressBar current={player.hp} max={player.maxHp} type="hp" />
              </div>
              <div className="xp-bar-container">
                <ProgressBar current={player.xp} max={player.xpToNextLevel} type="xp" />
              </div>
            </div>
          )}
        </nav>

      )}

      <main className="content">{children}</main>

    </div>
  );
}