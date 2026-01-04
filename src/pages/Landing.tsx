import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Zap, Clock, TrendingUp, CheckCircle2, ArrowRight, ShoppingBag, CalendarCheck, Menu, X, DollarSign } from 'lucide-react';
import { useState } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: Zap,
      title: 'Instant AI Responses',
      description: '24/7 automated replies to customer inquiries in seconds',
    },
    {
      icon: ShoppingBag,
      title: 'Online Store',
      description: 'Sell products directly through WhatsApp with integrated cart and checkout',
    },
    {
      icon: CalendarCheck,
      title: 'Booking System',
      description: 'Accept appointments and service bookings with automated confirmations',
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Free up your team to focus on complex customer needs',
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Business',
      description: 'Never miss a customer inquiry, sale, or booking opportunity',
    },
  ];

  const steps = [
    'Create your account and describe your business',
    'Configure your AI assistant\'s personality',
    'Start receiving automated responses instantly',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
              onClick={() => navigate('/signin')}
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
                  navigate('/signin');
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 bg-[#25D366]/10 text-[#25D366] px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="w-4 h-4" />
           We are Chati Solutions
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Automate Your WhatsApp
            <br />
            <span className="text-[#25D366]">Customer Responses</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let AI handle your WhatsApp messages 24/7, manage your online store, and accept bookings. 
            Perfect for Tanzanian businesses looking to provide instant customer support, sell products, 
            and schedule appointments without hiring extra staff.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-[#25D366] hover:bg-[#20BD5A] text-white text-lg px-8 py-6"
              onClick={() => navigate('/onboarding/account')}
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Chati Solutions?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Powerful features designed for Tanzanian businesses
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">{features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-2 hover:border-[#25D366] transition-colors">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto">
                    <Icon className="w-8 h-8 text-[#25D366]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 bg-white/50 rounded-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get Started in 3 Simple Steps
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Setup takes less than 10 minutes
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">{index + 1}</span>
              </div>
              <div className="flex-1 pt-2">
                <p className="text-lg text-gray-900">{step}</p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-[#25D366] flex-shrink-0 mt-2" />
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Button
            size="lg"
            className="bg-[#25D366] hover:bg-[#20BD5A] text-white text-lg px-8 py-6"
            onClick={() => navigate('/onboarding/account')}
          >
            Start Now!
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Pricing Preview */}
      

      {/* Store & Bookings Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Explore Our Services
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse our products and book services directly through WhatsApp
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-2 hover:border-[#25D366] transition-colors cursor-pointer" onClick={() => navigate('/shop')}>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8 text-[#25D366]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Browse Our Store</h3>
              <p className="text-gray-600">
                Explore our products, add to cart, and send your order directly via WhatsApp
              </p>
              <Button className="bg-[#25D366] hover:bg-[#20BD5A] text-white">
                Shop Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-[#25D366] transition-colors cursor-pointer" onClick={() => navigate('/pricing')}>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="w-8 h-8 text-[#25D366]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Check out our pricing</h3>
              <p className="text-gray-600">
                Browse through our plans and choose the one that fits your business needs
              </p>
              
              <Button  className="bg-[#25D366] hover:bg-[#20BD5A] text-white" onClick={() => navigate('/pricing')} >
                    View Pricing
                    <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm">
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
                    Contact
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
                Start Now!
              </Button>
              <p className="text-xs text-gray-500">Sign up today and start automating your business communications!</p>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-gray-600 text-sm">
            <p>© 2026 Chati Solutions.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
