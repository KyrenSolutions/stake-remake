import React from 'react';
import { useGame } from '../../context/GameContext';
import { BarChart2, TrendingUp, TrendingDown, RotateCw, Trophy, Target, Award } from 'lucide-react';

export const LiveStatsModal: React.FC = () => {
  const { 
    sessionStats, 
    resetSessionStats, 
    isStatsModalOpen, 
    setStatsModalOpen, 
    currency 
  } = useGame();

  if (!isStatsModalOpen) return null;

  const currentProfit = sessionStats.profit[currency];
  const currentWagered = sessionStats.wagered[currency];
  const totalBets = sessionStats.wins + sessionStats.losses;
  const winRate = totalBets > 0 ? ((sessionStats.wins / totalBets) * 100).toFixed(1) : '0.0';

  const isProfitPositive = currentProfit >= 0;
  const formattedProfit = currentProfit >= 0
    ? `+${currency === 'GC' ? currentProfit.toLocaleString('en-US', { maximumFractionDigits: 2 }) : `$${currentProfit.toFixed(2)}`}`
    : `${currency === 'GC' ? currentProfit.toLocaleString('en-US', { maximumFractionDigits: 2 }) : `-$${Math.abs(currentProfit).toFixed(2)}`}`;

  const formattedWagered = currency === 'GC'
    ? currentWagered.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : `$${currentWagered.toFixed(2)}`;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a2c38] border border-[#213743] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-float-up">
        {/* Header */}
        <div className="bg-[#0f212e] px-6 py-4 border-b border-[#213743] flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-extrabold text-lg">
            <div className="w-8 h-8 rounded-lg bg-[#00e701]/10 border border-[#00e701]/30 flex items-center justify-center text-[#00e701]">
              <BarChart2 className="w-4.5 h-4.5" />
            </div>
            <span>Live Gameplay Stats</span>
          </div>
          <button
            onClick={() => setStatsModalOpen(false)}
            className="text-[#87909c] hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 select-none">
          {/* Net Profit / Loss Banner */}
          <div className={`p-4 rounded-xl border flex flex-col items-center justify-center shadow-lg transition-all ${
            isProfitPositive 
              ? 'bg-[#00e701]/10 border-[#00e701]/30 text-[#00e701]' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <div className="flex items-center gap-1.5 text-xs uppercase font-extrabold tracking-wider mb-1">
              {isProfitPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>Session Profit / Loss ({currency})</span>
            </div>
            <span className="text-3xl font-black font-mono tracking-tight">
              {formattedProfit}
            </span>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Wagered */}
            <div className="bg-[#0f212e] p-3.5 rounded-xl border border-[#213743]">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#87909c] uppercase mb-1">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <span>Total Wagered</span>
              </div>
              <span className="text-base font-bold font-mono text-white block">
                {formattedWagered} <span className="text-xs text-[#87909c]">{currency}</span>
              </span>
            </div>

            {/* Best Multiplier */}
            <div className="bg-[#0f212e] p-3.5 rounded-xl border border-[#213743]">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#87909c] uppercase mb-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Best Win Mult</span>
              </div>
              <span className="text-base font-bold font-mono text-[#00e701] block">
                {sessionStats.bestMultiplier > 0 ? `${sessionStats.bestMultiplier.toFixed(2)}x` : '0.00x'}
              </span>
            </div>
          </div>

          {/* Win / Loss Breakdown */}
          <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#87909c] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Win Rate ({sessionStats.wins}W / {sessionStats.losses}L)</span>
              </span>
              <span className="text-white font-mono">{winRate}%</span>
            </div>

            {/* Visual Win Rate Bar */}
            <div className="w-full h-2.5 bg-[#1a2c38] rounded-full overflow-hidden flex">
              {totalBets > 0 ? (
                <>
                  <div 
                    className="bg-[#00e701] h-full transition-all"
                    style={{ width: `${(sessionStats.wins / totalBets) * 100}%` }}
                  />
                  <div 
                    className="bg-red-500 h-full transition-all"
                    style={{ width: `${(sessionStats.losses / totalBets) * 100}%` }}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-[#213743]" />
              )}
            </div>

            <div className="flex justify-between text-[11px] font-bold text-[#87909c] font-mono">
              <span className="text-[#00e701]">{sessionStats.wins} Wins</span>
              <span className="text-red-400">{sessionStats.losses} Losses</span>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetSessionStats}
            className="w-full bg-[#0f212e] hover:bg-[#2f4553] text-[#b1bad2] hover:text-white border border-[#213743] font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reset Live Session Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
};
