'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

export interface Kapasitas {
  kelas: string;
  terisi: number;
  max: number;
  sisa: number;
  tingkat: string;
  status: string;
  persen: number;
}

const AXIS_TICK = { fontSize: 11, fill: '#64748b' };

function TooltipOkupansi({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const terisi = payload.find((p) => p.dataKey === 'terisi')?.value ?? 0;
  const max = payload.find((p) => p.dataKey === 'max')?.value ?? 0;
  const persen = max > 0 ? Math.round((terisi / max) * 100) : 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
      <p className="mb-1 max-w-[180px] truncate font-semibold text-slate-800 dark:text-slate-100">{label}</p>
      <p className="text-slate-600 dark:text-slate-300">Terisi: <span className="font-bold text-indigo-600 dark:text-indigo-400">{terisi}</span></p>
      <p className="text-slate-600 dark:text-slate-300">Kapasitas: <span className="font-bold text-pink-600 dark:text-pink-400">{max}</span></p>
      <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{persen}% terisi</p>
    </div>
  );
}

export default function KapasitasChart({ data }: { data: Kapasitas[] }) {
  // Tinggi mengikuti jumlah kelas: 44px per baris + ruang axis — bar selalu punya ruang, tidak dipadatkan
  const height = Math.max(240, data.length * 44 + 40);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 0 }} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, (dataMax: number) => Math.ceil((dataMax + 3) / 5) * 5]}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="kelas"
          tick={{ fontSize: 9, fill: '#64748b' }}
          width={124}
          tickLine={false}
          axisLine={false}
          interval={0}
          tickFormatter={(v: string) => (v.length > 15 ? v.slice(0, 14) + '…' : v)}
        />
        <Tooltip content={<TooltipOkupansi />} cursor={{ fill: 'rgba(100,116,139,0.08)' }} />
        <Legend
          verticalAlign="top"
          align="right"
          height={24}
          formatter={(v) => (v === 'terisi' ? 'Terisi' : 'Kapasitas')}
          wrapperStyle={{ fontSize: 11 }}
        />
        <Bar dataKey="max" name="kapasitas" fill="#fecdd3" radius={[0, 5, 5, 0]} barSize={9} />
        <Bar dataKey="terisi" name="terisi" fill="#4f46e5" radius={[0, 5, 5, 0]} barSize={9} />
        <ReferenceLine x={25} stroke="#991b1b" strokeDasharray="4 4" strokeOpacity={0.6} />
      </BarChart>
    </ResponsiveContainer>
  );
}
