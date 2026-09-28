import { useState } from "react";
import BookingRequestModal from "./BookingRequestModal";
import StarRating from "../ui/StarRating";
import { formatPrice } from '../../utils/formatters';

const getFacilityIcon = (facility) => {
  const iconMap = {
    'WiFi': '📶',
    'Parkering': '🚗',
    'Kjøkken': '🍳',
    'Bad': '🚿',
    'TV': '📺',
    'Oppvarming': '🔥',
    'Uteplass': '🏡',
    'Grill': '🔥',
    'Vaskemaskin': '🧺',
    'Oppvaskmaskin': '🍽️',
    'Jacuzzi': '🛁',
    'Sauna': '🧖',
    'Vedovn': '🪵',
    'Terrasse': '🏞️',
    'Balkong': '🏢',
    'Hage': '🌿',
    'Lekeplass': '🛝',
    'Golfbane': '⛳',
    'Ski': '🎿',
    'Sykkel': '🚴',
    'Båt': '⛵',
    'Kano': '🛶',
    'Fiske': '🎣'
  };
  return iconMap[facility] || '✨';
};

export default function CabinDetails({ cabin, averageRating, className }) {
  const [showModal, setShowModal] = useState(false);

  if (!cabin) return null;

  return (
    <section className={["cabin-details", className].filter(Boolean).join(" ")}>
      <p className="cabin-details__description">{cabin.description || "Ingen beskrivelse."}</p>
      <p className="cabin-details__price">
        <strong className="cabin-details__price-label">Pris:</strong>{" "}
        {cabin.price_per_night != null ? `${formatPrice(cabin.price_per_night)} / natt` : "Ukjent"}
      </p>
      {averageRating > 0 && (
        <div className="cabin-details__rating-section">
          <h3 className="cabin-details__section-title">Vurdering fra gjester</h3>
          <StarRating score={averageRating} />
        </div>
      )}
      {Array.isArray(cabin.facilities) && cabin.facilities.length > 0 && (
        <div className="cabin-details__facilities-section">
          <h3 className="cabin-details__section-title">Fasiliteter</h3>
          <div className="cabin-details__facilities">
            {cabin.facilities.map((facility, index) => (
              <div className="cabin-details__facility" key={index}>
                <span className="cabin-details__facility-icon facility-icon">{getFacilityIcon(facility)}</span>
                <span className="cabin-details__facility-name facility-name">{facility}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="button-base button cabin-details__booking-button" type="button" onClick={() => setShowModal(true)}>Send forespørsel</button>

      {showModal && (
        <BookingRequestModal
          cabinId={cabin.id}
          onClose={() => setShowModal(false)}
        />
      )}
    </section>
  );
}