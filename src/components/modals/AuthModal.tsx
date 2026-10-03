import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AVATAR_COLORS } from '../../utils/userStorage';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  HardDrive, 
  CheckCircle, 
  AlertCircle,
  LogIn, 
  UserPlus, 
  X,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    authPromptReason,
    closeAuthModal,
    setAuthModalMode,
    register,
    login,
    allUsers,
    switchAccount,
  } = useAuth();

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Clear inputs when mode changes or modal opens
  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
    if (!isAuthModalOpen) {
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    const res = register(username, email, password, selectedColor);
    if (!res.success) {
      setError(res.error || 'Failed to create account.');
      return;
    }

    setSuccessMsg('Account created successfully! Welcome to Stake.us Remake.');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = login(username, password);
    if (!res.success) {
      setError(res.error || 'Failed to sign in.');
      return;
    }

    setSuccessMsg('Signed in successfully!');
  };

  const isRegister = authModalMode === 'register';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a2c38] border border-[#213743] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-float-up my-auto">
        {/* Header Tabs */}
        <div className="bg-[#0f212e] border-b border-[#213743] flex items-center justify-between px-4 pt-3">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setAuthModalMode('register');
                setError(null);
              }}
              className={`flex items-center gap-2 pb-3 px-3 font-extrabold text-sm transition-all border-b-2 cursor-pointer ${
                isRegister
                  ? 'text-[#00e701] border-[#00e701]'
                  : 'text-[#87909c] border-transparent hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
            <button
              onClick={() => {
                setAuthModalMode('login');
                setError(null);
              }}
              className={`flex items-center gap-2 pb-3 px-3 font-extrabold text-sm transition-all border-b-2 cursor-pointer ${
                !isRegister
                  ? 'text-[#00e701] border-[#00e701]'
                  : 'text-[#87909c] border-transparent hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </div>

          <button
            onClick={closeAuthModal}
            className="text-[#87909c] hover:text-white p-1 rounded-lg transition pb-3 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason Banner if triggered by game action */}
        {authPromptReason && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 flex items-center gap-2.5 text-xs text-amber-300 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{authPromptReason}</span>
          </div>
        )}

        {/* Starter Bonus Banner */}
        {isRegister && (
          <div className="bg-gradient-to-r from-[#00e701]/15 to-[#00b4d8]/15 border-b border-[#00e701]/20 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#00e701]/20 border border-[#00e701]/40 flex items-center justify-center text-[#00e701]">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-white text-xs font-black tracking-wide flex items-center gap-1.5">
                  FREE WELCOME PACKAGE
                  <span className="bg-[#00e701] text-black text-[9px] px-1.5 py-0.2 rounded font-extrabold">INSTANT</span>
                </div>
                <div className="text-[#00e701] text-[11px] font-mono font-bold">
                  1,000 GC + $250.00 SC
                </div>
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-[#00e701]/60" />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-400 font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="bg-[#00e701]/10 border border-[#00e701]/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#00e701] font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={isRegister ? handleRegisterSubmit : handleLoginSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-[#87909c] mb-1.5">
                Username
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#87909c]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={isRegister ? "e.g. HighRoller99" : "Enter username, email, or UID"}
                  className="w-full bg-[#0f212e] border border-[#213743] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#87909c] font-semibold outline-none focus:border-[#00e701] transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Email (Only on Register) */}
            {isRegister && (
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#87909c] mb-1.5 flex items-center justify-between">
                  <span>Email (Local Display)</span>
                  <span className="text-[10px] text-[#87909c] lowercase font-normal">optional</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-[#87909c]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="player@stake.local"
                    className="w-full bg-[#0f212e] border border-[#213743] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#87909c] font-semibold outline-none focus:border-[#00e701] transition"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-[#87909c] mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#87909c]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 4 characters"
                  className="w-full bg-[#0f212e] border border-[#213743] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-[#87909c] font-semibold outline-none focus:border-[#00e701] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#87909c] hover:text-white cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Only on Register) */}
            {isRegister && (
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#87909c] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-[#87909c]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-[#0f212e] border border-[#213743] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#87909c] font-semibold outline-none focus:border-[#00e701] transition"
                  />
                </div>
              </div>
            )}

            {/* Avatar Color Picker (Only on Register) */}
            {isRegister && (
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#87909c] mb-1.5">
                  Choose Avatar Accent
                </label>
                <div className="flex items-center gap-2.5">
                  {AVATAR_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer shadow-sm ${
                        selectedColor === color ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100 hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#00e701] hover:bg-[#1fff20] text-black font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-[#00e701]/20 cursor-pointer active:scale-[0.99] mt-2"
            >
              <span>{isRegister ? 'Create Account & Play' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Switch Existing Local Accounts (on Login mode) */}
          {!isRegister && allUsers.length > 0 && (
            <div className="pt-2 border-t border-[#213743]">
              <div className="text-[11px] font-extrabold text-[#87909c] uppercase mb-2">
                Accounts Saved on this Browser ({allUsers.length})
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {allUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setUsername(user.username);
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#0f212e] hover:bg-[#213743] border border-[#213743] cursor-pointer transition text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-black text-[10px]"
                        style={{ backgroundColor: user.avatarColor || '#00e701' }}
                      >
                        {user.username.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-white leading-tight">{user.username}</span>
                        <span className="text-[10px] text-[#87909c] font-mono leading-tight">UID: {user.uid}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#00e701] font-bold">
                        {user.gcBalance.toLocaleString()} GC
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          switchAccount(user.id);
                        }}
                        className="bg-[#2f4553] hover:bg-[#00e701] hover:text-black text-white text-[10px] font-bold px-2 py-0.5 rounded transition"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Local Storage Privacy Notice */}
          <div className="pt-2 flex items-start gap-2 text-[11px] text-[#87909c] leading-relaxed">
            <HardDrive className="w-4 h-4 shrink-0 text-[#00e701] mt-0.5" />
            <span>
              <strong>Zero Database Hassle:</strong> Stored 100% locally on your browser using localStorage with cryptographic SHA-256 password protection. No remote servers or tracking.
            </span>
          </div>

          {/* Toggle between Register and Login */}
          <div className="text-center pt-2 text-xs text-[#87909c]">
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setError(null);
                  }}
                  className="text-[#00e701] hover:underline font-bold cursor-pointer"
                >
                  Sign In here
                </button>
              </span>
            ) : (
              <span>
                New to Stake?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('register');
                    setError(null);
                  }}
                  className="text-[#00e701] hover:underline font-bold cursor-pointer"
                >
                  Create an Account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
