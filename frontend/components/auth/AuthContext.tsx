// AuthContext.tsx (Updated with Sign-up)
'use client'
import { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword // <-- NEW IMPORT
} from 'firebase/auth';

interface User {
  uid: string;
  email: string | null;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBs_WpNHjUs5LMzIS-B1p2ZtftqNJhqYpQ",
  authDomain: "ai-vision-2c776.firebaseapp.com",
  projectId: "ai-vision-2c776",
  storageBucket: "ai-vision-2c776.firebasestorage.app",
  messagingSenderId: "132061977214",
  appId: "1:132061977214:web:918605064f0e574da5962f"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
// --- END FIREBASE INITIALIZATION ---

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Map Firebase User to our local User interface
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login using Firebase
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout using Firebase
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase Logout Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    login,
    signup,
    logout,
    loading
  }), [user, login, signup, logout, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthProvider;
