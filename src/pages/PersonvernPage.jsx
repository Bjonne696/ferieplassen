import Navigation from "../components/nav/Navigation";
import Footer from "../components/nav/Footer";

export default function PersonvernPage() {
  return (
    <>
      <Navigation />
      <main className="page-wrapper privacy-policy-page" id="hovedinnhold" tabIndex={-1}>
        <section className="privacy-policy-page__content">
          <h1 className="privacy-policy-page__title">Personvernerklæring</h1>

          <p className="privacy-policy-page__paragraph">
            Denne personvernerklæringen beskriver hvordan Ferieplassen samler
            inn, bruker og beskytter dine personopplysninger i henhold til GDPR.
          </p>

          <h2 className="privacy-policy-page__section-title">Hvilke opplysninger samler vi inn?</h2>
          <p className="privacy-policy-page__paragraph">Vi samler inn følgende informasjon:</p>
          <ul className="privacy-policy-page__list">
            <li className="privacy-policy-page__list-item">Navn og kontaktinformasjon når du registrerer deg</li>
            <li className="privacy-policy-page__list-item">E-postadresse for kommunikasjon</li>
            <li className="privacy-policy-page__list-item">Booking- og leiehistorikk</li>
            <li className="privacy-policy-page__list-item">Abonnementsdata for utleiere (status, plan, betalingshistorikk)</li>
            <li className="privacy-policy-page__list-item">Tekniske data som IP-adresse og nettleserinfo</li>
          </ul>

          <h2 className="privacy-policy-page__section-title">Hvordan bruker vi informasjonen?</h2>
          <ul className="privacy-policy-page__list">
            <li className="privacy-policy-page__list-item">For å administrere bookinger og utleie</li>
            <li className="privacy-policy-page__list-item">For å behandle abonnementer og betalinger for utleiere</li>
            <li className="privacy-policy-page__list-item">For å kommunisere med deg om dine bookinger og abonnement</li>
            <li className="privacy-policy-page__list-item">For å forbedre våre tjenester</li>
            <li className="privacy-policy-page__list-item">For å oppfylle juridiske forpliktelser (inkludert regnskapslov)</li>
          </ul>

          <h2 className="privacy-policy-page__section-title">Informasjonskapsler (Cookies)</h2>
          <p className="privacy-policy-page__paragraph">Vi bruker informasjonskapsler for:</p>
          <ul className="privacy-policy-page__list">
            <li className="privacy-policy-page__list-item">Å holde deg innlogget (nødvendige cookies)</li>
            <li className="privacy-policy-page__list-item">Å huske dine preferanser</li>
            <li className="privacy-policy-page__list-item">Å sikre at nettstedet fungerer korrekt</li>
          </ul>

          <h2 className="privacy-policy-page__section-title">Betalinger og Abonnementer</h2>
          <p className="privacy-policy-page__paragraph">For utleiere som bruker vår abonnementstjeneste:</p>
          <ul className="privacy-policy-page__list">
            <li className="privacy-policy-page__list-item">Betalinger behandles av en tredjeparts betalingsleverandør</li>
            <li className="privacy-policy-page__list-item">Vi lagrer IKKE kortinformasjon eller sensitive betalingsdetaljer</li>
            <li className="privacy-policy-page__list-item">Vi lagrer kun abonnementsstatus, betalingshistorikk (dato, beløp), og leverandør-ID</li>
            <li className="privacy-policy-page__list-item">Betalingsdata brukes kun for å administrere abonnementet ditt og oppfylle juridiske krav</li>
          </ul>
          <p className="privacy-policy-page__paragraph">
            <strong>Datalagring:</strong> Abonnementsdata lagres så lenge abonnementet er aktivt og i 5 år etter
            kansellering for regnskapsmessige formål. Du kan når som helst be om en kopi av dine betalingsdata
            eller sletting etter lovpålagt lagringsperiode.
          </p>

          <h2 className="privacy-policy-page__section-title">Dine rettigheter</h2>
          <p className="privacy-policy-page__paragraph">I henhold til GDPR har du rett til:</p>
          <ul className="privacy-policy-page__list">
            <li className="privacy-policy-page__list-item">Å få tilgang til dine personopplysninger</li>
            <li className="privacy-policy-page__list-item">Å rette feilaktige opplysninger</li>
            <li className="privacy-policy-page__list-item">Å slette dine opplysninger</li>
            <li className="privacy-policy-page__list-item">Å begrense behandlingen av dine data</li>
            <li className="privacy-policy-page__list-item">Å overføre dine data</li>
          </ul>

          <h2 className="privacy-policy-page__section-title">Kontakt oss</h2>
          <div className="privacy-policy-page__contact-info">
            Hvis du har spørsmål om personvern eller ønsker å utøve dine
            rettigheter, kan du kontakte oss på:{" "}
            <a href="mailto:Bjonne969@gmail.com"><strong>Bjonne969@gmail.com</strong></a>
          </div>

          <p className="privacy-policy-page__paragraph">
            Sist oppdatert: {new Date().toLocaleDateString("nb-NO")}
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}