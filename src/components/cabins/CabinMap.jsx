
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const openGoogleMaps = (lat, lng, title) => {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(title)}`;
  window.open(googleMapsUrl, '_blank');
};

export default function CabinMap({ title, lat, lng, cabins = [], className }) {
  // Hvis vi har en enkelt hytte
  if (title && lat != null && lng != null) {
    return (
      <div className={["cabin-map", className].filter(Boolean).join(" ")}>
        <MapContainer
          className="leaflet-container cabin-map__single"
          center={[lat, lng]}
          zoom={13}
          scrollWheelZoom={false}
          eventHandlers={{
            click: () => openGoogleMaps(lat, lng, title)
          }}
        >
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[lat, lng]}>
            <Popup>{title}</Popup>
          </Marker>
        </MapContainer>
        <button className="button-base button cabin-map__google-maps-button" type="button" onClick={() => openGoogleMaps(lat, lng, title)}>
          📍 Åpne i Google Maps
        </button>
      </div>
    );
  }

  // Hvis vi har flere hytter
  if (cabins && cabins.length > 0) {
    const validCabins = cabins.filter(cabin => 
      cabin.latitude != null && cabin.longitude != null
    );

    if (validCabins.length === 0) {
      return <p className={["cabin-map__empty", className].filter(Boolean).join(" ")}>Ingen feriebolig med gyldig posisjon funnet.</p>;
    }

    // Beregn senterpunkt basert på alle hyttenes posisjoner
    const centerLat = validCabins.reduce((sum, cabin) => sum + cabin.latitude, 0) / validCabins.length;
    const centerLng = validCabins.reduce((sum, cabin) => sum + cabin.longitude, 0) / validCabins.length;

    return (
      <div className={["cabin-map", className].filter(Boolean).join(" ")}>
        <MapContainer
          className="leaflet-container cabin-map__multiple"
          center={[centerLat, centerLng]}
          zoom={10}
          scrollWheelZoom={true}
        >
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {validCabins.map((cabin) => (
            <Marker 
              key={cabin.id} 
              position={[cabin.latitude, cabin.longitude]}
            >
              <Popup>
                <div className="cabin-map__popup">
                  <strong className="cabin-map__popup-title">{cabin.title}</strong><br />
                  {cabin.price_per_night && (
                    <span className="cabin-map__popup-price">Kr {(cabin.price_per_night / 100).toLocaleString()}/natt</span>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
  }

  return <p className={["cabin-map__empty", className].filter(Boolean).join(" ")}>Kartposisjon er ikke tilgjengelig.</p>;
}
