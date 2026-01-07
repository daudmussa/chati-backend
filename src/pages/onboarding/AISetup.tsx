import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/config/api';

export default function AISetup() {
  const [businessDescription, setBusinessDescription] = useState('');
  const [tone, setTone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { setAIPersonality, setCurrentStep } = useOnboarding();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessDescription || !tone) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Save to backend business settings
      const response = await fetch(API_ENDPOINTS.BUSINESS_SETTINGS, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          businessDescription,
          tone,
          sampleReplies: [
            'Thank you for contacting us! How can we help you today?',
            'We appreciate your interest in our products!',
          ],
          keywords: []
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setAIPersonality({
        businessDescription,
        tone,
        sampleReplies: [],
      });
      setCurrentStep(3);
      
      toast({
        title: "AI Settings Saved",
        description: "Your business information has been configured successfully",
      });
      
      navigate('/onboarding/confirmation');
    } catch (err) {
      setError('Failed to save AI settings. Please try again.');
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">AI Personality Setup</CardTitle>
          <CardDescription>
            Teach the AI how to respond like your business
          </CardDescription>
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="w-8 h-1 bg-[#25D366] rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
            <div className="w-8 h-1 bg-[#25D366] rounded-full" />
            <div className="w-8 h-1 bg-gray-200 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="businessDescription">Business Description *</Label>
              <Textarea
                id="businessDescription"
                placeholder="Describe your business, products/services, and what makes you unique..."
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                This helps the AI understand your business context
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Response Tone *</Label>
              <Select value={tone} onValueChange={setTone} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tone" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="z-50">
                  <SelectItem value="professional">Professional & Formal</SelectItem>
                  <SelectItem value="friendly">Friendly & Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                  <SelectItem value="helpful">Helpful & Supportive</SelectItem>
                  <SelectItem value="concise">Concise & Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/onboarding/account')}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-white"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Continue'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
