import React from "react";
import Navigation from '../components/nav/Navigation';
import NewCabinForm from "../components/cabins/NewCabinForm";
import Footer from "../components/nav/Footer";

export default function NyHyttePage() {
  return (
    <div className="new-cabin-page">
      <Navigation />
      <main className="new-cabin-page__main" id="hovedinnhold" tabIndex={-1}>
        <NewCabinForm />
      </main>
      <Footer />
    </div>
  );
}
