import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, Users, Calendar, CheckCircle, AlertCircle, Phone, Mail, Link, Unlink } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type WhatsAppDiagnostic = {
  id: string;
  time: string;
  level: 'info' | 'success' | 'error';
  step: string;
  message: string;
  endpoint?: string;
  httpStatus?: number;
  sessionTokenPresent?: boolean;
};

const WHATSAPP_DIAGNOSTICS_KEY = 'whatsapp_connection_diagnostics';

type FacebookLoginResponse = {
  authResponse?: { code?: string };
  status?: string;
};

type FacebookSdk = {
  init: (options: { appId: string; autoLogAppEvents: boolean; xfbml: boolean; version: string }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: Record<string, unknown>,
  ) => void;
};

type MetaSignupConfig = { appId: string; configId: string; graphApiVersion: string };

type MetaSignupSession = {
  wabaId: string;
  phoneNumberId: string;
  event: string;
};

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

let facebookSdkAppId = '';

function loadFacebookSdk(appId: string, graphApiVersion: string): Promise<FacebookSdk> {
  if (window.FB && facebookSdkAppId === appId) return Promise.resolve(window.FB);
  if (window.FB) {
    window.FB.init({ appId, autoLogAppEvents: true, xfbml: true, version: graphApiVersion });
    facebookSdkAppId = appId;
    return Promise.resolve(window.FB);
  }

  return new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      if (!window.FB) {
        reject(new Error('Facebook SDK loaded without initializing. Refresh and try again.'));
        return;
      }
      window.FB.init({ appId, autoLogAppEvents: true, xfbml: true, version: graphApiVersion });
      facebookSdkAppId = appId;
      resolve(window.FB);
    };

    let script = document.getElementById('facebook-jssdk') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.onerror = () => reject(new Error('Could not load Facebook Login. Check the browser network/ad-blocker and retry.'));
      document.head.appendChild(script);
    }
  });
}

