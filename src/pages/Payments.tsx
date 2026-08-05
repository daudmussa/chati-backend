import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Search, Filter, CreditCard, Smartphone, QrCode, Loader2, AlertCircle, Download, DollarSign, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Payments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
        console.log('[Payments] Stats loaded:', statsData);
        setPaymentStats(statsData.stats);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        console.log('[Payments] Transactions loaded:', transactionsData);
        setTransactions(transactionsData.transactions || []);
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
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'dynamic-qr':
        return <QrCode className="w-5 h-5 text-purple-600" />;
      default:
        return <Smartphone className="w-5 h-5 text-green-600" />;
    }
  };

  const getTransactionName = (t: any) => {
    const meta = typeof t.metadata === 'string' ? JSON.parse(t.metadata) : t.metadata;
    return meta?.itemName || t.planType?.replace(/_/g, ' ') || 'Payment';
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = !searchTerm || 
      t.snippeReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTransactionName(t).toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Reference', 'Type', 'Amount', 'Status', 'Customer Name', 'Customer Email'];
    const rows = filteredTransactions.map(t => [
      new Date(t.createdAt).toLocaleDateString(),
      t.snippeReference,
      getTransactionName(t),
      t.amount,
      t.status,
      t.customerName,
      t.customerEmail
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!user?.paymentsEnabled) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-muted-foreground mt-1">Manage payments and view transaction history</p>
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
            <p className="text-muted-foreground mt-1">Payment statistics and transaction history</p>
          </div>
          <Button variant="outline" onClick={exportToCSV} disabled={transactions.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Statistics Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
          </div>
        ) : paymentStats ? (
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
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No payment statistics available.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reference, plan type, or customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
          </div>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-muted-foreground">No payment history yet</p>
              <p className="text-sm text-muted-foreground mt-1">Subscribe to a plan to get started</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                Transactions ({filteredTransactions.length})
              </CardTitle>
              <CardDescription>
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-4 border-b last:border-0 hover:bg-gray-50 p-4 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        {getPaymentTypeIcon(transaction.payment_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 capitalize">
                            {getTransactionName(transaction)}
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                          <span className="font-mono text-xs">
                            Ref: {transaction.snippeReference || 'N/A'}
                          </span>
                        </div>
                        {transaction.customerName && (
                          <p className="text-sm text-gray-600 mt-1">
                            Customer: {transaction.customerName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        TSh {Number(transaction.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transaction.currency || 'TZS'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
