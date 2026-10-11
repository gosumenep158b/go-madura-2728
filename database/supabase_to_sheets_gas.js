/**
 * Google Apps Script untuk menarik data siswa & pendaftaran dari Supabase GO
 * ke Google Spreadsheet secara otomatis.
 *
 * Cara pakai di Google Sheets:
 * 1. Buka Google Spreadsheet Anda.
 * 2. Klik Extensions > Apps Script.
 * 3. Tempel kode ini, lalu simpan.
 * 4. Jalankan fungsi `syncSupabaseToSheet()`.
 */

const SUPABASE_URL = 'https://qyjtbddnjvqhvukgubwb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh';

function syncSupabaseToSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sinkronisasi Data Pendaftaran (Registrations)
  fetchAndWriteTable_(ss, 'registrations', 'Pendaftaran_Supabase');
  
  // 2. Sinkronisasi Data Siswa SLP (Students SLP)
  fetchAndWriteTable_(ss, 'students_slp_2627', 'Siswa_SLP_Supabase');
  
  Logger.log('Sinkronisasi Supabase ke Spreadsheet Berhasil!');
}

function fetchAndWriteTable_(ss, tableName, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear();
  }

  const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*`;
  const options = {
    method: 'get',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const rc = response.getResponseCode();
  
  if (rc !== 200) {
    Logger.log(`Gagal mengambil data dari ${tableName}: ${response.getContentText()}`);
    return;
  }

  const data = JSON.parse(response.getContentText());
  if (!data || data.length === 0) {
    sheet.appendRow(['Tidak ada data']);
    return;
  }

  // Ambil headers dari keys object pertama
  const headers = Object.keys(data[0]);
  sheet.appendRow(headers);

  // Masukkan baris data
  const rows = data.map(item => headers.map(h => item[h] !== undefined ? item[h] : ''));
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  
  // Format header baris pertama
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#b70011').setFontColor('#ffffff');
}
