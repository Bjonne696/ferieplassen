import { useEffect, useRef } from 'react';

const focusable = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Keeps keyboard focus inside a mounted dialog and restores it when it closes.
export default function useModalFocus(onClose, returnFocusTo) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const triggerRef = useRef(returnFocusTo);
  const returnFocusRef = useRef(null);
  closeRef.current = onClose;
  triggerRef.current = returnFocusTo;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!returnFocusRef.current || !returnFocusRef.current.isConnected) {
      returnFocusRef.current = triggerRef.current?.isConnected ? triggerRef.current : document.activeElement;
    }
    const available = () => [...dialog.querySelectorAll(focusable)]
      .filter((element) => element.getClientRects().length > 0);
    (available()[0] || dialog).focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      } else if (event.key === 'Tab') {
        const items = available();
        if (!items.length) {
          event.preventDefault();
          dialog.focus();
        } else if (event.shiftKey && (document.activeElement === items[0] || document.activeElement === dialog)) {
          event.preventDefault();
          items[items.length - 1].focus();
        } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
          event.preventDefault();
          items[0].focus();
        } else if (!dialog.contains(document.activeElement)) {
          event.preventDefault();
          items[0].focus();
        }
      }
    };
    const onFocusIn = (event) => {
      if (!dialog.contains(event.target)) (available()[0] || dialog).focus();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
    };
  }, []);

  return dialogRef;
}