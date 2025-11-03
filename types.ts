export interface Player {
  id: number;
  name: string;
}

export enum GameState {
  Setup = 'SETUP',
  Playing = 'PLAYING',
}

export interface SharedGameState {
  sessionId: string;
  gameState: GameState;
  players: Player[];
  currentPlayerIndex: number;
  currentQuestion: string;
  questionHistory: string[];
}