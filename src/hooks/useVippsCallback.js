import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabaseClient';
import { createReplaySafeActivation } from '../utils/createReplaySafeActivation';

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export default function useVippsCallback() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { user } = useAuth();
  const [phase, setPhase] = useState('polling');
  const [demoError, setDemoError] = useState(null);
  const pollCount = useRef(0);
  const intervalRef = useRef(null);
  const redirectRef = useRef(null);
  const mountedRef = useRef(false);
  const activationRef = useRef(null);
  if (!activationRef.current) {
    activationRef.current = createReplaySafeActivation(async (key, isActive) => {
      const [userId, subscriptionId, cabinId] = JSON.parse(key);
      let session;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isActive()) return { skipped: true };
        if (error) throw error;
        session = data?.session;
      } catch {
        if (!isActive()) return { skipped: true };
        return { phase: 'demo_error', retryable: true, error: 'Kunne ikke hente innloggingen din. Logg inn og prøv igjen.' };
      }
      if (!session || !userId || session.user?.id !== userId) {
        return { phase: 'demo_error', retryable: true, error: 'Du må være logget inn for å aktivere demo-abonnementet.' };
      }
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/demo-activate-subscription`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ subscriptionId, cabinId }),
          }
        );
        if (!response.ok) {
          let errorMsg = 'Demo-aktivering feilet.';
          if (response.status === 404) {
            errorMsg = 'Demo-backend er ikke aktivert enda. Aktivering av backend-endepunkt gjenstår.';
          } else {
            try {
              const err = await response.json();
              errorMsg = err.error || errorMsg;
            } catch {
              // Keep the default error for a non-JSON response.
            }
          }
          return { phase: 'demo_error', error: errorMsg };
        }
        return { phase: 'demo_success' };
      } catch (err) {
        const error = err?.message?.toLowerCase().includes('fetch') || err?.message?.toLowerCase().includes('network')
          ? 'Demo-backend er ikke aktivert enda. Aktivering av backend-endepunkt gjenstår.'
          : err?.message || 'Noe gikk galt under demo-aktivering.';
        return { phase: 'demo_error', error };
      }
    });
  }

  const params = new URLSearchParams(search);
  const isDemo = params.get('demo') === '1';
  const subscriptionId = params.get('subscriptionId');
  const cabinId = params.get('cabinId');
  const hasError = params.get('error') || params.get('error_description') || params.get('status') === 'error';

  useEffect(() => {
    mountedRef.current = true;
    if (isDemoMode && isDemo) {
      setPhase('demo_activating');
      setDemoError(null);
      const stopObserving = activationRef.current.observe(
        JSON.stringify([user?.id || null, subscriptionId, cabinId]),
        (result) => {
          if (result.error) setDemoError(result.error);
          setPhase(result.phase);
        }
      );
      return () => {
        stopObserving();
        mountedRef.current = false;
        clearInterval(intervalRef.current);
        clearTimeout(redirectRef.current);
      };
    } else if (hasError) {
      setPhase('error');
    } else if (!user?.id) {
      setPhase('timeout');
    } else {
      let active = true;
      pollCount.current = 0;
      const poll = async () => {
        pollCount.current += 1;
        try {
          const { data } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
          if (!active) return;
          if (data && data.length > 0 && data[0].status === 'active') {
            clearInterval(intervalRef.current);
            navigate('/min-profil', { replace: true, state: { vippsCallback: 'success' } });
            return;
          }
        } catch {
          // A transient polling failure is retried on the next tick.
        }
        if (!active) return;
        if (pollCount.current >= 20) {
          clearInterval(intervalRef.current);
          setPhase('timeout');
        }
      };
      intervalRef.current = setInterval(poll, 1000);
      return () => {
        active = false;
        mountedRef.current = false;
        clearInterval(intervalRef.current);
        clearTimeout(redirectRef.current);
      };
    }
    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
      clearTimeout(redirectRef.current);
    };
  }, [user, hasError, navigate, isDemo, subscriptionId, cabinId]);

  useEffect(() => {
    if (phase !== 'demo_success') return;
    redirectRef.current = setTimeout(() => {
      if (mountedRef.current) {
        navigate('/min-profil', { replace: true, state: { vippsCallback: 'success' } });
      }
    }, 2000);
    return () => clearTimeout(redirectRef.current);
  }, [phase, navigate]);

  return { phase, demoError, isDemoBanner: isDemoMode && isDemo, navigate };
}