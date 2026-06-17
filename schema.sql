-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Users Table (Linked to Supabase auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) for users
alter table public.users enable row level security;

-- Policies for public.users
create policy "Users can read their own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

create policy "Enable insert for service role and trigger" on public.users
  for insert with check (true);

-- 2. Weather Search History Table
create table if not exists public.weather_search_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  city text not null,
  temperature numeric not null,
  weather_condition text not null,
  searched_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.weather_search_history enable row level security;

-- Policies for weather_search_history
create policy "Users can manage their own search history" on public.weather_search_history
  for all using (auth.uid() = user_id);

-- 3. Chat History Table
create table if not exists public.chat_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  question text not null,
  ai_response text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.chat_history enable row level security;

-- Policies for chat_history
create policy "Users can manage their own chat history" on public.chat_history
  for all using (auth.uid() = user_id);

-- 4. Favorite Locations Table
create table if not exists public.favorite_locations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  city_name text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (user_id, city_name)
);

alter table public.favorite_locations enable row level security;

-- Policies for favorite_locations
create policy "Users can manage their own favorites" on public.favorite_locations
  for all using (auth.uid() = user_id);

-- 5. Weather Alerts Table (Global alerts system)
create table if not exists public.weather_alerts (
  id uuid default uuid_generate_v4() primary key,
  city text not null,
  alert_type text not null,
  description text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.weather_alerts enable row level security;

-- Policies for weather_alerts
create policy "Anyone can read weather alerts" on public.weather_alerts
  for select using (true);

create policy "Authenticated users can insert weather alerts" on public.weather_alerts
  for insert with check (auth.role() = 'authenticated');

-- Trigger function to automatically create a public.users row upon auth.users sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
