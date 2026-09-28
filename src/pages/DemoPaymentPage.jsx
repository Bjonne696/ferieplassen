import React from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from '../components/nav/Navigation';
import Footer from '../components/nav/Footer';
import DemoPaymentContent from '../components/payments/DemoPaymentContent';

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export default function DemoPaymentPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const subscriptionId = params.get('subscriptionId');
  const cabinId = params.get('cabinId');

  return (
    <div className="demo-payment-page">
      <Navigation />
      {!isDemoMode ? (
        <main className="demo-payment-unavailable" id="hovedinnhold" tabIndex={-1}>
          <h1 className="demo-payment-page__title">Side ikke tilgjengelig</h1>
          <p>Denne siden er kun tilgjengelig i demo-modus.</p>
        </main>
      ) : (
        <DemoPaymentContent subscriptionId={subscriptionId} cabinId={cabinId} />
      )}
      <Footer />
    </div>
  );
}