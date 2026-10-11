
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://qyjtbddnjvqhvukgubwb.supabase.co';
const supabaseKey = 'sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('students_slp_2627').select('*');
  if (error) { console.error(error); return; }
  console.log('Total rows:', data.length);
  
  const map = new Map();
  for (const r of data) {
    if (r.no_reg && !map.has(r.no_reg)) {
      map.set(r.no_reg, r);
    }
  }
  const unique = Array.from(map.values());
  console.log('Unique rows:', unique.length);

  await supabase.from('students_slp_2627').delete().neq('id', 0);
  
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100).map(r => {
      const copy = { ...r };
      delete copy.id;
      return copy;
    });
    await supabase.from('students_slp_2627').insert(chunk);
  }
  console.log('Deduplication completed via Node script!');
}
run();
