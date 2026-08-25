import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Save, Plus, X, Loader2, Link2, Unlink, CheckCircle, AlertTriangle } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface WhatsAppStatus {
  connected: boolean;
  phone?: string | null;
  wabaId?: string | null;
  error?: string;
}

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Business Info
  const [businessName, setBusinessName] = useState('');

  // AI Settings
  const [businessDescription, setBusinessDescription] = useState('');
  const [tone, setTone] = useState('friendly');
  const [sampleReplies, setSampleReplies] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  
  // Support Contact
  const [supportName, setSupportName] = useState('');
  const [supportPhone, setSupportPhone] = useState('');

  // WhatsApp Connection
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>({ connected: false });
  const [waToken, setWaToken] = useState('');
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waBusinessId, setWaBusinessId] = useState('');
  const [waLoading, setWaLoading] = useState(false);



  // Fetch business settings on mount
  useEffect(() => {
    if (user?.id) {
      fetchBusinessSettings();
      fetchWhatsAppStatus();
    }
  }, [user?.id]);

  const fetchWhatsAppStatus = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(API_ENDPOINTS.META_STATUS, {
        headers: { 'x-user-id': user.id }
      });
      if (response.ok) {
        const data = await response.json();
        setWhatsappStatus(data);
        if (data.connected) {
          setWaPhoneId(data.phoneNumberId || '');
          setWaBusinessId(data.wabaId || '');
        }
      }
    } catch (error) {
      console.error('Failed to fetch WhatsApp status:', error);
    }
  };

  const handleConnectViaMeta = async () => {
    if (!user?.id) return;
    setWaLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.META_AUTH_URL, {
        headers: { 'x-user-id': user.id }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to start WhatsApp connection');
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to start WhatsApp connection',
        variant: "destructive",
      });
      setWaLoading(false);
    }
  };

  const handleSaveWhatsApp = async () => {
    if (!user?.id) return;
    setWaLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.USER_CREDENTIALS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          wabaAccessToken: waToken,
          wabaPhoneNumberId: waPhoneId,
          wabaBusinessId: waBusinessId,
          wabaVerifyToken: undefined,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save WhatsApp credentials');
      }
      toast({
        title: "WhatsApp credentials saved",
        description: "Refresh the dashboard to see your connection status.",
      });
      setWaToken('');
      await fetchWhatsAppStatus();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to save WhatsApp credentials',
        variant: "destructive",
      });
    } finally {
      setWaLoading(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!user?.id) return;
    setWaLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.META_DISCONNECT, {
        method: 'POST',
        headers: { 'x-user-id': user.id }
      });
      if (response.ok) {
        setWhatsappStatus({ connected: false });
        setWaPhoneId('');
        setWaBusinessId('');
        setWaToken('');
        toast({ title: "WhatsApp disconnected", description: "Your WhatsApp connection has been removed." });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to disconnect WhatsApp',
        variant: "destructive",
      });
    } finally {
      setWaLoading(false);
    }
  };


  const fetchBusinessSettings = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.BUSINESS_SETTINGS, {
        headers: {
          'x-user-id': user?.id || ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[Settings] Fetched business settings:', data);
        setBusinessName(data.businessName || user?.businessName || user?.name || '');
        setBusinessDescription(data.businessDescription || '');
        setTone(data.tone || 'friendly');
        setSampleReplies(data.sampleReplies || []);
        setKeywords(data.keywords || []);
        setSupportName(data.supportName || '');
        setSupportPhone(data.supportPhone || '');
      } else {
        // If API fails, use user's name/businessName as fallback
        console.log('[Settings] Failed to fetch, using user data as fallback');
        setBusinessName(user?.businessName || user?.name || '');
      }
    } catch (error) {
      console.error('Failed to fetch business settings:', error);
      // Use user's name/businessName as fallback
      setBusinessName(user?.businessName || user?.name || '');
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSampleReply = () => {
    setSampleReplies([...sampleReplies, '']);
  };

  const updateSampleReply = (index: number, value: string) => {
    const newReplies = [...sampleReplies];
    newReplies[index] = value;
    setSampleReplies(newReplies);
  };

  const removeSampleReply = (index: number) => {
    if (sampleReplies.length > 2) {
      setSampleReplies(sampleReplies.filter((_, i) => i !== index));
    }
  };


  const handleSaveAI = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      console.log('[Settings] Saving with user ID:', user.id);
      const response = await fetch(API_ENDPOINTS.BUSINESS_SETTINGS, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'x-user-id': user.id 
        },
        body: JSON.stringify({
          businessName,
          businessDescription,
          tone,
          sampleReplies,
          keywords,
          supportName,
          supportPhone,
        }),
      });

      console.log('[Settings] Response status:', response.status);

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Your AI personality settings have been updated successfully.",
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Settings] Error response:', errorData);
        throw new Error(errorData.error || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('[Settings] Save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your AI assistant settings
            </p>
          </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Help the AI understand your business context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Mama Njema Shop"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  rows={5}
                  placeholder="Describe your business, products, and services..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Response Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional & Formal</SelectItem>
                    <SelectItem value="friendly">Friendly & Casual</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                    <SelectItem value="helpful">Helpful & Supportive</SelectItem>
                    <SelectItem value="concise">Concise & Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sample Replies</CardTitle>
                  <CardDescription>
                    Examples of how you want the AI to respond
                  </CardDescription>
                </div>
                <Button onClick={addSampleReply} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sampleReplies.map((reply, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={reply}
                    onChange={(e) => updateSampleReply(index, e.target.value)}
                    placeholder={`Sample reply ${index + 1}`}
                  />
                  {sampleReplies.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSampleReply(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support Contact Information</CardTitle>
              <CardDescription>
                Contact details for redirecting customers when AI can't help
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supportName">Support Contact Name</Label>
                <Input
                  id="supportName"
                  value={supportName}
                  onChange={(e) => setSupportName(e.target.value)}
                  placeholder="e.g., Customer Support Team"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportPhone">WhatsApp Phone Number</Label>
                <Input
                  id="supportPhone"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="e.g., +255123456789"
                />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +255 for Tanzania)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Redirection Keywords</CardTitle>
                  <CardDescription>
                    When customers use these words, they'll be redirected to your support contact
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {keyword}
                    <button
                      onClick={() => setKeywords(keywords.filter((_, i) => i !== index))}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add new keyword..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = e.currentTarget.value.trim();
                    if (value) {
                      setKeywords([...keywords, value]);
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
            </CardContent>
          </Card>

          <Card className={whatsappStatus.connected ? 'border-[#25D366] border-2' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-[#25D366]" />
                    WhatsApp Connection
                  </CardTitle>
                  <CardDescription>
                    Connect your own WhatsApp Business account to chat with customers through your AI assistant.
                  </CardDescription>
                </div>
                {whatsappStatus.connected && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {whatsappStatus.connected ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    Connected number: <span className="font-mono font-medium">{whatsappStatus.phone || waPhoneId || '—'}</span>
                  </p>
                  <p className="text-xs text-gray-400">WABA ID: {whatsappStatus.wabaId || waBusinessId || '—'}</p>
                  <Button
                    variant="outline"
                    onClick={handleDisconnectWhatsApp}
                    disabled={waLoading}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    {waLoading ? 'Working...' : 'Disconnect WhatsApp'}
                  </Button>
                </div>
              ) : (
                <>
                  {whatsappStatus.error && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{whatsappStatus.error}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Recommended: connect automatically through Meta (no tokens to manage).</p>
                    <Button
                      onClick={handleConnectViaMeta}
                      disabled={waLoading}
                      className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      {waLoading ? 'Opening Meta...' : 'Connect via Meta'}
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">or enter credentials manually</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="waToken">WhatsApp Access Token</Label>
                      <Input
                        id="waToken"
                        value={waToken}
                        onChange={(e) => setWaToken(e.target.value)}
                        placeholder="EAA... (Meta WhatsApp access token)"
                      />
                      <p className="text-xs text-muted-foreground">
                        From Meta Developer Dashboard → WhatsApp → API Setup → Generate access token.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="waPhoneId">Phone Number ID</Label>
                      <Input
                        id="waPhoneId"
                        value={waPhoneId}
                        onChange={(e) => setWaPhoneId(e.target.value)}
                        placeholder="e.g., 108123456789123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="waBusinessId">WhatsApp Business Account (WABA) ID</Label>
                      <Input
                        id="waBusinessId"
                        value={waBusinessId}
                        onChange={(e) => setWaBusinessId(e.target.value)}
                        placeholder="e.g., 134567890123456 (optional)"
                      />
                    </div>
                    <Button
                      onClick={handleSaveWhatsApp}
                      disabled={waLoading || !waToken || !waPhoneId}
                      variant="outline"
                      className="w-full"
                    >
                      {waLoading ? 'Saving...' : 'Save WhatsApp Credentials'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveAI}
              disabled={saving}
              className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
        </div>
      )}
    </DashboardLayout>
  );
}
