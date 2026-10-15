import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function usePets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("pets")
        .select("*, shelter:shelters(name, city, distance_miles)");

      if (cancelled) return;
      if (error) setError("We could not load the pets. Please try again.");
      else setPets(data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { pets, loading, error };
}
