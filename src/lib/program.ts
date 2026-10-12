export const PROGRAMS = [
  "TWT 4 SD KMERDEKA 4P TA2728",
  "TWT 4 SD TRISEMESTER KELAS LANJUTAN KMERDEKA 4P TA 2627 2728",
  "TWT 12 SMA EKSEKUTIF SILVER KMERDEKA 4P TA 2728",
] as const;
export type ProgramName = typeof PROGRAMS[number];

export const TINGKATS_9 = ["4 SD","5 SD","6 SD","7 SMP","8 SMP","9 SMP","10 SMA","11 SMA","12 SMA"] as const;

export function getProgramOptions(tingkat: string): string[] {
  const t = (tingkat||"").toUpperCase().trim();
  const is12 = t.startsWith("12");
  const is12Umum = t === "12 SMA" || t === "12 SMA UMUM" || t.includes("12 SMA UMUM") || (t.startsWith("12") && !t.includes("SNBT") && !t.includes("ALUMNI"));
  // Spec: program 3 khusus 12 SMA UMUM. Allow only if tingkat is 12 SMA (umum)
  if (is12Umum && is12) return [...PROGRAMS];
  if (is12) return PROGRAMS.slice(0,2); // SNBT/ALUMNI tidak dapat eksekutif silver
  return PROGRAMS.slice(0,2);
}

export const DEFAULT_HARGA: Record<string, number> = {
  "12 SMA":11500000, "11 SMA":10200000, "10 SMA":10200000,
  "9 SMP":8900000, "8 SMP":8900000, "7 SMP":8900000,
  "6 SD":7500000, "5 SD":7500000, "4 SD":7500000,
};
export function normalizeTingkat(t: string): string {
  const u=(t||"").toUpperCase().trim();
  if(u.startsWith("13")) return "12 SMA";
  if(u.startsWith("12")) return "12 SMA";
  if(u.startsWith("11")) return "11 SMA";
  if(u.startsWith("10")) return "10 SMA";
  if(u.startsWith("9")) return "9 SMP";
  if(u.startsWith("8")) return "8 SMP";
  if(u.startsWith("7")) return "7 SMP";
  if(u.startsWith("6")) return "6 SD";
  if(u.startsWith("5")) return "5 SD";
  if(u.startsWith("4")) return "4 SD";
  return t;
}
export function hargaForTingkat(t: string): number {
  return DEFAULT_HARGA[normalizeTingkat(t)] ?? 7500000;
}
export const HARGA_PENDAFTARAN = 200000;
export const EXPORT_HEADERS = [
  "NO","NO REGISTRASI","CABANG","KOTA","UNIT","TGL LAHIR","PROGRAM","STATUS BAYAR","NAMA",
  "JUMLAH BAYAR 1","TGL. BAYAR 1","JUMLAH BAYAR 2","TGL. BAYAR 2","JUMLAH BAYAR 3","TGL. BAYAR 3",
  "JUMLAH BAYAR 4","TGL. BAYAR 4","JUMLAH BAYAR 5","TGL. BAYAR 5","JUMLAH BAYAR 6","TGL. BAYAR 6",
  "TOTAL BAYAR","HARGA PENDAFTARAN","HARGA NORMAL","JUMLAH DISKON","KETERANGAN","HARGA YANG HARUS DIBAYAR","SISA HARGA YANG MASIH HARUS DIBAYAR",
  "ASAL SEKOLAH","NOMOR HP SISWA","NAMA ORANGTUA","NO HP ORTU 1"
] as const;
