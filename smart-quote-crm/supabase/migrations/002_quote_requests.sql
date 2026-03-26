-- ─────────────────────────────────────────────────────────────────────────────
-- Smart Quote CRM — Quote Requests & Approval System
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Enum ─────────────────────────────────────────────────────────────────────

create type request_status as enum ('pending', 'reviewing', 'approved', 'sent', 'rejected');

-- ─── quote_requests ───────────────────────────────────────────────────────────

create table if not exists public.quote_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade,
  client_name      text not null,
  client_email     text,
  client_phone     text,
  client_company   text,
  request_text     text not null,
  status           request_status not null default 'pending',
  rejection_reason text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.quote_requests enable row level security;

-- Authenticated users see their own requests
create policy "users see own requests"
  on public.quote_requests for all
  using (auth.uid() = user_id);

-- Public (anonymous) visitors can submit requests from /pedir-orcamento
create policy "public can insert requests"
  on public.quote_requests for insert
  with check (true);

create index idx_quote_requests_user_id on public.quote_requests (user_id);
create index idx_quote_requests_status  on public.quote_requests (status);

-- Auto-update updated_at (reuses the trigger function from migration 001)
create trigger set_quote_requests_updated_at
  before update on public.quote_requests
  for each row execute procedure public.set_updated_at();

-- ─── Extend quotes table ──────────────────────────────────────────────────────

-- Allow quotes to exist without a contact (when generated from a request)
alter table public.quotes alter column contact_id drop not null;

-- Link a quote back to its originating request
alter table public.quotes add column if not exists quote_request_id uuid
  references public.quote_requests(id) on delete set null;

-- Track whether the quote was AI-generated
alter table public.quotes add column if not exists generated_by_ai boolean not null default false;
