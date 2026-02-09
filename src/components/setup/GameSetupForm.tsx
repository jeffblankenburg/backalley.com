import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayers } from '../../hooks/usePlayers.ts';
import { useGameStore } from '../../store/gameStore.ts';
import { useAuthContext } from '../../context/AuthContext.tsx';
import { PlayerSelector } from './PlayerSelector.tsx';
import { DealerPicker } from './DealerPicker.tsx';
import { PLAYER_COUNT } from '../../lib/constants.ts';

export function GameSetupForm() {
  const { players } = usePlayers();
  const createGame = useGameStore((s) => s.createGame);
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dealerIndex, setDealerIndex] = useState<number | null>(null);

  const selectedPlayers = selectedIds.map((id) => players.find((p) => p.id === id)!).filter(Boolean);

  function handleToggle(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        if (dealerIndex !== null && dealerIndex >= next.length) setDealerIndex(null);
        return next;
      }
      if (prev.length >= PLAYER_COUNT) return prev;
      return [...prev, id];
    });
  }

  async function handleStart() {
    if (selectedIds.length !== PLAYER_COUNT || dealerIndex === null || !user) return;
    const id = await createGame(selectedIds, dealerIndex, user.id);
    navigate(`/game/${id}`);
  }

  return (
    <div className="space-y-6">
      <PlayerSelector players={players} selected={selectedIds} onToggle={handleToggle} />

      {selectedIds.length === PLAYER_COUNT && (
        <DealerPicker
          players={selectedPlayers}
          selectedIndex={dealerIndex}
          onSelect={setDealerIndex}
        />
      )}

      <button
        onClick={handleStart}
        disabled={selectedIds.length !== PLAYER_COUNT || dealerIndex === null}
        className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-lg disabled:opacity-40 transition-colors hover:bg-emerald-600"
      >
        Start Game
      </button>
    </div>
  );
}
