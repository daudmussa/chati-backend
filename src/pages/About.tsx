import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ShoppingBag, Menu, X, Sparkles, ArrowRight, ShieldCheck, Bot, Wallet, CalendarCheck, Settings } from 'lucide-react';
import { useState } from 'react';
import SEO from '@/components/SEO';

/* Shares the design tokens set on the homepage:
   Ink #0B1F17 · Canvas #F5F7F2 · Brand #25D366 · Brand Deep #0E7A43 · Amber #FFA630
   Display 'Bricolage Grotesque' · Body 'Inter' · Mono 'JetBrains Mono' */

export default function About() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const whatWeDo = [
    {
      icon: Bot,
      title: 'AI-powered customer communication',
      description: 'Automate WhatsApp conversations with AI that understands your business and answers customers naturally, 24/7.',
    },
    {
      icon: Wallet,
      title: 'Online sales management',
      description: 'Sell products directly through WhatsApp. Manage inventory, process orders, and take payments in one workflow.',
    },
    {
      icon: CalendarCheck,
      title: 'Service bookings',
      description: 'Accept appointments directly on WhatsApp. Customers book at their convenience, and reminders go out automatically.',
    },
    {
      icon: Settings,
      title: 'Simple & reliable',
      description: 'Easy setup, no technical expertise needed. Focus on your business while the platform handles the conversations.',
    },
  ];

  const whyUs = [
    { title: 'Official & registered', description: 'Registered with BRELA — a legitimate, trusted business operating in Tanzania.' },
    { title: 'AI-powered intelligence', description: 'Built on advanced AI that understands your business context and gives smart, personalized responses.' },
    { title: 'WhatsApp native', description: 'Meet customers where they already are. No app downloads — everything happens on WhatsApp.' },
    { title: 'Affordable & scalable', description: 'Grow from solo entrepreneur to large enterprise. Pricing scales with your needs.' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7F2] font-['Inter'] text-[#0B1F17]">
      <SEO
        title="About Us - Chati Solutions | AI WhatsApp Automation for Tanzania"
        description="Learn about Chati Solutions, the leading AI-powered WhatsApp business automation platform for Tanzanian businesses. Automate customer service, manage online sales, and accept bookings."
        keywords="about Chati Solutions, WhatsApp automation Tanzania, business automation company Tanzania, AI customer service Tanzania"
        canonical="https://chati.solutions/about"
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

          <div className="text-center mb-16 max-w-2xl mx-auto relative">
            <div className="inline-flex items-center gap-2 bg-white border border-[#25D366]/30 text-[#0E7A43] px-3.5 py-1.5 rounded-full text-xs font-semibold font-['JetBrains_Mono'] tracking-wide uppercase mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              Not just another WhatsApp bot
            </div>
            <h1 className="font-['Bricolage_Grotesque'] font-extrabold text-4xl md:text-5xl leading-tight text-[#0B1F17]">
              About Chati Solutions
            </h1>
            <p className="text-lg text-[#4A5850] max-w-xl mx-auto mt-5">
              Automating WhatsApp customer communication with AI and Payments for Tanzanian businesses.
            </p>
          </div>
        </div>

        {/* Who We Are */}
        <Card className="mb-20 border border-black/5 shadow-sm max-w-4xl mx-auto">
          <CardContent className="p-8 md:p-10 space-y-4">
            {/* <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#0E7A43] font-semibold">What we do</span> */}
            {/* <p className="text-lg text-[#0B1F17] font-['Bricolage_Grotesque'] font-medium leading-relaxed">
              Chati Solutions is a registered business name in Tanzania, officially recorded
              with BRELA (Business Registrations and Licensing Agency).
            </p> */}
            <p className="text-base text-[#4A5850] leading-relaxed">
              We help businesses of every size streamline customer communication, boost sales,
              and manage bookings through WhatsApp — the messaging platform their customers
              already trust and use every day.
            </p>
          </CardContent>
        </Card>

        {/* What We Do */}
        <div className="mb-20">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#0E7A43] font-semibold">What we do</span>
            <h2 className="font-['Bricolage_Grotesque'] font-bold text-3xl md:text-4xl text-[#0B1F17] mt-3">
              One platform, four jobs done well
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {whatWeDo.map((item, index) => {
              const Icon = item.icon;
              const tinted = index % 2 === 1;
              return (
                <Card
                  key={item.title}
                  className={`border-0 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                    tinted ? 'bg-[#DCF8C6]/40' : 'bg-white'
                  }`}
                >
                  <CardContent className="pt-7 pb-6 space-y-4">
                    <div className="w-12 h-12 bg-[#0B1F17] rounded-2xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[#25D366]" />
                    </div>
                    <h3 className="text-lg font-bold font-['Bricolage_Grotesque'] text-[#0B1F17]">{item.title}</h3>
                    <p className="text-[#4A5850] text-sm leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-20 bg-[#0B1F17] rounded-3xl px-8 py-14 md:py-16">
          <div className="text-center mb-12 max-w-xl mx-auto">
            <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#25D366] font-semibold">Why choose us</span>
            <h2 className="font-['Bricolage_Grotesque'] font-bold text-3xl md:text-4xl text-white mt-3">
              Built for trust, made for Tanzania
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {whyUs.map((item) => (
              <div key={item.title} className="flex gap-3.5 bg-white/5 rounded-xl px-4 py-4">
                <CheckCircle2 className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-white/60">{item.description}</p>
                </div>
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
              Ready to get started?
            </h2>
            <p className="text-white/70 mt-4 max-w-md mx-auto">
              Join businesses across Tanzania already using Chati Solutions to automate, scale, and succeed.
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
                className="text-base  px-8 py-6 border-white/30 text-black hover:text-white hover:bg-white/10"
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