'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AdminRole, AdminUser } from '@/lib/types';

export default function AdminUsersPage() {
  const { user: signedInUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const [usersResponse, rolesResponse] = await Promise.all([
      apiFetch('/api/admin-panel/users'),
      apiFetch('/api/admin-panel/roles'),
    ]);

    if (!usersResponse.ok) {
      setError(await readError(usersResponse, 'Could not load the users'));
      setStatus('failed');
      return;
    }

    setUsers((await usersResponse.json()).data);

    if (rolesResponse.ok) {
      setRoles((await rolesResponse.json()).data);
    }

    setStatus('ready');
  }, []);

  useEffect(() => {
    async function run() {
      try {
        await load();
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    run();
  }, [load]);

  async function handleRoleChange(target: AdminUser, roleId: number) {
    setSavingId(target.id);
    setError('');
    setMessage('');

    try {
      const response = await apiFetch(`/api/admin-panel/users/${target.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ roleId }),
      });

      if (!response.ok) {
        setError(await readError(response, 'Could not change this role'));
      } else {
        const { data }: { data: AdminUser } = await response.json();
        setMessage(`${data.fullName} is now ${data.role?.name}.`);
      }

      await load();
    } catch {
      setError('Could not reach the server. Is the backend running?');
    }

    setSavingId(null);
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <Link href="/admin" className="text-sm text-gray-500 hover:underline">
        ← Admin panel
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Users and roles</h1>
      <p className="mt-1 text-sm text-gray-600">
        Changing a role takes effect on the user&apos;s next request — they do not
        need to sign in again.
      </p>

      {message && (
        <p className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === 'loading' && <p className="mt-6 text-sm text-gray-500">Loading…</p>}

      {status === 'ready' && (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-600">
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2 w-32">Joined</th>
              <th className="py-2 w-56">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((row) => {
              const isSelf = row.id === signedInUser?.id;

              return (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="py-3 font-medium">
                    {row.fullName}
                    {isSelf && <span className="ml-2 text-xs text-gray-500">You</span>}
                  </td>
                  <td className="py-3 text-gray-600">{row.email}</td>
                  <td className="py-3 text-gray-500">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <select
                      value={row.role?.id ?? ''}
                      disabled={isSelf || savingId === row.id}
                      onChange={(e) =>
                        handleRoleChange(row, Number(e.target.value))
                      }
                      className="w-full rounded border border-gray-300 px-2 py-1 disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      {!row.role && <option value="">No role</option>}
                      {row.role &&
                        !roles.some((role) => role.id === row.role?.id) && (
                          <option value={row.role.id}>{row.role.name}</option>
                        )}
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
