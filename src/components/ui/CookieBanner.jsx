
import { useState, useEffect, useRef } from 'react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const bannerRef = useRef(null);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('gdpr-consent');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const banner = bannerRef.current;
    const updateSpace = () => {
      document.documentElement.style.setProperty('--cookie-banner-height', `${banner.getBoundingClientRect().height}px`);
    };
    updateSpace();
    const observer = new ResizeObserver(updateSpace);
    observer.observe(banner);

    // Browsers scroll focused controls into the viewport, but do not always
    // account for a fixed banner. Correct only an actual overlap, not every Tab.
    const keepFocusVisible = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || banner.contains(target) || target.closest('[role="dialog"]')) return;
      const bounds = target.getBoundingClientRect();
      const availableBottom = banner.getBoundingClientRect().top - 12;
      if (bounds.bottom > availableBottom && bounds.top < window.innerHeight) {
        window.scrollBy({ top: bounds.bottom - availableBottom, behavior: 'instant' });
      }
    };
    document.addEventListener('focusin', keepFocusVisible);
    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', keepFocusVisible);
      document.documentElement.style.removeProperty('--cookie-banner-height');
    };
  }, [isVisible]);

  const handleAccept = () => {
    localStorage.setItem('gdpr-consent', 'accepted');
    setIsVisible(false);
  };

  const handleClose = () => {
    localStorage.setItem('gdpr-consent', 'dismissed');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-banner" ref={bannerRef}>
      <div className="cookie-banner__content">
        <p className="cookie-banner__text">
          Vi bruker informasjonskapsler for å gi deg en bedre opplevelse på vårt nettsted. 
          Ved å fortsette å bruke siden godtar du vår bruk av cookies for grunnleggende 
          funksjonalitet som innlogging og preferanser. 
          <a className="cookie-banner__policy-link" href="/personvern">Les mer om personvern</a>
        </p>
        <div className="cookie-banner__actions">
          <button className="cookie-banner__close-button" type="button" onClick={handleClose}>
            Lukk
          </button>
          <button className="cookie-banner__accept-button" type="button" onClick={handleAccept}>
            Godta cookies
          </button>
        </div>
      </div>
    </div>
  );
}
