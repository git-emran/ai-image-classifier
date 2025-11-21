'use client'

import { useAuth } from "@/components/auth";
import { Loader2 } from "lucide-react";
import LoginPage from "@/components/auth/LoginPage";
import AuthProvider from "@/components/auth/AuthContext";
import Dashboard from "@/components/dashboard/Dashboard";
import AuthPage from "@/components/auth/AuthPage";
const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
};

// Wrap with AuthProvider
const WrappedApp: React.FC = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default WrappedApp;
