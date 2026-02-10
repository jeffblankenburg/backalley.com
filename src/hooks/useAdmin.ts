import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.ts';
import { useAuthContext } from '../context/AuthContext.tsx';
import type { Profile } from '../types/index.ts';

export function useAdmin() {
  const { user } = useAuthContext();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, first_name, last_name, email, is_admin, disabled, confirmed, created_at')
      .order('display_name');
    if (data) {
      setProfiles(data);
      setIsAdmin(data.some((p) => p.id === user?.id && p.is_admin));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  async function updateProfile(userId: string, fields: { display_name?: string; first_name?: string; last_name?: string; is_admin?: boolean; disabled?: boolean }) {
    await supabase.from('profiles').update(fields).eq('id', userId);
    fetchProfiles();
  }

  return { profiles, isAdmin, loading, updateProfile, refetch: fetchProfiles };
}
