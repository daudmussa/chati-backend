import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Store, ShoppingCart, Calendar, Phone, Settings, Save, CreditCard, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/config/api';

interface UserData {
  userId: string;
  storeName: string;
  storePhone: string;
  storeId: string;
  ordersCount: number;
  bookingsCount: number;
  isCurrent: boolean;
  enabledFeatures: string[];
  limits: {
    maxConversations: number;
    maxProducts: number;
  };
  currentCounts: {
    conversations: number;
    products: number;
  };
  payDate: string | null;
  package: string;
  status: string;
  promoCode: string | null;
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLimits, setEditingLimits] = useState<{[userId: string]: { maxConversations: number; maxProducts: number }}>({});
  const [editingSubscription, setEditingSubscription] = useState<{[userId: string]: { payDate: string | null; package: string; status: string; promoCode: string | null }}>({});

  const availableFeatures = [
    { id: 'conversations', label: 'Conversations', icon: '💬' },
    { id: 'store', label: 'Store', icon: '🏪' },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'settings', label: 'AI Settings', icon: '⚙️' },
    { id: 'billing', label: 'Billing', icon: '💳' },
  ];

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this page",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    if (!user?.id) {
      console.log('[Admin] No user ID');
      return;
    }
    
    if (user.role !== 'admin') {
      console.log('[Admin] User is not admin, role:', user.role);
      return;
    }

    try {
      console.log('[Admin] Fetching users with:', { userId: user.id, role: user.role });
      const response = await fetch(API_ENDPOINTS.ADMIN_USERS, {
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });

      console.log('[Admin] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Admin] Users data:', data);
        setUsers(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Admin] Error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (userId: string, featureId: string, currentFeatures: string[]) => {
    const newFeatures = currentFeatures.includes(featureId)
      ? currentFeatures.filter(f => f !== featureId)
      : [...currentFeatures, featureId];

    console.log('[Admin] Toggling feature:', { userId, featureId, currentFeatures, newFeatures });

    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_USER_FEATURES(userId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify({ enabledFeatures: newFeatures }),
      });

      console.log('[Admin] Toggle response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('[Admin] Toggle result:', result);

        // Update local state
        setUsers(users.map(u => 
          u.userId === userId ? { ...u, enabledFeatures: newFeatures } : u
        ));

        // If toggling current user's features, reload to update navigation
        if (userId === user?.id) {
          toast({
            title: "Feature Updated",
            description: "Reloading to apply changes...",
          });
          setTimeout(() => window.location.reload(), 1000);
          return;
        }

        toast({
          title: "Feature Updated",
          description: `Successfully ${newFeatures.includes(featureId) ? 'enabled' : 'disabled'} feature`,
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Admin] Toggle error:', errorData);
        throw new Error(errorData.error || 'Failed to update features');
      }
    } catch (error: any) {
      console.error('[Admin] Toggle exception:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user features",
        variant: "destructive",
      });
    }
  };

  const updateLimits = async (userId: string) => {
    const newLimits = editingLimits[userId];
    if (!newLimits) return;

    console.log('[Admin] Updating limits:', { userId, newLimits });

    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_USER_LIMITS(userId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify({ limits: newLimits }),
      });

      console.log('[Admin] Limits response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('[Admin] Limits result:', result);

        // Update local state
        setUsers(users.map(u => 
          u.userId === userId ? { ...u, limits: newLimits } : u
        ));

        // Clear editing state
        const newEditingLimits = { ...editingLimits };
        delete newEditingLimits[userId];
        setEditingLimits(newEditingLimits);

        toast({
          title: "Limits Updated",
          description: "User limits have been successfully updated",
        });
      } else {
        console.error('[Admin] Limits error: response not ok', { status: response.status });
        throw new Error('Failed to update limits');
      }
    } catch (error) {
      console.error('[Admin] Limits error:', error);
      toast({
        title: "Error",
        description: "Failed to update user limits",
        variant: "destructive",
      });
    }
  };

  const updateSubscription = async (userId: string) => {
    const subscription = editingSubscription[userId];
    if (!subscription) return;

    console.log('[Admin] Updating subscription:', { userId, subscription });

    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_USER_SUBSCRIPTION(userId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify(subscription),
      });

      console.log('[Admin] Subscription response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('[Admin] Subscription result:', result);

        // Update local state
        setUsers(users.map(u => 
          u.userId === userId ? { 
            ...u, 
            payDate: subscription.payDate,
            package: subscription.package,
            status: subscription.status,
            promoCode: subscription.promoCode
          } : u
        ));

        // Clear editing state
        const newEditingSubscription = { ...editingSubscription };
        delete newEditingSubscription[userId];
        setEditingSubscription(newEditingSubscription);

        toast({
          title: "Subscription Updated",
          description: "User subscription has been successfully updated",
        });
      } else {
        console.error('[Admin] Subscription error: response not ok', { status: response.status });
        throw new Error('Failed to update subscription');
      }
    } catch (error) {
      console.error('[Admin] Subscription error:', error);
      toast({
        title: "Error",
        description: "Failed to update user subscription",
        variant: "destructive",
      });
    }
  };

  const totalUsers = users.length;
  const totalOrders = users.reduce((sum, u) => sum + u.ordersCount, 0);
  const totalBookings = users.reduce((sum, u) => sum + u.bookingsCount, 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage all users and view system-wide statistics</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No users found</div>
            ) : (
              <div className="space-y-3">
                {users.map((userData) => (
                  <div
                    key={userData.userId}
                    className={`p-4 rounded-lg border ${
                      userData.isCurrent
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Store className="h-6 w-6 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{userData.storeName}</h3>
                            {userData.isCurrent && (
                              <Badge className="bg-blue-500">You</Badge>
                            )}
                          </div>
                          
                          <div className="mt-1 space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{userData.storePhone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                                ID: {userData.userId.substring(0, 8)}...
                              </span>
                              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                                Store: {userData.storeId}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Orders</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {userData.ordersCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Bookings</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {userData.bookingsCount}
                              </p>
                            </div>
                          </div>

                          {/* Feature Toggles */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Settings className="h-4 w-4 text-gray-600" />
                              <h4 className="text-sm font-semibold text-gray-700">Enabled Features</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {availableFeatures.map((feature) => (
                                <div
                                  key={feature.id}
                                  className="flex items-center justify-between p-2 rounded bg-gray-50"
                                >
                                  <Label
                                    htmlFor={`${userData.userId}-${feature.id}`}
                                    className="text-sm cursor-pointer flex items-center gap-1"
                                  >
                                    <span>{feature.icon}</span>
                                    {feature.label}
                                  </Label>
                                  <Switch
                                    id={`${userData.userId}-${feature.id}`}
                                    checked={userData.enabledFeatures?.includes(feature.id) ?? true}
                                    onCheckedChange={() => 
                                      toggleFeature(
                                        userData.userId, 
                                        feature.id, 
                                        userData.enabledFeatures || []
                                      )
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Usage Limits */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Settings className="h-4 w-4 text-gray-600" />
                              <h4 className="text-sm font-semibold text-gray-700">Usage Limits</h4>
                            </div>
                            
                            <div className="space-y-3">
                              {/* Conversations Limit */}
                              <div className="p-3 rounded bg-blue-50 border border-blue-200">
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm font-medium text-blue-900">
                                    💬 Max Conversations
                                  </Label>
                                  <Badge 
                                    variant={userData.currentCounts.conversations >= userData.limits.maxConversations ? "destructive" : "secondary"}
                                    className="text-xs"
                                  >
                                    {userData.currentCounts.conversations} / {userData.limits.maxConversations}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editingLimits[userData.userId]?.maxConversations ?? userData.limits.maxConversations}
                                    onChange={(e) => setEditingLimits({
                                      ...editingLimits,
                                      [userData.userId]: {
                                        ...editingLimits[userData.userId],
                                        maxConversations: parseInt(e.target.value) || 0,
                                        maxProducts: editingLimits[userData.userId]?.maxProducts ?? userData.limits.maxProducts,
                                      }
                                    })}
                                    className="flex-1 h-8 text-sm"
                                  />
                                  {editingLimits[userData.userId] && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateLimits(userData.userId)}
                                      className="h-8"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Products Limit */}
                              <div className="p-3 rounded bg-green-50 border border-green-200">
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm font-medium text-green-900">
                                    🏪 Max Products
                                  </Label>
                                  <Badge 
                                    variant={userData.currentCounts.products >= userData.limits.maxProducts ? "destructive" : "secondary"}
                                    className="text-xs"
                                  >
                                    {userData.currentCounts.products} / {userData.limits.maxProducts}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editingLimits[userData.userId]?.maxProducts ?? userData.limits.maxProducts}
                                    onChange={(e) => setEditingLimits({
                                      ...editingLimits,
                                      [userData.userId]: {
                                        maxConversations: editingLimits[userData.userId]?.maxConversations ?? userData.limits.maxConversations,
                                        maxProducts: parseInt(e.target.value) || 0,
                                      }
                                    })}
                                    className="flex-1 h-8 text-sm"
                                  />
                                  {editingLimits[userData.userId] && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateLimits(userData.userId)}
                                      className="h-8"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Subscription Management */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                              <CreditCard className="h-4 w-4 text-gray-600" />
                              <h4 className="text-sm font-semibold text-gray-700">Subscription</h4>
                            </div>
                            
                            <div className="space-y-3">
                              {/* Pay Date */}
                              <div className="p-3 rounded bg-purple-50 border border-purple-200">
                                <Label className="text-sm font-medium text-purple-900 mb-2 block">
                                  📅 Pay Date
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="date"
                                    value={editingSubscription[userData.userId]?.payDate ?? userData.payDate ?? ''}
                                    onChange={(e) => setEditingSubscription({
                                      ...editingSubscription,
                                      [userData.userId]: {
                                        payDate: e.target.value,
                                        package: editingSubscription[userData.userId]?.package ?? userData.package,
                                        status: editingSubscription[userData.userId]?.status ?? userData.status,
                                        promoCode: editingSubscription[userData.userId]?.promoCode ?? userData.promoCode,
                                      }
                                    })}
                                    className="flex-1 h-8 text-sm"
                                  />
                                  {editingSubscription[userData.userId] && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateSubscription(userData.userId)}
                                      className="h-8"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Package */}
                              <div className="p-3 rounded bg-indigo-50 border border-indigo-200">
                                <Label className="text-sm font-medium text-indigo-900 mb-2 block">
                                  📦 Package
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={editingSubscription[userData.userId]?.package ?? userData.package}
                                    onValueChange={(value) => setEditingSubscription({
                                      ...editingSubscription,
                                      [userData.userId]: {
                                        payDate: editingSubscription[userData.userId]?.payDate ?? userData.payDate,
                                        package: value,
                                        status: editingSubscription[userData.userId]?.status ?? userData.status,
                                        promoCode: editingSubscription[userData.userId]?.promoCode ?? userData.promoCode,
                                      }
                                    })}
                                  >
                                    <SelectTrigger className="flex-1 h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="starter">Starter</SelectItem>
                                      <SelectItem value="professional">Professional</SelectItem>
                                      <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {editingSubscription[userData.userId] && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateSubscription(userData.userId)}
                                      className="h-8"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Status */}
                              <div className="p-3 rounded bg-amber-50 border border-amber-200">
                                <Label className="text-sm font-medium text-amber-900 mb-2 block">
                                  ⚡ Status
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={editingSubscription[userData.userId]?.status ?? userData.status}
                                    onValueChange={(value) => setEditingSubscription({
                                      ...editingSubscription,
                                      [userData.userId]: {
                                        payDate: editingSubscription[userData.userId]?.payDate ?? userData.payDate,
                                        package: editingSubscription[userData.userId]?.package ?? userData.package,
                                        status: value,
                                        promoCode: editingSubscription[userData.userId]?.promoCode ?? userData.promoCode,
                                      }
                                    })}
                                  >
                                    <SelectTrigger className="flex-1 h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                      <SelectItem value="suspended">Suspended</SelectItem>
                                      <SelectItem value="trial">Trial</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {editingSubscription[userData.userId] && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateSubscription(userData.userId)}
                                      className="h-8"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Promo Code */}
                              <div className="p-3 rounded bg-pink-50 border border-pink-200">
                                <Label className="text-sm font-medium text-pink-900 mb-2 block">
                                  🎁 Promo Code
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="text"
                                    placeholder="Enter promo code (optional)"
                                    value={editingSubscription[userData.userId]?.promoCode ?? userData.promoCode ?? ''}
                                    onChange={(e) => setEditingSubscription({
                                      ...editingSubscription,
                                      [userData.userId]: {
                                        payDate: editingSubscription[userData.userId]?.payDate ?? userData.payDate,
                                        package: editingSubscription[userData.userId]?.package ?? userData.package,
                                        status: editingSubscription[userData.userId]?.status ?? userData.status,
                                        promoCode: e.target.value,
                                      }
                                    })}
                                    className="flex-1 h-8 text-sm"
                                  />
                                  {editingSubscription[userData.userId] && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateSubscription(userData.userId)}
                                      className="h-8"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                {userData.promoCode && !editingSubscription[userData.userId] && (
                                  <Badge className="mt-2 bg-pink-600">
                                    Active: {userData.promoCode}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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
