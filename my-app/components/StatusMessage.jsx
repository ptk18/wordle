// components/StatusMessage.jsx
import React from 'react';

function StatusMessage({ message }) {
  if (!message) return null;
  
  return (
    <div className="status-message">
      {message}
    </div>
  );
}

export default StatusMessage;