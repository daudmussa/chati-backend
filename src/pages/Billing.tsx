import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, TrendingUp, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Starter',
    price: 'TZS 50,000',
    period: '/month',
    description: 'Perfect for small businesses getting started',
    features: [
      '500 messages per month',
      'Basic AI responses',
      'Email support',
      '1 WhatsApp number',
      'Basic analytics',
    ],
    icon: Zap,
    color: 'blue',
    current: true,
  },
  {
    name: 'Professional',
    price: 'TZS 150,000',
    period: '/month',
    description: 'For growing businesses with higher volume',
    features: [
      '2,000 messages per month',
      'Advanced AI responses',
      'Priority support',
      '3 WhatsApp numbers',
      'Advanced analytics',
      'Custom AI personality',
    ],
    icon: TrendingUp,
    color: 'green',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'TZS 400,000',
    period: '/month',
    description: 'For large businesses with custom needs',
    features: [
      'Unlimited messages',
      'Premium AI responses',
      '24/7 phone support',
      'Unlimited numbers',
      'Custom integrations',
      'Dedicated account manager',
      'API access',
    ],
    icon: Crown,
    color: 'purple',
  },
];

export default function Billing() {
  const currentUsage = 347;
  const monthlyLimit = 500;
  const usagePercentage = (currentUsage / monthlyLimit) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Plans</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and view usage
          </p>
        </div>

        {/* Current Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>
              Your message usage for this billing period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {currentUsage.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  of {monthlyLimit.toLocaleString()} messages used
                </p>
              </div>
              <Badge className="bg-[#25D366] text-white">
                {Math.round(100 - usagePercentage)}% remaining
              </Badge>
            </div>
            <Progress value={usagePercentage} className="h-3" />
            <p className="text-xs text-muted-foreground">
              Resets on January 1, 2025
            </p>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.name}
                  className={cn(
                    "relative",
                    plan.popular && "border-[#25D366] border-2 shadow-lg",
                    plan.current && "border-blue-500 border-2"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-[#25D366] text-white">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {plan.current && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white">
                        Current Plan
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center",
                        plan.color === 'blue' && "bg-blue-100",
                        plan.color === 'green' && "bg-green-100",
                        plan.color === 'purple' && "bg-purple-100"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-6 h-6",
                          plan.color === 'blue' && "text-blue-600",
                          plan.color === 'green' && "text-green-600",
                          plan.color === 'purple' && "text-purple-600"
                        )}
                      />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
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
                    <Button
                      className={cn(
                        "w-full",
                        plan.current
                          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          : plan.popular
                          ? "bg-[#25D366] hover:bg-[#20BD5A] text-white"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      )}
                      disabled={plan.current}
                    >
                      {plan.current ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              Your recent payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { date: 'Dec 1, 2024', amount: 'TZS 50,000', status: 'Paid', plan: 'Starter' },
                { date: 'Nov 1, 2024', amount: 'TZS 50,000', status: 'Paid', plan: 'Starter' },
                { date: 'Oct 1, 2024', amount: 'TZS 50,000', status: 'Paid', plan: 'Starter' },
              ].map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{transaction.plan} Plan</p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{transaction.amount}</p>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
