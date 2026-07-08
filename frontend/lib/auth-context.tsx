"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth, googleProvider, firebaseEnabled } from "./firebase";

// A slim user shape so the rest of the app never depends on the Firebase SDK types.
export interface AuthUser {
  name: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  firebaseEnabled: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// Shown when Firebase is not configured, so the login flow is still demonstrable.
const DEMO_USER: AuthUser = {
  name: "Demo Supervisor",
  email: "demo.supervisor@smarthealth.gov.in",
  photoURL: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(firebaseEnabled);

  // Subscribe to real auth state only when Firebase is configured.
  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setLoading(false);
      return;
    }
    let unsub = () => {};
    let active = true;
    import("firebase/auth")
      .then(({ onAuthStateChanged }) => {
        if (!active || !auth) return;
        unsub = onAuthStateChanged(auth, (fbUser) => {
          setUser(
            fbUser
              ? { name: fbUser.displayName, email: fbUser.email, photoURL: fbUser.photoURL }
              : null,
          );
          setLoading(false);
        });
      })
      .catch(() => setLoading(false));
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // Demo mode: no Firebase config — sign in a local mock user.
    if (!firebaseEnabled || !auth || !googleProvider) {
      setUser(DEMO_USER);
      return;
    }
    setLoading(true);
    try {
      const { signInWithPopup } = await import("firebase/auth");
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      // If the real sign-in fails (popup blocked, offline…), fall back to demo.
      if (typeof console !== "undefined") {
        // eslint-disable-next-line no-console
        console.warn("[auth] Google sign-in failed, using demo user", err);
      }
      setUser(DEMO_USER);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (firebaseEnabled && auth) {
      try {
        const { signOut: fbSignOut } = await import("firebase/auth");
        await fbSignOut(auth);
      } catch {
        /* ignore */
      }
    }
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, firebaseEnabled, signInWithGoogle, signOut }),
    [user, loading, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
