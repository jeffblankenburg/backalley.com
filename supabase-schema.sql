-- Back Alley Scorekeeper — Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- ══════════════════════════════════════════════
-- 1. PROFILES (central user table — may or may not have an auth.users row)
-- ══════════════════════════════════════════════

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  email text,
  is_admin boolean not null default false,
  disabled boolean not null default false,
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile when a new user signs up, or merge with existing invited profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- Check if an invited profile with this email already exists
  if exists (select 1 from public.profiles where email = new.email and id != new.id) then
    -- Update the existing profile's ID to match the auth user's ID.
    -- ON UPDATE CASCADE on child tables propagates this change automatically.
    update public.profiles set id = new.id, confirmed = true, updated_at = now()
    where email = new.email and id != new.id;
  else
    insert into public.profiles (id, display_name, first_name, last_name, email, confirmed)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data ->> 'first_name', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data ->> 'last_name', ''),
      new.email,
      true
    );
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ══════════════════════════════════════════════
-- 2. GAMES
-- ══════════════════════════════════════════════

create table public.games (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'setup',
  starting_dealer_index int not null default 0,
  current_round_index int not null default 0,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index idx_games_status on public.games(status);
create index idx_games_created_by on public.games(created_by);

-- ══════════════════════════════════════════════
-- 3. GAME_PLAYERS (seat order)
-- ══════════════════════════════════════════════

create table public.game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on update cascade,
  seat_position int not null,
  unique(game_id, user_id),
  unique(game_id, seat_position)
);

create index idx_game_players_game_id on public.game_players(game_id);
create index idx_game_players_user_id on public.game_players(user_id);

-- ══════════════════════════════════════════════
-- 4. ROUNDS
-- ══════════════════════════════════════════════

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  round_index int not null,
  hand_size int not null,
  trump_suit text,
  dealer_user_id uuid not null references public.profiles(id) on update cascade,
  bids_entered boolean not null default false,
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(game_id, round_index)
);

create index idx_rounds_game_id on public.rounds(game_id);

-- ══════════════════════════════════════════════
-- 5. PLAYER_ROUNDS
-- ══════════════════════════════════════════════

create table public.player_rounds (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on update cascade,
  bid int not null default 0,
  board_level int not null default 0,
  tricks_taken int not null default 0,
  rainbow boolean not null default false,
  jobo boolean not null default false,
  score int not null default 0,
  cumulative_score int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(round_id, user_id)
);

create index idx_player_rounds_round_id on public.player_rounds(round_id);
create index idx_player_rounds_user_id on public.player_rounds(user_id);

-- ══════════════════════════════════════════════
-- 6. FRIENDS (one-directional friendship)
-- ══════════════════════════════════════════════

create table public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on update cascade on delete cascade,
  friend_id uuid not null references public.profiles(id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, friend_id)
);

create index idx_friends_user_id on public.friends(user_id);
create index idx_friends_friend_id on public.friends(friend_id);

-- ══════════════════════════════════════════════
-- 7. ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_players enable row level security;
alter table public.rounds enable row level security;
alter table public.player_rounds enable row level security;
alter table public.friends enable row level security;

-- PROFILES: authenticated can read all, update own, insert new (for inviting players)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

create policy "Authenticated users can insert profiles"
  on public.profiles for insert
  to authenticated
  with check (true);

-- Helper function: returns game_ids for the current user (bypasses RLS to avoid recursion)
create or replace function public.user_game_ids()
returns setof uuid
language sql
security definer
set search_path = ''
stable
as $$
  select game_id from public.game_players where user_id = auth.uid()
$$;

-- GAMES: participants can read/update; creator can insert/delete
create policy "Games viewable by participants or creator"
  on public.games for select
  to authenticated
  using (id in (select public.user_game_ids()) or created_by = auth.uid());

create policy "Games insertable by creator"
  on public.games for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Games updatable by participants"
  on public.games for update
  to authenticated
  using (id in (select public.user_game_ids()));

create policy "Games deletable by creator"
  on public.games for delete
  to authenticated
  using (created_by = auth.uid());

-- GAME_PLAYERS: visible to game participants; insertable by game creator
create policy "Game players viewable by participants"
  on public.game_players for select
  to authenticated
  using (game_id in (select public.user_game_ids()));

create policy "Game players insertable by game creator"
  on public.game_players for insert
  to authenticated
  with check (
    game_id in (select id from public.games where created_by = auth.uid())
  );

-- ROUNDS: visible/insertable/updatable by game participants
create policy "Rounds viewable by game participants"
  on public.rounds for select
  to authenticated
  using (game_id in (select public.user_game_ids()));

create policy "Rounds insertable by game participants"
  on public.rounds for insert
  to authenticated
  with check (game_id in (select public.user_game_ids()));

create policy "Rounds updatable by game participants"
  on public.rounds for update
  to authenticated
  using (game_id in (select public.user_game_ids()));

-- PLAYER_ROUNDS: visible/insertable/updatable by game participants (via round → game)
create policy "Player rounds viewable by game participants"
  on public.player_rounds for select
  to authenticated
  using (
    round_id in (select id from public.rounds where game_id in (select public.user_game_ids()))
  );

create policy "Player rounds insertable by game participants"
  on public.player_rounds for insert
  to authenticated
  with check (
    round_id in (select id from public.rounds where game_id in (select public.user_game_ids()))
  );

create policy "Player rounds updatable by game participants"
  on public.player_rounds for update
  to authenticated
  using (
    round_id in (select id from public.rounds where game_id in (select public.user_game_ids()))
  );

-- FRIENDS: users manage their own friend list
create policy "Users can view own friends"
  on public.friends for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can add friends"
  on public.friends for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can remove friends"
  on public.friends for delete
  to authenticated
  using (user_id = auth.uid());
