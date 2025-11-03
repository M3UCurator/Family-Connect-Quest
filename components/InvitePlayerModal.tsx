import React, { useState } from 'react';

interface InvitePlayerModalProps {
  onClose: () => void;
  onAddPlayer: (name: string) => void;
  currentPlayers: string[];
  playerLimit: number;
}

export const InvitePlayerModal: React.FC<InvitePlayerModalProps> = ({ onClose, onAddPlayer, currentPlayers, playerLimit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Player name cannot be empty.');
      return;
    }
    if (currentPlayers.includes(trimmedName.toLowerCase())) {
      setError('A player with this name already exists.');
      return;
    }
    onAddPlayer(trimmedName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm m-4 animate-pop-in">
        <h2 className="text-2xl font-bold text-brand-dark mb-4">Invite a New Player</h2>
        <p className="text-brand-dark mb-6">Enter the name of the new player to add them to the game. The game link will be updated for you to share.</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="New player's name"
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="w-full bg-gray-200 text-brand-dark font-bold py-3 rounded-lg hover:bg-gray-300 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={currentPlayers.length >= playerLimit || !name.trim()}
              className="w-full bg-brand-secondary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition disabled:bg-gray-300"
            >
              Add Player
            </button>
          </div>
           {currentPlayers.length >= playerLimit && <p className="text-red-500 text-sm mt-2 text-center">Maximum number of players reached.</p>}
        </form>
      </div>
    </div>
  );
};
