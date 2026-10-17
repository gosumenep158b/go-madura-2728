import { GraduationCap } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-red-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
            <GraduationCap size={22} />
          </div>
          <div>
            <p className="text-base font-bold leading-tight text-red-700">
              GO Madura <span className="font-medium text-gray-500">· Dashboard Siswa</span>
            </p>
            <p className="text-xs text-gray-500">Tahun Ajaran 2026/2027 · Ganesha Operation</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            Data Live
          </span>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
    </header>
  );
}
