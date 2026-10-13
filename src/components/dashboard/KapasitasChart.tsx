'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export interface Kapasitas {
  kelas: string;
  terisi: number;
  max: number;
  sisa: number;
  tingkat: string;
  status: string;
  persen: number;
}

export default function KapasitasChart({ data }: { data: Kapasitas[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 60, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="kelas" tick={{ fontSize: 9 }} width={190} />
        <Tooltip
          formatter={(value, name) => [value, name === 'terisi' ? 'Terisi' : 'Kapasitas']}
          labelFormatter={(l) => `Kelas ${l}`}
        />
        <Bar dataKey="terisi" fill="#4f46e5" radius={[0, 6, 6, 0]} />
        <Bar dataKey="max" fill="#fecaca" radius={[0, 6, 6, 0]} />
        <ReferenceLine x={25} stroke="#991b1b" strokeDasharray="4 4" />
      </BarChart>
    </ResponsiveContainer>
  );
}
