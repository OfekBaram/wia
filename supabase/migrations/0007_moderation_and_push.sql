-- 0007: moderation (hide + report) and web-push subscriptions

create table if not exists user_hides (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  hidden_user_id uuid not null references auth.users(id) on delete cascade,
  venue_id     uuid not null references venues(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (user_id, hidden_user_id, venue_id)
);

create table if not exists user_reports (
  id             uuid primary key default gen_random_uuid(),
  reporter_id    uuid not null references auth.users(id) on delete cascade,
  reported_id    uuid not null references auth.users(id) on delete cascade,
  venue_id       uuid not null references venues(id) on delete cascade,
  reason         text,
  created_at     timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  endpoint     text not null unique,
  subscription jsonb not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_user_hides_user   on user_hides(user_id, venue_id);
create index if not exists idx_user_reports_venue on user_reports(venue_id);
create index if not exists idx_push_subs_user    on push_subscriptions(user_id);

-- RLS: all access goes through service-role server routes; lock down direct access.
alter table user_hides         enable row level security;
alter table user_reports       enable row level security;
alter table push_subscriptions enable row level security;
