import { useState, useEffect, useCallback } from "react";
import { addDays, format } from "date-fns";
import supabase from "../lib/supabaseClient";

export default function useBookingRequest(cabinId) {
  const [session, setSession] = useState(null);
  const [dateRange, setDateRange] = useState([{
    startDate: new Date(),
    endDate: addDays(new Date(), 1),
    key: "selection",
  }]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingPendingCount, setLoadingPendingCount] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  useEffect(() => {
    const fetchApprovedBookings = async () => {
      setLoadingBookings(true);
      setBookingsError(null);
      const { data, error: fetchError } = await supabase
        .from("booking_requests")
        .select("start_date, end_date")
        .eq("cabin_id", cabinId)
        .eq("status", "approved");
      if (fetchError) {
        setBookingsError("Kunne ikke hente bookinger. Prøv igjen senere.");
        setLoadingBookings(false);
        return;
      }
      if (data) {
        setApprovedBookings(data.map(booking => ({
          start: new Date(booking.start_date),
          end: new Date(booking.end_date),
        })));
      }
      setLoadingBookings(false);
    };
    fetchApprovedBookings();
  }, [cabinId]);

  const fetchPendingCount = useCallback(async () => {
    if (!session) return;
    setLoadingPendingCount(true);
    const { count, error: countError } = await supabase
      .from("booking_requests")
      .select("*", { count: "exact", head: true })
      .eq("cabin_id", cabinId)
      .eq("user_id", session.user.id)
      .eq("status", "pending");
    if (countError) {
      console.error("Error fetching pending count:", countError);
    } else {
      setPendingCount(count || 0);
    }
    setLoadingPendingCount(false);
  }, [cabinId, session]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  const handleSubmit = async () => {
    if (!session) {
      setError("Du må være logget inn for å sende en forespørsel.");
      return;
    }
    const { startDate, endDate } = dateRange[0];
    const { user } = session;
    if (pendingCount >= 2) {
      setError("Du har allerede 2 aktive forespørsler for denne ferieboligen. Vennligst vent på svar før du sender flere.");
      return;
    }
    if (approvedBookings.some(booking => startDate <= booking.end && endDate >= booking.start)) {
      setError("Valgte datoer overlapper med en eksisterende booking. Vennligst velg andre datoer.");
      return;
    }
    const start = format(startDate, "yyyy-MM-dd");
    const end = format(endDate, "yyyy-MM-dd");
    const { data: existingPending, error: pendingError } = await supabase
      .from("booking_requests")
      .select("id")
      .eq("cabin_id", cabinId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .eq("start_date", start)
      .eq("end_date", end);
    if (pendingError) {
      console.error("Error checking pending requests:", pendingError);
      setError("Kunne ikke sjekke eksisterende forespørsler. Prøv igjen.");
      return;
    }
    if (existingPending && existingPending.length > 0) {
      setError("Du har allerede sendt en forespørsel for disse datoene. Vennligst vent på svar fra utleier.");
      return;
    }
    setSending(true);
    setError(null);
    const { data: bookingData, error: insertError } = await supabase.from("booking_requests").insert({
      cabin_id: cabinId,
      user_id: user.id,
      start_date: start,
      end_date: end,
      message,
      status: "pending",
    }).select().single();
    if (insertError) {
      console.error("Booking insert error:", insertError);
      if (insertError.code === "23505" || insertError.message?.includes("unique_pending_booking_per_user")) {
        setError("Du har allerede sendt en forespørsel for disse datoene. Vennligst vent på svar fra utleier.");
      } else if (insertError.code === "P0001" || insertError.message?.includes("maks ha 2 aktive forespørsler")) {
        setError("Du har allerede 2 aktive forespørsler for denne ferieboligen. Vennligst vent på svar før du sender flere.");
        setPendingCount(2);
      } else {
        setError("Kunne ikke sende forespørselen. Vennligst prøv igjen eller kontakt support hvis problemet fortsetter.");
      }
    } else {
      try {
        await supabase.functions.invoke("notify-owner-new-booking", {
          body: { bookingId: bookingData.id },
        });
      } catch (emailError) {
        console.error("Kunne ikke sende e-post-notifikasjon:", emailError);
      }
      setSuccess(true);
      await fetchPendingCount();
    }
    setSending(false);
  };

  return {
    session, dateRange, setDateRange, message, setMessage, sending, error, success,
    approvedBookings, loadingBookings, bookingsError, pendingCount, loadingPendingCount, handleSubmit,
  };
}