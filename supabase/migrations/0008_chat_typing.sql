-- 0008: typing indicators for 1:1 chat.
-- One row per (venue, sender, recipient); updated_at is refreshed on each
-- keystroke heartbeat. The recipient's chat poll reads it and shows "typing…"
-- when updated within the last few seconds.

create table if not exists chat_typing (
  venue_id     uuid not null references venues(id)    on delete cascade,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id   uuid not null references auth.users(id) on delete cascade,
  updated_at   timestamptz not null default now(),
  primary key (venue_id, from_user_id, to_user_id)
);

alter table chat_typing enable row level security;
