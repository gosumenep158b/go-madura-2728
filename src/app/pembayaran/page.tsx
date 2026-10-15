"use client";
import { useCallback, useEffect, useState } from "react";
import Sidebar, { MobileNav } from "@/components/dashboard/Sidebar";
import TambahSiswaModal from "@/components/dashboard/TambahSiswaModal";
import EditSiswaModal, { EditSiswaData } from "@/components/dashboard/EditSiswaModal";

interface Siswa {
  no_reg: string; nama_siswa: string; no_hp: string; tgl_lahir: string;
  no_hp_ortu: string; nama_ortu: string;
  nama_ayah?: string; no_hp_ayah?: string; nama_ibu?: string; no_hp_ibu?: string;
  cabang?: string; kota?: string; keterangan?: string; unit?: string; kelas_go: string;
  program?: string; tgl_daftar: string;
  tingkat_kelas: string; asal_sekolah: string; tahun_ajaran: string;
  status_bayar: string; total_tagihan: number; sisa_tagihan: number;
}
interface Pembayaran { id:string; no_reg:string; tanggal:string; jumlah:number; metode:string; keterangan?:string; cicilan_ke?:number }

function waNormalize(no: string){
  const d=(no||'').replace(/\D/g,''); if(!d) return ''; if(d.startsWith('62')) return d; if(d.startsWith('0')) return '62'+d.slice(1); if(d.startsWith('8')) return '62'+d; return d;
}
function fmtRp(n:number){ return 'Rp ' + Number(n||0).toLocaleString('id-ID') }
function waReminderLink(s: Siswa, tb: number, sisa: number, nextJml?: number){
  const hp = s.no_hp_ayah || s.no_hp_ortu || s.no_hp_ibu || '';
  const ortu = s.nama_ayah || s.nama_ortu || s.nama_ibu || '—';
  const no = waNormalize(hp);
  if(!no) return null;
  const msg = encodeURIComponent(
    `Yth. Orang Tua/Wali *${ortu}* — siswa *${s.nama_siswa}* (${s.no_reg}, ${s.tingkat_kelas}, TA ${s.tahun_ajaran})\n\n`+
    `Pengingat pembayaran bimbel GO:\n`+
    `Total tagihan: ${fmtRp(tb)}\n`+
    `Sudah bayar: ${fmtRp(tb - sisa)}\n`+
    `*Sisa tagihan: ${fmtRp(sisa)}*${nextJml ? `\nJatuh tempo cicilan berikutnya: ${fmtRp(nextJml)}` : ''}\n\n`+
    `Mohon segera melakukan pembayaran. Info: Ganesha Operation Sumenep.`
  );
  return `https://wa.me/${no}?text=${msg}`;
}

