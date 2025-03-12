// services/api.js
const API_URL = 'http://localhost:5000/api';

export const fetchWord = async () => {
  try {
    const response = await fetch(`${API_URL}/word`);
    const data = await response.json();
    
    if (data.success) {
      return data.word;
    } else {
      throw new Error(data.error || 'Failed to fetch word');
    }
  } catch (error) {
    console.error('Error fetching word:', error);
    throw error;
  }
};

export const validateGuess = async (guess, targetWord) => {
  try {
    const response = await fetch(`${API_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guess, target_word: targetWord }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.error || 'Invalid guess');
    }
  } catch (error) {
    console.error('Error validating guess:', error);
    throw error;
  }
};

export const checkWord = async (word) => {
  try {
    const response = await fetch(`${API_URL}/check_word`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.is_valid;
    } else {
      throw new Error(data.error || 'Failed to check word');
    }
  } catch (error) {
    console.error('Error checking word:', error);
    throw error;
  }
};

export const submitGame = async (word, guesses, won, userId = 'anonymous') => {
  try {
    const response = await fetch(`${API_URL}/submit_game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word, guesses, won, user_id: userId }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return true;
    } else {
      throw new Error(data.error || 'Failed to submit game');
    }
  } catch (error) {
    console.error('Error submitting game:', error);
    throw error;
  }
};

export const getStats = async (userId = 'anonymous') => {
  try {
    const response = await fetch(`${API_URL}/stats?user_id=${userId}`);
    const data = await response.json();
    
    if (data.success) {
      return data.stats;
    } else {
      throw new Error(data.error || 'Failed to fetch stats');
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};