import React from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { useOwner } from '../../context/OwnerContext';
import { 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Coins, 
  Percent, 
  ChevronDown, 
  BarChart2, 
  LogIn, 
  UserPlus,
  KeyRound,
  Crown,
  Eye,
  EyeOff
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currency, 
    setCurrency, 
    gcBalance, 
    scBalance, 
    setRakebackModalOpen,
    unclaimedRakebackGC,
    unclaimedRakebackSC,
    isMuted, 
    toggleMute,
    setProvablyFairModalOpen,
    sessionStats,
    setStatsModalOpen
  } = useGame();

  const {
    currentUser,
    vipInfo,
    openAuthModal,
    setIsProfileModalOpen,
  } = useAuth();

  const {
    isOwnerUnlocked,
    isCheatSheetOpen,
    openOwnerModal,
    openPinModal,
    toggleCheatSheet,
  } = useOwner();

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
        {currentUser && (
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
        )}

        {/* Balance Display Pill */}
        {currentUser ? (
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
        ) : (
          <div className="hidden sm:flex items-center bg-[#0f212e]/70 rounded-lg border border-[#213743] px-3.5 py-2 text-xs text-[#87909c] font-bold">
            <span className="text-amber-400 mr-2">🎁 1,000 GC + $250 SC</span>
            <span>Sign up to claim</span>
          </div>
        )}

        {/* Rakeback Button */}
        {currentUser && (
          <button
            onClick={() => setRakebackModalOpen(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm cursor-pointer border ${
              (unclaimedRakebackGC > 0 || unclaimedRakebackSC > 0)
                ? 'bg-[#00e701]/15 hover:bg-[#00e701]/25 text-[#00e701] border-[#00e701]/40 shadow-sm shadow-[#00e701]/20'
                : 'bg-[#0f212e] hover:bg-[#213743] text-[#b1bad2] border-[#213743]'
            }`}
            title="Open Rakeback Rewards"
          >
            <Percent className="w-3.5 h-3.5 text-[#00e701]" />
            <span>RAKEBACK</span>
            {(unclaimedRakebackGC > 0 || unclaimedRakebackSC > 0) && (
              <span className="font-mono text-[10px] bg-[#00e701]/20 text-[#00e701] px-1.5 py-0.5 rounded font-bold">
                {currency === 'GC'
                  ? `${Math.floor(unclaimedRakebackGC).toLocaleString()} GC`
                  : `$${unclaimedRakebackSC.toFixed(2)}`}
              </span>
            )}
          </button>
        )}

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

        {/* Owner Console & Cheat Sheet Controls */}
        {isOwnerUnlocked ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={openOwnerModal}
              className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition shadow-sm cursor-pointer shadow-amber-500/10"
              title="Open Owner Control Console (PIN: 805621)"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>OWNER</span>
            </button>
            <button
              onClick={toggleCheatSheet}
              className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                isCheatSheetOpen
                  ? 'bg-[#00e701]/15 text-[#00e701] border-[#00e701]/40'
                  : 'bg-[#1a2c38] text-[#87909c] border-[#213743] hover:text-white'
              }`}
              title={isCheatSheetOpen ? 'Hide Cheat Sheet Sidebar' : 'Show Cheat Sheet Sidebar'}
            >
              {isCheatSheetOpen ? <Eye className="w-4 h-4 text-[#00e701]" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <button
            onClick={openPinModal}
            className="p-2 text-[#87909c] hover:text-amber-400 hover:bg-[#2f4553] rounded-lg transition cursor-pointer"
            title="Owner Passcode Entry (Press Ctrl+Shift+O)"
          >
            <KeyRound className="w-4 h-4" />
          </button>
        )}

        {/* User Auth Buttons or Profile Pill */}
        {currentUser ? (
          <div 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2.5 bg-[#0f212e] hover:bg-[#213743] border border-[#213743] hover:border-[#00e701]/50 py-1.5 px-2.5 rounded-xl cursor-pointer transition shadow-sm group"
            title={`UID: ${currentUser.uid} • Click to view Profile, VIP status & account settings`}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-black text-xs shadow-sm"
              style={{ backgroundColor: currentUser.avatarColor || '#00e701' }}
            >
              {currentUser.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-white text-xs leading-none group-hover:text-[#00e701] transition">
                {currentUser.username}
              </span>
              <div className="flex items-center gap-1.5 leading-tight mt-0.5">
                {vipInfo && (
                  <span 
                    className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: vipInfo.tierColor }}
                  >
                    {vipInfo.tier}
                  </span>
                )}
                <span className="text-[9px] text-[#87909c] font-mono">#{currentUser.uid}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#87909c] group-hover:text-white transition ml-1" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAuthModal('login')}
              className="px-3 py-1.5 text-xs font-extrabold text-white hover:bg-[#2f4553] rounded-lg transition border border-[#213743] cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="px-4 py-1.5 text-xs font-black text-black bg-[#00e701] hover:bg-[#1fff20] rounded-lg transition shadow-md shadow-[#00e701]/20 cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
