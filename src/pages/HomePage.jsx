import React from "react";
import Navigation from "../components/nav/Navigation";
import Footer from "../components/nav/Footer";
import CabinCarousel from "../components/cabins/CabinCarousel";
import DevelopmentNotice from "../components/ui/DevelopmentNotice";
import HomeListings from "../components/cabins/HomeListings";

export default function HomePage() {
  return (
    <div className="page-wrapper home-page">
      <Navigation />
      <main className="main-content home-page__content" id="hovedinnhold" tabIndex={-1}>
        <h1 className="home-page__title">Velkommen til Ferieplassen!</h1>
        <DevelopmentNotice />
        <CabinCarousel />
        <HomeListings />
      </main>
      <Footer />
    </div>
  );
}