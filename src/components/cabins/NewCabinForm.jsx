import { useRef } from "react";
import HelpText from "../ui/HelpText";
import VippsRedirectModal from "../common/VippsRedirectModal";
import useNewCabinForm from "../../hooks/useNewCabinForm";
import {
  ListingFields, FacilitiesField, ImageField, AddressAndMapFields, SubscriptionFields,
} from "./NewCabinFormSections";

export default function NewCabinForm({ className }) {
  const submitTriggerRef = useRef(null);
  const form = useNewCabinForm();
  return (
    <div className={["new-cabin-form", className].filter(Boolean).join(" ")}>
      <h1 className="new-cabin-form__title">Opprett ny ferieboligannonse</h1>
      {form.isAdmin && (
          <div className="new-cabin-form__admin-alert">
          <strong>Admin-konto:</strong> Ferieboligen vil bli automatisk publisert uten behov for abonnement.
          </div>
      )}
      <HelpText>
        <strong>Velkommen til oppretting av ferieboligannonse!</strong><br />
        Fyll ut alle feltene under for å lage en attraktiv annonse:
        <ul className="new-cabin-form__tips">
          <li className="new-cabin-form__tip">Skriv en beskrivende tittel og detaljert beskrivelse</li>
          <li className="new-cabin-form__tip">Last opp 3-5 bilder av høy kvalitet</li>
          <li className="new-cabin-form__tip">Plasser markøren nøyaktig på kartet</li>
          <li className="new-cabin-form__tip">Velg relevante fasiliteter for å tiltrekke riktige gjester</li>
        </ul>
      </HelpText>
      <form className="new-cabin-form__fields" onSubmit={(event) => {
        submitTriggerRef.current = event.nativeEvent.submitter || (event.currentTarget.contains(document.activeElement) ? document.activeElement : null);
        form.handleSubmit(event);
      }} noValidate aria-busy={form.loading}>
        <ListingFields form={form} />
        <FacilitiesField form={form} />
        <ImageField form={form} />
        <AddressAndMapFields form={form} />
        <SubscriptionFields form={form} />
        {form.submitMessage && (
          <div className={`new-cabin-subscription__submit-message new-cabin-subscription__submit-message--${form.submitMessage.type}`} role="status">{form.submitMessage.text}</div>
        )}
        {form.errors.submit && <p className="new-cabin-form__submit-error" role="alert">{form.errors.submit}</p>}
        <button className="button-base button new-cabin-form__submit-button" type="submit" disabled={form.loading || form.validatingCode || !!form.vippsRedirectUrl}>
          {form.buttonText}
        </button>
      </form>
      {form.vippsRedirectUrl && (
        <VippsRedirectModal url={form.vippsRedirectUrl} returnFocusTo={submitTriggerRef.current}
          onClose={() => { form.setVippsRedirectUrl(null); form.setLoading(false); }} />
      )}
    </div>
  );
}