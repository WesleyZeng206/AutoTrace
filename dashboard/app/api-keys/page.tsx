'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { TeamProvider } from '@/contexts/TeamContext';
import { TeamSwitcher } from '@/components/TeamSwitcher';
import { getUserApiKeys, createApiKey, revokeApiKey, type ApiKey,} from '@/lib/apiKeys';

function ApiKeysContent() {
  const { user, logout } = useAuth();
  const { currentTeam } = useTeam();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string>('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (currentTeam) {
      loadApiKeys();
    }
  }, [currentTeam]);

  const loadApiKeys = async () => {
    if (!currentTeam) return;

    try {
      setLoading(true);
      setError('');
      const data = await getUserApiKeys(currentTeam.id);
      setKeys(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!currentTeam || !keyName.trim()) return;

    try {
      setCreating(true);
      setError('');
      const result = await createApiKey({
        teamId: currentTeam.id,
        name: keyName.trim(),
        environment: 'live',
      });

      setCreatedKey(result.key);
      setKeyName('');
      await loadApiKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      await revokeApiKey(keyId);
      await loadApiKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
                  className="px-3 py-2 text-sm font-medium bg-blue-600 bg-opacity-90 text-white rounded-md hover:bg-opacity-100 transition-all"
                >
                  API Keys
                </Link>
                <Link
                  href="/team-members"
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50 rounded-md transition-all">
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
                className="px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-700 bg-opacity-50 hover:bg-opacity-70 rounded-md transition-all">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage API keys for {currentTeam?.name}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={() => {
              setShowModal(true);
              setCreatedKey('');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Create API Key
          </button>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {createdKey ? 'API Key Created' : 'Create New API Key'}
              </h3>

              {createdKey ? (
                <div>
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800 font-medium mb-2">
                      Save this key now because you won't be able to see it again!
                    </p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono break-all">
                        {createdKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(createdKey)}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                        Copy
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setCreatedKey('');
                    }}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                    Done
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Key Name
                    </label>
                    <input
                      type="text"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder="e.g., Production Server"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCreateKey}
                      disabled={creating || !keyName.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setKeyName('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : keys.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No API keys yet. Create one to get started.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prefix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {keys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {key.name || 'Unnamed'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {key.prefix}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          key.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {key.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.is_active && (
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
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

export default function ApiKeysPage() {
  return (
    <TeamProvider>
      <ApiKeysContent />
    </TeamProvider>
  );
}
