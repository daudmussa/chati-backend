import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { API_ENDPOINTS } from '@/config/api';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: string;
  createdAt: string;
};

async function adminRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token || ''}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Admin request failed.');
  return data as T;
}

export default function WhatsAppAdmin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminRequest<{ users: AdminUser[] }>(API_ENDPOINTS.WHATSAPP_ADMIN_USERS);
      setUsers(result.users);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const updateRole = async (user: AdminUser, role: AdminUser['role']) => {
    if (role === user.role) return;
    setBusyUserId(user.id);
    setError('');
    setNotice('');
    try {
      await adminRequest(API_ENDPOINTS.WHATSAPP_ADMIN_USER_ROLE(user.id), {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      setNotice(`Updated ${user.email} to ${role}.`);
      await loadUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update user role.');
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User management</h1>
            <p className="mt-2 text-gray-600">Review accounts and manage admin access.</p>
          </div>
          <Button variant="outline" onClick={() => void loadUsers()} disabled={loading}>Refresh</Button>
        </div>
        {error && <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {notice && <div role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-700">{notice}</div>}
        <Card>
          <CardHeader><CardTitle>Accounts ({users.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-gray-500">Loading users…</p> : users.length === 0 ? <p className="text-sm text-gray-500">No accounts found.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b text-gray-500"><th className="py-3 pr-4">Name</th><th className="py-3 pr-4">Email</th><th className="py-3 pr-4">Created</th><th className="py-3">Role</th></tr></thead>
                  <tbody>{users.map(user => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{user.name || '—'}</td>
                      <td className="py-3 pr-4">{user.email}</td>
                      <td className="py-3 pr-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        <select
                          aria-label={`Role for ${user.email}`}
                          className="rounded-md border border-gray-300 bg-white px-3 py-2"
                          value={user.role}
                          disabled={busyUserId === user.id}
                          onChange={event => void updateRole(user, event.target.value as AdminUser['role'])}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
