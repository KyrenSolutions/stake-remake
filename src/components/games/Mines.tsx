import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/soundEngine';
import { Bomb, Gem } from 'lucide-react';
import confetti from 'canvas-confetti';

import { solveMinesGrid } from '../../utils/provablyFair';

interface TileState {
  id: number;
  revealed: boolean;
  isMine: boolean;
}

export const Mines: React.FC = () => {
  const { currency, placeBet, addWin, addLoss, provablyFair, godMode } = useGame();
  const [betAmount, setBetAmount] = useState<number>(100);
  const [mineCount, setMineCount] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [grid, setGrid] = useState<TileState[]>(() =>
    Array.from({ length: 25 }, (_, i) => ({ id: i, revealed: false, isMine: false }))
  );
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);

  // Multiplier formula: Combinations based calculation
  const calculateMultiplier = (revealed: number, mines: number): number => {
    if (revealed === 0) return 1.0;
    let n = 25;
    let k = mines;
    let mult = 0.99; // 1% house edge
    for (let i = 0; i < revealed; i++) {
      mult *= (n - i) / (n - k - i);
    }
    return parseFloat(mult.toFixed(2));
  };

  const currentMultiplier = calculateMultiplier(revealedCount, mineCount);
  const currentPayout = parseFloat((betAmount * currentMultiplier).toFixed(2));

  const handleStartGame = () => {
    if (isPlaying) return;
    
    // Deterministic solve grid BEFORE deducting bet
    const solvedGrid = solveMinesGrid(provablyFair.serverSeed, provablyFair.clientSeed, provablyFair.nonce, mineCount);

    if (!placeBet(betAmount)) return;

    const newGrid: TileState[] = solvedGrid.map(t => ({
      id: t.index,
      revealed: false,
      isMine: t.isMine,
    }));

    setGrid(newGrid);
    setRevealedCount(0);
    setIsPlaying(true);
    setGameOver(false);
    setWon(false);
  };

  const handleTileClick = (idx: number) => {
    if (!isPlaying || grid[idx].revealed || gameOver) return;

    const updated = [...grid];
    updated[idx].revealed = true;

    if (updated[idx].isMine) {
      // Hit mine!
      // Reveal all mines
      updated.forEach(t => {
        if (t.isMine) t.revealed = true;
      });
      setGrid(updated);
      setIsPlaying(false);
      setGameOver(true);
      setWon(false);
      addLoss('Mines', betAmount);
    } else {
      // Hit safe gem
      sound.playPeg();
      const newRevealedCount = revealedCount + 1;
      setRevealedCount(newRevealedCount);
      setGrid(updated);

      // Check if all safe tiles cleared
      const maxSafe = 25 - mineCount;
      if (newRevealedCount === maxSafe) {
        // Auto cashout
        handleCashout(updated, newRevealedCount);
      }
    }
  };

  const handleCashout = (currentGrid?: TileState[], count?: number) => {
    if (!isPlaying) return;
    const finalRevealed = count !== undefined ? count : revealedCount;
    if (finalRevealed === 0) return;

    const mult = calculateMultiplier(finalRevealed, mineCount);
    const payout = parseFloat((betAmount * mult).toFixed(2));

    const finalGrid = (currentGrid || [...grid]).map(t => ({ ...t, revealed: true }));
    setGrid(finalGrid);
    setIsPlaying(false);
    setGameOver(true);
    setWon(true);

    if (mult >= 5) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }

    addWin(payout, mult, 'Mines', betAmount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none items-start">
      {/* Betting Control Panel (Left 4 cols) */}
      <div className="lg:col-span-4 stake-card p-6 flex flex-col gap-5">
        {/* Game Title Bar */}
        <div className="flex items-center justify-between border-b border-[#213743] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00e701]/10 border border-[#00e701]/30 flex items-center justify-center text-[#00e701]">
              <Bomb className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Mines</h2>
          </div>
          <span className="text-xs font-bold text-[#87909c] font-mono">RTP 99.00%</span>
        </div>

        {/* Bet Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-2 text-xs font-extrabold text-[#87909c]">
            <span>Bet Amount</span>
            <span className="text-[#00e701] font-mono">{betAmount.toLocaleString()} {currency}</span>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={betAmount}
                disabled={isPlaying}
                onChange={e => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="stake-input font-mono text-sm pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#87909c]">
                {currency}
              </span>
            </div>
            <button
              disabled={isPlaying}
              onClick={() => setBetAmount(prev => parseFloat((prev / 2).toFixed(2)))}
              className="stake-btn-secondary text-xs px-3.5 font-bold"
            >
              ½
            </button>
            <button
              disabled={isPlaying}
              onClick={() => setBetAmount(prev => prev * 2)}
              className="stake-btn-secondary text-xs px-3.5 font-bold"
            >
              2x
            </button>
          </div>
        </div>

        {/* Mines Selector */}
        <div>
          <div className="flex items-center justify-between mb-2 text-xs font-extrabold text-[#87909c]">
            <span>Mines Count</span>
            <span className="text-white font-mono">{mineCount}</span>
          </div>
          <select
            value={mineCount}
            disabled={isPlaying}
            onChange={e => setMineCount(parseInt(e.target.value))}
            className="stake-input font-mono text-sm font-bold cursor-pointer"
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>{num} {num === 1 ? 'Mine' : 'Mines'}</option>
            ))}
          </select>
        </div>

        {/* Action Button */}
        {!isPlaying ? (
          <button
            onClick={handleStartGame}
            className="stake-btn-primary py-4 text-base w-full mt-1 shadow-lg"
          >
            Bet
          </button>
        ) : (
          <button
            disabled={revealedCount === 0}
            onClick={() => handleCashout()}
            className="w-full bg-[#00e701] text-black font-extrabold py-3.5 rounded-lg text-base hover:bg-[#1fff20] transition shadow-lg flex flex-col items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Cashout</span>
            <span className="text-xs font-mono font-bold">
              {currentPayout > 0 ? `${currentPayout.toLocaleString()} ${currency} (${currentMultiplier}x)` : 'Select a tile'}
            </span>
          </button>
        )}

        {/* Next Tile Stats */}
        {isPlaying && (
          <div className="bg-[#0f212e] border border-[#213743] p-3.5 rounded-lg text-xs space-y-2 font-bold">
            <div className="flex justify-between text-[#87909c]">
              <span>Next Tile Multiplier:</span>
              <span className="text-[#00e701] font-mono">
                {calculateMultiplier(revealedCount + 1, mineCount)}x
              </span>
            </div>
            <div className="flex justify-between text-[#87909c]">
              <span>Gems Remaining:</span>
              <span className="text-white font-mono">
                {25 - mineCount - revealedCount}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5x5 Mine Grid Canvas Container (Right 8 cols) */}
      <div className="lg:col-span-8 bg-[#0f212e] p-8 rounded-xl border border-[#213743] flex flex-col items-center justify-center relative min-h-[460px] shadow-2xl">
        {/* Status Alert Overlay */}
        {gameOver && (
          <div className={`absolute top-6 px-6 py-2.5 rounded-full font-extrabold text-sm border shadow-2xl animate-float-up z-20 ${
            won ? 'bg-[#00e701]/20 border-[#00e701] text-[#00e701]' : 'bg-red-500/20 border-red-500 text-red-400'
          }`}>
            {won ? `Cashed Out: ${currentPayout.toLocaleString()} ${currency} (${currentMultiplier}x)` : 'BOMB DETONATED!'}
          </div>
        )}

        {/* 5x5 Mine Grid */}
        <div className="grid grid-cols-5 gap-3.5 w-full max-w-md aspect-square">
          {grid.map((tile, idx) => {
            const showGodMode = godMode && isPlaying && !tile.revealed;

            return (
              <button
                key={idx}
                disabled={!isPlaying || tile.revealed || gameOver}
                onClick={() => handleTileClick(idx)}
                className={`rounded-xl transition-all duration-200 flex items-center justify-center border text-2xl font-bold cursor-pointer ${
                  !tile.revealed
                    ? showGodMode && !tile.isMine
                      ? 'bg-emerald-950/80 border-[#00e701] text-[#00e701] shadow-[0_0_15px_rgba(0,231,1,0.4)] scale-102'
                      : showGodMode && tile.isMine
                      ? 'bg-red-950/40 border-red-500/40 text-red-500 opacity-60'
                      : 'bg-[#2f4553] border-[#3a5468] hover:bg-[#3a5468] hover:scale-[1.04] active:scale-95 shadow-md'
                    : tile.isMine
                    ? 'bg-red-950/90 border-red-600 text-red-500 scale-100 shadow-[0_0_20px_rgba(239,68,68,0.6)]'
                    : 'bg-[#1a2c38] border-[#00e701]/60 text-[#00e701] scale-100 shadow-[0_0_20px_rgba(0,231,1,0.25)]'
                }`}
              >
                {tile.revealed ? (
                  tile.isMine ? (
                    <Bomb className="w-9 h-9 animate-bounce text-red-500" />
                  ) : (
                    <Gem className="w-9 h-9 animate-pulse text-[#00e701]" />
                  )
                ) : showGodMode ? (
                  tile.isMine ? (
                    <Bomb className="w-6 h-6 text-red-500 opacity-50" />
                  ) : (
                    <Gem className="w-7 h-7 text-[#00e701] animate-pulse" />
                  )
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
