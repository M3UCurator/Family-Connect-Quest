
import React, { useState } from 'react';
import { Player } from '../types';

interface PlayerSetupProps {
  onGameStart: (players: Player[], duration: number) => void;
}

const PlayerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onGameStart }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [duration, setDuration] = useState(60);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && players.length < 8) {
      setPlayers([...players, { id: Date.now(), name: playerName.trim() }]);
      setPlayerName('');
    }
  };

  const handleRemovePlayer = (id: number) => {
    setPlayers(players.filter(p => p.id !== id));
  };
  
  const canStartGame = players.length >= 2;

  return (
    <div className="w-full max-w-md mx-auto p-6 md:p-8 bg-white rounded-2xl shadow-2xl animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-black text-brand-primary mb-2">Family Connect</h1>
        <h2 className="text-xl font-bold text-brand-dark">Quest</h2>
        <p className="text-brand-dark mt-4">Add players to begin your adventure of questions and fun!</p>
      </div>

      <form onSubmit={handleAddPlayer} className="mt-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter a player's name"
            className="flex-grow p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition"
          />
          <button
            type="submit"
            disabled={!playerName.trim() || players.length >= 8}
            className="bg-brand-secondary text-white font-bold p-3 rounded-lg hover:bg-opacity-90 transition transform hover:scale-105 disabled:bg-gray-300 disabled:scale-100"
          >
            Add
          </button>
        </div>
      </form>

      <div className="mt-6">
        <h3 className="text-lg font-bold text-brand-dark mb-3">Turn Timer</h3>
        <div className="grid grid-cols-3 gap-2">
          {[30, 60, 90].map((time) => (
            <button
              key={time}
              onClick={() => setDuration(time)}
              className={`p-3 rounded-lg font-bold transition-all ${
                duration === time
                  ? 'bg-brand-secondary text-white ring-2 ring-brand-accent scale-105'
                  : 'bg-gray-200 text-brand-dark hover:bg-gray-300'
              }`}
            >
              {time}s
            </button>
          ))}
        </div>
         <p className="text-xs text-center text-gray-500 mt-2">
            Choose how long each player has to answer.
         </p>
      </div>

      <div className="mt-6 space-y-2">
        <h3 className="text-lg font-bold text-brand-dark mb-2">Players ({players.length}/8)</h3>
        {players.length === 0 && <p className="text-gray-500 text-center py-4">Add at least 2 players to start!</p>}
        <ul className="space-y-2">
          {players.map((player) => (
            <li
              key={player.id}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg animate-pop-in"
            >
              <div className="flex items-center">
                <PlayerIcon />
                <span className="font-bold text-brand-dark">{player.name}</span>
              </div>
              <button
                onClick={() => handleRemovePlayer(player.id)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <button
          onClick={() => onGameStart(players, duration)}
          disabled={!canStartGame}
          className="w-full bg-brand-primary text-white text-xl font-bold py-4 rounded-lg hover:bg-opacity-90 transition transform hover:scale-105 disabled:bg-red-300 disabled:cursor-not-allowed disabled:scale-100 shadow-lg"
        >
          Start Game
        </button>
      </div>
    </div>
  );
};
