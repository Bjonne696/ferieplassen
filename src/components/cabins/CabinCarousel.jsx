import React, { useMemo, useState } from 'react';
import { Link } from "react-router-dom";
import { formatPrice } from '../../utils/formatters';
import StarRating from "../ui/StarRating";
import useListingCabins from "../../hooks/useListingCabins";
import { useAuth } from "../../contexts/AuthContext";

export default function CabinCarousel({ className }) {
  const { cabins: premiumCabins } = useListingCabins({ premium: true });
  const cabins = useMemo(() => {
    const shuffled = [...premiumCabins].sort(() => 0.5 - Math.random());
    return Array.from(new Map(shuffled.map((item) => [item.id, item])).values()).slice(0, 8);
  }, [premiumCabins]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();

  const showCreateListingCard = cabins.length <= 4;

  const carouselItems = showCreateListingCard
    ? [...cabins, { id: '__create_listing__', isCreateListing: true }]
    : cabins;
  const activeIndex = currentIndex % carouselItems.length;

  const prev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? carouselItems.length - 1 : prevIndex - 1
    );
  };

  const next = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === carouselItems.length - 1 ? 0 : prevIndex + 1
    );
  };

  const getPosition = (index) => {
    const total = carouselItems.length;
    const relIndex = (index - activeIndex + total) % total;

    if (relIndex === 0) return 'main';
    if (relIndex === 1) return 'right-1';
    if (relIndex === 2) return 'right-2';
    if (relIndex === total - 1) return 'left-1';
    if (relIndex === total - 2) return 'left-2';
    return 'off';
  };

  return (
    <section className={["featured-cabin-carousel", className].filter(Boolean).join(" ")} role="region" aria-label="Fremhevede ferieboliger">
      <button className="button-base button featured-cabin-carousel__previous-button" type="button" onClick={prev} aria-label="Forrige feriebolig">❮</button>
      <span className="visually-hidden" role="status">
        {`Viser ${activeIndex + 1} av ${carouselItems.length}: ${carouselItems[activeIndex]?.title || 'Opprett annonse'}`}
      </span>
      <div className="featured-cabin-carousel__track">
        {carouselItems.map((item, index) => {
          const position = getPosition(index);
          const visible = position === 'main';
          if (item.isCreateListing) {
            return (
              <Link
                className={`featured-cabin-carousel__card featured-cabin-carousel__card--${position} create-listing-card create-listing-card--carousel`}
                to={user ? '/ny-hytte' : '/register'}
                key="create-listing"
                tabIndex={visible ? 0 : -1}
                aria-hidden={!visible}
              >
                <div className="create-listing-card__icon-section" aria-hidden="true">
                  <div className="create-listing-card__icon">🏠</div>
                </div>
                <div className="create-listing-card__info">
                  <h3 className="create-listing-card__title">Leie ut din feriebolig?</h3>
                  <p className="create-listing-card__description">
                    Del din feriebolig med andre og tjen ekstra inntekt på dager du ikke bruker den.
                  </p>
                  <span className="create-listing-card__call-to-action">
                    {user ? 'Opprett annonse' : 'Kom i gang'}
                  </span>
                </div>
              </Link>
            );
          }

          return (
            <Link className={`featured-cabin-carousel__card featured-cabin-carousel__card--${position}`} key={item.id} to={`/hytte/${item.id}`} tabIndex={visible ? 0 : -1} aria-hidden={!visible} aria-label={`Se feriebolig: ${item.title}, ${item.location}`}>
                {item.image_urls?.[0] && (
                  <img className="featured-cabin-carousel__image" src={item.image_urls[0]} alt="" loading="lazy" />
                )}
                <div className="featured-cabin-carousel__info">
                  <h4 className="featured-cabin-carousel__title">{item.title}</h4>
                  <p className="featured-cabin-carousel__location">{item.location}</p>
                  <p className="featured-cabin-carousel__price">{formatPrice(item.price_per_night)} / natt</p>
                  <StarRating score={item.average_score} />
                </div>
            </Link>
          );
        })}
      </div>
      <button className="button-base button featured-cabin-carousel__next-button" type="button" onClick={next} aria-label="Neste feriebolig">❯</button>
    </section>
  );
}