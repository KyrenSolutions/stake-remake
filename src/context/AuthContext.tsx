import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  type UserAccount,
  type VipInfo,
  getLocalUsers,
  getActiveUser,
  getActiveUserId,
  setActiveUserId,
  createLocalUser,
  authenticateLocalUser,
  authenticateCloudUser,
  fetchAndMergeCloudUsers,
  updateLocalUser,
  updateLocalUserWithoutSync,
  deleteLocalUser,
  dbRowToUser,
  getVipInfo,
} from '../utils/userStorage';
import { supabase } from '../utils/supabaseClient';

interface AuthContextType {
  currentUser: UserAccount | null;
  allUsers: UserAccount[];
  vipInfo: VipInfo | null;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  authPromptReason: string | null;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  openAuthModal: (mode?: 'login' | 'register', reason?: string) => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: 'login' | 'register') => void;
  register: (username: string, email: string, password: string, avatarColor?: string) => { success: boolean; error?: string };
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchAccount: (userId: string) => void;
  deleteAccount: (userId: string) => void;
  updateCurrentUser: (updater: (prev: UserAccount) => UserAccount) => void;
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getActiveUser());
  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => getLocalUsers());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [authPromptReason, setAuthPromptReason] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const lastLocalUpdateTimestampRef = useRef<number>(0);

  // Initial load and Realtime cross-device subscription
  useEffect(() => {
    const users = getLocalUsers();
    setAllUsers(users);
    const active = getActiveUser();
    setCurrentUser(active);

    if (!active) {
      if (users.length === 0) {
        setIsAuthModalOpen(true);
        setAuthModalMode('register');
        setAuthPromptReason('Welcome to Stake.us Remake! Create your account to start playing with 1,000 GC and $250.00 SC.');
      } else {
        setIsAuthModalOpen(true);
        setAuthModalMode('login');
        setAuthPromptReason('Please sign in or select your account before playing.');
      }
    }

    // Background Cloud Sync on boot
    fetchAndMergeCloudUsers().then(merged => {
      setAllUsers(merged);
      const updatedActive = getActiveUser();
      if (updatedActive) {
        setCurrentUser(updatedActive);
      }
    });

    // Supabase Realtime WebSocket subscription for live multi-device updates
    const channel = supabase
      .channel('stake_users_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedUser = dbRowToUser(payload.new);
            // Save to local storage without re-triggering another upsert (breaks echo loop)
            updateLocalUserWithoutSync(updatedUser);
            setAllUsers(getLocalUsers());

            const currentActiveId = getActiveUserId();
            if (currentActiveId === updatedUser.id) {
              // If local action occurred within the last 3.5 seconds, this is an echo of our own action
              // or in-flight bet/win: DO NOT overwrite active session!
              const timeSinceLocalAction = Date.now() - lastLocalUpdateTimestampRef.current;
              if (timeSinceLocalAction > 3500) {
                setCurrentUser(updatedUser);
              }
            }
          } else if (payload.eventType === 'DELETE') {
            if (payload.old && payload.old.id) {
              deleteLocalUser(payload.old.id);
              setAllUsers(getLocalUsers());
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openAuthModal = useCallback((mode: 'login' | 'register' = 'register', reason?: string) => {
    setAuthModalMode(mode);
    setAuthPromptReason(reason || null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthPromptReason(null);
  }, []);

  const register = useCallback((username: string, email: string, password: string, avatarColor?: string) => {
    const res = createLocalUser(username, email, password, avatarColor);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setAllUsers(getLocalUsers());
      setIsAuthModalOpen(false);
      setAuthPromptReason(null);
      return { success: true };
    }
    return { success: false, error: res.error };
  }, []);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    // 1. Try local storage cache
    const res = authenticateLocalUser(usernameOrEmail, password);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setAllUsers(getLocalUsers());
      setIsAuthModalOpen(false);
      setAuthPromptReason(null);
      return { success: true };
    }

    // 2. Fall back to direct Supabase cloud query for new devices
    const cloudRes = await authenticateCloudUser(usernameOrEmail, password);
    if (cloudRes.success && cloudRes.user) {
      setCurrentUser(cloudRes.user);
      setAllUsers(getLocalUsers());
      setIsAuthModalOpen(false);
      setAuthPromptReason(null);
      return { success: true };
    }

    return { success: false, error: cloudRes.error || res.error };
  }, []);

  const logout = useCallback(() => {
    setActiveUserId(null);
    setCurrentUser(null);
    setIsProfileModalOpen(false);
  }, []);

  const switchAccount = useCallback((userId: string) => {
    const users = getLocalUsers();
    const target = users.find(u => u.id === userId);
    if (target) {
      setActiveUserId(target.id);
      setCurrentUser(target);
      setIsProfileModalOpen(false);
      setIsAuthModalOpen(false);
    }
  }, []);

  const deleteAccount = useCallback((userId: string) => {
    deleteLocalUser(userId);
    const updatedUsers = getLocalUsers();
    setAllUsers(updatedUsers);
    const newActive = getActiveUser();
    setCurrentUser(newActive);
    if (!newActive) {
      setIsProfileModalOpen(false);
      setIsAuthModalOpen(true);
      setAuthModalMode('register');
    }
  }, []);

  const updateCurrentUser = useCallback((updater: (prev: UserAccount) => UserAccount) => {
    lastLocalUpdateTimestampRef.current = Date.now();
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = updater(prev);
      updateLocalUser(updated);
      setAllUsers(getLocalUsers());
      return updated;
    });
  }, []);

  const refreshUsers = useCallback(() => {
    setAllUsers(getLocalUsers());
    setCurrentUser(getActiveUser());
    fetchAndMergeCloudUsers().then(merged => {
      setAllUsers(merged);
      setCurrentUser(getActiveUser());
    });
  }, []);

  const vipInfo = currentUser ? getVipInfo(currentUser) : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        vipInfo,
        isAuthModalOpen,
        authModalMode,
        authPromptReason,
        isProfileModalOpen,
        setIsProfileModalOpen,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        register,
        login,
        logout,
        switchAccount,
        deleteAccount,
        updateCurrentUser,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
