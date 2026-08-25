import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Zap,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  CalendarCheck,
  Menu,
  X,
  Wallet,
  CreditCard,
  Bot,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import SEO from '@/components/SEO';

/* ---------------------------------------------------------
   Design tokens (used inline via Tailwind arbitrary values)
   Ink        #0B1F17  – deep forest-black, dark sections & text
   Canvas     #F5F7F2  – soft sage-white background
   Brand      #25D366  – WhatsApp green (product identity)
   Brand Deep #0E7A43  – shaded green for depth/gradients
   Amber      #FFA630  – mobile-money / energy accent
   Ink Soft   #4A5850  – muted body text on light bg
   Display    'Bricolage Grotesque'
   Body       'Inter'
   Mono/Label 'JetBrains Mono'
---------------------------------------------------------- */

const CHAT_SCRIPT = [
  { from: 'them', text: 'Habari 👋 mna soap ya asili?' },
  { from: 'ai', text: 'Karibu Chati Solutions! Ndiyo, tunayo 🧼 Bei ni TSh 12,000/kipande.' },
  { from: 'them', text: 'Naomba mbili tafadhali' },
  { from: 'ai', text: 'Order imewekwa ✅ Jumla: TSh 24,000. Lipa kwa M-Pesa au kadi hapa 👇' },
  { from: 'system', text: 'Malipo yamepokelewa — TSh 24,000 ✅' },
];

