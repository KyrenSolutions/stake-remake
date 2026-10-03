import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Percent, 
  Coins, 
  DollarSign, 
  Crown, 
  HelpCircle, 
  CheckCircle, 
  X,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const RakebackModal: React.FC = () => {
  const {
    isRakebackModalOpen,
    setRakebackModalOpen,
    claimRakeback,
    unclaimedRakebackGC,
    unclaimedRakebackSC,
    rakebackRate,
  } = useGame();

  const { currentUser, vipInfo } = useAuth();
  const [claimSuccess, setClaimSuccess] = useState<{ gc: number; sc: number } | null>(null);

  if (!isRakebackModalOpen) return null;

  const hasUnclaimed = unclaimedRakebackGC > 0 || unclaimedRakebackSC > 0;
  const ratePercent = (rakebackRate * 100).toFixed(1);

  const handleClaim = () => {
    const res = claimRakeback();
    if (res.success) {
      setClaimSuccess({ gc: res.gcClaimed, sc: res.scClaimed });
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        setClaimSuccess(null);
      }, 4000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a2c38] border border-[#213743] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-float-up my-auto">
        {/* Header */}
        <div className="bg-[#0f212e] px-6 py-4 border-b border-[#213743] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00e701]/10 border border-[#00e701]/30 flex items-center justify-center text-[#00e701]">
              <Percent className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base tracking-tight leading-none">Stake Rakeback</h3>
              <span className="text-[11px] text-[#87909c] font-semibold">Instant House Edge Rebates</span>
            </div>
          </div>

          <button
            onClick={() => setRakebackModalOpen(false)}
            className="text-[#87909c] hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 select-none">
          {/* Claim Success Banner */}
          {claimSuccess && (
            <div className="bg-[#00e701]/15 border border-[#00e701]/40 rounded-xl p-3 flex items-center gap-2.5 text-xs text-[#00e701] font-bold animate-float-up">
              <CheckCircle className="w-4.5 h-4.5 shrink-0" />
              <span>
                Successfully claimed +{claimSuccess.gc.toLocaleString('en-US', { maximumFractionDigits: 2 })} GC & +${claimSuccess.sc.toFixed(2)} SC!
              </span>
            </div>
          )}

          {/* Active VIP Tier Rakeback Rate */}
          <div className="bg-[#0f212e] border border-[#213743] rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" style={{ color: vipInfo?.tierColor || '#d97706' }} />
              <div>
                <span className="text-[11px] text-[#87909c] font-extrabold uppercase block">Your VIP Tier</span>
                <span className="text-sm font-black text-white">{vipInfo?.tier || 'Bronze'} Club</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#87909c] font-extrabold uppercase block">Rebate Rate</span>
              <span className="text-sm font-black font-mono text-[#00e701]">{ratePercent}%</span>
            </div>
          </div>

          {/* Unclaimed Rakeback Balances Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* GC Unclaimed */}
            <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743]">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#87909c] uppercase mb-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Gold Coins</span>
              </div>
              <span className="text-lg font-black font-mono text-white block">
                {unclaimedRakebackGC.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#87909c] font-bold">Unclaimed GC</span>
            </div>

            {/* SC Unclaimed */}
            <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743]">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#87909c] uppercase mb-1">
                <DollarSign className="w-3.5 h-3.5 text-[#00e701]" />
                <span>Stake Cash</span>
              </div>
              <span className="text-lg font-black font-mono text-[#00e701] block">
                ${unclaimedRakebackSC.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#87909c] font-bold">Unclaimed SC</span>
            </div>
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={!hasUnclaimed}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${
              hasUnclaimed
                ? 'bg-[#00e701] hover:bg-[#1fff20] text-black shadow-[#00e701]/20 active:scale-[0.99]'
                : 'bg-[#213743]/50 text-[#87909c] cursor-not-allowed border border-[#213743]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{hasUnclaimed ? 'Claim Unclaimed Rakeback' : 'No Rakeback Available to Claim'}</span>
          </button>

          {/* How Rakeback Works Explainer */}
          <div className="bg-[#0f212e]/70 border border-[#213743] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-white">
              <HelpCircle className="w-3.5 h-3.5 text-[#00e701]" />
              <span>How Stake Rakeback Works</span>
            </div>
            <p className="text-[11px] text-[#87909c] leading-relaxed">
              Every bet you make earns rakeback directly back from the platform’s 1.00% house edge. Whether you win or lose, your rakeback balance accumulates automatically in real-time.
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-[#b1bad2] border-t border-[#213743]/80">
              <span>Bronze: 5.0%</span>
              <span>•</span>
              <span>Silver: 7.5%</span>
              <span>•</span>
              <span>Gold: 10.0%</span>
              <span>•</span>
              <span>Diamond: 15.0%</span>
            </div>
          </div>

          {/* Lifetime Claimed Summary */}
          {currentUser && (
            <div className="flex items-center justify-between text-[11px] text-[#87909c] px-1 font-mono">
              <span>Lifetime Claimed:</span>
              <span className="text-white font-bold">
                {(currentUser.totalRakebackClaimedGC || 0).toLocaleString()} GC & ${(currentUser.totalRakebackClaimedSC || 0).toFixed(2)} SC
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
