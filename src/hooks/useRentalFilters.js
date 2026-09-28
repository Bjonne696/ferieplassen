import { useEffect, useMemo, useState } from "react";
import { filterAvailableCabins } from "../services/listingService";
import { filterRentalCabins } from "../utils/cabinRatings";
import { createLatestAvailabilityRequest, displayedCabins } from "../utils/latestAvailability";

export default function useRentalFilters(allCabins) {
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [availableCabins, setAvailableCabins] = useState(null);
  const requestAvailability = useMemo(() => createLatestAvailabilityRequest(
    filterAvailableCabins,
    setAvailableCabins,
    (error) => console.error("Feil ved filtrering av hytter:", error),
  ), []);

  const matchingCabins = useMemo(() => filterRentalCabins(allCabins, {
    searchTerm, minPrice, maxPrice, selectedFacilities,
  }), [allCabins, searchTerm, minPrice, maxPrice, selectedFacilities]);

  useEffect(() => {
    return requestAvailability(matchingCabins, checkInDate, checkOutDate);
  }, [matchingCabins, checkInDate, checkOutDate, requestAvailability]);

  const filteredCabins = displayedCabins(availableCabins, matchingCabins);

  const filters = { searchTerm, minPrice, maxPrice, selectedFacilities, checkInDate, checkOutDate };
  const change = (setter) => (value) => { setter(value); setCurrentPage(1); };
  const update = {
    setSearchTerm: change(setSearchTerm), setMinPrice: change(setMinPrice),
    setMaxPrice: change(setMaxPrice), setCheckInDate: change(setCheckInDate),
    setCheckOutDate: change(setCheckOutDate),
    toggleFacility: (facility) => {
      setSelectedFacilities((previous) =>
        previous.includes(facility) ? previous.filter((entry) => entry !== facility) : [...previous, facility]);
      setCurrentPage(1);
    },
    clear: () => {
      setSearchTerm(""); setMinPrice(""); setMaxPrice("");
      setSelectedFacilities([]); setCheckInDate(""); setCheckOutDate("");
      setCurrentPage(1);
    },
  };
  return { filters, update, matchingCabins, filteredCabins, currentPage, setCurrentPage };
}