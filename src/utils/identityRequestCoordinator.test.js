import test from "node:test";
import assert from "node:assert/strict";
import { createIdentityRequestCoordinator } from "./identityRequestCoordinator.js";

test("requests from a previous identity cannot commit after an account switch", () => {
  const coordinator = createIdentityRequestCoordinator();
  const committed = [];

  coordinator.setIdentity("user-a");
  const delayedARequest = coordinator.begin("user-a");
  coordinator.setIdentity("user-b");
  const fastBRequest = coordinator.begin("user-b");

  if (coordinator.isCurrent(fastBRequest)) committed.push("user-b");
  if (coordinator.isCurrent(delayedARequest)) committed.push("user-a");

  assert.deepEqual(committed, ["user-b"]);
});

test("logout invalidates outstanding requests without treating same-user refresh as a switch", () => {
  const coordinator = createIdentityRequestCoordinator();
  coordinator.setIdentity("user-a");
  const beforeRefresh = coordinator.begin("user-a");
  coordinator.setIdentity("user-a");
  assert.equal(coordinator.isCurrent(beforeRefresh), true);

  const beforeLogout = coordinator.begin("user-a");
  coordinator.setIdentity(null);
  assert.equal(coordinator.isCurrent(beforeLogout), false);
});