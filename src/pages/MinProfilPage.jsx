import React from "react";
import Navigation from "../components/nav/Navigation";
import Footer from "../components/nav/Footer";
import ProfileData from "../components/profile/ProfileData";

export default function MinProfilPage() {
  return (
    <div className="profile-page-layout">
      <Navigation />
      <main className="profile-page" id="hovedinnhold" tabIndex={-1}>
        <h1 className="profile-page__title">Min profil</h1>
        <ProfileData />
      </main>
      <Footer />
    </div>
  );
}
