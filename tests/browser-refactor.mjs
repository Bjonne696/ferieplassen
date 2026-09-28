// Isolated browser regression checks. Run bounded groups with OS timeout:
// timeout 60s node tests/browser-refactor.mjs routes 320
// Every cross-origin request and every same-origin write is intercepted before navigation.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createRequire } from 'node:module';

const domain = process.env.REPLIT_DEV_DOMAIN;
const base = new URL(process.env.BROWSER_TEST_URL || (domain
  ? (domain.startsWith('http') ? domain : `https://${domain}`)
  : 'http://localhost:5000'));
const supabaseUrl = process.env.VITE_SUPABASE_URL;
assert(supabaseUrl, 'VITE_SUPABASE_URL is required to isolate Supabase traffic');
const supabase = new URL(supabaseUrl);
const project = supabase.hostname.split('.')[0];
const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const userId = '11111111-1111-4111-8111-111111111111';
const ownerId = '22222222-2222-4222-8222-222222222222';
const registrationUserId = '33333333-3333-4333-8333-333333333333';
const secondUserId = '44444444-4444-4444-8444-444444444444';
const user = {
  id: userId, aud: 'authenticated', role: 'authenticated', email: 'browser.fixture@example.invalid',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {}, created_at: '2024-01-01T00:00:00Z',
};
const secondUser = { ...user, id: secondUserId, email: 'browser.second@example.invalid' };
const profile = {
  id: userId, name: 'Test', last_name: 'Browser', email: user.email,
  role: 'admin', avatar_url: null, region: 'Oslo',
};
const identityProfileA = { ...profile, avatar_url: 'a-profile.jpg' };
const secondProfile = {
  ...profile, id: secondUserId, name: 'B', last_name: 'Fixture',
  email: secondUser.email, avatar_url: 'b-profile.jpg', region: 'Bergen',
};
const cabins = Array.from({ length: 24 }, (_, i) => ({
  id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  title: i === 0 ? 'Fjellro unikt' : `Testhytte ${i + 1}`,
  location: i === 0 ? 'Oslo' : 'Bergen',
  price_per_night: i === 0 ? 150000 : 250000,
  facilities: i === 0 ? ['Kjøkken', 'WiFi'] : ['Parkering'],
  latitude: 59.91, longitude: 10.75, image_urls: [], is_active: true,
  is_premium: i % 3 === 0, owner_id: ownerId,
  created_at: new Date(Date.UTC(2025, 0, 25 - i)).toISOString(),
  description: 'Trygg testannonse',
}));
const reviews = cabins.map((cabin) => ({
  cabin_id: cabin.id, rating: 4, user_id: userId,
  comment: 'Test', cabins: { title: cabin.title, owner_id: ownerId },
}));
const session = {
  access_token: 'fixture-access-token-not-valid', refresh_token: 'fixture-refresh-not-valid',
  token_type: 'bearer', expires_in: 31536000,
  expires_at: Math.floor(Date.now() / 1000) + 31536000, user,
};
const secondSession = {
  ...session, access_token: 'fixture-second-access-token',
  refresh_token: 'fixture-second-refresh-token', user: secondUser,
};
const refreshSession = {
  ...session, expires_in: 180, expires_at: Math.floor(Date.now() / 1000) + 180,
};
const rows = {
  cabins,
  reviews: [...reviews,
    { cabin_id: cabins[0].id, rating: 4, user_id: ownerId, comment: 'A sin innkommende omtale', cabins: { title: 'A omtale', owner_id: userId } },
    { cabin_id: cabins[1].id, rating: 5, user_id: ownerId, comment: 'B sin innkommende omtale', cabins: { title: 'B omtale', owner_id: secondUserId } },
  ],
  profiles: [identityProfileA, secondProfile, { ...profile, id: ownerId, name: 'Eier' }],
  bookings: [{ cabin_id: cabins[0].id, status: 'approved', start_date: '2099-04-10', end_date: '2099-04-14' }],
  booking_requests: [
    { id: 'past-a', user_id: userId, cabin_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', status: 'approved', start_date: '2020-02-01', end_date: '2020-02-04', cabins: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'A tidligere opphold', location: 'Oslo', image_urls: [], owner_id: ownerId } },
    { id: 'past-b', user_id: secondUserId, cabin_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', status: 'approved', start_date: '2021-03-01', end_date: '2021-03-04', cabins: { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', title: 'B tidligere opphold', location: 'Bergen', image_urls: [], owner_id: ownerId } },
  ],
  subscriptions: [], notifications: [], discount_codes: [],
};
const writes = [];
const blocked = [];
const heldQueries = new Map();
const heldReleases = new Set();
const heldCounts = new Map();
const heldWaiters = new Map();
const heldIdentities = new Set();
const heldQueryKinds = new Map();
const heldQueryUrls = new Map();
const heldQueryObservations = new Map();
let browser;

function response(route, body, status = 200, headers = {}) {
  return route.fulfill({
    status, contentType: 'application/json; charset=utf-8',
    headers: { 'access-control-allow-origin': '*', ...headers },
    body: status === 204 ? '' : JSON.stringify(body),
  });
}

function postgresRows(url, scenario = null) {
  const table = decodeURIComponent(url.pathname.split('/rest/v1/')[1]?.split('/')[0] || '');
  assert(Object.hasOwn(rows, table), `Unmocked Supabase table: ${table}`);
  const scenarioProfiles = scenario?.profileRows || [];
  const overriddenProfileIds = new Set(scenarioProfiles.map((item) => item.id));
  const tableRows = scenario?.rows?.[table] || rows[table];
  let result = table === 'profiles' && scenarioProfiles.length
    ? [...tableRows.filter((item) => !overriddenProfileIds.has(item.id)), ...scenarioProfiles]
    : [...tableRows];
  for (const [key, value] of url.searchParams) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(key)) continue;
    const fieldValue = (row) => key.split('.').reduce((current, part) => current?.[part], row);
    if (value.startsWith('eq.')) result = result.filter((row) => String(fieldValue(row)) === value.slice(3));
    if (value.startsWith('lt.')) result = result.filter((row) => String(fieldValue(row)) < value.slice(3));
    if (value.startsWith('lte.')) result = result.filter((row) => String(fieldValue(row)) <= value.slice(4));
    if (value.startsWith('gt.')) result = result.filter((row) => String(fieldValue(row)) > value.slice(3));
    if (value.startsWith('gte.')) result = result.filter((row) => String(fieldValue(row)) >= value.slice(4));
    if (value.startsWith('in.')) result = result.filter((row) => value.slice(4, -1).split(',').includes(String(fieldValue(row))));
  }
  if (table === 'profiles' && url.searchParams.get('id') === `eq.${scenario?.user.id}`) {
    scenario.events.push({ type: 'profile-read', at: Date.now(), rows: result.length });
  }
  const order = url.searchParams.get('order');
  if (order) {
    const [field, direction] = order.split('.');
    result.sort((a, b) => String(a[field] ?? '').localeCompare(String(b[field] ?? '')) * (direction === 'desc' ? -1 : 1));
  }
  if (url.searchParams.has('offset')) result = result.slice(Number(url.searchParams.get('offset')));
  if (url.searchParams.has('limit')) result = result.slice(0, Number(url.searchParams.get('limit')));
  return result;
}

function registrationFixture(mode = 'success') {
  const signupUser = {
    ...user, id: registrationUserId, email: 'new.fixture@example.invalid',
    user_metadata: { name: 'Browser', last_name: 'Fixture' },
  };
  const signupSession = {
    ...session, access_token: `fixture-${mode}-access-token`,
    refresh_token: `fixture-${mode}-refresh-token`, user: signupUser,
  };
  return {
    mode, user: signupUser, session: signupSession,
    profile: {
      id: signupUser.id, name: 'Browser', last_name: 'Fixture',
      email: signupUser.email, role: 'bruker', avatar_url: null, region: 'Oslo',
    },
    profileRows: [], events: [],
  };
}

const PROFILE_QUERY_KINDS = ['avatar', 'pastBookings', 'userReviews', 'incomingReviews'];

function profileQueryKind(url) {
  const table = decodeURIComponent(url.pathname.split('/rest/v1/')[1]?.split('/')[0] || '');
  const selection = url.searchParams.get('select') || '';
  const userFilter = url.searchParams.get('user_id');
  const endDateFilter = url.searchParams.get('end_date');
  const ownerFilter = [...url.searchParams.entries()].find(([key]) =>
    key === 'owner_id' || key.endsWith('.owner_id'))?.[1];
  if (table === 'profiles' && selection === 'avatar_url' && url.searchParams.has('id')) return 'avatar';
  if (table === 'booking_requests' && userFilter && endDateFilter?.startsWith('lt.')) return 'pastBookings';
  if (table === 'reviews' && userFilter && selection === 'cabin_id') return 'userReviews';
  if (table === 'reviews' && ownerFilter && selection.includes('cabins')) return 'incomingReviews';
  return null;
}

function profileQueryIdentity(url, kind = profileQueryKind(url)) {
  if (kind === 'avatar') return url.searchParams.get('id')?.replace(/^eq\./, '');
  if (kind === 'incomingReviews') {
    const ownerFilter = [...url.searchParams.entries()].find(([key]) =>
      key === 'owner_id' || key.endsWith('.owner_id'))?.[1];
    return ownerFilter?.replace(/^eq\./, '');
  }
  return url.searchParams.get('user_id')?.replace(/^eq\./, '') || null;
}

function notifyHeldQuery(identity, url) {
  heldCounts.set(identity, (heldCounts.get(identity) || 0) + 1);
  const kind = profileQueryKind(url);
  const kinds = heldQueryKinds.get(identity) || new Set();
  if (kind) kinds.add(kind);
  heldQueryKinds.set(identity, kinds);
  const urls = heldQueryUrls.get(identity) || [];
  urls.push(`${url.pathname}?${url.searchParams.toString()}`);
  heldQueryUrls.set(identity, urls);
  for (const resolve of heldWaiters.get(identity) || []) resolve();
}

