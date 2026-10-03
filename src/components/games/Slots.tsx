import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/soundEngine';
import { Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

const SYMBOLS = ['💎', '7️⃣', '👑', '🔔', '🍒', '🍋', '🍉'];
const SYMBOL_PAYOUTS: Record<string, number> = {
  '💎': 50,
  '7️⃣': 25,
  '👑': 15,
  '🔔': 10,
  '🍒': 5,
  '🍋': 3,
  '🍉': 2,
};

export const Slots: React.FC = () => {
  const { currency, placeBet, addWin, addLoss } = useGame();
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [reels, setReels] = useState<string[][]>([
    ['💎', '7️⃣', '👑'],
    ['🔔', '🍒', '🍋'],
    ['🍉', '💎', '7️⃣'],
    ['👑', '🔔', '🍒'],
    ['🍋', '🍉', '💎'],
  ]);

  const handleSpin = () => {
    if (isSpinning) return;
    if (!placeBet(betAmount)) return;

    setIsSpinning(true);
    sound.playPeg();

    setTimeout(() => {
      // Generate 5 reels x 3 rows
      const newReels: string[][] = [];
      for (let col = 0; col < 5; col++) {
        const reelCol: string[] = [];
        for (let row = 0; row < 3; row++) {
          const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          reelCol.push(sym);
        }
        newReels.push(reelCol);
      }

      setReels(newReels);
      setIsSpinning(false);

      // Check Middle Line Win (Row 1 across 5 reels)
      const midLine = newReels.map(r => r[1]);
      const firstSym = midLine[0];

      let matchCount = 1;
      for (let i = 1; i < midLine.length; i++) {
        if (midLine[i] === firstSym) matchCount++;
        else break;
      }

      if (matchCount >= 3) {
        const basePayout = SYMBOL_PAYOUTS[firstSym] || 2;
        const multiplier = basePayout * (matchCount === 5 ? 5 : matchCount === 4 ? 2 : 1);
        const payout = parseFloat((betAmount * multiplier).toFixed(2));

        if (multiplier >= 10) confetti({ particleCount: 80, spread: 60 });
        addWin(payout, multiplier, 'Slots', betAmount);
      } else {
        addLoss('Slots', betAmount);
      }
    }, 400);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Controls */}
      <div className="lg:col-span-4 bg-[#1a2c38] p-5 rounded-lg border border-[#213743] flex flex-col gap-5 select-none">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-orange-400" />
          <span>Stake Diamond Slots</span>
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
              disabled={isSpinning}
              onChange={e => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
              className="stake-input font-mono text-sm"
            />
            <button
              disabled={isSpinning}
              onClick={() => setBetAmount(prev => parseFloat((prev / 2).toFixed(2)))}
              className="stake-btn-secondary text-xs px-3 font-bold"
            >
              ½
            </button>
            <button
              disabled={isSpinning}
              onClick={() => setBetAmount(prev => prev * 2)}
              className="stake-btn-secondary text-xs px-3 font-bold"
            >
              2x
            </button>
          </div>
        </div>

        {/* Paytable Summary */}
        <div className="bg-[#0f212e] border border-[#213743] p-3 rounded space-y-1 text-xs font-bold">
          <span className="text-[#87909c] block mb-1 uppercase">Paytable (3+ Middle Match)</span>
          <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
            <div className="text-amber-400">💎 Diamond: 50x</div>
            <div className="text-red-400">7️⃣ Lucky 7: 25x</div>
            <div className="text-purple-400">👑 Crown: 15x</div>
            <div className="text-yellow-400">🔔 Bell: 10x</div>
          </div>
        </div>

        {/* Spin Button */}
        <button
          disabled={isSpinning}
          onClick={handleSpin}
          className="stake-btn-primary py-3.5 text-base w-full mt-2"
        >
          {isSpinning ? 'Spinning Reels...' : 'Spin Reels'}
        </button>
      </div>

      {/* 5x3 Reel View */}
      <div className="lg:col-span-8 bg-[#0f212e] p-8 rounded-lg border border-[#213743] flex flex-col items-center justify-center min-h-[420px] select-none">
        <div className="grid grid-cols-5 gap-3 w-full max-w-xl bg-[#1a2c38] p-4 rounded-xl border border-[#213743] shadow-2xl relative">
          {/* Middle Win Payline Marker */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#00e701]/60 shadow-[0_0_10px_#00e701] pointer-events-none -translate-y-1/2 z-10"></div>

          {reels.map((col, cIdx) => (
            <div key={cIdx} className="flex flex-col gap-3">
              {col.map((sym, rIdx) => (
                <div
                  key={rIdx}
                  className={`h-24 bg-[#0f212e] border border-[#213743] rounded-lg flex items-center justify-center text-4xl transition-all ${
                    isSpinning ? 'blur-sm scale-95' : 'scale-100'
                  }`}
                >
                  {sym}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
