-- ─────────────────────────────────────────────────────────────────────────────
-- WIA — initial database schema
-- ─────────────────────────────────────────────────────────────────────────────
-- Paste this into Supabase SQL Editor and click "Run". Idempotent — safe to
-- re-run (everything is `if not exists` or `on conflict do nothing`).
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ─── Tables ──────────────────────────────────────────────────────────────────

-- VENUES — physical businesses with a WIA presence
create table if not exists public.venues (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  tagline         text default '',
  category        text not null check (category in (
    'bar','club','cafe','festival','campus','gym',
    'coworking','hotel','airport','beach','event'
  )),
  lat             double precision not null,
  lng             double precision not null,
  radius_meters  int not null default 50,
  is_active       boolean default true,
  is_premium      boolean default false,
  owner_id        uuid references auth.users(id) on delete set null,
  -- Used to sign QR codes — rotated by admin to invalidate old codes
  scan_secret     uuid not null default gen_random_uuid(),
  created_at      timestamptz default now()
);
create index if not exists venues_slug_idx     on public.venues (slug);
create index if not exists venues_owner_id_idx on public.venues (owner_id);

-- MASTER PROFILES — long-lived per-user fields beyond auth.users
create table if not exists public.master_profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  name        text,
  age         int  check (age between 16 and 99),
  gender      text check (gender in ('woman','man','non-binary','unspecified')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- PRESENCE — temporary identity for one user, one venue, one visit
create table if not exists public.presence (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  venue_id      uuid not null references public.venues(id) on delete cascade,
  name          text not null,
  age           int  not null check (age between 16 and 99),
  gender        text not null check (gender in ('woman','man','non-binary','unspecified')),
  status_text   text not null check (char_length(status_text) <= 200),
  selfie_url    text not null,
  is_ghost_mode boolean default false,
  is_visible    boolean default true,
  joined_at     timestamptz default now(),
  last_seen_at  timestamptz default now(),
  expires_at    timestamptz not null,
  unique (user_id, venue_id)
);
create index if not exists presence_venue_active_idx
  on public.presence (venue_id, expires_at desc) where is_visible;

-- ADMIN USERS — who can create / manage venues
create table if not exists public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  granted_at  timestamptz default now()
);

-- WAVES — quick interactions between people in the same room
create table if not exists public.waves (
  id                uuid primary key default gen_random_uuid(),
  venue_id          uuid not null references public.venues(id) on delete cascade,
  from_presence_id  uuid not null references public.presence(id) on delete cascade,
  to_presence_id    uuid not null references public.presence(id) on delete cascade,
  emoji             text default '👋',
  created_at        timestamptz default now()
);
create index if not exists waves_recipient_idx on public.waves (to_presence_id, created_at desc);

-- ─── Helper functions ────────────────────────────────────────────────────────

create or replace function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;

-- Auto-touch updated_at on master_profiles
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
  begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_master_profiles_touch on public.master_profiles;
create trigger trg_master_profiles_touch
  before update on public.master_profiles
  for each row execute function public.touch_updated_at();

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.venues          enable row level security;
alter table public.presence        enable row level security;
alter table public.waves           enable row level security;
alter table public.admin_users     enable row level security;
alter table public.master_profiles enable row level security;

-- VENUES — public read, admin write
drop policy if exists "venues read"   on public.venues;
drop policy if exists "venues insert" on public.venues;
drop policy if exists "venues update" on public.venues;
drop policy if exists "venues delete" on public.venues;

create policy "venues read"   on public.venues for select using (true);
create policy "venues insert" on public.venues for insert with check (public.is_admin());
create policy "venues update" on public.venues for update
  using (public.is_admin())   with check (public.is_admin());
create policy "venues delete" on public.venues for delete using (public.is_admin());

-- MASTER PROFILES — users manage their own
drop policy if exists "master read"   on public.master_profiles;
drop policy if exists "master insert" on public.master_profiles;
drop policy if exists "master update" on public.master_profiles;

create policy "master read"   on public.master_profiles for select using (auth.uid() = user_id);
create policy "master insert" on public.master_profiles for insert with check (auth.uid() = user_id);
create policy "master update" on public.master_profiles for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- PRESENCE — signed-in users see all live presence; manage only own
drop policy if exists "presence read"   on public.presence;
drop policy if exists "presence insert" on public.presence;
drop policy if exists "presence update" on public.presence;
drop policy if exists "presence delete" on public.presence;

create policy "presence read" on public.presence for select
  using (auth.uid() is not null and is_visible = true and expires_at > now());
create policy "presence insert" on public.presence for insert
  with check (auth.uid() = user_id);
create policy "presence update" on public.presence for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "presence delete" on public.presence for delete
  using (auth.uid() = user_id);

-- WAVES — visible to sender + recipient; send only from your own presence
drop policy if exists "waves read"   on public.waves;
drop policy if exists "waves insert" on public.waves;

create policy "waves read" on public.waves for select using (
  auth.uid() = (select user_id from public.presence where id = from_presence_id)
  or
  auth.uid() = (select user_id from public.presence where id = to_presence_id)
);
create policy "waves insert" on public.waves for insert with check (
  auth.uid() = (select user_id from public.presence where id = from_presence_id)
);

-- ADMIN USERS — users see their own admin row only
drop policy if exists "admin self read" on public.admin_users;
create policy "admin self read" on public.admin_users for select using (auth.uid() = user_id);

-- ─── Storage: selfies bucket ─────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('selfies', 'selfies', true, 5242880)
on conflict (id) do nothing;

drop policy if exists "selfies public read" on storage.objects;
drop policy if exists "selfies own write"   on storage.objects;
drop policy if exists "selfies own update"  on storage.objects;

create policy "selfies public read" on storage.objects for select
  using (bucket_id = 'selfies');

create policy "selfies own write" on storage.objects for insert with check (
  bucket_id = 'selfies'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "selfies own update" on storage.objects for update using (
  bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text
);

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Enable broadcast of changes on presence + waves to subscribed clients
do $$ begin
  begin
    alter publication supabase_realtime add table public.presence;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.waves;
  exception when duplicate_object then null; end;
end $$;
