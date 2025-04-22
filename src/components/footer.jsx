import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './footer.css';

export default function Footer() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('player');
    navigate('/');
  };

  return (
    <header className="footer">
      <nav className="nav-footer">
        <Link to="/character">🏹 Perfil</Link>
        <Link to="/arena">⚔️ Arena</Link>
        <Link to="/shop">🏛️ Loja</Link>
        {/* <Link to="/inventory">🎒 Inventário</Link> */}
        <button onClick={handleLogout}>🚪 Sair</button>
      </nav>
    </header>
  );
}
