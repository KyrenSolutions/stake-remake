import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/soundEngine';
import { TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';

import { solveCrash } from '../../utils/provablyFair';

export const Crash: React.FC = () => {
  const { currency, placeBet, addWin, addLoss, provablyFair } = useGame();
  const [betAmount, setBetAmount] = useState<number>(100);
  const [autoCashout, setAutoCashout] = useState<number>(2.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentMult, setCurrentMult] = useState<number>(1.00);
  const [crashed, setCrashed] = useState<boolean>(false);
  const [cashedOut, setCashedOut] = useState<boolean>(false);
  const [cashoutMult, setCashoutMult] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const crashPointRef = useRef<number>(1.00);
  const startTimeRef = useRef<number>(0);

  const handleStartGame = () => {
    if (isPlaying) return;
    
    // Calculate exact deterministic crash point for current seed & nonce BEFORE deducting bet
    const point = solveCrash(provablyFair.serverSeed, provablyFair.clientSeed, provablyFair.nonce);

    if (!placeBet(betAmount)) return;

    crashPointRef.current = point;

    setIsPlaying(true);
    setCrashed(false);
    setCashedOut(false);
    setCashoutMult(0);
    setCurrentMult(1.00);
    startTimeRef.current = performance.now();
  };

  const handleCashout = () => {
    if (!isPlaying || crashed || cashedOut) return;

    const winMult = currentMult;
    const payout = parseFloat((betAmount * winMult).toFixed(2));
    setCashedOut(true);
    setCashoutMult(winMult);

    if (winMult >= 5) {
      confetti({ particleCount: 60, spread: 60 });
    }

    addWin(payout, winMult, 'Crash', betAmount);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      // Exponential curve formula: e^(0.06 * time)
      const mult = parseFloat(Math.exp(0.08 * elapsed).toFixed(2));
      setCurrentMult(mult);

      // Auto cashout check
      if (autoCashout > 1.0 && mult >= autoCashout && !cashedOut && !crashed) {
        handleCashout();
      }

      // Check crash
      if (mult >= crashPointRef.current) {
        // CRASHED!
        sound.playLoss();
        setCrashed(true);
        setIsPlaying(false);
        if (!cashedOut) {
          addLoss('Crash', betAmount);
        }
        return;
      }

      // Draw Canvas Graph
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      // Draw Axes
      ctx.strokeStyle = '#213743';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 20);
      ctx.lineTo(40, height - 30);
      ctx.lineTo(width - 20, height - 30);
      ctx.stroke();

      // Plot exponential line curve
      ctx.beginPath();
      ctx.moveTo(40, height - 30);

      const progress = Math.min(1, elapsed / 15);
      const endX = 40 + progress * (width - 80);
      const endY = (height - 30) - (Math.min(mult, 50) / 50) * (height - 60);

      ctx.quadraticCurveTo(
        40 + (endX - 40) * 0.5,
        height - 30,
        endX,
        endY
      );

      ctx.strokeStyle = cashedOut ? '#00e701' : '#1475e1';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw glowing dot
      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, Math.PI * 2);
      ctx.fillStyle = cashedOut ? '#00e701' : '#00e701';
      ctx.shadowColor = '#00e701';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, cashedOut, autoCashout, betAmount]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Controls */}
      <div className="lg:col-span-4 bg-[#1a2c38] p-5 rounded-lg border border-[#213743] flex flex-col gap-5 select-none">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-rose-400" />
          <span>Crash</span>
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

        {/* Auto Cashout */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs font-bold">
            <span className="text-[#87909c]">Auto Cashout Target</span>
            <span className="text-white font-mono">{autoCashout}x</span>
          </div>
          <input
            type="number"
            step="0.1"
            value={autoCashout}
            disabled={isPlaying}
            onChange={e => setAutoCashout(parseFloat(e.target.value) || 1.01)}
            className="stake-input font-mono text-sm"
          />
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
            disabled={cashedOut || crashed}
            onClick={handleCashout}
            className={`w-full font-extrabold py-3.5 rounded text-base transition shadow-lg flex flex-col items-center justify-center ${
              cashedOut 
                ? 'bg-emerald-900/60 text-[#00e701] border border-[#00e701]' 
                : 'bg-[#00e701] text-black hover:bg-[#1fff20]'
            }`}
          >
            <span>{cashedOut ? 'Cashed Out' : 'Cashout'}</span>
            <span className="text-xs font-mono font-bold">
              {cashedOut ? `${cashoutMult.toFixed(2)}x` : `$${(betAmount * currentMult).toFixed(2)} (${currentMult.toFixed(2)}x)`}
            </span>
          </button>
        )}
      </div>

      {/* Canvas View */}
      <div className="lg:col-span-8 bg-[#0f212e] p-6 rounded-lg border border-[#213743] flex flex-col items-center justify-center relative min-h-[420px]">
        {/* Live Multiplier Display */}
        <div className="absolute flex flex-col items-center select-none pointer-events-none">
          <span className={`text-6xl font-black font-mono tracking-tight ${
            crashed 
              ? 'text-rose-500 animate-bounce' 
              : cashedOut 
              ? 'text-[#00e701]' 
              : 'text-white'
          }`}>
            {currentMult.toFixed(2)}x
          </span>
          <span className="text-xs font-bold text-[#87909c] uppercase tracking-widest mt-1">
            {crashed ? 'CRASHED' : cashedOut ? 'CASHED OUT' : isPlaying ? 'RISING...' : 'NEXT ROUND'}
          </span>
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={340}
          className="w-full h-[340px] max-w-[600px]"
        />
      </div>
    </div>
  );
};
