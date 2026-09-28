import React from 'react';
import Navigation from '../components/nav/Navigation';
import Footer from '../components/nav/Footer';
import VippsCallbackContent from '../components/payments/VippsCallbackContent';
import useVippsCallback from '../hooks/useVippsCallback';

export default function VippsCallbackPage() {
  const callback = useVippsCallback();
  return (
    <div className="vipps-callback-page">
      <Navigation />
      <VippsCallbackContent {...callback} />
      <Footer />
    </div>
  );
}