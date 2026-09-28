import { useEffect, useId } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import Tooltip from "../ui/Tooltip";
import { plans } from "../../hooks/useNewCabinForm";
import { facilityOptions } from "../../utils/facilityOptions";


function MapController({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
}

function DraggableMarker({ position, onMove }) {
  return (
    <Marker
      draggable
      position={position}
      eventHandlers={{
        dragend: e => onMove(e.target.getLatLng()),
      }}
    />
  );
}

export function ListingFields({ form }) {
  return (
    <>
      <div className="form-field new-cabin-form__field new-cabin-form__listing-field">
        <Tooltip text="Skriv en kort, beskrivende tittel som fanger oppmerksomheten. Eksempel: 'Koselig feriebolig ved sjøen'">
          <label className="form-label new-cabin-form__label" htmlFor="cabin-title">Tittel *</label>
        </Tooltip>
        <input className="form-input new-cabin-form__input" id="cabin-title" value={form.title} onChange={e => form.setTitle(e.target.value)}
          onBlur={() => form.handleFieldBlur("title")}
          placeholder="Eksempel: Koselig feriebolig ved sjøen"
          aria-invalid={!!form.errors.title}
          aria-describedby={form.errors.title ? "cabin-title-error" : undefined} required />
        {form.errors.title && <p className="new-cabin-form__field-error new-cabin-form__error" id="cabin-title-error">{form.errors.title}</p>}
      </div>
      <div className="form-field new-cabin-form__field new-cabin-form__listing-field">
        <Tooltip text="Beskriv hytta detaljert: beliggenhet, utsikt, aktiviteter i nærheten, spesielle egenskaper. Jo mer informasjon, jo bedre!">
          <label className="form-label new-cabin-form__label" htmlFor="cabin-description">Beskrivelse *</label>
        </Tooltip>
        <textarea className="form-textarea new-cabin-form__textarea" id="cabin-description" value={form.description} onChange={e => form.setDescription(e.target.value)}
          onBlur={() => form.handleFieldBlur("description")}
          placeholder="Beskriv hytta, beliggenheten, aktiviteter i nærheten og spesielle egenskaper..."
          aria-invalid={!!form.errors.description}
          aria-describedby={form.errors.description ? "cabin-description-error" : undefined} required />
        {form.errors.description && <p className="new-cabin-form__field-error new-cabin-form__error" id="cabin-description-error">{form.errors.description}</p>}
      </div>
      <div className="form-field new-cabin-form__field new-cabin-form__listing-field">
        <Tooltip text="Sett en konkurransedyktig pris. Se på lignende feriebolig i området for å finne riktig prisnivå.">
          <label className="form-label new-cabin-form__label" htmlFor="cabin-price">Pris per natt (kroner) *</label>
        </Tooltip>
        <input className="form-input new-cabin-form__input" id="cabin-price" type="number" value={form.price} onChange={e => form.setPrice(e.target.value)}
          onBlur={() => form.handleFieldBlur("price")}
          placeholder="1500" min="100" max="10000"
          aria-invalid={!!form.errors.price}
          aria-describedby={form.errors.price ? "cabin-price-error" : undefined} required />
        {form.errors.price && <p className="new-cabin-form__field-error new-cabin-form__error" id="cabin-price-error">{form.errors.price}</p>}
      </div>
    </>
  );
}

export function FacilitiesField({ form }) {
  return (
    <fieldset className="form-field new-cabin-form__field new-cabin-form__facilities-field" aria-invalid={!!form.errors.facilities} aria-describedby={form.errors.facilities ? "cabin-facilities-error" : undefined}>
      <legend className="form-label new-cabin-form__label">Fasiliteter *</legend>
      <Tooltip text="Velg fasiliteter som finnes på hytta. Dette hjelper gjester å finne det de leter etter og øker bookingsansen.">
        <span className="new-cabin-form__facility-instructions">Velg fasiliteter som finnes på hytta</span>
      </Tooltip>
      <div className="new-cabin-form__checkbox-group new-cabin-form__facility-options">
        {facilityOptions.map(facility => (
          <label className="new-cabin-form__facility-option" key={facility}>
            <input className="new-cabin-form__facility-checkbox" type="checkbox" checked={form.facilities.includes(facility)}
              onChange={() => form.handleFacilityChange(facility)} />
            {facility}
          </label>
        ))}
      </div>
      {form.errors.facilities && <p className="new-cabin-form__field-error new-cabin-form__error" id="cabin-facilities-error">{form.errors.facilities}</p>}
    </fieldset>
  );
}

export function ImageField({ form }) {
  return (
    <div className="form-field new-cabin-form__field new-cabin-form__image-field">
      <Tooltip text="Last opp 3-5 bilder av høy kvalitet. Første bilde blir hovedbildet. Vis rom, utsikt og omgivelser.">
        <label className="form-label new-cabin-form__label" htmlFor="cabin-images">Bilder * (3-5 bilder anbefales)</label>
      </Tooltip>
      <input className="form-input new-cabin-form__input new-cabin-form__file-input" id="cabin-images" type="file" accept="image/*" multiple
        aria-invalid={!!form.errors.files} aria-describedby={[form.files.length > 0 && "cabin-file-info", form.errors.files && "cabin-images-error"].filter(Boolean).join(" ") || undefined}
        onChange={e => form.setFiles([...e.target.files])} required />
      {form.files.length > 0 && <p className="new-cabin-form__file-info" id="cabin-file-info">{form.files.length} bilde(r) valgt</p>}
      {form.errors.files && <p className="new-cabin-form__field-error new-cabin-form__error" id="cabin-images-error">{form.errors.files}</p>}
    </div>
  );
}

export function AddressAndMapFields({ form }) {
  const { locationInfo, setLocationInfo, latitude, longitude } = form;
  return (
    <>
      <fieldset className="form-field new-cabin-form__field new-cabin-form__address-field">
        <legend className="form-label new-cabin-form__label">Søk etter adresse</legend>
        <div className="new-cabin-form__address-fields">
          <label className="new-cabin-form__address-label" htmlFor="cabin-address">Adresse</label>
          <input className="new-cabin-form__address-input" id="cabin-address" type="text" autoComplete="street-address" placeholder="Adresse (f.eks. Storgata 1)" value={locationInfo.address}
            onChange={e => setLocationInfo(prev => ({ ...prev, address: e.target.value }))} />
          <label className="new-cabin-form__address-label" htmlFor="cabin-postal">Postnummer</label>
          <input className="new-cabin-form__address-input" id="cabin-postal" type="text" autoComplete="postal-code" placeholder="Postnummer" value={locationInfo.postalCode}
            onChange={e => setLocationInfo(prev => ({ ...prev, postalCode: e.target.value }))} />
          <label className="new-cabin-form__address-label" htmlFor="cabin-city">By / sted</label>
          <input className="new-cabin-form__address-input" id="cabin-city" type="text" autoComplete="address-level2" placeholder="By / sted" value={locationInfo.city}
            onChange={e => setLocationInfo(prev => ({ ...prev, city: e.target.value }))} />
          <button className="new-cabin-form__address-search-button new-cabin-form__geocode-button" type="button" onClick={form.handleForwardGeocode} disabled={form.geocodeLoading}>
            {form.geocodeLoading ? "Søker..." : "Finn på kart"}
          </button>
        </div>
        {form.geocodeError && <p className="new-cabin-form__address-search-error new-cabin-form__error" role="alert">{form.geocodeError}</p>}
      </fieldset>
      <fieldset className="form-field new-cabin-form__field new-cabin-form__map-field" aria-describedby="cabin-coordinate-help">
        <legend className="form-label new-cabin-form__label">Plasser markør nøyaktig på kartet</legend>
        <p className="new-cabin-form__coordinate-help" id="cabin-coordinate-help">Dra markøren på kartet, eller skriv inn breddegrad og lengdegrad med tastaturet.</p>
        <label className="form-label new-cabin-form__label" htmlFor="cabin-latitude">Breddegrad</label>
        <input className="form-input new-cabin-form__input" id="cabin-latitude" type="number" step="any" min="-90" max="90" value={latitude}
          onChange={e => form.setLatitude(e.target.value)} aria-invalid={!!form.errors.location}
          aria-describedby={form.errors.location ? "cabin-location-error" : undefined} />
        <label className="form-label new-cabin-form__label" htmlFor="cabin-longitude">Lengdegrad</label>
        <input className="form-input new-cabin-form__input" id="cabin-longitude" type="number" step="any" min="-180" max="180" value={longitude}
          onChange={e => form.setLongitude(e.target.value)} aria-invalid={!!form.errors.location}
          aria-describedby={form.errors.location ? "cabin-location-error" : undefined} />
        {form.errors.location && <p className="new-cabin-form__field-error new-cabin-form__error" id="cabin-location-error">{form.errors.location}</p>}
        {latitude !== "" && longitude !== "" &&
          Number(latitude) >= -90 && Number(latitude) <= 90 &&
          Number(longitude) >= -180 && Number(longitude) <= 180 && (
          <MapContainer className="leaflet-container new-cabin-form__location-map" center={[Number(latitude), Number(longitude)]} zoom={13} aria-label="Kart med markør for hyttas plassering">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapController lat={Number(latitude)} lng={Number(longitude)} />
            <DraggableMarker position={{ lat: Number(latitude), lng: Number(longitude) }} onMove={form.handleMarkerMove} />
          </MapContainer>
        )}
      </fieldset>
    </>
  );
}

export function SubscriptionFields({ form }) {
  const id = useId();
  if (form.isAdmin) return null;
  return (
    <section className="new-cabin-subscription new-cabin-form__subscription">
      <h3 className="new-cabin-subscription__title new-cabin-form__section-title" id={`${id}-heading`}>Velg abonnementsplan</h3>
      <div className="new-cabin-subscription__plan-selector new-cabin-form__plans" role="radiogroup" aria-labelledby={`${id}-heading`}>
        {Object.entries(plans).map(([key, plan]) => (
          <div className={`new-cabin-subscription__plan-card new-cabin-form__plan${form.selectedPlan === key ? " new-cabin-subscription__plan-card--selected" : ""}`} key={key}>
            <input className="new-cabin-form__plan-input" id={`${id}-${key}`} type="radio" name={`${id}-plan`} value={key}
              aria-describedby={`${id}-${key}-price ${id}-${key}-features`}
              checked={form.selectedPlan === key}
              onChange={() => form.setSelectedPlan(key)} />
            <label className="new-cabin-subscription__plan-label new-cabin-form__plan-label" htmlFor={`${id}-${key}`}><span className="new-cabin-subscription__plan-name new-cabin-form__plan-name">{plan.name}</span></label>
            <div className="new-cabin-subscription__plan-price" id={`${id}-${key}-price`}>{plan.price} NOK /mnd</div>
            <ul className="new-cabin-subscription__plan-features new-cabin-form__plan-features" id={`${id}-${key}-features`}>
              {plan.features.map((feature) => <li className="new-cabin-form__plan-feature" key={feature}>{feature}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="new-cabin-subscription__discount-section new-cabin-form__discount">
        <label className="new-cabin-form__discount-label" htmlFor="cabin-discount">Har du en rabattkode?</label>
        <input className="new-cabin-subscription__discount-input new-cabin-form__discount-input" id="cabin-discount" type="text" value={form.discountCode}
          onChange={e => form.setDiscountCode(e.target.value)}
          placeholder="Skriv inn rabattkode" maxLength={20} aria-invalid={!!form.discountError}
          aria-describedby={form.discountError ? "cabin-discount-error" : undefined} />
        <button className="new-cabin-subscription__validate-button new-cabin-form__validate-discount" type="button" onClick={form.handleValidateDiscount}
          disabled={!form.discountCode.trim() || form.validatingCode || form.loading}>
          {form.validatingCode ? "Validerer..." : "Valider kode"}
        </button>
        {form.validatedDiscount && (
          <div className="new-cabin-subscription__discount-success new-cabin-form__discount-success" role="status">Rabattkode validert: <strong>{form.validatedDiscount.code}</strong></div>
        )}
        {form.discountError && <div className="new-cabin-subscription__discount-error new-cabin-form__error" id="cabin-discount-error" role="alert">{form.discountError}</div>}
      </div>
      <div className="new-cabin-subscription__information new-cabin-form__subscription-info">
        {import.meta.env.VITE_DEMO_MODE === "true"
          ? "Dette er en portefølje-demo. Abonnementet aktiveres uten ekte Vipps-belastning."
          : "Betaling skjer via Vipps MobilePay (når rabattkode ikke brukes). Du kan kansellere når som helst. Ingen bindingstid."}
      </div>
    </section>
  );
}