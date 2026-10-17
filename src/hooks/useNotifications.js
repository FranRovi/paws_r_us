import { useContext } from "react";
import { NotificationsContext } from "../context/NotificationsContext";

export function useNotifications() {
  const value = useContext(NotificationsContext);
  if (!value) {
    throw new Error("useNotifications must be used inside NotificationsProvider");
  }
  return value;
}