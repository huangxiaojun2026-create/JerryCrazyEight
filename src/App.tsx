/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Info, 
  Heart,
  Diamond,
  Club,
  Spade,
  Cat,
  Mouse,
  Utensils,
  Pizza
} from 'lucide-react';
import { Suit, Rank, CardData, GameStatus, GameState } from './types';

// --- Constants & Utilities ---

const SUITS = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
const RANKS = [
  Rank.ACE, Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, 
  Rank.SIX, Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN, 
  Rank.JACK, Rank.QUEEN, Rank.KING
];

const createDeck = (): CardData[] => {
  const deck: CardData[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({ id: `${rank}-${suit}`, suit, rank });
    });
  });
  return shuffle(deck);
};

const shuffle = (deck: CardData[]): CardData[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

const getSuitIcon = (suit: Suit) => {
  switch (suit) {
    case Suit.HEARTS: return <Heart className="w-full h-full text-rose-500 fill-rose-500" />;
    case Suit.DIAMONDS: return <Diamond className="w-full h-full text-orange-500 fill-orange-500" />;
    case Suit.CLUBS: return <Club className="w-full h-full text-slate-700 fill-slate-700" />;
    case Suit.SPADES: return <Spade className="w-full h-full text-slate-900 fill-slate-900" />;
  }
};

const getSuitColor = (suit: Suit) => {
  return (suit === Suit.HEARTS || suit === Suit.DIAMONDS) ? 'text-rose-600' : 'text-slate-900';
};

// --- Components ---

const Card: React.FC<{
  card: CardData;
  isFaceDown?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  className?: string;
  disableInitialAnimation?: boolean;
  rotation?: number;
  yOffset?: number;
}> = ({ card, isFaceDown, onClick, isPlayable, className, disableInitialAnimation, rotation = 0, yOffset = 0 }) => {
  return (
    <motion.div
      layout={!disableInitialAnimation}
      initial={disableInitialAnimation ? false : { scale: 0.8, opacity: 0, y: 50, rotate: rotation }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        y: yOffset, 
        rotate: rotation,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }}
      whileHover={isPlayable ? { y: yOffset - 30, scale: 1.15, rotate: 0, zIndex: 50 } : {}}
      onClick={onClick}
      className={`
        relative w-16 h-24 sm:w-24 sm:h-36 rounded-xl shadow-lg border-4 
        ${isFaceDown ? 'bg-amber-500 border-amber-700' : 'bg-white border-amber-100'}
        ${isPlayable ? 'cursor-pointer ring-4 ring-yellow-400 ring-offset-4 z-10' : 'cursor-default'}
        flex flex-col items-center justify-center select-none transition-shadow
        ${className}
      `}
    >
      {isFaceDown ? (
        <div className="w-full h-full flex items-center justify-center p-2">
          <div className="w-full h-full border-4 border-white/30 rounded-lg flex items-center justify-center bg-amber-600/50">
            <Mouse className="w-8 h-8 text-white/40" />
          </div>
        </div>
      ) : (
        <>
          <div className={`absolute top-1 left-1 sm:top-2 sm:left-2 flex flex-col items-center leading-none ${getSuitColor(card.suit)}`}>
            <span className="text-base sm:text-2xl font-black italic">{card.rank}</span>
            <div className="w-3 h-3 sm:w-5 sm:h-5">{getSuitIcon(card.suit)}</div>
          </div>
          <div className="w-8 h-8 sm:w-14 sm:h-14 opacity-10 scale-125">
            {getSuitIcon(card.suit)}
          </div>
          <div className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 flex flex-col items-center leading-none rotate-180 ${getSuitColor(card.suit)}`}>
            <span className="text-base sm:text-2xl font-black italic">{card.rank}</span>
            <div className="w-3 h-3 sm:w-5 sm:h-5">{getSuitIcon(card.suit)}</div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [message, setMessage] = useState<string>("杰瑞鼠准备好了吗？开始大作战！");
  
  // Initialize Game
  const initGame = useCallback((isNewGame = false) => {
    const deck = createDeck();
    const playerHand = deck.splice(0, 8);
    const aiHand = deck.splice(0, 8);
    
    let firstDiscard = deck.pop()!;
    while (firstDiscard.rank === Rank.EIGHT) {
      deck.unshift(firstDiscard);
      firstDiscard = deck.pop()!;
    }

    setGameState(prev => ({
      deck,
      playerHand,
      aiHand,
      discardPile: [firstDiscard],
      currentTurn: 'player',
      status: 'playing',
      view: 'playing',
      activeSuit: null,
      isSuitSelecting: false,
      scores: isNewGame ? { player: 0, ai: 0 } : (prev?.scores || { player: 0, ai: 0 }),
    }));
    setMessage("轮到你了，杰瑞！快出牌或者去厨房摸一张。");
  }, []);

  // Show Menu initially
  useEffect(() => {
    setGameState({
      deck: [],
      playerHand: [],
      aiHand: [],
      discardPile: [],
      currentTurn: 'player',
      status: 'playing',
      view: 'menu',
      activeSuit: null,
      isSuitSelecting: false,
      scores: { player: 0, ai: 0 }
    });
  }, []);

  const topDiscard = gameState?.discardPile[gameState.discardPile.length - 1];
  const currentSuit = gameState?.activeSuit || topDiscard?.suit;

  const isCardPlayable = (card: CardData) => {
    if (!gameState || gameState.status !== 'playing') return false;
    if (card.rank === Rank.EIGHT) return true;
    if (!topDiscard) return false;
    
    return card.suit === currentSuit || card.rank === topDiscard.rank;
  };

  const playCard = (card: CardData, isPlayer: boolean) => {
    if (!gameState) return;

    const newHand = isPlayer 
      ? gameState.playerHand.filter(c => c.id !== card.id)
      : gameState.aiHand.filter(c => c.id !== card.id);

    const newDiscardPile = [...gameState.discardPile, card];

    if (card.rank === Rank.EIGHT) {
      if (isPlayer) {
        setGameState(prev => prev ? ({
          ...prev,
          playerHand: newHand,
          discardPile: newDiscardPile,
          isSuitSelecting: true,
          activeSuit: null,
        }) : null);
        setMessage("嘿！你打出了疯狂 8 点！快选个新口味！");
      } else {
        const suitCounts: Record<string, number> = {
          [Suit.HEARTS]: 0, [Suit.DIAMONDS]: 0, [Suit.CLUBS]: 0, [Suit.SPADES]: 0
        };
        newHand.forEach(c => suitCounts[c.suit]++);
        const bestSuit = Object.keys(suitCounts).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b) as Suit;
        
        setGameState(prev => prev ? ({
          ...prev,
          aiHand: newHand,
          discardPile: newDiscardPile,
          activeSuit: bestSuit,
          currentTurn: 'player'
        }) : null);
        setMessage(`汤姆猫打出了 8！他把花色改成了 ${bestSuit === Suit.HEARTS ? '红心' : bestSuit === Suit.DIAMONDS ? '方块' : bestSuit === Suit.CLUBS ? '梅花' : '黑桃'}。`);
      }
    } else {
      const nextTurn = isPlayer ? 'ai' : 'player';
      const status: GameStatus = newHand.length === 0 ? (isPlayer ? 'player_win' : 'ai_win') : 'playing';

      setGameState(prev => {
        if (!prev) return null;
        const newScores = { ...prev.scores };
        if (status === 'player_win') newScores.player++;
        if (status === 'ai_win') newScores.ai++;

        return {
          ...prev,
          playerHand: isPlayer ? newHand : prev.playerHand,
          aiHand: isPlayer ? prev.aiHand : newHand,
          discardPile: newDiscardPile,
          currentTurn: nextTurn,
          status,
          activeSuit: null,
          scores: newScores
        };
      });

      if (status === 'playing') {
        setMessage(isPlayer ? "汤姆猫正在密谋..." : "轮到你了，杰瑞！");
      } else {
        setMessage(status === 'player_win' ? "太棒了！杰瑞鼠赢了！汤姆猫又搞砸了。" : "噢不！汤姆猫抓到了你。");
      }
    }
  };

  const drawCard = (isPlayer: boolean) => {
    if (!gameState || gameState.status !== 'playing') return;
    if (gameState.deck.length === 0) {
      setMessage("厨房里没吃的了（摸牌堆空了）！");
      setGameState(prev => prev ? ({ ...prev, currentTurn: isPlayer ? 'ai' : 'player' }) : null);
      return;
    }

    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.pop()!;

    if (isPlayer) {
      setGameState(prev => prev ? ({
        ...prev,
        deck: newDeck,
        playerHand: [...prev.playerHand, drawnCard],
        currentTurn: 'ai'
      }) : null);
      setMessage(`你摸到了一张 ${drawnCard.rank}。`);
    } else {
      setGameState(prev => prev ? ({
        ...prev,
        deck: newDeck,
        aiHand: [...prev.aiHand, drawnCard],
        currentTurn: 'player'
      }) : null);
      setMessage("汤姆猫摸了一张牌。");
    }
  };

  useEffect(() => {
    if (gameState?.currentTurn === 'ai' && gameState.status === 'playing' && gameState.view === 'playing') {
      const timer = setTimeout(() => {
        const playableCards = gameState.aiHand.filter(isCardPlayable);
        if (playableCards.length > 0) {
          const normalPlayable = playableCards.filter(c => c.rank !== Rank.EIGHT);
          const cardToPlay = normalPlayable.length > 0 
            ? normalPlayable[Math.floor(Math.random() * normalPlayable.length)]
            : playableCards[0];
          playCard(cardToPlay, false);
        } else {
          drawCard(false);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState?.currentTurn, gameState?.status, gameState?.view]);

  const selectSuit = (suit: Suit) => {
    setGameState(prev => prev ? ({
      ...prev,
      activeSuit: suit,
      isSuitSelecting: false,
      currentTurn: 'ai'
    }) : null);
    setMessage(`你把花色改成了 ${suit === Suit.HEARTS ? '红心' : suit === Suit.DIAMONDS ? '方块' : suit === Suit.CLUBS ? '梅花' : '黑桃'}。汤姆猫在看你呢...`);
  };

  if (!gameState) return <div className="min-h-screen bg-orange-100 flex items-center justify-center text-orange-900">加载中...</div>;

  if (gameState.view === 'menu') {
    return (
      <div className="min-h-screen bg-[#fdf2e9] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 text-center"
        >
          <div className="flex justify-center gap-4 mb-8">
            <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="bg-white p-6 rounded-[2rem] border-8 border-slate-300 shadow-xl">
              <Cat className="w-20 h-20 text-slate-600" />
            </motion.div>
            <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="bg-white p-6 rounded-[2rem] border-8 border-orange-500 shadow-xl">
              <Mouse className="w-20 h-20 text-orange-500" />
            </motion.div>
          </div>

          <h1 className="text-6xl sm:text-8xl font-black text-orange-900 italic mb-4 tracking-tighter drop-shadow-lg">
            猫鼠大作战
          </h1>
          <p className="text-xl font-bold text-orange-600 mb-12 uppercase tracking-[0.2em]">Crazy Eights: Classic Edition</p>

          <div className="flex flex-col gap-4 max-w-xs mx-auto">
            <button
              onClick={() => initGame(true)}
              className="py-6 px-12 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-[2rem] text-3xl shadow-xl border-b-8 border-orange-800 transition-all active:border-b-0 active:translate-y-2"
            >
              开始游戏
            </button>
            <div className="flex items-center gap-2 justify-center text-orange-400 font-bold mt-4">
              <Info className="w-5 h-5" />
              <span>数字 8 是万能牌！</span>
            </div>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-400 rounded-full blur-3xl opacity-20" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-400 rounded-full blur-3xl opacity-20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf2e9] text-slate-900 font-sans selection:bg-orange-200 overflow-hidden flex flex-col">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-white border-b-8 border-orange-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl rotate-3 shadow-lg border-4 border-orange-700">8</div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-orange-900 italic">猫鼠大作战</h1>
            <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-orange-500">
              <span>汤姆: {gameState.scores.ai}</span>
              <span>杰瑞: {gameState.scores.player}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setGameState(prev => prev ? ({ ...prev, view: 'menu' }) : null)}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all border-4 border-slate-200 active:scale-95"
          >
            <Utensils className="w-6 h-6" />
          </button>
          <button 
            onClick={() => initGame()}
            className="p-3 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-2xl transition-all border-4 border-orange-200 active:scale-95"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 relative flex flex-col items-center justify-between py-6 px-4 max-w-6xl mx-auto w-full z-0">
        
        {/* AI Hand (Tom) */}
        <div className="w-full flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 px-6 py-2 bg-slate-200 rounded-full border-4 border-slate-300 shadow-sm mb-2">
            <Cat className="w-6 h-6 text-slate-600" />
            <span className="font-black text-slate-700">汤姆猫 ({gameState.aiHand.length})</span>
          </div>
          <div className="flex -space-x-10 sm:-space-x-14 overflow-visible">
            {gameState.aiHand.map((card) => (
              <motion.div key={card.id} className="relative w-16 h-24 sm:w-24 sm:h-36 rounded-xl bg-slate-400 border-4 border-slate-500 shadow-md flex items-center justify-center">
                <Cat className="w-8 h-8 text-slate-300/50" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Center Table */}
        <div className="flex flex-col sm:flex-row items-center gap-10 sm:gap-24 my-6">
          {/* Draw Pile */}
          <div className="flex flex-col items-center gap-3">
            <div className="px-3 py-1 bg-orange-200 rounded-lg text-[10px] font-black text-orange-700 uppercase">厨房冰箱</div>
            <div className="relative">
              {gameState.deck.length > 0 ? (
                <Card 
                  card={gameState.deck[0]} 
                  isFaceDown 
                  onClick={() => gameState.currentTurn === 'player' && drawCard(true)}
                  isPlayable={gameState.currentTurn === 'player' && gameState.playerHand.filter(isCardPlayable).length === 0}
                  className="hover:rotate-2"
                />
              ) : (
                <div className="w-16 h-24 sm:w-24 sm:h-36 rounded-xl border-4 border-dashed border-orange-200 flex items-center justify-center">
                  <Utensils className="w-8 h-8 text-orange-200" />
                </div>
              )}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-black border-2 border-orange-700">
                {gameState.deck.length}
              </div>
            </div>
          </div>

          {/* Discard Pile */}
          <div className="flex flex-col items-center gap-3">
            <div className="px-3 py-1 bg-rose-200 rounded-lg text-[10px] font-black text-rose-700 uppercase">餐桌中心</div>
            <div className="relative w-16 h-24 sm:w-24 sm:h-36">
              {/* Show the second to last card as a base to prevent flickering */}
              {gameState.discardPile.length > 1 && (
                <div className="absolute inset-0">
                  <Card 
                    card={gameState.discardPile[gameState.discardPile.length - 2]} 
                    disableInitialAnimation 
                    className="shadow-none opacity-50"
                  />
                </div>
              )}
              
              <AnimatePresence mode="wait">
                {gameState.discardPile.slice(-1).map((card) => (
                  <Card 
                    key={card.id} 
                    card={card} 
                    disableInitialAnimation
                    className="shadow-2xl rotate-1" 
                  />
                ))}
              </AnimatePresence>
              
              {/* Active Suit Indicator */}
              {gameState.activeSuit && (
                <motion.div 
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-6 -right-6 w-14 h-14 bg-yellow-400 rounded-2xl shadow-xl border-4 border-orange-600 flex items-center justify-center p-3 z-10"
                >
                  {getSuitIcon(gameState.activeSuit)}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Player Hand (Jerry) */}
        <div className="w-full flex flex-col items-center gap-4">
          <div className={`flex items-center gap-3 px-6 py-2 rounded-full border-4 shadow-sm transition-all ${gameState.currentTurn === 'player' ? 'bg-orange-400 border-orange-600 scale-110' : 'bg-orange-100 border-orange-200'}`}>
            <Mouse className={`w-6 h-6 ${gameState.currentTurn === 'player' ? 'text-white' : 'text-orange-400'}`} />
            <span className={`font-black ${gameState.currentTurn === 'player' ? 'text-white' : 'text-orange-900'}`}>杰瑞鼠 ({gameState.playerHand.length})</span>
          </div>
          
          <div className="flex justify-center items-end h-48 sm:h-64 w-full relative px-12">
            {gameState.playerHand.map((card, index) => {
              const total = gameState.playerHand.length;
              const angleStep = total > 1 ? 40 / (total - 1) : 0;
              const rotation = (index * angleStep) - 20;
              const xOffset = (index - (total - 1) / 2) * (total > 8 ? 30 : 50);
              
              return (
                <div 
                  key={card.id} 
                  className="absolute transition-all duration-300"
                  style={{ 
                    transform: `translateX(${xOffset}px)`,
                    zIndex: index
                  }}
                >
                  <Card 
                    card={card} 
                    isPlayable={gameState.currentTurn === 'player' && isCardPlayable(card)}
                    onClick={() => gameState.currentTurn === 'player' && isCardPlayable(card) && playCard(card, true)}
                    rotation={rotation}
                    yOffset={Math.abs(rotation) * 0.5}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <footer className="p-6 bg-white border-t-8 border-orange-200 flex items-center justify-center z-10">
        <div className="bg-orange-50 px-8 py-3 rounded-2xl border-4 border-orange-100 shadow-inner w-full max-w-2xl">
          <p className={`text-center text-lg font-black italic tracking-tight ${gameState.currentTurn === 'player' ? 'text-orange-600' : 'text-slate-500'}`}>
            {message}
          </p>
        </div>
      </footer>

      {/* Suit Selection Modal */}
      <AnimatePresence>
        {gameState.isSuitSelecting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-orange-900/40 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, rotate: -2 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-white border-8 border-orange-500 p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-yellow-400 p-4 rounded-3xl border-4 border-orange-600 rotate-3">
                  <Pizza className="w-12 h-12 text-orange-700" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-orange-900 mb-8 italic">杰瑞，快选个新口味！</h2>
              <div className="grid grid-cols-2 gap-6">
                {SUITS.map(suit => (
                  <button
                    key={suit}
                    onClick={() => selectSuit(suit)}
                    className="flex flex-col items-center gap-3 p-6 bg-orange-50 hover:bg-orange-100 border-4 border-orange-100 hover:border-orange-300 rounded-[2rem] transition-all group active:scale-95"
                  >
                    <div className="w-14 h-14 group-hover:scale-125 transition-transform">
                      {getSuitIcon(suit)}
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-orange-700">
                      {suit === Suit.HEARTS ? '红心' : suit === Suit.DIAMONDS ? '方块' : suit === Suit.CLUBS ? '梅花' : '黑桃'}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameState.status !== 'playing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-orange-950/60 backdrop-blur-xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.5, rotate: 15 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-white border-[12px] border-orange-500 p-12 rounded-[4rem] shadow-2xl max-w-md w-full text-center relative"
            >
              <div className="mb-8 inline-flex p-6 bg-yellow-400 rounded-[2rem] border-4 border-orange-600 -rotate-6 shadow-lg">
                <Trophy className="w-20 h-20 text-orange-700" />
              </div>
              
              <h2 className="text-5xl font-black mb-4 tracking-tighter text-orange-900 italic">
                {gameState.status === 'player_win' ? '杰瑞赢了！' : '汤姆赢了！'}
              </h2>
              <p className="text-orange-600 font-bold mb-10 text-xl">
                {gameState.status === 'player_win' 
                  ? '汤姆猫又被耍得团团转！' 
                  : '杰瑞鼠这次没跑掉。'}
              </p>
              
              <button
                onClick={() => initGame()}
                className="w-full py-6 px-8 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-3xl transition-all flex items-center justify-center gap-3 text-2xl shadow-xl border-b-8 border-orange-800 active:border-b-0 active:translate-y-2"
              >
                <RotateCcw className="w-8 h-8" />
                再来一局！
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
