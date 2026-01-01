import { fetchJson } from './http';

export interface TeamMember {
  user_id: string;
  email: string;
  username: string;
  role: string;
  joined_at: string;
  last_login_at: string | null;
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const data = await fetchJson<{ members: TeamMember[] }>(`/api/teams/${teamId}/members`);
  return data.members;
}

export async function addTeamMember(
  teamId: string,
  email: string,
  role: 'admin' | 'member'
): Promise<void> {
  await fetchJson(`/api/teams/${teamId}/members`, {
    method: 'POST',
    json: { email, role },
  });
}

export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: 'admin' | 'member'
): Promise<void> {
  await fetchJson(`/api/teams/${teamId}/members/${userId}`, {
    method: 'PATCH',
    json: { role },
  });
}

export async function removeMember(teamId: string, userId: string): Promise<void> {
  await fetchJson(`/api/teams/${teamId}/members/${userId}`, {
    method: 'DELETE',
  });
}
