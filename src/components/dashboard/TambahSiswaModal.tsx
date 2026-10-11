'use client';

import { useState } from 'react';
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
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
      const res = await fetch('/api/siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tahun_ajaran: form.tahun_ajaran || '2027/2028',
          total_tagihan: form.total_tagihan ? Number(String(form.total_tagihan).replace(/\D/g,'')) : 0,
          sisa_tagihan: form.total_tagihan ? Number(String(form.total_tagihan).replace(/\D/g,'')) : 0,
          status_bayar: form.total_tagihan ? 'belum_lunas' : 'belum_lunas',
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

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tahun Ajaran *</label>
              <select value={(form as unknown as { tahun_ajaran: string }).tahun_ajaran} onChange={set('tahun_ajaran' as unknown as keyof typeof form)} className={inputCls}>
                <option value="2027/2028">2027/2028 (Aktif)</option>
                <option value="2026/2027">2026/2027 (Arsip)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Total Tagihan (Rp)</label>
              <input value={(form as unknown as { total_tagihan: string }).total_tagihan} onChange={set('total_tagihan' as unknown as keyof typeof form)} placeholder="cth: 5000000" className={`${inputCls} font-mono`} />
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
