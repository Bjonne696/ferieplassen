import { v4 as uuidv4 } from "uuid";
import supabase from "../lib/supabaseClient";

export async function reverseGeocodeLocation(lat, lon) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
    headers: { "User-Agent": "Hytteplattformen/1.0 (din@email.no)" },
  });
  return response.json();
}

export async function searchLocation(query) {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
    headers: { "User-Agent": "Hytteplattformen/1.0 (din@email.no)" },
  });
  return response.json();
}

export async function uploadCabinImages(files) {
  const uploadedImageUrls = [];
  for (const file of files) {
    const filePath = `cabins-images/${uuidv4()}-${file.name}`;
    const { error } = await supabase.storage.from("cabins-images").upload(filePath, file);
    if (error) throw new Error(`Feil ved bildeopplasting: ${error.message}`);
    const { data } = supabase.storage.from("cabins-images").getPublicUrl(filePath);
    uploadedImageUrls.push(data.publicUrl);
  }
  return uploadedImageUrls;
}

export async function insertCabin(cabin) {
  const { data, error } = await supabase.from("cabins").insert([cabin]).select().single();
  if (error) throw new Error(`Feil ved lagring av feriebolig: ${error.message}`);
  return data;
}