# Kvalitetskontroll

Denne siden beskriver kommandoer, forventet frontend-oppførsel og kontrollenes avgrensninger.

## Verktøy og kommandoer

Bruk Node.js `>=20.11.0 <21` eller `>=22` og npm. `npm test` kjører Node med `--test-timeout`, et flagg som ble innført i Node 20.11.0. I låsefilen er Vite `6.3.5`, med engine-krav `^18.0.0 || ^20.0.0 || >=22.0.0`, og Playwright `1.63.0`, med engine-krav `>=20`. Samlet prosjektkrav er dermed Node 20.11.0 eller nyere i 20-serien, eller 22 og nyere; Node 21 faller utenfor Vites intervall. Node-versjonen i arbeidsmiljøet ved denne dokumentasjonsoppdateringen er `v20.20.0`. `package.json` har ikke eget `engines`-felt.

```sh
npm ci
npm test
npm run lint -- --max-warnings=0
npm run build
```

`npm test` kjører `node:test`-pakken i `tests/*.test.mjs` og `src/utils/*.test.js` uten watch-modus. `npm run lint -- --max-warnings=0` kontrollerer `src`, `tests`, `vite.config.js` og `eslint.config.js`, og feiler også ved ESLint-advarsler. `npm run build` lager produksjonsbygget. Installer Playwrights Chromium én gang per miljø:

```sh
npx playwright install chromium
```

## Isolerte nettleserkontroller

Nettlesertestene i `tests/browser-refactor.mjs` kjøres separat fra `npm test`. Start Vite-serveren først (standard `http://localhost:5000`). `BROWSER_TEST_URL` kan angi en full URL, for eksempel `http://localhost:5000`. `VITE_SUPABASE_URL` må finnes i testprosessen for at harnessen skal kunne isolere Supabase-trafikken. Velg én gruppe og én bredde per kjøring; gyldige bredder er 320, 768 og 1280 CSS-piksler. På Linux kan hver kommando avgrenses til 60 sekunder med `timeout`:

```sh
timeout 60s node tests/browser-refactor.mjs identity 320
```

Dette er en avgrenset nettlesertestkommando, ikke en del av `npm test`. Den generelle, ikke-watch-baserte kontrollen består av `npm test`, `npm run lint -- --max-warnings=0` og `npm run build`; bruk `npm ci` først etter behov for å installere låste avhengigheter.

Tilgjengelige grupper:

- `routes`, `listings`, `cabin`: rutefremvisning, annonse-/hyttevisninger og responsiv visning.
- `registration`, `auth`: registrering, profilopprettelse/feil og innloggingsflyter.
- `identity`: forsinkede svar for bruker A etter bytte til B i samme app, inkludert profil/avatar, tidligere opphold, egne vurderinger og innkommende vurderinger; kontrollerer også at utlogging ugyldiggjør ventende data.
- `refresh`: fornyelse av token for samme bruker etter at skjemaet er fylt ut; innhold og pågående skjema skal bevares uten remontering eller omlasting.
- `keyboard`, `axe`: tastaturkontroll og axe-skanning. Vurderingsskjemaet inngår; radiovalg, synlig fokus, valgt tilstand uten bare farge, kontrast og tilknytning av valideringsfeil undersøkes. Axe kjøres i normal- og feiltilstand.
- `booking`, `demo`: isolerte booking- og demoflyter.

