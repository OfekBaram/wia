-- Public live count — anon users need to see how many people are in a venue
-- without seeing the identities. Keeps the FOMO tease working on the homepage
-- and the locked-room preview.

create or replace function public.public_live_count(venue uuid)
returns int
language sql
security definer
stable
as $$
  select count(*)::int
  from public.presence
  where venue_id = venue
    and is_visible = true
    and expires_at > now();
$$;

grant execute on function public.public_live_count(uuid) to anon, authenticated;
