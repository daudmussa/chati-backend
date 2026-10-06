import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ImagePlus, Megaphone, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { API_ENDPOINTS } from '@/config/api';

type BulkContact = {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  consentSource: string;
  optedOutAt: string | null;
};

type BulkCampaign = {
  id: string;
  name: string;
  messageText: string;
  imageUrl: string | null;
  status: string;
  totalRecipients: number;
  draftRecipients: number;
  createdAt: string;
};

type WhatsAppConnection = {
  id: string;
  phoneNumber: string;
  status: string;
  lastError: string | null;
  connectedAt: string | null;
  createdAt: string;
};

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}

export default function BulkMessaging() {
  const [contacts, setContacts] = useState<BulkContact[]>([]);
  const [campaigns, setCampaigns] = useState<BulkCampaign[]>([]);
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [connectionPhone, setConnectionPhone] = useState('');
  const [contactLines, setContactLines] = useState('');
  const [consentSource, setConsentSource] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const eligibleContacts = useMemo(() => contacts.filter(contact => !contact.optedOutAt), [contacts]);

  const refreshConnections = useCallback(async () => {
    try {
      const data = await apiRequest<{ connections: WhatsAppConnection[] }>(API_ENDPOINTS.BAILEYS_CONNECTIONS);
      const nextConnections = data.connections || [];
      setConnections(nextConnections);
      const qrCandidates = nextConnections.filter(connection => ['starting', 'connecting', 'qr_ready'].includes(connection.status));
      const qrResults = await Promise.all(qrCandidates.map(async connection => {
        try {
          const qr = await apiRequest<{ status: string; qrDataUrl?: string }>(API_ENDPOINTS.BAILEYS_CONNECTION_QR(connection.id));
          return [connection.id, qr.qrDataUrl || null] as const;
        } catch {
          return [connection.id, null] as const;
        }
      }));
      setQrCodes(previous => {
        const current: Record<string, string> = {};
        for (const result of qrResults) {
          if (result?.[1]) current[result[0]] = result[1];
        }
        for (const connection of nextConnections) {
          if (connection.status === 'connected' || connection.status === 'logged_out' || connection.status === 'failed') {
            delete current[connection.id];
          } else if (connection.status === 'starting' && !current[connection.id] && previous[connection.id]) {
            current[connection.id] = previous[connection.id];
          }
        }
        return current;
      });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not refresh WhatsApp connections.' });
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [contactData, campaignData, connectionData] = await Promise.all([
        apiRequest<{ contacts: BulkContact[] }>(API_ENDPOINTS.BULK_CONTACTS),
        apiRequest<{ campaigns: BulkCampaign[] }>(API_ENDPOINTS.BULK_CAMPAIGNS),
        apiRequest<{ connections: WhatsAppConnection[] }>(API_ENDPOINTS.BAILEYS_CONNECTIONS),
      ]);
      setContacts(contactData.contacts || []);
      setCampaigns(campaignData.campaigns || []);
      setConnections(connectionData.connections || []);
      await refreshConnections();
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not load bulk messaging data.' });
    } finally {
      setLoading(false);
    }
  }, [refreshConnections]);

  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => {
    const timer = window.setInterval(() => { void refreshConnections(); }, 2500);
    return () => window.clearInterval(timer);
  }, [refreshConnections]);

  const startConnection = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      await apiRequest(API_ENDPOINTS.BAILEYS_CONNECTIONS, {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: connectionPhone.trim() }),
      });
      setConnectionPhone('');
      setNotice({ kind: 'success', text: 'Connection started. Scan its QR code with the WhatsApp app registered to this number.' });
      await refreshConnections();
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not start WhatsApp connection.' });
    } finally {
      setBusy(false);
    }
  };

  const disconnectNumber = async (connection: WhatsAppConnection) => {
    if (!window.confirm(`Disconnect ${connection.phoneNumber} and remove its saved session?`)) return;
    setBusy(true);
    try {
      await apiRequest(API_ENDPOINTS.BAILEYS_DISCONNECT(connection.id), { method: 'DELETE' });
      setQrCodes(current => {
        const next = { ...current };
        delete next[connection.id];
        return next;
      });
      setNotice({ kind: 'success', text: `${connection.phoneNumber} disconnected.` });
      await loadData();
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not disconnect this number.' });
    } finally {
      setBusy(false);
    }
  };

  const importContacts = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = contactLines.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
      const [phoneNumber, ...nameParts] = line.split(',');
      return { phoneNumber: phoneNumber.trim(), name: nameParts.join(',').trim(), consentSource: consentSource.trim(), optedIn: true };
    });
    if (!parsed.length) {
      setNotice({ kind: 'error', text: 'Paste at least one contact, one phone number per line.' });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const result = await apiRequest<{ count: number }>(API_ENDPOINTS.BULK_CONTACT_IMPORT, {
        method: 'POST',
        body: JSON.stringify({ contacts: parsed, consentConfirmed }),
      });
      setContactLines('');
      setSelectedIds([]);
      setNotice({ kind: 'success', text: `${result.count} opted-in contact${result.count === 1 ? '' : 's'} saved.` });
      await loadData();
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Contact import failed.' });
    } finally {
      setBusy(false);
    }
  };

  const createDraft = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      await apiRequest(API_ENDPOINTS.BULK_CAMPAIGNS, {
        method: 'POST',
        body: JSON.stringify({ name: campaignName, messageText, imageUrl, contactIds: selectedIds }),
      });
      setCampaignName('');
      setMessageText('');
      setImageUrl('');
      setNotice({ kind: 'success', text: 'Campaign draft saved. It has not been sent.' });
      await loadData();
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not save campaign draft.' });
    } finally {
      setBusy(false);
    }
  };

  const optOutContact = async (phoneNumber: string) => {
    setBusy(true);
    try {
      await apiRequest(API_ENDPOINTS.BULK_CONTACT_OPTOUT, {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      });
      setSelectedIds(current => current.filter(id => contacts.find(contact => contact.id === id)?.phoneNumber !== phoneNumber));
      setNotice({ kind: 'success', text: `${phoneNumber} is suppressed from future drafts.` });
      await loadData();
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not suppress this contact.' });
    } finally {
      setBusy(false);
    }
  };

  const toggleContact = (id: string) => setSelectedIds(current => current.includes(id)
    ? current.filter(selected => selected !== id)
    : [...current, id]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk WhatsApp</h1>
            <p className="mt-1 text-gray-600">Manage opted-in contacts and prepare campaign drafts.</p>
          </div>
          <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription>
            Sending is not enabled yet. These drafts are not sent, and only contacts with recorded opt-in and no opt-out can be selected.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Connect WhatsApp numbers with Baileys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-gray-600">
              First register each dedicated BBNSMS line in WhatsApp or WhatsApp Business using its verification code. Then scan the QR below from that account: WhatsApp → Linked Devices → Link a Device. Keep each line active so you can receive future verification codes.
            </p>
            <form onSubmit={startConnection} className="flex flex-wrap items-end gap-3">
              <div className="min-w-64 flex-1">
                <Label htmlFor="connection-phone">Dedicated number (international format)</Label>
                <Input id="connection-phone" value={connectionPhone} onChange={event => setConnectionPhone(event.target.value)} placeholder="+12025550123" />
              </div>
              <Button type="submit" disabled={busy || !connectionPhone.trim() || connections.filter(connection => !['logged_out', 'disconnected', 'failed'].includes(connection.status)).length >= 5}>
                Connect number
              </Button>
            </form>
            <div className="grid gap-4 md:grid-cols-2">
              {connections.map(connection => (
                <div key={connection.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{connection.phoneNumber}</p>
                      <p className="mt-1 text-sm capitalize text-gray-600">{connection.status.replace(/_/g, ' ')}</p>
                    </div>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => void disconnectNumber(connection)}>Disconnect</Button>
                  </div>
                  {qrCodes[connection.id] && (
                    <div className="mt-4 flex flex-col items-center rounded-md bg-white p-3">
                      <img src={qrCodes[connection.id]} alt={`WhatsApp linking QR for ${connection.phoneNumber}`} className="h-56 w-56" />
                      <p className="mt-2 text-center text-xs text-gray-500">QR refreshes automatically. Scan it from the WhatsApp account for this number.</p>
                    </div>
                  )}
                  {connection.status === 'connected' && <p className="mt-3 text-sm text-green-700">Linked device is online.</p>}
                  {connection.status === 'logged_out' && <p className="mt-3 text-sm text-amber-700">WhatsApp logged this linked device out. Disconnect this entry and connect again to scan a new QR.</p>}
                  {connection.lastError && <p className="mt-3 text-sm text-red-600">{connection.lastError}</p>}
                </div>
              ))}
            </div>
            {connections.length === 0 && <p className="text-sm text-gray-500">No WhatsApp numbers connected yet. Up to five connections are enabled per account.</p>}
          </CardContent>
        </Card>

        {notice && (
          <Alert variant={notice.kind === 'error' ? 'destructive' : 'default'}>
            {notice.kind === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertDescription>{notice.text}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Import opted-in contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={importContacts} className="space-y-4">
                <div>
                  <Label htmlFor="contact-lines">Phone number, optional name (one per line)</Label>
                  <Textarea id="contact-lines" value={contactLines} onChange={event => setContactLines(event.target.value)} rows={7} placeholder={'+255712345678, Amina\n+255713456789, Juma'} />
                </div>
                <div>
                  <Label htmlFor="consent-source">Where/how did they opt in?</Label>
                  <Input id="consent-source" value={consentSource} onChange={event => setConsentSource(event.target.value)} maxLength={500} placeholder="e.g. website signup form, 2026-09" />
                </div>
                <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
                  <input className="mt-1" type="checkbox" checked={consentConfirmed} onChange={event => setConsentConfirmed(event.target.checked)} />
                  <span>I confirm every imported person explicitly agreed to receive WhatsApp messages from this business.</span>
                </label>
                <Button type="submit" disabled={busy || !consentConfirmed || !contactLines.trim() || !consentSource.trim()}>
                  Import contacts
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Create a campaign draft</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createDraft} className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign name</Label>
                  <Input id="campaign-name" value={campaignName} onChange={event => setCampaignName(event.target.value)} maxLength={100} placeholder="June product update" />
                </div>
                <div>
                  <Label htmlFor="campaign-message">Message</Label>
                  <Textarea id="campaign-message" value={messageText} onChange={event => setMessageText(event.target.value)} maxLength={4096} rows={4} placeholder="Write your message..." />
                </div>
                <div>
                  <Label htmlFor="campaign-image">Image URL (optional)</Label>
                  <div className="relative">
                    <ImagePlus className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="campaign-image" className="pl-9" value={imageUrl} onChange={event => setImageUrl(event.target.value)} type="url" placeholder="https://... (public image URL)" />
                  </div>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                  <div className="mb-2 flex items-center justify-between text-sm font-medium">
                    <span>Recipients</span><span>{selectedIds.length} selected</span>
                  </div>
                  {eligibleContacts.length === 0 ? <p className="text-sm text-gray-500">Import opted-in contacts to select recipients.</p> : eligibleContacts.map(contact => (
                    <label key={contact.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" checked={selectedIds.includes(contact.id)} onChange={() => toggleContact(contact.id)} />
                      <span className="min-w-0 flex-1 truncate">{contact.displayName || contact.phoneNumber} {contact.displayName ? <span className="text-gray-500">({contact.phoneNumber})</span> : ''}</span>
                    </label>
                  ))}
                </div>
                <Button type="submit" disabled={busy || selectedIds.length === 0 || (!messageText.trim() && !imageUrl.trim())}>
                  Save draft
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Contacts ({contacts.length})</CardTitle></CardHeader>
          <CardContent>
            {contacts.length === 0 ? <p className="text-sm text-gray-500">No contacts imported yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b text-gray-500"><th className="py-2 pr-4">Contact</th><th className="py-2 pr-4">Consent source</th><th className="py-2 pr-4">Status</th><th className="py-2">Action</th></tr></thead>
                  <tbody>{contacts.map(contact => (
                    <tr key={contact.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">{contact.displayName || contact.phoneNumber}<div className="text-xs text-gray-500">{contact.displayName ? contact.phoneNumber : ''}</div></td>
                      <td className="py-3 pr-4">{contact.consentSource}</td>
                      <td className="py-3 pr-4">{contact.optedOutAt ? <span className="text-red-600">Opted out</span> : <span className="text-green-700">Opted in</span>}</td>
                      <td className="py-3">{!contact.optedOutAt && <Button size="sm" variant="outline" disabled={busy} onClick={() => void optOutContact(contact.phoneNumber)}>Suppress</Button>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Campaign drafts ({campaigns.length})</CardTitle></CardHeader>
          <CardContent>
            {campaigns.length === 0 ? <p className="text-sm text-gray-500">Campaign drafts will appear here.</p> : (
              <div className="space-y-3">{campaigns.map(campaign => (
                <div key={campaign.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                  <div className="min-w-0">
                    <p className="font-medium">{campaign.name}</p>
                    <p className="mt-1 truncate text-sm text-gray-500">{campaign.messageText || 'Image campaign'}{campaign.imageUrl ? ' · Image attached' : ''}</p>
                    <p className="mt-1 text-xs text-gray-500">{new Date(campaign.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right text-sm"><span className="rounded-full bg-gray-100 px-2 py-1">Draft</span><p className="mt-2 text-gray-500">{campaign.totalRecipients} recipients</p></div>
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
