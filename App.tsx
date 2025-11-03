import React, { useState, useEffect, useCallback } from 'react';
import { Player, GameState, SharedGameState } from './types';
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
  const [sessionId, setSessionId] = useState<string | null>(null);

  // On initial load, try to hydrate state from the URL hash
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      try {
        const decodedState = JSON.parse(atob(hash)) as SharedGameState;
        if (decodedState.gameState === GameState.Playing && decodedState.sessionId) {
          setGameState(decodedState.gameState);
          setPlayers(decodedState.players);
          setCurrentPlayerIndex(decodedState.currentPlayerIndex);
          setCurrentQuestion(decodedState.currentQuestion);
          setQuestionHistory(decodedState.questionHistory);
          setSessionId(decodedState.sessionId);
        }
      } catch (e) {
        console.error("Failed to parse game state from URL hash", e);
        // Clear hash if it's invalid
        window.history.pushState("", document.title, window.location.pathname + window.location.search);
      }
    }
  }, []);

  const updateUrlWithState = (newState: SharedGameState) => {
    const encodedState = btoa(JSON.stringify(newState));
    // Use replaceState to avoid polluting browser history for every turn
    window.history.replaceState(null, '', '#' + encodedState);
  };

  const handleGameStart = async (newPlayers: Player[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const question = await getNewQuestion([]);
      const newSessionId = `fcq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newGameState: SharedGameState = {
        sessionId: newSessionId,
        gameState: GameState.Playing,
        players: newPlayers,
        currentPlayerIndex: 0,
        currentQuestion: question,
        questionHistory: [question],
      };
      
      // Update local state
      setPlayers(newPlayers);
      setCurrentPlayerIndex(0);
      setCurrentQuestion(question);
      setQuestionHistory([question]);
      setSessionId(newSessionId);
      setGameState(GameState.Playing);

      // Update URL first, so the correct link is shared
      updateUrlWithState(newGameState);

      // Automatically prompt user to share the newly created game link
      if (navigator.share) {
        await navigator.share({
          title: 'Family Connect Quest Game Started!',
          text: 'Join our game of Family Connect Quest! Here is the link to start playing.',
          url: window.location.href
        }).catch((err) => console.error("Share failed", err));
      }

    } catch (err) {
      setError('Failed to fetch the first question. Please try again.');
      console.error(err);
      setGameState(GameState.Setup);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextTurn = async () => {
    setIsLoading(true);
    setError(null);
    
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

    try {
      const question = await getNewQuestion(questionHistory);
      const newQuestionHistory = [...questionHistory, question];
      const newGameState: SharedGameState = {
        sessionId: sessionId!,
        gameState: GameState.Playing,
        players,
        currentPlayerIndex: nextPlayerIndex,
        currentQuestion: question,
        questionHistory: newQuestionHistory,
      };

      // Update local state
      setCurrentPlayerIndex(nextPlayerIndex);
      setCurrentQuestion(question);
      setQuestionHistory(newQuestionHistory);

      // Update URL
      updateUrlWithState(newGameState);

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