function recordIdentityQuery(url) {
  for (const identity of heldIdentities) {
    if (![...url.searchParams.values()].some((value) => value.includes(identity))) continue;
    const observations = heldQueryObservations.get(identity) || [];
    observations.push(`${url.pathname}?${url.searchParams.toString()}`);
    heldQueryObservations.set(identity, observations);
  }
}

async function waitForHeldQueries(identity) {
  const deadline = Date.now() + 6000;
  const received = () => heldQueryKinds.get(identity) || new Set();
  while (PROFILE_QUERY_KINDS.some((kind) => !received().has(kind)) && Date.now() < deadline) {
    await new Promise((resolve) => {
      const waiters = heldWaiters.get(identity) || [];
      waiters.push(resolve);
      heldWaiters.set(identity, waiters);
      setTimeout(resolve, 40);
    });
  }
  const missing = PROFILE_QUERY_KINDS.filter((kind) => !received().has(kind));
  assert.deepEqual(missing, [],
    `Missing delayed profile request kinds for ${identity}: ${missing.join(', ') || 'none'}; saw ${[...received()].join(', ') || 'none'}; all candidate URLs=${JSON.stringify(heldQueryObservations.get(identity) || [])}; held URLs=${JSON.stringify(heldQueryUrls.get(identity) || [])}`);
}

function releaseQueries(identity) {
  heldIdentities.delete(identity);
  for (const release of [...(heldQueries.get(identity) || [])]) release();
}

function releaseAllQueries() {
  heldIdentities.clear();
  for (const release of [...heldReleases]) release();
}

function identityScenario() {
  const aPastCabin = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const bPastCabin = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const makePastBooking = (id, cabinId, title, location, endDate) => ({
    id, user_id: id === 'past-a' ? userId : secondUserId, cabin_id: cabinId,
    status: 'approved', start_date: `${endDate.slice(0, 4)}-01-01`, end_date: endDate,
    cabins: { id: cabinId, title, location, image_urls: [], owner_id: ownerId },
  });
  const aCabin = { id: aPastCabin, title: 'A tidligere opphold', location: 'Oslo', image_urls: [], owner_id: ownerId };
  const bCabin = { id: bPastCabin, title: 'B tidligere opphold', location: 'Bergen', image_urls: [], owner_id: ownerId };
  const otherUserId = '66666666-6666-4666-8666-666666666666';
  return {
    mode: 'mounted-identity-race', user, session,
    switchUser: secondUser, switchSession: secondSession,
    profileRows: [], events: [], activeUser: user,
    releases: new Set(), startedA: new Map(), completedA: new Map(),
    rows: {
      ...rows,
      profiles: [identityProfileA, secondProfile, { ...profile, id: ownerId, name: 'Eier' }],
      booking_requests: [
        makePastBooking('past-a', aPastCabin, aCabin.title, aCabin.location, '2020-02-04'),
        makePastBooking('past-b', bPastCabin, bCabin.title, bCabin.location, '2021-03-04'),
      ],
      reviews: [
        ...reviews,
        { cabin_id: aPastCabin, rating: 4, user_id: userId, comment: 'A egen omtale', cabins: aCabin },
        { cabin_id: bPastCabin, rating: 4, user_id: userId, comment: 'A vurderte Bs opphold', cabins: bCabin },
        { cabin_id: cabins[0].id, rating: 4, user_id: otherUserId, comment: 'A innkommende omtale', cabins: { title: 'A omtale', owner_id: userId } },
        { cabin_id: cabins[1].id, rating: 5, user_id: otherUserId, comment: 'B innkommende omtale', cabins: { title: 'B omtale', owner_id: secondUserId } },
      ],
    },
  };
}

async function installIsolation(context, scenario = null) {
  // Playwright HTTP routing does not cover upgraded realtime WebSockets.
  await context.routeWebSocket('**/*', (socket) => socket.close());
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (url.origin === base.origin) {
      if (['GET', 'HEAD'].includes(method)) return route.continue();
      blocked.push(`${method} same-origin ${url.pathname}`);
      return response(route, { error: 'Browser harness blocked same-origin write' }, 403);
    }
    if (url.origin !== supabase.origin) {
      // Tiles, CDN images, analytics and third-party scripts never leave the browser.
      blocked.push(`${method} external ${url.hostname}${url.pathname}`);
      return route.abort();
    }
    const path = url.pathname;
    if (method === 'OPTIONS') {
      return response(route, null, 204, {
        'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'access-control-allow-headers': '*',
      });
    }
    if (path.startsWith('/rest/v1/')) {
      if (method === 'GET' || method === 'HEAD') {
        const table = decodeURIComponent(path.split('/rest/v1/')[1]?.split('/')[0] || '');
        if (scenario?.failCabins && table === 'cabins') {
          return response(route, { message: 'Fixture cabin query failed' }, 503);
        }
        if (scenario?.mode === 'profile-read-delay' && table === 'profiles') {
          const profileUserId = url.searchParams.get('id')?.replace(/^eq\./, '');
          if ([scenario.user.id, scenario.switchUser.id].includes(profileUserId)) {
            scenario.profileReadsStarted = (scenario.profileReadsStarted || 0) + 1;
            scenario.events.push({ type: 'profile-read-started', userId: profileUserId, at: Date.now() });
          }
          if (profileUserId === scenario.user.id) {
            await new Promise((resolve) => scenario.oldProfileReleases.push(resolve));
          }
        }
        const result = postgresRows(url, scenario);
        if (scenario?.mode === 'profile-read-delay' && table === 'profiles') {
          scenario.events.push({
            type: 'profile-read-complete', userId: url.searchParams.get('id')?.slice(3),
            rows: result.length, at: Date.now(),
          });
        }
        const single = /application\/vnd\.pgrst\.object\+json/.test(request.headers().accept || '');
        const body = single ? (result[0] ?? null) : result;
        recordIdentityQuery(url);
        const queryKind = profileQueryKind(url);
        const identity = profileQueryIdentity(url, queryKind);
        if (identity && heldIdentities.has(identity)) {
          notifyHeldQuery(identity, url);
          await new Promise((resolve) => {
            let released = false;
            const release = () => {
              if (released) return;
              released = true;
              heldReleases.delete(release);
              const pending = heldQueries.get(identity) || [];
              heldQueries.set(identity, pending.filter((item) => item !== release));
              resolve();
            };
            const pending = heldQueries.get(identity) || [];
            pending.push(release);
            heldQueries.set(identity, pending);
            heldReleases.add(release);
          });
        }
        if (scenario?.mode === 'mounted-identity-race' && queryKind && identity === userId) {
          scenario.startedA.set(queryKind, (scenario.startedA.get(queryKind) || 0) + 1);
          await new Promise((resolve) => {
            const release = () => {
              scenario.releases.delete(release);
              resolve();
            };
            scenario.releases.add(release);
          });
          scenario.completedA.set(queryKind, (scenario.completedA.get(queryKind) || 0) + 1);
        }
        return response(route, body, 200, { 'content-range': `0-${Math.max(0, result.length - 1)}/${result.length}` });
      }
      writes.push({ method, path }); // Recorded, never forwarded.
      const submitted = request.postDataJSON?.() ?? {};
      const payload = Array.isArray(submitted) ? submitted : [submitted];
      const table = decodeURIComponent(path.split('/rest/v1/')[1]?.split('/')[0] || '');
      if (scenario && table === 'profiles' && scenario.mode === 'profile-failure') {
        scenario.events.push({ type: 'profile-insert-failed', at: Date.now() });
        return response(route, { message: 'Fixture profile insert failed' }, 500);
      }
      if (scenario && table === 'profiles' && scenario.mode === 'lookup-race') {
        scenario.events.push({ type: 'profile-insert', at: Date.now() });
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      // Respect PostgREST representation/minimal return preferences.
      const representation = /return=representation/.test(request.headers().prefer || '');
      const generated = payload.map((row) => ({ id: row.id || '33333333-3333-4333-8333-333333333333', ...row }));
      const single = /application\/vnd\.pgrst\.object\+json/.test(request.headers().accept || '');
      if (scenario && table === 'profiles') {
        scenario.profileRows.push(...generated);
        scenario.events.push({ type: 'profile-insert-complete', at: Date.now() });
      }
      return response(route, representation ? (single ? generated[0] : generated) : null, representation ? 201 : 204);
    }
    if (path.startsWith('/auth/v1/')) {
      if (path.endsWith('/user')) {
        const token = request.headers().authorization || '';
        const returnedUser = scenario?.activeUser || scenario?.user || (token.includes('second') ? secondUser : user);
        scenario?.events.push({ type: 'auth-user', token: token.replace(/^Bearer\s+/i, ''), userId: returnedUser?.id, at: Date.now() });
        return response(route, returnedUser);
      }
      if (path.endsWith('/signup')) {
        writes.push({ method, path });
        if (scenario) {
          scenario.events.push({ type: 'signup', at: Date.now() });
          if (scenario.mode === 'signup-delay') await new Promise((resolve) => setTimeout(resolve, 350));
          if (scenario.mode === 'signup-failure') {
            return response(route, { message: 'Fixture signup failed', error_description: 'Fixture signup failed' }, 400);
          }
          return response(route, scenario.mode === 'no-session'
            ? { user: scenario.user }
            : { ...scenario.session, user: scenario.user });
        }
        return response(route, { user, session: null });
      }
      if (path.endsWith('/token')) {
        const submitted = request.postDataJSON?.() ?? {};
        const grantType = url.searchParams.get('grant_type') || submitted.grant_type;
        writes.push({ method, path, grantType });
        if (scenario?.mode === 'token-refresh-delay' && grantType === 'refresh_token') {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
        const isPasswordLogin = grantType === 'password';
        const scenarioSession = isPasswordLogin
          ? (scenario?.switchSession || scenario?.session)
          : (scenario?.refreshSession || scenario?.session);
        const scenarioUser = isPasswordLogin ? (scenario?.switchUser || scenario?.user) : scenario?.user;
        if (scenario && scenarioSession && scenarioUser) {
          if (isPasswordLogin) scenario.activeUser = scenarioUser;
          scenario.events.push({
            type: 'auth-token', grantType, submittedEmail: submitted.email,
            userId: scenarioUser.id, switchUserId: scenario.switchUser?.id || null, at: Date.now(),
          });
          return response(route, { ...scenarioSession, user: scenarioUser });
        }
        const isSecondUser = submitted.email === secondUser.email
          || submitted.refresh_token === secondSession.refresh_token;
        const tokenUser = isSecondUser ? secondUser : user;
        const tokenSession = isSecondUser ? secondSession : session;
        if (grantType === 'refresh_token') {
          scenario?.events.push({ type: 'auth-token', grantType, userId: tokenUser.id, at: Date.now() });
          return response(route, {
            ...tokenSession, expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            access_token: isSecondUser ? 'fixture-second-refreshed-access' : 'fixture-refreshed-access',
            refresh_token: isSecondUser ? 'fixture-second-refreshed-refresh' : 'fixture-refreshed-refresh',
            user: tokenUser,
          });
        }
        scenario?.events.push({ type: 'auth-token', grantType, submittedEmail: submitted.email, userId: tokenUser.id, at: Date.now() });
        return response(route, { ...tokenSession, user: tokenUser });
      }
      if (path.endsWith('/logout')) {
        writes.push({ method, path });
        return response(route, {});
      }
      blocked.push(`Unmocked Supabase auth operation: ${method} ${path}`);
      return response(route, { error: 'Unmocked auth operation' }, 503);
    }
    if (path.startsWith('/functions/v1/')) {
      writes.push({ method, path });
      if (path.endsWith('/demo-activate-subscription')) return response(route, { success: true });
      // Explicitly reject unexercised functions, including email/payment/notification functions.
      return response(route, { error: 'Function blocked by browser harness' }, 403);
    }
    if (path.startsWith('/storage/v1/')) {
      if (method === 'GET') return response(route, {});
      writes.push({ method, path });
      return response(route, { error: 'Storage write blocked by browser harness' }, 403);
    }
    blocked.push(`Unmocked Supabase endpoint: ${method} ${path}`);
    return response(route, { error: 'Unmocked endpoint' }, 503);
  });
}

