-- Tambah kolom unit ke admin_classes agar kelas terikat ke Unit GO (Semadura 5 unit)
-- Jalankan di Supabase Dashboard > SQL Editor
alter table public.admin_classes add column if not exists unit text default 'Unit Agus Salim';
create index if not exists idx_admin_classes_unit on public.admin_classes(unit);
create index if not exists idx_admin_classes_tingkat on public.admin_classes(tingkat_kelas);

-- Isi default untuk data lama yang belum punya unit (opsional: mapping manual per kebutuhan)
-- update public.admin_classes set unit='Unit Agus Salim' where unit is null;

-- Verifikasi
-- select id, nama_kelompok, tingkat_kelas, unit, ruang from public.admin_classes limit 10;
