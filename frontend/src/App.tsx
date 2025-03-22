import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './components/MainPage/MainPage';
import LoginPage from './components/LoginPage/LoginPage';
import Room from './components/RoomPage/RoomPage'; // Přidejte import komponenty Room
import AdminPanel from './components/AdminPanel/AdminPanel';
import FeaturePage from './components/FeaturePage/FeaturePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/room/:roomCode" element={<Room />} /> {/* Přidaná routa */}
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/feature" element={<FeaturePage />} />
      </Routes>
    </Router>
  );
}

export default App;