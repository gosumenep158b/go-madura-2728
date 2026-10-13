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

export async function GET() {
  try {
    let siswa: any[] = await readSiswaAll();
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

    const rows: any[][] = siswa.map((s: any, i: number) => {
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
      // Infer CABANG/KOTA/UNIT from kelas_go or kosong
      // Kelas GO format 4-SD-R-N-230 -> tidak ada cabang. Pakai kelas_go untuk UNIT, CABANG/KOTA kosong.
      return [
        i + 1,                          // NO
        s.no_reg || '',                 // NO REGISTRASI (manual)
        '',                             // CABANG
        '',                             // KOTA
        s.unit || s.kelas_go || '',     // UNIT (nama unit / fallback kelas GO)
        s.tgl_lahir || '',              // TGL LAHIR
        s.program || '',                // PROGRAM
        s.status_bayar || '',           // STATUS BAYAR
        s.nama_siswa || '',             // NAMA
        ...bayarSlots,                  // 9..20 (12 cols)
        totalBayar,                     // 21 TOTAL BAYAR
        HARGA_PENDAFTARAN,              // 22 HARGA PENDAFTARAN
        hargaNormal,                    // 23 HARGA NORMAL
        diskon,                         // 24 JUMLAH DISKON
        '',                             // 25 KETERANGAN
        hargaHarusBayar,                // 26 HARGA YANG HARUS DIBAYAR
        sisa,                           // 27 SISA HARGA YANG MASIH HARUS DIBAYAR
        s.asal_sekolah || '',           // 28 ASAL SEKOLAH
        s.no_hp || '',                  // 29 NOMOR HP SISWA
        s.nama_ortu || '',              // 30 NAMA ORANGTUA
        s.no_hp_ortu || '',             // 31 NO HP ORTU 1
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
        'Content-Disposition': 'attachment; filename="siswa_export.xlsx"',
        'Content-Length': String(ab.length),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Gagal export siswa' }, { status: 500 });
  }
}
