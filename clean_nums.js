const fs = require('fs');
let t = fs.readFileSync('src/app/pengaturan/page.tsx', 'utf8');

// Clean all label numbers in the classes tab
t = t.replace('1. Pilih Unit Cabang', 'Pilih Unit Cabang')
     .replace('2. Pilih Program', 'Pilih Program')
     .replace('3. Pilih Tingkat Kelas', 'Pilih Tingkat Kelas')
     .replace('4. Nomor / Suffix Nama Kelas', 'Nomor / Suffix Nama Kelas')
     .replace('5. Pilih Ruangan (Anti-Bentrok)', 'Pilih Ruangan (Anti-Bentrok)')
     .replace('6 &amp; 7. Sesi Belajar 1 (Hari &amp; Jam)', 'Sesi Belajar 1 (Hari &amp; Jam)')
     .replace('8 &amp; 9. Sesi Belajar 2 (Hari &amp; Jam)', 'Sesi Belajar 2 (Hari &amp; Jam)')
     .replace('+ 10. Simpan Jadwal &amp; Kelas', '+ Simpan Jadwal &amp; Kelas')
     .replace('11. Daftar Kelas &amp; Sisa Daya Kapasitas', 'Daftar Kelas &amp; Sisa Daya Kapasitas');

// Also update naming preview and generation logic
// Format requested: [tingkat]-[jenjang]-[R/S/M]-N-[nomor] (e.g. 4-SD-R-N-230, 10-UMUM-R-N-230)
const oldSpan = `{`${cTingkat.replace(/[^0-9]/g,'') || '12'}-${cProgram==='Reguler SD'||cProgram==='Reguler Non SD'?'R':cProgram==='Eksekutif Silver'?'S':'M'}-`}`;
// Let's replace the whole generation block inside handleAddClass and JSX

fs.writeFileSync('src/app/pengaturan/page.tsx', t, 'utf8');
console.log('Cleaned numbers');
