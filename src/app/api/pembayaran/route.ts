import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { autoSyncSheet } from '@/app/api/siswa/google-sheet/route'

export interface Pembayaran {
  id: string;
  no_reg: string;
  tanggal: string; // YYYY-MM-DD
  jumlah: number;
  metode: 'tunai' | 'transfer' | 'qris' | 'lainnya';
  keterangan?: string;
  cicilan_ke?: number;
  created_at: string;
}

const pembayaranPath = join(process.cwd(), 'src/data/pembayaran.json')
const siswaPath = join(process.cwd(), 'src/data/siswa.json')

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qyjtbddnjvqhvukgubwb.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh'
  return createClient(url, key)
}

function isTableMissing(error: any): boolean {
  const code = (error as any)?.code
  const msg = String((error as any)?.message || '').toLowerCase()
  return code === 'PGRST205' || code === '42P01' || msg.includes('does not exist') || msg.includes('relation') || msg.includes('schema cache')
}

function isReadOnlyFs(e: any): boolean {
  return (e as any)?.code === 'EROFS' || String(e?.message || '').includes('read-only')
}

// ---- Fallback file (seed lokal, read-only di Vercel) ----
function readPembayaranFile(): Pembayaran[] {
  try { return JSON.parse(readFileSync(pembayaranPath, 'utf-8')) as Pembayaran[] } catch { return [] }
}

// ---- Supabase-first readers ----
async function readPembayaranSupabase(noReg?: string | null): Promise<{ data: Pembayaran[]; tableMissing: boolean }> {
  try {
    const supabase = getSupabase()
    let q = supabase.from('pembayaran').select('*').order('tanggal', { ascending: false }).order('created_at', { ascending: false }).limit(2000)
    if (noReg) q = q.eq('no_reg', noReg)
    const { data, error } = await q
    if (!error && data) {
      return {
        data: (data as any[]).map((p) => ({
          id: String(p.id),
          no_reg: p.no_reg,
          tanggal: String(p.tanggal || '').slice(0, 10),
          jumlah: Number(p.jumlah),
          metode: (p.metode as Pembayaran['metode']) || 'tunai',
          keterangan: p.keterangan || '',
          cicilan_ke: p.cicilan_ke != null ? Number(p.cicilan_ke) : undefined,
          created_at: p.created_at || new Date().toISOString(),
        })),
        tableMissing: false,
      }
    }
    if (error && isTableMissing(error)) return { data: [], tableMissing: true }
    if (error) console.warn('[api/pembayaran] supabase read error, fallback file:', (error as any).message)
  } catch (e) { console.warn('[api/pembayaran] supabase unavailable, fallback file', e) }
  return { data: [], tableMissing: false }
}

async function readPembayaran(noReg?: string | null): Promise<{ data: Pembayaran[]; source: 'supabase' | 'file'; tableMissing: boolean }> {
  const sb = await readPembayaranSupabase(noReg)
  if (!sb.tableMissing && sb.data.length > 0) return { data: sb.data, source: 'supabase', tableMissing: false }
  if (!sb.tableMissing && sb.data.length === 0 && noReg) return { data: [], source: 'supabase', tableMissing: false }
  // fallback file bila tabel belum ada, error, atau supabase kosong (seed lokal)
  let file = readPembayaranFile()
  if (noReg) file = file.filter((p) => p.no_reg === noReg)
  file.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.created_at.localeCompare(a.created_at))
  if (sb.tableMissing) return { data: file, source: 'file', tableMissing: true }
  if (sb.data.length > 0) return { data: sb.data, source: 'supabase', tableMissing: false }
  // supabase kosong -> pakai file bila ada isinya (seed), kalau file juga kosong tetap supabase
  if (file.length > 0) return { data: file, source: 'file', tableMissing: false }
  return { data: sb.data, source: 'supabase', tableMissing: false }
}

async function getSiswaTagihan(noReg: string): Promise<{ tagihan: number; row: any | null; tableMissing: boolean }> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from('siswa').select('*').eq('no_reg', noReg).single()
    if (!error && data) return { tagihan: Number((data as any).total_tagihan || 0), row: data, tableMissing: false }
    if (error && isTableMissing(error)) return { tagihan: 0, row: null, tableMissing: true }
    if (error && (error as any).code !== 'PGRST116') console.warn('[api/pembayaran] siswa lookup error', (error as any).message)
  } catch (e) { console.warn('[api/pembayaran] siswa lookup unavailable', e) }
  try {
    const file = JSON.parse(readFileSync(siswaPath, 'utf-8')) as any[]
    const s = file.find((x: any) => x.no_reg === noReg)
    if (s) return { tagihan: Number(s.total_tagihan || 0), row: s, tableMissing: false }
  } catch {}
  return { tagihan: 0, row: null, tableMissing: false }
}

