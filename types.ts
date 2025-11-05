export interface Player {
  id: number;
  name: string;
}

export enum GameState {
  Setup = 'SETUP',
  Playing = 'PLAYING',
  Paused = 'PAUSED',
}

export interface SharedGameState {
  sessionId: string;
  gameState: GameState;
  players: Player[];
  currentPlayerIndex: number;
  currentQuestion: string;
  questionHistory: string[];
  turnDuration: number; // in seconds
  turnStartTime: number; // timestamp in ms
  recordings: Record<number, string>; // key: turn index, value: base64 audio data
  remainingTimeOnPause?: number; // Time left when game was paused
}
