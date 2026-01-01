import { NextRequest } from 'next/server';
import { proxyToIngestion } from '@/lib/api-proxy';

type Params = {
  teamId: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { teamId } = await params;
  return proxyToIngestion(request, `/teams/${teamId}/members`);
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { teamId } = await params;
  return proxyToIngestion(request, `/teams/${teamId}/members`);
}
