import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/soundEngine';
import { Castle, Flame, Egg } from 'lucide-react';
import confetti from 'canvas-confetti';

import { solveDragonTower } from '../../utils/provablyFair';

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';

interface LevelConfig {
  tilesCount: number;
  safeCount: number;
  multipliers: number[];
}

const DIFFICULTY_CONFIGS: Record<Difficulty, LevelConfig> = {
  easy: {
    tilesCount: 3,
    safeCount: 2,
    multipliers: [1.47, 2.18, 3.23, 4.79, 7.10, 10.53, 15.61, 23.14, 34.30],
  },
  medium: {
    tilesCount: 2,
    safeCount: 1,
    multipliers: [1.96, 3.88, 7.68, 15.21, 30.12, 59.63, 118.07, 233.78, 462.88],
  },
  hard: {
    tilesCount: 3,
    safeCount: 1,
    multipliers: [2.94, 8.64, 25.41, 74.72, 219.66, 645.81, 1898.69, 5582.16, 16411.55],
  },
  expert: {
    tilesCount: 4,
    safeCount: 1,
    multipliers: [3.92, 15.37, 60.23, 236.12, 925.59, 3628.32, 14223.01, 55754.22, 218556.52],
  },
  master: {
    tilesCount: 5,
    safeCount: 1,
    multipliers: [4.90, 24.01, 117.65, 576.48, 2824.75, 13841.28, 67822.28, 332329.17, 1628412.93],
  },
};

