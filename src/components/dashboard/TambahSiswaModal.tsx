'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface TambahSiswaModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kelasOptions: string[];
}

const TINGKAT_OPTIONS = [
  '4 SD DASAR',
  '5 SD DASAR',
  '6 SD DASAR',
  '7 SMP UMUM',
  '8 SMP UMUM',
  '9 SMP UMUM',
  '10 SMA UMUM',
  '11 SMA UMUM',
  '12 SMA UMUM',
  '12 SMA SNBT',
  '13 ALUMNI UMUM',
];

const DEFAULT_HARGA: Record<string, number> = {
  '13 ALUMNI UMUM': 11500000, '12 SMA SNBT': 11500000, '12 SMA UMUM': 11500000,
  '11 SMA UMUM': 10200000, '10 SMA UMUM': 10200000,
  '9 SMP UMUM': 8900000, '8 SMP UMUM': 8900000, '7 SMP UMUM': 8900000,
  '6 SD DASAR': 7500000, '5 SD DASAR': 7500000, '4 SD DASAR': 7500000,
};
function mapTingkatToHargaKey(t: string): string {
  const u = (t || '').toUpperCase().trim();
  if (u.startsWith('13')) return '13 ALUMNI UMUM';
  if (u.includes('12') && u.includes('SNBT')) return '12 SMA SNBT';
  if (u.startsWith('12')) return '12 SMA UMUM';
  if (u.startsWith('11')) return '11 SMA UMUM';
  if (u.startsWith('10')) return '10 SMA UMUM';
  if (u.startsWith('9')) return '9 SMP UMUM';
  if (u.startsWith('8')) return '8 SMP UMUM';
  if (u.startsWith('7')) return '7 SMP UMUM';
  if (u.startsWith('6')) return '6 SD DASAR';
  if (u.startsWith('5')) return '5 SD DASAR';
  if (u.startsWith('4')) return '4 SD DASAR';
  return t;
}
function fmtRp(n: number) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function parseRp(v: string) { const n = Number(String(v).replace(/\D/g, '')); return isNaN(n) ? 0 : n; }

const inputCls =
  'w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-red-400';

