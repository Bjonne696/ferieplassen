import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import supabase from "../../lib/supabaseClient";
import { cancelSubscription, createSubscription, deleteSubscription } from "../../services/subscriptionService";
import VippsRedirectModal from "../common/VippsRedirectModal";
import SubscriptionListingCard from "./SubscriptionListingCard";
import ListingConfirmation from "./ListingConfirmation";

function createInitialState(scope) {
  return {
    scope,
    listings: [],
    loading: Boolean(scope.userId),
    actionLoading: null,
    actionMessage: null,
    confirmAction: null,
    vippsRedirect: null,
  };
}

export default function MyCabinsWithSubscription() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id ?? null;
  const scopeRef = useRef({ userId, generation: 0 });
  if (scopeRef.current.userId !== userId) {
    scopeRef.current = { userId, generation: scopeRef.current.generation + 1 };
  }
  const scope = scopeRef.current;
  const [state, setState] = useState(() => createInitialState(scope));
  const currentState = state.scope === scope ? state : createInitialState(scope);

  const isCurrent = useCallback((expectedScope) => scopeRef.current === expectedScope, []);
  const updateState = useCallback((expectedScope, updates) => {
    if (!isCurrent(expectedScope)) return;
    setState((current) => {
      if (!isCurrent(expectedScope)) return current;
      const base = current.scope === expectedScope
        ? current
        : createInitialState(expectedScope);
      return { ...base, ...updates };
    });
  }, [isCurrent]);

  const fetchListings = useCallback(async () => {
    const requestScope = scope;
    if (!requestScope.userId || !isCurrent(requestScope)) return;

    updateState(requestScope, { loading: true });
    try {
      const { data: cabins, error: cabinsError } = await supabase
        .from("cabins")
        .select("id, title, location, image_urls, is_active, is_premium, price_per_night")
        .eq("owner_id", requestScope.userId)
        .order("created_at", { ascending: false });

      if (!isCurrent(requestScope)) return;
      if (cabinsError) {
        console.error("Feil ved henting av hytter:", cabinsError.message);
        return;
      }

      const { data: subscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select("id, cabin_id, status, plan_type, price_nok, current_period_end, discount_code, provider_agreement_id")
        .eq("owner_id", requestScope.userId)
        .order("created_at", { ascending: false });

      if (!isCurrent(requestScope)) return;
      if (subsError) {
        console.error("Feil ved henting av abonnementer:", subsError.message);
      }

      const subsMap = {};
      if (subscriptions) {
        for (const sub of subscriptions) {
          if (!subsMap[sub.cabin_id]) {
            subsMap[sub.cabin_id] = sub;
          }
        }
      }

      const combined = (cabins || []).map(cabin => ({
        ...cabin,
        subscription: subsMap[cabin.id] || null,
      }));

      updateState(requestScope, { listings: combined });
    } finally {
      updateState(requestScope, { loading: false });
    }
  }, [scope, isCurrent, updateState]);

  useEffect(() => {
    updateState(scope, createInitialState(scope));
    if (scope.userId) fetchListings();
  }, [scope, fetchListings, updateState]);

  const showMessage = useCallback((expectedScope, type, text) => {
    if (!isCurrent(expectedScope)) return;
    updateState(expectedScope, { actionMessage: { type, text } });
    setTimeout(() => {
      if (isCurrent(expectedScope)) updateState(expectedScope, { actionMessage: null });
    }, 5000);
  }, [isCurrent, updateState]);

  const handleCancel = async (subscription) => {
    const actionScope = scope;
    updateState(actionScope, { confirmAction: {
      title: 'Kanseller abonnement',
      message: 'Er du sikker på at du vil kansellere abonnementet? Hytten vil bli fjernet fra siden, og du må opprette et nytt abonnement for å vise hytten igjen.',
      onConfirm: async () => {
        if (!isCurrent(actionScope)) return;
        updateState(actionScope, { confirmAction: null, actionLoading: subscription.id });
        try {
          await cancelSubscription(subscription.id);
          if (!isCurrent(actionScope)) return;
          showMessage(actionScope, 'success', 'Abonnement kansellert.');
          await fetchListings();
        } catch (e) {
          if (isCurrent(actionScope)) showMessage(actionScope, 'error', `Feil ved kansellering: ${e.message}`);
        } finally {
          updateState(actionScope, { actionLoading: null });
        }
      }
    } });
  };

  const handleReactivate = async (cabin, subscription, trigger) => {
    const actionScope = scope;
    if (!isCurrent(actionScope)) return;
    updateState(actionScope, { actionLoading: cabin.id });
    try {
      const res = await createSubscription(cabin.id, subscription?.plan_type || 'basic', null);
      if (!isCurrent(actionScope)) return;
      if (res?.free) {
        showMessage(actionScope, 'success', 'Abonnement reaktivert.');
        await fetchListings();
        return;
      }
      if (res?.redirectUrl) {
        updateState(actionScope, { vippsRedirect: { cabinId: cabin.id, url: res.redirectUrl, trigger } });
        return;
      }
      await fetchListings();
    } catch (e) {
      if (isCurrent(actionScope)) showMessage(actionScope, 'error', `Feil ved reaktivering: ${e.message}`);
    } finally {
      updateState(actionScope, { actionLoading: null });
    }
  };

  const handleActivate = async (cabin, trigger) => {
    const actionScope = scope;
    if (!isCurrent(actionScope)) return;
    updateState(actionScope, { actionLoading: cabin.id });
    try {
      const res = await createSubscription(cabin.id, 'basic', null);
      if (!isCurrent(actionScope)) return;
      if (res?.free) {
        showMessage(actionScope, 'success', 'Abonnement aktivert.');
        await fetchListings();
        return;
      }
      if (res?.redirectUrl) {
        updateState(actionScope, { vippsRedirect: { cabinId: cabin.id, url: res.redirectUrl, trigger } });
        return;
      }
      await fetchListings();
    } catch (e) {
      if (isCurrent(actionScope)) showMessage(actionScope, 'error', `Feil ved aktivering: ${e.message}`);
    } finally {
      updateState(actionScope, { actionLoading: null });
    }
  };

  const handleDeleteCabin = (listing) => {
    const actionScope = scope;
    updateState(actionScope, { confirmAction: {
      title: 'Slett hytte',
      message: 'Er du sikker på at du vil slette denne hytta? Dette kan ikke angres.',
      onConfirm: async () => {
        if (!isCurrent(actionScope)) return;
        updateState(actionScope, { confirmAction: null, actionLoading: listing.id });
        try {
          await deleteSubscription(listing.id);
          if (!isCurrent(actionScope)) return;
          showMessage(actionScope, 'success', 'Hytten er slettet.');
          await fetchListings();
        } catch (e) {
          if (isCurrent(actionScope)) showMessage(actionScope, 'error', `Feil ved sletting: ${e.message}`);
        } finally {
          updateState(actionScope, { actionLoading: null });
        }
      }
    } });
  };

  if (!userId || !profile || profile.id !== userId) return null;

  if (currentState.loading) {
    return <p className="profile-listings__loading my-subscription-listings__loading" role="status">Laster annonser...</p>;
  }

  if (currentState.listings.length === 0) {
    return (
      <div className="profile-listings__empty my-subscription-listings__empty">
        <p className="my-subscription-listings__empty-message">Du har ingen ferieboligannonser enda.</p>
        <button className="profile-listing-actions__button profile-listing-actions__button--view my-subscription-listings__create-button" type="button" onClick={() => navigate('/ny-hytte')}>
          Opprett ny feriebolig
        </button>
      </div>
    );
  }

  return (
    <>
      {currentState.confirmAction && (
        <ListingConfirmation
          action={currentState.confirmAction}
          onClose={() => updateState(scope, { confirmAction: null })}
        />
      )}

      {currentState.actionMessage && (
        <div className="profile-action-message my-subscription-listings__action-message" data-message-type={currentState.actionMessage.type} role="status">
          {currentState.actionMessage.text}
        </div>
      )}

      <div className="profile-listings my-subscription-listings__grid">
        {currentState.listings.map((listing) => (
          <SubscriptionListingCard
            key={listing.id}
            listing={listing}
            actionLoading={currentState.actionLoading}
            onView={(id) => navigate(`/hytte/${id}`)}
            onCancel={handleCancel}
            onReactivate={handleReactivate}
            onActivate={handleActivate}
            onDelete={handleDeleteCabin}
          />
        ))}
      </div>

      {currentState.vippsRedirect && (
        <VippsRedirectModal
          url={currentState.vippsRedirect.url}
          returnFocusTo={currentState.vippsRedirect.trigger}
          onClose={() => updateState(scope, { vippsRedirect: null })}
        />
      )}
    </>
  );
}
