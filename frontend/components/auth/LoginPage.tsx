// LoginPage.tsx (Modified to include Switch to Sign Up Button)
'use client'
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { Camera, Loader2 } from "lucide-react";

// Define the component props to accept the function that switches the view
interface LoginPageProps {
  onSwitchToSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Assuming useAuth now returns a login function that throws a Firebase error object
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSubmitting || !email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      // If successful, AuthProvider handles state change and redirection
    } catch (err: any) {
      let errorMessage = 'Login failed. Please check your credentials.';

      // Handle common Firebase Auth error codes
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        // ✅ Specific error message for wrong credentials
        errorMessage = 'Invalid email or password. Please check your details.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'The email address is not valid.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Access temporarily blocked due to too many failed login attempts.';
      } else {
        console.error("Firebase Login Error:", err);
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-full">
            <Camera className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Gemini Vision
        </h1>
        <p className="text-center text-gray-600 mb-8">
          AI-powered image analysis and chat
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="user@example.com"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center py-2 rounded-lg font-medium transition-colors ${isSubmitting
              ? 'bg-indigo-400 text-white cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* ✅ NEW: Button to switch to the Signup page */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Dont have an account?
          <button
            type="button"
            onClick={onSwitchToSignup}
            disabled={isSubmitting}
            className="ml-1 text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
