-- ─────────────────────────────────────────────────────────────────────────────
-- Likes + chat. Mutual like ("match") unlocks chat between two users.
-- Each user is capped at 5 likes per venue per visit.
-- ─────────────────────────────────────────────────────────────────────────────

-- LIKES — one row per A→B direction. A match = both A→B and B→A exist.
create table if not exists public.likes (
  id            uuid primary key default gen_random_uuid(),
  venue_id      uuid not null references public.venues(id)  on delete cascade,
  from_user_id  uuid not null references auth.users(id)     on delete cascade,
  to_user_id    uuid not null references auth.users(id)     on delete cascade,
  created_at    timestamptz default now(),
  unique (venue_id, from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);
create index if not exists likes_venue_from_idx on public.likes (venue_id, from_user_id);
create index if not exists likes_venue_to_idx   on public.likes (venue_id, to_user_id);

-- 5-like cap per user per venue (DB-enforced)
create or replace function public.enforce_like_limit() returns trigger
language plpgsql as $$
declare
  current_count int;
begin
  select count(*) into current_count
    from public.likes
    where venue_id = new.venue_id and from_user_id = new.from_user_id;
  if current_count >= 5 then
    raise exception 'like_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_like_limit on public.likes;
create trigger trg_like_limit
  before insert on public.likes
  for each row execute function public.enforce_like_limit();

-- Convenience: is there a mutual like between two users in a venue?
create or replace function public.is_match(venue uuid, user_a uuid, user_b uuid)
returns boolean
language sql security definer stable as $$
  select
    exists(select 1 from public.likes
           where venue_id = venue and from_user_id = user_a and to_user_id = user_b)
    and
    exists(select 1 from public.likes
           where venue_id = venue and from_user_id = user_b and to_user_id = user_a)
$$;

grant execute on function public.is_match(uuid, uuid, uuid) to anon, authenticated;

-- RLS — users can read likes they sent or received; insert only their own
alter table public.likes enable row level security;
drop policy if exists "likes read"   on public.likes;
drop policy if exists "likes insert" on public.likes;
drop policy if exists "likes delete" on public.likes;

create policy "likes read" on public.likes for select using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);
create policy "likes insert" on public.likes for insert with check (auth.uid() = from_user_id);
create policy "likes delete" on public.likes for delete using (auth.uid() = from_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CHAT MESSAGES — only sendable between matched users
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.chat_messages (
  id            uuid primary key default gen_random_uuid(),
  venue_id      uuid not null references public.venues(id) on delete cascade,
  from_user_id  uuid not null references auth.users(id)    on delete cascade,
  to_user_id    uuid not null references auth.users(id)    on delete cascade,
  text          text not null check (char_length(text) between 1 and 1000),
  created_at    timestamptz default now()
);
create index if not exists chat_messages_pair_idx
  on public.chat_messages (venue_id, from_user_id, to_user_id, created_at desc);
create index if not exists chat_messages_pair_rev_idx
  on public.chat_messages (venue_id, to_user_id, from_user_id, created_at desc);

alter table public.chat_messages enable row level security;
drop policy if exists "chat read"   on public.chat_messages;
drop policy if exists "chat insert" on public.chat_messages;

-- Only sender + recipient can read; only mutual-likers can send
create policy "chat read" on public.chat_messages for select using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);

create policy "chat insert" on public.chat_messages for insert with check (
  auth.uid() = from_user_id
  and public.is_match(venue_id, from_user_id, to_user_id)
);

-- Realtime
do $$ begin
  begin alter publication supabase_realtime add table public.likes;
  exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.chat_messages;
  exception when duplicate_object then null; end;
end $$;
