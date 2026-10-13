import { NextResponse } from 'next/server';
import { findUserAsync, updatePasswordAsync, getSessionFromRequest } from '@/lib/auth';

// PATCH { oldPassword, newPassword } — user mengganti passwordnya sendiri
export async function PATCH(req: Request) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Belum login.' }, { status: 401 });

    const { oldPassword, newPassword } = (await req.json()) as { oldPassword?: string; newPassword?: string };
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru wajib diisi.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter.' }, { status: 400 });
    }
    if (oldPassword === newPassword) {
      return NextResponse.json({ error: 'Password baru harus berbeda dari yang lama.' }, { status: 400 });
    }

    const user = await findUserAsync(session.username, oldPassword);
    if (!user) return NextResponse.json({ error: 'Password lama salah.' }, { status: 400 });

    const res = await updatePasswordAsync(session.username, newPassword);
    if (!res.ok) return NextResponse.json({ error: res.error || 'Gagal ganti password.' }, { status: 500 });

    return NextResponse.json({ success: true, warning: res.warning });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Gagal ganti password.' }, { status: 500 });
  }
}
