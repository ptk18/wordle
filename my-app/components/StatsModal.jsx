// components/StatsModal.jsx
import React, { useState, useEffect } from 'react';
import { getStats } from '../src/services/api';

function StatsModal({ onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await getStats();
        setStats(statsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content stats-modal">
          <button className="close-button" onClick={onClose}>×</button>
          <h2>Statistics</h2>
          <div className="loading">Loading stats...</div>
        </div>
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="modal-overlay">
        <div className="modal-content stats-modal">
          <button className="close-button" onClick={onClose}>×</button>
          <h2>Statistics</h2>
          <div>No statistics available</div>
        </div>
      </div>
    );
  }
  
  // Calculate win percentage
  const winPercentage = stats.total_games > 0 
    ? Math.round((stats.games_won / stats.total_games) * 100) 
    : 0;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content stats-modal" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Statistics</h2>
        
        <div className="stats-container">
          <div className="stat-box">
            <div className="stat-value">{stats.total_games}</div>
            <div className="stat-label">Played</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{winPercentage}</div>
            <div className="stat-label">Win %</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{stats.current_streak}</div>
            <div className="stat-label">Current Streak</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{stats.max_streak}</div>
            <div className="stat-label">Max Streak</div>
          </div>
        </div>
        
        <h3>Guess Distribution</h3>
        <div className="guess-distribution">
          {Object.entries(stats.win_distribution).map(([guessCount, count]) => {
            const percentage = stats.games_won > 0 
              ? (count / stats.games_won) * 100 
              : 0;
            
            return (
              <div className="guess-row" key={guessCount}>
                <div className="guess-number">{guessCount}</div>
                <div className="guess-bar-container">
                  <div 
                    className="guess-bar" 
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StatsModal;