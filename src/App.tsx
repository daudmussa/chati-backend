import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { Toaster } from "./components/ui/toaster";

// Pages
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import AccountCreation from "./pages/onboarding/AccountCreation";
import AISetup from "./pages/onboarding/AISetup";
import Confirmation from "./pages/onboarding/Confirmation";
import Dashboard from "./pages/Dashboard";
import Conversations from "./pages/Conversations";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import Store from "./pages/Store";
import Bookings from "./pages/Bookings";
import Admin from "./pages/Admin";
import CustomerStore from "./pages/CustomerStore";
import ShopLanding from "./pages/ShopLanding";
import Cart from "./pages/Cart";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import About from "./pages/About";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
}

function FeatureProtectedRoute({ children, featureId }: { children: React.ReactNode; featureId: string }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  // Check if user has access to this feature
  const hasAccess = user?.enabledFeatures?.includes(featureId) ?? true;
  
  if (!hasAccess) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/onboarding/account" element={<AccountCreation />} />
            <Route path="/onboarding/ai-setup" element={<ProtectedRoute><AISetup /></ProtectedRoute>} />
            <Route path="/onboarding/confirmation" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/conversations" element={<FeatureProtectedRoute featureId="conversations"><Conversations /></FeatureProtectedRoute>} />
            <Route path="/settings" element={<FeatureProtectedRoute featureId="settings"><Settings /></FeatureProtectedRoute>} />
            <Route path="/billing" element={<FeatureProtectedRoute featureId="billing"><Billing /></FeatureProtectedRoute>} />
            <Route path="/store" element={<FeatureProtectedRoute featureId="store"><Store /></FeatureProtectedRoute>} />
            <Route path="/bookings" element={<FeatureProtectedRoute featureId="bookings"><Bookings /></FeatureProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            {/* Public customer-facing pages */}
            <Route path="/shop" element={<ShopLanding />} />
            <Route path="/shop/:storeName" element={<CustomerStore />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/features" element={<Features />} />
          </Routes>
        </Suspense>
        <Toaster />
      </OnboardingProvider>
    </AuthProvider>
  );
}

export default App;
