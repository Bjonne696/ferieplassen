import React from 'react';
import { Link } from 'react-router-dom';

function CreateListingCard({ isLoggedIn = false, className }) {
  return (
    <Link className={["create-listing-card", "create-listing-card--grid", className].filter(Boolean).join(" ")} to={isLoggedIn ? '/ny-hytte' : '/register'}>
      <div className="create-listing-card__icon-section" aria-hidden="true">
        <div className="create-listing-card__icon">🏠</div>
      </div>
      <div className="create-listing-card__info">
        <h3 className="create-listing-card__title">Leie ut din feriebolig?</h3>
        <p className="create-listing-card__description">
          Del din feriebolig med andre og tjen ekstra inntekt på dager du ikke bruker den.
        </p>
        <span className="create-listing-card__call-to-action">
          {isLoggedIn ? 'Opprett annonse' : 'Kom i gang'}
        </span>
      </div>
    </Link>
  );
}

export default CreateListingCard;
