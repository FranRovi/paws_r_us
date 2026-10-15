import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;
      if (error) setError("We could not load your profile. Please try again.");
      else setProfile(data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function save(changes) {
    const { data, error } = await supabase
      .from("profiles")
      .update(changes)
      .eq("id", userId)
      .select()
      .single();

    if (!error) setProfile(data);
    return { error };
  }

  return { profile, loading, error, save };
}