function waNormalize(no: string): string {
  const d = (no || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('62')) return d
  if (d.startsWith('0')) return '62' + d.slice(1)
  if (d.startsWith('8')) return '62' + d
  return d
}

// GET ?no_reg=xxx  -> histori siswa tersebut; tanpa param -> semua (limit 2000)
export async function GET(req: Request) {
  const url = new URL(req.url)
  const no_reg = url.searchParams.get('no_reg')
  const { data, tableMissing } = await readPembayaran(no_reg)
  // total per siswa dihitung dari seluruh histori (tanpa filter)
  const { data: all } = await readPembayaran(null)
  const totalBySiswa: Record<string, number> = {}
  all.forEach((p) => { totalBySiswa[p.no_reg] = (totalBySiswa[p.no_reg] || 0) + Number(p.jumlah) })
  const res = NextResponse.json({ data, totalBySiswa })
  if (tableMissing) res.headers.set('x-pembayaran-source', 'file-table-missing')
  return res
}

// POST { no_reg, jumlah, tanggal, metode, keterangan }
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Pembayaran> & { no_reg: string; jumlah: number }
    if (!body.no_reg || !body.jumlah || Number(body.jumlah) <= 0) return NextResponse.json({ error: 'no_reg dan jumlah wajib (>0)' }, { status: 400 })

    const lookup = await getSiswaTagihan(body.no_reg)
    if (!lookup.row) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
    const tagihan = lookup.tagihan
    if (tagihan <= 0) return NextResponse.json({ error: 'Tagihan siswa belum diatur. Atur total_tagihan dulu via PATCH /api/siswa' }, { status: 400 })

    const { data: existing } = await readPembayaran(body.no_reg)
    const sudahBayar = existing.reduce((a, c) => a + Number(c.jumlah), 0)
    const sisa = tagihan - sudahBayar
    if (Number(body.jumlah) > sisa) return NextResponse.json({ error: `Melebihi sisa tagihan. Sisa: Rp ${sisa.toLocaleString('id-ID')}` }, { status: 400 })

    const cicilan_ke = existing.length + 1
    const rec: Pembayaran = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      no_reg: body.no_reg,
      tanggal: body.tanggal || new Date().toISOString().slice(0, 10),
      jumlah: Number(body.jumlah),
      metode: (body.metode as Pembayaran['metode']) || 'tunai',
      keterangan: body.keterangan || '',
      cicilan_ke,
      created_at: new Date().toISOString(),
    }

    // 1) Simpan ke Supabase dulu
    let savedSupabase = false
    let tableMissing = false
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from('pembayaran').insert({
        id: rec.id, no_reg: rec.no_reg, tanggal: rec.tanggal, jumlah: rec.jumlah,
        metode: rec.metode, keterangan: rec.keterangan || null, cicilan_ke: rec.cicilan_ke,
      })
      if (!error) savedSupabase = true
      else if (isTableMissing(error)) tableMissing = true
      else console.error('[api/pembayaran] supabase insert error', error)
    } catch (e) { console.warn('[api/pembayaran] supabase insert unavailable', e) }

    if (!savedSupabase && tableMissing) {
      // Tabel belum ada -> jangan tulis file di Vercel (read-only), kembalikan instruksi jelas
      return NextResponse.json(
        { error: 'Tabel Supabase pembayaran belum ada — jalankan database/pembayaran_schema.sql di Supabase Dashboard > SQL Editor, lalu coba lagi.' },
        { status: 500 },
      )
    }
    if (!savedSupabase) {
      // Supabase error lain -> coba fallback file lokal (hanya jalan di dev, gagal EROFS di Vercel)
      try {
        const list = readPembayaranFile()
        list.unshift(rec)
        writeFileSync(pembayaranPath, JSON.stringify(list, null, 2), 'utf-8')
        return NextResponse.json({ success: true, data: rec, warning: 'Supabase error — tersimpan ke file lokal (dev only, tidak persisten di Vercel).' })
      } catch (e: any) {
        if (isReadOnlyFs(e)) {
          return NextResponse.json({ error: 'Gagal menyimpan: Supabase tidak tersedia & filesystem Vercel read-only. Cek koneksi Supabase lalu coba lagi.' }, { status: 500 })
        }
        return NextResponse.json({ error: 'Gagal simpan pembayaran' }, { status: 500 })
      }
    }

    // 2) Update siswa sisa & status di Supabase (recalc dari total histori agar konsisten)
    const totalBayarBaru = sudahBayar + Number(body.jumlah)
    const sisaBaru = Math.max(0, tagihan - totalBayarBaru)
    let siswaUpdated: any = null
    try {
      const supabase = getSupabase()
      const patch: any = {
        sisa_tagihan: sisaBaru,
        status_bayar: sisaBaru <= 0 ? 'lunas' : totalBayarBaru > 0 ? 'cicilan' : 'belum_lunas',
      }
      const { data: cur } = await supabase.from('siswa').select('metode_bayar').eq('no_reg', body.no_reg).single()
      if (cur && !(cur as any).metode_bayar) patch.metode_bayar = 'cicilan'
      const { data: upd, error } = await supabase.from('siswa').update(patch).eq('no_reg', body.no_reg).select().single()
      if (!error && upd) siswaUpdated = upd
      else if (error) console.warn('[api/pembayaran] siswa update error', (error as any).message)
    } catch (e) { console.warn('[api/pembayaran] siswa update unavailable', e) }

    const waOrtu = siswaUpdated ? waNormalize(siswaUpdated.no_hp_ortu) : waNormalize((lookup.row as any)?.no_hp_ortu || '')
    autoSyncSheet()
    return NextResponse.json({ success: true, data: rec, siswa: siswaUpdated || lookup.row, waOrtu, sisaBaru, totalBayarBaru })
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Gagal simpan pembayaran' }, { status: 500 }) }
}

