import supabase from "../lib/supabaseClient";
import { enrichCabinRatings, bookingOverlaps } from "../utils/cabinRatings";

export async function getRatedCabins({ newest = false, premium = false, popular = false } = {}) {
  let query = supabase.from("cabins").select("*").eq("is_active", true);
  if (premium) query = query.eq("is_premium", true).limit(20);
  if (newest) query = query.order("created_at", { ascending: false }).limit(12);
  const { data: cabins, error } = await query;
  if (error || !cabins) throw error || new Error("Ingen hyttedata mottatt");

  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews").select("cabin_id, rating");
  // Popular listings uniquely require reviews to be available; the other listings
  // display unrated cabins even if the reviews request fails.
  if (popular && (reviewsError || !reviews?.length)) return [];
  const rated = enrichCabinRatings(cabins, reviewsError ? [] : reviews || [], popular ? "avgRating" : "average_score");
  return popular ? rated.filter((cabin) => cabin.avgRating >= 3.5) : rated;
}

export async function filterAvailableCabins(cabins, checkInDate, checkOutDate) {
  if (!checkInDate || !checkOutDate) return cabins;
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  if (!(checkIn < checkOut)) return cabins;
  const availability = await Promise.all(cabins.map(async (cabin) => {
    // Intentionally uses bookings, not booking_requests, and strict overlap.
    const { data: bookings, error } = await supabase.from("bookings")
      .select("start_date, end_date").eq("cabin_id", cabin.id).eq("status", "approved");
    return !error && bookings && !bookings.some((booking) => bookingOverlaps(checkIn, checkOut, booking));
  }));
  return cabins.filter((_, index) => availability[index]);
}