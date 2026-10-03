import React, { useState } from 'react';
import { useOwner } from '../../context/OwnerContext';
import { ShieldAlert, KeyRound, X } from 'lucide-react';

export const OwnerPinModal: React.FC = () => {
  const { isPinModalOpen, closePinModal, unlockWithPin } = useOwner();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isPinModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = unlockWithPin(pin);
    if (!res.success) {
      setError(res.error || 'Incorrect PIN');
      setPin('');
    }
  };

  const handleKeypadPress = (val: string) => {
    if (pin.length < 6) {
      const next = pin + val;
      setPin(next);
      if (next.length === 6) {
        const res = unlockWithPin(next);
        if (!res.success) {
          setError(res.error || 'Incorrect PIN');
          setPin('');
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a2c38] border border-amber-500/40 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-float-up">
        {/* Header */}
        <div className="bg-[#0f212e] px-5 py-4 border-b border-[#213743] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm tracking-tight leading-none flex items-center gap-1.5">
                Owner Access Verification
              </h3>
              <span className="text-[10px] text-[#87909c] font-mono">Restricted Developer Console</span>
            </div>
          </div>

          <button
            onClick={closePinModal}
            className="text-[#87909c] hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 select-none text-center">
          <div className="space-y-1">
            <p className="text-xs text-[#b1bad2] font-semibold">
              Enter Owner Passcode to unlock Developer Tools & Cheat Sheet
            </p>
          </div>

          {/* PIN Digits Display */}
          <div className="flex justify-center items-center gap-2.5">
            {[0, 1, 2, 3, 4, 5].map(idx => {
              const char = pin[idx];
              return (
                <div
                  key={idx}
                  className={`w-10 h-12 rounded-xl border flex items-center justify-center font-mono font-black text-lg transition-all ${
                    char 
                      ? 'border-[#00e701] text-[#00e701] bg-[#00e701]/10 shadow-sm shadow-[#00e701]/20 scale-105' 
                      : 'border-[#213743] bg-[#0f212e] text-[#87909c]'
                  }`}
                >
                  {char ? '•' : ''}
                </div>
              );
            })}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/30 rounded-lg py-2 px-3 animate-shake">
              {error}
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1 max-w-[240px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                className="h-11 bg-[#0f212e] hover:bg-[#213743] active:scale-95 border border-[#213743] rounded-xl text-white font-mono font-black text-base transition cursor-pointer shadow-sm"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="h-11 bg-[#0f212e] hover:bg-red-500/20 text-[#87909c] hover:text-red-400 border border-[#213743] rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="h-11 bg-[#0f212e] hover:bg-[#213743] active:scale-95 border border-[#213743] rounded-xl text-white font-mono font-black text-base transition cursor-pointer shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 bg-[#0f212e] hover:bg-[#213743] text-[#87909c] hover:text-white border border-[#213743] rounded-xl font-bold text-xs transition cursor-pointer"
            >
              ⌫
            </button>
          </div>

          {/* Direct Input fallback */}
          <form onSubmit={handleSubmit} className="pt-1">
            <button
              type="submit"
              disabled={pin.length === 0}
              className="w-full bg-[#00e701] hover:bg-[#1fff20] disabled:bg-[#213743] disabled:text-[#87909c] text-black font-black py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Verify & Unlock</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
