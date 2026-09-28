import React from "react";
import CabinCard from "./CabinCard";

export default function CabinGrid({ cabins, extraCard, centered = false, ratingField = "average_score", className }) {
  return (
    <div className={["cabin-grid", className].filter(Boolean).join(" ")} data-centered={centered || undefined}>
      {cabins.map((cabin) =>
        <CabinCard key={cabin.id} cabin={cabin} ratingField={ratingField} />)}
      {extraCard}
    </div>
  );
}