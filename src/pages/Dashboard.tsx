import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, Users, Calendar, CheckCircle, AlertCircle, Phone, Mail, Link, Unlink } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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

  const fetchWhatsappStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(API_ENDPOINTS.META_STATUS, {
        headers: { 'x-user-id': user.id }
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsappStatus(data);
      }
    } catch (err) {
      console.error('Error fetching WhatsApp status:', err);
    }
  }, [user?.id]);

  // Check URL params for OAuth callback result
  useEffect(() => {
    const waParam = searchParams.get('whatsapp');
    if (waParam === 'connected') {
      fetchWhatsappStatus();
    } else if (waParam === 'error') {
      const reason = searchParams.get('reason') || 'Unknown error';
      setWaError(`WhatsApp connection failed: ${decodeURIComponent(reason)}`);
      setTimeout(() => setWaError(null), 8000);
    }
  }, [searchParams, fetchWhatsappStatus]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
      fetchWhatsappStatus();
      const interval = setInterval(fetchDashboardData, 10000);
      return () => clearInterval(interval);
    }
  }, [user?.id, fetchWhatsappStatus]);

  const handleConnectWhatsApp = async () => {
    if (!user?.id) return;
    setWhatsappLoading(true);
    setWaError(null);
    try {
      const res = await fetch(API_ENDPOINTS.META_AUTH_URL, {
        headers: { 'x-user-id': user.id }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get auth URL');
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      setWaError(err.message || 'Failed to start WhatsApp connection');
      setWhatsappLoading(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!user?.id) return;
    setWhatsappLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.META_DISCONNECT, {
        method: 'POST',
        headers: { 'x-user-id': user.id }
      });
      if (res.ok) {
        setWhatsappStatus({ connected: false });
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to disconnect');
      }
    } catch (err: any) {
      setWaError(err.message || 'Failed to disconnect WhatsApp');
      setTimeout(() => setWaError(null), 5000);
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
                <Button
                  onClick={handleConnectWhatsApp}
                  disabled={whatsappLoading}
                  className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                >
                  <Link className="w-4 h-4 mr-2" />
                  {whatsappLoading ? 'Redirecting...' : 'Connect WhatsApp'}
                </Button>
                <p className="text-xs text-gray-400">
                  You'll be redirected to Meta/Facebook to authorize and select your WhatsApp Business account.
                </p>
              </div>
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
                  <Button
                    variant="outline"
                    onClick={() => navigate('/payments/settings')}
                  >
                    Configure Payment
                  </Button>
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
