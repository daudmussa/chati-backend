import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SEO from '@/components/SEO';
import {
  Check,
  X,
  MessageSquare,
  TrendingUp,
  ShoppingBag,
  Menu,
  X as XIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Pricing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const plans = [
    {
      name: 'Store Lite',
      icon: ShoppingBag,
      price: '25,000',
      description: 'Showcase products and receive orders through WhatsApp',
      features: [
        'Product catalog',
        'Product images',
        'Product descriptions',
        'Customers browse products',
        'Orders/inquiries sent to WhatsApp',
        'Basic order management',
      ],
      notIncluded: [
        'No payment features',
        'No AI assistant',
      ],
      cta: 'Start now',
      popular: false,
    },
    {
      name: 'Business',
      icon: Wallet,
      price: '30,000',
      description: 'Sell and track payments',
      features: [
        'Everything in Store Lite',
        'Payment tracking',
        'Paid/unpaid order status',
        'Payment records',
        'Sales tracking',
        'Customer order history',
        '2,000 AI customer chats / month',
      ],
      notIncluded: [],
      cta: 'Get started',
      popular: false,
    },
    {
      name: 'Starter',
      icon: MessageSquare,
      price: '25,000',
      description: 'AI-powered customer support',
      features: [
        'AI WhatsApp assistant',
        'Personal inbox',
        'Customer management',
        'Basic analytics',
        '500 AI customer chats / month',
        'Basic automation',
      ],
      notIncluded: [],
      cta: 'Get started',
      popular: true,
    },
  ];

  const aiAddOns = [
    { label: '1,000 extra AI customer chats', price: '30,000' },
    { label: '5,000 extra AI customer chats', price: '100,000' },
  ];

  const faqs = [
    { question: 'Can I switch plans later?', answer: 'Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.' },
    { question: 'What payment methods do you accept?', answer: 'We accept M-Pesa, Airtel Money, Tigo Pesa, Halotel, for Tanzanian businesses.' },
    { question: 'Can I cancel anytime?', answer: "Yes, you can cancel your subscription at any time. You'll keep access until the end of your billing period." },
    { question: 'How do AI customer chats work?', answer: 'Each AI customer chat counts as one conversation session with a customer. When you exceed your monthly limit, you can purchase additional AI chat bundles.' },
    { question: 'Do unused AI chats roll over?', answer: 'No, unused AI customer chats do not roll over to the next month. You can purchase extra AI chat bundles that add to your monthly limit.' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7F2] font-['Inter'] text-[#0B1F17]">
      <SEO
        title="Pricing - WhatsApp Business Automation Plans | Chati Solutions Tanzania"
        description="Affordable WhatsApp business pricing. Store Lite TSh 25K/mo, Business TSh 30K/mo, AI Chat TSh 25K/mo. AI, store, payments."
        keywords="WhatsApp automation pricing Tanzania, business automation cost, WhatsApp chatbot price Tanzania, affordable business automation, online store pricing Tanzania"
        canonical="https://chati.solutions/pricing"
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
            {isMenuOpen ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
              No hidden fees
            </div>
            <h1 className="font-['Bricolage_Grotesque'] font-extrabold text-4xl md:text-5xl leading-tight text-[#0B1F17]">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-[#4A5850] max-w-xl mx-auto mt-5">
              Choose the plan that fits your business. Upgrade anytime.
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`relative shadow-sm transition-all duration-300 flex flex-col ${
                  plan.popular ? 'border-2 border-[#25D366] shadow-xl lg:-translate-y-2' : 'border border-black/5 hover:border-[#25D366]/40'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#25D366] text-white text-xs font-semibold font-['JetBrains_Mono'] uppercase tracking-wide px-3 py-1 rounded-full">
                    Most popular
                  </span>
                )}
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="w-12 h-12 bg-[#0B1F17] rounded-2xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#25D366]" />
                  </div>
                  <h3 className="text-xl font-bold font-['Bricolage_Grotesque'] text-[#0B1F17]">{plan.name}</h3>
                  <p className="text-sm text-[#4A5850] mt-1 mb-4">{plan.description}</p>
                  <div className="mb-5">
                    <span className="text-3xl font-bold font-['Bricolage_Grotesque'] text-[#0B1F17]">TSh {plan.price}</span>
                    <span className="text-[#4A5850] text-sm">/month</span>
                  </div>
                  <Button
                    className={`w-full mb-5 font-semibold ${
                      plan.popular
                        ? 'bg-[#25D366] hover:bg-[#0E7A43] text-white'
                        : 'bg-white border border-[#0B1F17]/15 text-[#0B1F17] hover:bg-black/5'
                    }`}
                    onClick={() => (isAuthenticated ? navigate('/billing') : navigate('/onboarding/account'))}
                  >
                    {plan.cta}
                  </Button>
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-[#4A5850]">
                        <Check className="w-4 h-4 text-[#25D366] mr-2.5 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {plan.notIncluded.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-black/5 space-y-2">
                      {plan.notIncluded.map((item, index) => (
                        <li key={index} className="flex items-start text-sm text-[#B91C1C] list-none">
                          <X className="w-4 h-4 text-[#B91C1C] mr-2.5 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional AI Chats */}
        <div className="mb-20 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-['Bricolage_Grotesque'] font-bold text-2xl md:text-3xl text-[#0B1F17]">Additional AI chats</h2>
            <p className="text-[#4A5850] mt-2">Need more AI usage? Add extra customer chats to your plan.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiAddOns.map((addon) => (
              <Card key={addon.label} className="border border-black/5 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0B1F17] rounded-xl flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-[#25D366]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0B1F17]">{addon.label}</p>
                      <p className="text-2xl font-bold font-['Bricolage_Grotesque'] text-[#0B1F17] mt-0.5">TSh {addon.price}<span className="text-sm font-normal text-[#4A5850]">/month</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="text-center mb-12">
            <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#0E7A43] font-semibold">Questions</span>
            <h2 className="font-['Bricolage_Grotesque'] font-bold text-3xl text-[#0B1F17] mt-3">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <Card key={index} className="border border-black/5 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-bold font-['Bricolage_Grotesque'] text-[#0B1F17] mb-1.5">{faq.question}</h3>
                  <p className="text-sm text-[#4A5850] leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
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
              Start now — the onboarding is simple, and you can be live on WhatsApp today.
            </p>
            <Button
              size="lg"
              className="bg-[#25D366] hover:bg-white hover:text-[#0B1F17] text-[#0B1F17] text-base px-8 py-6 font-semibold mt-8 transition-colors"
              onClick={() => navigate('/onboarding/account')}
            >
              Start now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
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
