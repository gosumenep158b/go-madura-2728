import { NextResponse } from 'next/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { EXPORT_HEADERS, hargaForTingkat, HARGA_PENDAFTARAN } from '@/lib/program';
const siswaPath = join(process.cwd(), 'src/data/siswa.json');
const pembayaranPath = join(process.cwd(), 'src/data/pembayaran.json');

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qyjtbddnjvqhvukgubwb.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh';
  return createClient(url, key);
}

async function readSiswaAll(): Promise<any[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('siswa').select('*').order('created_at', { ascending: false }).limit(2000);
    if (!error && data && data.length > 0) return data;
    if (error && (error as any).code !== 'PGRST205') console.warn('[export] supabase read error', (error as any).message);
    // if table missing or empty -> fallback file (seed data)
    if (!error && data && data.length === 0) {
      try { const f = JSON.parse(readFileSync(siswaPath, 'utf-8')); if (Array.isArray(f) && f.length) return f; } catch {}
      return [];
    }
  } catch (e) { console.warn('[export] supabase unavailable', e); }
  try { return JSON.parse(readFileSync(siswaPath, 'utf-8')); } catch { return []; }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ta = url.searchParams.get('ta');
    const unit = url.searchParams.get('unit');
    let siswa: any[] = await readSiswaAll();
    if (ta && ta !== 'Semua') siswa = siswa.filter((s: any) => (s.tahun_ajaran || '') === ta);
    if (unit && unit !== 'Semua') siswa = siswa.filter((s: any) => (s.unit || '').trim() === unit);
    let pembayaran: any[] = [];
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('pembayaran').select('*').order('tanggal', { ascending: true }).limit(5000);
      if (!error && data && data.length > 0) pembayaran = data;
      else throw error || new Error('empty');
    } catch {
      try { pembayaran = JSON.parse(readFileSync(pembayaranPath, 'utf-8')); } catch { pembayaran = []; }
    }

    // Group pembayaran by no_reg sorted by tanggal
    const payByReg: Record<string, any[]> = {};
    pembayaran.forEach((p:any)=> {
      if(!payByReg[p.no_reg]) payByReg[p.no_reg]=[];
      payByReg[p.no_reg].push(p);
    });
    Object.values(payByReg).forEach(arr=> arr.sort((a:any,b:any)=> String(a.tanggal).localeCompare(String(b.tanggal))));

    const headers = [...EXPORT_HEADERS] as string[];

    const rows: any[][] = siswa.map((s: any) => {
      const total = Number(s.total_tagihan ?? 0);
      const sisa = Number(s.sisa_tagihan ?? total);
      const hargaNormal = s.tingkat_kelas ? hargaForTingkat(s.tingkat_kelas) : 0;
      const hargaHarusBayar = total;
      const diskon = Math.max(0, hargaNormal - hargaHarusBayar);
      const pays = (payByReg[s.no_reg] || []).slice(0,6);
      const totalBayar = pays.reduce((a:any,c:any)=> a + Number(c.jumlah||0), 0) || Math.max(0, total - sisa);
      // Build 12 slots: JUMLAH BAYAR 1, TGL 1 ... JUMLAH BAYAR 6, TGL 6
      const bayarSlots: any[] = [];
      for(let k=0;k<6;k++){
        const p = pays[k];
        bayarSlots.push(p ? Number(p.jumlah) : '');
        bayarSlots.push(p ? String(p.tanggal||'') : '');
      }
      const namaAyah = s.nama_ayah || s.nama_ortu || '';
      const namaIbu = s.nama_ibu || '';
      const hpAyah = s.no_hp_ayah || s.no_hp_ortu || '';
      const hpIbu = s.no_hp_ibu || '';
      return [
        s.no_reg || '',                 // NO REGISTRASI
        s.cabang || '',                 // CABANG
        s.kota || '',                   // KOTA
        s.unit || '',                   // UNIT
        s.tgl_lahir || '',              // TGL LAHIR
        s.program || '',                // PROGRAM
        s.status_bayar || '',           // STATUS BAYAR
        s.nama_siswa || '',             // NAMA
        ...bayarSlots,                  // JUMLAH/TGL BAYAR 1-6 (12 cols)
        totalBayar,                     // TOTAL BAYAR
        HARGA_PENDAFTARAN,              // HARGA PENDAFTARAN
        hargaNormal,                    // HARGA NORMAL
        diskon,                         // JUMLAH DISKON
        s.keterangan || '',             // KETERANGAN
        hargaHarusBayar,                // HARGA YANG HARUS DIBAYAR
        sisa,                           // SISA HARGA YANG MASIH HARUS DIBAYAR
        s.asal_sekolah || '',           // ASAL SEKOLAH
        s.no_hp || '',                  // NOMOR HP SISWA
        namaAyah,                       // NAMA ORANGTUA AYAH
        namaIbu,                        // NAMA ORANGTUA IBU
        hpAyah,                         // NO HP ORTU AYAH
        hpIbu,                          // NO HP ORTU IBU
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map(() => ({ wch: 16 }));
    // Bold header
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Siswa');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as unknown as Uint8Array;
    const ab = buf instanceof Uint8Array ? buf : new Uint8Array(buf as any);

    return new NextResponse(ab as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="siswa_export_${(ta || 'semua').replace('/', '-')}_${(unit || 'semua-unit').replace(/\s+/g, '-')}.xlsx"`,
        'Content-Length': String(ab.length),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Gagal export siswa' }, { status: 500 });
  }
}
