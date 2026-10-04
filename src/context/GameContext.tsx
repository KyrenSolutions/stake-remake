import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateProvablyFairPair, type ProvablyFairState } from '../utils/provablyFair';
import { sound } from '../utils/soundEngine';
import { useAuth } from './AuthContext';
import { getRakebackRate, getVipInfo } from '../utils/userStorage';

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
  // Rakeback System
  isRakebackModalOpen: boolean;
  setRakebackModalOpen: (open: boolean) => void;
  claimRakeback: () => { gcClaimed: number; scClaimed: number; success: boolean };
  unclaimedRakebackGC: number;
  unclaimedRakebackSC: number;
  rakebackRate: number;
  isMuted: boolean;
  toggleMute: () => void;
  isProvablyFairModalOpen: boolean;
  setProvablyFairModalOpen: (open: boolean) => void;
  // Live Session Stats
  sessionStats: SessionStats;
  resetSessionStats: () => void;
  modifySessionStats: (updater: (prev: SessionStats) => SessionStats) => void;
  isStatsModalOpen: boolean;
  setStatsModalOpen: (open: boolean) => void;
  // God Mode Cheat State
  godMode: boolean;
  setGodMode: (enabled: boolean) => void;
  // Feed & Chat Admin Broadcasts
  broadcastFeedBet: (bet: BetHistoryItem) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  chatBotsEnabled: boolean;
  setChatBotsEnabled: (enabled: boolean) => void;
}

export interface ChatMessage {
  id: string;
  user: string;
  badge?: string;
  text: string;
  time: string;
  isSystem?: boolean;
  isAdmin?: boolean;
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
  const { currentUser, updateCurrentUser, openAuthModal } = useAuth();

