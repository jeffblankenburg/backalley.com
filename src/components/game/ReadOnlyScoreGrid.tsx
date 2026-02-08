import { useRef, useEffect } from 'react';
import type { Game, Player, Suit } from '../../types/index.ts';
import { SUITS, RAINBOW_HAND_SIZE } from '../../lib/constants.ts';

const SUIT_CLASS: Record<Suit, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-slate-800 dark:text-slate-200',
  spades: 'text-slate-800 dark:text-slate-200',
};

interface ReadOnlyScoreGridProps {
  game: Game;
  players: Player[];
  onEnterBids: (roundIndex: number) => void;
  onEnterTricks: (roundIndex: number) => void;
}

export function ReadOnlyScoreGrid({
  game,
  players,
  onEnterBids,
  onEnterTricks,
}: ReadOnlyScoreGridProps) {
  const currentRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      currentRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    return () => clearTimeout(t);
  }, [game.currentRoundIndex]);

  const playerCount = game.playerIds.length;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/80">
            <th className="py-2 px-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 w-7 border-r border-slate-200 dark:border-slate-700">
              #
            </th>
            {game.playerIds.map((pid) => {
              const player = players.find((p) => p.id === pid);
              return (
                <th
                  key={pid}
                  className="py-2 px-1 text-center text-[11px] font-bold text-slate-600 dark:text-slate-300 min-w-[68px] border-r border-slate-200 dark:border-slate-700"
                >
                  {player?.name ?? '?'}
                </th>
              );
            })}
            <th className="py-2 px-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 w-9 border-r border-slate-200 dark:border-slate-700">
              T
            </th>
            <th className="py-2 px-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 w-10">
              &Sigma;
            </th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {game.rounds.map((round, ri) => {
            const isCurrent = ri === game.currentRoundIndex;
            const isComplete = round.isComplete;
            const isFuture = !isComplete && !isCurrent;
            const isRainbowRound = round.handSize === RAINBOW_HAND_SIZE;
            const bidsEntered = round.bidsEntered;

            const roundBids = round.playerRounds.reduce(
              (sum, pr) => sum + ((pr.boardLevel ?? 0) > 0 ? round.handSize : pr.bid),
              0,
            );

            // Current round with no bids yet — show "Enter Bids" button
            if (isCurrent && !bidsEntered && !isComplete) {
              return (
                <tr
                  key={ri}
                  ref={currentRowRef}
                  className="border-t border-blue-300 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-950/30"
                >
                  <td className="py-1 px-1 text-center font-bold text-blue-600 dark:text-blue-400 border-r border-slate-200 dark:border-slate-700">
                    {round.handSize}
                  </td>
                  <td colSpan={playerCount + 2} className="py-2 px-2">
                    <button
                      type="button"
                      onClick={() => onEnterBids(ri)}
                      className="w-full py-2.5 rounded-lg bg-blue-500 text-white font-bold text-sm transition-all active:scale-[0.98]"
                    >
                      Enter Bids
                    </button>
                  </td>
                </tr>
              );
            }

            // Current round with bids entered but not complete — show bids + "Enter Tricks" button
            if (isCurrent && bidsEntered && !isComplete) {
              // Determine who leads: highest bidder, ties broken by bid order (left of dealer first)
              const dealerIdx = game.playerIds.indexOf(round.dealerPlayerId);
              let leadPlayerId = game.playerIds[0];
              let highestBid = -1;
              let bestBidPos = Infinity;
              for (let pi = 0; pi < game.playerIds.length; pi++) {
                const pr = round.playerRounds[pi];
                const effectiveBid = (pr.boardLevel ?? 0) > 0 ? round.handSize : pr.bid;
                const bidPos = ((pi - dealerIdx + game.playerIds.length) % game.playerIds.length) || game.playerIds.length;
                if (effectiveBid > highestBid || (effectiveBid === highestBid && bidPos < bestBidPos)) {
                  highestBid = effectiveBid;
                  bestBidPos = bidPos;
                  leadPlayerId = game.playerIds[pi];
                }
              }

              return (
                <tr
                  key={ri}
                  ref={currentRowRef}
                  className="border-t border-blue-300 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-950/30"
                >
                  <td className="py-1 px-1 text-center font-bold text-blue-600 dark:text-blue-400 border-r border-slate-200 dark:border-slate-700">
                    {round.handSize}
                  </td>
                  {game.playerIds.map((pid) => {
                    const pr = round.playerRounds.find((p) => p.playerId === pid);
                    if (!pr) return <td key={pid} className="border-r border-slate-200 dark:border-slate-700" />;
                    const isDealer = pid === round.dealerPlayerId;
                    const isLead = pid === leadPlayerId;
                    const bl = pr.boardLevel ?? 0;
                    const isBoard = bl > 0;
                    return (
                      <td key={pid} className={['py-1 px-1 text-center border-r border-slate-200 dark:border-slate-700', isBoard ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''].join(' ')}>
                        <div className="leading-tight">
                          {isDealer && <span className="text-[8px] text-amber-500 font-bold">D </span>}
                          {isLead && <span className="text-[8px] text-emerald-500 font-bold">L </span>}
                          <span className={isBoard ? 'font-bold text-amber-500' : ''}>
                            {isBoard ? `B${bl > 1 ? bl : ''}` : pr.bid}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  {/* Trump */}
                  <td className="py-1 px-1 text-center border-r border-slate-200 dark:border-slate-700">
                    {round.trumpSuit && (
                      <span className={['font-bold text-sm suit-symbol', SUIT_CLASS[round.trumpSuit]].join(' ')}>
                        {SUITS.find((s) => s.suit === round.trumpSuit)?.symbol}
                      </span>
                    )}
                  </td>
                  {/* Bid total */}
                  <td className="py-1 px-1 text-center text-slate-500 dark:text-slate-400">
                    <span className={roundBids === round.handSize ? 'text-amber-500 font-bold' : ''}>
                      {roundBids}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">/{round.handSize}</span>
                  </td>
                </tr>
              );
            }

            return (
              <tr
                key={ri}
                ref={isCurrent ? currentRowRef : undefined}
                className={[
                  'border-t',
                  isCurrent
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-950/30'
                    : 'border-slate-100 dark:border-slate-800',
                  isFuture ? 'opacity-25' : '',
                ].join(' ')}
              >
                {/* Hand size */}
                <td
                  className={[
                    'py-1 px-1 text-center font-bold border-r border-slate-200 dark:border-slate-700',
                    isCurrent ? 'text-blue-600 dark:text-blue-400' : '',
                    isRainbowRound && !isCurrent ? 'text-amber-500' : '',
                  ].join(' ')}
                >
                  {round.handSize}
                </td>

                {/* Player cells */}
                {game.playerIds.map((pid) => {
                  const pr = round.playerRounds.find((p) => p.playerId === pid);
                  if (!pr) return <td key={pid} className="border-r border-slate-200 dark:border-slate-700" />;

                  const isDealer = pid === round.dealerPlayerId;
                  const bl = pr.boardLevel ?? 0;
                  const isBoard = bl > 0;
                  const effectiveBid = isBoard ? round.handSize : pr.bid;

                  // Future cell
                  if (isFuture) {
                    return (
                      <td key={pid} className="py-1 px-1 text-center text-slate-300 dark:text-slate-700 border-r border-slate-200 dark:border-slate-700">
                        &middot;
                      </td>
                    );
                  }

                  // Completed cell
                  return (
                    <td
                      key={pid}
                      className={[
                        'py-1 px-1 text-center border-r border-slate-200 dark:border-slate-700',
                        isBoard ? 'bg-amber-50/40 dark:bg-amber-950/10' : '',
                      ].join(' ')}
                    >
                      <div className="leading-tight">
                        {isDealer && <span className="text-[8px] text-amber-500 font-bold">D </span>}
                        <span className={isBoard ? 'font-bold text-amber-500' : ''}>
                          {isBoard ? `B${bl > 1 ? bl : ''}` : pr.bid}
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">/</span>
                        <span
                          className={
                            effectiveBid === 0 && pr.tricksTaken === 0
                              ? 'text-slate-400'
                              : pr.tricksTaken >= effectiveBid
                                ? 'text-emerald-500 dark:text-emerald-400'
                                : 'text-red-500 dark:text-red-400'
                          }
                        >
                          {pr.tricksTaken}
                        </span>
                        {pr.rainbow && <span className="text-[7px]"> R</span>}
                      </div>
                      <div
                        className={[
                          'text-[10px] leading-tight font-semibold',
                          pr.cumulativeScore > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : pr.cumulativeScore < 0
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-slate-400',
                        ].join(' ')}
                      >
                        {pr.cumulativeScore}
                      </div>
                    </td>
                  );
                })}

                {/* Trump column */}
                <td className="py-1 px-1 text-center border-r border-slate-200 dark:border-slate-700">
                  {round.trumpSuit ? (
                    <span className={['font-bold text-sm suit-symbol', SUIT_CLASS[round.trumpSuit]].join(' ')}>
                      {SUITS.find((s) => s.suit === round.trumpSuit)?.symbol}
                    </span>
                  ) : null}
                </td>

                {/* Bid total */}
                <td className="py-1 px-1 text-center text-slate-500 dark:text-slate-400">
                  {(isComplete || isCurrent) && (
                    <>
                      <span className={roundBids === round.handSize ? 'text-amber-500 font-bold' : ''}>
                        {roundBids}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">/{round.handSize}</span>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80">
            <td className="py-2 px-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-slate-700">
              &Sigma;
            </td>
            {game.playerIds.map((pid) => {
              let totalBids = 0;
              let totalTricks = 0;
              let sets = 0;
              for (const round of game.rounds) {
                if (!round.isComplete) continue;
                const pr = round.playerRounds.find((p) => p.playerId === pid);
                if (!pr) continue;
                const effectiveBid = (pr.boardLevel ?? 0) > 0 ? round.handSize : pr.bid;
                totalBids += effectiveBid;
                totalTricks += pr.tricksTaken;
                if (effectiveBid > 0 && pr.tricksTaken < effectiveBid) {
                  sets++;
                }
              }
              return (
                <td key={pid} className="py-2 px-1 text-center font-mono border-r border-slate-200 dark:border-slate-700">
                  <div className="leading-tight">
                    <span className="text-slate-600 dark:text-slate-300">{totalBids}</span>
                    <span className="text-slate-400 dark:text-slate-600">/</span>
                    <span className="text-slate-600 dark:text-slate-300">{totalTricks}</span>
                  </div>
                  {sets > 0 && (
                    <div className="text-[10px] text-red-500 dark:text-red-400 font-semibold">
                      {sets} set{sets !== 1 ? 's' : ''}
                    </div>
                  )}
                </td>
              );
            })}
            <td className="border-r border-slate-200 dark:border-slate-700" />
            <td />
          </tr>
        </tfoot>
      </table>

      {/* Enter Tricks button below grid when bids are entered */}
      {(() => {
        const current = game.rounds[game.currentRoundIndex];
        if (current && current.bidsEntered && !current.isComplete) {
          return (
            <div className="p-3">
              <button
                type="button"
                onClick={() => onEnterTricks(game.currentRoundIndex)}
                className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-lg transition-all active:scale-[0.98]"
              >
                Enter Tricks
              </button>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}
