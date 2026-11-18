-- Finvora migration 0001: profiles, plans, subscriptions, trial records, admin audit log.
-- Additive only. Safe to run once in the Supabase SQL Editor. Does not drop anything.

-- ---------- plans ----------
create table if not exists public.plans (
  id text primary key check (id in ('free', 'pro')),
  name text not null,
  price_inr integer not null check (price_inr >= 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.plans (id, name, price_inr, description) values
  ('free', 'Free', 0, 'Free forever. Basic research tools with usage limits.'),
  ('pro', 'Pro', 299, 'Advanced research tools with higher limits.')
on conflict (id) do nothing;

-- ---------- profiles ----------
-- role/status can only be changed by the backend (service role). Users cannot edit them.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists profiles_role_idx on public.profiles (role);

-- ---------- subscriptions ----------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null references public.plans (id),
  status text not null check (status in ('active', 'cancelled', 'expired', 'failed')),
  provider text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);
-- A user can have at most one active subscription.
create unique index if not exists subscriptions_one_active_per_user
  on public.subscriptions (user_id) where status = 'active';

-- ---------- trial_records (activation logic arrives in Phase 4) ----------
create table if not exists public.trial_records (
  user_id uuid primary key references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check (expires_at > started_at)
);

-- ---------- admin_audit_logs ----------
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users (id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  request_id text,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_logs_admin_idx on public.admin_audit_logs (admin_id, created_at desc);
create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);

-- ---------- new user trigger ----------
-- Every new account gets a normal 'user' profile and the Free plan. Never admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');

  insert into public.subscriptions (user_id, plan_id, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------
alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.trial_records enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "plans readable by everyone" on public.plans;
create policy "plans readable by everyone" on public.plans
  for select to anon, authenticated using (true);

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "users read own subscriptions" on public.subscriptions;
create policy "users read own subscriptions" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "users read own trial" on public.trial_records;
create policy "users read own trial" on public.trial_records
  for select to authenticated using (user_id = (select auth.uid()));

-- admin_audit_logs has RLS on and no policies: only the backend (service role) can touch it.

-- Column-level protection: signed-in users may change ONLY full_name on their profile.
revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;
revoke insert, update, delete on public.subscriptions, public.trial_records, public.plans from authenticated, anon;
revoke all on public.admin_audit_logs from authenticated, anon;
