import { NextRequest } from 'next/server';
import { proxyToIngestion } from '@/lib/api-proxy';

type Params = {
  teamId: string;
  userId: string;
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { teamId, userId } = await params;
  return proxyToIngestion(request, `/teams/${teamId}/members/${userId}`);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { teamId, userId } = await params;
  return proxyToIngestion(request, `/teams/${teamId}/members/${userId}`);
}
