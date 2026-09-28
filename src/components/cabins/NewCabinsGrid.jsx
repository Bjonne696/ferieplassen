import React from "react";
import CreateListingCard from "./CreateListingCard";
import CabinGrid from "./CabinGrid";
import useListingCabins from "../../hooks/useListingCabins";
import { useAuth } from "../../contexts/AuthContext";

export default function NewCabinsGrid({ className }) {
  const { user } = useAuth();
  const { cabins } = useListingCabins({ newest: true });
  const extraCard = <CreateListingCard isLoggedIn={!!user} />;
  return (
    <div className={["new-cabins-listings", className].filter(Boolean).join(" ")}>
      {cabins.length === 0 && <p className="no-results new-cabins-listings__empty">Ingen nye feriebolig tilgjengelig for øyeblikket.</p>}
      <CabinGrid cabins={cabins} centered={cabins.length === 0}
        extraCard={cabins.length < 12 ? extraCard : null} />
    </div>
  );
}