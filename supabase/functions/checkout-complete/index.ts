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
    const { checkoutId, payment_token, payment_provider = 'stripe' } = await req.json();
    
    if (!checkoutId) {
      throw new Error('Checkout ID is required');
    }

    if (!payment_token) {
      throw new Error('Payment token is required');
    }

    console.log('Payment token received:', payment_token);

    const SELLER_BACKEND_URL = Deno.env.get('SELLER_BACKEND_URL');
    const MOCK_STRIPE_SPT_URL = Deno.env.get('MOCK_STRIPE_SPT_URL');
    
    // Remove trailing slash from URLs if present
    const sellerUrl = SELLER_BACKEND_URL?.replace(/\/$/, '');
    const sptUrl = MOCK_STRIPE_SPT_URL?.replace(/\/$/, '');
    
    // Step 1: Get checkout session to get the total amount
    const checkoutResponse = await fetch(`${sellerUrl}/checkout_sessions/${checkoutId}`);
    if (!checkoutResponse.ok) {
      throw new Error('Failed to fetch checkout session');
    }
    const checkout = await checkoutResponse.json();
    
    // Find the total amount
    const totalItem = checkout.totals.find((t: any) => t.type === 'total');
    const totalAmount = totalItem ? totalItem.amount : 0;
    
    console.log('Creating SPT token for amount:', totalAmount);
    console.log('SPT URL:', sptUrl);
    
    // The Mock SPT API expects form-encoded data with square bracket notation
    const sptParams = new URLSearchParams({
      payment_method: payment_token,
      'usage_limits[currency]': checkout.currency,
      'usage_limits[max_amount]': totalAmount.toString(),
      'usage_limits[expires_at]': (Math.floor(Date.now() / 1000) + 3600).toString(),
      'seller_details[network_id]': 'seller_network_123',
      'seller_details[external_id]': 'merchant_001',
    });
    
    console.log('SPT Request params:', sptParams.toString());
    
    // Step 2: Exchange payment method for SPT token
    const sptResponse = await fetch(`${sptUrl}/v1/shared_payment/issued_tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sptParams.toString(),
    });

    if (!sptResponse.ok) {
      let errorText;
      try {
        errorText = await sptResponse.json();
      } catch {
        errorText = await sptResponse.text();
      }
      console.error('SPT token creation failed:', errorText);
      console.error('SPT response status:', sptResponse.status);
      throw new Error('Failed to create SPT token');
    }

    const sptData = await sptResponse.json();
    const sptToken = sptData.id;
    
    console.log('SPT token created:', sptToken);
    
    // Step 3: Complete checkout with SPT token
    const completeResponse = await fetch(`${sellerUrl}/checkout_sessions/${checkoutId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_data: {
          token: sptToken,
          provider: payment_provider,
        },
        buyer: checkout.buyer,
      }),
    });

    if (!completeResponse.ok) {
      const errorText = await completeResponse.text();
      console.error('Checkout completion failed:', errorText);
      throw new Error(`Failed to complete checkout: ${completeResponse.status}`);
    }

    const data = await completeResponse.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error completing checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to complete checkout';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
