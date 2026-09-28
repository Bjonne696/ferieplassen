import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Navigation from "../components/nav/Navigation";
import CabinImages from "../components/cabins/CabinImages";
import CabinDetails from "../components/cabins/CabinDetails";
import CabinOwner from "../components/cabins/CabinOwner";
import CabinMap from "../components/cabins/CabinMap";
import Footer from "../components/nav/Footer";
import { useAuth } from "../contexts/AuthContext";
import useCabinDetails from "../hooks/useCabinDetails";

export default function ShowCabinPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { cabin, owner, averageRating, status, errorMessage, retry } = useCabinDetails(id, user?.id);
  useEffect(() => {
    if (cabin?.title) document.title = `${cabin.title} | Ferieplassen`;
  }, [cabin?.title]);

  if (status === "unavailable") {
    return (
      <div className="cabin-detail-page">
        <Navigation />
        <main className="cabin-detail-page__main" id="hovedinnhold" tabIndex={-1}>
          <h1 className="cabin-detail-page__title">Feriebolig ikke tilgjengelig</h1>
          <p>Denne ferieboligen er for øyeblikket ikke aktiv eller publisert.</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (status === "loading") return (
    <div className="cabin-detail-page">
      <Navigation />
      <main className="cabin-detail-page__main" id="hovedinnhold" tabIndex={-1}>
        <p role="status">Laster ferieboliginfo...</p>
      </main>
      <Footer />
    </div>
  );

  if (status === "not-found") {
    return (
      <div className="cabin-detail-page">
        <Navigation />
        <main className="cabin-detail-page__main" id="hovedinnhold" tabIndex={-1}>
          <h1 className="cabin-detail-page__title">Feriebolig ikke funnet</h1>
          <p>Vi fant ikke ferieboligen. Den kan være slettet eller adressen kan være feil.</p>
          <p><a href="/til-leie">Se alle ferieboliger</a></p>
        </main>
        <Footer />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="cabin-detail-page">
        <Navigation />
        <main className="cabin-detail-page__main" id="hovedinnhold" tabIndex={-1}>
          <h1 className="cabin-detail-page__title">Kunne ikke vise ferieboligen</h1>
          <p role="alert">{errorMessage}</p>
          <button type="button" onClick={retry}>Prøv igjen</button>
          <p><a href="/til-leie">Se alle ferieboliger</a></p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="cabin-detail-page">
      <Navigation />
      <main className="cabin-detail-page__main" id="hovedinnhold" tabIndex={-1}>
        <h1 className="cabin-detail-page__title">{cabin.title || "Uten tittel"}</h1>
        <CabinImages imageUrls={cabin.image_urls} />
        <CabinDetails cabin={cabin} averageRating={averageRating} />
        <CabinOwner owner={owner} cabinLocation={cabin.location} />
        <CabinMap title={cabin.title} lat={cabin.latitude} lng={cabin.longitude} />
      </main>
      <Footer />
    </div>
  );
}