'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Users, School, Layers, CreditCard, Download, ExternalLink } from 'lucide-react';
import Sidebar, { MobileNav } from '@/components/dashboard/Sidebar';
import { SEMADURA_UNITS } from '@/lib/program';
import CardSummary from '@/components/dashboard/CardSummary';

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1AlmWDTapham69WcXwqV_27075WgSLhxwYVrA4lpeGnY/edit?gid=0#gid=0';

const TrendChart = dynamic(() => import('@/components/dashboard/DashboardCharts').then((m) => m.TrendChart), {
  ssr: false,
  loading: () => <p className="py-16 text-center text-xs text-gray-400">Memuat grafik…</p>,
});
const TingkatChart = dynamic(() => import('@/components/dashboard/DashboardCharts').then((m) => m.TingkatChart), {
  ssr: false,
  loading: () => <p className="py-16 text-center text-xs text-gray-400">Memuat grafik…</p>,
});
const SekolahChart = dynamic(() => import('@/components/dashboard/DashboardCharts').then((m) => m.SekolahChart), {
  ssr: false,
  loading: () => <p className="py-16 text-center text-xs text-gray-400">Memuat grafik…</p>,
});
const TambahSiswaModal = dynamic(() => import('@/components/dashboard/TambahSiswaModal'), { ssr: false });

interface Siswa {
  no_reg: string;
  tgl_lahir: string;
  nama_siswa: string;
  no_hp: string;
  nama_ortu: string;
  no_hp_ortu: string;
  nama_ayah?: string;
  no_hp_ayah?: string;
  nama_ibu?: string;
  no_hp_ibu?: string;
  cabang?: string;
  kota?: string;
  keterangan?: string;
  unit?: string;
  kelas_go: string;
  tingkat_kelas: string;
  asal_sekolah: string;
  tgl_daftar: string;
  tahun_ajaran: string;
  status_bayar: 'lunas' | 'cicilan' | 'belum_lunas';
  total_tagihan: number;
  sisa_tagihan: number;
  metode_bayar?: string;
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

const NAMA_BULAN: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'Mei', '06': 'Jun',
  '07': 'Jul', '08': 'Agu', '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des',
};

function labelBulan(ym: string) {
  const [y, m] = ym.split('-');
  return `${NAMA_BULAN[m] ?? m} ${y?.slice(2) ?? ''}`;
}
function fmtRp(n:number){ return 'Rp ' + Number(n||0).toLocaleString('id-ID') }

