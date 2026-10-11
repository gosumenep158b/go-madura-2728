const fs = require('fs');
let t = fs.readFileSync('src/app/pendaftaran/page.tsx', 'utf8');

if (!t.includes('const [noHpOrtu, setNoHpOrtu]')) {
  t = t.replace('const [noHp, setNoHp] = useState<string>(\'\');', 'const [noHp, setNoHp] = useState<string>(\'\');\n  const [noHpOrtu, setNoHpOrtu] = useState<string>(\'\');');
}

const target = `<label className="block text-xs font-semibold text-gray-700">No. WhatsApp Orang Tua / Siswa</label>
                <input
                  type="text"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full mt-1 p-2 border rounded-xl text-sm"
                />`;

const replacement = `<div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">No. WA Siswa</label>
                    <input
                      type="text"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                      placeholder="08..."
                      className="w-full mt-1 p-2 border rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">No. WA Orang Tua</label>
                    <input
                      type="text"
                      value={noHpOrtu}
                      onChange={(e) => setNoHpOrtu(e.target.value)}
                      placeholder="08..."
                      className="w-full mt-1 p-2 border rounded-xl text-sm"
                    />
                  </div>
                </div>`;

// Find parent div block around it
const idx = t.find('No. WhatsApp Orang Tua / Siswa');
if (idx !== -1) {
  const divStart = t.lastIndexOf('<div', idx);
  const divEnd = t.indexOf('</div>', idx) + 6;
  t = t.substring(0, divStart) + replacement + t.substring(divEnd);
  fs.writeFileSync('src/app/pendaftaran/page.tsx', t, 'utf8');
  console.log('Successfully replaced via index boundaries');
} else {
  console.log('Not found');
}
