'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { Users, School, Layers, Search, CreditCard } from 'lucide-react';
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

const MODERN_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e', '#84cc16'];

const NAMA_BULAN: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'Mei', '06': 'Jun',
  '07': 'Jul', '08': 'Agu', '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des',
};

function labelBulan(ym: string) {
  const [y, m] = ym.split('-');
  return `${NAMA_BULAN[m] ?? m} ${y?.slice(2) ?? ''}`;
}
function fmtRp(n:number){ return 'Rp ' + Number(n||0).toLocaleString('id-ID') }
function waOrtuLink(s: Siswa){
  const d=(s.no_hp_ortu||'').replace(/\D/g,''); let no='';
  if(d.startsWith('62')) no=d; else if(d.startsWith('0')) no='62'+d.slice(1); else if(d.startsWith('8')) no='62'+d; else no=d;
  if(!no) return null;
  const msg=encodeURIComponent(`Yth. Ortu/Wali ${s.nama_ortu||'-'} — siswa ${s.nama_siswa} (${s.no_reg})\nPengingat sisa tagihan bimbel GO: ${fmtRp(Number(s.sisa_tagihan||0))} dari total ${fmtRp(Number(s.total_tagihan||0))}. Mohon segera dilunasi. Terima kasih — Ganesha Operation Sumenep.`);
  return `https://wa.me/${no}?text=${msg}`;
}

