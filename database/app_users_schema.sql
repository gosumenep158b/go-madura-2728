-- Akun login dashboard (pengganti users.json agar ganti password persisten di Vercel)
-- Jalankan di Supabase Dashboard > SQL Editor
-- Setelah itu, jalankan SEED di bawah sekali (password awal admin123, user wajib ganti setelah login)

create table if not exists public.app_users (
  username text primary key,
  nik text,
  nama text not null,
  jabatan text,
  password text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_users enable row level security;
drop policy if exists "anon all app_users" on public.app_users;
create policy "anon all app_users" on public.app_users for all using (true) with check (true);

-- Migrasi aman bila tabel sudah ada:
alter table public.app_users add column if not exists nik text;
alter table public.app_users add column if not exists nama text;
alter table public.app_users add column if not exists jabatan text;
alter table public.app_users add column if not exists role text;

-- SEED awal (sesuai src/data/users.json; role cs untuk CS):
-- HAPUS baris seed untuk user yang sudah ada bila conflict, atau pakai on conflict do nothing.
insert into public.app_users (username, nik, nama, jabatan, password, role) values
  ('1202502515', '1202502515', 'Elvis Sahri', 'Kanit', 'admin123', 'super admin'),
  ('2025239238', '2025239238', 'Kamila', 'PH', 'admin123', 'admin'),
  ('2025239280', '2025239280', 'Dyah Ayu Shofa Noer Azizah', 'PH', 'admin123', 'admin'),
  ('2022229015', '2022229015', 'Dwi Fitriaini Nur Anisa', 'CS', 'admin123', 'cs'),
  ('1510800003', '1510800003', 'Subarkah Arif', 'TI', 'admin123', 'admin'),
  ('2024138000', '2024138000', 'Adi Wijaya Jaka Pradana', 'Staf Pengajaran & Kesiswaan', 'admin123', 'admin'),
  ('1402502276', '1402502276', 'Al Hidayat', 'PH', 'admin123', 'admin')
on conflict (username) do nothing;
