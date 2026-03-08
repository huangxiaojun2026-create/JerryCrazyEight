export type GameMode = 'classic' | 'time';
export type GameStatus = 'menu' | 'playing' | 'gameover';

export interface Block {
  id: string;
  value: number;
  row: number;
  col: number;
  color: string;
}

export interface GameState {
  grid: Block[];
  target: number;
  selectedIds: string[];
  score: number;
  mode: GameMode;
  status: GameStatus;
  timeLeft: number;
  level: number;
}
