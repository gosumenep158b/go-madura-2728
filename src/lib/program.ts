export const SEMADURA_UNITS = ["Unit Agus Salim","Unit Jokotole","Unit Parteker","Unit Imam Bonjol","Unit Cempaka"] as const;
export type UnitName = typeof SEMADURA_UNITS[number];

export const PROGRAM_BY_TINGKAT: Record<string, string[]> = {
  "4 SD": ["TWT 4 SD KMERDEKA 4P TA. 2728", "TWT 4 SD TRISEMESTER LANJUTAN KMERDEKA 4P TA 2627 2728"],
  "5 SD": ["TWT 5 SD KMERDEKA 4P TA. 2728", "TWT 5 SD TRISEMESTER LANJUTAN KMERDEKA 4P TA 2627 2728"],
  "6 SD": ["TWT 6 SD KMERDEKA 4P TA. 2728", "TWT 6 SD TRISEMESTER LANJUTAN KMERDEKA 4P TA 2627 2728"],
  "7 SMP": ["TWT 7 SMP KMERDEKA 4P TA. 2728", "TWT 7 SMP TRISEMESTER LANJUTAN KMERDEKA 4P TA 2627 2728"],
  "8 SMP": ["TWT 8 SMP KMERDEKA 4P TA. 2728", "TWT 8 SMP TRISEMESTER LANJUTAN KMERDEKA 4P TA 2627 2728"],
  "9 SMP": ["TWT 9 SMP KMERDEKA 4P TA. 2728", "TWT 9 SMP TRISEMESTER LANJUTAN KMERDEKA 4P TA 2627 2728"],
  "10 SMA": ["TWT 10 SMA KMERDEKA 4P TA. 2728", "TWT 10 SMA TRISEMESTER LANJUTAN KMERDEKA 4P TA 2627 2728"],
  "11 SMA": ["TWT 11 SMA KMERDEKA 4P TA. 2728", "TWT 11 SMA TRISEMESTER LANJUTAN KMERDEKA 4P TA 2627 2728"],
  "12 SMA": ["TWT 12 SMA KMERDEKA 4P TA. 2728", "TWT 12 SMA TRISEMESTER LANJUTAN KMERDEKA 4P TA 2627 2728", "TWT 12 SMA SILVER KMERDEKA 4P TA. 2728", "TWT 12 SMA MEDICAL KMERDEKA 6P TA.2728"],
};

// Flat list for backward compat (harga-bimbel, pendaftaran fallback)
export const PROGRAMS = Array.from(new Set(Object.values(PROGRAM_BY_TINGKAT).flat())) as unknown as readonly string[];
export type ProgramName = typeof PROGRAMS[number];

export const TINGKATS_9 = ["4 SD","5 SD","6 SD","7 SMP","8 SMP","9 SMP","10 SMA","11 SMA","12 SMA"] as const;

export function getProgramOptions(tingkat: string): string[] {
  const key = normalizeTingkat(tingkat);
  return PROGRAM_BY_TINGKAT[key] ? [...PROGRAM_BY_TINGKAT[key]] : [...(PROGRAMS as unknown as string[])].slice(0, 2);
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
  "NO REGISTRASI","CABANG","KOTA","UNIT","TGL LAHIR","PROGRAM","STATUS BAYAR","NAMA",
  "JUMLAH BAYAR 1","TGL. BAYAR 1","JUMLAH BAYAR 2","TGL. BAYAR 2","JUMLAH BAYAR 3","TGL. BAYAR 3",
  "JUMLAH BAYAR 4","TGL. BAYAR 4","JUMLAH BAYAR 5","TGL. BAYAR 5","JUMLAH BAYAR 6","TGL. BAYAR 6",
  "TOTAL BAYAR","HARGA PENDAFTARAN","HARGA NORMAL","JUMLAH DISKON","KETERANGAN","HARGA YANG HARUS DIBAYAR","SISA HARGA YANG MASIH HARUS DIBAYAR",
  "ASAL SEKOLAH","NOMOR HP SISWA","NAMA ORANGTUA AYAH","NAMA ORANGTUA IBU","NO HP ORTU AYAH","NO HP ORTU IBU"
] as const;
