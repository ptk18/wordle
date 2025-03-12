// components/Keyboard.jsx
import React from 'react';

function Keyboard({ onKeyPress, keyStatus }) {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  return (
    <div className="keyboard">
      {rows.map((row, i) => (
        <div key={i} className="keyboard-row">
          {row.map(key => {
            let className = 'key';
            if (key === 'ENTER' || key === 'BACKSPACE') {
              className += ' key-wide';
            }
            if (keyStatus[key]) {
              className += ` ${keyStatus[key]}`;
            }
            
            return (
              <button 
                key={key} 
                className={className}
                onClick={() => onKeyPress(key)}
              >
                {key === 'BACKSPACE' ? '←' : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default Keyboard;