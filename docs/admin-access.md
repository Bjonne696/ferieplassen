# Tilgang til administrasjon

## Frontend

`src/App.jsx` beskytter `/admin`: sesjon må finnes, profil-ID må tilhøre brukeren og rollen må være `admin`. Under lasting vises bare en statusmelding; øvrige brukere sendes til startsiden. AdminData monteres ikke før tilgang er avklart. `/kontakt` beholder sin eksisterende administratorbegrensning.

`AuthProvider` skiller mellom samme bruker og en reell identitetsendring. `SIGNED_IN` eller `TOKEN_REFRESHED` for samme bruker-ID beholder profil- og UI-/skjematilstand; det nullstiller ikke profilen eller remonterer beskyttede skjemaer. Ved faktisk bytte til en annen bruker eller utlogging ugyldiggjøres gammel identitet og dens ventende profiloppslag, og brukeravhengig data skal ikke beholdes eller vises for neste identitet. Foreldede svar ignoreres. Manglende profil eller feil i profiloppslaget gir ikke tilgang.

Dette er kun brukergrensesnittbeskyttelse. En angriper kan omgå React og kalle Supabase direkte.

## Backend og RLS: utenfor frontend-oppgaven, ikke verifisert

Backend-/RLS-inspeksjon, Supabase-konfigurasjon og backend-endringer er utenfor denne frontend-oppgaven. Repoet inneholder ingen SQL-migrasjoner, RLS-policyer eller definisjon av `delete_user_account`. README beskriver en eksternt konfigurert Supabase-backend. Ekte mutasjoner og persondata er ikke brukt. Frontend-mocks beviser ikke at produksjonens tilgangsregler er riktige; følgende punkter er kun fremtidige backend-verifikasjonsbehov, og ikke akseptansekriterier for denne frontend-oppgaven.

Følgende må inspiseres i riktig Supabase-prosjekt før backend kan godkjennes:

- `profiles`: aktiv RLS, grants og alle SELECT/INSERT/UPDATE/DELETE-policyer. Vanlige brukeres legitime egenprofiltilgang må bevares, men ikke gi generell tilgang til andre brukeres e-post eller administrativ sletting.
- `profiles.role`: registrering eller profilredigering må ikke kunne tildele eller endre egen administratorrolle. En klientstyrt verdi eller user_metadata er ikke autoritativ.
- `discount_codes`: generell administrativ listing og INSERT/UPDATE/DELETE kun for administratorer. Eksisterende rabattvalidering i `src/services/subscriptionService.js` må få en avgrenset og trygg kontrakt, ikke offentlig tilgang til administrasjonsdata.
- `delete_user_account(uid)`: inspiser alle overloads, EXECUTE-grants, funksjonsdefinisjon, SECURITY DEFINER og search_path. Den må kontrollere den autentiserte innkalleren på serveren, ikke stole på målbrukerens ID eller en klientpåstand om rolle.
- Kontroller også relevante triggere, views og Edge Functions som kan omgå eller endre rollene.

## Trygg verifikasjon av backend

1. Start med read-only inspeksjon av skjema, grants, policyer og funksjonsdefinisjoner, uten å hente brukerdata.
2. Test de faktiske policyene/funksjonene i en isolert database med syntetiske gjeste-, bruker- og administratorkontekster. Bruk reell auth-kontekst/JWT-kontrakt, ikke service-role som om den var sluttbruker.
3. Bekreft avvisning av profiloversikt, sletting av andre brukere, rabattadministrasjon og direkte RPC for gjest/vanlig bruker; bekreft administratorens tillatte operasjoner.
4. Prøv egenoppgradering av rolle ved både INSERT og UPDATE; begge må avvises. Verifiser legitime egenprofilhandlinger fortsatt fungerer.
5. Ikke kall slette-RPC eller andre mutasjoner i produksjon, selv med «ugyldig» ID. Rollback alene er ikke tilstrekkelig dersom triggere eller funksjoner har eksterne sideeffekter.

Ingen generisk policy-migrasjon er lagt inn: uten eksisterende policies og skjema kan en slik migrasjon enten bryte egenprofil/rabattflyten eller la en eksisterende permissiv policy fortsatt åpne tilgang.

## Automatisert frontend-kontroll

`timeout 55s node tests/browser-refactor.mjs auth 320` (og `1280`) bruker isolerte, syntetiske Supabase-svar. Eksterne HTTP-kall og WebSockets avskjæres; ingen admin-mutasjoner sendes. Kontrollen dekker gjest, vanlig bruker, manglende rolle/profil, feil profilidentitet, avvist profiloppslag, ventende rolleoppslag, administrator og utlogging. Den kontrollerer at avviste tilstander ikke henter admin-data.

Historisk resultat fra 2026-09-24 (ikke verifikasjon av gjeldende endringer): auth-gruppen bestod ved 320 og 1280 px, alle 13 Node-tester bestod, og lint/build bestod (build varslet fortsatt om stor bundle). Skjermbilde av `/admin` som gjest viste startsiden etter videresending, uten nettleserfeil. Supabase-policyer og funksjonsdefinisjoner er fortsatt ikke tilgjengelige for kontroll.