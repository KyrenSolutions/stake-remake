import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  type UserAccount,
  type VipInfo,
  getLocalUsers,
  getActiveUser,
  setActiveUserId,
  createLocalUser,
  authenticateLocalUser,
  updateLocalUser,
  deleteLocalUser,
  getVipInfo,
} from '../utils/userStorage';

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
  login: (usernameOrEmail: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  switchAccount: (userId: string) => void;
  deleteAccount: (userId: string) => void;
  updateCurrentUser: (updater: (prev: UserAccount) => UserAccount) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getActiveUser());
  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => getLocalUsers());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [authPromptReason, setAuthPromptReason] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // If there are no users at all, automatically prompt registration on first visit
  useEffect(() => {
    const users = getLocalUsers();
    setAllUsers(users);
    const active = getActiveUser();
    setCurrentUser(active);

    if (!active) {
      if (users.length === 0) {
        setIsAuthModalOpen(true);
        setAuthModalMode('register');
        setAuthPromptReason('Welcome to Stake.us Remake! Create your local account to start playing with 1,000 GC and $250.00 SC.');
      } else {
        setIsAuthModalOpen(true);
        setAuthModalMode('login');
        setAuthPromptReason('Please sign in or select your local account before playing.');
      }
    }
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

  const login = useCallback((usernameOrEmail: string, password: string) => {
    const res = authenticateLocalUser(usernameOrEmail, password);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setAllUsers(getLocalUsers());
      setIsAuthModalOpen(false);
      setAuthPromptReason(null);
      return { success: true };
    }
    return { success: false, error: res.error };
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
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = updater(prev);
      updateLocalUser(updated);
      setAllUsers(getLocalUsers());
      return updated;
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
