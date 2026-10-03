import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider, useGame } from './context/GameContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { CheatSheetSidebar } from './components/layout/CheatSheetSidebar';
import { LiveFeed } from './components/layout/LiveFeed';
import { LiveChat } from './components/layout/LiveChat';
import { ProvablyFairModal } from './components/modals/ProvablyFairModal';
import { LiveStatsModal } from './components/modals/LiveStatsModal';
import { AuthModal } from './components/modals/AuthModal';
import { UserProfileModal } from './components/modals/UserProfileModal';
import { RakebackModal } from './components/modals/RakebackModal';
import { OwnerProvider } from './context/OwnerContext';
import { OwnerPinModal } from './components/modals/OwnerPinModal';
import { OwnerPanelModal } from './components/modals/OwnerPanelModal';
import { Sparkles, UserPlus, LogIn, HardDrive } from 'lucide-react';

// Game Components
import { Mines } from './components/games/Mines';
import { Plinko } from './components/games/Plinko';
import { DragonTower } from './components/games/DragonTower';
import { Crash } from './components/games/Crash';
import { Dice } from './components/games/Dice';
import { Limbo } from './components/games/Limbo';
import { Keno } from './components/games/Keno';
import { Wheel } from './components/games/Wheel';
import { Blackjack } from './components/games/Blackjack';
import { Roulette } from './components/games/Roulette';
import { Slots } from './components/games/Slots';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-[#0f212e] text-white flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-xl font-bold text-red-500 mb-2">Game Container Error</h2>
          <p className="text-xs text-[#87909c] mb-4 font-mono">{this.state.error?.toString()}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="bg-[#00e701] text-black px-4 py-2 rounded font-bold text-xs"
          >
            Reload Stake Platform
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const GuestBanner: React.FC = () => {
  const { openAuthModal } = useAuth();

  return (
    <div className="mb-6 bg-gradient-to-r from-[#1a2c38] via-[#213743] to-[#1a2c38] border border-[#00e701]/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00e701]/10 border border-[#00e701]/30 flex items-center justify-center text-[#00e701] shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="text-white font-extrabold text-sm flex items-center gap-2">
            <span>Account Required Before Playing</span>
            <span className="bg-[#00e701] text-black text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              100% LOCAL
            </span>
          </div>
          <div className="text-xs text-[#87909c] mt-0.5">
            Create an account in 5 seconds. Stored locally on your browser with no external database! Claim <strong className="text-white">1,000 GC + $250.00 SC</strong>.
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => openAuthModal('login')}
          className="px-3.5 py-2 text-xs font-extrabold text-white hover:bg-[#2f4553] rounded-lg transition border border-[#213743] cursor-pointer flex items-center gap-1.5"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </button>
        <button
          onClick={() => openAuthModal('register', 'Create your account to start playing Stake Originals!')}
          className="px-4 py-2 text-xs font-black text-black bg-[#00e701] hover:bg-[#1fff20] rounded-lg transition shadow-md shadow-[#00e701]/20 cursor-pointer flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register to Play</span>
        </button>
      </div>
    </div>
  );
};

const ActiveGameContainer: React.FC = () => {
  const { activeGame } = useGame();
  const { currentUser } = useAuth();

  const renderGame = () => {
    switch (activeGame) {
      case 'mines':
        return <Mines />;
      case 'plinko':
        return <Plinko />;
      case 'dragontower':
        return <DragonTower />;
      case 'crash':
        return <Crash />;
      case 'dice':
        return <Dice />;
      case 'limbo':
        return <Limbo />;
      case 'keno':
        return <Keno />;
      case 'wheel':
        return <Wheel />;
      case 'blackjack':
        return <Blackjack />;
      case 'roulette':
        return <Roulette />;
      case 'slots':
        return <Slots />;
      default:
        return <Mines />;
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {!currentUser && <GuestBanner />}
      <ErrorBoundary>
        {renderGame()}
      </ErrorBoundary>
      <LiveFeed />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <OwnerProvider>
          <div className="min-h-screen bg-[#0f212e] flex flex-col text-white">
            <Navbar />
            <div className="flex flex-1">
              <Sidebar />
              <ActiveGameContainer />
              <CheatSheetSidebar />
            </div>
            <ProvablyFairModal />
            <LiveStatsModal />
            <AuthModal />
            <UserProfileModal />
            <RakebackModal />
            <OwnerPinModal />
            <OwnerPanelModal />
            <LiveChat />
          </div>
        </OwnerProvider>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;