function loadWhatsAppDiagnostics(): WhatsAppDiagnostic[] {
  try {
    const saved = localStorage.getItem(WHATSAPP_DIAGNOSTICS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState({
    totalMessages: 0,
    aiReplies: 0,
    activeConversations: 0,
    totalBookings: 0,
    pendingBookings: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [whatsappStatus, setWhatsappStatus] = useState<{ connected: boolean; phone?: string | null; wabaId?: string | null }>({ connected: false });
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [whatsappDiagnostics, setWhatsappDiagnostics] = useState<WhatsAppDiagnostic[]>(loadWhatsAppDiagnostics);
  const [whatsappSignupReady, setWhatsappSignupReady] = useState(false);
  const [whatsappSignupMode, setWhatsappSignupMode] = useState<'cloud_api' | 'business_app'>('cloud_api');
  const signupConfigRef = useRef<MetaSignupConfig | null>(null);
  const signupCodeRef = useRef<string | null>(null);
  const signupSessionRef = useRef<MetaSignupSession | null>(null);
  const signupCompletionStartedRef = useRef(false);
  const completeSignupRef = useRef<(code: string, session: MetaSignupSession) => Promise<void>>(async () => undefined);

  const recordWhatsAppDiagnostic = useCallback((entry: Omit<WhatsAppDiagnostic, 'id' | 'time'>) => {
    const diagnostic: WhatsAppDiagnostic = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      time: new Date().toISOString(),
    };
    setWhatsappDiagnostics(previous => {
      const next = [diagnostic, ...previous].slice(0, 20);
      try {
        localStorage.setItem(WHATSAPP_DIAGNOSTICS_KEY, JSON.stringify(next));
      } catch (error) {
        console.warn('Could not persist WhatsApp connection diagnostics:', error);
      }
      return next;
    });
  }, []);

  const fetchWhatsappStatus = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      const message = 'No Chati login token was found in this browser. Sign out, sign in again, then retry.';
      setWaError(message);
      recordWhatsAppDiagnostic({
        level: 'error',
        step: 'Check WhatsApp status',
        message,
        endpoint: API_ENDPOINTS.META_STATUS,
        sessionTokenPresent: false,
      });
      return;
    }
    try {
      const res = await fetch(API_ENDPOINTS.META_STATUS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.error || `Status request failed (HTTP ${res.status})`;
        setWaError(message);
        recordWhatsAppDiagnostic({
          level: 'error',
          step: 'Check WhatsApp status',
          message,
          endpoint: res.url || API_ENDPOINTS.META_STATUS,
          httpStatus: res.status,
          sessionTokenPresent: true,
        });
        return;
      }

      setWhatsappStatus(data);
      if (data.connected) {
        setWaError(null);
        recordWhatsAppDiagnostic({
          level: 'success',
          step: 'Verify WhatsApp connection',
          message: `Connected${data.phone ? `: ${data.phone}` : ''}`,
          endpoint: res.url || API_ENDPOINTS.META_STATUS,
          httpStatus: res.status,
          sessionTokenPresent: true,
        });
      } else if (data.error) {
        setWaError(`WhatsApp not connected: ${data.error}`);
        recordWhatsAppDiagnostic({
          level: 'error',
          step: 'Verify WhatsApp connection',
          message: data.error,
          endpoint: res.url || API_ENDPOINTS.META_STATUS,
          httpStatus: res.status,
          sessionTokenPresent: true,
        });
      } else {
        recordWhatsAppDiagnostic({
          level: 'info',
          step: 'Check WhatsApp status',
          message: 'No WhatsApp Business account is connected to this workspace yet.',
          endpoint: res.url || API_ENDPOINTS.META_STATUS,
          httpStatus: res.status,
          sessionTokenPresent: true,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error while checking WhatsApp status';
      setWaError(message);
      recordWhatsAppDiagnostic({
        level: 'error',
        step: 'Check WhatsApp status',
        message,
        endpoint: API_ENDPOINTS.META_STATUS,
        sessionTokenPresent: true,
      });
    }
  }, [recordWhatsAppDiagnostic]);

  const completeMetaSignup = useCallback(async (code: string, session: MetaSignupSession) => {
    if (signupCompletionStartedRef.current) return;
    signupCompletionStartedRef.current = true;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      const message = 'Your Chati login expired before Meta signup could be saved. Sign in again and reconnect.';
      setWaError(message);
      recordWhatsAppDiagnostic({
        level: 'error',
        step: 'Save Meta signup',
        message,
        endpoint: API_ENDPOINTS.META_COMPLETE_SIGNUP,
        sessionTokenPresent: false,
      });
      signupCompletionStartedRef.current = false;
      setWhatsappLoading(false);
      return;
    }

    setWhatsappLoading(true);
    recordWhatsAppDiagnostic({
      level: 'info',
      step: 'Save Meta signup',
      message: `Meta returned a signup code and selected WhatsApp assets (${session.event}). Exchanging the code and saving this workspace now.`,
      endpoint: API_ENDPOINTS.META_COMPLETE_SIGNUP,
      sessionTokenPresent: true,
    });

    try {
      const res = await fetch(API_ENDPOINTS.META_COMPLETE_SIGNUP, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          wabaId: session.wabaId,
          phoneNumberId: session.phoneNumberId,
          event: session.event,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.error || `Chati could not save the Meta signup (HTTP ${res.status})`;
        setWaError(message);
        recordWhatsAppDiagnostic({
          level: 'error',
          step: 'Save Meta signup',
          message,
          endpoint: res.url || API_ENDPOINTS.META_COMPLETE_SIGNUP,
          httpStatus: res.status,
          sessionTokenPresent: true,
        });
        return;
      }

      setWhatsappStatus({ connected: true, phone: data.phone, wabaId: data.wabaId });
      setWaError(null);
      recordWhatsAppDiagnostic({
        level: 'success',
        step: 'Save Meta signup',
        message: `WhatsApp account saved to this workspace${data.phone ? ` (${data.phone})` : ''}.`,
        endpoint: res.url || API_ENDPOINTS.META_COMPLETE_SIGNUP,
        httpStatus: res.status,
        sessionTokenPresent: true,
      });
      await fetchWhatsappStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error while saving the Meta signup';
      setWaError(message);
      recordWhatsAppDiagnostic({
        level: 'error',
        step: 'Save Meta signup',
        message,
        endpoint: API_ENDPOINTS.META_COMPLETE_SIGNUP,
        sessionTokenPresent: true,
      });
    } finally {
      signupCodeRef.current = null;
      signupSessionRef.current = null;
      signupCompletionStartedRef.current = false;
      setWhatsappLoading(false);
    }
  }, [fetchWhatsappStatus, recordWhatsAppDiagnostic]);

  completeSignupRef.current = completeMetaSignup;

  const prepareWhatsAppSignup = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const res = await fetch(API_ENDPOINTS.META_SIGNUP_CONFIG, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const config = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(config.error || `Could not load Meta signup settings (HTTP ${res.status})`);
      }
      if (!config.appId || !config.configId || !config.graphApiVersion) {
        throw new Error('Meta signup settings are incomplete. Check the backend app/configuration IDs.');
      }
      const sdk = await loadFacebookSdk(config.appId, config.graphApiVersion);
      signupConfigRef.current = config;
      if (!sdk) throw new Error('Facebook Login SDK is unavailable.');
      setWhatsappSignupReady(true);
      recordWhatsAppDiagnostic({
        level: 'success',
        step: 'Prepare Meta signup',
        message: 'Meta Embedded Signup v4 is ready in this dashboard.',
        endpoint: res.url || API_ENDPOINTS.META_SIGNUP_CONFIG,
        httpStatus: res.status,
        sessionTokenPresent: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not prepare Meta signup';
      setWaError(message);
      recordWhatsAppDiagnostic({
        level: 'error',
        step: 'Prepare Meta signup',
        message,
        endpoint: API_ENDPOINTS.META_SIGNUP_CONFIG,
        sessionTokenPresent: true,
      });
    }
  }, [recordWhatsAppDiagnostic]);

  useEffect(() => {
    if (user?.id) void prepareWhatsAppSignup();
  }, [user?.id, prepareWhatsAppSignup]);

  useEffect(() => {
    const handleMetaSignupMessage = (messageEvent: MessageEvent) => {
      let hostname = '';
      try {
        hostname = new URL(messageEvent.origin).hostname;
      } catch {
        return;
      }
      if (hostname !== 'facebook.com' && !hostname.endsWith('.facebook.com')) return;

      try {
        const payload = typeof messageEvent.data === 'string'
          ? JSON.parse(messageEvent.data)
          : messageEvent.data;
        if (payload?.type !== 'WA_EMBEDDED_SIGNUP') return;

        const eventName = String(payload.event || payload.data?.event || 'UNKNOWN');
        const data = payload.data || {};
        if (eventName === 'ERROR') {
          const message = data.error_message || data.error || 'Meta reported an error in the signup flow.';
          setWaError(message);
          setWhatsappLoading(false);
          signupCodeRef.current = null;
          signupSessionRef.current = null;
          recordWhatsAppDiagnostic({ level: 'error', step: 'Meta signup flow', message });
          return;
        }

        const wabaId = String(data.waba_id || data.wabaId || '');
        const phoneNumberId = String(data.phone_number_id || data.phoneNumberId || '');
        if (!wabaId || !phoneNumberId) {
          const message = eventName === 'FINISH_ONLY_WABA'
            ? 'Meta created or selected a WhatsApp Business Account, but no phone number was selected. Restart signup and complete phone setup.'
            : 'Meta returned a completion event without the WABA ID and phone number ID. Check the selected Meta flow/configuration.';
          setWaError(message);
          setWhatsappLoading(false);
          recordWhatsAppDiagnostic({ level: 'error', step: 'Read Meta signup result', message });
          return;
        }

        const session: MetaSignupSession = { wabaId, phoneNumberId, event: eventName };
        signupSessionRef.current = session;
        recordWhatsAppDiagnostic({
          level: 'success',
          step: 'Read Meta signup result',
          message: `Meta selected a WABA and phone number (${eventName}); waiting for its authorization code.`,
        });
        if (signupCodeRef.current) {
          void completeSignupRef.current(signupCodeRef.current, session);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not read Meta signup result';
        setWaError(message);
        recordWhatsAppDiagnostic({ level: 'error', step: 'Read Meta signup result', message });
      }
    };

    window.addEventListener('message', handleMetaSignupMessage);
    return () => window.removeEventListener('message', handleMetaSignupMessage);
  }, [recordWhatsAppDiagnostic]);

  // Check URL params for OAuth callback result
  useEffect(() => {
    const waParam = searchParams.get('whatsapp');
    if (waParam === 'connected') {
      recordWhatsAppDiagnostic({
        level: 'success',
        step: 'Return from Meta signup',
        message: 'Meta returned to Chati and reported signup completion. Checking the saved phone connection now.',
      });
      fetchWhatsappStatus();
    } else if (waParam === 'error') {
      const reason = searchParams.get('reason') || 'Unknown error';
      setWaError(`WhatsApp connection failed: ${reason}`);
      recordWhatsAppDiagnostic({
        level: 'error',
        step: 'Return from Meta signup',
        message: reason,
      });
    }
  }, [searchParams, fetchWhatsappStatus, recordWhatsAppDiagnostic]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
      fetchWhatsappStatus();
      const interval = setInterval(fetchDashboardData, 10000);
      return () => clearInterval(interval);
    }
  }, [user?.id, fetchWhatsappStatus]);

  const handleConnectWhatsApp = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      const message = 'Please sign in again before connecting WhatsApp. No Chati login token was found in this browser.';
      setWaError(message);
      recordWhatsAppDiagnostic({
        level: 'error',
        step: 'Start Meta signup',
        message,
        endpoint: API_ENDPOINTS.META_AUTH_URL,
        sessionTokenPresent: false,
      });
      return;
    }
    const config = signupConfigRef.current;
    const sdk = window.FB;
    if (!config || !sdk || !whatsappSignupReady) {
      const message = 'Meta Embedded Signup is still loading. Wait a moment and retry.';
      setWaError(message);
      recordWhatsAppDiagnostic({
        level: 'error',
        step: 'Start Meta signup',
        message,
        endpoint: API_ENDPOINTS.META_SIGNUP_CONFIG,
        sessionTokenPresent: true,
      });
      return;
    }

    signupCodeRef.current = null;
    signupSessionRef.current = null;
    signupCompletionStartedRef.current = false;
    setWhatsappLoading(true);
    setWaError(null);
    recordWhatsAppDiagnostic({
      level: 'info',
      step: 'Start Meta signup',
      message: whatsappSignupMode === 'cloud_api'
        ? 'Opening Cloud API signup for a new or virtual number.'
        : 'Opening coexistence signup for an existing WhatsApp Business app number.',
      endpoint: API_ENDPOINTS.META_SIGNUP_CONFIG,
      sessionTokenPresent: true,
    });
    try {
      sdk.login((response) => {
        const code = response.authResponse?.code;
        if (!code) {
          const message = `Meta did not return an authorization code${response.status ? ` (status: ${response.status})` : ''}. The flow may have been cancelled or blocked.`;
          setWaError(message);
          setWhatsappLoading(false);
          recordWhatsAppDiagnostic({
            level: 'error',
            step: 'Meta authorization',
            message,
            endpoint: 'Facebook Login for Business SDK',
            sessionTokenPresent: !!localStorage.getItem('auth_token'),
          });
          return;
        }

        signupCodeRef.current = code;
        recordWhatsAppDiagnostic({
          level: 'success',
          step: 'Meta authorization',
          message: 'Meta returned a short-lived authorization code. Waiting for the selected WhatsApp account details.',
          endpoint: 'Facebook Login for Business SDK',
          sessionTokenPresent: !!localStorage.getItem('auth_token'),
        });
        if (signupSessionRef.current) {
          void completeSignupRef.current(code, signupSessionRef.current);
        } else {
          window.setTimeout(() => {
            if (signupCodeRef.current === code && !signupSessionRef.current && !signupCompletionStartedRef.current) {
              const message = 'Meta returned an authorization code but no WhatsApp account/phone details. Confirm the Embedded Signup configuration returns session information and retry.';
              setWaError(message);
              setWhatsappLoading(false);
              recordWhatsAppDiagnostic({ level: 'error', step: 'Read Meta signup result', message });
            }
          }, 8000);
        }
      }, {
        config_id: config.configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: whatsappSignupMode === 'business_app'
          ? {
            version: 'v4',
            sessionInfoVersion: '3',
            featureType: 'whatsapp_business_app_onboarding',
          }
          : { version: 'v4', sessionInfoVersion: '3' },
      });
    } catch (err: any) {
      const message = err.message || 'Failed to start WhatsApp connection';
      setWaError(message);
      recordWhatsAppDiagnostic({
        level: 'error',
        step: 'Start Meta signup',
        message,
        endpoint: 'Facebook Login for Business SDK',
        sessionTokenPresent: true,
      });
      setWhatsappLoading(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setWaError('Please sign in again before disconnecting WhatsApp.');
      return;
    }
    setWhatsappLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.META_DISCONNECT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setWhatsappStatus({ connected: false });
        recordWhatsAppDiagnostic({
          level: 'success',
          step: 'Disconnect WhatsApp',
          message: 'WhatsApp was disconnected from this workspace.',
          endpoint: res.url || API_ENDPOINTS.META_DISCONNECT,
          httpStatus: res.status,
          sessionTokenPresent: true,
        });
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to disconnect');
      }
    } catch (err: any) {
      const message = err.message || 'Failed to disconnect WhatsApp';
      setWaError(message);
      recordWhatsAppDiagnostic({
        level: 'error',
        step: 'Disconnect WhatsApp',
        message,
        endpoint: API_ENDPOINTS.META_DISCONNECT,
        sessionTokenPresent: !!localStorage.getItem('auth_token'),
      });
    } finally {
      setWhatsappLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    
    try {
      // Fetch conversations
      const conversationsRes = await fetch(API_ENDPOINTS.CONVERSATIONS, {
        headers: { 'x-user-id': user.id }
      });
      const conversations = conversationsRes.ok ? await conversationsRes.json() : [];

      // Fetch bookings
      const bookingsRes = await fetch(API_ENDPOINTS.BOOKINGS, {
        headers: { 'x-user-id': user.id }
      });
      const bookings = bookingsRes.ok ? await bookingsRes.json() : [];

      // Calculate stats from actual conversation data
      const totalMessages = conversations.reduce((sum: number, conv: any) => 
        sum + (conv.messages?.length || 0), 0
      );
      const aiReplies = conversations.reduce((sum: number, conv: any) => 
        sum + (conv.messages?.filter((msg: any) => msg.sender === 'ai').length || 0), 0
      );
      const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;

      setStats({
        totalMessages,
        aiReplies,
        activeConversations: conversations.length,
        totalBookings: bookings.length,
        pendingBookings,
      });

      // Get recent activity from conversations (last 5)
      const activity = conversations
        .slice(0, 5)
        .map((conv: any) => ({
          customer: conv.customerName || conv.customerNumber,
          phone: conv.customerNumber,
          message: conv.lastMessage || 'New conversation',
          time: conv.timestamp || 'Just now',
          status: 'active'
        }));

      setRecentActivity(activity);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your AI assistant's performance
          </p>
        </div>

        {/* WhatsApp Connection Error Alert */}
        {waError && (
          <Alert className="border-2 border-red-500 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-sm font-bold text-red-900">WhatsApp Connection</AlertTitle>
            <AlertDescription className="text-red-800 text-sm">
              {waError}
            </AlertDescription>
          </Alert>
        )}

        {/* WhatsApp Connection Card */}
        <Card className={whatsappStatus.connected ? 'border-[#25D366] border-2' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#25D366]" />
              WhatsApp Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {whatsappStatus.connected ? (
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#25D366]" />
                    <span className="text-lg font-semibold text-gray-900">WhatsApp Connected</span>
                  </div>
                  {whatsappStatus.phone && (
                    <p className="text-sm text-gray-600">
                      Connected number: <span className="font-mono font-medium">{whatsappStatus.phone}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    WhatsApp Business Account ID: {whatsappStatus.wabaId || '—'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnectWhatsApp}
                  disabled={whatsappLoading}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  {whatsappLoading ? 'Disconnecting...' : 'Disconnect WhatsApp'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Connect your WhatsApp Business account to start chatting with customers through your AI assistant.
                </p>
                <label className="block max-w-xl space-y-1 text-sm">
                  <span className="font-medium text-gray-700">Number setup</span>
                  <select
                    value={whatsappSignupMode}
                    onChange={event => setWhatsappSignupMode(event.target.value as 'cloud_api' | 'business_app')}
                    disabled={whatsappLoading || !whatsappSignupReady}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
                  >
                    <option value="cloud_api">New or virtual number — WhatsApp Cloud API</option>
                    <option value="business_app">Existing number in WhatsApp Business app — coexistence</option>
                  </select>
                  <span className="block text-xs text-gray-500">
                    Virtual numbers must be able to receive Meta’s verification code by SMS or voice. Coexistence is only for a number already active in the WhatsApp Business app.
                  </span>
                </label>
                <Button
                  onClick={handleConnectWhatsApp}
                  disabled={whatsappLoading || !whatsappSignupReady}
                  className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                >
                  <Link className="w-4 h-4 mr-2" />
                  {whatsappLoading ? 'Connecting...' : whatsappSignupReady ? 'Connect WhatsApp' : 'Loading Meta...'}
                </Button>
                <p className="text-xs text-gray-400">
                  You'll be redirected to Meta/Facebook to authorize and select your WhatsApp Business account.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">WhatsApp connection diagnostics</CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                Recent signup and connection checks. Your login token is never shown or saved here.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchWhatsappStatus()}
                disabled={whatsappLoading}
              >
                Check status
              </Button>
              {whatsappDiagnostics.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setWhatsappDiagnostics([]);
                    localStorage.removeItem(WHATSAPP_DIAGNOSTICS_KEY);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {whatsappDiagnostics.length === 0 ? (
              <p className="text-sm text-gray-500">No WhatsApp connection attempts recorded in this browser yet.</p>
            ) : (
              <ol className="max-h-96 space-y-3 overflow-y-auto">
                {whatsappDiagnostics.map(diagnostic => (
                  <li
                    key={diagnostic.id}
                    className={`rounded-md border p-3 ${
                      diagnostic.level === 'error'
                        ? 'border-red-200 bg-red-50'
                        : diagnostic.level === 'success'
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900">{diagnostic.step}</span>
                      <time className="text-xs text-gray-500" dateTime={diagnostic.time}>
                        {new Date(diagnostic.time).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-1 break-words text-sm text-gray-700">{diagnostic.message}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {diagnostic.httpStatus !== undefined && <span>HTTP {diagnostic.httpStatus}</span>}
                      {diagnostic.sessionTokenPresent !== undefined && (
                        <span>Login token: {diagnostic.sessionTokenPresent ? 'present' : 'missing'}</span>
                      )}
                      {diagnostic.endpoint && <span className="break-all">Request: {diagnostic.endpoint}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Payment Required Alert */}
        {!user?.payDate && (
          <Alert className="border-2 border-red-500 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-lg font-bold text-red-900 mb-2">
              Payment Required - Access Limited
            </AlertTitle>
            <AlertDescription className="text-red-800">
              <div className="space-y-3">
                <p className="font-medium">
                  You need to subscribe to a package to get full access to all features.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate('/billing')}
                    className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                  >
                    Subscribe Now
                  </Button>
                  {/* <Button
                    variant="outline"
                    onClick={() => navigate('/payments/settings')}
                  >
                    Configure Payment
                  </Button> */}
                </div>
                <div className="bg-white rounded-lg p-4 space-y-2 border border-red-200">
                  <p className="font-semibold text-red-900 mb-2">Need help? Contact us:</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-red-600" />
                    <a href="tel:+255719958997" className="font-medium hover:underline">
                      +255 719 958 997
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-red-600" />
                    <a href="mailto:chatisolutions@gmail.com" className="font-medium hover:underline">
                      chatisolutions@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">
                Total Messages
              </CardTitle>
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {loading ? '...' : stats.totalMessages}
              </div>
              <p className="text-xs text-blue-700 mt-1">
                All time messages
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-900">
                AI Replies Sent
              </CardTitle>
              <Send className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {loading ? '...' : stats.aiReplies}
              </div>
              <p className="text-xs text-green-700 mt-1">
                Automated responses
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">
                Active Conversations
              </CardTitle>
              <Users className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {loading ? '...' : stats.activeConversations}
              </div>
              <p className="text-xs text-purple-700 mt-1">
                Ongoing customer chats
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-900">
                Total Bookings
              </CardTitle>
              <Calendar className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                {loading ? '...' : stats.totalBookings}
              </div>
              <p className="text-xs text-orange-700 mt-1">
                Via WhatsApp
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Peak Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Avg Messages/Conv</p>
                <p className="text-2xl font-bold text-blue-900">
                  {loading ? '...' : stats.activeConversations > 0 
                    ? Math.round(stats.totalMessages / stats.activeConversations) 
                    : 0}
                </p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">AI Efficiency</p>
                <p className="text-2xl font-bold text-purple-900">
                  {loading ? '...' : stats.aiReplies > 0 ? 'Active' : 'Ready'}
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Booking Rate</p>
                <p className="text-2xl font-bold text-orange-900">
                  {loading ? '...' : stats.activeConversations > 0
                    ? `${Math.round((stats.totalBookings / stats.activeConversations) * 100)}%`
                    : '0%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity yet. Conversations will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.customer}</p>
                      <p className="text-xs text-gray-500">{activity.phone}</p>
                      <p className="text-sm text-gray-600 truncate mt-1">{activity.message}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
