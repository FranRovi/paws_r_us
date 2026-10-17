import { useCallback, useEffect, useMemo, useState } from "react";
import { NotificationsContext } from "./NotificationsContext";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { toNotification, unreadCount } from "../lib/notifications";

const COLUMNS = "id, kind, body, link_path, read_at, created_at";
const SAVE_ERROR = "We could not update your notifications. Please try again.";

export default function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    const { data, error: loadError } = await supabase
      .from("notifications")
      .select(COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (loadError) {
      setError("We could not load your notifications.");
    } else {
      setError(null);
      setNotifications(data.map(toNotification));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Every action updates the screen first, then saves.
  // If saving fails, we reload so the screen matches the database again.
  const save = useCallback(
    async (request) => {
      const { error: saveError } = await request;
      if (saveError) {
        await reload();
        return { error: SAVE_ERROR };
      }
      return {};
    },
    [reload],
  );

  const markRead = useCallback(
    async (id) => {
      const target = notifications.find((n) => n.id === id);
      if (!target || target.read) return {};
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      return save(
        supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", id),
      );
    },
    [notifications, save],
  );

  const markAllRead = useCallback(async () => {
    if (unreadCount(notifications) === 0) return {};
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    return save(
      supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("read_at", null),
    );
  }, [notifications, userId, save]);

  const remove = useCallback(
    async (id) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      return save(supabase.from("notifications").delete().eq("id", id));
    },
    [save],
  );

  const removeAll = useCallback(async () => {
    if (notifications.length === 0) return {};
    setNotifications([]);
    return save(
      supabase.from("notifications").delete().eq("user_id", userId),
    );
  }, [notifications, userId, save]);

  const value = useMemo(
    () => ({
      notifications,
      unread: unreadCount(notifications),
      loading,
      error,
      markRead,
      markAllRead,
      remove,
      removeAll,
      reload,
    }),
    [notifications, loading, error, markRead, markAllRead, remove, removeAll, reload],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}