import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { getSessionFromRequest, canEditSiswa } from '@/lib/auth'
import { autoSyncSheet } from '@/app/api/siswa/google-sheet/route'

export interface Siswa {
  no_reg: string;
  tgl_lahir: string;
  nama_siswa: string;
  no_hp: string;
  nama_ortu: string;
  no_hp_ortu: string;
  nama_ayah?: string;
  no_hp_ayah?: string;
  nama_ibu?: string;
  no_hp_ibu?: string;
  cabang?: string;
  kota?: string;
  keterangan?: string;
  unit?: string;
  kelas_go: string;
  tingkat_kelas: string;
  program?: string;
  asal_sekolah: string;
  tgl_daftar: string;
  tahun_ajaran: string;
  status_bayar: 'lunas' | 'cicilan' | 'belum_lunas';
  total_tagihan: number;
  sisa_tagihan: number;
  metode_bayar?: 'lunas' | 'cicilan';
}

const dataPath = join(process.cwd(), 'src/data/siswa.json')

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qyjtbddnjvqhvukgubwb.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh'
  return createClient(url, key)
}

function readSiswaFile(): Siswa[] {
  try {
    const raw = JSON.parse(readFileSync(dataPath, 'utf-8')) as Siswa[]
    return raw.map((s) => ({
      ...s,
      unit: (s as any).unit || '',
      program: (s as any).program || '',
      tahun_ajaran: (s as unknown as Siswa).tahun_ajaran || '2026/2027',
      status_bayar: (s as unknown as Siswa).status_bayar || 'belum_lunas',
      total_tagihan: (s as unknown as Siswa).total_tagihan ?? 0,
      sisa_tagihan: (s as unknown as Siswa).sisa_tagihan ?? ((s as unknown as Siswa).total_tagihan ?? 0),
    }))
  } catch { return [] }
}
function writeSiswaFile(data: Siswa[]) { writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8') }

async function readSiswa(): Promise<Siswa[]> {
  let fromDb: Siswa[] = [];
  let dbOk = false;
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from('siswa').select('*').order('created_at', { ascending: false }).limit(2000)
    if (!error && data) {
      fromDb = (data as any[]).map((s) => ({
        no_reg: s.no_reg, tgl_lahir: s.tgl_lahir || '', nama_siswa: s.nama_siswa, no_hp: s.no_hp || '', nama_ortu: s.nama_ortu || s.nama_ayah || '', no_hp_ortu: s.no_hp_ortu || s.no_hp_ayah || '',
        nama_ayah: s.nama_ayah || '', no_hp_ayah: s.no_hp_ayah || '', nama_ibu: s.nama_ibu || '', no_hp_ibu: s.no_hp_ibu || '',
        cabang: s.cabang || '', kota: s.kota || '', keterangan: s.keterangan || '',
        unit: s.unit || '', kelas_go: s.kelas_go || '', tingkat_kelas: s.tingkat_kelas || '', program: s.program || '', asal_sekolah: s.asal_sekolah || '', tgl_daftar: s.tgl_daftar || '', tahun_ajaran: s.tahun_ajaran || '2027/2028',
        status_bayar: (s.status_bayar as Siswa['status_bayar']) || 'belum_lunas', total_tagihan: Number(s.total_tagihan ?? 0), sisa_tagihan: Number(s.sisa_tagihan ?? 0), metode_bayar: s.metode_bayar || undefined,
      }))
      dbOk = true
    } else if (error && (error as any).code !== 'PGRST205') {
      console.warn('[api/siswa] supabase read error, fallback file:', (error as any).message)
    }
  } catch (e) { console.warn('[api/siswa] supabase unavailable, fallback file', e) }
  const file = readSiswaFile()
  if (!dbOk || fromDb.length === 0) return file
  // Gabung: Supabase menang bila no_reg sama (arsip file tetap tampil selama belum migrasi)
  const seen = new Set(fromDb.map((s) => s.no_reg))
  return [...fromDb, ...file.filter((s) => !seen.has(s.no_reg))]
}

