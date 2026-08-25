import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Phone, MapPin, Send, Menu, X, Sparkles } from 'lucide-react';
import SEO from '@/components/SEO';

/* Shares the design tokens set on the homepage:
   Ink #0B1F17 · Canvas #F5F7F2 · Brand #25D366 · Brand Deep #0E7A43 · Amber #FFA630
   Display 'Bricolage Grotesque' · Body 'Inter' · Mono 'JetBrains Mono' */

export default function Contact() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Message Sent!',
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const contactInfo = [
    { icon: Mail, label: 'Email', value: 'info@chatisolutions.com' },
    { icon: Phone, label: 'Phone', value: '+255 719 958 997' },
    { icon: MapPin, label: 'Office', value: 'Mbezi Beach, Dar es Salaam, Tanzania' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7F2] font-['Inter'] text-[#0B1F17]">
      <SEO
        title="Contact Us - Get in Touch with Chati Solutions | WhatsApp: +255719958997"
        description="Contact Chati Solutions for AI-powered WhatsApp business automation. Phone: +255719958997, Email: info@chatisolutions.com. Get support for your business automation needs."
        keywords="contact Chati Solutions, WhatsApp automation support Tanzania, business automation contact, customer service Tanzania"
        canonical="https://chati.solutions/contact"
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
              We usually reply within a day
            </div>
            <h1 className="font-['Bricolage_Grotesque'] font-extrabold text-4xl md:text-5xl leading-tight text-[#0B1F17]">
              Get in touch
            </h1>
            <p className="text-lg text-[#4A5850] max-w-xl mx-auto mt-5">
              Have questions? We'd love to hear from you — send a message and we'll respond as soon as we can.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div>
            <Card className="border border-black/5 shadow-sm h-full">
              <CardContent className="p-7 space-y-7">
                <div>
                  <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#0E7A43] font-semibold">Reach us directly</span>
                  <h2 className="text-xl font-bold font-['Bricolage_Grotesque'] text-[#0B1F17] mt-1.5">Contact information</h2>
                </div>

                {contactInfo.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-[#0B1F17] rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[#25D366]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0B1F17]">{item.label}</h3>
                        <p className="text-[#4A5850] text-sm mt-0.5">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border border-black/5 shadow-sm">
              <CardContent className="p-7">
                <span className="text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-[#0E7A43] font-semibold">Say hello</span>
                <h2 className="text-xl font-bold font-['Bricolage_Grotesque'] text-[#0B1F17] mt-1.5 mb-6">Send us a message</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[#0B1F17]">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="border-black/10"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#0B1F17]">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="border-black/10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-[#0B1F17]">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+255 123 456 789"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="border-black/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-[#0B1F17]">Subject *</Label>
                      <Input
                        id="subject"
                        placeholder="How can we help?"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="border-black/10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-[#0B1F17]">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="border-black/10"
                      required
                    />
                  </div>

                  <Button disabled type="submit" className="w-full bg-[#25D366] hover:bg-[#0E7A43] text-white font-semibold transition-colors">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-white mt-20">
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