// File ini HANYA berisi fungsi yang aman untuk Edge Runtime (middleware)
// Tidak boleh ada readFileSync, process.cwd(), atau Node.js API lain

export interface SessionUser {
  nik: string;
  nama: string;
  jabatan: string;
  username: string;
  role: string;
}

export const SESSION_COOKIE = 'go_session';

export function encodeSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString('base64');
}

export function decodeSession(token: string): SessionUser | null {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString('utf-8')) as SessionUser;
  } catch {
    return null;
  }
}
