import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/formatters";
import StarRating from "../ui/StarRating";

export default function CabinCard({ cabin, ratingField = "average_score", className }) {
  const card = (
    <div className="card cabin-card">
      {cabin.image_urls?.[0] && <img className="cabin-card__image" src={cabin.image_urls[0]} alt="" loading="lazy" />}
      <div className="cabin-card__info">
        <h3 className="cabin-card__title">{cabin.title}</h3>
        <p className="cabin-card__location">{cabin.location}</p>
        <p className="cabin-card__price">{formatPrice(cabin.price_per_night)} / natt</p>
        <StarRating score={cabin[ratingField]} />
      </div>
    </div>
  );
  return <Link className={["cabin-card-link", className].filter(Boolean).join(" ")} to={`/hytte/${cabin.id}`} aria-label={`Se feriebolig: ${cabin.title}, ${cabin.location}`}>{card}</Link>;
}