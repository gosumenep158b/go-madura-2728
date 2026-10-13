import { NextResponse } from 'next/server';
import { findUserAsync, encodeSession, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json() as { username: string; password: string };

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });
    }

    const user = await findUserAsync(username.trim(), password.trim());
    if (!user) {
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
    }

    const sessionUser = {
      nik: user.nik,
      nama: user.nama,
      jabatan: user.jabatan,
      username: user.username,
      role: user.role,
    };

    const token = encodeSession(sessionUser);

    const res = NextResponse.json({ success: true, user: sessionUser });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 jam
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Gagal memproses login.' }, { status: 500 });
  }
}
