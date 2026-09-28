import supabase from "./supabaseClient";

/**
 * Returnerer en full offentlig URL til en fil i Supabase Storage.
 *
 * @param {string} bucket - Navnet på bucketen (f.eks. 'avatars')
 * @param {string} path - Filsti eller filnavn (f.eks. 'profil.jpg')
 * @returns {string|null} - Full offentlig URL eller null hvis path mangler
 */
export function getPublicUrl(bucket, path) {
  if (!path) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}
