// SignupPage.tsx (New Component for Registration)
'use client'
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { Camera, Loader2, UserPlus } from "lucide-react";

const SignupPage: React.FC<{ onSwitchToLogin: () => void }> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSubmitting || !email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signup(email, password);
      // Success: User is automatically logged in and redirected by the main App component

    } catch (err: any) {
      let errorMessage = 'Sign up failed. Please try again.';

      // Handle common Firebase Auth error codes for sign-up
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already registered.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'The email address is not valid.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak. Must be at least 6 characters.';
      } else {
        console.error("Firebase Sign-up Error:", err);
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
          <div className="bg-green-600 p-3 rounded-full">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Create Account
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Register to access AI-powered image analysis
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="newuser@example.com"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
              Password (min 6 characters)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              ? 'bg-green-400 text-white cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
              }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Registering...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="ml-1 text-indigo-600 hover:text-indigo-800 font-medium"
            disabled={isSubmitting}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
