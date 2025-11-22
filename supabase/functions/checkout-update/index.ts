import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Share the same in-memory storage
const checkoutSessions = new Map<string, any>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { checkoutId, ...updateData } = body;
    
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
    
    // Update session with new data
    const updatedSession = {
      ...session,
      ...updateData,
    };
    
    // Recalculate totals if fulfillment option changed
    if (updateData.fulfillment_option_id) {
      const option = updatedSession.fulfillment_options.find(
        (opt: any) => opt.id === updateData.fulfillment_option_id
      );
      
      if (option) {
        const subtotal = updatedSession.totals.find((t: any) => t.type === 'subtotal').amount;
        const shipping = parseInt(option.total);
        const tax = updatedSession.totals.find((t: any) => t.type === 'tax').amount;
        
        updatedSession.totals = [
          { type: 'subtotal', display_text: 'Subtotal', amount: subtotal },
          { type: 'fulfillment', display_text: 'Shipping', amount: shipping },
          { type: 'tax', display_text: 'Tax', amount: tax },
          { type: 'total', display_text: 'Total', amount: subtotal + shipping + tax },
        ];
      }
    }
    
    checkoutSessions.set(checkoutId, updatedSession);
    
    return new Response(JSON.stringify(updatedSession), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating checkout:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update checkout session' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
