-- Dynamic habit definitions per user. Run in Supabase Dashboard > SQL Editor.

create table if not exists habit_definitions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  icon text,
  color text,
  created_at timestamptz default now()
);

alter table habit_definitions enable row level security;
create policy "Manage own habits" on habit_definitions for all using (auth.uid() = user_id);
