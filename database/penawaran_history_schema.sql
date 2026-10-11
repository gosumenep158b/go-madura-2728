-- Tabel riwayat penawaran bimbel & reminder follow-up (tgl follow up = created_at + 3 hari)
create table if not exists public.penawaran_history (
    id serial primary key,
    nama_siswa text not null,
    asal_sekolah text,
    no_hp_siswa text,
    no_hp_ortu text,
    jenjang text,
    unit text,
    kelas_id text,
    nama_kelas text,
    student_type text,
    bulan_daftar text,
    base_price numeric,
    total_net numeric,
    total_savings numeric,
    payment_method text,
    action_type text, -- 'whatsapp' atau 'print'
    follow_up_date timestamp with time zone default (now() + interval '3 days'),
    is_followed_up boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.penawaran_history enable row level security;
create policy "Allow all access on penawaran_history" on public.penawaran_history for all using (true) with check (true);
