import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useGame } from './GameContext';
import { type VipTier } from '../utils/userStorage';

const OWNER_PIN = '805621';
const STORAGE_OWNER_KEY = 'stake_owner_unlocked_session';

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
  // Master Owner Actions
  injectCoins: (gc: number, sc: number) => void;
  setExactBalances: (gc: number, sc: number) => void;
  setVipRank: (tier: VipTier) => void;
  boostRakeback: (gc: number, sc: number) => void;
  forcedCrashPoint: number | null;
  setForcedCrashPoint: (multiplier: number | null) => void;
}

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export const OwnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateCurrentUser } = useAuth();
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
  const [forcedCrashPoint, setForcedCrashPoint] = useState<number | null>(null);

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

  // Master Actions
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
    // Set total wagered to match tier threshold
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
