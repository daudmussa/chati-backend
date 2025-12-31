import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, TrendingUp, Crown, MessageSquare, ShoppingBag, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Pricing() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const plans = [
    {
      name: 'Starter',
      icon: Zap,
      price: '29,000',
      period: 'month',
      description: 'Perfect for small businesses getting started',
      features: [
        '500 AI messages per month',
        '1 WhatsApp number',
        'Basic AI personality',
        'Up to 50 products',
        'Up to 100 bookings/month',
        'Email support',
        'Conversation history (30 days)',
        'Basic analytics',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Professional',
      icon: TrendingUp,
      price: '79,000',
      period: 'month',
      description: 'For growing businesses with higher volume',
      features: [
        '2,000 AI messages per month',
        'Up to 3 WhatsApp numbers',
        'Advanced AI personality',
        'Unlimited products',
        'Unlimited bookings',
        'Priority email & chat support',
        'Conversation history (90 days)',
        'Advanced analytics & reports',
        'Custom AI training',
        'WhatsApp broadcast messages',
      ],
      cta: 'Get Started',
      popular: true,
    },
    {
      name: 'Enterprise',
      icon: Crown,
      price: '199,000',
      period: 'month',
      description: 'For large businesses with custom needs',
      features: [
        'Unlimited AI messages',
        'Unlimited WhatsApp numbers',
        'Custom AI personality',
        'Unlimited products & bookings',
        'Dedicated account manager',
        '24/7 phone & chat support',
        'Unlimited conversation history',
        'Custom analytics & integrations',
        'API access',
        'White-label options',
        'SLA guarantee',
        'Custom training & onboarding',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const faqs = [
    {
      question: 'What happens when I exceed my message limit?',
      answer: 'When you reach your monthly message limit, you can either upgrade to a higher tier or purchase additional message credits. Your service will continue, but you\'ll be notified to take action.',
    },
    {
      question: 'Are Twilio costs included?',
      answer: 'No, Twilio messaging costs are separate and billed directly by Twilio. Our pricing covers the AI automation, store, and booking platform only.',
    },
    {
      question: 'Can I change plans anytime?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades apply at the next billing cycle.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, we offer a 14-day free trial on the Starter plan with no credit card required. You get full access to all Starter features.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept M-Pesa, Airtel Money, Tigo Pesa, credit/debit cards, and bank transfers for Tanzanian businesses.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-[#25D366] rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl">Chati Solutions</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/features')}
            >
              Features
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/pricing')}
            >
              Pricing
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/about')}
            >
              About
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/shop')}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Shop
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/contact')}
            >
              Contact
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/onboarding/account')}
            >
              Sign In
            </Button>
            <Button
              className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
              onClick={() => navigate('/onboarding/account')}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="container mx-auto px-4 py-4 space-y-2">
              <button
                onClick={() => {
                  navigate('/features');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
              >
                Features
              </button>
              <button
                onClick={() => {
                  navigate('/pricing');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  navigate('/about');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
              >
                About
              </button>
              <button
                onClick={() => {
                  navigate('/shop');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
              >
                Shop
              </button>
              <button
                onClick={() => {
                  navigate('/contact');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
              >
                Contact
              </button>
              <button
                onClick={() => {
                  navigate('/onboarding/account');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
              >
                Sign In
              </button>
              <Button
                className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white mt-2"
                onClick={() => {
                  navigate('/onboarding/account');
                  setIsMenuOpen(false);
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your business. All plans include AI responses, store management, and booking system.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.popular ? 'border-[#25D366] border-2 shadow-xl' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#25D366] hover:bg-[#20BD5A]">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <div className="w-12 h-12 bg-[#25D366]/10 rounded-full flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#25D366]" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      TSh {plan.price}
                    </span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    className={`w-full mb-6 ${
                      plan.popular
                        ? 'bg-[#25D366] hover:bg-[#20BD5A] text-white'
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => navigate('/onboarding/account')}
                  >
                    {plan.cta}
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-[#25D366] mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Features */}
        <Card className="mb-20 bg-gradient-to-r from-[#25D366]/5 to-[#25D366]/10 border-[#25D366]/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center">All Plans Include</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#25D366]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-[#25D366]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Responses</h3>
                <p className="text-gray-600 text-sm">
                  Intelligent automated replies trained on your business
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#25D366]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-[#25D366]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Online Store</h3>
                <p className="text-gray-600 text-sm">
                  Full product catalog with cart and WhatsApp checkout
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#25D366]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-[#25D366]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Booking System</h3>
                <p className="text-gray-600 text-sm">
                  Calendar-based scheduling with automated confirmations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <Card className="bg-gradient-to-r from-[#25D366] to-[#20BD5A] text-white border-0">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg mb-6 opacity-90">
                Start your 14-day free trial today. No credit card required.
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/onboarding/account')}
              >
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="border-t bg-white/80 backdrop-blur-sm mt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-4">WhatsApp AI Reply</h3>
                <p className="text-gray-600 text-sm">
                  Automate your business communications with AI-powered responses, online store, and booking system.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button onClick={() => navigate('/features')} className="text-gray-600 hover:text-[#25D366]">
                      Features
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/pricing')} className="text-gray-600 hover:text-[#25D366]">
                      Pricing
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/shop')} className="text-gray-600 hover:text-[#25D366]">
                      Store Demo
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/bookings')} className="text-gray-600 hover:text-[#25D366]">
                      Bookings Demo
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button onClick={() => navigate('/about')} className="text-gray-600 hover:text-[#25D366]">
                      About
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/contact')} className="text-gray-600 hover:text-[#25D366]">
                      Contact Us
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/terms')} className="text-gray-600 hover:text-[#25D366]">
                      Terms & Conditions
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Get Started</h4>
                <Button 
                  className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white mb-3"
                  onClick={() => navigate('/onboarding/account')}
                >
                  Start Free Trial
                </Button>
                <p className="text-xs text-gray-500">14-day free trial, no credit card required</p>
              </div>
            </div>
            <div className="border-t pt-8 text-center text-gray-600 text-sm">
              <p>© 2024 WhatsApp AI Reply. Made for Tanzanian businesses.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
