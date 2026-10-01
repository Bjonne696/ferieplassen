# Ferieplassen

Ferieplassen er en norskspråklig frontend-portefølje for en markedsplass for ferieboliger. Besøkende kan utforske annonser og sende bookingforespørsler; innloggede eiere kan opprette annonser og administrere forespørsler og abonnement. Løsningen bruker React 19, JavaScript/JSX, Vite 6, React Router 7, vanlig CSS og Supabase. Den er en demonstrasjon av frontend-arbeid, ikke en selvstendig backend eller en komplett betalingstjeneste.

## Kom i gang

Krever Node.js `>=20.11.0 <21` eller `>=22` og npm. `npm test` bruker `node --test --test-timeout`; flagget ble innført i Node 20.11.0. Den låste Vite 6-versjonen (`6.3.5`) støtter `^18.0.0 || ^20.0.0 || >=22.0.0`, og Playwright (`1.63.0`) krever Node `>=20`. Samlet krav for dette prosjektet er derfor Node 20.11.0 eller nyere i 20-serien, eller 22 og nyere; Node 21 støttes ikke av Vite. Arbeidsmiljøets Node-versjon ved dokumentasjonsoppdateringen er `v20.20.0`. `package.json` angir ikke selv et `engines`-felt. Opprett lokale Vite-miljøvariabler (for eksempel i en lokal `.env.local`, som ikke skal sjekkes inn):

| Variabelnavn | Bruk |
| --- | --- |
| `VITE_SUPABASE_URL` | URL til Supabase-prosjektet og Edge Functions |
| `VITE_SUPABASE_ANON_KEY` | Offentlig Supabase-nøkkel for klienten |
| `VITE_DEMO_MODE` | Styrer om den sperrede demo-betalingsflyten vises |

Klienten krever et tilgjengelig Supabase-prosjekt med passende tabeller, lagringsområder, tilgangsregler og Edge Functions for de flytene som skal demonstreres. Vite-variabler er tilgjengelige i nettleseren; legg aldri en service-role-nøkkel eller andre hemmeligheter i dem. Prosjektet leverer ikke backend-oppsett eller database-migrasjoner.

```sh
npm ci
npm run dev
```

Utviklingsserveren er konfigurert på port 5000. For produksjonsbygg og lokal visning av bygget:

```sh
npm run build
npm run preview
```

`npm test` kjører hele Node-testpakken. `npm run lint -- --max-warnings=0` kjører ESLint uten å godta advarsler på `src`, `tests` og prosjektets Vite-/ESLint-konfigurasjon; `.mjs`-testene bruker egne Node- og nettleserglobals og regler for ubrukte variabler. `npm run build` lager produksjonsbygget. Playwright og axe-core er utviklingsavhengigheter. Installer Chromium én gang i hvert utviklingsmiljø:

```sh
npx playwright install chromium
```

## Klassenavn i DOM

Appens egne DOM-elementer har beskrivende, engelske kebab-case-klassenavn. Bruk BEM for underelementer, med blokkens ansvar som utgangspunkt: `main-navigation` / `main-navigation__profile-link`, `profile-overview` / `profile-overview__avatar`, `cabin-card` / `cabin-card__title` og `add-review-form` / `add-review-form__rating` / `add-review-form__star`. Bruk også komponentansvarlige navn som `booking-request-modal` og `cookie-banner`; unngå tilfeldige nummer, brukerdata og generiske `wrapper`-/`container`-navn.

Vanlig CSS ligger tematisk under `src/styles/` og bruker disse klassene som selektorer. Alle appens CSS-filer hentes gjennom `src/styles/index.css`, importert én gang fra `src/main.jsx`: først globalt grunnlag/reset, deretter tredjepartsbiblioteker, så delte appstiler og til slutt komponent- og sidestiler. Delte designverdier er CSS-variabler; JavaScript-konstanter beholdes bare når logikken trenger dem. Dynamiske tilstander uttrykkes med navngitte modifikatorklasser eller data-attributter, og beregnede verdier kan settes som avgrensede CSS-variabler på elementet. Behold nødvendige tredjepartsklasser, men appens egne elementer skal ikke ha genererte hash-klasser eller dupliserte klassetokens. Eksisterende tilstandsklasser som `active`, `selected`, `approve`, `reject`, `small` og `align-end` skal fortsatt fungere.

## Oppbygning og valg

- `src/main.jsx` monterer én `BrowserRouter` og én `AuthProvider`; `src/App.jsx` definerer rutene, inkludert profil, admin, annonsevisning og betalingscallback. `src/pages/` setter sammen sidene fra `src/components/`, mens `src/hooks/` håndterer avgrenset tilstand og asynkrone brukerflyter.
- `src/services/` samler blant annet annonse- og abonnementsoperasjoner. `src/lib/supabaseClient.js` oppretter klienten, og `src/lib/storage.js` hjelper med lagring. `src/utils/` inneholder rene beregnings- og tilgjengelighetshjelpere. Inndelingen gjør det mulig å teste regler uten å starte hele brukergrensesnittet.
- Stilene bruker én CSS-inngang i `src/styles/index.css`, importert én gang fra `main.jsx`: globalt sidegrunnlag/reset først, deretter Leaflet- og datovelger-CSS, delte appstiler og tematiske komponent-/sidestiler under `src/styles/`. Delte designverdier og skjemamønstre ligger i `src/styles/common/`. Komponentstiler og målrettede overstyringer legges oppå grunnstilene, fremfor brede globale selektorer. Fokusmarkering og redusert bevegelse har også globale grunnregler.
- Hjem, til leie, nyeste og populære annonser har ulike utvalg og filtreringsregler. Ikke slå dem sammen bare fordi de viser samme type kort. Tilgjengelighets- og datoregler er skilt ut der de deles; kartet bruker Leaflet og datovalg bruker `react-date-range`.

