
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qyjtbddnjvqhvukgubwb.supabase.co',
  'sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh'
);

async function run() {
  const { data, error } = await supabase.from('admin_classes').select('*');
  console.log("Classes:", data, error);
}
run();
