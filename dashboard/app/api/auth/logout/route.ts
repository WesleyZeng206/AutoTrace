import { NextRequest, NextResponse } from 'next/server';

const INGESTION_URL = process.env.INTERNAL_INGESTION_URL || process.env.NEXT_PUBLIC_INGESTION_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;

  try {
    if (sessionToken) {
      await fetch(`${INGESTION_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
    }

    const res = NextResponse.json({ message: 'Logout successful' });
    res.cookies.set('session_token', '', {httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(0),
    });
    return res;
  } catch (error) {
    console.error('Logout proxy failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
