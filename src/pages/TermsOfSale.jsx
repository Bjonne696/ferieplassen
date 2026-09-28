import React from 'react';
import Navigation from '../components/nav/Navigation';
import Footer from '../components/nav/Footer';

export default function TermsOfSale() {
  return (
    <>
      <Navigation />
      <main className="terms-page" id="hovedinnhold" tabIndex={-1}>
      <h1 className="terms-page__title">Salgsbetingelser</h1>
      <p className="terms-page__last-updated">Sist oppdatert: Oktober 2025</p>

      <section className="terms-page__section">
        <h2 className="terms-page__section-title">1. Generelt</h2>
        <p className="terms-page__paragraph">
          Disse salgsbetingelsene gjelder for utleie av feriebolig gjennom Ferieplassen,
          eid av Bjørn-Tore. Ved å gjennomføre en booking aksepterer du disse vilkårene.
        </p>
      </section>

      <section className="terms-page__section">
        <h2 className="terms-page__section-title">2. Betaling</h2>

        <h3 className="terms-page__subsection-title">2.1 Betalingsmetode</h3>
        <p className="terms-page__paragraph">
          Vi aksepterer betaling via godkjente betalingsløsninger. All betaling skal gjøres før
          innsjekking.
        </p>

        <h3 className="terms-page__subsection-title">2.2 Abonnement for utleiere</h3>
        <p className="terms-page__paragraph">
          Utleiere som ønsker å liste sin feriebolig på plattformen må ha et aktivt
          abonnement. Vi tilbyr to abonnementsplaner:
        </p>
        <ul className="terms-page__list">
          <li><strong>Standard:</strong> 99 NOK per måned</li>
          <li><strong>Premium:</strong> 149 NOK per måned</li>
        </ul>
        <p className="terms-page__paragraph">
          Abonnementet faktureres månedlig via Vipps MobilePay Recurring og kan
          kanselleres når som helst uten bindingstid.
        </p>

        <h3 className="terms-page__subsection-title">2.3 Leiebetaling</h3>
        <p className="terms-page__paragraph">
          Leietaker betaler avtalt beløp direkte til utleier etter godkjent booking.
          Ferieplassen er kun en formidlingsplattform og håndterer ikke leiebetaling
          mellom leietaker og utleier.
        </p>

        <h3 className="terms-page__subsection-title">2.4 Betalingsfrist</h3>
        <p className="terms-page__paragraph">
          Abonnement trekkes automatisk hver måned. Ved forfall av betaling vil ferieboligen
          bli deaktivert fra plattformen inntil betaling er gjennomført.
        </p>
      </section>

      <section className="terms-page__section">
        <h2 className="terms-page__section-title">3. Angrerett</h2>

        <h3 className="terms-page__subsection-title">3.1 Angrefrist</h3>
        <p className="terms-page__paragraph">
          I henhold til norsk lov (angrerettloven) har du som forbruker 14 dagers
          angrefrist fra kjøpsdato. Angrefristen gjelder for:
        </p>
        <ul className="terms-page__list">
          <li>Abonnement for utleiere (14 dager fra opprettelse)</li>
          <li>Bookingbestillinger (14 dager fra bestillingsdato, forutsatt at leieperioden ikke har startet)</li>
        </ul>

        <h3 className="terms-page__subsection-title">3.2 Hvordan benytte angreretten</h3>
        <p className="terms-page__paragraph">
          For å benytte angreretten, send e-post til <a href="mailto:Your-Email@yourmail.com">Your-Email@yourmail.com</a> med
          følgende informasjon:
        </p>
        <ul className="terms-page__list">
          <li>Ditt fulle navn</li>
          <li>Bestillingsnummer eller abonnements-ID</li>
          <li>Beskrivelse av hva du ønsker å angre på</li>
        </ul>

        <h3 className="terms-page__subsection-title">3.3 Tilbakebetaling</h3>
        <p className="terms-page__paragraph">
          Ved gyldig bruk av angreretten vil du motta full refusjon innen 14 dager
          fra vi har mottatt din angremelding. Refusjon utbetales til samme konto
          som betalingen ble gjort fra.
        </p>

        <h3 className="terms-page__subsection-title">3.4 Unntak fra angreretten</h3>
        <p className="terms-page__paragraph">
          Angreretten gjelder ikke dersom leieperioden allerede har startet eller
          hvis det er mindre enn 14 dager til innsjekking.
        </p>
      </section>

      <section className="terms-page__section">
        <h2 className="terms-page__section-title">4. Retur og kansellering</h2>

        <h3 className="terms-page__subsection-title">4.1 Kansellering av booking</h3>
        <p className="terms-page__paragraph">
          Bookinger kan kanselleres direkte gjennom plattformen eller ved å kontakte
          utleier. Refusjonsrett ved kansellering avgjøres av den enkelte utleier
          og bør avtales direkte mellom leietaker og utleier.
        </p>

        <h3 className="terms-page__subsection-title">4.2 Kansellering av abonnement</h3>
        <p className="terms-page__paragraph">
          Utleiere kan kansellere sitt abonnement når som helst uten bindingstid.
          Kanselleringen trer i kraft ved slutten av inneværende betalingsperiode.
          Ferieboligen vil bli deaktivert fra plattformen når abonnementet avsluttes.
        </p>
        <p className="terms-page__paragraph">
          For å kansellere abonnement, logg inn på din profil og velg
          "Kanseller abonnement" under abonnementsinformasjon.
        </p>

        <h3 className="terms-page__subsection-title">4.3 Ingen refusjon ved delvis bruk</h3>
        <p className="terms-page__paragraph">
          Det gis ikke refusjon for ubrukte deler av abonnementsperioder.
        </p>
      </section>

      <section className="terms-page__section">
        <h2 className="terms-page__section-title">5. Klagehåndtering</h2>

        <h3 className="terms-page__subsection-title">5.1 Reklamasjon</h3>
        <p className="terms-page__paragraph">
          Hvis du opplever problemer med plattformen, ditt abonnement eller har andre
          klager, ta kontakt med oss så raskt som mulig.
        </p>

        <h3 className="terms-page__subsection-title">5.2 Hvordan klage</h3>
        <p className="terms-page__paragraph">
          Klager kan sendes til oss via e-post eller telefon. Vi forventer å motta
          klager innen rimelig tid etter at problemet oppstod.
        </p>

        <h3 className="terms-page__subsection-title">5.3 Behandling av klager</h3>
        <p className="terms-page__paragraph">
          Vi vil behandle din klage snarest mulig, normalt innen 5 virkedager. Du vil
          motta en bekreftelse på at klagen er mottatt samt informasjon om videre
          behandling.
        </p>

        <h3 className="terms-page__subsection-title">5.4 Tvister mellom leietaker og utleier</h3>
        <p className="terms-page__paragraph">
          Ferieplassen er en formidlingsplattform. Tvister som oppstår mellom
          leietaker og utleier angående selve leieavtalen må løses direkte mellom
          partene. Vi kan bistå med formidling ved behov.
        </p>

        <h3 className="terms-page__subsection-title">5.5 Forbrukerrådet</h3>
        <p className="terms-page__paragraph">
          Hvis du ikke er fornøyd med vår håndtering av klagen, kan du kontakte
          Forbrukerrådet for veiledning eller ta saken til Forbrukertvistutvalget.
        </p>
      </section>

      <section className="terms-page__section">
        <h2 className="terms-page__section-title">6. Personvern</h2>
        <p className="terms-page__paragraph">
          Vi behandler dine personopplysninger i henhold til GDPR og norsk
          personvernlovgivning. Les vår personvernerklæring for mer informasjon
          om hvordan vi samler inn, bruker og beskytter dine data.
        </p>
      </section>

      <section className="terms-page__section">
        <h2 className="terms-page__section-title">7. Endringer i vilkårene</h2>
        <p className="terms-page__paragraph">
          Vi forbeholder oss retten til å endre disse salgsbetingelsene. Eventuelle
          endringer vil bli publisert på denne siden med oppdatert dato. Ved vesentlige
          endringer vil eksisterende kunder bli varslet via e-post.
        </p>
      </section>

      <div className="terms-page__contact-box">
        <div className="terms-page__contact-info">
          <strong>Kontaktinformasjon:</strong><br />
          Ferieplassen - Eid av Bjørn-Tore<br />
          E-post: <a href="mailto:Your-Email@yourmail.com">Your-Email@yourmail.com</a><br />
          Nettside: www.ferieplassen.no
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
}
