import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function Confirmation() {
  const { completeOnboarding } = useOnboarding();
  const navigate = useNavigate();

  const goToDashboard = () => {
    completeOnboarding();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Setup Complete!</CardTitle>
          <CardDescription>
            Your AI assistant is ready to handle WhatsApp messages
          </CardDescription>
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="w-8 h-1 bg-[#25D366] rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
            <div className="w-8 h-1 bg-[#25D366] rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
            <div className="w-8 h-1 bg-[#25D366] rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-green-900">What's Next?</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✓ Account created successfully</li>
              <li>✓ AI personality is configured</li>
              <li>✓ Ready to manage your store and bookings</li>
            </ul>
          </div>

          <Button
            onClick={goToDashboard}
            className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
          >
            Go to Dashboard
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You can modify these settings anytime from your dashboard
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
