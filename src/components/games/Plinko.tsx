import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/soundEngine';
import { Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useOwner } from '../../context/OwnerContext';

type RiskLevel = 'low' | 'medium' | 'high';

// Multipliers tables for 8 to 16 rows per risk level
const MULTIPLIERS: Record<RiskLevel, Record<number, number[]>> = {
  low: {
    8: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    10: [8.9, 3.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3.0, 8.9],
    12: [10, 3.0, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3.0, 10],
    14: [7.1, 4.0, 1.9, 1.4, 1.3, 1.1, 1.0, 0.5, 1.0, 1.1, 1.3, 1.4, 1.9, 4.0, 7.1],
    16: [16, 9.0, 2.0, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2.0, 9.0, 16],
  },
  medium: {
    8: [13, 3.0, 1.3, 0.7, 0.4, 0.7, 1.3, 3.0, 13],
    10: [22, 5.0, 2.0, 1.4, 0.6, 0.4, 0.6, 1.4, 2.0, 5.0, 22],
    12: [33, 11, 4.0, 2.0, 1.1, 0.6, 0.3, 0.6, 1.1, 2.0, 4.0, 11, 33],
    14: [58, 15, 7.0, 4.0, 1.9, 1.0, 0.5, 0.2, 0.5, 1.0, 1.9, 4.0, 7.0, 15, 58],
    16: [110, 41, 10, 5.0, 3.0, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3.0, 5.0, 10, 41, 110],
  },
  high: {
    8: [29, 4.0, 1.5, 0.3, 0.2, 0.3, 1.5, 4.0, 29],
    10: [76, 10, 3.0, 0.9, 0.3, 0.2, 0.3, 0.9, 3.0, 10, 76],
    12: [170, 24, 8.1, 2.0, 0.7, 0.2, 0.2, 0.2, 0.7, 2.0, 8.1, 24, 170],
    14: [420, 56, 18, 5.0, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5.0, 18, 56, 420],
    16: [1000, 130, 26, 9.0, 4.0, 2.0, 0.2, 0.2, 0.2, 0.2, 0.2, 2.0, 4.0, 9.0, 26, 130, 1000],
  },
};

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  betAmount: number;
  pathIndex: number;
  currentStep: number;
  targetBinIndex: number;
}

