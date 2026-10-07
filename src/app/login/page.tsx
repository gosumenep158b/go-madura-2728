'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Eye, EyeOff, LogIn } from 'lucide-react';

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-700 via-red-600 to-red-800 p-4">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -right-24 h-[480px] w-[480px] rounded-full bg-white/5" />
        <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-white/5" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-700 to-red-600 px-8 py-8 text-center text-white">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-sm">
              <GraduationCap size={32} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">GO Sumenep</h1>
            <p className="mt-1 text-sm text-red-100">Dashboard Siswa TA 2026/2027</p>
            <div className="mt-3 h-1 w-16 mx-auto rounded-full bg-white/40" />
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="mb-6 text-center text-base font-semibold text-gray-700">
              Masuk ke Sistem
            </h2>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200">
                <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Username / NIK
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username atau NIK"
                  autoComplete="username"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? (
                  <span className="animate-pulse">Memverifikasi…</span>
                ) : (
                  <>
                    <LogIn size={17} />
                    Masuk
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-8 py-4 text-center text-xs text-gray-400">
            Ganesha Operation Sumenep · Sistem Manajemen Siswa
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
