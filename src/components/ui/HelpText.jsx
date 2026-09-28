import React, { useState } from 'react';

export default function HelpText({ children, icon = "💡", id }) {
  const storageKey = id ? `helptext_dismissed_${id}` : null;
  
  const [isDismissed, setIsDismissed] = useState(() => {
    if (!storageKey) return false;
    return sessionStorage.getItem(storageKey) === 'true';
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    if (storageKey) {
      sessionStorage.setItem(storageKey, 'true');
    }
  };

  if (isDismissed) return null;

  return (
    <div className="help-text">
      <span className="help-text__icon" aria-hidden="true">{icon}</span>
      <div className="help-text__content">
        {children}
      </div>
      <button className="help-text__close-button" type="button" onClick={handleDismiss} aria-label="Lukk">
        ×
      </button>
    </div>
  );
}
