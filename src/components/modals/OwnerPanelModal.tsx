import React, { useState } from 'react';
import { useOwner } from '../../context/OwnerContext';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { type VipTier } from '../../utils/userStorage';
import { 
  Crown, 
  Eye, 
  EyeOff, 
  Coins, 
  Lock, 
  Zap, 
  X, 
  RotateCw, 
  ShieldCheck, 
  Award, 
  Check, 
  Percent,
  Terminal
} from 'lucide-react';

export const OwnerPanelModal: React.FC = () => {
  const {
    isOwnerModalOpen,
    closeOwnerModal,
    lockOwnerMode,
    isCheatSheetOpen,
    toggleCheatSheet,
    injectCoins,
    setExactBalances,
    setVipRank,
    boostRakeback,
  } = useOwner();

  const { godMode, setGodMode, provablyFair, rotateSeeds, gcBalance, scBalance } = useGame();
  const { currentUser, vipInfo } = useAuth();

  const [customGc, setCustomGc] = useState(gcBalance.toString());
  const [customSc, setCustomSc] = useState(scBalance.toString());
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOwnerModalOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSetExact = (e: React.FormEvent) => {
    e.preventDefault();
    const gc = parseFloat(customGc) || 0;
    const sc = parseFloat(customSc) || 0;
    setExactBalances(gc, sc);
    showToast(`Balances updated to ${gc.toLocaleString()} GC & $${sc.toFixed(2)} SC!`);
  };

  const vipTiers: VipTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a2c38] border border-amber-500/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-float-up my-auto">
        {/* Header */}
        <div className="bg-[#0f212e] px-6 py-4 border-b border-[#213743] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base tracking-tight">Owner Control Console</h3>
                <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                  PIN: 805621
                </span>
              </div>
              <span className="text-xs text-[#87909c]">Platform Cheats, Balance Injections & Provably Fair Overrides</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={lockOwnerMode}
              className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Lock and hide developer console"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Mode</span>
            </button>
            <button
              onClick={closeOwnerModal}
              className="text-[#87909c] hover:text-white p-1.5 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="bg-[#00e701]/15 border-b border-[#00e701]/30 px-6 py-2 text-xs text-[#00e701] font-bold flex items-center gap-2 animate-float-up">
            <Check className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6 text-xs select-none">
          {/* Section 1: God Mode & Cheat Sheet Toggles */}
          <div>
            <div className="text-[11px] font-extrabold uppercase text-[#87909c] mb-3 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#00e701]" />
              <span>Cheat Sheet & Game Vision</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cheat Sheet Sidebar Toggle */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-white text-sm block">Cheat Sheet Sidebar</span>
                  <span className="text-[11px] text-[#87909c] block mt-0.5">
                    Live seed-solver sidebar on right side
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleCheatSheet}
                  className={`px-3 py-1.5 rounded-lg font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    isCheatSheetOpen
                      ? 'bg-[#00e701] text-black shadow-md shadow-[#00e701]/20'
                      : 'bg-[#213743] text-[#87909c] hover:text-white'
                  }`}
                >
                  {isCheatSheetOpen ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{isCheatSheetOpen ? 'ENABLED' : 'DISABLED'}</span>
                </button>
              </div>

              {/* In-Game Tile Vision (God Mode) */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-white text-sm block">In-Game Tile Vision</span>
                  <span className="text-[11px] text-[#87909c] block mt-0.5">
                    Highlights mines, eggs, & keno numbers
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setGodMode(!godMode)}
                  className={`px-3 py-1.5 rounded-lg font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    godMode
                      ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                      : 'bg-[#213743] text-[#87909c] hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{godMode ? 'ACTIVE' : 'OFF'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Economy & Balance Injections */}
          <div>
            <div className="text-[11px] font-extrabold uppercase text-[#87909c] mb-3 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Wallet Balance Manipulator (Active User: {currentUser?.username || 'None'})</span>
            </div>

            <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-4">
              {/* Quick Injections */}
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#87909c] block mb-2">Instant Grants</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      injectCoins(0, 1000);
                      showToast('Injected +$1,000 SC!');
                    }}
                    className="bg-[#1a2c38] hover:bg-[#2f4553] text-[#00e701] border border-[#213743] py-2 rounded-lg font-mono font-bold transition cursor-pointer text-xs"
                  >
                    +$1,000 SC
                  </button>
                  <button
                    onClick={() => {
                      injectCoins(0, 10000);
                      showToast('Injected +$10,000 SC!');
                    }}
                    className="bg-[#1a2c38] hover:bg-[#2f4553] text-[#00e701] border border-[#213743] py-2 rounded-lg font-mono font-bold transition cursor-pointer text-xs"
                  >
                    +$10,000 SC
                  </button>
                  <button
                    onClick={() => {
                      injectCoins(1000000, 0);
                      showToast('Injected +1,000,000 GC!');
                    }}
                    className="bg-[#1a2c38] hover:bg-[#2f4553] text-amber-400 border border-[#213743] py-2 rounded-lg font-mono font-bold transition cursor-pointer text-xs"
                  >
                    +1,000,000 GC
                  </button>
                  <button
                    onClick={() => {
                      boostRakeback(50000, 500);
                      showToast('Injected +$500 SC & +50K GC into Unclaimed Rakeback!');
                    }}
                    className="bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 py-2 rounded-lg font-mono font-bold transition cursor-pointer text-xs flex items-center justify-center gap-1"
                  >
                    <Percent className="w-3 h-3" />
                    <span>+$500 Rakeback</span>
                  </button>
                </div>
              </div>

              {/* Exact Balance Form */}
              <form onSubmit={handleSetExact} className="pt-2 border-t border-[#213743] grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-[#87909c] block mb-1">Set Exact GC</label>
                  <input
                    type="number"
                    value={customGc}
                    onChange={e => setCustomGc(e.target.value)}
                    className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg px-3 py-2 text-white font-mono font-bold outline-none focus:border-[#00e701]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-[#87909c] block mb-1">Set Exact SC</label>
                  <input
                    type="number"
                    step="0.01"
                    value={customSc}
                    onChange={e => setCustomSc(e.target.value)}
                    className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg px-3 py-2 text-white font-mono font-bold outline-none focus:border-[#00e701]"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#00e701] hover:bg-[#1fff20] text-black font-extrabold py-2 px-4 rounded-lg transition cursor-pointer h-9 text-xs"
                >
                  Apply Balances
                </button>
              </form>
            </div>
          </div>

          {/* Section 3: VIP Tier Override */}
          <div>
            <div className="text-[11px] font-extrabold uppercase text-[#87909c] mb-3 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span>Instant VIP Tier Rank-Up</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {vipTiers.map(tier => {
                const isCurrent = vipInfo?.tier === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => {
                      setVipRank(tier);
                      showToast(`Active account promoted to VIP ${tier}!`);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      isCurrent
                        ? 'bg-[#00e701]/15 border-[#00e701] text-[#00e701] font-black shadow-md'
                        : 'bg-[#0f212e] hover:bg-[#213743] border-[#213743] text-[#b1bad2] font-bold'
                    }`}
                  >
                    <span className="block text-xs uppercase">{tier}</span>
                    <span className="text-[9px] text-[#87909c] block mt-0.5">
                      {tier === 'Diamond' ? '15% Rakeback' : tier === 'Platinum' ? '12.5% Rakeback' : tier === 'Gold' ? '10% Rakeback' : tier === 'Silver' ? '7.5% Rakeback' : '5% Rakeback'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Provably Fair Inspector */}
          <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#00e701]" />
                <span>Active Server Seed (Unhashed Plaintext)</span>
              </span>
              <button
                type="button"
                onClick={rotateSeeds}
                className="text-[#00e701] hover:underline flex items-center gap-1 font-bold text-[11px] cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                <span>Rotate Seeds</span>
              </button>
            </div>
            <div className="bg-[#1a2c38] p-2.5 rounded-lg border border-[#213743] flex items-center justify-between font-mono text-[11px] text-amber-300 break-all">
              <span>{provablyFair.serverSeed}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(provablyFair.serverSeed);
                  setCopiedSeed(true);
                  setTimeout(() => setCopiedSeed(false), 2000);
                }}
                className="ml-2 text-[#87909c] hover:text-white shrink-0 cursor-pointer"
                title="Copy Server Seed"
              >
                {copiedSeed ? <Check className="w-3.5 h-3.5 text-[#00e701]" /> : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
