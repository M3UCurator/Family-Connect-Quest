import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { Spinner } from './Spinner';
import { Timer } from './Timer';
import { AudioRecorder } from './AudioRecorder';

interface GameBoardProps {
  players: Player[];
  currentPlayerIndex: number;
  currentQuestion: string;
  onNextTurn: () => void;
  isLoading: boolean;
  turnDuration: number;
  turnStartTime: number;
  onEndGame: () => void;
  onRecordingComplete: (audioDataUrl: string) => void;
  currentRecording?: string;
  turnIndex: number;
  shareUrl: string;
  onInvitePlayer: () => void;
  isPaused: boolean;
  onPauseGame: () => void;
  questionNumber: number;
  maxQuestions: number;
}

const playerColors = [
  '#FFADAD', // Light Red
  '#FFD6A5', // Light Orange
  '#FDFFB6', // Light Yellow
  '#CAFFBF', // Light Green
  '#9BF6FF', // Light Blue
  '#A0C4FF', // Light Indigo
  '#BDB2FF', // Light Purple
  '#FFC6FF', // Light Pink
];

const getInitials = (name: string) => {
  const names = name.trim().split(' ');
  if (names.length > 1 && names[names.length -1]) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};


export const GameBoard: React.FC<GameBoardProps> = ({
  players,
  currentPlayerIndex,
  currentQuestion,
  onNextTurn,
  isLoading,
  turnDuration,
  turnStartTime,
  onEndGame,
  onRecordingComplete,
  currentRecording,
  turnIndex,
  shareUrl,
  onInvitePlayer,
  isPaused,
  onPauseGame,
  questionNumber,
  maxQuestions,
}) => {
  const currentPlayer = players[currentPlayerIndex];
  const [copied, setCopied] = useState(false);
  const isShareSupported = useMemo(() => navigator.share !== undefined, []);

  const handleShareLink = async () => {
    const shareData = {
      title: 'Family Connect Quest',
      text: "It's the next player's turn in our game! Here is the updated link.",
      url: shareUrl,
    };

    if (isShareSupported) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
        // User may have cancelled the share action, do nothing.
      }
    } else {
      // Fallback for desktop browsers
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-4 md:p-8 relative">
       <button
        onClick={onPauseGame}
        aria-label="Pause Game"
        disabled={isPaused}
        className="absolute top-4 right-4 text-brand-secondary hover:text-brand-primary p-2 rounded-full bg-white/80 shadow-md transition z-10 disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Top Section: Player list and current turn */}
      <div className="w-full">
        <div className="w-full flex justify-center items-center gap-x-4 gap-y-2 mb-6 flex-wrap animate-fade-in">
          {players.map((player, index) => {
            const initials = getInitials(player.name);
            const color = playerColors[index % playerColors.length];
            const isCurrentPlayer = index === currentPlayerIndex;

            return (
              <div
                key={player.id}
                title={player.name} // Tooltip for player name
                className={`p-1 rounded-full transition-all duration-300 ease-in-out transform ${
                  isCurrentPlayer
                    ? 'bg-brand-accent scale-110 shadow-lg ring-4 ring-brand-primary'
                    : 'bg-white/70 shadow-sm'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-brand-dark font-black text-base"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </div>
              </div>
            );
          })}
        </div>
        
        <Timer 
          key={`${currentPlayerIndex}-${turnStartTime}`} // Re-mount timer on turn change to ensure reset
          startTime={turnStartTime} 
          duration={turnDuration} 
        />
        <div className="text-center text-lg font-bold text-brand-secondary/80 mb-4 animate-fade-in">
          Question {questionNumber}/{maxQuestions}
        </div>
        <div className="text-center animate-fade-in">
          <p className="text-xl md:text-2xl text-brand-dark">It's your turn,</p>
          <h1 className="text-4xl md:text-6xl font-black text-brand-primary drop-shadow-md">{currentPlayer.name}!</h1>
        </div>
      </div>
      
      {/* Middle Section: Question and Audio Recorder */}
      <div className="w-full max-w-2xl flex-grow flex flex-col items-center justify-center my-6 space-y-6">
        <div className="relative w-full min-h-[16rem] md:min-h-[20rem] bg-white rounded-2xl shadow-2xl p-6 md:p-10 flex items-center justify-center text-center">
           {isLoading ? (
            <Spinner />
          ) : (
            <div className="animate-pop-in">
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-brand-dark leading-snug">
                    {currentQuestion}
                </p>
            </div>
          )}
        </div>
        <div className="w-full">
            <AudioRecorder
                onRecordingComplete={onRecordingComplete}
                currentRecording={currentRecording}
                turnIndex={turnIndex}
                disabled={isLoading || isPaused}
            />
        </div>
      </div>


      {/* Bottom Section: Controls */}
      <div className="w-full max-w-md">
         <button
            onClick={onNextTurn}
            disabled={isLoading || isPaused}
            className="w-full bg-brand-secondary text-white text-xl font-bold py-4 rounded-lg hover:bg-opacity-90 transition transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100 shadow-lg"
          >
            {isLoading ? 'Thinking of a question...' : 'Next Turn & New Question'}
          </button>
          <div className="text-center mt-4 animate-fade-in">
            <p className="text-sm text-brand-dark/80 mb-2">
              The game is live! Share the link with anyone who needs to join the game.
            </p>
            <button
                onClick={handleShareLink}
                disabled={isPaused}
                className="w-full bg-brand-accent text-brand-dark text-lg font-bold py-3 rounded-lg hover:bg-opacity-90 transition transform hover:scale-105 shadow-md disabled:bg-yellow-200 disabled:cursor-not-allowed disabled:scale-100"
            >
                {isShareSupported 
                  ? '🔗 Share Game Link' 
                  : (copied ? '✅ Link Copied!' : '📋 Copy Game Link')
                }
            </button>
        </div>
        <div className="text-center mt-4 flex justify-center items-center gap-4">
            <button onClick={onInvitePlayer} disabled={isPaused} className="text-sm text-gray-500 hover:text-brand-secondary font-semibold underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline">
                Invite Player
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={onNextTurn}
              disabled={isLoading || isPaused}
              className="text-sm text-gray-500 hover:text-brand-primary font-semibold underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline"
            >
              Skip Turn
            </button>
            <span className="text-gray-400">|</span>
            <button onClick={onEndGame} disabled={isPaused} className="text-sm text-gray-500 hover:text-brand-primary font-semibold underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline">
                End Game & Start Over
            </button>
        </div>
      </div>
    </div>
  );
};
