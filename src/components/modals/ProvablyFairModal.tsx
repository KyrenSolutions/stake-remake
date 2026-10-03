import React from 'react';
import { useGame } from '../../context/GameContext';
import { ShieldCheck, RotateCw } from 'lucide-react';

export const ProvablyFairModal: React.FC = () => {
  const { 
    provablyFair, 
    rotateSeeds, 
    isProvablyFairModalOpen, 
    setProvablyFairModalOpen 
  } = useGame();

  if (!isProvablyFairModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a2c38] border border-[#213743] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-float-up">
        {/* Header */}
        <div className="bg-[#0f212e] px-6 py-4 border-b border-[#213743] flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <ShieldCheck className="w-6 h-6 text-[#00e701]" />
            <span>Provably Fair Verification</span>
          </div>
          <button
            onClick={() => setProvablyFairModalOpen(false)}
            className="text-[#87909c] hover:text-white font-bold"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs font-semibold">
          <p className="text-[#b1bad2] leading-relaxed">
            Stake uses cryptographic SHA-256 seed hashing to verify that every bet outcome is 100% deterministic and cannot be manipulated by the house.
          </p>

          {/* Active Server Seed Hash */}
          <div>
            <label className="text-[#87909c] block mb-1 uppercase font-bold">Active Server Seed (Hashed)</label>
            <div className="flex items-center bg-[#0f212e] border border-[#213743] rounded p-2 text-white font-mono text-[11px] break-all">
              {provablyFair.serverSeedHash}
            </div>
          </div>

          {/* Active Client Seed */}
          <div>
            <label className="text-[#87909c] block mb-1 uppercase font-bold">Client Seed</label>
            <div className="flex items-center bg-[#0f212e] border border-[#213743] rounded p-2 text-white font-mono">
              {provablyFair.clientSeed}
            </div>
          </div>

          {/* Nonce */}
          <div>
            <label className="text-[#87909c] block mb-1 uppercase font-bold">Nonce (Bet Count)</label>
            <div className="flex items-center bg-[#0f212e] border border-[#213743] rounded p-2 text-[#00e701] font-mono font-bold">
              {provablyFair.nonce}
            </div>
          </div>

          {/* Unhashed Active Server Seed */}
          <div>
            <label className="text-[#87909c] block mb-1 uppercase font-bold">Unrevealed Active Server Seed</label>
            <div className="flex items-center bg-[#0f212e] border border-[#213743] rounded p-2 text-[#87909c] font-mono text-[11px]">
              Hidden until seed rotation
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={rotateSeeds}
              className="w-full bg-[#00e701] text-black font-bold py-2.5 rounded flex items-center justify-center gap-2 hover:bg-[#1fff20] transition"
            >
              <RotateCw className="w-4 h-4" />
              <span>Rotate Pair & Generate New Pair</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
