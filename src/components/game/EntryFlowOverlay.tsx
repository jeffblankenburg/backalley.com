import { useReducer } from 'react';
import type { Round, Player, Suit } from '../../types/index.ts';
import { RAINBOW_HAND_SIZE } from '../../lib/constants.ts';
import { TrumpStep } from './entry/TrumpStep.tsx';
import { BidStep } from './entry/BidStep.tsx';
import { TricksStep } from './entry/TricksStep.tsx';
import { RainbowStep } from './entry/RainbowStep.tsx';
import { JoBoStep } from './entry/JoBoStep.tsx';

type FlowPhase = 'trump' | 'bids' | 'tricks' | 'tricks_error' | 'rainbow' | 'jobo' | 'commit_bids' | 'commit_tricks';

interface FlowState {
  phase: FlowPhase;
  playerStep: number;
  suit: Suit | null;
  bids: { bid: number; boardLevel: number }[];
  tricks: number[];
  rainbows: Record<string, boolean>;
  jobos: Record<string, boolean>;
}

type FlowAction =
  | { type: 'SELECT_SUIT'; suit: Suit }
  | { type: 'SET_BID'; bid: number; boardLevel: number }
  | { type: 'SET_TRICKS'; tricks: number }
  | { type: 'TOGGLE_RAINBOW'; playerId: string }
  | { type: 'TOGGLE_JOBO'; playerId: string }
  | { type: 'DONE_RAINBOW' }
  | { type: 'DONE_JOBO' }
  | { type: 'BACK' };

interface EntryFlowOverlayProps {
  round: Round;
  players: Player[];
  playerIds: string[];
  initialPhase: 'trump' | 'tricks';
  onCommitBids: (suit: Suit, bids: { playerId: string; bid: number; boardLevel: number }[], rainbows: { playerId: string; rainbow: boolean }[], jobos: { playerId: string; jobo: boolean }[]) => void;
  onCommitTricks: (tricks: { playerId: string; tricksTaken: number }[]) => void;
  onClose: () => void;
}

function buildBidOrder(playerIds: string[], dealerPlayerId: string): number[] {
  const dealerIdx = playerIds.indexOf(dealerPlayerId);
  const order: number[] = [];
  for (let i = 1; i <= playerIds.length; i++) {
    order.push((dealerIdx + i) % playerIds.length);
  }
  return order;
}

function buildTricksOrder(playerIds: string[], round: Round): number[] {
  const dealerIdx = playerIds.indexOf(round.dealerPlayerId);
  // Sort by effective bid descending; ties broken by bid order (left of dealer first)
  const indexed = round.playerRounds.map((pr, pi) => {
    const effectiveBid = (pr.boardLevel ?? 0) > 0 ? round.handSize : pr.bid;
    // bidOrderPos: distance from dealer in clockwise direction (1-based, dealer = playerCount)
    const bidOrderPos = ((pi - dealerIdx + playerIds.length) % playerIds.length) || playerIds.length;
    return { pi, effectiveBid, bidOrderPos };
  });
  indexed.sort((a, b) => b.effectiveBid - a.effectiveBid || a.bidOrderPos - b.bidOrderPos);
  return indexed.map((x) => x.pi);
}

function createInitialState(
  initialPhase: 'trump' | 'tricks',
  playerCount: number,
  round: Round,
  tricksOrder: number[],
): FlowState {
  const rainbows = Object.fromEntries(round.playerRounds.map((pr) => [pr.playerId, false]));
  const jobos = Object.fromEntries(round.playerRounds.map((pr) => [pr.playerId, false]));

  if (initialPhase === 'tricks') {
    const bids = tricksOrder.map((pi) => ({
      bid: round.playerRounds[pi].bid,
      boardLevel: round.playerRounds[pi].boardLevel,
    }));
    return { phase: 'tricks', playerStep: 0, suit: round.trumpSuit, bids, tricks: Array(playerCount).fill(-1), rainbows, jobos };
  }

  return {
    phase: 'trump',
    playerStep: 0,
    suit: null,
    bids: Array.from({ length: playerCount }, () => ({ bid: 0, boardLevel: 0 })),
    tricks: Array(playerCount).fill(-1),
    rainbows,
    jobos,
  };
}

