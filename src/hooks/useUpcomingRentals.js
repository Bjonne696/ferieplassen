import { useState, useEffect } from 'react';
import supabase from '../lib/supabaseClient';

export function useUpcomingRentals(userId) {
  const [rentalsState, setRentalsState] = useState({ userId, value: [] });
  const [loadingState, setLoadingState] = useState({ userId, value: true });
  const [errorState, setErrorState] = useState({ userId, value: null });
  const rentals = rentalsState.userId === userId ? rentalsState.value : [];
  const loading = loadingState.userId === userId ? loadingState.value : !!userId;
  const error = errorState.userId === userId ? errorState.value : null;

  useEffect(() => {
    let active = true;
    if (!userId) {
      setRentalsState({ userId: null, value: [] });
      setLoadingState({ userId: null, value: false });
      setErrorState({ userId: null, value: null });
      return () => {
        active = false;
      };
    }

    const fetchUpcomingRentals = async () => {
      try {
        setLoadingState({ userId, value: true });
        setErrorState({ userId, value: null });
        const today = new Date().toISOString().split('T')[0];

        const { data, error: fetchError } = await supabase
          .from('booking_requests')
          .select(`
            id,
            start_date,
            end_date,
            created_at,
            cabins (
              id,
              title,
              location,
              image_urls,
              price_per_night,
              owner_id,
              profiles:owner_id (
                id,
                name,
                last_name,
                email
              )
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'approved')
          .gte('start_date', today)
          .order('start_date', { ascending: true });

        if (fetchError) {
          if (active) {
            setErrorState({ userId, value: fetchError });
            setRentalsState({ userId, value: [] });
          }
        } else {
          if (active) setRentalsState({ userId, value: data || [] });
        }
      } catch (err) {
        console.error('Error fetching upcoming rentals:', err);
        if (active) {
          setErrorState({ userId, value: err });
          setRentalsState({ userId, value: [] });
        }
      } finally {
        if (active) setLoadingState({ userId, value: false });
      }
    };

    void fetchUpcomingRentals();
    return () => {
      active = false;
    };
  }, [userId]);

  return { rentals, loading, error };
}
