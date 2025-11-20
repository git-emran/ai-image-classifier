import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
const firebaseConfig = JSON.parse(
  typeof __firebase_config !== "undefined" ? __firebase_config : "{}",
);
let fbApp: ReturnType<typeof initializeApp> | undefined;
try {
  fbApp = initializeApp(firebaseConfig);
} catch (e) {
  console.error("Firebase initialization failed:", e);
}
const auth = fbApp ? getAuth(fbApp) : null;
const db = fbApp ? getFirestore(fbApp) : null;
