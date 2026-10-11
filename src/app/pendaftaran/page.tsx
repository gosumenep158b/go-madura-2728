"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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

const FACILITIES: Record<string, string[]> = {
  '12 SMA': [
    'Pembelajaran Tatap Muka (4 KBM/pekan, 90 menit)',
    'Tutorial Service Time (TST)',
    'Bupel GO Semester Ganjil & Genap TA 2026/2027',
    'Bupel GO Mapel Pilihan (Kurikulum Merdeka)',
    'Aplikasi GO Expert Siswa & Orang Tua',
    'e-VAK & e-GOA (GO Assessment)',
    'e-Teori, e-Kuis, e-Paket Soal & e-TOBK',
    'e-EPB, e-Empati Mandiri/Wajib',
    'e-Buku Sakti, e-Racing, e-SoRef & e-Rumus',
    'e-Video Ekstra, e-Video Soal & Teori',
    'Leaderboard Nasional & Konsultasi Jurusan PTN',
    'Parents Meeting (Lokal) & Seminar M3'
  ],
  '13 ALUMNI UMUM': [
    'Pembelajaran Tatap Muka (4 KBM/pekan, 90 menit)',
    'Tutorial Service Time (TST)',
    'Bupel GO Alumni Semester Ganjil & Genap',
    'Aplikasi GO Expert Siswa & Orang Tua',
    'e-VAK & e-GOA',
    'e-TOBK Intensif + Hasil Analisis Detail',
    'e-EPB & e-Empati Mandiri',
    'e-Buku Sakti, e-Racing & e-Rumus',
    'Konsultasi Jurusan PTN & Parents Meeting'
  ],
  '12 SMA SNBT': [
    'Pembelajaran Tatap Muka (4 KBM/pekan, 90 menit)',
    'Tutorial Service Time (TST)',
    'Bupel GO Semester Ganjil & Genap TA 2026/2027',
    'Bupel GO Mapel Pilihan (Kurikulum Merdeka)',
    'Aplikasi GO Expert Siswa & Orang Tua',
    'e-VAK & e-GOA',
    'e-TOBK SNBT Intensif + e-Paket Soal',
    'e-EPB & e-Empati Mandiri/Wajib',
    'e-Buku Sakti, e-Racing & Soal SNBT'
  ],
  '11 SMA': [
    'Pembelajaran Tatap Muka (4 KBM/pekan, 90 menit)',
    'Tutorial Service Time (TST)',
    'Bupel GO Semester Ganjil & Genap TA 2026/2027',
    'Bupel GO Mapel Pilihan',
    'Aplikasi GO Expert Siswa & Orang Tua',
    'e-VAK & e-GOA',
    'e-Teori, e-Kuis, e-Paket Soal & e-TOBK',
    'e-EPB & e-Empati Wajib/Mandiri',
    'e-Buku Sakti, e-Racing, e-SoRef & e-Rumus',
    'Leaderboard Nasional & Konsultasi EPB'
  ],
  '10 SMA': [
    'Pembelajaran Tatap Muka (4 KBM/pekan, 90 menit)',
    'Tutorial Service Time (TST)',
    'Bupel GO Semester Ganjil & Genap TA 2026/2027',
    'Aplikasi GO Expert Siswa & Orang Tua',
    'e-VAK & e-GOA',
    'e-Teori, e-Kuis, e-Paket Soal & e-TOBK',
    'e-EPB & e-Empati Mandiri/Wajib',
    'e-Buku Sakti, e-Racing, e-SoRef & e-Rumus'
  ],
  '9 SMP': [
    'Pembelajaran Tatap Muka (4 KBM/pekan, 90 menit)',
    'Tutorial Service Time (TST)',
    'Bupel GO Semester Ganjil & Genap TA 2026/2027',
    'Aplikasi GO Expert Siswa & Orang Tua',
    'e-VAK & e-GOA',
    'e-Teori, e-Kuis, e-Paket Soal & e-TOBK',
    'e-EPB & e-Empati Mandiri/Wajib',
    'e-Buku Sakti, e-Racing, e-SoRef & e-Rumus',
    'Konsultasi PPDB (Pilih SMA Favorit)'
  ],
  '8 SMP': [
    'Pembelajaran Tatap Muka (4 KBM/pekan, 90 menit)',
    'Tutorial Service Time (TST)',
    'Bupel GO Semester Ganjil & Genap TA 2026/2027',
    'Aplikasi GO Expert Siswa & Orang Tua',
    'e-VAK & e-GOA',
    'e-Teori, e-Kuis, e-Paket Soal & e-TOBK',
    'e-EPB & e-Empati Mandiri/Wajib',
    'e-Buku Sakti, e-Racing, e-SoRef & e-Rumus'
  ],
  '7 SMP': [
    'Pembelajaran Tatap Muka (4 KBM/pekan, 90 menit)',
    'Tutorial Service Time (TST)',
    'Bupel GO Semester Ganjil & Genap TA 2026/2027',
    'Aplikasi GO Expert Siswa & Orang Tua',
    'e-VAK & e-GOA',
    'e-Teori, e-Kuis, e-Paket Soal & e-TOBK',
    'e-EPB & e-Empati Mandiri/Wajib',
    'e-Buku Sakti & e-Racing'
  ],
  '6 SD': [
    'Pembelajaran Tatap Muka (4 KBM/pekan, 60 menit)',
    'Tutorial Service Time (TST)',
    'Bupel GO Semester Ganjil & Genap TA 2026/2027',
    'Aplikasi GO Expert Siswa & Orang Tua',
    'e-VAK & e-GOA',
    'e-Teori, e-Kuis, e-Paket Soal & e-TOBK',
    'e-EPB & e-Empati Mandiri/Wajib',
    'Konsultasi Pemilihan PPDB (SMP Favorit)'
  ],
  '5 SD': [
    'Pembelajaran Tatap Muka (4 KBM/pekan, 60 menit)',
    'Tutorial Service Time (TST)',
    'Bupel GO Semester Ganjil & Genap TA 2026/2027',
    'Aplikasi GO Expert Siswa & Orang Tua',
    'e-VAK & e-GOA',
    'e-Teori, e-Kuis, e-Paket Soal & e-TOBK',
    'e-EPB & e-Buku Sakti'
  ],
  '4 SD': [
    'Pembelajaran Tatap Muka (4 KBM/pekan, 60 menit)',
    'Tutorial Service Time (TST)',
    'Bupel GO Semester Ganjil & Genap TA 2026/2027',
    'Aplikasi GO Expert Siswa & Orang Tua',
    'e-VAK & e-GOA',
    'e-Teori, e-Kuis, e-Paket Soal',
    'e-EPB & e-Buku Sakti'
  ]
};

