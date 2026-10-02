# Administrator access

This document describes the frontend access rules and the authorization requirements for the external Supabase backend. See the [README](../README.md) for setup and [Quality checks](quality-check.md) for the test workflow.

## Frontend route protection

[AdminRoute in src/App.jsx](../src/App.jsx) protects both `/admin` and `/kontakt`.

| State | Expected behavior |
| --- | --- |
| Authentication or profile lookup is loading | Show a status message and wait before mounting the protected page. |
| No signed-in user | Redirect to the home page. |
| Missing profile or profile ID does not match the user ID | Redirect to the home page. |
| Profile role is not `admin` | Redirect to the home page. |
| Signed-in user has a matching profile with `role === 'admin'` | Mount the protected page. |

The administrator components mount only after the route guard permits access. These checks control what the interface displays. Supabase must enforce authorization for direct database and function requests as well.

## Session and profile behavior

[AuthProvider](../src/contexts/AuthProvider.jsx) distinguishes session refreshes from changes of user identity:

- `SIGNED_IN` or `TOKEN_REFRESHED` for the same user preserves profile state and open forms.
- Switching users or signing out invalidates pending profile requests from the previous identity.
- Outdated responses cannot replace the active user's profile.
- A missing profile or failed profile lookup does not grant administrator access.

[Profile creation](../src/utils/ensureSignupProfile.js) assigns the default role `bruker` to a new profile. If a profile already exists, the helper returns it without overwriting its role or fields. The backend must independently prevent users from assigning themselves an administrator role.

## Administrative operations

| Client operation | Backend resource |
| --- | --- |
| Display user names, email addresses and regions | `profiles` queries in [AdminData](../src/components/admin/AdminData.jsx) |
| Delete a profile | `profiles` deletion in `AdminData` |
| Delete the authentication account after profile deletion | `delete_user_account(uid)` RPC |
| List, create, update and delete discount codes | `discount_codes` operations in [DiscountCodeManager](../src/components/admin/DiscountCodeManager.jsx) |

Profile deletion and authentication-account deletion are separate requests in the current client. A successful profile deletion does not establish that the authentication account was also deleted.

## Backend authorization requirements

SQL migrations, Row Level Security policies and the implementation of `delete_user_account` are not included in this repository. The following requirements describe what must be checked in the configured Supabase project; they are not a claim that its current policies have been verified.

| Resource | Required checks |
| --- | --- |
| `profiles` | Inspect RLS, grants and all read/write policies. Preserve legitimate access to a user's own profile while restricting administrative listing, email access and deletion. |
| `profiles.role` | Prevent self-assignment or promotion to `admin` through inserts, updates or user-controlled metadata. |
| `discount_codes` | Restrict administrative listing and modification to administrators. Give the client-side discount validation flow only the access it needs. |
| `delete_user_account(uid)` | Check every overload, execution grants, caller authorization and any `SECURITY DEFINER` or `search_path` configuration. The function must authorize the caller independently of the supplied target ID. |
| Related views, triggers and Edge Functions | Check whether they bypass policies or allow profile roles and protected data to be changed indirectly. |

Use a separate test environment with synthetic users when validating these rules. Inspect the schema and policies first, then test direct requests as a guest, a regular user and an administrator. Verify both rejection of unauthorized operations and permitted operations on the user's own profile. Test role changes through both profile insertion and update. Administrative deletion tests belong in that isolated environment.

## Frontend verification

After installing dependencies and configuring `.env.local`, start the local development server in one terminal. In a second terminal, run from the project root:

```sh
npx playwright install chromium
node --env-file=.env.local tests/browser-refactor.mjs auth 320
node --env-file=.env.local tests/browser-refactor.mjs auth 1280
```

The current `auth` group checks guest redirects from `/admin` and `/kontakt`, mocked sign-in and handling of delayed profile responses after logout. It uses synthetic Supabase responses and intercepts external requests.

The full role and profile matrix above is an additional verification requirement: the current `auth` group does not exercise every row as a separate scenario. A passing frontend check also does not establish that database policies or the deletion RPC authorize real requests correctly.
