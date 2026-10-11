
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://qyjtbddnjvqhvukgubwb.supabase.co','sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh');
async function run(){
  const candidates = ['id','tingkat_kelas','nama_kelompok','ruang','kapasitas','kurikulum','hari_jam','is_active','created_at','unit','unit_name','unit_cabang','branch','cabang','class_name','capacity','schedule','enrolled','nama_kelas','jadwal','terisi','kelas','nama','kode_kelas'];
  for(const col of candidates){
    const {error} = await supabase.from('admin_classes').select(col).limit(1);
    console.log(col.padEnd(16) + "=> " + (error ? "MISSING: "+error.message.slice(0,100) : "EXISTS"));
  }
  // coba insert minimal yg benar
  console.log("\n--- try insert with correct cols ---");
  const payload = { tingkat_kelas: '12', nama_kelompok: '12-UMUM-R-N-230-SMANSA', ruang: 'Ruang 1', kapasitas: 25, hari_jam: 'Senin & Kamis (16.00 - 19.30)', is_active: true };
  const {data, error} = await supabase.from('admin_classes').insert([payload]).select();
  console.log("insert correct:", error ? error.message : "OK", JSON.stringify(data?.[0]||null)?.slice(0,500));
  if(data && data[0]) {
    console.log("inserted columns:", Object.keys(data[0]).join(", "));
    // clean up
    await supabase.from('admin_classes').delete().eq('id', data[0].id);
    console.log("cleaned up");
  }
  // coba tanpa ruang/kurikulum
  console.log("\n--- try without ruang ---");
  const p2 = { tingkat_kelas: '12', nama_kelompok: 'TEST-2', kapasitas: 25, hari_jam: 'Selasa' };
  const r2 = await supabase.from('admin_classes').insert([p2]).select();
  console.log("p2:", r2.error ? r2.error.message : "OK", JSON.stringify(r2.data?.[0]||null)?.slice(0,400));
  if(r2.data && r2.data[0]) await supabase.from('admin_classes').delete().eq('id', r2.data[0].id);
}
run();
