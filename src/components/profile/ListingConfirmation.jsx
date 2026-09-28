import React, { useId } from 'react';
import useModalFocus from '../../hooks/useModalFocus';

export default function ListingConfirmation({ action, onClose }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useModalFocus(onClose);
  return (
    <div className="profile-confirmation-overlay listing-confirmation" onClick={onClose}>
      <div className="profile-confirmation-dialog listing-confirmation__dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <h2 className="listing-confirmation__title" id={titleId}>{action.title}</h2>
        <p className="listing-confirmation__message" id={descriptionId}>{action.message}</p>
        <div className="profile-confirmation-dialog__actions listing-confirmation__actions">
          <button className="profile-listing-actions__button profile-listing-actions__button--view listing-confirmation__cancel" type="button" onClick={onClose}>Avbryt</button>
          <button className="profile-listing-actions__button profile-listing-actions__button--danger listing-confirmation__confirm" type="button" onClick={action.onConfirm}>Bekreft</button>
        </div>
      </div>
    </div>
  );
}