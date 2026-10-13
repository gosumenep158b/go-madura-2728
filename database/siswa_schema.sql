-- Tabel utama Dashboard Siswa TA 2026/2027 + 2027/2028
-- Jalankan di Supabase Dashboard > SQL Editor

create table if not exists public.siswa (
  no_reg text primary key,
  tgl_lahir text,
  nama_siswa text not null,
  no_hp text,
  nama_ortu text,
  no_hp_ortu text,
  unit text,
  kelas_go text,
  tingkat_kelas text,
  program text,
  asal_sekolah text,
  tgl_daftar date,
  tahun_ajaran text not null default '2027/2028',
  status_bayar text not null default 'belum_lunas',
  total_tagihan integer not null default 0,
  sisa_tagihan integer not null default 0,
  metode_bayar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: buka untuk anon (dashboard pakai anon key, auth via cookie aplikasi)
alter table public.siswa enable row level security;
drop policy if exists "anon all siswa" on public.siswa;
create policy "anon all siswa" on public.siswa for all using (true) with check (true);

create index if not exists idx_siswa_ta on public.siswa(tahun_ajaran);
create index if not exists idx_siswa_unit on public.siswa(unit);
create index if not exists idx_siswa_tingkat on public.siswa(tingkat_kelas);

-- trigger updated_at
create or replace function public.set_updated_at_siswa()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists trg_siswa_updated on public.siswa;
create trigger trg_siswa_updated before update on public.siswa for each row execute function public.set_updated_at_siswa();
