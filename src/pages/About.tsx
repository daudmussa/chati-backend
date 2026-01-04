import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, MessageSquare, ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";

export default function About() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About Chati Solutions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automating WhatsApp customer communication with AI for Tanzanian businesses
          </p>
        </div>

        {/* Who We Are */}
        <Card className="mb-16 border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Who We Are</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-gray-700">
              {/* Chati Solutions is a registered business name in Tanzania, officially recorded with <strong>BRELA</strong> (Business Registrations and Licensing Agency). */}
            </p>
            <p className="text-lg text-gray-700">
              We empower businesses of all sizes to streamline customer communication, boost sales, and manage bookings effortlessly through WhatsApp—the world's most trusted messaging platform.
            </p>
          </CardContent>
        </Card>

        {/* What We Do */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">What We Do</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Customer Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Automate WhatsApp conversations with intelligent AI that understands your business and responds naturally to customer inquiries 24/7.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Online Sales Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Sell products directly through WhatsApp. Manage inventory, process orders, and handle payments seamlessly integrated into your workflow.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Accept service appointments and bookings directly on WhatsApp. Let customers book at their convenience, and get automated reminders.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Simple & Reliable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Easy setup, no technical expertise needed. Focus on your business while our platform handles customer interactions reliably.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">Why Choose Chati Solutions?</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-[#25D366] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Official & Registered</h3>
                <p className="text-gray-700">Registered with BRELA—a legitimate, trusted business operating in Tanzania.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-[#25D366] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-gray-900">AI-Powered Intelligence</h3>
                <p className="text-gray-700">Uses advanced Claude AI to understand your business context and provide smart, personalized responses.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-[#25D366] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-gray-900">WhatsApp Native</h3>
                <p className="text-gray-700">Meet customers where they already are. No app downloads needed—everything happens on WhatsApp.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-[#25D366] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Affordable & Scalable</h3>
                <p className="text-gray-700">Grow from solo entrepreneurs to large enterprises. Pricing scales with your needs.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-[#25D366] to-[#20BD5A] text-white border-0 mb-16">
          <CardContent className="py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg mb-6 opacity-90 max-w-2xl">
              Join businesses across Tanzania who are already using Chati Solutions to automate, scale, and succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/pricing')}
              >
                View Pricing
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 border-white text-white hover:bg-white/20"
                onClick={() => navigate('/onboarding/account')}
              >
                Start Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
  );
}