function check(name, fn) {
  return fn().then(() => console.log(`PASS ${name}`), (error) => {
    error.message = `${name}: ${error.message}`;
    throw error;
  });
}

async function open(page, path, heading) {
  await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 6000 });
  if (heading) await page.getByRole('heading', { name: heading, exact: true }).first().waitFor();
  await page.locator('body').waitFor();
  await page.waitForTimeout(120);
  assert(await page.locator('body').isVisible(), `No visible body at ${path}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert(overflow < 30, `Horizontal overflow ${overflow}px on ${path}`);
}

async function ensureMobileMenuItem(page, name) {
  const visibleItem = page.getByRole('link', { name, exact: true }).filter({ visible: true }).first();
  const menuButton = page.getByRole('button', { name: 'Mobilmeny' });
  if (await menuButton.isVisible()) {
    if (!(await visibleItem.isVisible())) await menuButton.click();
  } else {
    await visibleItem.waitFor({ state: 'visible' });
  }
  return visibleItem;
}

async function visibleProfileLink(page) {
  return ensureMobileMenuItem(page, 'Min Profil');
}

async function assertVisibleLogout(page) {
  const logout = page.getByText('Logg ut', { exact: true });
  const alreadyVisible = await logout.evaluateAll((nodes) =>
    nodes.some((node) => node.getClientRects().length > 0));
  if (!alreadyVisible) {
    const menuButton = page.getByRole('button', { name: 'Mobilmeny' });
    if (await menuButton.isVisible()) await menuButton.click();
    else await page.getByRole('button', { name: 'Logg ut' }).waitFor({ state: 'visible' });
  }
  assert(await logout.evaluateAll((nodes) => nodes.some((node) => node.getClientRects().length > 0)),
    'Logg ut is not visible in the authenticated header/menu');
}

async function clickLogout(page) {
  const desktopLogout = page.getByRole('button', { name: 'Logg ut' }).first();
  if (await desktopLogout.isVisible()) {
    await desktopLogout.click();
  } else {
    await page.getByRole('button', { name: 'Mobilmeny' }).click();
    await page.getByRole('button', { name: 'Logg ut' }).click();
  }
  await page.locator('a[href="/login"]').first().waitFor({ state: 'attached' });
}

async function listingChecks(page) {
  await check('home: 11 cards, search title/location/price, reset and pagination', async () => {
    await open(page, '/', 'Velkommen til Ferieplassen!');
    await page.getByText('Alle annonser (24)').waitFor();
    if (process.env.VISUAL_REFERENCE_DIR) {
      await page.screenshot({ path: `${process.env.VISUAL_REFERENCE_DIR}/home-${width}.png`, fullPage: true });
    }
    assert.equal(await page.getByText('Alle annonser (24)').locator('..').locator('a[href^="/hytte/"]').filter({ hasText: /Testhytte|Fjellro/ }).count(), 11);
    await page.getByRole('button', { name: 'Neste', exact: true }).click();
    await page.getByText('Testhytte 12').first().waitFor();
    const search = page.getByPlaceholder('Søk etter feriebolig (tittel, område eller pris)...');
    await search.fill('Fjellro unikt');
    await page.getByText('Søkeresultater for "Fjellro unikt" (1)').waitFor();
    await search.fill('150000');
    await page.getByText('Søkeresultater for "150000" (1)').waitFor();
    await search.fill('umulig-testord');
    await page.getByText('Ingen feriebolig matcher søket ditt.').waitFor();
    await search.fill('');
    await page.getByText('Alle annonser (24)').waitFor();
  });
  await check('rental: search, price/facilities, dates, clear and pagination', async () => {
    await open(page, '/til-leie', 'Til leie');
    await page.getByText('Alle annonser (24)').waitFor();
    if (process.env.VISUAL_REFERENCE_DIR) {
      await page.screenshot({ path: `${process.env.VISUAL_REFERENCE_DIR}/rental-${width}.png`, fullPage: true });
    }
    await page.getByRole('button', { name: 'Neste', exact: true }).click();
    await page.getByText('Testhytte 12').first().waitFor();
    const search = page.getByPlaceholder('Søk etter feriebolig (tittel eller område)...');
    await search.fill('Fjellro');
    await page.getByText('Søkeresultater for "Fjellro" (1)').waitFor();
    await page.getByPlaceholder('Fra').fill('200000');
    await page.getByText('Søkeresultater for "Fjellro" (0)').waitFor();
    await page.getByPlaceholder('Fra').fill('');
    await page.getByLabel('WiFi').check();
    assert(await page.getByLabel('WiFi').isChecked(), 'WiFi facility did not toggle');
    await page.getByText('Søkeresultater for "Fjellro" (1)').waitFor();
    await page.locator('input[type=date]').nth(0).fill('2099-04-11');
    await page.locator('input[type=date]').nth(1).fill('2099-04-12');
    await page.getByText(/Søkeresultater for "Fjellro".*\(0\)/).waitFor();
    await page.getByRole('button', { name: 'Tøm alle filtre' }).click();
    await page.getByText('Alle annonser (24)').waitFor();
  });
  await check('popular/new listings: 12-per-page and 12 latest', async () => {
    await open(page, '/popular', 'Populære feriebolig');
    await page.getByText('Populære annonser (24)').waitFor();
    await page.getByRole('button', { name: 'Neste', exact: true }).click();
    await page.getByText('Testhytte 13').first().waitFor();
    await open(page, '/nye-hytter', 'Nye feriebolig');
    await page.getByText('Testhytte 12').first().waitFor();
    assert.equal(await page.getByText('Testhytte 13', { exact: true }).count(), 0);
  });
  await renderedClassChecks(page);
}

async function assertClassTokens(locator, expected, label) {
  const actual = await locator.evaluate((element) => element.getAttribute('class') || '');
  const tokens = actual.trim().split(/\s+/).filter(Boolean);
  assert.equal(new Set(tokens).size, tokens.length, `${label} contains duplicate class tokens: ${actual}`);
  assert.deepEqual([...tokens].sort(), [...expected].sort(), `${label} has unexpected or missing class tokens`);
  for (const token of tokens) {
    assert(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$/.test(token)
      || ['active', 'selected', 'approve', 'reject', 'small', 'align-end'].includes(token),
    `${label} contains a non-readable app class "${token}"`);
  }
}

async function renderedClassChecks(page) {
  await check('app-owned class tokens: only named classes, no duplicates or generated hashes', async () => {
    await open(page, '/', 'Velkommen til Ferieplassen!');
    const homeRoot = page.locator('.home-page').first();
    await assertClassTokens(homeRoot, ['page-wrapper', 'home-page'], 'home page root');
    const navigation = page.locator('.main-navigation').first();
    await assertClassTokens(navigation, ['main-navigation'], 'main navigation');
    const profileNavigationLink = page.locator('a[aria-label^="Min profil"]').first();
    await assertClassTokens(profileNavigationLink,
      ['user-menu__avatar', 'profile-link', 'main-navigation__profile-link'], 'profile navigation link');
    const cookieBanner = page.locator('.cookie-banner').first();
    await cookieBanner.waitFor({ state: 'visible' });
    await assertClassTokens(cookieBanner, ['cookie-banner'], 'cookie banner');
    const cabinCard = page.locator('.cabin-card').filter({
      has: page.getByRole('heading', { name: 'Fjellro unikt', exact: true }),
    }).first();
    await assertClassTokens(cabinCard, ['card', 'cabin-card'], 'cabin card');
    await assertClassTokens(cabinCard.getByRole('heading', { name: 'Fjellro unikt', exact: true }),
      ['cabin-card__title'], 'cabin title');
    const observedClasses = process.env.REPORT_CLASS_ATTRIBUTES ? {
      home: await homeRoot.getAttribute('class'),
      navigation: await navigation.getAttribute('class'),
      cabinCard: await cabinCard.getAttribute('class'),
    } : null;

    if (process.env.VISUAL_REFERENCE_DIR) {
      await page.screenshot({ path: `${process.env.VISUAL_REFERENCE_DIR}/home-${width}.png`, fullPage: true });
    }

    await open(page, '/min-profil', 'Min profil');
    const profileImage = page.getByRole('img', { name: 'Profilbilde' }).first();
    await profileImage.waitFor({ state: 'visible' });
    assert((await profileImage.getAttribute('src')).includes('a-profile.jpg'),
      'The A profile avatar was not resolved before the visual and class checks');
    if (process.env.VISUAL_REFERENCE_DIR) {
      await page.screenshot({ path: `${process.env.VISUAL_REFERENCE_DIR}/profile-${width}.png`, fullPage: true });
    }
    await assertClassTokens(page.locator('.profile-overview').first(), ['profile-overview'], 'profile overview');
    await assertClassTokens(profileImage, ['profile-overview__avatar'], 'profile avatar');
    if (observedClasses) observedClasses.profile = await page.locator('.profile-overview').first().getAttribute('class');
    const review = page.locator('.add-review-form').first();
    await review.waitFor({ state: 'visible' });
    await assertClassTokens(review, ['add-review-form'], 'review form');
    const rating = review.getByRole('radiogroup', { name: 'Stjerner:' });
    await assertClassTokens(rating, ['add-review-form__rating'], 'review rating group');
    const radio = rating.getByRole('radio', { name: '1 stjerne' });
    await radio.focus();
    await page.keyboard.press('ArrowRight');
    const star = rating.getByRole('radio', { name: '2 stjerner' }).locator('+ span');
    await assertClassTokens(star, ['add-review-form__star', 'active', 'selected'], 'selected review star');
    if (observedClasses) observedClasses.selectedStar = await star.getAttribute('class');

    await open(page, `/hytte/${cabins[0].id}`, cabins[0].title);
    await page.getByRole('button', { name: 'Send forespørsel' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Send forespørsel' });
    await dialog.waitFor({ state: 'visible' });
    if (process.env.VISUAL_REFERENCE_DIR) {
      await page.screenshot({ path: `${process.env.VISUAL_REFERENCE_DIR}/booking-${width}.png`, fullPage: true });
    }
    await assertClassTokens(page.locator('.booking-request-modal').first(),
      ['modal-overlay', 'booking-request-modal'], 'booking dialog overlay');
    await assertClassTokens(dialog, ['modal', 'booking-request-modal__dialog'], 'booking dialog');
    if (observedClasses) {
      observedClasses.dialog = await dialog.getAttribute('class');
      console.log(`DOM_CLASSES ${JSON.stringify(observedClasses)}`);
    }
  });
}

async function carouselChecks(width) {
  const positions = {
    'left-2': [-2, 0.7],
    'left-1': [-1.2, 0.8],
    main: [-0.5, 1],
    'right-1': [0.2, 0.8],
    'right-2': [1, 0.7],
  };
  for (const [label, fixtureCabins, steps] of [
    ['only create card', [], [['main', null]]],
    ['four premium cabins', cabins.slice(0, 4).map((cabin) => ({ ...cabin, is_premium: true })), [
      ['left-1', null], ['main', 'Forrige feriebolig'],
      ['right-1', 'Forrige feriebolig'], ['right-2', 'Forrige feriebolig'],
      ['right-1', 'Neste feriebolig'], ['main', 'Neste feriebolig'],
      ['left-1', 'Neste feriebolig'], ['left-2', 'Neste feriebolig'],
    ]],
  ]) {
    await check(`carousel: ${label} at ${width}px keeps position through normal and hover states`, async () => {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
      try {
        await installIsolation(context, { user, session, events: [], rows: { cabins: fixtureCabins } });
        await context.addInitScript(({ key, fixture }) => {
          localStorage.setItem(key, JSON.stringify(fixture));
        }, { key: `sb-${project}-auth-token`, fixture: session });
        const page = await context.newPage();
        page.setDefaultTimeout(2500);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await open(page, '/', 'Velkommen til Ferieplassen!');
        await page.waitForFunction((count) =>
          document.querySelectorAll('.featured-cabin-carousel__card').length === count,
        fixtureCabins.length + 1);
        const card = page.locator('.featured-cabin-carousel__card.create-listing-card--carousel');
        const gridCard = page.locator('.create-listing-card--grid').first();
        assert.equal(await card.count(), 1);
        assert.equal(await gridCard.count(), 1);

        const gridStyle = await gridCard.evaluate((node) => {
          const style = getComputedStyle(node);
          return { position: style.position, border: style.borderStyle };
        });
        assert.equal(gridStyle.position, 'relative', 'Grid create card lost its relative positioning');
        assert.equal(gridStyle.border, 'dashed', 'Grid create card lost its normal border');
        await gridCard.hover();
        await page.waitForFunction((expected) => {
          const node = document.querySelector('.create-listing-card--grid');
          const style = getComputedStyle(node);
          return style.borderStyle === 'solid'
            && Math.abs(new DOMMatrixReadOnly(style.transform).m42 - expected) < 0.15;
        }, width <= 480 ? 0 : -2);
        await gridCard.focus();
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Tab');
        assert(await gridCard.evaluate((node) =>
          document.activeElement === node && getComputedStyle(node).outlineWidth === '3px'),
        'Grid create card lost keyboard focus outline');
        await page.mouse.move(0, 0);

        const cdp = await context.newCDPSession(page);
        await cdp.send('DOM.enable');
        await cdp.send('CSS.enable');
        const { root } = await cdp.send('DOM.getDocument');
        const { nodeId } = await cdp.send('DOM.querySelector', {
          nodeId: root.nodeId, selector: '.featured-cabin-carousel__card.create-listing-card--carousel',
        });
        assert(nodeId, 'Carousel create card is missing from the DOM');
        try {
          for (const [position, direction] of steps) {
            if (direction) await page.getByRole('button', { name: direction }).click();
            await page.waitForFunction(({ position, xFactor, scale }) => {
              const node = document.querySelector('.featured-cabin-carousel__card.create-listing-card--carousel');
              if (!node?.classList.contains(`featured-cabin-carousel__card--${position}`)) return false;
              const style = getComputedStyle(node);
              const matrix = new DOMMatrixReadOnly(style.transform);
              return style.position === 'absolute'
                && Math.abs(matrix.m41 - node.offsetWidth * xFactor) < 0.3
                && Math.abs(matrix.m42 + node.offsetHeight * 0.5) < 0.3
                && Math.abs(matrix.m11 - scale) < 0.002;
            }, { position, xFactor: positions[position][0], scale: positions[position][1] });
            assert.equal(await card.getAttribute('tabindex'), position === 'main' ? '0' : '-1');
            assert.equal(await card.getAttribute('aria-hidden'), position === 'main' ? 'false' : 'true');
            if (position === 'main') {
              await card.focus();
              await page.keyboard.press('Shift+Tab');
              await page.keyboard.press('Tab');
              assert(await card.evaluate((node) =>
                document.activeElement === node && getComputedStyle(node).outlineWidth === '3px'),
              'Carousel create card lost keyboard focus outline');
              await card.hover();
            }
            await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
            await page.waitForFunction(({ xFactor, scale }) => {
              const node = document.querySelector('.featured-cabin-carousel__card.create-listing-card--carousel');
              const style = getComputedStyle(node);
              const matrix = new DOMMatrixReadOnly(style.transform);
              return style.position === 'absolute' && style.borderStyle === 'solid'
                && Math.abs(matrix.m41 - node.offsetWidth * xFactor) < 0.3
                && Math.abs(matrix.m42 + node.offsetHeight * 0.5) < 0.3
                && Math.abs(matrix.m11 - scale) < 0.002;
            }, { xFactor: positions[position][0], scale: positions[position][1] });
            await page.mouse.move(0, 0);
            await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
          }
        } finally {
          await cdp.detach();
        }
        assert.deepEqual(errors, [], 'Uncaught carousel browser exceptions');
      } finally {
        await context.close();
      }
    });
  }
}

async function writeFlowChecks(page, group) {
  if (group === 'registration') {
  await check('registration: validation and mocked signup/profile insert', async () => {
    await open(page, '/register', 'Opprett konto');
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Registrer deg' }) });
    await form.locator('#firstName').fill('Browser');
    await form.locator('#lastName').fill('Fixture');
    await form.locator('#email').fill('fixture@example.invalid');
    await form.locator('#password').fill('short');
    await form.getByRole('button', { name: 'Registrer deg' }).click();
    assert(await form.locator('#password').evaluate((node) => node.validity.tooShort),
      'Short password should be blocked by browser validation');
    assert.equal(writes.filter((entry) => entry.path.endsWith('/signup')).length, 0);
    await form.locator('#password').fill('SafeFixture123');
    await form.getByRole('button', { name: 'Registrer deg' }).click();
    await page.waitForURL('**/min-profil');
    assert.equal(writes.filter((entry) => entry.path.endsWith('/signup')).length, 1);
    assert.equal(writes.filter((entry) => entry.path.endsWith('/profiles')).length, 1);
  });
  }
  if (group === 'booking') await check('booking: rendered date picker and mocked request (no notification delivered)', async () => {
    await open(page, `/hytte/${cabins[0].id}`, cabins[0].title);
    await page.getByRole('button', { name: 'Send forespørsel' }).first().click();
    await page.locator('.rdrCalendarWrapper').waitFor();
    if (process.env.VISUAL_REFERENCE_DIR) {
      await page.screenshot({ path: `${process.env.VISUAL_REFERENCE_DIR}/booking-${width}.png`, fullPage: true });
    }
    const calendar = page.locator('.rdrCalendarWrapper').first();
    assert((await calendar.evaluate((node) => Number.parseFloat(getComputedStyle(node).width))) > 100,
      'react-date-range styles not loaded');
    await page.getByRole('button', { name: 'Send forespørsel' }).last().click();
    await page.getByText('Forespørselen er sendt!').waitFor();
    assert.equal(writes.filter((entry) => entry.path.endsWith('/booking_requests')).length, 1);
    await page.getByRole('dialog', { name: 'Send forespørsel' })
      .getByRole('button', { name: 'Lukk', exact: true }).last().click();
    await page.getByRole('dialog', { name: 'Send forespørsel' }).waitFor({ state: 'detached' });
  });
  if (process.env.VITE_DEMO_MODE === 'true') {
    await check('demo callback: activation intercepted exactly once', async () => {
      const before = writes.filter((entry) => entry.path.endsWith('/demo-activate-subscription')).length;
      await open(page, '/demo-payment?subscriptionId=fixture&cabinId=fixture', 'Demo-betaling');
      await page.getByRole('button', { name: 'Godkjenn demo-betaling' }).click();
      await page.getByRole('heading', { name: 'Demo-abonnement aktivert!' }).waitFor();
      assert.equal(writes.filter((entry) => entry.path.endsWith('/demo-activate-subscription')).length - before, 1);
    });
  }
}

async function registrationChecks(width) {
  async function withGuest(mode, run, oldRedirect = false) {
    writes.length = 0;
    const fixture = registrationFixture(mode);
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
    try {
      await installIsolation(context, fixture);
      if (oldRedirect) await context.addInitScript(() => sessionStorage.setItem('redirectAfterAuth', '/ny-hytte'));
      const page = await context.newPage();
      page.setDefaultTimeout(2500);
      page.setDefaultNavigationTimeout(6000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await run(page, fixture);
      assert.deepEqual(errors, [], 'Uncaught registration browser exceptions');
    } finally {
      await context.close();
    }
  }

  async function fillRegistration(page, shortPassword = false) {
    await open(page, '/register', 'Opprett konto');
    await page.getByLabel('Fornavn').fill('Browser');
    await page.getByLabel('Etternavn').fill('Fixture');
    await page.getByLabel('E-postadresse').fill('new.fixture@example.invalid');
    await page.getByLabel('Passord').fill(shortPassword ? 'short' : 'SafeFixture123');
  }

  await check('registration: guest session creates profile, blocks duplicates and reaches home/header/profile', async () => {
    await withGuest('lookup-race', async (page, fixture) => {
      await fillRegistration(page, true);
      const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Registrer deg' }) });
      await form.getByRole('button', { name: 'Registrer deg' }).click();
      assert(await page.getByLabel('Passord').evaluate((node) => node.validity.tooShort),
        'Short password should be blocked by form validation');
      assert.equal(writes.filter((entry) => entry.path.endsWith('/signup')).length, 0);
      await page.getByLabel('Passord').fill('SafeFixture123');
      const signupCount = writes.filter((entry) => entry.path.endsWith('/signup')).length;
      const profileInsertCount = writes.filter((entry) => entry.path.endsWith('/profiles')).length;
      const submit = form.getByRole('button', { name: 'Registrer deg' });
      await submit.evaluate((button) => {
        button.click();
        button.click();
      });
      await page.waitForURL((url) => url.pathname === '/', { timeout: 6000 });
      await page.getByRole('heading', { name: 'Velkommen til Ferieplassen!' }).waitFor();
      assert.equal(writes.filter((entry) => entry.path.endsWith('/signup')).length - signupCount, 1,
        'Duplicate submit issued another signup');
      assert.equal(writes.filter((entry) => entry.path.endsWith('/profiles')).length - profileInsertCount, 1,
        'Expected exactly one profile insert');
      const read = fixture.events.findIndex((event) => event.type === 'profile-read');
      const insert = fixture.events.findIndex((event) => event.type === 'profile-insert');
      const complete = fixture.events.findIndex((event) => event.type === 'profile-insert-complete');
      assert(read >= 0 && insert >= 0 && read < complete,
        `Expected lookup before profile insert completed; events=${JSON.stringify(fixture.events)}`);
      assert.equal(fixture.events[read].rows, 0, 'Race fixture profile lookup unexpectedly found a profile before insert');
      assert(complete > insert, 'Profile insert response was not delayed for the race fixture');
      const profileLink = await visibleProfileLink(page);
      assert(await profileLink.isVisible(), 'Min Profil should be visible in the authenticated navigation');
      await assertVisibleLogout(page);
      await profileLink.click();
      await page.getByRole('heading', { name: 'Min profil' }).waitFor();
      await page.getByText('Navn:', { exact: true }).waitFor();
      assert.match(await page.getByText('Navn:', { exact: true }).locator('..').textContent(), /Browser Fixture/);
      assert.equal(await page.getByText('Laster profil...', { exact: true }).count(), 0);
    }, true);
  });

  await check('registration: delayed signup resolves with session', async () => {
    await withGuest('signup-delay', async (page) => {
      await fillRegistration(page);
      await page.getByRole('button', { name: 'Registrer deg' }).click();
      await page.getByRole('button', { name: 'Registrerer...' }).waitFor();
      await page.waitForURL((url) => url.pathname === '/', { timeout: 6000 });
      await page.getByRole('heading', { name: 'Velkommen til Ferieplassen!' }).waitFor();
    });
  });

  await check('registration: signup error keeps fields and reports failure', async () => {
    await withGuest('signup-failure', async (page) => {
      await fillRegistration(page);
      await page.getByRole('button', { name: 'Registrer deg' }).click();
      await page.getByRole('alert').filter({ hasText: /Fixture signup failed/ }).waitFor();
      assert.equal(await page.getByLabel('Fornavn').inputValue(), 'Browser');
      assert.equal(writes.filter((entry) => entry.path.endsWith('/profiles')).length, 0);
    });
  });

  await check('registration: profile insert error is visible and does not retry signup', async () => {
    await withGuest('profile-failure', async (page) => {
      await fillRegistration(page);
      await page.getByRole('button', { name: 'Registrer deg' }).click();
      await page.getByRole('alert').filter({ hasText: /Fixture profile insert failed/ }).waitFor();
      assert.equal(await page.getByLabel('Fornavn').inputValue(), 'Browser');
    });
    assert.equal(writes.filter((entry) => entry.path.endsWith('/signup')).length, 1);
  });

  await check('registration: missing session reports email confirmation without false login', async () => {
    await withGuest('no-session', async (page) => {
      await fillRegistration(page);
      await page.getByRole('button', { name: 'Registrer deg' }).click();
      await page.getByText(/Bekreft e-postadressen via lenken/).waitFor();
      assert.equal(await page.getByRole('link', { name: 'Min Profil', exact: true }).count(), 0);
      assert.equal(await page.getByText('Logg ut', { exact: true }).count(), 0);
      assert.equal(writes.filter((entry) => entry.path.endsWith('/profiles')).length, 0);
    });
  });
}

function contrastRatio(foreground, background) {
  const channels = (color) => color.match(/[\d.]+/g).slice(0, 3).map(Number).map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = (color) => {
    const [red, green, blue] = channels(color);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function reviewForm(page) {
  const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Send vurdering' }) }).first();
  await form.waitFor();
  return form;
}

async function reviewKeyboardChecks(page) {
  await check('review form: contrast, keyboard selection and announced validation error', async () => {
    await open(page, '/min-profil', null);
    const form = await reviewForm(page);
    const stars = form.locator('[role="radiogroup"]');
    const radios = stars.getByRole('radio');
    const submit = form.getByRole('button', { name: 'Send vurdering' });
    const initialColors = await form.locator('[role="radiogroup"] span[aria-hidden="true"]').evaluateAll((nodes) => {
      const backgroundFor = (node) => {
        for (let parent = node.parentElement; parent; parent = parent.parentElement) {
          const color = getComputedStyle(parent).backgroundColor;
          if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') return color;
        }
        return 'rgb(255, 255, 255)';
      };
      return nodes.map((node) => ({
        className: node.className,
        color: getComputedStyle(node).color,
        background: backgroundFor(node),
      }));
    });
    const unselected = initialColors.find((star) => !star.className.includes('active'));
    assert(unselected, 'Review control must visibly render an unselected star state');
    assert(contrastRatio(unselected.color, unselected.background) >= 3,
      `Unselected star contrast is below 3:1 (${contrastRatio(unselected.color, unselected.background).toFixed(2)}:1)`);
    await submit.click();
    const error = form.getByRole('alert');
    await error.waitFor();
    assert.match(await error.textContent(), /velge en vurdering/i);
    const errorId = await error.getAttribute('id');
    const describedBy = [
      await stars.getAttribute('aria-describedby'),
      await radios.first().getAttribute('aria-describedby'),
    ].filter(Boolean).join(' ').split(/\s+/);
    assert(errorId && describedBy.includes(errorId),
      'Validation error must have an id referenced by the rating control');
    await radios.first().focus();
    await page.keyboard.press('ArrowRight');
    const secondRadio = radios.nth(1);
    assert(await secondRadio.evaluate((node) => node.checked),
      'ArrowRight should select the next native radio rating');
    const selectedStar = secondRadio.locator('+ span');
    const selected = await selectedStar.evaluate((node) => ({
      className: node.className,
      color: getComputedStyle(node).color,
      outlineColor: getComputedStyle(node).outlineColor,
      outlineWidth: getComputedStyle(node).outlineWidth,
      background: (() => {
        for (let parent = node.parentElement; parent; parent = parent.parentElement) {
          const color = getComputedStyle(parent).backgroundColor;
          if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') return color;
        }
        return 'rgb(255, 255, 255)';
      })(),
    }));
    assert(selected.className.includes('selected'),
      'Selected rating needs a non-color graphical indicator');
    assert(contrastRatio(selected.color, selected.background) >= 3,
      `Selected star contrast is below 3:1 (${contrastRatio(selected.color, selected.background).toFixed(2)}:1)`);
    assert(Number.parseFloat(selected.outlineWidth) >= 2,
      'Keyboard focus on the selected star must remain visibly outlined');
    assert(contrastRatio(selected.outlineColor, selected.background) >= 3,
      'Selected star focus outline contrast must be at least 3:1');
    assert.equal(await secondRadio.getAttribute('aria-label'), '2 stjerner');
  });
}

async function reviewAxeChecks(page) {
  await check('review form: axe WCAG scan in normal and validation-error states', async () => {
    await open(page, '/min-profil', null);
    const form = await reviewForm(page);
    await page.addScriptTag({ path: axePath });
    const scanForm = async (state) => {
      const result = await page.evaluate(async (formElement) => window.axe.run(formElement, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      }), await form.elementHandle());
      assert.deepEqual(result.violations.map(({ id, impact, help }) => ({ id, impact, help })), [],
        `axe violations in review form (${state})`);
    };
    await scanForm('normal');
    await form.getByRole('button', { name: 'Send vurdering' }).click();
    await form.getByRole('alert').waitFor();
    await scanForm('validation error');
  });
}

async function keyboardChecks(page) {
  await check('keyboard: facility checkbox, tooltip Escape, review radios and booking date names', async () => {
    await open(page, '/til-leie', 'Til leie');
    for (const label of ['Søk etter feriebolig', 'Fra', 'Til', 'Innsjekk', 'Utsjekk']) {
      assert(await page.getByLabel(label, { exact: true }).count() > 0,
        `Missing associated rental filter label: ${label}`);
    }
    const wifi = page.getByLabel('WiFi');
    await wifi.focus();
    await page.keyboard.press('Space');
    assert(await wifi.isChecked(), 'Space did not toggle the WiFi checkbox');
    const helpButton = page.getByRole('button', { name: 'Hjelpetekst' }).first();
    await helpButton.focus();
    const help = page.getByRole('tooltip').first();
    await help.waitFor();
    assert(await help.isVisible(), 'Tooltip did not open on keyboard focus');
    await page.keyboard.press('Escape');
    assert(!(await help.isVisible()), 'Escape did not close the tooltip');
    await open(page, '/min-profil', 'Min profil');
    const ratingGroup = page.getByRole('radiogroup', { name: 'Stjerner:' });
    await ratingGroup.waitFor();
    await ratingGroup.getByRole('radio', { name: '1 stjerne' }).focus();
    await page.keyboard.press('ArrowRight');
    assert(await ratingGroup.getByRole('radio', { name: '2 stjerner' }).isChecked(),
      'Arrow keys did not choose the review rating');
    assert.equal(await page.getByLabel('Kommentar (valgfritt):').count(), 1);
    await open(page, '/admin', 'Adminpanel');
    for (const label of ['Kode-navn *', 'Varighet (måneder gratis) *', 'Gyldig til dato *', 'Beskrivelse (valgfritt)']) {
      assert(await page.getByLabel(label, { exact: true }).count() > 0,
        `Missing associated discount-code label: ${label}`);
    }
    await open(page, `/hytte/${cabins[0].id}`, cabins[0].title);
    await page.getByRole('button', { name: 'Send forespørsel' }).first().click();
    const fromDate = page.getByRole('textbox', { name: 'Fra dato' });
    const toDate = page.getByRole('textbox', { name: 'Til dato' });
    await fromDate.waitFor();
    await toDate.waitFor();
    assert(await fromDate.isVisible() && await toDate.isVisible(),
      'Booking date fields are missing their accessible names');
  });
  await reviewKeyboardChecks(page);
}

async function axeChecks(page) {
  await check('axe: registration and listing pages have no WCAG A/AA violations', async () => {
    for (const [path, heading] of [['/register', 'Opprett konto'], ['/til-leie', 'Til leie']]) {
      await open(page, path, heading);
      await page.addScriptTag({ path: axePath });
      const result = await page.evaluate(async () => window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      }));
      const violations = result.violations.map(({ id, impact, help, nodes }) => ({
        id, impact, help, elements: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
      }));
      assert.deepEqual(violations, [], `axe violations on ${path}: ${JSON.stringify(violations)}`);
    }
  });
  await reviewAxeChecks(page);
}

async function cabinStateChecks(width) {
  await check('cabin: unknown and failed cabin lookups finish with explicit states', async () => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
    const scenario = { mode: 'cabin-failure', failCabins: false, user, session, profileRows: [], events: [] };
    try {
      await installIsolation(context, scenario);
      await context.addInitScript(({ key, fixture }) => {
        localStorage.setItem(key, JSON.stringify(fixture));
      }, { key: `sb-${project}-auth-token`, fixture: session });
      const page = await context.newPage();
      page.setDefaultTimeout(2500);
      page.setDefaultNavigationTimeout(6000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await open(page, '/hytte/99999999-9999-4999-8999-999999999999', null);
      await page.getByRole('heading', { name: 'Feriebolig ikke funnet' }).waitFor();
      assert.equal(await page.getByText('Laster ferieboliginfo...', { exact: true }).count(), 0);
      scenario.failCabins = true;
      await open(page, `/hytte/${cabins[0].id}`, null);
      await page.getByRole('heading', { name: 'Kunne ikke vise ferieboligen' }).waitFor();
      await page.getByRole('alert').filter({ hasText: /Kunne ikke hente ferieboligen/ }).waitFor();
      assert.equal(await page.getByText('Laster ferieboliginfo...', { exact: true }).count(), 0);
      assert.deepEqual(errors, [], 'Uncaught cabin browser exceptions');
    } finally {
      await context.close();
    }
  });
}

async function waitForQueryResponses(page, identity, expectedKinds = PROFILE_QUERY_KINDS) {
  return new Promise((resolve, reject) => {
    const seen = new Set();
    const timeout = setTimeout(() => {
      page.off('response', listener);
      const missing = expectedKinds.filter((kind) => !seen.has(kind));
      reject(new Error(`Timed out waiting for ${identity} response kinds: missing=${missing.join(', ')} seen=${[...seen].join(', ')}`));
    }, 8000);
    const listener = (responseEvent) => {
      let queryIdentity;
      let kind;
      try {
        const url = new URL(responseEvent.url());
        queryIdentity = profileQueryIdentity(url);
        kind = profileQueryKind(url);
      } catch {
        return;
      }
      if (queryIdentity !== identity || !expectedKinds.includes(kind)) return;
      seen.add(kind);
      if (expectedKinds.every((expected) => seen.has(expected))) {
        clearTimeout(timeout);
        page.off('response', listener);
        resolve();
      }
    };
    page.on('response', listener);
  });
}

async function identityRaceChecks(page) {
  await check('profile identity race: late A responses cannot overwrite B; logout invalidates pending data', async () => {
    for (const identity of [userId, secondUserId]) {
      heldCounts.delete(identity);
      heldQueryKinds.delete(identity);
      heldQueryUrls.delete(identity);
      heldQueryObservations.delete(identity);
      heldQueries.delete(identity);
    }
    heldIdentities.add(userId);
    await open(page, '/min-profil', null);
    const documentStart = await page.evaluate(() => performance.timeOrigin);
    await waitForHeldQueries(userId);
    await page.getByText(/Test Browser/).waitFor();
    await clickLogout(page);
    const loginLink = await ensureMobileMenuItem(page, 'Logg inn');
    await loginLink.waitFor();
    await loginLink.click();
    await page.locator('input[type=email]').fill(secondUser.email);
    await page.locator('input[type=password]').fill('SafeFixture123');
    await page.getByRole('button', { name: 'Logg inn', exact: true }).click();
    await page.getByRole('heading', { name: 'Velkommen til Ferieplassen!', exact: true }).waitFor();
    const profileLink = await ensureMobileMenuItem(page, 'Min Profil');
    await profileLink.click();
    await page.getByText(/B Fixture/).waitFor();
    await page.getByText('B tidligere opphold', { exact: true }).waitFor();
    await page.getByText(/B sin innkommende omtale/).waitFor();
    assert((await page.locator('img[alt="Profilbilde"]').getAttribute('src')).includes('b-profile.jpg'),
      'B profile avatar did not render before A requests were released');
    assert.equal(await page.getByText('A tidligere opphold', { exact: true }).count(), 0);
    const lateAResponses = waitForQueryResponses(page, userId);
    releaseQueries(userId);
    await lateAResponses;
    await page.getByText(/B Fixture/).waitFor();
    assert((await page.locator('img[alt="Profilbilde"]').getAttribute('src')).includes('b-profile.jpg'));
    await page.getByText('B tidligere opphold', { exact: true }).waitFor();
    await page.getByText(/B sin innkommende omtale/).waitFor();
    assert.equal(await page.getByText('A tidligere opphold', { exact: true }).count(), 0);
    assert.equal(await page.getByText(/A sin innkommende omtale/).count(), 0);
    await page.locator('a[href="/"]').first().click();
    heldIdentities.add(secondUserId);
    const pendingProfileLink = await ensureMobileMenuItem(page, 'Min Profil');
    await pendingProfileLink.click();
    await waitForHeldQueries(secondUserId);
    const pendingBResponses = waitForQueryResponses(page, secondUserId);
    await clickLogout(page);
    await ensureMobileMenuItem(page, 'Logg inn');
    releaseQueries(secondUserId);
    await pendingBResponses;
    assert.equal(await page.getByText(/B Fixture/).count(), 0,
      'A late response repopulated profile content after logout');
    assert.equal(await page.getByRole('link', { name: 'Min Profil' }).count(), 0,
      'Profile navigation remained visible after logout');
    assert.equal(await page.evaluate(() => performance.timeOrigin), documentStart,
      'Identity changes must stay in the same mounted document');
  });
}

async function refreshPreservationChecks(page) {
  await check('token refresh: filled review form survives a newly observed same-user refresh', async () => {
    await page.clock.install();
    await open(page, '/min-profil', null);
    const form = await reviewForm(page);
    const comment = form.locator('textarea');
    await comment.fill('Tekst skal bevares gjennom tokenfornyelse');
    const ratingFour = form.getByRole('radio', { name: '4 stjerner' });
    await form.getByRole('radio', { name: '1 stjerne' }).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    assert(await ratingFour.evaluate((node) => node.checked),
      'Keyboard interaction did not select the fourth rating');
    const refreshCount = () => writes.filter((entry) => entry.path.endsWith('/token') && entry.grantType === 'refresh_token').length;
    const beforeFill = refreshCount();
    assert.equal(beforeFill, 0, 'An initialization refresh cannot count as the test refresh');
    assert.equal(await comment.inputValue(), 'Tekst skal bevares gjennom tokenfornyelse');
    assert(await ratingFour.evaluate((node) => node.checked));
    const authStorageKey = `sb-${project}-auth-token`;
    const refreshResponsePromise = page.waitForResponse((responseEvent) => {
      const url = new URL(responseEvent.url());
      return url.pathname.endsWith('/token') && url.searchParams.get('grant_type') === 'refresh_token';
    }, { timeout: 10000 });
    await page.clock.fastForward(90000);
    const refreshResponse = await refreshResponsePromise;
    assert.equal(refreshResponse.status(), 200, 'The new refresh grant did not succeed');
    const refreshedSession = await refreshResponse.json();
    assert.equal(refreshedSession.user.id, userId, 'The refresh response changed user identity');
    let storedSession;
    const authStateDeadline = Date.now() + 8000;
    while (Date.now() < authStateDeadline) {
      storedSession = await page.evaluate((key) => {
        const stored = JSON.parse(localStorage.getItem(key) || 'null');
        return stored?.currentSession || stored;
      }, authStorageKey);
      if (storedSession?.access_token === refreshedSession.access_token
        && storedSession?.user?.id === userId) break;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assert.equal(storedSession?.access_token, refreshedSession.access_token,
      'The refreshed token was not persisted after the response completed');
    assert.equal(storedSession?.user?.id, userId, 'The persisted auth state changed identity after refresh');
    await new Promise((resolve) => setTimeout(resolve, 25));
    assert.equal(refreshCount(), beforeFill + 1,
      'Exactly one new refresh grant should finish after filling the form');
    assert.equal(page.url(), new URL('/min-profil', base).href);
    assert.equal(await comment.inputValue(), 'Tekst skal bevares gjennom tokenfornyelse');
    assert(await ratingFour.evaluate((node) => node.checked),
      'Selected rating was cleared by same-user TOKEN_REFRESHED');
  });
}

async function staleProfileLogoutCheck(width) {
  await check('auth logout: delayed stale profile response cannot restore old admin', async () => {
    const switchUser = {
      ...user, id: '55555555-5555-4555-8555-555555555555',
      email: 'switch.fixture@example.invalid',
    };
    const switchProfile = {
      id: switchUser.id, name: 'Alt', last_name: 'User', email: switchUser.email,
      role: 'bruker', avatar_url: null, region: 'Bergen',
    };
    const scenario = {
      mode: 'profile-read-delay', user, session, profileRows: [switchProfile], events: [],
      oldProfileReleases: [], switchUser, switchSession: { ...session, user: switchUser },
    };
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
    try {
      await installIsolation(context, scenario);
      await context.addInitScript(({ key, fixture }) => {
        if (!sessionStorage.getItem('fixture-auth-seeded')) {
          localStorage.setItem(key, JSON.stringify(fixture));
          sessionStorage.setItem('fixture-auth-seeded', 'true');
        }
      }, { key: `sb-${project}-auth-token`, fixture: session });
      const page = await context.newPage();
      page.setDefaultTimeout(2500);
      page.setDefaultNavigationTimeout(6000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(base.href, { waitUntil: 'domcontentloaded', timeout: 6000 });
      await assertVisibleLogout(page);
      const readDeadline = Date.now() + 1800;
      while (!scenario.profileReadsStarted && Date.now() < readDeadline) await page.waitForTimeout(20);
      assert(scenario.profileReadsStarted > 0, 'No profile lookup was pending before logout');
      await page.getByText('Logg ut', { exact: true }).evaluateAll((nodes) =>
        nodes.find((node) => node.getClientRects().length > 0)?.click());
      await page.waitForFunction(() => ![...document.querySelectorAll('button, a')]
        .some((node) => node.getClientRects().length > 0 && node.textContent?.trim() === 'Logg ut'),
      null, { timeout: 2500 });
      const loginLink = await ensureMobileMenuItem(page, 'Logg inn');
      await loginLink.click();
      await page.waitForURL((url) => url.pathname === '/login', { timeout: 4000 });
      await page.getByLabel('E-postadresse').fill(switchUser.email);
      await page.getByLabel('Passord').fill('SafeFixture123');
      await page.getByRole('button', { name: 'Logg inn', exact: true }).click();
      await page.waitForURL((url) => url.pathname === '/', { timeout: 6000 });
      await page.locator('button').filter({ hasText: 'Logg ut' }).first().waitFor({ state: 'attached' });
      await assertVisibleLogout(page);
      const storedIdentity = await page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) || 'null');
        return value?.user?.id || value?.currentSession?.user?.id || null;
      }, `sb-${project}-auth-token`);
      const authUiState = await page.evaluate(() => ({
        logoutVisible: [...document.querySelectorAll('button, a')]
          .some((node) => node.getClientRects().length > 0 && node.textContent?.trim() === 'Logg ut'),
        visibleProfileInitials: [...document.querySelectorAll('a[aria-label^="Min profil"]')]
          .filter((node) => node.getClientRects().length > 0)
          .map((node) => node.textContent?.trim()),
      }));
      const authTrace = () => JSON.stringify({
        url: page.url(), storedIdentity, authUiState, scenarioEvents: scenario.events,
      });
      assert(scenario.events.some((event) => event.type === 'auth-token'
        && event.grantType === 'password' && event.userId === switchUser.id),
      `Password token response did not identify the expected new user: ${authTrace()}`);
      assert.equal(storedIdentity, switchUser.id, `Persisted auth session is not the expected new user: ${authTrace()}`);
      assert(authUiState.logoutVisible, `AuthProvider UI did not apply the sign-in state: ${authTrace()}`);
      assert(authUiState.visibleProfileInitials.some((initials) => ['S', 'AU'].includes(initials)),
        `AuthProvider UI does not reflect the expected new user: ${authTrace()}`);
      const newStartDeadline = Date.now() + 2500;
      while (!scenario.events.some((event) => event.type === 'profile-read-started' && event.userId === switchUser.id)
        && Date.now() < newStartDeadline) await page.waitForTimeout(20);
      assert(scenario.events.some((event) => event.type === 'profile-read-started' && event.userId === switchUser.id),
        `New-user profile lookup did not start after successful new-user auth: ${authTrace()}`);
      const newReadDeadline = Date.now() + 2500;
      while (!scenario.events.some((event) => event.type === 'profile-read-complete' && event.userId === switchUser.id)
        && Date.now() < newReadDeadline) await page.waitForTimeout(20);
      assert(scenario.events.some((event) => event.type === 'profile-read-complete' && event.userId === switchUser.id),
        'New-user profile lookup did not finish');
      assert(!scenario.events.some((event) => event.type === 'profile-read-complete' && event.userId === user.id),
        'Previous-user profile response was not stale/pending when new-user profile loaded');
      assert.equal(await page.getByRole('link', { name: 'Admin', exact: true }).count(), 0,
        'New-user profile did not keep admin access revoked');
      for (const release of scenario.oldProfileReleases.splice(0)) release();
      const staleReadDeadline = Date.now() + 2500;
      while (!scenario.events.some((event) => event.type === 'profile-read-complete' && event.userId === user.id)
        && Date.now() < staleReadDeadline) await page.waitForTimeout(20);
      assert(scenario.events.some((event) => event.type === 'profile-read-complete' && event.userId === user.id),
        'Delayed old-user profile response did not finish');
      await page.waitForTimeout(80);
      assert.equal(await page.getByRole('link', { name: 'Admin', exact: true }).count(), 0,
        'Stale previous-user profile restored admin access');
      const profileLink = await visibleProfileLink(page);
      await profileLink.click();
      await page.getByRole('heading', { name: 'Min profil' }).waitFor();
      await page.getByText('Navn:', { exact: true }).waitFor();
      assert.match(await page.getByText('Navn:', { exact: true }).locator('..').textContent(), /Alt User/);
      assert.doesNotMatch(await page.getByText('Navn:', { exact: true }).locator('..').textContent(), /Test Browser/);
      assert.deepEqual(errors, [], 'Uncaught user-switch browser exceptions');
    } finally {
      for (const release of scenario.oldProfileReleases.splice(0)) release();
      releaseAllQueries();
      await context.close();
    }
  });
}

async function waitForHeldIdentityQueries(scenario) {
  const expected = new Set(PROFILE_QUERY_KINDS);
  const deadline = Date.now() + 5000;
  while ([...expected].some((kind) => !scenario.startedA.has(kind)) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.deepEqual([...scenario.startedA.keys()].sort(), [...expected].sort(),
    'All four A profile-data requests should be pending before the identity changes');
}

async function mountedIdentityRaceCheck(page, scenario) {
  await check('same-mounted profile: late A data cannot overwrite B after an in-place auth change', async () => {
    await open(page, '/min-profil', null);
    await page.getByText(/Test Browser/).waitFor();
    const markerInstalled = await page.evaluate(() => {
      const findCoordinator = () => {
        for (const element of document.querySelectorAll('body *')) {
          const fiberKey = Object.keys(element).find((key) => key.startsWith('__reactFiber$'));
          let fiber = fiberKey ? element[fiberKey] : null;
          while (fiber) {
            if (fiber.type?.name === 'ProfileData') {
              for (let hook = fiber.memoizedState; hook; hook = hook.next) {
                const value = hook.memoizedState?.current;
                if (value && typeof value.setIdentity === 'function' && typeof value.begin === 'function') return value;
              }
            }
            fiber = fiber.return;
          }
        }
        return null;
      };
      const coordinator = findCoordinator();
      if (!coordinator) return false;
      window.__profileCoordinatorBeforeIdentityChange = coordinator;
      return true;
    });
    assert(markerInstalled, 'Could not observe ProfileData local coordinator before identity change');
    await waitForHeldIdentityQueries(scenario);

    const urlBeforeIdentityChange = page.url();
    const identityChange = await page.evaluate(async ({ email, password }) => {
      const { default: supabase } = await import('/src/lib/supabaseClient.js');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(`Mocked in-place sign-in failed: ${error.message}`);
      return data.user?.id;
    }, { email: secondUser.email, password: 'SafeFixture123' });
    assert.equal(identityChange, secondUserId, 'The browser auth call did not return identity B');
    assert.equal(page.url(), urlBeforeIdentityChange, 'Identity change navigated away from the mounted profile');
    await page.getByText(/B Fixture/).waitFor();
    await page.getByText('B tidligere opphold', { exact: true }).waitFor();
    await page.getByText(/B innkommende omtale/).waitFor();
    assert((await page.getByRole('img', { name: 'Profilbilde' }).getAttribute('src')).includes('b-profile.jpg'),
      'B avatar did not render while A requests were still pending');
    assert.equal(await page.getByText('A tidligere opphold', { exact: true }).count(), 0);
    const bReviewForm = page.locator('form').filter({ has: page.getByRole('button', { name: 'Send vurdering', exact: true }) });
    await bReviewForm.waitFor();
    const reviewComment = bReviewForm.locator('textarea');
    await reviewComment.fill('B sin lokale skjematilstand skal overleve A-svar');

    const markerStillPresent = await page.evaluate(() => {
      let coordinator = null;
      for (const element of document.querySelectorAll('body *')) {
        const fiberKey = Object.keys(element).find((key) => key.startsWith('__reactFiber$'));
        let fiber = fiberKey ? element[fiberKey] : null;
        while (fiber) {
          if (fiber.type?.name === 'ProfileData') {
            for (let hook = fiber.memoizedState; hook; hook = hook.next) {
              const value = hook.memoizedState?.current;
              if (value && typeof value.setIdentity === 'function' && typeof value.begin === 'function') {
                coordinator = value;
                break;
              }
            }
          }
          if (coordinator) break;
          fiber = fiber.return;
        }
        if (coordinator) break;
      }
      return Boolean(coordinator && coordinator === window.__profileCoordinatorBeforeIdentityChange);
    });
    assert(markerStillPresent, 'ProfileData local-state marker changed during the A→B transition');

    const lateAResponses = new Promise((resolve, reject) => {
      const received = new Map();
      const timeout = setTimeout(() => {
        page.off('response', onResponse);
        reject(new Error(`Timed out waiting for delayed A responses: ${JSON.stringify([...received])}`));
      }, 8000);
      const onResponse = (responseEvent) => {
        const responseUrl = new URL(responseEvent.url());
        const kind = profileQueryKind(responseUrl);
        if (kind && profileQueryIdentity(responseUrl, kind) === userId) {
          received.set(kind, (received.get(kind) || 0) + 1);
        }
        if ([...scenario.startedA].every(([expectedKind, count]) => received.get(expectedKind) === count)) {
          clearTimeout(timeout);
          page.off('response', onResponse);
          resolve();
        }
      };
      page.on('response', onResponse);
    });
    for (const release of [...scenario.releases]) release();
    await lateAResponses;
    await page.waitForTimeout(100);

    assert.deepEqual([...scenario.completedA].sort(), [...scenario.startedA].sort(),
      'Each delayed A response must complete before the final assertions');
    await page.getByText(/B Fixture/).waitFor();
    await page.getByText('B tidligere opphold', { exact: true }).waitFor();
    await page.getByText(/B innkommende omtale/).waitFor();
    assert((await page.getByRole('img', { name: 'Profilbilde' }).getAttribute('src')).includes('b-profile.jpg'),
      'A avatar response replaced B avatar');
    assert.equal(await page.getByText('A tidligere opphold', { exact: true }).count(), 0,
      'A past stay replaced B past stays');
    assert.equal(await page.getByText(/A innkommende omtale/).count(), 0,
      'A incoming review replaced B incoming reviews');
    assert.equal(await reviewComment.inputValue(), 'B sin lokale skjematilstand skal overleve A-svar',
      'Late A review data replaced the B review form or its local state');
    assert.deepEqual([...scenario.startedA.keys()].sort(), [...PROFILE_QUERY_KINDS].sort());
  });
}

async function mountedIdentityRaceChecks(width) {
  await check('same-mounted profile identity race: stale A responses preserve B', async () => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
    const scenario = identityScenario();
    try {
      await installIsolation(context, scenario);
      await context.addInitScript(({ key, fixture }) => {
        localStorage.setItem(key, JSON.stringify(fixture));
      }, { key: `sb-${project}-auth-token`, fixture: session });
      const page = await context.newPage();
      page.setDefaultTimeout(2500);
      page.setDefaultNavigationTimeout(6000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await mountedIdentityRaceCheck(page, scenario);
      assert.deepEqual(errors, [], 'Uncaught same-mounted identity browser exceptions');
    } finally {
      for (const release of [...scenario.releases]) release();
      await context.close();
    }
  });
}

async function authLifecycleChecks(width) {
  await staleProfileLogoutCheck(width);
}

const group = process.argv[2];
const width = Number(process.argv[3] || 1280);
const groups = ['routes', 'listings', 'carousel', 'registration', 'booking', 'demo', 'auth', 'keyboard', 'axe', 'cabin', 'identity', 'refresh'];
assert(groups.includes(group), `Choose group: ${groups.join(', ')}`);
assert([320, 768, 1280].includes(width), 'Choose width 320, 768 or 1280');

async function main() {
  browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
    headless: true,
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
  try {
    await installIsolation(context);
    if (group !== 'auth') await context.addInitScript(({ key, fixture }) => {
      localStorage.setItem(key, JSON.stringify(fixture));
    }, { key: `sb-${project}-auth-token`, fixture: group === 'refresh' ? refreshSession : session });
    const page = await context.newPage();
    page.setDefaultTimeout(2500);
    page.setDefaultNavigationTimeout(6000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    if (group === 'routes') {
      await check(`${width}px routes and reflow`, async () => {
        for (const [path, heading] of [
          ['/', 'Velkommen til Ferieplassen!'], ['/til-leie', 'Til leie'],
          ['/popular', 'Populære feriebolig'], ['/nye-hytter', 'Nye feriebolig'],
          ['/om-oss', null], ['/personvern', null], ['/salgsbetingelser', null],
          ['/login', null], ['/register', null], ['/kontakt', null],
          ['/min-profil', null], ['/ny-hytte', null], ['/admin', null],
          ['/not-a-route', null], ['/vipps/callback?error=fixture', 'Noe gikk galt hos Vipps'],
          ['/demo-payment?subscriptionId=fixture&cabinId=fixture', null],
          [`/hytte/${cabins[0].id}`, cabins[0].title],
        ]) await open(page, path, heading);
        await page.locator('.leaflet-container').waitFor();
        const mapHeight = await page.locator('.leaflet-container').first().evaluate((node) => parseFloat(getComputedStyle(node).height));
        assert(mapHeight >= 250, `Leaflet map CSS missing (${mapHeight}px)`);
      });
    }
    if (group === 'listings') await listingChecks(page);
    if (group === 'carousel') await carouselChecks(width);
    if (group === 'registration') await registrationChecks(width);
    if (group === 'booking' || group === 'demo') {
      // Select one mutating flow at a time, keeping each isolated run bounded.
      await writeFlowChecks(page, group);
    }
    if (group === 'auth') {
      await check('guest restrictions and mocked sign-in', async () => {
        for (const path of ['/admin', '/kontakt']) {
          await page.goto(new URL(path, base).href, { timeout: 6000 });
          await page.waitForURL(base.href, { timeout: 4000 });
        }
        await open(page, '/login', null);
        await page.locator('input[type=email]').fill(user.email);
        await page.locator('input[type=password]').fill('SafeFixture123');
        await page.getByRole('button', { name: 'Logg inn', exact: true }).click();
        await page.waitForURL(base.href, { timeout: 4000 });
        assert(writes.some((entry) => entry.path.endsWith('/token')));
        await open(page, '/min-profil', 'Min profil');
        if (process.env.VISUAL_REFERENCE_DIR) {
          await page.screenshot({ path: `${process.env.VISUAL_REFERENCE_DIR}/profile-${width}.png`, fullPage: true });
        }
      });
      await authLifecycleChecks(width);
    }
    if (group === 'identity') {
      await identityRaceChecks(page);
      await mountedIdentityRaceChecks(width);
      await staleProfileLogoutCheck(width);
    }
    if (group === 'refresh') await refreshPreservationChecks(page);
    if (group === 'cabin') await cabinStateChecks(width);
    if (group === 'keyboard') await keyboardChecks(page);
    if (group === 'axe') await axeChecks(page);
    assert.deepEqual(errors, [], 'Uncaught browser exceptions');
    assert.equal(blocked.filter((item) => item.includes('same-origin') || item.startsWith('Unmocked')).length, 0,
      `Unexpected requests: ${blocked.join('; ')}`);
    console.log(`PASS ${group} ${width}px (all external writes intercepted)`);
  } finally {
    releaseAllQueries();
    await context.close();
  }
}

const watchdog = setTimeout(() => {
  console.error(`FAIL ${group} exceeded 55 seconds`);
  void browser?.close();
}, 55000);
watchdog.unref();

try {
  await main();
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally {
  clearTimeout(watchdog);
  await browser?.close();
}