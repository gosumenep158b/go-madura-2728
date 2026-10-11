"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qyjtbddnjvqhvukgubwb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh';
const supabase = createClient(supabaseUrl, supabaseKey);

const SEMADURA_UNITS = [
  'Unit Agus Salim',
  'Unit Jokotole',
  'Unit Parteker',
  'Unit Imam Bonjol',
  'Unit Cempaka'
];

const MONTH_ORDER = ['November','Desember','Januari','Februari','Maret','April','Mei','Juni'] as const;
const DEFAULT_SLP_BY_MONTH: Record<string,number> = { November:250000, Desember:225000, Januari:200000, Februari:175000, Maret:150000, April:125000, Mei:100000, Juni:75000 };
const DEFAULT_PROMO_BY_MONTH: Record<string,number> = { November:0.20, Desember:0.17, Januari:0.14, Februari:0.11, Maret:0.08, April:0.05, Mei:0.03, Juni:0.01 };

type MonthlyRow = { bulan: string; slp_discount: number; promo_rate: number };

export default function PengaturanAdminPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'classes' | 'prices' | 'discounts'>('upload');
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ total: number; success: number; message: string } | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const TINGKAT_OPTIONS = ['12 SMA','12 SMA SNBT','13 ALUMNI UMUM','11 SMA','10 SMA','9 SMP','8 SMP','7 SMP','6 SD','5 SD','4 SD'] as const;
  // Classes state
  const [classes, setClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassTingkat, setNewClassTingkat] = useState<string>('12 SMA');
  const [newClassUnit, setNewClassUnit] = useState('Unit Jokotole');
  const [newClassSchedule, setNewClassSchedule] = useState('Senin & Kamis (15.00)');

  // Monthly discounts state (Diskon Modul/Promo % + Diskon SLP Rp per bulan)
  const [monthly, setMonthly] = useState<MonthlyRow[]>(MONTH_ORDER.map(b=>({ bulan:b, slp_discount: DEFAULT_SLP_BY_MONTH[b], promo_rate: DEFAULT_PROMO_BY_MONTH[b] })));
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [savingMonthly, setSavingMonthly] = useState(false);
  const [monthlyMsg, setMonthlyMsg] = useState<{type:'ok'|'err'|'info', text:string}|null>(null);

  useEffect(() => {
    fetchClasses();
    fetchMonthly();
  }, []);

  async function fetchMonthly(){
    setLoadingMonthly(true); setMonthlyMsg(null);
    try{
      const { data, error } = await supabase.from('admin_monthly_discounts').select('bulan, slp_discount, promo_rate');
      if(error) throw error;
      if(data && data.length){
        const map = new Map<string, {slp:number, promo:number}>();
        (data as any[]).forEach(r=> map.set(r.bulan, { slp: Number(r.slp_discount), promo: Number(r.promo_rate) }));
        const next = MONTH_ORDER.map(b=>{
          const hit = map.get(b);
          return hit ? { bulan:b, slp_discount: hit.slp, promo_rate: hit.promo } : { bulan:b, slp_discount: DEFAULT_SLP_BY_MONTH[b], promo_rate: DEFAULT_PROMO_BY_MONTH[b] };
        });
        setMonthly(next);
        try{ localStorage.setItem('monthly_discounts', JSON.stringify(next)); }catch{}
      }
    }catch(e:any){
      const msg = String(e?.message||'');
      const isMissing = msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('relation') || msg.toLowerCase().includes('schema cache') || (e as any)?.code==='42P01' || (e as any)?.code==='PGRST205';
      if(isMissing){
        // fallback localStorage else defaults
        try{
          const cached = localStorage.getItem('monthly_discounts');
          if(cached){ const parsed = JSON.parse(cached); if(Array.isArray(parsed) && parsed.length){ setMonthly(parsed); setMonthlyMsg({type:'info', text:'Tabel admin_monthly_discounts belum ada — memakai simpanan lokal. Jalankan database/monthly_discounts_schema.sql di Supabase SQL Editor lalu Muat Ulang untuk simpan permanen.'}); setLoadingMonthly(false); return; } }
        }catch{}
        setMonthlyMsg({type:'info', text:'Tabel admin_monthly_discounts belum ada di Supabase. Edit tetap bisa disimpan lokal — jalankan SQL di database/monthly_discounts_schema.sql untuk aktifkan simpan permanen.'});
      } else {
        setMonthlyMsg({type:'err', text:'Gagal memuat diskon bulanan: '+msg});
      }
    } finally { setLoadingMonthly(false); }
  }

  function updMonthly(bulan:string, field:'slp_discount'|'promo_rate', val:number){
    setMonthly(prev=> prev.map(r=> r.bulan===bulan ? { ...r, [field]: val } : r));
  }

  async function saveMonthly(){
    setSavingMonthly(true); setMonthlyMsg(null);
    // always cache locally
    try{ localStorage.setItem('monthly_discounts', JSON.stringify(monthly)); }catch{}
    try{
      const payload = monthly.map(r=>({ bulan:r.bulan, slp_discount: Math.round(r.slp_discount), promo_rate: Number(r.promo_rate) }));
      const { error } = await (supabase as any).from('admin_monthly_discounts').upsert(payload, { onConflict:'bulan' });
      if(error) throw error;
      setMonthlyMsg({type:'ok', text:'Tersimpan ke Supabase — halaman Pendaftaran akan otomatis pakai nilai baru.'});
    }catch(e:any){
      const msg = String(e?.message||'');
      const isMissing = msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('relation') || msg.toLowerCase().includes('schema cache') || (e as any)?.code==='42P01' || (e as any)?.code==='PGRST205';
      if(isMissing){
        setMonthlyMsg({type:'info', text:'Tersimpan lokal (browser ini). Agar tersimpan permanen untuk semua admin & siswa, jalankan SQL di database/monthly_discounts_schema.sql via Supabase Dashboard > SQL Editor.'});
      } else {
        setMonthlyMsg({type:'err', text:'Gagal simpan ke Supabase: '+msg+' (tetap tersimpan lokal).'});
      }
    } finally { setSavingMonthly(false); }
  }

  function resetMonthlyDefault(){
    const next = MONTH_ORDER.map(b=>({ bulan:b, slp_discount: DEFAULT_SLP_BY_MONTH[b], promo_rate: DEFAULT_PROMO_BY_MONTH[b] }));
    setMonthly(next);
    setMonthlyMsg({type:'info', text:'Dikembalikan ke default Juklak — klik Simpan untuk menyimpan.'});
  }

  async function fetchClasses() {
    setLoadingClasses(true);
    const { data } = await supabase.from('admin_classes').select('*').order('id', { ascending: true });
    if (data) setClasses(data);
    setLoadingClasses(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStats(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        setPreviewData(data.slice(0, 10));

        let successCount = 0;
        const mappedRows = data.map((row: any) => ({
          no_reg: String(row.no_reg || row['No Reg'] || row['NO_REG'] || ''),
          kota: String(row.kota || row['Kota'] || row['KOTA'] || 'Madura'),
          unit: String(row.unit || row['Unit'] || row['UNIT'] || row['unit_cabang'] || row['Unit Cabang'] || 'Unit Jokotole'),
          tgl_lahir: String(row.tgl_lahir || row['Tanggal Lahir'] || row['TGL_LAHIR'] || ''),
          nama_siswa: String(row.nama_siswa || row['Nama Siswa'] || row['NAMA_SISWA'] || ''),
          no_hp: String(row.no_hp || row['No HP'] || row['NO_HP'] || ''),
          nama_ortu: String(row.nama_ortu || row['Nama Orang Tua'] || row['NAMA_ORTU'] || ''),
          no_hp_ortu: String(row.no_hp_ortu || row['No HP Ortu'] || row['NO_HP_ORTU'] || ''),
          kelas_go: String(row.kelas_go || row['Kelas GO'] || row['KELAS_GO'] || ''),
          tingkat_kelas: String(row.tingkat_kelas || row['Tingkat Kelas'] || row['TINGKAT_KELAS'] || ''),
          asal_sekolah: String(row.asal_sekolah || row['Asal Sekolah'] || row['ASAL_SEKOLAH'] || ''),
          tgl_daftar: String(row.tgl_daftar || row['Tanggal Daftar'] || row['TGL_DAFTAR'] || '')
        })).filter(r => r.no_reg);

        for (let i = 0; i < mappedRows.length; i += 100) {
          const chunk = mappedRows.slice(i, i + 100);
          const { error } = await supabase.from('students_slp_2627').upsert(chunk, { onConflict: 'no_reg' });
          if (!error) {
            successCount += chunk.length;
          }
        }

        setUploadStats({
          total: mappedRows.length,
          success: successCount,
          message: `Berhasil mengunggah dan memperbarui ${successCount} data siswa SLP ke database Supabase!`
        });
      } catch (err: any) {
        alert('Gagal memproses file: ' + err.message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  }

  function parseTingkat(nama: string): string {
    const m = nama.trim().match(/^(\d{1,2})/);
    return m ? m[1] : '12';
  }
  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault();
    if (!newClassName) return;
    const { error } = await supabase.from('admin_classes').insert([{
      tingkat_kelas: newClassTingkat,
      nama_kelompok: newClassName,
      ruang: newClassUnit,
      kapasitas: 25,
      hari_jam: newClassSchedule,
      kurikulum: 'K. Merdeka',
      is_active: true,
    }]);
    if (error) {
      alert('Gagal menambah kelas: ' + error.message);
    } else {
      setNewClassName('');
      fetchClasses();
      alert('Kelas baru berhasil ditambahkan!');
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24">
      <header className="sticky top-0 z-50 bg-[#faf8ff]/85 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-6xl mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#b70011] text-white p-2 rounded-xl font-black text-lg shadow-sm">GO</div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Pengaturan Admin &amp; Master Data</h1>
              <span className="text-xs text-gray-500">Ganesha Operation Semadura</span>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/pendaftaran" className="text-xs font-bold text-[#b70011] bg-red-50 px-3 py-2 rounded-xl hover:bg-red-100 transition">
              ← Kembali ke Portal Pendaftaran
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Nav Tabs */}
        <div className="flex gap-2 border-b pb-3 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'upload' ? 'bg-[#b70011] text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            📤 Upload Database Siswa (Excel/CSV)
          </button>
          <button 
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'classes' ? 'bg-[#b70011] text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            🏫 Kelola Kelas &amp; Jadwal
          </button>
          <button 
            onClick={() => setActiveTab('prices')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'prices' ? 'bg-[#b70011] text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            💰 Pengaturan Harga &amp; Bundling
          </button>
          <button 
            onClick={() => setActiveTab('discounts')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'discounts' ? 'bg-[#b70011] text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            🏷️ Aturan Diskon Berjenjang
          </button>
        </div>

        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Upload Database Siswa (Excel / CSV)</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Unggah file Excel (`.xlsx`, `.xls`) atau CSV untuk memperbarui atau memasukkan data siswa SLP ke database Supabase secara massal. Sistem akan otomatis mendeteksi dan memperbarui data berdasarkan nomor registrasi (`no_reg`).
              </p>

              {/* Header Specification Box */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2">
                <h3 className="font-bold text-xs text-amber-900 uppercase tracking-wider">
                  📋 Urutan &amp; Format Header Kolom yang Wajib Digunakan pada Baris Pertama File Excel/CSV:
                </h3>
                <ol className="list-decimal list-inside text-xs text-amber-800 space-y-1 font-mono">
                  <li><span className="font-bold text-black">no_reg</span> (Nomor Registrasi Unik)</li>
                  <li><span className="font-bold text-black">kota</span> (Nama Kota Cabang, misal: Pamekasan, Sumenep, Sampang, Bangkalan)</li>
                  <li><span className="font-bold text-black">unit</span> (Nama Unit GO, misal: Unit Jokotole, Unit Parteker, Unit Agus Salim, Unit Imam Bonjol, Unit Cempaka)</li>
                  <li><span className="font-bold text-black">tgl_lahir</span> (Tanggal Lahir, misal: 2008-05-12)</li>
                  <li><span className="font-bold text-black">nama_siswa</span> (Nama Lengkap Siswa)</li>
                  <li><span className="font-bold text-black">no_hp</span> (No HP WhatsApp Siswa)</li>
                  <li><span className="font-bold text-black">nama_ortu</span> (Nama Orang Tua / Wali)</li>
                  <li><span className="font-bold text-black">no_hp_ortu</span> (No HP Orang Tua)</li>
                  <li><span className="font-bold text-black">kelas_go</span> (Kelas GO sebelumnya)</li>
                  <li><span className="font-bold text-black">tingkat_kelas</span> (Tingkat Kelas, misal: 10 SMA, 8 SMP, 5 SD)</li>
                  <li><span className="font-bold text-black">asal_sekolah</span> (Asal Sekolah Asal)</li>
                  <li><span className="font-bold text-black">tgl_daftar</span> (Tanggal Pendaftaran)</li>
                </ol>
              </div>

              <div className="pt-2">
                <label className="block w-full border-2 border-dashed border-gray-300 hover:border-[#b70011] rounded-2xl p-8 text-center cursor-pointer bg-gray-50/50 transition">
                  <div className="space-y-2">
                    <div className="text-3xl">📁</div>
                    <div className="font-bold text-sm text-gray-700">
                      {uploading ? 'Sedang Memproses &amp; Mengunggah...' : 'Klik untuk Pilih File Excel / CSV (.xlsx, .xls, .csv)'}
                    </div>
                    <div className="text-xs text-gray-400">Mendukung file Excel dan CSV standar Ganesha Operation Semadura</div>
                  </div>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleFileUpload} 
                    disabled={uploading}
                    className="hidden" 
                  />
                </label>
              </div>

              {uploadStats && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-semibold">
                  ✅ {uploadStats.message} (Total diproses: {uploadStats.total} data)
                </div>
              )}
            </div>

            {previewData.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                <h3 className="font-bold text-sm text-gray-800">Pratinjau 10 Data Teratas yang Diunggah:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 border-b">
                        <th className="p-2">No Reg</th>
                        <th className="p-2">Kota</th>
                        <th className="p-2">Unit</th>
                        <th className="p-2">Nama Siswa</th>
                        <th className="p-2">Tingkat Kelas</th>
                        <th className="p-2">Asal Sekolah</th>
                        <th className="p-2">No HP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-mono font-bold">{row.no_reg || row['No Reg']}</td>
                          <td className="p-2">{row.kota || row['Kota']}</td>
                          <td className="p-2">{row.unit || row['Unit']}</td>
                          <td className="p-2">{row.nama_siswa || row['Nama Siswa']}</td>
                          <td className="p-2">{row.tingkat_kelas || row['Tingkat Kelas']}</td>
                          <td className="p-2">{row.asal_sekolah || row['Asal Sekolah']}</td>
                          <td className="p-2">{row.no_hp || row['No HP']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Tambah Kelas Baru</h2>
              <p className="text-xs text-gray-500">Tentukan <b>Tingkat Kelas</b> dulu — kelas ini nanti muncul sebagai pilihan di modul Pendaftaran sesuai jenjang yang dipilih siswa.</p>
              <form onSubmit={handleAddClass} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tingkat Kelas</label>
                  <select value={newClassTingkat} onChange={(e)=> setNewClassTingkat(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm font-semibold bg-amber-50">
                    {TINGKAT_OPTIONS.map(t=> <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Kelas / Kelompok</label>
                  <input type="text" placeholder="Contoh: 12-SMA-A" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Cabang</label>
                  <select value={newClassUnit} onChange={(e) => setNewClassUnit(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm">
                    {SEMADURA_UNITS.map(u => (<option key={u} value={u}>{u} {u === 'Unit Jokotole' ? '(Medical Class)' : ''}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Jadwal Belajar</label>
                  <input type="text" placeholder="Senin & Kamis (15.00)" value={newClassSchedule} onChange={(e) => setNewClassSchedule(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm" />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-[#b70011] hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition">+ Simpan Kelas</button>
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Daftar Kelas Terdaftar di Supabase</h2>
              {loadingClasses ? (
                <p className="text-sm text-gray-500">Memuat daftar kelas...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 border-b">
                        <th className="p-3">ID</th>
                        <th className="p-3">Tingkat</th>
                        <th className="p-3">Nama Kelas</th>
                        <th className="p-3">Unit Cabang</th>
                        <th className="p-3">Jadwal</th>
                        <th className="p-3">Kapasitas</th>
                        <th className="p-3">Terisi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((c) => (
                        <tr key={c.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-mono">{c.id}</td>
                          <td className="p-3"><span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">{c.tingkat_kelas ?? '-'}</span></td>
                          <td className="p-3 font-bold text-[#b70011]">{c.nama_kelompok ?? c.class_name}</td>
                          <td className="p-3">{c.ruang ?? c.unit_name}</td>
                          <td className="p-3">{c.hari_jam ?? c.schedule}</td>
                          <td className="p-3">{c.kapasitas ?? c.capacity} siswa</td>
                          <td className="p-3 font-bold text-green-700">{c.enrolled ?? '-'} </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'prices' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Pengaturan Harga &amp; Bundling per Jenjang</h2>
            <p className="text-xs text-gray-600">Harga dasar program bimbingan belajar TA 2027/2028 per jenjang kelas.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border bg-gray-50 space-y-2">
                <div className="font-bold text-sm">12 SMA / SNBT (Eksekutif Silver)</div>
                <div className="text-2xl font-black text-[#b70011]">Rp 11.500.000</div>
                <div className="text-xs text-gray-500">Fasilitas lengkap 4 KBM/pekan + TST + e-TOBK</div>
              </div>
              <div className="p-4 rounded-xl border bg-gray-50 space-y-2">
                <div className="font-bold text-sm">10 &amp; 11 SMA Umum (TWT 1 Tahun)</div>
                <div className="text-2xl font-black text-[#b70011]">Rp 10.200.000</div>
                <div className="text-xs text-gray-500">Fasilitas lengkap 4 KBM/pekan + TST</div>
              </div>
              <div className="p-4 rounded-xl border bg-gray-50 space-y-2">
                <div className="font-bold text-sm">7, 8, 9 SMP (TWT 1 Tahun)</div>
                <div className="text-2xl font-black text-[#b70011]">Rp 8.900.000</div>
                <div className="text-xs text-gray-500">Fasilitas lengkap 4 KBM/pekan + TST</div>
              </div>
              <div className="p-4 rounded-xl border bg-gray-50 space-y-2">
                <div className="font-bold text-sm">4, 5, 6 SD (TWT 1 Tahun)</div>
                <div className="text-2xl font-black text-[#b70011]">Rp 7.500.000</div>
                <div className="text-xs text-gray-500">Fasilitas lengkap 4 KBM/pekan (60 menit)</div>
              </div>
              <div className="p-4 rounded-xl border bg-indigo-50 border-indigo-200 space-y-2">
                <div className="font-bold text-sm text-indigo-900">🩺 Unit Jokotole: Medical Class</div>
                <div className="text-2xl font-black text-indigo-700">+ Rp 1.500.000</div>
                <div className="text-xs text-indigo-600">Tambahan modul &amp; program persiapan kedokteran</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'discounts' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Diskon per Bulan — Modul (Promo %) &amp; SLP (Rp)</h2>
                  <p className="text-xs text-gray-600 mt-1">Ubah <b>Diskon Modul</b> (persen promo lunas &amp; cicilan) dan <b>Diskon SLP</b> (Rp, khusus siswa lama) per bulan daftar. Nilai dipakai otomatis di <a href="/pendaftaran" className="text-[#b70011] underline">Pendaftaran</a> &amp; ringkasan pembayaran.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={fetchMonthly} disabled={loadingMonthly} className="px-3 py-2 rounded-xl text-xs font-bold border bg-white hover:bg-gray-50 disabled:opacity-50">{loadingMonthly ? 'Memuat…' : '↻ Muat Ulang'}</button>
                  <button onClick={resetMonthlyDefault} className="px-3 py-2 rounded-xl text-xs font-bold border bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100">Reset Default Juklak</button>
                </div>
              </div>

              {monthlyMsg && (
                <div className={`p-3 rounded-xl text-xs font-medium border ${monthlyMsg.type==='ok' ? 'bg-green-50 border-green-200 text-green-800' : monthlyMsg.type==='err' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                  {monthlyMsg.text}
                </div>
              )}

              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm border-collapse min-w-[520px]">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 border-y">
                      <th className="text-left p-3 font-bold">Bulan Daftar</th>
                      <th className="text-left p-3 font-bold">Diskon Modul (Promo) <span className="font-normal text-gray-500">— %</span></th>
                      <th className="text-left p-3 font-bold">Diskon SLP <span className="font-normal text-gray-500">— Rp</span></th>
                      <th className="text-left p-3 font-bold">Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map(r=>(
                      <tr key={r.bulan} className="border-b hover:bg-gray-50/70">
                        <td className="p-3 font-bold text-[#b70011]">{r.bulan}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <input type="number" min={0} max={100} step={0.1}
                              value={Number((r.promo_rate*100).toFixed(1))}
                              onChange={e=> updMonthly(r.bulan,'promo_rate', Math.max(0,Math.min(100, Number(e.target.value)||0))/100)}
                              className="w-24 p-2 border rounded-xl text-sm font-mono" />
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Rp</span>
                            <input type="number" min={0} step={5000}
                              value={r.slp_discount}
                              onChange={e=> updMonthly(r.bulan,'slp_discount', Math.max(0, Math.round(Number(e.target.value)||0)))}
                              className="w-32 p-2 border rounded-xl text-sm font-mono" />
                          </div>
                        </td>
                        <td className="p-3 text-xs text-gray-600">
                          Promo <b>{(r.promo_rate*100).toFixed(0)}%</b> · SLP <b>Rp {r.slp_discount.toLocaleString('id-ID')}</b>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={saveMonthly} disabled={savingMonthly} className="bg-[#b70011] hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 shadow-sm">
                  {savingMonthly ? 'Menyimpan…' : '💾 Simpan Diskon Bulanan'}
                </button>
                <span className="text-xs text-gray-500 self-center">Disimpan ke Supabase (<code>admin_monthly_discounts</code>) + cache lokal. Jika tabel belum ada, jalankan <code>database/monthly_discounts_schema.sql</code> di SQL Editor.</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-3">
              <h3 className="font-bold text-sm text-gray-900">Urutan Penerapan Diskon (Successive Discount)</h3>
              <p className="text-xs text-gray-600">Sistem menerapkan diskon berurutan — nilai <b>Promo %</b> dan <b>SLP Rp</b> di atas diambil per <b>bulan daftar</b>:</p>
              <ol className="list-decimal list-inside text-xs space-y-2 text-gray-700 font-medium">
                <li><b>Diskon Tetap SLP:</b> Potongan sesuai tabel di atas (kolom SLP Rp) — khusus Siswa Lama/Ex-GO.</li>
                <li><b>Diskon Loyalitas SLP:</b> Pilihan dropdown 6%, 7%, atau 8%.</li>
                <li><b>Diskon Ranking / Prestasi:</b> Ranking 1 (20%), Ranking 2-3 (10%), Ranking 4-5 (7%).</li>
                <li><b>Diskon Adik-Kakak Kandung:</b> 5%.</li>
                <li><b>Diskon Anak Kandung Guru:</b> 50%.</li>
                <li><b>Diskon Promo Modul:</b> Persen sesuai tabel di atas (kolom Promo %) — berlaku <b>lunas maupun cicilan</b>.</li>
                <li><b>Biaya Pendaftaran Siswa Fresh:</b> +Rp 200.000 di akhir jika siswa baru.</li>
              </ol>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
