import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ProgressMateri {
  id: string;
  tanggal: string;
  asal_sekolah: string;
  tingkat_kelas: string;
  mapel: string;
  materi: string;
  tanggal_uh: string;
  pengajar: string;
  keterangan: string;
  status: string;
}

const dataPath = join(process.cwd(), 'src/data/catatan_materi.json');

function readData(): ProgressMateri[] {
  try {
    const content = readFileSync(dataPath, 'utf-8');
    return JSON.parse(content) as ProgressMateri[];
  } catch {
    return [];
  }
}

function writeData(data: ProgressMateri[]) {
  writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const data = readData();

  // Summary groupings
  const bySekolah = data.reduce((acc: Record<string, number>, item) => {
    const k = item.asal_sekolah || 'Lainnya';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const byMapel = data.reduce((acc: Record<string, number>, item) => {
    const k = item.mapel || 'Lainnya';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const byTingkat = data.reduce((acc: Record<string, number>, item) => {
    const k = item.tingkat_kelas || 'Lainnya';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    success: true,
    data,
    summary: {
      total: data.length,
      bySekolah: Object.entries(bySekolah).map(([sekolah, jumlah]) => ({ sekolah, jumlah })),
      byMapel: Object.entries(byMapel).map(([mapel, jumlah]) => ({ mapel, jumlah })),
      byTingkat: Object.entries(byTingkat).map(([tingkat, jumlah]) => ({ tingkat, jumlah })),
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = readData();

    const newItem: ProgressMateri = {
      id: `PM-${String(data.length + 1).padStart(3, '0')}`,
      tanggal: body.tanggal || new Date().toISOString().split('T')[0],
      asal_sekolah: body.asal_sekolah || '',
      tingkat_kelas: body.tingkat_kelas || '',
      mapel: body.mapel || '',
      materi: body.materi || '',
      tanggal_uh: body.tanggal_uh || '',
      pengajar: body.pengajar || '',
      keterangan: body.keterangan || '',
      status: body.status || 'Terjadwal UH',
    };

    data.unshift(newItem);
    writeData(data);

    return NextResponse.json({ success: true, item: newItem });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