export default function Home() {
  const [data, setData] = useState<Siswa[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterTingkat, setFilterTingkat] = useState('Semua');
  const [ta, setTa] = useState('2027/2028');
  const [modalOpen, setModalOpen] = useState(false);

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
  const trendBulan = useMemo(() => {
    const raw = summary?.pendaftarBulan ?? [];
    if (raw.length === 0) return [];
    const map = new Map(raw.map((p) => [p.bulan, p.jumlah]));
    const sorted = [...raw].sort((a, b) => a.bulan.localeCompare(b.bulan));
    const start = sorted[0].bulan;
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
  }, [summary]);

  // ringkasan bayar untuk TA aktif
  const bayarStats = useMemo(()=>{
    const total = data.length;
    const lunas = data.filter(d=> d.status_bayar==='lunas').length;
    const cicilan = data.filter(d=> d.status_bayar==='cicilan').length;
    const belum = data.filter(d=> d.status_bayar==='belum_lunas').length;
    const tagihan = data.reduce((a,c)=> a+Number(c.total_tagihan||0),0);
    const sisa = data.reduce((a,c)=> a+Number(c.sisa_tagihan||0),0);
    return { total, lunas, cicilan, belum, tagihan, sisa };
  },[data]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50/50">
        <p className="animate-pulse text-sm font-medium text-red-700">Memuat data siswa…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
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
            <div className="flex items-center gap-2">
              <select value={ta} onChange={e=> setTa(e.target.value)} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-red-700 outline-none">
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CardSummary title="Total Siswa" value={String(bayarStats.total)} description={`TA ${ta}`} icon={<Users size={22} />} />
            <CardSummary title="Sisa Tagihan" value={fmtRp(bayarStats.sisa)} description={`${bayarStats.cicilan+bayarStats.belum} belum lunas`} icon={<CreditCard size={22} />} />
            <CardSummary title="Lunas" value={String(bayarStats.lunas)} description={`${bayarStats.total? Math.round(bayarStats.lunas/bayarStats.total*100):0}% dari total`} icon={<Layers size={22} />} />
            <CardSummary title="Total Kelas GO" value={String(summary?.kapasitasKelas.length ?? 0)} description="Kelas terpakai di TA ini" icon={<School size={22} />} />
          </div>

          {bayarStats.tagihan>0 && (
            <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-red-800">Ringkasan Pembayaran TA {ta}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3 border"><p className="text-xs text-gray-500">Total Tagihan</p><p className="font-bold">{fmtRp(bayarStats.tagihan)}</p></div>
                <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200"><p className="text-xs text-emerald-700">Sudah Dibayar</p><p className="font-bold text-emerald-700">{fmtRp(bayarStats.tagihan - bayarStats.sisa)}</p></div>
                <div className="rounded-xl bg-amber-50 p-3 border border-amber-200"><p className="text-xs text-amber-700">Sisa</p><p className="font-bold text-amber-700">{fmtRp(bayarStats.sisa)}</p></div>
              </div>
              <p className="mt-2 text-xs text-gray-500"><a href="/pembayaran" className="text-red-600 underline">Kelola di Pembayaran & Cicilan</a> — WhatsApp pengingat pakai No. HP Ortu.</p>
            </div>
          )}

          {/* Trend pendaftar per bulan */}
          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-red-800">Pendaftar per Bulan — TA {ta}</h2>
            <p className="mb-4 text-xs text-gray-500">Tren pendaftaran berdasarkan tanggal daftar</p>
            <div className="h-64">
              {trendBulan.length===0 ? <p className="py-16 text-center text-xs text-gray-400">Belum ada data di TA ini.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendBulan} margin={{ left: -10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="jumlah" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3, fill: '#dc2626' }} />
                </LineChart>
              </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-red-800">Siswa per Tingkat Kelas</h2>
              <p className="mb-4 text-xs text-gray-500">Distribusi jenjang TA {ta}</p>
              <div className="h-72">
                {tingkatChart.length===0 ? <p className="py-16 text-center text-xs text-gray-400">Belum ada data.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tingkatChart} layout="vertical" margin={{ left: 40, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="tingkat" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="jumlah" fill="#dc2626" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-red-800">Top 8 Asal Sekolah</h2>
              <p className="mb-4 text-xs text-gray-500">Sekolah dengan siswa terbanyak</p>
              <div className="h-72">
                {topSekolah.length===0 ? <p className="py-16 text-center text-xs text-gray-400">Belum ada data.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topSekolah} dataKey="jumlah" nameKey="sekolah" outerRadius={100} label={{ fontSize: 10 }}>
                      {topSekolah.map((_, i) => (
                        <Cell key={i} fill={MODERN_COLORS[i % MODERN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-red-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-red-800">Data Siswa — TA {ta}</h2>
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
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="bg-red-700 text-xs uppercase tracking-wide text-white">
                    <th className="px-4 py-3">No. Registrasi</th>
                    <th className="px-4 py-3">Nama Siswa</th>
                    <th className="px-4 py-3">Tingkat Kelas</th>
                    <th className="px-4 py-3">Kelas GO</th>
                    <th className="px-4 py-3">Asal Sekolah</th>
                    <th className="px-4 py-3">Tagihan / Sisa</th>
                    <th className="px-4 py-3">WA Ortu</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length===0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Tidak ada data di TA {ta}. {ta==='2027/2028' ? 'Tambah siswa baru untuk TA ini.' : ''}</td></tr>
                  ) : filtered.slice(0, 100).map((s, i) => {
                    const wa = s.sisa_tagihan>0 ? waOrtuLink(s) : null;
                    return (
                    <tr key={`${s.no_reg ?? "row"}-${i}`} className={i % 2 ? 'bg-red-50/40' : 'bg-white'}>
                      <td className="px-4 py-2.5 font-mono text-xs text-red-800">{s.no_reg || '—'}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{s.nama_siswa}</td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                          {s.tingkat_kelas || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{s.kelas_go}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{s.asal_sekolah}</td>
                      <td className="px-4 py-2.5 text-xs">
                        <span className={Number(s.sisa_tagihan)>0 ? 'text-amber-700 font-bold' : 'text-green-700'}>{Number(s.sisa_tagihan)>0 ? fmtRp(Number(s.sisa_tagihan)) : 'Lunas'}</span>
                        <span className="text-gray-400"> / {fmtRp(Number(s.total_tagihan||0))}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-gray-600">{s.no_hp_ortu || '—'}</span>
                          {wa && <a href={wa} target="_blank" rel="noreferrer" className="rounded-full bg-green-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-green-700">WA</a>}
                        </div>
                      </td>
                    </tr>
                  )})}
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