function PhoneDemo() {
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((v) => (v >= CHAT_SCRIPT.length ? 1 : v + 1));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto w-[300px] sm:w-[320px]">
      {/* ambient glow */}
      <div className="absolute -inset-8 bg-gradient-to-br from-[#25D366]/25 via-[#FFA630]/10 to-transparent blur-3xl rounded-full" />

      <div className="relative rounded-[2.5rem] border-[6px] border-[#0B1F17] bg-[#0B1F17] shadow-2xl overflow-hidden">
        {/* status notch */}
        <div className="h-6 bg-[#0B1F17] flex items-center justify-center">
          <div className="w-24 h-4 bg-black rounded-b-xl" />
        </div>

        {/* chat header */}
        <div className="bg-[#0E7A43] px-4 py-3 flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#25D366] border-2 border-[#0E7A43] rounded-full" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight font-['Inter']">Chati Solutions</p>
            <p className="text-white/70 text-[11px] leading-tight font-['Inter']">online · replies in seconds</p>
          </div>
        </div>

        {/* chat body */}
        <div
          className="px-3 py-4 space-y-2 min-h-[360px] flex flex-col justify-end"
          style={{
            backgroundColor: '#EDEDE3',
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(11,31,23,0.06) 1px, transparent 0)',
            backgroundSize: '18px 18px',
          }}
        >
          {CHAT_SCRIPT.slice(0, visible).map((m, i) => {
            if (m.from === 'system') {
              return (
                <div key={i} className="flex justify-center animate-[fadeInUp_0.4s_ease]">
                  <span className="bg-[#25D366] text-white text-xs font-bold font-['Inter'] px-4 py-2 rounded-full shadow-lg shadow-[#25D366]/40 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    {m.text}
                  </span>
                </div>
              );
            }
            const isAi = m.from === 'ai';
            return (
              <div
                key={i}
                className={`flex ${isAi ? 'justify-end' : 'justify-start'} animate-[fadeInUp_0.4s_ease]`}
              >
                <div
                  className={`max-w-[78%] px-3 py-2 text-[13px] leading-snug font-['Inter'] shadow-sm ${
                    isAi
                      ? 'bg-[#DCF8C6] text-[#0B1F17] rounded-2xl rounded-tr-sm'
                      : 'bg-white text-[#0B1F17] rounded-2xl rounded-tl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* input bar (decorative) */}
        <div className="bg-[#F0F0E8] px-3 py-2.5 flex items-center gap-2 border-t border-black/5">
          <div className="flex-1 bg-white rounded-full h-8 px-3 flex items-center">
            <span className="text-[11px] text-[#4A5850]/60 font-['Inter']">Andika ujumbe...</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Chati Solutions - AI-Powered WhatsApp Business Automation',
    description:
      'Automate your WhatsApp customer service 24/7 with AI. Manage online store, accept mobile money & card payments, and grow your Tanzanian business.',
    url: 'https://chati.solutions/',
    mainEntity: {
      '@type': 'Service',
      name: 'WhatsApp Business Automation',
      provider: { '@type': 'Organization', name: 'Chati Solutions' },
      areaServed: 'Tanzania',
      serviceType: 'Business Automation',
    },
  };

  const features = [
    { icon: Wallet, title: 'Get paid on the spot', description: 'M-Pesa, Tigo Pesa, Airtel Money, Halotel, and card payments, confirmed automatically, no waiting, no chasing.' },
    { icon: Zap, title: 'Instant AI replies', description: 'Every customer gets an answer in seconds, day, night, weekends, holidays.' },
    { icon: ShoppingBag, title: 'A store inside the chat', description: 'Customers browse, add to cart, and check out without leaving WhatsApp.' },
    { icon: CalendarCheck, title: 'Bookings that confirm themselves', description: 'Appointments and services get scheduled and confirmed with no back-and-forth.' },
    { icon: TrendingUp, title: 'One dashboard, the full picture', description: 'Orders, payments, and conversations, tracked in one place, not five.' },
  ];

  const paymentBadges = [
    { name: 'M-Pesa', color: '#25D366' },
    { name: 'Tigo Pesa', color: '#1E88E5' },
    { name: 'Airtel Money', color: '#E4392E' },
    { name: 'Halotel', color: '#E85D2C' },
    { name: 'Visa / Mastercard', color: '#0B1F17' },
  ];

  const steps = [
    { title: 'Create your account', detail: 'Pick a plan that fits your business, start free, upgrade any time.' },
    { title: 'Connect your store and payments', detail: 'Add products, set up your AI assistant, link your payment gateway.' },
    { title: 'Go live on WhatsApp', detail: 'Share your number. Chati handles the conversations, orders, and payments.' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7F2] font-['Inter'] text-[#0B1F17]">
      <SEO structuredData={structuredData} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floaty { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .float-slow { animation: floaty 6s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <header className="border-b border-black/5 bg-[#F5F7F2]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
            <Button
              variant="outline"
              className="ml-2 border-[#0B1F17]/15"
              onClick={() => navigate('/signin')}
            >
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-20 -left-24 w-72 h-72 bg-[#25D366]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FFA630]/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="space-y-7 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white border border-[#25D366]/30 text-[#0E7A43] px-3.5 py-1.5 rounded-full text-xs font-semibold font-['JetBrains_Mono'] tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Transforming Businesses with WhatsApp AI & Payments
              </div>

              <h1 className="font-['Bricolage_Grotesque'] font-extrabold text-5xl md:text-6xl leading-[1.05] text-[#0B1F17]">
                Your WhatsApp,
                <br />
                wide <span className="text-[#25D366]">awake.</span>
              </h1>

              <p className="text-lg text-[#4A5850] max-w-xl mx-auto md:mx-0">
                Chati replies to customers, takes their orders, and gets you paid
                in Kiswahili or English, day and night, without hiring extra staff.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Button
                  size="lg"
                  className="bg-[#25D366] hover:bg-[#0E7A43] text-white text-base px-7 py-6 font-semibold shadow-lg shadow-[#25D366]/25 transition-colors"
                  onClick={() => navigate('/onboarding/account')}
                >
                  Start free: 10 min setup
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-7 py-6 border-[#0B1F17]/15"
                  onClick={() => navigate('/features')}
                >
                  See how it works
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 pt-2 font-['JetBrains_Mono'] text-xs text-[#4A5850] uppercase tracking-wide">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" /> 24/7 replies</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" /> Multiple ways to get paid</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" /> No card required</span>
              </div>
            </div>

            <div className="float-slow">
              <PhoneDemo />
            </div>
          </div>

          {/* payment methods strip */}
          <div className="max-w-4xl mx-auto mt-16 pt-8 border-t border-black/5">
            <p className="text-center text-sm font-semibold text-[#0B1F17] mb-1">
              Money in your pocket, not just messages in your inbox
            </p>
            <p className="text-center text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#4A5850]/70 mb-5">
              Every order can be paid for, instantly, right in the chat
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {paymentBadges.map((p) => (
                <span
                  key={p.name}
                  className="flex items-center gap-2 bg-white border border-black/5 px-4 py-2.5 rounded-full text-sm font-semibold text-[#0B1F17] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#0E7A43] font-semibold">What Chati handles for you</span>
          <h2 className="font-['Bricolage_Grotesque'] font-bold text-3xl md:text-4xl text-[#0B1F17] mt-3">
            Everything a shopfront needs, running in the background
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isLead = index === 0;
            const tinted = index % 2 === 1;
            return (
              <Card
                key={index}
                className={`border-0 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                  isLead
                    ? 'bg-gradient-to-br from-[#25D366] to-[#0E7A43] sm:col-span-2 lg:col-span-1 ring-2 ring-[#25D366]/40'
                    : tinted
                    ? 'bg-[#DCF8C6]/40'
                    : 'bg-white'
                }`}
              >
                <CardContent className="pt-7 pb-6 space-y-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLead ? 'bg-white/20' : 'bg-[#0B1F17]'}`}>
                    <Icon className={`w-6 h-6 ${isLead ? 'text-white' : 'text-[#25D366]'}`} />
                  </div>
                  <h3 className={`text-lg font-bold font-['Bricolage_Grotesque'] ${isLead ? 'text-white' : 'text-[#0B1F17]'}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isLead ? 'text-white/85' : 'text-[#4A5850]'}`}>{feature.description}</p>
                  {isLead && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {paymentBadges.map((p) => (
                        <span key={p.name} className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wide bg-white/15 text-white px-2 py-1 rounded-full">
                          {p.name}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Get Paid — dedicated payments spotlight */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[#DCF8C6]/50 to-transparent">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="space-y-6 order-2 md:order-1">
              <div className="inline-flex items-center gap-2 bg-[#25D366] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold font-['JetBrains_Mono'] tracking-wide uppercase">
                <Wallet className="w-3.5 h-3.5" />
                Get paid instantly
              </div>
              <h2 className="font-['Bricolage_Grotesque'] font-extrabold text-3xl md:text-5xl leading-tight text-[#0B1F17]">
                Get paid without leaving the chat.
              </h2>
              <p className="text-lg text-[#4A5850] max-w-lg">
                Customers pay right where they order with M-Pesa, Tigo Pesa, Airtel Money,
                Halotel, or card. You get an automatic confirmation the moment it lands, no checking your phone every five minutes.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  'Payment requests sent automatically at checkout',
                  'Instant confirmation the moment money arrives',
                  'Every payment logged against its order, no spreadsheets',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3 text-[#0B1F17] font-medium">
                    <CheckCircle2 className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                    {line}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="bg-[#0B1F17] hover:bg-[#0E7A43] text-white text-base px-7 py-6 font-semibold transition-colors"
                onClick={() => navigate('/pricing')}
              >
                See payment plans
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* receipt visual */}
            <div className="order-1 md:order-2 relative">
              <div className="absolute -inset-10 bg-[#25D366]/15 blur-3xl rounded-full" />
              <div className="relative bg-white rounded-3xl shadow-2xl p-7 max-w-sm mx-auto border border-black/5">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#4A5850]">Payment received</span>
                  <span className="w-9 h-9 rounded-full bg-[#DCF8C6] flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-[#0E7A43]" />
                  </span>
                </div>

                <p className="font-['JetBrains_Mono'] text-4xl font-bold text-[#0B1F17]">TSh 24,000</p>
                <p className="text-sm text-[#4A5850] mt-1">Order #1042 · Natural soap x2</p>

                <div className="h-px bg-black/5 my-5" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#4A5850]">Paid via</span>
                    <span className="font-semibold text-[#0B1F17] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#25D366]" /> M-Pesa
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A5850]">Confirmed</span>
                    <span className="font-semibold text-[#0B1F17]">Instantly</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A5850]">Status</span>
                    <span className="font-semibold text-[#0E7A43]">Settled ✅</span>
                  </div>
                </div>

                <div className="mt-6 bg-[#F5F7F2] rounded-xl px-4 py-3 flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-[#0E7A43] flex-shrink-0" />
                  <p className="text-xs text-[#4A5850]">Customer notified automatically on WhatsApp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[#0B1F17] py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#25D366] font-semibold">From zero to live</span>
            <h2 className="font-['Bricolage_Grotesque'] font-bold text-3xl md:text-4xl text-white mt-3">
              Three steps. About ten minutes.
            </h2>
          </div>

          <div className="max-w-2xl mx-auto relative">
            <div className="absolute left-6 top-2 bottom-2 w-px bg-white/10" />
            <div className="space-y-10">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-5 relative">
                  <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0 font-['JetBrains_Mono'] font-bold text-[#0B1F17] relative z-10">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="pt-1.5">
                    <p className="text-lg font-semibold text-white font-['Bricolage_Grotesque']">{step.title}</p>
                    <p className="text-white/60 text-sm mt-1">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-14">
            <Button
              size="lg"
              className="bg-[#25D366] hover:bg-white hover:text-[#0B1F17] text-[#0B1F17] text-base px-8 py-6 font-semibold transition-colors"
              onClick={() => navigate('/onboarding/account')}
            >
              Start now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Explore */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#0E7A43] font-semibold">See it for yourself</span>
          <h2 className="font-['Bricolage_Grotesque'] font-bold text-3xl md:text-4xl text-[#0B1F17] mt-3">Explore our services</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: ShoppingBag, title: 'Browse our store', desc: 'See the buying experience your customers get cart to checkout, on WhatsApp.', cta: 'Shop now', path: '/shop' },
            { icon: CreditCard, title: 'View our plans', desc: 'From AI replies to a full store with payments, pick what fits your business.', cta: 'View pricing', path: '/pricing' },
            { icon: Bot, title: 'AI-powered automation', desc: 'Watch how conversations, bookings, and orders run themselves, 24/7.', cta: 'Learn more', path: '/features' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <Card
                key={i}
                className="border border-black/5 hover:border-[#25D366] shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="pt-8 pb-7 text-center space-y-4">
                  <div className="w-14 h-14 bg-[#DCF8C6] rounded-2xl flex items-center justify-center mx-auto group-hover:bg-[#25D366] transition-colors">
                    <Icon className="w-7 h-7 text-[#0E7A43] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold font-['Bricolage_Grotesque'] text-[#0B1F17]">{item.title}</h3>
                  <p className="text-[#4A5850] text-sm">{item.desc}</p>
                  <Button variant="ghost" className="text-[#0E7A43] font-semibold hover:bg-[#DCF8C6]/50">
                    {item.cta}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="container mx-auto px-4 pb-20 md:pb-28">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-[#0E7A43] to-[#0B1F17] px-8 py-14 md:py-16 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-52 h-52 bg-[#FFA630]/20 rounded-full blur-3xl" />
          <ShieldCheck className="w-10 h-10 text-[#25D366] mx-auto mb-5" />
          <h2 className="font-['Bricolage_Grotesque'] font-bold text-3xl md:text-4xl text-white max-w-xl mx-auto">
            Ready to let WhatsApp work harder for you?
          </h2>
          <p className="text-white/70 mt-4 max-w-md mx-auto">
            Set up your AI assistant, store, and payments today, no developer needed.
          </p>
          <Button
            size="lg"
            className="bg-[#25D366] hover:bg-white hover:text-[#0B1F17] text-[#0B1F17] text-base px-8 py-6 font-semibold mt-8 transition-colors"
            onClick={() => navigate('/onboarding/account')}
          >
            Get started free
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
                processing ,everything a growing business needs, in one chat.
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
