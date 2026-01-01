export interface ApiKey {
  id: string;
  prefix: string;
  name: string | null;
  team_id: string;
  team_name: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export interface CreateApiKeyRequest {
  teamId: string;
  name: string;
  expiresInDays?: number;
  environment?: 'live' | 'test';
}

export interface CreateApiKeyResponse {
  message: string;
  keyId: string;
  key: string;
  prefix: string;
  warning: string;
}

import { fetchJson } from './http';

export async function createApiKey(data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
  return fetchJson<CreateApiKeyResponse>(`/api/api-keys`, {
    method: 'POST',
    json: data,
  });
}

export async function getUserApiKeys(teamId?: string): Promise<ApiKey[]> {
  const params = new URLSearchParams();
  if (teamId) {
    params.set('teamId', teamId);
  }
  const url = `/api/api-keys${params.toString() ? `?${params.toString()}` : ''}`;

  const data = await fetchJson<{ apiKeys: ApiKey[] }>(url);
  return data.apiKeys;
}

export async function revokeApiKey(keyId: string): Promise<void> {
  await fetchJson(`/api/api-keys/${keyId}`, {
    method: 'DELETE',
  });
}

export async function updateApiKeyName(keyId: string, name: string): Promise<void> {
  await fetchJson(`/api/api-keys/${keyId}`, {
    method: 'PATCH',
    json: { name },
  });
}