export const DragonTower: React.FC = () => {
  const { currency, placeBet, addWin, addLoss, provablyFair, godMode } = useGame();
  const [betAmount, setBetAmount] = useState<number>(100);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);

  // Tower grid state: 9 levels, each with tiles
  const [towerGrid, setTowerGrid] = useState<number[][]>([]); // array of winning tile indices per level

  const config = DIFFICULTY_CONFIGS[difficulty];
  const currentMultiplier = currentLevel > 0 ? config.multipliers[currentLevel - 1] : 1.0;
  const currentPayout = parseFloat((betAmount * currentMultiplier).toFixed(2));

  const handleStartGame = () => {
    if (isPlaying) return;

    // Solve exact safe egg route for current seed & nonce BEFORE deducting bet
    const grid = solveDragonTower(
      provablyFair.serverSeed, 
      provablyFair.clientSeed, 
      provablyFair.nonce, 
      config.tilesCount, 
      config.safeCount
    );

    if (!placeBet(betAmount)) return;

    setTowerGrid(grid);
    setCurrentLevel(0);
    setIsPlaying(true);
    setGameOver(false);
    setWon(false);
  };

  const handleTilePick = (levelIdx: number, tileIdx: number) => {
    if (!isPlaying || levelIdx !== currentLevel || gameOver) return;

    const safeIndices = towerGrid[levelIdx];
    const isSafe = safeIndices.includes(tileIdx);

    if (isSafe) {
      sound.playPeg();
      const nextLevel = currentLevel + 1;
      setCurrentLevel(nextLevel);

      if (nextLevel === 9) {
        // Reached top of tower! Auto cashout
        const mult = config.multipliers[8];
        const payout = parseFloat((betAmount * mult).toFixed(2));
        setIsPlaying(false);
        setGameOver(true);
        setWon(true);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        addWin(payout, mult, 'Dragon Tower', betAmount);
      }
    } else {
      // Hit Dragon Fire!
      sound.playLoss();
      setIsPlaying(false);
      setGameOver(true);
      setWon(false);
      addLoss('Dragon Tower', betAmount);
    }
  };

  const handleCashout = () => {
    if (!isPlaying || currentLevel === 0) return;
    const mult = config.multipliers[currentLevel - 1];
    const payout = parseFloat((betAmount * mult).toFixed(2));

    setIsPlaying(false);
    setGameOver(true);
    setWon(true);

    if (mult >= 5) {
      confetti({ particleCount: 70, spread: 60 });
    }

    addWin(payout, mult, 'Dragon Tower', betAmount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Controls */}
      <div className="lg:col-span-4 bg-[#1a2c38] p-5 rounded-lg border border-[#213743] flex flex-col gap-5 select-none">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Castle className="w-5 h-5 text-amber-400" />
          <span>Dragon Tower</span>
        </h2>

        {/* Bet Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs font-bold">
            <span className="text-[#87909c]">Bet Amount</span>
            <span className="text-[#00e701] font-mono">{betAmount} {currency}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={betAmount}
              disabled={isPlaying}
              onChange={e => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
              className="stake-input font-mono text-sm"
            />
            <button
              disabled={isPlaying}
              onClick={() => setBetAmount(prev => parseFloat((prev / 2).toFixed(2)))}
              className="stake-btn-secondary text-xs px-3 font-bold"
            >
              ½
            </button>
            <button
              disabled={isPlaying}
              onClick={() => setBetAmount(prev => prev * 2)}
              className="stake-btn-secondary text-xs px-3 font-bold"
            >
              2x
            </button>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div>
          <label className="text-xs font-bold text-[#87909c] block mb-1.5">Difficulty</label>
          <select
            value={difficulty}
            disabled={isPlaying}
            onChange={e => setDifficulty(e.target.value as Difficulty)}
            className="stake-input font-mono text-sm uppercase font-bold"
          >
            {(['easy', 'medium', 'hard', 'expert', 'master'] as Difficulty[]).map(d => (
              <option key={d} value={d}>{d.toUpperCase()} ({DIFFICULTY_CONFIGS[d].tilesCount} TILES)</option>
            ))}
          </select>
        </div>

        {/* Action Button */}
        {!isPlaying ? (
          <button
            onClick={handleStartGame}
            className="stake-btn-primary py-3.5 text-base w-full mt-2"
          >
            Bet
          </button>
        ) : (
          <button
            disabled={currentLevel === 0}
            onClick={handleCashout}
            className="w-full bg-[#00e701] text-black font-extrabold py-3.5 rounded text-base hover:bg-[#1fff20] transition shadow-lg flex flex-col items-center justify-center"
          >
            <span>Cashout</span>
            <span className="text-xs font-mono font-bold">
              {currentPayout > 0 ? `${currentPayout.toLocaleString()} ${currency} (${currentMultiplier}x)` : 'Select Egg on Level 1'}
            </span>
          </button>
        )}
      </div>

      {/* Dragon Tower Stack View (9 Levels) */}
      <div className="lg:col-span-8 bg-[#0f212e] p-6 rounded-lg border border-[#213743] flex flex-col items-center justify-center min-h-[500px] relative">
        {/* Status Alert Overlay */}
        {gameOver && (
          <div className={`absolute top-4 px-6 py-2 rounded-full font-bold text-sm border shadow-xl animate-float-up ${
            won ? 'bg-[#00e701]/20 border-[#00e701] text-[#00e701]' : 'bg-red-500/20 border-red-500 text-red-400'
          }`}>
            {won ? `Cashed Out: ${currentPayout} ${currency} (${currentMultiplier}x)` : 'DRAGON FIRE DETONATED!'}
          </div>
        )}

        <div className="w-full max-w-sm flex flex-col-reverse gap-2">
          {Array.from({ length: 9 }).map((_, levelIdx) => {
            const isCurrentLevel = isPlaying && currentLevel === levelIdx;
            const isClearedLevel = currentLevel > levelIdx;
            const levelMultiplier = config.multipliers[levelIdx];

            return (
              <div
                key={levelIdx}
                className={`flex items-center justify-between gap-3 p-2 rounded-lg border transition ${
                  isCurrentLevel
                    ? 'bg-[#1a2c38] border-[#00e701] shadow-[0_0_15px_rgba(0,231,1,0.2)]'
                    : isClearedLevel
                    ? 'bg-[#1a2c38]/40 border-emerald-500/30'
                    : 'bg-[#071624]/60 border-[#213743] opacity-60'
                }`}
              >
                {/* Multipliers Badge */}
                <div className="w-16 font-mono text-xs font-bold text-center text-[#00e701]">
                  {levelMultiplier}x
                </div>

                {/* Tiles Row */}
                <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${config.tilesCount}, 1fr)` }}>
                  {Array.from({ length: config.tilesCount }).map((_, tileIdx) => {
                    const safeIndices = towerGrid[levelIdx] || [];
                    const isWinningTile = safeIndices.includes(tileIdx);
                    const showGodMode = godMode && isPlaying && isWinningTile;

                    return (
                      <button
                        key={tileIdx}
                        disabled={!isCurrentLevel}
                        onClick={() => handleTilePick(levelIdx, tileIdx)}
                        className={`h-10 rounded border font-bold flex items-center justify-center transition-all cursor-pointer ${
                          isCurrentLevel
                            ? showGodMode
                              ? 'bg-emerald-950 border-[#00e701] text-[#00e701] shadow-[0_0_15px_rgba(0,231,1,0.5)] scale-105 animate-pulse'
                              : 'bg-[#2f4553] border-[#3a5468] hover:bg-[#00e701] hover:text-black hover:scale-[1.03]'
                            : isClearedLevel && isWinningTile
                            ? 'bg-emerald-950 border-emerald-500 text-[#00e701]'
                            : gameOver && !isWinningTile
                            ? 'bg-rose-950 border-rose-600 text-rose-500'
                            : showGodMode
                            ? 'bg-emerald-950/60 border-[#00e701]/60 text-[#00e701]'
                            : 'bg-[#0f212e] border-[#213743] text-[#87909c]'
                        }`}
                      >
                        {isClearedLevel && isWinningTile ? (
                          <Egg className="w-5 h-5 text-amber-400 animate-pulse" />
                        ) : gameOver && !isWinningTile && levelIdx === currentLevel ? (
                          <Flame className="w-5 h-5 text-rose-500 animate-bounce" />
                        ) : showGodMode ? (
                          <Egg className="w-5 h-5 text-amber-400 animate-pulse" />
                        ) : (
                          <Castle className="w-4 h-4 opacity-50" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
