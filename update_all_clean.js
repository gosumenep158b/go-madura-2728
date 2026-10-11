const fs = require('fs');
let t = fs.readFileSync('src/app/pengaturan/page.tsx', 'utf8');

// Replace all occurrences of numbered labels in src/app/pengaturan/page.tsx
t = t.replace(/>1\. Pilih Unit Cabang</g, '>Pilih Unit Cabang<');
t = t.replace(/>2\. Pilih Program</g, '>Pilih Program<');
t = t.replace(/>3\. Pilih Tingkat Kelas</g, '>Pilih Tingkat Kelas<');
t = t.replace(/>4\. Nomor \/ Suffix Nama Kelas</g, '>Nomor / Suffix Nama Kelas<');
t = t.replace(/>5\. Pilih Ruangan \(Anti-Bentrok\)</g, '>Pilih Ruangan (Anti-Bentrok)<');
t = t.replace(/>6 &amp; 7\. Sesi Belajar 1 \(Hari &amp; Jam\)</g, '>Sesi Belajar 1 (Hari &amp; Jam)<');
t = t.replace(/>8 &amp; 9\. Sesi Belajar 2 \(Hari &amp; Jam\)</g, '>Sesi Belajar 2 (Hari &amp; Jam)<');
t = t.replace(/\+ 10\. Simpan Jadwal &amp; Kelas/g, '+ Simpan Jadwal &amp; Kelas');
t = t.replace(/>11\. Daftar Kelas &amp; Sisa Daya Kapasitas</g, '>Daftar Kelas &amp; Sisa Daya Kapasitas<');

// Update name generator in handleAddClass for format: [tingkat]-[jenjang]-[R/S/M]-N-[nomor] (e.g. 4-SD-R-N-230, 10-UMUM-R-N-230)
const oldGen = `    let codeLetter = 'R';
    if (cProgram === 'Eksekutif Silver') codeLetter = 'S';
    else if (cProgram === 'Eksekutif Medical Class') codeLetter = 'M';
    
    let tingkatNum = cTingkat.replace(/[^0-9]/g, '');
    if (!tingkatNum) tingkatNum = '12';
    
    const generatedName = \`\${tingkatNum}-\${codeLetter}-\${cNumber}\`;`;

const newGen = `    let codeLetter = 'R';
    if (cProgram === 'Eksekutif Silver') codeLetter = 'S';
    else if (cProgram === 'Eksekutif Medical Class') codeLetter = 'M';
    
    let tingkatNum = cTingkat.replace(/[^0-9]/g, '');
    if (!tingkatNum) tingkatNum = '12';
    
    let jenjangLabel = 'UMUM';
    if (cTingkat.includes('SD')) jenjangLabel = 'SD';
    else if (cTingkat.includes('SMP')) jenjangLabel = 'SMP';
    else if (cTingkat.includes('SMA')) jenjangLabel = 'UMUM';
    
    const generatedName = \`\${tingkatNum}-\${jenjangLabel}-\${codeLetter}-N-\${cNumber}\`;`;

if (t.includes(oldGen)) {
  t = t.replace(oldGen, newGen);
  console.log('Replaced generator successfully');
}

// Also update the preview span in JSX:
// Format preview: `${cTingkat.replace(/[^0-9]/g,'') || '12'}-${cTingkat.includes('SD')?'SD':cTingkat.includes('SMP')?'SMP':'UMUM'}-${cProgram==='Reguler SD'||cProgram==='Reguler Non SD'?'R':cProgram==='Eksekutif Silver'?'S':'M'}-N-${cNumber}`
const oldSpan = `{`${cTingkat.replace(/[^0-9]/g,'') || '12'}-${cProgram==='Reguler SD'||cProgram==='Reguler Non SD'?'R':cProgram==='Eksekutif Silver'?'S':'M'}-${cNumber}`}`;
// Let's use regex to replace span content
t = t.replace(/{\`\$\{cTingkat\.replace\(\/[^0-9]\/g,''\) \|\| '12'\}-\$\{[^}]+\}-\$\{[^}]+\}\`}/g, 
  "{\`${cTingkat.replace(/[^0-9]/g,'') || '12'}-${cTingkat.includes('SD')?'SD':cTingkat.includes('SMP')?'SMP':'UMUM'}-${cProgram==='Reguler SD'||cProgram==='Reguler Non SD'?'R':cProgram==='Eksekutif Silver'?'S':'M'}-N-${cNumber}\`}");

fs.writeFileSync('src/app/pengaturan/page.tsx', t, 'utf8');
console.log('Updated successfully');
