import React from 'react';

export default function IncomingReviews({ reviews, userId }) {
  return (
    <div className="profile-content incoming-reviews">
      <div className="incoming-reviews__box">
        <h3 className="incoming-reviews__heading">Reviews</h3>
        {reviews.length === 0 ? (
          <p className="incoming-reviews__empty">Ingen reviews er tilgjengelig</p>
        ) : (
          <div className="incoming-reviews__list">
            {reviews.filter((rev) => rev.cabins?.owner_id === userId).map((rev, index) => (
              <div className="incoming-reviews__card" key={index}>
                <p className="incoming-reviews__content">
                  <strong className="incoming-reviews__cabin-title">{rev.cabins?.title}</strong><br />
                  Score: {rev.rating} ⭐<br />
                  Kommentar: {rev.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}