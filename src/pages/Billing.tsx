import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Zap, TrendingUp, ShoppingBag, Loader2, CreditCard, Smartphone, QrCode, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 45000,
    period: 'month',
    description: 'AI Conversations - Perfect for customer support automation',
    features: [
      'WhatsApp AI auto-replies',
      'FAQ & customer support AI',
      'Shared inbox',
      'Basic analytics',
      '4,000 AI replies / month',
      '100 active conversations / month',
    ],
    icon: Zap,
    color: 'blue',
  },
  {
    id: 'business',
    name: 'Business',
    price: 95000,
    period: 'month',
    description: 'AI + Booking - Complete solution for service businesses',
    features: [
      'Everything in Starter',
      'Booking / appointment system',
      'Manual booking management',
      'Customer history',
      '8,000 AI replies / month',
      '1000 active conversations / month',
    ],
    icon: TrendingUp,
    color: 'green',
    popular: true,
  },
  {
    id: 'store',
    name: 'Store Package',
    price: 25000,
    period: 'month',
    description: 'Standalone store solution - Can be combined with other plans',
    features: [
      'Product / service listing',
      'Unlimited order receiving',
      'Order status & management',
      'Manual order handling',
      '100 product images FREE',
      'Can be used alone or combined',
    ],
    icon: ShoppingBag,
    color: 'orange',
  },
];