export default function PembayaranPage(){
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [ta, setTa] = useState("2027/2028");
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Siswa|null>(null);
  const [hist, setHist] = useState<Pembayaran[]>([]);
  const [jml, setJml] = useState("");
  const [tgl, setTgl] = useState(new Date().toISOString().slice(0,10));
  const [metode, setMetode] = useState("tunai");
  const [ket, setKet] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [editTarget, setEditTarget] = useState<EditSiswaData | null>(null);
  const [myRole, setMyRole] = useState("");
  const [lastBayar, setLastBayar] = useState<Record<string,string>>({});
  const canEdit = myRole.toLowerCase() === "super admin" || myRole.toLowerCase() === "cs";

  const load = useCallback(()=>{
    setLoading(true);
    const qs = ta==="Semua" ? "" : `?ta=${encodeURIComponent(ta)}`;
    fetch(`/api/siswa${qs}`).then(r=>r.json()).then(j=> setSiswa(j.data??[])).finally(()=> setLoading(false));
    // tanggal terakhir bayar per siswa (dari histori pembayaran)
    fetch("/api/pembayaran").then(r=>r.json()).then((j)=>{
      const map: Record<string,string> = {};
      (j.data??[]).forEach((p:any)=>{
        const cur = map[p.no_reg];
        if(!cur || String(p.tanggal) > cur) map[p.no_reg] = String(p.tanggal).slice(0,10);
      });
      setLastBayar(map);
    }).catch(()=>{});
  },[ta]);
  useEffect(()=>{ load() },[load]);
  useEffect(()=>{
    fetch("/api/auth/me").then(r=> r.ok ? r.json() : null).then(j=> setMyRole(j?.user?.role ?? "")).catch(()=>{});
  },[]);

  const openDetail = async (s: Siswa)=>{
    setSelected(s); setHist([]); setJml(""); setKet(""); setMsg("");
    const r = await fetch(`/api/pembayaran?no_reg=${s.no_reg}`); const j= await r.json(); setHist(j.data??[]);
  };

  const submitBayar = async (e: React.FormEvent)=>{
    e.preventDefault(); if(!selected) return;
    const n = Number(jml); if(!n || n<=0){ setMsg("Nominal harus >0"); return; }
    setSaving(true); setMsg("");
    try{
      const r = await fetch('/api/pembayaran',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ no_reg: selected.no_reg, jumlah:n, tanggal:tgl, metode, keterangan:ket })});
      const j = await r.json();
      if(!r.ok){ setMsg(j.error||'Gagal'); return; }
      setMsg("✓ Pembayaran tercatat");
      // refresh hist & siswa
      const rh = await fetch(`/api/pembayaran?no_reg=${selected.no_reg}`); const jh= await rh.json(); setHist(jh.data??[]);
      load();
      // update selected sisa
      if(j.siswa) setSelected(j.siswa);
      setJml(""); setKet("");
    }catch{ setMsg("Gagal terhubung"); } finally{ setSaving(false); }
  };

  const filtered = siswa.filter(s=>{
    const mq = !q || s.nama_siswa.toLowerCase().includes(q.toLowerCase()) || s.no_reg.includes(q) || (s.asal_sekolah||'').toLowerCase().includes(q.toLowerCase());
    const ms = filterStatus==="Semua" || s.status_bayar===filterStatus;
    return mq && ms;
  });

  const totalTagihan = filtered.reduce((a,c)=>a+Number(c.total_tagihan||0),0);
  const totalSisa = filtered.reduce((a,c)=>a+Number(c.sisa_tagihan||0),0);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar onTambah={()=> setModalOpen(true)} />
      <div className="min-w-0 flex-1">
        <MobileNav onTambah={()=> setModalOpen(true)} />
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm border border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Ganesha Operation Sumenep</p>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">Histori Pembayaran & Penagihan</h1>
            <p className="mt-1 text-xs text-red-100">Nomor WhatsApp yang dipakai adalah <b>No. HP Ortu</b> untuk pengingat cicilan.</p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select value={ta} onChange={e=> setTa(e.target.value)} className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <option value="2027/2028">TA 2027/2028 (Aktif)</option>
              <option value="2026/2027">TA 2026/2027 (Arsip)</option>
              <option value="Semua">Semua TA</option>
            </select>
            <select value={filterStatus} onChange={e=> setFilterStatus(e.target.value)} className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <option value="Semua">Semua Status</option>
              <option value="belum_lunas">Belum Lunas</option>
              <option value="cicilan">Cicilan</option>
              <option value="lunas">Lunas</option>
            </select>
            <input value={q} onChange={e=> setQ(e.target.value)} placeholder="Cari nama / no_reg / sekolah..." className="flex-1 min-w-[200px] rounded-full border border-red-200 bg-white px-4 py-2 text-sm outline-none focus:border-red-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 border border-red-100 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-xs text-gray-500 dark:text-slate-400">Siswa (filter)</p><p className="text-2xl font-black text-gray-800 dark:text-slate-100">{filtered.length}</p></div>
            <div className="rounded-2xl bg-white p-4 border border-red-100 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-xs text-gray-500 dark:text-slate-400">Total Tagihan</p><p className="text-lg font-bold text-gray-800 dark:text-slate-100">{fmtRp(totalTagihan)}</p></div>
            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 shadow-sm dark:bg-amber-950 dark:border-amber-900"><p className="text-xs text-amber-700 dark:text-amber-300">Total Sisa (Belum Dibayar)</p><p className="text-lg font-black text-amber-700 dark:text-amber-300">{fmtRp(totalSisa)}</p></div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-xs sm:text-sm">
                <thead><tr className="bg-slate-900 text-[10px] sm:text-[11px] uppercase tracking-wide text-white">
                  <th className="px-3 py-2.5 whitespace-nowrap">No Reg</th><th className="px-3 py-2.5">Nama Siswa</th><th className="px-3 py-2.5">TA</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Tagihan</th><th className="px-3 py-2.5">Sisa</th><th className="px-3 py-2.5 whitespace-nowrap">Terakhir Bayar</th><th className="px-3 py-2.5">WA Ortu</th><th className="px-3 py-2.5">Aksi</th>
                </tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">Memuat...</td></tr> :
                   filtered.length===0 ? <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">Tidak ada data untuk filter TA ini. Tambah siswa TA 2027/2028 via tombol Tambah Siswa.</td></tr> :
                   filtered.slice(0,200).map((s,i)=> {
                    const wa = waReminderLink(s, Number(s.total_tagihan||0), Number(s.sisa_tagihan||0));
                    const st = s.status_bayar;
                    return (
                    <tr key={s.no_reg} className={i%2?'bg-red-50/40 dark:bg-slate-800/60':'bg-white dark:bg-slate-900'}>
                      <td className="px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-red-700 dark:text-red-300">{s.no_reg}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-slate-100">{s.nama_siswa}<div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-slate-400">{s.tingkat_kelas} • {s.asal_sekolah}</div></td>
                      <td className="px-3 py-2.5 whitespace-nowrap"><span className={`rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium ${s.tahun_ajaran==='2027/2028'?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-600'}`}>{s.tahun_ajaran}</span></td>
                      <td className="px-3 py-2.5 whitespace-nowrap"><span className={`rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium ${st==='lunas'?'bg-green-100 text-green-700':st==='cicilan'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{st==='lunas'?'Lunas':st==='cicilan'?'Cicilan':'Belum Lunas'}</span></td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-[11px] sm:text-xs">{fmtRp(Number(s.total_tagihan||0))}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-[11px] sm:text-xs font-bold text-amber-700">{fmtRp(Number(s.sisa_tagihan||0))}</td>
                      <td className="px-3 py-2.5 font-mono whitespace-nowrap text-[11px] sm:text-xs text-gray-700">{lastBayar[s.no_reg] || <span className="text-gray-400">belum ada</span>}</td>
                      <td className="px-3 py-2.5 font-mono whitespace-nowrap text-[11px] sm:text-xs text-gray-600">{s.no_hp_ayah || s.no_hp_ortu || s.no_hp_ibu || '—'}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          <button onClick={()=> openDetail(s)} className="whitespace-nowrap rounded-full bg-red-600 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-white hover:bg-red-700">Kelola</button>
                          {canEdit && <button onClick={()=> setEditTarget(s)} title="Edit data siswa (super admin & CS)" className="whitespace-nowrap rounded-full bg-amber-500 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-white hover:bg-amber-600">Edit</button>}
                          {canEdit && <button onClick={async()=>{ if(!confirm(`Hapus ${s.nama_siswa} (${s.no_reg}) beserta histori pembayarannya? Tindakan ini tidak bisa dibatalkan.`)) return; const r = await fetch(`/api/siswa?no_reg=${s.no_reg}`,{method:'DELETE'}); const j = await r.json().catch(()=>null); if(!r.ok){ alert(j?.error||'Gagal hapus siswa'); return; } if(selected?.no_reg===s.no_reg) setSelected(null); load(); }} title="Hapus siswa (super admin & CS)" className="whitespace-nowrap rounded-full border border-red-300 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-red-600 hover:bg-red-50">Hapus</button>}
                          {wa && Number(s.sisa_tagihan)>0 && <a href={wa} target="_blank" rel="noreferrer" className="whitespace-nowrap rounded-full bg-green-600 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-white hover:bg-green-700">WA Ortu</a>}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={()=> setSelected(null)}>
              <div onClick={e=> e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-900">
                <div className="sticky top-0 flex items-center justify-between bg-red-600 px-5 py-4 text-white">
                  <div>
                    <h2 className="text-sm font-bold">{selected.nama_siswa} — {selected.no_reg}</h2>
                    <p className="text-xs text-red-100">TA {selected.tahun_ajaran} • {selected.tingkat_kelas} • Tagihan {fmtRp(Number(selected.total_tagihan||0))} • Sisa {fmtRp(Number(selected.sisa_tagihan||0))}</p>
                  </div>
                  <button onClick={()=> setSelected(null)} className="rounded-full p-1 hover:bg-red-500">✕</button>
                </div>
                <div className="space-y-4 p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-gray-50 p-3 border"><p className="text-xs text-gray-500">Nama Ortu</p><p className="text-sm font-semibold">{selected.nama_ayah || selected.nama_ortu || selected.nama_ibu || '—'}</p></div>
                    <div className="rounded-xl bg-green-50 p-3 border border-green-200"><p className="text-xs text-green-700">No. WA Ortu (pengingat)</p><p className="font-mono text-sm font-bold">{selected.no_hp_ayah || selected.no_hp_ortu || selected.no_hp_ibu || '—'}</p>
                      {waReminderLink(selected, Number(selected.total_tagihan||0), Number(selected.sisa_tagihan||0)) && Number(selected.sisa_tagihan)>0 && (
                        <a href={waReminderLink(selected, Number(selected.total_tagihan||0), Number(selected.sisa_tagihan||0))!} target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white">Kirim Pengingat via WA Ortu</a>
                      )}
                    </div>
                  </div>

                  <form onSubmit={submitBayar} className="rounded-2xl border border-red-100 bg-red-50/50 p-4 space-y-3">
                    <h3 className="text-sm font-bold text-red-800">Catat Pembayaran Cicilan</h3>
                    {msg && <p className="rounded-xl bg-white px-3 py-2 text-xs font-medium ring-1 ring-red-200">{msg}</p>}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div><label className="text-xs font-medium text-gray-600">Nominal (Rp)</label><input type="number" value={jml} onChange={e=> setJml(e.target.value)} placeholder="500000" className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm" /></div>
                      <div><label className="text-xs font-medium text-gray-600">Tanggal</label><input type="date" value={tgl} onChange={e=> setTgl(e.target.value)} className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm" /></div>
                      <div><label className="text-xs font-medium text-gray-600">Metode</label><select value={metode} onChange={e=> setMetode(e.target.value)} className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"><option value="tunai">Tunai</option><option value="transfer">Transfer</option><option value="qris">QRIS</option><option value="lainnya">Lainnya</option></select></div>
                    </div>
                    <input value={ket} onChange={e=> setKet(e.target.value)} placeholder="Keterangan (opsional) cth: Cicilan ke-3" className="w-full rounded-xl border bg-white px-3 py-2 text-sm" />
                    <button type="submit" disabled={saving} className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">{saving?'Menyimpan...':'Simpan Pembayaran'}</button>
                    {Number(selected.sisa_tagihan)>0 && <p className="text-xs text-gray-500">Sisa tagihan: {fmtRp(Number(selected.sisa_tagihan))} — pembayaran melebihi sisa akan ditolak.</p>}
                  </form>

                  <div>
                    <h3 className="mb-2 text-sm font-bold text-gray-800">Histori ({hist.length})</h3>
                    {hist.length===0 ? <p className="rounded-xl border border-dashed p-4 text-center text-xs text-gray-400">Belum ada pembayaran.</p> : (
                      <div className="overflow-hidden rounded-xl border">
                        <table className="w-full text-left text-sm">
                          <thead><tr className="bg-gray-50 text-xs text-gray-500"><th className="px-3 py-2">Tgl</th><th className="px-3 py-2">Ke</th><th className="px-3 py-2">Jumlah</th><th className="px-3 py-2">Metode</th><th className="px-3 py-2">Ket</th><th className="px-3 py-2"></th></tr></thead>
                          <tbody>{hist.map(h=> (
                            <tr key={h.id} className="border-t text-xs"><td className="px-3 py-2">{h.tanggal}</td><td className="px-3 py-2">#{h.cicilan_ke}</td><td className="px-3 py-2 font-medium">{fmtRp(h.jumlah)}</td><td className="px-3 py-2">{h.metode}</td><td className="px-3 py-2 text-gray-600">{h.keterangan||'—'}</td>
                              <td className="px-3 py-2"><button onClick={async()=>{ if(!confirm('Hapus pembayaran ini?')) return; await fetch(`/api/pembayaran?id=${h.id}`,{method:'DELETE'}); const rh=await fetch(`/api/pembayaran?no_reg=${selected.no_reg}`); const jh=await rh.json(); setHist(jh.data??[]); load(); }} className="text-red-600 hover:underline">Hapus</button></td></tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <footer className="pb-4 pt-2 text-center text-xs text-gray-400">TA 2027/2028 aktif • Data lama TA 2026/2027 tersimpan sebagai arsip</footer>
        </main>
      </div>
      <TambahSiswaModal open={modalOpen} onClose={()=> setModalOpen(false)} onSuccess={load} kelasOptions={[]} />
      <EditSiswaModal open={!!editTarget} siswa={editTarget} onClose={()=> setEditTarget(null)} onSuccess={()=>{ setEditTarget(null); load(); }} />
    </div>
  );
}
