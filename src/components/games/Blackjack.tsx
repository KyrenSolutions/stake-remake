import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/soundEngine';
import { Club } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  rank: string;
  value: number;
}

const SUITS: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const Blackjack: React.FC = () => {
  const { currency, placeBet, addWin, addLoss } = useGame();
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<string>('');

  const drawCard = (): Card => {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
    let value = parseInt(rank);
    if (['J', 'Q', 'K'].includes(rank)) value = 10;
    if (rank === 'A') value = 11;

    return { suit, rank, value };
  };

  const calculateHandScore = (hand: Card[]): number => {
    let score = hand.reduce((acc, c) => acc + c.value, 0);
    let aces = hand.filter(c => c.rank === 'A').length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const handleStartGame = () => {
    if (isPlaying) return;
    if (!placeBet(betAmount)) return;

    const pCard1 = drawCard();
    const pCard2 = drawCard();
    const dCard1 = drawCard();
    const dCard2 = drawCard();

    const pHand = [pCard1, pCard2];
    const dHand = [dCard1, dCard2];

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setIsPlaying(true);
    setGameOver(false);
    setGameResult('');

    // Check instant player Blackjack
    const pScore = calculateHandScore(pHand);
    if (pScore === 21) {
      // Blackjack 3:2 payout!
      const payout = parseFloat((betAmount * 2.5).toFixed(2));
      setGameOver(true);
      setIsPlaying(false);
      setGameResult('BLACKJACK! (3:2 Payout)');
      confetti({ particleCount: 80, spread: 60 });
      addWin(payout, 2.5, 'Blackjack', betAmount);
    }
  };

  const handleHit = () => {
    if (!isPlaying || gameOver) return;
    sound.playPeg();

    const newCard = drawCard();
    const updatedHand = [...playerHand, newCard];
    setPlayerHand(updatedHand);

    const score = calculateHandScore(updatedHand);
    if (score > 21) {
      // BUST
      setGameOver(true);
      setIsPlaying(false);
      setGameResult('PLAYER BUST!');
      addLoss('Blackjack', betAmount);
    }
  };

  const handleStand = () => {
    if (!isPlaying || gameOver) return;

    // Dealer turn
    let currentDHand = [...dealerHand];
    let dScore = calculateHandScore(currentDHand);

    while (dScore < 17) {
      currentDHand.push(drawCard());
      dScore = calculateHandScore(currentDHand);
    }

    setDealerHand(currentDHand);
    setIsPlaying(false);
    setGameOver(true);

    const pScore = calculateHandScore(playerHand);

    if (dScore > 21) {
      const payout = parseFloat((betAmount * 2).toFixed(2));
      setGameResult('DEALER BUST! YOU WIN');
      addWin(payout, 2.0, 'Blackjack', betAmount);
    } else if (pScore > dScore) {
      const payout = parseFloat((betAmount * 2).toFixed(2));
      setGameResult('YOU WIN!');
      addWin(payout, 2.0, 'Blackjack', betAmount);
    } else if (pScore === dScore) {
      setGameResult('PUSH (TIE)');
      addWin(betAmount, 1.0, 'Blackjack', betAmount);
    } else {
      setGameResult('DEALER WINS');
      addLoss('Blackjack', betAmount);
    }
  };

  const pScore = calculateHandScore(playerHand);
  const dScore = calculateHandScore(dealerHand);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Controls */}
      <div className="lg:col-span-4 bg-[#1a2c38] p-5 rounded-lg border border-[#213743] flex flex-col gap-5 select-none">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Club className="w-5 h-5 text-[#00e701]" />
          <span>Blackjack</span>
        </h2>

        {/* Bet Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs font-bold">
            <span className="text-[#87909c]">Bet Amount</span>
            <span className="text-[#00e701] font-mono">{betAmount} {currency}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={betAmount}
              disabled={isPlaying}
              onChange={e => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
              className="stake-input font-mono text-sm"
            />
            <button
              disabled={isPlaying}
              onClick={() => setBetAmount(prev => parseFloat((prev / 2).toFixed(2)))}
              className="stake-btn-secondary text-xs px-3 font-bold"
            >
              ½
            </button>
            <button
              disabled={isPlaying}
              onClick={() => setBetAmount(prev => prev * 2)}
              className="stake-btn-secondary text-xs px-3 font-bold"
            >
              2x
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        {!isPlaying ? (
          <button
            onClick={handleStartGame}
            className="stake-btn-primary py-3.5 text-base w-full mt-2"
          >
            Deal Cards
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleHit}
              className="bg-[#00e701] text-black font-extrabold py-3.5 rounded hover:bg-[#1fff20] transition"
            >
              Hit
            </button>
            <button
              onClick={handleStand}
              className="bg-amber-500 text-black font-extrabold py-3.5 rounded hover:bg-amber-400 transition"
            >
              Stand
            </button>
          </div>
        )}
      </div>

      {/* Card Table View */}
      <div className="lg:col-span-8 bg-[#0f212e] p-8 rounded-lg border border-[#213743] flex flex-col justify-between min-h-[460px] select-none relative">
        {/* Game Result Overlay */}
        {gameOver && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full font-bold text-sm bg-[#1a2c38] border border-[#00e701] text-[#00e701] shadow-xl animate-float-up">
            {gameResult}
          </div>
        )}

        {/* Dealer Hand Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#87909c] uppercase">Dealer Hand</span>
            {dealerHand.length > 0 && (
              <span className="bg-[#1a2c38] text-white px-2 py-0.5 rounded text-xs font-mono font-bold">
                {gameOver ? dScore : dealerHand[0].value}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            {dealerHand.map((card, i) => {
              const isHidden = !gameOver && i === 1;
              const isRed = card.suit === '♥' || card.suit === '♦';

              return (
                <div
                  key={i}
                  className={`w-20 h-28 rounded-lg border flex flex-col justify-between p-2 shadow-md transition-all ${
                    isHidden
                      ? 'bg-[#1a2c38] border-[#213743]'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {isHidden ? (
                    <div className="w-full h-full flex items-center justify-center text-[#87909c] font-black text-xl">
                      ?
                    </div>
                  ) : (
                    <>
                      <span className={`font-bold font-mono text-sm ${isRed ? 'text-red-600' : 'text-black'}`}>
                        {card.rank}{card.suit}
                      </span>
                      <span className={`text-2xl text-center ${isRed ? 'text-red-600' : 'text-black'}`}>
                        {card.suit}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Player Hand Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#87909c] uppercase">Your Hand</span>
            {playerHand.length > 0 && (
              <span className="bg-[#1a2c38] text-[#00e701] px-2 py-0.5 rounded text-xs font-mono font-bold">
                {pScore}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            {playerHand.map((card, i) => {
              const isRed = card.suit === '♥' || card.suit === '♦';
              return (
                <div
                  key={i}
                  className="w-20 h-28 bg-white border border-gray-300 rounded-lg flex flex-col justify-between p-2 shadow-md animate-float-up"
                >
                  <span className={`font-bold font-mono text-sm ${isRed ? 'text-red-600' : 'text-black'}`}>
                    {card.rank}{card.suit}
                  </span>
                  <span className={`text-2xl text-center ${isRed ? 'text-red-600' : 'text-black'}`}>
                    {card.suit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
