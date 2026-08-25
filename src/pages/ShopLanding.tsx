import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Sparkles,
  Menu,
  X,
  ShoppingBag,
  ChevronRight,
  CreditCard,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/config/api';

interface StoreItem {
  storeName: string;
  storeId: string;
  storePhone: string;
}

/* Shares the design tokens set on the homepage:
   Ink #0B1F17 · Canvas #F5F7F2 · Brand #25D366 · Brand Deep #0E7A43 · Amber #FFA630
   Display 'Bricolage Grotesque' · Body 'Inter' · Mono 'JetBrains Mono' */

export default function ShopLanding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [latestStores, setLatestStores] = useState<StoreItem[]>([]);

  useEffect(() => {
    fetchLatestStores();
  }, []);

  const fetchLatestStores = async () => {
    try {
      console.log('[ShopLanding] Fetching latest stores...');
      const response = await fetch(API_ENDPOINTS.STORES_LIST(2));
      console.log('[ShopLanding] Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[ShopLanding] Stores data:', data);
        setLatestStores(data);
      } else {
        const err = await response.text();
        console.error('[ShopLanding] Failed to fetch stores:', err);
      }
    } catch (error) {
      console.error('[ShopLanding] Failed to fetch stores:', error);
    }
  };

  const handleStoreSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a store name',
        variant: 'destructive',
      });
      return;
    }

    const normalizedName = searchQuery.toLowerCase().trim().replace(/\s+/g, '-');

    try {
      const response = await fetch(API_ENDPOINTS.STORE_BY_NAME(normalizedName));

      if (response.ok) {
        navigate(`/shop/${normalizedName}`);
      } else {
        toast({
          title: 'Store Not Found',
          description: "The store you're looking for doesn't exist",
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search for store',
        variant: 'destructive',
      });
    }
  };

  const features = [
    { icon: Store, title: 'Create your store', description: 'Set up your online store in minutes — no code, no designer needed.' },
    { icon: MessageSquare, title: 'WhatsApp integration', description: 'Every product links straight back to a conversation with you.' },
    { icon: ShoppingCart, title: 'Built-in shopping cart', description: 'Customers browse, add to cart, and check out without leaving the chat.' },
    { icon: Wallet, title: 'Accept real payments', description: 'M-Pesa, Tigo Pesa, Airtel Money, Halotel, and card — confirmed automatically.' },
    { icon: TrendingUp, title: 'Sales analytics', description: 'See what is selling and what is not, without digging through chats.' },
    { icon: Users, title: 'Customer management', description: 'Conversations, orders, and bookings, all under one roof.' },
    { icon: BarChart3, title: 'Live dashboard', description: 'Watch orders and payments update in real time as they happen.' },
  ];

  const benefits = [
    'No technical skills required',
    'Mobile-friendly stores',
    'Secure payment processing',
    '24/7 customer support',
    'Custom store URLs',
    'Product management tools',
  ];

  const paymentBadges = [
    { name: 'M-Pesa', color: '#25D366' },
    { name: 'Tigo Pesa', color: '#1E88E5' },
    { name: 'Airtel Money', color: '#E4392E' },
    { name: 'Halotel', color: '#E85D2C' },
    { name: 'Visa / Mastercard', color: '#0B1F17' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7F2] font-['Inter'] text-[#0B1F17]">
      <SEO
        title="Online Store with WhatsApp Integration | Create Your Shop | Chati Solutions"
        description="Create your online store with WhatsApp integration. Sell products, manage inventory, and accept orders through WhatsApp. Perfect for Tanzanian businesses."
        keywords="online store Tanzania, WhatsApp store, create online shop Tanzania, e-commerce Tanzania, WhatsApp shopping, sell products online Tanzania"
        canonical="https://chati.solutions/shop"
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
      `}</style>

      {/* Header */}
      <header className="border-b border-black/5 bg-[#F5F7F2]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Chati Solutions" className="h-8 w-auto object-contain" />
          </div>

          <div className="hidden md:flex items-center gap-1">
            {[
              ['Home', '/'],
              ['Features', '/features'],
              ['Pricing', '/pricing'],
              ['About', '/about'],
              ['Shop', '/shop'],
              ['Contact', '/contact'],
            ].map(([label, path]) => (
              <Button
                key={path}
                variant="ghost"
                className="font-['Inter'] font-medium text-[#0B1F17]/80 hover:text-[#0B1F17] hover:bg-black/5"
                onClick={() => navigate(path)}
              >
                {label}
              </Button>
            ))}
            <Button variant="outline" className="ml-2 border-[#0B1F17]/15" onClick={() => navigate('/signin')}>
              Sign In
            </Button>
            <Button
              className="bg-[#0B1F17] hover:bg-[#0E7A43] text-white font-medium transition-colors"
              onClick={() => navigate('/onboarding/account')}
            >
              Get Started
            </Button>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-black/5 bg-[#F5F7F2]">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {[
                ['Home', '/'],
                ['Features', '/features'],
                ['Pricing', '/pricing'],
                ['About', '/about'],
                ['Shop', '/shop'],
                ['Contact', '/contact'],
              ].map(([label, path]) => (
                <button
                  key={path}
                  onClick={() => { navigate(path); setIsMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 hover:bg-black/5 rounded-lg font-medium"
                >
                  {label}
                </button>
              ))}
              <div className="pt-2 space-y-2">
                <Button variant="outline" className="w-full border-[#0B1F17]/15" onClick={() => { navigate('/signin'); setIsMenuOpen(false); }}>
                  Sign In
                </Button>
                <Button
                  className="w-full bg-[#0B1F17] hover:bg-[#0E7A43] text-white"
                  onClick={() => { navigate('/onboarding/account'); setIsMenuOpen(false); }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-10 -left-24 w-72 h-72 bg-[#25D366]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FFA630]/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-16 md:py-20 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-white border border-[#25D366]/30 text-[#0E7A43] px-3.5 py-1.5 rounded-full text-xs font-semibold font-['JetBrains_Mono'] tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Your storefront, live on WhatsApp
            </div>

            <h1 className="font-['Bricolage_Grotesque'] font-extrabold text-5xl md:text-6xl leading-[1.05] text-[#0B1F17]">
              Your store, <span className="text-[#25D366]">wide open.</span>
            </h1>

            <p className="text-lg text-[#4A5850] max-w-xl mx-auto">
              Create and manage your online store with WhatsApp built in. Browse a live
              store below, or open your own in minutes.
            </p>

            {/* Store Search */}
            <div className="max-w-xl mx-auto pt-4">
              <Card className="p-6 border border-black/5 shadow-sm text-left">
                <CardHeader className="p-0 mb-4">
                  <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#0E7A43] font-semibold">
                    Find a store
                  </span>
                  <CardTitle className="text-lg flex items-center gap-2 font-['Bricolage_Grotesque'] mt-1">
                    <Search className="w-5 h-5 text-[#0E7A43]" />
                    Look up a shop by name
                  </CardTitle>
                  <CardDescription className="text-[#4A5850]">
                    Enter a store name to visit their shop
                  </CardDescription>
                </CardHeader>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., my-awesome-store"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleStoreSearch()}
                    className="text-base border-black/10"
                  />
                  <Button onClick={handleStoreSearch} className="bg-[#25D366] hover:bg-[#0E7A43] text-white font-medium transition-colors">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </Card>
            </div>

            {/* Latest Stores */}
            {latestStores.length > 0 && (
              <div className="max-w-2xl mx-auto pt-8 text-left">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold font-['Bricolage_Grotesque'] text-[#0B1F17]">Available stores</h2>
                  <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#4A5850]/70">Latest</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {latestStores.map((store) => (
                    <Card
                      key={store.storeName}
                      className="cursor-pointer border border-black/5 hover:border-[#25D366] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                      onClick={() => navigate(`/shop/${store.storeName}`)}
                    >
                      <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#0B1F17] flex items-center justify-center flex-shrink-0">
                            <Store className="w-6 h-6 text-[#25D366]" />
                          </div>
                          <div>
                            <p className="text-base font-semibold text-[#0B1F17]">{store.storeName}</p>
                            <p className="text-sm text-[#4A5850]">Visit store →</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#4A5850]/50" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className="max-w-2xl mx-auto pt-8">
              <Card className="border border-[#25D366]/20 bg-[#DCF8C6]/40">
                <CardContent className="p-6 text-left">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#25D366] flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold font-['Bricolage_Grotesque'] text-[#0B1F17]">Stores accept real payments</h3>
                      <p className="text-sm text-[#4A5850] mt-1">
                        Many stores on Chati take mobile money or card right at checkout —
                        look for the payment option when you order.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {paymentBadges.map((p) => (
                      <span
                        key={p.name}
                        className="flex items-center gap-1.5 bg-white border border-black/5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#0B1F17] shadow-sm"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#0E7A43] font-semibold">
            Everything you need
          </span>
          <h2 className="font-['Bricolage_Grotesque'] font-bold text-3xl md:text-4xl text-[#0B1F17] mt-3">
            Powerful features to grow your business online
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const tinted = index % 2 === 1;
            return (
              <Card
                key={index}
                className={`border-0 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                  tinted ? 'bg-[#DCF8C6]/40' : 'bg-white'
                }`}
              >
                <CardContent className="pt-7 pb-6 space-y-4">
                  <div className="w-12 h-12 bg-[#0B1F17] rounded-2xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#25D366]" />
                  </div>
                  <h3 className="text-lg font-bold font-['Bricolage_Grotesque'] text-[#0B1F17]">{feature.title}</h3>
                  <p className="text-[#4A5850] text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-[#0B1F17] py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#25D366] font-semibold">
              Why sell on Chati
            </span>
            <h2 className="font-['Bricolage_Grotesque'] font-bold text-3xl md:text-4xl text-white mt-3">
              Built so you can focus on the business, not the tech
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3.5">
                <CheckCircle2 className="w-5 h-5 text-[#25D366] flex-shrink-0" />
                <span className="text-white/90 font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-[#0E7A43] to-[#0B1F17] px-8 py-14 md:py-16 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-52 h-52 bg-[#FFA630]/20 rounded-full blur-3xl" />
          <ShieldCheck className="w-10 h-10 text-[#25D366] mx-auto mb-5" />
          <h2 className="font-['Bricolage_Grotesque'] font-bold text-3xl md:text-4xl text-white max-w-xl mx-auto">
            Ready to start selling?
          </h2>
          <p className="text-white/70 mt-4 max-w-md mx-auto">
            Create your store today and start connecting with customers on WhatsApp.
          </p>
          <Button
            size="lg"
            className="bg-[#25D366] hover:bg-white hover:text-[#0B1F17] text-[#0B1F17] text-base px-8 py-6 font-semibold mt-8 transition-colors"
            onClick={() => navigate('/dashboard')}
          >
            Get started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-white">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <img src="/logo.png" alt="Chati Solutions" className="h-8 w-auto object-contain mb-4" />
              <p className="text-[#4A5850] text-sm leading-relaxed">
                AI-powered WhatsApp replies, an online store, and payment
                processing — everything a growing business needs, in one chat.
              </p>
            </div>
            <div>
              <h4 className="font-['Bricolage_Grotesque'] font-bold text-[#0B1F17] mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => navigate('/features')} className="text-[#4A5850] hover:text-[#0E7A43]">Features</button></li>
                <li><button onClick={() => navigate('/pricing')} className="text-[#4A5850] hover:text-[#0E7A43]">Pricing</button></li>
                <li><button onClick={() => navigate('/shop')} className="text-[#4A5850] hover:text-[#0E7A43]">Store demo</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-['Bricolage_Grotesque'] font-bold text-[#0B1F17] mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => navigate('/about')} className="text-[#4A5850] hover:text-[#0E7A43]">About</button></li>
                <li><button onClick={() => navigate('/contact')} className="text-[#4A5850] hover:text-[#0E7A43]">Contact</button></li>
                <li><button onClick={() => navigate('/terms')} className="text-[#4A5850] hover:text-[#0E7A43]">Terms & Conditions</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-['Bricolage_Grotesque'] font-bold text-[#0B1F17] mb-4">Get started</h4>
              <Button
                className="w-full bg-[#0B1F17] hover:bg-[#0E7A43] text-white mb-3"
                onClick={() => navigate('/onboarding/account')}
              >
                Start now
              </Button>
              <p className="text-xs text-[#4A5850]">Sign up today and let WhatsApp start selling for you.</p>
            </div>
          </div>
          <div className="border-t border-black/5 pt-7 text-center text-[#4A5850] text-sm">
            <p>© 2026 Chati Solutions.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}