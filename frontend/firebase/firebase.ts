// firebase.ts

"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

// 1. Define Config using Environment Variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 2. Memoize instances
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

// 3. Conditional Initialization Function
// This function ensures initialization only happens in the browser and only once.
const initializeFirebase = () => {
  // Only run this logic on the client
  if (typeof window !== "undefined") {
    if (!firebaseApp) {
      // Check if required configuration is present
      if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
        console.error(
          "Firebase Auth configuration is incomplete. Check NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN.",
        );
        return;
      }

      // Initialize App
      if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig);
      } else {
        firebaseApp = getApp();
      }
    }

    // Initialize Auth instance only if App exists
    if (firebaseApp && !firebaseAuth) {
      firebaseAuth = getAuth(firebaseApp);
    }
  }
};

// Immediately call the initialization function
initializeFirebase();

// 4. Export the Auth instance
export const auth = firebaseAuth;