async function writeSiswaSupabase(s: Siswa): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getSupabase()
    const payload: any = {
      no_reg: s.no_reg, tgl_lahir: s.tgl_lahir || null, nama_siswa: s.nama_siswa, no_hp: s.no_hp || null, nama_ortu: s.nama_ortu || s.nama_ayah || null, no_hp_ortu: s.no_hp_ortu || s.no_hp_ayah || null,
      nama_ayah: s.nama_ayah || null, no_hp_ayah: s.no_hp_ayah || null, nama_ibu: s.nama_ibu || null, no_hp_ibu: s.no_hp_ibu || null,
      cabang: s.cabang || null, kota: s.kota || null, keterangan: s.keterangan || null,
      unit: s.unit || null, kelas_go: s.kelas_go || null, tingkat_kelas: s.tingkat_kelas || null, program: s.program || null, asal_sekolah: s.asal_sekolah || null, tgl_daftar: s.tgl_daftar || null,
      tahun_ajaran: s.tahun_ajaran || '2027/2028', status_bayar: s.status_bayar || 'belum_lunas', total_tagihan: Number(s.total_tagihan || 0), sisa_tagihan: Number(s.sisa_tagihan || 0), metode_bayar: s.metode_bayar || null,
    }
    const { error } = await supabase.from('siswa').insert(payload)
    if (!error) return { ok: true }
    if ((error as any).code === 'PGRST205') return { ok: false, error: 'TABLE_MISSING' }
    if ((error as any).code === '23505') return { ok: false, error: 'DUPLICATE' }
    if ((error as any).code === '42703') return { ok: false, error: 'SCHEMA_OUTDATED' }
    console.error('[api/siswa] supabase insert error', error)
    return { ok: false, error: error.message }
  } catch (e: any) { return { ok: false, error: e?.message || 'supabase error' } }
}

async function updateSiswaSupabase(noReg: string, s: Siswa): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getSupabase()
    const payload: any = {
      tgl_lahir: s.tgl_lahir || null, nama_siswa: s.nama_siswa, no_hp: s.no_hp || null,
      nama_ortu: s.nama_ortu || s.nama_ayah || null, no_hp_ortu: s.no_hp_ortu || s.no_hp_ayah || null,
      nama_ayah: s.nama_ayah || null, no_hp_ayah: s.no_hp_ayah || null, nama_ibu: s.nama_ibu || null, no_hp_ibu: s.no_hp_ibu || null,
      cabang: s.cabang || null, kota: s.kota || null, keterangan: s.keterangan || null,
      unit: s.unit || null, kelas_go: s.kelas_go || null, tingkat_kelas: s.tingkat_kelas || null, program: s.program || null,
      asal_sekolah: s.asal_sekolah || null, tgl_daftar: s.tgl_daftar || null,
      tahun_ajaran: s.tahun_ajaran || '2027/2028', status_bayar: s.status_bayar || 'belum_lunas',
      total_tagihan: Number(s.total_tagihan || 0), sisa_tagihan: Number(s.sisa_tagihan || 0), metode_bayar: s.metode_bayar || null,
    }
    const { data, error } = await supabase.from('siswa').update(payload).eq('no_reg', noReg).select('no_reg')
    if (!error && data && data.length > 0) return { ok: true }
    if (error && (error as any).code === 'PGRST205') return { ok: false, error: 'TABLE_MISSING' }
    if (error && (error as any).code === '42703') return { ok: false, error: 'SCHEMA_OUTDATED' }
    if (error) {
      console.error('[api/siswa] supabase full-update error', error)
      return { ok: false, error: error.message }
    }
    return { ok: false, error: 'NOT_FOUND' }
  } catch (e: any) { return { ok: false, error: e?.message || 'supabase error' } }
}

