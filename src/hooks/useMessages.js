import { useContext } from "react";
import { MessagesContext } from "../context/MessagesContext";

export function useMessages() {
  const value = useContext(MessagesContext);
  if (!value) {
    throw new Error("useMessages must be used inside MessagesProvider");
  }
  return value;
}