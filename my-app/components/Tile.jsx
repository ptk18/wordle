// components/Tile.jsx
import React from 'react';

function Tile({ letter, status }) {
  return (
    <div className={`tile ${status}`}>
      {letter !== ' ' ? letter : ''}
    </div>
  );
}

export default Tile;