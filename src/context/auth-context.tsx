"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getSessionInfo, isLoggedIn, type SessionInfo } from "@/lib/session";
import type { User } from "@/types/auth";

type AuthState = {
  /** Full user from /auth/me — null while loading or when logged out */
  user   : User | null;
  loading: boolean;
  /** Call after login/register so the context refreshes without a page reload */
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user   : null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router                = useRouter();

  const fetchUser = useCallback(async () => {
    // Fast synchronous check — no network call needed when clearly logged out.
    if (!isLoggedIn()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/auth/me", { credentials: "include" });

      if (res.status === 401) {
        // Session expired or revoked — clear state and redirect.
        setUser(null);
        router.replace("/login");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setUser(data.data ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Validate session once on mount.
  useEffect(() => { fetchUser(); }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/**
 * Quick synchronous hook for components that only need to know
 * if a session exists (e.g. conditional nav links) without waiting
 * for the /auth/me round-trip to complete.
 *
 * Returns SessionInfo | null immediately from the cookie.
 * Switch to useAuth().user when you need the fully validated user object.
 */
export function useSessionInfo(): SessionInfo | null {
  const [info, setInfo] = useState<SessionInfo | null>(null);

  useEffect(() => {
    setInfo(getSessionInfo());
  }, []);

  return info;
}