## Demo, betaling og backend

Demo-siden og demo-callbacken er bare tilgjengelige når `VITE_DEMO_MODE` aktiverer demo. Demoen skal ikke trekke ekte betaling: den sender brukeren gjennom en simulert betalingsside til `/vipps/callback`, der klienten kaller `demo-activate-subscription` med innlogget sesjon og relevante identifikatorer. Dette krever at den tilhørende Supabase Edge Function faktisk er tilgjengelig; ellers vises feil, ikke en påstått vellykket aktivering. Uten demo-sperren går abonnementsoppretting via `create-agreement` og en ekstern Vipps-videresending; callbacken sjekker abonnementsstatus. Klienten tilbyr også `cancel-subscription` og `delete-subscription`. Ikke bruk ekte betalingsmidler til testing.

Bookingforespørsler skrives til `booking_requests`, mens datofiltrering av annonser undersøker godkjente oppføringer i `bookings` med streng datooverlapp. Dette er en eksisterende backend-forskjell, ikke noe denne porteføljen utjevner eller antar er synkronisert. Produksjonsflyter, tilgangsregler, eksterne tjenester og betalingsregler må avklares og kontrolleres mot den faktiske backenden før reell bruk. Kontaktflyten kan kalle `send-contact-email`; ikke send ekte meldinger som test.

## Avgrenset kontroll uten ekte mutasjoner

Kjør Node-testpakken, lint og bygg i avsluttende modus; `npm test` bruker `node:test` uten watch-modus og krever ikke Supabase-tilkobling:

```sh
npm test
npm run lint -- --max-warnings=0
npm run build
```

`tests/browser-refactor.mjs` inneholder separate Playwright-kontroller med mockede Supabase-svar. Utviklingsserveren må allerede kjøre (standardadresse `http://localhost:5000`); angi eventuelt `BROWSER_TEST_URL` for en annen adresse. `VITE_SUPABASE_URL` må være satt i testprosessen for at testharnessen skal kunne isolere Supabase-trafikken. Playwright og Chromium installeres som beskrevet over; `axe`-gruppen bruker prosjektets axe-core-avhengighet.

Kjør én avgrenset gruppe og én skjermbredde per kommando. På Linux avgrenser `timeout` kjøringen til 60 sekunder:

```sh
timeout 60s node tests/browser-refactor.mjs routes 320
```

Gruppene er `routes`, `listings`, `registration`, `booking`, `demo`, `auth`, `keyboard`, `axe`, `cabin`, `identity` og `refresh`; støttede bredder er 320, 768 og 1280 CSS-piksler. `identity` kontrollerer forsinkede svar ved A→B-brukerbytte og utlogging, mens `refresh` kontrollerer at fornyelse for samme bruker bevarer side og skjematilstand. `keyboard` og `axe` inkluderer vurderingsskjemaets radioknapper, feilmeldinger og normal-/feiltilstander; den grafiske stjernekontrasten kontrolleres eksplisitt. Harnessen mocker Supabase-svar, blokkerer eksterne forespørsler og blokkerer skrivinger til appens eget domene. Mutasjonsflyter bruker bare erstatningssvar, ikke faktiske kontoer eller produksjonsdata. Ikke send ekte meldinger, slett brukerdata eller utfør ekte betalinger under kontroll. Axe-kontroll og automatisert tastaturbruk er avgrensede kontroller, ikke full tilgjengelighetsvurdering. Se [kvalitetskontrollen](docs/quality-check.md) for atferd, avgrensninger og manuelle kontrollbehov.

Profilvisningen er knyttet til innlogget brukeridentitet: profil og avatar, tidligere og kommende opphold, egne og innkommende vurderinger, egne annonser/abonnement og innkommende forespørsler skal ikke blandes mellom brukere. Identitetsbytte og utlogging ugyldiggjør foreldede svar. Fornyelse av sesjonen for samme bruker skal bevare profilvisningen og skjemaer uten sideomlasting. Vurderingsstjernene har synlig valgt tilstand utover farge, grafisk kontrast og tilgjengelig tilknyttet valideringsfeil.

Tilgjengelighet vurderes med WCAG 2.2 A/AA som prosjektmål og med hensyn til [norske krav hos Uu-tilsynet](https://www.uutilsynet.no/regelverk/kva-seier-forskrifta/153). Dette er ikke en erklæring om juridisk samsvar eller om at løsningen oppfyller WCAG 2.2 AA.