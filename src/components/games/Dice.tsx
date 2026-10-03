import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/soundEngine';
import { Dices, RefreshCw } from 'lucide-react';

import { solveDice } from '../../utils/provablyFair';

export const Dice: React.FC = () => {
  const { currency, placeBet, addWin, addLoss, provablyFair } = useGame();
  const [betAmount, setBetAmount] = useState<number>(100);
  const [target, setTarget] = useState<number>(50.00);
  const [isRollOver, setIsRollOver] = useState<boolean>(true);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [won, setWon] = useState<boolean | null>(null);

  // Win Chance & Multiplier formulas (99% RTP / 1% House edge)
  const winChance = isRollOver ? 100 - target : target;
  const multiplier = parseFloat((99 / winChance).toFixed(4));
  const potentialPayout = parseFloat((betAmount * multiplier).toFixed(2));

  const handleRoll = () => {
    if (isRolling) return;

    // Get exact roll for current seed & nonce BEFORE deducting bet
    const roll = solveDice(provablyFair.serverSeed, provablyFair.clientSeed, provablyFair.nonce);

    if (!placeBet(betAmount)) return;

    setIsRolling(true);
    sound.playPeg();

    setTimeout(() => {
      setLastRoll(roll);

      const isWin = isRollOver ? roll > target : roll < target;
      setWon(isWin);
      setIsRolling(false);

      if (isWin) {
        addWin(potentialPayout, multiplier, 'Dice', betAmount);
      } else {
        addLoss('Dice', betAmount);
      }
    }, 250);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Controls */}
      <div className="lg:col-span-4 bg-[#1a2c38] p-5 rounded-lg border border-[#213743] flex flex-col gap-5 select-none">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Dices className="w-5 h-5 text-blue-400" />
          <span>Dice</span>
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

        {/* Multiplier & Payout Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0f212e] border border-[#213743] p-3 rounded">
            <span className="text-[11px] font-bold text-[#87909c] block">Multiplier</span>
            <span className="text-base font-bold font-mono text-white">{multiplier}x</span>
          </div>
          <div className="bg-[#0f212e] border border-[#213743] p-3 rounded">
            <span className="text-[11px] font-bold text-[#87909c] block">Profit on Win</span>
            <span className="text-base font-bold font-mono text-[#00e701]">
              +{(potentialPayout - betAmount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Roll Mode Toggle */}
        <button
          onClick={() => setIsRollOver(!isRollOver)}
          className="w-full bg-[#0f212e] border border-[#213743] hover:border-[#00e701] py-2.5 rounded font-bold text-xs text-[#b1bad2] flex items-center justify-center gap-2 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Switch to Roll {isRollOver ? 'Under' : 'Over'}</span>
        </button>

        {/* Roll Button */}
        <button
          disabled={isRolling}
          onClick={handleRoll}
          className="stake-btn-primary py-3.5 text-base w-full mt-2"
        >
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </button>
      </div>

      {/* Main Slider & Result Display */}
      <div className="lg:col-span-8 bg-[#0f212e] p-8 rounded-lg border border-[#213743] flex flex-col items-center justify-center min-h-[420px] select-none">
        {/* Result Callout */}
        <div className="mb-10 text-center min-h-[90px]">
          {lastRoll !== null ? (
            <div className="flex flex-col items-center animate-float-up">
              <span className={`text-6xl font-black font-mono ${
                won ? 'text-[#00e701]' : 'text-rose-500'
              }`}>
                {lastRoll.toFixed(2)}
              </span>
              <span className={`text-xs font-bold uppercase mt-1 px-3 py-1 rounded-full ${
                won ? 'bg-[#00e701]/20 text-[#00e701] border border-[#00e701]/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}>
                {won ? `WON +${(potentialPayout - betAmount).toFixed(2)} ${currency}` : 'LOST'}
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-[#87909c]">Set target & roll the dice!</span>
          )}
        </div>

        {/* Slider Component */}
        <div className="w-full max-w-lg space-y-4">
          <div className="relative py-4">
            <input
              type="range"
              min="2.00"
              max="98.00"
              step="0.01"
              value={target}
              onChange={e => setTarget(parseFloat(e.target.value))}
              className="w-full h-3 bg-[#1a2c38] rounded-lg appearance-none cursor-pointer accent-[#00e701]"
            />
          </div>

          <div className="flex justify-between items-center bg-[#1a2c38] p-4 rounded-lg border border-[#213743] font-mono text-sm font-bold">
            <div>
              <span className="text-[#87909c] text-xs font-sans block">Win Chance</span>
              <span className="text-white">{winChance.toFixed(2)}%</span>
            </div>
            <div className="text-center">
              <span className="text-[#87909c] text-xs font-sans block">Roll {isRollOver ? 'Over' : 'Under'}</span>
              <span className="text-[#00e701]">{target.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-[#87909c] text-xs font-sans block">Payout</span>
              <span className="text-white">{multiplier}x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
