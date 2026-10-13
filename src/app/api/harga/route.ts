import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hargaForTingkat } from '@/lib/program';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qyjtbddnjvqhvukgubwb.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh';
  return createClient(url, key);
}

// GET /api/harga?kota=&unit=&tingkat=&program= -> { harga, source: 'master'|'default' }
export async function GET(req: Request) {
  const url = new URL(req.url);
  const kota = url.searchParams.get('kota') || '';
  const unit = url.searchParams.get('unit') || '';
  const tingkat = url.searchParams.get('tingkat') || '';
  const program = url.searchParams.get('program') || '';

  const fallback = tingkat ? hargaForTingkat(tingkat) : 0;
  if (!tingkat || !program) return NextResponse.json({ harga: fallback, source: 'default' });

  try {
    const supabase = getSupabase();
    let q = supabase
      .from('harga_bimbel')
      .select('harga,kota,unit')
      .eq('tingkat_kelas', tingkat)
      .eq('program', program)
      .eq('is_active', true)
      .limit(10);
    if (unit) q = q.eq('unit', unit);
    if (kota) q = q.eq('kota', kota);
    const { data, error } = await q;
    if (!error && data && data.length > 0) {
      // Prioritas: cocok kota+unit > cocok unit > baris mana pun
      const exact = data.find((r: any) => (!kota || r.kota === kota) && (!unit || r.unit === unit));
      const hit = exact || data[0];
      return NextResponse.json({ harga: Number((hit as any).harga || 0), source: 'master' });
    }
  } catch (e) {
    console.warn('[api/harga] supabase unavailable, fallback default', e);
  }
  return NextResponse.json({ harga: fallback, source: 'default' });
}
