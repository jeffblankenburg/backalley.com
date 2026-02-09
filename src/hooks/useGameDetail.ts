import { useEffect, useState } from 'react';
import { loadGameFromSupabase } from '../lib/supabaseGameService.ts';
import type { Game } from '../types/index.ts';

export function useGameDetail(id: string | undefined) {
  const [game, setGame] = useState<Game | undefined>();

  useEffect(() => {
    if (!id) return;
    loadGameFromSupabase(id).then((result) => {
      setGame(result?.game);
    });
  }, [id]);

  return { game };
}
