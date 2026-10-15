'use client';

import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Settings, BarChart3, UserPlus, GraduationCap, LogOut, User, ShieldCheck, Users, Wallet, UserCog, Menu, X, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

interface SidebarProps { onTambah: () => void; }
interface SessionUser { nama: string; jabatan: string; role: string; }

const NAV = [
  { href: '/', label: 'Dashboard Siswa', short: 'Dashboard', icon: LayoutDashboard },
  { href: '/pendaftaran', label: 'Modul Penawaran', short: 'Penawaran', icon: GraduationCap },
  { href: '/harga-bimbel', label: 'Harga Bimbel', short: 'Harga', icon: Wallet },
  { href: '/pembayaran', label: 'Pembayaran & Cicilan', short: 'Bayar', icon: CreditCard },
  { href: '/grup-belajar', label: 'Grup Belajar', short: 'Grup', icon: Users },
  { href: '/pengaturan', label: 'Pengaturan Admin', short: 'Pengaturan', icon: Settings },
  { href: '/statistik', label: 'Data Statistik', short: 'Statistik', icon: BarChart3 },
  { href: '/akun', label: 'Akun Saya', short: 'Akun', icon: UserCog },
];

function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then((j) => setUser(j?.user ?? null)).catch(() => {});
  }, []);
  return user;
}

export default function Sidebar({ onTambah }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSession();
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); router.refresh(); };

  return (
    <aside className="hidden w-[272px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-800">
        <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700">
          <Image src="/images/logo_go_standar.png" alt="Ganesha Operation" width={40} height={40} className="h-9 w-9 object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-black leading-none tracking-tight text-slate-900 dark:text-slate-100">Ganesha Operation</p>
          <p className="mt-1 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">Sumenep · TA 2027/2028</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        {NAV.map((n) => {
          const active = pathname === n.href;
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold leading-none transition-all ${
                active ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon size={18} className={active ? 'text-white dark:text-slate-900' : 'text-slate-400 dark:text-slate-500'} />
              <span className="truncate">{n.label}</span>
            </Link>
          );
        })}
        <button
          onClick={onTambah}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#b70011] px-3 py-3 text-[13px] font-bold text-white shadow-sm hover:bg-[#991b1b] transition-colors"
        >
          <UserPlus size={16} /> Tambah Siswa
        </button>
      </nav>

      <div className="border-t border-slate-200 p-3 space-y-3 dark:border-slate-800">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900 dark:bg-amber-950">
          <p className="text-[11px] font-bold tracking-wide text-amber-800 dark:text-amber-300">Batas Kapasitas</p>
          <div className="mt-1.5 space-y-0.5 text-[11px] font-medium leading-relaxed text-amber-800/80 dark:text-amber-300/80">
            <p>SD (4–6) — maks 20 siswa</p>
            <p>SMP & SMA — maks 25 siswa</p>
            <p>Medical — maks 15 siswa</p>
          </div>
        </div>
        {user && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-slate-600"><User size={14} /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{user.nama}</p>
                <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{user.jabatan}</p>
              </div>
              <ThemeToggle className="h-7 w-7" />
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${user.role === 'super admin' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-white border border-slate-200 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>
                <ShieldCheck size={11} />{user.role}
              </span>
              <button onClick={logout} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white">
                <LogOut size={12} /> Keluar
              </button>
            </div>
          </div>
        )}
        <p className="text-center text-[10px] font-medium tracking-wide text-slate-400">© 2027 Ganesha Operation</p>
      </div>
    </aside>
  );
}

/**
 * MobileNav — drawer sidebar untuk layar < lg.
 * Top bar: hamburger (buka drawer) + logo + judul halaman aktif + theme toggle + logout.
 * Semua menu pindah ke dalam drawer sidebar, tidak lagi pill horizontal.
 */
export function MobileNav({ onTambah }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSession();
  const [open, setOpen] = useState(false);
  const logout = async () => { setOpen(false); await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); router.refresh(); };

  // tutup drawer saat pindah halaman
  useEffect(() => { setOpen(false); }, [pathname]);

  // kunci scroll body saat drawer terbuka
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const activeLabel = NAV.find((n) => n.href === pathname)?.label ?? 'GO Sumenep';

  return (
    <>
      {/* Top bar mobile */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white active:bg-slate-700"
          >
            <Menu size={20} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Image src="/images/logo_go_standar.png" alt="GO" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
            <p className="min-w-0 truncate text-sm font-bold text-slate-900 dark:text-slate-100">{activeLabel}</p>
          </div>
          <ThemeToggle className="h-11 w-11 shrink-0" />
          {user && (
            <button onClick={logout} aria-label="Keluar" title="Keluar" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200">
              <LogOut size={18} /><span className="sr-only">Keluar</span>
            </button>
          )}
        </div>
      </div>

      {/* Drawer overlay — animasi slide (Motion) */}
      <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
          <motion.aside className="absolute left-0 top-0 flex h-full w-[280px] max-w-[85vw] flex-col bg-white shadow-2xl dark:bg-slate-900"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{ willChange: 'transform' }}>
            {/* Brand + close */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700">
                  <Image src="/images/logo_go_standar.png" alt="Ganesha Operation" width={40} height={40} className="h-8 w-8 object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-black leading-none text-slate-900 dark:text-slate-100">Ganesha Operation</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Sumenep · TA 2027/2028</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Tutup menu" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            {/* Menu */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {NAV.map((n) => {
                const active = pathname === n.href;
                const Icon = n.icon;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold leading-none transition-all ${
                      active ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-white dark:text-slate-900' : 'text-slate-400'} />
                    <span className="truncate">{n.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => { setOpen(false); onTambah(); }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#b70011] px-3 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#991b1b]"
              >
                <UserPlus size={16} /> Tambah Siswa
              </button>
            </nav>

            {/* User footer */}
            <div className="border-t border-slate-200 p-3 dark:border-slate-800">
              {user && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-slate-600"><User size={15} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{user.nama}</p>
                      <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{user.jabatan}</p>
                    </div>
                  </div>
                  <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${user.role === 'super admin' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-white border border-slate-200 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>
                    <ShieldCheck size={11} />{user.role}
                  </span>
                </div>
              )}
              <p className="mt-3 text-center text-[10px] font-medium text-slate-400">© 2027 Ganesha Operation</p>
            </div>
          </motion.aside>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