export function getKapasitasMax(kelasGo: string, tingkat: string): number {
  const k = (kelasGo || '').toUpperCase()
  const t = (tingkat || '').toUpperCase()
  if (k.startsWith('4-SD') || k.startsWith('5-SD') || k.startsWith('6-SD') || t.includes('SD')) return 20
  if (k.startsWith('7-SMP') || k.startsWith('8-SMP') || k.startsWith('9-SMP') || t.includes('SMP')) return 25
  if (k.startsWith('10-') || k.startsWith('11-') || k.startsWith('12-') || k.startsWith('13-') || t.includes('SMA') || t.includes('ALUMNI')) return 25
  return 25
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const ta = url.searchParams.get('ta')
  let data = await readSiswa()
  const allTahun = Array.from(new Set(data.map((d) => d.tahun_ajaran))).sort()
  if (ta) data = data.filter((d) => d.tahun_ajaran === ta)
  const countsByAsal = data.reduce((a: Record<string, number>, s) => { a[s.asal_sekolah||'Tanpa Data']=(a[s.asal_sekolah||'Tanpa Data']||0)+1; return a }, {} as Record<string,number>)
  const countsByKelas = data.reduce((a: Record<string, number>, s) => { a[s.tingkat_kelas||'N/A']=(a[s.tingkat_kelas||'N/A']||0)+1; return a }, {} as Record<string,number>)
  const mapKelasGo: Record<string,{terisi:number;max:number;tingkat:string;status:string}> = {}
  data.forEach((s)=>{
    const k=s.kelas_go||'Tanpa Kelas'; const max=getKapasitasMax(k,s.tingkat_kelas)
    if(!mapKelasGo[k]) mapKelasGo[k]={terisi:0,max,tingkat:s.tingkat_kelas||'—',status:'Aman'}
    mapKelasGo[k].terisi+=1
  })
  Object.values(mapKelasGo).forEach(v=>{ if(v.terisi>=v.max) v.status='Penuh'; else if(v.terisi>=v.max*0.8) v.status='Hampir Penuh'; else v.status='Tersedia' })
  const mapBulan: Record<string,number> = {}
  data.forEach((s)=>{ const b=s.tgl_daftar?.slice(0,7); if(b&&b.length===7) mapBulan[b]=(mapBulan[b]||0)+1 })
  const pendaftarBulan = Object.entries(mapBulan).sort(([a],[b])=>a.localeCompare(b)).map(([bulan,jumlah])=>({bulan,jumlah}))
  const summary = {
    totalSiswa: data.length,
    asalSekolah: Object.entries(countsByAsal).map(([sekolah,jumlah])=>({sekolah,jumlah})),
    tingkatKelas: Object.entries(countsByKelas).map(([tingkat,jumlah])=>({tingkat,jumlah})),
    kapasitasKelas: Object.entries(mapKelasGo).map(([kelas,val])=>({kelas,terisi:val.terisi,max:val.max,sisa:Math.max(0,val.max-val.terisi),tingkat:val.tingkat,status:val.status,persen:Math.round(val.terisi/val.max*100)})),
    pendaftarBulan,
  }
  return NextResponse.json({ summary, data, allTahun })
}

// Rekam pembayaran pertama (DP / bayar saat daftar) ke tabel pembayaran bila ada.
// Dipanggil setelah siswa berhasil disimpan, agar "Pembayaran Sekarang" muncul
// di riwayat modul Pembayaran & Cicilan (cicilan_ke = 1).
async function recordFirstPayment_(s: Partial<Siswa>) {
  const jml = Number((s as any).pembayaran_sekarang || 0)
  if (!jml || jml <= 0) return
  const supabase = getSupabase()
  try {
    const rec = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      no_reg: String(s.no_reg),
      tanggal: s.tgl_daftar || new Date().toISOString().slice(0, 10),
      jumlah: jml,
      metode: ((s as any).metode_pembayaran as any) || 'tunai',
      keterangan: 'Pembayaran pertama saat pendaftaran',
      cicilan_ke: 1,
    }
    const { error } = await supabase.from('pembayaran').insert(rec)
    if (error) console.warn('[api/siswa] recordFirstPayment insert error', (error as any).message)
  } catch (e) { console.warn('[api/siswa] recordFirstPayment unavailable', e) }
}

