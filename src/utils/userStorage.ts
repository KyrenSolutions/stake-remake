import CryptoJS from 'crypto-js';

export type VipTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface UserAccount {
  id: string;
  uid: string; // 6-digit numeric UID e.g. "849201"
  username: string;
  email: string;
  passwordHash: string;
  avatarColor: string;
  createdAt: number;
  gcBalance: number;
  scBalance: number;
  totalWageredGC: number;
  totalWageredSC: number;
  totalProfitGC: number;
  totalProfitSC: number;
  totalWins: number;
  totalLosses: number;
  // Rakeback System
  unclaimedRakebackGC: number;
  unclaimedRakebackSC: number;
  totalRakebackClaimedGC: number;
  totalRakebackClaimedSC: number;
}

export interface VipInfo {
  tier: VipTier;
  progressPercent: number;
  currentWageredSC: number;
  nextTierThreshold: number;
  nextTierName: VipTier | 'Max';
  tierColor: string;
}

const STORAGE_USERS_KEY = 'stake_local_users';
const STORAGE_ACTIVE_USER_KEY = 'stake_active_user_id';

export const AVATAR_COLORS = [
  '#00e701', // Stake Neon Green
  '#00b4d8', // Cyan
  '#6366f1', // Indigo / Purple
  '#f59e0b', // Amber / Gold
  '#ef4444', // Red
  '#ec4899', // Pink
];

// SHA-256 Hash helper using crypto-js
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password.trim()).toString();
}

// Generate a random unique 6-digit UID
export function generateUID(existingUsers: UserAccount[]): string {
  let uid = '';
  let attempts = 0;
  do {
    // Generate a 6-digit number between 100000 and 999999
    uid = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;
  } while (existingUsers.some(u => u.uid === uid) && attempts < 1000);
  return uid;
}

// Rakeback percentage of house edge based on VIP Tier
export function getRakebackRate(tier: VipTier): number {
  switch (tier) {
    case 'Diamond':
      return 0.15; // 15% of the 1% house edge
    case 'Platinum':
      return 0.125; // 12.5% of the 1% house edge
    case 'Gold':
      return 0.10; // 10% of the 1% house edge
    case 'Silver':
      return 0.075; // 7.5% of the 1% house edge
    case 'Bronze':
    default:
      return 0.05; // 5% of the 1% house edge
  }
}

// VIP calculation based on effective SC wagered (1,000 GC = $1 SC)
export function getVipInfo(user: UserAccount): VipInfo {
  const effectiveSC = user.totalWageredSC + (user.totalWageredGC / 1000);

  if (effectiveSC >= 250000) {
    return {
      tier: 'Diamond',
      progressPercent: 100,
      currentWageredSC: effectiveSC,
      nextTierThreshold: 250000,
      nextTierName: 'Max',
      tierColor: '#60a5fa', // Blue / Diamond
    };
  }
  if (effectiveSC >= 100000) {
    const progress = Math.min(100, Math.floor(((effectiveSC - 100000) / 150000) * 100));
    return {
      tier: 'Platinum',
      progressPercent: progress,
      currentWageredSC: effectiveSC,
      nextTierThreshold: 250000,
      nextTierName: 'Diamond',
      tierColor: '#93c5fd', // Light Blue / Platinum
    };
  }
  if (effectiveSC >= 25000) {
    const progress = Math.min(100, Math.floor(((effectiveSC - 25000) / 75000) * 100));
    return {
      tier: 'Gold',
      progressPercent: progress,
      currentWageredSC: effectiveSC,
      nextTierThreshold: 100000,
      nextTierName: 'Platinum',
      tierColor: '#fbbf24', // Gold
    };
  }
  if (effectiveSC >= 5000) {
    const progress = Math.min(100, Math.floor(((effectiveSC - 5000) / 20000) * 100));
    return {
      tier: 'Silver',
      progressPercent: progress,
      currentWageredSC: effectiveSC,
      nextTierThreshold: 25000,
      nextTierName: 'Gold',
      tierColor: '#cbd5e1', // Silver
    };
  }

  // Bronze tier: 0 to $5,000
  const progress = Math.min(100, Math.floor((effectiveSC / 5000) * 100));
  return {
    tier: 'Bronze',
    progressPercent: progress,
    currentWageredSC: effectiveSC,
    nextTierThreshold: 5000,
    nextTierName: 'Silver',
    tierColor: '#d97706', // Bronze
  };
}

