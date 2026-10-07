'use client';

import { useState } from 'react';
import { X, BookOpen, Calendar, School, User, FileText } from 'lucide-react';

interface TambahProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TambahProgressModal({ isOpen, onClose, onSuccess }: TambahProgressModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    asal_sekolah: 'SMAN 1 SUMENEP',
    tingkat_kelas: '10 SMA UMUM',
    mapel: 'Matematika Wajib',
    materi: '',
    tanggal_uh: '',
    pengajar: '',
    keterangan: '',
    status: 'Terjadwal UH',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/progress-materi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        onSuccess();
        onClose();
      } else {
        setError(json.error || 'Gagal menyimpan data');
      }
    } catch {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-gray-900/10">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Tambah Progress Materi & UH</h2>
              <p className="text-xs text-gray-500">Catat perkembangan materi harian dan jadwal ulangan harian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Tanggal Pengajaran
              </label>
              <input
                type="date"
                required
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Tanggal Ulangan Harian (UH)
              </label>
              <input
                type="date"
                value={form.tanggal_uh}
                onChange={(e) => setForm({ ...form, tanggal_uh: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Asal Sekolah
              </label>
              <input
                type="text"
                required
                placeholder="cth: SMAN 1 SUMENEP"
                value={form.asal_sekolah}
                onChange={(e) => setForm({ ...form, asal_sekolah: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Tingkat Kelas
              </label>
              <input
                type="text"
                required
                placeholder="cth: 10 SMA UMUM"
                value={form.tingkat_kelas}
                onChange={(e) => setForm({ ...form, tingkat_kelas: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Mata Pelajaran
              </label>
              <input
                type="text"
                required
                placeholder="cth: Matematika Wajib"
                value={form.mapel}
                onChange={(e) => setForm({ ...form, mapel: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Status Progress
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 bg-white"
              >
                <option value="Terjadwal UH">Terjadwal UH</option>
                <option value="Mendekati UH">Mendekati UH</option>
                <option value="Selesai Materi">Selesai Materi</option>
                <option value="Remedial / Pembahasan">Remedial / Pembahasan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Topik / Materi Harian
            </label>
            <input
              type="text"
              required
              placeholder="cth: Fungsi Kuadrat dan Grafik Parabola"
              value={form.materi}
              onChange={(e) => setForm({ ...form, materi: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Nama Pengajar
              </label>
              <input
                type="text"
                required
                placeholder="cth: Ahmad Fauzi, S.Pd."
                value={form.pengajar}
                onChange={(e) => setForm({ ...form, pengajar: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Keterangan / Catatan
              </label>
              <input
                type="text"
                placeholder="cth: Siswa aktif mengerjakan latihan"
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
