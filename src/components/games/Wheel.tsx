import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/soundEngine';
import { Disc } from 'lucide-react';
import confetti from 'canvas-confetti';

type WheelRisk = 'low' | 'medium' | 'high';

const SEGMENT_PAYOUTS: Record<WheelRisk, Record<number, number[]>> = {
  low: {
    10: [1.2, 1.5, 1.2, 1.5, 1.2, 1.5, 1.2, 1.5, 1.2, 1.5],
    20: [1.2, 1.5, 1.2, 1.5, 1.2, 1.5, 1.2, 1.5, 1.2, 1.5, 1.2, 1.5, 1.2, 1.5, 1.2, 1.5, 1.2, 1.5, 1.2, 1.5],
    30: Array(15).fill([1.2, 1.5]).flat(),
    40: Array(20).fill([1.2, 1.5]).flat(),
    50: Array(25).fill([1.2, 1.5]).flat(),
  },
  medium: {
    10: [0.0, 1.5, 0.0, 2.0, 0.0, 1.5, 0.0, 3.0, 0.0, 1.5],
    20: [0.0, 1.5, 0.0, 2.0, 0.0, 1.5, 0.0, 3.0, 0.0, 1.5, 0.0, 1.5, 0.0, 2.0, 0.0, 1.5, 0.0, 5.0, 0.0, 1.5],
    30: Array(15).fill([0.0, 1.5, 0.0, 3.0, 0.0, 5.0]).flat().slice(0, 30),
    40: Array(20).fill([0.0, 1.5, 0.0, 3.0, 0.0, 5.0, 0.0, 10.0]).flat().slice(0, 40),
    50: Array(25).fill([0.0, 1.5, 0.0, 3.0, 0.0, 5.0, 0.0, 20.0]).flat().slice(0, 50),
  },
  high: {
    10: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 9.9],
    20: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 19.8],
    30: [...Array(29).fill(0.0), 29.7],
    40: [...Array(39).fill(0.0), 39.6],
    50: [...Array(49).fill(0.0), 49.5],
  },
};

export const Wheel: React.FC = () => {
  const { currency, placeBet, addWin, addLoss } = useGame();
  const [betAmount, setBetAmount] = useState<number>(100);
  const [risk, setRisk] = useState<WheelRisk>('medium');
  const [segmentsCount, setSegmentsCount] = useState<number>(10);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentAngleRef = useRef<number>(0);

  const payouts = SEGMENT_PAYOUTS[risk][segmentsCount] || SEGMENT_PAYOUTS.medium[10];

  const handleSpin = () => {
    if (isSpinning) return;
    if (!placeBet(betAmount)) return;

    setIsSpinning(true);

    // Pick winning segment
    const winIndex = Math.floor(Math.random() * segmentsCount);
    const segmentAngle = (Math.PI * 2) / segmentsCount;
    const targetAngle = (Math.PI * 2 * 5) + (winIndex * segmentAngle) + (segmentAngle / 2);

    const startTime = performance.now();
    const duration = 3000;
    const initialAngle = currentAngleRef.current % (Math.PI * 2);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const angle = initialAngle + targetAngle * ease;
      currentAngleRef.current = angle;

      sound.playPeg();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const mult = payouts[winIndex];
        const payout = parseFloat((betAmount * mult).toFixed(2));

        if (mult > 0) {
          if (mult >= 5) confetti({ particleCount: 70, spread: 60 });
          addWin(payout, mult, 'Wheel', betAmount);
        } else {
          addLoss('Wheel', betAmount);
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

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 160;
      const segmentAngle = (Math.PI * 2) / segmentsCount;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(currentAngleRef.current);

      for (let i = 0; i < segmentsCount; i++) {
        const start = i * segmentAngle;
        const end = start + segmentAngle;
        const mult = payouts[i];

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, start, end);
        ctx.fillStyle = mult > 0 ? (i % 2 === 0 ? '#1475e1' : '#00e701') : '#1a2c38';
        ctx.fill();
        ctx.strokeStyle = '#0f212e';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text
        ctx.save();
        ctx.rotate(start + segmentAngle / 2);
        ctx.fillStyle = mult > 0 && i % 2 === 1 ? '#000000' : '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${mult}x`, radius - 15, 4);
        ctx.restore();
      }

      ctx.restore();

      // Top Indicator Arrow
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY - radius - 10);
      ctx.lineTo(centerX + 10, centerY - radius - 10);
      ctx.lineTo(centerX, centerY - radius + 10);
      ctx.fillStyle = '#ff4d4d';
      ctx.fill();
    };

    render();
  }, [segmentsCount, risk, payouts, isSpinning]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Controls */}
      <div className="lg:col-span-4 bg-[#1a2c38] p-5 rounded-lg border border-[#213743] flex flex-col gap-5 select-none">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Disc className="w-5 h-5 text-indigo-400" />
          <span>Wheel</span>
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

        {/* Risk Selection */}
        <div>
          <label className="text-xs font-bold text-[#87909c] block mb-1.5">Risk Level</label>
          <select
            value={risk}
            disabled={isSpinning}
            onChange={e => setRisk(e.target.value as WheelRisk)}
            className="stake-input font-mono text-sm uppercase font-bold"
          >
            {['low', 'medium', 'high'].map(r => (
              <option key={r} value={r}>{r.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Segments Selection */}
        <div>
          <label className="text-xs font-bold text-[#87909c] block mb-1.5">Segments</label>
          <select
            value={segmentsCount}
            disabled={isSpinning}
            onChange={e => setSegmentsCount(parseInt(e.target.value))}
            className="stake-input font-mono text-sm font-bold"
          >
            {[10, 20, 30, 40, 50].map(s => (
              <option key={s} value={s}>{s} Segments</option>
            ))}
          </select>
        </div>

        {/* Spin Button */}
        <button
          disabled={isSpinning}
          onClick={handleSpin}
          className="stake-btn-primary py-3.5 text-base w-full mt-2"
        >
          {isSpinning ? 'Spinning...' : 'Spin Wheel'}
        </button>
      </div>

      {/* Wheel Canvas View */}
      <div className="lg:col-span-8 bg-[#0f212e] p-6 rounded-lg border border-[#213743] flex flex-col items-center justify-center min-h-[420px] select-none">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full h-[380px] max-w-[400px]"
        />
      </div>
    </div>
  );
};
