import { NextRequest, NextResponse } from 'next/server';
import { dashboardConfig } from './config';

export async function proxyToIngestion(
  request: NextRequest,
  endpoint: string): Promise<NextResponse> {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(endpoint, dashboardConfig.internalIngestionUrl);

    const searchParams = request.nextUrl.searchParams;
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      method: request.method,
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? JSON.stringify(await request.json()) : undefined,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Error proxying to ${endpoint}:`, error);
    return NextResponse.json({ error: 'Internal server error', message: 'Failed to proxy request' },
      { status: 500 }
    );
  }
}
