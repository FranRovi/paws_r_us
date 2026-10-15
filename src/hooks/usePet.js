import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function usePet(id) {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("pets")
        .select("*, shelter:shelters(name, city, phone, email)")
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;
      // 22P02 = the id in the URL is not a valid uuid, which just means "no such pet"
      if (error && error.code !== "22P02") {
        setError("We could not load this pet. Please try again.");
      } else {
        setPet(data ?? null);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { pet, loading, error };
}
