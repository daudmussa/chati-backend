import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Megaphone, MessageCircle, Users } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

type DashboardData = {
  contacts: number;
  connectedNumbers: number;
  campaignDrafts: number;
  draftRecipients: number;
};

async function apiRequest<T>(url: string): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token || ''}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not load dashboard data.');
  return data as T;
}

export default function WhatsAppDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({ contacts: 0, connectedNumbers: 0, campaignDrafts: 0, draftRecipients: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [contactsResult, campaignsResult, connectionsResult] = await Promise.all([
        apiRequest<{ contacts: Array<{ optedOutAt: string | null }> }>(API_ENDPOINTS.BULK_CONTACTS),
        apiRequest<{ campaigns: Array<{ draftRecipients: number }> }>(API_ENDPOINTS.BULK_CAMPAIGNS),
        apiRequest<{ connections: Array<{ status: string }> }>(API_ENDPOINTS.BAILEYS_CONNECTIONS),
      ]);
      setData({
        contacts: contactsResult.contacts.filter(contact => !contact.optedOutAt).length,
        connectedNumbers: connectionsResult.connections.filter(connection => connection.status === 'connected').length,
        campaignDrafts: campaignsResult.campaigns.length,
        draftRecipients: campaignsResult.campaigns.reduce((total, campaign) => total + campaign.draftRecipients, 0),
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const stats = [
    { label: 'Connected numbers', value: data.connectedNumbers, icon: MessageCircle, color: 'text-green-700 bg-green-50' },
    { label: 'Opted-in contacts', value: data.contacts, icon: Users, color: 'text-blue-700 bg-blue-50' },
    { label: 'Campaign drafts', value: data.campaignDrafts, icon: Megaphone, color: 'text-purple-700 bg-purple-50' },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-green-700">WhatsApp campaign workspace</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">Welcome, {user?.name || 'there'}</h1>
            <p className="mt-2 text-gray-600">Manage linked numbers, opted-in contacts, and campaign drafts.</p>
          </div>
          <Button variant="outline" onClick={() => void loadDashboard()} disabled={loading}>Refresh</Button>
        </div>

        {error && <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map(stat => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-xl p-3 ${stat.color}`}><stat.icon className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{loading ? '—' : stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Get started</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-5">
              <h2 className="font-semibold text-gray-900">Connect a WhatsApp number</h2>
              <p className="mt-2 text-sm text-gray-600">Register your dedicated number in WhatsApp, then link it by scanning the Baileys QR code.</p>
              <Button asChild className="mt-4"><Link to="/bulk-messaging">Connect numbers <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
            <div className="rounded-lg border p-5">
              <h2 className="font-semibold text-gray-900">Prepare your first campaign</h2>
              <p className="mt-2 text-sm text-gray-600">Import contacts who opted in, record the consent source, and prepare a message draft.</p>
              <Button asChild variant="outline" className="mt-4"><Link to="/bulk-messaging">Open Bulk WhatsApp <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-gray-500">Recipients staged in drafts: {loading ? '—' : data.draftRecipients}</p>
      </div>
    </DashboardLayout>
  );
}