export async function POST(req: Request) {  try {
    const body = (await req.json()) as Partial<Siswa>
    if (!body.nama_siswa || !body.no_reg) return NextResponse.json({ error: 'Nama siswa dan No. Registrasi wajib diisi' }, { status: 400 })
    const total = Number(body.total_tagihan ?? 0)
    const sisa = body.sisa_tagihan!=null ? Number(body.sisa_tagihan) : total
    const newSiswa: Siswa = {
      no_reg: body.no_reg, tgl_lahir: body.tgl_lahir||'', nama_siswa: body.nama_siswa, no_hp: body.no_hp||'',
      nama_ortu: body.nama_ortu||(body as any).nama_ayah||'', no_hp_ortu: body.no_hp_ortu||(body as any).no_hp_ayah||'',
      nama_ayah: (body as any).nama_ayah||'', no_hp_ayah: (body as any).no_hp_ayah||'', nama_ibu: (body as any).nama_ibu||'', no_hp_ibu: (body as any).no_hp_ibu||'',
      cabang: (body as any).cabang||'', kota: (body as any).kota||'', keterangan: (body as any).keterangan||'',
      unit: (body as any).unit||'', kelas_go: body.kelas_go||'', tingkat_kelas: body.tingkat_kelas||'', program: (body as any).program||'', asal_sekolah: body.asal_sekolah||'', tgl_daftar: body.tgl_daftar||new Date().toISOString().slice(0,10),
      tahun_ajaran: body.tahun_ajaran||'2027/2028', status_bayar: (body.status_bayar as Siswa['status_bayar']) || 'belum_lunas', total_tagihan: total, sisa_tagihan: sisa, metode_bayar: body.metode_bayar as Siswa['metode_bayar']||undefined,
    }
    // bawa DP saat pendaftaran untuk pencatatan histori pembayaran pertama
    ;(newSiswa as any).pembayaran_sekarang = (body as any).pembayaran_sekarang || ''
    if(newSiswa.sisa_tagihan<=0 && newSiswa.total_tagihan>0) newSiswa.status_bayar='lunas'
    const existing = await readSiswa()
    const dup = existing.find((s)=>s.no_reg===newSiswa.no_reg)
    // no_reg adalah kode unik permanen per siswa.
    // - Sudah ada di TA yang SAMA -> tolak (entri ganda).
    // - Sudah ada di TA BERBEDA (daftar ulang) -> update langsung tanpa validasi.
    if (dup && (dup.tahun_ajaran || '') === (newSiswa.tahun_ajaran || '')) {
      return NextResponse.json({
        error: `No. Registrasi sudah terdaftar di TA ${dup.tahun_ajaran} (${dup.nama_siswa}).`,
        code: 'DUPLICATE',
      }, { status: 409 })
    }
    if (dup) {
      const up = await updateSiswaSupabase(newSiswa.no_reg, newSiswa)
      if (up.ok) { await recordFirstPayment_(newSiswa); autoSyncSheet(); return NextResponse.json({ success: true, updated: true, data: newSiswa, movedFrom: dup.tahun_ajaran }) }
      if (up.error === 'NOT_FOUND') {
        // Baris hanya ada di arsip file (belum migrasi) -> insert ke Supabase agar bisa dikelola di Vercel
        const ins = await writeSiswaSupabase(newSiswa)
        if (ins.ok) { await recordFirstPayment_(newSiswa); autoSyncSheet(); return NextResponse.json({ success: true, updated: true, data: newSiswa, movedFrom: dup.tahun_ajaran }) }
        if (ins.error === 'DUPLICATE') return NextResponse.json({ error: 'No. Registrasi sudah terdaftar!' }, { status: 400 })
      }
      if (up.error === 'SCHEMA_OUTDATED' || up.error === 'TABLE_MISSING' || up.error === 'NOT_FOUND') {
        try {
          const fileData = readSiswaFile()
          const idx = fileData.findIndex((s)=>s.no_reg===newSiswa.no_reg)
          if (idx !== -1) fileData[idx] = newSiswa; else fileData.unshift(newSiswa)
          writeSiswaFile(fileData)
          return NextResponse.json({ success: true, updated: true, data: newSiswa, movedFrom: dup.tahun_ajaran, warning: up.error === 'NOT_FOUND' ? undefined : 'Tersimpan lokal (dev). Jalankan database/siswa_schema.sql agar persisten di Vercel.' })
        } catch (e: any) {
          const msg = e?.code === 'EROFS' || String(e?.message||'').includes('read-only')
            ? 'Gagal memperbarui: filesystem Vercel read-only. Jalankan database/siswa_schema.sql di Supabase, lalu coba lagi.'
            : 'Gagal memperbarui data siswa'
          return NextResponse.json({ error: msg }, { status: 500 })
        }
      }
      try {
        const fileData = readSiswaFile()
        const idx = fileData.findIndex((s)=>s.no_reg===newSiswa.no_reg)
        if (idx !== -1) fileData[idx] = newSiswa; else fileData.unshift(newSiswa)
        writeSiswaFile(fileData)
        return NextResponse.json({ success: true, updated: true, data: newSiswa, movedFrom: dup.tahun_ajaran, warning: 'Supabase error (' + up.error + ') — fallback file' })
      } catch (e2: any) {
        console.error('[api/siswa POST] file fallback failed', e2)
      }
      return NextResponse.json({ error: up.error || 'Gagal menambah siswa' }, { status: 500 })
    }
    const sb = await writeSiswaSupabase(newSiswa)
    if (sb.ok) {
      await recordFirstPayment_(newSiswa)
      autoSyncSheet()
      return NextResponse.json({ success: true, data: newSiswa })
    }
    if (sb.error === 'DUPLICATE') return NextResponse.json({ error: 'No. Registrasi sudah terdaftar!' }, { status: 400 })
    if (sb.error === 'SCHEMA_OUTDATED' || sb.error === 'TABLE_MISSING') {
      const schemaMsg = sb.error === 'SCHEMA_OUTDATED'
        ? 'Kolom Supabase belum update (nama_ayah/cabang/kota/dll) — jalankan ulang database/siswa_schema.sql di Supabase Dashboard > SQL Editor, lalu coba lagi.'
        : 'Tabel Supabase siswa belum ada — disimpan ke file lokal. Jalankan database/siswa_schema.sql di Supabase agar persisten di Vercel.';
      try {
        const fileData = readSiswaFile()
        fileData.unshift(newSiswa); writeSiswaFile(fileData)
        return NextResponse.json({ success: true, data: newSiswa, warning: schemaMsg })
      } catch (e: any) {
        const msg = e?.code === 'EROFS' || String(e?.message||'').includes('read-only')
          ? 'Gagal menyimpan: ' + schemaMsg
          : 'Gagal menambah siswa (fallback file error)'
        console.error('[api/siswa] fallback file write failed', e)
        return NextResponse.json({ error: msg }, { status: 500 })
      }
    }
    try {
      const fileData = readSiswaFile()
      if (!fileData.some(s=>s.no_reg===newSiswa.no_reg)) { fileData.unshift(newSiswa); writeSiswaFile(fileData) }
      return NextResponse.json({ success: true, data: newSiswa, warning: 'Supabase error (' + sb.error + ') — fallback file' })
    } catch (e2: any) {
      console.error('[api/siswa POST] file fallback failed', e2)
    }
    return NextResponse.json({ error: sb.error || 'Gagal menambah siswa' }, { status: 500 })
  } catch(e: any) {
    const detail = String(e?.message || e || '').slice(0, 300)
    console.error('[api/siswa POST] fatal', detail)
    return NextResponse.json({ error: 'Gagal menambah siswa.' + (detail ? ' Detail: ' + detail : '') }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    // Edit data siswa khusus super admin & CS
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Belum login.' }, { status: 401 });
    if (!canEditSiswa(session.role)) {
      return NextResponse.json({ error: 'Hanya super admin & CS yang boleh mengedit data siswa.' }, { status: 403 });
    }
    const body = (await req.json()) as Partial<Siswa> & { no_reg: string }
    if(!body.no_reg) return NextResponse.json({ error: 'no_reg wajib' }, { status: 400 })
    try {
      const supabase = getSupabase()
      const patch: any = {}
      if(body.total_tagihan!=null) patch.total_tagihan=Number(body.total_tagihan)
      if(body.sisa_tagihan!=null) patch.sisa_tagihan=Number(body.sisa_tagihan)
      if(body.status_bayar) patch.status_bayar=body.status_bayar
      if(body.metode_bayar!==undefined) patch.metode_bayar=body.metode_bayar
      if((body as any).unit!==undefined) patch.unit=(body as any).unit
      if((body as any).program!==undefined) patch.program=(body as any).program
      if(body.tahun_ajaran) patch.tahun_ajaran=body.tahun_ajaran
      // Field profil (edit data siswa)
      for (const k of ['nama_siswa','tgl_lahir','no_hp','nama_ortu','no_hp_ortu','nama_ayah','no_hp_ayah','nama_ibu','no_hp_ibu','cabang','kota','keterangan','kelas_go','tingkat_kelas','asal_sekolah','tgl_daftar'] as const) {
        if ((body as any)[k] !== undefined) patch[k] = (body as any)[k]
      }
      const { data: cur } = await supabase.from('siswa').select('total_tagihan,sisa_tagihan').eq('no_reg', body.no_reg).single()
      if (cur) {
        const total = patch.total_tagihan ?? Number(cur.total_tagihan)
        const sisa = patch.sisa_tagihan ?? Number(cur.sisa_tagihan)
        if(sisa<=0 && total>0) patch.status_bayar='lunas'
        else if(sisa>0 && sisa < total) patch.status_bayar='cicilan'
        else if(total>0 && sisa===total) patch.status_bayar='belum_lunas'
      }
      const { data, error } = await supabase.from('siswa').update(patch).eq('no_reg', body.no_reg).select().single()
      if (!error && data) {
        return NextResponse.json({ success: true, data: {
          no_reg: data.no_reg, tgl_lahir: data.tgl_lahir||'', nama_siswa: data.nama_siswa, no_hp: data.no_hp||'', nama_ortu: data.nama_ortu||'', no_hp_ortu: data.no_hp_ortu||'',
          nama_ayah: data.nama_ayah||'', no_hp_ayah: data.no_hp_ayah||'', nama_ibu: data.nama_ibu||'', no_hp_ibu: data.no_hp_ibu||'',
          cabang: data.cabang||'', kota: data.kota||'', keterangan: data.keterangan||'',
          unit: data.unit||'', kelas_go: data.kelas_go||'', tingkat_kelas: data.tingkat_kelas||'', program: data.program||'', asal_sekolah: data.asal_sekolah||'', tgl_daftar: data.tgl_daftar||'', tahun_ajaran: data.tahun_ajaran||'2027/2028',
          status_bayar: data.status_bayar, total_tagihan: Number(data.total_tagihan), sisa_tagihan: Number(data.sisa_tagihan), metode_bayar: data.metode_bayar||undefined,
        }})
      }
      if (error && (error as any).code === 'PGRST205') throw new Error('TABLE_MISSING')
      if (error && (error as any).code === '42703') {
        return NextResponse.json({ error: 'Kolom Supabase belum update — jalankan ulang database/siswa_schema.sql di SQL Editor, lalu coba lagi.' }, { status: 500 })
      }
      if (error) console.warn('[api/siswa PATCH] supabase error', (error as any).message)
    } catch (e: any) {
      if (!String(e?.message).includes('TABLE_MISSING')) console.warn('[api/siswa PATCH] fallback to file', e?.message)
    }
    const dataFile = readSiswaFile()
    const idx = dataFile.findIndex((s)=>s.no_reg===body.no_reg)
    if(idx===-1) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
    const s = dataFile[idx]
    if(body.total_tagihan!=null) s.total_tagihan=Number(body.total_tagihan)
    if(body.sisa_tagihan!=null) s.sisa_tagihan=Number(body.sisa_tagihan)
    if(body.status_bayar) s.status_bayar=body.status_bayar as Siswa['status_bayar']
    if(body.metode_bayar!==undefined) s.metode_bayar=body.metode_bayar as Siswa['metode_bayar']
    if((body as any).unit!==undefined) (s as any).unit=(body as any).unit
    if((body as any).program!==undefined) (s as any).program=(body as any).program
    if(body.tahun_ajaran) s.tahun_ajaran=body.tahun_ajaran
    for (const k of ['nama_siswa','tgl_lahir','no_hp','nama_ortu','no_hp_ortu','nama_ayah','no_hp_ayah','nama_ibu','no_hp_ibu','cabang','kota','keterangan','kelas_go','tingkat_kelas','asal_sekolah','tgl_daftar'] as const) {
      if ((body as any)[k] !== undefined) (s as any)[k]=(body as any)[k]
    }
    if(s.sisa_tagihan<=0 && s.total_tagihan>0) s.status_bayar='lunas'
    else if(s.sisa_tagihan>0 && s.sisa_tagihan < s.total_tagihan) s.status_bayar='cicilan'
    else if(s.total_tagihan>0 && s.sisa_tagihan===s.total_tagihan) s.status_bayar='belum_lunas'
    dataFile[idx]=s
    
    try { writeSiswaFile(dataFile) } catch (e: any) {
      const msg = String(e?.message||'').includes('read-only') ? 'Gagal update: filesystem Vercel read-only. Buat tabel Supabase dulu.' : 'Gagal update siswa'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: s })
  } catch(e){ console.error(e); return NextResponse.json({ error: 'Gagal update siswa' }, { status: 500 }) }
}

