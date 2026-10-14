import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./auth-context";

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signUp: ({ email, password, profile }) =>
      supabase.auth.signUp({ email, password, options: { data: profile } }),
    signOut: () => supabase.auth.signOut(),
    signIn: ({ email, password }) =>
      supabase.auth.signInWithPassword({ email, password }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
