
import React from "react";
import CabinGrid from "./CabinGrid";

export default function PopularCabinsGrid({ cabins, extraCard, centered = false, className }) {
  return <CabinGrid className={["popular-cabins-grid", className].filter(Boolean).join(" ")} cabins={cabins} extraCard={extraCard} centered={centered} ratingField="avgRating" />;
}
