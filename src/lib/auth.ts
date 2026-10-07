// File ini hanya dipakai di API routes (Node.js runtime), BUKAN middleware
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { encodeSession, decodeSession, SESSION_COOKIE } from '@/lib/session';

export type { SessionUser } from '@/lib/session';
export { encodeSession, decodeSession, SESSION_COOKIE };

export interface User {
  nik: string;
  nama: string;
  jabatan: string;
  username: string;
  password: string;
  role: 'super admin' | 'admin';
}

export function getUsers(): User[] {
  const p = join(process.cwd(), 'src/data/users.json');
  return JSON.parse(readFileSync(p, 'utf-8')) as User[];
}

export function findUser(username: string, password: string): User | null {
  const users = getUsers();
  return users.find((u) => u.username === username && u.password === password) ?? null;
}
