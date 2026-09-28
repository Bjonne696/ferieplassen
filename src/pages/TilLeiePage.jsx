import React from "react";
import Navigation from "../components/nav/Navigation";
import Footer from "../components/nav/Footer";
import RentalListings from "../components/cabins/RentalListings";

export default function TilLeiePage() {
  return (
    <div className="page-wrapper page-layout rental-page">
      <Navigation />
      <main className="main-content page-layout__content rental-page__content" id="hovedinnhold" tabIndex={-1}>
        <h1 className="rental-page__title">Til leie</h1>
        <RentalListings />
      </main>
      <Footer />
    </div>
  );
}