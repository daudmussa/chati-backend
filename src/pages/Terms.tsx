import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, ShoppingBag, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Terms() {
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="prose prose-gray max-w-none pt-6">
            <div className="space-y-8">
              <div>
                <p className="text-sm text-gray-500 mb-4">Last Updated: January 2024</p>
                <p className="text-gray-600">
                  Welcome to Chati Solutions SaaS. By accessing or using our service, you agree to be bound by these Terms and Conditions.
                </p>
              </div>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Service Description</h2>
                <p className="text-gray-600 mb-3">
                  Chati Solutions SaaS provides automated WhatsApp messaging services, online store management, and booking systems for businesses. Our platform integrates with Twilio and uses AI technology to respond to customer inquiries.
                </p>
                <p className="text-gray-600">
                  The service includes but is not limited to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
                  <li>AI-powered automated WhatsApp responses</li>
                  <li>Product catalog and online store management</li>
                  <li>Appointment booking and scheduling system</li>
                  <li>Conversation history and analytics</li>
                  <li>Multi-tenant business management</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. User Accounts</h2>
                <p className="text-gray-600 mb-3">
                  To use our service, you must create an account and provide accurate, complete information. You are responsible for:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized access</li>
                  <li>Ensuring your Twilio credentials are valid and properly configured</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Acceptable Use</h2>
                <p className="text-gray-600 mb-3">You agree not to:</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Use the service for any illegal or unauthorized purpose</li>
                  <li>Send spam or unsolicited messages through the platform</li>
                  <li>Violate WhatsApp's Terms of Service or Twilio's Acceptable Use Policy</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use the service to harass, abuse, or harm others</li>
                  <li>Transmit viruses, malware, or other malicious code</li>
                  <li>Impersonate any person or entity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Payment and Billing</h2>
                <p className="text-gray-600 mb-3">
                  Our service operates on a subscription basis with different pricing tiers:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Payments are processed monthly or annually based on your selected plan</li>
                  <li>You are responsible for all charges incurred under your account</li>
                  <li>Twilio messaging costs are separate and billed directly by Twilio</li>
                  <li>We reserve the right to change pricing with 30 days notice</li>
                  <li>Refunds are provided on a case-by-case basis</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data and Privacy</h2>
                <p className="text-gray-600 mb-3">
                  We take data privacy seriously:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Your data is stored securely and encrypted</li>
                  <li>We do not share your data with third parties except as required by law</li>
                  <li>Conversation logs are retained for service functionality</li>
                  <li>You retain ownership of all content you create</li>
                  <li>We comply with applicable data protection regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. AI-Generated Content</h2>
                <p className="text-gray-600 mb-3">
                  Our AI service generates automated responses based on your business settings:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>You are responsible for reviewing and configuring AI personality settings</li>
                  <li>We do not guarantee the accuracy of AI-generated responses</li>
                  <li>You should monitor conversations and adjust settings as needed</li>
                  <li>We are not liable for any damages resulting from AI responses</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Service Availability</h2>
                <p className="text-gray-600 mb-3">
                  While we strive for 99.9% uptime:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>We do not guarantee uninterrupted service</li>
                  <li>Scheduled maintenance will be announced in advance</li>
                  <li>We are not liable for service interruptions caused by third parties (Twilio, OpenAI, etc.)</li>
                  <li>You should have backup communication methods in place</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Termination</h2>
                <p className="text-gray-600 mb-3">
                  Either party may terminate the service:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>You may cancel your subscription at any time</li>
                  <li>We may suspend or terminate accounts that violate these terms</li>
                  <li>Upon termination, you will lose access to the service</li>
                  <li>Data may be retained for a limited period after termination</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
                <p className="text-gray-600">
                  To the maximum extent permitted by law, Chati Solutions SaaS shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
                <p className="text-gray-600">
                  We reserve the right to modify these terms at any time. We will notify users of significant changes via email or platform notification. Continued use of the service after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
                <p className="text-gray-600">
                  For questions about these Terms and Conditions, please contact us at:
                </p>
                <p className="text-gray-600 mt-2">
                  Email: legal@whatsappaireply.com<br />
                  Phone: +255 123 456 789
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

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
                  <li>
                    <button onClick={() => navigate('/bookings')} className="text-gray-600 hover:text-[#25D366]">
                      Bookings Demo
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
                  Start Free Trial
                </Button>
                <p className="text-xs text-gray-500">14-day free trial, no credit card required</p>
              </div>
            </div>
            <div className="border-t pt-8 text-center text-gray-600 text-sm">
              <p>© 2024 Chati Solutions. Made for Tanzanian businesses.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
