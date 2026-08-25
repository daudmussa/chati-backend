import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import SEO from '@/components/SEO';
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
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

/* Shares the design tokens set on the homepage:
   Ink #0B1F17 · Canvas #F5F7F2 · Brand #25D366 · Brand Deep #0E7A43 · Amber #FFA630
   Display 'Bricolage Grotesque' · Body 'Inter' · Mono 'JetBrains Mono' */

export default function Features() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainFeatures = [
    {
      icon: Bot,
      title: 'AI-powered responses',
      description: 'Automated replies that understand context and answer customers naturally, 24/7.',
      benefits: ['Natural language processing', 'Context-aware conversations', 'Multi-language support', 'Custom personality training'],
    },
    {
      icon: ShoppingBag,
      title: 'Online store management',
      description: 'A full e-commerce setup — product catalog, inventory, and checkout, built into WhatsApp.',
      benefits: [
        'Unlimited product listings',
        'Image gallery support',
        'Inventory management',
        'Shopping cart & checkout',
        'Accept mobile money & card payments',
        'Payment transaction history',
      ],
    },
    {
      icon: CalendarCheck,
      title: 'Booking system',
      description: 'Calendar-based scheduling with automatic confirmations and reminders on WhatsApp.',
      benefits: ['Service management', 'Time slot blocking', 'Automated reminders', 'Booking history tracking'],
    },
  ];

  const additionalFeatures = [
    { icon: MessageSquare, title: 'Conversation management', description: 'Every customer conversation in one place, with searchable history.' },
    { icon: BarChart3, title: 'Analytics & insights', description: 'Track message volume, response times, and what is actually selling.' },
    { icon: Clock, title: '24/7 availability', description: 'Never miss an inquiry, even outside business hours.' },
    { icon: Shield, title: 'Secure & compliant', description: 'Encrypted data storage, built to enterprise-grade security standards.' },
    { icon: Zap, title: 'Instant setup', description: 'Get started in minutes with a simple 4-step onboarding wizard.' },
    { icon: Globe, title: 'Multi-language', description: 'Support customers in English, Swahili, and beyond.' },
    { icon: Users, title: 'Multi-tenant', description: 'Manage multiple businesses or locations from a single account.' },
    { icon: Settings, title: 'Customizable AI', description: 'Train the AI on your tone, your FAQs, your brand voice.' },
    { icon: Smartphone, title: 'Mobile optimized', description: 'Fully responsive — works exactly as well on a phone as a laptop.' },
    { icon: TrendingUp, title: 'Built to scale', description: 'Grows with you, from a single duka to a multi-branch business.' },
    { icon: Bell, title: 'Real-time notifications', description: 'Instant alerts for the messages, orders, and bookings that matter.' },
    { icon: Wallet, title: 'Payment processing', description: 'Accept M-Pesa, Airtel Money, Tigo Pesa, Halotel, and card payments from customers.' },
    { icon: Lock, title: 'Data privacy', description: 'Your data is yours. We never share or sell customer information.' },
  ];

  const useCases = [
    { title: 'Retail stores', description: 'Handle product questions, process orders, and support customers automatically.', icon: ShoppingBag },
    { title: 'Service businesses', description: 'Take bookings for salons, clinics, consultations, and appointments.', icon: CalendarCheck },
    { title: 'Restaurants', description: 'Take orders, manage reservations, and answer menu questions instantly.', icon: Package },
    { title: 'Professional services', description: 'Schedule consultations, share information, and qualify leads automatically.', icon: Headphones },
  ];

  const steps = [
    { step: '01', title: 'Create your account', desc: 'Sign up with your business details.' },
    { step: '02', title: 'Choose a plan', desc: 'Pick the package that fits your business.' },
    { step: '03', title: 'Configure your AI', desc: 'Set up your business personality and FAQs.' },
    { step: '04', title: 'Go live', desc: 'Start receiving automated responses on WhatsApp.' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7F2] font-['Inter'] text-[#0B1F17]">
      <SEO
        title="Features - AI WhatsApp Automation, Online Store & Booking System | Chati Solutions"
        description="Explore Chati Solutions features: AI-powered WhatsApp automation, online store management, booking system, staff management, and analytics. Perfect for Tanzanian businesses."
        keywords="WhatsApp AI features, business automation features, online store features, booking system Tanzania, WhatsApp chatbot features, automated customer service"
        canonical="https://chati.solutions/features"
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
      `}</style>

      {/* Header */}
      <header className="border-b border-black/5 bg-[#F5F7F2]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Chati Solutions" className="h-8 w-auto object-contain" />
          </div>

          <div className="hidden md:flex items-center gap-1">
            {[
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
                ['Features', '/features'],
                ['Pricing', '/pricing'],
                ['About', '/about'],
                ['Shop', '/shop'],
                ['Contact', '/contact'],
                ['Sign In', '/signin'],
              ].map(([label, path]) => (
                <button
                  key={path}
                  onClick={() => { navigate(path); setIsMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 hover:bg-black/5 rounded-lg font-medium"
                >
                  {label}
                </button>
              ))}
              <Button
                className="w-full bg-[#0B1F17] hover:bg-[#0E7A43] text-white mt-2"
                onClick={() => { navigate('/onboarding/account'); setIsMenuOpen(false); }}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute top-0 -left-24 w-72 h-72 bg-[#25D366]/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#FFA630]/10 rounded-full blur-3xl" />

          <div className="text-center mb-20 max-w-3xl mx-auto relative">
            <div className="inline-flex items-center gap-2 bg-white border border-[#25D366]/30 text-[#0E7A43] px-3.5 py-1.5 rounded-full text-xs font-semibold font-['JetBrains_Mono'] tracking-wide uppercase mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              All-in-one platform
            </div>
            <h1 className="font-['Bricolage_Grotesque'] font-extrabold text-4xl md:text-5xl leading-tight text-[#0B1F17]">
              Everything you need to automate
              <br />
              <span className="text-[#25D366]">your business communication</span>
            </h1>
            <p className="text-lg text-[#4A5850] max-w-2xl mx-auto mt-5">
              AI-powered messaging, an online store with payments built in, and a booking
              system — combined in one platform made for Tanzanian businesses.
            </p>
          </div>
        </div>

        {/* Main Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 max-w-6xl mx-auto">
          {mainFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border border-black/5 hover:border-[#25D366] shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-14 h-14 bg-[#0B1F17] rounded-2xl flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-[#25D366]" />
                  </div>
                  <CardTitle className="text-2xl font-['Bricolage_Grotesque'] font-bold text-[#0B1F17]">{feature.title}</CardTitle>
                  <CardDescription className="text-base text-[#4A5850]">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {feature.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center text-sm text-[#4A5850]">
                        <div className="w-1.5 h-1.5 bg-[#25D366] rounded-full mr-3 flex-shrink-0" />
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
        <div className="mb-24">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#0E7A43] font-semibold">Down to the details</span>
            <h2 className="font-['Bricolage_Grotesque'] font-bold text-3xl md:text-4xl text-[#0B1F17] mt-3">
              Packed with the features that matter
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {additionalFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const tinted = index % 3 === 1;
              return (
                <Card
                  key={feature.title}
                  className={`border-0 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                    tinted ? 'bg-[#DCF8C6]/40' : 'bg-white'
                  }`}
                >
                  <CardContent className="pt-6 pb-5">
                    <div className="w-12 h-12 bg-[#0B1F17] rounded-2xl flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-[#25D366]" />
                    </div>
                    <h3 className="font-bold font-['Bricolage_Grotesque'] text-[#0B1F17] mb-2">{feature.title}</h3>
                    <p className="text-sm text-[#4A5850]">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-24">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#0E7A43] font-semibold">Built to fit</span>
            <h2 className="font-['Bricolage_Grotesque'] font-bold text-3xl md:text-4xl text-[#0B1F17] mt-3">Perfect for any business</h2>
            <p className="text-[#4A5850] mt-3">Our platform adapts to your industry and business needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {useCases.map((useCase) => {
              const Icon = useCase.icon;
              return (
                <Card key={useCase.title} className="text-center border border-black/5 shadow-sm hover:shadow-lg hover:border-[#25D366] transition-all duration-300">
                  <CardContent className="pt-8 pb-7">
                    <div className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold font-['Bricolage_Grotesque'] text-[#0B1F17] mb-2">{useCase.title}</h3>
                    <p className="text-sm text-[#4A5850]">{useCase.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-24 bg-[#0B1F17] rounded-3xl px-8 py-14 md:py-16">
          <div className="text-center mb-14 max-w-xl mx-auto">
            <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#25D366] font-semibold">From zero to live</span>
            <h2 className="font-['Bricolage_Grotesque'] font-bold text-3xl md:text-4xl text-white mt-3">How it works</h2>
            <p className="text-white/60 mt-3">Get started in four simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-[#25D366] text-[#0B1F17] rounded-full flex items-center justify-center text-sm font-bold font-['JetBrains_Mono'] mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-white mb-1.5">{item.title}</h3>
                <p className="text-sm text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mb-4">
          <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-[#0E7A43] to-[#0B1F17] px-8 py-14 md:py-16 text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-52 h-52 bg-[#FFA630]/20 rounded-full blur-3xl" />
            <ShieldCheck className="w-10 h-10 text-[#25D366] mx-auto mb-5" />
            <h2 className="font-['Bricolage_Grotesque'] font-bold text-3xl md:text-4xl text-white max-w-xl mx-auto">
              Ready to transform your business?
            </h2>
            <p className="text-white/70 mt-4 max-w-md mx-auto">
              Join Tanzanian businesses already using AI to automate customer service, sell products, and manage bookings.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Button
                size="lg"
                className="bg-[#25D366] hover:bg-white hover:text-[#0B1F17] text-[#0B1F17] text-base px-8 py-6 font-semibold transition-colors"
                onClick={() => navigate('/onboarding/account')}
              >
                Start now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 py-6 border-white/30 text-black hover:text-white hover:bg-white/10"
                onClick={() => navigate('/pricing')}
              >
                View pricing
              </Button>
            </div>
          </div>
        </div>
      </div>

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
                <li><button onClick={() => navigate('/contact')} className="text-[#4A5850] hover:text-[#0E7A43]">Contact us</button></li>
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
            <p>© 2026 Chati Solutions. Made for Tanzanian businesses.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}