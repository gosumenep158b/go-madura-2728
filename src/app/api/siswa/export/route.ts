import { NextResponse } from 'next/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { buildExportTable } from '@/lib/exportSiswa';
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

    const { headers, rows } = buildExportTable(siswa, pembayaran);

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