// DELETE ?id=xxx  (hapus histori — kembalikan sisa)
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })

    // Cari target di Supabase dulu, fallback file
    let target: Pembayaran | null = null
    let fromSupabase = false
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.from('pembayaran').select('*').eq('id', id).single()
      if (!error && data) {
        target = {
          id: String((data as any).id), no_reg: (data as any).no_reg, tanggal: String((data as any).tanggal).slice(0, 10),
          jumlah: Number((data as any).jumlah), metode: (data as any).metode, keterangan: (data as any).keterangan || '',
          cicilan_ke: (data as any).cicilan_ke, created_at: (data as any).created_at,
        }
        fromSupabase = true
      } else if (error && isTableMissing(error)) {
        return NextResponse.json({ error: 'Tabel Supabase pembayaran belum ada — jalankan database/pembayaran_schema.sql dulu.' }, { status: 500 })
      }
    } catch (e) { console.warn('[api/pembayaran DELETE] supabase lookup unavailable', e) }
    if (!target) {
      const file = readPembayaranFile()
      const hit = file.find((p) => p.id === id)
      if (!hit) return NextResponse.json({ error: 'Pembayaran tidak ditemukan' }, { status: 404 })
      target = hit
    }

    if (fromSupabase) {
      try {
        const supabase = getSupabase()
        const { error } = await supabase.from('pembayaran').delete().eq('id', id)
        if (error) {
          if (isTableMissing(error)) return NextResponse.json({ error: 'Tabel Supabase pembayaran belum ada.' }, { status: 500 })
          throw error
        }
      } catch (e) { console.error(e); return NextResponse.json({ error: 'Gagal hapus' }, { status: 500 }) }
      // recalc siswa dari sisa histori Supabase
      try {
        const supabase = getSupabase()
        const { data: rest } = await supabase.from('pembayaran').select('jumlah').eq('no_reg', (target as Pembayaran).no_reg)
        const totalBayar = ((rest as any[]) || []).reduce((a, c) => a + Number(c.jumlah), 0)
        const { data: s } = await supabase.from('siswa').select('total_tagihan').eq('no_reg', (target as Pembayaran).no_reg).single()
        const tagihan = Number((s as any)?.total_tagihan || 0)
        await supabase.from('siswa').update({
          sisa_tagihan: Math.max(0, tagihan - totalBayar),
          status_bayar: tagihan > 0 && tagihan - totalBayar <= 0 ? 'lunas' : totalBayar > 0 ? 'cicilan' : 'belum_lunas',
        }).eq('no_reg', (target as Pembayaran).no_reg)
      } catch (e) { console.warn('[api/pembayaran DELETE] recalc unavailable', e) }
      autoSyncSheet()
      return NextResponse.json({ success: true })
    }

    // Fallback file (dev only)
    try {
      let list = readPembayaranFile()
      list = list.filter((p) => p.id !== id)
      writeFileSync(pembayaranPath, JSON.stringify(list, null, 2), 'utf-8')
    } catch (e: any) {
      if (isReadOnlyFs(e)) return NextResponse.json({ error: 'Gagal hapus: filesystem Vercel read-only. Migrasi ke tabel Supabase dulu (database/pembayaran_schema.sql).' }, { status: 500 })
      return NextResponse.json({ error: 'Gagal hapus' }, { status: 500 })
    }
    return NextResponse.json({ success: true, warning: 'Terhapus dari file lokal (dev only).' })
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Gagal hapus' }, { status: 500 }) }
}
