'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { Users, School, Layers, Search } from 'lucide-react';
import Sidebar, { MobileNav } from '@/components/dashboard/Sidebar';
import CardSummary from '@/components/dashboard/CardSummary';
import TambahSiswaModal from '@/components/dashboard/TambahSiswaModal';

interface Siswa {
  no_reg: string;
  tgl_lahir: string;
  nama_siswa: string;
  no_hp: string;
  nama_ortu: string;
  no_hp_ortu: string;
  kelas_go: string;
  tingkat_kelas: string;
  asal_sekolah: string;
  tgl_daftar: string;
}

interface Kapasitas {
  kelas: string;
  terisi: number;
  max: number;
  sisa: number;
  tingkat: string;
  status: string;
  persen: number;
}

interface Summary {
  totalSiswa: number;
  asalSekolah: { sekolah: string; jumlah: number }[];
  tingkatKelas: { tingkat: string; jumlah: number }[];
  kapasitasKelas: Kapasitas[];
  pendaftarBulan: { bulan: string; jumlah: number }[];
}

const REDS = ['#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#991b1b', '#e11d48', '#fb7185'];

const NAMA_BULAN: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'Mei', '06': 'Jun',
  '07': 'Jul', '08': 'Agu', '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des',
};

function labelBulan(ym: string) {
  const [y, m] = ym.split('-');
  return `${NAMA_BULAN[m] ?? m} ${y?.slice(2) ?? ''}`;
}

export default function Home() {
  const [data, setData] = useState<Siswa[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterTingkat, setFilterTingkat] = useState('Semua');
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/siswa')
      .then((r) => r.json())
      .then((j) => {
        setData(j.data ?? []);
        setSummary(j.summary ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const tingkatOptions = useMemo(() => {
    const s = new Set(data.map((d) => d.tingkat_kelas).filter(Boolean));
    return ['Semua', ...Array.from(s).sort()];
  }, [data]);

  const kelasOptions = useMemo(
    () => [...(summary?.kapasitasKelas ?? [])].map((k) => k.kelas).sort(),
    [summary]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.filter((d) => {
      const matchQ =
        !q ||
        d.nama_siswa.toLowerCase().includes(q) ||
        d.no_reg.includes(q) ||
        d.asal_sekolah.toLowerCase().includes(q);
      const matchT = filterTingkat === 'Semua' || d.tingkat_kelas === filterTingkat;
      return matchQ && matchT;
    });
  }, [data, query, filterTingkat]);

  const tingkatChart = useMemo(
    () => [...(summary?.tingkatKelas ?? [])].sort((a, b) => b.jumlah - a.jumlah),
    [summary]
  );
  const topSekolah = useMemo(
    () => [...(summary?.asalSekolah ?? [])].sort((a, b) => b.jumlah - a.jumlah).slice(0, 8),
    [summary]
  );
  const trendBulan = useMemo(
    () => (summary?.pendaftarBulan ?? []).map((p) => ({ ...p, label: labelBulan(p.bulan) })),
    [summary]
  );
  const kapasitasPenuh = useMemo(
    () => (summary?.kapasitasKelas ?? []).filter((k) => k.status === 'Penuh').length,
    [summary]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50/50">
        <p className="animate-pulse text-sm font-medium text-red-700">Memuat data siswa…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-red-50 via-white to-white">
      <Sidebar onTambah={() => setModalOpen(true)} />
      <div className="min-w-0 flex-1">
        <MobileNav onTambah={() => setModalOpen(true)} />
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <CardSummary
              title="Total Siswa"
              value={summary?.totalSiswa ?? data.length}
              description={`${filtered.length} tampil setelah filter`}
              icon={<Users size={22} />}
            />
            <CardSummary
              title="Kelas Penuh"
              value={kapasitasPenuh}
              description={`dari ${summary?.kapasitasKelas.length ?? 0} kelas GO`}
              icon={<Layers size={22} />}
            />
            <CardSummary
              title="Asal Sekolah"
              value={summary?.asalSekolah.length ?? 0}
              description="Sekolah pengirim siswa"
              icon={<School size={22} />}
            />
          </div>

          {/* Trend pendaftar per bulan */}
          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-red-800">Pendaftar per Bulan</h2>
            <p className="mb-4 text-xs text-gray-500">Tren pendaftaran berdasarkan tanggal daftar</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendBulan} margin={{ left: -10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="jumlah" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3, fill: '#dc2626' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-red-800">Siswa per Tingkat Kelas</h2>
              <p className="mb-4 text-xs text-gray-500">Distribusi jenjang seluruh siswa</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tingkatChart} layout="vertical" margin={{ left: 40, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="tingkat" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="jumlah" fill="#dc2626" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-red-800">Top 8 Asal Sekolah</h2>
              <p className="mb-4 text-xs text-gray-500">Sekolah dengan siswa terbanyak</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topSekolah} dataKey="jumlah" nameKey="sekolah" outerRadius={100} label={{ fontSize: 10 }}>
                      {topSekolah.map((_, i) => (
                        <Cell key={i} fill={REDS[i % REDS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-red-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-red-800">Data Siswa</h2>
                <p className="text-xs text-gray-500">{filtered.length} dari {data.length} siswa</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari nama / no. registrasi / sekolah…"
                    className="w-full rounded-full border border-red-200 bg-red-50/50 py-2 pl-9 pr-4 text-sm outline-none placeholder:text-gray-400 focus:border-red-400 focus:bg-white sm:w-72"
                  />
                </label>
                <select
                  value={filterTingkat}
                  onChange={(e) => setFilterTingkat(e.target.value)}
                  className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none focus:border-red-400"
                >
                  {tingkatOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="bg-red-700 text-xs uppercase tracking-wide text-white">
                    <th className="px-4 py-3">No. Registrasi</th>
                    <th className="px-4 py-3">Nama Siswa</th>
                    <th className="px-4 py-3">Tingkat Kelas</th>
                    <th className="px-4 py-3">Kelas GO</th>
                    <th className="px-4 py-3">Asal Sekolah</th>
                    <th className="px-4 py-3">No. HP</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((s, i) => (
                    <tr key={s.no_reg + i} className={i % 2 ? 'bg-red-50/40' : 'bg-white'}>
                      <td className="px-4 py-2.5 font-mono text-xs text-red-800">{s.no_reg || '—'}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{s.nama_siswa}</td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                          {s.tingkat_kelas || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{s.kelas_go}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{s.asal_sekolah}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{s.no_hp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 100 && (
              <p className="border-t border-red-100 bg-red-50/50 px-5 py-3 text-center text-xs text-red-700">
                Menampilkan 100 dari {filtered.length} hasil — gunakan pencarian untuk menyaring.
              </p>
            )}
          </div>

          <footer className="pb-4 pt-2 text-center text-xs text-gray-400">
            GO Sumenep · Dashboard Siswa TA 2026/2027
          </footer>
        </main>
      </div>

      <TambahSiswaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={load}
        kelasOptions={kelasOptions}
      />
    </div>
  );
}
