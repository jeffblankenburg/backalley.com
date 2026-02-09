import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.ts';
import type { Profile, Player } from '../types/index.ts';
import { profileToPlayer } from '../types/index.ts';

export function usePlayers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, email, created_at')
      .order('display_name');
    if (data) {
      setProfiles(data);
      setPlayers(data.map(profileToPlayer));
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  async function updateDisplayName(userId: string, name: string) {
    await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', userId);
    fetchProfiles();
  }

  return { profiles, players, updateDisplayName, refetch: fetchProfiles };
}
