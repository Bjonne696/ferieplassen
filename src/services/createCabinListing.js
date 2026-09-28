// Keep the creation sequence explicit: no subscription can be started until
// all images have uploaded and the cabin row has been inserted successfully.
export async function createCabinListing({
  files, cabin, isAdmin, selectedPlan, discountCode,
  uploadImages, insertCabin, createSubscription,
}) {
  const image_urls = await uploadImages(files);
  const savedCabin = await insertCabin({ ...cabin, image_urls });
  if (isAdmin) return { kind: "admin" };
  const subscription = await createSubscription(savedCabin.id, selectedPlan, discountCode || null);
  if (subscription?.free) return { kind: "free" };
  if (subscription?.redirectUrl) return { kind: "redirect", url: subscription.redirectUrl };
  return { kind: "unexpected" };
}