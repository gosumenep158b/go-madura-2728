const fs = require('fs');
let t = fs.readFileSync('src/app/pendaftaran/page.tsx', 'utf8');

const snippet = `  useEffect(()=>{
    // reset pilihan kelas jika sudah tidak ada yang cocok di grade/unit baru
    if(!kelasOptions.length) return;
    if(!selectedKelasId) return;
    const cur = kelasOptions.find((c:any)=> String(c.id)===selectedKelasId);
    if(!cur || cur.tingkat_kelas !== grade || cur.ruang !== selectedUnit) setSelectedKelasId('');
  },[grade, selectedUnit, kelasOptions, selectedKelasId]);`;

if (t.includes(snippet)) {
  t = t.replace(snippet, '');
  fs.writeFileSync('src/app/pendaftaran/page.tsx', t, 'utf8');
  console.log('Replaced successfully');
} else {
  // Let's replace by substrings
  let idx = t.find('reset pilihan kelas');
  console.log('idx:', idx);
}
