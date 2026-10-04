import React, { useState } from 'react';
import { useOwner } from '../../context/OwnerContext';
import { useGame, type GameId, type BetHistoryItem } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { 
  type VipTier, 
  findUserByQuery, 
  exportUsersJson, 
  importUsersJson, 
  wipeAllUsers 
} from '../../utils/userStorage';
import { sound } from '../../utils/soundEngine';
import { 
  Crown, 
  Lock, 
  X, 
  Check, 
  RotateCw, 
  ShieldCheck, 
  Award, 
  Coins, 
  Eye, 
  EyeOff, 
  Zap, 
  Users, 
  Radio, 
  Tv, 
  Search, 
  Download, 
  Upload, 
  Trash2, 
  Send, 
  Sparkles, 
  Plus, 
  AlertTriangle,
  Flame,
  ArrowRight
} from 'lucide-react';

type TabId = 'rigging' | 'grants' | 'database' | 'broadcast' | 'streamer';

export const OwnerPanelModal: React.FC = () => {
  const {
    isOwnerModalOpen,
    closeOwnerModal,
    lockOwnerMode,
    isCheatSheetOpen,
    toggleCheatSheet,
    riggedOutcomes,
    setRiggedOutcome,
    resetAllRigging,
    streamerSettings,
    setStreamerSettings,
    triggerCoinRain,
    grantMoneyToTarget,
    setTargetExactBalance,
    setTargetVip,
    injectCoins,
    setExactBalances,
    setVipRank,
    boostRakeback,
  } = useOwner();

  const {
    godMode,
    setGodMode,
    provablyFair,
    rotateSeeds,
    gcBalance,
    scBalance,
    broadcastFeedBet,
    addChatMessage,
    chatBotsEnabled,
    setChatBotsEnabled,
    sessionStats,
    modifySessionStats,
  } = useGame();

  const { currentUser, allUsers, refreshUsers, switchAccount, deleteAccount } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('grants');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Grants Tab State
  const [grantTargetMode, setGrantTargetMode] = useState<'self' | 'other'>('self');
  const [targetQuery, setTargetQuery] = useState<string>('');
  const [customGcInput, setCustomGcInput] = useState<string>('100000');
  const [customScInput, setCustomScInput] = useState<string>('500');
  const [exactGcInput, setExactGcInput] = useState<string>(gcBalance.toString());
  const [exactScInput, setExactScInput] = useState<string>(scBalance.toString());

  // Database Tab State
  const [dbSearch, setDbSearch] = useState<string>('');
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [showImportBox, setShowImportBox] = useState<boolean>(false);
  const [copiedBackup, setCopiedBackup] = useState<boolean>(false);

  // Broadcast Tab State
  const [broadcastText, setBroadcastText] = useState<string>('');
  const [broadcastRole, setBroadcastRole] = useState<'admin' | 'system'>('admin');
  const [spooferUser, setSpooferUser] = useState<string>('HighRollerWhale');
  const [spooferGame, setSpooferGame] = useState<GameId>('plinko');
  const [spooferAmount, setSpooferAmount] = useState<string>('1000');
  const [spooferMult, setSpooferMult] = useState<string>('1000');
  const [spooferCurrency, setSpooferCurrency] = useState<'GC' | 'SC'>('SC');

  // Streamer Mode State
  const [fakeGcInput, setFakeGcInput] = useState<string>(
    streamerSettings.fakeDisplayBalanceGC?.toString() || '10000000'
  );
  const [fakeScInput, setFakeScInput] = useState<string>(
    streamerSettings.fakeDisplayBalanceSC?.toString() || '250000'
  );

  // Provably Fair copy state
  const [copiedSeed, setCopiedSeed] = useState(false);

  if (!isOwnerModalOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const vipTiers: VipTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

  // Resolve target account for money grants
  const targetUser = grantTargetMode === 'self' 
    ? currentUser 
    : (targetQuery.trim() ? findUserByQuery(targetQuery) : null);

  const activeRiggedCount = [
    riggedOutcomes.crashMultiplier !== null,
    riggedOutcomes.minesBombDefusal,
    riggedOutcomes.rouletteNumber !== null,
    riggedOutcomes.blackjackForce21,
    riggedOutcomes.blackjackDealerBust,
    riggedOutcomes.slotsForceJackpot,
    riggedOutcomes.plinkoEdgeMagnet,
    riggedOutcomes.diceGuaranteedWin,
  ].filter(Boolean).length;

  // Handle Grants
  const handleGrantFunds = (gc: number, sc: number) => {
    if (grantTargetMode === 'self') {
      injectCoins(gc, sc);
      showToast(`Granted +${gc.toLocaleString()} GC & +$${sc.toFixed(2)} SC to active user!`);
    } else {
      if (!targetQuery.trim()) {
        showToast('Please enter a target Username or UID first.');
        return;
      }
      const res = grantMoneyToTarget(targetQuery, gc, sc);
      if (res.success && res.user) {
        showToast(`Granted +${gc.toLocaleString()} GC & +$${sc.toFixed(2)} SC to ${res.user.username} (UID: ${res.user.uid})!`);
      } else {
        showToast(res.error || 'Failed to grant funds.');
      }
    }
  };

  const handleSetExact = (e: React.FormEvent) => {
    e.preventDefault();
    const gc = Math.max(0, parseFloat(exactGcInput) || 0);
    const sc = Math.max(0, parseFloat(exactScInput) || 0);

    if (grantTargetMode === 'self') {
      setExactBalances(gc, sc);
      showToast(`Active balance set to ${gc.toLocaleString()} GC & $${sc.toFixed(2)} SC!`);
    } else {
      if (!targetQuery.trim()) {
        showToast('Please enter a target Username or UID first.');
        return;
      }
      const res = setTargetExactBalance(targetQuery, gc, sc);
      if (res.success && res.user) {
        showToast(`Set ${res.user.username}'s balance to ${gc.toLocaleString()} GC & $${sc.toFixed(2)} SC!`);
      } else {
        showToast(res.error || 'Failed to set exact balance.');
      }
    }
  };

  const handleSetVip = (tier: VipTier) => {
    if (grantTargetMode === 'self') {
      setVipRank(tier);
      showToast(`Active account promoted to VIP ${tier}!`);
    } else {
      if (!targetQuery.trim()) {
        showToast('Please enter a target Username or UID first.');
        return;
      }
      const res = setTargetVip(targetQuery, tier);
      if (res.success && res.user) {
        showToast(`Promoted ${res.user.username} (UID: ${res.user.uid}) to VIP ${tier}!`);
      } else {
        showToast(res.error || 'Failed to set VIP tier.');
      }
    }
  };

  // Handle Live Broadcast Send
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    addChatMessage({
      id: `msg_admin_${Date.now()}`,
      user: broadcastRole === 'admin' ? 'Owner / Admin' : 'Stake System',
      text: broadcastText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAdmin: broadcastRole === 'admin',
      isSystem: broadcastRole === 'system',
    });

    setBroadcastText('');
    showToast(`Broadcasted ${broadcastRole.toUpperCase()} message to Live Chat!`);
  };

  // Handle Spoofer Feed
  const handleSpoofBet = (e: React.FormEvent) => {
    e.preventDefault();
    const bet = parseFloat(spooferAmount) || 100;
    const mult = parseFloat(spooferMult) || 2;
    const payout = parseFloat((bet * mult).toFixed(2));

    const fakeBet: BetHistoryItem = {
      id: `spoof_${Date.now()}`,
      user: spooferUser.trim() || 'AnonymousWhale',
      game: spooferGame.toUpperCase(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      betAmount: bet,
      multiplier: mult,
      payout,
      currency: spooferCurrency,
    };

    broadcastFeedBet(fakeBet);
    showToast(`Spoofed high-roller bet for ${fakeBet.user} (${mult}x payout: ${payout.toLocaleString()} ${spooferCurrency})!`);
  };

  // Filtered users for Database table
  const filteredUsers = allUsers.filter(u => {
    const q = dbSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#1a2c38] border border-amber-500/40 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-float-up my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0f212e] px-4 sm:px-6 py-3.5 border-b border-[#213743] flex items-center justify-between shrink-0">
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
                {activeRiggedCount > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    <span>{activeRiggedCount} Rigged</span>
                  </span>
                )}
              </div>
              <span className="text-xs text-[#87909c]">Multi-target money grants, game rigging, and live platform controls</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={lockOwnerMode}
              className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Lock and hide developer console"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Mode</span>
            </button>
            <button
              onClick={closeOwnerModal}
              className="text-[#87909c] hover:text-white p-1.5 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="bg-[#12232f] border-b border-[#213743] px-3 sm:px-6 flex items-center gap-1 overflow-x-auto shrink-0 select-none">
          <button
            onClick={() => setActiveTab('grants')}
            className={`px-3.5 py-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'grants'
                ? 'border-[#00e701] text-white bg-[#1a2c38]'
                : 'border-transparent text-[#87909c] hover:text-white hover:bg-[#1a2c38]/40'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Money & Grants</span>
          </button>

          <button
            onClick={() => setActiveTab('rigging')}
            className={`px-3.5 py-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'rigging'
                ? 'border-[#00e701] text-white bg-[#1a2c38]'
                : 'border-transparent text-[#87909c] hover:text-white hover:bg-[#1a2c38]/40'
            }`}
          >
            <Zap className="w-4 h-4 text-[#00e701]" />
            <span>Game Rigging</span>
            {activeRiggedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-black flex items-center justify-center">
                {activeRiggedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-3.5 py-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'database'
                ? 'border-[#00e701] text-white bg-[#1a2c38]'
                : 'border-transparent text-[#87909c] hover:text-white hover:bg-[#1a2c38]/40'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Database ({allUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3.5 py-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'broadcast'
                ? 'border-[#00e701] text-white bg-[#1a2c38]'
                : 'border-transparent text-[#87909c] hover:text-white hover:bg-[#1a2c38]/40'
            }`}
          >
            <Radio className="w-4 h-4 text-purple-400" />
            <span>Broadcast & Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('streamer')}
            className={`px-3.5 py-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'streamer'
                ? 'border-[#00e701] text-white bg-[#1a2c38]'
                : 'border-transparent text-[#87909c] hover:text-white hover:bg-[#1a2c38]/40'
            }`}
          >
            <Tv className="w-4 h-4 text-pink-400" />
            <span>Streamer & FX</span>
          </button>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="bg-[#00e701]/15 border-b border-[#00e701]/30 px-6 py-2 text-xs text-[#00e701] font-bold flex items-center gap-2 animate-float-up shrink-0">
            <Check className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Scrollable Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs select-none flex-1">
          {/* ======================================================== */}
          {/* TAB 1: MONEY & GRANTS (Target Self or Any User by UID)    */}
          {/* ======================================================== */}
          {activeTab === 'grants' && (
            <div className="space-y-5">
              {/* Target Selector Bar */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase text-[#87909c] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Select Recipient Account</span>
                  </span>
                  <div className="flex gap-1 bg-[#1a2c38] p-1 rounded-lg border border-[#213743]">
                    <button
                      type="button"
                      onClick={() => setGrantTargetMode('self')}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        grantTargetMode === 'self'
                          ? 'bg-[#00e701] text-black font-extrabold shadow'
                          : 'text-[#87909c] hover:text-white'
                      }`}
                    >
                      Myself (Active)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrantTargetMode('other')}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        grantTargetMode === 'other'
                          ? 'bg-[#00e701] text-black font-extrabold shadow'
                          : 'text-[#87909c] hover:text-white'
                      }`}
                    >
                      Other Player (by Username or UID)
                    </button>
                  </div>
                </div>

                {grantTargetMode === 'other' && (
                  <div className="pt-2 border-t border-[#213743] flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-[#87909c] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={targetQuery}
                        onChange={e => setTargetQuery(e.target.value)}
                        placeholder="Enter Username or UID (e.g. 805621, testuser)..."
                        className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg pl-9 pr-3 py-2 text-white font-mono font-bold outline-none focus:border-[#00e701]"
                      />
                    </div>
                  </div>
                )}

                {/* Target User Info Card */}
                {targetUser ? (
                  <div className="bg-[#1a2c38] p-3 rounded-lg border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shadow"
                        style={{ backgroundColor: targetUser.avatarColor || '#1475e1' }}
                      >
                        {targetUser.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm">{targetUser.username}</span>
                          <span className="text-[10px] font-mono font-bold bg-[#0f212e] text-amber-400 px-2 py-0.5 rounded border border-[#213743]">
                            UID: {targetUser.uid}
                          </span>
                          {targetUser.id === currentUser?.id && (
                            <span className="text-[9px] font-bold bg-[#00e701]/15 text-[#00e701] px-1.5 py-0.5 rounded">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#87909c]">Email: {targetUser.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono font-bold">
                      <div>
                        <span className="text-[10px] uppercase text-[#87909c] block">GC Balance</span>
                        <span className="text-amber-400">{targetUser.gcBalance.toLocaleString()} GC</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#87909c] block">SC Balance</span>
                        <span className="text-[#00e701]">${targetUser.scBalance.toFixed(2)} SC</span>
                      </div>
                    </div>
                  </div>
                ) : grantTargetMode === 'other' && targetQuery.trim() ? (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>No player found with Username or UID "{targetQuery}". Check the Database tab to view all users.</span>
                  </div>
                ) : null}
              </div>

              {/* Instant Injections */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-[#87909c] block">
                  Instant Fund Grants {targetUser ? `to ${targetUser.username}` : ''}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleGrantFunds(0, 1000)}
                    className="bg-[#1a2c38] hover:bg-[#2f4553] text-[#00e701] border border-[#213743] py-2.5 rounded-lg font-mono font-bold transition cursor-pointer text-xs"
                  >
                    +$1,000 SC
                  </button>
                  <button
                    onClick={() => handleGrantFunds(0, 10000)}
                    className="bg-[#1a2c38] hover:bg-[#2f4553] text-[#00e701] border border-[#213743] py-2.5 rounded-lg font-mono font-bold transition cursor-pointer text-xs"
                  >
                    +$10,000 SC
                  </button>
                  <button
                    onClick={() => handleGrantFunds(1000000, 0)}
                    className="bg-[#1a2c38] hover:bg-[#2f4553] text-amber-400 border border-[#213743] py-2.5 rounded-lg font-mono font-bold transition cursor-pointer text-xs"
                  >
                    +1,000,000 GC
                  </button>
                  <button
                    onClick={() => {
                      if (grantTargetMode === 'self') {
                        boostRakeback(50000, 500);
                        showToast('Boosted active user unclaimed rakeback by +$500 SC!');
                      } else {
                        handleGrantFunds(50000, 500);
                      }
                    }}
                    className="bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 py-2.5 rounded-lg font-mono font-bold transition cursor-pointer text-xs"
                  >
                    +$500 Rakeback
                  </button>
                </div>
              </div>

              {/* Custom Delta Grant Form */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-[#87909c] block">
                  Custom Delta Grant (+/- Any Amount)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-[#87909c] block mb-1">GC Delta</label>
                    <input
                      type="number"
                      value={customGcInput}
                      onChange={e => setCustomGcInput(e.target.value)}
                      className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg px-3 py-2 text-white font-mono font-bold outline-none focus:border-[#00e701]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-[#87909c] block mb-1">SC Delta ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={customScInput}
                      onChange={e => setCustomScInput(e.target.value)}
                      className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg px-3 py-2 text-white font-mono font-bold outline-none focus:border-[#00e701]"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const gc = parseFloat(customGcInput) || 0;
                      const sc = parseFloat(customScInput) || 0;
                      handleGrantFunds(gc, sc);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-2 px-4 rounded-lg transition cursor-pointer h-9 text-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Apply Grant</span>
                  </button>
                </div>
              </div>

              {/* Exact Balance Form */}
              <form onSubmit={handleSetExact} className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-[#87909c] block">
                  Set Exact Balance (Overwrite Total)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-[#87909c] block mb-1">Exact GC Balance</label>
                    <input
                      type="number"
                      value={exactGcInput}
                      onChange={e => setExactGcInput(e.target.value)}
                      className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg px-3 py-2 text-white font-mono font-bold outline-none focus:border-[#00e701]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-[#87909c] block mb-1">Exact SC Balance ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={exactScInput}
                      onChange={e => setExactScInput(e.target.value)}
                      className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg px-3 py-2 text-white font-mono font-bold outline-none focus:border-[#00e701]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#00e701] hover:bg-[#1fff20] text-black font-extrabold py-2 px-4 rounded-lg transition cursor-pointer h-9 text-xs"
                  >
                    Set Balances
                  </button>
                </div>
              </form>

              {/* VIP Tier Override */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-[#87909c] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    <span>Instant VIP Promotion {targetUser ? `for ${targetUser.username}` : ''}</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {vipTiers.map(tier => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => handleSetVip(tier)}
                      className="bg-[#1a2c38] hover:bg-[#213743] border border-[#213743] p-2.5 rounded-xl text-center transition cursor-pointer text-[#b1bad2] hover:text-white"
                    >
                      <span className="block text-xs uppercase font-extrabold">{tier}</span>
                      <span className="text-[9px] text-[#87909c] block mt-0.5">
                        {tier === 'Diamond' ? '15% Rakeback' : tier === 'Platinum' ? '12.5%' : tier === 'Gold' ? '10%' : tier === 'Silver' ? '7.5%' : '5%'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: GAME RIGGING SUITE (Outcome Controls)             */}
          {/* ======================================================== */}
          {activeTab === 'rigging' && (
            <div className="space-y-4">
              {/* Master Status & Reset */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-extrabold text-white text-sm block">Platform Outcome Rigging Suite</span>
                  <span className="text-[11px] text-[#87909c]">
                    Overrides provably fair outputs on the next client actions
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {activeRiggedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        resetAllRigging();
                        showToast('Reset all rigged outcomes to fair baseline.');
                      }}
                      className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Disable All Rigging
                    </button>
                  )}
                </div>
              </div>

              {/* Game Rigging Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Crash Rigging */}
                <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white text-sm block">Crash Multiplier Override</span>
                      <span className="text-[11px] text-[#87909c]">Force rocket flight to reach exact multiplier</span>
                    </div>
                    {riggedOutcomes.crashMultiplier ? (
                      <span className="font-mono text-xs font-black text-[#00e701] bg-[#00e701]/10 px-2 py-0.5 rounded border border-[#00e701]/30">
                        {riggedOutcomes.crashMultiplier}x
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#87909c]">NATURAL</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[2.0, 5.0, 10.0, 50.0, 100.0, 1000.0].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setRiggedOutcome('crashMultiplier', m);
                          showToast(`Crash multiplier locked to ${m}x!`);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                          riggedOutcomes.crashMultiplier === m
                            ? 'bg-[#00e701] text-black'
                            : 'bg-[#1a2c38] text-[#b1bad2] hover:text-white'
                        }`}
                      >
                        {m}x
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setRiggedOutcome('crashMultiplier', null);
                        showToast('Crash multiplier restored to natural provably fair.');
                      }}
                      className="px-2.5 py-1 rounded text-xs font-bold text-red-400 bg-[#1a2c38] hover:bg-red-500/20 transition cursor-pointer"
                    >
                      CLEAR
                    </button>
                  </div>
                </div>

                {/* 2. Mines Bomb Defusal */}
                <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white text-sm block">Mines Bomb Defusal</span>
                      <span className="text-[11px] text-[#87909c]">Clicking a bomb converts it into a safe gem</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRiggedOutcome('minesBombDefusal', !riggedOutcomes.minesBombDefusal);
                        showToast(`Mines Bomb Defusal ${!riggedOutcomes.minesBombDefusal ? 'ENGAGED' : 'OFF'}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                        riggedOutcomes.minesBombDefusal
                          ? 'bg-[#00e701] text-black shadow'
                          : 'bg-[#1a2c38] text-[#87909c] hover:text-white'
                      }`}
                    >
                      {riggedOutcomes.minesBombDefusal ? 'DEFUSER ACTIVE' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* 3. Roulette Number Picker */}
                <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white text-sm block">Roulette Target Number</span>
                      <span className="text-[11px] text-[#87909c]">Forces wheel to land on chosen number</span>
                    </div>
                    {riggedOutcomes.rouletteNumber !== null ? (
                      <span className="font-mono text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                        #{riggedOutcomes.rouletteNumber}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#87909c]">NATURAL</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[0, 7, 14, 17, 21, 32].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setRiggedOutcome('rouletteNumber', n);
                          showToast(`Roulette locked to number ${n}!`);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                          riggedOutcomes.rouletteNumber === n
                            ? 'bg-amber-400 text-black'
                            : 'bg-[#1a2c38] text-[#b1bad2] hover:text-white'
                        }`}
                      >
                        #{n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setRiggedOutcome('rouletteNumber', null);
                        showToast('Roulette number restored to natural spin.');
                      }}
                      className="px-2.5 py-1 rounded text-xs font-bold text-red-400 bg-[#1a2c38] hover:bg-red-500/20 transition cursor-pointer"
                    >
                      CLEAR
                    </button>
                  </div>
                </div>

                {/* 4. Blackjack Rigging */}
                <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white text-sm block">Blackjack Controls</span>
                      <span className="text-[11px] text-[#87909c]">Deal natural 21s or force dealer busts</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRiggedOutcome('blackjackForce21', !riggedOutcomes.blackjackForce21);
                        showToast(`Force Natural 21 ${!riggedOutcomes.blackjackForce21 ? 'ENGAGED' : 'OFF'}`);
                      }}
                      className={`p-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        riggedOutcomes.blackjackForce21
                          ? 'bg-[#00e701]/15 border-[#00e701] text-[#00e701]'
                          : 'bg-[#1a2c38] border-[#213743] text-[#87909c] hover:text-white'
                      }`}
                    >
                      Force Natural 21
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRiggedOutcome('blackjackDealerBust', !riggedOutcomes.blackjackDealerBust);
                        showToast(`Force Dealer Bust ${!riggedOutcomes.blackjackDealerBust ? 'ENGAGED' : 'OFF'}`);
                      }}
                      className={`p-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        riggedOutcomes.blackjackDealerBust
                          ? 'bg-amber-400/15 border-amber-400 text-amber-400'
                          : 'bg-[#1a2c38] border-[#213743] text-[#87909c] hover:text-white'
                      }`}
                    >
                      Force Dealer Bust
                    </button>
                  </div>
                </div>

                {/* 5. Slots Jackpot Rigging */}
                <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white text-sm block">Slots 777 Jackpot</span>
                      <span className="text-[11px] text-[#87909c]">Forces all 5 reels to align 7️⃣7️⃣7️⃣7️⃣7️⃣</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRiggedOutcome('slotsForceJackpot', !riggedOutcomes.slotsForceJackpot);
                        showToast(`Slots 777 Jackpot ${!riggedOutcomes.slotsForceJackpot ? 'ENGAGED' : 'OFF'}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                        riggedOutcomes.slotsForceJackpot
                          ? 'bg-amber-400 text-black shadow'
                          : 'bg-[#1a2c38] text-[#87909c] hover:text-white'
                      }`}
                    >
                      {riggedOutcomes.slotsForceJackpot ? '777 LOCKED' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* 6. Plinko Edge Magnet */}
                <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white text-sm block">Plinko 1,000x Magnet</span>
                      <span className="text-[11px] text-[#87909c]">Steers balls straight into outer max edge bin</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRiggedOutcome('plinkoEdgeMagnet', !riggedOutcomes.plinkoEdgeMagnet);
                        showToast(`Plinko Edge Magnet ${!riggedOutcomes.plinkoEdgeMagnet ? 'ENGAGED' : 'OFF'}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                        riggedOutcomes.plinkoEdgeMagnet
                          ? 'bg-[#00e701] text-black shadow'
                          : 'bg-[#1a2c38] text-[#87909c] hover:text-white'
                      }`}
                    >
                      {riggedOutcomes.plinkoEdgeMagnet ? '1,000x MAGNET' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* 7. Dice Guaranteed Win */}
                <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white text-sm block">Dice Guaranteed Win</span>
                      <span className="text-[11px] text-[#87909c]">Forces roll inside target condition regardless of edge</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRiggedOutcome('diceGuaranteedWin', !riggedOutcomes.diceGuaranteedWin);
                        showToast(`Dice Guaranteed Win ${!riggedOutcomes.diceGuaranteedWin ? 'ENGAGED' : 'OFF'}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                        riggedOutcomes.diceGuaranteedWin
                          ? 'bg-[#00e701] text-black shadow'
                          : 'bg-[#1a2c38] text-[#87909c] hover:text-white'
                      }`}
                    >
                      {riggedOutcomes.diceGuaranteedWin ? 'AUTO-WIN' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* 8. In-Game Vision & Cheat Sheet Sidebar */}
                <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white text-sm block">Tile Vision (God Mode)</span>
                      <span className="text-[11px] text-[#87909c]">Reveals hidden tiles in Mines, Eggs, & Keno</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGodMode(!godMode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                        godMode
                          ? 'bg-amber-400 text-black shadow'
                          : 'bg-[#1a2c38] text-[#87909c] hover:text-white'
                      }`}
                    >
                      {godMode ? 'VISION ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#213743] flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white text-sm block">Cheat Sheet Sidebar</span>
                      <span className="text-[11px] text-[#87909c]">Live seed-solver sidebar docked on right side</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleCheatSheet}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                        isCheatSheetOpen
                          ? 'bg-[#00e701] text-black shadow'
                          : 'bg-[#1a2c38] text-[#87909c] hover:text-white'
                      }`}
                    >
                      {isCheatSheetOpen ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{isCheatSheetOpen ? 'DOCKED' : 'HIDDEN'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: LOCAL DATABASE MANAGER (All Accounts Table)       */}
          {/* ======================================================== */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              {/* Database Controls Top Bar */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-[#87909c] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={dbSearch}
                    onChange={e => setDbSearch(e.target.value)}
                    placeholder="Search accounts by Username, UID, or Email..."
                    className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg pl-9 pr-3 py-2 text-white font-mono text-xs outline-none focus:border-[#00e701]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const json = exportUsersJson();
                      navigator.clipboard.writeText(json);
                      setCopiedBackup(true);
                      setTimeout(() => setCopiedBackup(false), 2000);
                      showToast('Database exported and copied to clipboard as JSON!');
                    }}
                    className="bg-[#1a2c38] hover:bg-[#213743] text-white border border-[#213743] px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#00e701]" />
                    <span>{copiedBackup ? 'Copied JSON!' : 'Export Backup'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowImportBox(prev => !prev)}
                    className="bg-[#1a2c38] hover:bg-[#213743] text-white border border-[#213743] px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-400" />
                    <span>Import JSON</span>
                  </button>
                </div>
              </div>

              {/* Import JSON Box (Collapsible) */}
              {showImportBox && (
                <div className="bg-[#0f212e] p-4 rounded-xl border border-blue-500/30 space-y-3 animate-float-up">
                  <span className="font-extrabold text-white text-xs block">
                    Restore Accounts from JSON Backup
                  </span>
                  <textarea
                    rows={4}
                    value={importJsonText}
                    onChange={e => setImportJsonText(e.target.value)}
                    placeholder="Paste exported JSON array of user accounts here..."
                    className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg p-3 text-white font-mono text-xs outline-none focus:border-blue-400"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImportBox(false)}
                      className="px-3 py-1.5 text-xs text-[#87909c] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = importUsersJson(importJsonText);
                        if (res.success) {
                          refreshUsers();
                          setShowImportBox(false);
                          setImportJsonText('');
                          showToast(`Successfully imported ${res.count} account(s)!`);
                        } else {
                          showToast(res.error || 'Failed to import JSON.');
                        }
                      }}
                      className="bg-blue-500 hover:bg-blue-400 text-black font-extrabold px-4 py-1.5 rounded-lg text-xs"
                    >
                      Apply Import
                    </button>
                  </div>
                </div>
              )}

              {/* Accounts Table */}
              <div className="bg-[#0f212e] rounded-xl border border-[#213743] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#213743] bg-[#12232f] text-[10px] font-extrabold uppercase text-[#87909c]">
                        <th className="py-2.5 px-3">Player</th>
                        <th className="py-2.5 px-3">UID</th>
                        <th className="py-2.5 px-3">GC Balance</th>
                        <th className="py-2.5 px-3">SC Balance</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#213743]/50 font-mono">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#87909c] font-sans">
                            No accounts match your query.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => {
                          const isSelf = u.id === currentUser?.id;
                          return (
                            <tr key={u.id} className="hover:bg-[#1a2c38]/50 transition">
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[10px] shrink-0"
                                    style={{ backgroundColor: u.avatarColor || '#1475e1' }}
                                  >
                                    {u.username.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-white font-sans">{u.username}</span>
                                      {isSelf && (
                                        <span className="text-[9px] bg-[#00e701]/15 text-[#00e701] px-1 py-0.2 rounded font-sans font-bold">
                                          YOU
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-[#87909c] block truncate max-w-[150px]">
                                      {u.email}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <span className="bg-[#1a2c38] px-2 py-0.5 rounded text-amber-400 font-bold border border-[#213743]">
                                  {u.uid}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-amber-400 font-bold">
                                {u.gcBalance.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-[#00e701] font-bold">
                                ${u.scBalance.toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5 font-sans">
                                  {/* Quick +$1K SC grant */}
                                  <button
                                    onClick={() => {
                                      grantMoneyToTarget(u.uid, 0, 1000);
                                      showToast(`Injected +$1,000 SC into ${u.username}!`);
                                    }}
                                    className="bg-[#1a2c38] hover:bg-[#2f4553] text-[#00e701] px-2 py-1 rounded text-[10px] font-bold border border-[#213743] transition cursor-pointer"
                                    title="Quick +$1,000 SC"
                                  >
                                    +$1K SC
                                  </button>

                                  {/* Select for Grants */}
                                  <button
                                    onClick={() => {
                                      setGrantTargetMode('other');
                                      setTargetQuery(u.uid);
                                      setActiveTab('grants');
                                      showToast(`Selected ${u.username} for money grant!`);
                                    }}
                                    className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 px-2 py-1 rounded text-[10px] font-bold border border-amber-500/30 transition cursor-pointer flex items-center gap-1"
                                    title="Open in Money Grants"
                                  >
                                    <span>Grant</span>
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  </button>

                                  {/* Impersonate / Switch Account */}
                                  {!isSelf && (
                                    <button
                                      onClick={() => {
                                        switchAccount(u.id);
                                        showToast(`Switched active session to ${u.username}!`);
                                      }}
                                      className="bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 px-2 py-1 rounded text-[10px] font-bold border border-blue-500/30 transition cursor-pointer"
                                      title="Switch to this account"
                                    >
                                      Switch
                                    </button>
                                  )}

                                  {/* Delete Account */}
                                  {allUsers.length > 1 && (
                                    <button
                                      onClick={() => {
                                        if (confirm(`Are you sure you want to delete ${u.username}'s account?`)) {
                                          deleteAccount(u.id);
                                          showToast(`Deleted account ${u.username}.`);
                                        }
                                      }}
                                      className="text-red-400 hover:text-red-300 p-1 rounded transition cursor-pointer"
                                      title="Delete Account"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Danger Zone: Wipe All */}
              <div className="bg-red-950/20 p-4 rounded-xl border border-red-500/30 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-red-400 text-xs block">Danger Zone: Wipe All Accounts</span>
                  <span className="text-[11px] text-[#87909c]">Deletes all registered accounts and clears local browser state</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('CRITICAL WARNING: This will permanently delete ALL user accounts from this browser. Proceed?')) {
                      wipeAllUsers();
                      refreshUsers();
                      closeOwnerModal();
                      window.location.reload();
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                >
                  Wipe Database
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: BROADCAST & FEED (Chat & Live Feed Spoofer)        */}
          {/* ======================================================== */}
          {activeTab === 'broadcast' && (
            <div className="space-y-4">
              {/* Live Chat Broadcast Form */}
              <form onSubmit={handleSendBroadcast} className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm block">Live Chat Administrator Broadcast</span>
                  <div className="flex gap-1 bg-[#1a2c38] p-1 rounded-lg border border-[#213743]">
                    <button
                      type="button"
                      onClick={() => setBroadcastRole('admin')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        broadcastRole === 'admin'
                          ? 'bg-amber-400 text-black font-extrabold'
                          : 'text-[#87909c] hover:text-white'
                      }`}
                    >
                      [ADMIN] Crown
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastRole('system')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        broadcastRole === 'system'
                          ? 'bg-[#00e701] text-black font-extrabold'
                          : 'text-[#87909c] hover:text-white'
                      }`}
                    >
                      [SYSTEM] Alert
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={broadcastText}
                    onChange={e => setBroadcastText(e.target.value)}
                    placeholder="Enter broadcast message to send to everyone in Live Chat..."
                    className="flex-1 bg-[#1a2c38] border border-[#213743] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#00e701]"
                  />
                  <button
                    type="submit"
                    className="bg-[#00e701] hover:bg-[#1fff20] text-black font-extrabold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>

                {/* Bot Chatter Toggle */}
                <div className="pt-2 border-t border-[#213743] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-xs block">Automated Chat Bots</span>
                    <span className="text-[11px] text-[#87909c]">Simulates active room chatter from other casino players</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setChatBotsEnabled(!chatBotsEnabled);
                      showToast(`Chat Bot Chatter ${!chatBotsEnabled ? 'ENABLED' : 'PAUSED'}`);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                      chatBotsEnabled
                        ? 'bg-[#00e701] text-black shadow'
                        : 'bg-[#1a2c38] text-[#87909c] hover:text-white'
                    }`}
                  >
                    {chatBotsEnabled ? 'BOTS ACTIVE' : 'BOTS OFF'}
                  </button>
                </div>
              </form>

              {/* Live Feed Whale Bet Spoofer */}
              <form onSubmit={handleSpoofBet} className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                <div>
                  <span className="font-extrabold text-white text-sm block">Live Feed High-Roller Bet Spoofer</span>
                  <span className="text-[11px] text-[#87909c]">Broadcasts a forged mega-win to the live casino bet ticker</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-[#87909c] block mb-1">Player Name</label>
                    <input
                      type="text"
                      value={spooferUser}
                      onChange={e => setSpooferUser(e.target.value)}
                      className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-[#00e701]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-[#87909c] block mb-1">Game</label>
                    <select
                      value={spooferGame}
                      onChange={e => setSpooferGame(e.target.value as GameId)}
                      className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-[#00e701]"
                    >
                      <option value="plinko">Plinko</option>
                      <option value="crash">Crash</option>
                      <option value="mines">Mines</option>
                      <option value="roulette">Roulette</option>
                      <option value="slots">Slots</option>
                      <option value="dice">Dice</option>
                      <option value="blackjack">Blackjack</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-[#87909c] block mb-1">Bet Amount</label>
                    <input
                      type="number"
                      value={spooferAmount}
                      onChange={e => setSpooferAmount(e.target.value)}
                      className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-[#00e701]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-[#87909c] block mb-1">Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={spooferMult}
                      onChange={e => setSpooferMult(e.target.value)}
                      className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-[#00e701]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] font-extrabold uppercase text-[#87909c]">Currency:</span>
                    <button
                      type="button"
                      onClick={() => setSpooferCurrency(c => (c === 'SC' ? 'GC' : 'SC'))}
                      className="bg-[#1a2c38] text-amber-400 px-2 py-0.5 rounded font-mono font-bold text-xs border border-[#213743]"
                    >
                      {spooferCurrency}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-black font-extrabold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Broadcast Whale Win</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: STREAMER & FX (Fake Balances & Soundboard)        */}
          {/* ======================================================== */}
          {activeTab === 'streamer' && (
            <div className="space-y-4">
              {/* Fake Display Balance Spoofer */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-white text-sm block">Streamer Display Balance Spoofer</span>
                    <span className="text-[11px] text-[#87909c]">
                      Shows massive fake balances in Navbar for screenshots/recording while preserving real wallet
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStreamerSettings(prev => ({
                        ...prev,
                        streamerModeActive: !prev.streamerModeActive,
                        fakeDisplayBalanceGC: !prev.streamerModeActive ? parseFloat(fakeGcInput) || 10000000 : null,
                        fakeDisplayBalanceSC: !prev.streamerModeActive ? parseFloat(fakeScInput) || 250000 : null,
                      }));
                      showToast(`Streamer Spoofer ${!streamerSettings.streamerModeActive ? 'ACTIVATED' : 'OFF'}`);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                      streamerSettings.streamerModeActive
                        ? 'bg-pink-500 text-white shadow'
                        : 'bg-[#1a2c38] text-[#87909c] hover:text-white'
                    }`}
                  >
                    {streamerSettings.streamerModeActive ? 'SPOOF ACTIVE' : 'OFF'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#213743]">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-[#87909c] block mb-1">Fake GC Display</label>
                    <input
                      type="number"
                      value={fakeGcInput}
                      onChange={e => {
                        setFakeGcInput(e.target.value);
                        if (streamerSettings.streamerModeActive) {
                          setStreamerSettings(prev => ({
                            ...prev,
                            fakeDisplayBalanceGC: parseFloat(e.target.value) || 0,
                          }));
                        }
                      }}
                      className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg px-3 py-2 text-white font-mono font-bold text-xs outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-[#87909c] block mb-1">Fake SC Display ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fakeScInput}
                      onChange={e => {
                        setFakeScInput(e.target.value);
                        if (streamerSettings.streamerModeActive) {
                          setStreamerSettings(prev => ({
                            ...prev,
                            fakeDisplayBalanceSC: parseFloat(e.target.value) || 0,
                          }));
                        }
                      }}
                      className="w-full bg-[#1a2c38] border border-[#213743] rounded-lg px-3 py-2 text-white font-mono font-bold text-xs outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* Platform FX & Soundboard */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm block">Platform Soundboard & FX</span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerCoinRain();
                      sound.playBigWin();
                      showToast('Triggered Coin Rain and Celebration Burst!');
                    }}
                    className="bg-[#00e701] hover:bg-[#1fff20] text-black font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Coin Rain Burst</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => sound.playWin()}
                    className="bg-[#1a2c38] hover:bg-[#213743] text-white py-2 rounded-lg text-xs font-bold transition cursor-pointer border border-[#213743]"
                  >
                    Play Win
                  </button>
                  <button
                    type="button"
                    onClick={() => sound.playBigWin()}
                    className="bg-[#1a2c38] hover:bg-[#213743] text-amber-400 py-2 rounded-lg text-xs font-bold transition cursor-pointer border border-[#213743]"
                  >
                    Play Big Win
                  </button>
                  <button
                    type="button"
                    onClick={() => sound.playLoss()}
                    className="bg-[#1a2c38] hover:bg-[#213743] text-red-400 py-2 rounded-lg text-xs font-bold transition cursor-pointer border border-[#213743]"
                  >
                    Play Loss
                  </button>
                  <button
                    type="button"
                    onClick={() => sound.playPeg()}
                    className="bg-[#1a2c38] hover:bg-[#213743] text-blue-400 py-2 rounded-lg text-xs font-bold transition cursor-pointer border border-[#213743]"
                  >
                    Play Peg
                  </button>
                  <button
                    type="button"
                    onClick={() => sound.playChip()}
                    className="bg-[#1a2c38] hover:bg-[#213743] text-purple-400 py-2 rounded-lg text-xs font-bold transition cursor-pointer border border-[#213743]"
                  >
                    Play Chip
                  </button>
                  <button
                    type="button"
                    onClick={() => sound.playWheelTick()}
                    className="bg-[#1a2c38] hover:bg-[#213743] text-pink-400 py-2 rounded-lg text-xs font-bold transition cursor-pointer border border-[#213743]"
                  >
                    Play Wheel
                  </button>
                </div>
              </div>

              {/* Live Session Stats Modifier */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm block">Session Stats Spoofer</span>
                  <button
                    type="button"
                    onClick={() => {
                      modifySessionStats(() => ({
                        wagered: { GC: 5000000, SC: 50000 },
                        profit: { GC: 2500000, SC: 15420.5 },
                        wins: 142,
                        losses: 31,
                        bestMultiplier: 1000,
                      }));
                      showToast('Injected god-tier session stats!');
                    }}
                    className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Forge Whale Stats
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="bg-[#1a2c38] p-2.5 rounded-lg border border-[#213743]">
                    <span className="text-[10px] text-[#87909c] block">Wagered (SC)</span>
                    <span className="text-white font-bold">${sessionStats.wagered.SC.toFixed(2)}</span>
                  </div>
                  <div className="bg-[#1a2c38] p-2.5 rounded-lg border border-[#213743]">
                    <span className="text-[10px] text-[#87909c] block">Profit (SC)</span>
                    <span className="text-[#00e701] font-bold">+${sessionStats.profit.SC.toFixed(2)}</span>
                  </div>
                  <div className="bg-[#1a2c38] p-2.5 rounded-lg border border-[#213743]">
                    <span className="text-[10px] text-[#87909c] block">Win / Loss</span>
                    <span className="text-white font-bold">{sessionStats.wins}W / {sessionStats.losses}L</span>
                  </div>
                  <div className="bg-[#1a2c38] p-2.5 rounded-lg border border-[#213743]">
                    <span className="text-[10px] text-[#87909c] block">Best Multiplier</span>
                    <span className="text-amber-400 font-bold">{sessionStats.bestMultiplier}x</span>
                  </div>
                </div>
              </div>

              {/* Provably Fair Unhashed Seed Viewer */}
              <div className="bg-[#0f212e] p-4 rounded-xl border border-[#213743] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#00e701]" />
                    <span>Active Plaintext Server Seed</span>
                  </span>
                  <button
                    type="button"
                    onClick={rotateSeeds}
                    className="text-[#00e701] hover:underline flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Rotate Pair</span>
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
                  >
                    {copiedSeed ? <Check className="w-3.5 h-3.5 text-[#00e701]" /> : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