// Retrieve all local users from localStorage with auto-migration
export function getLocalUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    let needsSave = false;
    const users: UserAccount[] = parsed.map((u, idx) => {
      if (!u.uid) {
        u.uid = (100000 + idx + Math.floor(Math.random() * 800000)).toString();
        needsSave = true;
      }
      if (u.unclaimedRakebackGC === undefined) {
        u.unclaimedRakebackGC = 0;
        needsSave = true;
      }
      if (u.unclaimedRakebackSC === undefined) {
        u.unclaimedRakebackSC = 0;
        needsSave = true;
      }
      if (u.totalRakebackClaimedGC === undefined) {
        u.totalRakebackClaimedGC = 0;
        needsSave = true;
      }
      if (u.totalRakebackClaimedSC === undefined) {
        u.totalRakebackClaimedSC = 0;
        needsSave = true;
      }
      return u;
    });

    if (needsSave) {
      saveLocalUsers(users);
    }
    return users;
  } catch (err) {
    console.error('Failed to read local users:', err);
    return [];
  }
}

// Save all local users to localStorage
export function saveLocalUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save local users:', err);
  }
}

// Active user ID helper
export function getActiveUserId(): string | null {
  try {
    return localStorage.getItem(STORAGE_ACTIVE_USER_KEY);
  } catch {
    return null;
  }
}

export function setActiveUserId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
    }
  } catch (err) {
    console.error('Failed to set active user ID:', err);
  }
}

// Get the active logged in user account
export function getActiveUser(): UserAccount | null {
  const activeId = getActiveUserId();
  if (!activeId) return null;
  const users = getLocalUsers();
  return users.find(u => u.id === activeId) || null;
}

// Create and store a new user locally
export function createLocalUser(
  username: string,
  email: string,
  password: string,
  avatarColor?: string
): { success: boolean; user?: UserAccount; error?: string } {
  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  // Username validation
  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters long.' };
  }
  if (cleanUsername.length > 20) {
    return { success: false, error: 'Username cannot exceed 20 characters.' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
    return { success: false, error: 'Username can only contain letters, numbers, hyphens, and underscores.' };
  }

  // Password validation
  if (!password || password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  // Email validation (optional format check)
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const existingUsers = getLocalUsers();

  // Check unique username
  const nameExists = existingUsers.some(
    u => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );
  if (nameExists) {
    return { success: false, error: `Username "${cleanUsername}" is already taken. Please choose another.` };
  }

  // Check unique email if provided
  if (cleanEmail) {
    const emailExists = existingUsers.some(
      u => u.email.toLowerCase() === cleanEmail
    );
    if (emailExists) {
      return { success: false, error: `Email "${cleanEmail}" is already registered on this device.` };
    }
  }

  const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const uid = generateUID(existingUsers);

  const newUser: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    uid,
    username: cleanUsername,
    email: cleanEmail || `${cleanUsername.toLowerCase()}@local.stake`,
    passwordHash: hashPassword(password),
    avatarColor: avatarColor || randomColor,
    createdAt: Date.now(),
    gcBalance: 1000,   // New users start with 1,000 GC
    scBalance: 250.0,  // Free $250.00 SC welcome bonus
    totalWageredGC: 0,
    totalWageredSC: 0,
    totalProfitGC: 0,
    totalProfitSC: 0,
    totalWins: 0,
    totalLosses: 0,
    unclaimedRakebackGC: 0,
    unclaimedRakebackSC: 0,
    totalRakebackClaimedGC: 0,
    totalRakebackClaimedSC: 0,
  };

  const updatedList = [...existingUsers, newUser];
  saveLocalUsers(updatedList);
  setActiveUserId(newUser.id);

  return { success: true, user: newUser };
}

// Authenticate user against local storage (by username, email, or UID)
export function authenticateLocalUser(
  usernameOrEmailOrUid: string,
  password: string
): { success: boolean; user?: UserAccount; error?: string } {
  const query = usernameOrEmailOrUid.trim().toLowerCase();
  if (!query) {
    return { success: false, error: 'Please enter your username, email, or UID.' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your password.' };
  }

  const users = getLocalUsers();
  const matchedUser = users.find(
    u => u.username.toLowerCase() === query || 
         u.email.toLowerCase() === query ||
         u.uid.toLowerCase() === query
  );

  if (!matchedUser) {
    return { success: false, error: 'Account not found. Please check your credentials or register.' };
  }

  const inputHash = hashPassword(password);
  if (matchedUser.passwordHash !== inputHash) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  setActiveUserId(matchedUser.id);
  return { success: true, user: matchedUser };
}

// Update single user in local storage
export function updateLocalUser(updatedUser: UserAccount): void {
  const users = getLocalUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    saveLocalUsers(users);
  }
}

