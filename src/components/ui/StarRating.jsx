import React from 'react';

export default function StarRating({ score }) {
  if (!score || score === 0) {
    return <span className="star-rating__text star-rating__empty">Ingen reviews tilgjengelig</span>;
  }

  const decimal = score % 1;
  const fullStars = Math.floor(score);
  const hasHalfStar = decimal >= 0.25 && decimal < 0.75;
  const roundUp = decimal >= 0.75;
  const displayFullStars = roundUp ? Math.min(fullStars + 1, 5) : fullStars;
  const emptyStars = 5 - displayFullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="star-rating">
      {[...Array(displayFullStars)].map((_, i) => (
        <span className="star-rating__star is-filled" key={`full-${i}`}>★</span>
      ))}
      {hasHalfStar && (
        <span className="star-rating__half-star">
          <span className="star-rating__half-star-back">★</span>
          <span className="star-rating__half-star-front">★</span>
        </span>
      )}
      {[...Array(Math.max(0, emptyStars))].map((_, i) => (
        <span className="star-rating__star" key={`empty-${i}`}>★</span>
      ))}
      <span className="star-rating__text">
        {score.toFixed(1)} av 5
      </span>
    </div>
  );
}
