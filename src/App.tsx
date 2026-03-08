import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  Clock, 
  Zap, 
  AlertCircle, 
  ChevronLeft,
  Info,
  Flag,
  Gauge,
  Flame,
  Wind
} from 'lucide-react';
import { 
  GameMode, 
  GameStatus, 
  Block, 
  GameState 
} from './types';
import { 
  GRID_COLS, 
  GRID_ROWS, 
  INITIAL_ROWS, 
  TIME_LIMIT, 
  getRandomValue, 
  getRandomColor 
} from './constants';

// Racing themed colors
const RACING_COLORS = [
  'bg-red-600',    // Ferrari Red
  'bg-slate-800',  // Carbon Fiber
  'bg-amber-500',  // Desert Dust
  'bg-blue-600',   // Racing Blue
  'bg-emerald-600' // British Racing Green
];

// --- Components ---

const NumberBlock: React.FC<{
  block: Block;
  isSelected: boolean;
  onClick: () => void;
  isGameOver: boolean;
  isError: boolean;
}> = ({ block, isSelected, onClick, isGameOver, isError }) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        x: block.col * 100 + '%',
        y: (GRID_ROWS - 1 - block.row) * 100 + '%',
        rotate: isError ? [0, -5, 5, -5, 5, 0] : 0,
      }}
      exit={{ scale: 0, opacity: 0, rotate: 45 }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 25,
        rotate: { duration: 0.4 }
      }}
      style={{ 
        position: 'absolute', 
        width: `${100 / GRID_COLS}%`, 
        height: `${100 / GRID_ROWS}%`,
        padding: '2px',
      }}
    >
      <button
        onClick={onClick}
        disabled={isGameOver}
        className={`
          w-full h-full rounded-md flex items-center justify-center 
          text-white font-black text-xl sm:text-2xl shadow-lg
          transition-all duration-200 transform border-b-4 border-black/30
          ${block.color}
          ${isSelected ? 'ring-4 ring-yellow-400 scale-90 brightness-110 z-10 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'hover:brightness-105'}
          ${isGameOver ? 'grayscale opacity-50 cursor-not-allowed' : 'active:scale-95'}
        `}
      >
        <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">{block.value}</span>
      </button>
    </motion.div>
  );
};

