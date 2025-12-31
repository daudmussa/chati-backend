import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, Users, Calendar, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMessages: 0,
    aiReplies: 0,
    activeConversations: 0,
    totalBookings: 0,
    pendingBookings: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch conversations
      const conversationsRes = await fetch('http://localhost:3000/api/conversations');
      const conversations = conversationsRes.ok ? await conversationsRes.json() : [];

      // Fetch bookings
      const bookingsRes = await fetch('http://localhost:3000/api/bookings');
      const bookings = bookingsRes.ok ? await bookingsRes.json() : [];

      // Calculate stats
      const totalMessages = conversations.reduce((sum: number, conv: any) => sum + conv.messages.length, 0);
      const aiReplies = conversations.reduce((sum: number, conv: any) => 
        sum + conv.messages.filter((msg: any) => msg.sender === 'ai').length, 0
      );
      const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;

      setStats({
        totalMessages,
        aiReplies,
        activeConversations: conversations.length,
        totalBookings: bookings.length,
        pendingBookings,
      });

      // Get recent activity from conversations (last 5 messages)
      const activity = conversations
        .filter((conv: any) => conv.messages.length > 0)
        .map((conv: any) => ({
          customer: conv.customerName,
          phone: conv.customerNumber,
          message: conv.lastMessage,
          time: conv.timestamp,
          status: 'replied'
        }))
        .slice(0, 5);

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
