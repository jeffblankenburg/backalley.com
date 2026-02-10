import { NumberPad } from './NumberPad.tsx';
import { MAX_BOARD_LEVEL } from '../../../types/index.ts';

interface BidStepProps {
  playerName: string;
  isDealer: boolean;
  handSize: number;
  currentBidTotal: number;
  currentPlayerIndex: number;
  totalPlayers: number;
  selected: number | null;
  boardLevel: number;
  maxBoardInRound: number;
  onBid: (bid: number, boardLevel: number) => void;
  onBack: () => void;
  isRainbowRound?: boolean;
  rainbow?: boolean;
  jobo?: boolean;
  onToggleRainbow?: () => void;
  onToggleJobo?: () => void;
}

export function BidStep({
  playerName,
  isDealer,
  handSize,
  currentBidTotal,
  currentPlayerIndex,
  totalPlayers,
  selected,
  boardLevel,
  maxBoardInRound,
  onBid,
  onBack,
  isRainbowRound,
  rainbow,
  jobo,
  onToggleRainbow,
  onToggleJobo,
}: BidStepProps) {
  const nextBoardLevel = Math.min(maxBoardInRound + 1, MAX_BOARD_LEVEL);
  const isBoard = boardLevel > 0;
  const boardLabel = isBoard
    ? boardLevel === 1 ? 'Board' : `Board x${boardLevel}`
    : nextBoardLevel === 1 ? 'Board' : `Board x${nextBoardLevel}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {playerName}
          {isDealer && <span className="ml-2 text-sm text-amber-500 font-bold">(Dealer)</span>}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Bids: {currentBidTotal} / {handSize} cards
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {Array.from({ length: totalPlayers }, (_, i) => (
          <div
            key={i}
            className={[
              'w-2.5 h-2.5 rounded-full',
              i < currentPlayerIndex
                ? 'bg-blue-500'
                : i === currentPlayerIndex
                  ? 'bg-blue-500 ring-2 ring-blue-300 dark:ring-blue-700'
                  : 'bg-slate-300 dark:bg-slate-600',
            ].join(' ')}
          />
        ))}
      </div>

      {isRainbowRound && (
        <div className="w-full max-w-xs flex gap-2">
          <button
            type="button"
            onClick={onToggleRainbow}
            className={[
              'flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95',
              rainbow
                ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300 dark:ring-blue-700'
                : jobo
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  : 'bg-rainbow text-white',
            ].join(' ')}
          >
            Rainbow
          </button>
          <button
            type="button"
            onClick={onToggleJobo}
            className={[
              'flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95',
              jobo
                ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300 dark:ring-blue-700'
                : rainbow
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  : 'bg-joebow text-white',
            ].join(' ')}
          >
            JoeBow
          </button>
        </div>
      )}

      <div className="w-full max-w-xs">
        <NumberPad
          max={handSize}
          selected={isBoard ? null : selected}
          onSelect={(n) => onBid(n, 0)}
        />
      </div>

      <button
        type="button"
        onClick={() => onBid(handSize, isBoard ? 0 : nextBoardLevel)}
        className={[
          'w-full max-w-xs py-3 rounded-xl font-bold text-lg transition-all active:scale-95',
          isBoard
            ? 'bg-amber-500 text-white ring-2 ring-amber-300 dark:ring-amber-700'
            : 'bg-slate-100 dark:bg-slate-700 text-amber-500',
        ].join(' ')}
      >
        {boardLabel}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
      >
        &larr; Back
      </button>
    </div>
  );
}
