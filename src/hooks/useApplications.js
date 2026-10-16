import { useContext } from "react";
import { ApplicationsContext } from "../context/ApplicationsContext";

export function useApplications() {
  const value = useContext(ApplicationsContext);
  if (!value) {
    throw new Error(
      "useApplications must be used inside <ApplicationsProvider>",
    );
  }
  return value;
}
