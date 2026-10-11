
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://qyjtbddnjvqhvukgubwb.supabase.co','sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh');
async function run(){
  // coba insert minimal tanpa capacity untuk detect kolom
  const tests = [
    {class_name:'test-a', unit_name:'Unit Jokotole', schedule:'Senin'},
    {class_name:'test-b', capacity:25},
    {kapasitas:25},
  ];
  for(const payload of tests){
    const {data, error} = await supabase.from('admin_classes').insert([payload]).select();
    console.log("payload:", JSON.stringify(payload), "=> error:", error?.message || "OK", "data:", JSON.stringify(data)?.slice(0,300));
    if(data && data.length) {
      // hapus lagi
      await supabase.from('admin_classes').delete().eq('id', data[0].id);
    }
  }
  // coba select untuk lihat kolom yang ada (jika ada data)
  const {data, error} = await supabase.from('admin_classes').select('*').limit(1);
  console.log("select error:", error);
  console.log("select data:", data);
  // coba dengan kolom berbeda
  const tryCols = ['class_name','nama_kelas','nama_kelompok','kapasitas','capacity','unit_name','unit','schedule','jadwal','hari_jam','enrolled','terisi','is_active'];
  for(const col of tryCols){
    const {error} = await supabase.from('admin_classes').select(col).limit(1);
    console.log(col + ":", error ? error.message.slice(0,120) : "OK exists");
  }
}
run();
