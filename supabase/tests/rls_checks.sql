-- Manual RLS checks. Run in the Supabase SQL Editor AFTER migration 0001.
-- Each query should return the result described in the comment.

-- 1. RLS is enabled on every Finvora table (expect rls_enabled = true for all rows).
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('plans','profiles','subscriptions','trial_records','admin_audit_logs')
order by 1;

-- 2. Seed plans (expect 2 rows: free = 0, pro = 299).
select id, price_inr from public.plans order by id;

-- 3. Authenticated users must not be able to update role or status
--    (expect only 'full_name' listed).
select column_name from information_schema.column_privileges
where table_schema = 'public' and table_name = 'profiles'
  and grantee = 'authenticated' and privilege_type = 'UPDATE';

-- 4. After signing up a test user: profile is a normal user with a Free active subscription
--    (expect role = 'user', plan_id = 'free', status = 'active').
select p.email, p.role, s.plan_id, s.status
from public.profiles p join public.subscriptions s on s.user_id = p.id
order by p.created_at desc limit 5;
