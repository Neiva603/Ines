-- ─────────────────────────────────────────────────────────────────────────────
-- Smart Quote CRM — Initial Schema
-- Run in order via: supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────

create type user_role      as enum ('admin', 'sales', 'viewer');
create type contact_status as enum ('lead', 'prospect', 'customer', 'churned');
create type quote_status   as enum ('draft', 'sent', 'accepted', 'rejected', 'expired');

-- ─── Profiles ─────────────────────────────────────────────────────────────────
-- One profile per auth.users row (created via trigger).

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  full_name    text,
  avatar_url   text,
  company_name text,
  role         user_role not null default 'sales'
);

alter table public.profiles enable row level security;

create policy "profiles: owner can read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner can update"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Contacts ─────────────────────────────────────────────────────────────────

create table if not exists public.contacts (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  email      text,
  phone      text,
  company    text,
  website    text,
  notes      text,
  status     contact_status not null default 'lead',
  tags       text[] not null default '{}'
);

alter table public.contacts enable row level security;

create policy "contacts: owner full access"
  on public.contacts for all
  using (auth.uid() = user_id);

create index idx_contacts_user_id on public.contacts (user_id);
create index idx_contacts_status  on public.contacts (status);
create index idx_contacts_name    on public.contacts using gin (to_tsvector('simple', name));

-- ─── Quotes ───────────────────────────────────────────────────────────────────

create table if not exists public.quotes (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  contact_id   uuid not null references public.contacts(id) on delete cascade,
  title        text not null,
  description  text,
  status       quote_status not null default 'draft',
  total_amount numeric(12, 2) not null default 0,
  currency     text not null default 'EUR',
  valid_until  timestamptz,
  ai_generated boolean not null default false,
  ai_prompt    text,
  line_items   jsonb not null default '[]',
  notes        text
);

alter table public.quotes enable row level security;

create policy "quotes: owner full access"
  on public.quotes for all
  using (auth.uid() = user_id);

create index idx_quotes_user_id    on public.quotes (user_id);
create index idx_quotes_contact_id on public.quotes (contact_id);
create index idx_quotes_status     on public.quotes (status);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_contacts_updated_at
  before update on public.contacts
  for each row execute procedure public.set_updated_at();

create trigger set_quotes_updated_at
  before update on public.quotes
  for each row execute procedure public.set_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
