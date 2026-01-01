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
import { Save, Plus, X, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // AI Settings
  const [businessDescription, setBusinessDescription] = useState('');
  const [tone, setTone] = useState('friendly');
  const [sampleReplies, setSampleReplies] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  
  // Support Contact
  const [supportName, setSupportName] = useState('');
  const [supportPhone, setSupportPhone] = useState('');

  // API Credentials
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');
  const [bypassClaude, setBypassClaude] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);

  // Fetch business settings on mount
  useEffect(() => {
    fetchBusinessSettings();
    fetchUserCredentials();
  }, []);

  const fetchUserCredentials = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.USER_CREDENTIALS, {
        headers: {
          'x-user-id': user?.id || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.hasCredentials) {
          setHasCredentials(true);
          setTwilioPhoneNumber(data.twilioPhoneNumber || '');
          setBypassClaude(data.bypassClaude || false);
          // Don't set API keys - they're masked
        }
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
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
        setBusinessDescription(data.businessDescription || '');
        setTone(data.tone || 'friendly');
        setSampleReplies(data.sampleReplies || []);
        setKeywords(data.keywords || []);
        setSupportName(data.supportName || '');
        setSupportPhone(data.supportPhone || '');
      }
    } catch (error) {
      console.error('Failed to fetch business settings:', error);
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

  const handleSaveCredentials = async () => {
    setSaving(true);
    try {
      const response = await fetch(API_ENDPOINTS.USER_CREDENTIALS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          claudeApiKey,
          twilioAccountSid,
          twilioAuthToken,
          twilioPhoneNumber,
          businessContext: businessDescription,
          bypassClaude
        }),
      });

      if (response.ok) {
        setHasCredentials(true);
        toast({
          title: "Success",
          description: "API credentials saved successfully",
        });
        // Clear sensitive fields after saving
        setClaudeApiKey('');
        setTwilioAccountSid('');
        setTwilioAuthToken('');
      } else {
        throw new Error('Failed to save credentials');
      }
    } catch (error) {
      console.error('Failed to save credentials:', error);
      toast({
        title: "Error",
        description: "Failed to save credentials",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAI = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.BUSINESS_SETTINGS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({
          businessDescription,
          tone,
          sampleReplies,
          keywords,
          supportName,
          supportPhone,
        }),
      });

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Your AI personality settings have been updated successfully.",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
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

          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    🔐 API Credentials
                    {hasCredentials && (
                      <Badge variant="default" className="bg-green-500">Configured</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Configure your own Twilio and Claude AI API credentials for personalized service
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Multi-User Support:</strong> Each user can now configure their own API credentials. 
                  Your credentials are encrypted and stored securely.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claudeApiKey">Claude API Key</Label>
                <Input
                  id="claudeApiKey"
                  type="password"
                  value={claudeApiKey}
                  onChange={(e) => setClaudeApiKey(e.target.value)}
                  placeholder={hasCredentials ? "****...configured" : "sk-ant-api03-..."}
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Anthropic Console</a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilioAccountSid">Twilio Account SID</Label>
                <Input
                  id="twilioAccountSid"
                  type="password"
                  value={twilioAccountSid}
                  onChange={(e) => setTwilioAccountSid(e.target.value)}
                  placeholder={hasCredentials ? "****...configured" : "AC..."}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilioAuthToken">Twilio Auth Token</Label>
                <Input
                  id="twilioAuthToken"
                  type="password"
                  value={twilioAuthToken}
                  onChange={(e) => setTwilioAuthToken(e.target.value)}
                  placeholder={hasCredentials ? "****...configured" : "Enter auth token"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilioPhoneNumber">Twilio WhatsApp Number</Label>
                <Input
                  id="twilioPhoneNumber"
                  value={twilioPhoneNumber}
                  onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                  placeholder="+255793531101"
                />
                <p className="text-xs text-muted-foreground">
                  Your Twilio WhatsApp-enabled phone number (with country code)
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="bypassClaude"
                  checked={bypassClaude}
                  onChange={(e) => setBypassClaude(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <Label htmlFor="bypassClaude" className="font-normal cursor-pointer">
                  Bypass Claude AI (send canned responses instead)
                </Label>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSaveCredentials}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : hasCredentials ? 'Update Credentials' : 'Save Credentials'}
                </Button>
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
