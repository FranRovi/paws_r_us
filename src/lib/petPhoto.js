import { supabase } from "./supabase";

// Turns a Storage path like "max.jpg" into its public URL (or null when there is no photo).
export function petPhotoUrl(path) {
  if (!path) return null;
  return supabase.storage.from("pet-photos").getPublicUrl(path).data.publicUrl;
}
