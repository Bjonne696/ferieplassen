import React from 'react';
import AddReviewForm from '../reviews/AddReviewForm';
import { formatPrice } from '../../utils/formatters';

export function UpcomingRentals({ rentals, loading, onView }) {
  return (
    <section className="profile-section upcoming-rentals">
      <h2 className="profile-section__heading upcoming-rentals__heading">Fremtidige leieforhold</h2>
      <div className="profile-section__content upcoming-rentals__content">
        {loading ? (
          <p className="upcoming-rentals__loading">Laster...</p>
        ) : rentals.length > 0 ? (
          rentals.map((rental) => (
            <div className="profile-card upcoming-rentals__card" key={rental.id}>
              <h4 className="upcoming-rentals__cabin-title">{rental.cabins?.title || "Feriebolig uten navn"}</h4>
              <p className="upcoming-rentals__dates">
                {new Date(rental.start_date).toLocaleDateString()} –{" "}
                {new Date(rental.end_date).toLocaleDateString()}
              </p>
              <p className="upcoming-rentals__location">{rental.cabins?.location}</p>
              {rental.cabins?.price_per_night != null && (
                <p className="upcoming-rentals__price">Pris per natt: {formatPrice(rental.cabins.price_per_night)}</p>
              )}
              {rental.cabins?.image_urls?.[0] && (
                <img className="profile-cabin-image upcoming-rentals__image" src={rental.cabins.image_urls[0]} alt="Bilde av ferieboligen" />
              )}
              {rental.cabins?.profiles && (
                <p className="profile-owner-info upcoming-rentals__owner">
                  Eier: {rental.cabins.profiles.name} {rental.cabins.profiles.last_name}
                  {rental.cabins.profiles.email && (
                    <> • <a className="profile-contact-link upcoming-rentals__contact-link" href={`mailto:${rental.cabins.profiles.email}`}>
                      Kontakt eier
                    </a></>
                  )}
                </p>
              )}
              <button className="profile-action-button profile-cabin-button upcoming-rentals__view-button" type="button" onClick={() => onView(rental.cabins.id)}>
                Se ferieboligside
              </button>
            </div>
          ))
        ) : (
          <p className="upcoming-rentals__empty">Ingen fremtidige leieforhold funnet.</p>
        )}
      </div>
    </section>
  );
}

export function PastRentals({ bookings, reviews, userId, onDeleteReview, onReviewSubmitted }) {
  return (
    <section className="profile-section past-rentals">
      <h2 className="profile-section__heading past-rentals__heading">Tidligere leid</h2>
      <div className="profile-section__content past-rentals__content">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <div className="profile-card past-rentals__card" key={booking.id}>
              <h4 className="past-rentals__cabin-title">{booking.cabins?.title || "Feriebolig uten navn"}</h4>
              <p className="past-rentals__dates">
                {new Date(booking.start_date).toLocaleDateString()} –{" "}
                {new Date(booking.end_date).toLocaleDateString()}
              </p>
              <p className="past-rentals__location">{booking.cabins?.location}</p>
              {booking.cabins?.image_urls?.[0] && (
                <img className="profile-cabin-image past-rentals__image" src={booking.cabins.image_urls[0]} alt="Bilde av ferieboligen" />
              )}
              {reviews.includes(booking.cabins.id) ? (
                <>
                  <p className="profile-review-status past-rentals__review-status">Du har allerede vurdert denne ferieboligen.</p>
                  <button className="profile-save-button profile-review-delete-button past-rentals__delete-review" type="button" onClick={() => onDeleteReview(booking.cabins.id)}>
                    Slett vurdering
                  </button>
                </>
              ) : (
                <AddReviewForm
                  cabinId={booking.cabins.id}
                  userId={userId}
                  onReviewSubmitted={onReviewSubmitted}
                />
              )}
            </div>
          ))
        ) : (
          <p className="past-rentals__empty">Ingen tidligere leieforhold funnet.</p>
        )}
      </div>
    </section>
  );
}