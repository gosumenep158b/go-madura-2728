"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Sidebar, { MobileNav } from '@/components/dashboard/Sidebar';
import { TINGKATS_9, DEFAULT_HARGA, getProgramOptions, KOTA_LIST, UNIT_BY_KOTA, unitsForKota, SEMADURA_UNITS } from "@/lib/program";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qyjtbddnjvqhvukgubwb.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh";
const supabase = createClient(supabaseUrl, supabaseKey);

type Row = { id?: number; kota: string; unit: string; tingkat_kelas: string; program: string; harga: number };

function fmt(n: number) { return "Rp " + Number(n || 0).toLocaleString("id-ID"); }
function parseNum(v: string) { const n = Number(String(v).replace(/[^0-9]/g, "")); return isNaN(n) ? 0 : n; }
function isMissingErr(error: any) {
  const m = String(error?.message || "").toLowerCase();
  return m.includes("does not exist") || m.includes("relation") || m.includes("could not find the table") || m.includes("schema cache") || error?.code === "42P01" || error?.code === "PGRST205";
}
function notifyUpdated(rows: Row[]) {
  try { localStorage.setItem("harga_bimbel_rows", JSON.stringify(rows)); } catch {}
  try { localStorage.setItem("harga_bimbel_updated_at", String(Date.now())); } catch {}
  try { window.dispatchEvent(new CustomEvent("harga-bimbel-updated")); } catch {}
  try { window.dispatchEvent(new Event("storage")); } catch {}
}

function buildDefaults(): Row[] {
  const out: Row[] = [];
  for (const kota of KOTA_LIST) {
    for (const unit of UNIT_BY_KOTA[kota as keyof typeof UNIT_BY_KOTA] || []) {
      for (const tingkat of TINGKATS_9) {
        for (const program of getProgramOptions(tingkat)) {
          out.push({ kota, unit, tingkat_kelas: tingkat, program, harga: DEFAULT_HARGA[tingkat] || 0 });
        }
      }
    }
  }
  return out;
}

