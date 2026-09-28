import React, { useId } from "react";
import CreateListingCard from "./CreateListingCard";
import CabinGrid from "./CabinGrid";
import Pagination from "../ui/Pagination";
import HelpText from "../ui/HelpText";
import Tooltip from "../ui/Tooltip";
import useListingCabins from "../../hooks/useListingCabins";
import useRentalFilters from "../../hooks/useRentalFilters";
import { facilityOptions } from "../../utils/facilityOptions";
import { useAuth } from "../../contexts/AuthContext";


export default function RentalListings() {
  const id = useId();
  const { user } = useAuth();
  const { cabins, isLoading, error } = useListingCabins();
  const { filters, update, filteredCabins, currentPage, setCurrentPage } = useRentalFilters(cabins);
  const { searchTerm, minPrice, maxPrice, selectedFacilities, checkInDate, checkOutDate } = filters;
  const hasFilters = searchTerm || minPrice || maxPrice || selectedFacilities.length > 0 || checkInDate || checkOutDate;
  const dateText = checkInDate && checkOutDate
    ? ` for ${new Date(checkInDate).toLocaleDateString("no-NO")} - ${new Date(checkOutDate).toLocaleDateString("no-NO")}` : "";
  const title = searchTerm ? `Søkeresultater for "${searchTerm}"${dateText} (${filteredCabins.length})`
    : hasFilters ? `Filtrerte feriebolig${dateText} (${filteredCabins.length})`
    : `Alle annonser (${filteredCabins.length})`;
  const currentCabins = filteredCabins.slice((currentPage - 1) * 11, currentPage * 11);
  const today = new Date().toISOString().split("T")[0];
  const minCheckOutDate = checkInDate
    ? new Date(new Date(checkInDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0] : today;
  const extraCard = <CreateListingCard isLoggedIn={!!user} />;
  return (
    <>
      <HelpText icon="🔍" id="til-leie">
        <strong>Finn din perfekte feriebolig!</strong><br />
        Bruk søkefeltet for å finne feriebolig etter sted. Kombiner med filtre for å snevre inn søket ditt.
      </HelpText>
      <div className="rental-listings__search">
        <label className="rental-listings__filter-label rental-listings__search-label" htmlFor={`${id}-search`}>Søk etter feriebolig</label>
        <input className="form-input page-search__input rental-listings__search-input" id={`${id}-search`} type="text" placeholder="Søk etter feriebolig (tittel eller område)..."
          value={searchTerm} onChange={(event) => update.setSearchTerm(event.target.value)} />
        <div className="rental-listings__filters">
          <div className="rental-listings__filter-group rental-listings__price-filter" role="group" aria-labelledby={`${id}-price-heading`}>
            <Tooltip id={`${id}-price-help`} text="Filtrer feriebolig basert på pris per natt. La felt stå tomme for å se alle priser.">
              <span className="rental-listings__filter-heading" id={`${id}-price-heading`}>Prisområde (per natt)</span>
            </Tooltip>
            <div className="rental-listings__price-range">
              <label className="rental-listings__price-field" htmlFor={`${id}-min-price`}>Fra
                <input className="form-input rental-listings__price-input" id={`${id}-min-price`} type="number" aria-describedby={`${id}-price-help`}
                  placeholder="Fra" value={minPrice}
                  onChange={(event) => update.setMinPrice(event.target.value)} />
              </label>
              <span className="rental-listings__price-separator">-</span>
              <label className="rental-listings__price-field" htmlFor={`${id}-max-price`}>Til
                <input className="form-input rental-listings__price-input" id={`${id}-max-price`} type="number" aria-describedby={`${id}-price-help`}
                  placeholder="Til" value={maxPrice}
                  onChange={(event) => update.setMaxPrice(event.target.value)} />
              </label>
              <span className="rental-listings__currency">kr</span>
            </div>
          </div>
          <div className="rental-listings__filter-group rental-listings__date-filter" role="group" aria-labelledby={`${id}-dates-heading`}>
            <Tooltip id={`${id}-dates-help`} text="Velg datoer for å se kun ledige feriebolig. Systemet sjekker automatisk om ferieboligene er tilgjengelige.">
              <span className="rental-listings__filter-heading" id={`${id}-dates-heading`}>Oppholdsperiode</span>
            </Tooltip>
            <div className="rental-listings__date-range">
              <label className="rental-listings__date-field" htmlFor={`${id}-check-in`}>Innsjekk
                <input className="form-input rental-listings__date-input" id={`${id}-check-in`} type="date" value={checkInDate} min={today}
                  aria-describedby={`${id}-dates-help`}
                  onChange={(event) => update.setCheckInDate(event.target.value)} />
              </label>
              <span className="rental-listings__date-separator">til</span>
              <label className="rental-listings__date-field" htmlFor={`${id}-check-out`}>Utsjekk
                <input className="form-input rental-listings__date-input" id={`${id}-check-out`} type="date" value={checkOutDate} min={minCheckOutDate}
                  aria-describedby={`${id}-dates-help`}
                  onChange={(event) => update.setCheckOutDate(event.target.value)} />
              </label>
            </div>
          </div>
          <div className="rental-listings__filter-group rental-listings__facility-filter" role="group" aria-labelledby={`${id}-facilities-heading`}>
            <Tooltip id={`${id}-facilities-help`} text="Velg fasiliteter som er viktige for deg. Kun feriebolig med disse fasilitetene vil vises.">
              <span className="rental-listings__filter-heading" id={`${id}-facilities-heading`}>Fasiliteter</span>
            </Tooltip>
            <div className="rental-listings__facilities rental-listings__facility-options">
              {facilityOptions.map((facility) =>
                <label className="rental-listings__facility-checkbox rental-listings__facility-option" data-checked={selectedFacilities.includes(facility)} key={facility}>
                  <input className="rental-listings__facility-checkbox" type="checkbox" checked={selectedFacilities.includes(facility)}
                    aria-describedby={`${id}-facilities-help`}
                    onChange={() => update.toggleFacility(facility)} />
                  {facility}
                </label>)}
            </div>
          </div>
          <button className="button-base rental-listings__clear-filters-button" type="button" onClick={update.clear}>Tøm alle filtre</button>
        </div>
      </div>
      <section className="rental-listings rental-listings__results">
        <h2 className="section-title rental-listings__title">{title}</h2>
        {error ? <div className="error-message rental-listings__error">Kunne ikke laste hytter. Prøv igjen senere.</div>
          : isLoading ? <div className="loading-spinner rental-listings__loading">Laster feriebolig...</div>
          : currentCabins.length === 0 ? <>
              <p className="no-results rental-listings__empty">{hasFilters
                ? checkInDate && checkOutDate
                  ? "Ingen feriebolig er tilgjengelig for de valgte datoene og filtrene."
                  : "Ingen feriebolig matcher dine filtre."
                : "Ingen feriebolig tilgjengelig for øyeblikket."}</p>
              <CabinGrid cabins={[]} centered extraCard={extraCard} />
            </>
          : <>
              <CabinGrid cabins={currentCabins} extraCard={extraCard} />
              <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredCabins.length / 11)}
                onPageChange={setCurrentPage} />
            </>}
      </section>
    </>
  );
}