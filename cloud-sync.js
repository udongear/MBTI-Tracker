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

/**
 * True if a synced state object has nothing in it. Used to guard against a
 * blank/never-used device being the first to touch this account's Firestore
 * doc: without this check, its empty local state would either seed the cloud
 * doc as empty, or (if another device already seeded it) get treated as an
 * authoritative "nothing here" update — silently wiping a richer device's
 * data on its next load. See script.js's reconcileOptionCatalogs, called from
 * applyCloudState, for the matching recovery half of this fix.
 */
function isEmptyState(state) {
  if (!state) return true;
  const noEntries = !Array.isArray(state.entries) || state.entries.length === 0;
  const noRelationships = !Array.isArray(state.relationships) || state.relationships.length === 0;
  const noSubCategories = !Array.isArray(state.subCategories) || state.subCategories.length === 0;
  const noObservations = !state.observations || Object.keys(state.observations).length === 0;
  return noEntries && noRelationships && noSubCategories && noObservations;
}

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

    const uid = user.uid;
    const ref = doc(db, "users", uid);
    let firstSnapshot = true;

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

        const remote = snap.data();

        // A blank device (e.g. a fresh install, never used before) can win
        // the race to create/touch this account's doc while it's still
        // empty. Don't let that wipe a device that actually has data —
        // push this device's state up instead of applying the empty one.
        if (firstSnapshot && isEmptyState(remote) && !isEmptyState(getStateFn())) {
          firstSnapshot = false;
          setDoc(doc(db, "users", uid), { ...getStateFn(), updatedAt: serverTimestamp() }).catch((e) =>
            console.error("Cloud sync: recovery push failed", e)
          );
          return;
        }
        firstSnapshot = false;

        setStateFn(remote);
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
