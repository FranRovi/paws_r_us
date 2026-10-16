import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// The active applications for one pet (id, status, created_at only),
// from the pet_waiting_list function. `reloadWhen` is any value that
// should trigger a refresh when it changes, such as the user's applications.
export function useWaitingList(petId, reloadWhen) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase.rpc("pet_waiting_list", {
        p_pet_id: petId,
      });

      if (cancelled) return;
      if (error) setError("We could not load the waiting list.");
      else setList(data ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [petId, reloadWhen]);

  return { list, loading, error };
}
