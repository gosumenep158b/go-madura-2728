import { NextResponse } from 'next/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { getSessionFromRequest, canEditSiswa } from '@/lib/auth';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qyjtbddnjvqhvukgubwb.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh';
  return createClient(url, key);
}

// POST /api/siswa/migrate — khusus super admin & CS.
// Memindahkan baris arsip src/data/siswa.json yang belum ada di Supabase (batch 100).
export async function POST(req: Request) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Belum login.' }, { status: 401 });
    if (!canEditSiswa(session.role)) {
      return NextResponse.json({ error: 'Hanya super admin & CS yang boleh migrasi arsip.' }, { status: 403 });
    }

    let file: any[] = [];
    try {
      file = JSON.parse(readFileSync(join(process.cwd(), 'src/data/siswa.json'), 'utf-8')) as any[];
    } catch {
      return NextResponse.json({ error: 'File arsip tidak ditemukan.' }, { status: 500 });
    }
    if (!Array.isArray(file) || file.length === 0) {
      return NextResponse.json({ success: true, inserted: 0, skipped: 0, total: 0 });
    }

    const supabase = getSupabase();
    const { data: existing, error: readErr } = await supabase.from('siswa').select('no_reg').limit(5000);
    if (readErr) {
      const code = (readErr as any).code;
      if (code === 'PGRST205' || code === '42P01') {
        return NextResponse.json({ error: 'Tabel siswa belum ada — jalankan database/siswa_schema.sql dulu.' }, { status: 500 });
      }
      return NextResponse.json({ error: 'Gagal baca Supabase: ' + readErr.message }, { status: 500 });
    }
    const have = new Set(((existing as any[]) || []).map((r) => r.no_reg));
    const missing = file.filter((s) => s && s.no_reg && !have.has(s.no_reg));
    if (missing.length === 0) {
      return NextResponse.json({ success: true, inserted: 0, skipped: file.length, total: file.length });
    }

    const toPayload = (s: any) => ({
      no_reg: s.no_reg,
      tgl_lahir: s.tgl_lahir || null,
      nama_siswa: s.nama_siswa,
      no_hp: s.no_hp || null,
      nama_ortu: s.nama_ortu || s.nama_ayah || null,
      no_hp_ortu: s.no_hp_ortu || s.no_hp_ayah || null,
      nama_ayah: s.nama_ayah || null,
      no_hp_ayah: s.no_hp_ayah || null,
      nama_ibu: s.nama_ibu || null,
      no_hp_ibu: s.no_hp_ibu || null,
      cabang: s.cabang || null,
      kota: s.kota || null,
      keterangan: s.keterangan || null,
      unit: s.unit || null,
      kelas_go: s.kelas_go || null,
      tingkat_kelas: s.tingkat_kelas || null,
      program: s.program || null,
      asal_sekolah: s.asal_sekolah || null,
      tgl_daftar: s.tgl_daftar || null,
      tahun_ajaran: s.tahun_ajaran || '2026/2027',
      status_bayar: s.status_bayar || 'belum_lunas',
      total_tagihan: Number(s.total_tagihan ?? 0),
      sisa_tagihan: Number(s.sisa_tagihan ?? s.total_tagihan ?? 0),
      metode_bayar: s.metode_bayar || null,
    });

    let inserted = 0;
    const errors: string[] = [];
    for (let i = 0; i < missing.length; i += 100) {
      const chunk = missing.slice(i, i + 100).map(toPayload);
      const { error } = await supabase.from('siswa').insert(chunk);
      if (error) {
        const code = (error as any).code;
        if (code === '42703') {
          return NextResponse.json({ error: 'Kolom Supabase belum update — jalankan ulang database/siswa_schema.sql, lalu coba lagi.' }, { status: 500 });
        }
        errors.push(`batch ${i / 100 + 1}: ${error.message}`);
      } else {
        inserted += chunk.length;
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      inserted,
      skipped: file.length - missing.length,
      total: file.length,
      errors: errors.length ? errors : undefined,
      error: errors.length ? 'Sebagian gagal: ' + errors.join('; ') : undefined,
    }, { status: errors.length ? 500 : 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Gagal migrasi arsip.' }, { status: 500 });
  }
}
