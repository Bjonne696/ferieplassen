import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { createSubscription, validateDiscountCode } from "../services/subscriptionService";
import { insertCabin, reverseGeocodeLocation, searchLocation, uploadCabinImages } from "../services/newCabinService";
import { createCabinListing } from "../services/createCabinListing";

export const plans = {
  basic: {
    name: "Standard", price: 99,
    features: ["Hytte synlig for leietakere", "Grunnleggende statistikk", "E-post varsling", "Ubegrenset antall bookinger"],
  },
  premium: {
    name: "Premium", price: 149,
    features: ["Alt i Standard", "Fremhevet plassering", "Prioritert support"],
  },
};

const normalizeCode = code => code.trim().toUpperCase();

export default function useNewCabinForm() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [latitude, setLatitude] = useState(59.9139);
  const [longitude, setLongitude] = useState(10.7522);
  const [locationInfo, setLocationInfo] = useState({ address: "", postalCode: "", city: "" });
  const [files, setFiles] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vippsRedirectUrl, setVippsRedirectUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [discountCode, setDiscountCode] = useState("");
  const [validatedDiscount, setValidatedDiscount] = useState(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [discountError, setDiscountError] = useState(null);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState(null);
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    setValidatedDiscount(null);
    setDiscountError(null);
  }, [discountCode]);

  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Tittel er påkrevd";
    else if (title.trim().length < 10) newErrors.title = "Tittel må være minst 10 tegn";
    else if (title.trim().length > 100) newErrors.title = "Tittel kan ikke være mer enn 100 tegn";
    if (!description.trim()) newErrors.description = "Beskrivelse er påkrevd";
    else if (description.trim().length < 50) newErrors.description = "Beskrivelse må være minst 50 tegn";
    else if (description.trim().length > 2000) newErrors.description = "Beskrivelse kan ikke være mer enn 2000 tegn";
    if (!price) newErrors.price = "Pris er påkrevd";
    else if (isNaN(price) || parseInt(price) < 100) newErrors.price = "Pris må være minst 100 kroner";
    else if (parseInt(price) > 10000) newErrors.price = "Pris kan ikke være mer enn 10,000 kroner";
    if (files.length === 0) newErrors.files = "Minst ett bilde er påkrevd";
    else if (files.length < 3) newErrors.files = "Minst 3 bilder anbefales";
    else if (files.length > 5) newErrors.files = "Maksimalt 5 bilder tillatt";
    if (latitude === "" || longitude === "" || !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude)) || Number(latitude) < -90 || Number(latitude) > 90 ||
      Number(longitude) < -180 || Number(longitude) > 180)
      newErrors.location = "Oppgi gyldig breddegrad (-90 til 90) og lengdegrad (-180 til 180)";
    if (facilities.length === 0) newErrors.facilities = "Velg minst én fasilitet";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldBlur = field => setTouched(prev => ({ ...prev, [field]: true }));
  const handleFacilityChange = facility => setFacilities(prev =>
    prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]);

  const reverseGeocode = async (lat, lon) => {
    const data = await reverseGeocodeLocation(lat, lon);
    if (data && data.address) {
      setLocationInfo({
        address: data.display_name || "",
        postalCode: data.address.postcode || "",
        city: data.address.city || data.address.town || data.address.village || "",
      });
    }
  };
  const handleMarkerMove = pos => {
    setLatitude(pos.lat);
    setLongitude(pos.lng);
    reverseGeocode(pos.lat, pos.lng);
  };
  const handleForwardGeocode = async () => {
    const query = [locationInfo.address, locationInfo.postalCode, locationInfo.city].filter(Boolean).join(" ");
    if (!query.trim()) {
      setGeocodeError("Skriv inn en adresse for å søke.");
      return;
    }
    setGeocodeLoading(true);
    setGeocodeError(null);
    try {
      const data = await searchLocation(query);
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setLatitude(parseFloat(lat));
        setLongitude(parseFloat(lon));
        setLocationInfo(prev => ({ ...prev, address: display_name }));
      } else setGeocodeError("Ingen treff. Prøv med mer detaljert adresse, postnummer eller by.");
    } catch {
      setGeocodeError("Feil ved adressesøk. Sjekk nettforbindelsen og prøv igjen.");
    } finally {
      setGeocodeLoading(false);
    }
  };
  const handleValidateDiscount = async () => {
    const code = normalizeCode(discountCode);
    if (!code) return;
    setValidatingCode(true);
    setDiscountError(null);
    try {
      const result = await validateDiscountCode(code);
      if (result.valid) {
        setValidatedDiscount(result.discount);
        setDiscountError(null);
      } else {
        setDiscountError(result.error || "Ugyldig rabattkode");
        setValidatedDiscount(null);
      }
    } finally {
      setValidatingCode(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!user) {
      setErrors({ submit: "Du må være logget inn" });
      return;
    }
    if (!validateForm()) {
      setErrors(prev => ({ ...prev, submit: "Vennligst rett opp feilene over" }));
      return;
    }
    setLoading(true);
    setErrors({});
    setSubmitMessage(null);
    const code = normalizeCode(discountCode);
    if (!isAdmin && code) {
      const result = await validateDiscountCode(code);
      if (!result.valid) {
        setDiscountError(result.error || "Ugyldig rabattkode");
        setLoading(false);
        return;
      }
      setValidatedDiscount(result.discount);
    }
    try {
      const fullLocation = `${locationInfo.address}, ${locationInfo.postalCode} ${locationInfo.city}`;
      const result = await createCabinListing({
        files, isAdmin, selectedPlan, discountCode: code,
        uploadImages: uploadCabinImages, insertCabin, createSubscription,
        cabin: {
          owner_id: user.id,
          title,
          description,
          price_per_night: parseInt(price) * 100,
          location: fullLocation,
          latitude,
          longitude,
          facilities,
          is_premium: selectedPlan === "premium",
        },
      });
      if (result.kind === "admin") {
        setSubmitMessage({ type: "success", text: "Ferieboligen er publisert! (Admin-konto – ingen betaling kreves)" });
        setTimeout(() => navigate("/min-profil", { replace: true, state: { justActivated: true } }), 1500);
        return;
      }
      if (result.kind === "free") {
        navigate("/min-profil", { replace: true, state: { justActivated: true } });
        return;
      }
      if (result.kind === "redirect") {
        setVippsRedirectUrl(result.url);
        return;
      }
      setSubmitMessage({ type: "error", text: "Uventet respons fra server. Prøv igjen." });
      setLoading(false);
    } catch (err) {
      setSubmitMessage({ type: "error", text: err?.message || "Noe gikk galt ved opprettelse." });
      setLoading(false);
    }
  };

  const buttonText = (() => {
    if (loading) return "Oppretter...";
    if (isAdmin) return "Publiser ferieboligen (admin)";
    if (discountCode.trim() && validatedDiscount) return "Opprett feriebolig (bruk rabattkode)";
    if (import.meta.env.VITE_DEMO_MODE === "true")
      return `Opprett feriebolig og aktiver demo-abonnement (${plans[selectedPlan].price} NOK/mnd)`;
    return `Opprett feriebolig og betal med Vipps (${plans[selectedPlan].price} NOK/mnd)`;
  })();

  return {
    title, setTitle, description, setDescription, price, setPrice,
    latitude, longitude, setLatitude, setLongitude, locationInfo, setLocationInfo, files, setFiles,
    facilities, loading, vippsRedirectUrl, setVippsRedirectUrl, setLoading,
    errors, touched, selectedPlan, setSelectedPlan, discountCode, setDiscountCode,
    validatedDiscount, validatingCode, discountError, submitMessage,
    geocodeLoading, geocodeError, isAdmin, handleFieldBlur, handleFacilityChange,
    handleMarkerMove, handleForwardGeocode, handleValidateDiscount, handleSubmit, buttonText,
  };
}