// AuthPage.tsx (The Parent Component that makes the button work)
'use client'
import React, { useState } from 'react';
import { useAuth } from './AuthContext'; // Adjust path as necessary
import LoginPage from './LoginPage';     // Adjust path as necessary
import SignupPage from './SignupPage';   // Adjust path as necessary (you need to create this)
import { Loader2 } from 'lucide-react';

const AuthPage: React.FC = () => {
  // State to toggle between Login (true) and Signup (false) views
  const [isLoginView, setIsLoginView] = useState(true);
  const { user, loading } = useAuth(); // Assuming useAuth is in AuthContext

  // 1. Function to switch the view to Signup
  const handleSwitchToSignup = () => setIsLoginView(false);

  // 2. Function to switch the view back to Login (needed for SignupPage)
  const handleSwitchToLogin = () => setIsLoginView(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  // If authenticated, show the dashboard (or other content)
  if (user) {
    return <div className="p-8 font-bold">Welcome, {user.name || user.email}! (Dashboard)</div>;
  }

  // Render the correct view and pass the switching function
  if (isLoginView) {
    // ✅ The crucial step: Pass the function defined above to the LoginPage
    return <LoginPage onSwitchToSignup={handleSwitchToSignup} />;
  } else {
    // You'll need a SignupPage component that accepts onSwitchToLogin
    return <SignupPage onSwitchToLogin={handleSwitchToLogin} />;
  }
};

export default AuthPage;
