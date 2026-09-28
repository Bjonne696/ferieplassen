import React from "react";
import Navigation from '../components/nav/Navigation';
import Footer from "../components/nav/Footer";
import NewCabinsGrid from "../components/cabins/NewCabinsGrid";
import HelpText from "../components/ui/HelpText";

export default function NyeHytterPage() {
  return (
    <div className="page-wrapper page-layout new-cabins-page">
      <Navigation />
      <main className="main-content page-layout__content new-cabins-page__content" id="hovedinnhold" tabIndex={-1}>
        <h1 className="new-cabins-page__title">Nye feriebolig</h1>
        <HelpText icon="🏠" id="nye-hytter">
          <strong>Utforsk de nyeste ferieboligene!</strong><br />
          Her finner du feriebolig som nylig er lagt ut på Ferieplassen. Vær tidlig ute og book din favoritt.
        </HelpText>
        <NewCabinsGrid />
      </main>
      <Footer />
    </div>
  );
}