const DEFAULT_HARGA: Record<string, number> = {
  "13 ALUMNI UMUM":11500000,"12 SMA SNBT":11500000,"12 SMA":11500000,"11 SMA":10200000,"10 SMA":10200000,
  "9 SMP":8900000,"8 SMP":8900000,"7 SMP":8900000,
  "6 SD":7500000,"5 SD":7500000,"4 SD":7500000,
};

const SLP_DISCOUNT_BY_MONTH: Record<string, number> = {
  'November': 250000,
  'Desember': 225000,
  'Januari': 200000,
  'Februari': 175000,
  'Maret': 150000,
  'April': 125000,
  'Mei': 100000,
  'Juni': 75000,
};

const PROMO_RATE_BY_MONTH: Record<string, number> = {
  'November': 0.20,
  'Desember': 0.17,
  'Januari': 0.14,
  'Februari': 0.11,
  'Maret': 0.08,
  'April': 0.05,
  'Mei': 0.03,
  'Juni': 0.01,
};

interface CustomDiscount {
  id: string;
  type: string;
  nominal: number;
  isPercent: boolean;
  percent: number;
}

export default function ModulPenawaranBimbel() {
  const [selectedUnit, setSelectedUnit] = useState<string>('Unit Agus Salim');
  const [studentType, setStudentType] = useState<'fresh' | 'slp'>('fresh');
  const [grade, setGrade] = useState<string>('12 SMA');
  const [basePrice, setBasePrice] = useState<number>(11500000);
  const [bulanDaftar, setBulanDaftar] = useState<string>('November');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'installment'>('cash');

  const [hargaMap, setHargaMap] = useState<Record<string,{harga:number; program_name:string; medical_addon:number}>>({});
  const [hargaLoaded, setHargaLoaded] = useState(false);

  // Identitas
  const [namaSiswa, setNamaSiswa] = useState<string>('');
  const [noHp, setNoHp] = useState<string>('');
  const [asalSekolah, setAsalSekolah] = useState<string>('');
  const [noRegInput, setNoRegInput] = useState<string>('');
  const [slpCheckResult, setSlpCheckResult] = useState<any>(null);
  const [checkingSlp, setCheckingSlp] = useState<boolean>(false);

  // Dynamic Diskon
  const [discounts, setDiscounts] = useState<CustomDiscount[]>([
    { id: '1', type: 'Diskon Promo Bulanan', nominal: 0, isPercent: true, percent: 20 }
  ]);

  useEffect(()=>{
    (async()=>{
      try{
        const { data, error } = await supabase.from("admin_unit_program_prices").select("unit,tingkat_kelas,program_name,harga,medical_addon");
        if(!error && data && data.length){
          const m: Record<string,{harga:number; program_name:string; medical_addon:number}> = {};
          (data as any[]).forEach(r=>{ m[r.unit+"|"+r.tingkat_kelas]={harga:Number(r.harga), program_name:r.program_name, medical_addon:Number(r.medical_addon||0)}; });
          setHargaMap(m);
        } else {
          try{
            const cached = typeof window!=='undefined' ? localStorage.getItem("harga_bimbel_rows") : null;
            if(cached){
              const parsed = JSON.parse(cached);
              if(Array.isArray(parsed) && parsed.length){
                const m: Record<string,{harga:number; program_name:string; medical_addon:number}> = {};
                parsed.forEach((r:any)=>{ m[r.unit+"|"+r.tingkat_kelas]={harga:Number(r.harga), program_name:r.program_name, medical_addon:Number(r.medical_addon||0)}; });
                if(Object.keys(m).length) setHargaMap(m);
              }
            }
          }catch{}
        }
      }catch{}
      setHargaLoaded(true);
    })();
  },[]);

  useEffect(()=>{
    if(!hargaLoaded) return;
    const key = selectedUnit+"|"+grade;
    const hit = hargaMap[key];
    if(hit) setBasePrice(hit.harga);
    else setBasePrice(DEFAULT_HARGA[grade] ?? 7500000);
  },[selectedUnit, grade, hargaLoaded, hargaMap]);

  useEffect(()=>{
    const pRate = PROMO_RATE_BY_MONTH[bulanDaftar] ?? 0.20;
    setDiscounts(prev => prev.map(d => d.type.includes('Diskon Promo') ? { ...d, percent: pRate * 100 } : d));
  }, [bulanDaftar]);

  const regFee = studentType === 'fresh' ? 200000 : 0;
  const slpDynamicNominal = studentType === 'slp' ? (SLP_DISCOUNT_BY_MONTH[bulanDaftar] ?? 250000) : 0;

  let current = basePrice;
  const discountLogs: { label: string; amount: number }[] = [];

  if (studentType === 'slp') {
    current -= slpDynamicNominal;
    discountLogs.push({ label: `Diskon Tetap SLP (${bulanDaftar})`, amount: slpDynamicNominal });
  }

  discounts.forEach((disc) => {
    let amt = disc.isPercent ? current * (disc.percent / 100) : disc.nominal;
    current -= amt;
    discountLogs.push({ label: disc.type, amount: amt });
  });

  const finalNet = Math.max(0, current + regFee);
  const totalSavings = discountLogs.reduce((acc, item) => acc + item.amount, 0) + (studentType === 'slp' ? slpDynamicNominal : 0);
  const installmentPerMonth = Math.round(finalNet / 7);
  const currentGradeFacilities = FACILITIES[grade] || FACILITIES['12 SMA'];

  const handleAddDiscount = (typeName: string) => {
    let defaultPct = 5;
    if (typeName.includes('Loyalitas')) defaultPct = 8;
    else if (typeName.includes('Ranking 1')) defaultPct = 20;
    else if (typeName.includes('Anak Guru')) defaultPct = 50;
    setDiscounts([...discounts, { id: Date.now().toString(), type: typeName, nominal: 0, isPercent: true, percent: defaultPct }]);
  };

  const handleRemoveDiscount = (id: string) => {
    setDiscounts(discounts.filter(d => d.id !== id));
  };

  const handleUpdateDiscount = (id: string, field: string, val: any) => {
    setDiscounts(discounts.map(d => d.id === id ? { ...d, [field]: val } : d));
  };

  async function handleCheckSlp(e: React.FormEvent) {
    e.preventDefault();
    if (!noRegInput.trim()) return;
    setCheckingSlp(true);
    try {
      const { data, error } = await supabase
        .from('students_slp_2627')
        .select('*')
        .eq('no_reg', noRegInput.trim())
        .single();

      if (error || !data) {
        setSlpCheckResult({ found: false, message: 'Nomor registrasi SLP tidak ditemukan di Unit Agus Salim.' });
      } else {
        setSlpCheckResult({ found: true, data });
        setStudentType('slp');
        setNamaSiswa(data.nama_siswa || '');
        setAsalSekolah(data.asal_sekolah || '');
        setNoHp(data.no_hp || '');
      }
    } catch (err: any) {
      setSlpCheckResult({ found: false, message: 'Gagal memeriksa database SLP.' });
    } finally {
      setCheckingSlp(false);
    }
  }

  function handleSendWhatsApp() {
    if (!namaSiswa || !noHp || !asalSekolah) {
      alert('Mohon lengkapi Nama Siswa, No. WhatsApp, dan Asal Sekolah.');
      return;
    }
    const hargaKey = selectedUnit+"|"+grade;
    const hitProgram = hargaMap[hargaKey]?.program_name;
    const programName = hitProgram || 'TWT Eksekutif Silver';

    const facilitiesListStr = currentGradeFacilities.map((f) => `  - ${f}`).join('\n');
    const rincianDiskon = discountLogs.map(d => `  - ${d.label}: -Rp ${Math.round(d.amount).toLocaleString('id-ID')}`).join('\n');

    const waText = encodeURIComponent(
      `📄 *SURAT PENAWARAN RESMI BIMBINGAN BELAJAR GANESHA OPERATION*\n` +
      `Cabang: *${selectedUnit}* (TA 2027/2028)\n\n` +
      `Kepada Yth. Orang Tua / Siswa:\n` +
      `Nama: *${namaSiswa}*\n` +
      `Asal Sekolah: ${asalSekolah}\n` +
      `Program: *${programName}* (${grade})\n` +
      `Status: *${studentType.toUpperCase()}* | Bulan Daftar: *${bulanDaftar}*\n` +
      `Metode: *${paymentMethod === 'cash' ? 'Lunas Tunai' : 'Cicilan 7x'}*\n\n` +
      `💰 *RINCIAN BIAYA & INVESTASI:*\n` +
      `Harga Normal: Rp ${basePrice.toLocaleString('id-ID')}\n` +
      (studentType === 'slp' ? `- Diskon Tetap SLP (${bulanDaftar}): -(Rp ${slpDynamicNominal.toLocaleString('id-ID')})\n` : '') +
      `${rincianDiskon ? rincianDiskon + '\n' : ''}` +
      (studentType === 'fresh' ? `+ Biaya Pendaftaran: Rp 200.000\n` : '') +
      `-----------------------------------\n` +
      `🌟 *TOTAL NET INVESTASI: Rp ${Math.round(finalNet).toLocaleString('id-ID')}*\n` +
      `🎉 Total Hemat: Rp ${Math.round(totalSavings).toLocaleString('id-ID')}\n` +
      (paymentMethod === 'installment' ? `💡 Skema Cicilan: ~Rp ${installmentPerMonth.toLocaleString('id-ID')} / bulan (7x)\n` : '') +
      `\n🎁 *Fasilitas Utama Jenjang ${grade}:*\n` +
      `${facilitiesListStr}\n\n` +
      `Informasi lebih lanjut kunjungi kantor *${selectedUnit}*.`
    );
    window.open(`https://wa.me/${noHp}?text=${waText}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24 print:bg-white print:pb-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 10mm; }
          body * { visibility: hidden; }
          #print-letter, #print-letter * { visibility: visible; }
          #print-letter {
            position: absolute; left: 0; top: 0; width: 100%;
            margin: 0; padding: 0; background: white !important; font-size: 10px;
          }
          .print\\\\:hidden { display: none !important; }
        }
      ` }} />

      <header className="sticky top-0 z-50 bg-[#faf8ff]/85 backdrop-blur-xl border-b border-gray-200 print:hidden">
        <div className="max-w-5xl mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo_go_standar.png" alt="Ganesha Operation" className="h-10 w-auto object-contain bg-white rounded-xl p-1.5 shadow-sm border border-red-100" />
            <div>
              <h1 className="font-bold text-lg leading-tight">Modul Penawaran Bimbel</h1>
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#fea619] text-[#684000] text-xs font-bold">
                Ganesha Operation Semadura · TA 2027/2028
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
            >
              <span>🖨️ Cetak Surat Penawaran</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 print:p-0 print:max-w-none">
        
        {/* Banner */}
        <div className="bg-[#dc2626] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-2 print:hidden">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-[#fea619] text-[#684000] text-xs font-bold uppercase tracking-wider">
              📄 Surat Penawaran Resmi & Kalkulator Diskon Dinamis
            </span>
            <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full">{selectedUnit}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Modul Penawaran Bimbel Ganesha Operation Semadura
          </h2>
          <p className="text-red-100 text-sm">
            Pilih unit, atur diskon fleksibel, diskon SLP otomatis sesuai bulan mendaftar, serta cetak surat penawaran 1 halaman penuh.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block print:space-y-0">
          
          {/* Kolom Kiri: Form & Diskon Dinamis (Hidden on Print) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-5 print:hidden">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center justify-between">
              <span>Data &amp; Konfigurasi Penawaran</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">1. Pilih Unit GO</label>
              <select 
                value={selectedUnit} 
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-sm font-bold bg-red-50 text-[#b70011]"
              >
                {SEMADURA_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">2. Status &amp; Cari Nomor Registrasi SLP</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setStudentType('fresh')}
                  className={`py-2 px-3 rounded-xl font-bold text-sm border transition ${studentType === 'fresh' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                >
                  Siswa Fresh (Baru)
                </button>
                <button
                  type="button"
                  onClick={() => setStudentType('slp')}
                  className={`py-2 px-3 rounded-xl font-bold text-sm border transition ${studentType === 'slp' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                >
                  Siswa SLP (Ex-GO)
                </button>
              </div>

              {studentType === 'slp' && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
                  <p className="text-xs text-amber-900 font-semibold">Cari No. Registrasi SLP (Basis data Master: Unit Agus Salim Sumenep. Unit lain menyusul):</p>
                  <form onSubmit={handleCheckSlp} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Contoh: REG-2026-001" 
                      value={noRegInput}
                      onChange={(e) => setNoRegInput(e.target.value)}
                      className="flex-1 p-2 border rounded-xl text-xs bg-white"
                    />
                    <button 
                      type="submit" 
                      disabled={checkingSlp}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                    >
                      {checkingSlp ? 'Cari...' : 'Cari Reg'}
                    </button>
                  </form>
                  {slpCheckResult && (
                    <div className={`text-xs p-2 rounded-lg ${slpCheckResult.found ? 'bg-green-100 text-green-900 font-bold' : 'bg-red-100 text-red-900'}`}>
                      {slpCheckResult.found ? `✅ Ditemukan: ${slpCheckResult.data.nama_siswa} (${slpCheckResult.data.asal_sekolah})` : slpCheckResult.message}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  value={namaSiswa}
                  onChange={(e) => setNamaSiswa(e.target.value)}
                  placeholder="Masukkan nama lengkap siswa"
                  className="w-full mt-1 p-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">No. WhatsApp Orang Tua / Siswa</label>
                <input
                  type="text"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full mt-1 p-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Asal Sekolah</label>
                <input
                  type="text"
                  value={asalSekolah}
                  onChange={(e) => setAsalSekolah(e.target.value)}
                  placeholder="Contoh: SMAN 1 Pamekasan"
                  className="w-full mt-1 p-2 border rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">Tingkat Kelas &amp; Paket</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full mt-1 p-2 border rounded-xl text-sm font-semibold"
              >
                <option value="13 ALUMNI UMUM">13 ALUMNI UMUM (TWT Eksekutif Silver) - Rp 11.5 Juta</option>
                <option value="12 SMA SNBT">12 SMA SNBT (TWT Eksekutif Silver) - Rp 11.5 Juta</option>
                <option value="12 SMA">12 SMA Umum (TWT Eksekutif Silver) - Rp 11.5 Juta</option>
                <option value="11 SMA">11 SMA Umum (TWT 1 Tahun) - Rp 10.2 Juta</option>
                <option value="10 SMA">10 SMA Umum (TWT 1 Tahun) - Rp 10.2 Juta</option>
                <option value="9 SMP">9 SMP Umum (TWT 1 Tahun) - Rp 8.9 Juta</option>
                <option value="8 SMP">8 SMP Umum (TWT 1 Tahun) - Rp 8.9 Juta</option>
                <option value="7 SMP">7 SMP Umum (TWT 1 Tahun) - Rp 8.9 Juta</option>
                <option value="6 SD">6 SD Dasar (TWT 1 Tahun) - Rp 7.5 Juta</option>
                <option value="5 SD">5 SD Dasar (TWT 1 Tahun) - Rp 7.5 Juta</option>
                <option value="4 SD">4 SD Dasar (TWT 1 Tahun) - Rp 7.5 Juta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">Bulan Pendaftaran (Menentukan Diskon SLP &amp; Promo)</label>
              <select
                value={bulanDaftar}
                onChange={(e) => setBulanDaftar(e.target.value)}
                className="w-full mt-1 p-2 border rounded-xl text-sm font-semibold bg-amber-50 text-amber-900"
              >
                {Object.keys(SLP_DISCOUNT_BY_MONTH).map((b) => (
                  <option key={b} value={b}>{b} 2026 (Diskon SLP: Rp {SLP_DISCOUNT_BY_MONTH[b].toLocaleString('id-ID')} | Promo: {PROMO_RATE_BY_MONTH[b]*100}%)</option>
                ))}
              </select>
            </div>

            {/* DYNAMIC DISCOUNTS MANAGER */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-gray-700 uppercase">Manajemen Diskon (Tambah / Hapus)</h4>
                <div className="flex gap-1">
                  <button type="button" onClick={() => handleAddDiscount('Diskon Loyalitas')} className="px-2 py-1 bg-red-50 text-red-700 border rounded-lg text-xs font-bold hover:bg-red-100">+ Loyalitas</button>
                  <button type="button" onClick={() => handleAddDiscount('Diskon Ranking 1')} className="px-2 py-1 bg-red-50 text-red-700 border rounded-lg text-xs font-bold hover:bg-red-100">+ Ranking</button>
                  <button type="button" onClick={() => handleAddDiscount('Diskon Khusus')} className="px-2 py-1 bg-red-50 text-red-700 border rounded-lg text-xs font-bold hover:bg-red-100">+ Lainnya</button>
                </div>
              </div>

              <div className="space-y-2">
                {discounts.map((disc) => (
                  <div key={disc.id} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border">
                    <select
                      value={disc.type}
                      onChange={(e) => handleUpdateDiscount(disc.id, 'type', e.target.value)}
                      className="text-xs p-1.5 border rounded-lg bg-white font-semibold flex-1"
                    >
                      <option value="Diskon Promo Bulanan">Diskon Promo Bulanan</option>
                      <option value="Diskon Loyalitas">Diskon Loyalitas (SLP)</option>
                      <option value="Diskon Ranking 1">Diskon Ranking 1</option>
                      <option value="Diskon Adik-Kakak">Diskon Adik-Kakak (5%)</option>
                      <option value="Diskon Anak Guru">Diskon Anak Guru (50%)</option>
                      <option value="Diskon Khusus">Diskon Khusus</option>
                    </select>
                    <div className="flex items-center gap-1 w-24">
                      <input
                        type="number"
                        value={disc.percent}
                        onChange={(e) => handleUpdateDiscount(disc.id, 'percent', Number(e.target.value))}
                        className="w-14 text-xs p-1.5 border rounded-lg bg-white text-center font-bold"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveDiscount(disc.id)} className="text-red-600 font-bold px-2 py-1 text-xs" title="Hapus">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPaymentMethod('cash')} className={`py-2 px-3 rounded-xl font-bold text-sm border transition ${paymentMethod === 'cash' ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 text-gray-700'}`}>Lunas Tunai</button>
                <button type="button" onClick={() => setPaymentMethod('installment')} className={`py-2 px-3 rounded-xl font-bold text-sm border transition ${paymentMethod === 'installment' ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 text-gray-700'}`}>Cicilan 7x</button>
              </div>
            </div>

          </div>

          {/* Kolom Kanan: Surat Penawaran (1 Halaman / Print-ready) */}
          <div className="space-y-6 print:space-y-0">
            
            <div id="print-letter" className="bg-white p-6 rounded-2xl shadow-sm border border-red-200 space-y-4 print:border-none print:shadow-none print:p-0">
              
              <div className="text-center border-b pb-3 space-y-1">
                <div className="flex justify-center items-center gap-2">
                  <img src="/images/logo_go_standar.png" alt="Logo" className="h-7 w-auto object-contain" />
                  <h3 className="font-extrabold text-sm text-red-700 uppercase tracking-wide">Ganesha Operation Semadura</h3>
                </div>
                <p className="text-[11px] font-bold text-gray-800">SURAT PENAWARAN RESMI PROGRAM BMBINGAN BELAJAR</p>
                <p className="text-[10px] text-gray-500">Kantor Cabang: <b>{selectedUnit}</b> | Tahun Ajaran 2027/2028</p>
              </div>

              {/* Data Calon Siswa — Compact 1 Baris (Tanpa Duplikasi) */}
              <div className="bg-gray-50 px-3 py-2 rounded-xl text-[11px] border flex flex-wrap gap-x-4 gap-y-1">
                <span><span className="text-gray-500">Siswa:</span> <b>{namaSiswa || '(Belum diisi)'}</b></span>
                <span><span className="text-gray-500">Asal Sekolah:</span> <b>{asalSekolah || '(Belum diisi)'}</b></span>
                <span><span className="text-gray-500">No. WA:</span> <b>{noHp || '(Belum diisi)'}</b></span>
                <span><span className="text-gray-500">Jenjang:</span> <b>{grade}</b></span>
                <span><span className="text-gray-500">Status:</span> <b>{studentType.toUpperCase()} ({bulanDaftar})</b></span>
              </div>

              {/* Rincian Perhitungan */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>Harga Normal ({grade}):</span>
                  <span>Rp {basePrice.toLocaleString('id-ID')}</span>
                </div>

                {studentType === 'fresh' && (
                  <div className="flex justify-between text-blue-700">
                    <span>+ Biaya Pendaftaran Baru:</span>
                    <span>Rp 200.000</span>
                  </div>
                )}

                {studentType === 'slp' && (
                  <div className="flex justify-between text-green-700 font-medium">
                    <span>- Diskon Tetap SLP ({bulanDaftar}):</span>
                    <span>(Rp {slpDynamicNominal.toLocaleString('id-ID')})</span>
                  </div>
                )}

                {discountLogs.map((log, idx) => (
                  <div key={idx} className="flex justify-between text-red-700 text-xs">
                    <span>- {log.label}:</span>
                    <span>(Rp {Math.round(log.amount).toLocaleString('id-ID')})</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t">
                <div className="bg-red-50 p-3 rounded-xl border border-red-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-red-800 uppercase tracking-wider font-bold">Total Net Investasi Bimbel</div>
                    <div className="text-2xl font-black text-red-700">
                      Rp {Math.round(finalNet).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      🎁 Total Hemat: Rp {Math.round(totalSavings).toLocaleString('id-ID')}
                    </div>
                  </div>
                  {paymentMethod === 'installment' && (
                    <div className="text-right text-[11px] text-gray-700 bg-white p-2 rounded-lg border">
                      <div className="font-bold text-red-600">Skema Cicilan 7x:</div>
                      <div>~Rp {installmentPerMonth.toLocaleString('id-ID')} / bln</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fasilitas */}
              <div className="space-y-1.5 pt-1">
                <h4 className="font-bold text-xs text-red-700 uppercase">Fasilitas Resmi Jenjang {grade}:</h4>
                <ul className="grid grid-cols-2 gap-1 text-[10px] leading-tight text-gray-700">
                  {currentGradeFacilities.map((f, i) => (
                    <li key={i} className="flex items-start gap-1 bg-gray-50 px-1.5 py-1 rounded border">
                      <span className="text-red-600 font-bold">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 print:hidden flex gap-2">
                <button onClick={handleSendWhatsApp} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow transition text-xs flex items-center justify-center gap-2">
                  <span>📲 Kirim WhatsApp</span>
                </button>
                <button onClick={() => window.print()} className="bg-gray-800 hover:bg-black text-white font-bold py-2.5 px-4 rounded-xl shadow transition text-xs flex items-center justify-center gap-1.5">
                  <span>🖨️ Cetak 1 Halaman</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
