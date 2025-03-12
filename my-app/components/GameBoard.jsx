// components/GameBoard.jsx
import React from 'react';
import Row from './Row';

function GameBoard({ guesses, currentGuess, guessIndex, targetWord }) {
  return (
    <div className="game-board">
      {guesses.map((guess, i) => {
        // Current row with user input
        if (i === guessIndex) {
          return (
            <Row 
              key={i}
              word={currentGuess.padEnd(5, ' ')}
              targetWord={targetWord}
              submitted={false}
            />
          );
        }
        // Submitted rows
        else if (i < guessIndex) {
          return (
            <Row 
              key={i}
              word={guess}
              targetWord={targetWord}
              submitted={true}
            />
          );
        }
        // Future rows
        else {
          return (
            <Row 
              key={i}
              word="     "
              targetWord={targetWord}
              submitted={false}
            />
          );
        }
      })}
    </div>
  );
}

export default GameBoard;