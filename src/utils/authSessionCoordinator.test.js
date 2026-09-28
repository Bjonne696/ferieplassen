import test from "node:test";
import assert from "node:assert/strict";
import {
  canAcceptSessionResult,
  createAuthSessionCoordinator,
  shouldResolveInitialGuest,
} from "./authSessionCoordinator.js";

test("same-user auth refresh leaves an in-flight profile lookup current", () => {
  const coordinator = createAuthSessionCoordinator();
  coordinator.setIdentity("user-a");
  const request = coordinator.currentRevision();

  const refresh = coordinator.setIdentity("user-a");

  assert.equal(refresh.changed, false);
  assert.equal(coordinator.isCurrent(request, "user-a"), true);
});

test("a newer profile sync and a user switch reject stale profile responses", () => {
  const coordinator = createAuthSessionCoordinator();
  coordinator.setIdentity("user-a");
  const initialLookup = coordinator.currentRevision();
  const profileSync = coordinator.beginRequest();

  assert.equal(coordinator.isCurrent(initialLookup, "user-a"), false);
  assert.equal(coordinator.isCurrent(profileSync, "user-a"), true);

  coordinator.setIdentity("user-b");
  assert.equal(coordinator.isCurrent(profileSync, "user-a"), false);
  assert.equal(coordinator.isCurrent(profileSync, "user-b"), false);
});

test("logout invalidates the prior identity and request", () => {
  const coordinator = createAuthSessionCoordinator();
  coordinator.setIdentity("user-a");
  const request = coordinator.currentRevision();

  coordinator.setIdentity(null);

  assert.equal(coordinator.isCurrent(request, "user-a"), false);
  assert.equal(coordinator.getIdentity(), null);
});

test("a stale getSession result cannot restore an identity after switch or logout", () => {
  const coordinator = createAuthSessionCoordinator();
  coordinator.setIdentity("user-a");
  const request = coordinator.currentRevision();

  coordinator.setIdentity("user-b");
  assert.equal(canAcceptSessionResult(coordinator, request, true, "user-a"), false);

  const switchedRequest = coordinator.currentRevision();
  coordinator.setIdentity(null);
  assert.equal(canAcceptSessionResult(coordinator, switchedRequest, true, "user-b"), false);
});

test("same-user token refresh remains valid during session reconciliation", () => {
  const coordinator = createAuthSessionCoordinator();
  coordinator.setIdentity("user-a");
  const request = coordinator.currentRevision();

  assert.equal(canAcceptSessionResult(coordinator, request, true, "user-a"), true);
});

test("an initial null auth event resolves guest loading exactly once", () => {
  const coordinator = createAuthSessionCoordinator();
  const initialGuest = coordinator.setIdentity(null);

  assert.equal(initialGuest.changed, false);
  assert.equal(shouldResolveInitialGuest(initialGuest, null), true);

  const laterNullEvent = coordinator.setIdentity(null);
  assert.equal(shouldResolveInitialGuest(laterNullEvent, null), false);
  assert.equal(shouldResolveInitialGuest(initialGuest, { id: "user-a" }), false);
});