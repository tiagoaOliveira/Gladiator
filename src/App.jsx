import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Layout from './components/layout';
import Login from './pages/Login';
import Character from './pages/Character';
import Arena from './pages/Arena';
import Shop from './pages/Shop';

function App() {
  return (
    <GameProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout><Login /></Layout>} />
          <Route path="/character" element={<Layout><Character /></Layout>} />
          <Route path="/arena" element={<Layout><Arena /></Layout>} />
          <Route path="/shop" element={<Layout><Shop /></Layout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </GameProvider>
  );
}

export default App;