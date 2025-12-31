import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AIPersonality {
  businessDescription: string;
  tone: string;
  sampleReplies: string[];
}

interface OnboardingContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  aiPersonality: AIPersonality | null;
  setAIPersonality: (personality: AIPersonality) => void;
  completeOnboarding: () => void;
  isOnboardingComplete: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [aiPersonality, setAIPersonality] = useState<AIPersonality | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  const completeOnboarding = () => {
    setIsOnboardingComplete(true);
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        aiPersonality,
        setAIPersonality,
        completeOnboarding,
        isOnboardingComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
