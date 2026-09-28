import test from "node:test";
import assert from "node:assert/strict";
import { ensureSignupProfile } from "./ensureSignupProfile.js";

const account = { id: "user-a", email: "a@example.test" };
const fields = {
  email: account.email,
  name: "New",
  last_name: "User",
  region: "Oslo",
};

test("profile recovery preserves an existing profile without updating its role or fields", async () => {
  const existingProfile = { id: account.id, name: "Original", role: "admin" };
  let insertCalls = 0;
  const result = await ensureSignupProfile(account, fields, {
    findById: async () => existingProfile,
    insert: async () => { insertCalls += 1; },
  });

  assert.equal(result.status, "existing");
  assert.equal(result.profile, existingProfile);
  assert.equal(insertCalls, 0);
});

test("a profile-only retry inserts a missing profile once and reuses it afterward", async () => {
  let storedProfile = null;
  let insertCalls = 0;
  const dependencies = {
    findById: async () => storedProfile,
    insert: async (profile) => {
      insertCalls += 1;
      if (storedProfile) {
        const duplicate = new Error("duplicate profile");
        duplicate.code = "23505";
        throw duplicate;
      }
      storedProfile = profile;
    },
  };

  const first = await ensureSignupProfile(account, fields, dependencies);
  const retry = await ensureSignupProfile(account, fields, dependencies);

  assert.equal(first.status, "created");
  assert.equal(retry.status, "existing");
  assert.equal(insertCalls, 1);
  assert.equal(storedProfile.role, "bruker");
});

test("profile-only retry reconciles a timed-out insert without issuing another insert", async () => {
  let storedProfile = null;
  let insertCalls = 0;
  const dependencies = {
    findById: async () => storedProfile,
    insert: async (profile) => {
      insertCalls += 1;
      storedProfile = profile;
      throw new Error("response timed out after server commit");
    },
  };

  await assert.rejects(ensureSignupProfile(account, fields, dependencies), /timed out/);
  const recovered = await ensureSignupProfile(account, fields, dependencies);

  assert.equal(recovered.status, "existing");
  assert.equal(insertCalls, 1);
  assert.equal(recovered.profile.role, "bruker");
});

test("non-duplicate profile errors remain visible for safe recovery", async () => {
  const failure = new Error("permission denied");
  await assert.rejects(
    ensureSignupProfile(account, fields, {
      findById: async () => null,
      insert: async () => { throw failure; },
    }),
    failure,
  );
});