export function enrichCabinRatings(cabins, reviews, ratingField = "average_score") {
  const ratings = new Map();
  for (const { cabin_id, rating } of reviews) {
    if (!ratings.has(cabin_id)) ratings.set(cabin_id, []);
    ratings.get(cabin_id).push(rating);
  }
  return cabins.map((cabin) => {
    const scores = ratings.get(cabin.id) || [];
    const average = scores.length
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
    return {
      ...cabin,
      [ratingField]: Math.min(average, 5),
    };
  });
}

export function filterHomeCabins(cabins, term) {
  const query = term.toLowerCase();
  return cabins.filter((cabin) =>
    cabin.title?.toLowerCase().includes(query) ||
    cabin.location?.toLowerCase().includes(query) ||
    cabin.price_per_night?.toString().includes(term)
  );
}

export function filterRentalCabins(cabins, { searchTerm, minPrice, maxPrice, selectedFacilities }) {
  return cabins.filter((cabin) => {
    if (searchTerm && !(
      cabin.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cabin.location?.toLowerCase().includes(searchTerm.toLowerCase())
    )) return false;
    if (minPrice || maxPrice) {
      const price = cabin.price_per_night;
      if (!(price >= (minPrice ? parseFloat(minPrice) : 0) &&
        price <= (maxPrice ? parseFloat(maxPrice) : Infinity))) return false;
    }
    return selectedFacilities.every((facility) => (cabin.facilities || []).includes(facility));
  });
}

export function bookingOverlaps(checkIn, checkOut, booking) {
  return checkIn < new Date(booking.end_date) && checkOut > new Date(booking.start_date);
}