export const Plinko: React.FC = () => {
  const { currency, placeBet, addWin } = useGame();
  const { riggedOutcomes } = useOwner();
  const [betAmount, setBetAmount] = useState<number>(100);
  const [risk, setRisk] = useState<RiskLevel>('medium');
  const [rows, setRows] = useState<number>(12);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);

  const activeMultipliers = MULTIPLIERS[risk][rows] || MULTIPLIERS.medium[12];

  const handleDropBall = () => {
    if (!placeBet(betAmount)) return;

    // Deterministically pick bin index based on coin flips for the row count
    let binIndex = 0;
    if (riggedOutcomes.plinkoEdgeMagnet) {
      binIndex = 0;
    } else {
      for (let r = 0; r < rows; r++) {
        if (Math.random() > 0.5) binIndex++;
      }
    }

    const newBall: Ball = {
      id: Date.now() + Math.random(),
      x: 300,
      y: 35,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 1.5,
      radius: 6,
      color: '#00e701',
      betAmount,
      pathIndex: 0,
      currentStep: 0,
      targetBinIndex: binIndex,
    };

    ballsRef.current.push(newBall);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const startY = 50;
      const spacingY = Math.min(26, (canvas.height - 120) / rows);
      const spacingX = Math.min(32, (width - 60) / (rows + 1));

      // Draw Pegs
      for (let r = 0; r <= rows; r++) {
        const pegsInRow = r + 3;
        const rowWidth = (pegsInRow - 1) * spacingX;
        const startX = (width - rowWidth) / 2;
        const y = startY + r * spacingY;

        for (let p = 0; p < pegsInRow; p++) {
          const x = startX + p * spacingX;
          ctx.beginPath();
          ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#b1bad2';
          ctx.fill();
        }
      }

      // Update & Render Balls
      const gravity = 0.25;
      const remainingBalls: Ball[] = [];

      for (const ball of ballsRef.current) {
        ball.vy += gravity;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Peg collision check
        for (let r = 0; r <= rows; r++) {
          const pegsInRow = r + 3;
          const rowWidth = (pegsInRow - 1) * spacingX;
          const startX = (width - rowWidth) / 2;
          const pegY = startY + r * spacingY;

          for (let p = 0; p < pegsInRow; p++) {
            const pegX = startX + p * spacingX;
            const dx = ball.x - pegX;
            const dy = ball.y - pegY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < ball.radius + 3.5) {
              sound.playPeg();
              // Bounce
              const angle = Math.atan2(dy, dx);
              ball.vx = Math.cos(angle) * 2.2 + (Math.random() - 0.5) * 0.5;
              ball.vy = Math.sin(angle) * 1.5;
            }
          }
        }

        // Check if ball reached bottom bins
        const binY = startY + (rows + 1) * spacingY;
        if (ball.y >= binY - 10) {
          // Ball hit bin
          const binWidth = spacingX;
          const totalBins = activeMultipliers.length;
          const binsStart = (width - totalBins * binWidth) / 2;

          let hitBin = Math.floor((ball.x - binsStart) / binWidth);
          if (hitBin < 0) hitBin = 0;
          if (hitBin >= totalBins) hitBin = totalBins - 1;
          if (riggedOutcomes.plinkoEdgeMagnet) {
            hitBin = 0;
          }

          const mult = activeMultipliers[hitBin];
          const payout = parseFloat((ball.betAmount * mult).toFixed(2));

          if (mult >= 10) {
            confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
          }

          addWin(payout, mult, 'Plinko', ball.betAmount);
        } else {
          remainingBalls.push(ball);
        }

        // Draw Ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.shadowColor = '#00e701';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ballsRef.current = remainingBalls;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [rows, risk, activeMultipliers, addWin, riggedOutcomes.plinkoEdgeMagnet]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Controls */}
      <div className="lg:col-span-4 bg-[#1a2c38] p-5 rounded-lg border border-[#213743] flex flex-col gap-5 select-none">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span>Plinko</span>
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

        {/* Risk Selection */}
        <div>
          <label className="text-xs font-bold text-[#87909c] block mb-1.5">Risk Level</label>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as RiskLevel[]).map(r => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={`py-2 rounded text-xs font-bold uppercase transition ${
                  risk === r 
                    ? 'bg-[#00e701] text-black shadow-md' 
                    : 'bg-[#0f212e] text-[#b1bad2] border border-[#213743] hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Rows Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs font-bold">
            <span className="text-[#87909c]">Rows</span>
            <span className="text-white font-mono">{rows}</span>
          </div>
          <select
            value={rows}
            onChange={e => setRows(parseInt(e.target.value))}
            className="stake-input font-mono text-sm"
          >
            {[8, 10, 12, 14, 16].map(num => (
              <option key={num} value={num}>{num} Rows</option>
            ))}
          </select>
        </div>

        {/* Drop Ball Button */}
        <button
          onClick={handleDropBall}
          className="stake-btn-primary py-3.5 text-base w-full mt-2"
        >
          Drop Ball
        </button>
      </div>

      {/* Canvas View */}
      <div className="lg:col-span-8 bg-[#0f212e] p-4 rounded-lg border border-[#213743] flex flex-col items-center justify-between min-h-[500px]">
        <canvas
          ref={canvasRef}
          width={600}
          height={420}
          className="w-full h-[420px] max-w-[600px]"
        />

        {/* Multipliers Bar */}
        <div className="flex justify-center gap-1 w-full max-w-[580px] overflow-x-auto pb-2">
          {activeMultipliers.map((mult, i) => {
            const isHigh = mult >= 10;
            return (
              <div
                key={i}
                className={`flex-1 py-1.5 rounded text-center text-[10px] font-mono font-bold border transition ${
                  isHigh 
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' 
                    : mult >= 2 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                    : 'bg-[#1a2c38] text-[#b1bad2] border-[#213743]'
                }`}
              >
                {mult}x
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
