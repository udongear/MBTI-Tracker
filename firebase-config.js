// ---------------------------------------------------------------------------
// Firebase project configuration — shared by login.html (login.js) and
// index.html (auth-guard.js).
//
// This is a plain static site (no bundler), so the Firebase SDK is loaded
// straight from Google's CDN via URL imports rather than the bare
// "firebase/app" specifier the Firebase Console's "npm" setup snippet gives
// you — that form only resolves under a bundler like Vite/webpack.
//
// Firebase Console checklist:
//   1. Build → Authentication → Get started (if you haven't already).
//   2. Authentication → Sign-in method → add "Google" as a sign-in provider.
//   3. Authentication → Settings → Authorized domains → add whatever domain
//      this site is served from (localhost is included by default).
//   4. Build → Firestore Database → Create database (this is what makes an
//      account's data follow it across devices — see cloud-sync.js). Paste
//      the rules from firestore.rules into Firestore Database → Rules.
//
// See: https://firebase.google.com/docs/auth/web/google-signin
//      https://firebase.google.com/docs/firestore/quickstart
// ---------------------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtgqUP0ErLbnVVrPfyOU570bnughSEmEY",
  authDomain: "mbti-tracker.firebaseapp.com",
  projectId: "mbti-tracker",
  storageBucket: "mbti-tracker.firebasestorage.app",
  messagingSenderId: "710993994637",
  appId: "1:710993994637:web:347627dbcac42ad173d3c4",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
