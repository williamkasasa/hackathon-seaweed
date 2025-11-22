import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Share the same in-memory storage (in production, use a database)
const checkoutSessions = new Map<string, any>();

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

    const session = checkoutSessions.get(checkoutId);
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Checkout session not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(JSON.stringify(session), {
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
