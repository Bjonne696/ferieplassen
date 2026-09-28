import test from "node:test";
import assert from "node:assert/strict";
import { createCabinListing } from "../src/services/createCabinListing.js";

function mocks(subscriptionResult = { redirectUrl: "https://example.invalid/pay" }) {
  const calls = [];
  return {
    calls,
    uploadImages: async files => {
      calls.push(["upload", files]);
      return ["https://example.invalid/image"];
    },
    insertCabin: async cabin => {
      calls.push(["insert", cabin]);
      return { id: "saved-cabin" };
    },
    createSubscription: async (...args) => {
      calls.push(["subscription", args]);
      return subscriptionResult;
    },
  };
}

const input = {
  files: ["image"], cabin: { owner_id: "owner", price_per_night: 120000 },
  selectedPlan: "premium", discountCode: "SAVE",
};

test("uploads, inserts without forced is_active, then starts subscription using saved id", async () => {
  const operations = mocks();
  const result = await createCabinListing({ ...input, isAdmin: false, ...operations });
  assert.deepEqual(operations.calls.map(([name]) => name), ["upload", "insert", "subscription"]);
  assert.deepEqual(operations.calls[1][1], {
    owner_id: "owner", price_per_night: 120000,
    image_urls: ["https://example.invalid/image"],
  });
  assert.deepEqual(operations.calls[2][1], ["saved-cabin", "premium", "SAVE"]);
  assert.deepEqual(result, { kind: "redirect", url: "https://example.invalid/pay" });
});

test("admin skips subscription; free plan redirects without payment URL", async () => {
  const admin = mocks();
  assert.deepEqual(await createCabinListing({ ...input, isAdmin: true, ...admin }), { kind: "admin" });
  assert.deepEqual(admin.calls.map(([name]) => name), ["upload", "insert"]);

  const free = mocks({ free: true });
  assert.deepEqual(await createCabinListing({
    ...input, discountCode: "", isAdmin: false, ...free,
  }), { kind: "free" });
  assert.deepEqual(free.calls[2][1], ["saved-cabin", "premium", null]);
});

test("upload or insert failure prevents subscription, unexpected response is surfaced", async () => {
  for (const failedOperation of ["uploadImages", "insertCabin"]) {
    const operations = mocks();
    operations[failedOperation] = async () => { throw new Error("backend failure"); };
    await assert.rejects(
      createCabinListing({ ...input, isAdmin: false, ...operations }),
      /backend failure/,
    );
    assert.equal(operations.calls.some(([name]) => name === "subscription"), false);
  }
  const operations = mocks({});
  assert.deepEqual(await createCabinListing({
    ...input, isAdmin: false, ...operations,
  }), { kind: "unexpected" });
});