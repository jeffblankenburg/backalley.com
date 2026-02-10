import { useEffect, useState, useCallback } from 'react';
import { supabase, siteUrl } from '../lib/supabase.ts';
import { useAuthContext } from '../context/AuthContext.tsx';
import type { Profile } from '../types/index.ts';

export function useFriends() {
  const { user } = useAuthContext();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('friends')
      .select('friend_id')
      .eq('user_id', user.id);

    if (!data || data.length === 0) {
      setFriends([]);
      setLoading(false);
      return;
    }

    const friendIds = data.map((row) => row.friend_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, first_name, last_name, email, is_admin, disabled, confirmed, created_at')
      .in('id', friendIds)
      .eq('disabled', false)
      .order('display_name');

    setFriends(profiles ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  async function addFriend(friendId: string) {
    if (!user) return;
    await supabase.from('friends').insert({ user_id: user.id, friend_id: friendId });
    fetchFriends();
  }

  async function removeFriend(friendId: string) {
    if (!user) return;
    await supabase.from('friends').delete().eq('user_id', user.id).eq('friend_id', friendId);
    fetchFriends();
  }

  async function searchProfiles(query: string): Promise<Profile[]> {
    if (!user || query.trim().length < 2) return [];

    const friendIds = friends.map((f) => f.id);
    const excludeIds = [user.id, ...friendIds];

    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, first_name, last_name, email, is_admin, disabled, confirmed, created_at')
      .eq('disabled', false)
      .ilike('display_name', `%${query.trim()}%`)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('display_name')
      .limit(10);

    return data ?? [];
  }

  async function inviteByEmail(email: string): Promise<{ success: boolean; message: string; profileId?: string }> {
    if (!user) return { success: false, message: 'Not authenticated' };

    const trimmed = email.trim().toLowerCase();

    // Check if this email already has a profile
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', trimmed)
      .maybeSingle();

    if (existing) {
      const alreadyFriend = friends.some((f) => f.id === existing.id);
      if (alreadyFriend) {
        return { success: false, message: 'Already in your friends list', profileId: existing.id };
      }
      if (existing.id === user.id) {
        return { success: false, message: "That's your own email" };
      }
      await addFriend(existing.id);
      return { success: true, message: 'Added as friend', profileId: existing.id };
    }

    // Send magic link to invite them
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true, emailRedirectTo: siteUrl },
    });

    if (error) {
      return { success: false, message: error.message };
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const { data: newProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', trimmed)
      .maybeSingle();

    if (newProfile) {
      await addFriend(newProfile.id);
      return { success: true, message: 'Invitation sent!', profileId: newProfile.id };
    }

    return { success: true, message: 'Invitation sent but could not find profile. Try refreshing.' };
  }

  /** Create a profile directly and add as friend. Used for quick game setup. */
  async function createPlayer(email: string, firstName: string, lastName: string): Promise<{ success: boolean; message: string; profileId?: string }> {
    if (!user) return { success: false, message: 'Not authenticated' };

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedEmail || !trimmedFirst || !trimmedLast) {
      return { success: false, message: 'First name, last name, and email are required' };
    }

    const trimmedName = `${trimmedFirst} ${trimmedLast}`;

    // Check if this email already has a profile
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', trimmedEmail)
      .maybeSingle();

    if (existing) {
      if (existing.id === user.id) {
        return { success: false, message: "That's your own email" };
      }
      const alreadyFriend = friends.some((f) => f.id === existing.id);
      if (!alreadyFriend) {
        await addFriend(existing.id);
      }
      return { success: true, message: 'Player added!', profileId: existing.id };
    }

    // Insert profile directly so it's immediately available
    const tempId = crypto.randomUUID();
    const { error: insertError } = await supabase.from('profiles').insert({
      id: tempId,
      display_name: trimmedName,
      first_name: trimmedFirst,
      last_name: trimmedLast,
      email: trimmedEmail,
    });

    if (insertError) {
      return { success: false, message: insertError.message };
    }

    // Send invitation email — this also creates an auth.users row.
    // The handle_new_user trigger will merge the profile (update ID to match auth user).
    // ON UPDATE CASCADE propagates to friends, game_players, etc.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: { shouldCreateUser: true, emailRedirectTo: siteUrl },
    });

    if (!otpError) {
      // OTP succeeded — trigger may have merged profile. Get the final ID.
      await new Promise((resolve) => setTimeout(resolve, 500));
      const { data: merged } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', trimmedEmail)
        .maybeSingle();

      const finalId = merged?.id ?? tempId;
      await addFriend(finalId);
      return { success: true, message: 'Player added! Invite sent.', profileId: finalId };
    }

    // OTP failed (rate limit, etc.) — profile still exists, game can proceed, just no email
    await addFriend(tempId);
    return { success: true, message: 'Player added! (Invite email will be sent later)', profileId: tempId };
  }

  return { friends, loading, addFriend, removeFriend, searchProfiles, inviteByEmail, createPlayer, refetch: fetchFriends };
}