// Delete user from local storage
export function deleteLocalUser(userId: string): void {
  const users = getLocalUsers();
  const filtered = users.filter(u => u.id !== userId);
  saveLocalUsers(filtered);

  if (getActiveUserId() === userId) {
    const nextUser = filtered.length > 0 ? filtered[0].id : null;
    setActiveUserId(nextUser);
  }
}

// Find user by Username or UID
export function findUserByQuery(query: string): UserAccount | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const users = getLocalUsers();
  return users.find(u => u.username.toLowerCase() === q || u.uid.toLowerCase() === q || u.id === q) || null;
}

// Grant or deduct money to any user by Username or UID
export function grantFundsToUser(
  usernameOrUid: string,
  gcDelta: number,
  scDelta: number
): { success: boolean; user?: UserAccount; error?: string } {
  const users = getLocalUsers();
  const q = usernameOrUid.trim().toLowerCase();
  const target = users.find(u => u.username.toLowerCase() === q || u.uid.toLowerCase() === q);
  if (!target) {
    return { success: false, error: `Account with Username or UID "${usernameOrUid}" not found.` };
  }

  target.gcBalance = Math.max(0, target.gcBalance + gcDelta);
  target.scBalance = Math.max(0, parseFloat((target.scBalance + scDelta).toFixed(2)));
  saveLocalUsers(users);

  return { success: true, user: target };
}

// Set exact balances for any user by Username or UID
export function setExactUserBalances(
  usernameOrUid: string,
  gc: number,
  sc: number
): { success: boolean; user?: UserAccount; error?: string } {
  const users = getLocalUsers();
  const q = usernameOrUid.trim().toLowerCase();
  const target = users.find(u => u.username.toLowerCase() === q || u.uid.toLowerCase() === q);
  if (!target) {
    return { success: false, error: `Account with Username or UID "${usernameOrUid}" not found.` };
  }

  target.gcBalance = Math.max(0, gc);
  target.scBalance = Math.max(0, parseFloat(sc.toFixed(2)));
  saveLocalUsers(users);

  return { success: true, user: target };
}

// Set VIP tier for any user by Username or UID
export function setUserVipTier(
  usernameOrUid: string,
  tier: VipTier
): { success: boolean; user?: UserAccount; error?: string } {
  const users = getLocalUsers();
  const q = usernameOrUid.trim().toLowerCase();
  const target = users.find(u => u.username.toLowerCase() === q || u.uid.toLowerCase() === q);
  if (!target) {
    return { success: false, error: `Account with Username or UID "${usernameOrUid}" not found.` };
  }

  let targetSC = 0;
  switch (tier) {
    case 'Diamond': targetSC = 250000; break;
    case 'Platinum': targetSC = 100000; break;
    case 'Gold': targetSC = 25000; break;
    case 'Silver': targetSC = 5000; break;
    case 'Bronze': default: targetSC = 500; break;
  }

  target.totalWageredSC = targetSC;
  target.totalWageredGC = 0;
  saveLocalUsers(users);

  return { success: true, user: target };
}

// Export all user accounts as formatted JSON string
export function exportUsersJson(): string {
  const users = getLocalUsers();
  return JSON.stringify(users, null, 2);
}

// Import user accounts from JSON string with validation
export function importUsersJson(jsonStr: string): { success: boolean; count?: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return { success: false, error: 'Invalid backup file format: expected array of user objects.' };
    }

    const validated: UserAccount[] = parsed.filter(u => u && typeof u === 'object' && u.id && u.username);
    if (validated.length === 0) {
      return { success: false, error: 'No valid user accounts found in JSON.' };
    }

    saveLocalUsers(validated);
    if (!getActiveUser() && validated.length > 0) {
      setActiveUserId(validated[0].id);
    }

    return { success: true, count: validated.length };
  } catch (err: any) {
    return { success: false, error: 'Failed to parse JSON file: ' + err.message };
  }
}

// Reset / wipe all accounts from local storage
export function wipeAllUsers(): void {
  localStorage.removeItem(STORAGE_USERS_KEY);
  localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
}

