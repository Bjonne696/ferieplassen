# Quality checks

This document describes the available checks, the behavior they protect and the remaining verification scope. Run commands from the project root using Node.js 22 or newer and npm, as described in the [README](../README.md).

## Baseline checks

```sh
npm ci
npm test
npm run lint -- --max-warnings=0
npm run build
```

| Command | What it checks |
| --- | --- |
| `npm test` | Runs the Node.js tests in `tests/*.test.mjs` and `src/utils/*.test.js` without watch mode or a live Supabase connection. |
| `npm run lint -- --max-warnings=0` | Checks `src`, `tests`, `vite.config.js` and `eslint.config.js`; warnings also fail the command. |
| `npm run build` | Creates the production bundle in `dist/`. A successful build does not establish that external services are correctly configured. |

The Node.js tests cover authentication and identity transitions, profile creation, stale availability requests, rating and filtering rules, listing creation order, demo activation and source structure.

## Browser checks

The Playwright harness in [tests/browser-refactor.mjs](../tests/browser-refactor.mjs) runs separately from `npm test`.

Configure `.env.local` as described in the README. Start the application in one terminal:

```sh
npm run dev
```

In a second terminal, install Chromium and run one group at one viewport width:

```sh
npx playwright install chromium
node --env-file=.env.local tests/browser-refactor.mjs identity 320
```

`--env-file=.env.local` supplies the test process with the Supabase URL used by the app. The harness needs that URL to intercept requests. Supported widths are **320, 768 and 1280 CSS pixels**. It defaults to 1280 when no width is supplied.

| Group | Implemented checks |
| --- | --- |
| `routes` | Page rendering, route navigation, reflow and map layout. |
| `listings` | Listing views, filters, empty states and selected DOM class conventions. |
| `carousel` | Create-listing card and carousel positioning in normal, hover and focus states. |
| `registration` | Registration, profile creation and recovery from selected failures. |
| `booking` | Date-picker rendering and a booking request with mocked responses. |
| `demo` | Simulated payment confirmation and intercepted demo activation. |
| `auth` | Guest restrictions, mocked sign-in and delayed profile responses after logout. |
| `identity` | Outdated profile data after a user switch, including a switch while the page stays mounted. |
| `refresh` | Preservation of the current page and form input during same-user session refresh. |
| `keyboard` | Keyboard interaction, focus, review selection and associated validation errors. |
| `axe` | Automated accessibility scans of selected normal and error states. |
| `cabin` | Missing-property and failed-lookup states, including checks that loading indicators are cleared. |

Each run includes a 55-second watchdog. On Linux or WSL, an additional outer limit can be used:

```sh
timeout 60s node --env-file=.env.local tests/browser-refactor.mjs identity 320
```

### Browser and server configuration

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Must match the URL configured for the app so Supabase requests can be mocked. |
| `BROWSER_TEST_URL` | Full application URL. Defaults to `http://localhost:5000`. |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Optional absolute path to an installed Chromium executable. |

Playwright's downloaded Chromium requires the appropriate system libraries. If the environment uses a system Chromium installation, specify its actual path. For example, on Linux or WSL:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
BROWSER_TEST_URL=http://127.0.0.1:5000 \
timeout 60s node --env-file=.env.local tests/browser-refactor.mjs identity 320
```

Replace `/usr/bin/chromium` if the executable is installed elsewhere. To check the production build, run `npm run build` and `npm run preview` instead of the development server. Development and preview both use port 5000, so run only one at a time.

### Network isolation

The harness uses synthetic users, listings and responses. It mocks supported Supabase requests, rejects unhandled operations, blocks other external HTTP requests and WebSockets, and blocks writes to the app's own origin. Local page and asset reads are allowed.

These browser checks do not perform real registrations, bookings, email delivery, payments or database changes. They verify frontend behavior against fixtures; they do not verify the deployed backend.

## Behavior to preserve

| Area | Expected behavior |
| --- | --- |
| User identity | Profiles, avatars, reviews, stays, listings and incoming requests belong to the current user. User changes and logout invalidate outdated responses. |
| Session refresh | Refreshes for the same user preserve the current page and filled form fields. |
| Registration | With a session, look up the profile before creating a missing one. Preserve existing profiles and roles. Without a session, show the email-confirmation message rather than a signed-in state. |
| Administrator access | Require a signed-in user, matching profile ID and the `admin` role. See [Administrator access](admin-access.md) for the full expected matrix and its test coverage. |
| Booking dates | Serialize the selected start and end dates as local `yyyy-MM-dd` values without shifting them through UTC. |
| Guest ratings | Show review averages without a premium bonus. An unrated property has no fabricated guest score. |
| Rating input | Use radio inputs, keyboard selection, visible focus and linked validation errors. The keyboard check explicitly checks selected and unselected star contrast, plus the selected focus outline. |
| Demo activation | Replayed effects share the activation attempt within the current hook instance. Once a POST has started, an uncertain outcome is not automatically retried. Activation failures remain visible. |
| Standard Vipps callback | Only an `active` subscription response produces the success redirect. The timeout button returns to the profile without a success flag. |

The current rating test covers the calculation helper. The browser booking check covers a mocked request, but does not establish the winter/summer date regression across timezones. The standard Vipps callback is also separate from the browser `demo` group.

## CSS conventions

Application styles are ordinary CSS files under `src/styles/`. [src/styles/index.css](../src/styles/index.css) is imported once by `src/main.jsx`, loading global styles before library styles, shared patterns and component styles.

Use descriptive English kebab-case classes and BEM-style element names, such as `main-navigation__profile-link`, `cabin-card__title` and `add-review-form__rating`. Shared values belong in CSS custom properties. Express UI states with modifier classes or data attributes, preserving selectors used by existing interactions. Keep required third-party classes, and avoid duplicate class tokens on application elements.

## Remaining verification

- Check booking date submission in winter and summer timezones, including daylight-saving transitions. Selecting a date must send that same calendar date.
- Verify keyboard order, screen-reader output, text zoom and loading, empty and error states manually. Automated checks cover selected scenarios and do not establish complete accessibility conformance.
- Complete the standard Vipps callback's association with the specific subscription being confirmed. It currently polls the owner's most recent subscription; statuses other than `active` continue waiting until timeout unless a URL error was supplied.
- Verify availability rules against the configured backend. Listing filtering reads `bookings` with strict overlap checks; the booking dialog reads `booking_requests` and uses inclusive overlap checks.
- Validate database permissions, Edge Functions, authentication settings and external service contracts in an isolated backend environment. Mocked frontend responses cannot establish these properties.

When recording results, include the commit, Node.js version, commands, browser groups, viewport sizes and failures or warnings. Treat earlier runs as historical evidence rather than a result for the current branch.