const comboPlans = [
  {
    id: 'starter+store',
    name: 'Starter + Store',
    price: 70000,
    period: 'month',
    description: 'AI Conversations + Online Store',
    features: [
      'Everything in Starter',
      'Everything in Store Package',
      'WhatsApp AI auto-replies',
      'Product listing & orders',
      '4,000 AI replies / month',
    ],
    popular: true,
  },
  {
    id: 'business+store',
    name: 'Business + Store',
    price: 120000,
    period: 'month',
    description: 'Full Suite - AI + Booking + Store',
    features: [
      'Everything in Business',
      'Everything in Store Package',
      'AI + Booking + Store',
      '8,000 AI replies / month',
      'Complete business automation',
    ],
  },
];

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fetchingTransactions, setFetchingTransactions] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; plan: any }>({ open: false, plan: null });
  const [paymentType, setPaymentType] = useState('mobile');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setFetchingTransactions(true);
    try {
      const res = await fetch(API_ENDPOINTS.PAYMENT_TRANSACTIONS, {
        headers: { 'x-user-id': user?.id || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setFetchingTransactions(false);
    }
  };

  const handlePayment = async () => {
    if (!customerPhone) {
      toast({ title: 'Phone Required', description: 'Please enter your phone number for payment.', variant: 'destructive' });
      return;
    }

    setProcessingPayment(true);
    try {
      const res = await fetch(API_ENDPOINTS.PAYMENT_CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          amount: paymentDialog.plan.price,
          paymentType,
          planType: paymentDialog.plan.id,
          customerPhone,
          customerEmail,
          customerName,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: 'Payment Initiated', description: `Reference: ${data.reference}. ${paymentType === 'mobile' ? 'Check your phone for USSD prompt.' : 'Redirecting to payment page...' }` });
        
        if (data.paymentUrl) {
          setPaymentUrl(data.paymentUrl);
        }
        
        setPaymentDialog({ open: false, plan: null });
        fetchTransactions();
      } else {
        toast({ title: 'Payment Failed', description: data.error || 'Failed to create payment', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to process payment', variant: 'destructive' });
    } finally {
      setProcessingPayment(false);
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

  const currentPlan = user?.package || 'starter';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Plans</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and make payments via Snippe
          </p>
        </div>

        {paymentUrl && (
          <Alert className="border-blue-500 bg-blue-50">
            <ExternalLink className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Complete your card payment: <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline">{paymentUrl}</a>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="plans">
          <TabsList>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="combo">Combo Plans</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const Icon = plan.icon;
                const isCurrentPlan = currentPlan === plan.id;
                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "relative",
                      plan.popular && "border-[#25D366] border-2 shadow-lg",
                      isCurrentPlan && "border-blue-500 border-2"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-[#25D366] text-white">Most Popular</Badge>
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white">Current Plan</Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center",
                        plan.color === 'blue' && "bg-blue-100",
                        plan.color === 'green' && "bg-green-100",
                        plan.color === 'orange' && "bg-orange-100"
                      )}>
                        <Icon className={cn(
                          "w-6 h-6",
                          plan.color === 'blue' && "text-blue-600",
                          plan.color === 'green' && "text-green-600",
                          plan.color === 'orange' && "text-orange-600"
                        )} />
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="mt-2">{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-gray-900">
                          TSh {plan.price.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">/{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Dialog open={paymentDialog.open && paymentDialog.plan?.id === plan.id} onOpenChange={(open) => setPaymentDialog({ open, plan })}>
                        <DialogTrigger asChild>
                          <Button
                            className={cn(
                              "w-full",
                              isCurrentPlan
                                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                : plan.popular
                                ? "bg-[#25D366] hover:bg-[#20BD5A] text-white"
                                : "bg-gray-900 hover:bg-gray-800 text-white"
                            )}
                            disabled={isCurrentPlan}
                          >
                            {isCurrentPlan ? 'Current Plan' : 'Subscribe Now'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Complete Payment - {plan.name}</DialogTitle>
                            <DialogDescription>
                              TSh {plan.price.toLocaleString()}/{plan.period}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <RadioGroup value={paymentType} onValueChange={setPaymentType}>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="mobile" id="mobile" />
                                <Label htmlFor="mobile" className="flex items-center gap-2">
                                  <Smartphone className="w-4 h-4" />
                                  Mobile Money (M-Pesa, Airtel, Tigo)
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="card" id="card" />
                                <Label htmlFor="card" className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4" />
                                  Card Payment (Visa/Mastercard)
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="dynamic-qr" id="qr" />
                                <Label htmlFor="qr" className="flex items-center gap-2">
                                  <QrCode className="w-4 h-4" />
                                  QR Code Payment
                                </Label>
                              </div>
                            </RadioGroup>

                            <div className="space-y-2">
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input
                                id="phone"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="0781000000"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="your@email.com"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="name">Name</Label>
                              <Input
                                id="name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Your full name"
                              />
                            </div>

                            <Button
                              onClick={handlePayment}
                              disabled={processingPayment}
                              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
                            >
                              {processingPayment ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                `Pay TSh ${plan.price.toLocaleString()}`
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="combo" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comboPlans.map((plan) => {
                const isCurrentPlan = currentPlan === plan.id;
                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "relative",
                      plan.popular && "border-[#25D366] border-2 shadow-lg",
                      isCurrentPlan && "border-blue-500 border-2"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-[#25D366] text-white">Best Value</Badge>
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white">Current Plan</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-gray-900">
                          TSh {plan.price.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">/{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Dialog open={paymentDialog.open && paymentDialog.plan?.id === plan.id} onOpenChange={(open) => setPaymentDialog({ open, plan })}>
                        <DialogTrigger asChild>
                          <Button
                            className={cn(
                              "w-full",
                              isCurrentPlan
                                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                : plan.popular
                                ? "bg-[#25D366] hover:bg-[#20BD5A] text-white"
                                : "bg-gray-900 hover:bg-gray-800 text-white"
                            )}
                            disabled={isCurrentPlan}
                          >
                            {isCurrentPlan ? 'Current Plan' : 'Subscribe Now'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Complete Payment - {plan.name}</DialogTitle>
                            <DialogDescription>
                              TSh {plan.price.toLocaleString()}/{plan.period}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <RadioGroup value={paymentType} onValueChange={setPaymentType}>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="mobile" id="mobile-combo" />
                                <Label htmlFor="mobile-combo" className="flex items-center gap-2">
                                  <Smartphone className="w-4 h-4" />
                                  Mobile Money (M-Pesa, Airtel, Tigo)
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="card" id="card-combo" />
                                <Label htmlFor="card-combo" className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4" />
                                  Card Payment (Visa/Mastercard)
                                </Label>
                              </div>
                            </RadioGroup>

                            <div className="space-y-2">
                              <Label htmlFor="phone-combo">Phone Number</Label>
                              <Input
                                id="phone-combo"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="0781000000"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="email-combo">Email</Label>
                              <Input
                                id="email-combo"
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="your@email.com"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="name-combo">Name</Label>
                              <Input
                                id="name-combo"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Your full name"
                              />
                            </div>

                            <Button
                              onClick={handlePayment}
                              disabled={processingPayment}
                              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
                            >
                              {processingPayment ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                `Pay TSh ${plan.price.toLocaleString()}`
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Your recent payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {fetchingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No payment history yet</p>
                    <p className="text-sm">Subscribe to a plan to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {transaction.plan_type || 'Payment'} Plan
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                            {transaction.snippe_reference && (
                              <span className="ml-2 font-mono text-xs">
                                Ref: {transaction.snippe_reference.substring(0, 8)}...
                              </span>
                            )}
                          </p>
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
          </TabsContent>
        </Tabs>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">Accepted Payment Methods</p>
            <p className="text-sm">M-Pesa, Airtel Money, Tigo Pesa, Halotel, Visa, Mastercard</p>
            <p className="text-sm mt-1">Need help? Contact us at <a href="tel:+255719958997" className="text-[#25D366] hover:underline">+255 719 958 997</a> or <a href="mailto:chatisolutions@gmail.com" className="text-[#25D366] hover:underline">chatisolutions@gmail.com</a></p>
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  );
}
