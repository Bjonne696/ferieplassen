import { useEffect, useRef, useState } from "react";
import supabase from "../../lib/supabaseClient";

export default function OwnerRequests({ userId: propUserId = null, className }) {
  const userId = propUserId ?? null;
  const identityRef = useRef({ userId, version: 0 });
  if (identityRef.current.userId !== userId) {
    identityRef.current = {
      userId,
      version: identityRef.current.version + 1
    };
  }

  const [requestState, setRequestState] = useState({
    userId,
    requests: [],
    loading: Boolean(userId)
  });
  const visibleState = requestState.userId === userId
    ? requestState
    : { requests: [], loading: Boolean(userId) };
  const { requests, loading } = visibleState;

  useEffect(() => {
    let active = true;
    const identityVersion = identityRef.current.version;
    const isCurrent = () =>
      active &&
      identityRef.current.userId === userId &&
      identityRef.current.version === identityVersion;

    setRequestState({ userId, requests: [], loading: Boolean(userId) });

    if (!userId) {
      return () => {
        active = false;
      };
    }

    const fetchRequests = async () => {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (!isCurrent()) return;
      if (userError || !user || user.id !== userId) {
        setRequestState({ userId, requests: [], loading: false });
        return;
      }

      const { data: cabins, error: cabinsError } = await supabase
        .from("cabins")
        .select("id, title")
        .eq("owner_id", userId);

      if (!isCurrent()) return;
      if (cabinsError || !cabins || cabins.length === 0) {
        setRequestState({ userId, requests: [], loading: false });
        return;
      }

      const cabinIds = cabins.map(c => c.id);
      const cabinMap = Object.fromEntries(cabins.map(c => [c.id, c.title]));

      const { data: bookings, error: bookingsError } = await supabase
        .from("booking_requests")
        .select("id, cabin_id, user_id, start_date, end_date, message, status, created_at")
        .in("cabin_id", cabinIds)
        .eq("status", "pending");

      if (!isCurrent()) return;
      if (bookingsError || !bookings) {
        setRequestState({ userId, requests: [], loading: false });
        return;
      }

      const userIds = [...new Set(bookings.map(b => b.user_id))];
      const { data: users } = await supabase
        .from("profiles")
        .select("id, name, last_name, email")
        .in("id", userIds);

      if (!isCurrent()) return;
      const userMap = Object.fromEntries(
        (users || []).map(u => [u.id, { name: `${u.name ?? ""} ${u.last_name ?? ""}`.trim(), email: u.email }])
      );

      const enriched = bookings.map(b => ({
        ...b,
        requester_name: userMap[b.user_id]?.name || "-",
        requester_email: userMap[b.user_id]?.email || "-",
        cabin_title: cabinMap[b.cabin_id] || "(Ukjent feriebolig)"
      }));

      setRequestState({ userId, requests: enriched, loading: false });
    };

    fetchRequests().catch((error) => {
      if (isCurrent()) {
        console.error("Kunne ikke laste forespørsler:", error);
        setRequestState({ userId, requests: [], loading: false });
      }
    });

    return () => {
      active = false;
    };
  }, [userId]);

  const handleUpdate = async (id, status) => {
    const currentIdentity = identityRef.current;
    const actionUserId = userId;
    const isCurrent = () =>
      Boolean(actionUserId) &&
      identityRef.current.userId === actionUserId &&
      identityRef.current.version === currentIdentity.version;

    if (!isCurrent()) return;
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (!isCurrent() || userError || user?.id !== actionUserId) return;

    // Re-check immediately before the mutation in case the identity changed
    // while the auth request was in flight.
    if (!isCurrent()) return;
    const { error } = await supabase
      .from("booking_requests")
      .update({ status: status })
      .eq("id", id);

    if (!isCurrent()) return;
    if (!error) {
      // Send e-post-notifikasjon til den som sendte forespørselen
      try {
        await supabase.functions.invoke('notify-booking-status', {
          body: { bookingId: id, status }
        });
      } catch (emailError) {
        if (isCurrent()) console.error('Kunne ikke sende e-post-notifikasjon:', emailError);
        // Fortsett selv om e-post feiler
      }

      if (isCurrent()) {
        setRequestState((prev) => prev.userId === actionUserId
          ? { ...prev, requests: prev.requests.filter((r) => r.id !== id) }
          : prev);
      }
    } else {
      if (isCurrent()) {
        alert(status === "rejected" ? "Feil ved avslag av forespørsel" : "Feil ved oppdatering av status");
      }
    }
  };

  if (loading) return <p className={["booking-requests__loading", "owner-requests", "owner-requests__loading", className].filter(Boolean).join(" ")}>Laster forespørsler...</p>;
  if (requests.length === 0) return <p className={["booking-requests__empty", "owner-requests", "owner-requests__empty", className].filter(Boolean).join(" ")}>Ingen nye forespørsler.</p>;

  return (
    <div className={["owner-requests", className].filter(Boolean).join(" ")}>
      {requests.map((req) => (
        <div className="booking-request-card owner-requests__request" key={req.id}>
          <p className="booking-request-card__info owner-requests__details">
            <strong>{req.requester_name}</strong> ({req.requester_email}) ønsker å leie ferieboligen <strong>"{req.cabin_title}"</strong><br />
            fra <strong>{req.start_date}</strong> til <strong>{req.end_date}</strong>
          </p>
          {req.message && <p className="booking-request-card__message owner-requests__message"><em>Melding:</em> {req.message}</p>}
          <div className="booking-request-card__actions owner-requests__actions">
            <button className="owner-requests__approve approve" onClick={() => handleUpdate(req.id, "approved")}>Godkjenn</button>
            <button className="owner-requests__reject reject" onClick={() => handleUpdate(req.id, "rejected")}>Avslå</button>
          </div>
        </div>
      ))}
    </div>
  );
}