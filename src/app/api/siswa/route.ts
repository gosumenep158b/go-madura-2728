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
  kelas_go: string;
  tingkat_kelas: string;
  asal_sekolah: string;
  tgl_daftar: string;
}

const dataPath = join(process.cwd(), 'src/data/siswa.json')

function readSiswa(): Siswa[] {
  try {
    const fileContent = readFileSync(dataPath, 'utf-8')
    return JSON.parse(fileContent) as Siswa[]
  } catch {
    return []
  }
}

function writeSiswa(data: Siswa[]) {
  writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8')
}

// Menghitung batas kapasitas kelas_go berdasarkan tingkat
export function getKapasitasMax(kelasGo: string, tingkat: string): number {
  const k = (kelasGo || '').toUpperCase()
  const t = (tingkat || '').toUpperCase()

  if (k.startsWith('4-SD') || k.startsWith('5-SD') || k.startsWith('6-SD') || t.includes('SD')) {
    return 20
  }
  if (k.startsWith('7-SMP') || k.startsWith('8-SMP') || k.startsWith('9-SMP') || t.includes('SMP')) {
    return 25
  }
  if (
    k.startsWith('10-') ||
    k.startsWith('11-') ||
    k.startsWith('12-') ||
    k.startsWith('13-') ||
    t.includes('SMA') ||
    t.includes('ALUMNI')
  ) {
    return 25
  }
  return 25 // default max
}

export async function GET() {
  const data = readSiswa()

  const countsByAsal = data.reduce((acc: Record<string, number>, s: Siswa) => {
    const asal = s.asal_sekolah || 'Tanpa Data'
    acc[asal] = (acc[asal] || 0) + 1
    return acc
  }, {})

  const countsByKelas = data.reduce((acc: Record<string, number>, s: Siswa) => {
    const tingkat = s.tingkat_kelas || 'N/A'
    acc[tingkat] = (acc[tingkat] || 0) + 1
    return acc
  }, {})

  // Kapasitas per kelas_go
  const mapKelasGo: Record<
    string,
    { terisi: number; max: number; tingkat: string; status: string }
  > = {}

  data.forEach((s) => {
    const k = s.kelas_go || 'Tanpa Kelas'
    const max = getKapasitasMax(k, s.tingkat_kelas)
    if (!mapKelasGo[k]) {
      mapKelasGo[k] = { terisi: 0, max, tingkat: s.tingkat_kelas || '—', status: 'Aman' }
    }
    mapKelasGo[k].terisi += 1
  })

  // Set status kapasitas
  Object.keys(mapKelasGo).forEach((k) => {
    const item = mapKelasGo[k]
    if (item.terisi >= item.max) {
      item.status = 'Penuh'
    } else if (item.terisi >= item.max * 0.8) {
      item.status = 'Hampir Penuh'
    } else {
      item.status = 'Tersedia'
    }
  })

  // Trend pendaftar per bulan (YYYY-MM)
  const mapBulan: Record<string, number> = {}
  data.forEach((s) => {
    const b = s.tgl_daftar ? s.tgl_daftar.slice(0, 7) : 'Lainnya'
    if (b && b.length === 7) {
      mapBulan[b] = (mapBulan[b] || 0) + 1
    }
  })

  const pendaftarBulan = Object.entries(mapBulan)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bulan, jumlah]) => ({ bulan, jumlah }))

  const summary = {
    totalSiswa: data.length,
    asalSekolah: Object.entries(countsByAsal).map(([n, c]) => ({ sekolah: n, jumlah: c })),
    tingkatKelas: Object.entries(countsByKelas).map(([n, c]) => ({ tingkat: n, jumlah: c })),
    kapasitasKelas: Object.entries(mapKelasGo).map(([kelas, val]) => ({
      kelas,
      terisi: val.terisi,
      max: val.max,
      sisa: Math.max(0, val.max - val.terisi),
      tingkat: val.tingkat,
      status: val.status,
      persen: Math.round((val.terisi / val.max) * 100),
    })),
    pendaftarBulan,
  }

  return NextResponse.json({ summary, data })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Siswa>
    if (!body.nama_siswa || !body.no_reg) {
      return NextResponse.json(
        { error: 'Nama siswa dan No. Registrasi wajib diisi' },
        { status: 400 }
      )
    }

    const data = readSiswa()
    if (data.some((s) => s.no_reg === body.no_reg)) {
      return NextResponse.json(
        { error: 'No. Registrasi sudah terdaftar!' },
        { status: 400 }
      )
    }

    const newSiswa: Siswa = {
      no_reg: body.no_reg,
      tgl_lahir: body.tgl_lahir || '',
      nama_siswa: body.nama_siswa,
      no_hp: body.no_hp || '',
      nama_ortu: body.nama_ortu || '',
      no_hp_ortu: body.no_hp_ortu || '',
      kelas_go: body.kelas_go || '',
      tingkat_kelas: body.tingkat_kelas || '',
      asal_sekolah: body.asal_sekolah || '',
      tgl_daftar: body.tgl_daftar || new Date().toISOString().slice(0, 10),
    }

    data.unshift(newSiswa)
    writeSiswa(data)

    return NextResponse.json({ success: true, data: newSiswa })
  } catch (e) {
    console.error('POST /api/siswa error:', e)
    return NextResponse.json({ error: 'Gagal menambah siswa' }, { status: 500 })
  }
}