'use client';

import { useEffect, useState } from 'react';
import Sidebar, { MobileNav } from '@/components/dashboard/Sidebar';
import ThemeToggle, { applyTheme, currentThemeDark } from '@/components/ThemeToggle';
import { Moon, Sun, KeyRound, User } from 'lucide-react';

interface SessionUser { nama: string; jabatan: string; username: string; role: string; }

const inputCls =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

export default function AkunPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [dark, setDark] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setUser(j?.user ?? null))
      .catch(() => {});
    setDark(currentThemeDark());
  }, []);

  const setTheme = (v: boolean) => {
    setDark(v);
    applyTheme(v);
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPw.length < 6) {
      setMsg({ type: 'err', text: 'Password baru minimal 6 karakter.' });
      return;
    }
    if (newPw !== confirmPw) {
      setMsg({ type: 'err', text: 'Konfirmasi password tidak sama.' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg({ type: 'err', text: j.error || 'Gagal ganti password.' });
        return;
      }
      setMsg({ type: 'ok', text: '✓ Password berhasil diganti. Gunakan password baru saat login berikutnya.' + (j.warning ? ' ' + j.warning : '') });
      setOldPw('');
      setNewPw('');
      setConfirmPw('');
    } catch {
      setMsg({ type: 'err', text: 'Gagal terhubung ke server.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar onTambah={() => {}} />
      <div className="min-w-0 flex-1">
        <MobileNav onTambah={() => {}} />
        <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm border border-slate-800 dark:bg-slate-900">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Pengaturan</p>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">Akun Saya</h1>
            <p className="mt-1 text-xs text-slate-300">Tampilan & keamanan akun Anda.</p>
          </div>

          {/* Profil */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-slate-700">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.nama || 'Memuat…'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user ? `${user.jabatan} · ${user.username} · ${user.role}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Tampilan */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {dark ? <Moon size={16} /> : <Sun size={16} />} Tampilan
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Mode gelap membuat dashboard nyaman dilihat malam hari. Pilihan tersimpan di browser ini.
                </p>
              </div>
              <ThemeToggle />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme(false)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${!dark ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                ☀️ Terang
              </button>
              <button
                type="button"
                onClick={() => setTheme(true)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${dark ? 'border-slate-900 bg-slate-900 text-white dark:border-amber-300 dark:bg-slate-800 dark:text-amber-300' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                🌙 Gelap
              </button>
            </div>
          </div>

          {/* Ganti password */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <KeyRound size={16} /> Ganti Password
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Minimal 6 karakter. Setelah diganti, semua sesi lain perlu login ulang.</p>
            {msg && (
              <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ring-1 ring-inset ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300'}`}>
                {msg.text}
              </p>
            )}
            <form onSubmit={submitPassword} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Password Lama</label>
                <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder="••••••" autoComplete="current-password" className={inputCls} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Password Baru</label>
                  <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 6 karakter" autoComplete="new-password" className={inputCls} required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Konfirmasi Baru</label>
                  <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Ulangi password baru" autoComplete="new-password" className={inputCls} required />
                </div>
              </div>
              <button type="submit" disabled={saving} className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {saving ? 'Menyimpan…' : 'Simpan Password Baru'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
