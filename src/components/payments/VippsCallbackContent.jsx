import React from 'react';

export default function VippsCallbackContent({ phase, demoError, isDemoBanner, navigate }) {
  return (
    <main className="vipps-callback-page__content vipps-callback" id="hovedinnhold" tabIndex={-1}>
      {isDemoBanner && (
        <div className="vipps-callback__demo-banner">
          Dette er en portefølje-demo. Ingen ekte betaling trekkes.
        </div>
      )}

      {phase === 'demo_activating' && (
        <>
          <div className="vipps-callback__icon" aria-hidden="true">🔄</div>
          <h1 className="vipps-callback__title">Aktiverer demo-abonnement</h1>
          <p className="vipps-callback__message">
            Vi aktiverer demo-abonnementet ditt. Du sendes til profilen din om et øyeblikk.
          </p>
          <div className="vipps-callback__spinner" role="status" aria-label="Laster" />
        </>
      )}
      {phase === 'demo_success' && (
        <>
          <div className="vipps-callback__icon" aria-hidden="true">✅</div>
          <h1 className="vipps-callback__title">Demo-abonnement aktivert!</h1>
          <p className="vipps-callback__message">
            Abonnementet er aktivert i demo-modus. Du sendes nå til profilen din.
          </p>
          <div className="vipps-callback__spinner" role="status" aria-label="Laster" />
        </>
      )}
      {phase === 'demo_error' && (
        <>
          <div className="vipps-callback__icon" aria-hidden="true">⚠️</div>
          <h1 className="vipps-callback__title">Demo-aktivering ikke tilgjengelig</h1>
          <p className="vipps-callback__message">{demoError}</p>
          <button className="vipps-callback__manual-button vipps-callback__button" type="button" onClick={() => navigate('/min-profil', { replace: true })}>
            Gå til Min profil
          </button>
        </>
      )}
      {phase === 'polling' && (
        <>
          <div className="vipps-callback__icon" aria-hidden="true">✅</div>
          <h1 className="vipps-callback__title">Takk! Vi venter på bekreftelse fra Vipps</h1>
          <p className="vipps-callback__message">
            Vi sjekker abonnementsstatus automatisk. Du sendes til profilen din så snart betalingen er bekreftet.
          </p>
          <div className="vipps-callback__spinner" role="status" aria-label="Laster" />
        </>
      )}
      {phase === 'timeout' && (
        <>
          <div className="vipps-callback__icon" aria-hidden="true">⏳</div>
          <h1 className="vipps-callback__title">Betalingen behandles fortsatt</h1>
          <p className="vipps-callback__message">
            Vi kunne ikke bekrefte abonnementet innen forventet tid. Dette er normalt – Vipps kan bruke litt ekstra tid.
            Gå til profilen din for å se oppdatert status.
          </p>
          <button className="vipps-callback__manual-button vipps-callback__button" type="button" onClick={() => navigate('/min-profil', { replace: true })}>
            Gå til Min profil
          </button>
        </>
      )}
      {phase === 'error' && (
        <>
          <div className="vipps-callback__icon" aria-hidden="true">⚠️</div>
          <h1 className="vipps-callback__title">Noe gikk galt hos Vipps</h1>
          <p className="vipps-callback__message">
            Betalingen ble ikke fullført. Du kan prøve igjen fra profilen din.
          </p>
          <button className="vipps-callback__manual-button vipps-callback__button" type="button" onClick={() => navigate('/min-profil', { replace: true })}>
            Gå til Min profil
          </button>
        </>
      )}
    </main>
  );
}