'use client';

// Grafik dashboard — Recharts 3 + Motion (framer-motion) untuk entrance & micro-interaction.
// Best practices: dataKey stabil, animasi Recharts nonaktif (diganti Motion), tooltip custom ringan.

import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const RED = '#dc2626';
const RED_SOFT = '#fecaca';
const COLORS = ['#dc2626', '#f59e0b', '#10b981', '#4f46e5', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6'];

const easeSpring = { type: 'spring' as const, stiffness: 260, damping: 26 };

export interface TrendPoint { bulan: string; jumlah: number; label: string }
export interface TingkatItem { tingkat: string; jumlah: number }
export interface SekolahItem { sekolah: string; jumlah: number }

// Wrapper reveal: fade+rise saat masuk viewport (prefers-reduced-motion dihormati Motion otomatis)
export function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ChartTooltip({ active, payload, label, fmt }: { active?: boolean; payload?: any[]; label?: string; fmt?: (v: any) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <p className="font-bold text-slate-700 dark:text-slate-200">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-slate-600 dark:text-slate-400">
          {p.name}: <b className="text-slate-900 dark:text-slate-100">{fmt ? fmt(p.value) : p.value}</b>
        </p>
      ))}
    </div>
  );
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const gradId = useMemo(() => `gradTrend${Math.random().toString(36).slice(2, 7)}`, []);
  if (data.length === 0) return <p className="py-16 text-center text-xs text-gray-400">Belum ada data di TA ini.</p>;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: -10, right: 16 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={RED} stopOpacity={0.35} />
            <stop offset="100%" stopColor={RED} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: RED_SOFT }} />
        <Area
          type="monotone" dataKey="jumlah" name="Pendaftar" stroke={RED} strokeWidth={2.5}
          fill={`url(#${gradId})`} isAnimationActive={false}
          dot={{ r: 3, fill: RED }} activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Bar tumbuh dari 0 dengan Motion (pengganti animasi internal Recharts)
export function TingkatChart({ data }: { data: TingkatItem[] }) {
  if (data.length === 0) return <p className="py-16 text-center text-xs text-gray-400">Belum ada data.</p>;
  const max = Math.max(...data.map(d => d.jumlah), 1);
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-1 overflow-y-auto">
      {data.map((d, i) => (
        <div key={d.tingkat} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-right text-[11px] font-semibold text-slate-600 dark:text-slate-400">{d.tingkat}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            <motion.div
              className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-red-500 to-red-600 pr-2"
              initial={{ width: 0 }}
              whileInView={{ width: `${(d.jumlah / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ ...easeSpring, delay: i * 0.08 }}
              style={{ willChange: 'transform, width' }}
            >
              <span className="text-[10px] font-bold text-white">{d.jumlah}</span>
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SekolahChart({ data }: { data: SekolahItem[] }) {
  if (data.length === 0) return <p className="py-16 text-center text-xs text-gray-400">Belum ada data.</p>;
  const max = Math.max(...data.map(d => d.jumlah), 1);
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 px-1 overflow-y-auto">
      {data.map((d, i) => (
        <div key={d.sekolah} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-right text-[11px] text-slate-600 dark:text-slate-400" title={d.sekolah}>{d.sekolah}</span>
          <div className="h-5 flex-1 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
            <motion.div
              className="h-full rounded-md"
              style={{ background: COLORS[i % COLORS.length], willChange: 'transform' }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(d.jumlah / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ ...easeSpring, delay: i * 0.06 }}
            />
          </div>
          <span className="w-8 shrink-0 text-[11px] font-bold text-slate-700 dark:text-slate-300">{d.jumlah}</span>
        </div>
      ))}
    </div>
  );
}
