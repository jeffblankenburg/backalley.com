import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.ts';
import type { Profile, Player } from '../types/index.ts';
import { profileToPlayer } from '../types/index.ts';

export function usePlayers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, first_name, last_name, email, is_admin, disabled, confirmed, created_at')
      .order('display_name');
    if (data) {
      setProfiles(data);
      setPlayers(data.map(profileToPlayer));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  async function updateName(userId: string, firstName: string, lastName: string) {
    const displayName = `${firstName.trim()} ${lastName.trim()}`;
    await supabase.from('profiles').update({
      display_name: displayName,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    }).eq('id', userId);
    await supabase.auth.updateUser({ data: { display_name: displayName } });
    fetchProfiles();
  }

  return { profiles, players, loading, updateName, refetch: fetchProfiles };
}
