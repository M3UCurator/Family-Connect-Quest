
export interface Player {
  id: number;
  name: string;
}

export enum GameState {
  Setup = 'SETUP',
  Playing = 'PLAYING',
}
