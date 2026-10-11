-- Monthly discounts config for GO Semadura TA 2027/2028
-- Run in Supabase Dashboard > SQL Editor

create table if not exists public.admin_monthly_discounts (
  bulan text primary key,
  slp_discount integer not null default 0,
  promo_rate numeric(5,4) not null default 0,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.admin_monthly_discounts enable row level security;

drop policy if exists "anon read monthly_discounts" on public.admin_monthly_discounts;
create policy "anon read monthly_discounts"
  on public.admin_monthly_discounts for select using (true);

drop policy if exists "anon write monthly_discounts" on public.admin_monthly_discounts;
create policy "anon write monthly_discounts"
  on public.admin_monthly_discounts for all using (true) with check (true);

-- seed defaults Juklak GO 2026 -> 2027/2028
insert into public.admin_monthly_discounts (bulan, slp_discount, promo_rate) values
  ('November', 250000, 0.20),
  ('Desember', 225000, 0.17),
  ('Januari',  200000, 0.14),
  ('Februari', 175000, 0.11),
  ('Maret',    150000, 0.08),
  ('April',    125000, 0.05),
  ('Mei',      100000, 0.03),
  ('Juni',      75000, 0.01)
on conflict (bulan) do update set
  slp_discount = excluded.slp_discount,
  promo_rate   = excluded.promo_rate,
  updated_at   = now();

-- optional trigger to auto update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_monthly_discounts_updated on public.admin_monthly_discounts;
create trigger trg_monthly_discounts_updated
  before update on public.admin_monthly_discounts
  for each row execute function public.set_updated_at();
