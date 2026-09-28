import React from "react";
import Navigation from "../components/nav/Navigation";
import Footer from "../components/nav/Footer";
import AdminData from "../components/admin/AdminData";

export default function AdminPage() {
  return (
    <div className="admin-page-layout">
      <Navigation />
      <main className="admin-page" id="hovedinnhold" tabIndex={-1}>
        <h1 className="admin-page__title">Adminpanel</h1>
        <AdminData />
      </main>
      <Footer />
    </div>
  );
}