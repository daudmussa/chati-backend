import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import {
  MessageSquare,
  Bot,
  Clock,
  ShoppingBag,
  CalendarCheck,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Users,
  Settings,
  Smartphone,
  TrendingUp,
  Bell,
  Lock,
  Headphones,
  Package,
  CreditCard,
  Menu,
  X,
} from 'lucide-react';

export default function Features() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainFeatures = [
    {
      icon: Bot,
      title: 'AI-Powered Responses',
      description: 'Intelligent automated replies that understand context and respond naturally to customer inquiries 24/7.',
      benefits: [
        'Natural language processing',
        'Context-aware conversations',
        'Multi-language support',
        'Custom personality training',
      ],
      color: 'bg-blue-500',
    },
    {
      icon: ShoppingBag,
      title: 'Online Store Management',
      description: 'Complete e-commerce solution with product catalog, inventory tracking, and WhatsApp checkout integration.',
      benefits: [
        'Unlimited product listings',
        'Image gallery support',
        'Inventory management',
        'Shopping cart & checkout',
      ],
      color: 'bg-purple-500',
    },
    {
      icon: CalendarCheck,
      title: 'Booking System',
      description: 'Calendar-based appointment scheduling with automated confirmations and reminders via WhatsApp.',
      benefits: [
        'Service management',
        'Time slot blocking',
        'Automated reminders',
        'Booking history tracking',
      ],
      color: 'bg-green-500',
    },
  ];

  const additionalFeatures = [
    {
      icon: MessageSquare,
      title: 'Conversation Management',
      description: 'View and manage all customer conversations in one place with searchable history.',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Track message volume, response times, popular products, and booking trends.',
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Never miss a customer inquiry, even outside business hours.',
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with encrypted data storage and GDPR compliance.',
    },
    {
      icon: Zap,
      title: 'Instant Setup',
      description: 'Get started in minutes with our simple 4-step onboarding wizard.',
    },
    {
      icon: Globe,
      title: 'Multi-Language',
      description: 'Support customers in English, Swahili, and other languages.',
    },
    {
      icon: Users,
      title: 'Multi-Tenant',
      description: 'Manage multiple businesses or locations from a single account.',
    },
    {
      icon: Settings,
      title: 'Customizable AI',
      description: 'Train the AI with your business tone, FAQs, and brand voice.',
    },
    {
      icon: Smartphone,
      title: 'Mobile Optimized',
      description: 'Fully responsive design works perfectly on phones and tablets.',
    },
    {
      icon: TrendingUp,
      title: 'Scalable',
      description: 'Grows with your business from startup to enterprise.',
    },
    {
      icon: Bell,
      title: 'Real-Time Notifications',
      description: 'Get instant alerts for important messages and bookings.',
    },
    {
      icon: Lock,
      title: 'Data Privacy',
      description: 'Your data is yours. We never share or sell customer information.',
    },
  ];

  const integrations = [
    
  ];

  const useCases = [
    {
      title: 'Retail Stores',
      description: 'Manage product inquiries, process orders, and handle customer support automatically.',
      icon: ShoppingBag,
    },
    {
      title: 'Service Businesses',
      description: 'Accept bookings for salons, clinics, consultations, and appointments.',
      icon: CalendarCheck,
    },
    {
      title: 'Restaurants',
      description: 'Take orders, manage reservations, and answer menu questions instantly.',
      icon: Package,
    },
    {
      title: 'Professional Services',
      description: 'Schedule consultations, share information, and qualify leads automatically.',
      icon: Headphones,
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
          <Badge className="mb-4 bg-[#25D366] hover:bg-[#20BD5A]">
            All-in-One Platform
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to Automate
            <br />
            <span className="text-[#25D366]">Your Business Communications</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Combine AI-powered messaging, online store, and booking system in one powerful platform designed for Tanzanian businesses.
          </p>
        </div>

        {/* Main Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {mainFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-2 hover:border-[#25D366] transition-colors">
                <CardHeader>
                  <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center text-gray-600">
                        <div className="w-1.5 h-1.5 bg-[#25D366] rounded-full mr-3" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Features Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Packed with Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-[#25D366]/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-[#25D366]" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Perfect for Any Business
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our platform adapts to your industry and business needs
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase) => {
              const Icon = useCase.icon;
              return (
                <Card key={useCase.title} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#25D366] to-[#20BD5A] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{useCase.title}</h3>
                    <p className="text-sm text-gray-600">{useCase.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Integrations */}
        {/* <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Seamless Integrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <Card key={integration.name} className="border-2">
                  <CardContent className="pt-6 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-gray-700" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{integration.name}</h3>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div> */}

        {/* How It Works */}
        <Card className="mb-20 bg-gradient-to-r from-[#25D366]/5 to-[#25D366]/10 border-[#25D366]/20">
          <CardHeader>
            <CardTitle className="text-3xl text-center">How It Works</CardTitle>
            <CardDescription className="text-center text-base">
              Get started in 4 simple steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: '1', title: 'Create Account', desc: 'Sign up with your business details' },
                { step: '2', title: 'Make a payment', desc: 'Choose the package that you want and pay for it' },
                { step: '3', title: 'Configure AI', desc: 'Set up your business personality' },
                { step: '4', title: 'Go Live', desc: 'Start receiving automated responses' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-[#25D366] to-[#20BD5A] text-white border-0">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
              <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
                Join hundreds of Tanzanian businesses using AI to automate customer service, sell products, and manage bookings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate('/onboarding/account')}
                >
                  Start Now!
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white text-white hover:bg-white/20"
                  onClick={() => navigate('/pricing')}
                >
                  View Pricing
                </Button>
              </div>
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
