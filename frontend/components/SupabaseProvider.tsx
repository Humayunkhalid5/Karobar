"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isAuthEnabled } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  loading: boolean;
  /** True when Supabase auth is configured. False = dev/demo mode. */
  authEnabled: boolean;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  authEnabled: false,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: isAuthEnabled,
    authEnabled: isAuthEnabled,
  });

  useEffect(() => {
    if (!supabase) {
      setState({ user: null, loading: false, authEnabled: false });
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        loading: false,
        authEnabled: true,
      });
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        loading: false,
        authEnabled: true,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    // Clear any dev session too
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("karobaar-demo-session");
    }
  }, []);

  const value = useMemo(
    () => ({ ...state, signOut }),
    [state, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
