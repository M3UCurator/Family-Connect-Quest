
import React, { useState, useEffect, useCallback } from 'react';
import { Player, GameState } from './types';
import { PlayerSetup } from './components/PlayerSetup';
import { GameBoard } from './components/GameBoard';
import { getNewQuestion } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Setup);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);

  const fetchFirstQuestion = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const question = await getNewQuestion([]);
      setCurrentQuestion(question);
      setQuestionHistory([question]);
    } catch (err) {
      setError('Failed to fetch the first question. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleGameStart = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setGameState(GameState.Playing);
    fetchFirstQuestion();
  };

  const handleNextTurn = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
    try {
      const question = await getNewQuestion(questionHistory);
      setCurrentQuestion(question);
      setQuestionHistory(prev => [...prev, question]);
    } catch (err) {
      setError('Failed to fetch a new question. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-brand-bg min-h-screen w-full flex items-center justify-center font-sans text-brand-dark p-4">
      {gameState === GameState.Setup && <PlayerSetup onGameStart={handleGameStart} />}
      {gameState === GameState.Playing && players.length > 0 && (
        <GameBoard
          players={players}
          currentPlayerIndex={currentPlayerIndex}
          currentQuestion={currentQuestion}
          onNextTurn={handleNextTurn}
          isLoading={isLoading}
        />
      )}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </main>
  );
};

export default App;
