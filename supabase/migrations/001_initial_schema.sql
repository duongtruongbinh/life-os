-- Life OS schema: user_settings, daily_logs, tasks + RLS.
-- Run in Supabase Dashboard > SQL Editor (or: supabase db push).

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. User Settings (Theme, Goals)
create table if not exists user_settings (
  user_id uuid references auth.users not null primary key,
  pushup_goal int default 50,
  created_at timestamptz default now()
);

-- 2. Daily Logs (The Core Table - One row per day per user)
create table if not exists daily_logs (
  user_id uuid references auth.users not null,
  date date not null,

  -- Sleep Tracking
  sleep_start timestamptz,
  sleep_end timestamptz,
  sleep_quality int,

  -- Habits (Stored as JSONB to save rows: {"read": true, "code": false})
  habits_status jsonb default '{}'::jsonb,

  -- Pushups (Total count for the day)
  pushup_count int default 0,

  -- Quick Notes
  notes text,

  primary key (user_id, date)
);

-- 3. Tasks (Standard Todo)
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  is_completed boolean default false,
  priority text check (priority in ('urgent', 'high', 'normal')),
  due_date timestamptz,
  created_at timestamptz default now()
);

-- RLS Policies (Single User Privacy)
alter table user_settings enable row level security;
alter table daily_logs enable row level security;
alter table tasks enable row level security;

create policy "Users manage their own settings" on user_settings for all using (auth.uid() = user_id);
create policy "Users manage their own logs" on daily_logs for all using (auth.uid() = user_id);
create policy "Users manage their own tasks" on tasks for all using (auth.uid() = user_id);
