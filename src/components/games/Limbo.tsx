import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

import { solveLimbo } from '../../utils/provablyFair';

export const Limbo: React.FC = () => {
  const { currency, placeBet, addWin, addLoss, provablyFair } = useGame();
  const [betAmount, setBetAmount] = useState<number>(100);
  const [targetMult, setTargetMult] = useState<number>(2.00);
  const [resultMult, setResultMult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [won, setWon] = useState<boolean | null>(null);

  // Win Chance formula (99% RTP)
  const winChance = parseFloat((99 / targetMult).toFixed(2));
  const potentialPayout = parseFloat((betAmount * targetMult).toFixed(2));

  const handleRoll = () => {
    if (isRolling) return;

    // Get exact Limbo multiplier for current seed & nonce BEFORE deducting bet
    const mult = solveLimbo(provablyFair.serverSeed, provablyFair.clientSeed, provablyFair.nonce);

    if (!placeBet(betAmount)) return;

    setIsRolling(true);

    setTimeout(() => {
      setResultMult(mult);

      const isWin = mult >= targetMult;
      setWon(isWin);
      setIsRolling(false);

      if (isWin) {
        if (targetMult >= 10) {
          confetti({ particleCount: 70, spread: 60 });
        }
        addWin(potentialPayout, targetMult, 'Limbo', betAmount);
      } else {
        addLoss('Limbo', betAmount);
      }
    }, 200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Controls */}
      <div className="lg:col-span-4 bg-[#1a2c38] p-5 rounded-lg border border-[#213743] flex flex-col gap-5 select-none">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          <span>Limbo</span>
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
              onChange={e => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
              className="stake-input font-mono text-sm"
            />
            <button
              onClick={() => setBetAmount(prev => parseFloat((prev / 2).toFixed(2)))}
              className="stake-btn-secondary text-xs px-3 font-bold"
            >
              ½
            </button>
            <button
              onClick={() => setBetAmount(prev => prev * 2)}
              className="stake-btn-secondary text-xs px-3 font-bold"
            >
              2x
            </button>
          </div>
        </div>

        {/* Target Multiplier */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs font-bold">
            <span className="text-[#87909c]">Target Multiplier</span>
            <span className="text-white font-mono">{targetMult}x</span>
          </div>
          <input
            type="number"
            step="0.1"
            value={targetMult}
            onChange={e => setTargetMult(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
            className="stake-input font-mono text-sm"
          />
        </div>

        {/* Stats */}
        <div className="bg-[#0f212e] border border-[#213743] p-3 rounded space-y-2 text-xs font-bold">
          <div className="flex justify-between text-[#87909c]">
            <span>Win Chance:</span>
            <span className="text-white font-mono">{winChance}%</span>
          </div>
          <div className="flex justify-between text-[#87909c]">
            <span>Profit on Win:</span>
            <span className="text-[#00e701] font-mono">+{(potentialPayout - betAmount).toFixed(2)}</span>
          </div>
        </div>

        {/* Roll Button */}
        <button
          disabled={isRolling}
          onClick={handleRoll}
          className="stake-btn-primary py-3.5 text-base w-full mt-2"
        >
          {isRolling ? 'Rolling...' : 'Play Limbo'}
        </button>
      </div>

      {/* Result Display */}
      <div className="lg:col-span-8 bg-[#0f212e] p-8 rounded-lg border border-[#213743] flex flex-col items-center justify-center min-h-[420px] select-none">
        <div className="text-center">
          <span className={`text-8xl font-black font-mono tracking-tighter ${
            resultMult === null 
              ? 'text-[#87909c]' 
              : won 
              ? 'text-[#00e701]' 
              : 'text-rose-500'
          }`}>
            {resultMult !== null ? `${resultMult.toFixed(2)}x` : '1.00x'}
          </span>
          <div className="mt-4">
            <span className="text-xs font-bold text-[#87909c] uppercase tracking-widest block">
              Target: {targetMult.toFixed(2)}x
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
