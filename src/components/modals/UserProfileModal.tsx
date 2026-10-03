import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Calendar, 
  Crown, 
  LogOut, 
  Users, 
  UserPlus, 
  Trash2, 
  X, 
  Trophy,
  Copy,
  Check,
  Hash,
  Percent
} from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const {
    currentUser,
    vipInfo,
    isProfileModalOpen,
    setIsProfileModalOpen,
    logout,
    allUsers,
    switchAccount,
    deleteAccount,
    openAuthModal,
  } = useAuth();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  if (!isProfileModalOpen || !currentUser) return null;

  const totalBets = currentUser.totalWins + currentUser.totalLosses;
  const winRate = totalBets > 0 ? ((currentUser.totalWins / totalBets) * 100).toFixed(1) : '0.0';
  const isNetProfitPositive = currentUser.totalProfitSC >= 0;

  const joinedDate = new Date(currentUser.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a2c38] border border-[#213743] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-float-up my-auto">
        {/* Header */}
        <div className="bg-[#0f212e] px-6 py-4 border-b border-[#213743] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black text-base shadow-md"
              style={{ backgroundColor: currentUser.avatarColor || '#00e701' }}
            >
              {currentUser.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-white text-lg tracking-tight">{currentUser.username}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser.uid);
                    setCopiedUid(true);
                    setTimeout(() => setCopiedUid(false), 2000);
                  }}
                  className="flex items-center gap-1 bg-[#213743] hover:bg-[#2f4553] text-[#00e701] px-2 py-0.5 rounded text-[11px] font-mono font-bold cursor-pointer transition border border-[#00e701]/20 shadow-sm"
                  title="Click to copy UID"
                >
                  <Hash className="w-3 h-3 text-[#00e701]" />
                  <span>UID: {currentUser.uid}</span>
                  {copiedUid ? <Check className="w-3 h-3 text-[#00e701]" /> : <Copy className="w-3 h-3 text-[#87909c]" />}
                </button>
                {vipInfo && (
                  <span
                    className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border shadow-sm"
                    style={{
                      borderColor: vipInfo.tierColor,
                      color: vipInfo.tierColor,
                      backgroundColor: `${vipInfo.tierColor}15`,
                    }}
                  >
                    {vipInfo.tier}
                  </span>
                )}
              </div>
              <div className="text-xs text-[#87909c] flex items-center gap-2 font-mono">
                <Mail className="w-3 h-3" />
                <span>{currentUser.email}</span>
                <span>•</span>
                <Calendar className="w-3 h-3" />
                <span>Joined {joinedDate}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setIsProfileModalOpen(false);
              setConfirmDelete(false);
            }}
            className="text-[#87909c] hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 select-none text-xs">
          {/* VIP Progress Card */}
          {vipInfo && (
            <div className="bg-[#0f212e] border border-[#213743] rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4" style={{ color: vipInfo.tierColor }} />
                  <span className="font-extrabold text-white text-sm">
                    VIP Club Level: <span style={{ color: vipInfo.tierColor }}>{vipInfo.tier}</span>
                  </span>
                </div>
                <span className="font-mono font-bold text-xs" style={{ color: vipInfo.tierColor }}>
                  {vipInfo.progressPercent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-[#1a2c38] rounded-full overflow-hidden border border-[#213743]">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${vipInfo.progressPercent}%`,
                    backgroundColor: vipInfo.tierColor,
                  }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-[#87909c] font-mono">
                <span>Wagered: ${vipInfo.currentWageredSC.toLocaleString('en-US', { maximumFractionDigits: 0 })} SC eq.</span>
                <span>
                  {vipInfo.nextTierName !== 'Max' 
                    ? `Next Tier (${vipInfo.nextTierName}): $${vipInfo.nextTierThreshold.toLocaleString()} SC`
                    : 'Max Tier Reached!'}
                </span>
              </div>
            </div>
          )}

          {/* Lifetime Account Stats */}
          <div>
            <div className="text-[11px] font-extrabold uppercase text-[#87909c] mb-2 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Lifetime Account Stats (Stored Locally)</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Gold Coins Balance */}
              <div className="bg-[#0f212e] p-3 rounded-xl border border-[#213743]">
                <span className="text-[#87909c] text-[10px] font-extrabold uppercase block">Gold Coins Balance</span>
                <span className="text-white font-mono font-bold text-sm block">
                  {currentUser.gcBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })} <span className="text-amber-400 font-sans text-xs">GC</span>
                </span>
                <span className="text-[10px] text-[#87909c]">Wagered: {currentUser.totalWageredGC.toLocaleString()} GC</span>
              </div>

              {/* Stake Cash Balance */}
              <div className="bg-[#0f212e] p-3 rounded-xl border border-[#213743]">
                <span className="text-[#87909c] text-[10px] font-extrabold uppercase block">Stake Cash Balance</span>
                <span className="text-[#00e701] font-mono font-bold text-sm block">
                  ${currentUser.scBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-white font-sans text-xs">SC</span>
                </span>
                <span className="text-[10px] text-[#87909c]">Wagered: ${currentUser.totalWageredSC.toFixed(2)} SC</span>
              </div>

              {/* Net SC Profit */}
              <div className="bg-[#0f212e] p-3 rounded-xl border border-[#213743]">
                <span className="text-[#87909c] text-[10px] font-extrabold uppercase block">Net SC Profit</span>
                <span className={`font-mono font-bold text-sm block ${isNetProfitPositive ? 'text-[#00e701]' : 'text-red-400'}`}>
                  {isNetProfitPositive ? `+$${currentUser.totalProfitSC.toFixed(2)}` : `-$${Math.abs(currentUser.totalProfitSC).toFixed(2)}`}
                </span>
                <span className="text-[10px] text-[#87909c]">Lifetime SC profit/loss</span>
              </div>

              {/* Win Rate & Total Bets */}
              <div className="bg-[#0f212e] p-3 rounded-xl border border-[#213743]">
                <span className="text-[#87909c] text-[10px] font-extrabold uppercase block">Win Rate</span>
                <span className="text-white font-mono font-bold text-sm block">
                  {winRate}% <span className="text-[#87909c] text-xs font-normal">({currentUser.totalWins}W / {currentUser.totalLosses}L)</span>
                </span>
                <span className="text-[10px] text-[#87909c]">{totalBets} total bets placed</span>
              </div>

              {/* Total Rakeback Claimed */}
              <div className="bg-[#0f212e] p-3 rounded-xl border border-[#213743] col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[#87909c] text-[10px] font-extrabold uppercase block">Lifetime Rakeback Claimed</span>
                  <span className="text-white font-mono font-bold text-sm block">
                    {(currentUser.totalRakebackClaimedGC || 0).toLocaleString()} GC & ${(currentUser.totalRakebackClaimedSC || 0).toFixed(2)} SC
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#00e701]/10 text-[#00e701] px-2.5 py-1 rounded-lg border border-[#00e701]/20 font-mono text-[10px] font-bold">
                  <Percent className="w-3 h-3" />
                  <span>VIP Rebates</span>
                </div>
              </div>
            </div>
          </div>

          {/* Switch or Create Accounts */}
          <div>
            <div className="text-[11px] font-extrabold uppercase text-[#87909c] mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#00e701]" />
                <span>Switch Local Account ({allUsers.length})</span>
              </span>
              <button
                onClick={() => {
                  setIsProfileModalOpen(false);
                  openAuthModal('register', 'Create a new local account');
                }}
                className="text-[#00e701] hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <UserPlus className="w-3 h-3" />
                <span>Add Account</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {allUsers.map(user => {
                const isCurrent = user.id === currentUser.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      if (!isCurrent) switchAccount(user.id);
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg border transition ${
                      isCurrent
                        ? 'bg-[#0f212e] border-[#00e701]/40'
                        : 'bg-[#0f212e]/60 hover:bg-[#0f212e] border-[#213743] cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-black text-[9px]"
                        style={{ backgroundColor: user.avatarColor || '#00e701' }}
                      >
                        {user.username.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{user.username}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-[#00e701]/20 text-[#00e701] px-1.5 py-0.2 rounded font-extrabold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#87909c] font-mono leading-none">UID: {user.uid}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-[#87909c]">{user.gcBalance.toLocaleString()} GC</span>
                      <span className="text-[#00e701] font-bold">${user.scBalance.toFixed(2)} SC</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons: Sign Out & Delete */}
          <div className="pt-2 border-t border-[#213743] flex items-center justify-between gap-3">
            <button
              onClick={logout}
              className="flex-1 bg-[#0f212e] hover:bg-[#2f4553] text-[#b1bad2] hover:text-white border border-[#213743] py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Log Out</span>
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-red-400/80 hover:text-red-400 hover:bg-red-500/10 px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Delete this local account"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => deleteAccount(currentUser.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[#87909c] hover:text-white text-xs px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