export default function TambahSiswaModal({ open, onClose, onSuccess, kelasOptions }: TambahSiswaModalProps) {
  const [form, setForm] = useState({
    no_reg: '',
    nama_siswa: '',
    tgl_lahir: '',
    no_hp: '',
    nama_ortu: '',
    no_hp_ortu: '',
    kelas_go: '',
    tingkat_kelas: '',
    asal_sekolah: '',
    tgl_daftar: new Date().toISOString().slice(0, 10),
    tahun_ajaran: '2027/2028',
    total_tagihan: '',
    metode_bayar: '',
    pembayaran_sekarang: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const hargaNormal = form.tingkat_kelas ? (DEFAULT_HARGA[mapTingkatToHargaKey(form.tingkat_kelas)] ?? 0) : 0;
  const hargaSetelahDiskonNum = parseRp(form.total_tagihan);
  const bayarSekarangNum = parseRp((form as unknown as { pembayaran_sekarang: string }).pembayaran_sekarang || '');
  const sisaNum = Math.max(0, (hargaSetelahDiskonNum || hargaNormal) - bayarSekarangNum);

  useEffect(() => {
    if (!form.tingkat_kelas) return;
    const normal = DEFAULT_HARGA[mapTingkatToHargaKey(form.tingkat_kelas)] ?? 0;
    if (!normal) return;
    // Selalu sinkron Harga Setelah Diskon = Harga Normal saat tingkat dipilih/diubah
    // (siswa tanpa surat penawaran tetap dapat harga otomatis per jenjang; diskon bisa diedit manual setelahnya)
    setForm(f => ({ ...f, total_tagihan: String(normal) }));
  }, [form.tingkat_kelas]);

  if (!open) return null;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const fixPhone = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (!d) return '';
    return d.startsWith('8') ? '0' + d : d;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{12}$/.test(form.no_reg.trim())) {
      setError('No. Registrasi harus 12 digit angka.');
      return;
    }
    if (!form.nama_siswa.trim()) {
      setError('Nama siswa wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const tagihanFinal = hargaSetelahDiskonNum || hargaNormal || 0;
      const sisaFinal = tagihanFinal ? sisaNum : 0;
      let status: 'lunas' | 'cicilan' | 'belum_lunas' = 'belum_lunas';
      if (tagihanFinal > 0) {
        if (sisaFinal <= 0) status = 'lunas';
        else if (sisaFinal < tagihanFinal) status = 'cicilan';
        else status = 'belum_lunas';
      }
      const res = await fetch('/api/siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tahun_ajaran: form.tahun_ajaran || '2027/2028',
          total_tagihan: tagihanFinal,
          sisa_tagihan: sisaFinal,
          status_bayar: status,
          metode_bayar: (form.metode_bayar as string) || (status === 'cicilan' ? 'cicilan' : status === 'lunas' ? 'lunas' : undefined),
          no_reg: form.no_reg.trim(),
          nama_siswa: form.nama_siswa.trim(),
          no_hp: fixPhone(form.no_hp),
          no_hp_ortu: fixPhone(form.no_hp_ortu),
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || 'Gagal menambah siswa.');
        return;
      }
      onSuccess();
      onClose();
      setForm({
        no_reg: '',
        nama_siswa: '',
        tgl_lahir: '',
        no_hp: '',
        nama_ortu: '',
        no_hp_ortu: '',
        kelas_go: '',
        tingkat_kelas: '',
        asal_sekolah: '',
        tgl_daftar: new Date().toISOString().slice(0, 10),
        tahun_ajaran: '2027/2028',
        total_tagihan: '',
        metode_bayar: '',
        pembayaran_sekarang: '',
      });
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-red-100 bg-red-600 px-5 py-4 text-white">
          <div>
            <h2 className="text-sm font-bold">Tambah Siswa Baru</h2>
            <p className="text-xs text-red-100">Lengkapi data di bawah ini</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-red-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3 px-5 py-5">
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
              {error}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">No. Registrasi (12 digit) *</label>
              <input value={form.no_reg} onChange={set('no_reg')} placeholder="cth: 101109123001" className={`${inputCls} font-mono`} maxLength={12} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tanggal Daftar</label>
              <input type="date" value={form.tgl_daftar} onChange={set('tgl_daftar')} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nama Siswa *</label>
            <input value={form.nama_siswa} onChange={set('nama_siswa')} placeholder="Nama lengkap siswa" className={inputCls} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tanggal Lahir</label>
              <input type="date" value={form.tgl_lahir} onChange={set('tgl_lahir')} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">No. HP Siswa</label>
              <input value={form.no_hp} onChange={set('no_hp')} placeholder="08xxxxxxxxxx" className={`${inputCls} font-mono`} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Nama Orang Tua</label>
              <input value={form.nama_ortu} onChange={set('nama_ortu')} placeholder="Nama ortu/wali" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">No. HP Ortu</label>
              <input value={form.no_hp_ortu} onChange={set('no_hp_ortu')} placeholder="08xxxxxxxxxx" className={`${inputCls} font-mono`} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tingkat Kelas</label>
              <select value={form.tingkat_kelas} onChange={set('tingkat_kelas')} className={inputCls}>
                <option value="">— Pilih —</option>
                {TINGKAT_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Kelas GO</label>
              <input value={form.kelas_go} onChange={set('kelas_go')} placeholder="cth: 10-UMUM-R-N-231" list="kelas-go-list" className={`${inputCls} font-mono text-xs`} />
              <datalist id="kelas-go-list">
                {kelasOptions.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tahun Ajaran *</label>
              <select value={(form as unknown as { tahun_ajaran: string }).tahun_ajaran} onChange={set('tahun_ajaran' as unknown as keyof typeof form)} className={inputCls}>
                <option value="2027/2028">2027/2028 (Aktif)</option>
                <option value="2026/2027">2026/2027 (Arsip)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Metode</label>
              <select value={(form as unknown as { metode_bayar: string }).metode_bayar} onChange={set('metode_bayar' as unknown as keyof typeof form)} className={inputCls}>
                <option value="">— Pilih —</option>
                <option value="lunas">Lunas</option>
                <option value="cicilan">Cicilan</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-3">
            <p className="text-xs font-bold text-amber-800">Rincian Biaya</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Harga Normal</label>
                <div className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-mono text-gray-700">{hargaNormal ? fmtRp(hargaNormal) : '— pilih tingkat kelas'}</div>
                <p className="mt-1 text-[11px] text-gray-500">Otomatis dari tingkat kelas</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Harga Setelah Diskon (Rp)</label>
                <input value={form.total_tagihan} onChange={set('total_tagihan')} placeholder={hargaNormal ? String(hargaNormal) : 'cth: 5000000'} className={`${inputCls} font-mono`} inputMode="numeric" />
                <p className="mt-1 text-[11px] text-gray-500">Isi manual / pakai Modul Penawaran</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Pembayaran Sekarang (Rp)</label>
                <input value={(form as unknown as { pembayaran_sekarang: string }).pembayaran_sekarang} onChange={set('pembayaran_sekarang' as unknown as keyof typeof form)} placeholder="cth: 1000000" className={`${inputCls} font-mono`} inputMode="numeric" />
                <p className="mt-1 text-[11px] text-gray-500">Sisa: <b className={sisaNum > 0 ? 'text-amber-700' : 'text-emerald-600'}>{fmtRp(sisaNum)}</b> {sisaNum <= 0 && (hargaSetelahDiskonNum || hargaNormal) > 0 ? '— Lunas' : ''}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Asal Sekolah</label>
            <input value={form.asal_sekolah} onChange={set('asal_sekolah')} placeholder="cth: SMAN 1 SUMENEP" className={inputCls} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? 'Menyimpan…' : 'Simpan Siswa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
