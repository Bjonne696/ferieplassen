import { useId } from "react";
import { DateRange } from "react-date-range";
import useBookingRequest from "../../hooks/useBookingRequest";
import useModalFocus from "../../hooks/useModalFocus";
import HelpText from "../ui/HelpText";

export default function BookingRequestModal({ cabinId, onClose }) {
  const titleId = useId();
  const dialogRef = useModalFocus(onClose);
  const {
    session, dateRange, setDateRange, message, setMessage, sending, error, success,
    approvedBookings, loadingBookings, bookingsError, pendingCount, loadingPendingCount,
    handleSubmit,
  } = useBookingRequest(cabinId);

  return (
    <div className="modal-overlay booking-request-modal" onClick={onClose}>
      <div className="modal booking-request-modal__dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={(event) => event.stopPropagation()}>
        <h2 className="booking-request-modal__title" id={titleId}>Send forespørsel</h2>

        <HelpText icon="📅">
          Fyll ut datoene du ønsker å leie ferieboligen og skriv en kort melding til utleier.
          Utleier vil få beskjed og kan godkjenne eller avslå forespørselen din.
        </HelpText>

        {!loadingPendingCount && session && pendingCount > 0 && (
          <HelpText icon="⏳">
            Du har {pendingCount} aktiv{pendingCount > 1 ? 'e' : ''} forespørsel{pendingCount > 1 ? 'er' : ''} for denne ferieboligen (maks 2).
          </HelpText>
        )}

        {!session ? (
          <p className="modal__warning booking-request-modal__warning">Du må være logget inn for å sende en forespørsel.</p>
        ) : bookingsError ? (
          <p className="modal__error booking-request-modal__error" role="alert">{bookingsError}</p>
        ) : loadingBookings ? (
          <p className="booking-request-modal__loading" role="status">Laster tilgjengelige datoer...</p>
        ) : (
          <>
            <DateRange
              ariaLabels={{ dateInput: { selection: { startDate: 'Fra dato', endDate: 'Til dato' } }, monthPicker: 'Måned', yearPicker: 'År', prevButton: 'Forrige måned', nextButton: 'Neste måned' }}
              editableDateInputs={true}
              onChange={(item) => setDateRange([item.selection])}
              moveRangeOnFirstSelection={false}
              ranges={dateRange}
              minDate={new Date()}
              disabledDates={approvedBookings.flatMap(booking => {
                const dates = [];
                const current = new Date(booking.start);
                while (current <= booking.end) {
                  dates.push(new Date(current));
                  current.setDate(current.getDate() + 1);
                }
                return dates;
              })}
            />

            {approvedBookings.length > 0 && (
              <HelpText icon="ℹ️">
                Grå datoer er allerede opptatt og kan ikke velges.
              </HelpText>
            )}

            <label className="modal__form-label booking-request-modal__message-label">
              Melding (valgfritt):
              <textarea
                className="modal__form-textarea booking-request-modal__message-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
          </>
        )}

        {error && <p className="modal__error booking-request-modal__error" role="alert">{error}</p>}
        {success && <p className="modal__success booking-request-modal__success" role="status">Forespørselen er sendt!</p>}

        <div className="modal__actions booking-request-modal__actions">
          <button className="booking-request-modal__close-button" type="button" onClick={onClose}>Lukk</button>
          <button className="booking-request-modal__submit-button" type="button"
            onClick={handleSubmit} 
            disabled={!session || sending || loadingBookings || loadingPendingCount || bookingsError || pendingCount >= 2}
          >
            {sending ? "Sender..." : pendingCount >= 2 ? "Maks antall forespørsler nådd" : "Send forespørsel"}
          </button>
        </div>
      </div>
    </div>
  );
}