Playwrights nedlastede Chromium krever nødvendige systembiblioteker. Hvis miljøet krever systemnettleseren, kan den angis slik:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$(command -v chromium)" \
BROWSER_TEST_URL=http://127.0.0.1:5000 \
timeout 60s node tests/browser-refactor.mjs identity 320
```

Harnessen bruker syntetiske fixtures og mocker Supabase-svar. Den blokkerer eksterne forespørsler, WebSocket-tilkoblinger og skrivinger til appens eget domene; utestede Edge Functions avvises. Nettleserkontrollene utfører derfor ikke ekte registrering, booking, meldingsutsending, betaling eller databaseendringer.

## Resultater fra denne frontend-kontrollen

Kontrollert med Node `v20.20.0` etter migreringen fra styled-components til vanlige CSS-filer:

- `npm test`: 30 av 30 tester bestått. `npm run lint -- --max-warnings=0`: bestått uten advarsler. `npm run build`: bestått; Vite varsler om en eksisterende JavaScript-fil over 500 kB etter minifisering.
- Isolerte `identity`, `keyboard` og `axe`: bestått ved 320, 768 og 1280 CSS-piksler. `identity` dekker både bytte via ut-/innlogging og A→B mens samme `ProfileData`-instans er montert; alle tilbakeholdte A-svar behandles før siste kontroll av B. `refresh` er bestått ved 1280 CSS-piksler etter skjemautfylling og ny tokenfornyelse.
- `routes` og `listings`: bestått ved 320, 768 og 1280 CSS-piksler. `registration`, `auth`, `booking`, `demo` og `cabin`: bestått ved 1280 CSS-piksler; `auth` og `booking` også ved 320. I `listings` kontrolleres de eksakte DOM-klassetokens for navigasjon, profil, hyttekort, vurderingsskjema, bookingdialog og cookie-banner: bare lesbare appklasser, ingen duplikater eller genererte hash-klasser. Tilstandsklasser kontrolleres fortsatt. Testene bruker tilgjengelige roller og navn som primærselektorer.
- `listings 1280` bestod også mot det bygde produksjonsresultatet på en midlertidig port 5001, uten å endre prosjektets arbeidsflyter. Hver nettleserkjøring var avgrenset til 60 sekunder og brukte syntetiske nettverkssvar.
- Etter rettingen av opprett-kortets CSS-kaskade bestod `carousel` ved 320, 768 og 1280 CSS-piksler både i utviklingsversjonen og produksjonsbygget. Med bare opprett-kortet og med fire syntetiske premiumhytter ble `position` og transformasjonsmatrise kontrollert i hoved- og sideposisjoner, både normalt og ved hover. Hovedkortets tastaturfokus og rutenettkortets plassering, hover og fokus ble også kontrollert. `registration`, `identity` og `refresh` ved 1280, samt `listings` ved 320 i utvikling og 1280 i produksjonsbygget, bestod fortsatt. Ingen testkall gikk til ekte tjenester.
- Syntetiske før-/etterbilder av forside, utleieoversikt, profil og bookingdialog ved 320 og 1280 CSS-piksler er gjennomgått. Hovedlayout, kort, navigasjon, dialog og datovelger er beholdt. Profilens mockede avatar kan se forskjellig ut mellom bilder tatt før og etter asynkront profiloppslag: mockserveren returnerer ikke bildepiksler for den syntetiske avatar-URL-en. Dette er en testfixture-begrensning, ikke en endring i avatarens fallback-kode.

## Oppførsel som skal bevares

- **Vanlig CSS og lesbare DOM-klasser:** Appens egne klasser skal være beskrivende engelske kebab-case, med BEM for underelementer, for eksempel `main-navigation` / `main-navigation__profile-link`, `profile-overview` / `profile-overview__avatar`, `cabin-card` / `cabin-card__title` og `add-review-form` / `add-review-form__rating` / `add-review-form__star`. Ansvarsspesifikke blokker som `booking-request-modal` og `cookie-banner` er foretrukket fremfor generiske navn. Vanlige CSS-filer under `src/styles/` bruker de lesbare klassene direkte; `src/styles/index.css` importeres én gang i `main.jsx`, med globalt grunnlag/reset før bibliotekstiler, delte appstiler og komponent-/sidestiler. CSS-variabler dekker passende delte designverdier og beregnede elementverdier; modifikatorklasser/data-attributter dekker tilstander. Behold eksisterende klasser og tilstander (`active`, `selected`, `approve`, `reject`, `small`, `align-end`), men ingen dupliserte tokens eller genererte hash-klasser på appens egne elementer. Tredjepartsbibliotekenes interne klasser er unntatt.

- **Identitet og profil:** Profilinnhold skal tilhøre aktiv bruker. Det omfatter profilinformasjon og avatar, tidligere og kommende opphold, egne og innkommende vurderinger, egne annonser og abonnement samt innkommende bookingforespørsler. Ved reelt brukerbytte eller utlogging nullstilles/ugyldiggjøres brukeravhengig innhold. Forsinkede svar fra forrige identitet må ikke overskrive den aktive brukerens data.
- **Samme bruker og tokenfornyelse:** `SIGNED_IN` eller `TOKEN_REFRESHED` for samme bruker skal ikke nullstille profilen, navigere bort eller montere skjemaer på nytt. Profilforespørsler knyttes til identitet og versjon; profilfeil vises og kan forsøkes på nytt.
- **Registrering:** Med aktiv sesjon slår klienten opp profilen først og oppretter bare en manglende profil. En eksisterende profil eller rolle overskrives ikke. Etter gyldig profil går brukeren til forsiden med innlogget tilstand. Uten sesjon vises beskjed om e-postbekreftelse, uten å opprette profil eller vise innlogget tilstand.
- **Administratorrolle:** Admin-ruten krever innlogget bruker, profil med samme bruker-ID og `role === 'admin'`. Ny konto får standardrollen `bruker` når profil opprettes; eksisterende rolle skal ikke overskrives ved registrering eller profiloppfriskning.
- **Vurdering:** Stjernene bruker ekte radioknapper, tastaturvalg og synlig fokus. Normal og valgt tilstand skal være minst 3:1 i grafisk kontrast, og valgt verdi skal ha en grafisk markør utover farge alene. Valideringsfeil skal annonseres og være programmessig knyttet til vurderingskontrollen.
- **Demo-feil:** Demoaktivering viser eksplisitt feil når den ikke kan bekreftes og gir vei til profilen. Ukjent resultat etter at en mutasjon er startet forsøkes ikke automatisk på nytt, for å unngå mulig dobbelmutasjon.

## Avgrensninger

Appens tidligere styled-definisjoner og tilhørende JavaScript-stilfiler er erstattet av vanlige CSS-filer. `styled-components` er fjernet fra avhengighetene. Ubrukte JavaScript-stiltokens og `.rating-stars`-regler er fjernet etter referansesøk; `src/styles/common/index.css` og `tokens.css` er beholdt. Tidligere fjernet startmateriell omfatter `public/vite.svg`, `src/assets/logo.png`, `src/components/ui/ErrorBoundary.jsx` og `src/styles/ui/errorBoundaryStyles.js`.

Automatiserte tastatur-, axe- og nettleserkontroller dekker bare definerte tilstander. Manuell kontroll av full tastaturrekkefølge, skjermlesere, zoom/tekstforstørring, feilmeldinger og alle tomme/lastende tilstander gjenstår. Dette er ikke en full WCAG-vurdering eller juridisk samsvarserklæring; WCAG 2.2 A/AA er prosjektmål. Se [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) og [Uu-tilsynets oversikt over norske krav](https://www.uutilsynet.no/regelverk/kva-seier-forskrifta/153).

Denne oppgaven omfatter frontend og dokumentasjon, ikke Supabase/backend-endringer eller en sikkerhetsgjennomgang. Mocking verifiserer ikke faktisk databaseinnhold, RLS-/tilgangsregler, Edge Functions, autentiseringskonfigurasjon eller eksterne tjenestekontrakter. Kontroller disse mot det faktiske backend-miljøet før produksjonsbruk. Ikke bruk ekte kontoer, data eller betalinger som test.