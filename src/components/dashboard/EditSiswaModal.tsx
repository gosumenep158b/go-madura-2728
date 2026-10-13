'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TINGKATS_9, getProgramOptions, CABANG_DEFAULT, KOTA_LIST, unitsForKota } from '@/lib/program';

export interface EditSiswaData {
  no_reg: string;
  nama_siswa: string;
  tgl_lahir?: string;
  no_hp?: string;
  nama_ortu?: string;
  no_hp_ortu?: string;
  nama_ayah?: string;
  no_hp_ayah?: string;
  nama_ibu?: string;
  no_hp_ibu?: string;
  cabang?: string;
  kota?: string;
  keterangan?: string;
  unit?: string;
  kelas_go?: string;
  tingkat_kelas?: string;
  program?: string;
  asal_sekolah?: string;
  tgl_daftar?: string;
  tahun_ajaran?: string;
}

interface Props {
  open: boolean;
  siswa: EditSiswaData | null;
  onClose: () => void;
  onSuccess: () => void;
}

const inputCls =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

export default function EditSiswaModal({ open, siswa, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    nama_siswa: '',
    tgl_lahir: '',
    no_hp: '',
    nama_ayah: '',
    no_hp_ayah: '',
    nama_ibu: '',
    no_hp_ibu: '',
    cabang: CABANG_DEFAULT,
    kota: 'Sumenep',
    keterangan: '',
    unit: '',
    kelas_go: '',
    tingkat_kelas: '',
    program: '',
    asal_sekolah: '',
    tgl_daftar: '',
    tahun_ajaran: '2027/2028',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && siswa) {
      setForm({
        nama_siswa: siswa.nama_siswa || '',
        tgl_lahir: siswa.tgl_lahir || '',
        no_hp: siswa.no_hp || '',
        nama_ayah: siswa.nama_ayah || '',
        no_hp_ayah: siswa.no_hp_ayah || '',
        nama_ibu: siswa.nama_ibu || '',
        no_hp_ibu: siswa.no_hp_ibu || '',
        cabang: siswa.cabang || CABANG_DEFAULT,
        kota: siswa.kota || 'Sumenep',
        keterangan: siswa.keterangan || '',
        unit: siswa.unit || '',
        kelas_go: siswa.kelas_go || '',
        tingkat_kelas: siswa.tingkat_kelas || '',
        program: siswa.program || '',
        asal_sekolah: siswa.asal_sekolah || '',
        tgl_daftar: siswa.tgl_daftar || '',
        tahun_ajaran: siswa.tahun_ajaran || '2027/2028',
      });
      setError('');
    }
  }, [open, siswa ]);

  if (!open || !siswa) return null;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onKotaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const kota = e.target.value;
    const units = unitsForKota(kota);
    setForm((f) => ({
      ...f,
      kota,
      cabang: CABANG_DEFAULT,
      unit: units.length === 1 ? units[0] : units.includes(f.unit) ? f.unit : units[0],
    }));
  };

  const fixPhone = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (!d) return '';
    return d.startsWith('8') ? '0' + d : d;
  };

  const unitOptions = unitsForKota(form.kota);
  const programOptions = form.tingkat_kelas ? getProgramOptions(form.tingkat_kelas) : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.nama_siswa.trim()) {
      setError('Nama siswa wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/siswa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          no_reg: siswa.no_reg,
          nama_siswa: form.nama_siswa.trim(),
          tgl_lahir: form.tgl_lahir,
          no_hp: fixPhone(form.no_hp),
          nama_ayah: form.nama_ayah.trim(),
          no_hp_ayah: fixPhone(form.no_hp_ayah),
          nama_ibu: form.nama_ibu.trim(),
          no_hp_ibu: fixPhone(form.no_hp_ibu),
          nama_ortu: form.nama_ayah.trim(),
          no_hp_ortu: fixPhone(form.no_hp_ayah),
          cabang: form.cabang || CABANG_DEFAULT,
          kota: form.kota,
          keterangan: form.keterangan.trim(),
          unit: form.unit,
          kelas_go: form.kelas_go.trim(),
          tingkat_kelas: form.tingkat_kelas,
          program: form.program,
          asal_sekolah: form.asal_sekolah.trim(),
          tgl_daftar: form.tgl_daftar,
          tahun_ajaran: form.tahun_ajaran,
        }),
      });
      const j = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError((j as any).error || 'Gagal menyimpan perubahan.');
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
          <div>
            <h2 className="text-sm font-bold">Edit Data Siswa</h2>
            <p className="text-xs font-medium text-slate-400 font-mono">{siswa.no_reg} — khusus super admin & CS</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3 px-5 py-5">
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">Nama Siswa *</label>
            <input value={form.nama_siswa} onChange={set('nama_siswa')} className={inputCls} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">Tanggal Lahir</label>
              <input type="date" value={form.tgl_lahir} onChange={set('tgl_lahir')} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">No. HP Siswa</label>
              <input value={form.no_hp} onChange={set('no_hp')} className={`${inputCls} font-mono`} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">Nama Ayah</label>
              <input value={form.nama_ayah} onChange={set('nama_ayah')} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">No. HP Ayah</label>
              <input value={form.no_hp_ayah} onChange={set('no_hp_ayah')} className={`${inputCls} font-mono`} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">Nama Ibu</label>
              <input value={form.nama_ibu} onChange={set('nama_ibu')} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">No. HP Ibu</label>
              <input value={form.no_hp_ibu} onChange={set('no_hp_ibu')} className={`${inputCls} font-mono`} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">Cabang</label>
              <input value={form.cabang || CABANG_DEFAULT} readOnly disabled className={`${inputCls} bg-gray-100 dark:bg-slate-800`} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">Kota *</label>
              <select value={form.kota} onChange={onKotaChange} className={inputCls}>
                {KOTA_LIST.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">Unit *</label>
              <select value={form.unit} onChange={set('unit')} disabled={unitOptions.length === 1} className={inputCls}>
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">Tingkat Kelas</label>
              <select value={form.tingkat_kelas} onChange={set('tingkat_kelas')} className={inputCls}>
                <option value="">— Pilih —</option>
                {TINGKATS_9.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">Program</label>
              <select value={form.program} onChange={set('program')} className={inputCls} disabled={!form.tingkat_kelas}>
                <option value="">— Pilih —</option>
                {programOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">Kelas GO</label>
              <input value={form.kelas_go} onChange={set('kelas_go')} className={`${inputCls} font-mono text-xs`} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">Tahun Ajaran</label>
              <select value={form.tahun_ajaran} onChange={set('tahun_ajaran' as any)} className={inputCls}>
                <option value="2027/2028">2027/2028 (Aktif)</option>
                <option value="2026/2027">2026/2027 (Arsip)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">Tanggal Daftar</label>
              <input type="date" value={form.tgl_daftar} onChange={set('tgl_daftar')} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">Asal Sekolah</label>
              <input value={form.asal_sekolah} onChange={set('asal_sekolah')} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-800 dark:text-slate-200">Keterangan</label>
            <input value={form.keterangan} onChange={set('keterangan')} className={inputCls} />
          </div>

          <p className="text-[11px] text-gray-500 dark:text-slate-400">Tagihan & status bayar dikelola via menu Pembayaran & Cicilan.</p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
