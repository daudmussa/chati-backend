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
      icon: MessageSquare,
      price: '45,000',
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
      excludes: [
        'Booking system',
        'Store features',
      ],
      cta: 'Start Now',
      popular: false,
    },
    {
      name: 'Business',
      icon: TrendingUp,
      price: '95,000',
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
      excludes: [
      
      ],
      cta: 'Get Started',
      popular: true,
    },
    {
      name: 'Store Package',
      icon: ShoppingBag,
      price: '25,000',
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
      excludes: [
        'WhatsApp catalog browsing',
      ],
      cta: 'Get Started',
      popular: false,
    },
  ];

  const faqs = [
    {
      question: 'What happens when I exceed my AI message limit?',
      answer: 'You can purchase AI Message Token Bundles that never expire. They work across all features - conversations, bookings, and store inquiries.',
    },
    {
      question: 'Can I combine plans?',
      answer: 'Yes! The Store Package can be used standalone or combined with Starter or Business plans. Mix and match based on your needs.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept M-Pesa, Airtel Money, Tigo Pesa, credit/debit cards, and bank transfers for Tanzanian businesses.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.',
    },
    {
      question: 'Do AI tokens expire?',
      answer: 'No! AI Message Token Bundles never expire and can be used across all your conversations, bookings, and store interactions.',
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
            Choose the perfect plan for your business. Mix and match to fit your needs.
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
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-2">Includes:</p>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="w-5 h-5 text-[#25D366] mr-3 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* AI Message Bundles */}
        <Card className="mb-12 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl text-center">AI Message Token Bundles</CardTitle>
            <CardDescription className="text-center">Need more AI replies? Purchase token bundles that never expire</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-bold text-lg mb-2">Small</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">TZS 20,000</p>
                <p className="text-sm text-gray-600 mb-3">3,000 AI replies</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-bold text-lg mb-2">Medium</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">TZS 45,000</p>
                <p className="text-sm text-gray-600 mb-3">7,000 AI replies</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-[#25D366]">
                <Badge className="mb-2 bg-[#25D366]">Best Value</Badge>
                <h3 className="font-bold text-lg mb-2">Large</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">TZS 120,000</p>
                <p className="text-sm text-gray-600 mb-3">20,000 AI replies</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-bold text-lg mb-2">Enterprise</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">TZS 280,000</p>
                <p className="text-sm text-gray-600 mb-3">70,000 AI replies</p>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              Tokens work across conversations, bookings, and store inquiries. No expiration date.
            </p>
          </CardContent>
        </Card>

        {/* Store Image Add-ons */}
        <Card className="mb-12 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Store Image Add-ons</CardTitle>
            <CardDescription className="text-center">Need more product images? First 100 images are FREE with Store Package</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="bg-white p-6 rounded-lg border text-center">
                <h3 className="font-bold text-xl mb-2">+200 Images</h3>
                <p className="text-3xl font-bold text-gray-900">TZS 20,000</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-orange-400 text-center">
                <Badge className="mb-2 bg-orange-500">Popular</Badge>
                <h3 className="font-bold text-xl mb-2">+1,000 Images</h3>
                <p className="text-3xl font-bold text-gray-900">TZS 45,000</p>
              </div>
              <div className="bg-white p-6 rounded-lg border text-center">
                <h3 className="font-bold text-xl mb-2">+5,000 Images</h3>
                <p className="text-3xl font-bold text-gray-900">TZS 100,000</p>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              Counted as active images. Deleting images frees up slots.
            </p>
          </CardContent>
        </Card>

        {/* Use Case Examples */}
        <Card className="mb-20 bg-gradient-to-r from-[#25D366]/5 to-[#25D366]/10 border-[#25D366]/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Common Use Case Examples</CardTitle>
            <CardDescription className="text-center">See how businesses combine plans to fit their needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-bold text-lg mb-3 text-gray-900">Basic Shop (No AI)</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Store package</span>
                    <span className="font-semibold">25,000</span>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#25D366]">TZS 25,000 / month</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-[#25D366]">
                <Badge className="mb-2 bg-[#25D366]">Most Common</Badge>
                <h3 className="font-bold text-lg mb-3 text-gray-900">Service Business (AI Only)</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Starter plan</span>
                    <span className="font-semibold">45,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Extra 3,000 AI replies</span>
                    <span className="font-semibold">20,000</span>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#25D366]">TZS 65,000 / month</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-bold text-lg mb-3 text-gray-900">Busy Business (Full Suite)</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Business plan</span>
                    <span className="font-semibold">95,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Store package</span>
                    <span className="font-semibold">25,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Extra 5,000 AI replies</span>
                    <span className="font-semibold">45,000</span>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#25D366]">TZS 165,000 / month</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Features */}
        

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
                Start now with simple onboarding process.
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/onboarding/account')}
              >
                Start Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="border-t bg-white/80 backdrop-blur-sm mt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Chati Solutions</h3>
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
                  Start Now
                </Button>
              </div>
            </div>
            <div className="border-t pt-8 text-center text-gray-600 text-sm">
              <p>© 2026 Chati Solutions. Made for Tanzanian businesses.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
