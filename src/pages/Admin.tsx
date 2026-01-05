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
import { Users, Store, ShoppingCart, Calendar, Phone, Settings, Save, CreditCard, Package, Search, ArrowUpDown, ChevronDown, ChevronRight, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/config/api';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface UserData {
  userId: string;
  email?: string;
  name?: string;
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
  credentials?: {
    hasCredentials: boolean;
    twilioPhoneNumber?: string;
    bypassClaude?: boolean;
  };
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByPayDate, setFilterByPayDate] = useState('');
  const [filterByStaff, setFilterByStaff] = useState('');
  const [allStaff, setAllStaff] = useState<Array<{id: string; name: string; promoCode: string; userId: string}>>([]);
  const [sortBy, setSortBy] = useState<'payDate' | 'name' | 'created'>('payDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingLimits, setEditingLimits] = useState<{[userId: string]: { maxConversations: number; maxProducts: number }}>({});
  const [editingSubscription, setEditingSubscription] = useState<{[userId: string]: { payDate: string | null; package: string; status: string; promoCode: string | null }}>({});
  const [changingPassword, setChangingPassword] = useState<{userId: string; newPassword: string} | null>(null);
  const [deletingUser, setDeletingUser] = useState<{userId: string; userName: string} | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<{[userId: string]: boolean}>({});
  const [editingCredentials, setEditingCredentials] = useState<{[userId: string]: {
    claudeApiKey: string;
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioPhoneNumber: string;
  }}>({});

  // Helper function to format date for input[type="date"]
  const formatDateForInput = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const fetchAllStaff = async () => {
    try {
      const usersResponse = await fetch(API_ENDPOINTS.ADMIN_USERS, {
        headers: {
          "x-user-id": user?.id || "",
          "x-user-role": user?.role || ""
        }
      });
      
      if (!usersResponse.ok) return;
      
      const allUsersData = await usersResponse.json();
      const staffList: Array<{id: string; name: string; promoCode: string; userId: string}> = [];
      
      for (const userData of allUsersData) {
        try {
          const response = await fetch(API_ENDPOINTS.STAFF, {
            headers: {
              "x-user-id": userData.userId
            }
          });
          
          if (response.ok) {
            const userStaff = await response.json();
            userStaff.forEach((staff: any) => {
              if (staff.promoCode) {
                staffList.push({
                  id: staff.id,
                  name: staff.name,
                  promoCode: staff.promoCode,
                  userId: userData.userId
                });
              }
            });
          }
        } catch (error) {
          console.error("Error fetching staff for user:", userData.userId, error);
        }
      }
      
      setAllStaff(staffList);
    } catch (error) {
      console.error("Error fetching all staff:", error);
    }
  };

  const availableFeatures = [
    { id: 'conversations', label: 'Conversations', icon: '💬' },
    { id: 'store', label: 'Store', icon: '🏪' },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'staff', label: 'Staff', icon: '👥' },
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
    fetchAllStaff();
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
        console.log('[Admin] First user payDate:', data[0]?.payDate);
        
        // Fetch credentials for each user
        const usersWithCredentials = await Promise.all(
          data.map(async (userData: UserData) => {
            try {
              const credResponse = await fetch(API_ENDPOINTS.USER_CREDENTIALS, {
                headers: {
                  'x-user-id': userData.userId
                }
              });
              
              if (credResponse.ok) {
                const credData = await credResponse.json();
                return {
                  ...userData,
                  credentials: {
                    hasCredentials: credData.hasCredentials || false,
                    twilioPhoneNumber: credData.twilioPhoneNumber || '',
                    bypassClaude: credData.bypassClaude || false
                  }
                };
              }
            } catch (error) {
              console.error('Failed to fetch credentials for user:', userData.userId, error);
            }
            return userData;
          })
        );
        
        setUsers(usersWithCredentials);
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

  const updateUserCredentials = async (userId: string) => {
    const credentials = editingCredentials[userId];
    if (!credentials) return;

    try {
      const response = await fetch(API_ENDPOINTS.USER_CREDENTIALS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          claudeApiKey: credentials.claudeApiKey,
          twilioAccountSid: credentials.twilioAccountSid,
          twilioAuthToken: credentials.twilioAuthToken,
          twilioPhoneNumber: credentials.twilioPhoneNumber,
        }),
      });

      if (response.ok) {
        // Update local state
        setUsers(users.map(u => 
          u.userId === userId ? { 
            ...u, 
            credentials: {
              hasCredentials: true,
              twilioPhoneNumber: credentials.twilioPhoneNumber,
              bypassClaude: u.credentials?.bypassClaude || false
            }
          } : u
        ));

        // Clear editing state
        const newEditingCredentials = { ...editingCredentials };
        delete newEditingCredentials[userId];
        setEditingCredentials(newEditingCredentials);

        toast({
          title: "Credentials Updated",
          description: "User API credentials have been successfully updated",
        });
      } else {
        throw new Error('Failed to update credentials');
      }
    } catch (error) {
      console.error('[Admin] Credentials error:', error);
      toast({
        title: "Error",
        description: "Failed to update user credentials",
        variant: "destructive",
      });
    }
  };

  const changePassword = async () => {
    if (!changingPassword || !changingPassword.newPassword || changingPassword.newPassword.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_CHANGE_PASSWORD(changingPassword.userId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify({ newPassword: changingPassword.newPassword }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
        setChangingPassword(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    }
  };

  const deleteUserAccount = async (userId: string, userName: string) => {
    setDeletingUser({ userId, userName });
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;

    console.log('[Admin] Deleting user:', deletingUser.userId);

    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_DELETE_USER(deletingUser.userId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || '',
        },
      });

      console.log('[Admin] Delete response status:', response.status);

      if (response.ok) {
        // Remove user from local state
        setUsers(users.filter(u => u.userId !== deletingUser.userId));

        toast({
          title: "User Deleted",
          description: `${deletingUser.userName} and all their data have been permanently deleted`,
        });
        setDeletingUser(null);
      } else {
        const error = await response.json();
        console.error('[Admin] Delete error: response not ok', { status: response.status, error });
        throw new Error(error.error || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('[Admin] Delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter(u => {
      // Text search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
          u.storeName.toLowerCase().includes(query) ||
          u.storePhone.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.name?.toLowerCase().includes(query) ||
          u.promoCode?.toLowerCase().includes(query) ||
          u.storeId.toLowerCase().includes(query)
        );
        if (!matchesSearch) return false;
      }
      
      // Pay date filter
      if (filterByPayDate) {
        if (!u.payDate) return false;
        const userPayDate = formatDateForInput(u.payDate);
        if (userPayDate !== filterByPayDate) return false;
      }
      
      // Staff promo code filter
      if (filterByStaff && filterByStaff !== "all") {
        const selectedStaff = allStaff.find(s => s.id === filterByStaff);
        if (selectedStaff && u.promoCode !== selectedStaff.promoCode) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'payDate') {
        // Handle null dates - put them at the end regardless of sort order
        if (!a.payDate && !b.payDate) return 0;
        if (!a.payDate) return 1; // a goes to end
        if (!b.payDate) return -1; // b goes to end
        
        const dateA = new Date(a.payDate).getTime();
        const dateB = new Date(b.payDate).getTime();
        compareValue = dateA - dateB;
      } else if (sortBy === 'name') {
        compareValue = a.storeName.localeCompare(b.storeName);
      } else if (sortBy === 'created') {
        // Assuming we don't have createdAt, use userId as proxy
        compareValue = a.userId.localeCompare(b.userId);
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  const totalUsers = users.length;
  const totalOrders = users.reduce((sum, u) => sum + u.ordersCount, 0);
  const totalBookings = users.reduce((sum, u) => sum + u.bookingsCount, 0);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Manage all users and view system-wide statistics</p>
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
            <div className="flex flex-col gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users ({filteredAndSortedUsers.length})
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, phone, promo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {/* Pay Date Filter */}
                <div className="relative w-full sm:w-48">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    placeholder="Filter by pay date..."
                    value={filterByPayDate}
                    onChange={(e) => setFilterByPayDate(e.target.value)}
                    className="pl-10"
                  />
                  {filterByPayDate && (
                    <button
                      onClick={() => setFilterByPayDate('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>
                {/* Staff Filter */}
                <div className="relative w-full sm:w-56">
                  <Select value={filterByStaff} onValueChange={setFilterByStaff}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by staff promo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff</SelectItem>
                      {allStaff.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} ({staff.promoCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filterByStaff && filterByStaff !== "all" && (
                    <button
                      onClick={() => setFilterByStaff("")}
                      className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                    >
                      ×
                    </button>
                  )}
                </div>
                {/* Sort */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payDate">Pay Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                  </SelectContent>
                </Select>
                {/* Sort Order */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading users...</div>
            ) : filteredAndSortedUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery || filterByPayDate || (filterByStaff && filterByStaff !== "all")
                  ? 'No users found matching your filters' 
                  : 'No users found'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedUsers.map((userData) => (
                  <Collapsible
                    key={userData.userId}
                    open={expandedUsers[userData.userId]}
                    onOpenChange={(open) => setExpandedUsers({...expandedUsers, [userData.userId]: open})}
                  >
                    <div
                      className={`rounded-lg border ${
                        userData.isCurrent
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {/* Collapsed Header */}
                      <CollapsibleTrigger asChild>
                        <div className="p-4 cursor-pointer hover:bg-gray-50/50">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Store className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{userData.storeName}</h3>
                                {userData.isCurrent && (
                                  <Badge className="bg-blue-500">You</Badge>
                                )}
                                {userData.credentials?.hasCredentials && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <Key className="h-3 w-3 mr-1" />
                                    API
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span>{userData.storePhone}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right hidden sm:block">
                                <div className="text-xs text-gray-500">Orders / Bookings</div>
                                <div className="font-semibold text-gray-900">{userData.ordersCount} / {userData.bookingsCount}</div>
                              </div>
                              {expandedUsers[userData.userId] ? (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* Expanded Content */}
                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-2 border-t">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className="flex items-start gap-4 flex-1 w-full">                        
                          <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between mb-3">
                            {!userData.isCurrent && (
                              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setChangingPassword({ userId: userData.userId, newPassword: '' })}
                                  className="h-7 text-xs w-full sm:w-auto"
                                >
                                  Change Password
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteUserAccount(userData.userId, userData.storeName)}
                                  className="h-7 text-xs w-full sm:w-auto"
                                >
                                  Delete User
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                                ID: {userData.userId.substring(0, 8)}...
                              </span>
                              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                                Store: {userData.storeId}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm font-medium text-purple-900">
                                    📅 Pay Date
                                  </Label>
                                  {userData.payDate && !editingSubscription[userData.userId] && (
                                    <Badge variant="secondary" className="text-xs">
                                      {new Date(userData.payDate).toLocaleDateString()}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="date"
                                    value={
                                      editingSubscription[userData.userId]?.payDate 
                                        ? formatDateForInput(editingSubscription[userData.userId].payDate)
                                        : formatDateForInput(userData.payDate)
                                    }
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
                                    autoComplete="off"
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

                          {/* API Credentials Section */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Key className="h-4 w-4 text-gray-600" />
                              <h4 className="text-sm font-semibold text-gray-700">API Credentials</h4>
                              {userData.credentials?.hasCredentials && (
                                <Badge variant="default" className="bg-green-500 text-xs">Configured</Badge>
                              )}
                            </div>
                            
                            <div className="space-y-3">
                              {/* Claude API Key */}
                              <div className="p-3 rounded bg-violet-50 border border-violet-200">
                                <Label className="text-sm font-medium text-violet-900 mb-2 block">
                                  🤖 Claude API Key
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="password"
                                    placeholder={userData.credentials?.hasCredentials ? "****...configured" : "sk-ant-api03-..."}
                                    value={editingCredentials[userData.userId]?.claudeApiKey ?? ''}
                                    onChange={(e) => setEditingCredentials({
                                      ...editingCredentials,
                                      [userData.userId]: {
                                        claudeApiKey: e.target.value,
                                        twilioAccountSid: editingCredentials[userData.userId]?.twilioAccountSid ?? '',
                                        twilioAuthToken: editingCredentials[userData.userId]?.twilioAuthToken ?? '',
                                        twilioPhoneNumber: editingCredentials[userData.userId]?.twilioPhoneNumber ?? userData.credentials?.twilioPhoneNumber ?? '',
                                      }
                                    })}
                                    autoComplete="off"
                                    className="flex-1 h-8 text-sm"
                                  />
                                  {editingCredentials[userData.userId] && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateUserCredentials(userData.userId)}
                                      className="h-8"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Twilio Account SID */}
                              <div className="p-3 rounded bg-sky-50 border border-sky-200">
                                <Label className="text-sm font-medium text-sky-900 mb-2 block">
                                  📱 Twilio Account SID
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="password"
                                    placeholder={userData.credentials?.hasCredentials ? "****...configured" : "AC..."}
                                    value={editingCredentials[userData.userId]?.twilioAccountSid ?? ''}
                                    onChange={(e) => setEditingCredentials({
                                      ...editingCredentials,
                                      [userData.userId]: {
                                        claudeApiKey: editingCredentials[userData.userId]?.claudeApiKey ?? '',
                                        twilioAccountSid: e.target.value,
                                        twilioAuthToken: editingCredentials[userData.userId]?.twilioAuthToken ?? '',
                                        twilioPhoneNumber: editingCredentials[userData.userId]?.twilioPhoneNumber ?? userData.credentials?.twilioPhoneNumber ?? '',
                                      }
                                    })}
                                    autoComplete="off"
                                    className="flex-1 h-8 text-sm"
                                  />
                                  {editingCredentials[userData.userId] && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateUserCredentials(userData.userId)}
                                      className="h-8"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Twilio Auth Token */}
                              <div className="p-3 rounded bg-teal-50 border border-teal-200">
                                <Label className="text-sm font-medium text-teal-900 mb-2 block">
                                  🔑 Twilio Auth Token
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="password"
                                    placeholder={userData.credentials?.hasCredentials ? "****...configured" : "Enter auth token"}
                                    value={editingCredentials[userData.userId]?.twilioAuthToken ?? ''}
                                    onChange={(e) => setEditingCredentials({
                                      ...editingCredentials,
                                      [userData.userId]: {
                                        claudeApiKey: editingCredentials[userData.userId]?.claudeApiKey ?? '',
                                        twilioAccountSid: editingCredentials[userData.userId]?.twilioAccountSid ?? '',
                                        twilioAuthToken: e.target.value,
                                        twilioPhoneNumber: editingCredentials[userData.userId]?.twilioPhoneNumber ?? userData.credentials?.twilioPhoneNumber ?? '',
                                      }
                                    })}
                                    autoComplete="off"
                                    className="flex-1 h-8 text-sm"
                                  />
                                  {editingCredentials[userData.userId] && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateUserCredentials(userData.userId)}
                                      className="h-8"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Twilio Phone Number */}
                              <div className="p-3 rounded bg-emerald-50 border border-emerald-200">
                                <Label className="text-sm font-medium text-emerald-900 mb-2 block">
                                  📞 WhatsApp Phone Number
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="text"
                                    placeholder="+255793531101"
                                    value={editingCredentials[userData.userId]?.twilioPhoneNumber ?? userData.credentials?.twilioPhoneNumber ?? ''}
                                    onChange={(e) => setEditingCredentials({
                                      ...editingCredentials,
                                      [userData.userId]: {
                                        claudeApiKey: editingCredentials[userData.userId]?.claudeApiKey ?? '',
                                        twilioAccountSid: editingCredentials[userData.userId]?.twilioAccountSid ?? '',
                                        twilioAuthToken: editingCredentials[userData.userId]?.twilioAuthToken ?? '',
                                        twilioPhoneNumber: e.target.value,
                                      }
                                    })}
                                    className="flex-1 h-8 text-sm"
                                  />
                                  {editingCredentials[userData.userId] && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateUserCredentials(userData.userId)}
                                      className="h-8"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                <p className="text-xs text-emerald-700 mt-1">
                                  Your WhatsApp-enabled phone number (with country code)
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      {changingPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Change User Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={changingPassword.newPassword}
                  onChange={(e) => setChangingPassword({ ...changingPassword, newPassword: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setChangingPassword(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={changePassword}
                  disabled={!changingPassword.newPassword || changingPassword.newPassword.length < 6}
                >
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-900 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Delete User Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">
                  Are you sure you want to delete <span className="text-red-600">{deletingUser.userName}</span>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-red-900">This will permanently delete:</p>
                  <ul className="text-sm text-red-800 space-y-1 ml-4">
                    <li>• All conversations and messages</li>
                    <li>• All products and orders</li>
                    <li>• All bookings and appointments</li>
                    <li>• All staff members</li>
                    <li>• All business settings</li>
                    <li>• User account and credentials</li>
                  </ul>
                </div>
                <p className="text-sm font-bold text-red-600 mt-3">
                  ⚠️ This action cannot be undone!
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDeletingUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteUser}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Permanently
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
