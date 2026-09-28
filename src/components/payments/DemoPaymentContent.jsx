import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DemoPaymentContent({ subscriptionId, cabinId }) {
  const navigate = useNavigate();

  const handleConfirm = () => {
    const callbackParams = new URLSearchParams({ demo: '1' });
    if (subscriptionId) callbackParams.set('subscriptionId', subscriptionId);
    if (cabinId) callbackParams.set('cabinId', cabinId);
    navigate(`/vipps/callback?${callbackParams.toString()}`, { replace: true });
  };

  return (
    <main className="demo-payment-page__content demo-payment" id="hovedinnhold" tabIndex={-1}>
      <div className="demo-payment-card demo-payment__card">
        <div className="demo-payment-card__icon demo-payment__icon" aria-hidden="true">🧪</div>
        <h1 className="demo-payment-card__title demo-payment__title">Demo-betaling</h1>
        <div className="demo-payment-banner demo-payment__banner">
          Dette er en portefølje-demo. Ingen ekte betaling trekkes —
          abonnementet aktiveres simulert for demonstrasjonsformål.
        </div>
        <p className="demo-payment-card__info demo-payment__info">
          I produksjon ville du nå blitt sendt til Vipps for å godkjenne
          et månedlig abonnement. Her simulerer vi dette steget.
        </p>
        <button className="demo-payment-card__confirm demo-payment__confirm-button" type="button" onClick={handleConfirm}>
          Godkjenn demo-betaling
        </button>
        <button className="demo-payment-card__cancel demo-payment__cancel-link" type="button" onClick={() => navigate('/min-profil', { replace: true })}>
          Avbryt og gå til profil
        </button>
      </div>
    </main>
  );
}