export default function HargaBimbelPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(null);
  const [tableMissing, setTableMissing] = useState(false);
  // Filter
  const [fKota, setFKota] = useState("Semua");
  const [fUnit, setFUnit] = useState("Semua");
  const [fText, setFText] = useState("");
  // Form tambah
  const [nKota, setNKota] = useState<string>("Sumenep");
  const [nUnit, setNUnit] = useState<string>("Unit Agus Salim");
  const [nTingkat, setNTingkat] = useState<string>("12 SMA");
  const [nProgram, setNProgram] = useState<string>(getProgramOptions("12 SMA")[0] || "");
  const [nHarga, setNHarga] = useState<string>("");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true); setMsg(null);
    try {
      const { data, error } = await supabase.from("harga_bimbel").select("id,kota,unit,tingkat_kelas,program,harga").eq("is_active", true).order("kota").order("unit").order("tingkat_kelas").limit(2000);
      if (error) throw error;
      if (!data || data.length === 0) {
        setRows([]);
        setMsg({ type: "info", text: "Belum ada data harga — klik Generate Default untuk mengisi 100 kombinasi (4 kota × unit × 9 jenjang × program), atau tambah manual. Lalu Simpan." });
      } else {
        setRows((data as any[]).map((r) => ({ id: r.id, kota: r.kota, unit: r.unit, tingkat_kelas: r.tingkat_kelas, program: r.program, harga: Number(r.harga || 0) })));
        setTableMissing(false);
      }
    } catch (e: any) {
      if (isMissingErr(e)) {
        setTableMissing(true);
        setMsg({ type: "info", text: "Tabel harga_bimbel belum ada di Supabase. Jalankan database/harga_bimbel_schema.sql via Supabase Dashboard > SQL Editor, lalu klik Muat Ulang." });
        try {
          const cached = localStorage.getItem("harga_bimbel_rows");
          if (cached) { const parsed = JSON.parse(cached); if (Array.isArray(parsed) && parsed.length) setRows(parsed); }
        } catch {}
      } else {
        setMsg({ type: "err", text: "Gagal memuat: " + (e?.message || e) });
      }
    } finally {
      setLoading(false);
    }
  }

  const unitOptionsFilter = fKota === "Semua" ? [...SEMADURA_UNITS] : unitsForKota(fKota);
  const filtered = useMemo(() => {
    const q = fText.toLowerCase();
    return rows.filter((r) =>
      (fKota === "Semua" || r.kota === fKota) &&
      (fUnit === "Semua" || r.unit === fUnit) &&
      (!q || r.tingkat_kelas.toLowerCase().includes(q) || r.program.toLowerCase().includes(q) || r.unit.toLowerCase().includes(q) || r.kota.toLowerCase().includes(q))
    );
  }, [rows, fKota, fUnit, fText]);

  const nUnitOptions = unitsForKota(nKota);
  const nProgramOptions = getProgramOptions(nTingkat);

  function onNKota(kota: string) {
    const units = unitsForKota(kota);
    setNKota(kota);
    setNUnit(units[0] || "");
  }
  function onNTingkat(t: string) {
    setNTingkat(t);
    const opts = getProgramOptions(t);
    setNProgram(opts[0] || "");
    if (!nHarga) setNHarga(String(DEFAULT_HARGA[t] || ""));
  }

  function setHargaRow(idx: number, val: number) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, harga: val } : r)));
  }

  async function handleAdd() {
    const harga = parseNum(nHarga);
    if (!nKota || !nUnit || !nTingkat || !nProgram) { setMsg({ type: "err", text: "Kota, unit, jenjang, dan program wajib diisi." }); return; }
    if (harga < 100000) { setMsg({ type: "err", text: "Harga minimal Rp 100.000." }); return; }
    setSaving(true); setMsg(null);
    try {
      const { data, error } = await supabase.from("harga_bimbel").upsert(
        { kota: nKota, unit: nUnit, tingkat_kelas: nTingkat, program: nProgram, harga, is_active: true },
        { onConflict: "kota,unit,tingkat_kelas,program" }
      ).select("id,kota,unit,tingkat_kelas,program,harga");
      if (error) throw error;
      const saved = (data as any[])?.[0];
      const key = (r: Row) => `${r.kota}|${r.unit}|${r.tingkat_kelas}|${r.program}`;
      const nk = `${nKota}|${nUnit}|${nTingkat}|${nProgram}`;
      const next = rows.filter((r) => key(r) !== nk);
      next.push(saved ? { id: saved.id, kota: saved.kota, unit: saved.unit, tingkat_kelas: saved.tingkat_kelas, program: saved.program, harga: Number(saved.harga) } : { kota: nKota, unit: nUnit, tingkat_kelas: nTingkat, program: nProgram, harga });
      setRows(next);
      setMsg({ type: "ok", text: `✓ Harga ${nKota} · ${nUnit} · ${nTingkat} · ${nProgram} = ${fmt(harga)} tersimpan.` });
      notifyUpdated(next);
      setNHarga("");
    } catch (e: any) {
      if (isMissingErr(e)) {
        setTableMissing(true);
        setMsg({ type: "err", text: "Tabel Supabase belum ada — jalankan database/harga_bimbel_schema.sql dulu. (Error: " + e.message + ")" });
      } else {
        setMsg({ type: "err", text: "Gagal menyimpan: " + (e?.message || e) });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!window.confirm("Generate 100 harga default (4 kota × unit × 9 jenjang × program)? Data yang sudah ada tidak tertimpa harganya (hanya mengisi yang kosong).")) return;
    setSaving(true); setMsg(null);
    try {
      const defs = buildDefaults();
      const existing = new Set(rows.map((r) => `${r.kota}|${r.unit}|${r.tingkat_kelas}|${r.program}`));
      const missing = defs.filter((r) => !existing.has(`${r.kota}|${r.unit}|${r.tingkat_kelas}|${r.program}`));
      if (missing.length === 0) {
        setMsg({ type: "info", text: "Semua kombinasi sudah ada — tidak ada yang perlu digenerate." });
      } else {
        const payload = missing.map((r) => ({ ...r, is_active: true }));
        const { error } = await supabase.from("harga_bimbel").upsert(payload, { onConflict: "kota,unit,tingkat_kelas,program" });
        if (error) throw error;
        await fetchData();
        setMsg({ type: "ok", text: `✓ ${missing.length} harga default ditambahkan. Sesuaikan angkanya lalu Simpan.` });
      }
    } catch (e: any) {
      if (isMissingErr(e)) {
        setTableMissing(true);
        setMsg({ type: "err", text: "Tabel Supabase belum ada — jalankan database/harga_bimbel_schema.sql dulu." });
      } else {
        setMsg({ type: "err", text: "Gagal generate: " + (e?.message || e) });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAll() {
    if (rows.some((r) => r.harga < 100000)) { setMsg({ type: "err", text: "Harga minimal Rp 100.000. Periksa kembali." }); return; }
    setSaving(true); setMsg(null);
    try {
      const payload = rows.map((r) => ({ kota: r.kota, unit: r.unit, tingkat_kelas: r.tingkat_kelas, program: r.program, harga: r.harga, is_active: true }));
      const { error } = await supabase.from("harga_bimbel").upsert(payload, { onConflict: "kota,unit,tingkat_kelas,program" });
      if (error) throw error;
      notifyUpdated(rows);
      setMsg({ type: "ok", text: `✓ Berhasil menyimpan ${payload.length} harga ke Supabase. Tambah Siswa & Modul Penawaran otomatis memakai harga terbaru.` });
      setTableMissing(false);
    } catch (e: any) {
      if (isMissingErr(e)) {
        setTableMissing(true);
        notifyUpdated(rows);
        setMsg({ type: "err", text: "Tabel Supabase belum ada — harga disimpan LOKAL di browser ini dulu. Jalankan database/harga_bimbel_schema.sql lalu Simpan lagi." });
      } else {
        setMsg({ type: "err", text: "Gagal menyimpan: " + (e?.message || e) });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(idx: number) {
    const r = filtered[idx];
    if (!r) return;
    if (!window.confirm(`Hapus harga ${r.kota} · ${r.unit} · ${r.tingkat_kelas} · ${r.program}?`)) return;
    setRows((prev) => prev.filter((x) => !(x.kota === r.kota && x.unit === r.unit && x.tingkat_kelas === r.tingkat_kelas && x.program === r.program)));
    try {
      if (r.id) await supabase.from("harga_bimbel").delete().eq("id", r.id);
      setMsg({ type: "ok", text: "✓ Baris dihapus." });
    } catch (e: any) {
      setMsg({ type: "err", text: "Terhapus lokal; gagal hapus di Supabase: " + (e?.message || e) });
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 pb-20 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar onTambah={() => {}} />
      <div className="min-w-0 flex-1">
        <MobileNav onTambah={() => {}} />
        {/* Desktop: header halaman. Mobile: disembunyikan (judul sudah ada di top bar MobileNav) */}
        <header className="hidden lg:block border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Image src="/images/logo_go_standar.png" alt="Ganesha Operation" width={40} height={40} className="h-8 w-8 shrink-0 object-contain bg-white rounded-xl p-1 shadow-sm border border-red-100" />
              <div className="min-w-0">
                <h1 className="font-bold leading-tight text-base truncate">Harga Bimbel per Kota, Unit & Program</h1>
                <span className="block text-xs text-gray-500 dark:text-slate-400 truncate">TA 2027/2028 · sumber harga Tambah Siswa & portal pendaftaran</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a href="/pendaftaran" className="text-xs font-bold text-[#b70011] bg-red-50 px-3 py-2 rounded-xl whitespace-nowrap hover:bg-red-100 dark:bg-red-950 dark:text-red-300">Modul Penawaran →</a>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
          {/* Filter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[auto_auto_1fr_auto] gap-3 items-end shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Kota</label>
              <select value={fKota} onChange={(e) => { setFKota(e.target.value); setFUnit("Semua"); }} className="w-full sm:w-auto px-3 py-2.5 border rounded-xl text-sm bg-white dark:bg-slate-800 dark:border-slate-700">
                <option value="Semua">Semua Kota</option>
                {KOTA_LIST.map((k) => (<option key={k} value={k}>{k}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Unit</label>
              <select value={fUnit} onChange={(e) => setFUnit(e.target.value)} className="w-full sm:w-auto px-3 py-2.5 border rounded-xl text-sm bg-white dark:bg-slate-800 dark:border-slate-700">
                <option value="Semua">Semua Unit</option>
                {unitOptionsFilter.map((u) => (<option key={u} value={u}>{u}</option>))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Cari jenjang / program</label>
              <input value={fText} onChange={(e) => setFText(e.target.value)} placeholder="cth: 12 SMA / Medical..." className="w-full px-3 py-2.5 border rounded-xl text-sm dark:bg-slate-800 dark:border-slate-700" />
            </div>
            <button onClick={fetchData} className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold bg-white border hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700">↻ Muat Ulang</button>
          </div>

          {msg && (
            <div className={`p-4 rounded-xl border text-sm ${msg.type === "ok" ? "bg-green-50 border-green-200 text-green-800 dark:bg-emerald-950 dark:text-emerald-300" : msg.type === "err" ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}>
              {msg.text}
              {tableMissing && <span className="block mt-2 font-mono text-xs">File SQL: <b>database/harga_bimbel_schema.sql</b> → Supabase Dashboard &gt; SQL Editor → Run</span>}
            </div>
          )}

          {/* Form tambah */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 dark:bg-slate-900 dark:border-slate-800">
            <h2 className="font-bold text-sm">Tambah / Update Harga</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Kota *</label>
                <select value={nKota} onChange={(e) => onNKota(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm bg-white dark:bg-slate-800 dark:border-slate-700">
                  {KOTA_LIST.map((k) => (<option key={k} value={k}>{k}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Unit *</label>
                <select value={nUnit} onChange={(e) => setNUnit(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm bg-white dark:bg-slate-800 dark:border-slate-700">
                  {nUnitOptions.map((u) => (<option key={u} value={u}>{u}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Tingkat *</label>
                <select value={nTingkat} onChange={(e) => onNTingkat(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm bg-white dark:bg-slate-800 dark:border-slate-700">
                  {TINGKATS_9.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Program *</label>
                <select value={nProgram} onChange={(e) => setNProgram(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm bg-white dark:bg-slate-800 dark:border-slate-700">
                  {nProgramOptions.map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Harga (Rp) *</label>
                <input value={nHarga} onChange={(e) => setNHarga(e.target.value)} inputMode="numeric" placeholder="cth: 11500000" className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono dark:bg-slate-800 dark:border-slate-700" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <button onClick={handleAdd} disabled={saving} className="px-5 py-3 rounded-xl bg-[#b70011] text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50 sm:w-auto">+ Simpan Harga</button>
              <button onClick={handleGenerate} disabled={saving} className="px-5 py-3 rounded-xl border font-bold text-sm hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800">⚙️ Generate Default (100)</button>
              <button onClick={handleSaveAll} disabled={saving || loading || rows.length === 0} className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50">💾 Simpan Semua Perubahan</button>
            </div>
          </div>

          {/* Tabel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <div className="p-4 border-b dark:border-slate-800">
              <h2 className="font-bold text-sm">Daftar Harga {fKota !== "Semua" ? `· ${fKota}` : ""} {fUnit !== "Semua" ? `· ${fUnit}` : ""} <span className="font-normal text-gray-500">({filtered.length} baris)</span></h2>
            </div>
            {loading ? (
              <div className="p-10 text-center text-sm text-gray-500">Memuat harga...</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">Tidak ada data untuk filter ini.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[860px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b dark:bg-slate-800 dark:text-slate-300">
                      <th className="p-3 text-left">Kota</th>
                      <th className="p-3 text-left">Unit</th>
                      <th className="p-3 text-left">Tingkat</th>
                      <th className="p-3 text-left">Program</th>
                      <th className="p-3 text-left">Harga (Rp)</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const idx = rows.indexOf(r);
                      return (
                        <tr key={`${r.kota}|${r.unit}|${r.tingkat_kelas}|${r.program}`} className="border-b hover:bg-gray-50/60 dark:hover:bg-slate-800/60">
                          <td className="p-3 font-semibold">{r.kota}</td>
                          <td className="p-3">{r.unit}</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold dark:bg-red-950 dark:text-red-300">{r.tingkat_kelas}</span></td>
                          <td className="p-3 text-gray-600 dark:text-slate-300">{r.program}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={String(r.harga)}
                              onChange={(e) => setHargaRow(idx, parseNum(e.target.value))}
                              className="w-36 px-2 py-1.5 border rounded-lg text-sm font-bold font-mono dark:bg-slate-800 dark:border-slate-700"
                            />
                            <div className="text-[11px] text-gray-500 mt-0.5">{fmt(r.harga)}</div>
                          </td>
                          <td className="p-3 text-center">
                            <button onClick={() => handleDelete(filtered.indexOf(r))} className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold dark:bg-red-950 dark:text-red-300">Hapus</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-4 bg-gray-50 border-t text-xs text-gray-600 leading-relaxed dark:bg-slate-800/50 dark:text-slate-400">
              <b>Cara pakai:</b> filter per Kota & Unit, edit harga langsung di kolom, lalu <b>Simpan Semua Perubahan</b>. Harga yang tersimpan otomatis muncul di Tambah Siswa (saat pilih Tingkat + Program) dan Modul Penawaran.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
