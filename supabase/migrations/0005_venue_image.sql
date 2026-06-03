-- Add image_url to venues
alter table venues add column if not exists image_url text default null;

-- Create venue-images storage bucket (public read)
insert into storage.buckets (id, name, public)
values ('venue-images', 'venue-images', true)
on conflict (id) do nothing;

-- Allow anyone to read venue images
drop policy if exists "venue-images public read" on storage.objects;
create policy "venue-images public read"
  on storage.objects for select
  using (bucket_id = 'venue-images');

-- Allow service role to manage (we upload via adminClient)
drop policy if exists "venue-images service write" on storage.objects;
create policy "venue-images service write"
  on storage.objects for insert
  with check (bucket_id = 'venue-images');
