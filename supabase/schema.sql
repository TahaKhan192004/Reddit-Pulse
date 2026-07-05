-- Reddit scraping pipeline schema.
-- Run once in the Supabase SQL editor.

create table if not exists config (
  mode text primary key check (mode in ('keyword', 'phrase', 'subreddit')),
  enabled boolean not null default true,
  scheduled_times jsonb not null default '[]',
  times_per_day int not null default 0,
  limit_per_target int not null default 25,
  time_filter text not null default 'month',
  last_run_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists keywords (
  id bigserial primary key,
  keyword text not null unique,
  activated boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists phrases (
  id bigserial primary key,
  phrase text not null unique,
  activated boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists subreddits (
  id bigserial primary key,
  subreddit text not null unique,
  activated boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists posts_based_on_keyword (
  id bigserial primary key,
  keyword_id bigint references keywords(id) on delete set null,
  keyword text not null,
  subreddit text,
  title text,
  selftext text,
  url text,
  permalink text not null unique,
  score int,
  num_comments int,
  created_utc double precision,
  scraped_at timestamptz not null default now()
);

create table if not exists posts_based_on_phrases (
  id bigserial primary key,
  phrase_id bigint references phrases(id) on delete set null,
  phrase text not null,
  subreddit text,
  title text,
  selftext text,
  url text,
  permalink text not null unique,
  score int,
  num_comments int,
  created_utc double precision,
  match_score numeric not null,
  scraped_at timestamptz not null default now()
);

create table if not exists posts_based_on_subreddit (
  id bigserial primary key,
  subreddit_id bigint references subreddits(id) on delete set null,
  subreddit text not null,
  title text,
  selftext text,
  url text,
  permalink text not null unique,
  score int,
  num_comments int,
  created_utc double precision,
  scraped_at timestamptz not null default now()
);

-- Seed one config row per mode.
insert into config (mode, enabled, scheduled_times, times_per_day, limit_per_target, time_filter)
values
  ('keyword', true, '["06:00", "14:00", "20:00"]', 3, 25, 'month'),
  ('phrase', true, '["06:00", "14:00", "20:00"]', 3, 25, 'month'),
  ('subreddit', true, '["06:00", "14:00", "20:00"]', 3, 25, 'month')
on conflict (mode) do nothing;
