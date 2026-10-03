import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/soundEngine';
import { Grid, Sparkles, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

type KenoRisk = 'classic' | 'low' | 'medium' | 'high';

// Keno Multipliers per selected count and hit count
const KENO_PAYOUTS: Record<KenoRisk, Record<number, number[]>> = {
  classic: {
    1: [0, 3.8],
    2: [0, 1.7, 5.2],
    3: [0, 1.0, 2.8, 24],
    4: [0, 0.5, 2.0, 8.0, 80],
    5: [0, 0.2, 1.4, 4.0, 14, 270],
    6: [0, 0.0, 1.0, 3.0, 9.0, 180, 710],
    7: [0, 0.0, 0.5, 2.0, 7.0, 30, 400, 800],
    8: [0, 0.0, 0.0, 2.0, 4.0, 11, 67, 300, 900],
    9: [0, 0.0, 0.0, 1.5, 3.0, 6.0, 25, 100, 400, 1000],
    10: [0, 0.0, 0.0, 1.2, 2.0, 4.5, 12, 40, 150, 500, 1000],
  },
  low: {
    1: [0, 1.95],
    2: [0, 1.4, 3.8],
    3: [0, 1.1, 1.8, 12],
    4: [0, 0.8, 1.5, 5.0, 30],
    5: [0, 0.5, 1.2, 3.0, 10, 100],
    6: [0, 0.2, 1.0, 2.2, 6.0, 60, 300],
    7: [0, 0.2, 0.8, 1.6, 4.0, 15, 120, 500],
    8: [0, 0.1, 0.5, 1.4, 3.0, 8.0, 40, 200, 600],
    9: [0, 0.1, 0.5, 1.2, 2.2, 5.0, 20, 80, 300, 800],
    10: [0, 0.0, 0.5, 1.1, 1.8, 3.5, 10, 30, 100, 400, 800],
  },
  medium: {
    1: [0, 2.5],
    2: [0, 1.6, 4.5],
    3: [0, 1.0, 2.5, 18],
    4: [0, 0.5, 2.2, 7.0, 50],
    5: [0, 0.2, 1.5, 4.5, 20, 180],
    6: [0, 0.0, 1.0, 3.5, 12, 120, 500],
    7: [0, 0.0, 0.6, 2.5, 8.0, 50, 300, 700],
    8: [0, 0.0, 0.0, 2.0, 5.0, 18, 100, 400, 800],
    9: [0, 0.0, 0.0, 1.6, 3.5, 10, 40, 150, 500, 900],
    10: [0, 0.0, 0.0, 1.3, 2.5, 6.0, 20, 60, 250, 700, 1000],
  },
  high: {
    1: [0, 3.96],
    2: [0, 1.8, 6.0],
    3: [0, 0.0, 3.0, 30],
    4: [0, 0.0, 2.0, 10, 100],
    5: [0, 0.0, 1.5, 5.0, 30, 350],
    6: [0, 0.0, 0.0, 4.0, 15, 200, 900],
    7: [0, 0.0, 0.0, 3.0, 10, 80, 500, 1000],
    8: [0, 0.0, 0.0, 2.5, 6.0, 25, 200, 600, 1000],
    9: [0, 0.0, 0.0, 2.0, 4.5, 15, 80, 300, 800, 1000],
    10: [0, 0.0, 0.0, 1.5, 3.5, 10, 40, 150, 500, 900, 1000],
  },
};

import { solveKeno } from '../../utils/provablyFair';

export const Keno: React.FC = () => {
  const { currency, placeBet, addWin, addLoss, provablyFair, godMode } = useGame();
  const [betAmount, setBetAmount] = useState<number>(100);
  const [risk, setRisk] = useState<KenoRisk>('classic');
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const toggleNumber = (num: number) => {
    if (isPlaying) return;
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num));
    } else {
      if (selectedNumbers.length >= 10) return;
      setSelectedNumbers(prev => [...prev, num]);
    }
  };

  const handleQuickPick = () => {
    if (isPlaying) return;
    const drawn = solveKeno(provablyFair.serverSeed, provablyFair.clientSeed, provablyFair.nonce);
    setSelectedNumbers(drawn);
  };

  const handleClear = () => {
    if (isPlaying) return;
    setSelectedNumbers([]);
    setDrawnNumbers([]);
  };

  const handlePlay = () => {
    if (isPlaying || selectedNumbers.length === 0) return;

    // Get exact deterministic 10 drawn numbers for current seed & nonce BEFORE deducting bet
    const drawn = solveKeno(provablyFair.serverSeed, provablyFair.clientSeed, provablyFair.nonce);

    if (!placeBet(betAmount)) return;

    setIsPlaying(true);
    setDrawnNumbers([]);

    // Animate drawing numbers one by one
    drawn.forEach((num, idx) => {
      setTimeout(() => {
        sound.playPeg();
        setDrawnNumbers(prev => [...prev, num]);

        if (idx === 9) {
          // Finished drawing
          const hits = selectedNumbers.filter(n => drawn.includes(n)).length;
          const multipliers = KENO_PAYOUTS[risk][selectedNumbers.length] || [0];
          const mult = multipliers[hits] || 0;
          const payout = parseFloat((betAmount * mult).toFixed(2));

          setIsPlaying(false);

          if (mult > 0) {
            if (mult >= 5) confetti({ particleCount: 70, spread: 60 });
            addWin(payout, mult, 'Keno', betAmount);
          } else {
            addLoss('Keno', betAmount);
          }
        }
      }, (idx + 1) * 120);
    });
  };

  const currentHits = selectedNumbers.filter(n => drawnNumbers.includes(n)).length;
  const currentMultipliers = selectedNumbers.length > 0 
    ? KENO_PAYOUTS[risk][selectedNumbers.length] 
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Controls */}
      <div className="lg:col-span-4 bg-[#1a2c38] p-5 rounded-lg border border-[#213743] flex flex-col gap-5 select-none">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Grid className="w-5 h-5 text-yellow-400" />
          <span>Keno</span>
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

        {/* Risk Selection */}
        <div>
          <label className="text-xs font-bold text-[#87909c] block mb-1.5">Risk Level</label>
          <select
            value={risk}
            disabled={isPlaying}
            onChange={e => setRisk(e.target.value as KenoRisk)}
            className="stake-input font-mono text-sm uppercase font-bold"
          >
            {['classic', 'low', 'medium', 'high'].map(r => (
              <option key={r} value={r}>{r.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Pick Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={isPlaying}
            onClick={handleQuickPick}
            className="bg-[#0f212e] border border-[#213743] hover:border-[#00e701] text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto Pick</span>
          </button>
          <button
            disabled={isPlaying || selectedNumbers.length === 0}
            onClick={handleClear}
            className="bg-[#0f212e] border border-[#213743] hover:border-red-500 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Clear</span>
          </button>
        </div>

        {/* Play Button */}
        <button
          disabled={isPlaying || selectedNumbers.length === 0}
          onClick={handlePlay}
          className="stake-btn-primary py-3.5 text-base w-full mt-2"
        >
          {isPlaying ? 'Drawing...' : 'Bet'}
        </button>
      </div>

      {/* 40-Tile Grid View */}
      <div className="lg:col-span-8 bg-[#0f212e] p-6 rounded-lg border border-[#213743] flex flex-col items-center justify-between min-h-[460px] select-none">
        {/* Tiles Grid 10x4 */}
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-2.5 w-full max-w-xl">
          {(() => {
            const nextWinningNumbers = solveKeno(provablyFair.serverSeed, provablyFair.clientSeed, provablyFair.nonce);

            return Array.from({ length: 40 }, (_, i) => i + 1).map(num => {
              const isSelected = selectedNumbers.includes(num);
              const isDrawn = drawnNumbers.includes(num);
              const isHit = isSelected && isDrawn;
              const isGodModeWinner = godMode && nextWinningNumbers.includes(num);

              return (
                <button
                  key={num}
                  disabled={isPlaying}
                  onClick={() => toggleNumber(num)}
                  className={`h-11 rounded-lg font-bold font-mono text-sm border transition-all cursor-pointer ${
                    isHit
                      ? 'bg-[#00e701] text-black border-[#00e701] shadow-[0_0_15px_rgba(0,231,1,0.5)] scale-105'
                      : isDrawn
                      ? 'bg-purple-950 border-purple-500 text-purple-300'
                      : isSelected
                      ? 'bg-[#1a2c38] border-[#00e701] text-[#00e701]'
                      : isGodModeWinner
                      ? 'bg-emerald-950/80 border-[#00e701] text-[#00e701] shadow-[0_0_12px_rgba(0,231,1,0.4)] animate-pulse'
                      : 'bg-[#1a2c38]/60 border-[#213743] text-white hover:bg-[#2f4553]'
                  }`}
                >
                  {num}
                </button>
              );
            });
          })()}
        </div>

        {/* Multipliers Payout Table Footer */}
        {selectedNumbers.length > 0 && (
          <div className="mt-6 w-full max-w-xl bg-[#1a2c38] p-3 rounded-lg border border-[#213743] flex justify-between gap-1 overflow-x-auto">
            {currentMultipliers.map((mult, hits) => {
              const isCurrentHit = drawnNumbers.length === 10 && currentHits === hits;
              return (
                <div
                  key={hits}
                  className={`flex-1 py-1 px-2 rounded text-center text-xs font-mono font-bold border transition ${
                    isCurrentHit
                      ? 'bg-[#00e701] text-black border-[#00e701]'
                      : 'bg-[#0f212e] text-[#b1bad2] border-[#213743]'
                  }`}
                >
                  <span className="block text-[9px] text-[#87909c] font-sans">{hits} Hits</span>
                  <span>{mult}x</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
