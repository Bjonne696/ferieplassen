# Ferieplassen

Ferieplassen is a Norwegian holiday rental application. Guests can explore properties and send booking requests, while owners can create listings and manage incoming requests and listing subscriptions.

This repository contains the React frontend, its Supabase integration and automated frontend checks. The application interface is in Norwegian.

## Features

- Browse rental properties, including collections of new and popular listings.
- Filter properties by location or title, price, facilities and dates.
- View property photos, descriptions, map locations and ratings based on guest reviews.
- Register, sign in and manage a profile with an avatar, reviews and upcoming or past stays.
- Send booking requests with selected dates and an optional message; owners can approve or decline requests.
- Create listings with image uploads and manage listing subscriptions through the Supabase and Vipps integration.
- Access administrator views for user and discount-code management.

## Tech stack

| Area | Tools |
| --- | --- |
| User interface | React 19, JavaScript and JSX |
| Routing | React Router 7 |
| Development and build | Vite 6 |
| Styling | Plain CSS, CSS custom properties and BEM-style class names |
| Backend integration | Supabase Auth, database, Storage and Edge Functions |
| Maps and dates | Leaflet, React Leaflet, react-date-range and date-fns |
| Quality checks | Node.js test runner, ESLint, Playwright and axe-core |

## Implementation highlights

- **Authentication:** [AuthProvider](src/contexts/AuthProvider.jsx) coordinates session and profile state, ignores outdated profile responses after user changes and preserves open forms during session refreshes.
- **Asynchronous search:** [Availability request coordination](src/utils/latestAvailability.js) ignores outdated responses when filters change and keeps previous results visible while loading.
- **Booking dates:** [Booking requests](src/hooks/useBookingRequest.js) format selected dates as local `yyyy-MM-dd` values, avoiding a UTC conversion that could shift the calendar day.
- **Guest ratings:** [Rating calculations](src/utils/cabinRatings.js) use review averages without adding a bonus for premium listings. The property details page follows the same rule.
- **Listing creation:** [createCabinListing](src/services/createCabinListing.js) uploads images, saves the listing and then starts its subscription.
- **Accessibility and styling:** The interface includes a skip link, labelled controls, keyboard-operable rating inputs and dialog focus management. CSS uses one [entry point](src/styles/index.css), shared variables and component styles. Automated accessibility checks cover selected flows, rather than a full audit.

## Getting started

Use **Node.js 22 or newer**, npm and a compatible Supabase project. Backend setup is described under [Backend and payment scope](#backend-and-payment-scope).

### 1. Install dependencies

```sh
git clone https://github.com/bjonne696/ferieplassen.git
cd ferieplassen
npm ci
```

### 2. Configure the environment

Create `.env.local` in the project root and replace the example values with your Supabase project settings:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_DEMO_MODE=true
```

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL, also used to reach Edge Functions |
| `VITE_SUPABASE_ANON_KEY` | Public client key for the Supabase project |
| `VITE_DEMO_MODE` | Set to `true` to enable the demo payment flow |

Vite exposes these values to the browser. Use the public client key and keep service-role keys and other secrets out of the frontend. Keep `.env.local` out of version control.

The demo flag enables the demo UI. Supabase and the backend's demo configuration are still required.

### 3. Start the application

```sh
npm run dev
```

Open [http://localhost:5000](http://localhost:5000). Restart the development server after changing environment variables.

## Scripts and checks

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server on port 5000 |
| `npm test` | Run the Node.js tests without a live Supabase connection |
| `npm run lint -- --max-warnings=0` | Run ESLint and reject warnings |
| `npm run build` | Create the production build in `dist/` |
| `npm run preview` | Serve the production build locally on port 5000 |

Stop the development server before running the preview server; both use the same port.

Node.js tests cover authentication transitions, stale requests, ratings, filters, listing creation and demo activation. Browser checks run separately and use synthetic data and mocked responses.

With the development server running, open a second terminal in the project root:

```sh
npx playwright install chromium
node --env-file=.env.local tests/browser-refactor.mjs identity 320
```

This checks user identity changes at 320 pixels wide. The environment file supplies the Supabase URL needed to intercept requests. See [Quality checks](docs/quality-check.md) for other groups, viewport sizes and browser setup.

## Backend and payment scope

The frontend requires an externally configured Supabase backend. Database migrations, Row Level Security policies and Edge Function implementations are not included. Administrator route guards control the interface; the backend must enforce authorization.

Subscriptions use `create-agreement`, `cancel-subscription` and `delete-subscription`. Listing creation follows the redirect URL returned by `create-agreement`. Demo use therefore requires a demo redirect from the backend and the `demo-activate-subscription` function, in addition to the frontend flag.

The standard Vipps callback requires an `active` subscription response before marking the return successful. It still polls the owner's most recent subscription; matching the callback to its specific subscription remains integration work. The timeout button returns to the profile without a success flag. Frontend tests do not verify live payments or production access policies.

Availability filtering reads approved entries from `bookings`, while the booking dialog uses `booking_requests`. Their relationship must be checked against the configured backend when setting up another environment.

## Further documentation

- [Quality checks](docs/quality-check.md) — commands, browser scenarios and verification scope.
- [Administrator access](docs/admin-access.md) — frontend access checks and backend authorization requirements.

These two documents are currently written in Norwegian.

## Author

[Bjørn - Tore M. Jaavall](https://github.com/bjonne696)
