import { auth } from "./firebase-config.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const googleBtn = document.getElementById("googleSignInBtn");
const errorEl = document.getElementById("loginError");
const provider = new GoogleAuthProvider();

// Already signed in (e.g. navigated back here manually) — skip straight to the app.
onAuthStateChanged(auth, (user) => {
  if (user) window.location.replace("index.html");
});

googleBtn.addEventListener("click", async () => {
  errorEl.hidden = true;
  googleBtn.disabled = true;
  try {
    await signInWithPopup(auth, provider);
    window.location.replace("index.html");
  } catch (err) {
    console.error("Google sign-in failed", err);
    errorEl.textContent = "Sign-in failed — " + (err.message || "please try again.");
    errorEl.hidden = false;
  } finally {
    googleBtn.disabled = false;
  }
});
