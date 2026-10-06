import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";

import SignIn from "./pages/SignIn";
import AccountCreation from "./pages/onboarding/AccountCreation";
import WhatsAppDashboard from "./pages/WhatsAppDashboard";
import BulkMessaging from "./pages/BulkMessaging";
import WhatsAppAdmin from "./pages/WhatsAppAdmin";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return <Navigate to={isAuthenticated ? '/dashboard' : '/signin'} replace />;
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<AccountCreation />} />
            <Route path="/onboarding/account" element={<Navigate to="/signup" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><WhatsAppDashboard /></ProtectedRoute>} />
            <Route path="/bulk-messaging" element={<ProtectedRoute><BulkMessaging /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><WhatsAppAdmin /></AdminRoute>} />
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </Suspense>
        <Toaster />
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
