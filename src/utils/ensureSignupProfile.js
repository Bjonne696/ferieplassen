export async function ensureSignupProfile(user, profileFields, { findById, insert }) {
  const existing = await findById(user.id);
  if (existing) return { status: "existing", profile: existing };

  const profile = {
    id: user.id,
    email: user.email ?? profileFields.email,
    name: profileFields.name,
    last_name: profileFields.last_name,
    region: profileFields.region,
    role: "bruker",
  };

  try {
    await insert(profile);
    return { status: "created", profile };
  } catch (error) {
    // Another in-flight request may have created the unique profile row.
    // Do not overwrite it; the caller reloads and verifies it afterward.
    if (error?.code !== "23505") throw error;
    return { status: "createdByAnotherRequest", profile: null };
  }
}