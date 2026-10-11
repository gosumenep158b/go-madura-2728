import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

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

function readPembayaran(): Pembayaran[] {
  try { return JSON.parse(readFileSync(pembayaranPath, 'utf-8')) as Pembayaran[] } catch { return [] }
}
function writePembayaran(d: Pembayaran[]){ writeFileSync(pembayaranPath, JSON.stringify(d, null, 2), 'utf-8') }

function readSiswa(): any[] {
  try { return JSON.parse(readFileSync(siswaPath, 'utf-8')) as any[] } catch { return [] }
}
function writeSiswa(d: any[]){ writeFileSync(siswaPath, JSON.stringify(d, null, 2), 'utf-8') }

function waNormalize(no: string): string {
  const d = (no||'').replace(/\D/g,'')
  if(!d) return ''
  if(d.startsWith('62')) return d
  if(d.startsWith('0')) return '62'+d.slice(1)
  if(d.startsWith('8')) return '62'+d
  return d
}

// GET ?no_reg=xxx  -> histori siswa tersebut; tanpa param -> semua (limit 200)
export async function GET(req: Request){
  const url = new URL(req.url)
  const no_reg = url.searchParams.get('no_reg')
  let data = readPembayaran()
  if(no_reg) data = data.filter(p=>p.no_reg===no_reg)
  data.sort((a,b)=> b.tanggal.localeCompare(a.tanggal) || b.created_at.localeCompare(a.created_at))
  const totalBySiswa: Record<string, number> = {}
  readPembayaran().forEach(p=>{ totalBySiswa[p.no_reg]=(totalBySiswa[p.no_reg]||0)+p.jumlah })
  return NextResponse.json({ data, totalBySiswa })
}

// POST { no_reg, jumlah, tanggal, metode, keterangan }
export async function POST(req: Request){
  try{
    const body = await req.json() as Partial<Pembayaran> & { no_reg: string; jumlah: number }
    if(!body.no_reg || !body.jumlah || Number(body.jumlah)<=0) return NextResponse.json({ error: 'no_reg dan jumlah wajib (>0)' }, { status: 400 })
    const siswa = readSiswa()
    const idx = siswa.findIndex((s:any)=> s.no_reg===body.no_reg)
    if(idx===-1) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
    const s = siswa[idx]
    const tagihan = Number(s.total_tagihan||0)
    if(tagihan<=0) return NextResponse.json({ error: 'Tagihan siswa belum diatur. Atur total_tagihan dulu via PATCH /api/siswa' }, { status: 400 })
    const sudahBayar = readPembayaran().filter(p=>p.no_reg===body.no_reg).reduce((a,c)=>a+Number(c.jumlah),0)
    const sisa = tagihan - sudahBayar
    if(Number(body.jumlah) > sisa) return NextResponse.json({ error: `Melebihi sisa tagihan. Sisa: Rp ${sisa.toLocaleString('id-ID')}` }, { status: 400 })

    const list = readPembayaran()
    const cicilan_ke = list.filter(p=>p.no_reg===body.no_reg).length + 1
    const rec: Pembayaran = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      no_reg: body.no_reg,
      tanggal: body.tanggal || new Date().toISOString().slice(0,10),
      jumlah: Number(body.jumlah),
      metode: (body.metode as Pembayaran['metode']) || 'tunai',
      keterangan: body.keterangan || '',
      cicilan_ke,
      created_at: new Date().toISOString(),
    }
    list.unshift(rec)
    writePembayaran(list)

    // update siswa sisa & status
    const totalBayarBaru = sudahBayar + Number(body.jumlah)
    const sisaBaru = Math.max(0, tagihan - totalBayarBaru)
    s.sisa_tagihan = sisaBaru
    if(sisaBaru<=0) s.status_bayar='lunas'
    else if(totalBayarBaru>0) s.status_bayar='cicilan'
    else s.status_bayar='belum_lunas'
    if(!s.metode_bayar) s.metode_bayar='cicilan'
    siswa[idx]=s
    writeSiswa(siswa)

    const waOrtu = waNormalize(s.no_hp_ortu)
    return NextResponse.json({ success: true, data: rec, siswa: s, waOrtu, sisaBaru, totalBayarBaru })
  }catch(e){ console.error(e); return NextResponse.json({ error: 'Gagal simpan pembayaran' }, { status: 500 }) }
}

// DELETE ?id=xxx  (hapus histori — kembalikan sisa)
export async function DELETE(req: Request){
  try{
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if(!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })
    let list = readPembayaran()
    const target = list.find(p=>p.id===id)
    if(!target) return NextResponse.json({ error: 'Pembayaran tidak ditemukan' }, { status: 404 })
    list = list.filter(p=>p.id!==id)
    writePembayaran(list)
    // recalc siswa
    const siswa = readSiswa()
    const idx = siswa.findIndex((s:any)=> s.no_reg===target.no_reg)
    if(idx!==-1){
      const s = siswa[idx]
      const totalBayar = list.filter(p=>p.no_reg===target.no_reg).reduce((a,c)=>a+Number(c.jumlah),0)
      const tagihan = Number(s.total_tagihan||0)
      s.sisa_tagihan = Math.max(0, tagihan - totalBayar)
      if(s.sisa_tagihan<=0 && tagihan>0) s.status_bayar='lunas'
      else if(totalBayar>0) s.status_bayar='cicilan'
      else s.status_bayar='belum_lunas'
      siswa[idx]=s; writeSiswa(siswa)
    }
    return NextResponse.json({ success: true })
  }catch(e){ console.error(e); return NextResponse.json({ error: 'Gagal hapus' }, { status: 500 }) }
}
