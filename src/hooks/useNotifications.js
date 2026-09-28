import { useState, useEffect } from 'react';
import supabase from '../lib/supabaseClient';

export function useNotifications(userId) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      setLoading(false);
      return;
    }

    let subscription;

    const fetchNotificationCount = async () => {
      try {
        const { data: cabins, error: cabinsError } = await supabase
          .from('cabins')
          .select('id')
          .eq('owner_id', userId);

        if (cabinsError || !cabins || cabins.length === 0) {
          setCount(0);
          setLoading(false);
          return;
        }

        const cabinIds = cabins.map(c => c.id);

        const { count: pendingCount, error: bookingsError } = await supabase
          .from('booking_requests')
          .select('id', { count: 'exact', head: true })
          .in('cabin_id', cabinIds)
          .eq('status', 'pending');

        if (bookingsError) {
          console.error('Error fetching notifications:', bookingsError);
          setCount(0);
        } else {
          setCount(pendingCount || 0);
        }
      } catch (error) {
        console.error('Error in useNotifications:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationCount();

    subscription = supabase
      .channel('booking_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_requests'
        },
        () => {
          fetchNotificationCount();
        }
      )
      .subscribe();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [userId]);

  return { count, loading };
}
