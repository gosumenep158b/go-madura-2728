import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface Siswa {
  no_reg: string;
  tgl_lahir: string;
  nama_siswa: string;
  no_hp: string;
  nama_ortu: string;
  no_hp_ortu: string;
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

function readSiswa(): Siswa[] {
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
function writeSiswa(data: Siswa[]) { writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8') }

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
  let data = readSiswa()
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Siswa>
    if (!body.nama_siswa || !body.no_reg) return NextResponse.json({ error: 'Nama siswa dan No. Registrasi wajib diisi' }, { status: 400 })
    const data = readSiswa()
    if (data.some((s)=>s.no_reg===body.no_reg)) return NextResponse.json({ error: 'No. Registrasi sudah terdaftar!' }, { status: 400 })
    const total = Number(body.total_tagihan ?? 0)
    const sisa = body.sisa_tagihan!=null ? Number(body.sisa_tagihan) : total
    const newSiswa: Siswa = {
      no_reg: body.no_reg, tgl_lahir: body.tgl_lahir||'', nama_siswa: body.nama_siswa, no_hp: body.no_hp||'', nama_ortu: body.nama_ortu||'', no_hp_ortu: body.no_hp_ortu||'',
      unit: (body as any).unit||'', kelas_go: body.kelas_go||'', tingkat_kelas: body.tingkat_kelas||'', program: (body as any).program||'', asal_sekolah: body.asal_sekolah||'', tgl_daftar: body.tgl_daftar||new Date().toISOString().slice(0,10),
      tahun_ajaran: body.tahun_ajaran||'2027/2028', status_bayar: (body.status_bayar as Siswa['status_bayar']) || 'belum_lunas', total_tagihan: total, sisa_tagihan: sisa, metode_bayar: body.metode_bayar as Siswa['metode_bayar']||undefined,
    }
    if(newSiswa.sisa_tagihan<=0 && newSiswa.total_tagihan>0) newSiswa.status_bayar='lunas'
    data.unshift(newSiswa); writeSiswa(data)
    return NextResponse.json({ success: true, data: newSiswa })
  } catch(e){ console.error(e); return NextResponse.json({ error: 'Gagal menambah siswa' }, { status: 500 }) }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as Partial<Siswa> & { no_reg: string }
    if(!body.no_reg) return NextResponse.json({ error: 'no_reg wajib' }, { status: 400 })
    const data = readSiswa()
    const idx = data.findIndex((s)=>s.no_reg===body.no_reg)
    if(idx===-1) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
    const s = data[idx]
    if(body.total_tagihan!=null) s.total_tagihan=Number(body.total_tagihan)
    if(body.sisa_tagihan!=null) s.sisa_tagihan=Number(body.sisa_tagihan)
    if(body.status_bayar) s.status_bayar=body.status_bayar as Siswa['status_bayar']
    if(body.metode_bayar!==undefined) s.metode_bayar=body.metode_bayar as Siswa['metode_bayar']
    if((body as any).unit!==undefined) (s as any).unit=(body as any).unit
    if((body as any).program!==undefined) (s as any).program=(body as any).program
    if(body.tahun_ajaran) s.tahun_ajaran=body.tahun_ajaran
    if(s.sisa_tagihan<=0 && s.total_tagihan>0) s.status_bayar='lunas'
    else if(s.sisa_tagihan>0 && s.sisa_tagihan < s.total_tagihan) s.status_bayar='cicilan'
    else if(s.total_tagihan>0 && s.sisa_tagihan===s.total_tagihan) s.status_bayar='belum_lunas'
    data[idx]=s; writeSiswa(data)
    return NextResponse.json({ success: true, data: s })
  } catch(e){ console.error(e); return NextResponse.json({ error: 'Gagal update siswa' }, { status: 500 }) }
}