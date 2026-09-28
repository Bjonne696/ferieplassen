import React from "react";
import Navigation from "../components/nav/Navigation";
import Footer from "../components/nav/Footer";
import PopularListings from "../components/cabins/PopularListings";

export default function PopularPage() {
  return (
    <div className="page-wrapper page-layout popular-page">
      <Navigation />
      <main className="main-content page-layout__content popular-page__content" id="hovedinnhold" tabIndex={-1}>
        <h1 className="popular-page__title">Populære feriebolig</h1>
        <PopularListings />
      </main>
      <Footer />
    </div>
  );
}