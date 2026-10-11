const fs = require('fs');
let t = fs.readFileSync('src/app/pengaturan/page.tsx', 'utf8');

// Update generator function in handleAddClass to use exact requested format:
// tingkat kelas (4-SD, 5-SD, 7-SMP atau 10-UMUM, 11-UMUM, 12-UMUM) - program (R, S, M) - N - 3digit
// e.g. 4-SD-R-N-230, 11-UMUM-R-N-001, etc.

const oldGen = `    let codeLetter = 'R';
    if (cProgram === 'Eksekutif Silver') codeLetter = 'S';
    else if (cProgram === 'Eksekutif Medical Class') codeLetter = 'M';
    
    let tingkatNum = cTingkat.replace(/[^0-9]/g, '');
    if (!tingkatNum) tingkatNum = '12';
    
    let jenjangLabel = 'UMUM';
    if (cTingkat.includes('SD')) jenjangLabel = 'SD';
    else if (cTingkat.includes('SMP')) jenjangLabel = 'SMP';
    else if (cTingkat.includes('SMA')) jenjangLabel = 'UMUM';
    
    const generatedName = \`\${tingkatNum}-\${jenjangLabel}-\${codeLetter}-N-\${cNumber}\`;`;

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

// Also update the preview badge / text in the form JSX where users see the live format:
// <span className="text-xs font-bold text-gray-500 bg-white px-2 py-2 border rounded-xl">
//   {`${cTingkat.replace(/[^0-9]/g,'') || '12'}-${cProgram==='Reguler SD'||cProgram==='Reguler Non SD'?'R':cProgram==='Eksekutif Silver'?'S':'M'}-`}
// </span>

const oldPreviewSpan = `{`${cTingkat.replace(/[^0-9]/g,'') || '12'}-${cProgram==='Reguler SD'||cProgram==='Reguler Non SD'?'R':cProgram==='Eksekutif Silver'?'S':'M'}-`}`;

// Let's replace the preview span and p tag in JSX
// Find where the preview is rendered in src/app/pengaturan/page.tsx
const targetSnippet = `                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor / Suffix Nama Kelas</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 bg-white px-2 py-2 border rounded-xl">
                        {\`\${cTingkat.replace(/[^0-9]/g,'') || '12'}-\${cProgram==='Reguler SD'||cProgram==='Reguler Non SD'?'R':cProgram==='Eksekutif Silver'?'S':'M'}-\`}
                      </span>
                      <input type="text" value={cNumber} onChange={e=>setCNumber(e.target.value)} className="w-20 p-2 border rounded-xl text-sm font-bold text-center" placeholder="001" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Format: <b>{\`\${cTingkat.replace(/[^0-9]/g,'') || '12'}-\${cProgram==='Reguler SD'||cProgram==='Reguler Non SD'?'R':cProgram==='Eksekutif Silver'?'S':'M'}-\${cNumber}\`}</b></p>
                  </div>`;

const newTargetSnippet = `                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor / Suffix Nama Kelas</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 bg-white px-2 py-2 border rounded-xl">
                        {\`\${cTingkat.replace(/[^0-9]/g,'') || '12'}-\${cTingkat.includes('SD')?'SD':cTingkat.includes('SMP')?'SMP':'UMUM'}-\${cProgram==='Reguler SD'||cProgram==='Reguler Non SD'?'R':cProgram==='Eksekutif Silver'?'S':'M'}-N-\`}
                      </span>
                      <input type="text" value={cNumber} onChange={e=>setCNumber(e.target.value)} className="w-20 p-2 border rounded-xl text-sm font-bold text-center" placeholder="230" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Format: <b>{\`\${cTingkat.replace(/[^0-9]/g,'') || '12'}-\${cTingkat.includes('SD')?'SD':cTingkat.includes('SMP')?'SMP':'UMUM'}-\${cProgram==='Reguler SD'||cProgram==='Reguler Non SD'?'R':cProgram==='Eksekutif Silver'?'S':'M'}-N-\${cNumber}\`}</b></p>
                  </div>`;

if (t.includes(targetSnippet)) {
  t = t.replace(targetSnippet, newTargetSnippet);
  fs.writeFileSync('src/app/pengaturan/page.tsx', t, 'utf8');
  console.log('Successfully updated format preview and badge');
} else {
  console.log('Target snippet not found exactly');
}
