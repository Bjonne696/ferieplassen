import React, { useId } from "react";
import useModalFocus from "../../hooks/useModalFocus";

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export default function VippsRedirectModal({ url, onClose, returnFocusTo }) {
  const titleId = useId();
  const dialogRef = useModalFocus(onClose, returnFocusTo);
  return (
    <div className="modal-overlay payment-redirect-modal" onClick={onClose}>
      <div className="modal payment-redirect-modal__dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={(event) => event.stopPropagation()}>
        <button className="modal__close-button payment-redirect-modal__close-button" type="button" onClick={onClose} aria-label="Lukk betalingsdialog">&times;</button>
        <h2 className="payment-redirect-modal__title" id={titleId}>{isDemoMode ? 'Fortsett til demo-betaling' : 'Fortsett til Vipps'}</h2>
        {isDemoMode ? (
          <p className="payment-redirect-modal__description">
            Dette er en portefølje-demo. Du vil se en simulert betalingsside —
            ingen ekte betaling trekkes.
          </p>
        ) : (
          <p className="payment-redirect-modal__description">Du blir sendt til Vipps for å bekrefte abonnementet.</p>
        )}
        <div className="modal__actions payment-redirect-modal__actions">
          <button className="payment-redirect-modal__action" type="button" onClick={onClose}>
            Avbryt
          </button>
          <button className="payment-redirect-modal__action" type="button" onClick={() => window.location.assign(url)}>
            {isDemoMode ? 'Fortsett til demo-betaling' : 'Fortsett til Vipps'}
          </button>
        </div>
      </div>
    </div>
  );
}