// DELETE ?no_reg=xxx — khusus super admin & CS. Menghapus juga histori pembayaran siswa tsb.
export async function DELETE(req: Request) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Belum login.' }, { status: 401 });
    if (!canEditSiswa(session.role)) {
      return NextResponse.json({ error: 'Hanya super admin & CS yang boleh menghapus data siswa.' }, { status: 403 });
    }
    const url = new URL(req.url)
    const noReg = url.searchParams.get('no_reg')
    if (!noReg) return NextResponse.json({ error: 'no_reg wajib' }, { status: 400 })

    let deletedPayments = 0
    let siswaFound = false
    try {
      const supabase = getSupabase()
      const pay = await supabase.from('pembayaran').select('id').eq('no_reg', noReg)
      if (!pay.error && pay.data) {
        deletedPayments = (pay.data as any[]).length
        if (deletedPayments > 0) await supabase.from('pembayaran').delete().eq('no_reg', noReg)
      }
      const del = await supabase.from('siswa').delete({ count: 'exact' }).eq('no_reg', noReg)
      if (del.error && (del.error as any).code !== 'PGRST205') throw del.error
      if (!del.error && (del.count || 0) > 0) siswaFound = true
    } catch (e: any) {
      console.warn('[api/siswa DELETE] supabase error, fallback file', e?.message)
    }
    // Fallback / sinkron file lokal
    try {
      const payRaw = JSON.parse(readFileSync(join(process.cwd(), 'src/data/pembayaran.json'), 'utf-8')) as any[]
      const rest = payRaw.filter((p) => p.no_reg !== noReg)
      if (rest.length !== payRaw.length) {
        deletedPayments = Math.max(deletedPayments, payRaw.length - rest.length)
        try { writeFileSync(join(process.cwd(), 'src/data/pembayaran.json'), JSON.stringify(rest, null, 2), 'utf-8') } catch {}
      }
      const fileData = readSiswaFile()
      const idx = fileData.findIndex((s) => s.no_reg === noReg)
      if (idx !== -1) {
        siswaFound = true
        fileData.splice(idx, 1)
        try { writeSiswaFile(fileData) } catch {}
      }
    } catch {}
    if (!siswaFound) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
    return NextResponse.json({ success: true, deletedPayments })
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Gagal hapus siswa' }, { status: 500 }) }
}