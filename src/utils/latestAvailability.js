// Keep the last completed result on screen while the next availability lookup
// is pending. Before the first lookup completes, show the locally matched cabins.
export function displayedCabins(lastResult, matchingCabins) {
  return lastResult ?? matchingCabins;
}

export function createLatestAvailabilityRequest(fetchAvailability, onResult, onError) {
  let generation = 0;

  return (...args) => {
    const request = ++generation;
    Promise.resolve().then(() => fetchAvailability(...args)).then(
      (result) => {
        if (request === generation) onResult(result);
      },
      (error) => {
        if (request === generation) onError(error);
      },
    );
    // Effect cleanup invalidates responses from unmounted or superseded filters.
    return () => {
      if (request === generation) generation++;
    };
  };
}