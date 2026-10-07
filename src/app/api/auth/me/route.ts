import { NextResponse } from 'next/server';
import { SESSION_COOKIE, decodeSession } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = token ? decodeSession(token) : null;
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
