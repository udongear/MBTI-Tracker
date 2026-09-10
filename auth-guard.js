import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const appRoot = document.querySelector(".app");
const authLoading = document.getElementById("authLoading");
const userChip = document.getElementById("userChip");
const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  userName.textContent = user.displayName || user.email || "Signed in";
  if (user.photoURL) {
    userAvatar.src = user.photoURL;
    userAvatar.hidden = false;
  }
  userChip.hidden = false;

  authLoading.hidden = true;
  appRoot.hidden = false;
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => window.location.replace("login.html"));
});
