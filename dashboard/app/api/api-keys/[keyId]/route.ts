import { NextRequest } from 'next/server';
import { proxyToIngestion } from '@/lib/api-proxy';

type Params = {
  keyId: string;
};

export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { keyId } = await params;
  return proxyToIngestion(request, `/api-keys/${keyId}`);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { keyId } = await params;
  return proxyToIngestion(request, `/api-keys/${keyId}`);
}
