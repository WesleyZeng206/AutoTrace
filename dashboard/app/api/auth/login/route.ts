import { NextRequest, NextResponse } from 'next/server';

// Use INTERNAL_INGESTION_URL for server-side requests (Docker network)
// Falls back to NEXT_PUBLIC_INGESTION_URL for local development
const INGESTION_URL = process.env.INTERNAL_INGESTION_URL || process.env.NEXT_PUBLIC_INGESTION_URL || 'http://localhost:4000';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${INGESTION_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Login failed' },
        { status: response.status }
      );
    }

    const res = NextResponse.json(data, { status: 200 });
    res.cookies.set('session_token', data.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return res;
  } catch (error) {
    console.error('Login proxy failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
