import React from 'react';
import { Player } from '../types';

interface GameOverProps {
  onPlayAgain: () => void;
  players: Player[];
}

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-brand-accent drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12.25,2A1.25,1.25,0,0,0,11,3.25V5.1A3.74,3.74,0,0,0,8.5,8.55L7.84,9.21A5.25,5.25,0,0,0,5.75,13v1A2.25,2.25,0,0,0,8,16.25H9.16a2.75,2.75,0,0,1,5.68,0H16a2.25,2.25,0,0,0,2.25-2.25V13a5.25,5.25,0,0,0-2.09-4.24L15.5,8.55A3.74,3.74,0,0,0,13,5.1V3.25A1.25,1.25,0,0,0,12.25,2ZM9,18.25a1.25,1.25,0,0,0,1.25,1.25h3.5A1.25,1.25,0,0,0,15,18.25V17.5H9ZM7.25,13a3.75,3.75,0,0,1,3-3.67V11.5a.75.75,0,0,0,1.5,0V9.33a3.75,3.75,0,0,1,3,3.67V14H7.25Z" clipRule="evenodd"/>
  </svg>
);

const playerColors = [
  '#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF',
  '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF',
];

const getInitials = (name: string) => {
  const names = name.trim().split(' ');
  if (names.length > 1 && names[names.length -1]) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const GameOver: React.FC<GameOverProps> = ({ onPlayAgain, players }) => {
  return (
    <div className="w-full max-w-lg mx-auto p-6 md:p-8 bg-white rounded-2xl shadow-2xl text-center animate-fade-in">
      <div className="flex justify-center mb-4">
        <TrophyIcon />
      </div>
      <h1 className="text-4xl font-black text-brand-primary mb-2">Quest Complete!</h1>
      <p className="text-brand-dark mt-4 text-lg">
        Congratulations! You've finished all 100 questions. You're all champions of connection!
      </p>
      
      <div className="mt-8">
          <h3 className="text-xl font-bold text-brand-dark mb-4">Players in this epic quest:</h3>
          <div className="flex justify-center items-center gap-x-4 gap-y-2 flex-wrap">
             {players.map((player, index) => {
                const initials = getInitials(player.name);
                const color = playerColors[index % playerColors.length];
                return (
                  <div key={player.id} title={player.name} className="flex flex-col items-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-brand-dark font-black text-lg shadow-md"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                    <span className="text-xs font-bold mt-1 text-brand-dark">{player.name}</span>
                  </div>
                );
             })}
          </div>
      </div>
      
      <div className="mt-10">
        <button
          onClick={onPlayAgain}
          className="w-full bg-brand-primary text-white text-xl font-bold py-4 rounded-lg hover:bg-opacity-90 transition transform hover:scale-105 shadow-lg"
        >
          Start a New Quest
        </button>
      </div>
    </div>
  );
};
