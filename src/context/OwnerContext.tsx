import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useGame } from './GameContext';
import { 
  type VipTier, 
  type UserAccount,
  grantFundsToUser,
  setExactUserBalances,
  setUserVipTier,
} from '../utils/userStorage';
import confetti from 'canvas-confetti';

const OWNER_PIN = '805621';
const STORAGE_OWNER_KEY = 'stake_owner_unlocked_session';

export interface RiggedOutcomes {
  crashMultiplier: number | null;
  minesBombDefusal: boolean;
  rouletteNumber: number | null;
  blackjackForce21: boolean;
  blackjackDealerBust: boolean;
  slotsForceJackpot: boolean;
  plinkoEdgeMagnet: boolean;
  diceGuaranteedWin: boolean;
}

export interface StreamerSettings {
  streamerModeActive: boolean;
  fakeDisplayBalanceGC: number | null;
  fakeDisplayBalanceSC: number | null;
}

const defaultRiggedOutcomes: RiggedOutcomes = {
  crashMultiplier: null,
  minesBombDefusal: false,
  rouletteNumber: null,
  blackjackForce21: false,
  blackjackDealerBust: false,
  slotsForceJackpot: false,
  plinkoEdgeMagnet: false,
  diceGuaranteedWin: false,
};

const defaultStreamerSettings: StreamerSettings = {
  streamerModeActive: false,
  fakeDisplayBalanceGC: null,
  fakeDisplayBalanceSC: null,
};

interface OwnerContextType {
  isOwnerUnlocked: boolean;
  isOwnerModalOpen: boolean;
  isPinModalOpen: boolean;
  isCheatSheetOpen: boolean;
  unlockWithPin: (pin: string) => { success: boolean; error?: string };
  lockOwnerMode: () => void;
  openOwnerModal: () => void;
  closeOwnerModal: () => void;
  openPinModal: () => void;
  closePinModal: () => void;
  toggleCheatSheet: () => void;
  setCheatSheetOpen: (open: boolean) => void;
  
  // Game Rigging Controls
  riggedOutcomes: RiggedOutcomes;
  setRiggedOutcome: <K extends keyof RiggedOutcomes>(key: K, value: RiggedOutcomes[K]) => void;
  consumeRiggedOutcome: <K extends keyof RiggedOutcomes>(key: K, defaultValue: RiggedOutcomes[K]) => void;
  resetAllRigging: () => void;

  // Streamer Mode & Platform FX
  streamerSettings: StreamerSettings;
  setStreamerSettings: React.Dispatch<React.SetStateAction<StreamerSettings>>;
  triggerCoinRain: () => void;

  // Multi-Target Account Grants (Target by Username or UID)
  grantMoneyToTarget: (targetQuery: string, gc: number, sc: number) => { success: boolean; user?: UserAccount; error?: string };
  setTargetExactBalance: (targetQuery: string, gc: number, sc: number) => { success: boolean; user?: UserAccount; error?: string };
  setTargetVip: (targetQuery: string, tier: VipTier) => { success: boolean; user?: UserAccount; error?: string };

