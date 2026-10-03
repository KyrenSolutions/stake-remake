import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { CheatSheetSidebar } from './components/layout/CheatSheetSidebar';
import { LiveFeed } from './components/layout/LiveFeed';
import { ProvablyFairModal } from './components/modals/ProvablyFairModal';
import { LiveStatsModal } from './components/modals/LiveStatsModal';

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

const ActiveGameContainer: React.FC = () => {
  const { activeGame } = useGame();

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
      <ErrorBoundary>
        {renderGame()}
      </ErrorBoundary>
      <LiveFeed />
    </div>
  );
};

export function App() {
  return (
    <GameProvider>
      <div className="min-h-screen bg-[#0f212e] flex flex-col text-white">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <ActiveGameContainer />
          <CheatSheetSidebar />
        </div>
        <ProvablyFairModal />
        <LiveStatsModal />
      </div>
    </GameProvider>
  );
}

export default App;
