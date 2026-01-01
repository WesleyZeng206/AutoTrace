'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { TeamProvider } from '@/contexts/TeamContext';
import { TeamSwitcher } from '@/components/TeamSwitcher';
import { getTeamMembers, addTeamMember, removeMember, updateMemberRole, type TeamMember,} from '@/lib/teams';

function TeamMembersContent() {
  const { user, logout } = useAuth();
  const { currentTeam } = useTeam();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>('member');
  const [isAdding, setIsAdding] = useState(false);
  const [modalError, setModalError] = useState<string>('');

  const userRole = currentTeam?.role;
  const canManageMembers = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    if (currentTeam) {
      loadMembers();
    }
  }, [currentTeam]);

  const loadMembers = async () => {
    if (!currentTeam) return;

    try {
      setIsLoading(true);
      setError('');
      const teamMembers = await getTeamMembers(currentTeam.id);
      setMembers(teamMembers);
    } catch (err: any) {
      setError(err.message || 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!currentTeam || !newMemberEmail.trim()) return;

    try {
      setIsAdding(true);
      setModalError('');
      await addTeamMember(currentTeam.id, newMemberEmail.trim(), newMemberRole);
      setNewMemberEmail('');
      setShowAddModal(false);
      setModalError('');
      await loadMembers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to add team member');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string, username: string) => {
    if (!currentTeam) return;

    if (!confirm(`Are you sure you want to remove ${username} from the team?`)) {
      return;
    }

    try {
      setError('');
      await removeMember(currentTeam.id, userId);
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'member') => {
    if (!currentTeam) return;

    try {
      setError('');
      await updateMemberRole(currentTeam.id, userId, newRole);
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to update member role');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold text-white hover:text-blue-300 transition-colors">
                AutoTrace
              </Link>
              <div className="flex flex-wrap space-x-2">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50 rounded-md transition-all"
                >
                  Dashboard
                </Link>
                <Link
                  href="/api-keys"
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50 rounded-md transition-all"
                >
                  API Keys
                </Link>
                <Link
                  href="/team-members"
                  className="px-3 py-2 text-sm font-medium bg-blue-600 bg-opacity-90 text-white rounded-md hover:bg-opacity-100 transition-all">
                  Team Members
                </Link>
                <Link
                  href="/docs"
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50 rounded-md transition-all">
                  Documentation
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <TeamSwitcher />
              <span className="text-sm text-slate-300">{user?.username}</span>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-700 bg-opacity-50 hover:bg-opacity-70 rounded-md transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage members of {currentTeam?.name}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {canManageMembers && (
          <div className="mb-6">
            <button
              onClick={() => {
                setShowAddModal(true);
                setModalError('');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Member
            </button>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Team Member</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="email@example.com or username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as 'admin' | 'member')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {modalError && (
                <div className="mb-4 rounded-md bg-red-50 p-3 border border-red-200">
                  <p className="text-sm text-red-800">{modalError}</p>
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={handleAddMember}
                  disabled={isAdding || !newMemberEmail.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewMemberEmail('');
                    setModalError('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No team members found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  {canManageMembers && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.username}
                      {member.user_id === user?.id && (
                        <span className="ml-2 text-xs text-gray-500">(You)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canManageMembers && member.role !== 'owner' ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleUpdateRole(member.user_id, e.target.value as 'admin' | 'member')
                          }
                          className="text-sm border border-gray-300 rounded px-2 py-1 capitalize"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>
                    {canManageMembers && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.role !== 'owner' && member.user_id !== user?.id && (
                          <button
                            onClick={() => handleRemoveMember(member.user_id, member.username)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeamMembersPage() {
  return (
    <TeamProvider>
      <TeamMembersContent />
    </TeamProvider>
  );
}
