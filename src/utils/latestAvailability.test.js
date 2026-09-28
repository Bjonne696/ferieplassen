import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers";
import { createLatestAvailabilityRequest, displayedCabins } from "./latestAvailability.js";

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test("keeps previously filtered cabins visible while a newer date request is pending", async () => {
  const old = deferred();
  const next = deferred();
  let displayed = null;
  const request = createLatestAvailabilityRequest(
    (key) => key === "old" ? old.promise : next.promise,
    (result) => { displayed = result; },
    (error) => { throw error; },
  );
  const allCabins = [{ id: 1 }, { id: 2 }];
  assert.equal(displayedCabins(displayed, allCabins), allCabins);
  const cancelOld = request("old");
  old.resolve([{ id: 1 }]);
  await settle();
  assert.deepEqual(displayedCabins(displayed, allCabins), [{ id: 1 }]);

  cancelOld();
  request("new");
  assert.deepEqual(displayedCabins(displayed, allCabins), [{ id: 1 }]);
  next.resolve([{ id: 2 }]);
  await settle();
  assert.deepEqual(displayedCabins(displayed, allCabins), [{ id: 2 }]);
});

test("late old responses never replace newer filter results", async () => {
  const old = deferred();
  const next = deferred();
  let displayed = ["previous"];
  const request = createLatestAvailabilityRequest(
    (key) => key === "old" ? old.promise : next.promise,
    (result) => { displayed = result; },
    (error) => { throw error; },
  );
  const cancelOld = request("old");
  await settle();
  cancelOld();
  request("new");
  await settle();
  next.resolve(["new"]);
  await settle();
  assert.deepEqual(displayed, ["new"]);
  old.resolve(["stale"]);
  await settle();
  assert.deepEqual(displayed, ["new"]);
});