  const [currency, setCurrency] = useState<Currency>('GC');
  const [gcBalance, setGcBalance] = useState<number>(() => currentUser?.gcBalance ?? 0);
  const [scBalance, setScBalance] = useState<number>(() => currentUser?.scBalance ?? 0);
  const [activeGame, setActiveGame] = useState<GameId>('mines');
  const [betHistory, setBetHistory] = useState<BetHistoryItem[]>([]);
  const [provablyFair, setProvablyFair] = useState<ProvablyFairState>(generateProvablyFairPair());
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isProvablyFairModalOpen, setProvablyFairModalOpen] = useState<boolean>(false);
  const [isStatsModalOpen, setStatsModalOpen] = useState<boolean>(false);
  const [isRakebackModalOpen, setRakebackModalOpen] = useState<boolean>(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>(initialStats);
  const [godMode, setGodMode] = useState<boolean>(true);

  // Sync balances whenever currentUser changes (login, logout, switch account)
  useEffect(() => {
    if (currentUser) {
      setGcBalance(currentUser.gcBalance);
      setScBalance(currentUser.scBalance);
    } else {
      setGcBalance(0);
      setScBalance(0);
    }
  }, [currentUser]);

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

  const [chatBotsEnabled, setChatBotsEnabled] = useState<boolean>(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    { id: '1', user: 'VipHighRoller', badge: 'VIP PLAT', text: 'Mines 5 bombs paying crazy today 🔥', time: '22:42' },
    { id: '2', user: 'StakeGod', badge: 'VIP DIAMOND', text: 'Just hit 1000x on Plinko!! LFG', time: '22:44' },
    { id: '3', user: 'CryptoRider', text: 'Dragon Tower master mode is insane', time: '22:45' },
    { id: '4', user: 'System', text: 'Welcome to Stake.us Remake Chat! GL & HF.', time: '22:46', isSystem: true },
  ]);

  const broadcastFeedBet = (bet: BetHistoryItem) => {
    setBetHistory(prev => [bet, ...prev.slice(0, 19)]);
  };

  const addChatMessage = (msg: ChatMessage) => {
    setChatMessages(prev => [...prev.slice(-40), msg]);
  };

  const modifySessionStats = (updater: (prev: SessionStats) => SessionStats) => {
    setSessionStats(updater);
  };

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

  // Current user's rakeback rate (5% to 15% of the 1% house edge)
  const currentVipTier = currentUser ? getVipInfo(currentUser).tier : 'Bronze';
  const rakebackRate = getRakebackRate(currentVipTier);
  const unclaimedRakebackGC = currentUser?.unclaimedRakebackGC ?? 0;
  const unclaimedRakebackSC = currentUser?.unclaimedRakebackSC ?? 0;

  const placeBet = (amount: number): boolean => {
    if (!currentUser) {
      openAuthModal('register', 'Create an account or sign in to start playing and earning rakeback!');
      return false;
    }

    if (amount <= 0) return false;

    // Rakeback calculation: Bet Amount * House Edge (1%) * VIP Rakeback Rate
    const rakebackEarned = amount * 0.01 * rakebackRate;

    if (currency === 'GC') {
      if (gcBalance < amount) return false;
      const nextGc = gcBalance - amount;
      setGcBalance(nextGc);
      updateCurrentUser(prev => ({
        ...prev,
        gcBalance: nextGc,
        totalWageredGC: prev.totalWageredGC + amount,
        totalProfitGC: prev.totalProfitGC - amount,
        unclaimedRakebackGC: (prev.unclaimedRakebackGC || 0) + rakebackEarned,
      }));
    } else {
      if (scBalance < amount) return false;
      const nextSc = scBalance - amount;
      setScBalance(nextSc);
      updateCurrentUser(prev => ({
        ...prev,
        scBalance: nextSc,
        totalWageredSC: prev.totalWageredSC + amount,
        totalProfitSC: prev.totalProfitSC - amount,
        unclaimedRakebackSC: (prev.unclaimedRakebackSC || 0) + rakebackEarned,
      }));
    }

    // Update session wagered & deduct initial bet from session profit
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
    if (!currentUser) return;

    if (currency === 'GC') {
      const nextGc = gcBalance + payout;
      setGcBalance(nextGc);
      updateCurrentUser(prev => ({
        ...prev,
        gcBalance: nextGc,
        totalWins: prev.totalWins + 1,
        totalProfitGC: prev.totalProfitGC + payout,
      }));
    } else {
      const nextSc = scBalance + payout;
      setScBalance(nextSc);
      updateCurrentUser(prev => ({
        ...prev,
        scBalance: nextSc,
        totalWins: prev.totalWins + 1,
        totalProfitSC: prev.totalProfitSC + payout,
      }));
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
      id: Math.random().toString(36).substring(2, 11),
      user: currentUser.username,
      game: gameName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      betAmount,
      multiplier,
      payout,
      currency,
    };

    setBetHistory(prev => [newItem, ...prev.slice(0, 19)]);
  };

  const addLoss = (gameName: string, betAmount: number) => {
    if (!currentUser) return;

    sound.playLoss();
    setSessionStats(prev => ({
      ...prev,
      losses: prev.losses + 1,
    }));

    updateCurrentUser(prev => ({
      ...prev,
      totalLosses: prev.totalLosses + 1,
    }));

    const newItem: BetHistoryItem = {
      id: Math.random().toString(36).substring(2, 11),
      user: currentUser.username,
      game: gameName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      betAmount,
      multiplier: 0,
      payout: 0,
      currency,
    };
    setBetHistory(prev => [newItem, ...prev.slice(0, 19)]);
  };

  const claimRakeback = (): { gcClaimed: number; scClaimed: number; success: boolean } => {
    if (!currentUser) {
      openAuthModal('register', 'Create an account to start earning and claiming rakeback!');
      return { gcClaimed: 0, scClaimed: 0, success: false };
    }

    const gcToClaim = currentUser.unclaimedRakebackGC || 0;
    const scToClaim = currentUser.unclaimedRakebackSC || 0;

    if (gcToClaim <= 0 && scToClaim <= 0) {
      return { gcClaimed: 0, scClaimed: 0, success: false };
    }

    const nextGc = gcBalance + gcToClaim;
    const nextSc = scBalance + scToClaim;
    setGcBalance(nextGc);
    setScBalance(nextSc);

    updateCurrentUser(prev => ({
      ...prev,
      gcBalance: nextGc,
      scBalance: nextSc,
      unclaimedRakebackGC: 0,
      unclaimedRakebackSC: 0,
      totalRakebackClaimedGC: (prev.totalRakebackClaimedGC || 0) + gcToClaim,
      totalRakebackClaimedSC: (prev.totalRakebackClaimedSC || 0) + scToClaim,
    }));

    sound.playWin();
    return { gcClaimed: gcToClaim, scClaimed: scToClaim, success: true };
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
      isRakebackModalOpen,
      setRakebackModalOpen,
      claimRakeback,
      unclaimedRakebackGC,
      unclaimedRakebackSC,
      rakebackRate,
      isMuted,
      toggleMute,
      isProvablyFairModalOpen,
      setProvablyFairModalOpen,
      sessionStats,
      resetSessionStats,
      modifySessionStats,
      isStatsModalOpen,
      setStatsModalOpen,
      godMode,
      setGodMode,
      broadcastFeedBet,
      chatMessages,
      addChatMessage,
      chatBotsEnabled,
      setChatBotsEnabled,
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
