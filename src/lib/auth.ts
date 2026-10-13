// File ini hanya dipakai di API routes (Node.js runtime), BUKAN middleware
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { encodeSession, decodeSession, SESSION_COOKIE } from '@/lib/session';

export type { SessionUser } from '@/lib/session';
export { encodeSession, decodeSession, SESSION_COOKIE };

export interface User {
  nik: string;
  nama: string;
  jabatan: string;
  username: string;
  password: string;
  role: 'super admin' | 'admin' | 'cs';
}

// Role yang boleh mengedit data siswa
export const EDIT_SISWA_ROLES = ['super admin', 'cs'];
export function canEditSiswa(role?: string | null): boolean {
  return !!role && EDIT_SISWA_ROLES.includes(role.toLowerCase());
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qyjtbddnjvqhvukgubwb.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_93qIWR8_O2AD8AD39IUhhA_SjlmEpfh';
  return createClient(url, key);
}

function isTableMissing(error: any): boolean {
  const code = (error as any)?.code;
  const msg = String((error as any)?.message || '').toLowerCase();
  return code === 'PGRST205' || code === '42P01' || msg.includes('does not exist') || msg.includes('relation') || msg.includes('schema cache');
}

// Password baru disimpan sebagai hash sha256; password lama (plaintext) tetap bisa login
export function hashPassword(plain: string): string {
  return 'sha256:' + createHash('sha256').update(plain).digest('hex');
}
export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored) return false;
  if (stored.startsWith('sha256:')) return hashPassword(plain) === stored;
  return stored === plain;
}

const usersPath = join(process.cwd(), 'src/data/users.json');

export function getUsers(): User[] {
  try {
    return JSON.parse(readFileSync(usersPath, 'utf-8')) as User[];
  } catch {
    return [];
  }
}

function toUser(r: any): User {
  return { nik: r.nik, nama: r.nama, jabatan: r.jabatan, username: r.username, password: r.password, role: r.role };
}

async function getSupabaseUsers(): Promise<{ users: User[]; tableMissing: boolean }> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('app_users').select('*').limit(100);
    if (!error && data) return { users: (data as any[]).map(toUser), tableMissing: false };
    if (error && isTableMissing(error)) return { users: [], tableMissing: true };
    if (error) console.warn('[auth] supabase users read error:', error.message);
  } catch (e) {
    console.warn('[auth] supabase unavailable, fallback file');
  }
  return { users: [], tableMissing: false };
}

export function findUser(username: string, password: string): User | null {
  const users = getUsers();
  return users.find((u) => u.username === username && verifyPassword(password, u.password)) ?? null;
}

// Supabase-first (tabel app_users), fallback file lokal
export async function findUserAsync(username: string, password: string): Promise<User | null> {
  const sb = await getSupabaseUsers();
  if (!sb.tableMissing && sb.users.length > 0) {
    // User sudah migrasi ke Supabase -> hanya Supabase yang berlaku
    if (sb.users.some((u) => u.username === username)) {
      return sb.users.find((u) => u.username === username && verifyPassword(password, u.password)) ?? null;
    }
    // Username belum ada di Supabase (belum migrasi) -> coba file seed
    return findUser(username, password);
  }
  return findUser(username, password);
}

export async function updatePasswordAsync(username: string, newPassword: string): Promise<{ ok: boolean; error?: string; warning?: string }> {
  const hashed = hashPassword(newPassword);
  // 1) Coba Supabase dulu
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('app_users').update({ password: hashed }).eq('username', username).select('username');
    if (!error && data && data.length > 0) return { ok: true };
    if (error && !isTableMissing(error)) console.warn('[auth] supabase password update error:', error.message);
  } catch (e) {
    console.warn('[auth] supabase unavailable');
  }
  // 2) Fallback file lokal (dev only; gagal EROFS di Vercel bila Supabase down)
  try {
    const users = getUsers();
    const idx = users.findIndex((u) => u.username === username);
    if (idx === -1) return { ok: false, error: 'User tidak ditemukan.' };
    users[idx].password = hashed;
    writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf-8');
    return { ok: true, warning: 'Tersimpan lokal (dev). Jalankan database/app_users_schema.sql agar persisten di Vercel.' };
  } catch (e: any) {
    if ((e as any)?.code === 'EROFS' || String(e?.message || '').includes('read-only')) {
      return { ok: false, error: 'Gagal menyimpan: Supabase tidak tersedia & filesystem Vercel read-only. Jalankan database/app_users_schema.sql dulu.' };
    }
    return { ok: false, error: 'Gagal menyimpan password baru.' };
  }
}

// Ambil session user dari cookie pada Request (untuk gate role di API routes)
export function getSessionFromRequest(req: Request): import('@/lib/session').SessionUser | null {
  try {
    const cookie = req.headers.get('cookie') || '';
    const m = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
    if (!m) return null;
    return decodeSession(decodeURIComponent(m[1]));
  } catch {
    return null;
  }
}
