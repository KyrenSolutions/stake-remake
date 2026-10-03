import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/soundEngine';
import { CircleDot } from 'lucide-react';
import confetti from 'canvas-confetti';

import { solveRoulette } from '../../utils/provablyFair';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

type BetType = 'number' | 'red' | 'black' | 'even' | 'odd';

interface BetSelection {
  type: BetType;
  value?: number;
  amount: number;
}

export const Roulette: React.FC = () => {
  const { currency, placeBet, addWin, addLoss, provablyFair } = useGame();
  const [chipAmount, setChipAmount] = useState<number>(50);
  const [selectedBets, setSelectedBets] = useState<BetSelection[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef<number>(0);

  const totalBetAmount = selectedBets.reduce((acc, b) => acc + b.amount, 0);

  const addBet = (type: BetType, value?: number) => {
    if (isSpinning) return;
    setSelectedBets(prev => [...prev, { type, value, amount: chipAmount }]);
    sound.playClick();
  };

  const clearBets = () => {
    if (isSpinning) return;
    setSelectedBets([]);
  };

  const handleSpin = () => {
    if (isSpinning || selectedBets.length === 0) return;

    // Get exact winning number for current seed & nonce BEFORE deducting bet
    const resultNum = solveRoulette(provablyFair.serverSeed, provablyFair.clientSeed, provablyFair.nonce);

    if (!placeBet(totalBetAmount)) return;

    setIsSpinning(true);

    const startTime = performance.now();
    const duration = 3000;
    const targetRotations = Math.PI * 2 * 6 + (resultNum / 37) * Math.PI * 2;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      angleRef.current = targetRotations * ease;

      sound.playPeg();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setWinningNumber(resultNum);

        // Calculate Payouts
        let totalPayout = 0;
        const isRed = RED_NUMBERS.includes(resultNum);
        const isEven = resultNum !== 0 && resultNum % 2 === 0;

        selectedBets.forEach(bet => {
          if (bet.type === 'number' && bet.value === resultNum) {
            totalPayout += bet.amount * 36;
          } else if (bet.type === 'red' && isRed) {
            totalPayout += bet.amount * 2;
          } else if (bet.type === 'black' && !isRed && resultNum !== 0) {
            totalPayout += bet.amount * 2;
          } else if (bet.type === 'even' && isEven) {
            totalPayout += bet.amount * 2;
          } else if (bet.type === 'odd' && !isEven && resultNum !== 0) {
            totalPayout += bet.amount * 2;
          }
        });

        if (totalPayout > 0) {
          const mult = parseFloat((totalPayout / totalBetAmount).toFixed(2));
          if (mult >= 5) confetti({ particleCount: 70, spread: 60 });
          addWin(totalPayout, mult, 'Roulette', totalBetAmount);
        } else {
          addLoss('Roulette', totalBetAmount);
        }
      }
    };

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = 140;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleRef.current);

      const totalNums = 37;
      const step = (Math.PI * 2) / totalNums;

      for (let i = 0; i < totalNums; i++) {
        const start = i * step;
        const end = start + step;
        const num = i;
        const isRed = RED_NUMBERS.includes(num);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, start, end);
        ctx.fillStyle = num === 0 ? '#00e701' : isRed ? '#ff4d4d' : '#1a2c38';
        ctx.fill();
        ctx.strokeStyle = '#0f212e';
        ctx.stroke();

        ctx.save();
        ctx.rotate(start + step / 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${num}`, radius - 10, 4);
        ctx.restore();
      }

      ctx.restore();

      // Pointer
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - radius - 8);
      ctx.lineTo(cx + 8, cy - radius - 8);
      ctx.lineTo(cx, cy - radius + 8);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    };

    render();
  }, [isSpinning, winningNumber]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Controls */}
      <div className="lg:col-span-4 bg-[#1a2c38] p-5 rounded-lg border border-[#213743] flex flex-col gap-5 select-none">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CircleDot className="w-5 h-5 text-red-500" />
          <span>Roulette</span>
        </h2>

        {/* Chip Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs font-bold">
            <span className="text-[#87909c]">Chip Bet Size</span>
            <span className="text-[#00e701] font-mono">{chipAmount} {currency}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[10, 50, 100, 500].map(amt => (
              <button
                key={amt}
                disabled={isSpinning}
                onClick={() => setChipAmount(amt)}
                className={`py-2 rounded font-mono font-bold text-xs transition ${
                  chipAmount === amt
                    ? 'bg-[#00e701] text-black'
                    : 'bg-[#0f212e] text-white border border-[#213743]'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>

        {/* Total Bet & Clear */}
        <div className="bg-[#0f212e] border border-[#213743] p-3 rounded flex justify-between items-center text-xs font-bold">
          <span className="text-[#87909c]">Total Placed Bet:</span>
          <span className="text-[#00e701] font-mono">{totalBetAmount} {currency}</span>
        </div>

        <button
          disabled={isSpinning || selectedBets.length === 0}
          onClick={clearBets}
          className="bg-[#0f212e] border border-[#213743] text-red-400 py-2 rounded text-xs font-bold hover:border-red-500 transition"
        >
          Clear Board Bets
        </button>

        {/* Spin Button */}
        <button
          disabled={isSpinning || selectedBets.length === 0}
          onClick={handleSpin}
          className="stake-btn-primary py-3.5 text-base w-full mt-2"
        >
          {isSpinning ? 'Spinning...' : 'Spin Roulette'}
        </button>
      </div>

      {/* Wheel & Board View */}
      <div className="lg:col-span-8 bg-[#0f212e] p-6 rounded-lg border border-[#213743] flex flex-col items-center justify-between min-h-[460px] select-none">
        {/* Wheel Canvas */}
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="w-full h-[280px] max-w-[320px]"
        />

        {/* Outside Bets Grid */}
        <div className="w-full max-w-xl grid grid-cols-4 gap-2 mt-4">
          <button
            disabled={isSpinning}
            onClick={() => addBet('red')}
            className="py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase rounded border border-red-500 transition"
          >
            RED (2x)
          </button>
          <button
            disabled={isSpinning}
            onClick={() => addBet('black')}
            className="py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase rounded border border-stone-700 transition"
          >
            BLACK (2x)
          </button>
          <button
            disabled={isSpinning}
            onClick={() => addBet('even')}
            className="py-3 bg-[#1a2c38] hover:bg-[#2f4553] text-white font-bold text-xs uppercase rounded border border-[#213743] transition"
          >
            EVEN (2x)
          </button>
          <button
            disabled={isSpinning}
            onClick={() => addBet('odd')}
            className="py-3 bg-[#1a2c38] hover:bg-[#2f4553] text-white font-bold text-xs uppercase rounded border border-[#213743] transition"
          >
            ODD (2x)
          </button>
        </div>
      </div>
    </div>
  );
};
