import { NextResponse } from 'next/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { buildExportTable } from '@/lib/exportSiswa';
import { getSheetsClient, assertSheetEnv, sheetErrorMessage } from '@/lib/googleSheet';

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
    if (!error && data && data.length === 0) {
      try { const f = JSON.parse(readFileSync(siswaPath, 'utf-8')); if (Array.isArray(f) && f.length) return f; } catch {}
      return [];
    }
  } catch {}
  try { return JSON.parse(readFileSync(siswaPath, 'utf-8')); } catch { return []; }
}

async function readPembayaranAll(): Promise<any[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('pembayaran').select('*').order('tanggal', { ascending: true }).limit(5000);
    if (!error && data && data.length > 0) return data;
  } catch {}
  try { return JSON.parse(readFileSync(pembayaranPath, 'utf-8')); } catch { return []; }
}

// POST { ta?, unit? } -> tulis ulang sheet pertama dengan tabel export (header + rows)
export async function POST(req: Request) {
  try {
    const { sheetId } = assertSheetEnv();
    const body = (await req.json().catch(() => ({}))) as { ta?: string; unit?: string };
    let siswa = await readSiswaAll();
    if (body.ta && body.ta !== 'Semua') siswa = siswa.filter((s: any) => (s.tahun_ajaran || '') === body.ta);
    if (body.unit && body.unit !== 'Semua') siswa = siswa.filter((s: any) => (s.unit || '').trim() === body.unit);

    const pembayaran = await readPembayaranAll();
    const { headers, rows } = buildExportTable(siswa, pembayaran);
    const values = [headers, ...rows];

    const sheets = getSheetsClient();
    // Tulis ke sheet pertama (gid=0)
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId, fields: 'sheets.properties' });
    const firstTitle = meta.data.sheets?.[0]?.properties?.title || 'Sheet1';

    await sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range: `${firstTitle}!A:AG` });
    const res = await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${firstTitle}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    return NextResponse.json({
      success: true,
      sheet: firstTitle,
      siswa: siswa.length,
      updatedCells: res.data.updatedCells || 0,
    });
  } catch (e: any) {
    if (String(e?.message || '').startsWith('ENV belum lengkap')) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    console.error('[api/siswa/google-sheet]', e);
    return NextResponse.json({ error: sheetErrorMessage(e) }, { status: 500 });
  }
}
