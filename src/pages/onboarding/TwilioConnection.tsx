// This file is no longer used - Twilio connection has been removed from the onboarding flow
// Keeping as placeholder to avoid import errors
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function TwilioConnection() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to AI setup since Twilio step is removed
    navigate('/onboarding/ai-setup');
  }, [navigate]);
  
  return null;
}
