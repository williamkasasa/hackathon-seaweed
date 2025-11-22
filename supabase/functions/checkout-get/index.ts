import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const checkoutId = url.searchParams.get('id');
    
    if (!checkoutId) {
      throw new Error('Checkout ID is required');
    }

    const SELLER_BACKEND_URL = Deno.env.get('SELLER_BACKEND_URL');
    const response = await fetch(`${SELLER_BACKEND_URL}/checkout_sessions/${checkoutId}`);
    
    if (!response.ok) {
      throw new Error(`Seller backend error: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching checkout:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch checkout session' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
