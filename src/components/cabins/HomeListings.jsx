import React, { useState } from "react";
import CreateListingCard from "./CreateListingCard";
import CabinGrid from "./CabinGrid";
import Pagination from "../ui/Pagination";
import useListingCabins from "../../hooks/useListingCabins";
import { useAuth } from "../../contexts/AuthContext";
import { filterHomeCabins } from "../../utils/cabinRatings";
export default function HomeListings() {
  const { user } = useAuth();
  const { cabins } = useListingCabins();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const filtered = filterHomeCabins(cabins, searchTerm);
  const currentCabins = filtered.slice((currentPage - 1) * 11, currentPage * 11);
  const extraCard = <CreateListingCard isLoggedIn={!!user} />;

  return (
    <>
      <div className="search-bar home-listings__search">
        <input className="form-input search-bar__input home-listings__search-input" type="text" placeholder="Søk etter feriebolig (tittel, område eller pris)..."
          value={searchTerm} onChange={(event) => {
            setSearchTerm(event.target.value);
            setCurrentPage(1);
          }} />
      </div>
      <section className="home-listings home-listings__results">
        <h2 className="home-listings__section-title">{searchTerm
          ? `Søkeresultater for "${searchTerm}" (${filtered.length})`
        : `Alle annonser (${filtered.length})`}</h2>
        {currentCabins.length === 0
          ? <>
              <p className="home-listings__empty-state">{searchTerm ? "Ingen feriebolig matcher søket ditt." : "Ingen feriebolig tilgjengelig for øyeblikket."}</p>
              <CabinGrid cabins={[]} centered extraCard={extraCard} />
            </>
          : <>
              <CabinGrid cabins={currentCabins} extraCard={extraCard} />
              <Pagination home currentPage={currentPage} totalPages={Math.ceil(filtered.length / 11)} onPageChange={setCurrentPage} />
            </>}
      </section>
    </>
  );
}