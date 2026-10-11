
import { createClient } from '@supabase/supabase-js';
const supa = createClient('https://qyjtbddnjvqhvukgubwb.supabase.co','sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh');
async function run(){
  const {data:cls, error} = await supa.from('admin_classes').select('*');
  console.log('BEFORE count', cls?.length, 'error', error?.message);
  console.log(JSON.stringify(cls||[]).slice(0,6000));
  if(cls && cls.length){
    const ids = cls.map(c=>c.id);
    // delete all
    const {error:delErr, count} = await supa.from('admin_classes').delete().in('id', ids).select();
    console.log('DELETE err', delErr?.message, delErr);
    const {data:cls2} = await supa.from('admin_classes').select('*');
    console.log('AFTER count', cls2?.length);
  }
}
run();
