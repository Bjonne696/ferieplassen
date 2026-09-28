import supabase from '../lib/supabaseClient';

export async function createSubscription(cabinId, planType = 'basic', discountCode = null) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) throw new Error('Du må være logget inn');

    const body = { cabinId, planType };
    if (discountCode) body.discountCode = discountCode;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-agreement`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Kunne ikke opprette abonnement');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

export async function validateDiscountCode(code) {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('code, duration_months, valid_until, is_active, max_uses')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString().split('T')[0])
      .single();

    if (error || !data) {
      return { valid: false, error: 'Ugyldig eller utløpt rabattkode' };
    }

    if (data.max_uses !== null) {
      const { count } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('discount_code', code.toUpperCase());

      if (count !== null && count >= data.max_uses) {
        return { valid: false, error: 'Rabattkoden er brukt opp' };
      }
    }

    return {
      valid: true,
      discount: {
        code: data.code,
        duration_months: data.duration_months,
        valid_until: data.valid_until,
        is_active: data.is_active,
      },
    };
  } catch (error) {
    console.error('Error validating discount code:', error);
    return { valid: false, error: 'Kunne ikke validere rabattkode' };
  }
}

export async function cancelSubscription(subscriptionId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) throw new Error('Du må være logget inn');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Kunne ikke kansellere abonnement');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

export async function deleteSubscription(cabinId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) throw new Error('Du må være logget inn');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-subscription`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cabinId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Kunne ikke slette abonnement/hytte');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting subscription:', error);
    throw error;
  }
}