  // Master Active User Actions (Convenience Shortcuts)
  injectCoins: (gc: number, sc: number) => void;
  setExactBalances: (gc: number, sc: number) => void;
  setVipRank: (tier: VipTier) => void;
  boostRakeback: (gc: number, sc: number) => void;
  forcedCrashPoint: number | null;
  setForcedCrashPoint: (multiplier: number | null) => void;
}

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export const OwnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateCurrentUser, refreshUsers } = useAuth();
  const { setGodMode } = useGame();

  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_OWNER_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_OWNER_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [riggedOutcomes, setRiggedOutcomes] = useState<RiggedOutcomes>(defaultRiggedOutcomes);
  const [streamerSettings, setStreamerSettings] = useState<StreamerSettings>(defaultStreamerSettings);

  // If active user's UID is 805621, automatically grant owner access
  useEffect(() => {
    if (currentUser?.uid === OWNER_PIN) {
      setIsOwnerUnlocked(true);
      sessionStorage.setItem(STORAGE_OWNER_KEY, 'true');
    }
  }, [currentUser?.uid]);

  // Sync godMode with owner status: default godMode off unless owner explicitly toggles or is unlocked
  useEffect(() => {
    if (!isOwnerUnlocked) {
      setGodMode(false);
      setIsCheatSheetOpen(false);
    }
  }, [isOwnerUnlocked, setGodMode]);

  // Global keyboard shortcut: Ctrl+Shift+O or F8 to open Owner prompt/modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'o') || e.key === 'F8') {
        e.preventDefault();
        if (isOwnerUnlocked) {
          setIsOwnerModalOpen(prev => !prev);
        } else {
          setIsPinModalOpen(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOwnerUnlocked]);

  const unlockWithPin = useCallback((pin: string): { success: boolean; error?: string } => {
    if (pin.trim() === OWNER_PIN) {
      setIsOwnerUnlocked(true);
      try {
        sessionStorage.setItem(STORAGE_OWNER_KEY, 'true');
      } catch (err) {
        console.error('Failed to save owner session:', err);
      }
      setIsPinModalOpen(false);
      setIsOwnerModalOpen(true);
      setIsCheatSheetOpen(true);
      setGodMode(true);
      return { success: true };
    }
    return { success: false, error: 'Invalid Owner PIN. Access Denied.' };
  }, [setGodMode]);

  const lockOwnerMode = useCallback(() => {
    setIsOwnerUnlocked(false);
    setIsOwnerModalOpen(false);
    setIsCheatSheetOpen(false);
    setGodMode(false);
    setRiggedOutcomes(defaultRiggedOutcomes);
    setStreamerSettings(defaultStreamerSettings);
    try {
      sessionStorage.removeItem(STORAGE_OWNER_KEY);
    } catch (err) {
      console.error('Failed to clear owner session:', err);
    }
  }, [setGodMode]);

  const openOwnerModal = useCallback(() => {
    if (isOwnerUnlocked) {
      setIsOwnerModalOpen(true);
    } else {
      setIsPinModalOpen(true);
    }
  }, [isOwnerUnlocked]);

  const closeOwnerModal = useCallback(() => setIsOwnerModalOpen(false), []);
  const openPinModal = useCallback(() => setIsPinModalOpen(true), []);
  const closePinModal = useCallback(() => setIsPinModalOpen(false), []);
  const toggleCheatSheet = useCallback(() => setIsCheatSheetOpen(prev => !prev), []);

  // Rigging manipulation
  const setRiggedOutcome = useCallback(<K extends keyof RiggedOutcomes>(key: K, value: RiggedOutcomes[K]) => {
    setRiggedOutcomes(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const consumeRiggedOutcome = useCallback(<K extends keyof RiggedOutcomes>(key: K, defaultValue: RiggedOutcomes[K]) => {
    setRiggedOutcomes(prev => ({
      ...prev,
      [key]: defaultValue,
    }));
  }, []);

  const resetAllRigging = useCallback(() => {
    setRiggedOutcomes(defaultRiggedOutcomes);
  }, []);

  // Platform FX: Coin rain burst
  const triggerCoinRain = useCallback(() => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.3 },
      colors: ['#00e701', '#ffd700', '#f59e0b', '#ffffff'],
    });
  }, []);

  // Multi-Target Account Grants (Target by Username or UID)
  const grantMoneyToTarget = useCallback((targetQuery: string, gc: number, sc: number) => {
    const res = grantFundsToUser(targetQuery, gc, sc);
    if (res.success && res.user) {
      refreshUsers();
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error };
  }, [refreshUsers]);

  const setTargetExactBalance = useCallback((targetQuery: string, gc: number, sc: number) => {
    const res = setExactUserBalances(targetQuery, gc, sc);
    if (res.success && res.user) {
      refreshUsers();
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error };
  }, [refreshUsers]);

  const setTargetVip = useCallback((targetQuery: string, tier: VipTier) => {
    const res = setUserVipTier(targetQuery, tier);
    if (res.success && res.user) {
      refreshUsers();
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error };
  }, [refreshUsers]);

  // Master Actions for Active User
  const injectCoins = useCallback((gc: number, sc: number) => {
    if (!currentUser) return;
    updateCurrentUser(prev => ({
      ...prev,
      gcBalance: prev.gcBalance + gc,
      scBalance: prev.scBalance + sc,
    }));
  }, [currentUser, updateCurrentUser]);

  const setExactBalances = useCallback((gc: number, sc: number) => {
    if (!currentUser) return;
    updateCurrentUser(prev => ({
      ...prev,
      gcBalance: Math.max(0, gc),
      scBalance: Math.max(0, sc),
    }));
  }, [currentUser, updateCurrentUser]);

  const setVipRank = useCallback((tier: VipTier) => {
    if (!currentUser) return;
    let targetSC = 0;
    switch (tier) {
      case 'Diamond':
        targetSC = 250000;
        break;
      case 'Platinum':
        targetSC = 100000;
        break;
      case 'Gold':
        targetSC = 25000;
        break;
      case 'Silver':
        targetSC = 5000;
        break;
      case 'Bronze':
      default:
        targetSC = 500;
        break;
    }
    updateCurrentUser(prev => ({
      ...prev,
      totalWageredSC: targetSC,
      totalWageredGC: 0,
    }));
  }, [currentUser, updateCurrentUser]);

  const boostRakeback = useCallback((gc: number, sc: number) => {
    if (!currentUser) return;
    updateCurrentUser(prev => ({
      ...prev,
      unclaimedRakebackGC: (prev.unclaimedRakebackGC || 0) + gc,
      unclaimedRakebackSC: (prev.unclaimedRakebackSC || 0) + sc,
    }));
  }, [currentUser, updateCurrentUser]);

  const forcedCrashPoint = riggedOutcomes.crashMultiplier;
  const setForcedCrashPoint = useCallback((multiplier: number | null) => {
    setRiggedOutcome('crashMultiplier', multiplier);
  }, [setRiggedOutcome]);

  return (
    <OwnerContext.Provider
      value={{
        isOwnerUnlocked,
        isOwnerModalOpen,
        isPinModalOpen,
        isCheatSheetOpen,
        unlockWithPin,
        lockOwnerMode,
        openOwnerModal,
        closeOwnerModal,
        openPinModal,
        closePinModal,
        toggleCheatSheet,
        setCheatSheetOpen: setIsCheatSheetOpen,
        riggedOutcomes,
        setRiggedOutcome,
        consumeRiggedOutcome,
        resetAllRigging,
        streamerSettings,
        setStreamerSettings,
        triggerCoinRain,
        grantMoneyToTarget,
        setTargetExactBalance,
        setTargetVip,
        injectCoins,
        setExactBalances,
        setVipRank,
        boostRakeback,
        forcedCrashPoint,
        setForcedCrashPoint,
      }}
    >
      {children}
    </OwnerContext.Provider>
  );
};

export const useOwner = () => {
  const context = useContext(OwnerContext);
  if (!context) {
    throw new Error('useOwner must be used within an OwnerProvider');
  }
  return context;
};
