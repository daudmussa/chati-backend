import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import { 
  Store, 
  MessageSquare, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  BarChart3,
  Search,
  ArrowRight,
  CheckCircle2,
  Zap,
  Menu,
  X,
  ShoppingBag
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/config/api';

export default function ShopLanding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleStoreSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a store name",
        variant: "destructive",
      });
      return;
    }

    const normalizedName = searchQuery.toLowerCase().trim().replace(/\s+/g, '-');
    
    // Check if store exists
    try {
      const response = await fetch(API_ENDPOINTS.STORE_BY_NAME(normalizedName));
      
      if (response.ok) {
        navigate(`/shop/${normalizedName}`);
      } else {
        toast({
          title: "Store Not Found",
          description: "The store you're looking for doesn't exist",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search for store",
        variant: "destructive",
      });
    }
  };

  const features = [
    {
      icon: Store,
      title: "Create Your Store",
      description: "Set up your online store in minutes with our easy-to-use platform",
      color: "text-blue-600"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Integration",
      description: "Connect with customers directly through WhatsApp messaging",
      color: "text-green-600"
    },
    {
      icon: ShoppingCart,
      title: "Shopping Cart",
      description: "Full-featured shopping cart with easy checkout process",
      color: "text-purple-600"
    },
    {
      icon: TrendingUp,
      title: "Sales Analytics",
      description: "Track your sales and understand your business performance",
      color: "text-orange-600"
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Manage customer conversations and bookings in one place",
      color: "text-pink-600"
    },
    {
      icon: BarChart3,
      title: "Real-time Dashboard",
      description: "Monitor your business metrics with live updates",
      color: "text-indigo-600"
    }
  ];

  const benefits = [
    "No technical skills required",
    "Mobile-friendly stores",
    "Secure payment processing",
    "24/7 customer support",
    "Custom store URLs",
    "Product management tools"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Chati Solutions" className="h-8 w-auto object-contain" />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
            >
              Home
            </Button>
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
                  navigate('/');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
              >
                Home
              </button>
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
              <div className="border-t pt-2 space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigate('/onboarding/account');
                    setIsMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
                  onClick={() => {
                    navigate('/onboarding/account');
                    setIsMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <SEO 
          title="Online Store with WhatsApp Integration | Create Your Shop | Chati Solutions"
          description="Create your online store with WhatsApp integration. Sell products, manage inventory, and accept orders through WhatsApp. Perfect for Tanzanian businesses."
          keywords="online store Tanzania, WhatsApp store, create online shop Tanzania, e-commerce Tanzania, WhatsApp shopping, sell products online Tanzania"
          canonical="https://chati.solutions/shop"
        />
        
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-[#25D366] text-white">
            <Zap className="w-3 h-3 mr-1" />
            Powered by Chati Solutions
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your Store, <span className="text-[#25D366]">Simplified</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create and manage your online store with WhatsApp integration. Reach customers where they are.
          </p>

          {/* Store Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <Card className="p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Find a Store
                </CardTitle>
                <CardDescription>
                  Enter a store name to visit their shop
                </CardDescription>
              </CardHeader>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., my-awesome-store"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleStoreSearch()}
                  className="text-lg"
                />
                <Button 
                  onClick={handleStoreSearch}
                  className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
          <p className="text-lg text-gray-600">
            Powerful features to grow your business online
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Why Choose ChatiStore?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#25D366] shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-[#25D366] to-[#20BD5A] text-white border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Selling?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Create your store today and start connecting with customers
            </p>
            <Button 
              onClick={() => navigate('/dashboard')}
              size="lg"
              className="bg-white text-[#25D366] hover:bg-gray-100"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="Chati Solutions" className="h-8 w-auto object-contain" />
              </div>
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
                Start Now
              </Button>
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
