-- Add confirmed column to profiles
alter table public.profiles add column confirmed boolean not null default false;

-- Mark all existing users who have an auth.users entry as confirmed
update public.profiles set confirmed = true
where id in (select id from auth.users);

-- Update the trigger to set confirmed = true when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.profiles where email = new.email and id != new.id) then
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