function flowReducer(state: FlowState, action: FlowAction, playerCount: number, handSize: number): FlowState {
  switch (action.type) {
    case 'SELECT_SUIT': {
      const isRainbow = handSize === RAINBOW_HAND_SIZE;
      return { ...state, phase: isRainbow ? 'rainbow' : 'bids', playerStep: 0, suit: action.suit };
    }

    case 'SET_BID': {
      const newBids = [...state.bids];
      newBids[state.playerStep] = { bid: action.bid, boardLevel: action.boardLevel };
      if (state.playerStep + 1 >= playerCount) {
        return { ...state, bids: newBids, phase: 'commit_bids' };
      }
      return { ...state, bids: newBids, playerStep: state.playerStep + 1 };
    }

    case 'SET_TRICKS': {
      const newTricks = [...state.tricks];
      newTricks[state.playerStep] = action.tricks;
      if (state.playerStep + 1 >= playerCount) {
        const total = newTricks.reduce((s, t) => s + t, 0);
        if (total !== handSize) {
          return { ...state, tricks: newTricks, phase: 'tricks_error' };
        }
        return { ...state, tricks: newTricks, phase: 'commit_tricks' };
      }
      return { ...state, tricks: newTricks, playerStep: state.playerStep + 1 };
    }

    case 'TOGGLE_RAINBOW':
      return { ...state, rainbows: { ...state.rainbows, [action.playerId]: !state.rainbows[action.playerId] } };

    case 'TOGGLE_JOBO':
      return { ...state, jobos: { ...state.jobos, [action.playerId]: !state.jobos[action.playerId] } };

    case 'DONE_RAINBOW':
      return { ...state, phase: 'jobo' };

    case 'DONE_JOBO':
      return { ...state, phase: 'bids', playerStep: 0 };

    case 'BACK': {
      if (state.phase === 'bids') {
        if (state.playerStep === 0) {
          const isRainbow = handSize === RAINBOW_HAND_SIZE;
          return { ...state, phase: isRainbow ? 'jobo' : 'trump' };
        }
        return { ...state, playerStep: state.playerStep - 1 };
      }
      if (state.phase === 'tricks') {
        return { ...state, playerStep: Math.max(0, state.playerStep - 1) };
      }
      if (state.phase === 'tricks_error') {
        return { ...state, phase: 'tricks', playerStep: playerCount - 1 };
      }
      if (state.phase === 'rainbow') {
        return { ...state, phase: 'trump' };
      }
      if (state.phase === 'jobo') {
        return { ...state, phase: 'rainbow' };
      }
      return state;
    }

    default:
      return state;
  }
}

