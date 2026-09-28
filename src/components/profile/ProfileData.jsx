import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import supabase from "../../lib/supabaseClient";
import OwnerRequests from "../bookings/OwnerRequests";
import MyCabinsWithSubscription from "./MyCabinsWithSubscription";
import ProfileOverview from "./ProfileOverview";
import IncomingReviews from "./IncomingReviews";
import { UpcomingRentals, PastRentals } from "./RentalSections";
import { useUpcomingRentals } from "../../hooks/useUpcomingRentals";
import { createIdentityRequestCoordinator } from "../../utils/identityRequestCoordinator";

const EMPTY_LIST = [];

function useIdentityState(userId, initialValue) {
  const [entry, setEntry] = useState(() => ({ userId, value: initialValue }));
  const setForIdentity = useCallback((expectedUserId, value) => {
    setEntry({ userId: expectedUserId, value });
  }, []);
  const resetForIdentity = useCallback(() => {
    setEntry({ userId, value: initialValue });
  }, [userId, initialValue]);

  return [
    entry.userId === userId ? entry.value : initialValue,
    setForIdentity,
    resetForIdentity,
  ];
}

export default function ProfileData() {
  const { profile, user, loading, profileStatus, profileError, refreshProfile } = useAuth();
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);
  const userId = user?.id ?? null;
  const requestsRef = useRef(null);
  if (!requestsRef.current) requestsRef.current = createIdentityRequestCoordinator();
  const requests = requestsRef.current;

  useEffect(() => {
    if (location.state?.vippsCallback || location.state?.justActivated) {
      setRefreshKey((k) => k + 1);
    }
  }, [location.state]);

  const [avatarUrl, setAvatarUrlForIdentity, resetAvatar] = useIdentityState(userId, null);
  const [reviews, setReviewsForIdentity, resetReviews] = useIdentityState(userId, EMPTY_LIST);
  const [incomingReviews, setIncomingReviewsForIdentity, resetIncomingReviews] = useIdentityState(userId, EMPTY_LIST);
  const [pastBookings, setPastBookingsForIdentity, resetPastBookings] = useIdentityState(userId, EMPTY_LIST);
  const [retryingProfile, setRetryingProfile] = useState(false);
  const navigate = useNavigate();
  const { rentals: upcomingRentals, loading: loadingRentals } = useUpcomingRentals(userId);

  useEffect(() => {
    requests.setIdentity(userId);
    resetAvatar();
    resetReviews();
    resetIncomingReviews();
    resetPastBookings();

    return () => requests.invalidate(userId);
  }, [userId, requests, resetAvatar, resetReviews, resetIncomingReviews, resetPastBookings]);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    const request = requests.begin(userId);
    if (!requests.isCurrent(request)) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();
    if (!requests.isCurrent(request)) return;
    if (!error && data) {
      if (data.avatar_url) {
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(data.avatar_url);
        if (requests.isCurrent(request)) setAvatarUrlForIdentity(userId, urlData.publicUrl);
      } else {
        setAvatarUrlForIdentity(userId, null);
      }
    }
  }, [userId, requests, setAvatarUrlForIdentity]);

  const fetchPastBookings = useCallback(async () => {
    if (!userId) return;
    const request = requests.begin(userId);
    if (!requests.isCurrent(request)) return;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from("booking_requests")
      .select(`id, start_date, end_date, cabins (id, title, location, image_urls, owner_id)`)
      .eq("user_id", userId)
      .eq("status", "approved")
      .lt("end_date", today)
      .order("end_date", { ascending: false });
    if (!error && requests.isCurrent(request)) {
      setPastBookingsForIdentity(userId, data || EMPTY_LIST);
    }
  }, [userId, requests, setPastBookingsForIdentity]);

  const fetchUserReviews = useCallback(async () => {
    if (!userId) return;
    const request = requests.begin(userId);
    if (!requests.isCurrent(request)) return;
    const { data, error } = await supabase
      .from("reviews")
      .select("cabin_id")
      .eq("user_id", userId);
    if (!error && data && requests.isCurrent(request)) {
      setReviewsForIdentity(userId, data.map((r) => r.cabin_id));
    }
  }, [userId, requests, setReviewsForIdentity]);

  const fetchIncomingReviews = useCallback(async () => {
    if (!userId) return;
    const request = requests.begin(userId);
    if (!requests.isCurrent(request)) return;
    const { data, error } = await supabase
      .from("reviews")
      .select("rating, comment, cabin_id, cabins(title, owner_id)")
      .eq("cabins.owner_id", userId);
    if (!error && data && requests.isCurrent(request)) {
      setIncomingReviewsForIdentity(userId, data);
    }
  }, [userId, requests, setIncomingReviewsForIdentity]);

  const handleDeleteReview = async (cabinId) => {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("user_id", user.id)
      .eq("cabin_id", cabinId);
    if (error) {
      console.error("Feil ved sletting:", error.message);
    } else {
      void fetchUserReviews();
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (userId) {
      fetchPastBookings();
      fetchUserReviews();
      fetchIncomingReviews();
    }
  }, [userId, fetchPastBookings, fetchUserReviews, fetchIncomingReviews]);

  if (!user) {
    return <p className="profile-data__sign-in-prompt" role="status">Logg inn for å se profilen din. <Link to="/login">Gå til innlogging</Link></p>;
  }
  if (loading || profileStatus === "loading") return <p className="profile-data__loading" role="status">Laster profil…</p>;
  if (profileStatus === "error" || !profile || profile.id !== user.id) {
    const retryProfile = async () => {
      setRetryingProfile(true);
      try {
        await refreshProfile(user.id);
      } catch {
        // AuthProvider exposes the concrete error in profileError.
      } finally {
        setRetryingProfile(false);
      }
    };
    return (
      <section className="profile-data__error" aria-labelledby="profile-load-error">
        <h2 className="profile-data__error-heading" id="profile-load-error">Profilen kunne ikke lastes</h2>
        <p className="profile-data__error-message" role="alert">{profileError || "Profilen for den innloggede brukeren er ikke tilgjengelig."}</p>
        <button className="profile-data__retry-button" type="button" onClick={retryProfile} disabled={retryingProfile}>
          {retryingProfile ? "Laster på nytt…" : "Last profilen på nytt"}
        </button>
      </section>
    );
  }

  return (
    <div className="profile-page profile-data">
      <ProfileOverview
        profile={profile}
        avatarUrl={avatarUrl}
        isOwner={user?.id === profile.id}
        onUpload={fetchProfile}
        onCreate={() => navigate("/ny-hytte")}
      />
      <IncomingReviews reviews={incomingReviews} userId={user?.id} />
      <section className="profile-section">
        <h2 className="profile-section__heading profile-data__listings-heading">Mine annonser og abonnement</h2>
        <div className="profile-section__content profile-data__listings-content">
          <MyCabinsWithSubscription key={`listings-${refreshKey}`} />
        </div>
      </section>
      <section className="profile-section">
        <h2 className="profile-section__heading profile-data__requests-heading">Innkommende forespørsler</h2>
        <div className="profile-section__content profile-data__requests-content"><OwnerRequests userId={userId} /></div>
      </section>
      <UpcomingRentals
        rentals={upcomingRentals}
        loading={loadingRentals}
        onView={(id) => navigate(`/hytte/${id}`)}
      />
      <PastRentals
        bookings={pastBookings}
        reviews={reviews}
        userId={user?.id}
        onDeleteReview={handleDeleteReview}
        onReviewSubmitted={fetchUserReviews}
      />
    </div>
  );
}