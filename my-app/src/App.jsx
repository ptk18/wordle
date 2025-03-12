// App.jsx - Main component
import React, { useState, useEffect } from 'react';
import GameBoard from '../components/GameBoard';
import Keyboard from '../components/Keyboard';
import Header from '../components/Header';
import GameOver from '../components/GameOver';
import StatusMessage from '../components/StatusMessage';
import { fetchWord, validateGuess, checkWord, submitGame } from './services/api';
import './App.css';

function App() {
  // Game state
  const [word, setWord] = useState('');
  const [guesses, setGuesses] = useState(Array(6).fill(''));
  const [currentGuess, setCurrentGuess] = useState('');
  const [guessIndex, setGuessIndex] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [keyboardStatus, setKeyboardStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Fetch word from backend when component mounts
  useEffect(() => {
    const getWordFromServer = async () => {
      try {
        setIsLoading(true);
        const newWord = await fetchWord();
        setWord(newWord);
        setIsLoading(false);
      } catch {
        setError('Failed to fetch word from server');
        setIsLoading(false);
      }
    };

    getWordFromServer();
  }, []);

  // Handle keyboard input
  const handleKeyPress = async (key) => {
    if (gameStatus !== 'playing') return;
    
    if (key === 'ENTER') {
      if (currentGuess.length !== 5) {
        setStatusMessage('Word must be 5 letters');
        setTimeout(() => setStatusMessage(''), 2000);
        return;
      }
      
      try {
        // Check if it's a valid word first
        const isValid = await checkWord(currentGuess);
        
        if (!isValid) {
          setStatusMessage('Not in word list');
          setTimeout(() => setStatusMessage(''), 2000);
          return;
        }
        
        // Validate the guess with the backend
        const validation = await validateGuess(currentGuess, word);
        
        // Submit guess
        const newGuesses = [...guesses];
        newGuesses[guessIndex] = currentGuess;
        setGuesses(newGuesses);
        
        // Check if won
        if (validation.is_correct) {
          setGameStatus('won');
          // Submit game result to backend
          await submitGame(word, [...newGuesses.filter(g => g !== ''), currentGuess], true);
          return;
        }
        
        // Check if lost
        if (guessIndex === 5) {
          setGameStatus('lost');
          // Submit game result to backend
          await submitGame(word, [...newGuesses.filter(g => g !== ''), currentGuess], false);
          return;
        }
        
        // Move to next guess
        setGuessIndex(guessIndex + 1);
        setCurrentGuess('');
        
        // Update keyboard status from API response
        updateKeyboardFromValidation(validation.letter_statuses);
      } catch (err) {
        setStatusMessage(err.message || 'Error validating guess');
        setTimeout(() => setStatusMessage(''), 2000);
      }
      
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(currentGuess.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
      setCurrentGuess(currentGuess + key);
    }
  };

  // Update keyboard colors based on validation from backend
  const updateKeyboardFromValidation = (letterStatuses) => {
    const newStatus = { ...keyboardStatus };
    
    letterStatuses.forEach(({ letter, status }) => {
      if (!newStatus[letter] || 
          (newStatus[letter] !== 'correct' && status === 'correct') ||
          (newStatus[letter] === 'absent' && status === 'present')) {
        newStatus[letter] = status;
      }
    });
    
    setKeyboardStatus(newStatus);
  };

  // Reset game
  const resetGame = async () => {
    setGuesses(Array(6).fill(''));
    setCurrentGuess('');
    setGuessIndex(0);
    setGameStatus('playing');
    setKeyboardStatus({});
    setStatusMessage('');
    
    try {
      setIsLoading(true);
      const newWord = await fetchWord();
      setWord(newWord);
      setIsLoading(false);
    } catch {
      setError('Failed to fetch new word');
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="app">
      <Header onRestart={resetGame} />
      {statusMessage && <StatusMessage message={statusMessage} />}
      <GameBoard 
        guesses={guesses}
        currentGuess={currentGuess}
        guessIndex={guessIndex}
        targetWord={word}
      />
      <Keyboard 
        onKeyPress={handleKeyPress}
        keyStatus={keyboardStatus}
      />
      {gameStatus !== 'playing' && (
        <GameOver 
          gameStatus={gameStatus}
          targetWord={word}
          guessCount={guessIndex + 1}
          onRestart={resetGame}
        />
      )}
    </div>
  );
}

export default App;