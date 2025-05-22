import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Layout from './components/layout';
import Login from './pages/Login';
import Character from './pages/Character';
import Arena from './pages/Arena';
import Torneio from './pages/Torneio';
import Shop from './pages/Shop';
import Missões from './pages/Missões';

function App() {
  return (
    <GameProvider>
      <Router future={{ v7_startTransition: true }}>
        <Routes>
          <Route path="/" element={<Layout><Login /></Layout>} />
          <Route path="/character" element={<Layout><Character /></Layout>} />
          <Route path="/arena" element={<Layout><Arena /></Layout>} />
          <Route path='/Torneio' element={<Layout><Torneio/></Layout>}/>
          <Route path="/shop" element={<Layout><Shop /></Layout>} />
          <Route path="/missões" element={<Layout><Missões /></Layout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </GameProvider>
  );
}

export default App;