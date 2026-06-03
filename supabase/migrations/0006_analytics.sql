-- Track when a user explicitly left (soft-delete) so we can compute session length + historical visitors
alter table public.presence add column if not exists left_at timestamptz default null;

-- Aggregated venue-level counters (updated server-side)
alter table public.venues add column if not exists scan_count  int not null default 0;
alter table public.venues add column if not exists peak_count  int not null default 0;

-- Index for historical analytics queries
create index if not exists presence_venue_history_idx on public.presence (venue_id, joined_at desc);

-- RPC to safely increment scan_count
create or replace function public.increment_scan_count(venue_id_arg uuid)
returns void language sql security definer as $$
  update public.venues set scan_count = scan_count + 1 where id = venue_id_arg;
$$;
