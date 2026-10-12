'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Settings, BarChart3, UserPlus, GraduationCap, LogOut, User, ShieldCheck, Users, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SidebarProps {
  onTambah: () => void;
}

interface SessionUser {
  nama: string;
  jabatan: string;
  role: string;
}

const NAV = [
  { href: '/', label: 'Dashboard Siswa', icon: LayoutDashboard },
  { href: '/pendaftaran', label: 'Portal Pendaftaran', icon: UserPlus },
  { href: '/harga-bimbel', label: 'Harga Bimbel', icon: Wallet },
  { href: '/pembayaran', label: 'Pembayaran & Cicilan', icon: Wallet },
  { href: '/grup-belajar', label: 'Grup Belajar', icon: Users },
  { href: '/pengaturan', label: 'Pengaturan Admin', icon: Settings },
  { href: '/statistik', label: 'Data Statistik', icon: BarChart3 },
];

function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((j) => setUser(j?.user ?? null))
      .catch(() => {});
  }, []);
  return user;
}

export default function Sidebar({ onTambah }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSession();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-red-100 bg-white lg:flex">
      <div className="flex items-center gap-3 border-b border-red-100 px-5 py-4">
        <img src="/images/logo_go_standar.png" alt="Ganesha Operation" className="h-10 w-auto object-contain" />
        <div className="hidden xl:block">
          <p className="text-sm font-bold leading-tight text-red-700">Ganesha Operation</p>
          <p className="text-[11px] text-gray-500">Sumenep · TA 2027/2028</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((n) => {
          const active = pathname === n.href;
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-red-50 hover:text-red-700'
              }`}
            >
              <Icon size={18} />
              {n.label}
            </Link>
          );
        })}

        <Link
          href="/pendaftaran"
          className="mt-2 flex w-full items-center gap-3 rounded-xl border border-dashed border-red-300 bg-red-50/60 px-3 py-2.5 text-sm font-medium text-red-700 transition-colors hover:border-red-400 hover:bg-red-50"
        >
          <UserPlus size={18} />
          Tambah Siswa
        </Link>
      </nav>

      <div className="border-t border-red-100 p-4 space-y-3">
        <div className="rounded-xl bg-red-50/70 p-3 text-[11px] leading-relaxed text-red-900/80">
          <p className="mb-1 font-bold text-red-800">Batas Kapasitas Kelas</p>
          <p>SD (4, 5, 6) — maks 20 siswa</p>
          <p>SMP (7, 8, 9) — maks 25 siswa</p>
          <p>SMA (10, 11, 12) — maks 25 siswa</p>
        </div>

        {user && (
          <div className="rounded-xl border border-red-100 bg-white p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                <User size={15} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-gray-800">{user.nama}</p>
                <p className="truncate text-[10px] text-gray-500">{user.jabatan}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                user.role === 'super admin'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <ShieldCheck size={10} />
                {user.role}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-gray-500 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut size={12} />
                Keluar
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-gray-400">TA 2027/2028</p>
      </div>
    </aside>
  );
}

export function MobileNav({ onTambah }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSession();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="sticky top-0 z-20 border-b border-red-100 bg-white/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {NAV.map((n) => {
            const active = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium ${
                  active ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'
                }`}
              >
                <Icon size={15} />
                {n.label}
              </Link>
            );
          })}
          <Link
            href="/pendaftaran"
            className="flex shrink-0 items-center gap-2 rounded-full border border-dashed border-red-300 px-4 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100"
          >
            <UserPlus size={15} />
            Tambah Siswa
          </Link>
        </div>
        {user && (
          <button
            onClick={logout}
            className="ml-3 flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            <LogOut size={13} />
            Keluar
          </button>
        )}
      </div>
      <div className="h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
    </div>
  );
}
