'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Sidebar, { MobileNav } from '@/components/dashboard/Sidebar';
import CardSummary from '@/components/dashboard/CardSummary';
import { Users, DoorOpen, AlertTriangle } from 'lucide-react';

const KapasitasChart = dynamic(() => import('@/components/dashboard/KapasitasChart'), {
  ssr: false,
  loading: () => <p className="py-16 text-center text-xs text-gray-400">Memuat grafik…</p>,
});
const TambahSiswaModal = dynamic(() => import('@/components/dashboard/TambahSiswaModal'), { ssr: false });

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
  kapasitasKelas: Kapasitas[];
}

const statusStyle: Record<string, string> = {
  Penuh: 'bg-red-600 text-white',
  'Hampir Penuh': 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-300',
  Tersedia: 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-300',
};

const barColor = (k: Kapasitas) =>
  k.status === 'Penuh' ? '#991b1b' : k.status === 'Hampir Penuh' ? '#f59e0b' : '#dc2626';

export default function StatistikPage() {
  const [kapasitas, setKapasitas] = useState<Kapasitas[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/siswa')
      .then((r) => r.json())
      .then((j: { summary: Summary; data: { kelas_go: string }[] }) => {
        setKapasitas(j.summary?.kapasitasKelas ?? []);
        setTotal(j.summary?.totalSiswa ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => (filterStatus === 'Semua' ? kapasitas : kapasitas.filter((k) => k.status === filterStatus)),
    [kapasitas, filterStatus]
  );

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.persen - a.persen), [filtered]);

  const penuh = kapasitas.filter((k) => k.status === 'Penuh').length;
  const hampir = kapasitas.filter((k) => k.status === 'Hampir Penuh').length;
  const totalKursi = kapasitas.reduce((a, k) => a + k.max, 0);
  const totalSisa = kapasitas.reduce((a, k) => a + k.sisa, 0);

  const kelasOptions = useMemo(() => kapasitas.map((k) => k.kelas).sort(), [kapasitas]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50 dark:bg-red-950/30/50 dark:bg-slate-950">
        <p className="animate-pulse text-sm font-medium text-red-700 dark:text-red-400">Memuat statistik kapasitas…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar onTambah={() => setModalOpen(true)} />
      <div className="min-w-0 flex-1">
        <MobileNav onTambah={() => setModalOpen(true)} />
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900">Data Statistik — Kapasitas Kelas</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              SD (4, 5, 6) maks 20 siswa · SMP (7, 8, 9) &amp; SMA (10, 11, 12) maks 25 siswa
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <CardSummary title="Total Siswa" value={total} description={`${totalKursi} kursi · ${totalSisa} tersisa`} icon={<Users size={22} />} />
            <CardSummary title="Kelas Penuh" value={penuh} description={`dari ${kapasitas.length} kelas GO`} icon={<DoorOpen size={22} />} />
            <CardSummary title="Hampir Penuh" value={hampir} description="terisi ≥ 80% kapasitas" icon={<AlertTriangle size={22} />} />
          </div>

          <div className="rounded-2xl border border-red-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-red-800 dark:text-red-300">Okupansi per Kelas GO</h2>
            <p className="mb-4 text-xs text-gray-500 dark:text-slate-400">Terisi vs kapasitas maksimum</p>
            <div className="h-96">
              <KapasitasChart data={sorted} />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-red-100 dark:border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-red-800 dark:text-red-300">Rincian Kapasitas per Kelas</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">{sorted.length} kelas ditampilkan</p>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-full border border-red-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 outline-none focus:border-red-400"
              >
                {['Semua', 'Tersedia', 'Hampir Penuh', 'Penuh'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-900 text-[11px] uppercase tracking-widest text-white">
                    <th className="px-4 py-3">Kelas GO</th>
                    <th className="px-4 py-3">Tingkat</th>
                    <th className="px-4 py-3">Terisi</th>
                    <th className="px-4 py-3">Maks</th>
                    <th className="px-4 py-3">Sisa</th>
                    <th className="px-4 py-3">Okupansi</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((k, i) => (
                    <tr key={k.kelas} className={i % 2 ? 'bg-red-50 dark:bg-red-950/30/40 dark:bg-slate-800/60' : 'bg-white dark:bg-slate-900'}>
                      <td className="px-4 py-2.5 font-mono text-xs font-medium text-red-800 dark:text-red-300">{k.kelas}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-slate-400">{k.tingkat}</td>
                      <td className="px-4 py-2.5 text-xs font-semibold text-gray-800 dark:text-slate-100">{k.terisi}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-slate-400">{k.max}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-slate-400">{k.sisa}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-red-100 dark:bg-red-950">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(100, k.persen)}%`, background: barColor(k) }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-slate-400">{k.persen}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[k.status] ?? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300'}`}>
                          {k.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
