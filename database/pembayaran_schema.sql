-- Tabel histori pembayaran/cicilan siswa
-- Jalankan di Supabase Dashboard > SQL Editor
-- Pola sama seperti siswa_schema.sql: Supabase-first, file JSON hanya seed lokal

create table if not exists public.pembayaran (
  id text primary key,
  no_reg text not null references public.siswa(no_reg) on delete cascade,
  tanggal date not null,
  jumlah integer not null check (jumlah > 0),
  metode text not null default 'tunai',
  keterangan text,
  cicilan_ke integer,
  created_at timestamptz not null default now()
);

-- RLS: samakan dengan tabel siswa (dashboard pakai anon key, auth via cookie aplikasi)
alter table public.pembayaran enable row level security;
drop policy if exists "anon all pembayaran" on public.pembayaran;
create policy "anon all pembayaran" on public.pembayaran for all using (true) with check (true);

create index if not exists idx_pembayaran_no_reg on public.pembayaran(no_reg);
create index if not exists idx_pembayaran_tanggal on public.pembayaran(tanggal);
