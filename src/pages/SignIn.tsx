import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function SignIn() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (!isSignIn && !name) {
      setError('Name is required for sign up');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (isSignIn) {
        await login(email, password);
      } else {
        await signup(email, password, name, promoCode);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || (isSignIn ? 'Failed to sign in. Please check your credentials.' : 'Failed to create account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <Link to="/" className="mx-auto w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center hover:bg-[#20BD5A] transition-colors">
            <MessageSquare className="w-6 h-6 text-white" />
          </Link>
          <CardTitle className="text-2xl font-bold">
            {isSignIn ? 'Sign In' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {isSignIn 
              ? 'Welcome back! Sign in to your account'
              : 'Start automating your WhatsApp responses with AI'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSignIn && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isSignIn}
                />
              </div>
            )}
            {!isSignIn && (
              <div className="space-y-2">
                <Label htmlFor="promoCode">Promo Code (Optional)</Label>
                <Input
                  id="promoCode"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
              disabled={loading}
            >
              {loading 
                ? (isSignIn ? 'Signing In...' : 'Creating Account...') 
                : (isSignIn ? 'Sign In' : 'Create Account')
              }
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignIn(!isSignIn);
                setError('');
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {isSignIn ? (
                <>
                  Don't have an account? <span className="text-[#25D366] font-semibold">Sign Up</span>
                </>
              ) : (
                <>
                  Already have an account? <span className="text-[#25D366] font-semibold">Sign In</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
