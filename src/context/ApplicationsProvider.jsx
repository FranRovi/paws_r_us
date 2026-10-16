import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { friendlyApplicationError } from "../lib/applicationErrors";
import { supabase } from "../lib/supabase";
import { ApplicationsContext } from "./ApplicationsContext";

const COLUMNS = "id, pet_id, status, created_at";
const toApplication = ({ id, pet_id, status, created_at }) => ({
  id,
  pet_id,
  status,
  created_at,
});

export default function ApplicationsProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("applications")
        .select(COLUMNS)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) setError("We could not check your applications.");
      else setApplications(data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Both return { error } on failure, so the page can show the message.
  const apply = useCallback(
    async (petId) => {
      const { data, error } = await supabase
        .from("applications")
        .insert({ user_id: userId, pet_id: petId })
        .select(COLUMNS)
        .single();

      if (error) return { error: friendlyApplicationError(error) };
      setApplications((current) => [data, ...current]);
      return {};
    },
    [userId],
  );

  const cancel = useCallback(async (applicationId) => {
    const { data, error } = await supabase
      .from("applications")
      .update({ status: "cancelled" })
      .eq("id", applicationId)
      .select(COLUMNS)
      .single();

    if (error) return { error: friendlyApplicationError(error) };
    setApplications((current) =>
      current.map((application) =>
        application.id === data.id ? data : application,
      ),
    );
    return {};
  }, []);

  const demoSetStatus = useCallback(async (applicationId, status) => {
    const { data, error } = await supabase.rpc("demo_set_application_status", {
      p_application_id: applicationId,
      p_status: status,
    });

    if (error) return { error: friendlyApplicationError(error) };
    setApplications((current) =>
      current.map((application) =>
        application.id === data.id ? toApplication(data) : application,
      ),
    );
    return {};
  }, []);

  const value = useMemo(
    () => ({ applications, loading, error, apply, cancel, demoSetStatus }),
    [applications, loading, error, apply, cancel, demoSetStatus],
  );

  return (
    <ApplicationsContext.Provider value={value}>
      {children}
    </ApplicationsContext.Provider>
  );
}
