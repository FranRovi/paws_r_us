import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { FavoritesContext } from "./FavoritesContext";

function withPet(ids, petId, present) {
  const next = new Set(ids);
  if (present) next.add(petId);
  else next.delete(petId);
  return next;
}

export default function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [ids, setIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("favorites")
        .select("pet_id")
        .eq("user_id", userId);

      if (cancelled) return;
      if (error) setError("We could not load your favorites.");
      else setIds(new Set(data.map((row) => row.pet_id)));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggleFavorite = useCallback(
    async (petId) => {
      const wasFavorite = ids.has(petId);

      // Optimistic update: change the screen first, ask the database second.
      setIds((current) => withPet(current, petId, !wasFavorite));

      const { error } = wasFavorite
        ? await supabase
            .from("favorites")
            .delete()
            .eq("user_id", userId)
            .eq("pet_id", petId)
        : await supabase
            .from("favorites")
            .insert({ user_id: userId, pet_id: petId });

      // 23505 = already saved (for example from another tab): nothing to undo.
      if (error && error.code !== "23505") {
        setIds((current) => withPet(current, petId, wasFavorite));
        setError("We could not update your favorites. Please try again.");
      }
    },
    [ids, userId],
  );

  const value = useMemo(
    () => ({
      loading,
      isFavorite: (petId) => ids.has(petId),
      toggleFavorite,
    }),
    [ids, loading, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      {error && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            className="min-h-11 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </FavoritesContext.Provider>
  );
}
