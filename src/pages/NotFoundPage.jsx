import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/nav/Navigation';
import Footer from '../components/nav/Footer';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <Navigation />
      <main className="not-found-page__content" id="hovedinnhold" tabIndex={-1}>
        <div className="not-found-page__icon">🏔️</div>
        <h1 className="not-found-page__title" aria-label="Siden ble ikke funnet (404)">404</h1>
        <h2 className="not-found-page__subtitle">Siden ble ikke funnet</h2>
        <p className="not-found-page__description">
          Beklager, men siden du leter etter finnes ikke. 
          Den kan ha blitt flyttet, slettet, eller du kan ha skrevet inn feil adresse.
        </p>
        <div className="not-found-page__actions">
          <Link className="not-found-page__primary-link" to="/">
            Gå til forsiden
          </Link>
          <Link className="not-found-page__secondary-link" to="/til-leie">
            Se ledige feriebolig
          </Link>
        </div>
        <section className="not-found-page__suggestions">
          <h3 className="not-found-page__suggestions-title">Kanskje du leter etter:</h3>
          <nav className="not-found-page__suggestions-grid" aria-label="Forslag til sider">
            <Link className="not-found-page__suggested-link" to="/til-leie">Til leie</Link>
            <Link className="not-found-page__suggested-link" to="/nye-hytter">Nye feriebolig</Link>
            <Link className="not-found-page__suggested-link" to="/popular">Populære</Link>
            <Link className="not-found-page__suggested-link" to="/kontakt">Kontakt oss</Link>
            <Link className="not-found-page__suggested-link" to="/om-oss">Om oss</Link>
          </nav>
        </section>
      </main>
      <Footer />
    </div>
  );
}
