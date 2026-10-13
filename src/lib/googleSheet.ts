import { google } from 'googleapis';

export function assertSheetEnv() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!sheetId || !email || !key) {
    throw new Error(
      'ENV belum lengkap — set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY di .env.local (lokal) dan Vercel > Settings > Environment Variables, lalu redeploy.',
    );
  }
  return { sheetId, email, key };
}

export function getSheetsClient() {
  const { email, key } = assertSheetEnv();
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

export function sheetErrorMessage(e: any): string {
  const msg = String(e?.message || e);
  if (msg.includes('invalid_grant') || msg.includes('Invalid JWT')) {
    return 'Kredensial Google ditolak (invalid_grant) — cek GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_PRIVATE_KEY, pastikan key utuh.';
  }
  if (e?.code === 403 || msg.includes('PERMISSION_DENIED') || msg.includes('caller does not have permission')) {
    return 'Service account tidak punya akses ke sheet — Share sheet ke GOOGLE_SERVICE_ACCOUNT_EMAIL sebagai Editor, lalu coba lagi.';
  }
  if (e?.code === 404 || msg.includes('Requested entity was not found')) {
    return 'Spreadsheet tidak ditemukan — cek GOOGLE_SHEET_ID (segmen di URL /d/.../edit).';
  }
  return 'Gagal simpan ke Google Sheet: ' + msg;
}
