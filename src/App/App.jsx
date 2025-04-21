import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Arena from '../pages/Arena';
import Character from '../pages/Character';
import Shop from '../pages/Shop';
import Layout from '../components/Layout';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Login /></Layout>} />
        <Route path="/arena" element={<Layout><Arena /></Layout>} />
        <Route path="/character" element={<Layout><Character /></Layout>} />
        <Route path="/shop" element={<Layout><Shop /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
