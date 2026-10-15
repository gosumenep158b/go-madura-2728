'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import Sidebar, { MobileNav } from '@/components/dashboard/Sidebar';
import { Users, School, Calendar, Clock, MapPin, CheckCircle2, AlertTriangle, Plus, Search } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qyjtbddnjvqhvukgubwb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Siswa {
  no_reg: string;
  nama_siswa: string;
  tingkat_kelas: string;
  kelas_go: string;
  asal_sekolah: string;
  no_hp: string;
}

interface KelasItem {
  kelas: string;
  tingkat: string;
  jadwal: string;
  ruang: string;
  max: number;
}

export default function GrupBelajarPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [adminClasses, setAdminClasses] = useState<KelasItem[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [classRes, regRes] = await Promise.all([
        supabase.from('admin_classes').select('*').order('id'),
        supabase.from('registrations').select('*')
      ]);

      let loadedClasses: KelasItem[] = [];
      if (!classRes.error && classRes.data && classRes.data.length > 0) {
        loadedClasses = classRes.data.map((c: any) => ({
          kelas: c.nama_kelompok,
          tingkat: c.tingkat_kelas,
          jadwal: c.hari_jam || 'Jadwal belum diatur',
          ruang: c.ruang || 'UGM',
          max: c.kapasitas || 20
        }));
      }

      setAdminClasses(loadedClasses);
      if (loadedClasses.length > 0 && (!selectedKelas || !loadedClasses.some(k => k.kelas === selectedKelas))) {
        setSelectedKelas(loadedClasses[0].kelas);
      }

      if (!regRes.error && regRes.data) {
        setSiswaList(regRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Group siswa by kelas_go matching nama_kelompok
  const kelasMap = useMemo(() => {
    const map: Record<string, Siswa[]> = {};
    adminClasses.forEach((k) => {
      map[k.kelas] = [];
    });
    siswaList.forEach((s) => {
      const k = s.kelas_go || '';
      if (!map[k]) map[k] = [];
      map[k].push(s);
    });
    return map;
  }, [adminClasses, siswaList]);

  const activeKelasInfo = adminClasses.find((k) => k.kelas === selectedKelas) || null;
  const activeSiswa = activeKelasInfo ? (kelasMap[selectedKelas] || []) : [];
  const currentCount = activeSiswa.length;
  const isFull = activeKelasInfo ? currentCount >= activeKelasInfo.max : false;

  const filteredSiswa = activeSiswa.filter(
    (s) =>
      s.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.asal_sekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.no_reg.includes(searchQuery)
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar onTambah={() => {}} />
      <div className="min-w-0 flex-1">
        <MobileNav onTambah={() => {}} />
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
          
          {/* Header Banner */}
          <div className="flex flex-col gap-4 rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between border border-slate-800">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Ganesha Operation Sumenep</p>
              <h1 className="text-xl font-black tracking-tight sm:text-2xl">Manajemen Grup Belajar &amp; Teman Kelas</h1>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900/10 px-4 py-2 text-xs font-semibold backdrop-blur-xs">
              TA 2027/2028 · Kapasitas &amp; Jadwal Otomatis
            </div>
          </div>

          {/* Grid Layout: Left sidebar for Class Selection, Right main for Roster */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Daftar Kelas GO */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
              <h2 className="font-bold text-gray-800 dark:text-slate-100 text-sm px-2 uppercase tracking-wider">Pilih Grup Kelas GO</h2>
              {adminClasses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs leading-relaxed text-amber-800">
                  <p className="font-bold">Belum ada kelas.</p>
                  <p className="mt-1">Buat kelas resmi di menu <a href="/pengaturan" className="underline font-bold">Pengaturan</a>.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {adminClasses.map((k) => {
                  const count = (kelasMap[k.kelas] || []).length;
                  const full = count >= k.max;
                  const isSelected = k.kelas === selectedKelas;

                  return (
                    <button
                      key={k.kelas}
                      onClick={() => setSelectedKelas(k.kelas)}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-1.5 ${
                        isSelected 
                          ? 'bg-red-600 text-white border-red-600 shadow-md' 
                          : 'bg-gray-50 dark:bg-slate-900 hover:bg-red-50 dark:bg-red-950/30 text-gray-800 dark:text-slate-100 border-gray-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm font-mono">{k.kelas}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          isSelected 
                            ? 'bg-white dark:bg-slate-900 text-red-700 dark:text-red-400' 
                            : full ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300' : 'bg-green-100 text-green-800'
                        }`}>
                          {count} / {k.max} Siswa
                        </span>
                      </div>
                      <div className={`text-xs ${isSelected ? 'text-red-100' : 'text-gray-500 dark:text-slate-400'}`}>
                        {k.tingkat} • {k.ruang}
                      </div>
                      <div className={`text-[11px] font-medium ${isSelected ? 'text-amber-200' : 'text-gray-600 dark:text-slate-400'}`}>
                        📅 {k.jadwal}
                      </div>
                    </button>
                  );
                  })}
                </div>
              )}
            </div>

            {/* Detail Roster */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              {!activeKelasInfo ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-amber-100 p-4 text-2xl">📚</div>
                  <h3 className="mt-3 font-bold text-gray-800 dark:text-slate-100">Belum ada kelas dipilih</h3>
                  <p className="mt-1 max-w-md text-xs leading-relaxed text-gray-500 dark:text-slate-400">Pilih kelas di sebelah kiri atau buat kelas baru di <b>Pengaturan → Kelola Kelas &amp; Jadwal</b>.</p>
                  <a href="/pengaturan" className="mt-4 rounded-xl bg-[#b70011] px-4 py-2 text-xs font-bold text-white">Buka Pengaturan</a>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-lg text-red-900 font-mono">{activeKelasInfo.kelas}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isFull ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                        {isFull ? 'KAPASITAS PENUH' : 'KUOTA TERSEDIA'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                      Jenjang: <b>{activeKelasInfo.tingkat}</b> | Ruang: <b>{activeKelasInfo.ruang}</b> | Jadwal: <b>{activeKelasInfo.jadwal}</b>
                    </p>
                  </div>

                  <div className="text-right bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-red-200 dark:border-slate-700 shadow-xs">
                    <div className="text-xs text-gray-500 dark:text-slate-400">Terisi / Maks</div>
                    <div className="text-lg font-black text-red-600 dark:text-red-400">{currentCount} / {activeKelasInfo.max}</div>
                  </div>
                </div>

                {/* Search & Header Roster */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-slate-100 text-sm">Daftar Teman Sekelas ({filteredSiswa.length} Siswa)</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Siswa yang tergabung dalam grup belajar ini.</p>
                  </div>

                  <div className="w-full sm:w-auto">
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama / sekolah..."
                        className="w-full sm:w-64 pl-9 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Tabel Roster Siswa */}
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-widest">
                        <th className="px-4 py-3">No</th>
                        <th className="px-4 py-3">No. Reg</th>
                        <th className="px-4 py-3">Nama Siswa</th>
                        <th className="px-4 py-3">Asal Sekolah</th>
                        <th className="px-4 py-3">No. HP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSiswa.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-xs">
                            Belum ada siswa yang terdaftar di grup kelas ini.
                          </td>
                        </tr>
                      ) : (
                        filteredSiswa.map((s, idx) => (
                          <tr key={`${s.no_reg ?? "row"}-${idx}`} className={idx % 2 ? 'bg-red-50 dark:bg-red-950/30/40 dark:bg-slate-800/60' : 'bg-white dark:bg-slate-900'}>
                            <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-2.5 font-mono text-xs text-red-700 dark:text-red-400">{s.no_reg || '—'}</td>
                            <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-slate-100">{s.nama_siswa}</td>
                            <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-slate-400">
                              <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium">{s.asal_sekolah || '—'}</span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs text-gray-600 dark:text-slate-400">{s.no_hp || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

                  <div className="pt-6 border-t mt-6 flex justify-between items-center text-xs text-gray-500 dark:text-slate-400">
                    <span>Kapasitas {activeKelasInfo.max} siswa per kelas.</span>
                    <span className="font-bold text-red-600 dark:text-red-400">Ganesha Operation</span>
                  </div>
                </>
              )}
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
