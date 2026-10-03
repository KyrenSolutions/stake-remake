import React from 'react';
import { useGame } from '../../context/GameContext';
import { Activity } from 'lucide-react';

export const LiveFeed: React.FC = () => {
  const { betHistory } = useGame();

  return (
    <div className="mt-8 stake-card overflow-hidden">
      <div className="p-4 border-b border-[#213743] flex items-center justify-between bg-[#1a2c38]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#00e701]/10 flex items-center justify-center text-[#00e701] border border-[#00e701]/20">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="font-extrabold text-white text-base tracking-tight">Live Casino Bets</h3>
        </div>
        <span className="text-xs text-[#87909c] font-bold font-mono">Real-time Provably Fair Feed</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-semibold">
          <thead className="bg-[#0f212e] text-[#87909c] uppercase text-[10px] tracking-wider border-b border-[#213743]">
            <tr>
              <th className="py-3.5 px-5">Game</th>
              <th className="py-3.5 px-5">User</th>
              <th className="py-3.5 px-5">Time</th>
              <th className="py-3.5 px-5">Bet Amount</th>
              <th className="py-3.5 px-5">Multiplier</th>
              <th className="py-3.5 px-5 text-right">Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#213743]/60">
            {betHistory.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#87909c]">
                  No bets placed yet. Start playing any Stake Original above!
                </td>
              </tr>
            ) : (
              betHistory.map(item => {
                const isWin = item.payout > 0;
                return (
                  <tr key={item.id} className="hover:bg-[#2f4553]/30 transition">
                    <td className="py-3.5 px-5 text-white font-extrabold">{item.game}</td>
                    <td className="py-3.5 px-5 text-[#b1bad2]">{item.user}</td>
                    <td className="py-3.5 px-5 text-[#87909c] font-mono">{item.time}</td>
                    <td className="py-3.5 px-5 text-white font-mono">
                      {item.currency === 'GC' ? item.betAmount.toLocaleString() : `$${item.betAmount.toFixed(2)}`}{' '}
                      <span className="text-[10px] text-[#87909c] font-sans uppercase font-bold">{item.currency}</span>
                    </td>
                    <td className="py-3.5 px-5 font-mono">
                      <span className={isWin ? 'text-[#00e701] font-bold' : 'text-[#87909c]'}>
                        {item.multiplier > 0 ? `${item.multiplier.toFixed(2)}x` : '0.00x'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold">
                      <span className={isWin ? 'text-[#00e701]' : 'text-[#87909c]'}>
                        {isWin 
                          ? `+${item.currency === 'GC' ? item.payout.toLocaleString() : item.payout.toFixed(2)}` 
                          : item.currency === 'GC' ? '0' : '$0.00'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
