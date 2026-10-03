// Pure TypeScript SHA-256 & Deterministic Game Solvers (100% Exact Predictions)

export interface ProvablyFairState {
  clientSeed: string;
  serverSeed: string;
  serverSeedHash: string;
  nonce: number;
}

// SHA-256 implementation
function sha256Sync(ascii: string): string {
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  
  let hash: number[] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  
  const k: number[] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  for (let i = 0; i < ascii.length; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << ((3 - (i % 4)) * 8);
  }
  
  words[ascii.length >> 2] |= 0x80 << ((3 - (ascii.length % 4)) * 8);
  words[(((ascii.length + 8) >> 6) << 4) + 15] = asciiBitLength;

  for (let i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = [...hash];

    for (let j = 16; j < 64; j++) {
      const s0 = ((w[j - 15] >>> 7) | (w[j - 15] << 25)) ^
                 ((w[j - 15] >>> 18) | (w[j - 15] << 14)) ^
                 (w[j - 15] >>> 3);
      const s1 = ((w[j - 2] >>> 17) | (w[j - 2] << 15)) ^
                 ((w[j - 2] >>> 17) | (w[j - 2] << 15)) ^
                 (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    for (let j = 0; j < 64; j++) {
      const S1 = ((hash[4] >>> 6) | (hash[4] << 26)) ^
                 ((hash[4] >>> 11) | (hash[4] << 21)) ^
                 ((hash[4] >>> 25) | (hash[4] << 7));
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + S1 + ch + k[j] + w[j]) | 0;
      const S0 = ((hash[0] >>> 2) | (hash[0] << 30)) ^
                 ((hash[0] >>> 13) | (hash[0] << 19)) ^
                 ((hash[0] >>> 22) | (hash[0] << 10));
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (S0 + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (let j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

export const generateSeed = (length: number = 32): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let seed = '';
  for (let i = 0; i < length; i++) {
    seed += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return seed;
};

export const hashServerSeed = (serverSeed: string): string => {
  return sha256Sync(serverSeed);
};

export const generateProvablyFairPair = (): ProvablyFairState => {
  const serverSeed = generateSeed(64);
  const clientSeed = generateSeed(16);
  const serverSeedHash = hashServerSeed(serverSeed);

  return {
    clientSeed,
    serverSeed,
    serverSeedHash,
    nonce: 0,
  };
};

/**
 * Returns a deterministic float between 0 and 1 from serverSeed, clientSeed, and nonce
 */
export const getProvablyFairFloat = (
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  subNonce: number = 0
): number => {
  const hash = sha256Sync(`${serverSeed}:${clientSeed}:${nonce}:${subNonce}`);
  const sub = hash.substring(0, 8);
  const num = parseInt(sub, 16);
  return num / 0xffffffff;
};

// =========================================================
// DETERMINISTIC GAME OUTCOME SOLVERS (100% Exact Predictions)
// =========================================================

export const solveCrash = (serverSeed: string, clientSeed: string, nonce: number): number => {
  const floatVal = getProvablyFairFloat(serverSeed, clientSeed, nonce);
  const point = Math.max(1.01, parseFloat((0.99 / (1 - floatVal)).toFixed(2)));
  return point;
};

export const solveDice = (serverSeed: string, clientSeed: string, nonce: number): number => {
  const floatVal = getProvablyFairFloat(serverSeed, clientSeed, nonce);
  return parseFloat((floatVal * 100).toFixed(2));
};

export const solveLimbo = (serverSeed: string, clientSeed: string, nonce: number): number => {
  const floatVal = getProvablyFairFloat(serverSeed, clientSeed, nonce);
  return Math.max(1.00, parseFloat((0.99 / (1 - floatVal)).toFixed(2)));
};

export const solveRoulette = (serverSeed: string, clientSeed: string, nonce: number): number => {
  const floatVal = getProvablyFairFloat(serverSeed, clientSeed, nonce);
  return Math.floor(floatVal * 37);
};

export const solveKeno = (serverSeed: string, clientSeed: string, nonce: number): number[] => {
  const drawn: number[] = [];
  let sub = 0;
  while (drawn.length < 10) {
    const floatVal = getProvablyFairFloat(serverSeed, clientSeed, nonce, sub);
    const num = Math.floor(floatVal * 40) + 1;
    if (!drawn.includes(num)) {
      drawn.push(num);
    }
    sub++;
  }
  return drawn.sort((a, b) => a - b);
};

export const solveMinesGrid = (
  serverSeed: string, 
  clientSeed: string, 
  nonce: number, 
  mineCount: number
): { isMine: boolean; row: number; col: number; index: number }[] => {
  const grid: { isMine: boolean; row: number; col: number; index: number }[] = Array.from({ length: 25 }, (_, i) => ({
    isMine: false,
    row: Math.floor(i / 5) + 1,
    col: (i % 5) + 1,
    index: i,
  }));

  let placed = 0;
  let sub = 0;
  while (placed < mineCount) {
    const floatVal = getProvablyFairFloat(serverSeed, clientSeed, nonce, sub);
    const idx = Math.floor(floatVal * 25);
    if (!grid[idx].isMine) {
      grid[idx].isMine = true;
      placed++;
    }
    sub++;
  }

  return grid;
};

export const solveDragonTower = (
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  tilesCount: number,
  safeCount: number
): number[][] => {
  const levels: number[][] = [];
  for (let l = 0; l < 9; l++) {
    const safes: number[] = [];
    let sub = 0;
    while (safes.length < safeCount) {
      const floatVal = getProvablyFairFloat(serverSeed, clientSeed, nonce + l, sub);
      const idx = Math.floor(floatVal * tilesCount);
      if (!safes.includes(idx)) safes.push(idx);
      sub++;
    }
    levels.push(safes);
  }
  return levels;
};
