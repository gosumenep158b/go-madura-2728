'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, LogIn, Award, Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || 'Login gagal.');
        return;
      }
      router.push(redirect);
      router.refresh();
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#faf8ff]">
      {/* Left Side: Stunning Enhanced GO Building Hero (iofrm split-screen style) */}
      <div className="hidden lg:flex lg:w-3/5 relative bg-red-950 overflow-hidden flex-col justify-between p-12 text-white shadow-2xl">
        {/* Background Enhanced Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/go_building_hero_enhanced.jpg"
            alt="Ganesha Operation Sumenep Building"
            fill
            priority
            sizes="(max-width: 1024px) 0vw, 60vw"
            className="object-cover object-center brightness-95 contrast-105 scale-105 hover:scale-100 transition duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-red-950/75 to-red-900/40" />
        </div>

        {/* Top Header / Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="bg-white dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-white/20 flex items-center gap-3">
            <Image src="/images/logo_go_standar.png" alt="Ganesha Operation" width={120} height={36} className="h-9 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-2 bg-amber-500 text-amber-950 px-3 py-1.5 rounded-xl font-extrabold text-xs shadow-lg uppercase tracking-wider">
            <Sparkles size={14} /> TA 2027/2028 Sumenep
          </div>
        </div>

        {/* Middle / Bottom Content */}
        <div className="relative z-10 space-y-5 max-w-xl mb-4">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-300 border border-white/25 shadow-sm">
            <Award size={15} /> Bimbel Tatap Muka Berbasis Teknologi Digital
          </div>
          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-md">
            Ganesha Operation <span className="text-amber-400">Sumenep</span>
          </h1>
          <p className="text-red-100 text-sm xl:text-base leading-relaxed font-medium drop-shadow">
            Pusat bimbingan belajar terdepan dengan metode KREATIF. Mengantarkan ribuan siswa meraih impian masuk PTN &amp; PTK favorit.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div className="bg-white dark:bg-slate-900/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <div className="text-2xl font-black text-amber-400">207+</div>
              <div className="text-xs text-red-100 font-medium">Siswa SLP Terverifikasi</div>
            </div>
            <div className="bg-white dark:bg-slate-900/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <div className="text-2xl font-black text-amber-400">20+</div>
              <div className="text-xs text-red-100 font-medium">Kelas GO Aktif</div>
            </div>
            <div className="bg-white dark:bg-slate-900/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <div className="text-2xl font-black text-amber-400">100%</div>
              <div className="text-xs text-red-100 font-medium">Fasilitas Unggulan</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-red-200 font-medium flex items-center justify-between">
          <span>© 2026/2027 Ganesha Operation Sumenep</span>
          <span className="text-amber-300 font-bold">The King of the Fastest Solution</span>
        </div>
      </div>

      {/* Right Side: Clean Modern Login Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">

          {/* Mobile Logo Header */}
          <div className="lg:hidden text-center space-y-2">
            <div className="inline-block bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-md border border-red-100 dark:border-slate-800">
              <Image src="/images/logo_go_standar.png" alt="Ganesha Operation" width={120} height={40} className="h-8 w-auto object-contain mx-auto" />
            </div>
            <h2 className="text-lg font-black text-gray-900 dark:text-slate-50">Ganesha Operation Sumenep</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">Dashboard Siswa TA 2026/2027</p>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-slate-50">Masuk ke Dashboard</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Masukkan username dan password Anda untuk melanjutkan.</p>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 p-4 text-sm font-medium text-red-700 dark:text-red-400 border border-red-200 dark:border-slate-700 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300">
                Username / NIK
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username atau NIK"
                autoComplete="username"
                className="w-full rounded-2xl border border-gray-300 bg-white dark:bg-slate-900 px-4 py-3.5 text-sm font-medium text-gray-900 dark:text-slate-50 placeholder:text-gray-400 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300">
                  Password
                </label>
                <a href="#" className="inline-flex min-h-[32px] items-center px-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline">
                  Lupa password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-gray-300 bg-white dark:bg-slate-900 px-4 py-3.5 pr-12 text-sm font-medium text-gray-900 dark:text-slate-50 placeholder:text-gray-400 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 dark:text-red-400"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? (
                <span className="animate-pulse">Memverifikasi Akses…</span>
              ) : (
                <>
                  <LogIn size={18} />
                  Masuk ke Sistem
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-gray-400 pt-4 border-t">
            Ganesha Operation Sumenep · Sistem Manajemen Siswa
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}
