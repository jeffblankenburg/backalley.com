import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext.tsx';
import { fetchAllGamesForUser } from '../lib/supabaseGameService.ts';
import type { Game } from '../types/index.ts';

export function useGames() {
  const { user } = useAuthContext();
  const [games, setGames] = useState<Game[]>([]);

  const refetch = useCallback(async () => {
    if (!user) return;
    const data = await fetchAllGamesForUser(user.id);
    setGames(data);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { games, refetch };
}
