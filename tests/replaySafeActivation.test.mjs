import test from 'node:test';
import assert from 'node:assert/strict';
import { createReplaySafeActivation } from '../src/utils/createReplaySafeActivation.js';

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const flush = () => new Promise((resolve) => setImmediate(resolve));
const key = (user, subscription = 'sub-1', cabin = 'cabin-1') =>
  JSON.stringify([user, subscription, cabin]);

test('normal mocked activation is cached across effect replay and StrictMode cleanup', { timeout: 2000 }, async () => {
  const response = deferred();
  let posts = 0;
  const results = [];
  const activation = createReplaySafeActivation(async (_key, isActive) => {
    if (!isActive()) return { skipped: true };
    posts++;
    await response.promise;
    return { phase: 'demo_success' };
  });
  const stopFirst = activation.observe(key('alice'), (result) => results.push(`old:${result.phase}`));
  await flush();
  stopFirst();
  const stopSecond = activation.observe(key('alice'), (result) => results.push(result.phase));
  response.resolve();
  await flush();
  assert.equal(posts, 1);
  assert.deepEqual(results, ['demo_success']);
  stopSecond();
  const stopThird = activation.observe(key('alice'), (result) => results.push(result.phase));
  await flush();
  assert.equal(posts, 1);
  assert.deepEqual(results, ['demo_success', 'demo_success']);
  stopThird();
  activation.dispose();
});

test('missing session does not cache an error; sign-in retries on a later observation', { timeout: 2000 }, async () => {
  let session = null;
  let posts = 0;
  const results = [];
  const activation = createReplaySafeActivation(async (_key, isActive) => {
    if (!isActive()) return { skipped: true };
    if (!session) return { phase: 'demo_error', retryable: true, error: 'Sign in' };
    posts++;
    return { phase: 'demo_success' };
  });
  const stopMissing = activation.observe(key('alice'), (result) => results.push(result.phase));
  await flush();
  assert.equal(posts, 0);
  assert.deepEqual(results, ['demo_error']);
  stopMissing();
  session = { user: 'alice' };
  const stopRetried = activation.observe(key('alice'), (result) => results.push(result.phase));
  await flush();
  assert.equal(posts, 1);
  assert.deepEqual(results, ['demo_error', 'demo_success']);
  stopRetried();
  const stopSignedIn = activation.observe(key('alice'), (result) => results.push(result.phase));
  await flush();
  assert.equal(posts, 1);
  assert.deepEqual(results, ['demo_error', 'demo_success', 'demo_success']);
  stopSignedIn();
  activation.dispose();
});

test('rejected session lookup is retryable on a later observation, but POST failure is cached', { timeout: 2000 }, async () => {
  let sessionCalls = 0;
  let posts = 0;
  const results = [];
  const getSession = async () => {
    sessionCalls++;
    if (sessionCalls === 1) throw new Error('Session temporarily unavailable');
    return { access_token: 'mock-token' };
  };
  const activation = createReplaySafeActivation(async (_key, isActive) => {
    try {
      await getSession();
    } catch {
      if (!isActive()) return { skipped: true };
      return { phase: 'demo_error', retryable: true, error: 'Session lookup failed' };
    }
    if (!isActive()) return { skipped: true };
    posts++;
    return { phase: 'demo_error', error: 'Mock POST failed' };
  });
  const stopFirst = activation.observe(key('alice'), (result) => results.push(result.error));
  await flush();
  assert.equal(posts, 0);
  assert.deepEqual(results, ['Session lookup failed']);
  stopFirst();
  const stopSecond = activation.observe(key('alice'), (result) => results.push(result.error));
  await flush();
  assert.equal(sessionCalls, 2);
  assert.equal(posts, 1);
  stopSecond();
  const stopThird = activation.observe(key('alice'), (result) => results.push(result.error));
  await flush();
  assert.equal(sessionCalls, 2);
  assert.equal(posts, 1);
  assert.deepEqual(results, ['Session lookup failed', 'Mock POST failed', 'Mock POST failed']);
  stopThird();
  activation.dispose();
});

test('replay before session resolves resumes once without duplicating POST', { timeout: 2000 }, async () => {
  const session = deferred();
  let sessionCalls = 0;
  let posts = 0;
  const results = [];
  const activation = createReplaySafeActivation(async (_key, isActive) => {
    sessionCalls++;
    await session.promise;
    if (!isActive()) return { skipped: true };
    posts++;
    return { phase: 'demo_success' };
  });
  const stopFirst = activation.observe(key('alice'), () => results.push('old'));
  await flush();
  stopFirst();
  const stopSecond = activation.observe(key('alice'), (result) => results.push(result.phase));
  session.resolve();
  await flush();
  assert.equal(sessionCalls, 1);
  assert.equal(posts, 1);
  assert.deepEqual(results, ['demo_success']);
  stopSecond();
  activation.dispose();
});

test('changed user, subscription and cabin have separate requests; stale replies are ignored', { timeout: 2000 }, async () => {
  const replies = [];
  const posted = [];
  const results = [];
  const activation = createReplaySafeActivation(async (identity, isActive) => {
    if (!isActive()) return { skipped: true };
    posted.push(JSON.parse(identity));
    const reply = deferred();
    replies.push(reply);
    return reply.promise;
  });
  const identities = [
    key('alice'), key('bob'), key('bob', 'sub-2'), key('bob', 'sub-2', 'cabin-2'),
  ];
  let stop = () => {};
  for (const identity of identities) {
    stop();
    stop = activation.observe(identity, (result) => results.push(result.phase));
    await flush();
  }
  assert.deepEqual(posted, identities.map((identity) => JSON.parse(identity)));
  for (let i = 0; i < 3; i++) replies[i].resolve({ phase: `stale-${i}` });
  await flush();
  assert.deepEqual(results, []);
  replies[3].resolve({ phase: 'demo_success' });
  await flush();
  assert.deepEqual(results, ['demo_success']);
  stop();
  activation.dispose();
});

test('unmount before session or after POST prevents delivery and pre-session POST', { timeout: 2000 }, async () => {
  const session = deferred();
  let posts = 0;
  const results = [];
  const activation = createReplaySafeActivation(async (_key, isActive) => {
    await session.promise;
    if (!isActive()) return { skipped: true };
    posts++;
    return { phase: 'demo_success' };
  });
  const stop = activation.observe(key('alice'), (result) => results.push(result));
  await flush();
  stop();
  session.resolve();
  await flush();
  assert.equal(posts, 0);
  assert.deepEqual(results, []);
  activation.dispose();

  const response = deferred();
  const inFlight = createReplaySafeActivation(async () => {
    posts++;
    return response.promise;
  });
  const stopInFlight = inFlight.observe(key('alice'), (result) => results.push(result));
  await flush();
  stopInFlight();
  inFlight.dispose();
  response.resolve({ phase: 'demo_success' });
  await flush();
  assert.equal(posts, 1);
  assert.deepEqual(results, []);
});