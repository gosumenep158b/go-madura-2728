"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Sidebar, { MobileNav } from '@/components/dashboard/Sidebar';
import { PROGRAMS, PROGRAM_BY_TINGKAT, TINGKATS_9, DEFAULT_HARGA, getProgramOptions } from "@/lib/program";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qyjtbddnjvqhvukgubwb.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh";
const supabase = createClient(supabaseUrl, supabaseKey);

const SEMADURA_UNITS = ["Unit Agus Salim","Unit Jokotole","Unit Parteker","Unit Imam Bonjol","Unit Cempaka"];
const DEFAULT_PROGRAM: Record<string,string> = Object.fromEntries(
  (TINGKATS_9 as readonly string[]).map(j => [j, j === "12 SMA" ? PROGRAMS[2] : PROGRAMS[0]])
) as Record<string,string>;

type Row = { unit:string; tingkat_kelas:string; program_name:string; harga:number; medical_addon:number };

function fmt(n:number){ return "Rp " + Number(n||0).toLocaleString("id-ID"); }
function parseNum(v:string){ const n=Number(String(v).replace(/[^0-9]/g,"")); return isNaN(n)?0:n; }

export default function HargaBimbelPage(){
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type:"ok"|"err"|"info", text:string}|null>(null);
  const [tableMissing, setTableMissing] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(()=>{ fetchData(); },[]);

  async function fetchData(){
    setLoading(true); setMsg(null);
    const { data, error } = await supabase.from("admin_unit_program_prices").select("*").order("tingkat_kelas",{ascending:false});
    if(error){
      const m = (error.message||"").toLowerCase();
      const isMissing = m.includes("does not exist") || m.includes("relation") || m.includes("could not find the table") || m.includes("schema cache") || (error as any).code==="42P01" || (error as any).code==="PGRST205";
      if(isMissing){
        setTableMissing(true);
        setMsg({type:"info", text:"Tabel admin_unit_program_prices belum ada di Supabase (schema cache). Modul tetap bisa dipakai — harga ditampilkan dari default Juklak. Untuk mengaktifkan simpan permanen, jalankan SQL di database/harga_bimbel_schema.sql via Supabase Dashboard > SQL Editor, lalu klik Muat Ulang."});
        try{
          const cached = localStorage.getItem("harga_bimbel_rows");
          if(cached){ const parsed = JSON.parse(cached); if(Array.isArray(parsed) && parsed.length) { setRows(parsed); setLoading(false); return; } }
        }catch{}
        buildDefault();
      } else {
        setMsg({type:"err", text:"Gagal memuat: "+error.message});
        buildDefault();
      }
      setLoading(false);
      return;
    }
    if(!data || data.length===0){
      buildDefault();
      setMsg({type:"info", text:"Belum ada data harga di Supabase — menampilkan harga default Juklak. Edit lalu Simpan untuk mengisi database."});
    } else {
      const map = new Map<string, Row>();
      (data as any[]).forEach(r=> map.set(r.unit+"|"+r.tingkat_kelas, {unit:r.unit, tingkat_kelas:r.tingkat_kelas, program_name:r.program_name, harga:Number(r.harga), medical_addon:Number(r.medical_addon||0)}));
      const full: Row[]=[];
      for(const j of TINGKATS_9) for(const u of SEMADURA_UNITS){
        const k=u+"|"+j; const ex=map.get(k);
        if(ex) full.push(ex); else full.push({unit:u, tingkat_kelas:j, program_name:DEFAULT_PROGRAM[j]||PROGRAMS[0], harga:DEFAULT_HARGA[j]||0, medical_addon: 0});
      }
      setRows(full);
    }
    setLoading(false);
  }

  function buildDefault(){
    const full: Row[]=[];
    for(const j of TINGKATS_9) for(const u of SEMADURA_UNITS){
      full.push({unit:u, tingkat_kelas:j, program_name:DEFAULT_PROGRAM[j]||PROGRAMS[0], harga:DEFAULT_HARGA[j]||0, medical_addon: 0});
    }
    setRows(full);
  }

  function getCell(unit:string, jenjang:string){ return rows.find(r=>r.unit===unit && r.tingkat_kelas===jenjang); }
  function setHarga(unit:string, jenjang:string, val:number){
    setRows(prev=> prev.map(r=> r.unit===unit && r.tingkat_kelas===jenjang ? {...r, harga: val} : r));
  }
  function setProgram(unit:string, jenjang:string, val:string){
    setRows(prev=> prev.map(r=> r.unit===unit && r.tingkat_kelas===jenjang ? {...r, program_name: val} : r));
  }
  function setAddon(unit:string, jenjang:string, val:number){
    setRows(prev=> prev.map(r=> r.unit===unit && r.tingkat_kelas===jenjang ? {...r, medical_addon: val} : r));
  }

  async function handleSave(){
    setSaving(true); setMsg(null);
    if(rows.some(r=> r.harga < 100000)){ setMsg({type:"err", text:"Harga minimal Rp 100.000. Periksa kembali."}); setSaving(false); return; }
    const payload = rows.map(r=> ({unit:r.unit, tingkat_kelas:r.tingkat_kelas, program_name:r.program_name, harga:r.harga, medical_addon:r.medical_addon, is_active:true}));
    const { error } = await supabase.from("admin_unit_program_prices").upsert(payload, { onConflict:"unit,tingkat_kelas" });
    if(error){
      const m=(error.message||"").toLowerCase();
      const isMissing = m.includes("does not exist") || m.includes("relation") || m.includes("could not find the table") || m.includes("schema cache") || (error as any).code==="42P01" || (error as any).code==="PGRST205";
      if(isMissing){
        setTableMissing(true);
        try{ localStorage.setItem("harga_bimbel_rows", JSON.stringify(rows)); localStorage.setItem("harga_bimbel_updated_at", String(Date.now())); }catch{}
        try{ window.dispatchEvent(new CustomEvent("harga-bimbel-updated")); }catch{}
        setMsg({type:"err", text:"Tabel Supabase belum ada — harga disimpan LOKAL di browser ini dulu. Agar tersinkron ke semua device & portal pendaftaran, jalankan SQL di database/harga_bimbel_schema.sql via Supabase Dashboard > SQL Editor, lalu klik Simpan lagi. (Error: "+error.message+")"});
      } else {
        setMsg({type:"err", text:"Gagal menyimpan: "+error.message});
      }
    } else {
      try{
        localStorage.setItem("harga_bimbel_rows", JSON.stringify(rows));
        localStorage.setItem("harga_bimbel_updated_at", String(Date.now()));
      }catch{}
      // notify open pendaftaran tabs (same-tab + cross-tab)
      try{ window.dispatchEvent(new CustomEvent("harga-bimbel-updated")); }catch{}
      try{ window.dispatchEvent(new Event("storage")); }catch{}
      setMsg({type:"ok", text:`Berhasil menyimpan ${payload.length} harga (5 unit × ${TINGKATS_9.length} jenjang) ke Supabase. Portal pendaftaran akan otomatis memakai harga terbaru.`});
      setTableMissing(false);
    }
    setSaving(false);
  }

  function handleBulkHarga(jenjang:string, val:number){
    setRows(prev=> prev.map(r=> r.tingkat_kelas===jenjang ? {...r, harga: val} : r));
  }

  const filteredJenjangs = (TINGKATS_9 as readonly string[]).filter(j=> !filter || j.toLowerCase().includes(filter.toLowerCase()) || (DEFAULT_PROGRAM[j]||"").toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Sidebar onTambah={() => {}} />
      <div className="min-w-0 flex-1">
        <MobileNav onTambah={() => {}} />
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/images/logo_go_standar.png" alt="Ganesha Operation" className="h-10 w-auto object-contain bg-white rounded-xl p-1 shadow-sm border border-red-100" />
            <div>
              <h1 className="font-bold leading-tight text-base">Harga Bimbel per Unit &amp; Program</h1>
              <span className="text-xs text-gray-500">TA 2027/2028 · 5 Unit Semadura · sumber harga portal pendaftaran</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/pengaturan" className="text-xs font-bold text-gray-600 bg-white border px-3 py-2 rounded-xl hover:bg-gray-50">← Pengaturan</a>
            <a href="/pendaftaran" className="text-xs font-bold text-[#b70011] bg-red-50 px-3 py-2 rounded-xl hover:bg-red-100">Modul Penawaran →</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* Info banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
          <div className="flex flex-wrap gap-2">
            {SEMADURA_UNITS.map(u=>(
              <span key={u} className="px-3 py-1.5 rounded-full text-xs font-bold border bg-gray-50 border-gray-200 text-gray-700">{u}</span>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Cari jenjang / program..." className="px-3 py-2 border rounded-xl text-sm w-56" />
            <button onClick={fetchData} className="px-4 py-2 rounded-xl text-sm font-bold bg-white border hover:bg-gray-50">↻ Muat Ulang</button>
          </div>
        </div>

        {msg && (
          <div className={`p-4 rounded-xl border text-sm ${msg.type==="ok"?"bg-green-50 border-green-200 text-green-800": msg.type==="err"?"bg-red-50 border-red-200 text-red-700":"bg-amber-50 border-amber-200 text-amber-800"}`}>
            {msg.text}
            {tableMissing && <span className="block mt-2 font-mono text-xs">File SQL: <b>database/harga_bimbel_schema.sql</b> → Supabase Dashboard &gt; SQL Editor → Run</span>}
          </div>
        )}

        {/* Matrix table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b flex flex-wrap gap-3 items-center justify-between">
            <h2 className="font-bold text-sm">Matriks Harga — baris = Jenjang, kolom = Unit</h2>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving || loading} className="px-5 py-2.5 rounded-xl bg-[#b70011] text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50 shadow">
                {saving? "Menyimpan...":"💾 Simpan Semua ke Supabase"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">Memuat harga...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b">
                    <th className="p-3 text-left sticky left-0 bg-gray-50 z-10 border-r min-w-[160px]">Jenjang / Program</th>
                    {SEMADURA_UNITS.map(u=>(
                      <th key={u} className="p-3 text-center min-w-[170px]">{u}</th>
                    ))}
                    <th className="p-3 text-center bg-amber-50 min-w-[140px]">Aksi per Jenjang</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJenjangs.map(j=>(
                    <tr key={j} className="border-b hover:bg-gray-50/60">
                      <td className="p-3 sticky left-0 bg-white border-r">
                        <div className="font-bold text-sm text-[#b70011]">{j}</div>
                        <select value={getCell(SEMADURA_UNITS[0], j)?.program_name||DEFAULT_PROGRAM[j]||PROGRAMS[0]} onChange={e=>{
                          const v=e.target.value; SEMADURA_UNITS.forEach(u=> setProgram(u,j,v));
                        }} className="mt-1 w-full px-2 py-1.5 border rounded-lg text-xs bg-white">
                          {getProgramOptions(j).map(opt=>(
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <div className="text-[11px] text-gray-400 mt-1">Default: {fmt(DEFAULT_HARGA[j]||0)}</div>
                      </td>
                      {SEMADURA_UNITS.map(u=>{
                        const cell=getCell(u,j);
                        return (
                          <td key={u+"|"+j} className="p-2 align-top">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase">Harga</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={cell ? String(cell.harga) : ""}
                                  onChange={e=> setHarga(u,j, parseNum(e.target.value))}
                                  className="w-full pl-7 pr-2 py-2 border rounded-xl text-sm font-bold bg-white"
                                />
                              </div>
                              <div className="text-[11px] text-gray-500">{fmt(cell?.harga||0)}</div>

                            </div>
                          </td>
                        );
                      })}
                      <td className="p-2 align-top bg-amber-50/50">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-amber-800 uppercase">Set semua unit</span>
                          <div className="flex gap-1">
                            <input id={`bulk-${j}`} type="text" inputMode="numeric" placeholder={String(DEFAULT_HARGA[j]||"")} className="w-full px-2 py-1.5 border rounded-lg text-xs" onKeyDown={e=>{
                              if(e.key==="Enter"){ const v=parseNum((e.target as HTMLInputElement).value); if(v) handleBulkHarga(j,v); }
                            }} />
                          </div>
                          <button onClick={()=>{
                            const el=document.getElementById(`bulk-${j}`) as HTMLInputElement; const v=el?parseNum(el.value):0; if(v) handleBulkHarga(j,v);
                          }} className="px-2 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600">Terapkan ke 5 Unit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-4 bg-gray-50 border-t text-xs text-gray-600 leading-relaxed">
            <b>Cara pakai:</b> Edit harga per sel (kolom = unit, baris = jenjang). Untuk ganti nama program, pilih via dropdown di baris — otomatis tersalin ke 5 unit. Klik <b>Simpan Semua</b> — portal <a href="/pendaftaran" className="text-[#b70011] font-bold underline">/pendaftaran</a> akan otomatis membaca harga terbaru (fallback ke default Juklak jika belum disimpan).
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border text-center"><div className="text-xs text-gray-500">Total Kombinasi</div><div className="text-xl font-black">5 × {TINGKATS_9.length} = {5*TINGKATS_9.length}</div></div>
          <div className="bg-white p-4 rounded-2xl border text-center"><div className="text-xs text-gray-500">Rentang Harga</div><div className="text-sm font-bold">{fmt(Math.min(...rows.map(r=>r.harga)))} — {fmt(Math.max(...rows.map(r=>r.harga)))}</div></div>
          <div className="bg-white p-4 rounded-2xl border text-center"><div className="text-xs text-gray-500">Jenjang Terlengkap</div><div className="text-sm font-bold">{TINGKATS_9.length} jenjang · harga per unit bisa beda</div></div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center"><div className="text-xs text-amber-800">Sumber Portal</div><div className="text-xs font-bold text-amber-900">admin_unit_program_prices</div></div>
        </div>
      </main>
      </div>
    </div>
  );
}