export default function Home() {
  const [data, setData] = useState<Siswa[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterUnit, setFilterUnit] = useState('Semua');
  const [ta, setTa] = useState('2027/2028');
  const [modalOpen, setModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportToSheet = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (ta !== 'Semua') params.set('ta', ta);
      if (filterUnit !== 'Semua') params.set('unit', filterUnit);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/siswa/export${qs}`);
      if (!res.ok) throw new Error('Export gagal');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `siswa_export_${ta.replace('/', '-')}_${filterUnit === 'Semua' ? 'semua-unit' : filterUnit.replace(/\s+/g, '-')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Gagal export spreadsheet. Coba lagi.');
    } finally {
      setExporting(false);
    }
  }, [ta, filterUnit]);


  const load = useCallback(() => {
    setLoading(true);
    const qs = ta==='Semua' ? '' : `?ta=${encodeURIComponent(ta)}`;
    fetch(`/api/siswa${qs}`)
      .then((r) => r.json())
      .then((j) => {
        setData(j.data ?? []);
        setSummary(j.summary ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ta]);

  useEffect(() => { load(); }, [load]);

  const unitOptions = useMemo(() => {
    const fromData = new Set((data.map((d) => (d.unit || '').trim()).filter(Boolean) as string[]));
    const all = new Set<string>([...(SEMADURA_UNITS as readonly string[]), ...fromData]);
    return ['Semua', ...Array.from(all).sort()];
  }, [data]);

  const kelasOptions = useMemo(
    () => [...(summary?.kapasitasKelas ?? [])].map((k) => k.kelas).sort(),
    [summary]
  );

  // Data mengikuti filter nama unit (grafik + ringkasan + export)
  const unitData = useMemo(() => {
    if (filterUnit === 'Semua') return data;
    return data.filter((d) => (d.unit || '').trim() === filterUnit);
  }, [data, filterUnit]);

  const tingkatChart = useMemo(() => {
    const counts = new Map<string, number>();
    unitData.forEach((d) => {
      const k = d.tingkat_kelas || 'N/A';
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    return [...counts.entries()].map(([tingkat, jumlah]) => ({ tingkat, jumlah })).sort((a, b) => b.jumlah - a.jumlah);
  }, [unitData]);
  const topSekolah = useMemo(() => {
    const counts = new Map<string, number>();
    unitData.forEach((d) => {
      const k = d.asal_sekolah || 'Tanpa Data';
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    return [...counts.entries()].map(([sekolah, jumlah]) => ({ sekolah, jumlah })).sort((a, b) => b.jumlah - a.jumlah).slice(0, 8);
  }, [unitData]);
  const trendBulan = useMemo(() => {
    const map = new Map<string, number>();
    unitData.forEach((d) => {
      const b = d.tgl_daftar?.slice(0, 7);
      if (b && b.length === 7) map.set(b, (map.get(b) || 0) + 1);
    });
    if (map.size === 0) return [];
    const sorted = [...map.keys()].sort((a, b) => a.localeCompare(b));
    const start = sorted[0];
    const end = '2027-10';
    const out: { bulan: string; jumlah: number; label: string }[] = [];
    let [y, m] = start.split('-').map(Number);
    const [ey, em] = end.split('-').map(Number);
    while (y < ey || (y === ey && m <= em)) {
      const ym = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}`;
      out.push({ bulan: ym, jumlah: map.get(ym) ?? 0, label: labelBulan(ym) });
      m += 1; if (m > 12) { m = 1; y += 1; }
    }
    return out;
  }, [unitData]);

  // ringkasan bayar mengikuti filter unit
  const bayarStats = useMemo(()=>{
    const total = unitData.length;
    const lunas = unitData.filter(d=> d.status_bayar==='lunas').length;
    const cicilan = unitData.filter(d=> d.status_bayar==='cicilan').length;
    const belum = unitData.filter(d=> d.status_bayar==='belum_lunas').length;
    const tagihan = unitData.reduce((a,c)=> a+Number(c.total_tagihan||0),0);
    const sisa = unitData.reduce((a,c)=> a+Number(c.sisa_tagihan||0),0);
    return { total, lunas, cicilan, belum, tagihan, sisa };
  },[unitData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50/50 dark:bg-slate-950">
        <p className="animate-pulse text-sm font-medium text-red-700 dark:text-red-300">Memuat data siswa…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar onTambah={() => setModalOpen(true)} />
      <div className="min-w-0 flex-1">
        <MobileNav onTambah={() => setModalOpen(true)} />
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          {/* Header */}
          <div className="flex flex-col gap-4 rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between border border-slate-800">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Ganesha Operation Sumenep</p>
              <h1 className="text-xl font-black tracking-tight leading-tight sm:text-2xl">Monitoring Penerimaan Siswa Baru TA 2027–2028</h1>
              <p className="mt-1 text-xs text-red-100">Data arsip TA 2026/2027 tersimpan — dashboard kini menampilkan TA 2027/2028.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select value={ta} onChange={e=> setTa(e.target.value)} className="w-full rounded-full bg-white px-4 py-2.5 text-sm font-medium text-red-700 outline-none sm:w-auto">
                <option value="2027/2028">TA 2027/2028 (Aktif)</option>
                <option value="2026/2027">TA 2026/2027 (Arsip)</option>
                <option value="Semua">Semua TA</option>
              </select>
            </div>
          </div>

          {ta==='2027/2028' && data.length===0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-bold">TA 2027/2028 belum ada siswa.</p>
              <p className="mt-1 text-xs">Data yang ada saat ini adalah arsip TA 2026/2027 (303 siswa). Mulai isi TA baru via <b>Tambah Siswa</b> dengan pilih Tahun Ajaran 2027/2028, atau ganti filter ke TA 2026/2027 untuk lihat arsip.</p>
            </div>
          )}

          {/* Filter Nama Unit — semua grafik & ringkasan mengikuti pilihan ini */}
          <div className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h2 className="text-sm font-bold text-red-800 dark:text-red-300">Filter Nama Unit</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">{bayarStats.total} dari {data.length} siswa {filterUnit === 'Semua' ? '(semua unit)' : `(${filterUnit})`} · TA {ta}</p>
            </div>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              title="Filter nama unit"
              className="w-full rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-red-400 sm:w-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {unitOptions.map((u) => (
                <option key={u} value={u}>{u === 'Semua' ? 'Semua Unit' : u}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CardSummary title="Total Siswa" value={String(bayarStats.total)} description={`TA ${ta}`} icon={<Users size={22} />} />
            <CardSummary title="Sisa Tagihan" value={fmtRp(bayarStats.sisa)} description={`${bayarStats.cicilan+bayarStats.belum} belum lunas`} icon={<CreditCard size={22} />} />
            <CardSummary title="Lunas" value={String(bayarStats.lunas)} description={`${bayarStats.total? Math.round(bayarStats.lunas/bayarStats.total*100):0}% dari total`} icon={<Layers size={22} />} />
            <CardSummary title="Total Kelas GO" value={String(summary?.kapasitasKelas.length ?? 0)} description="Kelas terpakai di TA ini" icon={<School size={22} />} />
          </div>

          {bayarStats.tagihan>0 && (
            <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-red-800 dark:text-red-300">Ringkasan Pembayaran TA {ta}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3 border dark:border-slate-700 dark:bg-slate-800"><p className="text-xs text-gray-500 dark:text-slate-400">Total Tagihan</p><p className="font-bold dark:text-slate-100">{fmtRp(bayarStats.tagihan)}</p></div>
                <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900"><p className="text-xs text-emerald-700 dark:text-emerald-300">Sudah Dibayar</p><p className="font-bold text-emerald-700 dark:text-emerald-300">{fmtRp(bayarStats.tagihan - bayarStats.sisa)}</p></div>
                <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 dark:bg-amber-950 dark:border-amber-900"><p className="text-xs text-amber-700 dark:text-amber-300">Sisa</p><p className="font-bold text-amber-700 dark:text-amber-300">{fmtRp(bayarStats.sisa)}</p></div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-400"><a href="/pembayaran" className="text-red-600 underline dark:text-red-400">Kelola di Pembayaran & Cicilan</a> — WhatsApp pengingat pakai No. HP Ortu.</p>
            </div>
          )}

          {/* Trend pendaftar per bulan */}
          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-red-800 dark:text-red-300">Pendaftar per Bulan — {filterUnit === 'Semua' ? 'Semua Unit' : filterUnit} · TA {ta}</h2>
            <p className="mb-4 text-xs text-gray-500 dark:text-slate-400">Tren pendaftaran berdasarkan tanggal daftar</p>
            <div className="h-64">
              <TrendChart data={trendBulan} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-red-800 dark:text-red-300">Siswa per Tingkat Kelas</h2>
              <p className="mb-4 text-xs text-gray-500 dark:text-slate-400">Distribusi jenjang {filterUnit === 'Semua' ? 'semua unit' : filterUnit} · TA {ta}</p>
              <div className="h-72">
                <TingkatChart data={tingkatChart} />
              </div>
            </div>

            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-red-800 dark:text-red-300">Top 8 Asal Sekolah</h2>
              <p className="mb-4 text-xs text-gray-500 dark:text-slate-400">Sekolah dengan siswa terbanyak {filterUnit === 'Semua' ? '' : `di ${filterUnit}`}</p>
              <div className="h-72">
                <SekolahChart data={topSekolah} />
              </div>
            </div>
          </div>

          {/* Menu Export Spreadsheet */}
          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Export ke Spreadsheet</h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  Unduh data {bayarStats.total} siswa {filterUnit === 'Semua' ? '(semua unit)' : `(${filterUnit})`} TA {ta} sebagai file .xlsx,
                  atau simpan langsung ke Google Sheet rekap.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  onClick={exportToSheet}
                  disabled={exporting || unitData.length === 0}
                  title="Export hasil filter ke spreadsheet (.xlsx)"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Download size={16} />
                  {exporting ? 'Mengexport…' : `Export .xlsx (${unitData.length})`}
                </button>
                {/* Simpan ke Google Sheet kini OTOMATIS: tiap tambah siswa / catat cicilan langsung tersinkron */}
                <a
                  href={GOOGLE_SHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  title="Buka Google Sheet rekap"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  <ExternalLink size={16} />
                  Buka Google Sheet
                </a>
              </div>
            </div>
          </div>

          <footer className="pb-4 pt-2 text-center text-xs text-gray-400">
            GO Sumenep · Dashboard Siswa TA 2027/2028 · Arsip TA 2026/2027 tetap tersimpan
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