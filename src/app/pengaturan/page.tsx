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

export default function PengaturanAdminPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'classes' | 'prices' | 'discounts'>('upload');
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ total: number; success: number; message: string } | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Classes state
  const [classes, setClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassUnit, setNewClassUnit] = useState('Unit Jokotole');
  const [newClassSchedule, setNewClassSchedule] = useState('Senin & Kamis (15.00)');

  useEffect(() => {
    fetchClasses();
  }, []);

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
    // Mapping ke schema Supabase asli: admin_classes(tingkat_kelas, nama_kelompok, ruang, kapasitas, hari_jam, is_active, kurikulum)
    // Kolom unit_name/capacity/class_name tidak ada di DB — unit disimpan di `ruang` sementara (lihat SQL migrasi di bawah untuk kolom proper)
    const { error } = await supabase.from('admin_classes').insert([{
      tingkat_kelas: parseTingkat(newClassName),
      nama_kelompok: newClassName,
      ruang: newClassUnit, // TODO: ganti ke unit_name setelah migrasi ALTER TABLE
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
              <form onSubmit={handleAddClass} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Kelas</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 12-SMA-A" 
                    value={newClassName} 
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Cabang</label>
                  <select 
                    value={newClassUnit} 
                    onChange={(e) => setNewClassUnit(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-sm"
                  >
                    {SEMADURA_UNITS.map(u => (
                      <option key={u} value={u}>{u} {u === 'Unit Jokotole' ? '(Medical Class)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Jadwal Belajar</label>
                  <input 
                    type="text" 
                    placeholder="Senin & Kamis (15.00)" 
                    value={newClassSchedule} 
                    onChange={(e) => setNewClassSchedule(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-[#b70011] hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition">
                    + Simpan Kelas
                  </button>
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
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Aturan Diskon Berjenjang (Successive Discount)</h2>
            <p className="text-xs text-gray-600">Urutan penerapan diskon otomatis di sistem:</p>
            <ol className="list-decimal list-inside text-xs space-y-2 text-gray-700 font-medium">
              <li><b>Diskon Tetap SLP:</b> Potongan Rp 200.000 khusus Siswa SLP (Ex-GO).</li>
              <li><b>Diskon Loyalitas SLP:</b> Pilihan dropdown 6%, 7%, atau 8%.</li>
              <li><b>Diskon Ranking / Prestasi:</b> Ranking 1 (20%), Ranking 2-3 (10%), Ranking 4-5 (7%).</li>
              <li><b>Diskon Adik-Kakak Kandung:</b> 5% potongan harga.</li>
              <li><b>Diskon Anak Kandung Guru:</b> 50% potongan harga.</li>
              <li><b>Diskon Promo (berlaku Lunas &amp; Cicilan):</b> 20% di bulan November 2026 — Desember 17%, Januari 14%, Februari 11%, Maret 8%, April 5%, Mei 3%, Juni 1%. Berlaku untuk pembayaran <b>lunas maupun cicilan</b> berdasarkan bulan daftar.</li>
              <li><b>Biaya Pendaftaran Siswa Fresh:</b> Ditambahkan Rp 200.000 di akhir jika siswa baru.</li>
            </ol>
          </div>
        )}

      </main>
    </div>
  );
}
