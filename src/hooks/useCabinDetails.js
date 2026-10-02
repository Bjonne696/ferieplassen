import { useCallback, useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";

export default function useCabinDetails(id, userId) {
  const [cabin, setCabin] = useState(null);
  const [owner, setOwner] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => setRetryKey((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setCabin(null);
    setOwner(null);
    setAverageRating(0);
    setStatus("loading");
    setErrorMessage("");

    const fetchCabin = async () => {
      try {
        if (!id) {
          setStatus("not-found");
          return;
        }

        const { data, error } = await supabase
          .from("cabins")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!active) return;
        if (error) {
          console.error("Cabin fetch error:", error);
          setErrorMessage("Kunne ikke hente ferieboligen. Prøv igjen.");
          setStatus("error");
          return;
        }
        if (!data) {
          setStatus("not-found");
          return;
        }

        if (!data.is_active && data.owner_id !== userId) {
          setStatus("unavailable");
          return;
        }

        const { data: ownerData, error: ownerError } = await supabase
          .from("profiles")
          .select("name, last_name, avatar_url, region")
          .eq("id", data.owner_id)
          .maybeSingle();

        if (!active) return;
        if (ownerError) {
          console.error("Owner fetch error:", ownerError);
          setErrorMessage("Kunne ikke hente informasjon om eieren. Prøv igjen.");
          setStatus("error");
          return;
        }

        setCabin(data);
        setOwner(ownerData || {
          name: "Ukjent",
          last_name: "Eier",
          avatar_url: null,
          region: "Ikke spesifisert",
        });
        setStatus("ready");

        try {
          const { data: reviews, error: reviewsError } = await supabase
            .from("reviews")
            .select("rating")
            .eq("cabin_id", id);

          if (active && !reviewsError && reviews?.length) {
            const avg = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
            setAverageRating(Math.min(avg, 5));
          }
        } catch (reviewsError) {
          console.error("Reviews fetch error:", reviewsError);
        }
      } catch (error) {
        if (!active) return;
        console.error("Cabin details fetch error:", error);
        setErrorMessage("Kunne ikke hente ferieboligen. Prøv igjen.");
        setStatus("error");
      }
    };

    fetchCabin();
    return () => { active = false; };
  }, [id, userId, retryKey]);

  return { cabin, owner, averageRating, status, errorMessage, retry };
}