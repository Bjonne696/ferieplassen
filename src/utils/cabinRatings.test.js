import test from "node:test";
import assert from "node:assert/strict";
import { enrichCabinRatings, filterHomeCabins, filterRentalCabins, bookingOverlaps } from "./cabinRatings.js";

const cabins = [
  { id: 1, title: "Fjord", location: "Bergen", price_per_night: 1200, facilities: ["WiFi"], is_premium: false },
  { id: 2, title: "Skog", location: "Oslo", price_per_night: 900, facilities: ["Peis"], is_premium: true },
];

test("ratings preserve premium boost, missing reviews and cap", () => {
  const result = enrichCabinRatings(cabins, [
    { cabin_id: 1, rating: 4 }, { cabin_id: 1, rating: 2 },
    { cabin_id: 2, rating: 5 },
  ]);
  assert.deepEqual(result.map((cabin) => cabin.average_score), [3, 5]);
  assert.equal(enrichCabinRatings(cabins, [], "avgRating")[1].avgRating, 1.5);
  assert.equal(enrichCabinRatings(cabins, [], "avgRating")[0].avgRating, 0);
});

test("home matches price; rental matches only title and place, price as a separate filter", () => {
  assert.deepEqual(filterHomeCabins(cabins, "1200").map((cabin) => cabin.id), [1]);
  assert.deepEqual(filterRentalCabins(cabins, {
    searchTerm: "1200", minPrice: "", maxPrice: "", selectedFacilities: [],
  }), []);
  assert.deepEqual(filterRentalCabins(cabins, {
    searchTerm: "", minPrice: "1000", maxPrice: "", selectedFacilities: ["WiFi"],
  }).map((cabin) => cabin.id), [1]);
});

test("availability uses strict overlap rather than inclusive endpoints", () => {
  const booking = { start_date: "2026-03-05", end_date: "2026-03-08" };
  assert.equal(bookingOverlaps(new Date("2026-03-01"), new Date("2026-03-05"), booking), false);
  assert.equal(bookingOverlaps(new Date("2026-03-08"), new Date("2026-03-10"), booking), false);
  assert.equal(bookingOverlaps(new Date("2026-03-07"), new Date("2026-03-09"), booking), true);
});