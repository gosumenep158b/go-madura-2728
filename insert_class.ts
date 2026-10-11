
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qyjtbddnjvqhvukgubwb.supabase.co',
  'sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh'
);

async function run() {
  const { data, error } = await supabase.from('admin_classes').insert([
    {
      class_name: '9-SMP-R-N-230',
      unit_name: 'Unit Jokotole',
      schedule: 'Sabtu (Matematika & Bahasa Indonesia)',
      capacity: 30,
      enrolled: 0
    }
  ]);
  console.log("Insert result:", data, error);
}
run();
