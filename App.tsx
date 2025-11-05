import React, { useState, useEffect } from 'react';
import { Player, GameState, SharedGameState } from './types';
import { PlayerSetup } from './components/PlayerSetup';
import { GameBoard } from './components/GameBoard';
import { getNewQuestion } from './services/geminiService';
import { InvitePlayerModal } from './components/InvitePlayerModal';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from './services/compression';
import { GameOver } from './components/GameOver';

const MAX_QUESTIONS = 100;

const App: React.FC = () => {
  // Helper to get a URL compatible with the history API, especially in blob contexts
  const getBaseUrlForHistory = () => {
    const href = window.location.href;
    const hashIndex = href.indexOf('#');
    return hashIndex >= 0 ? href.substring(0, hashIndex) : href;
  };

  // Helper to get a publicly shareable base URL. Avoids blob URLs.
  const getBaseUrlForSharing = () => {
    // `window.location.origin` is the most reliable way to get a public, non-blob host.
    // We assume the app is hosted at the root of the domain.
    return window.location.origin;
  };

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
  const [currentTurnRecording, setCurrentTurnRecording] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState(getBaseUrlForSharing());
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [prefetchedQuestion, setPrefetchedQuestion] = useState<string | null>(null);
  const [remainingTimeOnPause, setRemainingTimeOnPause] = useState<number | null>(null);


  // On initial load, try to hydrate state from the URL hash
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      try {
        const jsonState = decompressFromEncodedURIComponent(hash);
        if (!jsonState) throw new Error("Could not decompress state from hash.");

        const decodedState = JSON.parse(jsonState) as SharedGameState;
        if ((decodedState.gameState === GameState.Playing || decodedState.gameState === GameState.Paused || decodedState.gameState === GameState.GameOver) && decodedState.sessionId) {
          setGameState(decodedState.gameState);
          setPlayers(decodedState.players);
          setCurrentPlayerIndex(decodedState.currentPlayerIndex);
          setCurrentQuestion(decodedState.currentQuestion);
          setQuestionHistory(decodedState.questionHistory);
          setTurnDuration(decodedState.turnDuration);
          setTurnStartTime(decodedState.turnStartTime);
          setSessionId(decodedState.sessionId);
          setRemainingTimeOnPause(decodedState.remainingTimeOnPause || null);
          
          const baseUrl = getBaseUrlForSharing();
          setShareUrl(`${baseUrl}#${hash}`);
        }
      } catch (e) {
        console.error("Failed to parse game state from URL hash", e);
        window.history.pushState("", document.title, getBaseUrlForHistory());
      }
    }
  }, []);

  // Prefetch the first question on the setup screen to make the game start instantly.
  useEffect(() => {
    if (gameState === GameState.Setup && !prefetchedQuestion) {
      getNewQuestion([])
        .then(setPrefetchedQuestion)
        .catch(err => {
          console.error("Failed to pre-fetch question:", err);
          // Silently fail. The question will be fetched on game start if this fails.
        });
    }
  }, [gameState, prefetchedQuestion]);

  // Polling mechanism to create a live-sync experience
  useEffect(() => {
    if (gameState === GameState.Setup || !sessionId) {
      return;
    }

    const intervalId = setInterval(() => {
      const hash = window.location.hash.substring(1);
      if (!hash) return;
      
      try {
        const jsonState = decompressFromEncodedURIComponent(hash);
        if (!jsonState) return;
        
        const decodedState = JSON.parse(jsonState) as SharedGameState;

        if (decodedState.sessionId !== sessionId) return;

        // Check if the state in the URL is different than the component's current state
        const isOutOfSync = decodedState.gameState !== gameState ||
                            decodedState.turnStartTime !== turnStartTime ||
                            decodedState.questionHistory.length !== questionHistory.length ||
                            decodedState.players.length !== players.length;

        if (isOutOfSync) {
          console.log("Syncing new state from URL...");
          setGameState(decodedState.gameState);
          setPlayers(decodedState.players);
          setCurrentPlayerIndex(decodedState.currentPlayerIndex);
          setCurrentQuestion(decodedState.currentQuestion);
          setQuestionHistory(decodedState.questionHistory);
          setTurnDuration(decodedState.turnDuration);
          setTurnStartTime(decodedState.turnStartTime);
          setRemainingTimeOnPause(decodedState.remainingTimeOnPause || null);
          
          const baseUrl = getBaseUrlForSharing();
          setShareUrl(`${baseUrl}#${hash}`);
        }
      } catch (e) {
        // Silently ignore parse errors during polling, as the hash might be in a transient state
      }
    }, 2500); // Poll every 2.5 seconds for updates

    return () => clearInterval(intervalId);
  }, [gameState, sessionId, players, questionHistory, turnStartTime]);


  // Add confirmation dialog before leaving the page during a game
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    if (gameState === GameState.Playing) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameState]);

  // Helper to update the URL hash with the new game state
  const updateUrlWithState = (newGameState: SharedGameState): string => {
    // Clean up undefined properties before serializing
    if (newGameState.remainingTimeOnPause === undefined) {
        delete newGameState.remainingTimeOnPause;
    }
    const encodedState = compressToEncodedURIComponent(JSON.stringify(newGameState));

    // URL for browser history (handles blob:)
    const historyUrl = `${getBaseUrlForHistory()}#${encodedState}`;
    window.history.replaceState(null, '', historyUrl);

    // URL for sharing (public, no blob:)
    const newShareableUrl = `${getBaseUrlForSharing()}#${encodedState}`;
    setShareUrl(newShareableUrl);
    
    return newShareableUrl;
  };

  const resetGame = () => {
      setGameState(GameState.Setup);
      setPlayers([]);
      setCurrentPlayerIndex(0);
      setCurrentQuestion('');
      setQuestionHistory([]);
      setCurrentTurnRecording(null);
      setTurnDuration(90);
      setTurnStartTime(0);
      setSessionId(null);
      setError(null);
      setRemainingTimeOnPause(null);
      
      const baseUrlForHistory = getBaseUrlForHistory();
      const baseUrlForSharing = getBaseUrlForSharing();
      setShareUrl(baseUrlForSharing);
      window.history.pushState("", document.title, baseUrlForHistory);
  };

  const handleGameStart = async (newPlayers: Player[], duration: number) => {
    setError(null);

    const setupGame = async (question: string) => {
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
      };
      
      setPlayers(newPlayers);
      setCurrentPlayerIndex(0);
      setCurrentQuestion(question);
      setQuestionHistory([question]);
      setTurnDuration(duration);
      setTurnStartTime(Date.now());
      setSessionId(newSessionId);
      setCurrentTurnRecording(null);
      setGameState(GameState.Playing);
      setPrefetchedQuestion(null); // Invalidate the prefetched question

      const newShareUrl = updateUrlWithState(newGameState);

      if (navigator.share) {
        await navigator.share({
          title: 'Family Connect Quest Game Started!',
          text: 'Join our game of Family Connect Quest! Here is the link to start playing.',
          url: newShareUrl
        }).catch((err) => console.error("Share failed", err));
      }
    };

    if (prefetchedQuestion) {
      // If question is ready, start game immediately without a loading state.
      await setupGame(prefetchedQuestion);
    } else {
      // Otherwise, show loading state while we fetch the question.
      setIsLoading(true);
      try {
        const question = await getNewQuestion([]);
        await setupGame(question);
      } catch (err) {
        setError('Failed to fetch the first question. Please try again.');
        console.error(err);
        setGameState(GameState.Setup);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleNextTurn = async () => {
    if (questionHistory.length >= MAX_QUESTIONS) {
        setGameState(GameState.GameOver);
        const newGameState: SharedGameState = {
            sessionId: sessionId!,
            gameState: GameState.GameOver,
            players,
            currentPlayerIndex,
            currentQuestion,
            questionHistory,
            turnDuration,
            turnStartTime,
            remainingTimeOnPause: remainingTimeOnPause ?? undefined,
        };
        updateUrlWithState(newGameState);
        return;
    }
      
    setIsLoading(true);
    setError(null);
    setCurrentTurnRecording(null); // Clear recording for the new turn
    
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
      };

      setCurrentPlayerIndex(nextPlayerIndex);
      setCurrentQuestion(question);
      setQuestionHistory(newQuestionHistory);
      setTurnStartTime(Date.now());

      updateUrlWithState(newGameState);

    } catch (err)
      {
      setError('Failed to fetch a new question. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRecordingComplete = (audioDataUrl: string) => {
    setCurrentTurnRecording(audioDataUrl);
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
    
    const newGameState: SharedGameState = {
        sessionId: sessionId!,
        gameState: GameState.Playing,
        players: updatedPlayers,
        currentPlayerIndex,
        currentQuestion,
        questionHistory,
        turnDuration,
        turnStartTime,
    };

    updateUrlWithState(newGameState);
    setIsInviteModalOpen(false);
  };
    
  const handleEndGame = () => {
      if (window.confirm("Are you sure you want to end the game? All progress will be lost.")) {
          resetGame();
      }
  };

  const handlePauseGame = () => {
    const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
    const remaining = Math.max(0, turnDuration - elapsed);
    setRemainingTimeOnPause(remaining);
    setGameState(GameState.Paused);

    const newGameState: SharedGameState = {
        sessionId: sessionId!,
        gameState: GameState.Paused,
        players,
        currentPlayerIndex,
        currentQuestion,
        questionHistory,
        turnDuration,
        turnStartTime, // Keep original start time for reference
        remainingTimeOnPause: remaining,
    };
    updateUrlWithState(newGameState);
  };

  const handleResumeGame = () => {
    if (remainingTimeOnPause === null) return; // Should not happen

    const elapsedBeforePause = turnDuration - remainingTimeOnPause;
    const newTurnStartTime = Date.now() - (elapsedBeforePause * 1000);

    setTurnStartTime(newTurnStartTime);
    setGameState(GameState.Playing);
    setRemainingTimeOnPause(null);

    const newGameState: SharedGameState = {
        sessionId: sessionId!,
        gameState: GameState.Playing,
        players,
        currentPlayerIndex,
        currentQuestion,
        questionHistory,
        turnDuration,
        turnStartTime: newTurnStartTime,
    };

    updateUrlWithState(newGameState);
  };

  const isPlayingOrPaused = gameState === GameState.Playing || gameState === GameState.Paused;

  return (
    <main className="bg-brand-bg min-h-screen w-full flex items-center justify-center font-sans text-brand-dark p-4">
      {gameState === GameState.Setup && <PlayerSetup onGameStart={handleGameStart} />}
      
      {isInviteModalOpen && (
        <InvitePlayerModal
            onClose={() => setIsInviteModalOpen(false)}
            onAddPlayer={handleAddPlayerToGame}
            currentPlayers={players.map(p => p.name.toLowerCase())}
            playerLimit={8}
            shareUrl={shareUrl}
        />
      )}

      {isPlayingOrPaused && players.length > 0 && (
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
          currentRecording={currentTurnRecording}
          turnIndex={questionHistory.length - 1}
          shareUrl={shareUrl}
          onInvitePlayer={() => setIsInviteModalOpen(true)}
          isPaused={gameState === GameState.Paused}
          onPauseGame={handlePauseGame}
          questionNumber={questionHistory.length}
          maxQuestions={MAX_QUESTIONS}
        />
      )}

      {gameState === GameState.GameOver && (
        <GameOver onPlayAgain={resetGame} players={players} />
      )}

      {gameState === GameState.Paused && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-40 animate-fade-in">
            <h2 className="text-6xl font-black text-white drop-shadow-lg mb-4">Paused</h2>
            <p className="text-xl text-white/90 drop-shadow-md mb-8">Take a break. We'll wait!</p>
            <button
                onClick={handleResumeGame}
                className="bg-brand-secondary text-white text-2xl font-bold py-4 px-10 rounded-lg hover:bg-opacity-90 transition transform hover:scale-105 shadow-2xl"
            >
                Resume Game
            </button>
        </div>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </main>
  );
};

export default App;
