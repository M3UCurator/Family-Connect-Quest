import React, { useState, useEffect } from 'react';
import { Player, GameState, SharedGameState } from './types';
import { PlayerSetup } from './components/PlayerSetup';
import { GameBoard } from './components/GameBoard';
import { getNewQuestion } from './services/geminiService';
import { InvitePlayerModal } from './components/InvitePlayerModal';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Setup);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  const [turnDuration, setTurnDuration] = useState(90); // Default 90 seconds
  const [turnStartTime, setTurnStartTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<Record<number, string>>({});
  const [shareUrl, setShareUrl] = useState(window.location.origin + window.location.pathname);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

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
          setTurnDuration(decodedState.turnDuration);
          setTurnStartTime(decodedState.turnStartTime);
          setSessionId(decodedState.sessionId);
          setRecordings(decodedState.recordings || {});
        }
      } catch (e) {
        console.error("Failed to parse game state from URL hash", e);
        // Clear hash if it's invalid
        window.history.pushState("", document.title, window.location.pathname + window.location.search);
      }
    }
  }, []);

  // Add confirmation dialog before leaving the page during a game
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Standard way to trigger the browser's confirmation dialog.
      event.preventDefault();
      // Required for some older browsers.
      event.returnValue = '';
    };

    if (gameState === GameState.Playing) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    // Cleanup function to remove the listener when the component unmounts
    // or when the game state is no longer 'Playing'.
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameState]); // Rerun this effect if gameState changes

  const handleGameStart = async (newPlayers: Player[], duration: number) => {
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
        turnDuration: duration,
        turnStartTime: Date.now(),
        recordings: {},
      };
      
      // Update local state
      setPlayers(newPlayers);
      setCurrentPlayerIndex(0);
      setCurrentQuestion(question);
      setQuestionHistory([question]);
      setTurnDuration(duration);
      setTurnStartTime(Date.now());
      setSessionId(newSessionId);
      setRecordings({});
      setGameState(GameState.Playing);

      // Generate the shareable URL and update state
      const encodedState = btoa(JSON.stringify(newGameState));
      const baseUrl = window.location.origin + window.location.pathname;
      const newUrl = `${baseUrl}#${encodedState}`;
      setShareUrl(newUrl);

      // Automatically prompt user to share the newly created game link
      if (navigator.share) {
        await navigator.share({
          title: 'Family Connect Quest Game Started!',
          text: 'Join our game of Family Connect Quest! Here is the link to start playing.',
          url: newUrl
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
        turnDuration: turnDuration,
        turnStartTime: Date.now(),
        recordings: recordings,
      };

      // Update local state
      setCurrentPlayerIndex(nextPlayerIndex);
      setCurrentQuestion(question);
      setQuestionHistory(newQuestionHistory);
      setTurnStartTime(Date.now());

      // Generate the shareable URL and update state
      const encodedState = btoa(JSON.stringify(newGameState));
      const baseUrl = window.location.origin + window.location.pathname;
      const newUrl = `${baseUrl}#${encodedState}`;
      setShareUrl(newUrl);

    } catch (err) {
      setError('Failed to fetch a new question. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRecordingComplete = (audioDataUrl: string) => {
    const turnIndex = questionHistory.length - 1;
    const newRecordings = {
        ...recordings,
        [turnIndex]: audioDataUrl,
    };

    setRecordings(newRecordings);

    const newGameState: SharedGameState = {
        sessionId: sessionId!,
        gameState: GameState.Playing,
        players,
        currentPlayerIndex,
        currentQuestion,
        questionHistory,
        turnDuration,
        turnStartTime,
        recordings: newRecordings,
    };

    // Generate the shareable URL and update state
    const encodedState = btoa(JSON.stringify(newGameState));
    const baseUrl = window.location.origin + window.location.pathname;
    const newUrl = `${baseUrl}#${encodedState}`;
    setShareUrl(newUrl);
  };

  const handleAddPlayerToGame = (newPlayerName: string) => {
    if (players.length >= 8) {
      console.error("Cannot add more than 8 players.");
      setIsInviteModalOpen(false);
      return;
    }
    
    const newPlayer: Player = { id: Date.now(), name: newPlayerName.trim() };
    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    
    // Create new game state with the added player, but keep the current turn as is.
    const newGameState: SharedGameState = {
        sessionId: sessionId!,
        gameState: GameState.Playing,
        players: updatedPlayers,
        currentPlayerIndex,
        currentQuestion,
        questionHistory,
        turnDuration,
        turnStartTime,
        recordings,
    };

    const encodedState = btoa(JSON.stringify(newGameState));
    const baseUrl = window.location.origin + window.location.pathname;
    const newUrl = `${baseUrl}#${encodedState}`;
    setShareUrl(newUrl);

    setIsInviteModalOpen(false);
  };
    
  const handleEndGame = () => {
      if (window.confirm("Are you sure you want to end the game? All progress and recordings will be lost.")) {
          setGameState(GameState.Setup);
          setPlayers([]);
          setCurrentPlayerIndex(0);
          setCurrentQuestion('');
          setQuestionHistory([]);
          setRecordings({});
          setTurnDuration(90);
          setTurnStartTime(0);
          setSessionId(null);
          setError(null);
          
          const baseUrl = window.location.origin + window.location.pathname;
          setShareUrl(baseUrl);
      }
  };

  return (
    <main className="bg-brand-bg min-h-screen w-full flex items-center justify-center font-sans text-brand-dark p-4">
      {gameState === GameState.Setup && <PlayerSetup onGameStart={handleGameStart} />}
      
      {isInviteModalOpen && (
        <InvitePlayerModal
            onClose={() => setIsInviteModalOpen(false)}
            onAddPlayer={handleAddPlayerToGame}
            currentPlayers={players.map(p => p.name.toLowerCase())}
            playerLimit={8}
        />
      )}

      {gameState === GameState.Playing && players.length > 0 && (
        <GameBoard
          players={players}
          currentPlayerIndex={currentPlayerIndex}
          currentQuestion={currentQuestion}
          onNextTurn={handleNextTurn}
          isLoading={isLoading}
          turnDuration={turnDuration}
          turnStartTime={turnStartTime}
          onEndGame={handleEndGame}
          onRecordingComplete={handleRecordingComplete}
          currentRecording={recordings[questionHistory.length - 1]}
          turnIndex={questionHistory.length - 1}
          shareUrl={shareUrl}
          onInvitePlayer={() => setIsInviteModalOpen(true)}
        />
      )}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </main>
  );
};

export default App;
