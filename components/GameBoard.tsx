
import React, { useState } from 'react';
import { Player } from '../types';
import { Spinner } from './Spinner';

interface GameBoardProps {
  players: Player[];
  currentPlayerIndex: number;
  currentQuestion: string;
  onNextTurn: () => void;
  isLoading: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  players,
  currentPlayerIndex,
  currentQuestion,
  onNextTurn,
  isLoading,
}) => {
  const currentPlayer = players[currentPlayerIndex];
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-4 md:p-8">
      {/* Top Section: Player list and current turn */}
      <div className="w-full">
        <div className="w-full flex justify-center items-center gap-x-4 gap-y-2 mb-6 flex-wrap animate-fade-in">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center gap-2 py-2 px-4 rounded-full transition-all duration-300 ease-in-out transform ${
                index === currentPlayerIndex
                  ? 'bg-brand-accent scale-110 shadow-lg ring-4 ring-brand-primary'
                  : 'bg-white/70 shadow-sm'
              }`}
            >
              <span className="text-xl md:text-2xl" role="img" aria-label="Popcorn">🍿</span>
              <span className={`font-bold text-sm md:text-base ${ index === currentPlayerIndex ? 'text-brand-dark' : 'text-gray-700'}`}>
                {player.name}
              </span>
            </div>
          ))}
        </div>
        
        <div className="text-center animate-fade-in">
          <p className="text-xl md:text-2xl text-brand-dark">It's your turn,</p>
          <h1 className="text-4xl md:text-6xl font-black text-brand-primary drop-shadow-md">{currentPlayer.name}!</h1>
        </div>
      </div>
      
      <div className="w-full max-w-2xl flex-grow flex items-center justify-center my-6">
        <div className="relative w-full h-64 md:h-80 bg-white rounded-2xl shadow-2xl p-6 md:p-10 flex items-center justify-center text-center perspective-1000">
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
      </div>

      <div className="w-full max-w-md">
         <button
            onClick={onNextTurn}
            disabled={isLoading}
            className="w-full bg-brand-secondary text-white text-xl font-bold py-4 rounded-lg hover:bg-opacity-90 transition transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100 shadow-lg"
          >
            {isLoading ? 'Thinking of a question...' : 'Next Turn & New Question'}
          </button>
          <div className="text-center mt-4 animate-fade-in">
            <p className="text-sm text-brand-dark/80 mb-2">
              Done with your turn? Copy the updated game link and share it!
            </p>
            <button
                onClick={handleCopyLink}
                className="w-full bg-brand-accent text-brand-dark text-lg font-bold py-3 rounded-lg hover:bg-opacity-90 transition transform hover:scale-105 shadow-md"
            >
                {copied ? '✅ Link Copied!' : '📋 Copy Game Link'}
            </button>
        </div>
      </div>
    </div>
  );
};
