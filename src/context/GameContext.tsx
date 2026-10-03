import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateProvablyFairPair, type ProvablyFairState } from '../utils/provablyFair';
import { sound } from '../utils/soundEngine';

export type Currency = 'GC' | 'SC';
export type GameId = 
  | 'plinko' 
  | 'mines' 
  | 'crash' 
  | 'dice' 
  | 'limbo' 
  | 'keno' 
  | 'wheel' 
  | 'blackjack' 
  | 'roulette' 
  | 'slots' 
  | 'dragontower';

export interface BetHistoryItem {
  id: string;
  user: string;
  game: string;
  time: string;
  betAmount: number;
  multiplier: number;
  payout: number;
  currency: Currency;
}

export interface SessionStats {
  wagered: { GC: number; SC: number };
  profit: { GC: number; SC: number };
  wins: number;
  losses: number;
  bestMultiplier: number;
}

interface GameContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  gcBalance: number;
  scBalance: number;
  activeGame: GameId;
  setActiveGame: (g: GameId) => void;
  betHistory: BetHistoryItem[];
  provablyFair: ProvablyFairState;
  rotateSeeds: () => void;
  incrementNonce: () => void;
  placeBet: (amount: number) => boolean;
  addWin: (payout: number, multiplier: number, gameName: string, betAmount: number) => void;
  addLoss: (gameName: string, betAmount: number) => void;
  claimFaucet: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  isProvablyFairModalOpen: boolean;
  setProvablyFairModalOpen: (open: boolean) => void;
  // Live Session Stats
  sessionStats: SessionStats;
  resetSessionStats: () => void;
  isStatsModalOpen: boolean;
  setStatsModalOpen: (open: boolean) => void;
  // God Mode Cheat State
  godMode: boolean;
  setGodMode: (enabled: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const initialStats: SessionStats = {
  wagered: { GC: 0, SC: 0 },
  profit: { GC: 0, SC: 0 },
  wins: 0,
  losses: 0,
  bestMultiplier: 0,
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('GC');
  const [gcBalance, setGcBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('stake_gc_bal');
      const parsed = saved ? parseFloat(saved) : NaN;
      return !isNaN(parsed) ? parsed : 100000;
    } catch {
      return 100000;
    }
  });
  const [scBalance, setScBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('stake_sc_bal');
      const parsed = saved ? parseFloat(saved) : NaN;
      return !isNaN(parsed) ? parsed : 250.00;
    } catch {
      return 250.00;
    }
  });
  const [activeGame, setActiveGame] = useState<GameId>('mines');
  const [betHistory, setBetHistory] = useState<BetHistoryItem[]>([]);
  const [provablyFair, setProvablyFair] = useState<ProvablyFairState>(generateProvablyFairPair());
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isProvablyFairModalOpen, setProvablyFairModalOpen] = useState<boolean>(false);
  const [isStatsModalOpen, setStatsModalOpen] = useState<boolean>(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>(initialStats);
  const [godMode, setGodMode] = useState<boolean>(true);

  useEffect(() => {
    localStorage.setItem('stake_gc_bal', gcBalance.toString());
  }, [gcBalance]);

  useEffect(() => {
    localStorage.setItem('stake_sc_bal', scBalance.toString());
  }, [scBalance]);

  // Initial dummy bets for live feed realism
  useEffect(() => {
    const initialBots: BetHistoryItem[] = [
      { id: '1', user: 'Hidden', game: 'Mines', time: '22:45', betAmount: 100, multiplier: 2.4, payout: 240, currency: 'GC' },
      { id: '2', user: 'LuckyStriker', game: 'Plinko', time: '22:46', betAmount: 500, multiplier: 13, payout: 6500, currency: 'GC' },
      { id: '3', user: 'DragonSlayer', game: 'Dragon Tower', time: '22:46', betAmount: 10, multiplier: 8.5, payout: 85, currency: 'SC' },
      { id: '4', user: 'CryptoKing', game: 'Crash', time: '22:47', betAmount: 50, multiplier: 1.84, payout: 92, currency: 'SC' },
    ];
    setBetHistory(initialBots);
  }, []);

  const toggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const rotateSeeds = () => {
    setProvablyFair(generateProvablyFairPair());
  };

  const incrementNonce = () => {
    setProvablyFair(prev => ({ ...prev, nonce: prev.nonce + 1 }));
  };

  const resetSessionStats = () => {
    setSessionStats(initialStats);
  };

  const placeBet = (amount: number): boolean => {
    if (amount <= 0) return false;
    if (currency === 'GC') {
      if (gcBalance < amount) return false;
      setGcBalance(prev => prev - amount);
    } else {
      if (scBalance < amount) return false;
      setScBalance(prev => prev - amount);
    }

    // Update wagered & deduct initial bet from profit
    setSessionStats(prev => ({
      ...prev,
      wagered: {
        ...prev.wagered,
        [currency]: prev.wagered[currency] + amount,
      },
      profit: {
        ...prev.profit,
        [currency]: prev.profit[currency] - amount,
      },
    }));

    sound.playBet();
    incrementNonce();
    return true;
  };

  const addWin = (payout: number, multiplier: number, gameName: string, betAmount: number) => {
    if (currency === 'GC') {
      setGcBalance(prev => prev + payout);
    } else {
      setScBalance(prev => prev + payout);
    }

    // Add payout back to profit & increment wins
    setSessionStats(prev => ({
      ...prev,
      wins: prev.wins + 1,
      bestMultiplier: Math.max(prev.bestMultiplier, multiplier),
      profit: {
        ...prev.profit,
        [currency]: prev.profit[currency] + payout,
      },
    }));

    if (multiplier >= 5) {
      sound.playBigWin();
    } else {
      sound.playWin();
    }

    const newItem: BetHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      user: 'You',
      game: gameName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      betAmount,
      multiplier,
      payout,
      currency
    };

    setBetHistory(prev => [newItem, ...prev.slice(0, 19)]);
  };

  const addLoss = (gameName: string, betAmount: number) => {
    sound.playLoss();
    setSessionStats(prev => ({
      ...prev,
      losses: prev.losses + 1,
    }));

    const newItem: BetHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      user: 'You',
      game: gameName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      betAmount,
      multiplier: 0,
      payout: 0,
      currency
    };
    setBetHistory(prev => [newItem, ...prev.slice(0, 19)]);
  };

  const claimFaucet = () => {
    setGcBalance(prev => prev + 25000);
    setScBalance(prev => prev + 10);
    sound.playWin();
  };

  return (
    <GameContext.Provider value={{
      currency,
      setCurrency,
      gcBalance,
      scBalance,
      activeGame,
      setActiveGame,
      betHistory,
      provablyFair,
      rotateSeeds,
      incrementNonce,
      placeBet,
      addWin,
      addLoss,
      claimFaucet,
      isMuted,
      toggleMute,
      isProvablyFairModalOpen,
      setProvablyFairModalOpen,
      sessionStats,
      resetSessionStats,
      isStatsModalOpen,
      setStatsModalOpen,
      godMode,
      setGodMode,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};
