export const GRID_COLS = 6;
export const GRID_ROWS = 10;
export const INITIAL_ROWS = 4;
export const MIN_VAL = 1;
export const MAX_VAL = 9;
export const TIME_LIMIT = 10; // seconds per round in time mode

export const COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
];

export const getRandomValue = () => Math.floor(Math.random() * (MAX_VAL - MIN_VAL + 1)) + MIN_VAL;
export const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
