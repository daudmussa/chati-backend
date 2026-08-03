import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Key, Webhook, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PaymentSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState({
    snippeApiKey: '',
    snippeWebhookSecret: '',
    snippeEnabled: false,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.PAYMENT_SETTINGS, {
        headers: { 'x-user-id': user?.id || '' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings({
            snippeApiKey: data.settings.snippeApiKey || '',
            snippeWebhookSecret: data.settings.snippeWebhookSecret || '',
            snippeEnabled: data.settings.snippeEnabled || false,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!settings.snippeApiKey) {
      toast({ title: 'API Key Required', description: 'Please enter your Snippe API key.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.PAYMENT_SETTINGS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast({ title: 'Settings Saved', description: 'Your payment settings have been saved successfully.', variant: 'default' });
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.error || 'Failed to save settings', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your Snippe payment gateway integration
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Get your API credentials from your <a href="https://snippe.sh/dashboard" target="_blank" rel="noopener noreferrer" className="font-medium text-[#25D366] hover:underline">Snippe Dashboard</a>. You need a Snippe merchant account to accept payments.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Snippe API Configuration
            </CardTitle>
            <CardDescription>
              Enter your Snippe API credentials to enable payment processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.snippeApiKey}
                  onChange={(e) => setSettings({ ...settings, snippeApiKey: e.target.value })}
                  placeholder="sn_live_..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your Snippe API key (starts with sn_live_ or sn_test_)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <div className="relative">
                <Input
                  id="webhookSecret"
                  type={showWebhookSecret ? 'text' : 'password'}
                  value={settings.snippeWebhookSecret}
                  onChange={(e) => setSettings({ ...settings, snippeWebhookSecret: e.target.value })}
                  placeholder="whsec_..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                >
                  {showWebhookSecret ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Webhook signing secret (starts with whsec_) - used to verify webhook payloads
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Snippe Payments</Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to pay via Snippe (M-Pesa, Airtel Money, Tigo Pesa, Cards)
                </p>
              </div>
              <Switch
                checked={settings.snippeEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, snippeEnabled: checked })}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Webhook Configuration
            </CardTitle>
            <CardDescription>
              Register this webhook URL in your Snippe Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm break-all">
              {window.location.origin}/api/payment/webhook
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Snippe will send payment status updates to this URL. Make sure your server is publicly accessible.
            </p>
          </CardContent>
        </Card>

        {settings.snippeEnabled && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Snippe payments are enabled. Customers can now pay via mobile money and cards.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
}
