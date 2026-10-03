import React from 'react';
import { useGame, type GameId } from '../../context/GameContext';
import { 
  Flame, 
  Bomb, 
  Sparkles, 
  TrendingUp, 
  Dices, 
  Zap, 
  Grid, 
  Disc, 
  Club, 
  CircleDot, 
  Layers, 
  Castle
} from 'lucide-react';

interface GameItem {
  id: GameId;
  name: string;
  icon: React.ReactNode;
  isHot?: boolean;
}

export const Sidebar: React.FC = () => {
  const { activeGame, setActiveGame } = useGame();

  const games: GameItem[] = [
    { id: 'mines', name: 'Mines', icon: <Bomb className="w-4 h-4 text-emerald-400" />, isHot: true },
    { id: 'plinko', name: 'Plinko', icon: <Sparkles className="w-4 h-4 text-purple-400" />, isHot: true },
    { id: 'dragontower', name: 'Dragon Tower', icon: <Castle className="w-4 h-4 text-amber-400" />, isHot: true },
    { id: 'crash', name: 'Crash', icon: <TrendingUp className="w-4 h-4 text-rose-400" /> },
    { id: 'dice', name: 'Dice', icon: <Dices className="w-4 h-4 text-blue-400" /> },
    { id: 'limbo', name: 'Limbo', icon: <Zap className="w-4 h-4 text-cyan-400" /> },
    { id: 'keno', name: 'Keno', icon: <Grid className="w-4 h-4 text-yellow-400" /> },
    { id: 'wheel', name: 'Wheel', icon: <Disc className="w-4 h-4 text-indigo-400" /> },
    { id: 'blackjack', name: 'Blackjack', icon: <Club className="w-4 h-4 text-[#00e701]" /> },
    { id: 'roulette', name: 'Roulette', icon: <CircleDot className="w-4 h-4 text-red-500" /> },
    { id: 'slots', name: 'Slots', icon: <Layers className="w-4 h-4 text-orange-400" /> },
  ];

  return (
    <aside className="w-64 bg-[#071624] border-r border-[#213743] min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between select-none shrink-0 shadow-lg">
      {/* Category Header */}
      <div>
        <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-extrabold text-[#87909c] uppercase tracking-wider">
          <Flame className="w-4 h-4 text-orange-500" />
          <span>Stake Originals ({games.length})</span>
        </div>

        <div className="mt-2 flex flex-col gap-1">
          {games.map(g => {
            const isActive = activeGame === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setActiveGame(g.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#1a2c38] text-white border-l-4 border-[#00e701] shadow-md pl-3' 
                    : 'text-[#b1bad2] hover:bg-[#1a2c38]/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {g.icon}
                  <span>{g.name}</span>
                </div>
                {g.isHot && (
                  <span className="text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded font-extrabold uppercase">
                    HOT
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* House Edge Note */}
      <div className="bg-[#1a2c38]/60 border border-[#213743] rounded-xl p-3.5 text-xs text-[#87909c] shadow-sm">
        <div className="font-extrabold text-white mb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00e701]"></span>
          Provably Fair
        </div>
        <p className="leading-relaxed text-[11px]">All games run on SHA-256 deterministic seeds with 99.00% RTP (1.00% House Edge).</p>
      </div>
    </aside>
  );
};
