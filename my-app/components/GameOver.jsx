// components/GameOver.jsx
import React from 'react';

function GameOver({ gameStatus, targetWord, guessCount, onRestart }) {
  return (
    <div className="game-over-modal">
      <div className="game-over-content">
        <h2>{gameStatus === 'won' ? 'You Won!' : 'Game Over'}</h2>
        <p>
          {gameStatus === 'won' 
            ? `You guessed the word in ${guessCount} ${guessCount === 1 ? 'try' : 'tries'}!` 
            : `The word was ${targetWord}`}
        </p>
        <button className="restart-button" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
}

export default GameOver;