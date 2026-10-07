'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Calendar, School, Search, Plus, Filter, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Sidebar, { MobileNav } from '@/components/dashboard/Sidebar';
import TambahProgressModal from '@/components/dashboard/TambahProgressModal';

interface ProgressItem {
  id: string;
  tanggal: string;
  asal_sekolah: string;
  tingkat_kelas: string;
  mapel: string;
  materi: string;
  tanggal_uh: string;
  pengajar: string;
  keterangan: string;
  status: string;
}

interface Summary {
  total: number;
  bySekolah: { sekolah: string; jumlah: number }[];
  byMapel: { mapel: string; jumlah: number }[];
  byTingkat: { tingkat: string; jumlah: number }[];
}

export default function ProgressMateriPage() {
  const [data, setData] = useState<ProgressItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterSekolah, setFilterSekolah] = useState('Semua');
  const [filterMapel, setFilterMapel] = useState('Semua');
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    fetch('/api/progress-materi')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          setSummary(res.summary);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sekolahOptions = useMemo(() => {
    const s = new Set(data.map((d) => d.asal_sekolah).filter(Boolean));
    return ['Semua', ...Array.from(s).sort()];
  }, [data]);

  const mapelOptions = useMemo(() => {
    const s = new Set(data.map((d) => d.mapel).filter(Boolean));
    return ['Semua', ...Array.from(s).sort()];
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.filter((d) => {
      const matchQ =
        !q ||
        d.materi.toLowerCase().includes(q) ||
        d.asal_sekolah.toLowerCase().includes(q) ||
        d.mapel.toLowerCase().includes(q) ||
        d.pengajar.toLowerCase().includes(q);
      const matchS = filterSekolah === 'Semua' || d.asal_sekolah === filterSekolah;
      const matchM = filterMapel === 'Semua' || d.mapel === filterMapel;
      return matchQ && matchS && matchM;
    });
  }, [data, query, filterSekolah, filterMapel]);

  // WhatsApp report generator (grouped by asal_sekolah, tingkat_kelas, mapel with UH date)
  const generateWhatsAppReport = () => {
    let text = `📢 *LAPORAN PROGRESS MATERI & JADWAL UH HARIAN*\n`;
    text += `📅 Tanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}\n\n`;

    // Group by asal_sekolah
    const grouped: Record<string, ProgressItem[]> = {};
    filtered.forEach((item) => {
      const key = `${item.asal_sekolah} — ${item.tingkat_kelas}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    Object.entries(grouped).forEach(([groupName, items], idx) => {
      text += `${idx + 1}. *${groupName}*\n`;
      items.forEach((item) => {
        text += `   • *${item.mapel}*: ${item.materi}\n`;
        text += `     🗓️ UH: ${item.tanggal_uh || 'Belum dijadwalkan'} | Status: ${item.status}\n`;
        text += `     👨‍🏫 ${item.pengajar}\n`;
      });
      text += `\n`;
    });

    text += `_Ganesha Operation Sumenep — Catatan Akademik Harian_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50/50">
        <p className="animate-pulse text-sm font-medium text-red-700">Memuat progress materi sekolah...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-red-50/50 via-white to-white">
      <Sidebar onTambah={() => setModalOpen(true)} />
      <div className="min-w-0 flex-1">
        <MobileNav onTambah={() => setModalOpen(true)} />
        
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-red-600 to-red-700 p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-xs">
                <BookOpen size={14} />
                <span>Modul Akademik & Evaluasi</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Progress Materi Sekolah Harian</h1>
              <p className="text-sm text-red-100 max-w-xl">
                Pantau rekap pengajaran harian, materi pelajaran, dan jadwal Ulangan Harian (UH) terpusat per asal sekolah dan tingkat kelas.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={generateWhatsAppReport}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500 transition-all active:scale-95"
              >
                <MessageSquare size={18} />
                {copied ? 'Berhasil Disalin ke WA! ✓' : 'Format Laporan WhatsApp'}
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-red-600 shadow-md hover:bg-red-50 transition-all active:scale-95"
              >
                <Plus size={18} />
                Tambah Catatan
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Catatan Materi</p>
                  <p className="mt-2 text-3xl font-black text-gray-900">{summary?.total ?? 0}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <BookOpen size={24} />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-gray-500">Rekapitulasi seluruh sesi belajar</p>
            </div>

            <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Asal Sekolah Terdaftar</p>
                  <p className="mt-2 text-3xl font-black text-gray-900">{summary?.bySekolah.length ?? 0}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <School size={24} />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-gray-500">Sekolah mitra & pengirim siswa</p>
            </div>

            <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Mata Pelajaran Aktif</p>
                  <p className="mt-2 text-3xl font-black text-gray-900">{summary?.byMapel.length ?? 0}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <Calendar size={24} />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-gray-500">Bidang studi termonitor</p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col gap-4 rounded-3xl border border-red-100 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari materi, sekolah, mapel, atau pengajar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={filterSekolah}
                  onChange={(e) => setFilterSekolah(e.target.value)}
                  className="rounded-2xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-700 focus:border-red-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20"
                >
                  {sekolahOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'Semua' ? 'Semua Sekolah' : opt}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={filterMapel}
                onChange={(e) => setFilterMapel(e.target.value)}
                className="rounded-2xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-700 focus:border-red-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20"
              >
                {mapelOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'Semua' ? 'Semua Mapel' : opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Table / Cards */}
          <div className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-red-50/60 text-xs font-bold uppercase tracking-wider text-red-800">
                  <tr>
                    <th className="px-6 py-4">Sekolah & Kelas</th>
                    <th className="px-6 py-4">Mata Pelajaran & Materi</th>
                    <th className="px-6 py-4">Jadwal UH</th>
                    <th className="px-6 py-4">Pengajar</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        Tidak ada data catatan materi yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-red-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{item.asal_sekolah}</p>
                          <p className="text-xs text-red-600 font-medium">{item.tingkat_kelas}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{item.mapel}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{item.materi}</p>
                          {item.keterangan && (
                            <p className="text-[11px] text-gray-400 italic mt-1">Catatan: {item.keterangan}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-200">
                            <Calendar size={13} />
                            <span>{item.tanggal_uh || 'Belum diatur'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-800">{item.pengajar}</p>
                          <p className="text-[11px] text-gray-400">Tgl: {item.tanggal}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                              item.status === 'Selesai Materi'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === 'Mendekati UH'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {item.status === 'Selesai Materi' ? <CheckCircle size={13} /> : <Clock size={13} />}
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <TambahProgressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
