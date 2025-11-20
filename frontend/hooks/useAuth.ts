import { useEffect, useState } from "react";
import {
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

const auth = fbApp ? getAuth(fbApp) : null;
const db = fbApp ? getFirestore(fbApp) : null;

const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  useEffect(() => {
    if (!auth || !db) return;

    const handleSignIn = async (user: FirebaseUser) => {
      setCurrentUser(user);
      await setDoc(
        doc(db, "artifacts", appId, "users", user.uid),
        {
          email: user.email || "anonymous@user.com",
          lastLogin: new Date().toISOString(),
        },
        { merge: true },
      );
      setIsLoadingAuth(false);
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        handleSignIn(user);
      } else {
        setCurrentUser(null);
        if (isLoadingAuth) {
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(auth, initialAuthToken);
            } else {
              await signInAnonymously(auth);
            }
          } catch (e) {
            console.error(
              "Initial authentication failed, staying logged out:",
              e,
            );
            setIsLoadingAuth(false);
          }
        } else {
          setIsLoadingAuth(false);
        }
      }
    });

    return () => unsubscribe();
  }, [isLoadingAuth]);

  return { currentUser, isLoadingAuth };
};

export default useAuth;
