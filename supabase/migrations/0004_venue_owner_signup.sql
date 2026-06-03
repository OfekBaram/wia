-- ─────────────────────────────────────────────────────────────────────────────
-- Venue-owner self-service signup
--
-- Adds a `role` column to admin_users so we can distinguish:
--   • 'super_admin'  — WIA team, sees every venue
--   • 'venue_owner'  — businesses that signed up themselves, see only their own
--
-- Both kinds of users access /admin/* routes. The dashboard filters by role.
-- Venue owners can create venues; the "one venue per owner" cap is enforced
-- in the API (not in DB) so the super admin can still create unlimited venues
-- on behalf of someone.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Extend admin_users with role
alter table public.admin_users
  add column if not exists role text not null default 'super_admin'
  check (role in ('super_admin', 'venue_owner'));

update public.admin_users set role = 'super_admin' where role is null;

-- 2. Helper functions
create or replace function public.is_super_admin() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid() and role = 'super_admin'
  )
$$;

create or replace function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;

grant execute on function public.is_super_admin() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- 3. Update venues policies — super admin OR owner can manage
drop policy if exists "venues insert" on public.venues;
drop policy if exists "venues update" on public.venues;
drop policy if exists "venues delete" on public.venues;

create policy "venues insert" on public.venues for insert with check (
  auth.uid() is not null
  and (public.is_super_admin() or auth.uid() = owner_id)
);

create policy "venues update" on public.venues for update
  using  (public.is_super_admin() or auth.uid() = owner_id)
  with check (public.is_super_admin() or auth.uid() = owner_id);

create policy "venues delete" on public.venues for delete
  using (public.is_super_admin() or auth.uid() = owner_id);
