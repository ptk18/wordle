// components/Header.jsx
import React, { useState } from 'react';
import StatsModal from './StatsModal';

function Header({ onRestart }) {
  const [showStats, setShowStats] = useState(false);
  
  return (
    <header className="header">
      <div className="nav-buttons">
        <button className="icon-button" onClick={onRestart}>
        <i className="material-icons">refresh</i>
        </button>
      </div>
      <h1>My Little Wordle </h1>
      <div className="nav-buttons">
        <button className="icon-button" onClick={() => setShowStats(true)}>
        <i className="material-icons">equalizer</i>        </button>
      </div>
      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </header>
  );
}

export default Header;