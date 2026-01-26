-- Create Exhibitions Table
create table public.exhibitions (
  id uuid default gen_random_uuid() primary key,
  title text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Photos Table
create table public.photos (
  id uuid default gen_random_uuid() primary key,
  exhibition_id uuid references public.exhibitions(id) on delete cascade not null,
  url text not null,
  caption text,
  gap_after integer default 0,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Optional but good practice)
alter table public.exhibitions enable row level security;
alter table public.photos enable row level security;

-- Create policies (Allow public read/write for demo purposes)
create policy "Allow public read exhibitions" on public.exhibitions for select using (true);
create policy "Allow public insert exhibitions" on public.exhibitions for insert with check (true);

create policy "Allow public read photos" on public.photos for select using (true);
create policy "Allow public insert photos" on public.photos for insert with check (true);

-- NOTE: You also need to create a Storage Bucket named 'exhibitions' in the Supabase Dashboard
-- and set its policy to "Public" (Select/Insert enabled).
