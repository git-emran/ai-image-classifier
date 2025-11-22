"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  User as FirebaseUser
} from "firebase/auth";

import { auth } from "@/firebase/firebase";

interface User {
  uid: string;
  email: string | null;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to user auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.email ? firebaseUser.email.split("@")[0] : "User"
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // LOGIN ----------------------------
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Login error:", error);

      if (error.code === "auth/user-not-found") {
        throw new Error("No account found with this email");
      }
      if (error.code === "auth/wrong-password") {
        throw new Error("Incorrect password");
      }
      if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      }
      if (error.code === "auth/too-many-requests") {
        throw new Error("Too many attempts, try again later");
      }

      throw new Error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // SIGNUP ---------------------------
  const signup = useCallback(async (email: string, password: string) => {
    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Signup error:", error);

      if (error.code === "auth/email-already-in-use") {
        throw new Error("This email is already registered");
      }
      if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      }
      if (error.code === "auth/weak-password") {
        throw new Error("Password must be at least 6 characters");
      }

      throw new Error(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // LOGOUT ---------------------------
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      signup,
      logout,
      loading
    }),
    [user, login, signup, logout, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export default AuthProvider;

