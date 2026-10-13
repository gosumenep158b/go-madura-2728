import { EXPORT_HEADERS, hargaForTingkat, HARGA_PENDAFTARAN } from './program';

// Tabel export 33 kolom — dipakai API export .xlsx DAN simpan ke Google Sheet
export function buildExportTable(siswa: any[], pembayaran: any[]): { headers: string[]; rows: any[][] } {
  const payByReg: Record<string, any[]> = {};
  pembayaran.forEach((p: any) => {
    if (!payByReg[p.no_reg]) payByReg[p.no_reg] = [];
    payByReg[p.no_reg].push(p);
  });
  Object.values(payByReg).forEach((arr) => arr.sort((a: any, b: any) => String(a.tanggal).localeCompare(String(b.tanggal))));

  const headers = [...EXPORT_HEADERS] as string[];

  const rows: any[][] = siswa.map((s: any) => {
    const total = Number(s.total_tagihan ?? 0);
    const sisa = Number(s.sisa_tagihan ?? total);
    const hargaNormal = s.tingkat_kelas ? hargaForTingkat(s.tingkat_kelas) : 0;
    const hargaHarusBayar = total;
    const diskon = Math.max(0, hargaNormal - hargaHarusBayar);
    const pays = (payByReg[s.no_reg] || []).slice(0, 6);
    const totalBayar = pays.reduce((a: any, c: any) => a + Number(c.jumlah || 0), 0) || Math.max(0, total - sisa);
    const bayarSlots: any[] = [];
    for (let k = 0; k < 6; k++) {
      const p = pays[k];
      bayarSlots.push(p ? Number(p.jumlah) : '');
      bayarSlots.push(p ? String(p.tanggal || '') : '');
    }
    const namaAyah = s.nama_ayah || s.nama_ortu || '';
    const namaIbu = s.nama_ibu || '';
    const hpAyah = s.no_hp_ayah || s.no_hp_ortu || '';
    const hpIbu = s.no_hp_ibu || '';
    return [
      s.no_reg || '',
      s.cabang || '',
      s.kota || '',
      s.unit || '',
      s.tgl_lahir || '',
      s.program || '',
      s.status_bayar || '',
      s.nama_siswa || '',
      ...bayarSlots,
      totalBayar,
      HARGA_PENDAFTARAN,
      hargaNormal,
      diskon,
      s.keterangan || '',
      hargaHarusBayar,
      sisa,
      s.asal_sekolah || '',
      s.no_hp || '',
      namaAyah,
      namaIbu,
      hpAyah,
      hpIbu,
    ];
  });

  return { headers, rows };
}
