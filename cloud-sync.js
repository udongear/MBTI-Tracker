// ---------------------------------------------------------------------------
// Cross-device sync: mirrors the app's data (normally just localStorage) into
// a single Firestore document at users/{uid}, so a signed-in account sees the
// same entries/observations/relationships/sub-categories/icon mode whether
// it's opened on the web or on mobile.
//
// Model: one document per user, overwritten wholesale on every change. This
// app's dataset is small (personal tracker, not multi-editor), so a single
// doc keeps things simple — no need for per-entry documents or merge logic.
//
// Usage (see script.js):
//   initCloudSync({ getState, setState })
//     getState() -> plain object with the fields to persist/sync
//     setState(remote) -> apply an incoming remote state (re-render, etc.)
//   queueCloudPush() -> call after a local mutation to schedule an upload
// ---------------------------------------------------------------------------
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const PUSH_DEBOUNCE_MS = 600;

let currentUid = null;
let getStateFn = null;
let setStateFn = null;
let unsubscribeSnapshot = null;
let pushTimer = null;

export function initCloudSync({ getState, setState }) {
  getStateFn = getState;
  setStateFn = setState;

  onAuthStateChanged(auth, async (user) => {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
    clearTimeout(pushTimer);
    currentUid = user ? user.uid : null;
    if (!user) return;

    const ref = doc(db, "users", user.uid);

    try {
      // First sign-in on this account, anywhere: no cloud doc yet, so seed
      // it from whatever's already in this browser's localStorage instead
      // of starting the account off empty.
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { ...getStateFn(), updatedAt: serverTimestamp() });
      }
    } catch (e) {
      console.error("Cloud sync: initial read/seed failed", e);
    }

    unsubscribeSnapshot = onSnapshot(
      ref,
      (snap) => {
        // Skip the local echo of our own pending writes — only react to
        // state that actually came from the server (i.e. another device).
        if (!snap.exists() || snap.metadata.hasPendingWrites) return;
        setStateFn(snap.data());
      },
      (e) => console.error("Cloud sync: snapshot listener failed", e)
    );
  });
}

/** Call after any local mutation to schedule (debounced) an upload to Firestore. */
export function queueCloudPush() {
  if (!currentUid || !getStateFn) return;
  clearTimeout(pushTimer);
  const uid = currentUid;
  pushTimer = setTimeout(() => {
    setDoc(doc(db, "users", uid), { ...getStateFn(), updatedAt: serverTimestamp() }).catch((e) =>
      console.error("Cloud sync: push failed", e)
    );
  }, PUSH_DEBOUNCE_MS);
}
