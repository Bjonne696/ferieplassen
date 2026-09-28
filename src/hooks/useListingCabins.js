import { useEffect, useState } from "react";
import { getRatedCabins } from "../services/listingService";

export default function useListingCabins(options = {}) {
  const { newest = false, premium = false, popular = false } = options;
  const [cabins, setCabins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getRatedCabins({ newest, premium, popular }).then((result) => {
      if (active) setCabins(result);
    }).catch((cause) => {
      if (!active) return;
      if (!popular) console.error(newest ? "Feil ved henting av nye hytter:" : "Feil ved henting av hytter:", cause?.message);
      setError(cause);
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [newest, premium, popular]);
  return { cabins, isLoading, error };
}