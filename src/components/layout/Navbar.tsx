import React from 'react';
import { useGame } from '../../context/GameContext';
import { ShieldCheck, Volume2, VolumeX, Coins, Gift, User, ChevronDown, BarChart2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currency, 
    setCurrency, 
    gcBalance, 
    scBalance, 
    claimFaucet, 
    isMuted, 
    toggleMute,
    setProvablyFairModalOpen,
    sessionStats,
    setStatsModalOpen
  } = useGame();

  const formattedGc = gcBalance.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const formattedSc = scBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const currentProfit = sessionStats.profit[currency];
  const isProfitPositive = currentProfit >= 0;
  const formattedProfit = currentProfit >= 0
    ? `+${currency === 'GC' ? currentProfit.toLocaleString('en-US', { maximumFractionDigits: 0 }) : `$${currentProfit.toFixed(2)}`}`
    : `${currency === 'GC' ? currentProfit.toLocaleString('en-US', { maximumFractionDigits: 0 }) : `-$${Math.abs(currentProfit).toFixed(2)}`}`;

  return (
    <header className="h-16 bg-[#1a2c38]/95 backdrop-blur-md border-b border-[#213743] px-6 flex items-center justify-between sticky top-0 z-40 select-none shadow-md">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 cursor-pointer font-black text-2xl tracking-tighter text-white">
          <span className="text-[#00e701]">STAKE</span>.US
          <span className="stake-badge">REMAKE</span>
        </div>
      </div>

      {/* Wallet Controls & Live Session Stats */}
      <div className="flex items-center gap-3">
        {/* Live Session Profit Pill */}
        <button
          onClick={() => setStatsModalOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-extrabold transition cursor-pointer shadow-sm ${
            isProfitPositive
              ? 'bg-[#00e701]/10 text-[#00e701] border-[#00e701]/30 hover:bg-[#00e701]/20'
              : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
          }`}
          title="Open Live Session Statistics"
        >
          <BarChart2 className="w-4 h-4" />
          <span className="font-sans font-extrabold text-[11px] uppercase text-[#87909c]">Stats</span>
          <span className="font-bold">
            {formattedProfit}
          </span>
        </button>

        {/* Balance Display Pill */}
        <div className="flex items-center bg-[#0f212e] rounded-lg border border-[#213743] p-1 shadow-inner">
          <div className="flex items-center gap-2 px-3.5 py-1.5 font-mono font-bold text-sm">
            <Coins className={currency === 'GC' ? 'w-4 h-4 text-amber-400' : 'w-4 h-4 text-[#00e701]'} />
            <span className="text-white tracking-wide">
              {currency === 'GC' ? formattedGc : `$${formattedSc}`}
            </span>
            <span className="text-[11px] text-[#87909c] font-sans uppercase font-bold">{currency}</span>
          </div>

          <div className="h-5 w-[1px] bg-[#213743] mx-1"></div>

          {/* Currency Switcher */}
          <button 
            onClick={() => setCurrency(currency === 'GC' ? 'SC' : 'GC')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-[#b1bad2] hover:text-white bg-[#1a2c38] hover:bg-[#2f4553] rounded-md transition shadow-sm cursor-pointer"
            title="Switch Currency"
          >
            <span>{currency}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#87909c]" />
          </button>
        </div>

        {/* Faucet Button */}
        <button
          onClick={claimFaucet}
          className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          title="Claim Daily Free Coins"
        >
          <Gift className="w-4 h-4" />
          <span>FAUCET</span>
        </button>

        {/* Sound Mute Toggle */}
        <button
          onClick={toggleMute}
          className="p-2 text-[#b1bad2] hover:text-white hover:bg-[#2f4553] rounded-lg transition cursor-pointer"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Provably Fair Modal Trigger */}
        <button
          onClick={() => setProvablyFairModalOpen(true)}
          className="p-2 text-[#b1bad2] hover:text-[#00e701] hover:bg-[#2f4553] rounded-lg transition cursor-pointer"
          title="Provably Fair Verification"
        >
          <ShieldCheck className="w-5 h-5" />
        </button>

        {/* User Profile */}
        <div className="w-9 h-9 rounded-lg bg-[#2f4553] border border-[#213743] flex items-center justify-center text-white cursor-pointer hover:border-[#00e701] transition shadow-sm">
          <User className="w-4.5 h-4.5" />
        </div>
      </div>
    </header>
  );
};
