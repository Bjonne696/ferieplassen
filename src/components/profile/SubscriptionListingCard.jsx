import React from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { formatPrice } from '../../utils/formatters';

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
const statusLabels = {
  active: 'Aktiv',
  pending: isDemoMode ? 'Aktivering pågår…' : 'Venter på Vipps…',
  past_due: 'Betaling forfalt',
  canceled: 'Kansellert',
};
const statusHints = {
  pending: isDemoMode
    ? 'Demo-abonnementet aktiveres. Ingen ekte betaling trekkes.'
    : 'Venter på bekreftelse fra Vipps. Ingen handling er nødvendig.',
  past_due: 'Betaling forfalt – reaktiver abonnementet for å gjenopprette synlighet.',
};

export default function SubscriptionListingCard({ listing, actionLoading, onView, onCancel, onReactivate, onActivate, onDelete }) {
  const sub = listing.subscription;
  const subStatus = sub?.status || null;
  const isProcessing = actionLoading === listing.id || actionLoading === sub?.id;
  return (
    <div className="profile-listing-card subscription-listing-card">
      {listing.image_urls?.[0] ? (
        <img className="profile-listing-card__image subscription-listing-card__image" src={listing.image_urls[0]} alt={listing.title} />
      ) : (
        <div className="profile-listing-card__image-placeholder subscription-listing-card__image-placeholder">Ingen bilde</div>
      )}
      <div className="profile-listing-card__body subscription-listing-card__body">
        <div className="profile-listing-card__header subscription-listing-card__header">
          <h4 className="profile-listing-card__title subscription-listing-card__title">{listing.title}</h4>
          {subStatus ? (
            <span className="profile-subscription-badge subscription-listing-card__badge" data-subscription-status={subStatus}>
              {statusLabels[subStatus] || subStatus}
            </span>
          ) : (
            <span className="profile-subscription-badge subscription-listing-card__badge" data-subscription-status="none">Ingen abb.</span>
          )}
        </div>
        <p className="profile-listing-card__location subscription-listing-card__location">{listing.location}</p>
        <p className="profile-listing-card__price subscription-listing-card__price">{formatPrice(listing.price_per_night)} / natt</p>
        {sub && (
          <div className="profile-subscription-info subscription-listing-card__subscription">
            <span className="profile-subscription-info__detail subscription-listing-card__subscription-detail">
              Plan: {sub.plan_type === 'premium' ? 'Premium' : 'Standard'}
            </span>
            {sub.price_nok !== undefined && (
              <span className="profile-subscription-info__detail subscription-listing-card__subscription-detail">{sub.price_nok} NOK/mnd</span>
            )}
            {subStatus === 'canceled' ? (
              <span className="profile-subscription-info__detail subscription-listing-card__subscription-detail">Fornyes: Kansellert</span>
            ) : sub.current_period_end ? (
              <span className="profile-subscription-info__detail subscription-listing-card__subscription-detail">
                Fornyes: {format(new Date(sub.current_period_end), "dd.MM.yyyy", { locale: nb })}
              </span>
            ) : null}
            {sub.discount_code && (
              <span className="profile-subscription-info__detail subscription-listing-card__subscription-detail">Rabattkode: {sub.discount_code}</span>
            )}
          </div>
        )}
        {subStatus && statusHints[subStatus] && (
          <div className="profile-action-message subscription-listing-card__status-message" data-message-type={subStatus === 'past_due' ? 'error' : 'success'} role="status">
            {statusHints[subStatus]}
          </div>
        )}
        <div className="profile-listing-actions subscription-listing-card__actions">
          <button className="profile-listing-actions__button profile-listing-actions__button--view subscription-listing-card__view-button" type="button" onClick={() => onView(listing.id)}>
            Se hytte
          </button>
          {subStatus === 'active' && (
            <button className="profile-listing-actions__button profile-listing-actions__button--danger subscription-listing-card__cancel-button" type="button" onClick={() => onCancel(sub)} disabled={isProcessing}>
              {isProcessing ? 'Kansellerer...' : 'Kanseller'}
            </button>
          )}
          {(subStatus === 'canceled' || subStatus === 'past_due') && (
            <button className="profile-listing-actions__button profile-listing-actions__button--activate subscription-listing-card__reactivate-button" type="button" onClick={(event) => onReactivate(listing, sub, event.currentTarget)} disabled={isProcessing}>
              {isProcessing ? 'Aktiverer...' : 'Aktiver på nytt'}
            </button>
          )}
          {!subStatus && (
            <button className="profile-listing-actions__button profile-listing-actions__button--activate subscription-listing-card__activate-button" type="button" onClick={(event) => onActivate(listing, event.currentTarget)} disabled={isProcessing}>
              {isProcessing ? 'Aktiverer...' : 'Aktiver'}
            </button>
          )}
          {listing.is_active !== true && subStatus !== 'pending' && (
            <button className="profile-listing-actions__button profile-listing-actions__button--danger subscription-listing-card__delete-button" type="button" onClick={() => onDelete(listing)} disabled={isProcessing}>
              {isProcessing ? 'Sletter...' : 'Slett hytte'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}