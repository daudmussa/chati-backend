import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, Wallet, CheckCircle2, XCircle, Clock, TrendingUp, Loader2, AlertCircle, CreditCard, Smartphone, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Payments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const [statsRes, transactionsRes] = await Promise.all([
        fetch(API_ENDPOINTS.PAYMENT_STATS, {
          headers: { 'x-user-id': user?.id || '' }
        }),
        fetch(API_ENDPOINTS.PAYMENT_TRANSACTIONS, {
          headers: { 'x-user-id': user?.id || '' }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setPaymentStats(statsData.stats);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setRecentTransactions(transactionsData.transactions?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>;
      case 'refunded':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Refunded</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (!user?.paymentsEnabled) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-muted-foreground mt-1">Manage your payment settings and view transaction history</p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Payments are not enabled for your account. Contact admin to enable the payments feature.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-muted-foreground mt-1">Manage payments and view transaction history</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/payment-settings')}>
              <CreditCard className="w-4 h-4 mr-2" />
              Payment Settings
            </Button>
            <Button onClick={() => navigate('/payment-history')}>
              <Wallet className="w-4 h-4 mr-2" />
              View All History
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
          </div>
        ) : paymentStats ? (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">TSh {paymentStats.totalPaid.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    {paymentStats.completedCount} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">TSh {paymentStats.totalPending.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-yellow-600" />
                    {paymentStats.pendingCount} awaiting
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">TSh {paymentStats.totalFailed.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <XCircle className="w-3 h-3 text-red-600" />
                    {paymentStats.failedCount} failed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{paymentStats.totalTransactions}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-blue-600" />
                    All time
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your last 5 payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No transactions yet</p>
                    <p className="text-sm">Start by creating a payment to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          {transaction.payment_type === 'card' ? (
                            <CreditCard className="w-8 h-8 text-blue-600" />
                          ) : transaction.payment_type === 'dynamic-qr' ? (
                            <QrCode className="w-8 h-8 text-purple-600" />
                          ) : (
                            <Smartphone className="w-8 h-8 text-green-600" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 capitalize">
                              {transaction.plan_type?.replace(/_/g, ' ') || 'Payment'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString()}
                              {transaction.snippe_reference && (
                                <span className="ml-2 font-mono text-xs text-gray-500">
                                  {transaction.snippe_reference.substring(0, 12)}...
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            TSh {Number(transaction.amount).toLocaleString()}
                          </p>
                          <div className="mt-1">
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Accepted Payment Methods</p>
                <p className="text-sm">M-Pesa, Airtel Money, Tigo Pesa, Halotel, Visa, Mastercard</p>
                <p className="text-sm mt-1">Need help? Contact us at <a href="tel:+255719958997" className="text-[#25D366] hover:underline">+255 719 958 997</a></p>
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No payment statistics available.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
}
