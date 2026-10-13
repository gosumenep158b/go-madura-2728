-- Master harga bimbel per Kota x Unit x Tingkat x Program
-- Dipakai: modul Harga Bimbel (CRUD), Tambah Siswa (auto-fill), Modul Penawaran
-- Jalankan di Supabase Dashboard > SQL Editor

create table if not exists public.harga_bimbel (
  id bigint generated always as identity primary key,
  kota text not null,
  unit text not null,
  tingkat_kelas text not null,
  program text not null,
  harga integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kota, unit, tingkat_kelas, program)
);

alter table public.harga_bimbel enable row level security;
drop policy if exists "anon all harga_bimbel" on public.harga_bimbel;
create policy "anon all harga_bimbel" on public.harga_bimbel for all using (true) with check (true);

create index if not exists idx_harga_lookup on public.harga_bimbel(kota, unit, tingkat_kelas, program);
create index if not exists idx_harga_unit on public.harga_bimbel(unit);
