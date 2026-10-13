'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

const MODERN_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e', '#84cc16'];

export interface TrendPoint { bulan: string; jumlah: number; label: string }
export interface TingkatItem { tingkat: string; jumlah: number }
export interface SekolahItem { sekolah: string; jumlah: number }

export function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) return <p className="py-16 text-center text-xs text-gray-400">Belum ada data di TA ini.</p>;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: -10, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey="jumlah" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3, fill: '#dc2626' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TingkatChart({ data }: { data: TingkatItem[] }) {
  if (data.length === 0) return <p className="py-16 text-center text-xs text-gray-400">Belum ada data.</p>;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 40, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="tingkat" tick={{ fontSize: 11 }} width={110} />
        <Tooltip />
        <Bar dataKey="jumlah" fill="#dc2626" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SekolahChart({ data }: { data: SekolahItem[] }) {
  if (data.length === 0) return <p className="py-16 text-center text-xs text-gray-400">Belum ada data.</p>;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="jumlah" nameKey="sekolah" outerRadius={100} label={{ fontSize: 10 }}>
          {data.map((_, i) => (
            <Cell key={i} fill={MODERN_COLORS[i % MODERN_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
