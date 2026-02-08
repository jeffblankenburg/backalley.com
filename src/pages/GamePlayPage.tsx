import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore.ts';
import { usePlayers } from '../hooks/usePlayers.ts';
import { ReadOnlyScoreGrid } from '../components/game/ReadOnlyScoreGrid.tsx';
import { EntryFlowOverlay } from '../components/game/EntryFlowOverlay.tsx';
import { AnnounceScoresButton } from '../components/game/AnnounceScoresButton.tsx';
import { GameCompleteModal } from '../components/game/GameCompleteModal.tsx';
import type { Suit } from '../types/index.ts';
import { playApplause } from '../lib/sounds.ts';

export function GamePlayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { players } = usePlayers();
  const game = useGameStore((s) => s.game);
  const loadGame = useGameStore((s) => s.loadGame);
  const setBidsForRound = useGameStore((s) => s.setBidsForRound);
  const setTricksForRound = useGameStore((s) => s.setTricksForRound);
  const setRainbowsForRound = useGameStore((s) => s.setRainbowsForRound);
  const completeRound = useGameStore((s) => s.completeRound);


  const [showComplete, setShowComplete] = useState(false);
  const [entryFlow, setEntryFlow] = useState<{ roundIndex: number; phase: 'trump' | 'tricks' } | null>(null);

  useEffect(() => {
    if (id && (!game || game.id !== id)) {
      loadGame(id);
    }
  }, [id, game, loadGame]);

  if (!game) {
    return <p className="text-center py-12 text-slate-500">Loading game...</p>;
  }

  function handleEnterBids(roundIndex: number) {
    setEntryFlow({ roundIndex, phase: 'trump' });
  }

  function handleEnterTricks(roundIndex: number) {
    setEntryFlow({ roundIndex, phase: 'tricks' });
  }


  function handleCommitBids(suit: Suit, bids: { playerId: string; bid: number; boardLevel: number }[], rainbows: { playerId: string; rainbow: boolean }[]) {
    if (!entryFlow || !game) return;
    const round = game.rounds[entryFlow.roundIndex];
    const totalBids = bids.reduce((sum, b) => sum + (b.boardLevel > 0 ? round.handSize : b.bid), 0);
    if (totalBids === round.handSize) {
      playApplause();
    }
    setBidsForRound(entryFlow.roundIndex, suit, bids);
    setRainbowsForRound(entryFlow.roundIndex, rainbows);
    setEntryFlow(null);
  }

  function handleCommitTricks(tricks: { playerId: string; tricksTaken: number }[]) {
    if (!entryFlow || !game) return;
    setTricksForRound(entryFlow.roundIndex, tricks);
    completeRound(entryFlow.roundIndex);
    setEntryFlow(null);

    // Check if game is now complete (last round)
    if (entryFlow.roundIndex >= game.rounds.length - 1) {
      setShowComplete(true);
    }
  }

  return (
    <div className="space-y-4">
      <ReadOnlyScoreGrid
        game={game}
        players={players}
        onEnterBids={handleEnterBids}
        onEnterTricks={handleEnterTricks}
      />

      <AnnounceScoresButton game={game} players={players} currentRoundIndex={game.currentRoundIndex} />

      {entryFlow && (
        <EntryFlowOverlay
          round={game.rounds[entryFlow.roundIndex]}
          players={players}
          playerIds={game.playerIds}
          initialPhase={entryFlow.phase}
          onCommitBids={handleCommitBids}
          onCommitTricks={handleCommitTricks}
          onClose={() => setEntryFlow(null)}
        />
      )}

      <GameCompleteModal
        open={showComplete}
        game={game}
        players={players}
        onViewSummary={() => {
          setShowComplete(false);
          navigate(`/game/${game.id}/summary`);
        }}
      />
    </div>
  );
}