export function EntryFlowOverlay({
  round,
  players,
  playerIds,
  initialPhase,
  onCommitBids,
  onCommitTricks,
  onClose,
}: EntryFlowOverlayProps) {
  const bidOrder = buildBidOrder(playerIds, round.dealerPlayerId);
  const tricksOrder = buildTricksOrder(playerIds, round);
  const playerCount = playerIds.length;

  const [state, dispatch] = useReducer(
    (s: FlowState, a: FlowAction) => flowReducer(s, a, playerCount, round.handSize),
    createInitialState(initialPhase, playerCount, round, tricksOrder),
  );

  // Commit bids (with rainbows and jobos if applicable)
  if (state.phase === 'commit_bids') {
    const bids = bidOrder.map((pi, i) => ({
      playerId: playerIds[pi],
      bid: state.bids[i].bid,
      boardLevel: state.bids[i].boardLevel,
    }));
    const rainbows = playerIds.map((pid) => ({
      playerId: pid,
      rainbow: state.rainbows[pid] ?? false,
    }));
    const jobos = playerIds.map((pid) => ({
      playerId: pid,
      jobo: state.jobos[pid] ?? false,
    }));
    onCommitBids(state.suit!, bids, rainbows, jobos);
    return null;
  }

  // Commit tricks
  if (state.phase === 'commit_tricks') {
    const tricks = tricksOrder.map((pi, i) => ({
      playerId: playerIds[pi],
      tricksTaken: state.tricks[i],
    }));
    onCommitTricks(tricks);
    return null;
  }

  // Tricks validation error
  if (state.phase === 'tricks_error') {
    const totalTricks = state.tricks.reduce((s, t) => s + t, 0);
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-xl font-bold">Tricks don't add up!</div>
          <p className="text-slate-400">
            Total: {totalTricks} / {round.handSize} cards
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: 'BACK' })}
            className="px-6 py-3 rounded-xl bg-blue-500 text-white font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Rainbow step
  if (state.phase === 'rainbow') {
    const playerList = playerIds.map((pid) => ({
      id: pid,
      name: players.find((p) => p.id === pid)?.name ?? '?',
    }));
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col">
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-slate-400">
            Round {round.roundIndex + 1} &middot; {round.handSize} cards
          </span>
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white text-2xl">
            &times;
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <RainbowStep
            players={playerList}
            rainbows={state.rainbows}
            onToggle={(pid) => dispatch({ type: 'TOGGLE_RAINBOW', playerId: pid })}
            onDone={() => dispatch({ type: 'DONE_RAINBOW' })}
            onBack={() => dispatch({ type: 'BACK' })}
          />
        </div>
      </div>
    );
  }

  // JoBo step
  if (state.phase === 'jobo') {
    const playerList = playerIds.map((pid) => ({
      id: pid,
      name: players.find((p) => p.id === pid)?.name ?? '?',
    }));
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col">
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-slate-400">
            Round {round.roundIndex + 1} &middot; {round.handSize} cards
          </span>
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white text-2xl">
            &times;
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <JoBoStep
            players={playerList}
            jobos={state.jobos}
            onToggle={(pid) => dispatch({ type: 'TOGGLE_JOBO', playerId: pid })}
            onDone={() => dispatch({ type: 'DONE_JOBO' })}
            onBack={() => dispatch({ type: 'BACK' })}
          />
        </div>
      </div>
    );
  }

  // Current player info
  const currentBidTotal = state.bids
    .slice(0, state.playerStep)
    .reduce((sum, b) => sum + (b.boardLevel > 0 ? round.handSize : b.bid), 0);

  const currentTrickTotal = state.tricks
    .slice(0, state.playerStep)
    .reduce((sum, t) => sum + (t >= 0 ? t : 0), 0);

  const maxBoardInRound = Math.max(0, ...state.bids.slice(0, state.playerStep).map((b) => b.boardLevel));

  const currentOrder = state.phase === 'tricks' ? tricksOrder : bidOrder;
  const currentPlayerGlobalIdx = currentOrder[state.playerStep];
  const currentPlayer = players.find((p) => p.id === playerIds[currentPlayerGlobalIdx]);
  const currentPlayerName = currentPlayer?.name ?? '?';
  const isDealer = playerIds[currentPlayerGlobalIdx] === round.dealerPlayerId;

  const handleBack = () => {
    if (state.phase === 'tricks' && state.playerStep === 0) {
      onClose();
    } else {
      dispatch({ type: 'BACK' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col">
      <div className="flex items-center justify-between p-4">
        <span className="text-sm text-slate-400">
          Round {round.roundIndex + 1} &middot; {round.handSize} cards
        </span>
        <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white text-2xl">
          &times;
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {state.phase === 'trump' && (
          <TrumpStep
            handSize={round.handSize}
            dealerName={players.find((p) => p.id === round.dealerPlayerId)?.name ?? '?'}
            onSelect={(suit) => dispatch({ type: 'SELECT_SUIT', suit })}
          />
        )}

        {state.phase === 'bids' && (
          <BidStep
            playerName={currentPlayerName}
            isDealer={isDealer}
            handSize={round.handSize}
            currentBidTotal={currentBidTotal}
            currentPlayerIndex={state.playerStep}
            totalPlayers={playerCount}
            selected={state.bids[state.playerStep].boardLevel === 0 ? null : state.bids[state.playerStep].bid}
            boardLevel={state.bids[state.playerStep].boardLevel}
            maxBoardInRound={maxBoardInRound}
            onBid={(bid, boardLevel) => dispatch({ type: 'SET_BID', bid, boardLevel })}
            onBack={handleBack}
          />
        )}

        {state.phase === 'tricks' && (
          <TricksStep
            playerName={currentPlayerName}
            bid={state.bids[state.playerStep].bid}
            isBoard={state.bids[state.playerStep].boardLevel > 0}
            handSize={round.handSize}
            currentTrickTotal={currentTrickTotal}
            currentPlayerIndex={state.playerStep}
            totalPlayers={playerCount}
            isLastPlayer={state.playerStep === playerCount - 1}
            selected={state.tricks[state.playerStep] >= 0 ? state.tricks[state.playerStep] : null}
            onTricks={(n) => dispatch({ type: 'SET_TRICKS', tricks: n })}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
