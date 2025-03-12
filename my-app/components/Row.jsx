// components/Row.jsx
import React from 'react';
import Tile from './Tile';

function Row({ word, targetWord, submitted }) {
  return (
    <div className="row">
      {Array.from(word).map((letter, i) => {
        let status = 'empty';
        
        if (submitted) {
          if (letter === targetWord[i]) {
            status = 'correct';
          } else if (targetWord.includes(letter)) {
            // Handle duplicate letters properly
            const letterIndicesInTarget = [...targetWord].map((char, index) => 
              char === letter ? index : -1
            ).filter(index => index !== -1);
            
            const letterIndicesInGuess = [...word].map((char, index) => 
              char === letter ? index : -1
            ).filter(index => index !== -1);
            
            // Count exact matches first
            const exactMatches = letterIndicesInGuess.filter(
              guessIndex => targetWord[guessIndex] === letter
            ).length;
            
            // If there are more occurrences in target than exact matches
            // and this is not an exact match, mark as present
            if (letterIndicesInTarget.length > exactMatches && 
                targetWord[i] !== letter) {
              // Check if we've already used up all the yellow markers
              const yellowsNeeded = Math.min(
                letterIndicesInTarget.length - exactMatches,
                letterIndicesInGuess.length - exactMatches
              );
              
              const yellowsAssignedBefore = letterIndicesInGuess
                .filter(idx => idx < i && targetWord[idx] !== letter)
                .length;
              
              if (yellowsAssignedBefore < yellowsNeeded) {
                status = 'present';
              } else {
                status = 'absent';
              }
            } else {
              status = 'absent';
            }
          } else {
            status = 'absent';
          }
        } else if (letter !== ' ') {
          status = 'tbd';
        }
        
        return <Tile key={i} letter={letter} status={status} />;
      })}
    </div>
  );
}

export default Row;