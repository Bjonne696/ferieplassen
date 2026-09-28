import React, { useState } from "react";
import HelpText from "../ui/HelpText";
import Pagination from "../ui/Pagination";
import CreateListingCard from "./CreateListingCard";
import PopularCabinsGrid from "./PopularCabinsGrid";
import useListingCabins from "../../hooks/useListingCabins";
import { useAuth } from "../../contexts/AuthContext";

export default function PopularListings() {
  const { user } = useAuth();
  const { cabins, isLoading, error } = useListingCabins({ popular: true });
  const [currentPage, setCurrentPage] = useState(1);
  const currentCabins = cabins.slice((currentPage - 1) * 12, currentPage * 12);
  const extraCard = <CreateListingCard isLoggedIn={!!user} />;
  return (
    <>
      <HelpText icon="⭐" id="popular">
        <strong>Finn de beste ferieboligene!</strong><br />
        Her vises kun feriebolig med høy vurdering (3.5+ stjerner).
      </HelpText>
      <h2 className="section-title popular-listings__title">{`Populære annonser (${cabins.length})`}</h2>
      {error ? <div className="error-message popular-listings__error">Kunne ikke laste feriebolig. Prøv igjen senere.</div>
        : isLoading ? <div className="loading-spinner popular-listings__loading">Laster feriebolig...</div>
        : currentCabins.length === 0 ? <>
            <p className="no-results popular-listings__empty">Ingen populære feriebolig tilgjengelig for øyeblikket.</p>
            <PopularCabinsGrid cabins={[]} centered extraCard={extraCard} />
          </>
        : <>
            <PopularCabinsGrid cabins={currentCabins} extraCard={currentCabins.length < 12 ? extraCard : null} />
            <Pagination currentPage={currentPage} totalPages={Math.ceil(cabins.length / 12)} onPageChange={setCurrentPage} />
          </>}
    </>
  );
}