export default function App() {
  const [state, setState] = useState<GameState>({
    grid: [],
    target: 0,
    selectedIds: [],
    score: 0,
    mode: 'classic',
    status: 'menu',
    timeLeft: TIME_LIMIT,
    level: 1,
  });

  const [isError, setIsError] = useState(false);
  const [lastScoreGain, setLastScoreGain] = useState(0);
  const [showScorePopup, setShowScorePopup] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Logic ---

  const generateTarget = useCallback((grid: Block[]) => {
    if (grid.length === 0) return 10;
    
    // Pick 2-4 random blocks to sum up for a guaranteed solvable target
    const count = Math.min(grid.length, Math.floor(Math.random() * 3) + 2);
    const shuffled = [...grid].sort(() => 0.5 - Math.random());
    const sum = shuffled.slice(0, count).reduce((acc, b) => acc + b.value, 0);
    
    // Ensure target is reasonable
    return Math.max(5, Math.min(sum, 35));
  }, []);

  const addNewRow = useCallback(() => {
    setState(prev => {
      const isFull = prev.grid.some(b => b.row === GRID_ROWS - 1);
      if (isFull) return { ...prev, status: 'gameover' };

      const shiftedGrid = prev.grid.map(b => ({ ...b, row: b.row + 1 }));
      const newRow: Block[] = Array.from({ length: GRID_COLS }).map((_, col) => ({
        id: Math.random().toString(36).substr(2, 9),
        value: getRandomValue(),
        row: 0,
        col,
        color: RACING_COLORS[Math.floor(Math.random() * RACING_COLORS.length)],
      }));

      const nextGrid = [...shiftedGrid, ...newRow];
      if (nextGrid.some(b => b.row >= GRID_ROWS)) {
        return { ...prev, grid: nextGrid, status: 'gameover' };
      }

      return { 
        ...prev, 
        grid: nextGrid,
        timeLeft: TIME_LIMIT 
      };
    });
  }, []);

  const initGame = (mode: GameMode) => {
    const initialGrid: Block[] = [];
    for (let r = 0; r < INITIAL_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        initialGrid.push({
          id: Math.random().toString(36).substr(2, 9),
          value: getRandomValue(),
          row: r,
          col: c,
          color: RACING_COLORS[Math.floor(Math.random() * RACING_COLORS.length)],
        });
      }
    }

    setState({
      grid: initialGrid,
      target: generateTarget(initialGrid),
      selectedIds: [],
      score: 0,
      mode,
      status: 'playing',
      timeLeft: TIME_LIMIT,
      level: 1,
    });
    setIsError(false);
  };

  const handleBlockClick = (id: string) => {
    if (state.status !== 'playing') return;

    setState(prev => {
      const isSelected = prev.selectedIds.includes(id);
      const newSelectedIds = isSelected
        ? prev.selectedIds.filter(sid => sid !== id)
        : [...prev.selectedIds, id];

      const currentSum = prev.grid
        .filter(b => newSelectedIds.includes(b.id))
        .reduce((acc, b) => acc + b.value, 0);

      if (currentSum === prev.target) {
        // Success!
        const remainingGrid = prev.grid.filter(b => !newSelectedIds.includes(b.id));
        
        // Multiplier based on number of blocks used
        const multiplier = newSelectedIds.length >= 4 ? 2 : 1;
        const gain = newSelectedIds.length * 10 * multiplier;
        const newScore = prev.score + gain;
        const newLevel = Math.floor(newScore / 1000) + 1;

        setLastScoreGain(gain);
        setShowScorePopup(true);
        setTimeout(() => setShowScorePopup(false), 1000);

        const finalGrid: Block[] = [];
        for (let c = 0; c < GRID_COLS; c++) {
          const colBlocks = remainingGrid
            .filter(b => b.col === c)
            .sort((a, b) => a.row - b.row);
          colBlocks.forEach((b, index) => {
            finalGrid.push({ ...b, row: index });
          });
        }

        if (prev.mode === 'classic') {
          const isFull = finalGrid.some(b => b.row === GRID_ROWS - 1);
          if (isFull) return { ...prev, grid: finalGrid, status: 'gameover', score: newScore };

          const shiftedGrid = finalGrid.map(b => ({ ...b, row: b.row + 1 }));
          const newRow: Block[] = Array.from({ length: GRID_COLS }).map((_, col) => ({
            id: Math.random().toString(36).substr(2, 9),
            value: getRandomValue(),
            row: 0,
            col,
            color: RACING_COLORS[Math.floor(Math.random() * RACING_COLORS.length)],
          }));

          const nextGrid = [...shiftedGrid, ...newRow];
          return {
            ...prev,
            grid: nextGrid,
            selectedIds: [],
            target: generateTarget(nextGrid),
            score: newScore,
            level: newLevel,
          };
        }

        return {
          ...prev,
          grid: finalGrid,
          selectedIds: [],
          target: generateTarget(finalGrid),
          score: newScore,
          level: newLevel,
          timeLeft: TIME_LIMIT,
        };
      } else if (currentSum > prev.target) {
        setIsError(true);
        setTimeout(() => setIsError(false), 500);
        return { ...prev, selectedIds: [] };
      }

      return { ...prev, selectedIds: newSelectedIds };
    });
  };

  // --- Effects ---

  useEffect(() => {
    if (state.status === 'playing' && state.mode === 'time') {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 1) {
            // Time's up: penalty
            return { ...prev, timeLeft: TIME_LIMIT, selectedIds: [] };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [state.status, state.mode]);

  useEffect(() => {
    if (state.status === 'playing' && state.mode === 'time' && state.timeLeft === TIME_LIMIT) {
      addNewRow();
    }
  }, [state.timeLeft, state.mode, state.status, addNewRow]);

  const currentSum = state.grid
    .filter(b => state.selectedIds.includes(b.id))
    .reduce((acc, b) => acc + b.value, 0);

  if (state.status === 'menu') {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
        {/* Racing Background Elements */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <div className="absolute top-1/2 left-0 w-full h-1 bg-yellow-500/50 -translate-y-1/2" />
          <div className="absolute top-1/2 left-0 w-full h-24 bg-neutral-900/80 -translate-y-1/2 blur-xl" />
        </div>

        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="relative z-10 text-center mb-12"
        >
          <div className="inline-flex p-4 bg-red-600 rounded-full shadow-[0_0_40px_rgba(220,38,38,0.5)] mb-6 -rotate-6 border-4 border-white">
            <Flame className="w-16 h-16 text-yellow-400 animate-bounce" />
          </div>
          <h1 className="text-6xl sm:text-8xl font-black italic tracking-tighter mb-2 drop-shadow-[0_4px_0_#991b1b]">
            飞驰人生
          </h1>
          <p className="text-red-500 font-black uppercase tracking-[0.5em] text-sm">Bayanbulak Rally</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl relative z-10">
          <motion.button
            whileHover={{ scale: 1.05, rotate: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => initGame('classic')}
            className="group bg-neutral-900 border-4 border-neutral-800 p-8 rounded-xl hover:bg-red-700 hover:border-red-500 transition-all text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
              <Flag className="w-24 h-24 rotate-12" />
            </div>
            <div className="bg-red-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
              <Trophy className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black mb-2 italic">巴音布鲁克拉力赛</h2>
            <p className="text-neutral-400 text-sm group-hover:text-red-100">经典挑战：每一脚油门都是对极限的试探。</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => initGame('time')}
            className="group bg-neutral-900 border-4 border-neutral-800 p-8 rounded-xl hover:bg-amber-600 hover:border-amber-400 transition-all text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
              <Gauge className="w-24 h-24 -rotate-12" />
            </div>
            <div className="bg-amber-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black mb-2 italic">极速冲刺赛</h2>
            <p className="text-neutral-400 text-sm group-hover:text-amber-100">计时挑战：在引擎过热前冲向终点。</p>
          </motion.button>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 text-neutral-500">
          <div className="flex items-center gap-2 font-black italic">
            <Wind className="w-4 h-4" />
            <span>“我不是想赢，我只是不想输。”</span>
          </div>
          <div className="flex gap-6 text-[10px] uppercase tracking-widest font-black">
            <span className="flex items-center gap-1 text-red-500"><Flame className="w-3 h-3" /> 4+ 氮气加速</span>
            <span className="flex items-center gap-1 text-amber-500"><Gauge className="w-3 h-3" /> 引擎过热警告</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col overflow-hidden font-sans selection:bg-red-500">
      <header className="p-4 sm:p-6 flex items-center justify-between bg-neutral-900 border-b-4 border-red-600 z-20 shadow-2xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setState(prev => ({ ...prev, status: 'menu' }))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="text-[10px] uppercase font-black tracking-widest text-neutral-500">DISTANCE</div>
            <div className="text-2xl font-black italic text-red-500">{state.score}m</div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-1">RPM TARGET</div>
          <motion.div 
            key={state.target}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-neutral-800 text-red-500 px-8 py-2 rounded-lg font-black text-4xl italic border-2 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
          >
            {state.target}
          </motion.div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] uppercase font-black tracking-widest text-neutral-500">GEAR</div>
            <div className="text-2xl font-black italic text-yellow-500">{state.level}</div>
          </div>
          <button 
            onClick={() => initGame(state.mode)}
            className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-white/10 transition-all active:scale-95"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </header>

      {state.mode === 'time' && (
        <div className="w-full h-2 bg-neutral-900 relative z-20">
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: `${(state.timeLeft / TIME_LIMIT) * 100}%` }}
            className={`h-full transition-colors duration-1000 ${state.timeLeft <= 3 ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)]' : 'bg-yellow-500'}`}
          />
        </div>
      )}

      <main className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/asphalt.png')]">
        <div className="w-full max-w-md aspect-[6/10] relative bg-neutral-900/80 rounded-xl border-8 border-neutral-800 shadow-2xl overflow-hidden">
          {/* Track Lines */}
          <div className="absolute inset-0 flex justify-center opacity-20 pointer-events-none">
            <div className="w-1 h-full bg-white border-x-4 border-dashed border-white/50" />
          </div>

          <div className="absolute top-[10%] left-0 right-0 h-2 bg-red-600/50 z-10 flex items-center justify-center">
            <span className="bg-red-600 text-[10px] font-black px-3 py-0.5 rounded-full text-white uppercase italic tracking-tighter">Engine Overheat Line</span>
          </div>

          <div className="absolute inset-0">
            <AnimatePresence>
              {state.grid.map(block => (
                <NumberBlock 
                  key={block.id}
                  block={block}
                  isSelected={state.selectedIds.includes(block.id)}
                  onClick={() => handleBlockClick(block.id)}
                  isGameOver={state.status === 'gameover'}
                  isError={isError}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {showScorePopup && (
            <motion.div
              initial={{ y: 0, opacity: 0, scale: 0.5 }}
              animate={{ y: -150, opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0 }}
              className="fixed z-40 pointer-events-none text-5xl font-black italic text-red-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
            >
              NITRO +{lastScoreGain}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {state.selectedIds.length > 0 && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`fixed bottom-32 left-1/2 -translate-x-1/2 px-8 py-4 rounded-xl shadow-2xl border-4 z-30 flex items-center gap-4 transition-all ${isError ? 'bg-red-900 border-red-500 scale-110' : 'bg-neutral-900 border-red-600'}`}
            >
              <div className="flex flex-col">
                <span className="text-neutral-500 font-black uppercase text-[10px] tracking-widest">Current RPM</span>
                <span className={`text-3xl font-black italic ${currentSum > state.target ? 'text-red-500 animate-pulse' : 'text-white'}`}>{currentSum}</span>
              </div>
              <div className="h-8 w-1 bg-neutral-700" />
              <div className="flex flex-col">
                <span className="text-neutral-500 font-black uppercase text-[10px] tracking-widest">Limit</span>
                <span className="text-xl font-black text-red-500/50 italic">{state.target}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-6 flex justify-center gap-4 bg-neutral-900 border-t-4 border-neutral-800">
        <div className="flex items-center gap-3 text-neutral-400 text-xs font-black uppercase tracking-widest italic">
          <Flame className={`w-5 h-5 ${state.selectedIds.length >= 4 ? 'text-red-500 animate-pulse' : 'text-neutral-700'}`} />
          <span>{state.selectedIds.length >= 4 ? 'TURBO BOOST ACTIVE!' : `MATCH ${state.target} RPM TO SHIFT`}</span>
        </div>
      </footer>

      <AnimatePresence>
        {state.status === 'gameover' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-6"
          >
            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-neutral-900 border-8 border-red-600 p-12 rounded-xl shadow-[0_0_100px_rgba(220,38,38,0.3)] max-w-md w-full text-center relative"
            >
              <div className="mb-8 inline-flex p-6 bg-red-600/20 rounded-full border-4 border-red-600">
                <AlertCircle className="w-16 h-16 text-red-600" />
              </div>
              <h2 className="text-6xl font-black mb-2 tracking-tighter italic text-white">赛车报废</h2>
              <p className="text-red-500 font-black mb-10 uppercase tracking-widest text-sm italic">引擎过热，比赛结束</p>
              <div className="bg-neutral-800 rounded-xl p-6 mb-10 border-2 border-neutral-700">
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Total Distance</div>
                <div className="text-5xl font-black italic text-red-500">{state.score}m</div>
              </div>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => initGame(state.mode)}
                  className="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg transition-all flex items-center justify-center gap-3 text-2xl italic shadow-xl active:scale-95"
                >
                  <RotateCcw className="w-6 h-6" />
                  重新发车
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, status: 'menu' }))}
                  className="w-full py-5 bg-neutral-800 hover:bg-neutral-700 text-white font-black rounded-lg transition-all text-xl italic active:scale-95"
                >
                  回维修区
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
